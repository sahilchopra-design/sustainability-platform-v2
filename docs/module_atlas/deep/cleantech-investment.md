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
