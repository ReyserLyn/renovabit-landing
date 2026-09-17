CREATE TABLE `resenas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`nombre` text NOT NULL,
	`contacto` text,
	`contacto_tipo` text,
	`empresa` text,
	`servicio` text NOT NULL,
	`servicio_id` text,
	`servicio_detalle` text,
	`estrellas` integer NOT NULL,
	`comentario` text NOT NULL,
	`foto_key` text,
	`consentimiento` integer DEFAULT 0 NOT NULL,
	`consentimiento_en` integer,
	`estado` text DEFAULT 'pendiente' NOT NULL,
	`descuento_otorgado` integer DEFAULT 0 NOT NULL,
	`cupon_codigo` text,
	`cupon_estado` text DEFAULT 'emitido',
	`cupon_expira` integer,
	`publicado_en` integer,
	`origen` text DEFAULT 'qr',
	`ticket_id` text,
	`ip_hash` text,
	`user_agent` text,
	CONSTRAINT "chk_resenas_estrellas" CHECK("resenas"."estrellas" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `resenas_cupon_codigo_unique` ON `resenas` (`cupon_codigo`);--> statement-breakpoint
CREATE INDEX `idx_resenas_estado` ON `resenas` (`estado`);