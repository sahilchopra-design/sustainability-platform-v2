## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines the scoring engine as
> `Severity = max(Category_weight × Reach_score × Novelty_factor)` with a RepRisk-style rolling 24-month
> Reputational Risk Index (RRI), NLP signal classification, and a time-decaying novelty factor. **None of
> that scoring machinery exists in the code.** Severity here is a **curated 1–5 field** on 20 hand-entered
> real controversies; there is no category-weight × reach × novelty product and no RRI. What the module
> *does* add on top of the curated feed is a genuinely useful piece: **rule-based auto-alert generation
> from the live portfolio** — deterministic flags triggered by real holding attributes (transition risk,
> Scope 1 without SBTi, GHG intensity, physical risk). The sections below document that; §8 specifies the
> RepRisk-style RRI the guide advertises.

### 7.1 What the module computes

Two data sources merge into one event stream: the curated `CONTROVERSY_DB` (20 events) and
`autoAlerts = generatePortfolioAlerts(holdings)`. Portfolio impact is then aggregated over matched events:

```js
allEvents = [...CONTROVERSY_DB, ...autoAlerts]
matched   = allEvents ∩ portfolio (by ticker / company name)
totalWeightAtRisk   = Σ matched.portfolioWeight        // % of portfolio touched by a controversy
totalExposureAtRisk = Σ matched.portfolioExposure      // $Mn
totalEsgImpact      = Σ matched.esgImpact              // sum of curated ESG-impact points (negative)
```

`esgImpact` is a **curated per-event integer** (−2 to −10); `severity` is a curated 1–5. Neither is
derived. The only *derived* records are the auto-alerts (§7.3).

### 7.2 Parameterisation / scoring rubric

**Auto-alert trigger rules** (deterministic, over real holding fields):

| Rule | Trigger condition | Assigned severity | esgImpact |
|---|---|---|---|
| High transition risk | `transition_risk ∈ {high, very high}` | 4 | −5 |
| Material emitter, no SBTi | `!sbti_committed AND scope1_co2e > 1,000,000` | 3 | −3 |
| High GHG intensity | `ghg_intensity_tco2e_cr > 50` | 3 | −4 |
| High physical risk | `physical_risk ∈ {high, very high}` | (see code) | — |

| Curated field | Values | Provenance |
|---|---|---|
| `severity` | 1–5 (Critical…Minimal) | Curated per real incident |
| `esgImpact` | −2…−10 | Curated editorial score |
| `RECOMMENDATIONS[sev]` | text by severity | Hard-coded advisory ladder (Sev 5 → "consider divestment ≤6mo") |

The 20 `CONTROVERSY_DB` events are **real 2024 incidents** (TotalEnergies Mozambique, Vale Brumadinho, Rio
Tinto tailings, Glencore DRC child labour, Adani Carmichael…) with named sources (Reuters, FT, ShareAction).

### 7.3 Calculation walkthrough

1. `loadPortfolio()` reads the active portfolio from `localStorage` (`ra_portfolio_v1`).
2. `generatePortfolioAlerts` iterates holdings and pushes an alert per rule breached — severity/impact are
   fixed per rule, headline interpolates the real metric (e.g. "Scope 1: 12.34 Mt CO₂e").
3. `allEvents` merges curated + auto alerts; `portfolioExposure` matches events to holdings by ticker
   (then company name) and sums weight, $ exposure, and ESG impact.
4. Charts group by severity, category (E/S/G), month, and status; a watchlist persists selected events.

### 7.4 Worked example

A holding with `transition_risk = "High"`, `scope1_co2e = 12,300,000`, `sbti_committed = false`,
`weight = 3.2%`, `exposure_usd_mn = 48`:
- Rule 1 fires → alert severity 4, impact −5, headline "High transition risk (High) — portfolio exposure 3.2%".
- Rule 2 fires → `scope1Mt = (12,300,000/1e6).toFixed(2) = 12.30`, alert severity 3, impact −3.
Both alerts match the holding, contributing `3.2% + 3.2% = 6.4%` to `totalWeightAtRisk`, `$96Mn` to
exposure-at-risk, and `−8` to `totalEsgImpact`. The severities are *assigned by rule*, not computed from
category × reach × novelty.

### 7.5 Companion analytics on the page

Live feed (curated + auto alerts, filterable by severity/category/status), portfolio-exposure panel
(weight/exposure/ESG impact at risk), severity and category charts, monthly trend, a watchlist, and CSV
export of watchlisted or portfolio-matched events. Uses `GLOBAL_COMPANY_MASTER`/`globalSearch` for
company resolution. No backend engine or route — all client-side.

### 7.6 Data provenance & limitations

- **Curated real events + rule-based auto-alerts.** No `sr()` PRNG. Curated events are a frozen 2024
  snapshot (not a live news feed); auto-alerts are as fresh as the loaded portfolio's attributes.
- `severity` and `esgImpact` are **editorial**, so `totalEsgImpact` is a sum of hand-assigned points, not a
  modelled reputational or financial index.
- No RRI, no NLP, no reach/novelty scoring — the guide's real-time-signal machinery is absent; the "feed"
  is static + deterministic.

**Framework alignment:** The severity ladder and E/S/G categorisation echo *MSCI ESG Controversy* and
*RepRisk* conventions (1–5 severity, environment/social/governance pillars). The auto-alert rules encode
*Climate Action 100+* / *SBTi* engagement logic (material emitter without a validated target) and
*transition/physical risk* screening. *GRI 2-26* (grievance/remediation) and *UNGPs* are referenced as the
remediation-tracking basis, though remediation status here is a curated field, not tracked to closure.

---

## 8 · Model Specification — Reputational Risk Index (RepRisk-style RRI)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Produce a continuous 0–100 reputational risk index per issuer from a stream of dated controversy signals,
so PMs can rank exposure and detect deteriorating names before rating agencies react. Coverage: any issuer
with a monitorable news/NGO/regulatory signal feed.

### 8.2 Conceptual approach
Replicate the **RepRisk Index (RRI)** construction: each incident contributes a severity- and
reach-weighted, novelty-scaled increment to a rolling 24-month peak-decayed index. This is the industry
reference (RepRisk RRI) and aligns with the **MSCI ESG controversy** flag logic (category materiality ×
severity) — a signal-accumulation model with time decay, not a single curated number.

### 8.3 Mathematical specification
```
Incident score:  s_i = CategoryWeight_c × Reach_i × Novelty_i × Severity_i
  Reach_i   ∈ {1 local, 2 national, 3 global}
  Novelty_i = 1 if first occurrence, decays 0.5^(repeats)  (repeated stories add less)
RRI_t = clamp( max over trailing 24m of [ Σ_i s_i · exp(−ln2·(t−t_i)/H) ] , 0 , 100 )
  H = signal half-life (≈6 months)
```
| Parameter | Symbol | Calibration source |
|---|---|---|
| Category weights | `CategoryWeight_c` | ESRS/SASB materiality (guide: human rights 5.0, labour 4.5…) |
| Reach | `Reach_i` | Source breadth (local/national/global) — RepRisk convention |
| Novelty decay | `Novelty_i` | Repeat-story dampening |
| Half-life | `H` | ~6 mo (RRI temporal decay) |
| Severity | `Severity_i` | 1–5 (as in code) |

### 8.4 Data requirements
A live signal feed (news APIs, NGO publications, regulatory filings) with source, date, and issuer link;
NLP classification into E/S/G category + reach; issuer identity resolution. The platform has issuer
resolution (`globalSearch`) and severity/category conventions; the missing pieces are the live feed and
NLP tagging. RepRisk/MSCI can supply RRI as a benchmark.

### 8.5 Validation & benchmarking plan
Reconcile computed RRI against RepRisk RRI on overlapping issuers (target rank correlation > 0.7);
backtest whether RRI spikes lead ESG-rating downgrades and controversy-driven drawdowns (link to the
`controversy-rating-impact` module). Sensitivity on half-life and category weights; stability on repeated
stories via the novelty term.

### 8.6 Limitations & model risk
News-volume bias inflates large-cap RRI (more coverage ≠ more risk) — normalise by baseline coverage.
NLP misclassification and duplicate stories distort accumulation; dedupe and human-verify high-severity
flags. Conservative fallback: cap auto-generated RRI increments and require verified-source confirmation
before a signal contributes above severity 3.
