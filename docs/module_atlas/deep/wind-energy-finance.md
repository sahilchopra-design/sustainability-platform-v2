## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide gives an explicit LCOE formula
> (`LCOE_wind = (CapEx×CRF + OpEx_annual) / (8760×CapacityFactor×InstalledCapacity)`) and a wake-loss
> formula referencing the Betz limit. **Neither is computed.** `lcoe` is an independent random draw
> per project (range depends only on turbine `type`, not on the project's own `capex`, `capacityMw`,
> or `dscr`), and `wake` is a flat random percentage unconnected to any turbine-layout or Jensen/
> Gaussian wake model. P50/P90 energy-yield figures are computed as **rank-order percentiles of
> capacity factor across projects**, not from a wind-resource probability distribution as the P50/P90
> convention actually requires.

### 7.1 What the module computes

Synthetic project pipeline across 3 turbine types (Offshore Fixed, Offshore Floating, Onshore),
independently seeded per project:

```js
capacityMw = type==='Offshore Fixed' ? 100+sr(i·3+1)×900 : type==='Offshore Floating' ? 50+sr(i·5+2)×350 : 30+sr(i·7+3)×270
lcoe       = type==='Offshore Fixed' ? 55+sr(i·31+7)×45 : type==='Offshore Floating' ? 80+sr(i·37+8)×60 : 25+sr(i·41+9)×30
irr        = 7 + sr(i·43+1)×12
cfdStrike  = 60 + sr(i·47+2)×80
merchantPct = sr(i·53+3)×35
capex      = type-dependent range, $M/MW-ish
dscr       = 1.1 + sr(i·71+7)×1.5
wake       = 3 + sr(i·73+8)×10
```

Portfolio/type aggregations (`avgIrr`, `avgCf`, `totalGw`, `avgLcoe`, `avgCfdStrike`, `avgMerchant`,
`byType`) are simple means/sums over `filtered` projects — genuinely computed, but over inputs that
are themselves random.

```js
// "P50/P90" — actually rank-order percentiles of the capacity-factor field across projects
vals = [...arr.map(p=>p.cf)].sort((a,b)=>a-b)
p50  = vals[floor(vals.length×0.5)]
p90  = vals[floor(vals.length×0.1)]     // note: index 0.1, i.e. the 10th-percentile-by-rank value
```

### 7.2 Parameterisation

| Turbine type | `capacityMw` range | `lcoe` range ($/MWh) | Provenance |
|---|---|---|---|
| Offshore Fixed | 100–1,000 | 55–100 | Consistent order-of-magnitude with guide's cited $0.033/kWh onshore vs offshore CapEx premium framing, but not derived from `capex` |
| Offshore Floating | 50–400 | 80–140 | Highest LCOE — consistent with the guide's floating "50-100% premium" framing |
| Onshore | 30–300 | 25–55 | Cheapest, matches IRENA's "$0.033/kWh global avg" cited figure directionally |

### 7.3 Calculation walkthrough

1. Filters reduce `PROJECTS` to `filtered`; simple means computed for KPI cards.
2. `byType` groups `WIND_TYPES` and computes per-type averages of `irr`/`cf`/`lcoe` etc.
3. **P50/P90 tab**: the code sorts the *cross-sectional* capacity-factor field across all projects
   and reports the 50th/10th rank-order values as "P50"/"P90" — this conflates cross-project variance
   (different sites having different average CF) with the *actual* P50/P90 convention, which describes
   the probability distribution of a **single project's own annual energy yield** across weather years
   (i.e. P90 = the yield level exceeded 90% of the time for that one project, used by lenders to size
   debt conservatively). The code's version cannot answer "what's the 1-in-10 bad-wind-year outcome
   for this specific project," which is what P90 is actually used for in project finance.
4. `avgS` (average CfD strike price by CfD technology band) and `avgCfd`/`avgMerc`/`avgCap`/`avgWake`/
   `avgDscr2` all group `PROJECTS` by `cfd` technology classification.

### 7.4 Worked example

If `filtered` (Offshore Fixed only, say 8 projects) has capacity factors
`[38, 41, 43, 45, 47, 49, 51, 53]` (sorted), the code's "P50" = `vals[⌊8×0.5⌋] = vals[4] = 47`, and
"P90" = `vals[⌊8×0.1⌋] = vals[0] = 38`. A genuine P90 for a *specific* offshore project (say, the one
with average CF=45%) would instead require that project's own inter-annual wind-resource variability
(e.g. from ERA5/MERRA-2 reanalysis) to derive the 90%-exceedance yield for that site — a materially
different (and site-specific) calculation from "the lowest-CF project in a cross-sectional sample."

### 7.5 Data provenance & limitations

- **All projects, LCOE, IRR, DSCR, and wake-loss figures are synthetic** (`sr()`-seeded), calibrated
  by turbine type to land within the guide's cited IRENA/BNEF/GWEC ranges but not derived from any
  cash-flow, wind-resource, or wake-loss model.
- **The P50/P90 labelling is a genuine methodology error**, not just a missing-formula gap — the
  metric computed (cross-project rank order) answers a different question than the one lenders
  actually use P50/P90 for (single-project inter-annual yield distribution). This should be renamed
  (e.g. "cross-portfolio CF percentile") or replaced with a genuine per-project yield-distribution
  calculation before being used in any real debt-sizing context.
- No Jensen/Gaussian wake model, Weibull wind-speed distribution, or Betz-limit calculation exists
  despite being named in the guide's formula and references (DTU Wind Energy Atlas / WAsP).

**Framework alignment:** IRENA Renewable Power Generation Costs 2023 and GWEC Global Wind Report 2024
(named in the guide) inform the plausible calibration ranges but are not connected to a live data feed
or an actual LCOE calculation. IEA Wind TCP Task 26 cost-of-wind-energy methodology and DTU WAsP wind-
atlas modelling are named but entirely unimplemented.
