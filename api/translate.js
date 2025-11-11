// api/translate.js
export default function handler(req, res) {
  // proste sprawdzenie: zwróć prosty tekst dla GET i POST
  if (req.method === 'GET') return res.status(200).json({ ok: true, msg: 'translate GET ok' });
  if (req.method === 'POST') return res.status(200).json({ ok: true, msg: 'translate POST ok', body: req.body || null });
  res.setHeader('Allow', 'GET,POST');
  res.status(405).json({ error: 'Method not allowed' });
}
