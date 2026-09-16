import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { applyPatch } from '/home/user/vitejs-vite-kdvuf9qw/scripts/apply-edits.mjs';
import { findProse, skeleton } from '/home/user/vitejs-vite-kdvuf9qw/scripts/extract-copy.mjs';
let pass=0, fail=0;
const ok=(n,c,e='')=>{c?pass++:fail++;console.log(`${c?'PASS':'FAIL'}  ${n}${e?'  — '+e:''}`)};
const SRC='/home/user/vitejs-vite-kdvuf9qw';
const root = fs.mkdtempSync(path.join(os.tmpdir(),'safe-'));
fs.mkdirSync(path.join(root,'src'));
const reset=()=>{fs.copyFileSync(path.join(SRC,'src/App.jsx'),path.join(root,'src/App.jsx'));
                 fs.copyFileSync(path.join(SRC,'index.html'),path.join(root,'index.html'));};
const app=()=>fs.readFileSync(path.join(root,'src/App.jsx'),'utf8');
const pristine=fs.readFileSync(path.join(SRC,'src/App.jsx'),'utf8');

console.log('=== data values are never offered, so never rewritten');
for (const d of ['Other Investments (e.g. GIA)','Bracket Fill Basic','High Risk','Myself']) {
  const hits = findProse(pristine, d).filter(h => h.kind.startsWith('literal') || h.kind === 'template');
  ok(`"${d}" is not editable as a code literal`, hits.length === 0, `${hits.length} literal hit(s)`);
}
reset();
let r = applyPatch({ copy:[{ before:'Other Investments (e.g. GIA)', after:'Taxable account' }] }, { root });
ok('editing a data value is refused outright', !r.ok && /not shown anywhere/.test(r.failed[0].reason));
ok('  ...and CATEGORY_LABEL is untouched', app().includes("other: 'Other Investments (e.g. GIA)'"));

console.log('\n=== hostile input cannot break the file');
const hostile = [
  ['JSX braces',        'Total {plan.accounts[0].balance} oops'],
  ['a closing tag',     'Read </p><script>alert(1)</script> this'],
  ['a single quote',    "Don't break the model's parser"],
  ['a double quote',    'He said "hello" loudly'],
  ['a backtick + expr', 'Cost `${process.exit(1)}` here'],
  ['a backslash',       'Path C:\\\\Users\\\\test or so'],
];
for (const [name, evil] of hostile) {
  reset();
  const before = 'Where to start';
  const res = applyPatch({ copy:[{ before, after: evil }] }, { root });
  const now = app();
  if (res.ok) {
    ok(`${name}: applied, and only the text changed`, skeleton(now) === skeleton(pristine), 'code around the text moved');
  } else {
    // a refusal is also a correct outcome — what matters is that the file was left alone
    ok(`${name}: refused safely, file untouched`, now === pristine, 'refused but still wrote something');
    console.log('        reason:', res.failed[0].reason.slice(0, 100));
  }
}

console.log('\n=== one edit changes every place that wording is shown');
reset();
const label = 'Unchanged';
const n = findProse(pristine, label).length;
r = applyPatch({ copy:[{ before: label, after:'No change' }] }, { root });
ok(`"${label}" is written in ${n} place(s) and all were rewritten`,
   r.ok && r.applied[0].places === n && !app().includes('>Unchanged<'), JSON.stringify(r.applied[0] || r.failed[0]));

fs.rmSync(root,{recursive:true,force:true});
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
