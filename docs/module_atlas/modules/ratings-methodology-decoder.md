# Ratings Methodology Decoder
**Module ID:** `ratings-methodology-decoder` · **Route:** `/ratings-methodology-decoder` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESG ratings transparency tool decomposing provider scores by pillar, weight, and indicator to enable cross-provider comparison and divergence analysis.

> **Business value:** Demystifies opaque ESG rating methodologies, enabling informed provider selection, score challenge, and robust multi-provider integration.

**How an analyst works this module:**
- Select company and choose providers for comparison.
- Decode score into pillar and indicator contributions.
- Identify divergence drivers across providers.
- Export methodology comparison matrix.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `COMPANIES`, `DATA_SOURCES`, `DS_CATS`, `E_ISSUES`, `GICS_SECTORS`, `G_ISSUES`, `PROVIDERS`, `S_ISSUES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROVIDERS` | 6 | `id`, `name`, `color`, `eW`, `sW`, `gW` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `G_ISSUES` | `['Board Composition & Independence','Executive Compensation Alignment','Shareholder Rights & Engagement','Business Ethics & Anti-Corruption','Audit & Risk Oversight','Tax Transparency & Strategy','Lobbying & Political Sp` |
| `gKPIs` | `['Board Independence Ratio (%)','CEO-Median Pay Ratio','Say-on-Pay Approval Rate','Anti-Corruption Training (%)','Board Gender Diversity (%)','Board Meeting Attendance','Audit Committee Independence','Risk Committee Effe` |
| `covered` | `PROVIDERS.map((_p,pi)=>sr(seed+i*7+pi*13)>0.3);` |
| `weight` | `PROVIDERS.map((_p,pi)=>Math.round(sr(seed+i*11+pi*17)*5+1));` |
| `total` | `eSlider+sSlider+gSlider;` |
| `providerScores` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `eAdj` | `c.baseE+sr(pi*31+selCompany*13)*10-5;` |
| `sAdj` | `c.baseS+sr(pi*37+selCompany*17)*10-5;` |
| `gAdj` | `c.baseG+sr(pi*43+selCompany*19)*10-5;` |
| `coverageScores` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `scores` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*31+pi*17+matYearView*100)*8+2));` |
| `avg` | `scores.reduce((a,b)=>a+b,0)/scores.length;` |
| `disagreement` | `Math.round(Math.sqrt(scores.reduce((a,s)=>a+(s-avg)**2,0)/scores.length)*100)/100;` |
| `matDrift` | `useMemo(()=>GICS_SECTORS.map((sector,si)=>{` |
| `drift` | `y0.reduce((a,v,i)=>a+Math.abs(v-y2[i]),0)/y0.length;` |
| `usage` | `PROVIDERS.map((_,pi)=>sr(origIdx*13+pi*19)>0.35);` |
| `freshness` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*17+pi*23)*24+1));` |
| `quality` | `PROVIDERS.map((_,pi)=>Math.round(sr(origIdx*29+pi*31)*4+1));` |
| `dsFreshness` | `useMemo(()=>PROVIDERS.map((p,pi)=>{` |
| `pct` | `kpis.length>0?Math.round(overlap/kpis.length*100):0;` |
| `totalW` | `Object.entries(customWeights).reduce((a,[,v])=>a+v,0);` |
| `score` | `Object.entries(customWeights).reduce((a,[k,v])=>{` |
| `avgQ` | `usedSources.length>0?usedSources.reduce((a,ds)=>a+ds.quality[pi],0)/usedSources.length:0;` |
| `avgF` | `usedSources.length>0?usedSources.reduce((a,ds)=>a+ds.freshness[pi],0)/usedSources.length:0;` |
| `rows` | `[['Data Source','Category',...PROVIDERS.map(p=>p.name+' (Use\|Quality\|Freshness)')].join(',')];` |
| `blob` | `new Blob([rows.join('\n')],{type:'text/csv'});` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `DATA_SOURCES`, `E_ISSUES`, `GICS_SECTORS`, `G_ISSUES`, `PROVIDERS`, `S_ISSUES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Provider Coverage | — | Platform Registry | Number of ESG rating providers with decoded methodology in platform. |
| Score Divergence (σ) | — | Cross-Provider Analysis | Standard deviation of provider ESG scores for same company, illustrating methodology-driven divergence. |
| Weight Transparency (%) | — | Provider Disclosures | Average proportion of provider methodology weights that are publicly disclosed. |
- **Provider score feeds + methodology weights + indicator data** → Score decomposition; pillar attribution; cross-provider divergence analysis → **Score transparency report and provider comparison matrix**

## 5 · Intermediate Transformation Logic
**Methodology:** Score Reconstruction
**Headline formula:** `ESĜ = Σ(w_pillarᵢ × Σ(w_indicator_j × score_j))`

Bottom-up reconstruction of provider ESG score from disclosed indicator weights and sub-scores to audit methodology consistency.

**Standards:** ['MSCI ESG Ratings Methodology', 'Sustainalytics ESG Risk Rating Methodology']
**Reference documents:** Berg, Kölbel, Rigobon (2022) Aggregate Confusion: The Divergence of ESG Ratings. Review of Finance; MSCI ESG Ratings Methodology Document (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

This module decodes and compares the ESG-rating methodologies of six major providers. Its
distinguishing feature is that the **provider pillar weights are real and accurate** (not seeded),
and the core computation — a pillar-weighted composite score with a live what-if weighting slider —
is genuine, correct arithmetic. Company-level scores, per-KPI coverage, and materiality weights are
`sr()`-seeded demo data layered on top.

### 7.1 What the module computes

**Provider composite score** (`providerScores`) — the load-bearing calculation:

```js
eAdj = baseE + (sr(pi·31+company·13)·10 − 5)               // provider-specific ±5 tilt on base
score = round( eAdj·(eW/100) + sAdj·(sW/100) + gAdj·(gW/100) )   // pillar-weighted composite
```

**What-if score** (`whatIfScore`) — user re-weights E/S/G via sliders:

```js
total = eSlider + sSlider + gSlider
score = round( baseE·(eSlider/total) + baseS·(sSlider/total) + baseG·(gSlider/total) )
```

This is a **correct normalised weighted average** — the pedagogical core of the module: it shows how
the *same* company gets a different score under each provider's weighting scheme, and lets the user
see how re-weighting the pillars moves the score.

**KPI coverage matrix** (`genKPIs`): for 60 KPIs per pillar, a boolean `covered[provider]`
(`sr(...)>0.3`) and integer `weight[provider]` (1–6). **Materiality matrix** (`genMateriality`):
per sector × provider, the top-10 issues by seeded weight (2–10).

### 7.2 Parameterisation / provenance

| Quantity | Value | Provenance |
|---|---|---|
| MSCI E/S/G weights | 35 / 35 / 30 | **real** (MSCI industry-relative structure) |
| S&P Global weights | 30 / 35 / 35 | **real** |
| Sustainalytics weights | 40 / 30 / 30 | **real** (E-heavy risk-rating tilt) |
| ISS ESG weights | 33 / 34 / 33 | **real** (near-equal) |
| CDP / FTSE weights | 45 / 25 / 30 | **real** (E-dominant, climate focus) |
| Bloomberg weights | 32 / 38 / 30 | **real** |
| E/S/G issue lists | 15 / 15 / 12 issues | **real** (SASB/MSCI key-issue taxonomy) |
| KPI names (60/pillar) | fixed lists | **real** (genuine ESG KPI names) |
| Company base scores | `45+sr()·30`, etc. | **synthetic seeded** |
| KPI coverage / weight | `sr()` | synthetic |
| Materiality weights | `sr()` | synthetic |

The **weights, issue taxonomy, and KPI names are genuine reference data**; only company scores and
coverage flags are fabricated.

### 7.3 Calculation walkthrough

1. Select a company → `baseE/baseS/baseG` (seeded) loaded.
2. `providerScores` applies each provider's real pillar weights to the company's (±5-tilted) base
   scores → six different composite scores, illustrating **rating divergence**.
3. What-if sliders normalise to sum-1 and recompute the composite live.
4. KPI/materiality tabs display seeded coverage and issue-weight matrices per provider/sector.

### 7.4 Worked example (rating divergence for one company)

Company base scores `baseE = 60, baseS = 50, baseG = 70` (assume the ±5 tilt ≈ 0 for illustration):

| Provider | Weights (E/S/G) | Composite |
|---|---|---|
| MSCI | 35/35/30 | 60·.35 + 50·.35 + 70·.30 = 21 + 17.5 + 21 = **59.5** |
| Sustainalytics | 40/30/30 | 60·.40 + 50·.30 + 70·.30 = 24 + 15 + 21 = **60.0** |
| CDP/FTSE | 45/25/30 | 60·.45 + 50·.25 + 70·.30 = 27 + 12.5 + 21 = **60.5** |
| S&P Global | 30/35/35 | 60·.30 + 50·.35 + 70·.35 = 18 + 17.5 + 24.5 = **60.0** |

The same company scores 59.5–60.5 depending on the weighting — a small spread here, but a company
strong on E and weak on G would diverge much more (CDP would score it high, S&P lower). This is
exactly the **ESG-rating-divergence** phenomenon the module is built to illustrate, and the
arithmetic is correct.

### 7.5 Data provenance & limitations

- **Provider weights, pillar issues, and KPI names are real reference data** — a genuine strength.
- **Company scores, KPI coverage, materiality weights are synthetic**, seeded by
  `sr(seed)=frac(sin(seed+1)×10⁴)`.
- The score model is a **flat pillar-weighted average**; real providers use hierarchical
  key-issue → theme → pillar structures with sector-specific materiality maps and exposure/management
  sub-scores — the module simplifies to three pillar weights.
- The ±5 "provider tilt" is a random perturbation, not each provider's actual sub-methodology.

**Framework alignment:** The six providers are decoded accurately. **MSCI ESG Ratings** — an
industry-relative model scoring 35 key issues weighted by exposure/management into E/S/G pillars,
then to a AAA–CCC letter; the module's 35/35/30 split and key-issue list mirror this. **S&P Global
CSA** (Corporate Sustainability Assessment) — questionnaire-driven, materiality-weighted. **Morningstar
Sustainalytics** — an *risk*-rating (unmanaged risk), hence its E-heavy 40/30/30 tilt. **ISS ESG**,
**CDP** (climate-scored A–D−, hence E-dominant 45/25/30), **Bloomberg ESG**. The genuine value is
teaching **why ratings diverge** — different pillar weights and materiality maps applied to the same
issuer — which the correct weighted-average computation demonstrates. No §8 model is required: the
computation is transparent and the reference weights are real; the limitation is synthetic company
data and pillar-level (vs key-issue-level) granularity.

## 9 · Future Evolution

### 9.1 Evolution A — Divergence decomposition on disclosed scores (analytics ladder: rung 1 → 3)

**What.** The module's pedagogical core is genuine — real provider pillar weights (MSCI 35/35/30, S&P 30/35/35, per §7.2) driving a correct normalised weighted-average what-if — but company scores, KPI coverage booleans (`sr(...)>0.3`), materiality weights, and data-source freshness/quality are all seeded. Evolution A grounds the divergence analysis in disclosed data: ingest publicly available provider scores where legitimately obtainable (some providers publish headline scores; CDP scores and the platform's own disclosure-derived assessments are free complements) and implement the Berg–Kölbel–Rigobon decomposition the module's own reference cites — splitting cross-provider divergence into scope, measurement, and weight components rather than displaying a bare σ.

**How.** (1) `api/v1/routes/ratings_decoder.py`: `POST /decompose` taking per-provider pillar scores for a company and returning the divergence split (weight-effect computed by re-scoring each provider's pillars under a common weight set — exactly the what-if machinery the page already has, applied systematically); `GET /providers` serving the real weight table with methodology-vintage stamps. (2) A `ratings_observations` table for user-entered or ingested provider scores (many clients hold licensed scores they may input), replacing `baseE + sr()·10 − 5` tilts. (3) The seeded KPI-coverage matrix is replaced by a hand-curated indicator map from public methodology documents for the six providers — a research task, honestly scoped, versioned by methodology year.

**Prerequisites.** Licensing review for any redistributed provider scores (user-supplied input avoids this); the curated indicator map maintained per provider update cycle. **Acceptance:** for a company with real inputs, weight-effect + measurement-effect divergence reconciles to total observed σ; the what-if slider reproduces each provider's own composite when set to that provider's weights.

### 9.2 Evolution B — Methodology-explainer copilot (LLM tier 1)

**What.** The module exists to demystify methodologies — a job that is mostly reading and cross-referencing documents, i.e., copilot-shaped from day one. Tier 1 ships an explainer grounded in the curated methodology corpus: "why does Sustainalytics rate this utility worse than MSCI?" answered from the weight table and indicator map ("Sustainalytics' unmanaged-risk framing weights carbon-intensive operations more heavily; MSCI's industry-relative scoring compares within utilities"), always distinguishing methodology-driven divergence from data-driven divergence per the Berg et al. taxonomy the module cites.

**How.** Standard copilot router over pgvector chunks of this Atlas record, the provider methodology documents (public PDFs), and — post-Evolution-A — `POST /decompose` outputs injected as context for company-specific questions. The hard guardrail: provider scores for a specific company are only ever quoted from stored observations, never from training data (stale/wrong scores about named issuers are a legal risk, not just an accuracy one); absent an observation, the copilot explains what the methodologies *would* weight, explicitly hypothetically. Score-challenge support ("draft our appeal on the governance pillar") cites the indicator map rows the challenge disputes.

**Prerequisites.** Methodology PDFs chunked with provider/version metadata; refusal evals for company-score recall. **Acceptance:** provider-comparison answers cite specific weight/indicator entries, and asked for a named company's MSCI score with no stored observation, the copilot declines rather than recalls.