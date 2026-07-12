## 7 · Methodology Deep Dive

This module matches its MODULE_GUIDES entry — a **net-zero alliance/commitment tracker** across NZAM,
NZAOA, and NZBA, with signatory gap analysis and a portfolio-coverage view. The **alliance-level facts and
signatory rosters are real and current** (member counts, AUM, founding years, secretariats, and the
withdrawn-member set), while each signatory's *target and progress numbers* are seeded synthetic anchored
to the alliance.

### 7.1 What the module computes

The headline is the commitment-vs-action gap per signatory:

```js
committed = interimTarget                         // pledged 2030 reduction %
actual    = actualReduction = round(interimTarget · (0.3 + s2·0.8))
gap       = committed − actual                    // shortfall
```

Aggregations: gap ranking (top 30), status distribution (On-Track/Behind/No Target/Withdrawn), average gap
by alliance, and a portfolio-coverage tab (% of a holdings list that is net-zero-committed, split by
alliance).

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| NZAM | 315 members, $43T AUM, founded 2020, IGCC/PRI/CDP | **Real** alliance facts |
| NZAOA | 88 members, $11T, founded 2019, UNEP FI/PRI | **Real** |
| NZBA | 144 members, $74T, founded 2021, UNEP FI | **Real** |
| Withdrawn set | Vanguard, Invesco, T. Rowe Price, Janus Henderson, QBE | **Real** high-profile NZAM/alliance exits |
| Firm rosters | 40 real NZAM + 40 NZAOA + 40 NZBA names | **Real** institutions |
| `targetYear` | `2040 + floor(s2·4)·5` (2040/2045/2050/2055) | Synthetic |
| `interimTarget` | `25 + s3·30` (25–55 %) | Synthetic |
| `actualReduction` | `interimTarget·(0.3 + s2·0.8)` | Synthetic (30–110 % of pledge) |
| `MEMBERSHIP_GROWTH` | logistic-style `base + Δ·(1 − e^{−k·i})` | Modelled S-curve |

The withdrawn firms are correctly zeroed out (`isWithdrawn ? 0/null`) — reflecting the real 2022–2024 wave
of NZAM/GFANZ departures.

### 7.3 Calculation walkthrough

`buildSignatories()` generates 120 signatory records: real name + alliance, then seeded AUM, target year,
interim target, coverage %, and actual reduction (with withdrawn firms nulled). `gapData` filters to active
committed signatories, computes `gap = committed − actual`, sorts descending, takes top 30.
`avgGapByAlliance` averages committed and actual per alliance. The portfolio tab sums `allocationPct` of
holdings flagged `isNzCommitted` and by alliance to show coverage vs uncovered.

### 7.4 Worked example (a signatory with pledge 45 %)

Suppose a signatory draws `interimTarget = 45 %` and `s2 = 0.5`:

| Metric | Computation | Result |
|---|---|---|
| committed | interimTarget | 45 % |
| actualReduction | `45 · (0.3 + 0.5·0.8)` = `45 · 0.7` | 31.5 % |
| gap | `45 − 31.5` | **13.5 pts** |

A withdrawn firm (e.g. Vanguard) is forced to `committed = 0, actual = 0, targetYear = null`, so it drops
out of `gapData` and shows as "Withdrawn" in the status distribution — matching Vanguard's real December
2022 NZAM exit.

### 7.5 Data provenance & limitations

- **Alliance facts and signatory rosters are real** (member counts, AUM, secretariats, founding years, and
  the withdrawn set). **Per-signatory targets and progress are synthetic** (`sr(s)=frac(sin(s+1)·10⁴)`),
  anchored only to alliance membership, not to actual disclosed targets.
- The commitment-action gap is thus illustrative: `actual` is a random fraction of the pledge, not a
  reported financed-emissions trajectory.
- No credibility scoring of the *pledge itself* (offset reliance, Scope 3, verification) — that is the
  guide's NZCS formula, which this module does not implement (see the sibling `net-zero-credibility-index`
  and §8).

**Framework alignment:** **GFANZ / NZAM / NZAOA / NZBA** — the three UN-convened alliances are accurately
characterised, including the NZAOA Target-Setting Protocol (5-year sub-portfolio targets) and NZBA sector-
target requirements. **Net Zero Tracker** and **NewClimate CCRM** are named as the intended credibility
sources. The guide's NZCS credibility composite is specified in §8.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** Signatory targets/progress are seeded. Below is the
production net-zero-credibility scoring model the guide's NZCS formula implies.

### 8.1 Purpose & scope
Score each signatory's net-zero pledge credibility from disclosed targets and progress, and compute a
realistic commitment-action gap from financed/operational emissions, for stewardship prioritisation and
alliance-alignment monitoring.

### 8.2 Conceptual approach
A weighted-dimension credibility index (NZCS) per **NewClimate CCRM** and **UN HLEG "Integrity Matters"**
criteria, combined with a measured commitment-action gap from emissions trajectories. Benchmarks: **Net Zero
Tracker**, **SBTi Net-Zero Standard**, **NZAOA Target-Setting Protocol**.

### 8.3 Mathematical specification
`NZCS = Σ_d w_d·s_d`, d ∈ {coverage (S1/2/3), interim-target specificity, offset cap, governance,
verification}, each `s_d ∈ [0,100]`. Commitment-action gap `G = pledged_reduction(t) − actual_reduction(t)`,
where `actual = 1 − E_t/E_base` from reported (financed) emissions, `pledged` from the linear/SBTi pathway to
the interim year. Alliance alignment flag if `G ≤ tolerance` and NZCS ≥ threshold.

| Parameter | Source |
|---|---|
| Dimension weights w_d | NewClimate CCRM / UN HLEG |
| Pledged pathway | SBTi Net-Zero Standard, NZAOA protocol |
| Actual emissions | PCAF financed emissions / company reports |
| Offset cap | SBTi (≤10 % residual) |

### 8.4 Data requirements
Disclosed net-zero targets (year, scope, interim, offset policy), annual emissions, third-party assurance,
governance data. Platform has real rosters; the gap is disclosed-target + emissions ingestion.

### 8.5 Validation & benchmarking plan
Correlate NZCS against NewClimate CCRM integrity ratings; reconcile gaps against reported vs SBTi-pathway
emissions; track alliance-departure prediction.

### 8.6 Limitations & model risk
Self-reported targets and offsets are gameable; financed-emissions data lags. Conservative fallback: cap
credit for unverified targets and treat missing Scope 3 as non-coverage.
