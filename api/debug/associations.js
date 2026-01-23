export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = process.env.HUBSPOT_DEBUG_ACCESS_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Missing HUBSPOT_DEBUG_ACCESS_TOKEN" });
    return;
  }

  const ticketId = req.query?.ticketId;
  if (!ticketId) {
    res.status(400).json({ error: "Missing ticketId" });
    return;
  }

  try {
    const response = await fetch(
      `https://api.hubapi.com/crm/v4/objects/tickets/${encodeURIComponent(
        String(ticketId)
      )}/associations/contacts`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );
    const json = await response.json();
    res.status(response.status).json(json);
  } catch (err) {
    res.status(500).json({ error: "Debug request failed" });
  }
}
