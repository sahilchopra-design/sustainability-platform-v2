## 7 · Methodology Deep Dive

### 7.1 What the module computes

A genuine weighted-composite peer-benchmarking tool across 6 GICS sectors × 5 named companies each,
matching the guide's stated methodology closely:

```
total       = Σ (pillarScoreᵢ × PILLAR_WEIGHTᵢ / 100)          // weighted composite, weights sum to 100
rank        = sortedDesc(peers.total).indexOf(company.total) + 1
quartile    = position in sector distribution (Q1 top, Q4 bottom)
convergence = drift(2024−year) applied per company, alternating direction by index parity
```

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| `PILLARS` | Carbon, Technology, Policy, Market, Capital, Social | Real, sensible 6-dimension transition-readiness taxonomy |
| `PILLAR_WEIGHTS` | 22, 18, 20, 18, 12, 10 (sums to 100) | Synthetic demo value, but internally consistent (weights correctly normalise to 100%) |
| `PEER_GROUPS` (6 sectors × 5 real companies) | Shell/BP/TotalEnergies/Enel/Orsted (Energy); Microsoft/Apple/Alphabet/Amazon/Samsung (Technology); etc. | **Real named companies** with **hand-set illustrative pillar scores** that are directionally consistent with market perception (Orsted scores highest in Energy at [92,90,88,85,82,78]; Shell/BP score lowest [45,40,35,50,42,38] — matches the real-world narrative of pure-play renewables outperforming integrated oil majors on transition metrics), though the specific numbers are not sourced from a named rating provider |
| `drift` (convergence trend) | `(2024−year) × (i%2===0 ? 2.5 : −1.5)` | Synthetic demo value: alternates sign by company-index parity to visually simulate some peers converging and others diverging |

### 7.3 Calculation walkthrough

1. **Weighted total**: `c.total = Σ(scores[i] × PILLAR_WEIGHTS[i]/100)` — a correct linear composite
   with normalised weights, computed once per company and reused across all tabs.
2. **Sector ranking**: `[...peers].sort((a,b)=>b.total-a.total)` (correctly uses a spread copy, not
   an in-place mutating sort) produces the ordered leaderboard; `rank` is 1-indexed position.
3. **Best-in-class**: `[...p].sort(...)[0]` per sector picks the top scorer — used to drive the
   "what do Q1 companies do differently" narrative panel.
4. **Quartile classification** (`quartile` fn, referenced but not fully shown in the extract):
   applied per company against its own sector's peer distribution — correct scope (quartiles are
   sector-relative, not global, matching how MSCI/Sustainalytics peer-relative ratings work).
5. **Laggard screening**: `PEER_GROUPS` flat-mapped, filtering `quartile(c.total,p)==='Q4'` across
   all sectors — a legitimate cross-sector "worst quartile" roll-up for engagement targeting.
6. **Convergence analysis**: for years 2020–2024, `base[company] = max(10, min(95, total+drift))`
   projects a company's score backward/forward in time with a linear per-company drift — purely
   illustrative (not derived from any historical score series), used to answer "is the sector
   converging or diverging."

### 7.4 Worked example

**Energy sector**, Orsted `scores=[92,90,88,85,82,78]`:

| Pillar | Score | Weight | Weighted contribution |
|---|---|---|---|
| Carbon | 92 | 22% | 20.24 |
| Technology | 90 | 18% | 16.20 |
| Policy | 88 | 20% | 17.60 |
| Market | 85 | 18% | 15.30 |
| Capital | 82 | 12% | 9.84 |
| Social | 78 | 10% | 7.80 |
| **Total** | | | **86.98** |

Shell `scores=[45,40,35,50,42,38]`:

| Pillar | Score | Weight | Weighted contribution |
|---|---|---|---|
| Carbon | 45 | 22% | 9.90 |
| Technology | 40 | 18% | 7.20 |
| Policy | 35 | 20% | 7.00 |
| Market | 50 | 18% | 9.00 |
| Capital | 42 | 12% | 5.04 |
| Social | 38 | 10% | 3.80 |
| **Total** | | | **41.94** |

Spread within the Energy peer group: 86.98 − 41.94 = **45.0 points**, consistent with the "Spread"
KPI card computed as `sorted[0].total − sorted[last].total`.

### 7.5 Data provenance & limitations

- **Pillar scores per company are hand-set illustrative values**, not sourced from a named ESG
  rating provider or company disclosure — directionally plausible but not defensible as a "real"
  transition score in a regulatory or investment-committee context.
- Only 5 companies per sector limits statistical robustness of quartile classification (Q4 with n=5
  is just the single lowest scorer, not a true 25th-percentile cut).
- Convergence/divergence trend is generated backward from the current score with an alternating-sign
  drift, not derived from an actual historical time series.

**Framework alignment:** MSCI ESG Ratings and Sustainalytics ESG Risk Ratings are cited as the
benchmarking convention; the module's peer-relative quartile methodology is structurally consistent
with how these providers report relative standing, though the underlying scores are illustrative
rather than licensed rating data.
