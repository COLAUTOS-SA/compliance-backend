const pool = require("../config/db");

const TipoContraparteModel = {
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM tipo_contraparte");
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM tipo_contraparte WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async create({ Nombre, Nombre_Segmento }) {
    const [result] = await pool.query(
      "INSERT INTO tipo_contraparte (id, Nombre, Nombre_Segmento) VALUES (NULL, ?, ?)",
      [Nombre, Nombre_Segmento]
    );
    return result.insertId;
  },

  async update(id, { Nombre, Nombre_Segmento }) {
    await pool.query(
      "UPDATE tipo_contraparte SET Nombre = ?, Nombre_Segmento = ? WHERE id = ?",
      [Nombre, Nombre_Segmento, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM tipo_contraparte WHERE id = ?", [id]);
    return true;
  },
};

module.exports = TipoContraparteModel;
