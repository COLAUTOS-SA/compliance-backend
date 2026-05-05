const pool = require("../config/db");

const ConceptoModel = {
  async getAll() {
    const [rows] = await pool.query(
      "SELECT c.*, u.nombre AS nombre_usuario " +
        "FROM concepto_oficial_cumplimiento c " +
        "JOIN usuarios u ON c.id_usuario = u.id"
    );
    return rows;
  },

  async getBySolicitud(id_solicitud) {
    const [rows] = await pool.query(
      "SELECT c.*, u.nombre AS nombre_usuario " +
        "FROM concepto_oficial_cumplimiento c " +
        "JOIN usuarios u ON c.id_usuario = u.id " +
        "WHERE c.id_solicitud = ?",
      [id_solicitud]
    );
    return rows;
  },

  async create({ descripcion, id_usuario, id_solicitud }) {
    const [result] = await pool.query(
      "INSERT INTO concepto_oficial_cumplimiento (id, descripcion, id_usuario, id_solicitud, fecha_creacion) " +
        "VALUES (NULL, ?, ?, ?, NOW())",
      [descripcion, id_usuario, id_solicitud]
    );
    return result.insertId;
  },
};

module.exports = ConceptoModel;
