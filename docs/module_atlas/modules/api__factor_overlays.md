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
| `FactorOverlayEngine.overlay_ecl_credit` | entity_id, country_code, sector_nace, base_pd, base_lgd, base_ead, scenario, as_of_date | Apply ESG transition risk PD uplift, sovereign risk pass-through, and automation disruption score to ECL components. Transformations: 1. ESG: PD_adj = PD_base × ESG_TRANSITION_PD_MULTIPLIER[sector] 2. Geo: PD_adj *= (1 + sovereign_risk / 1000) 3. Tech: LGD_adj = LGD × (1 + automation_disruption × 0.15) 4. ECL_enhanced = PD_adj × LGD_adj × EAD |
| `FactorOverlayEngine.overlay_alm_treasury` | entity_id, country_code, credit_quality, base_nim_bps, base_duration_gap, fx_exposure_pct, scenario, as_of_date | Apply green bond premium curve, FX-climate correlation, and fintech NIM disruption to ALM metrics. Transformations: 1. ESG: NIM_adj = NIM_base + green_bond_premium_bps 2. Geo: duration_adj = duration_gap × (1 + fx_climate_corr × fx_exposure) 3. Tech: NIM_adj -= fintech_nim_disruption |
| `FactorOverlayEngine.overlay_regulatory_compliance` | entity_id, jurisdiction, current_gap_count, esrs_pillars, assurance_level, as_of_date | Apply automated gap closure, cross-jurisdiction complexity, and AI assurance confidence to regulatory compliance metrics. Transformations: 1. ESG: closeable_gaps = sum(gap_closure_rate[pillar]) × current_gaps 2. Geo: effort_multiplier = regulatory_complexity[jurisdiction] 3. Tech: confidence = ai_assurance_confidence[level] |
| `FactorOverlayEngine.overlay_insurance_uw` | entity_id, country_code, biome, base_premium, base_loss_ratio, parametric_trigger, as_of_date | Apply biodiversity nat-cat amplifier, supply chain BI claims, and parametric pricing adjustment. Transformations: 1. ESG: loss_ratio_adj = loss_ratio × biodiversity_amplifier[biome] 2. Geo: BI_loading = sovereign_risk / 200 (supply chain disruption) 3. Tech: premium_adj = premium × (1 + parametric_adj / 100) |
| `FactorOverlayEngine.overlay_insurance_actuarial` | entity_id, country_code, air_quality_band, base_mortality_rate, migration_pattern, medical_tech, as_of_date | Apply air quality mortality factor, migration mortality adjustment, and medical advancement longevity factor. Transformations: 1. ESG: mortality_adj = base × air_quality_mortality[band] 2. Geo: mortality_adj *= migration_adjustment[pattern] 3. Tech: longevity_offset = medical_advancement[tech] (years) |
| `FactorOverlayEngine.overlay_portfolio_management` | entity_id, sector_nace, base_return_pct, base_alpha_pct, as_of_date | Apply ESG alpha decomposition, tariff impact, and AI adoption scoring. Transformations: 1. ESG: alpha_esg = base_alpha × (E+S+G decomposition factors) 2. Geo: tariff_drag = sovereign_risk × 0.001 3. Tech: ai_boost = ai_adoption_score × 0.02 (2% max) |
| `FactorOverlayEngine.overlay_risk_management` | entity_id, country_code, sector_nace, base_var_pct, base_cvar_pct, as_of_date | Apply climate VaR overlay, country concentration risk, and stranded asset filter. Transformations: 1. ESG: VaR_climate = VaR × esg_transition_mult[sector] 2. Geo: VaR_geo = VaR_climate × (1 + sov_risk / 500) 3. Tech: stranded_flag = stranded_asset_tech_filter check |
| `FactorOverlayEngine.overlay_pe_deal` | entity_id, country_code, sector_nace, base_ev_ebitda, carbon_reduction_pct, as_of_date | Apply carbon reduction valuation uplift, political stability, and digital readiness to deal scoring. Transformations: 1. ESG: EV/EBITDA += carbon_reduction_valuation_uplift[band] 2. Geo: political_discount = (stability_index - 30) × 0.02 if > 30 3. Tech: digital_premium = digital_readiness × 0.01 |
| `FactorOverlayEngine.overlay_real_estate_valuation` | entity_id, country_code, certification, smart_building_tier, base_value, base_noi, as_of_date | Apply green premium, climate zone adjustment, and smart building score to property valuation. Transformations: 1. ESG: value_adj = value × (1 + green_premium_pct / 100) 2. Geo: climate_zone_adj = (100 - sov_risk) / 100 (proxy for resilience) 3. Tech: smart_uplift = smart_building_uplift[tier] / 100 |
| `FactorOverlayEngine.overlay_energy_strategy` | entity_id, country_code, base_generation_gwh, base_co2_intensity, h2_pathway, as_of_date | Apply methane abatement curve, energy independence factor, and H2 blending economics. Transformations: 1. ESG: abatement_potential = weighted sum of abatement techs 2. Geo: independence = energy_independence[country] / 100 3. Tech: h2_premium = h2_blending_economics[pathway] |
| `FactorOverlayEngine.overlay_agriculture_finance` | entity_id, country_code, certification, base_loan_value, precision_ag_level, as_of_date | Apply deforestation-free certification premium, food security index, and precision agriculture adoption uplift. Transformations: 1. ESG: cert_premium = deforestation_free_premium[cert] / 100 2. Geo: food_risk = food_security_index[country] / 100 3. Tech: yield_uplift = precision_ag_adoption[level] / 100 |
| `FactorOverlayEngine.overlay_trade_advisory` | entity_id, country_code, sector_nace, base_trade_value, supply_chain_digital_level, as_of_date | Apply carbon border alignment, sanctions cascade, and supply chain digitisation to trade risk. Transformations: 1. ESG: cbam_exposure = (1 - carbon_border_alignment[country]) × transition_mult 2. Geo: sanctions_prob = sanctions_cascade[country][sector] or 0 3. Tech: digital_efficiency = supply_chain_digitisation[level] |
| `FactorOverlayEngine.get_factor_summary` | country_code, sector_nace | Return a high-level summary of all factor scores for a country/sector combination without applying to specific metrics. |
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

**POST /api/v1/factor-overlays/energy-strategy** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/factor-overlays/factor-summary** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/factor-overlays/insurance-actuarial** — status `skipped`, provenance ['computed'], source tables: —
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
composite_adjustment=remaining / current_gap_count if current_gap_count else 1.0,
lr_adj = base_loss_ratio * bio_amp
bi_loading = sov / 200
lr_with_bi = lr_adj + bi_loading
premium_adj = base_premium * (1 + param_adj / 100)
composite_adjustment=premium_adj / base_premium if base_premium else 1.0,
mort_esg = base_mortality_rate * aq_mult
mort_adj = mort_esg * mig_adj
composite_adjustment=mort_adj / base_mortality_rate if base_mortality_rate else 1.0,
total_esg_alpha = base_alpha_pct * (e_pct + s_pct + g_pct)
residual_alpha = base_alpha_pct - total_esg_alpha
tariff_drag = 0.0  # placeholder; real version uses holding-level country weights
ai_boost = ai_score * 0.02  # max 2% return boost for full AI adoption
return_adj = base_return_pct + ai_boost - tariff_drag
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded solely in
`backend/services/factor_overlay_engine.py` and `backend/api/v1/routes/factor_overlays.py`.)*

### 7.1 What the domain computes

`FactorOverlayEngine` is a **cross-cutting adjustment layer**: it takes base metrics produced by
other platform modules (PD/LGD/EAD, NIM, loss ratio, mortality, EV/EBITDA, property value, CO₂
intensity, trade value, …) and applies three factor families — **ESG, geopolitical, technology**
— returning `enhanced_metrics` plus a per-factor decomposition, an audit trail of formula strings,
a composite adjustment ratio, and a confidence score. Twelve overlay methods exist (one per
FI-type × line-of-business cell); the API surfaces the registry lookups
(`GET /available-overlays`, `GET /factor-registries`, `POST /factor-summary`) and POST endpoints
for the ECL-credit, ALM-treasury, insurance-actuarial, energy-strategy and agriculture-finance
overlays (the other overlays are engine-only).

Representative transformations (quoted from code docstrings):

```
ECL credit:      PD_adj = PD × ESG_mult[sector] × (1 + sov_risk/1000)
                 LGD_adj = LGD × (1 + automation_disruption × 0.15)
                 ECL_enhanced = PD_adj × LGD_adj × EAD
ALM treasury:    NIM_adj = NIM + greenium_bps[rating] + fintech_erosion_bps
                 duration_adj = gap × (1 + fx_climate_corr × fx_exposure)
Insurance act.:  mortality_adj = base × air_quality_mult × migration_mult; longevity += medical_years
Energy strategy: CO2_adj = intensity × (1 − Σ abatement_potential) × (1 − H2_co2_reduction)
Agri finance:    value = loan × (1 + cert_premium%) × (1 − food_risk×0.1) × (1 + yield_uplift%)
```

### 7.2 Parameterisation — the factor registries

Thirty static registries, each tagged with a named source in `get_factor_registries()`:

| Registry (sample values) | Source label in code |
|---|---|
| `ESG_TRANSITION_PD_MULTIPLIER` — NACE D 1.40, B 1.35, H 1.22, C 1.18 … J 0.97 | PRI IPR 2024 + NGFS |
| `GREEN_BOND_PREMIUM_BPS` — AAA −3 → B −18, CCC −10 ("liquidity offsets greenium") | CBI State of the Market 2024 |
| `BIODIVERSITY_NATCAT_AMPLIFIER` — mangrove 1.35, wetland 1.30, coral reef 1.20 | IPBES 2024 + Swiss Re sigma |
| `SOVEREIGN_RISK_SCORES` — 45 countries, CH 8 … RU 72 (0–100) | WB WGI + OECD CRC + Maplecroft |
| `SANCTIONS_CASCADE` — RU mining 0.90, IR mining 0.95, KP 0.99 (secondary-sanction prob.) | OFAC/EU 2024 |
| `AUTOMATION_DISRUPTION` — manufacturing 0.62, transport 0.58, arts 0.15 (0–1) | McKinsey MGI 2024 |
| `AIR_QUALITY_MORTALITY` — WHO PM2.5 bands, <5 µg/m³ ×1.00 → >50 µg/m³ ×1.20 | WHO AQG 2021 + Lancet |
| `GREEN_PREMIUM_PCT` — LEED Platinum +12%, EPC C 0%, EPC G −12% | JLL/CBRE 2024 |
| `METHANE_ABATEMENT_CURVE` — 8 techs, cost −5 to +25 $/tCO₂e, potentials 5–20% | IEA Global Methane Tracker |
| `H2_BLENDING_ECONOMICS` — green +45 $/MWh / 95% CO₂ cut / TRL 0.65; grey 0/0/1.0 | (uncited) |
| `REGULATORY_COMPLEXITY` — EU 1.35, GB 1.20, US 1.15, other 1.00 | multi-regulator |
| `STRANDED_ASSET_TECH_FILTER` — coal 0.85 prob/8 yr … aviation 0.35/25 yr | IEA WEO 2024 |

All values are **hand-calibrated point estimates** inspired by the named publications, not live
feeds — treat them as plausibility-anchored synthetic constants. Hardcoded scaling constants
inside the overlays: sovereign→PD `/1000`, sovereign→VaR `/500`, BI loading `sov/200`,
automation→LGD `×0.15`, AI→return `×0.02` cap, food-insecurity discount cap 10%, sanctions
value-at-risk cap 50%, digitisation efficiency `×0.05`.

### 7.3 Calculation walkthrough

Every overlay follows the same 5-step pattern: (1) ESG registry lookup → adjust metric,
(2) geopolitical lookup → second adjustment, (3) technology lookup → third adjustment,
(4) compose `composite_adjustment = enhanced/base`, (5) emit `FactorScore` triple (factor name,
raw value, delta, unit, source, per-factor confidence 0.55–0.85) plus human-readable audit lines
like `"ESG: PD 0.0200 × 1.40 = 0.0280"`. Warnings fire on threshold breaches (sov risk > 60,
ESG mult > 1.25, stranding > 0.5, food insecurity > 55, sanctions prob > 0.3). `_lookup` falls
back to a registry's `"other"` key or a stated default when a country is missing.

### 7.4 Worked example — ECL credit overlay (`POST /ecl-credit`)

German electricity utility: `base_pd = 2.0%`, `base_lgd = 45%`, `EAD = €100M`, country `DE`,
NACE `D`.

| Step | Computation | Result |
|---|---|---|
| ESG PD uplift | 0.020 × 1.40 (sector D) | 0.0280 |
| Sovereign pass-through | 0.0280 × (1 + 15/1000) | 0.02842 |
| Automation LGD stress | 0.45 × (1 + 0.40 × 0.15) | 0.4770 |
| ECL base | 0.020 × 0.45 × 100M | €900,000 |
| ECL enhanced | 0.02842 × 0.4770 × 100M | **€1,355,634** |
| Composite adjustment | 1,355,634 / 900,000 | **1.506** |

Warning emitted: "High transition risk sector (D, mult=1.4)". Confidence reported: 0.80.

### 7.5 The overlay catalogue

| Overlay id | Adjusts | ESG / Geo / Tech levers |
|---|---|---|
| ecl_credit | PD, LGD, ECL | transition mult / sovereign risk / automation |
| alm_treasury | NIM bps, duration gap | greenium / FX-climate corr / fintech NIM erosion (retail hardcoded) |
| regulatory_compliance | gap counts | CSRD pillar auto-closure rates / jurisdiction complexity / AI assurance |
| insurance_uw | premium, loss ratio | biome nat-cat amplifier / BI loading sov/200 / parametric pricing −6…−15% |
| insurance_actuarial | mortality, longevity | PM2.5 band / migration / medical-tech years |
| portfolio_management | return, alpha | E+S+G alpha split / tariff drag (placeholder 0.0) / AI boost ≤2% |
| risk_management | VaR, CVaR | transition mult / 1+sov/500 / stranded-asset max-prob flag |
| pe_deal | EV/EBITDA | carbon-reduction band +0…+1.5x / (stability−30)×0.02 discount / digital×0.01 premium |
| real_estate_valuation | value, NOI | green premium % / (100−sov)/100 resilience / smart-tier % |
| energy_strategy | CO₂ intensity | full methane curve (Σ potential 87%) / energy independence / H₂ pathway |
| agriculture_finance | loan value | deforestation-free cert / food-security discount / precision-ag yield |
| trade_advisory | trade value | CBAM exposure (1−CBA)×(mult−1) / sanctions ×0.5 VaR / digitisation gain |

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG — fully deterministic — but **every registry is a synthetic calibration**
  labelled with an aspirational source (e.g. "MSCI 2024", "BIS 2024"); none is programmatically
  ingested from those sources. Confidence scores (0.55–0.85) are themselves hand-assigned.
- Known placeholders admitted in code: PM tariff drag fixed at 0.0 ("real version uses
  holding-level country weights"); ALM fintech erosion always uses the `retail_banking` −8 bps
  regardless of the institution's actual mix; RE "climate zone adjustment" proxies resilience with
  *sovereign* risk, so a Swiss property is multiplied by 0.92 — a systematic value **haircut**
  even for top-rated countries.
- Energy-strategy abatement applies the **entire** methane curve (Σ potential = 0.87) to total
  CO₂ intensity, i.e. assumes all 8 technologies deploy simultaneously and that methane measures
  abate 87% of all-gas intensity — an upper bound, not a projection.
- Scaling divisors (1000/500/200) have no cited derivation; sensitivity to them is untested.
- Single-period, linear, independent factors: no interaction terms, no scenario dependence
  (the `scenario` parameter is accepted but unused in the math).

### 7.7 Framework alignment

- **NGFS scenarios / PRI Inevitable Policy Response** — the sector transition-PD multipliers
  follow the IPR logic that policy response is inevitable but uneven by sector; NGFS-style
  multiplier-on-PD is the same first-order design used in the platform's ECL engine.
- **World Bank WGI / OECD CRC / Fragile States Index** — sovereign and political-stability
  scores emulate these indices' 0–100 composites (WGI aggregates six governance dimensions;
  FSI aggregates 12 conflict-risk indicators).
- **WHO Global Air Quality Guidelines (2021)** — mortality multipliers keyed to the WHO PM2.5
  interim-target bands; WHO derives these from integrated exposure-response functions linking
  PM2.5 concentration to all-cause mortality relative risk.
- **EU CBAM** — carbon-border alignment scores approximate exposure to Regulation 2023/956
  by exporter region; exposure = (1 − alignment) × sector transition intensity.
- **CSRD/ESRS** — gap-closure rates are organised by the real ESRS pillar taxonomy (E1–E5,
  S1–S4, G1) used by the platform's CSRD auto-populate module.
- **CBI greenium research, JLL/CBRE green-premium studies, IEA Methane Tracker, IMD Digital
  Competitiveness** — each anchors one registry; values are directionally consistent with the
  published literature but are point estimates chosen by the platform.

## 9 · Future Evolution

### 9.1 Evolution A — Registry calibration and the tariff-drag placeholder (analytics ladder: rung 2 → 3)

**What.** The engine's 12 overlay methods already sweep ESG/geo/tech scenarios over base
metrics, but all 30 factor registries are static dictionaries with source *labels* (PRI
IPR 2024, CBI State of the Market 2024) rather than calibrated values, and §5 documents
`tariff_drag = 0.0  # placeholder; real version uses holding-level country weights` in
`overlay_portfolio_management`. Evolution A calibrates the highest-impact registries
against ingested data and closes the placeholder.

**How.** (1) Replace the hardcoded `GREEN_BOND_PREMIUM_BPS` curve with a greenium fit
from the platform's ingested market data (yfinance/EDGAR tables already serve
`financial_data`); recalibrate `ESG_TRANSITION_PD_MULTIPLIER` against NGFS scenario
outputs the platform already extracts. (2) Implement tariff_drag from actual
holding-level country weights passed in the request, wired to the sovereign-risk
registry it already consults. (3) Pin each calibrated overlay in `bench_quant` with a
reference case, and stamp registry version + calibration date in every response's
existing audit-trail block.

**Prerequisites.** Registry provenance table (registry → source dataset → refresh date)
replacing string labels; agreement on which of the 12 overlays are tier-A (only 5 are
exposed via POST endpoints today — the rest are engine-only). **Acceptance:**
`GET /factor-registries` returns calibration metadata per registry; the
portfolio-management overlay produces nonzero, country-weight-dependent tariff drag;
bench_quant pins pass for ECL-credit and ALM-treasury overlays.

### 9.2 Evolution B — Overlay-aware adjustment explainer (LLM tier 1 → 2)

**What.** A copilot on the factor-overlays page that explains any adjustment
decomposition — "why did ECL rise 22%?" — by citing the per-factor breakdown and formula
strings the engine already returns in its audit trail, then executes what-ifs ("re-run
insurance-uw with tropical biome", "assume full AI adoption") as tool calls against the
13 POST endpoints.

**How.** The engine is unusually copilot-ready: every response already carries an audit
trail of formula strings and a per-factor decomposition, so tier 1 is pure narration of
existing payload fields — no new backend. Tier 2 derives tool schemas from the module's
OpenAPI operations (all read-only POSTs with typed Pydantic inputs);
`GET /available-overlays` and `/factor-registries` become the grounding corpus alongside
this Atlas page's §5 extracted transformations. The no-fabrication validator checks
answer numerics against tool outputs per the roadmap's tier-2 contract.

**Prerequisites.** None hard for tier 1 (payloads are self-describing); for tier 2, the
seven engine-only overlays (risk-management, pe-deal, real-estate-valuation, etc.) need
route exposure before the copilot can invoke them — otherwise it must refuse.
**Acceptance:** every numeric in a copilot answer traces to an overlay response in the
same conversation; asking for an overlay without a route (e.g. trade-advisory variants
not exposed) produces an explicit refusal naming the gap.