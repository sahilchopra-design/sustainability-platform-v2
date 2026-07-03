# DME Portfolio
**Module ID:** `dme-portfolio` · **Route:** `/dme-portfolio` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level aggregation of Dynamic Materiality Engine scores with exposure-weighted materiality calculation, topic attribution, and risk decomposition. Enables portfolio managers to understand how entity-level ESG materiality translates into portfolio-level risk concentration. Supports TCFD portfolio-level disclosure and SFDR PAI reporting.

> **Business value:** Gives portfolio managers a dynamic, evidence-based view of aggregate ESG materiality risk, replacing static ESG ratings with continuously updated scores. Enables proactive portfolio risk management and supports TCFD and SFDR portfolio-level disclosures.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Btn`, `COLORS`, `KpiCard`, `LS_PORT`, `NGFS_SCENARIOS`, `REGIME_COLORS`, `Section`, `Sel`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `totalWeight` | `holdings.reduce((s, h) => s + (h.weight \|\| 0), 0) \|\| 100;` |
| `weighted` | `holdings.reduce((s, h) => s + (h.weight / totalWeight) * (regimeScores[h.regime] \|\| 1), 0);` |
| `selection` | `(holdingDMI - benchmarkDMI) * holdingWeight;` |
| `allocation` | `(holdingWeight - benchmarkWeight) * (benchmarkDMI - portfolioDMI);` |
| `interaction` | `(holdingWeight - benchmarkWeight) * (holdingDMI - benchmarkDMI);` |
| `dmi` | `master.dmi_score \|\| clamp(40 + sRand(s) * 50, 10, 98);` |
| `velocity` | `(sRand(s + 1) - 0.5) * 20;` |
| `scope1` | `master.ghg_scope1_tco2e \|\| Math.round(5000 + sRand(s + 2) * 500000);` |
| `scope2` | `master.ghg_scope2_tco2e \|\| Math.round(2000 + sRand(s + 3) * 200000);` |
| `scope3` | `master.ghg_scope3_tco2e \|\| Math.round(10000 + sRand(s + 4) * 2000000);` |
| `evic` | `master.market_cap_usd_mn ? master.market_cap_usd_mn * 1e6 : (50 + sRand(s + 5) * 5000) * 1e6;` |
| `weight` | `h.weight \|\| parseFloat(h.allocation) \|\| (100 / Math.max(rawHoldings.length, 1));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `NGFS_SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Materiality Score | — | DME portfolio aggregation | Exposure-weighted composite materiality score across all portfolio positions on a 0–100 scale |
| Top Contributing Topic | — | Topic attribution engine | ESG topic contributing the largest share of the portfolio materiality score |
| High-Materiality Positions | — | Entity score filter | Count of portfolio positions with entity materiality score above the high-materiality threshold of 70 |
| Portfolio Score Trend (12M) | — | Trend engine | Change in portfolio materiality score over the trailing 12 months, indicating rising aggregate ESG risk |
- **DME entity materiality scores (all portfolio entities)** → Exposure-weight calculation using current market values from portfolio management system → **Exposure-weighted PfMS with topic attribution breakdown**
- **Portfolio position data (holdings, weights, market values)** → Position data import and reconciliation against entity universe coverage → **Coverage report flagging entities without DME scores**
- **Topic attribution engine** → Marginal contribution analysis: each entity's contribution to topic-level portfolio score → **Topic waterfall chart and top-10 contributors per topic**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Materiality Score
**Headline formula:** `PfMS = Σᵢ (EMSᵢ × wᵢ)`
**Standards:** ['TCFD Portfolio Alignment Methodology', 'SFDR Article 7 PAI Aggregation', 'ESRS E1/S1 Portfolio Metrics']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).