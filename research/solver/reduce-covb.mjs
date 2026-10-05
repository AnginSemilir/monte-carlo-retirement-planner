/*
 * COV-B-STEP'S REDUCER (PLAN.md COV and RTAX; audit-covb.mjs; predictions/diag-covb.md). A TEST: PMAP's unit (BASE) against
 * the same with the reader's tax (TAX) and with the tax and the step-year edge node (COV), on S130, S370, bridge 4 and S126,
 * every arm of a household on the same paths; on S370 ORDER (readerRef 'order', O81) and CORD (COV with readerRef 'order'),
 * the 2x2 with BASE and COV that splits a COV harm there; controls bridge 0 (no reader year) and S126 all-ISA (no tax).
 * Amended before launch (the plan-auditor's FAIL and the deep review, 5 Oct 01:34-01:49 UK): reads and claims stored apart
 * with year, world, kind, support and same-move flags; item 3 on each household's last step year; the S370 2x2.
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs against predictions/diag-covb.md); every household once and done with
 * its arms' solve and sum lines; each arm's settings taking (the solve line's readerTax, coverage and readerRef as the arm
 * asks); CORD's step years and node count COV's; the ran line's seed, points and paths the registered ones; every per-path
 * file present, stamped as the logs, holding each arm's survival pattern with its survivors equal to the sum line's and its
 * fixed reads lined up with the fixed line's counts; on the last step year's reads BASE's, TAX's and COV's claims the same
 * (the later tables are the same in every arm there, the premise item 3 stands on); the controls: on bridge 0 every arm's
 * survival pattern the same and no reader-year read; on S126 all-ISA BASE's and TAX's patterns the same. Anything else is
 * not settled.
 * THE READING (registered in predictions/diag-covb.md):
 *   ITEM 1 (primary, harm): COV against BASE, the paired survival change per household (b lost, c saved), stats.mjs outcome()
 *     at the household's margin (marginFor BASE's survival), harm's exact McNemar p Holm over the 4. HELD when every household
 *     reads no material harm; FALSIFIED when any reads harm; else INCONCLUSIVE.
 *   ITEM 2 (primary, harm): TAX against BASE, the same rule.
 *   ITEM 3 (primary, mechanism): along BASE's paths at each household's LAST step year, on the reads where COV's chooser
 *     makes BASE's move, d = BASE's read less COV's read at the same state and layer, D = an arm's read less its claim at
 *     t + 1 (the claims the same in both there: the gate). The sign test of d per household with such reads, Holm over them;
 *     COV's read lower (d > 0) is the flat copy's optimism removed. HELD when every such household shows d > 0 (Holm p under
 *     0.05) and COV's |mean D| is below BASE's; FALSIFIED when any shows d < 0; else INCONCLUSIVE.
 *   REPORTED: COV against TAX (survival: the node's own effect); the S370 2x2 (COV - BASE, CORD - ORDER, ORDER - BASE, CORD -
 *     COV, and the interaction); TAX's d against BASE on the same reads (its sign fixed by construction: the tax only removes
 *     support); item 3's statistic on every step year (S370's year 3 not clean: its claim's table differs by arm); the
 *     spread reads' mean D per arm by household, year and world at fixed policy (O81); the reads where an arm moves
 *     differently; the moves.
 *   node research/solver/reduce-covb.mjs [dir] [paths a world] [points] > research/solver/results-covb.txt
 *   node research/solver/reduce-covb.mjs --planted   the planted checks alone, and the outcomes they reach (OUTCOMES REACHED)
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireFairLogs } from './fair-gate.mjs';
import { outcome, mcnemarHarmP, holm, marginFor, signTest } from './stats.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const PRED = 'research/solver/predictions/diag-covb.md';
export const PTS = '30', SEED = '7002', NPW = 2000;
export const PANEL = ['S130', 'S370', 'bridge 4', 'S126'], CONTROLS = ['bridge 0', 'S126 all-ISA'], UNITS = [...PANEL, ...CONTROLS];
export const armsOf = id => (id === 'S370' ? ['BASE', 'TAX', 'COV', 'ORDER', 'CORD'] : ['BASE', 'TAX', 'COV']);
const field = (s, k) => { const m = new RegExp(`(?:^| )${k} (\\S+)`).exec(s); return m ? m[1] : null; };
const num = (s, k) => { const v = field(s, k); return v === null || v === '-' ? NaN : Number(v); };
const CASEL = /^(\S.*?)\s+case \| unit (\S+) \| lambda (\S+) tier own riskAbove auto mix 3 \| arms (\S+)$/;
const LINE = /^\s+(solve|sum|fixed|moves) (BASE|TAX|COV|ORDER|CORD): (.*)$/, RANL = /^\s+ran (\S+): (.*)$/, DONEL = /^\s+done (\S+)(?: rss (\d+)MB)?$/;

export function parse(text) {
  const us = []; let cur = null;
  for (const line of text.split('\n')) {
    let m;
    if ((m = CASEL.exec(line))) { cur = { id: m[1].trim(), label: m[2], arms: m[4].split(','), solve: {}, sum: {}, fixed: {}, moves: {}, done: false }; us.push(cur); continue; }
    if (!cur) continue;
    if ((m = DONEL.exec(line))) { if (m[1] === cur.label) { cur.done = true; cur.rss = m[2] ? Number(m[2]) : NaN; } continue; }
    if ((m = RANL.exec(line))) { if (m[1] === cur.label) cur.ran = m[2]; continue; }
    if (!(m = LINE.exec(line))) continue;
    const [, kind, arm, s] = m;
    if (kind === 'solve') cur.solve[arm] = { readerTax: field(s, 'readerTax'), coverage: field(s, 'coverage'), readerRef: field(s, 'readerRef'), steps: field(s, 'stepYears') };
    else if (kind === 'sum') cur.sum[arm] = { paths: num(s, 'paths'), survived: num(s, 'survived'), pathsum: field(s, 'pathsum') };
    else if (kind === 'fixed') cur.fixed[arm] = { reads: num(s, 'reads'), step: num(s, 'step'), last: num(s, 'last'), lastYear: num(s, 'lastYear'), same: num(s, 'same'), meanDstep: num(s, 'meanDstep'), meanDspread: num(s, 'meanDspread') };
    else if (kind === 'moves') cur.moves[arm] = s;
  }
  return us;
}

export function gate(units, { pts = PTS, npw = NPW } = {}) {
  const bad = [];
  for (const id of UNITS) { const n = units.filter(u => u.id === id).length; if (n !== 1) bad.push(`${id}: ${n} case lines, not 1`); }
  for (const u of units) {
    if (!UNITS.includes(u.id)) { bad.push(`${u.id}: not a registered household`); continue; }
    if (!u.done) bad.push(`${u.id}: not done`);
    const want = armsOf(u.id);
    if (u.arms.join(',') !== want.join(',')) bad.push(`${u.id}: arms ${u.arms.join(',')}, not ${want.join(',')}`);
    if (!u.ran) { bad.push(`${u.id}: no ran line`); continue; }
    for (const [k, v] of Object.entries({ pts, seed: SEED, paths: String(3 * npw), mix: '3' })) if (field(u.ran, k) !== v) bad.push(`${u.id}: ran ${k} ${field(u.ran, k)}, not ${v}`);
    for (const a of want) {
      const s = u.solve[a], m = u.sum[a];
      if (!s || !m) { bad.push(`${u.id} ${a}: a solve or sum line missing`); continue; }
      // the arm's settings took: TAX, COV and CORD carry a readerTax entry (or 'none'), COV and CORD a coverage entry, ORDER
      // and CORD readerRef order
      const taxOn = s.readerTax !== '-', covOn = s.coverage !== '-', ord = s.readerRef === 'order';
      if (taxOn !== ['TAX', 'COV', 'CORD'].includes(a) || covOn !== ['COV', 'CORD'].includes(a) || ord !== ['ORDER', 'CORD'].includes(a)) bad.push(`${u.id} ${a}: solve line readerTax ${s.readerTax} coverage ${s.coverage} readerRef ${s.readerRef}, not the arm's`);
      if (m.paths !== 3 * npw || !(Number.isInteger(m.survived) && m.survived >= 0 && m.survived <= m.paths) || !m.pathsum) bad.push(`${u.id} ${a}: sum paths ${m.paths} survived ${m.survived}`);
      if (!u.fixed[a]) bad.push(`${u.id} ${a}: no fixed line`);
    }
    // CORD must keep COV's step years and nodes (readerRef 'order' with coverage and readerTax is not refused by the solver)
    if (want.includes('CORD') && u.solve.CORD && u.solve.COV && (u.solve.CORD.steps !== u.solve.COV.steps || String(u.solve.CORD.coverage).split('/')[0] !== String(u.solve.COV.coverage).split('/')[0])) bad.push(`${u.id} CORD: step years ${u.solve.CORD.steps} nodes ${u.solve.CORD.coverage}, not COV's ${u.solve.COV.steps} ${u.solve.COV.coverage}`);
  }
  return bad;
}

export const stampOf = text => { const m = /^stamp: code (\S+) audit (\S+) prediction (\S+) sha (\S+)$/m.exec(text || ''); return m ? { code: m[1], audit: m[2], prediction: m[3], sha: m[4] } : null; };
const fileOf = id => `${id.replace(/\s+/g, '_')}.json.gz`;
/* a household's per-path file against its unit; the controls' identities */
export function checkFile(t, u, st, npw = NPW) {
  const tag = `${u.id} file`;
  if (!t) return [`${tag}: missing`];
  const bad = [];
  if (!st || !t.stamp || ['code', 'audit', 'prediction', 'sha'].some(k => t.stamp[k] !== st[k])) bad.push(`${tag}: its stamp is not the logs'`);
  if (t.id !== u.id || t.npw !== npw) bad.push(`${tag}: id ${t.id} paths a world ${t.npw}, not the unit's`);
  for (const a of armsOf(u.id)) {
    const x = t.arms && t.arms[a];
    if (!x || !Array.isArray(x.survived) || x.survived.length !== 3 * npw) { bad.push(`${tag}: arm ${a}'s survival pattern missing or of the wrong length`); continue; }
    const s = x.survived.reduce((p, q) => p + q, 0);
    if (u.sum[a] && s !== u.sum[a].survived) bad.push(`${tag}: arm ${a} ${s} survivors in the file, ${u.sum[a].survived} on the sum line`);
    const F = t.fixed, A = F && F.arms && F.arms[a], n = u.fixed[a] ? u.fixed[a].reads : NaN;
    if (!F || !A || [F.t, F.k, F.kind, F.sup, A.read, A.claim, A.same].some(x => !Array.isArray(x) || x.length !== n)) bad.push(`${tag}: arm ${a}'s fixed reads missing or not the fixed line's count`);
  }
  // the premise item 3 stands on: on the last step year's reads BASE's, TAX's and COV's claims at t + 1 are the same
  const F = t.fixed;
  if (F && F.arms && F.arms.BASE && Array.isArray(F.t)) for (const a of ['TAX', 'COV']) {
    const A = F.arms[a]; if (!A || !Array.isArray(A.claim)) continue;
    let off = 0; for (let j = 0; j < F.t.length; j++) if (F.t[j] === F.last && Math.abs(A.claim[j] - F.arms.BASE.claim[j]) > 2e-9) off++;
    if (off) bad.push(`${tag}: ${off} last-step-year claims of ${a} differ from BASE's (the later tables are not the same)`);
  }
  const same = (a, b) => t.arms[a] && t.arms[b] && t.arms[a].survived.every((v, j) => v === t.arms[b].survived[j]);
  if (u.id === 'bridge 0') { if (!(same('BASE', 'TAX') && same('BASE', 'COV'))) bad.push(`${tag}: the no-reader control's arms differ`); if (t.fixed && Array.isArray(t.fixed.t) && t.fixed.t.length) bad.push(`${tag}: the no-reader control has reader-year reads`); }
  if (u.id === 'S126 all-ISA' && !same('BASE', 'TAX')) bad.push(`${tag}: the no-tax control's BASE and TAX differ`);
  return bad;
}
export function loadFiles(units, dir, st, npw = NPW, read = f => (existsSync(f) ? JSON.parse(gunzipSync(readFileSync(f)).toString()) : null)) {
  const bad = [], files = {};
  for (const u of units) { const t = read(join(dir, fileOf(u.id))); bad.push(...checkFile(t, u, st, npw)); files[u.id] = t; }
  return { bad, files };
}

/* the paired change B against A: b lost (A survives, B fails), c saved */
export function paired(A, B) {
  let a = 0, b = 0, c = 0, d = 0; const N = A.length;
  for (let j = 0; j < N; j++) { const x = A[j], y = B[j]; if (x && y) a++; else if (x) b++; else if (y) c++; else d++; }
  return { a, b, c, d, N, base: (a + b) / N };
}
const harmItem = pairs => {
  const ph = holm(PANEL.map(id => mcnemarHarmP(pairs[id].b, pairs[id].c)));
  const rows = PANEL.map((id, i) => { const p = pairs[id], margin = marginFor(100 * p.base); return { id, margin, pHolm: ph[i], ...outcome({ b: p.b, c: p.c, N: p.N, margin, pHolm: ph[i] }) }; });
  return { rows, v: rows.some(r => r.outcome === 'harm') ? 'FALSIFIED' : rows.every(r => r.outcome === 'no material harm') ? 'HELD' : 'INCONCLUSIVE' };
};
const meanOf = a => (a.length ? a.reduce((p, q) => p + q, 0) / a.length : NaN);
/* item 3's statistic for arm X against BASE on the reads `pick` keeps among the last step year's same-move reads (the
   default), or on whatever `sel` selects: d = BASE's read - X's read, D = read - claim */
export function item3Of(F, X, pick, sel = j => F.t[j] === F.last && F.arms[X].same[j] === 1) {
  const B = F.arms.BASE, C = F.arms[X], d = [], DB = [], DC = [];
  for (let j = 0; j < F.t.length; j++) if (sel(j) && pick(j)) { d.push(B.read[j] - C.read[j]); DB.push(B.read[j] - B.claim[j]); DC.push(C.read[j] - C.claim[j]); }
  return { n: d.length, st: signTest(d), mB: meanOf(DB), mC: meanOf(DC), md: meanOf(d) };
}
export function items(files) {
  const P = (id, x, y) => paired(files[id].arms[x].survived, files[id].arms[y].survived);
  const one = harmItem(Object.fromEntries(PANEL.map(id => [id, P(id, 'BASE', 'COV')])));
  const two = harmItem(Object.fromEntries(PANEL.map(id => [id, P(id, 'BASE', 'TAX')])));
  const tests = PANEL.map(id => ({ id, ...item3Of(files[id].fixed, 'COV', j => true) })).filter(x => x.n > 0);
  const ph = holm(tests.map(x => x.st.p));
  tests.forEach((x, i) => { x.pHolm = ph[i]; x.down = x.st.pos > x.st.neg && x.pHolm < 0.05; x.up = x.st.neg > x.st.pos && x.pHolm < 0.05; x.closer = Math.abs(x.mC) < Math.abs(x.mB); });
  const v3 = !tests.length ? 'NOT READ' : tests.some(x => x.up) ? 'FALSIFIED' : tests.every(x => x.down && x.closer) ? 'HELD' : 'INCONCLUSIVE';
  return { one, two, three: { tests, v: v3 } };
}

const f2 = x => (Number.isFinite(x) ? x.toFixed(2) : '-'), f3 = x => (Number.isFinite(x) ? x.toFixed(3) : '-'), pv = x => (Number.isFinite(x) ? x.toExponential(2) : '-'), e4 = x => (Number.isFinite(x) ? x.toExponential(4) : '-');
export function reading(files, units, out = console.log) {
  const r = items(files);
  out(`COV-B-STEP: PMAP's unit (BASE), with the reader's tax (TAX, RTAX v2) and with the tax and the step-year edge node (COV, COV-B), on ${PANEL.join(', ')}; ORDER on S370 (O81); controls ${CONTROLS.join(' and ')}; ${3 * NPW} paired paths a household (seed ${SEED}), ${PTS} points`);
  for (const [nm, it, arm] of [['ITEM 1 (primary, harm): COV against BASE', r.one, 'COV'], ['ITEM 2 (primary, harm): TAX against BASE', r.two, 'TAX']]) {
    out(`\n${nm}, the paired survival change per household (b lost, c saved), the household's margin, harm's exact McNemar p Holm over ${PANEL.length}`);
    for (const x of it.rows) { const p = paired(files[x.id].arms.BASE.survived, files[x.id].arms[arm].survived); out(`  ${x.id.padEnd(14)} BASE ${f2(100 * p.base)}%  b ${p.b}  c ${p.c}  change ${f3(x.d)} [${f3(x.lo)}, ${f3(x.hi)}]  margin ${x.margin.toFixed(2)}  p Holm ${pv(x.pHolm)}  ${x.outcome}`); }
    out(`  -> ${it.v} (HELD when every household reads no material harm; FALSIFIED when any reads harm; else INCONCLUSIVE)`);
  }
  out(`\nITEM 3 (primary, mechanism): along BASE's paths at each household's last step year, on the reads where COV's chooser makes BASE's move, d = BASE's read less COV's at the same state and layer; the sign test per household, Holm over them; mean D = the read less the claim at t + 1 (the claims the same in both there: the gate)`);
  for (const x of r.three.tests) out(`  ${x.id.padEnd(14)} year ${files[x.id].fixed.last} reads ${x.n}  d > 0 ${x.st.pos}  d < 0 ${x.st.neg}  p Holm ${pv(x.pHolm)}  mean d ${e4(x.md)}  mean D BASE ${e4(x.mB)} COV ${e4(x.mC)}  ${x.down ? 'LOWER' : x.up ? 'HIGHER' : 'NOT SHOWN'}${x.closer ? ', closer' : ', not closer'}`);
  out(`  -> ${r.three.v} (HELD when every household with such reads shows COV's read lower and its mean error nearer 0; FALSIFIED when any shows it higher; else INCONCLUSIVE)`);
  out('\nREPORTED (not read as a verdict)');
  out('  COV against TAX, the paired survival change (the node\'s own effect, the tax held):');
  for (const id of PANEL) { const p = paired(files[id].arms.TAX.survived, files[id].arms.COV.survived); out(`    ${id.padEnd(14)} TAX ${f2(100 * p.base)}%  b ${p.b}  c ${p.c}  change ${f3(100 * (p.c - p.b) / p.N)} points`); }
  const s = files.S370, ch = (x, y) => { const p = paired(s.arms[x].survived, s.arms[y].survived); return { p, d: 100 * (p.c - p.b) / p.N }; };
  const c1 = ch('BASE', 'COV'), c2 = ch('ORDER', 'CORD'), c3 = ch('BASE', 'ORDER'), c4 = ch('COV', 'CORD');
  out(`  S370's 2x2 (points): COV - BASE ${f3(c1.d)} (b ${c1.p.b} c ${c1.p.c}); CORD - ORDER ${f3(c2.d)} (b ${c2.p.b} c ${c2.p.c}); ORDER - BASE ${f3(c3.d)}; CORD - COV ${f3(c4.d)}; the interaction (CORD - ORDER) - (COV - BASE) ${f3(c2.d - c1.d)}`);
  out('  TAX against BASE on item 3\'s reads (TAX\'s chooser making BASE\'s move), and item 3\'s statistic on every step year (S370\'s earlier step year is not clean: its claim\'s table differs by arm):');
  for (const id of PANEL) {
    const F = files[id].fixed; if (!F.t.length) continue;
    const tx = item3Of(F, 'TAX', () => true, j => F.t[j] === F.last && F.arms.TAX.same[j] === 1), all = item3Of(F, 'COV', () => true, j => F.kind[j] === 1 && F.arms.COV.same[j] === 1);
    const moved = F.t.reduce((c, t, j) => c + (t === F.last && F.arms.COV.same[j] === 0 ? 1 : 0), 0);
    out(`    ${id.padEnd(14)} TAX mean d ${e4(tx.md)} (reads ${tx.n}) | every step year: reads ${all.n} mean d ${e4(all.md)} mean D BASE ${e4(all.mB)} COV ${e4(all.mC)} | last-year reads where COV moves differently ${moved}`);
  }
  out('  the spread reads at fixed policy, mean D per arm by household, year and world (O81; reads, then each arm):');
  for (const id of PANEL) {
    const F = files[id].fixed, keys = Object.keys(F.arms), cells = new Map();
    for (let j = 0; j < F.t.length; j++) if (F.kind[j] === 0) { const q = `${F.t[j]}/${F.k[j]}`; if (!cells.has(q)) cells.set(q, []); cells.get(q).push(j); }
    for (const [q, js] of [...cells].sort((a, b) => a[0].localeCompare(b[0], 'en', { numeric: true }))) out(`    ${id.padEnd(14)} year/world ${q.padEnd(5)} reads ${String(js.length).padStart(5)} | ${keys.map(a => `${a} ${e4(meanOf(js.map(j => F.arms[a].read[j] - F.arms[a].claim[j])))}`).join(' ')}`);
  }
  for (const id of PANEL) { const u = units.find(x => x.id === id); out(`  ${id.padEnd(14)} moves ${Object.entries(u.moves).map(([a, v]) => `${a} ${v}`).join(' | ')}${Number.isFinite(u.rss) ? ` | peak memory ${u.rss} MB` : ''}`); }
  out(`\nOUTCOME: 1 ${r.one.v}; 2 ${r.two.v}; 3 ${r.three.v}`);
  return r;
}

/* ---- planted checks: a built set of logs and files, and faults planted in it ---- */
const ST = { code: 'abc', audit: 'def', prediction: 'none', sha: '-' };
const NB = 20;   // paths a world in the built set
function builtLog(o = {}) {
  const lines = ['stamp: code abc audit def prediction none sha -'];
  for (const id of UNITS) {
    if (o.skip === id) continue;
    const arms = armsOf(id), L = 'READER/TS+J/W0.02/PCLSI';
    lines.push(`${id.padEnd(16)} case | unit ${L} | lambda 0.0223606797749979 tier own riskAbove auto mix 3 | arms ${(o.armsOff && id === 'S370' ? arms.slice(0, 3) : arms).join(',')}`);
    for (const a of arms) lines.push(`${''.padEnd(16)} solve ${a}: secs 1 pts 30 shares ${a === 'COV' || a === 'CORD' ? 7 : 6} readerYears 2 stepYears ${o.cordOff && a === 'CORD' ? '2' : '1'} readerTax ${['TAX', 'COV', 'CORD'].includes(a) || (o.taxInBase && a === 'BASE' && id === 'S130') ? '1:900' : '-'} coverage ${(a === 'COV' && !(o.covOff && id === 'S126')) || a === 'CORD' ? '2/10' : '-'} readerRef ${a === 'ORDER' || a === 'CORD' ? 'order' : '-'}`);
    lines.push(`${''.padEnd(16)} ran ${L}: mix 3 pts 30 seed ${o.seedOff && id === 'bridge 4' ? 7001 : SEED} paths ${3 * NB} worlds 3 steps 1 access 2 years 40`);
    const f = builtFile(id, o);
    for (const a of arms) { const s = f.arms[a].survived.reduce((p, q) => p + q, 0); lines.push(`${''.padEnd(16)} sum ${a}: paths ${3 * NB} survived ${o.sumOff && id === 'S126' && a === 'TAX' ? s + 1 : s} pathsum 99 secs 1`); }
    for (const a of arms) lines.push(`${''.padEnd(16)} fixed ${a}: reads ${f.fixed.t.length} step ${f.fixed.kind.reduce((p, q) => p + q, 0)} last 0 lastYear 1 same 0 meanDstep 0 meanDspread 0`);
    for (const a of arms.slice(1)) lines.push(`${''.padEnd(16)} moves ${a}: step 1/0 before 1/0 (same/differ) secs 1`);
    if (!(o.notDone && id === 'S370')) lines.push(`${''.padEnd(16)} done ${L} rss 100MB`);
  }
  return lines.join('\n') + '\n';
}
/* a built file: 60 paths; BASE survives 54 (90%); o.scen[id] = { COV: [b, c], TAX: [b, c] }; fixed reads 30 a household in
   the panel (BASE's D 0.02, COV's o.cov[id] or 0.01, TAX 0.015), none on bridge 0 */
function builtFile(id, o = {}) {
  const N = 3 * NB, base = Array.from({ length: N }, (_, j) => (j < 54 ? 1 : 0)), arms = {};
  for (const a of armsOf(id)) {
    const v = base.slice(), [b, c] = ((o.scen || {})[id] || {})[a] || [0, 0];
    for (let j = 0; j < b; j++) v[j] = 0; for (let j = 0; j < c; j++) v[54 + j] = 1;
    if (o.ctrlOff && id === 'bridge 0' && a === 'COV') v[0] = 0;
    if (o.isaOff && id === 'S126 all-ISA' && a === 'TAX') v[1] = 0;
    arms[a] = { survived: v };
  }
  // fixed reads: nr at the last step year (year 1) and 10 spread reads (year 0); every claim 0; BASE reads 0.02, TAX 0.015,
  // ORDER 0.02, COV and CORD o.cov[id] or 0.01 (o.mixed: alternately 0.02 above and below on S370); o.moved: 10 more
  // last-year reads where COV moves differently, COV 0.05 there; o.spreadUp: COV 0.05 on the spread reads; o.claimOff: COV's
  // claim 0.001 on one last-year read of S130
  const nr = id === 'bridge 0' ? (o.readsOff ? 3 : 0) : id === 'S126 all-ISA' ? 10 : 30, ns = id === 'bridge 0' ? 0 : 10, nm = o.moved && PANEL.includes(id) ? 10 : 0;
  const N2 = nr + ns + nm, F = { t: [], k: [], kind: [], sup: [], last: 1, arms: {} };
  for (let j = 0; j < N2; j++) { const sp = j >= nr && j < nr + ns; F.t.push(sp ? 0 : 1); F.k.push(j % 3); F.kind.push(sp ? 0 : 1); F.sup.push(1); }
  for (const a of armsOf(id)) {
    const read = [], claim = [], same = [];
    for (let j = 0; j < N2; j++) {
      const sp = j >= nr && j < nr + ns, mv = j >= nr + ns, cv = a === 'COV' || a === 'CORD';
      let v = a === 'BASE' || a === 'ORDER' ? 0.02 : a === 'TAX' ? 0.015 : ((o.cov || {})[id] ?? 0.01) + (o.mixed && id === 'S370' ? (j % 2 ? 0.02 : -0.02) : 0);
      if (cv && sp && o.spreadUp) v = 0.05;
      if (cv && mv) v = 0.05;
      read.push(v); claim.push(o.claimOff && id === 'S130' && a === 'COV' && j === 0 ? 0.001 : 0); same.push(cv && mv ? 0 : 1);
    }
    F.arms[a] = { read, claim, same };
  }
  return { id, npw: NB, stamp: o.stOff && id === 'S370' ? { ...ST, audit: 'zzz' } : ST, arms, fixed: F };
}
const builtFiles = (o = {}) => Object.fromEntries(UNITS.map(id => [id, builtFile(id, o)]));
const builtRead = o => f => { if (o.missing && f.endsWith(fileOf('S126'))) return null; const id = UNITS.find(x => f.endsWith(fileOf(x))); return id ? builtFile(id, o) : null; };
const EDGES = [], REACHED = { 1: new Set(), 2: new Set(), 3: new Set() };
function planted() {
  const cases = [];
  const G = o => { const us = parse(builtLog(o)); const g = gate(us, { npw: NB }); return g.length ? g : loadFiles(us, '/x', ST, NB, builtRead(o)).bad; };
  cases.push(['a built set gates clean', String(G({}).length), '0']);
  for (const [nm, o] of [['a missing household', { skip: 'S126' }], ['a household not done', { notDone: true }], ['S370 without ORDER', { armsOff: true }], ['BASE with the reader\'s tax', { taxInBase: true }],
    ['COV without coverage', { covOff: true }], ['another seed', { seedOff: true }], ['a sum line off its file', { sumOff: true }], ['a file with another stamp', { stOff: true }], ['a missing file', { missing: true }],
    ['the no-reader control\'s arms differing', { ctrlOff: true }], ['the no-reader control with step reads', { readsOff: true }], ['the no-tax control\'s BASE and TAX differing', { isaOff: true }],
    ['CORD with other step years than COV', { cordOff: true }], ['a last-step-year claim differing between arms', { claimOff: true }]]) cases.push([`the gate refuses ${nm}`, String(G(o).length > 0), 'true']);
  const us = parse(builtLog({}));
  // every reading a plant makes records the outcomes it reached (OUTCOMES REACHED, check-prediction.mjs --outcomes)
  const R = o => { const r = reading(builtFiles(o), us, () => {}); REACHED[1].add(r.one.v); REACHED[2].add(r.two.v); REACHED[3].add(r.three.v); return r; };
  // ITEM 1 and 2: no discordant path anywhere reads no material harm (the EDGE: 0 of 0)
  { const r = R({}); cases.push(['0 discordant paths reads items 1 and 2 HELD', `${r.one.v} ${r.two.v}`, 'HELD HELD']); } EDGES.push('0 of 0 discordant paths');
  // a clear harm: 10 lost of 60 on one household (exact p 0.001, Holm over 4 0.004) -> FALSIFIED; 6 lost (p 0.016, Holm 0.0625)
  // is not harm after Holm (the EDGE: a loss significant alone but not over the 4) -> INCONCLUSIVE
  cases.push(['10 lost, none saved under COV on S130 reads item 1 FALSIFIED', R({ scen: { S130: { COV: [10, 0] } } }).one.v, 'FALSIFIED']);
  cases.push(['10 lost, none saved under TAX on S126 reads item 2 FALSIFIED', R({ scen: { S126: { TAX: [10, 0] } } }).two.v, 'FALSIFIED']);
  cases.push(['6 lost, none saved under COV on S130 reads item 1 INCONCLUSIVE after Holm', R({ scen: { S130: { COV: [6, 0] } } }).one.v, 'INCONCLUSIVE']); EDGES.push('a loss significant alone but not after Holm over 4');
  // one lost of 60: too wide to be no harm, too small to be harm -> INCONCLUSIVE
  cases.push(['6 lost, none saved under TAX on S126 reads item 2 INCONCLUSIVE after Holm', R({ scen: { S126: { TAX: [6, 0] } } }).two.v, 'INCONCLUSIVE']);
  cases.push(['1 lost of 60 under COV reads item 1 INCONCLUSIVE', R({ scen: { S370: { COV: [1, 0] } } }).one.v, 'INCONCLUSIVE']);
  // ITEM 3: COV's read lower on every read of every household (d 0.01 > 0, 30 of 30, p tiny) and nearer 0 -> HELD
  cases.push(['COV lower and nearer 0 everywhere reads item 3 HELD', R({}).three.v, 'HELD']);
  // COV higher on one household (d < 0) -> FALSIFIED
  cases.push(['COV higher on S370 reads item 3 FALSIFIED', R({ cov: { S370: 0.03 } }).three.v, 'FALSIFIED']);
  // COV equal to BASE on one household: no sign to test (the EDGE: d = 0 on every read) -> INCONCLUSIVE
  cases.push(['COV equal to BASE on bridge 4 reads item 3 INCONCLUSIVE', R({ cov: { 'bridge 4': 0.02 } }).three.v, 'INCONCLUSIVE']); EDGES.push('d = 0 on every read of a household');
  // COV lower but overshooting (mean D -0.03: further from 0 than BASE's 0.02) -> lower but not closer: INCONCLUSIVE
  cases.push(['COV lower but further from 0 on S126 reads item 3 INCONCLUSIVE', R({ cov: { S126: 0.05 - 0.1 } }).three.v, 'INCONCLUSIVE']); EDGES.push('a read lower but past 0 (an overshoot)');
  // mixed signs on S370 (half above, half below BASE's): the sign test cannot show a direction -> INCONCLUSIVE
  cases.push(['mixed signs on S370 reads item 3 INCONCLUSIVE', R({ mixed: true, cov: { S370: 0.02 } }).three.v, 'INCONCLUSIVE']);
  // reads where COV's chooser moves differently (COV higher there) and spread reads (COV higher) are not item 3's -> still HELD
  cases.push(['COV higher only where it moves differently reads item 3 HELD', R({ moved: true }).three.v, 'HELD']); EDGES.push('the last-year reads where COV moves differently, left out');
  cases.push(['COV higher only on the spread reads reads item 3 HELD', R({ spreadUp: true }).three.v, 'HELD']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}
const logsOf = Dir => (existsSync(Dir) ? Object.fromEntries(readdirSync(Dir).filter(f => /^case\d+\.txt$/.test(f)).sort().map(f => [f, readFileSync(join(Dir, f), 'utf8')])) : {});
export { builtLog, logsOf };
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\n${[1, 2, 3].map(k => `OUTCOMES REACHED: item ${k}: ${[...REACHED[k]].sort().join(', ')}`).join('\n')}\nEDGES: ${EDGES.join(', ')}`); process.exit(0); }
  const args = process.argv.slice(2).filter(x => !x.startsWith('--'));
  const DIR = args[0] || join(HERE, 'results', 'diagcovb'), npw = Number(args[1] || NPW), pts = args[2] || PTS;
  const logs = logsOf(DIR), units = Object.values(logs).flatMap(parse);
  if (units.filter(u => u.done).length < UNITS.length) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${UNITS.length} households done in ${DIR}`); process.exit(1); }
  requireFairLogs(logs, PRED);
  const bad = gate(units, { pts, npw });
  const tr = bad.length ? { bad: [], files: {} } : loadFiles(units, DIR, stampOf(Object.values(logs)[0]), npw);
  bad.push(...tr.bad);
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${UNITS.length} households (${PANEL.length} and the controls ${CONTROLS.join(' and ')}), each once and done with its arms; each arm's settings taking; seed ${SEED}, ${pts} points, ${3 * npw} paths; every file stamped as the logs, its survivors equal to the sum lines; the controls identical where they must be`);
  reading(tr.files, units);
}
