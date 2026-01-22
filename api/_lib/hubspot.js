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

export function getRequestUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  return `${proto}://${host}${req.url}`;
}

export function validateHubSpotSignature({
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

  const ts = Number(timestamp);
  if (!ts || Math.abs(Date.now() - ts) > 5 * 60 * 1000) {
    return { ok: false, reason: "invalid_timestamp" };
  }

  const signatureBase = `${method}${url}${rawBody || ""}`;
  const expected = crypto
    .createHmac("sha256", clientSecret)
    .update(signatureBase)
    .digest("hex");

  if (!timingSafeEqual(expected, signature)) {
    return { ok: false, reason: "signature_mismatch" };
  }

  return { ok: true };
}
