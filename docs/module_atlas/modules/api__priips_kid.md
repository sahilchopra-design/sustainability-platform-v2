# Api::Priips_Kid
**Module ID:** `api::priips_kid` · **Route:** `/api/v1/priips-kid` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/priips-kid/generate-kid` | `generate_kid` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/calculate-scenarios` | `calculate_scenarios` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/esg-inserts` | `esg_inserts` | api/v1/routes/priips_kid.py |
| POST | `/api/v1/priips-kid/generate-kid/batch` | `generate_kid_batch` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/kid-sections` | `ref_kid_sections` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/esg-insert-types` | `ref_esg_insert_types` | api/v1/routes/priips_kid.py |
| GET | `/api/v1/priips-kid/ref/cross-framework` | `ref_cross_framework` | api/v1/routes/priips_kid.py |

### 2.3 Engine `priips_kid_engine` (services/priips_kid_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `SRIResult.to_dict` |  |  |
| `PerformanceScenario.to_dict` |  |  |
| `CostSummary.to_dict` |  |  |
| `ESGInsert.to_dict` |  |  |
| `PRIIPSKIDResult.to_dict` |  |  |
| `PRIIPSKIDEngine.generate_kid` | inp | Generate a full PRIIPs KID for a product. |
| `PRIIPSKIDEngine.assess_sri` | inp | Calculate the Summary Risk Indicator (SRI) per PRIIPs Annex II methodology. |
| `PRIIPSKIDEngine.calculate_scenarios` | inp | Generate 4 performance scenarios per PRIIPs RTS Annex IV revised methodology. |
| `PRIIPSKIDEngine.get_esg_inserts` | sfdr_classification, product_name | Return the ESGInsert list required for the given SFDR classification. |
| `PRIIPSKIDEngine.get_kid_sections` |  |  |
| `PRIIPSKIDEngine.get_sri_classes` |  |  |
| `PRIIPSKIDEngine.get_esg_insert_types` |  |  |
| `PRIIPSKIDEngine.get_cross_framework` |  |  |
| `PRIIPSKIDEngine.get_timeline` |  |  |
| `PRIIPSKIDEngine._calculate_costs` | inp |  |
| `PRIIPSKIDEngine._validate` | inp |  |
| `PRIIPSKIDEngine._build_warnings` | inp, sri |  |
| `PRIIPSKIDEngine._count_complete_sections` | inp, sri, costs |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `annual` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/priips-kid/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_overlap', 'eu_taxonomy', 'mifid_spt', 'uk_priips', 'ucits_kiid'], 'n_keys': 5}`

**GET /api/v1/priips-kid/ref/esg-insert-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sustainability_risk', 'pai_consideration', 'art8_esg_characteristics', 'art9_sustainable_investment', 'taxonomy_alignment'], 'n_keys': 5}`

**GET /api/v1/priips-kid/ref/kid-sections** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['section_1_product', 'section_2_risk', 'section_3_costs', 'section_4_holding_period', 'section_5_complaints', 'section_6_other_info'], 'n_keys': 6}`

**GET /api/v1/priips-kid/ref/sri-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': [1, 2, 3, 4, 5, 6, 7], 'n_keys': 7}`

**GET /api/v1/priips-kid/ref/timeline** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': ['date', 'event', 'article']}`

## 5 · Intermediate Transformation Logic

**Engine `priips_kid_engine` — extracted transformation lines:**
```python
kid_completeness_pct = (sections_complete / 6.0) * 100.0
final_sri = max(final_sri, credit_risk_class + 1)
expected_ret = inp.expected_annual_return_pct / 100.0
moderate_ann = expected_ret - 0.015
favourable_ann = expected_ret + 0.03
return_rhp_annualised_pct=stress_ann * 100.0,
return_rhp_annualised_pct=unfav_ann * 100.0,
return_rhp_annualised_pct=moderate_ann * 100.0,
return_rhp_annualised_pct=favourable_ann * 100.0,
r = inp.expected_annual_return_pct / 100.0
annuity_factor = (1.0 - math.pow(1.0 + r, -rhp)) / (r * rhp)
riy_pct = total_cost_pct * annuity_factor
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).