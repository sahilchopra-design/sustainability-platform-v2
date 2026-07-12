## 9 · Future Evolution

### 9.1 Evolution A — Scenario-conditioned λ and a decay-consistent stranding probability (analytics ladder: rung 1 → 2)

**What.** The core decay model is genuinely implemented (`BV(t) = BV₀·exp(−λt)` with
cohort-level λ, one of the batch's most faithful guide↔code matches), but §7.3/§7.5
document three gaps: the Scenario selector (Current Policies → Net Zero 2050) is
purely cosmetic — switching it changes no computed value; `strandingProb` is an ad-hoc
linear-in-age heuristic disconnected from the λ/BV trajectory; and
`yearsToRegClosure`/`complianceCost` are uncited constants. Evolution A implements the
§8 spec: `λ_scenario = λ_base × ScenarioMultiplier` (1.0/1.3/1.6/2.2 keyed to NGFS
carbon-price stringency) so the dropdown finally drives the curves; stranding
probability becomes a closure-date distribution
(`StrandProb(t) = 1 − CDF_lognormal(ClosureDate_implied − t)`) fit to Carbon Tracker's
public plant-retirement-age data, making it a function of the same model instead of a
parallel heuristic; and `complianceCost` derives from named phase-out schedules (EU
Taxonomy DNSH dates, EPA compliance capex) instead of the flat `0.15 × BV × age/20`.

**How.** Keep it frontend-first (Tier B, EP-CK1) for the multiplier wiring — it is a
pure formula change — but move the calibrated closure-date distribution into a small
`GET /api/v1/vintage-stranded/params` reference route so μ/σ per sector carry
provenance. Validate `ClosureDate_implied` against the US EIA plant-retirement
database per §8.5.

**Prerequisites.** The non-functional selector acknowledged as a defect; retirement-age
fit data sourced (EIA public). **Acceptance:** switching to Net Zero 2050 visibly
steepens every decay curve (λ×2.2); a pre-2000 coal asset's strandingProb now moves
when scenario changes; the §7.4 worked example re-pins under Current Policies.

### 9.2 Evolution B — Provisioning copilot for lenders (LLM tier 1 → 2)

**What.** The module's audience (infrastructure lenders provisioning against
stranding) needs cohort narratives: "explain why our 2000–2010 cement cohort loses
60% of book value by 2035 under Delayed Transition, and what that implies for
loan-loss provisioning." Evolution B starts tier-1: a copilot grounded in this Atlas
page and the on-page cohort state that explains the decay math (λ per cohort, the
scenario multiplier once Evolution A lands) and drafts the provisioning-memo paragraph
with every figure read from the rendered `cohortStats`. Tier-2 adds the
`GET /params` reference route and a `POST /project` endpoint (server-side
`buildDecayCurve`) as tools, so what-ifs — "re-run the pre-2000 cohort at λ=0.10" —
are computed, not narrated.

**How.** Standard copilot stack (`llm_corpus_chunks` embedding of this page;
`POST /api/v1/copilot/vintage-cohort-stranded/ask`); the system prompt encodes §7.5's
provenance caveats (synthetic 20-asset register; λ author-calibrated, IEA-cited but
not traceable to a published table) so memos state assumptions honestly.

**Prerequisites.** Evolution A's scenario wiring first — a copilot explaining a
dropdown that does nothing would either lie or embarrass; pgvector corpus.
**Acceptance:** every BV, λ, and probability in an answer matches page state or a tool
response; asked which real plants are in the cohort, the copilot discloses the
register is synthetic; scenario-conditioned answers change when the scenario input
changes.
