-- Reseñas aprobadas para publicar en el sitio.
-- Lo consume `scripts/sync-resenas.ts`; el orden (id ASC) mantiene el diff del
-- artefacto generado lo más pequeño posible.
SELECT
	id,
	created_at,
	nombre,
	empresa,
	servicio,
	servicio_id,
	estrellas,
	comentario,
	foto_key
FROM resenas
WHERE estado = 'aprobada'
ORDER BY id ASC;
