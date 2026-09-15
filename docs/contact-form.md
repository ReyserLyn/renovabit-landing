# Formulario de contacto

Formulario de `/contacto/` con validación compartida entre cliente y servidor, defensas anti-bot y envío de correos. En esta versión no se almacena nada: la consulta llega por correo.

## Arquitectura

- **Una sola ruta on-demand**: `src/pages/api/contact.ts` (`export const prerender = false`). El resto del sitio sigue estático y se sirve desde assets.
- **Validación SSOT**: `src/lib/contact/schema.ts` (Valibot). La isla la usa para la experiencia de usuario y el endpoint la vuelve a ejecutar como autoridad.
- **Isla Preact**: `src/components/contact/ContactForm.tsx` con Formisch (`@formisch/preact`) y `@preact/signals`. El widget de Turnstile vive en `src/components/contact/TurnstileWidget.tsx`.
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

## Requisitos previos

- Sitio en Cloudflare con el dominio `renovabit.com` (para Turnstile y para el envío de correo).
- **Turnstile**: un widget para `renovabit.com` y `www.renovabit.com`. De ahí salen la sitekey (pública) y el secret.
- **Resend**: dominio verificado con los registros DNS (SPF/DKIM) y una API key. El remitente es `RenovaBit <no-reply@mail.renovabit.com>`.

## Configuración local

1. Copia los secrets locales: `cp .dev.vars.example .dev.vars`.
2. Copia las variables públicas: `cp .env.example .env` (incluye la sitekey de prueba `1x00000000000000000000AA`).
3. Arranca el sitio: `bun run dev` y abre `http://localhost:3000/contacto/`.

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

Con el sitio en marcha (`bun run dev` o `bun run preview`), usando el puerto que muestre el comando (por defecto `3000`):

```sh
# Envío válido (con el secret y el token de prueba)
curl -s -X POST http://localhost:3000/api/contact \
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

## Mantenimiento

- `bun test` ejecuta las pruebas unitarias de los módulos de contacto (esquema, Turnstile, origen, límite, Resend, plantillas y orquestador).
- `bun run verify` ejecuta Biome, las pruebas, el type-check y el build.
