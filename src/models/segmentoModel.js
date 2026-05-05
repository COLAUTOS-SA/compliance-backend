const pool = require("../config/db");

const SegmentoModel = {
  async getAll() {
    const [rows] = await pool.query(
      "SELECT s.*, t.Nombre AS Tipo_Contraparte " +
        "FROM Segmento s " +
        "JOIN Tipo_Contraparte t ON s.id_tipo_contraparte = t.id"
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT s.*, t.Nombre AS Tipo_Contraparte " +
        "FROM Segmento s " +
        "JOIN Tipo_Contraparte t ON s.id_tipo_contraparte = t.id " +
        "WHERE s.id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async create({ Nombre, id_tipo_contraparte }) {
    const [result] = await pool.query(
      "INSERT INTO Segmento (Nombre, id_tipo_contraparte) VALUES (?, ?)",
      [Nombre, id_tipo_contraparte]
    );
    return result.insertId;
  },

  async update(id, { Nombre, id_tipo_contraparte }) {
    await pool.query(
      "UPDATE Segmento SET Nombre = ?, id_tipo_contraparte = ? WHERE id = ?",
      [Nombre, id_tipo_contraparte, id]
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM Segmento WHERE id = ?", [id]);
    return true;
  },
};

module.exports = SegmentoModel;
