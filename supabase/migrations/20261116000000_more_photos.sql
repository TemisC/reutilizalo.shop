-- Fotos: de 4 espacios con nombre a una lista ordenada de 3 a 8 fotos.
-- La primera (position 0) es la principal; kind queda en 'main' para ella y 'angle' para el resto.

alter table public.item_photos drop constraint if exists item_photos_item_id_kind_key;
alter table public.item_photos drop constraint if exists item_photos_position_check;
alter table public.item_photos add constraint item_photos_position_check check (position between 0 and 7);

-- Máximo 8 fotos por artículo.
create or replace function public.item_photos_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.item_photos where item_id = new.item_id) >= 8 then
    raise exception 'photo_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Reemplaza todas las fotos de un artículo en una sola transacción, en el orden recibido.
-- Corre con los permisos de quien llama (RLS de item_photos) y además verifica que el artículo sea suyo.
create function public.set_item_photos(p_item_id uuid, p_urls text[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (select 1 from public.items where id = p_item_id and seller_id = (select auth.uid())) then
    raise exception 'item_not_found' using errcode = '42501';
  end if;
  if coalesce(cardinality(p_urls), 0) < 3 then
    raise exception 'photo_minimum' using errcode = 'P0001';
  end if;
  if cardinality(p_urls) > 8 then
    raise exception 'photo_limit_reached' using errcode = 'P0001';
  end if;

  delete from public.item_photos where item_id = p_item_id;
  insert into public.item_photos (item_id, url, kind, position)
  select p_item_id, u.url, case when u.n = 1 then 'main' else 'angle' end::public.photo_kind, u.n - 1
  from unnest(p_urls) with ordinality as u (url, n);
end;
$$;

revoke execute on function public.set_item_photos(uuid, text[]) from public, anon;
grant execute on function public.set_item_photos(uuid, text[]) to authenticated;
