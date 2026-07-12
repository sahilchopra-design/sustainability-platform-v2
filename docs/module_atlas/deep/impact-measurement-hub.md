## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this route — sections below document the code directly.)*

An **impact-measurement hub**: it generates a synthetic portfolio of holdings, each carrying an impact
score, additionality score, impact-weighted profit adjustment, per-$M impact efficiency and three
headline impact metrics (CO₂ avoided, jobs created, lives improved), plus theory-of-change progress,
alerts and engagement status. All quantities are seeded PRNG; the module is a reporting/aggregation
layer, not a measurement model.

### 7.1 What the module computes

Per holding (index `i`), via `sr(s)=frac(sin(s+1)×10⁴)` with large seed offsets:

```js
sdgCoverage        = floor(sr(i·31+1030)·8 + 4)          // 4–11 SDGs
impactScore        = round(sr(i·43+1050)·50 + 35)        // 35–85
additionalityScore = round(sr(i·53+1060)·50 + 30)        // 30–80
iwaProfitAdj       = round((sr(i·67+1070)·200 − 80)·10)/10   // −80 … +120 $Mn
invested           = round((sr(i·71+1080)·50 + 5)·10)/10  // $5–55M
impactPerM         = round(sr(i·29+1090)·60 + 10)        // 10–70
co2Avoided         = round(sr(i·37+1100)·10000 + 500)    // 500–10 500 tCO₂e
jobsCreated        = round(sr(i·41+1110)·500 + 20)
livesImproved      = round(sr(i·47+1120)·2000 + 100)
```

Portfolio KPIs are straight reductions:

```js
totInvested = round(Σ invested)
avgImpact   = round(Σ impactScore / n)
avgAdditionality = round(Σ additionalityScore / n)
totIWAdj = round(Σ iwaProfitAdj) ;  totCO2 = Σ co2Avoided ;  totJobs = Σ jobsCreated
avgToC   = round(Σ tocProgress / n)
```

### 7.2 Parameterisation / scoring rubric

| Quantity | Range | Provenance |
|---|---|---|
| `impactScore` | 35–85 | Synthetic |
| `additionalityScore` | 30–80 | Synthetic |
| `iwaProfitAdj` | −80 … +120 $Mn | Synthetic (IWA-style profit adjustment, can be negative) |
| `impactPerM` | 10–70 | Synthetic impact efficiency |
| `co2Avoided` | 500–10 500 tCO₂e | Synthetic |
| Company identity | prefix+suffix+sector from PRNG indices | Synthetic |
| Alerts / engagement status | random type/severity/status index | Synthetic |

The report-section list, IRIS+ framing and IWA vocabulary are real; every number is PRNG.

### 7.3 Calculation walkthrough

Holdings are generated (company identity from `pIdx`/`sIdx`/`secIdx` PRNG index draws over
prefix/suffix/sector arrays), each enriched with the scores above and a per-company alert/engagement
record. `kpis` reduces the holdings to portfolio totals and averages. `trendData` builds an 8-quarter
series. Charts show impact-score distribution, additionality, IWA adjustment and impact-per-$M scatter.

### 7.4 Worked example (portfolio of 40, illustrative)

If the 40 holdings average `impactScore = 60`, `additionalityScore = 55`, `invested = $30M` each,
`co2Avoided = 5 500` each:

| KPI | Computation | Result |
|---|---|---|
| totInvested | 40 × 30 | **$1 200M** |
| avgImpact | Σ/40 | **60** |
| avgAdditionality | Σ/40 | **55** |
| totCO2 | 40 × 5 500 | **220 000 tCO₂e** |

### 7.5 Data provenance & limitations

- **Every quantity is synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)` with +1030…+1310 seed offsets to
  decorrelate metric streams). Company names are PRNG-assembled, not real issuers.
- There is **no measurement model** — impact score, additionality, IWA adjustment and impact-per-$M are
  independent draws with no causal or accounting relationship to one another.
- Theory-of-change progress, alerts and engagement status are cosmetic workflow scaffolding.

**Framework alignment:** the module *references* the IMP five dimensions, GIIN IRIS+ metric catalogue,
Harvard Impact-Weighted Accounts and additionality (IMP counterfactual) as vocabulary. None is computed:
a production version would consume the monetisation model specified in `impact-weighted-accounts` §8 and
the additionality/verification logic in `impact-verification` §8, aggregating real investee-reported
KPIs rather than PRNG draws.
