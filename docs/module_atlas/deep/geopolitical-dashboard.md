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
