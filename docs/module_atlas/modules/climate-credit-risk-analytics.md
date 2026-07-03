# Climate Credit Risk Analytics
**Module ID:** `climate-credit-risk-analytics` · **Route:** `/climate-credit-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate-adjusted credit risk analytics for loan and bond portfolios. Covers PD/LGD climate overlay, sector-specific scoring adjustments, watchlist integration, and IFRS 9 climate staging.

> **Business value:** Climate change is modifying credit risk but is not yet systematically captured in bank credit models. ECB and BoE supervisors are requiring climate integration in ICAAP and SREP. This module provides the technical infrastructure to embed climate into IFRS 9 models and credit watchlist processes.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AUDIT_TRAIL`, `BORROWERS`, `BorrowerPortfolioTab`, `BorrowerSidePanel`, `CLIMATE_MIGRATION_MULT`, `CLIMATE_VAR_CONFIDENCE`, `CLIMATE_VAR_DATA`, `COLLATERAL_ADJUSTMENTS`, `CONCENTRATION_LIMITS`, `COUNTRIES`, `COUNTRY_CLIMATE_PREMIUM`, `COVENANT_DATA`, `CREDIT_MIGRATION_MATRIX`, `CRREM_PATHWAYS`, `DECARB_PATHWAY`, `DQS_FRAMEWORK`, `ECL_BACKTEST`, `ECL_SENSITIVITY`, `ENGAGEMENT_TRACKER`, `EPCRealEstateTab`, `EPC_BANDS`, `EPC_LGD_HAIRCUT`, `EPC_MEES_RISK`, `EPC_RETROFIT_COST`, `FORWARD_LOOKING_INDICATORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(a,s)=>a[Math.floor(sr(s)*a.length)];` |
| `range` | `(lo,hi,s)=>+(lo+sr(s)*(hi-lo)).toFixed(2);` |
| `rangeInt` | `(lo,hi,s)=>Math.floor(lo+sr(s)*(hi-lo+1));` |
| `fmt` | `(n,d=1)=>n>=1e9?(n/1e9).toFixed(d)+'bn':n>=1e6?(n/1e6).toFixed(d)+'M':n>=1e3?(n/1e3).toFixed(d)+'k':n.toFixed(d);` |
| `fmtPct` | `(n,d=2)=>(n*100).toFixed(d)+'%';` |
| `fmtGBP` | `(n)=>'£'+fmt(n);` |
| `RATINGS` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B','B-','CCC+','CCC'];` |
| `EPC_MEES_RISK` | `{A:'Compliant all horizons',B:'Compliant all horizons',C:'Compliant to 2027',D:'At risk post-2027',E:'Non-compliant post-2025',F:'Non-compliant now (g` |
| `exposure` | `range(10,800,seed)*1e6;` |
| `basePD` | `range(0.001,0.085,seed+1);` |
| `baseLGD` | `range(0.25,0.65,seed+2);` |
| `ead` | `exposure*range(0.85,1.05,seed+3);` |
| `ratingIdx` | `Math.min(17,Math.max(0,Math.floor(basePD*200)));` |
| `scope1` | `range(500,ss.carbonIntBase*2000,seed+4);` |
| `scope2` | `scope1*range(0.08,0.35,seed+5);` |
| `carbonIntensity` | `range(ss.carbonIntBase*0.5,ss.carbonIntBase*1.8,seed+6);` |
| `ebitda` | `exposure*ss.ebitdaMargin*range(0.6,1.4,seed+7);` |
| `epc` | `(sector==='Real Estate')?EPC_BANDS[rangeInt(0,6,seed+8)]:null;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AUDIT_TRAIL`, `CLIMATE_VAR_CONFIDENCE`, `COUNTRIES`, `COVENANT_DATA`, `CRREM_PATHWAYS`, `DECARB_PATHWAY`, `DQS_FRAMEWORK`, `ECL_BACKTEST`, `ECL_SENSITIVITY`, `ENGAGEMENT_TRACKER`, `EPC_BANDS`, `FORWARD_LOOKING_INDICATORS`, `HAZARDS`, `IR_SENSITIVITY`, `LLP_WATERFALL`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PD Uplift (High Exposure) | — | ECB CST | Probability of default increase for energy/utilities under NZ2050 |
| LGD Uplift (Physical) | — | Physical risk model | LGD increase from collateral value decline in hazard zones |
| ECL Uplift (stressed) | — | Regulatory stress | Increase in expected credit loss under climate stress |
- **Loan/bond portfolio** → Climate PD/LGD adjustment → **Climate-adjusted credit parameters**
- **Sector transition scores** → IFRS 9 staging trigger → **Stage 2 migration alerts**
- **Physical hazard data** → Collateral value adjustment → **Climate-adjusted LGD**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate-conditional credit risk
**Headline formula:** `PD_climate = PD_base × exp(β × ΔCarbonPrice + γ × HazardIntensity)`
**Standards:** ['IFRS 9', 'ECB Climate Stress Test', 'BCBS 530']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).