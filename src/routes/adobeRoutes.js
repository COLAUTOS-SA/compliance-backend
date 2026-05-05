const express = require("express");
const pool = require("../config/db");
const AdobeSignService = require("../services/adobeSignService");
const AdobeAgreementModel = require("../models/adobeAgreementModel");
const FileNetworkAdobeService = require("../services/fileNetworkAdobeService");

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

function normalizeAdobeStatus(status) {
  const value = String(status || "").toUpperCase();
  if (value === "SIGNED" || value === "AGREEMENT_SIGNED") return "signed";
  if (value === "AGREEMENT_COMPLETED" || value === "WORKFLOW_COMPLETED") {
    return "signed";
  }
  if (value === "OUT_FOR_SIGNATURE" || value === "IN_PROCESS") return "waiting";
  if (value === "CANCELLED" || value === "ABORTED") return "cancelled";
  if (value === "REJECTED" || value === "AGREEMENT_REJECTED") return "rejected";
  if (value === "EXPIRED" || value === "AGREEMENT_EXPIRED") return "expired";
  return value ? value.toLowerCase() : "unknown";
}

function getAgreementId(body) {
  return (
    body?.agreementAssetList?.[0]?.id ||
    body?.agreement?.id ||
    body?.agreementId ||
    null
  );
}

function getEventCode(body) {
  const events = Array.isArray(body.webhookEvents) ? body.webhookEvents : [];
  return String(events[0]?.eventCode || body?.event || "").toUpperCase();
}

function getParticipantEmail(body) {
  return (
    body?.agreement?.participantSetsInfo?.[0]?.memberInfos?.[0]?.email ||
    body?.participantInfo?.email ||
    body?.participantUserEmail ||
    body?.actingUserEmail ||
    body?.agreement?.senderEmail ||
    null
  );
}

async function findSolicitudId({ agreementId, email }) {
  if (agreementId) {
    const local = await AdobeAgreementModel.getByAgreementId(agreementId).catch(
      () => null,
    );
    if (local?.id_solicitud) return local.id_solicitud;
  }

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const [rows] = await pool.query(
    `SELECT s.id
     FROM solicitud s
     INNER JOIN contraparte c ON c.id = s.id_contraparte
     WHERE LOWER(TRIM(c.Correo)) = ?
     ORDER BY s.id DESC
     LIMIT 1`,
    [normalizedEmail],
  );

  return rows?.[0]?.id || null;
}

async function persistSignedDocumentFromWebhook(body, agreementId, idSolicitud) {
  const base64Pdf = body?.agreement?.signedDocumentInfo?.document;
  const pdfBuffer = base64Pdf
    ? Buffer.from(base64Pdf, "base64")
    : await adobeSign.downloadSignedDocument(agreementId);

  const saved = await FileNetworkAdobeService.saveSignedPDF(
    idSolicitud || "sin_solicitud",
    pdfBuffer,
  );

  return saved.pdfUrl;
}

router.get("/signing-url/:agreementId", async (req, res) => {
  try {
    const { agreementId } = req.params;
    const signingData = await adobeSign.getAgreementSigningUrls(agreementId);

    const signingUrl =
      signingData?.signingUrlSetInfos?.[0]?.signingUrls?.[0]?.esignUrl;

    if (!signingUrl) {
      throw new Error("No disponible aun para firma");
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

    if (secret && !adobeSign.validateWebhookSignature(payload, signature, secret)) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid webhook signature" });
    }

    const body = req.body || {};
    const agreementId = getAgreementId(body);
    const eventCode = getEventCode(body);
    const email = getParticipantEmail(body);
    const idSolicitud = await findSolicitudId({ agreementId, email });

    console.log("WEBHOOK EVENT:", eventCode);
    console.log("WEBHOOK AGREEMENT:", agreementId);
    console.log("WEBHOOK EMAIL:", email);
    console.log("WEBHOOK SOLICITUD:", idSolicitud);

    const isSignedEvent = [
      "AGREEMENT_WORKFLOW_COMPLETED",
      "AGREEMENT_ACTION_COMPLETED",
      "AGREEMENT_SIGNED",
      "AGREEMENT_COMPLETED",
    ].includes(eventCode);

    if (agreementId && isSignedEvent) {
      let pdfUrl = null;

      try {
        pdfUrl = await persistSignedDocumentFromWebhook(
          body,
          agreementId,
          idSolicitud,
        );
      } catch (docError) {
        console.error("adobe webhook signed document error:", docError.message);
      }

      await AdobeAgreementModel.markSigned(agreementId, {
        pdfUrl,
        pdfPath: null,
      }).catch(() => null);

      if (idSolicitud && pdfUrl) {
        await pool.query(
          "UPDATE solicitud SET conocimiento_contrapartes = ?, fecha_ult_actualizacion = NOW() WHERE id = ?",
          [pdfUrl, idSolicitud],
        );
      }
    } else if (agreementId && eventCode === "AGREEMENT_REJECTED") {
      await AdobeAgreementModel.updateStatus(agreementId, "rejected").catch(
        () => null,
      );
    } else if (agreementId && eventCode === "AGREEMENT_EXPIRED") {
      await AdobeAgreementModel.updateStatus(agreementId, "expired").catch(
        () => null,
      );
    } else if (agreementId && eventCode) {
      await AdobeAgreementModel.updateStatus(
        agreementId,
        normalizeAdobeStatus(eventCode),
      ).catch(() => null);
    }
  } catch (error) {
    console.error("adobe webhook processing error:", error);
  }

  return sendHandshakeResponse(res, clientIdToReturn);
});

module.exports = router;
