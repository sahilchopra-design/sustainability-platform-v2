# Workforce Transition Tracker
**Module ID:** `workforce-transition-tracker` · **Route:** `/workforce-transition-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CO1 · **Sprint:** CO

## 1 · Overview
10 regions with reskilling programme outcome tracking: enrollment, completion, job placement, wage comparison.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CASES`, `PALETTE`, `REGIONS`, `ROI_DATA`, `SKILLS_GAP`, `TABS`, `YEARLY_TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalEnrolled` | `REGIONS.reduce((s, r) => s + r.enrolled, 0);` |
| `avgCompletion` | `Math.round(REGIONS.reduce((s, r) => s + r.completion, 0) / REGIONS.length);` |
| `avgPlacement` | `Math.round(REGIONS.reduce((s, r) => s + r.placement, 0) / REGIONS.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CASES`, `PALETTE`, `REGIONS`, `ROI_DATA`, `SKILLS_GAP`, `TABS`, `YEARLY_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regions | — | ILO | Global reskilling programme tracking |
| Avg Placement Rate | — | Programme data | Workers finding green employment after reskilling |

## 5 · Intermediate Transformation Logic
**Methodology:** Reskilling ROI calculation
**Headline formula:** `ROI = (WageGain × PlacementRate × Years - TrainingCost) / TrainingCost`
**Standards:** ['ILO', 'Just Transition Centre']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).