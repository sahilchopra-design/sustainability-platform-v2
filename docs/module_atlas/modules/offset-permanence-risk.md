# Offset Permanence Risk Modeler
**Module ID:** `offset-permanence-risk` · **Route:** `/offset-permanence-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CN2 · **Sprint:** CN

## 1 · Overview
12 offset types with reversal probability modelling, buffer pool stress test, and climate-driven reversal risk.

**How an analyst works this module:**
- Permanence Dashboard shows reversal probability by offset type
- Buffer Pool Stress Test checks if buffer pool covers expected reversals
- Climate-Driven Reversal shows feedback loop: warming → more fire → more reversal

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BUFFER_POOL_DATA`, `CATEGORIES`, `CAT_COLORS`, `CAUSES`, `CLIMATE_SCENARIOS`, `COST_PER_TONNE`, `INSURANCE_PRODUCTS`, `MONITORING_COSTS`, `OFFSET_TYPES`, `OffsetPermanenceRiskPage`, `PERMANENCE_DECAY_CURVES`, `PORTFOLIO_POSITIONS`, `RCP_LIST`, `RCP_MULT`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `REVERSAL_EVENTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `OFFSET_TYPES` | 17 | `name`, `category`, `permanenceYrs`, `reversalDecade`, `bufferPoolPct`, `fireRisk`, `droughtRisk`, `floodRisk`, `policyRisk`, `insurable`, `insuranceCostPct`, `monitoringFreq`, `mrvComplexity`, `technologyMaturity`, `historicalReversalRate` |
| `REGULATORY_FRAMEWORKS` | 9 | `name`, `jurisdiction`, `permanenceReq`, `bufferReq`, `accepted`, `yearAdopted` |
| `INSURANCE_PRODUCTS` | 9 | `provider`, `coverageType`, `premiumRate`, `deductible`, `maxPayout`, `eligibleTypes`, `exclusions` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `COST_PER_TONNE` | `OFFSET_TYPES.map((o,i) => ({` |
| `PORTFOLIO_POSITIONS` | `OFFSET_TYPES.map((o,i) => ({` |
| `BUFFER_POOL_DATA` | `OFFSET_TYPES.map((o,i) => ({` |
| `PERMANENCE_DECAY_CURVES` | `OFFSET_TYPES.map((o,idx) => ({` |
| `halfLife` | `o.permanenceYrs * 0.7;` |
| `remaining` | `halfLife > 0 ? Math.exp(-0.693*yr/halfLife)*100 : 100;` |
| `MONITORING_COSTS` | `OFFSET_TYPES.map((o,i) => ({` |
| `TABS` | `['Permanence Dashboard','Reversal Probability Engine','Buffer Pool Stress Test','Climate-Driven Reversal',` |
| `filtered` | `useMemo(() => catFilter === 'All' ? OFFSET_TYPES : OFFSET_TYPES.filter(o => o.category === catFilter), [catFilter]);  /* Tab 0 KPIs */ const dashKpis = useMemo(() => { const n = filtered.length;` |
| `wtdPerm` | `n > 0 ? filtered.reduce((a,o) => a + o.permanenceYrs, 0) / n : 0;` |
| `avgRev` | `n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade, 0) / n : 0;` |
| `bufAdq` | `BUFFER_POOL_DATA.length > 0 ? BUFFER_POOL_DATA.reduce((a,b) => a + b.adequacyScore, 0) / BUFFER_POOL_DATA.length : 0;` |
| `insured` | `n > 0 ? (filtered.filter(o => o.insurable).length / n * 100) : 0;` |
| `monComp` | `MONITORING_COSTS.length > 0 ? MONITORING_COSTS.reduce((a,m) => a + m.complianceScore, 0) / MONITORING_COSTS.length : 0;` |
| `expLoss95` | `n > 0 ? filtered.reduce((a,o) => a + o.reversalDecade * 1.65 * 100, 0) / n : 0;` |
| `reversalByBand` | `useMemo(() => filtered.map(o => {` |
| `avg` | `filtered.length > 0 ? filtered.reduce((a,o) => a + (1 - Math.pow(1-o.reversalDecade, yr/10))*100, 0) / filtered.length : 0;` |
| `bufferStress` | `useMemo(() => BUFFER_POOL_DATA.map(b => {` |
| `released` | `b.actualPct * (bufferRelease / 100);` |
| `effective` | `b.actualPct - released;` |
| `stressedDraw` | `b.drawdowns.length > 0 ? (b.drawdowns.reduce((a,d) => a+d,0) / b.drawdowns.length) * stressMult : 0;` |
| `compoundRisk` | `useMemo(() => filtered.map(o => ({` |
| `tradeoffScatter` | `useMemo(() => filtered.map(o => ({` |
| `rand` | `sr(p * 1000 + oi * 100 + y);` |
| `sorted` | `[...losses].sort((a,b) => a - b);` |
| `var95` | `n > 0 ? sorted[Math.floor(n * 0.95)] : 0;` |
| `var99` | `n > 0 ? sorted[Math.floor(n * 0.99)] : 0;` |
| `cvar95` | `n > 0 ? sorted.slice(Math.floor(n*0.95)).reduce((a,v)=>a+v,0) / Math.max(1, sorted.slice(Math.floor(n*0.95)).length) : 0;` |
| `cvar99` | `n > 0 ? sorted.slice(Math.floor(n*0.99)).reduce((a,v)=>a+v,0) / Math.max(1, sorted.slice(Math.floor(n*0.99)).length) : 0;` |
| `obj` | `{ year:yr+1 };` |
| `catDist` | `useMemo(() => CATEGORIES.map(c => {` |
| `riskReturnScatter` | `useMemo(() => filtered.map(o => ({` |
| `optimalAlloc` | `useMemo(() => { const scored = filtered.map(o => { const permScore = Math.min(o.permanenceYrs, 1000) / 1000;` |
| `riskPenalty` | `o.reversalDecade * 10;` |
| `bufBonus` | `o.bufferPoolPct > minBuffer ? 0.1 : -0.1;` |
| `totalScore` | `scored.reduce((a,s) => a + Math.max(0, s.score), 0);` |
| `discount` | `r50 > 0 ? +(r50/100).toFixed(3) : 0;` |
| `rem` | `c.curve[y] ? c.curve[y].remaining / 100 : 0;` |
| `avgPerm` | `n > 0 ? items.reduce((a,o)=>a+Math.min(o.permanenceYrs,500),0)/n : 0;` |
| `avgRisk` | `n > 0 ? items.reduce((a,o)=>a+o.reversalDecade*100,0)/n : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CATEGORIES`, `CAUSES`, `INSURANCE_PRODUCTS`, `OFFSET_TYPES`, `RCP_LIST`, `REGIONS`, `REGULATORY_FRAMEWORKS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Forest Reversal | — | Historical | Wildfire-driven reversal risk |
| DAC Permanence | — | Geological | Lowest reversal risk of any offset type |

## 5 · Intermediate Transformation Logic
**Methodology:** Reversal probability model
**Headline formula:** `P(reversal, decade) = BaseRate × (1 + ClimateAmplifier(SSP))`

Reversal probabilities per decade: forest fire 5-15%, drought 3-8%, peatland re-oxidation 2-5%, DAC leak <0.1%. Climate amplifier increases reversal risk under warming scenarios (more wildfire = more forest offset reversal).

**Standards:** ['ICVCM', 'Buffer pool analysis']
**Reference documents:** ICVCM CCP; Verra Non-Permanence Risk Tool

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

For 16 seeded offset types (`OFFSET_TYPES`, spanning Nature/Blue Carbon/Soil/Engineered/Industrial
categories), the module models three linked risk mechanics:

```
remaining(t)     = exp(-0.693 × t / halfLife) × 100          // permanence decay curve
halfLife         = permanenceYrs × 0.7
P(reversal, t)   = 1 − (1 − reversalDecade)^(t/10)            // cumulative reversal by year t
reversalMult(RCP)= RCP_MULT[scenario] × (1 + fireRisk + droughtRisk)   // climate-conditioned uplift
```

`reversalDecade` and `permanenceYrs` are seed-table constants per offset type (e.g. ARR Tropical:
12%/decade reversal, 35yr permanence; DAC Geological: 0.1%/decade, 10,000yr). The 0.693 constant is
`ln(2)`, so `remaining(t)` is a textbook radioactive-decay-style half-life curve applied to credit
permanence — i.e. a heuristic analogy, not a fitted survival model.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Half-life fraction | `permanenceYrs × 0.7` | Synthetic demo value — no cited survival-analysis basis |
| RCP reversal multiplier | RCP2.6=1.00, RCP4.5=1.25, RCP6.0=1.55, RCP8.5=2.10 | Synthetic demo value; ordinally consistent with NGFS-style scenario severity but not sourced from a published wildfire/drought-frequency model |
| `reversalDecade` per offset type | 0.02%–20% | Seed table; directionally consistent with published ranges (forest 5–15%/decade per guide, DAC <0.1%) |
| VaR/CVaR confidence | 95% / 99% | Standard risk-management convention |
| `expLoss95` heuristic | `reversalDecade × 1.65 × 100` | 1.65 ≈ z-score for the 95th percentile of a standard normal — applied directly to a decade reversal *rate*, not to a fitted loss distribution; a simplification flagged as heuristic, not a proper VaR |

### 7.3 Calculation walkthrough

1. **Permanence decay** (`PERMANENCE_DECAY_CURVES`): for each offset type and year 0–~2×half-life,
   `remaining(t)` traces the exponential decay of surviving credits — used for the "Permanence
   Dashboard" chart and to compute the effective discount factor `discount = r50/100` (fraction of
   credits remaining at year 50).
2. **Reversal probability** (`reversalByBand`): cumulative probability of reversal by year `yr`,
   `1 − (1−reversalDecade)^(yr/10)`, averaged across the filtered offset set for the trend chart.
3. **Climate-driven reversal** (`compoundRisk`): fire/drought/flood component risks are each scaled
   by the selected RCP's `RCP_MULT`, and policy risk is left unscaled (climate scenarios don't move
   policy risk) — this is the module's genuine SSP/RCP-conditioning mechanism, matching the guide's
   "ClimateAmplifier(SSP)" concept using RCP as the scenario axis.
4. **Buffer pool stress test** (`bufferStress`): `effective = actualPct − actualPct×(bufferRelease/100)`
   models a regulator-mandated buffer-pool release scenario; `stressedDraw` averages five seeded
   annual drawdown observations × a stress multiplier.
5. **Monte Carlo tail risk** (`rand = sr(p*1000 + oi*100 + y)`): per portfolio position `p`, offset
   `oi`, and simulated year `y`, a pseudo-random loss draw feeds a sorted loss vector from which
   `var95`, `var99` (percentile losses) and `cvar95`, `cvar99` (tail-conditional means) are computed
   — a real Monte-Carlo VaR/CVaR mechanic, just fed by synthetic draws rather than a fitted loss
   distribution.
6. **Optimal allocation**: a simple mean-variance-style scorer —
   `score = permScore − riskPenalty + bufBonus`, where `permScore = min(permanenceYrs,1000)/1000`,
   `riskPenalty = reversalDecade×10`, `bufBonus = ±0.1` depending on buffer adequacy — normalised by
   `totalScore` to produce portfolio weights.

### 7.4 Worked example

**ARR Tropical** (`permanenceYrs=35`, `reversalDecade=0.12`, `fireRisk=0.15`, `droughtRisk=0.08`),
evaluated at year 20 under **RCP 8.5**:

| Step | Computation | Result |
|---|---|---|
| Half-life | 35 × 0.7 | 24.5 yr |
| Remaining at t=20 | exp(−0.693×20/24.5)×100 | **43.9%** |
| Cumulative reversal P(t=20) | 1 − (1−0.12)^(20/10) | **22.6%** |
| RCP 8.5 multiplier | fixed | 2.10 |
| Climate-adjusted fire risk | 0.15 × 2.10 × 100 | **31.5%** |
| Climate-adjusted drought risk | 0.08 × 2.10 × 100 | **16.8%** |
| Expected loss (95%, heuristic) | 0.12 × 1.65 × 100 | **19.8%** |

Under RCP 2.6 (multiplier 1.0) the same offset's climate-adjusted fire risk would be 15.0% instead
of 31.5% — the 2.1× compounding is the module's explicit representation of the wildfire/drought
feedback loop described in the guide ("warming → more fire → more reversal").

### 7.5 Buffer pool & VaR rubric

| Metric | Rule |
|---|---|
| Buffer adequacy score | `BUFFER_POOL_DATA.adequacyScore` averaged across pool (seed-table field, not derived from `actualPct` vs `requiredPct` in the extracted formulas) |
| VaR95/99 | Percentile of sorted simulated portfolio loss vector |
| CVaR95/99 | Mean of losses at/beyond the VaR percentile, floored at `Math.max(1, …)` tail-length to avoid divide-by-zero on thin tails |

### 7.6 Data provenance & limitations

- **Offset type table (17 rows) and regulatory framework table (9 rows) are hand-curated seed
  data**, not sourced from a live registry feed (Verra/Gold Standard/ACR APIs); reversal rates are
  directionally consistent with published ranges cited in the guide but not independently sourced
  per-row.
- **Monte Carlo loss draws use the platform PRNG** `sr(seed)=frac(sin(seed+1)×10⁴)`, not a fitted
  loss severity distribution — VaR/CVaR outputs are illustrative, not calibrated to real reversal
  event data.
- The half-life decay model is an analogy borrowed from radioactive decay, not a hazard/survival
  model fitted to actual project failure data (which the Verra Non-Permanence Risk Tool and ICVCM
  do maintain empirically).
- `insurable` flag and `INSURANCE_PRODUCTS` premium rates are seed-table constants, not derived
  from the reversal probabilities they nominally price.

**Framework alignment:** ICVCM Core Carbon Principles (CCP 5/6 — permanence and MRV) motivate the
module's structure but are not scored explicitly; the Verra Non-Permanence Risk Tool's buffer-pool
concept is implemented (buffer adequacy, stress-tested drawdown) but with synthetic contribution
data rather than registry-sourced buffer account balances.

## 9 · Future Evolution

### 9.1 Evolution A — Fitted survival model and empirical climate amplifiers (analytics ladder: rung 2 → 4)

**What.** §7 shows a module that is honest about its heuristics: it models permanence decay (`remaining(t) = exp(−0.693·t/halfLife)` — a radioactive-decay analogy, ln(2) constant explicit), cumulative reversal (`P = 1 − (1−reversalDecade)^(t/10)`), and RCP-conditioned uplift, with `reversalDecade`/`permanenceYrs` as seed-table constants directionally consistent with published ranges (forest 5–15%/decade, DAC <0.1%). But §7.2 flags the weak spots: the half-life fraction (×0.7) has no survival-analysis basis, the RCP multipliers (1.0/1.25/1.55/2.10) are unsourced, and `expLoss95 = reversalDecade × 1.65 × 100` applies a z-score to a rate rather than a fitted distribution — "a simplification flagged as heuristic, not a proper VaR." Evolution A replaces heuristics with fitted models.

**How.** (1) Replace the half-life analogy with an actual survival/hazard model fit to reversal-event history — the platform's wildfire and drought hazard grids (digital twin: 5,378 wildfire rows from GWIS) plus registry buffer-pool reversal records give real reversal observations to fit a Kaplan-Meier / parametric survival curve per offset type. (2) Derive the climate amplifiers from real wildfire/drought frequency projections under each SSP rather than the four hand-set multipliers — this is the rung-4 predictive step. (3) Compute a proper permanence VaR/CVaR from the fitted reversal distribution instead of the z-score-on-a-rate shortcut, aligned to the ICVCM and Verra Non-Permanence Risk Tool named in §5.

**Prerequisites.** Reversal-event data for the fit (registry buffer-pool records are partially public; wildfire grids exist); documenting the survival model per Atlas §8. **Acceptance:** reversal probabilities derive from a fitted curve with confidence bands, not the ×0.7 analogy; climate amplifiers trace to SSP wildfire/drought projections; VaR is computed from the distribution, not `rate × 1.65`.

### 9.2 Evolution B — Buffer-pool stress-test copilot (LLM tier 2)

**What.** A copilot for the buffer-pool and reversal-risk workflows §1 describes: "does the buffer pool cover expected reversals for this ARR portfolio under RCP8.5?", "which offset types have the worst permanence VaR?", "how does the reversal curve change from RCP4.5 to RCP8.5?" — executed against the permanence engine, decomposing results into decay-curve, cumulative-reversal, and climate-amplifier terms.

**How.** Tool calls to a `POST /offset-permanence/stress` endpoint wrapping the (Evolution-A fitted) engine; system prompt from this Atlas page's §5/§7 formulas and the ICVCM/Verra references named in §5. Scenario what-ifs (RCP switches) are recomputations; the fabrication validator matches every reversal probability and VaR to a tool response. Critically, the copilot must distinguish the current heuristic outputs from fitted ones in its provenance until Evolution A lands — narrating `expLoss95` as a "95% VaR" when §7 explicitly flags it as not a proper VaR would misrepresent the model's rigor.

**Prerequisites.** The stress endpoint; Evolution A strongly preferred before quoting VaR figures with a confidence claim. **Acceptance:** every reversal/VaR figure traces to a tool call; RCP what-ifs recompute the amplifier; the copilot labels heuristic vs fitted outputs honestly and refuses to overstate the VaR's statistical basis pre-Evolution-A.