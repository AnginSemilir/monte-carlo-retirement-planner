/*
 * THE COUPLES' DEFAULT AND THE GUARD (D99, 14 Nov: item 6's stage C read once, PASS, research/solver/results-couples-share.txt;
 * the maintainer's D97 (1)). By the registration (research/solver/registrations/couples-share.md, Outcomes) a PASS makes
 * `shareRule: 'pots'` the couples' default and lifts M4's guard for couples whose elder holds more than 60% and at most 90% of
 * the pots, and D97 (1) runs couples under the opt-in; "for what the panel tested", every couple of which had its elder
 * entered first (the deep review of 14 Nov: the joint move weighs both estates at the first person's table's weight). This holds
 * the code to that and to STATE.md's decided-defaults block:
 *   1. the decided-defaults block's `couples` entry is the code's: the switch on (src/couplesSwitch.js COUPLES), the couples'
 *      share rule (src/solverSettings.js APP_COUPLE), the band (COUPLE_BAND), the elder's limit (ELDER_UP_TO) and the elder
 *      entered first (ELDER_FIRST); a block without the entry, or with another rule, fails it;
 *   2. the guard (coupleSolverOn): over the library's 210 couples, each re-held at twelve shares of its first person's from 5%
 *      to 95% (every wrapper alike), with their ages as entered, swapped (the first person the younger), the same, and the
 *      partner's age left blank, on exactly where the first person holds 40% to 60% of the pots, or the first person is the
 *      elder by the engine's own reading of their ages (App.jsx buildContext's ageSelf0 and agePart0) and holds more than 60%
 *      and at most 90%; its `why` 'uneven' everywhere else (an elder entered second and holding 60% to 90% among them), and
 *      'off' with the switch off;
 *   3. the page's solve of a couple (src/solverClient.js startSolve, its workers in-process stand-ins that record what each is
 *      asked): a couple held 90/10 is cut and assembled on the pots' share, each person's plan cut on 90% and 10% of the
 *      household's spending, the job's record naming 'pots' and 0.9; a rule the caller names ('half') is kept; and the
 *      solver's own default stays the half share (src/solverCouple.js couplePlans unasked), the app's default living in the
 *      app's settings as the candidate's do.
 * Plants (--planted runs each and wants its checks to fail): 'firstnotelder' (src/couplesSwitch.js: the first person taken for
 * the elder whatever the ages: check 2), 'eldereither' (src/couplesSwitch.js: the guard lifted for an elder entered second too,
 * as D99's first draft: check 2), 'halfdefault' (src/solverClient.js: a couple solved on the half share unless asked otherwise,
 * as before D99: check 3). Check 1's planted blocks run in every run.
 *   node research/tests/couple-default.test.mjs [--planted]
 */
import * as E from '../engine.mjs';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { COUPLES, COUPLE_BAND, ELDER_UP_TO, ELDER_FIRST, coupleSolverOn, elderOf, PLANT as SWITCH_PLANT } from '../../src/couplesSwitch.js';
import { APP_COUPLE } from '../../src/solverSettings.js';
import { couplePlans } from '../../src/solverCouple.js';
import { buildScenarios } from '../policy-study/scenarios.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
if (process.argv.includes('--planted')) {
  let bad = 0;
  for (const [plant, want] of [['firstnotelder', ['2']], ['eldereither', ['2']], ['halfdefault', ['3']]]) {
    let out = '';
    try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_DEFAULT_PLANT: plant }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
    const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), okp = want.every(c => failed.includes(c)) && failed.every(c => want.includes(c));
    console.log(`plant '${plant}': the checks that fail: ${failed.join(', ') || 'none'}; wanted ${want.join(', ')}: ${okp ? 'yes' : 'NO'}`);
    if (!okp) bad++;
  }
  process.exit(bad ? 1 : 0);
}
const PLANTED = process.env.COUPLE_DEFAULT_PLANT || '';
if (PLANTED === 'firstnotelder' || PLANTED === 'eldereither') SWITCH_PLANT.rule = PLANTED;

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };

// 1. the decided-defaults block's couples entry against the code
{ const blockOf = text => { const m = /<!-- decided-defaults([\s\S]*?)-->/.exec(text); return m ? JSON.parse(m[1]) : null; };
  const code = { on: COUPLES, shareRule: APP_COUPLE.shareRule, band: [...COUPLE_BAND], elderUpTo: ELDER_UP_TO, elderFirst: ELDER_FIRST };
  const agrees = D => !!(D && D.couples) && JSON.stringify(D.couples) === JSON.stringify(code);
  const D = blockOf(readFileSync(join(HERE, '../solver/STATE.md'), 'utf8'));
  const without = D ? { ...D } : null; if (without) delete without.couples;
  const half = D ? { ...D, couples: { ...D.couples, shareRule: 'half' } } : null;
  ok('1. the decided-defaults block\'s couples entry is the code\'s (the switch, the share rule, the band, the elder\'s limit, the elder entered first); planted, a block without it or with the half share fails',
    agrees(D) && !agrees(without) && !agrees(half), `the block ${JSON.stringify(D && D.couples)}; the code ${JSON.stringify(code)}`); }

// 2. the guard over the library's couples, re-held, under four arrangements of their ages
const lib = buildScenarios(), couples = lib.filter(s => s.plan.demographics.planningMode === 'couple');
const reheld = (plan, f) => { const re = JSON.parse(JSON.stringify(plan)), tot = {};
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); tot[k] = (tot[k] || 0) + (Number(a.balance) || 0); }
  for (const a of re.accounts) { const k = a.id.replace(/_(self|part)$/, ''); if (/_self$/.test(a.id)) a.balance = tot[k] * f; else if (/_part$/.test(a.id)) a.balance = tot[k] * (1 - f); }
  return re; };
const withAges = (plan, how) => { const re = JSON.parse(JSON.stringify(plan)), d = re.demographics;
  if (how === 'swapped') [d.currentAgeSelf, d.currentAgePart] = [d.currentAgePart, d.currentAgeSelf];
  else if (how === 'same') d.currentAgePart = d.currentAgeSelf;
  else if (how === 'blank') d.currentAgePart = '';
  return re; };
{ const SHARES = [0.05, 0.1, 0.25, 0.39, 0.4, 0.5, 0.6, 0.61, 0.75, 0.9, 0.91, 0.95];
  let n = 0, differ = 0, on = 0, elderSeen = { self: 0, part: 0, none: 0 }, mismatchAge = 0, offWhy = 0, elderSecond = 0;
  const first = [];
  for (const c of couples) for (const how of ['entered', 'swapped', 'same', 'blank']) {
    const aged = withAges(c.plan, how), ctx = E.buildContext(E.resolveMpaa(E.normalizePlan(aged)));
    const engineElder = ctx.ageSelf0 > ctx.agePart0 ? 'self' : ctx.agePart0 > ctx.ageSelf0 ? 'part' : null;
    if (elderOf(aged) !== engineElder) mismatchAge++;
    elderSeen[engineElder || 'none']++;
    for (const f of SHARES) {
      const p = reheld(aged, f), of = w => p.accounts.filter(a => a.id.endsWith('_' + w)).reduce((t, a) => t + (Number(a.balance) || 0), 0);
      const share = of('self') / (of('self') + of('part'));
      // the elder entered first: only the first person, the elder, holding more lifts the guard
      const held = engineElder === 'self' ? share : null, inBand = share >= 0.4 - 1e-9 && share <= 0.6 + 1e-9;
      const want = inBand || (held !== null && held > 0.6 + 1e-9 && held <= 0.9 + 1e-9);
      if (engineElder === 'part' && !inBand && 1 - share > 0.6 + 1e-9 && 1 - share <= 0.9 + 1e-9) elderSecond++;
      const got = coupleSolverOn(p, true);
      n++; if (got.on) on++;
      if (got.on !== want || got.why !== (want ? null : 'uneven')) { differ++; if (first.length < 3) first.push(`${c.id} ${how} ${f}: ${got.on} against ${want}`); }
      if (coupleSolverOn(p, false).why !== 'off') offWhy++;
    }
  }
  ok('2. the guard: on exactly where the first person holds 40% to 60%, or is the elder by the engine\'s ages and holds more than 60% and at most 90%; \'uneven\' elsewhere, an elder entered second among them; \'off\' with the switch off',
    couples.length === 210 && n === 210 * 4 * 12 && differ === 0 && mismatchAge === 0 && offWhy === 0 && elderSeen.part > 0 && elderSeen.self > 0 && elderSeen.none > 0 && elderSecond > 0,
    `${n} plans, ${on} on, ${differ} differing${first.length ? ` (${first.join('; ')})` : ''}; the switch's elder against the engine's ages ${mismatchAge} differing; the elder the first person ${elderSeen.self}, the partner ${elderSeen.part}, neither ${elderSeen.none} (couple-arrangements); an elder entered second holding more than 60% and at most 90%, kept off: ${elderSecond} plans; 'off' wrong ${offWhy}`); }

// 3. the page's solve of a couple: what the client asks its workers, by in-process stand-ins that record it
{ const asked = [];
  class StandIn {
    constructor() { this.onmessage = null; this.onerror = null; this.dead = false; }
    postMessage(data) { setImmediate(() => this.handle(data)); }
    terminate() { this.dead = true; }
    reply(m) { setImmediate(() => { if (!this.dead && this.onmessage) this.onmessage({ data: m }); }); }
    handle(data) {
      if (this.dead) return;
      const { id, kind } = data;
      try {
        if (kind === 'couple-plans') { const cut = couplePlans(E, data.plan, { shareRule: data.shareRule }); asked.push({ kind, shareRule: data.shareRule, share: cut.share, spend: [cut.plans.self.spending.targetSpend, cut.plans.part.spending.targetSpend] }); this.reply({ id, ...cut }); return; }
        if (kind === 'solve') { asked.push({ kind, slot: data.slot || null }); this.reply({ id: 0, done: true, meta: {}, secs: 0, restored: false }); return; }
        if (kind === 'couple') { asked.push({ kind, shareRule: data.shareRule }); this.reply({ id, done: true, meta: {} }); return; }
        throw new Error(`no '${kind}' here`);
      } catch (e) { this.reply({ id, error: e.message }); }
    }
  }
  globalThis.Worker = StandIn;
  const C = await import('../../src/solverClient.js');
  if (PLANTED === 'halfdefault') C.PLANT.rule = 'halfdefault';
  const c = couples.find(x => x.id === 'S069') || couples[0], p90 = reheld(c.plan, 0.9);
  const run = async couple => { asked.length = 0; const job = C.startSolve(p90, { parts: 1, couple }); const d = await job.done; job.close(); return { d, asked: asked.slice() }; };
  const byDefault = await run({ engine: E }), named = await run({ engine: E, shareRule: 'half' });
  const cut = byDefault.asked.find(a => a.kind === 'couple-plans'), joined = byDefault.asked.find(a => a.kind === 'couple');
  const target = Number(E.normalizePlan(p90).spending.targetSpend);
  const spendOk = !!cut && Math.abs(cut.spend[0] - 0.9 * target) < 1 && Math.abs(cut.spend[1] - 0.1 * target) < 1;
  const cutH = named.asked.find(a => a.kind === 'couple-plans'), joinedH = named.asked.find(a => a.kind === 'couple');
  const research = couplePlans(E, p90);
  ok('3. the page solves a couple on the pots\' share: held 90/10, cut and assembled on \'pots\', each person on 90% and 10% of the spending, the record naming it; a named \'half\' kept; the solver\'s own default the half share',
    !!cut && cut.shareRule === 'pots' && !!joined && joined.shareRule === 'pots' && spendOk && byDefault.d.couple.shareRule === 'pots' && Math.abs(byDefault.d.couple.share - 0.9) < 1e-9
      && !!cutH && cutH.shareRule === 'half' && !!joinedH && joinedH.shareRule === 'half' && named.d.couple.shareRule === 'half' && named.d.couple.share === 0.5
      && research.shareRule === 'half' && research.share === 0.5,
    `${c.id} held 90/10, target ${target}: asked to cut on ${cut && cut.shareRule} (each person's spending ${cut ? cut.spend.map(x => Math.round(x)).join(' and ') : '-'}), to assemble on ${joined && joined.shareRule}, the record ${byDefault.d.couple.shareRule} at ${byDefault.d.couple.share}; named 'half': ${cutH && cutH.shareRule}, ${joinedH && joinedH.shareRule}, ${named.d.couple.shareRule} at ${named.d.couple.share}; couplePlans unasked: ${research.shareRule} at ${research.share}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
