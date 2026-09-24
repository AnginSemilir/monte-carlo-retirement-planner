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

// every literal value the batch scripts and the smoke run pass to experiment.mjs is accepted
const KNOWN = new Set([...Object.keys(WORDS), ...FLAGS, ...NUMBERS, ...LISTS, ...Object.keys(SPECIAL)]);
const seen = [];
for (const f of readdirSync(S).filter(x => /^batch-.+\.sh$/.test(x) || x === 'smoke.sh')) {
  // only the lines that run experiment.mjs: other scripts read their own settings (ONLY=v3 is an audit's band)
  const lines = readFileSync(join(S, f), 'utf8').split('\n').filter(l => /experiment\.mjs/.test(l)).join('\n');
  // a whole assignment in quotes ("PLANTIER=Medium Risk") first, then the bare ones
  const quoted = [...lines.matchAll(/["']([A-Z][A-Z0-9_]*)=([^"'$]*)["']/g)].map(m => [m[1], m[2]]);
  const rest = lines.replace(/["']([A-Z][A-Z0-9_]*)=([^"'$]*)["']/g, ' ');
  const bare = [...rest.matchAll(/(?:^|[\s"'(,])([A-Z][A-Z0-9_]*)=("[^"$]*"|'[^'$]*'|[^\s"'$,;)]+)/g)].map(m => [m[1], m[2]]);
  for (const m of [...quoted.map(q => [null, ...q]), ...bare.map(b => [null, ...b])]) {
    if (!KNOWN.has(m[1])) continue;
    const v = m[2].replace(/^["']|["']$/g, '');
    if (/[{}]/.test(v)) continue;   // an xargs or loop placeholder, filled at run time
    seen.push(`${f}: ${m[1]}=${v}`);
    const errs = checkSettings({ [m[1]]: v });
    ok(errs.length === 0, `${f}: ${m[1]}=${v} is accepted${errs.length ? ` (${errs[0]})` : ''}`);
  }
}
ok(seen.length > 20, `the scan found the scripts' settings (${seen.length} values) - a check that ran on nothing is an error`);
console.log(`\n${n} passed`);
