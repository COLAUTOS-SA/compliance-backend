const pool = require("../config/db");

const AccionistasModel = {
  async getByContraparte(id_contraparte) {
    const [rows] = await pool.query(
      "SELECT * FROM accionistas WHERE id_contraparte = ?",
      [id_contraparte]
    );
    return rows;
  },

  async create({ Nombre, Tipo_doc, Nro_doc, id_contraparte }) {
    const [result] = await pool.query(
      "INSERT INTO accionistas (id, Nombre, Tipo_doc, Nro_doc, id_contraparte) " +
        "VALUES (NULL, ?, ?, ?, ?)",
      [Nombre, Tipo_doc, Nro_doc, id_contraparte]
    );
    return result.insertId;
  },

  async delete(id) {
    await pool.query("DELETE FROM accionistas WHERE id = ?", [id]);
    return true;
  },
};

module.exports = AccionistasModel;
