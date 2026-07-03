# Green Loan Framework
**Module ID:** `green-loan-framework` · **Route:** `/green-loan-framework` · **Tier:** B (frontend-computed) · **EP code:** EP-CQ5 · **Sprint:** CQ

## 1 · Overview
20 green/sustainability-linked loans with GLP/SLLP compliance, margin ratchet modelling, and covenant design.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COVENANTS`, `LOANS`, `RATCHET_SIM`, `TABS`, `TYPE_DIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Loan Portfolio Dashboard','GLP/SLLP Alignment','Margin Ratchet Modeler','Borrower Assessment','Covenant Design','Reporting Templates'];` |
| `TYPE_DIST` | `[{ name:'Green Loan', value:3 },{ name:'Sustainability-Linked', value:5 }];` |
| `totalVolume` | `LOANS.reduce((s,l)=>s+l.amount,0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COVENANTS`, `LOANS`, `RATCHET_SIM`, `TABS`, `TYPE_DIST`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Loans | — | Portfolio | Green and sustainability-linked |
| Avg Ratchet | — | Loan docs | Margin reduction for meeting ESG targets |

## 5 · Intermediate Transformation Logic
**Methodology:** Margin ratchet modelling
**Headline formula:** `Margin_adj = Margin_base - RatchetBps × KPI_met_flag`
**Standards:** ['LMA GLP', 'LMA SLLP']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).