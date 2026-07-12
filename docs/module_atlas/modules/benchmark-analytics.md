# ESG Benchmark Analytics
**Module ID:** `benchmark-analytics` · **Route:** `/benchmark-analytics` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG benchmark comparison engine. Covers Paris-aligned benchmarks (PAB), climate transition benchmarks (CTB), ESG-screened indices, and custom benchmark construction.

> **Business value:** EU PAB and CTB are increasingly adopted by institutional investors as portfolio benchmarks — 100s of ETFs and funds track these indices. Understanding benchmark methodology enables managers to construct compliant portfolios and explain performance attribution from ESG tilts vs conventional indices.

**How an analyst works this module:**
- Benchmark Library shows all major ESG indices with characteristics
- PAB/CTB Compliance checks portfolio against EU regulation requirements
- Tracking Error shows deviation from selected benchmark
- Carbon Tilt compares portfolio CI to benchmark CI
- Custom Builder designs bespoke ESG benchmark for internal use

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BENCHMARKS`, `MONTHLY`, `PAGE`, `PROVIDERS`, `REGIONS`, `SECTORS`, `SECTOR_DATA`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TYPES` | `['ESG Leaders','SRI','Paris-Aligned','Climate Transition','Low Carbon','Gender Equality','Social','Green Bond','Thematic','Multi-Factor ESG'];` |
| `REGIONS` | `['Global','US','Europe','Asia-Pacific','Emerging Markets','Japan','UK','China'];` |
| `prov` | `PROVIDERS[Math.floor(sr(i*3)*PROVIDERS.length)];` |
| `type` | `TYPES[Math.floor(sr(i*7)*TYPES.length)];` |
| `reg` | `REGIONS[Math.floor(sr(i*11)*REGIONS.length)];` |
| `SECTOR_DATA` | `SECTORS.map((s,i)=>({name:s,esgWeight:+(sr(i*121)*15+2).toFixed(1),parentWeight:+(sr(i*127)*15+2).toFixed(1),overweight:+(sr(i*121)*15+2-sr(i*127)*15-2).toFixed(1)}));` |
| `filtered` | `useMemo(()=>{let d=[...BENCHMARKS];if(search)d=d.filter(b=>b.name.toLowerCase().includes(search.toLowerCase())\|\|b.provider.toLowerCase().includes(search.toLowerCase()));if(filterProv!=='All')d=d.filter(b=>b.provider===filterProv);if(filterType!=='All')d=d.filter(b=>b.type===filterType);d.sort((a,b)=>sortDir==='asc'?((a[sortCol]>b[sortCol]` |
| `exportCSV` | `(data,fn)=>{if(!data.length)return;const h=Object.keys(data[0]);const csv=[h.join(','),...data.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `kpis` | `useMemo(()=>{const n=filtered.length\|\|1;return{count:filtered.length,totalAum:filtered.reduce((s,b)=>s+b.aum,0),avgEsg:(filtered.reduce((s,b)=>s+parseFloat(b.esgScore),0)/n),avgReturn:(filtered.reduce((s,b)=>s+parseFloat` |
| `provDist` | `useMemo(()=>{const m={};PROVIDERS.forEach(p=>m[p]=0);filtered.forEach(b=>m[b.provider]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name,value}));},[filtered]);` |
| `typeDist` | `useMemo(()=>{const m={};TYPES.forEach(t=>m[t]=0);filtered.forEach(b=>m[b.type]++);return Object.entries(m).filter(([,v])=>v>0).map(([name,value])=>({name:name.length>14?name.slice(0,14)+'..':name,value}));},[filtered]);` |
| `methDist` | `[];const mMap={};filtered.forEach(b=>{mMap[b.methodology]=(mMap[b.methodology]\|\|0)+1;});Object.entries(mMap).forEach(([name,value])=>methDist.push({name,value}));` |
| `rebDist` | `[];const rMap={};filtered.forEach(b=>{rMap[b.rebalance]=(rMap[b.rebalance]\|\|0)+1;});Object.entries(rMap).forEach(([name,value])=>rebDist.push({name,value}));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/benchmarks/sector/{sector}` | `get_sector_benchmark` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/sectors` | `list_sector_benchmarks` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/waci` | `calculate_waci` | api/v1/routes/benchmarks.py |
| GET | `/api/v1/benchmarks/stats` | `benchmark_stats` | api/v1/routes/benchmarks.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EDGAR` *(shared)*, `__future__` *(shared)*, `api` *(shared)*, `db` *(shared)*, `fastapi` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*, `yfinance`
**Frontend seed datasets:** `PROVIDERS`, `REGIONS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PAB Carbon Intensity | — | EU PAB Regulation | Minimum decarbonisation requirement vs parent index |
| CTB Carbon Intensity | — | EU CTB Regulation | Lower bar for climate transition benchmark |
| PAB Annual Decarbonisation | — | EU PAB Regulation | Required annual pace of GHG intensity reduction in benchmark |
- **Parent index constituents** → ESG screen and tilt → **ESG benchmark weights**
- **Portfolio weights** → TE calculation → **Benchmark deviation**
- **Benchmark CI** → Portfolio CI comparison → **Carbon tilt vs benchmark**

## 5 · Intermediate Transformation Logic
**Methodology:** Benchmark construction and tracking
**Headline formula:** `TE = std(r_portfolio - r_benchmark); TiltScore = Σ(w_i - b_i) × CI_i`

EU PAB: 50%+ decarbonised vs parent, -7% p.a., no fossil fuel sector leader exclusion. CTB: 30% decarbonised vs parent. Both require overweight of Paris-aligned issuers. Carbon tilt: weighted average carbon intensity improvement vs parent index.

**Standards:** ['EU PAB/CTB Regulation 2019/2089', 'MSCI Climate Indexes', 'FTSE Russell Climate Indexes']
**Reference documents:** EU Regulation 2019/2089 on EU PAB/CTB; MSCI Climate Indexes Methodology; FTSE Russell Climate Risk-Adjusted World Government Bond Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **66** other module(s).

| Connected module | Shared via |
|---|---|
| `module-navigator` | table:api, table:sqlalchemy |
| `reference-data-explorer` | table:api, table:sqlalchemy |
| `credit-spread-climate-monitor` | table:api, table:sqlalchemy |
| `real-estate-carbon-analytics` | table:api, table:sqlalchemy |
| `advanced-report-studio` | table:EDGAR |
| `advanced-reactor-finance` | table:EDGAR |
| `portfolio-stress-test-drilldown` | table:api |
| `portfolio-transition-alignment` | table:api |
| `portfolio-climate-pulse` | table:api |
| `portfolio-climate-var` | table:api |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises benchmark-construction math —
> `TE = std(r_portfolio − r_benchmark)`, `TiltScore = Σ(w_i − b_i) × CI_i`, and EU PAB/CTB
> compliance checks (−50%/−30% decarbonisation vs parent, −7% p.a. trajectory). **None of these
> are computed.** The frontend's `trackingError`, `carbonIntensity`, `tempAlignment` etc. are
> *seeded random fields* on 60 synthetic indices — no return series, weights, or parent-index
> comparison exists. Separately, the module's registered backend
> (`backend/api/v1/routes/benchmarks.py`) is a *different animal*: sector market benchmarks from
> real yfinance/SEC-EDGAR reference tables plus a WACI endpoint whose carbon intensity is an
> explicit `None` placeholder ("pending A17 integration") — and the page never calls any of it.

### 7.1 What the module computes

**Frontend:** a screener over 60 synthetic ESG indices, generated as
`"{provider} {region} {type} Index"` from 10 real providers (MSCI, S&P DJI, FTSE Russell, …) ×
10 index types × 8 regions, each with seeded attributes:

```js
constituents 50–850 · aum $1–51B · esgScore 55–85 · carbonIntensity 20–170
returnYtd −5…+20% · return1y −8…+22% · volatility 5–20% · sharpe 0.1–1.6
trackingError 0.2–3.2% · turnover 5–25% · exclusions 10–210 · womenBoard 15–40%
greenRevPct 10–50% · tempAlignment 1.2–2.7 °C · methodology ∈ {Best-in-class, Exclusion,
Optimization, Tilt, Composite} · parentIndex ∈ {MSCI World, S&P 500, …}
```

Derived values are descriptive statistics only: filtered KPIs (`count`, `Σ aum`, mean ESG/YTD-
return/carbon over the filtered set with `n = length‖1` guard), provider/type/methodology/
rebalance distribution maps, and a 24-month synthetic performance chart (`MONTHLY`: ESG Leaders /
parent / PAB / CTB monthly returns each drawn independently from `sr` ranges — so the "PAB vs
parent" comparison lines share no common market factor).

**Backend (uncalled by this page):** `GET /api/v1/benchmarks/sector/{sector}`, `/sectors`,
`/stats` — sector aggregates over `YfinanceMarketData`; and `GET /waci?tickers=…` which computes
EVIC-share weights `weight_i = EVIC_i / Σ EVIC` from real market data and EDGAR 10-K revenue but
returns `carbon_intensity_proxy: None` with the note "WACI calculation requires emissions data
linkage (pending A17 integration)".

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Index universe | 60 indices, seeded | synthetic |
| Sector tilt table | 11 sectors, `esgWeight`/`parentWeight` each 2–17%, overweight = difference | synthetic (weights don't sum to 100%) |
| Page size | 12 rows | UI constant |
| Backend WACI formula (docstring) | `WACI = Σ(weight_i × emissions_i / revenue_i)` | PCAF/TCFD definition, correctly stated, unimplemented pending emissions linkage |

The guide's regulatory constants (PAB −50% CI at launch, CTB −30%, −7% p.a. self-decarbonisation,
fossil-fuel exclusions) are accurate statements of **EU Regulation 2019/2089 + Delegated
Regulation 2020/1818** but appear nowhere in code.

### 7.3 Calculation walkthrough

1. **Index Overview** — KPI cards over the filtered set; provider market-share pie; the 4-line
   synthetic performance chart; monthly flows/new-launch bars.
2. **Benchmark Screener** — search + provider/type filters → generic sort (note: the comparator
   `(a[c]>b[c])?1:-1` never returns 0, making the sort unstable for ties) → 12-per-page table with
   expandable rows and CSV export (JSON-stringified cells).
3. **Performance Analytics** — scatter/rankings over the seeded return/vol/sharpe fields.
4. **Methodology Comparison** — distribution of the 5 methodology labels and rebalance
   frequencies; sector over/under-weight bars from `SECTOR_DATA`.

### 7.4 Worked example — KPI aggregation over a filter

Filter `type = 'Paris-Aligned'`: suppose it matches k indices (deterministic for the fixed seeds).
The KPI row computes, e.g., `avgCarbon = Σ carbonIntensity / max(k,1)`. Because every attribute is
an independent uniform draw, the filtered Paris-Aligned subset has the *same expected* carbon
intensity (≈ 95 tCO₂e/$M mid-range) as ESG Leaders or Green Bond subsets — i.e. the data does not
encode the very property (PAB CI ≪ parent CI) the module is about. This is the clearest
demonstration that the screener is presentational: a real PAB dataset would show carbon intensity
clustered ~50%+ below its `parentIndex` value, and `tempAlignment` for PAB products would sit at
≤ 1.5 °C rather than uniform over [1.2, 2.7].

### 7.5 Companion analytics

Expandable row detail shows per-index metadata (inception 2010–2023, exclusion counts,
women-on-board %, green revenue %); export CSV dumps the visible columns. The backend `/stats`
endpoint (sector counts, ticker coverage from live reference tables) is the only part of the
module family touching real data.

### 7.6 Data provenance & limitations

- **All 60 indices and all their attributes are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`);
  provider and parent-index names are real trademarks attached to fabricated statistics.
- No return time series per index → tracking error, Sharpe and returns are mutually inconsistent
  random fields (e.g. TE is not derived from the monthly chart).
- No PAB/CTB compliance engine, no tilt/optimisation math, no benchmark-vs-portfolio comparison —
  the guide's user-interaction list ("PAB/CTB Compliance checks portfolio", "Custom Builder") has
  no code counterpart.
- Backend WACI is real plumbing with an honest null for the carbon numerator; when the emissions
  linkage lands, the correct next step is wiring this page's screener to it.
- Sort comparator tie-instability noted in §7.3.

### 7.7 Framework alignment

- **EU Regulation 2019/2089 (Low Carbon Benchmark Regulation) + DR 2020/1818** — defines PAB
  (≥ 50% GHG-intensity reduction vs investable universe, ~7% p.a. decarbonisation on a WACI or
  GHG/EVIC basis, activity exclusions incl. coal > 1%/oil > 10%/gas > 50% revenue) and CTB
  (≥ 30%, lighter exclusions). The module names these products but performs no compliance test.
- **TCFD / PCAF WACI** — `Σ w_i × (emissions_i / revenue_i)`; correctly documented in the backend
  docstring; EVIC-share weights implemented, emissions pending.
- **MSCI / FTSE Russell climate index methodologies (guide references)** — represented only as
  provider labels and the methodology taxonomy (best-in-class / exclusion / optimisation / tilt /
  composite), which is a fair summary of how real ESG index families differ.

## 9 · Future Evolution

### 9.1 Evolution A — Real PAB/CTB compliance math over actual holdings (analytics ladder: rung 1 → 2)

**What.** §7's mismatch is double-sided: the frontend's 60 "indices" are seeded-random composites (`"{provider} {region} {type} Index"` with random TE, carbon intensity, and temperature alignment; even the PAB-vs-parent performance chart draws each series independently, so the comparison is noise), while the registered backend (`api/v1/routes/benchmarks.py`) serves *real* yfinance/SEC-EDGAR sector benchmarks plus a WACI endpoint whose carbon intensity is an explicit `None` placeholder ("pending A17 integration") — and the page never calls it. Evolution A implements the guide's actual formulas against real data.

**How.** (1) Complete the WACI endpoint: join holdings to emissions intensities from the platform's ingested data (the "A17 integration" the placeholder names), so `WACI = Σ w_i × CI_i` returns numbers with per-holding data-quality flags. (2) PAB/CTB compliance check as a backend computation: portfolio WACI vs parent-index WACI (−50%/−30% thresholds), the −7% p.a. trajectory test against stored history, and activity-based exclusions per Regulation 2019/2089 — each criterion returning pass/fail/insufficient-data. (3) Tracking error computed from real return series (yfinance monthly returns for portfolio tickers vs a real benchmark), replacing the seeded `trackingError` field. (4) The 60-index screener either becomes a curated real-index reference table (methodology facts are public) or is retired; the page wires to the backend it already owns.

**Prerequisites.** Emissions-intensity coverage for portfolio holdings (the WACI blocker); a parent-index constituent source for the decarbonisation comparison — without constituents, the PAB check can only run at portfolio-vs-benchmark-aggregate level, which must be labelled as such. **Acceptance:** WACI returns non-null for a seeded demo portfolio with DQS flags; a deliberately fossil-heavy test portfolio fails the PAB check with the failing criterion named; the performance chart's PAB and parent series derive from the same underlying returns, not independent draws.

### 9.2 Evolution B — Benchmark-compliance analyst (LLM tier 2)

**What.** "Does our portfolio qualify to track a PAB?" is a question with a regulation-defined answer, which makes it ideal Tier-2 territory: the copilot runs the Evolution-A compliance endpoint, reports each criterion's computed verdict (WACI reduction, trajectory, exclusions), and explains failures with the regulatory citation — "your WACI is 38% below parent; PAB requires 50%; CTB's 30% threshold is met" — every percentage from tool output, every threshold from Regulation 2019/2089 as encoded in the engine.

**How.** Tool schemas over the four existing routes plus the new compliance and TE endpoints (all read-only GETs — no gating). Grounding corpus: this Atlas record plus the §5 methodology block (PAB/CTB thresholds, tilt formula) so regulatory explanations quote the encoded rules rather than the LLM's recollection of the regulation. The insufficient-data verdicts matter most: where holdings lack emissions data, the copilot reports the coverage percentage and refuses a compliance verdict — a partial-coverage PAB claim is precisely the greenwashing exposure this module should prevent.

**Prerequisites (hard).** Evolution A — a compliance copilot over seeded random fields would issue fabricated regulatory verdicts. **Acceptance:** every criterion verdict in an answer matches the endpoint response; sub-threshold data coverage yields a refusal with the coverage figure; benchmark methodology facts cite the curated reference table, not model memory.