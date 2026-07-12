# Climate Litigation Risk Scorer
**Module ID:** `climate-litigation-risk-scorer` · **Route:** `/climate-litigation-risk-scorer` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scores individual entities on their exposure to climate litigation using disclosure quality, emissions trajectory, greenwashing signals, and jurisdictional enforcement intensity.

> **Business value:** Provides investment and legal teams with a systematic, evidence-based entity scoring tool to integrate climate litigation risk into credit, equity, and ESG ratings workflows.

**How an analyst works this module:**
- Collect entity-level emissions data, climate targets, and public disclosure quality scores
- Assess greenwashing signals: target specificity, interim milestones, verification status
- Weight jurisdictional enforcement intensity using historical prosecution rates and regulatory framework scores
- Aggregate into ELRS; flag P0 risk entities for immediate legal due diligence

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CLAIM_TYPES`, `ENTITIES`, `ENTITY_NAME_BASES`, `ENTITY_TYPES`, `JURISDICTIONS`, `KpiCard`, `LANDMARK_CASES`, `OUTCOMES`, `RiskBadge`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `typeIdx` | `Math.floor(sr(i * 7) * 4);` |
| `sectorIdx` | `Math.floor(sr(i * 11) * 12);` |
| `jurIdx` | `Math.floor(sr(i * 13) * 20);` |
| `claim1` | `Math.floor(sr(i * 17) * 12);` |
| `claim2` | `Math.floor(sr(i * 19) * 12);` |
| `disclosureAdequacy` | `Math.round(sr(i * 23) * 80 + 10);` |
| `physRisk` | `Math.round(sr(i * 29) * 90 + 5);` |
| `transRisk` | `Math.round(sr(i * 31) * 90 + 5);` |
| `precedentRisk` | `Math.round(sr(i * 37) * 80 + 10);` |
| `reputationalRisk` | `Math.round(sr(i * 41) * 80 + 10);` |
| `activeCases` | `Math.floor(sr(i * 43) * 20);` |
| `historicalCases` | `Math.floor(sr(i * 47) * 40);` |
| `settledCases` | `Math.floor(sr(i * 53) * (historicalCases + 1));` |
| `dismissedCases` | `Math.floor(sr(i * 59) * Math.max(1, historicalCases - settledCases + 1));` |
| `totalExposureUSD` | `Math.round((sr(i * 61) * 9 + 0.1) * 1e9);` |
| `largestCaseUSD` | `Math.round(totalExposureUSD * (sr(i * 67) * 0.5 + 0.1));` |
| `legalCostEstimate` | `Math.round(totalExposureUSD * 0.05 * sr(i * 71));` |
| `litigationRiskScore` | `Math.min(100, Math.max(0, Math.round(` |
| `outcomeIdx` | `Math.floor(sr(i * 73) * 5);` |
| `claimIdx` | `Math.floor(sr(j * 89 + 500) * 12);` |
| `outIdx` | `Math.floor(sr(j * 97 + 500) * 5);` |
| `year` | `2000 + Math.floor(sr(j * 101 + 500) * 24);` |
| `impact` | `Math.round((sr(j * 103 + 500) * 4.5 + 0.1) * 1e9);` |
| `pLvl` | `pLevels[Math.floor(sr(j * 107 + 500) * 3)];` |
| `top20` | `useMemo(() => [...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 20), []);` |
| `total` | `Object.values(map).reduce((s, v) => s + v, 0);` |
| `hhi` | `total ? Math.round(Object.values(map).reduce((s, v) => s + Math.pow(v / total, 2), 0) * 10000) : 0;` |
| `base` | `filtered.reduce((s, e) => s + e.totalExposureUSD * e.litigationRiskScore / 100, 0);` |
| `top10ids` | `new Set([...ENTITIES].sort((a, b) => b.litigationRiskScore - a.litigationRiskScore).slice(0, 10).map(e => e.id));` |
| `excl` | `filtered.filter(e => !top10ids.has(e.id)).reduce((s, e) => s + e.totalExposureUSD * e.litigationRiskScore / 100, 0);` |
| `avgRisk` | `filtered.length ? (filtered.reduce((s, e) => s + e.litigationRiskScore, 0) / filtered.length).toFixed(1) : '0';` |
| `varE` | `e.totalExposureUSD * e.litigationRiskScore / 100;` |
| `pct` | `portfolioVaR.base ? (varE / portfolioVaR.base * 100).toFixed(1) : '0';` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/climate-litigation/assess` | `run_full_assessment` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/greenwashing-risk` | `assess_greenwashing_risk` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/disclosure-liability` | `assess_disclosure_liability` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/fiduciary-duty` | `assess_fiduciary_duty` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/attribution-science` | `assess_attribution_science` | api/v1/routes/climate_litigation.py |
| POST | `/api/v1/climate-litigation/litigation-exposure` | `compute_litigation_exposure` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/case-taxonomy` | `get_case_taxonomy` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/jurisdiction-profiles` | `get_jurisdiction_profiles` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/disclosure-triggers` | `get_disclosure_triggers` | api/v1/routes/climate_litigation.py |
| GET | `/api/v1/climate-litigation/ref/greenwashing-flags` | `get_greenwashing_flags` | api/v1/routes/climate_litigation.py |

### 2.3 Engine `climate_litigation_engine` (services/climate_litigation_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ClimateLitigationEngine.assess_greenwashing_risk` | entity_data | Check 20 red flags against entity data. Compute greenwashing risk score (0-100), identify triggered flags, regulatory exposure by jurisdiction, and remediation. |
| `ClimateLitigationEngine.assess_disclosure_liability` | entity_data | Check 8 disclosure liability triggers, quantify exposure per trigger, aggregate max/expected exposure, and identify priority remediations. |
| `ClimateLitigationEngine.assess_fiduciary_duty` | entity_data | Score all 6 Duties X Framework fiduciary duties, compute fiduciary adequacy score, identify stewardship gaps, and estimate D&O liability exposure. |
| `ClimateLitigationEngine.assess_attribution_science_risk` | entity_data | Assess attribution science applicability based on sector, jurisdiction, and emissions profile. Computes Meehl-Haugen-Christidis composite score, physical damage attribution %, and litigation probability. |
| `ClimateLitigationEngine.compute_litigation_exposure` | entity_data | Aggregate all exposure streams. Compute max/expected litigation cost, insurance adequacy gap, and IAS 37 provision requirement. |
| `ClimateLitigationEngine.run_full_assessment` | entity_data | Full climate litigation risk assessment across all five sub-modules. Produces composite litigation_risk_score (0-100) and risk tier. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CLAIM_TYPES`, `ENTITY_NAME_BASES`, `ENTITY_TYPES`, `JURISDICTIONS`, `OUTCOMES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| High-Risk Entity Threshold | — | Internal Calibration | Entities scoring 70 or above are classified as high litigation risk based on historical case filing rates. |
| Greenwashing Case Growth | — | UNEP 2023 | Year-on-year increase in greenwashing-specific climate litigation filings globally. |
- **Corporate disclosures, CDP submissions, court filing databases, regulatory registers** → Multi-factor scoring, greenwashing NLP flags, jurisdictional intensity mapping → **Entity risk scores, peer benchmarking, red-flag summary for investment committees**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/climate-litigation/ref/case-taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['case_taxonomy', 'category_count', 'source', 'total_cases_worldwide_2024', 'growth_note', 'fastest_growing_categories'], 'n_keys': 6}`

**GET /api/v1/climate-litigation/ref/disclosure-triggers** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['disclosure_liability_triggers', 'trigger_count', 'duties_x_framework', 'max_single_trigger_exposure_m', 'source'], 'n_keys': 5}`

**GET /api/v1/climate-litigation/ref/greenwashing-flags** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['greenwashing_red_flags', 'all_flags_flat', 'flag_count', 'categories', 'flags_with_enforcement_precedent', 'source', 'scoring_note'], 'n_keys': 7}`

**GET /api/v1/climate-litigation/ref/jurisdiction-profiles** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['jurisdiction_summary', 'jurisdiction_details', 'jurisdiction_count', 'highest_activity_jurisdictions', 'source'], 'n_keys': 5}`

**POST /api/v1/climate-litigation/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/attribution-science** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/disclosure-liability** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/climate-litigation/fiduciary-duty** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Litigation Risk Score
**Headline formula:** `ELRS = w₁×Disclosure + w₂×EmissionsTrajectory + w₃×GreenwashSignal + w₄×JurisdictionIntensity`

Weighted composite of four risk dimensions scored 0–100; weights sum to 1.0 and are calibrated to historical litigation outcomes.

**Standards:** ['UNEP 2023', 'Sabin Center']
**Reference documents:** UNEP Global Trends in Climate Change Litigation 2023; Sabin Center Climate Litigation Database; FSB Report on Climate-Related Financial Risks 2022

**Engine `climate_litigation_engine` — extracted transformation lines:**
```python
base_score = flag_count * 10
greenwashing_risk_score = round(min(base_score + enforcement_uplift, 100.0), 1)
expected = (claim_min + claim_max) / 2 * 0.15
exposure_score = min(math.log10(total_max_m + 1) / math.log10(10001) * 50, 50)
count_score = min(trigger_count / 8 * 50, 50)
disclosure_score = round(exposure_score + count_score, 1)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
breaches = min(breaches + 1, max_indicators)
duty_score = max(0, 100 - (breaches / max(max_indicators, 1)) * 100)
fiduciary_adequacy_score = round(sum(duty_scores.values()) / len(duty_scores), 1)
attribution_share = cumulative_emissions_mtco2 / global_industrial_co2_1850_2023
physical_damage_pct = round(min(attribution_share * 100, 100), 3)
gw_max = gw_flag_count * 20
gw_expected = gw_max * 0.12
dl_expected = dl_max * 0.10
attr_max = cumulative_emissions * 0.5 if attr_applicable else 0
attr_expected = attr_max * attr_prob
insurance_gap = max(0, expected_litigation - insurance_coverage)
ias37_provision = round(expected_litigation * 0.5, 1)
jurisdiction_risk_score = round(sum(jur_scores) / len(jur_scores), 1) if jur_scores else 40.0
gw_contribution = gw.greenwashing_risk_score * 0.25
dl_contribution = dl.disclosure_liability_score * 0.30
fd_contribution = (100 - fd.fiduciary_adequacy_score) * 0.20
attr_contribution = attr.meehl_haugen_christidis_score * 0.15
jur_contribution = exp.jurisdiction_risk_score / 100 * 10
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **2** other module(s).
**Shared engines (edits propagate!):** `climate_litigation_engine` (used by 3 modules)

| Connected module | Shared via |
|---|---|
| `climate-litigation` | engine:climate_litigation_engine |
| `climate-litigation-tracker` | engine:climate_litigation_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises an **ELRS** =
> `w₁·Disclosure + w₂·EmissionsTrajectory + w₃·GreenwashSignal + w₄·JurisdictionIntensity` calibrated
> to *historical litigation outcomes*. **The frontend page does not implement that formula.** It scores
> entities with a fixed-weight composite of *disclosure adequacy, physical risk, transition risk,
> precedent risk and reputational risk* — there is no emissions-trajectory term, no greenwashing-NLP
> term and no jurisdiction-intensity term in the score, and no calibration to outcomes. All inputs are
> synthetic (`sr()` seeded). A genuine attribution-science / disclosure-liability methodology
> (Meehl-Haugen-Christidis attribution, 8 SEC-style disclosure triggers) *does* exist, but only in the
> backend engine `climate_litigation_engine.py`, which the page never calls for its scores. The
> sections below document the page as coded and specify the production model in §8.

### 7.1 What the module computes

For a synthetic universe of entities (`i`-indexed), the page assigns each a **Litigation Risk Score**
(0–100) from five weighted dimensions (source lines 86–92):

```js
litigationRiskScore = clamp(0,100, round(
    (1 - disclosureAdequacy/100) * 30     // disclosure gap → 30 pts
  + physRisk/100          * 20            // physical exposure → 20 pts
  + transRisk/100         * 20            // transition exposure → 20 pts
  + precedentRisk/100     * 15            // precedent → 15 pts
  + reputationalRisk/100  * 15 ))         // reputation → 15 pts
```

Portfolio "Litigation VaR" is a heuristic exposure-weighting, **not** a statistical VaR:

```js
varE = totalExposureUSD * litigationRiskScore / 100      // per entity
base = Σ varE  (over filtered set)                       // portfolio litigation VaR
```

### 7.2 Parameterisation / scoring rubric

| Input | Generation (seed) | Range | Provenance |
|---|---|---|---|
| `disclosureAdequacy` | `sr(i·23)·80+10` | 10–90 | synthetic demo value |
| `physRisk`, `transRisk` | `sr(i·29)·90+5`, `sr(i·31)·90+5` | 5–95 | synthetic demo value |
| `precedentRisk`, `reputationalRisk` | `sr(i·37)·80+10`, `sr(i·41)·80+10` | 10–90 | synthetic demo value |
| `totalExposureUSD` | `(sr(i·61)·9+0.1)·1e9` | $0.1–9.1 bn | synthetic demo value |
| `legalCostEstimate` | `totalExposureUSD·0.05·sr(i·71)` | ≤5% of exposure | heuristic (5% legal-cost proxy) |
| Score weights | fixed 30/20/20/15/15 | sum = 100 | **unattributed** — not calibrated to any dataset |

The 30/20/20/15/15 weight vector is an author judgement; the guide's claim that weights are "calibrated
to historical litigation outcomes" is not evidenced in code.

### 7.3 Calculation walkthrough

Inputs (all `sr()`-seeded) → per-entity dimension scores → weighted sum → `litigationRiskScore`.
Entities feed: (a) `top20` bar chart (sorted desc), (b) `riskDist` 5-bin histogram, (c) `jurData`
jurisdiction roll-up (mean risk, summed exposure), (d) claim-type **HHI** = `Σ(vᵢ/total)²·10000`, and
(e) portfolio Litigation VaR with a "top-10 exclusion" reduction analysis.

### 7.4 Worked example

Entity with `disclosureAdequacy=40`, `physRisk=70`, `transRisk=60`, `precedentRisk=50`,
`reputationalRisk=30`, `totalExposureUSD=$4bn`:

| Term | Computation | Points |
|---|---|---|
| Disclosure gap | (1−0.40)·30 | 18.0 |
| Physical | 0.70·20 | 14.0 |
| Transition | 0.60·20 | 12.0 |
| Precedent | 0.50·15 | 7.5 |
| Reputational | 0.30·15 | 4.5 |
| **Score** | round(56.0) | **56 / 100** |
| Entity VaR | 4bn · 56/100 | **$2.24 bn** |

A score of 56 sits below the guide's High-Risk threshold (≥70), so this entity would not be flagged P0.

### 7.5 Data provenance & limitations

- **All entity data synthetic**, from `sr(s)=frac(sin(s+1)×10⁴)` (line 15). No connection to the Sabin
  Center database, court filings, or CDP disclosures named in the guide.
- Score dimensions are independent random draws — `physRisk` and `transRisk` are not derived from any
  emissions or hazard model, so the composite is a demonstration layout, not a risk estimate.
- "Litigation VaR" is exposure × score/100 summed — no probability of being sued, no loss distribution,
  no correlation. The eight `POST /assess`, `/attribution-science`, `/disclosure-liability`,
  `/fiduciary-duty` endpoints are wired in the backend engine but not consumed for the on-page score.

**Framework alignment:** UNEP *Global Trends in Climate Change Litigation 2023* (case-type taxonomy,
+46% greenwashing growth cited in guide) · Sabin Center Climate Litigation Databases (the authoritative
case register the score should draw from) · SEC Climate Disclosure Rule (Release 33-11275) as the
disclosure-liability trigger set implemented in the backend engine.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Estimate, per corporate/financial entity, the **1-year probability of being
named defendant in a material climate lawsuit** and the **expected legal + reputational loss**, to feed
credit, D&O underwriting and ESG-rating overlays. Coverage: listed issuers and large private entities in
jurisdictions tracked by the Sabin/LSE databases.

**8.2 Conceptual approach.** A **frequency-severity actuarial model** (mirroring D&O securities-litigation
pricing and Swiss Re liability-cat practice) rather than a heuristic score. Filing frequency is a logistic
hazard calibrated on the Sabin Center case panel (analogous to Cornerstone Research securities-class-action
base rates); severity is a lognormal loss draw conditioned on claim type. Attribution weight uses the
peer-reviewed **Meehl-Haugen-Christidis attribution confidence** already coded in the backend engine.

**8.3 Mathematical specification.**
Filing probability (logistic):
```
p_sue = σ( β0 + β_disc·DisclosureGap + β_emit·EmissionsTrajGap
             + β_gw·GreenwashScore + β_jur·JurIntensity + β_att·AttribConfidence )
```
Expected severity for claim type k: `E[L_k] = exp(μ_k + σ_k²/2)`, μ_k,σ_k from case-award data.
Expected annual litigation loss and reputational overlay:
```
ELL = p_sue · Σ_k π_k · E[L_k]                    (π_k = claim-type mix)
Reputational = ELL · ρ    (ρ market-value-erosion multiplier, event-study calibrated)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Base log-odds & β's | β0…β_att | MLE on Sabin/LSE Grantham case panel |
| Claim mix π_k | π | UNEP 2023 case-type distribution |
| Severity μ_k,σ_k | μ,σ | historical award/settlement data (D&O, Cornerstone) |
| Attribution conf. | AttribConfidence | Meehl-Haugen-Christidis (backend engine) |
| Erosion ρ | ρ | event-study of stock reaction to filings (Sato et al.) |

**8.4 Data requirements.** Entity emissions trajectory vs SBTi target (platform `paris-alignment`,
`reference_data` SBTi table); disclosure-gap score (backend `disclosure-liability` endpoint); jurisdiction
enforcement index (Sabin jurisdiction profiles); AttribConfidence (backend `attribution-science`
endpoint). Vendor: Sabin/LSE case data; free: UNEP report distributions.

**8.5 Validation & benchmarking.** Backtest predicted vs realised filings by cohort year; ROC/AUC on the
Sabin panel; severity backtest against realised settlements; reconcile ELL against D&O premium levels.

**8.6 Limitations & model risk.** Small-N novel case types → wide severity intervals; survivorship/reporting
bias in case databases; attribution science evolving. Conservative fallback: cap `p_sue` and floor severity
at claim-type medians when entity data is sparse.

## 9 · Future Evolution

### 9.1 Evolution A — One ELRS, computed by the engine, rendered by the page (analytics ladder: rung 1 → 2)

**What.** §7 finds three competing scoring stories: the guide's ELRS
(`w₁·Disclosure + w₂·EmissionsTrajectory + w₃·GreenwashSignal + w₄·Jurisdiction`,
"calibrated to historical outcomes"), the page's different fixed-weight composite
(disclosure/physical/transition/precedent/reputational over `sr()`-seeded inputs),
and the backend engine's genuine methodology (attribution science, 8 SEC-style
disclosure triggers, jurisdiction risk scoring) that the page never calls for its
scores. Evolution A collapses the three into one: the engine's
`compute_litigation_exposure` aggregation (25/30/20/15/10 weighted contributions per
its extracted lines) becomes the single ELRS; the page's parallel composite is
deleted; the guide is rewritten to describe the engine's actual four inputs —
greenwashing flags, disclosure triggers, fiduciary breaches, attribution share plus
jurisdiction — which are close cousins of its advertised dimensions.

**How.** (1) Page rewired to POST entity profiles to
`/api/v1/climate-litigation/litigation-exposure` and render the returned
contribution decomposition; seeded entity universe replaced by user-entered or
fixture profiles with explicit fields (emissions, claims, jurisdictions, targets).
(2) "Calibrated to historical outcomes" made honest: either back-test the weights
against Sabin-recorded outcomes for scoreable entities (the legal-intelligence
sibling's Evolution A supplies the case table) and report fit, or delete the
calibration claim. (3) P0-flag threshold documented and tested.

**Prerequisites (hard).** PRNG entity purge; coordination with the climate-litigation
module (same engine — one wiring pattern, applied twice). **Acceptance:** the page's
ELRS equals the engine's aggregation for identical inputs; the weight vector appears
in exactly one place (engine); the calibration claim is either evidenced or gone.

### 9.2 Evolution B — Entity-screening analyst (LLM tier 2)

**What.** A screening assistant for portfolio-wide use: "score our 30 energy holdings
for litigation exposure and flag P0s" — batch tool calls to the engine per entity,
with the assistant assembling a ranked table where each score expands into its
contribution decomposition (which red flags, which disclosure triggers, what
attribution share). The interview mode fills missing entity fields by asking the user
targeted questions keyed to the engine's input schema rather than accepting vague
descriptions.

**How.** Tool schemas over the six litigation POSTs; the validator on every score and
contribution; ranked outputs carry per-entity input provenance so a challenged score
can be re-derived; the legal-advice disclaimer and refusal on named-case outcome
prediction apply as in the sibling module.

**Prerequisites (hard).** Evolution A first — screening against the page's current
seeded composite would rank noise; RBAC scoping for portfolio entity data.
**Acceptance:** a batch screen reproduces entity-by-entity via direct POSTs; a P0
flag always decomposes into cited rule contributions; entities with insufficient
inputs return "insufficient data", never a guessed score.