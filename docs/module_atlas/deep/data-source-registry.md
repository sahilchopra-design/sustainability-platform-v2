## 7 · Methodology Deep Dive

The guide promises a *Data Quality assessment* `DQ_composite = avg(completeness, timeliness, accuracy,
coverage)` over "24 sources". The code implements a lighter version: it reads `REFERENCE_DATA_SOURCES`
and the `TAXONOMY_TREE` leaf nodes' pre-assigned PCAF quality scores, derives a DQ distribution, finds
uncovered/low-quality taxonomy nodes, and simulates a refresh/integration log. There is no live
4-dimension composite; DQ comes pre-baked on the taxonomy leaves. This is a governance dashboard, not
a scoring engine — no ⚠️ mismatch is raised because the guide itself is modest, but note the composite
formula is not computed here.

### 7.1 What the module computes

```js
leaves = getLeafNodes()                       // taxonomy L4 nodes, each carrying .quality (PCAF 1–5) + .dataSources
dqDistribution = count leaves by l.quality (1..5)
coverageGaps   = leaves.filter(l => !l.dataSources?.length || l.quality >= 4).slice(0,25)
refreshData    = REFERENCE_DATA_SOURCES.map(sr-driven frequency/lastRefresh/records + overdue flag)
INTEGRATION_LOG = 20 synthetic pull events (status/records/duration via sr())
```

- **DQ distribution** groups leaf nodes by their embedded PCAF quality score (1 = Reported/best …
  5 = Proxy/worst) with fixed colour + label maps (`DQ_LABELS`, `DQ_COLORS`).
- **Coverage gaps** = leaves with *no* data source OR quality ≥ 4 (DQ4 Modelled / DQ5 Proxy), capped
  at 25, tagged `HIGH` if DQ5 else `MEDIUM`.
- **Refresh status** = each source given a synthetic frequency and "days ago"; `overdue` if the lag
  exceeds the cadence (Daily>2d, Weekly>10d, Monthly>35d).

### 7.2 Parameterisation / rubric

| Element | Values | Provenance |
|---|---|---|
| PCAF DQ labels | 1 Reported · 2 Verified · 3 Estimated · 4 Modelled · 5 Proxy | PCAF Data Quality Hierarchy (financed-emissions scoring) |
| DQ colours | green→red ramp | UI convention |
| Gap trigger | `no dataSources` OR `quality ≥ 4` | code heuristic |
| Overdue rule | Daily>2d, Weekly>10d, Monthly>35d | code heuristic |
| Avg DQ KPI | hard-coded **"2.4"** | display constant (not recomputed from `leaves`) |
| Recommended sources | Climate TRACE, MSCI, Sustainalytics, S&P Trucost, NGFS, Copernicus CDS, OSM, World Bank WDI | real public/vendor catalogue, static |

The headline "Avg DQ Score 2.4" is a literal string in the KPI array, **not** derived from
`dqDistribution` — a small guide↔code inconsistency worth noting.

### 7.3 Calculation walkthrough

`getLeafNodes()` flattens the taxonomy → each leaf's pre-baked `.quality` drives the DQ bar/pie. The
same leaves feed `coverageGaps` (uncovered or ≥DQ4). `REFERENCE_DATA_SOURCES.length` populates
"Total Sources"; `coverageGaps.length` and `refreshData.filter(overdue)` populate the other KPIs.
`INTEGRATION_LOG` and `refreshData` are purely presentational, seeded by `sr()`.

### 7.4 Worked example

Suppose 300 leaf nodes: 40 at DQ1, 90 DQ2, 80 DQ3, 60 DQ4, 30 DQ5, plus 15 with no `dataSources`.
- **DQ bars** render counts 40/90/80/60/30.
- **Coverage gaps** = the 15 source-less nodes + all DQ4/DQ5 nodes (60+30=90), min(sum,25)=**25** shown;
  DQ5 nodes get `HIGH`, DQ4 `MEDIUM`.
- A *true* PCAF-weighted average would be `(40·1+90·2+80·3+60·4+30·5)/300 = (40+180+240+240+150)/300 =
  850/300 = 2.83` — note this differs from the displayed 2.4, confirming the KPI is a static label.

### 7.5 Data provenance & limitations

- `refreshData` frequencies/last-refresh and the entire `INTEGRATION_LOG` are synthetic, seeded by
  `sr(seed) = frac(sin(seed+1)×10⁴)`. Records counts and durations are decorative.
- Leaf `.quality` scores are analyst-assigned in `taxonomyTree`, not measured — the DQ distribution is
  as good as those manual tags.
- No live 4-dimension composite (completeness/timeliness/accuracy/coverage) despite the guide formula;
  `avgQuality` per source is read from the seed object where present.

**Framework alignment:** PCAF *Data Quality Score* 1–5 — the platform's core lens; PCAF assigns DQ per
financed-emissions data point by the reliability of its source (audited emissions = DQ1 … economic-
activity proxies = DQ5), exactly the ladder this registry surfaces. The recommended-sources table maps
gaps to TCFD/ISSB IFRS S2 data needs (physical hazard layers → Copernicus; scenario params → NGFS),
reflecting IFRS S2's requirement to disclose data sources and their limitations.
