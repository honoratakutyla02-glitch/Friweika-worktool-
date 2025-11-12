// api/translate.js
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'API translate: GET ok' });
  }
  if (req.method === 'POST') {
    const body = req.body || {};
    return res.status(200).json({ ok: true, method: 'POST', body });
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' });
}
