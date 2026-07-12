## 7 · Methodology Deep Dive

This module applies genuine **rating-migration and momentum analytics** — the standard credit/ESG
transition-matrix toolkit — to a synthetic panel of 150 companies (real names) × 6 providers × 12
quarters. The *machinery* is methodologically correct (transition matrices, notch-change momentum,
provider lead-lag); the *ratings themselves* are `sr()`-seeded, so outputs are illustrative, not real.

### 7.1 What the module computes

**Rating panel** (`genCompanies`): each company gets, per provider × quarter, an integer rating
0–6 (AAA…CCC) via a base draw plus a Markov-like drift:

```js
base  = floor(sr(i·100+pi·13+qi·3)·5) + 1                          // 1–5
drift = qi>0 ? (sr(·)>0.7 ? −1 : sr(·)<0.15 ? +1 : 0) : 0          // small up/down notch
rating[pi][qi] = clamp(base + drift, 0, 6)
```

**Transition matrix** (`migrationFor`) — the load-bearing analytic, a proper 7×7 migration count:

```js
mat = 7×7 zeros
for each company: mat[ rating[from-quarter] ][ rating[to-quarter] ]++
```

Each cell `mat[i][j]` = number of companies that moved from notch i to notch j between the two
selected quarters — exactly a rating **transition matrix** (diagonal = stable, upper/lower triangles
= up/downgrades).

**Momentum** (`momentum`) — average notch improvement across providers:

```js
provScore_p = rating[p][q] − rating[p][q+1]        // positive = upgrade (lower index = better)
avgMomentum = mean_p(provScore_p)
direction   = avgMomentum>0.3 ? 'Positive' : <−0.3 ? 'Negative' : 'Neutral'
sparkData   = per quarter, mean_p(7 − rating[p][q])   // "goodness" trend line
```

**Lead-lag** (`leadLag`) compares which provider moves first; **alpha signal builder** ranks
companies by momentum for a long/short construction.

### 7.2 Parameterisation / provenance

| Quantity | Value | Provenance |
|---|---|---|
| Company names (150) | fixed list | **real** (NextEra…SLC Agricola) |
| ESG events (15) | dated event log | **real-flavoured** (CSRD wave, Boeing crisis, PFAS litigation) |
| Rating scale | AAA…CCC (7 notches) | **real** convention |
| Ratings panel | `base + drift` seeded | **synthetic** |
| marketCap | `sr(i·31)·900+10` | synthetic |
| Migration matrix | counted from panel | **correct method**, synthetic inputs |

The 15 ESG events are realistic and dated to quarters, giving qualitative context; the rating
movements are not actually driven by these events (they are independent seeded drifts).

### 7.3 Calculation walkthrough

1. `genCompanies(150)` seeds the rating panel (6 providers × 12 quarters each).
2. Migration tab: pick provider + from/to quarter → `migrationFor` builds the 7×7 count matrix and a
   drill-down of which companies occupy each cell.
3. Momentum tab: per company, average notch change across providers → momentum score, direction,
   sparkline; aggregated to positive/negative/neutral shares and per-sector momentum.
4. Lead-lag tab: cross-provider timing of moves.
5. Alpha tab: rank by momentum for a long-short signal.

### 7.4 Worked example (transition matrix + momentum)

Suppose for provider MSCI, between Q1-25 and Q2-25, of 150 companies: 90 stay on the diagonal, 35
upgrade one notch (cells above diagonal), 25 downgrade. The matrix's off-diagonal mass (60/150 = 40%)
is the **migration rate**; the net (35 up − 25 down = +10) indicates mild positive drift.
For a single company rated A(2)→AA(1) at MSCI: `provScore = 2 − 1 = +1` (an upgrade). Averaged with
the other five providers (say +1, 0, +1, 0, −1) → `avgMomentum = (1+1+0+1+0−1)/6 = +0.33` → **Positive**
(just above the +0.3 threshold). The sparkline plots `mean_p(7 − rating)` per quarter, so a rising
line = improving average rating.

### 7.5 Data provenance & limitations

- **Company names and ESG events are real; the rating panel is synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)` with a base+drift process.
- The **transition matrix and momentum are computed correctly** — the analytics are legitimate; only
  the inputs are fabricated.
- Ratings are **not event-driven**: the 15 ESG events are decorative context, not linked to the
  drift, so a company near "Boeing Safety Crisis" need not show a governance downgrade.
- The drift is a memoryless ±1 notch step (not a calibrated transition-probability matrix), so the
  migration matrix reflects the drift distribution, not observed agency transition frequencies.
- No absorbing default state, no through-the-cycle vs point-in-time distinction.

**Framework alignment:** **Rating transition matrices** are the core of credit-migration analytics
(S&P/Moody's annual transition studies; used in IFRS 9 lifetime-ECL PD term structures and Basel
IRB). The 7×7 count matrix here is the ESG-rating analogue. **ESG-rating momentum** as an alpha signal
mirrors MSCI ESG-momentum research (upgrades tend to precede outperformance). **Provider lead-lag**
addresses the well-documented **ESG-rating divergence** across MSCI/S&P/Sustainalytics/ISS/CDP/
Refinitiv. The methods are sound; the limitation is synthetic ratings and an uncalibrated drift
process rather than a fitted transition model. A production version would estimate a real
provider-specific transition-probability matrix from historical rating histories (a Markov MLE),
which is a data problem, not a modelling gap in the displayed analytics.
