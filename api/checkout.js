import { guard } from "./_security/guard.js";
import Stripe from "stripe";

export default async function handler(req,res){
  const blocked = await guard(req,res); if(blocked) return;
  if(req.method!=="POST") return res.status(405).end();

  try{
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.origin || `https://${req.headers.host}`;
    const { plan, email } = req.body || {};

    const PLANS = {
      starter: { mode:"payment",      amount: 49900,  currency:"mxn", name:"Vitae35 Starter" },
      pro:     { mode:"subscription", amount:129900,  currency:"mxn", name:"Vitae35 Pro",    interval:"month" },
      elite:   { mode:"subscription", amount:399900,  currency:"mxn", name:"Vitae35 Elite",  interval:"month" }
    };
    const key=(plan||"starter").toLowerCase();
    const P=PLANS[key]; if(!P) return res.status(400).json({error:"invalid_plan"});

    const pmTypes = P.mode==="payment" ? ["card","oxxo"] : ["card"];

    const lineItem = {
      price_data:{
        currency:P.currency,
        unit_amount:P.amount,
        product_data:{ name:P.name },
        ...(P.mode==="subscription" ? { recurring:{ interval:P.interval } } : {})
      },
      quantity:1
    };

    const session = await stripe.checkout.sessions.create({
      mode: P.mode,
      payment_method_types: pmTypes,
      customer_email: email || undefined,
      line_items: [lineItem],
      success_url: `${origin}/?success=1&plan=${key}`,
      cancel_url: `${origin}/?canceled=1&plan=${key}`,
      ...(pmTypes.includes("oxxo") ? { payment_method_options:{ oxxo:{ expires_after_days:2 } } } : {})
    });

    res.status(200).json({ url: session.url });
  }catch(e){
    console.error("checkout_error", e);
    res.status(500).json({error:"checkout_failed"});
  }
}
