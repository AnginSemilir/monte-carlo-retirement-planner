// POST HOC, a lead not a result: R's units by couple, wrapper and profiles apart (stored arrays only): the survival change,
// the paths lost, and ROUTE's mean end pot over APP's in APP's best tenth of markets and in its middle fifth (the growth held)
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder (as run, the main tree's)
process.env.REG = process.env.REG || '1';
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const DIR = process.env.DIR || new URL('../../results/couples-any-run', import.meta.url).pathname; // as run, the launch worktree's results/couples-any-run (raw results stay outside git)
const couples = (process.argv[2] || 'S041,S123,S207,S281').split(',');
const out = [];
for (const c of couples) {
  const units = loadDir(DIR).filter(u => u.couple === c && (u.cls === 'R' || u.cls === 'L'));
  for (const u of units) {
    const A = u.arms.APP, B = u.arms.ROUTE, n = u.N, ord = Array.from({ length: n }, (_, i) => i).sort((i, j) => A.pot[i] - A.pot[j] || i - j);
    const band = (lo, hi) => { let a = 0, b = 0; const sl = ord.slice(Math.floor(lo * n), Math.floor(hi * n)); for (const i of sl) { a += A.pot[i]; b += B.pot[i]; } return b / a; };
    let lost = 0, saved = 0; for (let i = 0; i < n; i++) { if (A.survived[i] && !B.survived[i]) lost++; if (!A.survived[i] && B.survived[i]) saved++; }
    out.push({ c, id: u.id, kind: u.kind, hold: u.hold, ch: 100 * (saved - lost) / n, lost, top: band(0.9, 1), mid: band(0.4, 0.6) });
  }
}
out.sort((a, b) => a.id.localeCompare(b.id));
for (const r of out) console.log(`${r.id.padEnd(14)} change ${r.ch.toFixed(2).padStart(6)} lost ${String(r.lost).padStart(3)} | ROUTE/APP end pot: middle fifth ${r.top ? r.mid.toFixed(3) : ''} best tenth ${r.top.toFixed(3)}`);
// by wrapper and distance, both holdings, mean over couples
for (const w of ['p', 'i']) for (const d of [1, 2, 3]) {
  const s = out.filter(r => r.kind.startsWith(`R${w}${d}`));
  const m = k => s.reduce((t, r) => t + r[k], 0) / s.length;
  console.log(`R${w}${d} (${s.length} units): change ${m('ch').toFixed(2)}, lost ${m('lost').toFixed(1)}, end pot ROUTE/APP middle fifth ${m('mid').toFixed(3)}, best tenth ${m('top').toFixed(3)}`);
}
const L = out.filter(r => r.kind === 'L'), m = k => L.reduce((t, r) => t + r[k], 0) / L.length;
console.log(`L (${L.length} units): change ${m('ch').toFixed(2)}, lost ${m('lost').toFixed(1)}, end pot ROUTE/APP middle fifth ${m('mid').toFixed(3)}, best tenth ${m('top').toFixed(3)}`);
