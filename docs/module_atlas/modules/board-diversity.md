# Board Diversity Metrics
**Module ID:** `board-diversity` · **Route:** `/board-diversity` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Gender, ethnic, skills, and age diversity analytics for board and executive committee covering 30% Club targets, Hampton-Alexander and Parker Review benchmarks, and EU Gender Balance Directive compliance. Tracks intersectional diversity using a composite diversity index and benchmarks against FTSE All-World peer groups.

> **Business value:** Board diversity metrics are rapidly moving from voluntary best practice to mandatory disclosure and minimum threshold requirements under the EU Gender Balance Directive and UK Listing Rules. Investors monitoring Hampton-Alexander, Parker Review, and EU Directive compliance simultaneously can identify engagement-priority companies before legal non-compliance triggers regulatory sanctions.

**How an analyst works this module:**
- Portfolio Board Diversity tab ranks companies on composite diversity index
- Gender Analytics tab tracks female representation at board and ExCo levels
- Ethnicity Analytics tab shows Parker Review compliance by company and sector
- EU Directive Compliance tab flags companies below 40% female threshold
- Peer Benchmark compares diversity scores against FTSE index and sector averages
- Engagement Priority tab identifies companies with lowest scores for stewardship

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOARD_SKILLS`, `COUNTRY_BOARD_REGULATIONS`, `COUNTRY_ISO_MAP`, `ChartTooltip`, `DIVERSITY_TREND`, `GOV_SCORE_WEIGHTS`, `PIE_COLORS`, `SECTOR_BOARD_BENCHMARKS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRY_BOARD_REGULATIONS` | 13 | `iso2`, `quota`, `mandatory`, `year_enacted`, `penalty`, `current_avg` |
| `DIVERSITY_TREND` | 8 | `portfolio_female`, `benchmark_female`, `portfolio_indep`, `benchmark_indep` |
| `GOV_SCORE_WEIGHTS` | 8 | `weight`, `description` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `BOARD_SKILLS` | `['Finance', 'Technology', 'ESG/Sustainability', 'Industry Expertise', 'Legal/Compliance', 'International', 'Risk Management', 'Digital/Innovation'];` |
| `seededRandom` | `(seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `rng` | `seededRandom(idx * 137 + 42 + (holding.name \|\| '').charCodeAt(0));` |
| `vary` | `(base, spread) => clamp(base + (rng() - 0.5) * spread * 2, 0, 100);` |
| `female_pct` | `Math.round(vary((bench.female_pct + countryAvg) / 2, 12));` |
| `board_size` | `Math.round(clamp(bench.board_size_avg + (rng() - 0.5) * 6, 5, 18));` |
| `avg_age` | `Math.round(clamp(bench.avg_age + (rng() - 0.5) * 10, 42, 72));` |
| `avg_tenure` | `+(clamp(bench.avg_tenure_yr + (rng() - 0.5) * 6, 2, 16)).toFixed(1);` |
| `skills_coverage` | `+(clamp(bench.skills_coverage + (rng() - 0.5) * 0.3, 0.3, 1.0)).toFixed(2);` |
| `boardData` | `useMemo(() => portfolio.map((h, i) => genBoardData(h, i)), [portfolio]);` |
| `sectors` | `useMemo(() => ['All', ...new Set(boardData.map(h => h.sector))].sort(), [boardData]);` |
| `wtSum` | `boardData.reduce((s, h) => s + wt(h), 0) \|\| 1;` |
| `wavg` | `(arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `exportGovernance` | `() => exportCSV(filtered.map(h => ({ Company: h.name, Sector: h.sector, Country: h.countryCode, 'Female %': h.female_pct, 'Independent %': h.independent_pct, 'Board Size': h.board_size, 'CEO-Chair Split': h.ceo_chair_spl` |
| `rows` | `filtered.map(h => {` |
| `redFlags` | `useMemo(() => boardData.filter(h => !h.ceo_chair_split \|\| h.female_pct < 20 \|\| h.independent_pct < 50 \|\| h.avg_tenure > 12), [boardData]);  /* ── Peer comparison ── */ const peerData = useMemo(() => { const selected = boardData.find(h => h.name === peerSelect);` |
| `ageDist` | `useMemo(() => { const buckets = { '40-49': 0, '50-54': 0, '55-59': 0, '60-64': 0, '65-69': 0, '70+': 0 };` |
| `tenureDist` | `useMemo(() => { const buckets = { '0-3yr': 0, '3-6yr': 0, '6-9yr': 0, '9-12yr': 0, '12+yr': 0 };` |
| `regCompliance` | `useMemo(() => { return COUNTRY_BOARD_REGULATIONS.map(reg => { const holdings = boardData.filter(h => h.countryCode === reg.iso2);` |
| `nonCompliant` | `holdings.filter(h => h.quotaCompliance === 'Non-Compliant' \|\| h.quotaCompliance === 'Below Target').length;` |
| `genderBarData` | `useMemo(() => { return filtered.slice(0, 30).map(h => { const reg = getCountryReg(h.countryCode);` |
| `badge` | `{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.gold}18`, color: T.gold, fontWeight: 600, marginLeft: 10 };` |
| `pillStyle` | `(color) => ({ display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${color}15`, color, fontWeight: 600 });` |
| `avg` | `fn => (holdings.reduce((s, h) => s + fn(h), 0) / n);` |
| `avgF` | `holdings.reduce((s, h) => s + h.female_pct, 0) / n;` |
| `gap` | `natAvg != null ? (avgF - natAvg).toFixed(1) : 'N/A';` |
| `pct` | `boardData.length ? ((holdings.length / boardData.length) * 100).toFixed(0) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOARD_SKILLS`, `COUNTRY_BOARD_REGULATIONS`, `DIVERSITY_TREND`, `GOV_SCORE_WEIGHTS`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Female Board Representation | `Female_directors / Total × 100` | Company proxy | Percentage of female directors; EU Directive mandates ≥40% by 2026 for large companies |
| Ethnic Minority Representation | `Ethnic_minority / Total × 100` | Parker Review data | Percentage of ethnic minority directors; Parker Review target is ≥10% for FTSE 250 |
| Diversity Index (composite) | `1 – Σp² across categories` | Platform model | Composite Herfindahl-Simpson diversity score; higher = more diverse across all dimensions |
- **Company proxy statements and annual reports** → Extract board demographics; compute gender parity gap and Parker score → **Per-company diversity metrics with EU Directive and Parker Review compliance flags**
- **FTSE/MSCI governance databases** → Benchmark diversity indices against index and sector peer groups → **Diversity ranking with peer percentile positioning and stewardship priority flags**

## 5 · Intermediate Transformation Logic
**Methodology:** Composite board diversity index
**Headline formula:** `DiversityIndex = 1 – Σ_i(p_i²); Gender_parity_gap = |Female_pct – 0.40|; Parker_score = Ethnic_minority_directors / Total × 100`

Diversity index uses Herfindahl-Simpson complement (1 – Σp²) applied separately to gender, ethnicity, age cohort, and nationality. Perfect diversity scores 1.0; total uniformity scores 0. Gender parity gap measures distance from 40% female target under EU Directive.

**Standards:** ['EU Gender Balance on Corporate Boards Directive', 'Hampton-Alexander Review', 'Parker Review 2020']
**Reference documents:** EU Gender Balance on Corporate Boards Directive (EU) 2022/2381; Hampton-Alexander Review Final Report 2021; Parker Review 2020 Update; FTSE Women Leaders Review 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims a "composite board diversity
> index" built on the Herfindahl–Simpson complement (`DiversityIndex = 1 − Σp²`), a gender parity
> gap `|Female% − 0.40|`, and a Parker Review score. **None of these formulas exist in the code.**
> What the page actually implements is (a) a 7-component additive **governance score** (whose
> weights *are* honestly disclosed in the in-page `GOV_SCORE_WEIGHTS` table), (b) a
> **country-quota compliance check** against a 12-country hard-coded regulation table, and (c) a
> red-flag / engagement-recommendation engine. There is no 1−Σp² computation, no intersectional
> index, and no Parker-specific ethnic-minority director count. The sections below document the
> code as it behaves.

### 7.1 What the module computes

For the user's portfolio (localStorage `ra_portfolio_v1`, falling back to the first 25 rows of
`GLOBAL_COMPANY_MASTER`), `genBoardData()` synthesises board attributes anchored to sector
benchmarks, then computes (`BoardDiversityPage.jsx:116-124`):

```js
govScore = round(
    (female_pct / 50)  × 20 +          // parity target = 50%
    (independent_pct / 100) × 20 +
    (ceo_chair_split ? 15 : 0) +
    (ethnic_diversity_pct / 40) × 15 + // ethnic ceiling = 40%
    skills_coverage × 15 +             // 0–1 coverage of 8 skills
    (avg_tenure < 12 ? 10 : 5) +
    (7 ≤ board_size ≤ 15 ? 5 : 0)
)   // clamped to [15, 98]
```

plus `quotaCompliance ∈ {Compliant, Non-Compliant, Meets Target, Below Target, N/A}` from the
country regulation table, weighted portfolio KPIs, red flags, and ranked engagement
recommendations.

### 7.2 Parameterisation

**Attribute generator** — a Lehmer/Park–Miller LCG (`s ← s×16807 mod 2³¹−1`), *not* the platform's
usual `sr()` sine PRNG, seeded `idx×137 + 42 + charCode(name[0])`. Each attribute is
`vary(anchor, spread) = clamp(anchor + (rng−0.5)×2×spread, 0, 100)`:

| Attribute | Anchor | Spread | Anchor provenance |
|---|---|---|---|
| `female_pct` | (sector benchmark + country average) / 2 | ±12pp | `SECTOR_BOARD_BENCHMARKS` (11 sectors, e.g. Financials 35%, Energy 28%) + `COUNTRY_BOARD_REGULATIONS.current_avg` — plausible but uncited estimates |
| `independent_pct` | sector benchmark (68–82%) | ±15pp | Synthetic benchmark table |
| `board_size` | sector avg (9–13), clamp 5–18 | ±3 | Synthetic benchmark table |
| `avg_age` / `avg_tenure` | 54–62 yr / 5.5–9.2 yr | ±5 / ±3 | Synthetic benchmark table |
| `ethnic_diversity_pct` | 15–28% by sector | ±12pp | Synthetic benchmark table |
| `ceo_chair_split` | Bernoulli(sector split % 68–85) | — | Synthetic benchmark table |
| `skills_coverage` | 0.60–0.75, clamp 0.3–1.0 | ±0.15 | Synthetic; 8-skill list `BOARD_SKILLS` |

**Regulation table** (13 rows incl. header facts) encodes real quota regimes: Norway 40% mandatory
(2006, dissolution penalty), France 40% (2011, Copé-Zimmermann), Germany 30% supervisory (2015),
Italy 33%, India "1 female director" (Companies Act 2013), UK 40% target (comply-or-explain),
NASDAQ 1-diverse disclosure rule, Japan 30%-by-2030 target, South Korea 1-female rule (2020),
Singapore 25%, Australia 30%, Brazil none. These are accurate public-policy facts hard-coded as
seed data.

### 7.3 Calculation walkthrough

1. **Quota check** — `parseInt(quota)` extracts the numeric threshold ("40% female" → 40); India is
   special-cased as `female_pct ≥ 8` (≈1 seat on a 12-member board); non-numeric quotas ("None…")
   fall back to 30 via `|| 30`. Mandatory regimes yield Compliant/Non-Compliant; voluntary yield
   Meets Target/Below Target.
2. **Portfolio KPIs** — weight-aware averages `wavg = Σ f(h)·w_h / Σ w_h` with `w_h` from portfolio
   weight or 1/n: female %, independence %, board size, ethnic %, tenure, skills %, gov score;
   plus CEO/chair-split % and count below quota.
3. **Red flags** — any of: combined CEO/chair, `female_pct < 20`, `independent_pct < 50`,
   `avg_tenure > 12`.
4. **Engagement recommendations** — rule-based: female % more than 5pp below sector benchmark
   (High), independence <50% (Critical), combined chair (Medium), tenure >12y (Medium); sorted by
   priority then gap, top 20.
5. **Charts** — sector vs benchmark bars, gender/independence pies, age (6-bucket) and tenure
   (5-bucket) distributions, per-company vs benchmark radar, regulatory compliance by country,
   gender bar for top-30 holdings vs country quota line; CSV exports for governance and skills.

### 7.4 Worked example

US Financials holding (benchmark: female 35, indep 82, ethnic 25, skills 0.75, split 85%, size 13;
US `current_avg` = 32). LCG draws: female draw 0.70, indep 0.40, ethnic 0.55, skills 0.45,
split draw 0.50, tenure ≈ 6.8, size 13:

| Step | Computation | Result |
|---|---|---|
| Female % | clamp(33.5 + (0.70−0.5)×24) = 33.5+4.8 | 38 |
| Independent % | 82 + (0.40−0.5)×30 | 79 |
| Ethnic % / Skills | 25 + 0.05×24 → 26 · 0.75−0.05×0.6 → 0.72 | 26 / 0.72 |
| CEO/chair split | 0.50 < 0.85 | true |
| Gender term | (38/50)×20 | 15.2 |
| Independence term | (79/100)×20 | 15.8 |
| Split + ethnic + skills | 15 + (26/40)×15 + 0.72×15 | 15 + 9.75 + 10.8 |
| Tenure + size | 6.8<12 → 10 · 13∈[7,15] → 5 | 15 |
| **govScore** | round(81.55), clamp [15,98] | **82** |
| Quota (US, voluntary) | parseInt("None…")→NaN→30; 38 ≥ 30 | **Meets Target** |

### 7.5 Data provenance & limitations

- **All board attributes are synthetic** (Lehmer LCG around hard-coded benchmark anchors) attached
  to real portfolio company names — the same misattribution caveat as `board-composition`. The
  benchmark and regulation tables are the only externally grounded constants; the sector benchmark
  values themselves carry no citation.
- Gender term rewards up to 50% female — i.e. a 60%-female board scores the same 20/20 as a
  50% one but the formula `female/50×20` would exceed 20 above parity before the clamp at 98;
  no symmetric parity treatment (a true parity gap metric would penalise both directions).
- India's "1 female director" is approximated by an 8% share, which misfires for very large boards.
- Tenure scoring is a 2-step function (10/5), not continuous; skills coverage is a scalar, with the
  per-skill full/partial/none map generated independently of it (they can disagree).
- The 2021–2027 `DIVERSITY_TREND` series is hard-coded, including its 2025–2027 "forecast".

### 7.6 Framework alignment

- **EU Gender Balance Directive 2022/2381** — 40% of NED seats (or 33% of all directors) by
  mid-2026 for large EU listed companies. The module's quota engine covers member states FR/DE/IT
  individually but does not implement the Directive's 40%-NED test itself.
- **FTSE Women Leaders Review** (successor to Hampton–Alexander) — 40% women on FTSE 350 boards by
  2025; represented via the UK row (voluntary, 40%).
- **Parker Review** — ≥1 ethnic-minority director (FTSE 100 by 2021, FTSE 250 by 2024). The module
  tracks an ethnic-% metric but never applies the ≥1-director test the guide references.
- **ISS/Glass Lewis policies** — the red-flag thresholds (female <20%, independence <50%, combined
  chair) approximate proxy-adviser adverse-vote triggers.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Measure portfolio-wide board diversity for stewardship reporting and regulatory-compliance
monitoring (EU Directive 2022/2381, UK Listing Rules LR 9.8.6R(9), Parker Review), replacing
synthetic attributes with per-director data and implementing the composite index the guide promises.

### 8.2 Conceptual approach
Per-director roster → category shares → **Gini–Simpson (Herfindahl complement) diversity index per
dimension**, blended into a composite — mirroring (1) **MSCI board-diversity factor construction**
(share-based, disclosure-weighted) and (2) **FTSE Women Leaders / Parker Review** compliance
methodology (headcount tests at board and leadership level), with regulatory tests layered exactly
as each regime defines them.

### 8.3 Mathematical specification

```
D_d = 1 − Σ_c p_{d,c}²          per dimension d ∈ {gender, ethnicity, age cohort, nationality}
D̂_d = D_d / (1 − 1/k_d)         normalised by max diversity for k_d categories
Composite = Σ_d ω_d·D̂_d,  ω = (0.35 gender, 0.30 ethnicity, 0.20 age, 0.15 nationality)
ParityGap = |female_share − 0.40|                     (EU Directive NED target)
Parker = 1{ethnic-minority directors ≥ 1}
Compliance_r = rule_r(roster)   per regime r (40% FR, 33% IT, 30% DE supervisory, ≥1 IN/KR, …)
Portfolio_X = Σ_h w_h·X_h / Σ_h w_h                    (value-weighted aggregation)
```

| Parameter | Value | Calibration source |
|---|---|---|
| Gender parity anchor | 40% | EU Directive 2022/2381 Art. 5(1)(a) |
| UK target | 40% + 1 senior role | FCA LR 9.8.6R(9) |
| Parker threshold | ≥1 ethnic-minority director | Parker Review 2020/2023 |
| Age cohorts k | 4 (<50, 50–59, 60–69, 70+) | Spencer Stuart Board Index buckets |
| Dimension weights ω | judgemental; sensitivity-reported | Documented model choice |

### 8.4 Data requirements
Per-director: gender, self-disclosed ethnicity, birth year, nationality, role (NED/executive),
committee seats. Sources: proxy statements (EDGAR/Companies House, free), FTSE Women Leaders and
Parker Review datasets (free), BoardEx (vendor). Platform: portfolio weights already exist in
`ra_portfolio_v1` / holdings contexts; the country regulation table in this module is reusable
as-is; add a `board_directors` table (shared with the board-composition spec).

### 8.5 Validation & benchmarking plan
Reconcile portfolio female-% against MSCI/LSEG board-diversity fields (tolerance ±1pp);
verify compliance flags against FTSE Women Leaders and Parker Review published lists (exact match
expected); test Gini–Simpson normalisation on boundary rosters (all-one-category → 0; uniform → 1);
re-run quarterly and require flag changes to trace to roster events.

### 8.6 Limitations & model risk
Ethnicity self-disclosure is incomplete and jurisdiction-dependent (report coverage; never impute);
binary-gender share understates non-binary representation (use disclosed categories, k adaptive);
small boards quantise shares coarsely (report headcounts alongside indices); regulatory rules change
frequently — the regime table must carry effective dates and be versioned. Fallback: where roster
data is missing, disclose "insufficient data" rather than benchmark-anchored estimates.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the Herfindahl–Simpson index and source real demographics (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide promises a composite diversity index on the Herfindahl–Simpson complement (`1 − Σp²`), a gender-parity gap (`|Female% − 0.40|`), and a Parker Review ethnic-minority score — **none of these formulas exist**. What runs is (a) a 7-component additive governance score (whose weights are at least honestly disclosed in the `GOV_SCORE_WEIGHTS` table), (b) a real country-quota compliance check against a 12-country regulation table (`COUNTRY_BOARD_REGULATIONS`, the module's genuine strength), and (c) a red-flag engagement engine. Board demographics are synthesised via `genBoardData` from sector benchmarks with a seeded RNG. Evolution A implements the promised diversity math and sources the data.

**How.** (1) Implement the actual `1 − Σp²` intersectional index across gender, ethnicity, age cohort, and nationality — the module's headline metric, currently absent — plus the gender-parity gap and Parker score as documented. (2) Source board demographics from proxy statements / FTSE Women Leaders / Parker Review datasets (all publicly available for the covered indices), replacing the `vary(base, spread)` seeded synthesis, with per-company source/vintage. (3) Keep and extend the real quota-compliance check — it is the module's differentiator (EU Gender Balance Directive 40% threshold, Hampton-Alexander, Parker) — with vintage-tagged regulation data. (4) Rung 3: benchmark computed diversity indices against FTSE/MSCI governance data (the module cites them). As a backend vertical, `POST /api/v1/board-diversity/index`.

**Prerequisites.** A sourced demographics dataset (ethnicity data especially is disclosure-limited outside FTSE 350 / S&P 500 — coverage gaps must report as null, not synthesised); coordination across the board cluster. **Acceptance:** the `1 − Σp²` index is computed and varies correctly with representation spread; demographics carry source/vintage; EU-Directive non-compliance flags match the real 40% threshold; uncovered ethnicity data reports null.

### 9.2 Evolution B — Diversity-compliance and engagement copilot (LLM tier 2)

**What.** The module's audience monitors Hampton-Alexander, Parker, and the EU Directive simultaneously to prioritise engagement, so the copilot answers "which portfolio companies breach the EU 40% female-board threshold?", "rank our holdings by diversity index", "who are the engagement priorities and why?" — running the Evolution-A index and the quota-compliance check as tools, every figure and flag tool-traced.

**How.** Tool schemas over the Evolution-A index and the (already real) quota-compliance routes; grounding corpus is this Atlas record plus the EU Directive / Hampton-Alexander / Parker references in §5 and the `COUNTRY_BOARD_REGULATIONS` table (real regulation data with penalties and enactment years). The copilot's compliance verdicts cite the specific regulation and threshold per company; engagement-priority lists derive from the red-flag engine's tool output. The honest-null duty: where a company's ethnicity data is unavailable, the copilot reports the gap rather than a synthesised Parker score.

**Prerequisites (hard).** Evolution A — a copilot narrating the current seeded demographics as real board composition would fabricate diversity claims with regulatory-compliance implications. **Acceptance:** every diversity index, quota verdict, and red flag traces to a tool response; compliance verdicts cite the regulation and threshold; companies with missing demographic data are reported as such, not scored on synthesised values.