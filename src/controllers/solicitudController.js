const SolicitudModel = require("../models/solicitudModel");
const ConceptoModel = require("../models/conceptoModel");
const FileNetworkAdobeService = require("../services/fileNetworkAdobeService");

const SolicitudController = {
  async getAll(req, res) {
    try {
      const data = await SolicitudModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener solicitudes" });
    }
  },

  async getById(req, res) {
    try {
      const solicitud = await SolicitudModel.getById(req.params.id);
      if (!solicitud) {
        return res
          .status(404)
          .json({ success: false, message: "Solicitud no encontrada" });
      }
      const conceptos = await ConceptoModel.getBySolicitud(req.params.id);
      res.json({ success: true, data: { solicitud, conceptos } });
    } catch (err) {
      console.error("getById solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener solicitud" });
    }
  },

  async create(req, res) {
    try {
      const id = await SolicitudModel.create(req.body);
      const solicitud = await SolicitudModel.getById(id);
      res.status(201).json({ success: true, data: solicitud });
    } catch (err) {
      console.error("create solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al crear solicitud" });
    }
  },

  async update(req, res) {
    try {
      const solicitud = await SolicitudModel.update(req.params.id, req.body);
      res.json({ success: true, data: solicitud });
    } catch (err) {
      console.error("update solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar solicitud" });
    }
  },

  async updateEstado(req, res) {
    try {
      const { id_estado_solicitud } = req.body;

      if (!id_estado_solicitud) {
        return res.status(400).json({
          success: false,
          message: "id_estado_solicitud es obligatorio",
        });
      }

      const solicitud = await SolicitudModel.updateEstado(
        req.params.id,
        id_estado_solicitud,
      );

      if (!solicitud) {
        return res
          .status(404)
          .json({ success: false, message: "Solicitud no encontrada" });
      }

      res.json({ success: true, data: solicitud });
    } catch (err) {
      console.error("update estado solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar estado" });
    }
  },

  async uploadArchivoRespuesta(req, res) {
    try {
      const solicitud = await SolicitudModel.getById(req.params.id);

      if (!solicitud) {
        return res
          .status(404)
          .json({ success: false, message: "Solicitud no encontrada" });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No se envio archivo_respuesta",
        });
      }

      const saved = await FileNetworkAdobeService.saveComplianceResponse(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
      );

      const data = await SolicitudModel.updateArchivoRespuesta(
        req.params.id,
        saved.fileUrl,
      );

      res.json({
        success: true,
        data: {
          solicitud: data,
          archivo_respuesta_ruta: saved.fileUrl,
          nombre_archivo: saved.fileName,
        },
      });
    } catch (err) {
      console.error("upload archivo respuesta error:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Error al cargar archivo de respuesta",
      });
    }
  },

  async remove(req, res) {
    try {
      await SolicitudModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete solicitud error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar solicitud" });
    }
  },
};

module.exports = SolicitudController;
