# Mental Health & Climate Risk Analytics
**Module ID:** `mental-health-climate-risk` · **Route:** `/mental-health-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-DP5 · **Sprint:** DP

## 1 · Overview
Analyses the growing intersection of climate change and mental health — eco-anxiety, disaster PTSD, solastalgia, and climate grief. Quantifies productivity costs, workforce risk, and the investment case for mental health resilience in climate-impacted communities.

> **Business value:** Relevant for corporate HR directors in climate-exposed industries, health insurers pricing mental health products, and sovereign health policymakers. Provides first systematic financial quantification of climate mental health burden aligned with Lancet Countdown indicator framework.

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Bar`, `EVENTS`, `EVENT_DATA`, `KpiCard`, `POPULATIONS`, `POP_TYPES`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `POP_TYPES` | `['Coastal Community', 'Wildfire Zone', 'Agriculture-Dependent', 'Urban Heat Island', 'Island Nation', 'Flood Plain', 'Arctic/Polar', 'Drought-Prone'];` |
| `ptIdx` | `Math.floor(sr(i * 5) * POP_TYPES.length);` |
| `evIdx` | `Math.floor(sr(i * 7) * EVENTS.length);` |
| `ecoAnxiety` | `10 + sr(i * 11) * 85;` |
| `ptsdRate` | `5 + sr(i * 13) * 45;` |
| `insGap` | `20 + sr(i * 17) * 75;` |
| `disasterMH` | `15 + sr(i * 19) * 70;` |
| `treatAccess` | `5 + sr(i * 23) * 80;` |
| `econImpact` | `0.1 + sr(i * 29) * 4.9;` |
| `workdaysLost` | `Math.round(2 + sr(i * 31) * 28);` |
| `popSize` | `Math.round(50000 + sr(i * 37) * 9950000);` |
| `EVENT_DATA` | `EVENTS.map((e, i) => ({` |
| `TABS` | `['Overview', 'Eco-Anxiety Index', 'PTSD & Trauma', 'Disaster MH Impact', 'Insurance Gap', 'Treatment Access', 'Economic Burden', 'Investment Framework` |
| `avgEcoAnxiety` | `filtered.length ? (filtered.reduce((a, p) => a + p.ecoAnxiety, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgPtsd` | `filtered.length ? (filtered.reduce((a, p) => a + p.ptsdRate, 0) / filtered.length).toFixed(1) : '0.0';` |
| `avgInsGap` | `filtered.length ? (filtered.reduce((a, p) => a + p.insGap, 0) / filtered.length).toFixed(1) : '0.0';` |
| `totalEconImpact` | `filtered.reduce((a, p) => a + p.econImpact, 0).toFixed(1);` |
| `avgTreatAccess` | `filtered.length ? (filtered.reduce((a, p) => a + p.treatAccess, 0) / filtered.length).toFixed(1) : '0.0';` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `EVENTS`, `POP_TYPES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Anxiety Prevalence | — | APA Climate Survey 2023 | 68% of US adults report climate anxiety — 27% say it significantly impacts daily functioning |
| Disaster PTSD Prevalence | — | SAMHSA Disaster Mental Health 2023 | 30–40% of disaster survivors develop PTSD — economic cost $10,000–50,000 per case in treatment |
| Mental Health Climate Cost | — | Wellcome Trust 2023 | Climate-related mental health burden projected at $1Tn/yr in productivity losses by 2030 |
- **Climate disaster event database + mental health surveys** → PTSD and eco-anxiety prevalence → **Population-level mental health burden from climate events**
- **Labour productivity and absenteeism data** → Workforce cost modelling → **Annual productivity loss from climate mental health burden**
- **Mental health system capacity + treatment costs** → Investment case → **Cost-benefit of mental health climate resilience investment**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Mental Health Burden
**Headline formula:** `ClimateAnxietyCost = PopAffected × ProductivityLoss_days × DailyGDP; DisasterPTSD_cost = DisasterAffected × PTSDprevalence × TreatmentCost + ProductivityLoss`
**Standards:** ['Lancet Countdown Mental Health Indicator 2023', 'APA Climate for Health — Mental Health Impacts', 'IPCC AR6 WGII Chapter 7', 'Wellcome Trust Climate Mental Health Research 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).