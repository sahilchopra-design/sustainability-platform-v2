# Climate Finance Tracker
**Module ID:** `climate-finance-tracker` · **Route:** `/climate-finance-tracker` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Real-time tracking of climate finance commitments versus disbursements across public and private sources. Monitors progress toward UNFCCC $100Bn goal, NDC financing gaps, and Article 6.4 credit flow accounting with country-level finance need assessment.

> **Business value:** Global climate finance mobilised reached ~$89Bn/yr in 2021 vs $100Bn commitment. Adaptation finance remains <10% of total. NDC implementation gap estimated at $3–5Tn/yr for developing countries through 2030.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COLORS`, `DONOR_FLOWS`, `FUNDS`, `PIPELINE`, `Stat`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Global Climate Finance Dashboard','Fund-Level Analytics','Country-Level Flows','Investment Opportunity Pipeline'];` |
| `flows` | `Array.from({length:50},(_,i)=>{const s=sr(i*7);const s2=sr(i*13);` |
| `types` | `['Bilateral ODA','MDB Concessional','MDB Non-Concessional','Private Mobilised','Blended Finance','Green Bond','Climate Fund Grant','DFI Loan','Export ` |
| `annualTrend` | `Array.from({length:8},(_,i)=>({year:2018+i,public:Math.round(55+sr(i*3)*15+i*5),private:Math.round(30+sr(i*7)*20+i*8),adaptation:Math.round(12+sr(i*11` |
| `exportCSV` | `(rows,name)=>{if(!rows.length)return;const keys=Object.keys(rows[0]);const csv=[keys.join(','),...rows.map(r=>keys.map(k=>`"${r[k]}"`).join(','))].joi` |
| `totalFlows` | `flows.reduce((s,f)=>s+f.amountMn,0);` |
| `adaptPct` | `totalFlows?Math.round(flows.filter(f=>f.purpose==='Adaptation').reduce((s,f)=>s+f.amountMn,0)/totalFlows*100):0;` |
| `channels` | `[...new Set(flows.map(f=>f.channel))];` |
| `currentTotal` | `annualTrend[annualTrend.length-1].total;` |
| `targetGap` | `targetSlider-currentTotal;` |
| `purposeAgg` | `useMemo(()=>['Mitigation','Adaptation','Cross-cutting'].map(p=>({purpose:p,total:flows.filter(f=>f.purpose===p).reduce((s,f)=>s+f.amountMn,0)})),[]);` |

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
**Frontend seed datasets:** `COLORS`, `DONOR_FLOWS`, `FUNDS`, `PIPELINE`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global $100Bn Commitment Progress | `OECD monitored climate finance` | OECD Climate Finance Monitoring | Annual climate finance mobilised toward developed-country $100Bn commitment |
| NDC Financing Gap | `NDC need – available finance` | UNFCCC SCF | Aggregate developing country climate financing shortfall |
| Adaptation Finance Share | `Adaptation / total climate finance` | OECD DAC | Share of climate finance allocated to adaptation vs mitigation |
| Article 6.4 Credit Flow | `ITMO transfers via Art. 6.4` | UNFCCC SB | International carbon credit flow under Paris Agreement Article 6.4 mechanism |
- **OECD DAC CRS database** → Rio Marker finance data → committed/disbursed tracking → **Annual climate finance flow**
- **UNFCCC NDC registry** → Implementation cost estimates → financing need → **Country-level NDC finance gap**

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
**Methodology:** Climate finance gap = need minus committed minus disbursed
**Headline formula:** `FinGap(c) = NDCNeed(c) – Committed(c) – Disbursed(c); GlobalGap = Σ_c FinGap(c)`
**Standards:** ['UNFCCC Standing Committee on Finance', 'OECD Climate Finance Monitoring', 'CPI Global Landscape of Climate Finance', 'Paris Agreement Art. 9']

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
| `climate-finance-hub` | engine:climate_finance_engine, table:provider |