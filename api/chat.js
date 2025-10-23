import { guard } from "./_security/guard.js";

export default async function handler(req,res){
  const blocked = await guard(req,res); if(blocked) return;
  if(req.method!=="POST") return res.status(405).end();
  try{
    const { messages=[] } = req.body || {};
    const prompt = messages.map(m=>`${m.role}: ${m.content}`).join("\n");
    const r = await fetch("https://api-inference.huggingface.co/models/" + (process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct"), {
      method:"POST",
      headers:{ "Authorization":"Bearer " + process.env.HF_TOKEN, "Content-Type":"application/json" },
      body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 256, temperature: 0.6 }})
    });
    const j = await r.json();
    let text = "";
    if (Array.isArray(j) && j[0]?.generated_text) text = j[0].generated_text;
    else if (j?.generated_text) text = j.generated_text;
    else text = (j?.error || "No response");
    res.status(200).json({ reply: text.toString().slice(-1500) });
  }catch(e){
    console.error("chat_error", e);
    res.status(500).json({error:"chat_failed"});
  }
}
