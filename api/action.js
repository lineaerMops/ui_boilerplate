import { getRequestUrl, readRawBody, validateHubSpotSignature } from "./_lib/hubspot.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const signature = req.headers["x-hubspot-signature-v3"] || "";
  const timestamp = req.headers["x-hubspot-request-timestamp"] || "";
  const url = getRequestUrl(req);
  const rawBody = await readRawBody(req);

  const validation = validateHubSpotSignature({
    method: req.method,
    url,
    rawBody,
    signature,
    timestamp,
    clientSecret
  });

  if (!validation.ok) {
    res.status(401).json({ error: "Invalid signature", reason: validation.reason });
    return;
  }

  let payload = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const n8nUrl = process.env.N8N_WEBHOOK_URL;
  if (n8nUrl) {
    try {
      const n8nResponse = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const n8nJson = await n8nResponse.json().catch(() => ({}));
      if (!n8nResponse.ok) {
        res.status(502).json({ error: "n8n error", detail: n8nJson });
        return;
      }
    } catch (err) {
      res.status(502).json({ error: "n8n request failed" });
      return;
    }
  }

  res.status(200).json({
    success: true,
    message: "Action received",
    payload
  });
}
