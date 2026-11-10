// Every library id named under a folder (file names and contents), by the repo's own scan (scan-touched.mjs idsIn), against the
// held-out books: already touched (phase4-orders.json, couples-orders.json), in D4's panel, or held out and untouched.
//   node id-audit.mjs <repo root> <folder>
import fs from 'node:fs'; import path from 'node:path';
const [root, dir] = process.argv.slice(2);
const { idsIn } = await import(root + '/research/solver/scan-touched.mjs');
const J = f => JSON.parse(fs.readFileSync(path.join(root, 'research/solver', f), 'utf8'));
const p4 = J('phase4-orders.json'), co = J('couples-orders.json'), panel = J('couples-panel.json');
const T = new Set([...p4.touched.ids, ...co.touched.ids]);
const d4 = new Set(JSON.stringify(panel.panel).match(/S\d{3}F?/g) || []);
const where = new Map();
const walk = d => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n), st = fs.statSync(p); if (st.isDirectory()) walk(p); else { const rel = path.relative(dir, p); for (const id of [...idsIn(rel), ...idsIn(fs.readFileSync(p, 'latin1'))]) { if (!where.has(id)) where.set(id, new Set()); where.get(id).add(rel); } } } };
walk(dir);
const ids = [...where.keys()].sort();
const cls = id => (d4.has(id) ? 'D4 PANEL' : T.has(id) ? 'touched' : 'HELD OUT, UNTOUCHED');
const by = {}; for (const id of ids) (by[cls(id)] = by[cls(id)] || []).push(id);
console.log(`${ids.length} ids named under ${dir}`);
for (const [k, v] of Object.entries(by)) console.log(`${k}: ${v.length}${k === 'touched' ? '' : ': ' + v.map(id => `${id} [${[...where.get(id)].slice(0, 3).join(', ')}]`).join('; ')}`);
