# Company Profiles
**Module ID:** `company-profiles` · **Route:** `/company-profiles` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides comprehensive ESG company profiles aggregating ESG scores, controversy flags, CDP disclosure status, board composition, SBTi commitment status, and historical engagement notes across thousands of investee companies. Serves as the central data hub for issuer-level ESG intelligence across the platform.

> **Business value:** Provides portfolio managers, ESG analysts, and engagement teams with a single authoritative view of each investee company’s ESG posture, enabling informed engagement prioritisation, proxy voting decisions, and issuer-level risk reporting.

**How an analyst works this module:**
- Search or select a company from the universe browser
- Overview tab shows composite ESG score, key metrics, and trend over 5 years
- Controversy History tab lists all flagged incidents with severity, status, and remediation
- Engagement Log tab allows recording and viewing investor engagement interactions
- Peer Comparison tab benchmarks the company against GICS sector peers
- Export full profile as PDF or JSON for CRM or investment committee integration

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CompletenessMeter`, `DQS_COLOR`, `DataSourceConfig`, `EnrichPill`, `EsgBar`, `ManualDataEntry`, `RISK_COLOR`, `Row`, `SECTOR_COLOR`, `Section`, `SourceBadge`, `Spinner`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `n => n == null ? '—' : n >= 1e6 ? `₹${(n/1e5).toFixed(0)}K Cr` : n >= 1000 ? `₹${(n/1000).toFixed(1)}K Cr` : `₹${n} Cr`;` |
| `fmtCO2` | `n => n == null ? '—' : n >= 1e6 ? `${(n/1e6).toFixed(2)}M tCO₂e` : n >= 1000 ? `${(n/1000).toFixed(0)}K tCO₂e` : `${n} tCO₂e`;` |
| `pct` | `Math.min(100, Math.max(0, score));` |
| `dir` | `sortDir === 'desc' ? -1 : 1;` |
| `totalMktCap` | `COMPANY_MASTER.reduce((s, c) => s + (c.market_cap_inr_cr \|\| 0), 0);` |
| `totalScope1` | `COMPANY_MASTER.reduce((s, c) => s + (c.scope1_co2e \|\| 0), 0);` |
| `range` | `selected.week52_high_inr - selected.week52_low_inr;` |
| `pos` | `range > 0 ? ((selected.stock_price_inr - selected.week52_low_inr) / range) * 100 : 50;` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/company-profiles/` | `list_profiles` | api/v1/routes/company_profiles.py |
| GET | `/api/v1/company-profiles/{profile_id}` | `get_profile` | api/v1/routes/company_profiles.py |
| POST | `/api/v1/company-profiles/extract-from-reports` | `extract_from_reports` | api/v1/routes/company_profiles.py |
| POST | `/api/v1/company-profiles/seed-from-engine` | `seed_from_engine` | api/v1/routes/company_profiles.py |
| PUT | `/api/v1/company-profiles/{profile_id}` | `update_profile` | api/v1/routes/company_profiles.py |

### 2.3 Engine `peer_benchmark_engine` (services/peer_benchmark_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `score_to_rag` | score |  |
| `PeerBenchmarkEngine._weighted_score` | scores |  |
| `PeerBenchmarkEngine._group_scores` | scores |  |
| `PeerBenchmarkEngine.get_all_institutions` |  |  |
| `PeerBenchmarkEngine.get_institution` | slug |  |
| `PeerBenchmarkEngine.get_comparison_table` | slugs, region, institution_type |  |
| `PeerBenchmarkEngine.get_heatmap` | slugs |  |
| `PeerBenchmarkEngine.get_regional_averages` |  |  |
| `PeerBenchmarkEngine.get_framework_coverage` |  | Which institutions have which mandatory / voluntary frameworks. |
| `PeerBenchmarkEngine.get_top_gaps` | slug, top_n |  |
| `PeerBenchmarkEngine._to_summary` | inst |  |
| `PeerBenchmarkEngine._to_comparison_row` | inst |  |
| `PeerBenchmarkEngine._to_detail` | inst |  |

**Engine `peer_benchmark_engine` — reference constants / scoring weights:**

| Constant | Value |
|---|---|
| `RAG_GREEN` | `75` |
| `RAG_AMBER` | `50` |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CSRD`, `__future__` *(shared)*, `company_profiles`, `csrd_entity_registry`, `csrd_kpi_values`, `cursor`, `datetime` *(shared)*, `db` *(shared)*, `dict`, `fastapi` *(shared)*, `mapped`, `one`, `peer` *(shared)*, `peer_benchmark_engine`, `processed`, `real`, `registry`, `services` *(shared)*, `set_clauses`, `specific`
**Shared context buses:** `CompanyEnrichmentContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Score | — | MSCI / Sustainalytics | Composite ESG rating; 70+ = Leader, 50–70 = Average, <50 = Laggard |
| Controversy Severity | — | RepRisk / MSCI | Peak controversy severity in past 36 months; 5 = most severe category |
| SBTi Status | — | SBTi Database | Status of company’s science-based emissions reduction target |
| CDP Score | — | CDP | Disclosure and performance score across Climate, Water, and Forest questionnaires |
| Board Independence | — | Company proxy filings | Percentage of board members classified as independent non-executive directors |
- **MSCI/Sustainalytics ESG data feeds** → Normalise scores to 0–100 scale, apply controversy penalty → **Composite ESG score per issuer**
- **RepRisk/GRI controversy database** → Classify by severity, map to SASB materiality topics → **Controversy log per company**
- **SBTi and CDP public databases** → Match by LEI/ISIN, extract status and score → **SBTi status and CDP score per issuer**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/company-profiles/** — status `passed`, provenance ['real-db'], source tables: `company_profiles`
Output: `{'type': 'object', 'keys': ['profiles', 'total', 'limit', 'offset'], 'n_keys': 4}`

**GET /api/v1/company-profiles/{profile_id}** — status `failed`, provenance ['db-empty'], source tables: `company_profiles`
Output: `None`

**POST /api/v1/company-profiles/extract-from-reports** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/company-profiles/seed-from-engine** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PUT /api/v1/company-profiles/{profile_id}** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Composite ESG Profile Score
**Headline formula:** `ESG_profile = 0.40×E_score + 0.35×S_score + 0.25×G_score`

Environmental score integrates carbon intensity, energy mix, water risk, and biodiversity exposure. Social score covers labour practices, supply chain standards, community impact, and product safety. Governance score reflects board independence, audit quality, remuneration alignment, and shareholder rights. Controversy adjustment: each active controversy reduces composite by severity-weighted penalty (Minor: −1, Moderate: −5, Severe: −15 points).

**Standards:** ['MSCI ESG Methodology', 'SASB Standards', 'GRI Universal Standards']
**Reference documents:** MSCI ESG Ratings Methodology 2024; SASB Industry Standards; GRI Universal Standards 2021; CDP Technical Notes â€” Disclosure and Scoring; SBTi Target Dashboard

**Engine `peer_benchmark_engine` — extracted transformation lines:**
```python
avg_scores[cat_key] = round(sum(vals) / len(vals), 1)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **53** other module(s).

| Connected module | Shared via |
|---|---|
| `nature-capital-accounting` | table:peer |
| `carbon-market-intelligence` | table:sqlalchemy |
| `reference-data-explorer` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `geothermal-market-intelligence` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |
| `carbon-footprint-intelligence` | table:sqlalchemy |
| `carbon-reduction-projects` | table:sqlalchemy |

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

## 9 · Future Evolution

### 9.1 Evolution A — Compute the composite, fix the broken profile fetch, widen the universe (analytics ladder: rung 1 → 3)

**What.** This hub's data is unusually real — 80 Indian companies from SEBI BRSR Core
P6, NSE/BSE, CDP, MSCI, Sustainalytics, SBTi, no PRNG anywhere (§7.6) — but §7 flags
that the advertised composite (`ESG_profile = 0.40×E + 0.35×S + 0.25×G` with −1/−5/−15
controversy penalties) is never computed: vendor grades are displayed side-by-side,
never blended. And the harness shows `GET /company-profiles/{profile_id}` status
`failed` — the single-profile fetch, the module's core read path, is broken. With a
blast radius of 53 modules, this hub deserves the investment.

**How.** (1) Fix the failed `GET /{profile_id}` first (likely the same class of live
500 found in the deployment-prep sweep — NULL fields or wrong column). (2) Composite
engine: compute E/S/G sub-scores from the *underlying* real fields (carbon intensity,
board metrics, BRSR indicators) rather than blending vendor letter grades — with the
0.40/0.35/0.25 weights and controversy penalty applied per the guide, and the method
documented per Atlas §8 so the platform score is never confused with MSCI's.
(3) Benchmarked (rung 3): percentile the composite within GICS peers using the
existing `peer_benchmark_engine` pattern; cross-validate rank ordering against the
displayed vendor ratings and report the correlation honestly. (4) Universe widening:
seed non-Indian issuers through `POST /seed-from-engine` and the GLEIF entity spine
(`entity_lei` now populated), so the 53 dependent modules get global coverage.

**Prerequisites (hard).** The `{profile_id}` fix; agreement that the platform
composite is clearly labelled as such alongside vendor scores. **Acceptance:**
`GET /{profile_id}` passes the lineage sweep; the composite reproduces by hand for one
issuer; a controversy status change moves the composite by exactly its documented
penalty.

### 9.2 Evolution B — Issuer-intelligence copilot with extraction pipeline (LLM tier 2)

**What.** The route already exposes `POST /extract-from-reports` — an LLM-shaped
endpoint waiting for an LLM. Evolution B makes this hub the platform's issuer Q&A
surface: "summarize Company X's ESG posture and open engagement items" reads the
profile via `GET /{profile_id}`, cites the vendor ratings verbatim with their
`SourceBadge` provenance, and pulls engagement-log history; "ingest this annual
report" drives the extraction pipeline, mapping report claims to profile fields with
page-level citations and writing via `PUT /{profile_id}` only after user confirmation
(mutation gating per the roadmap's tier-2 contract).

**How.** Tool schemas from the 5 existing operations — this module needs almost no new
backend for tier 2, which is why it should be an early pilot. Grounding: §7.2's field
provenance table so the copilot always attributes ratings to their vendor and never
presents an MSCI grade as a platform judgment; the enrichment service's
`EnrichPill` completeness state tells the copilot what it doesn't know. The
no-fabrication validator checks numerics against the profile payload.

**Prerequisites (hard).** Evolution A's `{profile_id}` fix (the copilot's primary tool
currently 500s); RBAC pass-through for the `PUT` path. **Acceptance:** an issuer
summary where every rating carries its source attribution; extraction proposals show
report page references and require explicit confirmation before write; questions about
issuers not in the universe return "no profile" rather than a generic sketch.