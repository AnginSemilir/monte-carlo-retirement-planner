/*
 * THE F1 V2 TEST'S REDUCER, ON PLANTED LOGS (research/solver/read-f1v2.mjs; RULES.md: a check is trusted only after it
 * has failed on a planted fault). A clean log of the twenty cases reads NOT FALSIFIED; each planted fault is caught -
 * the fair-test gate refuses arms that differ beyond the bridge read, a run in the fold, a menu not capped at 1.1 and
 * arms that do not differ at all; the falsifier fires on an in-class misread, an inflow case misread and a survival loss.
 */
import assert from 'node:assert/strict';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const S = mkdtempSync(join(tmpdir(), 'read-f1v2-'));
const CASES = ['S126', 'share 0.50', 'share 0.70', 'share 0.78', 'share 0.90', 'share 0.95', 'bridge 0', 'bridge 1', 'bridge 4', 'bridge 6', 'wealth x0.5', 'wealth x2', 'S120', 'S122', 'S124', 'S128', 'S130', 'S360', 'S366', 'S370'];
const ran = br => `mix 3 pts 16 lambda 0.0223606797749979 levels 1.1,1,0.95,0.9,0.8 raiseSurv true failShort floor tiersAbove 1 minPot 25000 bridgeRead ${br}`;
const f = x => x.toFixed(1).padStart(5);
function mk(over = {}) {
  let out = 'F1 V2 TEST, planted\n';
  for (const id of CASES) {
    const o = { tOff: 50, sOff: 99, tOn: 98, sOn: 99, tierOff: 40, tierOn: 10, d: 0, se: 0.1, rOff: ran('false'), rOn: ran(2), ...(over[id] || {}) };
    if (id === 'S360' && !over[id]?.tOn) { o.tOn = 30; o.sOn = 44; }
    if (id === 'bridge 0') { o.tOn = o.tOff = 99; o.sOn = o.sOff = 99; o.tierOn = o.tierOff = 6; }
    if (id.startsWith('share 0.5') || id.startsWith('share 0.7')) { o.tOn = o.tOff = 99; o.sOn = o.sOff = 99; }
    out += `${id.padEnd(16)} a0 0.85 B 2 class YES | OFF table ${f(o.tOff)} sim ${f(o.sOff)} gap ${(o.tOff - o.sOff).toFixed(1).padStart(6)} tier-below ${o.tierOff.toFixed(1).padStart(4)} below  1.0 | V2 table ${f(o.tOn)} sim ${f(o.sOn)} gap ${(o.tOn - o.sOn).toFixed(1).padStart(6)} tier-below ${o.tierOn.toFixed(1).padStart(4)} below  1.0 | survival ${o.d >= 0 ? '+' : ''}${o.d.toFixed(2)} +/- ${o.se.toFixed(2)} | 10 s\n`;
    out += `                 ran OFF: ${o.rOff}\n                 ran V2:  ${o.rOn}\n`;
  }
  return out;
}
const plants = {
  clean: [{}, 'NOT FALSIFIED'],
  'arms differ (mix)': [{ S124: { rOn: ran(2).replace('mix 3', 'mix 0') } }, 'GATE FAILED'],
  'no bridge difference': [{ S126: { rOn: ran('false') } }, 'GATE FAILED'],
  'fold, both arms': [Object.fromEntries(CASES.map(id => [id, { rOff: ran('false').replace('mix 3', 'mix 0'), rOn: ran(2).replace('mix 3', 'mix 0') }])), 'GATE FAILED'],
  'raise cap missing': [Object.fromEntries(CASES.map(id => [id, { rOff: ran('false').replace('levels 1.1', 'levels 1.2,1.1'), rOn: ran(2).replace('levels 1.1', 'levels 1.2,1.1') }])), 'GATE FAILED'],
  'in-class misread 12': [{ 'bridge 4': { tOn: 87 } }, 'FALSIFIED'],
  'S366 misread 20': [{ S366: { tOn: 79 } }, 'FALSIFIED'],
  'survival loss 3 se': [{ S122: { d: -0.3, se: 0.1 } }, 'FALSIFIED'],
};
let n = 0;
for (const [name, [over, want]] of Object.entries(plants)) {
  const p = join(S, 'planted-f1v2.txt'); writeFileSync(p, mk(over));
  let out, code = 0;
  try { out = execFileSync('node', ['research/solver/read-f1v2.mjs', p], { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { out = (e.stdout || '').toString() + (e.stderr || '').toString(); code = e.status; }
  const got = out.includes('FAIR-TEST GATE: FAILED') ? 'GATE FAILED' : (out.match(/=> (\S+(?: \S+)?)/) || [, 'no verdict'])[1];
  assert.equal(got, want, `${name}: ${got}`);
  assert.equal(code, want === 'GATE FAILED' ? 1 : 0, `${name}: exit ${code}`);
  n++; console.log(`PASS  ${name}: ${got}`);
}
console.log(`\n${n} passed`);
