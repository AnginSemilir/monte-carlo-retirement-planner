/*
 * THE EXPERIMENT'S SETTINGS GUARD (research/solver/settings.mjs; RULES.md rule 2: shown to fail on a planted case).
 * Every value the batch scripts and the smoke run pass must be accepted, and the values that used to fall back
 * silently must be refused.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkSettings, WORDS, FLAGS, NUMBERS, LISTS, SPECIAL } from '../solver/settings.mjs';

const S = join(dirname(fileURLToPath(import.meta.url)), '../solver');
let n = 0; const ok = (c, msg) => { assert.ok(c, msg); n++; console.log(`PASS  ${msg}`); };
const bad = env => checkSettings(env).length > 0;

// planted: each value that used to fall back silently (24 Sep, the plan-auditor's tenth review)
ok(bad({ PLANTIER: 'Medium' }), 'planted: PLANTIER=Medium (not a tier name) is refused');
ok(bad({ FAILSHORT: 'true' }), 'planted: FAILSHORT=true is refused (it read as the floor fix off)');
ok(bad({ BEQSHAPE: 'soft-cap' }), 'planted: an unknown BEQSHAPE is refused (it read as cap)');
ok(bad({ RESIL: 'indicatr' }), 'planted: an unknown RESIL is refused (it read as the shortfall term)');
ok(bad({ SHAREDEAD: 'dropp' }), 'planted: an unknown SHAREDEAD is refused (it read as none)');
ok(bad({ RAISESURV: 'yes' }) && bad({ BRIDGEREAD: 'on' }), 'planted: an on/off flag other than 0 or 1 is refused (it read as off)');
ok(bad({ TIERS: '0' }), "planted: TIERS=0 is refused (experiment.mjs passes the string through as a tier list)");
ok(bad({ MIX: 'three' }) && bad({ LAMBDA: '' + 'x' }), 'planted: a number that does not parse is refused');
ok(bad({ LEVELS: '1.2,,1' }), 'planted: a list with a blank entry is refused');
ok(bad({ CONF: 'gkfloor' }) && bad({ CONF: '+x' }), 'planted: a CONF that is not a level, +margin or gkFloor is refused');
ok(!bad({ CONF: 'gkFloor' }) && !bad({ CONF: '+5' }) && !bad({ CONF: '0.9' }), 'CONF takes a level, a +margin or gkFloor');
ok(!bad({}), 'no settings at all is fine (the defaults)');
ok(!bad({ PLANTIER: 'Medium Risk', FAILSHORT: '1', BEQSHAPE: 'logfloor', RESIL: 'indicator', SHAREDEAD: 'none', TIERS: 'joint', RAISESURV: '1', MIX: '3', LEVELS: '1.2,1.1,1,0.95,0.9,0.8' }), 'valid values of each kind pass');

// every literal value the batch scripts and the smoke run pass to experiment.mjs is accepted. A batch sets its values on
// the line before the one that runs experiment.mjs (inside an sh -c body), so a file that runs experiment.mjs is read
// whole, less the lines that run another script (ONLY=v3 is an audit's band); the twelfth review found the first
// version of this scan read no batch at all
const KNOWN = new Set([...Object.keys(WORDS), ...FLAGS, ...NUMBERS, ...LISTS, ...Object.keys(SPECIAL)]);
const seen = { batch: 0, smoke: 0 };
for (const f of readdirSync(S).filter(x => /^batch-.+\.sh$/.test(x) || x === 'smoke.sh')) {
  const text = readFileSync(join(S, f), 'utf8');
  if (!/experiment\.mjs/.test(text)) continue;
  const lines = text.split('\n').filter(l => !/node\s+\S*\/(?!experiment\.mjs)[\w.-]+\.mjs/.test(l)).join('\n');
  // a whole assignment in quotes ("PLANTIER=Medium Risk") first, then the bare ones
  // (one quoted string can hold several: "BLOCKTRIM=1 RAISECAP=1" is split before each NAME=)
  const quoted = [...lines.matchAll(/["']([A-Z][A-Z0-9_]*=[^"'$]*)["']/g)].flatMap(m => m[1].split(/\s+(?=[A-Z][A-Z0-9_]*=)/)).map(x => { const k = x.slice(0, x.indexOf('=')), v = x.slice(x.indexOf('=') + 1); return [k, k === 'PLANTIER' ? v.trim() : v.split(/\s+/)[0]]; });   // only a tier name has spaces
  const rest = lines.replace(/["']([A-Z][A-Z0-9_]*)=([^"'$]*)["']/g, ' ');
  const bare = [...rest.matchAll(/(?:^|[\s"'(,])([A-Z][A-Z0-9_]*)=("[^"$]*"|'[^'$]*'|[^\s"'$,;)]+)/g)].map(m => [m[1], m[2]]);
  for (const [k, raw] of [...quoted, ...bare]) {
    if (!KNOWN.has(k)) continue;
    const v = raw.replace(/^["']|["']$/g, '');
    if (/[{}]/.test(v)) continue;   // an xargs or loop placeholder, filled at run time
    seen[f === 'smoke.sh' ? 'smoke' : 'batch']++;
    const errs = checkSettings({ [k]: v });
    ok(errs.length === 0, `${f}: ${k}=${v} is accepted${errs.length ? ` (${errs[0]})` : ''}`);
  }
}
ok(seen.batch > 50 && seen.smoke > 10, `the scan read the batch scripts (${seen.batch} values) and the smoke run (${seen.smoke}) - a check that ran on nothing is an error`);
ok(bad({ SOLVER_INTERP: 'Linear' }) && bad({ SOLVER_FOLD_K: 'x' }) && bad({ STOREPOL: 'true' }), "planted: the loaded modules' settings are checked too");
console.log(`\n${n} passed`);
