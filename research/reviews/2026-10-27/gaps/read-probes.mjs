/*
 * THE PLAN-VARIANT PROBES, READ (EXPLORATORY; GAPS-SWEEP.md, Part B): each arm against BASE on the same household, paired by
 * path, by the rule committed before launch. No verdict for a setting until every unit the plan lists is in.
 *   node read-probes.mjs <probe dir>
 */
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
const dir = process.argv[2];
// the units GAPS-SWEEP.md lists (household and arm); a setting's verdict waits for all of its own
export const UNITS = {
  BUF0: ['S370', 'S380', 'S224', 'S362'], BUF24: ['S370', 'S380', 'S224', 'S362'], LUMP: ['S370', 'S380', 'S224', 'S362'],
  ISA2ISA: ['S224', 'S380'], MOREISA: ['S302F', 'S330F', 'S342F'], MOREPEN: ['S302F', 'S330F', 'S342F']
};
const NAMES = { BUF0: 'the cash buffer at 0 months', BUF24: 'the cash buffer at 24 months', LUMP: 'the full 25% lump sum', ISA2ISA: 'the cash ISA moved to the stocks and shares ISA',
  MOREISA: 'half the pension cost saved in the ISA', MOREPEN: 'the ISA money saved in the pension' };
const units = {};
for (const f of readdirSync(dir).filter(x => x.endsWith('.json'))) { const j = JSON.parse(readFileSync(join(dir, f), 'utf8')); units[`${j.id}-${j.arm}`] = j; }
const dec = (b64, T) => new T(Buffer.from(b64, 'base64').buffer.slice(0));
// one fair test before any pairing: the same code, candidate, seed, paths, points and weight on every unit
const keys = ['codeHash', 'candidateHash', 'seed', 'paths', 'points', 'w'];
const all = Object.values(units);
if (!all.length) { console.log('no units yet'); process.exit(0); }
const differ = keys.filter(k => new Set(all.map(u => JSON.stringify(u[k]))).size > 1);
console.log(`THE PLAN-VARIANT PROBES (EXPLORATORY): ${all.length} units; ${differ.length ? `NOT FAIR: the units differ in ${differ.join(', ')}` : `fair: one code (${all[0].codeHash}), candidate ${all[0].candidateHash}, seed ${all[0].seed}, ${all[0].paths} paths, ${all[0].points} points, W${all[0].w}`}`);
if (differ.length) process.exit(1);
const pair = (base, arm) => {
  const sb = dec(base.perPath.survived, Uint8Array), sa = dec(arm.perPath.survived, Uint8Array), wb = dec(base.perPath.whole, Float64Array), wa = dec(arm.perPath.whole, Float64Array);
  const N = sb.length; let saved = 0, lost = 0, dw = 0, dw2 = 0;
  for (let i = 0; i < N; i++) { if (sa[i] && !sb[i]) saved++; if (sb[i] && !sa[i]) lost++; const d = wa[i] - wb[i]; dw += d; dw2 += d * d; }
  const ch = 100 * (saved - lost) / N, se = 100 * Math.sqrt(Math.max(0, (saved + lost) / N - ((saved - lost) / N) ** 2) / N);
  const mw = dw / N, sw = Math.sqrt(Math.max(0, dw2 / N - mw * mw) / N);
  return { N, saved, lost, ch, se, lo: ch - 1.96 * se, hi: ch + 1.96 * se, mw, sw, wlo: mw - 1.96 * sw, whi: mw + 1.96 * sw };
};
const f2 = x => `${x >= 0 ? '+' : ''}${x.toFixed(2)}`;
for (const [arm, hhs] of Object.entries(UNITS)) {
  const rows = [];
  for (const id of hhs) {
    const b = units[`${id}-BASE`], a = units[`${id}-${arm}`];
    if (!b || !a) { rows.push({ id, missing: true }); continue; }
    rows.push({ id, b, a, p: pair(b, a) });
  }
  console.log(`\n${arm}: ${NAMES[arm]}`);
  for (const r of rows) {
    if (r.missing) { console.log(`  ${r.id}: not in yet`); continue; }
    const { b, a, p } = r;
    console.log(`  ${r.id}: survival ${b.survival.toFixed(2)}% to ${a.survival.toFixed(2)}%, ${f2(p.ch)} points (95% ${f2(p.lo)} to ${f2(p.hi)}; ${p.saved} saved, ${p.lost} lost); whole score ${f2(p.mw)} (${f2(p.wlo)} to ${f2(p.whi)}); ` +
      `failures before the pension opens ${b.bridgeFails} to ${a.bridgeFails}, after ${b.laterFails} to ${a.laterFails}; lifetime tax £${Math.round(b.meanLifetimeTax)} to £${Math.round(a.meanLifetimeTax)}; solve ${b.solveSecs.toFixed(0)} s to ${a.solveSecs.toFixed(0)} s; ${a.note}`);
  }
  if (rows.some(r => r.missing)) { console.log(`  VERDICT: none yet (${rows.filter(r => r.missing).length} of ${rows.length} pairs missing)`); continue; }
  // the rule (GAPS-SWEEP.md, committed before launch)
  const gain = rows.filter(r => (r.p.lo > 0 && r.p.ch >= 0.5) || (r.p.wlo > 0 && r.p.mw >= 0.5));
  const flat = rows.every(r => (r.p.ch <= 0.25) && (r.p.mw <= 0.25));
  const v = gain.length ? `WORTH A SOLVER CHOICE: beats the plan's fixed setting beyond noise by 0.5 or more on ${gain.map(r => r.id).join(', ')}`
    : flat ? 'NOT WORTH IT NOW: within 0.25 of the plan or below it on every household' : 'MARGINAL: the maintainer\'s call';
  console.log(`  VERDICT: ${v}`);
}
