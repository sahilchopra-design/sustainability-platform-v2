## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide frames a *portfolio greenwashing VaR*
> `GW_VaR = Σ wᵢ·P_enforcementᵢ·FinancialImpactᵢ`. The page computes the two building blocks
> (enforcement probability and a $ fine estimate per entity) and aggregates a portfolio fine total, but
> it never weights by portfolio holding `wᵢ` — there are no portfolio weights in the data. So it is an
> **issuer-level greenwashing risk + expected-fine monitor**, not a weighted portfolio VaR. All 150
> entities are synthetic (`sr()` PRNG). The regulator table and its fine ranges are the only externally
> anchored inputs; the backend `greenwashing_engine.py` is not called.

### 7.1 What the module computes

For each of 150 entities the core chain is a claim-vs-reality gap → enforcement probability →
expected fine → composite greenwashing-risk score:

```js
greenRevClaimed = min(1, sr(i×19)×0.8 + 0.1)                         // 0.1–0.9
greenRevActual  = min(claimed, max(0, claimed × sr(i×23)×0.8))       // ≤ claimed
gapScore        = clamp(0,100, round((claimed − actual)×100))         // overstatement, 0–100
enforcementProb = clamp(0,1, gapScore/100×0.6 + claimStrengthNorm×0.2 + sr(i×37)×0.2)
fineEstimate    = round( enforcementProb × REGULATORS[reg].avgFineM×1e6 × (0.5 + sr(i×53)) )
gwRisk          = min(100, round( gapScore×0.4 + enforcementProb×100×0.3
                                  + claimStrengthNorm×100×0.2 + controversyNorm×100×0.1 ))
timeToAction    = gwRisk≥70 Imminent | ≥50 Near-Term | ≥30 Medium-Term | else Low Risk
```

`claimStrengthNorm = claimStrIdx/3` maps {Vague,Specific,Quantified,Verified} → {0,⅓,⅔,1}, so
*stronger, more specific claims raise enforcement risk* (a specific false claim is more actionable than
vague puffery) — a defensible modelling choice.

### 7.2 Parameterisation / rubric

**Enforcement-probability weights:** gap 0.60 · claim strength 0.20 · random shock 0.20.
**gwRisk weights:** gap 0.40 · enforcement 0.30 · claim strength 0.20 · controversy 0.10.

**Regulators** (`REGULATORS`, real names, illustrative fine levels):

| Regulator | Jurisdiction | Avg fine $M | Fine range $M | Active investigations |
|---|---|---|---|---|
| FCA | UK | 45 | 1–200 | 23 |
| SEC | USA | 120 | 5–800 | 38 |
| ASIC | Australia | 28 | 0.5–100 | 15 |
| BaFin | Germany | 35 | 1–150 | 18 |
| ESMA | EU | 55 | 2–300 | 31 |

10 claim categories, 4 claim strengths, 30 seeded enforcement-action records (2018–2023).

### 7.3 Calculation walkthrough

Each entity draws sector, country, claim category/strength, and green-revenue claimed/actual, from
which `gapScore` is the overstatement. `enforcementProb` blends gap, claim specificity and a random
shock; `fineEstimate = enforcementProb × regulator avg fine × (0.5–1.5 dispersion)`. `gwRisk` is the
composite. Portfolio aggregates: `totalFine = Σ fineEstimateUSD`, `avgRisk`, `avgGap`; risk-band
distribution buckets entities into 5 score ranges; top-20 by `greenwashingRiskScore` drives the
watchlist.

### 7.4 Worked example (one entity, FCA)

`greenRevClaimed = 0.70`, `greenRevActual = 0.30`, claim strength = Quantified (norm ⅔),
controversy 6/15, random shock 0.5, regulator FCA (avg $45M):

| Step | Computation | Result |
|---|---|---|
| gapScore | (0.70 − 0.30)×100 | 40 |
| enforcementProb | 0.40×0.6 + 0.667×0.2 + 0.5×0.2 | 0.24+0.133+0.10 = **0.473** |
| fineEstimate | 0.473 × 45M × (0.5+0.5) | ≈ **$21.3M** |
| controversyNorm | 6/15 | 0.40 |
| gwRisk | 40×0.4 + 47.3×0.3 + 66.7×0.2 + 40×0.1 | 16+14.2+13.3+4 = **48** |
| timeToAction | 48 in [30,50) | **Medium-Term** |

The $21.3M expected fine = enforcement probability × the FCA's average fine — a clean
probability-weighted expected-loss, just at the *issuer* level, not portfolio-weighted.

### 7.5 Data provenance & limitations

- **All 150 entities are synthetic** (`sr(seed)=frac(sin(seed+1)×10⁴)`); green-revenue claimed/actual,
  enforcement probability, fines and controversy counts are seeded. Only the 5 regulators' names,
  jurisdictions and fine ranges reflect reality.
- **No portfolio weights** — the guide's `Σ wᵢ·P·Impact` VaR cannot be computed; the page sums raw
  fine estimates (`totalFine`), which is an *aggregate expected fine*, not a probability-weighted
  portfolio loss %.
- Enforcement probability and fine dispersion carry a random shock term, so identical fundamentals can
  yield different fines — appropriate for a demo but not calibrated to real base rates.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the portfolio-VaR the guide names requires
holdings weights and calibrated enforcement base rates, neither of which exist here).

**8.1 Purpose & scope.** Estimate probability-weighted portfolio loss from greenwashing enforcement and
reputational contagion across held issuers, for ESG risk-limit monitoring.

**8.2 Conceptual approach.** A frequency-severity expected-loss model per issuer, aggregated by
portfolio weight, mirroring operational-risk LDA and RepRisk/ESG-controversy contagion studies:
`P_enforcement` from a logit on claim-gap and specificity; `Impact` = fine + market-cap reaction
calibrated to event studies (~3–8% cap loss on greenwashing allegations).

**8.3 Mathematical specification.**
```
P_enforce_i = logit⁻¹(β₀ + β₁·gap_i + β₂·claimStrength_i + β₃·controversy_i + β₄·regulator_intensity)
Impact_i = Fine_i + CapReaction_i,  CapReaction_i = MarketCap_i × drop%  (event-study calibrated)
Fine_i   = min(fineCap, avgFine_reg × severity_i)
GW_VaR = Σ_i  w_i × P_enforce_i × Impact_i        (w_i = portfolio weight)
Contagion overlay: news-sentiment early warning (negative sentiment precedes action in ~68% of cases)
```

| Parameter | Source |
|---|---|
| Logit coefficients β | fit to FCA/SEC/ESMA enforcement outcomes |
| CapReaction drop% | greenwashing event-study literature (3–8%) |
| Avg/range fines | regulator enforcement databases (page priors are plausible) |
| Sentiment feed | news NLP (early-warning) |

**8.4 Data requirements.** Portfolio holdings + weights, issuer claim data, enforcement history by
regulator, market cap, news sentiment. The page holds regulator priors and entity claim structure but
lacks holdings weights and a calibrated base rate.

**8.5 Validation.** Back-test P_enforce against realised actions; reconcile CapReaction against
event-study drops; check GW_VaR against internal ESG loss limits; sentiment lead-time test.

**8.6 Limitations & model risk.** Enforcement is rare → base-rate calibration is data-poor; market
reaction is heterogeneous; sentiment feeds are noisy. Conservative fallback: report top-N issuer
expected fines and gap scores (as the page does) rather than a portfolio VaR when weights/base rates
are missing.

**Framework alignment:** ESMA Greenwashing Progress Report (2023) — risk taxonomy; FCA SDR / Anti-
Greenwashing Rule (PS23/16) — enforcement basis; SEC ESG enforcement — US precedent; SFDR — the
sustainable-investment claims under scrutiny; operational-risk LDA — the frequency-severity structure
the §8 VaR adopts.
