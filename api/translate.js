// api/translate.js
// Fallback proxy for translation: tries several public translate endpoints in order.
// Exports a default handler for Vercel (ESM).

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Dozwolone tylko POST" });
  }

  const { q, source, target } = req.body || {};
  if (!q || !source || !target) {
    return res.status(400).json({ error: "Brak parametrów q/source/target" });
  }

  // Lista fallbacków — kolejność: preferowany pierwszy
  const endpoints = [
    { name: "libretranslate.de", url: "https://libretranslate.de/translate" },
    { name: "argos", url: "https://translate.argosopentech.com/translate" },
    { name: "astian", url: "https://translate.astian.org/translate" }
  ];

  // Helper: fetch with timeout using AbortController
  async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }

  // Body we send to remote
  const bodyPayload = { q, source, target, format: "text" };

  // Try endpoints sequentially
  const errors = [];
  for (const ep of endpoints) {
    try {
      console.log(`Trying translate endpoint: ${ep.name} -> ${ep.url}`);
      const r = await fetchWithTimeout(ep.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(bodyPayload)
      }, 6000); // 6s timeout per endpoint

      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        const msg = `Endpoint ${ep.name} returned status ${r.status}: ${txt}`;
        console.warn(msg);
        errors.push({ endpoint: ep.name, status: r.status, detail: txt });
        // try next endpoint
