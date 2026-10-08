// Detecta patrones que Shopify rechaza o reescribe al sincronizar con GitHub.
// Uso: node tools/lint-shopify.mjs   (sale con código 1 si hay errores)
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warnings = [];

const list = (dir, ext) =>
  existsSync(join(root, dir))
    ? readdirSync(join(root, dir)).filter((f) => f.endsWith(ext)).map((f) => join(root, dir, f))
    : [];
const liquidFiles = ['layout', 'sections', 'snippets', 'blocks', 'templates'].flatMap((d) => list(d, '.liquid'));
const lineOf = (src, index) => src.slice(0, index).split('\n').length;
const stripStrings = (s) => s.replace(/'[^']*'|"[^"]*"/g, "''");

function checkBlankDefaults(file, src, offset = 0) {
  for (const m of src.matchAll(/"default"\s*:\s*""/g)) {
    errors.push(`${relative(root, file)}:${lineOf(src, m.index) + offset}  "default": "" no está permitido por Shopify; quita la clave default.`);
  }
}

checkBlankDefaults(join(root, 'config/settings_schema.json'), readFileSync(join(root, 'config/settings_schema.json'), 'utf8'));

for (const file of liquidFiles) {
  const src = readFileSync(file, 'utf8').replace(/{%-?\s*comment\s*-?%}[\s\S]*?{%-?\s*endcomment\s*-?%}/g, (c) =>
    c.replace(/[^\n]/g, ' ')
  );
  const rel = relative(root, file);

  const schema = src.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  if (schema) checkBlankDefaults(file, schema[1], lineOf(src, schema.index) - 1);

  for (const m of src.matchAll(/{%-?\s*render\s+(['"][^'"]+['"])([\s\S]*?)-?%}/g)) {
    if (stripStrings(m[2]).includes('|')) {
      errors.push(`${rel}:${lineOf(src, m.index)}  filtro (|) dentro de los argumentos de render ${m[1]}; calcula el valor con assign antes.`);
    }
  }
  for (const block of src.matchAll(/{%-?\s*liquid([\s\S]*?)-?%}/g)) {
    for (const line of block[1].split('\n')) {
      const r = line.match(/^\s*render\s+(['"][^'"]+['"])(.*)$/);
      if (r && stripStrings(r[2]).includes('|')) {
        errors.push(`${rel}:${lineOf(src, block.index)}  filtro (|) dentro de render ${r[1]} en un bloque liquid; usa assign antes.`);
      }
    }
  }

  for (const m of src.matchAll(/{{([^}]*)}}/g)) {
    if (/'[^']*[{}][^']*'|"[^"]*[{}][^"]*"/.test(m[1])) {
      errors.push(`${rel}:${lineOf(src, m.index)}  llaves dentro de un string en {{ }}; Shopify no lo acepta, usa assign.`);
    }
  }
}

const cssPath = join(root, 'assets/theme.css');
if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf8');
  const js = existsSync(join(root, 'assets/theme.js')) ? readFileSync(join(root, 'assets/theme.js'), 'utf8') : '';
  const defined = new Set([...css.matchAll(/\.(nt-[a-zA-Z0-9_-]+)/g)].map((m) => m[1]));
  const used = new Map();
  for (const file of liquidFiles) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/class="([^"]*)"/g)) {
      for (const cls of m[1].replace(/{[{%][\s\S]*?[}%]}/g, ' ').split(/\s+/)) {
        if (/^nt-[a-z0-9_-]+$/.test(cls) && !cls.endsWith('-') && !used.has(cls)) used.set(cls, relative(root, file));
      }
    }
  }
  for (const [cls, file] of used) {
    if (!defined.has(cls) && !js.includes(cls)) warnings.push(`${file}  la clase .${cls} no tiene estilos en assets/theme.css`);
  }
}

for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${errors.length} errores, ${warnings.length} avisos`);
process.exit(errors.length ? 1 : 0);
