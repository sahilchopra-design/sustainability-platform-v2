## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an enterprise decarbonisation-programme manager
> computing a *Decarbonisation Rate* `DR = (Baseline − Current)/Baseline × 100` from a real GHG
> inventory, with SBTi 4.2%/yr pathway alignment, CapEx-to-abatement tracking, and a marginal-abatement
> curve. **None of these are computed from real data.** The page renders 60 fully **synthetic**
> companies (every metric — emissions, SBTi status, progress %, credibility, abatement cost — is drawn
> from the seeded PRNG `sr()`), a fixed 7-point pathway, and a **static** 10-row abatement cost table.
> There is no DR calculation, no per-company baseline, and no MAC ranking beyond the hard-coded table.
> Sections below document the synthetic dashboard.

### 7.1 What the module computes

```js
COMPANIES = 60 firms; each metric seeded, e.g.:
  totalEmissions = round(5 + sr(i·7)·495)      // 5–500 MtCO₂
  sbtiStatus     = sr(i·29) thresholds → Approved | Committed | Near-term | None
  progressPct    = round(5 + sr(i·37)·60)
  credibilityScore = round(15 + sr(i·71)·80)
  roadmapStatus  = sr(i·73) thresholds → On Track | Behind | At Risk | No Plan
PATHWAY  = 7 points 2025–2055: currentEmissions=100−10i(+noise), targetEmissions=100−14i, sbtiPath=100−16i
ABATEMENT = 10 static levers {measure, cost $/tCO₂, potential %}
```

Aggregates are simple sums/means over the synthetic set: `stats.totalEmissions`, `avgProgress`,
`sbtiApproved` count, `avgCredibility`, `onTrack` count. Charts: SBTi/roadmap pie distributions,
sector-emission bars, the fixed pathway line, credibility-vs-progress scatter, and a cumulative
abatement column on the static levers.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Companies | 60 real names, sector-tagged | names real; all metrics synthetic (`sr()`) |
| Pathway | current −10/pt, target −14/pt, SBTi −16/pt | illustrative linear glide (indexed to 100) |
| Abatement levers | Energy Efficiency $15/18%, Renewables $25/22%, Electrification $45/15%, H₂ $80/12%, CCUS $95/10%, Nature $20/8%, Circular $35/7%, Fuel-switch $55/6%, Process $70/5%, Offsets $30/4% | static, plausible MAC values |

The abatement table is the only quasi-real content: cost ($/tCO₂) and potential (%) values are
sensible order-of-magnitude estimates for each lever, and the cumulative-potential column is a real
running sum — but they are portfolio-agnostic constants, not derived from the companies.

### 7.3 Calculation walkthrough

Filter/search/sort over the 60 companies → paginated table + KPIs. The SBTi tracker cross-tabs status
by sector (stacked bars) and target-year distribution (pie). The abatement tab plots the static levers
as a cost/potential bar + scatter and a cumulative table. The roadmap tab shows the fixed pathway and
sector-average progress. The side panel renders a radar of a selected company's synthetic
progress/renewable/efficiency/credibility/CCUS/target axes.

### 7.4 Worked example

Company i=0 (Exxon Mobil, Energy): `totalEmissions = round(5 + sr(0)·495)`. `sr(0) = frac(sin(1)·10⁴)
= frac(8414.7…) = 0.7099` → `round(5 + 0.7099·495) = round(356.4) = 356 MtCO₂`.
`sbtiStatus` from `sr(0) = frac(sin(1)·10⁴)`… (different seed `i·29 = 0` → same `sr(0)=0.7099 > 0.7`)
→ `'None'`. Cumulative abatement after the top-3 levers = `18 + 22 + 15 = 55%`. All figures are stable
across renders (seeded) but bear no relation to Exxon's actual inventory.

### 7.5 Data provenance & limitations

- **Every company-level metric is synthetic**, seeded by `sr(seed) = frac(sin(seed+1)×10⁴)`; only the
  company names/sectors are real. There is no GHG inventory, no baseline, no computed DR.
- The pathway is a fixed linear glide indexed to 100, not fitted to any company or to the SBTi 4.2%/yr
  absolute-contraction rate the guide cites.
- The MAC table is static and portfolio-independent — no per-lever CapEx/OpEx/savings decomposition,
  no ordering by ascending MAC beyond its authored order.

**Framework alignment:** SBTi Corporate Net-Zero Standard — the SBTi status buckets and the 1.5 °C
"4.2 %/yr absolute reduction" reference the real standard (SBTi validates a company's near-term and
net-zero targets against sector/absolute pathways), but this page only *labels* companies, it does not
validate targets. GHG Protocol Scope 1/2/3 framing appears in the schema; TCFD Metrics & Targets
motivate the progress/credibility read-outs. A production hub would ingest audited inventories and
compute DR + SBTi-pathway alignment per company — see the companion `decarbonisation-roadmap` module
for the MAC-curve mechanics.
