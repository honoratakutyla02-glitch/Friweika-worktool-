// api/translate.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    // --- PARSOWANIE JSON RĘCZNIE ---
    let body = {};
    if (req.method === "POST") {
      const raw = await new Promise((resolve) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
      });

      try {
        body = JSON.parse(raw || "{}");
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    // --- OBSŁUGA GET ---
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, message: "Translate API works (GET)" });
    }

    // --- OBSŁUGA POST ---
    if (req.method === "POST") {
      const { q, source, target } = body;

      if (!q || !source || !target) {
        return res.status(400).json({ error: "Missing parameters q/source/target" });
      }

      const prompt = `Translate this text from ${source} to ${target}: "${q}"`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a translation assistant." },
          { role: "user", content: prompt }
        ]
      });

      const translation = response.choices[0].message.content.trim();

      return res.status(200).json({
        ok: true,
        translation
      });
    }

    // jeśli inna metoda
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
