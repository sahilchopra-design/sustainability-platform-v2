## 9 · Future Evolution

### 9.1 Evolution A — Correct EB65 deduction schedule + full JCGM 101 adaptive Monte Carlo (analytics ladder: rung 2 → 3)

**What.** Fix the module's documented regulatory defect and then complete the JCGM 101 implementation. §7's mismatch flag: the code's deduction schedule (`u_c<5→0%, <10→2%, <20→5%, else 10%`) uses different breakpoints and percentages than CDM EB65 Annex 29 (`U<10%→0, <20→3, <30→5, <50→10, ≥50→ineligible`), omits the ineligibility ceiling entirely, and applies the discount to combined standard uncertainty `u_c` instead of expanded uncertainty `U_95 = 2×u_c`. For a module whose stated business value is VVB verification support, a wrong deduction table is a P1 correctness issue, not a style choice.

**How.** (1) Encode the EB65 Annex 29 table verbatim, keyed on `U_95`, with the ≥50% ineligible outcome rendered honestly (net issuable = 0, flagged). (2) Replace the normal-approximation P5/P50/P95 (§7.1 notes a small negative bias in the P50 formula) with the actual JCGM 101 adaptive Monte Carlo: propagate the 5 parameter distributions through the ER formula with the standard-required trial-doubling until the 95% interval endpoints stabilise. (3) Pin both against JCGM 101's published worked example and one hand-computed CDM case in `bench_quant`.

**Prerequisites.** Downstream check: any of the 30 synthetic projects' displayed net-issuable figures will change — release note required; the 3-module shared `monte_carlo_engine` must not be touched without regression runs. **Acceptance:** a project with U_95 = 55% shows "ineligible", matching EB65; JCGM 101 worked example reproduces within stated tolerance.

### 9.2 Evolution B — Verification-audit copilot for VVB submissions (LLM tier 1 → 2)

**What.** A copilot that walks a carbon-project developer through uncertainty assessment the way a DOE/VVB reviewer would: "why did my ERs get a 5% deduction?", "which parameter dominates my combined uncertainty?", "what would reducing grid-EF uncertainty to 3% buy me?" — answered from the page's real GUM decomposition (per-parameter sensitivity × uncertainty contributions, the tornado analysis §7 confirms is genuinely implemented) and, for what-ifs, by re-invoking the calculation rather than estimating.

**How.** Tier 1 first: system prompt from this Atlas page's §5 GUM formula and §7 walkthrough, answering strictly from the currently rendered decomposition — the JCGM 100/101 and EB65 reference documents named in §5 form the citation corpus so regulatory assertions quote the standard, not model memory. Tier 2 adds tool calls: the what-if above becomes a parameter-modified recalculation through the module's compute path (today client-side; through `POST /api/v1/monte-carlo/run` once server-side), with the fabrication validator matching every quoted uncertainty percentage to a computed output.

**Prerequisites (hard).** Evolution A's deduction-table fix must land first — a copilot confidently explaining the current non-EB65 schedule to a project developer preparing a real CDM submission would be actively harmful. **Acceptance:** deduction explanations cite the EB65 threshold applied; asking "will my VVB accept this?" yields a scoped refusal (the module computes uncertainty, not verification outcomes).
