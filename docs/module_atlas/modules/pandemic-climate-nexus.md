# Pandemic-Climate Nexus
**Module ID:** `pandemic-climate-nexus` · **Route:** `/pandemic-climate-nexus` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Combined pandemic and climate systemic risk analysis. Covers zoonotic disease spillover, supply chain double disruption, health system stress, and portfolio compound shock assessment.

> **Business value:** The COVID-19 pandemic demonstrated how biological and physical risks can compound with climate-driven disruptions. The same deforestation driving climate change increases zoonotic spillover risk. This module enables scenario planning for the next compound systemic shock combining pandemic and climate crises.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `COUNTRY_NAMES`, `DISEASES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `deforestKm2` | `Math.floor(s1*50000+100);` |
| `habitatFragPct` | `+(s2*80+10).toFixed(1);` |
| `wildlifeTradePct` | `+(s3*60+5).toFixed(1);` |
| `spilloverRisk` | `Math.floor(s4*100);` |
| `ghsIndex` | `+(20+s5*60).toFixed(1);` |
| `healthcareCapacityBeds` | `Math.floor(sr(i*31+313)*800+50);` |
| `pharmaSupplyVuln` | `Math.floor(sr(i*37+317)*100);` |
| `popM` | `+(sr(i*41+319)*250+2).toFixed(1);` |
| `amrIndex` | `Math.floor(sr(i*43+321)*100);` |
| `diseaseRange` | `DISEASES.map((d,di)=>({` |
| `qTrend` | `QUARTERS.map((_,qi)=>({q:QUARTERS[qi],spillover:Math.floor(spilloverRisk*(0.85+qi*0.02+sr(i*59+qi*7)*0.1)),ghs:+(ghsIndex+sr(i*61+qi*11)*2-1).toFixed(` |
| `pharmaExposure` | `Math.floor(sr(i*67+327)*5000+100);` |
| `healthInfraGapM` | `Math.floor(sr(i*71+329)*10000+200);` |
| `pandemicBondM` | `Math.floor(sr(i*73+331)*2000);` |
| `oneHealthInvestM` | `Math.floor(sr(i*79+333)*1500+50);` |
| `fmt` | `(n)=>n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);` |
| `TABS` | `['Zoonotic Risk Map','Vector-Borne Disease Expansion','Pandemic Preparedness','Investment Implications'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRY_NAMES`, `DISEASES`, `HORIZONS`, `QUARTERS`, `RCP_SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Zoonotic Risk Drivers | — | WHO/EcoHealth Alliance | Environmental factors increasing spillover probability |
| Health System Stress | — | IPCC WGII | Compound climate-health system overload |
| Supply Chain Impact | — | Model | Combined pandemic + climate > sum of parts |
- **Deforestation data** → Habitat-spillover risk model → **Zoonotic emergence risk**
- **Climate health projections** → Health system capacity overlay → **Compound stress score**
- **Portfolio exposure** → Compound shock simulation → **Double disruption P&L impact**

## 5 · Intermediate Transformation Logic
**Methodology:** Compound systemic risk model
**Headline formula:** `CompoundImpact = max(Pandemic, Climate) + Interaction_term × Correlation`
**Standards:** ['WHO', 'IPCC AR6 WGII Ch.7', 'CEPI']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).