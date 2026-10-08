// Prueba de humo en navegador contra la tienda (o un theme sin publicar).
// Uso: THEME_ID=123 node tools/e2e.mjs
// Variables: STORE_URL (por defecto https://nanotronics.com.co), THEME_ID, CHROME_PATH.
import puppeteer from 'puppeteer-core';

const BASE = (process.env.STORE_URL || 'https://nanotronics.com.co').replace(/\/$/, '');
const THEME = process.env.THEME_ID || '';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const url = (path) => (THEME ? `${BASE}${path}${path.includes('?') ? '&' : '?'}preview_theme_id=${THEME}` : `${BASE}${path}`);

const productHandle = await fetch(`${BASE}/products.json?limit=1`)
  .then((r) => r.json())
  .then((j) => j.products[0]?.handle);
const productPath = `/products/${productHandle}`;
const PAGES = ['/', '/collections/all', '/collections', productPath, '/search?q=a', '/cart', '/pages/contacto', '/pages/soporte', '/pagina-que-no-existe'];

// Ruido externo al theme: banner de cookies de Shopify, shop.app y analítica.
const IGNORED = /shop\.app|monorail|web-pixel|\/api\/collect|status of 404|pagina-que-no-existe/;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const results = [];
const check = (name, pass, detail = '') => results.push({ name, pass, detail });

async function openPage(mobile) {
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport(mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1366, height: 900 });
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => m.type() === 'error' && !IGNORED.test(m.text()) && page.errors.push(`console: ${m.text()}`));
  page.on('response', (r) => r.status() >= 400 && !IGNORED.test(r.url()) && page.errors.push(`${r.status()} ${r.url().slice(0, 140)}`));
  return page;
}
const dismissCookieBanner = (page) => page.evaluate(() => document.querySelectorAll('[id^="shopify-pc"]').forEach((e) => e.remove()));

for (const mobile of [false, true]) {
  const page = await openPage(mobile);
  for (const path of PAGES) {
    page.errors = [];
    await page.goto(url(path), { waitUntil: 'networkidle2', timeout: 60000 });
    const info = await page.evaluate(() => ({
      alpine: !!window.Alpine,
      brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.src && !i.src.startsWith('data:')).length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      liquidError: document.body.innerText.includes('Liquid error'),
    }));
    const problems = [
      ...page.errors,
      info.brokenImages && `${info.brokenImages} imágenes rotas`,
      info.overflow && 'scroll horizontal',
      !info.alpine && 'Alpine no cargó',
      info.liquidError && 'Liquid error en la página',
    ].filter(Boolean);
    check(`${mobile ? '[móvil]' : '[desktop]'} ${path}`, problems.length === 0, problems.join(' | '));
  }
}

{
  const page = await openPage(false);
  await page.goto(url(productPath), { waitUntil: 'networkidle2' });
  await dismissCookieBanner(page);
  const button = await page.$('form[action*="/cart/add"] button[name="add"]:not([disabled])');
  check('PDP: botón agregar al carrito', !!button);
  if (button) {
    await button.click();
    const drawerOpened = await page
      .waitForFunction(() => {
        const panel = document.querySelector('#cart-drawer.is-open .nt-drawer__panel');
        if (!panel) return false;
        const r = panel.getBoundingClientRect();
        return r.width > 0 && r.left < window.innerWidth && r.right > 0;
      }, { timeout: 10000 })
      .then(() => true, () => false);
    check('Carrito: el drawer se abre', drawerOpened);
    const cart = await page.evaluate(async () => (await fetch('/cart.js')).json());
    check('Carrito: el producto está en /cart.js', cart.item_count >= 1, `item_count=${cart.item_count}`);
    await page.goto(url('/cart'), { waitUntil: 'networkidle2' });
    check('Página /cart: botón de pagar', !!(await page.$('button[name="checkout"], input[name="checkout"]')));
  }
  check('Flujo de compra sin errores', page.errors.length === 0, page.errors.join(' | '));
}

{
  const page = await openPage(false);
  await page.goto(url('/'), { waitUntil: 'networkidle2' });
  await dismissCookieBanner(page);
  await page.type('#header-search', productHandle.slice(0, 4), { delay: 80 });
  const found = await page
    .waitForFunction(() => {
      const r = document.querySelector('#header-search')?.closest('form')?.querySelector('[data-predictive-results]');
      return r && !r.hidden && r.querySelectorAll('a').length > 0;
    }, { timeout: 10000 })
    .then(() => true, () => false);
  check('Búsqueda predictiva con resultados', found);
}

{
  const page = await openPage(true);
  await page.goto(url('/'), { waitUntil: 'networkidle2' });
  await dismissCookieBanner(page);
  await page.click('[aria-controls="mobile-nav"]');
  await new Promise((r) => setTimeout(r, 400));
  check('[móvil] menú se abre', await page.evaluate(() => getComputedStyle(document.getElementById('mobile-nav')).display !== 'none'));
}

await browser.close();
for (const r of results) console.log(`${r.pass ? 'OK  ' : 'FAIL'} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
const failed = results.filter((r) => !r.pass).length;
console.log(`\n${results.length - failed}/${results.length} OK — theme ${THEME || 'publicado'}`);
process.exit(failed ? 1 : 0);
