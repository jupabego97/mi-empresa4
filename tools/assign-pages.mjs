#!/usr/bin/env node
/**
 * Crea o actualiza páginas en Shopify y asigna templateSuffix según config/pages-manifest.json
 *
 * Uso:
 *   shopify auth login
 *   node tools/assign-pages.mjs
 *   node tools/assign-pages.mjs --store=tu-tienda.myshopify.com
 *
 * Alternativa sin CLI (Custom app en Admin):
 *   $env:SHOPIFY_STORE="tu-tienda.myshopify.com"
 *   $env:SHOPIFY_ADMIN_TOKEN="shpat_..."
 *   node tools/assign-pages.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifest = JSON.parse(readFileSync(join(root, 'config', 'pages-manifest.json'), 'utf8'));

const storeArg = process.argv.find((a) => a.startsWith('--store='))?.split('=')[1];
const store =
  process.env.SHOPIFY_STORE ||
  storeArg ||
  readThemeStore() ||
  'gigahertz-emporium-1onmb.myshopify.com';

const token = process.env.SHOPIFY_ADMIN_TOKEN || readCliToken(store);

if (!token) {
  console.error(`
No se encontró token de Admin API.

1) Ejecuta: shopify auth login
2) Vuelve a correr: npm run pages:assign

O define:
  SHOPIFY_STORE=tu-tienda.myshopify.com
  SHOPIFY_ADMIN_TOKEN=shpat_...
`);
  process.exit(1);
}

const API_VERSION = '2024-10';
const endpoint = `https://${store}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(JSON.stringify(json.errors || json, null, 2));
  }
  return json.data;
}

async function listPages() {
  const data = await gql(`
    query {
      pages(first: 50) {
        nodes { id handle title templateSuffix }
      }
    }
  `);
  return data.pages.nodes;
}

async function createPage(page) {
  const data = await gql(
    `
    mutation PageCreate($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle templateSuffix }
        userErrors { field message }
      }
    }
  `,
    {
      page: {
        title: page.title,
        handle: page.handle,
        isPublished: page.published !== false,
        templateSuffix: page.template,
      },
    }
  );
  const errs = data.pageCreate.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  return data.pageCreate.page;
}

async function updatePage(id, page) {
  const data = await gql(
    `
    mutation PageUpdate($id: ID!, $page: PageUpdateInput!) {
      pageUpdate(id: $id, page: $page) {
        page { id handle templateSuffix }
        userErrors { field message }
      }
    }
  `,
    {
      id,
      page: {
        title: page.title,
        handle: page.handle,
        isPublished: page.published !== false,
        templateSuffix: page.template,
      },
    }
  );
  const errs = data.pageUpdate.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  return data.pageUpdate.page;
}

function readThemeStore() {
  const p = join(homedir(), 'AppData', 'Roaming', 'shopify-cli-theme-conf-nodejs', 'Config', 'config.json');
  if (!existsSync(p)) return null;
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    return cfg.themeStore || null;
  } catch {
    return null;
  }
}

function readCliToken(shopDomain) {
  const p = join(homedir(), 'AppData', 'Roaming', 'shopify-cli-kit-nodejs', 'Config', 'config.json');
  if (!existsSync(p)) return null;
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    const sessions = JSON.parse(cfg.sessionStore || '{}');
    const accounts = sessions['accounts.shopify.com'] || {};
    const shopSlug = shopDomain.replace('.myshopify.com', '');

    for (const account of Object.values(accounts)) {
      if (!account?.applications) continue;
      for (const [key, app] of Object.entries(account.applications)) {
        if (key.includes(shopSlug) && app?.accessToken) return app.accessToken;
      }
      if (account.identity?.accessToken) return account.identity.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Tienda: ${store}`);
  console.log(`Páginas en manifest: ${manifest.pages.length}\n`);

  const existing = await listPages();
  const byHandle = Object.fromEntries(existing.map((p) => [p.handle, p]));

  for (const spec of manifest.pages) {
    const found = byHandle[spec.handle];
    try {
      if (found) {
        const updated = await updatePage(found.id, spec);
        console.log(`✓ Actualizada: /pages/${updated.handle} → template: page.${updated.templateSuffix}`);
      } else {
        const created = await createPage(spec);
        console.log(`✓ Creada: /pages/${created.handle} → template: page.${created.templateSuffix}`);
      }
    } catch (err) {
      console.error(`✗ ${spec.handle}: ${err.message}`);
    }
  }

  console.log('\nListo. Revisa en Admin → Online Store → Pages.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
