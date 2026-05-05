const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");
const AdobeSignService = require("../services/adobeSignService");
const AdobeAgreementModel = require("../models/adobeAgreementModel");

const FileNetworkAdobeService = require("../services/fileNetworkAdobeService");
// const fs = require("fs");
// const path = require("path");
const router = express.Router();
const adobeSign = new AdobeSignService();

function getAdobeClientId(req) {
  return (
    req.get("X-ADOBESIGN-CLIENTID") ||
    req.get("x-adobesign-clientid") ||
    req.body?.xAdobeSignClientId ||
    req.body?.xadobesignclientid ||
    ""
  );
}

function getConfiguredClientId() {
  return process.env.ADOBE_CLIENT_ID || process.env.ADOBE_SIGN_CLIENT_ID || "";
}

function sendHandshakeResponse(res, clientId) {
  return res.status(200).set("X-ADOBESIGN-CLIENTID", clientId).json({
    xAdobeSignClientId: clientId,
  });
}

function mapCounterpartyTypeToTemplate(tipoContraparte) {
  const templates = {
    PROVEEDOR: process.env.ADOBE_TEMPLATE_PROVEEDOR,
    CLIENTE: process.env.ADOBE_TEMPLATE_CLIENTE,
    ACCIONISTA: process.env.ADOBE_TEMPLATE_ACCIONISTA,
    EMPLEADO: process.env.ADOBE_TEMPLATE_EMPLEADO,
  };
  return (
    templates[String(tipoContraparte || "").toUpperCase()] ||
    process.env.ADOBE_TEMPLATE_DEFAULT ||
    null
  );
}

function normalizeAdobeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "SIGNED") return "signed";
  if (value === "OUT_FOR_SIGNATURE" || value === "IN_PROCESS") return "waiting";
  if (value === "CANCELLED" || value === "ABORTED") return "cancelled";
  if (value === "REJECTED") return "rejected";
  if (value === "EXPIRED") return "expired";
  return value ? value.toLowerCase() : "unknown";
}

async function persistSignedDocument(agreementId, idSolicitud) {
  const pdfBuffer = await adobeSign.downloadSignedDocument(agreementId);
  const storagePath =
    process.env.STORAGE_PATH || path.join(process.cwd(), "uploads", "adobe");
  const storageUrl = process.env.STORAGE_URL || "/uploads/adobe";
  const filename = `${idSolicitud || "sol"}_${agreementId}.pdf`;

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  const pdfPath = path.join(storagePath, filename);
  fs.writeFileSync(pdfPath, pdfBuffer);

  const pdfUrl = storageUrl.startsWith("http")
    ? `${storageUrl.replace(/\/$/, "")}/${filename}`
    : `${storageUrl}/${filename}`.replace(/\/{2,}/g, "/");

  return { pdfPath, pdfUrl };
}


router.post("/webhook", async (req, res) => {
  const clientId = getAdobeClientId(req) || getConfiguredClientId();

  try {
    const body = req.body || {};

    console.log("📦 WEBHOOK:", JSON.stringify(body, null, 2));

    const event = body?.event || "";

    const agreementId = body?.agreement?.id || body?.agreementId || null;

    // 🔹 EMAIL (robusto)
    const email =
      body?.participantUserEmail ||
      body?.actingUserEmail ||
      body?.agreement?.senderEmail ||
      null;

    const normalizedEmail = email?.trim().toLowerCase();

    let idSolicitud = null;

    if (normalizedEmail) {
      const [rows] = await pool.query(
        `SELECT s.id 
         FROM solicitud s
         INNER JOIN contraparte c ON c.id = s.id_contraparte
         WHERE LOWER(TRIM(c.Correo)) = ?
         ORDER BY s.id DESC
         LIMIT 1`,
        [normalizedEmail],
      );

      idSolicitud = rows?.[0]?.id || null;
    }

    console.log("📩 EVENT:", event);
    console.log("📄 AGREEMENT:", agreementId);
    console.log("📧 EMAIL:", email);
    console.log("🆔 SOLICITUD:", idSolicitud);

    // 🔥 EVENTOS DE FIRMA
    if (
      event === "AGREEMENT_WORKFLOW_COMPLETED" ||
      event === "AGREEMENT_ACTION_COMPLETED"
    ) {
      const base64Pdf = body?.agreement?.signedDocumentInfo?.document;

      if (!base64Pdf) {
        console.log("❌ No viene PDF");
        return sendHandshakeResponse(res, clientId);
      }

      const buffer = Buffer.from(base64Pdf, "base64");

      console.log("📥 Guardando PDF en CTERA...");

      const saved = await FileNetworkAdobeService.saveSignedPDF(
        idSolicitud,
        buffer,
      );

      const pdfUrl = saved.pdfUrl;

      console.log("✅ Guardado en:", pdfUrl);

      if (idSolicitud) {
        await pool.query(
          `UPDATE solicitud 
           SET conocimiento_contrapartes = ?, 
               fecha_ult_actualizacion = NOW() 
           WHERE id = ?`,
          [pdfUrl, idSolicitud],
        );
      }
    }
  } catch (error) {
    console.error("❌ WEBHOOK ERROR:", error);
  }

  return sendHandshakeResponse(res, clientId);
});

router.get("/signing-url/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;

    const signingData = await adobeSign.getAgreementSigningUrls(agreementId);

    const signingUrl =
      signingData?.signingUrlSetInfos?.[0]?.signingUrls?.[0]?.esignUrl;

    if (!signingUrl) {
      throw new Error("No disponible aún para firma");
    }

    return res.json({
      success: true,
      data: { signing_url: signingUrl },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/agreement/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const statusData = await adobeSign.getAgreementStatus(agreementId);
    const normalized = normalizeAdobeStatus(statusData?.status);

    await AdobeAgreementModel.updateStatus(agreementId, normalized).catch(
      () => null,
    );
    const local = await AdobeAgreementModel.getByAgreementId(agreementId).catch(
      () => null,
    );

    return res.json({
      success: true,
      data: {
        agreement_id: agreementId,
        status: normalized,
        signers_info: statusData?.participantSetsInfo || [],
        pdf_url: local?.pdf_url || null,
      },
    });
  } catch (error) {
    console.error("adobe agreement status error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error consultando estado del acuerdo",
    });
  }
});

router.post("/webhook", async (req, res) => {
  const receivedClientId = getAdobeClientId(req);
  const configuredClientId = getConfiguredClientId();
  const clientIdToReturn = receivedClientId || configuredClientId;

  if (!clientIdToReturn) {
    return res.status(500).json({
      success: false,
      error: "Missing Adobe client id configuration",
    });
  }

  try {
    const signature =
      req.get("x-adobe-signature") ||
      req.get("x-adobesign-signature") ||
      req.get("x-adobe-sign-webhook-signature");
    const secret =
      process.env.ADOBE_WEBHOOKS_SECRET ||
      process.env.ADOBE_WEBHOOK_SECRET ||
      "";
    const payload = req.rawBody || JSON.stringify(req.body || {});
    // Si no hay secret configurado, no validar
    if (secret) {
      if (!adobeSign.validateWebhookSignature(payload, signature, secret)) {
        return res
          .status(401)
          .json({ success: false, error: "Invalid webhook signature" });
      }
    }
    const body = req.body || {};

    console.log("WEBHOOK BODY:", JSON.stringify(body, null, 2));
    const events = Array.isArray(body.webhookEvents) ? body.webhookEvents : [];
    const agreementId =
      body?.agreementAssetList?.[0]?.id ||
      body?.agreement?.id ||
      body?.agreementId ||
      null;

    if (agreementId && events.length > 0) {
      const eventCode = String(events[0]?.eventCode || "").toUpperCase();
      const email =
        body?.agreement?.participantSetsInfo?.[0]?.memberInfos?.[0]?.email ||
        body?.participantInfo?.email ||
        body?.agreement?.senderEmail ||
        null;

      const normalizedEmail = email?.trim().toLowerCase();

      console.log("📩 WEBHOOK EVENT:", eventCode);
      console.log("📧 EMAIL:", email);
      console.log("📄 AGREEMENT:", agreementId);

      let idSolicitud = null;

      if (email) {
        const [rows] = await pool.query(
          "SELECT s.id FROM solicitud s INNER JOIN contraparte c ON c.id = s.id_contraparte WHERE LOWER(TRIM(c.Correo)) = ? ORDER BY s.id DESC LIMIT 1",
          [normalizedEmail],
        );

        idSolicitud = rows?.[0]?.id || null;
        console.log("🔎 BUSCANDO SOLICITUD PARA:", normalizedEmail);
        console.log("🧾 RESULT:", rows);
      }

      if (
        eventCode === "AGREEMENT_SIGNED" ||
        eventCode === "AGREEMENT_COMPLETED"
      ) {
        let pdfUrl = null;
        let pdfPath = null;
        try {
          const signedDoc = await persistSignedDocument(
            agreementId,
            idSolicitud,
          );
          pdfUrl = signedDoc.pdfUrl;
          pdfPath = signedDoc.pdfPath;
        } catch (docError) {
          console.error(
            "adobe webhook signed document error:",
            docError.message,
          );
        }

        await AdobeAgreementModel.markSigned(agreementId, {
          pdfUrl,
          pdfPath,
        }).catch(() => null);
        if (idSolicitud && pdfUrl) {
          await pool
            .query(
              "UPDATE solicitud SET conocimiento_contrapartes = ?, fecha_ult_actualizacion = NOW() WHERE id = ?",
              [pdfUrl, idSolicitud],
            )
            .catch(() => null);
        }
      } else if (eventCode === "AGREEMENT_REJECTED") {
        await AdobeAgreementModel.updateStatus(agreementId, "rejected").catch(
          () => null,
        );
      } else if (eventCode === "AGREEMENT_EXPIRED") {
        await AdobeAgreementModel.updateStatus(agreementId, "expired").catch(
          () => null,
        );
      } else if (eventCode) {
        await AdobeAgreementModel.updateStatus(
          agreementId,
          normalizeAdobeStatus(eventCode),
        ).catch(() => null);
      }
    }
  } catch (error) {
    console.error("adobe webhook processing error:", error);
  }

  return sendHandshakeResponse(res, clientIdToReturn);
});

module.exports = router;
