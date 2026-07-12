# Energy Revenue Split
**Module ID:** `energy-revenue-split` · **Route:** `/energy-revenue-split` · **Tier:** B (frontend-computed) · **EP code:** EP-CU4 · **Sprint:** CU

## 1 · Overview
Legacy vs renewable revenue/CapEx decomposition with green revenue ratio, IEA NZE alignment, and peer comparison.

**How an analyst works this module:**
- Revenue Trend shows 5-year legacy vs renewable split
- CapEx Alignment compares to IEA NZE benchmark

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_TREND`, `IEA_NZE_CAPEX_PCT`, `PEERS`, `PROJECTION_2030`, `REVENUE_TREND`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REVENUE_TREND` | 7 | `legacy`, `renewable`, `green_pct` |
| `CAPEX_TREND` | 7 | `legacy_capex`, `green_capex`, `green_pct` |
| `PEERS` | 7 | `green_rev_pct`, `green_capex_pct`, `ci_tco2_gwh`, `itr` |
| `PROJECTION_2030` | 7 | `legacy_rev`, `renew_rev`, `green_pct` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IEA_NZE_CAPEX_PCT` | `50; // IEA NZE requires 50%+ green capex by 2030` |
| `latestGreenRev` | `REVENUE_TREND[REVENUE_TREND.length - 1].green_pct;` |
| `latestGreenCapex` | `CAPEX_TREND[CAPEX_TREND.length - 1].green_pct;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPEX_TREND`, `PEERS`, `PROJECTION_2030`, `REVENUE_TREND`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Revenue Ratio | — | Calculated | Growing 2-3pp per year for integrated majors |

## 5 · Intermediate Transformation Logic
**Methodology:** Green revenue ratio
**Headline formula:** `GRR = Renewable_revenue / Total_revenue`

5-year trend: legacy vs renewable split. CapEx alignment checks green CapEx % against IEA NZE requirement.

**Standards:** ['IEA NZE', 'Company filings']
**Reference documents:** IEA Net Zero Roadmap

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide (`GRR = Renewable_revenue / Total_revenue`, IEA NZE 50% green-capex alignment, peer
comparison) is faithfully implemented. This is a compact, transparent decomposition dashboard driven
by hand-authored 6-year time series; there is no hidden model or synthetic PRNG. The only computed
transforms are the projection scenario multipliers.

### 7.1 What the module computes

Four static time series and one interactive projection:

- **`REVENUE_TREND`** (2020–2025): `legacy`, `renewable` revenue ($B) and a pre-computed `green_pct`.
- **`CAPEX_TREND`** (2020–2025): `legacy_capex`, `green_capex` and `green_pct`.
- **`PEERS`** (6 integrated majors): `green_rev_pct`, `green_capex_pct`, `ci_tco2_gwh`, `itr`.
- **`PROJECTION_2030`** (2025–2030): revenue split and green %.

Green revenue/capex ratios (the guide's GRR) are stored directly on each row rather than divided at
render (e.g. 2025 `green_pct = 13.1` = 15.4 / (102.1+15.4) ≈ 13.1%, internally consistent).

The only live calculation is the **projection scenario**:
```js
mult      = accelerated ? 1.3 : conservative ? 0.7 : 1.0
renew_rev = base_renew_rev × mult
green_pct = renew_rev / (legacy_rev + renew_rev) × 100
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `IEA_NZE_CAPEX_PCT` | 50 | IEA NZE: ≥50% green capex by 2030 (inline comment) |
| Scenario multipliers | accelerated 1.3× · base 1.0× · conservative 0.7× | Design sensitivity handles |
| `PEERS` green-rev % | Shell 14.2, BP 11.8, Total 16.5, Equinor 18.2, Eni 9.5 | Realistic peer benchmarks (editorial) |
| `PEERS` ITR | 1.8–2.5 °C | Implied temperature rise per peer |
| `REVENUE_TREND` green% | 4.6 → 13.1 (2020→2025) | ≈2–3pp/yr, matches guide narrative |
| `CAPEX_TREND` green% | 10.2 → 41.6 | Rising toward but below 50% NZE bar |

The `Demo Co (Us)` peer row (green_rev 13.1, green_capex 41.6, CI 305, ITR 2.2) is the subject company
and ties back to the trend series.

### 7.3 Calculation walkthrough

Load the four static series → KPIs read the latest-year values (`latestGreenRev = 13.1%`,
`latestGreenCapex = 41.6%`) → the CapEx-alignment tab draws a `ReferenceLine` at the 50% NZE bar and
flags the 41.6% actual as below-target → the peer tab plots each major on green-rev vs green-capex
with CI and ITR context → the 2030 projection applies the chosen multiplier and recomputes `green_pct`
year by year.

### 7.4 Worked example

**Accelerated** projection, year 2030. Base row: `legacy_rev = 78.5`, `renew_rev = 46.9`.
```
renew_rev' = 46.9 × 1.3 = 60.97 → 61.0
green_pct' = 61.0 / (78.5 + 61.0) × 100 = 61.0 / 139.5 × 100 = 43.7%
```
So an accelerated build-out lifts 2030 green revenue share from the base 37.4% to 43.7% — still short
of Equinor's ~18% *revenue* today being the sector frontier, but the capex figure (41.6% rising) is
the leading indicator that matters for NZE alignment. The CapEx-alignment gauge shows 41.6% vs the
50% NZE bar = an 8.4pp shortfall.

### 7.5 Companion analytics

- **Green Revenue Ratio tab:** the `green_pct` trend line vs peer band.
- **Peer comparison:** green-rev% × green-capex% scatter with the subject company highlighted; CI and
  ITR shown as the climate-quality overlay.
- **CapEx alignment:** the central IEA-NZE-50% test — the module's headline transition-credibility
  signal (capex leads revenue, so green capex % is the forward metric).

### 7.6 Data provenance & limitations

- **All series are hand-authored editorial data** — realistic integrated-major magnitudes but not a
  live company feed; peer names (Shell, BP, Total…) carry plausible-but-illustrative figures.
- No PRNG; the projection is a single flat multiplier (1.3/0.7), not a modelled demand/price path.
- Green revenue/capex percentages are stored, so there is no taxonomy-alignment engine behind them —
  the split is presentational.

**Framework alignment:** **IEA Net Zero by 2050 Roadmap** — the ≥50% clean-energy capex-share
milestone is the explicit alignment benchmark; **SBTi Oil & Gas / Power SDA** — the ITR peer column
proxies science-based temperature alignment (an ITR ≤1.5 °C would signal Paris alignment; the peers'
1.8–2.5 °C indicate the sector gap). Green revenue ratio itself follows the **EU Taxonomy /
FTSE Green Revenues** convention of turnover-share from taxonomy-eligible activities, here pre-tagged.

## 9 · Future Evolution

### 9.1 Evolution A — Filings-sourced series for any issuer, not one editorial demo (analytics ladder: rung 2 → 3)

**What.** §7 confirms a clean, faithful implementation: `GRR = renewable/total revenue`, IEA NZE 50% green-capex benchmark, internally-consistent hand-authored 2020–2025 series, realistic editorial peer values (Shell 14.2%, Equinor 18.2%…), and a live projection with 0.7×/1.0×/1.3× multipliers — honest rung 2, but for exactly one hard-coded subject company ("Demo Co"). Evolution A makes the decomposition data-driven and multi-issuer.

**How.** (1) Backend `api/v1/routes/energy_revenue_split.py` + `energy_revenue_segments` table populated from company filings via the platform's market-data path (EODHD fundamentals are already an ETL source; segment-level green revenue needs the annual-report segment notes — start with the ~10 integrated majors whose disclosures break out low-carbon revenue). (2) Peer table becomes rows with `source` and `as_of_date`; ITR values either link to a computed methodology or are dropped (an unexplained ITR is ratings-theater). (3) Rung 3: benchmark the green-revenue classification against the EU Taxonomy alignment reported by the same issuers (the platform's `eu-taxonomy` module holds the framework) so "green %" has a defensible taxonomy rather than editorial judgment; pin the GRR arithmetic and projection math in `bench_quant.py`. (4) Projection multipliers gain provenance: tie accelerated/conservative to IEA NZE vs STEPS capex growth deltas instead of bare 1.3/0.7.

**Prerequisites.** Segment-data collection effort per issuer (this is manual-ish; scope to 10 names first); taxonomy-mapping decision for ambiguous segments (gas trading, biofuels). **Acceptance:** the subject company selector offers ≥10 real issuers whose GRR reproduces from stored segment rows; every peer figure carries source+date; projection scenarios cite their IEA anchor.

### 9.2 Evolution B — Transition-progress Q&A for IR and analyst calls (LLM tier 2)

**What.** A tool-calling copilot answering the questions this dashboard exists to settle: "is Total's green capex trajectory NZE-aligned, and how does its GRR growth compare to Equinor's?" It queries Evolution A's per-issuer series, computes nothing itself — trend deltas and gap-to-50% come from a small stats endpoint — and drafts the comparison narrative with each percentage cited to a filing-sourced row, including the honest caveat when an issuer's green-revenue definition differs from the taxonomy baseline (the classification metadata from Evolution A).

**How.** Tools: `get_revenue_split(issuer, years)`, `get_capex_split(issuer, years)`, `compare_peers(issuers, metric)`, `get_nze_gap(issuer)`. Grounding corpus = this Atlas record's §5/§7 (GRR definition, the 50% NZE bar and its IEA provenance). Definitional differences are first-class in answers — "Shell's 14.2% includes gas-and-power trading; on the taxonomy-strict basis it is X%" — because that's the substance of most real disputes about these numbers. Validator checks all percentages against tool outputs.

**Prerequisites (hard).** Evolution A — a copilot narrating the current single editorial series would present authored demo figures as company facts on IR-adjacent questions. **Acceptance:** a golden two-issuer comparison reproduces from scripted tool calls; every figure carries issuer/year provenance; asking about an issuer outside the covered set refuses with the coverage list.