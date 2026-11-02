/*
 * THE SAVINGS SPLIT'S READ (audit-save.mjs; STATE.md D38 (4); research/solver/SAVINGS-SPLIT.md), EXPLORATORY: reported, it
 * decides nothing. After the stamps (fair-gate.mjs requireFairLogs) and its own gate (every household in both arms, one code
 * and one audit stamp across the units and the stamp the files' own, one seed, one path count, a household's arms on one
 * inputs hash, target, retirement year and working years with a choice; each unit ran its arm's option, and one grid, level
 * list, switch charge and raise weight across them all), CANDS against CANDD, paired on the same paths:
 *   - per household: survival under each and the change in points (se by path; paths saved and lost), the lifetime spending
 *     delivered in % of CANDD's, the mean estate in pounds, the saves CANDS's policy chose over the working years (runPolicy
 *     beside the engine) and the mean pension, ISA and taxable pots at the top of the first retired year under each arm;
 *   - the panel: each change averaged over the households (se from theirs, independent), and the households with a loss
 *     beyond two se.
 *   node research/solver/reduce-save.mjs [dir]       (results/save-7002 unless given)
 *   node research/solver/reduce-save.mjs --planted   the gate and the read on synthetic units with known answers
 *   node research/solver/reduce-save.mjs <dir> --smoke   a smoke's units (SAVE_ONLY), the stamps not checked; not a record
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ARMS = ['CANDD', 'CANDS'], HELD_OUT = [7003, 7011, 7012, 7013, 7014, 7018, 7019];

/* the gate: the problems that stop the read */
export function gate(units, ids, filesAudit) {
  const P = [], by = {};
  for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  for (const id of ids) for (const arm of ARMS) if (!by[id] || !by[id][arm]) P.push(`${id} ${arm}: missing`);
  const read = units.filter(u => ids.includes(u.id) && ARMS.includes(u.arm));
  if (!read.length) return P.length ? P : ['no units'];
  const one = (k, f) => { const s = new Set(read.map(f)); if (s.size !== 1) P.push(`${k}: ${[...s].join(', ')} (one wanted)`); return [...s][0]; };
  one('code', u => u.stamp.code); const audit = one('audit', u => u.stamp.audit); const seed = one('seed', u => u.seed); one('paths', u => u.N);
  if (filesAudit !== undefined && audit !== filesAudit) P.push(`the units' audit ${audit} is not the files' ${filesAudit}`);
  if (HELD_OUT.includes(seed)) P.push(`seed ${seed} is held out for another test`);
  for (const id of ids) {
    const us = ARMS.map(a => by[id] && by[id][a]).filter(Boolean);
    for (const k of ['inputs', 'target', 'retireT', 'Y']) if (new Set(us.map(u => u[k])).size > 1) P.push(`${id}: its arms differ in ${k} (${us.map(u => `${u.arm} ${u[k]}`).join(', ')})`);
    if (new Set(us.map(u => JSON.stringify(u.workT))).size > 1) P.push(`${id}: its arms differ in the working years with a choice`);
    if (us.some(u => !u.workT || !u.workT.length)) P.push(`${id}: no working year with a choice recorded`);
  }
  for (const u of read) {
    const want = u.arm === 'CANDS' ? 'on' : 'off';
    if (!u.ran || u.ran.saveSplit !== want) P.push(`${u.id} ${u.arm}: ran saveSplit ${u.ran && u.ran.saveSplit} (the arm is ${want})`);
  }
  for (const k of ['pts', 'levels', 'switchCharge', 'raiseWeight', 'failureShortfall', 'lambda']) one(`what the units ran: ${k}`, u => JSON.stringify(u.ran && u.ran[k]));
  return P;
}

const dec = (u, k, T) => { const b = Buffer.from(u.main[k], 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
/* the paired read of one household: B (CANDS) less A (CANDD) */
export function pair(a, b) {
  const sa = dec(a, 'survived', Uint8Array), sb = dec(b, 'survived', Uint8Array), da = dec(a, 'delivered', Float32Array), db = dec(b, 'delivered', Float32Array);
  const ea = dec(a, 'estate', Float32Array), eb = dec(b, 'estate', Float32Array), n = sa.length;
  let s = 0, s2 = 0, saved = 0, lost = 0, DA = 0, DB = 0, dd = 0, dd2 = 0, de = 0, de2 = 0, sA = 0, sB = 0;
  const mDA = da.reduce((x, v) => x + v, 0) / n;
  for (let k = 0; k < n; k++) {
    const d = sb[k] - sa[k]; s += d; s2 += d * d; if (d > 0) saved++; if (d < 0) lost++; sA += sa[k]; sB += sb[k];
    DA += da[k]; DB += db[k]; const q = 100 * (db[k] - da[k]) / mDA; dd += q; dd2 += q * q;
    const e = eb[k] - ea[k]; de += e; de2 += e * e;
  }
  const mean = (x, x2) => ({ m: x / n, se: Math.sqrt(Math.max(0, x2 / n - (x / n) ** 2) / n) });
  const sv = mean(100 * s, 1e4 * s2), sp = mean(dd, dd2), es = mean(de, de2);
  return { n, survA: 100 * sA / n, survB: 100 * sB / n, surv: sv, saved, lost, spend: sp, spendRatio: 100 * (DB - DA) / DA, estate: es };
}
export function read(units, ids) {
  const by = {};
  for (const u of units) (by[u.id] ||= {})[u.arm] = u;
  const rows = ids.map(id => ({ id, a: by[id].CANDD, b: by[id].CANDS, p: pair(by[id].CANDD, by[id].CANDS) }));
  const pool = f => { const ms = rows.map(r => f(r.p)); return { m: ms.reduce((x, v) => x + v.m, 0) / ms.length, se: Math.sqrt(ms.reduce((x, v) => x + v.se * v.se, 0)) / ms.length }; };
  return { rows, surv: pool(p => p.surv), spend: pool(p => p.spend), estate: pool(p => p.estate), losers: rows.filter(r => r.p.surv.m < -2 * r.p.surv.se && r.p.lost > 0).map(r => r.id) };
}
const f = (x, d = 3) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
const SAVES = ['the plan', 'pension first', 'ISA first'];
export function report(R) {
  const out = [];
  for (const { id, a, b, p } of R.rows) {
    const ch = (b.chosen || []).reduce((x, c) => x.map((v, i) => v + c[i]), [0, 0, 0]), tot = ch.reduce((x, v) => x + v, 0) || 1, aa = (a.after || [])[0] || {}, bb = (b.after || [])[0] || {};
    const r0 = (a.rooms || [])[0] || {};
    out.push(`${id} (${a.workT.length} working years to choose, the first year's net budget £${Math.round(r0.budget || 0)}, rooms pension £${Math.round(r0.pen || 0)}, ISA £${Math.round(r0.isa || 0)}): survival CANDD ${p.survA.toFixed(3)}%, CANDS ${p.survB.toFixed(3)}%, ${f(p.surv.m)} (se ${p.surv.se.toFixed(3)}; ${p.saved} saved, ${p.lost} lost); spending delivered ${f(p.spend.m)}% (se ${p.spend.se.toFixed(4)}); estate ${f(p.estate.m, 0)} (se ${p.estate.se.toFixed(0)}); CANDS's saves over the working years ${SAVES.map((s, i) => `${s} ${Math.round(100 * ch[i] / tot)}%`).join(', ')} of ${tot}; the pots at retirement, CANDD / CANDS: pension £${Math.round(aa.pen || 0)} / £${Math.round(bb.pen || 0)}, ISA £${Math.round(aa.isa || 0)} / £${Math.round(bb.isa || 0)}, taxable £${Math.round(aa.tax || 0)} / £${Math.round(bb.tax || 0)}`);
  }
  out.push(`THE PANEL (${R.rows.length} households, each counted once): survival CANDS less CANDD ${f(R.surv.m)} points (se ${R.surv.se.toFixed(4)}); spending delivered ${f(R.spend.m)}% (se ${R.spend.se.toFixed(4)}); estate ${f(R.estate.m, 0)} (se ${R.estate.se.toFixed(0)}); a household with a loss beyond two se: ${R.losers.length ? R.losers.join(', ') : 'none'} (EXPLORATORY: reported, deciding nothing)`);
  return out;
}

function synth({ ids = ['H1', 'H2'], n = 400, lostOn = {}, ranAs = {}, drop = null } = {}) {
  const b64 = x => Buffer.from(x.buffer, x.byteOffset, x.byteLength).toString('base64');
  const units = [];
  for (const id of ids) for (const arm of ARMS) {
    if (drop === `${id} ${arm}`) continue;
    const surv = new Uint8Array(n).fill(1), del = new Float32Array(n).fill(100), est = new Float32Array(n).fill(1000);
    if (arm === 'CANDS' && lostOn[id]) for (let k = 0; k < lostOn[id]; k++) surv[k] = 0;
    units.push({ id, arm, inputs: 'i', target: 1, retireT: 3, Y: 6, workT: [0, 1, 2], rooms: [], stamp: { code: 'c', audit: 'a' }, seed: 7002, N: n, chosen: [[0, n, 0], [0, n, 0], [n, 0, 0]], after: [{}],
      ran: { saveSplit: arm === 'CANDS' ? 'on' : 'off', pts: 45, levels: [1], switchCharge: 0.001, raiseWeight: 0.003, failureShortfall: true, lambda: 1, ...(ranAs[`${id} ${arm}`] || {}) },
      main: { survived: b64(surv), delivered: b64(del), estate: b64(est) } });
  }
  return units;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--planted') {
    let bad = 0;
    const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); if (!c) bad++; };
    ok(gate(synth(), ['H1', 'H2']).length === 0, 'a full, fair synthetic set passes the gate');
    ok(gate(synth({ drop: 'H2 CANDS' }), ['H1', 'H2']).some(p => /H2 CANDS: missing/.test(p)), 'a missing unit is refused');
    ok(gate(synth({ ranAs: { 'H1 CANDS': { saveSplit: 'off' } } }), ['H1', 'H2']).some(p => /H1 CANDS: ran saveSplit off/.test(p)), 'a CANDS unit that ran without the split is refused');
    ok(gate(synth().map(u => (u.id === 'H1' && u.arm === 'CANDS' ? { ...u, workT: [0, 1] } : u)), ['H1', 'H2']).some(p => /H1: its arms differ in the working years/.test(p)), "a household whose arms differ in the working years to choose is refused");
    ok(gate(synth({ ranAs: { 'H2 CANDD': { pts: 30 } } }), ['H1', 'H2']).some(p => /what the units ran: pts/.test(p)), 'a unit on another grid is refused');
    const R = read(synth({ lostOn: { H1: 8 } }), ['H1', 'H2']);
    ok(Math.abs(R.rows[0].p.surv.m + 2) < 1e-12 && R.rows[0].p.lost === 8 && Math.abs(R.surv.m + 1) < 1e-12 && R.rows[1].p.surv.m === 0, `known answer: 8 of 400 paths lost on H1 read as -2 points there (${R.rows[0].p.surv.m}), -1 on the panel (${R.surv.m}), none on H2`);
    ok(R.losers.includes('H1') && !R.losers.includes('H2'), 'the household losing beyond two se is named, the other not');
    console.log(bad ? `FAILED: ${bad}` : 'ALL PASS');
    process.exit(bad ? 1 : 0);
  }
  const { requireFairLogs } = await import('./fair-gate.mjs');
  const { saveIds, stampFilesHash } = await import('./audit-save.mjs');
  const { readPanel } = await import('./phase4-panel.mjs');
  const SMOKE = process.argv.includes('--smoke'), dir = process.argv.slice(2).find(a => !a.startsWith('--')) || join(HERE, 'results', 'save-7002');
  // the stamps: each part's log (case<k>.txt, as the batch writes them), one code and one audit across them
  const logs = Object.fromEntries(readdirSync(dir).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(dir, x), 'utf8')]));
  if (SMOKE) console.log('SMOKE: the stamps not checked (a run outside run-from-snapshot.sh); not a record');
  else requireFairLogs(logs, 'none', { blob: () => '-' });
  const units = readdirSync(dir).filter(x => x.endsWith('.json.gz')).map(x => JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString()));
  const ids = saveIds(readPanel()).filter(id => !process.env.SAVE_ONLY || process.env.SAVE_ONLY.split(',').includes(id));   // SAVE_ONLY: a smoke's households
  const P = gate(units, ids, SMOKE ? undefined : stampFilesHash());
  if (P.length) { console.log(`THE GATE REFUSES (${P.length}):\n${P.map(p => `  ${p}`).join('\n')}`); process.exit(1); }
  const u0 = units[0];
  console.log(`THE SAVINGS SPLIT ON THE CANDIDATE (EXPLORATORY): the gate: fair - ${ids.length} households in CANDD and CANDS, seed ${u0.seed}, ${u0.N} paths, one stamp (code ${u0.stamp.code}, audit ${u0.stamp.audit}), candidate ${u0.stamp.candidate}; runPolicy beside the engine: paths that differ ${units.reduce((x, u) => x + u.beside.engineOnly + u.beside.policyOnly, 0)} of ${units.reduce((x, u) => x + u.beside.N, 0)}`);
  report(read(units, ids)).forEach(l => console.log(l));
  const secs = arm => units.filter(u => u.arm === arm).reduce((x, u) => x + u.solveSecs, 0);
  console.log(`The solve, CANDS against CANDD: ${(secs('CANDS') / 3600).toFixed(2)} and ${(secs('CANDD') / 3600).toFixed(2)} core-hours (x${(secs('CANDS') / secs('CANDD')).toFixed(2)}); the engine ${(units.reduce((x, u) => x + u.engineSecs, 0) / 3600).toFixed(2)} core-hours`);
}
