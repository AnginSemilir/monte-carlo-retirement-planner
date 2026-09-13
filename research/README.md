# research/

Everything here runs the engine **outside** the browser. `build-engine.py` slices the engine half of
`src/App.jsx` into `research/engine.mjs`, an importable ES module with every helper in the `E` namespace
re-exported by name. That file is generated and git-ignored — build it before running anything:

```sh
python3 research/build-engine.py
npm run test:engine        # 17 suites
```

Because the engine is *sliced from the app rather than duplicated*, these tests cannot drift from what
the app actually runs. Rebuild after any change to `src/App.jsx`.

## tests/

17 suites, ~580 assertions: UK income tax and NIC (including Scottish bands), CGT, the pre-access
bridge, spend bands, salary growth, self-employment, MPAA, the Monte Carlo fan, percentile bands,
sigmaParam, the safe-spend solver, scenario diffing, and the tournament entrants.

Several encode a bug that was *found by measurement and would return silently* — `safespend.test.mjs`
is the clearest: the solver used to bisect on 400 paths with one seed and report the result from 5,000
paths with another, so a "95% safe spend" was routinely a 92.6% one, on all twelve fixtures tested. The
assertion there is deliberately one-sided, and the comment says why.

## policy-study/

A library of UK households and a tournament over decumulation policies.

| file | what it is |
|---|---|
| `scenarios.mjs` | 360 households, built by crossing four primary axes and cycling five secondary ones |
| `challengers.mjs` | candidate policies that differ only in the order wrappers are emptied |
| `challengers2.mjs` | candidate policies that use the one-off cost and windfall-routing levers |
| `policy-run.mjs` | runs the tournament over a slice of the library, checkpointing as it goes |
| `dominance.mjs` | asks which policies are never the right answer, and which absent policy would be |
| `policy-analyse.mjs` | the win-tally view: who wins, where, and by how much |

```sh
npm run policy:run         # 4 workers, checkpoints to policy-run3-N.partial.json
npm run policy:dominance   # readable while the run is still going
```

### What the library covers

**Primary axes, crossed exhaustively** (6 × 5 × 4 × 3 = 360):

- **stage** — already retired · just retired · retired before pension access (a live bridge) · 5, 15 and
  28 years out
- **mix** — pension-heavy · ISA-heavy · GIA-heavy · balanced · cash-heavy
- **wealth** — £180k · £450k · £950k · £2.4m
- **spend** — 3.0% · 4.2% · 5.5% of the pot

**Secondary axes, cycled across the index** so each appears throughout the primary space rather than
clustering: single/couple, one-off costs and inheritances, employed/self-employed, rUK/Scotland, and a
minimum bequest on 40% of households (none · 20% of wealth · 45%).

Two things about the construction matter more than they look:

- **Spend is a fraction of the pot at RETIREMENT, not today.** A £180k pot 28 years from drawdown and a
  £180k pot already in drawdown are not the same household; pinning both to the same cash figure makes
  the far-off ones trivially safe and measures nothing. Each scenario runs one deterministic projection
  to find its own pot at drawdown, then sets the spend off that.
- **The bequest floor is on some households and not others, on purpose.** Without a floor, whatever is
  left at the end is only a tie-break, so a policy can win by keeping a household barely solvent. With
  one, the end pot becomes a hard survival constraint and a wealth-preserving policy can win outright.
  Both regimes have to be present or the study only measures one of them.

### Reading the results

Every candidate in a scenario runs on the **same seed**, so they see the same market paths. The
comparison is therefore paired, and the difference between two policies is far more precise than either
rate on its own — which is what lets a 2,000-path screen resolve gaps that a 2,000-path absolute
estimate could not. `dominance.mjs` states its thresholds; anything that clears them should be re-tested
at higher precision before it is believed.
