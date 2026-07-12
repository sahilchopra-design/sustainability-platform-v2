## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a **Composite ESG Profile Score**
> engine — `ESG_profile = 0.40×E + 0.35×S + 0.25×G` with a severity-weighted controversy penalty
> (Minor −1, Moderate −5, Severe −15). **The page computes no such composite.** `CompanyProfilesPage.jsx`
> is a **data-aggregation and display hub**: it renders *pre-sourced* ESG ratings (MSCI letter grade,
> Sustainalytics risk score, CDP letter grade, SBTi status, controversy level 1–5) straight from the
> `COMPANY_MASTER` dataset and an on-demand enrichment service. There is no 0.40/0.35/0.25 weighting and
> no controversy-point deduction anywhere in the code. The tier-A backend engine wired to this route
> (`peer_benchmark_engine.py`) is a *disclosure-gap* scorer for 20 financial institutions across 19
> frameworks — a different analytic from the issuer ESG composite the guide describes. Sections below
> document what the page and engine actually do; §8 specifies the composite the guide promises.

### 7.1 What the module computes

The page performs essentially no numeric modelling — it formats and displays. The only arithmetic is
cosmetic:

```js
fmt(n)    = n≥1e6 ? ₹(n/1e5)K Cr : n≥1e3 ? ₹(n/1e3)K Cr : ₹n Cr    // INR-crore formatter
pct       = min(100, max(0, score))                                 // clamp ESG bar to 0–100
pos       = range>0 ? (price − low52)/range × 100 : 50              // 52-week price position
totalMktCap = Σ market_cap_inr_cr ;  totalScope1 = Σ scope1_co2e    // universe roll-ups
```

Everything shown on a profile (ESG env/social/gov bars, CDP grade, MSCI rating, SBTi status,
controversy level, financials, Scope 1/2/3) is read from a company record, optionally overlaid with
values fetched at runtime by the **enrichment service** (EODHD / Alpha Vantage / BRSR-P6 sources), each
tagged with a `SourceBadge` and an `EnrichPill` completeness status (`idle/loading/partial/complete`).

The backend `peer_benchmark_engine.py` (route `company_profiles.py`) supplies a *separate* institutional
benchmark. Its scoring is a category-weighted average over 19 disclosure categories:
```python
_weighted_score(scores) = Σ scores[k]·weight[k] / Σ weight[k]      # 0–100
score_to_rag(s) = GREEN if s≥75 else AMBER if s≥50 else RED
```

### 7.2 Parameterisation / scoring rubric

**Frontend — displayed (not computed) fields, `COMPANY_MASTER` (80 Indian companies, FY2024):**

| Field | Example values | Provenance (per dataset header) |
|---|---|---|
| `msci_esg_rating` | AAA…CCC (e.g. BB, A) | MSCI ESG Ratings |
| `sustainalytics_risk` | 27–39 (lower = better) | Sustainalytics |
| `cdp_climate_score` | A–F (e.g. B−, C) | CDP India 2023 |
| `esg_controversy_level` | 1–5 | MSCI / RepRisk style |
| `sbti_committed` / `_classification` | bool / class | SBTi database |
| financials (`revenue_inr_cr`, `evic_inr_cr`…) | real | NSE/BSE, MCA21, annual reports |

**Backend engine — 19 framework category weights** (`FRAMEWORK_CATEGORIES`):

| Category (examples) | Weight | Basis |
|---|---|---|
| `esrs_e1` (Climate Change), `pcaf_financed`, `paris_alignment` | 2.0 | Highest materiality |
| `tcfd_strategy`, `tcfd_metrics`, `issb_s2`, `double_materiality`, `scope3_cat15`, `physical_risk`, `scenario_analysis`, `transition_plan` | 1.5 | Elevated |
| governance / other categories | 1.0 | Base |

RAG bands: GREEN ≥75, AMBER ≥50, RED <50. Institution scores (e.g. ING `esrs_e1: 88`, JPMorgan
`esrs_e1: 25`) are **analyst-assigned from public 2023/24 reports** — knowledge-based, not modelled.

### 7.3 Calculation walkthrough

- **Profile view:** user selects a company → `selected` record → bars call `EsgBar(score)` clamped to
  0–100; the 52-week price marker uses `pos`; source badges resolve via `SOURCE_META`.
- **Enrichment:** if the user has entered an EODHD/Alpha-Vantage key, `useEnrichment` fetches live
  fields, merges them into the profile with per-field `SourceBadge`, and sets an `enrichment_score` %.
- **Benchmark engine:** `get_heatmap`/`get_comparison_table` compute `_weighted_score` per institution
  and sort; `get_regional_averages` averages category scores per region then weights; `get_top_gaps`
  returns the lowest-scoring categories.

### 7.4 Worked example (benchmark engine)

Take JPMorgan's category scores. Multiply each by its weight and divide by total weight
(Σweight = 25.5 across the 19 categories). High-weight categories dominate: `esrs_e1=25` (×2.0=50),
`pcaf_financed=62` (×2.0=124), `paris_alignment=72` (×2.0=144), `tcfd_strategy=82` (×1.5=123). Summing
all weighted contributions and dividing by 25.5 yields a weighted average in the high-50s → **AMBER**
(≥50, <75). ING, with `esrs_e1=88`, `pcaf_financed=85`, `paris_alignment=90`, lands in the high-70s →
**GREEN**. This is the only place a score is *derived*; the frontend never runs this.

### 7.5 Companion analytics on the page

Profile tabs cover Overview (ESG bars, financials, market data), Controversy History, Engagement Log,
Peer Comparison, and export. The route exposes CRUD and pipeline endpoints:
`GET /company-profiles/`, `GET /{id}`, `POST /extract-from-reports`, `POST /seed-from-engine`,
`PUT /{id}` — i.e. profiles can be seeded from the benchmark engine or extracted from uploaded reports.

### 7.6 Data provenance & limitations

- **Frontend data is REAL, not synthetic** — 80 Indian companies sourced from SEBI BRSR Core P6 FY2024,
  NSE/BSE, MCA21, CDP India 2023, MSCI, Sustainalytics, SBTi, WRI Aqueduct, CBAM registry. No `sr()` PRNG.
- **Backend institution scores are analyst knowledge-based judgements** (2023/24 reporting cycle), not
  quantitatively derived — they encode expert assessment, so they carry analyst subjectivity and a
  point-in-time staleness risk.
- The guide's composite ESG score and controversy penalty are **not implemented**; displayed ESG grades
  are vendor outputs shown side-by-side, never blended into one number by this page.

**Framework alignment:** *MSCI ESG Ratings* (AAA–CCC industry-relative letter scale, weighting material
issues by exposure and management) and *Sustainalytics ESG Risk Ratings* (0–40+ unmanaged-risk score,
lower = better) are displayed as sourced. *CDP* (A–D− disclosure/performance across Climate/Water/Forests)
and *SBTi* (target validation vs 1.5 °C/WB2C pathways) statuses are shown verbatim. The engine implements
*TCFD* (4 pillars), *ISSB S1/S2*, *ESRS/CSRD* (incl. double materiality), *PCAF* financed emissions, and
*TNFD* as weighted disclosure-completeness categories with a RAG gate.

---

## 8 · Model Specification — Composite Issuer ESG Score with Controversy Overlay

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a single, comparable 0–100 issuer ESG score per company in `COMPANY_MASTER`, plus a
controversy-adjusted score, to drive engagement prioritisation, screening, and issuer-level risk
reporting. Coverage: all listed issuers with pillar-level inputs available.

### 8.2 Conceptual approach
Mirror the **MSCI ESG Ratings** key-issue weighting logic (material issues weighted by sector exposure)
and the **Sustainalytics** managed/unmanaged-risk decomposition, then apply a **RepRisk/MSCI-style
controversy overlay** as a bounded deduction. Blending multiple vendor signals into one score also
follows the **S&P Global CSA / Refinitiv** normalisation convention (min-max to a 0–100 industry-relative
scale before weighting).

### 8.3 Mathematical specification
```
E,S,G ∈ [0,100]  (pillar scores, industry-relative)
Composite₀ = 0.40·E + 0.35·S + 0.25·G                    (guide weights; sector-tunable)
Penalty    = Σ_c pen(sev_c),  pen: Minor→1, Moderate→5, Severe→15
Composite  = clamp( Composite₀ − Penalty , 0 , 100 )
Vendor blend (optional):  E = w_m·norm(MSCI) + w_s·norm(100−Sustainalytics) + w_c·norm(CDP)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Pillar weights | 0.40/0.35/0.25 | Guide default; tune per GICS via MSCI key-issue exposure |
| Controversy points | 1/5/15 | Guide severity map (align to MSCI 0–10 controversy flag) |
| Vendor norm | `norm()` | Min-max within GICS sector (industry-relative) |
| Vendor weights | `w_m,w_s,w_c` | Backtest against forward ESG-incident frequency |

### 8.4 Data requirements
Per issuer: pillar E/S/G scores (or vendor grades to normalise), active controversy list with severity,
GICS sector for industry-relative normalisation. All exist in `COMPANY_MASTER`
(`msci_esg_rating`, `sustainalytics_risk`, `cdp_climate_score`, `esg_controversy_level`, `sector`) — the
missing pieces are the letter→numeric maps and the sector-relative normalisation table. RepRisk/MSCI
controversy feeds would supply time-stamped severity for the penalty.

### 8.5 Validation & benchmarking plan
Reconcile composite ranks against published MSCI letter grades and Sustainalytics deciles (target Spearman
ρ > 0.7 within sector). Backtest whether low composite / high penalty predicts subsequent controversy or
rating downgrade. Stability-test the vendor blend under one-vendor dropout. Sensitivity on pillar weights.

### 8.6 Limitations & model risk
Vendor disagreement is large (MSCI–Sustainalytics correlation is famously ~0.3–0.5), so a naïve blend can
mask genuine signal divergence — report vendor spread alongside the composite. Controversy penalties are
discontinuous; a decayed penalty (half-life 18–36 months, per the `controversy-materiality` module) is
more defensible. Conservative fallback: display the three vendor grades unblended (the current behaviour)
when normalisation inputs are incomplete.
