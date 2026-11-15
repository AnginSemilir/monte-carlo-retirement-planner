/*
 * THE SPEED MODE ON MORE SINGLES AND COUPLES, READ (SPEED-B.md, its rule committed before launch; D97 (3); EXPLORATORY, seed
 * 7002). Reads audit-speed-b.mjs's units once: the gate (every unit in both arms; one code, audit, seed, count of paths and
 * points; each arm's speed mode as named; each person's table the same in both arms), then item 7's rule for singles and for
 * couples apart, and the figures beside it.
 *   node research/solver/reduce-speed-b.mjs [dir] [--smoke]      node research/solver/reduce-speed-b.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU, pooledSummed } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { pooled: -0.1, unit: -0.3, spend: 0.05, pot: -0.5, capped: -0.1 }, ARMS = ['WHOLE', 'SPEED'], GROUPS = ['single', 'couple'];
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, delivered: Float64Array, pot: Float64Array, tax: Float64Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const pct = (x, b) => 100 * (x / b - 1);

/* the gate over the units (each with its arms decoded), against the design [{ id, kind }]: every problem */
export function gate(units, design, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = design.filter(d => !units.some(u => u.id === d.id)).map(d => d.id);
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const d = design.find(x => x.id === U.id);
    if (!d) { P.push(`${U.id}: not in the design`); continue; }
    if (U.kind !== d.kind) P.push(`${U.id}: a ${U.kind}, not a ${d.kind}`);
    if (!(U.cap > 0)) P.push(`${U.id}: no cap recorded`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      const on = a === 'SPEED', want = U.kind === 'couple' ? 2 : 1;
      if (x.speed !== on || x.shortlist.length !== want || x.shortlist.some(s => s !== (on ? 'order' : null))) P.push(`${U.id} ${a}: the speed mode ${x.speed ? 'on' : 'off'}, the tables' shortlist ${x.shortlist.join('/')}, not as named`);
    }
    if (U.arms.WHOLE && U.arms.SPEED && JSON.stringify(U.arms.WHOLE.digests) !== JSON.stringify(U.arms.SPEED.digests)) P.push(`${U.id}: the tables differ between the arms`);
  }
  return P;
}
export function cells(A, B) {
  let a = 0, lost = 0, saved = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) lost++; else if (y) saved++; else d++; }
  return { a, lost, saved, d };
}
/* item 7's rule for one group of units */
export function rule(units) {
  const H = units.map(U => {
    const w = U.arms.WHOLE, s = U.arms.SPEED, c = cells(w, s), capped = X => mean(Array.from(X.pot, v => Math.min(v, U.cap)));
    return { id: U.id, cohort: U.cohort, cells: c, ch: survivalChangeU(c.a, c.lost, c.saved, c.d), pot: pct(mean(s.pot), mean(w.pot)), capped: pct(capped(s), capped(w)), tax: pct(mean(s.tax), mean(w.tax)), time: s.ms / w.ms, spend: pct(mean(s.delivered), mean(w.delivered)) };
  });
  const pooled = pooledSummed(H.map(h => h.cells)), spend = pct(sum(units.map(U => sum(U.arms.SPEED.delivered))), sum(units.map(U => sum(U.arms.WHOLE.delivered))));
  const potP = mean(H.map(h => h.pot)), cappedP = mean(H.map(h => h.capped));
  const parts = [pooled.lo > RULE.pooled, !H.some(h => h.ch.hi < RULE.unit), Math.abs(spend) <= RULE.spend, potP >= RULE.pot && cappedP >= RULE.capped];
  return { H, pooled, spend, potP, cappedP, parts, holds: parts.every(Boolean), time: H.map(h => h.time).sort((a, b) => a - b) };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000;
  const arm = (lost, o = {}) => ({ speed: !!o.on, shortlist: Array.from({ length: o.persons || 1 }, () => (o.on ? 'order' : null)), digests: o.digests || ['d'], ms: o.ms || 10, T: 30,
    survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), delivered: new Float64Array(N).fill(o.sp || 1e6), pot: new Float64Array(N).fill(o.pot || 1e6), tax: new Float64Array(N).fill(1e5) });
  const unit = (id, kind, o = {}) => { const persons = kind === 'couple' ? 2 : 1, dg = Array.from({ length: persons }, () => 'd'); return { id, kind, cohort: 'x', N, pts: 45, seed: 7002, cap: o.cap || 2e6, stamp: { code: 'c', audit: 'a' },
    arms: { WHOLE: arm(400, { persons, digests: dg, ms: 20 }), SPEED: arm(o.lost === undefined ? 400 : o.lost, { on: true, persons, digests: o.digests || dg, ms: 10, sp: o.sp, pot: o.pot }) } }; };
  const design = [...Array.from({ length: 6 }, (_, k) => ({ id: `S${k}`, kind: 'single' })), ...Array.from({ length: 4 }, (_, k) => ({ id: `C${k}`, kind: 'couple' }))];
  const set = (f = () => ({})) => design.map((d, k) => unit(d.id, d.kind, f(d, k)));
  const of = (s, kind) => s.filter(u => u.kind === kind);
  check('a complete planted set passes the gate', gate(set(), design, 'a').length === 0);
  check('the speed mode the same as the whole menu on every path holds for both groups, at half the time', (() => { const s = set(); const a = rule(of(s, 'single')), b = rule(of(s, 'couple')); return a.holds && b.holds && a.time.every(t => t === 0.5); })());
  check('one single two points worse beyond noise fails part 2 for singles and leaves couples holding', (() => { const s = set((d, k) => (k === 0 ? { lost: 480 } : {})); return !rule(of(s, 'single')).parts[1] && rule(of(s, 'couple')).holds; })());
  check('every couple 0.15 points worse (6 paths) fails part 1 for couples (summed over 16,000)', (() => { const s = set(d => (d.kind === 'couple' ? { lost: 406 } : {})); const r = rule(of(s, 'couple')); return !r.parts[0] && r.parts[1]; })());
  check('spending 0.1% lower fails part 3; a pot 1% lower fails part 4; a capped pot 0.2% lower fails part 4', (() => {
    const a = rule(of(set(() => ({ sp: 0.999e6 })), 'single')), b = rule(of(set(() => ({ pot: 0.99e6, cap: 5e6 })), 'single')), c = rule(of(set(() => ({ pot: 0.998e6, cap: 1e6 })), 'single'));
    return !a.parts[2] && !b.parts[3] && !c.parts[3] && c.potP > RULE.pot;
  })());
  check('the gate refuses tables that differ between the arms, an arm with the speed mode as not named, and a missing unit', (() => {
    const s = set(); s[0] = unit('S0', 'single', { digests: ['e'] }); s[1].arms.SPEED.shortlist = [null]; const t = s.slice(0, 9);
    const P = gate(t, design, 'a'); return P.some(x => /S0: the tables differ/.test(x)) && P.some(x => /S1 SPEED: the speed mode/.test(x)) && P.some(x => /units missing: C3/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'speed-b-7002');
  const { UNITS, stampFilesHash } = await import('./audit-speed-b.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const design = UNITS.filter(d => !smoke || units.some(u => u.id === d.id));
  const P = gate(units, design, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`SPEED-B GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = design.map(d => units.find(u => u.id === d.id)), u0 = ordered[0];
  const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
  console.log(`THE SPEED MODE ON MORE SINGLES AND COUPLES (EXPLORATORY; SPEED-B.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.filter(u => u.kind === 'single').length} singles and ${ordered.filter(u => u.kind === 'couple').length} couples, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair (every unit in both arms; one code, audit, seed, count of paths and points; each arm's speed mode as named; each person's table the same in both arms)`);
  const out = {};
  for (const g of GROUPS) {
    const us = ordered.filter(u => u.kind === g);
    if (!us.length) continue;
    const r = out[g] = rule(us), say = k => (r.parts[k] ? 'HOLDS' : 'FAILS'), mid = r.time[Math.floor(r.time.length / 2)];
    console.log(`\n${g === 'single' ? 'Singles' : 'Couples'} (${us.length}), SPEED against WHOLE:`);
    console.log(`  1. pooled survival ${iv(r.pooled)} points; its lower end above ${RULE.pooled}: ${say(0)}`);
    console.log(`  2. no unit wholly below ${RULE.unit}: ${r.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join(', ') || 'none'}: ${say(1)}`);
    console.log(`  3. pooled spending delivered ${f(r.spend, 4)}%; within ${RULE.spend}% either way: ${say(2)}`);
    console.log(`  4. the mean pot left ${f(r.potP)}% pooled (not lower by more than ${-RULE.pot}%), the capped pot ${f(r.cappedP)}% (not lower by more than ${-RULE.capped}%): ${say(3)}`);
    console.log(`  ${r.holds ? 'HOLDS' : `LOSES (${r.parts.map((p, k) => (p ? null : k + 1)).filter(Boolean).join(', ')})`}; a path's time SPEED over WHOLE, the median x${mid.toFixed(2)} (x${r.time[0].toFixed(2)} to x${r.time[r.time.length - 1].toFixed(2)})`);
    console.log(`  by unit: ${r.H.map(h => `${h.id} ${f(h.ch.d)} (${h.cells.saved} saved, ${h.cells.lost} lost), spending ${f(h.spend, 3)}%, pot ${f(h.pot, 2)}%, tax ${f(h.tax, 2)}%, x${h.time.toFixed(2)}`).join('; ')}`);
  }
  console.log(`\nSPEED-B OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${GROUPS.filter(g => out[g]).map(g => `${g === 'single' ? 'singles' : 'couples'} ${out[g].holds ? 'HOLDS' : 'LOSES'}`).join('; ')}`);
}
