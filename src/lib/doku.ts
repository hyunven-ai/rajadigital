import crypto from "crypto";

// ─── DOKU Configuration ────────────────────────────────────────────────────

const DOKU_MODE = process.env.DOKU_MODE ?? "sandbox";

const DOKU_BASE_URL =
  DOKU_MODE === "production"
    ? "https://api.doku.com"
    : "https://api-sandbox.doku.com";

const DOKU_CLIENT_ID = process.env.DOKU_CLIENT_ID ?? "";
const DOKU_SECRET_KEY = process.env.DOKU_SECRET_KEY ?? "";
const DOKU_MERCHANT_ID = process.env.DOKU_MERCHANT_ID ?? "";

// RSA Private Key — digunakan untuk asymmetric signature (Get Access Token)
// Env disimpan dengan literal \n, kita perlu replace jadi newline sesungguhnya
function getPrivateKey(): string {
  const raw = process.env.DOKU_PRIVATE_KEY ?? "";
  return raw.replace(/\\n/g, "\n");
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Check apakah DOKU sudah dikonfigurasi */
export function isDokuConfigured(): boolean {
  return !!(
    DOKU_CLIENT_ID &&
    DOKU_CLIENT_ID !== "your-doku-client-id" &&
    DOKU_SECRET_KEY &&
    DOKU_SECRET_KEY !== "your-doku-secret-key" &&
    DOKU_MERCHANT_ID &&
    DOKU_MERCHANT_ID !== "your-doku-merchant-id" &&
    process.env.DOKU_PRIVATE_KEY &&
    process.env.DOKU_PRIVATE_KEY !== '-----BEGIN RSA PRIVATE KEY-----\\nMIIEpAIBAAKCAQEA...\\n-----END RSA PRIVATE KEY-----'
  );
}

/** Generate ISO-8601 timestamp (UTC+07:00) */
function getTimestamp(): string {
  return new Date().toISOString().replace("Z", "+07:00");
}

/** Generate unique external ID (max 36 chars) */
function generateExternalId(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomBytes(8).toString("hex");
  return `RD${dateStr}${rand}`.slice(0, 36);
}

/** Minify JSON body (remove whitespace) */
function minifyBody(body: object): string {
  return JSON.stringify(body);
}

/** Generate SHA-256 hex digest of a string (lowercase) */
function sha256Hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex").toLowerCase();
}

// ─── Asymmetric Signature (RSA SHA256) — untuk Get Access Token ────────────

/**
 * Untuk endpoint /authorization/v1/access-token/b2b
 * stringToSign = clientId + "|" + timestamp
 * Signature = RSA-SHA256(stringToSign, privateKey) → base64
 */
function generateAsymmetricSignature(timestamp: string): string {
  const stringToSign = `${DOKU_CLIENT_ID}|${timestamp}`;
  const privateKey = getPrivateKey();

  const signer = crypto.createSign("SHA256");
  signer.update(stringToSign);
  signer.end();

  return signer.sign(privateKey, "base64");
}

// ─── Symmetric Signature (HMAC-SHA512) — untuk transaksi ──────────────────

/**
 * Untuk endpoint transaksional (generate QRIS, dll)
 * stringToSign = HTTPMethod + ":" + EndpointUrl + ":" + AccessToken + ":" + Digest + ":" + Timestamp
 * Digest = lowercase(hex(SHA256(minify(requestBody))))
 * Signature = HMAC-SHA512(stringToSign, secretKey) → base64
 */
function generateSymmetricSignature(
  httpMethod: string,
  endpointPath: string,
  accessToken: string,
  body: object,
  timestamp: string
): string {
  const minified = minifyBody(body);
  const digest = sha256Hex(minified);
  const stringToSign = `${httpMethod}:${endpointPath}:${accessToken}:${digest}:${timestamp}`;

  return crypto
    .createHmac("sha512", DOKU_SECRET_KEY)
    .update(stringToSign)
    .digest("base64");
}

// ─── Access Token Cache ────────────────────────────────────────────────────

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get B2B Access Token dari DOKU.
 * Token di-cache sampai mendekati expired.
 */
export async function getAccessToken(): Promise<string> {
  // Gunakan cache jika masih valid (buffer 60 detik)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }

  const timestamp = getTimestamp();
  const signature = generateAsymmetricSignature(timestamp);

  const url = `${DOKU_BASE_URL}/authorization/v1/access-token/b2b`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CLIENT-KEY": DOKU_CLIENT_ID,
      "X-TIMESTAMP": timestamp,
      "X-SIGNATURE": signature,
    },
    body: JSON.stringify({ grantType: "client_credentials" }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DOKU] Failed to get access token:", response.status, errorText);
    throw new Error(`DOKU Auth failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();
  const accessToken = data.accessToken;
  // Token biasanya valid 900 detik (15 menit)
  const expiresIn = data.expiresIn ?? 900;

  cachedToken = {
    token: accessToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  return accessToken;
}

// ─── Generate Dynamic QRIS ─────────────────────────────────────────────────

export interface GenerateQrisParams {
  invoiceId: string;
  amount: number;
  customerName?: string;
  /** Expiry dalam menit. Default: 30 */
  expiryMinutes?: number;
}

export interface GenerateQrisResult {
  qrContent: string;
  qrUrl: string;
  partnerReferenceNo: string;
  externalId: string;
}

/**
 * Generate Dynamic QRIS via DOKU SNAP Adapter API.
 * QR code sudah mengandung nominal — customer tinggal scan & bayar.
 */
export async function generateQris(
  params: GenerateQrisParams
): Promise<GenerateQrisResult> {
  const { invoiceId, amount, customerName, expiryMinutes = 30 } = params;

  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const externalId = generateExternalId();
  const endpointPath = "/snap-adapter/b2b/v1.0/qr/qr-mpm-generate";

  // Hitung waktu expiry
  const expiryDate = new Date(Date.now() + expiryMinutes * 60_000);
  const validityPeriod = expiryDate.toISOString();

  // Format amount: harus string dengan 2 desimal, misal "50000.00"
  const amountStr = amount.toFixed(2);

  const requestBody = {
    partnerReferenceNo: invoiceId,
    amount: {
      value: amountStr,
      currency: "IDR",
    },
    merchantId: DOKU_MERCHANT_ID,
    validityPeriod,
    additionalInfo: {
      ...(customerName ? { customerName } : {}),
    },
  };

  const signature = generateSymmetricSignature(
    "POST",
    endpointPath,
    accessToken,
    requestBody,
    timestamp
  );

  const url = `${DOKU_BASE_URL}${endpointPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-PARTNER-ID": DOKU_CLIENT_ID,
      "X-EXTERNAL-ID": externalId,
      "X-TIMESTAMP": timestamp,
      "X-SIGNATURE": signature,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[DOKU] Failed to generate QRIS:", response.status, errorText);
    throw new Error(`DOKU Generate QRIS failed: ${response.status} — ${errorText}`);
  }

  const data = await response.json();

  return {
    qrContent: data.qrContent ?? "",
    qrUrl: data.qrUrl ?? "",
    partnerReferenceNo: data.partnerReferenceNo ?? invoiceId,
    externalId,
  };
}

// ─── Verify Webhook Notification Signature ──────────────────────────────────

/**
 * Verifikasi bahwa notification benar datang dari DOKU.
 * DOKU mengirim signature di header menggunakan HMAC-SHA512.
 *
 * stringToSign format:
 *   ClientId + ":" + RequestId + ":" + RequestTimestamp + ":" + RequestBody
 *
 * Catatan: Format persis bisa berbeda tergantung versi DOKU.
 * Selalu cek dokumentasi terbaru DOKU untuk format yang benar.
 */
export function verifyNotificationSignature(
  clientId: string,
  requestId: string,
  requestTimestamp: string,
  requestBody: string,
  receivedSignature: string
): boolean {
  try {
    // Compute digest of the body
    const bodyDigest = sha256Hex(requestBody);

    // Build string to sign
    // Format: POST:/notification-path:clientId:digest:timestamp
    const stringToSign = `${clientId}:${requestId}:${requestTimestamp}:${bodyDigest}`;

    const expectedSignature = crypto
      .createHmac("sha512", DOKU_SECRET_KEY)
      .update(stringToSign)
      .digest("base64");

    // Constant-time comparison to prevent timing attacks
    const sigBuffer1 = Buffer.from(receivedSignature, "base64");
    const sigBuffer2 = Buffer.from(expectedSignature, "base64");

    if (sigBuffer1.length !== sigBuffer2.length) return false;

    return crypto.timingSafeEqual(sigBuffer1, sigBuffer2);
  } catch (err) {
    console.error("[DOKU] Signature verification error:", err);
    return false;
  }
}

// ─── Check Payment Status ──────────────────────────────────────────────────

/**
 * Cek status pembayaran QRIS ke DOKU.
 * Endpoint: POST /snap/v1.1/qr/qr-mpm-status
 */
export async function checkQrisStatus(
  partnerReferenceNo: string,
  externalId: string
): Promise<{ paid: boolean; responseCode: string; responseMessage: string }> {
  const accessToken = await getAccessToken();
  const timestamp = getTimestamp();
  const endpointPath = "/snap/v1.1/qr/qr-mpm-status";

  const requestBody = {
    originalPartnerReferenceNo: partnerReferenceNo,
    originalExternalId: externalId,
    serviceCode: "47",
  };

  const signature = generateSymmetricSignature(
    "POST",
    endpointPath,
    accessToken,
    requestBody,
    timestamp
  );

  const url = `${DOKU_BASE_URL}${endpointPath}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-PARTNER-ID": DOKU_CLIENT_ID,
      "X-EXTERNAL-ID": generateExternalId(),
      "X-TIMESTAMP": timestamp,
      "X-SIGNATURE": signature,
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();

  // Response code 2005400 = Success / paid
  const paid = data.responseCode === "2005400" || data.latestTransactionStatus === "00";

  return {
    paid,
    responseCode: data.responseCode ?? "",
    responseMessage: data.responseMessage ?? "",
  };
}
