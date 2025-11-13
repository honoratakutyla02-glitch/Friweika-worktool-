// api/translate.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {
    const { q, source, target } = req.body;

    if (!q || !source || !target) {
      return res.status(400).json({ error: 'Missing parameters' });
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

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Translation failed', details: err.message });
  }
}
