/**
 * Isla del formulario de contacto (Preact + Formisch + Valibot).
 *
 * El esquema se comparte con el endpoint: la validación del cliente es UX y la
 * del servidor es la que manda. Los errores de servidor se inyectan con
 * `setErrors` sin perder lo escrito. Sin sitekey de Turnstile el formulario se
 * renderiza en modo degradado (aviso + CTA de WhatsApp, sin envío).
 */

import type { SubmitEventHandler } from "@formisch/preact";
import { Field, Form, focus, setErrors, useForm } from "@formisch/preact";
import { useSignal, useSignalEffect } from "@preact/signals";
import { cn } from "cnfast";
import { useEffect, useRef } from "preact/hooks";
import { whatsappUrl } from "@/constants";
import {
	CONTACT_PREFERENCIA_OPTIONS,
	CONTACT_TIPO_OPTIONS,
	contactFormCopy,
} from "@/data/contact-form";
import { buildContactOrigin, readDesde } from "@/lib/contact/attribution";
import {
	CONTACT_ERROR_MESSAGES,
	type ContactErrorCode,
	isContactErrorCode,
} from "@/lib/contact/errors";
import {
	CONTACT_EMAIL_MAX,
	CONTACT_FIELD_KEYS,
	CONTACT_MENSAJE_MAX,
	CONTACT_NOMBRE_MAX,
	type ContactFieldErrors,
	contactSchema,
} from "@/lib/contact/schema";
import { TurnstileWidget, type TurnstileWidgetState } from "./TurnstileWidget";

const INPUT_CLASS = cn(
	"border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex h-10 w-full min-w-0 rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
	"aria-invalid:border-destructive aria-invalid:ring-destructive/30",
);

const TEXTAREA_CLASS = cn(
	"border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content flex min-h-20 w-full rounded-lg border px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50",
	"aria-invalid:border-destructive aria-invalid:ring-destructive/30",
);

const LABEL_CLASS = "flex select-none items-center gap-1.5 text-sm font-medium leading-none";

const BUTTON_CLASS = cn(
	"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:ring-offset-2 inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-transparent bg-primary bg-clip-padding px-8 text-base font-medium text-primary-foreground outline-none transition-all duration-150 select-none hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 h-12",
);

const WHATSAPP_BUTTON_CLASS =
	"inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#0f7a35] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0d6b2d]";

function describedBy(...ids: Array<string | undefined>): string | undefined {
	const values = ids.filter((id): id is string => Boolean(id));
	return values.length > 0 ? values.join(" ") : undefined;
}

function FieldError({ id, errors }: { id: string; errors: readonly string[] | null }) {
	const message = errors?.[0];
	if (!message) return null;
	return (
		<p id={id} class="text-sm text-destructive">
			{message}
		</p>
	);
}

function FieldHint({ id, text }: { id: string; text: string }) {
	return (
		<p id={id} class="text-xs text-muted-foreground">
			{text}
		</p>
	);
}

function RequiredMark() {
	return (
		<>
			<span class="text-destructive" aria-hidden="true">
				*
			</span>
			<span class="sr-only">{contactFormCopy.requiredHint}</span>
		</>
	);
}

interface ContactApiSuccess {
	ok: true;
}

interface ContactApiFailure {
	ok: false;
	code: ContactErrorCode;
	fieldErrors?: ContactFieldErrors;
}

type ContactApiResponse = ContactApiSuccess | ContactApiFailure;

function parseApiResponse(value: unknown): ContactApiResponse | null {
	if (typeof value !== "object" || value === null || !("ok" in value)) return null;
	const record = value as { ok: unknown; code?: unknown; fieldErrors?: unknown };
	if (record.ok === true) return { ok: true };
	if (record.ok === false && isContactErrorCode(record.code)) {
		return {
			ok: false,
			code: record.code,
			fieldErrors: (record.fieldErrors ?? undefined) as ContactFieldErrors | undefined,
		};
	}
	return null;
}

function track(event: string, data?: Record<string, unknown>): void {
	window.umami?.track(event, data);
}

function turnstileMessageFor(state: TurnstileWidgetState): string | null {
	switch (state) {
		case "error":
			return CONTACT_ERROR_MESSAGES.verificacion;
		case "expired":
			return contactFormCopy.turnstileExpired;
		case "timeout":
			return contactFormCopy.turnstileTimeout;
		default:
			return null;
	}
}

export interface ContactFormProps {
	siteKey?: string;
}

export function ContactForm({ siteKey }: ContactFormProps) {
	const form = useForm({
		schema: contactSchema,
		initialInput: { preferencia: "whatsapp" },
		emptyInput: { string: "", boolean: false },
		validate: "submit",
		revalidate: "input",
	});

	const turnstileToken = useSignal<string | null>(null);
	const turnstileEpoch = useSignal(0);
	const widgetState = useSignal<TurnstileWidgetState>("loading");
	const status = useSignal<"idle" | "success" | "error">("idle");
	const errorCode = useSignal<ContactErrorCode>("envio");
	const origen = useSignal("/contacto/");
	const desde = useSignal<string | null>(null);
	const successRef = useRef<HTMLDivElement>(null);

	// Mueve el foco al panel de éxito (envío completado o llegada con
	// `?estado=enviado`); `useSignalEffect` reacciona a los cambios del signal.
	useSignalEffect(() => {
		if (status.value === "success") successRef.current?.focus();
	});

	// Los signals de @preact/signals tienen identidad estable: no van en deps.
	// biome-ignore lint/correctness/useExhaustiveDependencies: signals estables
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		// Atribución: el search se lee antes de limpiar `estado` y `motivo`.
		desde.value = readDesde(window.location.search);
		origen.value = buildContactOrigin(window.location.pathname, window.location.search);

		const estado = params.get("estado");
		const motivo = params.get("motivo");
		if (estado === "enviado") status.value = "success";
		else if (estado === "error") {
			errorCode.value = isContactErrorCode(motivo) ? motivo : "envio";
			status.value = "error";
		}

		if (estado !== null || motivo !== null) {
			const url = new URL(window.location.href);
			url.searchParams.delete("estado");
			url.searchParams.delete("motivo");
			window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
		}
	}, []);

	function resetTurnstile(): void {
		turnstileToken.value = null;
		widgetState.value = "loading";
		turnstileEpoch.value += 1;
	}

	function applyFieldErrors(errors: ContactFieldErrors): void {
		for (const key of CONTACT_FIELD_KEYS) {
			const message = errors[key];
			if (message) setErrors(form, { path: [key], errors: [message] });
		}
	}

	const submitForm: SubmitEventHandler<typeof contactSchema> = async (output, event) => {
		// Modo degradado (sin sitekey): el formulario no se envía.
		if (!siteKey || !turnstileToken.value) return;

		const formElement = event.target;
		if (!(formElement instanceof HTMLFormElement)) return;

		// Formisch nombra los campos con su ruta codificada (`["nombre"]`), así que
		// el cuerpo se arma con la salida validada más los campos auxiliares.
		const raw = new FormData(formElement);
		const body = new FormData();
		body.set("nombre", output.nombre);
		body.set("whatsapp", output.whatsapp);
		body.set("email", output.email);
		body.set("tipo", output.tipo);
		body.set("mensaje", output.mensaje);
		body.set("preferencia", output.preferencia);
		body.set("consent", output.consent ? "on" : "off");
		body.set("empresa", String(raw.get("empresa") ?? ""));
		body.set("origen", origen.value);
		body.set("cf-turnstile-response", turnstileToken.value);

		try {
			const response = await fetch("/api/contact", {
				method: "POST",
				body,
				headers: { Accept: "application/json" },
			});
			const payload = parseApiResponse(await response.json());

			if (payload?.ok) {
				status.value = "success";
				track("contact_form_submit", desde.value ? { desde: desde.value } : undefined);
				return;
			}

			const code = payload?.code ?? "envio";
			if (code === "campos" && payload?.fieldErrors) {
				applyFieldErrors(payload.fieldErrors);
				const firstFailed = CONTACT_FIELD_KEYS.find((key) => payload.fieldErrors?.[key]);
				if (firstFailed) focus(form, { path: [firstFailed] });
			}
			errorCode.value = code;
			status.value = "error";
			track("contact_form_error", { code });
		} catch {
			errorCode.value = "envio";
			status.value = "error";
			track("contact_form_error", { code: "envio" });
		} finally {
			// El token de Turnstile es de un solo uso: tras cada intento se pide uno nuevo.
			if (status.value !== "success") resetTurnstile();
		}
	};

	const turnstileMessage = turnstileMessageFor(widgetState.value);

	if (status.value === "success") {
		return (
			<div
				ref={successRef}
				role="status"
				tabIndex={-1}
				class="rounded-2xl border border-border/40 bg-card p-8 text-center sm:p-10"
			>
				<h3 class="font-heading text-2xl font-bold tracking-tight text-foreground">
					{contactFormCopy.successTitle}
				</h3>
				<p class="mt-3 text-base leading-relaxed text-muted-foreground">
					{contactFormCopy.successMessage}
				</p>
				<a
					href={whatsappUrl("Hola, acabo de enviar el formulario y quiero confirmar mi consulta.")}
					target="_blank"
					rel="noopener noreferrer"
					class={cn(WHATSAPP_BUTTON_CLASS, "mt-6")}
					data-umami-event="whatsapp_click"
					data-umami-event-position="contact-form-success"
				>
					{contactFormCopy.whatsappCta}
				</a>
			</div>
		);
	}

	return (
		<Form of={form} onSubmit={submitForm} class="space-y-5">
			{/* Honeypot: invisible para personas, los bots lo rellenan. */}
			<div class="sr-only" aria-hidden="true">
				<label for="contact-empresa">No completar este campo</label>
				<input id="contact-empresa" name="empresa" type="text" tabIndex={-1} autoComplete="off" />
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<Field of={form} path={["nombre"]}>
					{(field) => {
						const errorId = "contact-nombre-error";
						const hasError = Boolean(field.errors.value);
						return (
							<div class="space-y-2">
								<label for="contact-nombre" class={LABEL_CLASS}>
									{contactFormCopy.fields.nombre.label}
									<RequiredMark />
								</label>
								<input
									{...field.props}
									id="contact-nombre"
									type="text"
									class={INPUT_CLASS}
									value={field.input.value ?? ""}
									autoComplete="name"
									maxLength={CONTACT_NOMBRE_MAX}
									aria-invalid={hasError}
									aria-describedby={describedBy(hasError ? errorId : undefined)}
								/>
								<FieldError id={errorId} errors={field.errors.value} />
							</div>
						);
					}}
				</Field>

				<Field of={form} path={["whatsapp"]}>
					{(field) => {
						const hintId = "contact-whatsapp-hint";
						const errorId = "contact-whatsapp-error";
						const hasError = Boolean(field.errors.value);
						return (
							<div class="space-y-2">
								<label for="contact-whatsapp" class={LABEL_CLASS}>
									{contactFormCopy.fields.whatsapp.label}
									<RequiredMark />
								</label>
								<input
									{...field.props}
									id="contact-whatsapp"
									type="tel"
									inputMode="tel"
									class={INPUT_CLASS}
									value={field.input.value ?? ""}
									autoComplete="tel"
									maxLength={20}
									aria-invalid={hasError}
									aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
								/>
								<FieldHint id={hintId} text={contactFormCopy.fields.whatsapp.hint} />
								<FieldError id={errorId} errors={field.errors.value} />
							</div>
						);
					}}
				</Field>
			</div>

			<Field of={form} path={["email"]}>
				{(field) => {
					const hintId = "contact-email-hint";
					const errorId = "contact-email-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="contact-email" class={LABEL_CLASS}>
								{contactFormCopy.fields.email.label}
							</label>
							<input
								{...field.props}
								id="contact-email"
								type="email"
								class={INPUT_CLASS}
								value={field.input.value ?? ""}
								autoComplete="email"
								maxLength={CONTACT_EMAIL_MAX}
								aria-invalid={hasError}
								aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
							/>
							<FieldHint id={hintId} text={contactFormCopy.fields.email.hint} />
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["tipo"]}>
				{(field) => {
					const errorId = "contact-tipo-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="contact-tipo" class={LABEL_CLASS}>
								{contactFormCopy.fields.tipo.label}
								<RequiredMark />
							</label>
							<select
								{...field.props}
								id="contact-tipo"
								class={INPUT_CLASS}
								value={field.input.value ?? ""}
								aria-invalid={hasError}
								aria-describedby={describedBy(hasError ? errorId : undefined)}
							>
								<option value="" disabled>
									{contactFormCopy.fields.tipo.placeholder}
								</option>
								{CONTACT_TIPO_OPTIONS.map((option) => (
									<option key={option.value} value={option.value}>
										{option.label}
									</option>
								))}
							</select>
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["mensaje"]}>
				{(field) => {
					const errorId = "contact-mensaje-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="contact-mensaje" class={LABEL_CLASS}>
								{contactFormCopy.fields.mensaje.label}
								<RequiredMark />
							</label>
							<textarea
								{...field.props}
								id="contact-mensaje"
								rows={5}
								class={TEXTAREA_CLASS}
								value={field.input.value ?? ""}
								maxLength={CONTACT_MENSAJE_MAX}
								aria-invalid={hasError}
								aria-describedby={describedBy(hasError ? errorId : undefined)}
							/>
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["preferencia"]}>
				{(field) => {
					const errorId = "contact-preferencia-error";
					const hasError = Boolean(field.errors.value);
					return (
						<fieldset>
							<legend class={LABEL_CLASS}>{contactFormCopy.fields.preferencia.label}</legend>
							<div class="mt-3 flex flex-wrap gap-x-6 gap-y-3">
								{CONTACT_PREFERENCIA_OPTIONS.map((option) => (
									<label
										key={option.value}
										for={`contact-preferencia-${option.value}`}
										class="flex cursor-pointer items-center gap-2 text-sm text-foreground"
									>
										<input
											{...field.props}
											id={`contact-preferencia-${option.value}`}
											type="radio"
											value={option.value}
											checked={field.input.value === option.value}
											class="size-4 accent-primary"
											aria-invalid={hasError}
											aria-describedby={describedBy(hasError ? errorId : undefined)}
										/>
										{option.label}
									</label>
								))}
							</div>
							<FieldError id={errorId} errors={field.errors.value} />
						</fieldset>
					);
				}}
			</Field>

			<Field of={form} path={["consent"]}>
				{(field) => {
					const errorId = "contact-consent-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label
								for="contact-consent"
								class="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground"
							>
								<input
									{...field.props}
									id="contact-consent"
									type="checkbox"
									class="mt-0.5 size-4 shrink-0 accent-primary"
									checked={field.input.value === true}
									aria-invalid={hasError}
									aria-describedby={describedBy(hasError ? errorId : undefined)}
								/>
								{contactFormCopy.fields.consent.label}{" "}
								<a
									href={contactFormCopy.fields.consent.link.href}
									target="_blank"
									rel="noopener noreferrer"
									class="font-medium text-primary underline underline-offset-2"
								>
									{contactFormCopy.fields.consent.link.label}
								</a>
								.
							</label>
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<input type="hidden" name="origen" value={origen.value} />

			{status.value === "error" && (
				<p
					role="alert"
					class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
				>
					{CONTACT_ERROR_MESSAGES[errorCode.value]}
				</p>
			)}

			{siteKey ? (
				<div class="space-y-4">
					<TurnstileWidget
						key={turnstileEpoch.value}
						siteKey={siteKey}
						onToken={(token) => {
							turnstileToken.value = token;
						}}
						onStateChange={(state) => {
							widgetState.value = state;
						}}
					/>
					{turnstileMessage && (
						<p role="alert" class="text-sm text-destructive">
							{turnstileMessage}
						</p>
					)}
					<button
						type="submit"
						class={BUTTON_CLASS}
						disabled={form.isSubmitting.value || !turnstileToken.value}
						aria-busy={form.isSubmitting.value}
					>
						{form.isSubmitting.value ? contactFormCopy.sending : contactFormCopy.submit}
					</button>
				</div>
			) : (
				<div class="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
					<p class="text-sm leading-relaxed text-muted-foreground">
						{contactFormCopy.turnstileUnavailable}
					</p>
					<a
						href={whatsappUrl("Hola, quiero hacer una consulta.")}
						target="_blank"
						rel="noopener noreferrer"
						class={WHATSAPP_BUTTON_CLASS}
						data-umami-event="whatsapp_click"
						data-umami-event-position="contact-form-degraded"
					>
						{contactFormCopy.whatsappCta}
					</a>
				</div>
			)}
		</Form>
	);
}
