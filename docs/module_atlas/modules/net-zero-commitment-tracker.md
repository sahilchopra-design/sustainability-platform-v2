# Net Zero Commitment Tracker
**Module ID:** `net-zero-commitment-tracker` · **Route:** `/net-zero-commitment-tracker` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Evaluates the credibility of corporate and country net-zero pledges by assessing target coverage, interim milestones, Scope 3 inclusion, and independent verification quality.

> **Business value:** Enables investors, rating agencies, and civil society to systematically distinguish genuine net-zero commitments from empty pledges, supporting stewardship, ESG ratings, and portfolio alignment decisions.

**How an analyst works this module:**
- Collect net-zero pledges from SBTi registry, Net Zero Tracker, and company disclosures
- Score coverage: year of net-zero, included gases, Scope 3 inclusion, offset cap
- Assess interim milestones: presence, linearity, sectoral alignment with SBTi pathways
- Flag greenwashing signals: over-reliance on offsets, absent governance, no verification

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALLIANCES`, `ALLIANCE_COLORS`, `ALL_SIGNATORIES`, `AUM_TIERS`, `CustomTooltipStyle`, `FIRM_NAMES_NZAM`, `FIRM_NAMES_NZAOA`, `FIRM_NAMES_NZBA`, `MEMBERSHIP_GROWTH`, `PORTFOLIO_HOLDINGS`, `REGIONAL_BREAKDOWN`, `REGIONS`, `STATUS_OPTIONS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ALLIANCES` | 4 | `name`, `members`, `aum`, `aumUnit`, `color`, `pctTargets`, `pctOnTrack`, `type`, `founded`, `secretariat`, `description`, `keyReqs` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGIONS` | `['Europe','North America','Asia-Pacific','UK','Nordics','Other'];` |
| `targetYear` | `isWithdrawn ? null : (2040 + Math.floor(s2 * 4) * 5);` |
| `interimTarget` | `isWithdrawn ? null : Math.round(25 + s3 * 30);` |
| `pctCovered` | `isWithdrawn ? 0 : Math.round(30 + s * 60);` |
| `actualReduction` | `isWithdrawn ? 0 : Math.round(interimTarget * (0.3 + s2 * 0.8));` |
| `regionIdx` | `Math.floor(s4 * REGIONS.length);` |
| `pillBase` | `{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, fontFamily:T.font };` |
| `statusColor` | `(s) => s==='On-Track'?T.green:s==='Behind'?T.amber:s==='Withdrawn'?T.red:T.textMut;` |
| `statusPill` | `(s) => ({ ...pillBase, background:statusColor(s)+'18', color:statusColor(s) });` |
| `fmtB` | `(v) => v >= 1000 ? `$${(v/1000).toFixed(1)}T` : `$${v}B`;` |
| `gapData` | `useMemo(() => { return ALL_SIGNATORIES .filter(s => s.status !== 'Withdrawn' && s.committed > 0) .map(s => ({ name: s.name.length > 18 ? s.name.slice(0,16)+'..' : s.name, fullName: s.name, committed: s.committed, actual: s.actual, gap: s.committed - s.actual, alliance: s.alliance })) .sort((a, b) => b.gap - a.gap) .slice(0, 30);` |
| `emissionsTrend` | `useMemo(() => { return [2020,2021,2022,2023,2024,2025,2026].map((y, i) => ({ year: y, NZAM: Math.round(100 - i * 3.2 + sr(i*7) * 4), NZAOA: Math.round(100 - i * 4.1 + sr(i*11) * 3), NZBA: Math.round(100 - i * 2.5 + sr(i*13) * 5), target: Math.round(100 - i * 5.7), }));` |
| `statusDistribution` | `useMemo(() => { const counts = { 'On-Track':0, 'Behind':0, 'No Target':0, 'Withdrawn':0 };` |
| `avgGapByAlliance` | `useMemo(() => { return ALLIANCES.map(a => { const sigs = ALL_SIGNATORIES.filter(s => s.alliance === a.id && s.status !== 'Withdrawn' && s.committed > 0);` |
| `avgCommitted` | `sigs.length ? Math.round(sigs.reduce((t, s) => t + s.committed, 0) / sigs.length) : 0;` |
| `avgActual` | `sigs.length ? Math.round(sigs.reduce((t, s) => t + s.actual, 0) / sigs.length) : 0;` |
| `portfolioStats` | `useMemo(() => { const total = PORTFOLIO_HOLDINGS.reduce((s, h) => s + h.allocationPct, 0);` |
| `committed` | `PORTFOLIO_HOLDINGS.filter(h => h.isNzCommitted).reduce((s, h) => s + h.allocationPct, 0);` |
| `nzam` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAM').reduce((s, h) => s + h.allocationPct, 0);` |
| `nzaoa` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZAOA').reduce((s, h) => s + h.allocationPct, 0);` |
| `nzba` | `PORTFOLIO_HOLDINGS.filter(h => h.alliance === 'NZBA').reduce((s, h) => s + h.allocationPct, 0);` |
| `notCovered` | `total - committed;` |
| `uncoveredHoldings` | `useMemo(() => PORTFOLIO_HOLDINGS.filter(h => !h.isNzCommitted).sort((a,b) => b.allocationPct - a.allocationPct), []);` |
| `newCommitted` | `portfolioStats.committed + target.allocationPct;` |
| `newPct` | `Math.round(newCommitted / (portfolioStats.total \|\| 1) * 100);` |
| `rows` | `PORTFOLIO_HOLDINGS.map(h => [h.manager, h.allocationPct, h.aumAllocated, h.isNzCommitted ? 'Yes' : 'No', h.alliance \|\| '-', h.status, h.assetClass, h.mandate]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `totalMembers` | `ALLIANCES.reduce((s, a) => s + a.members, 0);` |
| `totalAum` | `ALLIANCES.reduce((s, a) => s + a.aum, 0);` |
| `avgOnTrack` | `Math.round(ALLIANCES.reduce((s, a) => s + a.pctOnTrack, 0) / ALLIANCES.length);` |
| `globalAumPie` | `ALLIANCES.map(a => ({ name: a.id, value: a.aum, color: a.color }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALLIANCES`, `AUM_TIERS`, `FIRM_NAMES_NZAM`, `FIRM_NAMES_NZAOA`, `FIRM_NAMES_NZBA`, `REGIONS`, `STATUS_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Corporate Net Zero Pledges (Fortune 500) | — | Net Zero Tracker 2024 | Share of Fortune 500 companies with a publicly stated net-zero or carbon neutrality commitment. |
| High-Credibility Pledges | — | NewClimate Institute 2023 | Fraction of corporate net-zero commitments rated as high-integrity by the NewClimate Institute Corporate Climate Responsibility Monitor. |
- **SBTi registry, Net Zero Tracker database, company sustainability reports, third-party assurance statements** → Pledge parsing, credibility dimension scoring, greenwashing flag generation → **Entity NZCS scores, peer benchmarking, engagement priority lists for active stewardship**

## 5 · Intermediate Transformation Logic
**Methodology:** Net Zero Credibility Score
**Headline formula:** `NZCS = Σ wᵢ × Dimensionᵢ`

Weighted composite of coverage (scope 1/2/3), interim target specificity, offset reliance, governance, and third-party verification; each dimension scored 0–100.

**Standards:** ['Net Zero Tracker 2024', 'NewClimate Institute Corporate Climate Responsibility Monitor']
**Reference documents:** Net Zero Tracker (Energy & Climate Intelligence Unit) 2024; NewClimate Institute Corporate Climate Responsibility Monitor 2023; SBTi Net-Zero Standard Version 1.1 2021; UN High Level Expert Group on Net Zero Pledges Report 2022

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Real signatory targets from SBTi and Net Zero Tracker (analytics ladder: rung 1 → 3)

**What.** §7 confirms a genuine strength: the alliance-level facts and signatory rosters are real and current (NZAM 315 members/$43T, NZAOA 88/$11T, NZBA 144/$74T, plus the real withdrawn set — Vanguard, Invesco, T. Rowe Price, Janus Henderson, QBE, and 120 real institution names). What's synthetic is each signatory's target and progress: `actualReduction = interimTarget·(0.3 + s2·0.8)` and `targetYear = 2040 + floor(s2·4)·5` are seeded. Evolution A replaces those with real pledge data, making the commitment-vs-action gap an actual measurement.

**How.** (1) Ingest the SBTi Companies Taking Action registry (public CSV) and the Net Zero Tracker dataset (both named in §5) into a `net_zero_pledges` table keyed to the existing real firm names: net-zero year, interim target, Scope 3 inclusion, offset cap, verification status. (2) Compute the gap from actual reported emissions trajectories (OWID/CDP data in the refdata layer) versus the pledged interim target — replacing the seeded `actualReduction`. (3) Implement the §5 NZCS credibility composite (`Σ wᵢ × Dimensionᵢ` over coverage/interim/offset/governance/verification) from these real fields, so the greenwashing-signal flags §1 describes are data-driven.

**Prerequisites.** SBTi/Net Zero Tracker ingestion (both free but need refresh cadence); firm-name reconciliation to LEI for clean joins. **Acceptance:** each signatory's commitment-action gap derives from a real pledge and real reported emissions; the withdrawn set and rosters stay accurate; no `sr()` remains in target/progress fields.

### 9.2 Evolution B — Stewardship copilot for pledge scrutiny (LLM tier 1 → 2)

**What.** A copilot for the stewardship/ESG-ratings users §1 targets: "which NZAM signatories have the widest commitment-action gap?", "does HSBC's pledge include Scope 3?", "flag greenwashing signals for this holding" — grounded in the alliance facts (real) and, post-Evolution-A, the real pledge fields and NZCS decomposition.

**How.** Tier 1 works immediately for alliance-structure questions (membership, AUM, withdrawals, secretariats — all real). Tier 2, after Evolution A: tool calls against the pledge-query and NZCS endpoints for signatory-specific credibility scores, with the fabrication validator matching quoted gaps and dimension scores to tool outputs. The copilot must clearly separate real alliance facts from computed credibility judgments in its provenance, and refuse to assert a company is "greenwashing" beyond flagging the specific NZCS dimensions that scored low (an evidenced signal, not an accusation).

**Prerequisites.** Tier 1 needs only the current real roster data but must disclose that per-signatory targets are illustrative until Evolution A; credibility scoring needs the real pledges. **Acceptance:** alliance facts cite the roster data; credibility answers (post-Evolution-A) trace to NZCS tool calls; "is X greenwashing?" returns the dimension-level evidence, not a verdict.