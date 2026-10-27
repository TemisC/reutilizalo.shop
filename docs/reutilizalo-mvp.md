# Reutilizalo — Especificación del MVP

> Documento para el agente de desarrollo. Antes de escribir código, propone el modelo de datos y la estructura de carpetas y espera aprobación. Trabaja por fases (ver al final) y no avances a la siguiente sin confirmación.

---

## 1. Qué es Reutilizalo

Reutilizalo (dominio `reutilizalo.shop`) es una app web, en español y pensada primero para celular, donde cualquier persona crea en 2 minutos una **mini tienda de sus cosas usadas** y comparte el link en su bio de Instagram: `reutilizalo.shop/paola`.

Objetivos del producto:

1. Vender cosas personales de segunda mano entre conocidos de forma prolija y confiable.
2. Que cada tienda invite a crear nuevas tiendas (crecimiento viral).
3. Construir una **comunidad de economía circular sana**: fotos reales, descripciones honestas y una reputación visible para cada vendedor.

Mercado inicial: Uruguay (Montevideo). Moneda: pesos uruguayos, formato `$U 1.200` (punto como separador de miles). Prefijo telefónico por defecto: `+598`.

**La plataforma no procesa pagos de las ventas.** Comprador y vendedor coordinan por WhatsApp y pagan como acuerden (efectivo, transferencia o el link de pago propio del vendedor). Reutilizalo nunca recibe ni reparte dinero de las ventas.

---

## 2. Roles

- **Visitante / comprador:** navega tiendas y Explorar sin cuenta. Toca "Lo quiero" y se abre WhatsApp con el vendedor. Califica una compra mediante un link único (no necesita cuenta).
- **Vendedor:** tiene cuenta, una tienda (nick único) y publica artículos según su plan.
- **Admin:** revisa reportes, modera artículos y puede cambiar el plan de un usuario a mano.

---

## 3. Planes y monetización

| | Gratis | Pro |
|---|---|---|
| Artículos activos | 5 | 50 |
| Fotos por artículo | 4 | 4 |
| Link `reutilizalo.shop/nick` | Sí | Sí |
| Aparece en Explorar | Ver regla de lanzamiento | Sí |
| Color de la tienda | Verde por defecto | Elegible |
| Estadísticas (visitas, toques en "Lo quiero") | No | Sí |
| Pie "Hecho con reutilizalo.shop" | Sí (obligatorio) | Sí |
| Precio | $U 0 | `[PRECIO]` por mes (a definir) |

Reglas:

- El límite cuenta **artículos activos** (los marcados como vendidos u ocultos no cuentan). Se valida **en el servidor**, no solo en la interfaz.
- **Regla de lanzamiento de Explorar:** usar un feature flag `EXPLORE_INCLUDE_FREE_STORES` (por defecto `true`). Mientras esté activo, todas las tiendas aparecen en Explorar, con las Pro primero. Cuando se desactive, solo aparecen tiendas Pro.
- En el MVP el cobro del Pro puede ser **manual**: el admin activa el plan y define `plan_expires_at`. La suscripción automática con Mercado Pago queda para la Fase 3.
- Fase 3 (no hacer ahora, pero dejar el modelo preparado): paquetes de pago único (ej. "Pack mudanza": 20 artículos extra por 30 días), artículos destacados pagos en Explorar, ferias grupales.

---

## 4. Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS.
- **Supabase:** Auth (email con magic link o contraseña), Postgres, Storage para imágenes, Row Level Security en todas las tablas.
- **Vercel** para el deploy, con el dominio `reutilizalo.shop`.
- Imágenes: comprimir en el cliente antes de subir (máximo 1600 px de lado, WebP, calidad ~0.8). Usar `next/image` para mostrarlas.
- Tipografías (Google Fonts): **Bricolage Grotesque** (títulos, precios) y **DM Sans** (texto).

---

## 5. Rutas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Página de inicio (landing) | Público |
| `/crear` | Registro + elegir nick | Público |
| `/login` | Inicio de sesión | Público |
| `/explorar` | Catálogo de varias tiendas, con búsqueda y filtros | Público |
| `/calificar/[token]` | Encuesta de calificación de una compra | Público con token válido |
| `/panel` | Panel del vendedor | Vendedor |
| `/panel/publicar` | Publicar artículo | Vendedor |
| `/panel/articulos/[id]` | Editar artículo | Vendedor (dueño) |
| `/panel/tienda` | Editar perfil de la tienda | Vendedor |
| `/admin` | Reportes y moderación | Admin |
| `/[nick]` | Tienda pública | Público |
| `/[nick]/[itemId]` | Detalle de un artículo (para compartir un artículo puntual) | Público |

**Nicks:** minúsculas, números y guiones, de 3 a 20 caracteres, únicos. Normalizar mientras el usuario escribe. Nicks reservados (bloquear): `admin, api, app, crear, login, logout, registro, panel, explorar, calificar, ayuda, soporte, terminos, privacidad, planes, pro, blog, tienda, tiendas, reutilizalo, www, static, _next` y cualquier ruta futura.

---

## 6. Modelo de datos (propuesta inicial)

```
profiles
  id (uuid, = auth.users.id)
  nick (text, unique)
  store_name (text)
  bio (text, ≤ 200)
  avatar_url (text, null)
  whatsapp (text, E.164)
  payment_link (text, null)          -- link de pago propio del vendedor (opcional)
  city (text), zone (text)           -- ej. Montevideo / Pocitos
  plan (enum: free | pro)
  plan_expires_at (timestamptz, null)
  accent_color (text, null)          -- solo Pro
  show_explore_link (bool, default true)
  is_admin (bool, default false)
  created_at

items
  id (uuid)
  seller_id → profiles.id
  title (text, ≤ 80)
  description (text, ≤ 600)
  price_uyu (integer)
  category (enum: ropa | hogar | ninos | libros | deporte | tecnologia | otros)
  condition (enum: nuevo_con_etiqueta | como_nuevo | muy_buen_estado | buen_estado | con_detalles)
  defects (text, null)               -- descripción de detalles o desgaste
  honesty_confirmed (bool)           -- casilla "las fotos son reales"
  status (enum: active | sold | hidden | removed_by_admin)
  featured_until (timestamptz, null) -- Fase 3
  created_at, sold_at

item_photos
  id, item_id → items.id
  url (text)
  kind (enum: main | angle | label | defect)
  position (smallint)

sales
  id, item_id → items.id, seller_id → profiles.id
  buyer_name (text, null), buyer_contact (text, null)
  rating_token (text, unique)        -- aleatorio, ≥ 32 caracteres
  token_expires_at (timestamptz)     -- 30 días
  token_used_at (timestamptz, null)
  reminder_sent_at (timestamptz, null)
  created_at

reviews
  id, sale_id → sales.id (unique)     -- una reseña por venta
  seller_id → profiles.id
  received (enum: yes | not_yet | no)
  q_photos, q_description, q_timing, q_communication, q_overall (smallint 1–9, null si received ≠ yes)
  score (numeric(3,1))               -- promedio de las 5 preguntas
  comment (text, ≤ 500, null)
  seller_reply (text, ≤ 300, null)
  is_hidden (bool, default false)    -- moderación
  created_at

reports
  id, sale_id (null), item_id (null), reporter_contact (null)
  reason (enum: not_received | fake_photos | not_as_described | prohibited_item | other)
  details (text)
  status (enum: open | confirmed | dismissed)
  created_at, resolved_at

item_events                          -- estadísticas (Pro)
  id, item_id, type (enum: view | want_click), created_at
```

Vista o función `seller_reputation(seller_id)` que devuelva: cantidad de reseñas visibles, promedio general y promedio por cada pregunta.

**RLS:** cada vendedor lee y escribe solo lo suyo. Lectura pública de `profiles` (campos públicos), `items` activos/vendidos, `item_photos` y `reviews` no ocultas. Las reseñas se crean **solo** desde una función del servidor que valida el token.

---

## 7. Funcionalidades del MVP

### 7.1 Crear tienda (`/crear`)
- Campo de nick con prefijo `reutilizalo.shop/` y vista previa en vivo del link.
- Verificación de disponibilidad en vivo (con debounce): "¡Disponible! Así quedará tu link" o error.
- Campos: nombre de la tienda, WhatsApp (+598 por defecto), email/contraseña o magic link.
- Beneficios visibles: "Hasta 5 artículos gratis, para siempre", "Te escriben directo a tu WhatsApp", "Sin tarjeta ni comisiones".
- Al terminar, redirige a `/panel`.

### 7.2 Panel del vendedor (`/panel`)
- Tarjeta con su link, botón **Copiar link**, botón **Ver mi tienda** y el texto "Pégalo en la bio de tu Instagram y compártelo en tus historias".
- Tarjeta **Tu reputación**: promedio de 1 a 9, cantidad de calificaciones, mejor y peor criterio. Si tiene menos de 3, mostrar "Todavía no tienes calificaciones suficientes".
- Contador "3 de 5 gratis" con barra de progreso.
- Botón **Publicar un artículo**. Si llegó al límite: deshabilitarlo y mostrar la invitación al Plan Pro.
- Lista de artículos con editar, ocultar y **Marcar vendido** (ver 7.6).
- Tarjeta del Plan Pro: "¿Tienes más de 5 cosas para vender?".

### 7.3 Publicar artículo (`/panel/publicar`)
Este es un punto clave para la confianza de la comunidad. Incluir:

- **Banner destacado (amarillo) arriba del formulario**, con este texto:
  > **¿Tu producto tiene algún detalle? Sácale foto.**
  > Que se vea: así tu comprador (o tu amiga) sabe exactamente lo que está comprando, y tú no te ganas una baja reputación.
  > Queremos una comunidad de economía circular sana, donde todos quedemos contentos.
- **4 espacios de foto con nombre**: Principal (obligatoria), Otro ángulo, Etiqueta o talle, **Detalles o desgaste** (marcado como "Recomendado").
- Consejos bajo las fotos: usar luz natural y fondo liso; subir fotos reales propias, nunca de internet; mostrar manchas, raspones o roturas tal como están.
- Campos: título, precio ($U), categoría, estado (chips de selección única), "¿Tiene algún detalle? Cuéntalo" (texto).
- **Regla suave de honestidad:** si el estado es "Buen estado" o "Con detalles" y no hay foto de tipo `defect` ni texto en `defects`, mostrar un aviso antes de publicar: "Contar los detalles evita malentendidos y cuida tu reputación. ¿Publicar igual?". No bloquear.
- **Casilla obligatoria:** "Confirmo que las fotos son reales y muestran el estado actual del producto". Sin ella no se puede publicar.
- Validar el límite del plan en el servidor.

### 7.4 Tienda pública (`/[nick]`)
- Barra superior con el link de la tienda y botón para compartir (Web Share API, con copiar link como alternativa).
- Perfil: avatar (inicial si no hay foto), nombre de la tienda, @nick y barrio, bio.
- **Bloque de reputación:** "★ 8,7/9 · Vendedora confiable · 14 compradores la calificaron". Con menos de 3 reseñas mostrar "Nueva en Reutilizalo". Al tocarlo, abrir el detalle: promedio por criterio y últimos comentarios con la respuesta del vendedor.
- Chips informativos: "Responde por WhatsApp" y, si cargó un link de pago, "Acepta Mercado Pago" (o el texto que corresponda).
- Filtro por categoría (solo las categorías que tenga la tienda).
- Grilla de 2 columnas: foto, etiqueta de estado, título, precio y botón **Lo quiero**.
  - "Lo quiero" abre `https://wa.me/<número>?text=` con el mensaje: `Hola! Vi en tu tienda de Reutilizalo "<título>" a $U <precio>. ¿Sigue disponible? <link del artículo>`. Registrar un evento `want_click`.
  - Los vendidos muestran el sello amarillo **¡Vendido!** sobre la foto y "Ya tiene dueño" en lugar del botón. Se mantienen visibles 14 días y después se ocultan.
- **Elementos de crecimiento (obligatorios):**
  1. Última celda de la grilla: tarjeta amarilla "¿Y tus cosas que ya no usas? Arma tu tiendita gratis en 2 minutos → Crear la mía".
  2. Banner oscuro: "¿Quieres crear tu propia tienda para vender tus cositas usadas entre tus conocidos?" con el botón "Crear mi tienda gratis →" y la línea "Sin tarjeta · Lista en 2 minutos".
  3. Tarjeta "¿No encontraste lo que buscabas? Descubre más cosas cerca tuyo" que lleva a `/explorar` (el vendedor Pro puede ocultarla con `show_explore_link`).
  4. Pie: "Hecho con reutilizalo.shop".
- Metadatos Open Graph (nombre de la tienda + foto del primer artículo) para que el link se vea bien al compartirlo.

### 7.5 Explorar (`/explorar`)
- Título "Explorar cosas cerca tuyo", buscador por texto (título y descripción) y selector de ciudad/barrio.
- Chips de categoría (filtran el listado).
- Fila horizontal **Destacados** (Fase 3: artículos con `featured_until` vigente). En el MVP puede ocultarse si no hay destacados.
- Grilla "Recién publicados": foto, título, precio, avatar + @nick · barrio, **★ reputación/9** y botón "Lo quiero".
- Qué tiendas aparecen: según la regla de lanzamiento de la sección 3. Orden: Pro primero, luego por fecha de publicación.
- Al final: "¿Quieres que tus cosas aparezcan aquí? Con Pro tus artículos se muestran en Explorar…" → planes.
- Botón "Vender" en el encabezado → `/crear`.

### 7.6 Reputación y calificaciones

**Cómo se genera una calificación (anti-reseñas falsas):**
1. El vendedor toca **Marcar vendido**. Se abre un paso opcional: "¿Quieres que tu comprador te califique?" con un campo para el nombre o WhatsApp del comprador.
2. Se crea un registro en `sales` con un `rating_token` único y un vencimiento de 30 días.
3. El panel muestra el botón **Enviar link de calificación por WhatsApp**, con el mensaje prearmado: `¡Gracias por tu compra! ¿Me ayudas calificándola? Toma 1 minuto: reutilizalo.shop/calificar/<token>`.
4. Si el comprador dejó un contacto, se puede enviar un recordatorio a los 7 días (Fase 2).
5. El token es de un solo uso. Una reseña por venta. El vendedor no puede calificarse a sí mismo (si hay sesión iniciada y es el dueño, bloquear). Aplicar límite de intentos por IP.

**Encuesta (`/calificar/[token]`):**
- Tarjeta del artículo: foto, título, "Le compraste a @nick · $U precio".
- Título "¿Cómo fue tu compra?" y el subtítulo "Tu opinión ayuda a que todos compremos tranquilos. Toma menos de un minuto."
- Pregunta 0: **¿Recibiste el producto?** → Sí / Todavía no / No llegó.
  - **Sí:** mostrar las 5 preguntas.
  - **Todavía no:** mensaje "Te volveremos a preguntar en unos días" (el token sigue válido).
  - **No llegó:** mostrar "Lamentamos que no te haya llegado. Avísanos y lo revisamos con el vendedor." y el botón **Reportar un problema** (crea un registro en `reports` con motivo `not_received`).
- Preguntas, cada una en escala **del 1 al 9** (9 botones, 1 = "Para nada", 9 = "Totalmente"):
  1. ¿Las fotos eran reales y mostraban el producto tal cual? (`q_photos`)
  2. ¿Lo que recibiste coincide con la descripción y el estado publicado? (`q_description`)
  3. ¿Se cumplió lo acordado en el tiempo de entrega o envío? (`q_timing`)
  4. ¿Cómo fue el trato y la comunicación? (`q_communication`)
  5. ¿Qué tan conforme quedaste con la compra en general? (`q_overall`)
- Resumen en vivo: "8,0 de 9 · Te faltan 2 preguntas".
- Comentario opcional y botón **Enviar calificación** (habilitado cuando están las 5 respuestas).
- Pantalla final de agradecimiento con invitación: "¿Tienes cosas que ya no usas? Crea tu tienda gratis".

**Cálculo:**
- `score` de una reseña = promedio de las 5 preguntas, con 1 decimal.
- Reputación del vendedor = promedio de los `score` de sus reseñas visibles. Mostrar con coma decimal ("8,7").
- Se muestra en público a partir de **3 reseñas**. Antes: "Nueva en Reutilizalo".
- Etiquetas: ≥ 8,0 "Vendedor/a confiable"; 6,0 a 7,9 "Buena reputación"; < 6,0 solo el número.
- Un reporte `not_received` **confirmado por el admin** cuenta como una reseña con 1 en todas las preguntas.
- El vendedor puede responder una vez a cada reseña (`seller_reply`), en público.
- El admin puede ocultar reseñas abusivas (`is_hidden`).

### 7.7 Admin (`/admin`)
- Lista de reportes con estado, confirmar o descartar.
- Ocultar artículos o reseñas.
- Cambiar el plan de un usuario y su vencimiento.

---

## 8. Diseño (usar los JPG adjuntos como referencia)

Archivos de referencia:

| Archivo | Pantalla |
|---|---|
| `01-tienda-publica.jpg` | Tienda pública `/[nick]` |
| `02-crear-tienda.jpg` | `/crear` |
| `03-panel-vendedor.jpg` | `/panel` |
| `04-inicio-desktop.jpg` / `04b-inicio-movil.jpg` | Landing `/` |
| `05-explorar.jpg` | `/explorar` |
| `06-publicar-articulo.jpg` | `/panel/publicar` |
| `07-calificar-compra.jpg` | `/calificar/[token]` |

Las fotos de los JPG son espacios marcados; en la app van las fotos reales. Los vendedores, precios y barrios son de ejemplo.

**Tokens de diseño:**

| Token | Valor | Uso |
|---|---|---|
| `bg` | `#F3F5F1` | Fondo general |
| `surface` | `#FFFFFF` | Tarjetas, inputs |
| `ink` | `#14201A` | Texto principal, bloques oscuros |
| `ink-muted` | `#4F5B54` | Texto secundario |
| `ink-soft` | `#2E3A33` | Cuerpo de texto |
| `accent` | `#17784B` | Botones principales, "Lo quiero" |
| `accent-hover` | `#0F5A37` | Hover |
| `highlight` | `#FFD45C` | Sellos ("¡Vendido!", "Destacado"), reputación, Plan Pro |
| `chip-off` | `#EEF0EC` | Botones secundarios, escala sin seleccionar |
| `line` | `#D6DCD7` | Borde interno de inputs |

- Radios: tarjetas 18–24 px, botones 12–16 px, chips 999 px.
- Botones táctiles de al menos 44 px de alto.
- Títulos en Bricolage Grotesque 800 con `letter-spacing` negativo; precios en Bricolage 700.
- Íconos de línea (sugerido: `lucide-react`), sin emojis.
- Contraste mínimo de texto 4.5:1.
- Mobile first: las pantallas de tienda, panel, publicar, explorar y calificar se diseñan a 390 px de ancho. La landing es responsive.
- Para los vendedores Pro, `accent_color` reemplaza `accent` dentro de su tienda.

---

## 9. Textos y tono

- Español rioplatense neutro con **tú** ("Crea tu tienda", "Sube tus cosas").
- Tono cercano, positivo y breve. Siempre reforzar la idea de comunidad: fotos reales, honestidad, todos contentos.
- Los textos clave están en esta especificación y en los JPG; respetarlos.

---

## 10. Seguridad y legal (mínimo para lanzar)

- RLS en todas las tablas; validar límites de plan y propiedad en el servidor.
- Tokens de calificación aleatorios y criptográficamente seguros.
- Límite de subida: 4 fotos por artículo, 5 MB cada una antes de comprimir; aceptar solo imágenes.
- Página de **Términos de uso**: Reutilizalo es una plataforma que conecta personas; cada vendedor es responsable de lo que publica y de la venta; no se procesan pagos; lista de artículos prohibidos (armas, medicamentos, animales, productos falsificados, alimentos, etc.); reglas de la comunidad sobre fotos reales y descripciones honestas.
- Página de **Privacidad**: qué datos se guardan (email, WhatsApp, contacto opcional del comprador) y para qué.
- Botón "Reportar artículo" en el detalle de cada artículo.

---

## 11. Fases de trabajo

**Fase 1 — Núcleo (MVP lanzable)**
1. Proyecto, Supabase, autenticación, tablas y RLS.
2. `/crear` con verificación de nick y nicks reservados.
3. `/panel` y `/panel/publicar` (con banner de honestidad, fotos nombradas, compresión, límite de 5).
4. `/[nick]` con "Lo quiero" por WhatsApp, sello de vendido y todos los elementos de crecimiento.
5. Landing `/`, Términos y Privacidad.

**Fase 2 — Confianza y descubrimiento**
6. Marcar vendido + link de calificación + `/calificar/[token]` + reputación visible.
7. Reportes y `/admin`.
8. `/explorar` con búsqueda, filtros y la regla `EXPLORE_INCLUDE_FREE_STORES`.
9. Plan Pro activado a mano por el admin (50 artículos, color, estadísticas).

**Fase 3 — Monetización**
10. Suscripción Pro con Mercado Pago.
11. Destacados pagos en Explorar.
12. Paquetes de pago único y ferias grupales.

**Criterios de aceptación generales**
- Todo funciona y se ve bien a 390 px de ancho.
- Un usuario gratuito no puede tener más de 5 artículos activos, ni siquiera llamando a la API directamente.
- Nadie puede editar artículos, ventas o reseñas de otro usuario.
- Un token de calificación solo genera una reseña y vence a los 30 días.
- La reputación pública aparece recién con 3 reseñas o más.
