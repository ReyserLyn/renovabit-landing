# Cloudflare Access para el panel de reseñas

Guía para proteger `https://renovabit.com/admin/` con Cloudflare Access (Zero Trust). Sin esto, el panel responde 403 en producción por la defensa fail-closed del código.

Cloudflare Access en el plan gratuito permite hasta **50 usuarios**. El método de acceso por PIN de un solo uso (One-time PIN) no requiere proveedor externo.

> Configura Access **antes** de deployar el panel. Si el Worker se despliega primero, el panel queda inaccesible (403) hasta que exista la aplicación de Access, que es el comportamiento seguro.

## 1. Activar Zero Trust

1. Entra a `https://dash.cloudflare.com` con la cuenta de RenovaBit.
2. En la barra lateral, abre **Zero Trust**.
3. La primera vez pide elegir un **team name**. Usa uno corto y reconocible, por ejemplo `renovabit`. Queda asociado al dominio `renovabit.cloudflareaccess.com`.
4. Elige el plan **Free** (hasta 50 usuarios). No hace falta tarjeta.

## 2. Crear la aplicación self-hosted

1. En Zero Trust, ve a **Access > Applications** y pulsa **Add an application > Self-hosted**.
2. Completa:
   - **Application name**: `Panel de reseñas RenovaBit`.
   - **Session duration**: `24 hours` (o `1 week` si prefieres no reautenticar seguido).
3. En **Application domain**, configura el hostname público:
   - **Subdomain**: déjalo vacío.
   - **Domain**: `renovabit.com`.
   - **Path**: `admin`.
   - La coincidencia por path cubre todo lo que cuelga de `/admin/`: el panel, el endpoint POST y la ruta de la foto.
4. Pulsa **Next**.

## 3. Agregar la política de acceso

1. En **Policies**, pulsa **Add a policy**.
2. Completa:
   - **Policy name**: `Administradores RenovaBit`.
   - **Action**: `Allow`.
3. En **Configure rules**, agrega un selector:
   - **Selector**: `Emails`.
   - **Value**: el correo del administrador (por ejemplo `reyserlyn@renovabit.com`). Puedes agregar más correos con **Add rule**.
4. Pulsa **Next**.

## 4. Métodos de acceso

1. En **Authentication**, deja habilitado **One-time PIN**: Access envía un código al correo autorizado y con eso se entra. No hace falta configurar nada más.
2. Opcional: agrega Google o Microsoft como proveedor de identidad si prefieres un clic en lugar del PIN.
3. Pulsa **Add application** para guardar.

## 5. Probar

1. Abre una ventana de incógnito y entra a `https://renovabit.com/admin/resenas/`.
2. Access debe pedir el correo. Escribe el correo autorizado.
3. Revisa la bandeja: llega un PIN. Ingrésalo y deberías ver el panel.
4. Prueba con un correo que no esté en la política: Access debe bloquear el acceso.

Si en su lugar ves un 403 en texto plano, la aplicación de Access no está aplicando al path o el header no llega al Worker. Revisa el path (`admin`) y que el dominio sea `renovabit.com`.

## Cómo interactúa con el Worker

Cloudflare Access autentica la petición antes de que llegue al Worker y le agrega el header `cf-access-authenticated-user-email` con el correo de la persona. El panel, el endpoint POST y la ruta de la foto exigen ese header en producción (`accesoPermitido` en `src/lib/resenas/admin.ts`): si no llega, responden 403 aunque la ruta quedara expuesta por error.

En local (`bun run dev`) no hay Access y la comprobación se omite, porque el servidor escucha solo en `localhost`. No publiques el puerto local con un túnel (por ejemplo `cloudflared tunnel`) mientras no haya Access: eso dejaría el panel abierto a internet.

## Mantenimiento

- Para agregar o quitar administradores, edita la política en **Access > Applications > Panel de reseñas RenovaBit > Policies**.
- Para auditar accesos, revisa **Logs > Access** en Zero Trust.
- Si cambias el dominio del sitio, actualiza el hostname público de la aplicación.
