# Insurance Climate Hub
**Module ID:** `insurance-climate-hub` · **Route:** `/insurance-climate-hub` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides an integrated climate analytics hub for insurance companies spanning underwriting risk (physical hazard exposure), reserving adjustments (climate trend loading), investment portfolio climate alignment, and regulatory stress testing under EIOPA and PRA climate scenario requirements.

> **Business value:** Enables insurance companies to integrate climate risk across underwriting, reserving, and investment functions, meet EIOPA and PRA regulatory climate risk management expectations, and produce quantitative climate scenario analyses for TCFD disclosures and regulatory stress test submissions.

**How an analyst works this module:**
- Configure the underwriting portfolio by peril, geography, and line of business, and select the climate loading scenario.
- Review the climate-adjusted combined ratio by peril category and compare against technical pricing assumptions.
- Analyse the investment portfolio climate VaR using the NGFS scenario stress test module.
- Generate the EIOPA/PRA climate risk disclosure pack including scenario narrative and quantitative impact assessments.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `DATA_SOURCES`, `DOMAINS`, `DOMAIN_COLORS`, `DOMAIN_WEIGHTS_DEFAULT`, `KRIS`, `KpiCard`, `MATERIALITY_RATINGS`, `PEER_INSURERS`, `PEER_SCORES`, `REGULATORS`, `REGULATORY_MILESTONES`, `TabBtn`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `REGULATORY_MILESTONES` | 21 | `regulator`, `due`, `status`, `jurisdiction`, `priority`, `daysRemaining` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `DATA_SOURCES` | `['Internal Models','Third-Party Data','Regulator Data','Market Data','Climate Science'];` |
| `domainIdx` | `Math.floor(sr(i * 19 + 1) * 8);` |
| `matIdx` | `Math.floor(sr(i * 19 + 2) * 4);` |
| `threshold` | `+(sr(i * 19 + 3) * 80 + 20).toFixed(1);` |
| `value` | `+(sr(i * 19 + 4) * 90 + 10).toFixed(1);` |
| `trend` | `Array.from({ length: 5 }, (_, j) => +(value * (0.85 + sr(i * 19 + 5 + j) * 0.3)).toFixed(1));` |
| `peer` | `+(sr(i * 19 + 10) * 70 + 25).toFixed(1);` |
| `PEER_SCORES` | `PEER_INSURERS.map((p, i) => DOMAINS.map((_, di) => +(sr(i * 89 + di + 1) * 45 + 40).toFixed(1)));` |
| `totalWeight` | `domainWeights.reduce((a, b) => a + b, 0);` |
| `domainScores` | `DOMAINS.map((domain, di) => {` |
| `avgValue` | `domainKRIs.reduce((s, k) => s + k.value, 0) / domainKRIs.length;` |
| `weightedSum` | `domainScores.reduce((s, score, i) => s + score * domainWeights[i], 0);` |
| `domainCards` | `useMemo(() => DOMAINS.map((domain, di) => {` |
| `score` | `Math.min(100, Math.max(0, +(100 - avgValue * 0.3).toFixed(1)));` |
| `trajectoryData` | `useMemo(() => Array.from({ length: 5 }, (_, ti) => { const obj = { period: `Q${ti + 1}` };` |
| `avg` | `kris.reduce((s, k) => s + (k.trend[ti] \|\| k.value), 0) / kris.length;` |
| `breachData` | `useMemo(() => DOMAINS.map((domain, di) => ({` |
| `peerRadarData` | `useMemo(() => DOMAINS.map((domain, di) => {` |
| `percentileRankings` | `useMemo(() => DOMAINS.map((domain, di) => {` |
| `peerScoresDomain` | `PEER_SCORES.map(ps => ps[di]);` |
| `percentile` | `+((rank / (PEER_INSURERS.length + 1)) * 100).toFixed(1);` |
| `stressImpacts` | `useMemo(() => [ { scenario: 'Climate 1.5°C Orderly', overallScore: +(overallScore * 0.97).toFixed(1), kriBreaches: KRIS.filter(k => k.breaching).length }, { scenario: 'Hot House World 3°C', overallScore: +(overallScore * 0.82).toFixed(1), kriBreaches: KRIS.filter(k => k.breaching).length + 7 }, { scenario: 'NatCat Mega-Event', overallScor` |
| `obj` | `{ period: `Q${ti + 1}` };` |
| `breachProb` | `k.threshold > 0 ? +Math.min(200, Math.max(0, (k.value - k.threshold) / k.threshold * 100)).toFixed(1) : 0;` |
| `last` | `k.trend[k.trend.length - 1] \|\| 1;` |
| `deltaP` | `first > 0 ? ((last - first) / first * 100).toFixed(1) : '0.0';` |
| `totalW` | `Object.values(domainWeights).reduce((s, v) => s + v, 0) \|\| 1;` |
| `currentScore` | `ACTUARIAL_DOMAINS.reduce((sum, _, i) => sum + (domainScores[i] \|\| 0) * domainWeights[i] / totalW, 0);` |
| `upWeight` | `{ ...domainWeights, [di]: Math.min(domainWeights[di] + 10, 50) };` |
| `upTotal` | `Object.values(upWeight).reduce((s, v) => s + v, 0) \|\| 1;` |
| `upScore` | `ACTUARIAL_DOMAINS.reduce((sum, _, i) => sum + (domainScores[i] \|\| 0) * upWeight[i] / upTotal, 0);` |
| `peerColScores` | `PEER_SCORES.map(p => p.scores[di]);` |
| `peerAvg` | `peerColScores.length ? peerColScores.reduce((s, v) => s + v, 0) / peerColScores.length : 0;` |
| `gap` | `ourScore - peerBest;` |
| `statusColor` | `gap >= 0 ? T.green : gap > -10 ? T.amber : T.red;` |
| `statusLabel` | `gap >= 0 ? 'Leader' : gap > -10 ? 'Follower' : 'Laggard';` |

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
**Frontend seed datasets:** `DATA_SOURCES`, `DOMAINS`, `DOMAIN_COLORS`, `DOMAIN_WEIGHTS_DEFAULT`, `MATERIALITY_RATINGS`, `PEER_INSURERS`, `REGULATORS`, `REGULATORY_MILESTONES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Climate Loading Factor (%) | — | IPCC AR6 / Cat model vendors | Percentage uplift applied to base expected losses for climate-sensitive perils; flood loading 15â€“25%; windstorm 5â€“12%; wildfire 20â€“40% in fire-prone regions. |
| Climate-Adjusted Combined Ratio | — | EIOPA stress test benchmarks | Combined ratio after applying climate loading; above 100% indicates technical underwriting loss; EIOPA 2022 stress test median was 108%. |
| Physical Risk Underwriting Exposure (%) | — | Cat model / GIS analysis | Share of gross written premium exposed to climate-sensitive perils in high-risk geographies as defined by IPCC RCP8.5 scenarios. |
| Investment Portfolio Climate VaR (%) | — | NGFS scenario analysis | Maximum investment portfolio loss at 95% confidence under NGFS Disorderly transition scenario; relevant for Solvency II investment risk capital. |
- **Underwriting portfolio data by peril and geography** → Apply climate loading factors from IPCC AR6 hazard trajectories → **Climate-adjusted expected loss ratio by peril**
- **Investment portfolio holdings** → Run NGFS climate scenario stress test on asset values → **Investment portfolio climate VaR**
- **Catastrophe model outputs (RMS/AIR)** → Integrate climate change module, compare to base case → **Climate-loaded cat model loss estimates**

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
**Methodology:** Climate-Loaded Combined Ratio
**Headline formula:** `CRclimate = (Claims_base × (1 + ClimateLoading) + Expenses) / Net_Premium`

Adjusts the traditional combined ratio by applying a climate loading factor to the expected loss ratio, reflecting increased claim frequency and severity under climate change scenarios. The loading factor is derived from peril-specific physical risk projections (flood, windstorm, wildfire, drought) calibrated to IPCC AR6 hazard intensity trajectories.

**Standards:** ['EIOPA Opinion on Sustainability in Solvency II (2021)', 'PRA SS3/19 Climate Financial Risk', "Lloyd's of London Climate Risk Appetite Framework"]
**Reference documents:** EIOPA â€” Opinion on Sustainability in Solvency II (2021); PRA Supervisory Statement SS3/19 â€” Enhancing Banks' and Insurers' Approaches to Managing Climate Risk (2019); IPCC AR6 WG1 Chapter 11 â€” Weather and Climate Extreme Events (2021); Lloyd's â€” Climate Risk Appetite Framework (2022)

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
| `insurance-protection-gap` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `climate-underwriting-workbench` | engine:insurance_climate_risk, table:exc, table:insurance_climate_assessments, table:insurance_climate_entities, table:sqlalchemy |
| `supply-chain-esg-hub` | table:exc, table:sqlalchemy |
| `supply-chain-resilience` | table:exc, table:sqlalchemy |
| `supply-chain-contagion` | table:exc, table:sqlalchemy |
| `supply-chain-emissions-mapper` | table:exc, table:sqlalchemy |
| `supply-chain-carbon` | table:exc, table:sqlalchemy |
| `supply-chain-map` | table:exc, table:sqlalchemy |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Climate-Loaded Combined
> Ratio** engine — `CRclimate = (Claims×(1+ClimateLoading)+Expenses)/NetPremium` — with peril-specific
> loading factors. **The frontend page computes no combined ratio.** It is a **KRI (Key Risk
> Indicator) scorecard**: 40 synthetic KRIs across 8 actuarial domains, aggregated into a
> weighted domain score and an overall climate-risk score, plus peer benchmarking and scenario
> stress. A well-built **backend engine** (`insurance_climate_risk.py`) *does* implement Solvency II
> CAT/TP/SCR maths, but the page does not call it — the four `GET/POST /api/v1/insurance/*` trace
> labels are declared, yet all rendered numbers come from local `sr()`-seeded `KRIS`. Sections below
> document the page as coded, then §8 specifies the missing loaded-CR model.

### 7.1 What the module computes

Each of 40 KRIs is a PRNG draw with a threshold and a 5-quarter trend:

```js
value      = sr(i·19+4)·90 + 10          // 10–100
threshold  = sr(i·19+3)·80 + 20          // 20–100
breaching  = value > threshold
```

Domain and overall scores invert the mean KRI value into a 0–100 health score:

```js
avgValue   = Σ domainKRIs.value / domainKRIs.length
score      = clamp(100 − avgValue·0.3, 0, 100)              // per domain
weightedSum= Σ domainScores·domainWeights ; overallScore = weightedSum / Σ weights
```

Peer percentile ranking counts how many of 10 peers a domain outscores:

```js
percentile = rank / (PEER_INSURERS.length + 1) × 100
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Domains (8) | Physical, Transition, Underwriting, Reserve Adequacy, Solvency Capital, Regulatory, Governance, Cat Modelling | Fixed taxonomy |
| Default domain weights | 15,15,12,12,12,12,11,11 (Σ=100) | Author judgement |
| KRI `value`/`threshold`/`trend`/`peer` | `sr()`-seeded | Synthetic (`sr(s)=frac(sin(s+1)×10⁴)`) |
| Score inversion factor | `100 − avgValue×0.3` | Heuristic mapping value→health |
| Stress multipliers | 1.5 °C Orderly ×0.97; Hot House 3 °C ×0.82; NatCat Mega ×(lower) | Hard-coded scenario haircuts on overallScore |
| `PEER_SCORES` (10 insurers × 8 domains) | `sr(i·89+di+1)·45+40` | Synthetic peer matrix (AXA, Allianz, Munich Re…) |
| `REGULATORY_MILESTONES` | 20 curated deadlines | Real regulators (EIOPA, PRA, NAIC, IAIS…), demo dates |

### 7.3 Calculation walkthrough

1. 40 KRIs seeded → grouped by domain via `domainIdx`.
2. Per-domain average value → inverted to a 0–100 `score`.
3. Domain scores weighted (adjustable via `domainWeights`, renormalised by `totalWeight`) → overall.
4. Trajectory tab averages KRI `trend[ti]` per domain over 5 quarters.
5. Breach tab computes `breachProb = clamp((value−threshold)/threshold×100, 0, 200)`.
6. Peer tabs build a radar and percentile ranking against the synthetic peer matrix.
7. Stress tab applies fixed scenario multipliers to `overallScore` and adds KRI-breach counts.

### 7.4 Worked example (one domain)

Suppose "Physical Risk" contains 5 KRIs with values {72, 55, 88, 40, 61}:

| Step | Computation | Result |
|---|---|---|
| avgValue | (72+55+88+40+61)/5 | 63.2 |
| domain score | clamp(100 − 63.2×0.3, 0, 100) | **81.0** |
| weight | 15 (default) | — |
| contribution to overall | 81.0 × 15 | 1,215 |
| overall (illustrative) | Σ contributions / Σ weights (100) | e.g. **~78** |
| Hot House 3 °C stress | 78 × 0.82 | **64.0** |

### 7.5 Companion analytics on the page

- **Breach dashboard** — per-domain breach probability and count.
- **Peer radar / percentile** — domain vs synthetic peer matrix; Leader/Follower/Laggard status
  from `gap = ourScore − peerBest`.
- **What-if weighting** — raising a domain weight (+10, cap 50) recomputes the weighted overall.
- **Regulatory calendar** — 20 milestones with days-remaining and priority.

### 7.6 Data provenance & limitations

- **Frontend is 100 % synthetic** — all 40 KRIs, trends, and the 10×8 peer matrix are `sr()`-seeded.
- The **backend engine is real and unused by this page**: `insurance_climate_risk.py` implements
  peril×scenario CAT multipliers (Swiss Re sigma / EIOPA CCRST), Solvency II CAT-SCR add-ons
  (Delegated Reg. Annex XIII factors), TP uplift (EIOPA 2024), reserve adequacy, and protection gap
  — none of which the hub page invokes.
- The score inversion (`100 − value×0.3`) is a display heuristic, not an actuarial transform.
- The combined-ratio methodology in the guide is entirely absent from code.

**Framework alignment:** *EIOPA Opinion on Sustainability in Solvency II* / *PRA SS3/19* — the domain
taxonomy and regulatory calendar reference these regimes; the backend engine encodes Solvency II CAT
SCR and TP uplift, but the page surfaces only KRI scores. *Lloyd's RDS* — cited in the engine header.
*IPCC AR6 hazard trajectories* — the guide's loading factors derive from AR6, but the page uses fixed
scenario multipliers instead.

## 8 · Model Specification

**Status: specification — not yet implemented in code (on the frontend; the backend implements the
CAT/SCR portion but is not wired to this page).**

### 8.1 Purpose & scope
Compute a **climate-loaded combined ratio** and Solvency II climate-capital view per line of business
and peril, driving underwriting-appetite and reserving decisions — the metric the guide promises but
the page omits.

### 8.2 Conceptual approach
Load the expected loss ratio with peril-specific climate multipliers calibrated to IPCC AR6 hazard
trajectories and vendor cat-model climate-conditioned event sets (mirroring the platform's own
`insurance_climate_risk.py`, plus RMS/Verisk climate-conditioned catalogues and EIOPA's CCRST 2022
stress design). Combine with Solvency II CAT SCR to give a capital-aware CR.

### 8.3 Mathematical specification
For line of business *l*, peril *p*, scenario *s*, horizon *t*:

```
Loading_{p,s,t}  = m_{p}(s,t) − 1                              // m from _CAT_LOSS_MULTIPLIER table
ExpLoss_l(s,t)   = ExpLoss_l^base · (1 + Σ_p share_{l,p}·Loading_{p,s,t})
CR_l(s,t)        = (ExpLoss_l(s,t) + Expenses_l) / NetPremium_l
CATSCR_addon_l   = GWP_l · Σ_p f_p^{SII} · max(0, m_p(s,t)−1)  // f from Annex XIII factors
SolvencyRatio    = OwnFunds / (SCR_base + Σ_l CATSCR_addon_l)
```

| Parameter | Source |
|---|---|
| Peril×scenario multipliers `m_p(s,t)` | Swiss Re sigma; EIOPA CCRST 2022; already in `_CAT_LOSS_MULTIPLIER` |
| SII CAT factors `f_p^{SII}` | Solvency II Delegated Reg. (EU) 2015/35 Annex XIII; already in engine |
| Peril exposure shares `share_{l,p}` | Portfolio GWP by peril/geography |
| Base loss/expense ratios | Actuarial pricing basis |

### 8.4 Data requirements
Portfolio by LOB × peril × geography (GWP, exposure, base loss ratio, expenses), reinsurance
structure, own funds, SCR. The platform **already has** the multiplier tables, SII factors, TP-uplift
table and a full `calculate_insurance_climate_risk` function — the gap is wiring the page to
`POST /api/v1/insurance/calculate` instead of local `sr()` data.

### 8.5 Validation & benchmarking plan
Reconcile CR loadings and CAT-SCR add-ons against EIOPA CCRST published results and the insurer's own
cat-model output; backtest loaded loss ratios against realised catastrophe years; sensitivity of
solvency ratio to peril mix and scenario.

### 8.6 Limitations & model risk
Single-peril multipliers ignore correlation/clustering; climate conditioning of vendor catalogues is
itself uncertain; the linear loading understates tail convexity. Fallback: report CR as a scenario
range and flag any post-add-on solvency ratio <120% (as the backend already does).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the page to its own real engine (analytics ladder: rung 1 → 3)

**What.** This module has the platform's most frustrating architecture gap: a genuinely good backend engine (`insurance_climate_risk.py` — peril×scenario CAT multipliers from Swiss Re/EIOPA CCRST, Solvency II Annex XIII CAT-SCR factors, TP uplift, reserve adequacy, protection gap) sits **unused** behind `POST /api/v1/insurance/calculate`, while the hub page renders 40 `sr()`-seeded KRIs, a synthetic 10×8 peer matrix, and flat scenario haircuts (×0.97/×0.82) on an invented overall score. The lineage trace confirms the POST fails/is never exercised and `insurance_climate_assessments` is db-empty. §8.4 states the fix precisely: "the gap is wiring the page to `POST /api/v1/insurance/calculate` instead of local `sr()` data." Evolution A does that wiring plus the guide's missing metric: climate-loaded combined ratio per line of business (`CR = ExpLoss·(1+Σ share_p·Loading_p) + Expenses) / NetPremium`) computed in the engine from a real portfolio input.

**How.** (1) A portfolio-input tab (LOB × peril × geography GWP, base loss ratios, reinsurance, own funds/SCR) persisting to the existing-but-empty `insurance_climate_entities`/`insurance_climate_assessments` tables — also fixing the failing `GET /assessments/{id}` path by giving it data. (2) The KRI scorecard rebuilt on engine outputs: reserve-adequacy KRI = the engine's `reserve_deficiency`, solvency KRI = `sol_ratio_post`, replacing seeded values; the display-heuristic score inversion documented or retired. (3) Loaded-CR added to the engine per §8.3 — carefully, since the engine is shared by 5 insurance modules (81-module blast radius via tables): additive method, sibling regression tests first. (4) EIOPA CCRST published results as the calibration anchor (§8.5; the 108% median CR is cited in §4.1).

**Prerequisites.** Sibling-module regression suite before touching the shared engine; the `sr()` KRI generation deleted. **Acceptance:** every hub number traces to an engine response or stored assessment; `POST /calculate` passes in the lineage sweep; a worked portfolio reproduces a CCRST-plausible loaded CR.

### 9.2 Evolution B — EIOPA/PRA disclosure-pack analyst (LLM tier 2)

**What.** The stated workflow ends at "generate the EIOPA/PRA climate risk disclosure pack" — a structured regulatory document over quantitative results, ideal tier-2 territory: "draft the PRA SS3/19 scenario-analysis section for our book", "why does the Hot House scenario add €X to CAT SCR?", "which of the 20 regulatory milestones bind in the next 90 days and what do they require?" The curated `REGULATORY_MILESTONES` table (real regulators, EIOPA/PRA/NAIC/IAIS) and the engine's sourced reference data (`GET /reference-data` returns multipliers, SII factors and their sources) are strong grounding.

**How.** Tool schemas over `/calculate` and `/reference-data`; the disclosure pack template maps to EIOPA/PRA expectations with each figure tool-validated. Actuarial discipline: every multiplier quoted carries its source from the engine's own `sources` field; the copilot distinguishes the engine's Solvency II arithmetic (regulatory-grade formulas, labeled assumptions) from screening judgements; scenario narratives never invent loss numbers beyond the engine's peril set (§8.6's correlation/clustering caveat is repeated when portfolio-level tail statements are made). Milestone answers quote the curated deadlines with jurisdiction, never recalled dates.

**Prerequisites (hard).** Evolution A — a disclosure pack over seeded KRIs would be a fabricated regulatory submission, the worst possible failure mode. Phase 2 tooling. **Acceptance:** disclosure figures 100% engine-traceable with sources; scenario sections state modeled vs unmodeled risks (physical correlation, tail convexity); milestone facts match the curated table.