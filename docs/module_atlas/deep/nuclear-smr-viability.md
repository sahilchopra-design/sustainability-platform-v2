## 7 · Methodology Deep Dive

Like its sibling `nuclear-market-intelligence`, this module is primarily a **curated static
reference dataset** for five real SMR programmes, with one lightweight derived radar-normalisation
formula. There is no LCOE *calculation* engine here (contrast with `nuclear-lcoe-economics`) — the
`lcoe2024/2030/2040` figures are hand-entered per design, not computed from capex/opex inputs.

### 7.1 What the module computes

`DESIGNS` — 5 real SMR programmes with real vendor names and plausible technical/regulatory detail:

| Design | Vendor | Type | MW (total) | LCOE 2024→2040 | Build (mo) | TRL | Reg. status |
|---|---|---|---|---|---|---|---|
| NuScale VOYGR | NuScale Power | iPWR | 462 (6×77) | $89→$48 | 36 | 8 | **NRC Design Certified** (real, 2023) |
| BWRX-300 | GE-Hitachi | BWR | 300 | $75→$42 | 24 | 7 | NRC Review |
| Rolls-Royce SMR | Rolls-Royce | PWR | 470 | $82→$45 | 48 | 6 | **ONR GDA Step 3** (real, UK process) |
| Xe-100 | X-energy | HTGR | 320 (4×80) | $95→$50 | 30 | 6 | NRC Pre-Application |
| Natrium | TerraPower | SFR+Storage | 345 | $85→$46 | 42 | 5 | NRC Pre-Application |

These TRL levels, regulatory-status labels, and design configurations (NuScale's 6-module VOYGR-77
plant architecture, Natrium's sodium-fast-reactor + molten-salt storage hybrid, Xe-100's 4×80MW
pebble-bed HTGR) are **factually consistent with each vendor's real, publicly disclosed design**.

The only computed field is a **radar-chart normalisation**, not an LCOE model:

```js
radarData[d] = {
  Cost:        100 − lcoe2030                          // higher = cheaper (inverted scale)
  Capacity:    round(totalMW / 5)                        // arbitrary /5 scaling to fit 0–100 axis
  Timeline:    100 − constructionMo × 2                   // higher = faster build
  TRL:         trl × 10                                   // TRL 1–9 → 10–90
  Versatility: (h2Capable?20:0) + (loadFollow?20:0) + 40   // base 40 + flexibility bonuses
}
```

### 7.2 Parameterisation

`REG_TRACKER` (4 regulators: NRC, ONR, CNSC, ASN) lists each design's real approval stage and a
target-completion year (NuScale "Completed," others 2025–2030) — a genuine regulatory-status
tracker, not scored. `PIPELINE` (6 named real/plausible projects — Carbon Free Power Project Idaho,
Darlington Ontario, Wylfa Wales, Kemmerer Wyoming, DOW Chemical Texas, Kozloduy Bulgaria) each carry
an FID year, COD year, and status. `GRID_SERVICES` (6 services — Baseload, Load Following, H₂
Co-production, District Heating, Desalination, Grid Inertia) each score an illustrative `value`
(15–45) and a qualitative `smrAdvantage` (High/Medium) rating — not derived from the DESIGNS table.

### 7.3 Calculation walkthrough

1. `totalPipeline = Σ parseInt(p.capacity)` sums the 6 `PIPELINE` projects' capacity strings (e.g.
   `"462 MW"` → `parseInt` extracts `462`) to a headline "Pipeline Capacity" KPI.
2. `radarData` normalises each design's 5 attributes onto a common ~0–100 scale for the Technology
   Comparison radar — this is a **display-normalisation trick**, not a composite viability score;
   the axes are not combined into a single ranking number anywhere.
3. Selecting a design (`selectedDesign`) filters the KPI strip and highlights its row/radar trace
   across all six tabs; no other tab recomputes anything from the selection beyond display
   filtering.
4. **Cost Learning Curves tab** plots the static `lcoe2024→2030→2040` three-point series per design
   — a hand-set decline path, not a Wright's-Law fit (contrast with `nuclear-lcoe-economics`'s
   `learningCurveData`, which does apply a progress-ratio formula).

### 7.4 Worked example

NuScale VOYGR radar values: `Cost = 100−65 = 35`; `Capacity = round(462/5) = 92`;
`Timeline = 100−36×2 = 28`; `TRL = 8×10 = 80`; `Versatility = 0(not h2Capable)+20(loadFollow)+40 =
60`. Compare Rolls-Royce SMR: `Cost = 100−60=40`; `Capacity = round(470/5)=94`;
`Timeline = 100−48×2=4`; `TRL=6×10=60`; `Versatility=20(h2)+20(loadFollow)+40=80`. The radar
correctly surfaces NuScale's TRL/regulatory-maturity lead (TRL 80 vs. 60, reflecting its real 2023
NRC certification) against Rolls-Royce's longer build time penalty (Timeline 4 vs. 28, reflecting
its later 48-month construction estimate) — the relative ordering is sensible even though the
underlying numbers are hand-entered rather than modelled.

### 7.5 Data provenance & limitations

- Design specs, TRL levels, and regulatory statuses are **plausible and broadly consistent with
  real, public 2024-era SMR programme status** for all five vendors — one of the platform's more
  factually grounded reference tables.
- `lcoe2024/2030/2040` are **manually authored, not computed** from capex/opex/capacity-factor
  inputs — unlike `nuclear-lcoe-economics`, there is no underlying financial formula a user could
  audit or stress-test by changing capex assumptions.
- The radar axes' scaling constants (`/5` for capacity, `×2` for timeline, `×10` for TRL) are
  arbitrary choices to fit a 0–100 display range, not a validated multi-criteria weighting scheme —
  no combined "viability score" is computed from them.
- `GRID_SERVICES` values and `smrAdvantage` ratings are qualitative judgments, not derived from the
  DESIGNS table's `h2Capable`/`loadFollow` flags (e.g. H₂ Co-production is scored "High" advantage
  independent of which specific designs are actually `h2Capable`).

**Framework alignment:** NRC Design Certification / ONR Generic Design Assessment (GDA) / CNSC
Vendor Design Review — all four regulatory processes and the designs' stage-labels are real and
current as of the page's authoring · WNA — SMR classification (≤300 MWe factory-fabricated) matches
the standard industry definition, though several tracked designs (Rolls-Royce 470MW, Natrium 345MW)
exceed the strict ≤300MWe threshold, reflecting the industry's looser real-world usage of "SMR" to
include these larger advanced designs.
