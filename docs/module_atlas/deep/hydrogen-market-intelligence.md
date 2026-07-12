## 7 · Methodology Deep Dive

A global hydrogen **market-intelligence dashboard**: demand by sector, supply by pathway, exporter/
importer flows, price forecasts, geopolitical risk and a technology mix, 2025–2040. It is
projection-by-interpolation over hand-authored market tables, with one synthetic term (grey-H₂ price
noise) and one hard-coded geopolitical scorecard. Code and guide (EP-DS3) broadly agree.

### 7.1 What the module computes

**Sector demand projection** — piecewise-linear between 2023/2030/2040 anchors, then scaled by scenario:

```js
demand[year] = ( demand2023
               + (demand2030 − demand2023)/7 · min(i,7)          // 2023→2030 slope
               + (demand2040 − demand2030)/10 · max(0,i−7) )     // 2030→2040 slope
               × scenarioMultiplier
scenarioMultiplier = { Conservative:0.65, Base:1.0, Optimistic:1.45 }
```

**Supply build-up by pathway** — linear ramps:

```js
grey  = 83 − i·2 ; blue = i·3 ; green = 0.5 + i·4 ; other = 0.5 + i·0.5   // Mt, i = year index
```

**Price trajectory** — declining green, rising blue, noisy grey:

```js
greenWind = max(1.5, 6.0 − i·0.28)      // $/kg
greenSolar= max(1.2, 5.5 − i·0.25)
blue      = max(1.3, 2.2 + i·0.05)
grey      = 1.4 + sr(i·11)·0.8           // ← SYNTHETIC noise
target2030= 2.0
```

### 7.2 Parameterisation (market tables, provenance)

| Table | Rows | Key fields | Basis |
|---|---|---|---|
| `SECTORS` | 8 | demand 2023/30/40 (Mt) | IEA *Global Hydrogen Review* — existing (ammonia 31, refining 42 Mt) vs new (steel/transport/power) |
| `EXPORTERS` | 8 | potential, LCOH, distance | IEA/IRENA export-hub studies (Chile, Australia, Saudi, USA-Gulf) |
| `IMPORTERS` | 6 | demand, source list | EU/JP/KR hydrogen import strategies |
| `VALLEYS` | 8 | investment $B, jobs | Announced hydrogen-valley projects (NEOM, HyDeal, Humber) |
| `geoRisks` | 8×5 | political/regulatory/infra/contract scores | **Hard-coded scorecard** (e.g. Norway 8.8, Kazakhstan 4.5) — expert judgement |

Existing-demand anchors (ammonia ~31 Mt, refining ~42 Mt, ~94 Mt total in 2023) match IEA figures.

### 7.3 Calculation walkthrough

`demandData` builds a 16-year × 8-sector matrix from the two-segment interpolation, uniformly scaled
by the scenario multiplier. `supplyData` and `priceData` are independent linear ramps. `geoRisks` is a
static read of the hard-coded scorecard. Totals: `totalGreenPipeline` sums exporter `potential2030`;
`totalDemand2030` sums sector `demand2030`.

### 7.4 Worked example (Steel DRI demand at 2035, Base)

```
i = 2035 − 2025 = 10  (>7, so both segments active)
= 0.1 + (8 − 0.1)/7·min(10,7) + (55 − 8)/10·max(0,10−7)
= 0.1 + 1.1286·7 + 4.7·3
= 0.1 + 7.9 + 14.1 = 22.1 Mt
× 1.0 (Base) = 22.1 Mt/yr
```

Under Optimistic (×1.45) the same cell reads ≈32 Mt/yr — the scenario multiplier is a flat scalar on
every sector-year, so relative sector shares never change across scenarios.

### 7.5 Data provenance & limitations

- Market tables are **externally grounded** (IEA/IRENA); the module's value is curation + interpolation.
- **Grey-H₂ price** uses seeded PRNG noise (`sr(i·11)`) — cosmetic jitter, not a gas-price model.
- The **geopolitical scorecard is a static hand-authored matrix**, not derived from any governance index
  (World Bank WGI, Fund for Peace FSI) — a candidate for §8-style formalisation but low decision-stakes.
- Scenario handling is a single flat multiplier; it cannot represent sector-specific policy divergence.

**Framework alignment:** IEA *Global Hydrogen Review 2023* (demand by sector, project pipeline) ·
IRENA *World Energy Transitions Outlook* (LCOH cost-down, export potential) · Hydrogen Council
*Hydrogen Insights* (market narrative). The module reproduces their published trajectories as
interpolated anchors rather than modelling deployment or trade endogenously.
