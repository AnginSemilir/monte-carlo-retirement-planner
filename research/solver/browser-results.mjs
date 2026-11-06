/*
 * SAFARI AND FIREFOX AGAINST CHROMIUM (Phase 12 item 5, the readiness checklist: "a solve in Safari and in Firefox ... Its figures
 * must sit within the Chromium solve's sampling noise. Bit for bit is not required across engines, whose Math functions may differ
 * in the last bit"). Reads the Chromium run of public/browser-check.html (research/ui-harnesses/browser-check-ui.cjs's output, which
 * carries the code's stamp) and the blocks the maintainer pasted back from other browsers, and prints results-browsers.txt, one line
 * a browser, as research/solver/launch-ready.mjs reads it.
 *   A browser's run counts only on the same solver code as Chromium's (its `code:` line, the solver worker's module-graph key) at the
 *   app's 45 points, on the same seed and 5,000 markets. Its survival is within the sampling noise when it differs from Chromium's by
 *   no more than 1.96 standard errors of a difference between two independent estimates on 5,000 markets, sqrt(2 p (1 - p) / n)
 *   (a bound: the two run on the same markets, so the true noise is smaller). Its tables' fingerprint is reported, not required.
 *   node research/solver/browser-results.mjs <chromium-output.txt> <pasted-block.txt> [...] > research/solver/results-browsers.txt
 */
import { readFileSync } from 'node:fs';

const [chromeFile, ...others] = process.argv.slice(2);
const parse = t => {
  const at = {};
  const from = t.indexOf('browser-check v1');
  if (from < 0) return null;
  for (const l of t.slice(from).split('\n').slice(1)) {
    const m = /^\s*\|?\s*([a-z]+): (.*)$/.exec(l);
    if (m && !(m[1] in at)) at[m[1]] = m[2].trim(); else if (!m && Object.keys(at).length > 3 && !l.trim()) break;
  }
  return at;
};
const ct = readFileSync(chromeFile, 'utf8'), C = parse(ct), stamp = (/the code: (code-stamp:[0-9a-f]{16})/.exec(ct) || [])[1];
if (!C || !stamp || !/^ {2}ok +the page solves S116/m.test(ct)) { console.log('the Chromium run is missing, unstamped or failed'); process.exit(1); }
const pct = s => Number(String(s).replace('%', '')) / 100;
const p = pct(C.survival), n = Number(C.trials), bound = 1.96 * Math.sqrt(2 * p * (1 - p) / n);
console.log(`the code: ${stamp}; Chromium's run: ${C.browser}, survival ${C.survival}, solver ${C.code}, ${C.points} points, ${C.parts} parts, ${C.solve}`);
console.log(`within the sampling noise: survival no more than ${(100 * bound).toFixed(2)} points from Chromium's (1.96 x sqrt(2 p (1 - p) / ${n}))`);
for (const f of others) {
  const B = parse(readFileSync(f, 'utf8'));
  if (!B) { console.log(`${f}: no browser check block`); continue; }
  const name = (/^(Safari|Firefox)/.exec(B.browser || '') || [])[1] || B.browser;
  if (B.error) { console.log(`${name} (${B.browser}): stopped with an error: ${B.error}`); continue; }
  const same = B.code === C.code && B.points === '45' && B.seed === C.seed && B.trials === C.trials;
  const d = pct(B.survival) - p, within = same && Math.abs(d) <= bound + 1e-12;
  const detail = `survival ${B.survival} against ${C.survival} (${(100 * d >= 0 ? '+' : '') + (100 * d).toFixed(3)} points), ${B.isolated === 'yes' ? 'isolated' : 'not isolated'}, ${B.parts} parts, ${B.solve}, tables ${B.digest === C.digest ? 'the same bit for bit' : 'differing in the last bits'}`;
  console.log(`${name} (${B.browser}; ${detail})${same ? '' : `; NOT the same run (code ${B.code}, ${B.points} points, seed ${B.seed}, trials ${B.trials})`}`);
  console.log(`${name} ${B.browser.replace(/^\S+ /, '')}: ${within ? 'within' : 'NOT within'} the Chromium solve's sampling noise`);
}
