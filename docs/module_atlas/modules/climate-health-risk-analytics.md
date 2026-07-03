# Climate Health Risk Analytics
**Module ID:** `climate-health-risk-analytics` · **Route:** `/climate-health-risk-analytics` · **Tier:** B (frontend-computed) · **EP code:** EP-DP2 · **Sprint:** DP

## 1 · Overview
Analyses the full spectrum of climate impacts on human health — infectious disease range expansion, malnutrition, mental health, heat mortality, and healthcare system capacity stress. Quantifies economic cost using WHO burden of disease methodology and models health system investment needs.

> **Business value:** Essential for health sector impact investors, sovereign development banks programming health adaptation, pharmaceutical companies assessing market expansion from climate-driven disease, and public health authorities quantifying climate health investment ROI.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `COUNTRIES`, `DISEASES`, `DISEASE_BURDEN`, `INCOME_GROUPS`, `KpiCard`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INCOME_GROUPS` | `['Low Income', 'Lower-Middle', 'Upper-Middle', 'High Income'];` |
| `DISEASES` | `['Malaria', 'Dengue', 'Cholera', 'Respiratory', 'Heat Stroke', 'Malnutrition', 'Vector-borne', 'Mental Health'];` |
| `mortPer100k` | `2 + sr(i * 11) * 48;` |
| `daly` | `500 + sr(i * 13) * 4500;` |
| `whoCost` | `0.1 + sr(i * 17) * 9.9;` |
| `adaptNeed` | `0.05 + sr(i * 19) * 2.95;` |
| `ahi` | `30 + sr(i * 23) * 60;` |
| `vulnerability` | `10 + sr(i * 29) * 90;` |
| `healthExpPct` | `1 + sr(i * 31) * 9;` |
| `rcp85mortality` | `mortPer100k * (1.4 + sr(i * 37) * 1.6);` |
| `DISEASE_BURDEN` | `DISEASES.map((d, i) => ({` |
| `avgMort` | `filtered.length ? (filtered.reduce((a, c) => a + c.mortPer100k, 0) / filtered.length).toFixed(2) : '0.00';` |
| `totalDaly` | `filtered.reduce((a, c) => a + c.daly, 0).toLocaleString();` |
| `totalWho` | `filtered.reduce((a, c) => a + c.whoCost, 0).toFixed(1);` |
| `totalAdapt` | `filtered.reduce((a, c) => a + c.adaptNeed, 0).toFixed(2);` |
| `avgVuln` | `filtered.length ? (filtered.reduce((a, c) => a + c.vulnerability, 0) / filtered.length).toFixed(1) : '0.0';` |
| `proj` | `(c.mortPer100k * mult).toFixed(2);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DISEASES`, `INCOME_GROUPS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Deaths by 2100 | — | IPCC AR6 WGII Chapter 7 | Climate change could cause 5M additional deaths per year by 2100 under high emission scenario |
| Vector-Borne Disease Expansion | — | Lancet Countdown 2023 | Population at risk from malaria expanded 47% since 1950 due to climate change — accelerating |
| Climate Mental Health Cost | — | Wellcome Trust Climate Mental Health 2023 | Climate anxiety and disaster-related PTSD projected to cost $1Tn/yr in lost productivity by 2030 |
- **WHO GHE disease burden data by country and cause** → Climate health burden baseline → **DALY burden and mortality by climate-sensitive disease**
- **Climate dose-response functions (IPCC AR6)** → Attributable fraction calculation → **Climate-attributable increment in disease incidence**
- **Healthcare system capacity and cost data** → Health system investment → **Capacity gap and investment needed for climate resilience**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Health Burden
**Headline formula:** `HealthBurden_climate = Σ [ΔIncidence_disease_i × DALYpercases_i × GDP_per_DALY]; ClimateHealthCost = HealthBurden × VSL_DALY`
**Standards:** ['WHO Climate Change and Health 2023', 'Lancet Countdown on Health and Climate Change 2023', 'IPCC AR6 WGII Chapter 7 — Human Health', 'CDC Climate Effects on Health Database']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).