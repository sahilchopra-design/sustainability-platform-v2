## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry headlines a single **Transition
> Readiness Index (TRI) = "61/100"** computed as `TRI = Σ(Module Score × Weight) / 5` — an
> equal-weighted composite across 5 dimensions (ambition, capital, operations, supply chain,
> stakeholder engagement). **No such composite is computed anywhere in the code** (no `TRI` variable
> or 5-dimension weighted sum exists). What the page actually shows is a **10-card KPI dashboard**,
> each card an independent statistic over the same 150-company synthetic portfolio, with no single
> "TRI" figure aggregating them. The sections below document what the code actually computes.

### 7.1 What the module computes

150 synthetic companies (10 sectors × 15 each) are generated once via the seeded PRNG
`sr(s)=frac(sin(s+1)×10⁴)`, each carrying independent readiness, TPT status, ACT grade, GFANZ
alignment, net-zero commitment, and credibility-tier fields. `computeKPIs(period)` derives 10
headline statistics from this fixed population, adjusted by a **cosmetic period factor**:

```js
periodFactor = period==='Q' ? 1.0 : period==='YTD' ? 0.95 : 0.88   // arbitrary, not time-series-derived
avgCred = Σ readiness / 150
"Transition Readiness" = avgCred × periodFactor
"Credibility Score"    = avgCred × periodFactor × 0.85    // same underlying avgCred, arbitrary 0.85 scalar
```

### 7.2 Parameterisation

| Field | Formula | Provenance |
|---|---|---|
| `readiness` | `⌊20 + s×75⌋` where `s=sr(i×7+3)` | 20–95, synthetic |
| `tptStatus` | `TPT_STATUSES[⌊s×4⌋]` | Published/In Progress/Committed/Not Started, synthetic |
| `actGrade` | `ACT_GRADES[⌊s2×5⌋]` | A–E, synthetic |
| `gfanzAligned` | `s3 > 0.45` (~55% true) | Synthetic boolean |
| `nzCommitted` | `s4 > 0.35` (~65% true) | Synthetic boolean |
| `credibilityTier` | `CRED_TIERS[⌊s5×4⌋]` | High/Medium/Low/Very Low, synthetic |
| `periodFactor` | 1.0 / 0.95 / 0.88 for Q/YTD/1Y | **Fixed constants, not derived from any actual time-series** — selecting "1Y" simply multiplies every KPI by 0.88, mechanically producing a lower number for longer periods regardless of real trend direction |
| KPI card `delta` values | Hardcoded strings (e.g. `+3.2`, `+5.1`, `-3`) | **Static, not computed from any historical snapshot** — every KPI card always shows the same delta regardless of period selection or portfolio composition |

### 7.3 Calculation walkthrough

1. **KPI dashboard**: 10 cards computed from simple filters/means over the 150-company array
   (published-plan %, average ACT grade index, GFANZ %, net-zero %, average readiness, average
   green-capex ratio, laggard count, regulatory-readiness %), each scaled by the cosmetic
   `periodFactor`.
2. **Sector heatmap**: groups the 150 companies by sector, averaging readiness and computing
   TPT/GFANZ/NZ percentages per sector — a genuine (if synthetic-input) aggregation.
3. **Engagement pipeline**: 30 companies (every 5th company from the 150) assigned a stage
   (Identified→Resolved), priority, analyst, and next-action date via further independent PRNG
   draws; `pipelineStats` counts by stage and by priority.
4. **Board Report tab**: assembles the same KPI cards plus a fixed 5-quarter synthetic trend
   (`boardQuarterlyData`, each quarter's readiness/TPT/GFANZ/NZ/credibility figures independently
   `sr()`-seeded, not a rollout of the 150-company population over time) into a 6-section narrative
   report (`REPORT_SECTIONS`).
5. **Top Risks / Top Opportunities**: 5+5 hand-authored, sector-specific narrative bullets — static
   text, not generated from the underlying data (e.g. "Utilities sector 78% GFANZ aligned" is a
   fixed string, not a live computation against the 150-company `gfanzAligned` field for Utilities).

### 7.4 Worked example

For the default "Q" period (`periodFactor=1.0`):

| KPI | Formula | Illustrative outcome |
|---|---|---|
| Transition Readiness | `avgCred × 1.0` | ≈ mean of 150 uniform-ish draws in [20,95], so **≈57–58%** |
| Credibility Score | `avgCred × 1.0 × 0.85` | **≈49%** — always exactly 85% of the Transition Readiness figure, not an independently measured credibility construct |
| TPT Coverage | `published/150 × 100` | `TPT_STATUSES` has 4 roughly-equal categories, so **≈25%** |
| GFANZ Alignment | `gfanzCount/150 × 100` | `s3 > 0.45` → **≈55%** |
| NZ Commitment | `nzCount/150 × 100` | `s4 > 0.35` → **≈65%** |

Switching the period selector to "1Y" would multiply every one of the above by 0.88 uniformly —
e.g. Transition Readiness would drop to ≈51% — a mechanical artefact of the fixed period factor, not
a reflection of any actual year-over-year change in the underlying (static) 150-company population.

### 7.5 Companion analytics

- **Portfolio Transition View tab** — filterable/sortable table of all 150 companies with a radar
  chart per selected company across 5 sub-scores (Governance, Strategy, Metrics, Targets,
  Credibility — each independently `sr()`-seeded, unrelated to the company's top-level `readiness`).
- **Sub-module cards** — 5 tiles (Plan Builder, GFANZ Tracker, ACT Assessor, NZ Tracker,
  Credibility Engine) summarising the same 150-company population from different angles, positioned
  as if they were separate connected modules but all reading the same in-file array.

### 7.6 Data provenance & limitations

- **100% synthetic demo data.** All 150 companies, their sector/readiness/TPT/GFANZ/ACT/credibility
  fields, the 30-company engagement pipeline, and the 5-quarter board trend are generated by
  `sr(s)=frac(sin(s+1)×10⁴)`.
- **No TRI composite exists** despite being the guide's headline metric — see the mismatch flag
  above. A user cannot obtain the "61/100" figure the guide describes from anything in this file.
- **Period selector is cosmetic**: the Q/YTD/1Y toggle applies a fixed multiplicative discount
  (1.0/0.95/0.88) to every KPI uniformly, rather than recomputing from period-specific underlying
  data — this could visually suggest a real trend where none is modelled.
- **KPI card deltas are hardcoded**, not computed — they never change regardless of period, filter,
  or (hypothetically) real data updates.
- **Top Risks/Opportunities are static narrative text**, not generated from the live filtered data,
  so they can become inconsistent with whatever the KPI cards or heatmap actually show.

### 7.7 Framework alignment

- **GFANZ** (Glasgow Financial Alliance for Net Zero): `gfanzAligned` boolean and the GFANZ Tracker
  sub-module reference real GFANZ alignment as a concept; no actual GFANZ commitment criteria are
  evaluated.
- **ACT methodology** (Assessing low-Carbon Transition, ADEME/CDP): the A–E grading scale used for
  `actGrade` matches ACT's real letter-grade convention, though grades here are randomly assigned
  rather than derived from ACT's actual sector benchmarking methodology.
- **SBTi Corporate Net-Zero Standard**: `nzCommitted` references net-zero commitment status
  generically; no SBTi target-validation logic is implemented.
- **UK TPT Disclosure Framework**: `tptStatus` categories (Published/In Progress/Committed/Not
  Started) reflect the real language used to describe TPT-aligned transition-plan disclosure
  maturity.
