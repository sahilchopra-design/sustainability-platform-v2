/**
 * Dump MODULE_GUIDES to JSON for the module-atlas builder.
 * Strips the webpack-only AUTO_GUIDES import so plain node can evaluate the file.
 * Usage: node scripts/dump-module-guides.js > docs/module_atlas/module_guides.json
 */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'frontend', 'src', 'data', 'moduleGuides.js');
let code = fs.readFileSync(SRC, 'utf8');

// Remove the webpack-only auto-registry import and any spread of it.
code = code.replace(/import\s+\{\s*AUTO_GUIDES\s*\}\s+from\s+['"][^'"]+['"];?/g, 'const AUTO_GUIDES = {};');
// ESM -> CJS
code = code.replace(/export\s+const\s+MODULE_GUIDES/, 'const MODULE_GUIDES');
code = code.replace(/export\s+default\s+MODULE_GUIDES;?/g, '');
code += '\nmodule.exports = { MODULE_GUIDES };\n';

const tmp = path.join(__dirname, '.moduleGuides.cjs');
fs.writeFileSync(tmp, code);
try {
  const { MODULE_GUIDES } = require(tmp);
  process.stdout.write(JSON.stringify(MODULE_GUIDES));
  console.error(`dumped ${Object.keys(MODULE_GUIDES).length} guide entries`);
} finally {
  fs.unlinkSync(tmp);
}
