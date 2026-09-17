# Formulario de contacto

Formulario de `/contacto/` y embebido, con validación compartida entre cliente y servidor, defensas anti-bot y envío de correos. En esta versión no se almacena nada: la consulta llega por correo.

Páginas con el formulario embebido (isla con `client:visible`, ancla local `#formulario`):

- Home: CTA final `id="contacto"` (`src/components/sections/cta.astro`).
- Landings: laptop lenta, mantenimiento a domicilio y reparación de laptops (`LandingCta`).
- Fichas de servicio: `servicios/servicio-tecnico`, `desarrollo-web`, `tienda` y `reparaciones-especializadas`.
- Hub de servicios: `servicios/index.html`.

## Arquitectura

- **Una sola ruta on-demand**: `src/pages/api/contact.ts` (`export const prerender = false`). El resto del sitio sigue estático y se sirve desde assets.
- **Validación SSOT**: `src/lib/contact/schema.ts` (Valibot). La isla la usa para la experiencia de usuario y el endpoint la vuelve a ejecutar como autoridad.
- **Isla Preact**: `src/components/contact/ContactForm.tsx` con Formisch (`@formisch/preact`) y `@preact/signals`. El widget de Turnstile vive en `src/components/contact/TurnstileWidget.tsx`.
- **Sección reutilizable**: `src/components/contact/ContactFormSection.astro` (dos columnas: copy + WhatsApp a la izquierda, tarjeta blanca con la isla a la derecha). La usan la home, `LandingCta`, las fichas de servicio y el hub. Se monta en `/contacto/` (`client:load`) y en el resto (`client:visible`: el HTML se renderiza en el build y Turnstile carga al entrar en viewport).
- **Copy**: `src/data/contact-form.ts` es la fuente única de textos y opciones (incluidas las etiquetas de los correos).
- **Módulos del servidor**: `schema`, `errors`, `origin`, `turnstile`, `ratelimit`, `resend`, `templates`, `handler`, `site-key` y `fetch`, todos en `src/lib/contact/`.

### Flujo de una solicitud

1. **Honeypot**: si el campo oculto `empresa` viene relleno, se responde éxito sin enviar nada.
2. **Origen**: se compara la cabecera `Origin` con la allowlist (`renovabit.com` y `www.renovabit.com` siempre; `localhost`, `127.0.0.1` y `*.workers.dev` solo fuera de producción). Sin cabecera se permite (clientes que no son navegadores).
3. **Turnstile**: verificación server-side contra `siteverify` (timeout de 10 s, fail-closed). Se rechaza sin token, sin secret, con el secret de prueba en producción o con un hostname fuera de la allowlist.
4. **Límite de envíos**: binding `CONTACT_RATE_LIMITER` (3 solicitudes por 60 s por IP; la clave es `contact:<ip>`).
5. **Validación**: esquema Valibot compartido.
6. **Correos**: notificación a `CONTACT_INBOX` y respuesta automática a la persona si dejó correo (con `Reply-To` apuntando a `CONTACT_INBOX`, para que sus respuestas lleguen a la bandeja). Si falla la notificación se devuelve error 500; si falla solo la respuesta automática, la consulta se considera recibida.

Códigos de error del endpoint: `campos` (400), `verificacion` (403), `limite` (429) y `envio` (500). La isla los traduce en `src/lib/contact/errors.ts`; el servidor nunca expone detalles internos.

## Atribución de origen

Los enlaces secundarios al formulario usan `/contacto/?desde=<ruta>`:

- `src/lib/contact/attribution.ts` valida el parámetro: debe ser una ruta interna que empiece con `/`, de máximo 120 caracteres y sin espacios ni caracteres raros.
- La isla (`ContactForm.tsx`) lo lee antes de limpiar `estado`/`motivo` de la URL y lo envía en el campo oculto `origen`. Con `desde` válido, el correo muestra `<ruta> (formulario de contacto)`; sin él, mantiene la ruta y el search actuales.
- En el evento de Umami `contact_form_submit` se agrega `{ desde }` cuando existe.

El CTA secundario `FormLink` (evento `contact_form_link`) se usa solo en páginas sin formulario embebido o con ancla local:

- Empresas: `empresas-form` apunta a `#contacto` (el formulario vive en la home).
- Blog: `blog-footer-form` navega a `/contacto/?desde=<post>#formulario`.
- `ServiceCTA` (`service-cta-form`): en las páginas con formulario embebido usa `href="#formulario"`; si se usara en una página sin formulario, el `formHref` por defecto navega a `/contacto/` con atribución.
- Barra sticky móvil de las landings (`StickyContactBar`, posición `sticky-bar`): su enlace de formulario apunta a `#formulario`. En móvil reemplaza al botón flotante de WhatsApp.

## Requisitos previos

- Sitio en Cloudflare con el dominio `renovabit.com` (para Turnstile y para el envío de correo).
- **Turnstile**: un widget para `renovabit.com` y `www.renovabit.com`. De ahí salen la sitekey (pública) y el secret.
- **Resend**: dominio verificado con los registros DNS (SPF/DKIM) y una API key. El remitente es `RenovaBit <no-reply@mail.renovabit.com>`.

## Configuración local

1. Copia los secrets locales: `cp .dev.vars.example .dev.vars`.
2. Copia las variables públicas: `cp .env.example .env` (incluye la sitekey de prueba `1x00000000000000000000AA`).
3. Arranca el sitio: `bun run dev` y abre `http://localhost:4321/contacto/`.

Con los valores de prueba, Turnstile siempre valida y los correos no se envían: se registran en la consola del servidor (`[contact] Correo simulado...`). El secret de prueba oficial es `1x0000000000000000000000000000000AA`. Si en `.dev.vars` colocas credenciales reales (sin `CONTACT_DEV_SIMULATE_EMAIL`), los correos se envían de verdad también en local.

`bun run preview` sirve un build de producción: en ese modo se rechazan el secret de prueba de Turnstile y los orígenes `localhost`, así que el flujo completo solo funciona con `bun run dev` (o con un secret real en `.dev.vars`).

Si `PUBLIC_TURNSTILE_SITE_KEY` no está definida en un build de producción, el formulario se renderiza en modo degradado (aviso y CTA de WhatsApp, sin envío) y se emite un aviso en consola durante el build.

## Configuración de producción

Secrets en runtime (nunca en el repositorio):

```sh
wrangler secret put RESEND_API_KEY
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put CONTACT_INBOX
```

La sitekey pública se inlinea en el build, así que debe estar definida antes de compilar:

```sh
# .env (o variable del entorno de build)
PUBLIC_TURNSTILE_SITE_KEY=<sitekey real>
bun run cf:deploy
```

El binding `CONTACT_RATE_LIMITER` se declara en `wrangler.jsonc` y se aprovisiona al desplegar. `CONTACT_DEV_SIMULATE_EMAIL` no debe definirse en producción.

## Variables de entorno

| Variable | Ámbito | Local | Producción |
|---|---|---|---|
| `PUBLIC_TURNSTILE_SITE_KEY` | Build, pública | `1x00000000000000000000AA` | Sitekey real del widget |
| `TURNSTILE_SECRET_KEY` | Runtime, secret | `1x0000000000000000000000000000000AA` | Secret real (`wrangler secret put`) |
| `RESEND_API_KEY` | Runtime, secret | Vacía (simulada con `CONTACT_DEV_SIMULATE_EMAIL=true`) | API key de Resend |
| `CONTACT_INBOX` | Runtime, secret | `contacto@renovabit.com` | Bandeja verificada |
| `CONTACT_DEV_SIMULATE_EMAIL` | Runtime, secret | `true` | No definir |

## Cómo probar el endpoint

Con el sitio en marcha (`bun run dev` o `bun run preview`), usando el puerto que muestre el comando (por defecto `4321`):

```sh
# Envío válido (con el secret y el token de prueba)
curl -s -X POST http://localhost:4321/api/contact \
  -H "Accept: application/json" \
  -F "nombre=Prueba Local" \
  -F "whatsapp=955315646" \
  -F "tipo=mantenimiento" \
  -F "mensaje=Prueba de formulario local" \
  -F "consent=on" \
  -F "cf-turnstile-response=test" \
  -F "origen=/contacto/"
# → {"ok":true}

# Sin token de Turnstile
# → {"ok":false,"code":"verificacion"} (403)

# Honeypot relleno: responde éxito pero no envía correo
# -F "empresa=spam" → {"ok":true}

# Sin cabecera Accept: redirige a /contacto/
# → 303 a /contacto/?estado=enviado#formulario
```

El límite es de 3 solicitudes por minuto: si repites las pruebas verás `{"ok":false,"code":"limite"}` (429). Espera 60 segundos para continuar.

## Vista previa de correos (temporal)

Las plantillas de `src/lib/contact/templates.ts` se pueden revisar sin enviar correos:

- `/dev/emails/`: vista de escritorio (640px) y móvil (375px) de ambos correos, con la versión de texto plano.
- `/dev/emails/notification/` y `/dev/emails/auto-reply/`: HTML real de cada correo.

En local: `bun run dev` y abrir `http://localhost:4321/dev/emails/`. Las rutas están excluidas del sitemap, llevan `X-Robots-Tag: noindex` (regla `/dev/*` en `public/_headers`) y usan datos de ejemplo de `src/pages/dev/emails/_sample.ts`.

Para eliminarla: borrar `src/pages/dev/` y la regla `/dev/*` de `public/_headers`.

## Mantenimiento

- `bun test` ejecuta las pruebas unitarias de los módulos de contacto (esquema, Turnstile, origen, límite, Resend, plantillas y orquestador).
- `bun run verify` ejecuta Biome, las pruebas, el type-check y el build.
