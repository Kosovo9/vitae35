import Stripe from 'stripe';
export const config = { api: { bodyParser: false } };

function buffer(req){ return new Promise((resolve,reject)=>{
  const chunks=[]; req.on('data',c=>chunks.push(c)); req.on('end',()=>resolve(Buffer.concat(chunks))); req.on('error',reject);
});}

export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).end();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];
  const buf = await buffer(req);
  let event;
  try{
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }catch(err){
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if(event.type === 'checkout.session.completed'){
    const session = event.data.object;
    console.log('Checkout completed:', session.id, session.customer_details?.email);
  }
  res.json({ received: true });
}