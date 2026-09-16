/*
 * THE THREE THINGS THE SIMPLE PAGE GAINED, AND THE ONE IT NEVER HAD.
 *
 * 1 A THEME CONTROL. The preference used to live inside App.jsx, so the switch at the top of the shell
 *   unmounted the only component that held it and this page had no way to change it. It is in the shell
 *   now, and this checks the whole loop: the control exists, dark paints a different ground, the document
 *   is stamped, and the choice survives a reload.
 * 2 THE WRAPPER LEGEND. Four lines, all drawn by default because the mix is most of the answer, each
 *   toggling off and on independently. The count is taken from the stroke width the wrapper lines use,
 *   which is theirs alone.
 *
 * Note the ground is read off documentElement and the page's own wrapper, NOT body: body is transparent
 * here, so measuring it reports the same "rgba(0, 0, 0, 0)" in both themes and the check passes forever.
 *
 * Run: node simple-extras-ui.cjs [port]
 */
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('fs');
const PORT = process.argv[2] || '5182';
const SHOT = process.argv[3];
const css = fs.readFileSync('/tmp/claude-0/twbuild/out.css', 'utf8');
const simple = { ageSelf:45, retireSelf:62, terminalAge:95, spend:40000, salary:70000,
  pen:320000, isa:90000, gia:40000, cash:25000, penC:12000, isaC:6000, giaC:0, cashC:0,
  penG:'', isaG:'', giaG:'', cashG:'', statePensionSelf:12548, region:'ruk', couple:false, oneOffs:[], earnings:[],
  penRisk:'High Risk', isaRisk:'High Risk', giaRisk:'Medium Risk', cashRisk:'Cash Equivalents' };
const ok = (l,c,d='') => { console.log(`  ${c?'ok  ':'FAIL'}  ${l}${d?'   '+d:''}`); if(!c) process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1100, height: 1000 } });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  await p.addInitScript(s => { localStorage.setItem('rp_which_app','simple'); localStorage.setItem('rp_simple_v1', JSON.stringify(s)); }, simple);
  await p.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1500); await p.addStyleTag({ content: css });

  // 1. the theme control exists on the simple page and actually paints
  const ground = () => p.evaluate(() => { const el = document.querySelector('.min-h-screen'); return [getComputedStyle(document.documentElement).backgroundColor, el ? getComputedStyle(el).backgroundColor : null].join(' / '); });
  const light = await ground();
  const hasToggle = await p.evaluate(() => !!document.querySelector('button[aria-label="Dark"]'));
  ok('the simple page has a theme control', hasToggle);
  await p.evaluate(() => document.querySelector('button[aria-label="Dark"]').click());
  await p.waitForTimeout(500);
  const dark = await ground();
  ok('...and dark paints a different ground', light !== dark, `${light} -> ${dark}`);
  ok('...stamping the document', await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'));
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1200); await p.addStyleTag({ content: css });
  ok('...and it survives a reload', await p.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'));
  await p.evaluate(() => document.querySelector('button[aria-label="Light"]').click());
  await p.waitForTimeout(400);

  // 2. the wrapper legend
  await p.waitForFunction(() => /Made up of/.test(document.body.innerText), null, { timeout: 90000 });
  const names = await p.evaluate(() => [...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t=>/^(Pensions|ISAs|Other investments|Cash)$/.test(t)));
  ok('all four wrappers are offered on a legend', names.length === 4, names.join(', '));
  const count = () => p.evaluate(() => { const svg=[...document.querySelectorAll('svg')].sort((a,b)=>b.getBoundingClientRect().width-a.getBoundingClientRect().width)[0];
    return [...svg.querySelectorAll('path')].filter(x=>x.getAttribute('stroke-width')==='1.75').length; });
  ok('all four are drawn on arrival', await count() === 4, String(await count()));
  const click = async (name) => { await p.evaluate(n => { const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===n); x.click(); }, name); await p.waitForTimeout(400); };
  await click('Pensions');
  ok('clicking Pensions hides one', await count() === 3, String(await count()));
  await click('Cash');
  ok('...and Cash a second', await count() === 2, String(await count()));
  await click('Pensions');
  ok('clicking again brings it back', await count() === 3, String(await count()));
  if (SHOT) await p.screenshot({ path: `${SHOT}/simple-wrappers.png` });
  await b.close();
  console.log(process.exitCode ? '\nFAILED' : '\nall ok');
})();
