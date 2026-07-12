# Climate Patent Intelligence
**Module ID:** `climate-patent-intelligence` · **Route:** `/climate-patent-intelligence` · **Tier:** B (frontend-computed) · **EP code:** EP-DF6 · **Sprint:** DF

## 1 · Overview
Analyses climate technology patent portfolios to identify innovation leaders, technology whitespaces, and IP-driven competitive moats. Tracks patent citation networks, technology diffusion rates, and links patent activity to cleantech investment signals and forward earnings potential.

> **Business value:** Valuable for cleantech investors conducting IP due diligence, corporate R&D strategists mapping technology whitespaces, and sovereign wealth funds tracking national innovation competitiveness. Patent intelligence provides 8–15 year forward signal for technology deployment and market leadership.

**How an analyst works this module:**
- Browse climate technology patent categories by IPC code
- Filter by company, country, and technology area
- Analyse citation networks to identify technology leaders
- Track patent grant rates as leading deployment indicator
- Export innovation intelligence for investment due diligence

## 2 · Function Map

### 2.1 Frontend (2 files)
**Components/functions:** `Card`, `DOMAIN_GROWTH`, `ENTITIES`, `ENTITY_TYPES`, `GEOS`, `KpiCard`, `TABS`, `TECH_DOMAINS`, `TIME_SERIES`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `TECH_DOMAINS` | 9 | `name`, `color`, `subfields` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt0` | `v => Number(v).toLocaleString('en-GB', { maximumFractionDigits:0 });` |
| `domain` | `TECH_DOMAINS[Math.floor(sr(i*7)*TECH_DOMAINS.length)];` |
| `type` | `ENTITY_TYPES[Math.floor(sr(i*11)*ENTITY_TYPES.length)];` |
| `geo` | `GEOS[Math.floor(sr(i*13)*GEOS.length)];` |
| `totalPatents` | `Math.round(50 + sr(i*17)*2950);` |
| `grantsPerYr` | `Math.round(totalPatents * (0.08 + sr(i*19)*0.15));` |
| `citationIdx` | `Math.round(50 + sr(i*23)*200);    // relative to sector avg=100` |
| `familySize` | `Math.round(2 + sr(i*29)*18);      // countries per patent family` |
| `fwdCitations` | `Math.round(10 + sr(i*31)*290);    // avg forward citations` |
| `rdSpendPct` | `Math.round(3 + sr(i*37)*25);      // % revenue` |
| `rdSpendAbsMn` | `Math.round(10 + sr(i*41)*990);    // $M` |
| `collabIdx` | `Math.round(20 + sr(i*43)*75);     // collaboration index 0-100` |
| `commercialTrl` | `Math.round(4 + sr(i*47)*5);       // TRL 4-9` |
| `innovScore` | `Math.round((citationIdx/2 + fwdCitations/3 + rdSpendPct*2 + collabIdx*0.3)/4);` |
| `usShare` | `Math.round(20 + sr(i*53)*40);` |
| `cnShare` | `Math.round(15 + sr(i*59)*35);` |
| `epShare` | `Math.round(10 + sr(i*61)*30);` |
| `jpShare` | `Math.round(5  + sr(i*67)*15);` |
| `woShare` | `Math.max(0, 100 - usShare - cnShare - epShare - jpShare);` |
| `TIME_SERIES` | `TECH_DOMAINS.map(d => {` |
| `base` | `1000 + Math.floor(sr(TECH_DOMAINS.indexOf(d)*100)*5000);` |
| `cagr` | `DOMAIN_GROWTH[d.id] / 100;` |
| `domainRows` | `useMemo(() => TECH_DOMAINS.map(d => {` |
| `patentTrendData` | `useMemo(() => ['2019','2020','2021','2022','2023','2024'].map((yr,i)=>({` |
| `topEntities` | `useMemo(() => [...filtered].sort((a,b)=>b.totalPatents-a.totalPatents).slice(0,20), [filtered]);` |
| `investSignals` | `useMemo(() => domainRows.map(d=>({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ENTITY_TYPES`, `GEOS`, `TABS`, `TECH_DOMAINS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Clean Energy Patents 2023 | — | WIPO Green Database 2024 | Active clean energy patents globally — solar+wind+storage represent 55% of total |
| Patent-to-Deployment Lag | — | IEA Energy Technology Patents 2023 | Median time from patent filing to commercial deployment in energy technologies |
| China Patent Share | — | WIPO IP Facts & Figures 2023 | China accounts for 44% of clean energy patents globally — up from 8% in 2005 |
- **EPO/USPTO/CNIPA patent grants by IPC/CPC code** → Innovation index calculation → **Company and country patent rankings by technology area**
- **Patent citation network data** → Technology diffusion analysis → **Forward citation rates as deployment leading indicators**
- **Cleantech investment databases (BNEF, Crunchbase)** → Patent-to-investment correlation → **IP strength score correlated with company valuation premium**

## 5 · Intermediate Transformation Logic
**Methodology:** Patent Innovation Index
**Headline formula:** `InnovationIndex = Σ [Citations_i × TRL_weight_i × MarketSize_i]; TechDiffusion = ΔPatentGrantRate / ΔCO2AbatementDeployment`

Citation-weighted patent counts signal technology relevance; forward citation lag predicts commercial deployment; sector-adjusted innovation indices enable cross-technology comparison

**Standards:** ['WIPO Green Technology Database', 'EPO Climate Change Mitigation Patents', 'IEA Energy Technology Patents', 'IPCC AR6 WGIII Chapter 16']
**Reference documents:** WIPO Green Technology Database — Climate Change Mitigation Technologies; EPO Patent Insight Report — Climate Change Mitigation 2022; IEA Energy Technology Patents 2023; IPCC AR6 WGIII Chapter 16 — Innovation, Technology Development and Transfer

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).
**Shared UI wrappers:** `CleanTechAdvancedAnalytics`

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial mismatch.** The MODULE_GUIDES entry (EP-DF6) states the innovation
> index is `Σ[Citations_i × TRL_weight_i × MarketSize_i]` and a tech-diffusion metric
> `ΔPatentGrantRate / ΔCO2AbatementDeployment`. **The code implements neither.** The actual
> `innovScore` is a fixed weighted blend of citation index, forward citations, R&D-intensity and
> collaboration (no TRL weight, no market size); there is no diffusion-vs-abatement metric. All 60
> entities, their patent counts, citations and R&D are `sr()`-seeded synthetic data — the WIPO/EPO
> databases named in the guide are not connected (`engines: []`, `route_files: []`). The domain
> growth-rate table is realistic and drives the one genuinely-structured output (the time series).

### 7.1 What the module computes

60 synthetic entities are generated once. Per entity `i`:

```js
totalPatents  = round(50 + sr(i*17)*2950);              // 50–3000
grantsPerYr   = round(totalPatents * (0.08 + sr(i*19)*0.15));
citationIdx   = round(50 + sr(i*23)*200);               // vs sector avg 100
familySize    = round(2 + sr(i*29)*18);                 // countries/family
fwdCitations  = round(10 + sr(i*31)*290);
rdSpendPct    = round(3 + sr(i*37)*25);                 // % revenue
rdSpendAbsMn  = round(10 + sr(i*41)*990);               // $M
collabIdx     = round(20 + sr(i*43)*75);                // 0–100
commercialTrl = round(4 + sr(i*47)*5);                  // TRL 4–9

patentCliff = grantsPerYr < totalPatents*0.06 && totalPatents > 500;
innovScore  = round( (citationIdx/2 + fwdCitations/3 + rdSpendPct*2 + collabIdx*0.3) / 4 );
```

Geographic filing shares (`geoUs…geoWo`) are seeded and forced to sum to 100 via
`woShare = max(0, 100 − us − cn − ep − jp)`.

### 7.2 Parameterisation & provenance

| Constant | Value | Provenance |
|---|---|---|
| `DOMAIN_GROWTH` CAGR | RE 8, BESS 28, CC 35, EV 42, SG 18, H2 55, AI 38, CE 12 (%) | Authored, but directionally faithful to observed cleantech patent CAGRs (H2/EV highest) |
| innovScore weights | citation `÷2`, fwd `÷3`, R&D% `×2`, collab `×0.3`, all `÷4` | Hard-coded heuristic — no source, no normalisation to 0–100 |
| investment signal | `cagr×0.5 + avgCitation×0.2 + (avgRd/50)×0.3` | Hard-coded heuristic |
| patent-cliff rule | grants `< 6%` of stock **and** stock `> 500` | Authored proxy for an ageing, slow-refresh portfolio |
| TIME_SERIES base | `1000 + floor(sr(idx·100)·5000)` | Seeded per-domain start level |
| radar matrix | fixed 6×5 integer grid | Hard-coded illustrative values (RE/BESS/CC/EV/H2 only) |

PRNG: `sr(s) = frac(sin(s+1) × 10⁴)`.

### 7.3 Calculation walkthrough

1. Filters (`domain`, `type`, `geo`) subset the 60 entities → `filtered`.
2. **Totals** sum `totalPatents`, `grantsPerYr`, `rdSpendAbsMn` and average `citationIdx`,
   `innovScore`, `familySize`; `patentCliffRisk` counts flagged entities.
3. **Domain rows** aggregate per technology domain and attach the domain CAGR.
4. **Patent trend** builds a 2019→2024 grants series per domain as
   `grants(year i) = base × (1 + cagr)^i` — the one compounding, non-flat output.
5. **Investment signals** collapse each domain to a single score (growth-weighted, §7.4).

### 7.4 Worked example — innovation score & investment signal

**Entity innovScore.** Take `citationIdx = 150`, `fwdCitations = 180`, `rdSpendPct = 15`,
`collabIdx = 60`:

```
innovScore = round( (150/2 + 180/3 + 15·2 + 60·0.3) / 4 )
           = round( (75 + 60 + 30 + 18) / 4 )
           = round( 183 / 4 ) = round(45.75) = 46
```

**Domain trend.** Renewable Energy start level `base = 1000 + floor(sr(0)·5000)`. With
`sr(0)=frac(sin(1)·10⁴)=frac(8414.7)=0.4675` → `base = 1000 + floor(2337.5) = 3337`.
2024 grants `= 3337 × 1.08⁵ = 3337 × 1.4693 = 4,903`.

**Investment signal (H2).** With domain `cagr = 55`, `avgCitation ≈ 140`, `avgRd ≈ 500`:

```
signal = round( 55·0.5 + 140·0.2 + (500/50)·0.3 )
       = round( 27.5 + 28 + 3 ) = round(58.5) = 59
```

Because `cagr×0.5` dominates, the signal ranking essentially reproduces the hard-coded
`DOMAIN_GROWTH` order (H2 > EV > AI > CC …) — the citation and R&D terms only perturb it slightly.

### 7.5 Data provenance & limitations

- **All entity-level patent, citation, R&D and geography data are synthetic**, from
  `sr(s)=frac(sin(s+1)×10⁴)`. Entities are anonymised placeholders (`RE-Entity-001`), not real
  assignees — so the "competitive intelligence" and "top 20" tables rank noise.
- **`innovScore` is unbounded and unnormalised** despite the "Composite 0–100" KPI label: with
  max inputs it can exceed 100 (`250/2 + 300/3 + 28·2 + 95·0.3 ≈ 79`, but the guide's 0–100 claim
  is not enforced).
- **The only structurally-real signal is the CAGR-driven time series** — its *shape* (H2/EV/CC
  growing fastest) matches public patent-trend literature, though the absolute counts are seeded.
- No IPC/CPC codes, no citation network, no TRL-weighted or market-size-weighted index as the
  guide's formula requires.

**Framework alignment:** *WIPO Green / IPC-Y02* — the guide anchors climate patents to WIPO's
Y02 classification (climate-change-mitigation technologies), assessed by IPC/CPC code; the code
uses free-text domain labels instead. *EPO Y02/Y04S* — cited for CCMT patent counts; not queried.
*IEA Energy Technology Patents* — source of the "8–15 year patent-to-deployment lag" narrative,
which motivates using grant-rate as a leading indicator (the compounding time series is the
module's nod to this). *IPCC AR6 WGIII Ch.16* — innovation/technology-transfer framing only.

### 8 · Model Specification

**Status: specification — not yet implemented in code.** The module presents an innovation
index, patent-cliff risk flags, and per-domain investment signals that inform cleantech
due-diligence and thematic allocation — all currently `sr()`-seeded heuristics. A production build
needs a real bibliometric engine over patent data.

**8.1 Purpose & scope.** Rank assignees and technology domains on IP strength and momentum, flag
portfolios facing patent expiry cliffs, and generate forward-looking technology-deployment
signals for cleantech equity/venture screening and national-competitiveness monitoring.

**8.2 Conceptual approach.** Bibliometric patent-value modelling benchmarked to industry
practice: (i) **citation-and-family-weighted patent value** in the lineage of the
**OECD Patent Quality indicators** (forward citations, family size, generality/originality) and
**PatentSight/LexisNexis "Patent Asset Index"**; (ii) **technology-diffusion nowcasting** linking
grant momentum to deployment, mirroring **IEA/EPO joint CCMT patent studies**. Domain scoring uses
a normalised principal-metric composite rather than an ad-hoc sum.

**8.3 Mathematical specification.**
```
Patent value:     V_p = fwd_cit_p · f_age(t) · g_family(size_p) · h_generality(p)
Assignee index:   PAI_a = Σ_{p∈a} V_p                                   (Patent Asset Index style)
Quality (0–100):  Q_a = 100 · Φ( z(citation) ·w1 + z(family)·w2 + z(generality)·w3 )
Diffusion signal: D_d = Δln(grants_d)/Δt   ·   corr(grants_d,  deployment_d, lag)
Cliff risk:       CR_a = Σ_p 1{expiry_p ∈ [t, t+3y]} · revenue_share_p
Invest signal:    IS_d = β1·CAGR_d + β2·Q̄_d + β3·D_d                    (β from validation)
```

| Parameter | Symbol | Calibration source |
|---|---|---|
| Forward-citation age curve | `f_age` | OECD citation-lag distributions |
| Family-size weight | `g_family` | OECD Patent Quality (INPADOC family) |
| Generality/originality | `h_generality` | Hall-Jaffe-Trajtenberg (NBER) |
| Standardisation weights | `w1..w3` | PCA on OECD quality panel |
| Deployment series | `deployment_d` | IEA WEO/ETP capacity by technology |
| Expiry dates | `expiry_p` | 20-yr statutory term from filing (EPO/USPTO register) |

**8.4 Data requirements.** Patent-level: assignee (harmonised), IPC/CPC (Y02 subclasses),
filing/grant/expiry dates, forward/backward citations, INPADOC family. Sources: **PATSTAT** (EPO,
licensed), **Google Patents Public Data / BigQuery** (free), **WIPO Green** (free). Deployment:
IEA capacity data. Assignee↔ticker map to link to `GLOBAL_COMPANY_MASTER`. None of this is
currently ingested.

**8.5 Validation & benchmarking.** Reconcile assignee `PAI` against LexisNexis Patent Asset Index
rankings for a sample of listed cleantech firms (rank correlation target ρ > 0.7). Back-test the
diffusion signal: does grant-rate momentum lead deployment by the IEA-observed 8–15 yr lag?
Validate cliff flags against known expiry events and observed revenue erosion. Sensitivity on
citation-window truncation.

**8.6 Limitations & model risk.** Citation counts are truncated for recent patents (right-censoring);
assignee harmonisation is error-prone (subsidiaries, M&A); patent count ≠ patent value; the
patent-to-deployment lag varies widely by technology, so diffusion signals carry long horizons and
wide error. Conservative fallback: report quality *deciles* and flag data-incomplete assignees
rather than emitting a single unbounded score.

## 9 · Future Evolution

### 9.1 Evolution A — Real patent counts from public IP databases (analytics ladder: rung 1 → 2)

**What.** §7 flags a partial mismatch: the guide's
`InnovationIndex = Σ Citations × TRL_weight × MarketSize` and the diffusion metric
are unimplemented — the coded `innovScore` is a different fixed blend (citation index,
forward citations, R&D intensity, collaboration) — and all 60 entities' patent
counts, citations, and R&D figures are `sr()`-seeded, with the WIPO/EPO sources named
but not connected. The realistic domain growth-rate table is the one structured
asset. Evolution A grounds the counts: the EPO's Open Patent Services API and the
Google Patents public dataset expose real filing/grant counts and citations, and the
CPC Y02 classification scheme (climate-change mitigation technologies) maps directly
onto the module's 9 `TECH_DOMAINS` — so entity-level patent portfolios and domain
time series become queryable facts rather than seeds.

**How.** (1) An ingest of Y02-classified counts by assignee, CPC subclass, and year
into `ref_climate_patents(assignee, cpc_domain, year, filings, grants, citations)` —
batched offline, not per-request (patent APIs are rate-limited). (2) The `innovScore`
recomputed over real inputs, with the formula reconciled to the guide (implement the
TRL/market-size weighting with cited weights, or rewrite the guide to the coded
blend — one canonical formula). (3) R&D intensity from disclosed financials where
available via the entity spine, else honest-null.

**Prerequisites.** EPO OPS registration (free tier) or Google Patents BigQuery
access; assignee-name → entity resolution (GLEIF spine plus manual mapping for the
top assignees). **Acceptance:** an entity's patent count reconciles to the public
database query; domain trends reproduce published EPO climate-patent statistics
directionally; zero seeded patent fields remain.

### 9.2 Evolution B — IP due-diligence copilot (LLM tier 1 → 2)

**What.** A copilot for cleantech investors: "who leads solid-state battery patents
and how concentrated is the field?" (real counts and shares post-Evolution A),
"how has the hydrogen domain's grant rate trended vs deployment?" (the diffusion
question the guide promises, answerable once both series exist), "summarise entity
X's climate patent posture for a DD memo" — aggregation narration plus structured
drafting, with every count citing the patent-table query that produced it.

**How.** Tier 1: atlas record + patent reference table as corpus/context; DD-memo
drafts through the report layer with the validator on all counts and shares. Tier 2:
parameterised patent-table queries as tools (filter by domain/assignee/year). The
copilot must state the classification basis (CPC Y02) and its known limitation —
classification lags and coverage vary by office — rather than presenting counts as
complete.

**Prerequisites (hard).** Evolution A first: an IP DD memo over seeded patent counts
would be fabricated diligence. **Acceptance:** every count in an answer reproduces
via the stated query; the copilot discloses the Y02 basis when asked about coverage;
valuation-of-IP questions are declined as outside the module's computed surface.