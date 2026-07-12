## 7 · Methodology Deep Dive

This module **delivers its guide (EP-CL1)**: a supply-demand balance model for 8 transition-critical
minerals with gap projections, price-spike scenarios, substitution elasticity, and recycling-penetration
curves. The mineral data is **curated and IEA/USGS-consistent** (real 2025 supply, 2030/2040 demand, China
processing share, prices), and the gap projection is a real interpolation — not seeded. It is a functional
scenario tool; the price-spike and shock overlays are the only heuristic pieces (flagged in §7.6).

### 7.1 What the module computes

The core is a supply-demand gap projection with linear demand interpolation and a 4%/yr supply growth:

```js
supply(yr) = yr==2025 ? supply2025 : round( supply2025 × (1 + 0.04·(yr − 2025)) )
demand(yr) = yr≤2030 ? demand2025 + (demand2030 − demand2025)·((yr−2025)/5)
                     : demand2030 + (demand2040 − demand2030)·((yr−2030)/10)
gap(yr)    = round( supply(yr) − demand(yr) )
deficitMinerals = |MINERALS where demand2030 > supply2025 × 1.2|
avgChinaShare   = round( mean(chinaShare) )
```

`gap < 0` = deficit. The headline mineral gap is `demand2030 − supply2025 × 1.2` (assuming 20% supply
growth to 2030). A user supply-shock slider (10–80%) drives the price-spike scenario tab.

### 7.2 Parameterisation / scoring rubric

**Curated mineral data (IEA/USGS-consistent, not seeded):**

| Mineral | Supply 2025 | Demand 2030 | Demand 2040 | China share | Substitution elast. |
|---|---|---|---|---|---|
| Lithium | 180 kt LCE | 380 | 720 | 65% | 0.30 |
| Cobalt | 210 kt | 340 | 510 | 73% | 0.60 |
| Nickel | 3,400 kt | 4,800 | 7,200 | 42% | 0.40 |
| Copper | 22 Mt | 32 | 42 | 38% | 0.20 |
| Rare Earths | 350 kt REO | 480 | 680 | 87% | 0.15 |
| Graphite | 1,200 kt | 2,200 | 4,500 | 79% | 0.35 |
| PGMs | 12 Moz | 9 | 7 (declining) | 12% | 0.45 |

Recycling penetration is given at 2025/2035/2045 milestones (e.g. lithium 5→25→45%). The 4%/yr supply
growth and the ×1.2 "supply growth to 2030" factor are hard-coded heuristics. `PIPELINE` lists 6 real
mine projects (Thacker Pass, Simandou, Weda Bay…) with real capacities and investment sizes.

### 7.3 Calculation walkthrough

1. `projections(mineral)` interpolates demand between the 2025/2030/2040 anchors and grows supply at 4%/yr,
   returning supply/demand/gap for 2025/2028/2030/2035/2040.
2. KPIs count deficit minerals and average China share; the selected mineral's 2030 gap is highlighted.
3. Tabs: supply-demand balance (composed chart), price-spike scenarios (shock slider → spike price),
   substitution elasticity, recycling penetration curves, geopolitical supply shock, mining pipeline.

### 7.4 Worked example

Lithium, year 2030: `supply = round(180 × (1 + 0.04×5)) = round(180 × 1.20) = 216 kt`;
`demand = 160 + (380 − 160)×(5/5) = 380 kt`; `gap = 216 − 380 = −164 kt` (deficit). The headline gap KPI
uses `demand2030 − supply2025×1.2 = 380 − 216 = 164 kt` deficit — matching. Rare Earths (87% China share)
flags as the highest-concentration mineral; its 2030 gap is `480 − 350×1.2 = 480 − 420 = 60 kt`.

### 7.5 Companion analytics on the page

Six tabs including price-spike scenarios (shock% → `priceSpike` interpolation from `price2024` to the
curated spike price), substitution-elasticity view (how demand responds to price), recycling-penetration
S-curves, a geopolitical-shock tab, and the mining pipeline table. No backend engine or route — client-side
with curated data.

### 7.6 Data provenance & limitations

- **Data is curated and realistic** — mineral supply/demand/price/China-share track IEA Critical Minerals
  and USGS figures; the pipeline projects are real. No `sr()` PRNG in the core projection.
- **Supply growth is a flat 4%/yr assumption** — real supply is lumpy (project start dates, ramp curves).
  The ×1.2 "supply to 2030" factor is a simplification vs. the pipeline-based supply the `PIPELINE` data
  would support.
- Price-spike magnitudes are curated end-points, not a market model; substitution elasticity is a single
  scalar per mineral, not a demand-response curve.

**Framework alignment:** *IEA Critical Minerals* — the demand-by-technology-deployment framing
(`Demand = Σ_sector Deployment × Intensity`) and the 2030/2040 demand growth mirror IEA STEPS/APS/NZE
mineral-demand projections. *USGS Mineral Commodity Summaries* underpin the supply and country-share data.
The gap-projection method (demand growth vs supply capacity) is the standard critical-minerals bottleneck
analysis; the substitution-elasticity and recycling-penetration overlays reflect IEA's supply-side levers.
