Verdict: PASS

# Design review, second look after one fix: every couple on the solver, the rest of the way, the registered test (`registrations/couples-any.md`; `COUPLES-ANY.md` the test; D141, D144 to D147)

This PASS covers one launch only: stamp `code d91a642206b9 audit 3a5474defb4f`, the 136 units at 26,000 paths on seed 7027.
A launch on any other stamp needs the reviewer again (registration, The launch).

**Subject:** the answers to my first verdict, `reviews/2026-11-24-couples-any-design.md` (FAIL: two BLOCKING, two MINOR),
in 9b954035, and anything that commit introduced. The tree is at 9b954035, clean and pushed. Nothing of seed 7027 was
run, read, printed or estimated.

**Read** (blobs at 9b954035):
- the registration 69550ed2a68f;
- `audit-couples-any.mjs` 2287e10c87a7, `reduce-couples-any.mjs` 7cade2e95b6b and `couples-any-port-identity.mjs`
  283f98d3087c, each against its f8f6925a version.

**Ran** (scripts in the session's scratchpad; nothing in the tree changed):
- **The stamp.**
  - The `TODO_ONLY` print gives `stamp: code d91a642206b9 audit 3a5474defb4f`, todo 0 to 135.
  - `stampFiles()` holds 58 files, `couples-any-port-identity.mjs` among them.
  - The stamped files that differ from f8f6925a are `audit-couples-any.mjs`, `reduce-couples-any.mjs` and
    `couples-any-port-identity.mjs`. The panel, its order and its paths are unchanged.
  - `configOf` is unchanged: APP ef459a5c8ccb, ROUTE 0fea0d25d803. `results/couples-any-run` is still empty.
- **The planted modes,** each with and without REG=1: panel 28 and 28; audit 17 and 16; reducer 22 and 22; identity 16 and
  16; sizing 4. All pass.
- **Mutants** of the fixed files, each run through its own `--planted`:
  - the reducer with f8f6925a's outcome block and `identityOf` put back: 6 of 22 fail;
  - the outcome block alone put back: 4 fail;
  - `identityOf` alone put back: 2 fail;
  - the identity's combine without its two tree checks: 2 of 16 fail;
  - an unmodified copy: all pass.
- **The rehearsal's read, unchanged.** The fixed `report`, run on the rehearsal's 144 records (`/home/user/couples-a`,
  seed 7002, already read) with its identity taken as shown, gives `results-couples-any.txt` from its third line on, byte
  for byte.
- **The identity under REG=1, on the pilot's own W records** (seed 7002, already read; `CAI_DIR` the pilot), on
  S041-W0-own and S281-Wc-Y75:
  - its header names the pilot's stamp and `this tree: code d91a642206b9 audit 3a5474defb4f`, the batch's;
  - both units are IDENTICAL: the table digest and every key of every path;
  - `identityOf` on that header refuses it ("the identity ran on another tree than the run's");
  - with the tree set to the run's, it takes it; with the run's stamp changed, it refuses.

## The first look's findings

1. **BLOCKING 1, the registered log: answered.**
   - `doneLine` (audit l.73) prints the engine's survival only when not registered, and the run calls it with `REGISTERED`
     (l.238).
   - The registered form is "done APP: config ef459a5c8ccb; CPU 5 s (625.0 ms a path)". The pilot's form is unchanged,
     byte for byte: the f8f6925a line l.230.
   - No other print in the registered path carries an outcome (the solve line, the MPAA ages, the resume lines, the done
     line).
   - Its planted case (l.131) passes both ways. With the survival put back into the registered form it fails.
   - Nothing a unit computes changed, so the pilot and its sizing stand, as the registration's "What the pilot shows" now
     says.
2. **BLOCKING 2, the outcome line: answered.** Under the registration, the line now prints:
   - **L passing while R fails** (`lHeld`, l.183): L goes to the maintainer with its units and R's, and R keeps today's
     handling. R passing while L fails opens R alone (registration l.94 onward).
   - **W failing:** W only comes back to the maintainer at once, its handling today the household route (l.190;
     registration l.104).
   - **W not read:** W goes to the maintainer (l.192; registration l.84).
   - **A pass with units that M1 names:** the read goes to the maintainer first with those units, before any default changes
     (l.195; registration l.88).
   - Each has its planted case, and the corrected l.227 asserts the right words. The rehearsal's wording is unchanged, as
     shown above.
3. **MINOR 3, the inference list: answered** (registration l.115, l.119). It now names:
   - the classes D144 opened, beyond three-year gaps with no other income at 60/40 and 25/75;
   - R on the taxable account, cash and the cash ISA, held at the larger holding's risk.
   L's comparison with the app's rules without the limits is said at l.21 to 22. It is what I measured on S041-L-own.
4. **MINOR 4, W's identity under the stamp: answered.**
   - The script is a stamp root (audit l.78), and its header and each part's count name the tree it ran on (l.132, l.142,
     l.166).
   - Its combine refuses a header naming no tree, or a part on another tree (l.73 to 75).
   - `identityOf` (reducer l.100 to 110) holds that tree's code and audit stamp to the run's.
   - This also closes a gap the old check would have opened. Once the header named a tree, the old `includes` would have
     matched the tree's words as the run's, and the old `identityOf` would have read "PASSES" on another run's stamp (the
     mutant above).

## Findings

None. The first look's "What holds" stands. The fix changed no rule, gate, panel, path count or arm.
