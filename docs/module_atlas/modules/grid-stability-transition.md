# Grid Stability Transition Risk
**Module ID:** `grid-stability-transition` · **Route:** `/grid-stability-transition` · **Tier:** B (frontend-computed) · **EP code:** EP-CL2 · **Sprint:** CL

## 1 · Overview
Grid stability analysis under 0-100% renewable penetration with inertia, storage, curtailment, and capacity market pricing.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `GRIDS`, `KPI`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `solar` | `rePct*0.45, wind = rePct*0.40, hydro = rePct*0.15;` |
| `gas` | `(100-rePct)*0.5, nuclear = (100-rePct)*0.3, coal = (100-rePct)*0.2;` |
| `inertia` | `Math.max(5, 100-rePct*0.9);` |
| `storageGWh` | `Math.round(rePct*rePct*0.02);` |
| `curtailmentPct` | `Math.max(0, (rePct-50)*0.3);` |
| `interconnectorUtil` | `Math.min(95, 40+rePct*0.6);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GRIDS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| RE Penetration | `Slider control` | Model input | Adjustable renewable energy share |
| Critical Inertia Threshold | — | IEEE | Frequency stability risk point |

## 5 · Intermediate Transformation Logic
**Methodology:** Grid inertia decline model
**Headline formula:** `Inertia = Σ(H_i × MVA_i × Online_i); RoCoF = ΔP / (2 × Inertia)`
**Standards:** ['IEEE', 'IEA']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).