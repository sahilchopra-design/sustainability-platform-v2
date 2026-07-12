# Carbon Credit Portfolio Analytics
**Module ID:** `cc-portfolio-analytics` · **Route:** `/cc-portfolio-analytics` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Portfolio-level analytics for carbon credit holdings across 21 methodology types. Provides vintage diversification, methodology concentration, credit rating distribution, cost basis analysis, and retirement planning tools integrated with the CarbonCreditContext data bus.

> **Business value:** Portfolio analytics aggregates 21 methodology engines. Weighted quality score and methodology HHI are primary credit risk metrics. Retirement optimiser maximises quality score of retained portfolio.

**How an analyst works this module:**
- Portfolio Overview tab shows volume, quality, cost basis summary
- Vintage Analysis tab charts holdings by issuance year
- Methodology Breakdown tab shows concentration and HHI
- Credit Rating Distribution shows quality band allocation
- Retirement Planner sequences retirement by strategy (FIFO/LIFO/quality)

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `Badge`, `FAMILIES`, `KpiCard`, `PIE_COLORS`, `POSITIONS`, `REGIONS`, `Row`, `Section`, `TABS`, `TabBar`, `VINTAGES`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `FAMILIES` | `['Nature-Based', 'Agriculture & Soil', 'Energy Transition', 'Waste & Circular', 'Industrial Process', 'Carbon Dioxide Removal', 'Community & Cookstoves'];` |
| `REGIONS` | `['Latin America', 'Sub-Saharan Africa', 'Southeast Asia', 'South Asia', 'North America', 'Europe'];` |
| `names` | `['Madre de Dios REDD+','Kasigau Corridor','Cerrado Reforestation','Mekong Blue Carbon','Gujarat Solar Farm',` |
| `credits` | `Math.round(sr(i * 17) * 180000 + 20000);` |
| `price` | `parseFloat((sr(i * 19) * 40 + 3).toFixed(2));` |
| `retired` | `Math.round(credits * (sr(i * 23) * 0.6 + 0.1));` |
| `portfolio` | `useMemo(() => { const totalValue = POSITIONS.reduce((s, p) => s + p.value, 0);` |
| `totalCredits` | `POSITIONS.reduce((s, p) => s + p.credits, 0);` |
| `totalRetired` | `POSITIONS.reduce((s, p) => s + p.retired, 0);` |
| `retirementRate` | `((totalRetired / totalCredits) * 100).toFixed(1);` |
| `avgAge` | `(POSITIONS.reduce((s, p) => s + (2026 - p.vintage), 0) / (POSITIONS.length \|\| 1)).toFixed(1);` |
| `familyDonut` | `useMemo(() => FAMILIES.map(f => ({` |
| `vintageBar` | `useMemo(() => VINTAGES.map(v => ({` |
| `riskMetrics` | `useMemo(() => { const avgReversal = parseFloat((POSITIONS.reduce((s, p) => s + p.reversalRisk, 0) / (POSITIONS.length \|\| 1) * 100).toFixed(1));` |
| `avgRegulatory` | `parseFloat((POSITIONS.reduce((s, p) => s + p.regulatoryRisk, 0) / (POSITIONS.length \|\| 1) * 100).toFixed(1));` |
| `priceVol` | `parseFloat((POSITIONS.reduce((s, p) => s + Math.abs(p.priceCurrent - p.priceAcquired) / Math.max(p.priceAcquired, 0.01), 0) / (POSITIONS.length \|\| 1) * 100).toFixed(1));` |
| `familyShares` | `FAMILIES.map(f => {` |
| `hhiFamily` | `Math.round(familyShares.reduce((s, sh) => s + sh * sh, 0) * 10000);` |
| `geoShares` | `REGIONS.map(r => {` |
| `hhiGeo` | `Math.round(geoShares.reduce((s, sh) => s + sh * sh, 0) * 10000);` |
| `vintShares` | `VINTAGES.map(v => {` |
| `hhiVintage` | `Math.round(vintShares.reduce((s, sh) => s + sh * sh, 0) * 10000);` |
| `attribution` | `useMemo(() => { const priceMov = parseFloat((POSITIONS.reduce((s, p) => s + (p.priceCurrent - p.priceAcquired) * p.credits, 0) / (portfolio.totalValue \|\| 1) * 100).toFixed(1));` |
| `vintageAging` | `parseFloat((sr(201) * 3 + 1).toFixed(1));` |
| `methQuality` | `parseFloat((sr(203) * 2.5 + 0.5).toFixed(1));` |
| `registryPremium` | `parseFloat((sr(207) * 1.5 + 0.3).toFixed(1));` |
| `coBenefitPremium` | `parseFloat((sr(209) * 2 + 0.2).toFixed(1));` |
| `totalReturn` | `parseFloat((priceMov + vintageAging + methQuality + registryPremium + coBenefitPremium).toFixed(1));` |
| `geoData` | `useMemo(() => { const byContinent = { Americas: ['Latin America', 'North America'], Africa: ['Sub-Saharan Africa'], Asia: ['Southeast Asia', 'South Asia'], Europe: ['Europe'] };` |
| `continentData` | `Object.entries(byContinent).map(([cont, regs]) => {` |
| `countryData` | `REGIONS.map(r => {` |
| `vintageAnalysis` | `useMemo(() => { const cohorts = VINTAGES.map((v, vi) => { const vp = POSITIONS.filter(p => p.vintage === v);` |
| `avgAcquired` | `vp.length ? parseFloat((vp.reduce((s, p) => s + p.priceAcquired, 0) / vp.length).toFixed(2)) : 0;` |
| `avgCurrent` | `vp.length ? parseFloat((vp.reduce((s, p) => s + p.priceCurrent, 0) / vp.length).toFixed(2)) : 0;` |
| `totalVol` | `vp.reduce((s, p) => s + p.credits, 0);` |
| `scatterData` | `POSITIONS.map((p, i) => ({` |
| `riskScore` | `p.reversalRisk * 100 + p.regulatoryRisk * 100 - p.integrityScore * 0.3;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAMILIES`, `PIE_COLORS`, `REGIONS`, `TABS`, `VINTAGES`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Portfolio Volume | `Σ all positions` | CarbonCreditContext | Total carbon credit holdings across all methodologies and vintages |
| Weighted Quality Score | `Σ(vol × Q) / Σvol` | Model output | Volume-weighted average ICVCM quality score across portfolio |
| Vintage Entropy | `Shannon entropy of vintage distribution` | Portfolio analytics | Diversification across vintage years; higher = more diversified |
| Methodology HHI | `Σ(share_i²)` | Portfolio analytics | Methodology concentration; below 0.15 = well-diversified |
- **CarbonCreditContext data bus** → All 21 engine positions → portfolio → **Aggregated holdings**
- **Market price feed** → Methodology × vintage price → MtM → **Portfolio market value**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio analytics: vintage-weighted quality and cost basis
**Headline formula:** `WtdQuality = Σ(vol_i × Q_i) / Σvol_i; CostBasis = Σ(vol_i × price_i) / Σvol_i`

Volume-weighted average quality score aggregates ICVCM dimension ratings across all positions. Vintage diversification measured by Shannon entropy across vintage years. Methodology HHI captures concentration risk. Retirement planning uses FIFO, LIFO, or quality-optimised retirement sequencing. Mark-to-market revaluation applies current market prices by methodology and vintage.

**Standards:** ['ICVCM CCP', 'Ecosystem Marketplace', 'Portfolio theory (Markowitz)']
**Reference documents:** ICVCM Core Carbon Principles Assessment 2023; Ecosystem Marketplace Portfolio Analytics; Markowitz Mean-Variance Portfolio Theory (1952)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises *volume-weighted ICVCM
> quality aggregation* (`WtdQuality = Σ(vol×Q)/Σvol`), *Shannon entropy of vintage distribution*,
> and *FIFO / LIFO / quality-optimised retirement sequencing*. **None of these three are in the
> code.** The page actually computes: value-weighted **Herfindahl–Hirschman concentration** across
> three axes (family, geography, vintage), a portfolio **risk radar** (reversal/regulatory/price-
> volatility), a **performance-attribution waterfall** (partly synthetic), and geographic/vintage
> cohort rollups. There is no ICVCM score field, no Shannon entropy, and no retirement optimiser.
> The sections below document the code as written; §8 specifies the volume-weighted quality model
> the guide advertises.

### 7.1 What the module computes

25 synthetic credit positions (`POSITIONS`, `genPositions()`) are aggregated into portfolio KPIs
and three concentration indices. Each position carries `credits`, `retired`, `priceAcquired`,
`priceCurrent`, `value = credits × priceAcquired`, plus per-position risk primitives
(`reversalRisk` 0.02–0.17, `regulatoryRisk` 0.05–0.25, `integrityScore` 60–90, `coBenefits` 1–6).

```
retirementRate = totalRetired / totalCredits × 100
avgAge         = Σ(2026 − vintage) / N
HHI_axis       = round( Σ_k (share_k)² × 10000 ),  share_k = value_k / totalValue
priceVol       = mean( |priceCurrent − priceAcquired| / max(priceAcquired,0.01) ) × 100
```

The HHI is computed independently for the 7 families, 6 regions and 8 vintages — a value-weighted
concentration metric on a 0–10 000 scale (10 000 = single-bucket portfolio).

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| Families | 7 (Nature-Based … Community & Cookstoves) | hard-coded taxonomy |
| Regions | 6 (LatAm, SSA, SE-Asia, S-Asia, N-America, Europe) | hard-coded |
| Vintages | 2018–2025 | hard-coded |
| `credits` | `sr(i·17)×180 000 + 20 000` | **synthetic seeded** |
| `price` | `sr(i·19)×40 + 3` ($/t) | **synthetic seeded** |
| `reversalRisk` | `sr(i·31)×0.15 + 0.02` | **synthetic seeded** |
| Attribution: `vintageAging`,`methQuality`,`registryPremium`,`coBenefitPremium` | `sr(201..209)×…` | **synthetic seeded** — not derived from positions |

Only `priceMov` in the attribution waterfall is computed from data
(`Σ(priceCurrent−priceAcquired)·credits / totalValue`); the other four return components are pure
seeded constants added to it.

### 7.3 Calculation walkthrough

Inputs (25 positions) → `portfolio` reducer produces totalValue/credits/retired/retirementRate/
avgAge. `riskMetrics` averages the risk primitives and computes the three HHIs, normalising each to
`HHI/100` for the radar. `attribution` builds the return waterfall. `geoData` groups positions into
4 continents and 6 regions with value/credit/avg-price/avg-integrity rollups. `vintageAnalysis`
builds per-vintage cohorts (avg acquired vs current price, appreciation %, volume) and a
scatter of age vs current price sized by volume. A live `ccPortfolio` from `CarbonCreditContext`
overrides the headline KPIs when the data bus is populated (`ccPortfolio.totalValue || portfolio…`).

### 7.4 Worked example (family HHI)

Suppose family value shares are {Nature 0.40, Agriculture 0.15, Energy 0.15, Waste 0.10,
Industrial 0.08, CDR 0.07, Community 0.05}.

| Step | Computation | Result |
|---|---|---|
| Σ share² | 0.16+0.0225+0.0225+0.01+0.0064+0.0049+0.0025 | 0.2288 |
| HHI | 0.2288 × 10 000 | **2 288** |
| Reading | > 2 500 = concentrated; 1 500–2 500 = moderate | moderate concentration |

The guide's "below 0.15 well-diversified" threshold corresponds to HHI < 1 500 on this scale; the
code never applies a threshold, it only displays the number.

### 7.5 Companion analytics

- **Risk radar** — 6 axes: reversal, regulatory, price-vol (each a portfolio mean), and the three
  HHI/100 concentration axes.
- **Attribution waterfall** — 6 bars ending in `totalReturn = priceMov + 4 seeded premia`.
- **Geographic** — continent map (Americas/Africa/Asia/Europe) + 6-region table.
- **Vintage & maturity** — cohort appreciation table + age-vs-price scatter.
- **CarbonCreditContext bus** — `adaptForPortfolio()` supplies aggregate value/credits/retired that,
  when non-zero, supersede the synthetic totals; this is the only live data path.

### 7.6 Data provenance & limitations

- **All 25 positions are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`. Values are
  stable across renders but are not real holdings.
- Four of five attribution return drivers are seeded constants, not measured — the "performance
  attribution" is illustrative only.
- No ICVCM quality score, no Shannon entropy, no retirement sequencing exist despite the guide.
- HHI uses **value** shares (not volume); the guide's `Σ(share²)` on a 0–1 scale is the same metric
  rescaled by 10 000.

**Framework alignment:** *Herfindahl–Hirschman Index* (concentration, US DOJ/FTC merger scale
0–10 000) — correctly implemented on three axes. *ICVCM Core Carbon Principles* — the 10 CCPs are
assessed by ICVCM at programme + methodology-category level (Approved/Rejected), yielding a binary
"CCP-eligible" label rather than a 0–100 score; the guide's weighted CCP quality score is **not**
implemented. *Markowitz portfolio theory* — referenced but no mean-variance optimisation is present.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible **volume-weighted portfolio quality score** and **diversification-adjusted
value-at-risk** for a book of voluntary carbon credits spanning multiple methodologies, vintages and
registries, supporting retirement-sequencing and buy/hold decisions.

### 8.2 Conceptual approach
Two industry benchmarks: (a) **Ecosystem Marketplace / BeZero-style credit ratings** aggregated by
volume, mirroring how rating agencies roll a AAA–D letter grade into a portfolio average; and
(b) **Markowitz mean-variance** treatment where each methodology family is an "asset class" with a
price-return distribution and a covariance matrix, so concentration (HHI) maps to un-diversified
idiosyncratic risk. Retirement sequencing is an integer-program that maximises retained-book quality.

### 8.3 Mathematical specification
```
Quality score per position  Q_i ∈ [0,100]   (from CCP eligibility + rating agency letter → numeric)
Portfolio quality           Q̄ = Σ_i (vol_i · Q_i) / Σ_i vol_i
Vintage Shannon entropy     H = −Σ_v p_v ln p_v ,  p_v = vol_v / Σvol ;  H_norm = H / ln(#vintages)
Value-at-risk (95%)         VaR = Φ⁻¹(0.95) · σ_p · MV,   σ_p² = wᵀ Σ w
   w = family value weights;  Σ = family price-return covariance (from vintage-price history)
Reversal-adjusted value     RAV = Σ_i value_i · (1 − reversalRisk_i)
Retirement optimiser        max Σ_i Q_i·x_i  s.t. Σ_i credit_i·x_i ≥ target,  x_i∈{0,1 or partial}
   FIFO/LIFO are constrained special cases ordering x_i by vintage.
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Credit quality | Q_i | ICVCM CCP eligibility + BeZero/Sylvera rating map |
| Family covariance | Σ | Ecosystem Marketplace / CBL spot-price series by category |
| Reversal risk | reversalRisk_i | Verra AFOLU Non-Permanence Risk Tool buffer % |
| VaR quantile | Φ⁻¹(0.95) | RiskMetrics parametric convention |

### 8.4 Data requirements
Per position: methodology code, vintage, registry, serial range, volume, acquisition & current price,
CCP flag, third-party rating, buffer contribution. Sources: registry APIs (Verra/Gold Standard),
CBL/Xpansiv spot marks, BeZero/Sylvera ratings (vendor), ICVCM approved-methodology list (free).
Platform already holds `verraRegistryData.js` (819 real projects) and `CarbonCreditContext`.

### 8.5 Validation & benchmarking plan
Backtest Q̄ against realised retirement discounts; reconcile VaR against 12-month price drawdowns by
family; sensitivity of retirement optimiser to Q_i perturbation ±10%. Benchmark portfolio quality
against a BeZero/Sylvera fund-level score.

### 8.6 Limitations & model risk
Quality→numeric mapping is judgemental; covariance is thin for illiquid CDR families; parametric VaR
understates tail risk for reversal events (use empirical/EVT fallback). Conservative default: apply
full buffer-pool deduction to headline value when ratings are stale.

## 9 · Future Evolution

### 9.1 Evolution A — Ship the advertised quality aggregation and retirement optimiser (analytics ladder: rung 1 → 2)

**What.** §7 documents a three-part guide↔code gap: the promised volume-weighted ICVCM
quality score (`WtdQuality = Σ(vol×Q)/Σvol`), Shannon vintage entropy, and
FIFO/LIFO/quality-optimised retirement sequencing are **all absent** — the code
computes HHI concentration on three axes, a risk radar, and a partly-synthetic
attribution waterfall over 25 synthetic positions. Evolution A implements the three
missing pieces on data the positions already carry: each position has an
`integrityScore` (60–90) usable as Q until the cc-engine-hub scoring engine lands,
`credits`/`retired` volumes for weighting, and vintage fields for entropy.

**How.** (1) `wtdQuality`, `shannonEntropy(vintageShares)`, and a retirement sequencer
as pure functions — FIFO/LIFO are sorts; quality-optimised retirement is "retire
lowest-Q first, maximise retained WtdQuality", a greedy solve that is provably optimal
for this objective. (2) The attribution waterfall's synthetic components replaced by
terms derived from `priceAcquired`/`priceCurrent` per position. (3) Wire quality inputs
to CarbonCreditContext so real methodology-engine outputs displace the synthetic
`integrityScore` when the cc-engine-hub Evolution A ships.

**Prerequisites.** Mismatch flag clears only when all three advertised metrics compute;
synthetic positions labelled demo. **Acceptance:** retiring the lowest-quality position
raises retained WtdQuality (property test); Shannon entropy hits its ln(n) maximum on
an equal-vintage fixture book.

### 9.2 Evolution B — Portfolio steward analyst (LLM tier 2)

**What.** An analyst-tier assistant over the holdings book: "which retirement sequence
keeps our weighted quality above 75 while covering the 30kt CORSIA obligation?",
"where is our concentration risk?" (the three real HHI axes), "explain this quarter's
attribution". Post-Evolution A it calls the sequencer and aggregation functions as
tools and narrates only returned numbers; the mark-to-market view stays explicitly
bounded by the synthetic price basis until real price feeds exist.

**How.** Tool schemas over the Evolution A functions (client-side, or backend if the
book moves server-side — the page already declares an `API` constant pointing at
:8001, currently unused); per the tier-2 pattern, the no-fabrication validator checks
every volume, HHI, and quality figure against tool outputs; provenance expander lists
positions touched.

**Prerequisites (hard).** Evolution A first — today the assistant could not answer a
quality question without fabricating, since no quality aggregate exists in code.
**Acceptance:** a sequencing recommendation is reproducible by re-running the sequencer
with the stated parameters; price-forecast questions are refused.