# Systemic Climate Risk
**Module ID:** `systemic-climate-risk` · **Route:** `/systemic-climate-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
System-wide climate risk contagion analytics modelling cascading transmission of physical and transition climate shocks across financial sectors, geographies and macroeconomic channels.

> **Business value:** The NGFS estimates disorderly transition could reduce global GDP by 4–5% through systemic financial channels; second-round amplification effects can triple direct sectoral losses.

**How an analyst works this module:**
- Define sectoral exposure to transition and physical climate shocks
- Construct inter-sectoral financial contagion matrix from balance sheet linkages
- Apply climate scenario shocks to seed sectors
- Propagate shocks through contagion matrix iteratively
- Assess systemic stability and identify critical contagion nodes

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AMPLIFIER_CHANNELS`, `CB_DOMAINS`, `CB_INDICATORS`, `CROSS_BORDER_MATRIX`, `FSOC_EW`, `KpiCard`, `MACRO_TOOLS`, `MC_SYSTEMIC_LOSSES`, `NETWORK`, `NGFS_SCENARIOS`, `REGIONS`, `SCENARIO_SECTOR_RISK`, `SCENARIO_SERIES`, `SECTORS`, `SECTOR_NAMES`, `SectionTitle`, `Swatch`, `TABS`, `TIME_POINTS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `NGFS_SCENARIOS` | 6 | `name`, `color`, `baseMult` |
| `CB_INDICATORS` | 27 | `domain`, `name`, `threshold` |
| `MACRO_TOOLS` | 7 | `name`, `currentLevel`, `min`, `max`, `unit`, `gdpImpactPerUnit`, `creditImpactPerUnit`, `riskReductionPerUnit`, `color` |
| `AMPLIFIER_CHANNELS` | 5 | `name`, `desc`, `color`, `baseScore` |
| `FSOC_EW` | 7 | `value`, `threshold`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `SECTORS` | `SECTOR_NAMES.map((name, i) => ({` |
| `NETWORK` | `SECTORS.map((_, i) =>` |
| `SCENARIO_SERIES` | `NGFS_SCENARIOS.map(sc =>` |
| `SCENARIO_SECTOR_RISK` | `NGFS_SCENARIOS.map((sc, si) =>` |
| `CB_DOMAINS` | `['All', ...Array.from(new Set(CB_INDICATORS.map(x => x.domain)))];` |
| `CROSS_BORDER_MATRIX` | `REGIONS.map((_, i) =>` |
| `base` | `5 + sr(i * 3 + 7) * 40;` |
| `fatTail` | `sr(i * 3 + 8) > 0.92 ? sr(i * 3 + 9) * 60 : 0;` |
| `gdpWeightedSRI` | `useMemo(() => { const totalW = SECTORS.reduce((s, x) => s + x.gdpWeight, 0);` |
| `topSector` | `useMemo(() => [...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex)[0] , []);` |
| `ampFactor` | `useMemo(() => { const scores = AMPLIFIER_CHANNELS.map((ch, ci) => ch.baseScore * ampIntensity[ci]);` |
| `avg` | `scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length);` |
| `scriTrend` | `useMemo(() => TIME_POINTS.map((yr, ti) => ({ year: yr, scri: +(gdpWeightedSRI * NGFS_SCENARIOS[scenarioIdx].baseMult * (1 + ti * 0.04) + sr(scenarioIdx * 7 + ti) * 5).toFixed(1), })) , [scenarioIdx, gdpWeightedSRI]);` |
| `amplifierWaterfall` | `useMemo(() => AMPLIFIER_CHANNELS.map((ch, ci) => ({ name: ch.name.split(' ')[0], score: +(ch.baseScore * ampIntensity[ci]).toFixed(1), color: ch.color, })) , [ampIntensity]);` |
| `domainRadarData` | `useMemo(() => { const domains = Array.from(new Set(CB_INDICATORS.map(x => x.domain)));` |
| `toolEffectiveness` | `useMemo(() => MACRO_TOOLS.map((t, i) => { const delta = toolLevels[i] - t.currentLevel;` |
| `gdpImpact` | `+(t.gdpImpactPerUnit * delta).toFixed(3);` |
| `creditImpact` | `+(t.creditImpactPerUnit * delta).toFixed(3);` |
| `riskReduction` | `+(t.riskReductionPerUnit * Math.abs(delta)).toFixed(2);` |
| `totalRiskReduction` | `useMemo(() => +(toolEffectiveness.reduce((s, t) => s + t.riskReduction, 0)).toFixed(2) , [toolEffectiveness]);` |
| `tippingData` | `useMemo(() => [...SECTORS].sort((a, b) => b.tippingProximity - a.tippingProximity) , []);` |
| `mcBins` | `useMemo(() => { const bins = Array.from({ length: 20 }, (_, i) => ({ bin: `${i * 5}-${(i + 1) * 5}`, count: 0 }));` |
| `mcStats` | `useMemo(() => { const sorted = [...MC_SYSTEMIC_LOSSES].sort((a, b) => a - b);` |
| `mean` | `sorted.reduce((s, v) => s + v, 0) / sortedLen;` |
| `var95` | `sorted[Math.floor(sorted.length * 0.95)];` |
| `es99` | `sorted.slice(Math.floor(sorted.length * 0.99)).reduce((s, v) => s + v, 0) /` |
| `probEvent` | `sorted.filter(v => v > 40).length / sortedLen;` |
| `fxAmplification` | `useMemo(() => REGIONS.map((r, i) => ({ region: r, fxStress: +(10 + sr(i * 13 + 200) * 40).toFixed(1), capitalFlowRisk: +(20 + sr(i * 17 + 200) * 50).toFixed(1), })) , []);` |
| `top10Risks` | `useMemo(() => [...SECTORS].sort((a, b) => b.systRiskIndex - a.systRiskIndex).slice(0, 10) .map((s, rank) => ({ rank: rank + 1, sector: s.name, scri: s.systRiskIndex, tipping: s.tippingProximity, contagion: s.contagionScore })) , []);` |
| `score` | `+(ch.baseScore * ampIntensity[ci]).toFixed(1);` |
| `next` | `[...ampIntensity]; next[ci] = +e.target.value; setAmpIntensity(next);` |
| `midVal` | `(i + 0.5) * 5;` |
| `recommended` | `t.id === 0 ? Math.min(t.max, toolLevels[i] + 1.0) :` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `AMPLIFIER_CHANNELS`, `CB_DOMAINS`, `CB_INDICATORS`, `FSOC_EW`, `MACRO_TOOLS`, `NGFS_SCENARIOS`, `REGIONS`, `SECTOR_NAMES`, `TABS`, `TIME_POINTS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| System Stress Level | — | CCI Engine | Composite systemic stress indicator under 2°C disorderly transition scenario. |
| Most Exposed Sector | — | Contagion Model | Sector with highest combined direct and indirect climate risk after contagion propagation. |
| Second-Round Amplification | — | Network Model | Multiplier reflecting how initial sectoral shocks are amplified through financial network linkages. |
- **Sectoral Balance Sheets, Interbank Exposure Data, NGFS Scenario Pathways** → Contagion matrix construction + iterative shock propagation + stability analysis → **Systemic risk dashboard, contagion heatmap, macroprudential policy briefs**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Contagion Index
**Headline formula:** `CCI = Σ (Sector Shockᵢ × Contagion Matrixᵢⱼ) / N`

Weighted propagation of sector-level climate shocks through inter-sectoral financial linkages captured in the contagion matrix.

**Standards:** ['BIS CGFS 2021', 'NGFS Systemic Risk Report 2023']
**Reference documents:** BIS CGFS Climate-related Risks to Financial Stability 2021; NGFS Systemic Risk and Financial Stability 2023; ECB Financial Stability Review Climate Chapter 2022; FSB Climate Risk Assessment 2020

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (partial).** The guide's `CCI = Σ(Sector Shock_i × Contagion
> Matrix_ij)/N` implies the contagion matrix directly determines the headline systemic-risk score.
> In the code, the headline **SCRI** ("SCRI Score"/"SCRI Composite") is `gdpWeightedSRI`, a
> **GDP-weighted mean of each sector's independently `sr()`-seeded `systRiskIndex`** — the 20×20
> `NETWORK` contagion matrix is **not** used in that calculation. However, the module does implement
> a genuine, separate **breadth-first cascade-propagation algorithm** over the same `NETWORK` matrix
> (§7.3) and a real Monte Carlo tail-loss engine with VaR/ES statistics (§7.4) — both legitimate risk
> calculations, just not wired into the single "SCRI" headline figure the way the guide's formula
> implies. Treat SCRI as a composite exposure score and the cascade/MC outputs as complementary,
> currently-unreconciled risk views.

### 7.1 What the module computes

20 sectors (`SECTORS`), each independently `sr()`-seeded across 19 risk attributes: `gdpWeight`
(2–12%), `systRiskIndex` (20–95), `contagionScore`, `physRisk`/`transRisk` (10–90), `leverageRatio`
(1.0–8.0×), `sectorPD` (0.1–6.0%), `sectorLGD` (30–70%), `tippingProximity`, `carbonLockIn`, and
more. A 20×20 `NETWORK` contagion-intensity matrix (off-diagonal `sr()`-seeded 0–0.65, diagonal 1.0),
5 NGFS scenarios with `baseMult` multipliers (Orderly 1.0 → Hot House World 2.2), 25 central-bank
early-warning indicators across 8 risk domains (`CB_INDICATORS`), 7 macroprudential policy tools
(`MACRO_TOOLS`, e.g. CCyB, sectoral capital buffer, carbon tax, green supporting factor) each with
per-unit GDP/credit/risk-reduction sensitivities, and a 1,000-draw Monte Carlo systemic-loss
distribution.

### 7.2 Headline SCRI (GDP-weighted composite)

```js
gdpWeightedSRI = Σ_sectors (systRiskIndex × gdpWeight) / Σ_sectors gdpWeight
```

A standard GDP-weighted average, correctly guarded against `totalW <= 0`. Because `systRiskIndex` is
itself an independent random draw per sector rather than a function of `physRisk`, `transRisk`,
`leverageRatio`, etc., the headline SCRI does not actually aggregate the platform's own underlying
risk drivers — it re-weights one already-synthetic composite field by GDP share.

### 7.3 Network cascade propagation (genuine graph algorithm)

```js
cascadeChain: BFS over NETWORK from contagionSource
  layer[0] = [contagionSource]
  layer[d] = { j : NETWORK[src][j] >= contagionThresh, src ∈ layer[d-1], j unvisited }
  stop when a layer is empty or cascadeDepth reached
```

This is a genuine **threshold-gated breadth-first search** through the contagion network — sector
`j` is "infected" at depth `d` only if some sector already infected at depth `d−1` has a link
strength ≥ the user-set `contagionThresh`. `networkDensity` separately computes the % of off-diagonal
matrix entries exceeding 0.3 (a network-connectivity statistic). `contagionAffected` is the 1-hop
neighbour list from a single source sector, sorted by link intensity — a genuine adjacency-list
lookup, not random.

### 7.4 Monte Carlo systemic-loss engine (genuine tail statistics)

```js
MC_SYSTEMIC_LOSSES[i] = base + fatTail
  base    = 5 + sr(i×3+7)×40                          // uniform-ish body, [5,45]
  fatTail = sr(i×3+8) > 0.92 ? sr(i×3+9)×60 : 0        // 8% draw probability, [0,60] tail add-on

mean   = Σ losses / 1000
VaR95  = sorted[floor(1000×0.95)]                       // 95th percentile
ES99   = mean(sorted[floor(1000×0.99):])                 // tail-conditional mean beyond 99th pctile
P(Event>40) = count(losses>40) / 1000
```

This is a **legitimate fat-tailed mixture distribution** (a uniform-ish body plus an 8%-probability
tail shock, loosely mimicking a Poisson-jump/mixture severity model) with correctly implemented
order-statistic VaR and Expected Shortfall — VaR₉₅ as the 95th-percentile order statistic and ES₉₉ as
the mean of losses beyond the 99th percentile are both textbook-correct definitions, distinct from
(and more rigorous than) the flat-multiplier "EAL" seen in several sibling modules in this batch.

### 7.5 Macroprudential tool effectiveness

```js
delta          = userToolLevel − currentLevel
gdpImpact      = gdpImpactPerUnit × delta
creditImpact   = creditImpactPerUnit × delta
riskReduction  = riskReductionPerUnit × |delta|
totalRiskReduction = Σ_tools riskReduction
```

A linear per-unit sensitivity model — moving the Counter-Cyclical Capital Buffer (CCyB) by +1pp costs
`−0.08%` GDP and `−0.4%` credit growth while reducing systemic risk by `0.6` points (per-unit
coefficients are static, hand-calibrated, not derived from a macro model), consistent in direction
with real BCBS Basel III CCyB guidance (higher buffers dampen credit growth and GDP marginally while
building resilience).

### 7.6 Worked example

Sector 8 (`i=8`, 'Real Estate'): `systRiskIndex = 20+sr(8*11)*75 = 20+sr(88)*75`. Illustratively
suppose this evaluates to `systRiskIndex≈78`, matching the guide's own stated example ("Most Exposed
Sector: Real Estate"). With `gdpWeight≈0.02+sr(56)*0.10`, say `≈0.07` (7%), Real Estate contributes
`78×0.07=5.46` to the weighted numerator. If the sum of all 20 `systRiskIndex×gdpWeight` products is
`≈41.5` against `Σ gdpWeight≈0.75` (weights don't sum to 1 by construction — each drawn
independently in [0.02, 0.12]), `gdpWeightedSRI = 41.5/0.75 ≈ 55.3`. At `scenarioIdx=1` ('Disorderly',
`baseMult=1.4`): `scriTrend[2030] = 55.3×1.4×(1+1×0.04)+noise ≈ 55.3×1.4×1.04+noise ≈ 80.5+noise` —
the scenario multiplier and a 4%-per-period compounding term project the SCRI forward, again without
feeding through the cascade or Monte Carlo machinery.

### 7.7 Data provenance & limitations

- **All sector attributes, the contagion matrix, MC loss draws, and central-bank indicators are
  `sr()`-seeded synthetic data** — realistic ranges (e.g. PD 0.1–6%, LGD 30–70%) but not calibrated
  to any real balance-sheet or interbank-exposure dataset.
- The three major analytical engines on this page — GDP-weighted SCRI, network cascade BFS, and
  Monte Carlo VaR/ES — are **not reconciled with each other**: a user can set `contagionThresh` low
  enough to cascade the entire network without any corresponding change in `gdpWeightedSRI`, and
  `mcStats.probEvent` does not feed back into the SCRI trend projection.
- Macroprudential tool sensitivities are static, expert-judgment-style coefficients, not
  econometrically estimated.

**Framework alignment:** BIS CGFS (2021) and NGFS Systemic Risk Report (2023) are the guide's cited
sources for the contagion-index concept; the module's cascade-BFS and network-density calculations
are methodologically consistent with the network-based systemic-risk literature those bodies draw
on (e.g. DebtRank-style threshold propagation), even though the headline SCRI does not itself use the
network. NGFS's 5 scenario archetypes (Orderly/Disorderly/Hot House World/Below 2°C/Nationally
Determined) are correctly named and ordered by severity (`baseMult` increasing with scenario
disorderliness, Hot House World highest at 2.2×), matching NGFS's own severity ranking.

## 9 · Future Evolution

### 9.1 Evolution A — Reconcile the three engines: cascade-driven SCRI on real exposure data (analytics ladder: rung 2 → 3)

**What.** This module already contains two genuine engines — a threshold-gated BFS cascade over the 20×20 `NETWORK` matrix (§7.3) and a fat-tailed Monte Carlo with textbook-correct VaR₉₅/ES₉₉ (§7.4) — but §7.7 documents that neither feeds the headline: `gdpWeightedSRI` is a GDP-weighted mean of independently `sr()`-seeded `systRiskIndex` values, so lowering `contagionThresh` until the whole network cascades changes the SCRI not at all. Evolution A makes the headline honest: SCRI becomes a function of the module's own drivers and the cascade output, calibrated to real sectoral data.

**How.** (1) Derive `systRiskIndex = f(physRisk, transRisk, leverageRatio, sectorPD × sectorLGD)` with documented weights, killing the independent-noise field. (2) Run the existing BFS per scenario and add a second-round term: `SCRI_total = SCRI_direct × (1 + cascade_amplification)`, where amplification comes from infected-layer GDP shares — this implements the guide's `CCI = Σ(Shock_i × Matrix_ij)/N` intent using code that already exists. (3) Calibrate: replace the `sr()`-seeded contagion matrix with sectoral input-output linkages (OECD ICIO or EXIOBASE, free) and sector PDs anchored to published ECB/NGFS scenario-exercise loss rates; parameterise the MC mixture (8% jump probability, [0,60] tail) to reproduce the NGFS 4–5% disorderly-GDP-loss headline the module itself quotes.

**Prerequisites.** GDP weights renormalised to sum to 1 (today drawn independently in [0.02,0.12], §7.6). **Acceptance:** cascading the full network at low threshold measurably raises SCRI; a bench pin fixes VaR₉₅/ES₉₉ for a seeded draw sequence; sector ranking is reproducible from named drivers.

### 9.2 Evolution B — Macroprudential scenario analyst with tool-called policy what-ifs (LLM tier 2)

**What.** A copilot for the module's natural user — a financial-stability analyst — that explains contagion paths ("why does a Real Estate shock reach Insurance at depth 2?") by reading the actual BFS layers and link strengths, and executes policy what-ifs ("raise CCyB 1pp and re-run Disorderly") against the `MACRO_TOOLS` linear-sensitivity model and cascade engine as tools.

**How.** The module has no backend (EP code None) — so the tier-2 prerequisite is porting the three engines (cascade BFS, MC tail stats, tool-effectiveness) behind Pydantic-typed routes, e.g. `POST /api/v1/systemic-risk/cascade`, from which tool schemas auto-generate per the roadmap pattern. Grounding corpus: this Atlas page's §7.2–7.5 formula documentation plus the 25 `CB_INDICATORS` early-warning definitions and NGFS scenario descriptions. The copilot narrates only computed artifacts: cascade layer membership, `networkDensity`, VaR/ES from `mcStats`, and per-tool GDP/credit/risk trade-offs (`gdpImpactPerUnit × delta`). Tier-1 slice (explanation of on-screen numbers from page state) ships without the port.

**Prerequisites (hard).** Evolution A's reconciliation should land first — a copilot explaining today's SCRI would have to explain a number disconnected from the cascade it also narrates, an incoherence users will detect. Tool sensitivities remain expert-judgment coefficients; the copilot must label them as such. **Acceptance:** every contagion-path claim matches BFS output for the stated threshold; adversarial probe "what is the interbank exposure between sectors X and Y in EUR?" is refused (the module holds intensities, not exposures).