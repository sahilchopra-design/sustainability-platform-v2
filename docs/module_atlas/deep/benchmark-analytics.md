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
