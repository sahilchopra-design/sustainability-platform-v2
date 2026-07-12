# CleanTech Investment Analytics
**Module ID:** `cleantech-investment` · **Route:** `/cleantech-investment` · **Tier:** B (frontend-computed) · **EP code:** EP-DF1 · **Sprint:** DF

## 1 · Overview
Evaluates cleantech venture and growth investment opportunities using technology readiness levels (TRL), emissions abatement potential, and market sizing models. Integrates IPCC mitigation pathway demand signals with technology cost curves and first-mover advantage quantification.

> **Business value:** Essential for cleantech venture capital, growth equity, and climate-focused PE funds. Provides systematic scoring framework aligned with IEA Net Zero roadmap, enables portfolio construction across TRL stages, and quantifies abatement impact for Article 9 SFDR impact reporting.

**How an analyst works this module:**
- Browse cleantech categories by sector and TRL stage
- Filter by emissions abatement potential and market size
- Analyse cost learning curves and deployment scenarios
- Model portfolio construction across TRL stages
- Export investment thesis with IPCC pathway alignment evidence

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `Card`, `GEOS`, `KpiCard`, `SECTORS`, `SECTOR_META`, `STAGES`, `TABS`, `TRL_DESC`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits: 0 });` |
| `SECTORS` | `['Solar PV', 'Wind', 'Battery Storage', 'Green Hydrogen', 'CCS/CCUS', 'EV & Mobility', 'Smart Grid', 'AgriTech', 'Water Tech', 'Circular Economy'];` |
| `GEOS` | `['North America', 'Europe', 'Asia-Pacific', 'UK', 'LatAm', 'MEA'];` |
| `TRL_DESC` | `{ 1:'Basic Research', 2:'Technology Concept', 3:'Proof of Concept', 4:'Lab Validation', 5:'Pilot Demonstration', 6:'Prototype', 7:'Pre-Commercial', 8:'First-of-Kind', 9:'Commercial' };` |
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `stage` | `STAGES[Math.floor(sr(i * 11) * STAGES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i * 13) * GEOS.length)];` |
| `trl` | `Math.floor(2 + sr(i * 17) * 7); // 2–8` |
| `valuation` | `Math.round(10 + sr(i * 19) * 990); // $M` |
| `revenue` | `Math.round(valuation * (0.05 + sr(i * 23) * 0.40));` |
| `capexReq` | `Math.round(5 + sr(i * 29) * 195); // $M funding need` |
| `irr` | `Math.round(8 + sr(i * 31) * 32);  // %` |
| `payback` | `Math.round(3 + sr(i * 37) * 12);  // years` |
| `capacity` | `Math.round(10 + sr(i * 41) * 490); // MW or kt/yr` |
| `abatPot` | `Math.round(capacity * (0.8 + sr(i * 43) * 1.2)); // ktCO₂/yr` |
| `abatCost` | `Math.round(meta.abatCost * (0.7 + sr(i * 47) * 0.6)); // $/tCO₂` |
| `esgScore` | `Math.round(50 + sr(i * 53) * 45);` |
| `patentCnt` | `Math.floor(sr(i * 59) * 80);` |
| `rdPct` | `Math.round(5 + sr(i * 61) * 35); // % of revenue` |
| `sectorRows` | `useMemo(() => SECTORS.map(s => {` |
| `scatterData` | `useMemo(() => filtered.map(c=>({ x:c.abatCost, y:c.irr, name:c.name })), [filtered]);` |
| `stageData` | `useMemo(() => STAGES.map(s=>({` |
| `cnt` | `filtered.filter(c=>c.trl===+trl).length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `GEOS`, `SECTORS`, `STAGES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Annual CleanTech Investment | — | BloombergNEF Energy Transition Investment 2024 | Global clean energy investment exceeded fossil fuel for first time in 2023 |
| Solar Learning Rate | — | IEA 2023 Solar PV Special Report | Solar PV costs have fallen 89% since 2010; BNEF projects further 60% by 2030 |
| Green Hydrogen Cost Target | — | IEA Global Hydrogen Review 2023 | Current green hydrogen cost $3–8/kg; $1/kg target unlocks mass industrial decarbonisation |
- **IEA/BNEF technology cost curves by TRL** → Deployment scenario modelling → **Market size and abatement potential by technology by 2030/2040/2050**
- **Patent and R&D investment data** → Innovation pipeline assessment → **First-mover IP advantage score**
- **IPCC AR6 WGIII mitigation pathway demand signals** → Technology adoption curves → **Required deployment rate vs current trajectory gap**

## 5 · Intermediate Transformation Logic
**Methodology:** CleanTech Investment Score
**Headline formula:** `InvestScore = (TRL/9 × 0.3) + (AbatementPotential/MaxAbatement × 0.3) + (MarketSize/GDP × 0.2) + (CostLearningRate × 0.2)`

Combines technology maturity (TRL 1–9), abatement potential (GtCO2e/yr at full scale), addressable market, and learning rate to score investment opportunity

**Standards:** ['IEA Net Zero by 2050 Technology Guide', 'BloombergNEF CleanTech Market Sizing', 'IPCC AR6 WGIII Chapter 16 — Innovation', 'Breakthrough Energy Ventures TRL Framework']
**Reference documents:** IEA Net Zero by 2050 — A Roadmap for the Global Energy Sector (2023 Update); BloombergNEF Energy Transition Investment Trends 2024; IPCC AR6 WGIII Summary for Policymakers — Technology Innovation; Breakthrough Energy Ventures Investment Framework

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide specifies an **InvestScore** composite
> `= (TRL/9·0.3) + (AbatementPotential/Max·0.3) + (MarketSize/GDP·0.2) + (CostLearningRate·0.2)`.
> **This composite is not computed anywhere in the code.** The module generates a 60-company synthetic
> universe with per-company TRL, valuation, IRR, abatement potential/cost, ESG, and patents, and plots
> them (abatement-cost vs IRR scatter, stage/TRL distributions, sector rollups) — but never forms the
> weighted investment score. Real sector abatement benchmarks are hard-coded; the company data is
> entirely `sr()`-seeded. The InvestScore is a §8 candidate. Code documented below.

### 7.1 What the module computes

No single-company investment score. Derived views over the synthetic `COMPANIES`:
- `sectorRows` — per-sector counts, mean valuation, mean IRR, total abatement potential.
- `scatterData` — `{x: abatCost, y: irr}` per filtered company (a cost-vs-return map).
- `stageData` — company counts by funding stage.
- TRL histogram — count of filtered companies at each TRL.
Plus a shared `CleanTechAdvancedAnalytics` panel (EU Taxonomy / SBTi overlays).

### 7.2 Parameterisation / data rubric

| Element | Value | Provenance |
|---|---|---|
| Sector abatement cost ($/tCO₂) | Solar 12, Wind 18, Battery 35, H₂ 85, CCS 95, EV 28 | `SECTOR_META` — **realistic MACC benchmarks** (IEA/BNEF-consistent) |
| Sector potential (MtCO₂/yr by 2035) | Solar 4,800, Wind 3,900, EV 3,200, H₂ 2,800 | `SECTOR_META` — realistic global-scale |
| TRL descriptions (1–9) | Basic Research → Commercial | `TRL_DESC` — NASA/EU TRL scale |
| Company universe (60) | sector, stage, geo, TRL 2–8, valuation, revenue, capex, IRR, payback, abatement, ESG, patents, R&D% | **All `sr()`-seeded synthetic** |

### 7.3 Calculation walkthrough

Sixty companies are generated deterministically from the `sr()` PRNG: each draws a sector/stage/geo,
a TRL (2–8), a valuation ($10–1,000M), revenue as a fraction of valuation, an IRR (8–40%), abatement
potential (capacity × 0.8–2.0), and an abatement cost scaled off the real sector benchmark
(`SECTOR_META.abatCost · (0.7–1.3)`). Filters (sector/stage/geo/TRL) subset the universe; the derived
views aggregate the subset. The abatement-cost-vs-IRR scatter is the core decision view — cheap
abatement with high IRR is the upper-left target quadrant.

### 7.4 Worked example (one synthetic company + intended score)

Company i with sector "Solar PV" (benchmark abatCost 12), TRL 6, IRR 24%, abatement potential 480
ktCO₂/yr, abatement cost `12·(0.7+sr·0.6) ≈ 12·1.0 = $12/t`. In the scatter it plots at (x=12, y=24) —
low-cost, high-return. The guide's *intended* InvestScore (not in code) would be, with
maxAbatement ≈ 600 kt in-sample:
`(6/9·0.3) + (480/600·0.3) + (marketSize/GDP·0.2) + (learningRate·0.2) ≈ 0.20 + 0.24 + … ` — but the
market-size and learning-rate terms have no company-level inputs, which is likely why the composite
was never wired.

### 7.5 Data provenance & limitations
- **The entire company universe is synthetic `sr()`-seeded demo data** — valuations, IRRs, abatement,
  ESG and patents are not real companies. Only the sector abatement benchmarks are real.
- The headline InvestScore from the guide is unimplemented; there is no ranking by a single composite.
- Abatement cost is a noisy scaling of a sector average, not a bottom-up LCOE/marginal-abatement calc;
  learning rates and market-size-to-GDP terms have no data source in the module.

**Framework alignment:** **IEA Net Zero by 2050** technology guide and **BloombergNEF** market sizing
inform the `SECTOR_META` abatement benchmarks. **TRL (NASA/EU 1–9)** scale is used directly. **IPCC
AR6 WGIII** mitigation demand and **Breakthrough Energy Ventures** framing are cited as the intended
scoring basis. The shared analytics panel adds **EU Taxonomy** and **SBTi** alignment overlays for
Article 9 SFDR impact context.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays cleantech opportunities
without the guide's InvestScore composite.

**8.1 Purpose & scope.** Rank cleantech venture/growth opportunities by a single 0–100 investability
score combining technology maturity, climate impact, market opportunity, and cost-trajectory, to
support portfolio construction across TRL stages.

**8.2 Conceptual approach.** A multi-attribute utility score in the style of **Breakthrough Energy
Ventures'** and climate-VC screening frameworks, with a technology-cost-curve (learning-rate) term
grounded in **BNEF/IEA** experience curves — mirroring how mission-driven climate funds triage deals
(impact × maturity × TAM × cost trajectory).

**8.3 Mathematical specification.**
```
InvestScore = 100·[ 0.30·(TRL/9)
                   + 0.30·(abatPot / maxAbatPot)
                   + 0.20·min(1, TAM / TAM_ref)
                   + 0.20·learningScore ]
learningScore = clamp( LR / LR_max , 0, 1)          // LR = cost reduction per capacity doubling
TAM (addressable market $) = sector_potential(MtCO2) · abatement_value($/t)
Risk-adjust: InvestScore_adj = InvestScore · (1 − FOAK_penalty·1[TRL<7])
```
| Parameter | Value | Calibration source |
|---|---|---|
| Weights | 0.30/0.30/0.20/0.20 | Guide (judgemental) |
| Learning rate LR | Solar 23%, Wind 15%, Battery 18% per doubling | IEA/BNEF experience curves |
| TAM_ref | sector-max | IEA NZE deployment gap |
| FOAK_penalty | 0.1–0.2 | First-of-a-kind risk premium |

**8.4 Data requirements.** Per company: TRL, abatement potential (tCO₂/yr at scale), sector TAM,
sector learning rate, capex/LCOE trajectory. Sources: IEA NZE, BNEF cost curves, company diligence.
The platform holds `SECTOR_META` benchmarks; company-level inputs are needed (currently synthetic).

**8.5 Validation & benchmarking plan.** Rank-correlate InvestScore against realised VC outcomes where
available; confirm sector aggregate InvestScores track IEA NZE deployment-gap priorities; sensitivity
on weights (±5pp) for ranking stability.

**8.6 Limitations & model risk.** Early-TRL abatement potential is speculative; learning rates are
historical and may not extrapolate. Weights are judgemental and impact-vs-return trade-offs are
investor-specific. Conservative fallback: report the four sub-scores and the FOAK flag alongside the
composite so a fund can re-weight to its mandate.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the InvestScore over sourced sector benchmarks (analytics ladder: rung 1 → 2)

**What.** §7 flags that the guide's composite —
`InvestScore = TRL/9·0.3 + Abatement/Max·0.3 + MarketSize/GDP·0.2 + LearningRate·0.2`
— is never formed: the page renders a 60-company `sr()`-seeded universe through
scatter/histogram/rollup views, with only the sector abatement benchmarks hard-coded
from real sources. Evolution A implements the score at the honest level of granularity:
**sector × TRL-stage** scoring first (where the real benchmark data lives — IEA Net
Zero technology-guide abatement potentials, published learning rates per technology,
BNEF market sizing from §5's reference list), with per-company scores only for
user-entered companies whose TRL/market inputs are real.

**How.** (1) `ref_cleantech_benchmarks(sector, abatement_gt, learning_rate, market_bn,
source, vintage)` reference table replacing in-page constants; the 10-sector list is
already the page's organizing axis. (2) The composite as a pure function with the
guide's weights; a user-entered company form (TRL, target market, geography) produces
a scored, comparable result. (3) The synthetic 60-company universe re-labelled as
demonstration fixtures or removed — the scatter (abatement cost vs IRR) keeps working
over whatever universe is loaded, but its provenance must be displayed.

**Prerequisites.** Benchmark licensing check for BNEF figures (IEA/IPCC values are
public); the `CleanTechAdvancedAnalytics` shared panel's overlays unaffected
(regression-checked). **Acceptance:** a TRL-9 solar company in a large market scores
above a TRL-3 CCS venture under default weights, with each term traceable to a
benchmark row; the mismatch flag clears.

### 9.2 Evolution B — Thesis-drafting analyst (LLM tier 2)

**What.** The module's stated endpoint is "export investment thesis with IPCC pathway
alignment evidence" — a natural LLM deliverable. An analyst assistant that takes a
company profile (sector, TRL, geography), calls the Evolution A scoring function and
benchmark lookups as tools, and drafts a structured thesis: score decomposition,
sector abatement context from the reference table, learning-curve trajectory, SFDR
Article-9 impact framing — every numeric from tool calls, every framework claim cited
to the §5 corpus (IEA NZE, IPCC AR6 WGIII Ch.16, Breakthrough TRL framework).

**How.** Client-side tool schemas over the scoring/benchmark functions (no backend
routes exist); the thesis renders through the platform's report-studio layer per the
tier-3 output pattern; the no-fabrication validator checks the draft's numbers against
tool outputs — particularly important here because investment-thesis prose is exactly
where an LLM would otherwise improvise multiples and market sizes.

**Prerequisites (hard).** Evolution A first: a thesis generator over PRNG-fabricated
company IRRs would produce authoritative-sounding fiction. **Acceptance:** every
figure in a generated thesis traces to a benchmark row or tool return; asked to
predict a company's exit valuation, the assistant refuses and offers the computed
score decomposition instead.