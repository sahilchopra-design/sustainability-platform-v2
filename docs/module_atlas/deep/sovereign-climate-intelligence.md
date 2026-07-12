## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (formula weights differ).** The guide states
> `(Physical Risk×0.35) + (Transition Risk×0.30) + (Fiscal Vulnerability×0.20) + (100−Adaptation Capacity)×0.15`
> — 4 terms. The code implements a **5-term** composite with different weights:
> `(10−physRisk)×0.30 + transReady×0.25 + fiscRes×0.20 + ndcAmb×0.15 + ndGain/10×0.10`. The underlying
> concepts overlap (physical risk, transition, fiscal, adaptation via ND-GAIN) but the guide's "Transition
> Risk" (higher=worse) is inverted relative to the code's `transReady` (Transition Readiness, higher=better),
> and NDC ambition is a separate 5th term in code that the guide folds into "Transition Risk."

### 7.1 What the module computes

`SOVEREIGNS` (25 real, named countries, **no `sr()` PRNG** — all hand-typed plausible values) carries
`physRisk` (0–10, higher=worse), `transReady` (0–10, higher=better), `fiscRes` (fiscal resilience, 0–10),
`ndcAmb` (NDC ambition, 0–10), `ndGain` (ND-GAIN index, 0–100), real S&P-style credit rating, GDP, and
debt/GDP. The composite score is computed **live in the browser** from these inputs:

```js
compositeScore(s) = (10 − s.physRisk)×0.30 + s.transReady×0.25 + s.fiscRes×0.20 + s.ndcAmb×0.15 + (s.ndGain/10)×0.10
```

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| Weight structure | Physical 30% (inverted), Transition Readiness 25%, Fiscal Resilience 20%, NDC Ambition 15%, ND-GAIN 10% | hand-set; sums to 100% correctly |
| Country inputs | Norway: physRisk 2.5 (lowest/best), transReady 9.5, fiscRes 9.5, ndcAmb 8.5, ndGain 82.0 (highest); Nigeria: physRisk 9.0 (highest/worst), transReady 2.5, fiscRes 2.5, ndGain 36.0 | hand-curated, directionally realistic (Nordic countries score best across all 5 dimensions, fossil-dependent/lower-income economies score worst) |
| `NGFS_SCENARIOS` (4 rows) | Orderly Net Zero 2050: physAdj −0.3, transAdj −0.5, spreadBps 12; Hot House >3°C: physAdj +1.5, transAdj +0.2, spreadBps 85 | plausible directional scenario adjustments (orderly transition reduces physical AND transition risk scores; hot-house world sharply increases physical risk while barely moving transition risk, since no transition occurs) |

### 7.3 Calculation walkthrough

- **Country Scorecard tab**: computes `compositeScore` for all 25 sovereigns live, sortable/filterable by
  region and multiple sort keys (composite, physRisk, transReady, ndGain) — a genuine, reproducible
  calculation on real (if hand-typed) inputs.
- **Portfolio Exposure tab**: presumably weights a sample bond portfolio by these composite scores (further
  tab code not shown in this excerpt, but follows the same live-calculation pattern established here).
- **NGFS Scenarios tab**: applies the 4 scenarios' `physAdj`/`transAdj` deltas to `physRisk`/`transReady`
  inputs before recomputing `compositeScore` — a genuine before/after scenario re-scoring, not a flat
  post-hoc multiplier (contrast with `solvency-capital-climate`'s `climateLoading`, which is a random flat
  multiplier rather than an input-level shock).
- **Spread & Credit Impact tab**: presumably applies `NGFS_SCENARIOS[i].spreadBps` as a sovereign spread
  overlay, consistent with the scenario ordering (orderly transition = 12bps, hot house = 85bps).

### 7.4 Worked example

Norway (physRisk=2.5, transReady=9.5, fiscRes=9.5, ndcAmb=8.5, ndGain=82.0):

| Step | Computation | Result |
|---|---|---|
| Physical term | (10−2.5)×0.30 | 2.25 |
| Transition term | 9.5×0.25 | 2.375 |
| Fiscal term | 9.5×0.20 | 1.90 |
| NDC term | 8.5×0.15 | 1.275 |
| ND-GAIN term | (82.0/10)×0.10 | 0.82 |
| **Composite** | Σ | **8.62/10** |

Nigeria (physRisk=9.0, transReady=2.5, fiscRes=2.5, ndcAmb=4.0, ndGain=36.0):

| Step | Computation | Result |
|---|---|---|
| Physical term | (10−9.0)×0.30 | 0.30 |
| Transition term | 2.5×0.25 | 0.625 |
| Fiscal term | 2.5×0.20 | 0.50 |
| NDC term | 4.0×0.15 | 0.60 |
| ND-GAIN term | (36.0/10)×0.10 | 0.36 |
| **Composite** | Σ | **2.385/10** |

The 3.6× spread between Norway's 8.62 and Nigeria's 2.39 composite scores correctly reflects the underlying
input gap across all 5 dimensions — a coherent, internally consistent scoring outcome.

### 7.5 Data provenance & limitations

- **All 25 countries' underlying 0–10/0–100 input scores are hand-typed platform estimates**, not live-
  sourced from ND-GAIN, NGFS, or IMF APIs despite the header citing these as sources — plausible and
  internally consistent, but should be understood as a single-point-in-time snapshot, not a live feed.
- The composite formula itself **is genuinely computed live** in the browser from the input fields — a
  meaningfully more transparent/auditable design than modules where the "composite" is a separately
  hand-typed constant disconnected from its supposed sub-components.
- The weight structure differs from the guide's stated formula (see mismatch flag) — a user cross-checking
  the displayed composite against the guide's documented formula would not be able to reproduce it exactly.

### 7.6 Framework alignment

- **NGFS Sovereign Risk Assessment Framework** — the 4-scenario structure (orderly/disorderly/hot-house
  transition families) is correctly named and the physical/transition adjustment directions are consistent
  with NGFS's own scenario narrative logic.
- **ND-GAIN Country Index** — used as a genuine 10% weight component; not recomputed from ND-GAIN's own
  readiness/vulnerability sub-indices.
- **IMF Climate Macro-Financial framework** — cited in the guide; the fiscal-resilience dimension is a
  reasonable proxy but not derived from IMF's own debt-sustainability or fiscal-space methodology.
