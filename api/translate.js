// api/translate.js
// Uniwersalny testowy handler dla Vercel (ESM export default)
// - Odpowiada na GET (test w przeglądarce)
// - Odpowiada na POST (echo request.body) - tu potem wstawisz właściwą logikę

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // prosty test — otwórz w przeglądarce https://<twoja-domena>/api/translate
      return res.status(200).json({ ok: true, message: 'API translate: GET ok' });
    }

    if (req.method === 'POST') {
      // echo (na potrzeby testu) - wyświetli to, co wyślesz z fetch()
      const body = req.body || {};
      return res.status(200).json({ ok: true, method: 'POST', body });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
  } catch (err) {
    console.error('translate handler error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
