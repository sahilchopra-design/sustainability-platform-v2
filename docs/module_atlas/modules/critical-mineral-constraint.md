# Critical Mineral Constraint Engine
**Module ID:** `critical-mineral-constraint` · **Route:** `/critical-mineral-constraint` · **Tier:** B (frontend-computed) · **EP code:** EP-CL1 · **Sprint:** CL

## 1 · Overview
8 minerals with supply-demand gap projections, price spike scenarios, substitution elasticity, and recycling penetration curves.

**How an analyst works this module:**
- Supply-Demand Balance shows gap by mineral 2025-2040
- Geopolitical Supply Shock models China export control scenarios
- Recycling Penetration shows urban mining potential

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `KPI`, `MINERALS`, `PIPELINE`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MINERALS` | 9 | `unit`, `supply2025`, `demand2025`, `demand2030`, `demand2040`, `chinaShare`, `price2024`, `priceSpike`, `substitutionElast`, `recycleRate2025`, `recycleRate2035`, `recycleRate2045`, `color` |
| `PIPELINE` | 7 | `country`, `mineral`, `capacity`, `status`, `start`, `investmentBn` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Supply-Demand Balance','Price Spike Scenarios','Substitution Elasticity','Recycling Penetration','Geopolitical Supply Shock','Mining Pipeline'];` |
| `projections` | `(m) => [2025,2028,2030,2035,2040].map(yr=>{` |
| `supply` | `yr===2025?m.supply2025:Math.round(m.supply2025*(1+0.04*(yr-2025)));` |
| `deficitMinerals` | `MINERALS.filter(m=>m.demand2030>m.supply2025*1.2).length;` |
| `avgChinaShare` | `Math.round(MINERALS.reduce((s,m)=>s+m.chinaShare,0)/MINERALS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MINERALS`, `PIPELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Minerals | — | USGS | Critical for energy transition |
| China Processing Share | — | USGS | Dominant processing concentration |

## 5 · Intermediate Transformation Logic
**Methodology:** Supply-demand balance model
**Headline formula:** `Gap = Demand(t) - Supply(t); Demand = Σ_sector[Deployment × Intensity]`

8 minerals: lithium, cobalt, nickel, copper, REE, graphite, manganese, PGMs. China controls 60-90% of processing. Price spikes modelled under export control scenarios.

**Standards:** ['USGS', 'IEA Critical Minerals']
**Reference documents:** USGS Mineral Commodity Summaries; IEA Critical Minerals Review

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Pipeline-based supply and deployment-derived demand (analytics ladder: rung 2 → 3)

**What.** EP-CL1 genuinely delivers its guide — a real gap projection over curated
IEA/USGS-consistent data for 8 minerals, with scenario tabs and no PRNG in the core.
§7.6 names the simplifications: supply grows at a flat 4%/yr (and the headline gap
uses a ×1.2-by-2030 factor) even though the module's own `PIPELINE` table lists six
real projects (Thacker Pass, Simandou, Weda Bay…) with capacities that could build a
lumpy, project-based supply curve; demand anchors are stored points rather than the
guide's `Demand = Σ_sector Deployment × Intensity`; and price spikes are curated
end-points. Evolution A replaces the heuristics with the structure the data already
supports.

**How.** (1) Supply: build the supply curve from the pipeline — existing 2025 base
plus project capacities phased by start year with ramp profiles and a probability-
weighted completion factor per project status; the flat 4% becomes the documented
fallback for un-modelled capacity. (2) Demand: decompose the 2030/2040 anchors into
technology deployment × material intensity (EV batteries, wind, grid — IEA publishes
both components), so scenario switches (STEPS/APS/NZE) recompute demand rather than
swapping stored points — the rung-3 benchmark: the module's anchors should reproduce
IEA's published projections within tolerance. (3) Price-spike scenarios keep curated
magnitudes but gain an inventory-coverage rationale (months of demand lost under the
shock slider). (4) Pin lithium's 2030 gap in `bench_quant.py`.

**Prerequisites.** IEA deployment/intensity table curation (published, versioned);
pipeline status refresh ownership. **Acceptance:** removing one pipeline project
visibly dents the supply curve in its start year; NZE vs STEPS demand for lithium
differs per the IEA decomposition; the current interpolation remains as a
cross-check view.

### 9.2 Evolution B — Constraint-briefing copilot for strategy teams (LLM tier 1)

**What.** The module's users ask synthesis questions: "which minerals bottleneck our
2030 battery roadmap, and what are the levers?" Evolution B answers from the module's
own computed projections: the deficit list with gap magnitudes and timing, the
substitution-elasticity context (cobalt 0.60 — substitutable; REE 0.15 — locked in),
recycling-penetration offsets from the S-curves, and the specific pipeline projects
whose slippage matters most — each figure from the projection engine, each lever
mapped to the tab that models it.

**How.** Tier-1 grounding on page state plus this Atlas record (§7.2's curated data
table with its IEA/USGS provenance); the shock slider and scenario states pass as
context so "under a 40% China export shock" reads the actual scenario tab output.
Post-Evolution A, briefs distinguish pipeline-based supply confidence from
fallback-growth assumptions — the copilot's caveats track the model's own structure.
No endpoints exist; a backend port of the projection would enable tier-2 what-ifs
("delay Simandou two years") as tool calls.

**Prerequisites.** Corpus embedding (D3); Evolution A for lever-level precision.
**Acceptance:** every gap figure matches the projection output for the stated year;
substitution and recycling numbers quote the curated tables verbatim; the copilot
refuses minerals outside the 8-mineral universe.