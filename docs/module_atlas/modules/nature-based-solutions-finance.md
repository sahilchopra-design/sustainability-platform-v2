# Nature-Based Solutions Project Finance
**Module ID:** `nature-based-solutions-finance` · **Route:** `/nature-based-solutions-finance` · **Tier:** A (backend vertical) · **EP code:** EP-DX4 · **Sprint:** DX

## 1 · Overview
NbS project finance covering REDD+, reforestation, blue carbon, and peatland restoration. Models carbon credit revenue, biodiversity and watershed co-benefit valuation, ICROA and Verra VCS standard compliance, and NbS blended finance structures.

> **Business value:** Provides integrated NbS project finance modelling combining carbon, biodiversity, and ecosystem service revenues with rigorous VCS/ICROA compliance, enabling impact investor decision-making.

**How an analyst works this module:**
- Define NbS project type and establish baseline carbon stock and ecosystem service inventory
- Model carbon credit issuance schedule accounting for leakage (10-30%), permanence buffer (10-20%), and vintage timing
- Value co-benefits using TEEB shadow prices, biodiversity credit prices, and ecosystem service payment data
- Structure blended finance (grant + concessional + impact investment) and compute project IRR sensitivity

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLE6_PIPELINE`, `COBENEFIT_CATEGORIES`, `FI_STRUCTURES`, `NBS_TYPES`, `VCU_BENCHMARKS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NBS_TYPES` | 7 | `label`, `icon`, `biome`, `minHa`, `avgCostHa`, `cobenefitScore`, `permanenceRisk`, `additionality`, `vcuYield`, `priceRange`, `sdgCount`, `biodiversityScore`, `waterBenefit`, `article6Eligible`, `corsia`, `verra`, `gs`, `desc` |
| `COBENEFIT_CATEGORIES` | 6 | `label`, `weight`, `premiumBps`, `frameworks` |
| `VCU_BENCHMARKS` | 9 | `type`, `avgPrice`, `vol2023`, `vol2024e`, `trend`, `qualityScore` |
| `ARTICLE6_PIPELINE` | 7 | `type`, `ha`, `coDeveloper`, `status`, `priceUsd`, `volume`, `sdgSector` |
| `FI_STRUCTURES` | 7 | `minSizeMusd`, `typicalTenor`, `coupon`, `fitFor`, `blended`, `returnTarget`, `liquidityScore` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDevCost` | `projectHa * devCostHa;` |
| `annVcus` | `projectHa * vcuYield;` |
| `annPermanenceBuffer` | `annVcus * (permanenceBuffer / 100);` |
| `netAnnVcus` | `annVcus - annPermanenceBuffer;` |
| `cobenPrem` | `vcuPrice * (cobenefitPremPct / 100);` |
| `effectivePrice` | `vcuPrice + cobenPrem;` |
| `annRevenue` | `netAnnVcus * effectivePrice;` |
| `annOpex` | `projectHa * annOpexHa;` |
| `annEbitda` | `annRevenue - annOpex;` |
| `annCapexAmort` | `totalDevCost / projectLifeYr;` |
| `discFactor` | `wacc / 100;` |
| `lcoc` | `totalDevCost > 0 ? (totalDevCost * (discFactor / (1 - Math.pow(1 + discFactor, -projectLifeYr))) + annOpex) / Math.max(1, netAnnVcus) : 0;` |
| `dynamicCobenPrem` | `useMemo(() => calcCobenefitPremium(selCobenefits), [selCobenefits]);  // Sensitivity: VCU price range const priceSensData = useMemo(() => [6, 8, 10, 12, 15, 18, 22, 28, 35, 45].map(p => { const r = calcNbsFinancing({ projectHa, nbsType: selNbsType, vcuYield: nbsType.vcuYield, vcuPrice: p, cobenefitPremPct: cobenPremPct, projectLifeYr: pro` |
| `cobenValData` | `useMemo(() => NBS_TYPES.map(t => ({` |
| `art6Data` | `useMemo(() => ARTICLE6_PIPELINE.map(p => ({` |
| `costY` | `y === 0 ? finResult.totalDevCostM : finResult.totalDevCostM / projectLife * 0.04 * projectHa / 1e6 * projectHa / 1e6;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/nature-based-solutions/iucn-assessment` | `iucn_assessment` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/redd-plus` | `redd_plus` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/blue-carbon` | `blue_carbon` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/soil-carbon` | `soil_carbon` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/arr-assessment` | `arr_assessment` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/afolu-balance` | `afolu_balance` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/credit-quality` | `credit_quality` | api/v1/routes/nature_based_solutions.py |
| POST | `/api/v1/nature-based-solutions/sequestration-timeseries` | `sequestration_timeseries` | api/v1/routes/nature_based_solutions.py |
| GET | `/api/v1/nature-based-solutions/ref/ecosystem-types` | `ref_ecosystem_types` | api/v1/routes/nature_based_solutions.py |
| GET | `/api/v1/nature-based-solutions/ref/methodologies` | `ref_methodologies` | api/v1/routes/nature_based_solutions.py |

### 2.3 Engine `nature_based_solutions_engine` (services/nature_based_solutions_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `NatureBasedSolutionsEngine.assess_iucn_gs` | entity_id, criteria_scores | IUCN GS v2.0 — 8 criteria, each scored 0-100. Returns composite score, tier, and ICVCM compatibility flag. Only the criteria scores actually supplied by the caller are used; missing criteria are reported as null rather than fabricated. If fewer than all 8 criteria are provided the assessment is marked incomplete and tier/compatibility are returned as null (insufficient data). |
| `NatureBasedSolutionsEngine.assess_redd_plus` | entity_id, area_ha, reference_level_tco2_pa, actual_emissions_tco2_pa, jurisdictional, leakage_belt_pct, buffer_pool_pct | VCS VM0007 REDD+ avoided deforestation methodology. Returns net credits after leakage belt and buffer pool deductions. ``leakage_belt_pct`` and ``buffer_pool_pct`` are project-specific deductions from the VCS monitoring report / AFOLU Non-Permanence Risk Tool. When not supplied, conservative documented methodology defaults are applied and flagged via ``deductions_estimated``. |
| `NatureBasedSolutionsEngine.assess_blue_carbon` | entity_id, ecosystem_type, area_ha, tidal_hydrology_restored, co_benefit_score | Blue carbon accounting for coastal/marine ecosystems. Methodology: VM0033 (mangrove/saltmarsh) or VM0024 (seagrass/tidal_flat). ``tidal_hydrology_restored`` (project design attribute) and ``co_benefit_score`` (0-100, from a co-benefit assessment) are project-specific inputs; when not supplied they are reported as null rather than fabricated. |
| `NatureBasedSolutionsEngine.assess_soil_carbon` | entity_id, area_ha, land_use_change, ipcc_tier | IPCC Tier 1-3 soil organic carbon methodology. Higher tiers = lower uncertainty + higher sequestration rates. |
| `NatureBasedSolutionsEngine.assess_arr` | entity_id, area_ha, species_type, above_ground_rate_tco2_ha_pa, co_benefit_score | ARR carbon accounting: above-ground, below-ground, soil. Species type (native/mixed/exotic) affects buffer and co-benefit context. ``above_ground_rate_tco2_ha_pa`` is the site-specific AGB accumulation rate (from a MAI/yield table); when not supplied a documented IPCC 2006 GL default for the species class is used and flagged via ``above_ground_rate_estimated``. ``co_benefit_score`` (0-100) is a pr |
| `NatureBasedSolutionsEngine.compute_afolu_balance` | entity_id, sequestration_tco2_pa, land_area_ha | AFOLU (Agriculture, Forestry & Other Land Use) net GHG accounting. Includes N2O and CH4 non-CO2 emissions per IPCC EFs. |
| `NatureBasedSolutionsEngine.assess_credit_quality` | entity_id, iucn_score, redd_net_credits, co_benefits | Credit quality rating combining IUCN score, co-benefits, and volume. Derives ICVCM CCP-compatible rating and USD price range. Co-benefit sub-scores (biodiversity/water/livelihoods, 0-100) are taken only from the caller-supplied ``co_benefits`` mapping; dimensions that are absent are reported as null and excluded from the average rather than fabricated. If no co-benefit dimensions are supplied the  |
| `NatureBasedSolutionsEngine.project_sequestration_timeseries` | entity_id, annual_seq_tco2, project_years, annual_variation_pct | Project-level sequestration projection with a deterministic ramp-up capacity curve (VCS crediting-period convention: reduced early establishment yield, full yield once the stand matures). The projection is deterministic: no synthetic noise is injected. An optional ``annual_variation_pct`` list (one signed fraction per year, e.g. from a monitoring record or a calibrated scenario) can be supplied to |

**Engine `nature_based_solutions_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `IUCN_CRITERIA` | `['Effectiveness', 'Additionality', 'Inclusivity & Equity', 'No Net Loss to Biodiversity', 'Mitigation of trade-offs', 'Adaptive Management', 'Sustainability & Scalability', 'Governance']` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ARTICLE6_PIPELINE`, `COBENEFIT_CATEGORIES`, `FI_STRUCTURES`, `NBS_TYPES`, `VCU_BENCHMARKS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Credit Revenue | `Net credits issued × carbon price × (1 - buffer contribution)` | Verra VCS project documentation | Dependent on verified emissions reductions; REDD+ typically 0.5-5 tCO2/ha/yr net of leakage and buffer |
| Biodiversity Co-benefit Premium | `Price premium for CCB-certified vs standard VCS credits` | Ecosystem Marketplace data | CCB (Climate, Community & Biodiversity) certification adds $2-8/credit; biodiversity credits (BioCarbon) separate market |
| Ecosystem Service Value | `Watershed protection + pollination + flood regulation services valued at shadow prices` | TEEB / Natural Capital Project | Co-benefits critical for blended finance from impact investors; watershed services often fundable via water utility payments |
- **Verra VCS project database** → Issued credits, buffer contributions, methodology details → carbon revenue model → **Project-level carbon revenue schedule**
- **Ecosystem Marketplace transaction data** → Historical NbS credit prices by certification type → revenue assumptions → **Price deck and premium analysis**
- **Natural Capital Project / TEEB valuations** → Ecosystem service shadow prices by habitat type → co-benefit monetisation → **Total economic value and blended finance attractiveness**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/nature-based-solutions/ref/ecosystem-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ecosystems', 'source'], 'n_keys': 2}`

**GET /api/v1/nature-based-solutions/ref/methodologies** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['methodologies', 'certification_schemes', 'icvcm_ccp_standard'], 'n_keys': 3}`

**POST /api/v1/nature-based-solutions/afolu-balance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/arr-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/blue-carbon** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/credit-quality** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/iucn-assessment** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/nature-based-solutions/redd-plus** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** NbS Financial Modelling
**Headline formula:** `NbS IRR = f(Carbon Revenue + Ecosystem Service Revenue - CAPEX - OPEX - Buffer Contribution); Carbon Revenue = Credits × Price × (1 - Buffer%)`

Integrated financial model combining carbon credit revenue, biodiversity credit income, and ecosystem service payments against project costs and buffer requirements

**Standards:** ['Verra VCS REDD+ Methodology VM0007', 'SBTN Guidance on Nature Targets', 'TNFD v1.0 Framework']
**Reference documents:** Verra (2022) VCS REDD+ Methodology VM0007 v1.6; ICROA (2023) Code of Best Practice — NbS Quality Criteria; SBTN (2023) Step-by-Step Guide for Business — Science Based Targets for Nature; TNFD (2023) Recommendations v1.0 — Nature-related Financial Disclosures

**Engine `nature_based_solutions_engine` — extracted transformation lines:**
```python
composite = round(sum(supplied) / criteria_supplied, 2)
avoided_deforestation = reference_level_tco2_pa - actual_emissions_tco2_pa
net_credits = avoided_deforestation * (1 - leakage / 100) * (1 - buffer / 100)
per_ha = round(net_credits / area_ha, 2) if area_ha > 0 else 0.0
total_seq = round(area_ha * seq_rate, 2)
net_credits = round(total_seq * (1 - buffer_pct / 100), 2)
total_tco2_pa = round(area_ha * delta, 2)
lower_bound = round(total_tco2_pa * (1 - uncertainty_pct / 100), 2)
upper_bound = round(total_tco2_pa * (1 + uncertainty_pct / 100), 2)
above_ground = round(area_ha * above_ground_rate, 2)
below_ground = round(above_ground * 0.26, 2)  # IPCC root-to-shoot ratio
soil_carbon = round(area_ha * 0.5, 2)
total = round(above_ground + below_ground + soil_carbon, 2)
net_credits = round(total * (1 - buffer_pct / 100), 2)
n2o_emissions = round(land_area_ha * 0.018, 4)  # tCO2e/ha (soil N2O)
ch4_emissions = round(land_area_ha * 0.008, 4)  # tCO2e/ha (wetland CH4)
total_non_co2 = n2o_emissions + ch4_emissions
net_balance = round(sequestration_tco2_pa - total_non_co2, 4)
afolu_ratio = round(sequestration_tco2_pa / total_non_co2, 2) if total_non_co2 > 0 else 999.0
base_price = 8.0 + (overall_quality - 40.0) / 60.0 * 27.0 if overall_quality > 40 else 8.0
variation = float(annual_variation_pct[year - 1])
raw_seq = annual_seq_tco2 * capacity * (1 + variation)
emissions_tco2e = round(raw_seq * 0.03, 4)
net_balance = round(raw_seq - emissions_tco2e, 4)
buffer_contribution = round(raw_seq * 0.10, 4)
credits_issued = round(net_balance * 0.90, 4)
reversal_risk_flag = year <= 3 or (variation_supplied and variation < -0.04)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry lists `trace_labels` pointing at
> `POST /api/v1/nature-based-solutions/*` endpoints (AFOLU balance, ARR, blue carbon, credit
> quality, IUCN assessment, REDD+) backed by a genuinely rigorous Python engine
> (`backend/services/nature_based_solutions_engine.py`, VCS VM0007/VM0033/VM0024, IUCN GS v2.0,
> IPCC Tier 1–3 soil carbon). **The frontend page never calls that API** — no `fetch`/`axios` call
> exists anywhere in `NatureBasedSolutionsFinancePage.jsx`. All ten tabs run on client-side
> constants and a self-contained JS project-finance engine (`calcNbsFinancing`). The backend
> engine's honest "insufficient_data" null-handling and documented default sourcing therefore never
> reach this UI; the sections below document what the page actually computes and displays.

### 7.1 What the module computes

The **Project Finance Engine** tab (Tab 1) is the only tab with a real numeric model; the other
nine tabs (Overview, VCU Market Intelligence, Co-Benefit Valuation, Article 6.4 Pipeline, FI
Structuring, Risk Framework, Price Sensitivity, Portfolio Construction, Market Outlook) render
static market tables/constants with no computation. The finance engine (`calcNbsFinancing`) runs a
standard project-finance waterfall for one of six NbS archetypes (REDD+, A/R, IFM, Blue Carbon,
Peatland, Grassland):

```
totalDevCost   = projectHa × devCostHa                    (devCostHa = archetype avgCostHa)
annVcus        = projectHa × vcuYield                      (archetype-specific t/ha/yr)
annPermBuffer  = annVcus × permanenceBuffer%
netAnnVcus     = annVcus − annPermBuffer
cobenPrem      = vcuPrice × cobenefitPremPct%
effectivePrice = vcuPrice + cobenPrem
annRevenue     = netAnnVcus × effectivePrice
annOpex        = projectHa × annOpexHa                     (annOpexHa = devCostHa × 0.04)
annEbitda      = annRevenue − annOpex
NPV            = −totalDevCost + Σ_{y=1..life} annEbitda / (1+WACC)^y
IRR            = Newton-Raphson root of Σ CFₜ/(1+r)^t = 0, 200 iterations, seed r₀=12%
LCOC           = (totalDevCost × CRF + annOpex) / max(1, netAnnVcus)
CRF (capital recovery factor) = WACC / (1 − (1+WACC)^−life)
breakEvenPrice = (annOpex + totalDevCost/life) / max(1, netAnnVcus)
```

### 7.2 Parameterisation — archetype constants (`NBS_TYPES`, provenance: page-embedded demo data)

| Archetype | avgCostHa ($) | vcuYield (t/ha/yr) | Price range ($/t) | Permanence risk | Article 6.4 |
|---|---|---|---|---|---|
| REDD+ | 3.2 | 12 | 8–18 | Medium | ✓ |
| Afforestation/Reforestation (A/R) | 1,200 | 8 | 12–28 | Low | ✓ |
| Improved Forest Mgmt (IFM) | 450 | 5 | 10–22 | Low | — |
| Blue Carbon | 2,800 | 15 | 18–45 | Medium | ✓ |
| Peatland Restoration | 1,800 | 18 | 14–32 | Low | ✓ |
| Grassland/Savanna | 180 | 4 | 5–14 | Medium | — |

These per-hectare cost and yield figures are plausible orders-of-magnitude for each project type
(REDD+'s near-zero `avgCostHa` reflects that avoided-deforestation projects mainly pay for
monitoring, not planting) but are **round demo numbers, not sourced from a specific project
database** — no citation is attached in code. `annOpexHa = devCostHa × 4%` is a single hard-coded
opex ratio applied uniformly across all six archetypes regardless of labour intensity.

Co-benefit premium (`COBENEFIT_CATEGORIES`, `calcCobenefitPremium`): a weighted average of five
category premiums (biodiversity 30%/35bps, water 22%/22bps, community 25%/28bps, food 13%/15bps,
climate 10%/12bps) selected via checkbox, `weightedPrem/totalWeight` — this yields the *average*
bps of the checked categories, not a sum, so premium does not simply grow with more boxes checked
if their weights differ.

### 7.3 Calculation walkthrough

1. User selects an NbS archetype (fixes `devCostHa`, `vcuYield`) and six sliders (area, VCU price,
   co-benefit premium %, project life, WACC, permanence buffer %).
2. `calcNbsFinancing` derives net annual VCUs after the permanence-buffer haircut, applies the
   co-benefit price premium to get an effective $/t, and computes revenue, opex, EBITDA.
3. NPV discounts a flat annual EBITDA annuity at WACC over the project life (constant cash flow
   assumption — no ramp-up years, unlike the backend engine's 5/10-year capacity-factor curve).
4. IRR solves the same flat-annuity cash-flow stream by Newton-Raphson.
5. LCOC and break-even price both normalise total cost to net annual VCU volume; comparing them to
   the effective/current price drives the "✓ Attractive / ~ Marginal / ✗ Sub-threshold" verdict in
   the Price Sensitivity table (`irr ≥ wacc+3` / `irr ≥ wacc` / else).
6. The Price Sensitivity tab (Tab 7) re-runs `calcNbsFinancing` at ten fixed VCU price points
   (6,8,10,12,15,18,22,28,35,45) to build the NPV/IRR sensitivity curves.

### 7.4 Worked example — Afforestation & Reforestation (A/R), default sliders

Inputs: `projectHa=50,000`, `vcuPrice=$12`, `cobenPremPct=20%`, `projectLife=30yr`, `WACC=11%`,
`permanenceBuffer=15%`; A/R archetype: `devCostHa=$1,200`, `vcuYield=8 t/ha/yr`,
`annOpexHa = 1,200×0.04 = $48/ha`.

| Step | Computation | Result |
|---|---|---|
| Total dev cost | 50,000 × $1,200 | **$60.0M** |
| Ann. VCUs (gross) | 50,000 × 8 | 400,000 t |
| Permanence buffer | 400,000 × 15% | 60,000 t |
| Net ann. VCUs | 400,000 − 60,000 | **340,000 t** |
| Effective price | $12 + ($12 × 20%) | **$14.40/t** |
| Ann. revenue | 340,000 × $14.40 | **$4.896M** |
| Ann. opex | 50,000 × $48 | $2.40M |
| Ann. EBITDA | $4.896M − $2.40M | **$2.496M** |
| CRF (30yr, 11%) | 0.11 / (1 − 1.11⁻³⁰) | 0.11504 |
| LCOC | ($60M×0.11504 + $2.40M) / 340,000 | **$27.36/t** |
| Break-even price | ($2.40M + $60M/30) / 340,000 | **$12.94/t** |
| NPV | −$60M + $2.496M × annuity-factor(30,11%≈8.694) | **≈ −$38.3M** |
| IRR | root where annuity-factor(30,r)=60M/2.496M≈24.0 | **≈1.5%** |

At these defaults the project is **value-destructive**: LCOC ($27.36/t) exceeds the effective
price ($14.40/t), IRR (≈1.5%) is far below the 11% WACC hurdle, and NPV is deeply negative —
the page would flag this row "✗ Sub-threshold" in the sensitivity table. This is a real artefact of
the engine's formulas, not a display bug: A/R's much higher `devCostHa` ($1,200 vs REDD+'s $3.2)
overwhelms its VCU revenue at the $12 base price, correctly illustrating why REDD+ dominates VCM
volume while A/R only clears the hurdle at materially higher carbon prices (~$25+/t, visible on the
Price Sensitivity curve).

### 7.5 Companion analytics on the page

- **VCU Market Intelligence** — static `VCU_BENCHMARKS` table (8 standard/type combinations,
  avg price $11.2–$38.4, volumes, `qualityScore` 72–97) — demo figures styled after Ecosystem
  Marketplace reporting conventions, not a live feed.
- **Article 6.4 Pipeline** — 6 seeded sovereign ITMO projects (Brazil, Indonesia, Kenya, Vietnam,
  Colombia, Ghana) with static `priceUsd`/`volume`; `art6Data.valueM = volume × priceUsd`.
- **FI Structuring** — 6 static financing-structure templates (green bond, VCF, blended finance,
  nature performance bond, ERPA, NCS-ABS) with illustrative tenor/coupon/liquidity fields.
- **Risk Framework** — qualitative permanence/additionality/MRV risk register, no scoring formula.

### 7.6 Data provenance & limitations

- Every numeric constant in this page — archetype costs/yields, VCU benchmark prices, Article 6.4
  volumes, market-outlook projections — is **hand-entered demo data with no `sr()` PRNG and no API
  call**; nothing here is derived from the reference-data layer or the real backend engine.
- The real methodology (VCS VM0007 leakage/buffer deductions, VM0033/VM0024 blue-carbon rates,
  IUCN GS v2.0 8-criteria scoring, IPCC Tier 1–3 soil carbon, ICVCM CCP-compatible quality/pricing)
  lives entirely in `backend/services/nature_based_solutions_engine.py` and is **not reachable from
  this page** — it appears to serve a different, unlinked route or an API consumer this UI doesn't
  use.
- The finance engine assumes flat, non-ramping annual EBITDA for the full project life — no
  establishment-year yield curve (the backend engine's 60%/85%/100% capacity ramp for years 1–5,
  6–10, 11+ is the more realistic pattern and is absent here).
- IRR uses unbounded Newton-Raphson (200 iterations, no clamp) — can diverge or return
  economically meaningless values for extreme parameter combinations (e.g., very low revenue vs.
  large upfront cost), though no evidence of this was observed in tested ranges.

**Framework alignment:** IUCN Global Standard for NbS v2.0 (referenced by name in the disconnected
backend engine, not implemented here) · Verra VCS methodologies (VM0007 REDD+, VM0033/VM0024 blue
carbon) named throughout the guide/backend but not executed in the UI · Article 6.4 Paris Agreement
mechanism (ITMO, corresponding adjustment, share of proceeds) — descriptive only, no CA
verification logic · CCB Standards / Gold Standard SDG co-benefit certification — named in
static tables, not scored.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the rigorous backend engine into the UI's finance waterfall (analytics ladder: rung 2 → 3)

**What.** §7's mismatch flag: the backend (`nature_based_solutions_engine.py` — VCS VM0007/VM0033/VM0024 implementations, IUCN GS v2.0 assessment, IPCC Tier 1–3 soil carbon, honest "insufficient_data" null handling) is never called; no `fetch` exists in `NatureBasedSolutionsFinancePage.jsx`. The page runs its own simplified client-side `calcNbsFinancing` waterfall on archetype averages, and nine of ten tabs are static tables. Evolution A connects the two so credit volumes in the finance model come from methodology-grade calculations, then benchmarks prices against real VCU data.

**How.** (1) Replace the archetype `annVcus = projectHa × vcuYield` shortcut with engine calls — `POST /redd-plus` (which computes `net_credits = avoided_deforestation × (1−leakage)(1−buffer)` per §5's extracted lines), `/blue-carbon`, `/arr-assessment`, `/soil-carbon` — feeding `netAnnVcus` into the existing NPV/IRR waterfall; the two reference GETs (`/ref/ecosystem-types`, `/ref/methodologies`, both `passed` in the lineage sweep) populate the archetype selector. (2) Add the sequestration ramp from `/sequestration-timeseries` so revenue is year-varying instead of flat-annuity, materially changing REDD+ vs A/R IRR comparisons. (3) Replace the static `VCU_BENCHMARKS` tab with periodically refreshed public price indications (e.g. Verra issuance-weighted category medians), dated and sourced.

**Prerequisites.** The eight POST endpoints need auth-passing verification (REQUIRE_AUTH currently blocks POSTs platform-wide); UI must render the engine's `insufficient_data` nulls honestly rather than defaulting. **Acceptance:** changing leakage/buffer inputs flows through the engine to a different IRR; page results match direct API calls exactly.

### 9.2 Evolution B — Project-screening analyst across the 8 assessment tools (LLM tier 2)

**What.** This module's backend is unusually tool-rich: eight typed POST endpoints covering IUCN assessment, REDD+, blue carbon, soil carbon, ARR, AFOLU balance, credit quality, and sequestration time series. Evolution B composes them into a screening analyst: "assess this 15,000 ha Indonesian peatland project — IUCN criteria, credit volume under VM0007, quality score, and a 10-year revenue profile at $12 VCU" becomes an orchestrated sequence of those calls, synthesized into an investment-screen memo where every figure is a tool output.

**How.** Tool schemas from the module's OpenAPI operations (all Pydantic-typed already); system prompt from this Atlas page's §5/§7 including the engine's documented default-sourcing so the analyst explains which inputs were defaulted versus supplied. The multi-endpoint composition is the tier-2 differentiator: the analyst chains `iucn-assessment` → methodology-appropriate carbon endpoint → `credit-quality` → `sequestration-timeseries`, then runs the finance waterfall, presenting a "show work" trail of all calls (roadmap Tier-2 provenance UX). Fabrication validator matches memo numerics to tool responses.

**Prerequisites (hard).** Evolution A's wiring first — the copilot must drive the real engine, and the POST-auth blocker must be resolved. **Acceptance:** a generated screen memo's every number traces to a named endpoint call; requesting an assessment for an ecosystem type outside `/ref/ecosystem-types` yields a refusal listing supported types.