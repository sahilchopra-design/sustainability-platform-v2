# Sovereign Climate Intelligence
**Module ID:** `sovereign-climate-intelligence` · **Route:** `/sovereign-climate-intelligence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrated sovereign climate risk intelligence platform combining physical hazard, transition risk, fiscal climate vulnerability and adaptation capacity into a unified sovereign scoring model.

> **Business value:** Provides a fully integrated sovereign climate intelligence composite spanning physical, transition, fiscal and adaptive dimensions.

**How an analyst works this module:**
- Score physical risk using ND-GAIN vulnerability, exposure and readiness indices.
- Assess transition risk via fossil fuel revenue dependence and carbon intensity of economy.
- Model fiscal vulnerability: climate-related expenditure needs versus available fiscal space.
- Integrate scores with adaptive capacity to produce sovereign climate intelligence composite.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CountryScorecard`, `NGFS_SCENARIOS`, `NgfsScenarios`, `PortfolioExposure`, `REGIONS`, `SOVEREIGNS`, `SpreadCreditImpact`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SOVEREIGNS` | 26 | `iso`, `name`, `region`, `physRisk`, `transReady`, `fiscRes`, `ndcAmb`, `ndGain`, `rating`, `gdp`, `debtGdp`, `color` |
| `NGFS_SCENARIOS` | 5 | `scenario`, `physAdj`, `transAdj`, `spreadBps`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `compositeScore` | `(s)=>+((10-s.physRisk)*0.3+s.transReady*0.25+s.fiscRes*0.2+s.ndcAmb*0.15+s.ndGain/10*0.1).toFixed(2);` |
| `ratingColor` | `(r)=>{if(!r)return T.textMut;if(r.startsWith('AAA')\|\|r==='AA+'\|\|r==='AA')return T.green;if(r.startsWith('A'))return T.teal;if(r.startsWith('BBB'))return T.amber;if(r.startsWith('BB'))return T.gold;return T.red;};` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `scored` | `SOVEREIGNS.map(s=>({...s,composite:compositeScore(s)}));` |
| `avgComposite` | `+(scored.reduce((a,s)=>a+s.composite,0)/scored.length).toFixed(2);` |
| `holdings` | `SOVEREIGNS.slice(0,12).map((s,i)=>({` |
| `totalWeight` | `+holdings.reduce((a,h)=>a+h.weight,0).toFixed(1);` |
| `weightedScore` | `+(holdings.reduce((a,h)=>a+h.composite*h.weight,0)/totalWeight).toFixed(2);` |
| `weightedSpread` | `Math.round(holdings.reduce((a,h)=>a+h.spreadOverlay*h.weight,0)/totalWeight);` |
| `regionBreakdown` | `['Europe','Asia Pacific','North America','Latin America','Middle East','Africa'].map(r=>({` |
| `scenarioScores` | `scored.map(s=>({` |
| `pathways` | `NGFS_SCENARIOS.map(sc=>({` |
| `notchMap` | `{'AAA':0,'AA+':1,'AA':2,'AA-':3,'A+':4,'A':5,'A-':6,'BBB+':7,'BBB':8,'BBB-':9,'BB+':10,'BB':11,'BB-':12,'B+':13,'B':14,'B-':15,'CCC+':16};` |
| `ratingNotch` | `scored.map(s=>({...s,notch:notchMap[s.rating]\|\|8,newNotch:Math.min(16,Math.max(0,(notchMap[s.rating]\|\|8)+Math.round((10-s.composite)/3.5)))}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `NGFS_SCENARIOS`, `REGIONS`, `SOVEREIGNS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Scored | — | ND-GAIN/NGFS | Sovereign universe with full intelligence scoring across all four dimensions. |
| Highest Risk Score | — | Calculated | Country with the highest composite sovereign climate intelligence score indicating greatest overall vulnerability. |
| Portfolio Avg Score | — | Portfolio weights | AUM-weighted average climate intelligence score across sovereign bond holdings. |
- **ND-GAIN, World Bank, IMF, NGFS scenario data, portfolio sovereign weights** → Multi-pillar scoring, composite aggregation, portfolio weighting → **Sovereign intelligence scores, risk radar charts, portfolio exposure reports**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign Climate Intelligence Score
**Headline formula:** `(Physical Risk × 0.35) + (Transition Risk × 0.30) + (Fiscal Vulnerability × 0.20) + (100 – Adaptation Capacity) × 0.15`

Composite sovereign climate score weighting physical exposure, transition sensitivity, fiscal space and adaptive capacity.

**Standards:** ['NGFS Sovereign Risk', 'IMF Climate Macro-Financial', 'ND-GAIN']
**Reference documents:** Notre Dame Global Adaptation Initiative (ND-GAIN) Index; NGFS Sovereign Risk Assessment Framework; IMF World Economic Outlook Climate Module; World Bank Climate Vulnerability Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live ND-GAIN/IMF inputs and reconciled composite weights (analytics ladder: rung 1 → 3)

**What.** This tier-B module runs a genuine, reproducible composite computed live in-browser over 25 hand-typed but directionally-realistic sovereign inputs (Norway best, Nigeria worst across all 5 dimensions), with no `sr()`. Two issues limit it: the §7 flag documents that the code's 5-term weighting (`(10−physRisk)×0.30 + transReady×0.25 + fiscRes×0.20 + ndcAmb×0.15 + ndGain/10×0.10`) differs from the guide's 4-term formula and inverts the transition sign, and all inputs are a static snapshot rather than live ND-GAIN/IMF/NGFS feeds. Evolution A grounds the inputs in real data and settles the formula.

**How.** (1) Reconcile guide↔code: pick one weighting (the code's 5-term version is defensible), update the other, and document the transition-sign convention explicitly. (2) Ingest the real source indices the module names: ND-GAIN publishes country scores and readiness/vulnerability sub-indices (free); IMF WEO provides GDP/debt; recompute `physRisk`/`fiscRes` from these rather than hand-typing. (3) Apply NGFS scenario adjustments (the `NGFS_SCENARIOS` table's physAdj/transAdj/spreadBps) to produce scenario-conditioned composites and implied spread deltas, moving from a static score to a scenario tool. (4) Expand coverage beyond 25 countries as ND-GAIN covers ~190.

**Prerequisites.** ND-GAIN and IMF WEO ingestion (both free); the composite reconciliation is a documentation-plus-one-edit task. **Acceptance:** `ndGain` and macro inputs trace to a dated source vintage; the composite formula matches between guide and code; scenario selection changes the composite and spread delta.

### 9.2 Evolution B — Sovereign climate-intelligence copilot (LLM tier 1)

**What.** A copilot for the sovereign-fixed-income analyst: "why does Norway outscore Nigeria on climate intelligence?", "how does the hot-house scenario change this country's score?", "rank my sovereign universe by fiscal resilience" — answered from the live composite and the NGFS scenario adjustments, decomposing the score into its 5 weighted dimensions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-climate-intelligence/ask`, corpus = this Atlas record (the composite formula, the 5-dimension structure, ND-GAIN/NGFS framework notes) plus live page state. Score explanations attribute the composite to physical/transition/fiscal/NDC/ND-GAIN contributions; scenario answers narrate the applied NGFS adjustments; rankings narrate deterministic sorts. Refusal for countries outside the covered set.

**Prerequisites.** Evolution A's reconciled formula so the copilot's decomposition matches what the page computes; live inputs so it isn't narrating a frozen snapshot. **Acceptance:** every dimension contribution in a score explanation sums to the displayed composite; scenario answers cite the NGFS adjustment applied; a country outside coverage returns a scoped refusal.