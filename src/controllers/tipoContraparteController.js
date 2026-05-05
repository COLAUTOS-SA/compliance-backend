const TipoContraparteModel = require("../models/tipoContraparteModel");

const TipoContraparteController = {
  async getAll(req, res) {
    try {
      const data = await TipoContraparteModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll tipo_contraparte error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al obtener tipos de contraparte",
        });
    }
  },

  async getById(req, res) {
    try {
      const data = await TipoContraparteModel.getById(req.params.id);
      if (!data)
        return res
          .status(404)
          .json({
            success: false,
            message: "Tipo de contraparte no encontrado",
          });
      res.json({ success: true, data });
    } catch (err) {
      console.error("getById tipo_contraparte error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al obtener tipo de contraparte",
        });
    }
  },

  async create(req, res) {
    try {
      const { Nombre, Nombre_Segmento } = req.body;
      const id = await TipoContraparteModel.create({ Nombre, Nombre_Segmento });
      const data = await TipoContraparteModel.getById(id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create tipo_contraparte error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al crear tipo de contraparte",
        });
    }
  },

  async update(req, res) {
    try {
      const { Nombre, Nombre_Segmento } = req.body;
      const data = await TipoContraparteModel.update(req.params.id, {
        Nombre,
        Nombre_Segmento,
      });
      res.json({ success: true, data });
    } catch (err) {
      console.error("update tipo_contraparte error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al actualizar tipo de contraparte",
        });
    }
  },

  async remove(req, res) {
    try {
      await TipoContraparteModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete tipo_contraparte error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Error al eliminar tipo de contraparte",
        });
    }
  },
};

module.exports = TipoContraparteController;
