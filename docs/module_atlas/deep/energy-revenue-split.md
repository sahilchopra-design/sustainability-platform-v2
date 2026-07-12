## 7 · Methodology Deep Dive

The guide (`GRR = Renewable_revenue / Total_revenue`, IEA NZE 50% green-capex alignment, peer
comparison) is faithfully implemented. This is a compact, transparent decomposition dashboard driven
by hand-authored 6-year time series; there is no hidden model or synthetic PRNG. The only computed
transforms are the projection scenario multipliers.

### 7.1 What the module computes

Four static time series and one interactive projection:

- **`REVENUE_TREND`** (2020–2025): `legacy`, `renewable` revenue ($B) and a pre-computed `green_pct`.
- **`CAPEX_TREND`** (2020–2025): `legacy_capex`, `green_capex` and `green_pct`.
- **`PEERS`** (6 integrated majors): `green_rev_pct`, `green_capex_pct`, `ci_tco2_gwh`, `itr`.
- **`PROJECTION_2030`** (2025–2030): revenue split and green %.

Green revenue/capex ratios (the guide's GRR) are stored directly on each row rather than divided at
render (e.g. 2025 `green_pct = 13.1` = 15.4 / (102.1+15.4) ≈ 13.1%, internally consistent).

The only live calculation is the **projection scenario**:
```js
mult      = accelerated ? 1.3 : conservative ? 0.7 : 1.0
renew_rev = base_renew_rev × mult
green_pct = renew_rev / (legacy_rev + renew_rev) × 100
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `IEA_NZE_CAPEX_PCT` | 50 | IEA NZE: ≥50% green capex by 2030 (inline comment) |
| Scenario multipliers | accelerated 1.3× · base 1.0× · conservative 0.7× | Design sensitivity handles |
| `PEERS` green-rev % | Shell 14.2, BP 11.8, Total 16.5, Equinor 18.2, Eni 9.5 | Realistic peer benchmarks (editorial) |
| `PEERS` ITR | 1.8–2.5 °C | Implied temperature rise per peer |
| `REVENUE_TREND` green% | 4.6 → 13.1 (2020→2025) | ≈2–3pp/yr, matches guide narrative |
| `CAPEX_TREND` green% | 10.2 → 41.6 | Rising toward but below 50% NZE bar |

The `Demo Co (Us)` peer row (green_rev 13.1, green_capex 41.6, CI 305, ITR 2.2) is the subject company
and ties back to the trend series.

### 7.3 Calculation walkthrough

Load the four static series → KPIs read the latest-year values (`latestGreenRev = 13.1%`,
`latestGreenCapex = 41.6%`) → the CapEx-alignment tab draws a `ReferenceLine` at the 50% NZE bar and
flags the 41.6% actual as below-target → the peer tab plots each major on green-rev vs green-capex
with CI and ITR context → the 2030 projection applies the chosen multiplier and recomputes `green_pct`
year by year.

### 7.4 Worked example

**Accelerated** projection, year 2030. Base row: `legacy_rev = 78.5`, `renew_rev = 46.9`.
```
renew_rev' = 46.9 × 1.3 = 60.97 → 61.0
green_pct' = 61.0 / (78.5 + 61.0) × 100 = 61.0 / 139.5 × 100 = 43.7%
```
So an accelerated build-out lifts 2030 green revenue share from the base 37.4% to 43.7% — still short
of Equinor's ~18% *revenue* today being the sector frontier, but the capex figure (41.6% rising) is
the leading indicator that matters for NZE alignment. The CapEx-alignment gauge shows 41.6% vs the
50% NZE bar = an 8.4pp shortfall.

### 7.5 Companion analytics

- **Green Revenue Ratio tab:** the `green_pct` trend line vs peer band.
- **Peer comparison:** green-rev% × green-capex% scatter with the subject company highlighted; CI and
  ITR shown as the climate-quality overlay.
- **CapEx alignment:** the central IEA-NZE-50% test — the module's headline transition-credibility
  signal (capex leads revenue, so green capex % is the forward metric).

### 7.6 Data provenance & limitations

- **All series are hand-authored editorial data** — realistic integrated-major magnitudes but not a
  live company feed; peer names (Shell, BP, Total…) carry plausible-but-illustrative figures.
- No PRNG; the projection is a single flat multiplier (1.3/0.7), not a modelled demand/price path.
- Green revenue/capex percentages are stored, so there is no taxonomy-alignment engine behind them —
  the split is presentational.

**Framework alignment:** **IEA Net Zero by 2050 Roadmap** — the ≥50% clean-energy capex-share
milestone is the explicit alignment benchmark; **SBTi Oil & Gas / Power SDA** — the ITR peer column
proxies science-based temperature alignment (an ITR ≤1.5 °C would signal Paris alignment; the peers'
1.8–2.5 °C indicate the sector gap). Green revenue ratio itself follows the **EU Taxonomy /
FTSE Green Revenues** convention of turnover-share from taxonomy-eligible activities, here pre-tagged.
