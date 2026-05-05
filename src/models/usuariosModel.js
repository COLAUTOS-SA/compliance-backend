const pool = require("../config/db");
const bcrypt = require("bcryptjs");

const UsuariosModel = {
  async getAll() {
    const [rows] = await pool.query(
      "SELECT u.id, u.nombre, u.correo, u.id_rol, r.nombre_rol " +
        "FROM usuarios u JOIN rol r ON u.id_rol = r.id"
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT id, nombre, correo, id_rol FROM usuarios WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async getByCorreo(correo) {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [
      correo,
    ]);
    return rows[0] || null;
  },

  async create({ nombre, correo, contrasena, id_rol }) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(contrasena, salt);

    console.log(correo)

    const [result] = await pool.query(
      "INSERT INTO usuarios (id, nombre, correo, contrasena, id_rol) " +
        "VALUES (NULL, ?, ?, ?, ?)",
      [nombre, correo, hash, id_rol]
    );
    return result.insertId;
  },

  async update(id, { nombre, correo, id_rol }) {
    await pool.query(
      "UPDATE usuarios SET nombre = ?, correo = ?, id_rol = ? WHERE id = ?",
      [nombre, correo, id_rol, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    return true;
  },

  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },
};

module.exports = UsuariosModel;
