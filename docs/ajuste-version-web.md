# Reutilizalo — Ajuste de la versión para computadora

> Tarea puntual: la app ya funciona en celular, pero en computadora se ve angosta, como una pantalla de celular en el medio. Hay que adaptar el diseño a pantallas grandes **sin cambiar** colores, tipografías, componentes ni la lógica ya hecha. Usa las imágenes de la carpeta `prototipos-computadora/` como referencia visual.

## Qué está pasando (revisar primero)

Lo más probable es que el contenido esté envuelto en un contenedor con ancho máximo de celular (por ejemplo `max-w-md`, `max-w-sm` o `max-w-[390px]`) en el layout general o en cada página. Revisa el layout raíz y cada página y quita ese límite para pantallas grandes, aplicándolo solo en celular.

## Breakpoints

- **< 768 px:** el diseño actual de celular, sin cambios.
- **768 – 1023 px:** grillas de 2–3 columnas, sin columnas laterales.
- **≥ 1024 px:** el diseño de computadora descrito abajo. Contenido centrado con ancho máximo ~1280 px y márgenes laterales de 40 px.

En Tailwind: diseño de celular por defecto y cambios con los prefijos `md:` y `lg:`.

## Pantallas

### Tienda pública `/[nick]` — ver `08-tienda-publica-desktop.jpg`
- Encabezado blanco de 72 px: logo a la izquierda; al centro la píldora con `reutilizalo.shop/nick`; a la derecha "Compartir", "Explorar" y el botón oscuro "Crear mi tienda".
- Debajo, dos columnas:
  - **Izquierda (340 px, fija):** tarjeta de perfil (avatar grande, nombre, @nick y barrio, bio, chips) y tarjeta de **reputación desglosada** (nota grande en amarillo, una barra por cada una de las 5 preguntas, la última reseña y "Ver las N reseñas").
  - **Derecha:** chips de categoría + contador de artículos, y grilla de **3 columnas**. La tarjeta amarilla "¿Y tus cosas que ya no usas?" ocupa la última celda.
- Debajo, a todo el ancho: banner oscuro horizontal "¿Quieres crear tu propia tienda…?" (texto a la izquierda, botón a la derecha), tarjeta "¿No encontraste lo que buscabas? → Ir a Explorar" y el pie "Hecho con reutilizalo.shop".

### Explorar `/explorar` — ver `09-explorar-desktop.jpg`
- Encabezado: logo, buscador grande al centro, selector de barrio y botón "Vender mis cosas".
- **Columna izquierda (240 px):** filtros de categoría (con cantidad), precio mínimo y máximo, estado (casillas) y el interruptor "Solo vendedores con 8 o más de reputación".
- **Derecha:** título grande, Destacados en 3 tarjetas horizontales (foto a la izquierda, datos a la derecha) y "Recién publicados" en grilla de **4 columnas** (con nick, barrio y ★ reputación).
- Al final, banner horizontal del Plan Pro.

### Panel `/panel` — ver `10-panel-vendedor-desktop.jpg`
- **Menú lateral oscuro de 248 px**, fijo a la altura de la pantalla: logo, Inicio, Publicar artículo, Mis artículos, Calificaciones, Mi tienda; abajo la tarjeta amarilla del Plan Pro y el usuario con su plan. En celular este menú no se muestra (se mantiene la navegación actual).
- Contenido: saludo grande + botón "Publicar un artículo" a la derecha.
- Fila de 3 tarjetas: link (Copiar link / Ver mi tienda), reputación, artículos "X de 5" con barra.
- Debajo, dos columnas: a la izquierda (más ancha) la lista de artículos en filas con columnas Artículo, Precio, Interesados (toques en "Lo quiero") y el botón Marcar vendido; a la derecha "Calificaciones recientes", con el aviso para enviar el link de calificación de lo vendido.

### Publicar `/panel/publicar` — ver `11-publicar-articulo-desktop.jpg`
- Mismo menú lateral del panel.
- **Izquierda:** formulario con los 4 espacios de foto en una fila, título/precio/categoría en una fila, estado y detalles.
- **Derecha (320 px):** banner amarillo de honestidad de las fotos, **vista previa en vivo** "Así se verá en tu tienda" (se actualiza al escribir título, precio y estado), casilla de confirmación y botón Publicar.

### Página de inicio `/` — ver `04-inicio-desktop.jpg`
- Hero en dos columnas (texto + campo para reservar el link a la izquierda; maqueta de celular a la derecha), "Tres pasos y listo" en 3 columnas, beneficios en 2×2, planes en 2 columnas y cierre centrado.

### Crear tienda y Calificar compra
- En computadora se mantiene el diseño de celular, centrado en una columna de ~480 px, sobre el fondo general.

## Criterios de aceptación
- A 1280 px y 1440 px de ancho ninguna pantalla se ve como una columna angosta de celular (salvo Crear y Calificar, que sí van centradas).
- A 390 px todo se ve exactamente igual que ahora.
- No aparece scroll horizontal en ningún ancho.
- No se modificaron colores, tipografías, textos ni lógica existente.
