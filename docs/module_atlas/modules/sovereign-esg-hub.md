# Sovereign ESG Hub
**Module ID:** `sovereign-esg-hub` · **Route:** `/sovereign-esg-hub` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Comprehensive sovereign ESG analytics platform consolidating environmental, social and governance pillar scores, country-level data, and portfolio sovereign ESG exposure in one integrated dashboard.

> **Business value:** Consolidates sovereign ESG intelligence across environmental, social and governance pillars into a unified portfolio-ready scoring platform.

**How an analyst works this module:**
- Aggregate environmental data: climate vulnerability, biodiversity, deforestation, clean energy share.
- Compile social indicators: human development index, inequality, health, education access.
- Score governance: rule of law, transparency, corruption, political stability.
- Weight pillars and produce composite sovereign ESG scores for portfolio integration.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALERTS`, `ALERT_TYPE_COLORS`, `BOARD_RISKS`, `Badge`, `COUNTRIES`, `CustomTooltip`, `KpiCard`, `MethodologyBanner`, `NDC_COLORS`, `PORTFOLIO`, `REGION_COLORS`, `RESEARCH`, `SEVERITY_COLORS`, `SectionHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 61 | `name`, `region`, `esgScore`, `physicalRisk`, `ndcRating`, `ndcScore`, `debtToGdp`, `climateVuln`, `carbonRev`, `debtRisk`, `greenBondBnUSD`, `sovereignRating` |
| `PORTFOLIO` | 21 | `iso2`, `weightPct`, `esgScore`, `physicalRisk`, `ndcRating`, `greenBondExposureMnUSD` |
| `ALERTS` | 16 | `type`, `country`, `iso2`, `severity`, `date`, `description` |
| `RESEARCH` | 11 | `title`, `author`, `date`, `topic`, `keyFindings` |
| `BOARD_RISKS` | 6 | `risk`, `severity`, `action`, `module` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `REGION_COLORS` | `{ Europe:"#3b82f6","Asia-DM":"#10b981","Asia-EM":"#06b6d4","N America":"#8b5cf6",LAC:"#f59e0b",Africa:"#ef4444",MENA:"#ec4899","EMEA-EM":"#f97316",Pacific:"#84cc16" };` |
| `NDC_COLORS` | `{ A:T.green,"A-":"#34d399","B+":"#86efac",B:T.amber,"B-":"#fcd34d","C+":"#fb923c",C:"#f97316","C-":"#ef4444",D:T.red };` |
| `dir` | `sortDir === "asc" ? 1 : -1;` |
| `portfolioEsgAvg` | `(PORTFOLIO.reduce((s,p) => s+(p.esgScore*p.weightPct),0)/(PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)\|\|1)).toFixed(1);` |
| `portfolioPhysAvg` | `(PORTFOLIO.reduce((s,p) => s+(p.physicalRisk*p.weightPct),0)/(PORTFOLIO.reduce((s,p)=>s+p.weightPct,0)\|\|1)).toFixed(1);` |
| `totalGreenExposure` | `(PORTFOLIO.reduce((s,p)=>s+p.greenBondExposureMnUSD,0)/1000).toFixed(1);` |
| `comparatorCountries` | `[comparatorA,comparatorB,comparatorC,comparatorD].map(iso2 => COUNTRIES.find(c=>c.iso2===iso2)).filter(Boolean);` |
| `radarData` | `useMemo(() => [ { axis:"ESG Score",     ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, c.esgScore])) }, { axis:"NDC Score",     ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, c.ndcScore])) }, { axis:"Phys Safety",   ...Object.fromEntries(comparatorCountries.map(c => [c.iso2, 100-c.physicalRisk])) }, { axis:"Debt ` |
| `uniqueRegions` | `[...new Set(COUNTRIES.map(c=>c.region))];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALERTS`, `BOARD_RISKS`, `COMP_COLORS`, `COUNTRIES`, `PORTFOLIO`, `RESEARCH`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Countries Covered | — | Sovereign database | Sovereign entities with complete ESG pillar data across E, S and G dimensions. |
| Portfolio ESG Score | — | Weighted avg | AUM-weighted mean sovereign ESG composite score across sovereign bond portfolio. |
| Governance Laggards | — | WB Governance Indicators | Sovereign issuers scoring below 30 on governance pillar based on World Bank indicators. |
- **MSCI/Sustainalytics sovereign data, World Bank WGI, UNDP HDI** → Pillar aggregation, composite weighting, portfolio overlay → **Sovereign ESG scores, pillar breakdowns, portfolio heatmaps**

## 5 · Intermediate Transformation Logic
**Methodology:** Sovereign ESG Composite
**Headline formula:** `(E_score × 0.35) + (S_score × 0.35) + (G_score × 0.30)`

Pillar-weighted composite sovereign ESG score reflecting environmental resilience, social development and governance quality.

**Standards:** ['MSCI Sovereign ESG', 'Sustainalytics Country Risk', 'World Bank Governance Indicators']
**Reference documents:** MSCI Sovereign ESG Methodology; World Bank Worldwide Governance Indicators; UNDP Human Development Index; ND-GAIN Country Index

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag (cross-module inconsistency).** The guide's formula
> `(E×0.35)+(S×0.35)+(G×0.30)` is not implemented — `esgScore` is a **single hand-typed field per country**,
> not a weighted sum of separate E/S/G pillar scores (no E/S/G sub-fields exist in this module's dataset,
> unlike its sibling `sovereign-esg`, which does carry 3 separate pillar scores). Furthermore, **this
> module's `COUNTRIES` table and `sovereign-esg`'s `SOVEREIGN_DB` are two independently hand-curated datasets
> covering overlapping countries with materially different scores** — e.g. Germany shows `composite=90` in
> `sovereign-esg` (avg of climate 88/social 92/governance 91) but `esgScore=82` in this module; the platform
> has no single source of truth for sovereign ESG scoring across its two sovereign-ESG modules.

### 7.1 What the module computes

`COUNTRIES` (61 real, named countries, **no `sr()` PRNG**) carries a single `esgScore` (0–100), `physicalRisk`
(0–100, higher=worse), an NDC letter rating (A–D, Climate Action Tracker-style) with a paired `ndcScore`
(0–100), `debtToGdp`, `climateVuln`, `carbonRev` ($Bn — apparent fossil/carbon-related government revenue
exposure), `debtRisk` (0–100), `greenBondBnUSD` (cumulative green bond issuance), and real sovereign credit
rating. A companion `PORTFOLIO` (20 positions, real country names) carries portfolio weight % and a subset
of the same per-country fields, apparently independently re-typed rather than joined from `COUNTRIES` (see
limitations).

### 7.2 Parameterisation

| Field | Illustrative values | Provenance |
|---|---|---|
| `esgScore` | Norway 88 (highest), Venezuela 18 (lowest) | hand-typed, plausible ordering (Nordic countries at the top, distressed-sovereign-rated countries at the bottom) |
| `physicalRisk` | Bangladesh 90 (highest), Norway 22 (lowest) | plausible ordering consistent with known climate-vulnerability geography (South/Southeast Asia high, Nordic Europe low) |
| `ndcRating`/`ndcScore` | correlated pair, e.g. Norway A/85, Pakistan D/28 | consistent internal correlation between the letter grade and the numeric score |
| `carbonRev` ($Bn) | China 148.2 (highest, reflecting economy size not necessarily fossil-intensity), Saudi Arabia 44.2, USA 88.4 | plausible in scale for major economies but the field's exact definition (government fossil-fuel revenue? carbon-related tax revenue? total carbon-exposed economic activity?) is not documented in the code — ambiguous units |
| `sovereignRating` | real S&P-style letter ratings matching known sovereign credit conditions (Venezuela SD, Lebanon SD, Norway AAA) | consistent with real-world credit conditions as of data curation |
| `PORTFOLIO` weights | 20 positions summing to roughly 100% (largest: USA 12.8%, Japan 9.2%, China 8.8%) | plausible global sovereign-bond-portfolio weighting |

### 7.3 Calculation walkthrough

- **Portfolio-level KPIs**: `portfolioEsgAvg`/`portfolioPhysAvg` are correctly weight-averaged (not simple
  means) over the 20 `PORTFOLIO` positions: `Σ(esgScore×weightPct)/Σ(weightPct)` — proper AUM-weighting.
- **`totalGreenExposure`**: sums `greenBondExposureMnUSD` across the portfolio, converted to $Bn — a
  correct aggregation of a portfolio-level (not country-level) field.
- **Comparator radar tool**: lets a user pick up to 4 countries (`comparatorA/B/C/D`) and builds a
  multi-axis radar (`ESG Score`, `NDC Score`, `Phys Safety = 100−physicalRisk` (correctly inverted so higher
  is always better across all radar axes), plus additional axes not fully captured in this excerpt) —
  correct axis-normalisation logic.
- **Alerts/Research/Board Risks tables**: descriptive reference content (16 alert entries, 11 research
  citations, 6 board-level risk flags) — not derived from the `COUNTRIES` scoring data.

### 7.4 Worked example (portfolio ESG average)

Using the first 5 `PORTFOLIO` rows: Germany (8.4%, esg 82), France (7.2%, esg 80), Netherlands (5.8%, esg
84), UK (6.4%, esg 79), Japan (9.2%, esg 73):

| Step | Computation | Result |
|---|---|---|
| Σ weight×esg | 8.4×82 + 7.2×80 + 5.8×84 + 6.4×79 + 9.2×73 | 688.8+576+487.2+505.6+671.6 = 2,929.2 |
| Σ weight | 8.4+7.2+5.8+6.4+9.2 | 37.0 |
| Weighted avg (5-row subset) | 2,929.2/37.0 | **79.2** |

Correctly weight-averaged — a materially lower-ESG country with a large weight (e.g. hypothetically China at
8.8%/esg 46, included in the full 20-row calculation) would pull the true full-portfolio average below this
5-row illustrative subset.

### 7.5 Data provenance & limitations

- **All country ESG/physical-risk/NDC/debt data is hand-curated, single-point-in-time, plausible estimates**
  — not live-sourced, and (per the mismatch flag) **inconsistent with the platform's other sovereign-ESG
  module** (`sovereign-esg`) for the same countries.
- **`esgScore` cannot be decomposed or audited** — no separate E/S/G pillar fields exist in this module,
  unlike `sovereign-esg`'s 3-pillar structure, despite the guide describing a pillar-weighted formula.
- `carbonRev`'s exact definition is ambiguous from the code alone (field name suggests carbon/fossil revenue
  exposure but the values scale with total economy size, e.g. China highest at $148.2Bn, more consistent
  with total government revenue scale than fossil-specific exposure).
- `PORTFOLIO` appears to be a separately hand-typed subset rather than a live join against `COUNTRIES` —
  cross-checking a few values (Germany esg 82 in both tables) shows they happen to match, but this is not
  guaranteed to hold for all 20 portfolio positions without a structural join.

### 7.6 Framework alignment

- **MSCI Sovereign ESG Methodology / Sustainalytics Country Risk** — cited in the guide as the pillar-
  weighting basis; the module does not implement a decomposable E/S/G structure to actually apply such
  weights.
- **World Bank Worldwide Governance Indicators / UNDP HDI / ND-GAIN** — cited as data sources; not present as
  distinct fields in this module (contrast with `sovereign-esg`, which does carry ND-GAIN vulnerability/
  readiness sub-indices).
- **Climate Action Tracker-style NDC letter grades** — the A–D rating scale is directionally consistent with
  real NDC-ambition assessment frameworks, correctly paired with a numeric score.
- Given this module and `sovereign-esg` cover overlapping ground with divergent numbers, a production
  remediation should **consolidate into a single sovereign ESG scoring pipeline** (ideally the more granular,
  decomposable `sovereign-esg` 3-pillar structure) rather than maintaining two independently-curated
  datasets across the platform.

## 9 · Future Evolution

### 9.1 Evolution A — Consolidate onto one sovereign-ESG source of truth with decomposable pillars (analytics ladder: rung 1 → 3)

**What.** The §7 flag exposes a platform-level problem: this tier-B hub carries a single hand-typed `esgScore` per country (no E/S/G sub-fields), and its 61-country `COUNTRIES` table **disagrees with the sibling `sovereign-esg` module's `SOVEREIGN_DB`** for the same countries (Germany: 90 there, 82 here) — the platform has no single source of truth for sovereign ESG. The guide's `(E×0.35)+(S×0.35)+(G×0.30)` composite isn't implemented because no pillar sub-scores exist. Evolution A makes this hub consume a canonical scoring pipeline rather than maintain a third independent table.

**How.** (1) Adopt the more granular `sovereign-esg` 3-pillar structure as the platform's canonical sovereign-ESG engine (its §9.1 Evolution A builds the live WGI/EPI/HDI computation) and have this hub read from it — one dataset, one composite, ending the cross-module divergence the §7 flag documents. (2) Compute the `(E×0.35)+(S×0.35)+(G×0.30)` composite the guide promises from those real pillars, applying user weights. (3) Clarify the ambiguous `carbonRev` field's definition (the deep-dive notes its units are undocumented — fossil revenue? carbon-tax revenue?) or drop it. (4) Join `PORTFOLIO` positions to the canonical `COUNTRIES` table rather than re-typing a subset of fields.

**Prerequisites.** Depends on the canonical sovereign-ESG engine (build in `sovereign-esg` first, or a shared `sovereign_esg_engine`); `carbonRev` needs an SME definition. **Acceptance:** Germany shows one ESG score across both modules; the composite recomputes from E/S/G pillars under the active weights; the portfolio view joins to the canonical table.

### 9.2 Evolution B — Portfolio sovereign-ESG copilot (LLM tier 1)

**What.** A copilot for the sovereign-fixed-income PM: "what's my portfolio's weighted ESG exposure and which holdings drag it down?", "why does this sovereign score 82?", "flag concentration in low-governance issuers" — answered from the canonical pillar scores and the portfolio weights, decomposing the weighted composite into per-holding contributions.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/sovereign-esg-hub/ask`, corpus = this Atlas record plus the canonical pillar definitions and framework notes (MSCI Sovereign ESG, WGI, HDI, ND-GAIN). Portfolio answers narrate the exposure-weighted composite and per-holding attribution; score explanations cite the E/S/G pillar drivers. Refusal for sovereigns outside coverage.

**Prerequisites (hard).** Evolution A's consolidation — a copilot narrating scores that differ from the sibling module for the same country would surface the platform's own inconsistency as an authoritative answer. **Acceptance:** every score cited matches the canonical engine; portfolio attribution sums to the weighted composite; a holding absent from the canonical table is flagged, not scored.