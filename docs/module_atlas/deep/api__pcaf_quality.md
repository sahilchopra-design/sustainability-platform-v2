## 7 · Methodology Deep Dive

The `pcaf_quality` domain (`/api/v1/pcaf-quality`) is a **PCAF Data Quality Score engine**
(`pcaf_quality_engine.py`) that scores holdings across five quality dimensions, aggregates
exposure-weighted portfolio DQS, computes SFDR PAI indicators, and maps PCAF outputs to eight
regulatory/voluntary frameworks. The route file exposes reference data (`/ref/*`); the engine
holds the scoring logic.

### 7.1 What the module computes

Per holding, a `weighted_dqs` (1 best … 5 worst) is the dimension-weighted mean of five
sub-scores, plus a confidence weight, estimated + financed emissions, data gaps and
improvement actions:

```
weighted_dqs = 0.35·emissions + 0.25·completeness + 0.15·timeliness
             + 0.15·granularity + 0.10·methodology
financed_emissions = estimated_emissions × attribution_factor
```

Portfolio-level: exposure-weighted DQS, DQS 1-5 distribution, per-asset-class breakdown,
carbon intensity, SFDR PAI 1/2/3, and a quality-improvement roadmap.

### 7.2 Parameterisation / scoring rubric

**Quality dimensions & weights** (`PCAF_QUALITY_DIMENSIONS`, sum = 1.0): emissions data
quality 0.35, completeness 0.25, timeliness 0.15, granularity 0.15, methodology 0.10.

**DQS levels** (`PCAF_DQS_LEVELS`) — confidence weight and typical uncertainty per level:

| DQS | Label | Confidence | Uncertainty |
|---|---|---|---|
| 1 | Audited emissions | 1.0 | 5% |
| 2 | Unaudited reported | 0.8 | 15% |
| 3 | Physical-activity estimate | 0.6 | 30% |
| 4 | Economic-activity estimate | 0.4 | 45% |
| 5 | Sector-average proxy | 0.2 | 60% |

**Emission factors** (`PCAF_EMISSION_FACTORS`, tCO₂e/€M revenue by NACE section, source PCAF
DB 2023 / Eurostat / EEA): D (electricity) S1 1450; B (mining) 680; A (agri) 520; K (finance)
8. **Attribution methods** (`PCAF_ATTRIBUTION_METHODS`): EVIC, balance-sheet (equity+debt),
project-level pro-rata, floor-area. **Sector-median DQS benchmarks**
(`PCAF_QUALITY_BENCHMARKS`, 2024): Real-estate 2.8, Asset-mgmt 3.2, Insurance 4.0,
Private-equity 4.1 — for peer comparison.

### 7.3 Calculation walkthrough

`score_holding` scores each dimension via `_score_emissions_quality` (verified→low DQS),
`_score_completeness` (Scope coverage), `_score_timeliness` (data lag vs reporting year),
`_score_granularity`, `_score_methodology`. The five combine by the weight vector →
`weighted_dqs`; `_dqs_to_confidence` inverts to a confidence weight; `_estimate_emissions`
uses reported data if present else `sector_ef × revenue` (or outstanding for DQS 5);
`_compute_attribution` builds the asset-class attribution factor; `financed = estimated ×
attribution`.

`score_portfolio` scores each holding, then computes **exposure-weighted** portfolio DQS
`Σ(dqs·outstanding)/Σ outstanding`, DQS distribution buckets (rounding each holding's
weighted_dqs to 1-5), carbon intensity `total_financed / (total_outstanding/1e6)`, and
per-asset-class averages. SFDR PAI 1 = total financed emissions, PAI 2 = total/AUM, PAI 3 =
weighted intensity.

### 7.4 Worked example

Holding: business loan, `outstanding = €10M`, unaudited reported Scope 1+2 = 5,000 tCO₂e
(no Scope 3), data year = reporting year, NACE C, balance-sheet total €200M.

- **Dimension DQS** (illustrative): emissions 2 (reported, unverified), completeness 3
  (Scope 3 missing), timeliness 1 (current), granularity 2, methodology 2.
- **Weighted DQS:** `0.35·2 + 0.25·3 + 0.15·1 + 0.15·2 + 0.10·2 = 0.70+0.75+0.15+0.30+0.20 =
  2.10`.
- **Confidence:** DQS≈2 → ~0.8.
- **Attribution (balance sheet):** `af = 10 / 200 = 0.05`.
- **Financed:** `5,000 · 0.05 = 250 tCO₂e`.
- **Carbon intensity:** `250 / (10) = 25 tCO₂e/€M outstanding`.

At the portfolio level, a book of this holding would show `portfolio_wdqs ≈ 2.10` — better
than the commercial-banking benchmark median of 3.8.

### 7.5 Cross-framework disclosure map

`PCAF_CROSS_FRAMEWORK_MAP` documents 10 data flows: PCAF total → **SFDR PAI 1**; footprint →
PAI 2; WACI → PAI 3; asset-class emissions → **CSRD ESRS E1-6** (Scope 3 Cat 15); → **TCFD**
Metrics & Targets; → **IFRS S2** para 29(a)(vi); → **GRI 305-3**; outstanding → **EU Taxonomy
GAR** denominator; DQS distribution → **CDP C-FS14**; baseline → **NZBA** sectoral targets.

### 7.6 Data provenance & limitations

- Emission factors and DQS benchmarks are **cited public reference tables** (PCAF DB 2023,
  Eurostat, EEA, CRREM) as constants; benchmark sample sizes (n = 12-50) are illustrative
  peer panels, not a live survey.
- **No `sr()` fabrication** — emissions are either reported or estimated by transparent
  sector-factor formulas.
- Dimension sub-scoring uses heuristic thresholds on data presence/recency, a simplification
  of a full PCAF quality audit.

**Framework alignment:** **PCAF Global GHG Accounting Standard v2.0 (Nov 2022)** — the DQS 1-5
hierarchy, five quality dimensions and attribution methods implement the standard directly.
**SFDR RTS Annex I** — PAI 1/2/3 are computed from the portfolio roll-up. **CSRD ESRS E1-6**,
**IFRS S2**, **GRI 305-3**, **TCFD**, **EU Taxonomy GAR** and **NZBA** consume PCAF outputs
per the documented cross-framework map.
