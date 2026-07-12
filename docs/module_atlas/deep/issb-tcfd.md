## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (frontend↔backend contract break, not a guide error).** The guide's
> stated formula — `Completeness = Disclosed_requirements / Total_required_per_framework` — is
> **exactly what the real backend engine implements** (`backend/services/issb_s2_engine.py`). But the
> frontend page (`IssbTcfdPage.jsx`) and the API routes it calls (`backend/api/v1/routes/issb_s2.py`)
> are wired together incorrectly: the request bodies the frontend sends don't match the Pydantic
> request models the backend expects, several fields the UI collects are never exposed by the API
> route at all, and the frontend reads response keys the engine never returns. In practice this means
> the assessment/scenario/risk POST calls on this page cannot produce the real evidence-based scores
> the backend engine is capable of computing. See §7.7 for line-level detail.

### 7.1 What the module computes

The page has 5 tabs (`assess`, `scenario`, `risks`, `metrics`, `reference`) built around a real
FastAPI engine implementing IFRS S2's four-pillar structure. The **backend engine itself** is
genuinely well-designed and honest-by-construction:

```python
pillar_score = matched_disclosure_items / total_disclosure_items_in_pillar × 100   # 0 if no evidence
overall = 0.20·governance + 0.30·strategy + 0.25·risk_management + 0.25·metrics_targets
```

Governance/Strategy/Risk-Management scores are `0.0` whenever no `*_disclosures` evidence list is
supplied — the engine's own docstring states this is deliberate: *"never a fabricated value."*
Metrics & Targets blends 60% qualitative-disclosure completeness with 40% quantitative-metric
presence (Scope 1/2/3 > 0, financed emissions present, carbon price present, capex % > 0).

Scenario analysis (`run_scenario_analysis`) computes, per NGFS-style scenario, revenue impact from
carbon-cost pass-through, additional transition CapEx, stranded-asset exposure %, and physical loss
— **all as `None` unless the caller supplies `entity_financials`** (revenue, carbon intensity, capex
plan, total assets, stranded book value, physical value at stake). Risk identification
(`identify_risks`) surfaces physical/transition risks that are material-by-construction for the
entity's sector (sector membership in each risk's `sectors_most_exposed` list), with
likelihood/impact scores again `None` unless explicitly supplied.

The Metrics tab's **GHG reduction pathway is computed entirely client-side** (no API call) — see
§7.4.

### 7.2 Parameterisation

| Construct | Values | Provenance |
|---|---|---|
| Pillar weights | Governance 0.20, Strategy 0.30, Risk Mgmt 0.25, Metrics & Targets 0.25 | Author-calibrated to IFRS S2 paragraph volume per pillar (17 items in Strategy vs 10 in Governance) |
| Disclosure item catalogue | 10 (Gov) + 17 (Strategy) + 10 (Risk Mgmt) + 18 (Metrics) = 55 items | Enumerated from IFRS S2 §6–50 |
| Metrics blend | `0.6×qual + 0.4×quant` | Author judgement — no cited external calibration |
| Scenario set | 3 pathways: 1.5°C, 2°C, current policies (`CLIMATE_SCENARIOS`) | Consistent with NGFS-style scenario families, exact carbon-price/temperature pairs not shown in the excerpt read |
| Physical loss scaling | `phys_at_stake × (temp_scenario / 3.2°C)` | Linear scaling against a 3.2°C "hot-house" reference — author-chosen ceiling, not a published damage function |
| SBTi pathway (client-side, Metrics tab) | 42% reduction by 2030 note | SBTi 1.5°C near-term criterion (cross-industry) |

### 7.3 Calculation walkthrough

1. **Assess tab** — user fills 4 accordion pillar forms (booleans/selects/text), clicks "Run ISSB S2
   Assessment" → `axios.post('/api/v1/issb-s2/assess', { company_name, cin, sector, governance: gov,
   strategy: strat, risk_management: rm, metrics_targets: mt })`.
2. **Scenario tab** — user picks a scenario + horizons + sector → posts
   `{ scenario, horizons, sector }` directly as `scenarioIn`.
3. **Risks tab** — user scores 6 physical + 11 transition risk rows (likelihood/impact 1–5, exposure
   ₹ Cr) → posts `{ company_name, sector, physical_risks: physicalRisks, transition_risks:
   transitionRisks }`.
4. **Metrics tab** — Scope 1/2/3 + target inputs feed a pure client-side pathway projection
   (`computePathway`, §7.4); a separate "implied carbon cost" figure is also computed client-side:
   `carbonPrice × (scope1+scope2) / 1e7` (₹/tCO₂e → ₹ Cr, dividing by 10 million).

### 7.4 Worked example — client-side GHG pathway (the one calculation that actually runs)

Inputs: Scope 1 = 40,000 tCO₂e, Scope 2 = 25,000, Scope 3 = 180,000 (total 245,000), target = 42% by
2030, base year 2024.

```js
span = 2030 - 2024 = 6
// year 2027 (elapsed = 3, ≤ span):
factor = 1 - 0.42 × (3/6) = 0.79
total_2027  = 245,000 × 0.79 = 193,550
scope1_2027 = 40,000 × 0.79  = 31,600
scope2_2027 = 25,000 × 0.79 × 0.85 = 17,038   // faster decline (grid decarbonisation assumption)
scope3_2027 = 180,000 × 0.79 × 1.05 = 149,310 // slower decline (value-chain lag assumption)

// year 2035 (elapsed = 11, > span):
factor = max(0.05, 1 - 0.42 - 0.03×(11-6)) = max(0.05, 0.43) = 0.43
total_2035 = 245,000 × 0.43 = 105,350
```
This is a straight-line pathway to the target year, then a 3%-per-year post-target decline floored
at 5% of baseline — a defensible SBTi-style simplification, entirely deterministic and free of any
`sr()`/random component. Scope 2's extra ×0.85 and Scope 3's extra ×1.05 multipliers are the
module's only sector-differentiated assumption and are **not derived from any cited source**.

### 7.5 Physical / transition risk taxonomy (backend, when reachable)

Physical risks are grouped Acute (Flooding, Cyclone, Wildfire, Heatwave) / Chronic (Sea Level Rise,
Drought, Temperature Shift, Precipitation Change); transition risks are grouped Policy & Legal
(Carbon Tax, Emissions Regulation, Mandatory Disclosure, Land Use Restrictions) / Technology (Clean
Tech Disruption, Asset Obsolescence, R&D Reallocation) / Market (Demand Shifts, Commodity Price
Volatility, Stranded Assets) / Reputation (Stigmatisation, Stakeholder Pressure, Greenwashing
Litigation) — a reasonable rendering of TCFD's own risk taxonomy, surfaced by sector-membership
lookup rather than any quantitative model.

### 7.6 TCFD/ISSB pillar structure

| Pillar | ISSB weight | TCFD equivalent |
|---|---|---|
| Governance | 0.20 | Board oversight (G1), Management role (G2) |
| Strategy | 0.30 | Risks/opportunities (S1), Business-model impact (S2), Scenario resilience (S3) |
| Risk Management | 0.25 | Identification (R1), Management (R2), ERM integration (R3) |
| Metrics & Targets | 0.25 | GHG metrics (M1-M2), Targets & progress (M3) |

### 7.7 Data provenance & limitations — the frontend/backend wiring is broken

This is the module's most material finding, verified line-by-line:

- **`/assess`**: `ISSBS2AssessRequest` requires `entity_id: str` and `entity_name: str` with **no
  defaults**; the frontend sends `company_name`/`cin`/`sector` instead — FastAPI/Pydantic will reject
  the request with HTTP 422 before the engine ever runs. Even if the field names were fixed, the
  Pydantic model has **no `governance_disclosures` / `strategy_disclosures` / `risk_mgmt_disclosures`
  / `metrics_targets_disclosures` fields at all** — the route never forwards the qualitative
  checklist data the UI so carefully collects (`gov`, `strat`, `rm`, `mt` state) to
  `engine.assess()`. Governance/Strategy/Risk-Management scores would therefore always evaluate to
  `0.0` by the engine's own "honest zero" design, regardless of what the user enters.
- **`/scenario-analysis`**: `ScenarioAnalysisRequest` requires `entity_id` (missing from the
  frontend payload) and expects `scenarios: list[str]`; the frontend sends a single `scenario`
  string. The route also has **no `entity_financials` field**, so `engine.run_scenario_analysis()`
  always receives `fin={}` — every `entity_impacts` value (`revenue_impact_2030_pct`,
  `stranded_asset_exposure_pct`, `physical_loss_2030_usd_mn`, etc.) returns `None` by the engine's
  own honest-null design. The frontend's KPI cards, physical-risk heatmap, and financial-impact-range
  table therefore render "--"/empty in practice.
- **`/risk-identification`**: `RiskIdentificationRequest` requires `entity_id`; the frontend sends
  `company_name`. The route has **no `physical_risks`/`transition_risks` passthrough**, so the
  likelihood/impact scores the user enters in the 17 `RiskRow` inputs never reach `risk_scores` —
  every risk's `likelihood_score`/`impact_score` returns `None`. The frontend additionally reads
  `riskResult.overall_score`, `.physical_score`, `.transition_score`, `.total_exposure`,
  `.risk_matrix`, and `.recommendations` — **none of these keys exist in the engine's actual return
  dict** (`entity_id, sector, identification_date, ifrs_s2_reference, physical_risks,
  transition_risks, opportunities`).
- **Net effect**: despite a genuinely well-engineered, evidence-based, honest-null backend engine,
  the shipped page cannot exercise it correctly. This is a wiring/contract bug, not a scientific
  methodology flaw — the fix is aligning the three Pydantic request models with the frontend payload
  shapes and threading the UI's qualitative checklist state through to `engine.assess()`.
- The GHG pathway on the Metrics tab (§7.4) is the one calculation on this page that is fully
  functional, deterministic, and free of both the wiring bug and any random-seed fabrication.

**Framework alignment:** IFRS S2 (June 2023) four-pillar structure and paragraph references are
faithfully modelled in `IFRS_S2_PILLARS`. TCFD 2017 recommendations are correctly enumerated and
cross-walked. The scenario engine's design (carbon-price pass-through × transition intensity,
physical loss scaled to a temperature ceiling) is directionally consistent with NGFS scenario
mechanics but the specific multipliers are not sourced to a named NGFS phase. SBTi 42%-by-2030
near-term criterion is correctly cited in the UI's info banner.
