/*
 * NODE'S MATHS AGAINST CHROMIUM'S (step U): the harnesses compare the page's figures, worked out in Chromium, with Node's on
 * the same paths and seed. The counts (survival, the headline's levels and years) agree bit for bit; the money (the pots, the
 * money bands) can differ in the last place. This probe runs Math.pow, exp, log, sqrt, cbrt, expm1 and log1p on the same
 * 200,000 inputs in Node and in the Chromium the harnesses drive, and counts the results that are not the same double.
 * The money bands are therefore held within a relative 1e-12 in solver-planner-ui, solver-strategy-ui and
 * solver-projection-ui, every other figure bit for bit.
 *   node research/ui-harnesses/pow-probe.cjs      (its output: research/solver/results-pow-probe.txt)
 */
const { chromium } = require('/tmp/node_modules/playwright');
(async () => {
  let s = 12345; const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const N = 200000, xs = [], ys = [];
  for (let i = 0; i < N; i++) { xs.push(0.5 + rnd()); ys.push(-3 + 6 * rnd()); }
  const f = (xs, ys) => {
    const o = { pow: [], exp: [], log: [], sqrt: [], cbrt: [], expm1: [], log1p: [] };
    for (let i = 0; i < xs.length; i++) { o.pow.push(Math.pow(xs[i], ys[i])); o.exp.push(Math.exp(ys[i])); o.log.push(Math.log(xs[i])); o.sqrt.push(Math.sqrt(xs[i])); o.cbrt.push(Math.cbrt(xs[i])); o.expm1.push(Math.expm1(ys[i] / 10)); o.log1p.push(Math.log1p(ys[i] / 10)); }
    return o;
  };
  const here = f(xs, ys);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage();
  const there = await p.evaluate(([fs, xs, ys]) => (new Function('return ' + fs)())(xs, ys), [f.toString(), xs, ys]);
  console.log(`Node ${process.version} (V8 ${process.versions.v8}) against Chromium ${await b.version()}, ${N} inputs (x in [0.5, 1.5), y in [-3, 3))`);
  for (const k of Object.keys(here)) {
    let n = 0, ex = null;
    for (let i = 0; i < N; i++) if (!Object.is(here[k][i], there[k][i])) { n++; if (!ex) ex = `${k}(${xs[i]}, ${ys[i]}): Node ${here[k][i]}, Chromium ${there[k][i]}`; }
    console.log(`  ${k}: ${n} of ${N} differ${ex ? `; the first: ${ex}` : ''}`);
  }
  await b.close();
})().catch(e => { console.log('threw', e && e.stack); process.exit(1); });
