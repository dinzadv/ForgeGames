# ForgeGames

Sitio estático (HTML + JS) con base de datos en **Supabase**. Se publica tal cual en GitHub Pages.

## Rutas limpias

| Ruta | Página |
|---|---|
| `/` | Inicio |
| `/explore/` | Explorar |
| `/view/?id=…` | Ver publicación |
| `/post/` y `/post/?id=…` | Publicar / **editar** (la edición usa el mismo formulario) |
| `/profile/` | Mi perfil |
| `/user/?id=…` | Perfil de otro usuario |
| `/login/` · `/register/` | Acceso |
| `/conversor/` | Herramienta conversor |

Cada ruta es una carpeta con su `index.html`, así que funciona en GitHub Pages sin configuración
(`/view?id=1` redirige solo a `/view/?id=1`).

## Puesta en marcha

1. **Base de datos:** Supabase → *SQL Editor* → pega `sql/forgegames_supabase.sql` completo → *Run*.
   Crea tablas, RLS, triggers y los buckets de Storage.
2. **Auth:** *Authentication → Sign In / Providers → Email* → desactiva **Confirm email**
   (las cuentas usan `usuario@mcpixel.com`, que no es un correo real).
3. **Dominio:** si usas dominio propio, añádelo a `HOSTS_EXACTOS` en `js/db.js`
   (por defecto: `localhost`, `127.0.0.1` y `*.github.io`).
4. Sube la carpeta a GitHub y activa Pages.

## Imágenes (Storage)

| Bucket | Uso |
|---|---|
| `avatars` | Foto de perfil |
| `perfil-banners` | Banner del perfil |
| `portadas` | Portada 1:1 de publicaciones |
| `banners` | Banner 3:1 de publicaciones |
| `galeria` | Imágenes adicionales |

- Las imágenes se comprimen en el navegador (WebP) y se guardan como `<bucket>/<user_id>/<uuid>.webp`.
- **Reemplazo:** al cambiar o quitar una imagen (portada, banner, galería, foto de perfil, banner de perfil)
  se sube la nueva, se guarda en la base y **después** se borra la anterior de Storage.
  Si algo falla, se borran las recién subidas y no se pierde nada.
- Al eliminar una publicación se borran también todas sus imágenes.
- Los nombres son únicos, así que nunca se ve una versión vieja por la caché del CDN.

## Caché (localStorage)

`js/db.js` guarda en `localStorage` (prefijo `fg_c1:`) las listas y perfiles que más se piden:
publicaciones (3 min), usuarios (5 min), perfil propio (5 min), likes y favoritos (10 min).
Se invalida sola al crear, editar o borrar, y si falla la red se usa la copia guardada.

## Seguridad

- La clave `sb_publishable_…` es pública por diseño; en `js/db.js` está **ofuscada** (no aparece en texto plano
  ni la detectan los buscadores de secretos), pero cualquiera puede verla desde el navegador.
  **La protección real son las políticas RLS** del SQL: cada usuario solo escribe lo suyo, los contadores
  (likes, descargas) y `verificado` no se pueden falsificar desde el navegador, y las URLs guardadas
  se validan en la base de datos.
- **Nunca** pongas en el frontend una clave `sb_secret_…` ni `service_role`.
- Para cambiar de proyecto o clave: `node scripts/ofuscar.js <ID_PROYECTO> <PUBLISHABLE_KEY>`
  y pega el resultado en `_C` dentro de `js/db.js`.
