# Api::Ead
**Module ID:** `api::ead` · **Route:** `/api/v1/ead` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/ead/calculate` | `calculate_ead` | api/v1/routes/ead.py |
| POST | `/api/v1/ead/calculate-batch` | `calculate_ead_batch` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/ccf-matrix` | `get_ccf_matrix` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/ccf/{asset_class}/{facility_type}` | `get_specific_ccf` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/climate-stress` | `get_climate_stress_factors` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/facility-types` | `list_facility_types` | api/v1/routes/ead.py |
| GET | `/api/v1/ead/asset-classes` | `list_asset_classes` | api/v1/routes/ead.py |

### 2.3 Engine `ead_calculator` (services/ead_calculator.py)
| Function | Args | Purpose |
|---|---|---|
| `_build_regulatory_ccf` |  | Build nested dict from flat CCF_TABLE for easy lookups. |
| `get_ccf` | asset_class, facility_type | Utility: look up the CCF for a given asset class and facility type. |
| `get_maturity_adjustment` | pd, maturity | Basel III Art. 153(1) / Art. 162 full maturity adjustment. |
| `EADCalculator.calculate` | outstanding_balance, total_commitment, facility_type, asset_class, remaining_maturity_years, sector | Calculate EAD for a single exposure. |
| `EADCalculator.calculate_from_input` | inp | Calculate EAD from a typed EADInput dataclass. |
| `EADCalculator.calculate_batch` | exposures, apply_climate_stress | Batch EAD calculation for a loan book. |
| `EADCalculator.calculate_batch_from_inputs` | inputs | Batch EAD calculation from a list of EADInput dataclasses. |
| `EADCalculator._get_ccf` | facility_type, asset_class, is_short_maturity | Look up CCF from the regulatory table. |
| `EADCalculator._get_guarantee_ccf` | facility_type, asset_class | Get CCF for guarantee/LC facilities. |
| `EADCalculator._calculate_saccr_addon` | notional, derivative_asset_class, maturity_years | Simplified SA-CCR add-on calculation. |
| `EADCalculator._calculate_maturity_adjustment` | remaining_maturity, asset_class | Simplified maturity adjustment (backward-compatible). |
| `EADCalculator._calculate_pd_maturity_adjustment` | remaining_maturity, asset_class, pd | Full Basel III Art. 153(1) / Art. 162 maturity adjustment. |
| `EADCalculator._get_climate_drawdown_stress` | sector | Get climate-driven drawdown stress percentage. |
| `EADCalculator.get_ccf_table` |  | Return the full CCF lookup table for API consumption. |
| `EADCalculator.get_supported_facility_types` |  | Return list of supported facility types. |
| `EADCalculator.get_supported_asset_classes` |  | Return list of supported asset classes. |
| `EADCalculator.get_climate_stress_factors` |  | Return climate drawdown stress factors by sector. |
| `EADCalculator.get_scenario_info` |  | Return current scenario configuration. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ead/asset-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_classes', 'descriptions'], 'n_keys': 2}`

**GET /api/v1/ead/ccf-matrix** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['ccf_table', 'facility_types', 'asset_classes', 'short_maturity_overrides'], 'n_keys': 4}`

**GET /api/v1/ead/ccf/{asset_class}/{facility_type}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['asset_class', 'facility_type', 'ccf', 'saccr_alpha', 'maturity_caps'], 'n_keys': 5}`

**GET /api/v1/ead/climate-stress** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['scenario', 'scenario_multiplier', 'available_scenarios', 'sector_stress_factors'], 'n_keys': 4}`

**GET /api/v1/ead/facility-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['facility_types', 'descriptions'], 'n_keys': 2}`

## 5 · Intermediate Transformation Logic

**Engine `ead_calculator` — extracted transformation lines:**
```python
MA    = (1 + (M - 2.5) * b) / (1 - 1.5 * b)
b = (0.11852 - 0.05478 * math.log(pd_safe)) ** 2
denominator = 1.0 - 1.5 * b
ma = (1.0 + (m_eff - 2.5) * b) / denominator
b  = (0.11852 - 0.05478 * ln(PD))^2
MA = (1 + (M-2.5)*b) / (1 - 1.5*b)
undrawn_amount = max(total_commitment - outstanding_balance, 0.0)
undrawn_commitment_ead = undrawn_amount * ccf
guarantee_exposure = guarantee_amount * guarantee_ccf
climate_ead_uplift = undrawn_amount * climate_stress_pct
ead_post_climate = ead_pre_climate + climate_ead_uplift
off_bal = reg_ead - result.outstanding_balance * result.maturity_adjustment_factor
addon = SACCR_ALPHA * factor * notional * maturity_factor
MA     = (1 + (M - 2.5) * b) / (1 - 1.5 * b)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).