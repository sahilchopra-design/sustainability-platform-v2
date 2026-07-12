# Scenario Conditional Prediction
**Module ID:** `scenario-conditional-prediction` · **Route:** `/scenario-conditional-prediction` · **Tier:** B (frontend-computed) · **EP code:** EP-CX5 · **Sprint:** CX

## 1 · Overview
Custom scenario builder with 4 input sliders, conditional predictions, 2D sensitivity surface, and pathway analysis.

**How an analyst works this module:**
- Scenario Builder adjusts 4 input sliders
- Conditional Predictions show entity scores under custom scenario
- Sensitivity Surface shows 2D score response heatmap

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `Card`, `ENTITIES`, `KPI`, `NGFS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS` | 6 | `name`, `carbonPrice`, `gdp`, `techCost`, `policy`, `color` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `predictions` | `useMemo(() => ENTITIES.map((e,i) => {` |
| `base` | `55 + (sr(i * 23) * 2 - 1)*18;` |
| `carbonEffect` | `(carbonPrice - 100) * 0.03;` |
| `gdpEffect` | `(gdpGrowth - 2) * 2;` |
| `techEffect` | `(1 - techCost) * 15;` |
| `policyEffect` | `(policyStringency - 50) * 0.1;` |
| `predicted` | `Math.round(Math.max(10, Math.min(95, base + carbonEffect + gdpEffect + techEffect + policyEffect)));` |
| `score` | `Math.round(Math.max(10, Math.min(95, base + (cp-100)*0.03 + (gd-2)*2 + (1-techCost)*15 + (policyStringency-50)*0.1)));` |
| `pathwayData` | `useMemo(() => ['2025','2026','2027','2028','2029','2030'].map((yr,yi) => {` |
| `yearEffect` | `yi * ((s.carbonPrice-100)*0.005 + (s.gdp-2)*0.3);` |
| `comparisonData` | `useMemo(() => NGFS.map(s => {` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITIES`, `NGFS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Input Dimensions | — | Scenario builder | Carbon price, GDP, tech cost, policy |
| NGFS Presets | — | NGFS | Auto-fill from standard scenarios |

## 5 · Intermediate Transformation Logic
**Methodology:** Scenario-conditional inference
**Headline formula:** `y_hat = f(carbon_price, gdp_growth, tech_cost, policy_stringency | entity)`

4 configurable inputs: carbon price (€50-300), GDP growth (-3% to +5%), technology cost index (0.5-2.0), policy stringency (0-100). NGFS presets auto-fill inputs. 2D sensitivity heatmap shows score response surface.

**Standards:** ['NGFS', 'Ensemble model']
**Reference documents:** NGFS Phase 5 Scenarios

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide labels the standard as "Ensemble model" and
> describes `y_hat = f(carbon_price, gdp_growth, tech_cost, policy_stringency | entity)`. **The
> code implements a single fixed-coefficient linear combination, not an ensemble** (no multiple
> models are combined/averaged/voted — there is exactly one deterministic formula applied
> uniformly to every entity). The formula itself is a real, transparent linear scoring function;
> "ensemble" is a mislabel for what is a simple multi-factor linear model.

### 7.1 What the module computes

```
base         = 55 + (sr(i x 23) x 2 - 1) x 18          // entity-specific baseline, 37-73 range
carbonEffect = (carbonPrice - 100) x 0.03               // per $/tCO2 above/below EUR100 reference
gdpEffect    = (gdpGrowth - 2) x 2                       // per pp above/below 2% reference growth
techEffect   = (1 - techCost) x 15                       // techCost index: 1.0=neutral, <1=cheaper tech boosts score
policyEffect = (policyStringency - 50) x 0.1             // per point above/below 50 (mid) stringency
predicted    = clip(base + carbonEffect + gdpEffect + techEffect + policyEffect, 10, 95)
```
Every entity's score responds to the same 4 user-adjustable sliders via the same linear
coefficients — only the entity-specific `base` term differs (seeded once per entity, stable across
scenario changes).

### 7.2 Parameterisation

| Input slider | Range | Reference point | Coefficient | Provenance |
|---|---|---|---|---|
| Carbon price | EUR50-300/tCO2 | EUR100 (neutral) | x0.03 per EUR/t | Hard-coded assumption |
| GDP growth | -3% to +5% | 2% (neutral) | x2.0 per pp | Hard-coded assumption |
| Tech cost index | 0.5-2.0 | 1.0 (neutral) | x15 for (1-techCost) | Hard-coded assumption; cheaper tech (index<1) boosts score, more expensive tech depresses it — directionally sensible |
| Policy stringency | 0-100 | 50 (neutral) | x0.1 per point | Hard-coded assumption |
| `NGFS` presets (6 rows) | carbonPrice/gdp/techCost/policy per scenario | — | — | Auto-fills the 4 sliders to NGFS-style scenario values; scenario characterisation is directionally plausible (e.g. Net Zero preset implies high carbon price, low tech cost) though not cross-consistent with the platform's other NGFS tables (e.g. `scenario-blending-optimizer`'s `NGFS` object uses different field names/values for the same 5-6 scenarios) |

### 7.3 Calculation walkthrough

1. `predictions` maps every entity through the same linear formula using the currently selected
   slider values — a genuine, transparent, and auditable computation (no PRNG involved in the
   scenario response itself; only the entity `base` term is seeded).
2. `pathwayData` (2025-2030) applies a **linearly growing** perturbation:
   `yearEffect = yearIndex x ((carbonPrice-100)x0.005 + (gdp-2)x0.3)` — a smaller-magnitude version
   of the same carbon/GDP sensitivity, compounding year-over-year to show a multi-year trajectory
   under the fixed scenario.
3. `comparisonData` runs the same formula once per NGFS preset scenario, letting a user see how a
   given entity's score would differ across all 6 canonical scenarios side by side.
4. The "2D Sensitivity Surface" (referenced in the guide) holds two of the four inputs fixed and
   sweeps the other two, re-evaluating `score` at each grid point to produce a heatmap — a
   correct way to visualise a linear model's response surface (which, given the model's purely
   additive structure with no interaction terms, will always render as a perfectly flat-gradient
   plane rather than a curved surface).

### 7.4 Worked example

Entity with `base=61` (seeded), under NGFS "Net Zero 2050"-style inputs `carbonPrice=250,
gdp=1.5%, techCost=0.7, policyStringency=85`:
```
carbonEffect = (250-100) x 0.03 = 4.5
gdpEffect    = (1.5-2) x 2 = -1.0
techEffect   = (1-0.7) x 15 = 4.5
policyEffect = (85-50) x 0.1 = 3.5
predicted    = clip(61 + 4.5 - 1.0 + 4.5 + 3.5, 10, 95) = clip(72.5, 10, 95) = 72.5
```
Under "Current Policies"-style inputs `carbonPrice=60, gdp=2.8%, techCost=1.3,
policyStringency=20`:
```
carbonEffect = (60-100) x 0.03 = -1.2
gdpEffect    = (2.8-2) x 2 = 1.6
techEffect   = (1-1.3) x 15 = -4.5
policyEffect = (20-50) x 0.1 = -3.0
predicted    = clip(61 - 1.2 + 1.6 - 4.5 - 3.0, 10, 95) = clip(53.9, 10, 95) = 53.9
```
A meaningful ~19-point score swing between an orderly and disorderly-policy scenario for the same
entity — directionally sensible, though the magnitude is entirely a function of the hand-set
coefficients rather than an estimated sensitivity.

### 7.5 Data provenance & limitations

- The scoring formula is a genuine, fully transparent linear model — not PRNG-fabricated for the
  scenario-response part — but it is **not an ensemble** as the guide's methodology label claims;
  there is one fixed set of coefficients, no model averaging or voting.
- Coefficients (0.03, 2.0, 15, 0.1) are hand-set assumptions with no stated calibration source
  (e.g. no regression against historical entity scores vs macro conditions).
- The purely additive, no-interaction-terms structure means the "2D sensitivity surface" will
  always be a flat plane in any 2-variable slice — real climate-risk sensitivities are typically
  non-linear (e.g. threshold effects, tipping points), which this model cannot represent.
- `NGFS` preset values are not cross-consistent with the same-named scenario objects used in other
  platform modules (`scenario-blending-optimizer`, `scenario-stress-test`), so scenario comparisons
  across modules will not reconcile.

**Framework alignment:** NGFS Phase 5 scenario framing (used only as slider presets, not as a
modelled scenario pathway) · the guide's "Ensemble model" standard citation does not match the
single-formula implementation.

## 9 · Future Evolution

### 9.1 Evolution A — Calibrated coefficients and non-linear response (analytics ladder: rung 2 → 3)

**What.** §7 corrects the label: this is a transparent fixed-coefficient linear model (carbon-price, GDP, tech-cost, policy sliders → entity score), not the "ensemble" the guide claims — one deterministic formula, coefficients (0.03, 2.0, 15, 0.1) hand-set with no calibration source, and a purely additive structure whose "2D sensitivity surface" is therefore always a flat plane, unable to represent the threshold effects real climate-risk sensitivities exhibit (§7.5). Entity baselines are seeded. Evolution A keeps the virtue (transparency) while earning the sophistication: calibrated coefficients, interaction/threshold terms, and honest entity anchoring.

**How.** (1) Anchor entity baselines to real company data (`GLOBAL_COMPANY_MASTER` sector/intensity fields) instead of seeded draws, so a utility and a software firm respond differently by construction. (2) Coefficients per sector derived from a documented source — NGFS scenario output sensitivities (how sector value-added responds to carbon price/GDP across scenarios) give defensible, citable response magnitudes; hand-set values remain as labelled fallbacks. (3) Add the minimum non-linearity that matters: sector-specific carbon-price thresholds (a hinge term where pass-through breaks down) and one carbon-price × policy-stringency interaction — making the sensitivity surface genuinely curved and the module's own visualization meaningful. (4) Rename the methodology honestly (multi-factor response model) or build an actual ensemble (linear + hinge variants averaged) if the label must stay; server-side port with a bench case.

**Prerequisites.** NGFS sensitivity extraction; sector mapping for the entity universe. **Acceptance:** the 2D surface shows curvature where thresholds bind; sector responses differ verifiably; every coefficient carries a source or a fallback label; the bench entity's score reproduces by hand.

### 9.2 Evolution B — What-if exploration copilot (LLM tier 2)

**What.** The module is already an interactive what-if tool; the copilot makes it conversational and portfolio-aware: "which of our holdings flips from resilient to stressed between €130 and €180 carbon?", "explain why the steel entity's score drops non-linearly past €150" (the hinge term, once built, gives a mechanical answer), "sweep policy stringency at three carbon prices and summarize the interaction".

**How.** Tier-2 tool calls over the scoring endpoint with parameter sweeps enumerated (flip-point questions solved by bisection over actual calls); explanations decompose into the model's named terms (base, carbon effect, threshold penalty, interaction) with coefficients and their sources quoted. The copilot's epistemic framing is fixed in the prompt: outputs are conditional response-model scores under stated assumptions, not predictions — the module's own name ("conditional prediction") invites the confusion the copilot must dispel. Cross-module routing: full portfolio loss distributions belong to `scenario-stress-test`; this copilot handles entity-level response shape and hands off.

**Prerequisites.** Evolution A (explaining hand-set coefficients as if calibrated would overstate the model; flat-plane sensitivity makes sweep questions degenerate); sweep tooling. **Acceptance:** flip points reproduce from enumerated calls; term decompositions sum to the score; the conditional-not-predictive framing appears in every summary.