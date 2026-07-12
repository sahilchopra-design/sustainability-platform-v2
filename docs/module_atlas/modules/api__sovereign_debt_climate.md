# Api::Sovereign_Debt_Climate
**Module ID:** `api::sovereign_debt_climate` · **Route:** `/api/v1/sovereign-debt-climate` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/sovereign-debt-climate/crdc-assessment` | `crdc_assessment_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/debt-for-nature` | `debt_for_nature_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/imf-rst` | `imf_rst_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/sids-vulnerability` | `sids_vulnerability_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| POST | `/api/v1/sovereign-debt-climate/sovereign-portfolio` | `sovereign_portfolio_endpoint` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/sids-list` | `ref_sids_list` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/crdc-triggers` | `ref_crdc_triggers` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/imf-rst-eligible` | `ref_imf_rst_eligible` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/paris-club` | `ref_paris_club` | api/v1/routes/sovereign_debt_climate.py |
| GET | `/api/v1/sovereign-debt-climate/ref/dfn-frameworks` | `ref_dfn_frameworks` | api/v1/routes/sovereign_debt_climate.py |

### 2.3 Engine `sovereign_debt_climate_engine` (services/sovereign_debt_climate_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `assess_crdc_eligibility` | country_data, debt_terms | Assess eligibility and design of Climate Resilience Debt Clauses. Entity-specific figures (debt principal) are honest nulls when the caller does not supply them. Structuring fractions (debt-service rate, deferral fraction, structuring cost rate) accept caller inputs and otherwise fall back to documented model constants that are flagged in `data_flags`. |
| `assess_debt_for_nature` | country_data, deal_terms | Assess and design a Debt-for-Nature swap transaction. Total eligible debt is a real entity figure (honest null if not supplied). Deal structuring fractions accept caller inputs and otherwise default to documented model constants (flagged in `data_flags`). The framework discount default is the midpoint of the published framework discount range, which is itself reference data. |
| `assess_imf_rst` | country_data | Assess IMF Resilience and Sustainability Trust access and reform requirements. The IMF quota is a real published entity figure — honest null if not supplied, with the indicative drawing left null in that case. The resilience score is a documented deterministic proxy derived from published vulnerability and RST approval status (or a caller-supplied score), flagged in `data_flags`. |
| `assess_sids_vulnerability` | country_iso, overrides | Assess SIDS vulnerability and CDPC eligibility using composite index. Component sub-scores (INFORM / ND-GAIN / fiscal resilience) are, by default, a documented DETERMINISTIC decomposition of the published composite vulnerability score and GDP band — not random draws. A caller may supply real sub-scores or a population via `overrides` to replace the model decomposition and derive a real GNI-per-cap |
| `aggregate_sovereign_climate_portfolio` | holdings | Aggregate climate-linked sovereign debt metrics across a portfolio of sovereign holdings. Holdings with neither a SIDS-reference vulnerability nor a caller-supplied `vulnerability_score` are excluded from vulnerability-weighted metrics (and flagged) rather than assigned a random score. Weighted averages are computed over the covered exposure so the weights are honest. With no exposure, USD and wei |

**Engine `sovereign_debt_climate_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `DEFAULT_ANNUAL_DEBT_SERVICE_RATE` | `0.06` |
| `DEFAULT_CRDC_DEFERRAL_FRACTION` | `0.3` |
| `DEFAULT_CRDC_STRUCTURING_COST_RATE` | `0.003` |
| `DEFAULT_BASE_RETURN_PERIOD_YEARS` | `15.0` |
| `DEFAULT_DFN_SWAP_SHARE` | `0.1` |
| `DEFAULT_CO2_SEQUESTRATION_INTENSITY` | `100.0` |
| `DEFAULT_MDB_GUARANTEE_COVERAGE` | `0.5` |
| `DEFAULT_CARBON_PRICE_USD_PER_TCO2` | `20.0` |
| `DEFAULT_PORTFOLIO_CLIMATE_VAR_LOSS_FACTOR` | `0.1` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `and`, `debt`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/sovereign-debt-climate/ref/crdc-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['trigger_types', 'total_triggers', 'standard', 'precedents'], 'n_keys': 4}`

**GET /api/v1/sovereign-debt-climate/ref/dfn-frameworks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['frameworks', 'total_frameworks', 'largest_deal_to_date', 'total_dfn_market_2023_bn_usd', 'key_actors', 'carbon_credit_standards'], 'n_keys': 6}`

**GET /api/v1/sovereign-debt-climate/ref/imf-rst-eligible** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['eligible_countries', 'total_eligible', 'access_limit_pct_quota', 'standard', 'rst_total_capacity_bn_sdr', 'note'], 'n_keys': 6}`

**GET /api/v1/sovereign-debt-climate/ref/paris-club** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['categories', 'climate_mou', 'g7_commitment', 'cdpc_adoption_target_pct', 'note'], 'n_keys': 5}`

**GET /api/v1/sovereign-debt-climate/ref/sids-list** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sids', 'total_sids', 'source', 'regions', 'note'], 'n_keys': 5}`

**POST /api/v1/sovereign-debt-climate/crdc-assessment** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'country_iso', 'country_name', 'crdc_eligible', 'debt_amount_usd', 'trigger_type', 'trigger_threshold', 'trigger_probability_pct', 'climate_event_return_period_years', 'deferred_amount_usd', 'deferred_period_months', 'basis_risk_rating', 'debt_relief_score', 'im`

**POST /api/v1/sovereign-debt-climate/debt-for-nature** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/sovereign-debt-climate/imf-rst** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `sovereign_debt_climate_engine` — extracted transformation lines:**
```python
return_period = max(1.0, base_return_period * (1 - vuln_score + 0.2))
trigger_prob_pct = round(100 / return_period, 2)
annual_debt_service = debt_amount * ds_rate
debt_relief_score = round(min(1.0, vuln_score * 0.6 + (deferred_pct) * 0.4), 4)
commitment_pct_gdp = conservation_fund / gdp * 100 if gdp else 0.0
resilience_score = round(max(0.0, min(1.0, (1 - vuln) * 0.85 + approval_bonus)), 4)
nd_gain = round(0.5 * (1 - vuln), 4)
fiscal_res = round(0.4 * (1 - vuln) + (0.05 if gdp < 5 else 0.15), 4)
composite = round(inform * 0.35 + (1 - nd_gain) * 0.35 + (1 - fiscal_res) * 0.30, 4)
gdp_per_capita = gdp * 1e9 / float(_population)
relief_score = round(composite * 0.6 + (cdpc_deferred / 40) * 0.4, 4)
weighted_vuln_num = 0.0   # numerator: sum(vuln * exposure) over covered holdings
relief = min(1.0, vuln * 0.7)  # deterministic; no random jitter
sids_exposure_pct=round(sids_exposure / total_exposure * 100, 2),
high_risk_country_concentration=round(high_risk_exposure / total_exposure, 4),
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the domain computes

`/api/v1/sovereign-debt-climate` (engine E69, `sovereign_debt_climate_engine.py`) structures and
assesses four climate-linked sovereign-debt instruments: **Climate Resilience Debt Clauses
(CRDC)**, **debt-for-nature (DfN) swaps**, **IMF Resilience & Sustainability Trust (RST)** access,
and a **SIDS vulnerability / Paris-Club** classifier, plus a portfolio aggregator.

Core formulas quoted from code:

```
CRDC:  return_period = max(1, base_RP × (1 − vuln + 0.2));  trigger_prob % = 100/return_period
       deferred = debt × ds_rate × deferral_fraction × months/12
       debt_relief_score = min(1, 0.6·vuln + 0.4·deferral_fraction)
DfN:   swap = debt × swap_share;  fund = swap × discount%;  net_reduction = swap × discount%
       CO2/yr = fund/$1M × intensity;  carbon revenue = CO2 × price (if framework carbon-linked)
RST:   resilience = (1 − vuln) × 0.85 + 0.15·approved;  drawing = quota × 150 %
SIDS:  composite = 0.35·INFORM + 0.35·(1 − ND-GAIN) + 0.30·(1 − fiscal_resilience)
Port.: climate_adjusted = exposure × (1 − 0.15·weighted_vuln);  climate_VaR = exposure × vuln × 0.10
```

### 7.2 Parameterisation

**Model calibration constants** (header comment: "documented model parameters — NOT entity data",
each use is flagged in `data_flags`):

| Constant | Value | Stated rationale |
|---|---|---|
| `DEFAULT_ANNUAL_DEBT_SERVICE_RATE` | 6 % of principal p.a. | coupon + amortisation midpoint |
| `DEFAULT_CRDC_DEFERRAL_FRACTION` | 0.30 | "20–40 % typically deferred; midpoint" |
| `DEFAULT_CRDC_STRUCTURING_COST_RATE` | 30 bps of principal | legal/structuring cost |
| `DEFAULT_BASE_RETURN_PERIOD_YEARS` | 15 | base event return period pre-vulnerability scaling |
| `DEFAULT_DFN_SWAP_SHARE` | 0.10 | share of eligible debt typically swapped |
| `DEFAULT_CO2_SEQUESTRATION_INTENSITY` | 100 tCO₂/yr per $1M fund | "nature-based midpoint" |
| `DEFAULT_MDB_GUARANTEE_COVERAGE` | 0.50 | MDB guarantee share |
| `DEFAULT_CARBON_PRICE_USD_PER_TCO2` | $20 | "VCS/GS range midpoint" |
| `DEFAULT_PORTFOLIO_CLIMATE_VAR_LOSS_FACTOR` | 0.10 | loss-given-stress factor |

**Reference tables:** `SIDS_LIST` — 39 countries with vulnerability scores 0.58 (Trinidad) to 0.97
(Tuvalu) and GDP; `IMF_RST_ELIGIBILITY` — 26 countries, 150 % of quota access, reform area
(climate_resilience / energy_transition) and approval status; `CRDC_TRIGGER_TYPES` — 5 parametric
triggers (cyclone ≥119 km/h Cat-1, rainfall −30 %, temperature +1.5 °C, sea level +20 cm,
SPEI-12 ≤ −1.5) each with deferral period (12–36 months), data source (WMO, CHIRPS, HadCRUT5,
PSMSL, GDO) and basis-risk rating; `DFN_SWAP_FRAMEWORKS` — bilateral / multilateral / commercial /
Paris-Club with real precedents (Seychelles 2016, Belize 2021, Ecuador Galápagos 2023) and
discount ranges (10–50 %); `PARIS_CLUB_CATEGORIES` — GNI/capita cut-offs $1,135 (IDA/HIPC) and
$4,465, relief 90/50/20 %, climate conditionality strings.

**SIDS tiers:** composite ≥ 0.75 critical (CDPC defers 40 % of debt service), ≥ 0.55 high (25 %),
else medium (10 %); CDPC-eligible at ≥ 0.55.

### 7.3 Calculation walkthrough

1. **CRDC** (`POST /crdc-assessment`): eligibility = SIDS member OR vulnerability ≥ 0.65 OR
   caller-flagged SIDS/LDC. Principal-dependent USD figures are **honest nulls** without a
   caller-supplied `debt_amount_usd`. Recommendations are rule-based (dual-trigger if return
   period > 20 yr, parametric verification for medium basis risk, Commonwealth template citation).
2. **DfN** (`POST /debt-for-nature`): discount defaults to the framework range midpoint; the
   conservation-commitment %-of-GDP uses the SIDS GDP table; MDB guarantee and carbon revenue only
   for frameworks with `mdb_involvement`/`carbon_credit_linkage`. IMF-RST linkage flag when the
   country is RST-approved.
3. **RST** (`POST /imf-rst`): conditionality met requires eligible AND approved AND resilience ≥
   0.55; reform-measure checklists differ by reform area (adaptation plan, ≥2 % GDP contingency
   fund … vs ≥40 % RE by 2030, subsidy reform …).
4. **SIDS vulnerability**: component sub-scores are a *documented deterministic decomposition* of
   the published composite (INFORM = vuln; ND-GAIN = 0.5(1−vuln); fiscal = 0.4(1−vuln) + 0.05/0.15
   GDP-band bonus) unless the caller overrides with real sub-scores; Paris-Club category uses real
   GNI/capita only if a population is supplied, else falls back to the vulnerability tier (flagged).
5. **Portfolio** (`fleet` in route terms): vulnerability-weighted metrics computed only over
   covered exposure; holdings without any vulnerability are excluded and flagged, not imputed.
   CRDC/DfN-eligible exposure heuristics: 60 %/30 % of exposure for SIDS-or-vuln ≥ 0.65 holdings.

### 7.4 Worked example — CRDC for Maldives, $500M, cyclone trigger

MDV: vulnerability 0.90. Caller supplies debt $500M, defaults elsewhere.

| Step | Computation | Result |
|---|---|---|
| Return period | max(1, 15 × (1 − 0.90 + 0.2)) = 15 × 0.30 | **4.5 yr** |
| Trigger probability | 100/4.5 | **22.22 %/yr** |
| Annual debt service | 500M × 0.06 | $30M |
| Deferred (24 mo, 30 %) | 30M × 0.30 × 24/12 | **$18.0M** |
| Structuring cost | 500M × 0.003 | **$1.5M** |
| Relief score | min(1, 0.6×0.90 + 0.4×0.30) | **0.66** |
| Eligible | MDV ∈ SIDS_LIST | yes; basis risk "low"; 3 data_flags record the model constants used |

### 7.5 Data provenance & limitations

- **No PRNG** — this is a remediated engine: entity figures (principal, quota, population,
  eligible debt) are honest nulls when absent, and every model-constant fallback is disclosed in
  `data_flags`. The SIDS vulnerability scores and RST approval flags are hand-embedded reference
  data *styled after* UN-OHRLLS/IMF publications, not live feeds — treat individual values as
  approximate vintage.
- Trigger probability is a deterministic vulnerability-scaled return period, not a hazard-model
  frequency; basis-risk ratings are qualitative labels.
- DfN carbon economics use a flat $20/t and 100 tCO₂/$1M sequestration intensity — order-of-
  magnitude placeholders for what would be project-level MRV in a real swap.
- The portfolio "climate VaR" is a linear exposure × vulnerability × 0.10 stress, not a
  distributional quantile; `climate_adjusted_exposure` similarly uses a 15 % max haircut.
- Paris-Club GNI thresholds correspond to the IDA operational cut-off ($1,135, FY2024) and the
  lower-middle-income boundary ($4,465) — correct anchors, static vintage.

### 7.6 Framework alignment

- **Climate Resilient Debt Clauses (Commonwealth Secretariat / ICMA 2022–23)** — deferral of debt
  service upon a parametric climate trigger; the engine reproduces the trigger menu, deferral
  windows, and structuring-cost framing of the published CRDC term sheets.
- **Debt-for-nature swaps (IMF/World Bank 2023 literature)** — buy-back at a discount funding a
  conservation trust, often with MDB credit enhancement (e.g. Belize 2021 "blue bond", Ecuador
  Galápagos 2023); the four frameworks encode those precedents with their typical discount ranges.
- **IMF Resilience & Sustainability Trust** — long-maturity (20-yr, 10.5-yr grace) lending up to
  150 % of quota conditioned on climate/pandemic reform under an existing IMF programme; the
  engine tracks eligibility, access limit, reform-area conditionality and an indicative drawing.
- **Paris Club MOU on climate (2021)** and **UN-OHRLLS SIDS vulnerability** — categorisation and
  relief percentages are the platform's stylisation of Paris-Club practice; the composite
  vulnerability blends INFORM-risk, ND-GAIN-readiness and fiscal-resilience concepts (real INFORM
  and ND-GAIN are independently published indices — here decomposed from one score unless real
  sub-scores are supplied).
- **Kunming-Montreal GBF 30×30** — cited verbatim in the DfN biodiversity target list.

## 9 · Future Evolution

### 9.1 Evolution A — Country-data-fed vulnerability and calibrated instrument parameters (analytics ladder: rung 2 → 3)

**What.** The E69 engine structures four climate-linked sovereign-debt instruments: CRDC
(trigger probability `100/return_period` with a vulnerability-scaled return period), debt-for-nature
swaps (fund/discount/CO₂ economics), IMF RST access (quota × 150%), and a SIDS composite
(`0.35·INFORM + 0.35·(1−ND-GAIN) + 0.30·(1−fiscal_resilience)`), plus a portfolio aggregator
(`climate_VaR = exposure × vuln × 0.10`). The design is honest (the §5 extract even notes
"deterministic; no random jitter"), but the vulnerability, INFORM, and ND-GAIN inputs are
caller-supplied, and the linear calibration constants (0.15 exposure haircut, 0.10 VaR factor,
0.6/0.4 relief weights) are platform conventions. Evolution A grounds inputs and calibrates.

**How.** (1) Feed INFORM, ND-GAIN, fiscal, and quota inputs from the refdata layer (country
indices are Tier-1 public data — `dh_country_risk_indices` / `public_reference_data`) so a country
assessment needs only an ISO code, with source and vintage attribution. (2) Calibrate the CRDC
return-period scaling against actual disaster-frequency data (EM-DAT / the platform's peril grids)
per country and peril rather than the `(1 − vuln + 0.2)` heuristic. (3) Ground the `× 0.10`
climate-VaR factor in observed sovereign-spread reactions to climate events, or label it
explicitly as a convention with sensitivity. (4) Bench-pin the four instrument calculators.

**Prerequisites.** Country-index ingestion (INFORM/ND-GAIN are freely available); disaster-frequency
linkage; the refdata points store populated. **Acceptance:** a country assessment resolves indices
from stored data with vintages; CRDC trigger probabilities cite a disaster-frequency basis; the VaR
factor carries provenance or an explicit convention label; instruments bench-pinned.

### 9.2 Evolution B — Sovereign climate-debt structuring copilot (LLM tier 2)

**What.** A copilot for sovereign-debt desks: "structure a debt-for-nature swap for this SIDS —
what's the vulnerability composite, the plausible conservation fund, the CRDC trigger probability,
and our portfolio's climate-adjusted exposure?" — calling the five POST endpoints, each figure
tool-sourced, grounded in the precedent registries.

**How.** Five POST instruments plus reference GETs (SIDS list, CRDC trigger types with precedents,
DfN frameworks with the largest-deal and market-size facts, IMF-RST eligible countries and access
limits) — the reference endpoints carry real market precedents the copilot cites instead of
inventing deal history. The portfolio aggregator serves the investor view. What-ifs ("raise the
deferral fraction", "assume RST approval") re-run statelessly. Node for a sovereign/EM desk,
cross-linking to the country-risk and nature copilots.

**Prerequisites.** None hard — the engine is deterministic and honest; country answers are far
stronger after Evolution A's data feed. **Acceptance:** every score, probability, and structured
amount traces to a tool response; precedent claims cite the reference registries; the copilot
labels vulnerability inputs as caller-supplied vs data-resolved and refuses to present structuring
outputs as executable deal terms.