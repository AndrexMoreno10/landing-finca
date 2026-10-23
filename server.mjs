import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
import {randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {quote,overlaps} from './booking.mjs';
const root=fileURLToPath(new URL('.',import.meta.url)), pub=resolve(root,'public'), data=resolve(root,process.env.DATA_DIR||'data');
mkdirSync(data,{recursive:true});
const dbFile=resolve(data,'store.json');
let db=existsSync(dbFile)?JSON.parse(readFileSync(dbFile,'utf8')):{leads:[],reviews:[],blocks:[]};
const save=()=>{writeFileSync(dbFile+'.tmp',JSON.stringify(db,null,2));renameSync(dbFile+'.tmp',dbFile)};
const env=process.env, cleaning=Math.max(0,Number(env.CLEANING_FEE)||0), port=Number(env.PORT)||3000;
const send=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
const admin=req=>{const a=Buffer.from(req.headers.authorization||''), b=Buffer.from('Bearer '+(env.ADMIN_TOKEN||''));return !!env.ADMIN_TOKEN&&a.length===b.length&&timingSafeEqual(a,b)};
const text=(s,max=200)=>String(s||'').trim().slice(0,max);
const rates=new Map(); let fx=null;
async function exchange(){try{const r=await fetch('https://open.er-api.com/v6/latest/USD',{signal:AbortSignal.timeout(6000)});const j=await r.json();if(j.result==='success'&&j.rates.COP>0)fx={rate:j.rates.COP,updated:j.time_last_update_utc,source:'ExchangeRate-API'};}catch{}}
async function body(req){let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>12000)throw Error('Solicitud demasiado grande');}return JSON.parse(raw||'{}');}
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
 const url=new URL(req.url,'http://localhost'); const path=url.pathname;
 try{
 if(path.startsWith('/api/admin')&&!admin(req))return send(res,401,{error:'Acceso no autorizado. Configura ADMIN_TOKEN e ingrésalo en el panel.'});
 if(req.method==='GET'&&path==='/api/config')return send(res,200,{nightly:1500000,cleaning,whatsapp:/^\d{10,15}$/.test(env.WHATSAPP_NUMBER||'')?env.WHATSAPP_NUMBER:'',marketplace:/^https:\/\/(www\.)?facebook\.com\//.test(env.FACEBOOK_MARKETPLACE_URL||'')?env.FACEBOOK_MARKETPLACE_URL:'',bank:env.BANK_ACCOUNT?{name:env.BANK_NAME,account:env.BANK_ACCOUNT,holder:env.BANK_HOLDER}:null,paymentReady:!!(env.WOMPI_PUBLIC_KEY&&env.WOMPI_INTEGRITY_SECRET),pixel:env.ENABLE_MARKETING==='true'&&/^\d+$/.test(env.META_PIXEL_ID||'')?env.META_PIXEL_ID:null,fx,blocks:db.blocks});
 if(req.method==='GET'&&path==='/api/availability'){
  const from=url.searchParams.get('from'),to=url.searchParams.get('to');
  const valid=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
  if(!valid(from)||!valid(to)||from>=to||(Date.parse(to)-Date.parse(from))/86400000>62)return send(res,400,{error:'Rango de fechas inválido'});
  return send(res,200,{blocks:db.blocks.filter(b=>b.arrival<to&&b.departure>from).map(({arrival,departure})=>({arrival,departure}))});
 }
 if(req.method==='GET'&&path==='/api/reviews')return send(res,200,db.reviews.filter(r=>r.status==='approved').map(({name,rating,comment,date})=>({name,rating,comment,date})));
 if(req.method==='GET'&&path==='/api/admin')return send(res,200,db);
 if(req.method==='POST'&&path.startsWith('/api/')){
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`&&req.headers.origin!==`https://${req.headers.host}`)return send(res,403,{error:'Origen no permitido'});
  const key=req.socket.remoteAddress, stamp=Date.now(), bucket=rates.get(key)||{time:stamp,count:0};if(stamp-bucket.time>60000){bucket.time=stamp;bucket.count=0;}bucket.count++;rates.set(key,bucket);if(bucket.count>40)return send(res,429,{error:'Intenta de nuevo en un minuto / Try again in a minute'});
  const b=await body(req);
  if(path==='/api/leads'){
   if(b.website)return send(res,400,{error:'Invalid request'});
   const q=quote(b,cleaning);if(db.blocks.some(x=>overlaps(q,x)))return send(res,409,{error:'Estas fechas no están disponibles / These dates are unavailable'});
   const name=text(b.name,100),phone=text(b.phone,30),email=text(b.email,150);
   if(name.length<2||!/^\+?[\d\s()-]{7,25}$/.test(phone)||(email&&!/^\S+@\S+\.\S+$/.test(email))||b.consent!==true)return send(res,400,{error:'Revisa tus datos y autoriza el contacto / Check your details and contact consent'});
   const lead={id:randomUUID(),...q,name,phone,email,status:'pending',date:new Date().toISOString(),source:Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].map(k=>[k,text(b.source?.[k],200)]))};
   db.leads.unshift(lead);save();return send(res,201,{id:lead.id,quote:q});
  }
  if(path==='/api/reviews'){
   const name=text(b.name,80),comment=text(b.comment,1500),rating=Number(b.rating);
   if(b.website||name.length<2||comment.length<10||!Number.isInteger(rating)||rating<1||rating>5)return send(res,400,{error:'Completa tu nombre, comentario y calificación / Complete your name, review and rating'});
   db.reviews.unshift({id:randomUUID(),name,comment,rating,date:new Date().toISOString(),status:'pending'});save();return send(res,201,{status:'pending'});
  }
  if(path==='/api/admin/review'){
   const review=db.reviews.find(r=>r.id===b.id);if(!review||!['approved','rejected'].includes(b.status))return send(res,400,{error:'Reseña o estado inválido'});review.status=b.status;save();return send(res,200,{ok:true});
  }
  if(path==='/api/admin/block'){
   const q=quote({...b,guests:1},0);db.blocks.push({id:randomUUID(),arrival:q.arrival,departure:q.departure});save();return send(res,200,{ok:true});
  }
  if(path==='/api/admin/unblock'){db.blocks=db.blocks.filter(x=>x.id!==b.id);save();return send(res,200,{ok:true});}
  if(path==='/api/admin/lead'){
   const lead=db.leads.find(l=>l.id===b.id);if(!lead||!['pending','contacted','confirmed','cancelled'].includes(b.status))return send(res,400,{error:'Estado inválido'});
   if(b.status==='confirmed'&&db.blocks.some(x=>x.id!==lead.id&&overlaps(x,lead)))return send(res,409,{error:'Las fechas se cruzan con otra reserva o bloqueo'});
   db.blocks=db.blocks.filter(x=>x.id!==lead.id);if(b.status==='confirmed')db.blocks.push({id:lead.id,arrival:lead.arrival,departure:lead.departure});lead.status=b.status;save();return send(res,200,{ok:true});
  }
  if(path==='/api/admin/payment'){
   const lead=db.leads.find(l=>l.id===b.id);if(!lead||lead.status!=='confirmed')return send(res,400,{error:'Confirma disponibilidad y reserva antes de crear el enlace'});
   if(b.email){const email=text(b.email,150);if(!/^\S+@\S+\.\S+$/.test(email))return send(res,400,{error:'Escribe un correo válido / Enter a valid email'});lead.email=email;save();}
   if(!lead.email)return send(res,400,{error:'Pide el correo al huésped para generar el enlace de pago / Ask the guest for an email to create the payment link'});
   if(!env.WOMPI_PUBLIC_KEY||!env.WOMPI_INTEGRITY_SECRET)return send(res,503,{error:'Faltan credenciales de Wompi'});
   const reference=lead.id+'-'+Date.now(),amount=lead.total*100;
   const signature=createHash('sha256').update(`${reference}${amount}COP${env.WOMPI_INTEGRITY_SECRET}`).digest('hex');
   const params=new URLSearchParams({'public-key':env.WOMPI_PUBLIC_KEY,currency:'COP','amount-in-cents':String(amount),reference,'signature:integrity':signature,'customer-data:email':lead.email,'customer-data:full-name':lead.name});
   return send(res,200,{url:'https://checkout.wompi.co/p/?'+params});
  }
  return send(res,404,{error:'Not found'});
 }
 if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'Method not allowed'});
 const file=resolve(pub,'.'+decodeURIComponent(path==='/'?'/index.html':path==='/admin'?'/admin.html':path));
 if(!file.startsWith(pub+sep))return send(res,403,{error:'Forbidden'});
 try{const content=readFileSync(file),types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm'};res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:content);}catch{return send(res,404,{error:'Not found'});}
 }catch(error){send(res,400,{error:error.message});}
});
server.listen(port,env.HOST||'127.0.0.1',()=>console.log(`Chalet local: http://localhost:${port}`));
exchange();setInterval(exchange,3600000).unref();setInterval(()=>{for(const [k,v]of rates)if(Date.now()-v.time>60000)rates.delete(k)},60000).unref();
