# Raw results archive, 24 Sep 2026

The solver research's raw result files are git-ignored (`research/solver/results/`, `research/policy-study/results/`).
They are kept in the GitHub Release `results-2026-09-24`: they are too large for the repository's history.

| file | holds |
|---|---|
| `solver-results-2026-09-24-part1.tar` to `part28.tar` | `research/solver/results/`: its directories in name order, packed into parts of at most 28 MiB (the chat app's upload limit is 30 MiB); the loose files at the top of `results/` are in the last part |
| `policy-study-results-2026-09-24.tar.gz` | `research/policy-study/results/` |
| `SHA256SUMS` | the checksums of the 29 archives |
| `MANIFEST-solver-results.sha256` | the sha256 of every file under `research/solver/results/` (3,185 files) |

The per-path records (`*.solver.record.json.gz`, 684 of them) are already compressed, so the parts are plain tar.
`results/f1v2/` was being written while this archive was made (the F1 v2 test, launched 16:56 UK): its files here are
partial and are archived again once that run is written up.

## Restore

From the repository root:

    sha256sum -c SHA256SUMS                       # in the folder holding the downloaded archives
    cd research/solver && for t in /path/to/solver-results-2026-09-24-part*.tar; do tar -xf "$t"; done
    cd ../policy-study && tar -xzf /path/to/policy-study-results-2026-09-24.tar.gz
    cd ../solver && sha256sum -c --quiet /path/to/MANIFEST-solver-results.sha256

Checked before upload (24 Sep 17:01 UK): the 28 parts restored into an empty folder and all 3,181 files outside
`results/f1v2/` matched the manifest.
