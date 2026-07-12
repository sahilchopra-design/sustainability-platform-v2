# Modern Slavery Intelligence
**Module ID:** `modern-slavery-intel` · **Route:** `/modern-slavery-intel` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
Supply chain forced labour detection and modern slavery compliance platform supporting UK Modern Slavery Act (MSA), Australian Modern Slavery Act, and US UFLPA (Uyghur Forced Labor Prevention Act) due diligence obligations. Combines AI-powered adverse media screening, supplier risk scoring, and regulatory entity list screening to identify forced labour exposure across Tier 1–3 supply chains. Generates annual modern slavery statement data.

> **Business value:** Gives procurement, legal, and ESG teams the intelligence and workflow tools to manage modern slavery compliance obligations across complex supply chains, satisfying UK, Australian, and US regulatory due diligence requirements.

**How an analyst works this module:**
- Upload supplier list with entity name, country, sector, and tier classification
- Run automated adverse media screen against ILO 11 forced labour indicators and UFLPA entity list
- Review FLRS scores and drill into individual supplier adverse media findings with evidence citations
- Initiate enhanced due diligence workflow for high-risk suppliers including questionnaire and audit assignment
- Generate UK and Australian MSA annual statement sections from aggregated supply chain risk data

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COS`, `INDICATORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(0):v;` |
| `INDICATORS` | `['Debt Bondage','Excessive Overtime','Document Retention','Wage Withholding','Deceptive Recruitment','Restricted Movement','Isolation','Threats/Violence','Underpayment','Child Labour','Forced Marriage','Trafficking'];` |
| `msaScore` | `Math.round(sr(i*7)*60+30);const ukMSA=sr(i*11)>0.3;const ausMSA=sr(i*13)>0.5;const indicators=INDICATORS.filter((_,j)=>sr(i*100+j*7)>0.6).slice(0,Math.round(sr(i*17)*4+1));` |
| `supplyTiers` | `Math.round(sr(i*19)*5+1);const audits=Math.round(sr(i*23)*50+5);const violations=Math.round(sr(i*29)*10);const remediated=Math.round(violations*(sr(i*31)*0.5+0.3));` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,score:Math.round(msaScore-5+y*3+sr(i*100+y)*5),audits:Math.round(audits/5+sr(i*100+y*3)*3),violations:Math.round(violations/5-y*0.3+sr(i*100+y*7)*2)}));` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,avgScore:Math.round(filtered.reduce((s,r)=>s+r.msaScore,0)/filtered.length\|\|0),critical:filtered.filter(r=>r.riskLevel==='Critical').length,ukFiled:filtered.filter(r=>r.ukMSA==='Filed'` |
| `sectorRisk` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,score:0,viol:0,n:0};m[c.sector].score+=c.msaScore;m[c.sector].viol+=c.violations;m[c.sector].n++;});return Object.values(m).map(s=>({sector:` |
| `indDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.indicators.forEach(i=>{m[i]=(m[i]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({indicator:k,count:v})).sort((a,b)=>b.count-a.count);},[]);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|

### 2.3 Engine `modern_slavery_engine` (services/modern_slavery_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `ModernSlaveryEngine.assess_forced_labour_risk` | entity_data |  |
| `ModernSlaveryEngine.screen_supply_chain` | request |  |
| `ModernSlaveryEngine.evaluate_msa_statement` | statement |  |
| `ModernSlaveryEngine.calculate_uflpa_exposure` | product |  |
| `ModernSlaveryEngine._score_ilo_indicators` | ed, sector_profile |  |
| `ModernSlaveryEngine._child_labour_risk` | sector_profile, countries |  |
| `ModernSlaveryEngine._debt_bondage_risk` | sector_profile, countries |  |
| `ModernSlaveryEngine._uk_msa_baseline` | ed |  |
| `ModernSlaveryEngine._eu_flr_readiness` | ed, sector_profile |  |
| `ModernSlaveryEngine._uflpa_baseline` | ed |  |
| `ModernSlaveryEngine._check_cahra` | countries |  |
| `ModernSlaveryEngine._overall_risk_tier` | ilo_score, uflpa_score, child_labour_risk, debt_bondage_risk, cahra_flags |  |
| `ModernSlaveryEngine._recommended_actions` | overall_tier, eu_flr_status, uflpa_level, uk_msa_tier, ed |  |
| `ModernSlaveryEngine._recommend_audit_schemes` | sector, countries, commodities |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `exc` *(shared)*, `fastapi` *(shared)*, `services` *(shared)*
**Frontend seed datasets:** `INDICATORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| FLRS (0–100) | — | Composite risk model | Entity-level forced labour risk score; above 70 triggers enhanced due diligence |
| ILO Indicator Hits | — | ILO Indicators of Forced Labour 2012 | Number of ILO forced labour indicators detected in adverse media for the screened supplier |
| UFLPA Entity List Status | — | US DHS UFLPA Entity List | Whether the supplier appears on the US DHS UFLPA forced labour entity list |
| Modern Slavery Statement Coverage (%) | — | UK/Australian MSA reporting | Proportion of mandatory MSA statement sections addressed with substantive narrative |
- **Supplier entity list** → Match to sector and country risk tables; assign inherent risk scores → **Tier 1–3 supplier risk profile database**
- **Adverse media AI screening engine** → Parse news and NGO reports; classify against 11 ILO forced labour indicators; score severity → **Adverse media hit report with evidence snippets and ILO indicator mapping per supplier**
- **UFLPA entity list (DHS)** → Exact and fuzzy name matching; flag listed entities; log match confidence → **Regulatory list screening results with match confidence and entity list citation**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/modern-slavery/ref/audit-schemes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'effectiveness_scale', 'schemes'], 'n_keys': 3}`

**GET /api/v1/modern-slavery/ref/high-risk-sectors** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['count', 'note', 'sectors', 'cahra_countries'], 'n_keys': 4}`

**GET /api/v1/modern-slavery/ref/ilo-indicators** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'ilo_conventions', 'count', 'indicators'], 'n_keys': 4}`

**GET /api/v1/modern-slavery/ref/uflpa-criteria** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['legislation', 'enacted', 'enforcing_body', 'rebuttable_presumption', 'entity_categories', 'high_risk_commodities', 'approved_importer_criteria', 'cbp_enforcement_statistics', 'documentation_requirements', 'eu_flr_summary', 'uk_msa_summary'], 'n_keys': 11}`

**POST /api/v1/modern-slavery/assess** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/modern-slavery/msa-statement** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/modern-slavery/supply-chain-screen** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

**POST /api/v1/modern-slavery/uflpa-exposure** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** Forced Labour Risk Score
**Headline formula:** `FLRSᵢ = SectorRiskᵢ + CountryRiskᵢ + AdverseMediaScoreᵢ + RegulatoryListHitᵢ`

Forced Labour Risk Score aggregates sector inherent risk (ILO forced labour sector mapping), country risk (Global Slavery Index national prevalence), adverse media score (AI screen of news for 11 ILO forced labour indicators), and regulatory entity list hit status. Scores above 70 trigger enhanced due diligence workflow requiring supplier questionnaire and independent audit.

**Standards:** ['UK Modern Slavery Act 2015', 'Australian Modern Slavery Act 2018', 'US UFLPA Entity List 2022', 'ILO Indicators of Forced Labour 2012', 'Global Slavery Index â€” Walk Free Foundation 2023']
**Reference documents:** UK Modern Slavery Act 2015 â€” Transparency in Supply Chains Provisions (Section 54); Australian Modern Slavery Act 2018; US Uyghur Forced Labor Prevention Act (UFLPA) 2021; ILO Hard to See, Harder to Count â€” Survey Guidelines on Indicators of Forced Labour 2012; Walk Free Foundation Global Slavery Index 2023

**Engine `modern_slavery_engine` — extracted transformation lines:**
```python
priority = min(100.0, base + (10 if uflpa_flag else 0) + (10 if cahra_flag else 0)
total_score = max(0.0, min(100.0, base_score + bonus))
xinjiang_exposure = max_exposure * (china_count / max(1, len(product.supplier_countries)))
raw_score = min(1.0, raw_score * 1.3)
raw_score = min(1.0, raw_score * 1.5)
composite = (weighted_score / total_weight) * 100
score = min(100.0, score + 10.0)
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **46** other module(s).

| Connected module | Shared via |
|---|---|
| `blended-finance-structuring` | table:exc |
| `supply-chain-esg-hub` | table:exc |
| `carbon-accounting-ai` | table:exc |
| `green-hydrogen-lcoh` | table:exc |
| `just-transition-finance-hub` | table:exc |
| `adaptation-finance` | table:exc |
| `supply-chain-resilience` | table:exc |
| `crrem` | table:exc |
| `climate-underwriting-workbench` | table:exc |
| `battery-revenue-stacker` | table:exc |

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide describes the frontend as running the formula
> `FLRS = SectorRisk + CountryRisk + AdverseMediaScore + RegulatoryListHit`, backed by an AI
> adverse-media screening pipeline and 5 live API endpoints (`/assess`, `/msa-statement`,
> `/supply-chain-screen`, `/uflpa-exposure`, plus 4 reference-data GETs). **The frontend page never
> calls any of them.** `ModernSlaveryIntelPage.jsx` is 100% client-side, generating all 60 companies'
> scores via the seeded PRNG `sr()`. The backend (`backend/services/modern_slavery_engine.py`, 1,889
> lines) genuinely implements a well-built ILO/UK MSA/EU FLR/UFLPA weighted-risk engine — but it is
> orphaned from the UI. Sections below document (a) what the page renders, and (b) the real backend
> methodology that should be wired to it.

### 7.1 What the frontend page computes

60 named real companies (Nike, Walmart, Foxconn, Rio Tinto, JBS, G4S, etc.) across 8 sectors, each
seeded independently:

```js
msaScore    = round(sr(i*7)*60 + 30)                          // 30–90
ukMSA       = sr(i*11) > 0.3 ? 'Filed' : 'N/A'                // ~70% filed
ausMSA      = sr(i*13) > 0.5 ? 'Filed' : 'N/A'                // ~50% filed
indicators  = INDICATORS.filter((_,j) => sr(i*100+j*7) > 0.6).slice(0, round(sr(i*17)*4+1))
supplyTiers = round(sr(i*19)*5+1); audits = round(sr(i*23)*50+5); violations = round(sr(i*29)*10)
remediated  = round(violations * (sr(i*31)*0.5+0.3))           // 30–80% of violations remediated
remediationRate = violations>0 ? round(remediated/violations*100) : 100   // real ratio over synthetic inputs
riskLevel   = msaScore>70?'Low':msaScore>50?'Medium':msaScore>30?'High':'Critical'
```

Sector aggregates (`sectorRisk`) and indicator frequency (`indDist`) are real `reduce`/`groupBy`
operations over the 60 synthetic rows — genuine aggregation, synthetic inputs.

### 7.2 The real backend methodology (`modern_slavery_engine.py`, not called by this page)

```python
# ILO composite score (11 indicators, weighted)
for each ILO indicator: raw_score = risk_map[sector_prevalence]   # very_high .9/high .7/medium .45/low .2/very_low .05
    if known_cahra_links: raw_score = min(1.0, raw_score * 1.3)
    if known_xinjiang_links and indicator in {movement, isolation, conditions}: raw_score *= 1.5
    weighted_score += indicator.weight * raw_score
ilo_composite = weighted_score / total_weight * 100

# UK MSA baseline: no statement=10, has statement=45 (+10 if audited, +5 if EU FLR programme)
# EU FLR readiness: +40 (has programme) +20 (has MSA stmt) +min(30, audit_schemes*10) −5 (unmapped Tier-1 suppliers)
# UFLPA exposure: +70 (Xinjiang links) + min(20, china_supplier_count*5) + min(10, uflpa_commodity_match*5) +10 (no compliance programme)

overall_aggregate = ilo_score*0.4 + uflpa_score*0.25 + child_labour_risk_val*5 + debt_bondage_risk_val*5 + cahra_flag_count*10
overall_tier = aggregate>=60 or any(cahra_flags) ? 'critical' : aggregate>=40 ? 'high' : aggregate>=20 ? 'medium' : 'low'
```

### 7.3 Parameterisation

| Element | Value | Provenance |
|---|---|---|
| Frontend `msaScore` range | 30–90 | Arbitrary PRNG stretch; no linkage to the real backend's 0–100 composite |
| Backend `risk_map` | very_high 0.9 / high 0.7 / medium 0.45 / low 0.2 / very_low 0.05 | Hand-calibrated ILO prevalence-to-score mapping — reasonable ordinal scale, not empirically fit |
| Backend CAHRA multiplier | ×1.3 | Applied when entity has Conflict-Affected/High-Risk-Area links — a defensible escalation factor, magnitude not independently sourced |
| Backend Xinjiang multiplier | ×1.5 on 3 specific ILO indicators (movement, isolation, conditions) | Targets the indicators most associated with documented Uyghur forced-labour patterns per US/UK government reporting — a reasonable, specific design choice |
| Backend overall-tier weights | ILO 40%, UFLPA 25%, child-labour 5×ordinal, debt-bondage 5×ordinal, CAHRA +10/flag | Hand-calibrated composite; ILO/UFLPA given the largest weight as the two frameworks with the richest underlying indicator sets |

### 7.4 Calculation walkthrough (frontend)

1. **MSA Dashboard tab** — sortable/searchable/paginated table over the 60 rows; KPI strip
   (`avgScore`, `critical` count, `ukFiled`/`ausFiled` counts, `totalViolations`, `avgRemediation`)
   computed via `reduce`/`filter` over the currently filtered subset.
2. **Statement Analysis tab** — pie of `statementQuality` distribution (`Comprehensive/Adequate/
   Basic/Minimal`, PRNG-selected); bar of board-signoff rate by sector.
3. **Forced Labour Indicators tab** — `indDist` bar chart of the 12 `INDICATORS` by cross-company
   frequency; sector violations bar chart.
4. **Supply Chain Risk tab** — top-15 supply-chain-mapping-% bar chart; audits-vs-violations scatter.
5. **Detail panel** — per-company drill-down showing all fields plus a 5-year synthetic trend
   (`yearly` array, `score = msaScore−5+y×3+jitter`, a simple upward-drift illustration).

### 7.5 Worked example

Backend `_score_ilo_indicators` for a hypothetical apparel-sector entity with a CAHRA link and one
ILO indicator ("restriction_of_movement") flagged `high` prevalence for that sector, weight 0.12 (of
total weight ≈1.0 across 11 indicators):

```
raw_score = risk_map['high'] = 0.70
CAHRA adjustment: raw_score = min(1.0, 0.70 × 1.3) = 0.91
contribution to weighted_score: 0.12 × 0.91 = 0.1092
```

Summed across all 11 indicators and divided by `total_weight`, this produces the `ilo_composite_score`
(0–100). If this entity's `uflpa_score` (from the separate UFLPA baseline function) were, say, 45, and
it had one CAHRA flag: `aggregate = ilo×0.4 + 45×0.25 + child_val×5 + debt_val×5 + 1×10` — with
`ilo≈60` this gives `24 + 11.25 + (say 2×5=10) + (2×5=10) + 10 = 65.25`, which exceeds the 60 threshold
→ **overall_risk_tier = 'critical'** (also triggered independently by the CAHRA flag itself, since
the rule is `aggregate ≥ 60 OR any CAHRA flag`).

### 7.6 Data provenance & limitations

- **Frontend and backend are entirely disconnected.** The frontend's synthetic 60-company dataset has
  no relationship to the backend's real, weighted ILO/UK-MSA/EU-FLR/UFLPA scoring engine — a user
  interacting with this Tier-A module sees plausible-looking real company names with fabricated risk
  scores, not the output of the sophisticated engine that exists in the same codebase.
- The backend engine's `_uk_msa_baseline`/`_eu_flr_readiness`/`_uflpa_baseline` functions are
  deterministic (`"No DB calls — deterministic scoring from reference data"` per the class docstring)
  and reference real regulatory thresholds — genuinely production-adjacent code, unlike most modules
  in this deep-dive batch.
- `remediationRate` on the frontend is a real ratio computation, but over PRNG-generated `violations`/
  `remediated` counts that bear no relationship to the named companies' actual audit histories.

**Framework alignment:** ILO Indicators of Forced Labour 2012 (correctly implemented as an 11-indicator
weighted score in the **backend**, absent from the **frontend**) · UK Modern Slavery Act 2015 §54
(backend tiering genuinely reflects Home Office quality-tier bands) · EU Forced Labour Regulation
2024/3015 (backend readiness score genuinely reflects programme/statement/audit-scheme components) ·
US UFLPA (backend Xinjiang-link and CAHRA-commodity scoring genuinely reflects DHS enforcement
priorities) · CAHRA (Conflict-Affected and High-Risk Areas) — implemented in backend only.

## 8 · Model Specification

**Status: specification — not yet implemented in code (wiring, not new methodology, is what's needed).**

### 8.1 Purpose & scope
This is the rare case where §8 is a **wiring specification**, not a from-scratch model design: connect
the existing, well-built `ModernSlaveryEngine` backend to `ModernSlaveryIntelPage.jsx` so the 60
displayed companies show real ILO/UK-MSA/EU-FLR/UFLPA scores instead of PRNG output, for supply-chain
compliance teams performing UK/Australian MSA and UFLPA due diligence.

### 8.2 Conceptual approach
Standard frontend-to-backend integration: replace the client-side `COS` generator with a `fetch` call
to `POST /api/v1/modern-slavery/assess` (already implemented, per `trace_labels`) for each tracked
entity, batched or paginated as needed; retain the existing UI/chart structure since it is already
well-designed for the real response shape (`uk_msa_score`, `eu_flr_readiness_score`,
`uflpa_exposure_score`, `ilo_composite_score`, `overall_risk_tier`, `cahra_flags` map directly onto the
current `msaScore`/`ukMSA`/`riskLevel`/etc. fields).

### 8.3 Mathematical specification
No new mathematics — reuse the backend's existing, already-correct formulas from §7.2 verbatim. The
only new logic needed is a batch/portfolio aggregation layer:

```
PortfolioFLRS = weighted_mean(entity.overall_aggregate, weight = entity.revenue_exposure_or_equal_weight)
SectorRisk_s  = mean(entity.ilo_composite_score for entity in sector s)
```

### 8.4 Data requirements
Per-company `AssessForcedLabourRequest` payloads (sector, supply-chain countries, commodities,
Xinjiang/CAHRA link flags, existing audit schemes, MSA/EU-FLR programme status) for each of the 60
tracked companies — this is a data-entry/onboarding task, not a new data-source integration, since the
scoring logic already exists.

### 8.5 Validation & benchmarking plan
Spot-check a handful of well-documented real cases (e.g. a company with a publicly reported UFLPA
Withhold Release Order) against the backend's computed `uflpa_risk_level` to confirm the engine
produces sensible outputs before wiring to the full 60-company UI.

### 8.6 Limitations & model risk
The backend engine is deterministic and reference-data-driven, not ML-based — it will not surface
forced-labour risk not captured by its sector/country/CAHRA reference tables (e.g. company-specific
adverse media the guide's original description promised but the backend does not actually implement
as an "AI-powered adverse media screening" pipeline — that capability remains unbuilt even in the
backend and would need genuine NLP/news-ingestion infrastructure).

## 9 · Future Evolution

### 9.1 Evolution A — Wire the orphaned FLRS engine to the page and calibrate it (analytics ladder: rung 1 → 3)

**What.** Close the module's documented wiring gap before adding anything new: §7's mismatch flag shows `ModernSlaveryIntelPage.jsx` renders 60 companies of seeded-PRNG (`sr()`) scores while the genuinely well-built 1,889-line `modern_slavery_engine.py` — ILO 11-indicator scoring, UFLPA/CAHRA flags, `xinjiang_exposure` apportionment — sits orphaned behind `POST /api/v1/modern-slavery/assess`, `/supply-chain-screen`, `/uflpa-exposure`, and `/msa-statement`. Then calibrate the engine's country-risk term to a real external anchor.

**How.** (1) Replace the synthetic 60-company loop with a supplier-upload flow posting to `/supply-chain-screen`, rendering the engine's real FLRS decomposition (sector + country + adverse-media + list-hit per §5). (2) Seed the country-risk table from Walk Free Global Slavery Index prevalence values (already the named standard) instead of engine-internal constants, stored in a `ref_gsi_country_risk` table so it is versioned and citable. (3) Benchmark: pin 5 reference suppliers (e.g. a Xinjiang-linked polysilicon entity vs a EU-domiciled service firm) in `bench_quant`-style tests asserting FLRS ordering and the `priority = min(100, base + uflpa + cahra)` caps.

**Prerequisites.** The lineage sweep shows the three POST endpoints currently `failed` — fix those live 4xx/5xx responses first; REQUIRE_AUTH gating on POSTs also applies. **Acceptance:** page numbers change when the supplier list changes and match a direct API call byte-for-byte; no `sr()` call remains in the score path.

### 9.2 Evolution B — Due-diligence analyst that screens and drafts MSA statements (LLM tier 2)

**What.** A tool-calling analyst on this page that executes "screen this supplier list and tell me who needs enhanced due diligence" by calling `/supply-chain-screen` and `/assess`, explains each FLRS using the engine's real component breakdown, and drafts UK/Australian MSA statement sections via `/msa-statement` — grounded in the four reference GETs (`/ref/ilo-indicators`, `/ref/uflpa-criteria`, `/ref/high-risk-sectors`, `/ref/audit-schemes`, all currently passing) so indicator definitions are quoted, not paraphrased from memory.

**How.** Tool schemas from the module's 8 OpenAPI operations; system prompt assembled from this Atlas page's §5/§7 engine methodology. Statement drafting is templated: the LLM fills MSA Section 54 headings (structure, policies, due diligence, risk assessment, KPIs) exclusively with fields from the `/msa-statement` response and screen results, with the no-fabrication validator checking every supplier name and score against tool outputs. High-risk determinations (>70 FLRS per §5) trigger a human-confirmation step before any EDD workflow write.

**Prerequisites (hard).** Evolution A first — the copilot must never narrate the current seeded-random page numbers; POST endpoints must return 200s under auth. **Acceptance:** a drafted MSA section cites only screened-supplier data from the session's tool calls; asking about a supplier not in the uploaded list yields a refusal.