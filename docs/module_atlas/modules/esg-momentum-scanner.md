# ESG Momentum Scanner
**Module ID:** `esg-momentum-scanner` · **Route:** `/esg-momentum-scanner` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Detects ESG rating upgrade and downgrade momentum signals across equity and credit universes by analysing rating trajectory, revision frequency, and leading indicator dynamics. Combines provider rating change histories with underlying KPI trend data to generate early-warning signals ahead of formal rating revisions. Supports alpha generation, risk monitoring, and engagement prioritisation for active ESG investors.

> **Business value:** Enables active ESG investors to systematically identify rating inflection points before the market prices them in, generating alpha from ESG momentum while simultaneously improving engagement prioritisation and portfolio risk management.

**How an analyst works this module:**
- Set universe (equity index, credit benchmark, or custom watchlist) and connect ESG rating provider feeds.
- Configure momentum window (3/6/12 months), signal threshold (σ level), and leading indicator weights.
- Review momentum scanner output sorted by signal strength; filter by sector, region, or current rating tier.
- Set alert thresholds for real-time monitoring and integrate upgrade/downgrade signals into portfolio review workflow.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `Badge`, `ControversyRecovery`, `CustomDot`, `CustomScatterTooltip`, `EngagementAlpha`, `ImprovLeaderboard`, `KpiCard`, `MomentumOverview`, `SectionHeader`, `SectorRotation`, `SignalBadge`, `SignalBuilder`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `handleSort` | `(col) => setSort(s => ({ col, dir: s.col === col ? -s.dir : 1 }));` |
| `hit` | `Math.min(65, Math.round(58 + (eW - 40) / 10));` |
| `improvement` | `c.esgAfter - c.esgBefore;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| ESG Momentum Z-Score | — | Platform Momentum Engine | Standardised momentum signal; /Z/>1.5 constitutes actionable signal for engagement or portfolio adjustment. |
| Rating Change Frequency (events/year) | — | MSCI/Sustainalytics | Number of formal ESG rating revisions in trailing 12 months; high frequency issuers have less signal value due to noise. |
| Leading Indicator Composite Score | — | CDP / MSCI Controversy | Forward-looking adjustment factor based on CDP disclosure quality change, controversy events, and governance changes. |
| Signal Accuracy Rate (%) | — | Backtested 2018â€“2024 | Historical accuracy of momentum Z>1.5 signals in predicting formal rating upgrade within 12 months; benchmark for signal efficacy. |
- **MSCI/Sustainalytics/ISS ESG score time series** → Compute rolling Δscore at 3, 6, 12-month windows; normalise by historical score volatility → **ESG momentum Z-score per issuer and window**
- **CDP disclosure score annual data** → Detect year-on-year disclosure quality improvement or decline → **Leading indicator adjustment factor (+/− 0â€“20 points)**
- **RepRisk controversy feed** → Flag ESG controversy peaks preceding rating downgrades; train logistic signal model → **Controversy-informed downgrade probability (%)**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Momentum Signal
**Headline formula:** `ESG_Mom = Σ(w_p × ΔScore_p) / σ_hist`

Computes a provider-weighted ESG score change velocity normalised by historical score volatility. Positive signals (>+1σ) indicate upgrade momentum; negative (<−1σ) indicate downgrade risk. Leading indicators â€” CDP disclosure score changes, controversy frequency, board composition shifts â€” are incorporated as forward-looking adjustment factors applied to trailing momentum signal.

**Standards:** ['MSCI ESG Momentum Methodology 2023', 'Sustainalytics Rating Change Framework', 'Academic: Verheyden et al. 2016']
**Reference documents:** Verheyden et al. â€” ESG for All? The Impact of ESG Screening on Return, Risk, and Diversification (2016); MSCI ESG Momentum Factor Methodology 2023; Sustainalytics Rating Methodology Overview 2024; Friede et al. â€” ESG and Financial Performance Meta-Analysis 2015

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes an **ESG Momentum Signal**
> `ESG_Mom = Σ(w_p·ΔScore_p)/σ_hist` — a provider-weighted score-change velocity normalised by
> historical score volatility, producing a Z-score with leading-indicator adjustments. **No z-score,
> no volatility normalisation, and no leading-indicator model exist.** The page is a **curated
> demonstration**: real company names (Ørsted, Vestas, Glencore…) with hand-coded ESG-before/after
> scores, ranks, and pre-baked "signal" values, plus one **toy interactive signal builder** whose
> "information coefficient" and "hit rate" are heuristic formulas, not backtested statistics.

### 7.1 What the module computes

Two genuine (but trivial) computations plus one toy heuristic:

```js
improvement = esgAfter − esgBefore                      // Controversy-recovery tab, curated data
chg         = esg − esgPrior                            // Improvers leaderboard, curated data (pre-stored)
// Signal Builder (interactive, heuristic):
ic  = (0.08 × ( eW/40 + (30−|sW−30|)/30 + (30−|gW−30|)/30 ) / 3).toFixed(2)   // "information coefficient"
hit = min(65, round(58 + (eW − 40)/10))                 // "hit rate %"
```

The `ic`/`hit` formulas reward balancing E/S/G weights near a preset ideal (E≈40, S≈30, G≈30) — they
are **UX responsiveness heuristics**, not derived from any return series.

### 7.2 Parameterisation (curated, not synthetic PRNG)

| Table | Content | Nature |
|---|---|---|
| `scatterData` (20) | ESG-momentum x vs return y per real company, quadrant tag | hand-placed narrative (Ørsted top-right, Glencore bottom-left) |
| `improversData` (20) | rank, esg, esgPrior, chg, ret, sig | curated leaderboard; `chg = esg − esgPrior` |
| `recoveryData` (8) | company, issue, months, esgBefore/After, retVsBench | curated controversy-recovery cases |
| `sectorData` | sector momentum + Bullish/Bearish signal | curated sector-rotation view |
| Signal Builder weights | E/S/G sliders (default 40/30/30) | user input → `ic`/`hit` heuristic |

There is **no PRNG in this module** — but "no PRNG" here means "hand-authored constants", not "real
data". The company narratives are plausible (renewables improving, fossil/materials deteriorating) but
illustrative.

### 7.3 Calculation walkthrough

1. Overview tab: `scatterData` plotted on momentum×return axes; quadrant colours from `q` tag.
2. Improvers tab: `improversData` sorted by `chg`/`sig`; `improvement = esgAfter − esgBefore` shown.
3. Controversy-recovery tab: `recoveryData` shows ESG trajectory and return-vs-benchmark post-issue.
4. Sector-rotation tab: `sectorData` sorted by momentum; top-3 Bullish = overweights, bottom-2 Bearish.
5. Signal-builder tab: E/S/G weight sliders feed `ic` and `hit` heuristics; a line chart of `ic`.
6. Engagement-alpha tab: hard-coded "+5.7% avg outperformance" KPI.

### 7.4 Worked example — Volkswagen improvement & signal builder

Improvers rank 1: VW `esg=62, esgPrior=48` → `chg = 62 − 48 = +14.0` (largest score gain), `sig=9.1`
(pre-stored). Signal builder at defaults `eW=40, sW=30, gW=30`: `ic = (0.08×(40/40 + (30−0)/30 +
(30−0)/30)/3) = (0.08×(1+1+1)/3) = 0.08×1 = 0.08` → IC 0.08; `hit = min(65, round(58 + (40−40)/10)) =
58%`. Raising `eW` to 60 gives `hit = min(65, round(58 + 2)) = 60%` but degrades `ic` (weights unbalanced) — the toy trade-off. None of this touches a return series.

### 7.5 Data provenance & limitations

- **All data is hand-curated constants**, not live provider feeds and not `sr()`-synthetic. Company
  ESG scores, momentum values and "signals" are authored for demonstration.
- `chg`/`improvement` are correct subtractions but on stored numbers; there is no rolling Δscore, no
  provider weighting, no `/σ_hist` normalisation — the guide's core z-score is absent.
- `ic`/`hit` are heuristics that reward slider balance, not backtested signal-accuracy statistics
  (the guide's "signal accuracy rate, backtested 2018–2024" is not computed).
- The engagement-alpha "+5.7%" is a hard-coded figure.

**Framework alignment:** the guide cites **MSCI ESG Momentum (2023)**, **Sustainalytics rating-change
framework** and **Verheyden et al. (2016)**. Real ESG-momentum factors rank issuers on the *change* in
provider ESG score over a trailing window (MSCI: 12-month rating trend), normalised cross-sectionally;
this module presents the *idea* (improvers vs deteriorators) with curated data but implements none of
the statistical machinery.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Generate a standardised ESG-momentum signal (Z-score) per issuer that
anticipates formal rating revisions, for alpha generation and engagement prioritisation.

**8.2 Conceptual approach.** Provider-weighted score-change velocity normalised by issuer-specific
historical score volatility, with CDP/controversy leading-indicator overlays — mirroring **MSCI ESG
Momentum** and Sustainalytics rating-change methodology.

**8.3 Mathematical specification.**
- ΔScore per provider p over window w: `Δ_p = Score_{p,t} − Score_{p,t−w}`.
- Momentum: `M_i = Σ_p w_p·Δ_p`, weights `w_p` by provider coverage/accuracy.
- Normalisation: `Z_i = M_i / σ_i^{hist}`, `σ_i^{hist}` = std of trailing 24-month Δ for issuer i.
- Leading-indicator adjustment: `Z'_i = Z_i + Σ_k λ_k·LI_{k,i}` (CDP disclosure Δ, controversy
  frequency, board-change flags), `λ_k` fitted by logistic regression on realised upgrades.
- Actionable when `|Z'_i| > 1.5`.

| Parameter | Source |
|---|---|
| Provider scores | MSCI / Sustainalytics / ISS time series |
| σ^hist window | 24 months |
| Leading indicators | CDP scores, RepRisk controversies, BoardEx changes |
| λ_k, threshold | logistic fit on 2018–2024 rating revisions (guide's stated backtest) |

**8.4 Data requirements.** Multi-provider ESG score history (≥3 yr), CDP annual scores, controversy
feed, board-change events. None present; module holds only curated snapshots.

**8.5 Validation & benchmarking plan.** Signal-accuracy: fraction of `Z'>1.5` names upgraded within
12 months; IC of Z' vs forward returns; benchmark against MSCI ESG-momentum factor returns.

**8.6 Limitations & model risk.** Provider score changes are lumpy (annual reviews) → noisy Δ; short
history limits σ^hist; leading-indicator overfitting; rating-change look-ahead must be controlled.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the momentum Z-score from persisted rating history (analytics ladder: rung 1 → 3)

**What.** The §7 flag: the guide's `ESG_Mom = Σ(w_p·ΔScore_p)/σ_hist` — score-change velocity normalized by historical volatility, with leading-indicator adjustments — is unimplemented. The page is a *curated demonstration*: real names (Ørsted, Vestas, Glencore) with hand-coded before/after scores and pre-baked signals, plus a toy signal builder whose "information coefficient" and "hit rate" are UX heuristics rewarding weights near a preset ideal (E≈40/S≈30/G≈30), not backtested statistics. Evolution A builds the real scanner — which needs, above all, a *rating history store*.

**How.** (1) `esg_score_history` table (entity × provider × pillar × score × date) — the shared substrate this module, `esg-ratings-hub`, and `esg-time-series-forecaster` all lack; build it once, refresh from whatever provider feeds are licensed plus public CDP scores. (2) `services/esg_momentum_engine.py`: rolling Δscore at 3/6/12 months, normalized by each issuer's own score volatility → genuine Z-scores with the ±1.5σ actionable threshold from §4. (3) Leading indicators from platform siblings: controversy events from `esg-controversy`'s incident store, disclosure-quality deltas from CDP history — as documented adjustment factors. (4) Rung 3: the "signal accuracy rate" the page currently asserts becomes measured — backtest Z>1.5 signals against subsequent formal rating changes in the stored history and publish hit rates; retire the toy `ic`/`hit` heuristics or clearly label them illustrative.

**Prerequisites (hard).** ≥12 months of accumulated score history before any Z-score renders (honest-nulls until then — momentum without history is fabrication); provider licensing. **Acceptance:** a fixture issuer's Z-score reproduces the formula from stored history; the published hit rate comes from the backtest job; the curated before/after tables are either replaced or labeled historical case studies.

### 9.2 Evolution B — Signal-triage copilot for portfolio review meetings (LLM tier 2)

**What.** A tool-calling copilot for the weekly review: "which holdings have actionable downgrade momentum, what's driving each, and which should go to the engagement list vs the risk watchlist?" It queries Evolution A's scanner output, decomposes each signal (which provider's Δscore, which window, what leading-indicator adjustment), pulls the associated controversy events for context, and drafts the review-meeting one-pager with routing suggestions tied to documented thresholds (|Z|>1.5 actionable, per the module's own definition).

**How.** Tools: `scan_universe(filters)`, `get_signal_detail(entity)`, `get_score_history(entity, provider)`, `get_incidents(entity)` (from esg-controversy). Grounding corpus = this Atlas record's §5 formula and threshold conventions. Routing logic is transparent rule application (downgrade momentum + open controversy → engagement candidate; momentum without event → monitor), narrated with the triggering values. The backtested accuracy rate accompanies every signal presentation — users deserve to know the base rate before acting.

**Prerequisites (hard).** Evolution A with accumulated history — triaging the current hand-coded signals would dress curated examples as live monitoring. **Acceptance:** a golden scan's triage list matches the rule application to engine outputs; every Z-score and driver quoted matches tool responses; signals below threshold are never escalated by narrative enthusiasm.