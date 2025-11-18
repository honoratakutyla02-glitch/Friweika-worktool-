// api/translate.js
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res){
  try{
    if(req.method === 'GET') return res.status(200).json({ ok:true, message:'Translate API works (GET)' });

    if(req.method !== 'POST'){
      res.setHeader('Allow',['GET','POST']);
      return res.status(405).json({ error:'Method not allowed' });
    }

    // parse body safely
    let body = req.body;
    if(!body){
      const raw = await new Promise(r=>{let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d));});
      try{ body = JSON.parse(raw||'{}'); }catch(e){ return res.status(400).json({ error:'Invalid JSON' }); }
    }

    // support both q or text keys
    const q = body.q || body.text;
    const source = body.source || body.sourceLang;
    const target = body.target || body.targetLang;

    if(!q || !source || !target) return res.status(400).json({ error:'Missing q/source/target' });

    // Compose prompt for clean output (no extra quotes)
    const prompt = `Translate the following text from ${source} to ${target}. Respond ONLY with the translation and no extra commentary:\n\n${q}`;

    // Use chat completions to get natural translation
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise translation assistant. Return only the translation text, do not add quotes or commentary.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000
    });

    const translation = completion.choices?.[0]?.message?.content || '';

    return res.status(200).json({ ok:true, translation });

  }catch(err){
    console.error('API ERROR:', err);
    // forward meaningful message but avoid leaking internal stack
    const msg = err?.message || String(err);
    return res.status(500).json({ error:'Server error', details: msg });
  }
}
