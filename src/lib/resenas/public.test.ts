import { describe, expect, it } from "bun:test";
import {
	calcularResumenPublico,
	formatFechaResena,
	nombrePublico,
	ordenarResenasPorFecha,
	ordenarResenasPublicas,
	parseResenasExport,
	type ResenaExportRow,
	type ResenaPublica,
} from "@/lib/resenas/public";

function exportJson(rows: unknown[]): unknown {
	return [{ results: rows, success: true, meta: { duration: 1 } }];
}

function makeRow(overrides: Partial<ResenaExportRow> = {}): ResenaExportRow {
	return {
		id: 1,
		created_at: Date.UTC(2026, 8, 17, 12, 0, 0) / 1000,
		nombre: "María Fernanda Quispe",
		empresa: "Estudio Contable",
		servicio: "Servicio técnico",
		servicio_id: "servicio-tecnico",
		estrellas: 5,
		comentario: "Excelente servicio, mi laptop quedó como nueva.",
		foto_key: "resenas/2026-09-abc.png",
		...overrides,
	};
}

function makePublica(overrides: Partial<ResenaPublica> = {}): ResenaPublica {
	return {
		id: 1,
		nombrePublico: "María F.",
		empresa: null,
		servicio: "Servicio técnico",
		servicioId: "servicio-tecnico",
		estrellas: 5,
		comentario: "Excelente.",
		fecha: "2026-09-17T12:00:00.000Z",
		fotoKey: null,
		...overrides,
	};
}

describe("nombrePublico", () => {
	it("usa el primer nombre y la inicial del segundo", () => {
		expect(nombrePublico("María Fernanda Quispe")).toBe("María F.");
		expect(nombrePublico("José Luis")).toBe("José L.");
	});

	it("deja el nombre tal cual si no hay segundo nombre", () => {
		expect(nombrePublico("María")).toBe("María");
		expect(nombrePublico("Reyser")).toBe("Reyser");
	});

	it("normaliza espacios y sube la inicial", () => {
		expect(nombrePublico("  Ana   de los Ángeles  ")).toBe("Ana D.");
		expect(nombrePublico("carlos alberto")).toBe("carlos A.");
	});

	it("devuelve cadena vacía si no hay nombre", () => {
		expect(nombrePublico("   ")).toBe("");
	});
});

describe("formatFechaResena", () => {
	it("formatea en zona de Arequipa", () => {
		expect(formatFechaResena("2026-09-17T12:00:00.000Z")).toBe("septiembre de 2026");
		expect(formatFechaResena("2026-09-18T02:10:00.000Z")).toBe("septiembre de 2026");
	});

	it("no se desfasa al mes anterior o siguiente por la zona", () => {
		expect(formatFechaResena("2026-10-01T04:30:00.000Z")).toBe("septiembre de 2026");
	});

	it("devuelve la entrada si no es una fecha válida", () => {
		expect(formatFechaResena("ayer")).toBe("ayer");
	});
});

describe("validación del JSON de wrangler", () => {
	it("acepta la envoltura real y convierte las filas", () => {
		const resenas = parseResenasExport(exportJson([makeRow()]));
		expect(resenas).toHaveLength(1);
		expect(resenas[0]).toEqual({
			id: 1,
			nombrePublico: "María F.",
			empresa: "Estudio Contable",
			servicio: "Servicio técnico",
			servicioId: "servicio-tecnico",
			estrellas: 5,
			comentario: "Excelente servicio, mi laptop quedó como nueva.",
			fecha: "2026-09-17T12:00:00.000Z",
			fotoKey: "resenas/2026-09-abc.png",
		});
	});

	it("acepta una exportación sin filas", () => {
		expect(parseResenasExport(exportJson([]))).toEqual([]);
	});

	it("rechaza una exportación sin resultados de wrangler", () => {
		expect(() => parseResenasExport([])).toThrow();
	});

	it("rechaza una exportación con success falso", () => {
		expect(() => parseResenasExport([{ results: [makeRow()], success: false }])).toThrow();
	});

	it("rechaza filas con campos faltantes o inválidos", () => {
		expect(() => parseResenasExport(exportJson([{ id: 1 }]))).toThrow();
		expect(() => parseResenasExport(exportJson([makeRow({ estrellas: 0 })]))).toThrow();
		expect(() => parseResenasExport(exportJson([makeRow({ estrellas: 6 })]))).toThrow();
		expect(() => parseResenasExport(exportJson([makeRow({ id: 0 })]))).toThrow();
		expect(() => parseResenasExport(exportJson([makeRow({ nombre: "" })]))).toThrow();
		expect(() =>
			parseResenasExport(exportJson([makeRow({ created_at: 4_102_444_801 })])),
		).toThrow();
	});

	it("rechaza una entrada que no es arreglo", () => {
		expect(() => parseResenasExport({ results: [] })).toThrow();
		expect(() => parseResenasExport(null)).toThrow();
	});
});

describe("orden", () => {
	it("ordena el artefacto por id ascendente para diffs mínimos", () => {
		const resenas = [makePublica({ id: 3 }), makePublica({ id: 1 }), makePublica({ id: 2 })];
		expect(ordenarResenasPublicas(resenas).map((r) => r.id)).toEqual([1, 2, 3]);
		expect(resenas.map((r) => r.id)).toEqual([3, 1, 2]);
	});

	it("muestra la más reciente primero y desempata por id", () => {
		const resenas = [
			makePublica({ id: 1, fecha: "2026-09-10T12:00:00.000Z" }),
			makePublica({ id: 2, fecha: "2026-09-12T12:00:00.000Z" }),
			makePublica({ id: 3, fecha: "2026-09-12T12:00:00.000Z" }),
		];
		expect(ordenarResenasPorFecha(resenas).map((r) => r.id)).toEqual([3, 2, 1]);
	});
});

describe("resumen público", () => {
	it("calcula total y promedio con un decimal", () => {
		const resenas = [
			makePublica({ id: 1, estrellas: 5 }),
			makePublica({ id: 2, estrellas: 4 }),
			makePublica({ id: 3, estrellas: 4 }),
		];
		expect(calcularResumenPublico(resenas)).toEqual({ total: 3, promedio: 4.3 });
	});

	it("devuelve promedio null sin reseñas", () => {
		expect(calcularResumenPublico([])).toEqual({ total: 0, promedio: null });
	});
});
