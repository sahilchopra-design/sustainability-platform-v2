## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (partial).** The guide's headline formula is
> `Carbon-Adj EV/EBITDA = (EV + Carbon Liability NPV) / EBITDA` with
> `Carbon Liability = Scope 1+2+3 × Shadow Price × (1−PassThrough) × Duration Factor`, and quotes a
> "Scope 3 Carbon Liability Share = 73%". **The code never uses Scope 3 in the carbon cost** —
> `carbonCost = (scope1 + scope2) × price × (1 − passThrough)` monetises only Scope 1+2. There is no
> explicit "Duration Factor"; duration enters implicitly as `1/(wacc − terminalGrowth)` (a perpetuity).
> `scope3Intensity` is generated per company but only feeds display, not valuation. Everything below
> reflects the code as written.

### 7.1 What the module computes

A per-company **Gordon-growth DCF with a carbon-cost overlay**, run across 4 NGFS carbon-price paths
for 60 synthetic companies. The explicit-forecast + terminal-value structure:

```js
carbonCost_y = (scope1 + scope2) × cp_y / 1e6 × (1 − carbonCostPassThrough)   // $M, cp in $/tCO2
fcf_y        = max(0, ebitda_y × 0.6 − carbonCost_y)
pv_y         = fcf_y / (1 + wacc)^(y+1)
tv           = fcf × (1 + terminalGrowth) / max(0.001, wacc − terminalGrowth) // Gordon perpetuity
tvPv         = tv / (1 + wacc)^projYears
totalEv      = Σ pv_y + tvPv
```

Revenue grows at `growthRate`; EBITDA holds the base EBITDA/revenue margin; FCF is a flat 60% of EBITDA
minus the (net-of-pass-through) carbon bill. The carbon price for forecast year *y* is drawn from the
selected NGFS path at index `min(6, floor(y / (projYears/7)))` — i.e. the 7-point path is stretched
across the projection horizon.

### 7.2 Parameterisation / scoring rubric

**NGFS carbon-price paths** (`NGFS_PATHS`, $/tCO₂, 2025→2037; ordered by ambition — provenance: NGFS
scenario carbon-price ordering, values are stylised demo levels):

| Scenario | 2025 | 2031 | 2037 | Reading |
|---|---|---|---|---|
| Net Zero 2050 | 25 | 100 | 210 | Orderly, high carbon price |
| Below 2 °C | 20 | 70 | 155 | Orderly, moderate |
| NDC | 15 | 38 | 72 | Stated policies |
| Current Policies | 10 | 18 | 30 | Hot-house, low price |

**Per-company primitives** (all `sr()`-seeded, i.e. synthetic; sector-conditioned where noted):

| Field | Generator | Provenance |
|---|---|---|
| baseEv | `1 + sr(i·7)·49` ($Bn) | synthetic demo value |
| wacc | `0.06 + sr(i·23)·0.06` | synthetic (6–12%) |
| terminalGrowth | `0.015 + sr(i·83)·0.015` | synthetic (1.5–3%) |
| scope1 | Energy 500–5000; Materials 200–2000; else 10–500 tCO₂e | synthetic, sector-tiered |
| scope2 | `scope1 × (0.1..0.4)` | synthetic |
| carbonCostPassThrough | `0.3 + sr(i·41)·0.5` (30–80%) | synthetic |
| strandedPct | Energy 10–50%; Materials 5–25%; else 0–5% | synthetic, sector-tiered |
| carbonBeta | Energy 0.8–2.0; Materials 0.4–1.2; else 0–0.4 | synthetic, sector-tiered |
| sbtiAligned | `sr(i·43) > 0.45` | synthetic boolean |

The controls (`carbonPrice` slider default 75, `ngfsScenario`, `projYears` default 10) are the only
live user inputs.

### 7.3 Calculation walkthrough

DCF tab: pick a company + NGFS scenario + horizon → `dcfCalc` builds `projYears` FCF rows, discounts
each at WACC, adds the Gordon terminal value → `totalEv`. Carbon-Cost-Scenarios tab recomputes a
one-shot carbon EV haircut `baseImpact / (wacc − terminalGrowth)` against `baseEv`. Sector-Comps tab
averages `baseEv` and `ebitda` per sector to a raw `EV/EBITDA` then applies a carbon adjustment
`evEbitda × (1 − carbonCost/avgEv × 2)`. Factor-Attribution decomposes `totalEv` into Base DCF minus
a perpetuity-capitalised carbon cost plus SBTi/green-capex tweaks.

### 7.4 Worked example (DCF, one company, 3 forecast years shown)

Company: `revenue=$20B`, `ebitda=$5B` (margin 0.25), `fcf` base `$2.5B`, `wacc=9%`,
`terminalGrowth=2%`, `scope1+scope2 = 3,000,000 tCO₂e`, `passThrough=0.5`, `growthRate=6%`,
NGFS **Net Zero 2050**, `projYears=10`.

Year 0 (2025), path index `min(6, floor(0/(10/7)))=0`, cp=25:
- `carbonCost = 3,000,000 × 25 / 1e6 × (1−0.5) = 37.5 → $37.5M = $0.0375B`
- `revenue_0 = 20 × 1.06^0 = 20`; `ebitda_0 = 20 × 0.25 = 5`; `fcf_0 = 5×0.6 − 0.0375 = 2.9625`
- `pv_0 = 2.9625 / 1.09^1 = 2.718`

Year 3 (2028), index `floor(3/1.428)=2`, cp=65: `carbonCost = 3e6×65/1e6×0.5 = 97.5 → $0.0975B`;
`revenue_3 = 20×1.06^3 = 23.82`; `ebitda_3 = 5.955`; `fcf_3 = 3.573 − 0.0975 = 3.4755`;
`pv_3 = 3.4755/1.09^4 = 2.462`.

Terminal value: `tv = 2.5 × 1.02 / (0.09 − 0.02) = 2.55/0.07 = 36.43`;
`tvPv = 36.43 / 1.09^10 = 15.39`. `totalEv ≈ Σpv (≈ $22B over 10y) + 15.39`. Rising NGFS carbon
prices progressively shave FCF — the transition-risk wedge is the FCF gap vs a zero-carbon-price run.

### 7.5 Companion analytics

- **Stranded-asset discount**: `strandedNpv = strandedPct/100 × baseEv`; `adjEv = baseEv − strandedNpv`.
- **SBTi premium**: SBTi-aligned firms carry `esgPremium` (1–3%) added to valuation.
- **Sensitivity**: WACC shocks `[-1%..+1%]` × carbon-price grid recompute `(fcf − annualCost)/(adjWacc − g)`.

### 7.6 Data provenance & limitations

- **All 60 companies are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); no real financials, emissions,
  or WACCs. NGFS path *shapes* are directionally correct but the *levels* are stylised demo numbers.
- Carbon cost omits Scope 3 entirely (contra the guide) and applies a single flat FCF/EBITDA ratio (0.6)
  rather than a modelled cash-flow bridge. No tax, working-capital, or capex schedule in FCF.
- Terminal value uses base-year FCF (`c.fcf`), not the last forecast FCF — a modelling simplification
  that slightly understates TV for growing firms.

**Framework alignment:** GHG Protocol Corporate Standard — Scope 1/2 basis of the carbon bill (Scope 3
nominally referenced but unused) · NGFS Phase IV — the four scenario price paths and their ambition
ordering · IEA NZE — the shadow-price levels the guide benchmarks ($130/t by 2030) · WBCSD ACE / IIGCC
NZIF — the "carbon-adjusted EV" concept the sector-comps tab approximates by discounting the perpetuity-
capitalised carbon cost off enterprise value.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's Scope-1+2+3 carbon-liability-NPV
adjusted multiple with an explicit duration factor is not built. This specifies the production model.

### 8.1 Purpose & scope
Produce a defensible carbon-adjusted enterprise value and EV/EBITDA multiple for listed corporates,
capturing the present value of unpriced Scope 1+2+3 carbon liability under a scenario shadow-price deck,
net of cost pass-through and policy rebates. Supports relative-value screening and transition-risk
repricing at the single-name and sector level.

### 8.2 Conceptual approach
Carbon liability as an incremental cash-flow stream discounted into EV, benchmarked against MSCI Climate
VaR (transition-cost NPV as % of valuation) and the Dietz et al. (2023, *Nature Climate Change*) carbon-
risk valuation framework; the DCF spine follows standard Gordon-growth/two-stage practice (Damodaran).
Pass-through is modelled as a sector-specific price-elasticity parameter rather than a flat scalar.

### 8.3 Mathematical specification

```
Emissions_t = (S1 + S2 + S3) × (1 + g_emis)^t × (1 − abate_t)      abate_t from firm target curve
NetCarbon_t = Emissions_t × ShadowPrice_{scen,t} × (1 − PT_sector) × (1 − Rebate_t)
FCF_carbon_t = FCF_base_t − NetCarbon_t
CarbonLiabNPV = Σ_t NetCarbon_t/(1+wacc)^t + [NetCarbon_T·(1+g)]/(wacc−g)/(1+wacc)^T
EV_adj      = EV_base − CarbonLiabNPV
EVEBITDA_adj= (EV_base + CarbonLiabNPV_gross)/EBITDA          // liability as EV add-back for comparison
```

| Parameter | Symbol | Source |
|---|---|---|
| Shadow price path | ShadowPrice | NGFS Phase IV / IEA NZE ($/tCO₂) |
| Sector pass-through | PT_sector | academic elasticity estimates (e.g. cement ~0.2, utilities ~0.7) |
| Emissions growth / abatement | g_emis, abate_t | firm SBTi target + sector CRREM/IEA pathway |
| WACC, g | wacc, g | company cost of capital, GDP-linked terminal growth |
| Scope 3 | S3 | PCAF / CDP category inventory |

### 8.4 Data requirements
Company Scope 1/2/3 inventory (CDP/GRI/PCAF), reported EV & EBITDA (Bloomberg/FactSet), sector pass-
through elasticities (literature table), SBTi target and CRREM/IEA sector decarbonisation pathway.
Already in platform: NGFS scenario paths, sector taxonomy, WACC scaffolding; missing: real financials,
real emissions, elasticity table.

### 8.5 Validation & benchmarking plan
Reconcile CarbonLiabNPV-as-%-of-EV against MSCI Climate VaR transition component for overlapping names
(target within ±5pp). Backtest: do high-carbon-liability names underperform on realised returns in
carbon-price-shock windows (EU ETS 2021 spike)? Sensitivity of EV_adj to shadow-price and pass-through
(tornado). Sector-neutrality check on the adjusted multiple.

### 8.6 Limitations & model risk
Pass-through elasticities are the largest uncertainty — conservative fallback uses sector low-end PT.
Perpetuity capitalisation of a *finite* carbon liability overstates NPV if net-zero is achieved before T;
mitigate with a declining-emissions terminal treatment. Scope 3 double-counting across the value chain
must be flagged, not summed naively.
