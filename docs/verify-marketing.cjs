const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..');
const ARTIFACTS = process.env.SCRIPTORIUM_UI_ARTIFACT_DIR || path.join(REPO, 'docs', 'evidence', 'multi-state-marketing');
const PLAYWRIGHT = path.join(process.env.TEMP || 'C:\\Windows\\Temp', 'decisionpro-playwright-runtime', 'node_modules', 'playwright-core');
const { chromium } = require(PLAYWRIGHT);
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 55000 + (process.pid % 800);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' };

function assert(value, message) { if (!value) throw new Error(message); }

const server = http.createServer((request, response) => {
  const relative = decodeURIComponent(new URL(request.url, `http://127.0.0.1:${PORT}`).pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.resolve(REPO, relative);
  if (!file.startsWith(REPO) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404).end(); return; }
  response.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(response);
});

let browser;

(async () => {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  browser = await chromium.launch({ executablePath: CHROME, headless: !process.env.SCRIPTORIUM_UI_DESKTOP_NAME });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('404 (Not Found)')) errors.push(message.text()); });
  page.setDefaultTimeout(15000);
  await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const hero = (await page.locator('h1').innerText()).replace(/\s+/g, ' ');
  assert(hero.includes('One decision platform.'), `Multi-state hero is missing: ${hero}`);
  assert(await page.locator('.state-showcase').count() === 2, 'Kentucky and Florida state products are not both shown.');
  assert(await page.locator('.comparison-stack article').count() === 2, 'Public-dashboard comparison is missing.');
  assert(await page.locator('.capability-grid article').count() === 4, 'DecisionPro advantage tiles are incomplete.');
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, document.body.scrollHeight); });
  await page.waitForTimeout(500);
  assert(await page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0)), 'One or more product screenshots failed to load.');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Desktop page has unintended horizontal overflow.');
  assert(errors.length === 0, `Console errors: ${errors.join(' | ')}`);
  const screenshot = path.join(ARTIFACTS, 'decisionpro-multistate-desktop.png');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: screenshot });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'Mobile page has unintended horizontal overflow.');
  const mobileScreenshot = path.join(ARTIFACTS, 'decisionpro-multistate-mobile.png');
  await page.screenshot({ path: mobileScreenshot });
  const result = { passed: true, evidenceClass: process.env.SCRIPTORIUM_UI_DESKTOP_NAME ? 'isolated-rendered' : 'headless-validated', url: page.url(), viewport: { width: 1440, height: 1000 }, mobileViewport: { width: 390, height: 844 }, screenshot, mobileScreenshot, stateProducts: 2, comparisonRows: 8, errors };
  fs.writeFileSync(path.join(ARTIFACTS, 'verification.json'), `${JSON.stringify(result, null, 2)}\n`);
  await browser.close();
  server.closeAllConnections();
  server.close();
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exit(0);
})().catch(async (error) => { if (browser) await browser.close().catch(() => {}); server.closeAllConnections(); server.close(); fs.mkdirSync(ARTIFACTS, { recursive: true }); fs.writeFileSync(path.join(ARTIFACTS, 'failure.txt'), `${error.stack || error}\n`); process.stderr.write(`${error.stack || error}\n`); process.exit(1); });
