# Decommissioning Liability
**Module ID:** `energy-decommissioning-liability` · **Route:** `/energy-decommissioning-liability` · **Tier:** B (frontend-computed) · **EP code:** EP-CU5 · **Sprint:** CU

## 1 · Overview
Cost estimation, funding gap analysis, regulatory bond requirements, and stranded asset linkage.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSETS`, `JURISDICTIONS`, `NGFS_SCENARIOS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Liability Overview','Asset-Level Provisions','Funding Gap','Regulatory Requirements','Stranded Asset Link','Write-Down Scenarios'];` |
| `totalEst` | `ASSETS.reduce((s, a) => s + a.est_cost_mn, 0);` |
| `totalProv` | `ASSETS.reduce((s, a) => s + a.provision_mn, 0);` |
| `gap` | `totalEst - totalProv;` |
| `fundingRatio` | `(totalProv / totalEst * 100).toFixed(1);` |
| `adjCost` | `Math.round(totalEst * sc.cost_mult);` |
| `pct` | `(a.provision_mn / a.est_cost_mn * 100).toFixed(0);` |
| `newRetire` | `a.retirement - accel;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSETS`, `JURISDICTIONS`, `NGFS_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Funding Gap | — | Model | 38% underfunded |

## 5 · Intermediate Transformation Logic
**Methodology:** Decommissioning gap analysis
**Headline formula:** `Gap = EstimatedLiability - CurrentProvision`
**Standards:** ['National regulations', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).