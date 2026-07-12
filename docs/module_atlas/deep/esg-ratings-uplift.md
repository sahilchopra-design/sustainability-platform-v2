## 7 · Methodology Deep Dive

This is the strongest of the three ratings modules and one of the most genuinely functional tools in
the atlas: a **rating-uplift advisory model with no PRNG**. It runs a real MSCI-style weighted
key-issue score, applies a controversy discount, ROI-ranks a remediation action plan, projects the new
score, crosswalks it across four agencies, and computes **notch-based passive-AUM unlock** from index-
eligibility gates. All parameters come from a shared reference library (`AdvisoryReference.js`) with
authentic MSCI crosswalk boundaries and real index thresholds. The guide's formula
(`uplift = Σ w_i·disclosure_gap_i + Σ w_j·controversy_discount_j`) is broadly implemented, with one
scaling heuristic flagged in §7.5.

### 7.1 What the module computes

```js
totalW        = Σ issue.weight
currentScoreRaw = Σ (issue.current × issue.weight) / totalW      // MSCI-style weighted key-issue score
peerScore       = Σ (issue.peer × issue.weight) / totalW
controvAdj      = controversyImpact(level)                        // None 0 / Low −2 / Med −6 / High −12 / Severe −25
currentScore    = clamp(currentScoreRaw + controvAdj, 0, 100)
gap             = peerScore − currentScore

plan          = actions sorted by roi = uplift / costMn (desc)
totalUplift   = Σ action.uplift × (15/totalW)                     // ⚠ scaling heuristic (see §7.5)
projectedScore= min(100, currentScore + totalUplift)

agencyCurrent[ag]  = letterForAgency(ag, currentScore)            // MSCI/Sustainalytics/ISS/CDP crosswalk
agencyProjected[ag]= letterForAgency(ag, projectedScore)
uplifts = max(0, MSCI_index(projected) − MSCI_index(current))    // notches gained

// Index-eligibility → AUM unlock:
projEligible = projectedScore ≥ minScore && !controversyExceeds(level, excludeControv)
unlock = (newly eligible) ? aumPassive × flowPctPerNotch/100 × 3
                          : projEligible ? aumPassive × flowPctPerNotch/100 × uplifts : 0
```

### 7.2 Parameterisation — real reference data

| Constant | Value | Provenance |
|---|---|---|
| MSCI crosswalk | CCC 0–14.3, B 14.3–28.6, BB …, AAA 85.7–100 | exact MSCI 7-band linear normalisation |
| Controversy tariff | None 0 / Low −2 / Med −6 / High −12 / Severe −25 | curated MSCI-deduction-style scale |
| Index thresholds | MSCI World ESG Leaders ≥57, SRI ≥71, FTSE4Good ≥42, DJSI ≥65, STOXX ≥55 | real index inclusion floors |
| `flowPctPerNotch` | 1.0–2.2% AUM per notch | curated passive-flow sensitivity |
| Issue weights | `MSCI_ISSUE_WEIGHTS[sector]` | MSCI-style sector materiality weights |
| Sector medians | `SECTOR_MEDIAN_SCORES` | curated peer medians |
| Action dependencies | `ACTION_DEPS` (e.g. SBTi ← Scope 3 Cat 11) | real logical prerequisites |

The crosswalk band boundaries (0/14.3/28.6/42.9/57.1/71.4/85.7/100) are the exact 7-way linear split
MSCI uses — genuine provenance.

### 7.3 Calculation walkthrough

1. Load sector → pulls `MSCI_ISSUE_WEIGHTS` and median; issues carry current/peer/weight.
2. `currentScore` = weighted key-issue mean + controversy discount, clamped.
3. Actions ROI-ranked (`uplift/costMn`); `projectedScore = current + totalUplift`.
4. Both scores crosswalked to four agencies; MSCI notches gained = `uplifts`.
5. Each index: eligible iff `score ≥ minScore` and controversy ≤ exclusion tier; newly-eligible
   indices unlock `aumPassive × flowPctPerNotch/100 × 3`; already-eligible add per-notch flow.
6. Dependency check: flags actions whose prerequisite is missing or scheduled too late (`ACTION_DEPS`).
7. Percentile: `50 + (currentScore − sectorMedian)×2`.

### 7.4 Worked example — ACME Group (Utilities-Renewables)

Default issues weighted-average to `currentScoreRaw` ≈ 52; controversy Low → `−2` →
`currentScore ≈ 50`. `peerScore` ≈ 63 → `gap ≈ 13`. Actions total `uplift = 12+18+10+14+6+5 = 65`;
`totalUplift = 65 × (15/totalW)`. With `totalW = 100`, `= 65×0.15 = 9.75` → `projectedScore ≈ 59.75`.
Crosswalk: current 50 → MSCI **BBB** (42.9–57.1); projected 59.75 → MSCI **A** (57.1–71.4) → `uplifts =
1 notch`. Newly crossing the MSCI World ESG Leaders floor (≥57): `unlock = 4500 × 2.2/100 × 3 = $297 M`
passive-flow potential. All deterministic, no random draws.

### 7.5 Data provenance & limitations

- **No PRNG** — every number is user input or curated reference data; this is a genuine advisory
  calculator, not a synthetic demo.
- **`totalUplift` scaling heuristic:** the action uplifts are re-scaled by `15/totalW`. When
  `totalW = 100`, this shrinks the summed uplifts by 0.15 — an ad-hoc normalisation that couples the
  aggregate uplift to the *sum of issue weights* rather than to the specific issues each action
  targets. A cleaner design would apply each action's `uplift` to its named `issue` and re-weight.
- AUM unlock uses a simple `flowPctPerNotch × 3` (3× multiplier for newly-eligible) — a stylised
  passive-flow assumption, not a fitted flow-elasticity.
- Peer scores are user-entered defaults, not live provider data.

**Framework alignment:** **MSCI ESG Ratings** — the weighted key-issue score, industry materiality
weights and the exact AAA–CCC crosswalk boundaries are implemented faithfully; MSCI derives its rating
by scoring exposure×management on 35 industry key issues, weighting by materiality, deducting for
controversies, then mapping the 0–10 industry-adjusted score to the letter scale. **Sustainalytics /
ISS / CDP** crosswalks let the same 0–100 score render in each provider's native bands. **Index
inclusion** (MSCI ESG Leaders/SRI, FTSE4Good, S&P DJSI, STOXX, Euronext Vigeo) floors are real, and the
notch→passive-flow link captures the genuine mechanism by which rating upgrades unlock index-tracking
AUM. Actions map to real frameworks (**TCFD**, **SBTi 1.5°C**, **Scope 3 Cat 11**).

*(No §8 model specification required — this module implements a genuine, parameter-grounded model; the
only refinement recommended is replacing the `15/totalW` aggregate-uplift heuristic with per-issue
uplift attribution and a calibrated passive-flow elasticity.)*
