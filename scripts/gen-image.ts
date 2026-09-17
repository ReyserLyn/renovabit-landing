/**
 * Genera imágenes con la API de Gemini (familia Nano Banana).
 *
 * Uso:
 *   bun scripts/gen-image.ts <trabajos.json> [--out social/out] [--modelo lite|nb2|pro]
 *
 * El JSON es un array de trabajos:
 *   [{ "nombre": "tip-laptop", "prompt": "...", "aspectRatio": "1:1", "modelo": "lite", "ref": "ruta.png" }]
 *
 * La API key vive en `.env` como `GEMINI_API_KEY` (Bun la carga automáticamente).
 * Criterio de contenido: la IA es apoyo (fondos, portadas, edición de fotos reales);
 * no simular trabajos reales del taller.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const MODELOS = {
	lite: "gemini-3.1-flash-lite-image",
	nb2: "gemini-3.1-flash-image",
	pro: "gemini-3-pro-image",
} as const;
type Modelo = keyof typeof MODELOS;

/** Costo estimado por imagen 1K en USD (pricing oficial de la API, sep 2026). */
const COSTO_1K: Record<Modelo, number> = { lite: 0.0336, nb2: 0.067, pro: 0.134 };

const MIME: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
};

interface Trabajo {
	nombre: string;
	prompt: string;
	aspectRatio?: string;
	modelo?: Modelo;
	imageSize?: string;
	/** Imagen de referencia local (edición): png/jpg/webp. */
	ref?: string;
}

function leerArgs(argv: string[]) {
	const jobsPath = argv[0];
	let out = "social/out";
	let modelo: Modelo = "lite";
	for (let i = 1; i < argv.length; i++) {
		if (argv[i] === "--out" && argv[i + 1]) out = argv[++i];
		else if (argv[i] === "--modelo" && argv[i + 1]) modelo = argv[++i] as Modelo;
	}
	return { jobsPath, out, modelo };
}

async function generar(trabajo: Trabajo, modeloGlobal: Modelo, apiKey: string, outDir: string) {
	const modelo = trabajo.modelo ?? modeloGlobal;
	if (!MODELOS[modelo]) throw new Error(`modelo desconocido: ${modelo}`);

	const partes: Record<string, unknown>[] = [];
	if (trabajo.ref) {
		const mime = MIME[extname(trabajo.ref).toLowerCase()];
		if (!mime) throw new Error(`formato de referencia no soportado: ${trabajo.ref}`);
		const data = (await readFile(trabajo.ref)).toString("base64");
		partes.push({ inlineData: { mimeType: mime, data } });
	}
	partes.push({ text: trabajo.prompt });

	const body = {
		contents: [{ parts: partes }],
		generationConfig: {
			responseModalities: ["IMAGE"],
			imageConfig: {
				aspectRatio: trabajo.aspectRatio ?? "1:1",
				imageSize: trabajo.imageSize ?? "1K",
			},
		},
	};

	const inicio = Date.now();
	const res = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/models/${MODELOS[modelo]}:generateContent`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
			body: JSON.stringify(body),
		},
	);
	if (!res.ok) {
		throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
	}
	const data = (await res.json()) as {
		candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
	};
	const b64 = data.candidates?.[0]?.content?.parts?.find((parte) => parte.inlineData?.data)
		?.inlineData?.data;
	if (!b64) throw new Error(`sin imagen en la respuesta: ${JSON.stringify(data).slice(0, 200)}`);

	await mkdir(outDir, { recursive: true });
	const ruta = join(outDir, `${trabajo.nombre}.png`);
	await writeFile(ruta, Buffer.from(b64, "base64"));
	return { ruta, segundos: ((Date.now() - inicio) / 1000).toFixed(1), costo: COSTO_1K[modelo] };
}

const { jobsPath, out, modelo } = leerArgs(process.argv.slice(2));
if (!jobsPath) {
	console.error(
		"Uso: bun scripts/gen-image.ts <trabajos.json> [--out social/out] [--modelo lite|nb2|pro]",
	);
	process.exit(1);
}
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
	console.error("Falta GEMINI_API_KEY en el entorno (.env).");
	process.exit(1);
}

const trabajos = JSON.parse(await readFile(jobsPath, "utf8")) as Trabajo[];
if (!Array.isArray(trabajos)) {
	console.error("El JSON debe ser un array de trabajos.");
	process.exit(1);
}

let total = 0;
let ok = 0;
for (const trabajo of trabajos) {
	try {
		const resultado = await generar(trabajo, modelo, apiKey, out);
		ok += 1;
		total += resultado.costo;
		console.log(
			`OK ${trabajo.nombre} -> ${resultado.ruta} | ${resultado.segundos}s | $${resultado.costo.toFixed(4)}`,
		);
	} catch (error) {
		console.error(`ERROR ${trabajo.nombre}: ${error instanceof Error ? error.message : error}`);
	}
}
console.log(`Listo: ${ok}/${trabajos.length} | costo estimado: $${total.toFixed(4)}`);
