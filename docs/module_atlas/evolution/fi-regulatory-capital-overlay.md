## 9 · Future Evolution

### 9.1 Evolution A — Compute the capital stack instead of narrating it (analytics ladder: rung 1 → 2)

**What.** §7 classifies this page precisely: a descriptive dashboard whose climate add-ons (per-class `climateAdj`, the 80bps climate P2R, NGFS RWA impacts) are hand-authored constants, whose guide formula `CET1_ratio = CET1/RWA_climate` is never actually computed, and whose Basel IV output floor is described in timeline text but not calculated. Evolution A makes the quantitative machinery real: derive the climate RWA add-on from exposures and scenario stress rather than hard-coding it, compute the CET1 ratio, and implement the 72.5% output-floor check with its 2025–2030 phase-in.

**How.** (1) Reuse the Basel IRB K-function that already exists in the sibling `fi-taxonomy-pcaf-bridge` (§7 there confirms the ASRF formula is exactly transcribed) — apply NGFS-stressed PDs per asset class to get ΔRWA, replacing the eight hand-set `climateAdj` values. (2) Add a capital-inputs form (CET1 amount, IRB vs SA RWA) so the stack renders actual ratios and headroom vs MDA trigger. (3) Output floor: `max(RWA_IRB, phase_pct·RWA_SA)` with the phase schedule the timeline already lists.

**Prerequisites.** Shared FI exposure spine (same D0 demo book as the other CT modules); NGFS PD multipliers documented with vintage per §8 convention. **Acceptance:** changing the NGFS scenario changes ΔRWA and the CET1 ratio by hand-verifiable amounts; the hard-coded `climateAdj` and 80bps constants are gone or explicitly labelled supervisory-assumption inputs.

### 9.2 Evolution B — Supervisory-dialogue copilot for ECB/BoE expectations (LLM tier 1)

**What.** The module's genuinely strong asset is descriptive: the ECB-vs-BoE alignment scorecard, SREP/SS3/19/CBES timeline, and buffer taxonomy. Evolution B ships a tier-1 copilot that answers supervision-prep questions — "what does the ECB expect on climate P2R that the BoE doesn't yet?", "which timeline milestones bind us in 2027?" — grounded in the page's `ecbBoeComparison` and `TIMELINE` tables plus this atlas record's framework text (ECB Guide, SS3/19, CBES, NGFS Phase IV are all cited in §7.6).

**How.** RAG over the embedded atlas corpus with the page's structured tables serialized into context; no tool-calling needed for the first slice because the value is regime interpretation, not calculation. A refusal rule is critical here: quantitative questions ("what's our stressed CET1?") must be declined until Evolution A exists, since §7 documents that the current numbers are illustrative constants — the copilot must say so rather than dress demo data as capital analysis. Post-Evolution-A, the same copilot upgrades to tier 2 by tool-calling the new stack computation.

**Prerequisites.** Corpus embedding; the refusal behavior encoded in the bench_llm adversarial probes for this module. **Acceptance:** regime answers cite the specific scorecard/timeline row relied on; a stressed-ratio question pre-Evolution-A yields an explicit "not computed by this module" refusal, zero fabricated basis points.
