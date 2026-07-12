## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine is `Modal_CI = Lifecycle_GHG /
> passenger_km` (or tonne_km) — a well-to-wheel carbon-intensity calculation per ITF/OECD
> methodology. **No such calculation exists.** Each of the 200 synthetic transport assets carries an
> `intensity` field that is an **independently `sr()`-seeded random number (10–190)**, unconnected to
> any `emissions`/`passenger_km` or `emissions/tonne_km` division. Sections below document the
> module's actual pattern — a portfolio-monitoring dashboard (KPIs, engagement pipeline, alerts,
> board report) layered on synthetic multi-modal asset data, structurally identical to several other
> platform "hub" modules in this batch.

### 7.1 What the module computes

200 synthetic transport-sector assets (`genAssets`) spanning 5 modes (Maritime, Aviation, Road/EV,
Rail, Logistics) assigned to real-world-styled company names (Maersk, CMA CGM, Emirates, Delta,
Tesla Fleet Ops, DB Cargo, DHL, etc.), each with independently `sr()`-seeded `emissions` (0.1–5.0
MtCO₂e), `intensity` (10–190, unitless — no gCO₂/pkm or gCO₂/tkm label is attached in the data
model), `decarbScore` (20–95), `investmentExp` ($0.05–2.5bn), `riskTier`, and mode-specific fields
(maritime CII rating A–E, aviation CORSIA-compliance flag + SAF usage %, road EV-penetration %). 40
synthetic engagement records and 25 synthetic alerts round out an Executive Dashboard / Cross-Modal
Portfolio / Engagement Pipeline / Board Report 4-tab structure.

### 7.2 Genuine aggregation formulas

```js
modePerformance[mode] = {
  avgDecarb:     modeAssets.length ? mean(decarbScore) : 0,
  totalEmissions: Σ emissions,
  totalInvest:    Σ investmentExp,
}
target[mode] = { Maritime:50, Aviation:45, 'Road/EV':40, Rail:35, Logistics:30 }[mode]   // static gap benchmark
stageCounts[stage] = count(engagements where stage matches)                              // engagement funnel
pct(count,total) = total ? round(count/total×100) : 0                                    // guarded %
```

All aggregation is unweighted mean/sum over the (optionally filtered) asset array, with correct
zero-length guards throughout (`modeAssets.length ? … : 0`, `total ? … : 0`). The per-mode `target`
values (50/45/40/35/30) are static decarbonisation-score benchmarks used to compute a gap
(`avgDecarb − target`) in the Cross-Modal Portfolio tab — plausible relative ordering (maritime
highest target reflecting IMO's tightening CII bands, logistics lowest) but not derived from a named
external benchmark.

### 7.3 KPI definitions and calibration

13 platform-wide KPIs (`KPI_DEFS`) each have a `base` value and a `delta` (period-over-period change)
applied via:

```js
val(period_m) = key==='batteryCost' ? base + delta×(m−1) : base + delta×(m−1)     // identical branches
delta_effective = delta × (m>1 ? m×0.3 : 1)                                        // separate dampened-delta path used elsewhere
```

Note the `val` function's two branches are **identical** (`k.key==='batteryCost' ? … : …` evaluates
the same expression either way) — a vestigial conditional with no behavioural difference, i.e. dead
branching left in the code.

### 7.4 Worked example

Asset `i=10` ('Emirates Airlines' by position): `modeIdx = floor(sr(10*7+3)×5) = floor(sr(73)×5)`.
`sr(73) = frac(sin(74)×10⁴)`; illustratively this lands in the Aviation band (`modeIdx=1`), consistent
with the row's actual list position. `emissions = 0.1+sr(73)×4.9`; `decarbScore = floor(20+sr(83)×75)`
(using `s3=sr(i*13+2)=sr(132)`). Suppose `decarbScore=58` for this asset and the mode's `avgDecarb`
across all Aviation assets computes to 51 vs `target=45`: the Cross-Modal Portfolio tab would show
Aviation **ahead of** its target gap (51 > 45), i.e. "on track" — but because `decarbScore` is
independently random per asset with no link to `intensity`, `emissions`, `corsiaCompliant`, or
`safUsage`, an asset's CORSIA-compliance flag and its decarbonisation score can disagree (e.g. a
CORSIA-non-compliant asset can still draw a high `decarbScore`), which would not happen in a genuine
model where compliance status is a direct input to the score.

### 7.5 Companion analytics

- **Alerts** (25 templates across all 5 modes, e.g. "IMO CII threshold breach," "CORSIA offset
  shortfall detected," "SAF production target missed by 15%") — realistic regulatory-event titles,
  statically authored with fixed severity, not generated from the asset dataset's actual CII ratings
  or SAF-usage figures.
- **Engagement pipeline** — 40 companies × 6 stages (Identified→Resolved), `daysInStage` and
  `priority` independently seeded; `stageCounts`/`avg` days-in-stage are correct aggregate
  calculations over this synthetic funnel.
- **Board Report** — `reportContent`'s Exec Summary text hard-codes `$50.2bn` portfolio value as a
  literal inside a template string (`$${(50.2).toFixed(1)}bn`) rather than computing it from
  `Σ investmentExp` over the 200 assets — a static figure dressed as a live calculation.
- **CSV export** — standard client-side Blob/anchor download of the active report section.

### 7.6 Data provenance & limitations

- **100% synthetic asset, engagement, and alert data**, `sr()`-seeded; company names are real
  transport-sector participants (Maersk, DHL, Union Pacific, Tesla Fleet Ops, etc.) but the attached
  emissions/intensity/investment figures are not their actual disclosed data.
- No modal carbon-intensity (`Lifecycle_GHG/passenger_km`) calculation exists — `intensity` is
  disconnected random noise; see §8 for the production model this should be replaced with.
- Board Report's headline portfolio value ($50.2bn) is hard-coded rather than computed from live
  asset data — will silently drift out of sync if the underlying `investmentExp` figures change.
- The `val()` KPI-projection function's dual branches are functionally identical — indicates
  incomplete implementation of an intended `batteryCost`-specific projection path.

**Framework alignment:** IMO's 2023 revised GHG Strategy (net-zero "by or around" 2050) and the CII
(Carbon Intensity Indicator) A–E rating bands are correctly named and the CII rating field structure
matches IMO's actual scheme, but no CII value is calculated from fuel-consumption/distance data — it
is directly `sr()`-assigned. ICAO CORSIA and EU FuelEU Maritime are represented as compliance flags,
not as offset-requirement or fuel-intensity-target calculations. The EU's 2035 zero-emission new-car
mandate is referenced in the guide but has no corresponding EV-transition trajectory calculation in
code — `evPenetration` is a static random per-asset field.
