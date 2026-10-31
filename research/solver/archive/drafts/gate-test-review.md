# The gate-test review: the locked changes, drafted for the unlock

The maintainer's decision (7 Oct, the session): "Yes, add the gate-test review rule." RULES.md section 4 row 14 carries
the rule. Their unlock in the same message was spelt "Unlcok enforcement", which the PreToolUse hook does not read
(`UNLOCK = /\bunlock enforcement\b/i`), so the three locked changes below wait for a message that says "unlock
enforcement". Nothing below weakens a check: each adds a requirement.

Why: two unit tests in one day passed planted faults where the fault could not show - the e3pcls test's one plant was
blind to two of its three clauses (the deep review of 7 Oct 00:01 UK), and the Q with TS+J test (O55,
research/tests/solver-q-tsj.test.mjs) first passed its layer plant at the one state where no layer fault could show, then
judged Q on moves Q never acts on (commits b272e6a, 97641da, 62857e9). Both were gates. Nothing in the architecture
reviewed a test's design before its result counted: the plan-auditor reads plan changes, the deep reviewer reads results,
and a unit test is neither a registered run nor, until it is recorded, a plan change.

## 0. The stricter wording the design review proposes (deep-review-log.md, 7 Oct 09:37 UK)

The first review under the rule found the Q test's plant caught only outside the slice where the fault acts, so it
proposes this wording, adopted here for the maintainer's unlock (RULES.md row 14 is shortened to fit the byte budget and
points here):

> A test that meets a gate is design-reviewed before its result is recorded as meeting it. The review lists each fault the
> gate guards and, for each: the check that would fail with it present; the slice of reads where it can act, with that
> slice's count printed by the test; and a planted fault caught inside that slice, with the plant's effect over the
> tolerance and the tolerance over the clean error each printed and each at least 2. A plant caught only outside its check's
> slice is a vacuous pass. A test edited after a failing run is re-reviewed before its passing run counts.

The review proposes the receipt be tied to the test file's git blob (so an edit after the review needs a new one). The
design below keys it on the deep-review-log receipt's time and adds the blob: the receipt names the file and its blob's
first 12 hex characters, and check-plan compares them with `git hash-object` of the file as committed.

## 1. CHECKLIST.md, item 6 (locked)

Now:

    6. Trust a check only after it has failed on a planted fault. A check that ran on nothing is an error, not a pass.

To:

    6. Trust a check only after it has failed on a planted fault. A check that ran on nothing is an error, not a pass. A test
       used to meet a gate is design-reviewed (the deep-reviewer: could it pass with the fault present?) before the gate is
       recorded met, and the record names that review: `design review: <D Mon HH:MM> UK`.

## 2. check-plan.mjs: the gate-tests check (locked)

After the bugs check, on the plan's lines (new lines only, as the other line checks read them, so history is not
re-judged):

    // gate tests (RULES.md section 4 row 14; the maintainer, 7 Oct): a line recording a gate met by a research/tests file
    // names the deep review of that test's design, and that receipt names the file
    const GATE_MET = /\bgate(?:s)?\s+(?:is\s+|are\s+)?met\b|\bGATE MET\b|\bmeets?\s+(?:its|the)\s+gate\b/i;
    const log = opt('deep-review-log.md') ?? '';
    for (const l of newLines) {
      if (!GATE_MET.test(l)) continue;
      const tests = [...new Set([...l.matchAll(/research\/tests\/([\w.-]+?)(?:\.test\.mjs|\.txt)\b/g)].map(m => m[1].replace(/^results-/, '').replace(/-\d+pts$/, '')))];
      if (!tests.length) continue;
      const dr = /design review:\s*(\d{1,2} \w{3} \d{2}:\d{2}) UK/.exec(l);
      if (!dr) { err('gate tests', `"${l.slice(0, 60)}..." records a gate met by ${tests.join(', ')} with no "design review: <D Mon HH:MM> UK"`); continue; }
      const receipt = log.split('\n').find(x => x.startsWith(`- ${dr[1]} UK |`));
      if (!receipt) { err('gate tests', `design review ${dr[1]} UK: no receipt at that time in deep-review-log.md`); continue; }
      for (const t of tests) if (!receipt.includes(t)) err('gate tests', `design review ${dr[1]} UK does not name ${t}`);
    }

(`newLines` and `opt` as check-plan.mjs already defines them for its other checks; the exact names are read at the unlock.)

## 3. plan-checker.test.mjs: its planted cases (locked)

Each must go red, and the last must pass (RULES.md row 2):

1. a new line "O55 gate met: research/tests/solver-q-tsj.test.mjs passes" with no design review: refused (no "design review").
2. the same with "design review: 7 Oct 09:59 UK" and no receipt at 09:59 in the log fixture: refused (no receipt).
3. a receipt at that time that names another test only: refused (does not name solver-q-tsj).
4. a receipt at that time naming solver-q-tsj: passes.
5. "gate met" citing no research/tests file (a registered run's results file): no requirement, passes.
6. the results file cited instead of the test (research/tests/results-solver-q-tsj-6pts.txt): read as solver-q-tsj, so case 1's refusal holds.

## 4. Unlocked parts (done before the unlock)

- RULES.md section 4 row 14 (the rule; RULES.md at its 72,000-byte budget, so section 9's 27-28 Sep family narrative was
  cut to a pointer to deep-review-log.md and the register, keeping its root-cause step and gate).
- items/7u.md and PLAN.md: O55's gate is recorded met only with the design review's receipt (at the next plan change, with
  7aj's result).
