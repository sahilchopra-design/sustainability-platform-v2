## 9 · Future Evolution

### 9.1 Evolution A — Statistically-derived P90 haircut and warranty-adequacy debt sizing (analytics ladder: rung 1 → 3)

**What.** Solid tier-B foundation: `MODULES` (20 real named products) is hand-curated with real degradation rates, IEC certification codes, and PVEL/DNV-style bankability tiers, and `computeP90Yield` is a genuine power-law degradation model. Its documented simplification (§7.2) is that the P90 curve applies a `sr(y×id) × 2%` random haircut with a `p50 − 2.5pp` floor — the *structure* of a P90/P50 relationship is correct, but the haircut magnitude is illustrative, not statistically fit. For a module whose entire purpose is lender debt-sizing, that is the number that matters most. Evolution A makes the P90 haircut a real uncertainty computation and closes the warranty-adequacy loop.

**How.** (1) Derive the P90/P50 ratio from an uncertainty budget (interannual irradiance variability, degradation-rate uncertainty, soiling, availability) via the standard lognormal quantile approach the sibling `solar-resource-performance` already implements correctly (`p90 = p50 × exp(−1.282σ)`) — replacing the random per-year haircut with a defensible σ. (2) Warranty-adequacy engine: compare each module's power-warranty curve against the modelled P90 degradation and the manufacturer's financial strength, flagging where warranty coverage is insufficient for the debt tenor. (3) A debt-sizing output: max sculpted debt at a target DSCR given the P90 yield. (4) Refresh `bankability` tiers against the current PVEL Scorecard edition with a cited vintage.

**Prerequisites.** An uncertainty-budget input set per module/site; PVEL Scorecard edition for the tier refresh. **Acceptance:** the P90/P50 ratio derives from a stated σ and matches the lognormal formula; changing uncertainty inputs moves P90; warranty-adequacy flags trigger on a genuine coverage gap.

### 9.2 Evolution B — Independent-engineer bankability copilot (LLM tier 1)

**What.** A copilot for the lender/IE/underwriter users: "is this module bankable for a 20-year debt tenor?", "what P90 haircut should I apply?", "how does Maxeon's 40-year warranty compare to its degradation curve?" — answered from the real `MODULES` fields, the `computeP90Yield` output, and the IEC/PVEL/DNV framework context, never inventing degradation numbers.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-module-quality-bankability/ask`, corpus = this Atlas record (§7.1 P90 model, the parameter table, framework notes) plus live page state (selected module, computed 25-year curve). Bankability verdicts narrate the deterministic `bankability` tier and its drivers (degradation, warranty, IEC certifications); post-Evolution-A, P90-haircut answers cite the computed uncertainty-derived ratio. The copilot states honestly which IEC standards a product is certified against versus which it merely displays.

**Prerequisites.** Evolution A's fitted P90 lets the copilot answer haircut questions with a defensible number rather than the illustrative random one. **Acceptance:** every degradation/warranty/P90 figure in an answer matches the module data or `computeP90Yield`; a product outside the 20-row set returns a scoped refusal.
