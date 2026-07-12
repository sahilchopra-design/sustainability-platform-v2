## 7 · Methodology Deep Dive

The module is a **carrier trade-off matrix**: it ranks 8 hydrogen carriers/derivatives (compressed
GH₂ at 700/350 bar, LH₂, LOHC, ammonia, methanol, e-fuels, e-methane) across physical properties,
transport cost, reconversion efficiency and use-case fit. Its analytics are mostly a lookup over the
hand-authored `CARRIERS` table plus one distance-scaled transport-cost model; only the delivered-cost
production term is synthetic. The guide (EP-EE6) and code agree — no material mismatch.

### 7.1 What the module computes

**Transport cost vs distance** — the one genuine model:

```js
cost = round(c.transport_cost_usd_gj_1000km × (distanceKm/1000) × 1000) / 1000   // $/GJ, linear in distance
```

**Carrier radar** (6 dimensions, all min/max-clipped to a 0–10 scale):

```js
Energy Density  = min(10, energy_density_kwh_kg / 3.33)     // 33.3 kWh/kg H₂ → 10
Vol. Density    = min(10, volumetric_density_kwh_L × 2)
Transport       = max(0, 10 − transport_cost_usd_gj_1000km × 1.5)   // cheaper = higher
Efficiency      = reconversion_efficiency_pct / 10
Infra Maturity  = infrastructure_maturity × 2                // 1–5 → 2–10
Safety          = (6 − safety_risk) × 2                      // lower risk = higher
```

**Delivered cost stack** (production + transport + reconversion loss):

```js
production      = round(15 + sr(idx*7)*8)                    // $15–23/GJ  ← SYNTHETIC
transport       = round(transport_cost_usd_gj_1000km × distanceKm/1000)
reconversionLoss= round((100 − reconversion_efficiency_pct) × 0.3)
```

### 7.2 Parameterisation — the CARRIERS table (provenance)

| Carrier | E-density kWh/kg | Vol kWh/L | Transport $/GJ/1000km | Reconv. η % | Source note in code |
|---|---|---|---|---|---|
| CGH2-700 | 33.3 | 1.3 | 4.5 | 98 | Mature mobility; tube-trailer/pipeline |
| CGH2-350 | 33.3 | 0.78 | 5.2 | 98 | Most deployed; trucks at 350 bar |
| LH2 | 33.3 | 2.36 | 2.8 | 87 | −253 °C; 30–35% liquefaction energy; boil-off 0.3–3%/day |
| LOHC (DBT) | 1.9 | 1.65 | 1.2 | 60 | Ambient liquid; oil-tanker compatible; high dehydrogenation heat |
| NH3 | 5.2 | 4.32 | 0.8 | 73 | 185 Mt/yr existing trade; toxic/corrosive |
| e-MeOH | 5.5 | 4.35 | 0.7 | 68 | 100 Mt/yr chemical; needs CO₂ source |
| e-Fuels | 11.9 | 9.35 | 0.4 | 95 | Drop-in; CO₂ mandatory; FT/MtJ; $5–8/L now |
| e-CH4 | 13.9 | 0.011* | 0.3 | 77 | Grid-compatible; methanation |

Values are consistent with IRENA PtX Innovation Outlook, IEA H₂ Roadmap, Hydrogen Council and DNV
(cited in the page subtitle). H₂ LHV = 33.3 kWh/kg and NH₃ ≈ 5.2 kWh/kg are correct physical
constants. (*e-CH4 volumetric figure is for the gaseous state — an order-of-magnitude artifact of the
table, not a transport-relevant number.)

The `SCENARIOS` table hand-scores each carrier 0–9 across 5 supply-chain use-cases (short-haul,
long-haul shipping, industrial heat, shipping fuel, back-to-power) — expert judgement, not computed.

### 7.3 Calculation walkthrough

Inputs: `distanceKm` (slider 200–15 000), `selectedCarrier`, `selectedScenario`.
- `transportCosts` re-scales every carrier's per-1000km cost to the chosen distance.
- `radarCarrier` maps the selected carrier's six raw properties to the 0–10 radar.
- `scenarioData` reads the fixed use-case scores for the selected scenario.
- `deliveredCostData` sums a synthetic production term (~$15–23/GJ), the distance-scaled transport
  cost, and a reconversion-loss proxy (`(100−η)×0.3`).

### 7.4 Worked example (NH₃ at 10 000 km)

| Step | Computation | Result |
|---|---|---|
| Transport | `0.8 × (10000/1000)` | **$8.0/GJ** |
| Reconversion loss proxy | `(100−73) × 0.3` | **8.1** ($/GJ proxy) |
| Production (synthetic) | `15 + sr(4*7)*8` | ≈ **$18/GJ** |
| Delivered (stack) | 18 + 8 + 8.1 | ≈ **$34/GJ** |
| Radar Transport score | `10 − 0.8×1.5` | **8.8/10** (best-in-class) |

Contrast CGH2-700 at the same distance: transport `4.5×10 = $45/GJ` — the module's core teaching
point that compressed gas is prohibitive for long-haul while NH₃/e-fuels dominate, matching the guide.

### 7.5 Data provenance & limitations

- The `CARRIERS` physical/cost table is **externally grounded** (IRENA/IEA/DNV/Hydrogen Council) and
  is the module's strength.
- The **production cost term is synthetic** (`sr(idx*7)`) — a $15–23/GJ placeholder that does not
  reflect the real production-cost spread between pathways; only transport is genuinely modelled.
- Reconversion cost is a crude linear proxy (`(100−η)×0.3`), not an energy-balance or capex model;
  it under-represents the LOHC dehydrogenation heat (~290 °C) and NH₃ cracking penalty the guide
  itself flags.
- Transport cost is linear in distance with a per-carrier constant — no economies of scale, no
  vessel-size or boil-off-over-voyage-duration effects.

**Framework alignment:** IRENA *Global Hydrogen Trade to Meet 1.5 °C* / PtX Innovation Outlook —
carrier property table and $/GJ transport benchmarks · IEA *Global Hydrogen Review* / H₂ Supply-Chain
Cost Benchmarking — carrier cost ordering · DNV *Hydrogen Forecast to 2050* — shipping economics.
The module operationalises these as a static comparison matrix rather than a full delivered-LCOH model.
