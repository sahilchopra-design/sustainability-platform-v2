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
