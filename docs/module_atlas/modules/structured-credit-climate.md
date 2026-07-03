# Structured Credit Climate
**Module ID:** `structured-credit-climate` · **Route:** `/structured-credit-climate` · **Tier:** B (frontend-computed) · **EP code:** EP-CI3 · **Sprint:** CI

## 1 · Overview
MBS/ABS/CLO climate overlay with 500-loan physical risk analysis, collateral haircut modelling, and tranche loss attribution.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COASTAL_STATES`, `EPC_RATINGS`, `HEAT_STATES`, `LOANS`, `STATES`, `TABS`, `TRANCHES`, `WILDFIRE_STATES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `_sr` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `floodZone` | `_sr(i * 11) > 0.7;` |
| `wildfireZone` | `WILDFIRE_STATES.has(state) ? _sr(i * 13) > 0.5 : _sr(i * 13) > 0.85;` |
| `coastal` | `COASTAL_STATES.has(state) ? _sr(i * 17) > 0.4 : _sr(i * 17) > 0.9;` |
| `epc` | `EPC_RATINGS[Math.floor(_sr(i * 19) * 7)];` |
| `ltv` | `50 + Math.round(_sr(i * 23) * 45);` |
| `balance` | `80 + Math.round(_sr(i * 29) * 720);` |
| `rate` | `3.5 + +(_sr(i * 31) * 4).toFixed(2);` |
| `propValue` | `Math.round(balance / (ltv / 100));` |
| `floodProb` | `floodZone    ? 0.05 + _sr(i * 37) * 0.25 : _sr(i * 37) * 0.03;` |
| `fireProb` | `wildfireZone ? 0.03 + _sr(i * 41) * 0.15 : _sr(i * 41) * 0.01;` |
| `heatProb` | `HEAT_STATES.has(state) ? 0.3 + _sr(i * 43) * 0.4 : 0.05 + _sr(i * 43) * 0.2;` |
| `baseMult` | `scenario === 'SSP1-2.6' ? 0.6 : scenario === 'SSP2-4.5' ? 1.0 : 1.5;` |
| `TABS` | `['Pool-Level Dashboard', 'Loan-Level Physical Risk', 'Collateral Haircut Modeler', 'Tranche Loss Attribution', 'PCAF Class 5/7/8', 'Stress Test Scenar` |
| `totalBalance` | `LOANS.reduce((s, l) => s + l.balance, 0);` |
| `avgLTV` | `Math.round(LOANS.reduce((s, l) => s + l.ltv, 0) / Math.max(1, LOANS.length));` |
| `bins` | `[{ range: '0-5%', count: 0 }, { range: '5-10%', count: 0 }, { range: '10-15%', count: 0 }, { range: '15-25%', count: 0 }, { range: '25-50%', count: 0 ` |
| `poolLoss` | `filteredLoans.reduce((s, l) => s + l.balance * l.haircut / 100, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EPC_RATINGS`, `STATES`, `TABS`, `TRANCHES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Loans | — | Simulated | Individual mortgage loans with property location |
| PCAF Classes | — | PCAF Standard | Motor vehicle, sovereign, other |
| Max Tranche Loss (equity) | `SSP5-8.5` | Model | Equity tranche absorbs climate losses first |

## 5 · Intermediate Transformation Logic
**Methodology:** Loan-level physical risk haircut
**Headline formula:** `Haircut = (baseMult × floodRisk + baseMult × fireRisk) × LTV`
**Standards:** ['PCAF Class 5/7/8', 'FEMA', 'CoreLogic']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).