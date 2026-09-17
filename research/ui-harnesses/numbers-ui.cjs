/*
 * HOW NUMBERS ARE WRITTEN, AND THE ONE SHORTCUT THAT IS NOT AN ASSUMPTION.
 *
 * Two features that share a fixture, because both are about what a figure means when somebody reads or
 * types it.
 *
 * SEPARATORS. Six digits with no separator is a number you count rather than read, and a plain
 * <input type="number"> cannot carry one at all, so money fields are text fields that format on the way
 * out and strip on the way in. The Config toggle switches the convention, and the important assertion is
 * not that the display changes - it is that PARSING FOLLOWS IT. Under the European convention "1.234"
 * means one thousand two hundred and thirty-four and under the British one it means one and a bit, so a
 * parser left behind would store a different number from the one on screen, silently.
 *
 * THE FULL STATE PENSION. Prefilling it was tried and reverted: how many qualifying National Insurance
 * years stand behind somebody's award is not something the plan holds, so a number that appeared on its
 * own read as a fact about them. The button is the shortcut instead, and pressing it again clears the
 * field so a custom amount is typed over a blank.
 *
 * Run: node numbers-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const PORT = process.argv[2] || '5173';
const FULL_STATE_PENSION = 12548;
const GIA = 'Other Investments (e.g. GIA)';
const plan = {
  demographics:{planningMode:'single',currentAgeSelf:45,retireAgeSelf:62,salarySelf:70000,employmentSelf:'employed',statePensionAge:68,privatePensionAge:58,statePensionSelf:'',terminalAge:95},
  spending:{targetSpend:40000,spendBands:[],drawdownStrategy:'Phased Drawdown',decumulationPolicy:'Bracket Fill Basic'},
  accounts:[{id:'pen_self',owner:'Myself',category:'Pensions',balance:320000,contrib:12000,growth:3,risk:'High Risk'},
    {id:'isa_self',owner:'Myself',category:'S&S ISAs',balance:90000,contrib:6000,growth:3,risk:'Medium/High Risk'},
    {id:'other_self',owner:'Myself',category:GIA,balance:40000,contrib:0,growth:0,risk:'Medium Risk'},
    {id:'cash_self',owner:'Myself',category:'Cash Savings',balance:25000,contrib:0,growth:0,risk:'Cash Equivalents'}],
  otherIncomes:[],oneOffContributions:[],oneOffCosts:[],config:{valuationDate:'2026-01-01'}};

let fails = 0;
const ok = (l, c, d = '') => { console.log(`  ${c ? 'ok  ' : 'FAIL'}  ${l}${d ? '   ' + d : ''}`); if (!c) fails++; };
const tab = async (p, name) => { await p.evaluate(n => { const x = [...document.querySelectorAll('[data-tabbar] button')].find(b => b.textContent.includes(n)); if (x) x.click(); }, name); await p.waitForTimeout(650); };
// Type into a React-controlled field the way a person does, so onChange runs.
const typeInto = (p, handle, text) => handle.evaluate((el, t) => {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  el.focus();
  set.call(el, t);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}, text);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 950 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(pl => {
    localStorage.setItem('rp_plan_full_v28', JSON.stringify(pl));
    localStorage.setItem('rp_which_app', JSON.stringify('full'));
    // Once, not on every navigation: an init script runs again on reload, and clearing the key there
    // would wipe the very preference the reload is meant to prove survives.
    if (!sessionStorage.getItem('rp_numbers_harness_reset')) {
      localStorage.removeItem('rp_number_format_v1');
      sessionStorage.setItem('rp_numbers_harness_reset', '1');
    }
  }, plan);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1100);

  // ---------- separators, on the default convention ----------
  await tab(p, 'Plan Inputs');
  const money = p.locator('input[data-money]');
  ok('money fields exist and are not number inputs', await money.count() > 0, `${await money.count()} fields`);
  const balance = money.filter({ hasNot: p.locator('[disabled]') });
  const shown = await p.evaluate(() => {
    const el = [...document.querySelectorAll('input[data-money]')].find(i => String(i.value).replace(/\D/g, '') === '320000');
    return el ? el.value : null;
  });
  ok('a six figure balance is grouped', shown === '320,000', String(shown));

  // ---------- the toggle, and whether parsing follows it ----------
  await tab(p, 'Config & Assumptions');
  ok('Config offers the number format', await p.locator('[data-number-format]').count() === 1);
  const pickFormat = (sample) => p.evaluate((t) => {
    const x = [...document.querySelectorAll('[data-number-format] button')].find(b => b.textContent.trim() === t);
    if (x) x.click(); return !!x;
  }, sample);
  ok('...with both conventions offered', await pickFormat('1.234,56'), 'European sample');
  await p.waitForTimeout(400);
  await tab(p, 'Plan Inputs');
  const euShown = await p.evaluate(() => {
    const el = [...document.querySelectorAll('input[data-money]')].find(i => String(i.value).replace(/\D/g, '') === '320000');
    return el ? el.value : null;
  });
  ok('the display follows the convention', euShown === '320.000', String(euShown));

  /*
   * The assertion that matters. Typing "1.234" under the European convention has to store 1234, not 1.234
   * - and the way to tell them apart from outside is what the field reads back as once it reformats.
   */
  const first = money.first();
  await typeInto(p, first, '1.234');
  await p.waitForTimeout(200);
  await p.evaluate(() => document.activeElement && document.activeElement.blur());
  await p.waitForTimeout(400);
  const readBack = await first.inputValue();
  ok('...and parsing follows it too', readBack === '1.234', `read back "${readBack}", not "1" or "1,234"`);

  await tab(p, 'Config & Assumptions');
  await pickFormat('1,234.56');
  await p.waitForTimeout(400);
  await tab(p, 'Plan Inputs');
  ok('switching back restores the other convention', (await first.inputValue()) === '1,234', await first.inputValue());

  // ---------- the choice outlives a reload ----------
  await tab(p, 'Config & Assumptions');
  await pickFormat('1.234,56');
  await p.waitForTimeout(300);
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  await tab(p, 'Plan Inputs');
  const afterReload = await p.evaluate(() => {
    const el = [...document.querySelectorAll('input[data-money]')].find(i => String(i.value).replace(/\D/g, '') === '320000');
    return el ? el.value : null;
  });
  ok('the convention survives a reload', afterReload === '320.000', String(afterReload));
  await tab(p, 'Config & Assumptions');
  await pickFormat('1,234.56');
  await p.waitForTimeout(300);

  // ---------- the full State Pension ----------
  await tab(p, 'Plan Inputs');
  const fullBtn = p.locator('[data-full-state-pension]').first();
  ok('the State Pension field offers the full award', await fullBtn.count() === 1);
  const spField = () => p.evaluate(() => {
    const btn = document.querySelector('[data-full-state-pension]');
    const input = btn.parentElement.querySelector('input');
    return { value: input.value, placeholder: input.placeholder, pressed: btn.getAttribute('aria-pressed') };
  });
  const before = await spField();
  ok('...left blank until asked, with the figure only suggested', before.value === '' && /\d/.test(before.placeholder),
    `value "${before.value}", placeholder "${before.placeholder}"`);
  await fullBtn.click();
  await p.waitForTimeout(400);
  const after = await spField();
  ok('...one press fills the full award', String(after.value).replace(/\D/g, '') === String(FULL_STATE_PENSION), String(after.value));
  ok('...and the button reads as on', after.pressed === 'true', String(after.pressed));
  await fullBtn.click();
  await p.waitForTimeout(400);
  const cleared = await spField();
  ok('...pressing again clears it, ready for a custom amount', cleared.value === '', `"${cleared.value}"`);
  // The room for a custom amount is the point of the layout, not just of the clearing.
  const room = await p.evaluate(() => {
    const btn = document.querySelector('[data-full-state-pension]');
    return Math.round(btn.parentElement.querySelector('input').getBoundingClientRect().width);
  });
  ok('...with room left to type one', room >= 110, `${room}px of field beside the button`);

  ok('no page errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nall ok');
  process.exit(fails ? 1 : 0);
})();
