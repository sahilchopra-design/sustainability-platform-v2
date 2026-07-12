# Climate Stress Test Suite
**Module ID:** `climate-stress-test` · **Route:** `/climate-stress-test` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Implements NGFS and ECB climate stress testing frameworks to quantify transition and physical risk losses across credit, equity, and insurance portfolios under orderly, disorderly, and hot-house-world scenarios.

> **Business value:** Provides banks, insurers, and asset managers with a regulatory-grade climate stress testing suite aligned with NGFS, ECB, and Bank of England frameworks to support supervisory submissions and internal capital planning.

**How an analyst works this module:**
- Map portfolio exposures to NACE/NAICS sector codes for NGFS transition risk factor assignment
- Apply physical hazard overlays using NGFS climate scenarios and asset geolocation
- Compute scenario-conditional PD uplifts using regression on carbon price, energy cost, and physical damage paths
- Aggregate CSL by scenario, sector, and time horizon; calculate capital adequacy implications

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWERS`, `CET1_COMPONENTS`, `CET1_DATA`, `COUNTRIES`, `HAZARD_TYPES`, `IFRS9_STAGES`, `REG_TIMELINE`, `SCENARIO_DEFS`, `SECTORS`, `TABS`, `TabCET1Waterfall`, `TabECLOverlay`, `TabExportReporting`, `TabModelMethodology`, `TabPhysicalRisk`, `TabRegulatoryCompliance`, `TabScenarioConfig`, `TabScenarioSensitivity`, `TabSectorPDMigration`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIO_DEFS` | 25 | `id`, `key`, `label`, `category`, `color`, `temp`, `type`, `carbonPath` |
| `SECTORS` | 31 | `id`, `name`, `basePD`, `nace`, `nzMult`, `b2cMult`, `dnzMult`, `dtMult`, `ndcMult`, `cpMult`, `transRisk`, `physRisk`, `carbonIntensity`, `ebitdaImpact`, `regulatory` |
| `CET1_COMPONENTS` | 9 | `id`, `label`, `isBase` |
| `HAZARD_TYPES` | 9 | `id`, `label`, `type`, `icon`, `rcp45_2050`, `rcp85_2050`, `description` |
| `IFRS9_STAGES` | 4 | `stage`, `label`, `description`, `eclMethod`, `trigger` |
| `REG_TIMELINE` | 13 | `regulator`, `jurisdiction`, `exercise`, `scenarios`, `frequency`, `deadline`, `status`, `mandatory` |
| `TABS` | 10 | `key`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,seed)=>arr[Math.floor(sr(seed)*arr.length)];` |
| `rng` | `(min,max,seed)=>+(min+sr(seed)*(max-min)).toFixed(2);` |
| `rngInt` | `(min,max,seed)=>Math.floor(min+sr(seed)*(max-min+1));` |
| `fmt` | `(v,d=1)=>typeof v==='number'?v.toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d}):'-';` |
| `fmtPct` | `(v)=>fmt(v,2)+'%';` |
| `fmtBps` | `(v)=>(v*100).toFixed(0)+' bps';` |
| `fmtM` | `(v)=>'EUR '+fmt(v,1)+'M';` |
| `sIdx` | `Math.floor(sr(i * 7) * 30);` |
| `country` | `pick(COUNTRIES, i * 3 + 1);` |
| `exposure` | `rng(20, 500, i * 5 + 2);` |
| `base` | `s.basePD + sr(i * 11) * 0.8 - 0.4;` |
| `bpd` | `Math.max(0.15, rng(base * 0.8, base * 1.2, i * 13));` |
| `lgd` | `rng(25, 65, i * 17);` |
| `maturity` | `rngInt(1, 15, i * 19);` |
| `carbonPathData` | `useMemo(() => YEARS.map(y => {` |
| `gdpPathData` | `useMemo(() => YEARS.map(y => {` |
| `multKey` | `scenarioKey + 'Mult';` |
| `sectorData` | `useMemo(()=>SECTORS.map(s=>{` |
| `stressed` | `rng(s.basePD * s[multKey] * 0.95, s.basePD * s[multKey] * 1.05, s.id * 101 + scenarioKey.charCodeAt(0));` |
| `pdChange` | `stressed - s.basePD;` |
| `pdChangePct` | `(pdChange / s.basePD) * 100;` |
| `borrowerData` | `useMemo(()=>{ const key = scenarioKey + 'StressedPD';` |
| `closing` | `cet1.opening + cet1.credit_trans + cet1.credit_phys + cet1.market_risk + cet1.op_risk + cet1.nii_impact + cet1.green_benefit;` |
| `closingCET1` | `waterfallData.length>0?waterfallData[waterfallData.length-1].value:0;` |
| `totalImpact` | `closingCET1 - (cet1?.opening\|\|0);` |
| `allScenariosData` | `SCENARIO_DEFS.map(s=>{` |
| `hazardData` | `useMemo(()=>HAZARD_TYPES.map(h=>{` |
| `scale` | `(timeHorizon - 2025) / 25;` |
| `borrowerPhysRisk` | `useMemo(()=>BORROWERS.slice(0,30).map((b,i)=>{` |
| `hazardExposures` | `HAZARD_TYPES.map(h=>{` |
| `totalPhysRisk` | `hazardExposures.reduce((s,h)=>s+h.exposure,0);` |
| `totalLoss` | `rng(50,800,h.id.charCodeAt(0)*500);` |
| `insuredLoss` | `totalLoss * rng(0.2,0.7,h.id.charCodeAt(0)*503);` |
| `gap` | `totalLoss - insuredLoss;` |
| `gapPct` | `gap/totalLoss*100;` |
| `eclData` | `useMemo(()=>{ return borrowers.map((b,i)=>{ const stressedPDKey = scenarioKey+'StressedPD';` |
| `stressedPD` | `b[stressedPDKey] \|\| b.basePD * 1.5;` |
| `baseECL` | `b.basePD / 100 * b.lgd / 100 * b.exposure;` |
| `transOverlay` | `(stressedPD - b.basePD) / 100 * b.lgd / 100 * b.exposure * 0.6;` |
| `physOverlay` | `b.physRisk / 10 * b.exposure * rng(0.002, 0.015, i * 301);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-stress-test/bcbs-517` | `bcbs_517` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/boe-cbes` | `boe_cbes` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/ecb-cst` | `ecb_cst` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/apra-clt` | `apra_clt` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/cross-framework` | `cross_framework` | api/v1/routes/climate_stress_test.py |
| POST | `/api/v1/climate-stress-test/portfolio-resilience` | `portfolio_resilience` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/frameworks` | `ref_frameworks` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/climate_stress_test.py |
| GET | `/api/v1/climate-stress-test/ref/damage-functions` | `ref_damage_functions` | api/v1/routes/climate_stress_test.py |

### 2.3 Engine `climate_stress_test_engine` (services/climate_stress_test_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_scenario_multiplier` | scenario, scenario_type_key | Map NGFS scenario to a loss intensity multiplier. |
| `ClimateStressTestEngine.run_bcbs_517` | entity_id, institution_type, portfolio_sectors, total_assets_usd, cet1_ratio_pct, scenario |  |
| `ClimateStressTestEngine.run_boe_cbes` | entity_id, institution_type, uk_mortgage_exposure_pct, uk_corporate_exposure_pct, scenario |  |
| `ClimateStressTestEngine.run_ecb_cst` | entity_id, institution_type, eu_sector_exposures, total_rwa_usd, scenario |  |
| `ClimateStressTestEngine.run_apra_clt` | entity_id, institution_type, australian_exposure_pct, scenario |  |
| `ClimateStressTestEngine.run_cross_framework` | entity_id, institution_type, portfolio_sectors, total_assets_usd, cet1_pct, scenario |  |
| `ClimateStressTestEngine.assess_portfolio_resilience` | entity_id, portfolios |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CET1_COMPONENTS`, `COUNTRIES`, `HAZARD_TYPES`, `IFRS9_STAGES`, `REG_TIMELINE`, `SCENARIO_DEFS`, `SECTORS`, `TABS`, `YEARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| NGFS Scenarios Implemented | — | NGFS 2023 | Full set of NGFS Phase IV scenarios: Orderly (Below 2°C, Net Zero 2050), Disorderly (Divergent Net Zero, Delayed Transition), Hot House World (Nationally Determined, Current Policies). |
| ECB Aggregate Credit Loss (adverse) | — | ECB 2021 | Range of climate stress credit losses as percentage of risk-weighted assets in ECB's economy-wide climate stress test. |
- **Portfolio credit data, NGFS scenario variable paths, physical hazard maps, sector carbon intensity** → PD uplift modelling, physical risk overlay, loss aggregation by scenario and horizon → **Stress loss tables, capital impact analysis, sector vulnerability heat maps**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-stress-test/ref/damage-functions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['physical_hazard_damage_functions', 'sector_transition_sensitivity', 'total_hazards', 'total_sectors'], 'n_keys': 4}`

**GET /api/v1/climate-stress-test/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'capital_adequacy_floors', 'total_frameworks'], 'n_keys': 3}`

**GET /api/v1/climate-stress-test/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenarios', 'by_type', 'total'], 'n_keys': 3}`

**POST /api/v1/climate-stress-test/apra-clt** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-stress-test/bcbs-517** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-stress-test/boe-cbes** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-stress-test/cross-framework** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-stress-test/ecb-cst** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Stress Loss
**Headline formula:** `CSL = Σᵢ EADᵢ × PDᵢ(Δscenario) × LGDᵢ`

Aggregates exposure-at-default weighted by scenario-conditional probability of default and loss given default across all obligors.

**Standards:** ['NGFS Climate Scenarios 2022', 'ECB Economy-Wide Climate Stress Test 2021']
**Reference documents:** NGFS Climate Scenarios for Central Banks and Supervisors Phase IV 2023; ECB Economy-Wide Climate Stress Test Methodology 2021; Bank of England CBES 2021; EBA Discussion Paper on Climate Stress Testing 2021

**Engine `climate_stress_test_engine` — extracted transformation lines:**
```python
credit_loss_pct = round(max(0, min(30, base_credit * weighted_credit * scen_mult * 100)), 2)
market_loss_pct = round(max(0, min(20, base_market * weighted_market * scen_mult * 100)), 2)
operational_loss_pct = round(max(0, min(10, base_op * weighted_op * scen_mult * 100)), 2)
total_loss_pct = round(credit_loss_pct + market_loss_pct + operational_loss_pct + physical_loss_pct, 2)
climate_var_pct = round(total_loss_pct * 1.15, 2)
cet1_post = round(cet1_ratio_pct - total_loss_pct, 2)
bcbs_compliance_score = round(max(30, min(100, 70 - scen_mult * 10)), 2)
cet1_impact_ppts = round(physical_loss_pct + transition_loss_pct * 0.6, 2)
taxonomy_alignment_pct = round(min(100, green_exposure * 100), 2)
pillar2_add_on = round(max(0, cet1_impact_ppts - 2.0), 2)
au_factor = max(0, min(2, australian_exposure_pct / 50))
liquidity_impact_pct = round(max(0, min(15, capital_impact_ppts * 2.5)), 2)
ecb = self.run_ecb_cst(entity_id, institution_type, portfolio_sectors, total_assets_usd * 0.4, scenario)
aggregated_capital_impact = round(sum(losses.values()) / len(losses), 2)
resilience_score = round(max(0, min(100, 100 - aggregated_capital_impact * 5)), 2)
weighted = wsum / tot if tot > 0 else 0.0
avg_loss = round(sum(losses) / len(losses), 2)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_stress_test_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-stress-test-suite` | engine:climate_stress_test_engine |

## 7 · Methodology Deep Dive

This is one of the more faithful modules: it implements a **multi-scenario, sector-conditioned PD stress
with an IFRS-9 ECL overlay and a CET1 capital waterfall** — genuinely the guide's
`CSL = Σ EAD·PD(Δscenario)·LGD` shape. The multipliers and hazard tables are curated demo values, and the
borrower book is `sr()`-seeded, but the calculation structure (transition PD multiplier × physical overlay,
ECL trans/phys decomposition, CET1 bridge) is real supervisory-style stress logic.

### 7.1 What the module computes

Sector-level PD stress (25 scenarios, 31 sectors):
```js
stressed = rng(basePD·mult·0.95, basePD·mult·1.05, seed)   // mult = s[scenarioKey+'Mult']
pdChange = stressed − basePD ;  pdChangePct = pdChange/basePD·100
```
IFRS-9 ECL overlay (per borrower):
```js
baseECL     = basePD/100 · lgd/100 · exposure
transOverlay = (stressedPD − basePD)/100 · lgd/100 · exposure · 0.6   // 60% of PD delta → transition ECL
physOverlay  = physRisk/10 · exposure · rng(0.002, 0.015, seed)        // physical damage overlay
```
CET1 capital waterfall (bridge from opening to closing capital):
```js
closing = opening + credit_trans + credit_phys + market_risk + op_risk + nii_impact + green_benefit
totalImpact = closingCET1 − opening
```
Physical-risk tab aggregates hazard exposures scaled by `scale = (timeHorizon−2025)/25` and an
insurance-gap block (`gap = totalLoss − insuredLoss`).

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `SECTORS` (31): basePD, nace, 6 scenario mults (nz/b2c/dnz/dt/ndc/cp), transRisk, physRisk, carbonIntensity | seed schema | curated (NACE-mapped, NGFS-scenario multipliers) |
| `SCENARIO_DEFS` (25): temp, carbonPath | seed schema | NGFS/ECB/BoE/APRA scenario set |
| Transition ECL weight | fixed `0.6` | heuristic (60% of PD delta is transition) |
| Physical overlay rate | `rng(0.002, 0.015)` | heuristic damage-rate band |
| CET1 components (9) | seed schema | supervisory capital-bridge structure |
| `HAZARD_TYPES` (9): rcp45_2050, rcp85_2050 | seed schema | RCP-scenario hazard intensities |

### 7.3 Calculation walkthrough

Borrower book seeded (country/exposure/basePD/lgd/maturity) → scenario selection sets `multKey` →
`sectorData` applies the sector multiplier ±5% noise → `borrowerData` writes `<scenario>StressedPD` fields →
`eclData` splits ECL into base + transition overlay (0.6×) + physical overlay → CET1 waterfall bridges
opening capital through credit/market/op/NII/green components to `closingCET1`; `totalImpact` is the capital
hit. `allScenariosData` runs the bridge across all scenarios for comparison.

### 7.4 Worked example

Borrower: `basePD = 2.0%`, `lgd = 45%`, `exposure = €200M`, `physRisk = 6`; sector multiplier under
Current Policies `cpMult = 1.6`, physical-overlay draw 0.010:

| Step | Computation | Result |
|---|---|---|
| Stressed PD | 2.0%·1.6 (±5%) | ≈ **3.2%** |
| Base ECL | 0.020·0.45·200 | **€1.80M** |
| Transition overlay | (0.032−0.020)·0.45·200·0.6 | **€0.648M** |
| Physical overlay | (6/10)·200·0.010 | **€1.20M** |
| Total climate ECL | 1.80 + 0.648 + 1.20 | **€3.65M** |
| ECL uplift | (3.65−1.80)/1.80 | **+103%** |

The physical overlay here rivals the transition overlay because `physRisk` is high — the module's two-channel
split lets a user see which driver dominates under each scenario.

### 7.5 Data provenance & limitations

- Borrower book is **synthetic** (`sr()` PRNG via `pick/rng/rngInt`); sector multipliers, hazard intensities
  and CET1 components are curated demo constants, not a bank's actual portfolio or ECB-published shocks.
- The transition/physical ECL split uses fixed heuristics (0.6 weight; 0.2–1.5% physical rate), not
  scenario-specific damage functions; PD is single-period, not a full lifetime term structure.
- CET1 waterfall components are stored/seeded magnitudes, not solved from the ECL and RWA changes.

**Framework alignment:** NGFS Phase IV scenario set (25 `SCENARIO_DEFS`) · ECB economy-wide climate stress
test (sector-multiplier design, 4–8% RWA loss context) · BoE CBES · IFRS 9 §5.5 ECL staging (`IFRS9_STAGES`
schema) · the eight `/apra-clt`, `/bcbs-517`, `/boe-cbes`, `/ecb-cst` endpoints map to real supervisory
exercises. NACE sector codes anchor transition-factor assignment as NGFS prescribes.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Regulatory-grade climate stress: scenario-conditioned lifetime ECL, capital
depletion and RWA migration for a credit book, for ECB/BoE/APRA submissions and ICAAP.

**8.2 Conceptual approach.** NGFS-macro → sector-PD transmission via a **satellite credit model** (ECB CST
methodology) with hazard-specific physical damage functions (NGFS physical module / CLIMADA), and a full
IFRS-9 lifetime ECL term structure — mirroring ECB economy-wide CST and BoE CBES bank models.

**8.3 Mathematical specification.**
```
PD_s,t = PD_base · exp( γ_sector · (ΔGDP_s,t) + δ_sector · ΔCarbonPrice_s,t )    (satellite regression)
PhysDamage_s,t = Σ_peril P(peril|scenario,t) · DamageFn_peril(assetExposure)
LGD_s,t = LGD_base + φ·PhysDamage (collateral impairment)
ECL_lifetime = Σ_t PD_marginal,s,t · LGD_s,t · EAD_t · DF_t
ΔCET1 = −(ΔECL + ΔRWA·capital_ratio − GreenBenefit)
```

| Parameter | Source |
|---|---|
| γ, δ sector elasticities | ECB CST satellite-model coefficients |
| Damage functions | NGFS physical module / CLIMADA / JRC |
| Scenario macro paths | NGFS Phase IV (GDP, carbon price, physical) |
| LGD collateral sensitivity φ | supervisory LGD stress guidance |

**8.4 Data requirements.** Loan-level EAD/PD/LGD/NACE/geocode; NGFS variable database (migration 088);
hazard maps. Free: NGFS, JRC; vendor: RMS physical.

**8.5 Validation & benchmarking.** Reconcile aggregate loss vs ECB 4–8% RWA; Euler check on capital bridge;
sector backtest vs historical downturn PDs; sensitivity on γ/δ.

**8.6 Limitations & model risk.** Satellite coefficients estimated on short samples; deep-uncertainty in
physical tails; second-round macro feedback omitted. Fallback: multiplier-on-PD (as currently coded) with
conservative ceilings when satellite regression is unavailable.

## 9 · Future Evolution

### 9.1 Evolution A — Real book, published shocks, lifetime ECL (analytics ladder: rung 2 → 3)

**What.** The stress structure is genuinely supervisory-shaped — 25 NGFS/ECB/BoE/APRA
scenarios × 31 NACE sectors, IFRS-9 ECL with transition/physical decomposition, CET1
waterfall — but §7.5 is clear about the three gaps: the borrower book is `sr()`-seeded,
the ECL split uses fixed heuristics (0.6 transition weight, 0.2–1.5% physical band)
rather than damage functions, and CET1 components are stored magnitudes, not solved
from ECL/RWA changes. Evolution A calibrates all three: run the stress on a real
portfolio, replace heuristic multipliers with published ECB CST parameters, and make
the capital bridge an output.

**How.** (1) Load obligors from `portfolios_pg` (the roadmap's D0 demo book) instead of
the seeded generator; NACE mapping already exists in `SECTORS`. (2) Source PD/LGD shock
paths from the `/ref/ngfs-scenarios` and `/ref/damage-functions` endpoints — the three
ref GETs already pass the lineage harness — so frontend multipliers and backend engine
stop diverging. (3) Replace the fixed 0.6/physical-band heuristics with the engine's
damage functions; extend single-period PD to a lifetime term structure for IFRS-9
staging. (4) Solve CET1 components from ECL and RWA deltas; pin one full scenario run
in `bench_quant.py`.

**Prerequisites.** The five POST endpoints (`/ecb-cst`, `/boe-cbes`, `/apra-clt`,
`/bcbs-517`, `/cross-framework`) show harness status `failed` — triage whether that is
payload-shape or a live bug before wiring the frontend to them; edits propagate to
`climate-stress-test-suite` via the shared `climate_stress_test_engine`.
**Acceptance:** frontend and `POST /ecb-cst` agree on sector CSL for the same book
within rounding; aggregate RWA loss lands in the ECB's published 4–8% context or the
deviation is explained in the payload.

### 9.2 Evolution B — Supervisory-submission analyst (LLM tier 2)

**What.** A tool-calling analyst for capital planners: "run Delayed Transition on the
lending book and draft the capital-adequacy narrative" executes
`POST /api/v1/climate-stress-test/ecb-cst` (and `/cross-framework` for multi-regulator
comparisons), then writes the submission-style commentary — CSL by sector, ECL staging
migration, CET1 bridge — with every figure sourced from the tool response. Follow-ups
("why is Basic Metals the worst sector?") answer from the sector-multiplier
decomposition the engine returns, citing the NGFS scenario definition used.

**How.** Tool schemas filtered from the module's 9 OpenAPI operations; the three ref
GETs serve as grounding lookups (frameworks, scenarios, damage functions) the model can
cite without computing. System prompt built from §5 (CSL formula, NGFS/ECB standards)
and §7's calculation walkthrough. The no-fabrication validator applies — supervisory
narratives are exactly where an invented basis point is most damaging. Drafts render
through the report-studio layer per the roadmap's Tier-3 output path.

**Prerequisites (hard).** The failed POST endpoints must pass the harness first — an
LLM cannot narrate a 500; Evolution A's real-book wiring so narratives describe an
actual portfolio. **Acceptance:** a generated ECB CST narrative contains zero numerics
absent from the tool-call outputs; the analyst refuses to project beyond the scenario
horizons the engine supports.