# ISSB S2 / TCFD Disclosure
**Module ID:** `issb-tcfd` · **Route:** `/issb-tcfd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ISSB IFRS S2 Climate-related Disclosures and TCFD Recommendations compliance tracker. Maps 11 TCFD requirements and 30+ ISSB S2 paragraphs with auto-populated disclosure drafts.

> **Business value:** ISSB S2 is mandatory for IFRS-reporting companies across 20+ jurisdictions from 2024. TCFD compliance is required by UK, EU, Singapore, HK, Australia, and others. This module eliminates duplication and ensures coherent cross-framework disclosure with full audit trail.

**How an analyst works this module:**
- TCFD Accordion shows 4 pillars with 11 requirements and draft text
- ISSB S2 Tracker shows para-by-para completion status
- Cross-walk Matrix maps TCFD to ISSB S2 equivalents
- Scenario Narratives generates CP/B2C/NZ scenario risk descriptions
- Export generates board-ready disclosure package

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Alert`, `Btn`, `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `Card`, `CompanyAutocomplete`, `Grid`, `HORIZONS`, `Inp`, `KpiCard`, `MultiCheck`, `PHYSICAL_ACUTE`, `PHYSICAL_CHRONIC`, `PILLAR_META`, `PillarCard`, `RISK_KEY_MAP`, `RiskRow`, `SCENARIOS`, `SCENARIO_KEY_MAP`, `SECTOR_KEY_MAP`, `SECTOR_OPTIONS`, `ScoreBadge`, `SectionHeading`, `Sel`, `Spinner`, `TABS`, `TRANSITION_MARKET`, `TRANSITION_POLICY`, `TRANSITION_REPUTE`, `TRANSITION_TECH`, `Toggle`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PILLAR_META` | 5 | `label`, `color`, `icon` |
| `SCENARIOS` | 4 | `label` |
| `COMPANY_SUGGESTIONS` | 16 | `cin`, `sector` |
| `TABS` | 6 | `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8000';` |
| `slugify` | `(s) => (String(s \|\| '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+\|_+$/g, '')) \|\| 'entity';` |
| `initRisks` | `(list) => list.reduce((a,r) => ({...a, [r]:{ likelihood:'3', impact:'3', horizon:'Medium', exposure:'' }}), {});` |
| `total` | `s1+s2+s3; if (!total) return;` |
| `span` | `tgtYear - baseYear \|\| 1;` |
| `risks` | `scoredRisks.filter(r => Math.round(r.likelihood_score)===l && Math.round(r.impact_score)===imp);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COMPANY_SUGGESTIONS`, `HORIZONS`, `PHYSICAL_ACUTE`, `PHYSICAL_CHRONIC`, `PILLAR_META`, `SCENARIOS`, `SECTOR_OPTIONS`, `TABS`, `TRANSITION_MARKET`, `TRANSITION_POLICY`, `TRANSITION_REPUTE`, `TRANSITION_TECH`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| TCFD Pillars | — | TCFD | Governance, Strategy, Risk Management, Metrics & Targets |
| TCFD Requirements | — | TCFD | Specific recommended disclosures across 4 pillars |
| ISSB S2 Paragraphs | — | ISSB | Para 5-41 covering all climate disclosure requirements |
| Cross-walk Coverage | — | Analysis | ISSB S2 covers 85% of TCFD requirements with enhanced requirements |
- **Governance meeting minutes** → G1/G2 disclosure → **TCFD/ISSB Governance pillar**
- **Climate scenario analysis** → Strategy resilience disclosure → **S3 / Para 14-15**
- **GHG inventory data** → Metrics disclosure → **M1-M3 / Para 29-31**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-framework disclosure mapping
**Headline formula:** `Completeness = Disclosed_requirements / Total_required_per_framework`

ISSB S2 supersedes TCFD for IFRS reporters. Key overlap: Strategy (S1-S3 / Para 10-16), Risk Management (R1-R3 / Para 25-27), Metrics (M1-M3 / Para 29-36). Residual disclosures unique to each framework identified.

**Standards:** ['ISSB IFRS S2 (2023)', 'TCFD Final Report (2017)', 'TCFD Status Report (2021)']
**Reference documents:** ISSB IFRS S2 Climate-related Disclosures (2023); TCFD Final Recommendations (2017); TCFD Implementation Guide; IOSCO Endorsement of ISSB Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fix the frontend↔backend contract so the honest engine actually runs (analytics ladder: rung 1 → 2)

**What.** This module's defect is unusual and precisely documented in §7.7: the backend engine (`issb_s2_engine.py`) is genuinely well-designed — evidence-based pillar completeness over a 55-item IFRS S2 catalogue, honest zeros when no evidence is supplied, scenario impacts returning `None` without `entity_financials` — but the shipped page **cannot exercise it**: `/assess` 422s on missing `entity_id`, the route models lack the `*_disclosures` fields so the UI's carefully-collected checklist state never reaches `engine.assess()`, `/scenario-analysis` never forwards financials (all impacts render "--"), and the risks tab reads six response keys the engine never returns. Evolution A is the contract repair: align the three Pydantic request models in `api/v1/routes/issb_s2.py` with the frontend payloads, thread the qualitative checklist and `entity_financials` through, and reconcile the risks-tab response reading with the engine's actual return dict.

**How.** (1) Fix in the route layer (add `governance_disclosures` etc. to the request models; map `company_name`→`entity_name`) rather than the engine — the engine's honest-null design is correct and must not be weakened to make the page "work". (2) Regression: the lineage harness's POST traces for `/issb-s2/*` must move from failing to passing with populated payloads. (3) The one working calculation — the client-side GHG pathway (§7.4) — moves server-side or gains source citations for its ×0.85/×1.05 scope multipliers, which §7.4 notes are uncited. (4) Log this as a fixed wiring bug in the platform's defect backlog (it is the "build-green ≠ correct" class the nav-shell project documented).

**Prerequisites.** None — this is a contract fix over existing, tested logic. **Acceptance:** a filled assessment produces non-zero pillar scores reflecting the entered evidence; scenario impacts populate when financials are entered; the risks tab renders engine-returned fields only; 422s eliminated in the sweep.

### 9.2 Evolution B — Cross-framework disclosure copilot over the repaired engine (LLM tier 2)

**What.** Once wired, this module has the strongest engine surface in the ISSB family for a copilot: "assess our S2 readiness from this evidence list", "which TCFD recommendations does our ISSB disclosure already satisfy?" (the cross-walk is the module's core asset), "run all three scenarios and explain why stranded-asset exposure is worst under current-policies", "draft the S3 scenario-resilience narrative from the computed impacts."

**How.** Tier 2: tool schemas over the repaired `/assess`, `/scenario-analysis`, `/risk-identification` routes; the engine's honest-null convention becomes the copilot's script — a `None` impact yields "not computable without entity financials: supply revenue, carbon intensity and asset values", never an estimated number, which is the platform's no-fabrication contract expressed in prose. Scenario narratives cite the engine's mechanics (carbon-cost pass-through, the 3.2°C physical-loss scaling ceiling) with §7.2's caveat that specific multipliers are author-calibrated rather than NGFS-published. Risk-taxonomy answers use the sector-membership logic (which risks are material-by-construction for the entity's sector) with that construction explained. Drafted disclosure text is versioned and review-gated as in the sibling issb-disclosure module.

**Prerequisites (hard).** Evolution A — tool-calling the current broken routes would return 422s and honest nulls the copilot could be tempted to paper over; the wiring must work first. Phase 2 infrastructure. **Acceptance:** every score/impact in an answer matches an engine response; null impacts always produce the missing-inputs explanation; cross-walk claims match the module's mapping table.