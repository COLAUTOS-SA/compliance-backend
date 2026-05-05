const pool = require("../config/db");

const SolicitudModel = {
  async getAll() {
    const [rows] = await pool.query(
      "SELECT s.*, c.Nombre AS Nombre_Contraparte " +
        "FROM solicitud s JOIN contraparte c ON s.id_contraparte = c.id"
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT s.*, c.Nombre AS Nombre_Contraparte " +
        "FROM solicitud s JOIN contraparte c ON s.id_contraparte = c.id " +
        "WHERE s.id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async create({
    id_contraparte,
    fecha_ult_actualizacion,
    fecha_actual,
    conocimiento_contrapartes,
    id_ult_estado,
  }) {
    console.log(id_contraparte)
    const [result] = await pool.query(
      "INSERT INTO solicitud (id, id_contraparte, fecha_ult_actualizacion, fecha_actual, conocimiento_contrapartes, id_ult_estado) " +
        "VALUES (NULL, ?, ?, ?, ?, ?)",
      [
        id_contraparte,
        fecha_ult_actualizacion,
        fecha_actual,
        conocimiento_contrapartes,
        id_ult_estado,
      ]
    );
    return result.insertId;
  },

  async update(
    id,
    {
      id_contraparte,
      fecha_ult_actualizacion,
      fecha_actual,
      conocimiento_contrapartes,
      id_ult_estado,
    }
  ) {
    await pool.query(
      "UPDATE solicitud SET id_contraparte = ?, fecha_ult_actualizacion = ?, fecha_actual = ?, " +
        "conocimiento_contrapartes = ?, id_ult_estado = ? WHERE id = ?",
      [
        id_contraparte,
        fecha_ult_actualizacion,
        fecha_actual,
        conocimiento_contrapartes,
        id_ult_estado,
        id,
      ]
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM solicitud WHERE id = ?", [id]);
    return true;
  },
};

module.exports = SolicitudModel;
