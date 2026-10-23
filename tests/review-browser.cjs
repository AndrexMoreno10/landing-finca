const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
(async()=>{
 const url=process.env.REVIEW_URL;if(!url)throw Error('Set REVIEW_URL to the review deployment URL');
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
  const response=await page.goto(url,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert.match(await page.locator('.review-notice').innerText(),/Versión de revisión/);
  await page.locator('.calendar-day.is-available').first().waitFor();
  await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode()}});
  const arrival=new Date(Date.now()+40*86400000).toISOString().slice(0,10),departure=new Date(Date.now()+43*86400000).toISOString().slice(0,10);
  await page.locator('#quick-form [name=arrival]').fill(arrival);await page.locator('#quick-form [name=departure]').fill(departure);await page.locator('#quick-form button').click();
  assert.match(await page.locator('#quote').innerText(),/4\.500\.000/);
  await page.locator('#continue-booking').click();assert.equal(await page.locator('#contact-step').isVisible(),false);assert.match(await page.locator('#toast').innerText(),/versión de revisión/);
  await page.locator('#language').click();assert.match(await page.locator('.review-notice').innerText(),/Review version/);
  await page.locator('#write-review').click();assert.equal(await page.locator('#modal').isVisible(),false);
  for(const width of [390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);}
  for(const path of ['/api/admin','/admin.html','/.env','/.env.local','/data/store.json']){const r=await page.request.get(url+path);assert.equal(r.status(),404,path);}
  const rejected=await page.request.post(url+'/api/leads',{data:{}});assert.ok(rejected.status()>=400);
  assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
  await page.goto(url,{waitUntil:'networkidle'});await page.screenshot({path:'test-results/vercel-review.png'});
  console.log('PASS: public review URL, images, calendar, quote, bilingual copy, no submissions, responsive layout, private paths absent.');
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
