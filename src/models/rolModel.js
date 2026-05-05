const pool = require("../config/db");

const RolModel = {
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM rol");
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query("SELECT * FROM rol WHERE id = ?", [id]);
    return rows[0] || null;
  },

  async create({ nombre_rol }) {
    const [result] = await pool.query(
      "INSERT INTO rol (id, nombre_rol) VALUES (NULL, ?)",
      [nombre_rol]
    );
    return result.insertId;
  },

  async update(id, { nombre_rol }) {
    await pool.query("UPDATE rol SET nombre_rol = ? WHERE id = ?", [
      nombre_rol,
      id,
    ]);
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM rol WHERE id = ?", [id]);
    return true;
  },
};

module.exports = RolModel;
