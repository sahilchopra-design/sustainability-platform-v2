## 9 · Future Evolution

### 9.1 Evolution A — Ground the simplified proxies and persist assessments (analytics ladder: rung 2 → 4)

**What.** `calculate_mining_risk` returns seven risk blocks for a mining entity — tailings
(GISTM class → failure probability), water (intensity vs benchmark + WRI Aqueduct),
closure provisioning, social/FPIC, critical-minerals supply (`geo_risk = hhi × 100 #
simplified proxy`), transition-demand stranding, and carbon-cost exposure (Scope 1+2 ×
NGFS carbon price). It is scenario-aware (NGFS scenario + horizon year), but §5 flags
several shortcuts (`geo_risk` HHI proxy, fixed 0.10/0.15/0.20 stranding fractions), and
§4.2 shows `mining_entities`/`mining_risk_assessments` are **db-empty** with `/calculate`
and `/assessments/{id}` tracing **failed** — persistence isn't working end-to-end.

**How.** (1) Fix the persistence path so `POST /calculate` writes to `mining_risk_assessments`
and `/assessments/{id}` returns real rows (the tables exist but are empty). (2) Replace the
`hhi × 100` geopolitical proxy with a calibrated supply-concentration model using the
`critical_minerals_hhi` reference plus country-risk indices; ground the stranding fractions
(0.10/0.15/0.20) in commodity-specific transition-demand elasticities rather than fixed
constants. (3) Wire water stress to the platform's real WRI Aqueduct / physical-risk data
and tailings failure probability to GISTM consequence data. (4) Add horizon projection of
stranded value across NGFS pathways (rung 4) and bench-pin the roll-up.

**Prerequisites.** `mining_entities`/`mining_risk_assessments` write path repaired (D1
activation); country-risk and commodity-elasticity reference data. **Acceptance:**
`/calculate` and `/assessments/{id}` return `passed` with persisted rows; stranding
fractions and geo-risk carry calibration provenance; bench pin reproduces `overall_risk`.

### 9.2 Evolution B — Mine-level ESG risk copilot (LLM tier 2)

**What.** A copilot that runs `/calculate` for a mine and explains the composite —
"tailings risk is elevated because your GISTM class is Extreme with only 60% closure
provisioning; carbon-cost exposure adds 8% revenue-at-risk under disorderly transition" —
each figure tool-sourced, with what-ifs on scenario and provisioning.

**How.** `POST /calculate` plus `/reference-data` (critical-minerals HHI, water benchmarks,
carbon prices by scenario, GISTM classes) as grounding, and `/assessments` for history.
The seven-block decomposition lets the copilot attribute overall risk to specific drivers.
What-ifs ("what if we raise closure provisioning to full coverage?", "re-run under Net
Zero 2050") re-run statelessly. Natural node for a mining/materials desk and for the
tier-3 counterparty-assessment chain.

**Prerequisites.** Evolution A's persistence fix — a copilot narrating `/calculate` while
the endpoint traces `failed` would fabricate. **Acceptance:** every risk-block score and
stranded-value figure traces to a `/calculate` response; scenario what-ifs reflect fresh
calls; the copilot labels the geo-risk and stranding outputs as simplified-proxy until
Evolution A recalibrates, and refuses to assert an actual tailings-failure prediction.
