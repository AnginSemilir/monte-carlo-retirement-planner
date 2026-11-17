/*
 * THE FIGURES ANSWERS.md QUOTES FROM THE PILOT (the review, 17 Nov; EXPLORATORY). Every pooled figure, count and range in
 * ANSWERS.md that is not a line of another results file is printed here from the pilot's unit files, so none was typed by
 * hand: the pooled survival change with and without S147-db, by group, the forecasts' distance from what happened, the
 * capped pot's units, the times, the three shapes' table, and each mend against design A.
 *   node research/reviews/2026-11-17/scripts/answers-figures.mjs [the pilot's directory]
 */
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

const D = 'research/reviews/2026-11-17/', DIR = process.argv[2] || D + 'units/pilot-99003-45';
const CAPS = JSON.parse(readFileSync(join(DIR, '..', 'caps.json')));
const ORDER = ['feature', 'library', 'younger', '90/10'];
const units = readdirSync(DIR).filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).map(f => JSON.parse(f.endsWith('.gz') ? gunzipSync(readFileSync(join(DIR, f))).toString() : readFileSync(join(DIR, f)))).sort((a, b) => ORDER.indexOf(a.group) - ORDER.indexOf(b.group) || a.id.localeCompare(b.id));
const sum = xs => xs.reduce((a, b) => a + b, 0), mean = xs => sum(xs) / xs.length, f = (x, d = 2) => `${x >= 0 ? '+' : ''}${x.toFixed(d)}`;
function paired(a, b) { const n = a.length; let saved = 0, lost = 0; for (let i = 0; i < n; i++) { if (a[i] && !b[i]) saved++; else if (!a[i] && b[i]) lost++; } const d = (saved - lost) / n, se = Math.sqrt(Math.max(0, (saved + lost) / n - d * d) / n); return { saved, lost, n, d: 100 * d, lo: 100 * (d - 1.96 * se), hi: 100 * (d + 1.96 * se) }; }
const sv = (u, arm) => 100 * sum(u.arms[arm].survived) / u.n;
const rows = units.map(u => {
  const k = u.arms.K2, h = u.arms.HOUSE, p = paired(h.survived, k.survived), cap = CAPS[u.id].cap;
  const both = h.survived.map((x, i) => (x && k.survived[i] ? i : -1)).filter(i => i >= 0);
  const dS = 100 * (sum(both.map(i => h.delivered[i])) / sum(both.map(i => k.delivered[i])) - 1);
  const cp = 100 * (mean(h.wealth.map(v => Math.min(v, cap))) / mean(k.wealth.map(v => Math.min(v, cap))) - 1);
  return { u, p, dS, cp, fh: 100 * u.forecast.HOUSE, fk: 100 * u.forecast.K2 };
});
const T = {};
T.PILOTTABLE = ['| unit | group | K2 | HOUSE | HOUSE less K2, points (95%) | spending | the capped pot | the household table\'s forecast, then HOUSE | the two tables\' forecast, then K2 |', '|---|---|---|---|---|---|---|---|---|',
  ...rows.map(r => `| ${r.u.id} | ${r.u.group} | ${sv(r.u, 'K2').toFixed(2)}% | ${sv(r.u, 'HOUSE').toFixed(2)}% | \`${f(r.p.d)}\` (${f(r.p.lo)} to ${f(r.p.hi)}) | \`${f(r.dS)}%\` | \`${f(r.cp, 1)}%\` | ${r.fh.toFixed(1)}%, ${sv(r.u, 'HOUSE').toFixed(1)}% | ${r.fk.toFixed(1)}%, ${sv(r.u, 'K2').toFixed(1)}% |`)].join('\n');
const all = paired(units.flatMap(u => u.arms.HOUSE.survived), units.flatMap(u => u.arms.K2.survived));
T.POOLED = f(all.d); T.POOLEDLO = f(all.lo); T.POOLEDHI = f(all.hi); T.SAVED = String(all.saved); T.LOST = String(all.lost); T.NPATHS = all.n.toLocaleString('en-GB');
T.GROUPS = ORDER.map(g => { const us = units.filter(u => u.group === g), p = paired(us.flatMap(u => u.arms.HOUSE.survived), us.flatMap(u => u.arms.K2.survived)); return `the ${g === '90/10' ? '90/10' : g} units \`${f(p.d)}\` (${f(p.lo)} to ${f(p.hi)}; ${us.length})`; }).join(', ');
{
  const us = units.filter(u => u.id !== 'S147-db'), p = paired(us.flatMap(u => u.arms.HOUSE.survived), us.flatMap(u => u.arms.K2.survived));
  T.POOLEDX = f(p.d); T.POOLEDXLO = f(p.lo); T.POOLEDXHI = f(p.hi);
  const big = rows.find(r => r.u.id === 'S147-db');
  T.BIGSHARE = `${Math.round(100 * (big.p.saved - big.p.lost) / (all.saved - all.lost))}%`; T.BIGNET = String(big.p.saved - big.p.lost); T.ALLNET = String(all.saved - all.lost);
  // does the gain follow the two tables' forecast error? Spearman's rank correlation over the units
  const rank = xs => { const o = xs.map((x, i) => [x, i]).sort((a, b) => a[0] - b[0]), r = []; o.forEach(([, i], k) => { r[i] = k + 1; }); return r; };
  const a = rank(rows.map(r => Math.abs(r.fk - sv(r.u, 'K2')))), b = rank(rows.map(r => r.p.d)), n = rows.length;
  T.SPEARMAN = (1 - 6 * sum(a.map((x, i) => (x - b[i]) ** 2)) / (n * (n * n - 1))).toFixed(2);
}
T.NUNITS = String(units.length);
T.NUP = String(rows.filter(r => r.p.d > 0).length); T.NSIG = String(rows.filter(r => r.p.lo > 0).length); T.NDOWNSIG = String(rows.filter(r => r.p.hi < 0).length);
const gH = rows.map(r => Math.abs(r.fh - sv(r.u, 'HOUSE'))), gK = rows.map(r => Math.abs(r.fk - sv(r.u, 'K2')));
T.FCMEAN = mean(gH).toFixed(2); T.FCMAX = Math.max(...gH).toFixed(2); T.FCK2MEAN = mean(gK).toFixed(2); T.FCK2MAX = Math.max(...gK).toFixed(2);
T.NCAPDOWN = String(rows.filter(r => r.cp < -0.5).length); T.CAPWORST = `${Math.min(...rows.map(r => r.cp)).toFixed(1)}%`; T.NSPENDUP = String(rows.filter(r => r.dS > 0).length);
T.CAPLIST = rows.filter(r => r.cp < -0.5).sort((a, b) => a.cp - b.cp).map(r => `${r.cp.toFixed(1)}% (${r.u.id})`).join('`, `');
const sr = units.map(u => u.solveSecs.HOUSE / u.solveSecs.K2), pr = units.map(u => u.arms.HOUSE.cpuMs / u.arms.K2.cpuMs);
T.SOLVE = mean(sr).toFixed(2); T.SOLVELO = Math.min(...sr).toFixed(2); T.SOLVEHI = Math.max(...sr).toFixed(2); T.PATH = mean(pr).toFixed(2); T.PATHLO = Math.min(...pr).toFixed(2); T.PATHHI = Math.max(...pr).toFixed(2);
const w = units.filter(u => u.arms.H1), rest = w.map(u => u.arms.H1.cpuMs - 5 * (u.arms.HOUSE.cpuMs - u.arms.H1.cpuMs) / 10), ce = units.map(u => u.arms.CEIL.cpuMs);
T.REST = `${Math.min(...rest).toFixed(0)} to ${Math.max(...rest).toFixed(0)}`; T.CEILMS = `${Math.min(...ce).toFixed(0)} to ${Math.max(...ce).toFixed(0)}`;
T.K2MS = `${Math.min(...units.map(u => u.arms.K2.cpuMs)).toFixed(0)} to ${Math.max(...units.map(u => u.arms.K2.cpuMs)).toFixed(0)}`;
T.CEILX = mean(units.map(u => u.arms.CEIL.cpuMs / u.arms.K2.cpuMs)).toFixed(2);
// the pilot, beside: the shapes the library lacks, and the two mends
{
  const XD = join(DIR, '..', DIR.endsWith('pilot-99003-45') ? 'pilot-extra-99003-45' : 'x');
  if (existsSync(XD)) {
    const X = readdirSync(XD).filter(f2 => f2.endsWith('.json') || f2.endsWith('.json.gz')).map(f2 => JSON.parse(f2.endsWith('.gz') ? gunzipSync(readFileSync(join(XD, f2))).toString() : readFileSync(join(XD, f2))));
    const V = X.filter(u => String(u.id).includes('@')).sort((a, b) => a.id.localeCompare(b.id));
    const what = { gap8: 'the partner eight years younger', penB90: 'the partner holding 90% of the pensions', even: 'the two the same age' };
    T.SHAPETABLE = ['| unit | what is changed | locked years | K2 | HOUSE | HOUSE less K2, points (95%) | the household table on its own plan (CEIL) |', '|---|---|---|---|---|---|---|',
      ...V.map(u => { const p = paired(u.arms.HOUSE.survived, u.arms.K2.survived), [b, v] = u.id.split('@'); return `| ${b} | ${what[v] || v} | ${u.bias.lockedYears} | ${sv(u, 'K2').toFixed(2)}% | ${sv(u, 'HOUSE').toFixed(2)}% | \`${f(p.d)}\` (${f(p.lo)} to ${f(p.hi)}) | ${u.arms.CEIL ? sv(u, 'CEIL').toFixed(2) + '%' : '-'} |`; })].join('\n');
    const pair = (a, b) => { const us = X.filter(u => u.arms[a] && u.arms[b]); if (!us.length) return null; const p = paired(us.flatMap(u => u.arms[a].survived), us.flatMap(u => u.arms[b].survived)); return { ...p, ids: us.map(u => u.id), us }; };
    for (const [a, b] of [['HOUSEC', 'HOUSE'], ['H0', 'HOUSE'], ['HT0', 'HOUSE'], ['HT5', 'HOUSE'], ['HT5', 'HT0']]) {
      const p = pair(a, b); if (!p) continue;
      T[`${a}_${b}`] = `\`${f(p.d)}\` points (\`${f(p.lo)}\` to \`${f(p.hi)}\`), ${p.saved} saved and ${p.lost} lost of ${p.n.toLocaleString('en-GB')} paths on ${p.ids.length} units`;
      T[`${a}_${b}_IDS`] = p.ids.join(', ');
      const sp = p.us.map(u => 100 * (sum(u.arms[a].delivered) / sum(u.arms[b].delivered) - 1)), tx = p.us.map(u => 100 * (sum(u.arms[a].tax) / sum(u.arms[b].tax) - 1));
      const cpx = p.us.map(u => { const c = u.cap || u.houseCap; return 100 * (mean(u.arms[a].wealth.map(v => Math.min(v, c))) / mean(u.arms[b].wealth.map(v => Math.min(v, c))) - 1); });
      T[`${a}_${b}_SPEND`] = `${f(Math.min(...sp))}% to ${f(Math.max(...sp))}%`; T[`${a}_${b}_TAX`] = `${f(Math.min(...tx), 1)}% to ${f(Math.max(...tx), 1)}%`; T[`${a}_${b}_CAP`] = `${f(Math.min(...cpx), 1)}% to ${f(Math.max(...cpx), 1)}%`;
      T[`${a}_${b}_MS`] = p.us.map(u => `${u.id.split('@')[0]}${u.id.includes('@') ? '@' + u.id.split('@')[1] : ''} ${u.arms[a].cpuMs.toFixed(0)} against ${u.arms[b].cpuMs.toFixed(0)} ms`).join(', ');
    }
    // the mended move's path against K2's (K2's time from the pilot's own file for the unit)
    const byId = Object.fromEntries(units.map(u => [u.id, u]));
    for (const a of ['HT0', 'HT5', 'H0']) { const us = X.filter(u => u.arms[a] && byId[u.id]); if (us.length) { const r = us.map(u => u.arms[a].cpuMs / byId[u.id].arms.K2.cpuMs); T[`${a}_K2X`] = `x${Math.min(...r).toFixed(2)} to x${Math.max(...r).toFixed(2)}`; T[`${a}_K2XMEAN`] = mean(r).toFixed(2); T[`${a}_K2MS`] = us.map(u => `${u.id} ${u.arms[a].cpuMs.toFixed(0)} ms against ${byId[u.id].arms.K2.cpuMs.toFixed(0)}`).join(', '); } }
  }
}
if (process.env.FIGURES_JSON) writeFileSync(process.env.FIGURES_JSON, JSON.stringify(T, null, 1));
console.log('THE FIGURES ANSWERS.md QUOTES FROM THE PILOT (the review, 17 Nov; EXPLORATORY): each by the name the answers were filled from');
for (const [k, v] of Object.entries(T)) if (k !== 'PILOTTABLE' && k !== 'SHAPETABLE') console.log(k, '=', v);
console.log('PILOTTABLE =\n' + T.PILOTTABLE);
console.log('SHAPETABLE =\n' + (T.SHAPETABLE || ''));
