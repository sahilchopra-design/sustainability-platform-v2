# Api::Sustainable_Trade_Finance
**Module ID:** `api::sustainable_trade_finance` · **Route:** `/api/v1/sustainable-trade-finance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sustainable-trade-finance/assess-ep4-compliance` | `post_assess_ep4_compliance` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/score-eca-green` | `post_score_eca_green_classification` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/calculate-esg-margin` | `post_calculate_esg_linked_margin` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/screen-supply-chain` | `post_screen_supply_chain_esg` | api/v1/routes/sustainable_trade_finance.py |
| POST | `/api/v1/sustainable-trade-finance/generate-report` | `post_generate_trade_finance_report` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/ep4-categories` | `get_ep4_categories` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/ifc-performance-standards` | `get_ifc_performance_standards` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/high-risk-sectors` | `get_high_risk_sectors` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/eca-country-risk-ratings` | `get_eca_country_risk_ratings` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/commodity-supply-chain-risks` | `get_commodity_supply_chain_risks` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/icc-stf-principles` | `get_icc_stf_principles` | api/v1/routes/sustainable_trade_finance.py |
| GET | `/api/v1/sustainable-trade-finance/ref/oecd-sector-sustainability-standards` | `get_oecd_sector_sustainability_standards` | api/v1/routes/sustainable_trade_finance.py |

### 2.3 Engine `sustainable_trade_finance_engine` (services/sustainable_trade_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_get_eca_risk_rating` | country |  |
| `assess_ep4_compliance` | entity_id, project_name, sector, country, total_cost_usd, principle_scores | Assess EP4 compliance: category A/B/C, IFC PS 1-8 applicability, 10-requirement compliance checklist, ESAP requirements. `principle_scores` (optional): mapping of EP4 principle number (1-10, as int or str) to an assessed compliance score (0-100) sourced from the caller's E&S review. When absent, per-principle scores are reported as an honest null ("not_assessed") rather than fabricated — the categ |
| `score_eca_green_classification` | entity_id, sector, technology, country, oecd_classification, environmental_review_score | Score ECA green classification: OECD Common Approaches 2016, OECD CRE 2023 revision, sector sustainability standards, ECA review score. `environmental_review_score` (optional): the caller's assessed 0-100 OECD Common Approaches environmental review score. When provided, deterministic sector adjustments (renewables/coal) are applied on top. When absent, the score is reported as an honest null and t |
| `calculate_esg_linked_margin` | entity_id, base_margin_bps, kpis, performance_data, icc_principle_scores | Calculate ESG-linked margin: KPI materiality scoring, margin step-up/step-down (±5-15 bps), SPT calibration, ICC STF Principles 4 components. `performance_data` (optional): mapping of kpi_id -> observed current value. KPIs without an observed value are reported with a null current_value/performance_score and contribute nothing to the margin (honest null, never a random draw). `icc_principle_scores |
| `screen_supply_chain_esg` | entity_id, commodity, origin_country, tier1_supplier, certifications | Screen supply chain ESG: OECD DD Guidance, EUDR overlay, modern slavery risk (UK MSA/Australia MSA), deforestation risk, conflict minerals (3TG+cobalt), RBA. |
| `generate_trade_finance_report` | entity_id, portfolio_data | Generate comprehensive sustainable trade finance report: ICC STF Principles (2019), WTO Aid for Trade, OECD Arrangement on Export Credits, IFC PS cross-reference, UNCTAD sustainable trade metrics. `portfolio_data` (optional): dict of pre-aggregated portfolio metrics keyed by the field names below. Any value not supplied is reported as an honest null rather than a fabricated figure; the framework d |

**Engine `sustainable_trade_finance_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `EP4_CATEGORIES` | `{'A': {'description': 'Projects with potential significant adverse environmental and social (E&S) impacts that are diverse, irreversible or unprecedented', 'threshold_usd': 10000000, 'ifc_ps_required': [1, 2, 3, 4, 5, 6, 7, 8], 'independent_review': True, 'esap_required': True, 'examples': ['large m` |
| `IFC_PERFORMANCE_STANDARDS` | `{1: {'name': 'Assessment and Management of E&S Risks and Impacts', 'mandatory': True}, 2: {'name': 'Labor and Working Conditions', 'mandatory': True}, 3: {'name': 'Resource Efficiency and Pollution Prevention and Management', 'mandatory': False}, 4: {'name': 'Community Health, Safety and Security', ` |
| `HIGH_RISK_SECTORS` | `['mining_extractives', 'oil_gas', 'large_scale_agriculture', 'hydropower', 'large_infrastructure', 'chemical_manufacturing', 'textile_garment', 'electronics_manufacturing', 'forestry', 'fishing', 'construction', 'waste_management', 'food_processing', 'automotive', 'steel_metals']` |
| `ECA_COUNTRY_RISK_RATINGS` | `{'DE': 0, 'FR': 0, 'UK': 0, 'US': 0, 'JP': 0, 'AU': 0, 'CA': 0, 'NL': 0, 'SE': 0, 'NO': 0, 'SG': 0, 'HK': 0, 'KR': 2, 'TW': 2, 'CZ': 2, 'PL': 2, 'HU': 3, 'SK': 3, 'BR': 3, 'MX': 3, 'ZA': 3, 'TR': 4, 'IN': 4, 'ID': 4, 'PH': 4, 'TH': 4, 'VN': 4, 'EG': 4, 'MA': 5, 'CO': 5, 'PE': 5, 'KE': 5, 'GH': 5, 'T` |
| `COMMODITY_SUPPLY_CHAIN_RISKS` | `{'cotton': {'deforestation_risk': 'medium', 'modern_slavery_risk': 'high', 'water_stress_risk': 'high', 'conflict_minerals_risk': 'low', 'eudr_regulated': False, 'key_risks': ['child_labour', 'forced_labour', 'water_depletion', 'pesticide_use']}, 'cocoa': {'deforestation_risk': 'high', 'modern_slave` |
| `ICC_STF_PRINCIPLES` | `{1: {'principle': 'Do No Harm', 'description': 'Trade finance transactions should not finance activities that cause significant harm to people or the planet', 'requirements': ['negative_screening', 'environmental_social_review', 'sanctions_check']}, 2: {'principle': 'Promote Sustainability', 'descri` |
| `SECTOR_SUSTAINABILITY_STANDARDS` | `{'power': 'OECD SSS for Power Sector (2016)', 'water': 'OECD SSS for Water and Sanitation (2018)', 'transport': 'OECD SSS for Transport (2020)', 'mining': 'OECD Due Diligence Guidance for Responsible Mining', 'agriculture': 'OECD-FAO Guidance for Responsible Agricultural Supply Chains', 'forestry': ` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `db` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `trade_finance_assessments`, `trade_finance_esg_covenants`, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sustainable-trade-finance/ref/commodity-supply-chain-risks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count'], 'n_keys': 3}`

**GET /api/v1/sustainable-trade-finance/ref/eca-country-risk-ratings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count', 'scale', 'source'], 'n_keys': 5}`

**GET /api/v1/sustainable-trade-finance/ref/ep4-categories** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source'], 'n_keys': 3}`

**GET /api/v1/sustainable-trade-finance/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'count', 'note'], 'n_keys': 4}`

**GET /api/v1/sustainable-trade-finance/ref/icc-stf-principles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source', 'count'], 'n_keys': 4}`

**GET /api/v1/sustainable-trade-finance/ref/ifc-performance-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source', 'count'], 'n_keys': 4}`

**GET /api/v1/sustainable-trade-finance/ref/oecd-sector-sustainability-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data', 'source'], 'n_keys': 3}`

**POST /api/v1/sustainable-trade-finance/assess-ep4-compliance** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'data'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `sustainable_trade_finance_engine` — extracted transformation lines:**
```python
margin_adjustment = max(-15.0, min(15.0, round(margin_adjustment, 2)))
uk_msa_applicable = True  # Any company with £36M+ turnover supplying UK market
aus_msa_applicable = country_risk >= 3  # Australian entities with $100M+ revenue
rba_score = round(100.0 - (country_risk * 8.0), 1)
rba_score = min(100.0, rba_score + len(certs_verified) * 5.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`backend/services/sustainable_trade_finance_engine.py` (E75) exposes five deterministic assessment functions behind `/api/v1/sustainable-trade-finance`, plus seven `ref/*` endpoints that serve the engine's reference tables verbatim:

| Function | Endpoint | Output |
|---|---|---|
| `assess_ep4_compliance` | `POST /assess-ep4-compliance` | Equator Principles 4 category (A/B/C), applicable IFC PS, 10-principle checklist, ESAP requirements, compliance status |
| `score_eca_green_classification` | (engine; ref data via `ref/eca-country-risk-ratings` etc.) | OECD Common Approaches tier, green classification tier, ECA country risk 0–7 |
| `calculate_esg_linked_margin` | (engine) | KPI performance scores, margin adjustment ±15 bps on a base margin, SPT calibration, ICC STF principle assessment |
| `screen_supply_chain_esg` | (engine) | EUDR overlay, modern-slavery / deforestation / conflict-minerals risk, RBA alignment score, overall ESG score & risk tier |
| `generate_trade_finance_report` | (engine) | ICC STF / OECD Arrangement / IFC PS / UNCTAD report shells populated only with caller-supplied portfolio metrics |

A defining design property (stated in inline comments): the engine uses **"honest nulls"** — when the caller supplies no assessed scores or performance data, outputs are `None`/`"not_assessed"`/`"insufficient_data"` rather than fabricated numbers.

### 7.2 Parameterisation

**EP4 categorisation rules** (from `EP4_CATEGORIES` + `assess_ep4_compliance`):

| Condition | Category |
|---|---|
| cost ≥ $10M AND (high-risk sector OR country risk ≥ 5) | A |
| cost ≥ $10M otherwise | B |
| high-risk sector AND cost ≥ $1M | B |
| else | C |

Category A requires IFC PS 1–8, independent review and an ESAP; B requires PS 1–4 and an ESAP; C requires none. `HIGH_RISK_SECTORS` lists 15 sectors (mining_extractives, oil_gas, hydropower, textile_garment…). `ECA_COUNTRY_RISK_RATINGS` hard-codes ~55 countries on the OECD 0–7 country-risk scale (DE/FR/UK/US = 0 … SD/YE/AF = 7); unknown countries default to 4. "Designated country" (EP4 Annex II proxy) = country risk ≤ 1.

**Compliance-status thresholds:** per-principle score ≥ 70 → `compliant`; overall ≥ 80 with no gaps and nothing unassessed → `compliant`; ≥ 65 → `substantially_compliant`; else `non_compliant`; no scores at all → `insufficient_data`. Category C auto-scores principles 2/3/4 at 100 (not applicable by rule).

**ESG-linked margin:** default KPI set (used only if the caller supplies none) is GHG intensity (baseline 100 → target 70, weight 0.40), water intensity (50 → 35, 0.30), supply-chain ESG score (55 → 75, 0.30). Per-KPI margin impact `= (50 − performance_score)/50 × 10 × weight` bps, total clamped to ±15 bps — matching the ±5–15 bps range typical of sustainability-linked loan documentation. SPT calibration: ≥ 80 `ambitious`, ≥ 60 `credible`, else `requires_strengthening`.

**Supply-chain screening:** `COMMODITY_SUPPLY_CHAIN_RISKS` covers 8 commodities (cotton, cocoa, palm_oil, cobalt, 3TG, soy, timber_paper, coffee) with categorical deforestation / modern-slavery / conflict-minerals risk and an EUDR-regulated flag. RBA alignment `= clamp(100 − country_risk × 8, 20, 100)` + 5 per verified certification (13 valid certs: FSC, RSPO, PEFC, Fairtrade, RTRS, ISCC, ASC, MSC…). Overall ESG `= RBA − deduction(deforestation) − 0.5×deduction(slavery) − 0.3×deduction(conflict) + 3×certs`, deductions {low 0, medium 10, high 20, very_high 35}, clamped 10–100. Risk tier: <40 critical, <60 high, <75 medium, else low. All constants are engine-authored calibration values, not published coefficients.

### 7.3 Calculation walkthrough

For EP4: country → risk rating → category rule → `EP4_CATEGORIES` lookup drives applicable IFC PS list, ESAP items (5 base + 4 Category-A-only, e.g. RAP per PS 5, Biodiversity Management Plan per PS 6) and independent-review flag. Caller `principle_scores` (0–100 per EP4 principle 1–10) populate the checklist; overall score = mean over applicable, assessed principles. For margin: each KPI's observed value linearly interpolates 0–100 between baseline and target (direction-aware for reduction vs increase KPIs); weighted mean renormalised over the *scored* weight only; the forward `margin_step_schedule` is deliberately all-null ("Projection requires forward KPI trajectory input").

### 7.4 Worked example — EP4 assessment

Route defaults: manufacturing project in Nigeria (`NG`, risk 6), cost $25M, no principle scores.

| Step | Computation | Result |
|---|---|---|
| Country risk | `ECA_COUNTRY_RISK_RATINGS["NG"]` | 6 |
| High-risk sector? | "manufacturing" ∉ HIGH_RISK_SECTORS | No |
| Category rule | $25M ≥ $10M and country risk 6 ≥ 5 | **Category A** |
| Applicable standards | IFC PS 1–8 + ILO core conventions | 9 entries |
| ESAP | required; 5 base + 4 Cat-A items | 9 items |
| Principle scores | none supplied | all `not_assessed` |
| Overall score / status | `scored_count = 0` | `None` / **insufficient_data** |

If the caller then supplies `principle_scores = {1:85, 2:75, 5:60}`: overall = (85+75+60)/3 = **73.3**; principle 5 (60 < 70) is a critical gap; 73.3 ≥ 65 but < 80 (and 7 principles unassessed) → **substantially_compliant**.

Margin example: GHG KPI current = 80 → score = (100−80)/(100−70)×100 = 66.7; adj = (50−66.7)/50×10×0.40 = **−1.33 bps** (outperformance tightens the margin). With only this KPI observed, overall KPI score = 66.7 (renormalised), adjusted margin on a 200 bps base = **198.67 bps**, SPT calibration `credible`.

### 7.5 Data provenance & limitations

- **No PRNG anywhere** — this engine is fully deterministic and was explicitly refactored to the honest-null pattern (see docstrings: "never fabricated", "never a random draw").
- Reference tables (`EP4_CATEGORIES`, `ECA_COUNTRY_RISK_RATINGS`, `COMMODITY_SUPPLY_CHAIN_RISKS`, `ICC_STF_PRINCIPLES`, `SECTOR_SUSTAINABILITY_STANDARDS`) are hard-coded transcriptions of public frameworks; the OECD country-risk snapshot is static and will drift from the OECD's quarterly updates.
- Score→status thresholds (70/80/65; ±15 bps; risk-deduction table; ×8 country-risk coefficient) are engine calibration choices without a cited external source.
- No persistence: assessments are stateless request/response; route defaults (NG, cocoa/CI, 200 bps) are illustrative only.

### 7.6 Framework alignment

- **Equator Principles 4 (2020)** — implements the real A/B/C categorisation logic (impact severity), the 10 EP principles as a checklist, Designated Country distinction, and Category-A independent-review/ESAP requirements.
- **IFC Performance Standards (2012)** — PS 1–8 applicability keyed to EP category, mirroring EP4's reliance on IFC PS for non-designated countries.
- **OECD Common Approaches (2016) / Arrangement + CRE 2023** — tiered environmental review (Tier A/B/C by sector and country risk) approximating the OECD Category A/B/C review depth; 0–7 country risk scale is the OECD's actual export-credit classification.
- **ICC Sustainable Trade Finance Principles (Pub. 908E, 2019)** — the 4 principles (Do No Harm, Promote Sustainability, Engage & Influence, Measure & Report) with per-principle requirement lists; scored only from caller input.
- **EUDR (EU 2023/1115)** — commodity-in-scope check against the regulation's 7 commodities, 31 Dec 2020 cut-off date, geolocation requirement flag.
- **UK Modern Slavery Act 2015 / AU MSA 2018, EU Conflict Minerals Reg. 2017/821, RBA CoC v9.0, OECD DD Guidance** — represented as categorical risk flags and the RBA alignment score; the engine approximates these as screening heuristics rather than full due-diligence workflows.

## 9 · Future Evolution

### 9.1 Evolution A — Live covenant tracking and evidence-backed screening (analytics ladder: rung 2 → 3)

**What.** The E75 engine exposes five deterministic assessments: EP4 compliance (A/B/C category,
IFC PS mapping, ESAP requirements), ECA green classification (OECD Common Approaches tier, country
risk 0–7), ESG-linked margin (`±15 bps` clamp on KPI performance), supply-chain ESG screening
(modern-slavery/deforestation/conflict-minerals, `rba_score = 100 − country_risk×8 + 5·certs`), and
report generation populated *only with caller-supplied metrics* (a stated honesty property). Two
Postgres tables exist (`trade_finance_assessments`, `trade_finance_esg_covenants`) but the margin
KPIs and screening signals are per-request inputs. Evolution A activates persistence and evidence.

**How.** (1) Activate covenant lifecycle tracking: persist ESG-linked margin structures to
`trade_finance_esg_covenants`, ingest periodic KPI observations, and recompute the margin
adjustment each period — turning a one-shot calculator into the covenant-monitoring workflow a
trade-finance desk runs. (2) Feed the supply-chain screen from platform evidence — the
`supply_chain_workflow` EUDR scores, `gdelt_controversy` for modern-slavery signals, GFW
deforestation exposure — rather than caller-asserted risk flags. (3) Track the UK/Australian MSA
applicability rules (currently threshold booleans) against stored entity turnover. (4) Bench-pin
the EP4 categorisation, margin clamp, and RBA score.

**Prerequisites.** Covenant/assessment write paths exercised (tables exist, D1); evidence-module
linkages. **Acceptance:** a stored covenant recomputes its margin on new KPI data with history;
screening components cite evidence sources where available; EP4/margin/RBA bench-pinned.

### 9.2 Evolution B — Trade-finance ESG structuring copilot (LLM tier 2)

**What.** A copilot for trade-finance originators: "categorise this project under EP4, classify it
for ECA green cover, and propose an ESG-linked margin grid" — calling the five POST assessments and
narrating the category, tier, and bps adjustment with their rubric citations, then generating the
ICC STF report shell.

**How.** Five POST endpoints plus seven `ref/*` registries (EP4 categories, ECA country-risk
ratings with the OECD 0–7 scale and source, high-risk sectors, commodity supply-chain risks) that
ground every threshold — the copilot cites the OECD/ICC/IFC basis per verdict. The `±15 bps` margin
mechanics and KPI scores make "what margin if we hit 2 of 3 SPTs?" a stateless re-run. The
report generator's caller-metrics-only property is the copilot's contract: shells are populated
from tool payloads, never LLM-estimated. Node for a trade-finance desk, chaining with
`supply_chain_workflow` and `sl_finance`.

**Prerequisites.** None hard — the engine is deterministic and honest; covenant-history answers
need Evolution A's persistence. **Acceptance:** every category, tier, and bps figure traces to a
tool response; rubric citations come from the ref endpoints; the copilot distinguishes
caller-declared from evidence-backed screening inputs and refuses to present the EP4 category as
lender legal sign-off.