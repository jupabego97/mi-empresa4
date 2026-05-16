import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'alpinejs', 'dist', 'cdn.min.js');
const destDir = join(root, 'theme', 'assets');
const dest = join(destDir, 'alpine.min.js');

if (!existsSync(src)) {
  console.warn('[copy-alpine] alpinejs not found — run npm install');
  process.exit(0);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log('[copy-alpine] copied alpine.min.js → theme/assets/');
