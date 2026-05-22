#!/usr/bin/env node
/**
 * Crea o actualiza páginas y asigna templateSuffix según config/pages-manifest.json
 *
 * Requisito: Shopify CLI 4+ y sesión de tienda:
 *   shopify store auth --store TU-TIENDA.myshopify.com --scopes write_content,read_content
 *
 * Uso:
 *   npm run pages:assign
 *   npm run pages:assign -- --store=tu-tienda.myshopify.com
 */

import { readFileSync, writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { execSync } from 'child_process';
import { homedir, tmpdir } from 'os';
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

function readThemeStore() {
  const p = join(homedir(), 'AppData', 'Roaming', 'shopify-cli-theme-conf-nodejs', 'Config', 'config.json');
  try {
    const cfg = JSON.parse(readFileSync(p, 'utf8'));
    return cfg.themeStore || null;
  } catch {
    return null;
  }
}

function storeExecute(query, variables = {}, { allowMutations = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'nt-pages-'));
  const queryFile = join(dir, 'query.graphql');
  const varFile = join(dir, 'vars.json');
  writeFileSync(queryFile, query, 'utf8');
  if (variables && Object.keys(variables).length > 0) {
    writeFileSync(varFile, JSON.stringify(variables), 'utf8');
  }

  const parts = [
    'shopify',
    'store',
    'execute',
    '--store',
    store,
    '--json',
    '--query-file',
    queryFile,
  ];
  if (variables && Object.keys(variables).length > 0) {
    parts.push('--variable-file', varFile);
  }
  if (allowMutations) {
    parts.push('--allow-mutations');
  }

  try {
    const raw = execSync(parts.join(' '), {
      encoding: 'utf8',
      cwd: root,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const cleaned = raw.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').trim();
    const jsonStart = cleaned.indexOf('{');
    const jsonStr = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
    return JSON.parse(jsonStr);
  } finally {
    try {
      unlinkSync(queryFile);
    } catch {}
    try {
      unlinkSync(varFile);
    } catch {}
  }
}

function ensureStoreAuth() {
  try {
    storeExecute(`{ shop { name } }`);
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.message || '';
    if (msg.includes('store auth') || msg.includes('authentication')) {
      console.error(`
No hay sesión de tienda. Ejecuta primero:

  shopify store auth --store ${store} --scopes write_content,read_content

Luego: npm run pages:assign
`);
      process.exit(1);
    }
    throw err;
  }
}

async function listPages() {
  const data = storeExecute(`
    query ListPages {
      pages(first: 50) {
        nodes { id handle title templateSuffix }
      }
    }
  `);
  return data.pages.nodes;
}

function createPage(spec) {
  const data = storeExecute(
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
        title: spec.title,
        handle: spec.handle,
        isPublished: spec.published !== false,
        templateSuffix: spec.template,
      },
    },
    { allowMutations: true }
  );
  const errs = data.pageCreate?.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  return data.pageCreate.page;
}

function updatePage(id, spec) {
  const data = storeExecute(
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
        title: spec.title,
        handle: spec.handle,
        isPublished: spec.published !== false,
        templateSuffix: spec.template,
      },
    },
    { allowMutations: true }
  );
  const errs = data.pageUpdate?.userErrors;
  if (errs?.length) throw new Error(errs.map((e) => e.message).join('; '));
  return data.pageUpdate.page;
}

async function main() {
  console.log(`Tienda: ${store}`);
  ensureStoreAuth();
  console.log(`Páginas en manifest: ${manifest.pages.length}\n`);

  const existing = await listPages();
  const byHandle = Object.fromEntries(existing.map((p) => [p.handle, p]));

  for (const spec of manifest.pages) {
    const found = byHandle[spec.handle];
    try {
      if (found) {
        const updated = updatePage(found.id, spec);
        console.log(`✓ Actualizada: /pages/${updated.handle} → page.${updated.templateSuffix}`);
      } else {
        const created = createPage(spec);
        console.log(`✓ Creada: /pages/${created.handle} → page.${created.templateSuffix}`);
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
