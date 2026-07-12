## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry gives the formula
> `Readiness = Evidence(25) + Controls(25) + Lineage(25) + Documentation(25)` — four dimensions of
> 25 points. Neither layer of the code implements that. The **frontend page** computes an
> unweighted mean of **7 hard-coded dimension scores**; the **backend engine**
> (`backend/services/assurance_readiness_engine.py`, "E10") computes a *weighted* score over
> **26 criteria across 8 domains** with per-criterion weights of 0.8–2.0. Also notable: the page
> makes **no API calls** — the backend engine (which is real and substantive) is exposed at
> `/api/v1/assurance-readiness/*` but this page renders only its own static seed arrays.

### 7.1 What the module computes

**Frontend (EP-CR3):** a static readiness dashboard. The only computed value is

```js
overallScore = Math.round(READINESS.reduce((s,r)=>s+r.score,0)/READINESS.length)
```

over 7 fixed dimensions: Evidence Availability 72, Internal Controls 65, Data Lineage 58,
Methodology Documentation 78, Process Maturity 68, Third-Party Verification 52, IT Systems 62 →
**overallScore = round(455/7) = 65**. The KPI card labels it "Ready for limited" when ≥ 70, else
"Needs work" — so the demo entity shows **65/100, Needs work**.

**Backend (`AssuranceReadinessEngine.assess`):** the real methodology. For an entity it scores 26
readiness criteria (each 0 / 0.5 / 1.0), applies per-criterion weights, and returns:

```python
readiness_pct = Σ(score_c × weight_c) / Σ(weight_c) × 100     # _TOTAL_WEIGHT = Σ weights
```

plus domain roll-ups, blocking-gap list, per-standard coverage, a readiness tier, and a remediation
plan with an estimated week count.

### 7.2 Parameterisation — criteria, weights, tiers

Backend criteria registry (26 criteria, 8 domains; weights and blocking flags quoted from code):

| Domain | Criteria (weight, B = blocking) |
|---|---|
| D1 Data governance & lineage | D1-1 lineage (1.5 B) · D1-2 audit log (1.2 B) · D1-3 PCAF DQS (1.0) · D1-4 3rd-party data (0.8) |
| D2 GHG & carbon | D2-1 Scope 1/2 + methodology (2.0 B) · D2-2 Scope 3 (1.5) · D2-3 boundary (1.2 B) · D2-4 prior period (1.0) |
| D3 EU Taxonomy | D3-1 eligibility/alignment (1.5 B) · D3-2 TSC/DNSH evidence (1.2 B) · D3-3 CapEx/OpEx/Turnover KPIs (1.0) |
| D4 ESRS datapoints | D4-1 ESRS 2 general (2.0 B) · D4-2 material DPs (1.5 B) · D4-3 double materiality (1.5 B) · D4-4 disclosure index (0.8) |
| D5 SFDR / PAI | D5-1 14 mandatory PAIs (1.2) · D5-2 Annex templates (0.8) |
| D6 Internal controls | D6-1 ICSR documented (1.5 B) · D6-2 error/restatement (1.0) · D6-3 mgmt sign-off (1.0 B) |
| D7 Materiality & scope | D7-1 boundary = consolidation (1.2 B) · D7-2 value-chain scope (1.0) |
| D8 Completeness | D8-1 statement complete (1.5 B) · D8-2 transition plan (1.0) · D8-3 provider engaged (0.8) · D8-4 comparatives (0.8) |

Criterion scores: `met = 1.0`, `partial = 0.5`, `not_met = 0`. Scores can be auto-derived from 23
platform boolean flags (`has_data_lineage → D1-1`, `has_scope1_scope2_data → D2-1`, …) or
overridden by explicit `CriterionInput` entries. Note a code quirk: the `_FLAG_CRITERION_MAP` dict
assigns `has_material_esrs_dps` and `has_prior_period_comparison` twice (D4-2/D8-1 and D2-4/D8-4);
because Python dict keys are unique, only the **later** mapping survives (D8-1, D8-4), leaving
D4-2 and D2-4 fed solely by explicit inputs.

Tier rubric (`_derive_tier`):

| Condition | Tier |
|---|---|
| blocking gaps > 5 | not_ready |
| blocking gaps > 2 | requires_remediation |
| pct ≥ 85 (limited) / 92 (reasonable) and 0 blocking | ready |
| pct ≥ 65 (limited) / 75 (reasonable) | nearly_ready |
| pct ≥ 45 | requires_remediation |
| else | not_ready |

Remediation estimate: 4 weeks per blocking gap + 2 per top-5 non-blocking gap + 1 per top-3
partial, capped at 52 (24 if CSRD Wave 1). All week-costs are engine-authored rough estimates
(inline comment: "4 weeks per blocking gap (rough estimate)").

### 7.3 Calculation walkthrough

1. `_build_score_map` — flags → auto scores; explicit `CriterionInput`s override; unaddressed
   criteria default to 0/"not_met".
2. Per-criterion `weighted_score = score × weight`; overall pct = Σ weighted / Σ weights × 100.
3. `_build_domain_results` — per-domain earned/total weight → domain %, met/partial/not-met counts.
4. `_assess_standards_coverage` — for each of 6 registered standards (ISAE 3000, ISAE 3410,
   ISSA 5000, CSRD Art 26a, AA1000 AS v3, GRI), coverage % = `(met + 0.5·partial) / relevant` over
   the criteria tagged to that standard (unweighted).
5. `_derive_tier` + `_derive_gaps_actions` → tier, top-10 gaps, top-6 priority actions, weeks.

### 7.4 Worked example — entity with all D1 + D2 flags true, nothing else

Flags set: `has_data_lineage, has_audit_log, has_pcaf_dqs, has_third_party_data_documented,
has_scope1_scope2_data, has_scope3_data, has_ghg_methodology, has_prior_period_comparison`.
Effective met criteria (after the duplicate-key quirk): D1-1…D1-4, D2-1, D2-2, D2-3, D8-4
(D2-4 stays not_met — its flag was shadowed by D8-4).

| Quantity | Computation | Result |
|---|---|---|
| Earned weight | 1.5+1.2+1.0+0.8 + 2.0+1.5+1.2 + 0.8 | 10.0 |
| Total weight | Σ all 26 weights | 31.5 |
| Readiness % | 10.0 / 31.5 × 100 | **31.7%** |
| Blocking gaps | D3-1, D3-2, D4-1, D4-2, D4-3, D6-1, D6-3, D7-1, D8-1 (9 not-met blockers) | 9 > 5 |
| Tier | blocking_count > 5 | **not_ready** |
| Remediation | 9×4 + 5×2 (top-5 non-blocking) | 46 weeks |

ISAE 3410 coverage in the same run: relevant criteria = {D1-3, D2-1…D2-4, D6-2, D8-4}; met =
5 of 7 → **71.4%**.

### 7.5 Frontend companion content (all static seed data)

- **ISAE 3000/3410 checklist** — 12 items with status (Complete/In Progress/Draft) and a 0–100
  "strength" bar (colour bands: ≥75 green, ≥50 amber, else red).
- **Limited vs Reasonable** — bar chart of demo effort levels (evidence 60→90, controls 50→85,
  documentation 65→92, cost $85k→$250k) — illustrating the guide's "15–25 point gap" claim only
  qualitatively.
- **Provider comparison** — 7 named providers (Deloitte/PwC/EY/KPMG Big-4 at $245–280k vs Bureau
  Veritas/SGS/DNV specialists at $135–155k) with experience/coverage/specialisation scores —
  synthetic editorial values, not survey data.
- **Audit-trail completeness** — 6 data areas; Scope 3 worst (45%, 8 gaps); page KPI sums gaps (24).

### 7.6 Data provenance & limitations

- Every frontend number is a **hard-coded seed constant** (no PRNG here, but equally synthetic);
  provider costs and readiness scores are illustrative, not market data.
- The page never calls the backend, so its 65/100 score and the engine's weighted score can
  disagree arbitrarily; the API (`POST /api/v1/assurance-readiness/assess`, `/assess/batch`,
  `GET …/ref/criteria|standards|csrd-timeline`) is consumed elsewhere/by tests.
- Backend flag auto-derivation is binary (met/not-met) — evidence *quality* ("none/weak/adequate/
  strong") is carried through but never affects the score.
- Remediation weeks are additive heuristics, not effort models.

### 7.7 Framework alignment

- **ISAE 3000 (Revised)** — IAASB's umbrella standard for assurance on non-financial information;
  the engine tags 10 criteria to it and distinguishes limited (negative-form conclusion) vs
  reasonable (positive-form) via different tier thresholds (85 vs 92).
- **ISAE 3410** — GHG-statement assurance; implemented via D1-3/D2-x criteria (boundary, emission
  factors, prior-period comparison) mirroring ISAE 3410's specific evidence requirements.
- **ISSA 5000** — IAASB's 2024-approved sustainability assurance standard superseding ISAE 3000
  for sustainability engagements (engine notes "~2026 effective"); tagged to 15 criteria.
- **CSRD Art 26a** — mandatory limited assurance on ESRS statements; the engine encodes the 4-wave
  phase-in (FY2025 → FY2028) and escalates urgency for Wave-1 entities.
- **AA1000 AS v3 / GRI** — registered in the standards catalogue (inclusivity, materiality,
  responsiveness, impact principles) but no criterion is tagged AA1000, so its coverage never
  appears in results.
