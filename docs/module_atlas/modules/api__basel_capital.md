# Api::Basel_Capital
**Module ID:** `api::basel_capital` · **Route:** `/api/v1/basel-capital` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/basel-capital/risk-weight-sa` | `risk_weight_sa` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/risk-weight-irb` | `risk_weight_irb` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-requirement` | `capital_requirement` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/liquidity` | `liquidity` | api/v1/routes/basel_capital.py |
| POST | `/api/v1/basel-capital/capital-adequacy` | `capital_adequacy` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/exposure-classes` | `ref_exposure_classes` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/sa-risk-weights` | `ref_sa_risk_weights` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/irb-parameters` | `ref_irb_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-requirements` | `ref_capital_requirements` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/capital-buffers` | `ref_capital_buffers` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/lcr-parameters` | `ref_lcr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/nsfr-parameters` | `ref_nsfr_parameters` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/climate-adjustments` | `ref_climate_adjustments` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/regulatory-frameworks` | `ref_regulatory_frameworks` | api/v1/routes/basel_capital.py |
| GET | `/api/v1/basel-capital/ref/operational-risk` | `ref_operational_risk` | api/v1/routes/basel_capital.py |

### 2.3 Engine `basel_capital_engine` (services/basel_capital_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_norm_cdf` | x | Standard normal cumulative distribution function using math.erf. |
| `_norm_inv` | p | Inverse standard normal CDF (quantile function). Uses the rational approximation by Peter Acklam (2003) which is accurate to approximately 1.15e-9 in the full range (0, 1). Reference: Abramowitz & Stegun, Handbook of Mathematical Functions, refined by P.J. Acklam. |
| `BaselCapitalEngine.calculate_sa_risk_weight` | exposure_class, credit_quality_step, secured_by_property | Return SA risk weight as decimal for a given exposure class and CQS. Parameters ---------- exposure_class : str One of the 13 CRR Art. 112 exposure class IDs. credit_quality_step : int 0 = unrated, 1-6 = external credit quality step (ECAI mapping). secured_by_property : str or None If the exposure is "secured_immovable_property", specify "residential" or "commercial" to select the appropriate weig |
| `BaselCapitalEngine.calculate_irb_risk_weight` | pd, lgd, maturity, exposure_class | Calculate IRB risk weight per CRR Article 153 (corporate formula). Implements: R = 0.12 * f(PD) + 0.24 * (1 - f(PD)) where f(PD) = (1 - e^{-50*PD}) / (1 - e^{-50}) b = (0.11852 - 0.05478 * ln(PD))^2 K = [LGD * N(sqrt(1/(1-R)) * G(PD) + sqrt(R/(1-R)) * G(0.999)) - PD * LGD] * (1 + (M - 2.5) * b) / (1 - 1.5 * b) RW = K * 12.5 Parameters ---------- pd : float Probability of Default, range (0, 1). lgd |
| `BaselCapitalEngine._irb_retail_rw` | pd, lgd, subclass | IRB risk weight for retail exposures (CRR Art 154), routed by sub-class: - residential_mortgage : R = 0.15 fixed (Art 154(3)) - qualifying_revolving / qrre : R = 0.04 fixed (Art 154(4)) - other_retail : R = 0.03·f(PD) + 0.16·(1-f(PD)), f uses the -35 exponent (Art 154(1)) No maturity adjustment applies to any retail sub-class. |
| `BaselCapitalEngine.calculate_operational_risk_rwa` | business_indicator, average_annual_losses | Calculate operational risk RWA using the Standardised Measurement Approach. Parameters ---------- business_indicator : float BIC = ILDC + SC + FC (EUR). average_annual_losses : float 10-year average annual operational losses (EUR). Returns ------- float Operational risk RWA (capital charge * 12.5). |
| `BaselCapitalEngine.calculate_capital_requirement` | entity_name, reporting_date, exposures, capital, approach, climate_adjusted, buffers, market_risk_rwa | Calculate full capital adequacy per CRR Article 92. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). exposures : list[dict] Each dict: counterparty_name, exposure_class, ead_eur, pd (0-1), lgd (0-1), maturity_years, credit_quality_step (0-6), sector (NACE letter), physical_risk_zone (optional: high_risk/medium_risk/low_risk), is_green (op |
| `BaselCapitalEngine.calculate_liquidity` | entity_name, reporting_date, assets, liabilities | Calculate LCR and NSFR per BCBS d295/d396. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). assets : dict Keys: level1_hqla, level2a_assets, level2b_assets, residential_mortgages, retail_loans, wholesale_loans, corporate_loans_lt1yr, corporate_loans_gt1yr, other_assets, sovereign_bonds_cqs2, fixed_assets, sme_loans. liabilities : dict Key |
| `BaselCapitalEngine.run_capital_adequacy` | entity_name, reporting_date, exposures, capital, assets, liabilities, approach, climate_scenarios | Run full capital adequacy assessment: credit + liquidity + climate stress. Parameters ---------- entity_name : str Legal entity name. reporting_date : str Reporting date (YYYY-MM-DD). exposures : list[dict] Credit exposures (see calculate_capital_requirement). capital : dict Capital components (see calculate_capital_requirement). assets : dict HQLA / asset composition (see calculate_liquidity). li |
| `BaselCapitalEngine._score_bcbs239` | exposures, capital, assets, liabilities | Score BCBS 239 compliance (0-100) based on data completeness. Principles assessed: 1. Governance (10 pts) — capital dict completeness 2. Data architecture (15 pts) — exposure field coverage 3. Accuracy (20 pts) — PD/LGD/CQS populated 4. Completeness (20 pts) — sector / maturity / physical risk coverage 5. Timeliness (10 pts) — assumed OK (static assessment) 6. Adaptability (10 pts) — climate field |
| `BaselCapitalEngine._generate_pillar2_recommendations` | cap, liq, climate | Generate Pillar 2 supervisory recommendations. |
| `BaselCapitalEngine._determine_rag_status` | cap, liq | Determine overall RAG status. GREEN: All ratios above minimum + combined buffer AMBER: All ratios above minimum but at least one below combined buffer RED: At least one ratio below regulatory minimum |
| `BaselCapitalEngine.get_exposure_classes` |  | Return CRR Article 112 exposure class definitions. |
| `BaselCapitalEngine.get_sa_risk_weights` |  | Return Standardised Approach CQS-to-risk-weight mapping tables. |
| `BaselCapitalEngine.get_irb_parameters` |  | Return IRB formula parameters per CRR Article 153. |
| `BaselCapitalEngine.get_capital_requirements` |  | Return minimum capital ratio requirements per CRR Article 92. |
| `BaselCapitalEngine.get_capital_buffers` |  | Return capital buffer requirements per CRD V. |
| `BaselCapitalEngine.get_lcr_parameters` |  | Return LCR parameters per BCBS d295 / CRR Art. 412. |
| `BaselCapitalEngine.get_nsfr_parameters` |  | Return NSFR parameters per BCBS d396 / CRR II Art. 428a. |
| `BaselCapitalEngine.get_climate_adjustments` |  | Return climate risk capital adjustment parameters per EBA GL/2022/02. |
| `BaselCapitalEngine.get_regulatory_frameworks` |  | Return regulatory framework references. |
| `BaselCapitalEngine.get_operational_risk_parameters` |  | Return SMA operational risk parameters per BCBS d563. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/basel-capital/ref/capital-buffers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['capital_buffers'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/capital-requirements** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['capital_requirements'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/climate-adjustments** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['climate_adjustments'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/exposure-classes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['exposure_classes'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/irb-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['irb_parameters'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/lcr-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['lcr_parameters'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/nsfr-parameters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['nsfr_parameters'], 'n_keys': 1}`

**GET /api/v1/basel-capital/ref/operational-risk** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['operational_risk'], 'n_keys': 1}`

## 5 · Intermediate Transformation Logic

**Engine `basel_capital_engine` — extracted transformation lines:**
```python
a1 = -3.969683028665376e+01
a2 = 2.209460984245205e+02
a3 = -2.759285104469687e+02
a4 = 1.383577518672690e+02
a5 = -3.066479806614716e+01
a6 = 2.506628277459239e+00
b1 = -5.447609879822406e+01
b2 = 1.615858368580409e+02
b3 = -1.556989798598866e+02
b4 = 6.680131188771972e+01
b5 = -1.328068155288572e+01
c1 = -7.784894002430293e-03
c2 = -3.223964580411365e-01
c3 = -2.400758277161838e+00
c4 = -2.549732539343734e+00
c5 = 4.374664141464968e+00
c6 = 2.938163982698783e+00
d1 = 7.784695709041462e-03
d2 = 3.224671290700398e-01
d3 = 2.445134137142996e+00
d4 = 3.754408661907416e+00
p_high = 1.0 - p_low
q = math.sqrt(-2.0 * math.log(p))
q = math.sqrt(-2.0 * math.log(1.0 - p))
0 = unrated, 1-6 = external credit quality step (ECAI mapping).
R  = 0.12 * f(PD) + 0.24 * (1 - f(PD))   where f(PD) = (1 - e^{-50*PD}) / (1 - e^{-50})
b  = (0.11852 - 0.05478 * ln(PD))^2
K  = [LGD * N(sqrt(1/(1-R)) * G(PD) + sqrt(R/(1-R)) * G(0.999)) - PD * LGD]
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

Grounded in `backend/services/basel_capital_engine.py` (1,737 lines; routes:
`api/v1/routes/basel_capital.py`). Note the **exposed API surface is reference-data only** — the
eight `GET /ref/*` endpoints serve the engine's regulatory constant tables (exposure classes,
SA weights, IRB parameters, capital requirements/buffers, LCR/NSFR parameters, climate
adjustments, operational risk). The full calculators (`calculate_capital_requirement`,
`calculate_liquidity`, `run_capital_adequacy`) live in the engine and are consumed internally;
they are documented here because they define what the reference data means.

### 7.1 What the engine computes

1. **SA credit risk weights** per CRR Art. 114–134: 13 exposure classes × CQS 0–6 lookup
   (e.g. corporates CQS1 20% … CQS5-6 150%, unrated 100%; covered bonds 10–100%; retail flat 75%;
   residential property 35%, commercial 50%).
2. **IRB risk weight** — the full CRR Art. 153 corporate formula, implemented exactly:

```
R = 0.12·f(PD) + 0.24·(1 − f(PD)),  f(PD) = (1 − e^(−50·PD)) / (1 − e^(−50))
b = (0.11852 − 0.05478·ln PD)²
K = [LGD·N(√(1/(1−R))·G(PD) + √(R/(1−R))·G(0.999)) − PD·LGD] · (1 + (M − 2.5)·b) / (1 − 1.5·b)
RW = K × 12.5      (RWA = RW × EAD)
```

   Retail is routed per CRR Art. 154 sub-class: residential mortgage R = 0.15 fixed, QRRE
   R = 0.04 fixed, other-retail R = 0.03·f₃₅(PD) + 0.16·(1 − f₃₅(PD)) using the −35 exponent —
   no maturity adjustment. Normal CDF via `math.erf`; inverse CDF via the Acklam rational
   approximation (accuracy ≈ 1.15e−9, cited in code).
3. **Operational risk SMA** (BCBS d563): marginal BIC buckets 12% (< €1bn) / 15% (€1–30bn) /
   18% (> €30bn); `LC = 15 × avg annual losses`; `ILM = ln(e − 1 + (LC/BIC)^0.8)` floored at 1;
   `opRWA = BIC·ILM × 12.5`.
4. **Capital adequacy** (CRR Art. 92): CET1/T1/Total ratios, leverage = T1/exposure measure,
   combined buffer = CCB 2.5% + CCyB + SRB + max(G-SIB bucket 1–5 → 1.0–3.5%, D-SIB), MDA breach
   detection, surplus/deficit in EUR.
5. **Basel III.1 output floor**: under IRB, credit RWA is floored at **72.5% of the SA-computed
   RWA** (both computed per exposure); the uplift is reported when binding.
6. **Climate overlay (EBA GL/2022/02)** — *quarantined Pillar-2*: NACE-sector transition
   multipliers (mining/energy 1.25, manufacturing 1.15, transport 1.18, ICT 0.98 …) × physical-zone
   multipliers (high 1.20 / medium 1.10 / low 1.00) × green supporting factor 0.7619 (CRR Art.
   501a) for taxonomy-qualifying assets. The inline comment is explicit: climate is **not** baked
   into Pillar-1 RWA or the solvency ratios ("applying either to the regulatory RWA fabricates
   the solvency ratios"); it is reported as `climate_rwa_addon` / `climate_adjusted_rwa` memo items.
7. **LCR/NSFR** (BCBS d295/d396) and a **dashboard orchestrator** with climate stress, BCBS 239
   data-quality scoring, Pillar-2 recommendations and RAG status.

### 7.2 Parameterisation highlights

| Table | Key values | Provenance |
|---|---|---|
| Capital minima | CET1 4.5 · T1 6 · Total 8 · leverage 3 · CCB 2.5 (%) | CRR Art. 92 / CRD V |
| Output floor | 72.5% final (2028), 50% transitional 2025 | BCBS d424 / CRR III |
| IRB floors | PD 5bp; LGD 25% unsecured / 10% resi / 15% CRE | Basel III.1 / CRR3 Art 160(1) |
| G-SIB buckets | 1→1.0%, 2→1.5%, 3→2.0%, 4→2.5%, 5→3.5% | FSB/BCBS G-SIB framework |
| LCR outflows | retail stable 5%, less-stable 10%, wholesale op 25%, non-op 40%, financial 100%, derivatives 100% | BCBS d295 |
| NSFR | ASF: capital 100%, stable retail 95% … RSF: L1 5%, mortgages 65%, corporate >1y 85%, NPL 100% | BCBS d396 |
| Climate multipliers | NACE A–U 0.98–1.25; physical 1.0–1.2; GSF 0.7619; brown factor 1.25 | EBA GL/2022/02 concept; multiplier values are platform estimates (brown factor labelled "proposed, EBA 2023") |

### 7.3 Calculation walkthrough (capital requirement)

Per exposure: SA RW is always computed (floor basis); IRB RW replaces it when `approach="irb"`.
`rwa_reg = EAD × RW` accumulates Pillar-1 credit RWA; the climate multiplier produces only
`climate_addon = rwa_reg × (mult − 1)`. After the loop the output floor may uplift credit RWA;
total RWA adds caller-supplied market and operational RWA. Ratios, buffers, breach list
(including the MDA test `CET1 < 4.5% + CBR`) and EUR-denominated surpluses follow. The dashboard
then adds: LCR (with inflows approximated as 5% monthly turn-over of loan books × 50% inflow
rate, floor `net ≥ 25% of outflows`), NSFR, climate stress (default adverse: CET1 −15%/RWA +10%;
severe: −25%/+20%), BCBS 239 score (7 weighted data-completeness principles, max 100), and RAG:
RED if any minimum or LCR/NSFR breach; AMBER if inside the buffer; else GREEN.

### 7.4 Worked example (IRB corporate risk weight)

PD = 1%, LGD = 45%, M = 2.5y:

| Step | Computation | Result |
|---|---|---|
| f(PD) | (1 − e^(−0.5))/(1 − e^(−50)) | 0.39347 |
| R | 0.12×0.39347 + 0.24×0.60653 | 0.19278 |
| b | (0.11852 − 0.05478·ln 0.01)² | 0.13950 (memo: cancels at M = 2.5) |
| G(PD), G(0.999) | Φ⁻¹(0.01), Φ⁻¹(0.999) | −2.32635, 3.09023 |
| Conditional PD | N(√(1/0.80722)·(−2.32635) + √(0.19278/0.80722)·3.09023) = N(−1.07924) | 0.14024 |
| K | 0.45×(0.14024 − 0.01) × 1/(1 − 1.5×0.1395) ≈ 0.05861 × 1.26466 | 0.07412 |
| **RW** | 0.07412 × 12.5 | **≈ 92.6%** |

A €100M EAD exposure therefore carries ≈ €92.6M RWA — close to the well-known ~92%
benchmark for a 1%/45%/2.5y corporate under Basel IRB, confirming the implementation.
Under SA the same unrated corporate would be 100% → floor basis 72.5% × 100 = €72.5M (floor
not binding here).

### 7.5 Data provenance & limitations

- **No synthetic/PRNG data anywhere** — the engine is fully deterministic in caller inputs;
  everything embedded is regulatory reference data with article-level citations in code.
- Sovereign/bank IRB exposures reuse the corporate correlation formula (CRR treats them
  similarly, but SME firm-size correlation adjustment is documented in the ref table yet not
  applied in `calculate_irb_risk_weight`); LGD input floors are listed but not enforced in the
  RW function (only the 5bp PD floor is).
- LCR inflows use a crude `loans × 5% × 50%` monthly-maturity proxy; secured-funding outflow
  categories in the parameters table are richer than the calculator wiring.
- Climate stress defaults (−15%/+10%, −25%/+20%) are illustrative scenario magnitudes, not
  from a named supervisory exercise; the NACE/physical multipliers are expert judgement placed
  under an EBA GL/2022/02 banner (the guideline mandates ESG risk *integration*, not multipliers).
- BCBS 239 scoring measures input completeness only — a proxy for the standard's 14 principles
  (timeliness is hard-coded at 8/10).

### 7.6 Framework alignment

- **CRR (EU 575/2013) Art. 92/112–134/153/154** — minima, exposure classes, SA weights and the
  IRB formulas are implemented essentially verbatim.
- **Basel III Final (BCBS d424) / CRR III (EU 2024/1623)** — 72.5% output floor, PD input floor,
  Basel-IV SA granularity; transitional 50% (2025) is in reference data.
- **CRD IV/V** — combined buffer stack (CCB, CCyB, SRB, higher-of G-SIB/D-SIB) and the MDA
  trigger mechanics.
- **BCBS d295/d396 (LCR/NSFR)** — haircuts, 40/15% caps, 75% inflow cap, ASF/RSF factors; the
  25%-of-outflows net floor mirrors the LCR rules text.
- **BCBS d563 (SMA)** — how the real SMA works: the Business Indicator (ILDC + SC + FC) enters
  marginal buckets (12/15/18%) to give BIC; the Internal Loss Multiplier scales it by 10-year
  loss history via `ln(e − 1 + (15·losses/BIC)^0.8)`; the engine reproduces this exactly.
- **EBA GL/2022/02 & CRR Art. 501a** — climate as Pillar-2 overlay plus the green supporting
  factor (0.7619 = 1/1.3125, the infrastructure factor), with the correct posture that Pillar 1
  contains no climate multiplier.
- **BCBS 239** — data-aggregation principles approximated as a completeness score.