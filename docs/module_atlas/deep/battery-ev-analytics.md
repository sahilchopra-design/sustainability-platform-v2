## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes an ISO 14040/44 **lifecycle
> assessment engine** (`Battery_LCA_gCO2e_per_km = (Production + Use + EOL) / Lifetime_km`), a
> cobalt supply-risk score (`HHI × ESG_country_risk`), charging-grid carbon intensity by region,
> and an EU Battery Regulation carbon-footprint declaration generator. **None of this exists in
> code.** The page (EP-BO2) is a five-tab *market-intelligence dashboard*: battery cost learning
> curves, EV sales/penetration, chemistry mix forecast, a gigafactory capacity table, and a
> chemistry comparison. There is no LCA, no gCO₂e anywhere, no HHI computation, and no supply-risk
> scoring (that lives in the sibling module `battery-tech-supply-chain`). Sections below document
> the code.

### 7.1 What the module computes

Only one dataset is *computed* (the rest are curated constants):

```js
// Battery cost learning curve, i = 0..10 over years 2010–2030 (2-year steps)
pack_avg    = round(1100 × 0.82^i)          // 18% decline per 2-year step
nmc         = round(1050 × 0.81^i)
lfp         = round(980  × 0.80^i)
solid_state = i < 7 ? null : round(380 − (i−7)×60)   // linear from 2024: 380, 320, 260, 200
```

This is a geometric (Wright/learning-curve-style) decay in *time*, not in cumulative production —
a visual approximation of the BNEF price-survey trend rather than a true experience curve.

### 7.2 Parameterisation — curated datasets

| Dataset | Content | Provenance |
|---|---|---|
| `CHEMISTRIES` (7 rows) | LFP / NMC 811 / NMC 622 / NCA / LMFP / Solid State / Na-Ion with energy density (140–400 Wh/kg), cell cost 2024/2030 ($55–280 → $38–100/kWh), cycle life (1,200–5,000), safety score, maturity, key minerals | inline comment cites "IEA Global EV Outlook 2024 / BloombergNEF Battery Price Survey"; values are hand-curated, plausible magnitudes |
| `EV_SALES` (12 rows) | BEV/PHEV/total sales 2018–2030, 2.2M → 59M | curated forecast-shaped literals |
| `EV_PENETRATION` (6 regions) | 2024 vs 2030 penetration (China 38→72%, Europe 22→55%, USA 9→28%, …) with policy targets (ICE ban 2035, IRA, FAME III) | curated; policy labels are real regulations |
| `GIGAFACTORIES` (11 rows) | CATL 660 GWh, BYD 380, Tesla 270, … Northvolt 60 (status "Distressed") | curated capacity estimates |
| `CHEM_MIX` (6 rows) | market-share forecast 2020–2030: LFP 20→56%, NMC 62→28%, NCA 12→2%, LMFP 0→8%, solid 0→3%, Na-ion 0→3% | curated |

No PRNG is used for the displayed data (`sr` is defined but effectively unused for the headline
datasets) — this module's numbers are *editorial* rather than seeded-random.

### 7.3 Calculation walkthrough

1. **Battery Cost Curves tab** — plots the §7.1 series with a log-ish decline; KPI cards read
   specific curve points.
2. **EV Adoption** — stacked BEV/PHEV area chart + regional penetration bars (2024 vs 2030) with
   target annotations.
3. **Chemistry Mix** — stacked-area market-share forecast from `CHEM_MIX`.
4. **Gigafactories** — capacity table/bars, colour-coded by status
   (Operating/Construction/Distressed/Planned).
5. **Chemistry Comparison** — scatter/table over `CHEMISTRIES` (energy density vs cost vs cycle
   life vs safety).

There are no derived risk scores, aggregations or user-driven calculations beyond tab selection.

### 7.4 Worked example — cost curve points

For `pack_avg = 1100 × 0.82^i`:

| Year | i | 0.82^i | pack_avg |
|---|---|---|---|
| 2010 | 0 | 1.000 | $1,100/kWh |
| 2018 | 4 | 0.4521 | $497 |
| 2024 | 7 | 0.2493 | **$274** |
| 2030 | 10 | 0.1374 | **$151** |

Note the internal inconsistency this creates: the curve says the 2024 *pack average* is $274/kWh,
while the `CHEMISTRIES` table says 2024 *cell* costs are $55–92/kWh (solid-state excepted) — and
the real 2024 BNEF survey pack average was ≈$115/kWh. The decay constant was evidently chosen for
visual shape from the $1,100 2010 anchor (which is accurate) rather than calibrated to recent
survey points.

### 7.5 Data provenance & limitations

- All data is **hand-curated demo content**; the only cited sources are an inline comment (IEA
  Global EV Outlook 2024, BNEF Battery Price Survey) with no vintages or per-value citations.
  Gigafactory capacities and the Northvolt "Distressed" status reflect roughly the 2024 news
  cycle and will go stale.
- The 2024 pack-average point overshoots the BNEF survey by ~2.4× (§7.4).
- Nothing in the guide's methodology section is implemented: no lifecycle stages, no material
  emission factors, no lifetime-km allocation, no recycling credits, no mineral concentration
  math, no grid-EF lookup.
- No interactivity beyond tabs — no model selection, sliders, or portfolio aggregation as the
  guide's user-interaction list describes.

### 7.6 Framework alignment

- **ISO 14040/14044 (guide reference)** — not implemented; a compliant battery LCA would define a
  functional unit (kWh delivered or km driven), system boundary (cradle-to-grave), and allocate
  production emissions over lifetime energy throughput. Nothing on the page performs this.
- **EU Battery Regulation 2023/1542 (guide reference)** — mandates carbon-footprint declarations
  for EV batteries (phased from 2025) using PEFCR-based rules; no declaration output exists in
  code.
- **IEA Global EV Outlook / BNEF** — the module's actual (informal) alignment: its sales,
  penetration and chemistry-mix shapes track those publications' 2024 base-case narratives.
- **OECD mineral due-diligence / HHI (guide reference)** — implemented in the companion module
  `battery-tech-supply-chain` (which carries per-mineral HHI fields), not here.
