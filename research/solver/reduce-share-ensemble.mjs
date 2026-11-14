/*
 * THE SHARE ENSEMBLE, READ (SHARE-ENSEMBLE.md, its rule committed before launch; the deep review of item 6's stage C, 14 Nov;
 * EXPLORATORY, seed 7002). Reads audit-share-ensemble.mjs's units once: the gate (every unit in every arm; one code, audit,
 * seed, count of paths and points; the couples' candidate stage C ran; each arm's share the one SHARE-ENSEMBLE.md names, the
 * first the pots'), then the rule and the figures beside it.
 *   node research/solver/reduce-share-ensemble.mjs [dir] [--smoke]      node research/solver/reduce-share-ensemble.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalChangeU } from './stats.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
export const RULE = { unit: 0.5, pooled: 0.2 }, CANDIDATE = 'af001697ce1b';
export const GROUP_A = ['S211-db', 'S291-db', 'S211-75pdb'], GROUP_B = ['S129-90', 'S019-90'];
const dec = (s, T) => { const b = Buffer.from(s, 'base64'), c = new Uint8Array(b.length); c.set(b); return new T(c.buffer, 0, b.length / T.BYTES_PER_ELEMENT); };
const KEYS = { survived: Uint8Array, failYear: Int16Array, pot: Float64Array, estate: Float64Array, tax: Float64Array, delivered: Float64Array, minPot: Uint8Array };
export const armOf = x => ({ ...x, ...Object.fromEntries(Object.entries(KEYS).map(([k, T]) => [k, dec(x[k], T)])) });
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : NaN; };
const armName = x => `s${x}`;

/* the gate over the units (each with its arms decoded), against the design (audit-share-ensemble.mjs UNITS): every problem */
export function gate(units, design, audit, size = { N: 4000, pts: 45, seed: 7002 }) {
  const P = [], missing = design.filter(d => !units.some(u => u.id === d.id)).map(d => d.id);
  if (missing.length) P.push(`units missing: ${missing.join(', ')}`);
  const one = (what, f) => { const vs = [...new Set(units.map(f))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', u => u.stamp.code); one('audit', u => u.stamp.audit); one('seed', u => u.seed); one('count of paths', u => u.N); one('points', u => u.pts);
  if (audit && units.some(u => u.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  if (units.some(u => u.candidate !== CANDIDATE)) P.push(`a unit's candidate is not the couples' candidate stage C ran (${CANDIDATE}): ${[...new Set(units.map(u => u.candidate))].join(', ')}`);
  if (size && units.some(u => u.N !== size.N || u.pts !== size.pts || u.seed !== size.seed)) P.push(`a unit is not ${size.N} paths of seed ${size.seed} at ${size.pts} points`);
  for (const U of units) {
    const d = design.find(x => x.id === U.id);
    if (!d) { P.push(`${U.id}: not in the design`); continue; }
    if (JSON.stringify(U.shares) !== JSON.stringify(d.shares)) P.push(`${U.id}: shares ${U.shares.join(', ')}, not the design's ${d.shares.join(', ')}`);
    if (Math.abs(U.rule - d.shares[0]) > 1e-12) P.push(`${U.id}: the pots' share ${U.rule}, not the first share ${d.shares[0]}`);
    for (const a of ['APP', ...d.shares.map(armName)]) {
      const x = U.arms[a];
      if (!x) { P.push(`${U.id}: no ${a} arm`); continue; }
      for (const k of Object.keys(KEYS)) if (x[k].length !== U.N) P.push(`${U.id} ${a}: ${k} not one a path`);
      if (a === 'APP' && !/^armA /.test(x.ran || '')) P.push(`${U.id} APP: not arm A's pick (${x.ran})`);
      if (a !== 'APP' && Math.abs(x.share - Number(a.slice(1))) > 1e-12) P.push(`${U.id} ${a}: solved on the share ${x.share}`);
    }
  }
  return P;
}
/* the paired change in survival, B less A, in points with its 95% interval (stats.mjs survivalChangeU) */
export function change(A, B) {
  let a = 0, b = 0, c = 0, d = 0;
  for (let i = 0; i < A.survived.length; i++) { const x = A.survived[i], y = B.survived[i]; if (x && y) a++; else if (x) b++; else if (y) c++; else d++; }
  return survivalChangeU(a, b, c, d);
}
const beats = ch => ch.d > RULE.unit && ch.lo > 0;
/* the rule over the units */
export function rule(units) {
  const H = units.map(U => {
    const ruleArm = U.arms[armName(U.shares[0])], sv = x => 100 * mean(x.survived);
    const at = U.shares.map(x => { const A = U.arms[armName(x)]; return { share: x, surv: sv(A), ch: x === U.shares[0] ? null : change(ruleArm, A), minPot: A.minPot.reduce((s, v) => s + v, 0), tax: mean(A.tax), pot: mean(A.pot), delivered: mean(A.delivered) }; });
    let best = at[0]; for (const s of at) if (s.surv > best.surv + 1e-12) best = s;
    const app = U.arms.APP;
    return { id: U.id, group: U.group, rule: U.shares[0], at, best, gain: best.surv - at[0].surv, beat: at.some(s => s.ch && beats(s.ch)),
      app: { surv: sv(app), minPot: app.minPot.reduce((s, v) => s + v, 0), tax: mean(app.tax), pot: mean(app.pot), delivered: mean(app.delivered) } };
  });
  const withOthers = H.filter(h => h.at.length > 1), pooled = mean(withOthers.map(h => h.gain));
  const a = H.filter(h => GROUP_A.includes(h.id) && h.beat).length >= 2, b = H.some(h => GROUP_B.includes(h.id) && h.beat), c = pooled > RULE.pooled;
  const within = H.every(h => h.gain < RULE.unit) && pooled < RULE.pooled;
  const verdict = a && b && c ? "THE SHARE'S MEASURE" : within ? 'NOT THE SHARE' : `MIXED (${[['a', a], ['b', b], ['c', c]].map(([k, v]) => `(${k}) ${v ? 'held' : 'did not hold'}`).join(', ')})`;
  // beside: the holding's own effect at one share, S129-90 at 0.75 against S129-75 at 0.75, paired by path
  const u90 = units.find(u => u.id === 'S129-90'), u75 = units.find(u => u.id === 'S129-75'), k = armName(0.75);
  const hold = u90 && u75 && u90.arms[k] && u75.arms[k] && u90.N === u75.N ? { ch: change(u75.arms[k], u90.arms[k]), minPot90: u90.arms[k].minPot.reduce((s, v) => s + v, 0), minPot75: u75.arms[k].minPot.reduce((s, v) => s + v, 0) } : null;
  return { H, pooled, parts: { a, b, c }, within, verdict, hold };
}

function planted() {
  let bad = 0;
  const check = (label, c) => { console.log(`  ${c ? 'ok  ' : 'FAIL'} ${label}`); if (!c) bad++; };
  const N = 4000;
  const arm = (lost, extra = {}) => ({ ran: 'x', share: null, survived: Uint8Array.from({ length: N }, (_, i) => (i < lost ? 0 : 1)), failYear: new Int16Array(N).fill(-1), pot: new Float64Array(N).fill(1), estate: new Float64Array(N).fill(1), tax: new Float64Array(N).fill(1), delivered: new Float64Array(N).fill(1), minPot: new Uint8Array(N), ...extra });
  // a unit: its pots' share losing `lost` paths, each other share losing `alt` (a list, in the design's order)
  const unit = (id, shares, lost, alt = [], o = {}) => ({ id, group: 'g', shares, rule: shares[0], N, pts: 45, seed: 7002, candidate: o.candidate || CANDIDATE, stamp: { code: 'c', audit: 'a' },
    arms: { APP: arm(600, { ran: 'armA X' }), ...Object.fromEntries(shares.map((x, i) => [armName(x), arm(i === 0 ? lost : alt[i - 1], { share: x })])) } });
  const design = [{ id: 'S211-db', shares: [0.5, 0.6, 0.7] }, { id: 'S291-db', shares: [0.5, 0.6, 0.7] }, { id: 'S211-75pdb', shares: [0.75, 0.65, 0.55] }, { id: 'S129-90', shares: [0.9, 0.8, 0.75] }, { id: 'S019-90', shares: [0.9, 0.8, 0.75] }, { id: 'S129-75', shares: [0.75] }];
  // the pots' share loses 400 paths (10 points) on each; another share 300 (2.5 points better) where `gain`, else 400
  const set = (gainIds, extra = 0) => design.map(d => unit(d.id, d.shares, 400, d.shares.slice(1).map(() => (gainIds.includes(d.id) ? 300 - extra : 400))));
  const V = s => rule(s).verdict;
  check('a complete planted set passes the gate', gate(set([]), design, 'a').length === 0);
  check(`the pots' share as good as any other everywhere reads NOT THE SHARE (${V(set([]))})`, V(set([])) === 'NOT THE SHARE');
  check(`another share 2.5 points better on S211-db, S291-db and S129-90 reads THE SHARE'S MEASURE (${V(set(['S211-db', 'S291-db', 'S129-90']))})`, V(set(['S211-db', 'S291-db', 'S129-90'])) === "THE SHARE'S MEASURE");
  check(`better on S211-db alone reads MIXED, (a) not holding (${V(set(['S211-db']))})`, /^MIXED/.test(V(set(['S211-db']))) && /\(a\) did not hold/.test(V(set(['S211-db']))));
  check(`better on S211-db and S291-db but neither S129-90 nor S019-90 reads MIXED, (b) not holding (${V(set(['S211-db', 'S291-db']))})`, /\(b\) did not hold/.test(V(set(['S211-db', 'S291-db']))));
  // the bar: 0.5 points is 20 paths of 4,000; 19 better is not beyond it
  check('a share 0.475 points better (19 paths of 4,000) does not beat the pots\' share; 0.525 (21 paths) does', (() => {
    const at = paths => rule(design.map(d => unit(d.id, d.shares, 400, d.shares.slice(1).map(() => (d.id === 'S211-db' ? 400 - paths : 400))))).H[0];
    return at(19).beat === false && at(21).beat === true;
  })());
  check('the gate refuses a missing unit, another audit and a unit on another candidate', (() => { const s = set([]).slice(1); s[0] = { ...s[0], candidate: '17ff82379838' }; const P = gate(s, design, 'b'); return P.some(x => /units missing: S211-db/.test(x)) && P.some(x => /audit is not these files/.test(x)) && P.some(x => /candidate is not/.test(x)); })());
  check('the gate refuses an arm solved on another share, a first share that is not the pots\' and a missing arm', (() => { const t = set([]); t[0].arms['s0.6'].share = 0.65; t[1].rule = 0.55; delete t[2].arms['s0.65']; const P = gate(t, design, 'a'); return P.some(x => /S211-db s0\.6: solved on the share 0\.65/.test(x)) && P.some(x => /S291-db: the pots' share 0\.55/.test(x)) && P.some(x => /S211-75pdb: no s0\.65 arm/.test(x)); })());
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), smoke = args.includes('--smoke');
  const DIR = args[0] && !args[0].startsWith('--') ? args[0] : join(HERE, 'results', 'share-ensemble-7002');
  const { UNITS, stampFilesHash } = await import('./audit-share-ensemble.mjs');
  if (!smoke) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, 'none', { blob: () => '-' });
  }
  const raw = readdirSync(DIR).filter(x => /\.json\.gz$/.test(x)).map(x => JSON.parse(gunzipSync(readFileSync(join(DIR, x))).toString()));
  const units = raw.map(U => ({ ...U, arms: Object.fromEntries(Object.entries(U.arms).map(([a, x]) => [a, armOf(x)])) }));
  const design = smoke ? UNITS.filter(d => units.some(u => u.id === d.id)) : UNITS;
  const P = gate(units, design, smoke ? null : stampFilesHash(), smoke ? null : undefined);
  if (P.length) { console.log(`SHARE ENSEMBLE GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const ordered = design.map(d => units.find(u => u.id === d.id)), u0 = ordered[0], R = rule(ordered);
  const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`, f = (v, d = 3) => `${v >= 0 ? '+' : ''}${v.toFixed(d)}`;
  console.log(`THE SHARE ENSEMBLE (EXPLORATORY; SHARE-ENSEMBLE.md)${smoke ? ' SMOKE, NOT THE RUN' : ''}: ${ordered.length} units of stage C's panel, code ${u0.stamp.code}, audit ${u0.stamp.audit}, seed ${u0.seed}, ${u0.N} paths, ${u0.pts} points, estate weight ${u0.W}, the couples' candidate ${u0.candidate}; the gate: fair (every unit in every arm; one code, audit, seed, count of paths and points; each arm on its share, the first the pots')`);
  console.log(`\nBy unit (survival at each share, the pots' first; each other share less the pots', paired, with its 95% interval; the best share; APP's survival beside):`);
  for (const h of R.H) console.log(`  ${h.id.padEnd(11)} ${h.group.padEnd(9)} ${h.at.map(s => `${s.share}: ${s.surv.toFixed(2)}%${s.ch ? ` (${f(s.ch.d)}, ${f(s.ch.lo)} to ${f(s.ch.hi)})` : ''}`).join('; ')} | best ${h.best.share}, ${f(h.gain)} over the pots'${h.beat ? ', BEATS IT' : ''} | APP ${h.app.surv.toFixed(2)}%`);
  console.log(`\nThe rule (another share beats the pots' where it is more than ${RULE.unit} points better and its interval lies above 0):`);
  console.log(`  (a) on at least two of ${GROUP_A.join(', ')}: ${R.H.filter(h => GROUP_A.includes(h.id) && h.beat).map(h => h.id).join(', ') || 'none'}: ${R.parts.a ? 'HOLDS' : 'does not hold'}`);
  console.log(`  (b) on ${GROUP_B.join(' or ')}: ${R.H.filter(h => GROUP_B.includes(h.id) && h.beat).map(h => h.id).join(', ') || 'neither'}: ${R.parts.b ? 'HOLDS' : 'does not hold'}`);
  console.log(`  (c) the best share's mean gain over the pots', pooled over the ${R.H.filter(h => h.at.length > 1).length} units with other shares: ${f(R.pooled)} points (more than ${RULE.pooled}): ${R.parts.c ? 'HOLDS' : 'does not hold'}`);
  console.log(`  not the share: the best within ${RULE.unit} points of the pots' on every unit and within ${RULE.pooled} pooled: ${R.within ? 'yes' : 'no'}`);
  console.log(`\nBeside the rule, deciding nothing:`);
  if (R.hold) console.log(`  the holding's own effect at one share, S129-90 at 0.75 less S129-75 at 0.75, paired: ${f(R.hold.ch.d)} points (${f(R.hold.ch.lo)} to ${f(R.hold.ch.hi)}); failing in the last year below the minimum pot ${R.hold.minPot90} and ${R.hold.minPot75} of ${u0.N}`);
  for (const h of R.H) console.log(`  ${h.id.padEnd(11)} failing in the last year below the minimum pot: APP ${h.app.minPot}, ${h.at.map(s => `${s.share} ${s.minPot}`).join(', ')}; mean lifetime tax APP ${gbp(h.app.tax)}, ${h.at.map(s => `${s.share} ${gbp(s.tax)}`).join(', ')}; mean pot left APP ${gbp(h.app.pot)}, ${h.at.map(s => `${s.share} ${gbp(s.pot)}`).join(', ')}; mean spending delivered APP ${gbp(h.app.delivered)}, ${h.at.map(s => `${s.share} ${gbp(s.delivered)}`).join(', ')}`);
  console.log(`\nSHARE ENSEMBLE OUTCOME${smoke ? ' (SMOKE: NOT AN OUTCOME)' : ''}: ${R.verdict}`);
}
