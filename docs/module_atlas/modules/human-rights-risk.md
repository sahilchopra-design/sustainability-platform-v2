# Human Rights Risk
**Module ID:** `human-rights-risk` · **Route:** `/human-rights-risk` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses supply chain human rights risk using UN Guiding Principles on Business and Human Rights (UNGP) and EU Corporate Sustainability Due Diligence Directive (CS3D) frameworks, identifying salient human rights issues and high-risk supplier relationships. Provides sector-specific risk scoring for child labour, forced labour, gender-based violence, and freedom of association.

> **Business value:** Enables companies and investors to meet CS3D human rights due diligence obligations, identify and prioritise salient human rights risks in supply chains, and demonstrate respect for human rights under the UNGP framework. Supports ESRS S2 (Workers in the Value Chain) and GRI 409/410/411 disclosures.

**How an analyst works this module:**
- Map the supply chain by commodity, sourcing geography, and production process to identify high-risk supplier relationships.
- Run the salience assessment across the identified human rights issues, scoring probability, severity, breadth, and remediability.
- Prioritise the top 5 salient human rights issues and define due diligence actions for each.
- Generate the CS3D-aligned human rights due diligence report with supplier engagement and remediation tracking.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `COLORS`, `COS`, `ISSUES`, `SECTORS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed(1):v;` |
| `names` | `['Apple','Samsung','Nike','H&M','Nestle','Unilever','Shell','BHP','Glencore','Rio Tinto','Coca-Cola','PepsiCo','Amazon','Walmart','Tesla','Meta','Alphabet','Microsoft','BASF','Dow','Caterpillar','Siemens','Toyota','Volks` |
| `riskScore` | `Math.round(sr(i*7)*70+20);const ungpScore=Math.round(sr(i*11)*60+30);const dueDiligence=Math.round(sr(i*13)*50+40);` |
| `salient` | `ISSUES.filter((_,j)=>sr(i*100+j*7)>0.5).slice(0,Math.round(sr(i*17)*5+2));` |
| `incidents` | `Math.round(sr(i*19)*15);const grievances=Math.round(sr(i*23)*30);const remediations=Math.round(grievances*(sr(i*29)*0.6+0.2));` |
| `supplyTiers` | `Math.round(sr(i*31)*4+1);const countriesOp=Math.round(sr(i*37)*40+5);const highRiskCountries=Math.round(countriesOp*(sr(i*41)*0.4));` |
| `yearly` | `Array.from({length:5},(_,y)=>({year:2020+y,risk:Math.round(riskScore+5-y*2+sr(i*100+y)*8),ungp:Math.round(ungpScore-3+y*2+sr(i*100+y*3)*5),incidents:Math.round(incidents-y*0.5+sr(i*100+y*7)*3)}));` |
| `filtered` | `useMemo(()=>{let d=[...COS];if(search)d=d.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));if(sectorF!=='All')d=d.filter(r=>r.sector===sectorF);d.sort((a,b)=>sortDir==='asc'?(a[sortCol]>b[sortCol]?1:-1):(a[sortCol]<b[sortCol]?1:-1));return d;},[search,sectorF,sortCol,sortDir]); const paged=useMemo(()=>filtered.slice((page-1)` |
| `stats` | `useMemo(()=>({count:filtered.length,avgRisk:Math.round(filtered.reduce((s,r)=>s+r.riskScore,0)/filtered.length\|\|0),critical:filtered.filter(r=>r.severity==='Critical').length,avgUNGP:Math.round(filtered.reduce((s,r)=>s+r` |
| `sectorRisk` | `useMemo(()=>{const m={};COS.forEach(c=>{if(!m[c.sector])m[c.sector]={s:c.sector,risk:0,ungp:0,n:0};m[c.sector].risk+=c.riskScore;m[c.sector].ungp+=c.ungpScore;m[c.sector].n++;});return Object.values(m).map(s=>({sector:s.` |
| `issueDist` | `useMemo(()=>{const m={};COS.forEach(c=>c.salientIssues.forEach(i=>{m[i]=(m[i]\|\|0)+1;}));return Object.entries(m).map(([k,v])=>({issue:k,count:v})).sort((a,b)=>b.count-a.count);},[]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLORS`, `ISSUES`, `SECTORS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Salient Risk Score (top issue) | — | UNGP / CS3D assessment | Score for the highest-priority salient human rights issue; scores above 70 require documented action plan under CS3D Article 8. |
| High-Risk Supplier Ratio (%) | — | KnowTheChain / Sedex data | Proportion of Tier 1 suppliers in high-risk geographies or sectors for forced labour, child labour, or unsafe working conditions. |
| Remediation Case Resolution Rate (%) | — | Internal grievance mechanism data | Percentage of reported human rights grievances resolved or in active remediation; UNGP Principle 29 requires effective non-judicial remedy mechanisms. |
| Supply Chain Audit Coverage (%) | — | Internal procurement data | Share of Tier 1 spend covered by third-party social audits; insufficient coverage risks CS3D non-compliance. |
- **Supplier database (Tier 1 and Tier 2)** → Map to geographic and sectoral human rights risk indices (KnowTheChain/Verisk) → **Supplier human rights risk scores**
- **Social audit reports (Sedex/SMETA)** → Extract non-conformances by human rights issue category → **Audit finding heatmap by supplier**
- **Grievance mechanism records** → Classify by human rights issue, track resolution status → **Remediation tracking dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Salient Human Rights Risk Score
**Headline formula:** `SHRRS = Σ_k P(harm_k) × Severity_k × Breadth_k × Remediability_k`

Prioritises human rights issues by combining the probability of harm occurrence, its severity (scale 1â€“5 aligned to UNGP Principle 14), breadth of impact (number of people at risk), and irremediability. This UNGP-aligned salience methodology identifies which human rights issues require the most urgent attention under the due diligence obligation.

**Standards:** ['UN Guiding Principles on Business and Human Rights (2011)', 'EU CS3D Directive (2024)', 'ILO Core Labour Standards']
**Reference documents:** UN Guiding Principles on Business and Human Rights (2011); EU Corporate Sustainability Due Diligence Directive (CS3D) (2024); ILO Core Labour Standards (1998 Declaration); KnowTheChain Benchmark Methodology (2023)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry promises a *salient human rights
> risk score* with the formula `SHRRS = Σ_k P(harm_k) × Severity_k × Breadth_k × Remediability_k`
> — the four-factor UNGP Principle 14 salience calculus. **No such computation exists in the code.**
> The page assigns each company a `riskScore`, `ungpScore` and `dueDiligence` score by drawing three
> independent uniforms from the seeded PRNG and rescaling them; the "salient issues" list is a random
> subset of a fixed issue vocabulary. The guide's KnowTheChain/Sedex data sources, remediation
> resolution rates and audit-coverage metrics are likewise not wired to any input. The sections below
> document what the code actually does; §8 specifies the SHRRS model the guide describes.

### 7.1 What the module computes

For **60 synthetic companies** (`COS`, real corporate names but fabricated scores) across 9 sectors,
each company is characterised by scores drawn from the platform PRNG `sr(s)=frac(sin(s+1)×10⁴)`:

```js
riskScore     = round(sr(i*7)*70 + 20)      // 20–90
ungpScore     = round(sr(i*11)*60 + 30)     // 30–90
dueDiligence  = round(sr(i*13)*50 + 40)     // 40–90
salient       = ISSUES.filter((_,j)=>sr(i*100+j*7)>0.5).slice(0, round(sr(i*17)*5+2))
incidents     = round(sr(i*19)*15)
grievances    = round(sr(i*23)*30)
remediations  = round(grievances*(sr(i*29)*0.6+0.2))
remediationRate = grievances>0 ? round(remediations/grievances*100) : 0
```

The only *derived* (non-random) quantity of substance is `remediationRate` — the share of grievances
remediated — and the `severity` bucket, which is a threshold on `riskScore`:

```
severity = riskScore>70 ? 'Critical' : riskScore>50 ? 'High' : riskScore>30 ? 'Medium' : 'Low'
```

### 7.2 Parameterisation / scoring rubric

| Constant | Value | Provenance |
|---|---|---|
| `ISSUES` vocabulary | 15 items (Forced Labour, Child Labour, Living Wage, Freedom of Association, Discrimination, Land Rights, Indigenous Rights…) | Hand-authored; aligns to UNGP/ILO salient-issue taxonomy |
| Severity thresholds | 70 / 50 / 30 on `riskScore` | Synthetic cut-points, no external basis |
| Salient inclusion rule | `sr(i*100+j*7) > 0.5` | Coin-flip per (company, issue) — ≈50% inclusion, capped 2–7 issues |
| `riskScore` range | 20–90 | Synthetic demo value |
| `remediations` factor | `0.2 + sr()*0.6` of grievances | Synthetic 20–80% remediation |

None of the scores are anchored to a real benchmark (KnowTheChain, WBA CHRB, Sedex); the "UNGP
score" and "risk score" are independent random draws, so a company can show high UNGP compliance
and high risk simultaneously with no logical coupling.

### 7.3 Calculation walkthrough

1. `COS` is built once at module load: each company gets three headline scores, a salient-issue set,
   incident/grievance/remediation counts, secondary scores (policy, transparency, engagement) and a
   5-year `yearly` trend that perturbs `riskScore`/`ungpScore` with additional `sr()` noise plus a
   deterministic drift (`+5 − y*2` on risk, `−3 + y*2` on UNGP).
2. `filtered` applies search + sector filter + sort (spread-copied before sort).
3. `stats` aggregates portfolio KPIs: `count`, `avgRisk`, `critical` count, `avgUNGP`,
   `totalIncidents`, `avgRemediation`, `improving` count (`riskTrend==='Improving'`).
4. `sectorRisk` averages `riskScore`/`ungpScore` per sector; `issueDist` tallies how many companies
   flag each salient issue — driving the sector bar chart and salient-issue prevalence chart.
5. The salient-issue × sector heatmap counts companies per (sector, issue) cell and colours cells
   red/amber above count thresholds (>3 / >1).

### 7.4 Worked example

Company `i=4` (Nestlé, sector Consumer):

| Step | Computation | Result |
|---|---|---|
| riskScore | `round(sr(28)*70+20)` — sr(28)=frac(sin(29)×10⁴) | e.g. **≈63** |
| severity | 63 > 50 and ≤ 70 | **High** |
| ungpScore | `round(sr(44)*60+30)` | e.g. **≈71** |
| grievances | `round(sr(92)*30)` | e.g. **18** |
| remediations | `round(18*(sr(116)*0.6+0.2))` | e.g. **9** |
| remediationRate | `round(9/18*100)` | **50%** |

The exact numbers depend on the JS `Math.sin` value at each seed; the point is that all three headline
scores are independent draws — the arithmetic that matters (remediationRate) is a simple ratio.

### 7.5 Companion analytics on the page

- **Risk vs UNGP scatter** — plots `ungpScore` (x) against `riskScore` (y); because the two are
  uncorrelated random draws, the scatter is structurally a random cloud, not a genuine risk↔governance
  relationship.
- **Detail panel** — per-company radar over Policy / Transparency / Due Diligence / Engagement /
  Remediation and a 5-year risk/UNGP line.
- **Due-diligence distribution** and **grievances-vs-remediation scatter** on the DD tab.

### 7.6 Data provenance & limitations

- **All company scores are synthetic**, generated by `sr(seed)=frac(sin(seed+1)×10⁴)`. Real company
  names are used but the scores are fabricated demo values — a material caveat if a reader mistakes
  the ranking for a genuine human-rights benchmark.
- The guide's four-factor salience formula, breadth (people-at-risk) and remediability dimensions are
  **not implemented** — salience here is a random binary flag, not a P×S×B×R product.
- No supply-chain tier data, no geography risk index, no audit non-conformance ingestion despite the
  guide's data-lineage claims.

**Framework alignment:** UN Guiding Principles on Business & Human Rights (2011) — Principle 14
salience (probability × severity, with severity scaled by scope/scale/irremediability) is *named* but
not computed; ILO Core Labour Standards inform the `ISSUES` vocabulary only; EU CS3D (2024) Article 8
action-plan trigger (>70 salient score) is referenced in the guide but no threshold logic ties a
score to a CS3D obligation in code.

## 8 · Model Specification — Salient Human Rights Risk Score (SHRRS)

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Prioritise human-rights issues across a supplier/investee portfolio so scarce due-diligence resource
is directed at the most *salient* issues, per UNGP Principle 14 and the CS3D risk-based prioritisation
obligation. Coverage: Tier-1/Tier-2 suppliers or portfolio companies, by commodity × sourcing country.

### 8.2 Conceptual approach
A salience model is a **multiplicative risk-prioritisation index**, mirroring (a) the WBA Corporate
Human Rights Benchmark (CHRB) indicator-weighted scoring and (b) Verisk Maplecroft / KnowTheChain
geography × sector risk indices. Salience = likelihood × severity where severity is itself the UNGP
composite of *scale × scope × irremediability*, not just harm magnitude.

### 8.3 Mathematical specification
For company `c`, issue `k`:

```
Severity_k = (Scale_k + Scope_k + Irremediability_k) / 3            ∈ [0,1]
P(harm)_ck = σ( β0 + β1·GeoRisk_ck + β2·SectorRisk_k + β3·(1−AuditCoverage_c)
                    + β4·GrievanceRate_ck )                          logistic
SHRRS_ck   = P(harm)_ck × Severity_k × Breadth_ck                   ∈ [0,1]
Breadth_ck = log(1 + PeopleAtRisk_ck) / log(1 + MaxPeople)          normalised reach
Company salience = max_k SHRRS_ck ; Portfolio = Σ_c w_c · mean_top5_k SHRRS_ck
```

| Parameter | Meaning | Calibration source |
|---|---|---|
| `GeoRisk_ck` | Country-issue risk 0–1 | Verisk Maplecroft / ITUC Global Rights Index / US DoL child-forced-labour list |
| `SectorRisk_k` | Sector propensity for issue k | KnowTheChain sector benchmark; ILO sectoral data |
| `Scale/Scope/Irremediability` | UNGP severity dimensions 0–1 | Expert-scored rubric; OHCHR interpretive guide |
| `β0…β4` | Logistic weights | Fit to CHRB scores or incident databases (Business & Human Rights Resource Centre) |
| `PeopleAtRisk` | Headcount exposed | Supplier workforce data (Sedex) |

### 8.4 Data requirements
Supplier master (commodity, country, Tier), Sedex/SMETA audit non-conformances by issue, grievance
mechanism records, country-issue risk indices (ITUC, DoL, Maplecroft), sector benchmarks (KnowTheChain,
CHRB). Platform already holds sector taxonomies and a company master; geography risk indices are **not**
present and would need ingestion.

### 8.5 Validation & benchmarking plan
Backtest `P(harm)` against realised incidents in the BHRRC database (ROC-AUC ≥ 0.7 target). Reconcile
company salience ranking against the WBA CHRB published scores (rank correlation). Sensitivity of
portfolio salience to β weights and to geography-index vintage. Stability across quarters.

### 8.6 Limitations & model risk
Severity dimensions are inherently judgemental — irremediability especially. Geography indices lag
real-world deterioration (coups, sanctions). Grievance data under-reports in repressive contexts
(absence of grievances ≠ absence of harm) — apply a conservative floor `P(harm) ≥ P_min` in high
GeoRisk countries to avoid false comfort.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the SHRRS the guide promises, on real benchmark data (analytics ladder: rung 1 → 2)

**What.** The §7 flag is severe: all 60 companies carry **real corporate names with fabricated scores** — `riskScore`, `ungpScore` and `dueDiligence` are three independent `sr()` draws, salient issues are coin-flips (`sr(i*100+j*7)>0.5`), and the risk-vs-UNGP scatter is "structurally a random cloud". The promised `SHRRS = Σ P(harm) × Severity × Breadth × Remediability` does not exist. Evolution A builds the §8.3 specification as the module's first backend vertical: severity as the UNGP scale/scope/irremediability composite, `P(harm)` as a logistic over geography risk, sector risk, audit coverage and grievance rate, breadth as normalised people-at-risk.

**How.** (1) Ingest the public benchmark data §8.4 names: KnowTheChain and WBA CHRB scores (published CSVs), US DoL child/forced-labour goods list, ITUC Global Rights Index — replacing every per-company random draw with benchmark-anchored inputs, honest nulls for uncovered issuers. (2) Engine route `POST /human-rights-risk/shrrs` returning per-company issue-level SHRRS with the P×S×B decomposition exposed. (3) Coupling restored: UNGP maturity enters `P(harm)` via the audit-coverage term, so the scatter gains the real risk↔governance relationship. (4) Validation per §8.5: rank correlation against published CHRB ordering.

**Prerequisites.** The real-names-fake-scores combination is a reputational defect and must be purged first (either benchmark scores or anonymised issuers — never both real names and `sr()` values); benchmark ingestion path. **Acceptance:** zero `sr()` calls in scoring; a named company's displayed rank is reproducible from cited benchmark vintages.

### 9.2 Evolution B — CS3D salience copilot with strict provenance (LLM tier 1)

**What.** A copilot answering "why is this issuer's top salient issue forced labour?", "what does CS3D Article 8 require when a salient score exceeds 70?", and "how is severity composed under UNGP Principle 14?" — grounded in this Atlas page's §5/§8 methodology and, post-Evolution-A, each company's SHRRS decomposition. Before Evolution A ships, its binding duty is disclosure: any question about a specific company's score must be answered with the §7.6 caveat that scores are synthetic demo values attached to real names.

**How.** Tier 1 RAG: atlas record into `llm_corpus_chunks`; the filtered-table state (`stats`, sector filter) passes as context. Post-Evolution-A, tier 2: "recompute Nestlé's SHRRS assuming audit coverage rises to 80%" executes against the new endpoint, with the answer showing the logistic-term movement. Guardrail: the copilot never generates a company score itself — the combination of real names and LLM-generated numbers would compound the exact fabrication §7.6 warns about; the no-fabrication validator applies to company-specific numerics with zero tolerance.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for any company-specific quantitative answer. **Acceptance:** pre-Evolution-A, 100% of company-score questions carry the synthetic-data disclosure; post, every SHRRS figure matches a logged tool call and cites its benchmark vintage.