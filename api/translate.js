// api/translate.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    let body = {};

    // Ręczne parsowanie JSON (wymagane w Vercel serverless)
    if (req.method === "POST") {
      const raw = await new Promise(resolve => {
        let data = "";
        req.on("data", chunk => data += chunk);
        req.on("end", () => resolve(data));
      });

      try {
        body = JSON.parse(raw || "{}");
      } catch (err) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    // GET testowy
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "Translate API works (GET OK)"
      });
    }

    // POST – tłumaczenie
    if (req.method === "POST") {
      const q = body.q;
      const source = body.source;
      const target = body.target;

      if (!q || !source || !target) {
        return res.status(400).json({
          error: "Missing parameters q/source/target"
        });
      }

      // Bardzo ważne — wymuszamy czyste tłumaczenie BEZ komentarzy
      const prompt = `
You are a translation engine. 
Translate the following text from ${source} to ${target}.
Return ONLY the translated text. 
Do NOT add anything else (no notes, no explanations, no comments, no metadata).

Text:
"${q}"
`;

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You translate text only. No explanations. Output must be translation only." },
          { role: "user", content: prompt }
        ],
        temperature: 0.0
      });

      let translation = response.choices[0].message.content || "";

      // Na wszelki wypadek — usuwamy nowe linie i nadwyżki spacji
      translation = translation.trim();

      return res.status(200).json({
        ok: true,
        translation
      });
    }

    // Błędna metoda
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return res.status(500).json({
      error: "Server error",
      details: err.message
    });
  }
}
