const ContraparteModel = require("../models/contraparteModel");
const UsuariosModel = require("../models/usuariosModel");

const UsuariosController = {
  async getAll(req, res) {
    try {
      const usuarios = await UsuariosModel.getAll();
      res.json({ success: true, data: usuarios });
    } catch (err) {
      console.error("getAll usuarios error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener usuarios" });
    }
  },

  async getById(req, res) {
    try {
      const usuario = await UsuariosModel.getById(req.params.id);
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado" });
      }
      res.json({ success: true, data: usuario });
    } catch (err) {
      console.error("getById usuarios error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al obtener usuario" });
    }
  },

  async create(req, res) {
    try {
      const { nombre, correo, contrasena, id_rol } = req.body;

      if (!nombre || !correo || !contrasena || !id_rol) {
        return res.status(400).json({
          success: false,
          message: "nombre, correo, contrasena e id_rol son obligatorios",
        });
      }

      const id = await UsuariosModel.create({
        nombre,
        correo,
        contrasena,
        id_rol,
      });
      const usuario = await UsuariosModel.getById(id);
      res.status(201).json({ success: true, data: usuario });
    } catch (err) {
      console.error("create usuario error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al crear usuario" });
    }
  },

  async update(req, res) {
    try {
      const { nombre, correo, id_rol } = req.body;

      if (!nombre || !correo || !id_rol) {
        return res.status(400).json({
          success: false,
          message: "nombre, correo e id_rol son obligatorios",
        });
      }

      const usuario = await UsuariosModel.update(req.params.id, {
        nombre,
        correo,
        id_rol,
      });
      res.json({ success: true, data: usuario });
    } catch (err) {
      console.error("update usuario error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al actualizar usuario" });
    }
  },

  async updateStatus(req, res) {
    try {
      const { activo } = req.body;

      if (typeof activo !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "activo debe ser booleano",
        });
      }

      const usuario = await UsuariosModel.updateStatus(req.params.id, activo);
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado" });
      }

      res.json({ success: true, data: usuario });
    } catch (err) {
      console.error("update usuario status error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al cambiar estado" });
    }
  },

  async updatePassword(req, res) {
    try {
      const { contrasena } = req.body;

      if (!contrasena || String(contrasena).length < 8) {
        return res.status(400).json({
          success: false,
          message: "La nueva contrasena debe tener al menos 8 caracteres",
        });
      }

      const usuario = await UsuariosModel.updatePassword(
        req.params.id,
        String(contrasena),
      );
      if (!usuario) {
        return res
          .status(404)
          .json({ success: false, message: "Usuario no encontrado" });
      }

      res.json({ success: true, data: usuario });
    } catch (err) {
      console.error("update usuario password error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al cambiar contrasena" });
    }
  },

  async remove(req, res) {
    try {
      await UsuariosModel.delete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      console.error("delete usuario error:", err);
      res
        .status(500)
        .json({ success: false, message: "Error al eliminar usuario" });
    }
  },

  // login sencillo (sin JWT, puedes agregarlo luego)
  async login(req, res) {
    try {
      const { correo, contrasena } = req.body;

      // 1) Intentar login como USUARIO del sistema (oficial, admin, etc.)
      const usuario = await UsuariosModel.getByCorreo(correo);

      if (usuario) {
        if (Number(usuario.activo ?? 1) !== 1) {
          return res
            .status(403)
            .json({ success: false, message: "Usuario deshabilitado" });
        }

        const match = await UsuariosModel.comparePassword(
          contrasena,
          usuario.contrasena
        );

        if (match) {
          return res.json({
            success: true,
            data: {
              tipo: "usuario", // para que el frontend sepa qué es
              id: usuario.id,
              nombre: usuario.nombre,
              correo: usuario.correo,
              id_rol: usuario.id_rol,
            },
          });
        }
        // si el correo existe en usuarios pero la contraseña es incorrecta,
        // aquí podrías devolver 401 directamente, según política
      }

      // 2) Si no es usuario "quemado", intentar como CONTRAPARTE
      const contraparte = await ContraparteModel.getByCorreo(correo);

      if (contraparte) {
        // Nro_doc suele ser INT, lo pasamos a string para comparar
        const nroDocStr = String(contraparte.Nro_doc);
        if (contrasena === nroDocStr) {
          return res.json({
            success: true,
            data: {
              tipo: "contraparte",
              id_contraparte: contraparte.id,
              nombre: contraparte.Nombre,
              correo: contraparte.Correo,
              tipo_doc: contraparte.Tipo_doc,
              nro_doc: contraparte.Nro_doc,
              id_tipo_contraparte: contraparte.id_tipo_contraparte,
            },
          });
        }
      }

      // 3) Si llegó hasta aquí, es que nada coincidió
      return res
        .status(401)
        .json({ success: false, message: "Credenciales inválidas" });
    } catch (err) {
      console.error("login error:", err);
      res.status(500).json({ success: false, message: "Error en login" });
    }
  },
};

module.exports = UsuariosController;
