# Nature-Based Adaptation Solutions
**Module ID:** `nature-based-adaptation` · **Route:** `/nature-based-adaptation` · **Tier:** B (frontend-computed) · **EP code:** EP-CF3 · **Sprint:** CF

## 1 · Overview
6 NbS projects with protection value, carbon value, biodiversity scoring, community jobs, ecosystem service valuation (Costanza et al.), SDG alignment, and triple-dividend investment case.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ECOSYSTEM_VALUES`, `NBS_SOLUTIONS`, `SDG_COLORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['NbS Portfolio', 'Co-Benefit Valuation', 'Ecosystem Services', 'SDG Alignment', 'Investment Case'];` |
| `totalProtection` | `NBS_SOLUTIONS.reduce((s, n) => s + n.protection_value_m, 0);` |
| `totalCarbon` | `NBS_SOLUTIONS.reduce((s, n) => s + n.carbon_value_m, 0);` |
| `totalCost` | `NBS_SOLUTIONS.reduce((s, n) => s + n.total_cost_m, 0);` |
| `totalJobs` | `NBS_SOLUTIONS.reduce((s, n) => s + n.community_jobs, 0);` |
| `totalCarbonTons` | `NBS_SOLUTIONS.reduce((s, n) => s + n.co_benefits.carbon_tco2, 0);` |
| `maxProtection` | `Math.max(1, ...NBS_SOLUTIONS.map(n => n.protection_value_m));` |
| `maxCarbon` | `Math.max(1, ...NBS_SOLUTIONS.map(n => n.carbon_value_m));` |
| `maxJobs` | `Math.max(1, ...NBS_SOLUTIONS.map(n => n.community_jobs));` |
| `maxBcr` | `Math.max(1, ...NBS_SOLUTIONS.map(n => n.bcr));` |
| `maxArea` | `Math.max(1, ...NBS_SOLUTIONS.map(n => n.area_ha));` |
| `unit` | `k.endsWith('_m') ? `$${v}M` : k === 'carbon_tco2' ? `${(v/1000).toFixed(0)}K tCO\u2082` : `${v}/100`;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ECOSYSTEM_VALUES`, `NBS_SOLUTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Coral Reef Value | `Costanza et al.` | TEEB Database | Highest per-hectare ecosystem service value (fisheries + tourism + coastal protection) |
| Peatland BCR | `Carbon + flood buffer` | Model output | Highest BCR of any adaptation strategy on the platform |
| Community Jobs | `Σ across 6 projects` | Project data | Direct employment created by NbS portfolio |
| SDG Coverage | `SDG 1,2,3,6,8,11,13,14,15` | IUCN NbS Standard | Number of Sustainable Development Goals addressed |

## 5 · Intermediate Transformation Logic
**Methodology:** Triple-dividend NbS valuation
**Headline formula:** `TotalValue = ProtectionValue + CarbonValue + ΣCoBenefits; BCR = TotalValue / Cost`
**Standards:** ['Costanza et al. (2014)', 'TEEB', 'IUCN NbS Standard']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).