# Reseñas de clientes

Formulario público, moderación interna y publicación de reseñas. La reseña se guarda en D1, se revisa en un panel privado y recién después se publica en el sitio mediante un artefacto generado.

## Arquitectura

| Pieza | Archivo | Tipo |
|---|---|---|
| Formulario | `src/pages/resena.astro` + `src/components/resena/ReviewForm.tsx` | Isla Preact en página estática (`noindex`) |
| Endpoint del formulario | `src/pages/api/resenas.ts` | On-demand, JSON |
| Lógica del formulario | `src/lib/resenas/*` (schema, handler, r2, templates) | Módulos puros + D1/R2 |
| Tabla | `src/db/schema.ts` (`resenas`) | D1 |
| Panel de moderación | `src/pages/admin/resenas.astro` | On-demand, SSR |
| Endpoint del panel | `src/pages/admin/resenas/acciones.ts` | On-demand, POST-only, PRG (bajo `/admin/` para que Access lo cubra) |
| Foto | `src/pages/admin/resenas/foto/[...key].astro` | On-demand, R2 privado |
| Sincronización | `scripts/sync-resenas.ts` + `scripts/sql/resenas-aprobadas.sql` | Script Bun |
| Artefacto público | `src/data/resenas.generated.ts` | Generado, se commitea |
| Vitrina | `src/components/resenas/ReviewsSection.astro` y `src/pages/resenas/index.astro` | Estático |

El sitio sigue siendo estático salvo las rutas on-demand del formulario, el panel y la foto. El artefacto público se genera en local o CI y se commitea: publicar una reseña nueva es aprobar en el panel, correr `resenas:sync` y volver a construir.

## Flujo

1. La persona envía el formulario en `/resena/`. La reseña queda en D1 con `estado = 'pendiente'` y llega una notificación a `CONTACT_INBOX` con enlace a `https://renovabit.com/admin/resenas/`.
2. En el panel se aprueba o rechaza. Las transiciones válidas son `pendiente -> aprobada | rechazada`, `aprobada -> rechazada` y `rechazada -> aprobada` (máquina de estados en `src/lib/resenas/admin.ts`). El descuento (`descuento_otorgado`) es un flag aparte que se puede alternar en cualquier estado.
3. `bun run resenas:sync` lee las aprobadas y escribe `src/data/resenas.generated.ts` con el nombre recortado (`María Fernanda Quispe` -> `María F.`), y marca `publicado_en` en D1.
4. El siguiente build publica el artefacto: `/resenas/` lista todo y cada página de servicio embebe solo las reseñas de su `servicioId`.

La foto de la reseña **no se publica todavía**: la sirve una ruta privada del panel (`/admin/resenas/foto/<key>`, detrás de Access) y la publicación pública de fotos queda para F2.

## Comandos

```sh
bun run db:generate        # genera la migración SQL desde src/db/schema.ts
bun run db:migrate:local   # aplica migraciones a la D1 local
bun run db:migrate:remote  # aplica migraciones a la D1 de producción

bun run resenas:sync             # sincroniza contra la D1 remota (producción)
bun run resenas:sync -- --local  # sincroniza contra la D1 local (desarrollo)
```

`resenas:sync` valida la salida de Wrangler con Valibot antes de escribir. Si la validación falla, **no escribe nada** y sale con código 1. El marcado de `publicado_en` es best-effort: si falla, el artefacto ya quedó escrito y solo se avisa.

El artefacto no lleva marcas de tiempo: con las mismas filas, el archivo es byte a byte idéntico (diff mínimo). Las reseñas nuevas se agregan al final porque el orden es por `id` ascendente.

## Panel

- URL: `https://renovabit.com/admin/resenas/` (`?estado=pendiente|aprobada|rechazada|todas`).
- Lista con estadísticas (total, pendientes, promedio, aprobadas sin publicar) y badge "sin publicar" para las aprobadas que todavía no entraron al artefacto.
- Acciones por fila: Aprobar, Rechazar y Marcar/Quitar descuento. Solo se muestran las transiciones válidas.
- Los mensajes de resultado viajan por query (`?ok=aprobada`, `?ok=descuento`, etc.) con el patrón PRG.

### Cloudflare Access (obligatorio antes de deployar)

El panel debe quedar detrás de Cloudflare Access. La guía paso a paso está en [`docs/cloudflare-access.md`](./cloudflare-access.md). Si Access no está configurado, el panel responde 403 en producción: `accesoPermitido` exige el header `cf-access-authenticated-user-email` (fail-closed) además de la validación de origen y del límite de cuerpo. En local no hay Access y la comprobación se omite, pero el servidor escucha solo en `localhost`.

No expongas el puerto local con un túnel mientras no haya Access: eso saltaría la única barrera real del panel.

### Routing del panel (on-demand)

El sitio **no declara `not_found_handling`** en `wrangler.jsonc`: con el default, los requests que no matchean un asset caen al Worker (render on-demand), que es el patrón recomendado por la doc de Astro para sitios con rutas on-demand. Con `"404-page"` la capa de assets respondía su 404 a las navegaciones (`Sec-Fetch-Mode: navigate`) y el panel nunca llegaba al Worker (solo respondía a curl, que no manda ese header).

Como el 404 lo renderiza el Worker, las variantes escritas a mano de la URL del panel (`/admin/reseñas`, `/admin/resena`) se redirigen desde el catch-all `src/pages/admin/[...rest].ts`: el fallback interno a assets no aplica `_redirects`. El resto del sitio sigue sirviéndose como assets, sin cambios.

### Deploy por push (Workers Builds)

El build de Workers Builds no lee `.env`, pero no hace falta configurar nada: `PUBLIC_TURNSTILE_SITE_KEY` tiene la sitekey real del widget por defecto en `astro.config.mjs` y se inlinea en cada build (una env var la sobrescribe). Sin ese valor, los formularios de `/contacto/` y `/resena/` se desplegarían en modo degradado (aviso y CTA de WhatsApp, sin envío).

Para verificar cambios sin tocar producción: `bunx wrangler versions upload` sube una versión con preview URL (`https://<version>-renovabit-landing.reyserlyn.workers.dev`, con `preview_urls` activado). El worker también vive en `renovabit-landing.reyserlyn.workers.dev`; el panel responde 403 ahí (fail-closed, sin Access).

## Modelo de datos

Campos relevantes de `resenas`:

| Columna | Uso |
|---|---|
| `nombre`, `empresa`, `servicio`, `servicio_id`, `comentario`, `estrellas` | Contenido de la reseña |
| `contacto`, `contacto_tipo` | Correo o WhatsApp opcional para agradecer y coordinar el descuento |
| `foto_key` | Clave del objeto en R2 (`resenas/<año>-<mes>-<uuid>.<ext>`) |
| `estado` | `pendiente`, `aprobada` o `rechazada` |
| `descuento_otorgado` | `0`/`1`; el formulario lo deja en `1` y el panel puede corregirlo |
| `publicado_en` | Se marca en cada `resenas:sync`; permite contar "aprobadas sin publicar" |
| `consentimiento`, `consentimiento_en` | Prueba del consentimiento para publicar |
| `ip_hash`, `user_agent`, `origen`, `ticket_id` | Moderación y trazabilidad (nunca se publican) |

## Privacidad

El tratamiento de los datos de reseñas está descrito en `/privacidad/` (apartado "Reseñas de clientes"): nombre, empresa opcional, servicio, opinión, contacto opcional y foto opcional; finalidad de publicar la opinión y agradecer; consentimiento al enviar; retención mientras el sitio publique opiniones. El texto está pendiente de revisión legal por parte del titular.

## Pendiente para F2

- Publicar las fotos de las reseñas (hoy la ruta es privada del panel). Requiere decidir entre copiar el objeto a un prefijo público en R2 o servirlo con una ruta pública sin Access.
- `AggregateRating`/`Review` en JSON-LD para `/resenas/` (solo con reseñas reales publicadas).
- Paginación o "ver más" cuando el listado crezca.
- Edición o eliminación de reseñas desde el panel.
- Sincronización automática (cron o GitHub Action) después de aprobar, para no depender de correr el script a mano.
- Cupones: los campos `cupon_codigo`, `cupon_estado` y `cupon_expira` ya existen en la tabla pero todavía no se usan.

## Pruebas

```sh
bun test                                     # incluye admin.test.ts y public.test.ts
bunx biome check .                           # lint + formato
bun run check                                # astro check
bun run build                                # build completo
```

`src/lib/resenas/admin.test.ts` cubre la máquina de estados, el parseo de acciones y las estadísticas. `src/lib/resenas/public.test.ts` cubre `nombrePublico`, el orden estable y la validación del JSON de Wrangler.
