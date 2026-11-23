// the read's stored arrays: each unit's survival change, ROUTE less APP, in points; its range by couple
process.env.REG = '1';
const R = new URL('../../', import.meta.url).pathname; // research/solver/, from this folder
const { loadDir } = await import(R + 'reduce-couples-open.mjs');
const units = loadDir(R + 'results/couples-open-run');
const sum = a => { let s = 0; for (const x of a) s += x; return s; };
const ch = units.map(u => ({ id: u.id, c: u.couple, d: 100 * (sum(u.arms.ROUTE.survived) - sum(u.arms.APP.survived)) / u.N }));
const mm = xs => `${Math.min(...xs.map(x => x.d)).toFixed(2)} (${xs.reduce((a, b) => (b.d < a.d ? b : a)).id}) to ${Math.max(...xs.map(x => x.d)).toFixed(2)} (${xs.reduce((a, b) => (b.d > a.d ? b : a)).id})`;
console.log('all', mm(ch));
for (const c of ['S037', 'S119', 'S199', 'S279']) console.log(c, mm(ch.filter(x => x.c === c)));
