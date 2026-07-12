## 7 · Methodology Deep Dive

The module presents itself as, and the guide describes, a **probabilistic NatCat loss engine** (EP curves,
AAL, PML, RCP climate uplift). What the code actually contains is a **pre-baked EP lookup table** plus
fixed RCP multipliers — no hazard/vulnerability/exposure convolution and no event-loss simulation run.
The displayed EP curve and AAL are stored numbers scaled by a scenario constant, not computed from a
10,000-year simulation.

### 7.1 What the module computes

Headline losses are a stored base scaled by a scenario multiplier:

```js
mult   = SCENARIO_MULT[scenario]                 // 1.0 / 1.24 / 1.61 / 2.38
aal    = 1820 · mult · 1e6                       // $1.82Bn base AAL
pml100 = 3100 · mult · 1e6                       // $3.1Bn base 100-yr PML
pml250 = 4600 · mult · 1e6                       // $4.6Bn base 250-yr PML
pmlPct = pml100 / (portfolioValue · 1e9) · 100
```

The EP curve (`EP_DATA`) is a **hand-authored return-period → loss table** at 11 return periods (1…1000
yr), with four pre-computed columns (current, RCP 4.5, RCP 8.5 2050, RCP 8.5 2100). The scenario selector
simply picks which stored column to plot — it does not re-derive the curve.

### 7.2 Parameterisation / scoring rubric

| Constant | Values | Provenance |
|---|---|---|
| `SCENARIO_MULT` | Current 1.0 · RCP 4.5(2050) 1.24 · RCP 8.5(2050) 1.61 · RCP 8.5(2100) 2.38 | Author calibration (IPCC AR6-flavoured hazard uplift) |
| `EP_DATA.currentLoss` | 1yr $180M → 100yr $3.1Bn → 1000yr $8.4Bn | Hand-authored, monotone-increasing |
| `EP_DATA.rcp85Loss` | ≈ current × 1.6 at each RP | Hand-authored (roughly the RCP8.5 multiplier applied) |
| Base AAL / PML | 1820 / 3100 / 4600 ($M) | Hand-set anchors |
| `AAL_BY_PERIL` | `100 + sr(i·7)·400` ($M) × scenario mult | **Synthetic** (`sr()` seeded per peril) |
| `PORTFOLIO_EXPOSURE` | TIV, insured, AAL%, PML100% per region | Synthetic (`sr()` seeded) |

The `exceedancePct` column is genuinely `1/returnPeriod·100` — the correct annual exceedance probability
for a return period. So the *return-period ↔ probability* mapping is right; only the *loss* values are
stored rather than modelled.

### 7.3 Calculation walkthrough

`SCENARIO_MULT[scenario]` → scales the base AAL/PML anchors → KPI cards. `epFiltered` selects the stored
loss column matching the scenario for the EP-curve chart. `AAL_BY_PERIL` seeds a per-peril current AAL and
multiplies by the three scenario factors. `SCENARIO_COMPARISON` scales the AAL/PML anchors and adds a small
`sr()` jitter to frequency/severity change. No convolution, no simulation, no vulnerability functions.

### 7.4 Worked example (RCP 8.5 2050, $25Bn portfolio)

`mult = 1.61`:

| Metric | Computation | Result |
|---|---|---|
| AAL | `1820 · 1.61` | **$2,930M** |
| PML 100-yr | `3100 · 1.61` | **$4,991M** |
| PML 250-yr | `4600 · 1.61` | **$7,406M** |
| PML % of portfolio | `4991 / 25000 · 100` | **20.0 %** |
| Climate AAL uplift | `(1.61 − 1)·100` | **+61 %** vs current |

The 100-yr PML from the EP table (`rcp85Loss` at rp=100 = $4,990M) exactly matches the anchor-scaled
`pml100` — confirming the two representations are the same stored value under two names, not independent
estimates.

### 7.5 Data provenance & limitations

- **The EP curve is a static hand-authored lookup; AAL/PML are anchor×multiplier.** Per-peril and
  per-region tables are `sr()`-seeded synthetic (`sr(s)=frac(sin(s+1)·10⁴)`). No exposure file is ingested
  despite the guide's upload workflow.
- **No probabilistic mechanics:** the guide's convolution of hazard-intensity × vulnerability × exposure
  and 10,000-year event-loss simulation do **not** run. AAL is not `∫ EP-curve`; it is a stored anchor.
- RCP multipliers are single scalars applied uniformly to every return period and peril — real climate
  conditioning intensifies the tail (high return periods) more than the body.

**Framework alignment:** The **return-period → annual-exceedance-probability** relation (`P = 1/T`) and the
**PML_T = EP⁻¹(1/T)** framing follow standard cat-modelling (AIR/RMS) and **EIOPA Solvency II NatCat**
practice. RCP scenario labelling follows **IPCC AR6**. But the engine is descriptive: it displays a
plausible EP curve rather than building one, so a bank/insurer model-validation team would treat the AAL
and PML as illustrative, not capital-grade — motivating §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The EP curve is stored, not simulated. Below is
the production probabilistic cat-loss model.

### 8.1 Purpose & scope
Compute portfolio AAL, PML at any return period, and climate-conditioned loss uplift for property/
infrastructure portfolios across 8 perils, for reinsurance pricing, Solvency II SCR, and TCFD physical-risk
disclosure.

### 8.2 Conceptual approach
The standard four-module cat pipeline (hazard → vulnerability → financial → EP aggregation), per **AIR
Touchstone / RMS RiskLink** architecture, with climate conditioning of the hazard module per **IPCC AR6**
and Swiss Re/Munich Re climate-adjusted event sets. Loss aggregation via a simulated Year-Loss-Table (YLT).

### 8.3 Mathematical specification
Event *e* ground-up loss at site *s*: `L_{e,s} = TIV_s · MDR(I_{e,s}; construction, occupancy)`, where
`MDR` is the mean damage ratio from a vulnerability curve and `I_{e,s}` the hazard intensity. Site loss
distribution → secondary uncertainty (Beta) → portfolio event loss `L_e = Σ_s (L_{e,s} net of
deductible/limit)`. Simulate N≥10,000 years drawing events from a Poisson frequency `λ_peril` and the
stochastic event catalogue → YLT. `AAL = (1/N)·Σ_years Σ_events L`. EP curve: sort annual max (OEP) or
annual aggregate (AEP) losses; `PML_T = quantile(1 − 1/T)`. Climate conditioning: scale `λ` and `I`
distributions by peril-specific RCP factors `(κ_freq, κ_sev)` from AR6.

| Parameter | Source |
|---|---|
| Frequency λ_peril | Historical catalogue (EM-DAT, NOAA, USGS) |
| Vulnerability MDR | Engineering damage functions (FEMA Hazus, RMS) |
| RCP factors κ | IPCC AR6 WG1 Ch.11 extremes |
| Secondary uncertainty | Beta CoV by peril |
| Exposure TIV | Portfolio geocoded asset file |

### 8.4 Data requirements
Geocoded exposure (location, construction, occupancy, TIV, policy terms), stochastic event catalogues per
peril/region, vulnerability curve library, AR6 climate factors. Platform has none of these live; EP_DATA is
a placeholder.

### 8.5 Validation & benchmarking plan
Reconcile AAL/PML against a licensed vendor model (AIR/RMS) on a shared portfolio; backtest annual losses
against historical (EM-DAT/Swiss Re sigma); stability of tail quantiles vs simulation count; Solvency II
199-yr (99.5%) OEP check.

### 8.6 Limitations & model risk
Cat models carry large structural uncertainty (especially in the tail and under climate change); vendor-
model divergence is material. Conservative fallback: blend multiple vendor views, apply a climate loading,
and report PML with confidence bands rather than point estimates.
