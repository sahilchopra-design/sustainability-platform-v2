## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry (EP-CT1) promises a full **IFRS 9 + climate
> overlay** — `ECL = PD·LGD·EAD`, `PD_climate = PD_base·(1 + γ·Δscore)`, Stage 1/2/3 staging (PD>2×),
> and HHI concentration. **None of that ECL machinery is in this module's code.** It computes a single
> seeded transition **score** per borrower, a score distribution, a watchlist (score < 40), and total
> exposure. There is no PD, LGD, EAD, ECL, staging, or HHI here (HHI lives in the sibling
> `fi-concentration-monitor`). Documented below.

### 7.1 What the module computes

50 borrowers, each with a seeded transition score and exposure:

```js
score    = round(20 + sr(i·7)·70)          // 20–90 transition score
exposure = round(10 + sr(i·11)·490)        // $10–500M
rating   = scoreToRating(score).label      // A–E band from taxonomyTree
// aggregates:
totalExposure    = Σ exposure
avgScore         = round(Σ score / 50)
scoreDistribution = 10 buckets (0-10 … 90-100), count + exposure per bucket
watchlist        = borrowers with score < 40, sorted ascending
```

`scoreToRating` (from `data/taxonomyTree`) maps the 0–100 score to an A–E rating; sector and region come
from the shared `HIGH_IMPACT_SECTORS` (12 NACE) and `GEOGRAPHIC_REGIONS` tables by modular index.

### 7.2 Parameterisation & provenance

| Element | Value | Provenance |
|---|---|---|
| `BORROWERS` | 50 | Illustrative names (Acme, OilMajor, WindFarm…); score/exposure **seeded** |
| Sector assignment | `i % 12` over `HIGH_IMPACT_SECTORS` | **Real NACE high-impact sector list** (shared taxonomy) |
| Region assignment | `i % N` over `GEOGRAPHIC_REGIONS` | Real region list (shared) |
| `scoreToRating` | A–E bands | Shared taxonomy mapping |
| Watchlist threshold | score < 40 | Hard-coded editorial cut-off |
| `LOBS` | 4 (Corporate/IB/Wealth/Treasury) | Real business lines (modular assignment) |

There is **no** PD/LGD/EAD/ECL parameterisation in the file — the guide's IFRS 9 constants do not exist.

### 7.3 Calculation walkthrough

1. `BORROWERS` seeded once; each gets score, exposure, rating, sector, region, LOB.
2. `totalExposure`, `avgScore` aggregate.
3. `scoreDistribution` bins borrowers into ten score buckets with count + exposure.
4. `watchlist` filters score < 40 (high transition risk) for engagement.
5. Tabs render sector concentration (treemap), geography heatmap, score distribution, and LOB views —
   all descriptive over the seeded set.

### 7.4 Worked example (borrower i = 20 → "OilMajor")

| Step | Computation | Result |
|---|---|---|
| score | round(20 + sr(140)·70) | round(20 + 0.6·70) ≈ 62 |
| exposure | round(10 + sr(220)·490) | ≈ $304M |
| rating | scoreToRating(62) | ~C |
| watchlist? | 62 < 40 | No |

An oil-major scoring 62 (rating C, not watchlisted) illustrates the limitation: the transition score is
seeded, so a high-carbon issuer can score mid-range purely by chance — there is no carbon-intensity or
PD linkage driving it.

### 7.5 Data provenance & limitations

- **All borrower scores/exposures are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`).
- **No IFRS 9 ECL** despite the guide — no PD, LGD, EAD, staging, or climate-conditioned PD.
- **No HHI** in this module (it is in `fi-concentration-monitor`).
- The transition score is a bare 0–100 number with no documented derivation from carbon/transition data.
- Sector/region/LOB taxonomies are real; the values attached are not.

**Framework alignment:** The module gestures at **IFRS 9** staging and **PCAF/ECB SREP** framing in the
guide, and uses a real NACE high-impact sector taxonomy, but implements only a descriptive score/watchlist
view. The genuine climate-conditioned IFRS 9 ECL model exists elsewhere in the platform
(`climate-credit-integration`, which does implement PD×LGD×EAD with NGFS multipliers).

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The guide's IFRS 9 climate-overlay ECL is
absent; only a seeded score exists. Below is the production model.

**8.1 Purpose & scope.** Compute climate-conditioned IFRS 9 expected credit loss and staging per borrower
across the 12 high-impact NACE sectors, with a transition score that actually drives PD.

**8.2 Conceptual approach.** Standard IFRS 9 ECL with an NGFS-scenario climate overlay on PD, mirroring
the platform's own `climate-credit-integration` engine and ECB/EBA climate stress-testing practice
(multiplier-on-PD design).

**8.3 Mathematical specification.**

```
TransitionScore_b = f(carbon intensity, SBTi, sector pathway gap)        (0–100, lower = worse)
PD_climate_b = PD_base_b · (1 + γ · (100 − TransitionScore_b)/100 · (M_scenario − 1))
ECL_b = PD_climate_b · LGD_b · EAD_b
Stage: 1 if PD_climate ≤ threshold ; 2 if PD_climate > 2·PD_base (SICR) ; 3 if impaired
Portfolio ECL = Σ_b ECL_b ;  Watchlist = {b : Stage ≥ 2 or TransitionScore < 40}
```

| Parameter | Source |
|---|---|
| PD_base, LGD, EAD | Internal ratings / Basel IRB |
| Scenario multiplier M | NGFS Phase IV (per `climate-credit-integration`) |
| γ sensitivity | Calibrated to stress-test elasticities |
| Carbon intensity, SBTi | `GLOBAL_COMPANY_MASTER` / CDP |

**8.4 Data requirements.** Borrower PD/LGD/EAD, sector, carbon intensity, SBTi status. Platform holds the
NGFS scenario tables and the sibling climate-credit engine; needs a loan-tape join.

**8.5 Validation & benchmarking plan.** Reconcile ECL against the `climate-credit-integration` engine on
overlapping obligors; backtest staging migrations; sensitivity to γ and scenario multiplier.

**8.6 Limitations & model risk.** Transition-score→PD elasticity is uncertain — bound γ and report
sensitivity. Conservative fallback: absent carbon data, apply the sector-average intensity and flag the
proxy (PCAF-style data-quality tag).
