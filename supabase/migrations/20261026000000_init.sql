-- =====================================================================
-- Reutilizalo — esquema inicial
-- Tablas, enums, RLS, triggers y funciones del MVP.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
create type public.plan_type as enum ('free', 'pro');
create type public.item_category as enum ('ropa', 'hogar', 'ninos', 'libros', 'deporte', 'tecnologia', 'otros');
create type public.item_condition as enum ('nuevo_con_etiqueta', 'como_nuevo', 'muy_buen_estado', 'buen_estado', 'con_detalles');
create type public.item_status as enum ('active', 'sold', 'hidden', 'removed_by_admin');
create type public.photo_kind as enum ('main', 'angle', 'label', 'defect');
create type public.review_received as enum ('yes', 'not_yet', 'no');
create type public.report_reason as enum ('not_received', 'fake_photos', 'not_as_described', 'prohibited_item', 'other');
create type public.report_status as enum ('open', 'confirmed', 'dismissed');
create type public.item_event_type as enum ('view', 'want_click');

-- ---------------------------------------------------------------------
-- Nicks
-- ---------------------------------------------------------------------
create table public.reserved_nicks (
  nick text primary key
);

insert into public.reserved_nicks (nick) values
  ('admin'), ('api'), ('app'), ('crear'), ('login'), ('logout'), ('registro'),
  ('panel'), ('explorar'), ('calificar'), ('ayuda'), ('soporte'), ('terminos'),
  ('privacidad'), ('planes'), ('pro'), ('blog'), ('tienda'), ('tiendas'),
  ('reutilizalo'), ('www'), ('static'), ('_next'), ('auth'), ('cuenta'),
  ('contacto'), ('favicon.ico'), ('robots.txt'), ('sitemap.xml');

alter table public.reserved_nicks enable row level security;
-- Sin políticas: solo se consulta desde funciones security definer.

-- 3 a 20 caracteres: minúsculas, números y guiones; sin guion al inicio o al final.
create function public.is_valid_nick_format(p_nick text)
returns boolean
language sql
immutable
as $$
  select p_nick ~ '^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$';
$$;

-- ---------------------------------------------------------------------
-- Perfiles
-- ---------------------------------------------------------------------
-- Datos públicos de la tienda.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nick text not null unique check (public.is_valid_nick_format(nick)),
  store_name text not null check (char_length(store_name) between 1 and 60),
  bio text check (char_length(bio) <= 200),
  avatar_url text,
  payment_link text check (payment_link ~ '^https://'),
  city text not null default 'Montevideo',
  zone text,
  plan public.plan_type not null default 'free',
  plan_expires_at timestamptz,
  accent_color text check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  show_explore_link boolean not null default true,
  created_at timestamptz not null default now()
);

-- Datos privados: solo el dueño (y el admin) los ven.
-- El WhatsApp se entrega al comprador solo a través de register_want_click().
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  whatsapp text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  is_admin boolean not null default false
);

-- ---------------------------------------------------------------------
-- Artículos
-- ---------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) <= 600),
  price_uyu integer not null check (price_uyu >= 0 and price_uyu <= 100000000),
  category public.item_category not null,
  condition public.item_condition not null,
  defects text check (char_length(defects) <= 600),
  honesty_confirmed boolean not null check (honesty_confirmed),
  status public.item_status not null default 'active',
  featured_until timestamptz, -- Fase 3
  created_at timestamptz not null default now(),
  sold_at timestamptz
);

create index items_seller_status_idx on public.items (seller_id, status);
create index items_status_created_idx on public.items (status, created_at desc);

create table public.item_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  url text not null,
  kind public.photo_kind not null,
  position smallint not null check (position between 0 and 3),
  unique (item_id, kind),
  unique (item_id, position)
);

create index item_photos_item_idx on public.item_photos (item_id);

-- ---------------------------------------------------------------------
-- Ventas, reseñas y reportes
-- ---------------------------------------------------------------------
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_name text check (char_length(buyer_name) <= 80),
  buyer_contact text check (char_length(buyer_contact) <= 80),
  -- 64 caracteres hex a partir de dos UUID v4 (generados con el RNG seguro de Postgres).
  rating_token text not null unique
    default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  token_expires_at timestamptz not null default now() + interval '30 days',
  token_used_at timestamptz,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index sales_seller_idx on public.sales (seller_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null unique references public.sales (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  received public.review_received not null,
  q_photos smallint check (q_photos between 1 and 9),
  q_description smallint check (q_description between 1 and 9),
  q_timing smallint check (q_timing between 1 and 9),
  q_communication smallint check (q_communication between 1 and 9),
  q_overall smallint check (q_overall between 1 and 9),
  score numeric(3, 1),
  comment text check (char_length(comment) <= 500),
  seller_reply text check (char_length(seller_reply) <= 300),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  -- Si recibió el producto, las 5 respuestas son obligatorias; si no, ninguna.
  check (
    (received = 'yes' and q_photos is not null and q_description is not null
      and q_timing is not null and q_communication is not null and q_overall is not null
      and score is not null)
    or
    (received <> 'yes' and q_photos is null and q_description is null
      and q_timing is null and q_communication is null and q_overall is null
      and score is null)
  )
);

create index reviews_seller_idx on public.reviews (seller_id) where not is_hidden;

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid references public.sales (id) on delete set null,
  item_id uuid references public.items (id) on delete set null,
  reporter_contact text check (char_length(reporter_contact) <= 80),
  reason public.report_reason not null,
  details text check (char_length(details) <= 1000),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (sale_id is not null or item_id is not null)
);

create index reports_status_idx on public.reports (status, created_at desc);

-- Estadísticas (Pro)
create table public.item_events (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.items (id) on delete cascade,
  type public.item_event_type not null,
  created_at timestamptz not null default now()
);

create index item_events_item_idx on public.item_events (item_id, created_at desc);

-- =====================================================================
-- Funciones de apoyo
-- =====================================================================

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select is_admin from public.profile_private where id = (select auth.uid())),
    false
  );
$$;

-- Plan vigente: un Pro vencido cuenta como Gratis.
create function public.effective_plan(p_seller_id uuid)
returns public.plan_type
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.plan = 'pro' and (p.plan_expires_at is null or p.plan_expires_at > now())
      then 'pro'::public.plan_type
    else 'free'::public.plan_type
  end
  from public.profiles p
  where p.id = p_seller_id;
$$;

create function public.plan_item_limit(p_seller_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case public.effective_plan(p_seller_id) when 'pro' then 50 else 5 end;
$$;

-- Disponibilidad de nick (se llama en vivo desde /crear).
create function public.nick_available(p_nick text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_valid_nick_format(p_nick)
    and not exists (select 1 from public.reserved_nicks where nick = p_nick)
    and not exists (select 1 from public.profiles where nick = p_nick);
$$;

-- =====================================================================
-- Triggers
-- =====================================================================

-- Al registrarse, crear perfil y datos privados a partir de los metadatos
-- enviados en signUp: nick, store_name, whatsapp.
-- Si faltan (por ejemplo, un futuro login con Google), no crea nada y la app
-- completa el perfil después.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nick text := lower(trim(new.raw_user_meta_data ->> 'nick'));
  v_store_name text := trim(new.raw_user_meta_data ->> 'store_name');
  v_whatsapp text := trim(new.raw_user_meta_data ->> 'whatsapp');
begin
  if v_nick is null or v_store_name is null or v_whatsapp is null then
    return new;
  end if;

  if exists (select 1 from public.reserved_nicks where nick = v_nick) then
    raise exception 'nick_reserved' using errcode = 'P0001';
  end if;

  insert into public.profiles (id, nick, store_name)
  values (new.id, v_nick, v_store_name);

  insert into public.profile_private (id, whatsapp)
  values (new.id, v_whatsapp);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reglas de artículos:
--  * Límite de artículos activos según el plan (5 / 50), validado aquí para
--    que no se pueda saltear llamando a la API.
--  * Solo el admin puede poner o sacar el estado removed_by_admin.
--  * sold_at se completa solo.
create function public.items_enforce_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active integer;
  v_limit integer;
begin
  if not public.is_admin() then
    if new.status = 'removed_by_admin'
       and (tg_op = 'INSERT' or old.status <> 'removed_by_admin') then
      raise exception 'only_admin_can_remove' using errcode = 'P0001';
    end if;
    if tg_op = 'UPDATE' and old.status = 'removed_by_admin'
       and new.status <> 'removed_by_admin' then
      raise exception 'item_removed_by_admin' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'active' and (tg_op = 'INSERT' or old.status <> 'active') then
    -- Serializa las altas del mismo vendedor para que el conteo sea confiable.
    perform pg_advisory_xact_lock(hashtextextended(new.seller_id::text, 0));

    select count(*) into v_active
    from public.items
    where seller_id = new.seller_id
      and status = 'active'
      and id <> new.id;

    v_limit := public.plan_item_limit(new.seller_id);

    if v_active >= v_limit then
      raise exception 'plan_limit_reached' using errcode = 'P0001',
        detail = format('limit=%s', v_limit);
    end if;
  end if;

  if new.status = 'sold' and (tg_op = 'INSERT' or old.status <> 'sold') then
    new.sold_at := now();
  elsif new.status <> 'sold' then
    new.sold_at := null;
  end if;

  return new;
end;
$$;

create trigger items_enforce_rules
  before insert or update on public.items
  for each row execute function public.items_enforce_rules();

-- Máximo 4 fotos por artículo (además de unique por kind/position).
create function public.item_photos_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.item_photos where item_id = new.item_id) >= 4 then
    raise exception 'photo_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger item_photos_limit
  before insert on public.item_photos
  for each row execute function public.item_photos_limit();

-- El vendedor responde una sola vez a cada reseña.
create function public.reviews_single_reply()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.seller_reply is not null and new.seller_reply is distinct from old.seller_reply
     and not public.is_admin() then
    raise exception 'reply_already_sent' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger reviews_single_reply
  before update on public.reviews
  for each row execute function public.reviews_single_reply();

-- =====================================================================
-- Funciones públicas (RPC)
-- =====================================================================

-- "Lo quiero": registra el evento y devuelve el WhatsApp del vendedor.
-- Así el número no queda expuesto en el HTML de la tienda.
create function public.register_want_click(p_item_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_whatsapp text;
begin
  select pp.whatsapp into v_whatsapp
  from public.items i
  join public.profile_private pp on pp.id = i.seller_id
  where i.id = p_item_id and i.status = 'active';

  if v_whatsapp is null then
    return null;
  end if;

  insert into public.item_events (item_id, type) values (p_item_id, 'want_click');
  return v_whatsapp;
end;
$$;

create function public.register_item_view(p_item_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.item_events (item_id, type)
  select id, 'view' from public.items
  where id = p_item_id and status in ('active', 'sold');
$$;

-- Crea la reseña de una venta a partir del token (único camino para crear reseñas).
create function public.submit_review(
  p_token text,
  p_q_photos smallint,
  p_q_description smallint,
  p_q_timing smallint,
  p_q_communication smallint,
  p_q_overall smallint,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale public.sales;
  v_review_id uuid;
begin
  select * into v_sale
  from public.sales
  where rating_token = p_token
  for update;

  if not found then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;
  if v_sale.token_used_at is not null then
    raise exception 'token_used' using errcode = 'P0001';
  end if;
  if v_sale.token_expires_at <= now() then
    raise exception 'token_expired' using errcode = 'P0001';
  end if;
  if (select auth.uid()) = v_sale.seller_id then
    raise exception 'cannot_review_self' using errcode = 'P0001';
  end if;

  insert into public.reviews (
    sale_id, seller_id, received,
    q_photos, q_description, q_timing, q_communication, q_overall,
    score, comment
  ) values (
    v_sale.id, v_sale.seller_id, 'yes',
    p_q_photos, p_q_description, p_q_timing, p_q_communication, p_q_overall,
    round((p_q_photos + p_q_description + p_q_timing + p_q_communication + p_q_overall) / 5.0, 1),
    nullif(trim(p_comment), '')
  )
  returning id into v_review_id;

  update public.sales set token_used_at = now() where id = v_sale.id;

  return v_review_id;
end;
$$;

-- Reputación de un vendedor. Un reporte not_received confirmado por el admin
-- cuenta como una reseña con 1 en todas las preguntas.
create function public.seller_reputation(p_seller_id uuid)
returns table (
  review_count integer,
  avg_score numeric,
  avg_photos numeric,
  avg_description numeric,
  avg_timing numeric,
  avg_communication numeric,
  avg_overall numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  with r as (
    select score, q_photos, q_description, q_timing, q_communication, q_overall
    from public.reviews
    where seller_id = p_seller_id and not is_hidden and received = 'yes'
    union all
    select 1.0, 1, 1, 1, 1, 1
    from public.reports rp
    join public.sales s on s.id = rp.sale_id
    where s.seller_id = p_seller_id
      and rp.reason = 'not_received'
      and rp.status = 'confirmed'
  )
  select
    count(*)::integer,
    round(avg(score), 1),
    round(avg(q_photos), 1),
    round(avg(q_description), 1),
    round(avg(q_timing), 1),
    round(avg(q_communication), 1),
    round(avg(q_overall), 1)
  from r;
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.items enable row level security;
alter table public.item_photos enable row level security;
alter table public.sales enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.item_events enable row level security;

-- profiles -------------------------------------------------------------
create policy "profiles: lectura pública"
  on public.profiles for select
  using (true);

create policy "profiles: el dueño edita"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Columnas que el vendedor puede cambiar (plan, nick y fechas quedan fuera).
revoke update on public.profiles from anon, authenticated;
grant update (store_name, bio, avatar_url, payment_link, city, zone, accent_color, show_explore_link)
  on public.profiles to authenticated;
revoke insert, delete on public.profiles from anon, authenticated;

-- profile_private ------------------------------------------------------
create policy "profile_private: el dueño lee"
  on public.profile_private for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "profile_private: el dueño edita"
  on public.profile_private for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profile_private from anon;
revoke insert, update, delete on public.profile_private from authenticated;
grant update (whatsapp) on public.profile_private to authenticated;

-- items ----------------------------------------------------------------
-- Público: activos, y vendidos durante 14 días.
create policy "items: lectura pública"
  on public.items for select
  using (
    status = 'active'
    or (status = 'sold' and sold_at > now() - interval '14 days')
    or seller_id = (select auth.uid())
    or public.is_admin()
  );

create policy "items: el dueño crea"
  on public.items for insert to authenticated
  with check (seller_id = (select auth.uid()));

create policy "items: el dueño o el admin edita"
  on public.items for update to authenticated
  using (seller_id = (select auth.uid()) or public.is_admin())
  with check (seller_id = (select auth.uid()) or public.is_admin());

create policy "items: el dueño borra"
  on public.items for delete to authenticated
  using (seller_id = (select auth.uid()));

revoke insert, update, delete on public.items from anon;
revoke update on public.items from authenticated;
grant update (title, description, price_uyu, category, condition, defects, honesty_confirmed, status)
  on public.items to authenticated;

-- item_photos ----------------------------------------------------------
create policy "item_photos: lectura si el artículo es visible"
  on public.item_photos for select
  using (exists (select 1 from public.items i where i.id = item_id));

create policy "item_photos: el dueño administra"
  on public.item_photos for all to authenticated
  using (exists (
    select 1 from public.items i
    where i.id = item_id and i.seller_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.items i
    where i.id = item_id and i.seller_id = (select auth.uid())
  ));

revoke insert, update, delete on public.item_photos from anon;

-- sales ----------------------------------------------------------------
create policy "sales: el dueño lee"
  on public.sales for select to authenticated
  using (seller_id = (select auth.uid()) or public.is_admin());

create policy "sales: el dueño crea para su artículo"
  on public.sales for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and exists (
      select 1 from public.items i
      where i.id = item_id and i.seller_id = (select auth.uid())
    )
  );

revoke all on public.sales from anon;
revoke update, delete on public.sales from authenticated;
-- El vendedor no elige el token ni las fechas.
revoke insert on public.sales from authenticated;
grant insert (item_id, seller_id, buyer_name, buyer_contact) on public.sales to authenticated;

-- reviews --------------------------------------------------------------
create policy "reviews: lectura pública de las visibles"
  on public.reviews for select
  using (not is_hidden or seller_id = (select auth.uid()) or public.is_admin());

create policy "reviews: el vendedor responde"
  on public.reviews for update to authenticated
  using (seller_id = (select auth.uid()))
  with check (seller_id = (select auth.uid()));

-- Sin política de insert: las reseñas se crean solo con submit_review().
revoke insert, update, delete on public.reviews from anon, authenticated;
grant update (seller_reply) on public.reviews to authenticated;

-- reports --------------------------------------------------------------
create policy "reports: cualquiera reporta"
  on public.reports for insert
  with check (status = 'open' and resolved_at is null);

create policy "reports: el admin lee"
  on public.reports for select to authenticated
  using (public.is_admin());

create policy "reports: el admin resuelve"
  on public.reports for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke update, delete on public.reports from anon;
revoke delete on public.reports from authenticated;

-- item_events ----------------------------------------------------------
create policy "item_events: el dueño lee"
  on public.item_events for select to authenticated
  using (exists (
    select 1 from public.items i
    where i.id = item_id and i.seller_id = (select auth.uid())
  ));

-- Solo se insertan con register_want_click() / register_item_view().
revoke insert, update, delete on public.item_events from anon, authenticated;

-- Funciones: ejecución pública solo donde corresponde.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.items_enforce_rules() from public, anon, authenticated;
grant execute on function public.nick_available(text) to anon, authenticated;
grant execute on function public.register_want_click(uuid) to anon, authenticated;
grant execute on function public.register_item_view(uuid) to anon, authenticated;
grant execute on function public.submit_review(text, smallint, smallint, smallint, smallint, smallint, text) to anon, authenticated;
grant execute on function public.seller_reputation(uuid) to anon, authenticated;

-- =====================================================================
-- Storage: fotos de artículos y avatares
-- Las rutas son <user_id>/<archivo>; cada vendedor escribe solo su carpeta.
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('item-photos', 'item-photos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png']),
  ('avatars', 'avatars', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "storage: el dueño sube a su carpeta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('item-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage: el dueño edita su carpeta"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('item-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "storage: el dueño borra su carpeta"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('item-photos', 'avatars')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
