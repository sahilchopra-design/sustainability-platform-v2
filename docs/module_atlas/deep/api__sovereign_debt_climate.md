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
