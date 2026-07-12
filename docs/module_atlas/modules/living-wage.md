# Living Wage Analytics
**Module ID:** `living-wage` · **Route:** `/living-wage` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Living wage gap analysis across portfolio company workforces. Covers Anker living wage methodology, regional benchmarks, gender pay gap, and supply chain labour cost sustainability.

> **Business value:** Living wage is increasingly a material S-pillar metric. GRI 202, SASB social standards, and CSRD S1 require wage-related disclosures. Companies paying below living wage face reputational risk, regulatory scrutiny, and worker turnover costs. This module quantifies the gap and supports engagement.

**How an analyst works this module:**
- Company Overview shows estimated living wage compliance rate
- Regional Benchmarks shows Anker living wage by country
- Gap Calculator estimates workers below living wage per company
- Supply Chain Labour shows Tier 1 supplier wage sustainability
- Gender Pay Analysis shows disclosed gender pay gap data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COUNTRY_ILO_STATUS`, `ChartTooltip`, `FAIR_PAY_FRAMEWORK`, `ILO_CONVENTIONS`, `LIVING_WAGE_BY_COUNTRY`, `PIE_COLORS`, `SECTOR_WAGE_RISK`, `WAGE_GAP_TREND`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LIVING_WAGE_BY_COUNTRY` | 14 | `iso2`, `living_wage_usd_mo`, `minimum_wage_usd_mo`, `gap_pct`, `informal_economy_pct`, `ilo_convention_ratified`, `sectors_at_risk` |
| `WAGE_GAP_TREND` | 9 | `global_avg_gap`, `portfolio_gap`, `developed_gap`, `emerging_gap` |
| `FAIR_PAY_FRAMEWORK` | 6 | `criteria`, `score_range`, `color`, `count` |
| `ILO_CONVENTIONS` | 9 | `name`, `year`, `topic` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `seededRandom` | `(seed) => { let s = seed; return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; }; };` |
| `clamp` | `(v, lo, hi) => Math.max(lo, Math.min(hi, v));` |
| `rng` | `seededRandom(idx * 241 + 73 + (holding.name \|\| '').charCodeAt(0));` |
| `workersAtRisk` | `Math.round(clamp(sectorRisk.workers_at_risk_pct + (rng() - 0.5) * 15, 0, 80));` |
| `genderGap` | `Math.round(clamp(sectorRisk.gender_gap_pct + (rng() - 0.5) * 10, 2, 40));` |
| `wageData` | `useMemo(() => portfolio.map((h, i) => genWageData(h, i)), [portfolio]);` |
| `wtSum` | `wageData.reduce((s, h) => s + wt(h), 0) \|\| 1;` |
| `wavg` | `(arr, fn) => arr.reduce((s, h) => s + fn(h) * wt(h), 0) / wtSum;` |
| `highRiskWt` | `highRisk.reduce((s, h) => s + wt(h), 0) / wtSum * 100;` |
| `uniqueCountries` | `new Set(wageData.filter(h => h.riskLevel === 'Very High' \|\| h.riskLevel === 'High').map(h => h.countryCode));` |
| `csv` | `[keys.join(','), ...data.map(r => keys.map(k => { const v = r[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''; }).join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `exportReport` | `() => exportCSV(filtered.map(h => ({` |
| `exportCountry` | `() => exportCSV(LIVING_WAGE_BY_COUNTRY.map(c => ({` |
| `countryGapData` | `useMemo(() => { return LIVING_WAGE_BY_COUNTRY.map(c => { const holdingsInCountry = wageData.filter(h => h.countryCode === c.iso2);` |
| `portfolioWt` | `holdingsInCountry.reduce((s, h) => s + (h.weight \|\| h.portfolio_weight \|\| 0), 0);` |
| `sectorHeatData` | `useMemo(() => Object.entries(SECTOR_WAGE_RISK).map(([k, v]) => ({ sector: k.length > 16 ? k.slice(0, 14) + '..' : k, ...v })), []);` |
| `total` | `Object.values(groups).reduce((s, v) => s + v, 0) \|\| 1;` |
| `leaders` | `useMemo(() => [...wageData].sort((a, b) => b.fairPayScore - a.fairPayScore).slice(0, 5), [wageData]);` |
| `laggards` | `useMemo(() => [...wageData].sort((a, b) => a.fairPayScore - b.fairPayScore).slice(0, 5), [wageData]);` |
| `badge` | `{ display: 'inline-block', fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${T.gold}18`, color: T.gold, fontWeight: 600, marginLeft: 10 };` |
| `pillStyle` | `(color) => ({ display: 'inline-block', fontSize: 11, padding: '2px 10px', borderRadius: 20, background: `${color}15`, color, fontWeight: 600 });` |
| `portWt` | `holdingsHere.reduce((s, h) => s + (h.weight \|\| h.portfolio_weight \|\| 0), 0);` |
| `avgA` | `a[1].reduce((s, h) => s + h.workersAtRisk, 0) / a[1].length;` |
| `avgB` | `b[1].reduce((s, h) => s + h.workersAtRisk, 0) / b[1].length;` |
| `avgWorkers` | `holdings.reduce((s, h) => s + h.workersAtRisk, 0) / n;` |
| `estWorkers` | `Math.round(avgWorkers * n * 850);` |
| `pct` | `wageData.length ? ((holdings.length / wageData.length) * 100).toFixed(0) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FAIR_PAY_FRAMEWORK`, `ILO_CONVENTIONS`, `LIVING_WAGE_BY_COUNTRY`, `PIE_COLORS`, `WAGE_GAP_TREND`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Regional Benchmarks | — | Anker/WageIndicator | Living wage reference values by region and city |
| Gender Pay Gap | — | ILO | Persistent global gender wage gap requiring disclosure |
| Supply Chain Labour Cost | — | Sector analysis | Labour cost share in supply chain varies widely by sector |
- **Company wage disclosures** → Anker benchmark comparison → **Living wage gap estimate**
- **Supply chain spend** → Labour cost proportion → **Supply chain wage sustainability**
- **Gender pay gap data** → Equity analysis → **Social pillar ESG score**

## 5 · Intermediate Transformation Logic
**Methodology:** Living wage gap calculation
**Headline formula:** `Gap = max(0, LivingWage_region - ActualWage); LivingWage = Anker_reference_value`

Anker methodology: living wage = cost of nutritious diet + housing + other essential needs + 10% margin. Regional references updated annually. Gap analysis: employees earning below living wage = labour rights issue.

**Standards:** ['Anker Research Institute', 'Fair Wage Network', 'WageIndicator Foundation']
**Reference documents:** Anker Research Institute Living Wage Reference Values; WageIndicator Wage Data; Fair Wage Network Assessment Tools; GRI 202 Market Presence

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Company wage inputs against maintained Anker benchmarks (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch flag is precise: the guide's `Gap = max(0, LivingWage − ActualWage)` implies comparing real reported wages to Anker benchmarks, but the code has **no actual-wage input at all** — `livingWageGap` is the country's static pre-computed gap percentage, and per-holding figures (workers-at-risk, gender gap, Fair Pay Score) are country/sector lookups perturbed by a seeded RNG, so two same-country/sector holdings differ only by noise. The reference layer is the module's strength: 13-country living/minimum wage tables, 11-sector risk profiles, real ILO convention ratification data. Evolution A adds the missing measurement layer: a wage-data intake (holding × country × wage band × headcount, from company disclosures or engagement responses) computed against maintained Anker Reference Values, with the platform's existing `GET /just-transition/ref/living-wage-benchmarks` route as the shared benchmark source rather than a page-local table.

**How.** (1) `wage_disclosures` table + `POST /living-wage/gap` computing the per-holding gap from entered wages, honest-null where no disclosure exists — coverage becomes the headline KPI, mirroring how sparse real wage disclosure actually is. (2) Anker/WageIndicator values refreshed annually in refdata with vintage (the guide says "updated annually"; the module must too). (3) The Fair Pay Score recomputed over disclosed inputs with its weights (gap×0.4, workersAtRisk×0.3…) documented; the seeded perturbation deleted. (4) Gender-gap figures from actual disclosed pay-gap reporting (UK/EU mandatory disclosures are public) rather than sector-average noise.

**Prerequisites.** The seeded per-holding synthesis removed; benchmark licensing checked (Anker publishes reference values with usage terms); disclosure intake UX. **Acceptance:** a holding with no wage disclosure shows "not disclosed", not a score; the gap formula runs on actual entered wages; benchmark values carry vintage and source.

### 9.2 Evolution B — Wage-engagement copilot for stewardship teams (LLM tier 2)

**What.** The module's stated purpose is engagement support, which is letters, questions and evidence — LLM-native work: "draft the engagement ask for our five Fair-Pay laggards, citing their country benchmark and what we know of their wages", "what does CSRD S1 require on adequate wages and what should we request from this issuer?", "which ILO conventions has Bangladesh ratified, and what does that mean for supplier wage risk?" (the real `ILO_CONVENTIONS`/`COUNTRY_ILO_STATUS` tables ground this directly). A second lever: parsing disclosed wage data from sustainability reports into the intake queue — the extraction-with-confirmation pattern.

**How.** Tier 2 over the Evolution A gap/coverage routes: engagement drafts cite the specific benchmark (country, vintage, Anker value) and the holding's disclosure state — "has not disclosed wage distribution" is itself the engagement ask for most issuers, and the copilot must lead with coverage honesty rather than perturbed estimates. Regulatory framing (GRI 202, CSRD S1) quotes the curated standards references; sector-risk statements cite the `SECTOR_WAGE_RISK` table as sector priors, explicitly distinct from company evidence. Extractions carry source-page citations and await confirmation.

**Prerequisites (hard).** Evolution A (engagement letters citing seeded scores to real companies would be indefensible); document pipeline for extraction. **Acceptance:** every engagement claim distinguishes benchmark / sector-prior / company-evidence provenance; drafts for undisclosed holdings ask for data rather than asserting gaps; extractions confirmed before entering scores.