const crypto = require("crypto");

function normalizeBaseUrl(url, fallback) {
  const source = (url || fallback || "").trim();
  if (!source) return "";
  return source.endsWith("/") ? source.slice(0, -1) : source;
}

class AdobeSignService {
  constructor() {
    this.clientId =
      process.env.ADOBE_CLIENT_ID || process.env.ADOBE_SIGN_CLIENT_ID || "";
    this.clientSecret = process.env.ADOBE_CLIENT_SECRET || "";
    this.refreshToken = process.env.ADOBE_REFRESH_TOKEN || "";
    this.scope =
      process.env.ADOBE_OAUTH_SCOPE ||
      "agreement_read agreement_write widget_read widget_write webhook_read webhook_write";

    this.oauthBaseUrl = normalizeBaseUrl(
      process.env.ADOBE_OAUTH_BASE_URL,
      "https://api.na4.adobesign.com",
    );

    const rawApiBaseUrl = normalizeBaseUrl(
      process.env.ADOBE_API_BASE_URL,
      "https://api.na4.adobesign.com/api/rest",
    );
    this.apiBaseUrl = rawApiBaseUrl.endsWith("/api/rest")
      ? rawApiBaseUrl
      : `${rawApiBaseUrl}/api/rest`;

    this.accessToken = null;
    this.tokenExpiresAt = 0;
  }

  ensureConfig() {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "Missing Adobe credentials in env (ADOBE_CLIENT_ID / ADOBE_CLIENT_SECRET)",
      );
    }
  }

  async parseResponse(response) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  }

  async requestJson(url, options = {}) {
    const response = await fetch(url, options);
    const payload = await this.parseResponse(response);
    if (!response.ok) {
      const details =
        typeof payload === "string" ? payload : JSON.stringify(payload);
      throw new Error(`Adobe API error ${response.status}: ${details}`);
    }
    return payload;
  }

  async getAccessToken() {
    this.ensureConfig();

    // 🔹 Reutilizar token si sigue vigente
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    if (!this.refreshToken) {
      throw new Error("No hay refresh_token configurado");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: this.refreshToken,
    });

    try {
      const data = await this.requestJson(
        `${this.oauthBaseUrl}/oauth/v2/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        },
      );

      this.accessToken = data.access_token;

      const expiresIn = Number(data.expires_in || 3600);
      this.tokenExpiresAt = Date.now() + expiresIn * 1000 - 60_000;

      return this.accessToken;
    } catch (error) {
      console.error(
        "Adobe OAuth error:",
        error.response?.data || error.message,
      );

      throw new Error("No se pudo obtener access_token de Adobe");
    }
  }

  async authHeaders(extra = {}) {
    const token = await this.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
      ...extra,
    };
  }

  async getPrefillUrl(agreementId) {
    const headers = await this.authHeaders({
      "Content-Type": "application/json",
    });

    const body = {
      name: "PREFILL", // 🔥 ESTE ES EL CORRECTO
    };

    return this.requestJson(
      `${this.apiBaseUrl}/v6/agreements/${agreementId}/views`,
      {
        method: "POST", // ✅ CORRECTO
        headers,
        body: JSON.stringify(body),
      },
    );
  }

  async activateAgreement(agreementId) {
    const headers = await this.authHeaders({
      "Content-Type": "application/json",
    });

    return this.requestJson(
      `${this.apiBaseUrl}/v6/agreements/${agreementId}/state`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          state: "IN_PROCESS",
        }),
      },
    );
  }

  async createAgreementFromTemplate(templateId, tipoContraparte, datos) {
    const headers = await this.authHeaders({
      "Content-Type": "application/json",
    });

    const safeName = (datos?.nombre || "sin_nombre").replace(/\s+/g, "_");

    const payload = {
      fileInfos: [{ libraryDocumentId: templateId }],
      name: `DD_${(tipoContraparte || "GEN").toUpperCase()}_${safeName}`,

      participantSetsInfo: [
        {
          memberInfos: [
            {
              email: datos.correo,
              name: datos.nombre,
            },
          ],
          order: 1,
          role: "SIGNER",
        },
      ],

      signatureType: "ESIGN",
      state: "DRAFT",
    };

    return this.requestJson(`${this.apiBaseUrl}/v6/agreements`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
  }

  async createSigningWidget(agreementId) {
    const headers = await this.authHeaders({
      "Content-Type": "application/json",
    });
    const redirectUrl =
      process.env.ADOBE_REDIRECT_URL ||
      "https://compliance.colautos.co/segment";

    try {
      return await this.requestJson(`${this.apiBaseUrl}/v6/widgets`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          agreementId,
          redirectUrl,
        }),
      });
    } catch (error) {
      const signingData = await this.getAgreementSigningUrls(agreementId);
      const url =
        signingData?.signingUrlSetInfos?.[0]?.signingUrls?.[0]?.esignUrl ||
        null;
      const widMatch = url ? url.match(/[?&]wid=([^&]+)/i) : null;
      return {
        id: widMatch?.[1] || null,
        url,
        fallback: true,
      };
    }
  }

  async getAgreementSigningUrls(agreementId) {
    const headers = await this.authHeaders();
    return this.requestJson(
      `${this.apiBaseUrl}/v6/agreements/${agreementId}/signingUrls`,
      {
        method: "GET",
        headers,
      },
    );
  }

  async getAgreementStatus(agreementId) {
    const headers = await this.authHeaders();
    return this.requestJson(`${this.apiBaseUrl}/v6/agreements/${agreementId}`, {
      method: "GET",
      headers,
    });
  }

  async downloadSignedDocument(agreementId) {
    console.log(agreementId)
    const headers = await this.authHeaders();
    const response = await fetch(
      `${this.apiBaseUrl}/v6/agreements/${agreementId}/combinedDocument`,
      {
        method: "GET",
        headers,
      },
    );
    console.log("📥 Descargando documento de:", agreementId);
    console.log("📦 Tamaño:", response.headers.get("content-length"));
    if (!response.ok) {
      const errPayload = await this.parseResponse(response);
      const details =
        typeof errPayload === "string"
          ? errPayload
          : JSON.stringify(errPayload);
      throw new Error(`Adobe download error ${response.status}: ${details}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  validateWebhookSignature(payload, signature, secret) {
    if (!secret) return true;
    if (!signature) return false;
    const normalized = String(signature)
      .replace(/^sha256=/i, "")
      .trim();
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload || "")
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(normalized),
    );
  }
}

module.exports = AdobeSignService;
