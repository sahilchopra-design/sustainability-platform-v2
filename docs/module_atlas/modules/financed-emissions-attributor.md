# Financed Emissions Attributor
**Module ID:** `financed-emissions-attributor` · **Route:** `/financed-emissions-attributor` · **Tier:** B (frontend-computed) · **EP code:** EP-CC2 · **Sprint:** CC

## 1 · Overview
PCAF 5 asset class financed emissions attribution engine. Computes attribution factors, data quality scoring (1-5), WACI benchmarking, and Scope 3 Category 15 quantification with company drill-down.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `PCAF_CLASSES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['PCAF Dashboard', 'Attribution Methodology', 'Targets & Trajectories', 'Company Drill-Down', 'WACI Benchmarking'];` |
| `totalFinanced` | `PCAF_CLASSES.reduce((s, c) => s + c.financed, 0);` |
| `totalOutstanding` | `PCAF_CLASSES.reduce((s, c) => s + c.outstanding, 0);` |
| `totalTarget2030` | `PCAF_CLASSES.reduce((s, c) => s + c.target_2030, 0);` |
| `pieData` | `PCAF_CLASSES.map(c => ({ name: c.name, value: c.financed, color: c.color }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `PCAF_CLASSES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| WACI | `Σ(w_i × Emissions_i / Revenue_i)` | PCAF | Portfolio-weighted average carbon intensity relative to revenue |
| Financed Emissions | `Σ(AF_i × Company_Emissions_i)` | PCAF Cat 15 | Total attributed GHG emissions from portfolio investments |
| Data Quality Avg | `Weighted by exposure` | PCAF DQ scale | Average PCAF data quality score (1=best, 5=worst) |
| PCAF Classes Covered | — | PCAF Standard | Listed Equity (1), Corp Bonds (2), Project Finance (3), Commercial RE (4), Mortgages (6) |

## 5 · Intermediate Transformation Logic
**Methodology:** PCAF attribution methodology
**Headline formula:** `FinancedEmissions = AF_i × (Scope1 + Scope2 + Scope3); AF_equity = Investment / EVIC`
**Standards:** ['PCAF Global GHG Standard v3', 'GHG Protocol Scope 3 Cat 15']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).