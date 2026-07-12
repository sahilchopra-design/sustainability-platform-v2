# Supply Chain Emissions Mapper
**Module ID:** `supply-chain-emissions-mapper` · **Route:** `/supply-chain-emissions-mapper` · **Tier:** A (backend vertical) · **EP code:** EP-DN1 · **Sprint:** DN

## 1 · Overview
Maps and quantifies Scope 3 supply chain emissions across all 15 GHG Protocol categories. Integrates spend-based, activity-based, and supplier-specific emission factor methods with PCAF data quality scoring and GHG Protocol Corporate Value Chain Standard.

> **Business value:** Directly required for GHG Protocol Scope 3 disclosure, SBTi target setting (67% coverage), and CSRD ESRS E1 value chain emissions reporting. Provides systematic Scope 3 inventory across all 15 categories with PCAF data quality scoring.

**How an analyst works this module:**
- Upload spend or activity data for S3 categorisation
- Apply EXIOBASE or supplier-specific emission factors
- Score data quality using PCAF DQ 1–5 tiers
- Identify top 80% emission contributors by supplier
- Generate GHG Protocol-compliant S3 inventory

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `CATEGORIES`, `KpiCard`, `PATHWAYS`, `REGIONS`, `SECTORS`, `SUPPLIERS`, `TABS`, `TIERS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `PATHWAYS` | `['Science-Based', 'Net Zero 2040', 'Net Zero 2050', 'Carbon Neutral', 'Business As Usual'];` |
| `totalScope3` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope3Upstream, 0), []);` |
| `totalScope1` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.scope1, 0), []);` |
| `totalSpend` | `useMemo(() => SUPPLIERS.reduce((s, x) => s + x.spendMn, 0), []);` |
| `sbtiCount` | `useMemo(() => SUPPLIERS.filter(s => s.sbtiCommitted).length, []); const avgDQ = useMemo(() => SUPPLIERS.reduce((s, x) => s + x.dataQuality, 0) / Math.max(1, SUPPLIERS.length), []);` |
| `tierBreakdown` | `useMemo(() => TIERS.map(t => {` |
| `categoryBreakdown` | `useMemo(() => CATEGORIES.map(c => {` |
| `pathwayBreakdown` | `useMemo(() => PATHWAYS.map(p => {` |
| `top10Hotspots` | `useMemo(() => [...SUPPLIERS].sort((a, b) => b.scope3Upstream - a.scope3Upstream).slice(0, 10), []);` |
| `count` | `SUPPLIERS.filter(s => Math.floor(s.dataQuality) === score).length;` |
| `avgDQ` | `sups.length ? sups.reduce((a, s) => a + s.dataQuality, 0) / sups.length : 0;` |
| `avgTarget` | `sups.length ? sups.reduce((a, s) => a + s.reductionTarget, 0) / sups.length : 0;` |

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
**Frontend seed datasets:** `CATEGORIES`, `PATHWAYS`, `REGIONS`, `SECTORS`, `TABS`, `TIERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Scope 3 Share of Corporate Emissions | — | CDP Supply Chain Report 2023 | Scope 3 represents 70–90% of corporate GHG footprint — supply chain (cat 1-8) typically largest |
| SBTi Scope 3 Coverage Requirement | — | SBTi Corporate Manual 2023 | SBTi requires Scope 3 targets covering at least 67% of total Scope 3 emissions |
| Supplier Reporting Rate | — | CDP Supply Chain 2023 | Only 23% of suppliers to large corporations report emissions to CDP — data quality gap |
- **Procurement/spend data by supplier and category** → Spend-based S3 emissions → **S3 emissions by category using EXIOBASE emission factors**
- **Supplier primary data submissions (CDP, direct)** → Supplier-specific S3 → **High-quality supplier emissions replacing spend-based estimates**
- **Activity data (tonne-km, MWh, waste kg)** → Activity-based S3 categories → **Categories 4, 9, 12 using physical activity data**

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
**Methodology:** Scope 3 Supply Chain Emissions
**Headline formula:** `S3_cat_i = ActivityData_i × EmissionFactor_i; S3_total = Σ S3_cat_i (i=1..15); WACI_S3 = Σ [Revenue_weight_j × S3intensity_j]`

Spend-based method uses EXIOBASE/MRIO emission factors $/spend; activity-based uses physical units × EF; supplier-specific uses verified primary data — quality improves in that order

**Standards:** ['GHG Protocol Corporate Value Chain Standard 2011', 'PCAF Standard Part A — Corporate Loans 2022', 'SBTi Scope 3 Guidance 2023', 'ISO 14064-1:2018 Greenhouse Gas Accounting']
**Reference documents:** GHG Protocol Corporate Value Chain (Scope 3) Standard 2011; SBTi Corporate Manual — Scope 3 Target Setting 2023; CDP Supply Chain Report 2023; ISO 14064-1:2018 Greenhouse Gas Accounting and Verification

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).

| Connected module | Shared via |
|---|---|
| `supply-chain-esg-hub` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-labor-climate` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-map` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-resilience` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-contagion` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-network-viz` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `supply-chain-carbon` | table:base, table:emission_factor_library, table:exc, table:sbti_targets, table:sbti_trajectories, table:scope3_activities |
| `climate-underwriting-workbench` | table:exc, table:sqlalchemy |
| `insurance-transition` | table:exc, table:sqlalchemy |
| `insurance-protection-gap` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `S3_cat_i = ActivityData_i ×
> EmissionFactor_i; S3_total = Σ S3_cat_i (i=1..15); WACI_S3 = Σ[Revenue_weight_j × S3intensity_j]`
> — a 15-category GHG Protocol Scope 3 build-up with a revenue-weighted intensity aggregate. **None
> of this exists in the code.** There is no activity-data × emission-factor calculation, no 15-
> category breakdown (the `CATEGORIES` list here — Raw Materials, Manufacturing, Logistics,
> Packaging, Energy, Services, Agriculture, Chemicals — is a business-function taxonomy, not the
> GHG Protocol's numbered Scope 3 Categories 1–15), and no WACI aggregate. `scope1`, `scope2`, and
> `scope3Upstream` are independent `sr()` draws per supplier with no formula connecting them.

### 7.1 What the module computes

80 synthetic suppliers (`SUPPLIERS`), each independently seeded:

```
tier            = floor(sr(i×3)×6) + 1                        // Tier 1–6
category        = CATEGORIES[floor(sr(i×7+2)×8)]                // 8 business-function categories
sector          = SECTORS[floor(sr(i×11+1)×8)]
region          = REGIONS[floor(sr(i×5+4)×6)]
scope1          = round(sr(i×13+2)×5000 + 200)                  // 200–5,200 tCO2e
scope2          = round(sr(i×17+3)×3000 + 100)                  // 100–3,100 tCO2e
scope3Upstream  = round(sr(i×19+5)×15000 + 500)                 // 500–15,500 tCO2e
spendMn         = sr(i×23+6)×50 + 2                              // $2–52M
dataQuality     = sr(i×29+7)×4 + 1                                // PCAF DQ score 1.0–5.0
pathway         = PATHWAYS[floor(sr(i×31+8)×5)]                  // Science-Based | Net Zero 2040/2050 | Carbon Neutral | BAU
sbtiCommitted   = sr(i×37+9) > 0.5                                // ~50% true
reductionTarget = round(sr(i×41+10)×50 + 10)                     // 10–60%
engagementScore = round(sr(i×43+11)×100)                          // 0–100
```

No field is derived from another — `scope3Upstream` bears no relationship to `spendMn`, `sector`,
or `category`, so the implied emission intensity ($/tCO₂e) is effectively random per supplier rather
than driven by a sector-specific emission factor as the guide's formula would require.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `scope3Upstream` | 500–15,500 tCO₂e | Synthetic, independent of spend/sector |
| `dataQuality` | 1.0–5.0 | Labelled "PCAF DQ" scale — the real PCAF 1–5 scoring convention (1=best/primary data, 5=worst/proxy) is correctly reproduced as a *range*, but the value is a random draw, not derived from any actual data-source hierarchy |
| `PATHWAYS` distribution | 5 categories, uniform via `sr()` | Real named pathway categories, uniformly randomly assigned rather than reflecting any actual supplier commitment data |
| `scenarioReductions` (4 fixed scenarios) | 1.5°C SBTi: 42% reduction/$38 cost/2030; Net Zero 2050: 65%/$55/2050 | Fixed reference constants, plausible relative ordering (deeper reduction targets cost more and take longer), not computed from `SUPPLIERS` |

### 7.3 Calculation walkthrough

1. **Supplier generation** — 80 suppliers as above.
2. **Portfolio aggregates** — `totalScope3 = Σ scope3Upstream`, `totalScope1 = Σ scope1`,
   `totalSpend = Σ spendMn`, `sbtiCount = count(sbtiCommitted)`, `avgDQ = mean(dataQuality)`.
3. **Tier breakdown** — for each of the 6 tiers, `count`, `emissions = Σ scope3Upstream`,
   `pct = emissions/totalScope3×100` — genuinely computed aggregation over the synthetic table.
4. **Category breakdown** — same pattern, by the 8 business-function categories, sorted descending
   by emissions (a real "hotspot ranking" mechanic, applied to synthetic inputs).
5. **Pathway breakdown** — per pathway, `count`, `emissions`, `avgTarget = mean(reductionTarget)`.
6. **Top-10 hotspots** — `[...SUPPLIERS].sort(desc by scope3Upstream).slice(0,10)`.
7. **Reduction Scenarios tab** — displays the 4 fixed `scenarioReductions` constants, not derived
   from the supplier-level data.

### 7.4 Worked example — Supplier A1 (index 0)

```
tier = floor(sr(0)×6)+1 = floor(0.7147×6)+1 = 4+1 = 5     ("Tier 5")
category = CATEGORIES[floor(sr(2)×8)] = "Manufacturing"
scope1 = round(sr(15)×5000+200) = 1,200 tCO2e
scope2 = round(sr(16)×3000+100) = 3,025 tCO2e
scope3Upstream = round(sr(18)×15000+500) = 13,175 tCO2e
spendMn = round(sr(19)×50+2,1) = $45.3M
dataQuality = round(sr(20)×4+1,1) = 3.3 (PCAF scale)

implied intensity = scope3Upstream / spendMn = 13,175/45.3 ≈ 291 tCO2e/$M
```

This 291 tCO₂e/$M figure has no connection to Supplier A1's `category` ("Manufacturing") or `sector`
— a real EEIO/activity-based model would derive intensity from the sector's actual emission factor,
not an independent random draw that happens to divide out to this number.

### 7.5 Companion analytics

- **Data Quality tab** — presumably a histogram of `dataQuality` scores across the 1–5 PCAF-style
  scale (the real PCAF convention — 1=best — is correctly reproduced structurally).
- **Engagement Tracker tab** — `engagementScore` per supplier, independent of tier/category/pathway.
- **Export tab** — full 80-supplier synthetic dataset export.

### 7.6 Data provenance & limitations

- 100% synthetic dataset; no EXIOBASE/MRIO emission factors, CDP supplier submissions, or SBTi
  validated-target registry data are ingested despite all three being named in the guide.
- No 15-category GHG Protocol Scope 3 breakdown exists — the module's own "category" taxonomy is a
  simplified 8-item business-function list, materially coarser than the real standard.
- No WACI (weighted-average carbon intensity) aggregate is computed despite being named as the
  guide's headline output metric.
- `sbtiCommitted` (boolean, ~50% true) is independent of `pathway` — a supplier can show
  `pathway='Business As Usual'` and `sbtiCommitted=true` simultaneously, an internally inconsistent
  combination a real SBTi-linked dataset would not produce.

**Framework alignment:** GHG Protocol Corporate Value Chain (Scope 3) Standard (15-category structure
named in guide, not implemented — 8-category business-function simplification used instead) · PCAF
Standard Part A Data Quality 1–5 scale (real scale range correctly reproduced, values randomly
assigned) · SBTi Corporate Manual (real target-setting concepts referenced, not computed from actual
supplier submission data) · EXIOBASE/MRIO (named as the intended emission-factor source, not
ingested).

## 9 · Future Evolution

### 9.1 Evolution A — Build the real 15-category Scope 3 inventory with EXIOBASE factors and WACI (analytics ladder: rung 1 → 3)

**What.** The §7 flag documents a comprehensive gap: the guide promises `S3_cat_i = ActivityData × EmissionFactor` across all 15 GHG Protocol categories plus a revenue-weighted `WACI_S3`, but **none exists** — the `CATEGORIES` list is an 8-item business-function taxonomy (not the numbered Scope 3 Categories 1–15), there is no activity × EF calculation, no WACI, and `scope1/scope2/scope3Upstream` are independent `sr()` draws with no relationship to `spendMn` or sector, so implied emission intensity is effectively random. `sbtiCommitted` is even independent of `pathway` (a supplier can be "Business As Usual" and SBTi-committed). Yet the backend has the real assets — `emission_factor_library` (real-db, passing) and `scope3_assessments`/`sbti_targets` tables — while the compute routes fail. Blast radius is 81. Evolution A builds the real inventory.

**How.** (1) Triage the failing `POST /scope3/calculate` and `/sbti-target` routes and seed the empty assessment/target tables. (2) Replace the 8-category business taxonomy with the real 15 GHG Protocol Scope 3 categories and compute `S3_cat_i = ActivityData_i × EF_i` using EXIOBASE/MRIO factors from the `emission_factor_library` — the guide's actual formula. (3) Compute the WACI_S3 revenue-weighted intensity aggregate the guide names as the headline output. (4) Apply PCAF DQ 1–5 scoring from the actual data source used per category (not a random draw). (5) Fix the `sbtiCommitted`/`pathway` inconsistency by deriving commitment from the SBTi target registry.

**Prerequisites.** The two route failures and empty tables are the gate; EXIOBASE factors need loading into the emission-factor library; the 15-category schema. This is a substantial build — the real Scope 3 inventory is essentially absent today. **Acceptance:** the inventory covers all 15 categories via activity × EF; WACI_S3 computes; PCAF DQ reflects the real data source; no supplier is both BAU and SBTi-committed.

### 9.2 Evolution B — Scope 3 disclosure and target-setting analyst (LLM tier 2)

**What.** A tool-calling analyst for the CSRD ESRS E1 / SBTi workflow: "build our 15-category Scope 3 inventory from this activity data", "which categories and suppliers drive 80% of emissions?", "set an SBTi 1.5°C-aligned Scope 3 target with 67% coverage" — calling the compute and SBTi endpoints and the emission-factor library, narrating the category build-up, the PCAF data-quality scores, and the SBTi trajectory, never inventing emission factors.

**How.** Tool schemas from the module's OpenAPI operations (2 POST compute + the real-DB GET routes); grounding = this Atlas record. The inventory build narrates each category's activity × EF with its EXIOBASE/supplier-specific source and PCAF DQ; SBTi answers cite the `calculate_sbti_target` trajectory and coverage threshold. The no-fabrication validator checks every tCO₂e and factor against tool output.

**Prerequisites (hard).** Evolution A — the compute routes fail and there is no real 15-category inventory, so the analyst would narrate random per-supplier draws as if they were an EEIO-computed inventory. **Acceptance:** every category emission traces to an activity × EF tool computation with its EXIOBASE source; the WACI matches the engine; an SBTi target cites the real trajectory and coverage.