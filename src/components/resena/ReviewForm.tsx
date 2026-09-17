/**
 * Isla del formulario de reseñas (Preact + Formisch + Valibot).
 *
 * El esquema se comparte con el endpoint: la validación del cliente es UX y la
 * del servidor es la que manda. La foto se redimensiona a 1600px y se re-encodea
 * a WebP en el navegador (además quita el EXIF) antes de enviarla. Sin sitekey
 * de Turnstile el formulario se renderiza en modo degradado, sin envío.
 */

import type { SubmitEventHandler } from "@formisch/preact";
import { Field, Form, focus, setErrors, setInput, useForm } from "@formisch/preact";
import { useSignal, useSignalEffect } from "@preact/signals";
import { cn } from "cnfast";
import { useEffect, useRef, useState } from "preact/hooks";
import { TurnstileWidget, type TurnstileWidgetState } from "@/components/contact/TurnstileWidget";
import { whatsappUrl } from "@/constants";
import { RESENA_ESTRELLAS_OPTIONS, resenaFormCopy } from "@/data/resena-form";
import { RESENA_SERVICIO_OPTIONS } from "@/data/resenas-servicios";
import {
	isResenaErrorCode,
	RESENA_ERROR_MESSAGES,
	type ResenaErrorCode,
} from "@/lib/resenas/errors";
import {
	RESENA_COMENTARIO_MAX,
	RESENA_CONTACTO_MAX,
	RESENA_EMPRESA_MAX,
	RESENA_FIELD_KEYS,
	RESENA_NOMBRE_MAX,
	RESENA_SERVICIO_DETALLE_MAX,
	type ResenaFieldErrors,
	resenaSchema,
} from "@/lib/resenas/schema";

const MAX_FOTO_INPUT_BYTES = 15 * 1024 * 1024;
const MAX_FOTO_DIMENSION = 1600;
const WEBP_QUALITY = 0.8;

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

const SECONDARY_BUTTON_CLASS =
	"inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted";

const WHATSAPP_BUTTON_CLASS =
	"inline-flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#0f7a35] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0d6b2d]";

const STAR_CLASS =
	"flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-border/60 bg-background text-2xl leading-none transition-colors select-none hover:border-primary/60";

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
			<span class="sr-only">{resenaFormCopy.requiredHint}</span>
		</>
	);
}

interface ResenaApiSuccess {
	ok: true;
}

interface ResenaApiFailure {
	ok: false;
	code: ResenaErrorCode;
	fieldErrors?: ResenaFieldErrors;
}

type ResenaApiResponse = ResenaApiSuccess | ResenaApiFailure;

function parseApiResponse(value: unknown): ResenaApiResponse | null {
	if (typeof value !== "object" || value === null || !("ok" in value)) return null;
	const record = value as { ok: unknown; code?: unknown; fieldErrors?: unknown };
	if (record.ok === true) return { ok: true };
	if (record.ok === false && isResenaErrorCode(record.code)) {
		return {
			ok: false,
			code: record.code,
			fieldErrors: (record.fieldErrors ?? undefined) as ResenaFieldErrors | undefined,
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
			return RESENA_ERROR_MESSAGES.verificacion;
		case "expired":
			return resenaFormCopy.turnstileExpired;
		case "timeout":
			return resenaFormCopy.turnstileTimeout;
		default:
			return null;
	}
}

/**
 * Redimensiona la foto a un máximo de 1600px y la re-encodea a WebP 0.8.
 * El paso por canvas además elimina los metadatos EXIF (incluida la geolocalización).
 * Devuelve `null` si el navegador no puede procesar la imagen.
 */
async function resizeFoto(file: File): Promise<File | null> {
	try {
		const bitmap = await createImageBitmap(file);
		const scale = Math.min(1, MAX_FOTO_DIMENSION / Math.max(bitmap.width, bitmap.height));
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));
		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		const context = canvas.getContext("2d");
		if (!context) {
			bitmap.close();
			return null;
		}
		context.drawImage(bitmap, 0, 0, width, height);
		bitmap.close();
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(resolve, "image/webp", WEBP_QUALITY);
		});
		if (!blob) return null;
		const name = file.name.replace(/\.[^.]+$/, "") || "foto";
		return new File([blob], `${name}.webp`, { type: "image/webp" });
	} catch {
		return null;
	}
}

export interface ReviewFormProps {
	siteKey?: string;
}

export function ReviewForm({ siteKey }: ReviewFormProps) {
	const form = useForm({
		schema: resenaSchema,
		emptyInput: { string: "", boolean: false },
		validate: "submit",
		revalidate: "input",
	});

	const turnstileToken = useSignal<string | null>(null);
	const turnstileEpoch = useSignal(0);
	const widgetState = useSignal<TurnstileWidgetState>("loading");
	const status = useSignal<"idle" | "success" | "error">("idle");
	const errorCode = useSignal<ResenaErrorCode>("envio");
	const mountedAt = useSignal(Date.now());
	const submittedNombre = useSignal("");
	const [fotoPreview, setFotoPreview] = useState<string | null>(null);
	const [fotoMessage, setFotoMessage] = useState<string | null>(null);
	const successRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Mueve el foco al panel de éxito; `useSignalEffect` reacciona a los signals.
	useSignalEffect(() => {
		if (status.value === "success") successRef.current?.focus();
	});

	// Revoca el object URL de la vista previa al desmontar o al cambiar de foto.
	useEffect(() => {
		return () => {
			if (fotoPreview) URL.revokeObjectURL(fotoPreview);
		};
	}, [fotoPreview]);

	function resetTurnstile(): void {
		turnstileToken.value = null;
		widgetState.value = "loading";
		turnstileEpoch.value += 1;
	}

	function applyFieldErrors(errors: ResenaFieldErrors): void {
		for (const key of RESENA_FIELD_KEYS) {
			const message = errors[key];
			if (message) setErrors(form, { path: [key], errors: [message] });
		}
	}

	function clearFoto(): void {
		setInput(form, { path: ["foto"], input: undefined });
		setFotoPreview((previous) => {
			if (previous) URL.revokeObjectURL(previous);
			return null;
		});
		setFotoMessage(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}

	async function handleFotoChange(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) {
			clearFoto();
			return;
		}
		if (file.size > MAX_FOTO_INPUT_BYTES) {
			clearFoto();
			setFotoMessage(resenaFormCopy.fields.foto.tooLarge);
			return;
		}
		setFotoMessage(resenaFormCopy.fields.foto.processing);
		const processed = await resizeFoto(file);
		if (!processed) {
			clearFoto();
			setFotoMessage(resenaFormCopy.fields.foto.unreadable);
			return;
		}
		setInput(form, { path: ["foto"], input: processed });
		setFotoPreview((previous) => {
			if (previous) URL.revokeObjectURL(previous);
			return URL.createObjectURL(processed);
		});
		setFotoMessage(null);
	}

	const submitForm: SubmitEventHandler<typeof resenaSchema> = async (output, event) => {
		// Modo degradado (sin sitekey): el formulario no se envía.
		if (!siteKey || !turnstileToken.value) return;

		const formElement = event.target;
		if (!(formElement instanceof HTMLFormElement)) return;

		// Formisch nombra los campos con su ruta codificada (`["nombre"]`), así que
		// el cuerpo se arma con la salida validada más los campos auxiliares.
		const raw = new FormData(formElement);
		const body = new FormData();
		body.set("nombre", output.nombre);
		body.set("empresa", output.empresa);
		body.set("servicio_id", output.servicio_id);
		body.set("servicio_detalle", output.servicio_detalle);
		body.set("estrellas", String(output.estrellas));
		body.set("comentario", output.comentario);
		body.set("contacto", output.contacto);
		body.set("consentimiento", output.consentimiento ? "on" : "off");
		body.set("referencia", String(raw.get("referencia") ?? ""));
		body.set("ts", String(mountedAt.value));
		body.set("cf-turnstile-response", turnstileToken.value);
		if (output.foto) body.set("foto", output.foto, output.foto.name);

		try {
			const response = await fetch("/api/resenas", {
				method: "POST",
				body,
				headers: { Accept: "application/json" },
			});
			const payload = parseApiResponse(await response.json());

			if (payload?.ok) {
				submittedNombre.value = output.nombre;
				status.value = "success";
				track("resena_form_submit", { estrellas: output.estrellas });
				return;
			}

			const code = payload?.code ?? "envio";
			if (code === "campos" && payload?.fieldErrors) {
				applyFieldErrors(payload.fieldErrors);
				const firstFailed = RESENA_FIELD_KEYS.find((key) => payload.fieldErrors?.[key]);
				if (firstFailed === "foto") fileInputRef.current?.focus();
				else if (firstFailed) focus(form, { path: [firstFailed] });
			}
			errorCode.value = code;
			status.value = "error";
			track("resena_form_error", { code });
		} catch {
			errorCode.value = "envio";
			status.value = "error";
			track("resena_form_error", { code: "envio" });
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
					{resenaFormCopy.successTitle(submittedNombre.value)}
				</h3>
				<p class="mt-3 text-base leading-relaxed text-muted-foreground">
					{resenaFormCopy.successMessage}
				</p>
				<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
					{resenaFormCopy.successNote}
				</p>
			</div>
		);
	}

	return (
		<Form of={form} onSubmit={submitForm} class="space-y-6">
			{/* Honeypot: invisible para personas, los bots lo rellenan. */}
			<div class="sr-only" aria-hidden="true">
				<label for="resena-referencia">No completar este campo</label>
				<input
					id="resena-referencia"
					name="referencia"
					type="text"
					tabIndex={-1}
					autoComplete="off"
				/>
			</div>
			<input type="hidden" name="ts" value={String(mountedAt.value)} />

			<div class="grid gap-6 sm:grid-cols-2">
				<Field of={form} path={["nombre"]}>
					{(field) => {
						const errorId = "resena-nombre-error";
						const hasError = Boolean(field.errors.value);
						return (
							<div class="space-y-2">
								<label for="resena-nombre" class={LABEL_CLASS}>
									{resenaFormCopy.fields.nombre.label}
									<RequiredMark />
								</label>
								<input
									{...field.props}
									id="resena-nombre"
									type="text"
									class={INPUT_CLASS}
									value={field.input.value ?? ""}
									autoComplete="name"
									maxLength={RESENA_NOMBRE_MAX}
									aria-invalid={hasError}
									aria-describedby={describedBy(hasError ? errorId : undefined)}
								/>
								<FieldError id={errorId} errors={field.errors.value} />
							</div>
						);
					}}
				</Field>

				<Field of={form} path={["empresa"]}>
					{(field) => {
						const hintId = "resena-empresa-hint";
						const errorId = "resena-empresa-error";
						const hasError = Boolean(field.errors.value);
						return (
							<div class="space-y-2">
								<label for="resena-empresa" class={LABEL_CLASS}>
									{resenaFormCopy.fields.empresa.label}
								</label>
								<input
									{...field.props}
									id="resena-empresa"
									type="text"
									class={INPUT_CLASS}
									value={field.input.value ?? ""}
									autoComplete="organization"
									maxLength={RESENA_EMPRESA_MAX}
									aria-invalid={hasError}
									aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
								/>
								<FieldHint id={hintId} text={resenaFormCopy.fields.empresa.hint} />
								<FieldError id={errorId} errors={field.errors.value} />
							</div>
						);
					}}
				</Field>
			</div>

			<Field of={form} path={["servicio_id"]}>
				{(field) => {
					const errorId = "resena-servicio-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="resena-servicio" class={LABEL_CLASS}>
								{resenaFormCopy.fields.servicio.label}
								<RequiredMark />
							</label>
							<select
								{...field.props}
								id="resena-servicio"
								class={INPUT_CLASS}
								value={field.input.value ?? ""}
								aria-invalid={hasError}
								aria-describedby={describedBy(hasError ? errorId : undefined)}
							>
								<option value="" disabled>
									{resenaFormCopy.fields.servicio.placeholder}
								</option>
								{RESENA_SERVICIO_OPTIONS.map((option) => (
									<option key={option.id} value={option.id}>
										{option.label}
									</option>
								))}
							</select>
							{field.input.value === "otro" && (
								<Field of={form} path={["servicio_detalle"]}>
									{(detalleField) => {
										const detalleErrorId = "resena-servicio-detalle-error";
										const detalleHasError = Boolean(detalleField.errors.value);
										return (
											<div class="space-y-2 pt-2">
												<label for="resena-servicio-detalle" class={LABEL_CLASS}>
													{resenaFormCopy.fields.servicioDetalle.label}
													<RequiredMark />
												</label>
												<input
													{...detalleField.props}
													id="resena-servicio-detalle"
													type="text"
													class={INPUT_CLASS}
													value={detalleField.input.value ?? ""}
													placeholder={resenaFormCopy.fields.servicioDetalle.placeholder}
													maxLength={RESENA_SERVICIO_DETALLE_MAX}
													aria-invalid={detalleHasError}
													aria-describedby={describedBy(
														detalleHasError ? detalleErrorId : undefined,
													)}
												/>
												<FieldError id={detalleErrorId} errors={detalleField.errors.value} />
											</div>
										);
									}}
								</Field>
							)}
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["estrellas"]}>
				{(field) => {
					const hintId = "resena-estrellas-hint";
					const errorId = "resena-estrellas-error";
					const hasError = Boolean(field.errors.value);
					const selected = Number(field.input.value);
					const selectedOption = RESENA_ESTRELLAS_OPTIONS.find(
						(option) => option.value === selected,
					);
					return (
						<fieldset
							aria-invalid={hasError}
							aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
						>
							<legend class={LABEL_CLASS}>
								{resenaFormCopy.fields.estrellas.label}
								<RequiredMark />
							</legend>
							<div class="mt-3 flex flex-wrap gap-2">
								{RESENA_ESTRELLAS_OPTIONS.map((option) => (
									<label key={option.value} class={STAR_CLASS}>
										<input
											{...field.props}
											id={`resena-estrellas-${option.value}`}
											type="radio"
											value={String(option.value)}
											checked={selected === option.value}
											class="sr-only peer"
											aria-invalid={hasError}
										/>
										<span
											aria-hidden="true"
											class={cn(
												selected >= option.value ? "text-amber-500" : "text-muted-foreground/40",
												"rounded peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
											)}
										>
											★
										</span>
										<span class="sr-only">{option.label}</span>
									</label>
								))}
							</div>
							<p id={hintId} class="mt-2 text-xs text-muted-foreground">
								{selectedOption
									? `${selectedOption.label} (${selected} de 5)`
									: resenaFormCopy.fields.estrellas.hint}
							</p>
							<FieldError id={errorId} errors={field.errors.value} />
						</fieldset>
					);
				}}
			</Field>

			<Field of={form} path={["comentario"]}>
				{(field) => {
					const errorId = "resena-comentario-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="resena-comentario" class={LABEL_CLASS}>
								{resenaFormCopy.fields.comentario.label}
								<RequiredMark />
							</label>
							<textarea
								{...field.props}
								id="resena-comentario"
								rows={5}
								class={TEXTAREA_CLASS}
								value={field.input.value ?? ""}
								placeholder={resenaFormCopy.fields.comentario.placeholder}
								maxLength={RESENA_COMENTARIO_MAX}
								aria-invalid={hasError}
								aria-describedby={describedBy(hasError ? errorId : undefined)}
							/>
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["contacto"]}>
				{(field) => {
					const hintId = "resena-contacto-hint";
					const errorId = "resena-contacto-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label for="resena-contacto" class={LABEL_CLASS}>
								{resenaFormCopy.fields.contacto.label}
							</label>
							<input
								{...field.props}
								id="resena-contacto"
								type="text"
								class={INPUT_CLASS}
								value={field.input.value ?? ""}
								autoComplete="email"
								maxLength={RESENA_CONTACTO_MAX}
								aria-invalid={hasError}
								aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
							/>
							<FieldHint id={hintId} text={resenaFormCopy.fields.contacto.hint} />
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["foto"]}>
				{(field) => {
					const hintId = "resena-foto-hint";
					const errorId = "resena-foto-error";
					const error = field.errors.value?.[0] ?? fotoMessage ?? undefined;
					const hasError = Boolean(error);
					return (
						<div class="space-y-2">
							<label for="resena-foto" class={LABEL_CLASS}>
								{resenaFormCopy.fields.foto.label}
							</label>
							<input
								ref={fileInputRef}
								id="resena-foto"
								name="foto"
								type="file"
								accept="image/jpeg,image/png,image/webp"
								class={INPUT_CLASS}
								onChange={(event) => void handleFotoChange(event)}
								aria-invalid={hasError}
								aria-describedby={describedBy(hintId, hasError ? errorId : undefined)}
							/>
							{fotoPreview && (
								<div class="flex items-center gap-3">
									<img
										src={fotoPreview}
										alt={resenaFormCopy.fields.foto.previewAlt}
										class="size-20 rounded-lg border border-border/60 object-cover"
									/>
									<button type="button" class={SECONDARY_BUTTON_CLASS} onClick={clearFoto}>
										{resenaFormCopy.fields.foto.removeLabel}
									</button>
								</div>
							)}
							<FieldHint id={hintId} text={resenaFormCopy.fields.foto.hint} />
							{error && (
								<p id={errorId} class="text-sm text-destructive">
									{error}
								</p>
							)}
						</div>
					);
				}}
			</Field>

			<Field of={form} path={["consentimiento"]}>
				{(field) => {
					const errorId = "resena-consentimiento-error";
					const hasError = Boolean(field.errors.value);
					return (
						<div class="space-y-2">
							<label
								for="resena-consentimiento"
								class="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground"
							>
								<input
									{...field.props}
									id="resena-consentimiento"
									type="checkbox"
									class="mt-0.5 size-4 shrink-0 accent-primary"
									checked={field.input.value === true}
									aria-invalid={hasError}
									aria-describedby={describedBy(hasError ? errorId : undefined)}
								/>
								{resenaFormCopy.fields.consent.label}{" "}
								<a
									href={resenaFormCopy.fields.consent.link.href}
									target="_blank"
									rel="noopener noreferrer"
									class="font-medium text-primary underline underline-offset-2"
								>
									{resenaFormCopy.fields.consent.link.label}
								</a>
								.
							</label>
							<FieldError id={errorId} errors={field.errors.value} />
						</div>
					);
				}}
			</Field>

			{status.value === "error" && (
				<p
					role="alert"
					class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
				>
					{RESENA_ERROR_MESSAGES[errorCode.value]}
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
						{form.isSubmitting.value ? resenaFormCopy.sending : resenaFormCopy.submit}
					</button>
				</div>
			) : (
				<div class="space-y-4 rounded-lg border border-border bg-muted/40 p-4">
					<p class="text-sm leading-relaxed text-muted-foreground">
						{resenaFormCopy.turnstileUnavailable}
					</p>
					<a
						href={whatsappUrl("Hola, quiero dejar mi reseña del servicio que recibí.")}
						target="_blank"
						rel="noopener noreferrer"
						class={WHATSAPP_BUTTON_CLASS}
						data-umami-event="whatsapp_click"
						data-umami-event-position="resena-form-degraded"
					>
						{resenaFormCopy.whatsappCta}
					</a>
				</div>
			)}
		</Form>
	);
}
