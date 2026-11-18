/*
 * THE FACTORIALS' VERDICT (B7-FACTORIALS.md; B7 in D51; D129; EXPLORATORY): GAIN-BUCKET's corrected verdict (its read's review
 * of 3 Nov, finding 1: a verdict reads survival and spending both), shared by reduce-windfall.mjs and reduce-save.mjs.
 *   survival: the panel's mean change (each household counted once) beyond 1.96 se, and each household's exact one-sided
 *             test each way (reduce-gainbucket.mjs tail), Holm over the households at 5%;
 *   spending: the panel's mean change beyond 1.96 se, and each household's seeded sign-flip test of the mean each way
 *             (reduce-gainbucket.mjs flipTest; a path counts as moved where it moves by more than a millionth of it, as
 *             GAIN-BUCKET's read counts it), Holm over the households at 5%.
 * The outcome, the first that holds: A GAIN AND A HARM; A HARM (something down beyond noise); A GAIN (something up beyond
 * noise); NO EFFECT.
 *   node research/solver/b7-verdict.mjs --planted
 */
import { fileURLToPath } from 'node:url';
import { tail, flipTest } from './reduce-gainbucket.mjs';
import { holm } from './stats.mjs';

export const LEVEL = 0.05, Z = 1.96;
export const seedOf = id => [...id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
/* a household's spending by path, B less A, the paths that do not move set to nought */
export function spendDiffs(da, db) {
  const out = new Float64Array(da.length);
  for (let k = 0; k < da.length; k++) { const e = db[k] - da[k], tol = 1e-6 * Math.max(Math.abs(da[k]), Math.abs(db[k])); out[k] = Math.abs(e) > tol ? e : 0; }
  return out;
}
/* hh: [{ id, saved, lost, diffs }] (B against A); panel: { surv: { m, se }, spend: { m, se } } */
export function b7Verdict(hh, panel) {
  const rows = hh.map(h => { const fl = flipTest(h.diffs, seedOf(h.id)); return { id: h.id, pHarm: tail(h.lost, h.saved + h.lost), pGain: tail(h.saved, h.saved + h.lost), pSpendLoss: fl.loss, pSpendGain: fl.gain }; });
  for (const k of ['pHarm', 'pGain', 'pSpendLoss', 'pSpendGain']) { const a = holm(rows.map(r => r[k])); rows.forEach((r, i) => { r[`holm${k.slice(1)}`] = a[i]; }); }
  const at = k => rows.filter(r => r[k] < LEVEL).map(r => r.id), beyond = (x, dir) => (dir > 0 ? x.m - Z * x.se > 0 : x.m + Z * x.se < 0);
  const up = { panelSurv: beyond(panel.surv, 1), panelSpend: beyond(panel.spend, 1), surv: at('holmGain'), spend: at('holmSpendGain') };
  const down = { panelSurv: beyond(panel.surv, -1), panelSpend: beyond(panel.spend, -1), surv: at('holmHarm'), spend: at('holmSpendLoss') };
  const any = x => x.panelSurv || x.panelSpend || x.surv.length > 0 || x.spend.length > 0;
  const outcome = any(up) && any(down) ? 'A GAIN AND A HARM' : any(down) ? 'A HARM' : any(up) ? 'A GAIN' : 'NO EFFECT';
  const say = (what, p, up_, down_) => { const xs = []; if (p.up) xs.push('the panel up'); if (p.down) xs.push('the panel down'); if (up_.length) xs.push(`up on ${up_.join(', ')}`); if (down_.length) xs.push(`down on ${down_.join(', ')}`); return `${what} ${xs.length ? xs.join(', ') : 'no effect beyond noise'}`; };
  const text = `${say('survival:', { up: up.panelSurv, down: down.panelSurv }, up.surv, down.surv)}; ${say('spending:', { up: up.panelSpend, down: down.panelSpend }, up.spend, down.spend)}`;
  return { outcome, text, rows, up, down };
}
export const leadsTo = o => (o === 'NO EFFECT' ? 'the split is closed as measured' : o === 'A GAIN' ? 'to the maintainer as a proposal for a registered test (v2), every effect beside it' : 'to the maintainer at once, every effect beside it');

function planted() {
  const flat = n => new Float64Array(n);
  const H = (id, saved, lost, diffs) => ({ id, saved, lost, diffs: diffs || flat(4000) });
  const P0 = { surv: { m: 0, se: 0.05 }, spend: { m: 0, se: 0.01 } };
  const up = n => { const d = flat(4000); for (let k = 0; k < n; k++) d[k] = 50; return d; }, dn = n => { const d = flat(4000); for (let k = 0; k < n; k++) d[k] = -50; return d; };
  const cases = [
    ['nothing moves: NO EFFECT', b7Verdict([H('H1', 0, 0), H('H2', 0, 0)], P0).outcome, 'NO EFFECT'],
    ['a household losing 40 paths and saving none: A HARM, named', (v => `${v.outcome} ${v.down.surv.join(',')}`)(b7Verdict([H('H1', 0, 40), H('H2', 0, 0)], P0)), 'A HARM H1'],
    ['two lost against one saved is noise: NO EFFECT', b7Verdict([H('H1', 1, 2), H('H2', 0, 0)], P0).outcome, 'NO EFFECT'],
    ['the panel\'s survival up beyond 1.96 se: A GAIN', b7Verdict([H('H1', 0, 0)], { ...P0, surv: { m: 0.2, se: 0.05 } }).outcome, 'A GAIN'],
    ['a household\'s spending up on 300 paths: A GAIN on spending, named', (v => `${v.outcome} ${v.up.spend.join(',')} | ${v.text}`)(b7Verdict([H('H1', 0, 0, up(300)), H('H2', 0, 0)], P0)), 'A GAIN H1 | survival: no effect beyond noise; spending: up on H1'],
    ['spending up on one household and survival down on another: A GAIN AND A HARM', b7Verdict([H('H1', 0, 0, up(300)), H('H2', 0, 40)], P0).outcome, 'A GAIN AND A HARM'],
    ['the panel\'s spending down beyond 1.96 se: A HARM', b7Verdict([H('H1', 0, 0)], { ...P0, spend: { m: -0.05, se: 0.01 } }).outcome, 'A HARM'],
    ['a household\'s spending down on 300 paths: A HARM on spending', (v => `${v.outcome} ${v.down.spend.join(',')}`)(b7Verdict([H('H1', 0, 0, dn(300)), H('H2', 0, 0)], P0)), 'A HARM H1'],
    ['Holm over the households: one household at p 0.03 alone among 17 is not beyond noise', (() => { const hh = [H('H1', 0, 5)]; for (let i = 2; i <= 17; i++) hh.push(H(`H${i}`, 0, 0)); return b7Verdict(hh, P0).outcome; })(), 'NO EFFECT'],
    ['the panel exactly at 1.96 se is not beyond it', b7Verdict([H('H1', 0, 0)], { ...P0, surv: { m: 0.098, se: 0.05 } }).outcome, 'NO EFFECT']
  ];
  let bad = 0;
  for (const [label, got, want] of cases) { const ok = String(got) === String(want); if (!ok) bad++; console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${ok ? '' : `: got ${got}, want ${want}`}`); }
  console.log(bad ? `PLANTED: ${bad} of ${cases.length} FAILED` : `PLANTED: ALL PASS (${cases.length})`);
  return bad;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1] && process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
