## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry cites a discounted-cashflow methodology —
> `CoalRetirementNPV = Σ[(FossilRevenue_t − GreenReplacement_t)/(1+r)^t]` and
> `JustTransitionCost = Σ[WorkerRetraining_i + CommunityInvestment_j + SocialProtection_k]`. **Neither
> formula exists anywhere in the code.** There is no discount rate, no NPV summation, and no
> component-level just-transition cost build-up. What the page actually implements is a **static,
> per-country seeded-random dataset for 15 JETP countries** with two linear what-if sliders
> (disbursement rate, coal-retirement acceleration). The sections below document the code as it
> actually behaves.

### 7.1 What the module computes

`JETP_COUNTRIES` is a fixed list of 15 countries (South Africa, Indonesia, Vietnam, India, Senegal,
Egypt, Kenya, Philippines, Morocco, Nigeria, Pakistan, Bangladesh, Colombia, Brazil, Kazakhstan)
mapped to 5 regions. Each country's 11 metrics (coal capacity, retirement target, renewable target,
pledged/disbursed finance, just-transition workers, IP recommendation count, implementation score,
coal jobs at risk, renewable jobs created, energy poverty risk, status) are generated once at module
load via the seeded PRNG `sr(s) = frac(sin(s+1)×10⁴)`, keyed on the country's array index `i`:

```js
coalCapacity        = 5   + sr(i*7)  * 45     // 5–50 GW
retirementTarget     = 2   + sr(i*11) * 25     // 2–27 GW by 2030
renewableTarget      = 3   + sr(i*13) * 47     // 3–50 GW
pledgedFinance       = 1   + sr(i*17) * 29     // $1–30Bn
disbursedFinance     = 0.1 + sr(i*19) * 12
justTransitionWorkers= 0.05+ sr(i*23) * 1.95   // 0.05–2.0M
ipRecommendations    = round(5 + sr(i*29)*45)  // count
implementationScore  = round(20 + sr(i*31)*75) // 0–100
coalJobsAtRisk       = round(10 + sr(i*37)*290)
renewableJobsCreated = round(5 + sr(i*41)*245)
energyPovertyRisk    = 1 + sr(i*43)*9          // 0–10
status               = STATUSES[floor(sr(i*47)*3)]  // On Track / Delayed / At Risk
```

Two interactive sliders re-scale (not re-model) two of these fields at render time.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| All 11 per-country metrics | See §7.1 formulas | Synthetic demo value — deterministic per country index, not tied to any real JETP investment plan figure |
| Country list, region mapping | 15 countries / 5 regions | Real — matches actual JETP/JETP-candidate countries (South Africa, Indonesia, Vietnam formally signed; others are prospective/illustrative) |
| Disbursement Rate slider | 10–100%, default 40% | UI what-if control, not sourced |
| Coal Retirement Acceleration slider | 0–10 GW/yr, default +2 | UI what-if control, not sourced |
| Status labels | On Track / Delayed / At Risk | Assigned by `sr()` tri-band split, not by any real JETP tracker status |

### 7.3 Calculation walkthrough

- **Filters** (`regionFilter`, `statusFilter`) subset `JETP_COUNTRIES` before every downstream
  aggregate.
- **KPI cards**: `totalRetirement = Σ retirementTarget`, `totalPledged = Σ pledgedFinance`,
  `avgImpl = mean(implementationScore)`, `totalWorkers = Σ justTransitionWorkers`.
- **Disbursement Rate slider** rescales pledged finance linearly:
  `projectedDisbursed = Σ (pledgedFinance × disbursementRate/100)` — a simple percentage
  application, not a disbursement-schedule model.
- **Coal Retirement Acceleration slider** adds a flat GW/yr offset to each country's retirement
  target: `adjusted = retirementTarget + coalAcceleration` — a linear shift, not a re-optimised coal
  fleet retirement schedule.
- **Scatter tabs** (IP Recommendations vs Pledged Finance; Pledged Finance vs Implementation Score)
  plot the raw synthetic fields against each other with no regression or correlation statistic
  computed — visual-only.

### 7.4 Worked example

South Africa (`i=0`): `coalCapacity = 5+sr(0)×45`. `sr(0) = frac(sin(0+1)×10000) = frac(8414.71) =
0.7095`, so `coalCapacity ≈ 5 + 0.7095×45 = 36.9 GW`. Similarly `retirementTarget = 2+sr(11)×25`; with
`sr(11) = frac(sin(12)×10000) = frac(-5365.73) = 0.2661` (JS `Math.sin` handles the negative
correctly since `frac` is defined as `x - floor(x)`), giving `retirementTarget ≈ 8.65 GW`. At the
default 40% disbursement slider, this country's contribution to `projectedDisbursed` is
`pledgedFinance × 0.40`; with `pledgedFinance = 1+sr(17)×29`, using `sr(17)=frac(sin(18)*10000)`
≈ 0.279 → `pledgedFinance ≈ 9.1`, contributing `≈ $3.64Bn` to the projected-disbursed KPI.

### 7.5 Companion analytics

- **Implementation Tracker tab** — horizontal progress bars keyed to `implementationScore` with a
  green (≥60) / amber (≥40) / red (<40) traffic light, plus the synthetic status badge.
- **Just Transition tab** — grouped bar of `coalJobsAtRisk` vs `renewableJobsCreated` in thousands,
  both synthetic, with no netting or ratio computed (unlike the guide's implied
  jobs-created-minus-jobs-lost framing).

### 7.6 Data provenance & limitations

- **Every quantitative figure on this page is synthetic**, generated by `sr(seed) =
  frac(sin(seed+1)×10⁴)` keyed only on array index — there is no connection to real JETP Investment
  Plan documents (e.g. South Africa's actual $8.5Bn JETP, Indonesia's $20Bn CIPP), no real coal fleet
  data, and no real disbursement tracking.
- The guide's NPV/DCF formulas describe a model that does not exist in this module; a real
  implementation would need year-by-year fossil revenue and green-replacement cashflow projections
  discounted at a jurisdiction-appropriate WACC, plus itemised just-transition cost components
  (retraining, community investment, social protection) — none of which are present.
- The disbursement-rate and coal-acceleration sliders are simple linear rescalings, not disbursement
  S-curve or capacity-retirement-optimisation models.

**Framework alignment:** JETP Investment Plans (South Africa, Indonesia, Vietnam) are referenced by
country selection only, not by any ingested plan data. ILO Just Transition Guidelines are named in
the guide but not operationalised (no retraining-cost, community-investment, or social-protection
line items in code). IEA Coal Phase-Out Financing Framework is not implemented. This module is best
understood as an **illustrative dashboard shell** for JETP tracking, not a quantitative JETP finance
model.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Support development-finance and sovereign-risk teams evaluating JETP country credit trajectories and
structuring blended-finance packages, by replacing the synthetic dataset with a real coal-retirement
NPV and just-transition cost model for the ~6 active/prospective JETP countries.

### 8.2 Conceptual approach
A **two-sided NPV model**: (1) coal retirement NPV nets the discounted value of foregone fossil
generation revenue against green-replacement capex/opex, mirroring utility stranded-asset valuation
used in IEA's *Financing Clean Energy Transitions* framework and World Bank coal-transition
mechanism appraisals; (2) just-transition cost is a bottom-up sum of worker retraining, community
investment, and social-protection line items, consistent with ILO Just Transition costing guidance
and CIF's Accelerating Coal Transition (ACT) program cost templates.

### 8.3 Mathematical specification
```
CoalRetirementNPV = Σ_t [(FossilRevenue_t − GreenReplacementCost_t) / (1+r)^t],  t = 1..T (plant remaining life)
FossilRevenue_t     = Capacity_MW × CapacityFactor_coal × 8760h × PowerPrice_t
GreenReplacementCost_t = ReplacementCapacity_MW × LCOE_renewable_t
JustTransitionCost = Σ_i WorkerRetraining_i + Σ_j CommunityInvestment_j + Σ_k SocialProtection_k
  WorkerRetraining_i = DisplacedWorkers_i × CostPerWorker (region-specific, $12k–32k per IRENA)
LeverageRatio       = PrivateFinanceMobilised / ConcessionalPublicCommitment   (JETP target ≈ 3.0)
```
| Parameter | Calibration source |
|---|---|
| Discount rate `r` | Country-specific sovereign WACC or IEA WACC assumptions by region (IEA WEO Annex) |
| CapacityFactor_coal | IEA *Electricity 2023* by country fleet age/type |
| LCOE_renewable_t | IRENA Renewable Power Generation Costs (annual) |
| Cost per retrained worker | IRENA Renewable Energy Jobs report, $12,000–32,000 range |
| Leverage ratio target | JETP Partnership Design Guidelines (1:3 concessional:private) |

### 8.4 Data requirements
- Plant-level coal fleet register (capacity, commissioning year, capacity factor, remaining life) —
  Global Coal Plant Tracker (free, Global Energy Monitor).
- Country power price and renewable LCOE trajectories — IEA WEO / IRENA (subscription + free summary
  tables).
- JETP Investment Plan disbursement ledgers — JETP Secretariat / IPG published investment plan PDFs
  (already partially represented in the platform's reference-data layer for other modules).
- Labour force and coal-region worker counts — ILO STAT, national labour surveys.

### 8.5 Validation & benchmarking plan
- Reconcile modelled coal-retirement NPV against publicly disclosed JETP Investment Plan financing
  gaps (e.g. Indonesia CIPP's stated $20Bn need) within a documented tolerance band.
- Sensitivity test on discount rate ±300bps and power-price trajectory to bound NPV uncertainty.
- Cross-check leverage ratio output against JETP Secretariat's own reported public:private ratios.

### 8.6 Limitations & model risk
- Real JETP disbursement is highly non-linear (see South Africa's actual <$200M disbursed 18 months
  post-signing) — a straight percentage-of-pledge model materially overstates near-term delivery;
  a production model should use a disbursement S-curve calibrated to observed JETP drawdown history.
- Country credit and political-risk overlays (e.g. change of government affecting coal phase-out
  commitment) are out of scope for a pure engineering-economics NPV and should be layered via the
  platform's sovereign risk modules.
- Conservative fallback: where plant-level fleet data is unavailable, report NPV as a range (low/mid/
  high) rather than a fabricated point estimate.
