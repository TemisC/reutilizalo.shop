-- =====================================================================
-- Tablero de administración: indicadores de crecimiento y lista de tiendas.
-- Solo el admin puede llamar estas funciones (se valida acá, no en la UI).
-- Las cuentas admin no cuentan en los indicadores ni aparecen en la lista.
-- =====================================================================

create function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'America/Montevideo')::date;
  v_result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Solo el equipo de Reutilizalo puede ver este tablero.' using errcode = '42501';
  end if;

  with sellers as (
    select p.id, p.created_at, p.plan, p.plan_expires_at
    from public.profiles p
    join public.profile_private pp on pp.id = p.id
    where not pp.is_admin
  ),
  seller_items as (
    select i.* from public.items i join sellers s on s.id = i.seller_id
  ),
  seller_events as (
    select e.* from public.item_events e join seller_items i on i.id = e.item_id
  ),
  days as (
    select generate_series(v_today - 29, v_today, interval '1 day')::date as day
  )
  select jsonb_build_object(
    'stores_total', (select count(*) from sellers),
    'stores_7d', (select count(*) from sellers where created_at >= now() - interval '7 days'),
    'stores_30d', (select count(*) from sellers where created_at >= now() - interval '30 days'),
    'stores_with_items', (select count(distinct seller_id) from seller_items where status = 'active'),
    'stores_pro', (
      select count(*) from sellers
      where plan = 'pro' and (plan_expires_at is null or plan_expires_at > now())
    ),
    'items_active', (select count(*) from seller_items where status = 'active'),
    'items_7d', (select count(*) from seller_items where created_at >= now() - interval '7 days'),
    'items_sold', (select count(*) from seller_items where status = 'sold'),
    'want_clicks_total', (select count(*) from seller_events where type = 'want_click'),
    'want_clicks_7d', (
      select count(*) from seller_events
      where type = 'want_click' and created_at >= now() - interval '7 days'
    ),
    'views_7d', (
      select count(*) from seller_events
      where type = 'view' and created_at >= now() - interval '7 days'
    ),
    'reviews_total', (
      select count(*) from public.reviews r join sellers s on s.id = r.seller_id
    ),
    'reports_open', (select count(*) from public.reports where status = 'open'),
    'signups_by_day', (
      select jsonb_agg(jsonb_build_object('day', d.day, 'count', coalesce(c.n, 0)) order by d.day)
      from days d
      left join (
        select (created_at at time zone 'America/Montevideo')::date as day, count(*) as n
        from sellers group by 1
      ) c on c.day = d.day
    )
  ) into v_result;

  return v_result;
end;
$$;

-- Tiendas más recientes con su actividad. Incluye email y WhatsApp para poder contactarlas.
create function public.admin_list_stores(p_limit integer default 100)
returns table (
  id uuid,
  nick text,
  store_name text,
  email text,
  whatsapp text,
  plan public.plan_type,
  created_at timestamptz,
  items_active bigint,
  items_sold bigint,
  want_clicks bigint
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
  select
    p.id,
    p.nick,
    p.store_name,
    u.email::text,
    pp.whatsapp,
    public.effective_plan(p.id),
    p.created_at,
    (select count(*) from public.items i where i.seller_id = p.id and i.status = 'active'),
    (select count(*) from public.items i where i.seller_id = p.id and i.status = 'sold'),
    (
      select count(*) from public.item_events e
      join public.items i on i.id = e.item_id
      where i.seller_id = p.id and e.type = 'want_click'
    )
  from public.profiles p
  join public.profile_private pp on pp.id = p.id
  join auth.users u on u.id = p.id
  where not pp.is_admin
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 500);
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.admin_list_stores(integer) from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_stores(integer) to authenticated;
