## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (tier A) describes an **Internal Composite ESG Rating**
> `ICR = Σ(w_p × Provider_p) + Δ_analyst` — a *weighted* provider blend plus a stored analyst-override
> workflow with rationale, evidence and reviewer sign-off. **No weighting and no override workflow
> exist.** The frontend's composite is a plain **mean of provider rating-scale indices**, and the
> "150 companies" are `sr()`-synthetic (real names/tickers, seeded ratings), though the module *does*
> honour missing coverage honestly and supports an India real-data adapter. A rigorous backend
> (`esg_ratings_engine.compute_composite_rating`) exists but the frontend does **not** call it (0
> axios/fetch). §8 specifies the weighted ICR + analyst-overlay the guide names.

### 7.1 What the module computes

Per company (from `COMPANY_NAMES`/`TICKERS`, 150 real large-caps):

```js
// Each provider present ~85% of the time (honest coverage gap):
if (sr(i*100+pi*13) > 0.15) ratings[p] = RATING_SCALE[floor(sr(i*17+pi*31)*7)]   // AAA..CCC
numScores = present ratings mapped to index 0(AAA)..6(CCC)
avgNum    = mean(numScores) || 3                          // composite index (equal-weighted)
avgRating = RATING_SCALE[round(avgNum)]                   // → letter
maxDivergence = max(numScores) − min(numScores)           // range in notches
lastQ     = history[-1].score − history[-2].score
momentum  = lastQ>0.2 Upgrade · <−0.2 Downgrade · else Stable
```

Coverage (`covCount`), 12-quarter score history (`avgNum` + `sr()` drift), controversies, greenwash
flag and alerts are all `sr()`-driven. Portfolio KPIs aggregate coverage, divergence and momentum.

### 7.2 Parameterisation

| Element | Source |
|---|---|
| `PROVIDERS` (6): MSCI, S&P Global, Sustainalytics, ISS ESG, CDP, Refinitiv | real providers |
| 150 `COMPANY_NAMES` + `TICKERS` | curated real large-caps (AAPL, MSFT, SHEL…) |
| Provider ratings | `sr()` on RATING_SCALE (AAA–CCC); ~15% honestly missing |
| Composite | **equal-weighted mean of indices** (not the guide's `Σ w_p·Provider_p`) |
| Divergence | max−min notches |
| India mode | `isIndiaMode() ? adaptForESG() : synthetic` — real Indian-issuer data when toggled |
| CONTROVERSIES (90), ALERTS (30) | `sr()`-synthetic event feeds |

Note the low-coverage gate (`> 0.15`) is a nice touch — it models real-world incomplete provider
coverage rather than fabricating a full grid.

### 7.3 Calculation walkthrough

1. 150 companies built from `sr()`; each provider included probabilistically (coverage realism).
2. Composite = equal-weighted mean of present-provider indices → nearest letter.
3. Divergence = notch range across present providers.
4. 12-quarter history drifts around `avgNum`; last-quarter delta sets momentum tag.
5. Controversy overlay maps 90 synthetic incidents to companies; 30 alerts flag downgrades/divergence
   spikes/greenwash; 5 sub-module cards link to divergence, migration, controversy, greenwash, EU-reg
   readiness views.

### 7.4 Worked example — a 5-provider company

Present ratings `{MSCI: A(2), S&P: BBB(3), Sustainalytics: A(2), ISS: AA(1), CDP: BBB(3)}`,
Refinitiv missing. `numScores = [2,3,2,1,3]`; `avgNum = 11/5 = 2.2`; `avgRating = RATING_SCALE[round(2.2)]
= RATING_SCALE[2] = A`; `maxDivergence = 3 − 1 = 2 notches`; coverage 5/6. If the last two quarters
drift `+0.3`, `momentum = Upgrade`. Equal weighting means CDP (a climate-only disclosure score) counts
the same as MSCI's full ESG rating — the very issue the guide's *weighted* ICR was meant to fix.

### 7.5 Data provenance & limitations

- **Default mode is synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); provider ratings, history, controversies
  and alerts are seeded. India mode swaps in real issuer data via `adaptForESG()`.
- **Composite is equal-weighted**, not provider-weighted; **no analyst-override workflow** (Δ_analyst),
  no audit trail — the guide's distinguishing features are absent.
- Coverage gaps are modelled honestly (providers can be missing), a genuine realism improvement.
- The rigorous backend composite/divergence engine is not wired to the frontend.

**Framework alignment:** the six providers are real (**MSCI, S&P Global CSA, Sustainalytics, ISS ESG,
CDP, Refinitiv**). The AK5 sub-module correctly references the **EU ESG Ratings Regulation
(2024/3005)**, which from 2024 requires ESG-rating providers operating in the EU to be ESMA-authorised,
publish methodologies and manage conflicts — the same regime the backend's `assess_esra_compliance`
models across 8 requirements. A production ICR would weight providers by reliability/coverage and
layer an evidenced analyst override.

### 8 · Model Specification

**Status: specification — not yet implemented in the rendered UI.**

**8.1 Purpose & scope.** Produce an internal composite ESG rating per issuer that blends external
providers by reliability and permits an evidenced, audited analyst override, for investment and
exclusion decisions.

**8.2 Conceptual approach.** Reliability-weighted provider blend on a common normalised scale plus a
bounded analyst overlay with mandatory rationale/evidence — mirroring how asset managers construct
proprietary ESG scores over MSCI/Sustainalytics inputs.

**8.3 Mathematical specification.**
- Normalise each present provider `p` to 0–100 (per provider scale); `w_p ∝ coverage_p·reliability_p`,
  `Σw_p=1` over present providers.
- Base composite: `ICR_0 = Σ_p w_p·Score_p`.
- Analyst overlay: `ICR = clamp(ICR_0 + Δ_analyst, 0, 100)`, `|Δ_analyst| ≤ 15` (≈2 notches), stored
  with `{rationale, evidence[], reviewer, timestamp}`.
- Divergence gate: if `σ(Score_p) > 15`, require analyst review before ICR is published.

| Parameter | Source |
|---|---|
| Provider normalisation | provider scales (see esg-ratings-comparator §7.2) |
| Reliability weights | provider coverage/accuracy studies |
| Override cap ±15 | governance policy (≈2 notches) |
| Divergence gate 15 | Berg et al. σ magnitudes |

**8.4 Data requirements.** ≥2 provider raw scores per issuer, provider coverage/reliability metadata,
an override store (rationale/evidence/reviewer). India mode already sources real issuer data.

**8.5 Validation & benchmarking plan.** Compare ICR against realised controversies and rating
migrations; audit override frequency and reversal rate; sensitivity to reliability weights.

**8.6 Limitations & model risk.** Reliability weights are judgemental; analyst overlay introduces
subjectivity (needs governance controls); equal-weight fallback (current code) over-weights narrow
providers like CDP.
