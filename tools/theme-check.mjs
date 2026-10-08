// Theme Check de Shopify. Sale con código 1 si hay errores (severity 0).
import { themeCheckRun } from '@shopify/theme-check-node';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = await themeCheckRun(root, undefined, () => {});
const offenses = Array.isArray(result) ? result : result.offenses || [];
const label = ['ERROR', 'WARN', 'INFO'];
const rel = (uri) => uri.replace(`file://${root}/`, '');

for (const o of offenses.filter((x) => x.severity <= 1)) {
  console.log(`${label[o.severity]} ${o.check} ${rel(o.uri)}:${(o.start?.line ?? 0) + 1}  ${o.message}`);
}
const errorCount = offenses.filter((x) => x.severity === 0).length;
console.log(`\n${errorCount} errores, ${offenses.filter((x) => x.severity === 1).length} avisos`);
process.exit(errorCount ? 1 : 0);
