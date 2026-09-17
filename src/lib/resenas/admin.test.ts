import { describe, expect, it } from "bun:test";
import {
	ACCESS_EMAIL_HEADER,
	accesoPermitido,
	calcularStats,
	codigoOk,
	esAdminAccion,
	esEstadoResena,
	filtrarPorEstado,
	formatearFechaAdmin,
	ordenarResenasAdmin,
	parseAdminAccion,
	parseFiltro,
	puedeTransicionar,
	RESENA_FILTRO_DEFAULT,
	type ResenaAdminItem,
	siguienteEstado,
} from "@/lib/resenas/admin";

function makeItem(overrides: Partial<ResenaAdminItem> = {}): ResenaAdminItem {
	return {
		estado: "pendiente",
		estrellas: 5,
		created_at: new Date("2026-09-17T12:00:00Z"),
		publicado_en: null,
		...overrides,
	};
}

describe("máquina de estados", () => {
	it("permite las transiciones documentadas", () => {
		expect(puedeTransicionar("pendiente", "aprobar")).toBe(true);
		expect(puedeTransicionar("pendiente", "rechazar")).toBe(true);
		expect(puedeTransicionar("aprobada", "rechazar")).toBe(true);
		expect(puedeTransicionar("rechazada", "aprobar")).toBe(true);
	});

	it("rechaza transiciones que no cambian el estado", () => {
		expect(puedeTransicionar("aprobada", "aprobar")).toBe(false);
		expect(puedeTransicionar("rechazada", "rechazar")).toBe(false);
	});

	it("siempre permite alternar el descuento", () => {
		for (const estado of ["pendiente", "aprobada", "rechazada", "desconocido"]) {
			expect(puedeTransicionar(estado, "descuento")).toBe(true);
		}
	});

	it("devuelve el estado siguiente o null", () => {
		expect(siguienteEstado("pendiente", "aprobar")).toBe("aprobada");
		expect(siguienteEstado("pendiente", "rechazar")).toBe("rechazada");
		expect(siguienteEstado("aprobada", "rechazar")).toBe("rechazada");
		expect(siguienteEstado("rechazada", "aprobar")).toBe("aprobada");
		expect(siguienteEstado("aprobada", "aprobar")).toBeNull();
		expect(siguienteEstado("pendiente", "descuento")).toBeNull();
	});

	it("trata un estado desconocido como no transicionable", () => {
		expect(puedeTransicionar("archivada", "aprobar")).toBe(false);
		expect(siguienteEstado("archivada", "aprobar")).toBeNull();
	});
});

describe("validación y parseo", () => {
	it("reconoce estados y acciones válidas", () => {
		expect(esEstadoResena("pendiente")).toBe(true);
		expect(esEstadoResena("aprobada")).toBe(true);
		expect(esEstadoResena("otro")).toBe(false);
		expect(esEstadoResena(null)).toBe(false);
		expect(esAdminAccion("aprobar")).toBe(true);
		expect(esAdminAccion("descuento")).toBe(true);
		expect(esAdminAccion("borrar")).toBe(false);
	});

	it("normaliza el filtro del listado", () => {
		expect(parseFiltro("aprobada")).toBe("aprobada");
		expect(parseFiltro("todas")).toBe("todas");
		expect(parseFiltro("inventado")).toBe(RESENA_FILTRO_DEFAULT);
		expect(parseFiltro(null)).toBe(RESENA_FILTRO_DEFAULT);
	});

	it("parsea id y acción del formulario", () => {
		expect(parseAdminAccion("12", "aprobar")).toEqual({ ok: true, id: 12, accion: "aprobar" });
		expect(parseAdminAccion(7, "descuento")).toEqual({ ok: true, id: 7, accion: "descuento" });
	});

	it("rechaza id inválido o acción desconocida", () => {
		expect(parseAdminAccion("0", "aprobar")).toEqual({ ok: false, motivo: "id" });
		expect(parseAdminAccion("-3", "aprobar")).toEqual({ ok: false, motivo: "id" });
		expect(parseAdminAccion("1.5", "aprobar")).toEqual({ ok: false, motivo: "id" });
		expect(parseAdminAccion("abc", "aprobar")).toEqual({ ok: false, motivo: "id" });
		expect(parseAdminAccion(null, "aprobar")).toEqual({ ok: false, motivo: "id" });
		expect(parseAdminAccion("3", "borrar")).toEqual({ ok: false, motivo: "accion" });
	});
});

describe("códigos de éxito", () => {
	it("asigna el código según la acción", () => {
		expect(codigoOk("aprobar")).toBe("aprobada");
		expect(codigoOk("rechazar")).toBe("rechazada");
		expect(codigoOk("descuento", true)).toBe("descuento");
		expect(codigoOk("descuento", false)).toBe("descuento-quitado");
	});
});

describe("defensa de acceso", () => {
	it("omite la comprobación fuera de producción", () => {
		expect(accesoPermitido(new Headers(), false)).toBe(true);
	});

	it("en producción exige el header de Access", () => {
		expect(accesoPermitido(new Headers(), true)).toBe(false);
		const headers = new Headers({ [ACCESS_EMAIL_HEADER]: "admin@renovabit.com" });
		expect(accesoPermitido(headers, true)).toBe(true);
		const blank = new Headers({ [ACCESS_EMAIL_HEADER]: "   " });
		expect(accesoPermitido(blank, true)).toBe(false);
	});
});

describe("listado", () => {
	it("filtra por estado y deja pasar todas", () => {
		const items = [
			makeItem({ estado: "aprobada" }),
			makeItem({ estado: "pendiente" }),
			makeItem({ estado: "rechazada" }),
		];
		expect(filtrarPorEstado(items, "pendiente").map((i) => i.estado)).toEqual(["pendiente"]);
		expect(filtrarPorEstado(items, "todas")).toHaveLength(3);
	});

	it("ordena pendientes primero y luego por fecha descendente", () => {
		const items = [
			makeItem({ estado: "aprobada", created_at: new Date("2026-09-10T12:00:00Z") }),
			makeItem({ estado: "rechazada", created_at: new Date("2026-09-12T12:00:00Z") }),
			makeItem({ estado: "pendiente", created_at: new Date("2026-09-11T12:00:00Z") }),
			makeItem({ estado: "pendiente", created_at: new Date("2026-09-13T12:00:00Z") }),
		];
		expect(ordenarResenasAdmin(items).map((i) => i.created_at.toISOString())).toEqual([
			"2026-09-13T12:00:00.000Z",
			"2026-09-11T12:00:00.000Z",
			"2026-09-12T12:00:00.000Z",
			"2026-09-10T12:00:00.000Z",
		]);
	});

	it("no muta el arreglo original", () => {
		const items = [makeItem({ estado: "aprobada" }), makeItem({ estado: "pendiente" })];
		ordenarResenasAdmin(items);
		filtrarPorEstado(items, "todas");
		expect(items.map((i) => i.estado)).toEqual(["aprobada", "pendiente"]);
	});
});

describe("estadísticas", () => {
	it("cuenta por estado y calcula el promedio", () => {
		const stats = calcularStats([
			makeItem({ estado: "pendiente", estrellas: 5 }),
			makeItem({ estado: "aprobada", estrellas: 4, publicado_en: new Date() }),
			makeItem({ estado: "aprobada", estrellas: 3 }),
			makeItem({ estado: "rechazada", estrellas: 1 }),
		]);
		expect(stats.total).toBe(4);
		expect(stats.pendientes).toBe(1);
		expect(stats.aprobadas).toBe(2);
		expect(stats.rechazadas).toBe(1);
		expect(stats.aprobadasSinPublicar).toBe(1);
		expect(stats.promedioEstrellas).toBe(3.3);
	});

	it("devuelve promedio null sin filas", () => {
		const stats = calcularStats([]);
		expect(stats.total).toBe(0);
		expect(stats.promedioEstrellas).toBeNull();
	});
});

describe("formato de fecha", () => {
	it("convierte a hora de Arequipa (UTC-5)", () => {
		expect(formatearFechaAdmin(new Date("2026-09-17T12:34:00Z"))).toBe("17/09/2026 07:34");
		expect(formatearFechaAdmin(new Date("2026-09-18T02:10:00Z"))).toBe("17/09/2026 21:10");
	});
});
