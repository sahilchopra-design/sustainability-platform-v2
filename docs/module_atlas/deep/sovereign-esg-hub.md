## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (cross-module inconsistency).** The guide's formula
> `(E×0.35)+(S×0.35)+(G×0.30)` is not implemented — `esgScore` is a **single hand-typed field per country**,
> not a weighted sum of separate E/S/G pillar scores (no E/S/G sub-fields exist in this module's dataset,
> unlike its sibling `sovereign-esg`, which does carry 3 separate pillar scores). Furthermore, **this
> module's `COUNTRIES` table and `sovereign-esg`'s `SOVEREIGN_DB` are two independently hand-curated datasets
> covering overlapping countries with materially different scores** — e.g. Germany shows `composite=90` in
> `sovereign-esg` (avg of climate 88/social 92/governance 91) but `esgScore=82` in this module; the platform
> has no single source of truth for sovereign ESG scoring across its two sovereign-ESG modules.

### 7.1 What the module computes

`COUNTRIES` (61 real, named countries, **no `sr()` PRNG**) carries a single `esgScore` (0–100), `physicalRisk`
(0–100, higher=worse), an NDC letter rating (A–D, Climate Action Tracker-style) with a paired `ndcScore`
(0–100), `debtToGdp`, `climateVuln`, `carbonRev` ($Bn — apparent fossil/carbon-related government revenue
exposure), `debtRisk` (0–100), `greenBondBnUSD` (cumulative green bond issuance), and real sovereign credit
rating. A companion `PORTFOLIO` (20 positions, real country names) carries portfolio weight % and a subset
of the same per-country fields, apparently independently re-typed rather than joined from `COUNTRIES` (see
limitations).

### 7.2 Parameterisation

| Field | Illustrative values | Provenance |
|---|---|---|
| `esgScore` | Norway 88 (highest), Venezuela 18 (lowest) | hand-typed, plausible ordering (Nordic countries at the top, distressed-sovereign-rated countries at the bottom) |
| `physicalRisk` | Bangladesh 90 (highest), Norway 22 (lowest) | plausible ordering consistent with known climate-vulnerability geography (South/Southeast Asia high, Nordic Europe low) |
| `ndcRating`/`ndcScore` | correlated pair, e.g. Norway A/85, Pakistan D/28 | consistent internal correlation between the letter grade and the numeric score |
| `carbonRev` ($Bn) | China 148.2 (highest, reflecting economy size not necessarily fossil-intensity), Saudi Arabia 44.2, USA 88.4 | plausible in scale for major economies but the field's exact definition (government fossil-fuel revenue? carbon-related tax revenue? total carbon-exposed economic activity?) is not documented in the code — ambiguous units |
| `sovereignRating` | real S&P-style letter ratings matching known sovereign credit conditions (Venezuela SD, Lebanon SD, Norway AAA) | consistent with real-world credit conditions as of data curation |
| `PORTFOLIO` weights | 20 positions summing to roughly 100% (largest: USA 12.8%, Japan 9.2%, China 8.8%) | plausible global sovereign-bond-portfolio weighting |

### 7.3 Calculation walkthrough

- **Portfolio-level KPIs**: `portfolioEsgAvg`/`portfolioPhysAvg` are correctly weight-averaged (not simple
  means) over the 20 `PORTFOLIO` positions: `Σ(esgScore×weightPct)/Σ(weightPct)` — proper AUM-weighting.
- **`totalGreenExposure`**: sums `greenBondExposureMnUSD` across the portfolio, converted to $Bn — a
  correct aggregation of a portfolio-level (not country-level) field.
- **Comparator radar tool**: lets a user pick up to 4 countries (`comparatorA/B/C/D`) and builds a
  multi-axis radar (`ESG Score`, `NDC Score`, `Phys Safety = 100−physicalRisk` (correctly inverted so higher
  is always better across all radar axes), plus additional axes not fully captured in this excerpt) —
  correct axis-normalisation logic.
- **Alerts/Research/Board Risks tables**: descriptive reference content (16 alert entries, 11 research
  citations, 6 board-level risk flags) — not derived from the `COUNTRIES` scoring data.

### 7.4 Worked example (portfolio ESG average)

Using the first 5 `PORTFOLIO` rows: Germany (8.4%, esg 82), France (7.2%, esg 80), Netherlands (5.8%, esg
84), UK (6.4%, esg 79), Japan (9.2%, esg 73):

| Step | Computation | Result |
|---|---|---|
| Σ weight×esg | 8.4×82 + 7.2×80 + 5.8×84 + 6.4×79 + 9.2×73 | 688.8+576+487.2+505.6+671.6 = 2,929.2 |
| Σ weight | 8.4+7.2+5.8+6.4+9.2 | 37.0 |
| Weighted avg (5-row subset) | 2,929.2/37.0 | **79.2** |

Correctly weight-averaged — a materially lower-ESG country with a large weight (e.g. hypothetically China at
8.8%/esg 46, included in the full 20-row calculation) would pull the true full-portfolio average below this
5-row illustrative subset.

### 7.5 Data provenance & limitations

- **All country ESG/physical-risk/NDC/debt data is hand-curated, single-point-in-time, plausible estimates**
  — not live-sourced, and (per the mismatch flag) **inconsistent with the platform's other sovereign-ESG
  module** (`sovereign-esg`) for the same countries.
- **`esgScore` cannot be decomposed or audited** — no separate E/S/G pillar fields exist in this module,
  unlike `sovereign-esg`'s 3-pillar structure, despite the guide describing a pillar-weighted formula.
- `carbonRev`'s exact definition is ambiguous from the code alone (field name suggests carbon/fossil revenue
  exposure but the values scale with total economy size, e.g. China highest at $148.2Bn, more consistent
  with total government revenue scale than fossil-specific exposure).
- `PORTFOLIO` appears to be a separately hand-typed subset rather than a live join against `COUNTRIES` —
  cross-checking a few values (Germany esg 82 in both tables) shows they happen to match, but this is not
  guaranteed to hold for all 20 portfolio positions without a structural join.

### 7.6 Framework alignment

- **MSCI Sovereign ESG Methodology / Sustainalytics Country Risk** — cited in the guide as the pillar-
  weighting basis; the module does not implement a decomposable E/S/G structure to actually apply such
  weights.
- **World Bank Worldwide Governance Indicators / UNDP HDI / ND-GAIN** — cited as data sources; not present as
  distinct fields in this module (contrast with `sovereign-esg`, which does carry ND-GAIN vulnerability/
  readiness sub-indices).
- **Climate Action Tracker-style NDC letter grades** — the A–D rating scale is directionally consistent with
  real NDC-ambition assessment frameworks, correctly paired with a numeric score.
- Given this module and `sovereign-esg` cover overlapping ground with divergent numbers, a production
  remediation should **consolidate into a single sovereign ESG scoring pipeline** (ideally the more granular,
  decomposable `sovereign-esg` 3-pillar structure) rather than maintaining two independently-curated
  datasets across the platform.
