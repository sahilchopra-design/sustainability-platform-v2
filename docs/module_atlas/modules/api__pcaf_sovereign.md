# Api::Pcaf_Sovereign
**Module ID:** `api::pcaf_sovereign` · **Route:** `/api/v1/pcaf-sovereign` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/pcaf-sovereign/assess` | `assess_sovereign` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/portfolio` | `assess_portfolio` | api/v1/routes/pcaf_sovereign.py |
| POST | `/api/v1/pcaf-sovereign/attribution` | `attribution_calculation` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/country-profiles` | `ref_country_profiles` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/dqs-methodology` | `ref_dqs_methodology` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/ndc-alignment` | `ref_ndc_alignment` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/attribution-formula` | `ref_attribution_formula` | api/v1/routes/pcaf_sovereign.py |
| GET | `/api/v1/pcaf-sovereign/ref/pcaf-part-d` | `ref_pcaf_part_d` | api/v1/routes/pcaf_sovereign.py |

### 2.3 Engine `pcaf_sovereign_engine` (services/pcaf_sovereign_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `PCAFSovereignEngine.assess` | entity_id, entity_name, country_code, outstanding_amount_mn, use_lulucf_adjustment, current_trajectory_gap_pct, dqs_override | Full PCAF Part D sovereign assessment for a single country holding. Deterministic and reproducible. `current_trajectory_gap_pct` is the country's assessed emissions trajectory vs its NDC 2030 target (% deviation, positive = off track) from a real trajectory source (e.g. Climate Action Tracker / NGFS); when it is not supplied the NDC alignment is returned as ``insufficient_data`` rather than being  |
| `PCAFSovereignEngine.assess_portfolio` | entity_id, sovereign_holdings | Portfolio-level PCAF sovereign assessment with exposure-weighted aggregation. |
| `PCAFSovereignEngine.calculate_attribution` | outstanding_mn, government_debt_bn, ghg_inventory_tco2e | PCAF Part D attribution calculation (isolated). |
| `PCAFSovereignEngine._determine_dqs` | annex_status, dqs_override | PCAF Part D Data Quality Score — deterministic from the data source used. The engine sources every emissions figure from UNFCCC national inventories. Per PCAF Part D DQS, that maps to the country's reporting obligation: * Annex I parties (annex1/annex2) submit *annual* national GHG inventories → DQS 1. * Non-Annex I parties report via *biennial* update reports (BUR) → DQS 2. A caller who knows the |
| `PCAFSovereignEngine._assess_ndc_alignment` | ndc_target, current_trajectory_gap_pct | Classify NDC alignment from a *supplied* trajectory gap — never fabricated. `current_trajectory_gap_pct` is the country's assessed emissions trajectory vs its NDC 2030 target (% deviation; positive = off track) from a real trajectory source. Returns: * ("no_target", None) — country has no quantified NDC 2030 target; * ("insufficient_data", None) — target exists but no trajectory model was supplied |
| `PCAFSovereignEngine.ref_country_profiles` |  |  |
| `PCAFSovereignEngine.ref_dqs_methodology` |  |  |
| `PCAFSovereignEngine.ref_ndc_alignment` |  |  |
| `PCAFSovereignEngine.ref_attribution_formula` |  |  |
| `PCAFSovereignEngine.ref_pcaf_part_d` |  |  |
| `get_engine` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/pcaf-sovereign/ref/attribution-formula** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/country-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/dqs-methodology** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/ndc-alignment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**GET /api/v1/pcaf-sovereign/ref/pcaf-part-d** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'result'], 'n_keys': 2}`

**POST /api/v1/pcaf-sovereign/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-sovereign/attribution** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/pcaf-sovereign/portfolio** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `pcaf_sovereign_engine` — extracted transformation lines:**
```python
ghg_tco2e = ghg_mtco2e * 1_000_000.0
ghg_incl_lulucf = (ghg_mtco2e + lulucf_net) * 1_000_000.0
att_factor = (outstanding_amount_mn / 1000.0) / govt_debt_bn
attributed_with_lulucf = round(att_factor * ghg_incl_lulucf, 2)
wa_dqs = sum(r.dqs_score * r.outstanding_amount_mn for r in results) / total_exposure
wa_carbon_intensity = sum(r.portfolio_carbon_intensity_tco2e_per_gdp_mn * r.outstanding_amount_mn for r in results) / total_exposure
outstanding_bn = outstanding_mn / 1000.0
attribution_factor = outstanding_bn / government_debt_bn
attributed_tco2e = attribution_factor * ghg_inventory_tco2e
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The `pcaf_sovereign` domain (`/api/v1/pcaf-sovereign`) implements **PCAF Part D — Sovereign
Bonds and Loans (2023)**: GDP/debt-based attribution of national GHG inventories to sovereign
holdings. Engine: `pcaf_sovereign_engine.py`, with a 40-country reference dataset.

### 7.1 What the module computes

The core PCAF Part D attribution identity (`calculate_attribution`):

```
government_debt_bn = gdp_bn × government_debt_pct_gdp / 100
attribution_factor = (outstanding_mn / 1000) / government_debt_bn     # both in €/$ bn
attributed_emissions_tco2e = attribution_factor × (ghg_inventory_MtCO2e × 1e6)
```

Plus optional LULUCF adjustment, a deterministic Data Quality Score, NDC-alignment
classification, and exposure-weighted portfolio aggregation.

### 7.2 Parameterisation / scoring rubric

**Sovereign profiles** (`SOVEREIGN_COUNTRY_PROFILES`, 40 countries) carry GDP 2022, debt %/GDP,
GHG inventory MtCO₂e, LULUCF net, NDC target vs 2010, S&P rating, and Annex status. Sample:

| Country | GDP €bn | Debt %/GDP | GHG MtCO₂e | NDC vs 2010 | Annex |
|---|---|---|---|---|---|
| US | 25,464 | 122.5 | 5,801 | −50% | annex1 |
| Germany | 4,082 | 66.3 | 762 | −55% | annex2 |
| China | 17,963 | 51.5 | 13,000 | (intensity) | non_annex1 |
| India | 3,387 | 81.7 | 3,360 | (intensity) | non_annex1 |

**Provenance:** UNFCCC national inventories (2022), World Bank (GDP/debt), NDCI database — real
published figures encoded as constants.

**DQS** (`_determine_dqs`, PCAF Part D 1-4): deterministic from reporting obligation — Annex I
parties (annual inventories) → **DQS 1**; non-Annex I (biennial BUR) → **DQS 2**; a caller may
pass `dqs_override`. Never randomised.

**NDC alignment thresholds** (`_assess_ndc_alignment`): gap ≤5% → aligned; ≤20% → partial;
>20% → misaligned. Requires a **caller-supplied trajectory gap** — with none it returns
`"insufficient_data"` (never fabricated); no NDC target → `"no_target"`.

### 7.3 Calculation walkthrough

`assess(country, outstanding_mn, …)`: looks up the profile, derives `government_debt_bn`,
converts inventory to tCO₂e, calls `calculate_attribution`, optionally recomputes with
`(ghg + lulucf)` for the LULUCF variant, determines DQS from Annex status, classifies NDC
alignment from the supplied trajectory gap, and normalises: `attributed_per_mn_invested`,
`carbon_intensity = ghg_tco2e / gdp_bn`. `assess_portfolio` aggregates exposure-weighted DQS
and carbon intensity, an NDC-alignment distribution, and an Annex exposure breakdown.

### 7.4 Worked example

Holding: €200M of German sovereign bonds.

- **Debt:** `4,082 × 66.3 / 100 = €2,706.4 bn`.
- **Attribution:** `(200/1000) / 2706.4 = 0.2 / 2706.4 = 7.390×10⁻⁵`.
- **Inventory:** `762 MtCO₂e × 1e6 = 762,000,000 tCO₂e`.
- **Attributed:** `7.390×10⁻⁵ × 762,000,000 = 56,312 tCO₂e`.
- **DQS:** Germany annex2 → **DQS 1** (annual UNFCCC inventory).
- **Carbon intensity:** `762,000,000 / 4,082 = 186,673 tCO₂e/€bn GDP`.
- **NDC:** target −55% exists; without a supplied trajectory gap → **"insufficient_data"** (the
  engine refuses to invent alignment).

If instead a caller supplies `current_trajectory_gap_pct = 8`, the classification is
`partial` (5 < 8 ≤ 20).

### 7.5 Data provenance & limitations

- Country data is **real published reference data** (UNFCCC/World Bank/NDCI), not seeded random
  values — there is no `sr()` PRNG anywhere in this engine.
- NDC alignment is deliberately **honest-null** unless a real trajectory source (Climate Action
  Tracker / NGFS) supplies the gap; the engine does not fabricate a trajectory.
- LULUCF is excluded by default (PCAF-recommended) and only included on explicit request.
- Attribution assumes total central-government debt as the denominator; sub-sovereign/municipal
  exposures are explicitly out of scope (Part E).

**Framework alignment:** **PCAF Global GHG Accounting Standard Part D (2023) §3.2** — the
GDP/debt attribution formula and the ~1.0 sum-to-unity property across debt holders are
implemented verbatim, including the MtCO₂e→tCO₂e conversion and the recommended LULUCF-exclusion
default. **PCAF Part D DQS 1-4** maps to UNFCCC reporting cadence (Annex I annual vs non-Annex I
biennial). **NDC alignment** references each country's Paris NDC 2030 target vs 2010 baseline,
classified against a real emissions trajectory. **ND-GAIN** is cited for the adaptation context
in the country profiles.