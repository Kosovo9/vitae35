export default async function handler(req,res){
  const pub = {
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "",
    CLERK_SIGNIN_URL: process.env.CLERK_SIGNIN_URL || "",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    SUPABASE_ANON: process.env.SUPABASE_ANON || "",
    STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY || "",
    HF_MODEL: process.env.HF_MODEL || "meta-llama/Llama-3.1-8B-Instruct"
  };
  res.setHeader("Content-Type","application/javascript");
  res.setHeader("Cache-Control","no-store");
  res.status(200).send(`window.CLERK_PUBLISHABLE_KEY=${JSON.stringify(pub.CLERK_PUBLISHABLE_KEY)};
window.CLERK_SIGNIN_URL=${JSON.stringify(pub.CLERK_SIGNIN_URL)};
window.SUPABASE_URL=${JSON.stringify(pub.SUPABASE_URL)};
window.SUPABASE_ANON=${JSON.stringify(pub.SUPABASE_ANON)};
window.STRIPE_PUBLIC_KEY=${JSON.stringify(pub.STRIPE_PUBLIC_KEY)};
window.HF_MODEL=${JSON.stringify(pub.HF_MODEL)};`);
}
