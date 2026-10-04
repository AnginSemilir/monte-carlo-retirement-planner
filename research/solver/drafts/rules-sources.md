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
