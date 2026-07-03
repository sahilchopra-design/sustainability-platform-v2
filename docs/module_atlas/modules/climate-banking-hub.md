# Climate Banking Hub
**Module ID:** `climate-banking-hub` · **Route:** `/climate-banking-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Centralised dashboard for banks integrating climate risk across all business lines. Covers credit, market, operational, reputational, and regulatory dimensions of climate risk management.

> **Business value:** Banks are under intense supervisory pressure to manage climate risk across all risk categories. This hub provides the integrated view needed for SREP responses, board climate governance, and TCFD/ISSB disclosure from a financial institution perspective.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_KEY_MESSAGES`, `BoardDashboardTab`, `BoardReportExportTab`, `CET1_WATERFALL`, `COMMITTEE_CALENDAR`, `DATA_GOVERNANCE`, `EBA_TEMPLATES`, `EMISSIONS_TRAJECTORY`, `ENGAGEMENT_PIPELINE`, `FE_BY_COUNTRY`, `GREEN_BOND_PORTFOLIO`, `KPI_BY_PERIOD`, `KPI_DEFS`, `KRI_TIMESERIES`, `NZBACommitmentTab`, `NZBA_SECTORS`, `PCAF_BY_ASSET_CLASS`, `PEER_BANKS`, `PERIODS`, `PeerBenchmarkingTab`, `Pillar3Tab`, `REGULATORY_ITEMS`, `RISK_APPETITE_METRICS`, `RegulatoryTrackerTab`, `RiskAppetiteTab`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(a,s)=>a[Math.floor(sr(s)*a.length)];` |
| `range` | `(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);` |
| `rangeInt` | `(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));` |
| `fmt` | `(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);` |
| `fmtPct` | `(n,d=1)=>n.toFixed(d)+'%';` |
| `fmtGBP` | `(n)=>'£'+fmt(n);` |
| `exposure` | `range(200,8000,seed)*1e6;` |
| `scope1` | `range(50,2500,seed+1)*1e3;` |
| `scope2` | `range(10,800,seed+2)*1e3;` |
| `scope3` | `range(100,15000,seed+3)*1e3;` |
| `intensity` | `range(5,800,seed+4);` |
| `dqs` | `rangeInt(1,5,seed+5);` |
| `regions` | `['Western Europe','Southern Europe','North America','Latin America','Sub-Saharan Africa','South Asia','East Asia','Southeast Asia','Middle East','Ocea` |
| `avgValue` | `range(2,80,seed+1)*1e6;` |
| `prevData` | `KPI_BY_PERIOD[PERIODS[PERIODS.indexOf(period)+1]]\|\|data;` |
| `trendData` | `useMemo(()=>PERIODS.slice().reverse().map(p=>{` |
| `value` | `data[kpi.id];const prev=prevData[kpi.id];const delta=value-prev;` |
| `totalFE` | `TEMPLATE1_DATA.reduce((s,r)=>s+r.total,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOARD_KEY_MESSAGES`, `CET1_WATERFALL`, `COMMITTEE_CALENDAR`, `DATA_GOVERNANCE`, `EBA_TEMPLATES`, `EMISSIONS_TRAJECTORY`, `ENGAGEMENT_PIPELINE`, `FE_BY_COUNTRY`, `GREEN_BOND_PORTFOLIO`, `KPI_DEFS`, `KRI_TIMESERIES`, `NZBA_SECTORS`, `PCAF_BY_ASSET_CLASS`, `PEER_BANKS`, `PERIODS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| BCBS 530 Principles | — | BCBS | Basel Committee principles for climate risk governance and management |
| Regulatory Regimes | — | Global | ECB, BoE, Fed, APRA, MAS climate expectations |
- **Business line risk data** → Climate risk overlay → **Integrated climate risk view**
- **Regulatory requirements** → Compliance gap analysis → **SREP/ORSA climate score**

## 5 · Intermediate Transformation Logic
**Methodology:** Integrated bank climate risk
**Headline formula:** `ClimateRisk_bank = CreditRisk + MarketRisk + OperationalRisk + ReputationalRisk`
**Standards:** ['BCBS 530', 'ECB Guide', 'BoE SS3/19']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).