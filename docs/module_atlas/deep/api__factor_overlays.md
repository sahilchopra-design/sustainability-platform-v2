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
