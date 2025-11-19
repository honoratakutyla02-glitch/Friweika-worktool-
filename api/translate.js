// api/translate.js
export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "Translate API works (GET)",
    });
  }

  if (req.method === "POST") {
    let body = req.body;

    if (!body) {
      return res.status(400).json({ error: "Missing body" });
    }

    return res.status(200).json({
      ok: true,
      translation: "TEST TRANSLATION (backend working)",
    });
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}
