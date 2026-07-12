## 7 · Methodology Deep Dive

> No MODULE_GUIDES entry exists for this route (`guide: null` in the atlas record); the sections below
> document the code as-is with no guide to reconcile against.

### 7.1 What the module computes

Three independently generated synthetic datasets, all built with the platform's seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`: 120 companies each scored across all 17 UN SDGs (`genCompanies`), 60 SDG-labelled
bonds (`genBonds`), and a 17-row SDG portfolio-exposure table (`genSDGPortfolio`). There is no real holdings
or transaction data — every field is a per-index random draw.

```js
sdgScores[g].alignment = round(sr(seed)×85 + 5)              // 5–90 per SDG per company
overallSDG             = round(Σ alignment[1..17] / 17)       // flat unweighted mean
topSDGs                = top 5 SDGs by alignment score
portfolioSDGScore(kpi) = round(Σ companies.overallSDG / N)    // portfolio-level headline KPI
gap[sdg]                = target[sdg] − exposure[sdg]          // per-SDG allocation gap
```

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `alignment` per SDG | `sr()×85+5` → 5–90 | Synthetic, uniform per SDG-company pair |
| `contribution` | `alignment > 50 ⇒ 'Positive'` else `'Neutral'` | Arbitrary 50% cutoff, no "Negative" category despite real SDG frameworks including harm/negative screens |
| `esgScore` | `sr()×40+50` → 50–90 | Synthetic |
| Bond `numSDGs` | `floor(sr()×3)+1` → 1–3 tagged SDGs per bond | Synthetic |
| Bond `alignment` | `sr()×40+55` → 55–95 | Synthetic |
| Bond `verified` | `sr() > 0.35` → ~65% verified | Synthetic |
| Bond `framework` | ICMA / CBI / EU Taxonomy / National | Real named frameworks, randomly assigned |
| SDG portfolio `exposure` | `sr()×25+3` → 3–28% | Synthetic |
| SDG portfolio `target` | `sr()×20+5` → 5–25% | Synthetic, independent of `exposure` (can be below or above) |
| 17 SDG names/colours | UN SDG official names and official UN colour palette (`#E5243B` SDG1 red, `#26BDE2` SDG6 blue, etc.) | Real — matches the UN SDG communications guidelines |

### 7.3 Calculation walkthrough

1. `genCompanies(120)` draws 17 independent `sr()` values per company (one per SDG) — there is no
   correlation structure between a company's sector and its SDG scores (e.g. an Energy company can score as
   highly on SDG 6 Clean Water as a Utilities company).
2. `overallSDG` is a simple unweighted arithmetic mean across all 17 goals — real SDG-alignment
   methodologies (e.g. SDG Impact Standards) typically weight by revenue materiality or apply a "do no
   significant harm" gate rather than averaging all 17 goals equally, which the module does not implement.
3. `filtered`/`filteredBonds` apply text search + `sortKey` column sort over the synthetic arrays — pure
   client-side filtering, no aggregation logic beyond direct field reads.
4. `kpiData` (6 headline KPIs) are all straight `reduce`/`filter` counts or means over the synthetic
   `companies`/`bonds`/`sdgPortfolio` arrays — e.g. "SDGs Covered (>5%)" counts SDG rows with
   `exposure > 5`, "SDG Gaps" counts rows with `gap > 5`.
5. `genSDGPortfolio` independently randomises `exposure` and `target` per SDG, so `gap` is not tied to any
   actual allocation logic — a portfolio "target" here is not a strategy input, it is a random anchor.

### 7.4 Worked example

SDG 13 (Climate Action), portfolio row: `exposure = round(sr(12×71+400)×25+3)`,
`target = round(sr(12×43+410)×20+5)` (g=12 for SDG13, zero-indexed). Illustrative draw:
`exposure = 19%`, `target = 14%` → `gap = 14 − 19 = −5%` (over-allocated, so the "Gap" card would render
green per `s.gap>5?T.red:T.green` — a positive gap of 5+ is red, negative/small gap is green).

For a single company: 17 `alignment` draws averaging, say, 52 → `overallSDG = 52/100`; its `topSDGs` are the
5 highest-scoring goals, independent of what sector the company is in.

### 7.5 Companion analytics on the page

- **SDG Bond Tagging** (Tab 2) — bonds carry 1–3 SDGs via `[...new Set(primarySDGs)]` (dedup after random
  draw) plus a `useOfProceeds` category from 15 real-world proceeds categories (Renewable Energy, Affordable
  Housing, Gender Finance, etc.) — the SDG tags and the `useOfProceeds` category are drawn from independent
  seeds, so a bond's declared use-of-proceeds and its tagged SDGs are not guaranteed to be thematically
  consistent.
- **SDG Gap Analysis** (Tab 4) recommends action based on `gap` size: `>10` → "Increase allocation
  significantly," else "Moderate rebalancing needed" — a two-tier heuristic with no portfolio-construction
  logic behind the recommended increase size.

### 7.6 Data provenance & limitations

- **All data is synthetic** — 120 companies, 60 bonds, and the 17-SDG portfolio table are generated fresh
  each session from `sr()`; nothing is linked to real holdings, transactions, or verified SDG-alignment
  scores.
- `overallSDG` is an unweighted 17-goal average, which is not how any recognised SDG-alignment framework
  (SDG Impact Standards, PRI SDG framework, EU SFDR PAI) computes a composite score — those frameworks
  apply materiality weighting and/or "do no significant harm" veto gates rather than simple averaging.
- Bond SDG tagging and use-of-proceeds category are independently randomised, so the page cannot demonstrate
  a real thematic-consistency check (a genuine SDG bond framework requires proceeds to map coherently to
  the tagged SDGs, per ICMA's Green/Social/Sustainability Bond Principles).
- No negative/harm screening: `contribution` only distinguishes "Positive" vs "Neutral," omitting the
  "Negative" contribution category that real double-materiality SDG frameworks require.

**Framework alignment:** UN Sustainable Development Goals (official 17-goal taxonomy, names and colour
codes reproduced accurately) · ICMA Green/Social/Sustainability Bond Principles and EU Taxonomy (named as
`framework` options for bonds, not enforced via any compliance check) · the general shape of "exposure vs.
target vs. gap" mirrors how asset managers report SDG allocation against strategic targets, though the
underlying gap values here are not derived from any actual target-setting process.
