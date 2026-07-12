# Social License Risk Engine
**Module ID:** `social-license-risk` · **Route:** `/social-license-risk` · **Tier:** B (frontend-computed) · **EP code:** EP-CO2 · **Sprint:** CO

## 1 · Overview
15 projects with community benefit agreement tracking, FPIC compliance, and protest/litigation risk.

**How an analyst works this module:**
- Social License Dashboard shows 15 projects with risk scores
- Community Benefit Tracking compares promised vs delivered

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FPIC_COLORS`, `FPIC_STATUS`, `PROJECTS`, `STAKEHOLDERS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROJECTS` | 16 | `name`, `country`, `sector`, `slScore`, `benefitDelivered`, `fpic`, `delayYrs`, `protests`, `litigations`, `jobsPromised`, `jobsDelivered`, `revenueSharePct`, `revenueShareDelivered` |
| `STAKEHOLDERS` | 9 | `influence`, `interest`, `stance` |
| `FPIC_STATUS` | 6 | `value` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `filtered` | `useMemo(() => sectorFilter === 'All' ? PROJECTS : PROJECTS.filter(p => p.sector === sectorFilter), [sectorFilter]); const sectors = [...new Set(PROJECTS.map(p => p.sector))];` |
| `avgSL` | `filtered.length ? Math.round(filtered.reduce((s, p) => s + p.slScore, 0) / filtered.length) : 0;` |
| `totalProtests` | `filtered.reduce((s, p) => s + p.protests, 0);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPIC_COLORS`, `FPIC_STATUS`, `PROJECTS`, `STAKEHOLDERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Projects | — | Portfolio | With community impact assessments |
| Avg Timeline Delay | — | Historical | Delay from social opposition |

## 5 · Intermediate Transformation Logic
**Methodology:** Social license risk scoring
**Headline formula:** `SocialRisk = 0.30×FPIC + 0.25×CommunityGap + 0.25×ProtestRisk + 0.20×LitigationRisk`

Promise vs delivery tracking for community benefits (jobs, infrastructure, revenue sharing). Timeline delay risk: social opposition can add 1-5 years to project completion.

**Standards:** ['IFC PS', 'UNDRIP']
**Reference documents:** IFC Performance Standards; UNDRIP

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's calculation engine formula —
> `SocialRisk = 0.30×FPIC + 0.25×CommunityGap + 0.25×ProtestRisk + 0.20×LitigationRisk` — **is not
> implemented in the code.** `slScore` (the "Social License Score" shown throughout the page) is a
> **hand-typed constant per project**, not a weighted aggregation of the four named inputs. The sections
> below document the 15 hand-authored real-project case studies and the descriptive analytics actually
> rendered.

### 7.1 What the module computes

`PROJECTS` is a **fixed, hand-authored** array of 15 real, named extractive/energy projects (Atacama Solar
Farm, Adani Carmichael coal mine, Trans Mountain Pipeline, Oyu Tolgoi copper, Simandou iron ore, etc.) —
unlike most modules in this batch, there is **no `sr()` PRNG anywhere in this file**; every number is a
manually entered estimate. Each project carries `slScore` (0–100, hand-set), `benefitDelivered` (%),
`fpic` status (Obtained/Pending/Contested/Withheld/Not Sought/N/A), `delayYrs`, `protests`, `litigations`,
jobs promised/delivered, and revenue-share committed/delivered percentages. A separate `STAKEHOLDERS` array
(8 generic stakeholder archetypes: Local Community, Indigenous Groups, NGOs, Investors, etc.) carries
hand-set `influence`/`interest` scores and a `stance` label for a generic influence-interest matrix (not
project-specific).

### 7.2 Parameterisation

| Field | Rule | Provenance |
|---|---|---|
| `slScore` | hand-typed 25–85 per project | **not computed from FPIC/protest/litigation/benefit data on the same row** — e.g. Adani Carmichael shows `slScore=25` with 45 protests and 8 litigations (directionally consistent) but no formula ties the two |
| `fpic` | 6-value categorical, hand-assigned | UNDRIP Free, Prior and Informed Consent status — realistic categories, manually judged |
| `delayYrs` | 0.2–5.0, hand-typed | plausible real-world magnitude (matches public reporting on projects like Adani Carmichael's multi-year delays) but not derived from `protests`/`litigations` via any stated function |
| `STAKEHOLDERS.influence`/`.interest` | hand-set 0–100 per archetype | generic power/interest-matrix values, not linked to any specific project in `PROJECTS` |

### 7.3 Calculation walkthrough

- **Dashboard KPIs**: `avgSL` = mean `slScore` over the (sector-)filtered project set; `totalProtests` = sum
  of `protests`. Both are simple aggregations of hand-entered numbers.
- **Community Benefit Tracking**: bar comparisons of `jobsPromised` vs `jobsDelivered` and
  `revenueSharePct` (committed) vs `revenueShareDelivered` (actual) — a straightforward promise-vs-delivery
  gap visualisation, no scoring formula.
- **FPIC Compliance table**: lists `fpic` status per project alongside `slScore` and `protests` — descriptive
  cross-tabulation, no compliance score computed.
- **Project Timeline Risk**: sorts projects by `delayYrs`; a scatter of `slScore` vs `delayYrs` (bubble size =
  `protests`) visually suggests the intuitive relationship (lower SL score → longer delay) but this is an
  artefact of how the values were manually entered, not a fitted or computed correlation.
- **Stakeholder Map**: renders the generic `STAKEHOLDERS` radar (influence vs interest) — same 8 rows
  regardless of which project or sector filter is active.

### 7.4 Worked example (Adani Carmichael, hand-entered values)

| Field | Value |
|---|---|
| `slScore` | 25 |
| `fpic` | Contested |
| `delayYrs` | 5.0 |
| `protests` / `litigations` | 45 / 8 |
| `jobsPromised` / `jobsDelivered` | 10,000 / 2,100 (21% delivery rate) |
| `revenueSharePct` / delivered | 0% / 0% |

If the guide's stated formula *were* applied — `SocialRisk = 0.30×FPIC + 0.25×CommunityGap +
0.25×ProtestRisk + 0.20×LitigationRisk` — a "Contested" FPIC status, a 79-point community benefit gap
(promised−delivered jobs, normalised), and the highest protest/litigation counts in the dataset would drive
the *highest* social risk score in the portfolio, consistent with the hand-typed `slScore=25` (lowest
license score, on a scale where higher = better). The hand-entered value is directionally plausible but is
not reproducible from a documented calculation.

### 7.5 FPIC status taxonomy (as used)

| Status | Meaning |
|---|---|
| Obtained | Free, Prior and Informed Consent formally secured from affected indigenous/local communities |
| Pending | FPIC process underway, not concluded |
| Contested | Community or indigenous groups actively dispute consent validity |
| Withheld | Consent formally refused |
| Not Sought | Developer did not initiate an FPIC process |
| N/A | Project type/location does not trigger FPIC applicability (e.g. offshore, non-indigenous land) |

### 7.6 Data provenance & limitations

- **All 15 projects and their metrics are hand-authored, single-point-in-time estimates** by the platform
  team, informed by public reporting on these real, named projects — not a live data feed, not independently
  sourced/cited per field, and not reproducible by re-running any calculation.
- The guide's weighted `SocialRisk` formula has **zero implementation** — `slScore` cannot be recomputed or
  audited from the other fields shown on the same row.
- `STAKEHOLDERS` is a single generic archetype set applied uniformly to all 15 projects regardless of sector,
  geography, or actual stakeholder composition — a mining project in Guinea and an offshore wind project in
  the UK show the identical stakeholder influence/interest map.
- No time-series (only current-state snapshot) — cannot show whether FPIC status or protest counts are
  trending up or down.

### 7.7 Framework alignment

- **IFC Performance Standards (PS1–PS8)** — the FPIC/community-benefit/stakeholder-engagement fields
  correctly reflect IFC PS7 (Indigenous Peoples) and PS1 (stakeholder engagement) categories, at a
  descriptive rather than scored level.
- **UNDRIP (UN Declaration on the Rights of Indigenous Peoples)** — the FPIC status taxonomy is UNDRIP-
  consistent terminology.
- **Thomson & Boutilier (2011) Social License to Operate pyramid** — cited as a reference; the module's
  0–100 `slScore` is loosely inspired by SLO's "acceptance → approval → psychological identification"
  ladder but does not implement the pyramid's tiered logic.

## 8 · Model Specification

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope

Give extractive/energy project developers and their lenders (Equator Principles signatories) a reproducible,
auditable social-license risk score to replace the current hand-typed `slScore`, supporting go/no-go and
covenant-monitoring decisions across the project lifecycle.

### 8.2 Conceptual approach

Implement the guide's own weighted-composite formula properly, benchmarked against the **Thomson & Boutilier
SLO pyramid** (4 tiers: withheld → acceptance → approval → psychological identification) for the FPIC/
community dimensions, and against **Equator Principles / IFC PS** categorical risk gates for the
litigation/protest dimensions — similar in spirit to how ESG controversy-severity models (RepRisk,
Sustainalytics) convert qualitative incident data into a bounded risk score.

### 8.3 Mathematical specification

```
FPIC_score        = {Obtained:100, Partial:60, Pending:40, Withheld:10, Contested:5, N/A:null→exclude}
CommunityGap      = 100 × (1 − mean(jobsDelivered/jobsPromised, revenueShareDelivered/revenueSharePct))
ProtestRisk       = 100 × (1 − exp(−protests / τ_protest))        // saturating exposure curve, τ calibrated per sector
LitigationRisk    = 100 × (1 − exp(−litigations / τ_litigation))

SocialRisk = 0.30×FPIC_score + 0.25×(100−CommunityGap) + 0.25×(100−ProtestRisk) + 0.20×(100−LitigationRisk)
DelayRisk_years = γ × (100 − SocialRisk)/100          // γ fit via regression on realised delay data
```
`τ_protest`/`τ_litigation` are saturation constants (e.g. τ=20 means risk approaches its ceiling around 20
cumulative events) calibrated by sector from historical project databases (ICMM member disclosures for
mining, Equator Principles annual reports for project finance more broadly).

| Parameter | Calibration source |
|---|---|
| FPIC tier scores | Thomson & Boutilier SLO pyramid mapping |
| τ_protest, τ_litigation | Regression against ICMM/Equator Principles historical project delay database |
| γ (delay elasticity) | OLS fit: realised construction delay vs SocialRisk score, cross-project |

### 8.4 Data requirements

Structured project registry (FPIC status with date-stamped updates, protest/litigation event log with
dates and severity, jobs/revenue-share delivery tracked against commitments) — none of which currently
exists as a live-updating table; would need a new `social_license_projects` schema plus an event-log table
for protests/litigations to support the saturating-exposure formula.

### 8.5 Validation & benchmarking plan

Backtest `DelayRisk_years` against realised construction delays for the 15 seed projects (all real, so
actual delay outcomes are publicly documented and can serve as an initial validation set). Compare
`SocialRisk` rankings against any available third-party ESG controversy scores for the same issuers/projects
(Sustainalytics controversy ratings, RepRisk RRI) as an external cross-check.

### 8.6 Limitations & model risk

Protest/litigation counts are a noisy, jurisdiction-biased proxy for social risk (countries with strong
judicial systems generate more *litigations* per unit of actual grievance than countries without); any
production model should normalise by a jurisdiction rule-of-law index (e.g. World Bank WGI Rule of Law) or
flag counts as not cross-nationally comparable.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the weighted risk formula and add news-driven signal (analytics ladder: rung 1 → 2)

**What.** The module is a hand-authored case-study library — 15 real named extractive/energy projects (Adani Carmichael, Trans Mountain, Oyu Tolgoi, Simandou) with manually entered `slScore`, FPIC status, protests, litigations, and community-benefit delivery. There is no `sr()` anywhere, which is honest, but §7 flags that the guide's headline `SocialRisk = 0.30×FPIC + 0.25×CommunityGap + 0.25×ProtestRisk + 0.20×LitigationRisk` is **not implemented** — `slScore` is a hand-typed constant that cannot be recomputed or audited from the other fields on its own row. Evolution A makes the score a real function of its inputs and adds a live signal so the snapshot isn't frozen.

**How.** (1) Implement the weighted formula in a small backend endpoint: normalise FPIC status to a 0–100 sub-score, compute community-gap from promised-vs-delivered, and scale protest/litigation counts — so `slScore` is derived and auditable, with the hand-set values retained only as a validation reference. (2) Add a live controversy signal: query GDELT (free, keyless, already used elsewhere on the platform) for protest/litigation news per project, giving `protests`/`litigations` a refreshable basis and enabling a trend rather than the current single snapshot. (3) Project-specific stakeholder maps replacing the one generic `STAKEHOLDERS` archetype set applied uniformly to a Guinea mine and a UK offshore wind farm.

**Prerequisites.** FPIC-to-score and protest-count normalisation need defensible bands (IFC PS7 informs FPIC weighting); GDELT entity matching to project names. **Acceptance:** `slScore` recomputes from the four named inputs and matches the formula; changing protest count moves the score; each project shows a distinct stakeholder map.

### 9.2 Evolution B — Social-license monitoring copilot (LLM tier 2)

**What.** A copilot for the ESG/project-finance analyst: "what's driving Adani Carmichael's low social-license score?", "which projects have contested FPIC and rising protest activity?", "summarise this quarter's community-benefit delivery gaps". It reads the derived sub-scores and, post-Evolution-A, the live GDELT feed — narrating why a score is what it is from its components and surfacing emerging opposition news with dated citations.

**How.** Tier-2 pattern once the live feed exists: the GDELT query is a tool call; the LLM reads returned articles, classifies them as protest/litigation/community-relations signal per project, and updates the risk narrative. Score explanations decompose the weighted formula (FPIC/gap/protest/litigation contributions). Every controversy claim cites a retrievable article; the fabrication validator checks score figures against the endpoint. IFC PS7 / UNDRIP framework grounding for the FPIC interpretation.

**Prerequisites (hard).** Evolution A — with `slScore` hand-typed and unauditable, the copilot could only restate a number it cannot explain, and there is no live feed to monitor. **Acceptance:** every score explanation ties to the formula's components; each emerging-risk claim links to a GDELT article; a project with no recent news yields "no new signal," not an invented protest.