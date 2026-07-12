# Controversy Monitor
**Module ID:** `controversy-monitor` · **Route:** `/controversy-monitor` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides real-time ESG controversy monitoring across investee companies with severity scoring, reputational risk flags, and automated alerting. Aggregates controversy signals from news, NGO publications, regulatory filings, and social media to provide a comprehensive incident tracking dashboard.

> **Business value:** Enables ESG teams and portfolio managers to stay ahead of reputational and regulatory risks in real time, prioritise stewardship interventions, and demonstrate active oversight of ESG incidents to clients and regulators.

**How an analyst works this module:**
- Configure watchlist of investee companies and alert thresholds in Settings
- Live Feed tab shows real-time controversy signals with severity classification and source links
- Company Scorecard tab shows full controversy history and RepRisk-style risk index trend
- Category Breakdown tab groups controversies by E/S/G pillar and SASB topic
- Set severity threshold alerts for immediate email/Slack notification
- Remediation Tracker tab records company responses and tracks closure progress

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CATEGORY_COLORS`, `CONTROVERSY_DB`, `CustomBarTooltip`, `CustomPieTooltip`, `PIE_COLORS`, `RECOMMENDATIONS`, `SEVERITY_COLORS`, `SEVERITY_LABELS`, `STATUS_COLORS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CONTROVERSY_DB` | 21 | `company`, `ticker`, `date`, `category`, `severity`, `headline`, `source`, `status`, `esgImpact`, `sector` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `scope1Mt` | `((c.scope1_co2e \|\| 0) / 1e6).toFixed(2);` |
| `csv` | `[keys.join(','), ...rows.map(r => keys.map(k => {` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `formatDate` | `(d) => { const dt = new Date(d); return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };` |
| `autoAlerts` | `useMemo(() => generatePortfolioAlerts(holdings), [holdings]);  /* ── All events = hardcoded + auto-generated ── */ const allEvents = useMemo(() => [...CONTROVERSY_DB, ...autoAlerts], [autoAlerts]);` |
| `totalExp` | `holdings.reduce((s, h) => s + (h.exposure_usd_mn \|\| 0), 0) \|\| 1;` |
| `totalWeightAtRisk` | `matched.reduce((s, c) => s + c.portfolioWeight, 0);` |
| `totalExposureAtRisk` | `matched.reduce((s, c) => s + c.portfolioExposure, 0);` |
| `totalEsgImpact` | `matched.reduce((s, c) => s + c.esgImpact, 0);` |
| `key` | ``${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;` |
| `watchlistedEvents` | `useMemo(() => allEvents.filter(c => watchlist.includes(c.id)), [allEvents, watchlist]);  /* ── Export helpers ── */ const exportControversyReport = () => { const rows = filtered.map(c => { const pe = portfolioExposure.items.find(p => p.id === c.id);` |
| `rows` | `watchlistedEvents.map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CONTROVERSY_DB`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Active Controversies | — | RepRisk / Media | Number of active (unresolved) ESG controversies per company in the monitoring universe |
| Peak Severity Score | — | Scoring model | Maximum severity of any active controversy; 5 = global human rights/environmental catastrophe |
| Reputational Risk Index | — | RepRisk RRI | Rolling 24-month composite reputational risk score derived from controversy volume and severity |
| Alert Velocity | — | News monitoring | Rate of new controversy signals; spike detection triggers immediate analyst notification |
| Remediation Progress | — | Company disclosures / GRI | Proportion of identified remediation actions completed for active controversies |
- **News APIs / NGO publications / regulatory filings** → NLP classification by E/S/G category, severity scoring → **Structured controversy signal feed**
- **Social media and litigation databases** → Match to LEI/company universe, compute reach and novelty → **Company-level controversy log**
- **Company remediation disclosures (GRI, UNGP)** → Track commitments, verify closure evidence → **Remediation progress tracker per controversy**

## 5 · Intermediate Transformation Logic
**Methodology:** Controversy Severity Scoring
**Headline formula:** `Severity = max(Category_weight × Reach_score × Novelty_factor)`

Category weights reflect ESRS/SASB materiality hierarchy: Environment (E) human rights violations = 5.0, labour rights = 4.5, product safety = 4.0, environmental damage = 3.5–4.8. Reach score (1–3) reflects media coverage breadth: local/national/global. Novelty factor decays over time as controversy becomes priced in. ESG risk index = rolling 24-month peak severity.

**Standards:** ['RepRisk Methodology', 'MSCI ESG Controversy Framework', 'GRI 2-26 Remediation']
**Reference documents:** RepRisk ESG Intelligence Methodology 2024; MSCI ESG Controversy Assessment Framework; GRI Standard 2-26 Mechanisms for Seeking Advice and Raising Concerns; UN Guiding Principles on Business and Human Rights

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live signal ingest with the computed severity product (analytics ladder: rung 1 → 2)

**What.** The monitor's two honest components — 20 curated real 2024 incidents with
named sources, and deterministic auto-alert rules over real holding attributes
(no-SBTi + >1 MtCO₂e Scope 1, high transition/physical risk) — are frozen or
rule-bound. §7's flag: the guide's scoring engine
`Severity = max(Category_weight × Reach_score × Novelty_factor)` and the RepRisk-style
24-month rolling index don't exist; severity is a curated field and the "live feed" is
static. Evolution A builds the ingestion and scoring pipeline so the feed actually
moves.

**How.** (1) Ingest: GDELT (free, keyless) as the news-signal source, filtered to
watchlist entities resolved through the GLEIF spine, landing in a
`controversy_signals` table via the ingestion framework — replacing the frozen
snapshot with dated events. (2) Scoring: implement the guide's product — category
weights from the ESRS/SASB hierarchy it specifies (human rights 5.0, labour 4.5…),
reach from source-count/geography breadth in the ingest, novelty decaying by
recurrence — each factor visible in the event drill-down, replacing the curated
1–5 with a decomposable score (curated events keep their editorial severity as a
labelled second opinion). (3) RRI: rolling 24-month peak severity per company, the
trend line the Company Scorecard tab promises. (4) The auto-alert rules stay
deterministic — they are a strength, not a gap.

**Prerequisites.** Entity-resolution quality on news mentions (GLEIF fuzzy matching
exists but news aliases are noisy — precision threshold before auto-display); alert
notification plumbing if the Settings promise of email/Slack is kept.
**Acceptance:** a new watchlist company accrues signals within a day; each severity
score decomposes into its three factors in the UI; RRI reproduces from the stored
signal history.

### 9.2 Evolution B — Signal triage analyst: classify, dedupe, and brief (LLM tier 2)

**What.** The gap between raw news volume and the module's clean event schema is
classification work — the guide even names NLP as the intended mechanism. Evolution B
puts the LLM at that seam: incoming GDELT signals get classified (E/S/G pillar,
controversy type from the module's category list, affected entity confirmation,
duplicate-of-existing-event detection) with a confidence score; low-confidence items
queue for human review rather than auto-publishing. On demand, the analyst drafts the
stewardship brief for a matched holding: event history, RRI trajectory, the
triggered auto-alert rules, and the module's severity-laddered recommendation —
citing each signal's source.

**How.** Tier-2 tooling over Evolution A's signal store: read tools for
signals/events/RRI, a gated write tool for confirming classifications into
`CONTROVERSY_DB`-successor records (human confirm per the roadmap's mutation
contract). Classification prompts ground on the category-weight taxonomy and the 20
curated events as few-shot exemplars. The fabrication rule is provenance-shaped:
every event in a brief must reference an ingested signal URL or a curated record —
the model never "recalls" controversies from training data into the feed.

**Prerequisites (hard).** Evolution A's ingest (there is nothing to classify today);
review-queue UI for low-confidence classifications. **Acceptance:** classification
precision ≥90% on a 50-signal hand-labelled test set before auto-publish is enabled;
briefs contain only signals present in the store; training-data-recalled events
(present in the model, absent from the store) are correctly refused.