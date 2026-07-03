# Infrastructure Resilience Scorer
**Module ID:** `infrastructure-resilience-scorer` · **Route:** `/infrastructure-resilience-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-CF2 · **Sprint:** CF

## 1 · Overview
5-pillar resilience scoring for 10 global infrastructure assets. Includes retrofit prioritisation by BCR, climate haircut valuation (2-33%), and 5-year trend analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Portfolio Overview', 'Asset Deep-Dive', 'Retrofit Prioritisation', 'Climate Haircut', 'Trend Analysis'];` |
| `portfolioAvg` | `Math.round(ASSETS.reduce((s, a) => s + a.resilience_score, 0) / ASSETS.length);` |
| `totalValue` | `ASSETS.reduce((s, a) => s + a.value_m, 0);` |
| `totalHaircut` | `Math.round(ASSETS.reduce((s, a) => s + a.value_m * a.climate_haircut / 100, 0));` |
| `totalRetrofitCost` | `ASSETS.reduce((s, a) => s + a.retrofit_cost_m, 0);` |
| `totalRetrofitBenefit` | `ASSETS.reduce((s, a) => s + a.retrofit_benefit_m, 0);` |
| `radarData` | `selectedAsset ? Object.entries(selectedAsset.pillars).map(([k, v]) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Resilience | `Equal-weighted avg` | Model output | Average score across 10 infrastructure assets |
| Climate Haircut | `Σ(asset_value × haircut_pct)` | UNEP FI CVC | Total portfolio value impairment from physical climate risk |
| Top Retrofit BCR | `Bangladesh Delta` | Model output | Highest return per dollar of climate-proofing investment |

## 5 · Intermediate Transformation Logic
**Methodology:** 5-pillar weighted resilience scoring
**Headline formula:** `Composite = avg(Structural, Operational, Financial, Environmental, Social)`
**Standards:** ['GRESB Infrastructure', 'RICS Resilience', 'UNEP FI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).