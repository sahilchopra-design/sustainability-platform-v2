## 7 · Methodology Deep Dive

### 7.1 What the module computes

Unlike most sibling benchmarking modules, this page is built on **hand-curated, static reference data**
(no `sr()` PRNG) for 6 GICS sectors (Energy, Materials, Industrials, Utilities, Real Estate, and — per the
`SECTORS` array continuing past the excerpt — a 6th sector), each with: a 4-pillar PACE score, an SBTi
alignment %, an implied `pathway`/`temp_2100`, emissions figures (2019 actual, 2030/2050 targets), green/
brown revenue split, a named marginal-abatement-cost (MAC) curve, and a 2019–2030 emissions trajectory.

```js
paceComposite(s) = (pace.physical + pace.abatement + pace.carbon_cost + pace.energy_price) / 4
```

`abatementData` builds a running cumulative-abatement series for the MAC curve chart:

```js
cum = 0
abatementData = sector.abatement_curve.map(m => { cum += m.abatement; return {...m, cumulative: cum}; })
```

### 7.2 Parameterisation — PACE pillar scores and sector fundamentals

| Sector | Physical | Abatement | Carbon Cost | Energy Price | **PACE composite** | SBTi aligned | Pathway | Stranded risk |
|---|---|---|---|---|---|---|---|---|
| Energy | 72 | 38 | 85 | 65 | **65.0** | 22% | Not Aligned (3.8°C) | Critical |
| Materials | 58 | 55 | 70 | 72 | **63.8** | 34% | Below 2°C (2.8°C) | High |
| Industrials | 48 | 62 | 55 | 58 | **55.8** | 41% | Well-below 2°C (2.2°C) | Medium |
| Utilities | 65 | 75 | 60 | 80 | **70.0** | 58% | Well-below 2°C (2.0°C) | Medium |
| Real Estate | 55 | 68 | 40 | 62 | **56.3** | 29% | Below 2°C (2.5°C) | (n/a, excerpt cut) |

All four pillar scores, `sbti_aligned_pct`, `pathway`, `temp_2100`, and emissions figures are
**hand-authored constants per sector** — internally consistent with each other (Energy has the worst
implied temperature and lowest SBTi alignment, matching its low Abatement score) but not derived from a
live IEA/IPCC/SBTi dataset in code; treat as a curated illustrative dataset, directionally credible but not
independently source-cited per cell.

| Sector | Sample abatement-curve measures (abatement Mt, $/tCO₂) |
|---|---|
| Energy | Methane leak fix (820 Mt, **−$15**), Solar PV (1,200 Mt, $12), Wind (980 Mt, $18), CCS on power (2,400 Mt, $65), Blue H₂ (1,100 Mt, $90), DAC (450 Mt, $280) |
| Materials | EAF steel (1,100 Mt, $20), Clinker reduction (680 Mt, $8), Industrial heat pump (420 Mt, $35), Green H₂ steel (1,800 Mt, $95), CCS cement (950 Mt, $120) |
| Utilities | Solar PV scale-up (2,200 Mt, $10), Onshore wind (1,800 Mt, $14), Battery storage (900 Mt, $45), Coal retirement (1,600 Mt, $0), Offshore wind (1,400 Mt, $55) |

These MAC curve entries mirror the real McKinsey Global Abatement Cost Curve convention (negative-cost
efficiency measures first, escalating through renewables/electrification into expensive DAC/blue hydrogen)
— directionally faithful to published MAC curves, though the specific $/tCO₂ and Mt figures are
platform-curated rather than pulled live from a McKinsey dataset.

### 7.3 Calculation walkthrough

1. `paceComposite(sector)` is called wherever a headline PACE score is shown (Sector Scorecards, PACE
   Analysis radar, PACE bar chart) — always the unweighted 4-pillar mean, no pillar is weighted more
   heavily than another despite sectors plausibly having different sensitivity profiles (e.g. Energy's
   carbon-cost pillar arguably should dominate its composite more than its energy-price pillar).
2. **PACE Analysis tab** — builds a 5-axis radar (`Physical Risk, Abatement, Carbon Cost, Energy Price,
   Composite`) per sector using `Object.fromEntries(SECTORS.map(...))`, i.e. one radar overlay per sector,
   directly from the static pillar constants.
3. **SBTi Pathways tab** — renders `sbti_aligned_pct` as a horizontal bar per sector (blue fill width =
   `sbti_aligned_pct`%), a direct 1:1 mapping of the static constant, no computation.
4. **Abatement Cost Curves tab** — `abatementData` accumulates each sector's named measures **in their
   listed array order** (not sorted ascending by `cost`), so the "cumulative" MAC curve chart is only a true
   MAC curve if the source array happens to already be cost-sorted — for Energy, the listed order
   (Methane −15 → Solar 12 → Wind 18 → CCS 65 → Blue H₂ 90 → DAC 280) is indeed monotonically increasing by
   cost, so the curve renders correctly for that sector, but this is not enforced by a `.sort()` call, so a
   future sector added with an unsorted `abatement_curve` array would render an incorrect (non-monotonic)
   MAC curve.
5. **Emissions Trajectories tab** — plots each sector's `trajectory` array (`actual` vs `target` per year,
   with `actual: null` for future years 2025/2030) — a real vs. plan comparison chart using the hand-curated
   historical/target figures.

### 7.4 Worked example

Energy sector PACE composite: `(72 + 38 + 85 + 65) / 4 = 260/4 = 65.0` — matches the table above.
Cumulative MAC for Energy through the first 3 measures: `820 (Methane) → 820+1,200=2,020 (Solar) →
2,020+980=3,000 (Wind)` Mt CO₂e abated at ≤$18/tCO₂e, before the curve crosses into the CCS/Blue H₂/DAC
tier (≥$65/tCO₂e) — a genuine MAC-curve read: roughly 3.0 Gt of Energy-sector abatement is available at
"cheap" (<$20/tCO₂e) cost before expensive measures are needed.

### 7.5 Companion analytics on the page

- **Emissions Trajectory vs Target** — for Energy: `emissions_2019=15,800`, actual through 2023 dipped to
  13,200 (2020, COVID effect) then rose back to 14,900 (2023), while `target` declines steadily to 8,900 by
  2030 — visually shows the sector falling behind its own stated pathway, a genuine and useful "actual vs
  plan" gap read using real-shaped (COVID-dip-then-rebound) historical data.
- **Stranded-asset risk rating** (`Critical`/`High`/`Medium`) and letter `rating` (`E`/`D`/`C`) per sector
  are additional hand-set qualitative labels, broadly consistent with (but not formulaically derived from)
  the PACE composite and `temp_2100` figures.

### 7.6 Data provenance & limitations

- **All sector data is static and hand-curated** — a meaningful step up in rigor from `sr()`-random sibling
  modules in that the numbers are internally consistent and directionally correct, but there is no live data
  pipeline; updating requires manually editing the `SECTORS` array.
- `paceComposite` is an unweighted 4-pillar average — no cited methodology assigns equal 25% weight to
  Physical Risk, Abatement Cost, Carbon Cost pass-through, and Energy Price Sensitivity; a production PACE
  score would need pillar weights calibrated to their actual predictive relationship with transition
  outcomes.
- The MAC curve's cumulative computation trusts input ordering rather than sorting by `cost` — a latent
  correctness risk if a sector's `abatement_curve` array is ever entered out of cost order.
- `sbti_aligned_pct`/`pathway`/`temp_2100`/emissions figures are illustrative, sector-level constants —
  useful for narrative/demo purposes but not sourced from a live SBTi Target Dashboard or IEA WEO dataset.

**Framework alignment:** IEA World Energy Outlook (informs the shape/scale of sectoral emissions and
transition-capex figures) · IPCC AR6 WGIII (chapter-level informs the abatement-measure taxonomy per
sector) · SBTi Sectoral Decarbonisation Approach (SDA) — `sbti_aligned_pct`/`pathway` fields mirror SDA's
temperature-pathway classification (1.5°C / Well-below 2°C / Below 2°C / Not Aligned) though the underlying
percentage is not computed from SBTi's live target dashboard · McKinsey Global Abatement Cost Curve — the
`abatement_curve` structure (measure, Mt abated, $/tCO₂e) directly mirrors McKinsey's MAC curve convention.
