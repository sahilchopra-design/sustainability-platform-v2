# GRESB Real Assets ESG
**Module ID:** `gresb-real-assets-esg` · **Route:** `/gresb-real-assets-esg` · **Tier:** B (frontend-computed) · **EP code:** EP-EI5 · **Sprint:** EI

## 1 · Overview
GRESB real assets benchmarking analytics: 20-fund scorecard with Management/Performance scores and star ratings, sort controls, 8-year trend (2017–2024), best practice adoption rates, and 6 institutional investor GRESB requirements (APG/CPPIB/CalPERS/PGGM/USS/Aware Super).

> **Business value:** Used by real estate fund managers optimising GRESB scores for capital access, institutional investors screening fund allocations, and ESG consultants advising on best-practice adoption.

**How an analyst works this module:**
- Review 20-fund scorecard sorting by GRESB score, management, performance, certification %, or energy intensity
- Analyse 8-year score trends and top-quartile threshold evolution 2017–2024
- Examine best practice adoption rates with leader examples and gap to best practice
- Review 6 institutional investor GRESB requirements and minimum star ratings for capital allocation

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BEST_PRACTICE`, `FUNDS`, `GRESB_COMPONENTS`, `KpiCard`, `Pill`, `TABS`, `TREND_DATA`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `GRESB_COMPONENTS` | 3 | `weight`, `description` |
| `BEST_PRACTICE` | 7 | `adoption`, `leader` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sorted` | `useMemo(() => [...FUNDS].sort((a, b) => b[sort] - a[sort]), [sort]);` |
| `kpis` | `useMemo(() => ({ avgScore: Math.round(FUNDS.reduce((a, f) => a + f.gresbScore, 0) / FUNDS.length), topQuartile: FUNDS.filter(f => f.benchmark === 'Top Quartile').length, avgEnergy: Math.round(FUNDS.reduce((a, f) => a + f.energyIntensity, 0) / FUNDS.length), avgCertPct: Math.round(FUNDS.reduce((a, f) => a + f.certPct, 0) / FUNDS.length), }` |
| `vals` | `[...col.data].map(f => f[col.key]);` |
| `min` | `Math.min(...vals), max = Math.max(...vals), avg = Math.round(vals.reduce((a, v) => a + v, 0) / vals.length);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BEST_PRACTICE`, `GRESB_COMPONENTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| GRESB 5-Star threshold (2024) | `Score out of 100 for top quintile` | GRESB 2024 Benchmark Report | Average diversified fund score ~64; 5-star requires top 20% of peer benchmark; energy intensity and GHG data quality most impactful. |
| APG GRESB minimum | `Minimum GRESB rating for new capital allocation` | APG Responsible Investment Policy 2023 | APG manages €550Bn; requires minimum GRESB 3-star for real assets; 4+ star preferred; exclusion below 2-star. |
| GRESB Green Certification weight | `Of total Performance score` | GRESB Real Estate Scoring Methodology 2024 | Certification evidence (LEED/BREEAM/ENERGY STAR) now worth 15% of score; quality of certification matters (Platinum > Gold). |
- **GRESB 2024 Scoring Methodology + APG/CPPIB/CalPERS/PGGM/USS/Aware Super requirements + CBI CMBS Standard** → Fund benchmark + score breakdown + trend analysis + best practice + investor requirements → **Real estate fund managers, institutional investors, ESG consultants, and sustainability-linked loan structurers**

## 5 · Intermediate Transformation Logic
**Methodology:** GRESB Total Score
**Headline formula:** `GRESB_Total = 0.30 × Management + 0.70 × Performance; Star_Rating = Quintile(Fund_Score, Benchmark_Universe); Quartile_Rank = PercentileRank(Score, peers)`

GRESB scores are split 30% Management (policies, processes) / 70% Performance (energy, GHG, water, waste, certifications); 5-star = top quintile.

**Standards:** ['GRESB Real Estate Assessment 2024', 'GRESB Scoring Methodology 2024', 'PRI Real Estate ESG Requirements']
**Reference documents:** GRESB (2024) – Real Estate Assessment Scoring Methodology; APG (2023) – Responsible Investment Policy for Real Assets; CalPERS (2023) – Sustainable Investment Program Real Assets

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide (EP-EI5) states GRESB Total = `0.30×Management + 0.70×Performance`
> with quintile star ratings and percentile quartile ranks. The page **displays** the 30/70 split and
> star ratings, but does not *compute* them from Management + Performance — each fund's `gresbScore`,
> `management`, `performance`, `starRating` and `benchmark` are independent `sr()` PRNG draws, so they
> do not satisfy `score = 0.3×mgmt + 0.7×perf`. It is a benchmarking dashboard over synthetic fund data.

### 7.1 What the module computes

20 funds are generated by the seeded PRNG (`sr(seed)=frac(sin(seed+1)×10⁴)`):

```js
gresbScore    = round(55 + sr(i×13)×45)      // 55–100
management    = round(18 + sr(i×17)×12)      // 18–30 (out of 30 weight)
performance   = round(37 + sr(i×23)×33)      // 37–70 (out of 70 weight)
starRating    = clamp(1,5, round(1 + sr(i×29)×4))
energyIntensity = round(80 + sr(i×37)×220)   // kWh/m²
ghgIntensity  = round(15 + sr(i×41)×85)      // kgCO₂/m²
certPct       = round(20 + sr(i×47)×75)      // % green-certified stock
```

Portfolio KPIs are honest aggregates of these seeded values:
```js
avgScore   = round(mean(gresbScore))
topQuartile= count(benchmark === 'Top Quartile')
avgEnergy  = round(mean(energyIntensity))
avgCertPct = round(mean(certPct))
```

### 7.2 Parameterisation

`GRESB_COMPONENTS` encodes the real GRESB structure: **Management 30% / Performance 70%** (GRESB Real
Estate Assessment 2024). `TREND_DATA` (2017–2024) hard-codes a rising benchmark: participants
850→1,515, avg score 58→82.5, top-quartile threshold 75→92.5 — matching the guide's note that the
5-star threshold is ≈81+ and average diversified funds ≈64. `BEST_PRACTICE` (6 rows) carries real
adoption estimates and named leaders (Net-Zero target 68%, Renewable procurement 72%, Biodiversity
reporting only 28%). Fund names (Brookfield, Prologis, Hines…) are real managers with seeded scores.

### 7.3 Calculation walkthrough

The scorecard sorts 20 funds by the selected metric. Score-breakdown plots management vs performance.
Trend analysis renders the 8-year series. ESG-indicators tab shows energy/GHG/water intensity and
cert %. Best-practice and investor-requirements (APG/CPPIB/CalPERS/PGGM/USS/Aware Super minimum star
ratings) are static reference tables.

### 7.4 Worked example (portfolio KPIs)

If the 20 seeded `gresbScore` values average to 78 and 6 funds carry `benchmark = 'Top Quartile'`:

```
avgScore    = round(mean) = 78
topQuartile = 6 funds
avgCertPct  = round(mean(certPct))   e.g. 57%
```

A fund at gresbScore 88 with starRating 5 sits above the 2024 top-quartile threshold (≈81+),
consistent with 5-star = top quintile — but note the star rating is drawn independently, so a
5-star label can coincide with a below-threshold score in this demo.

### 7.5 Data provenance & limitations

- **All 20 funds' scores are synthetic** (`sr()` PRNG); only the component weights, trend series and
  best-practice adoption figures reflect real GRESB structure/estimates.
- The 30/70 split and star ratings are **displayed but not enforced** — the seeded `management`,
  `performance` and `gresbScore` are not linked by the GRESB formula.
- Star rating here is a per-fund draw, not a quintile of the fund's peer benchmark universe (the
  companion `gresb-scoring` module *does* implement the peer-quintile method).

### 7.6 Framework alignment

**GRESB Real Estate Assessment 2024** — Management (policies, leadership, risk, stakeholder) weighted
30%, Performance (energy, GHG, water, waste, certifications) 70%; the page encodes this split.
**GRESB star rating** — 5-star = top quintile within the peer benchmark; the platform's real
implementation lives in `gresb-scoring`. **CRREM** — the EUI/GHG intensity metrics feed 1.5 °C
building pathways (referenced in best practice). **PRI Real Estate ESG** — the investor-requirement
minimums (APG 3-star floor, exclusion below 2-star) reflect real allocator policies.

*(No §8 model spec required: GRESB scoring is a defined third-party methodology, not a bespoke risk
model — the platform's actual scoring engine is documented in `gresb-scoring.md`. This module is a
benchmarking view whose only quantities are transparent means over seeded fund data, caveated above.)*

## 9 · Future Evolution

### 9.1 Evolution A — Enforce the GRESB 30/70 formula and real peer-quintile star ratings (analytics ladder: rung 1 → 2)

**What.** §7 flags that the displayed scores don't satisfy `score = 0.3×mgmt + 0.7×perf` — the 20 funds' `management`, `performance`, and `gresbScore` are independent `sr()` draws not linked by the GRESB formula, and the star rating is a per-fund random draw rather than a quintile of the fund's peer benchmark universe; only the component weights, trend series, and best-practice figures reflect real GRESB structure. Evolution A enforces the real methodology: compute `GRESB_Total = 0.30·Management + 0.70·Performance` so the total is a genuine function of its components, and derive star ratings as true quintiles and quartile ranks against the peer benchmark universe — turning a synthetic dashboard into a real benchmarking tool over sourced or user-entered fund data.

**How.** (1) Compute `gresbScore` from `0.3·management + 0.7·performance` (the components themselves from the seven performance/management aspects). (2) Star rating = quintile of the fund's score within its peer benchmark universe; quartile rank = percentile per §5. (3) Fund data sourced (GRESB disclosures) or user-supplied, replacing the seeded panel; the real benchmark distributions drive the peer ranking.

**Prerequisites.** Fund component data (sourced/user-entered); a peer benchmark universe (the real GRESB 2024 distributions the sibling `gresb-scoring` carries); the independent seeded scores replaced. **Acceptance:** `GRESB_Total` reconstructs exactly from `0.3·mgmt + 0.7·perf`; star ratings are peer-universe quintiles, not per-fund draws; no unlinked `sr()` score remains.

### 9.2 Evolution B — Real-assets ESG benchmarking copilot (LLM tier 1 → 2)

**What.** A copilot for real-asset fund managers: "how does our fund's GRESB score break down 30/70, and what star rating does that give against peers?" narrates the component structure and benchmark context from the atlas corpus, with tier-2 computing the score and peer quintile via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (the GRESB 30/70 split, star-rating quintiles, the seven aspects). The copilot's value is explaining score composition and peer positioning. Guardrail, pre-Evolution-A: scores are unlinked seeds and stars are random draws, so it must refuse fund-specific score/rating claims and answer only on GRESB structure. Tier 2 tool-calls the score/ranking endpoint. Every score and rating figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for the enforced formula and real peer ranking. **Acceptance:** post-Evolution-A, every score and star rating traces to a tool call reproducing the 30/70 formula and the peer quintile; pre-Evolution-A the copilot declines fund-specific figures.