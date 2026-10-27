@AGENTS.md

# Reutilizalo

- La especificación manda: [docs/reutilizalo-mvp.md](docs/reutilizalo-mvp.md). Prototipos en `docs/prototipos/`.
- Se trabaja por fases (§11 de la spec); no pasar a la siguiente fase sin confirmación del usuario.
- Textos de la interfaz en español rioplatense neutro con "tú". Íconos de `lucide-react`, sin emojis.
- Mobile first a 390 px; versión computadora según [docs/ajuste-version-web.md](docs/ajuste-version-web.md) y
  `docs/prototipos-computadora/` (`md:` 768 px, `lg:` 1024 px; en celular nada cambia).
  Excepción decidida por el usuario: Crear tienda y Login van en dos columnas en computadora (formulario +
  vista previa de la tienda), no centradas en 480 px como dice la guía. Tokens de diseño en `app/globals.css` (`canvas`, `surface`, `ink`, `accent`, `highlight`…).
- Toda regla de negocio crítica (límite de plan, propiedad, tokens de calificación) se valida en la base
  (RLS, triggers o funciones en `supabase/migrations/`), no solo en la UI.
- Auth: por ahora solo email + contraseña. Google se agregará más adelante.
- Next 16: `proxy.ts` reemplaza a `middleware.ts`; con Cache Components, lo que lee cookies/sesión va dentro de `<Suspense>`.
