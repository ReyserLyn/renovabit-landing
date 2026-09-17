import { describe, expect, it } from "bun:test";
import {
	detectImageType,
	FOTO_CACHE_CONTROL,
	MAX_FOTO_BYTES,
	type R2BucketLike,
	uploadResenaFoto,
} from "@/lib/resenas/r2";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
const WEBP_BYTES = new Uint8Array([
	0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const GIF_BYTES = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x00, 0x00]);

function makeFile(bytes: Uint8Array | number, type = "image/png"): File {
	const data = typeof bytes === "number" ? new Uint8Array(bytes) : Uint8Array.from(bytes);
	return new File([data], "foto.png", { type });
}

function createBucket() {
	const puts: Array<{
		key: string;
		bytes: number;
		options?: {
			httpMetadata?: { contentType?: string; cacheControl?: string };
			customMetadata?: Record<string, string>;
		};
	}> = [];
	const bucket: R2BucketLike = {
		put: async (key, value, options) => {
			puts.push({ key, bytes: value.byteLength, options });
			return null;
		},
	};
	return { puts, bucket };
}

describe("detectImageType", () => {
	it("detecta PNG, JPEG y WebP por sus magic bytes", () => {
		expect(detectImageType(PNG_BYTES)).toEqual({ ext: "png", contentType: "image/png" });
		expect(detectImageType(JPEG_BYTES)).toEqual({ ext: "jpg", contentType: "image/jpeg" });
		expect(detectImageType(WEBP_BYTES)).toEqual({ ext: "webp", contentType: "image/webp" });
	});

	it("devuelve null para otros formatos o bytes insuficientes", () => {
		expect(detectImageType(GIF_BYTES)).toBeNull();
		expect(detectImageType(new Uint8Array())).toBeNull();
		expect(detectImageType(new Uint8Array([0xff, 0xd8]))).toBeNull();
		expect(detectImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46]))).toBeNull();
	});
});

describe("uploadResenaFoto", () => {
	const silentLog = { warn: (): void => undefined };

	it("sube la foto con clave por mes y metadata correcta", async () => {
		const { puts, bucket } = createBucket();
		const result = await uploadResenaFoto(makeFile(PNG_BYTES), {
			bucket,
			now: () => new Date("2026-09-17T12:00:00.000Z"),
			randomId: () => "abc123",
			log: silentLog,
		});

		expect(result).toEqual({ ok: true, key: "resenas/2026-09-abc123.png" });
		expect(puts).toHaveLength(1);
		expect(puts[0]?.key).toBe("resenas/2026-09-abc123.png");
		expect(puts[0]?.bytes).toBe(PNG_BYTES.byteLength);
		expect(puts[0]?.options?.httpMetadata?.contentType).toBe("image/png");
		expect(puts[0]?.options?.httpMetadata?.cacheControl).toBe(FOTO_CACHE_CONTROL);
		expect(puts[0]?.options?.customMetadata?.origen).toBe("resena");
		expect(puts[0]?.options?.customMetadata?.subido).toBe("2026-09-17T12:00:00.000Z");
	});

	it("rechaza archivos vacíos o demasiado grandes", async () => {
		const { bucket } = createBucket();
		expect(await uploadResenaFoto(makeFile(0), { bucket, log: silentLog })).toEqual({
			ok: false,
			reason: "vacio",
		});
		expect(
			await uploadResenaFoto(makeFile(MAX_FOTO_BYTES + 1), { bucket, log: silentLog }),
		).toEqual({ ok: false, reason: "tamano" });
	});

	it("rechaza contenido que no es una imagen real", async () => {
		const { bucket } = createBucket();
		const result = await uploadResenaFoto(makeFile(GIF_BYTES), { bucket, log: silentLog });
		expect(result).toEqual({ ok: false, reason: "tipo" });
	});

	it("devuelve reason bucket cuando falta el binding o el put falla", async () => {
		expect(await uploadResenaFoto(makeFile(PNG_BYTES), { log: silentLog })).toEqual({
			ok: false,
			reason: "bucket",
		});

		const failing: R2BucketLike = {
			put: async () => {
				throw new Error("R2 unavailable");
			},
		};
		expect(
			await uploadResenaFoto(makeFile(JPEG_BYTES), { bucket: failing, log: silentLog }),
		).toEqual({ ok: false, reason: "bucket" });
	});

	it("usa webp y jpg en la extensión de la clave", async () => {
		const { puts, bucket } = createBucket();
		await uploadResenaFoto(makeFile(WEBP_BYTES), {
			bucket,
			now: () => new Date("2026-01-05T00:00:00.000Z"),
			randomId: () => "webp1",
			log: silentLog,
		});
		await uploadResenaFoto(makeFile(JPEG_BYTES), {
			bucket,
			now: () => new Date("2026-01-05T00:00:00.000Z"),
			randomId: () => "jpg1",
			log: silentLog,
		});
		expect(puts.map((put) => put.key)).toEqual([
			"resenas/2026-01-webp1.webp",
			"resenas/2026-01-jpg1.jpg",
		]);
	});
});
