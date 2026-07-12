# Climate Benchmark Constructor
**Module ID:** `climate-benchmark-constructor` · **Route:** `/climate-benchmark-constructor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Custom climate index and benchmark construction engine aligned with EU Climate Benchmarks Regulation (EU 2019/2089). Builds Paris-Aligned Benchmarks (PAB) and Climate Transition Benchmarks (CTB) with WACI reduction, fossil fuel exclusions, and green revenue tilts.

> **Business value:** PAB requires ≥50% WACI reduction vs parent at inception, then 7%/yr minimum. CTB requires ≥30% then 7%/yr. Fossil fuel revenue thresholds: >1% coal or >10% oil/gas triggers PAB exclusion.

**How an analyst works this module:**
- Select benchmark type: PAB or CTB
- Universe tab applies fossil fuel exclusions and controversy screens
- Tilt Optimiser sets CI reduction weights to meet WACI constraint
- Green Revenue tab applies EU Taxonomy tilt factors
- Backtest tab shows historical WACI reduction vs parent index

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CB_SECTORS`, `EU_BMR_RULES`, `KpiCard`, `PARENT_INDICES`, `TABS`, `UNIVERSE`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `CB_SECTORS[Math.floor(sr(i * 7 + 1) * CB_SECTORS.length)];` |
| `parent` | `PARENT_INDICES[Math.floor(sr(i * 11 + 2) * PARENT_INDICES.length)];` |
| `tot` | `subs.reduce((s, x) => s + x.weight_parent, 0);` |
| `parentConstituents` | `useMemo(() => byIndex[parentIndex] \|\| [], [parentIndex]); const parentAvgCI = useMemo(() => parentConstituents.length ? parentConstituents.reduce((s, x) => s + x.weight_norm * x.carbonIntensity, 0) : 0, [parentConstituents]);` |
| `targetCI` | `parentAvgCI * (1 - carbonReduction / 100);` |
| `benchmarkAvgCI` | `useMemo(() => benchmarkConstituents.length ? benchmarkConstituents.reduce((s, x) => s + x.benchWeight * x.carbonIntensity, 0) : 0, [benchmarkConstituents]);` |
| `actualReduction` | `useMemo(() => parentAvgCI > 0 ? (1 - benchmarkAvgCI / parentAvgCI) * 100 : 0, [parentAvgCI, benchmarkAvgCI]);` |
| `trackingError` | `useMemo(() => { const bmkVol = Math.sqrt(benchmarkConstituents.reduce((s, x) => s + Math.pow(x.benchWeight * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));` |
| `parVol` | `Math.sqrt(parentConstituents.reduce((s, x) => s + Math.pow(x.weight_norm * (0.08 + sr(x.id * 7 + 1) * 0.2), 2), 0));` |
| `bmrCompliance` | `useMemo(() => { return EU_BMR_RULES.map((rule, i) => { let pass = true;` |
| `greeniumData` | `useMemo(() => { return CB_SECTORS.map((sec, i) => { const greenYield = sr(i * 11 + 3) * 0.04 + 0.02;` |
| `brownYield` | `greenYield + (sr(i * 17 + 5) * 0.003 - 0.0015);` |
| `step3` | `step2 - (excludeControversy ? parentConstituents.filter(s => s.esgScore >= esgMin && s.controversyFlag).length : 0);` |
| `pCI` | `pW > 0 ? pSubs.reduce((s, x) => s + (x.weight_norm / pW) * x.carbonIntensity, 0) : 0;` |
| `bCI` | `bW > 0 ? bSubs.reduce((s, x) => s + (x.benchWeight / bW) * x.carbonIntensity, 0) : 0;` |
| `taxPct` | `sh.filter(s => s.taxonomyAligned).length / sh.length * 100;` |
| `parisPct` | `sh.filter(s => s.parisAligned).length / sh.length * 100;` |
| `cleanPct` | `sh.filter(s => !s.controversyFlag).length / sh.length * 100;` |
| `avgESG2` | `sh.reduce((s, x) => s + x.esgScore, 0) / sh.length;` |
| `avgCI2` | `sh.reduce((s, x) => s + x.carbonIntensity, 0) / sh.length;` |
| `avgITR2` | `sh.reduce((s, x) => s + x.temperature, 0) / sh.length;` |
| `pabCI` | `+(benchmarkAvgCI * Math.pow(0.93, yOffset)).toFixed(0);` |
| `ctbCI` | `+(parentAvgCI * 0.7 * Math.pow(0.95, yOffset)).toFixed(0);` |
| `parCI` | `+(parentAvgCI * Math.pow(0.99, yOffset)).toFixed(0);` |
| `pabRed` | `+((1 - pabCI / parCI) * 100).toFixed(1);` |
| `ctbRed` | `+((1 - ctbCI / parCI) * 100).toFixed(1);` |
| `year` | `2024 + y;` |
| `pabTarget` | `+(basePAB * decayPAB).toFixed(1);` |
| `ctbTarget` | `+(baseCTB * decayCTB).toFixed(1);` |
| `portCI` | `+(pabTarget * (0.85 + sr(y * 7 + 3) * 0.4)).toFixed(1);` |
| `dPAB` | `+(portCI - pabTarget).toFixed(1);` |
| `dCTB` | `+(portCI - ctbTarget).toFixed(1);` |
| `corr` | `!pabOK ? `Reduce by ${Math.abs(dPAB).toFixed(0)} tCO₂e/$M` : !ctbOK ? 'Minor tilt' : 'None';` |
| `avgGreenium` | `+(sr(pi * 13 + 5) * 0.2 - 0.1).toFixed(4);` |
| `pctCov` | `benchmarkConstituents.length > 0 ? (inBench / benchmarkConstituents.length * 100).toFixed(0) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CB_SECTORS`, `EU_BMR_RULES`, `PARENT_INDICES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| PAB WACI Reduction | `Σ(w_i×CI_i) / Σ(w_parent×CI_parent)` | EU 2019/2089 | Minimum weighted average carbon intensity reduction vs parent benchmark |
| Annual Decarbonisation Rate | `Year-on-year WACI reduction` | EU PAB standard | Required annual reduction in benchmark carbon intensity |
| Fossil Fuel Exclusion Threshold | `Revenue screen` | EU PAB Technical Standards | Revenue thresholds triggering exclusion from PAB universe |
| Green Revenue Tilt | `Company taxonomy screening` | EU Taxonomy Regulation | Upweight factor based on EU Taxonomy-aligned revenue fraction |
- **Parent index constituents** → Holdings → CI data → WACI → **Parent benchmark WACI**
- **EU Taxonomy database** → Company-level aligned revenue → tilt factors → **Green revenue upweights**

## 5 · Intermediate Transformation Logic
**Methodology:** EU PAB/CTB construction with WACI constraint
**Headline formula:** `w_i = w_parent_i × TiltFactor_i; WACI_bench = Σ(w_i × CI_i) ≤ 0.50 × WACI_parent (PAB)`

PAB minimum decarbonisation: WACI at least 50% below parent index at inception; minimum 7%/yr ongoing reduction. CTB: at least 30% below parent + 7%/yr. Tilt factors increase weight for low-CI companies and decrease for high-CI. Exclusions: companies with >1% revenue from coal, >10% from oil/gas extraction (PAB). Green revenue tilt applies EU Taxonomy-aligned revenue fraction as upweight signal.

**Standards:** ['EU Climate Benchmarks Regulation 2019/2089', 'EBA PAB/CTB Technical Standards', 'MSCI Climate Benchmark Methodology', 'GHG Protocol Scope 1+2+3']
**Reference documents:** EU Climate Benchmarks Regulation 2019/2089; European Banking Authority PAB/CTB RTS; MSCI ESG Climate Indices Methodology; EU Taxonomy Regulation (EU) 2020/852

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The Climate Benchmark Constructor is one of the more **genuinely functional** modules in this family:
it implements a real EU Paris-Aligned Benchmark (PAB) / Climate Transition Benchmark (CTB)
construction pipeline — exclusion screens, a carbon-tilt reweighting, an achieved-reduction
computation, sector-tilt decomposition, a tracking-error proxy, and PAB/CTB decarbonisation
pathways. The methodology matches the MODULE_GUIDES entry closely; the only caveat is that the
**300-constituent universe is `sr()`-seeded synthetic data**, so the numbers are illustrative even
though the maths is correct.

### 7.1 What the module computes

Parent index carbon intensity, then a screened + tilted benchmark:

```
parentAvgCI    = Σ_i weight_norm_i · CI_i                              (parent WACI)
targetCI       = parentAvgCI · (1 − carbonReduction/100)
benchWeight_i  = weight_norm_i · exp( −max(0, CI_i − targetCI) / (targetCI + 1) )   (carbon tilt)
                 then renormalised so Σ benchWeight = 1
benchmarkAvgCI = Σ_i benchWeight_i · CI_i
actualReduction= (1 − benchmarkAvgCI / parentAvgCI) × 100
```

The **exponential tilt** is the core mechanic: constituents above `targetCI` are down-weighted by
`exp(−excess/(targetCI+1))`, so the more a company's CI exceeds the target, the more its weight is
cut — a smooth, differentiable decarbonisation tilt rather than a hard cutoff.

### 7.2 Parameterisation / provenance

| Constant | Value | Provenance |
|---|---|---|
| PAB min reduction | 50 % (default `carbonReduction`) | EU CBR 2019/2089 PAB — ≥50 % vs parent |
| CTB min reduction | 30 % | EU CBR CTB standard |
| PAB pathway decay | `0.93^t` (7 %/yr) | EU BMR mandatory 7 %/yr self-decarbonisation |
| CTB pathway | `parentAvgCI·0.7·0.95^t` | 30 % initial + 5 %/yr (code choice; BMR mandates 7 %) |
| Exclusion multiplier | `CI_i ≤ sectorAvgCI × 20` (default) | Configurable high-carbon screen |
| ESG minimum | `esgScore ≥ 30` | Configurable |
| `EU_BMR_RULES` (12) | UNGC, weapons, coal>1 %, oil-sands>10 %, 50/30 % reduction, 7 %/yr… | EU BMR / PAB-CTB minimum standards |
| `UNIVERSE` (300) | CI, market cap, ESG, taxonomy, controversy | **`sr()`-seeded synthetic** |

Note the CTB pathway `0.95^t` encodes 5 %/yr, below the BMR-mandated 7 %/yr — a minor
methodological understatement (the PAB pathway `0.93^t` is correct).

### 7.3 Calculation walkthrough

1. **Parent weights** normalised per index: `weight_norm_i = weight_parent_i / Σ weight_parent`.
2. **Screening** (4 steps): ESG ≥ min → drop controversy flags → drop `CI > sectorAvgCI × multiplier`
   → set carbon-reduction target.
3. **Tilt**: apply `exp(−excess/(targetCI+1))`, renormalise.
4. **Achieved reduction** vs parent; **sector tilts** = benchWeight − parentWeight per sector.
5. **BMR compliance**: evaluate the 12 `EU_BMR_RULES` (e.g. actualReduction ≥ 50 % for PAB) → pass
   count / 12.
6. **PAB/CTB pathways**: `pab = benchmarkAvgCI·0.93^t`, `ctb = parentAvgCI·0.7·0.95^t`,
   `parent = parentAvgCI·0.99^t` over the horizon.

### 7.4 Worked example — a single constituent's tilt

Suppose `parentAvgCI = 300 tCO₂e/$M`, `carbonReduction = 50 %` → `targetCI = 150`. Take constituent
with `CI = 450`, `weight_norm = 0.010`:

| Step | Computation | Result |
|---|---|---|
| Excess over target | 450 − 150 | 300 |
| Tilt factor | `exp(−300 / (150+1))` | `exp(−1.987)` ≈ 0.137 |
| Pre-norm weight | 0.010 × 0.137 | 0.00137 |
| A low-CI peer (CI 100 ≤ target) | `exp(−0)` = 1 → keeps full 0.010 | untilted |

The high-carbon name loses ~86 % of its weight; low-carbon names are untouched, pushing
`benchmarkAvgCI` down toward `targetCI`. After renormalisation the surviving weights sum to 1, and
`actualReduction` reports the realised WACI cut (typically ≥ 50 % once the tilt is strong enough).

### 7.5 Companion analytics

- **Tracking error** — `|bmkVol − parVol| × 100` where each vol is `√Σ(weight × σ_i)²` and
  `σ_i = 0.08 + sr(id·7+1)×0.2` is a **seeded per-name volatility** (not a real covariance/TE).
- **Greenium Analysis** — per-sector green vs brown yield differential (`sr()`-seeded).
- **EU BMR Compliance** — 12-rule pass/fail scorecard with a compliance %.
- **Summary & Export** — parent vs benchmark WACI, reduction, TE, BMR score.

### 7.6 Data provenance & limitations

- **The 300-constituent universe is synthetic**, generated by `sr(seed) = frac(sin(seed+1)×10⁴)`.
  The construction *methodology* (tilt, screens, reduction, pathways) is real and correctly applied.
- **Tracking error is a crude proxy** — the difference of two weighted-vol norms with seeded
  per-name volatilities, not a benchmark-relative tracking error from a covariance matrix.
- The **CTB decarbonisation pathway uses 5 %/yr (`0.95^t`) instead of the BMR-mandated 7 %/yr**; the
  PAB pathway `0.93^t` is correct.
- Fossil-fuel revenue exclusions (coal >1 %, oil-sands >10 %) are listed as BMR rules but the
  universe has no per-name fossil-revenue field, so those specific screens are evaluated
  heuristically rather than on revenue data.

**Framework alignment:** EU Climate Benchmarks Regulation 2019/2089 — the module directly implements
the PAB (≥50 % WACI reduction + 7 %/yr) and CTB (≥30 % + 7 %/yr) minimum standards, fossil-fuel
exclusion thresholds, and the self-decarbonisation trajectory. It mirrors MSCI/STOXX climate index
methodology (carbon-tilt reweighting toward a target intensity) and references the EU Taxonomy
(`taxonomyAligned`, `euTaxonomyPct`) for the green-revenue tilt. Because the maths is real, no §8
model specification is required — the production gap is data (real constituent CI/fossil-revenue
feeds and a genuine covariance matrix for tracking error), not methodology.

## 9 · Future Evolution

### 9.1 Evolution A — Real constituents under the existing (correct) tilt engine (analytics ladder: rung 2 → 3)

**What.** §7 rates this among the genuinely functional modules: a real PAB/CTB
pipeline — exclusion screens, the exponential carbon tilt
(`w_i·exp(−max(0, CI_i−target)/(target+1))` with renormalisation), achieved-reduction
computation, sector decomposition, tracking-error proxy, and the 7%/yr decarbonisation
pathways — whose only weakness is that the 300-constituent universe is `sr()`-seeded.
The math is right; the inputs are fiction. Evolution A swaps the universe for real
constituents: index membership and weights from public sources (e.g. iShares ETF
holdings files are freely downloadable proxies for major indices), carbon intensities
from disclosed emissions joined via the platform's GLEIF/OpenFIGI entity-resolution
spine, and fossil-revenue exclusion fields from disclosed segment data where available.

**How.** (1) `ref_index_constituents(index, ticker, lei, weight, as_of)` +
`ref_issuer_carbon(lei, scope12_intensity, fossil_rev_pct, source, year)` tables; the
existing tilt engine consumes them unchanged — this is a data evolution, not a math
rewrite. (2) Coverage honesty: constituents lacking disclosed CI are excluded with the
coverage ratio displayed, never imputed silently (EU BMR requires documented
estimation policies — state ours). (3) Backtest tab upgraded from synthetic to
point-in-time reconstruction where historical weights exist; otherwise labelled
inception-forward only.

**Prerequisites.** Licensing distinguishes redistribution vs internal analytics —
holdings-file terms checked; entity-resolution hit rate on constituents measured
first (GLEIF spine now populated). **Acceptance:** constructing a PAB from a real
universe achieves and displays ≥50% WACI reduction with per-constituent provenance;
the tilt engine's outputs on the old synthetic fixture are regression-pinned.

### 9.2 Evolution B — Benchmark-design analyst (LLM tier 2)

**What.** A tool-calling assistant for index designers: "build a CTB from this parent
with the utilities sector capped at parent weight", "why did constituent X get
down-weighted 60%?" (the exponential tilt is fully explainable — distance above
target CI drives the exponent), "what's the tracking-error cost of moving from 30% to
50% reduction?" — each executed against the existing construction pipeline as
client-side tools (or backend if Evolution A moves construction server-side), with
EU BMR rule checks (`EU_BMR_RULES` seed encodes the 1%/10% fossil thresholds) cited
per decision.

**How.** Tool schemas over the constructor functions (parent selection, exclusion
screen, tilt with target reduction, backtest); the no-fabrication validator ties every
WACI, weight, and TE figure to invocations; regulation questions answer from the §5
corpus (Regulation 2019/2089, EBA RTS) with article-level citations.

**Prerequisites.** Evolution A strongly preferred so recommendations concern real
benchmarks; pre-A the assistant must label outputs as synthetic-universe
demonstrations. **Acceptance:** a design conversation ends with a reproducible
parameter set (re-running yields identical weights); the assistant refuses to assert
BMR compliance — it reports which coded rule checks passed.