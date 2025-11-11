// api/translate.js
// Robust handler dla Vercel: obsługa CORS, OPTIONS, POST (body JSON), oraz GET (test).
export default async function handler(req, res) {
  // CORS - do testów: zezwalamy na origin z req lub na wszystkie.
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  try {
    if (req.method === 'GET') {
      return res.status(200).json({ ok: true, message: 'API translate: GET ok' });
    }

    if (req.method === 'POST') {
      // W Vercel req.body bywa sparsowany automatycznie. Jeśli nie - zczytamy raw body.
      let body = req.body;
      if (!body || Object.keys(body).length === 0) {
        // spróbuj odczytać raw
        body = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => {
            try { resolve(JSON.parse(data || '{}')); } catch(e) { resolve({ raw: data }); }
          });
          req.on('error', reject);
        });
      }

      // Echo (test) - zamień to na właściwe wywołanie API tłumaczeń.
      return res.status(200).json({ ok: true, received: body });
    }

    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  } catch (err) {
    console.error('translate handler error', err);
    return res.status(500).json({ error: 'Internal server error', message: String(err) });
  }
}
