# Net Zero Portfolio Alignment
**Module ID:** `net-zero-portfolio-alignment` · **Route:** `/net-zero-portfolio-alignment` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Measures the alignment of investment portfolios with science-based net-zero trajectories using implied temperature rise, sector decarbonisation benchmarks, and portfolio temperature score methodologies.

> **Business value:** Provides asset owners and managers with a standardised, science-based framework to measure, report, and improve portfolio temperature alignment in line with Paris Agreement commitments.

**How an analyst works this module:**
- Collect company-level emissions data and SBT or long-term target commitments
- Compute ITR using sector-specific carbon budget allocation and company decarbonisation trajectory
- Weight ITRs by portfolio exposure (market value or EVIC-based)
- Compare PTS to 1.5°C / 2°C benchmarks; identify top contributors to temperature overshoot

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRIES_NZ`, `DECARBONIZATION_PATHS`, `ENGAGEMENT_OUTCOMES`, `HOLDINGS`, `HOLDINGS_N`, `KpiCard`, `SBT_STATUS`, `SECTORS_NZ`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sec` | `SECTORS_NZ[Math.floor(sr(i * 7 + 1) * SECTORS_NZ.length)];` |
| `s3u` | `sr(i * 17 + 4) * 800000 + 2000;` |
| `s3d` | `sr(i * 19 + 5) * 600000 + 1500;` |
| `rev` | `sr(i * 23 + 6) * 5000 + 200; // $M` |
| `evic` | `rev * (sr(i * 29 + 7) * 3 + 0.5);` |
| `itr` | `sr(i * 31 + 8) * 3 + 1.5;` |
| `sbt` | `SBT_STATUS[Math.floor(sr(i * 37 + 9) * SBT_STATUS.length)];` |
| `eng` | `ENGAGEMENT_OUTCOMES[Math.floor(sr(i * 41 + 10) * ENGAGEMENT_OUTCOMES.length)];` |
| `rawW` | `sr(i * 43 + 11) * 0.02 + 0.001;` |
| `totalW` | `HOLDINGS.reduce((s, x) => s + x.weight, 0);` |
| `HOLDINGS_N` | `HOLDINGS.map(h => ({ ...h, weight: h.weight / totalW }));` |
| `waci` | `useMemo(() => { const scope = scopeSelect === '1+2+3' ? 'all' : scopeSelect === '1+2' ? '12' : scopeSelect;` |
| `engagementITRImpact` | `useMemo(() => { const engagedPortion = engagementPct / 100;` |
| `improvement` | `engagedPortion * 0.1; // 0.1°C per engagement level` |
| `scale` | `h.revenueUSD > 0 ? h.weight / h.revenueUSD : 0;` |
| `engagementMatrix` | `useMemo(() => { return ENGAGEMENT_OUTCOMES.map(eng => { const holdings = filtered.filter(h => h.engagementOutcome === eng);` |
| `avgITR` | `holdings.length ? holdings.reduce((s, h) => s + h.temperature, 0) / holdings.length : 0;` |
| `tw2` | `sh.reduce((s, h) => s + h.weight, 0);` |
| `waci2` | `sh.reduce((s, h) => s + (h.weight / tw2) * ((h.scope1 + h.scope2) / (h.revenueUSD \|\| 1)), 0);` |
| `avg30` | `sh.length ? sh.reduce((s, h) => s + h.targetYear2030, 0) / sh.length : 0;` |
| `avgITR2` | `sh.reduce((s, h) => s + h.temperature, 0) / sh.length;` |
| `sbtCov` | `sh.filter(h => h.sbtStatus !== 'None').length / sh.length * 100;` |
| `avgGC` | `sh.reduce((s, h) => s + h.capexGreenPct, 0) / sh.length;` |
| `avgPhys` | `sh.reduce((s, h) => s + h.physicalRisk, 0) / sh.length;` |
| `avgTrans` | `sh.reduce((s, h) => s + h.transitionRisk, 0) / sh.length;` |
| `nzamaPct` | `sh.filter(h => h.nzamaAligned).length / sh.length * 100;` |
| `avgITR3` | `ch.length ? ch.reduce((s, h) => s + h.temperature, 0) / ch.length : 0;` |
| `pct` | `filtered.length > 0 ? (count / filtered.length * 100).toFixed(1) : '0.0';` |
| `diff` | `pt.portfolio - pt.budget15;` |
| `footprint` | `waciVal * 1000;` |
| `total` | `computeWACI(filtered, 'all') * 1000 \|\| 1;` |
| `stages` | `['Pre-engagement', 'Initial Contact', 'Dialogue', 'Commitment', 'Monitoring', 'Verified'];` |
| `stage` | `stages[Math.floor(sr(i * 11 + 77) * stages.length)];` |
| `projITR` | `Math.max(1.5, h.itr - reduction);` |
| `delta` | `projITR - h.itr;` |
| `portContrib` | `h.weight * delta;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES_NZ`, `ENGAGEMENT_OUTCOMES`, `SBT_STATUS`, `SECTORS_NZ`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Average Listed Equity Portfolio Temperature | — | MSCI 2023 | Average portfolio temperature score for a global equity index portfolio before climate-aligned rebalancing. |
| Net Zero Asset Owner Alliance Target | — | NZAOA Target Setting Protocol v3 2022 | Interim and long-term temperature alignment targets committed to by NZAOA member asset owners. |
- **Company emissions data, SBT registry, sector carbon budgets, portfolio weights** → ITR computation, portfolio aggregation, benchmark gap analysis → **Portfolio temperature dashboards, sector decarbonisation heat maps, rebalancing recommendations**

## 5 · Intermediate Transformation Logic
**Methodology:** Portfolio Temperature Score
**Headline formula:** `PTS = Σ wᵢ × ITRᵢ`

Weighted average of company-level Implied Temperature Rise scores across portfolio holdings; target PTS ≤ 1.5°C for Paris alignment.

**Standards:** ['TCFD Portfolio Alignment 2021', 'MSCI Climate Value-at-Risk']
**Reference documents:** TCFD Portfolio Alignment Measurement: Technical Supplement 2021; MSCI Net Zero Target Tracker Methodology 2022; Net Zero Asset Owner Alliance Target Setting Protocol v3 2022; SBTi Temperature Scoring Methodology 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module's core arithmetic **matches its MODULE_GUIDES entry** — a genuine exposure-weighted
Portfolio Temperature Score (PTS) and Weighted Average Carbon Intensity (WACI) engine — but every
input holding is synthetic. The guide's `PTS = Σ wᵢ × ITRᵢ` formula is implemented essentially
verbatim; the gap is entirely in the data layer, not the aggregation math.

### 7.1 What the module computes

`HOLDINGS` — 120 synthetic positions (`{SEC}-H001`…`H120`, sector-prefixed codes, not real
company names) — each seeded independently across 8 sectors, 12 countries, `scope1/2/3`
emissions, `revenueUSD`, `evic`, `temperature` (ITR, 1.5–4.5°C), `sbtStatus`, `nzamaAligned`,
`capexGreenPct`/`capexFossilPct`, 2030/2050 reduction pledges, `physicalRisk`/`transitionRisk`,
`engagementOutcome`. Weights are normalised so `Σ weight = 1`:

```js
WACI(scope)  = Σ wᵢ × (emissionsᵢ,scope / revenueUSDᵢ)              // tCO2e/$M revenue
PTS (portfolioITR) = Σ (wᵢ / Σw_filtered) × temperatureᵢ            // exposure-weighted ITR
```

### 7.2 Parameterisation

| Field | Formula | Range |
|---|---|---|
| `temperature` (ITR) | `sr(i×31+8)×3+1.5` | 1.5–4.5 °C |
| `scope1` | `sr(i×11+2)×500000+1000` | 1,000–501,000 t |
| `revenueUSD` | `sr(i×23+6)×5000+200` | $200M–$5.2B |
| `evic` | `rev × (sr(i×29+7)×3+0.5)` | 0.5×–3.5× revenue |
| `targetYear2030` | `-(sr(i×71+17)×50+10)` | −10% to −60% by 2030 |
| `targetYear2050` | `-(sr(i×73+18)×80+15)` | −15% to −95% by 2050 |
| `nzamaAligned` | `sr(i×53+13)>0.5` | ~50% true |

`DECARBONIZATION_PATHS` — 26-year (2025–2050) exponential decay curves for 4 reference lines
(`portfolio`, `sbt15`, `gfanz`, `budget15`), each `100×base^(t or t×exponent)` with hand-set decay
bases (0.60 portfolio, 0.50 SBTi-1.5°C, 0.55 GFANZ, 0.45 carbon-budget-1.5°C) — a deterministic
illustrative comparison, not fit to the 120 holdings' actual pledged trajectories.

### 7.3 Calculation walkthrough

1. Filter `HOLDINGS_N` by sector, SBT status, ITR range, minimum weight, engagement outcome.
2. **`portfolioITR`** — re-normalises weights *within the filtered subset* (`tw = Σ filtered
   weight`) before computing the exposure-weighted mean temperature — correct methodology
   (filtering shouldn't silently use stale portfolio-wide weights), matching TCFD Portfolio
   Alignment Technical Supplement's weighted-average approach.
3. **`waci`** — selects scope combination (`1`, `1+2`, or `1+2+3`) and sums
   `weight × emissions/revenue` per holding — the standard TCFD/PCAF WACI definition
   (tCO2e/$M revenue), correctly using the un-renormalised full-portfolio weights (`HOLDINGS_N`
   already has `Σweight=1` globally) inside `computeWACI`.
4. **`engagementITRImpact`** — `max(0, portfolioITR − engagementPct/100 × 0.1)` — a hand-picked
   linear assumption that "0.1°C of temperature improvement per 100% engagement coverage"; not
   derived from any engagement-outcome field on individual holdings (i.e. it ignores the
   `engagementOutcome` categorical data already present per holding).
5. **`sbtBreakdown`** — sums weight×100 by `sbtStatus` (Approved/Committed/None) for the filtered
   set — straightforward weighted composition.
6. **PAII Framework / Decarbonization Pathways tabs** — plot the 120 holdings' ITR distribution
   against the 4 static decay curves and the UN PAII (Paris Aligned Investment Initiative)
   framework's naming conventions (target-setting, engagement, capital allocation) as section
   labels, without a PAII-specific scoring formula.

### 7.4 Worked example

Holding `i=0`: `sec = SECTORS_NZ[floor(sr(1)×8)]`. `sr(1)`: `sin(2)=0.9093`, ×10000=9092.97,
`frac=0.974` (`floor(9092.97)=9092`, remainder 0.97). `floor(0.974×8)=7` → `SECTORS_NZ[7]="Consumer
Disc."`. `temperature = sr(31×0+8)×3+1.5 = sr(8)×3+1.5`. `sin(9)=0.4121`, ×10000=4121.2,
`frac=0.185` → `temperature ≈ 1.5+0.185×3 = 2.055°C`. `revenueUSD = sr(23×0+6)×5000+200 = sr(6)×5000
+200`. `sin(7)=0.6570`, ×10000=6570.2, `frac=0.19` (approx) → `revenue ≈ 200+0.19×5000=1,150`.
`scope1 = sr(2)×500000+1000`: `sin(3)=0.1411`, ×10000=1411.2, `frac=0.2` (approx) →
`scope1 ≈ 1000+0.2×500000=101,000 t`. Holding's WACI contribution (scope 1 only, un-weighted):
`101,000/1,150 = 87.8 tCO2e/$M` — this single holding's carbon intensity then enters the portfolio
WACI multiplied by its normalised weight (`rawW/totalW`, itself a `sr()` draw ~0.001–0.021 before
normalisation).

### 7.5 Data provenance & limitations

- **120 synthetic holdings**, no company names, no real financial data — the platform's other
  portfolio-facing modules (e.g. `paris-alignment`) at least use recognisable tickers; this module
  uses sector-code placeholders (`ENE-H001` etc.).
- The WACI and PTS *aggregation formulas* are methodologically correct and match TCFD/PCAF
  conventions — the deficiency is entirely in the underlying holdings data, not the maths.
- `engagementITRImpact`'s "0.1°C per 100% engagement" is an unsourced modelling simplification
  bolted onto an otherwise legitimate weighted-average engine.
- `DECARBONIZATION_PATHS` reference curves are illustrative exponential decays chosen to visually
  separate 4 lines, not fitted to SBTi/GFANZ/1.5°C-budget published trajectories for any real
  sector or index.

**Framework alignment:** TCFD Portfolio Alignment Measurement: Technical Supplement (2021) —
exposure-weighted ITR aggregation is implemented per the Supplement's Book 2 (implied temperature
rise) methodology · PCAF — WACI formula (tCO2e/$M revenue) matches PCAF's asset-class-agnostic
carbon-intensity metric · UN PAII (Paris Aligned Investment Initiative) — named via tab label and
target-setting/engagement/capital-allocation framing, no PAII-specific maturity scoring
implemented · NZAOA Target Setting Protocol v3 — referenced in the guide for the 1.5°C/2050 target,
not encoded as a specific compliance check in code.

## 9 · Future Evolution

### 9.1 Evolution A — Real holdings behind a correct PTS/WACI engine (analytics ladder: rung 2 → 3)

**What.** §7 is clear that the aggregation math is right: the exposure-weighted Portfolio Temperature Score (`PTS = Σ wᵢ × ITRᵢ`) and Weighted Average Carbon Intensity are implemented essentially verbatim from the guide — the gap is entirely the data layer. The 120 `HOLDINGS` are synthetic (`{SEC}-H001` codes, not real companies), with `temperature`, `scope1/2/3`, `revenueUSD`, and `evic` all `sr()`-seeded. Evolution A feeds the correct engine real portfolio data, elevating it from a demo to a usable alignment tool.

**How.** (1) Read positions from `portfolios_pg` (the populated table) and resolve holdings to real emissions via the platform's PCAF/financed-emissions data and OWID/CDP feeds — the `net-zero-portfolio-builder` and `portfolio-temperature-score` siblings share this exact data need, so build one holdings-to-emissions resolver and reuse it. (2) Compute company-level ITR from the SBTi Temperature Scoring methodology (named in §5) using real sector carbon-budget allocation and each company's decarbonisation trajectory, replacing the seeded 1.5–4.5°C draws. (3) EVIC from real market cap + debt rather than `rev × (sr()·3+0.5)`, so EVIC-weighted attribution (§1) is meaningful. Keep the synthetic set as a labelled demo.

**Prerequisites.** The shared emissions resolver; SBTi temperature-scoring inputs (sector budgets, company targets); honest-null where a holding lacks emissions data rather than seeding it. **Acceptance:** PTS/WACI computed over real `portfolios_pg` holdings; changing a holding's weight moves PTS via the verbatim formula; top-contributor-to-overshoot ranking reflects real ITRs.

### 9.2 Evolution B — Portfolio-alignment copilot with contributor drill-down (LLM tier 2)

**What.** A copilot for asset owners: "what's my portfolio temperature and which 5 holdings push it over 2°C?", "how much does dropping the worst emitter improve PTS?", "show WACI by scope" — executed against the PTS/WACI engine over real holdings, with answers decomposing the weighted sum into per-holding contributions.

**How.** Tool schema over a `POST /nz-alignment/pts` endpoint (Evolution A) taking a portfolio ID; system prompt from this Atlas page's §5 formulas and the TCFD Portfolio Alignment / SBTi Temperature Scoring references named in §5 so the copilot correctly explains what ITR and PTS mean and their known limitations (temperature scores are model-dependent and not directly comparable across providers). The "drop the worst emitter" what-if is a recomputation tool call, not an estimate. Fabrication validator matches every temperature/intensity figure to a tool response; provenance expander shows which holdings had real vs missing emissions data.

**Prerequisites (hard).** Evolution A — the current holdings are synthetic codes, and a copilot reporting a portfolio temperature from seeded ITRs would be presenting noise as a Paris-alignment metric. **Acceptance:** every PTS/WACI figure traces to a tool call over real holdings; the contributor drill-down sums to the reported PTS; holdings with missing data are disclosed, not imputed.