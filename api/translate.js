// api/translate.js
// (Vercel Serverless Function - Node.js, używa fetch dostępnego w środowisku)
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Only POST allowed' });
    return;
  }
  try {
    const body = await request.json();
    const q = body.q || '';
    const source = body.source || 'auto';
    const target = body.target || 'en';

    // publiczna instancja LibreTranslate (możesz zmienić na inną instancję)
    const TRANSLATE_URL = 'https://libretranslate.de/translate';

    const resp = await fetch(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, source, target, format: 'text' })
    });

    if (!resp.ok) {
      const t = await resp.text();
      response.status(502).json({ error: 'Bad gateway', details: t });
      return;
    }

    const json = await resp.json();
    // zwracamy bezpośrednio JSON z LibreTranslate
    response.setHeader('Content-Type', 'application/json');
    response.status(200).send(JSON.stringify(json));
  } catch (err) {
    response.status(500).json({ error: err.message });
  }
}
