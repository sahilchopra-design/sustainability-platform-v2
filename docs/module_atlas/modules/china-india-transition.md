# China & India Transition
**Module ID:** `china-india-transition` · **Route:** `/china-india-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CJ1 · **Sprint:** CJ

## 1 · Overview
China National ETS and India green hydrogen mission deep-dive with coal phase-down timelines and RE deployment curves.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CARBON_PRICE_PATHS`, `CHINA_ETS_SECTORS`, `COAL_RETIREMENT`, `INDIA_H2_DATA`, `OVERVIEW_METRICS`, `REFERENCES`, `RE_CURVES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Dual Market Overview', 'China National ETS', 'India Green Hydrogen Mission', 'Coal Phase-Down Timelines', 'RE Deployment Curves', 'Carbon Price Traj` |
| `val` | `startCap + (peakCap - startCap) / (1 + Math.exp(-k * (y - midYear)));` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CARBON_PRICE_PATHS`, `CHINA_ETS_SECTORS`, `INDIA_H2_DATA`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| China Coal Fleet | — | Global Coal Tracker | Largest coal fleet globally |
| India RE Target | — | MNRE | From current ~175GW |

## 5 · Intermediate Transformation Logic
**Methodology:** Dual-market transition modelling
**Headline formula:** `Coal_retirement = f(policy, economics, RE_growth)`
**Standards:** ['IEA India', 'China MEE']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).