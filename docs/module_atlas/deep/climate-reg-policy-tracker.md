## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DK6) describes a **Regulatory Compliance Cost
> Model** — `ComplianceCost = Σ [CarbonTaxExposure + DisclosureCompliance + TaxonomyCapex +
> TransitionPlanCost]` with `CarbonTaxExposure = Scope1_tCO2e × CarbonPrice` — plus CBAM
> supply-chain modelling and EU Taxonomy eligibility assessment. **None of that is implemented.**
> The page generates 75 synthetic policy records whose `complianceCost` is a random draw
> (`0.1 + sr(i*31)×49.9` $Bn), not a function of any company's emissions or any carbon price. No
> company data, no Scope 1, no CBAM calculator exists on this page. The sections below document
> the code as it behaves.

### 7.1 What the module computes

`ClimateRegPolicyTrackerPage.jsx` (396 lines) is a filterable synthetic registry of 75 climate
policies across 8 types (Carbon Tax, ETS, Disclosure, Taxonomy, Transition Plan, Due Diligence,
Building, Transport), 6 regions, 15 jurisdictions, 4 statuses. Record generation:

```js
type   = POLICY_TYPES[floor(sr(i*7)  × 8)]
status = STATUSES[floor(sr(i*17) × 4)]
effectiveYear          = 2020 + floor(sr(i*19) × 8)              // 2020–2027
carbonPriceEquivalent  = (type ∈ {Carbon Tax, ETS}) ? 5 + sr(i*23)×195   // $5–200/t
                                                    : sr(i*23)×50        // $0–50/t implicit
complianceCost         = 0.1 + sr(i*31)×49.9                     // $0.1–50 Bn, unconditional draw
policyAmbitiousness    = 2 + sr(i*37)×8                          // 2–10 scale
alignedWithParis       = ambition ≥ 6 ? sr(i*41) > 0.25 : sr(i*41) > 0.65
enforcementRisk        = 1 + sr(i*43)×9 ;  businessImpactScore = 1 + sr(i*47)×9
```

The only *structural* (non-random) relationships are: (a) pricing instruments get a higher
carbon-price range than regulatory instruments, and (b) Paris alignment probability is 75% for
ambition ≥ 6 vs 35% below — a deliberate correlation injected into the synthetic data.

### 7.2 Derived metrics

```js
avgPrice  = Σ carbonPriceEquivalent / max(1, n)          // over the filtered set
pctParis  = count(alignedWithParis) / n × 100
totalCost = Σ complianceCost                             // $Bn, headline KPI
byJurisdiction = mean price per jurisdiction, top 12 by avgPrice
timelineData   = counts of In-Force / Pending / Proposed+Consultation per effective year
scatterData    = (policyAmbitiousness, complianceCost) coloured by Paris alignment
```

All divisions are guarded via `n = Math.max(1, filtered.length)`.

### 7.3 Calculation walkthrough

Six filters (region, type, status, year, min carbon price 0–150 slider, min ambition slider) →
`filtered` → four KPIs (policy count, avg $/t, % Paris-aligned, total compliance cost) → charts:
count-by-type bar, price-by-jurisdiction bar, ambition-vs-cost scatter, and an 8-year timeline
area chart stacked by status. Eight tabs re-slice the same 75 records by theme.

### 7.4 Worked example — policy i = 0

`sr(0) = frac(sin(1)×10⁴) = 0.7098`; all seeds `0×k` collapse to `sr(0)`:

| Field | Formula | Value |
|---|---|---|
| type | POLICY_TYPES[floor(0.7098×8)=5] | **Due Diligence** |
| carbonPriceEquivalent | non-pricing → 0.7098×50 | **$35/t** |
| effectiveYear | 2020 + floor(0.7098×8) | **2025** |
| complianceCost | 0.1 + 0.7098×49.9 | **$35.5Bn** |
| policyAmbitiousness | 2 + 0.7098×8 | **7.7** |
| alignedWithParis | 7.7 ≥ 6 and sr(0)=0.7098 > 0.25 | **true** |

With no filters: n = 75, and the KPIs are the corresponding means/sums over all 75 draws.

### 7.5 Data provenance & limitations

- **Every record is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`). Policy names are generated
  strings ("ETS — Germany 2021"), not real regulations; there is no CBAM, CSRD, SB-253 or IRA
  record as such, despite the guide's references.
- `complianceCost` has no economic linkage to price, sectors affected or jurisdiction size — the
  ambition-vs-cost scatter therefore shows noise by construction.
- The i=0 seed collapse makes the first record's fields perfectly correlated.
- Contrast: the platform's `climate_policy_tracker_engine.py` (documented under `climate-policy`)
  contains real Fit-for-55/IRA/NZE reference data that this page could consume but does not.

**Framework alignment:** World Bank Carbon Pricing Dashboard / ICAP (the guide's data model —
instrument, price, coverage — is what `carbonPriceEquivalent` gestures at) · EU CBAM Regulation
2023/956 (named in the guide; CBAM costs are computed as embedded emissions × (EU ETS price −
origin carbon price paid), phased 2026–2034 — not implemented here) · KPMG Survey of Sustainability
Reporting (disclosure-mandate counts) · IPCC AR6 WGIII Ch.13 (policy taxonomy).

## 8 · Model Specification — Regulatory Compliance Cost Model

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Quantify per-company and portfolio-level compliance cost from climate regulation (carbon pricing,
disclosure mandates, CBAM, taxonomy-driven capex) to support CFO planning and portfolio
earnings-impact analysis. Coverage: listed corporates with emissions data, 3 price scenarios,
horizon to 2035.

### 8.2 Conceptual approach

Bottom-up exposure model, mirroring **MSCI Carbon-Price Risk / Trucost carbon earnings-at-risk**
(company emissions × jurisdictional price paths, netted for free allocation) and the **OECD
effective carbon rates** framework for multi-instrument jurisdictions. Disclosure/assurance costs
from survey-based unit costs; CBAM per Regulation (EU) 2023/956 mechanics.

### 8.3 Mathematical specification

```
CarbonCost_c,t   = Σ_j S1_c,j × cov_j,t × (1 − free_j,t) × P_j,t         # per jurisdiction j
CBAM_c,t         = Σ_g M_c,g × EI_g × φ_t × max(0, P_EUETS,t − P_origin,t)  # g ∈ CBAM goods
                   φ_t = CBAM phase-in (2.5% 2026 → 100% 2034, Reg. 2023/956 Annex)
DisclosureCost_c = α_size + β × 1{first-year}                             # fixed + setup
TaxonomyCapex_c  = max(0, K_align − K_planned)                            # gap to substantial-contribution capex
TotalCost_c,t    = CarbonCost + CBAM + DisclosureCost + TaxonomyCapex_amortised
EarningsAtRisk_c = TotalCost_c,t / EBITDA_c
```

| Parameter | Calibration source |
|---|---|
| P_j,t price paths | NGFS Phase IV scenario carbon prices; spot from World Bank CPD/ICAP |
| cov_j,t coverage, free_j,t free allocation | ICAP ETS factsheets; EU ETS benchmarking data |
| EI_g embedded emissions intensities | EU CBAM default values (Commission Implementing Reg.); CEDA factors (already ingested in platform reference_data) |
| φ_t phase-in | CBAM Reg. 2023/956 |
| α, β disclosure costs | SEC climate rule cost-benefit analysis (~$0.5–1.5M/yr large filer); ERM/CDP CSRD cost surveys |
| S1 emissions | CDP, company reports; OWID/SBTi tables in platform reference_data |

### 8.4 Data requirements

Company: Scope 1 by jurisdiction (or revenue-apportioned), EBITDA, CBAM-good import volumes,
capex plans. Market: jurisdiction price/coverage tables (World Bank CPD — free), NGFS price paths
(free). Platform reuse: CBAM reference table (already ingested per reference-data layer), OWID
emissions, `climate_policy_tracker_engine` jurisdiction profiles.

### 8.5 Validation & benchmarking plan

Reconcile CarbonCost against companies' disclosed ETS costs in annual reports (EU utilities are
the cleanest benchmarks); cross-check EarningsAtRisk distribution vs Trucost published sector
carbon-earnings-at-risk ranges; scenario monotonicity test (NZ2050 ≥ Delayed ≥ Current Policies
costs by 2030 in AE jurisdictions); sensitivity to free-allocation assumptions ±20pp.

### 8.6 Limitations & model risk

Revenue apportionment of emissions to jurisdictions is coarse; pass-through of carbon costs to
customers (0–100%) drives earnings impact more than the gross cost — publish gross and net at
assumed sector pass-through; CBAM default intensities are conservative by design (fallback when
supplier-specific data absent); taxonomy capex gap is planning data, low reliability — flag as
indicative tier.
