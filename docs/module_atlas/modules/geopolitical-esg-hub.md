# Geopolitical ESG Hub
**Module ID:** `geopolitical-esg-hub` · **Route:** `/geopolitical-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the intersection of geopolitical risk events and ESG factor dynamics, quantifying how political instability, sanctions, trade conflicts, and resource nationalism affect portfolio ESG scores and carbon transition risk. Provides scenario-based stress testing of ESG metrics under geopolitical shock scenarios.

> **Business value:** Enables portfolio managers and risk officers to quantify the ESG impact of geopolitical shocks, stress-test governance scores under sanctions or conflict scenarios, and satisfy TCFD risk management disclosure requirements for geopolitical transition risks.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AI_DIMENSIONS`, `AI_REGS`, `Badge`, `Btn`, `COLORS`, `COUNTRY_LABELS`, `GEO_RISK`, `KpiCard`, `SCENARIOS`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 1 }) : '---';` |
| `pct` | `(n) => typeof n === 'number' ? `${n.toFixed(1)}%` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `holdings` | `portfolio.holdings.length > 0 ? portfolio.holdings : companies.slice(0, 25).map((c, i) => ({` |
| `aiScores` | `AI_DIMENSIONS.map((d, j) => ({` |
| `aiGovAvg` | `Math.round(aiScores.reduce((s, d) => s + d.score, 0) / aiScores.length);` |
| `cyberScore` | `clamp(Math.round(50 + sRand(seed(h.ticker \|\| '') * 3) * 45), 20, 95);` |
| `dataBreaches` | `Math.floor(sRand(seed(h.ticker \|\| '') * 5) * 3);` |
| `techExposure` | `sRand(seed(h.ticker \|\| '') * 7) > 0.5 ? 'High' : sRand(seed(h.ticker \|\| '') * 7) > 0.25 ? 'Medium' : 'Low';` |
| `totalWeight` | `holdingsWithGeo.reduce((s, h) => s + (parseFloat(h.weight) \|\| 0), 0) \|\| 1;` |
| `weightedGPR` | `holdingsWithGeo.reduce((s, h) => s + (h.gpr * (parseFloat(h.weight) \|\| 0)), 0) / totalWeight;` |
| `sanctionedWeight` | `holdingsWithGeo.filter(h => h.sanctions === 'High (target)' \|\| h.sanctions === 'Medium').reduce((s, h) => s + (parseFloat(h.weight) \|\| 0), 0);` |
| `sanctionsPct` | `(sanctionedWeight / totalWeight * 100);` |
| `avgAiGov` | `Math.round(holdingsWithGeo.reduce((s, h) => s + h.aiGovAvg, 0) / (holdingsWithGeo.length \|\| 1));` |
| `gdprPct` | `(gdprCompliant / (holdingsWithGeo.length \|\| 1) * 100);` |
| `cyberAvg` | `Math.round(holdingsWithGeo.reduce((s, h) => s + h.cyberScore, 0) / (holdingsWithGeo.length \|\| 1));` |
| `totalBreaches` | `holdingsWithGeo.reduce((s, h) => s + h.dataBreaches, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AI_DIMENSIONS`, `AI_REGS`, `COLORS`, `SCENARIOS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Geopolitical Risk Beta (β_geo) | — | Caldara-Iacoviello GPR Index | Negative beta indicates ESG scores decline with rising geopolitical risk; values below -0.15 signal high expos |
| Sanctions-Exposed AUM (%) | — | OFAC / EU sanctions lists | Portfolio weight in securities from issuers with direct or indirect sanctions exposure; above 5% requires enha |
| Resource Nationalism Risk Score | — | Political risk insurance models | Composite score reflecting probability of government expropriation, contract renegotiation, or export restrict |
| ESG Score Drawdown under GPR Shock | — | Scenario analysis | Estimated ESG score decline under a 200-point GPR index shock, calibrated to 2022 Russia-Ukraine geopolitical  |
- **Caldara-Iacoviello GPR index (monthly)** → Regress against ESG score panel data by issuer → **Geopolitical ESG sensitivity betas**
- **OFAC/EU sanctions lists** → Cross-reference portfolio ISINs against sanctions databases → **Sanctions exposure flags by holding**
- **Portfolio ESG scores (MSCI/Sustainalytics)** → Apply geopolitical shock β coefficients to compute stressed ESG scores → **Stressed portfolio ESG distribution**

## 5 · Intermediate Transformation Logic
**Methodology:** Geopolitical ESG Sensitivity
**Headline formula:** `ΔESG_i = α + β_geo × GPR_index + β_sanction × Sanction_dummy + ε`
**Standards:** ['Caldara-Iacoviello GPR Index', 'UNPRI Stewardship Code', 'MSCI ESG Ratings Methodology']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).