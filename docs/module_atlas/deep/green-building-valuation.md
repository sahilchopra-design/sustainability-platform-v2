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
