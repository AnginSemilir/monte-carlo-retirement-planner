# TOP-CELL: the design draft (20 Oct; Claude, for a design review before any build)

The decisive next test (the deep review after REF-STEP, deep-review-log.md 20 Oct 10:31 UK; PLAN.md's TOP-CELL row and the
20 Oct 14:30 row). Designed at a high level by the deep review after REF-B (20 Oct 02:53 UK) before the package was chosen;
this draft fills in what the choice and the 19 Oct 09:26 row (each fix tested on its own against the frozen candidate, a
factorial where a fix interacts) now ask. Nothing below is built or registered.

## The question

What carries the step reads' remainder under the copy rule on S370, S130 and S128, and S370's world-1 years-1-2 remainder
(O192)? The 02:53 receipt's causes and credences: TC-SUPPORT 0.55 (c falls steeply just above the step inside the top
share cell, which no supported node identifies), TC-FORM 0.15 (a curved extrapolation from the existing nodes would do),
TC-SHARE 0.10 (twelve share nodes halve the cell), TC-OTHER 0.20; for O192, O192-W (the 30-point wealth axis) first.

## What the records already say (to be fair-tested before any reuse)

- COPY-X (results-copyx.txt): on S370 the copy rule (CX) removes 0.7893 of C's world-0 bridge residual; SNRX (support nodes,
  the RU scaling, the copy rule) removes 0.7762 of SNR's world-0 year-5 residual.
- STEP-O182 (results-o182.txt): support nodes alone (SN) move S370's world-1 over-read to year 1 (4.6685), carried by the
  corner residual (RC 5.0871 at year 1); with the RU scaling (SNR) year 1 reads -0.1982. So RU is part of the top-cell fix.
- REF-B (results-refb.txt): the copy rule adds across the two references (item 3 HELD); the RS split is inert on these data.
- REF-STEP (results-refstep.txt): under the package S370's table less runs rises in world 0 from 9.0487 (C) to 11.1426 (AN3)
  and in world 1 from 1.1402 to 2.6410: the step years unmasked (pre-registered as such, not harm).

## The arms (proposed)

The top-cell fix is the same addition under either reference: support nodes in the top share cell plus the RU scaling.

| arm | reference | share axis | split | copy rule | role |
|---|---|---|---|---|---|
| CX | plan (frozen) | the uniform six | none | extrap | the frozen candidate's copy arm (control) |
| SNRX | plan | support nodes | ru | extrap | the top-cell fix, TC-SUPPORT |
| CXC | plan | the uniform six | none | curve (new) | TC-FORM |
| C12X | plan | twelve uniform | none | extrap | TC-SHARE |
| PX | the package | the uniform six | rs | extrap | the package's copy arm (control) |
| PSNX | the package | support nodes | rsu (new) | extrap | the top-cell fix under the package |

At 30 points on S370, S130 and S128; on S370 also at 60 points (CX60, PX60; ANW's role for O192-W under the package; the
02:53 receipt: "read at 60 points so it is not tuned against an axis under-read").

## Code the design needs (each research only, off by default, with its own unit test, inertness check, smoke run and re-pin)

1. `readerSplit: 'rsu'`: RS and RU together (grid.js l.417: RS scales a corner's residual by the query's chance over the
   corner's where the query's is lower; RU by (1 - query) / (1 - corner) where it is higher; they act on opposite sides, so
   the combined scale is RS's below and RU's above). Without it the package's fix arm must drop RU (STEP-O182: RU carries the
   fix's year-1 correction) or the package's RS.
2. `readerCopy: 'curve'`: a copied node's c from the three supported nodes below by a quadratic in the share, clipped to
   [0, the source's c] as extrapC clips (reader.js l.264-270). TC-FORM's arm; without a curved form TC-FORM cannot be read.
3. Support nodes (`shareNodes`) under the adaptive reference: compatibility unread (the adaptive reference reads its own
   lattice; the grid's share axis feeds the chooser and the reader's c and R). A preflight check, or a unit test.

## Open questions for the design review

1. Is the factorial needed on all three households, or on S370 alone (the package unmasks S370's step years; S130 and S128
   read A2 under the plan reference, their reference effect unread)? Full: 18 jobs at 30 points plus 2 at 60.
2. Is `rsu` the right way to carry the fix under the package, or should the package's fix arm drop RS (inert on these data,
   REF-B) and keep RU, with the departure declared?
3. Is a curved form worth building for TC-FORM at 0.15, or should TC-FORM be read from the records (the corners' c at the
   supported nodes, a script over STEP-O182's and COPY-X's files)?
4. C12X: twelve share nodes double the share axis's solve cost; is TC-SHARE at 0.10 worth an arm, or a record read?
5. The harm items: the top-cell fix is a policy change other than a reference change, so harm is read by world (PR30);
   PX against CX is a reference change, read by the mixture. Is that split right for a factorial cell?
6. PR31's test: TOP-CELL's package arms carry PR31's split; its test is under revision (results-pr31-split.txt; the design
   review of 20 Oct 13:40 UK). Register TOP-CELL only once it is gate-ready, or declare the gap?
7. The budget: about 18 jobs at 30 points (REF-STEP's 0.65 job-hours a job) and 2 at 60 points; roughly 5 to 7 h wall on four
   cores. Escalation trigger 3 is checked when the derivation lands (its else row at 0.6 or more).
