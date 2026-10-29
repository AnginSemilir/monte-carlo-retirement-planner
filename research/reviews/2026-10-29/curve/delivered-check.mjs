/*
 * WHAT A UNIT'S DELIVERED SPENDING IS (EXPLORATORY; SPENDING-CURVE.md section 6): the read's spending while alive weights
 * each retired year's level by the chance of being alive, so it needs delivered = the sum over years of level x target less
 * the path's unmet. This checks that identity on every unit: the largest gap a unit, in pounds. The app's levels are stored
 * rounded to a whole percent, so its units carry a rounding gap; the solver's levels are its menu's, exact. Planted: on the
 * first solver unit, the same sum at the target x (1 + 1e-3) must miss by more than 100 pounds.
 *   node delivered-check.mjs <unit dir>
 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gunzipSync } from 'zlib';
const dir = process.argv[2];
const T = { survived: Uint8Array, delivered: Float32Array, unmet: Float32Array, estate: Float32Array, wealth: Float32Array, failYear: Int16Array, level: Uint8Array };
const worst = { app: [0, ''], solver: [0, ''] };
let units = 0, planted = null;
for (const f of readdirSync(dir).filter(x => x.endsWith('.json.gz')).sort()) {
  const u = JSON.parse(gunzipSync(readFileSync(join(dir, f))));
  const m = Object.fromEntries(Object.entries(u.main).map(([k, v]) => { const b = Buffer.from(v, 'base64'); return [k, new T[k](b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))]; }));
  const gap = tg => { let w = 0; for (let k = 0; k < u.N; k++) { let s = 0; for (let t = 0; t < u.Y; t++) s += m.level[k * u.Y + t] / 100 * tg; w = Math.max(w, Math.abs(s - m.unmet[k] - m.delivered[k])); } return w; };
  const w = gap(u.target);
  if (planted === null && u.arm !== 'APP') planted = [gap(u.target * (1 + 1e-3)), `${u.id} ${u.arm}`];
  const kind = u.arm === 'APP' ? 'app' : 'solver';
  if (w >= worst[kind][0]) worst[kind] = [w, `${u.id} ${u.arm}`];
  units++;
}
console.log(`planted: at the target x (1 + 1e-3) the identity misses by ${planted[0].toFixed(0)} pounds on ${planted[1]} (${planted[0] > 100 ? 'seen' : 'NOT SEEN'})`);
console.log(`${units} units: the largest gap between delivered and the levels times the target less the unmet, the solver's units ${worst.solver[0].toFixed(2)} pounds (${worst.solver[1]}), the app's ${worst.app[0].toFixed(2)} pounds (${worst.app[1]})`);
