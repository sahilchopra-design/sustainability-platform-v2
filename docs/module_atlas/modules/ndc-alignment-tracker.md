# NDC Alignment Tracker
**Module ID:** `ndc-alignment-tracker` · **Route:** `/ndc-alignment-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks the ambition, conditionality, and implementation progress of National Determined Contributions across 190+ countries against Paris Agreement 1.5°C and 2°C compatible benchmarks.

> **Business value:** Provides investors, policy analysts, and climate negotiators with a rigorous, data-driven assessment of global NDC ambition and implementation to support sovereign risk and transition risk analysis.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CHART_COLORS`, `COUNTRIES`, `COUNTRY_NAMES`, `G20`, `G20_HIST`, `IMPL_BASE`, `IMPL_GRADES`, `PARIS_BASE`, `PARIS_RATINGS`, `SECTORS`, `SECTOR_COLORS`, `SECTOR_TREND`, `TABS`, `YEARS_HIST`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `YEARS_HIST` | `Array.from({length:14},(_,i)=>(2010+i).toString());` |
| `COUNTRIES` | `COUNTRY_NAMES.map((name,i)=>{` |
| `parisIdx` | `Math.min(PARIS_BASE[name]??Math.min(Math.floor(sr(s)*5),4),4);` |
| `implIdx` | `Math.min(IMPL_BASE[name]??Math.min(Math.floor(sr(s+7)*6),5),5);` |
| `ndcYear` | `sr(s+1)>0.5?2021:sr(s+1)>0.25?2022:sr(s+1)>0.1?2016:2015;` |
| `baselineYear` | `sr(s+2)>0.5?2010:sr(s+2)>0.2?2005:1990;` |
| `baselineEmissions` | `+(50+sr(s+3)*3000).toFixed(0);` |
| `currentEmissions` | `+(baselineEmissions*(0.7+sr(s+4)*0.5)).toFixed(0);` |
| `unconditionalTarget` | `-(10+parisIdx*5+sr(s+5)*30);` |
| `conditionalTarget` | `unconditionalTarget-(5+sr(s+6)*20);` |
| `projectedBAU2030` | `+(baselineEmissions*(1.0+sr(s+7)*0.4)).toFixed(0);` |
| `requiredForParis1p5` | `+(baselineEmissions*0.55).toFixed(0);` |
| `requiredForParis2p0` | `+(baselineEmissions*0.7).toFixed(0);` |
| `implementationScore` | `+(90-implIdx*14+sr(s+8)*10).toFixed(1);` |
| `financingGap` | `+(10+sr(s+9)*500).toFixed(1);` |
| `carbonPricingInPlace` | `sr(s+10)>0.5+parisIdx*0.1;` |
| `sectoralTargets` | `SECTORS.reduce((a,sec,si)=>({...a,[sec.toLowerCase()]:+(5+Math.max(0,50-parisIdx*8)+sr(s+12+si)*25).toFixed(1)}),{});` |
| `histEmissions` | `YEARS_HIST.map((yr,yi)=>+(currentEmissions*(0.65+yi*0.03+sr(s+20+yi)*0.08)).toFixed(0));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CHART_COLORS`, `COUNTRY_NAMES`, `G20`, `IMPL_GRADES`, `PARIS_RATINGS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global NDC Ambition Gap (2030) | — | UNEP EGR 2023 | Aggregate gap between current NDC trajectories and 1.5°C-compatible emissions by 2030. |
| Countries with 1.5°C Compatible NDCs | — | Climate Action Tracker 2024 | Share of countries whose NDC commitments are rated as compatible with limiting warming to 1.5°C. |
- **UNFCCC NDC registry, CAT assessments, Climate Watch emissions data, IEA country energy data** → Target parsing, ambition gap calculation, implementation scoring → **Country NDC scorecards, ambition gap rankings, transition risk flags for sovereign analysis**

## 5 · Intermediate Transformation Logic
**Methodology:** NDC Ambition Gap
**Headline formula:** `NAG = EmissionsProjected(CurrentNDC) – EmissionsRequired(1.5°C Pathway)`
**Standards:** ['Climate Action Tracker', 'UNEP Emissions Gap Report 2023']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).