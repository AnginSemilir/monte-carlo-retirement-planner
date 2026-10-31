// Deep review of Phase 4 (post hoc, leads only): failure trajectories, year-0 levels, the decomposition, time profiles.
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
const [D, PF] = process.argv.slice(2);
const panel = JSON.parse(readFileSync(PF, 'utf8')).panel;
const dec = (s, T) => { const b = Buffer.from(s, 'base64'); const c = new Uint8Array(b.length); c.set(b); return new T(c.buffer); };
const ld = (id, a, w) => { const u = JSON.parse(gunzipSync(readFileSync(`${D}/${id}-${a}-w${w}.json.gz`)).toString()); const m = u.main; return { u, Y: u.Y, N: u.N, s: dec(m.survived, Uint8Array), d: dec(m.delivered, Float32Array), f: dec(m.failYear, Int16Array), L: dec(m.level, Uint8Array), um: dec(m.unmet, Float32Array), e: dec(m.estate, Float32Array), w: dec(m.wealth, Float32Array) }; };
const ARMS = [['app', '-'], ['ship', '0.02'], ['cand', '0.02'], ['ship', '0.01'], ['cand', '0.01']];
const N0 = 16000;
const acc = {};
const hh = [];
for (const h of panel) {
  const U = Object.fromEntries(ARMS.map(([a, w]) => [`${a}${w === '-' ? '' : w}`, ld(h.id, a, w)]));
  const row = { id: h.id, cohort: h.cohort };
  for (const [k, x] of Object.entries(U)) {
    const { Y, s, f, L } = x;
    // first retired year: the first t with level > 0 on path 0
    let t0 = -1; for (let t = 0; t < Y; t++) if (L[t] > 0) { t0 = t; break; }
    const A = (acc[k] ||= { fails: 0, failEarly: 0, prev110: 0, prev100: 0, prevFloor: 0, jump: 0, fy100: 0, fyFloor: 0, prevMid: 0, lvlYr: new Float64Array(70), nYr: new Float64Array(70), at110: 0, years: 0, first10: 0, n10: 0, y0lvl: [], surv: 0, gapYearsEarly: 0, prev2_110: 0 });
    let y0 = 0;
    for (let i = 0; i < N0; i++) {
      y0 += L[i * Y + t0];
      const fy = s[i] ? Y : f[i];
      for (let t = t0; t < Math.min(fy, Y); t++) { const l = L[i * Y + t]; if (l > 0) { A.lvlYr[t - t0] += l; A.nYr[t - t0]++; A.years++; if (l >= 110) A.at110++; } }
      // first 10 retired years, a path's mean level over the years it reached (failed years count 0)
      { let sm = 0; for (let t = t0; t < t0 + 10 && t < Y; t++) sm += t < fy ? L[i * Y + t] : 0; A.first10 += sm / 10; A.n10++; }
      if (s[i]) { A.surv++; continue; }
      A.fails++;
      const t = f[i];
      if (t === Y - 1) continue;           // the last year (the minimum pot or the final year)
      A.failEarly++;
      const lf = L[i * Y + t], lp = t > 0 ? L[i * Y + t - 1] : 0, lp2 = t > 1 ? L[i * Y + t - 2] : 0;
      if (lf >= 100 && lf < 110) A.fy100++; if (lf > 0 && lf <= 80) A.fyFloor++;
      if (lp >= 110) A.prev110++; else if (lp >= 100) A.prev100++; else if (lp > 80) A.prevMid++; else if (lp > 0) A.prevFloor++;
      if (lp >= 110 && lp2 > 0 && lp2 <= 80) A.jump++;
      if (lp >= 110 && lp2 >= 110) A.prev2_110++;
      A.gapYearsEarly += Y - 1 - t;
    }
    A.y0lvl.push(`${h.id}:${(y0 / N0).toFixed(0)}`);
    row[k] = { surv: 100 * s.slice(0, N0).reduce((a, b) => a + b, 0) / N0, d: (() => { let z = 0; for (let i = 0; i < N0; i++) z += x.d[i]; return z / N0; })() };
  }
  hh.push(row);
}
console.log('FAILURE TRAJECTORIES (first 16,000 paths, 40 households): failures before the last year; the level in the failure year and the year before');
for (const [k, A] of Object.entries(acc)) {
  console.log(`${k.padEnd(9)} fails ${A.fails}, before the last year ${A.failEarly} (mean years left ${(A.gapYearsEarly / A.failEarly).toFixed(1)}); failure year at 100% ${A.fy100}, at the floor ${A.fyFloor}; the year before: 110% ${A.prev110} (${(100 * A.prev110 / A.failEarly).toFixed(1)}%; from the floor two years before ${A.jump}; 110 two years running ${A.prev2_110}), 100-109% ${A.prev100}, 81-99% ${A.prevMid}, at the floor ${A.prevFloor}`);
}
console.log('\nYEAR-0 (first retired year) LEVEL, mean over paths, by household');
for (const [k, A] of Object.entries(acc)) console.log(`${k.padEnd(9)} ${A.y0lvl.join(' ')}`);
console.log('\nTIME PROFILE: mean level (% of target) by retired year, paths not yet failed; share of retired years at 110%; mean level over the first 10 retired years (failed years 0)');
for (const [k, A] of Object.entries(acc)) {
  const prof = []; for (const y of [0, 1, 2, 3, 5, 10, 15, 20, 25, 30, 35, 40]) if (A.nYr[y] > 0) prof.push(`${y}:${(A.lvlYr[y] / A.nYr[y]).toFixed(1)}`);
  console.log(`${k.padEnd(9)} ${prof.join(' ')} | at 110%: ${(100 * A.at110 / A.years).toFixed(1)}% of years | first 10 years ${(A.first10 / A.n10).toFixed(2)}%`);
}
// decomposition of A1 and A2: SHIP-APP and CAND-SHIP by cohort (per household means, equal weight)
console.log('\nDECOMPOSITION (per-household means, first 16,000 paths): survival points and spending delivered (% of APP\'s mean)');
for (const w of ['0.02', '0.01']) for (const coh of ['all', 'lib', 'fire']) {
  const H = hh.filter(r => coh === 'all' || r.cohort === coh), n = H.length;
  const m = f => H.reduce((a, r) => a + f(r), 0) / n;
  const sa = m(r => r[`ship${w}`].surv - r.app.surv), cs = m(r => r[`cand${w}`].surv - r[`ship${w}`].surv);
  const da = m(r => 100 * (r[`ship${w}`].d - r.app.d) / r.app.d), dc = m(r => 100 * (r[`cand${w}`].d - r[`ship${w}`].d) / r.app.d);
  console.log(`W${w} ${coh.padEnd(4)} (${n}): APP ${m(r => r.app.surv).toFixed(2)} SHIP ${m(r => r[`ship${w}`].surv).toFixed(2)} CAND ${m(r => r[`cand${w}`].surv).toFixed(2)}; survival SHIP-APP ${sa.toFixed(3)} + CAND-SHIP ${cs.toFixed(3)} (share from solving at all ${(100 * sa / (sa + cs)).toFixed(1)}%); spending SHIP-APP ${da.toFixed(3)}% + CAND-SHIP ${dc.toFixed(3)}%`);
}
