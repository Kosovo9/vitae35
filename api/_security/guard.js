import crypto from "crypto";

const conf = {
  allowedOrigins: (process.env.ALLOWED_ORIGINS || "https://vitae35.vercel.app,*.vercel.app,https://localhost,https://127.0.0.1").split(",").map(s=>s.trim()).filter(Boolean),
  hmacSecret: process.env.SECRET_SIGNING || ("s-"+crypto.randomBytes(16).toString("hex")),
  ratePerMin: Number(process.env.RATE_LIMIT_PER_MIN || 60),
  burst: Number(process.env.RATE_LIMIT_BURST || 90),
};

const badUA = ["curl","wget","python-requests","httpx","scrapy","aiohttp","libwww-perl","java/","okhttp","Go-http-client","node-fetch","axios","headless"," puppeteer","selenium","phantomjs"];

function matchOrigin(origin, list){ try{ if(!origin) return false; const h=new URL(origin).host.toLowerCase(); return list.some(p=>{ const s=p.toLowerCase().replace(/^https?:\/\//,""); if(s===h) return true; if(s.startsWith("*.")){ const root=s.slice(2); return h===root||h.endsWith("."+root);} return false;}); }catch{ return false; } }

export function signToken(payload, ttlSec=300){
  const data={...payload, iat:Math.floor(Date.now()/1000), exp:Math.floor(Date.now()/1000)+ttlSec};
  const b64=Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig=crypto.createHmac("sha256", conf.hmacSecret).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}
export function verifyToken(token, extra=()=>true){
  if(!token||!token.includes(".")) return false;
  const [b64,sig]=token.split(".");
  const expSig=crypto.createHmac("sha256", conf.hmacSecret).update(b64).digest("base64url");
  if(sig!==expSig) return false;
  const data=JSON.parse(Buffer.from(b64,"base64url").toString());
  if(!data.exp || data.exp < Math.floor(Date.now()/1000)) return false;
  return extra(data);
}

const buckets=new Map();
function keyOf(req){
  const ip=(req.headers["x-forwarded-for"]||req.socket?.remoteAddress||"").toString().split(",")[0].trim();
  const ua=(req.headers["user-agent"]||"").toLowerCase();
  return crypto.createHash("sha1").update(ip+"|"+ua).digest("base64");
}
function pass(req){
  const now=Date.now(), k=keyOf(req);
  const b=buckets.get(k)||{tokens:conf.burst, ts:now};
  const elapsed=(now-b.ts)/60000; b.tokens=Math.min(conf.burst, b.tokens+elapsed*conf.ratePerMin);
  if(b.tokens<1){ buckets.set(k,b); return false; }
  b.tokens-=1; b.ts=now; buckets.set(k,b); return true;
}

export async function guard(req,res){
  const origin=req.headers.origin||"", referer=req.headers.referer||"", host=(req.headers.host||"").toLowerCase();
  const ua=(req.headers["user-agent"]||"").toLowerCase();

  if(badUA.some(s=>ua.includes(s))) return res.status(403).json({error:"blocked_user_agent"});

  const allow = matchOrigin(origin,conf.allowedOrigins) || matchOrigin(referer,conf.allowedOrigins) || conf.allowedOrigins.some(h=>{
    const s=h.toLowerCase().replace(/^https?:\/\//,"");
    return s===host || (s.startsWith("*.") && (host===s.slice(2) || host.endsWith("."+s.slice(2))));
  });
  if(!allow) return res.status(403).json({error:"origin_not_allowed"});

  res.setHeader("Vary","Origin");
  if(origin&&allow){
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials","true");
    res.setHeader("Access-Control-Allow-Headers","Content-Type, X-Access-Token");
    res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  }
  if(req.method==="OPTIONS") return res.status(204).end();

  if(!pass(req)) return res.status(429).json({error:"rate_limited"});

  const token=req.headers["x-access-token"];
  const ok=verifyToken(String(token||""), (data)=>{
    const sig = crypto.createHash("sha1").update(ua).digest("hex");
    return data.ua===sig;
  });
  if(!ok) return res.status(403).json({error:"bad_token"});

  res.setHeader("Cache-Control","no-store");
  return null;
}
