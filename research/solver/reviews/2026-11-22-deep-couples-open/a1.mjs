// EXPLORATORY, post hoc: the registered read's stored arrays (seed 7026, already read), no new path or solve
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const E = await import(R + '../engine.mjs');
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const { readOpenPanel } = await import(R + 'couples-open-panel.mjs');
const panel = Object.fromEntries(readOpenPanel().map(u => [u.id, u]));
const units = loadDir(R + 'results/couples-open-run').sort((a, b) => a.k - b.k);
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const rows = [];
for (const u of units) {
  const P = panel[u.id].plan, d = P.demographics, A = u.arms.APP, X = u.arms.ROUTE, n = u.N;
  const ctx = E.buildContext(E.resolveMpaa({ ...P }));
  const T = ctx.totalYears, scale = u.caps[0] / 4, minPot = P.config.solvencyFloor, target = u.target;
  const sp = E.num(d.statePensionSelf, 0) + E.num(d.statePensionPart, 0);
  const db = (P.otherIncomes || []).reduce((t, i) => t + E.num(i.amount, 0), 0);
  // failures by kind: at the end below the minimum pot (unmet within tolerance), or running out (unmet)
  const kinds = Arm => { let end = 0, out = 0, fail = 0; for (let i = 0; i < n; i++) if (!Arm.survived[i]) { fail++; if (Arm.unmet[i] > 1) out++; else end++; } return { fail, end, out }; };
  const ka = kinds(A), kx = kinds(X);
  // the mean level over all paths: delivered / (target x years)
  const lvl = Arm => sum(Arm.delivered) / n / (target * (T + 1));
  // on the paths both keep
  let bk = 0, da = 0, dx = 0; for (let i = 0; i < n; i++) if (A.survived[i] && X.survived[i]) { bk++; da += A.delivered[i]; dx += X.delivered[i]; }
  const capA = sum(Array.from(A.pot, v => Math.min(v, u.caps[0]))) / n, capX = sum(Array.from(X.pot, v => Math.min(v, u.caps[0]))) / n;
  const overA = Array.from(A.pot).filter(v => v > u.caps[0]).length / n, overX = Array.from(X.pot).filter(v => v > u.caps[0]).length / n;
  rows.push({ id: u.id, T, target, scale, minPot, sp, db, cover: (sp + db) / target, sOverT: scale / target,
    sA: 100 * sum(A.survived) / n, sX: 100 * sum(X.survived) / n, ka, kx, lA: lvl(A), lX: lvl(X), keptD: 100 * (dx / da - 1), bk,
    potA: sum(A.pot) / n, potX: sum(X.pot) / n, capA, capX, overA, overX, taxA: sum(A.tax) / n, taxX: sum(X.tax) / n });
}
const f = (x, k = 2) => x.toFixed(k);
console.log('id          T  target  scale/T cover  minPot/scale | APPfail end/out | ROUTEfail end/out | level APP ROUTE (all paths) | kept% | capped pot APP ROUTE (k) | over cap APP ROUTE');
for (const r of rows) console.log(`${r.id.padEnd(11)} ${String(r.T).padStart(2)} ${String(r.target).padStart(6)} ${f(r.sOverT, 1).padStart(5)} ${f(r.cover).padStart(5)} ${f(r.minPot / r.scale).padStart(5)} | ${r.ka.fail} ${r.ka.end}/${r.ka.out} | ${r.kx.fail} ${r.kx.end}/${r.kx.out} | ${f(r.lA, 3)} ${f(r.lX, 3)} | ${f(r.keptD, 3)} | ${f(r.capA / 1e3, 0)} ${f(r.capX / 1e3, 0)} | ${f(r.overA, 3)} ${f(r.overX, 3)}`);
