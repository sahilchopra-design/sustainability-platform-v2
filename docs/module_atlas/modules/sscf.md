# SSCF – Sustainable Supply Chain Finance
**Module ID:** `sscf` · **Route:** `/sscf` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG-linked supply chain finance platform that dynamically adjusts financing rates for suppliers based on real-time ESG performance scores, incentivising supply chain sustainability improvements.

> **Business value:** SSCF programmes have demonstrated 15–25% ESG score improvements among enrolled suppliers within two years, with lower default rates than conventional supply chain finance.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ADVERSE_IMPACTS`, `API`, `Badge`, `Btn`, `CRITERIA_SCORES`, `Inp`, `KpiCard`, `MOCK_SUPPLIERS`, `PIE_COLORS`, `Row`, `SPTS`, `Section`, `Sel`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `hashStr` | `(s) => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `(seed) => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `seed` | `hashStr(buyer + progType + framework + sizeStr);` |
| `overallScore` | `Math.round(sr(seed, 1) * 25 + 60);` |
| `oecdStep` | `Math.min(5, Math.ceil(sr(seed, 3) * 5));` |
| `scope3Coverage` | `Math.round(sr(seed, 5) * 30 + 45);` |
| `criteriaData` | `CRITERIA_SCORES.map((name, i) => ({` |
| `suppliers` | `MOCK_SUPPLIERS.map((s, i) => ({` |
| `baseRate` | `5.25 + sr(seed, 91) * 1.5;` |
| `ratchetYears` | `['2024', '2025', '2026', '2027'].map((yr, i) => {` |
| `sptAdjust` | `-(sr(seed, i * 19 + 95) * 0.3 + 0.05);` |
| `csdddScore` | `Math.round(oecdSteps.reduce((s, o) => s + o.value, 0) / 5);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/sscf/ref/sscf-frameworks` | `get_sscf_frameworks_ref` | api/v1/routes/sscf.py |
| GET | `/api/v1/sscf/ref/sector-risk-profiles` | `get_sector_risk_profiles_ref` | api/v1/routes/sscf.py |
| GET | `/api/v1/sscf/ref/oecd-ddg` | `get_oecd_ddg_ref` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/assess` | `assess_programme` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/supplier-score` | `compute_supplier_score` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/margin-ratchet` | `compute_margin_ratchet` | api/v1/routes/sscf.py |
| POST | `/api/v1/sscf/dynamic-discount` | `compute_dynamic_discount` | api/v1/routes/sscf.py |

### 2.3 Engine `sscf_engine` (services/sscf_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_score_kpi` | kpi_id, value | Score a KPI value on a 0-100 scale based on direction and benchmark. |
| `_derive_risk_tier` | overall_score, cahra_flag, conflict_mineral_flag | Classify supplier into risk tier based on ESG score and red flags. |
| `_check_csddd_cascades` | kpi_data, kpi_selections | Return list of CSDDD adverse impact categories triggered by low KPI scores. |
| `_score_oecd_ddg` | kpi_data, supplier_profiles | Score OECD DDG 5 steps based on available KPI data. |
| `score_supplier_esg` | request | Score a single supplier across all provided KPI data. |
| `calculate_margin_ratchet` | base_rate_bps, spts_met, spts_total | Calculate SPT-linked margin ratchet for sustainability-linked SCF programme. |
| `calculate_dynamic_discount` | buyer_wacc_pct, days_early, invoice_amount | Calculate early payment dynamic discount for a supplier invoice. |
| `assess_sscf_programme` | request | Full SSCF programme assessment covering: |
| `get_sscf_benchmarks` |  | Return framework profiles, KPI definitions and reference data. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `policies`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `ADVERSE_IMPACTS`, `CRITERIA_SCORES`, `MOCK_SUPPLIERS`, `PIE_COLORS`, `SPTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Avg Supplier ESG Score | — | ESG Assessments | Portfolio-weighted mean ESG score across all active SSCF suppliers. |
| Rate Benefit Distributed | — | Finance Ledger | Average spread reduction passed to suppliers with improving ESG scores. |
| Suppliers Enrolled | — | Programme Database | Total suppliers participating in the ESG-linked finance programme. |
- **Supplier ESG Assessments, Invoice Finance Flows** → Score banding + spread adjustment engine → **Rate schedules, ESG improvement reports, programme analytics**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sscf/ref/kpi-library** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['kpi_library', 'kpi_count', 'grouped_by_category', 'environmental_kpi_count', 'social_kpi_count', 'governance_kpi_count', 'verification_required_kpis', 'sbt_aligned_kpis'], 'n_keys': 8}`

**GET /api/v1/sscf/ref/oecd-ddg** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['oecd_ddg_5_steps', 'step_count', 'total_weight_pct', 'csddd_adverse_impact_categories', 'csddd_human_rights_categories', 'csddd_environmental_categories', 'cascade_applicable_categories', 're`

**GET /api/v1/sscf/ref/sector-risk-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector_risk_profiles', 'sector_count', 'sector_ids', 'risk_tier_distribution', 'eudr_exposed_sectors', 'cahra_exposed_sectors', 'conflict_mineral_sectors'], 'n_keys': 7}`

**GET /api/v1/sscf/ref/sscf-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'framework_count', 'framework_ids'], 'n_keys': 3}`

**POST /api/v1/sscf/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** ESG-Linked Rate Adjustment
**Headline formula:** `Rate = BaseRate – (ΔESG × SpreadStep)`
**Standards:** ['IFC SSCF Guidelines 2022', 'LMA Green Loan Principles']

**Engine `sscf_engine` — extracted transformation lines:**
```python
score = max(0.0, 100.0 - math.log1p(v) * 12)
step_score = sum(_score_kpi(k, kpi_data[k]) for k in available_kpis) / len(available_kpis)
overall_score = (env_score * 0.40 + soc_score * 0.35 + gov_score * 0.25)
achievement_pct = (spts_met / spts_total) * 100
adjustment_bps = max(adjustment_bps, -75)
adjustment_bps = min(adjustment_bps, +50)
new_rate_bps = base_rate_bps + adjustment_bps
annualised_rate = buyer_WACC × (days_early / 360)
buyer_wacc_decimal = buyer_wacc_pct / 100
annualised_discount_rate = capped_rate * (days_early / 360)
discount_amount = invoice_amount * annualised_discount_rate
settlement_amount = invoice_amount - discount_amount
weighted_score = sum(s * w for s, w in supplier_scores_for_kpi) / sum(w for _, w in supplier_scores_for_kpi)
simulated_spts_met = int((avg_programme_score / 100) * len(request.kpi_selections))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).