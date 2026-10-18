/*
 * HO-DEP'S HOUSEHOLD, CHOSEN BEFORE REGISTRATION (items/HO-DEP.md; the deep review after FOOT-S366, deep-review-log.md 18 Oct
 * 09:43 UK: "chosen by a 30-point A-against-O differing-moves count over four candidates with world-0 survival 20-80%", AX-HO's
 * reach lesson). Two steps over audit-hodep.mjs's files, each rule fixed before its step runs:
 *   --screen <dir>  the deposit-mid candidates under the order reference at 15 points (HODEP_SCREEN=1; a 4-point screen
 *                   misplaced world-0 survival by 10-15 points, the deep-reviewer's consult of 18 Oct 11:27 UK): world-0
 *                   survival from each one's own runs; the four whose world-0 survival lies in [20, 80], nearest 50 (ties by the lower id), named on a
 *                   REACH line for the next step; fewer than four in the band is a refusal (exit 1)
 *   --reach <dir>   A against O at 30 points on the four (HODEP_REACH): the moves differing on the same paths, path-years and
 *                   paths by world, weighted at the chooser's world weights (MIX3); among those whose world-0 survival under
 *                   O at these points still lies in [20, 80], the household with the most weighted differing path-years
 *                   (ties by the lower id) named on a CHOSEN line; none such, a refusal (exit 1)
 *   node research/solver/select-hodep.mjs --screen research/solver/results/hodep-screen
 *   node research/solver/select-hodep.mjs --reach research/solver/results/hodep-reach
 */
import { readFileSync, readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';

export const NOMOVE = 65535, BAND = [20, 80], AIM = 50, MIX3W = [1 / 6, 2 / 3, 1 / 6];
const ld = p => JSON.parse(gunzipSync(readFileSync(p)).toString());
const dec8 = x => new Uint8Array(Buffer.from(x, 'base64'));
const dec16 = x => { const b = Buffer.from(x, 'base64'); return new Uint16Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const idNum = id => Number(id.slice(1));
const filesIn = dir => readdirSync(dir).filter(f => f.endsWith('.json.gz')).map(f => ld(join(dir, f)));

// the screen's rule: [{ id, s0 }] -> the four in the band nearest AIM, ties by the lower id
export function pickFour(rows) {
  return rows.filter(r => r.s0 >= BAND[0] && r.s0 <= BAND[1]).sort((a, b) => Math.abs(a.s0 - AIM) - Math.abs(b.s0 - AIM) || idNum(a.id) - idNum(b.id)).slice(0, 4);
}
// the reach's rule: [{ id, wpy, s0 }] -> among those in the band at the reach's points, the most weighted differing path-years,
// ties by the lower id; none with any -> null
export function pickOne(rows) {
  const r = rows.filter(x => x.wpy > 0 && x.s0 >= BAND[0] && x.s0 <= BAND[1]).sort((a, b) => b.wpy - a.wpy || idNum(a.id) - idNum(b.id));
  return r.length ? r[0] : null;
}
// moves differing between two saved jobs on the same paths: path-years where both reached the year and moved differently,
// and the paths with any such year, summed over the worlds both carry and weighted by world (MV<k>, k's MIX3 weight)
export function differ(a, b) {
  let py = 0, paths = 0, worlds = 0, wpy = 0;
  for (const key of Object.keys(a.moves || {})) {
    if (!b.moves || !b.moves[key]) continue;
    const ma = dec16(a.moves[key]), mb = dec16(b.moves[key]), Y = a.years;
    if (ma.length !== mb.length) throw new Error(`differ: ${key} has ${ma.length} and ${mb.length} entries`);
    worlds++;
    const k = Number(key.slice(2)), w = MIX3W[k];
    if (!(w > 0)) throw new Error(`differ: no world weight for ${key}`);
    for (let i = 0; i < ma.length / Y; i++) { let any = false; for (let t = 0; t < Y; t++) { const x = ma[i * Y + t], y = mb[i * Y + t]; if (x !== NOMOVE && y !== NOMOVE && x !== y) { py++; wpy += w; any = true; } } if (any) paths++; }
  }
  return { py, paths, worlds, wpy };
}

function planted() {
  const cases = [];
  const four = pickFour([{ id: 'S370', s0: 95 }, { id: 'S374', s0: 52 }, { id: 'S378', s0: 48 }, { id: 'S382', s0: 20 }, { id: 'S386', s0: 80 }, { id: 'S390', s0: 19.9 }, { id: 'S394', s0: 30 }, { id: 'S398', s0: 70 }]);
  cases.push(['the screen keeps the band and takes the four nearest 50, ties by the lower id', four.map(x => x.id).join(','), 'S374,S378,S394,S398']);
  cases.push(['the screen keeps a value at the band\'s edge and drops one past it', pickFour([{ id: 'S370', s0: 20 }, { id: 'S374', s0: 80.01 }]).map(x => x.id).join(','), 'S370']);
  cases.push(['the reach takes the most weighted differing path-years, ties by the lower id', pickOne([{ id: 'S390', wpy: 40, s0: 50 }, { id: 'S374', wpy: 40, s0: 50 }, { id: 'S378', wpy: 12, s0: 50 }]).id, 'S374']);
  cases.push(['the reach chooses none when no candidate differs', String(pickOne([{ id: 'S374', wpy: 0, s0: 50 }])), 'null']);
  cases.push(['the reach drops a candidate outside the band at its own points', pickOne([{ id: 'S374', wpy: 90, s0: 85 }, { id: 'S378', wpy: 10, s0: 60 }]).id, 'S378']);
  const mv = arr => Buffer.from(Uint16Array.from(arr).buffer).toString('base64');
  const A = { years: 3, moves: { MV0: mv([1, 2, 3, 1, 2, NOMOVE]) } }, B = { years: 3, moves: { MV0: mv([1, 5, 3, 1, 2, 7]) } };
  cases.push(['the count skips a year one job did not reach and weights by world', JSON.stringify(differ(A, B)), JSON.stringify({ py: 1, paths: 1, worlds: 1, wpy: 1 / 6 })]);
  const B1 = { years: 3, moves: { MV1: mv([1, 5, 3, 1, 2, 7]) } }, A1 = { years: 3, moves: { MV1: mv([1, 2, 3, 1, 2, NOMOVE]) } };
  cases.push(['the middle world weighs 2/3', differ(A1, B1).wpy.toFixed(6), (2 / 3).toFixed(6)]);
  let bad = 0;
  for (const [what, got, want] of cases) { const ok = got === want; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}: ${got}${ok ? '' : ` (want ${want})`}`); }
  console.log(bad ? `PLANTED CHECK FAILED (${bad})` : `planted (${cases.length}): all read as they should`);
  return bad;
}

if (process.argv[2] === '--planted') process.exit(planted() ? 1 : 0);
const [mode, dir] = process.argv.slice(2);
if (mode === '--screen') {
  const rows = filesIn(dir).filter(j => /-O-/.test(`-${j.job.split('/')[0]}-`) || j.job.startsWith('O/')).map(j => { const b = dec8(j.bits.OWN0); return { id: j.id, s0: 100 * b.reduce((t, x) => t + x, 0) / j.NPW, n: j.NPW }; }).sort((a, b) => idNum(a.id) - idNum(b.id));
  for (const r of rows) console.log(`  ${r.id}: world-0 survival under the order reference ${r.s0.toFixed(2)} on ${r.n} paths${r.s0 >= BAND[0] && r.s0 <= BAND[1] ? '' : ' (outside the band)'}`);
  const four = pickFour(rows);
  if (four.length < 4) { console.log(`SCREEN REFUSED: ${four.length} candidates in [${BAND.join(', ')}]`); process.exit(1); }
  console.log(`REACH: ${four.map(x => x.id).join(',')}`);
} else if (mode === '--reach') {
  const js = filesIn(dir), ids = [...new Set(js.map(j => j.id))].sort((a, b) => idNum(a) - idNum(b)), rows = [];
  for (const id of ids) {
    const a = js.find(j => j.id === id && j.job.startsWith('A/')), o = js.find(j => j.id === id && j.job.startsWith('O/'));
    if (!a || !o) { console.log(`  ${id}: A or O missing`); continue; }
    const d = differ(a, o), s0 = 100 * dec8(o.bits.OWN0).reduce((t, x) => t + x, 0) / o.NPW;
    rows.push({ id, ...d, s0 });
    console.log(`  ${id}: moves differing, A against O at 30 points: ${d.paths} paths and ${d.py} path-years over ${d.worlds} worlds, weighted ${d.wpy.toFixed(2)}; O's world-0 survival ${s0.toFixed(2)}${s0 >= BAND[0] && s0 <= BAND[1] ? '' : ' (outside the band at these points)'}`);
  }
  const one = pickOne(rows);
  if (!one) { console.log('REACH REFUSED: no candidate where the references move differently'); process.exit(1); }
  console.log(`CHOSEN: ${one.id}`);
} else { console.error('usage: select-hodep.mjs --screen <dir> | --reach <dir> | --planted'); process.exit(2); }
