## 9 · Future Evolution

### 9.1 Evolution A — Amortising debt, VGF sizing and cashflow realism (analytics ladder: rung 2 → 3)

**What.** A genuinely-grounded India module — real NaBFID/InvIT/DFI/BRSR tables, live REC/PAC price injection, no PRNG in the finance path — whose §7.5 limitations are precise: debt service is interest-only (`capex × gearing × 8.5%`), making DSCR optimistic versus an amortising loan; cashflow is flat (no ramp, degradation or tariff escalation); the guide's VGF formula (`VGF = max viable cost − bankable cost at 12% IRR`) is discussed but never computed; and 8.5% is a fixed rate, not a curve. Evolution A closes all four: level-annuity amortisation (`capex·gearing·i/(1−(1+i)^−tenor)`), a year-by-year cashflow with S-curve ramp and sector-specific escalation, VGF solved by bisection on the 12% equity-IRR threshold, and the debt rate read from the module's own `YIELD_CURVE` table (green-infra yield + tenor) instead of a constant.

**How.** (1) A small backend route `POST /india-infra/project-model` (this is currently frontend-only math) returning the DSCR profile, NPV, equity IRR, and computed VGF quantum with the binding constraint named. (2) The worked example's teaching point — DSCR 1.34× but NPV −₹214 Bn — becomes a bench_quant pin, and the VGF solver must reproduce "the grant that lifts this project to 12% IRR". (3) Each `INFRA_TYPES` row's published min-DSCR (1.20–1.40×) and equity-IRR benchmarks become pass/fail covenant checks in the response. (4) Carbon-revenue stacking uses the live REC/PAC/CCC prices already injected rather than a static uplift.

**Prerequisites.** None blocking — data and formulas are specified in this page's §5/§7.5; the work is implementation. **Acceptance:** interest-only vs amortising DSCR difference is visible and documented; the VGF output equals the bisection solution within tolerance; NPV with escalation ≠ flat-cashflow NPV for a stated reason.

### 9.2 Evolution B — DFI underwriting copilot for India green infra (LLM tier 2)

**What.** The module's buyers (DFIs, infra PE, green bond issuers) ask structuring questions this page's data can answer: "which blended-finance provider fits a water project needing first-loss cover?" (the 7-row `BLENDED_FINANCE` table maps provider → structure → suitability), "is a 1.28× DSCR bankable for green roads?" (covenant row per infra type), "what greenium does the India curve show at 10 years?" (`YIELD_CURVE`), "size the VGF for this metro project." Tier 2 executes the model what-ifs; the curated tables ground the qualitative matching.

**How.** Tool schema over the Evolution A `/project-model` route; VGF and breakeven questions run as solver tool calls with the iteration trail logged. The system prompt embeds the `INFRA_TYPES`, `BLENDED_FINANCE` and `NABFID_OVERVIEW` tables plus §7.4's worked example as calibration for tone — the copilot should surface the DSCR-positive/NPV-negative tension, since that gap is the module's core thesis about why blended finance exists. BRSR answers cite the SEBI-mandatory flags from `BRSR_METRICS`; CBAM tariff-uplift answers use the live `CBAM_EXPOSURE_MAP` entries.

**Prerequisites.** Evolution A's backend route; Phase 2 infrastructure. **Acceptance:** every ₹/％/× figure traces to a tool call or a named table row; provider recommendations quote the `rrCond`/`suitability` fields rather than inventing DFI terms.
