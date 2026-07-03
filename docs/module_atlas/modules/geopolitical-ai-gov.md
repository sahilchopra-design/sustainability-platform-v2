# Geopolitical AI Governance
**Module ID:** `geopolitical-ai-gov` · **Route:** `/geopolitical-ai-gov` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides governance controls and bias-detection analytics for AI models used in geopolitical risk assessment, ensuring model outputs are explainable, auditable, and free from geographic or political bias. Covers model card documentation, fairness metrics, adversarial robustness testing, and regulatory alignment with the EU AI Act and OECD AI Principles.

> **Business value:** Ensures geopolitical AI models meet EU AI Act high-risk system requirements, OECD AI Principles, and internal model risk management standards. Reduces regulatory and reputational risk from biased or opaque AI-assisted geopolitical risk scores informing investment decisions.

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
| Disparate Impact Ratio | — | EU AI Act / OECD | Values outside 0.80â€“1.25 range indicate potential geographic bias requiring model audit; values near 1.0 ind |
| Model Explainability Score | — | SHAP / LIME framework | Composite score reflecting proportion of model predictions explainable by identified features; below 0.65 fail |
| Adversarial Robustness (%) | — | NIST AI RMF | Percentage of predictions unchanged under structured adversarial perturbation; below 80% indicates fragile geo |
| Audit Trail Completeness (%) | — | Internal governance | Percentage of AI-assisted decisions with full input, output, and model version logged; mandatory for regulator |
- **AI model prediction logs** → Group by geographic/political dimensions, compute DIR → **Bias detection report by model and region**
- **Training dataset metadata** → Audit data provenance, label balance, and temporal coverage → **Data governance scorecard**
- **SHAP feature importance outputs** → Rank features by mean absolute SHAP value, flag opaque models → **Explainability assessment report**

## 5 · Intermediate Transformation Logic
**Methodology:** Disparate Impact Ratio
**Headline formula:** `DIR = P(ŷ=1 | group=A) / P(ŷ=1 | group=B)`
**Standards:** ['EU AI Act (High-Risk AI Systems)', 'OECD AI Principles 2019', 'NIST AI RMF 1.0 (2023)']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).