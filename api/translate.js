// api/translate.js
import OpenAI from "openai";

export const config = {
  runtime: "edge"   // działa szybciej i stabilniej na Vercelu
};

export default async function handler(req) {
  try {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ ok: true, message: "Translate API working (GET)" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- Parsowanie JSON w środowisku EDGE ---
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const q = body.q;
    const source = body.source;
    const target = body.target;

    if (!q || !source || !target) {
      return new Response(
        JSON.stringify({ error: "Missing q/source/target" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- OpenAI Client (EDGE SAFE) ---
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Translate the following text from ${source} to ${target}. 
Return ONLY the translated text, no quotes, no commentary:

"${q}"`;

    const ai = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You return ONLY the translated text." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });

    const translation = ai.choices?.[0]?.message?.content?.trim() || "";

    return new Response(
      JSON.stringify({ ok: true, translation }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return new Response(
      JSON.stringify({ error: "Server error", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
