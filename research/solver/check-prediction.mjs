/*
 * THE REGISTRATION CHECK AND THE SEED REGISTRY (the external review of 21 Oct, Part B Step 3; CHECKLIST.md item 2). The
 * launcher (run-from-snapshot.sh) calls it before a confirmatory run: the run's one-page registration in
 * research/solver/registrations/ must carry every field below, and the seeds the command and its scripts name must be the
 * registration's to use. A measurement (PREDICTION=none:<why>) needs no registration but may not touch a reserved seed.
 * The predictions written under the regimen before 21 Oct are archived (research/solver/archive/predictions/), and this
 * no longer checks their credences, derivations, decision tables or mechanism anchors.
 *   node research/solver/check-prediction.mjs <registration.md> [...]            is each one complete?
 *   node research/solver/check-prediction.mjs --seeds <registration.md | none> --text "<command>" [script ...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// a registration's fields, each a list item "- **<Field>:** <text>" with something after the colon
export const FIELDS = ['Question', 'Arms', 'Households', 'Seed', 'Paths', 'Primary metric', 'Decision rule', 'Outcomes', 'Design review'];
// the field's text on its own line ([ \t]*, not \s*: an empty field must not read the next line as its value)
const field = (text, name) => { const m = new RegExp(`^-[ \\t]+\\*\\*${name.replace(/ /g, '[ \\t]+')}:\\*\\*[ \\t]*(.*)$`, 'mi').exec(text); return m ? m[1].trim() : null; };
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
// the review's verdict, a line "Verdict: PASS" or "Verdict: FAIL" (the reviewer agent writes it; markdown emphasis allowed)
export const verdictOf = text => { const m = /^[*_\s]*verdict[*_\s]*:[*_\s]*(PASS|FAIL)\b/im.exec(String(text)); return m ? m[1].toUpperCase() : null; };
export function registrationProblems(text, { root = ROOT, exists = existsSync, read = f => readFileSync(f, 'utf8') } = {}) {
  const P = [];
  for (const f of FIELDS) { const v = field(text, f); if (v === null) P.push(`no "- **${f}:**" line`); else if (!v) P.push(`"${f}" is empty`); else if (/<[^>\n]*>/.test(v)) P.push(`"${f}" still holds a placeholder (${/<[^>\n]*>/.exec(v)[0]})`); }
  const arms = field(text, 'Arms');
  if (arms && !/\b[0-9a-f]{12}\b/.test(arms)) P.push('"Arms" names no configuration hash (12 hex characters, as state.mjs prints them)');
  const seed = field(text, 'Seed');
  if (seed && !seedsIn(seed).some(s => s in SEED_OWNERS)) P.push('"Seed" names no held-out seed from the registry');
  const rev = field(text, 'Design review');
  // the review is a file the reviewer wrote, its verdict PASS: the word PASS in the field is not enough (21 Oct: a
  // placeholder "<PASS, ...>" read as complete; research/tests/check-prediction.test.mjs)
  if (rev) {
    const m = /\bresearch\/solver\/reviews\/[\w.-]+\.md\b/.exec(rev);
    if (!m) P.push('"Design review" names no review file (research/solver/reviews/<date>-<name>.md, the reviewer\'s)');
    else if (!exists(join(root, m[0]))) P.push(`"Design review": ${m[0]} does not exist`);
    else if (verdictOf(read(join(root, m[0]))) !== 'PASS') P.push(`"Design review": ${m[0]} records no "Verdict: PASS" (${verdictOf(read(join(root, m[0]))) || 'no verdict line'})`);
  }
  return P;
}

// the registry (CHECKLIST.md item 2; unchanged from RULES.md section 8 item 9 but for the owners' folder): a reserved seed
// is used only under a registration it names
export const SEED_REGISTRY = Object.freeze({
  7001: 'search', 7002: 'tuning', 7003: 'Phase 4 only', 7004: 'second seed (replication; spent by three development tests)', 7005: 'selection',
  7011: 'held out: M14b, M14c, O19, quad-ref and 7e', 7012: 'held out: K6', 7013: 'held out: 7u', 7014: 'held out: 7u-F', 7018: "held out: Phase 4's replication, in 7004's place (registered with 7u-F, 21 Oct)", 7101: "the 'auto' rule" });
export const SEED_OWNERS = Object.freeze({
  7003: [/^phase-?4[\w.-]*\.md$/], 7018: [/^phase-?4[\w.-]*\.md$/], 7012: [/^k6[\w.-]*\.md$/], 7013: [/^confirm-7u[\w.-]*\.md$/], 7014: [/^fresh-7uf[\w.-]*\.md$/],
  7011: ['m14b.md', 'm14c-bets.md', 'o19-final.md', 'quad-ref.md', 'bridge-reader.md'] });
export const ownsSeed = (seed, name) => !!name && (SEED_OWNERS[seed] || []).some(o => typeof o === 'string' ? o === basename(name) : o.test(basename(name)));
// the registered seeds a text names, comment lines left out
export const seedsIn = text => [...new Set((String(text).split('\n').filter(l => !/^\s*#/.test(l)).join('\n').match(/\b\d{4}\b/g) || []).map(Number))].filter(n => n in SEED_REGISTRY).sort();
export function seedLaunchProblems({ name = null, predText = '', texts = [] }) {
  const used = seedsIn(texts.join('\n')), errs = [];
  for (const s of used.filter(s => s in SEED_OWNERS)) if (!ownsSeed(s, name)) errs.push(`seed ${s} is reserved (${SEED_REGISTRY[s]}) and this launch is under ${name ? basename(name) : 'a measurement'}`);
  const declared = name ? field(predText, 'Seed') : null;
  if (declared !== null) for (const s of used) if (!seedsIn(declared).includes(s)) errs.push(`the run uses seed ${s} (${SEED_REGISTRY[s]}), which the registration's Seed field does not declare`);
  return errs;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv[2] === '--seeds') {
    const [pred, ...rest] = process.argv.slice(3);
    if (!pred) { console.error('usage: check-prediction.mjs --seeds <registration.md | none> [--text "<command>"] [script ...]'); process.exit(2); }
    const texts = [];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === '--text') { texts.push(rest[++i] || ''); continue; }
      if (!existsSync(rest[i])) { console.error(`check-prediction --seeds: no such script ${rest[i]}`); process.exit(2); }
      texts.push(readFileSync(rest[i], 'utf8'));
    }
    const name = pred === 'none' ? null : pred;
    const errs = seedLaunchProblems({ name, predText: name ? readFileSync(name, 'utf8') : '', texts });
    if (errs.length) { console.log(`the seed registry refuses this launch:\n${errs.map(e => `  - ${e}`).join('\n')}`); process.exit(1); }
    console.log(`seeds: ${seedsIn(texts.join('\n')).map(s => `${s} (${SEED_REGISTRY[s]})`).join(', ') || 'none registered in the command or its scripts'}`);
    process.exit(0);
  }
  const files = process.argv.slice(2);
  if (!files.length) { console.error('usage: check-prediction.mjs <registration.md> [...]'); process.exit(2); }
  let bad = 0;
  for (const f of files) {
    const errs = existsSync(f) ? registrationProblems(readFileSync(f, 'utf8')) : [`no such file: ${f}`];
    if (errs.length) { bad++; console.log(`${f}: NOT COMPLETE\n${errs.map(e => `  - ${e}`).join('\n')}`); } else console.log(`${f}: complete`);
  }
  process.exit(bad ? 1 : 0);
}
