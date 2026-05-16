import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = join(root, 'src', 'icons');
const outDir = join(root, 'assets');
const outFile = join(outDir, 'icons.svg');

const files = readdirSync(iconsDir).filter((f) => f.endsWith('.svg'));

let symbols = '';
for (const file of files) {
  const name = file.replace('.svg', '');
  const raw = readFileSync(join(iconsDir, file), 'utf8');
  const inner = raw
    .replace(/<\?xml[^>]*\?>/gi, '')
    .replace(/<svg[^>]*>/i, '')
    .replace(/<\/svg>/i, '')
    .trim();
  symbols += `  <symbol id="icon-${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>\n`;
}

const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols}</svg>\n`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, sprite, 'utf8');
console.log(`[build-icons] ${files.length} icons → assets/icons.svg`);
