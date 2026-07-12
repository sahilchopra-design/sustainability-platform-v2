# Climate Stress Test Suite
**Module ID:** `climate-stress-test-suite` · **Route:** `/climate-stress-test-suite` · **Tier:** A (backend vertical) · **EP code:** EP-CH3 · **Sprint:** CH

## 1 · Overview
Multi-regulator stress test alignment: ECB CST 2024, BoE CBES, APRA CPG 229. Includes reverse stress test and submission tracker.

**How an analyst works this module:**
- Stress Test Hub shows all 3 regulators with status
- ECB CST Module applies 3-scenario 30yr stress
- Reverse Stress Test solves for breaking conditions
- Submission Tracker monitors regulatory deadlines

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `APRA_RISKS`, `BOE_SCENARIOS`, `Card`, `ECB_SCENARIOS`, `ECB_SECTORS`, `Pill`, `Ref`, `SUBMISSION_TIMELINE`, `StatusBadge`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ECB_SCENARIOS` | 4 | `label`, `temp`, `horizon`, `carbonPrice`, `pdShock`, `lgdShock`, `color` |
| `ECB_SECTORS` | 9 | `pdShockMult`, `lgdShockMult`, `exposure` |
| `BOE_SCENARIOS` | 4 | `label`, `temp`, `pdImpact`, `physOverlay`, `color` |
| `APRA_RISKS` | 6 | `exposure`, `lossRate`, `region` |
| `SUBMISSION_TIMELINE` | 5 | `exercise`, `dataSubmit`, `resultsPublish`, `status` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sectorImpact` | `useMemo(() => ECB_SECTORS.map(s => ({` |
| `reverseSolve` | `useMemo(() => { const targetFrac = reverseTarget / 100;` |
| `carbonPrice` | `Math.round(targetFrac * 1800 + 50);` |
| `gdpShock` | `-(targetFrac * 12 + 1).toFixed(1);` |
| `physicalLoss` | `(targetFrac * 8 + 0.5).toFixed(1);` |
| `pdNoise` | `0.05 * sr(i * 13);   // [0, 0.05]` |
| `lgdNoise` | `0.025 * sr(i * 9 + 100); // [0, 0.025]` |

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
**Frontend seed datasets:** `APRA_RISKS`, `BOE_SCENARIOS`, `ECB_SCENARIOS`, `ECB_SECTORS`, `SUBMISSION_TIMELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ECL Uplift (NZ) | `Scenario-conditional` | ECB CST | Increase in expected credit loss under Net Zero scenario |
| Reverse Stress | `Solver output` | Model | Conditions that break the portfolio |

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
**Methodology:** Regulatory stress test methodologies
**Headline formula:** `ECL_stressed = PD_base × (1 + β_sector × ΔGDP + γ × ΔCarbonPrice) × LGD × EAD`

ECB CST: 3 scenarios, 30yr horizon, sector-specific PD/LGD shocks. BoE CBES: early/late action with physical overlay. APRA: Australian physical risk + coal exposure. Reverse stress test: solve for carbon price and GDP shock that causes >20% portfolio loss.

**Standards:** ['ECB CST 2024', 'BoE CBES', 'APRA CPG 229', 'Fed SR 11-7']
**Reference documents:** ECB Climate Stress Test Methodology 2024; BoE CBES Guidance; APRA CPG 229; Fed SR 11-7 Model Risk Management

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
| `climate-stress-test` | engine:climate_stress_test_engine |

## 7 · Methodology Deep Dive

This sibling module (EP-CH3) focuses on **multi-regulator alignment** (ECB CST 2024, BoE CBES, APRA CPG 229)
and adds a **reverse stress test**. The forward stress is a linear PD-shock model matching the guide's
`ECL_stressed = PD_base·(1 + β_sector·ΔGDP + γ·ΔCarbonPrice)·LGD·EAD`; the reverse solver inverts a target
loss fraction into implied carbon price and GDP shock. Sector shocks and noise are seeded/curated.

### 7.1 What the module computes

Sector loss impact (ECB CST):
```js
sectorImpact = ECB_SECTORS.map(s => ({ ... pdShock·pdShockMult, lgdShock·lgdShockMult, exposure ... }))
```
Reverse stress test — solve for the shock triple that hits a target loss %:
```js
targetFrac  = reverseTarget/100
carbonPrice = round(targetFrac·1800 + 50)      // € per tonne implied
gdpShock    = −(targetFrac·12 + 1)             // % GDP contraction implied
physicalLoss = targetFrac·8 + 0.5             // % physical loss implied
```
Idiosyncratic noise on shocks:
```js
pdNoise  = 0.05 · sr(i·13)          // [0, 0.05]
lgdNoise = 0.025 · sr(i·9+100)      // [0, 0.025]
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Source | Provenance |
|---|---|---|
| `ECB_SCENARIOS` (4: temp, carbonPrice, pdShock, lgdShock) | seed schema | curated (ECB CST 2024 scenarios) |
| `ECB_SECTORS` (9: pdShockMult, lgdShockMult, exposure) | seed schema | sector-relative shock multipliers |
| `BOE_SCENARIOS` (4: pdImpact, physOverlay) | seed schema | BoE CBES early/late-action |
| `APRA_RISKS` (6: lossRate, region) | seed schema | APRA CPG 229 Australian physical/coal |
| Reverse-solve slopes | `1800·frac+50`, `−(12·frac+1)`, `8·frac+0.5` | heuristic linear inversion |

The reverse-solve coefficients encode: to lose the whole portfolio (frac→1) you need ~€1,850 carbon price,
~−13% GDP, ~8.5% physical loss — a plausible but calibrated linear map, not a solved equilibrium.

### 7.3 Calculation walkthrough

Forward path: pick regulator scenario → `sectorImpact` applies each sector's PD/LGD shock multipliers to the
scenario shock, weighted by exposure → aggregate loss. Reverse path: user sets a `reverseTarget` loss % →
the three linear formulae return the implied carbon price / GDP shock / physical loss that would produce it.
`SUBMISSION_TIMELINE` tracks regulatory deadlines.

### 7.4 Worked example

**Forward:** ECB scenario `pdShock = 0.6%`, sector `pdShockMult = 1.5`, `lgdShock = 5%`, `lgdShockMult = 1.2`,
`exposure = €500M`, base PD 1.5%, LGD 40%:
```
stressedPD  = 1.5% + 0.6%·1.5 = 2.4%
stressedLGD = 40% + 5%·1.2   = 46%
ECL_stressed = 0.024·0.46·500 = €5.52M  vs base 0.015·0.40·500 = €3.00M  → +84% uplift
```
**Reverse:** target loss `reverseTarget = 20%` → `frac = 0.20`:
```
carbonPrice = 0.20·1800 + 50 = €410/t
gdpShock    = −(0.20·12 + 1) = −3.4%
physicalLoss = 0.20·8 + 0.5  = 2.1%
```
So a >20% portfolio loss is implied by ~€410/t carbon and −3.4% GDP — consistent with the guide's
"Carbon >€200, GDP <−3%" breaking-condition annotation.

### 7.5 Data provenance & limitations

- Scenario shocks and sector multipliers are **curated demo values** approximating ECB/BoE/APRA parameters;
  `pdNoise`/`lgdNoise` are `sr()`-seeded idiosyncratic add-ons.
- The reverse solver is a **linear inversion with fixed slopes**, not a true optimisation over a loss surface
  — it returns *a* consistent shock triple, not the minimum-distance or most-plausible breaking scenario.
- No lifetime ECL, no macro feedback; single-period sector shocks only.

**Framework alignment:** ECB Climate Stress Test 2024 (3-scenario, 30-yr, sector PD/LGD shocks) · BoE CBES
(early/late action + physical overlay) · APRA CPG 229 (Australian physical + coal exposure) · Fed SR 11-7
(model-risk governance framing). The reverse stress test operationalises supervisory reverse-stress
expectations.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce cross-regulator-consistent forward stress losses and a *properly solved*
reverse stress test identifying the least-implausible scenario that breaches a capital threshold.

**8.2 Conceptual approach.** Forward: sector satellite PD/LGD model (ECB CST). Reverse: constrained
optimisation over the NGFS scenario space to find the minimum-Mahalanobis-distance shock vector that hits the
loss target — the supervisory "reverse stress" best practice (BoE/EBA), not a fixed linear map.

**8.3 Mathematical specification.**
```
Forward:  ECL_s = Σ_i EAD_i·PD_base,i·(1 + β_i·ΔGDP_s + γ_i·ΔCarbon_s)·LGD_i
Reverse:  min_x (x−μ)ᵀ Σ⁻¹ (x−μ)   s.t.  Loss(x) ≥ target,   x = (ΔCarbon, ΔGDP, PhysLoss)
          where Loss(x) is the forward model; μ,Σ from NGFS scenario ensemble
Plausibility = χ²-quantile of the solved Mahalanobis distance
```

| Parameter | Source |
|---|---|
| β_i, γ_i | ECB CST satellite coefficients |
| μ, Σ (scenario mean/cov) | NGFS Phase IV ensemble |
| Loss target | capital-threshold policy (CET1 hurdle) |

**8.4 Data requirements.** Portfolio EAD/PD/LGD/sector; NGFS scenario ensemble; capital position. Free:
NGFS; vendor: none required.

**8.5 Validation & benchmarking.** Reconcile forward losses vs ECB/BoE published ranges; verify reverse
solution lies on the loss-target manifold; report plausibility percentile; sensitivity on Σ.

**8.6 Limitations & model risk.** Reverse solution sensitive to Σ specification; linear forward model misses
non-linear tail damage; regulator scenarios differ in horizon. Fallback: grid-search reverse solve with
documented linear slopes (current behaviour) when optimisation does not converge.

## 9 · Future Evolution

### 9.1 Evolution A — True reverse stress test via loss-surface optimization (analytics ladder: rung 2 → 3)

**What.** EP-CH3's most distinctive feature — the reverse stress test — is currently a
linear inversion with fixed slopes (`carbonPrice = targetFrac·1800 + 50`,
`gdpShock = −(targetFrac·12 + 1)`), which §7.5 concedes "returns *a* consistent shock
triple, not the minimum-distance or most-plausible breaking scenario." Evolution A
replaces it with a real solver: minimize the distance from baseline in
(ΔCarbonPrice, ΔGDP, physical-loss) space subject to portfolio loss ≥ target, evaluated
against the module's own forward model
`ECL_stressed = PD_base·(1 + β_sector·ΔGDP + γ·ΔCarbonPrice)·LGD·EAD`.

**How.** (1) New engine method in the shared `climate_stress_test_engine` (edits
propagate to `climate-stress-test` — coordinate) exposing the forward loss surface as a
callable; scipy SLSQP finds the nearest breaking point, with a scenario-plausibility
prior weighting the axes by NGFS-published ranges so the answer is "most plausible",
not just nearest. (2) Calibrate sector β/γ multipliers to the ECB CST 2024 published
shock parameters rather than curated approximations; keep the `sr()` idiosyncratic
pd/lgd noise out of the solver path. (3) Expose via
`POST /api/v1/climate-stress-test/reverse` and pin a reference case in `bench_quant.py`
(target 20% loss → documented shock triple).

**Prerequisites.** The five POST endpoints on this route family currently fail the
lineage harness — fix before adding a sixth; the seeded `pdNoise`/`lgdNoise` must be
excluded or seeded deterministically for solver reproducibility. **Acceptance:** the
solver's shock triple, pushed back through the forward model, reproduces the target
loss within 0.5%; monotonicity holds (higher target → weakly larger shocks).

### 9.2 Evolution B — Multi-regulator submission orchestrator (LLM tier 2 → 3)

**What.** This module already spans three regulators plus a `SUBMISSION_TIMELINE`
tracker — the natural seed of a desk-level workflow. Evolution B: an analyst that runs
the same book through `POST /ecb-cst`, `/boe-cbes`, and `/apra-clt`, calls
`/cross-framework` to reconcile, and produces a divergence memo ("BoE late-action PD
impact exceeds ECB disorderly because of the physical overlay") with each regulator's
figures traced to its tool call. Timeline questions ("what's due before the CBES
window?") answer from the `SUBMISSION_TIMELINE` data, and the orchestrator can draft
the per-regulator narrative sections in one pass.

**How.** Tier-2 tool schemas from the module's 9 endpoints; the tier-3 step is routing
to sibling modules — `climate-stress-test` for the IFRS-9/CET1 detail and
`regulatory-calendar` for deadline cross-checks — using the Atlas interconnection graph
as the routing map. Grounding corpus: §5's per-regulator methodology summary and §7.2's
parameter tables, so the model explains *why* frameworks diverge (shock design, not
arithmetic error).

**Prerequisites (hard).** All four regulator POST endpoints must pass the harness;
Evolution A's calibration so cross-framework divergences reflect published parameters
rather than curation artifacts. **Acceptance:** a cross-framework memo where every
number matches a tool response and each divergence explanation cites the specific
parameter difference (e.g. BoE physOverlay vs ECB lgdShock); refusal when asked about
regulators the module does not model (e.g. Fed pilot CA).