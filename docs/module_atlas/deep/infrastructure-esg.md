## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a GIIA-framework **carbon
> intensity engine** — `CI_infra = Total_CO2e / Throughput_metric` — normalising Scope 1+2 by a
> sector throughput (kWh, vehicle-km, ML treated) and benchmarking against IEA NZE pathways.
> **The code computes no such intensity.** `carbonInt`, `esgScore`, `gresbScore`, `ifcPerf`,
> `waterRisk`, `safetyRate`, etc. are all **independent PRNG draws** — there is no throughput,
> no emissions total, no NZE benchmark. The module is a 50-project **synthetic ESG dashboard**
> (filter, paginate, chart, quartile-rank). Sections below document the code.

### 7.1 What the module computes

`genProjects(50)` fabricates 50 infrastructure projects. Every attribute is a scaled `sr()` draw
(`sr(s)=frac(sin(s+1)×10⁴)`), e.g.:

```js
inv       = floor(100 + s4*4900)                 // $M investment
esgScore  = floor(30 + s5*65)                    // 30–95
gresbScore= s6>0.3 ? floor(40 + s7*55) : null    // 70% coverage
ifcPerf   = floor(40 + s8*55)                    // IFC PS performance
carbonInt = floor(20 + sr(i*67+41)*480)          // 20–500 "gCO2/kWh" — a raw draw, NOT Total/Throughput
safetyRate= (0.5 + sr(i*83+59)*4.5).toFixed(2)   // LTIFR 0.5–5.0
compliance= sr(...)>0.5?'Full':sr(...)>0.3?'Partial':'Non-compliant'
```

The page then does honest aggregation over the filtered set: distribution counts by sector / stage /
risk / compliance, an ESG-vs-IRR scatter, a country-investment map, a four-quarter trend, and an
ESG-score quartile split (`sorted = [...filtered].sort(desc esgScore)`, quartile size `ceil(n/4)`).

### 7.2 Parameterisation / scoring rubric

| Attribute | Range / rule | Provenance |
|---|---|---|
| `esgScore`, `envScore`, `socScore`, `govScore` | 30–95 | Independent `sr()` draws — no pillar aggregation |
| `gresbScore` | 40–95 (30% null) | `sr()` draw; GRESB is *named* but not computed |
| `ifcPerf` / `ifcCat` | 40–95 / {A,B,C} | `sr()` draws mapped to IFC Performance Standard categories |
| `carbonInt` | 20–500 gCO₂/kWh | **Raw draw**, labelled as intensity but not `CO₂/throughput` |
| `waterRisk`, `bioImpact`, `commScore` | 10–95 / 5–95 / 20–95 | `sr()` draws |
| `safetyRate` (LTIFR) | 0.5–5.0 | `sr()` draw; guide benchmark <1.0 best-in-class |
| `compliance` | Full/Partial/Non-compliant | Two-threshold `sr()` gate |
| `sdgAlign` | 1–7 | `sr()` count of aligned SDGs |
| `esgColor` band | ≥75 green, ≥55 amber, else red | Display threshold |
| `riskColor` | Low/Med/High/Critical | Display threshold |

Sectors (8), countries (15), stages (4), risk levels (4), IFC categories (3) are fixed taxonomies.

### 7.3 Calculation walkthrough

1. `genProjects` seeds 10+ `sr()` variates per project → static 50-row `DATA`.
2. Filters (sector/country/stage/risk/search) produce `filtered`; `paged` slices 12/page.
3. Distribution memos bucket `filtered` by categorical fields for the pie/bar charts.
4. `scatterData` maps each project to `{esg, irr, inv}`; `trendData` averages quarterly score fields.
5. `countryInvData` sums `inv` by country; quartile view sorts by `esgScore` and splits into 4.
6. KPI cards report averages/counts over `filtered` (e.g. `avg(key) = Σ r[key]/filtered.length`).

### 7.4 Worked example

Take project *i = 0*: seeds `s5 = sr(17)`, etc. Suppose the draws give `esgScore = 72`,
`carbonInt = 210`, `safetyRate = 1.8`, `inv = $2,400M`, `irr = 9.2%`, `compliance = 'Partial'`.

| Output | Computation | Result |
|---|---|---|
| ESG band | 72 ∈ [55,75) | amber |
| Scatter point | `{esg:72, irr:9.2, inv:2400}` | plotted |
| Quartile | if 72 in top-25% of sorted esgScores | Q1/Q2 label |
| Contributes to KPI avg ESG | `+72` to Σ, `/n` at end | — |

There is **no** step where `carbonInt = 210` is derived from an emissions total ÷ throughput — it is
simply the draw `floor(20 + sr(41)·480)`. The IEA NZE 30 gCO₂/kWh target in the guide is never
compared.

### 7.5 Companion analytics on the page

- Sector/stage/risk/compliance **distribution** pies and bars over the filtered set.
- **ESG-vs-IRR scatter** (impact–return trade-off view) with sector colouring.
- **Country investment** aggregation; **quarterly trend** of mean `q1–q4Score`.
- CSV export of the full filtered table.

### 7.6 Data provenance & limitations

- **100 % synthetic** — every project attribute is `sr()`-seeded; no real asset operational data,
  emissions, throughput, or GRESB/IFC submission is ingested.
- The headline "carbon intensity" is a decorative random number, **not** a GIIA KPI 4.1 computation.
- ESG pillar scores are independent draws, not a weighted E/S/G aggregation, so the composite
  `esgScore` bears no arithmetic relationship to `envScore`/`socScore`/`govScore`.
- Compliance status and safety rate are unrelated to any incident or regulatory dataset.

**Framework alignment:** *GIIA Global ESG Reporting Framework* — the KPI vocabulary (carbon
intensity, NRW/water loss, LTIFR, renewable share) is referenced but none of the KPIs are computed to
GIIA definitions. *GRESB Infrastructure* — a `gresbScore` field exists but no GRESB assessment logic
(aspect weighting, validation) runs. *IFC Performance Standards* — projects carry an IFC category
label (A/B/C) and a performance draw, echoing IFC PS environmental & social risk categorisation, but
no PS screening is performed. *IEA NZE sector pathways* — cited as the intensity benchmark, absent
from code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute real, comparable GIIA-framework ESG KPIs for an operating infrastructure portfolio — above
all a **sector-normalised carbon intensity** benchmarked to IEA NZE pathways — plus a defensible
E/S/G composite, from asset operational data. Serves infra fund GP/LP ESG reporting.

### 8.2 Conceptual approach
Replace random draws with an **activity-data → emission-factor → throughput-normalisation** pipeline
(GHG Protocol Scope 1/2, location- and market-based) and a **weighted-pillar composite** benchmarked
against GRESB Infrastructure aspect scoring and MSCI/Sustainalytics ESG-rating construction. Intensity
gap = asset CI minus the sector NZE pathway value for the year.

### 8.3 Mathematical specification
For asset *a* in sector *k*:

```
Scope1_a = Σ_f Q_{a,f} · EF_f                          // fuels f, activity Q, emission factor EF
Scope2_a = E_a · GI_{grid(a),year}                     // purchased electricity × grid intensity (location) 
CI_a     = (Scope1_a + Scope2_a) / Throughput_{a,k}    // k-specific unit (kWh, veh-km, ML)
Gap_a    = CI_a − NZE_{k,year}                          // >0 ⇒ above pathway
ESG_a    = w_E·E_a + w_S·S_a + w_G·G_a                  // pillar scores 0–100, weights sum to 1
E_a      = f(CI percentile, water-loss, renewable share, biodiversity)  // GIIA env KPIs, benchmarked
S_a      = f(LTIFR, community, jobs)  ;  G_a = f(policy, board, disclosure)
```

| Parameter | Source |
|---|---|
| Fuel emission factors `EF_f` | IPCC AR6 / DEFRA 2023 |
| Grid intensity `GI` | IEA / eGRID by region-year |
| NZE sector pathways `NZE_{k,year}` | IEA Net Zero by 2050 sector trajectories |
| Pillar weights `w_E,w_S,w_G` | GIIA/GRESB materiality; sector-specific |
| Benchmark distributions | GRESB Infrastructure peer medians |

### 8.4 Data requirements
Per asset: fuel consumption by type, purchased electricity + contractual instruments (for
market-based), throughput metric, water produced/lost, H&S incident hours & counts, workforce, board/
policy attributes. Platform has: taxonomy scaffolding and `reference_data` for IEA/eGRID factors;
would need real asset operational feeds (currently absent).

### 8.5 Validation & benchmarking plan
Reconcile computed Scope 1+2 against assets' audited GHG inventories; benchmark CI distribution vs
GRESB peer medians; sensitivity of ESG composite to pillar weights; back-check NZE-gap sign against
known green vs fossil assets (renewables CI <5, gas peaker 400–500).

### 8.6 Limitations & model risk
Throughput-metric heterogeneity across sectors limits cross-sector CI comparability; market- vs
location-based Scope 2 divergence is material for renewable-PPA assets; pillar-weight subjectivity
drives composite rank instability. Conservative fallback: report CI per sector separately and the
ESG composite as a band, not a single cross-portfolio ranking.
