# Sovereign Social Index
**Module ID:** `sovereign-social-index` · **Route:** `/sovereign-social-index` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Social development, inequality, labour rights and human capital analytics producing a sovereign social index for sustainable sovereign bond assessment and engagement.

> **Business value:** Produces a comprehensive sovereign social index integrating human development, inequality, labour rights and social protection for sovereign bond ESG integration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES`, `DIMS`, `DIM_COLORS`, `DIM_DESC`, `DIM_KEYS`, `DashboardTab`, `DimensionTab`, `INCOME_GROUPS`, `PortfolioTab`, `QUARTERS`, `RAW_COUNTRIES`, `REGIONS`, `REGION_COLORS`, `SCORE_TIERS`, `SDGS`, `SdgTab`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `lerp` | `(a,b,t)=>a+(b-a)*t;` |
| `clamp` | `(v,lo,hi)=>Math.max(lo,Math.min(hi,v));` |
| `pct` | `(v,t)=>t?((v/t)*100).toFixed(1)+'%':'—';` |
| `DIM_DESC` | `['Human Development Index composite','Income equality (100 - Gini coefficient)','Universal healthcare access & quality','Education quality, literacy, ` |
| `REGIONS` | `['All','Europe','Americas','Asia-Pacific','Africa','MENA'];` |
| `INCOME_GROUPS` | `['All','High','Upper-Mid','Lower-Mid','Low'];` |
| `REGION_COLORS` | `{Europe:T.navy,Americas:T.sage,'Asia-Pacific':T.gold,Africa:'#7c3aed',MENA:'#0d9488'};` |
| `SDGS` | `Array.from({length:17},(_,i)=>({id:i+1,name:['No Poverty','Zero Hunger','Good Health','Quality Education','Gender Equality','Clean Water','Affordable ` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25','Q3-25','Q4-25'];` |
| `base` | `income==='High'?68:income==='Upper-Mid'?48:income==='Lower-Mid'?35:25;` |
| `gdpFactor` | `clamp(gdp_pc/1200,0,20);` |
| `COUNTRIES` | `RAW_COUNTRIES.map((c,idx)=>{` |
| `composite` | `DIM_KEYS.reduce((a,k)=>a+dims[k],0)/8;` |
| `trends` | `DIM_KEYS.map((k,di)=>QUARTERS.map((q,qi)=>{` |
| `drift` | `(sr(idx*200+di*30+qi*7)-0.45)*2.5;` |
| `bondYield` | `clamp(1.2+(100-composite)*0.06+sr(idx*600)*1.5,0.3,14);` |
| `ratingIdx` | `clamp(Math.floor((100-composite)/7),0,14);` |
| `rating` | `['AAA','AA+','AA','AA-','A+','A','A-','BBB+','BBB','BBB-','BB+','BB','BB-','B+','B'][ratingIdx];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DIMS`, `DIM_COLORS`, `DIM_DESC`, `DIM_KEYS`, `INCOME_GROUPS`, `QUARTERS`, `RAW_COUNTRIES`, `REGIONS`, `SCORE_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Indexed | — | UNDP/ILO/WB | Countries with complete social index scoring across all four dimensions. |
| Highest Social Score | — | Calculated | Country with highest composite sovereign social index score. |
| Portfolio Avg Social | — | Weighted avg | AUM-weighted mean social index score across sovereign bond portfolio. |
- **UNDP HDI, World Bank Gini, ILO EPLEX, IMF social spending data** → Indicator normalisation, pillar weighting, composite aggregation → **Sovereign social index scores, country rankings, portfolio social exposure**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Social Index
**Headline formula:** `(HDI × 0.30) + (Inequality × 0.25) + (Labour Rights × 0.25) + (Social Safety Net × 0.20)`
**Standards:** ['UNDP HDI', 'World Bank Gini', 'ILO EPLEX', 'IMF Fiscal Monitor']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).