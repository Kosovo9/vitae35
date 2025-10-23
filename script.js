// --- Anti-clon/anti-scrape allowlist de orígenes ---
(function () {
  try {
    const h = window.location.hostname;
    const ok =
      h === "vitae35.vercel.app" ||                       // dominio canónico
      (h.endsWith(".vercel.app") && h.startsWith("vitae35-")) || // alias de Vercel para este proyecto
      h === "localhost" || h === "127.0.0.1";
    if (!ok) {
      document.documentElement.innerHTML =
        "<style>html,body{height:100%;margin:0}body{background:#0b1020;color:#fff;display:grid;place-items:center;font:600 20px system-ui}</style>Access restricted";
      throw new Error("Blocked origin: " + h);
    }
  } catch (e) {
    console.warn(e);
  }
})();
// Vitae35 unified front — Clerk + Supabase + Payment Links + HF Chat
document.addEventListener('DOMContentLoaded', () => {
  // Loading
  const loading = document.getElementById('loading-screen');
  window.addEventListener('load', () => setTimeout(() => { loading.style.opacity='0'; loading.style.visibility='hidden'; }, 400));

  // Mobile menu
  const mobileBtn = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  mobileBtn?.addEventListener('click', () => {
    const open = navLinks.style.display === 'flex';
    navLinks.style.display = open ? 'none' : 'flex';
    mobileBtn.setAttribute('aria-expanded', (!open).toString());
  });

  // ===== Clerk Auth =====
  async function initClerk(){
    if(!window.CLERK_PUBLISHABLE_KEY){ console.warn('Clerk key missing'); return; }
    await Clerk.load({ publishableKey: window.CLERK_PUBLISHABLE_KEY });
    const authBtn = document.getElementById('clerk-auth');
    const refresh = () => {
      if (Clerk.user) {
        authBtn.textContent = 'Mi Cuenta';
        authBtn.onclick = () => Clerk.openUserProfile();
      } else {
        authBtn.textContent = 'Acceder';
        authBtn.onclick = () => {
          if (window.CLERK_SIGNIN_URL) location.href = window.CLERK_SIGNIN_URL + '?redirect_url=' + encodeURIComponent(location.href);
          else Clerk.openSignIn({ redirectUrl: location.href });
        };
      }
    };
    Clerk.addListener(({ user }) => refresh());
    refresh();
  }

  // ===== Affiliate Capture =====
  const urlParams = new URLSearchParams(location.search);
  const aff = urlParams.get('a');
  if(aff) document.cookie = `aff_code=${aff}; path=/; max-age=${60*60*24*90}`;

  // ===== i18n (15 languages) =====
  const SUPPORTED = ['es','en','pt','fr','de','it','nl','sv','no','da','fi','pl','tr','ar','hi'];
  const T = {
    es:{ t:'Vitae35 | Transformación Premium 35+', d:'IA + ciencia para transformar cuerpo y salud después de los 35.',
      nav:{home:'Inicio',services:'Servicios',pricing:'Planes',login:'Acceder'},
      heroBadge:'✨ Oferta Fundador Exclusiva ✨',
      heroTitle:'El Fin de los Planes Genéricos. <span class="highlight">Tu Transformación Comienza Hoy.</span>',
      heroSub:'Acceso de por vida a la plataforma de IA #1 para 35+. Un pago: 100% personalizado.',
      cta:'Obtener Acceso Fundador',
      s1:'Un Ecosistema, no solo una App', s2:'IA que construye tu plan y ajusta semanalmente.',
      cards:[
        {h:'Nutrición Metabólica', p:'Menús personalizados por metabolismo y objetivos.'},
        {h:'Entrenamiento Inteligente', p:'Rutinas fuerza/HIIT con foco anti-lesión.'},
        {h:'Progreso & Ajustes', p:'Dashboard + seguimiento 24/7 y auto-tuning.'}
      ],
      pricingH:'Planes', pricingS:'Elige tu nivel. Pagos seguros.',
      plans:[
        {name:'Starter', price:'$499 MXN', period:'Pago único fundador',
          feats:['Plan de nutrición básico por IA','Rutina mensual autogestionada','App y recetas esenciales'], cta:'Elegir Starter'},
        {name:'Pro', price:'$1,299 MXN', period:'Mensual',
          feats:['Starter + ajustes semanales','Soporte por chat 24/7','Programas en casa y gimnasio'], cta:'Elegir Pro'},
        {name:'Elite', price:'$3,999 MXN', period:'Mensual',
          feats:['Coach dedicado y videollamadas','Ajustes diarios si aplica','Suplementación personalizada'], cta:'Elegir Elite'}
      ],
      modal:{title:'Tu acceso', sub:'Deja tu email y te llevamos al pago seguro.', btn:'Continuar', note:'Usamos Stripe. No guardamos tarjetas.'},
      footer:{rights:'Todos los derechos reservados.', disc:'Consulta a tu médico antes de iniciar. Resultados varían.'}
    },
    en:{ t:'Vitae35 | Premium Transformation 35+', d:'AI + science to transform body & health after 35.',
      nav:{home:'Home',services:'Services',pricing:'Pricing',login:'Sign in'},
      heroBadge:'✨ Founder Exclusive Offer ✨',
      heroTitle:'The End of Generic Plans. <span class="highlight">Your Transformation Starts Now.</span>',
      heroSub:'Lifetime access to the #1 AI platform for 35+. 100% personalized.',
      cta:'Get Founder Access',
      s1:'An Ecosystem, not just an App', s2:'AI builds your plan and tunes weekly.',
      cards:[
        {h:'Metabolic Nutrition', p:'Menus personalized to your metabolism & goals.'},
        {h:'Smart Training', p:'Strength/HIIT with anti-injury focus.'},
        {h:'Progress & Adjustments', p:'Dashboard + 24/7 tracking and auto-tuning.'}
      ],
      pricingH:'Plans', pricingS:'Pick your level. Secure payments.',
      plans:[
        {name:'Starter', price:'$29 USD', period:'One-time founder',
          feats:['Basic AI nutrition plan','Monthly self-guided routine','App + essential recipes'], cta:'Choose Starter'},
        {name:'Pro', price:'$79 USD', period:'Monthly',
          feats:['Starter + weekly adjustments','24/7 chat support','Home & gym programs'], cta:'Choose Pro'},
        {name:'Elite', price:'$199 USD', period:'Monthly',
          feats:['Dedicated coach & calls','Daily tweaks if needed','Personalized supplements'], cta:'Choose Elite'}
      ],
      modal:{title:'Your access', sub:'Drop your email and go to secure checkout.', btn:'Continue', note:'Powered by Stripe.'},
      footer:{rights:'All rights reserved.', disc:'Consult your physician before starting. Results vary.'}
    }
  };
  ['pt','fr','de','it','nl','sv','no','da','fi','pl','tr','ar','hi'].forEach(k=>T[k]=Object.assign({},T.en,{ nav:Object.assign({},T.en.nav) }));

  function setLang(code){
    const L = T[code] || T.es;
    document.title=L.t; document.querySelector('meta[name="description"]').setAttribute('content',L.d);
    document.getElementById('nav-home').textContent=L.nav.home;
    document.getElementById('nav-services').textContent=L.nav.services;
    document.getElementById('nav-pricing').textContent=L.nav.pricing;

    document.getElementById('hero-badge').textContent=L.heroBadge;
    document.getElementById('hero-title').innerHTML=L.heroTitle;
    document.getElementById('hero-subtitle').textContent=L.heroSub;
    document.getElementById('cta-main-text').textContent=L.cta;

    document.getElementById('services-title').textContent=L.s1;
    document.getElementById('services-subtitle').textContent=L.s2;
    const cardEls = document.querySelectorAll('.services-grid .service-card');
    L.cards.forEach((c,i)=>{cardEls[i].querySelector('h3').textContent=c.h; cardEls[i].querySelector('p').textContent=c.p;});

    document.getElementById('pricing-title').textContent=L.pricingH;
    document.getElementById('pricing-subtitle').textContent=L.pricingS;
    const planNames=[...document.querySelectorAll('.plan-name')];
    const planPrices=[...document.querySelectorAll('.plan-price')];
    const planPeriods=[...document.querySelectorAll('.plan-period')];
    const planLists=[...document.querySelectorAll('.plan-features')];
    const planCtas=[...document.querySelectorAll('.select-plan')];
    L.plans.forEach((p,i)=>{
      planNames[i].textContent=p.name; planPrices[i].textContent=p.price; planPeriods[i].textContent=p.period;
      planLists[i].innerHTML=p.feats.map(f=>`<li><span class="feature-check">✓</span>${f}</li>`).join('');
      planCtas[i].textContent=p.cta;
    });

    document.getElementById('modal-title').textContent=L.modal.title;
    document.getElementById('modal-subtitle').textContent=L.modal.sub;
    document.getElementById('modal-submit-btn').textContent=L.modal.btn;
    document.getElementById('modal-note').textContent=L.modal.note;

    document.getElementById('footer-rights').textContent=L.footer.rights;
    document.getElementById('footer-disclaimer').textContent=L.footer.disc;
  }
  const langSel=document.getElementById('lang-select');
  const browserLang=(navigator.language||'es').slice(0,2).toLowerCase();
  langSel.value= SUPPORTED.includes(browserLang) ? browserLang : 'es';
  setLang(langSel.value);
  langSel.addEventListener('change', e=> setLang(e.target.value));

  // ===== Supabase lead capture + Stripe Payment Links =====
  const planButtons = document.querySelectorAll('.select-plan');
  const modal = document.getElementById('onboarding-modal');
  const closeBtn = document.querySelector('.modal-close-btn');
  const form = document.getElementById('onboarding-form');
  const emailInput = document.getElementById('email-input');
  let chosenPlan=null;

  planButtons.forEach(btn=>btn.addEventListener('click',()=>{
    chosenPlan=btn.dataset.plan; modal.style.display='grid'; emailInput.focus();
  }));
  closeBtn?.addEventListener('click',()=> modal.style.display='none');

  form?.addEventListener('submit', async (e)=>{
    e.preventDefault(); const email=emailInput.value.trim();
    if(!email || !chosenPlan) return;
    // Supabase anon only (env provided by /api/env)
    try{
      if(window.SUPABASE_URL && window.SUPABASE_ANON){
        const sb = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON);
        const cookies = Object.fromEntries(document.cookie.split(';').map(c=>c.trim().split('=').map(decodeURIComponent)).filter(a=>a[0]));
        await sb.from('leads').insert({ email, plan: chosenPlan, affiliate_code: cookies['aff_code'] || null, source:'vitae35', created_at: new Date().toISOString() });
      }
    }catch(err){ console.warn('Supabase insert skipped:',err); }
    // Redirect to Payment Link
    const link = (window.PAYMENT_LINKS && window.PAYMENT_LINKS[chosenPlan]) || '';
    if(link) location.href = link; else alert('Configura los Payment Links en Vercel ENV.');
  });

  // ===== AI chat via serverless (/api/chat) =====
  async function ask(prompt){
    const r = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:prompt}]})});
    const j = await r.json(); return j.reply || '…';
  }
  document.getElementById('ai-assistant-btn')?.addEventListener('click', async ()=>{
    const q = prompt('Vitae35 IA 🤖: ¿En qué te ayudo hoy?');
    if(!q) return; const a = await ask(q); alert(a);
  });

  // Init Clerk last (env variables must be present)
  initClerk();
});
/* === Security Front Additions (nonce + honeypot + domain guard) === */
(async function(){
  let ACCESS_TOKEN="";
  try{ const r=await fetch("/api/nonce"); const j=await r.json(); ACCESS_TOKEN=j.token||""; }catch{}

  // Restringe UI a dominios permitidos (anti-clone)
  try{
    const ALLOWED=( (window.ALLOWED_ORIGINS_PUBLIC)||["vitae35.vercel.app"] );
    const h=location.host.toLowerCase();
    const pass=ALLOWED.some(s=>{ s=s.toLowerCase(); if(s.startsWith("*.")) return h===s.slice(2)||h.endsWith("."+s.slice(2)); return h===s;});
    if(!pass){ const o=document.createElement("div"); o.style.cssText="position:fixed;inset:0;background:#0b1024;color:#fff;display:flex;align-items:center;justify-content:center;z-index:99999;font:600 18px system-ui"; o.textContent="Access restricted"; document.body.appendChild(o); throw new Error("domain_not_allowed"); }
  }catch{}

  // Honeypot + time gate en formulario de onboarding (si existe)
  const f=document.getElementById("onboarding-form");
  if(f){
    const hp=document.createElement("input"); hp.type="text"; hp.name="website"; hp.style.display="none"; f.appendChild(hp);
    const t0=Date.now();
    f.addEventListener("submit",(e)=>{
      if(hp.value){ e.preventDefault(); alert("Blocked"); return; }
      if(Date.now()-t0<2500){ e.preventDefault(); alert("Too fast"); return; }
      const ofetch=window.fetch;
      window.fetch=(i,n={})=>{ n.headers=Object.assign({},n.headers,{"X-Access-Token":ACCESS_TOKEN}); return ofetch(i,n); };
    },{once:true});
  }
})();
