# EVIC Analytics
**Module ID:** `owid-evic-analytics` · **Route:** `/owid-evic-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Calculates and analyses Enterprise Value Including Cash for portfolio companies to support PCAF financed emissions attribution, SFDR principal adverse impact metrics, and TCFD carbon intensity reporting.

> **Business value:** Provides a rigorous, PCAF-aligned EVIC computation engine that underpins accurate financed emissions reporting, SFDR PAI metric calculation, and TCFD carbon intensity disclosures across investment portfolios.

**How an analyst works this module:**
- Retrieve market capitalisation, debt, minority interest, and cash from financial databases
- Compute EVIC per PCAF v2 definition; handle missing data via proxy estimation hierarchy
- Calculate attribution factor AFᵢ for each portfolio holding
- Link AFᵢ to company GHG emissions data to compute financed emissions and WACI

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CO2_TIMESERIES`, `COUNTRIES`, `DQ_SOURCES`, `EVIC_DATA`, `SECTORS`, `TICKERS`, `TREND_DATA`, `YEARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 13 | `name`, `base`, `perCap`, `trend` |
| `DQ_SOURCES` | 9 | `table`, `rows`, `completeness`, `freshness`, `latency`, `coverage` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS` | `Array.from({ length: 34 }, (_, i) => 1990 + i);` |
| `CO2_TIMESERIES` | `useMemo ? (() => {})() : null; // computed inline below` |
| `idx` | `year - 1990;` |
| `noise` | `(sr(COUNTRIES.indexOf(country) * 100 + idx) - 0.5) * country.base * 0.04;` |
| `TREND_DATA` | `YEARS.map(yr => {` |
| `EVIC_DATA` | `TICKERS.map((ticker, i) => {` |
| `marketCap` | `80 + sr(i * 3 + 1) * 2400;        // $B` |
| `totalDebt` | `marketCap * (0.1 + sr(i * 3 + 2) * 0.6);` |
| `cash` | `marketCap * (0.05 + sr(i * 3 + 3) * 0.2);` |
| `minorityInt` | `marketCap * sr(i * 3 + 4) * 0.05;` |
| `evic` | `marketCap + totalDebt + minorityInt - cash;` |
| `scope1` | `50 + sr(i * 5 + 1) * 5000;           // ktCO₂e` |
| `scope2` | `20 + sr(i * 5 + 2) * 2000;` |
| `waci` | `(scope1 + scope2) / (evic / 1000) * 100; // tCO₂e / $M EVIC` |
| `finEmissions` | `(scope1 + scope2) / 1000 * (marketCap / evic); // ktCO₂e` |
| `tabs` | `['OWID CO₂ Time-Series', 'EVIC Calculator', 'Data Quality Monitor', 'Methodology'];` |
| `sectorWaci` | `useMemo(() => { return SECTORS.map(s => { const items = EVIC_DATA.filter(e => e.sector === s);` |
| `avg` | `items.length ? items.reduce((sum, e) => sum + e.waci, 0) / items.length : 0;` |
| `pct` | `((co2_2023 - co2_1990) / co2_1990 * 100).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `COUNTRY_COLORS`, `DQ_SOURCES`, `SECTORS`, `TICKERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| EVIC Components | — | PCAF Standard v2 2022 | Standard EVIC definition: market capitalisation of equity plus book value of total debt plus minority interest less cash and cash equivalents. |
| Typical Attribution Factor Range | — | Internal Portfolio Benchmark | Range of PCAF attribution factors for a diversified equity portfolio holding individual positions, reflecting typical institutional ownership levels. |
- **Bloomberg/Refinitiv financial data, company balance sheets, equity market prices** → EVIC computation, missing data proxy estimation, attribution factor calculation → **EVIC datasets, financed emissions attribution tables, PCAF and SFDR disclosure outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Attribution Factor
**Headline formula:** `AFᵢ = Investmentᵢ / EVICᵢ`

Fraction of a company's total enterprise value held by the investor; used to apportion financed emissions from the company to the investor's portfolio.

**Standards:** ['PCAF Standard v2 2022', 'SFDR Delegated Regulation Annex I']
**Reference documents:** PCAF Global GHG Accounting and Reporting Standard for the Financial Industry v2 2022; SFDR Delegated Regulation (EU) 2022/1288 Annex I; TCFD Guidance on Metrics, Targets and Transition Plans 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

Two independent pieces: (1) a 34-year (1990–2023) OWID-styled CO₂ emissions time-series per country,
and (2) a PCAF-standard EVIC (Enterprise Value Including Cash) calculator for a synthetic universe
of tickers, feeding a WACI (Weighted Average Carbon Intensity) and financed-emissions proxy.

```
EVIC              = marketCap + totalDebt + minorityInt − cash          // PCAF Standard v2 definition
WACI              = (scope1 + scope2) / (EVIC / 1000) × 100             // tCO2e / $M EVIC
finEmissions       = (scope1 + scope2) / 1000 × (marketCap / EVIC)       // ktCO2e attributed by equity share
```

This is an exact match to the guide's stated formula (`EVIC = MarketCap + Debt + MinorityInterest −
Cash`) and PCAF's own attribution-factor logic (`AFᵢ = Investmentᵢ / EVICᵢ`, here proxied by the
equity ownership share `marketCap/EVIC`).

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `marketCap` | $80–2,480B | Synthetic demo value |
| `totalDebt` | 10–70% of market cap | Synthetic demo value |
| `cash` | 5–25% of market cap | Synthetic demo value |
| `minorityInt` | 0–5% of market cap | Synthetic demo value |
| `scope1`/`scope2` | 50–5,050 / 20–2,020 ktCO₂e | Synthetic demo value |
| CO₂ time-series `base`/`perCap`/`trend` (13 countries) | seed table | Styled on OWID Our World in Data structure; values are illustrative, not a live OWID pull despite the tab label "OWID CO₂ Time-Series" |

### 7.3 Calculation walkthrough

1. **EVIC build** (`EVIC_DATA`): for each of N tickers, market cap, debt, cash, and minority
   interest are drawn independently via `sr(i×3+k)`, then summed per the PCAF formula to `evic`.
2. **WACI**: `(scope1+scope2)/(evic/1000)×100` — note the denominator is *EVIC in $B → $M
   equivalent* (÷1000 converts $B to a per-$M-of-EVIC basis), producing tCO₂e per $M EVIC, matching
   the guide's stated unit.
3. **Financed emissions proxy**: `(scope1+scope2)/1000 × (marketCap/evic)` uses the *equity-value
   share* of EVIC as a stand-in attribution factor — this is the correct PCAF concept
   (`AF = investment/EVIC`) applied at the company's own equity-vs-EVIC ratio rather than a specific
   investor's position size, i.e. it shows "if you owned 100% of the equity tranche, this is your
   financed-emissions share of total EVIC" rather than a portfolio-specific number.
4. **Sector WACI aggregation** (`sectorWaci`): simple unweighted mean of `waci` across companies in
   each sector (`items.reduce(...)/items.length`), guarded against empty sector subsets.
5. **Data Quality Monitor tab** (`DQ_SOURCES`, 9 rows): completeness/freshness/latency/coverage
   metadata per source table — descriptive metadata, not a computed score.

### 7.4 Worked example

A ticker with `marketCap=$420B`, `totalDebt=$180B` (43% of cap), `cash=$62B` (15%), `minorityInt=$8B`
(2%), `scope1=1,800 ktCO₂e`, `scope2=650 ktCO₂e`:

| Step | Computation | Result |
|---|---|---|
| EVIC | 420 + 180 + 8 − 62 | **$546B** |
| WACI | (1,800+650) / (546,000/1000) × 100 | (2,450 / 546) × 100 = **448.7 tCO₂e/$M** |
| Equity share of EVIC | 420 / 546 | 76.9% |
| Financed emissions (100%-owner proxy) | 2,450 × 0.769 | **1,884 ktCO₂e** |

### 7.5 Data provenance & limitations

- **All company financials and emissions are synthetic demo data** (`sr(seed)`); the CO₂
  time-series, despite being labelled "OWID CO₂ Time-Series," is generated the same way (a linear
  interpolation between a seed `base` value and per-capita/trend parameters with noise), not
  fetched from the real Our World in Data CO₂ dataset.
- The `finEmissions` metric is a *company-level* equity-attribution illustration, not a real
  investor-position PCAF calculation (a genuine portfolio calculation needs actual investment $ and
  the investor's specific AF, computed in the dedicated `pcaf-financed-emissions` and
  `pcaf-universal-attributor` modules).
- No missing-data proxy hierarchy is implemented here despite the guide's `userInteraction` item
  "handle missing data via proxy estimation hierarchy" — EVIC/emissions fields are always populated
  by the PRNG, so there's no gap-filling logic to inspect.

**Framework alignment:** PCAF Standard v2 (2022) EVIC definition — correctly implemented; SFDR
Delegated Regulation Annex I attribution-factor concept — reflected structurally via
`marketCap/evic` but not computed for an actual investor position; TCFD carbon-intensity metrics
(WACI) — correctly labelled and unit-consistent (tCO₂e/$M EVIC).

## 9 · Future Evolution

### 9.1 Evolution A — Real EVIC inputs and a live OWID pull (analytics ladder: rung 1 → 3)

**What.** §7 confirms the PCAF math is exactly right: EVIC (`marketCap + totalDebt + minorityInt − cash`), WACI (`(scope1+scope2)/(EVIC/1000)`), and financed emissions via the equity-share attribution factor (`AFᵢ = Investmentᵢ/EVICᵢ`) all match the PCAF Standard v2 definition. Two data gaps: the EVIC inputs are synthetic demo values (marketCap $80–2,480B, debt 10–70% of cap, etc.), and the "OWID CO₂ Time-Series" tab is styled on OWID structure but uses seed-table `base`/`perCap`/`trend` values, not a live pull — despite the tab label implying otherwise. Evolution A grounds both.

**How.** (1) Wire EVIC inputs to real market data: the platform's OpenFIGI/market-data ingesters resolve tickers, and the PCAF financed-emissions sibling modules already source market cap and debt — reuse that path so EVIC computes from real balance-sheet components, with PCAF's documented proxy hierarchy (§1) filling gaps and flagging data-quality score. (2) Replace the seed CO₂ series with an actual OWID CO₂ dataset pull (the platform already ingests OWID CO₂ data per the refdata layer) so the tab's label is honest. (3) Emissions from real CDP/reported Scope 1/2 rather than the 50–5,050 ktCO₂e seed range.

**Prerequisites.** Market-data resolution for the ticker universe (reuse existing ingesters); OWID CO₂ already in the platform — connect it; honest-null + PCAF DQ score where a company lacks reported emissions or balance-sheet data. **Acceptance:** EVIC reproduces from real market-cap/debt/cash for a listed company; the CO₂ tab pulls actual OWID data; no `sr()` in EVIC or emissions inputs; DQ score reflects proxy usage.

### 9.2 Evolution B — PCAF attribution copilot (LLM tier 1 → 2)

**What.** A copilot for the financed-emissions workflows §1 targets: "what's my attribution factor for a $50M position in this company?", "compute WACI for these 10 holdings", "why did the EVIC change when they issued debt?", "how does the PCAF proxy hierarchy handle a private holding?" — grounded in the exact PCAF formulas and the PCAF v2 / SFDR Annex I references named in §5.

**How.** Tier 1 works on the transparent additive math: system prompt from this Atlas page's §5/§7.1 formulas; the copilot explains EVIC, attribution factor, and WACI by decomposing the formula with the displayed inputs, citing the PCAF standard for definitions. Tier 2, post-Evolution-A: tool calls to the EVIC/AF/WACI functions over real holdings, with the fabrication validator matching every EVIC/AF/WACI figure to outputs and surfacing the PCAF data-quality score per holding (a required PCAF disclosure). The copilot must explain that financed emissions inherit the underlying emissions' data quality, and refuse to report a portfolio total when key holdings lack data (honest-null propagation).

**Prerequisites.** Tier 1 on the current math; real-holding computation needs Evolution A. **Acceptance:** every EVIC/AF/WACI figure traces to a formula recomputation or tool call; the copilot reports PCAF DQ scores; portfolio totals flag missing-data holdings rather than imputing them.