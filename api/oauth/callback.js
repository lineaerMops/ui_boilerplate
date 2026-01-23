export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const code = req.query?.code;
  if (!code) {
    res.status(400).json({ error: "Missing code" });
    return;
  }

  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).json({ error: "Missing env vars" });
    return;
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code: String(code)
  });

  try {
    const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body
    });

    const json = await response.json();
    if (!response.ok) {
      res.status(response.status).json({ error: json.message || "OAuth error" });
      return;
    }

    const redirectMode = String(req.query?.redirect || "").toLowerCase();
    if (redirectMode === "json") {
      res.status(200).json({
        success: true,
        message: "OAuth success",
        hub_id: json.hub_id
      });
      return;
    }

    const successUrl = `https://embed.lineaer.dk/ui_demo/connected?hub_id=${encodeURIComponent(
      json.hub_id
    )}`;
    res.redirect(302, successUrl);
  } catch (err) {
    res.status(500).json({ error: "OAuth request failed" });
  }
}
