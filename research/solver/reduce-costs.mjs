/*
 * L5'S READ (the launch plan's step L5; EXPLORATORY, seed 7002): audit-costs.mjs's 32 cells (eight households, a cost of 10%
 * or 30% of the opening wealth in the third or tenth retired year), the candidate against the app's rules on the same paths,
 * read once by D52's R3: if any cell loses survival beyond noise (an exact paired test on the paths whose survival differs,
 * one-sided, Holm across the 32 cells, at 5%), M12's remedy is built (a separate cost order on the menu, in the cost year
 * only) and L5 runs again on it; it ships if it clears every cell, else a plan with a one-off cost keeps the app's rules under
 * the switch, with a line. Reported beside it, per cell: the survival change (CANDD less APP, its saved and lost paths) and
 * the cost year's tax, paired. The gate runs first: every cell in, one code, one audit, one seed, one number of paths, the
 * two arms of a cell on the same inputs, the candidate's menu with the floor's 0.8.
 *   node research/solver/reduce-costs.mjs [folder]        (results/costs-7002 unless given)
 *   node research/solver/reduce-costs.mjs --planted       the rule on synthetic cells
 */
import { readdirSync, readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tail, holm } from './reduce-levers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), Z = 1.959964, ALPHA = 0.05, NCELLS = 32;
const TYPES = { survived: Uint8Array, delivered: Float32Array, taxAt: Float32Array, unmet: Float32Array };
const decodeArm = a => ({ ...a, main: Object.fromEntries(Object.entries(a.main).map(([k, v]) => { const b = Buffer.from(v, 'base64'); return [k, new TYPES[k](b.buffer, b.byteOffset, b.byteLength / TYPES[k].BYTES_PER_ELEMENT)]; })) });

/* one cell: the survival change, its discordant paths and one-sided p for a loss, and the cost year's tax paired */
export function cellRead(u) {
  const A = u.arms.APP.main, C = u.arms.CANDD.main, n = A.survived.length;
  let saved = 0, lost = 0, s1 = 0, s2 = 0;
  for (let k = 0; k < n; k++) { if (C.survived[k] && !A.survived[k]) saved++; if (!C.survived[k] && A.survived[k]) lost++; const d = C.taxAt[k] - A.taxAt[k]; s1 += d; s2 += d * d; }
  const md = s1 / n, se = Math.sqrt(Math.max(0, s2 / n - md * md) / n);
  return { id: u.id, cell: u.cell, saved, lost, change: 100 * (saved - lost) / n, pLoss: tail(lost, saved + lost), tax: { est: md, lo: md - Z * se, hi: md + Z * se } };
}
export function rule(cells) {
  const adj = holm(cells.map(c => c.pLoss));
  cells.forEach((c, i) => { c.adj = adj[i]; c.loses = adj[i] < ALPHA; });
  return cells.some(c => c.loses) ? 'REMEDY' : 'CLEAR';
}
export function gate(units, filesAudit) {
  const P = [];
  if (units.length !== NCELLS) P.push(`${units.length} cells, not ${NCELLS}`);
  const one = (k, f) => { const s = new Set(units.map(f)); if (s.size !== 1) P.push(`${k}: ${[...s].join(', ')} (one wanted)`); return [...s][0]; };
  one('code', u => u.stamp.code); const audit = one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('paths', u => u.N);
  if (filesAudit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  for (const u of units) {
    if (u.arms.APP.inputs !== u.arms.CANDD.inputs) P.push(`${u.id} ${u.cell}: the two arms on different inputs`);
    if (!(u.ran.levels || []).some(l => Math.abs(l - 0.8) < 1e-6)) P.push(`${u.id} ${u.cell}: no floor at 0.8 on the candidate's menu`);
  }
  one('what the candidate ran', u => JSON.stringify([u.ran.pts, u.ran.lambda, u.ran.bequestWeight]));
  return P;
}
const sg = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;

function planted() {
  const mk = (saved, lost, n = 3000) => { const A = new Uint8Array(n), C = new Uint8Array(n); for (let k = 0; k < n; k++) { A[k] = C[k] = 1; } for (let k = 0; k < saved; k++) A[k] = 0; for (let k = 0; k < lost; k++) C[n - 1 - k] = 0; const z = new Float32Array(n); return { id: 'H', cell: 'c', arms: { APP: { main: { survived: A, taxAt: z } }, CANDD: { main: { survived: C, taxAt: z } } } }; };
  const cases = [
    ['every cell even: clear', Array.from({ length: 32 }, () => mk(5, 5)), 'CLEAR'],
    ['one cell losing 30 paths net (35 lost, 5 saved): the remedy', [...Array.from({ length: 31 }, () => mk(5, 5)), mk(5, 35)], 'REMEDY'],
    ['one cell losing a few paths (8 lost, 2 saved), within noise across 32: clear', [...Array.from({ length: 31 }, () => mk(5, 5)), mk(2, 8)], 'CLEAR'],
    ['every cell gaining: clear', Array.from({ length: 32 }, () => mk(20, 0)), 'CLEAR'],
    ['no discordant path at all: clear', Array.from({ length: 32 }, () => mk(0, 0)), 'CLEAR']
  ];
  let bad = 0;
  for (const [name, us, want] of cases) { const got = rule(us.map(cellRead)); if (got !== want) bad++; console.log(`${got === want ? 'ok  ' : 'FAIL'} ${name}: ${got}`); }
  console.log('EDGES: a cell with no discordant path, a loss inside the noise of 32 cells, a loss beyond it, every cell gaining');
  console.log(bad ? `reduce-costs --planted: ${bad} FAILED` : 'reduce-costs --planted: the rule reads as planted');
  process.exit(bad ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) planted();
  const DIR = process.argv[2] || join(HERE, 'results', 'costs-7002');
  // the stamps first (CHECKLIST 3; fair-gate.mjs requireFairLogs): every log stamped, one code and one audit across them,
  // launched through run-from-snapshot.sh as EXPLORATORY (PREDICTION="none:..."); then the reducer's own gate
  const { requireFairLogs } = await import('./fair-gate.mjs');
  requireFairLogs(Object.fromEntries(readdirSync(DIR).filter(f => /^case\d+\.txt$/.test(f)).map(f => [f, readFileSync(join(DIR, f), 'utf8')])), 'none', { blob: () => '-' });
  const units = readdirSync(DIR).filter(f => f.endsWith('.json.gz')).map(f => { const u = JSON.parse(gunzipSync(readFileSync(join(DIR, f))).toString()); return { ...u, arms: { APP: decodeArm(u.arms.APP), CANDD: decodeArm(u.arms.CANDD) } }; });
  const { stampFilesHash } = await import('./audit-costs.mjs');
  const P = gate(units, stampFilesHash()), u0 = units[0] || {};
  console.log(`L5, ONE-OFF COSTS ON SINGLES (EXPLORATORY; read by D52's R3): ${units.length} cells; seed ${u0.seed}, ${u0.N} paths, code ${u0.stamp && u0.stamp.code}, audit ${u0.stamp && u0.stamp.audit}`);
  if (P.length) { console.log(`THE GATE REFUSES:\n${P.map(p => `  - ${p}`).join('\n')}`); process.exit(1); }
  console.log('The gate: fair.');
  const cells = units.map(cellRead).sort((a, b) => (a.id + a.cell < b.id + b.cell ? -1 : 1)), out = rule(cells);
  for (const c of cells) console.log(`  ${c.id} ${c.cell}: survival CANDD less APP ${sg(c.change)} points (${c.saved} saved, ${c.lost} lost; one-sided p ${c.pLoss.toExponential(2)}, Holm ${c.adj.toExponential(2)}${c.loses ? ', LOSES BEYOND NOISE' : ''}); the cost year's tax ${sg(c.tax.est, 0)} (${sg(c.tax.lo, 0)} to ${sg(c.tax.hi, 0)}) £ a path`);
  console.log(out === 'REMEDY' ? `R3: ${cells.filter(c => c.loses).length} cell(s) lose survival beyond noise: M12's remedy is built (a separate cost order in the cost year) and L5 runs again on it.` : 'R3: NO CELL LOSES SURVIVAL BEYOND NOISE: plans with a one-off cost run the candidate under the switch.');
}
