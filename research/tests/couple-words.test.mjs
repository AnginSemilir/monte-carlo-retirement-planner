/*
 * A COUPLE'S WORDS (Part D, D5.4; src/solverWords.js): this year's actions, the year's split, the next years and the ledger
 * said for a household.
 *   1. each action named for its person: the first person's "You: ..." in the second person, the partner's "Your partner: ..."
 *      in the third ("their pension", "their personal allowance"), the household's level "Together: ..."; the cost as a single's;
 *   2. the split: said only where it is uneven, the share from each person's money, all from one person said so;
 *   3. the next years: each year's moves named for their person, a tier said only in the year it changes, the split first;
 *      years alike grouped, as a single's;
 *   4. the ledger's column: the level, the split, then each person's moves, short;
 *   5. the headline said to the two of them; a single's title as before.
 * Plant (--planted): 'partneryour' (the partner's moves worded as the first person's: check 1 and 3 fail).
 *   node research/tests/couple-words.test.mjs [--planted]
 */
import { coupleActionWords, coupleSplitWords, coupleAheadRowsWords, coupleLedgerWords, headlineWords, WORDS_PLANT } from '../../src/solverWords.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.argv.includes('--planted')) {
  let out = '';
  try { out = execFileSync(process.execPath, [fileURLToPath(import.meta.url)], { env: { ...process.env, COUPLE_WORDS_PLANT: 'partneryour' }, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); }
  const failed = [...out.matchAll(/^FAIL {2}(\d)\./gm)].map(m => m[1]), ok = ['1', '3'].every(c => failed.includes(c)) && !failed.includes('2') && !failed.includes('4');
  console.log(`plant 'partneryour': the checks that fail: ${failed.join(', ') || 'none'}; wanted 1 and 3: ${ok ? 'yes' : 'NO'}`);
  process.exit(ok ? 0 : 1);
}
WORDS_PLANT.rule = process.env.COUPLE_WORDS_PLANT || '';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const fmt = v => `£${Math.round(v).toLocaleString('en-GB')}`, ctx = { fmt, target: 40000 };

// 1. actions named for their person
{ const a = coupleActionWords({ who: 'part', part: 'draw', value: 'pa', cost: 0.4, n: 1000 }, ctx).what;
  const b = coupleActionWords({ who: 'self', part: 'draw', value: 'pa', cost: 0.4, n: 1000 }, ctx).what;
  const c = coupleActionWords({ who: 'part', part: 'harvest', value: 'basic', cost: null }, ctx).what;
  const d = coupleActionWords({ who: 'household', part: 'level', value: 0.9, cost: 1.2, n: 1000 }, ctx);
  const e = coupleActionWords({ who: 'part', part: 'tierPen', value: 2, cost: 0, n: 1000 }, ctx);
  const good = a === 'Your partner: Take from their pension first, up to their personal allowance' && b === 'You: Take from your pension first, up to your personal allowance'
    && c === 'Your partner: Move their pension money into their ISA, up to the basic-rate limit' && d.what === 'Together: Spend £36,000 this year, 90% of your target'
    && d.cost === 'Skipping it costs 1.2 points of survival.' && e.what === 'Your partner: Move their pension 2 steps lower in risk' && e.cost === 'Skipping it costs no survival on 1,000 markets.';
  ok('1. each action named for its person, the partner\'s in the third person, the household\'s level said once, the cost as a single\'s', good, `${a} | ${c} | ${e.what}`); }

// 2. the split
{ const g = [coupleSplitWords(0.5), coupleSplitWords(0.25), coupleSplitWords(1), coupleSplitWords(0), coupleSplitWords(undefined)];
  ok('2. the split said only where uneven: the share from each, all from one said so', g[0] === null && g[1] === 'This year, 25% of what you spend comes from your money and 75% from your partner\'s'
    && g[2] === 'This year, what you spend comes from your money, not your partner\'s' && g[3] === 'This year, what you spend comes from your partner\'s money, not yours' && g[4] === null, g.join(' | ')); }

// 3. the next years
{ const P = (d, h, tp, ti) => ({ draw: d, harvest: h, tierPen: tp, tierIsa: ti });
  const row = (year, age, parts) => ({ year, age, spend: 36000, parts, swept: null });
  const rows = [row(2027, 60, { level: 0.9, split: 0.75, self: P('pa', null, 1, 1), part: P('none', 'basic', 0, 0) }),
    row(2028, 61, { level: 0.9, split: 0.75, self: P('pa', null, 1, 1), part: P('none', 'basic', 0, 0) }),
    row(2029, 62, { level: 0.9, split: 0.75, self: P('pa', null, 1, 1), part: P('none', 'basic', 0, 0) }),
    row(2030, 63, { level: 1, split: 0.5, self: P('pa', null, 0, 0), part: P('basic', null, 0, 1) })];
  const g = coupleAheadRowsWords(rows, ctx);
  const first = g[0].lines, later = g[1], last = g[2];
  const good = g.length === 3 && first[0] === '75% of what you spend comes from your money and 25% from your partner\'s' && first.includes('You: Take from your pension first, up to your personal allowance')
    && first.includes('You: Move your pension and ISA 1 step lower in risk') && first.includes('Your partner: Move their pension money into their ISA, up to the basic-rate limit')
    && later.when === '2028 to 2029 (ages 61 to 62)' && !later.lines.some(l => /lower in risk/.test(l)) && last.lines.includes('You: Move your pension and ISA back to the risk you chose')
    && last.lines.includes('Your partner: Take from their pension first, up to the basic-rate limit') && last.lines.includes('Your partner: Move their ISA 1 step lower in risk');
  ok('3. the next years: each year\'s moves named for their person, a tier said only when it changes, the split first, years alike grouped', good, JSON.stringify(g.map(x => [x.when, x.lines]))); }

// 4. the ledger
{ const p = { level: 0.9, split: 0.75, self: { draw: 'pa', harvest: null, tierPen: 1, tierIsa: 0 }, part: { draw: 'none', harvest: 'basic', tierPen: 0, tierIsa: 0 } };
  const w = coupleLedgerWords(p, true, null), w2 = coupleLedgerWords({ level: 1, split: 0.5, self: { draw: 'none', harvest: null }, part: { draw: 'none', harvest: null } }, false, null);
  ok('4. the ledger: the level, the split, then each person\'s moves, short; nothing to say reads "as planned"', w === 'spend 90% · 75% from you · you: pension first, to the personal allowance, pension 1 step safer · partner: pension to ISA, to the basic-rate limit' && w2 === 'as planned', `${w} | ${w2}`); }

// 5. the headline
{ const h = { case: 'atTarget', startLevel: 100, startSpend: 40000, target: 40000, survival: 95, delivered: 99, retired: true };
  const a = headlineWords(h, fmt, true).title, b = headlineWords({ ...h, retired: false }, fmt, true).title, c = headlineWords(h, fmt).title;
  ok('5. the headline said to the two of them, a single\'s as before', a === 'Your safe starting spend, for the two of you' && b === 'Your safe starting spend when the first of you retires' && c === 'Your safe starting spend', `${a} | ${b} | ${c}`); }

console.log(`\n${fail ? `FAILED: ${fail} of ${pass + fail} checks` : `ALL PASS: ${pass} checks`}`);
process.exit(fail ? 1 : 0);
