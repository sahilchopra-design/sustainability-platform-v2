# Geopolitical Dashboard
**Module ID:** `geopolitical-dashboard` · **Route:** `/geopolitical-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CV6 · **Sprint:** CV

## 1 · Overview
Executive dashboard with risk heatmap, top 10 exposures, sanctions alerts, mineral supply alerts, and board report.

**How an analyst works this module:**
- Risk Heatmap shows 50 countries
- Sanctions Alerts flag new designations
- Board Report generates executive summary

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CONFLICT_ALERTS`, `DIMS`, `HEATMAP_DATA`, `MINERAL_ALERTS`, `RISK_COLORS`, `SANCTIONS_ALERTS`, `SEV_BG`, `TABS`, `TOP10_EXPOSURES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `HEATMAP_DATA` | 21 | `va`, `ps`, `ge`, `rq`, `rl`, `cc`, `composite` |
| `TOP10_EXPOSURES` | 11 | `country`, `geo_score`, `exposure_pct`, `risk`, `driver` |
| `SANCTIONS_ALERTS` | 5 | `detail`, `severity`, `regime` |
| `MINERAL_ALERTS` | 5 | `mineral`, `detail`, `severity` |
| `CONFLICT_ALERTS` | 5 | `country`, `detail`, `severity` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONFLICT_ALERTS`, `DIMS`, `HEATMAP_DATA`, `MINERAL_ALERTS`, `SANCTIONS_ALERTS`, `TABS`, `TOP10_EXPOSURES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Top Exposure | — | Portfolio | Highest geopolitical risk holding |

## 5 · Intermediate Transformation Logic
**Methodology:** Dashboard aggregation
**Headline formula:** `Aggregates outputs from EP-CV1 through CV5`

Top 10: highest geopolitical risk exposures in portfolio. Alerts: new sanctions designations, conflict escalation, mineral supply disruption.

**Standards:** ['All Sprint CV modules']
**Reference documents:** All Sprint CV references

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Geopolitical Executive Dashboard (EP-CV6) is a **presentation-layer aggregator**: a risk
heatmap, a top-10 exposure table, and three dated alert feeds (sanctions, mineral supply, conflict),
plus a board-report tab. There is no calculation engine — every value is a static literal in the
seed arrays; the guide's "Aggregates outputs from EP-CV1 through CV5" describes an *intended*
data flow that the code does not actually wire (the heatmap re-hardcodes the CV1 country scores
rather than importing them).

### 7.1 What the module computes

The only computation is a colour bucketing on the heatmap cells (JSX line 84):

```js
cellColor = v => v >= 80 ? '#166534' : v >= 60 ? '#16a34a'
                 : v >= 40 ? '#d97706' : v >= 20 ? '#ea580c' : '#dc2626';
```

Everything else is direct rendering of pre-computed fields: `composite` on `HEATMAP_DATA`,
`geo_score`/`exposure_pct`/`risk` on `TOP10_EXPOSURES`, and the alert rows.

### 7.2 Seed datasets & thresholds

| Dataset | Rows | Key fields | Provenance |
|---|---|---|---|
| `HEATMAP_DATA` | 20 | 6 WGI dims + `composite` | Static; **duplicates the CV1 Geopolitical Risk Index country scores** (Norway 94, Russia 12, etc.) |
| `TOP10_EXPOSURES` | 10 | `holding, country, geo_score, exposure_pct, risk, driver` | Synthetic demo portfolio (PetroChina, Gazprom ADR, Saudi Aramco…) |
| `SANCTIONS_ALERTS` | 4 | `date, detail, severity, regime` | Synthetic demo events dated 2026-03 |
| `MINERAL_ALERTS` | 4 | `date, mineral, detail, severity` | Synthetic (REE, cobalt, lithium, nickel) |
| `CONFLICT_ALERTS` | 4 | `date, country, detail, severity` | Synthetic (Sudan, Myanmar, DRC, Gaza) |

Colour thresholds: composite ≥80 dark green (very low risk) down to <20 red (critical). The
`risk` categorical uses `RISK_COLORS = {CRITICAL:red, HIGH:orange, MEDIUM:amber, LOW:green}`.

### 7.3 Calculation walkthrough

There is no derivation: the tab index selects which static array to render. The "Board Report" tab
composes the report date (`new Date().toISOString().split('T')[0]`) with the same static arrays into
a printable summary. The `composite` value on the heatmap is the field that would, in a wired
implementation, be pulled from EP-CV1's `computeScore`.

### 7.4 Worked example (heatmap cell — India)

India row: `composite = 44`. Bucketing: `44 ≥ 40 && 44 < 60` → amber `#d97706`. This matches the
CV1 index's computed India composite (32–44 range depending on weights), confirming the heatmap is
a snapshot copy of CV1 rather than a live feed.

### 7.5 Data provenance & limitations

- **All datasets are static synthetic demo values.** No `sr()` PRNG; the alert dates and details
  are hand-authored, not sourced from OFAC/ACLED/USGS feeds.
- The dashboard is **not actually connected** to CV1–CV5 outputs; the heatmap composites are copied
  literals that will drift from the live index if CV1 weights change.
- `exposure_pct` values are illustrative and do not reconcile to any real portfolio in the platform.
- Alerts are point-in-time snapshots with no ingestion pipeline or de-duplication.

**Framework alignment:** *World Bank WGI* — heatmap dimensions mirror the six WGI governance
indicators (see EP-CV1 deep dive for how WGI's unobserved-components model derives them). *OFAC/EU
sanctions regimes* — the sanctions feed mimics SDN/Entity-List and EU asset-freeze designations.
*ACLED/UCDP* — conflict feed mimics event-based conflict tracking. *USGS/IEA critical-minerals* —
mineral-supply feed mimics REE/cobalt/lithium supply-disruption monitoring.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The dashboard displays a composite geo
score and exposure ranks as static literals with no live aggregation.

**8.1 Purpose & scope.** A live executive cockpit aggregating the CV1–CV5 country/portfolio outputs
into board-ready exposure rankings and real-time alert triage across a firm's full holdings.

**8.2 Conceptual approach.** A thin aggregation-and-alerting layer over the underlying CV models,
benchmarked against **BlackRock Aladdin** exposure dashboards and **Verisk Maplecroft**/**S&P Global
Country Risk** alert services. Exposure ranking is an exposure-weighted risk contribution (as in
Aladdin's factor-exposure attribution); alerting is an event-classification pipeline.

**8.3 Mathematical specification.**

```
GeoScore_c  = EP-CV1.composite(c)                       (live import, not copy)
RiskContrib_h = weight_h · (100 − GeoScore_{country(h)}) / 100
TopN        = holdings sorted by RiskContrib_h desc
PortGPR     = Σ_h weight_h · GPR_{country(h)} / Σ_h weight_h
AlertScore_e = severity_e · recency_e · exposureOverlap_e
```

| Parameter | Source |
|---|---|
| GeoScore_c | EP-CV1 live output |
| GPR_c | Caldara–Iacoviello GPR index (monthly, free) |
| severity_e | OFAC/ACLED classified event severity 1–3 |
| recency_e | exp(−days/30) decay |
| exposureOverlap_e | fraction of AUM in affected countries |

**8.4 Data requirements.** Live CV1 composites (internal); portfolio holdings (`ra_portfolio_v1`
localStorage / positions service); OFAC SDN + EU consolidated list (free APIs); ACLED events (free);
USGS mineral-commodity summaries (free). Platform already holds the CV1 country table and portfolio
context.

**8.5 Validation & benchmarking.** Reconcile TopN and PortGPR against Aladdin/MSCI country-exposure
reports; test alert precision/recall against a labelled event set; verify heatmap composites equal
live CV1 outputs (regression guard against the current copy-drift bug).

**8.6 Limitations & model risk.** Alert feeds depend on third-party latency; severity scoring is
subjective — publish the rubric; the current copy-of-CV1 heatmap must be replaced with a live import
or it silently misreports when weights change.

## 9 · Future Evolution

### 9.1 Evolution A — Actually wire the dashboard to CV1–CV5 and a live alert feed (analytics ladder: rung 1 → 2)

**What.** §7 describes a presentation-layer aggregator: a risk heatmap, top-10 exposure table, and three dated alert feeds (sanctions/mineral/conflict) plus a board-report tab, whose only computation is colour-bucketing heatmap cells. Critically, §7.5 flags that the guide's "Aggregates outputs from EP-CV1 through CV5" is an intended data flow the code does not wire — the heatmap re-hardcodes CV1's country scores as literals that will drift from the live index, alert dates are hand-authored (not from OFAC/ACLED/USGS feeds), and `exposure_pct` reconciles to no real portfolio. Evolution A makes the aggregation real: import the composite scores from `geopolitical-risk-index` (CV1) rather than copying them, compute top-10 exposures from the actual portfolio holdings, and back the three alert feeds with real ingestion.

**How.** (1) The heatmap reads CV1's `computeScore` output live, so weight changes propagate. (2) Top-10 exposures computed from `portfolios_pg` holdings × country geo-scores. (3) Alert feeds wired to real sources — OFAC SDN/EU sanctions lists, ACLED/UCDP conflict events, USGS/IEA critical-mineral disruptions — via ingesters with de-duplication, replacing the static snapshots.

**Prerequisites.** CV1 exposing its scored output as an importable/endpoint source; alert ingestion jobs (the platform's ingester scaffold); a real portfolio to compute exposures against. **Acceptance:** changing CV1 dimension weights changes the dashboard heatmap; top-10 exposures reconcile to portfolio holdings; alerts carry ingestion timestamps and source IDs, not hand-authored dates.

### 9.2 Evolution B — Executive geopolitical-brief orchestrator (LLM tier 3)

**What.** The Board Report tab is the natural tier-3 surface: "prepare this month's geopolitical risk brief" routes across the CV-sprint modules (CV1 index, sanctions/mineral/conflict alerts, the geo-transition nexus) and drafts an executive narrative with each exposure and alert tool-sourced and cited.

**How.** Routing knowledge from the atlas interconnection graph and `module_tags.json` geopolitical grouping per the roadmap Tier-3 pattern; output renders through the report-studio layer. The orchestrator pulls top exposures from the Evolution A aggregation, the latest ingested alerts, and CV1 rankings, composing them into the board narrative with a "show work" expander listing every source module call.

**Prerequisites.** Evolution A (an orchestrator over hardcoded literals would launder stale data into board papers); tier-2 copilots proven on CV1 and the alert modules first. **Acceptance:** a generated brief's every score and alert traces to a named source-module call in the trace log; regenerating after a CV1 weight change or a new sanctions designation updates only the affected sections.