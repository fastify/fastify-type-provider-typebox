// ------------------------------------------------------------------
// Post Build
//
// TypeScript emits .mjs files when compiling from .mts. This
// is true even if the module target is set to CommonJS. This
// code renames the compiler emitted files to use the correct
// file extension.
//
// Run via:
//
// $ npm run build:post
//
// ------------------------------------------------------------------

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const distCjs = path.join(__dirname, 'dist', 'cjs')
const distEsm = path.join(__dirname, 'dist', 'esm')

const rename = (oldPath, newPath) => {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath)
  }
}

if (!fs.existsSync(distCjs)) {
  fs.mkdirSync(distCjs, { recursive: true })
}
fs.writeFileSync(
  path.join(distCjs, 'package.json'),
  JSON.stringify({ type: 'commonjs' }, null, 2)
)

// --- ESM ---
rename(path.join(distEsm, 'index.js'), path.join(distEsm, 'index.mjs'))
rename(path.join(distEsm, 'index.d.ts'), path.join(distEsm, 'index.d.mts'))

// --- CJS ---
rename(path.join(distCjs, 'index.cjs'), path.join(distCjs, 'index.js'))
rename(path.join(distCjs, 'index.d.cts'), path.join(distCjs, 'index.d.ts'))
