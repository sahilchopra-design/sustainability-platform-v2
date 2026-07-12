# Green Securitisation
**Module ID:** `green-securitisation` · **Route:** `/green-securitisation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses ESG securitisation structures including green ABS, green RMBS, green CLOs, and sustainability-linked securitisation tranches. Provides use-of-proceeds verification, green tranche isolation analytics, and regulatory alignment with EU Securitisation Regulation and EuGBS applicability to structured products.

> **Business value:** Supports structured credit investors and originators in verifying green tranche use-of-proceeds integrity, quantifying the greenium in ESG securitisation, and meeting EU Securitisation Regulation and ICMA Green Bond Principles disclosure requirements for labelled structured products.

**How an analyst works this module:**
- Load the securitisation deal structure and collateral pool data, classifying each asset against green eligibility criteria.
- Compute the green pool proportion and verify it exceeds the designated green tranche size to confirm use-of-proceeds integrity.
- Analyse tranche-level greenium by comparing green tranche yields against equivalent conventional tranches.
- Generate the EU Taxonomy alignment report for the collateral pool for investor disclosure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `CLIMATE_ASSET_ORDER`, `Chk`, `DEAL_TYPES`, `GS_API`, `Inp`, `KpiCard`, `LiveBadge`, `NGFS_SCENARIOS`, `PIE_COLORS_EPC`, `Row`, `STRUCTURE_TYPE_MAP`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEAL_TYPES` | 6 | `label` |
| `NGFS_SCENARIOS` | 5 | `label` |
| `CLIMATE_ASSET_ORDER` | 5 | `assetType`, `poolShare` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `GS_API` | ``${API}/api/v1/green-securitisation`;` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `TABS` | `['Deal Structure', 'EU GBS Compliance', 'Climate Risk Pass-Through', 'RMBS / ABS Analytics', 'Green Securitisation Overview'];` |
| `epcDistribution` | `useMemo(() => ( epcData.reduce((acc, d) => { acc[d.band] = d.value; return acc; }, {}) ), []);` |
| `gbsScoreSeed` | `Math.round(gbsRequirements.reduce((s, r) => s + r.score, 0) / gbsRequirements.length);` |
| `dealScoreSeed` | `Math.round(seed(91) * 20 + 72);` |
| `greeniumSeed` | `Math.round(seed(92) * 10 + 8);` |
| `avgCrremAlignmentSeed` | `crremData[crremData.length - 2].alignment;` |
| `avgPhysicalVarSeed` | `(climateRiskData.reduce((s, r) => s + r.physicalVar, 0) / climateRiskData.length).toFixed(1);` |
| `climateRiskDataLive` | `liveVar ? liveVar.asset_breakdown.map((a, i) => ({` |
| `epcDataLive` | `liveEpc ? Object.keys(epcDistribution).map(band => ({` |
| `avgPhysicalVar` | `(climateRiskDataLive.reduce((s, r) => s + r.physicalVar, 0) / climateRiskDataLive.length).toFixed(1);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/green-securitisation/eu-gbs-compliance` | `eu_gbs_compliance` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/rmbs-epc-analysis` | `rmbs_epc_analysis` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/covered-bond-esv` | `covered_bond_esv` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/green-tranche-design` | `green_tranche_design` | api/v1/routes/green_securitisation.py |
| POST | `/api/v1/green-securitisation/full-assessment` | `full_assessment` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/structure-types` | `ref_structure_types` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/eu-gbs-requirements` | `ref_eu_gbs_requirements` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/greenium-benchmarks` | `ref_greenium_benchmarks` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/climate-risk-profiles` | `ref_climate_risk_profiles` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/tranche-standards` | `ref_tranche_standards` | api/v1/routes/green_securitisation.py |
| GET | `/api/v1/green-securitisation/ref/ngfs-scenarios` | `ref_ngfs_scenarios` | api/v1/routes/green_securitisation.py |

### 2.3 Engine `green_securitisation_engine` (services/green_securitisation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `GreenSecuritisationEngine.assess_eu_gbs_compliance` | deal_data | Assess deal compliance with EU Green Bond Standard (EU) 2023/2631 Art 19. Checks: taxonomy alignment %, DNSH, minimum safeguards, framework, reporting, external review. Returns GBS score (0-100) and gap list. |
| `GreenSecuritisationEngine.compute_climate_var_passthrough` | pool_assets, ngfs_scenario, time_horizon_years | Compute climate VaR for a pool of securitised assets under an NGFS scenario. Returns physical VaR, transition VaR, climate-adjusted weighted PD/LGD, and required credit enhancement uplift. Physical VaR = sum(exposure × physical_risk_sensitivity × scenario_multiplier × concentration_factor) Transition VaR = sum(exposure × transition_risk_sensitivity × scenario_multiplier) |
| `GreenSecuritisationEngine.assess_rmbs_epc` | mortgage_pool | Assess RMBS pool EPC distribution, CRREM alignment, and energy efficiency metrics. References CRREM v2.0 (2023) decarbonisation pathways for residential buildings. EPC bands: A (best) → G (worst). EU taxonomy requires EPC A or top 15% per region. |
| `GreenSecuritisationEngine.assess_covered_bond_esv` | bond_data | Assess ECBC Covered Bond Label eligibility and ESV (Environmental Sustainability Value) score. References: EU Covered Bond Directive 2019/2162 + ECBC Label Convention 2023. ESV score reflects quality of green disclosure beyond standard ECBC label requirements. |
| `GreenSecuritisationEngine.design_green_tranche_structure` | pool_data, target_rating, green_target_pct | Design green tranche structure with subordination levels and greenium estimate. Follows EU STS Securitisation Regulation (EU) 2017/2402 retention requirements. Computes: tranche sizes, OC/CE requirements, greenium, ESRS SPV disclosure obligations. |
| `GreenSecuritisationEngine.run_full_assessment` | entity_id, deal_data | Orchestrate all 5 sub-assessments and compute green_securitisation_score. Assign deal tier: Dark Green / Green / Light Green / Amber / Red. Score weights: EU GBS 35% + Climate VaR 25% + EPC/RMBS 20% + Covered Bond ESV 10% + Tranche Design 10% |
| `GreenSecuritisationEngine.ref_structure_types` |  |  |
| `GreenSecuritisationEngine.ref_eu_gbs_requirements` |  |  |
| `GreenSecuritisationEngine.ref_greenium_benchmarks` |  |  |
| `GreenSecuritisationEngine.ref_climate_risk_profiles` |  |  |
| `GreenSecuritisationEngine.ref_tranche_standards` |  |  |
| `GreenSecuritisationEngine.ref_ngfs_scenarios` |  |  |
| `get_engine` |  | Return a module-level singleton engine. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pool`, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLIMATE_ASSET_ORDER`, `DEAL_TYPES`, `NGFS_SCENARIOS`, `PIE_COLORS_EPC`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Pool Proportion (%) | — | Deal prospectus / SPV report | Share of ABS collateral pool assets meeting green eligibility criteria; must exceed green tranche size to satisfy ICMA Principles. |
| Weighted Average Green Score | — | CBI / ICMA criteria | Composite green quality score across pool assets weighted by balance; reflects alignment with taxonomy-based green asset criteria. |
| Green Tranche Greenium (bps) | — | Market pricing data | Yield spread differential between green and conventional tranches of same seniority within the structure; larger greenium reflects strong ESG investor demand. |
| EU Taxonomy Alignment (%) | — | EU Taxonomy Delegated Act | Percentage of collateral assets meeting EU Taxonomy technical screening criteria for substantial contribution to climate mitigation. |
- **Collateral pool data (loan/asset level)** → Apply green eligibility criteria, compute weighted green scores → **Green pool proportion and asset-level green flags**
- **Deal waterfall and tranche structure** → Allocate green cash flows to green tranche, verify over-collateralisation → **Green tranche isolation analysis**
- **Market pricing for comparable tranches** → Compute Z-spread differential between green and conventional tranches → **Greenium by tranche in basis points**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/green-securitisation/ref/climate-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'climate_risk_profiles'], 'n_keys': 2}`

**GET /api/v1/green-securitisation/ref/eu-gbs-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'eu_gbs_requirements', 'regulation', 'entry_into_force'], 'n_keys': 4}`

**GET /api/v1/green-securitisation/ref/greenium-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'greenium_benchmarks', 'unit'], 'n_keys': 3}`

**GET /api/v1/green-securitisation/ref/ngfs-scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'ngfs_scenarios', 'version'], 'n_keys': 3}`

**GET /api/v1/green-securitisation/ref/structure-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'structure_types'], 'n_keys': 2}`

**GET /api/v1/green-securitisation/ref/tranche-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'tranche_subordination_standards', 'retention_requirement'], 'n_keys': 3}`

**POST /api/v1/green-securitisation/climate-var-passthrough** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/green-securitisation/covered-bond-esv** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Green Tranche Isolation
**Headline formula:** `GreenCF_tranche = Σ_i (w_i × GreenAsset_i × CollateralCF_i) / TranchePrincipal`

Allocates collateral-level green asset cash flows to the designated green tranche using pool weight methodology, ensuring use-of-proceeds ring-fencing at the tranche level. The green asset proportion in the collateral pool must exceed the green tranche size to satisfy over-collateralisation of the green use-of-proceeds claim.

**Standards:** ['EU Securitisation Regulation (2019)', 'ICMA Green Bond Principles â€” Securitisation Supplement', 'CBI Securitisation Criteria']
**Reference documents:** EU Securitisation Regulation (EU) 2017/2402; ICMA Green Bond Principles â€” Securitisation Supplement (2022); Climate Bonds Initiative â€” Securitisation Criteria (2022); ESAs Joint Opinion on Sustainability Disclosure in the Securitisation Regulation (2021)

**Engine `green_securitisation_engine` — extracted transformation lines:**
```python
horizon_factor = math.sqrt(time_horizon_years / 10.0)
phys_contribution = balance * phys_sens * phys_mult * horizon_factor * 0.10
trans_contribution = balance * max(0, trans_sens) * trans_mult * horizon_factor * 0.08
pd_uplift = base_pd * (phys_sens * phys_mult * 0.25 + max(0, trans_sens) * trans_mult * 0.30)
lgd_uplift = base_lgd * phys_sens * phys_mult * 0.10
climate_pd = min(1.0, base_pd + pd_uplift * (time_horizon_years / 10.0))
climate_lgd = min(1.0, base_lgd + lgd_uplift * (time_horizon_years / 10.0))
weight = balance / total_exposure
total_climate_var_m = physical_var_m + transition_var_m
var_as_pct_pool = (total_climate_var_m / total_exposure) * 100
ce_uplift_pct = min(5.0, var_as_pct_pool * 0.20)
ce_recommended_pct = round((ce_base * 100) + ce_uplift_pct, 2)
epc_dist = {k: v / total_epc * 100 for k, v in epc_dist.items()}
epc_a_b_pct = epc_a_pct + epc_b_pct
physical_hazard_score = round((country_flood_risk + country_heat_risk) / 2 * 100, 1)
epc_quality_score = round(epc_a_b_pct * 0.60 + (100 - epc_ef_pct) * 0.40, 1)
taxonomy_eligible_balance_m = total_balance_m * taxonomy_eligible_pct / 100.0
esv_kpi_bonus = min(10.0, avg_kpi_quality * 0.10)  # Up to 10 bonus points for KPI quality
esv_score = round(min(100.0, total_esv_score + esv_kpi_bonus), 1)
size_m = pool_size_m * actual_size_pct / 100.0
green_pool_m = pool_size_m * green_target_pct / 100.0
standard_pool_m = pool_size_m - green_pool_m
epc_score = 50.0  # neutral default for non-RMBS
climate_var_score = round(max(0, 100 - var_pct * 4), 1)
tranche_score = round(min(100, 60 + green_target_pct * 0.4 - n_obligations * 2), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code (front vs back) split.** The MODULE_GUIDES entry describes a *green tranche
> isolation* cash-flow allocator (`GreenCF_tranche = Σ wᵢ × GreenAssetᵢ × CollateralCFᵢ / TranchePrincipal`).
> **That formula is not in either the page or the engine.** The React page
> (`GreenSecuritisationPage.jsx`) renders a static demo: fixed tranche waterfall + `seed()`-generated
> compliance scores, greenium and physical/transition VaR. A genuinely rich backend
> (`green_securitisation_engine.py`, E81) exists with EU GBS scoring, NGFS climate-VaR pass-through,
> RMBS EPC/CRREM analysis, covered-bond ESV and tranche design — but the page's `runAnalysis()` POSTs
> to `/green-securitisation/analyse` and, on any error, silently falls back to seed data
> (`catch { setResult({}) }`). Sections below document (a) what the page shows and (b) the engine
> that should power it.

### 7.1 What the page computes

The page has 5 tabs (`Deal Structure`, `EU GBS Compliance`, `Climate Risk Pass-Through`,
`RMBS/ABS Analytics`, `Overview`). Headline numbers are seeded, not modelled:

```js
seed(s) = frac(sin(s+1) × 10000)                         // platform PRNG
gbsScore   = round(mean(gbsRequirements[i].score))       // 4-requirement average
dealScore  = round(seed(91)×20 + 72)                     // 72–92 band
greenium   = round(seed(92)×10 + 8)                      // 8–18 bps
avgPhysicalVar = mean(climateRiskData[i].physicalVar)    // seeded 1.5–5.5%
```

The only non-seeded structural constants are `trancheData` (Senior AAA 75% / Mezz A 12% / Mezz BB 8%
/ Junior 5%, with CE 25/13/5/0%) and `crremData` (CRREM alignment 62%→85% over 2020→2030T).

### 7.2 The real engine (E81) — parameterisation

`green_securitisation_engine.py` implements six sub-assessments. The scoring rubric:

| Sub-assessment | Weight in composite | Key constants / provenance |
|---|---|---|
| EU GBS compliance | 0.35 | Taxonomy 0.40, Framework 0.25, Reporting 0.20, Review 0.15 (Reg (EU) 2023/2631 Art 4/6/9-11/14-20) |
| Climate VaR | 0.25 | NGFS v4.0 phys/trans multipliers (see below) |
| RMBS EPC quality | 0.20 | CRREM v2.0 stranding years; energy-intensity map A=50…G=550 kWh/m²/yr |
| Covered-bond ESV | 0.10 | ECBC Label Convention 2023 criterion weights (sum 1.00) |
| Tranche design | 0.10 | STS Reg (EU) 2017/2402 5% retention |

**NGFS scenario multipliers** (`NGFS_SCENARIO_PARAMETERS`):

| Scenario | Phys mult | Trans mult | Carbon 2030 $/t | Temp 2100 |
|---|---|---|---|---|
| Net Zero 2050 | 0.60 | 1.20 | 130 | 1.5 °C |
| Below 2 °C | 0.80 | 0.90 | 75 | 1.8 °C |
| Delayed Transition | 0.90 | 1.60 | 20 | 1.8 °C |
| Current Policies | 1.50 | 0.30 | 5 | 3.2 °C |

**Climate-risk sector sensitivities** (`CLIMATE_RISK_SECTOR_PROFILES`): residential mortgage
phys 0.65 / trans 0.45; auto loans phys 0.20 / trans 0.80 (ICE-ban exposure); green assets carry
*negative* transition sensitivity (solar −0.30, efficiency loans −0.20) — climate transition is
beneficial for them.

### 7.3 Calculation walkthrough (engine)

For each pool asset the engine computes (`compute_climate_var_passthrough`):

```
horizon_factor = sqrt(T/10)
phys_contribution  = balance × max(0,phys_sens) × phys_mult × horizon_factor × 0.10
trans_contribution = balance × max(0,trans_sens) × trans_mult × horizon_factor × 0.08
pd_uplift  = base_pd × (phys_sens×phys_mult×0.25 + max(0,trans_sens)×trans_mult×0.30)
climate_pd = min(1, base_pd + pd_uplift × T/10)
CE_uplift% = min(5, VaR%_pool × 0.20);  CE_recommended% = 18 + CE_uplift%
```

Pool-weighted climate PD/LGD roll up to `expected_climate_loss = PD̄ × LGD̄ × pool`. EU GBS score is
the weighted component sum; deal tier is banded (≥80 Dark Green, ≥65 Green, ≥50 Light Green,
≥35 Amber, else Red).

### 7.4 Worked example (engine, Delayed Transition)

One residential-mortgage asset, `balance = €500M`, `base_pd = 2%`, `base_lgd = 25%`, `T = 10`:

| Step | Computation | Result |
|---|---|---|
| horizon factor | √(10/10) | 1.00 |
| phys contribution | 500 × 0.65 × 0.90 × 1.0 × 0.10 | €29.25M |
| trans contribution | 500 × 0.45 × 1.60 × 1.0 × 0.08 | €28.80M |
| total climate VaR | 29.25 + 28.80 | €58.05M |
| VaR % of pool | 58.05 / 500 | 11.6% |
| PD uplift | 0.02 × (0.65×0.90×0.25 + 0.45×1.60×0.30) | 0.00722 |
| climate PD | 0.02 + 0.00722 | 2.72% |
| CE uplift | min(5, 11.6 × 0.20) | 2.32% → CE 20.3% |
| climate-VaR score | max(0, 100 − 11.6×4) | 53.6 |

An 11.6% pool VaR under Delayed Transition triggers the `var_pct > 5` action ("increase CE by 2.3%").

### 7.5 Data provenance & limitations

- **Page KPIs are synthetic** — the `seed()` PRNG generates GBS scores, greenium, VaR, EPC bands and
  taxonomy-objective alignment. They are stable across renders but carry no real deal data.
- **Engine is real but latent** — the rich E81 model runs only if the backend responds; the page's
  `catch` swallows failures and shows seed data with no user-visible warning.
- Engine simplifications vs production: VaR is a scalar sensitivity × scenario-multiplier product
  (no Monte-Carlo loss distribution, no correlation across assets); horizon scaling is a √T proxy;
  CE uplift is capped at 5% by construction.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page shows seeded numbers; §7.2–7.4 engine is a heuristic sensitivity model, not a cash-flow waterfall).

**8.1 Purpose & scope.** Allocate collateral-level green cash flows to a designated green tranche and
verify use-of-proceeds ring-fencing, per the guide's stated methodology — for EU GBS / ICMA GBP
Securitisation Supplement disclosure on green ABS/RMBS/CLO deals.

**8.2 Conceptual approach.** A loan-level waterfall engine mirroring Intex/Bloomberg SF cash-flow
models, overlaid with a green-eligibility tag per loan (as in Moody's/S&P green securitisation
frameworks). Green cash flow is traced through the payment waterfall to the green tranche;
over-collateralisation of the green claim is tested as green-pool% > green-tranche%.

**8.3 Mathematical specification.**
```
For loan i: GreenFlagᵢ ∈ {0,1} from taxonomy TSC + DNSH check
Pool green proportion  g = Σᵢ Balanceᵢ·GreenFlagᵢ / Σᵢ Balanceᵢ
Tranche green cash flow  GreenCF_t = Σᵢ (wᵢ,t · GreenFlagᵢ · CollateralCFᵢ)
   where wᵢ,t = share of loan i's cash flow directed to tranche t by the waterfall
Green isolation ratio  R = GreenCF_t / TranchePrincipal_t          (target ≥ 1.0)
OC test  passes iff  g > TrancheSize_t / PoolSize
Greenium bps  = ASW(conventional matched tranche) − ASW(green tranche)
```

| Parameter | Value / source |
|---|---|
| TSC / DNSH thresholds | EU Taxonomy Delegated Acts (2021/2139) |
| EPC→energy-intensity map | CRREM v2.0 (A=50…G=550 kWh/m²/yr) |
| Greenium by rating | ECB/BIS WP 1015; CBI Greenium Survey (AAA 3–5 bps) |
| Retention floor | 5% (STS Reg (EU) 2017/2402 Art 6) |

**8.4 Data requirements.** Loan-level tape (balance, rate, WAL, EPC band, use-of-proceeds flag),
tranche structure (attach/detach, coupon), matched conventional ASW curve. Platform already holds
CRREM pathways (`reference_data`) and the E81 engine's sector/NGFS constants.

**8.5 Validation & benchmarking.** Reconcile tranche cash flows against Intex on a public STS deal;
back-test greenium against ICMA/CBI published green-vs-conventional spreads; sensitivity on default/
prepay vectors. Green isolation ratio should reconcile to the SPV's own allocation report.

**8.6 Limitations & model risk.** Green-flag classification is the dominant model risk (borderline
taxonomy activities); waterfall assumes deterministic prepay/default vectors; greenium is illiquid
and noisy at issuance. Conservative fallback: report green pool% and OC test only when isolation
ratio is unstable.

**Framework alignment:** EU Green Bond Standard (Reg (EU) 2023/2631) — 100% taxonomy allocation +
external review; EU Taxonomy (2020/852) — TSC + DNSH + Minimum Safeguards; ICMA GBP Securitisation
Supplement — use-of-proceeds ring-fencing; CRREM v2.0 — building stranding pathways; NGFS v4.0 —
physical/transition scenario multipliers; STS Reg (EU) 2017/2402 — 5% risk retention.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to the real engine and upgrade climate VaR to a loss distribution (analytics ladder: rung 2 → 4)

**What.** §7 documents a strong latent asset with a wiring failure: `green_securitisation_engine.py` implements real EU-GBS compliance scoring (2023/2631 Art 19), climate-VaR pass-through under NGFS scenarios (physical + transition VaR, climate-adjusted PD/LGD, credit-enhancement uplift), and RMBS EPC/CRREM assessment — but the page's `catch` swallows backend failures and renders `seed()`-PRNG KPIs (GBS scores, greenium, VaR, EPC bands) with no user-visible warning. The engine itself is a heuristic sensitivity model, not a cash-flow waterfall (VaR is a scalar sensitivity × scenario-multiplier with √T horizon scaling and a 5%-capped CE uplift, no Monte-Carlo loss distribution or asset correlation). Evolution A does both: wire the page to always render engine output (fail loudly, not silently to seed data), and upgrade the climate VaR from a scalar sensitivity to a Monte-Carlo loss distribution with asset correlation across the pool.

**How.** (1) Remove the silent seed-data fallback; surface a clear error when the engine is unreachable, never synthetic KPIs. (2) Replace the scalar VaR with a Monte-Carlo (deterministic QMC per platform convention) loss distribution incorporating PD/LGD correlation and the NGFS scenario multipliers, producing a real percentile VaR and CE uplift. (3) The green-tranche isolation and EU-GBS compliance read from the engine.

**Prerequisites.** The silent `catch`→seed path removed (§7-flagged fabrication); QMC replacing the scalar proxy; pool asset data. **Acceptance:** page KPIs always equal engine output or show an explicit error (never `seed()` values); climate VaR is a percentile from a loss distribution with correlation, not a scalar product; CE uplift is uncapped by construction where the distribution warrants.

### 9.2 Evolution B — Green-securitisation structuring copilot (LLM tier 2)

**What.** A copilot for structured-finance desks: "assess this green RMBS pool's EU-GBS compliance and climate VaR under NGFS disorderly, and size the green tranche for over-collateralisation" tool-calls the engine's GBS, climate-VaR, and RMBS-EPC endpoints, narrating the compliance gaps and required credit enhancement.

**How.** Tier-2 tool-calling over the engine's real operations (the module is tier-A with a genuine engine); the grounding corpus is §5/§7 (EU GBS Art 19, green-tranche isolation, NGFS climate-VaR, CRREM v2.0). The copilot's value is compliance-plus-risk structuring — GBS gaps, climate VaR, and green-tranche over-collateralisation. Guardrail: it must call the engine (not narrate the seeded page) and report when the engine is unreachable rather than using seed KPIs. Every score and VaR figure validated against engine output.

**Prerequisites.** Evolution A's loud-fail wiring (the copilot must never narrate seed data); RBAC-scoped deal data. **Acceptance:** every GBS score and VaR figure traces to an engine tool call; the copilot reports engine-unavailable explicitly rather than answering from seed values; the green-tranche sizing satisfies the over-collateralisation rule.