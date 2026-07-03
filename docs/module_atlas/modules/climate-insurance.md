# Climate Insurance Analytics
**Module ID:** `climate-insurance` · **Route:** `/climate-insurance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Analyses climate insurance product design, actuarial pricing under physical risk scenarios, and quantifies the protection gap between economic and insured losses.

> **Business value:** Equips insurers, reinsurers, and supervisors with actuarially grounded climate pricing tools and protection gap diagnostics to support product innovation and market development.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSET_CLASSES`, `Badge`, `CAT_EVENTS`, `COLORS`, `ClimateInsurancePage`, `Grid`, `INSURERS`, `INSURER_NAMES`, `KpiCard`, `LITIGATION_CASES`, `PERILS`, `PORTFOLIOS`, `REGULATORY`, `SCENARIOS`, `Section`, `TABS`, `Tbl`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `INSURERS` | `INSURER_NAMES.map(([name,type,country],i) => ({` |
| `PORTFOLIOS` | `INSURERS.map((ins,i) => {` |
| `raw` | `ASSET_CLASSES.map((_,j) => 5 + sr(i*100+j*13)*40);` |
| `tot` | `raw.reduce((a,b)=>a+b,0);` |
| `countries` | `useMemo(() => [...new Set(INSURERS.map(x=>x.country))].sort(), []);` |
| `types` | `useMemo(() => [...new Set(INSURERS.map(x=>x.type))].sort(), []);` |
| `totalGwp` | `filteredInsurers.reduce((a,b) => a+b.gwp_usd_mn, 0);` |
| `avgSolvency` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+b.solvencyRatio_pct,0)/filteredInsurers.length).toFixed(0) : '0';` |
| `avgClimateExp` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.climateExposure_pct),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `avgPhysical` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.physicalRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `avgTransition` | `filteredInsurers.length ? (filteredInsurers.reduce((a,b) => a+parseFloat(b.transitionRisk),0)/filteredInsurers.length).toFixed(1) : '0.0';` |
| `tcfdFull` | `filteredInsurers.length ? (filteredInsurers.filter(x=>x.tcfdStatus==='Full').length / filteredInsurers.length * 100).toFixed(0) : '0';` |
| `typeDistribution` | `types.map(t => ({` |
| `top10` | `[...filteredInsurers].sort((a,b)=>b.gwp_usd_mn-a.gwp_usd_mn).slice(0,10);` |
| `claimsFreq` | `filteredPerils.map((p,i) => ({` |
| `rpCurve` | `[10,25,50,100,200,250,500,1000].map(rp => {` |
| `totalLoss` | `filteredPerils.reduce((a,p) => {` |
| `scale` | `Math.log10(rp)/Math.log10(100);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `climate_insurance_engine` (services/climate_insurance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateInsuranceEngine.assess_iais_compliance` | portfolio_input | 4-pillar IAIS supervisory assessment: governance, strategy, risk management, disclosure. |
| `ClimateInsuranceEngine.design_parametric_product` | p | Design a parametric insurance product. |
| `ClimateInsuranceEngine.model_natcat_loss` | n | NatCat loss modelling for a single country/peril combination. |
| `ClimateInsuranceEngine.calculate_climate_var` | portfolio_input | Calculate climate VaR across three risk channels: |
| `ClimateInsuranceEngine.orsa_climate_stress` | portfolio_input | Solvency II Art 45a ORSA climate stress test across 4 NGFS scenarios. |
| `ClimateInsuranceEngine.assess_casualty_liability` | portfolio_input | Assess casualty climate liability risk: D&O (greenwashing), E&O, Pollution. |
| `ClimateInsuranceEngine.analyse_protection_gap` | country_code, peril | Analyse the insurance protection gap for a country/peril combination. |
| `ClimateInsuranceEngine.full_assessment` | portfolio_input | Run all E79 sub-modules and return a consolidated ClimateInsuranceResult. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `exc` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ASSET_CLASSES`, `CAT_EVENTS`, `COLORS`, `INSURER_NAMES`, `LITIGATION_CASES`, `PERILS`, `REGULATORY`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global Protection Gap | — | Swiss Re Sigma 2024 | Annual uninsured natural catastrophe losses globally, representing underinsurance relative to economic damage. |
| Climate Loss Multiplier (2050) | — | IPCC AR6 WG2 | Projected increase in insured losses by 2050 relative to 2020 baseline under RCP 4.5–8.5. |
- **NatCat loss databases, policy exposure data, reinsurance treaty terms** → Hazard intensity mapping, frequency-severity modelling, climate loading → **Protection gap metrics, re/insurance pricing outputs, product design recommendations**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-insurance/ref/iais-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'total_items', 'total_pillars', 'reference', 'scoring_guide', 'supervisory_thresholds'], 'n_keys': 6}`

**GET /api/v1/climate-insurance/ref/natcat-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['countries', 'total_countries', 'perils', 'sources', 'climate_loading_note'], 'n_keys': 5}`

**GET /api/v1/climate-insurance/ref/parametric-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['trigger_types', 'total_types', 'reference_frameworks', 'basis_risk_guidance'], 'n_keys': 4}`

**GET /api/v1/climate-insurance/ref/protection-gap** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['protection_gap_data', 'source', 'supplementary_sources', 'note'], 'n_keys': 4}`

**POST /api/v1/climate-insurance/assess** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['insurer_name', 'reporting_year', 'overall_climate_risk_score', 'supervisory_flags', 'iais_compliance', 'parametric_design', 'natcat_loss', 'climate_var', 'orsa_stress', 'casualty_liability', `

## 5 · Intermediate Transformation Logic
**Methodology:** Protection Gap Ratio
**Headline formula:** `PGR = 1 – (Insured Loss / Economic Loss)`
**Standards:** ['Swiss Re Sigma', 'Munich Re NatCatSERVICE']

**Engine `climate_insurance_engine` — extracted transformation lines:**
```python
pillar_avg = sum(item_scores) / len(item_scores) if item_scores else 0.0
overall_pct = overall * 100.0
aal_usd_m = p.exposure_value_usd_m * aal_pct
climate_adj = 1.0 + (rcp85_loading_pct / 100.0) * (years_to_horizon / 26.0)
climate_adj_aal = aal_usd_m * climate_adj
gross_premium = pure_premium * (1 + p.premium_loading_pct / 100.0)
max_payout = p.max_payout_usd_m or p.exposure_value_usd_m * 0.80
basis_risk = (float(parts[0]) + float(parts[1])) / 2
years_factor = max(0, n.horizon_year - 2024) / 26.0  # linear to 2050
climate_loading = 1.0 + loading_rcp85 * rcp_mult * years_factor
aal = n.insured_exposure_usd_m * aal_pct
aal_climate = aal * climate_loading
pml_100 = n.insured_exposure_usd_m * pml_100_pct
pml_100_climate = pml_100 * climate_loading
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **39** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance` | table:exc |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |
| `crrem` | table:exc |