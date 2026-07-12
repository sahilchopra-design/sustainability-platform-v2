## 7 · Methodology Deep Dive

> ⚠️ **Partial guide↔code mismatch.** The guide's formula `Gap = max(0, LivingWage_region −
> ActualWage)` implies the module compares a **real reported wage** against the Anker living-wage
> benchmark. The code has no "actual reported wage" input at all — `livingWageGap` is simply the
> **country's static, pre-computed gap percentage** looked up from `LIVING_WAGE_BY_COUNTRY`, and every
> holding-level risk figure (workers at risk %, gender gap %, Fair Pay Score) is synthesised from that
> country/sector lookup plus a seeded random perturbation, not from any company-specific wage
> disclosure. Sections below document the code as it actually behaves.

### 7.1 What the module computes

For each portfolio holding, the module blends **three static reference tables** — country living-wage
gap (`LIVING_WAGE_BY_COUNTRY`, 13 countries), sector wage risk (`SECTOR_WAGE_RISK`, 11 GICS sectors),
and ILO convention ratification status (`COUNTRY_ILO_STATUS`, 13 countries × 8 conventions) — into a
per-holding **Fair Pay Score**:

```js
workersAtRisk = clamp(sectorRisk.workers_at_risk_pct + (rng()-0.5)*15, 0, 80)
genderGap     = clamp(sectorRisk.gender_gap_pct + (rng()-0.5)*10, 2, 40)
riskLevel     = isAtRisk && scRisk==='Very High' ? 'Very High'
              : isAtRisk ? 'High'
              : (scRisk==='Very High'||scRisk==='High') ? 'Medium' : 'Low'
fairPayScore  = clamp(
                  100 − gap×0.4 − workersAtRisk×0.3
                  − (riskLevel==='Very High'?20:riskLevel==='High'?12:riskLevel==='Medium'?6:0)
                  + (iloRatified ? 8 : 0) + rng()×10,
                  10, 95)
```
where `gap` is the holding's **country's** static living-wage gap %, and `isAtRisk` is whether the
holding's GICS sector appears in that country's `sectors_at_risk` list.

### 7.2 Parameterisation

| Construct | Detail | Provenance |
|---|---|---|
| `LIVING_WAGE_BY_COUNTRY` (13 rows) | Living wage $/mo, minimum wage $/mo, gap %, informal economy %, ILO ratification, at-risk sectors | Real Anker/GLWC-style structure; e.g. India $285 living wage vs $175 minimum (38.6% gap), USA $3,200 vs $1,260 (60.6% gap) — plausible magnitudes but static/undated point estimates, not live-refreshed benchmark values |
| `SECTOR_WAGE_RISK` (11 GICS sectors) | Supply-chain risk tier, direct risk tier, workers-at-risk %, key roles, gender gap % | Hand-authored, directionally sensible (Consumer Staples/Discretionary highest supply-chain risk at 45%/38%, Financials lowest at 5%) |
| `ILO_CONVENTIONS` (8) + `COUNTRY_ILO_STATUS` (13×8) | Real ILO convention IDs (C87, C98, C29, C100, C111, C138, C182, C131) and correct topic labels | Real convention identities; ratification flags per country are plausible and broadly consistent with known ILO ratification records (e.g. USA not ratified C87/C98/C29/C100/C111/C131, consistent with the US's historically low core-convention ratification count) |
| `WAGE_GAP_TREND` (2019–2026) | Global/portfolio/developed/emerging average gap % by year | Static, hand-authored declining trend (38.5%→31.2% global gap) — illustrative, not measured |
| Fair Pay Score weights (`×0.4`, `×0.3`, risk-level penalty, ILO bonus `+8`, noise `×10`) | Author-defined composite, no external calibration source |
| `seededRandom` | Park-Miller / "Minimal Standard" LCG: `s = (s×16807) mod 2147483647` | A genuinely standard PRNG algorithm (Lehmer generator), notably **different** from the platform's usual `sr(s)=frac(sin(s+1)×10⁴)` sine-hash pattern flagged elsewhere in this codebase — this module does not use the non-standard PRNG |

### 7.3 Calculation walkthrough

- **Per-holding risk generation** (`genWageData`): seeds the LCG with
  `idx×241 + 73 + holding.name.charCodeAt(0)` — deterministic per holding index and first-letter of
  company name (not the full name, so two companies with the same first letter and adjacent
  portfolio index could, in principle, collide in RNG stream, though practically unlikely to matter
  given the additional index term dominates).
- **KPI aggregation**: portfolio-weighted averages using `wt(h) = h.weight || h.portfolio_weight ||
  1/n` — falls back to equal-weighting only if neither weight field is present.
  `workersAtRisk (absolute)` KPI: `round(wavg(workersAtRisk%) × n × 1200)` — i.e. assumes **1,200
  workers per portfolio holding** as a flat headcount proxy to convert a weighted-average percentage
  into an absolute worker count; this constant (`1200`) is not sourced to any real average
  headcount figure and will misstate absolute worker counts for portfolios whose actual constituent
  companies have very different real headcounts.
- **Supply Chain Score**: `wavg(riskLevel → {VeryHigh:90, High:65, Medium:40, Low:15})` — converts
  the 4-tier categorical risk into a numeric score via a fixed lookup, then weights by portfolio share.
- **ILO Coverage**: `count(iloRatified) / n × 100` — simple unweighted share of holdings domiciled in
  countries that have ratified the relevant ILO convention(s), per the country lookup (not
  per-holding weighted).

### 7.4 Worked example

A holding in India (Consumer Staples sector, at-risk per `sectors_at_risk` list), `idx=5`, company
name starting with 'A' (charCode 65): `seed = 5×241+73+65 = 1205+73+65 = 1343`.
`gap = 38.6` (India's static gap %), `sectorRisk.workers_at_risk_pct = 45` (Consumer Staples),
`sectorRisk.gender_gap_pct = 22`, `scRisk = 'Very High'`, `isAtRisk = true` → `riskLevel = 'Very
High'`. With `rng()` (LCG draw) returning e.g. `0.62`:
```
workersAtRisk = clamp(45 + (0.62-0.5)*15, 0, 80) = clamp(45+1.8, 0, 80) = 47
fairPayScore  = clamp(100 - 38.6*0.4 - 47*0.3 - 20 + 0 + 0.62*10, 10, 95)
              = clamp(100 - 15.44 - 14.1 - 20 + 0 + 6.2, 10, 95)
              = clamp(56.66, 10, 95) = 57
```
(India has not ratified C131 Minimum Wage Fixing per `COUNTRY_ILO_STATUS`, so the +8 ILO bonus does
not apply.)

### 7.5 Companion analytics

- **Fair Pay Leaders/Laggards** — top/bottom 5 holdings by `fairPayScore`, purely a sort of the
  computed composite.
- **Country Gap chart** — renders `LIVING_WAGE_BY_COUNTRY` directly, weighted by portfolio exposure
  in that country (`portfolioWt = Σ weight of holdings in country`).
- **Sector Heat chart** — renders `SECTOR_WAGE_RISK` directly as a reference table/chart, independent
  of the live portfolio.

### 7.6 Data provenance & limitations

- **No real company-level wage disclosure is ever ingested** — despite the guide's "Company wage
  disclosures → Anker benchmark comparison" data-lineage claim, the actual gap figure used for every
  holding is its **country's** static average gap, identical for every company domiciled there
  regardless of that company's real reported wages.
- The `1200 workers/holding` headcount proxy and the Fair Pay Score's weighting constants (`0.4`,
  `0.3`, risk-tier penalties, `+8` ILO bonus) are author judgement, not calibrated to a published
  methodology.
- Living wage / minimum wage figures for 13 countries are static point-in-time estimates; a
  production tool should refresh these annually against Anker Research Institute or WageIndicator
  published updates.
- `WAGE_GAP_TREND`'s 2019–2026 series (including 2 years beyond the current date) is illustrative,
  not a measured historical or forecast series.

**Framework alignment:** Anker Research Institute living-wage methodology (cost of nutritious diet +
housing + other needs + 10% margin) is correctly described in the guide and structurally mirrored by
the living-wage-vs-minimum-wage gap table, though the underlying calculation itself is not
recomputed in code. ILO conventions (C87/C98/C29/C100/C111/C138/C182/C131) are real and correctly
identified. GRI 202 Market Presence is named in the guide but not operationalised as a disclosure
field in code.
