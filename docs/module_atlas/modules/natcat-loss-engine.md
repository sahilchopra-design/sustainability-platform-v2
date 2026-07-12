# NatCat Loss Engine
**Module ID:** `natcat-loss-engine` · **Route:** `/natcat-loss-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Probabilistic natural catastrophe loss modelling engine covering flood, windstorm, earthquake, wildfire, and tropical cyclone perils using industry-standard exceedance probability (EP) curve methodology. Computes average annual loss (AAL), probable maximum loss (PML), and return period loss estimates for property and infrastructure portfolios. Integrates RCP/SSP climate change factors to project loss escalation under warming scenarios.

> **Business value:** Enables insurers, reinsurers, and real asset managers to quantify, stress test, and disclose natural catastrophe loss exposure with climate change projection, supporting reinsurance structuring, Solvency II SCR computation, and TCFD physical risk quantification.

**How an analyst works this module:**
- Upload property or infrastructure exposure file with location, construction type, occupancy, and insured value
- Select perils and regional hazard modules and set climate change scenario and projection year
- Run probabilistic loss analysis and review EP curve, AAL, and return period loss table
- Decompose losses by peril, region, and construction class to identify concentration risk
- Export PML table and EP curves for reinsurance treaty pricing, regulatory capital calculation, and TCFD physical risk disclosure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AAL_BY_PERIL`, `EP_DATA`, `Kpi`, `PERILS`, `PERIL_COLORS`, `PORTFOLIO_EXPOSURE`, `RADAR_DATA`, `REGIONS`, `SCENARIOS`, `SCENARIO_COMPARISON`, `SCENARIO_MULT`, `Section`, `Sel`, `TabBar`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(d)}K` : `$${n.toFixed(d)}`;` |
| `pct` | `(n, d = 1) => `${(n * 100).toFixed(d)}%`;` |
| `REGIONS` | `['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa'];` |
| `EP_DATA` | `[1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000].map((rp, i) => ({` |
| `AAL_BY_PERIL` | `PERILS.map((p, i) => ({` |
| `PORTFOLIO_EXPOSURE` | `REGIONS.map((r, i) => ({` |
| `SCENARIO_COMPARISON` | `SCENARIOS.map((s, i) => ({` |
| `RADAR_DATA` | `PERILS.map((p, i) => ({` |
| `aal` | `Math.round(1820 * mult * 1e6);` |
| `pml100` | `Math.round(3100 * mult * 1e6);` |
| `pml250` | `Math.round(4600 * mult * 1e6);` |
| `pmlPct` | `((pml100 / (portfolioValue * 1e9)) * 100).toFixed(1);` |
| `epFiltered` | `EP_DATA.map(d => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EP_DATA`, `PERILS`, `REGIONS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Annual Loss (USD) | — | EP curve integration | Long-run expected annual loss from natural catastrophe events per insured or exposure portfolio |
| PML 250-year (USD) | — | EP curve at T=250 return period | Loss expected to be exceeded once in 250 years; typical regulatory and reinsurance treaty reference point |
| Climate Change AAL Uplift (%) | — | RCP 8.5 climate factor application | Percentage increase in AAL under RCP 8.5 2050 climate change relative to current climate baseline |
| Coefficient of Variation (AAL) | — | Loss distribution moments | Ratio of standard deviation to mean of simulated annual losses; higher values indicate greater loss volatility |
- **Property exposure data (geocoded)** → Geocode to peril hazard grid; look up hazard intensity from regional hazard module → **Site-level hazard intensity distribution per peril**
- **Vulnerability function library** → Match construction type and occupancy to damage function; compute mean damage ratio per intensity → **Site-level loss ratio distribution for convolution with exposure**
- **EP curve aggregation engine** → Simulate 10,000 event loss table years; sort; build exceedance probability curve → **Portfolio EP curve, AAL, PML table, and return period loss estimates**

## 5 · Intermediate Transformation Logic
**Methodology:** Probable Maximum Loss
**Headline formula:** `PMLᵀ = EP_curve⁻¹(1/T)`

The PML at return period T is read from the site exceedance probability curve, derived by convolving hazard intensity distribution, vulnerability function, and financial exposure. Climate change factors multiply hazard intensity distributions per RCP scenario following IPCC AR6 probabilistic projections for each peril. AAL is the integral of the EP curve across all return periods.

**Standards:** ['AIR Worldwide Catastrophe Modelling Methodology', 'RMS Risk Modelling Platform Documentation', 'ISO 31010:2019 Risk Assessment Techniques', 'IPCC AR6 WG1 Extremes Assessment Chapter 11']
**Reference documents:** AIR Worldwide Touchstone Catastrophe Modelling Platform Documentation; RMS Risk Intelligence NatCat Methodology Guide; IPCC AR6 Working Group I Chapter 11 â€” Weather and Climate Extreme Events 2021; Lloyd’s of London Realistic Disaster Scenarios 2023; EIOPA NatCat Methodology for Solvency II Standard Formula

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — From EP lookup table to computed exceedance curves (analytics ladder: rung 1 → 3)

**What.** §7 documents the gap plainly: despite the "probabilistic loss engine" framing, the code is a pre-baked lookup — `EP_DATA` is a hand-authored 11-point return-period table with four pre-computed scenario columns, and headline AAL/PML are stored anchors ($1.82Bn/$3.1Bn/$4.6Bn) scaled by fixed `SCENARIO_MULT` constants (1.0/1.24/1.61/2.38). No hazard-vulnerability-exposure convolution runs. Evolution A computes EP curves from the platform's own hazard data over a real exposure set.

**How.** (1) Reuse the Physical Risk Digital Twin: the populated `ref_*_zones` grids (earthquake 4,500 / cyclone 4,470 / wildfire 5,378 rows from USGS/IBTrACS/GWIS) and the `global_physical_risk_engine` scoring path give per-location hazard frequency-intensity; the sibling `physical-risk-pricing` engine already fits return-period loss points — this module becomes its portfolio-level aggregation layer rather than a parallel implementation. (2) Accept the §1-described exposure upload (location, construction, occupancy, TIV), apply peril-specific vulnerability curves (FEMA Hazus damage functions are public), and derive the EP curve empirically from simulated annual maxima; AAL = numerical integral of the curve, PML_T read off it per the §5 formula. (3) Climate uplift moves from one scalar to per-peril AR6 hazard-frequency multipliers, documented per Atlas §8.

**Prerequisites.** Flood grid is thin (48 rows) — flood EP claims must carry a coverage caveat until FEMA NFHL/JRC gridding lands; a fixed-seed simulation reference case pinned in `bench_quant`. **Acceptance:** two portfolios with different geography produce different EP curves (today all inputs yield the same stored curve); AAL equals the integral of the displayed curve within tolerance.

### 9.2 Evolution B — Reinsurance-analyst copilot over computed EP output (LLM tier 2)

**What.** A tool-calling analyst for treaty and capital questions: "what's the 250-year PML for the US-Southeast wind book?", "how much does an RCP8.5-2050 view raise AAL?", "which construction class drives the tail?" — executed against the Evolution-A endpoints and answered strictly from returned EP/AAL/PML decompositions. Solvency II SCR and TCFD framings come from the standards already named in §5 (EIOPA NatCat methodology, IPCC AR6 Ch.11), quoted from corpus.

**How.** Tool schemas over the new `POST /natcat/run` and decomposition endpoints; system prompt from this Atlas page's §5 methodology and §7 limitation notes so the copilot correctly explains what an EP curve is and what the model does not capture (post-event demand surge, secondary uncertainty). Stochastic discipline: quoted PMLs carry simulation seed, year-count, and engine version (roadmap Tier-2 provenance UX); scenario comparisons hold the event set fixed. Fabrication validator matches all currency figures to tool outputs.

**Prerequisites (hard).** Evolution A first — there is nothing legitimate to narrate today; a copilot explaining the current stored-constant losses as "probabilistic modelling output" would misrepresent the module exactly the way its own §7 warns against. **Acceptance:** every loss figure traceable to a run ID; asking for perils/regions outside the exposure set yields a refusal listing what was actually modelled.