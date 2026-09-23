/*
 * RUN RECORDS: keep enough of every run to answer questions nobody has asked yet (maintainer, 23 Sep).
 *
 * A results JSON keeps summary statistics, and every later question - "do the cuts land in the bridge
 * years?", "when does the tier change?", "what does the pot look like at 80?" - has so far needed a
 * re-run. A record keeps, per path and per year, the spending level, the tier held, the wealth, the
 * pension's share of it and the tax paid, plus a per-path summary, compactly (about 11 bytes a
 * path-year, gzipped). With STOREPOL=1 the solver's stored move table is kept too, which is what the E1
 * persistence and ranking probes read. Written beside the results JSON as <id>.record.json.gz.
 *
 *   RECORD=1       write a record for every arm run
 *   STOREPOL=1     also keep the solver's stored moves (Uint16, one table a year)
 */
import { gzipSync, gunzipSync } from 'node:zlib';
import { writeFileSync, readFileSync } from 'node:fs';

export const RECORD = process.env.RECORD === '1';
export const STOREPOL = process.env.STOREPOL === '1';
export const RECORD_VERSION = 1;

export function makeTrace(N, Y) {
  return {
    N, Y, row: 0,
    level: new Uint8Array(N * Y),      // spend as % of target (0 = not a spending year or dead)
    tier: new Uint8Array(N * Y),       // tierPen * 4 + tierIsa held that year
    wealth: new Float32Array(N * Y),   // pension + ISA + taxable at the year's end
    penShare: new Uint8Array(N * Y),   // pension share of that wealth, %
    taxPaid: new Float32Array(N * Y),  // income tax + CGT paid in the year
    failYear: new Int16Array(N).fill(-1)
  };
}

/* Called once a year by a path runner, after the year's flow and growth. */
export function mark(tr, t, spendYear, level, s, tax, tierCode) {
  const k = tr.row * tr.Y + t;
  tr.level[k] = spendYear ? Math.max(0, Math.min(255, Math.round(100 * level))) : 0;
  tr.tier[k] = tierCode;
  const w = s[0] + s[1] + s[2];
  tr.wealth[k] = w;
  tr.penShare[k] = w > 0 ? Math.round(100 * s[0] / w) : 0;
  tr.taxPaid[k] = tax;
}
export function markFail(tr, t) { tr.failYear[tr.row] = t; }

const b64 = (ta) => Buffer.from(ta.buffer, ta.byteOffset, ta.byteLength).toString('base64');

/* Per-year aggregates, cheap to read without decoding the arrays. */
function perYear(tr, spendFlags) {
  const { N, Y } = tr, out = [];
  for (let t = 0; t < Y; t++) {
    const ws = [], lv = []; let alive = 0, below = 0, above = 0, taxSum = 0, tierOff = 0;
    for (let i = 0; i < N; i++) {
      const f = tr.failYear[i]; if (f >= 0 && f <= t) continue;
      alive++; const k = i * Y + t; ws.push(tr.wealth[k]); taxSum += tr.taxPaid[k]; if (tr.tier[k]) tierOff++;
      if (spendFlags[t]) { const l = tr.level[k]; lv.push(l); if (l < 100) below++; if (l > 100) above++; }
    }
    ws.sort((a, b) => a - b); const q = (p) => ws.length ? ws[Math.min(ws.length - 1, Math.floor(p * ws.length))] : 0;
    out.push({ t, alive: alive / N, wP10: q(0.1), wP50: q(0.5), wP90: q(0.9), belowFrac: lv.length ? below / lv.length : null, aboveFrac: lv.length ? above / lv.length : null, meanLevel: lv.length ? lv.reduce((a, b) => a + b, 0) / lv.length / 100 : null, taxMean: alive ? taxSum / alive : 0, offPlanTier: alive ? tierOff / alive : 0 });
  }
  return out;
}

export function writeRecord(path, tr, rs, meta, extra = {}) {
  const spendFlags = meta.spendYears || new Array(tr.Y).fill(1);
  const f32 = (key) => Float32Array.from(rs.map(r => (r[key] === null || r[key] === undefined) ? NaN : Number(r[key])));
  const body = {
    version: RECORD_VERSION, meta, N: tr.N, Y: tr.Y,
    perYear: perYear(tr, spendFlags),
    paths: {
      survived: b64(Uint8Array.from(rs.map(r => (r.survived ? 1 : 0)))),
      failAge: b64(f32('failAge')), terminalNet: b64(f32('terminalNet')), lifetimeTax: b64(f32('lifetimeTax')),
      belowYears: b64(Float32Array.from(rs.map(r => r.spendYears - r.atTarget))), aboveYears: b64(f32('aboveTarget')),
      changes: b64(f32('changes')), minLevel: b64(f32('minLevel')), meanLevel: b64(Float32Array.from(rs.map(r => r.levelSum / Math.max(1, r.spendYears))))
    },
    trace: { level: b64(tr.level), tier: b64(tr.tier), wealth: b64(tr.wealth), penShare: b64(tr.penShare), taxPaid: b64(tr.taxPaid), failYear: b64(tr.failYear) },
    ...extra
  };
  writeFileSync(path, gzipSync(JSON.stringify(body)));
}

/* Reading one back: typed arrays restored from base64. */
export function readRecord(path) {
  const body = JSON.parse(gunzipSync(readFileSync(path)).toString());
  const dec = (s, T) => { const b = Buffer.from(s, 'base64'); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
  const T = { level: Uint8Array, tier: Uint8Array, wealth: Float32Array, penShare: Uint8Array, taxPaid: Float32Array, failYear: Int16Array };
  for (const [k, C] of Object.entries(T)) body.trace[k] = dec(body.trace[k], C);
  for (const k of Object.keys(body.paths)) body.paths[k] = dec(body.paths[k], k === 'survived' ? Uint8Array : Float32Array);
  if (body.pol) body.pol = body.pol.map(s => dec(s, Uint16Array));
  return body;
}
export const polToB64 = (pol) => pol.map(p => b64(p));
