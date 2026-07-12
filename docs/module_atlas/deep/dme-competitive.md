## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry describes a **Relative Materiality Index**
> (`RMI = Entity Scoreᵢ / Sector Median Scoreᵢ × 100`) benchmarking *topic-level materiality* against a
> peer cohort of 47 companies, with a topic heat-map (highest RMI "Water Stress 162", lowest "Digital
> Rights 54"). **No RMI, no topic-level materiality, and no water/digital-rights topics exist in the
> code.** What the page actually computes is a **five-dimension ESG competitive percentile score** over
> the `GLOBAL_COMPANY_MASTER` universe: percentile ranks for ESG, carbon efficiency, transition
> readiness, governance and data quality, blended into one composite and mapped to synthetic MSCI /
> Sustainalytics / S&P ratings. The sections below document the code as it actually behaves.

### 7.1 What the module computes

For every company in `GLOBAL_COMPANY_MASTER`, the page derives a **composite competitive score** from
percentile ranks *within the company's own sector cohort* (`sectorPeers = master.filter(sector === selected.sector)`):

```js
composite = round(
    esgPercentile        × 0.30
  + carbonPercentile     × 0.25
  + transitionPercentile × 0.20
  + govPercentile        × 0.15
  + dqPercentile         × 0.10 )
```

Each percentile uses a mid-rank empirical CDF:

```js
percentileRank(values, target):
   below = count(v < target); equal = count(v === target)
   return round( ((below + 0.5·equal) / n) × 100 )      // 50 if n = 0
```

The five inputs are:

| Dimension | Rank basis | Note |
|---|---|---|
| ESG | `percentileRank(peers.esg_score, esg_score)` | higher raw score → higher rank |
| Carbon efficiency | `percentileRank(1/ghg_intensity, 1/own_ghg)` | **inverts** intensity so low emitters rank high |
| Transition readiness | `percentileRank(100 − transition_risk, …)` | inverts risk so low-risk ranks high |
| Governance | `(esg_score/100)×100` | **not a percentile** — raw ESG rescaled to 0–100 (proxy) |
| Data quality | `data_quality_score` | raw 0–100 field passed straight through |

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| Composite weights | 0.30 / 0.25 / 0.20 / 0.15 / 0.10 | Hard-coded heuristic ("ported from dme-platform"); not a named standard |
| ESG rating cutoffs | AAA ≥80, AA ≥65, A ≥50, BBB ≥35, BB ≥25, B ≥15, else CCC | `estimateRatings()`; mirrors MSCI 7-notch letter scale but thresholds are invented |
| Sustainalytics band | Negligible ≥80, Low ≥60, Medium ≥40, High ≥20, else Severe | mirrors Sustainalytics 5-band risk categories (inverted sense) |
| S&P Global band | Strong ≥70, Average ≥45, else Laggard | heuristic |

**Synthetic enrichment** — where a company lacks a field, `enrichCompany()` fabricates it with the
string-hash PRNG `sRand(n)=frac(sin(n+1)×10⁴)` seeded by `seed(name)` (djb2/xor hash):

| Field | Fallback range |
|---|---|
| `esg_score` | 25 + rand·65 → 25–90 |
| `ghg_intensity_tco2e_per_mn` | 10 + rand·800 |
| `transition_risk_score` | 10 + rand·70 |
| `data_quality_score` | 20 + rand·70 |
| `implied_temp_rise` | clamp(1.2 + rand·2.8, 1.2, 4.5) °C |
| `market_cap_usd_mn` | 100 + rand·50 000 |

### 7.3 Calculation walkthrough

1. User selects a company (default index 0) from the search-filtered list.
2. `sectorPeers` = all master rows sharing the selected sector.
3. `computeCompetitiveScore(selected, sectorPeers)` → five ranks + composite.
4. `allPeerScores` scores every peer the same way → drives the ranked table, quartile analysis,
   peer distribution histogram (5 buckets 0–20…81–100), and carbon-vs-ESG scatter.
5. `estimateRatings(composite)` → letter/band ratings.
6. `sectorStats` (avg/median/std of composite across peers) and a Pearson correlation between any two
   selectable dimensions (`num/√(denA·denB)`) provide companion analytics.
7. A 3-point "trend" history is faked: `prev = clamp(composite − 5 + round(sRand(s)·10), 5, 95)`.

### 7.4 Worked example

Company with `esg_score = 72`, in a 6-firm sector cohort whose ESG scores are {40, 55, 60, 72, 80, 85};
`ghg_intensity = 120`; `transition_risk = 30`; `data_quality_score = 65`.

| Step | Computation | Result |
|---|---|---|
| ESG percentile | below=3, equal=1 → (3+0.5)/6×100 | **58** |
| Carbon percentile (assume 4 peers dirtier) | e.g. below 4 of 6 on 1/intensity | **75** |
| Transition percentile (assume mid) | (100−30) ranks 4/6 below | **67** |
| Governance proxy | 72/100×100 | **72** |
| Data quality | raw | **65** |
| Composite | 58·.30+75·.25+67·.20+72·.15+65·.10 | 17.4+18.75+13.4+10.8+6.5 = **66.85 → 67** |
| Rating | 67 ≥ 65 → AA; Low; Average | **AA / Low / Average** |

### 7.5 Companion analytics on the page

- **Radar** — company vs sector-median across the five dimensions (median carbon rank derived from the
  mean-intensity percentile; transition/governance/dataQuality medians hard-set to 50).
- **Gap analysis** — company rank vs sector-leader rank per dimension.
- **Quartile analysis / peer distribution** — composite sorted desc, `selectedRank` = 1-based position.
- **Cross-sector comparison** — re-scores the selected company against a *different* sector's cohort.
- **CSV export** of the full ranked peer table.

### 7.6 Data provenance & limitations

- The universe is `GLOBAL_COMPANY_MASTER`; any missing ESG/carbon/governance field is **synthetic**,
  produced by the seeded PRNG `sRand`. Ratings are heuristic mappings, **not** licensed MSCI /
  Sustainalytics / S&P outputs.
- "Governance" is not an independent signal — it is `esg_score` rescaled, so it is collinear with the
  ESG dimension (double-counts 30%+15% of the same field).
- No topic-level materiality, no RMI, no double-materiality — the guide's methodology is unimplemented.
- Percentiles are computed *within sector*, so a small cohort (n<5) yields coarse, unstable ranks.

**Framework alignment:** loosely mirrors **MSCI ESG Ratings** (industry-relative, best-in-class
percentile logic → 7-notch AAA–CCC letters, where MSCI actually weights key-issue scores by exposure and
management), **Sustainalytics ESG Risk Ratings** (5-band Negligible→Severe unmanaged-risk scale), and
**S&P Global CSA** percentile positioning. The code approximates the *shape* (industry-relative
percentile → letter) but not the underlying key-issue scoring any of those vendors run.

---

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible, industry-relative ESG competitiveness score for each issuer in the coverage
universe, supporting portfolio tilt decisions and issuer engagement. Coverage: all listed equities in
`GLOBAL_COMPANY_MASTER`, grouped by GICS sub-industry.

### 8.2 Conceptual approach
A **key-issue exposure-and-management model** in the style of **MSCI ESG Ratings** and **S&P Global
CSA**, replacing the flat 5-weight heuristic. Each issuer's score is a sector-calibrated,
exposure-weighted roll-up of underlying key-issue scores, then converted to an industry percentile and
letter. Benchmarks: MSCI ESG (exposure × management, industry-adjusted) and Sustainalytics (unmanaged
risk = exposure − management).

### 8.3 Mathematical specification
For issuer *i* in sector *s* with key issues *k* ∈ K(s):

```
KeyIssueScoreᵢₖ = Expₖ · (Mgmtᵢₖ − Riskₖ_baseline) ,  Expₖ ∈ [0,1] sector exposure weight
RawᵢS           = Σₖ wₖ(s) · KeyIssueScoreᵢₖ ,          Σₖ wₖ(s) = 1
Percentileᵢ     = empiricalCDF_s(RawᵢS)               (within-sector, mid-rank)
Letterᵢ         = notch(Percentileᵢ)  (AAA…CCC on fixed cutoffs)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Sector key-issue weights | `wₖ(s)` | SASB materiality map (industry-specific) |
| Exposure weights | `Expₖ` | Revenue-segment / asset-location data (Trucost, FactSet RBICS) |
| Management scores | `Mgmtᵢₖ` | CDP responses, policy disclosure, controversy feeds |
| Baseline risk | `Riskₖ_baseline` | Sector mean from prior-year universe |
| Letter cutoffs | — | MSCI-published AAA–CCC percentile bands |

### 8.4 Data requirements
Per-issuer key-issue exposures (revenue segmentation), management indicators (CDP, policies,
controversies), GHG intensity (Scope 1–3), governance metrics (board independence, pay). Free sources:
CDP public scores, company filings, EU Taxonomy alignment. Vendor: MSCI, Sustainalytics, Trucost. The
platform already holds `esg_score`, `ghg_intensity`, `transition_risk_score`, `data_quality_score` and
`reference_data` (SBTi, CDP) that can seed exposure and management proxies.

### 8.5 Validation & benchmarking plan
Rank-correlation (Spearman ρ) of composite vs licensed MSCI/Sustainalytics letters on the overlap
universe; target ρ ≥ 0.6. Stability test: quarter-on-quarter notch migration should be <10% absent real
events. Sensitivity: perturb each `wₖ` ±20% and confirm rank order is robust.

### 8.6 Limitations & model risk
Percentile scores are only as good as sector definition and cohort size; thin cohorts (n<10) need a
sector-group fallback. Management-minus-exposure logic is vulnerable to disclosure bias (well-disclosed
firms score higher regardless of performance). Conservative fallback: where key-issue data is missing,
default to sector median (percentile 50), never to a favourable value.
