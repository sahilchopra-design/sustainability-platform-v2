# DME Risk Engine
**Module ID:** `dme-risk-engine` · **Route:** `/dme-risk-engine` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Forward-looking financial risk modelling engine that translates Dynamic Materiality Engine topic scores into quantified risk factors including earnings volatility, asset impairment, and stranded asset exposure. Integrates with the stress testing framework to produce ESG-adjusted VaR and CVaR estimates.

> **Business value:** Converts materiality scores into the quantified financial risk language used by CROs, CFOs, and regulators. Provides the ESG stress testing inputs required for TCFD financial risk disclosure and ECB supervisory climate risk reporting.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMPLIFICATION`, `Badge`, `Btn`, `COLORS`, `DEFAULT_COEFF`, `KpiCard`, `LS_PORT`, `REGIME_COLORS`, `RISK_CHANNELS`, `SECTOR_COEFFICIENTS`, `Section`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '---';` |
| `fmtPct` | `(n) => typeof n === 'number' ? `${n.toFixed(2)}%` : '---';` |
| `fmtBps` | `(n) => typeof n === 'number' ? `${n.toFixed(0)} bps` : '---';` |
| `fmtUsd` | `(n) => typeof n === 'number' ? `$${n.toFixed(1)}M` : '---';` |
| `sRand` | `(n) => { let x = Math.sin(n + 1) * 10000; return x - Math.floor(x); };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `adjustedAsset` | `assetValue * (1 - strandedHaircut);` |
| `wacc` | `wE * (cE + esgEqPrem) + wD * (cD + esgDebtSpread) * (1 - taxRate);` |
| `baseline` | `wE * cE + wD * cD * (1 - taxRate);` |
| `debt` | `company.total_debt_usd_mn \|\| mcap * 0.3;` |
| `assetValue` | `mcap + debt;` |
| `totalEmissions` | `scope1 + scope2;` |
| `revenue` | `company.revenue_usd_mn \|\| mcap * 0.4;` |
| `carbonIntensity` | `revenue > 0 ? (totalEmissions * 1e6) / revenue : 0;` |
| `pdBase` | `clamp(0.005 + (transRisk / 100) * 0.04 + sRand(s + 1) * 0.01, 0.001, 0.15);` |
| `velT` | `(sRand(s + 10) - 0.3) * 0.5;   // transition velocity` |
| `velP` | `(sRand(s + 20) - 0.3) * 0.3;   // physical velocity` |
| `velS` | `(sRand(s + 30) - 0.3) * 0.2;   // social velocity` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `RISK_CHANNELS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG VaR (95%, 1yr) | — | DME risk engine | ESG-attributable Value at Risk at 95% confidence over a 1-year horizon |
| ESG CVaR (99%, 1yr) | — | DME risk engine | Expected loss in the worst 1% of ESG risk outcomes over a 1-year horizon |
| Top Risk Driver Topic | — | Topic risk attribution | Topic with the highest ESG risk factor contribution to portfolio VaR |
| Stress Scenario Delta (Hot House) | — | Scenario engine | Estimated portfolio NAV reduction under a disorderly 3°C NGFS Hot House World scenario |
- **DME materiality scores (all topics, current)** → Materiality-to-sensitivity mapping using sector calibration tables → **ESG risk factor per topic**
- **Financial sensitivity library (sector benchmarks, NGFS calibration)** → Sensitivity calibration: % EBITDA impact per materiality score point by sector and topic → **Calibrated sensitivity parameters with confidence intervals**
- **Monte Carlo simulation engine** → 10,000-path simulation of joint topic risk materialisation → **ESG VaR and CVaR distribution with topic attribution waterfall**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Risk Factor
**Headline formula:** `ERF = Σᵢ (MaterialityScoreᵢ × Sensitivityᵢ × TimeHorizonᵢ)`
**Standards:** ['TCFD Financial Risk Quantification', 'NGFS Risk Factor Calibration', 'ECB SSM Climate Risk Framework']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).