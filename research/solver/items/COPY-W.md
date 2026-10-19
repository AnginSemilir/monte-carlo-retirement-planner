# COPY-W: does the 30-point wealth axis carry what COPY-X leaves on S370, and do the copy rule and 60 wealth points interact? (detail for PLAN.md's COPY-W row and the ledger row adopting the deep review after COPY-X)

Proposed by the deep review after COPY-X (deep-review-log.md 19 Oct 09:44 UK) as the decisive next test; adopted under the
maintainer's standing go-ahead, the hand-over of 18 Oct, the decision of 18 Oct 17:19 (7u-F after the material gaps, each
fix with its own development test on the tuning seeds first) and the decision of 19 Oct 09:26 (each fix against the frozen
candidate, a factorial where fixes interact). It is the root-cause step of family W (O187) and the next step of family A
(the reader at the bridge).

## Why

COPY-X (results-copyx.txt, grade B for S370) removed most of S370's world-0 bridge over-read with the copy rule alone, but
two things remain over a point: CX's world-0 table less runs 2.5301, and world 1, where CX reads under its runs (-1.8271)
because the rule removed the step years' over-read that hid C's own under-read at the other bridge years (-4.0456;
results-copyx-years.txt). The deep review's read-only scripts (grade C) put the world-1 under-read, the after-access part GA
and world 0's years 4 to 6 on the wealth axis's 30 points (a second-order interpolation error signed by curvature: a cubic
read in log wealth in the same probability space matches STEP-S370's 60-point run extrapolated), and the step-year and
year-1-2 remainders on the copy rule's own form, cancelling by year. Its counterfactuals make the two fixes non-additive in
world 0, so the test is a factorial on the frozen candidate.

## Stage A (on S370; the review's design, set at registration)

S370 at the candidate as it stands, seed 7002 (the tuning seed), the first 4,000 paths a world, COPY-X's ledger with the
four-way split and the saved states:

- C and CX reused from results/diagcopyx (COPY-X's files; src/solver unchanged since d113c7e; the reuse fair-tested as a
  new test, CHECKLIST item 3).
- CW: C at 60 wealth points; it must reproduce STEP-S370's saved W60 bit for bit where their settings agree.
- CXW: CX at 60 wealth points.

Items (the review's; the registration sets the rules):
1. CXW removes at least half of CX's world-1 years-4-6 residual, path by path.
2. CXW's world-1 table less runs within a point.
3. CXW's world-0 table less runs at most a point.
4. The interaction (CXW - CW) - (CX - C) per world, three outcomes against half a point.
5. No material harm per world, CW against C and CXW against CX, by RULES.md section 8's rule as written, Holm within each
   pair.

Reported: the residual by year per arm and world, the sum of absolute residuals by year (the cancellation guard), GA and T,
and the cubic read beside each arm. The world-1 guard is the wealth arm itself: a world where CX reads more than a point
below C is charged to the copy rule only by CXW - CW. Before registration: 7at's read (b) (O80) and COPY-X cited with their
verdicts (the Review backlog's gate), and O81 and O36 named in the Unmasking field.

Set at the build (reduce-copyw.mjs; declared in the prediction):
- Items 2 and 3 read the grid residual G = GB + GA per path, the table less runs less T, with its mean's interval. T is the
  paths' own noise (the fine rule's quadrature part is under a hundredth of a point in every arm of COPY-X), and at 4,000
  paths the runs' binomial interval is about plus or minus 1.05 points in world 1 and 1.5 in world 0, wider than the band of a
  point, so the table less runs itself is reported beside the item, not read as one. On the same paths T is shared by every
  arm, so the review's "about 0.7" for CXW's world-0 table less runs is about 1.6 in G.
- Item 5 reads CXW against CX alone. CW is STEP-S370's W60 bit for bit, so its leg against C is known from the records
  before the run (derive-copyw.mjs section 1) and is reported, not an item.

A premise at risk the items lean on (the deep review after COPY-X; the plan-auditor's MINOR 6 of 19 Oct 10:23 UK): the
residual by year is not local. The audit's ledger (audit-copyx.mjs l.215-222, copied into audit-copyw.mjs) takes each bridge
year's residual as V_t - B_t, where the backup B reads year t+1 at the next states, so an over-read in one year can show as an
under-read in the year before (CX's world 1: year 7 +0.7691 beside year 6 -0.5881, results-copyx.txt). Item 1 (years 4 to 6),
the cancellation guard and the world-1 guard read the ledger by year, so each is read beside the neighbouring years' change;
the item totals (G by world) do not depend on it.

## Stage B (the breadth; registered after A reads, its arms set by A's item 4; over 2 hours, so the escalation review first)

- PMAP's step households S130, bridge 4 and S126: the factorial C, CX, CW, CXW.
- S380 (O139): C, CX, CW, the copied corners' weight at its visited bridge reads printed (the copy rule's reach).
- S128 (O133's after-access part): C, CX, CW.
- S224 (O145): C, CW; the copy rule inert by construction (no bridge year, O140), printed; registered: CW is expected to
  expose O145's under-read, not to harm.
- S362 (7u-F's deposit household), optional: C, CX, CW.

Items per fix and household, three outcomes, Holm across households: the copy rule removes at least half of C's GB where it
is over a point and the sum of absolute residuals by year does not grow; the wealth arm removes at least half of GA and of
the years-4-6 residual where over half a point; closure, the better cell's table less runs within a point in every world (a
17:19 gap is fixed when that holds; a nil reach print puts a gap out of that fix's scope only, not out of the candidate's,
so it still holds 7u-F under the 17:19 rule's condition 4 until another fix or a test shows it outside the candidate's scope);
no material harm per world. Closure is read on the grid residual GB + GA (stage A's form), the table less runs beside it.

## The maintainer's choice afterwards

The 60-point grid roughly doubles the solve; a cubic read at 30 points is the cheaper fix, tested once stage A shows the
mechanism. Neither is a default until the maintainer decides.

## STOP until stage A reads

The CX-alone breadth test; the log-odds-wealth guard and any log-odds fix; any wealth, copy or node default; settling
O185-UNMASK's mechanism; SN or SNRX breadth; 7u-F.
