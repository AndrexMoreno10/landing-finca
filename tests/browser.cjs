const {chromium}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000',{waitUntil:'networkidle'});
 await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode()}});
 await page.locator('#carousel-next').click();
 assert.equal(await page.locator('.carousel-index').innerText(),'02 / 02');
 await page.locator('#carousel-prev').click();
 assert.equal(await page.locator('.carousel-index').innerText(),'01 / 02');
 await page.locator('#carousel-pause').click();
 assert.equal(await page.locator('#carousel-pause').getAttribute('aria-pressed'),'true');
 await page.locator('#carousel-next').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('.carousel-index').innerText(),'02 / 02');
 await page.locator('#carousel-prev').click();
 await page.locator('.hero').screenshot({path:'test-results/desktop-hero.png'});
 await page.screenshot({path:'test-results/desktop.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0)),true);
 const arrival=new Date(Date.now()+40*86400000).toISOString().slice(0,10),departure=new Date(Date.now()+43*86400000).toISOString().slice(0,10);
 await page.locator('#quick-form [name=arrival]').fill(arrival);await page.locator('#quick-form [name=departure]').fill(departure);await page.locator('#quick-form button').click();
 assert.match(await page.locator('#quote').innerText(),/4\.500\.000/);
 await page.locator('#language').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.match(await page.locator('#quote').innerText(),/Estimated total/);
 let leadPayload;await page.route('**/api/leads',async route=>{leadPayload=route.request().postDataJSON();await route.fulfill({json:{id:'test-request-123',quote:{arrival,departure,guests:10,nights:3,total:4500000}}})});
 await page.locator('#continue-booking').click();await page.locator('#contact-step').waitFor({state:'visible'});await page.locator('#country-toggle').click();await page.locator('.country-option[data-iso="MX"]').click();assert.equal(await page.locator('#country-dial').innerText(),'+52');await page.locator('#reservation-form [name=name]').fill('Browser test');await page.locator('#reservation-form [name=phone]').fill('5512345678');await page.locator('#reservation-form [name=consent]').check();await page.locator('#reservation-form [type=submit]').click();await page.locator('#booking-success').waitFor({state:'visible'});assert.match(await page.locator('#form-status').innerText(),/Request received/);assert.equal(leadPayload.phone,'+52 5512345678');assert.equal(leadPayload.email,'');
 await page.route('**/api/reviews',async route=>{if(route.request().method()==='POST')await route.fulfill({json:{status:'pending'}});else await route.continue()});
 await page.locator('#write-review').click();await page.locator('#review-form [name=name]').fill('Test visitor');await page.locator('#review-form [name=comment]').fill('A lovely experience in the coffee region.');await page.locator('#review-form button').click();await page.locator('#modal').waitFor({state:'hidden'});assert.match(await page.locator('#toast').innerText(),/pending approval/);
 await page.setViewportSize({width:390,height:844});await page.goto('http://localhost:3000',{waitUntil:'networkidle'});await page.screenshot({path:'test-results/mobile.png',fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.waitForTimeout(250);assert.equal(await page.locator('.mobile-book').isVisible(),false);await page.locator('.amenity-grid').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));await page.waitForTimeout(250);assert.equal(await page.locator('.mobile-book').isVisible(),true);await page.locator('#availability').scrollIntoViewIfNeeded();await page.waitForTimeout(250);assert.equal(await page.locator('.mobile-book').isVisible(),false);
 await page.locator('[data-photo]').first().click();await page.locator('#modal').waitFor({state:'visible'});await page.keyboard.press('Escape');assert.equal(await page.locator('#modal').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('PASS: desktop/mobile layouts, photos, bilingual quote, lead confirmation, pending review, gallery and no browser exceptions.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
