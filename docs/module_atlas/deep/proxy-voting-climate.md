## 7 · Methodology Deep Dive

This module is a **static proxy-voting analytics dashboard** — six tabs (Voting Dashboard,
Say-on-Climate Tracker, Shareholder Resolutions, Management vs Shareholder, Director Climate Score,
Voting Policy Alignment) rendered from hand-curated constant tables. There is **no runtime
computation**: no `sr()` seeding, no `reduce`/aggregation, no state beyond the active tab and a
watchlist toggle. The data is realistic and specific (named companies, plausible vote percentages),
which makes it a credible qualitative reference, but the guide's two formulas are **not implemented
as code** — the figures they would produce are pre-entered literals.

### 7.1 What the module computes

Nothing is derived. The guide's `Alignment = votes_with_climate_policy / total_climate_votes` and the
director score `expertise + training + committee` appear only as **pre-baked fields**:

- `POLICY_ALIGNMENT` — 5 frameworks each with literal `aligned / partial / notAligned` percentages
  (e.g. IIGCC 82/12/6). These sum to 100 by construction; no division is performed.
- `DIRECTOR_SCORES` — each company carries `expertise`, `training`, `committee` (bool), **and** a
  final `score` — but `score` is a stored literal, not computed from the three inputs. (Inspection
  shows `score` ≈ the expertise value, not a formula of all three.)
- `SOC_TRACKER` — Say-on-Climate support for 8 companies across 2023→2024 (real-looking: Shell
  80→77, TotalEnergies 89→75, Woodside 51→48).
- `RESOLUTIONS`, `SUPPORT_TREND`, `MGMT_ALIGNMENT` — hand-authored tables mapped directly to charts.

Headline KPIs ("50 climate resolutions", "36% avg support 2025", "8 majority achieved") are **string
literals** in the card calls, not computed from the tables.

### 7.2 Parameterisation / provenance

| Displayed value | Source | Provenance |
|---|---|---|
| Say-on-Climate support (2023/2024) | `SOC_TRACKER` | hand-curated (realistic real votes) |
| Resolution topics & counts | `RESOLUTIONS` | hand-curated |
| Support trend 2020–25 | `SUPPORT_TREND` | hand-curated (22%→36% rise) |
| Mgmt vs shareholder support | `MGMT_ALIGNMENT` | hand-curated (Exxon 22/62 misaligned) |
| Director scores | `DIRECTOR_SCORES` | hand-curated; `score` pre-baked, not derived |
| Policy alignment % | `POLICY_ALIGNMENT` | hand-curated per framework |
| Headline KPIs | inline string literals | hand-authored |

### 7.3 Calculation walkthrough

Constant → chart. The Say-on-Climate tab plots `support` vs `support2` per company; the trend tab
plots `avgSupport` and `resolutions` on dual axes; the management tab compares `mgmtSupport` vs
`shSupport` and flags `aligned`. No user input alters any figure.

### 7.4 Worked example

There is no numeric pipeline. If the guide's alignment formula were applied to `POLICY_ALIGNMENT`
for IIGCC (aligned 82, partial 12, notAligned 6), a "policy alignment %" of 82/(82+12+6)=82% would
result — which equals the stored `aligned` field, confirming the percentages were authored to sum
to 100 rather than computed from vote records. The director score for Rio Tinto shows expertise 82,
training 75, committee true, and a final `score` of 82 — the arithmetic mean of the first two would
be 78.5, so `score` is not `mean(expertise, training)`; it is a hand-set value tracking expertise.

### 7.5 Data provenance & limitations

- **All values are hand-curated literals** — no `sr()` seeding, but also no live computation.
- The **Say-on-Climate and management-vs-shareholder figures are realistic** and could be sourced from
  real 2023–24 proxy seasons, giving genuine qualitative value.
- The **director climate score is not derived** from its stated inputs (expertise/training/committee);
  it is a pre-entered number, so the guide's scoring formula is aspirational.
- Policy-alignment percentages are authored, not computed from a vote ledger; there is no vote-record
  table to aggregate.
- No interactivity beyond tab/watchlist; Export/Bookmark buttons are non-functional stubs.

**Framework alignment:** **IIGCC** (Institutional Investors Group on Climate Change) voting
expectations, **PRI Active Ownership**, **Climate Action 100+ (CA100+)** net-zero benchmark voting
guidance, **UK Stewardship Code**, and **ISS climate policy** are all referenced as alignment
benchmarks. **Say-on-Climate** is the advisory shareholder vote on a company's climate transition
plan (a real governance mechanism, pioneered 2021). The module presents these accurately as content
but implements none of their scoring logic.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Compute (a) a voting-policy alignment score from an institution's actual
vote ledger against its stated climate policy, and (b) a board director climate-competence score from
observable governance attributes. Coverage: any issuer with a proxy record and board disclosure.

**8.2 Conceptual approach.** (i) Alignment as a **coverage-weighted vote concordance**, mirroring
PRI's Active Ownership 2.0 stewardship-quality assessment and CA100+ voting benchmark scoring. (ii)
A **director climate-competence index** blending expertise, training, and committee mandate, mirroring
ISS/Glass Lewis board-quality scorecards and the TCFD governance pillar.

**8.3 Mathematical specification.**
Alignment: for each climate resolution r with the institution's policy-recommended vote `p_r` and
actual vote `a_r`, `concordance = Σ_r w_r·1{a_r = p_r} / Σ_r w_r`, `w_r` = holding value or
resolution materiality. Report per framework by restricting r to that framework's flagged resolutions.
Director score: `D = ω_e·expertise + ω_t·training + ω_c·100·committee`, weights ω summing to 1
(e.g. 0.5/0.3/0.2), each input normalised 0–100. Board index = weighted mean over directors.

| Parameter | Symbol | Calibration source |
|---|---|---|
| Resolution weight | `w_r` | holding value / IIGCC materiality |
| Policy-recommended vote | `p_r` | institution's climate voting policy (IIGCC/CA100+) |
| Score weights | ω_e,ω_t,ω_c | ISS/Glass Lewis board-quality conventions |

**8.4 Data requirements.** Actual vote ledger (resolution, vote cast, holding), policy-recommended
votes, board bios (climate expertise, training records, committee charters). Sources: ISS/Glass Lewis
data, proxy filings, company governance reports. None present in the platform today.

**8.5 Validation & benchmarking.** Reconcile alignment against CA100+ published investor scorecards;
compare director index ordering to ISS QualityScore governance pillar; audit vote-ledger completeness.

**8.6 Limitations & model risk.** Policy-recommended votes are judgemental (frameworks disagree);
director "expertise" is hard to observe objectively. Conservative fallback: report alignment only for
resolutions with an unambiguous policy mapping, and disclose the framework and coverage explicitly.
