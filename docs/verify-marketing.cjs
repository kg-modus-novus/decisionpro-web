const fs = require('fs');
const http = require('http');
const path = require('path');

const root = path.resolve(__dirname, '..');
const playwrightPath = path.join(process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp', 'decisionpro-playwright-runtime', 'node_modules', 'playwright-core');
const { chromium } = require(playwrightPath);
const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifacts = process.env.SCRIPTORIUM_UI_ARTIFACT_DIR || path.join(root, 'docs', 'evidence', 'marketing-final');

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/favicon.ico') { response.writeHead(204); response.end(); return; }
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const file = path.resolve(root, relative);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});

function assert(condition, message) { if (!condition) throw new Error(message); }

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const browser = await chromium.launch({ headless: !process.env.SCRIPTORIUM_UI_DESKTOP_NAME, executablePath: chrome });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.goto(`http://127.0.0.1:${port}`, { waitUntil: 'networkidle' });
  assert((await page.title()) === 'DecisionPro — Multi-State Public Program Decision Intelligence', 'Multi-state title missing.');
  assert(await page.getByRole('heading', { name: /DecisionPro turns it into action/i }).count() === 1, 'Multi-state hero missing.');
  assert(await page.locator('.state-card').count() === 2, 'Kentucky and Florida state proof cards are missing.');
  assert(await page.locator('.compare-table > div').count() === 7, 'Capability comparison is incomplete.');
  assert(await page.locator('.proof-grid img').count() === 3, 'New product screenshots are incomplete.');
  const images = page.locator('img');
  for (let index = 0; index < await images.count(); index += 1) {
    await images.nth(index).scrollIntoViewIfNeeded();
    await images.nth(index).evaluate((image) => image.complete || new Promise((resolve) => image.addEventListener('load', resolve, { once: true })));
  }
  assert(await images.evaluateAll((items) => items.every((image) => image.complete && image.naturalWidth > 0)), 'A marketing screenshot failed to load.');
  await page.getByRole('link', { name: 'Compare the capabilities' }).click();
  assert((await page.locator('#compare').boundingBox()).y < 1050, 'Comparison navigation did not move to the comparison section.');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Desktop page has unexpected horizontal overflow.');
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  const screenshot = path.join(artifacts, 'decisionpro-multistate-marketing.png');
  await page.screenshot({ path: screenshot, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Mobile page has unexpected horizontal overflow.');
  const mobileScreenshot = path.join(artifacts, 'decisionpro-multistate-mobile.png');
  await page.screenshot({ path: mobileScreenshot, fullPage: true });
  const result = { passed: true, evidenceClass: process.env.SCRIPTORIUM_UI_DESKTOP_NAME ? 'isolated-rendered' : 'headless-validated', screenshot, mobileScreenshot, viewport: '1440x1000 and 390x844', title: await page.title(), stateProducts: 2, comparisonCapabilities: 6, screenshots: 3, errors };
  fs.writeFileSync(path.join(artifacts, 'marketing-verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  await browser.close(); server.close();
})().catch((error) => { fs.mkdirSync(artifacts, { recursive: true }); fs.writeFileSync(path.join(artifacts, 'marketing-error.txt'), `${error.stack || error}\n`); server.close(); console.error(error); process.exit(1); });
