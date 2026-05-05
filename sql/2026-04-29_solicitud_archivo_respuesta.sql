-- Agrega campos para controlar estado de solicitud y archivo de respuesta
ALTER TABLE solicitud
  ADD COLUMN IF NOT EXISTS id_estado_solicitud INT NULL AFTER conocimiento_contrapartes,
  ADD COLUMN IF NOT EXISTS archivo_respuesta_ruta TEXT NULL AFTER id_estado_solicitud;

-- Sincroniza estado legado si ya existe id_ult_estado
UPDATE solicitud
SET id_estado_solicitud = COALESCE(id_estado_solicitud, id_ult_estado, 1);
