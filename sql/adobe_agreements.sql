CREATE TABLE IF NOT EXISTS adobe_agreements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  id_solicitud INT NOT NULL,
  id_contraparte INT NOT NULL,
  agreement_id VARCHAR(128) NOT NULL UNIQUE,
  template_id VARCHAR(128) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'sent',
  widget_id VARCHAR(128) DEFAULT NULL,
  signing_url TEXT DEFAULT NULL,
  pdf_url TEXT DEFAULT NULL,
  pdf_path TEXT DEFAULT NULL,
  fecha_firma DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_adobe_agreements_solicitud (id_solicitud),
  INDEX idx_adobe_agreements_contraparte (id_contraparte)
);
