# Api::Eu_Taxonomy_Gar
**Module ID:** `api::eu_taxonomy_gar` · **Route:** `/api/v1/eu-taxonomy-gar` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eu-taxonomy-gar/calculate-gar` | `calculate_gar` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/assess-dnsh` | `assess_dnsh` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/assess-min-safeguards` | `assess_min_safeguards` | api/v1/routes/eu_taxonomy_gar.py |
| POST | `/api/v1/eu-taxonomy-gar/calculate-gar/batch` | `calculate_gar_batch` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/asset-classes` | `ref_asset_classes` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/dnsh-objectives` | `ref_dnsh_objectives` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/min-safeguards` | `ref_min_safeguards` | api/v1/routes/eu_taxonomy_gar.py |
| GET | `/api/v1/eu-taxonomy-gar/ref/gar-phases` | `ref_gar_phases` | api/v1/routes/eu_taxonomy_gar.py |

### 2.3 Engine `eu_taxonomy_gar_engine` (services/eu_taxonomy_gar_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `DNSHAssessment.dict` |  |  |
| `MinSafeguardsAssessment.dict` |  |  |
| `GARResult.dict` |  |  |
| `EUTaxonomyGAREngine.assess_dnsh` | assets | Assess DNSH compliance for each asset. |
| `EUTaxonomyGAREngine.assess_min_safeguards` | entity_id, entity_name, ungc, oecd, ungp, ilo | Assess Minimum Safeguards compliance. |
| `EUTaxonomyGAREngine.calculate_gar` | entity_id, entity_name, reporting_year, assets | Calculate GAR, BTAR, and taxonomy alignment metrics. |
| `EUTaxonomyGAREngine.get_asset_classes` |  |  |
| `EUTaxonomyGAREngine.get_dnsh_objectives` |  |  |
| `EUTaxonomyGAREngine.get_min_safeguards` |  |  |
| `EUTaxonomyGAREngine.get_gar_phases` |  |  |
| `EUTaxonomyGAREngine.get_cross_framework` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eu-taxonomy-gar/ref/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['financial_corporations_eq', 'financial_corporations_debt', 'non_financial_corporations_eq', 'non_financial_corporations_debt', 'project_finance', 'mortgages', 'auto_loans', 'home_renovation_l`

**GET /api/v1/eu-taxonomy-gar/ref/cross-framework** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['csrd_esrs_e1', 'eu_gbs', 'sfdr_pai', 'mifid_spt', 'cbi'], 'n_keys': 5}`

**GET /api/v1/eu-taxonomy-gar/ref/dnsh-objectives** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['CCM', 'CCA', 'WMR', 'CE', 'PPE', 'BIO'], 'n_keys': 6}`

**GET /api/v1/eu-taxonomy-gar/ref/gar-phases** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['phase_1', 'phase_2'], 'n_keys': 2}`

**GET /api/v1/eu-taxonomy-gar/ref/min-safeguards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ungc', 'oecd_mne', 'ungp', 'ilo_core', 'udhr'], 'n_keys': 5}`

## 5 · Intermediate Transformation Logic

**Engine `eu_taxonomy_gar_engine` — extracted transformation lines:**
```python
eligible_contribution = asset.total_exposure * asset.taxonomy_eligible_pct / 100
contribution = asset.total_exposure * asset.taxonomy_aligned_pct / 100
gar_pct = (gar_numerator / total_covered_assets * 100) if total_covered_assets > 0 else 0.0
btar_pct = (btar_numerator / btar_covered_assets * 100) if btar_covered_assets > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).