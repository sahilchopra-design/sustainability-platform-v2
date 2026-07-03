# Energy Revenue Split
**Module ID:** `energy-revenue-split` · **Route:** `/energy-revenue-split` · **Tier:** B (frontend-computed) · **EP code:** EP-CU4 · **Sprint:** CU

## 1 · Overview
Legacy vs renewable revenue/CapEx decomposition with green revenue ratio, IEA NZE alignment, and peer comparison.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPEX_TREND`, `IEA_NZE_CAPEX_PCT`, `PEERS`, `PROJECTION_2030`, `REVENUE_TREND`, `TABS`

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
**Standards:** ['IEA NZE', 'Company filings']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).