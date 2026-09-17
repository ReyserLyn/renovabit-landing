import { describe, expect, it } from "bun:test";
import type { NuevaResena } from "@/db/schema";
import type { FetchLike } from "@/lib/contact/fetch";
import type { EmailPayload } from "@/lib/contact/resend";
import { TURNSTILE_TEST_SECRET } from "@/lib/contact/turnstile";
import {
	processResena,
	type ResenasDeps,
	type ResenasEnv,
	type SendEmailFn,
} from "@/lib/resenas/handler";
import type { UploadFotoResult } from "@/lib/resenas/r2";

const PROD_SECRET = "turnstile-production-secret";
const NOW = Date.UTC(2026, 8, 17, 12, 0, 0);

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);

function makePngFile(): File {
	return new File([PNG_BYTES], "equipo.png", { type: "image/png" });
}

function createFormData(overrides: Record<string, string> = {}): FormData {
	const formData = new FormData();
	formData.set("nombre", "Ana Pérez");
	formData.set("empresa", "Estudio Contable");
	formData.set("servicio_id", "servicio-tecnico");
	formData.set("servicio_detalle", "");
	formData.set("estrellas", "5");
	formData.set("comentario", "Excelente servicio, mi laptop quedó como nueva.");
	formData.set("contacto", "ana@ejemplo.com");
	formData.set("consentimiento", "on");
	formData.set("cf-turnstile-response", "test-token");
	formData.set("ts", String(NOW - 10_000));
	for (const [key, value] of Object.entries(overrides)) {
		if (value === "") formData.delete(key);
		else formData.set(key, value);
	}
	return formData;
}

function createHeaders(origin: string | null = "https://renovabit.com"): Headers {
	const headers = new Headers({ host: "renovabit.com" });
	if (origin) headers.set("origin", origin);
	headers.set("cf-connecting-ip", "203.0.113.10");
	headers.set("user-agent", "Mozilla/5.0 (prueba local)");
	return headers;
}

function createTurnstileFetch(success = true) {
	const calls: string[] = [];
	const fetchImpl: FetchLike = async (input) => {
		calls.push(String(input));
		return new Response(JSON.stringify({ success }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	};
	return { calls, fetchImpl };
}

function createSender(results: boolean[] = []) {
	const sent: EmailPayload[] = [];
	let index = 0;
	const sender: SendEmailFn = async (payload) => {
		sent.push(payload);
		const ok = results[index] ?? true;
		index += 1;
		return ok ? { ok: true as const, simulated: true } : { ok: false as const };
	};
	return { sent, sender };
}

function createInserter() {
	const inserted: NuevaResena[] = [];
	const insertResena = async (values: NuevaResena): Promise<void> => {
		inserted.push(values);
	};
	return { inserted, insertResena };
}

function createUploader(result: UploadFotoResult = { ok: true, key: "resenas/2026-09-foto.webp" }) {
	const files: File[] = [];
	const uploadFoto = async (file: File): Promise<UploadFotoResult> => {
		files.push(file);
		return result;
	};
	return { files, uploadFoto };
}

const noop = (): void => undefined;
const silentLog = { info: noop, warn: noop, error: noop };

function baseEnv(overrides: Partial<ResenasEnv> = {}): ResenasEnv {
	return {
		TURNSTILE_SECRET_KEY: PROD_SECRET,
		CONTACT_INBOX: "contacto@renovabit.com",
		...overrides,
	};
}

function baseDeps(overrides: Partial<ResenasDeps> = {}): ResenasDeps {
	return { isProduction: true, log: silentLog, now: () => NOW, ...overrides };
}

describe("processResena", () => {
	it("guarda la reseña y envía notificación y agradecimiento", async () => {
		const formData = createFormData();
		formData.set("foto", makePngFile());
		const { inserted, insertResena } = createInserter();
		const { files, uploadFoto } = createUploader();
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData,
			headers: createHeaders(),
			env: baseEnv(),
			hostname: "renovabit.com",
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena, uploadFoto }),
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(files).toHaveLength(1);
		expect(files[0]?.name).toBe("equipo.png");
		expect(inserted).toHaveLength(1);
		const row = inserted[0];
		expect(row?.nombre).toBe("Ana Pérez");
		expect(row?.empresa).toBe("Estudio Contable");
		expect(row?.servicio).toBe("Servicio técnico");
		expect(row?.servicio_id).toBe("servicio-tecnico");
		expect(row?.servicio_detalle).toBeNull();
		expect(row?.estrellas).toBe(5);
		expect(row?.estado).toBe("pendiente");
		expect(row?.descuento_otorgado).toBe(1);
		expect(row?.consentimiento).toBe(1);
		expect(row?.consentimiento_en).toEqual(new Date(NOW));
		expect(row?.origen).toBe("qr");
		expect(row?.contacto).toBe("ana@ejemplo.com");
		expect(row?.contacto_tipo).toBe("email");
		expect(row?.foto_key).toBe("resenas/2026-09-foto.webp");
		expect(row?.user_agent).toContain("prueba local");
		expect(row?.ip_hash).toHaveLength(64);
		expect(row?.ip_hash).not.toContain("203.0.113.10");

		expect(sent).toHaveLength(2);
		expect(sent[0]?.to).toBe("contacto@renovabit.com");
		expect(sent[0]?.subject).toContain("Ana Pérez");
		expect(sent[0]?.subject).toContain("5★");
		expect(sent[0]?.replyTo).toBe("ana@ejemplo.com");
		expect(sent[1]?.to).toBe("ana@ejemplo.com");
		expect(sent[1]?.subject).toContain("Gracias");
		// Las respuestas del cliente al remitente no-reply vuelven al inbox.
		expect(sent[1]?.replyTo).toBe("contacto@renovabit.com");
	});

	it("normaliza el celular y omite el agradecimiento sin correo", async () => {
		const { inserted, insertResena } = createInserter();
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();
		const { uploadFoto } = createUploader();

		const result = await processResena({
			formData: createFormData({ contacto: "955 315 646" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena, uploadFoto }),
		});

		expect(result.status).toBe(200);
		expect(inserted[0]?.contacto).toBe("955315646");
		expect(inserted[0]?.contacto_tipo).toBe("whatsapp");
		expect(inserted[0]?.foto_key).toBeNull();
		expect(sent).toHaveLength(1);
		expect(sent[0]?.replyTo).toBeUndefined();
	});

	it("denormaliza el servicio Otro con el detalle escrito", async () => {
		const { inserted, insertResena } = createInserter();
		const { sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		await processResena({
			formData: createFormData({ servicio_id: "otro", servicio_detalle: "Cambio de pantalla" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(inserted[0]?.servicio).toBe("Cambio de pantalla");
		expect(inserted[0]?.servicio_id).toBe("otro");
		expect(inserted[0]?.servicio_detalle).toBe("Cambio de pantalla");
	});

	it("guarda la reseña aunque falle la subida de la foto", async () => {
		const formData = createFormData();
		formData.set("foto", makePngFile());
		const { inserted, insertResena } = createInserter();
		const { sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();
		const { uploadFoto } = createUploader({ ok: false, reason: "bucket" });

		const result = await processResena({
			formData,
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena, uploadFoto }),
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(inserted[0]?.foto_key).toBeNull();
	});

	it("devuelve 400 con el error de foto cuando el contenido no es una imagen", async () => {
		const formData = createFormData();
		formData.set("foto", makePngFile());
		const { inserted, insertResena } = createInserter();
		const { sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();
		const { uploadFoto } = createUploader({ ok: false, reason: "tipo" });

		const result = await processResena({
			formData,
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena, uploadFoto }),
		});

		expect(result.status).toBe(400);
		if (result.status !== 400) return;
		expect(result.body.fieldErrors.foto).toBe(
			"La foto debe ser un JPG, PNG o WebP real de hasta 5 MB.",
		);
		expect(inserted).toHaveLength(0);
	});

	it("responde éxito falso con el honeypot relleno y no verifica Turnstile", async () => {
		const { inserted, insertResena } = createInserter();
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData({ referencia: "spam" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(inserted).toHaveLength(0);
		expect(sent).toHaveLength(0);
		expect(calls).toHaveLength(0);
	});

	it("rechaza envíos más rápidos que la trampa de tiempo", async () => {
		const { inserted, insertResena } = createInserter();
		const { sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData({ ts: String(NOW) }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(result).toEqual({ status: 400, body: { ok: false, code: "campos", fieldErrors: {} } });
		expect(inserted).toHaveLength(0);
	});

	it("rechaza el envío sin token de Turnstile", async () => {
		const { inserted, insertResena } = createInserter();
		const { sent, sender } = createSender();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData({ "cf-turnstile-response": "" }),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(inserted).toHaveLength(0);
		expect(sent).toHaveLength(0);
		expect(calls).toHaveLength(0);
	});

	it("rechaza un origen no permitido", async () => {
		const { inserted, insertResena } = createInserter();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData(),
			headers: createHeaders("https://evil.example"),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, insertResena }),
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(inserted).toHaveLength(0);
	});

	it("rechaza el secret de prueba de Turnstile en producción", async () => {
		const { inserted, insertResena } = createInserter();
		const { calls, fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv({ TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET }),
			hostname: "renovabit.com",
			deps: baseDeps({ fetch: fetchImpl, insertResena }),
		});

		expect(result).toEqual({ status: 403, body: { ok: false, code: "verificacion" } });
		expect(calls).toHaveLength(0);
		expect(inserted).toHaveLength(0);
	});

	it("aplica el límite de envíos de reseñas", async () => {
		const { inserted, insertResena } = createInserter();
		const { fetchImpl } = createTurnstileFetch();
		const keys: string[] = [];

		const result = await processResena({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv({
				RESENAS_RATE_LIMITER: {
					limit: async ({ key }) => {
						keys.push(key);
						return { success: false };
					},
				},
			}),
			deps: baseDeps({ fetch: fetchImpl, insertResena }),
		});

		expect(result).toEqual({ status: 429, body: { ok: false, code: "limite" } });
		expect(keys).toEqual(["resenas:203.0.113.10"]);
		expect(inserted).toHaveLength(0);
	});

	it("devuelve errores por campo sin guardar nada", async () => {
		const { inserted, insertResena } = createInserter();
		const { sent, sender } = createSender();
		const { fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData({
				nombre: "A",
				estrellas: "6",
				comentario: "corto",
				consentimiento: "",
			}),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(result.status).toBe(400);
		if (result.status !== 400) return;
		expect(result.body.code).toBe("campos");
		expect(result.body.fieldErrors.nombre).toBe("El nombre debe tener al menos 2 caracteres.");
		expect(result.body.fieldErrors.estrellas).toBe(
			"Selecciona una calificación de 1 a 5 estrellas.",
		);
		expect(result.body.fieldErrors.comentario).toBe(
			"El comentario debe tener al menos 10 caracteres.",
		);
		expect(result.body.fieldErrors.consentimiento).toBe(
			"Debes aceptar la publicación de tu reseña para enviarla.",
		);
		expect(inserted).toHaveLength(0);
		expect(sent).toHaveLength(0);
	});

	it("devuelve error de envío cuando falla el insert en D1", async () => {
		const { fetchImpl } = createTurnstileFetch();
		const failingInsert = async (): Promise<void> => {
			throw new Error("D1 unavailable");
		};

		const result = await processResena({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, insertResena: failingInsert }),
		});

		expect(result).toEqual({ status: 500, body: { ok: false, code: "envio" } });
	});

	it("mantiene el éxito si falla la notificación (la reseña ya está guardada)", async () => {
		const { inserted, insertResena } = createInserter();
		const { sent, sender } = createSender([false]);
		const { fetchImpl } = createTurnstileFetch();

		const result = await processResena({
			formData: createFormData(),
			headers: createHeaders(),
			env: baseEnv(),
			deps: baseDeps({ fetch: fetchImpl, sendEmail: sender, insertResena }),
		});

		expect(result).toEqual({ status: 200, body: { ok: true } });
		expect(inserted).toHaveLength(1);
		expect(sent).toHaveLength(2);
	});
});
