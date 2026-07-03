# SLL/SLB Analytics
**Module ID:** `sll-slb-v2` · **Route:** `/sll-slb-v2` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Sustainability-linked loan and bond KPI tracking with step-up/down coupon mechanics, SPT ambition assessment and ICMA/LMA framework compliance verification.

> **Business value:** Manages the full lifecycle of SLL and SLB KPI monitoring, SPT assessment and coupon adjustment mechanics.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `CURRENCIES`, `ISSUERS`, `KPIS`, `SECTORS`, `Stat`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TYPES` | `['SLL','SLB','SLL-RCF','SLB-Green','SLL-Term','SLB-Social'];` |
| `KPIS` | `['GHG Scope 1+2 Reduction','Renewable Energy %','Water Intensity','Gender Diversity %','Lost Time Injury Rate','Recycling Rate','Energy Efficiency','B` |
| `ISSUERS` | `['Enel SpA','Orsted A/S','Iberdrola SA','NextEra Energy','Schneider Electric','Danone SA','Novartis AG','Holcim Ltd','Suzano SA','Tesco PLC','Engie SA` |
| `facilities` | `Array.from({length:60},(_,i)=>{ const s=sr(i*7); const s2=sr(i*13); const s3=sr(i*19);` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].joi` |
| `totalNotional` | `facilities.reduce((s,f)=>s+f.notional,0);` |
| `avgIcma` | `Math.round(facilities.reduce((s,f)=>s+f.icmaAlign,0)/facilities.length);` |
| `sectorAgg` | `useMemo(()=>SECTORS.map(s=>{const fs=facilities.filter(f=>f.sector===s);return {sector:s,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).fi` |
| `typeAgg` | `useMemo(()=>TYPES.map(t=>{const fs=facilities.filter(f=>f.type===t);return {type:t,count:fs.length,total:fs.reduce((a,f)=>a+f.notional,0)};}).filter(t` |
| `costImpact` | `useMemo(()=>{const notional=500;return marginScenario.map(m=>({year:m.year,baseCost:+(notional*m.base/10000).toFixed(2),stepUpCost:+(notional*m.stepUp` |
| `complianceData` | `useMemo(()=>facilities.map(f=>{const icma=f.icmaAlign>=80;const lma=f.lmaAlign>=75;const verified=f.verifier!=='';const overall=icma&&lma&&verified?'C` |
| `pct` | `f.kpiBaseline>0?Math.round(((f.kpiBaseline-f.kpiCurrent)/(f.kpiBaseline-f.kpiTarget))*100):50;` |
| `clampPct` | `Math.max(0,Math.min(100,pct));` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `sll_slb_v2_engine` (services/sll_slb_v2_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SllSlbV2Engine.assess_sll_slb_quality` | request |  |
| `SllSlbV2Engine.calibrate_spt` | request |  |
| `SllSlbV2Engine.calculate_margin_impact` | request |  |
| `SllSlbV2Engine.screen_greenwashing_flags` | request |  |
| `SllSlbV2Engine._score_kpi_materiality` | kpis, sector |  |
| `SllSlbV2Engine._score_spt_ambition` | spt, sector |  |
| `SllSlbV2Engine._assess_margin_mechanism` | inst |  |
| `SllSlbV2Engine._score_verification` | inst |  |
| `SllSlbV2Engine._quick_greenwash_check` | inst, spts, kpi_mat_scores |  |
| `SllSlbV2Engine._build_recommendations` | comp_scores, gw_flags, inst, kpi_mat_scores, spt_amb_scores |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `FY2024` *(shared)*, `__future__` *(shared)*, `borrower`, `exc` *(shared)*, `fastapi` *(shared)*, `issuer`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `CURRENCIES`, `ISSUERS`, `KPIS`, `SECTORS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Instruments Tracked | — | SLL/SLB register | Total sustainability-linked loans and bonds under active KPI monitoring. |
| SPT Achievement Rate | — | Verification agent | Share of KPI-SPT pairs achieving target in the most recent observation period. |
| Step-Up Events | — | Coupon tracker | Instruments triggering step-up coupon premium due to SPT failure in the period. |
- **Instrument terms, KPI data, SPT thresholds, verification reports** → SPT assessment, coupon step calculation, trend analysis → **SPT achievement dashboards, step-up alerts, ICMA compliance reports**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sll-slb-v2/ref/icma-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['instrument_type', 'source', 'components', 'spt_calibration_criteria', 'margin_ratchet_types', 'margin_ratchet_market_data', 'greenwashing_red_flags', 'market_reference'], 'n_keys': 8}`

**GET /api/v1/sll-slb-v2/ref/kpi-materiality** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['note', 'source', 'kpi_count', 'sector_count', 'sectors', 'kpi_definitions', 'matrix'], 'n_keys': 7}`

**GET /api/v1/sll-slb-v2/ref/sda-trajectories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'methodology', 'sectors_count', 'trajectories'], 'n_keys': 4}`

**GET /api/v1/sll-slb-v2/ref/verification-agents** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['spo_providers', 'spo_market_share_2023', 'verification_standards', 'external_reviewer_requirements'], 'n_keys': 4}`

**POST /api/v1/sll-slb-v2/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** SPT Achievement Rate
**Headline formula:** `KPIs Meeting Sustainability Performance Target ÷ Total KPIs × 100`
**Standards:** ['ICMA SLB Principles', 'LMA SLL Principles']

**Engine `sll_slb_v2_engine` — extracted transformation lines:**
```python
kpi_verif = sum(1 for k in kpis if k.is_externally_verifiable) / max(1, len(kpis))
kpi_sci_bench = sum(1 for k in kpis if k.has_science_based_benchmark) / max(1, len(kpis))
predefined_pct = sum(1 for s in spts if s.is_predefined_at_issuance) / max(1, len(spts))
base_verified_pct = sum(1 for s in spts if s.has_independent_base_year_verification) / max(1, len(spts))
weights = [m / sum(max_scores) for m in max_scores]
alignment_pct = sum(w * s for w, s in zip(weights, named_components))
sda_target_at_year = targets[str(years[-1])]
frac = (request.target_year - years[i]) / (years[i + 1] - years[i])
sda_reduction_required = (baseline - sda_target_at_year) / baseline * 100
performance_vs_sda = issuer_reduction - sda_reduction_required
rec_tightening = round(abs(performance_vs_sda) + 2.0, 1)
p_miss = 1.0 - p_hit
base_annual = notional * (base_bps / 10_000)
hit_margin_bps = base_bps - step_down
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **40** other module(s).

| Connected module | Shared via |
|---|---|
| `esg-data-quality` | table:FY2024 |
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |