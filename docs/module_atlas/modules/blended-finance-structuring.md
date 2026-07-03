# Blended Finance Structuring Analytics
**Module ID:** `blended-finance-structuring` · **Route:** `/blended-finance-structuring` · **Tier:** A (backend vertical) · **EP code:** EP-DI1 · **Sprint:** DI

## 1 · Overview
Blended finance structuring analytics covering first-loss tranche sizing, concessional capital catalytic ratio, DFI/MDB co-investment structures, and OECD DAC blended finance taxonomy. Quantifies the leverage ratio of private capital mobilised per unit of public/concessional capital deployed.

> **Business value:** Quantifies private capital leverage, optimal tranche sizing, and OECD DAC taxonomy classification for blended finance structures targeting emerging-market climate and SDG investments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DFI_PROVIDERS`, `GUARANTEE_STRUCTURES`, `MOBILIZATION_DATA`, `OECD_PRINCIPLES`, `TABS`, `TRANCHE_TYPES`, `USE_CASES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seniorPct` | `100 - firstLossPct - mezzPct;` |
| `firstLossM` | `totalM * firstLossPct / 100;` |
| `mezzM` | `totalM * mezzPct / 100;` |
| `seniorM` | `totalM * seniorPct / 100;` |
| `guaranteeM` | `totalM * dfiGuaranteePct / 100;` |
| `concessionalRate` | `(marketRate - concRateBps / 100) / 100;` |
| `blendedCost` | `(firstLossM * 0.04 + mezzM * (marketRate / 100) * 0.85 + seniorM * (marketRate / 100)) / totalM;` |
| `mobilizationRatio` | `seniorM / (firstLossM + guaranteeM * 0.15);` |
| `concessionality` | `(marketRate / 100 - blendedCost) * totalM;` |
| `dfiChart` | `useMemo(() => DFI_PROVIDERS.map((d, i) => ({` |
| `concPricingData` | `useMemo(() => [0, 50, 100, 150, 200, 250, 300, 350, 400, 500].map(conc => ({` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/blended-finance/structure` | `post_blended_structure` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/dfi-standards` | `post_dfi_standards` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/concessional-layers` | `post_concessional_layers` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/mobilisation-metrics` | `post_mobilisation_metrics` | api/v1/routes/blended_finance.py |
| POST | `/api/v1/blended-finance/portfolio` | `post_blended_portfolio` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/mdb-profiles` | `get_mdb_profiles` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/instruments` | `get_instruments` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/dac-sectors` | `get_dac_sectors` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/convergence-benchmarks` | `get_convergence_benchmarks` | api/v1/routes/blended_finance.py |
| GET | `/api/v1/blended-finance/ref/ep-categories` | `get_ep_categories` | api/v1/routes/blended_finance.py |

### 2.3 Engine `blended_finance_engine` (services/blended_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_clamp` | v, lo, hi |  |
| `_mid` | rng_tuple | Midpoint of a documented model-config range (structuring assumption). |
| `_score_ifc_ps` | project_category, sector, reported_scores | Score the 8 IFC Performance Standards. |
| `_es_risk_tier` | ifc_score, sector | E&S risk tier (EP4 A/B/C). Sector alone forces Category A; otherwise a |
| `_country_income_group` | country, reported_income_group | Resolve World Bank / UN income classification for ODA eligibility. |
| `assess_blended_structure` | entity_id, instrument_type, project_size_usd, sector, country, concessional_pct | Assess a blended finance structure. |
| `analyse_dfi_standards` | entity_id, dfi_partner, project_category, reported_ps_scores, grievance_score, grievance_channels | Analyse DFI E&S standards compliance across 8 IFC PS categories. |
| `model_concessional_layers` | entity_id, total_size_usd, sectors, tranche_shares, tranche_return_targets, tranche_ratings | Model tranche waterfall: senior / mezzanine / first-loss / grant. |
| `calculate_mobilisation_metrics` | entity_id, public_finance_usd, private_co_finance_usd, sector, financial_additionality, es_additionality | Calculate MDB mobilisation metrics, additionality and crowding assessment. |
| `generate_blended_portfolio` | entity_id, instruments | Aggregate blended finance instruments into portfolio-level analytics. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Convergence` *(shared)*, `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `portfolio` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `DFI_PROVIDERS`, `GUARANTEE_STRUCTURES`, `MOBILIZATION_DATA`, `OECD_PRINCIPLES`, `TABS`, `TIER_COLORS`, `TRANCHE_TYPES`, `USE_CASES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Catalytic Leverage Ratio | `Private capital mobilised / concessional capital deployed` | OECD DAC blended finance dataset | Higher ratios indicate greater mobilisation efficiency; OECD target >3x for emerging markets |
| First-Loss Tranche Size | `Expected portfolio loss × stress multiplier / total facility size` | DFI structuring guidelines | Absorbs initial losses protecting senior private investors; typically 8-20% of facility |
| Concessional Capital Share | `DFI/MDB concessional tranche / total capital stack` | CONVERGENCE database | Share above 25% may crowd out private capital; below 10% may be insufficient to de-risk |
- **CONVERGENCE Blended Finance Database** → Historical deal terms → leverage ratio benchmarks by sector and region → **Peer comparison for tranche sizing**
- **DFI/MDB term sheets** → Concessional pricing, tenor, grace period → waterfall model inputs → **First-loss and mezzanine tranche calibration**
- **OECD DAC taxonomy** → Activity classification codes → concessional finance eligibility flags → **ODA attribution and reporting output**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/blended-finance/ref/convergence-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['convergence_benchmarks'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/dac-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dac_sector_codes'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/ep-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ep4_categories', 'note'], 'n_keys': 2}`

**GET /api/v1/blended-finance/ref/instruments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['instruments'], 'n_keys': 1}`

**GET /api/v1/blended-finance/ref/mdb-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['mdb_profiles'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic
**Methodology:** Catalytic Capital Leverage Modelling
**Headline formula:** `Leverage Ratio = Private Capital Mobilised / Concessional Capital Deployed; First-Loss Buffer = Expected Loss × (1 + Stress Factor)`
**Standards:** ['OECD DAC Blended Finance Taxonomy', 'G20 MDB Capital Adequacy Framework', 'CONVERGENCE Blended Finance Database']

**Engine `blended_finance_engine` — extracted transformation lines:**
```python
weighted = round(weighted_num / weight_den, 1) if weight_den > 0 else None
concessional_usd = round(project_size_usd * conc_pct, 0) if conc_pct is not None else None
first_loss_pct = (conc_pct * fl_share) if (conc_pct is not None and fl_share is not None) else None
first_loss_usd = round(project_size_usd * first_loss_pct, 0) if first_loss_pct is not None else None
private_co_finance = (round(concessional_usd * mob_ratio, 0)
senior_pct = max(0.35, 1.0 - grant_pct - first_loss_pct - mezzanine_pct)
total_pct = grant_pct + first_loss_pct + mezzanine_pct + senior_pct
total = public_finance_usd + private_co_finance_usd
direct_ratio = private_co_finance_usd / public_finance_usd if public_finance_usd > 0 else 0.0
conc_usd = size * conc_pct
priv_mob = conc_usd * mob_ratio
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **48** other module(s).
**Shared engines (edits propagate!):** `blended_finance_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `blended-finance-structurer` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `blended-finance` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |