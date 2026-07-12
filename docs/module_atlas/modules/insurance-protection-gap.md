# Insurance Protection Gap
**Module ID:** `insurance-protection-gap` · **Route:** `/insurance-protection-gap` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Quantifies the gap between total economic losses from natural catastrophe events and the portion covered by insurance, exposing uninsured climate risk. Tracks protection gap trends by peril, region, and sector using sigma and NatCat database methodologies. Supports capital allocation decisions, product development, and public-private partnership structuring for residual risk.

> **Business value:** Enables underwriters, reinsurers, and development finance institutions to locate and size underinsurance concentrations globally. Drives product innovation, sovereign risk pooling design, and regulatory capital adequacy assessment for climate-exposed books.

**How an analyst works this module:**
- Select peril type (flood, windstorm, earthquake, wildfire, drought) and geography to scope the analysis
- Review the Protection Gap Index trend chart to identify widening gaps under climate change trajectories
- Drill into sector decomposition to assess residential vs. commercial vs. agricultural underinsurance
- Model public-private partnership scenarios using the coverage expansion sliders and premium affordability inputs
- Export gap quantification to feed reinsurance treaty design or sovereign parametric programme structuring

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLIMATE_STRESS`, `COUNTRIES`, `GAP_TREND`, `INCOME_COLORS`, `INCOME_GROUPS`, `Kpi`, `PERILS_GAP`, `PERIL_PENETRATION`, `PP_SCHEMES`, `REGION_GAP`, `RiskBadge`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 16 | `penetration`, `gap`, `totalLoss`, `insuredLoss`, `gdp`, `region`, `risk` |
| `REGION_GAP` | 7 | `gapBn`, `penetration`, `climate_risk` |
| `PP_SCHEMES` | 9 | `country`, `peril`, `coverage`, `subsidised`, `year`, `model` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d = 1) => n >= 1e12 ? `$${(n / 1e12).toFixed(d)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(d)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(d)}M` : `$${n.toFixed(d)}`;` |
| `INCOME_GROUPS` | `['High Income', 'Upper-Middle', 'Lower-Middle', 'Low Income'];` |
| `PERIL_PENETRATION` | `PERILS_GAP.map((p, pi) => {` |
| `CLIMATE_STRESS` | `['2030 RCP4.5', '2030 RCP8.5', '2050 RCP4.5', '2050 RCP8.5', '2100 RCP8.5'].map((s, i) => ({` |
| `globalGap` | `Math.round(1.8 * 1e12);` |
| `latestTrend` | `GAP_TREND[GAP_TREND.length - 1];` |
| `TABS` | `['Protection Gap', 'Country Analysis', 'Penetration Rates', 'Climate Stress', 'Public-Private Schemes'];` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/insurance/calculate` | `calculate_insurance` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/reference-data` | `reference_data` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments` | `list_assessments` | api/v1/routes/insurance.py |
| GET | `/api/v1/insurance/assessments/{assessment_id}` | `get_assessment` | api/v1/routes/insurance.py |

### 2.3 Engine `insurance_climate_risk` (services/insurance_climate_risk.py)
| Function | Args | Purpose |
|---|---|---|
| `calculate_insurance_climate_risk` | inp, scenario, horizon_year | Full insurance climate risk assessment. Steps: 1. Apply peril × scenario CAT loss multiplier to baseline loss estimates 2. Net for reinsurance retention 3. Compute Solvency II CAT SCR add-on 4. Compute TP uplift under scenario 5. Assess reserve adequacy (TP vs. climate-adjusted loss) 6. Compute protection gap 7. Score ESG underwriting policy |
| `get_reference_data` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `db` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `insurance_climate_assessments` *(shared)*, `insurance_climate_entities` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLIMATE_STRESS`, `COUNTRIES`, `INCOME_COLORS`, `INCOME_GROUPS`, `PERILS_GAP`, `PP_SCHEMES`, `REGION_GAP`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Protection Gap Index | — | Swiss Re sigma 2024 | Proportion of economic losses uninsured; higher values flag systemic underinsurance |
| Insured Loss (USD bn) | — | Munich Re NatCatSERVICE | Paid + reserved indemnity from primary and reinsurance markets |
| Economic Loss (USD bn) | — | EMDAT / Swiss Re | Total direct damage to assets and infrastructure from catastrophe events |
| Mortality-Adjusted Gap Score | — | UNDRR | Gap index weighted by fatality rate to capture humanitarian severity |
- **NatCatSERVICE / sigma databases** → Filter by peril, year, and geography; deflate to real USD → **Annual insured and economic loss time series by region**
- **Reinsurance cedant data** → Aggregate by treaty layer; apply loss development factors → **Insured loss market share and protection gap by portfolio**
- **Climate scenario outputs** → Apply AAL uplift factors per RCP/SSP pathway → **Forward-looking protection gap under 1.5°C / 2°C / 3°C warming**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/insurance/assessments** — status `passed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/insurance/assessments/{assessment_id}** — status `failed`, provenance ['db-empty'], source tables: `insurance_climate_assessments`, `insurance_climate_entities`
Output: `None`

**GET /api/v1/insurance/reference-data** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['cat_loss_multipliers', 'solvency_ii_cat_factors', 'tp_uplift_by_scenario', 'supported_perils', 'supported_scenarios', 'sources'], 'n_keys': 6}`

**POST /api/v1/insurance/calculate** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Protection Gap Index
**Headline formula:** `PGI = (Economic Loss − Insured Loss) / Economic Loss`

Economic losses are sourced from NatCat databases and deflated to constant USD. Insured losses reflect paid and reserved indemnity. The Protection Gap Index ranges 0–1, where values above 0.7 indicate severely underinsured regions requiring public backstop mechanisms.

**Standards:** ['Swiss Re sigma', 'Munich Re NatCatSERVICE', 'UNDRR Sendai Framework']
**Reference documents:** Swiss Re sigma No. 1/2024 â€” Natural Catastrophes; Munich Re NatCatSERVICE Annual Report 2023; UNDRR Sendai Framework for Disaster Risk Reduction 2015–2030; World Bank DRFI Operational Framework 2021

**Engine `insurance_climate_risk` — extracted transformation lines:**
```python
gross_1in100 = inp.gross_loss_1in100_baseline_eur * multiplier
gross_1in250 = inp.gross_loss_1in250_baseline_eur * multiplier
aal          = inp.average_annual_loss_baseline_eur * multiplier
pml          = inp.probable_max_loss_baseline_eur * multiplier
cat_change_pct = (multiplier - 1.0) * 100.0
net_1in100 = gross_1in100 * ret
net_1in250 = gross_1in250 * ret
ri_limit = inp.reinsurance_limit_eur or (gross_1in250 * (1 - ret) * 1.1)
ri_gap    = max(0.0, gross_1in250 * (1 - ret) - ri_limit)
climate_scr_factor = base_cat_scr_factor * max(0, multiplier - 1.0)
scr_addon = inp.gross_written_premium_eur * climate_scr_factor
total_scr  = inp.scr_eur + scr_addon
sol_ratio_pre  = inp.own_funds_eur / inp.scr_eur if inp.scr_eur > 0 else 0.0
sol_ratio_post = inp.own_funds_eur / total_scr    if total_scr > 0  else 0.0
climate_adj_tp   = inp.technical_provisions_eur * (1 + tp_uplift_frac)
tp_uplift_pct    = tp_uplift_frac * 100.0
reserve_benchmark = max(aal * 1.15, net_1in100 * 0.5)
reserve_deficiency = reserve_benchmark - climate_adj_tp
prot_gap_eur  = max(0.0, econ_loss - insured_loss)
prot_gap_pct  = prot_gap_eur / econ_loss * 100.0 if econ_loss > 0 else 0.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **81** other module(s).
**Shared engines (edits propagate!):** `insurance_climate_risk` (used by 5 modules)

| Connected module | Shared via |
|---|---|
| `insurance-transition` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-portfolio-climate` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `climate-underwriting-workbench` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

The MODULE_GUIDES entry is faithful: the page implements a Protection Gap Index over curated
country/region data, peril-by-income penetration, a widening-gap climate trend, RCP-scenario stress,
and a public-private scheme catalogue. The `insurance_climate_risk.py` engine (which computes a
protection gap internally) is *not* called; all figures are page-local. Country data is curated and
internally consistent (e.g. USA `insuredLoss 1017 ≈ 82% × totalLoss 1240 = penetration`).

### 7.1 What the module computes

The Protection Gap Index is essentially the stored `gap` field, and derived KPIs aggregate it:

```
PGI_country = gap%  ≡ (totalLoss − insuredLoss)/totalLoss × 100      // verified vs stored fields
globalGap   = round(1.8 × 1e12)                                       // $1.8T headline (Swiss Re)
```

The climate **trend** and **stress** series scale a base gap by year/scenario:

```js
GAP_TREND.gap  = (90 + i·11 + sr(i·13)·18) × 1e9      // $Bn, growing 2010→2024
GAP_TREND.gapPct = 56 + i·0.5 + sr(i·17)·2            // % uninsured drifting up
CLIMATE_STRESS.gap = 900 × (1 + (i+1)·0.28) × 1e9     // widening 28%/step across RCP scenarios
CLIMATE_STRESS.uninsurable = 200 × (i+1) × 0.35 × 1e9
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| `COUNTRIES` (penetration, gap, totalLoss, insuredLoss, gdp, risk) | 15 curated rows | Realistic — high-income penetration 68–82%, India 8%, Nigeria 4% |
| Gap identity | `gap = 100 − penetration` (≈) | Insured/total consistent with penetration |
| `GAP_TREND` (2010–2024) | base + `sr()` noise | Synthetic widening series |
| `PERIL_PENETRATION` by income | `70 − gi·18 + sr()·20` | Synthetic; penetration falls with income group |
| `REGION_GAP` (gapBn, penetration, climate_risk) | 6 curated regions | Asia-Pacific $1,840Bn largest gap |
| `CLIMATE_STRESS` (5 RCP scenarios) | ad-hoc scaling factors | 2030/2050/2100 × RCP4.5/8.5 |
| `PP_SCHEMES` | 8 curated real schemes | NFIP, CEA, Pool Re, CCRIF, ARC, PCRIC… (real programmes) |
| `globalGap` | $1.8T | Swiss Re sigma global protection gap |

### 7.3 Calculation walkthrough

1. Country table renders penetration/gap and $ insured vs economic loss; the PGI is the stored gap.
2. Penetration-rate tab plots the income-group penetration matrix by peril.
3. Climate-stress tab scales the base gap across five RCP/horizon scenarios and splits
   insurable vs uninsurable.
4. Public-private tab lists real backstop schemes by peril, coverage, model, and subsidy.
5. KPI cards report the global gap and the latest trend point.

### 7.4 Worked example (China vs USA PGI)

| Country | Total loss | Insured loss | PGI = (total−insured)/total | Stored gap |
|---|---|---|---|---|
| USA | 1240 | 1017 | (1240−1017)/1240 = **18.0%** | 18 |
| China | 1840 | 405 | (1840−405)/1840 = **78.0%** | 78 |
| India | 620 | 50 | (620−50)/620 = **91.9%** | 92 |

The stored `gap` matches the computed PGI to rounding — confirming the index is a display of curated
inputs, not a live computation. Climate stress @2050 RCP8.5 (i=3): `gap = 900×(1+4×0.28)×1e9 =
900×2.12 = $1.9T` widening from the $0.9T base.

### 7.5 Companion analytics on the page

- **Region gap** bar with climate-risk overlay (Asia-Pacific highest gap and risk).
- **Peril × income penetration** matrix (low-income under-penetration).
- **Public-private schemes** — model type, coverage, subsidy, inception year.

### 7.6 Data provenance & limitations

- Country/region/scheme data is **curated realistic** (consistent penetration↔insured/economic loss);
  trend and stress series are **`sr()`-seeded / ad-hoc scaled**.
- Climate stress uses fixed `(1+(i+1)×0.28)` scaling per scenario, not a peril-specific AAL uplift
  from a cat model or downscaled hazard — the guide's "AAL uplift factors per RCP/SSP" is
  approximated, not implemented.
- No mortality-adjusted gap score (listed in the guide) is computed.

**Framework alignment:** *Swiss Re sigma* — the $1.8T global gap and country penetration echo sigma's
protection-gap reporting. *Munich Re NatCatSERVICE* — the economic-vs-insured loss split follows the
NatCat database structure. *UNDRR Sendai / World Bank DRFI* — the public-private scheme catalogue
(sovereign parametric pools CCRIF/PCRIC/ARC) reflects the DRFI risk-layering framework, though no
layering optimisation is run.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Compute forward-looking, peril-specific protection gaps under downscaled climate scenarios — sizing
uninsured exposure for product design, sovereign risk-pooling, and regulatory capital adequacy.

### 8.2 Conceptual approach
Combine an **AAL model** (hazard × exposure × vulnerability) with a **penetration/affordability model**
to split economic loss into insured and uninsured, then scale AAL by downscaled RCP/SSP hazard
multipliers — mirroring Swiss Re's economic-loss modelling and the World Bank DRFI layered approach.

### 8.3 Mathematical specification
For country *c*, peril *p*, scenario *s*, year *t*:

```
AAL_{c,p}(s,t) = Σ_T (λ_T − λ_{T+1}) · DF_{c,p}(i_T) · Exposure_c · u_p(s,t)   // u = hazard uplift
Penetration_{c,p}(t) = f(GDPpc_c, premium_affordability, market maturity)
InsuredLoss_{c,p}(s,t) = AAL_{c,p}(s,t) · Penetration_{c,p}(t)
Gap_{c,p}(s,t) = AAL_{c,p}(s,t) − InsuredLoss_{c,p}(s,t)
PGI_{c}(s,t)   = Σ_p Gap_{c,p} / Σ_p AAL_{c,p}
MortAdjGap_c   = PGI_c · (fatalities_c / population_c normalised)              // humanitarian weight
```

| Parameter | Source |
|---|---|
| AAL / fragility `DF` | Swiss Re sigma; JRC/HAZUS; national cat models |
| Hazard uplift `u_p(s,t)` | IPCC AR6 Interactive Atlas (RCP/SSP downscaled) |
| Penetration drivers | World Bank GFDD; Swiss Re insurance-density data |
| Fatalities/exposure | EM-DAT; national statistics |

### 8.4 Data requirements
Per country: exposure value, peril fragility, hazard maps by return period, GDP per capita and
insurance density, historical loss/fatality series. Platform has: curated penetration/gap baselines;
`insurance_climate_risk.py` protection-gap logic; needs downscaled hazard uplifts and AAL inputs.

### 8.5 Validation & benchmarking plan
Reconcile modelled PGI against Swiss Re sigma country figures; backtest AAL against EM-DAT/NatCat
loss history; sensitivity to penetration-model form and hazard downscaling; verify RCP8.5 widening
against published protection-gap projections.

### 8.6 Limitations & model risk
Penetration modelling is data-sparse in low-income markets; hazard downscaling error compounds to
2100; affordability and demand are behaviourally uncertain. Fallback: report gaps as scenario ranges
and separate the (well-observed) current gap from the (uncertain) projected gap.

## 9 · Future Evolution

### 9.1 Evolution A — AAL-based forward gap replacing the flat scenario scaling (analytics ladder: rung 2 → 3)

**What.** The current-state view is genuinely sound: curated country data is internally consistent (USA 1240/1017 verifies to the stored 18% gap; §7.4 proves the PGI identity), the PP-scheme catalogue is real (NFIP, CEA, Pool Re, CCRIF, ARC), and the $1.8T headline matches sigma. The weaknesses §7.6 lists are all forward-looking: `GAP_TREND` is `sr()`-noised, `CLIMATE_STRESS` scales one base gap by a flat `(1+(i+1)·0.28)` per scenario rather than peril-specific AAL uplifts, the income-group penetration matrix is synthetic, and the guide's mortality-adjusted gap score is absent. Evolution A implements the §8 model: `AAL(s,t) = Σ_T (λ_T−λ_{T+1})·DF(i_T)·Exposure·u_p(s,t)` with IPCC AR6 hazard uplifts, a penetration/affordability model on World Bank insurance-density data, and `Gap = AAL·(1−Penetration)` per country×peril — plus the mortality adjustment from EM-DAT fatality data.

**How.** (1) Ingest EM-DAT loss/fatality history (the platform already used UCDP/OpenFEMA-style ingestion patterns in wave 1; EM-DAT is a comparable registered-access source) and Swiss Re insurance-density tables into refdata. (2) Hazard uplifts per peril from the digital twin's grids + AR6 Atlas multipliers rather than one 28% step. (3) The shared engine's `prot_gap_eur` logic becomes the per-assessment path; a new aggregate route serves the country×peril grid. (4) Validation per §8.5: modelled current-year PGIs reconcile to the curated sigma-shaped country table (which becomes the calibration set, not the display data).

**Prerequisites.** EM-DAT access; penetration-model form documented (§8.6 flags low-income data sparsity — honest nulls there); additive engine changes with sibling regressions (5 modules share it). **Acceptance:** the 2050 RCP8.5 gap differs by peril and country rather than uniformly ×2.12; current-year modelled PGIs match curated values within tolerance; mortality-adjusted scores computed for countries with fatality data.

### 9.2 Evolution B — Risk-pooling and product-design copilot (LLM tier 1 → 2)

**What.** The module's stated users — underwriters, reinsurers, DFIs structuring sovereign pools — ask design questions the curated data supports: "which scheme model fits a Pacific-island cyclone gap — CCRIF-style parametric or NFIP-style indemnity?", "why is India's gap 92% despite rising penetration?", "what coverage expansion closes Asia-Pacific's $1.84T gap by half?" Tier 1 grounds on the real `PP_SCHEMES` catalogue and country table; tier 2, post-Evolution-A, runs coverage-expansion what-ifs against the AAL/penetration engine.

**How.** Tier 1: atlas record + curated tables into the corpus, with the discipline that scheme facts (inception year, model, subsidy) quote catalogue rows — these are real programmes where invented details would be checkable errors. The trend/stress series carry the §7.6 synthetic caveat until Evolution A replaces them. Tier 2: tool calls sweep penetration scenarios ("premium subsidy raising penetration 8pp → gap change?") with the affordability-model assumptions disclosed; scheme recommendations map gap characteristics (peril, income group, loss frequency) to catalogue precedents with the analogy stated, not asserted as prescription — layering design per World Bank DRFI is judgement the copilot supports, not replaces.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for quantitative what-ifs. **Acceptance:** scheme facts 100% catalogue-traceable; pre-Evolution-A stress questions get the flat-scaling caveat; post, expansion scenarios reproduce from logged tool parameters.