# Registration: <name> (one page; CHECKLIST.md item 2)

Copy to `research/solver/registrations/<name>.md` (a reserved seed's owner names the file: `fresh-7uf*.md` for 7014,
`phase-4*.md` for 7003), fill every field, check it with `node research/solver/check-prediction.mjs <file>`, commit and
push it before launch. It is read once, by its decision rule.

- **Question:** <the one question this run answers>
- **Arms:** <each arm's name and configuration hash, as `node research/solver/state.mjs candidate` prints them>
- **Households:** <the panel, named before the seed is read, and the rule that chose it>
- **Seed:** <a held-out seed from the registry, used once>
- **Paths:** <per household, and why that many gives the rule its power>
- **Primary metric:** <scored by the engine; `runPolicy`'s figure beside it>
- **Decision rule:** <the exact test, its margin and adjustment, written before the run>
- **Outcomes:** <what each outcome decides: pass, harm, inconclusive>
- **Design review:** <PASS, research/solver/reviews/<date>-<name>.md>
