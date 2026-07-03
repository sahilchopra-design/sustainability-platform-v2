# Api::Factor_Overlays
**Module ID:** `api::factor_overlays` · **Route:** `/api/v1/factor-overlays` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/factor-overlays/ecl-credit` | `ecl_credit` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/alm-treasury` | `alm_treasury` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/regulatory-compliance` | `regulatory_compliance` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/insurance-uw` | `insurance_uw` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/insurance-actuarial` | `insurance_actuarial` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/portfolio-management` | `portfolio_management` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/risk-management` | `risk_management` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/pe-deal` | `pe_deal` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/real-estate-valuation` | `real_estate_valuation` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/energy-strategy` | `energy_strategy` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/agriculture-finance` | `agriculture_finance` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/trade-advisory` | `trade_advisory` | api/v1/routes/factor_overlays.py |
| POST | `/api/v1/factor-overlays/factor-summary` | `factor_summary` | api/v1/routes/factor_overlays.py |
| GET | `/api/v1/factor-overlays/available-overlays` | `available_overlays` | api/v1/routes/factor_overlays.py |
| GET | `/api/v1/factor-overlays/factor-registries` | `factor_registries` | api/v1/routes/factor_overlays.py |

### 2.3 Engine `factor_overlay_engine` (services/factor_overlay_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `FactorOverlayEngine._lookup` | registry, key, default |  |
| `FactorOverlayEngine.overlay_ecl_credit` | entity_id, country_code, sector_nace, base_pd, base_lgd, base_ead | Apply ESG transition risk PD uplift, sovereign risk pass-through, |
| `FactorOverlayEngine.overlay_alm_treasury` | entity_id, country_code, credit_quality, base_nim_bps, base_duration_gap, fx_exposure_pct | Apply green bond premium curve, FX-climate correlation, |
| `FactorOverlayEngine.overlay_regulatory_compliance` | entity_id, jurisdiction, current_gap_count, esrs_pillars, assurance_level, as_of_date | Apply automated gap closure, cross-jurisdiction complexity, |
| `FactorOverlayEngine.overlay_insurance_uw` | entity_id, country_code, biome, base_premium, base_loss_ratio, parametric_trigger | Apply biodiversity nat-cat amplifier, supply chain BI claims, |
| `FactorOverlayEngine.overlay_insurance_actuarial` | entity_id, country_code, air_quality_band, base_mortality_rate, migration_pattern, medical_tech | Apply air quality mortality factor, migration mortality adjustment, |
| `FactorOverlayEngine.overlay_portfolio_management` | entity_id, sector_nace, base_return_pct, base_alpha_pct, as_of_date | Apply ESG alpha decomposition, tariff impact, and AI adoption scoring. |
| `FactorOverlayEngine.overlay_risk_management` | entity_id, country_code, sector_nace, base_var_pct, base_cvar_pct, as_of_date | Apply climate VaR overlay, country concentration risk, |
| `FactorOverlayEngine.overlay_pe_deal` | entity_id, country_code, sector_nace, base_ev_ebitda, carbon_reduction_pct, as_of_date | Apply carbon reduction valuation uplift, political stability, |
| `FactorOverlayEngine.overlay_real_estate_valuation` | entity_id, country_code, certification, smart_building_tier, base_value, base_noi | Apply green premium, climate zone adjustment, and smart building |
| `FactorOverlayEngine.overlay_energy_strategy` | entity_id, country_code, base_generation_gwh, base_co2_intensity, h2_pathway, as_of_date | Apply methane abatement curve, energy independence factor, |
| `FactorOverlayEngine.overlay_agriculture_finance` | entity_id, country_code, certification, base_loan_value, precision_ag_level, as_of_date | Apply deforestation-free certification premium, food security |
| `FactorOverlayEngine.overlay_trade_advisory` | entity_id, country_code, sector_nace, base_trade_value, supply_chain_digital_level, as_of_date | Apply carbon border alignment, sanctions cascade, |
| `FactorOverlayEngine.get_factor_summary` | country_code, sector_nace | Return a high-level summary of all factor scores for a |
| `FactorOverlayEngine.get_available_overlays` |  | Return metadata for every overlay method. |
| `FactorOverlayEngine.get_factor_registries` |  | Return all factor registry metadata for data lineage tracing. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/factor-overlays/available-overlays** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 12, 'item0_keys': ['id', 'label', 'module', 'fi_type', 'lob']}`

**GET /api/v1/factor-overlays/factor-registries** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esg_registries', 'geopolitical_registries', 'technology_registries'], 'n_keys': 3}`

**POST /api/v1/factor-overlays/agriculture-finance** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/factor-overlays/alm-treasury** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/factor-overlays/ecl-credit** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `factor_overlay_engine` — extracted transformation lines:**
```python
pd_esg = base_pd * esg_mult
sov_adj = 1 + sov_risk / 1000
pd_adj = pd_esg * sov_adj
lgd_adj = base_lgd * (1 + auto_score * 0.15)
ecl_base = base_pd * base_lgd * base_ead
ecl_enhanced = pd_adj * lgd_adj * base_ead
composite = ecl_enhanced / ecl_base if ecl_base > 0 else 1.0
nim_esg = base_nim_bps + greenium
dur_adj = base_duration_gap * (1 + fx_corr * fx_exposure_pct)
nim_final = nim_esg + fintech_ero  # fintech_ero is negative
composite = nim_final / base_nim_bps if base_nim_bps else 1.0
closeable = int(current_gap_count * avg_closure)
remaining = current_gap_count - closeable
effort_adjusted = remaining * reg_mult
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).