## 7 · Methodology Deep Dive

Double Materiality implements the **ESRS 1 CSRD double-materiality assessment** — the strongest
standards-grounded engine in this batch. The backend `double_materiality_engine.py` scores impact and
financial materiality across all 10 ESRS topics with a proper NACE-sector trigger matrix, IRO
identification, materiality-matrix quadrants, omission checking and completeness scoring. The frontend
renders the same ESRS topic taxonomy with per-company scoring (partly seeded). The guide's `EMS = 0.5·FM
+ 0.5·IM` framing is consistent with the double-materiality logic, so **no mismatch flag** — the caveat is
that frontend company scores can be `sr()`-seeded.

### 7.1 What the module computes (engine, authoritative)

```
Impact materiality  = max( scale·scope·irremediability / 125 ,  likelihood·scale / 25 )   → 0–1
Financial materiality = likelihood · magnitude / 25                                        → 0–1
Double material if either score ≥ MATERIALITY_THRESHOLD (0.40)
```
All six inputs are 1–5 Likert ratings (ESRS 1 severity dimensions: **scale, scope, irremediability**,
plus **likelihood**; financial = **likelihood × magnitude**). The `/125` normaliser is 5³ (max of
scale·scope·irremediability); `/25` is 5² (max of the two-factor products). Where a topic is **not**
company-assessed, the engine falls back to a **NACE-sector baseline** (`NACE_MATERIALITY_MATRIX`:
high/medium/low/na per NACE section × ESRS topic).

Further engine methods: **IRO identification** (per-topic IRO scoring using `IRO_TYPE_DEFINITIONS`
weights), **materiality matrix** (2-D impact×financial with quadrant classification), **omission checker**
(validates ESRS 1 paras 29–35 justifications), **completeness scoring** (mandatory-DP coverage %), and
**assurance readiness** (`ASSURANCE_CRITERIA` weighted 0.25/0.20/0.25/0.15/0.15 vs limited/reasonable
thresholds).

### 7.2 Parameterisation / scoring rubric

| Threshold / weight | Value | Provenance |
|---|---|---|
| Materiality threshold | 0.40 | `MATERIALITY_THRESHOLD` (ESRS 1 double-materiality cutoff) |
| Limited-assurance | 0.60 | `LIMITED_ASSURANCE_THRESHOLD` |
| Reasonable-assurance | 0.85 | `REASONABLE_ASSURANCE_THRESHOLD` |
| Impact normaliser | /125 (=5³) and /25 (=5²) | max of the severity products |
| IRO impact/financial weights | e.g. actual-neg 1.0/0.5; physical-risk 0.3/1.0; transition 0.4/1.0 | `IRO_TYPE_DEFINITIONS`, ESRS 1 AR 3/AR 11 |
| ESRS topics / sub-topics | 10 / 55 | `ESRS_TOPICS` (E1–E5, S1–S4, G1) |
| NACE matrix | 20 sections + ~30 subsector overrides | `NACE_MATERIALITY_MATRIX` |
| CSRD waves | 4 (2024→2028) | `CSRD_WAVE_TIMELINE`, CSRD Art 5 |

Every sub-topic carries a real `dp_reference` (E1-6, S1-14…), an EFRAG **IG 3** implementation note,
sector applicability (NACE letters), IRO types, and per-topic impact/financial thresholds. These are
**genuine standards references**, not synthetic. IRO-type weights are the engine's calibrated priors
(physical/transition risk weight financial materiality 1.0; positive impacts weight impact only).

### 7.3 Calculation walkthrough

1. `conduct_double_materiality` iterates all 10 ESRS topics.
2. If the company supplied a `TopicAssessment` (six 1–5 ratings) → score via the formulas above; else use
   the NACE baseline for the entity's sector.
3. Flag each topic material (impact / financial / double); count IROs for material topics.
4. Build the materiality matrix (impact vs financial), completeness % vs mandatory DPs, and assurance
   readiness score.
5. Frontend: renders the ESRS topic tree, materiality scatter, and per-company scores (seeded where no
   real assessment exists in LocalStorage `ra_materiality_assessment_v1`).

### 7.4 Worked example (topic E1 Climate Change)

Company rates E1: impact scale 4, scope 5, irremediability 3, likelihood 4; financial likelihood 4,
magnitude 5.
```
Impact = max( 4·5·3/125 , 4·4/25 ) = max( 60/125 , 16/25 ) = max(0.48, 0.64) = 0.64
Financial = 4·5/25 = 20/25 = 0.80
0.64 ≥ 0.40 (impact material) AND 0.80 ≥ 0.40 (financial material) → DOUBLE MATERIAL
```
E1 has 6 sub-topics with 3–4 IRO types each → the material-topic IRO count adds ~20 IROs. If instead the
company did not assess E1 and its NACE sector is "C" (manufacturing, E1 = "high"), the NACE baseline maps
"high" to a material score, so E1 is flagged material even without a company assessment.

### 7.5 Companion analytics

- **Materiality matrix** — impact (y) vs financial (x), quadrants: double-material / impact-only /
  financial-only / not-material.
- **Omission checker** — validates each unreported topic against ESRS 1 omission grounds (not-applicable
  requires NACE evidence; immaterial/proprietary/third-party limitation require justification).
- **Completeness** — reported DPs / mandatory DPs for the sector.
- **CSRD wave** — infers reporting wave from employee count; shows first-year relief topics.
- **Stakeholder & assurance** — engagement groups (ESRS 1 para 20–22) and assurance-readiness scoring.

### 7.6 Data provenance & limitations

- **Engine reference data is real and standards-cited** (ESRS 1, EFRAG IG 3, Delegated Reg (EU) 2023/2772,
  CSRD Directive). The scoring formulas are transparent and defensible.
- **Frontend per-company scores can be synthetic** via `sRand(seed)=frac(sin(seed+1)×10⁴)` when no user
  assessment is present — the *inputs* (1–5 ratings) are what should come from a real workshop, not a seed.
- The impact formula's `max()` of two products is an engine design choice (severity-dominant OR
  likelihood-dominant), not a single ESRS-prescribed equation — ESRS 1 defines the *dimensions* but leaves
  the aggregation to the preparer.

**Framework alignment:** **ESRS 1** double materiality (impact = severity {scale, scope, irremediability}
× likelihood; financial = likelihood × magnitude; material if either crosses threshold); **EFRAG IG 1**
materiality-assessment guidance; **CSRD Directive (EU) 2022/2464** and **Delegated Regulation (EU)
2023/2772** (ESRS Set 1); **NACE** sector materiality triggers; ESRS 1 paras 29–35 omission grounds. IRO
typing follows ESRS 1 AR 3 (impacts) and AR 11–12 (risks/opportunities).

This module does **not** require a §8 model specification: the methodology is a faithful, standards-cited
implementation of ESRS 1. The only production gap is replacing seeded frontend company scores with real
assessed 1–5 ratings captured via the Double Materiality Workshop.
