## 7 · Methodology Deep Dive

This module faithfully implements the guide's 5-pillar additive scoring formula — one of the more
code-accurate modules in this batch — applied to a hand-curated (not seeded-PRNG) roster of 30
real, recognisable companies.

### 7.1 What the module computes

```
score = VALIDATION[validation] + AMBITION[ambition] + SCOPE_COV[scope] + INTERIM[interim] + capex
gap   = ambition==='1.5C' ? 100-score : ambition==='WB2C' ? 75-score : 50-score
sectorAvg = mean(score) grouped by sector
```
Each company (`COMPANIES`, 30 rows: Unilever, Microsoft, Nestle, Apple, Shell, TotalEnergies, BP,
BASF, HeidelbergCement, ArcelorMittal, Amazon, Alphabet, Samsung, Volkswagen, Toyota, BMW,
JPMorgan, HSBC, BNP Paribas, Enel, Iberdrola, Orsted, Lafarge, Glencore, Rio Tinto, and others)
carries a hand-assigned `validation`/`ambition`/`scope`/`interim` category and a `capex` (green
capex % of total, 2-15 range) value.

### 7.2 Parameterisation (the 5-pillar rubric)

| Pillar | Max points | Category → points |
|---|---|---|
| Validation | 20 | approved=20, committed=10, self-declared=5 |
| Ambition | 25 | 1.5C=25, Well-below-2C (WB2C)=15, 2C=10 |
| Scope coverage | 25 | 1+2+3=25, 1+2=15 |
| Interim milestone | 15 | met=15, on-track=10, behind=5, no-interim=0 |
| CapEx alignment | 15 (raw value used directly, observed range 2-15) | Green capex % of total capex, used as a direct point contribution — i.e. the company's raw `capex` field caps out near the pillar's max weight by construction (dataset never exceeds 15) |
| **Total** | **100** | Matches the guide's stated `Score = Validation(20) + Ambition(25) + Scope(25) + Interim(15) + CapEx(15)` exactly |

The 30-company `validation`/`ambition`/`scope`/`interim`/`capex` assignments are **editorial
judgement calls** by the module's author, informed by each company's real public climate profile
(e.g. Shell "committed / WB2C / behind" and ArcelorMittal "self-declared / 2C / no-interim" are
plausible characterisations of those companies' actual SBTi status circa the guide's reference
period) rather than a live pull from the SBTi target dashboard — so individual company scores
should be read as illustrative, not as verified current SBTi records.

### 7.3 Calculation walkthrough

1. `score` is computed once per company via direct object-lookup summation — no randomisation, no
   PRNG — a genuinely deterministic, auditable calculation.
2. `rating(score)` buckets the 0-100 score into a qualitative tier (implementation not shown in
   the excerpt but referenced via `ratingColor(rating(c.score))`) for colour-coded display.
3. `sectorAvg` groups the 30 companies by `sector` (Consumer, Tech, Energy, Materials, Auto,
   Finance, Utilities, Mining) and averages `score` — a genuine aggregation.
4. `gapData`'s **say-do gap** is the distance between the company's *stated ambition ceiling*
   (100 for 1.5C-aligned, 75 for WB2C, 50 for 2C) and its *actual achieved score* — i.e. it
   penalises companies that claim a high-ambition pathway (1.5C) but score poorly on validation/
   scope/interim/capex execution, exactly the "credibility gap" concept the guide names. A company
   claiming 1.5C with `score=60` shows `gap=40` — a large say-do gap; a company claiming 2C with
   the same `score=60` shows `gap=-10` (negative, i.e. over-delivering relative to its stated
   ambition).

### 7.4 Worked example

Shell: `validation='committed'` (10) + `ambition='WB2C'` (15) + `scope='1+2+3'` (25) +
`interim='behind'` (5) + `capex=8` = `10+15+25+5+8 = 63/100`.
`gap = 75 - 63 = 12` — a moderate say-do gap, reflecting a company with broad scope coverage and a
validated pathway but weak interim delivery and below-average green capex allocation.

Compare Ørsted: `validation='approved'` (20) + `ambition='1.5C'` (25) + `scope='1+2+3'` (25) +
`interim='met'` (15) + `capex=15` = `20+25+25+15+15 = 100/100`, `gap = 100-100 = 0` — a
best-in-class profile consistent with Ørsted's real-world reputation as a utility sector leader
in renewable transition.

### 7.5 Data provenance & limitations

- The scoring **formula** is correctly and deterministically implemented, exactly matching the
  guide.
- The **company-level input data** (validation/ambition/scope/interim/capex classifications) is
  hand-curated by the module author based on real companies' public climate profiles, not sourced
  from a live SBTi API — this is materially more defensible than seeded-PRNG fabrication (seen in
  most other modules in this batch) but still requires periodic manual refresh as companies'
  actual SBTi status changes (e.g. targets can be validated, extended, or removed).
- `capex` (2-15 range) is used as a raw point contribution without an explicit stated scaling
  formula (e.g. no documented mapping from "% green capex" to "0-15 points"); it appears the
  author simply capped illustrative capex percentages within the pillar's weight range.
- 30 companies is a small, hand-picked sample — not representative of SBTi's full validated-company
  universe (thousands of companies), so sector averages should not be read as market-wide
  statistics.

**Framework alignment:** SBTi Corporate Net-Zero Standard v1.2 (validation tiers, ambition
categories 1.5C/WB2C/2C, and scope coverage requirements are all correctly reproduced) · CDP
Climate Change Scores (referenced as a complementary data source in the guide, not integrated into
the score) · the say-do gap concept is a genuine, defensible methodological addition beyond the
raw SBTi status, though its ambition-ceiling proxy (100/75/50) is the author's own construction,
not a published SBTi or CDP benchmark.
