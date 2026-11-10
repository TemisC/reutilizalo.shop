-- =====================================================================
-- Invitaciones (referidos)
--  * Cada tienda comparte reutilizalo.shop/crear?ref=<nick>.
--  * Quien invita gana +1 artículo gratis por cada tienda invitada que
--    publica su primer artículo, hasta 5 (o sea, hasta 10 en total).
--  * La tienda invitada también gana +1 cuando publica su primer artículo.
--  * El tope del plan gratis es 10 en total; el Pro sigue en 50.
-- Todo se calcula acá, así no se puede trucar desde el navegador.
-- =====================================================================

-- Datos privados (no en profiles, que es de lectura pública): quién invitó a
-- quién solo lo ven el dueño y el admin.
alter table public.profile_private
  add column referred_by uuid references public.profiles (id) on delete set null,
  -- Primera vez que publicó algo. No se borra aunque después borre el artículo,
  -- así el premio no se pierde ni se puede ganar dos veces.
  add column first_item_at timestamptz;

create index profile_private_referred_by_idx on public.profile_private (referred_by);

-- Las tiendas que ya tenían artículos cuentan como activadas.
update public.profile_private pp
set first_item_at = first.created_at
from (select seller_id, min(created_at) as created_at from public.items group by seller_id) first
where first.seller_id = pp.id;

-- Regla ajustable: con true (la regla acordada), una invitación cuenta recién
-- cuando la tienda invitada publica su primer artículo. Para aflojarla y que
-- cuente apenas se crea la tienda, cambiar `true` por `false` y ejecutar.
create function public.referral_requires_first_item()
returns boolean
language sql
immutable
as $$
  select true;
$$;

-- Invitaciones que ya le suman lugares a una tienda (sin tope). No cuentan las
-- tiendas invitadas con el mismo WhatsApp que quien invita.
create function public.referral_activated_count(p_seller_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.profile_private invited
  join public.profile_private referrer on referrer.id = invited.referred_by
  where invited.referred_by = p_seller_id
    and invited.id <> p_seller_id
    and invited.whatsapp <> referrer.whatsapp
    and (invited.first_item_at is not null or not public.referral_requires_first_item());
$$;

create or replace function public.plan_item_limit(p_seller_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case public.effective_plan(p_seller_id)
    when 'pro' then 50
    else least(
      10,
      5
        + least(5, public.referral_activated_count(p_seller_id))
        + (
          select case when pp.referred_by is not null and pp.first_item_at is not null then 1 else 0 end
          from public.profile_private pp
          where pp.id = p_seller_id
        )
    )
  end;
$$;

-- Al registrarse, además de crear el perfil, se anota quién lo invitó
-- (metadato `ref` con el nick de esa tienda). Un nick inexistente se ignora.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nick text := lower(trim(new.raw_user_meta_data ->> 'nick'));
  v_store_name text := trim(new.raw_user_meta_data ->> 'store_name');
  v_whatsapp text := trim(new.raw_user_meta_data ->> 'whatsapp');
  v_ref text := lower(trim(new.raw_user_meta_data ->> 'ref'));
  v_referred_by uuid;
begin
  if v_nick is null or v_store_name is null or v_whatsapp is null then
    return new;
  end if;

  if exists (select 1 from public.reserved_nicks where nick = v_nick) then
    raise exception 'nick_reserved' using errcode = 'P0001';
  end if;

  if v_ref is not null and v_ref <> v_nick then
    select id into v_referred_by from public.profiles where nick = v_ref;
  end if;

  insert into public.profiles (id, nick, store_name)
  values (new.id, v_nick, v_store_name);

  insert into public.profile_private (id, whatsapp, referred_by)
  values (new.id, v_whatsapp, v_referred_by);

  return new;
end;
$$;

-- Marca la primera publicación de cada tienda.
create function public.items_mark_first_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profile_private
  set first_item_at = now()
  where id = new.seller_id and first_item_at is null;
  return new;
end;
$$;

create trigger items_mark_first_item
  after insert on public.items
  for each row execute function public.items_mark_first_item();

-- Lo que ve cada vendedor en su panel: su límite y cómo van sus invitaciones.
create function public.my_referral_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'item_limit', public.plan_item_limit(me.id),
    'invited', (select count(*) from public.profile_private where referred_by = me.id),
    'activated', public.referral_activated_count(me.id),
    'referred_by_nick', (select nick from public.profiles where id = me.referred_by),
    'has_first_item', me.first_item_at is not null
  )
  from public.profile_private me
  where me.id = (select auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Administración: ¿los referidos traen vendedores de verdad?
-- Una tienda "vacía" nunca publicó nada y tiene más de 7 días; las de menos
-- de 7 días sin publicar cuentan como "recientes" (todavía pueden hacerlo).
-- ---------------------------------------------------------------------

-- "Juan.Perez+2@Gmail.com" → "juanperez@gmail.com": sirve para detectar
-- emails casi iguales creados por la misma persona.
create function public.email_fingerprint(p_email text)
returns text
language sql
immutable
as $$
  select regexp_replace(split_part(split_part(lower(p_email), '@', 1), '+', 1), '[^a-z]', '', 'g')
    || '@' || split_part(lower(p_email), '@', 2);
$$;

create function public.admin_referral_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Solo el equipo de Reutilizalo puede ver este tablero.' using errcode = '42501';
  end if;

  with sellers as (
    select
      pp.referred_by is not null as referred,
      pp.first_item_at is not null as published,
      p.created_at < now() - interval '7 days' as settled
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    where not pp.is_admin
  )
  select jsonb_build_object(
    'referred_total', count(*) filter (where referred),
    'referred_published', count(*) filter (where referred and published),
    'referred_empty', count(*) filter (where referred and not published and settled),
    'referred_recent', count(*) filter (where referred and not published and not settled),
    'organic_total', count(*) filter (where not referred),
    'organic_published', count(*) filter (where not referred and published),
    'organic_empty', count(*) filter (where not referred and not published and settled),
    'organic_recent', count(*) filter (where not referred and not published and not settled),
    'bonus_slots', (
      select coalesce(sum(public.plan_item_limit(p.id) - 5), 0)
      from public.profiles p
      join public.profile_private pp on pp.id = p.id
      where not pp.is_admin and public.effective_plan(p.id) = 'free'
    )
  ) into v_result
  from sellers;

  return v_result;
end;
$$;

-- Una fila por tienda que invitó a alguien, con señales de posible trampa:
--  * same_whatsapp: invitadas con el mismo WhatsApp que quien invita.
--  * similar_email: invitadas con un email casi igual al de quien invita o al
--    de otra invitada de la misma tienda.
--  * burst: invitadas creadas a menos de 10 minutos de otra invitada.
create function public.admin_list_referrers(p_limit integer default 100)
returns table (
  id uuid,
  nick text,
  store_name text,
  invited bigint,
  published bigint,
  empty bigint,
  recent bigint,
  bonus integer,
  same_whatsapp bigint,
  similar_email bigint,
  burst bigint,
  last_invited_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo el equipo de Reutilizalo puede ver este tablero.' using errcode = '42501';
  end if;

  return query
  with invitees as (
    select
      pp.id,
      pp.referred_by,
      pp.whatsapp,
      pp.first_item_at,
      p.created_at,
      public.email_fingerprint(u.email) as fingerprint
    from public.profile_private pp
    join public.profiles p on p.id = pp.id
    join auth.users u on u.id = pp.id
    where pp.referred_by is not null
  )
  select
    r.id,
    r.nick,
    r.store_name,
    count(*),
    count(*) filter (where i.first_item_at is not null),
    count(*) filter (where i.first_item_at is null and i.created_at < now() - interval '7 days'),
    count(*) filter (where i.first_item_at is null and i.created_at >= now() - interval '7 days'),
    least(5, public.referral_activated_count(r.id)),
    count(*) filter (where i.whatsapp = rpp.whatsapp),
    count(*) filter (
      where i.fingerprint = public.email_fingerprint(ru.email::text)
        or exists (
          select 1 from invitees other
          where other.referred_by = r.id
            and other.id <> i.id
            and other.fingerprint = i.fingerprint
        )
    ),
    count(*) filter (
      where exists (
        select 1 from invitees other
        where other.referred_by = r.id
          and other.id <> i.id
          and abs(extract(epoch from other.created_at - i.created_at)) < 600
      )
    ),
    max(i.created_at)
  from invitees i
  join public.profiles r on r.id = i.referred_by
  join public.profile_private rpp on rpp.id = r.id
  join auth.users ru on ru.id = r.id
  group by r.id, r.nick, r.store_name, rpp.whatsapp, ru.email
  order by count(*) desc, max(i.created_at) desc
  limit least(greatest(p_limit, 1), 500);
end;
$$;

-- Funciones: el trigger no se llama a mano; el resto, solo con sesión.
revoke execute on function public.items_mark_first_item() from public, anon, authenticated;
revoke execute on function public.referral_activated_count(uuid) from public, anon, authenticated;
revoke execute on function public.plan_item_limit(uuid) from public, anon, authenticated;
revoke execute on function public.my_referral_status() from public, anon;
revoke execute on function public.admin_referral_stats() from public, anon;
revoke execute on function public.admin_list_referrers(integer) from public, anon;
grant execute on function public.my_referral_status() to authenticated;
grant execute on function public.admin_referral_stats() to authenticated;
grant execute on function public.admin_list_referrers(integer) to authenticated;
