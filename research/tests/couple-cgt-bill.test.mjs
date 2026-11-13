/*
 * A COUPLE PAYS A CAPITAL GAINS BILL FROM THE HOUSEHOLD'S MONEY (13 Nov 2026; the deep review of the couples' read,
 * research/solver/reviews/2026-11-13-deep-couples-d4b.md section 2 (a)).
 *
 * The engine settled a person's bill from that person's cash, taxable account and ISA, then either person's cash, then
 * that person's own pension. A second person whose accessible pots the year's draw had emptied, and whose pension was
 * still locked, could owe a bill nothing might pay: the year's unmet demand passed a pound with pension wealth locked,
 * and the path was counted as failed, beside a partner's ISA of any size. In the couples' registered read it failed a
 * few dozen paths that end with millions, over a few hundred pounds. The fix (src/App.jsx 7c, src/solver/model.js 7c):
 * what is left after those is paid from the partner's taxable account, ISA and open pension.
 *
 *   1. the household below (the first person 62 with an ISA and nothing else; the second 50, a taxable account that is
 *      nearly all gain and a pension locked until 57), on the plan's own rules: the first year's bill is paid in full,
 *      and no path fails with money in the first person's ISA;
 *   2. the bill is the partner's ISA's to pay: the ISA at the end of the first year is lower by the bill than it is
 *      with capital gains tax switched off, to the pound;
 *   3. a single is untouched: the second person alone, the same plan without the first person, gives the same
 *      outcomes on the fixed engine and on the engine before the fix (the plant), path for path;
 *   4. the exact model's year (src/solver/model.js step, which a couple's tables are solved on) pays the same bill
 *      the same way: its first year's bill, unmet demand and the first person's ISA are the engine's.
 * The plant (--planted): a copy of the generated engine with the partner's pots skipped, as before the fix; checks 1, 2
 * and 4 fail on it and check 3 does not.
 *   node research/tests/couple-cgt-bill.test.mjs [--planted]
 */
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
const HERE = dirname(fileURLToPath(import.meta.url)), ENGINE = join(HERE, '../engine.mjs');

if (process.argv.includes('--planted')) {
  let out = '';
  try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, CGT_BILL_PLANT: 'nopartner' }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
  const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), ok = ['1', '2', '4'].every(c => failed.includes(c)) && !failed.includes('3');
  console.log(out.trimEnd());
  console.log(`\nplanted (the partner's pots skipped, as before the fix): the checks that fail: ${failed.join(', ') || 'none'}; 1, 2 and 4 and not 3: ${ok ? 'yes' : 'NO'}`);
  process.exit(ok ? 0 : 1);
}

const ANCHOR = 'if (x === o || !(rem > 0)) continue;';
const src = readFileSync(ENGINE, 'utf8');
if (src.split(ANCHOR).length !== 2) { console.log('FAIL  the plant\'s anchor is not in the generated engine exactly once'); process.exit(1); }
const tmp = mkdtempSync(join(tmpdir(), 'cgt-bill-'));
writeFileSync(join(tmp, 'engine.mjs'), src.replace(ANCHOR, 'continue;'));
const FIXED = await import(pathToFileURL(ENGINE).href), BEFORE = await import(pathToFileURL(join(tmp, 'engine.mjs')).href);
rmSync(tmp, { recursive: true, force: true });
const E = process.env.CGT_BILL_PLANT === 'nopartner' ? BEFORE : FIXED;
const M = await import(pathToFileURL(join(HERE, '../../src/solver/model.js')).href);

let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const gbp = v => `£${Math.round(v).toLocaleString('en-GB')}`;

const accounts = [
  { id: 'isa_self', owner: 'Myself', category: 'S&S ISAs', balance: 900000, contrib: 0, growth: 0, risk: 'Medium Risk' },
  { id: 'other_part', owner: 'Partner', category: 'Other Investments (e.g. GIA)', balance: 25000, contrib: 0, growth: 0, risk: 'Medium Risk', unrealisedGain: 24000 },
  { id: 'pen_part', owner: 'Partner', category: 'Pensions', balance: 200000, contrib: 0, growth: 0, risk: 'Medium Risk' }
];
const couple = (cgtEnabled = true) => ({
  demographics: { planningMode: 'couple', currentAgeSelf: 62, retireAgeSelf: 60, currentAgePart: 50, retireAgePart: 50, terminalAge: 95, statePensionSelf: 0, statePensionPart: 0, statePensionAge: 68, privatePensionAge: 57 },
  spending: { targetSpend: 30000 }, accounts, config: { valuationDate: '2026-01-01', cgtEnabled, guardrails: false, lookaheadYears: 0 }
});
const ctxOf = (Eng, plan) => Eng.buildContext(Eng.resolveMpaa(Eng.normalizePlan(plan)));
const year0 = (Eng, plan) => { const ctx = ctxOf(Eng, plan), st = Eng.freshState(ctx); const row = Eng.stepYear(ctx, st, 0, { z: 0, zPath: 0 }); return { ctx, st, row }; };

// 1. the bill paid, and no path failed beside the first person's ISA
{
  const { ctx, st, row } = year0(E, couple());
  const isaId = ctx.owners.find(o => o.key === 'self').ids.isa;
  const paths = E.pathsForSeed(99001, 20, ctx.totalYears).map(zs => E.runTrial(ctx, Float64Array.from(zs)));
  const failedRich = paths.filter(q => !q.survived && q.terminalPot > 100000).length, failed = paths.filter(q => !q.survived).length;
  ok('1. the first year\'s bill is paid in full, and no path of 20 fails with money left in the household', row.cgtPaid > 1000 && !(row.unmetDemand > 1) && failedRich === 0,
    `the bill ${gbp(row.cgtPaid)}, the year's unmet demand ${gbp(row.unmetDemand || 0)}; paths failing with over £100,000 left ${failedRich} of 20 (failing at all, their money gone: ${failed}); the first person's ISA after the year ${gbp(st.pots[isaId])}`);
  // 2. paid from the partner's ISA, to the pound
  // (the year's row is after growth: the second person's locked pension, in the same tier and untouched, gives the factor)
  const off = year0(E, couple(false)), penId = ctx.owners.find(o => o.key === 'part').ids.pen, g = st.pots[penId] / 200000;
  const gap = off.st.pots[isaId] - st.pots[isaId];
  ok('2. the first person\'s ISA pays it: lower by the bill, grown as the year grew it, than with capital gains tax off, to the pound', g > 0.5 && Math.abs(gap - row.cgtPaid * g) < 1, `the ISA ${gbp(off.st.pots[isaId])} without the tax, ${gbp(st.pots[isaId])} with it: ${gbp(gap)} against the bill ${gbp(row.cgtPaid)} grown by ${g.toFixed(4)}, ${gbp(row.cgtPaid * g)}`);
}

// 3. a single is untouched: the second person alone, on the fixed engine and on the engine before the fix
{
  const single = { demographics: { planningMode: 'single', currentAgeSelf: 50, retireAgeSelf: 50, terminalAge: 95, statePensionSelf: 0, statePensionAge: 68, privatePensionAge: 57 },
    spending: { targetSpend: 12000 }, config: { valuationDate: '2026-01-01', cgtEnabled: true, guardrails: false },
    accounts: [{ id: 'other_self', owner: 'Myself', category: 'Other Investments (e.g. GIA)', balance: 250000, contrib: 0, growth: 0, risk: 'Medium Risk', unrealisedGain: 200000 }, { id: 'pen_self', owner: 'Myself', category: 'Pensions', balance: 200000, contrib: 0, growth: 0, risk: 'Medium Risk' }] };
  const run = Eng => { const ctx = ctxOf(Eng, single); return E.pathsForSeed(99001, 20, ctx.totalYears).map(zs => { const q = Eng.runTrial(ctx, Float64Array.from(zs)); return `${q.survived}|${q.terminalPot}|${q.lifetimeTax}|${q.unmetTotal}`; }).join(';'); };
  const a = run(FIXED), b = run(BEFORE);
  ok('3. a single has no partner: 20 paths the same on the fixed engine and on the engine before the fix', a === b && a.length > 0, `${a === b ? 'every outcome the same' : 'they differ'}; lifetime tax on the first path ${gbp(Number(a.split(';')[0].split('|')[2]))}`);
}

// 4. the exact model's year pays the same bill the same way
{
  const plan = E.resolveMpaa(E.normalizePlan(couple())), m = M.prepare(E, plan), st = M.initialState(m), own = M.actionFromContext(m.ctx);
  const rm = M.step(m, st, own, 0), eng = year0(E, couple());
  const isaId = eng.ctx.owners.find(o => o.key === 'self').ids.isa, mIsa = st.pots[isaId];
  // each ISA is lower by the bill as its year grew it (the model's year takes its expected growth, the engine's a median draw)
  const mOff = (() => { const m0 = M.prepare(E, E.resolveMpaa(E.normalizePlan(couple(false)))), s0 = M.initialState(m0); M.step(m0, s0, M.actionFromContext(m0.ctx), 0); return s0.pots[isaId]; })();
  const same = Math.abs(rm.cgtPaid - eng.row.cgtPaid) < 0.01 && Math.abs((rm.unmetDemand || 0) - (eng.row.unmetDemand || 0)) < 0.01 && Math.abs((mOff - mIsa) - (year0(E, couple(false)).st.pots[isaId] - eng.st.pots[isaId])) < 1;
  ok('4. the exact model\'s year pays the same bill from the same ISA as the engine', same,
    `the bill ${gbp(rm.cgtPaid)} (the engine ${gbp(eng.row.cgtPaid)}), unmet ${gbp(rm.unmetDemand || 0)} (${gbp(eng.row.unmetDemand || 0)}), the model's ISA lower by ${gbp(mOff - mIsa)} (the engine's by ${gbp(year0(E, couple(false)).st.pots[isaId] - eng.st.pots[isaId])})`);
}

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
