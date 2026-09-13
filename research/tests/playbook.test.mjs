/*
 * The policy playbook must describe the policy the ENGINE is running, not a policy someone wrote copy
 * for. It is generated from the same `steps`, `costSteps`, `depositOrder` and `harvest` the engine
 * executes, so the test is that the generation stays faithful as policies change.
 */
import * as E from '../engine.mjs';
let pass = 0, fail = 0;
const ok = (n, c, extra = '') => { c ? pass++ : fail++; console.log(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  -- ' + extra : ''}`); };
const P = E.taxParams(E.DEFAULT_CONFIG);

console.log('=========== EVERY POLICY GETS USABLE INSTRUCTIONS ===========');
for (const key of Object.keys(E.DECUMULATION_POLICIES)) {
  const pb = E.policyPlaybook(key, P);
  ok(`${key}: produces steps`, pb.length >= 4, `${pb.length} steps`);
  ok(`${key}: every step has a title and a body`, pb.every(s => s.title && s.body));
  /*
   * Only the tokens that are NOT also ordinary English. An earlier version of this check also looked for
   * "cash", "other" and "isa", and flagged every policy - because "your cash savings" is the correct
   * prose, not a leaked token. A test that cannot tell the output from the input is worse than none.
   */
  ok(`${key}: no raw engine tokens leak into the text`,
    !pb.some(s => /\b(penPA|penBasic|penAny)\b/.test(s.body)),
    pb.map(s => s.body).join(' ').match(/\b(penPA|penBasic|penAny)\b/)?.[0] || '');
}

console.log('\n=========== IT REFLECTS THE POLICY, NOT A TEMPLATE ===========');
{
  const bfb = E.policyPlaybook('Bracket Fill Basic', P);
  const seq = E.policyPlaybook('Sequential', P);
  ok('two different policies produce different instructions', bfb[0].body !== seq[0].body);
  ok('the drawing order appears in the order the engine uses',
    bfb[0].body.indexOf('personal allowance') < bfb[0].body.indexOf('cash savings'));
  ok('a policy without allowance harvesting does not describe it',
    !seq.some(s => /personal allowance anyway|draw that much pension income anyway/.test(s.body)));
  ok('a policy with it does', bfb.some(s => /move it straight into an ISA/.test(s.body)));
}
{
  // the windfall lever must be described only where the policy actually has an opinion
  const wisa = E.policyPlaybook('Windfall to ISA', P);
  const bfb = E.policyPlaybook('Bracket Fill Basic', P);
  const dep = (pb) => pb.find(s => /When money arrives/.test(s.title)).body;
  ok('a policy that routes windfalls says where they go', /Put it into your ISAs/.test(dep(wisa)), dep(wisa).slice(0, 60));
  ok('one that does not, explains the fallback instead', /Choose the wrapper yourself/.test(dep(bfb)), dep(bfb).slice(0, 60));
}
{
  // and the cost lever likewise
  const cost = (k) => E.policyPlaybook(k, P).find(s => /one-off cost/.test(s.title)).body;
  ok('the cost order matches the policy that set it',
    cost('Bracket Fill Basic').indexOf('cash savings') < cost('Bracket Fill Basic').indexOf('ISAs'));
}

console.log('\n=========== IT CANNOT DRIFT ===========');
{
  /*
   * The regression that matters. A policy added without touching this code must still be described
   * correctly - that is the whole reason it is generated rather than written.
   */
  E.DECUMULATION_POLICIES['Test Only'] = {
    label: 'Test', blurb: () => 'test policy',
    steps: ['isa', 'cash', 'other', 'penAny'], harvest: false, costSteps: ['other', 'cash', 'isa', 'penAny']
  };
  const pb = E.policyPlaybook('Test Only', P);
  ok('a brand-new policy is described without any code change', pb.length >= 3, `${pb.length} steps`);
  ok('its drawing order is read from its own definition', /Take from your ISAs, then your cash savings/.test(pb[0].body), pb[0].body.slice(0, 55));
  ok('its cost order too', /general investment account, then your cash savings/.test(pb[1].body), pb[1].body.slice(0, 60));
  ok('and it is not given harvesting it does not have', !pb.some(s => /straight into an ISA/.test(s.body)));
  delete E.DECUMULATION_POLICIES['Test Only'];
}
ok('an unknown policy returns nothing rather than throwing', E.policyPlaybook('nope', P).length === 0);

console.log(`\n=========== ${pass} passed, ${fail} failed ===========`);
process.exit(fail ? 1 : 0);
