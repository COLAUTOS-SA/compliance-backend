const RolModel = require("../models/rolModel");

const RolController = {
  async getAll(req, res) {
    try {
      const data = await RolModel.getAll();
      res.json({ success: true, data });
    } catch (err) {
      console.error("getAll rol error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener roles" });
    }
  },

  async getById(req, res) {
    try {
      const data = await RolModel.getById(req.params.id);
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Rol no encontrado" });
      res.json({ success: true, data });
    } catch (err) {
      console.error("getById rol error:", err);
      res.status(500).json({ success: false, message: "Error al obtener rol" });
    }
  },

  async create(req, res) {
    try {
      const { nombre_rol } = req.body;
      const id = await RolModel.create({ nombre_rol });
      const data = await RolModel.getById(id);
      res.status(201).json({ success: true, data });
    } catch (err) {
      console.error("create rol error:", err);
      res.status(500).json({ success: false, message: "Error al crear rol" });
    }
  },

  async update(req, res) {
    try {
      const { nombre_rol } = req.body;
      const data = await RolModel.update(req.params.id, { nombre_rol });
      res.json({ success: true, data });
    } catch (err) {
      console.error("update rol error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar rol" });
    }
  },

  async remove(req, res) {
    try {
      await RolModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete rol error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar rol" });
    }
  },
};

module.exports = RolController;
