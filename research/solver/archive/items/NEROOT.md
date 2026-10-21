# NE-ROOT (PLAN.md NE-ROOT; predictions/diag-neroot.md; results-neroot.txt)

## The read (the ledger's 11 Oct 10:07 row), item by item, from results-neroot.txt

- **Gb:** 3.0490 points, SS's table less simulated over worlds 0 and 1 under BASE (2.7930 to 3.1923 at the bounds).
- **Item 1 (R0) INCONCLUSIVE:** the arm's gap -0.2437 (-0.4997 to -0.1003), removed 1.0799 (not over-corrected: its high end is above -Gb/2), SS tables 0.0005, 0.0077 and 0.0678 by world (rising), but bridge 4's table less simulated -47.7227, -48.5657 and -48.6254 by world: shown off. R0's re-solved bridge 4 table reads 53.8619 against BASE's 99.7554; that is a re-solve, not a split of bridge 4's read. R0 replaces the clip-and-copy split (c = S/p wherever p is at least 1e-12) and keeps the corner blend linear, so it removes both candidate parts of R at once and separates neither.
- **Item 2 (SIMP) FALSIFIED:** the gap 2.7481 (2.4921 to 2.8915), removed 0.0987; the SS tables 3.0354, 2.9888 and 1.5203 still fall with the world. The lognormal chance is not S364's cause (OW-PREF settled not, review-causes.md).
- **Item 3 (READEROFF) INCONCLUSIVE:** removed 1.0620, the tables rising (0.0064, 0.0245, 0.0563), bridge 4 off by -96.6931, -88.9724 and -83.3976 (the no-reader dead-corner pessimism, as the prediction expected). Two settings move together (the reader and bridgeStep): grade C for 'the reader as a whole'.
- **Item 4 INCONCLUSIVE:** r/sv 0.9996, 0.9921 and 0.8738 by world; HELD needed world 2 at 0.25 or less. In worlds 0 and 1, where the over-read sits, pc is 0.0016 and 0.0254 against sv 3.6685 and 3.2066, so the read there is R; in world 2 pc is 0.2238 of 1.7719. Corner status at the year-1 reads: share-copied 0.8749 and 0.8170 of the weight in worlds 0 and 1, clipped 0.0000 and 0.1749, row-copied 0.0000; R is 0 at a supported unclipped corner by construction, so world 0's r 3.6671 comes from copied corners, where the copied c sets R through the corner's own p (reader.js: R_i = S_i - p_i c_i).
- **Item 5 HELD:** bridge 4 under BASE 0.0967, 0.0011 and -0.0045 by world.

## What it settles and what it leaves (the plan-auditor's FAIL of 11 Oct 10:27 UK)

- **Settled (grade B, one seed):** R carries S364's read in worlds 0 and 1 (stage 1, deterministic); the chance does not; R0 and READEROFF remove the over-read and break bridge 4.
- **Open (grade C):** which part of R carries it - the split's copy (PR18) or the linear blend (PR17). The next split separates them, keeping bridge 4, with S364, bridge 4 and S380 read.
- **Reported:** S224's own opening within 1.3081 points by world; S380's 4.2477 over in world 0 and 2.1391 and 2.4565 under in worlds 1 and 2 (O139).
