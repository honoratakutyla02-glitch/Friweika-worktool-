import OpenAI from "openai";

export const config = { runtime: "edge" };

export default async function handler(req){
  try{
    if(req.method!=="POST"){
      return new Response(JSON.stringify({error:"POST only"}),{
        status:405,
        headers:{"Content-Type":"application/json"}
      });
    }

    const body = await req.json();
    const {q,source,target} = body;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `Translate from ${source} to ${target}. Return ONLY the translated text:\n"${q}"`;

    const ai = await client.chat.completions.create({
      model:"gpt-4o-mini",
      messages:[
        {role:"system",content:"Return ONLY translated text."},
        {role:"user",content:prompt}
      ]
    });

    return new Response(JSON.stringify({
      translation: ai.choices[0].message.content.trim()
    }),{
      status:200,
      headers:{"Content-Type":"application/json"}
    });

  }catch(err){
    return new Response(JSON.stringify({error:"server error",details:err.message}),{
      status:500,
      headers:{"Content-Type":"application/json"}
    });
  }
}
