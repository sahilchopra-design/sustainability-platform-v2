## 9 · Future Evolution

### 9.1 Evolution A — Implement the published scoring and pricing formulas (analytics ladder: rung 1 → 2)

**What.** §7 flags that both advertised formulas are missing: the guide publishes
`Circular_Score = RC_pct/50×30 + TakeBack_pct/60×25 + CE_Revenue_pct/40×25 +
SupplierVisibility×20` and `cSCF_Rate = SOFR + BaseSpread − min(CircularBonus,
40bps)×I(KPI_met)`, but in code the circular score is a raw PRNG draw
(`round(sr(i·9)·40+45)`) *unrelated to the company's own recycled-content and take-back
fields*, instrument pricing is display text, and the value-leakage table is static.
Evolution A implements both formulas exactly as published: the score computed from the
per-company fields the scorecard already carries, and the pricing function turning the
6-instrument catalogue into a working rate calculator (SOFR input, KPI test, capped
circular bonus), plus `Value_Leakage = Σ StageRevenue × LeakagePct` over the leakage
map.

**How.** (1) Pure scoring/pricing functions with the guide's exact weights and caps,
unit-tested; the 22-company scorecard recomputed from its own attribute columns so
sorting by score becomes meaningful. (2) SOFR taken as a user input or platform market-
data value, never hard-coded. (3) The remaining PRNG-drawn company attributes either
re-labelled as illustrative fixtures or replaced with disclosed recycled-content data —
the score must not launder seeded inputs into apparent analytics.

**Prerequisites.** Decision on the company universe (fixtures vs disclosures); the
mismatch flag clears when score, rate, and leakage all compute. **Acceptance:** a
company with RC 50%, take-back 60%, CE-revenue 40%, full visibility scores exactly 100;
a KPI-passing supplier's rate is exactly 40bps under the KPI-failing case at equal base
spread.

### 9.2 Evolution B — cSCF structuring copilot (LLM tier 1 → 2)

**What.** A copilot for treasury and SCF-provider questions: "which instrument fits a
€5M reman working-capital need?" (the 6-instrument catalogue with min-size and
mechanism fields), "what rate would supplier X achieve if it hit its take-back KPI?"
(post-Evolution A, a call to the pricing function), "where does our chain leak value?"
(the leakage map, computed once Evolution A lands). Instrument-selection reasoning
cites catalogue rows; every bps and score figure comes from the new functions.

**How.** Tier 1: atlas record plus the lever/instrument/leakage tables as corpus.
Tier 2: client-side tool schemas over the scoring and pricing functions (the module has
no backend routes); the no-fabrication validator ties all numerics to invocations; ING
framework claims cite the §5 reference, labelled as programme-design context rather
than quotes.

**Prerequisites (hard).** Evolution A first — today a rate question could only be
answered by parroting display text, and a score question by reciting a PRNG draw.
**Acceptance:** a rate answer decomposes into SOFR + base − bonus with each term from a
tool return; asked for a live SOFR fixing the copilot uses the provided input or
refuses.
