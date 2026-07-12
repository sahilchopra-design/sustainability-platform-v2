# Entity 360 View
**Module ID:** `entity-360` · **Route:** `/entity-360` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Provides a comprehensive 360-degree ESG, climate, and financial profile for any corporate entity, aggregating data across emissions, ratings, controversies, governance, supply chain, and regulatory filings into a unified analytical workspace. Designed for credit analysts, ESG researchers, and investment teams requiring rapid entity due diligence. Integrates with all platform modules to surface cross-module entity-level insights.

> **Business value:** Accelerates entity-level ESG due diligence from days to minutes, enabling investment teams to make fully informed engagement, exclusion, and credit decisions backed by a comprehensive, multi-source evidence base in a single integrated view.

**How an analyst works this module:**
- Search for entity by name, ISIN, LEI, or ticker to load the 360 profile.
- Review summary dashboard spanning emissions, ratings consensus, governance flags, and supply chain risk heat map.
- Drill into any sub-module (e.g., ESG Ratings, Physical Risk, Litigation) for detailed analysis within entity context.
- Generate entity due diligence pack with all cross-module findings formatted for investment committee or credit committee.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ActionTracker`, `ENTITIES`, `ENTITY_NAMES`, `EntityProfile`, `QUARTERS`, `REGIONS`, `RegulatoryExposure`, `RiskIntelligence`, `SECTORS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `sector` | `SECTORS[Math.floor(s*SECTORS.length)];` |
| `region` | `REGIONS[Math.floor(s2*REGIONS.length)];` |
| `esgScore` | `Math.floor(s3*65+25);` |
| `climateScore` | `Math.floor(sr(i*29+5)*70+20);` |
| `socialScore` | `Math.floor(sr(i*31+7)*70+20);` |
| `govScore` | `Math.floor(sr(i*37+9)*70+20);` |
| `QUARTERS` | `['Q1-23','Q2-23','Q3-23','Q4-23','Q1-24','Q2-24','Q3-24','Q4-24','Q1-25','Q2-25'];` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `qTrend` | `QUARTERS.map((q,i)=>({q,esg:Math.floor(sr(entity.id*31+i*7)*25+entity.esgScore-10),climate:Math.floor(sr(entity.id*37+i*9)*25+entity.climateScore-10)}));` |
| `peerData` | `ENTITIES.filter(e=>e.sector===entity.sector).slice(0,6).map(e=>({name:e.ticker,esg:e.esgScore,climate:e.climateScore}));` |
| `totalEmissions` | `entity.scope1+entity.scope2+entity.scope3;` |
| `overallRisk` | `Math.round(riskBreakdown.reduce((a,r)=>a+r.score,0)/riskBreakdown.length);` |
| `avgGap` | `inScope.length?Math.round(inScope.reduce((a,f)=>a+f.gap,0)/inScope.length):0;` |
| `exposureTimeline` | `frameworks.filter(f=>f.applies).map((f,i)=>({name:f.fw,gap:f.gap}));` |
| `actions` | `useMemo(()=>[ {id:1,title:`Complete CSRD ESRS E1 Climate Disclosure`,module:'CSRD / ESRS Automation',priority:'P0',status:sr(entity.id*31+7)>0.5?'Complete':'Open',dueDate:'2025-06-30',framework:'CSRD',type:'Disclosure'}, {id:2,title:`Submit SBTi Near-Term Target`,module:'Corporate Decarbonisation',priority:'P0',status:sr(entity.id*37+11)>` |
| `completionRate` | `Math.round(counts.Complete/actions.length*100);` |
| `byType` | `Object.entries(actions.reduce((acc,a)=>{acc[a.type]=(acc[a.type]\|\|0)+1;return acc},{})).map(([k,v])=>({type:k,count:v}));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_NAMES`, `QUARTERS`, `REGIONS`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Provider Consensus ESG Score | — | MSCI/Sustainalytics/ISS | Equal-weighted blend of three leading provider scores; high dispersion flags ratings disagreement requiring deeper review. |
| Scope 1+2 Intensity (tCO2e/$M Rev) | — | CDP/Trucost | Carbon intensity normalised by revenue; benchmarked to sector SBTi-aligned budget. |
| Controversy Severity (1â€“5) | — | RepRisk / MSCI | Most severe ESG controversy in trailing 24 months; Level 4â€“5 triggers enhanced due diligence flag. |
| TCFD Disclosure Score (%) | — | CDP Climate Questionnaire | Proportion of TCFD-recommended disclosures present and quantified in public filings. |
- **Multi-provider ESG data feeds (MSCI, Sustainalytics, ISS)** → Normalise to 0â€“100 scale; compute consensus and inter-provider dispersion → **Provider consensus score with dispersion band**
- **CDP, Bloomberg, Refinitiv emissions data** → Reconcile Scope 1/2/3 across sources; flag self-reported vs. estimated → **Carbon intensity KPIs with data quality indicator**
- **RepRisk and NGO controversy database** → Classify by pillar, severity, and recency; map to entity LEI → **Controversy severity score and incident log**

## 5 · Intermediate Transformation Logic
**Methodology:** Entity Composite ESG Score
**Headline formula:** `Entity_ESG = w_E × E_score + w_S × S_score + w_G × G_score`

Pillar scores are computed from normalised underlying KPIs weighted by SASB industry materiality. Environmental score aggregates carbon intensity, water stress exposure, and waste intensity. Social covers workforce safety, labour practices, and supply chain human rights. Governance incorporates board independence, pay alignment, and anti-corruption controls. Provider consensus uses equal-weighted MSCI/Sustainalytics/ISS blend.

**Standards:** ['GRI Universal Standards 2021', 'SASB Industry Standards', 'MSCI ESG Methodology 2024']
**Reference documents:** GRI Universal Standards 2021; SASB Materiality Map 2023; CDP Climate Questionnaire A-List Methodology 2024; MSCI ESG Ratings Methodology 2024; LEI Data â€” Global Legal Entity Identifier Foundation

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry advertises a *multi-source ESG consensus
> engine* — "equal-weighted MSCI/Sustainalytics/ISS blend", SASB-materiality-weighted pillar scores,
> RepRisk controversy severity, CDP-sourced TCFD disclosure percentages, and entity lookup by
> ISIN/LEI/ticker. **None of that data plumbing exists.** The code generates 20 fictitious entities
> from a single seeded PRNG. Pillar scores, emissions, ratings, temperatures, controversies, LEIs and
> ISINs are all `sr(seed)`-derived demo values; there is no provider feed, no consensus averaging, no
> SASB weighting, and no real lookup. What the page *does* deliver is a well-structured **entity
> dossier UI** — a 4-tab workspace (Profile / Risk Intelligence / Regulatory Exposure / Action
> Tracker) that would host real data once wired. The sections below document the code as written.

### 7.1 What the module computes

`genEntities(20)` fabricates an entity table. Every field is a deterministic function of the row
index `i` through the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)`:

```js
esgScore    = floor(sr(i*19+11)*65 + 25)      // 25–90
climateScore= floor(sr(i*29+5)*70 + 20)       // 20–90
socialScore = floor(sr(i*31+7)*70 + 20)       // 20–90
govScore    = floor(sr(i*37+9)*70 + 20)       // 20–90
scope1 = floor(sr(i*67+3)*4000+100); scope2 = floor(sr(i*71+7)*2000+50)
scope3 = floor(sr(i*73+11)*20000+500)
temperature = (sr(i*109+7)*2.5 + 1.5).toFixed(1)   // 1.5–4.0 °C
```

Note the headline `esgScore` is drawn **independently** from `climateScore`/`socialScore`/`govScore`
— it is *not* the composite `w_E·E + w_S·S + w_G·G` that the guide's formula implies. The only true
composite anywhere on the page is inside the Risk Intelligence tab, where `overallRisk` averages
seven risk-line scores.

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula (from code) | Provenance |
|---|---|---|
| ESG score | `sr(i*19+11)*65+25` | synthetic demo value |
| Climate / Social / Gov | `sr(·)*70+20` | synthetic demo value |
| Emissions (S1/S2/S3) | scaled `sr(·)`, ranges 100–4.1k / 50–2k / 500–20.5k tCO₂e | synthetic demo value |
| Implied temperature | `sr(·)*2.5+1.5` | synthetic; range chosen to span SBTi 1.5 °C → hot-house 4 °C |
| SBTi status | pick of `[Committed, Target Set, No Commitment, In Progress, Achieved]` | synthetic categorical |
| overallRisk | `mean(riskBreakdown[].score)` of 7 lines | synthetic composite |

Colour rubrics **are** real thresholds worth documenting:

| Helper | Rule | Reading |
|---|---|---|
| `scoreColor` | ≥70 green · 45–69 amber · <45 red | score bands |
| `tempColor` | ≤1.5 green · ≤2 amber · ≤2.5 orange · else red | Paris 1.5/2 °C guardrails |

### 7.3 Calculation walkthrough

- **Profile tab** — KPI cards read entity fields directly; `qTrend` builds a 10-quarter series by
  jittering the entity's own score: `esg = floor(sr(id*31+i*7)*25 + esgScore − 10)` (a ±~12-point
  random walk *centred* on the static score). `peerData` filters `ENTITIES` by matching sector.
  `totalEmissions = scope1+scope2+scope3` feeds the GHG donut.
- **Risk Intelligence tab** — `riskDimensions` (6 radar axes) and `riskBreakdown` (7 lines) are each
  fresh `sr()` draws seeded off `entity.id`; `overallRisk = round(mean(riskBreakdown.score))`.
  The radar/breakdown detail strings (flood %, CSRD gap %, active litigation count) are all
  independent PRNG draws — descriptive flavour, not linked to the emissions or score fields.
- **Regulatory Exposure tab** — the only tab with *genuine logic*: `applies` flags are computed from
  real entity attributes, e.g. CSDDD applies when `employees>1000 && revenue>0.45` (€450 M proxy);
  EUDR applies for `sector ∈ {Materials, Consumer Goods, Automotive}`; SEC rule for
  `region==='North America'`; UK SDR for `country==='UK'`. Compliance `gap%` per framework is still
  a `sr()` draw. `avgGap = mean(gap of in-scope frameworks)`.
- **Action Tracker tab** — a fixed action list whose `status` flips Complete/Open on `sr()` draws;
  `completionRate = round(Complete/total×100)`.

### 7.4 Worked example (entity id = 0)

Take `i=0`. `sr(11)=frac(sin(12)×10⁴)`. `sin(12 rad)=−0.5366`, ×10⁴ = −5365.7, frac ≈ 0.298.
So `esgScore = floor(0.298×65+25) = floor(44.4) = 44` → amber band. Suppose the regulatory tab shows
CSDDD in scope (employees 42 000 > 1000, revenue $18.2 bn > 0.45) with a drawn `gap` of 38%, EU
Taxonomy in scope (csrdScope true) with gap 27%, and SEC out of scope (region ≠ North America). Then
`inScope` = {CSRD, CSDDD, EU-Taxonomy, ISSB…}; if those four gaps are 42/38/27/19, `avgGap =
round((42+38+27+19)/4) = 32%` → amber. The "Nearest Deadline" KPI lexically sorts the in-scope
deadline strings and shows the earliest. Every number is reproducible but none is a real observation.

### 7.5 Data provenance & limitations

- **Entirely synthetic.** All 20 entities and every metric come from `sr(seed)`; the LEIs and ISINs
  are `sr()`-string-sliced and are not valid identifiers. There is **no** MSCI/Sustainalytics/ISS
  feed, no RepRisk controversy database, no CDP TCFD score, and no ISIN/LEI resolver despite the
  guide's data-lineage claims.
- ESG headline score is decoupled from its own E/S/G components — a validation team would reject this
  as internally inconsistent.
- The regulatory applicability logic is the one production-credible piece and could be retained.

**Framework alignment:** the page *references* GRI/SASB/MSCI, CSRD-ESRS, SFDR (18 PAIs), CSDDD, EUDR,
EU Taxonomy, ISSB IFRS S1/S2, SEC climate rule and UK SDR — but only as labels and applicability
gates. A real Entity-360 composite would follow **MSCI ESG Ratings** (industry-adjusted key-issue
scores 0–10 aggregated to a 0–10 letter grade AAA–CCC) and **SASB materiality** (industry-specific
material topics weighting the pillar roll-up), neither of which the code implements.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module displays an ESG composite, an
implied temperature and controversy counts with no model behind them (all `sr()`), so a production
model is specified here.

**8.1 Purpose & scope.** Produce a defensible entity-level ESG composite (0–100 → AAA–CCC), an
implied-temperature-rise (ITR) estimate, and a controversy severity index for any listed issuer, to
support credit, exclusion and engagement decisions across the equity/credit universe.

**8.2 Conceptual approach.** Mirror **MSCI ESG Ratings** (industry-relative key-issue model) and
**Sustainalytics ESG Risk Rating** (unmanaged-risk exposure) as a two-provider consensus, with ITR
computed per the **CDP-WWF Temperature Rating** / **SBTi** methodology (project company emissions vs a
sector carbon budget). Controversy severity follows **RepRisk RRI** decay-weighted incident scoring.

**8.3 Mathematical specification.**
- Pillar score: `P_p = Σ_k w_{p,k}·z(KPI_k)` where `w_{p,k}` are SASB-materiality weights for the
  issuer's SICS industry and `z(·)` is a within-industry cross-sectional z-score winsorised at ±3.
- Composite: `ESG = 100·Φ(Σ_p ω_p·P_p)`, `ω_E+ω_S+ω_G=1` (industry-specific, MSCI-style).
- Consensus: `ESG* = ½(ESG_MSCI-map + ESG_Sustainalytics-map)`; dispersion `δ=|ESG_1−ESG_2|` flags
  `δ>25` for manual review.
- ITR: `T = 1.5 + β·max(0, (E_actual − B_sector(t)))/B_sector(t)` with `B_sector` the SBTi
  sector-decarbonisation budget and β calibrated so a company on a 2 °C-aligned path returns 2.0 °C.
- Controversy: `RRI = min(100, Σ_e sev_e·reach_e·e^{−λΔt_e})`, λ = ln2 / 12 months.

| Parameter | Value / source |
|---|---|
| SASB materiality weights `w_{p,k}` | SASB Standards by SICS industry |
| Pillar weights `ω_p` | MSCI ESG key-issue weights (industry) |
| Sector budget `B_sector(t)` | SBTi SDA / CDP-WWF sector pathways |
| Decay λ | RepRisk 24-month half-window (proxy ln2/12m) |
| Dispersion flag | δ>25 pts (guide's stated 25–35 divergence band) |

**8.4 Data requirements.** Issuer→SICS mapping; raw ESG KPIs (carbon intensity, LTIR, board
independence…); two provider score feeds (MSCI, Sustainalytics); Scope 1–3 emissions + revenue (for
ITR); RepRisk/controversy feed; SBTi sector budgets. Platform already holds Scope 1–3 fields and a
`reference_data` layer (OWID CO₂, SBTi) that supplies `B_sector`.

**8.5 Validation & benchmarking plan.** Backtest ESG* against realised rating migrations; reconcile
ITR against published SBTi-validated targets for the same issuers; sensitivity of composite to
±1 provider and to materiality-weight perturbation; controversy RRI benchmarked to RepRisk RRI where
licensed.

**8.6 Limitations & model risk.** Provider mapping to a common 0–100 scale introduces basis error;
ITR is highly sensitive to sector-budget choice; controversy decay half-life is a modelling choice;
missing KPIs force sector-median substitution which regresses scores toward the mean.

## 9 · Future Evolution

### 9.1 Evolution A — Wire the dossier shell to the platform's real entity data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is fair to both halves: "none of that data plumbing exists" — the 20 entities, their pillar scores, emissions, LEIs, ISINs, controversies, and even the action-tracker statuses are all `sr()` draws — but the page "does deliver a well-structured entity dossier UI" (Profile / Risk Intelligence / Regulatory Exposure / Action Tracker) "that would host real data once wired." The platform now has the substrate the 2024-era page lacked: `entity_lei` populated via the fixed GLEIF bulk ingester, a company master, and sibling modules owning controversies, ratings, and physical risk. Evolution A is the wiring.

**How.** (1) Real entity search: name/LEI/ISIN lookup against `entity_lei` + OpenFIGI mapping (both integrated in the data-sources wave-1 work) — the search box stops being decorative. (2) Each dossier tile pulls its owning module's data: emissions from the company master, controversy severity from `esg-controversy`, ratings dispersion from `esg-ratings-comparator`, physical risk from the digital twin at the entity's asset coordinates, regulatory exposure from the jurisdiction logic in `disclosure-adequacy-analyzer` — with per-tile provenance and honest "no data" states where coverage is thin (it will be, initially; show it). (3) Action tracker becomes persisted per entity (`entity_actions` table) instead of seeded statuses. (4) Rung 2: peer comparison over real sector cohorts and quarter-on-quarter deltas from persisted snapshots.

**Prerequisites.** GLEIF/company-master join quality (the known thin spot — coverage stats displayed, not hidden); sibling modules' honest-data Evolutions A for the tiles they feed. **Acceptance:** searching a real LEI loads a dossier whose every tile names its source module; entities without coverage show explicit gaps; zero `sr()` in the profile path.

### 9.2 Evolution B — Counterparty-assessment orchestrator, anchored here (LLM tier 3)

**What.** The roadmap's own tier-3 illustration — "assess this counterparty → GLEIF resolve → sanctions screen → physical-risk point profile → financed-emissions estimate → synthesized memo" — describes this module exactly. Evolution B seats that orchestrator on the Entity 360 page: "give me a full DD read on <entity> before Thursday's credit committee" routes across the platform's entity-relevant modules and returns the due-diligence pack the overview promises, composed through report-studio with a show-work appendix.

**How.** Routing knowledge from `module_tags.json` and the Atlas interconnection graph; the entity's resolved LEI is the join key passed to each module's read-only tool surface. The orchestrator's contract: every dossier claim carries (module, endpoint, as-of-date); modules returning no data for the entity appear in a coverage section rather than being skipped silently; numeric validator across the whole pack. Engagement/exclusion *recommendations* are framed as drafted analysis over the computed evidence, never as scores.

**Prerequisites (hard).** Evolution A's real wiring — orchestrating over the current fabricated dossier would automate a fake DD pack with real entity names on it, the worst possible first impression for the platform's flagship cross-module view. **Acceptance:** a golden entity's DD pack traces every figure to a module endpoint in the appendix; coverage gaps are enumerated; the same request re-run after a data refresh shows updated as-of-dates, proving live wiring.