# Energy Security & Transition
**Module ID:** `energy-security-transition` · **Route:** `/energy-security-transition` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses the tension between national energy security objectives and the pace of low-carbon transition, integrating geopolitical energy dependency scores with NDC ambition and fossil fuel import exposure. Produces country-level energy trilemma assessments covering security, equity, and sustainability dimensions. Informs sovereign risk analysis, infrastructure investment screening, and policy scenario planning.

> **Business value:** Enables sovereign analysts, infrastructure investors, and policy advisors to quantify the energy security-transition trade-off, identify countries where transition acceleration could destabilise energy supply, and structure resilient green infrastructure investment theses.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHOKEPOINTS`, `COLORS`, `COUNTRIES_50`, `PIPELINE_ROUTES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `tabs` | `['Energy Security Index','Fossil Fuel Dependency','Renewable Self-Sufficiency','Investment Implications'];` |
| `renewShare` | `Math.floor(s3*60)+5;` |
| `gasFromRussia` | `region==='Europe'?Math.floor(s4*50):Math.floor(s4*10);` |
| `reserveDays` | `Math.floor(s2*180)+10;` |
| `gridReliability` | `80+Math.floor(s5*20);` |
| `hhiImports` | `+(s6*8000+500).toFixed(0);` |
| `fuelDiversity` | `+(1-s4*0.6).toFixed(2);` |
| `securityIndex` | `Math.round((100-Math.abs(importDep)*0.3+reserveDays*0.15+renewShare*0.5+gridReliability*0.2-hhiImports*0.005)*0.5);` |
| `regions` | `[...new Set(countries.map(c=>c.region))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHOKEPOINTS`, `COLORS`, `COUNTRIES_50`, `PIPELINE_ROUTES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Import Dependency Ratio (%) | — | IEA Energy Statistics | Net energy imports as % of gross inland consumption; >70% flags high geopolitical exposure. |
| Supply Diversity (HHI) | — | IEA/BP Statistical Review | Herfindahl-Hirschman Index of energy source and supplier concentration; HHI >2,500 indicates high concentratio |
| Renewable Share of Power Mix (%) | — | IRENA / IEA | Share of variable renewables and hydro in electricity generation; key sustainability pillar driver. |
| Energy Trilemma Score (0â€“100) | — | WEC Trilemma Index | Composite country score; higher = better balance across security, equity, sustainability dimensions. |
- **IEA energy statistics (production, imports, consumption by source)** → Compute import dependency and HHI by country and fuel type → **Security sub-score per country**
- **IRENA renewable capacity and generation data** → Calculate renewable share and year-on-year trajectory → **Sustainability sub-score with NZE gap**
- **World Bank energy access and affordability data** → Normalise access rate and household energy burden → **Equity sub-score for trilemma composite**

## 5 · Intermediate Transformation Logic
**Methodology:** Energy Trilemma Score
**Headline formula:** `ETS = w₁×Security + w₂×Equity + w₃×Sustainability`
**Standards:** ['World Energy Council Trilemma Index', 'IEA World Energy Outlook 2024', 'REPowerEU']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).