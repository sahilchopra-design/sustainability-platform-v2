# Blended Finance Structuring
**Module ID:** `blended-finance` · **Route:** `/blended-finance` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
MDB and DFI risk-layering analytics for blended finance structures covering first-loss tranche sizing, concessional capital IRR subsidy calculations, and commercial co-investor returns across 5 deal archetypes. Applies OECD Blended Finance Principles and DFI Working Group models to structure climate and development finance transactions.

> **Business value:** Blended finance is the primary mechanism for mobilising private capital into climate-vulnerable and emerging market projects that cannot meet commercial return thresholds unaided. Rigorous first-loss sizing and cascade discipline ensure that concessional capital is used only where necessary, maximising its leverage effect and preserving DFI financial sustainability.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BF_INSTRUMENTS`, `Badge`, `BlendedFinancePage`, `Btn`, `Card`, `KPI`, `PIE_COLORS`, `SAMPLE_DEALS`, `SDG_COLORS`, `SDG_NAMES`, `Section`, `Slider`, `SortHeader`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `sliderTotal` | `Object.values(sliders).reduce((s, v) => s + v, 0);` |
| `sectors` | `useMemo(() => ['All', ...new Set(allDeals.map(d => d.sector))], [allDeals]);` |
| `statuses` | `useMemo(() => ['All', ...new Set(allDeals.map(d => d.status))], [allDeals]);` |
| `totalDealValue` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize, 0), [allDeals]);` |
| `totalConcessional` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.concPct / 100, 0), [allDeals]);` |
| `totalCommercial` | `useMemo(() => allDeals.reduce((s, d) => s + d.totalSize * d.commPct / 100, 0), [allDeals]);` |
| `avgLeverage` | `useMemo(() => allDeals.length ? (allDeals.reduce((s, d) => s + d.leverage, 0) / allDeals.length) : 0, [allDeals]);` |
| `allGeos` | `useMemo(() => new Set(allDeals.map(d => d.geography)), [allDeals]);` |
| `conc` | `sliders.concessional + sliders.guarantees + sliders.firstLoss + sliders.ta;` |
| `comm` | `sliders.commercial + sliders.equity;` |
| `dfis` | `d.dfi.split(/\s*\+\s*/);` |
| `rows` | `allDeals.map(d => `${d.id},${d.project},${d.sector},${d.geography},${d.totalSize},${d.concPct},${d.commPct},${d.grantPct},${d.eqPct},${d.leverage},${d` |
| `blob` | `new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });` |
| `blob` | `new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });` |
| `chartData` | `Object.entries(sectorData).sort((a,b) => b[1] - a[1]).map(([k,v]) => ({ name:k, value:v }));` |
| `totalVal` | `deals.reduce((s,d) => s + d.totalSize, 0);` |
| `pctVal` | `allDeals.length ? (deals.length / allDeals.length * 100) : 0;` |

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
**Frontend seed datasets:** `BF_INSTRUMENTS`, `PIE_COLORS`, `SAMPLE_DEALS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| First-Loss Tranche Size | `Investment × (1 – comm_hurdle / project_IRR)` | OECD model | Concessional capital required to achieve commercial hurdle rate for co-investors |
| Commercial Investor IRR | `Residual FCF / Commercial equity` | DFI cascade model | Return achieved by commercial co-investors after absorbing first-loss support |
| Subsidy Efficiency | — | MDB/DFI impact metrics | Development outcomes (jobs, clean energy capacity) per million dollars of concessional capital |
- **Project cash flow projections** → Apply first-loss model to determine concessional tranche size; compute per-tranche IRR → **Capital stack configuration with IRR waterfall and subsidy efficiency metrics**
- **MDB/DFI deal database (Convergence)** → Benchmark structure against comparable historical blended finance transactions → **Peer structure comparison and market-standard concessional ratio benchmarks**

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
**Methodology:** OECD first-loss tranche sizing model
**Headline formula:** `Commercial_IRR = (Project_FCF – Concessional_coupon × Conc_size) / Commercial_investment; FirstLoss_required = Investment × (1 – Commercial_hurdle_IRR / Project_IRR)`
**Standards:** ['OECD Blended Finance Principles', 'DFI Working Group Cascade Approach', 'G20 MDB Capital Adequacy Framework']

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
| `blended-finance-structuring` | engine:blended_finance_engine, table:Convergence, table:exc, table:portfolio |
| `biodiversity-credits` | table:exc |
| `transition-finance` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `just-transition-adaptation` | table:exc |
| `insurance-climate-hub` | table:exc |
| `nbs-finance` | table:exc |
| `insurance-transition` | table:exc |
| `supply-chain-map` | table:exc |