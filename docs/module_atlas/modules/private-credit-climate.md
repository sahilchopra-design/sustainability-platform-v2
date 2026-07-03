# Private Credit Climate Risk
**Module ID:** `private-credit-climate` · **Route:** `/private-credit-climate` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Climate risk analytics for private credit portfolios, assessing physical exposure, transition risk, and PCAF-aligned financed emissions at deal level.

> **Business value:** Brings PCAF-compliant financed emissions accounting and NGFS climate risk analytics to private credit portfolios, supporting TCFD and net-zero commitments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COLORS`, `DATA`, `PAGE_SIZE`, `RATINGS`, `RISK_LEVELS`, `SECTORS`, `STRATEGIES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt1` | `n=>Number(n).toFixed(1);const fmt0=n=>Number(n).toFixed(0);const fmtM=n=>n>=1000?`$${(n/1000).toFixed(1)}B`:`$${n}M`;` |
| `sector` | `SECTORS[Math.floor(s1*SECTORS.length)];` |
| `strategy` | `STRATEGIES[Math.floor(s2*STRATEGIES.length)];` |
| `rating` | `RATINGS[Math.floor(s3*RATINGS.length)];` |
| `region` | `['North America','Europe','Asia Pacific','LATAM','Middle East','Africa'][Math.floor(s4*6)];` |
| `riskLevel` | `RISK_LEVELS[Math.floor(s5*RISK_LEVELS.length)];` |
| `notional` | `Math.floor(10+s6*490);` |
| `spread` | `Math.floor(150+s7*650);` |
| `ltv` | `Number((30+s8*45).toFixed(1));` |
| `maturity` | `Math.floor(1+s9*9);` |
| `climateScore` | `Math.floor(15+s10*80);` |
| `transRisk` | `Math.floor(10+sr(i*71+41)*85);` |
| `physRisk` | `Math.floor(5+sr(i*73+43)*80);` |
| `carbonFp` | `Math.floor(20+sr(i*79+47)*480);` |
| `waterStress` | `Math.floor(5+sr(i*83+53)*90);` |
| `stranded` | `Number((sr(i*89+59)*35).toFixed(1));` |
| `lgd` | `Number((20+sr(i*101+67)*60).toFixed(1));` |
| `expectedLoss` | `Number((pd*lgd/100).toFixed(2));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `RATINGS`, `RISK_LEVELS`, `SECTORS`, `STRATEGIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Financed Emissions (tCO₂e) | — | PCAF Attribution | Total Scope 1+2 emissions attributed to private credit portfolio. |
| Physical Risk Exposure (%) | — | Hazard Engine | Share of portfolio exposure to high or extreme physical climate hazard. |
| Avg Data Quality Score | — | PCAF DQ Framework | Mean data quality score across portfolio using PCAF 5-tier DQ scale. |
- **Loan register + borrower financials + emissions data** → PCAF attribution; DQ scoring; physical/transition risk overlay → **Deal-level and portfolio-level climate risk and financed emissions outputs**

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF Financed Emissions (Private Debt)
**Headline formula:** `FE = (Outstanding / EVIC) × SCOPE1+2; DQ weighted`
**Standards:** ['PCAF Standard Part A (2022)', 'TCFD']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).