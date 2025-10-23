import { signToken } from "./_security/guard.js";
import crypto from "crypto";
export default async function handler(req,res){
  if(req.method!=="GET") return res.status(405).end();
  const ua=(req.headers["user-agent"]||"").toLowerCase();
  const hash=crypto.createHash("sha1").update(ua).digest("hex");
  const token=signToken({ua:hash}, 300);
  res.setHeader("Cache-Control","no-store");
  res.status(200).json({token});
}
