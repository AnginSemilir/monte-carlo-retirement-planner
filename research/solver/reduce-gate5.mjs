/*
 * GATE 5 AFTER N4 AND INSTRUCTION 6 (STATE.md D11, D24 (3), D25, D26; a MEASUREMENT, launched with PREDICTION="none:...").
 * audit-e2x.mjs on SIZE's four households, one at a time on a machine running nothing else: the candidate at 45 wealth
 * points (D26) on one core (CAND) and split across four (SPLIT: E2, the reference's build split too, instruction 6), against
 * the product as it ships, at its own 30 points, on one core (PRODUCT: the ported product, S1 and S2 on; D24 (3)).
 * THE GATE: the stamps (fair-gate.mjs requireFairLogs: every log launched through run-from-snapshot.sh as a measurement,
 * `prediction none sha -`, one version of the code and the audit across them); E2X's own (reduce-e2x.mjs parse and gate, at the candidate's 45 points: each household once and done, three
 * times each, CAND and SPLIT running the candidate on 1 and 4 parts, every comparison on its arrays, the plant on S126),
 * and beside it every case's `product points` line at 30, every log from one code, and every case's `candidate` line the
 * candidate as candidate.mjs has it now (CANDIDATE_HASH; the reviewer of 25 Oct, finding 2), each arm's menu the same.
 * THE READING (reduce-e2x.mjs verdict): E2 EXACT when every household's split tables are the same bit for bit and the plant
 * is caught; GATE 5 MET when on each household the split candidate's wall-clock is at most 1.25 times the product's solve,
 * NOT MET when any is over (each named with its ratio), not read when the split is not exact.
 *   node research/solver/reduce-gate5.mjs [dir] > research/solver/results-gate5.txt
 *   node research/solver/reduce-gate5.mjs --planted   the planted checks alone
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, gate, verdict, logsOf, PANEL, ARMS, PARTS, BUDGET } from './reduce-e2x.mjs';
import { requireFairLogs } from './fair-gate.mjs';
import { CANDIDATE_HASH } from './candidate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CAND_PTS = 45, PRODUCT_PTS = 30;
const CASEL = /^(\S.*?)\s+case \| points (\d+) \| lambda \S+ \| parts \d+$/, PPL = /^\s+product points (\d+)$/, STAMPL = /^stamp: code (\S+) audit (\S+)/;
const CANDL = /^\s+candidate (\w+)$/, MENUL = /^\s+menu (CAND|SPLIT): (.*)$/;

/* each case's product grid, the candidate it timed and each arm's menu, and each log's code stamp */
function extras(logs) {
  const product = {}, cand = {}, menu = {}, codes = new Set();
  for (const text of Object.values(logs)) {
    let cur = null;
    for (const line of text.split('\n')) {
      let m;
      if ((m = STAMPL.exec(line))) codes.add(m[1]);
      else if ((m = CASEL.exec(line))) cur = m[1].trim();
      else if (cur && (m = PPL.exec(line))) (product[cur] = product[cur] || []).push(+m[1]);
      else if (cur && (m = CANDL.exec(line))) (cand[cur] = cand[cur] || []).push(m[1]);
      else if (cur && (m = MENUL.exec(line))) (menu[cur] = menu[cur] || {})[m[1]] = m[2];
    }
  }
  return { product, cand, menu, codes };
}
export function gate5(logs, want = CANDIDATE_HASH) {
  const units = Object.values(logs).flatMap(parse), bad = gate(units, { pts: CAND_PTS }), { product, cand, menu, codes } = extras(logs);
  for (const id of PANEL) if (!product[id] || product[id].length !== 1 || product[id][0] !== PRODUCT_PTS) bad.push(`${id}: product points ${product[id] ? product[id].join(', ') : 'missing'}, not ${PRODUCT_PTS} once`);
  for (const id of PANEL) if (!cand[id] || cand[id].length !== 1 || cand[id][0] !== want) bad.push(`${id}: the candidate timed ${cand[id] ? cand[id].join(', ') : 'not stamped'}, not ${want} once`);
  for (const id of PANEL) if (!menu[id] || !menu[id].CAND || menu[id].CAND !== menu[id].SPLIT) bad.push(`${id}: the arms' menus ${menu[id] ? `CAND ${menu[id].CAND} / SPLIT ${menu[id].SPLIT}` : 'not printed'}, not the same`);
  if (codes.size !== 1) bad.push(`the logs carry ${codes.size} codes (${[...codes].join(' ')}), not one`);
  return { units, bad, code: [...codes][0] };
}
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
export function reading(units, code, out = console.log) {
  const us = PANEL.map(id => units.find(u => u.id === id)), v = verdict(us);
  out(`GATE 5 AFTER N4 AND INSTRUCTION 6 (a measurement; D11, D24 (3), D25, D26): ${PANEL.join(', ')}, one at a time, code ${code}; the product as it ships at ${PRODUCT_PTS} points on one core (PRODUCT), the candidate at ${CAND_PTS} points on one core (CAND) and split across ${PARTS} cores (SPLIT); every table of CAND and SPLIT compared bit for bit`);
  out(`  household        differ/values         PRODUCT s  CAND s  SPLIT s  CAND/PRODUCT  SPLIT/PRODUCT  speed-up`);
  for (const u of us) {
    const P = u.time.PRODUCT.secs, C = u.time.CAND.secs, S = u.time.SPLIT.secs;
    out(`  ${u.id.padEnd(16)} ${`${u.e2x.differ}/${u.e2x.values}`.padEnd(20)}  ${P.toFixed(1).padStart(9)}  ${C.toFixed(1).padStart(6)}  ${S.toFixed(1).padStart(7)}  ${(C / P).toFixed(3).padStart(12)}  ${(S / P).toFixed(3).padStart(13)}  ${(C / S).toFixed(2).padStart(8)}`);
  }
  out(`  median: CAND/PRODUCT x${med(us.map(u => u.time.CAND.secs / u.time.PRODUCT.secs)).toFixed(3)}, SPLIT/PRODUCT x${med(us.map(u => u.time.SPLIT.secs / u.time.PRODUCT.secs)).toFixed(3)}, the split's speed-up x${med(us.map(u => u.time.CAND.secs / u.time.SPLIT.secs)).toFixed(2)}`);
  out(`  load (1-minute average) at each timing's start: ${us.map(u => `${u.id} ${ARMS.map(a => u.time[a].load.toFixed(2)).join('/')}`).join('; ')}`);
  out(`PLANTED: a dropping part on S126 differs in ${us.find(u => u.id === 'S126').planted} values`);
  out(`\nVERDICT E2: ${v.e2}${v.off.length ? `\n  ${v.off.join('\n  ')}` : ''}`);
  out(`VERDICT GATE 5 (the split candidate at ${CAND_PTS} points at most x${BUDGET} the product's solve at ${PRODUCT_PTS}, on each household): ${v.g5}${v.over.length ? `\n  ${v.over.join('\n  ')}` : ''}`);
  return v;
}

// planted logs: the audit's lines as it prints them, with one fault each
function builtLogs(o = {}) {
  const lines = [`stamp: code abc audit def prediction none sha -`];
  for (const id of PANEL) {
    lines.push(`${id.padEnd(16)} case | points ${o.candPts && id === 'S370' ? 30 : CAND_PTS} | lambda 0.0223606797749979 | parts 4`);
    if (!(o.noProduct && id === 'S126')) lines.push(`${''.padEnd(16)} product points ${o.prodPts && id === 'bridge 4' ? 45 : PRODUCT_PTS}`);
    if (!(o.noCand && id === 'S370')) lines.push(`${''.padEnd(16)} candidate ${o.oldCand && id === 'S126' ? 'e65e5e99ba49' : 'cafe00000001'}`);
    const split = o.slow && id === 'bridge 4' ? 160 : o.edge && id === 'S370' ? 150 : 100;
    lines.push(`${''.padEnd(16)} time PRODUCT: secs 120.0 load 0.10 0.20 0.30`, `${''.padEnd(16)} time CAND: secs 400.0 load 1.00 0.90 0.80`, `${''.padEnd(16)} time SPLIT: secs ${split.toFixed(1)} load 1.00 1.00 0.90`);
    lines.push(`${''.padEnd(16)} ran CAND: bridgeRead reader tierState true jointWorlds true e3 true pclsInterp true switchCharge 0.001 parts 1`, `${''.padEnd(16)} ran SPLIT: bridgeRead reader tierState true jointWorlds true e3 true pclsInterp true switchCharge 0.001 parts 4`);
    lines.push(`${''.padEnd(16)} menu CAND: tiersBelow 3 tableDealing true tsOnce false moves 800`, `${''.padEnd(16)} menu SPLIT: tiersBelow 3 tableDealing true tsOnce false moves ${o.menuSplit && id === 'share 0.50' ? 600 : 800}`);
    lines.push(`${''.padEnd(16)} e2x: arrays 240 values 900000 differ ${o.differ && id === 'S370' ? 7 : 0} evaluated 1000 1000 e3copied 50 50`);
    if (id === 'S126') lines.push(`${''.padEnd(16)} planted SPLIT: a dropping part at 4 points differ 4321`);
    lines.push(`${''.padEnd(16)} done`);
  }
  const logs = { 'case0.txt': lines.join('\n') + '\n' };
  if (o.twoCodes) logs['case1.txt'] = 'stamp: code xyz audit def prediction none sha -\n';
  return logs;
}
function planted() {
  const W = 'cafe00000001', cases = [], refused = o => String(gate5(builtLogs(o), W).bad.length > 0), v = o => verdict(PANEL.map(id => gate5(builtLogs(o), W).units.find(u => u.id === id)));
  cases.push(['a built set gates clean', String(gate5(builtLogs(), W).bad.length), '0']);
  for (const [nm, o] of [['the candidate at another grid', { candPts: true }], ['the product at the candidate\'s grid', { prodPts: true }], ['a case with no product points line', { noProduct: true }], ['logs from two codes', { twoCodes: true }], ['a case that timed 7u-F\'s candidate', { oldCand: true }], ['a case with no candidate stamp', { noCand: true }], ['a split whose menu is not the candidate\'s', { menuSplit: true }]])
    cases.push([`the gate refuses ${nm}`, refused(o), 'true']);
  cases.push(['every split under x1.25 the product: MET', v({}).g5, 'MET']);
  cases.push(['bridge 4 split at x1.333: NOT MET, named', `${v({ slow: true }).g5} ${v({ slow: true }).over[0]}`, "NOT MET bridge 4: x1.333 the product's"]);
  cases.push(['S370 split at exactly x1.25: MET (at most)', v({ edge: true }).g5, 'MET']);
  cases.push(['7 values differ on S370: E2 NOT EXACT, gate 5 not read', `${v({ differ: true }).e2} / ${v({ differ: true }).g5}`, 'NOT EXACT / NOT READ (E2 not exact)']);
  const fails = cases.filter(([, got, want]) => got !== want);
  if (fails.length) { console.log(`PLANTED CHECK FAILED:\n  ${fails.map(([nm, got, want]) => `${nm}: got ${got}, want ${want}`).join('\n  ')}`); process.exit(1); }
  return cases.length;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const np = planted();
  if (process.argv.includes('--planted')) { console.log(`planted (${np}): all read as they should\nEDGES: a split at exactly x1.25 the product, the product at the candidate's grid, logs from two codes, a case that timed another candidate`); process.exit(0); }
  const DIR = process.argv.slice(2).find(x => !x.startsWith('--')) || join(HERE, 'results', 'diaggate5');
  const logs = logsOf(DIR), { units, bad, code } = gate5(logs);
  if (PANEL.some(id => !units.some(u => u.id === id && u.done))) { console.log(`INCOMPLETE - ${units.filter(u => u.done).length} of ${PANEL.length} households done in ${DIR}`); process.exit(1); }
  // a measurement launch stamps `prediction none sha -` (run-from-snapshot.sh's PREDICTION=none:): no registration's blob to
  // match, so the blob wanted is '-'; a log launched outside the launcher, under a registration, or from another code fails
  requireFairLogs(logs, 'none', { blob: () => '-' });
  if (bad.length) { console.log(`GATE: FAILED\n  ${bad.join('\n  ')}`); process.exit(1); }
  console.log(`GATE: passed - ${PANEL.length} households, each once and done, the candidate ${CANDIDATE_HASH} (each case's stamp) at ${CAND_PTS} points and the product at ${PRODUCT_PTS}, PRODUCT, CAND and SPLIT timed, CAND and SPLIT the candidate on 1 and ${PARTS} parts, every comparison on its arrays, the plant on S126, one code`);
  reading(units, code);
}
