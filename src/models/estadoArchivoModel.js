const pool = require("../config/db");

const EstadoArchivoModel = {
  async getAll() {
    const [rows] = await pool.query("SELECT * FROM estado_archivo");
    return rows;
  },
};

module.exports = EstadoArchivoModel;
