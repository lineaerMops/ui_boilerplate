import crypto from "crypto";

export function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function timingSafeEqual(a, b) {
  const aBuf = Buffer.from(a || "", "utf8");
  const bBuf = Buffer.from(b || "", "utf8");
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function matchesSignature(expectedHex, expectedBase64, expectedBase64Url, signature) {
  return (
    timingSafeEqual(expectedHex, signature) ||
    timingSafeEqual(expectedBase64, signature) ||
    timingSafeEqual(expectedBase64Url, signature)
  );
}

export function getRequestUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const originalUrl =
    req.headers["x-vercel-original-url"] ||
    req.headers["x-original-url"] ||
    req.headers["x-rewrite-url"] ||
    req.headers["x-forwarded-uri"] ||
    req.url;

  if (typeof originalUrl === "string" && originalUrl.startsWith("http")) {
    return originalUrl;
  }

  return `${proto}://${host}${originalUrl}`;
}

export function validateHubSpotSignatureV3({
  method,
  url,
  rawBody,
  signature,
  timestamp,
  clientSecret
}) {
  if (!clientSecret) {
    return { ok: false, reason: "missing_client_secret" };
  }
  if (!signature || !timestamp) {
    return { ok: false, reason: "missing_signature" };
  }

  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const signatureBase = `${String(method).toUpperCase()}${url}${rawBody || ""}${ts}`;
  const expectedHex = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureBase)
    .digest("hex");
  const expectedBase64 = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureBase)
    .digest("base64");
  const expectedBase64Url = expectedBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  if (process.env.DEBUG_SIGNATURE === "true") {
    console.log(
      JSON.stringify({
        signatureDebugExpected: true,
        expectedBase64Prefix: expectedBase64.slice(0, 12),
        expectedBase64UrlPrefix: expectedBase64Url.slice(0, 12)
      })
    );
  }

  if (!matchesSignature(expectedHex, expectedBase64, expectedBase64Url, signature)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}

export function validateHubSpotSignatureV2({
  method,
  url,
  rawBody,
  signature,
  clientSecret
}) {
  if (!clientSecret) {
    return { ok: false, reason: "missing_client_secret" };
  }
  if (!signature) {
    return { ok: false, reason: "missing_signature" };
  }

  const signatureBase = `${String(method).toUpperCase()}${url}${rawBody || ""}`;
  const expectedHex = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureBase)
    .digest("hex");
  const expectedBase64 = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureBase)
    .digest("base64");
  const expectedBase64Url = expectedBase64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

  if (process.env.DEBUG_SIGNATURE === "true") {
    console.log(
      JSON.stringify({
        signatureDebugExpectedV2: true,
        expectedBase64Prefix: expectedBase64.slice(0, 12),
        expectedBase64UrlPrefix: expectedBase64Url.slice(0, 12)
      })
    );
  }

  if (!matchesSignature(expectedHex, expectedBase64, expectedBase64Url, signature)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}
