/*
 * 7AH'S DERIVATION AND POWER (predictions/diag-7ah.md; its output hashed in the prediction and re-run by the launcher).
 * No record holds the order reference, so the power of the survival items (1 and 3) is simulated from the nearest records'
 * discordance, read from results-7af.txt and results-7ag.txt by pattern (7ag's 16,000 paths scaled to 8,000):
 *   - SMALL: the fix moves paths as the tier state's own change did on each household (CAND against PRODR, "tier state s/l");
 *   - CHURN: on S360 and S370, where the reader alone moved hundreds of paths ("reader s/l"), the fix moves as many both
 *     ways (the larger of the reader's two counts, saved and lost alike), the other four as SMALL;
 *   - HARM: SMALL, and S360 loses its margin (0.5 points: 40 more paths lost than saved at 8,000).
 * Each story draws every household's saved and lost as Poisson counts, reads them by reduce-7ah.mjs's own items() (the
 * exact rule with Holm across six at its margins, and the guarded unconditional interval), 4,000 draws a story, seeded.
 * Items 2 and 4 (the whole score) and 5 (S360's table error) have no record of this contrast; their scale is stated in the
 * prediction from 7af's and 7ag's whole-score intervals and S360's table error, not simulated here.
 *   node research/solver/derive-7ah.mjs > research/solver/results-derive-7ah.txt
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PANEL, MARGIN, N, items } from './reduce-7ah.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const text = readFileSync(join(HERE, 'results-7af.txt'), 'utf8') + readFileSync(join(HERE, 'results-7ag.txt'), 'utf8');
const scale = id => (['S366', 'S370', 'bridge 4+cost'].includes(id) ? 0.5 : 1);   // 7ag ran 16,000 paths
const pair = (id, what) => { const re = new RegExp(`^  ${id.replace(/[+]/g, '\\+')} +reader (\\d+)/(\\d+) .*\\| tier state (\\d+)/(\\d+) `, 'm'), m = re.exec(text); if (!m) throw new Error(`no record line for ${id}`); return what === 'reader' ? [+m[1], +m[2]] : [+m[3], +m[4]]; };
console.log('7AH\'S DERIVATION AND POWER, from 7af\'s and 7ag\'s records (per 8,000 paths)');
console.log('\n1. THE RECORDS (saved/lost, scaled to 8,000): the reader alone against the default; the tier state against the product with the reader');
for (const [id] of PANEL) { const r = pair(id, 'reader'), t = pair(id, 'tier'), s = scale(id); console.log(`  ${id.padEnd(14)} reader ${r.map(x => (x * s).toFixed(1)).join('/')}  tier state ${t.map(x => (x * s).toFixed(1)).join('/')}  margin ${MARGIN[id]}`); }

let st = 7002 >>> 0;
const rnd = () => { st = (st + 0x6D2B79F5) >>> 0; let t = st; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const poisson = lam => { if (lam <= 0) return 0; if (lam > 60) { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v))); } const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
const DRAWS = 4000;
// the paths failing in both arms: READER's (7af's and 7ag's CAND) recorded failures at 8,000 paths (the unconditional interval
// reads them; the plan-auditor's MINOR 4 of 29 Sep: a flat 100 understated S360's 4,325 and S370's 2,025)
const both = id => { const m = new RegExp(`^  ${id.replace(/[+]/g, '\\+')} +CAND +table \\S+ sim (\\S+) `, 'm').exec(text); if (!m) throw new Error(`no CAND line for ${id}`); return Math.round(N * (100 - Number(m[1])) / 100); };
console.log(`\n   the paths failing in both arms (READER's recorded failures): ${PANEL.map(([id]) => `${id} ${both(id)}`).join(', ')}`);
const small = id => { const [s, l] = pair(id, 'tier').map(x => x * scale(id)); return [s, l]; };
const STORIES = [
  ['SMALL (the tier state\'s discordance)', id => small(id)],
  ['CHURN (S360 and S370 move as many paths both ways as the reader alone did)', id => { if (id !== 'S360' && id !== 'S370') return small(id); const c = Math.max(...pair(id, 'reader')) * scale(id); return [c, c]; }],
  ['HARM (SMALL, and S360 loses 40 paths net: its margin)', id => { const [s, l] = small(id); return id === 'S360' ? [s, l + 40] : [s, l]; }]];
console.log(`\n2. POWER OF ITEM 1 (item 3 alike), ${DRAWS} draws a story: the share read HELD / INCONCLUSIVE / FALSIFIED`);
for (const [name, rate] of STORIES) {
  const c = { HELD: 0, INCONCLUSIVE: 0, FALSIFIED: 0 };
  for (let d = 0; d < DRAWS; d++) {
    const draw = Object.fromEntries(PANEL.map(([id]) => { const [s, l] = rate(id); return [id, { saved: poisson(s), lost: poisson(l) }]; }));
    const K = id => { const x = draw[id], dd = both(id), a = N - x.saved - x.lost - dd; return { a, lost: x.lost, saved: x.saved, d: dd, N }; };
    const it = items(K, () => ({ d: 0, lo: -0.1, hi: 0.1 }), () => 1)[0];
    c[it.outcome]++;
  }
  console.log(`  ${name}: HELD ${(c.HELD / DRAWS).toFixed(3)}  INCONCLUSIVE ${(c.INCONCLUSIVE / DRAWS).toFixed(3)}  FALSIFIED ${(c.FALSIFIED / DRAWS).toFixed(3)}`);
}

// 3. THE SCALE OF ITEMS 2 AND 4 (not simulated: no record of this contrast): the half-width of 7af's and 7ag's whole-score
// interval, CAND against SHIP, on each household - arms far more different than ORDER and READER - scaled to 8,000 paths by
// the square root of the path ratio (7ag's 16,000: x1.41), beside each household's margin (the plan-auditor's MINOR 2 of 29 Sep)
console.log('\n3. THE SCALE OF ITEMS 2 AND 4: 7af\'s and 7ag\'s whole-score interval half-widths (CAND against SHIP), at 8,000 paths');
for (const [id] of PANEL) {
  const m = new RegExp(`^  ${id.replace(/[+]/g, '\\+')} +[+-]\\d+\\.\\d+ \\((-?\\d+\\.\\d+) to (-?\\d+\\.\\d+);`, 'm').exec(text);
  if (!m) throw new Error(`no whole-score line for ${id}`);
  const half = (Number(m[2]) - Number(m[1])) / 2, at8 = half * Math.sqrt(1 / scale(id));
  console.log(`  ${id.padEnd(14)} +/-${half.toFixed(3)} as recorded${scale(id) < 1 ? ' (16,000 paths)' : ''}, +/-${at8.toFixed(2)} at 8,000  margin ${MARGIN[id]}`);
}
