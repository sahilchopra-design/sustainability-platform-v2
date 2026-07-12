## 7 · Methodology Deep Dive

### 7.1 What the module computes

Tracks 21 synthetic PE/VC portfolio deals (`DEAL_PIPELINE_INIT`) with per-deal ESG scores, carbon
intensity, and impact metrics (CO₂ avoided, jobs created), aggregated to fund-level via a genuine
capital-weighted average — matching the guide's stated methodology:

```
FES (fund ESG score) = Σ(deal.esgScore × deal.dealSize_mn) / Σ(deal.dealSize_mn)     // wESG in code
totalCO2              = Σ deal.impactMetrics.co2_avoided_t
totalJobs              = Σ deal.impactMetrics.{jobs_created | green_jobs_created | livelihoods_created}
HHI (concentration)    = Σ (sectorShare_i × 100)²
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `DEAL_PIPELINE_INIT` (21 rows) | company, sector, stage, geography, fund, dealSize, esgScore, carbonIntensity, impactMetrics, SDGs | Seed data with named-style companies and per-deal SDG tagging; carbon intensity and ESG score are per-deal constants, not derived from underlying E/S/G sub-metrics |
| `avgESG` (simple mean) vs `wESG` (capital-weighted mean) | both computed, over `active` deals for the former, all deals for the latter | Correct distinction — capital-weighted (`wESG`) is the PCAF/EDCI-consistent convention for fund-level ESG reporting, unweighted (`avgESG`) is a secondary descriptive stat |
| `ddItems` | `deals.length × 30` | Synthetic demo value — assumes a flat 30 diligence items per deal, not sector- or stage-differentiated |
| `target` (per-deal ESG improvement target) | `min(esgScore+15, 100)` | Synthetic demo value: a flat +15-point aspiration capped at 100, not derived from any sector benchmark or SBTi-style target-setting methodology |
| HHI (sector concentration) | `Σ(share%)²` | **Correctly implemented** Herfindahl-Hirschman Index — a standard concentration-risk metric (not named in the guide, but a legitimate addition) |

### 7.3 Calculation walkthrough

1. **Fund ESG score**: `wESG = Σ(esgScore×dealSize)/Σ(dealSize)` — genuinely capital-weighted, the
   correct implementation of the guide's stated `FES = Σwᵢ×CompanyESGᵢ` formula, with `wᵢ =
   dealSize_mn/totalVal`.
2. **Impact aggregation**: `totalCO2`/`totalJobs` sum across deals' `impactMetrics` object, with a
   fallback chain (`jobs_created || green_jobs_created || livelihoods_created`) accommodating
   different impact-metric vocabularies across sectors (e.g. renewable-energy deals report
   "green_jobs_created," microfinance deals report "livelihoods_created") — a sensible normalisation
   pattern.
3. **Due-diligence heatmap** (`ddHeatmap`): builds an E/S/G dimension breakdown per deal from
   `dims={E:0,S:0,G:0}` accumulation logic (not fully visible in the extracted snippet, but the
   `globalIdx = catIdx*10+i` pattern suggests a category×deal indexing scheme feeding a heatmap
   grid).
4. **Stage progression / radar**: `avgCarbon`/`avgSize` computed per fund stage (Seed/Series
   A/Growth/etc.), enabling a "does carbon intensity fall as companies mature" view — a legitimate
   longitudinal-by-stage cut, though cross-sectional (different companies per stage) rather than
   true cohort tracking.
5. **SDG coverage**: `sdgCoverage` maps each of the UN's 17 SDGs to the count of deals tagging it —
   a straightforward tally against `SDG_NAMES`, correctly using the real UN SDG numbering.
6. **Concentration risk**: `hhi = Σ(sectorShare/totalVal×100)²` — textbook HHI; conventionally
   <1,500 = unconcentrated, 1,500–2,500 = moderate, >2,500 = highly concentrated (US DOJ/FTC
   thresholds), though the module doesn't appear to label these bands explicitly in the extracted
   formulas.

### 7.4 Worked example

Three deals: `$40M @ ESG 72`, `$25M @ ESG 58`, `$15M @ ESG 85`:

| Step | Computation | Result |
|---|---|---|
| Total value | 40+25+15 | $80M |
| Simple avg ESG | (72+58+85)/3 | 71.7 |
| Capital-weighted ESG (wESG) | (72×40+58×25+85×15)/80 | (2,880+1,450+1,275)/80 = **70.1** |
| Sector shares (if all different sectors) | 50%, 31.25%, 18.75% | |
| HHI | 50²+31.25²+18.75² | 2,500+976.6+351.6 = **3,828** (highly concentrated) |

The capital-weighted score (70.1) sits below the simple average (71.7) here because the largest deal
(ESG 72) drags below the smallest, highest-scoring deal (ESG 85) — correctly illustrating why
capital weighting matters for fund-level reporting.

### 7.5 Data provenance & limitations

- **All 21 deals and their ESG/impact metrics are synthetic demo data** — company names, sectors,
  and SDG tags are illustrative, not sourced from a real portfolio.
- Per-deal `esgScore` and `carbonIntensity` are seed constants, not built up from underlying E/S/G
  sub-component scores the way `pe-esg-diligence` at least attempts (independently) to do.
- ESG improvement `target` (+15 flat, capped at 100) has no sector or peer-benchmark grounding.

**Framework alignment:** ESG Data Convergence Initiative (EDCI) — the capital-weighted fund ESG
score and standardised impact-metric vocabulary (jobs/CO₂ avoided) are structurally consistent with
EDCI's core-metric convergence goal; GRESB PE Assessment — cited but no GRESB-specific scoring
rubric (property/asset-level environmental performance) is implemented; SDG tagging — correctly uses
the real 17-goal UN framework for impact classification.
