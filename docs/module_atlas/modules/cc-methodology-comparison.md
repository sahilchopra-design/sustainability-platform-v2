# Carbon Credit Methodology Comparison
**Module ID:** `cc-methodology-comparison` · **Route:** `/cc-methodology-comparison` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Side-by-side methodology comparison engine for all 21 carbon credit standard types. Scores each methodology on 8 ICVCM-aligned dimensions and provides filtering, ranking, and cost benchmarking to support project selection and portfolio construction.

> **Business value:** Composite methodology score = weighted sum across 8 ICVCM-aligned dimensions. Top performers: REDD+ (conservation-grade) 78/100; ARR 74/100; DAC 82/100 on permanence but 45/100 on cost.

**How an analyst works this module:**
- Filter methodologies by type, standard, or geography
- Scoring Matrix tab shows dimension-by-dimension ratings
- Ranking tab sorts by composite score or selected dimension
- Cost Benchmark tab plots price vs quality scatter chart
- Export tab downloads comparison table as CSV for procurement

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `CLUSTERS`, `DualInput`, `FAMILIES`, `FAMILY_COLORS`, `KpiCard`, `Row`, `Section`, `Sel`, `TABS`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CLUSTERS` | 21 | `name`, `family`, `permanence`, `additionality`, `mrvComplexity`, `coBenefitScore`, `avgPrice`, `bufferRate`, `abatementCost`, `sdgCommunity`, `sdgBiodiversity`, `sdgHealth`, `sdgGender` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `TABS` | `['Methodology Matrix', 'Cost Curve Analysis', 'Permanence Comparison', 'Integrity Scoring', 'Co-Benefits Analysis', 'Scenario Builder'];` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];` |
| `FAMILY_COLORS` | `{ 'Nature-Based': '#059669', 'Agriculture & Soil': '#84cc16', 'Energy Transition': '#3b82f6', 'Waste & Circular': '#f59e0b', 'Industrial Process': '#8b5cf6', 'Carbon Dioxide Removal': '#06b6d4', 'Community & Cookstoves':` |
| `maccData` | `useMemo(() => [...CLUSTERS].sort((a, b) => a.abatementCost - b.abatementCost).map(c => ({ name: c.name, cost: c.abatementCost, family: c.family, fill: FAMILY_COLORS[c.family] \|\| T.sage })), []);` |
| `permanenceData` | `useMemo(() => [...CLUSTERS].sort((a, b) => a.permanence - b.permanence).map(c => ({ name: c.name, years: Math.min(c.permanence, 10000), family: c.family, fill: FAMILY_COLORS[c.family] \|\| T.sage, label: c.permanence >= 10000 ? '10,000+' : c.permanence >= 1000 ? (c.permanence / 1000).toFixed(0) + 'k' : String(c.permanence) })), []);` |
| `coBenefitHeat` | `useMemo(() => FAMILIES.map(f => { const fc = CLUSTERS.filter(c => c.family === f);` |
| `sorted` | `[...eligible].sort((a, b) => a.abatementCost - b.abatementCost);` |
| `maxByConc` | `Math.round(retireTarget * (maxConcentration / 100));` |
| `canAfford` | `Math.floor(remaining / c.avgPrice);` |
| `totalCredits` | `allocs.reduce((s, a) => s + a.credits, 0);` |
| `totalCost` | `allocs.reduce((s, a) => s + a.cost, 0);` |
| `avgPermanence` | `allocs.length ? Math.round(allocs.reduce((s, a) => s + a.permanence * a.credits, 0) / Math.max(totalCredits, 1)) : 0;` |
| `avgCoBenefit` | `allocs.length ? Math.round(allocs.reduce((s, a) => s + a.coBenefit * a.credits, 0) / Math.max(totalCredits, 1)) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CLUSTERS`, `FAMILIES`, `RADAR_COLORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Additionality Score | `Barrier + investment test rigor` | ICVCM CCP | Strength of methodology additionality demonstration requirements |
| Permanence Score | `Storage horizon + reversal insurance` | ICVCM CCP | Credit quality dimension for long-term storage assurance |
| MRV Rigor Score | `Monitoring frequency and verification` | Methodology standard | Quality of measurement, reporting, and verification requirements |
| Credit Price Range | `Market data by methodology type` | Ecosystem Marketplace | Observed transaction price range in voluntary carbon market |
- **ICVCM assessment database** → CCP scores → dimension ratings → **Methodology quality matrix**
- **Ecosystem Marketplace transaction data** → Price observations → cost benchmarks → **Price range by methodology**

## 5 · Intermediate Transformation Logic
**Methodology:** Multi-criteria methodology scoring matrix
**Headline formula:** `Score_m = Σ(w_d × Rating_md) for d in {Additionality, Permanence, MRV, CobenefitCount, Scalability, Cost, RegAcceptance, CreditIntegrity}`

Each of 8 dimensions rated 0–10 per methodology via structured expert elicitation calibrated to ICVCM CCP assessments and third-party rating agency scores. Weights: Additionality 20%, Permanence 20%, MRV 15%, Co-benefits 15%, Scalability 10%, Cost 10%, Regulatory 5%, Integrity 5%. Composite score normalized to 0–100.

**Standards:** ['ICVCM Core Carbon Principles 2023', 'Ecosystem Marketplace', 'BeZero Carbon Ratings', 'Sylvera Carbon Ratings']
**Reference documents:** ICVCM Core Carbon Principles & Assessment Framework 2023; Ecosystem Marketplace State of VCM 2024; BeZero Carbon Rating Methodology; Sylvera Carbon Rating Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes a **weighted 8-dimension composite score**
> (`Score = Σ w_d · Rating_md`) with explicit weights (Additionality 20%, Permanence 20%, MRV 15%,
> Co-benefits 15%, Scalability 10%, Cost 10%, Regulatory 5%, Integrity 5%) normalised to 0–100. **No
> such composite is computed in the code.** Each of the 20 `CLUSTERS` carries hard-coded per-attribute
> integers (permanence, additionality, mrvComplexity, coBenefitScore, avgPrice, bufferRate,
> abatementCost, and four SDG scores), and the page *sorts and plots* these attributes directly — it
> never forms a weighted composite, and there is no "Integrity Score" field at all despite an
> "Integrity Scoring" tab. The composite is a §8 candidate. Sections below document the code.

### 7.1 What the module computes

The module is a **comparison and procurement-allocation** tool over 20 credit-type clusters. It
performs no emission calculations; every headline is a projection, sort, or filter of the seed table:

- **MACC (cost curve):** `[...CLUSTERS].sort(a.abatementCost − b.abatementCost)` → abatement $/tCO₂e.
- **Permanence comparison:** sort by `permanence` (years), capped for display at 10,000.
- **Co-benefit heatmap:** per family, averages of the 4 SDG scores across member clusters.
- **Scenario builder (the only real "engine"):** a greedy budget-constrained allocation.

Allocation logic (Scenario Builder):
```
eligible = CLUSTERS.filter(permanence ≥ minPermanence AND coBenefitScore ≥ minCoBenefits)
sorted   = eligible.sort(ascending abatementCost)      // cheapest first
maxByConc = retireTarget · (maxConcentration/100)      // per-cluster cap
// walk sorted; for each, buy min(need, maxByConc, budget-affordable) credits
canAfford = floor(remaining_budget / avgPrice)
```
Portfolio KPIs: `totalCredits`, `totalCost`, credit-weighted `avgPermanence` and `avgCoBenefit`.

### 7.2 Parameterisation / scoring rubric

Per-cluster attributes are **expert-elicited hard-coded values** (no code comment cites a source;
they are calibrated to look like ICVCM/rating-agency judgements). Representative rows:

| Cluster | Family | Permanence (yr) | Additionality | MRV cplx | Co-benefit | Avg price $/t | Buffer % | Abatement $ |
|---|---|---|---|---|---|---|---|---|
| REDD+ & Forests | Nature-Based | 40 | 65 | 85 | 82 | 12.50 | 20 | 8 |
| Household Devices | Cookstoves | 100 | 80 | 45 | 92 | 9.00 | 5 | 7 |
| Biochar | CDR | 500 | 88 | 72 | 65 | 120 | 10 | 95 |
| BECCS | CDR | 5,000 | 90 | 90 | 35 | 180 | 15 | 150 |
| DAC | CDR | 10,000 | 95 | 85 | 20 | 450 | 5 | 380 |

All 20 clusters follow the same schema. Note the internal logic: CDR types carry high permanence +
additionality but low co-benefit and high cost; cookstoves invert that. Prices (DAC $450, biochar
$120) are consistent with 2024 VCM/CDR market ranges, so the seed is *plausible* if unsourced.

### 7.3 Calculation walkthrough

Inputs are the filter thresholds (`minPermanence`, `minCoBenefits`, `maxConcentration`) and financial
constraints (`retireTarget`, `budget`). The scenario builder filters → sorts by cost → greedily fills
the target, respecting a per-cluster concentration cap and running the budget down. Outputs are the
allocation table plus credit-weighted portfolio permanence and co-benefit. The other tabs are pure
projections of the seed attributes with no user-input dependency.

### 7.4 Worked example (Scenario Builder)

`retireTarget=100,000`, `budget=$2,000,000`, `minPermanence=10`, `minCoBenefits=30`,
`maxConcentration=40%`. `maxByConc = 100,000·0.40 = 40,000` credits/cluster.

Cheapest eligible is **Renewable Energy** (abatementCost 3, avgPrice 4.50, permanence 100,
coBenefit 42 ≥ 30 ✓). `canAfford = floor(2,000,000/4.50) = 444,444`, but capped at 40,000 by
concentration → buy 40,000 for $180,000; remaining budget $1,820,000, remaining need 60,000.
Next: **Industrial Gas** (avgPrice 5.50) → 40,000 credits for $220,000; need 20,000 left. Next:
**Landfill Gas** (avgPrice 6.50) → 20,000 for $130,000. Target met.
`totalCost = $530,000`; credit-weighted `avgPermanence = 100` yr; blended cost ≈ $5.30/t.

### 7.5 Data provenance & limitations
- **All cluster attributes are hard-coded heuristic values** — no PRNG, but also no traceable source
  in the file; they are synthetic expert judgements calibrated to public VCM knowledge.
- The "Integrity Scoring" tab does not compute an integrity score; it displays additionality/MRV
  attributes. No ICVCM CCP composite exists in code (see §8).
- Allocation is single-pass greedy (cost-first); it does not optimise for co-benefit or diversify
  beyond a flat concentration cap.

**Framework alignment:** **ICVCM Core Carbon Principles (2023)** — the intended benchmark; ICVCM
assesses credits on 10 CCPs (governance: programme + registry + transparency; emissions impact:
additionality, permanence, robust quantification, no double-counting; sustainable development
safeguards) at the *programme + methodology-category* level, yielding a binary CCP-label plus
category attributes. This module's per-attribute scores approximate those CCP dimensions but do not
reproduce ICVCM's binary assessment. **BeZero / Sylvera** ratings are the third-party analogues for
the additionality/permanence/MRV columns.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module *displays* a "methodology
integrity/quality score" (guide's weighted composite) that the code never computes. This section
specifies the production scoring model.

**8.1 Purpose & scope.** Produce a single 0–100 quality score per credit methodology cluster to rank
procurement options and screen a buy-list, reconcilable against ICVCM CCP labels and BeZero/Sylvera
letter grades. Coverage: the 20 methodology clusters, extensible to project-level.

**8.2 Conceptual approach.** A weighted multi-attribute utility (MAU) model — the standard structure
behind Sylvera's and BeZero's published rating frameworks and ICVCM's CCP attribute roll-up. Each
attribute is min-max normalised to 0–1, oriented so higher = better (MRV *complexity* and *cost* are
inverted), then combined by fixed weights. This mirrors (a) **Sylvera's** carbonment (additionality,
permanence, co-benefits, over-crediting risk) and (b) **ICVCM CCP** attribute aggregation.

**8.3 Mathematical specification.**
```
For attribute d ∈ {Add, Perm, MRV, CoB, Scal, Cost, Reg, Int}:
  x_d      = raw cluster value
  n_d      = (x_d − min_d)/(max_d − min_d)          // min-max across clusters
  n_d      = 1 − n_d   if d ∈ {MRVComplexity, AbatementCost}   // invert "worse-is-higher"
Perm handled log-scaled:  n_Perm = min(1, ln(1+years)/ln(1+10000))
Score_m  = 100 · Σ_d w_d · n_d
Over-crediting penalty:  Score_m ← Score_m · (1 − 0.5·bufferShortfall)
```
| Parameter | Value | Calibration source |
|---|---|---|
| w_Add, w_Perm | 0.20, 0.20 | Guide weights; align to ICVCM emphasis on additionality+permanence |
| w_MRV, w_CoB | 0.15, 0.15 | Guide weights |
| w_Scal, w_Cost | 0.10, 0.10 | Guide weights |
| w_Reg, w_Int | 0.05, 0.05 | Guide weights |
| Perm log anchor | 10,000 yr | DAC/geologic permanence ceiling (Puro/Oxford durability) |
| bufferShortfall | max(0, req − actual)/req | Verra AFOLU Non-Permanence Risk Tool buffer requirement |

**8.4 Data requirements.** Per cluster: the 8 attribute scores (from ICVCM assessment DB + Sylvera/
BeZero API), observed VCM transaction price (Ecosystem Marketplace / AlliedOffsets), required buffer
(registry NPR tool). Platform already holds the seed table; needs live rating-agency feeds.

**8.5 Validation & benchmarking plan.** Rank-correlate Score_m against (a) ICVCM CCP-eligibility
(point-biserial: eligible clusters should score in top quartile), (b) Sylvera/BeZero letter grades
(Spearman ρ target ≥ 0.7). Sensitivity: vary each weight ±5pp and confirm ranking stability
(Kendall τ). Backtest: do higher-scored methodologies command observed price premia?

**8.6 Limitations & model risk.** MAU weights are judgemental; a fixed weight set cannot capture
buyer-specific objectives (a net-zero buyer over-weights permanence). Min-max normalisation is
sensitive to outliers (DAC's 10,000-yr permanence compresses everyone else). Conservative fallback:
report the attribute vector alongside the composite so users can re-weight; flag any cluster whose
ICVCM label contradicts its computed score.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the advertised composite score, sourced not seeded (analytics ladder: rung 1 → 2)

**What.** The §7 flag is explicit: the guide advertises a weighted 8-dimension
composite (`Score = Σ w_d·Rating_md`, weights 20/20/15/15/10/10/5/5, normalised 0–100)
but **no composite is computed** — the page sorts and plots hard-coded per-attribute
integers from the 20-row `CLUSTERS` seed, and the "Integrity Scoring" tab has no
integrity field at all. Evolution A implements the composite exactly as the guide
specifies, and moves the underlying ratings from invented integers to sourced values:
permanence horizons and buffer rates from registry methodology documents, price and
abatement-cost fields from the Ecosystem Marketplace State of VCM data the §5 reference
list already cites, integrity bands mapped from published BeZero/Sylvera rating
distributions.

**How.** (1) Pure scoring function with the documented weight vector, unit-tested; user
-adjustable weights as a rung-2 sensitivity feature (re-rank as weights slide).
(2) `ref_methodology_ratings(cluster, dimension, rating, source, as_of)` table replacing
the in-page integers; each matrix cell shows its source on hover. (3) The MACC sort and
permanence comparison keep working unchanged — they already use real per-attribute
logic.

**Prerequisites.** Rating-agency data used at band level only (published distributions,
not paywalled per-project scores); the mismatch flag must clear. **Acceptance:** the
composite for REDD+ conservation-grade reproduces the guide's worked 78/100 example
under default weights; changing the additionality weight from 20% to 30% re-ranks
observably.

### 9.2 Evolution B — Procurement advisor copilot (LLM tier 1)

**What.** A copilot that turns the comparison matrix into procurement reasoning: "we
need 50kt for CORSIA with permanence >100y and budget $15/t — which families survive?"
answered by narrating the page's real filter/sort mechanics over the (post-Evolution A,
sourced) ratings table, and "why does DAC score 82 on permanence but 45 on cost?" from
the dimension definitions in §5. Strictly explanatory — this module computes no
emissions and has no backend endpoints, so tier 1 is the honest scope.

**How.** Atlas record plus the ratings table (with sources) as RAG corpus; the current
filter state and visible ranking injected as context. Constraint-screening questions
are answered by restating which rows pass the user's stated thresholds — verifiable
against the on-screen table — never by inventing scores. Export questions route to the
existing CSV path.

**Prerequisites (hard).** Evolution A first: a copilot narrating today's hard-coded
integers as "ICVCM-aligned scores" would misrepresent seed data as assessments.
**Acceptance:** every score cited in an answer matches the rendered matrix cell and
carries its source; a request for a specific project's Sylvera rating is refused
(cluster-level data only).