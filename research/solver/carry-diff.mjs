/*
 * CARRY-DIFF: WHAT DIFFERS BETWEEN A CITED RECORD'S RUN AND THE RUN A NEW TEST WILL MAKE (retirement pass 4,
 * deep-review-log.md 8 Oct 09:15 UK, AUTOMATE (2): every figure slip in its window was a figure carried across a setting
 * that changed; RULES.md section 9 rule 5, the carrying rule). For a derivation that carries another test's results, it
 * prints every setting where the cited run's logs differ from the new test's logs (a preflight's, or the run's own),
 * household by household and arm by arm: the ran line's fields (the estate weight, the tiers, the candidate's options,
 * the grid, the paths, the seed), the joint line's (one move for every world, the margin, the scale and cap, the death
 * tax, the plan tier), the code and audit stamps, and the households in one panel only. A field printed on one side
 * only is named as such: the run without it is not shown to have run it either way (7aj's and 7aw's ran lines carry no
 * e3pcls). Each difference is then named in the derivation under the carrying rule; this script decides nothing.
 * A diff over nothing (no unit on either side, or no household shared) is an error, not a pass (RULES.md rule 6).
 *   node research/solver/carry-diff.mjs <from-dir> <to-dir> [field=value ...]   only the to-side's units whose ran or
 *                                                                               joint line has field=value
 *   node research/solver/carry-diff.mjs --planted
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const UNIT = /^(\S.*?)\s+case \| unit (\S+)/, RAN = /^\s+ran (\S+?): (.*)$/, JOINT = /^\s+joint (\S+?): (\S+) (.*)$/, STAMP = /^stamp: code (\S+) audit (\S+)/;
const pairs = s => { const t = s.trim().split(/\s+/), o = {}; for (let i = 0; i + 1 < t.length; i += 2) o[t[i]] = t[i + 1]; return o; };

/* the units of one folder of case logs (or of one text): household, arm (the label's first part), and its fields */
export function unitsOf(texts) {
  const units = [], stamps = new Set();
  for (const text of texts) {
    let cur = null;
    for (const L of text.split('\n')) {
      let m = STAMP.exec(L); if (m) { stamps.add(`code ${m[1]} audit ${m[2]}`); continue; }
      m = UNIT.exec(L); if (m) { cur = { id: m[1].trim(), label: m[2], arm: m[2].split('/')[0], f: {} }; units.push(cur); continue; }
      if (!cur) continue;
      m = RAN.exec(L); if (m && m[1] === cur.label) { Object.assign(cur.f, pairs(m[2])); continue; }
      m = JOINT.exec(L); if (m && m[1] === cur.label) { const j = pairs(m[3]); cur.f.jointWorlds = m[2]; for (const [k, v] of Object.entries(j)) cur.f[k === 'switchMargin' ? 'jointMargin' : k] = v; }
    }
  }
  return { units, stamps: [...stamps] };
}
const textsOf = dir => (existsSync(dir) ? readdirSync(dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => readFileSync(join(dir, f), 'utf8')) : []);

/* the diff: from (the cited record) against to (the new test), matched by household and arm */
export function carryDiff(from, to, filter = {}) {
  const T = to.units.filter(u => Object.entries(filter).every(([k, v]) => u.f[k] === v));
  const idsF = new Set(from.units.map(u => u.id)), idsT = new Set(T.map(u => u.id));
  const shared = [...idsT].filter(id => idsF.has(id));
  // an empty side shares no household, so this one check covers both
  if (!shared.length) throw new Error(`carry-diff over nothing: no household in both panels (${from.units.length} units cited, ${T.length} new${Object.keys(filter).length ? ` under the filter ${JSON.stringify(filter)}` : ''})`);
  const arms = [...new Set(T.map(u => u.arm))].sort(), out = { stamps: { from: from.stamps, to: to.stamps }, shared: shared.length,
    onlyFrom: [...idsF].filter(id => !idsT.has(id)), onlyTo: [...idsT].filter(id => !idsF.has(id)), arms: {} };
  for (const arm of arms) {
    const matched = [];
    for (const id of shared) { const a = from.units.filter(u => u.id === id && u.arm === arm), b = T.filter(u => u.id === id && u.arm === arm); if (a.length === 1 && b.length === 1) matched.push([a[0], b[0]]); }
    const A = { units: matched.length, differ: {}, onlyFrom: {}, onlyTo: {}, same: [] };
    const keys = new Set(matched.flatMap(([a, b]) => [...Object.keys(a.f), ...Object.keys(b.f)]));
    for (const k of [...keys].sort()) {
      let n = 0; const vals = new Map(), of = new Set(), ot = new Set();
      for (const [a, b] of matched) {
        const x = a.f[k], y = b.f[k];
        if (x === undefined && y !== undefined) ot.add(y); else if (y === undefined && x !== undefined) of.add(x);
        else if (x !== y) { n++; const key = `${x} -> ${y}`; vals.set(key, (vals.get(key) || 0) + 1); }
      }
      if (ot.size) A.onlyTo[k] = [...ot]; else if (of.size) A.onlyFrom[k] = [...of];
      else if (n) A.differ[k] = { n, vals: [...vals.entries()].sort((p, q) => q[1] - p[1]) }; else A.same.push(k);
    }
    out.arms[arm] = A;
  }
  return out;
}
export function printDiff(d, out = console.log, name = '') {
  out(`CARRY-DIFF${name ? ` ${name}` : ''}: the cited run against the new one, matched by household and arm`);
  out(`  stamps: cited ${d.stamps.from.join('; ') || 'none'} | new ${d.stamps.to.join('; ') || 'none'}`);
  out(`  households: ${d.shared} in both; only cited ${d.onlyFrom.length}${d.onlyFrom.length ? ` (${d.onlyFrom.join(', ')})` : ''}; only new ${d.onlyTo.length}${d.onlyTo.length ? ` (${d.onlyTo.join(', ')}: a carry across households)` : ''}`);
  for (const [arm, A] of Object.entries(d.arms)) {
    out(`  arm ${arm}: ${A.units} units matched`);
    if (!A.units) { out('    no unit of this arm in the cited run: nothing carried for it'); continue; }
    for (const [k, v] of Object.entries(A.differ)) out(`    DIFFERS ${k}: on ${v.n} of ${A.units} (${v.vals.slice(0, 3).map(([s, c]) => `${s} x${c}`).join('; ')}${v.vals.length > 3 ? `; ${v.vals.length - 3} more` : ''})`);
    for (const [k, v] of Object.entries(A.onlyTo)) out(`    ONLY NEW ${k}: ${v.slice(0, 3).join(', ')} (the cited run does not print it)`);
    for (const [k, v] of Object.entries(A.onlyFrom)) out(`    ONLY CITED ${k}: ${v.slice(0, 3).join(', ')} (the new run does not print it)`);
    out(`    same on every matched unit: ${A.same.join(', ') || 'none'}`);
  }
}

/* PLANTED (rule 6) */
function planted() {
  const P = ''.padEnd(16), log = (id, L, ran, joint = 'true switchMargin 0 scale 100 cap 400 deathTax 0 tier own riskAbove off', st = 'stamp: code c1 audit a1 prediction p sha s') =>
    `${st}\n${id.padEnd(16)} case | unit ${L} | lambda 0.02 tier own riskAbove auto mix 3\n${P} ran ${L}: ${ran}\n${P} joint ${L}: ${joint}\n${P} done ${L}\n`;
  const ran = (w, extra = '') => `mix 3 pts 30 seed 7002 paths 8000 bequestWeight ${w} e3 true${extra}`;
  const F = unitsOf([log('S120', 'CAND/CANDIDATE/W0.01', ran('0.01')), log('S122', 'CAND/CANDIDATE/W0.01', ran('0.01')), log('S120', 'SHIP/PRODUCT/W0.01', ran('0.01'))]);
  const Tx = unitsOf([log('S120', 'CAND/CANDIDATE/W0.01', ran('0.01', ' e3pcls true').replace('7002', '7013'), undefined, 'stamp: code c2 audit a2 prediction p sha s'),
    log('S122', 'CAND/CANDIDATE/W0.01', ran('0.01', ' e3pcls true').replace('7002', '7013')), log('S999', 'CAND/CANDIDATE/W0.01', ran('0.01', ' e3pcls true')),
    log('S120', 'CAND/CANDIDATE/W0.02', ran('0.02', ' e3pcls true')), log('S120', 'SHIP/PRODUCT/W0.01', ran('0.01').replace('7002', '7013'))]);
  const d = carryDiff(F, Tx, { bequestWeight: '0.01' }), cases = [], EDGES = [];
  cases.push(['the filter keeps the 0.01 units: 3 CAND households, 2 matched', `${d.arms.CAND.units} ${d.shared}`, '2 2']);
  cases.push(['the seed differs on both matched CAND units', JSON.stringify(d.arms.CAND.differ.seed && d.arms.CAND.differ.seed.n), '2']);
  cases.push(['e3pcls printed on the new side only', JSON.stringify(d.arms.CAND.onlyTo.e3pcls), '["true"]']); EDGES.push('a field printed on one side only');
  cases.push(['the estate weight the same under the filter', String(d.arms.CAND.same.includes('bequestWeight')), 'true']);
  cases.push(['a household in the new panel only is named', d.onlyTo.join(','), 'S999']);
  cases.push(['a household in the cited panel only is named (none here)', String(d.onlyFrom.length), '0']);
  cases.push(['the stamps are both printed', `${d.stamps.from.length} ${d.stamps.to.length}`, '1 2']);
  cases.push(['SHIP: one matched unit, the seed differs', `${d.arms.SHIP.units} ${d.arms.SHIP.differ.seed && d.arms.SHIP.differ.seed.n}`, '1 1']);
  { const d2 = carryDiff(F, Tx, { bequestWeight: '0.02' }); cases.push(['the 0.02 filter: the weight differs on the one matched unit', `${d2.arms.CAND.units} ${d2.arms.CAND.differ.bequestWeight && d2.arms.CAND.differ.bequestWeight.vals[0][0]}`, '1 0.01 -> 0.02']); }
  { const J = unitsOf([log('S120', 'CAND/CANDIDATE/W0.01', ran('0.01'), 'false switchMargin 0.001 scale 100 cap 400 deathTax 0 tier own riskAbove off')]);
    const d3 = carryDiff(F, J); cases.push(['the joint line read: the joint flag and its margin differ', `${d3.arms.CAND.differ.jointWorlds && d3.arms.CAND.differ.jointWorlds.n} ${d3.arms.CAND.differ.jointMargin && d3.arms.CAND.differ.jointMargin.vals[0][0]}`, '1 0 -> 0.001']); }
  { const X = unitsOf([`${''.padEnd(0)}S120             case | unit CAND/CANDIDATE/W0.01 | lambda 0.02 tier own riskAbove auto mix 3\n${P} ran SHIP/PRODUCT/W0.01: seed 9999\n`]);
    cases.push(['a ran line labelled for another unit is not read into this one', String(X.units[0].f.seed), 'undefined']); EDGES.push('a ran line under another unit\'s label'); }
  const threw = f => { try { f(); return 'no'; } catch { return 'threw'; } };
  cases.push(['a diff over no new unit is an error', threw(() => carryDiff(F, Tx, { bequestWeight: '0.05' })), 'threw']); EDGES.push('a filter that keeps no unit');
  cases.push(['a diff over no cited unit is an error', threw(() => carryDiff(unitsOf(['']), Tx)), 'threw']);
  cases.push(['a diff with no household shared is an error', threw(() => carryDiff(F, unitsOf([log('S777', 'CAND/CANDIDATE/W0.01', ran('0.01'))]))), 'threw']); EDGES.push('no household shared');
  let bad = 0;
  for (const [n, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}: ${got}${ok ? '' : ` (want ${want})`}`); }
  if (bad) { console.log(`PLANTED CHECK FAILED: ${bad}`); process.exit(1); }
  console.log(`planted (${cases.length}): all read as they should\nEDGES: ${EDGES.join(', ')}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) { planted(); process.exit(0); }
  const [fromDir, toDir, ...fl] = process.argv.slice(2);
  if (!fromDir || !toDir) { console.error('usage: carry-diff.mjs <from-dir> <to-dir> [field=value ...]'); process.exit(2); }
  const filter = Object.fromEntries(fl.map(x => x.split('=')));
  try { printDiff(carryDiff(unitsOf(textsOf(fromDir)), unitsOf(textsOf(toDir)), filter), console.log, `${fromDir} -> ${toDir}`); }
  catch (e) { console.error(`carry-diff: ${e.message}`); process.exit(2); }
}
