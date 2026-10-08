/*
 * 7U'S PANEL AND UNITS, ONE SOURCE for audit-7u.mjs, reduce-7u.mjs and derive-7u.mjs (PLAN.md 7u; items/7u.md).
 *   - 7e's 25 households, 7af's 16 in its order then 7ag's 9 (as 7aj and 7aw ran them), with their bridge years;
 *   - the broad 30, read from results-7u-broad.txt's BROAD line (select-7u-broad.mjs, chosen by a rule that never looks
 *     at the solver), held to its committed hash so no edit of that file can move the panel unseen;
 *   - both estate weights, 0.02 (the product's default) and 0.01 (its lowest reachable), the whole-score rule's two
 *     settings (the maintainer, 29 Sep 09:08 UK); both arms, CAND (the research candidate) and SHIP (the shipping default);
 *   - the six households whose table against the simulation is printed by stage (the deep review of 7 Oct 11:42 UK,
 *     change 4; items/7u.md, 8 Oct item 3);
 *   - seed 7013 (RULES.md section 8 item 9: held out for 7u), 8,000 paths, 30 points. The preflight runs the tuning seed
 *     7002, so nothing before the run touches 7013.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PANEL25 = [['share 0.50', 2], ['share 0.70', 2], ['share 0.78', 2], ['share 0.90', 2], ['share 0.95', 2], ['bridge 0', 0], ['bridge 1', 1], ['bridge 6', 6],
  ['wealth x0.5', 2], ['wealth x2', 2], ['S120', 2], ['S122', 2], ['S126', 2], ['bridge 4', 4], ['S360', 8], ['S194', 0],
  ['S124', 2], ['S128', 2], ['S130', 2], ['S366', 8], ['S370', 8], ['bridge 4+cost', 4], ['S162', 2], ['S172', 2], ['S168', 2]];
export const BROAD_SHA = 'eb5344ebe6849da1';
export const broadOf = text => {
  const m = /^BROAD: (.*)$/m.exec(text || ''), ids = m ? m[1].trim().split(/\s+/) : [];
  const sha = createHash('sha256').update(ids.join(' ')).digest('hex').slice(0, 16);
  if (sha !== BROAD_SHA || ids.length !== 30) throw new Error(`results-7u-broad.txt's BROAD line hashes ${sha} over ${ids.length} ids, not the registered ${BROAD_SHA} over 30`);
  return ids;
};
export const BROAD = broadOf(readFileSync(join(HERE, 'results-7u-broad.txt'), 'utf8'));
export const PANEL = [...PANEL25.map(([id]) => id), ...BROAD];
export const IN25 = new Set(PANEL25.map(([id]) => id));
export const WEIGHTS = ['0.02', '0.01'];
export const ARMS = ['CAND', 'SHIP'];
export const labelOf = (arm, w) => `${arm === 'CAND' ? 'CANDIDATE' : 'PRODUCT'}/W${w}`;
// the candidates first (the longest), each weight in turn; part k/n of the audit runs the units with index i % n === k
export const UNITS = ARMS.flatMap(arm => WEIGHTS.flatMap(w => PANEL.map(id => [id, arm, labelOf(arm, w), w])));
export const STAGE6 = ['share 0.95', 'S360', 'S370', 'S130', 'bridge 4+cost', 'S128'];
export const SEED = 7013, PRE_SEED = 7002, N = 8000, PTS = 30, LATE = 15;

/* THE GAIN SET, named from the records before seed 7013 is read (the deep review of 7 Oct 11:42 UK, change 2: a pooled
 * floor over the households with no expected gain, ADOPT-PI's floor the precedent). Each weight its own record (CARRY's
 * rule; O45): 7aj's at 0.01, 7aw's at 0.02, held to their committed hashes. A household is in the gain set when its
 * record's survival change, CAND less SHIP, is at least 0.5 points (MARGINS.low, the larger household margin: a gain on
 * the regimen's own scale). The floor is over every other household of the 55, the broad 30 included (no record, so
 * no gain expected; declared in the prediction). */
export const RECORDS = { '0.01': { file: 'results-7aj.txt', sha: 'c2608164dfb21a75' }, '0.02': { file: 'results-7aw.txt', sha: '02c600fbc5b06305' } };
export const GAIN_MIN = 0.5;
export function gainSetOf(text, sha) {
  const got = createHash('sha256').update(text).digest('hex').slice(0, 16);
  if (got !== sha) throw new Error(`a record hashes ${got}, not its registered ${sha}`);
  const legs = [...text.matchAll(/^ {5}(\S.*?)\s+(\d+) saved\/(\d+) lost of (\d+)\s/gm)].map(m => ({ id: m[1].trim(), d: 100 * (+m[2] - +m[3]) / +m[4] }));
  const ids = legs.map(l => l.id);
  if (legs.length !== PANEL25.length || PANEL25.some(([id]) => !ids.includes(id))) throw new Error(`a record's survival legs are not the 25 (${legs.length} read)`);
  return legs.filter(l => l.d >= GAIN_MIN - 1e-12).map(l => l.id);
}
export const gainOf = w => gainSetOf(readFileSync(join(HERE, RECORDS[w].file), 'utf8'), RECORDS[w].sha);
export const floorOf = w => { const g = new Set(gainOf(w)); return PANEL.filter(id => !g.has(id)); };
