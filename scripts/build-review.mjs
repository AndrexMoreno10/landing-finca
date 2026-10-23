import {mkdir, readFile, writeFile, cp, readdir} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'review-deploy');
await mkdir(output, {recursive:true});
// Explicitly package public assets only: never include local data, environment or admin files.
for (const item of await readdir(resolve(root, 'public'), {withFileTypes:true})) {
  if (item.name === 'admin.html' || item.name === 'admin.js') continue;
  await cp(resolve(root,'public',item.name), resolve(output,item.name), {recursive:true});
}
let html = await readFile(resolve(output,'index.html'),'utf8');
html = html.replace('</head>', '<meta name="robots" content="noindex,nofollow"><script src="/review-mode.js" defer></script><style>.review-notice{padding:10px 20px;text-align:center;background:#e3eeeb;color:#173c43;font:500 12px/1.6 Manrope,Arial,sans-serif}.review-notice p{margin:0;color:inherit}#contact-step{display:none!important}</style></head>');
html = html.replace('<body>', '<body><aside class="review-notice"><p data-es="Versión de revisión · Calendario de ejemplo. No recibe reservas ni pagos." data-en="Review version · Sample calendar. No bookings or payments are accepted.">Versión de revisión · Calendario de ejemplo. No recibe reservas ni pagos.</p></aside>');
html = html.replace('La disponibilidad se actualiza con las reservas confirmadas. Tu solicitud queda sujeta a confirmación.', 'Calendario demostrativo. Las fechas y tarifas deben validarse con los propietarios.');
html = html.replace('Availability reflects confirmed bookings. Requests are subject to confirmation.', 'Demonstration calendar. Dates and rates must be checked with the owners.');
await writeFile(resolve(output,'index.html'),html);
await writeFile(resolve(output,'review-mode.js'), `(() => {
  const message = () => document.documentElement.lang === 'en' ? 'This is a review version. Bookings and reviews are not submitted.' : 'Esta es una versión de revisión. No se envían reservas ni reseñas.';
  function explain(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    const box = document.querySelector('#toast'); box.textContent = message(); box.style.display = 'block';
    setTimeout(() => { box.style.display = 'none'; }, 6000);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('#continue-booking, #write-review, #floating-whatsapp')) explain(event);
  }, true);
  document.addEventListener('submit', event => {
    if (event.target.id !== 'quick-form') explain(event);
  }, true);
})();`);
await mkdir(resolve(output,'review-api'),{recursive:true});
const fixtures = {
  config: {nightly:1500000,cleaning:0,whatsapp:'',marketplace:'',bank:null,paymentReady:false,pixel:null,fx:null,blocks:[],reviewMode:true},
  availability: {blocks:[],reviewMode:true},
  reviews: []
};
for (const [name,data] of Object.entries(fixtures)) await writeFile(resolve(output,'review-api',name+'.json'),JSON.stringify(data));
await writeFile(resolve(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
await writeFile(resolve(output,'vercel.json'), JSON.stringify({
  $schema:'https://openapi.vercel.sh/vercel.json',
  framework:null,
  headers:[{source:'/(.*)',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]}],
  rewrites:Object.keys(fixtures).map(name=>({source:'/api/'+name,destination:'/review-api/'+name+'.json'}))
},null,2));
console.log('Review package ready at '+output);
