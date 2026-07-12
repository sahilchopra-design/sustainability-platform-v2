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
