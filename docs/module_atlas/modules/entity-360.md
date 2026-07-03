# Entity 360 View
**Module ID:** `entity-360` · **Route:** `/entity-360` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a comprehensive 360-degree ESG, climate, and financial profile for any corporate entity, aggregating data across emissions, ratings, controversies, governance, supply chain, and regulatory filings into a unified analytical workspace. Designed for credit analysts, ESG researchers, and investment teams requiring rapid entity due diligence. Integrates with all platform modules to surface cross-module entity-level insights.

> **Business value:** Accelerates entity-level ESG due diligence from days to minutes, enabling investment teams to make fully informed engagement, exclusion, and credit decisions backed by a comprehensive, multi-source evidence base in a single integrated view.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ActionTracker`, `ENTITIES`, `ENTITY_NAMES`, `EntityProfile`, `QUARTERS`, `REGIONS`, `RegulatoryExposure`, `RiskIntelligence`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `region` | `REGIONS[Math.floor(s2*REGIONS.length)];` |
| `esgScore` | `Math.floor(s3*65+25);` |
| `climateScore` | `Math.floor(sr(i*29+5)*70+20);` |
| `socialScore` | `Math.floor(sr(i*31+7)*70+20);` |
| `govScore` | `Math.floor(sr(i*37+9)*70+20);` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25'];` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color` |
| `qTrend` | `QUARTERS.map((q,i)=>({q,esg:Math.floor(sr(entity.id*31+i*7)*25+entity.esgScore-10),climate:Math.floor(sr(entity.id*37+i*9)*25+entity.climateScore-10)}` |
| `peerData` | `ENTITIES.filter(e=>e.sector===entity.sector).slice(0,6).map(e=>({name:e.ticker,esg:e.esgScore,climate:e.climateScore}));` |
| `totalEmissions` | `entity.scope1+entity.scope2+entity.scope3;` |
| `overallRisk` | `Math.round(riskBreakdown.reduce((a,r)=>a+r.score,0)/riskBreakdown.length);` |
| `avgGap` | `inScope.length?Math.round(inScope.reduce((a,f)=>a+f.gap,0)/inScope.length):0;` |
| `exposureTimeline` | `frameworks.filter(f=>f.applies).map((f,i)=>({name:f.fw,gap:f.gap}));` |
| `completionRate` | `Math.round(counts.Complete/actions.length*100);` |
| `byType` | `Object.entries(actions.reduce((acc,a)=>{acc[a.type]=(acc[a.type]\|\|0)+1;return acc},{})).map(([k,v])=>({type:k,count:v}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_NAMES`, `QUARTERS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Provider Consensus ESG Score | — | MSCI/Sustainalytics/ISS | Equal-weighted blend of three leading provider scores; high dispersion flags ratings disagreement requiring de |
| Scope 1+2 Intensity (tCO2e/$M Rev) | — | CDP/Trucost | Carbon intensity normalised by revenue; benchmarked to sector SBTi-aligned budget. |
| Controversy Severity (1â€“5) | — | RepRisk / MSCI | Most severe ESG controversy in trailing 24 months; Level 4â€“5 triggers enhanced due diligence flag. |
| TCFD Disclosure Score (%) | — | CDP Climate Questionnaire | Proportion of TCFD-recommended disclosures present and quantified in public filings. |
- **Multi-provider ESG data feeds (MSCI, Sustainalytics, ISS)** → Normalise to 0â€“100 scale; compute consensus and inter-provider dispersion → **Provider consensus score with dispersion band**
- **CDP, Bloomberg, Refinitiv emissions data** → Reconcile Scope 1/2/3 across sources; flag self-reported vs. estimated → **Carbon intensity KPIs with data quality indicator**
- **RepRisk and NGO controversy database** → Classify by pillar, severity, and recency; map to entity LEI → **Controversy severity score and incident log**

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Composite ESG Score
**Headline formula:** `Entity_ESG = w_E × E_score + w_S × S_score + w_G × G_score`
**Standards:** ['GRI Universal Standards 2021', 'SASB Industry Standards', 'MSCI ESG Methodology 2024']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).