## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code note.** The MODULE_GUIDES entry headlines a **Scenario Divergence Index**
> (`SDI = Σ|Variableₜ(A) − Variableₜ(B)| / Baselineₜ`). The page's Scenario Comparison tab does
> compute a cross-scenario **spread** per variable (`vals = selScens.map(s => |s[key]|)` → range),
> but not the normalised pairwise-difference SDI as written. It also promises "scenario-conditional
> VaR and expected shortfall" — no VaR/ES is computed. Otherwise the module is unusually
> well-grounded: it is a NGFS Phase IV **scenario workbench** built on curated (not `sr()`-random)
> scenario, carbon-price, and sector-PD data, plus **real OWID/IEA/EDGAR country-emissions** data.

### 7.1 What the module computes

The frontend is largely a *display* over three curated data tables imported from
`climateRiskDataService.js`, with a few live reductions:

- **NGFS_PHASE4** — 6 canonical scenarios, each with `carbonPrice2030/2050`, `gdpImpact2030/2050`,
  `physicalRiskScore`/`transitionRiskScore` (0–10), `renewableShare2050`, `stranded2050`,
  `unemploymentPeak`, `propertyPriceDrop`, `sovereignSpreadBp`.
- **SECTOR_PD_UPLIFT** — 20 NACE sectors × 6 scenarios, PD uplift in **basis points** vs baseline.
- **CARBON_PRICE_PATHS** — 6 anchor years (2025–2050) × 6 scenarios, $/tCO₂.

Live computations on the page:
```js
// Sector PD Migration tab
sorted     = [...SECTOR_PD_UPLIFT].sort((a,b) => (b[activeSid]||0) − (a[activeSid]||0))
maxUplift  = max( SECTOR_PD_UPLIFT.map(r => r[activeSid]||0) )
avgUplift  = round( Σ (r[activeSid]||0) / SECTOR_PD_UPLIFT.length )        // mean sector PD uplift bp
// Scenario Comparison tab
selScens = NGFS_PHASE4.filter(s => selected.includes(s.id))               // up to 3 scenarios
vals     = selScens.map(s => |s[key]|)                                     // spread for the chosen variable
```
The physical-risk composite (in the shared service, used by companion country views) is:
```js
raw = Σ_hazard ( EAL_hazard × PHYSICAL_MULTIPLIER[hazard][ssp] ) / 6
score = min(10, raw × 100 × (100 − adaptCapacity)/100 × 1.8)
```

### 7.2 Parameterisation / data provenance

| Table | Values | Provenance |
|---|---|---|
| Country CO₂ 2022 | 37,500 MtCO₂ world, top-10 emitters, per-capita 4.7 t | **Real** — OWID / IEA / EDGAR 2022 (`countryEmissions.js`, CC BY 4.0) |
| NGFS_PHASE4 carbon price 2030 | NZ2050 $190, B2C $95, DNZ $230, DT $30, NDC $20, CP $10 | Curated to NGFS Phase IV ranges |
| NGFS_PHASE4 GDP 2050 | −1.2% … −4.8% | Curated to NGFS-plausible magnitudes |
| SECTOR_PD_UPLIFT | Coal 850bp (NZ) → 1100bp (DT); Renewables −80bp (NZ) | Curated stylised uplifts (bp) |
| PHYSICAL_MULTIPLIERS | flood 1.0→2.4, wildfire 1.0→3.5, heatwave 1.0→4.2 across SSP1-2.6→SSP5-8.5 | Curated SSP scalars |
| adaptCapacity, ndGain | per-country 0–100 | ND-GAIN-style, curated |

The `SECTOR_PD_UPLIFT` ordering is economically coherent: fossil-extraction sectors carry the largest
transition PD uplift and it peaks under **Delayed Transition** (the disorderly scenario), while
Renewables show a *negative* uplift (credit improvement) under orderly scenarios — the correct sign.
Physical-heavy sectors (Agriculture, Real Estate, Water) flip to their worst uplift under **Current
Policies** (hot-house), reflecting physical-risk dominance. This is the same qualitative structure as
`climate-credit-integration`'s scenario ordering.

### 7.3 Backend seeder (`ngfs_seeder.py`)

The backend seeds **24 scenarios across NGFS Phases 1–4** into `NGFSScenario` /
`NGFSScenarioParameter` / `NGFSScenarioTimeSeries` (schema: `ngfs_v2`, route `api/v1/routes/ngfs_v2.py`).
Each scenario carries full time series (`carbon_price`, `emissions`, `temperature`, `gdp_impact`) on a
2025→2100 grid. Example — Phase 1 *Orderly (Below 2°C)*: carbon price 50→320 $/t, emissions 38→−3 Gt
(net-negative post-2050), temperature 1.2→1.5 °C, GDP impact −2.0% (2030 trough) → +3.0% (2100).
*Hot House World* runs carbon price flat at 5–15 $/t, emissions 42→36 Gt, temperature to 3.5 °C, GDP
to −8.0%. These are hand-curated to reproduce the published NGFS phase archetypes, not modelled IAM
output. The frontend, however, consumes the JS `NGFS_PHASE4` table, not this API, in the code read.

### 7.4 Worked example (Sector PD Migration, Delayed Transition)

Select scenario `dt`. For the sector table:
```
Mining & Coal   = 1100 bp   (largest)  → maxUplift = 1100
Oil & Gas       =  980 bp
Electricity     =  650 bp
Renewables      =  −40 bp   (credit improves even under DT)
...
avgUplift = round( (1100+980+650+720+680+580+420+780+540+310+620+480+290+220+90+80−40+120+350+280) / 20 )
          = round( 9750 / 20 ) = 488 bp
```
So under Delayed Transition the average sector sees ~+488 bp PD uplift, with coal extraction the
worst at +1,100 bp — a >10× dispersion across the loan book, which is the headline the tab surfaces.

Carbon price 2035, DNZ (Divergent Net Zero): `CARBON_PRICE_PATHS` row 2035 → dnz = $400/t; by 2050 it
reaches $800/t (the highest terminal price, because divergent policy forces the steepest catch-up).

### 7.5 Companion analytics & interconnections

- **Financial Stability tab** — plots `sovereignSpreadBp` (CP 160 bp vs NZ2050 15 bp) and
  `propertyPriceDrop` (CP −35% vs NZ −8%) per scenario, both curated fields.
- **Regulatory Alignment tab** — maps NGFS scenarios to disclosure frameworks (`frameworks[].ngfsCount`).
- The shared `climateRiskDataService` (NGFS_PHASE4, SECTOR_PD_UPLIFT, CARBON_PRICE_PATHS,
  SECTOR_LGD_UPLIFT, PHYSICAL_MULTIPLIERS, COUNTRY_PHYSICAL_RISK, SDA_PATHWAYS) is the same source
  feeding the platform's climate stress-test and physical-risk modules — this page is the canonical
  *explorer* over that layer.

### 7.6 Data provenance & limitations

- **Country emissions are real** (OWID/IEA/EDGAR 2022); the world total (37.5 GtCO₂), per-capita
  (4.7 t), and +65% since 1990 are correct published figures.
- **Scenario, sector-PD and carbon-price tables are curated** stylised values calibrated to NGFS
  Phase IV ranges — coherent and correctly ordered, but not the exact IIASA/REMIND/MESSAGEix numbers.
- The advertised **SDI** (normalised pairwise divergence) and **scenario-conditional VaR/ES** are not
  implemented; the comparison tab shows raw cross-scenario spreads only.
- Frontend reads the JS data tables, not the richer 24-scenario backend `ngfs_v2` API — the two are
  not yet wired together.

**Framework alignment:** *NGFS Climate Scenarios Phase IV (Nov 2023)* — the 6 canonical scenarios
(Net Zero 2050, Below 2 °C, Divergent Net Zero, Delayed Transition, NDC, Current Policies) with their
orderly/disorderly/hot-house taxonomy, carbon-price and GDP-impact structure. NGFS scenarios are
produced from three IAMs (REMIND-MAgPIE, MESSAGEix-GLOBIOM, GCAM) plus NiGEM macro and physical-risk
overlays; the module reproduces their *outputs*, not the IAM runs. *SSP framework* — physical
multipliers are indexed on SSP1-2.6→SSP5-8.5. *IFRS 9 / EBA stress-testing* — the sector PD-uplift
(bp) table is the input a bank would apply to baseline PDs, exactly the NGFS-scenario→ECL channel.
