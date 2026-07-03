# ESG Integration Dashboard
**Module ID:** `esg-integration-dashboard` · **Route:** `/esg-integration-dashboard` · **Tier:** B (frontend-computed) · **EP code:** EP-CP6 · **Sprint:** CP

## 1 · Overview
ESG integration effectiveness with alpha attribution (FF5 + ESG factor), risk reduction evidence, client reporting, and process maturity.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALPHA_DATA`, `ASSET_CLASS`, `CLIENT_METRICS`, `MATURITY`, `PRI_SCORES`, `RISK_DATA`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `avgAlpha` | `(ALPHA_DATA.reduce((s, d) => s + d.esgAlpha, 0) / ALPHA_DATA.length).toFixed(1);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALPHA_DATA`, `ASSET_CLASS`, `CLIENT_METRICS`, `MATURITY`, `PRI_SCORES`, `RISK_DATA`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Alpha | `FF5 + ESG regression` | Model | Risk-adjusted return from ESG integration |
| PRI Assessment | — | PRI | Highest possible score for ESG integration |

## 5 · Intermediate Transformation Logic
**Methodology:** ESG alpha attribution
**Headline formula:** `R_portfolio = α_ESG + β_mkt·MKT + β_smb·SMB + β_hml·HML + β_rmw·RMW + β_cma·CMA + ε`
**Standards:** ['Fama-French', 'PRI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).