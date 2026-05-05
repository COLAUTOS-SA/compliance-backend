const pool = require("../config/db");

const ContraparteModel = {
  async getByCorreo(correo) {
    const [rows] = await pool.query(
      "SELECT * FROM contraparte WHERE Correo = ?",
      [correo],
    );
    return rows[0] || null;
  },

  async getAll() {
    const [rows] = await pool.query(
      "SELECT c.*, t.Nombre AS Tipo_Contraparte, s.Nombre AS Segmento " +
        "FROM contraparte c " +
        "JOIN tipo_contraparte t ON c.id_tipo_contraparte = t.id " +
        "JOIN segmento s ON c.id_segmento = s.id",
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT c.*, t.Nombre AS Tipo_Contraparte, s.Nombre AS Segmento " +
        "FROM contraparte c " +
        "JOIN tipo_contraparte t ON c.id_tipo_contraparte = t.id " +
        "JOIN segmento s ON c.id_segmento = s.id " +
        "WHERE c.id = ?",
      [id],
    );
    return rows[0] || null;
  },

  async create({
    Nombre,
    Correo,
    Tipo_doc,
    Nro_doc,
    id_tipo_contraparte,
    id_segmento,
  }) {
    const [result] = await pool.query(
      "INSERT INTO contraparte (id, Nombre, Correo, Tipo_doc, Nro_doc, id_tipo_contraparte, id_segmento) " +
        "VALUES (NULL, ?, ?, ?, ?, ?, ?)",
      [Nombre, Correo, Tipo_doc, Nro_doc, id_tipo_contraparte, id_segmento],
    );
    return result.insertId;
  },

  async update(
    id,
    { Nombre, Tipo_doc, Nro_doc, id_tipo_contraparte, id_segmento },
  ) {
    await pool.query(
      "UPDATE contraparte SET Nombre = ?, Tipo_doc = ?, Nro_doc = ?, " +
        "id_tipo_contraparte = ?, id_segmento = ? WHERE id = ?",
      [Nombre, Tipo_doc, Nro_doc, id_tipo_contraparte, id_segmento, id],
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM contraparte WHERE id = ?", [id]);
    return true;
  },

  async findByEmail(email) {
    const [rows] = await pool.query(
      "SELECT * FROM contraparte WHERE Correo = ? LIMIT 1",
      [email],
    );
    return rows[0] || null;
  },
};

module.exports = ContraparteModel;
