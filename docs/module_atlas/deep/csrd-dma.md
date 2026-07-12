## 7 · Methodology Deep Dive

No MODULE_GUIDES entry exists for this route (`guide: null`), so there is no mismatch to flag. The
module is a genuine, correctly-specified **CSRD Double Materiality Assessment (DMA)** workbench: it
implements the ESRS 1 double-materiality method with real ESRS reference data, a 7-step DMA process,
user-driven severity/likelihood scoring, and a dual-threshold material-topic determination. Scores are
computed from user inputs (with an optional backend `/csrd-dma/dma-process` call), not from a PRNG.

### 7.1 What the module computes

Each of the 10 ESRS topics (E1–E5, S1–S4, G1) is scored on two independent axes:

```js
SEVERITY_SCORE   = { critical:4, significant:3, moderate:2, low:1, none:0 }
LIKELIHOOD_SCORE = { certain:4, likely:3, possible:2, unlikely:1 }

impactScore    = SEVERITY_SCORE[scale] × LIKELIHOOD_SCORE[likelihood]      // 0 … 16
financialScore = magnitude_cr × LIKELIHOOD_SCORE[likelihood]              // €-magnitude × 1..4
```

A topic is **material** if *either* axis exceeds its threshold — the ESRS "no netting" dual-threshold
rule. The material-topic set then maps to the ESRS disclosure requirements that must be reported (ESRS
2 always applies; topical standards only if material).

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| ESRS topics | E1–E5, S1–S4, G1 (10 topical + ESRS 2) | **real** — EFRAG ESRS Set 1 |
| Datapoint counts | ESRS 2: 136, E1: 61, S1: 83, … | **real** — ESRS Set 1 datapoint tallies |
| Severity scale | none/low/moderate/significant/critical → 0–4 | ESRS 1 §43 severity (scale·scope·irremediability) proxy |
| Likelihood | unlikely/possible/likely/certain → 1–4 | ESRS 1 likelihood scale |
| Impact score range | 0–16 (4×4) | derived |
| Financial score | user `magnitude_cr` × likelihood | ESRS 1 financial-materiality magnitude×likelihood |
| Reversibility / risk-type / time-horizon options | reversible/irreversible; physical/transition/litigation/market/reputational; short/med/long | **real** — ESRS 1 dimensions |
| Stakeholder groups / engagement methods | investors/employees/…; survey/interview/workshop/panel | curated (ESRS 1 stakeholder engagement) |

All inputs are user-entered; no synthetic seeding is present in the scoring path.

### 7.3 Calculation walkthrough

User rates each topic's impact (scale + likelihood) and financial (magnitude + likelihood) →
`impactScore` and `financialScore` computed per topic → topics plotted on the double-materiality
scatter (impact axis × financial axis) → those crossing either threshold enter `material_topics` →
mapped to ESRS DRs. The `POST /csrd-dma/full-assessment` (or `dma-process` / `impact-assessment` /
`financial-assessment`) endpoints can run the same logic server-side, returning `material_topics`,
`impact_material_count`, `financial_material_count`.

### 7.4 Worked example (ESRS E1 Climate change)

User rates E1 impact as `scale = significant (3)`, `likelihood = likely (3)`; financial as
`magnitude_cr = €12` with `likelihood = certain (4)`:
```
impactScore    = SEVERITY_SCORE[significant] × LIKELIHOOD_SCORE[likely] = 3 × 3 = 9   (of 16)
financialScore = 12 × LIKELIHOOD_SCORE[certain] = 12 × 4 = 48
```
If the impact threshold is (say) ≥6 and financial threshold ≥20, E1 is material on **both** axes →
included, and triggers ESRS E1 disclosure requirements (E1-1 transition plan, E1-6 GHG Scopes 1–3,
E1-8 internal carbon pricing, E1-9 financial effects). ESRS 2 is disclosed regardless.

### 7.5 Data provenance & limitations

- **No synthetic data** in the scoring path — all severity/likelihood/magnitude values are user input;
  ESRS reference data (topics, datapoint counts, DR IDs) is real and correctly cited.
- The severity axis collapses ESRS 1's three sub-dimensions (scale, scope, irremediability) into a
  single ordinal "scale" — a simplification of the full ESRS 1 §43 severity construct.
- Thresholds are configured in-app; the module does not enforce a single regulator-blessed cut (there
  isn't one — thresholds are entity-determined and disclosed under IRO-1).

**Framework alignment:** ESRS 1 double materiality (impact OR financial, no netting) · ESRS 2 general
disclosures (always mandatory; IRO-1 documents the DMA process) · EFRAG ESRS Set 1 topical standards
E1–E5/S1–S4/G1 with their real datapoint counts and DR identifiers. ESRS 1 derives materiality by
assessing impacts on severity (scale × scope × irremediable character) and likelihood, and risks/
opportunities on financial magnitude × likelihood × time horizon — exactly the two axes this module
scores. This is one of the atlas's faithfully-implemented regulatory modules.
