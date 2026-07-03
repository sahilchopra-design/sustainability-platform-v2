# Nuclear SMR Viability
**Module ID:** `nuclear-smr-viability` · **Route:** `/nuclear-smr-viability` · **Tier:** B (frontend-computed) · **EP code:** EP-CL4 · **Sprint:** CL

## 1 · Overview
5 SMR designs (NuScale, BWRX-300, RR, Xe-100, Natrium) with LCOE, deployment pipeline, and regulatory status.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `DESIGNS`, `GRID_SERVICES`, `KPI`, `PIPELINE`, `REG_TRACKER`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `radarData` | `DESIGNS.map(d=>({ name:d.name, Cost:Math.round(100-d.lcoe2030), Capacity:Math.round(d.totalMW/5), Timeline:Math.round(100-d.constructionMo*2), TRL:d.t` |
| `totalPipeline` | `PIPELINE.reduce((s,p)=>s+parseInt(p.capacity),0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DESIGNS`, `GRID_SERVICES`, `PIPELINE`, `REG_TRACKER`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Designs Compared | — | WNA | NuScale VOYGR, BWRX-300, RR SMR, Xe-100, Natrium |
| First Commercial | — | NRC/ONR | Expected first commercial deployment |

## 5 · Intermediate Transformation Logic
**Methodology:** SMR LCOE comparison
**Headline formula:** `LCOE = (CapEx×CRF + OpEx + Fuel) / AnnualOutput`
**Standards:** ['WNA', 'NRC', 'ONR']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).