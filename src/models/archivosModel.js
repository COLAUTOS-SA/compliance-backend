const pool = require("../config/db");

const ArchivosModel = {
  // ✅ Crear archivo: SIEMPRE sin concepto (lo pone la oficial después)
  async create(data) {
    const {
      ruta_archivo = "",
      nombre_archivo,
      tipo_documento,
      id_contraparte,
      id_solicitud,
      id_estado_archivo = 1, // 1 = PENDIENTE REVISION
    } = data;

    const [result] = await pool.query(
      `INSERT INTO archivos
        (ruta_archivo, nombre_archivo, tipo_documento,
         id_contraparte, id_solicitud, id_estado_archivo,
         concepto, fecha_concepto, id_usuario_concepto)
       VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
      [
        ruta_archivo,
        nombre_archivo,
        tipo_documento,
        id_contraparte,
        id_solicitud,
        id_estado_archivo,
      ]
    );

    return { id: result.insertId };
  },

  // ✅ Revisión oficial: actualiza estado + concepto (por archivo)
  async updateRevision(idArchivo, data) {
    const { id_estado_archivo, concepto, id_usuario_concepto = null } = data;

    const [result] = await pool.query(
      `UPDATE archivos
       SET id_estado_archivo = ?,
           concepto = ?,
           fecha_concepto = NOW(),
           id_usuario_concepto = ?
       WHERE id = ?`,
      [id_estado_archivo, concepto || null, id_usuario_concepto, idArchivo]
    );

    return { affectedRows: result.affectedRows };
  },

  async getAll() {
    const [rows] = await pool.query(
      "SELECT a.*, c.Nombre AS Nombre_Contraparte, s.id AS id_solicitud_ref, ea.Nombre AS Estado " +
        "FROM archivos a " +
        "LEFT JOIN contraparte c ON a.id_contraparte = c.id " +
        "LEFT JOIN solicitud s ON a.id_solicitud = s.id " +
        "LEFT JOIN estado_archivo ea ON a.id_estado_archivo = ea.id"
    );
    return rows;
  },

  // ✅ Para el modal: traer archivos de UNA solicitud
  async getBySolicitudId(idSolicitud) {
    const [rows] = await pool.query(
      "SELECT a.*, ea.Nombre AS Estado " +
        "FROM archivos a " +
        "LEFT JOIN estado_archivo ea ON a.id_estado_archivo = ea.id " +
        "WHERE a.id_solicitud = ?",
      [idSolicitud]
    );
    return rows;
  },

  async getById(id) {
    const [rows] = await pool.query(
      "SELECT a.*, ea.Nombre AS Estado " +
        "FROM archivos a " +
        "LEFT JOIN estado_archivo ea ON a.id_estado_archivo = ea.id " +
        "WHERE a.id = ?",
      [id]
    );
    return rows[0] || null;
  },

  async update(
    id,
    {
      ruta_archivo,
      nombre_archivo,
      id_contraparte,
      id_solicitud,
      id_estado_archivo,
    }
  ) {
    await pool.query(
      "UPDATE archivos SET ruta_archivo = ?, nombre_archivo = ?, id_contraparte = ?, " +
        "id_solicitud = ?, id_estado_archivo = ? WHERE id = ?",
      [
        ruta_archivo,
        nombre_archivo,
        id_contraparte,
        id_solicitud,
        id_estado_archivo,
        id,
      ]
    );
    return this.getById(id);
  },

  async delete(id) {
    await pool.query("DELETE FROM archivos WHERE id = ?", [id]);
    return true;
  },
};

module.exports = ArchivosModel;
