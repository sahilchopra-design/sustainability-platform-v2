# Sanctions & Trade Monitor
**Module ID:** `sanctions-trade-monitor` · **Route:** `/sanctions-trade-monitor` · **Tier:** B (frontend-computed) · **EP code:** EP-CV2 · **Sprint:** CV

## 1 · Overview
OFAC, EU, UK OFSI, UN sanctions with trade policy tracker and portfolio exposure analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `CLASS_COLORS`, `COUNTRY_CLASS`, `PORTFOLIO_EXPOSURE`, `REGIMES`, `RISK_COLORS`, `TABS`, `TRADE_POLICIES`

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `COUNTRY_CLASS`, `PORTFOLIO_EXPOSURE`, `REGIMES`, `TABS`, `TRADE_POLICIES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Sanctions Regimes | — | Official | OFAC, EU, UK, UN |

## 5 · Intermediate Transformation Logic
**Methodology:** Sanctions screening
**Headline formula:** `Exposure = Σ(portfolio_holdings in sanctioned_jurisdictions)`
**Standards:** ['OFAC', 'EU Consolidated List', 'UK OFSI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).