# Api::Eiopa_Stress
**Module ID:** `api::eiopa_stress` · **Route:** `/api/v1/eiopa-stress` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/eiopa-stress/assess/scenario` | `assess_single_scenario` | api/v1/routes/eiopa_stress.py |
| GET | `/api/v1/eiopa-stress/ref/scenarios` | `ref_scenarios` | api/v1/routes/eiopa_stress.py |
| GET | `/api/v1/eiopa-stress/ref/frameworks` | `ref_frameworks` | api/v1/routes/eiopa_stress.py |

### 2.3 Engine `eiopa_stress_engine` (services/eiopa_stress_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_scr_corr` | a, b | Symmetric lookup into the Solvency II SCR correlation matrix. |
| `_aggregate_bscr` | module_scr | Basic SCR via the Solvency II correlation-matrix square-root formula: |
| `EiopaStressEngine.assess` | insurer, scenarios, assessment_date | Run full EIOPA climate stress test for one insurer. |
| `EiopaStressEngine._run_scenario` | ins, sc_id, sc, invested_assets |  |
| `EiopaStressEngine._calc_asset_shock` | ins, sc, invested | Compute EUR loss for each asset class under the scenario shocks. |
| `EiopaStressEngine._calc_underwriting_shock` | ins, sc | Compute liability-side shocks for underwriting and life modules. |
| `EiopaStressEngine._calc_capital_impact` | ins, asset_shock, uw_shock, sc_id | Recalculate SCR/MCR and solvency ratio post-stress. |
| `EiopaStressEngine._assess_orsa_checklist` | ins |  |
| `EiopaStressEngine._severity_label` | loss_pct_of_of, scr_breach, mcr_breach |  |
| `EiopaStressEngine._key_drivers` | ins, asset, uw |  |
| `EiopaStressEngine._build_narrative` | ins, sc, asset, uw, cap, severity |  |
| `EiopaStressEngine._derive_gaps` | ins, results, orsa, any_scr, any_mcr |  |
| `EiopaStressEngine._derive_resilience` | worst_ratio, any_scr, any_mcr, orsa_pct |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/eiopa-stress/ref/frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'reference'], 'n_keys': 2}`

**GET /api/v1/eiopa-stress/ref/insurer-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'insurer_types'], 'n_keys': 2}`

**GET /api/v1/eiopa-stress/ref/orsa-checklist** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'checklist', 'reference'], 'n_keys': 3}`

**GET /api/v1/eiopa-stress/ref/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'scenarios', 'reference'], 'n_keys': 3}`

**POST /api/v1/eiopa-stress/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `eiopa_stress_engine` — extracted transformation lines:**
```python
invested_assets = insurer.total_assets_eur - insurer.total_tp_eur
invested_assets = insurer.total_assets_eur * 0.85  # fallback heuristic
default=insurer.eligible_own_funds_eur / max(insurer.scr_eur, 1) * 100,
total_loss = asset_shock.total_asset_loss_eur + uw_shock.total_uw_shock_eur
mgmt_capacity_eur = total_loss * mgmt_capacity_rate
equity_base_pct = ins.equity_listed_pct / 100
fossil_subset_pct = min(ins.equity_fossil_fuel_pct, ins.equity_listed_pct) / 100
non_fossil_equity_pct = equity_base_pct - fossil_subset_pct
equity_loss = invested * (
re_loss = re_c_loss + re_r_loss
sov_loss = invested * ins.sovereign_bonds_pct / 100 * (
ig_loss = invested * ins.ig_corp_bonds_pct / 100 * (
hy_loss = invested * ins.hy_corp_bonds_pct / 100 * (
total = equity_loss + re_loss + sov_loss + ig_loss + hy_loss + infra_loss + alt_loss
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).