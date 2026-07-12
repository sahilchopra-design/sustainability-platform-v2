## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *facility-level DALY and
> liability model* — satellite-derived PM2.5 (MODIS/Sentinel-5P) intersected with portfolio
> facilities, GBD 2021 concentration–response functions, `DALY = YLL + YLD`, and non-attainment
> penalty estimation. **None of that is implemented.** There are no facilities, no satellite data,
> no CRFs, no DALY variable and no liability calculation anywhere in the code. What the page
> actually implements is a *city-level air-quality and health-statistics browser*: 50 synthetic
> cities with rank-gradient pollutant levels, independently drawn health outcome counts, and a
> regulatory/enforcement scorecard, rendered across 4 tabs. The guide should be rewritten; the
> sections below document the code as shipped.

### 7.1 What the module computes

A single `Array.from({length:50})` builds the entire dataset, keyed to a hardcoded list of 50 real
city names (Delhi → São Paulo) with hand-assigned regions/countries. Pollutants follow a
*deterministic rank gradient* plus seeded noise (`sr(s) = frac(sin(s+1)×10⁴)`):

```js
basePM  = 95 − i·1.4 + sr(i·7)·12       // city 0 (Delhi) ≈ 95–107; city 49 ≈ 26–38 µg/m³
baseNO2 = 48 − i·0.6 + sr(i·11)·10
baseSO2 = 35 − i·0.5 + sr(i·13)·8
baseO3  = 80 + sr(i·17)·40              // no gradient
aqi     = round(basePM·3.5 + sr(i·3)·40)
whoCompliant = basePM < 15 ? 'Yes' : 'No'
```

So the city ordering *is* the pollution ranking — Delhi, Lahore, Dhaka intentionally head the
table, echoing real IQAir rankings, but every numeric value is synthetic. Health outcomes are
**independent** `sr()` draws, not functions of PM2.5: `prematureDeaths = round(sr(i·23)·15000+500)`,
`asthmaCases = round(sr(i·29)·80000+5000)`, `copdCases`, `lungCancer`, `childAsthma`,
`healthCostBn = sr(i·19)·25+2`. Each city also carries 12-month PM2.5/NO₂/AQI series
(base ± noise), a 5-year series with mild improvement drift (`pm25 − 2/yr`, `deaths − 200/yr`),
and governance fields (`enforcementScore`, `policyCount`, `monitorStations`, `natStandard`,
`greenSpacePct`, `evAdoption`, `industrialZones`) — all random.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| WHO guideline set (`POLLUTANTS`) | PM2.5 = 5, NO₂ = 10, SO₂ = 20, O₃ = 100, CO = 4 mg/m³, Pb = 0.5 µg/m³ | Correct WHO AQG 2021 values for PM2.5/NO₂ (annual), SO₂/CO (24-h), O₃ (peak-season); Pb 0.5 is the older WHO air-quality guideline — genuinely sourced constants |
| WHO compliance flag | `basePM < 15` | **Inconsistent with the table above** — uses 15 (the AQG *24-hour* PM2.5 level / IT-4-adjacent) rather than the annual guideline of 5 that the page's own `whoGuideline:5` field carries |
| AQI conversion | `AQI ≈ PM2.5 × 3.5 (± noise)`; monthly AQI uses × 3.2 | Synthetic linear proxy; the real US EPA AQI is a piecewise-linear breakpoint function |
| AQI badge bands | > 300 / > 200 / > 150 / > 100 / > 50 | Matches US EPA AQI category boundaries (Unhealthy, Very Unhealthy, Hazardous) |
| Trend label | `sr(i·41) > 0.6` Improving, `< 0.3` Worsening, else Stable | Random draw |
| Page size | 12 rows | UI constant |

### 7.3 Calculation walkthrough

1. **City Dashboard** — filter (search/region/trend) → `stats`: average AQI and PM2.5 over the
   filtered set (`Σ/n||0` guard), WHO-compliant count, total premature deaths, total health cost
   (`Σ healthCostBn × 10⁹`, formatted). Sortable paginated table; row click opens a side panel
   with 21 metrics, the monthly PM2.5 area chart, 5-year deaths/cost lines, and a pollutant radar
   overlaying the city against the WHO guideline polygon.
2. **Pollutant Analysis** — user picks one of 6 pollutants; scatter of pollutant level vs
   premature deaths (bubble size = population), top-15 bar, stacked PM2.5/NO₂/SO₂ comparison, and
   WHO compliance stacked bars per region. Because deaths are independent draws, the scatter shows
   *no real dose–response relationship* — it demonstrates the chart, not epidemiology.
3. **Health Economics** — top-15 deaths bar, health cost by region, stacked disease-burden bars
   (asthma/COPD/lung cancer/child asthma, first 20 filtered cities), PM2.5-vs-cost scatter, and a
   derived **deaths per million** ranking `round(prematureDeaths / pop)` — the only genuinely
   computed health metric on the page.
4. **Regulatory Tracker** — enforcement-vs-PM2.5, green-space-vs-AQI and EV-adoption-vs-PM2.5
   scatters plus a policy/stations table sorted by `enforcementScore`.
5. **CSV export** — serialises the filtered set minus the nested `monthly`/`yearly` arrays.

### 7.4 Worked example (city i = 0, Delhi)

| Step | Computation | Result |
|---|---|---|
| basePM | `95 − 0 + sr(0)·12` = 95 + 0.8415·12 | **105.1 µg/m³** |
| baseNO2 | `48 + sr(0·11)·10` = 48 + 0.8415·10 | **56.4** |
| AQI | `round(105.1·3.5 + sr(0)·40)` = round(367.9 + 33.7) | **402** (badge: red, > 300 band) |
| WHO compliant | 105.1 ≥ 15 | **No** |
| Premature deaths | `round(sr(0)·15000 + 500)` = round(12,622 + 500) | **13,122** |
| Health cost | `sr(0)·25 + 2` = 0.8415·25 + 2 | **$23.0 B** |
| Deaths per million | pop = `sr(0·37)·25 + 1` = 22.0 M → 13,122 / 22.0 | **≈ 596 /M** |

(`sr(0) = frac(sin(1)·10⁴) = 0.8415`; seeds sharing `i = 0` collapse to `sr(0)`, which is why
several Delhi fields reuse 0.8415 — a visible seed-collision artefact at index 0.)

### 7.5 Data provenance & limitations

- **All values are synthetic** `sr()` output; city names and the descending pollution ordering are
  the only reality-anchored elements. No satellite, monitor, or GBD data is ingested.
- Health outcomes are statistically independent of pollutant levels, so cross-charts (pollutant vs
  deaths) cannot exhibit the dose–response the guide describes; a production build would derive
  deaths via GBD relative risks RR(c) applied to baseline mortality.
- `whoCompliant` uses a 15 µg/m³ cutoff while the radar and the `whoGuideline` field use 5 —
  an internal inconsistency worth fixing.
- AQI is a linear scalar of PM2.5 rather than the EPA piecewise breakpoint formula, and ignores
  the other five pollutants that real AQI takes the max over.
- Seed collisions at small indices (e.g. `i·7 = i·11 = 0` for Delhi) correlate fields spuriously.

### 7.6 Framework alignment

- **WHO Air Quality Guidelines 2021** — the `POLLUTANTS` constant faithfully encodes the guideline
  levels; the compliance flag applies a non-standard threshold. WHO AQG derives its levels from
  systematic reviews of mortality CRFs, with interim targets (IT-1…IT-4) as staged milestones.
- **GBD (IHME)** — the guide's cited burden methodology (attributable DALYs via integrated
  exposure–response curves) is absent; the page's disease counts are placeholders for it.
- **US EPA AQI / NAAQS** — badge colour bands follow AQI category cutpoints; the underlying index
  computation is simplified.
- **EU Ambient Air Quality Directive 2008/50/EC** — referenced in the guide only; no limit values
  from it appear in code (the random `natStandard` field, 25–85 µg/m³, plays the national-standard
  role).
