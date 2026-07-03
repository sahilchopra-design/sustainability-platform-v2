# Data Quality Dashboard
**Module ID:** `data-quality-dashboard` · **Route:** `/data-quality-dashboard` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Platform-wide ESG data quality monitoring. Coverage rates, timeliness scores, source reliability, substitution logic audit, and data lineage visualisation.

> **Business value:** ESG data quality is the foundation of credible sustainable investment. Poor-quality data (stale, incomplete, inconsistent) undermines investment decisions, regulatory reports, and client communications. This dashboard provides continuous visibility into data quality and drives systematic improvement.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DATA_SOURCES`, `DB_TABLES`, `DOMAINS`, `MONTHS`, `QUALITY_DIMS`, `TABS`, `VALIDATION_RULES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `pick` | `(arr,s)=>arr[Math.floor(sr(s)*arr.length)];` |
| `rng` | `(min,max,s)=>min+sr(s)*(max-min);` |
| `rngI` | `(min,max,s)=>Math.floor(rng(min,max,s));` |
| `cols` | `Array.from({length: rngI(8,35,i*113)},(_,j)=>({` |
| `monthlyQuality` | `MONTHS.map((m,i)=>({` |
| `fmtPct` | `(v) => v.toFixed(1) + '%';` |
| `fmtK` | `(v) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(1)+'K' : String(v);` |
| `mins` | `Math.floor((Date.now() - new Date(iso).getTime())/60000);` |
| `avg` | `(arr, fn) => arr.reduce((s,x)=>s+fn(x),0)/arr.length;` |
| `avg` | `(fn) => sources.reduce((s,x)=>s+fn(x),0)/sources.length;` |
| `radarData` | `useMemo(()=> QUALITY_DIMS.map(d=>({ dim:d, value:overallQuality[d.toLowerCase()] })),[overallQuality]);` |
| `avg` | `(s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;` |
| `aAvg` | `(a.completeness+a.accuracy+a.timeliness+a.consistency+a.uniqueness)/5;` |
| `bAvg` | `(b.completeness+b.accuracy+b.timeliness+b.consistency+b.uniqueness)/5;` |
| `types` | `['Real-time','Hourly','Daily','Weekly','Monthly','Quarterly','Annual'];` |
| `maxLag` | `t==='Real-time'?5:t==='Hourly'?60:t==='Daily'?1440:t==='Weekly'?10080:t==='Monthly'?43200:t==='Quarterly'?129600:525600;` |
| `avg` | `(row.completeness+row.accuracy+row.timeliness+row.consistency+row.uniqueness)/5;` |
| `avg` | `(s.completeness+s.accuracy+s.timeliness+s.consistency+s.uniqueness)/5;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DB_TABLES`, `DOMAINS`, `MONTHS`, `PIE_COLORS`, `QUALITY_DIMS`, `TABS`, `VALIDATION_RULES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Overall DQ Score | — | Composite | Platform-wide weighted data quality score |
| Coverage Red Zone | — | Alert threshold | Metrics with below-minimum data coverage |
| Provider Disagreement | — | Amber threshold | MSCI vs Sustainalytics score difference triggering review |
- **Raw ESG data feeds** → DQ assessment algorithms → **Quality scores per metric**
- **Quality scores** → Traffic light classification → **Alert dashboard**
- **DQ monitoring** → Substitution decisions → **Best-available data selection**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-dimensional DQ scoring
**Headline formula:** `DQ_overall = 0.35×Coverage + 0.25×Timeliness + 0.25×Accuracy + 0.15×Consistency`
**Standards:** ['PCAF DQ Scale', 'ISO 8000 Data Quality', 'DAMA DMBOK']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).