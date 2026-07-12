# Climate Regulatory & Policy Tracker
**Module ID:** `climate-reg-policy-tracker` · **Route:** `/climate-reg-policy-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-DK6 · **Sprint:** DK

## 1 · Overview
Tracks global climate policy and regulatory developments — carbon pricing, disclosure mandates, taxonomies, transition plans, and central bank climate requirements. Quantifies regulatory impact on portfolio companies and models compliance cost curves.

> **Business value:** Critical for corporate government affairs, treasury, and CFO functions managing regulatory compliance costs. Enables portfolio managers to model regulatory-driven earnings impact, identify regulatory arbitrage opportunities, and prepare board-level regulatory scenario analysis.

**How an analyst works this module:**
- Browse global carbon pricing instruments by jurisdiction
- Calculate company carbon tax exposure by geography
- Track disclosure mandate timelines and requirements
- Assess EU Taxonomy eligibility and compliance cost
- Model CBAM impact on supply chain carbon costs

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `JURISDICTIONS`, `KpiCard`, `POLICIES`, `POLICY_TYPES`, `REGIONS`, `SECTORS_ALL`, `STATUSES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `type` | `POLICY_TYPES[Math.floor(sr(i * 7) * POLICY_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(sr(i * 11) * REGIONS.length)];` |
| `jurisdiction` | `JURISDICTIONS[Math.floor(sr(i * 13) * JURISDICTIONS.length)];` |
| `status` | `STATUSES[Math.floor(sr(i * 17) * STATUSES.length)];` |
| `effectiveYear` | `2020 + Math.floor(sr(i * 19) * 8);` |
| `carbonPriceEquivalent` | `type === 'Carbon Tax' \|\| type === 'ETS' ? parseFloat((5 + sr(i * 23) * 195).toFixed(0)) : parseFloat((sr(i * 23) * 50).toFixed(0));` |
| `affectedSectorCount` | `1 + Math.floor(sr(i * 29) * 4);` |
| `complianceCost` | `parseFloat((0.1 + sr(i * 31) * 49.9).toFixed(1));` |
| `policyAmbitiousness` | `parseFloat((2 + sr(i * 37) * 8).toFixed(1));` |
| `alignedWithParis` | `policyAmbitiousness >= 6 ? sr(i * 41) > 0.25 : sr(i * 41) > 0.65;` |
| `enforcementRisk` | `parseFloat((1 + sr(i * 43) * 9).toFixed(1));` |
| `businessImpactScore` | `parseFloat((1 + sr(i * 47) * 9).toFixed(1));` |
| `filtered` | `useMemo(() => POLICIES.filter(p => (filterRegion === 'All' \|\| p.region === filterRegion) && (filterType === 'All' \|\| p.type === filterType) && (filterStatus === 'All' \|\| p.status === filterStatus) && (filterYear === 'All' \|\| p.effectiveYear === +filterYear) && p.carbonPriceEquivalent >= minPrice && p.policyAmbitiousness >= minAmbition ), ` |
| `avgPrice` | `(filtered.reduce((a, p) => a + p.carbonPriceEquivalent, 0) / n).toFixed(0);` |
| `pctParis` | `((filtered.filter(p => p.alignedWithParis).length / n) * 100).toFixed(0);` |
| `totalCost` | `filtered.reduce((a, p) => a + p.complianceCost, 0).toFixed(1);` |
| `byType` | `POLICY_TYPES.map(t => ({` |
| `byJurisdiction` | `JURISDICTIONS.map(j => {` |
| `scatterData` | `filtered.map(p => ({ x: p.policyAmbitiousness, y: p.complianceCost, name: p.name, paris: p.alignedWithParis }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `JURISDICTIONS`, `POLICY_TYPES`, `REGIONS`, `SECTORS_ALL`, `STATUSES`, `TABS`, `YEARS_RANGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Carbon Pricing Coverage | — | World Bank Carbon Pricing Dashboard 2024 | 73 carbon pricing instruments globally covering 23% of global GHG emissions in 2024 |
| Mandatory Disclosure Jurisdictions | — | KPMG Survey 2022 | 45+ jurisdictions have mandatory corporate climate/sustainability disclosure requirements — growing rapidly |
| CBAM Coverage | — | European Commission CBAM Assessment | EU Carbon Border Adjustment Mechanism covers iron, steel, cement, aluminium, fertiliser, electricity — €35Bn/yr |
- **World Bank Carbon Pricing Dashboard data** → Carbon exposure calculation → **Company Scope 1 carbon tax exposure by jurisdiction**
- **ICAP ETS registry data + auction prices** → ETS cost modelling → **ETS compliance cost under various carbon price scenarios**
- **EU Taxonomy alignment data + CapEx plans** → Taxonomy compliance cost → **CapEx required for EU Taxonomy substantial contribution threshold**

## 5 · Intermediate Transformation Logic
**Methodology:** Regulatory Compliance Cost Model
**Headline formula:** `ComplianceCost = Σ [CarbonTaxExposure_i + DisclosureCompliance_i + TaxonomyCapex_i + TransitionPlanCost_i]; CarbonTaxExposure = Scope1_tCO2e × CarbonPrice`

Carbon tax exposure is primary quantifiable cost; disclosure compliance adds ongoing reporting cost; taxonomy eligibility determines green financing access — all modelled by scenario and jurisdiction

**Standards:** ['IPCC AR6 WGIII Chapter 13 — National and Sub-national Policies', 'World Bank Carbon Pricing Dashboard 2024', 'ICAP Emissions Trading Worldwide 2024', 'KPMG Survey of Sustainability Reporting 2022']
**Reference documents:** World Bank State and Trends of Carbon Pricing 2024; ICAP Emissions Trading Worldwide 2024; EU Carbon Border Adjustment Mechanism — Regulation (EU) 2023/956; IEA Energy Policy Progress Tracker 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real policy registry and a computable carbon-tax exposure (analytics ladder: rung 1 → 2)

**What.** §7 flags total divergence: the guide's Regulatory Compliance Cost Model
(`ComplianceCost = Σ CarbonTax + Disclosure + TaxonomyCapex + TransitionPlan`, with
`CarbonTaxExposure = Scope1 × CarbonPrice`) has no implementation — the page is a
75-record synthetic registry whose `complianceCost` is a random draw untethered to
any emissions or price. Evolution A rebuilds both halves. Registry: real policy
records from the sources §5 cites — the World Bank Carbon Pricing dashboard and ICAP
ETS map publish jurisdiction/instrument/price/coverage tables annually, and the
platform's regulatory-calendar and climate-policy modules already curate disclosure-
mandate timelines (share, don't duplicate). Cost model: the one honestly computable
term first — `CarbonTaxExposure = Scope1 × jurisdiction price × covered fraction` —
as a calculator taking a company's emissions-by-jurisdiction profile, with
disclosure/taxonomy/transition-plan costs shipped as sourced ranges (survey-based
estimates exist) rather than invented point values.

**How.** (1) `ref_climate_policies(jurisdiction, instrument, status, effective_year,
price, coverage, source, as_of)` from WB/ICAP tables + curated disclosure mandates;
the filter UI transfers unchanged. (2) The exposure calculator as a pure function;
CBAM modelled for the covered sectors using the published transitional-period rules
(the regulation is in §5's references). (3) Cross-module wiring: policy records link
to the `climate-policy` engine's price-gap scoring where jurisdictions overlap.

**Prerequisites (hard).** Synthetic-registry purge; coordination with the two policy
siblings so the platform has one policy data layer. **Acceptance:** every registry
row cites WB/ICAP/regulation sources with as-of dates; a fixture company's carbon-tax
exposure reproduces `Scope1 × price × coverage` by hand; CBAM output matches a
worked example from the regulation's methodology.

### 9.2 Evolution B — Regulatory horizon-scanning copilot (LLM tier 1 → 2)

**What.** A copilot for government-affairs and CFO teams: "what disclosure mandates
hit us in 2027 across our jurisdictions?" (filtered registry narration with
citations), "what's our carbon-tax exposure if the EU price reaches €120?"
(post-Evolution A, a calculator tool call), "how does CBAM affect our steel
imports?" (the covered-sector calculator with the transitional rules cited). Board-
ready scenario summaries assemble from computed exposures plus registry timelines.

**How.** Tier 1: registry aggregates + regulation corpus as grounding, every policy
fact citing its row and as-of date. Tier 2: tool schemas over the exposure and CBAM
calculators; validator on every $ figure; range-based cost terms (disclosure,
taxonomy) presented as ranges with sources — never collapsed to false points.

**Prerequisites (hard).** Evolution A first — a horizon scan over 75 random records
would brief boards on fictitious regulation. **Acceptance:** a jurisdiction-timeline
answer reconciles to registry rows; exposure figures reproduce via the calculator;
asked about a rumoured future policy, the copilot reports only what the registry's
status field supports.