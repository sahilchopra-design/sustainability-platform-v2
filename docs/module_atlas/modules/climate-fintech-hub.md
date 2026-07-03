# Climate Fintech Hub
**Module ID:** `climate-fintech-hub` · **Route:** `/climate-fintech-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Maps the climate fintech landscape including carbon accounting software, ESG data platforms, green lending tools, and sustainable investment technology providers.

> **Business value:** Provides a structured view of the climate fintech ecosystem to guide technology adoption, vendor selection, and strategic partnerships for climate-aligned financial institutions.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADOPTION_DATA`, `AUDIENCES`, `COMPANIES`, `EXEC_ALERTS`, `FUNDING_YEARLY`, `INNOVATION_PIPELINE`, `INTEGRATIONS`, `INTEGRATION_ROADMAP`, `KPI_DATA`, `KPI_META`, `MONTHLY_TREND`, `PERIODS`, `PIPELINE_STAGES`, `RADAR_DATA`, `RECENT_DEALS`, `REGIONAL_COVERAGE`, `REGULATORY_LANDSCAPE`, `REPORT_SECTIONS`, `ROI_DATA`, `SUB_MODULES`, `Section`, `StatusDot`, `TABS`, `TECH_CATEGORIES`, `TECH_CAT_COLORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sRange` | `(s,lo,hi)=>lo+(hi-lo)*sr(s);` |
| `sInt` | `(s,lo,hi)=>Math.floor(sRange(s,lo,hi));` |
| `TECH_CATEGORIES` | `['MRV','Satellite','Blockchain','IoT','AI/ML','Data Platforms'];` |
| `TECH_CAT_COLORS` | `{ MRV:T.sage, Satellite:T.navyL, Blockchain:T.gold, IoT:T.teal, 'AI/ML':'#8b5cf6', 'Data Platforms':'#ec4899' };` |
| `cardHover` | `{ ...card, transition:'box-shadow .18s', cursor:'default' };` |
| `blob` | `new Blob([csv],{type:'text/csv'});` |
| `prev` | `KPI_DATA[PERIODS[Math.min(PERIODS.indexOf(period)+1,PERIODS.length-1)]]?.[m.id];` |
| `overall` | `((r.satellite+r.iot+r.mrv)/3).toFixed(1);` |
| `avg` | `cos.length?cos.reduce((a,c)=>a+c.trl,0)/cos.length:0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADOPTION_DATA`, `AUDIENCES`, `COMPANIES`, `EXEC_ALERTS`, `FUNDING_YEARLY`, `INNOVATION_PIPELINE`, `INTEGRATIONS`, `INTEGRATION_ROADMAP`, `KPI_META`, `MONTHLY_TREND`, `PERIODS`, `PIPELINE_STAGES`, `RADAR_DATA`, `RECENT_DEALS`, `REGIONAL_COVERAGE`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Platforms | — | Bloomberg NEF | Number of climate fintech platforms tracked globally across carbon, ESG, and green finance verticals. |
| Carbon Accounting Software AUM | — | Internal Estimate | Total assets under management reported through dedicated carbon accounting software platforms. |
- **Climate fintech registry, platform capability surveys, AUM disclosures** → Segment classification, coverage scoring, adoption rate calculation → **Ranked platform directory, gap analysis, integration readiness scores**

## 5 · Intermediate Transformation Logic
**Methodology:** Market Penetration Index
**Headline formula:** `MPI = (Adopters / TAM) × 100`
**Standards:** ['Bloomberg NEF ClimateTech Report', 'KPMG Fintech Pulse']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).