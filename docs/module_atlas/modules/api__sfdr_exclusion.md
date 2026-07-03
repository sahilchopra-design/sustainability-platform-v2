# Api::Sfdr_Exclusion
**Module ID:** `api::sfdr_exclusion` · **Route:** `/api/v1/sfdr-compliance` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sfdr-compliance/periodic-report` | `generate_periodic_report` | api/v1/routes/sfdr_exclusion.py |
| POST | `/api/v1/sfdr-compliance/screen` | `screen_holdings` | api/v1/routes/sfdr_exclusion.py |
| GET | `/api/v1/sfdr-compliance/exclusion-rules` | `get_exclusion_rules` | api/v1/routes/sfdr_exclusion.py |
| GET | `/api/v1/sfdr-compliance/pai-reference` | `get_pai_reference` | api/v1/routes/sfdr_exclusion.py |

### 2.3 Engine `exclusion_list_engine` (services/exclusion_list_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ExclusionListEngine.screen_fund` | fund_id, fund_name, sfdr_classification, holdings | Screen all holdings against applicable exclusion rules. |
| `ExclusionListEngine.get_rules` | sfdr_classification | Return all applicable rules for a given SFDR classification. |
| `ExclusionListEngine._get_applicable_rules` | sfdr | Filter default + custom rules by SFDR classification. |
| `ExclusionListEngine._screen_holding` | h, rules, sfdr | Screen a single holding against all applicable rules. |
| `ExclusionListEngine._check_standard_rule` | h, category, rule | Check a single standard exclusion rule. |

### 2.3 Engine `sfdr_report_generator` (services/sfdr_report_generator.py)
| Function | Args | Purpose |
|---|---|---|
| `SFDRReportGenerator.generate` | fund | Generate complete SFDR periodic report data. |
| `SFDRReportGenerator._calculate_proportions` | holdings | Calculate SFDR proportion of investments breakdown. |
| `SFDRReportGenerator._sector_breakdown` | holdings | Aggregate holdings by sector. |
| `SFDRReportGenerator._geography_breakdown` | holdings | Aggregate holdings by country. |
| `SFDRReportGenerator._pai_summary` | current, prior | Generate PAI summary rows with YoY comparison. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sfdr-compliance/exclusion-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sfdr_classification', 'rules'], 'n_keys': 2}`

**GET /api/v1/sfdr-compliance/pai-reference** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pai_indicators', 'art8_report_sections', 'art9_report_sections'], 'n_keys': 3}`

**POST /api/v1/sfdr-compliance/periodic-report** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sfdr-compliance/screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sfdr_report_generator` — extracted transformation lines:**
```python
waci = sum(h.weight_pct / 100.0 * h.carbon_intensity for h in holdings)
avg_esg = sum(h.weight_pct / 100.0 * h.esg_score for h in holdings)
dnsh_pct = dnsh_wt / total_weight * 100 if total_weight > 0 else 0.0
tax_wt = sum(h.weight_pct * h.taxonomy_aligned_pct / 100.0 for h in holdings)
env_wt = sum(h.weight_pct * h.sustainable_environmental_pct / 100.0 for h in holdings)
soc_wt = sum(h.weight_pct * h.sustainable_social_pct / 100.0 for h in holdings)
tax_pct = tax_wt / total_weight * 100
env_pct = env_wt / total_weight * 100
soc_pct = soc_wt / total_weight * 100
not_sus = max(0, 100.0 - tax_pct - env_pct - soc_pct)
taxonomy_env_objective_1_pct=round(tax_pct * 0.6, 2),
taxonomy_env_objective_2_pct=round(tax_pct * 0.3, 2),
taxonomy_other_objectives_pct=round(tax_pct * 0.1, 2),
sus = h.taxonomy_aligned_pct + h.sustainable_environmental_pct + h.sustainable_social_pct
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).