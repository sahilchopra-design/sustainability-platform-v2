## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide names a *Disclosure Readiness Index* `DRI = Σ(Completed
> Items / Required Items × Weight) per Framework`, weighted by regulatory penalty severity and deadline
> proximity, with a DRI<0.85 escalation trigger. **No DRI is computed.** The 50 entities and every
> field — completion rate, data quality, gaps, automation, quarterly progress — are drawn from the
> seeded PRNG `sr()`. The framework list is real; the readiness metrics are synthetic. This is a
> disclosure-workflow *dashboard mock*, not a readiness engine.

### 7.1 What the module computes

```js
DATA = genData(50): per entity, all fields seeded via s(idx)=sr(i·idx+idx):
  framework   = FRAMEWORKS[⌊s(17)·8⌋]          // CSRD/ESRS, SFDR, ISSB, SEC, TCFD, UK SDR, EU Tax, CDP
  completionRate = ⌊10 + s(41)·88⌋              // %
  dataQuality = ⌊20 + s(43)·78⌋ ; gaps = ⌊s(47)·25⌋
  envDisc/socDisc/govDisc, q1..q4 quarterly, aum, employees — all seeded
KPIs (over filtered set): avgCompletion, avgQuality, totalGaps, auditReady count, avgAuto
```

Aggregates are plain means/sums over the synthetic set: framework distribution, status distribution,
an E/S/G radar, per-framework completion, and a Q1–Q4 trend line.

### 7.2 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Frameworks (8) | CSRD/ESRS, SFDR, ISSB/IFRS S1-S2, SEC Climate, TCFD, UK SDR, EU Taxonomy, CDP | real standards |
| Entity types | Asset Manager, Bank, Insurance, Pension, Corporate, Sovereign | labels |
| Entity names | BlackRock, Vanguard, State Street … NBIM, GIC, ADIA | real institution names (labels) |
| All metrics | completion/quality/gaps/automation/quarterly | synthetic (`sr()`) |

### 7.3 Calculation walkthrough

`genData(50)` seeds all entity rows once. The dashboard filters by framework/type/status/search, sorts,
paginates. KPIs average completion/quality/automation and sum gaps over the filtered set. Charts show
framework and status distributions, an average E/S/G disclosure radar, per-framework mean completion,
and a four-quarter completion trend from the seeded `q1..q4` fields.

### 7.4 Worked example

Entity i=0 (BlackRock): `completionRate = ⌊10 + s(41)·88⌋` where `s(41) = sr(0·41+41) = sr(41)`.
`sr(41) = frac(sin(42)·10⁴)`… suppose 0.62 → `⌊10 + 54.6⌋ = 64%`. `dataQuality = ⌊20 + sr(43)·78⌋`,
`gaps = ⌊sr(47)·25⌋`, `auditReady = sr(61) > 0.5 ? Yes : No`. The KPI "Avg Completion" is the mean of
these seeded values across the filtered set — a plausible-looking but manufactured readiness figure.
No DRI weighting by penalty severity or deadline proximity is applied.

### 7.5 Data provenance & limitations

- **Entirely synthetic** entity metrics (`sr(seed) = frac(sin(seed+1)×10⁴)`); only institution names
  and the 8 framework labels are real.
- The guide's DRI (weighted completion with penalty/deadline weighting and 0.85 escalation) is
  unimplemented — the page reports unweighted mean completion.
- No real filing calendar, no document repository, no approval-workflow state machine — these are UI
  concepts over seeded data.

**Framework alignment:** CSRD Art. 29a, SFDR Art. 10, CDP questionnaire, ISSB IFRS S1/S2, EU Taxonomy,
UK SDR — the module correctly enumerates the live obligations an FI faces, so it works as a *framework
inventory*; a production hub would connect each framework to its real requirement set and a filing-
deadline calendar to compute a genuine, penalty-weighted readiness index. See
`disclosure-adequacy-analyzer` §8 for the coverage-scoring spec that would feed such a DRI.
