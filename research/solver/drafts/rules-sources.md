# Where the rules' approach came from (moved from RULES.md section 7 on 4 Oct, to keep RULES.md inside its budget)


- Anthropic, "Best practices for Claude Code": CLAUDE.md is advisory, hooks are deterministic; keep CLAUDE.md short;
  give the agent a check it can run; a verification subagent so "the agent doing the work isn't the one grading it";
  the Stop hook gives up after 8 consecutive blocks. https://code.claude.com/docs/en/best-practices
- Rule compliance falls as the number of instructions grows (Jaroslawicz et al. 2025, "How many instructions can LLMs
  follow at once?"). https://arxiv.org/abs/2507.11538
- Rules present after a compaction but no longer followed, while an imperative session-start hook was (claude-code
  issue 95745). https://github.com/anthropics/claude-code/issues/95745
- A research agent that edited its own time limit instead of speeding up (Sakana's AI Scientist): protect the checks.
  https://sakana.ai/ai-scientist/
- Pre-registration by a pushed git commit: "local history can be rewritten; a public push cannot be quietly
  backdated". https://github.com/levi909-create/open-subject-prereg
- The regimen of section 8: the outside review of 25 Sep, "Solver research: review, new findings and the updated
  regimen" (the claude.ai document the maintainer shared, 25 Sep 20:42 UK), with its sources (Appendix B there).
- Compare runs by what differs; the commonest cause of unreproducible results is a silent default.
  https://launchdarkly.com/blog/ml-experiment-tracking/



## Moved out of RULES.md by the retirement pass of 15 Oct (word for word)

### Section 2 item 3: the errors of 24 Sep

3. **Checked against my own error range.** I am a language model, and my errors are of known kinds. This
   session alone made each of these:
   - an arithmetic slip in a derivation (the M15 v2 rung table's first figures);
   - a wrong assumption about the data (that S162 had no minimum pot of its own; that a tier above High exists);
   - a mechanism that was right in part and missing a piece (the first M15 write-up missed the switch margin);
   - text left stale after the facts moved (the mathematician's page).

   So before a result changes the plan: recompute the derivation with a script, check every quoted figure
   against the file it came from, and test the mechanism with a check that could have failed (the M15
   diagnostic is the model). A result that has not been through this is marked "provisional" and changes
   nothing downstream.

### Section 9 rule 5: the carry rule as written (now the template's CARRY line)

   The carry family's step, CARRY (read 8 Oct 09:06 UK, held out on 7aw; results-carry.txt), gives the carrying rule for
   derivations: a per-household record carries to a test that differs in the estate weight alone (the only setting tested;
   for any other, grade D) within its paired band, except where
   a measured part is left out of the carry, where the setting moves a year-0 gap across the switch line (a flip), and on
   a household whose smaller of saved and lost is 15 or more; each of those takes its own record. A whole score carried to
   another weight is re-scored on the record's own traces with the policy held, beside each weight's own record (O123); each arm's own response to the weight is read apart, and with no record at the
   new weight a derivation declares its interval wide, grade D (the deep review of 8 Oct 09:32 UK; family F-W).
