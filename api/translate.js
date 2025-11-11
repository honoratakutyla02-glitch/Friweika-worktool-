// api/translate.js (CommonJS - prostsza wersja dla Vercel)
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Only POST allowed' }));
    return;
  }
  try {
    // Odczyt ciała request (działa w tym środowisku)
    const body = await new Promise((resolve) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(JSON.parse(data || '{}')));
    });

    const q = body.q || '';
    const source = body.source || 'auto';
    const target = body.target || 'en';

    const TRANSLATE_URL = 'https://libretranslate.de/translate';

    // fetch powinien być dostępny w runtime Vercel; jeśli nie, powiemy jak dodać node-fetch
    const resp = await fetch(TRANSLATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q, source, target, format: 'text' })
    });

    if (!resp.ok) {
      const text = await resp.text();
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Bad gateway', details: text }));
      return;
    }

    const json = await resp.json();
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify(json));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
};
