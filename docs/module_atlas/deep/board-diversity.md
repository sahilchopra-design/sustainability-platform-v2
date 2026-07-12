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
