## 7 · Methodology Deep Dive

This module tracks 12 **real, named companies** (Shell, BP, TotalEnergies, Enel, Orsted, Microsoft,
Amazon, Volkswagen, ArcelorMittal, HeidelbergCement, Unilever, Nestle) with hand-curated,
illustrative target/progress figures — not `sr()`-seeded synthetic data. The gap-analysis
methodology broadly matches the guide's intent (linear extrapolation of current progress to the
target year), but a **target-year parsing bug** causes wrong denominators for any company whose
target year is not 2030 or (in one code path) not 2030/2040/2050 — documented precisely below since
it materially affects Orsted (target 2025) and, in the trajectory chart, several NZ-2040 companies.

### 7.1 What the module computes

For each company: a stated target (e.g. "50% by 2030"), `targetPct` (the numeric reduction target),
`baseYear`, `achieved` (% progress so far), and `years` (years elapsed since baseline). From these:

```js
yearsLeft      = targetYear − 2024                 // targetYear parsed from the target string, see §7.2 bug
annualRate     = achieved / years                   // % progress per year, linear run-rate
projectedFinal = achieved + annualRate × yearsLeft   // straight-line extrapolation to target year
gapPct         = max(0, targetPct − projectedFinal)  // percentage-point shortfall
onTrack        = projectedFinal >= targetPct × 0.9    // within 10% of target counted as on-track
```

This is a genuine **run-rate extrapolation gap model**: assume the company continues reducing
emissions at its historical average annual rate, project forward to the target year, and compare
against the stated target. It differs from the guide's literal formula
`Gap = (1 − ActualProgress/ExpectedProgress) × 100%` (a *ratio* gap) — the code instead computes an
*absolute percentage-point* gap (`targetPct − projectedFinal`) — a related but distinct metric; both
are defensible gap-analysis conventions, but they are not the same number.

### 7.2 Target-year parsing bug

```js
yearsLeft's targetYear = target.includes('2030') ? 2030
                        : target.includes('2040') ? 2040
                        : target.includes('2050') ? 2050
                        : 2039                                    // fallback
```

Orsted's target string is `'98% by 2025'` — it contains none of '2030'/'2040'/'2050', so it falls
through to the **2039 fallback**, 14 years later than its actual 2025 target. This makes
`yearsLeft = 2039−2024 = 15` instead of the correct `2025−2024 = 1`, which massively understates
Orsted's urgency and inflates its `projectedFinal` (more years of run-rate growth applied) — likely
making an already-behind or already-met target look artificially further from resolution (or, given
Orsted's high `achieved=92`, artificially over-projecting past 100%, silently clipped by no explicit
cap in the formula). A second, narrower bug exists in the trajectory-chart's `targetLine` denominator
(§7.3): `target.includes('2030') ? 2030 : 2050` — a **binary** check that maps every non-2030 target
(2025, 2039, 2040 targets alike) to 2050, which is wrong for Orsted (2025), Unilever (2039), and
Amazon (2040) specifically.

### 7.3 Trajectory chart

```js
actual(year)     = year<=2024 ? min(achieved, achieved × elapsed/years) : null    // historical interpolation
projected(year)   = achieved + annualRate × max(0, year−2024)                      // forward run-rate
targetLine(year)  = targetPct × elapsed / (targetYear_binary − baseYear)           // straight line to target
```

`targetLine` draws a straight reference line from `(baseYear, 0)` to `(targetYear, targetPct)` — the
"expected progress" trajectory a company would need to be on to hit its target linearly. Comparing
`actual`/`projected` against this line visually shows the same gap the KPI-level `gapPct` computes
numerically, but as noted in §7.2, `targetYear_binary` uses the coarser 2030/2050-only check, so this
chart's reference line can use a different (wrong) target year than the KPI panel's `yearsLeft`
calculation for the same company — an internal inconsistency between the two views of the same
company.

### 7.4 Worked example

**Orsted**: `targetPct=98`, `baseYear=2006`, `achieved=92`, `years=18` (2006→2024). `annualRate =
92/18 = 5.11%/yr`. Using the buggy `yearsLeft` fallback (2039): `projectedFinal = 92 + 5.11×15 =
92+76.7 = 168.7`, `Math.round → 169`. `gapPct = max(0, 98−169) = max(0,−71) = 0` (correctly floored
at zero by the `max(0,·)` guard, so the negative overshoot doesn't display as a negative gap — but
the underlying `projectedFinal=169%` is nonsensical for a percentage target and would display as such
anywhere it's shown un-clamped, e.g. the trajectory chart's `projected` series). `onTrack = 169 >=
98×0.9=88.2` → **true**. Using the *correct* 2025 target year instead: `yearsLeft = 1`,
`projectedFinal = 92+5.11×1 = 97.1 → round 97`, `gapPct = max(0,98−97)=1`, `onTrack = 97>=88.2` →
still **true** — in this specific case the bug happens to not flip the on-track verdict (Orsted is
genuinely close to target either way), but the displayed `projectedFinal` (169% vs the correct ~97%)
is grossly wrong and would mislead anyone reading the raw number rather than just the on-track flag.

### 7.5 Companion analytics

- **CapEx tracking** — `capexData` sorts companies by `greenCapex` (a hand-set % figure, e.g. Orsted
  85%, Shell 18%) alongside `gapPct` — a real correlation display (high green CapEx roughly
  co-occurs with lower gaps: Orsted 85%/gap-low vs Shell 18%/gap-high), though CapEx and gap are
  independently authored inputs, not causally linked in the code.
- **Technology deployment / Policy advocacy** — `techDeployed`/`lobbyAlign` are 3-level categorical
  fields (`low/moderate/high`, `misaligned/mixed/aligned`) mapped to a 1–3 ordinal score for charting
  — a defensible ordinal encoding, hand-assessed per company rather than derived from a scoring
  rubric.
- **Engagement action items** — auto-generates a HIGH/MEDIUM priority action for every off-track
  company (`gapPct>30 → HIGH`), a simple threshold-based investor-engagement prioritisation.

### 7.6 Data provenance & limitations

- **Company target/progress figures are illustrative, hand-curated point estimates** styled on real
  public net-zero commitments (Shell 2030, Enel 2030, Orsted 2025, Microsoft carbon-negative 2030),
  not live-sourced from company disclosures or SBTi's target database — treat as demo data with
  realistic framing, not verified figures.
- The target-year parsing bug (§7.2) affects any company whose target year isn't 2030 (in the KPI
  calc) or isn't 2030/2050 (in the trajectory-chart calc) — currently mis-parses Orsted (2025) in
  both paths and Unilever (2039)/Amazon (2040) in the trajectory-chart path specifically.
- `projectedFinal` has no upper clamp at 100% (or at the target itself), so companies with a high
  `achieved` and a long buggy `yearsLeft` can display nonsensical >100% projected-progress figures.

**Framework alignment:** SBTi's Corporate Net-Zero Standard is the guide's cited basis — the
run-rate-extrapolation gap concept is consistent with SBTi's own "on track vs off track" progress
assessment methodology, though the code implements a simpler linear run-rate rather than SBTi's
sector-pathway-conditioned target trajectory. The CapEx/technology/lobbying triangulation reflects a
real investor-engagement due-diligence practice (checking that stated commitments are backed by
actual capital allocation and consistent policy advocacy), a genuinely useful analytical framing even
though the underlying scores are qualitative/illustrative rather than computed from disclosed data.
