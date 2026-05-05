const ArchivosModel = require("../models/archivosModel");
const SolicitudModel = require("../models/solicitudModel");
const FileNetworkAdobeService = require("../services/fileNetworkAdobeService");

const ArchivosController = {
  async getAll(req, res) {
    try {
      const { solicitud } = req.query;

      if (solicitud) {
        const data = await ArchivosModel.getBySolicitudId(Number(solicitud));
        return res.json({ success: true, data });
      }

      const data = await ArchivosModel.getAll();
      return res.json({ success: true, data });
    } catch (err) {
      console.error("getAll archivos error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error al obtener archivos" });
    }
  },

  async getById(req, res) {
    try {
      const data = await ArchivosModel.getById(req.params.id);
      if (!data) {
        return res
          .status(404)
          .json({ success: false, message: "Archivo no encontrado" });
      }

      return res.json({ success: true, data });
    } catch (err) {
      console.error("getById archivos error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error al obtener archivo" });
    }
  },

  async create(req, res) {
    try {
      const { id_solicitud, id_contraparte } = req.body;
      const tipos = req.body.tipo_documento;
      const tiposArray = Array.isArray(tipos) ? tipos : [tipos];

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No se enviaron archivos",
        });
      }

      if (!id_solicitud || !id_contraparte) {
        return res.status(400).json({
          success: false,
          message: "Faltan id_solicitud o id_contraparte",
        });
      }

      const solicitud = await SolicitudModel.getById(id_solicitud);
      if (!solicitud) {
        return res.status(404).json({
          success: false,
          message: "Solicitud no encontrada",
        });
      }

      if (!solicitud.conocimiento_contrapartes) {
        return res.status(409).json({
          success: false,
          message:
            "Primero debe guardarse el formulario firmado antes de subir adjuntos",
        });
      }

      if (req.files.length !== tiposArray.length) {
        return res.status(400).json({
          success: false,
          message: "Cada archivo debe tener su tipo_documento",
        });
      }

      const created = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const tipo = tiposArray[i];

        if (!tipo) {
          return res.status(400).json({
            success: false,
            message: `tipo_documento faltante para ${file.originalname}`,
          });
        }

        const saved = await FileNetworkAdobeService.saveAttachment(
          id_solicitud,
          file.buffer,
          file.originalname,
        );

        const archivo = await ArchivosModel.create({
          ruta_archivo: saved.fileUrl,
          nombre_archivo: saved.fileName,
          tipo_documento: tipo,
          id_contraparte,
          id_solicitud,
        });

        created.push({
          ...archivo,
          ruta_archivo: saved.fileUrl,
          nombre_archivo: saved.fileName,
          tipo_documento: tipo,
        });
      }

      return res.status(201).json({
        success: true,
        message: "Archivos guardados correctamente",
        data: created,
      });
    } catch (err) {
      console.error("create archivo error:", err);

      return res.status(500).json({
        success: false,
        message: err.message || "Error al subir archivos",
      });
    }
  },

  async update(req, res) {
    try {
      const data = await ArchivosModel.update(req.params.id, req.body);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("update archivo error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error al actualizar archivo" });
    }
  },

  async updateRevision(req, res) {
    try {
      const { id } = req.params;
      const { id_estado_archivo, concepto, id_usuario_concepto } = req.body;

      if (!id_estado_archivo) {
        return res.status(400).json({
          success: false,
          message: "id_estado_archivo es obligatorio",
        });
      }

      const result = await ArchivosModel.updateRevision(id, {
        id_estado_archivo,
        concepto,
        id_usuario_concepto,
      });

      if (!result.affectedRows) {
        return res
          .status(404)
          .json({ success: false, message: "Archivo no encontrado" });
      }

      const data = await ArchivosModel.getById(id);
      return res.json({ success: true, data });
    } catch (err) {
      console.error("updateRevision archivo error:", err);
      return res.status(500).json({
        success: false,
        message: "Error al actualizar revision del archivo",
      });
    }
  },

  async remove(req, res) {
    try {
      await ArchivosModel.delete(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.error("delete archivo error:", err);
      return res
        .status(500)
        .json({ success: false, message: "Error al eliminar archivo" });
    }
  },
};

module.exports = ArchivosController;
