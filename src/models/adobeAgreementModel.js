const pool = require("../config/db");

const AdobeAgreementModel = {
  async create({
    id_solicitud,
    id_contraparte,
    agreement_id,
    template_id,
    status = "sent",
    widget_id = null,
    signing_url = null,
  }) {
    const sql = `
      INSERT INTO adobe_agreements
        (id_solicitud, id_contraparte, agreement_id, template_id, status, widget_id, signing_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    await pool.query(sql, [
      id_solicitud,
      id_contraparte,
      agreement_id,
      template_id,
      status,
      widget_id,
      signing_url,
    ]);
    return this.getByAgreementId(agreement_id);
  },

  async getByAgreementId(agreementId) {
    const [rows] = await pool.query(
      "SELECT * FROM adobe_agreements WHERE agreement_id = ? LIMIT 1",
      [agreementId]
    );
    return rows[0] || null;
  },

  async updateStatus(agreementId, status) {
    await pool.query(
      "UPDATE adobe_agreements SET status = ?, updated_at = NOW() WHERE agreement_id = ?",
      [status, agreementId]
    );
    return this.getByAgreementId(agreementId);
  },

  async markSigned(agreementId, { pdfUrl = null, pdfPath = null }) {
    await pool.query(
      `UPDATE adobe_agreements
       SET status = 'signed',
           pdf_url = ?,
           pdf_path = ?,
           fecha_firma = NOW(),
           updated_at = NOW()
       WHERE agreement_id = ?`,
      [pdfUrl, pdfPath, agreementId]
    );
    return this.getByAgreementId(agreementId);
  },
};

module.exports = AdobeAgreementModel;
