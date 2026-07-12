# Insurance Transition Risk
**Module ID:** `insurance-transition` · **Route:** `/insurance-transition` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Transition risk assessment for insurance companies covering underwriting, investment, and liability sides. Includes stranded asset exposure, carbon-intensive underwriting, and regulatory Solvency II overlay.

> **Business value:** Insurers face a triple climate exposure: underwriting risk (carbon clients become uninsurable), investment risk (stranded asset losses), and liability risk (climate D&O claims). EIOPA and IAIS are embedding climate into Solvency II requirements. This module provides the integrated climate risk view needed for ORSA and regulatory stress tests.

**How an analyst works this module:**
- Underwriting Exposure shows GWP by carbon-intensive sector
- Investment Review shows portfolio exposure to stranded assets
- Liability Assessment scores climate D&O and other emerging liabilities
- Solvency II Overlay shows SCR impact of climate stress
- ORSA Climate Integration guides Own Risk and Solvency Assessment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FUEL_TYPES`, `GREEN_CATEGORIES`, `GREEN_PRODUCTS`, `INSURERS`, `INSURER_TYPES`, `MEMBERSHIPS`, `PIE_COLORS`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORY_FRAMEWORKS` | 9 | `reg`, `jurisdiction`, `status`, `compliance`, `requirements`, `keyGap` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `MEMBERSHIPS` | `['NZIA','PSI','PCAF','TCFD','SBTi','Net-Zero AOA','ClimateWise'];` |
| `GREEN_CATEGORIES` | `['Renewable Energy','EV Insurance','Green Building','Climate Adaptation','Sustainable Agriculture','Circular Economy','Carbon Capture','Nature-Based'];` |
| `type` | `INSURER_TYPES[Math.floor(s1*INSURER_TYPES.length)];` |
| `region` | `REGIONS[Math.floor(s2*REGIONS.length)];` |
| `gwp` | `Math.round(5+s3*95);` |
| `fossilExposure` | `+(1+s4*25).toFixed(1);` |
| `coalExposure` | `+(s5*fossilExposure*0.4).toFixed(1);` |
| `oilGasExposure` | `+(fossilExposure-coalExposure).toFixed(1);` |
| `nzTarget` | `s6>0.3?`Net-zero ${2040+Math.floor(s7*10)}`:'No target';` |
| `transitionScore` | `Math.round(20+s5*75);` |
| `envScore` | `Math.round(15+s6*80);` |
| `disclosureScore` | `Math.round(25+s7*70);` |
| `targetScore` | `Math.round(10+s8*85);` |
| `engagementScore` | `Math.round(20+s9*75);` |
| `overallScore` | `Math.round((transitionScore+envScore+disclosureScore+targetScore+engagementScore)/5);` |
| `coalPhaseOut` | `s1>0.5?`${2025+Math.floor(s2*8)}`:'None';` |
| `oilPhaseOut` | `s3>0.6?`${2028+Math.floor(s4*12)}`:'None';` |
| `gasPhaseOut` | `s5>0.7?`${2030+Math.floor(s6*15)}`:'None';` |
| `greenPremium` | `+(gwp*0.02+s10*gwp*0.15).toFixed(1);` |
| `greenRatio` | `+(greenPremium/gwp*100).toFixed(1);` |
| `category` | `GREEN_CATEGORIES[Math.floor(s1*GREEN_CATEGORIES.length)];` |
| `insurer` | `INSURERS[Math.floor(s2*INSURERS.length)].name;` |
| `premium` | `+(0.5+s3*20).toFixed(1);` |
| `growth` | `+(5+s4*45).toFixed(1);` |
| `lossRatio` | `+(0.25+s5*0.45).toFixed(2);` |
| `products` | `['Solar Farm All-Risk','Wind Farm Package','EV Fleet Insurance','Green Building Warranty','Climate Resilience Bond','Mangrove Protection','Reef Restoration','Carbon Credit Insurance','Battery Storage Cover','Heat Pump Gu` |
| `stats` | `useMemo(()=>{ const avgScore=Math.round(INSURERS.reduce((a,b)=>a+b.overallScore,0)/ Math.max(1, INSURERS.length));` |
| `avgFossil` | `+(INSURERS.reduce((a,b)=>a+b.fossilExposure,0)/ Math.max(1, INSURERS.length)).toFixed(1);` |
| `avgGreenRatio` | `+(INSURERS.reduce((a,b)=>a+b.greenRatio,0)/ Math.max(1, INSURERS.length)).toFixed(1);` |
| `insurerPages` | `Math.ceil(filteredInsurers.length/PAGE_SIZE);` |
| `pagedInsurers` | `filteredInsurers.slice(insurerPage*PAGE_SIZE,(insurerPage+1)*PAGE_SIZE);` |

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
**Frontend seed datasets:** `FUEL_TYPES`, `GREEN_CATEGORIES`, `INSURER_TYPES`, `MEMBERSHIPS`, `PIE_COLORS`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Fossil Fuel Underwriting Exposure | — | Sector analysis | Gross written premium from carbon-intensive clients |
| Stranded Asset Exposure | — | Investment | Bonds/equity in coal, O&G at high stranding risk |
| Climate D&O Exposure | — | Liability | Directors and officers liability from climate disclosures |
- **Underwriting portfolio** → Fossil fuel exposure analysis → **Transition underwriting risk**
- **Investment portfolio** → Stranded asset screen → **Investment transition risk**
- **Combined risks** → Solvency II calibration → **Climate SCR add-on**

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
**Methodology:** Insurance transition risk aggregation
**Headline formula:** `TotalRisk = UnderwritingRisk + InvestmentRisk + LiabilityRisk`

Underwriting: carbon-intensive industries may become uninsurable (coal, O&G). Investment: bond/equity exposure to stranded assets. Liability: D&O claims from climate disclosure failures, bodily injury from heat events.

**Standards:** ['EIOPA Consultation CP-23-012', 'ORSA', 'Solvency II']
**Reference documents:** EIOPA Consultation on Sustainability in Solvency II; IAIS Application Paper on Climate Change Risks; ClimateWise Principles for Insurance

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
| `insurance-portfolio-climate` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-protection-gap` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `climate-underwriting-workbench` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `insurance-climate-hub` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a **transition-risk aggregation**
> — `TotalRisk = UnderwritingRisk + InvestmentRisk + LiabilityRisk` with stranded-asset screening and
> a Solvency II overlay. **The code implements none of that as a risk aggregation.** It is a
> **synthetic insurer scorecard**: 50 named insurers with five PRNG sub-scores averaged into an
> "overall transition score", plus fossil-fuel exposure draws, 40 synthetic green products, and a
> curated regulatory-framework table. No investment portfolio, no stranded-asset model, no SCR
> overlay is computed. Sections below document the code.

### 7.1 What the module computes

Each of 50 insurers gets five independent `sr()` sub-scores, averaged (equal weight) into an overall
score:

```js
transitionScore = 20 + s5·75     envScore = 15 + s6·80     disclosureScore = 25 + s7·70
targetScore     = 10 + s8·85     engagementScore = 20 + s9·75
overallScore    = round((transitionScore+envScore+disclosureScore+targetScore+engagementScore)/5)
```

Fossil exposure and green ratio are also draws:

```js
fossilExposure = 1 + s4·25                         // % of GWP
coalExposure   = s5·fossilExposure·0.4 ; oilGasExposure = fossilExposure − coalExposure
greenPremium   = gwp·0.02 + s10·gwp·0.15 ; greenRatio = greenPremium/gwp·100
```

Portfolio KPIs average across insurers (with `Math.max(1, length)` division guards):

```js
avgScore = round(Σ overallScore / max(1, N))
avgFossil = Σ fossilExposure / max(1, N) ; avgGreenRatio = Σ greenRatio / max(1, N)
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| 50 insurer names | Allianz, AXA, Swiss Re, Munich Re, Ping An… | Real names, **synthetic metrics** |
| Five sub-scores | ranges 10–95 | Independent `sr(s)=frac(sin(s+1)×10⁴)` draws |
| Overall score | equal-weight mean of 5 | No materiality weighting |
| `fossilExposure` | 1–26 % GWP | `sr()` draw |
| Coal split | 40 % of fossil × `sr()` | Synthetic |
| NZIA/PSI/SBTi/TCFD flags | `sr()` thresholds (>0.4, >0.35, >0.6, >0.3) | Synthetic membership gates |
| Phase-out years | `sr()`-gated (coal 2025–33, oil 2028–40, gas 2030–45) | Synthetic |
| Green ratio | `2% + sr×15%` of GWP | Synthetic |
| 40 `GREEN_PRODUCTS` | premium/growth/loss-ratio draws | Synthetic |
| `REGULATORY_FRAMEWORKS` (8) | compliance %, requirements, keyGap | **Curated** (TCFD, EIOPA SII, PRA SS3/19, NAIC, ISSB S2, SFDR, PSI, NZIA) |

### 7.3 Calculation walkthrough

1. `INSURERS` seeded → scorecard table (paginated) sortable by score/fossil/green.
2. Overall score = equal mean of five sub-scores; band colour by threshold.
3. Fossil-underwriting tab charts coal/oil/gas exposure and phase-out commitments.
4. Green-products tab lists 40 synthetic products by category, premium, growth, loss ratio.
5. Regulatory tab renders the curated framework table with compliance %.
6. KPI cards average overall score, fossil exposure, and green ratio across the 50 insurers.

### 7.4 Worked example (one insurer)

Insurer *i = 0* (Allianz) with draws giving `transitionScore = 62, envScore = 71, disclosureScore =
55, targetScore = 48, engagementScore = 66`, `gwp = 80`, `s4 → fossilExposure = 12.5`:

| Output | Computation | Result |
|---|---|---|
| Overall score | (62+71+55+48+66)/5 | **60.4 → 60** |
| Coal exposure | s5×12.5×0.4 | e.g. **2.5%** |
| Oil/gas exposure | 12.5 − 2.5 | **10.0%** |
| Green premium | 80×0.02 + s10×80×0.15 | e.g. **$4.8M** |
| Green ratio | 4.8/80×100 | **6.0%** |

The overall score is arithmetically just the mean of five random numbers — it carries no transition
pathway, stranded-asset, or SCR content.

### 7.5 Companion analytics on the page

- **Fossil-fuel underwriting** — coal/oil/gas exposure and phase-out timelines by insurer.
- **Green insurance products** — 40-product catalogue with growth and loss-ratio.
- **Regulatory & disclosure** — 8-framework compliance table with named key gaps.

### 7.6 Data provenance & limitations

- **Insurer metrics and green products are 100 % synthetic** (`sr()`-seeded); only the names and the
  regulatory-framework table are real.
- The overall transition score is an unweighted mean of five uncorrelated draws — no methodology, no
  materiality weighting, no evidence chain.
- No investment/stranded-asset/liability risk is quantified, and no Solvency II SCR overlay is
  computed, contradicting the guide's `TotalRisk` and ORSA claims.

**Framework alignment:** *NZIA / PSI / SBTi / TCFD / PCAF* — surfaced as membership flags, not
assessed. *EIOPA Solvency II / PRA SS3/19 / NAIC / ISSB S2 / SFDR* — represented in the curated
regulatory table with plausible compliance percentages, but no compliance is measured. *IAIS
Application Paper on Climate* — referenced in the guide, absent from code.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible insurer **transition-risk score** across underwriting, investment, and liability
channels, plus a Solvency II climate SCR overlay — for ESG analysts and ORSA teams assessing
transition exposure in insurance books.

### 8.2 Conceptual approach
Three-channel aggregation: (1) **underwriting** — fossil-fuel GWP × stranding-repricing risk; (2)
**investment** — NGFS-scenario repricing of the asset book (stranded-asset losses); (3) **liability**
— climate D&O/litigation exposure. Benchmarked to PCAF Insurance-Associated Emissions, NZIA
target-setting, and NGFS Phase IV transition shocks; scoring construction mirrors MSCI/Sustainalytics
ESG-rating aggregation with explicit materiality weights.

### 8.3 Mathematical specification
For insurer *j*, scenario *s*:

```
UWRisk_j(s)   = Σ_sector GWP_{j,sector}·repricing_sector(s)            // fossil-heavy sectors weighted
InvRisk_j(s)  = Σ_c Alloc_{j,c}·ΔValue_c(s)                            // NGFS asset repricing
LiabRisk_j(s) = D&O_exposure_j · climate_litigation_intensity(s)
TransScore_j  = 100 − norm( w_UW·UWRisk_j + w_Inv·InvRisk_j + w_Liab·LiabRisk_j )
CATSCR_add_j  = SCR_base_j · climate_scalar(s)                         // Solvency II Pillar-2 overlay
```

| Parameter | Source |
|---|---|
| Sector repricing `repricing_sector(s)` | NGFS Phase IV; IEA NZE stranded-asset shares |
| Asset repricing `ΔValue_c(s)` | NGFS transition shocks; Trucost carbon exposure |
| Litigation intensity | Grantham/Sabin climate-litigation database trends |
| Channel weights `w` | Materiality assessment; NZIA/PCAF guidance |

### 8.4 Data requirements
Per insurer: GWP by sector, investment allocation with carbon exposure, D&O book, base SCR. Platform
has: synthetic scorecard scaffolding and the `insurance_climate_risk.py` engine; needs real GWP-by-
sector, investment-carbon, and litigation feeds plus NGFS repricing tables.

### 8.5 Validation & benchmarking plan
Reconcile transition scores against public NZIA/PCAF insurer disclosures; backtest asset-repricing
losses against NGFS Phase IV published impacts; sensitivity of composite to channel weights; verify
CAT-SCR overlay against EIOPA CCRST.

### 8.6 Limitations & model risk
Insurer-level GWP-by-sector and investment-carbon data are sparse and self-reported; litigation
intensity is hard to quantify; channel weighting is subjective. Fallback: report each channel
separately and the composite as a band, not a precise rank.

## 9 · Future Evolution

### 9.1 Evolution A — Three-channel transition risk on disclosed data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is severe: the promised `TotalRisk = UnderwritingRisk + InvestmentRisk + LiabilityRisk` aggregation does not exist — 50 real insurer names (Allianz, AXA, Swiss Re) carry five independent `sr()` sub-scores averaged into a meaningless composite, fossil exposure and green ratios are draws, NZIA/SBTi memberships are coin-flip gates, and the 40 green products are synthetic. Only the 8-row regulatory-framework table is curated. Real names + fabricated scores is the same reputational defect as `human-rights-risk`. Evolution A implements the §8 three-channel model on *disclosed* data: underwriting risk from insurers' published GWP-by-sector and fossil-underwriting policies (the Insure Our Future scorecard publishes exactly this), investment risk via NGFS repricing of disclosed asset allocations, liability from the Sabin/Grantham climate-litigation databases §8.3 names.

**How.** (1) Ingest the public insurer-disclosure corpus: NZIA/PCAF disclosures, Insure Our Future coal/oil policy scorecards, published sustainability reports for GWP-by-sector where stated — honest nulls elsewhere. (2) Channel scores computed per §8.3 with explicit materiality weights (not the current equal-weight mean of noise); membership flags become verified facts with source links. (3) The Solvency II overlay reuses the shared `insurance_climate_risk` engine's SCR machinery (additive; 5-module blast radius). (4) Phase-out commitments become curated dated facts — several insurers' coal exit years are public record.

**Prerequisites.** The `sr()` insurer scoring deleted or the real names anonymised — the combination must not survive; disclosure-corpus collection effort. **Acceptance:** every insurer's channel scores trace to cited disclosures or show gaps; the composite decomposes into weighted channels; membership and phase-out facts carry source URLs.

### 9.2 Evolution B — Insurer transition-screening copilot (LLM tier 1 → 2)

**What.** A copilot for ESG analysts screening insurance counterparties: "which insurers have credible coal exit commitments and what are the dates?", "compare AXA's and Ping An's fossil underwriting policies", "what does EIOPA's Solvency II sustainability consultation require and where do we stand?" (the curated `REGULATORY_FRAMEWORKS` table with compliance gaps is real grounding). A second high-value behaviour once Evolution A's disclosure corpus exists: extraction assistance — parsing new sustainability reports into the channel-score inputs (GWP-by-sector tables, policy statements), a classic document-to-structured-data LLM task with human confirmation.

**How.** Tier 1: atlas record + regulatory table into the corpus; hard rule that pre-Evolution-A, all insurer-specific scores carry the §7.6 synthetic caveat — no exceptions for named real companies, where fabricated specifics are legally sensitive. Tier 2: tool calls against the Evolution A channel-score endpoints; extraction suggestions land in a review queue, never auto-committed, with page-level citations into the source PDF. Regulatory answers quote the curated framework rows (status, requirements, keyGap) rather than recalled regulation.

**Prerequisites.** Copilot infrastructure; Evolution A for any company-specific quantitative claim; document pipeline for extraction. **Acceptance:** pre-Evolution-A, 100% synthetic-data disclosure on insurer scores; post, every score cites its disclosure source; extractions show source-page provenance and await human confirmation.