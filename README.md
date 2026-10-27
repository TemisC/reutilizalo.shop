# Reutilizalo

Mini tiendas de cosas usadas con link para la bio de Instagram: `reutilizalo.shop/paola`.

- Especificación del MVP: [docs/reutilizalo-mvp.md](docs/reutilizalo-mvp.md)
- Prototipos: [docs/prototipos/](docs/prototipos/)

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase (Auth, Postgres, Storage, RLS) · Vercel.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```

### Base de datos

El esquema completo (tablas, RLS, triggers, funciones y buckets de Storage) está en
[supabase/migrations/](supabase/migrations/). Con el proyecto de Supabase creado:

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase db push
npm run db:types              # genera lib/supabase/database.types.ts
```

En Supabase → Authentication → Providers → Email: dejar activo **Email**. Para que crear
la tienda tome 2 minutos, desactivar **Confirm email** en el MVP (o configurar SMTP propio).

Si se deja activo, en Authentication → Email Templates → Confirm signup usar este link, que
funciona aunque se abra en otro navegador (por ejemplo, fuera de Instagram):
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/panel`.
En Authentication → URL Configuration, poner `Site URL` = `https://reutilizalo.shop`.

Para hacerte admin: `update public.profile_private set is_admin = true where id = '<tu user id>';`

## Pendiente antes del lanzamiento

- **Textos legales:** completar `[NOMBRE DEL RESPONSABLE]` y `[EMAIL DE CONTACTO]` en
  `components/landing/legal-page.tsx`, y hacer revisar `/terminos` y `/privacidad` por alguien con
  conocimiento legal (Ley 18.331).
- **Cierre de cuenta:** la Política de privacidad promete borrar la tienda, los artículos y las fotos
  cuando alguien cierra su cuenta. Por ahora se hace a mano (borrar el usuario en Supabase Auth borra sus
  datos en cascada; las fotos de Storage hay que borrarlas aparte).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos |
| `npm test` | Tests unitarios (Vitest) |
