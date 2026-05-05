const ArchivosModel = require("../models/archivosModel");
const FileNetworkAdobeService = require("../services/fileNetworkAdobeService");

const ArchivosController = {
  // ✅ GET /api/archivos  ó  GET /api/archivos?solicitud=ID
  async getAll(req, res) {
    try {
      const { solicitud } = req.query;

      if (solicitud) {
        const data = await ArchivosModel.getBySolicitudId(Number(solicitud));
        return res.json({ success: true, data });
      }

      const data = await ArchivosModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll archivos error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener archivos" });
    }
  },

  async getById(req, res) {
    try {
      const data = await ArchivosModel.getById(req.params.id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Archivo no encontrado" });
      res.json({ success: true, data });
    } catch (err) {
      console.error("getById archivos error:", err);
      res
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

    // 🔥 COPIA SEGURA (MUY IMPORTANTE)
    const files = [...req.files];
    const tiposSafe = [...tiposArray];

    // 🔥 RESPONDER INMEDIATO
    res.status(200).json({
      success: true,
      message: "Archivos en proceso",
    });

    // 🔥 PROCESO EN BACKGROUND
    setImmediate(async () => {
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const tipo = tiposSafe[i];

          console.log("📎 Procesando:", file.originalname);
          console.log("📄 Tipo:", tipo);

          // 🚨 VALIDACIÓN CRÍTICA
          if (!tipo) {
            console.error(
              "❌ tipo_documento faltante para:",
              file.originalname
            );
            continue; // no rompe todo el proceso
          }

          // 🔥 SUBIR A CTERA
          const saved = await FileNetworkAdobeService.saveAttachment(
            id_solicitud,
            file.buffer,
            file.originalname
          );

          // 🔥 GUARDAR EN DB
          await ArchivosModel.create({
            ruta_archivo: saved.fileUrl,
            nombre_archivo: saved.fileName,
            tipo_documento: tipo,
            id_contraparte,
            id_solicitud,
          });

          console.log("✅ Guardado:", saved.fileUrl);
        }

        console.log("🎉 TODOS LOS ARCHIVOS PROCESADOS");
      } catch (err) {
        console.error("❌ ERROR BACKGROUND:", err);
      }
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
      res.json({ success: true, data });
    } catch (err) {
      console.error("update archivo error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar archivo" });
    }
  },

  // ✅ PUT /api/archivos/:id/revision
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
      res.json({ success: true, data });
    } catch (err) {
      console.error("updateRevision archivo error:", err);
      res.status(500).json({
        success: false,
        message: "Error al actualizar revisión del archivo",
      });
    }
  },

  async remove(req, res) {
    try {
      await ArchivosModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete archivo error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar archivo" });
    }
  },
};

module.exports = ArchivosController;
