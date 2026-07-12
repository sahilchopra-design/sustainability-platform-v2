# Supply Chain ESG Hub
**Module ID:** `supply-chain-esg-hub` · **Route:** `/supply-chain-esg-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive supply chain ESG analytics dashboard aggregating supplier ESG scores, due diligence findings, risk flags and regulatory compliance status across multi-tier supply chains.

> **Business value:** Multi-tier supply chain ESG risk is the fastest-growing compliance burden; CSDDD will require large EU companies to conduct full value chain due diligence from 2027.

**How an analyst works this module:**
- Ingest supplier master data and spend information
- Score suppliers on E, S and G dimensions using assessments and third-party data
- Apply risk flags for violations, sanctions and controversies
- Aggregate to portfolio-level ESG metrics by tier and category
- Report compliance with LkSG, CSDDD and CSRD supply chain requirements

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERT_TYPES`, `AUDIENCES`, `BOARD_SECTIONS`, `CATEGORIES`, `CERT_TYPES`, `COMMODITIES`, `COMMODITY_TRACE`, `COUNTRIES`, `DISRUPTION_SCENARIOS`, `ENGAGEMENTS`, `ENGAGEMENT_DIMS`, `ENGAGEMENT_STAGES`, `ENG_TREND`, `INIT_ALERTS`, `MINERALS`, `MINERAL_CHAIN`, `PERIODS`, `PIE_COLORS`, `RADAR_DATA`, `REGIONS`, `REGULATIONS`, `REPORT_CONTENT`, `SCOPE3_BREAKDOWN`, `SCOPE3_CATS`, `SEVERITY`, `SUB_MODULES`, `SUPPLIERS`, `SUPPLIER_NAMES`, `TABS`, `TIERS`, `TIER_VISIBILITY`, `TOP_IMPROVEMENTS`, `TOP_RISKS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SUB_MODULES` | 6 | `key`, `title`, `path`, `desc`, `stat` |
| `RADAR_DATA` | 9 | `dim`, `score`, `benchmark` |
| `TOP_RISKS` | 6 | `item`, `score`, `module` |
| `TOP_IMPROVEMENTS` | 6 | `item`, `score`, `module` |
| `DISRUPTION_SCENARIOS` | 7 | `scenario`, `probability`, `impact`, `affectedSuppliers`, `mitigationStatus`, `regions` |
| `TIER_VISIBILITY` | 4 | `tier`, `total`, `dataComplete`, `avgDqs` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `country` | `COUNTRIES[Math.floor(sr(i*7)*COUNTRIES.length)];` |
| `tier` | `TIERS[Math.floor(sr(i*11)*TIERS.length)];` |
| `cat` | `CATEGORIES[Math.floor(sr(i*13)*CATEGORIES.length)];` |
| `esgScore` | `Math.floor(sr(i*17)*40+40);` |
| `scope3` | `+(sr(i*19)*500+10).toFixed(1);` |
| `dqs` | `Math.floor(sr(i*23)*60+30);` |
| `deforestRisk` | `+(sr(i*29)*100).toFixed(1);` |
| `mineralExp` | `+(sr(i*31)*100).toFixed(1);` |
| `resilience` | `Math.floor(sr(i*37)*50+40);` |
| `certs` | `CERT_TYPES.filter((_,ci)=>sr(i*41+ci*7)>0.6);` |
| `corrective` | `Math.floor(sr(i*47)*5);` |
| `spend` | `+(sr(i*53)*5+0.1).toFixed(2);` |
| `commodities` | `COMMODITIES.filter((_,ci)=>sr(i*59+ci*11)>0.75);` |
| `minerals` | `MINERALS.filter((_,mi)=>sr(i*61+mi*13)>0.7);` |
| `scope3Cat` | `SCOPE3_CATS[Math.floor(sr(i*67)*SCOPE3_CATS.length)];` |
| `emissionIntensity` | `+(sr(i*71)*300+50).toFixed(1);` |
| `reductionTarget` | `engaged?Math.floor(sr(i*73)*30+10):0;` |
| `reductionAchieved` | `engaged?Math.floor(reductionTarget*sr(i*79)):0;` |
| `disruptionProb` | `+(sr(i*97)*60+5).toFixed(1);` |
| `altSuppliers` | `Math.floor(sr(i*101)*4);` |
| `leadTimeDays` | `Math.floor(sr(i*103)*90+14);` |
| `totalScope3` | `SUPPLIERS.reduce((a,s)=>a+s.scope3MtCO2e,0);` |
| `avgDqs` | `+(SUPPLIERS.reduce((a,s)=>a+s.dqs,0)/200).toFixed(1);` |
| `eudrPct` | `+((SUPPLIERS.filter(s=>s.eudrCompliant).length/200)*100).toFixed(1);` |
| `avgMineral` | `+(SUPPLIERS.reduce((a,s)=>a+s.mineralExposure,0)/200).toFixed(1);` |
| `avgResilience` | `+(SUPPLIERS.reduce((a,s)=>a+s.resilienceScore,0)/200).toFixed(1);` |
| `openCorr` | `SUPPLIERS.reduce((a,s)=>a+s.correctiveActions,0);` |
| `certCov` | `+((SUPPLIERS.filter(s=>s.certCount>0).length/200)*100).toFixed(1);` |
| `costAtRisk` | `+(SUPPLIERS.filter(s=>s.highRisk).reduce((a,s)=>a+s.annualSpendM,0)).toFixed(1);` |
| `defoHa` | `+(SUPPLIERS.reduce((a,s)=>a+s.deforestationRisk*12,0)).toFixed(0);` |
| `concIdx` | `+(sr(pi*111)*0.3+0.45).toFixed(2);` |
| `sup` | `SUPPLIERS[Math.floor(sr(i*123)*200)];` |
| `typ` | `ALERT_TYPES[Math.floor(sr(i*456)*ALERT_TYPES.length)];` |
| `sev` | `SEVERITY[Math.floor(sr(i*789)*4)];` |
| `dim` | `ENGAGEMENT_DIMS[Math.floor(sr(i*301)*ENGAGEMENT_DIMS.length)];` |
| `stage` | `ENGAGEMENT_STAGES[Math.floor(sr(i*401)*ENGAGEMENT_STAGES.length)];` |
| `priority` | `Math.floor(sr(i*501)*100);` |
| `actions` | `Math.floor(sr(i*901)*8)+1;` |
| `actionsComplete` | `Math.floor(sr(i*1001)*actions);` |
| `COMMODITY_TRACE` | `COMMODITIES.map((com,ci)=>{` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/supply-chain/scope3/calculate` | `calculate_scope3` | api/v1/routes/supply_chain.py |
| POST | `/api/v1/supply-chain/scope3/sbti-target` | `calculate_sbti_target` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/emission-factors` | `list_emission_factors` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments` | `list_scope3_assessments` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/assessments/{assessment_id}` | `get_scope3_assessment` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets` | `list_sbti_targets` | api/v1/routes/supply_chain.py |
| GET | `/api/v1/supply-chain/scope3/sbti-targets/{target_id}` | `get_sbti_target` | api/v1/routes/supply_chain.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`, `real-db`

**Database tables:** `base` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `emission_factor_library` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sbti_targets` *(shared)*, `sbti_trajectories` *(shared)*, `scope3_activities` *(shared)*, `scope3_assessments` *(shared)*, `sqlalchemy` *(shared)*, `this` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ALERT_TYPES`, `AUDIENCES`, `BOARD_SECTIONS`, `CATEGORIES`, `CERT_TYPES`, `COMMODITIES`, `COUNTRIES`, `DISRUPTION_SCENARIOS`, `ENGAGEMENT_DIMS`, `ENGAGEMENT_STAGES`, `MINERALS`, `PERIODS`, `PIE_COLORS`, `RADAR_DATA`, `REGIONS`, `REGULATIONS`, `SCOPE3_CATS`, `SEVERITY`, `SUB_MODULES`, `SUPPLIER_NAMES`, `TABS`, `TIERS`, `TIER_VISIBILITY`, `TOP_IMPROVEMENTS`, `TOP_RISKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Suppliers Assessed | — | ESG Database | Total number of suppliers with ESG scores in the hub across all tiers. |
| High-Risk Flags | — | Due Diligence Engine | Suppliers flagged as high-risk based on ESG scores below threshold or specific violation alerts. |
| Tier 1 Coverage | — | Spend Analysis | Proportion of Tier 1 supplier spend with ESG assessments; regulatory baseline requirement. |
- **Supplier Assessments, Spend Data, Third-Party ESG Feeds, Controversy Alerts** → Multi-tier scoring + risk flag engine + regulatory compliance mapping → **ESG hub dashboard, high-risk supplier register, CSRD/LkSG disclosures**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/supply-chain/emission-factors** — status `passed`, provenance ['real-db'], source tables: `emission_factor_library`
Output: `{'type': 'object', 'keys': ['total_count', 'filters_applied', 'factors', 'validation_summary'], 'n_keys': 4}`

**GET /api/v1/supply-chain/scope3/assessments** — status `passed`, provenance ['real-db'], source tables: `scope3_assessments`
Output: `{'type': 'object', 'keys': ['assessments', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `scope3_assessments`
Output: `None`

**GET /api/v1/supply-chain/scope3/sbti-targets** — status `passed`, provenance ['real-db'], source tables: `sbti_targets`
Output: `{'type': 'object', 'keys': ['targets', 'total_count'], 'n_keys': 2}`

**GET /api/v1/supply-chain/scope3/sbti-targets/{target_id}** — status `failed`, provenance ['db-empty'], source tables: `sbti_targets`
Output: `None`

**POST /api/v1/supply-chain/scope3/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/supply-chain/scope3/sbti-target** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Supply Chain ESG Score
**Headline formula:** `SCES = Σ (Supplier ESG × Spend Weight × Tier Discount)`

Spend-weighted, tier-discounted aggregate ESG score reflecting multi-tier supply chain exposure.

**Standards:** ['GRI 308/414', 'LkSG §4 Due Diligence']
**Reference documents:** GRI 308: Supplier Environmental Assessment; GRI 414: Supplier Social Assessment; German LkSG 2023; EU CSDDD 2024; CSRD ESRS G1-4

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-map` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-contagion` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-emissions-mapper` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-network-viz` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-carbon` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a composite **"SCES" formula**
> (`SCES = Σ (Supplier ESG × Spend Weight × Tier Discount)`) as the module's calculation engine.
> **No such spend-weighted, tier-discounted composite is computed anywhere in the code.** The page
> instead (a) generates 200 independent synthetic suppliers with unrelated per-field random scores,
> (b) aggregates simple unweighted arithmetic means per KPI/tier/region, and (c) flags "high-risk"
> suppliers via an OR-combination of four hard thresholds — not a weighted product. The
> "ESG Risk Weight 30% / Deforestation 25% / Conflict Minerals 20% / Regulatory 20%" panel shown in
> the Board Report tab is **static display text**, not wired into any calculation. Sections below
> document what the code actually does; §8 specifies the SCES model the guide implies.

### 7.1 What the module computes

200 synthetic suppliers (`SUPPLIERS`, one row per `i` in `Array.from({length:200})`) each carry ~25
independently-drawn attributes — country, tier, category, `esgScore` (40–80), `scope3MtCO2e`
(10–510), `dqs` data-quality score (30–90), `deforestationRisk`/`mineralExposure` (0–100),
`resilienceScore` (40–90), certifications, EUDR/CRMA compliance flags, and disruption metrics. Every
field is drawn from the platform's seeded PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` with a distinct seed
multiplier per field (`i*7` for country, `i*11` for tier, `i*17` for ESG score, …) so fields are
**mutually independent** — a supplier's ESG score has no causal link to its deforestation risk or
resilience score in this dataset.

The 12 headline KPIs (`buildKPIs`) are plain aggregates over the 200 rows: sums (`totalScope3`,
`openCorr`), unweighted means (`avgDqs = Σdqs/200`, `avgMineral`, `avgResilience`), and coverage
percentages (`eudrPct`, `certCov` = share of suppliers with ≥1 certification). A period selector
(`PERIODS`) does not re-slice the supplier data — it *cosmetically* shifts KPI values by
`period_index × small_constant` (e.g. `avgDqs + pi*0.8`) to simulate a trend without any underlying
time-series.

### 7.2 High-risk flag and derived scores

```js
highRisk = esgScore < 55 || deforestRisk > 70 || mineralExp > 75 || resilience < 50
```

This is a **Boolean OR of four independent thresholds**, not a weighted composite — a supplier with
a perfect ESG score of 80 but `deforestRisk = 71` is flagged exactly as high-risk as one scoring 40
on every dimension. `costAtRisk` (Cost-at-Risk KPI) sums `annualSpendM` only across flagged
suppliers — so it is spend *exposed to a binary flag*, not a probability-weighted expected loss.

| Threshold | Value | Provenance |
|---|---|---|
| ESG score floor | 55 | Synthetic demo value (no cited standard) |
| Deforestation risk ceiling | 70/100 | Synthetic demo value |
| Mineral exposure ceiling | 75/100 | Synthetic demo value |
| Resilience floor | 50/100 | Synthetic demo value |

### 7.3 Calculation walkthrough

1. **Generation** — 200 suppliers built once at module load from `SUPPLIERS` (module-level `const`,
   not per-render), each field independently seeded.
2. **Cross-tabs** — `regionDist`, `tierDist`, `catDist` filter+reduce `SUPPLIERS` by category to
   produce per-group counts and unweighted-mean ESG/Scope 3.
3. **Commodity/mineral traceability** — `COMMODITY_TRACE` and `MINERAL_CHAIN` filter suppliers whose
   `commodities`/`minerals` arrays include the row's item, then compute coverage % (EUDR-compliant
   count ÷ exposed count) and `concentration = 1/exposed.length × 100` — a simple inverse-count proxy
   for supplier concentration, not a Herfindahl-Hirschman Index despite occupying that conceptual
   role.
4. **Tier visibility gap** — `TIER_VISIBILITY` applies **hard-coded data-completeness rates**
   (Tier 1 = 94%, Tier 2 = 67%, Tier 3 = 38%) to each tier's supplier count — these are fixed
   constants, not derived from the `dqs` field.
5. **Regulatory compliance** — `regCompliance` maps CSDDD→`engaged`, EUDR→`eudrCompliant`,
   CRMA→`crmaCompliant`, UK MSA→`engaged` (reused) and reports `count/200` against a hard-coded
   target (CSDDD 80%, EUDR 100%, CRMA 95%, UK MSA 100%).
6. **Board report** — `REPORT_CONTENT` is **entirely static prose** per section with a hand-set
   `maturity` score (59–72); it does not recompute from live `SUPPLIERS` state when filters change.

### 7.4 Worked example

Take a supplier with seed index `i=0`: `country = COUNTRIES[⌊sr(7)×20⌋]`. Computing
`sr(7) = frac(sin(8)×10⁴)`: `sin(8) ≈ 0.9894`, ×10⁴ = 9894.0, frac ≈ 0.90 → index
`⌊0.90×20⌋ = 18` → `COUNTRIES[18] = 'Peru'`. Continuing the same pattern: `esgScore =
⌊sr(0)×40+40⌋`; `sr(0)=frac(sin(1)×10⁴)`, `sin(1)≈0.8415`, ×10⁴=8415.0, frac≈0.15 →
`esgScore=⌊0.15×40+40⌋=45`. With `esgScore=45 < 55`, this supplier is flagged `highRisk = true`
**regardless of its other three scores** — illustrating the OR-threshold's aggressiveness: roughly a
quarter of all suppliers breach at least one of the four independent thresholds by construction (each
threshold individually has a meaningful hit-probability over a uniform 0–100 draw).

### 7.5 Companion analytics

- **Engagement pipeline** — 60 synthetic engagements (`ENGAGEMENTS`) across 5 dimensions × 7 stages
  (`ENGAGEMENT_STAGES`), each with `effectiveness` (50–90) and `cost` ($5–55M) — independently seeded,
  no linkage between stage progression and effectiveness.
- **Alerts** — 25 synthetic alerts (`INIT_ALERTS`) drawn from 15 alert types × 4 severities, attached
  to a random supplier; dismissible client-side only (no backend persistence observed in this file).
- **Disruption scenarios** — 6 hard-coded geopolitical/climate scenarios (`DISRUPTION_SCENARIOS`)
  with fixed probability/impact/mitigation-status text — not derived from the supplier dataset.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 200 suppliers, all engagements, and all alerts are generated by
  `sr(seed)`. No real supplier names, spend, or ESG scores are present despite the realistic-looking
  city/company name list.
- The guide's SCES formula, the "risk factor weight" panel (ESG 30% / Deforestation 25% / Conflict
  Minerals 20% / Regulatory 20% / Resilience 5% — inferred from the displayed factors), and the
  spend-weighted composite it implies are **not implemented**; see §8.
- Tier data-completeness rates (94/67/38%) are fixed constants applied uniformly to any period/filter
  selection, not derived from live records.
- `concIdx` (Mineral Concentration KPI, labelled "HHI") is itself just `sr(pi*111)*0.3+0.45` — a
  period-seeded random number with no relationship to the mineral concentration table below it.

**Framework alignment:** GRI 308 (Supplier Environmental Assessment) and GRI 414 (Supplier Social
Assessment) are referenced in the guide as the scoring basis for `esgScore`, but the code does not
implement GRI indicator-level scoring — `esgScore` is a single random draw. EUDR (EU Deforestation
Regulation) and CRMA (Critical Raw Materials Act) compliance are represented as **binary flags**
(`eudrCompliant`, `crmaCompliant`) rather than the regulation's actual due-diligence-statement and
geolocation-traceability requirements. LkSG/CSDDD due-diligence coverage is approximated by reusing
the unrelated `engaged` flag.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Support procurement/sustainability decisions — supplier prioritisation, engagement budget allocation,
and CSDDD/LkSG due-diligence coverage reporting — by producing a defensible, auditable **Supply Chain
ESG Score (SCES)** per supplier and in aggregate, replacing the current independent-random-fields +
OR-threshold approach. Scope: all Tier 1–3 suppliers with recorded spend ≥ a materiality floor.

### 8.2 Conceptual approach

Adopt a **spend-weighted, tier-discounted linear composite**, the same architecture used by
EcoVadis' Supplier Scorecard aggregation and MSCI ESG's issuer-to-portfolio roll-up (score ×
weight, summed, normalised to 0–100), combined with **CDP Supply Chain's category weighting**
for the environmental sub-score. Tier discounting (Tier 2/3 suppliers weighted down relative to
Tier 1) mirrors PCAF's data-quality-score discount logic — indirect visibility justifies a lower
confidence weight, not exclusion.

### 8.3 Mathematical specification

```
SubScore_E,S,G(supplier) = Σ_k  w_k · indicator_k                (k = GRI 308/414 indicator, 0–100 each)
ESG_supplier = 0.4·E + 0.35·S + 0.25·G

TierDiscount(t) = { 1.00  Tier 1 ;  0.85  Tier 2 ;  0.65  Tier 3 }   (visibility-confidence discount)

SpendWeight(s) = annualSpend_s / Σ_all annualSpend                  (normalised to portfolio)

SCES = Σ_s  ESG_supplier(s) × SpendWeight(s) × TierDiscount(tier_s)   ∈ [0,100]

RiskScore(s) = clip(0,100, 100 − ESG_supplier(s)) 
             + λ_defo·max(0, deforestRisk_s−50) 
             + λ_min·max(0, mineralExposure_s−50)          (additive penalty overlay, not OR-flag)
HighRisk(s)  = RiskScore(s) > P80(RiskScore)                 (relative, percentile-based, not fixed cut)
```

| Parameter | Value | Calibration source |
|---|---|---|
| E/S/G blend weights | 0.40/0.35/0.25 | GRI 308 (env) + 414 (social) relative indicator counts; governance residual — align to CDP Supply Chain module weighting on adoption |
| Tier discount | 1.00/0.85/0.65 | Modelled on PCAF data-quality score discount steps (PCAF Global GHG Standard, Table 3) |
| λ_defo, λ_min | 0.5, 0.5 | Illustrative; calibrate via regression of realised supply disruptions vs. exposure once loss history exists |
| HighRisk percentile | P80 | Standard top-quintile flagging convention; avoids the OR-threshold's ~25%+ false-positive rate on independent fields |

### 8.4 Data requirements

- Supplier GRI 308/414 indicator responses (CDP Supply Chain questionnaire — free tier available for
  disclosing suppliers) or third-party ESG ratings (EcoVadis, Sustainalytics — vendor).
- Verified annual spend by supplier (existing `annualSpendM` field — currently synthetic, needs ERP
  procurement feed).
- Tier assignment from supplier master data (existing `tier` field).
- Deforestation/mineral exposure from EUDR geolocation data and RMI conformant smelter lists (both
  free, authoritative) — would replace the current random `deforestRisk`/`mineralExposure` draws.

### 8.5 Validation & benchmarking plan

Backtest `HighRisk` flags against realised 12-month supplier disruption/controversy events (precision/
recall); sensitivity-test SCES to ±10pp shifts in tier discount and E/S/G weights; reconcile aggregate
SCES trend against EcoVadis portfolio benchmark scores for overlapping suppliers as an external
validation anchor.

### 8.6 Limitations & model risk

Linear weighting cannot capture threshold effects (e.g. a single forced-labour finding should
dominate regardless of spend weight) — a production system should overlay hard exclusion rules for
sanctions/modern-slavery hits ahead of the continuous score. Spend-weighting can mask small-spend,
high-impact suppliers (e.g. sole-source rare-earth suppliers); pair SCES with the separate
single-source/concentration register (§7.5) rather than relying on SCES alone for prioritisation.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the SCES spend-weighted composite and real regulatory due-diligence (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents that the guide's headline `SCES = Σ(Supplier ESG × Spend Weight × Tier Discount)` **is not computed** — the page generates 200 `sr()`-synthetic suppliers with mutually independent per-field draws (ESG score unrelated to deforestation risk or resilience), aggregates unweighted means, and flags high-risk via an OR of four hard thresholds; the "risk factor weight" panel (ESG 30% / Deforestation 25% / etc.) is static display text wired to nothing, and `concIdx` (labelled "HHI") is a period-seeded random number unrelated to the concentration table beneath it. The period selector cosmetically shifts KPIs rather than re-slicing data. Blast radius is 81. Evolution A builds the real SCES and grounds the regulatory flags.

**How.** (1) Implement the SCES composite: spend-weighted, tier-discounted aggregate of supplier ESG scores, with the displayed risk-factor weights actually driving the calculation. (2) Ingest real supplier data (spend, EcoVadis/CDP scores) replacing the 200 synthetic rows, so ESG score, deforestation risk, and resilience are correlated where real relationships exist. (3) Implement EUDR and CRMA compliance as the regulations' actual requirements (EUDR due-diligence statement + geolocation traceability; CRMA critical-mineral sourcing) rather than binary `sr()` flags, and derive LkSG/CSDDD coverage from real due-diligence records instead of reusing the unrelated `engaged` flag. (4) Compute `concIdx` as a genuine Herfindahl index from the mineral-concentration table. (5) Make the period selector re-slice real time-series data.

**Prerequisites.** Real supplier/spend data; EUDR/CRMA requirement encoding; the shared supply-chain compute routes (failing) fixed. This is a substantial build. **Acceptance:** SCES is spend-weighted and tier-discounted with the displayed weights driving it; EUDR/CRMA flags reflect actual due-diligence status; the HHI is a real concentration calculation.

### 9.2 Evolution B — Multi-tier due-diligence and board-reporting copilot (LLM tier 2)

**What.** A copilot for the CSDDD/LkSG compliance officer the module targets: "which suppliers fail CSDDD due-diligence and why?", "what's our SCES by tier and where's the concentration risk?", "draft the board ESG supply-chain report" — reading the (Evolution-A) SCES, real risk flags, and regulatory-coverage data, and drafting the board report the module's `BOARD_SECTIONS` structure anticipates.

**How.** Tier-2 pattern once SCES and the regulatory flags are real: the supply-chain compute endpoints become tools; the copilot narrates SCES decomposition, tier concentration (via the real HHI), and per-supplier due-diligence gaps, citing EUDR/CRMA/LkSG/CSDDD requirements. The board-report draft routes to the report-studio layer; the no-fabrication validator checks every score and coverage figure against tool output.

**Prerequisites (hard).** Evolution A — the SCES doesn't exist, the risk-weight panel drives nothing, and regulatory flags are random, so the copilot would draft board reports on fabricated compliance status, the highest-stakes failure mode for CSDDD disclosure. **Acceptance:** every SCES/coverage figure traces to the computed model; due-diligence gaps cite the specific regulation's requirement; a supplier's regulatory flag reflects real status, not a draw.