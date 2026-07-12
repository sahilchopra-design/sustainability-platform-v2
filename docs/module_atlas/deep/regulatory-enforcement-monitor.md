## 7 · Methodology Deep Dive

### 7.1 What the module computes

200 synthetic enforcement actions across 26 named regulators, 8 action types, and 10 violation
categories, joined against a 40-holding synthetic portfolio for exposure scoring:

```js
fineUSD = round((sr()×150 + 0.5) × 1e6 × (regulator.avgFineM / 50))     // scaled by regulator's own severity
deterrenceScore = round(sr()×80 + 10)                                    // 10–90, per action
complianceScore = round(sr()×70 + 20)                                    // 20–90, per portfolio holding
portfolioScore  = Σ(holding.weight × holding.complianceScore) / Σ(holding.weight)   // weighted average
deterrenceEff   = (1 − repeatOffenders / totalActions) × 100
cagr            = (finalYearFineB / firstYearFineB)^(1/5) − 1) × 100
```

The guide's formula `EE = Σ(fine_amount_i × sector_relevance_i) / peer_count` is **not literally
implemented** — there is no `sector_relevance` weighting term anywhere in the file; the closest
analogue is `heatScore = actionsInSector / entityCountInSector` (an action-frequency-per-entity
ratio, not a fine-weighted exposure score) and the separate `portfolioScore` (a compliance-score
weighted average, not a fine-weighted enforcement-exposure score).

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `REGULATORS_25` | 26 rows (jurisdiction, `avgFineM`, region) — despite the name implying 25 | Curated regulator list, likely including ESMA, FCA, SEC, and others per the guide's cited sources; `avgFineM` values not independently verified here |
| Fine scaling | `avgFineM / 50` multiplier | Rescales the base random fine draw by how severe each named regulator's typical fines are relative to a $50M reference — a reasonable relative-severity mechanism |
| `deterrenceEff` | `(1 − repeatOffenderShare) × 100` | Directionally sound proxy: fewer repeat offenders ⇒ enforcement is more deterrent — though this conflates "few repeat offenders in the sample" with "enforcement is effective," which could equally reflect a small/young sample |
| Action types (8) | Fine, Suspension, Cease-and-Desist, Consent Order, Criminal Referral, Mandatory Audit, Public Censure, License Revocation | Real enforcement-action taxonomy |
| Violation categories (10) | Greenwashing, Failure-to-Disclose, Data Falsification, ESG Rating Manipulation, Climate Commitment Breach, Proxy Voting Failure, Product Mislabeling, Market Manipulation, Insider Trading on Climate, + 1 more | Real, comprehensive ESG-enforcement taxonomy consistent with ESMA/FCA greenwashing enforcement themes |

### 7.3 Calculation walkthrough

1. **Action generation** (200 rows, seed offset `+4000`): regulator/sector/action-type/violation
   drawn via `sr()`; `fineUSD` scaled by the drawn regulator's `avgFineM`; `year∈[2018,2023]`,
   `quarter∈[1,4]`; `deterrenceScore` (10–90) per action.
2. **Portfolio generation** (40 holdings, seed offset `+5000`): `complianceScore` (20–90),
   `actions` (count of enforcement actions matched to this holding via a seeded modulo-200 join —
   `floor(sr(p×67+5000)×200) === a.id%200`, an artificial matching mechanism rather than a real
   entity-to-action link), `weight` (0.5–5.5% per holding, `sr()×0.05+0.005`).
3. **Violation distribution** (`violationDist`): count + total fine per violation category.
4. **Regulator stats** (`regulatorStats`): per-regulator `totalFineM`, `avgFineM` (recomputed from
   actual actions, distinct from the seed regulator's nominal `avgFineM`), action count.
5. **Sector heat** (`sectorHeat`): `heatScore = actionsInSector / entityCountInSector` — enforcement
   density per sector, a genuine (if simplified) exposure-frequency metric.
6. **Portfolio risk** (`portfolioRisk`): weighted-average `complianceScore` across the 40 holdings
   by portfolio `weight` — a real weighted-average calculation, though "compliance score" here is
   an independent random draw per holding, not derived from that holding's own linked enforcement
   `actions` count.
7. **YoY fine growth / CAGR**: 6-year (2018–2023) time series of total fines, with a geometric CAGR
   over the 5-year span — genuine CAGR formula, correctly using the `^(1/5)` root for a 6-point
   (5-interval) series.
8. **Deterrence efficacy**: `(1 − repeatOffenders/total) × 100`, both portfolio-wide and
   filtered/regional variants.

### 7.4 Worked example

Action `i=0`, regulator index `regIdx=floor(sr(4007)×25)` (say ESMA, `avgFineM=80`):

| Step | Formula | Result |
|---|---|---|
| Base fine draw | `sr(4019)×150+0.5` | e.g. **62.3** ($M-scale factor before regulator adjustment) |
| Regulator scale | `avgFineM/50 = 80/50` | **1.6×** |
| `fineUSD` | `62.3×1e6×1.6` | **$99.7M** |
| `deterrenceScore` | `sr(4037)×80+10` | e.g. **58** |

Portfolio-level, for a holding with `weight=2.5%` and `complianceScore=65`, contributing to
`portfolioScore = Σ(weight×complianceScore)/Σweight` — if this were the only holding,
`portfolioScore=65`; in the full 40-holding book it is the weighted average across all.

### 7.5 Enforcement-severity rubric (as coded)

| Metric | Interpretation |
|---|---|
| `deterrenceScore` (10–90) | Higher = enforcement action judged more deterrent (per-action synthetic score) |
| `deterrenceEff` (0–100%) | Portfolio-wide, `1 − repeat-offender share` |
| `heatScore` | Actions per entity, by sector — higher = denser regulatory scrutiny |

### 7.6 Companion analytics

Enforcement action feed (200-row, filterable by regulator/sector/violation/year), violation
category distribution, regulator league table, sector heat map, portfolio exposure (weighted
compliance score), YoY fine growth + CAGR, deterrence efficacy by region.

### 7.7 Data provenance & limitations

- **All 200 enforcement actions and 40 portfolio holdings are synthetic**, `sr(seed)=
  frac(sin(seed+1)×10⁴)`; the 26-regulator list and action-type/violation-category taxonomies are
  real and comprehensive, but individual action records (which regulator fined which sector for
  what, and how much) are fabricated, not sourced from ESMA/FCA/SEC enforcement databases despite
  those being the guide's cited sources.
- The portfolio-to-action link (`actions` count per holding) uses an artificial modulo-200 seed
  match rather than a genuine entity-identity join — no real portfolio holding is actually "linked"
  to a real enforcement action.
- `EE = Σ(fine×sector_relevance)/peer_count` (the guide's formula) is not implemented; the closest
  analogues (`heatScore`, `portfolioScore`) measure different things (action density; weighted
  compliance score) and are not reconciled with each other.
- Guide's YTD headline figures (28 actions, €94M fines, 54% greenwashing) cannot be reproduced
  deterministically from this file without running it (results depend on the full 200-row seeded
  draw filtered to a specific year), so they should be treated as illustrative targets rather than
  values this code is guaranteed to reproduce.

**Framework alignment:** ESMA Greenwashing Progress Report (2023) / FCA Dear Chair Letter on
Greenwashing (2021) — cited as guide sources; the violation-category taxonomy (Greenwashing,
Failure-to-Disclose, ESG Rating Manipulation, etc.) is consistent with the themes those reports
actually cover, though no data is drawn from them · SEC Climate and ESG Task Force — referenced,
not linked to any real SEC enforcement action record.
