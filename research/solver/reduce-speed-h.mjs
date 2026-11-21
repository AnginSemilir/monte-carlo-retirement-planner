/*
 * THE SPEED MODE ON THE HOUSEHOLD PLAN, READ (SPEED-H.md, its rule committed before launch; EXPLORATORY, seed 7002). Reads
 * audit-speed-h.mjs's units once:
 *   - the gate: every unit in both arms; one code, audit, seed, count of paths and points; each arm's speed mode as named,
 *     its one table's shortlist with it; the household's table the same in both arms; each a household at 'pensionsPA' at
 *     the even split;
 *   - then item 7's rule as SPEED-B read it for a group (reduce-speed-b.mjs rule), and the figures beside it.
 *   node research/solver/reduce-speed-h.mjs [dir] [--smoke]      node research/solver/reduce-speed-h.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULE, armOf, rule } from './reduce-speed-b.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['WHOLE', 'SPEED'], FORM = 'pensionsPA';
const KEYS = ['survived', 'delivered', 'pot', 'tax'];

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
    if (U.kind !== 'household' || d.kind !== 'household') P.push(`${U.id}: not a household`);
    if (!(U.cap > 0)) P.push(`${U.id}: no cap recorded`);
    for (const a of ARMS) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of KEYS) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      const on = a === 'SPEED';
      if (x.speed !== on || x.shortlist.length !== 1 || x.shortlist[0] !== (on ? 'order' : null)) P.push(`${U.id} ${a}: the speed mode ${x.speed ? 'on' : 'off'}, the table's shortlist ${x.shortlist.join('/')}, not as named`);
      if (x.household !== FORM || x.split !== 'even') P.push(`${U.id} ${a}: the household at ${x.household}, ${x.split}, not ${FORM} at the even split`);
    }
    if (U.arms.WHOLE && U.arms.SPEED && JSON.stringify(U.arms.WHOLE.digests) !== JSON.stringify(U.arms.SPEED.digests)) P.push(`${U.id}: the household's table differs between the arms`);
  }
  return P;
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000;
  const arm = (lost, o = {}) => ({ speed: !!o.on, household: o.form || FORM, split: 'even', shortlist: [o.on ? 'order' : null], digests: o.digests || ['d'], ms: o.ms || 10, T: 30,
    survived: Uint8Array.from({ length: N }, (_, i) => (i % 2 === 1 && i < 2 * lost ? 0 : 1)), delivered: new Float64Array(N).fill(o.sp || 1e6), pot: new Float64Array(N).fill(o.pot || 1e6), tax: new Float64Array(N).fill(1e5) });
  const unit = (id, o = {}) => ({ id, kind: 'household', cohort: 'x', N, pts: 45, seed: 7002, cap: o.cap || 2e6, stamp: { code: 'c', audit: 'a' },
    arms: { WHOLE: arm(400, { ms: 20 }), SPEED: arm(o.lost === undefined ? 400 : o.lost, { on: true, digests: o.digests, ms: 10, sp: o.sp, pot: o.pot, form: o.form }) } });
  const design = Array.from({ length: 6 }, (_, k) => ({ id: `H${k}`, kind: 'household' }));
  const set = (f = () => ({})) => design.map((d, k) => unit(d.id, f(d, k)));
  check('a complete planted set passes the gate', gate(set(), design, 'a').length === 0);
  check('the speed mode the same as the whole menu on every path holds, at half the time', (() => { const r = rule(set()); return r.holds && r.time.every(t => t === 0.5); })());
  check('one household two points worse beyond noise fails part 2', (() => !rule(set((d, k) => (k === 0 ? { lost: 480 } : {}))).parts[1])());
  check('spending 0.1% lower fails part 3; a capped pot 0.2% lower fails part 4', (() => !rule(set(() => ({ sp: 0.999e6 }))).parts[2] && !rule(set(() => ({ pot: 0.998e6, cap: 1e6 }))).parts[3])());
  check('the gate refuses a table that differs between the arms, an arm with the speed mode as not named, a household at another form, and a missing unit', (() => {
    const s = set(); s[0] = unit('H0', { digests: ['e'] }); s[1].arms.SPEED.shortlist = [null]; s[2] = unit('H2', { form: 'pensions' }); const t = s.slice(0, 5);
    const P = gate(t, design, 'a');
    return P.some(x => /H0: the household's table differs/.test(x)) && P.some(x => /H1 SPEED: the speed mode/.test(x)) && P.some(x => /H2 SPEED: the household at pensions/.test(x)) && P.some(x => /units missing: H5/.test(x));
  })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'speed-h-7002');
  const { UNITS, stampFilesHash } = await import('./audit-speed-h.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const design = UNITS.filter(d => !smoke || units.some(u => u.id === d.id));
  const P = gate(units, design, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`SPEED-H GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = design.map(d => units.find(u => u.id === d.id)), u0 = ordered[0];
  const f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`, iv = c => `${f(c.d)} (${f(c.lo)} to ${f(c.hi)})`;
  console.log(`THE SPEED MODE ON THE HOUSEHOLD PLAN (EXPLORATORY; SPEED-H.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} couples as one household at ${FORM}, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points; the gate: fair (every unit in both arms; one code, audit, seed, count of paths and points; each arm's speed mode as named; the household's table the same in both arms; each at ${FORM}, the even split)`);
  const r = rule(ordered), say = k => (r.parts[k] ? 'HOLDS' : 'FAILS'), mid = r.time[Math.floor(r.time.length / 2)];
  console.log(`\nThe households (${ordered.length}), SPEED against WHOLE:`);
  console.log(`  1. pooled survival ${iv(r.pooled)} points; its lower end above ${RULE.pooled}: ${say(0)}`);
  console.log(`  2. no unit wholly below ${RULE.unit}: ${r.H.filter(h => h.ch.hi < RULE.unit).map(h => `${h.id} (${f(h.ch.lo)} to ${f(h.ch.hi)})`).join(', ') || 'none'}: ${say(1)}`);
  console.log(`  3. pooled spending delivered ${f(r.spend, 4)}%; within ${RULE.spend}% either way: ${say(2)}`);
  console.log(`  4. the mean pot left ${f(r.potP)}% pooled (not lower by more than ${-RULE.pot}%), the capped pot ${f(r.cappedP)}% (not lower by more than ${-RULE.capped}%): ${say(3)}`);
  console.log(`  a path's time SPEED over WHOLE, the median x${mid.toFixed(2)} (x${r.time[0].toFixed(2)} to x${r.time[r.time.length - 1].toFixed(2)})`);
  console.log(`  by unit: ${r.H.map(h => `${h.id} ${f(h.ch.d)} (${h.cells.saved} saved, ${h.cells.lost} lost), spending ${f(h.spend, 3)}%, pot ${f(h.pot, 2)}%, tax ${f(h.tax, 2)}%, x${h.time.toFixed(2)}`).join('; ')}`);
  console.log(`\nSPEED-H OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${r.holds ? 'HOLDS' : `LOSES (${r.parts.map((p, k) => (p ? null : k + 1)).filter(Boolean).join(', ')})`}`);
}
