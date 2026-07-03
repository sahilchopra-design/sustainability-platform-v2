# Climate Policy Intelligence
**Module ID:** `climate-policy-intelligence` · **Route:** `/climate-policy-intelligence` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Tracks NDC ambition, carbon pricing mechanisms, climate legislation pipelines, and policy implementation progress across 190+ countries to support transition risk assessment.

> **Business value:** Provides actionable policy intelligence for transition risk modelling, sovereign bond analysis, and regulatory horizon scanning in climate-exposed investment portfolios.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `CARBON_PRICING`, `CONTINENT`, `COUNTRIES`, `INCOME`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `TABS`, `TREND`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `TREND` | `Array.from({length:24},(_,i)=>({month:`${2023+Math.floor(i/12)}-${String((i%12)+1).padStart(2,'0')}`,avgPrice:Math.round(30+i*2+sr(i*7)*15),newPolicie` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))]` |
| `paged` | `filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);const totalPages=Math.ceil(filtered.length/PAGE_SIZE);` |
| `kpis` | `useMemo(()=>{const avg=(k)=>Math.round(COUNTRIES.reduce((s,c)=>s+c[k],0)/COUNTRIES.length);const withEts=COUNTRIES.filter(c=>c.etsActive==='Yes').leng` |
| `contChart` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{if(!m[c.continent])m[c.continent]={continent:c.continent,avgStr:0,avgNdc:0,n:0};m[c.continent].avgStr+=c` |
| `targetDist` | `useMemo(()=>{const m={};COUNTRIES.forEach(c=>{m[c.tempTarget]=(m[c.tempTarget]\|\|0)+1;});return Object.entries(m).map(([name,value])=>({name,value}));}` |
| `radarData` | `useMemo(()=>{const dims=['policyStringency','ndcAmbition','ndcProgress','renewableTarget','climateFinance','adaptationSpend'];const avg=(k)=>Math.roun` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-policy/assess-jurisdiction` | `assess_jurisdiction` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/score-ndc` | `score_ndc` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/carbon-price-gap` | `carbon_price_gap` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/policy-pipeline` | `policy_pipeline` | api/v1/routes/climate_policy_tracker.py |
| POST | `/api/v1/climate-policy/portfolio-impact` | `portfolio_impact` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/jurisdictions` | `get_jurisdictions` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/fit-for-55` | `get_fit_for_55` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ira-credits` | `get_ira_credits` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/repowereu` | `get_repowereu` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/carbon-price-corridor` | `get_carbon_price_corridor` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/ngfs-policy-scenarios` | `get_ngfs_policy_scenarios` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/g20-carbon-pricing` | `get_g20_carbon_pricing` | api/v1/routes/climate_policy_tracker.py |
| GET | `/api/v1/climate-policy/ref/sector-policy-map` | `get_sector_policy_map` | api/v1/routes/climate_policy_tracker.py |

### 2.3 Engine `climate_policy_tracker_engine` (services/climate_policy_tracker_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimatePolicyTrackerEngine._get_jurisdiction` | iso |  |
| `ClimatePolicyTrackerEngine._is_advanced_economy` | iso |  |
| `ClimatePolicyTrackerEngine._get_nze_price` | iso, year |  |
| `ClimatePolicyTrackerEngine.assess_jurisdiction_policy` | jurisdiction | Full jurisdiction policy assessment: |
| `ClimatePolicyTrackerEngine.score_ndc_ambition` | jurisdiction, target_pct, base_year, conditional | Score NDC ambition 0-100 and assess Paris 1.5°C consistency. |
| `ClimatePolicyTrackerEngine._compute_ambition_score` | target_pct, base_year, ndc_status, net_zero_year | Internal ambition score computation (0-100). |
| `ClimatePolicyTrackerEngine.track_policy_pipeline` | jurisdiction, entity_sector | Track applicable regulations and compliance deadlines for a given |
| `ClimatePolicyTrackerEngine._sector_to_fit55_keywords` | sector |  |
| `ClimatePolicyTrackerEngine._get_applicable_policies` | iso |  |
| `ClimatePolicyTrackerEngine._get_upcoming_deadlines` | iso |  |
| `ClimatePolicyTrackerEngine.calculate_carbon_price_gap` | jurisdiction, current_price | Calculate gap between jurisdiction's carbon price and IEA NZE corridor. |
| `ClimatePolicyTrackerEngine.assess_policy_portfolio_impact` | portfolio_countries, portfolio_sectors, weights | Assess portfolio-level transition risk from climate policy exposure. |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`

**Database tables:** `EU` *(shared)*, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CARBON_PRICING`, `CONTINENT`, `INCOME`, `PIECLRS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Carbon Pricing Jurisdictions | — | World Bank CPD 2024 | Number of jurisdictions with operational carbon taxes or emissions trading systems as of 2024. |
| Global Weighted Carbon Price | — | World Bank CPD 2024 | GDP-weighted average carbon price across all operational pricing instruments globally. |
- **UNFCCC NDC registry, World Bank CPD, Grantham climate laws database** → Ambition scoring, carbon price normalisation, trajectory gap analysis → **Country policy dashboards, sector transition risk flags, carbon price forecasts**

## 5 · Intermediate Transformation Logic
**Methodology:** Policy Ambition Score
**Headline formula:** `PAS = Σ wᵢ × Policyᵢ / MaxScore`
**Standards:** ['Climate Action Tracker', 'World Bank Carbon Pricing Dashboard']

**Engine `climate_policy_tracker_engine` — extracted transformation lines:**
```python
frac = (year - y0) / (y1 - y0)
base_year_adjustment = max(0, (b_year - 2010) * 0.5)
adjusted_paris_benchmark = PARIS_15C_BENCHMARK_PCT_FROM_2010 - base_year_adjustment
gap_vs_15c = max(adjusted_paris_benchmark - t_pct, 0)
target_score = min(70.0, (target_pct / 55) * 70)
base_year_penalty = max(0, (base_year - 2010) * 0.3)
gap = max(nze_price - actual_price, 0)
years_to_close = max(2030 - 2024, 1)
annual_increase_required = gap / years_to_close if year == 2030 else None
gap_2030 = max(self._get_nze_price(iso, 2030) - actual_price, 0)
gap_2050 = max(self._get_nze_price(iso, 2050) - actual_price, 0)
gdp_risk_pct = gap_2030 / 50 * 1.0 if is_ae else gap_2030 / 50 * 0.5
weights = [1.0 / n] * n
weights = [w / total for w in weights]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **5** other module(s).
**Shared engines (edits propagate!):** `climate_policy_tracker_engine` (used by 2 modules)

| Connected module | Shared via |
|---|---|
| `climate-policy` | engine:climate_policy_tracker_engine, table:EU |
| `ai-governance` | table:EU |
| `critical-minerals` | table:EU |
| `api-gateway-monitor` | table:EU |
| `critical-minerals-climate` | table:EU |