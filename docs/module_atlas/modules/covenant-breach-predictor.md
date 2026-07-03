# Covenant Breach Predictor
**Module ID:** `covenant-breach-predictor` · **Route:** `/covenant-breach-predictor` · **Tier:** B (frontend-computed) · **EP code:** EP-CK6 · **Sprint:** CK

## 1 · Overview
15 borrowers with climate-conditional covenant breach probability for leverage, ICR, and DSCR covenants.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BORROWERS`, `Badge`, `Card`, `KPI`, `LENDER_ACTIONS`, `REMEDIATION`, `SCENARIOS`, `SCENARIO_KEYS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Breach Probability Dashboard','Financial Covenants at Risk','Scenario-Conditional Breach','Early Warning Signals','Remediation Options','Lender Acti` |
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `leverage` | `2.5 + _sr(i*11) * 4;` |
| `icr` | `1.2 + _sr(i*13) * 5;` |
| `dscr` | `0.8 + _sr(i*17) * 1.5;` |
| `avgBreach` | `Math.round(BORROWERS.reduce((s,b)=>s+b[`breachProb_${sk}`],0)/BORROWERS.length);` |
| `scenarioComparison` | `useMemo(()=>BORROWERS.map(b=>({ name:b.name, CP:b.breachProb_cp, DT:b.breachProb_dt, B2C:b.breachProb_b2c, NZ:b.breachProb_nz })),[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `LENDER_ACTIONS`, `REMEDIATION`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Borrowers | — | Demo | With financial covenant data |
| Covenants | — | Loan agreements | Leverage, ICR, DSCR |

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-conditional breach probability
**Headline formula:** `P(breach|scenario) = P(financial_ratio < threshold | climate_shock)`
**Standards:** ['IFRS 9', 'Basel IV IRB']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).