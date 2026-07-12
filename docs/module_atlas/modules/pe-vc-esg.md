# PE/VC ESG Analytics
**Module ID:** `pe-vc-esg` · **Route:** `/pe-vc-esg` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Integrates ESG performance monitoring and impact measurement across PE and VC portfolios, supporting LP reporting, fund-level ESG scoring, and portfolio company improvement tracking.

> **Business value:** Provides PE and VC fund managers with a comprehensive ESG performance monitoring system aligned with EDCI, GRESB, and LP reporting standards, supporting responsible investment and fund-raising commitments.

**How an analyst works this module:**
- Collect company-level ESG KPIs per EDCI protocol: GHG intensity, board diversity, work-related injuries
- Aggregate to fund level using invested capital weights; compute year-on-year improvement rates
- Benchmark fund ESG score against GRESB PE assessment and peer universe
- Produce LP ESG report: fund score, portfolio heat map, progress against ESG action plans

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_DD_ITEMS`, `DEAL_PIPELINE_INIT`, `LS_DEALS_KEY`, `LS_KEY`, `PE_DD_CHECKLIST`, `PIE_COLORS`, `SDG_COLORS`, `SDG_NAMES`, `STAGES`, `STAGE_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `DEAL_PIPELINE_INIT` | 21 | `company`, `sector`, `stage`, `vintage`, `geography`, `fund`, `dealSize_mn`, `equity_mn`, `evMultiple`, `irrTarget`, `esgScore`, `carbonIntensity`, `employees`, `revenue_mn`, `ebitda_mn`, `status`, `sdgs`, `impactMetrics`, `jobs_created`, `mwh_clean_energy` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `(n, d=1) => n == null ? '-' : Number(n).toFixed(d);` |
| `fmtI` | `n => n == null ? '-' : Math.round(n).toLocaleString();` |
| `fmtM` | `n => n == null ? '-' : `$${Number(n).toFixed(1)}M`;` |
| `pct` | `n => n == null ? '-' : `${Number(n).toFixed(1)}%`;` |
| `badge` | `(label, color, bg) => ({ display:'inline-block', padding:'2px 8px', borderRadius:9999, fontSize:11, fontWeight:600, color, background:bg, marginRight:4, marginBottom:2 });` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type:'text/csv' });` |
| `SECTORS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.sector))].sort();` |
| `GEOS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.geography))].sort();` |
| `FUNDS` | `[...new Set(DEAL_PIPELINE_INIT.map(d => d.fund))].sort();` |
| `totalVal` | `deals.reduce((s, d) => s + d.dealSize_mn, 0);` |
| `avgESG` | `active.length ? active.reduce((s, d) => s + d.esgScore, 0) / active.length : 0;` |
| `avgIRR` | `active.length ? active.reduce((s, d) => s + d.irrTarget, 0) / active.length : 0;` |
| `wESG` | `totalVal > 0 ? deals.reduce((s, d) => s + d.esgScore * d.dealSize_mn, 0) / totalVal : 0;` |
| `totalCO2` | `deals.reduce((s, d) => s + (d.impactMetrics.co2_avoided_t \|\| 0), 0);` |
| `totalJobs` | `deals.reduce((s, d) => s + (d.impactMetrics.jobs_created \|\| d.impactMetrics.green_jobs_created \|\| d.impactMetrics.livelihoods_created \|\| 0), 0);` |
| `ddItems` | `deals.length * 30;` |
| `scatterData` | `useMemo(() => deals.map(d => ({ name: d.company, esg: d.esgScore, irr: d.irrTarget, size: d.dealSize_mn })), [deals]);` |
| `ddHeatmap` | `useMemo(() => { return deals.map(d => { const dims = { E:0, S:0, G:0 };` |
| `rows` | `deals.map(d => {` |
| `globalIdx` | `catIdx * 10 + i;` |
| `overall` | `Math.round((row.E + row.S + row.G) / 3);` |
| `stageProgression` | `STAGES.map(stage => {` |
| `totalValue` | `stageDeals.reduce((s, d) => s + d.dealSize_mn, 0);` |
| `radarData` | `STAGES.filter(st => deals.some(d => d.stage === st)).map(stage => {` |
| `avgCarbon` | `stageDeals.reduce((s, d) => s + d.carbonIntensity, 0) / stageDeals.length;` |
| `avgSize` | `stageDeals.reduce((s, d) => s + d.dealSize_mn, 0) / stageDeals.length;` |
| `sdgCoverage` | `Object.keys(SDG_NAMES).map(Number).map(sdg => {` |
| `target` | `Math.min(d.esgScore + 15, 100);` |
| `pctOfTotal` | `kpis.totalVal > 0 ? (d.dealSize_mn / kpis.totalVal * 100) : 0;` |
| `hhi` | `Object.values(sectorShares).reduce((s, v) => s + Math.pow(v / totalVal * 100, 2), 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_DD_ITEMS`, `DEAL_PIPELINE_INIT`, `FUNDS`, `GEOS`, `PIE_COLORS`, `SECTORS`, `STAGES`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG KPIs Tracked | — | ESG Data Convergence Initiative 2023 | Core ESG metrics tracked across PE/VC portfolios under the ESG Data Convergence Initiative (EDCI) protocol. |
| EDCI Signatory AUM | — | EDCI 2024 | Total AUM represented by EDCI signatories who have committed to standardised ESG data collection and reporting. |
- **Portfolio company ESG questionnaires, EDCI data submissions, financial ownership data** → EDCI KPI aggregation, capital-weighted scoring, GRESB benchmark comparison → **Fund ESG scorecards, LP reporting packs, portfolio improvement heat maps**

## 5 · Intermediate Transformation Logic
**Methodology:** Fund ESG Score
**Headline formula:** `FES = Σ wᵢ × CompanyESGᵢ`

Weighted average of portfolio company ESG scores using invested capital weights; supports ILPA and LP quarterly reporting.

**Standards:** ['GRESB Private Equity Assessment 2023', 'PRI Reporting Framework 2023']
**Reference documents:** ESG Data Convergence Initiative (EDCI) 2023 Protocol; GRESB Private Equity and Infrastructure Assessment 2023; PRI Reporting Framework 2023; ILPA Diversity in Action Initiative 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real EDCI company KPIs behind the capital-weighted fund score (analytics ladder: rung 1 → 3)

**What.** §7 shows the fund-level aggregation math is genuinely correct: the Fund ESG Score (`FES = Σ(esgScore × dealSize)/Σ dealSize`) is properly capital-weighted (the PCAF/EDCI-consistent convention), the simple-vs-weighted distinction is handled correctly, impact aggregation has a sensible fallback chain, and HHI sector concentration is correctly implemented. The gap: the 21 deals' per-deal `esgScore`/`carbonIntensity` are constants not derived from underlying E/S/G sub-metrics, and the improvement `target = min(esgScore+15, 100)` is a flat aspiration, not a benchmark-derived target. Evolution A grounds the company KPIs in real EDCI data.

**How.** (1) Structure company ESG scores from the actual EDCI KPI protocol (§1: GHG intensity, board diversity, work-related injuries — the ESG Data Convergence Initiative 2023 protocol named in §5), so each deal's `esgScore` is a documented composite of its collected KPIs rather than a constant. (2) Ground carbon intensity in real reported/PCAF-estimated emissions (shared with the financed-emissions modules). (3) Replace the flat +15 improvement target with sector-benchmark or GRESB-percentile-derived targets (GRESB PE Assessment named in §5), so the improvement plan is calibrated. The correct capital-weighted aggregation stays; only the inputs are grounded.

**Prerequisites.** EDCI KPI data collection (the protocol is standard but requires portfolio-company data entry); GRESB benchmark data; emissions wiring. **Acceptance:** each deal's ESG score decomposes into EDCI KPIs; carbon intensity traces to real emissions; improvement targets derive from a benchmark, not a flat +15; FES reproduces the capital-weighted formula.

### 9.2 Evolution B — LP-reporting copilot for fund managers (LLM tier 2)

**What.** A copilot for the PE/VC fund-manager users §1 targets: "what's my fund ESG score and how does it compare to GRESB?", "which portfolio companies drag the fund score down?", "aggregate CO2 avoided and jobs created across the portfolio", "draft the LP quarterly ESG report" — executed against the FES/impact/HHI engine, decomposing the capital-weighted score into per-company contributions.

**How.** Tool calls to endpoints wrapping FES, impact aggregation, and HHI; system prompt from this Atlas page's §5/§7.1 and the EDCI / GRESB / ILPA references named in §5 so LP-reporting conventions are followed. The LP report drafts the EDCI/GRESB-aligned sections with every figure a tool output; the fabrication validator matches all scores/tonnes/jobs to responses. The copilot correctly uses capital-weighted FES for the headline (not the simple mean) per convention, and cites HHI for concentration risk. Post-Evolution-A, per-company drill-downs decompose into EDCI KPIs.

**Prerequisites.** Compute endpoints; Evolution A for real EDCI-grounded company scores (the fund aggregation works today on demo data). **Acceptance:** every FES/impact/HHI figure traces to a tool call; the LP report uses capital-weighted FES; company drill-downs (post-Evolution-A) cite EDCI KPIs; impact totals sum from real per-deal metrics.