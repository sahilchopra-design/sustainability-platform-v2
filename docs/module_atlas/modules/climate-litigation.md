# Climate Litigation Hub
**Module ID:** `climate-litigation` · **Route:** `/climate-litigation` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive climate litigation analytics covering case inventories, precedent analysis, claimant/defendant profiling, and sector-level exposure across global jurisdictions.

> **Business value:** Centralises global climate litigation intelligence to support legal risk integration in ESG analysis, credit underwriting, and regulatory compliance functions.

**How an analyst works this module:**
- Compile full case inventory by jurisdiction, court level, and claim category
- Map claimant types (government, NGO, individual, institutional investor) and defendant sectors
- Score precedent strength of closed cases and propagate risk to open cases in same jurisdiction
- Build sector exposure league table by active case count and estimated financial exposure

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `Btn`, `ENTITY_TYPES`, `Inp`, `KpiCard`, `PIE_COLORS`, `Row`, `Section`, `Sel`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ENTITY_TYPES` | 9 | `label` |
| `RED_FLAGS` | 29 | `category` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `entityIndex` | `(e) => ENTITY_TYPES.findIndex(t => t.value === e) + 1;` |
| `litigationScore` | `Math.round(seed(ei * 7) * 40 + 40);` |
| `maxExposure` | `parseFloat((seed(ei * 11) * 800 + 100).toFixed(0));` |
| `expectedCost` | `parseFloat((maxExposure * (seed(ei * 13) * 0.2 + 0.05)).toFixed(0));` |
| `exposureByCategory` | `dimensions.map(d => ({` |
| `gwScore` | `Math.round(seed(ei * 41) * 35 + 40);` |
| `topRegulator` | `flagsTriggered >= 8 ? 'SEC / FCA / ESMA' : flagsTriggered >= 5 ? 'ESMA' : 'FCA';` |
| `categoryBreakdown` | `['Marketing', 'Targets', 'Disclosure', 'Carbon', 'Portfolio', 'Regulatory', 'Financing', 'Assurance'].map(cat => ({` |
| `disclosureScore` | `Math.round(seed(ei * 53) * 30 + 50);` |
| `fiduciaryScore` | `Math.round(seed(ei * 121) * 30 + 50);` |
| `doExposure` | `parseFloat((seed(ei * 123) * 300 + 50).toFixed(0));` |
| `gapsCount` | `Math.round(seed(ei * 127) * 4 + 1);` |
| `jurisdictionScore` | `Math.round(seed(ei * 161) * 35 + 45);` |
| `attributionApplicable` | `seed(ei * 163) > 0.45;` |
| `physicalDamagePct` | `parseFloat((seed(ei * 167) * 30 + 10).toFixed(1));` |

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
**Frontend seed datasets:** `ENTITY_TYPES`, `PIE_COLORS`, `RED_FLAGS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Precedent-Setting Rulings | — | Sabin Center 2024 | Landmark decisions that have been cited in subsequent climate cases or influenced regulatory policy. |
| Average Case Duration | — | UNEP 2023 | Mean time from filing to final judgment across resolved climate litigation cases. |
- **Court dockets, judgment texts, NGO case trackers, regulatory filings** → NLP case classification, precedent graph analysis, sector linkage → **Case inventory, precedent heat map, sector and entity exposure scores**

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
**Methodology:** Precedent Strength Index
**Headline formula:** `PSI = Σ (Case Citations × Court Tier Weight) / Total Cases`

Measures how widely a ruling is cited relative to court hierarchy to gauge precedent-setting impact.

**Standards:** ['Sabin Center', 'Columbia SILC']
**Reference documents:** Sabin Center Global Climate Litigation Database; UNEP Global Trends in Climate Change Litigation 2023; Columbia Sabin Center – State of Climate Litigation 2024

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
| `climate-litigation-risk-scorer` | engine:climate_litigation_engine |
| `climate-litigation-tracker` | engine:climate_litigation_engine |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a *case-inventory analytics*
> product built on a **Precedent Strength Index** — `PSI = Σ (Case Citations × Court Tier Weight)
> / Total Cases` — with claimant/defendant profiling and citation-graph propagation. **No citation
> counting, court-tier weighting, or case inventory exists in the code.** What actually ships is an
> *entity self-assessment*: the backend engine (E91, `climate_litigation_engine.py`) runs a
> rule-based greenwashing / disclosure / fiduciary / attribution assessment, and the frontend
> renders entity-type-seeded demo scores. The frontend POSTs `/api/v1/climate-litigation/assess`
> but **discards the response** (`catch {}` → "API fallback to seed data"), so nothing displayed
> comes from the engine. The sections below document both layers as they actually behave.

### 7.1 What the module computes

**Backend engine (E91) — deterministic rule model, 5 sub-modules:**

```
greenwashing_score  = min(flag_count × 10 + 3 × enforcement_flags, 100)         // 20 red flags GW-01..20
disclosure_score    = min(log10(maxExp+1)/log10(10001) × 50, 50)                // exposure component
                    + min(trigger_count/8 × 50, 50)                             // count component
duty_score_d        = 100 − breaches_d / max_indicators_d × 100                 // 6 Duties X Framework duties
fiduciary_adequacy  = mean(duty_score_d);  D&O = Σ_{score<50} maxExp_d × (1 − score_d/100)
MHC score           = 40·fossil + {25,15,5}·emissions-tier + sector_pts + jur_activity/100 × 15
physical_damage_pct = cumulative_MtCO₂ / 1,500,000 × 100                        // Carbon Majors share
litigation_score    = 0.25·GW + 0.30·DL + 0.20·(100 − FD) + 0.15·MHC + 0.10·jur_score/10
IAS 37 provision    = 0.5 × expected_litigation_cost                            // §14 best estimate
```

Exposure streams (per entity): greenwashing max = `flags × €20M` (expected ×0.12); disclosure max =
Σ trigger claim ceilings (expected ×0.10 at aggregate, ×0.15 of the claim-range midpoint at trigger
level — two inconsistent expected-loss conventions); fiduciary = D&O carry-over (expected ×0.15);
attribution max = `cumulative_MtCO₂ × €0.5M` when applicable (expected × litigation probability).

**Frontend page:** all five tabs derive from `seed(entityIndex × k)` draws keyed only to the chosen
entity type (8 types → 8 fixed profiles), e.g. `litigationScore = round(seed(ei×7)×40+40)` (40–80),
`maxExposure = seed(ei×11)×800+100` €M, `expectedCost = maxExposure × (seed(ei×13)×0.2+0.05)`.

### 7.2 Parameterisation (engine constants)

| Constant | Value | Provenance |
|---|---|---|
| Composite weights | GW 0.25 · DL 0.30 · FD 0.20 · Attribution 0.15 · Jurisdiction 0.10 | Engine-authored |
| Risk tiers | ≥75 critical · ≥55 high · ≥35 medium · ≥15 low · else minimal | Engine convention |
| Red-flag fines | 20 flags, €0.05–200M ceilings (e.g. GW-02 unverified net-zero €0.5–50M; GW-06 missing Scope 3 Cat 15 €2–100M) | FCA PS23/16, EU 2023/2441 cited; amounts heuristic |
| Disclosure triggers | 8 triggers, claim ranges €1–5,000M (asset-stranding concealment largest €50–5,000M; Scope 3 under-reporting €5–1,000M) | Statute-mapped (IFRS S2, SEC 33-11275, CSRD, IAS 36); ranges heuristic |
| Expected-loss factors | 0.15 × claim midpoint (per trigger); 0.10–0.15 (aggregate streams) | Heuristic settlement-probability proxies |
| D&O ceilings per duty | €20–200M across the 6 duties | Duties X Framework (UCL/ClientEarth) mapping; amounts heuristic |
| Carbon Majors denominator | 1,500,000 MtCO₂ industrial CO₂ 1850–2023 | Heede/Carbon Majors order of magnitude (in-code comment "rough total") |
| Sabin taxonomy | 8 case categories with settlement ranges & success rates (e.g. greenwashing 35%, product liability 8%) | Sabin Center 2024 database framing; rates hand-coded |

### 7.3 Calculation walkthrough

`run_full_assessment()` executes GW → DL → FD → Attribution on the raw entity dict, augments it
with each sub-result (flag count, max exposures, D&O, attribution probability), then runs the
exposure aggregator and blends the composite. Flags/triggers fire from boolean entity facts
(e.g. `net_zero_commitment ∧ ¬transition_plan_published` → GW-02; `is_financial_institution ∧
¬scope3_cat15_disclosed` → both GW-06 and the `scope3_underreporting` disclosure trigger — one
fact can hit two streams, a deliberate double-count of conduct vs disclosure exposure).

### 7.4 Worked example (engine, financial institution)

Entity: FI, net-zero pledge without transition plan or interim targets, Scope 3 Cat 15 undisclosed,
€50M litigation insurance, jurisdictions default (`global` → activity 40), no fossil assets.

| Step | Computation | Result |
|---|---|---|
| GW flags | GW-02, GW-06, GW-16 → 3 flags; score 3×10 (no live enforcement assumed) | **30** ("low"); max fines 50+100+50 = **€200M** |
| DL trigger | scope3_underreporting: max €1,000M; expected (5+1000)/2 × 0.15 | €1,000M / **€75.4M** |
| DL score | min(log10(1001)/log10(10001)×50,50) + 1/8×50 = 37.5 + 6.25 | **43.8** |
| Exposure streams | GW 3×20=60 (exp 7.2); DL 1,000 (exp 100); D&O 0; attribution 0 | max **€1,060M**, expected **€107.2M** |
| Insurance gap | 107.2 − 50 | **€57.2M** |
| IAS 37 provision | 0.5 × 107.2 | **€53.6M** |
| Composite (FD adequacy assumed 50; MHC = 3 sector + 6 jur = 9) | 30×0.25 + 43.8×0.30 + (100−50)×0.20 + 9×0.15 + 40/100×10 = 7.5+13.14+10+1.35+4 | **36.0 → "medium"** |

### 7.5 Frontend display layer

The five tabs (Risk Overview radar, 20 greenwashing red flags with `seed(ei×43+i×7)>0.55`
triggering, 8 disclosure triggers with statute tags, Duties/stewardship radars, 15-jurisdiction
case counts) mirror the engine's *taxonomy* faithfully but re-generate all *values* from the
entity-type seed. Note the polarity inversion: the frontend labels ≥70 as "Low Risk" (score reads
as adequacy) while the engine's ≥75 is "critical" (score reads as risk). The 2015–2024 global case
trend (804 → 3,134) is hard-coded and tracks the real Sabin/UNEP trajectory (~2,180 cases in 2022;
~3,100 by 2024).

### 7.6 Data provenance & limitations

- **Frontend values are synthetic**, from `seed(s) = frac(sin(s+1)×10⁴)` keyed to an 8-value
  entity-type index — every "Asset Manager" shows identical numbers; the revenue input affects
  nothing displayed. The `/assess` response is thrown away.
- The engine is deterministic and framework-anchored, but its € quantities (fine ceilings, claim
  ranges, 0.10–0.15 expected-loss factors, €0.5M/MtCO₂ attribution rate) are expert-judgement
  constants, not fitted to settlement data. The linear `flags×10` score treats all red flags as
  equally severe.
- The two expected-loss conventions (per-trigger 15% of midpoint vs aggregate 10% of max) produce
  different numbers for the same trigger set; the composite mixes 0–100 scores of different
  constructions (count-based, log-exposure, adequacy-complement).

**Framework alignment:** Sabin Center taxonomy — the engine's 8 case categories with plaintiffs/
defendants/settlement ranges replicate how Sabin classifies its ~2,900-case database · FCA PS23/16
Anti-Greenwashing Rule & EU Reg 2023/2441 — the 20 red flags operationalise these regimes'
misleading-claims tests · IAS 37 — provision = 50% of expected exposure applies §14's "best
estimate of probable outflow", with §86 contingent-liability disclosure for the remainder ·
Duties X Framework (UCL/ClientEarth 2023) — the six directors' duties scored by breach-indicator
counting · Carbon Majors / Heede — attribution share = entity cumulative CO₂ ÷ global industrial
CO₂, the same apportionment logic used in Lliuya v RWE (0.47% claim) · TCFD / IFRS S2 / CSRD ESRS
E1 / SEC 33-11275 — the statute map behind the 8 disclosure triggers.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Quantify an entity's climate litigation exposure as a loss distribution
(expected cost, 95/99% quantiles, IAS 37 provision) rather than additive heuristic ceilings.
Decision supported: legal-reserve setting, D&O programme sizing, counterparty risk overlays.

**8.2 Conceptual approach.** Compound frequency–severity per claim category, with category
propensities from the engine's existing rule triggers and calibrated base rates from the Sabin
corpus — the architecture of **Praedicat CoMeta** (science-driven liability emergence) and
**Verisk Arium** (casualty accumulation scenarios), with outcome probabilities informed by
published success rates (UNEP/Grantham) instead of the current flat 10–15% factors.

**8.3 Mathematical specification.**

```
For claim category c (8 Sabin categories):
  p_c   = P(case filed, 1yr) = σ(α_c + Σ_j γ_cj x_j)          // logistic on trigger booleans x_j
  q_c   = P(adverse outcome | filed)                           // from category success rates
  S_c   ~ LogNormal(μ_c, σ_c), support [settle_min_c, settle_max_c]
Annual loss  L = Σ_c B_c · A_c · S_c,  B_c~Bern(p_c), A_c~Bern(q_c)
Expected cost = Σ_c p_c q_c E[S_c];  reserve = quantile(L, 0.5) per IAS 37 best estimate
D&O layer: LGD reduced by insurance tower min(S_c, limit) × recovery
```

| Parameter | Description | Calibration source |
|---|---|---|
| α_c (base rate) | Category filing rate for exposed entities | Sabin Center filings 2018–2024 ÷ exposed-population counts |
| γ_cj | Trigger-boolean odds ratios | Defendant vs matched-control regression (Sabin + CDP/refinitiv facts) |
| q_c | Adverse-outcome probability | Engine's taxonomy success rates as priors (e.g. greenwashing 35%, product liability 8%), updated with Grantham outcome statistics |
| μ_c, σ_c | Severity | Fitted to settlement/fine records (SEC/FCA/ASIC registers; securities class-action databases); engine's `settlement_range_m` as bounds |
| Recovery | Insurance recovery rate | Lloyd's/Marsh D&O market studies (50–70%) |
| Attribution severity | €/tCO₂ damages | Lliuya v RWE apportionment × EPA SC-CO₂ ($190/t, 2023) as upper scenario |

**8.4 Data requirements.** Entity boolean facts (already the engine's input schema — reusable
as-is); Sabin/Grantham case corpus with defendant matching (free); enforcement fine registers
(free); SC-CO₂ and cumulative-emissions data (platform reference layer holds OWID CO₂ series);
insurance tower terms (client input; engine already accepts `climate_litigation_insurance_m`).

**8.5 Validation & benchmarking.** Backtest p_c on out-of-time cohorts (fit ≤2021, test 2022–24;
target AUC ≥0.70); severity KS-tests against held-out settlements per category; reconcile expected
cost vs Praedicat liability scores for overlapping names; verify IAS 37 output is stable under ±30%
severity-parameter shocks; annual recalibration gate tied to each UNEP litigation report release.

**8.6 Limitations & model risk.** Outcome data are censored (most filings unresolved) — treat q_c
as scenario ranges with the engine's published success rates as anchors; category independence is
false (one disclosure failure spawns multi-jurisdiction parallel claims) — apply a common shock
factor across categories as the conservative default; severity tails for product-liability claims
are unbounded in discovery (Honolulu-type) — cap at market-cap fraction and disclose; the logistic
layer inherits any bias in which entities get researched (litigation targeting is activist-driven,
not random) — document as selection risk and keep the rule-trigger fallback as a floor.

## 9 · Future Evolution

### 9.1 Evolution A — Render the E91 engine; fix the discarded POST (analytics ladder: rung 2 → 3)

**What.** §7 documents the now-familiar tier-A pattern at its most frustrating: the
backend engine (E91) is a real rule-based assessment — greenwashing scoring over 20
enumerated red flags with enforcement uplift, log-scaled disclosure liability,
fiduciary-duty breach counting, Meehl-Haugen-Christidis attribution
(`attribution_share = cumulative_emissions / global_industrial_CO2_1850_2023`), and
a weighted exposure aggregation (25/30/20/15/10 contributions visible in the
extracted lines) — behind 6 POSTs and passing ref GETs. But the frontend POSTs
`/assess` and **discards the response** (`catch {} → seed fallback`), rendering
entity-type-seeded demo scores. The guide's Precedent Strength Index, meanwhile,
exists nowhere. Evolution A: bind the page to the engine (delete the seed fallback
path except as an explicit offline mode), and reconcile the guide to the entity-
assessment module that actually exists — PSI moves to §8 as future work or is
dropped.

**How.** (1) Fix the fetch: correct payload schema, surface engine responses in all
tabs, error states instead of silent seed substitution — the platform's honest-nulls
convention applied to API failure. (2) The 29-row `RED_FLAGS` frontend seed
reconciled with the engine's 20-flag taxonomy (one source of truth — the engine's
`/ref/greenwashing-flags`). (3) Calibration pass (rung 3): the engine's rule weights
(flag×10, ×0.15 expected-loss factors) documented per §8 model-card convention
against observed settlement data where public.

**Prerequisites (hard).** The discarded-response wiring is a documented defect and
the gate; guide rewrite mandatory. **Acceptance:** every score rendered matches an
engine response field; killing the backend shows an explicit error, not silent seed
data; the flag taxonomy has one canonical source.

### 9.2 Evolution B — Litigation-exposure analyst (LLM tier 2)

**What.** The engine's five sub-assessments are natural tools: "assess this energy
company — cumulative emissions 1,200 MtCO₂, three unverified green claims, SEC
registrant" becomes calls to `/greenwashing-risk`, `/disclosure-liability`,
`/attribution-science`, and `/litigation-exposure`, with the assistant narrating the
weighted aggregation (which flags fired, what the attribution share implies, where
the insurance gap sits per the engine's IAS 37 provision logic). The red-flag
taxonomy makes interviews concrete: the assistant asks about specific enumerated
flags rather than vibes.

**How.** Tool schemas from the module's OpenAPI routes; every score and $ figure
validator-checked against tool outputs; the legal-advice disclaimer path mandatory;
"show work" lists flags triggered and rule contributions — the engine's rule-based
design makes full explainability achievable, which is precisely why it suits an LLM
front-end.

**Prerequisites (hard).** Evolution A's wiring fix first — the copilot must describe
engine outputs, not the page's current seeded scores. **Acceptance:** an assessment
conversation reproduces via direct POSTs with the stated inputs; the assistant cites
the specific red flags behind a greenwashing score; refusal on outcome prediction for
named live cases.