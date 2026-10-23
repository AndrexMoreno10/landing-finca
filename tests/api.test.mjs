import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
test('Reservation, moderation, protected admin and availability workflow',async()=>{
const dir=mkdtempSync(join(tmpdir(),'chalet-test-'));const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'3099',DATA_DIR:dir,ADMIN_TOKEN:'test-admin-token',WOMPI_PUBLIC_KEY:'',WOMPI_INTEGRITY_SECRET:''},stdio:['ignore','pipe','pipe']});
try{await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Server timeout')),10000);child.stdout.once('data',()=>{clearTimeout(timer);resolve()});child.once('error',reject)});
const call=async(path,body,auth=false)=>{const r=await fetch('http://127.0.0.1:3099/api'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(auth?{Authorization:'Bearer test-admin-token'}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()}};
assert.equal((await call('/admin')).status,401);
const arrival=new Date(Date.now()+40*86400000).toISOString().slice(0,10),departure=new Date(Date.now()+43*86400000).toISOString().slice(0,10);
const lead=await call('/leads',{arrival,departure,guests:20,name:'Test guest',phone:'+573001234567',email:'guest@example.com',consent:true,total:1});assert.equal(lead.status,201);assert.equal(lead.data.quote.total,4500000);
assert.equal((await call('/admin/payment',{id:lead.data.id},true)).status,400);
assert.equal((await call('/admin/lead',{id:lead.data.id,status:'confirmed'},true)).status,200);
assert.equal((await call('/leads',{arrival,departure,guests:20,name:'Other guest',phone:'+573001234567',email:'other@example.com',consent:true})).status,409);
assert.equal((await call('/admin/payment',{id:lead.data.id},true)).status,503);
const laterArrival=new Date(Date.now()+50*86400000).toISOString().slice(0,10),laterDeparture=new Date(Date.now()+53*86400000).toISOString().slice(0,10);const noEmail=await call('/leads',{arrival:laterArrival,departure:laterDeparture,guests:4,name:'WhatsApp guest',phone:'+573001112233',consent:true});assert.equal(noEmail.status,201);assert.equal((await call('/admin',null,true)).data.leads.find(l=>l.id===noEmail.data.id).email,'');assert.equal((await call('/admin/lead',{id:noEmail.data.id,status:'confirmed'},true)).status,200);assert.equal((await call('/admin/payment',{id:noEmail.data.id},true)).status,400);
assert.equal((await call('/reviews',{name:'Test guest',rating:5,comment:'A wonderful place to stay.'})).status,201);
assert.equal((await call('/reviews')).data.length,0);const db=await call('/admin',null,true);assert.equal(db.data.leads.length,2);
assert.equal((await call('/admin/review',{id:db.data.reviews[0].id,status:'approved'},true)).status,200);const published=await call('/reviews');assert.equal(published.data.length,1);assert.equal(published.data[0].status,undefined);
assert.equal((await call('/admin/lead',{id:lead.data.id,status:'cancelled'},true)).status,200);assert.equal((await call('/admin/lead',{id:noEmail.data.id,status:'cancelled'},true)).status,200);assert.equal((await call('/config')).data.blocks.length,0);
assert.equal((await fetch('http://127.0.0.1:3099/.env')).status,404);
}finally{child.kill();await new Promise(resolve=>child.once('exit',resolve));rmSync(dir,{recursive:true,force:true});}
});
