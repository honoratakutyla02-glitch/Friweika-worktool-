// api/translate.js
export default async function handler(req, res) {
  // Akceptujemy tylko POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Dozwolone tylko POST" });
  }

  // Zabezpieczenie: body musi mieć q, source, target
  const { q, source, target } = req.body || {};
  if (!q || !source || !target) {
    return res.status(400).json({ error: "Brak parametrów q/source/target" });
  }

  try {
    // Używamy publicznego endpointu LibreTranslate
    const libreUrl = "https://libretranslate.de/translate";

    const r = await fetch(libreUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        q: q,
        source: source,
        target: target,
        format: "text"
      }),
      // timeout? Vercel fetch domyślnie ma limit; nie dodajemy tu dodatkowego timeoutu
    });

    // Jeżeli API zwraca status inny niż 200, odczytujemy treść i zwracamy szczegóły
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      // Zwracamy kod i część odpowiedzi z zewnętrznego serwisu
      console.error("LibreTranslate non-200:", r.status, text);
      return res.status(502).json({
        error: "External translation service error",
        status: r.status,
        detail: text
      });
    }

    const data = await r.json().catch(() => null);
    if (!data) {
      return res.status(502).json({ error: "Empty or invalid JSON from LibreTranslate" });
    }

    // Zwracamy wynik dalej do frontu
    return res.status(200).json(data);

  } catch (err) {
    console.error("Translate handler error:", err && err.message ? err.message : err);
    return res.status(500).json({ error: "Server error in translate handler", details: String(err) });
  }
}
