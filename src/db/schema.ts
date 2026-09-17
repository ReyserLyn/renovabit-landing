/**
 * Esquema Drizzle de la base D1 generica de RenovaBit.
 *
 * De momento solo vive la tabla `resenas` (resenas de clientes con recompensa).
 * La misma D1 alojara despues el Libro de Reclamaciones, por eso el esquema no
 * esta atado a un solo dominio.
 */

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const resenas = sqliteTable(
	"resenas",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		created_at: integer("created_at", { mode: "timestamp" })
			.notNull()
			.$defaultFn(() => new Date()),
		nombre: text("nombre").notNull(),
		/** Correo o WhatsApp segun `contacto_tipo`; opcional. */
		contacto: text("contacto"),
		contacto_tipo: text("contacto_tipo", { enum: ["email", "whatsapp"] }),
		empresa: text("empresa"),
		/** Label denormalizado que se muestra (SSOT: src/data/resenas-servicios.ts). */
		servicio: text("servicio").notNull(),
		/** Id del servicio para filtrar por pagina de servicio; opcional. */
		servicio_id: text("servicio_id"),
		/** Texto libre cuando el cliente elige "Otro". */
		servicio_detalle: text("servicio_detalle"),
		estrellas: integer("estrellas").notNull(),
		comentario: text("comentario").notNull(),
		foto_key: text("foto_key"),
		consentimiento: integer("consentimiento").notNull().default(0),
		consentimiento_en: integer("consentimiento_en", { mode: "timestamp" }),
		estado: text("estado").notNull().default("pendiente"),
		descuento_otorgado: integer("descuento_otorgado").notNull().default(0),
		cupon_codigo: text("cupon_codigo").unique(),
		cupon_estado: text("cupon_estado").default("emitido"),
		cupon_expira: integer("cupon_expira", { mode: "timestamp" }),
		publicado_en: integer("publicado_en", { mode: "timestamp" }),
		origen: text("origen").default("qr"),
		ticket_id: text("ticket_id"),
		ip_hash: text("ip_hash"),
		user_agent: text("user_agent"),
	},
	(table) => [
		check("chk_resenas_estrellas", sql`${table.estrellas} between 1 and 5`),
		index("idx_resenas_estado").on(table.estado),
	],
);

export type Resena = InferSelectModel<typeof resenas>;
export type NuevaResena = InferInsertModel<typeof resenas>;
