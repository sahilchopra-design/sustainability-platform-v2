# Scenario Conditional Prediction
**Module ID:** `scenario-conditional-prediction` · **Route:** `/scenario-conditional-prediction` · **Tier:** B (frontend-computed) · **EP code:** EP-CX5 · **Sprint:** CX

## 1 · Overview
Custom scenario builder with 4 input sliders, conditional predictions, 2D sensitivity surface, and pathway analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `ENTITIES`, `KPI`, `NGFS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `predictions` | `useMemo(() => ENTITIES.map((e,i) => {` |
| `base` | `55 + (sr(i * 23) * 2 - 1)*18;` |
| `carbonEffect` | `(carbonPrice - 100) * 0.03;` |
| `gdpEffect` | `(gdpGrowth - 2) * 2;` |
| `techEffect` | `(1 - techCost) * 15;` |
| `policyEffect` | `(policyStringency - 50) * 0.1;` |
| `predicted` | `Math.round(Math.max(10, Math.min(95, base + carbonEffect + gdpEffect + techEffect + policyEffect)));` |
| `base` | `55 + Math.sin(entityIdx*2.3)*18;` |
| `score` | `Math.round(Math.max(10, Math.min(95, base + (cp-100)*0.03 + (gd-2)*2 + (1-techCost)*15 + (policyStringency-50)*0.1)));` |
| `base` | `55 + Math.sin(entityIdx*2.3)*18;` |
| `pathwayData` | `useMemo(() => ['2025','2026','2027','2028','2029','2030'].map((yr,yi) => {` |
| `base` | `55 + Math.sin(entityIdx*2.3)*18;` |
| `yearEffect` | `yi * ((s.carbonPrice-100)*0.005 + (s.gdp-2)*0.3);` |
| `comparisonData` | `useMemo(() => NGFS.map(s => {` |
| `base` | `55 + Math.sin(entityIdx*2.3)*18;` |
| `predicted` | `Math.round(Math.max(10, Math.min(95, base + (s.carbonPrice-100)*0.03 + (s.gdp-2)*2 + (1-s.techCost)*15 + (s.policy-50)*0.1)));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `NGFS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Input Dimensions | — | Scenario builder | Carbon price, GDP, tech cost, policy |
| NGFS Presets | — | NGFS | Auto-fill from standard scenarios |

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-conditional inference
**Headline formula:** `y_hat = f(carbon_price, gdp_growth, tech_cost, policy_stringency | entity)`
**Standards:** ['NGFS', 'Ensemble model']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).