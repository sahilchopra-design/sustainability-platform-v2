# Air Quality Health Risk
**Module ID:** `air-quality-health-risk` · **Route:** `/air-quality-health-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Investor-grade air quality health risk analytics computing PM2.5 and NO2 population exposure, DALY burden calculations, and portfolio company liability exposure from regulatory non-compliance. Integrates satellite-derived air quality data (MODIS, Sentinel-5P), WHO AQG 2021 thresholds, and epidemiological concentration-response functions to quantify stranded cost risk for high-emitting facilities.

> **Business value:** Air quality health risk translates into tangible financial liability through tightening regulatory standards and potential litigation costs. As WHO 2021 guidelines are progressively adopted into national law, portfolio companies with facilities in high-pollution areas face growing exceedance penalties, operational restrictions, and reputational risk that investor engagement can help mitigate.

**How an analyst works this module:**
- Upload or connect facility location data
- PM2.5 Exposure tab maps satellite-derived concentrations against portfolio sites
- DALY Burden tab calculates population health impact per facility
- Regulatory Compliance tab flags exceedances vs NAAQS/EU/WHO thresholds
- Liability Estimation tab models penalty exposure from non-attainment
- Portfolio Aggregation ranks holdings by air quality risk score

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CITIES`, `COLORS`, `PAGE`, `POLLUTANTS`, `REGIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `POLLUTANTS` | 6 | `key`, `label`, `who`, `unit`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `basePM` | `95-i*1.4+sr(i*7)*12;const baseNO2=48-i*0.6+sr(i*11)*10;const baseSO2=35-i*0.5+sr(i*13)*8;const baseO3=80+sr(i*17)*40;` |
| `monthly` | `Array.from({length:12},(_,m)=>({month:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m],pm25:+(basePM+sr(i*100+m*7)*20-10).toFixed(1),no2:+(baseNO2+sr(i*100+m*11)*8-4).toFixed(1),aqi:Math.round` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,pm25:+(basePM-y*2+sr(i*200+y*13)*5).toFixed(1),deaths:Math.round(sr(i*23+y)*15000+500-y*200),cost:+(sr(i*19+y)*25+2-y*0.4).toFixed(1)}));` |
| `POLLUTANTS` | `[{key:'pm25',label:'PM2.5',who:5,unit:'ug/m3',color:T.red},{key:'no2',label:'NO2',who:10,unit:'ug/m3',color:T.amber},{key:'so2',label:'SO2',who:20,unit:'ug/m3',color:T.navy},{key:'o3',label:'Ozone',who:100,unit:'ug/m3',c` |
| `filtered` | `useMemo(()=>{let d=[...CITIES];if(search)d=d.filter(r=>r.city.toLowerCase().includes(search.toLowerCase())\|\|r.country.toLowerCase().includes(search.toLowerCase()));if(regionF!=='All')d=d.filter(r=>r.region===regionF);if(trendF!=='All')d=d.filter(r=>r.trend===trendF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[` |
| `totalPages` | `Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,avgAQI:Math.round(filtered.reduce((s,r)=>s+r.aqi,0)/filtered.length\|\|0),avgPM25:(filtered.reduce((s,r)=>s+r.pm25,0)/filtered.length\|\|0).toFixed(1),whoCompliant:filtered.filter(r=>r.who` |
| `regionAgg` | `useMemo(()=>{const m={};CITIES.forEach(r=>{if(!m[r.region])m[r.region]={region:r.region,pm25:0,aqi:0,deaths:0,cost:0,n:0};m[r.region].pm25+=r.pm25;m[r.region].aqi+=r.aqi;m[r.region].deaths+=r.prematureDeaths;m[r.region].` |
| `pollScatter` | `useMemo(()=>filtered.map(c=>({city:c.city,x:c[pollutant],y:c.prematureDeaths,pop:c.pop})),[filtered,pollutant]);` |
| `trendDist` | `useMemo(()=>{const m={Improving:0,Stable:0,Worsening:0};filtered.forEach(r=>m[r.trend]++);return Object.entries(m).map(([k,v])=>({name:k,value:v}));},[filtered]);` |
| `complianceByRegion` | `useMemo(()=>{const m={};CITIES.forEach(r=>{if(!m[r.region])m[r.region]={region:r.region,compliant:0,non:0};if(r.whoCompliant==='Yes')m[r.region].compliant++;else m[r.region].non++;});return Object.values(m);},[]);  const exportCSV=useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='monthly'&&k!=='` |
| `topDeaths` | `[...filtered].sort((a,b)=>b.prematureDeaths-a.prematureDeaths).slice(0,15);` |
| `costByRegion` | `regionAgg.map(r=>({region:r.region,cost:r.cost})).sort((a,b)=>b.cost-a.cost);` |
| `healthBreak` | `filtered.slice(0,20).map(c=>({city:c.city,asthma:c.asthmaCases,copd:c.copdCases,lung:c.lungCancer,child:c.childAsthma}));` |
| `regData` | `[...filtered].sort((a,b)=>b.enforcementScore-a.enforcementScore).slice(0,20);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `POLLUTANTS`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PM2.5 WHO AQG | — | WHO AQG 2021 | WHO annual guideline; interim target IT-1 is 35, IT-4 is 10 μg/m³ |
| Excess DALY Burden | `YLL+YLD from CRF` | GBD 2021 | Disease burden attributable to ambient PM2.5 above WHO guideline |
| Regulatory Exceedance | — | Satellite/ground monitor | Proportion of portfolio facilities exceeding national ambient air quality standards |
- **Sentinel-5P / MODIS satellite data** → Grid-level PM2.5 retrieval; intersect with facility locations → **Facility-level annual average PM2.5 exposure values**
- **GBD 2021 concentration-response functions** → Apply CRF to excess PM2.5; compute attributable DALYs and liability → **Per-facility DALY burden and regulatory non-compliance penalty exposure**

## 5 · Intermediate Transformation Logic
**Methodology:** WHO AQG concentration-response DALY model
**Headline formula:** `DALY = YLL + YLD; YLL = Deaths × LE_remaining; Exposed_pop = Σ_i(Pop_i × [PM25_i > WHO_threshold])`

Annual average PM2.5 exposure is compared against WHO AQG annual target of 5 μg/m³. Concentration-response functions from GBD 2021 translate excess exposure to attributable deaths and DALYs per 10 μg/m³. Facility-level liability estimated from non-attainment penalties under local regulatory regimes.

**Standards:** ['WHO AQG 2021', 'GBD Study 2021', 'EPA NAAQS']
**Reference documents:** WHO Air Quality Guidelines 2021; Global Burden of Disease Study 2021; US EPA NAAQS Standards; EU Ambient Air Quality Directive 2008/50/EC

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Facility-level DALY and liability model from satellite exposure (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's facility-level model — MODIS/Sentinel-5P PM2.5
intersected with portfolio facilities, GBD 2021 concentration-response functions, `DALY = YLL + YLD`,
and non-attainment penalty estimation — is **entirely absent**: the page is a 50-city browser where
pollution follows a hand-assigned rank gradient (`basePM = 95 − i·1.4 + noise`) and, critically,
health outcomes (`prematureDeaths`, `asthmaCases`) are **independent random draws unrelated to
PM2.5**, so the dose-response cross-charts show no real epidemiology (§7.5). Evolution A builds the
guide's model: ingest satellite-derived gridded PM2.5 (the platform already wires Sentinel-family
sources in the physical-risk digital twin), intersect with uploaded facility coordinates, apply GBD
relative-risk functions RR(c) to baseline mortality for attributable deaths and DALYs, and estimate
non-attainment liability from local regulatory penalty schedules.

**How.** `POST /api/v1/aq-health/facility-assessment` (coordinates + population → exposure, DALYs,
liability) sourcing PM2.5 from a satellite ingester and CRFs from a GBD reference table; portfolio
aggregation ranks holdings by a computed air-quality risk score. Rung 3: calibrate attributable
deaths against WHO/IHME State-of-Global-Air country totals.

**Prerequisites (hard).** Purge the `sr()`-driven health draws and the rank-gradient pollution
generator per the no-fabricated-random guardrail; fix the documented `whoCompliant < 15` vs
`whoGuideline = 5` internal inconsistency (§7.5); resolve the small-index seed collisions (Delhi's
fields all reuse `sr(0)`). **Acceptance:** premature deaths become a function of PM2.5 via CRF (the
scatter shows real dose-response); WHO compliance uses the annual 5 µg/m³ guideline consistently; a
facility in a higher-PM2.5 grid cell shows higher attributable DALYs.

### 9.2 Evolution B — Air-quality liability copilot for portfolio engagement (LLM tier 1 → 2)

**What.** A copilot answering "which portfolio holdings face the most air-quality liability?", "why
is this city's health cost so high?", and "what's the regulatory exposure as WHO 2021 guidelines
enter national law?" — grounded in the page's computed rankings (deaths-per-million is the one real
health metric today) and, post-Evolution A, the facility-level engine. Since health outcomes are
currently independent of pollution, the tier-1 copilot must disclose that the dose-response shown is
synthetic and cannot support real liability estimates.

**How.** Tier-1 roadmap pattern: §7.2 WHO guideline constants (genuinely sourced) and §7.6 framework
alignment (WHO AQG, GBD, EPA NAAQS, EU AAQD) embedded as the module corpus; page state (filtered
cities, selected pollutant) as context; served via `POST /api/v1/copilot/air-quality-health-risk/
ask` with the standard refusal path. After Evolution A, graduates to tier 2 by tool-calling
`POST /facility-assessment` for real per-holding liability, with the no-fabrication validator
checking every DALY and penalty figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** every figure cited matches page state with its synthetic status stated; a request
for a facility liability estimate before Evolution A returns a refusal naming the absent
satellite/CRF/penalty inputs.