# Green Building Valuation
**Module ID:** `green-building-valuation` · **Route:** `/green-building-valuation` · **Tier:** B (frontend-computed) · **EP code:** EP-DE1 · **Sprint:** DE

## 1 · Overview
Quantifies the green premium and climate-adjusted value of certified buildings using GRESB, LEED, BREEAM, and NABERS benchmarks. Models energy performance certificates, carbon intensity pathways, and stranded asset risk under net-zero transition scenarios.

> **Business value:** Critical for real estate investors, REITs, and mortgage lenders assessing transition risk. Quantifies green premium to justify sustainability capex, identifies stranding year to sequence divestment, and aligns with EU Taxonomy Art.10 for sustainable finance labelling.

**How an analyst works this module:**
- Select asset class and certification level
- Input energy use intensity and floor area
- Run CRREM pathway comparison to identify stranding year
- Stress-test rental income under brown discount scenarios
- Export valuation report with EU Taxonomy alignment flags

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `CERTS`, `CITIES`, `CRREM_BUDGET`, `Card`, `EPC`, `KpiCard`, `PROPERTIES`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['Office','Retail','Industrial','Residential','Hotel','Mixed-Use'];` |
| `CRREM_BUDGET` | `{ Office: 35, Retail: 40, Industrial: 60, Residential: 25, Hotel: 45, 'Mixed-Use': 38 };` |
| `type` | `TYPES[Math.floor(sr(i * 7)  * TYPES.length)];` |
| `city` | `CITIES[Math.floor(sr(i * 11) * CITIES.length)];` |
| `epc` | `EPC[Math.floor(sr(i * 13)   * EPC.length)];` |
| `cert` | `CERTS[Math.floor(sr(i * 17) * CERTS.length)];` |
| `epcIdx` | `EPC.indexOf(epc); // 0=A (best), 6=G (worst)` |
| `greenPremium` | `parseFloat(((certBonus + (6 - epcIdx) * 0.012 + sr(i * 23) * 0.03 - 0.01) * 100).toFixed(1));` |
| `size` | `Math.round(500  + sr(i * 3)  * 14500);` |
| `energy` | `Math.round(50   + epcIdx * 58 + sr(i * 5) * 75);` |
| `carbon` | `Math.round(15   + epcIdx * 23 + sr(i * 9) * 38);` |
| `vpsm` | `Math.round(2500 + sr(i * 19) * 12500);` |
| `value` | `parseFloat((vpsm * size / 1e6).toFixed(2));` |
| `noi` | `parseFloat((value * (0.04 + sr(i * 41) * 0.025)).toFixed(3));` |
| `overshoot` | `Math.max(0, carbon - budget);` |
| `strandYr` | `overshoot === 0 ? 2060 : Math.min(2055, Math.round(2025 + (budget / (overshoot + 1)) * 7 + sr(i * 37) * 4));` |
| `retCapex` | `parseFloat((size * (0.03 + epcIdx * 0.018 + sr(i * 31) * 0.12) / 1e6).toFixed(2));` |
| `avgPrem` | `n ? (filtered.reduce((s,p) => s + p.greenPremium, 0) / n).toFixed(1) : '0.0';` |
| `portVal` | `filtered.reduce((s,p) => s + p.value, 0).toFixed(0);` |
| `avgEnergy` | `n ? (filtered.reduce((s,p) => s + p.energy, 0) / n).toFixed(0) : '0';` |
| `avgCarbon` | `n ? (filtered.reduce((s,p) => s + p.carbon, 0) / n).toFixed(1) : '0';` |
| `totalCapex` | `filtered.reduce((s,p) => s + p.retCapex, 0).toFixed(1);` |
| `epcDist` | `useMemo(() => EPC.map(r => {` |
| `certPrem` | `useMemo(() => CERTS.map(c => {` |
| `strandData` | `useMemo(() => TYPES.map(t => {` |
| `retrofitRows` | `useMemo(() => [...filtered] .sort((a,b) => b.retCapex - a.retCapex).slice(0, 20).map(p => { const annCarbon = p.size * p.carbon * carbonPx / 1e6;` |
| `annEnergy` | `p.size * p.energy * energyPx / 100 / 1e6;` |
| `ann` | `annCarbon + annEnergy;` |
| `npv10` | `Array.from({length:10},(_,yr) => ann / Math.pow(1 + dr/100, yr+1)).reduce((s,v) => s+v, 0);` |
| `roi` | `p.retCapex > 0 ? ((npv10 - p.retCapex) / p.retCapex * 100).toFixed(0) : 'N/A';` |
| `payback` | `ann > 0 ? (p.retCapex / ann).toFixed(1) : '—';` |
| `base` | `n ? filtered.reduce((s,p) => s + p.carbon, 0) / n : 75;` |
| `marketData` | `useMemo(() => TYPES.map(t => {` |
| `scatter` | `useMemo(() => filtered.map(p => ({ x: p.energy, y: p.carbon })), [filtered]);` |
| `val` | `row.props.reduce((s,p) => s + p.value, 0).toFixed(1);` |
| `pct` | `n ? (cnt / n * 100).toFixed(0) : 0;` |
| `avg` | `a.length ? a.reduce((s,p) => s + p.carbon, 0) / a.length : 0;` |
| `prem` | `a.length ? (a.reduce((s,p) => s + p.greenPremium, 0) / a.length).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CERTS`, `CITIES`, `EPC`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Premium | — | JLL/CBRE Transaction Data 2023 | Certified buildings command 7–12% rental premium and 10–18% capital value uplift over uncertified peers |
| CRREM Stranding Year | — | CRREM v2.0 1.5°C Pathway | Year at which building carbon intensity exceeds decarbonisation pathway — triggers stranded asset risk |
| EUI Benchmark | — | EU EPC Directive 2023 | Energy Use Intensity for commercial offices; NZEB target <50 kWh/m²/yr |
- **GRESB asset-level submissions** → ESG scoring + peer benchmarking → **Portfolio GRESB score, green star rating, sector percentile**
- **CRREM pathway data by property type/country** → Stranding year calculation → **Year of pathway breach + cumulative capex to comply**
- **EPC registry + utility bills** → EUI normalisation → **Climate-adjusted EUI removing weather variation**

## 5 · Intermediate Transformation Logic
**Methodology:** Green Premium / Climate-Adjusted Valuation
**Headline formula:** `GreenPremium = (RentGreen - RentBrown) / RentBrown × 100; StrandedRisk = max(0, CarbonIntensity - SectorDecarbPath)`

Computes energy use intensity (EUI kWh/m²/yr), embodied carbon (kgCO2e/m²), and rental/capital value premium versus brown-discount peers

**Standards:** ['GRESB Real Estate Assessment', 'LEED v4.1', 'BREEAM 2018', 'EU Taxonomy Art.10 DNSH', 'CRREM 1.5°C Pathways']
**Reference documents:** GRESB Real Estate Assessment Framework 2024; CRREM v2.0 Carbon Risk Real Estate Monitor; EU Taxonomy Delegated Act Art.10 Climate Change Mitigation; UNEP FI Portfolio Impact Analysis — Real Estate; JLL Green Premium Research 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `BuiltEnvironmentAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-DE1) describes green-premium and
> CRREM-stranding valuation. The code *does* implement a green premium, a CRREM-style carbon budget, a
> stranding-year heuristic and a 10-year retrofit NPV — closer to the guide than most peers. But the
> guide's stranding formula (`StrandedRisk = max(0, CarbonIntensity − SectorDecarbPath)`) is only a
> *snapshot overshoot*; the code turns that overshoot into a **year** via a hand-tuned inverse formula,
> and every property attribute is seeded. Sections below document the real code; §8 specifies the
> production CRREM-pathway model.

### 7.1 What the module computes

Per synthetic property (type ∈ 6 classes; EPC A–G; certification tier):
```js
epcIdx      = EPC.indexOf(epc)                       // 0=A best … 6=G worst
greenPremium = (certBonus + (6 − epcIdx)·0.012 + sr·0.03 − 0.01) · 100   // %
energy      = ⌊50 + epcIdx·58 + sr·75⌋               // kWh/m²/yr (worse EPC → higher)
carbon      = ⌊15 + epcIdx·23 + sr·38⌋               // kgCO₂/m²/yr
value       = vpsm · size / 1e6                      // $M (vpsm = $2500–15000/m²)
noi         = value · (0.04 + sr·0.025)              // 4–6.5% cap-rate income
overshoot   = max(0, carbon − CRREM_BUDGET[type])    // kgCO₂/m² above budget
strandYr    = overshoot==0 ? 2060 : min(2055, ⌊2025 + (budget/(overshoot+1))·7 + sr·4⌋)
retCapex    = size · (0.03 + epcIdx·0.018 + sr·0.12) / 1e6              // $M
```
Retrofit economics (top-20 by capex): annual carbon+energy saving → 10-yr discounted NPV → ROI, payback.

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `CRREM_BUDGET` (kgCO₂/m²) | Office 35, Retail 40, Industrial 60, Residential 25, Hotel 45, Mixed 38 | **CRREM-style** per-type budgets (illustrative, not the full year-by-year 1.5 °C pathway) |
| Green-premium base | `certBonus + (6−epcIdx)·0.012` | +1.2 pp per EPC notch above G; synthetic |
| Energy vs EPC | `50 + epcIdx·58` | +58 kWh/m² per EPC notch; synthetic anchor |
| Carbon vs EPC | `15 + epcIdx·23` | +23 kgCO₂/m² per notch; synthetic |
| `vpsm` | `2500 + sr·12500` ($/m²) | synthetic value density |
| NOI yield | `0.04 + sr·0.025` | 4–6.5% cap rate; synthetic |
| Stranding constant | `(budget/(overshoot+1))·7` | **hand-tuned inverse** — larger overshoot → earlier stranding |
| Retrofit capex | `0.03 + epcIdx·0.018 + sr·0.12` of size | worse EPC → deeper (costlier) retrofit |

The EPC-linked structure (worse EPC ⇒ more energy, more carbon, bigger premium-to-close, deeper retrofit)
is internally coherent, but the coefficients are chosen, not fitted; the `sr()` term randomises within each.

### 7.3 Calculation walkthrough

Seed properties → per property compute energy/carbon from EPC, value from vpsm×size, NOI from value,
overshoot vs `CRREM_BUDGET[type]`, and `strandYr` from overshoot. Portfolio KPIs: `avgPrem`, `portVal`,
`avgEnergy`, `avgCarbon`, `totalCapex`. Retrofit table discounts annual carbon (`size·carbon·carbonPx`)
+ energy (`size·energy·energyPx`) savings over 10 years at rate `dr` to `npv10`, then
`roi = (npv10 − retCapex)/retCapex·100`, `payback = retCapex/annualSaving`.

### 7.4 Worked example

Office, EPC = D (`epcIdx = 3`), `size = 10,000 m²`, `sr`-terms ≈ mid (0.5):
- `carbon = ⌊15 + 3·23 + 0.5·38⌋ = ⌊15+69+19⌋ = 103 kgCO₂/m²`
- `overshoot = max(0, 103 − 35) = 68`
- `strandYr = min(2055, ⌊2025 + (35/(68+1))·7 + 0.5·4⌋) = ⌊2025 + (0.507·7) + 2⌋ = ⌊2025 + 3.55 + 2⌋
  = 2030`. A heavily-overshooting office strands ~2030 — the inverse form makes stranding earlier as the
  overshoot grows, matching CRREM intuition, though the "×7" scaling is arbitrary rather than pathway-derived.
- `greenPremium = (certBonus + (6−3)·0.012 + 0.5·0.03 − 0.01)·100`. With `certBonus≈0.02`:
  `(0.02 + 0.036 + 0.015 − 0.01)·100 = 0.061·100 = 6.1%`.

### 7.5 Data provenance & limitations

- **All properties synthetic**, seeded by `sr(seed)=frac(sin(seed+1)·10⁴)`.
- `CRREM_BUDGET` is a **single scalar per type**, not the CRREM year-by-year declining pathway — so
  stranding is derived from a static budget breach, not a curve crossing.
- `strandYr` uses a hand-tuned `×7` inverse mapping capped at 2055 (or 2060 if no overshoot); it is a
  heuristic, not CRREM's actual intersection of asset trajectory and pathway.
- Green premium is a seeded function of EPC, not a hedonic regression on transactions.
- Retrofit NPV omits capex phasing, residual value, and rent/vacancy effects.

**Framework alignment:** CRREM (Carbon Risk Real Estate Monitor) — real CRREM publishes country×type
1.5 °C/2 °C pathways (kgCO₂/m²/yr declining to ~2050) and defines the *stranding year* as the first year an
asset's intensity exceeds the pathway; this module approximates that with a fixed budget and inverse
formula. GRESB, LEED, BREEAM, NABERS (certification bonus in the premium); EU Taxonomy Art. 10 climate-
change-mitigation and EPC A–G as the regulatory frame. §8 replaces the scalar budget with the real pathway.

## 8 · Model Specification — CRREM-Pathway Stranding & Climate-Adjusted Valuation

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute each asset's stranding year (pathway crossing), the retrofit capex to avoid it, and a climate-
adjusted value that prices in transition risk — for REIT/lender transition-risk assessment and EU
Taxonomy alignment.

### 8.2 Conceptual approach
Use the **CRREM decarbonisation-pathway crossing** methodology directly, benchmarked against CRREM v2 and
GRESB transition-risk analytics and MSCI Climate VaR for real estate: project the asset's carbon-intensity
trajectory (post any planned retrofits) and find the first year it exceeds the country×type 1.5 °C pathway;
capitalise the resulting brown-discount into value.

### 8.3 Mathematical specification
```
Asset trajectory: CI_asset(t) = CI_0 · Π(1 − r_retrofit,k for retrofits before t) · (grid decarb factor)
CRREM pathway:     CI_path,type,country(t)   (published declining curve)
StrandingYear = min{ t : CI_asset(t) > CI_path(t) }
Excess carbon cost: EC(t) = max(0, CI_asset(t) − CI_path(t)) · Area · CarbonPrice(t)
Retrofit-to-align capex: min Σ cost_k  s.t.  CI_asset(t) ≤ CI_path(t) ∀ t≤horizon
Climate-adjusted value = Σ_t (NOI_t − EC(t) − amortised retrofit_t)/(1+r)^t
Green premium (hedonic): ln(Rent) = α + β·Certified + γ·EPCband + δ·Controls  → premium = e^β − 1
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `CI_path` | CRREM 1.5 °C pathway by type/country | CRREM v2 public pathway tables |
| `CI_0` | current intensity | metered energy × grid EF |
| grid decarb | grid EF trajectory | IEA/national (platform refdata) |
| `CarbonPrice(t)` | transition price path | EU ETS / NGFS |
| `β, γ` | premium coefficients | hedonic regression on transactions (MSCI/JLL) |
| `r` | discount rate | cap-rate build-up |

### 8.4 Data requirements
Per asset: metered energy by fuel, area, type, country, planned retrofits, NOI, rent, EPC. Pathways: CRREM
tables (free). Grid EFs, carbon-price path, premium coefficients. The module already holds type, area, EPC,
value, NOI as seeds — replace with real asset data; ingest CRREM pathways as reference data.

### 8.5 Validation & benchmarking plan
Reconcile stranding years against CRREM's own tool on shared assets; validate climate-adjusted value
against MSCI Climate VaR real-estate outputs; backtest green-premium coefficients on out-of-sample
transactions; sensitivity of stranding year to grid-decarb and retrofit assumptions.

### 8.6 Limitations & model risk
Pathway choice (1.5 vs 2 °C) swings stranding years materially — report both. Grid decarbonisation is
exogenous and uncertain. Hedonic premiums carry selection bias (control for grade/location). Conservative
fallback: report stranding year as a band across grid/carbon-price scenarios rather than a point.

## 9 · Future Evolution

### 9.1 Evolution A — Real green premium and year-by-year CRREM stranding (analytics ladder: rung 1 → 2)

**What.** §7 documents real formulae over synthetic inputs: `GreenPremium = (RentGreen − RentBrown)/RentBrown × 100` and `StrandedRisk = max(0, CarbonIntensity − SectorDecarbPath)` are computed, and EUI/embodied-carbon/premium are structured correctly, but all properties are `sr()`-seeded and `CRREM_BUDGET` is a single scalar per building type rather than the CRREM year-by-year declining pathway — so stranding is a static gap, not a stranding-year projection. Evolution A grounds the inputs and upgrades the stranding model: real property EUI/EPC data (from the platform's EPC feed), real rent benchmarks for the green-vs-brown premium, and the full CRREM 1.5°C declining intensity pathway so each asset gets a projected stranding year, not just a current gap.

**How.** (1) Replace seeded properties with a real/user-supplied asset register carrying EUI, EPC, and rent. (2) The green premium computed from matched green-vs-brown rent benchmarks. (3) Replace the scalar `CRREM_BUDGET` with the year-by-year CRREM pathway per property type, computing the crossover year where carbon intensity exceeds the declining budget — the true stranding-year metric.

**Prerequisites.** EPC/EUI data and rent benchmarks (wave-1 EPC source); the CRREM pathway curves by type/region; seeded properties replaced. **Acceptance:** stranding is reported as a projected year from the CRREM pathway crossover, not a static gap; the green premium derives from real rent benchmarks; no `sr()` property drives a headline.

### 9.2 Evolution B — Climate-value and stranding copilot (LLM tier 2)

**What.** A copilot for real-estate investors and valuers: "what green premium does this LEED-certified office command, and when does the brown peer strand under CRREM 1.5°C?" tool-calls the Evolution A valuation and stranding endpoints, narrating climate-adjusted value and the stranding-year projection.

**How.** Tier-2 tool-calling over the valuation/stranding endpoints; the grounding corpus is §5/§7 (GRESB/LEED/BREEAM/NABERS benchmarks, the green-premium and CRREM stranding formulae). The copilot's value is quantifying transition risk in property terms — how many years until an asset breaches its carbon budget and what the green premium is worth. Guardrail, pre-Evolution-A: properties are seeded and CRREM is a scalar, so it must flag stranding as a static gap not a year. Every premium and stranding figure validated against tool output.

**Prerequisites.** Evolution A (seeded inputs and scalar CRREM limit current answers); corpus embedding. **Acceptance:** post-Evolution-A, every green-premium and stranding-year figure traces to a tool call using the real CRREM pathway; pre-Evolution-A the copilot reports stranding as a current gap and flags the limitation.