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

const fs = require('node:fs')
const path = require('node:path')

const distCjs = path.join(__dirname, 'dist', 'cjs')
const distEsm = path.join(__dirname, 'dist', 'esm')

const rename = (oldPath, newPath) => {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath)
  }
}

// --- ESM ---
rename(path.join(distEsm, 'index.js'), path.join(distEsm, 'index.mjs'))
rename(path.join(distEsm, 'index.d.ts'), path.join(distEsm, 'index.d.mts'))

// --- CJS ---
rename(path.join(distCjs, 'index.mjs'), path.join(distCjs, 'index.js'))
rename(path.join(distCjs, 'index.d.mts'), path.join(distCjs, 'index.d.ts'))
