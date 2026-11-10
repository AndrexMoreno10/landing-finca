const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
require('node:fs').mkdirSync('test-results', { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.locator('#calendar-month-label').waitFor();
    await page.locator('#availability-calendar .calendar-day.is-available').first().waitFor({ timeout: 10000 });
    await page.locator('img').evaluateAll((images) => images.forEach((image) => { image.loading = 'eager'; }));
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => null))));
    await page.locator('.spaces-reel').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const video = document.querySelector('[data-spaces-reel-video]');
      return video?.currentTime > 0;
    }, null, { timeout: 15000 });
    assert.match(await page.locator('[data-spaces-reel-video]').getAttribute('src'), /finca-reel\.mp4$/);
    await page.locator('[data-reel-toggle]').click();
    await page.waitForFunction(() => document.querySelector('[data-spaces-reel-video]').paused);
    await page.locator('[data-reel-toggle]').click();
    await page.waitForFunction(() => !document.querySelector('[data-spaces-reel-video]').paused);
    await page.locator('[data-reel-audio]').click();
    assert.equal(await page.locator('[data-spaces-reel-video]').evaluate((video) => video.muted), false);
    await page.locator('[data-reel-audio]').click();
    for (const card of await page.locator('[data-space-id]').all()) {
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
    }
    await page.locator('#ubicacion').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);

    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), true);
    assert.equal(await page.locator('[data-space-id].is-visible').count(), 6);
    assert.equal(await page.locator('.space-card > img').evaluateAll((images) => images.every((image) => getComputedStyle(image).objectFit === 'cover')), true);
    assert.equal(await page.locator('#ubicacion .location-distance').count(), 3);
    assert.equal(await page.locator('#recuerdos .premium-gallery-grid article').count(), 4);
    await page.screenshot({ path: 'test-results/desktop-premium.png', fullPage: true });
    for (const [width, height] of [[1280, 800], [768, 1024], [390, 844], [360, 800]]) {
      await page.setViewportSize({ width, height });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `No horizontal overflow at ${width}px.`);
      assert.equal(await page.locator('.hero h1').isVisible(), true, `Hero heading is visible at ${width}px.`);
      assert.equal(await page.locator('.hero-cta').isVisible(), true, `Booking action is visible at ${width}px.`);
    }
    await page.setViewportSize({ width: 1440, height: 960 });

    await page.locator('.hero-cta').click();
    assert.equal(await page.evaluate(() => location.hash), '#availability');
    const availableDates = await page.locator('#availability-calendar .calendar-day.is-available').evaluateAll((days) => days.map((day) => day.dataset.date));
    const arrival = availableDates.find((date) => {
      const end = new Date(`${date}T00:00:00Z`);
      end.setUTCDate(end.getUTCDate() + 3);
      return availableDates.includes(end.toISOString().slice(0, 10));
    });
    assert.ok(arrival, 'There should be an available three-night range in the shown month.');
    const departureDate = new Date(`${arrival}T00:00:00Z`);
    departureDate.setUTCDate(departureDate.getUTCDate() + 3);
    const departure = departureDate.toISOString().slice(0, 10);
    await page.locator(`[data-date="${arrival}"]`).click();
    await page.locator(`[data-date="${departure}"]`).click();
    await page.waitForFunction(() => document.querySelector('#quote strong')?.textContent.includes('4.500.000'));
    assert.match(await page.locator('#quote').innerText(), /3 noches/);
    assert.match(await page.locator('#quote').innerText(), /4\.500\.000/);

    for (let count = 1; count < 26; count += 1) await page.locator('[data-guest-step="1"]').click();
    assert.equal(await page.locator('[data-guest-value]').innerText(), '26');
    assert.equal(await page.locator('[data-guest-step="1"]').isDisabled(), true);
    await page.locator('[data-currency="USD"]:not(:disabled)').waitFor({ timeout: 15000 });
    await page.locator('[data-currency="USD"]').click();
    assert.match(await page.locator('#quote').innerText(), /USD/);
    await page.locator('#language').click();
    assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    assert.match(await page.locator('#quote').innerText(), /Estimated total/);

    await page.route('**/api/leads', async (route) => {
      await route.fulfill({ json: { id: 'test-request-123', quote: { arrival, departure, guests: 26, nights: 3, total: 4500000 } } });
    });
    await page.locator('#continue-booking').click();
    await page.locator('#contact-step').waitFor({ state: 'visible' });
    await page.locator('#reservation-form [name=name]').fill('Browser test');
    await page.locator('#reservation-form [name=phone]').fill('3201234567');
    await page.locator('#reservation-form [name=consent]').check();
    await page.locator('#reservation-form [type=submit]').click();
    await page.locator('#booking-success').waitFor({ state: 'visible' });
    assert.match(await page.locator('#form-status').innerText(), /Solicitud recibida|Request received/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.locator('#calendar-month-label').waitFor();
    await page.locator('.spaces-reel').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('[data-spaces-reel-video]')?.currentTime > 0, null, { timeout: 15000 });
    assert.equal(await page.locator('.spaces-reel').evaluate((reel) => reel.getBoundingClientRect().width > 300), true);
    for (const card of await page.locator('[data-space-id]').all()) {
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(80);
    }
    await page.locator('#recuerdos').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await page.locator('img').evaluateAll((images) => Promise.all(images.map((image) => image.decode().catch(() => null))));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: 'test-results/mobile-premium.png', fullPage: true });
    assert.equal(await page.locator('#floating-whatsapp').isVisible(), true);
    assert.equal(await page.locator('.floating-chat img').getAttribute('src'), '/assets/whatsapp-mark.svg');
    await page.locator('#location-whatsapp').scrollIntoViewIfNeeded();
    await page.locator('[data-space-id]').first().click();
    await page.locator('#space-dialog').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#space-dialog').isVisible(), false);
    assert.deepEqual(errors, []);
    console.log('PASS: premium desktop/mobile layout, image assets, location, gallery, three-night COP quote, USD and language toggles, 26-guest limit and reservation flow.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
