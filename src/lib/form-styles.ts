/**
 * Clases compartidas de los formularios (islas Preact).
 *
 * Las islas Preact no pueden renderizar los componentes .astro del kit de UI,
 * así que los campos se construyen con HTML nativo. Centralizar las clases aquí
 * evita que el formulario de contacto y el de reseñas se desincronicen.
 */

import { cn } from "cnfast";

/** Campo de texto de una línea. */
export const INPUT_CLASS = cn(
	"border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
	"aria-invalid:border-destructive aria-invalid:ring-destructive/30",
);

/** Campo de texto multilínea. */
export const TEXTAREA_CLASS = cn(
	"border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content flex min-h-20 w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
	"aria-invalid:border-destructive aria-invalid:ring-destructive/30",
);

/** Etiqueta de campo. */
export const LABEL_CLASS = "flex select-none items-center gap-1.5 text-sm font-medium leading-none";

/** Botón principal (enviar). */
export const BUTTON_CLASS = cn(
	"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:ring-offset-2 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-primary bg-clip-padding px-8 text-base font-medium text-primary-foreground outline-none transition-all duration-150 select-none hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 h-12",
);

/** Acción de WhatsApp. */
export const WHATSAPP_BUTTON_CLASS =
	"inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#0f7a35] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0d6b2d]";
