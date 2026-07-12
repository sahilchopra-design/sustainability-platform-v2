## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide (EP-DK3) describes a **6-pillar governance composite**
> with `BoardScore = IndependenceRatio × DiversityScore × ExpertiseIndex`, a climate-lobbying
> **AlignmentScore = ClimateLobbyingAlignmentRatio** (via InfluenceMap), and empirically-derived
> pillar weights. **None of that composite logic exists.** The page fabricates 80 companies with
> `sr()`-drawn scores; the only composite is a flat `esgTotal = 0.33·E + 0.33·S + 0.34·G`. Board
> diversity, anti-corruption, audit quality, shareholder rights, executive pay, whistleblower and
> lobbying flags are **independent PRNG draws**, not derived from board data or InfluenceMap. §8
> specifies the missing governance model.

### 7.1 What the module computes

Per-company (all seeded), then simple portfolio averages:

```js
eScore = round(20 + sr(i*13)*75)          // 20–95
sScore = round(20 + sr(i*17)*75)
gScore = round(20 + sr(i*19)*75)
esgTotal = round(0.33·eScore + 0.33·sScore + 0.34·gScore)      // the only real formula
controversies   = floor(sr(i*23)*8)        // 0–7
antiCorruption  = 1 + sr(i*29)*9           // 1–10
boardDiversity  = 10 + sr(i*43)*55         // 10–65 %
executivePay    = 10 + sr(i*37)*390        // 10–400 (CEO-pay ratio proxy)
whistleblowerPolicy = sr(i*41) > 0.4       // boolean
lobbyingDisclosure  = sr(i*59) > 0.45      // boolean
esgTier = esgTotal≥65 Top · ≥40 Mid · else Bottom
```

Aggregates: `avgEsg`, `avgG`, `avgCont`, `avgDiv` (means over filtered set); `bySector`/`byCountry`
group averages; two scatters (`gScore vs controversies`, `boardDiversity vs gScore`).

### 7.2 Parameterisation

| Field | Range / formula | Provenance |
|---|---|---|
| E/S/G scores | `20 + sr(·)×75` (20–95) | synthetic demo value |
| esgTotal weights | 0.33 / 0.33 / 0.34 | near-equal pillar weight (arbitrary, not materiality-derived) |
| Governance sub-metrics (1–10) | `1 + sr(·)×9` | synthetic demo value |
| Board diversity | 10–65% | synthetic (spans typical board-female-representation range) |
| Executive pay | 10–400 | synthetic CEO-pay-ratio proxy |
| esgTier bands | ≥65 Top / ≥40 Mid | platform tiering convention |

Sectors (10) and countries (10) are curated label lists; company names are `Corp A…Z` placeholders.

### 7.3 Calculation walkthrough

1. 80 companies fabricated from `sr(i·k)`; each gets E/S/G, a flat-weighted `esgTotal`, tier, and ~10
   governance sub-attributes.
2. KPI cards: `avgEsg`, `avgG`, `avgCont`, `avgDiv` over the filtered set.
3. Sector/country tabs: `bySector`/`byCountry` average the relevant metric per group.
4. Governance tab: scatter of `gScore vs controversies` (intended to show high-governance = fewer
   controversies, but both axes are independent draws so any pattern is coincidental).
5. Board-diversity tab: scatter of `boardDiversity vs gScore` (same caveat).

### 7.4 Worked example (i = 0)

`sr(13)=frac(sin(14)×10⁴)`. `sin(14 rad)=0.9906`, ×10⁴=9906.1, frac ≈ 0.14 → `eScore = round(20 +
0.14×75) = round(30.5) = 31`. Similarly `sScore`, `gScore` from `sr(17)`, `sr(19)`. If those come out
31 / 58 / 44, then `esgTotal = round(0.33×31 + 0.33×58 + 0.34×44) = round(10.23 + 19.14 + 14.96) =
round(44.3) = 44` → Mid tier. Reproducible, but the constituent scores encode no real governance data.

### 7.5 Data provenance & limitations

- **Fully synthetic** (`sr(s)=frac(sin(s+1)×10⁴)`); every governance metric is an independent draw, so
  the scatter plots that imply relationships (governance↔controversies, diversity↔governance) show
  only noise.
- `esgTotal` weights (0.33/0.33/0.34) are near-equal and arbitrary — not SASB-materiality or
  empirically-derived as the guide claims.
- Climate-lobbying alignment (the guide's distinctive InfluenceMap feature) is reduced to a single
  boolean `lobbyingDisclosure` draw; no trade-association-vs-pledge alignment is computed.
- No board-independence ratio, expertise index, or say-on-pay linkage despite the guide's `BoardScore`
  formula.

**Framework alignment:** the guide invokes **MSCI ESG Governance**, **ISS ESG Corporate Rating**,
**Sustainalytics** and **CDP Climate Governance**, plus **InfluenceMap** lobbying alignment; the
module references them as labels only. Real MSCI governance scoring weights board (independence,
diversity, tenure), pay, ownership and accounting key-issues; ISS QualityScore is a percentile-ranked
governance decile; InfluenceMap grades A–F on the gap between a company's own climate position and its
trade-association lobbying — none of which is implemented here.

### 8 · Model Specification

**Status: specification — not yet implemented in code.**

**8.1 Purpose & scope.** Produce a governance sub-score (0–100) and climate-lobbying alignment grade
for equity issuers, for ESG-integrated analysis, active-ownership prioritisation and governance
exclusion screens.

**8.2 Conceptual approach.** A weighted governance key-issue model mirroring **MSCI ESG governance
pillar** and **ISS QualityScore** (percentile-ranked governance signals), with an **InfluenceMap-style
lobbying-alignment** overlay comparing a firm's stated climate position to its trade-association
memberships.

**8.3 Mathematical specification.**
- Board score: `B = 0.40·Independence + 0.25·Diversity + 0.20·Expertise + 0.15·(1−CombinedChairCEO)`,
  each sub 0–1.
- Pay alignment: `P = 1 − |PayForPerformanceGap|` (say-on-pay dissent + pay-vs-TSR percentile).
- Integrity: `I` from anti-corruption controls, audit tenure/independence, tax-transparency, minus
  controversy penalties.
- Lobbying alignment: `L = Σ_a membership_a·position_a / Σ membership_a` (InfluenceMap A–F mapped 0–1).
- Governance composite: `G = 100·(w_B·B + w_P·P + w_I·I + w_L·L)`, `w` = MSCI-style key-issue weights.

| Parameter | Source |
|---|---|
| Board fields | ISS / BoardEx |
| Key-issue weights `w` | MSCI governance methodology |
| Lobbying grades | InfluenceMap A–F |
| Say-on-pay dissent, pay-vs-TSR | proxy filings / ISS |
| Controversy penalties | RepRisk / MSCI controversies |

**8.4 Data requirements.** Director-level board data, proxy-vote outcomes, executive-pay-vs-TSR,
audit-firm tenure, InfluenceMap grades, controversy feed. None present; module holds only synthetic
rows.

**8.5 Validation & benchmarking plan.** Reconcile G against MSCI/ISS governance deciles; test whether
low-G predicts the guide's cited −2.3% p.a. governance-quintile underperformance; sensitivity to
key-issue weighting; audit lobbying-alignment against InfluenceMap published grades.

**8.6 Limitations & model risk.** Board "expertise" is judgemental; lobbying alignment depends on
trade-association attribution; pay-for-performance metrics are horizon-sensitive; governance signals
are slow-moving so momentum adds little.
