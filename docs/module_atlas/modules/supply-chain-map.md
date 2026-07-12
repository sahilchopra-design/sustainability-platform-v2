# Supply Chain Map
**Module ID:** `supply-chain-map` · **Route:** `/supply-chain-map` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Geographic supply chain visualisation with ESG risk overlay; maps supplier locations, trade flows and physical/regulatory risk exposure across countries and regions.

> **Business value:** Physical supply chain disruption costs companies an average of ≄45 days of revenue per incident; geospatial risk mapping enables proactive supplier diversification and business continuity planning.

**How an analyst works this module:**
- Geocode supplier facility addresses
- Overlay physical climate hazard layers (flood, water stress, heat, cyclone)
- Apply country governance and regulatory risk
- Compute GERI for each facility
- Visualise trade flows and risk concentration on interactive map

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_TRACE`, `CERT_STANDARDS`, `COLORS`, `DD_REGS`, `DEFOREST_COMMODITIES`, `HR_HOTSPOTS`, `KpiCard`, `REGIONS`, `REGION_F`, `REMEDIATION_DATA`, `RISK_F`, `RISK_LEVELS`, `SECTORS`, `SECTOR_F`, `SECTOR_RISK_PROFILE`, `SUPPLIERS`, `TABS`, `TIER_ANALYSIS`, `TREND_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DD_REGS` | 11 | `scope`, `focus`, `effective`, `tier` |
| `HR_HOTSPOTS` | 11 | `issue`, `severity`, `sectors` |
| `DEFOREST_COMMODITIES` | 9 | `exposedPct`, `hotspotRegion`, `linkedSectors`, `eudrScope` |
| `CERT_STANDARDS` | 13 | `type`, `desc`, `suppliers`, `sectors`, `mandatory` |
| `REMEDIATION_DATA` | 16 | `supplier`, `issue`, `priority`, `status`, `deadline`, `costUSD`, `expectedROI`, `owner` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `region` | `REGIONS[Math.floor(sr(i * 7) * REGIONS.length)];` |
| `esgScore` | `Math.round(sr(i * 11) * 60 + 20);` |
| `riskLevel` | `RISK_LEVELS[Math.min(4, Math.floor((100 - esgScore) / 20))];` |
| `carbonIntensity` | `Math.round(sr(i * 13) * 500 + 50);` |
| `laborScore` | `Math.round(sr(i * 17) * 60 + 20);` |
| `envScore` | `Math.round(sr(i * 19) * 60 + 25);` |
| `humanRightsFlags` | `Math.floor(sr(i * 29) * 5);` |
| `tier` | `Math.ceil(sr(i * 37) * 3);` |
| `SECTOR_RISK_PROFILE` | `SECTORS.map((s, i) => ({` |
| `TIER_ANALYSIS` | `[1, 2, 3].map(tier => {` |
| `CARBON_TRACE` | `SECTORS.map((sec, i) => {` |
| `kpis` | `useMemo(() => { const n = Math.max(1, filtered.length);` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => `"${r[k]}"`).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |

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
**Frontend seed datasets:** `CERT_STANDARDS`, `COLORS`, `DD_REGS`, `DEFOREST_COMMODITIES`, `HR_HOTSPOTS`, `REGIONS`, `REGION_F`, `REMEDIATION_DATA`, `RISK_F`, `RISK_LEVELS`, `SECTORS`, `SECTOR_F`, `TABS`, `TIER_ANALYSIS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mapped Supplier Sites | — | Supplier Registry | Total geocoded supplier facility locations with ESG risk overlays. |
| High Physical Hazard Sites | — | WRI Aqueduct | Supplier sites in extreme water stress, flood or heat hazard zones requiring prioritised engagement. |
| Country Risk Hotspots | — | ND-GAIN Index | Countries hosting suppliers with combined high physical risk and low adaptive capacity. |
- **Supplier Geocodes, WRI Hazard Layers, Country Risk Indices, Trade Flow Data** → Spatial join + GERI computation + map rendering engine → **Interactive supply chain map, risk concentration reports, engagement priority lists**

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
**Methodology:** Geospatial ESG Risk Index
**Headline formula:** `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight`

Location-adjusted ESG risk combining supplier score, country governance risk and physical climate hazard at facility level.

**Standards:** ['WRI Aqueduct', 'ND-GAIN Country Index']
**Reference documents:** WRI Aqueduct Water Risk Atlas; ND-GAIN Country Index; Munich Re NatCatSERVICE; FAOSTAT Agri-Trade Flows

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-contagion` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-emissions-mapper` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-network-viz` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-carbon` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **geospatial** module —
> "geocoded supplier facility locations," an interactive map with "trade flows," and a formula
> `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight` referencing WRI Aqueduct
> and ND-GAIN. **None of this exists in the code.** There are no latitude/longitude fields, no map
> rendering library, no WRI/ND-GAIN data, and no `GERI` calculation anywhere in the 930-line file.
> What the page actually is: a **tabular supplier ESG/due-diligence registry** (150 suppliers, 11
> tabs — Overview, Registry, Risk Hotspots, Human Rights, Deforestation, Due Diligence, Regulatory,
> Tier Analysis, Carbon Trace, Certifications, Remediation) with `riskLevel` derived purely from a
> single ESG-score bucket. Sections below document the registry logic as implemented; the guide's
> geospatial GERI model is written up as a specification in §8.

### 7.1 What the module computes

150 synthetic suppliers (`SUPPLIERS`), sector assigned by deterministic round-robin (`i % 10` over
10 `SECTORS`), region drawn randomly from 16 countries via `sr(i*7)`. Each supplier carries an
`esgScore` (20–80, `sr(i*11)*60+20`) from which `riskLevel` is derived as a **direct bucket**, plus
independently-seeded `carbonIntensity`, `laborScore`, `envScore`, categorical `deforestRisk` /
`waterRisk` / `childLaborRisk` (High/Medium/Low via `sr()` threshold cuts), `humanRightsFlags`
(0–4 count), `ddStatus` (Audited/In Progress/Pending), `tier` (1–3), Scope 1/2 GHG, renewable-energy
%, and on-time-delivery %.

```js
riskLevel = RISK_LEVELS[min(4, floor((100 − esgScore) / 20))]
// RISK_LEVELS = ['Critical','High','Medium','Low','Very Low']
```

This is a **single-variable step function**: `esgScore` in [0,20)→Critical, [20,40)→High,
[40,60)→Medium, [60,80)→Low, [80,100]→Very Low. No other field (carbon intensity, human-rights
flags, deforestation risk, water risk) contributes to `riskLevel` despite being displayed alongside
it as if they were inputs to a composite risk rating.

### 7.2 Parameterisation

| Field | Range | Distribution | Provenance |
|---|---|---|---|
| `esgScore` | 20–80 | `sr(i*11)*60+20` | Synthetic demo value |
| `carbonIntensity` | 50–550 | `sr(i*13)*500+50` | Synthetic demo value |
| `deforestRisk`/`waterRisk`/`childLaborRisk` | Low/Med/High | `sr()<0.3→High, <0.6→Med, else Low` (or `<0.2/<0.5` for childLabor) | Synthetic demo thresholds, no cited base rate |
| `conflictMinerals` flag | boolean | `sr(i*61) < 0.15` → ~15% of suppliers flagged | Synthetic demo value |
| `tier` | 1–3 | `ceil(sr(i*37)*3)` | Synthetic demo value |
| Risk-level bucket width | 20 pts | `floor((100−esgScore)/20)` | Even 5-way split of the 0–100 ESG range |

The static reference tables — `DD_REGS` (10 real regulations: CSDDD, LkSG, French Duty of Vigilance,
UK MSA, US UFLPA, EU Conflict Minerals Reg., EUDR, SEC Climate Disclosure, Australia MSA, EU Battery
Reg.), `HR_HOTSPOTS` (10 country/issue pairs), `DEFOREST_COMMODITIES` (8 commodities with real
EUDR-scope flags and approximate exposure %) — are hand-authored descriptive content, not derived
from the supplier records.

### 7.3 Calculation walkthrough

1. **Filtering** — `filtered` applies sector, risk-level, region, and free-text search (name or
   region substring match) simultaneously.
2. **KPI roll-up** — `kpis` (line 205) computes count, `avgEsg` (mean), `critical` count, summed
   `hrFlags`, `audited` count, `conflictMinerals` count, and `totalSpend` — all unweighted
   sums/means over `filtered`, guarded by `Math.max(1, filtered.length)`.
3. **Sector/region risk counts** — `sectorRiskCount` counts suppliers per sector where
   `riskLevel ∈ {Critical, High}`; `regionCount` is a plain per-region tally — both simple
   `Object` accumulator patterns, safe against division by zero (no division involved).
4. **Tier analysis** (`TIER_ANALYSIS`) — per tier (1/2/3), computes count, mean ESG, count of
   Critical-risk suppliers, count Audited, summed HR flags, mean carbon intensity, count
   conflict-minerals-flagged, mean spend — same unweighted-aggregate pattern, `Math.max(1,n)`
   guarded.
5. **Carbon trace** (`CARBON_TRACE`) — per sector, sums Scope 1/2 GHG (÷1000 to convert to
   thousands of tCO₂e display units), means carbon intensity and renewable-energy %.
6. **CSV export** — `exportCSV` is a generic client-side Blob/anchor-download utility, applied to
   whichever table is active; no server round-trip.

### 7.4 Worked example

Supplier `i=42`: sector `= SECTORS[42%10] = SECTORS[2] = 'Textiles'`. `esgScore =
round(sr(42*11)*60+20) = round(sr(462)*60+20)`. `sr(462)=frac(sin(463)×10⁴)`; `sin(463 rad)` reduces
mod 2π — numerically `sin(463)≈-0.9998`, ×10⁴=-9998, `frac` via `x−floor(x)` on a negative gives
`≈0.02` → `esgScore=round(0.02×60+20)=round(21.2)=21`. Risk bucket:
`floor((100−21)/20)=floor(3.95)=3` → `RISK_LEVELS[3]='Low'`. Note the counter-intuitive naming: an
ESG score of just 21/100 (near the bottom of the range) still maps to the **'Low'** risk label
because `RISK_LEVELS` is ordered `[Critical, High, Medium, Low, Very Low]` and the bucket index
counts *down* from the top of the ESG range — a supplier needs `esgScore < 20` to be labelled
'Critical'. Given `esgScore` is drawn from `sr()*60+20`, i.e. always ≥20, **no synthetic supplier in
this dataset can ever reach 'Critical'** — the bucket is structurally unreachable given the
generator's range, even though the UI's risk filter offers 'Critical' as a selectable option.

### 7.5 Companion analytics

- **Regulatory tab** — hard-coded compliance-readiness percentages per regulation (e.g. EU Battery
  Regulation 28%, "Early Stage") are static, not computed from supplier `ddStatus`/certification
  fields.
- **Remediation tracker** (`REMEDIATION_DATA`) — 15 hand-authored remediation items with realistic
  cost figures ($8K–$180K) and priority/status/owner — illustrative case data, not generated from
  the supplier risk flags.
- **Certification registry** (`CERT_STANDARDS`) — 12 real standards (ISO 14001, SA8000, ISO 45001,
  FSC, RSPO, Rainforest Alliance, B Corp, Sedex/SMETA, CDP Climate A, GoodWeave, Fairtrade,
  ISO 50001) with `sr()`-seeded supplier-adoption counts, unrelated to the 150-row `SUPPLIERS` array.

### 7.6 Data provenance & limitations

- **100% synthetic supplier data**, `sr()`-seeded; the 10 DD regulations, 10 HR hotspots, 8
  deforestation commodities, and 12 certification standards are real-world reference content but
  disconnected from the supplier records (no supplier row references a specific regulation or
  hotspot by ID).
- No geocoding, no map component, no WRI Aqueduct/ND-GAIN data — the "map" in the module name and
  guide is not implemented; see §8 for what a real geospatial GERI would require.
- `riskLevel`'s 'Critical' bucket is unreachable given the ESG-score generator's floor of 20 — a
  structural artefact of the synthetic-data ranges, not a modelling decision.

**Framework alignment:** CSDDD, LkSG, EUDR, UFLPA and the other `DD_REGS` entries are accurately
described (scope, focus, effective date) as static reference content, but the module does not map
individual suppliers against these regulations' actual due-diligence-tier requirements (e.g. CSDDD's
turnover/employee thresholds) — it only shows aggregate compliance percentages that are hard-coded,
not computed from the regulation's real applicability tests.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Deliver the geospatial ESG-risk capability the guide and module name promise: a facility-level
**Geospatial ESG Risk Index (GERI)** combining supplier ESG performance, host-country governance
risk, and physical climate-hazard exposure, to prioritise site visits, due-diligence spend, and
supplier diversification. Scope: all geocoded Tier 1–3 facility locations.

### 8.2 Conceptual approach

Benchmark against **Verisk Maplecroft's Environmental Risk Outlook** (country/site risk premium
layered onto a base ESG score) and **WRI Aqueduct's facility-level water-risk scoring
methodology** (grid-cell hazard lookup by lat/lng, aggregated to asset level) — both use the same
architecture: normalise a location-independent entity score, then multiply by location-dependent
hazard/governance multipliers so that identical suppliers in different geographies receive different
composite risk.

### 8.3 Mathematical specification

```
CountryRiskPremium(country) = 0.5·(1 − NDGAIN_Readiness(country)/100)
                             + 0.5·(1 − WGI_GovernanceScore(country)/100)     ∈ [0,1]

PhysicalHazardWeight(lat,lng) = max over hazards h∈{flood,water-stress,heat,cyclone} of
                                 AqueductScore_h(lat,lng) / 5                  ∈ [0,1]  (Aqueduct 0-5 scale)

GERI(facility) = ESGScore(supplier) × (1 + CountryRiskPremium) × (1 + PhysicalHazardWeight)
               ∈ [ESGScore, 4×ESGScore]   (bounded multiplicative uplift, both terms ≥0)
```

| Parameter | Value | Calibration source |
|---|---|---|
| CountryRiskPremium blend | 50/50 ND-GAIN + WGI | ND-GAIN Readiness sub-index (adaptive capacity) + World Bank Worldwide Governance Indicators — both free, country-year panel |
| PhysicalHazardWeight | max() not mean() | Conservative — a facility should be scored on its worst hazard, not diluted by hazards it doesn't face (WRI Aqueduct convention) |
| Hazard normalisation | ÷5 | WRI Aqueduct's native 0–5 water-risk scale |
| GERI multiplicative form | (1+premium)×(1+hazard) | Ensures GERI ≥ ESGScore always (risk overlay only adds risk, never subtracts) |

### 8.4 Data requirements

- Facility geocodes (lat/lng) per supplier site — needs supplier master-data enrichment (currently
  absent entirely).
- WRI Aqueduct 4.0 gridded hazard layers (flood, water stress, heat, cyclone) — free, downloadable
  raster/vector.
- ND-GAIN Country Index (Readiness + Vulnerability) — free, annual country panel.
- World Bank Worldwide Governance Indicators — free, annual country panel.
- Existing `esgScore` per supplier (already in `SUPPLIERS`, currently synthetic — needs real
  EcoVadis/CDP/Sustainalytics feed).

### 8.5 Validation & benchmarking plan

Reconcile country-level `CountryRiskPremium` output against Verisk Maplecroft's published country
risk rankings (rank-correlation target ρ>0.7 for overlapping countries); spot-check
`PhysicalHazardWeight` against WRI Aqueduct's own web tool for 20 sampled facility coordinates;
sensitivity-test the multiplicative form against an additive alternative to confirm ranking stability.

### 8.6 Limitations & model risk

Country-level premiums cannot capture sub-national variation (e.g. flood risk differs sharply within
China); facility-level Aqueduct lookups mitigate this for the physical term but the governance term
remains country-level unless a sub-national governance index is sourced. Multiplicative bounding at
4× ESGScore is an arbitrary design ceiling — validate against realised loss/disruption data once
available rather than treating the bound as calibrated.

## 9 · Future Evolution

### 9.1 Evolution A — Build the actual geospatial GERI the module name promises (analytics ladder: rung 1 → 3)

**What.** The §7 flag is comprehensive: the module is named "Supply Chain Map" and the guide promises geocoded facilities, an interactive map with trade flows, and `GERI = ESG Score × (1 + Country Risk Premium) × Physical Hazard Weight` referencing WRI Aqueduct and ND-GAIN — but **there are no lat/lon fields, no map library, no WRI/ND-GAIN data, and no GERI calculation** in the 930-line file. What exists is a tabular supplier registry (150 synthetic suppliers, 11 tabs) where `riskLevel` is a single-variable ESG-score bucket (the 'Critical' band is even unreachable given the score floor of 20), with the displayed carbon/human-rights/deforestation fields not contributing to it. The DD regulations and hotspots are real reference content but disconnected from suppliers. Blast radius 81. Evolution A builds the geospatial capability the module is named for.

**How.** (1) Add facility geocoding (lat/lon per supplier) and a map component with hazard overlays — the platform's physical-risk digital twin already has flood/water-stress/heat/cyclone PostGIS grids to overlay, and WRI Aqueduct water-risk is a free layer. (2) Implement the GERI formula: supplier ESG × (1 + country-governance-risk premium from ND-GAIN/WGI) × physical-hazard weight from the facility's grid cell — a real location-adjusted composite replacing the single-variable bucket. (3) Join suppliers to the real DD regulations by their actual applicability tests (CSDDD turnover/employee thresholds) rather than hard-coded compliance percentages. (4) Fix the unreachable 'Critical' bucket. (5) Ground suppliers in real data via the shared backend (fixing its failing compute routes).

**Prerequisites.** Geocoding; physical-risk grids and WRI Aqueduct (available); the shared compute-route fixes. This is a substantial build — the geospatial layer is entirely absent. **Acceptance:** GERI computes per facility from ESG × country premium × hazard weight; suppliers render on a map with hazard overlays; regulatory flags reflect the regulations' real applicability tests.

### 9.2 Evolution B — Geospatial supply-chain risk copilot (LLM tier 2)

**What.** A copilot for the procurement/resilience analyst: "which facilities sit in high-flood-risk zones with weak governance?", "compute GERI for our Southeast Asia suppliers", "which suppliers trigger EUDR due-diligence and where are they?" — reading the (Evolution-A) GERI, facility geolocations, and hazard overlays, prioritising site visits and due-diligence spend.

**How.** Tier-2 pattern once GERI and geocoding exist: the GERI calculation and hazard-lookup become tools; the copilot narrates facility risk by location, decomposing GERI into ESG/governance/hazard contributions and citing WRI Aqueduct/ND-GAIN sources. Regulatory answers map facilities to the DD regulations' real thresholds. The no-fabrication validator checks every GERI figure against tool output.

**Prerequisites (hard).** Evolution A — there is no map, no geocoding, and no GERI today, so a geospatial copilot would fabricate locations and a risk index that doesn't exist. **Acceptance:** every GERI figure traces to the computed formula with its hazard-grid source; facility locations are real geocodes; a supplier outside coverage returns a refusal.