## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code / engine↔page note.** The Double Materiality Workshop (EP-AZ1) shares the
> `double_materiality_engine.py` reference (ESRS 1 / EFRAG IG 1), but the **frontend page does not call
> that engine** — it generates all topic scores with the seeded PRNG `genTopicScores` and applies a
> **different, simpler threshold** (impact/financial ≥ **2.5 on a 1–5 scale**) than the engine's
> normalised **0.40** cutoff. It is the *facilitation UI* (assess → IRO registry → matrix → gap analysis)
> for capturing the 1–5 ratings the engine would consume, but here those ratings are demo-seeded, not
> workshop-captured. Below documents the page.

### 7.1 What the module computes

Per ESRS topic (10 topics, E1–E5/S1–S4/G1), `genTopicScores(n)` synthesises:
```js
impact       = sr(n·31+ti·7)·3.5 + 1      → 1.0–4.5 (1–5 scale)
financial    = sr(n·37+ti·11)·3.5 + 1     → 1.0–4.5
completeness = ⌊sr(…)·50 + 45⌋            → 45–95 %
dpCoverage   = ⌊sr(…)·40 + 55⌋            → 55–95 %
iros[6]      = { type, score = sr(…)·3+1, identified = sr(…) > 0.45 }
stakeholders = filter of 4 sources by sr(…) > 0.4
```
**Materiality classification** (page rule, NOT the engine's):
```js
matQuadrant(imp, fin):
   imp≥2.5 && fin≥2.5 → Material (Both)
   imp≥2.5            → Impact Material
   fin≥2.5            → Financial Material
   else               → Not Material
material = count(imp≥2.5 || fin≥2.5)
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Materiality threshold | 2.5 / 5 | page rule (engine uses 0.40 normalised — different) |
| Impact score range | 1.0–4.5 | `sr()·3.5 + 1` |
| IRO types | 6 (actual/potential ± impact, Risk, Opportunity) | `IRO_TYPES` — ESRS 1 IRO taxonomy |
| NACE triggers | per topic (E1: B/C/D/E; S1/S2/G1: ALL) | `NACE_TRIGGERS` (simplified vs engine's full matrix) |
| ESRS topics | 10 (with 3–5 sub-topics each) | `ESRS_TOPICS` |
| Tabs | Assessment / IRO Registry / Matrix / Gap Analysis | workshop flow |

The topic taxonomy, IRO types and NACE-trigger concept are **standards-correct** (ESRS 1 / EFRAG IG 1),
but the numeric scores are `sr(seed)=frac(sin(seed+1)×10⁴)` **synthetic**. `SECTOR_SCORES = genTopicScores(1)`
seeds the whole workshop from a single index; users can then edit scores via `updateScore` (live sliders).

### 7.3 Calculation walkthrough

1. `SECTOR_SCORES` seeds the 10 topics with impact/financial/completeness/IRO/stakeholder values.
2. **Assessment tab** — KPI tiles (material count, doubly-material, avg impact, avg financial); editable
   per-topic scores grouped by E/S/G pillar.
3. **IRO Registry** — lists the 6 IRO types per topic with score and identified flag.
4. **Matrix** — impact (y) vs financial (x) scatter with the 2.5×2.5 quadrant lines.
5. **Gap Analysis** — DP coverage / completeness vs mandatory expectations; NACE-trigger check.

### 7.4 Worked example

Topic E1, n=1, ti=0: `impact = sr(31)·3.5 + 1`. If sr(31) ≈ 0.71 → impact = 3.49 → **3.5**.
`financial = sr(37)·3.5 + 1`; if sr(37) ≈ 0.62 → 3.17 → **3.2**. Both ≥ 2.5 → `matQuadrant(3.5, 3.2)` =
**Material (Both)**. Contrast the engine: to reach its 0.40 threshold, E1 would need impact = 0.64 on the
0–1 scale (as in the Double Materiality worked example) — the two modules use different scales and cutoffs
and are **not** directly comparable numerically.

### 7.5 Data provenance & limitations

- **All workshop scores are synthetic** (`genTopicScores` via `sr()`), including impact, financial, IRO
  scores, completeness and DP coverage. The page is a **facilitation shell**, not a scoring engine.
- The **threshold and scale differ from the backend engine** (2.5/5 here vs 0.40 normalised there), so a
  topic "material" in the workshop is not computed the same way as in Double Materiality — a consistency
  gap that should be reconciled to the engine.
- NACE triggers are a simplified per-topic list, not the engine's full 50-row NACE×ESRS matrix.

**Framework alignment:** **ESRS 1 / EFRAG IG 1** double-materiality process (impact vs financial, IRO
registry, materiality matrix, ESRS gap/completeness), **CSRD** disclosure scope. The workshop correctly
mirrors the *process* an assurer expects (documented assessment → IRO → matrix → gap) but the numbers are
placeholders.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code (wire the page to the real engine).**

### 8.1 Purpose & scope
A workshop tool that captures real 1–5 impact/financial ratings per ESRS topic and runs them through the
`double_materiality_engine.py` scoring — producing an assurer-ready double-materiality determination for a
single reporting entity.

### 8.2 Conceptual approach
Replace `genTopicScores` seeds with **facilitator-captured ratings** and delegate scoring to the existing
engine (impact = max(scale·scope·irremediability/125, likelihood·scale/25); financial = likelihood·magnitude/25;
threshold 0.40; NACE baseline for unassessed topics). Benchmarks: ESRS 1, EFRAG IG 1, big-4 CSRD
materiality methodologies.

### 8.3 Mathematical specification
```
Inputs per topic: {scale, scope, irremediability, impact_likelihood, fin_likelihood, magnitude} ∈ 1..5
Impact = max(scale·scope·irremediability/125, impact_likelihood·scale/25)
Financial = fin_likelihood·magnitude/25
Double material if max(Impact, Financial) ≥ 0.40
Assurance readiness = Σ w_c · criterion_score_c  (ASSURANCE_CRITERIA weights)
Completeness = reportedDPs / mandatoryDPs(sector)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Threshold | 0.40 | engine `MATERIALITY_THRESHOLD` (ESRS 1) |
| NACE baseline | — | engine `NACE_MATERIALITY_MATRIX` |
| Assurance weights | 0.25/0.20/0.25/0.15/0.15 | engine `ASSURANCE_CRITERIA` |

### 8.4 Data requirements
Facilitator-entered ratings, entity NACE sector and employee count, stakeholder-engagement evidence,
reported DP inventory. Platform holds the full engine reference data (`ESRS_TOPICS`, NACE matrix, IRO
definitions, CSRD waves) and LocalStorage `ra_materiality_assessment_v1`.

### 8.5 Validation & benchmarking plan
Consistency check: workshop output must equal the Double Materiality engine output for the same ratings;
audit-trail completeness; inter-rater reliability across facilitators; reconcile against a big-4 CSRD
materiality assessment on a pilot entity.

### 8.6 Limitations & model risk
Materiality ratings are inherently subjective; facilitator bias and stakeholder-selection bias are the
main risks. Conservative fallback: default unassessed topics to the NACE "high" baseline (material) rather
than "not material", so nothing material is silently omitted.
