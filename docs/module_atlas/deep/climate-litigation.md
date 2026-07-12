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
