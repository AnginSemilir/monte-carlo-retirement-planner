/*
 * ITEM 6'S STAGE C, THE READ (registrations/couples-share.md; the review of 9 Nov, item 6 stage C; read once, by its rule).
 * The stamps first (fair-gate.mjs requireFairLogs), then the gate: every unit of couples-share-panel.json in every arm; one
 * code, audit, seed and prediction; each unit at the registration's paths (couples-share-paths.json), CANDH on its first
 * 1,000, every array one a path; each unit's arms on one plan (the inputs hash) at the panel's target, arm A's pick the
 * landing's; CANDS at its configuration (27d2a7c7ee9d) and the rule's share (the pots' outside 0.40 to 0.60, else 0.5), CANDH
 * at af001697ce1b and 0.5; each person's settings the registered couples' run's (audit-couples.mjs wantProblems), the
 * couples' path flat and fast, D80's three none; and on a unit with a feature, CANDS and CANDH the same path for path on
 * CANDH's paths (both solve the share 0.5). Then the rule, against APP:
 *   - D34's harm rule (reduce-couples.mjs harmOf: the loss over the unit's paths against the threshold its own realised
 *     discordance sets) on each of the 24 re-held units, and on each of the 12 with a feature, read apart;
 *   - the pooled gain over the 24 re-held units (reduce-phase4.mjs survivalItem, its 95% interval by path);
 *   - a feature unit flagged: STOP; else a re-held unit flagged: THE GUARD STAYS; else the pooled gain's interval above 0:
 *     PASS; else NOT SHOWN.
 * A comparison whose 1-point rate at its realised discordance falls below 0.90 is named with its rate (D34 (4); as D61 for D4).
 *   node research/solver/reduce-couples-share.mjs [dir] > research/solver/results-couples-share.txt     the registered read
 *   node research/solver/reduce-couples-share.mjs --pilot [dir]                                        the pilot's units, no outcome
 *   node research/solver/reduce-couples-share.mjs --planted
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { survivalItem, spendingItem } from './reduce-phase4.mjs';
import { harmOf } from './reduce-couples.mjs';
import { wantProblems } from './audit-couples.mjs';
import { ARMS, CONFIG, CANDH_N, SEED, PILOT_SEED, REGISTRATION, PATHS_FILE, W, pathsFor, stampFilesHash, pilotIds } from './audit-couples-share.mjs';
import { readSharePanel } from './couples-share-panel.mjs';
import { shareFor } from '../../src/solver/couple.js';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TP_BAR = 0.9, POOL_BAR = 0;
const f = (x, d = 3) => (x >= 0 ? '+' : '') + x.toFixed(d);
const T = { survived: Uint8Array, wealth: Float32Array, estate: Float32Array, delivered: Float32Array, unmet: Float32Array, tax: Float32Array, failYear: Int16Array };
const dec = (b64, C) => { const b = Buffer.from(b64, 'base64'); return new C(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };
export const mainOf = m => Object.fromEntries(Object.entries(T).map(([k, C]) => [k, dec(m[k], C)]));
export function loadDir(dir) {
  const U = {};
  for (const x of readdirSync(dir).filter(x => /\.json\.gz$/.test(x))) {
    const r = JSON.parse(gunzipSync(readFileSync(join(dir, x))).toString());
    (U[r.id] = U[r.id] || {})[r.arm] = { ...r, main: mainOf(r.main) };
  }
  return U;
}
/* each person's settings line from a solver arm's record (`| self: ... | part: ...`) */
export const personLine = (ran, who) => { const m = new RegExp(`${who}: (.*?)(?: \\| |$)`).exec(ran || ''); return m ? m[1] : ''; };
const kv = s => Object.fromEntries((s.match(/(\S+) (\S+)/g) || []).map(x => x.split(' ')));
/* the gate: refusals, each a line. `units` the panel's units (id, kind, target, label, plan); `paths` id -> N, or null (pilot) */
export function gate(U, units, { seed, prediction = null, audit = null, paths = null, ptsFree = false } = {}) {
  const P = [], all = [];
  for (const u of units) for (const arm of ARMS) { const r = U[u.id] && U[u.id][arm]; if (!r) P.push(`${u.id} ${arm}: missing`); else all.push(r); }
  const one = (what, g) => { const vs = [...new Set(all.map(g))]; if (vs.length > 1) P.push(`more than one ${what}: ${vs.join(', ')}`); };
  one('code', r => r.stamp.code); one('audit', r => r.stamp.audit); one('seed', r => r.seed); one('prediction', r => r.stamp.prediction); one('estate weight', r => r.W);
  if (all.some(r => r.seed !== seed)) P.push(`a unit is not on seed ${seed}`);
  if (prediction && all.some(r => r.stamp.prediction !== prediction)) P.push(`a unit was not run under ${prediction}`);
  if (audit && all.some(r => r.stamp.audit !== audit)) P.push(`a unit's audit is not these files' (${audit})`);
  for (const u of units) {
    const R = U[u.id] || {}; if (ARMS.some(a => !R[a])) continue;
    const N = paths ? paths[u.id] : R.CANDS.N;
    if (!(N > 0)) P.push(`${u.id}: no paths for it`);
    for (const arm of ARMS) {
      const r = R[arm], n = pathsFor(arm, N);
      if (r.N !== N || r.n !== n) P.push(`${u.id} ${arm}: ${r.n} of ${r.N} paths, not ${n} of ${N}`);
      for (const k of Object.keys(T)) if (r.main[k].length !== r.n) P.push(`${u.id} ${arm}: ${k} not one a path`);
      if (r.inputsNoMpaa !== R.APP.inputsNoMpaa) P.push(`${u.id} ${arm}: not on the unit's plan (inputs less the MPAA ages ${r.inputsNoMpaa}, APP's ${R.APP.inputsNoMpaa})`);
      if (r.label !== u.label) P.push(`${u.id} ${arm}: arm A's pick ${r.label}, not the landing's ${u.label}`);
      if (r.target !== u.target) P.push(`${u.id} ${arm}: target ${r.target}, not the panel's ${u.target}`);
    }
    for (const arm of ['CANDS', 'CANDH']) {
      const r = R[arm], want = arm === 'CANDS' ? { share: shareFor(u.plan), rule: 'pots' } : { share: 0.5, rule: 'half' }, head = kv(r.ran.split(' | ')[0]);
      if (r.config !== CONFIG[arm]) P.push(`${u.id} ${arm}: configuration ${r.config}, not ${CONFIG[arm]}`);
      if (Math.abs(r.share - want.share) > 1e-12 || r.shareRule !== want.rule) P.push(`${u.id} ${arm}: share ${r.share} ${r.shareRule}, not ${want.share} ${want.rule}`);
      if (head.flat !== 'true' || head.fast !== 'true') P.push(`${u.id} ${arm}: the couples' path flat ${head.flat} fast ${head.fast}`);
      for (const k of ['shortlist', 'item12', 'tieBreak']) if (!/^(none|off:\S+)$/.test(head[k] || '')) P.push(`${u.id} ${arm}: ${k} ${head[k]} (D80: none in a registered couples' arm)`);
      for (const who of ['self', 'part']) { const bad = wantProblems('CANDC', personLine(r.ran, who), W, ptsFree); if (bad.length) P.push(`${u.id} ${arm} ${who}: ${bad.join('; ')}`); }
    }
    // a unit with a feature holds 60/40: both solver arms solve the share 0.5, so they must agree path for path
    if (u.kind === 'feature') {
      const a = R.CANDS.main, b = R.CANDH.main, n = R.CANDH.n; let k = 0;
      for (let i = 0; i < n; i++) if (a.survived[i] !== b.survived[i] || a.wealth[i] !== b.wealth[i] || a.tax[i] !== b.tax[i]) k++;
      if (k) P.push(`${u.id}: a unit with a feature, CANDS and CANDH differ on ${k} of ${n} paths (both solve the share 0.5)`);
    }
  }
  return P;
}
/* each unit's comparison against APP by D34's rule, and CANDS against CANDH on CANDH's paths (reported) */
export const rowOf = (u, R) => ({ id: u.id, kind: u.kind, variant: u.variant, feature: u.feature, share: R.CANDS.share, ...harmOf(R.CANDS.main, R.APP.main),
  sApp: 100 * R.APP.main.survived.reduce((s, x) => s + x, 0) / R.APP.n, sCands: 100 * R.CANDS.main.survived.reduce((s, x) => s + x, 0) / R.CANDS.n,
  sCandh: 100 * R.CANDH.main.survived.reduce((s, x) => s + x, 0) / R.CANDH.n, vsHalf: harmOf(R.CANDS.main, R.CANDH.main, R.CANDH.n) });
/* the outcome from the rows and the pooled gain */
export function decide(rows, pooled) {
  const reheld = rows.filter(r => r.kind === 'reheld'), feature = rows.filter(r => r.kind === 'feature');
  const fFlag = feature.filter(r => r.flag), rFlag = reheld.filter(r => r.flag);
  if (fFlag.length) return { outcome: 'STOP', decides: `the couples' solver is flagged on a kind of household the library does not hold (${fFlag.map(r => r.id).join(', ')}); the maintainer rules before couples go on` };
  if (rFlag.length) return { outcome: 'THE GUARD STAYS', decides: `a re-held unit is flagged (${rFlag.map(r => r.id).join(', ')}): couples outside 40% to 60% keep the app's rules, and the maintainer rules on a new design` };
  if (pooled.lo > POOL_BAR) return { outcome: 'PASS', decides: "no unit flagged and the pooled gain's 95% interval above 0: shareRule 'pots' becomes the couples' default and the guard comes off, in the same commit as the D-line naming this run" };
  return { outcome: 'NOT SHOWN', decides: "no unit flagged, but the pooled gain's 95% interval is not above 0: the guard stays; to the maintainer" };
}

function planted() {
  let bad = 0;
  const check = (what, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`); if (!ok) bad++; };
  const n = 20000;
  const arr = (lost, saved, base = 0.85) => { const s = new Uint8Array(n); for (let i = 0; i < n * base; i++) s[i] = 1; for (let i = 0; i < lost; i++) s[i] = 0; for (let i = 0; i < saved; i++) s[n - 1 - i] = 1; return s; };
  const row = (id, kind, lost, saved) => ({ id, kind, ...harmOf({ survived: arr(lost, saved) }, { survived: arr(0, 0) }) });
  // D34's rule at 20,000 paths and about 3% discordance: a 1-point net loss is flagged, a net gain is not
  { const r = row('a', 'reheld', 400, 200), g = row('b', 'reheld', 200, 600);
    check(`a re-held unit losing a net 1.0 point at 3% discordance is flagged (threshold ${r.t.toFixed(3)}), one gaining 2 points is not`, r.flag && !g.flag); }
  const pooledOk = { lo: 0.5 }, pooledNo = { lo: -0.1 };
  const fine = [row('r1', 'reheld', 100, 900), row('r2', 'reheld', 100, 900), row('f1', 'feature', 100, 300)];
  check('no flag and the pooled interval above 0: PASS', decide(fine, pooledOk).outcome === 'PASS');
  check('no flag but the pooled interval reaching 0: NOT SHOWN', decide(fine, pooledNo).outcome === 'NOT SHOWN');
  check('a re-held unit flagged: THE GUARD STAYS, whatever the pool', decide([...fine, row('r3', 'reheld', 400, 200)], pooledOk).outcome === 'THE GUARD STAYS');
  check('a feature unit flagged: STOP, before a re-held flag', decide([...fine, row('r3', 'reheld', 400, 200), row('f2', 'feature', 400, 200)], pooledOk).outcome === 'STOP');
  // the gate on synthetic records
  const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
  const plan9 = { accounts: [{ id: 'pen_self', balance: 90 }, { id: 'pen_part', balance: 10 }] }, plan6 = { accounts: [{ id: 'pen_self', balance: 60 }, { id: 'pen_part', balance: 40 }] };
  const line = 'pts 45 bridgeRead reader readerRef adaptive readerSplit rs tiersBelow 3 tableDealing false switchCharge 0.001 e3 true e3pcls true hr yes jointWorlds true bridgeStep exact switchMargin 0 pclsInterp true failDelivered true lambda 0.0223606797749979 sweepCashIsaTo isa bequestWeight 0.02 lattice 80x21x64+foot+stepAll tierState 0/0,1/1,2/2,3/3 coarse w2a3b3g2c2-NT-LRVOH-h3';
  const mk = (u, arm, o = {}) => { const N = 4, nn = pathsFor(arm, N), z = (C) => b64(new C(nn));
    const main = Object.fromEntries(Object.entries(T).map(([k, C]) => [k, z(C)]));
    const ran = arm === 'APP' ? 'armA x' : `config ${CONFIG[arm]} flat true fast true shortlist none item12 none tieBreak none | self: ${line} | part: ${line}`;
    const share = arm === 'CANDS' ? shareFor(u.plan) : arm === 'CANDH' ? 0.5 : null, shareRule = arm === 'CANDS' ? 'pots' : arm === 'CANDH' ? 'half' : null;
    return { id: u.id, arm, N, n: nn, seed: 7002, W, inputs: 'h', inputsNoMpaa: 'h0', mpaa: [null, null], label: 'L', target: 100, config: arm === 'APP' ? null : CONFIG[arm], share, shareRule, ran, stamp: { code: 'c', audit: 'a', prediction: 'p' }, ...o, main: mainOf({ ...main, ...(o.main || {}) }) }; };
  const units = [{ id: 'X-90', kind: 'reheld', target: 100, label: 'L', plan: plan9 }, { id: 'X-db', kind: 'feature', target: 100, label: 'L', plan: plan6 }];
  const build = (over = {}) => Object.fromEntries(units.map(u => [u.id, Object.fromEntries(ARMS.map(a => [a, mk(u, a, (over[u.id] || {})[a])]))]));
  const G = U => gate(U, units, { seed: 7002 });
  { const g0 = G(build()); check(`the gate passes whole records${g0.length ? `: ${g0[0]}` : ''}`, g0.length === 0); }
  check('the gate refuses a missing arm', G((() => { const U = build(); delete U['X-90'].CANDH; return U; })()).some(x => /X-90 CANDH: missing/.test(x)));
  check('the gate refuses CANDS solved at 0.5 on a 90/10 unit, and CANDH at the pots\' share', G(build({ 'X-90': { CANDS: { share: 0.5 } } })).some(x => /X-90 CANDS: share 0.5 pots, not 0.9 pots/.test(x)) && G(build({ 'X-90': { CANDH: { share: 0.9, shareRule: 'pots' } } })).some(x => /X-90 CANDH: share 0.9 pots/.test(x)));
  check('the gate refuses another configuration, a tie-break on, a person on another lattice', G(build({ 'X-90': { CANDS: { config: 'af001697ce1b' } } })).some(x => /configuration af001697ce1b/.test(x)) && G(build({ 'X-90': { CANDS: { ran: mk(units[0], 'CANDS').ran.replace('tieBreak none', 'tieBreak 0.0001') } } })).some(x => /tieBreak 0.0001 \(D80/.test(x)) && G(build({ 'X-90': { CANDH: { ran: mk(units[0], 'CANDH').ran.replace(/lattice 80x21x64/g, 'lattice 160x41x128') } } })).some(x => /X-90 CANDH self: lattice 160x41x128/.test(x)));
  check('the gate refuses an arm on another plan, lets an arm differ in its MPAA ages alone, and refuses another target, another pick, another seed', G(build({ 'X-90': { APP: { inputsNoMpaa: 'z' } } })).some(x => /not on the unit's plan/.test(x)) && G(build({ 'X-90': { CANDS: { inputs: 'h2', mpaa: [68, null] } } })).length === 0 && G(build({ 'X-90': { CANDS: { target: 99 } } })).some(x => /target 99/.test(x)) && G(build({ 'X-90': { CANDH: { label: 'M' } } })).some(x => /pick M/.test(x)) && G(build({ 'X-90': { APP: { seed: 7022 } } })).some(x => /not on seed 7002/.test(x)));
  check('the gate refuses a feature unit whose CANDS and CANDH part on a path, and lets a re-held unit\'s differ', G(build({ 'X-db': { CANDS: { main: { survived: b64(Uint8Array.from([1, 0, 0, 0])) } } } })).some(x => /X-db: a unit with a feature, CANDS and CANDH differ on 1 of 4/.test(x)) && G(build({ 'X-90': { CANDS: { main: { survived: b64(Uint8Array.from([1, 0, 0, 0])) } } } })).length === 0);
  check('the gate refuses a unit at other paths than the registration\'s', gate(build(), units, { seed: 7002, paths: { 'X-90': 5, 'X-db': 4 } }).some(x => /X-90 CANDS: 4 of 4 paths, not 5 of 5/.test(x)));
  console.log(bad ? `\n${bad} planted check(s) failed` : '\nall planted checks pass');
  return bad;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--planted')) process.exit(planted() ? 1 : 0);
  const args = process.argv.slice(2), PILOT = args.includes('--pilot'), dirArg = args.find(a => !a.startsWith('--'));
  const DIR = dirArg || join(HERE, 'results', PILOT ? 'share-c-pilot' : 'share-c-run');
  // SC_ONLY (a smoke run of the pilot's machinery: a comma list of unit ids) and SC_PTS (its points) only with --pilot
  const only = PILOT && process.env.SC_ONLY ? new Set(process.env.SC_ONLY.split(',')) : null, ptsFree = PILOT && !!process.env.SC_PTS;
  const panel = readSharePanel(), units = (PILOT ? panel.filter(u => pilotIds(panel).includes(u.id)) : panel).filter(u => !only || only.has(u.id));
  if (!PILOT) {
    const { requireFairLogs } = await import('./fair-gate.mjs');
    requireFairLogs(existsSync(DIR) ? Object.fromEntries(readdirSync(DIR).filter(x => /^case\d+\.txt$/.test(x)).map(x => [x, readFileSync(join(DIR, x), 'utf8')])) : {}, REGISTRATION);
  }
  const U = loadDir(DIR), paths = PILOT ? null : JSON.parse(readFileSync(PATHS_FILE, 'utf8')).paths;
  const P = gate(U, units, PILOT ? { seed: PILOT_SEED, ptsFree } : { seed: SEED, prediction: REGISTRATION, audit: stampFilesHash(), paths });
  if (P.length) { console.log(`ITEM 6 STAGE C GATE: NOT FAIR\n  ${P.join('\n  ')}`); process.exit(1); }
  const r0 = U[units[0].id].CANDS, rows = units.map(u => rowOf(u, U[u.id])), reheld = units.filter(u => u.kind === 'reheld'), Nmin = Math.min(...reheld.map(u => U[u.id].CANDS.n));
  console.log(`ITEM 6 STAGE C${PILOT ? ' (THE PILOT: EXPLORATORY, no outcome)' : ' (registrations/couples-share.md; read once)'}: ${units.length} units (${reheld.length} re-held, ${units.length - reheld.length} with a feature), seed ${r0.seed}, code ${r0.stamp.code}, audit ${r0.stamp.audit}; CANDS ${CONFIG.CANDS} and APP on each unit's paths, CANDH ${CONFIG.CANDH} on its first ${CANDH_N}; the gate: fair`);
  console.log(`\nBy unit (survival APP / CANDS / CANDH on its first paths; CANDS less APP over the unit's paths: the loss, lost and saved, discordance; D34's threshold at the realised discordance and its rates at a quarter-point and a 1-point loss; the flag; CANDS's share):`);
  for (const r of rows) console.log(`  ${r.id.padEnd(11)} ${r.kind === 'reheld' ? `re-held ${r.variant}` : `feature ${r.feature}`.padEnd(13)} ${r.sApp.toFixed(2)}% / ${r.sCands.toFixed(2)}% / ${r.sCandh.toFixed(2)}% | loss ${f(r.loss)} points (${r.lost} lost, ${r.saved} saved of ${r.n}; discordant ${(100 * r.disc).toFixed(2)}%) | threshold ${r.t.toFixed(3)}, rates ${r.fp.toFixed(3)} / ${r.tp.toFixed(3)} | ${r.flag ? 'FLAGGED' : 'not flagged'} | share ${r.share}`);
  const mp = units.filter(u => ARMS.some(a => U[u.id][a].inputs !== U[u.id].APP.inputs));
  console.log(`\nUnits whose arms differ in a person's MPAA age alone (it follows each arm's drawing policy; the inputs less those ages the same in every arm): ${mp.length ? mp.map(u => `${u.id} (APP ${U[u.id].APP.mpaa.map(x => x === null ? 'none' : x).join('/')}, CANDS ${U[u.id].CANDS.mpaa.map(x => x === null ? 'none' : x).join('/')}, CANDH ${U[u.id].CANDH.mpaa.map(x => x === null ? 'none' : x).join('/')})`).join('; ') : 'none'}`);
  const pooled = survivalItem(reheld.map(u => [U[u.id].CANDS.main, U[u.id].APP.main]), Nmin), spend = spendingItem(reheld.map(u => [U[u.id].CANDS.main, U[u.id].APP.main]), Nmin);
  const featureU = units.filter(u => u.kind === 'feature'), NF = featureU.length ? Math.min(...featureU.map(u => U[u.id].CANDS.n)) : 0;
  const pooledF = featureU.length ? survivalItem(featureU.map(u => [U[u.id].CANDS.main, U[u.id].APP.main]), NF) : null;
  const low = rows.filter(r => r.tp < TP_BAR);
  console.log(`\nThe rule (CANDS against APP):`);
  console.log(`  1. D34's harm rule on the ${reheld.length} re-held units: flagged ${rows.filter(r => r.kind === 'reheld' && r.flag).map(r => r.id).join(', ') || 'none'}`);
  console.log(`  2. the pooled gain over the ${reheld.length} re-held units, on their first ${Nmin} paths: ${f(pooled.d)} points (95% ${f(pooled.lo)} to ${f(pooled.hi)}, se ${pooled.se.toFixed(4)}); its lower end above ${POOL_BAR}: ${pooled.lo > POOL_BAR ? 'HOLDS' : 'DOES NOT'}`);
  console.log(`  3. D34's harm rule on the ${featureU.length} units with a feature, read apart: flagged ${rows.filter(r => r.kind === 'feature' && r.flag).map(r => r.id).join(', ') || 'none'}${pooledF ? `; their pooled change ${f(pooledF.d)} points (95% ${f(pooledF.lo)} to ${f(pooledF.hi)})` : ''}`);
  console.log(`  comparisons whose 1-point rate at their realised discordance falls below ${TP_BAR} (named, D34 (4)): ${low.length ? low.map(r => `${r.id} ${r.tp.toFixed(3)} (discordant ${(100 * r.disc).toFixed(2)}%)`).join(', ') : 'none'}`);
  console.log(`\nBeside the rule, deciding nothing:`);
  console.log(`  spending delivered over the re-held units, CANDS less APP: ${f(spend.d)}% of APP's (95% ${f(spend.lo)} to ${f(spend.hi)})`);
  const half = survivalItem(reheld.map(u => [U[u.id].CANDS.main, U[u.id].CANDH.main]), Math.min(...reheld.map(u => U[u.id].CANDH.n)));
  console.log(`  the share rule's own effect, CANDS less CANDH on the re-held units' first ${Math.min(...reheld.map(u => U[u.id].CANDH.n))} paths: ${f(half.d)} points (95% ${f(half.lo)} to ${f(half.hi)}); by unit ${rows.filter(r => r.kind === 'reheld').map(r => `${r.id} ${f(-r.vsHalf.loss, 2)}`).join(', ')}`);
  const mean = (a, n = a.length) => { let s = 0; for (let i = 0; i < n; i++) s += a[i]; return s / n; };
  for (const [nm, us] of [['the re-held units', reheld], ['the units with a feature', featureU]]) if (us.length) console.log(`  ${nm}: the mean pot left APP / CANDS £${Math.round(mean(us.map(u => mean(U[u.id].APP.main.wealth)))).toLocaleString('en-GB')} / £${Math.round(mean(us.map(u => mean(U[u.id].CANDS.main.wealth)))).toLocaleString('en-GB')}; lifetime tax £${Math.round(mean(us.map(u => mean(U[u.id].APP.main.tax)))).toLocaleString('en-GB')} / £${Math.round(mean(us.map(u => mean(U[u.id].CANDS.main.tax)))).toLocaleString('en-GB')}`);
  const bs = units.map(u => U[u.id].CANDS.beside).filter(Boolean);
  console.log(`  the couples' rollout in the exact model beside the engine on CANDS's first paths: ${bs.reduce((s, b) => s + b.N, 0)} paths, the engine alone ${bs.reduce((s, b) => s + b.engineOnly, 0)}, the model alone ${bs.reduce((s, b) => s + b.modelOnly, 0)}`);
  if (PILOT) { console.log('\n(THE PILOT: no outcome is read from it; its discordance sizes the run, size-couples-share.mjs)'); process.exit(0); }
  const D = decide(rows, pooled);
  console.log(`\nITEM 6 STAGE C OUTCOME: ${D.outcome}: ${D.decides}`);
}
