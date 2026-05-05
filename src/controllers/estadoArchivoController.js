const EstadoArchivoModel = require("../models/estadoArchivoModel");

const EstadoArchivoController = {
  async getAll(req, res) {
    try {
      const data = await EstadoArchivoModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll estado_archivo error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al obtener estados de archivo",
        });
    }
  },
};

module.exports = EstadoArchivoController;
