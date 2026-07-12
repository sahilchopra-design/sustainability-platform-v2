## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims an "ISS QualityScore composite
> governance model" (`Board_score = 0.30×Independence + 0.25×Skills + 0.25×Diversity + 0.20×Tenure`),
> ISS independence-criteria classification, a 12-competency skills matrix, committee-independence
> checks, an overboarding screener (>5 seats), and Say-on-Climate readiness. **The code implements a
> different composite with different weights** (`diversityScore = 0.3×female% + 0.3×ethnic% +
> 0.2×intl% + 0.2×independent%` — no skills, no tenure), the skills matrix has 10 competencies (not
> 12), the `governanceRating` (A+…C+) is **drawn at random**, and there is no ISS QS tab, committee
> check, overboarding screener (the field exists, capped at 3, and is never screened), or
> Say-on-Climate logic. The sections below document the code as it behaves.

### 7.1 What the module computes

For 80 hard-coded real company names (Apple … CrowdStrike) with hard-coded sector labels, the page
generates synthetic board attributes and derives one composite (`BoardCompositionPage.jsx:21`):

```js
diversityScore = round(femalePct×0.3 + ethnicDiversity×0.3 + intlPct×0.2 + independentPct×0.2)  // 0–100
governanceRating = ['A+','A','A-','B+','B','B-','C+'][floor(sr(i*59)×7)]                        // random
```

Everything else on the page is filtering, sorting, and aggregation of the seeded attributes across
4 tabs (Board Overview / Diversity Analytics / Skills Matrix / Independence).

### 7.2 Parameterisation — synthetic attribute generators

| Attribute | Generator | Range | Provenance |
|---|---|---|---|
| `boardSize` | `round(8 + sr(i*7)×7)` | 8–15 | Synthetic; plausible vs Spencer Stuart mean ~10.8 |
| `femalePct` | `round(15 + sr(i*11)×35)` | 15–50% | Synthetic demo value |
| `independentPct` | `round(50 + sr(i*13)×45)` | 50–95% | Synthetic demo value |
| `avgAge` / `avgTenure` | `52 + sr×16` / `sr×12 + 2` | 52–68 yr / 2–14 yr | Synthetic demo value |
| `ethnicDiversity` / `intlPct` | `sr×40+10` / `sr×50+10` | 10–50% / 10–60% | Synthetic demo value |
| `ceoChairSep` / `leadIndDir` | `sr(i*37)>0.4` / `sr(i*41)>0.3` | ~60% / ~70% Yes | Synthetic demo value |
| `overboarding` | `round(sr(i*43)×3)` | 0–3 directors | Synthetic; never thresholded |
| `skillMatrix[10]` | per skill: `round(sr(i*23+idx*7)×boardSize×0.8 + 1)` | 1–~13 directors | Synthetic demo value |
| `yearly[5]` | trend drift, e.g. `femPct−5+y×2+sr×3` | 2020–2024 | Synthetic upward drift |
| `esgExpertise` | `round(sr(i*49)×boardSize×0.6)` | 0–9 | Synthetic demo value |

The composite's weights (0.3/0.3/0.2/0.2) are authorial choices with no cited standard; note that
`independentPct` — an *independence* metric — contributes 20% of what is labelled a *diversity*
score, and the guide's claimed skills/tenure terms are absent.

### 7.3 Calculation walkthrough

1. **Generation** — the `COS` array builds all 80 records at module load; all values are stable
   across renders (seeded PRNG).
2. **Filter/sort** — search + sector filter, then sort on any column via a copied array
   (`[...COS].sort`); pagination at 12 rows.
3. **Headline stats** — means of female %, independence %, age, diversityScore, board size and the
   CEO/Chair-separated count over the filtered set (`stats`, guarded by `||0`).
4. **Tab aggregates** — `sectorDiv` (per-sector means of female/independent/ethnic %), `femDist`
   (5-bucket histogram <20…>50%), `ageDist` (4 buckets), `aggSkills` (portfolio-wide totals and
   means of the 10-skill matrix), ESG-experts-by-sector bar, tenure-vs-independence scatter, and a
   CEO/Chair-separation pie.
5. **Detail panel** — clicking a row opens a per-company panel with a 10-axis skills radar and the
   5-year `yearly` diversity trend.

### 7.4 Worked example

Company with `femalePct = 32`, `ethnicDiversity = 24`, `intlPct = 40`, `independentPct = 78`:

| Step | Computation | Result |
|---|---|---|
| Gender term | 32 × 0.3 | 9.6 |
| Ethnicity term | 24 × 0.3 | 7.2 |
| International term | 40 × 0.2 | 8.0 |
| Independence term | 78 × 0.2 | 15.6 |
| **diversityScore** | round(9.6+7.2+8.0+15.6) | **40 / 100** |
| Rating draw | `sr(i*59)=0.31` → floor(0.31×7)=2 | **'A-'** (unrelated to the 40) |

The table colour-codes female % at ≥30 green / ≥20 amber / <20 red — consistent with the 30% Club
threshold — but the rating column beside it is pure chance.

### 7.5 Data provenance & limitations

- **All board attributes are synthetic**, from `sr(seed) = frac(sin(seed+1)×10⁴)`. Company names
  and sectors are real (hard-coded), which creates a **misattribution risk**: the page displays
  fabricated diversity/governance numbers against real issuers (e.g. a random 'C+' next to
  "Microsoft"). No proxy data, ISS feed, or governance database is queried.
- `governanceRating` has zero informational content; `diversityScore` mixes independence into a
  diversity label; tenure/skills are displayed but never scored.
- Skill counts are independent draws — they can exceed plausible joint coverage (10 skills each at
  up to 80% of board seats).
- The 5-year trend hard-codes improvement (+2pp female/yr), so trend charts always look favourable.

### 7.6 Framework alignment

- **ISS Governance QualityScore** — real ISS QS ranks companies into deciles per region from ~230
  weighted factors across 4 pillars (board, compensation, shareholder rights, audit); scores derive
  from disclosed data with published factor logic, never randomness. This module approximates only
  a handful of board-pillar raw factors.
- **Glass Lewis guidelines** — codify vote triggers (e.g. <30% gender-diverse boards at Russell
  3000). The module's female-% colour bands echo the 30%/20% thresholds.
- **UK Corporate Governance Code 2024** — comply-or-explain provisions on chair independence and
  tenure (chair >9 years impairs independence); tenure is generated here but never tested against 9y.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a defensible board-quality composite and proxy-voting screen for listed portfolio
companies, replacing the random rating. Decisions supported: engagement targeting, ISS/GL vote
anticipation, and governance factor input to ESG ratings.

### 8.2 Conceptual approach
Two-layer factor scorecard mirroring (1) **ISS Governance QualityScore** (raw factors → pillar
scores → regional decile rank) and (2) **MSCI IVA Corporate Governance key issue** (0–10 management
score from board structure indicators), with vote-trigger flags per **Glass Lewis 2024 policy**.
Layer 1 scores raw factors from proxy data; Layer 2 aggregates with fixed public weights and ranks
into deciles within region.

### 8.3 Mathematical specification

```
Pillar_Board = Σ_k w_k·s_k (Σw_k=1); Composite = 100×Pillar_Board; Decile = rank within region
```

| Factor s_k | Scoring rule | w_k | Calibration source |
|---|---|---|---|
| Independence | `ind%`: 1 at ≥75%, linear to 0 at ≤50% (majority-independent norm) | 0.25 | NYSE 303A; UK Code B.1 |
| Gender diversity | 1 at ≥40%, 0.6 at ≥33%, 0.3 at ≥20%, else 0 | 0.15 | EU Directive 2022/2381 (40% NED target); FTSE Women Leaders 33% |
| Ethnic diversity | 1 if ≥1 director from minority background (Parker Review), scaled by disclosure | 0.10 | Parker Review 2020/2023 targets |
| Tenure balance | 1 − max(0, (avgTenure − 9)/6); flag any NED >12y | 0.10 | UK Code 2024 ¶10 (9-year chair test); ISS tenure concern |
| Skills coverage | covered competencies ÷ 12 (climate, digital, finance, risk, sector, legal, intl, HR, M&A, ops, sustainability, stakeholder) | 0.15 | ISS QS skills factor; guide's 12-competency list |
| Overboarding | 1 − (# directors >4 public boards ÷ board size); CEO-directors limit = 2 | 0.10 | ISS 2024 US policy (5 boards; 3 for CEOs); GL uses 5/2 |
| Leadership structure | 1 if separate chair or strong lead independent director, else 0.4 | 0.10 | GL 2024 policy; UK Code A.2/A.3 |
| Refreshment | 1 if ≥1 new independent director in 3y AND avg age σ ≥ 5y, else linear | 0.05 | Spencer Stuart Board Index norms |

Letter grade mapped from decile (D1–2 = A range … D9–10 = C range) — deterministic, never random.
Vote-flag layer (binary, reported alongside): independence <50%, gender <1 female (GL against),
overboarded chair, combined CEO/chair without LID.

### 8.4 Data requirements
Per-director records: name, independence classification, tenure, age, gender, ethnicity
(self-disclosed), committee seats, other public boards, skills tags. Sources: proxy statements
(EDGAR, free), BoardEx / ISS Data Desk (vendor), FTSE Women Leaders & Parker Review datasets
(free). Platform: reuse the document-extraction pipeline; persist to a `board_directors` table
(new migration) keyed to the existing company entities.

### 8.5 Validation & benchmarking plan
Reconcile decile vs ISS QS board pillar (ρ ≥ 0.65 target) and MSCI IVA governance score on a ≥200
company overlap; backtest vote-flags against realised ISS/GL "against" recommendations (precision ≥
70%); annual stability check (score churn attributable to roster changes only); weight sensitivity
±5pp reported per factor.

### 8.6 Limitations & model risk
Ethnicity disclosure is voluntary and regionally inconsistent (treat missing as "not scored", not
zero); skills matrices are self-reported and inflate coverage; independence classifications differ
across ISS/GL/local codes — the model must document which definition it applies per market.
Fallback: where per-director data is unavailable, report only disclosure-derived factors and label
the composite "partial coverage".
