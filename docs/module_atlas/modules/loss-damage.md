# Loss & Damage Finance
**Module ID:** `loss-damage` · **Route:** `/loss-damage` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
COP27 Loss and Damage Fund analytics. Covers climate-vulnerable country needs assessment, fund contribution tracking, liability analysis, and historical attribution of climate losses.

> **Business value:** Loss and damage is the emerging frontier of climate finance, creating potential liability for high-emitting countries and companies. The COP27/28 fund is vastly underfunded relative to need. This module tracks the evolving landscape and helps financial institutions assess sovereign L&D exposure in their bond portfolios.

**How an analyst works this module:**
- Overview shows COP fund pledges vs estimated needs
- Vulnerable Country Map shows V20 nations with L&D exposure
- Attribution Analysis links extreme events to human-caused climate change
- Contribution Tracker monitors developed country fund contributions
- Liability Analysis examines historical responsibility for emissions

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `COUNTRIES`, `FUND_COMMITMENTS`, `HAZARDS`, `Kpi`, `PIE_C`, `REGIONS`, `Row`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `FUND_COMMITMENTS` | 19 | `donor`, `pledged`, `disbursed`, `year` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `ndGain` | `Math.round(25+sr(i*7)*45);` |
| `climVulnIdx` | `Math.round(100-ndGain+sr(i*11)*15);` |
| `annualLoss` | `Math.round(100+sr(i*13)*4900);` |
| `gdpPct` | `Math.round(sr(i*17)*120)/10;` |
| `deaths` | `Math.round(50+sr(i*19)*2000);` |
| `displaced` | `Math.round(10+sr(i*23)*500);` |
| `infraDamage` | `Math.round(50+sr(i*29)*3000);` |
| `agriLoss` | `Math.round(20+sr(i*31)*1500);` |
| `needsEstimate` | `Math.round(annualLoss*1.5+sr(i*37)*2000);` |
| `committed` | `Math.round(needsEstimate*sr(i*41)*0.4);` |
| `disbursed` | `Math.round(committed*sr(i*43)*0.6);` |
| `adaptationGap` | `needsEstimate-committed;` |
| `totalPledged` | `FUND_COMMITMENTS.reduce((a,c)=>a+c.pledged,0);` |
| `totalDisbursed` | `FUND_COMMITMENTS.reduce((a,c)=>a+c.disbursed,0);` |
| `exportCSV` | `(rows,fn)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.create` |
| `totalLoss` | `COUNTRIES.reduce((a,c)=>a+c.annualLoss,0);` |
| `totalNeeds` | `COUNTRIES.reduce((a,c)=>a+c.needsEstimate,0);` |
| `totalCommitted` | `COUNTRIES.reduce((a,c)=>a+c.committed,0);` |
| `byYear` | `[{year:'2023',pledged:FUND_COMMITMENTS.filter(f=>f.year===2023).reduce((a,c)=>a+c.pledged,0),disbursed:FUND_COMMITMENTS.filter(f=>f.year===2023).reduce((a,c)=>a+c.disbursed,0)},{year:'2024',pledged:FUND_COMMITMENTS.filte` |
| `regionLoss` | `REGIONS.map(r=>({name:r,loss:Math.round(COUNTRIES.filter(c=>c.region===r).reduce((a,c)=>a+c.annualLoss,0)),count:COUNTRIES.filter(c=>c.region===r).length}));` |
| `sorted` | `[...COUNTRIES].sort((a,b)=>b[vulnMetric]-a[vulnMetric]);` |
| `top20` | `sorted.slice(0,20).map(c=>({name:c.name.slice(0,12),ndGain:c.ndGain,climVulnIdx:c.climVulnIdx}));` |
| `regionVuln` | `REGIONS.map(r=>{const cs=COUNTRIES.filter(c=>c.region===r);return{name:r,avgNdGain:Math.round(cs.reduce((a,c)=>a+c.ndGain,0)/(cs.length\|\|1)),avgVuln:Math.round(cs.reduce((a,c)=>a+c.climVulnIdx,0)/(cs.length\|\|1)),count:cs` |
| `gapData` | `filtered.slice(0,20).map(c=>({name:c.name.slice(0,12),needs:Math.round(c.needsEstimate/100),committed:Math.round(c.committed/100),gap:Math.round(c.adaptationGap/100)}));` |
| `investOpp` | `COUNTRIES.filter(c=>c.adaptationGap>investMin).sort((a,b)=>b.adaptationGap-a.adaptationGap);` |
| `totalGap` | `COUNTRIES.reduce((a,c)=>a+c.adaptationGap,0);` |
| `regionGap` | `REGIONS.map(r=>{const cs=COUNTRIES.filter(c=>c.region===r);return{name:r,gap:Math.round(cs.reduce((a,c)=>a+c.adaptationGap,0)),needs:Math.round(cs.reduce((a,c)=>a+c.needsEstimate,0)),committed:Math.round(cs.reduce((a,c)=` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/loss-damage/frld-eligibility` | `frld_eligibility_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/parametric-design` | `parametric_design_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/wim-access` | `wim_access_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/ld-gap-analysis` | `ld_gap_analysis_endpoint` | api/v1/routes/loss_damage.py |
| POST | `/api/v1/loss-damage/ld-portfolio` | `ld_portfolio_endpoint` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/v20-members` | `ref_v20_members` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/frld-criteria` | `ref_frld_criteria` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/global-shield` | `ref_global_shield` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/parametric-triggers` | `ref_parametric_triggers` | api/v1/routes/loss_damage.py |
| GET | `/api/v1/loss-damage/ref/loss-event-types` | `ref_loss_event_types` | api/v1/routes/loss_damage.py |

### 2.3 Engine `loss_damage_engine` (services/loss_damage_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_as_float` | value | Coerce to float, returning None for missing/blank/uncoercible inputs. |
| `calculate_frld_eligibility` | country_data, loss_event | Calculate FRLD fund eligibility and indicative allocation for a country/loss event. Real inputs (optional, None-safe): ``nd_gain_score`` (ND-GAIN vulnerability, 0..1), ``gdp_usd`` (national GDP). When ``nd_gain_score`` is absent the eligibility score and vulnerability-weighted allocation are returned as None (honest null) with a data flag, since both depend on the reported vulnerability. When ``gd |
| `design_parametric_trigger` | trigger_data | Design a parametric insurance trigger with payout structure and basis risk assessment. Real inputs (optional, None-safe): ``max_payout_usd`` (contract limit), ``trigger_probability`` (annual exceedance / attachment probability of the index, 0..1), ``loading_factor`` (insurer gross-to-net loading multiplier). Basis-risk score is taken directly from the calibrated index reference data (deterministic |
| `assess_wim_access` | country_data | Assess WIM function scores and Santiago Network eligibility. Real inputs (optional, None-safe, each 0..1): ``risk_knowledge_score``, ``retention_transfer_score``, ``rehabilitation_score`` — reported WIM function capacity indicators. Each is an entity-reported figure and is returned as None (honest null) when not supplied; the composite WIM access score is computed only from the sub-scores that are |
| `calculate_residual_ld_gap` | country_data, coverage_data | Calculate total L&D and residual gap after insurance, FRLD, and WIM support. Real inputs (optional, None-safe): ``total_economic_loss_usd`` (realised or modelled event loss) OR ``gdp_usd`` + ``loss_pct_gdp`` (from which the loss is computed); ``non_economic_loss_score`` (0..1 reported); ``insurance_penetration``, ``frld_share``, ``global_shield_share``, ``wim_support_share`` (coverage fractions, 0 |
| `aggregate_ld_portfolio` | portfolio | Aggregate L&D exposure and coverage metrics across a multi-country portfolio. Real inputs (optional, None-safe): ``total_aum_usd`` (portfolio size); per-holding ``country_iso``, ``exposure_usd`` (required per holding — a holding without a reported exposure is skipped and flagged rather than fabricated), ``dominant_event_type``, and optional ``ld_rate`` / ``insurance_penetration`` overrides. When p |

### 2.3 Engine `loss_damage_finance_engine` (services/loss_damage_finance_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `LossDamageFinanceEngine._profile` | country_iso |  |
| `LossDamageFinanceEngine._tier` | p |  |
| `LossDamageFinanceEngine._premium_cat` | p |  |
| `LossDamageFinanceEngine._wim_pillars_for_event` | event_type |  |
| `LossDamageFinanceEngine.assess_loss_damage_finance` | country_iso, event_type, economic_loss_usd |  |
| `LossDamageFinanceEngine.calculate_protection_gap` | country_iso, total_loss_usd, insured_loss_usd, sector |  |
| `LossDamageFinanceEngine.design_parametric_trigger` | country_iso, peril, coverage_amount_usd_mn, preferred_payout_speed_days |  |
| `LossDamageFinanceEngine.assess_regional_mechanism` | country_iso, annual_exposure_usd_mn, desired_perils |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `Green`, `World`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `recommendations`, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `FUND_COMMITMENTS`, `HAZARDS`, `PIE_C`, `REGIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| L&D Fund Pledged | — | COP28 2023 | Significantly less than estimated need of $400B+ annually |
| V20 Country Needs | — | Vulnerable Group | Estimated annual loss and damage in most vulnerable countries |
| Attribution Science Coverage | — | World Weather Attribution | Fraction of major events with rapid attribution analysis |
- **Climate event data** → Attribution analysis → **Climate-attributable loss fraction**
- **Country economic data** → L&D needs assessment → **Vulnerable country financing gap**
- **Fund pledge data** → Gap analysis → **Finance adequacy assessment**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/loss-damage/ref/frld-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['access_criteria', 'fund_initial_capitalisation_bn_usd', 'pledges_at_cop28_bn_usd', 'host_institution', 'governing_board', 'decision', 'note'], 'n_keys': 7}`

**GET /api/v1/loss-damage/ref/global-shield** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['pillars', 'total_committed_bn_usd', 'coverage_countries', 'g7_launch', 'v2_update', 'flagship_instruments', 'target_2025'], 'n_keys': 7}`

**GET /api/v1/loss-damage/ref/loss-event-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['event_types', 'total_types', 'wim_action_areas', 'global_annual_ld_bn_usd', 'insured_pct', 'source'], 'n_keys': 6}`

**GET /api/v1/loss-damage/ref/parametric-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['triggers', 'total_indices', 'standard', 'basis_risk_mitigation', 'settlement_process'], 'n_keys': 5}`

**GET /api/v1/loss-damage/ref/v20-members** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['v20_members', 'total_members', 'combined_gdp_bn_usd', 'combined_population_mn', 'annual_ld_bn_usd', 'description', 'founding', 'secretariat'], 'n_keys': 8}`

**POST /api/v1/loss-damage/frld-eligibility** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/loss-damage/ld-gap-analysis** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['status', 'country_iso', 'country_name', 'event_type', 'total_economic_loss_usd', 'non_economic_loss_score', 'coverage_breakdown', 'residual_ld_gap_usd', 'insurance_coverage_ratio', 'gap_financing_instruments', 'non_economic_note'], 'n_keys': 11}`

**POST /api/v1/loss-damage/ld-portfolio** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Loss and damage attribution
**Headline formula:** `L&D = Economic_losses + Non_economic_losses attributable to climate change`

Economic L&D: GDP loss, infrastructure damage, crop failure — quantifiable. Non-economic: cultural heritage, biodiversity, human lives — harder to monetise. Attribution science: fraction of extreme event probability attributable to anthropogenic climate change.

**Standards:** ['UNFCCC L&D Fund', 'Shukla & James Attribution Science', 'V20 Vulnerable Group']
**Reference documents:** UNFCCC Santiago Network for Loss and Damage; V20 Vulnerable Group of Ministers; World Weather Attribution Project; COP28 L&D Fund Governance Framework

**Engine `loss_damage_engine` — extracted transformation lines:**
```python
vuln_mult = 1 + (1 - nd_gain_score) * 0.5
annual_ld = gdp_usd * FRLD_GDP_LOSS_BASE_FRACTION * event_multiplier * freq
frld_coverage_ratio = min(0.80, indicative_alloc / annual_ld)
expected_payout = max_payout * trigger_prob
expected_payout = max_payout * trigger_prob * 0.5
expected_payout = max_payout * trigger_prob * 0.6
payout_at_attach = max_payout * 0.3
loading_factor = DEFAULT_PREMIUM_LOADING_FACTOR + basis_risk * BASIS_RISK_LOADING_COEFF
premium = expected_payout * loading_factor
payout_at_attach = max_payout * 0.3
total_economic_loss = gdp * loss_pct_gdp / 100
insurance_covered = total_economic_loss * ins_penetration
frld_eligible = total_economic_loss * frld_share
global_shield = total_economic_loss * global_shield_share
wim_support = total_economic_loss * wim_support_share
residual_gap = max(0.0, total_economic_loss - insurance_covered - frld_eligible - global_shield - wim_support)
coverage_ratio = round((total_economic_loss - residual_gap) / total_economic_loss, 4) if total_economic_loss else None
ld = exp * ld_rate
res_gap = ld * (1 - ins_pen)
ann_payout = ld * ins_pen
v20_concentration_pct=round(v20_concentration * 100, 2) if v20_concentration is not None else None,
```

**Engine `loss_damage_finance_engine` — extracted transformation lines:**
```python
attributed_usd = economic_loss_usd * far
unattributed_usd = economic_loss_usd * (1.0 - far)
estimated_insured = economic_loss_usd * insured_pct / 100.0
gap_usd = economic_loss_usd - estimated_insured
estimated_insured = economic_loss_usd * 0.05
gap_usd = economic_loss_usd * 0.95
gap_usd = max(total_loss_usd - insured_loss_usd, 0.0)
gap_pct = (gap_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
actual_pen = (insured_loss_usd / total_loss_usd * 100.0) if total_loss_usd > 0 else 0.0
feasible_insured = total_loss_usd * feasible_pct / 100.0
residual_gap = max(total_loss_usd - feasible_insured, 0.0)
annual_premium = total_loss_usd * premium_rate
basis = min(basis + 0.08, 0.60)
basis = min(basis + 0.05, 0.55)
match_pct = len(overlap) / len(desired_perils) * 100.0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The assignment record lists two real backend engines
> (`backend/services/loss_damage_engine.py`, `loss_damage_finance_engine.py`) and 8 live API routes
> (`/frld-eligibility`, `/ld-gap-analysis`, `/ld-portfolio`, plus `ref/*` endpoints). **The frontend
> page makes no `axios`/`fetch` call anywhere in the file** — every figure the user sees comes from a
> static, `sr()`-seeded 40-country array generated client-side. The real backend engines exist in the
> codebase but are orphaned from this page, exactly as found in the sibling `just-transition` module.

### 7.1 What the module computes

40 named vulnerable countries (Pakistan, Bangladesh, Ethiopia, Nigeria, Mozambique, Philippines,
Fiji, Tuvalu, Maldives, and 31 more) across 8 regions, each with a **chained** set of synthetic
metrics — unlike several sibling modules, several fields here genuinely derive from one another
rather than being independently random:

```js
ndGain         = 25 + sr(i*7)*45                       // 25-70 (ND-GAIN-style readiness score)
climVulnIdx    = 100 - ndGain + sr(i*11)*15             // inversely related to ndGain, plus noise
annualLoss     = 100 + sr(i*13)*4900                    // $100-5000M
needsEstimate  = annualLoss*1.5 + sr(i*37)*2000         // derived from annualLoss
committed      = needsEstimate * sr(i*41) * 0.4         // derived from needsEstimate — 0-40% funded
disbursed      = committed * sr(i*43) * 0.6             // derived from committed — 0-60% disbursed
adaptationGap  = needsEstimate - committed              // exact arithmetic identity
```

### 7.2 Parameterisation

| Field | Provenance |
|---|---|
| 40 country names, 8-region assignment | Real, correctly-classified climate-vulnerable countries |
| `ndGain`, `annualLoss`, `deaths`, `displaced`, `infraDamage`, `agriLoss` base values | Synthetic demo values, `sr()`-seeded per country |
| `needsEstimate`, `committed`, `disbursed`, `adaptationGap` | **Genuinely chained** — each derives from the previous field via a real multiplicative relationship, not an independent draw (a methodological improvement over several sibling L&D-adjacent modules where cost-to-close figures are unrelated random draws) |
| `FUND_COMMITMENTS` (18 donors) | Real donor countries/blocs (Germany, UAE, Japan, France, Italy, UK, EU, USA, Canada, Denmark, Austria, Ireland, Norway, Spain, Netherlands, Belgium, Sweden, Switzerland) with plausible pledge/disbursement figures broadly consistent with the real COP28 L&D Fund's initial ~$700M in pledges (summing the 18 rows gives a total in that order of magnitude) | Static, hand-entered, directionally realistic |
| `lossHistory` (8-year per-country series), `hazardBreakdown` (5-hazard split per country) | Synthetic, `sr()`-seeded around each country's base `annualLoss` |

### 7.3 Calculation walkthrough

- **Fund Tracker tab**: `totalPledged/totalDisbursed = Σ` over `FUND_COMMITMENTS`;
  `disbursementRate = disbursed/pledged×100` per donor — correct, simple arithmetic on the static
  donor table.
- **Climate Loss Quantification tab**: `totalLoss = Σ annualLoss`, `avgGdpImpact = mean(gdpPct)`,
  `totalDeaths/totalDisplaced = Σ`; per-selected-country panel shows `lossHistory` (area chart) and
  `hazardBreakdown` (pie) both re-derived from that country's `annualLoss` base with independent
  per-year/per-hazard noise.
- **Vulnerability Assessment tab** (inferred from `vulnMetric` state and `top20`/`regionVuln`
  computations in the record): ranks countries by `ndGain` or `climVulnIdx` and aggregates by region
  (`avgNdGain`, `avgVuln` per region).
- **Financing Gap Analysis tab**: `investOpp = countries.filter(adaptationGap > investMin).sort(desc)`
  — an investment-screening filter on the (derived) adaptation gap; `regionGap` aggregates
  `needsEstimate`/`committed`/`gap` by region.

### 7.4 Worked example

Pakistan (`i=0`): `ndGain = 25 + sr(0)×45 = 25 + 0.7095×45 ≈ 56.9 → round → 57`.
`climVulnIdx = round(100 − 57 + sr(11)×15)`. `sr(11) = frac(sin(12)×10000)`; `sin(12 rad) ≈ -0.5366`
→ `frac(-5365.7) = 0.266` → `climVulnIdx = round(43 + 0.266×15) = round(46.99) = 47`.
`annualLoss = round(100 + sr(13)×4900)`; `sr(13) = frac(sin(14)×10000)`, `sin(14)≈0.9906` →
`frac(9906.1)=0.113` → `annualLoss ≈ round(100+553.7) = 654` ($M). `needsEstimate = round(654×1.5 +
sr(37)×2000)`; taking `sr(37)≈0.4` (illustrative) → `needsEstimate ≈ round(981+800) = 1781`.
`committed = round(1781 × sr(41) × 0.4)`; at `sr(41)≈0.5` → `committed ≈ round(1781×0.2) = 356`.
`adaptationGap = 1781 − 356 = 1425` ($M) — a real subtraction, not a separately-drawn random value.

### 7.5 Data provenance & limitations

- **No live backend call occurs** — the two listed backend engines
  (`loss_damage_engine.py`/`loss_damage_finance_engine.py`) and their 8 documented API routes are
  real, substantive Python services elsewhere in the codebase, but this page does not invoke them.
  A production wiring should replace the client-side synthetic generator with real calls to
  `/api/v1/loss-damage/ld-gap-analysis` and `/frld-eligibility`.
- Base metrics (`ndGain`, `annualLoss`, `deaths`, etc.) remain synthetic even though several
  downstream metrics are correctly *chained* from them — the chain's starting values are still not
  real ND-GAIN Index scores or EM-DAT loss figures.
- `FUND_COMMITMENTS` totals are static 2023-2025 snapshot figures; a live tracker should refresh
  against actual UNFCCC L&D Fund Board disbursement reports.

**Framework alignment:** UNFCCC L&D Fund (COP27/28), Santiago Network, V20 Vulnerable Group, and
World Weather Attribution are correctly named in the guide as the relevant real institutions; the
donor list and country selection are consistent with real L&D Fund geography. The guide's
"Attribution Science" data point (90%+ event coverage) is not computed anywhere in the frontend —
`climateAttributedLosses`-style attribution fractions do not appear in this module's fields.

## 9 · Future Evolution

### 9.1 Evolution A — Connect the honest engines to the fabricating page (analytics ladder: rung 2 → 3)

**What.** This module has the platform's characteristic split at its starkest: two genuinely well-designed backend engines — `loss_damage_engine.py` (FRLD eligibility with honest nulls when ND-GAIN is absent, parametric triggers with deterministic calibrated basis risk, WIM access scoring, residual-gap analysis, portfolio aggregation that *skips and flags* holdings without reported exposure rather than fabricating) and `loss_damage_finance_engine.py` (protection gaps, regional mechanisms) behind 10 live routes — while the page renders 50+ countries of `sr()` draws (`ndGain = 25 + sr(i·7)·45`, `annualLoss`, `needsEstimate = annualLoss·1.5 + noise`, `committed = needs·sr·0.4`). Only the 19-row `FUND_COMMITMENTS` donor table looks curated. Evolution A wires page to engines: ND-GAIN scores from the real ND-GAIN index (public download), loss profiles from EM-DAT aggregates, needs/gap figures from `calculate_residual_ld_gap`, and the sovereign-bond exposure view from `aggregate_ld_portfolio` over actual portfolio holdings.

**How.** (1) ND-GAIN + EM-DAT ingestion (shared with the sibling `loss-and-damage-finance` evolution — one data layer, two pages). (2) The donor `FUND_COMMITMENTS` table gains citations and a review date (pledge figures are public UNFCCC records — this is curation). (3) The liability/attribution tab grounds in published attribution studies (WWA) as curated references rather than computed claims. (4) The engines' honest-null and skip-and-flag conventions surface in the UI — a country without reported data renders the gap explicitly, which for L&D is itself the analytical point.

**Prerequisites.** The `sr()` country panel deleted; data ingestion; sibling-page coordination. **Acceptance:** ND-GAIN values match the published index; needs/gap figures trace to engine calls; portfolio aggregation flags unreported holdings exactly as the engine's docstring specifies; donor pledges carry citations.

### 9.2 Evolution B — Sovereign L&D exposure analyst for bond portfolios (LLM tier 2)

**What.** The module's finance-sector purpose — "assess sovereign L&D exposure in bond portfolios" — is a cross-referencing task the engine's `aggregate_ld_portfolio` already structures: "which of our sovereign holdings sit in high-L&D-tier countries, and what share of exposure is uninsured?", "how would Global Shield coverage change Bangladesh's residual gap?", "compare pledged vs disbursed for the fund's top donors and what that implies for disbursement risk." Tier 2 executes these against the live routes, with the reference GETs (FRLD criteria, Global Shield, parametric triggers) grounding mechanism questions.

**How.** Tool schemas over both engines' route families; portfolio answers respect the engine's skip-and-flag convention — "3 of 14 sovereign holdings lack reported exposure and are excluded" leads the answer, not a footnote. Donor-tracking answers quote the curated commitments table with vintage; liability-analysis questions (historical responsibility) are handled as framework explanation over curated attribution references, never as computed legal liability — §1's "potential liability" framing is exactly where an LLM overstepping into legal conclusions would be dangerous, so the copilot describes the debate and cites sources. Tier assignments and premium categories quote the finance engine's `_tier`/`_premium_cat` outputs.

**Prerequisites.** Evolution A's data wiring (tool calls against engines fed with real country data); Phase 2 infrastructure. **Acceptance:** every exposure figure traces to a logged engine call with exclusions stated; mechanism facts match reference-route payloads; liability discussion cites sources and renders no legal conclusions.