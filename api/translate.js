// api/translate.js
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    // CORS (jeśli testy z innej domeny) — możesz zostawić
    // res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    // res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    let body = {};
    if (req.method === "POST") {
      const raw = await new Promise((resolve) => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
      });

      try {
        body = JSON.parse(raw || "{}");
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON" });
      }
    }

    if (req.method === "GET") {
      return res.status(200).json({ ok: true, message: "Translate API works (GET)" });
    }

    if (req.method === "POST") {
      // przyjmujemy oba formaty nazw pól
      const q = body.q || body.text;
      const source = body.source || body.sourceLang;
      const target = body.target || body.targetLang;

      if (!q || !source || !target) {
        return res.status(400).json({ error: "Missing q/source/target" });
      }

      const prompt = `Translate this text from ${source} to ${target}: """${q}"""`;

      // Wywołanie OpenAI
      const result = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful and precise translation assistant." },
          { role: "user", content: prompt }
        ],
        max_tokens: 2000
      });

      const translation = (result?.choices?.[0]?.message?.content || "").trim();

      return res.status(200).json({ ok: true, translation });
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}

