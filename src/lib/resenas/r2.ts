/**
 * Subida de la foto de una reseña al bucket R2 (`MEDIA`).
 *
 * La validación real es por magic bytes: el `Content-Type` que envía el
 * navegador (o curl) no es confiable. Las claves se agrupan por mes y llevan un
 * sufijo aleatorio para no colisionar. `detectImageType` es pura para poder
 * testearla sin bucket.
 */

export const MAX_FOTO_BYTES = 5 * 1024 * 1024;
export const FOTO_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface DetectedImageType {
	ext: "jpg" | "png" | "webp";
	contentType: "image/jpeg" | "image/png" | "image/webp";
}

const JPEG_SIGNATURE = [0xff, 0xd8, 0xff] as const;
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const WEBP_RIFF = [0x52, 0x49, 0x46, 0x46] as const; // "RIFF"
const WEBP_TAG = [0x57, 0x45, 0x42, 0x50] as const; // "WEBP"

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
	if (bytes.length < signature.length) return false;
	return signature.every((byte, index) => bytes[index] === byte);
}

/** Detecta el tipo real de una imagen por sus primeros bytes. `null` si no es JPEG/PNG/WebP. */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
	if (startsWith(bytes, PNG_SIGNATURE)) {
		return { ext: "png", contentType: "image/png" };
	}
	if (startsWith(bytes, JPEG_SIGNATURE)) {
		return { ext: "jpg", contentType: "image/jpeg" };
	}
	if (startsWith(bytes, WEBP_RIFF) && startsWith(bytes.subarray(8), WEBP_TAG)) {
		return { ext: "webp", contentType: "image/webp" };
	}
	return null;
}

/** Contrato mínimo del bucket (así los tests no necesitan un `R2Bucket` real). */
export interface R2BucketLike {
	put(
		key: string,
		value: ArrayBuffer,
		options?: {
			httpMetadata?: { contentType?: string; cacheControl?: string };
			customMetadata?: Record<string, string>;
		},
	): Promise<unknown>;
}

/** Lo mínimo de un `File` que necesita la subida. */
export type FotoLike = Pick<File, "size" | "arrayBuffer">;

export type UploadFotoFailureReason = "vacio" | "tipo" | "tamano" | "bucket";

export type UploadFotoResult =
	| { ok: true; key: string }
	| { ok: false; reason: UploadFotoFailureReason };

export interface UploadFotoDeps {
	bucket?: R2BucketLike;
	now?: () => Date;
	randomId?: () => string;
	log?: Pick<Console, "warn">;
}

function buildKey(ext: DetectedImageType["ext"], now: Date, randomId: string): string {
	const month = String(now.getUTCMonth() + 1).padStart(2, "0");
	return `resenas/${now.getUTCFullYear()}-${month}-${randomId}.${ext}`;
}

export async function uploadResenaFoto(
	file: FotoLike,
	deps: UploadFotoDeps = {},
): Promise<UploadFotoResult> {
	const {
		bucket,
		now = () => new Date(),
		randomId = () => crypto.randomUUID(),
		log = console,
	} = deps;

	if (file.size === 0) return { ok: false, reason: "vacio" };
	if (file.size > MAX_FOTO_BYTES) return { ok: false, reason: "tamano" };

	let bytes: Uint8Array;
	try {
		bytes = new Uint8Array(await file.arrayBuffer());
	} catch {
		return { ok: false, reason: "tipo" };
	}

	const detected = detectImageType(bytes);
	if (!detected) return { ok: false, reason: "tipo" };

	if (!bucket) {
		log.warn("[resenas] El binding MEDIA no está disponible; la foto no se pudo subir.");
		return { ok: false, reason: "bucket" };
	}

	const key = buildKey(detected.ext, now(), randomId());
	try {
		await bucket.put(key, bytes.buffer as ArrayBuffer, {
			httpMetadata: {
				contentType: detected.contentType,
				cacheControl: FOTO_CACHE_CONTROL,
			},
			customMetadata: {
				origen: "resena",
				subido: now().toISOString(),
			},
		});
		return { ok: true, key };
	} catch (error) {
		log.warn("[resenas] No se pudo subir la foto a R2.", error);
		return { ok: false, reason: "bucket" };
	}
}
