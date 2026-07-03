# Climate Finance Hub
**Module ID:** `climate-finance-hub` · **Route:** `/climate-finance-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated climate finance analytics hub tracking green bond issuance, sustainability-linked loan pricing, blended finance structures, and climate ODA flows. Covers use-of-proceeds verification, KPI step-down mechanics, and OECD Rio Marker accounting.

> **Business value:** Climate finance hub aggregates green bonds, SLLs, blended finance, and ODA. SLL step-down typically 5–15bps per KPI. Blended finance leverage target: 5×–10× private per concessional dollar for infrastructure.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `FUNDS`, `PROJECTS`, `TABS`, `TYPES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `TYPES` | `['All','Mitigation','Adaptation','Cross-cutting','Loss & Damage'];const PAGE=12;` |
| `fund` | `FUNDS[i%30];const region=regions[Math.floor(sr(i*7)*regions.length)];const sector=sectors[Math.floor(sr(i*11)*sectors.length)];` |
| `type` | `['Mitigation','Adaptation','Cross-cutting','Loss & Damage'][Math.floor(sr(i*13)*4)];const status=['Active','Completed','Pipeline','Disbursing'][Math.f` |
| `approved` | `+(sr(i*19)*500+10).toFixed(1);const disbursed=+(approved*(sr(i*23)*0.6+0.2)).toFixed(1);const cofinance=+(approved*(sr(i*29)*2+0.5)).toFixed(1);` |
| `countries` | `Math.round(sr(i*31)*8+1);const beneficiaries=Math.round(sr(i*37)*5+0.1);const emissions=Math.round(sr(i*41)*50+5);const jobs=Math.round(sr(i*43)*20000` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,approved:+Math.max(0,approved/5+sr(i*100+y)*20-10).toFixed(1),disbursed:+Math.max(0,disbursed/5+sr(i*100+y*` |
| `paged` | `useMemo(()=>filtered.slice((page-1)*PAGE,page*PAGE),[filtered,page]);const totalPages=Math.ceil(filtered.length/PAGE);` |
| `stats` | `useMemo(()=>({count:filtered.length,totalApproved:fmt(filtered.reduce((s,r)=>s+r.approvedM,0)*1e6),totalDisbursed:fmt(filtered.reduce((s,r)=>s+r.disbu` |
| `typeDist` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{m[r.type]=(m[r.type]\|\|0)+r.approvedM;});return Object.entries(m).map(([k,v])=>({name:k,value:Math.round(v` |
| `regionFlow` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{if(!m[r.region])m[r.region]={region:r.region,approved:0,disbursed:0};m[r.region].approved+=r.approvedM;m[` |
| `fundRank` | `useMemo(()=>{const m={};PROJECTS.forEach(r=>{if(!m[r.fund])m[r.fund]={fund:r.fund,total:0,n:0};m[r.fund].total+=r.approvedM;m[r.fund].n++;});return Ob` |
| `yearlyTrend` | `useMemo(()=>{const m={};PROJECTS.forEach(p=>p.yearly.forEach(y=>{if(!m[y.year])m[y.year]={year:y.year,approved:0,disbursed:0};m[y.year].approved+=y.ap` |
| `exportCSV` | `useCallback((data,fn)=>{if(!data.length)return;const keys=Object.keys(data[0]).filter(k=>k!=='yearly');const csv=[keys.join(','),...data.map(r=>keys.m` |
| `needs` | `[{region:'Sub-Saharan Africa',need:80,current:25},{region:'South Asia',need:60,current:20},{region:'Southeast Asia',need:45,current:18},{region:'Latin` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/climate-finance/ref/oecd-markers` | `get_oecd_markers` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/recipient-countries` | `get_recipient_countries` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/cpi-data` | `get_cpi_data` | api/v1/routes/climate_finance.py |
| GET | `/api/v1/climate-finance/ref/mdb-institutions` | `get_mdb_institutions` | api/v1/routes/climate_finance.py |

### 2.3 Engine `climate_finance_engine` (services/climate_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `track_climate_finance` | entity_id, portfolio_name, year, instruments |  |
| `assess_article21c_alignment` | entity_id, portfolio, financial_flows |  |
| `calculate_ncqg_contribution` | entity_id, institution_type, baseline_finance_usd, planned_uplift_pct, mobilisation_multiplier, guarantee_share_of_contribution | All entity-specific figures (planned uplift over baseline, realised |
| `measure_mobilisation` | entity_id, public_finance_usd, instruments |  |
| `generate_climate_finance_report` | entity_id, year, total_finance_usd, adaptation_finance_usd, private_mobilised_usd, carbon_pricing_coverage_pct | Builds the UNFCCC Biennial Finance Report structure from CALLER-SUPPLIED |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `provider` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `COLORS`, `FUNDS`, `TABS`, `TYPES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Green Bond Issuance Volume | `Σ use-of-proceeds allocations` | ICMA tracker | Total proceeds allocated to eligible green projects |
| SLL Step-Down | `Spread reduction per KPI achievement` | Loan documentation | Interest rate reduction triggered by hitting sustainability performance target |
| Blended Finance Leverage Ratio | `Private : concessional capital` | OECD Blended Finance | Ratio of private finance mobilised per unit of concessional capital |
| ODA Climate Finance (Rio Marker) | `Rio II principal + 50%×Rio I` | OECD DAC | Climate-focused ODA calculated using Rio Marker weighting |
- **Bond prospectus data** → Use-of-proceeds categories → allocation tracker → **Green finance deployment**
- **OECD DAC database** → Rio Marker coding → climate ODA total → **Climate finance ODA flow**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-finance/ref/cpi-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'data_year', 'key_findings', 'data', 'ipcc_pathways'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/mdb-institutions** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'total_mdb_climate_finance_usd_bn', 'institutions_count', 'institutions', 'mobilisation_multipliers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/ncqg-structure** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'cop_decision', 'legal_basis', 'structure', 'predecessor_100bn_tracking'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/oecd-markers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['framework', 'methodology', 'marker_values', 'markers_count', 'markers'], 'n_keys': 5}`

**GET /api/v1/climate-finance/ref/recipient-countries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['total_countries', 'income_group_breakdown', 'v20_members', 'climate_vulnerable', 'countries'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic
**Methodology:** Climate finance flow accounting and KPI step-down pricing
**Headline formula:** `SLL_Spread(t) = BaseSpread × (1 – StepDown × KPI_achieved(t)); GreenFinanceTotal = Σ(GreenBonds + SLL + BlendedFinance + ODA)`
**Standards:** ['ICMA Green Bond Principles 2021', 'LMA/APLMA Sustainability-Linked Loan Principles 2023', 'OECD DAC Rio Marker Guidance', 'EU GBS Regulation 2023']

**Engine `climate_finance_engine` — extracted transformation lines:**
```python
fossil_exposure = 0.0            # sum of caller-supplied fossil-fuel amounts
mitigation_counted = amount if ccm_marker == 2 else amount * 0.5 if ccm_marker == 1 else 0
adaptation_counted = amount if cca_marker == 2 else amount * 0.5 if cca_marker == 1 else 0
total_climate_finance = total_mitigation + total_adaptation + total_cross_cutting
contribution_usd = baseline_finance_usd * (1 + effective_uplift_pct / 100)
guarantee_amount = contribution_usd * g_share
equity_amount = contribution_usd * e_share
share_of_core_goal_pct = contribution_usd / core_goal * 100
mobilised = amount * actual_multiplier
weighted_avg_multiplier = total_mobilised / public_finance_usd if public_finance_usd > 0 else 0
additionality_avg = additionality_score / public_finance_usd if public_finance_usd > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **1** other module(s).
**Shared engines (edits propagate!):** `climate_finance_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-finance-tracker` | engine:climate_finance_engine, table:provider |