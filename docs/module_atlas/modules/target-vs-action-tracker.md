# Target vs. Action Tracker
**Module ID:** `target-vs-action-tracker` · **Route:** `/target-vs-action-tracker` · **Tier:** B (frontend-computed) · **EP code:** EP-CM5 · **Sprint:** CM

## 1 · Overview
12 companies tracking stated targets against actual emissions progress, CapEx deployment, and technology adoption.

**How an analyst works this module:**
- Gap Dashboard shows target vs actual for each company
- CapEx Tracking compares planned vs actual green investment
- Lobbying Check flags inconsistencies

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COMPANIES` | 13 | `target`, `targetPct`, `baseYear`, `achieved`, `years`, `greenCapex`, `techDeployed`, `lobbyAlign` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `yearsLeft` | `(c.target.includes('2030') ? 2030 : c.target.includes('2040') ? 2040 : c.target.includes('2050') ? 2050 : 2039) - 2024;` |
| `annualRate` | `c.achieved / c.years;` |
| `projectedFinal` | `c.achieved + annualRate * yearsLeft;` |
| `gapPct` | `Math.max(0, c.targetPct - projectedFinal);` |
| `onTrack` | `projectedFinal >= c.targetPct * 0.9;` |
| `projected` | `sel.achieved + parseFloat(sel.annualRate) * Math.max(0, y - 2024);` |
| `targetLine` | `sel.targetPct * elapsed / ((sel.target.includes('2030') ? 2030 : 2050) - sel.baseYear);` |
| `capexData` | `COMPANIES.map(c => ({ name: c.name, greenCapex: c.greenCapex, gap: c.gapPct })).sort((a, b) => b.greenCapex - a.greenCapex);` |
| `techData` | `COMPANIES.map(c => ({ name: c.name, tech: c.techDeployed === 'high' ? 3 : c.techDeployed === 'moderate' ? 2 : 1, label: c.techDeployed }));` |
| `lobbyData` | `COMPANIES.map(c => ({ name: c.name, align: c.lobbyAlign === 'aligned' ? 3 : c.lobbyAlign === 'mixed' ? 2 : 1, label: c.lobbyAlign }));` |
| `engagementItems` | `COMPANIES.filter(c => !c.onTrack).map(c => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COMPANIES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Companies | — | Demo | With targets and progress data |
| On Track | — | Model | Companies likely to meet their targets |

## 5 · Intermediate Transformation Logic
**Methodology:** Target-action gap analysis
**Headline formula:** `Gap = (1 - ActualProgress / ExpectedProgress) × 100%`

For each company: stated target (e.g., "50% by 2030") vs actual progress. CapEx tracking: is green CapEx growing fast enough? Technology deployment: are they actually building clean assets? Policy advocacy: lobbying consistent with targets?

**Standards:** ['SBTi', 'Company Filings']
**Reference documents:** SBTi Corporate Net-Zero Standard; Company Annual Reports

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Fix the target-year parser, then benchmark against live disclosure data (analytics ladder: rung 1 → 3)

**What.** The run-rate extrapolation model is genuine (§7.1) but §7.2 documents a real bug: target years are parsed via `includes('2030'/'2040'/'2050')` with a 2039 fallback, so Orsted's "98% by 2025" gets `yearsLeft=15` instead of 1 and a nonsensical unclamped `projectedFinal=169%`; the trajectory chart's separate binary 2030/2050 check mis-dates Orsted, Unilever (2039), and Amazon (2040), making the KPI panel and chart disagree for the same company. Evolution A fixes the parser, then replaces the 13 hand-curated rows with sourced target/progress data and an SBTi-pathway benchmark.

**How.** (1) Parse the year with a regex over the target string (or better, store `targetYear` as a field), clamp `projectedFinal` at 100%, and use one shared target-year value for both KPI and `targetLine` paths. (2) Source targets from SBTi's public target-dataset export and progress from company-reported Scope 1+2 series (CDP/annual reports), replacing the illustrative `achieved`/`years` values — the module already tracks real names (Shell, Orsted, Microsoft...), so the credibility gap is the numbers, not the framing. (3) Benchmark the gap against SBTi sector pathways rather than pure linear run-rate (§7.6 notes the code implements the simpler convention), reporting both. (4) Extend `gapPct` to also compute the guide's ratio-form gap so guide and code agree on definitions.

**Prerequisites.** The §7.2 bug fix is a blocker for everything else — benchmarking a mis-projected trajectory compounds the error. **Acceptance:** Orsted shows `yearsLeft=1` and `projectedFinal≈97%`; KPI panel and trajectory chart use identical target years for all 13 companies; each company row cites its data source.

### 9.2 Evolution B — Engagement-memo copilot for off-track companies (LLM tier 1)

**What.** The module already auto-generates threshold-based engagement items (`gapPct>30 → HIGH`, §7.5). A tier-1 copilot turns those flags into stewardship-ready drafts: "write the engagement case for Shell" produces a memo citing the computed gap, run-rate vs required rate, the green-CapEx figure, and the tech-deployment/lobbying triangulation — the genuinely useful investor-due-diligence framing §7.6 credits the module with.

**How.** No backend exists (tier B, frontend-only), so grounding is this Atlas record plus live page state per the roadmap's tier-1 pattern: the copilot may cite `annualRate`, `projectedFinal`, `gapPct`, `onTrack`, and the ordinal tech/lobby encodings, each attributed to its formula (§7.1 is in the corpus). It must carry the provenance caveat from §7.6 — figures are hand-curated demo values styled on real commitments — in any memo text until Evolution A's sourced data lands, and must present `lobbyAlign` as a qualitative hand-assessment, not a computed score. Cross-module escalation (pulling the company's temperature-alignment or transition-credibility scores) is deferred to a tier-3 desk orchestrator; this copilot stays within the module's own surface.

**Prerequisites.** Evolution A's parser fix — a memo quoting Orsted's 169% projection would be an embarrassing, traceable error. **Acceptance:** every number in a memo reproduces from the page's formulas; memos on any company include the demo-data disclaimer pre-Evolution-A; asking for a company not in the 13-row set yields a refusal, not an invented profile.