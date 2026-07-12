# ESG Governance Scorer
**Module ID:** `esg-governance-scorer` · **Route:** `/esg-governance-scorer` · **Tier:** B (frontend-computed) · **EP code:** EP-DK3 · **Sprint:** DK

## 1 · Overview
Comprehensive governance scoring across ESG dimensions using MSCI, ISS, Sustainalytics, and CDP governance frameworks. Models board independence, audit quality, anti-corruption, political lobbying alignment with climate commitments, and controversy screening.

> **Business value:** Applicable to ESG-integrated equity analysis, active ownership engagement programmes, and investment mandates with governance exclusion screens. Provides systematic scoring across all major ESG rating provider methodologies for governance comparison and gap analysis.

**How an analyst works this module:**
- Select company for governance scoring
- Score board composition and independence
- Assess climate lobbying alignment via InfluenceMap
- Evaluate controversy and anti-corruption record
- Generate MSCI/ISS/Sustainalytics-comparable governance scorecard

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `COMPANIES`, `COUNTRIES`, `KpiCard`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(sr(i * 7) * SECTORS.length)];` |
| `country` | `COUNTRIES[Math.floor(sr(i * 11) * COUNTRIES.length)];` |
| `eScore` | `Math.round(20 + sr(i * 13) * 75);` |
| `sScore` | `Math.round(20 + sr(i * 17) * 75);` |
| `gScore` | `Math.round(20 + sr(i * 19) * 75);` |
| `esgTotal` | `Math.round((eScore * 0.33 + sScore * 0.33 + gScore * 0.34));` |
| `controversies` | `Math.floor(sr(i * 23) * 8);` |
| `antiCorruption` | `parseFloat((1 + sr(i * 29) * 9).toFixed(1));` |
| `taxTransparency` | `parseFloat((1 + sr(i * 31) * 9).toFixed(1));` |
| `executivePay` | `parseFloat((10 + sr(i * 37) * 390).toFixed(0));` |
| `whistleblowerPolicy` | `sr(i * 41) > 0.4;` |
| `boardDiversity` | `parseFloat((10 + sr(i * 43) * 55).toFixed(1));` |
| `shareholderRights` | `parseFloat((1 + sr(i * 47) * 9).toFixed(1));` |
| `auditQuality` | `parseFloat((1 + sr(i * 53) * 9).toFixed(1));` |
| `lobbyingDisclosure` | `sr(i * 59) > 0.45;` |
| `avgEsg` | `(filtered.reduce((a, c) => a + c.esgTotal, 0) / n).toFixed(1);` |
| `avgG` | `(filtered.reduce((a, c) => a + c.gScore, 0) / n).toFixed(1);` |
| `avgCont` | `(filtered.reduce((a, c) => a + c.controversies, 0) / n).toFixed(1);` |
| `avgDiv` | `(filtered.reduce((a, c) => a + c.boardDiversity, 0) / n).toFixed(1);` |
| `bySector` | `SECTORS.map(s => {` |
| `byCountry` | `COUNTRIES.map(cn => {` |
| `scatterData` | `filtered.map(c => ({ x: c.gScore, y: c.controversies, name: c.name }));` |
| `divScatter` | `filtered.map(c => ({ x: c.boardDiversity, y: c.gScore, name: c.name }));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COUNTRIES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Governance Risk Premium | — | MSCI ESG Research 2023 | Bottom governance quintile companies underperform by 2.3% annually — strongest ESG-returns relationship |
| Climate Lobbying Misalignment | — | InfluenceMap 2023 | 65% of S&P 500 companies belong to trade associations lobbying against climate policy — misaligned with pledges |
| Board Independence | — | ISS Proxy Advisory Guidelines 2024 | ISS recommends 85% independent directors — key governance metric in ESG ratings |
- **Board composition databases (ISS, BoardEx)** → Governance baseline → **Director independence, expertise, tenure, diversity scores**
- **InfluenceMap lobbying analysis** → Climate lobbying alignment → **Company and trade association climate policy alignment grade**
- **Controversy databases (RepRisk, MSCI)** → Controversy screening → **Governance controversy incidents and ESG rating impact**

## 5 · Intermediate Transformation Logic
**Methodology:** ESG Governance Composite Score
**Headline formula:** `GovernanceScore = Σ [w_pillar × PillarScore]; BoardScore = IndependenceRatio × DiversityScore × ExpertiseIndex; AlignmentScore = ClimateLobbyingAlignmentRatio`

Composite score aggregates 6 governance pillars with weights derived from empirical relationship with long-run shareholder value; lobbying alignment penalises companies whose trade association positions contradict their own climate pledges

**Standards:** ['MSCI ESG Governance Methodology 2024', 'ISS ESG Corporate Rating Governance', 'Sustainalytics ESG Risk Rating Governance', 'CDP Climate Governance Survey 2023']
**Reference documents:** MSCI ESG Ratings Methodology 2024 — Governance Pillar; ISS ESG Corporate Rating Governance Framework 2024; Sustainalytics ESG Risk Rating Governance Category; CDP — Climate Governance Survey Methodology 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Build the 6-pillar governance composite on real board and lobbying data (analytics ladder: rung 1 → 2)

**What.** The §7 flag: the guide's governance model — `BoardScore = IndependenceRatio × DiversityScore × ExpertiseIndex`, a climate-lobbying `AlignmentScore` via InfluenceMap, empirically-weighted pillars — has no implementation. The page's 80 companies carry `sr()`-drawn board diversity, anti-corruption, audit quality, shareholder rights, and lobbying flags; the only composite is a flat `0.33E + 0.33S + 0.34G`. Evolution A builds the governance vertical per the page's own §8 spec, on data that is largely public.

**How.** (1) `governance_profiles` table populated from public proxy-statement data: board size, independence counts, tenure, gender diversity are disclosed in filings and available via free sources for major indices; committee structure and auditor from the same filings. (2) `services/governance_engine.py` implementing the pillar composite as specified — board (independence × diversity × expertise), audit quality, anti-corruption/whistleblower policy flags (real policy-existence checks, entered with source links), shareholder rights, executive pay ratio (from disclosed CEO-pay-ratio figures), lobbying alignment. (3) Lobbying: InfluenceMap grades are published for major companies — curate with as-of dates, or return honest-null where ungraded; never a seeded boolean. (4) Cross-module reuse: `dme-competitive`'s Evolution A needs exactly this governance percentile input; wire it. (5) Rung 2: what-ifs on governance changes ("board refresh to 85% independence per ISS guidance") recompute the composite.

**Prerequisites.** Proxy-data collection scope decision (start with ~100 large caps); pillar weights documented — the guide claims "empirically derived," so either derive them (regression against long-run returns, published) or label them judgmental. **Acceptance:** a real company's board pillar reproduces from its filing's counts; ungraded lobbying shows null; zero `sr()`; the weight provenance is stated in the response payload.

### 9.2 Evolution B — Proxy-season governance analyst (LLM tier 2)

**What.** A tool-calling analyst for active-ownership workflows: "score this company's governance, compare to sector, and flag what we should vote on or engage about this proxy season." It runs Evolution A's engine, decomposes the composite by pillar, benchmarks against the sector distribution, and drafts the engagement/voting brief — citing the specific data behind each flag ("independence 62% vs ISS's 85% guideline; two >12-year tenures on audit committee") from the stored profile.

**How.** Tools: `score_governance(entity)`, `get_profile(entity)`, `compare_sector(entity)`, `get_lobbying_grade(entity)`. Grounding corpus = this Atlas record's §5 formula and the ISS/MSCI/Sustainalytics methodology references — the analyst explains which provider convention a given metric follows, since definitions differ (independence definitions being the classic trap). Voting recommendations are framed against the org's stated voting policy (per-org context), with each recommendation tied to a profile field; the InfluenceMap-based lobbying critique quotes the grade and date, refusing when null.

**Prerequisites (hard).** Evolution A — an engagement brief citing seeded whistleblower-policy booleans for real companies would put false factual claims in stewardship correspondence. **Acceptance:** a golden company's brief cites only stored profile fields with sources; the sector comparison reproduces from the engine; a company with null lobbying data gets "not graded," not an inferred alignment.