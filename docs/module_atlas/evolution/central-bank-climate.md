## 9 · Future Evolution

### 9.1 Evolution A — Implement the transmission calculation over NGFS scenario data (analytics ladder: rung 1 → 2)

**What.** §7 classifies this as a supervision reference dashboard: the guide's
transmission engine (`FinStability = Σ Sector_i × Shock_i × Exposure_i`) is **not
implemented** — sector-impact figures are hard-coded expert values, and the module's
real strengths are its curated 41-central-bank dataset (NGFS status, stress-test
history, green-QE volumes) and the genuine `SOVEREIGN_MACRO_2024` join. Evolution A
implements the advertised sum as a live computation: sector shocks taken from the
platform's ingested NGFS scenario vintages (carbon price, energy demand, GDP paths
already used by other engines), exposures from a user-supplied or demo bank-sector
exposure matrix, producing a scenario-conditional stability impact instead of static
`SECTOR_IMPACT` numbers.

**How.** (1) `finStabilityImpact(exposures, scenario, horizon)` as a deterministic
function: NGFS shock per sector × exposure weight, aggregated to a system-level index,
with the shock vintage cited. (2) The Scenario Analysis tab's 2030/2050 toggles switch
actual NGFS scenario columns (Net Zero 2050, Delayed Transition, Current Policies)
rather than relabelled constants. (3) The hard-coded `SECTOR_IMPACT` retained but
relabelled "illustrative expert values" wherever the computed path lacks coverage —
honest-nulls convention.

**Prerequisites.** NGFS scenario data access from the frontend or a thin backend
endpoint (module currently has no API surface); exposure matrix schema defined with a
seeded demo bank. **Acceptance:** switching NGFS scenario changes the stability index
with the scenario/vintage displayed; a one-sector fixture reproduces shock × exposure
by hand.

### 9.2 Evolution B — Supervisory-landscape copilot (LLM tier 1)

**What.** A copilot over the module's genuinely valuable asset — the 41-bank
comparative dataset: "which central banks have run bottom-up climate stress tests?",
"compare ECB and BoE collateral-framework treatment of climate risk", "what does BCBS
530 require that our framework table shows Bank X lacking?". These are filter-and-
compare questions over real curated data plus the §5 standards corpus (NGFS, BCBS 530,
FSB) — exactly the tier-1 explainer shape, with no computation to fabricate.

**How.** Atlas record plus the central-bank reference table embedded in
`llm_corpus_chunks`; comparison answers cite table rows and the macro-join fields
(gdp, debtGdp) where relevant; the policyScore radar is explained as a mean of
curated dimension values, not a model output. Refusal path covers per-bank capital
impacts and any forward rate/policy prediction.

**Prerequisites.** Curation vintage stamped on the 41-bank table (supervisory
landscapes move quarterly; the corpus must say "as of" or the copilot will assert
stale facts). **Acceptance:** every claim about a named central bank traces to its
table row; asked to predict the ECB's next stress-test design, the copilot refuses and
cites the latest curated entry instead.
