# Human Rights Due Diligence
**Module ID:** `human-rights-dd` · **Route:** `/human-rights-dd` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
UN Guiding Principles on Business and Human Rights (UNGP) and EU CSDDD compliance. Covers salient rights identification, impact assessment, grievance mechanism review, and remediation tracking.

> **Business value:** The EU CSDDD creates mandatory HRDD obligations for large EU companies — civil liability for harm, penalties up to 5% of global turnover. This module provides the systematic process required to identify, prevent, and remediate adverse human rights and environmental impacts across the value chain.

**How an analyst works this module:**
- Salient Rights Identification maps operations to potential rights impacts
- Severity Assessment scores scale, scope, irremediability per right
- Value Chain Mapping shows supply chain human rights hotspots
- Grievance Mechanism Review scores accessibility and legitimacy
- Remediation Tracker monitors corrective actions and timelines

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BAR_COLORS`, `Badge`, `Btn`, `COUNTRY_NAMES`, `CSDDD_HR_ARTICLES`, `HEATMAP_COUNTRIES`, `HR_SALIENT_ISSUES`, `HumanRightsDDPage`, `KpiCard`, `MODERN_SLAVERY_REQS`, `REG_TIMELINE`, `SECTOR_RISK_PROFILES`, `Section`, `TOTAL_DD_WEIGHT`, `UNGP_DD_CHECKLIST`, `UNGP_PILLARS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `UNGP_PILLARS` | 4 | `name`, `description`, `relevance` |
| `HR_SALIENT_ISSUES` | 9 | `issue`, `severity`, `sectors`, `indicators`, `country_risk_factor`, `IN`, `CN`, `BD`, `VN`, `TH`, `BR`, `ZA`, `US`, `GB`, `DE` |
| `UNGP_DD_CHECKLIST` | 16 | `category`, `item`, `weight` |
| `MODERN_SLAVERY_REQS` | 5 | `act`, `threshold`, `requirements`, `penalty` |
| `CSDDD_HR_ARTICLES` | 7 | `title`, `obligation`, `deadline` |
| `REG_TIMELINE` | 13 | `event`, `type` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TOTAL_DD_WEIGHT` | `UNGP_DD_CHECKLIST.reduce((s, c) => s + c.weight, 0);` |
| `fmt` | `n => n == null ? '-' : typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n;` |
| `pct` | `n => n == null ? '-' : `${(n * 100).toFixed(0)}%`;` |
| `scoredHoldings` | `useMemo(() => { return portfolio.map(c => { const sector = c.gics_sector \|\| c.sector \|\| 'Financials';` |
| `weight` | `c.weight_pct \|\| c.portfolio_weight \|\| 2 + (h % 6);` |
| `baseRisk` | `((forcedLabourRisk + childLabourRisk + foaRisk + ohsRisk) / 4) * 100 * sectorMult;` |
| `hrRiskScore` | `Math.min(100, Math.max(5, Math.round(baseRisk + (h % 15) - 7)));` |
| `ungpPct` | `ungpMax > 0 ? Math.round((ungpScore / ungpMax) * 100) : Math.max(15, 85 - hrRiskScore + (h % 20));` |
| `supplyChainRisk` | `Math.min(100, Math.max(10, hrRiskScore + (h % 20) - 10));` |
| `avgHR` | `(scoredHoldings.reduce((s, h) => s + h.hrRiskScore, 0) / scoredHoldings.length).toFixed(1);` |
| `avgUNGP` | `(scoredHoldings.reduce((s, h) => s + h.ungpPct, 0) / scoredHoldings.length).toFixed(0);` |
| `forcedExposure` | `(scoredHoldings.reduce((s, h) => s + h.forcedLabourRisk * (h.weight \|\| 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight \|\| 2), 0) * 100).toFixed(1);` |
| `childExposure` | `(scoredHoldings.reduce((s, h) => s + h.childLabourRisk * (h.weight \|\| 2), 0) / scoredHoldings.reduce((s, h) => s + (h.weight \|\| 2), 0) * 100).toFixed(1);` |
| `avgSC` | `(scoredHoldings.reduce((s, h) => s + h.supplyChainRisk, 0) / scoredHoldings.length).toFixed(0);` |
| `grievancePct` | `((scoredHoldings.filter(h => h.hasGrievance).length / scoredHoldings.length) * 100).toFixed(0);` |
| `issueExposure` | `useMemo(() => HR_SALIENT_ISSUES.map(iss => {` |
| `totalWeight` | `exposed.reduce((s, h) => s + (h.weight \|\| 2), 0);` |
| `heatmapData` | `useMemo(() => HEATMAP_COUNTRIES.map(cc => {` |
| `engagementPriority` | `useMemo(() => { return scoredHoldings.map(h => ({ name: (h.company_name \|\| '').slice(0, 18), hrRisk: h.hrRiskScore, weight: h.weight \|\| 2, priority: +((h.hrRiskScore / 100) * (h.weight \|\| 2)).toFixed(2), })).sort((a, b) => b.priority - a.priority).slice(0, 15);` |
| `rows` | `sortedHoldings.map(h => [h.company_name, h.isin, h.country, h.sector, h.hrRiskScore, h.ungpPct, h.forcedLabourRisk, h.childLabourRisk, h.topIssue, h.supplyChainRisk, h.hasGrievance ? 'Yes' : 'No', h.weight]);` |
| `csv` | `[headers, ...rows].map(r => r.join(',')).join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `pctVal` | `maxW > 0 ? Math.round((earned / maxW) * 100) : 0;` |
| `maxPossible` | `totalWeight * scoredHoldings.length;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BAR_COLORS`, `CSDDD_HR_ARTICLES`, `HEATMAP_COUNTRIES`, `HR_SALIENT_ISSUES`, `MODERN_SLAVERY_REQS`, `REG_TIMELINE`, `UNGP_DD_CHECKLIST`, `UNGP_PILLARS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| CSDDD Scope | — | EU CSDDD | Phase-in from 2027 for largest companies |
| Salient Rights Assessment | — | UNGP | International human rights standards |
| Remedy Mechanisms | — | UNGP Pillar 3 | Company-level grievance mechanism for rights holders |
- **Operations mapping** → Rights at risk identification → **Salient rights register**
- **Supply chain data** → Human rights hotspot analysis → **Value chain risk profile**
- **Grievance incidents** → Remediation action → **Rights impact mitigation**

## 5 · Intermediate Transformation Logic
**Methodology:** UNGP-aligned salient rights assessment
**Headline formula:** `SalientRisk = Impact_severity × Likelihood × Vulnerability_factor`

Salient rights: those at risk of most severe adverse impact considering scale, scope, irremediability. CSDDD: mandatory for large EU companies from 2027. Covers operations, subsidiaries, and established business relationships.

**Standards:** ['UN Guiding Principles on Business and Human Rights', 'EU CSDDD (CS3D)', 'OECD Due Diligence Guidance']
**Reference documents:** UN Guiding Principles on Business and Human Rights (2011); EU Corporate Sustainability Due Diligence Directive (CSDDD/CS3D); OECD Due Diligence Guidance for Responsible Business Conduct

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ℹ️ **Guide↔code note.** The guide gives `SalientRisk = Impact_severity × Likelihood × Vulnerability`.
> The page implements a **related but different** salient-risk model: it blends four issue-level country
> risk factors (forced labour, child labour, freedom-of-association, OH&S) into a base risk, scaled by a
> sector multiplier, and scores UNGP due-diligence completeness against a weighted 15-item checklist.
> Risk factors are drawn from real, curated country×issue tables (not `sr()`), but individual holding
> variation uses a deterministic `(h % N)` jitter rather than real firm data. Substantively close to the
> guide; the exact multiplicative form differs.

### 7.1 What the module computes

**Base human-rights risk** per holding (`scoredHoldings`):
```js
baseRisk = ((forcedLabourRisk + childLabourRisk + foaRisk + ohsRisk)/4) × 100 × sectorMult
hrRiskScore = clamp(5, 100, round(baseRisk + (h%15) − 7))          // ±7 index jitter
supplyChainRisk = clamp(10, 100, hrRiskScore + (h%20) − 10)
```
where the four issue risks are the country risk factors for that holding's country from
`HR_SALIENT_ISSUES` (e.g. Bangladesh forced-labour 0.85, Germany 0.08).

**UNGP completeness** (weighted DD checklist, 15 items, total weight 104):
```js
ungpPct = ungpMax>0 ? round(ungpScore/ungpMax × 100)
                    : max(15, 85 − hrRiskScore + (h%20))            // fallback
```

**Portfolio exposures** (weight-weighted issue prevalence):
```js
forcedExposure = Σ(forcedLabourRisk × weight) / Σ weight × 100
engagementPriority = (hrRiskScore/100) × weight                     // ranked top-15
```

### 7.2 Parameterisation — real UNGP framework

**8 salient issues** (`HR_SALIENT_ISSUES`) each carry severity, exposed sectors, indicators and a
**country risk-factor table**:

| Issue | Severity | Example country factors |
|---|---|---|
| Forced Labour | Critical | BD 0.85, VN 0.75, IN 0.72, DE 0.08 |
| Child Labour | Critical | CG 0.88, NG 0.82, BD 0.78, BR 0.38 |
| Freedom of Association | High | CN 0.85, VN 0.82, SA 0.80, GB 0.12 |
| OH&S | High | BD 0.78, IN 0.65, US 0.22, DE 0.10 |

**15-item DD checklist** weighted by materiality (HR impact assessment 10, supply-chain audits 10,
board-approved policy 8, grievance mechanism 8…; total 104). **Regulatory sets**: Modern Slavery Acts
(UK £36M threshold, AU $100M, US UFLPA, Canada), CSDDD articles (7 rows, 2027 phase-in), 13-event
regulatory timeline. These country/issue/regulatory tables are curated real data, not seeded.

### 7.3 Calculation walkthrough

Holdings come from the portfolio (`GLOBAL_COMPANY_MASTER`). For each, the country determines the four
issue risk factors; the sector determines `sectorMult`; `baseRisk` blends them; a deterministic `(h%N)`
jitter adds per-holding spread. UNGP completeness scores against the weighted checklist. Portfolio KPIs:
`avgHR`, `avgUNGP`, weight-weighted `forcedExposure`/`childExposure`, grievance-mechanism %. The
country heatmap shows the 8 issues × 14 countries risk matrix; engagement-priority ranks holdings by
`risk × weight`.

### 7.4 Worked example (a Bangladesh consumer-staples holding)

Country BD issue factors: forced 0.85, child 0.78, FoA 0.75, OH&S 0.78; sector Consumer Staples
`sectorMult` ≈ 1.2; holding index h = 3 (jitter +3−7 = −4):

| Step | Computation | Result |
|---|---|---|
| mean issue risk | (0.85+0.78+0.75+0.78)/4 | 0.79 |
| baseRisk | 0.79 × 100 × 1.2 | 94.8 |
| hrRiskScore | clamp(5,100, round(94.8 − 4)) | **91** |
| supplyChainRisk | clamp(10,100, 91 + (3%20)−10) | 84 |
| engagement priority (weight 3%) | (91/100) × 3 | 2.73 |

A Bangladesh apparel holding scores 91/100 HR risk — Critical — driven by the high forced/child-labour
country factors and the consumer-staples sector multiplier, exactly the CSDDD/UFLPA hotspot the module
is designed to flag.

### 7.5 Data provenance & limitations

- **Country×issue risk factors are curated real data** (plausible ILO/Global Slavery Index-shaped
  values), not `sr()`-seeded — the substantive risk signal is defensible.
- **Per-holding variation is a deterministic `(h % N)` index jitter**, not real firm-level HR data or an
  actual salient-issue assessment — two same-country/same-sector firms differ only by portfolio index.
- The salient-risk form is an *average × sector multiplier*, not the guide's
  `severity × likelihood × vulnerability` product; severity is stored per issue but not multiplied in.
- UNGP completeness falls back to a formula (`85 − hrRiskScore + jitter`) when no assessment data exists.

### 7.6 Framework alignment

**UN Guiding Principles (2011)** — the 3-pillar structure (Protect/Respect/Remedy), salient-rights
identification, and the DD process (assess→integrate→track→remedy) are encoded in the pillars and
15-item checklist. **EU CSDDD (CS3D)** — the 7 mapped articles, 2027 phase-in and the value-chain scope
drive the regulatory tab; civil liability and up-to-5%-turnover penalties are the stakes. **OECD Due
Diligence Guidance** — the risk-based, salient-issue-first approach. **Modern Slavery Acts / UFLPA** —
jurisdiction thresholds and reporting obligations. UNGP itself defines salience by *scale, scope and
irremediability* of impact — the severity field encodes this qualitatively; a fuller model would
multiply severity × likelihood × leverage as §8 below specifies.

### 8 · Model Specification

**Status: specification — not yet implemented in code** (the page averages country factors × sector
multiplier; the guide's severity×likelihood×vulnerability salient-risk product and firm-level DD scoring
are not fully implemented).

**8.1 Purpose & scope.** Score salient human-rights risk and UNGP/CSDDD due-diligence adequacy per
holding, prioritising engagement across the portfolio.

**8.2 Conceptual approach.** UNGP salience scoring (severity × likelihood, weighted by leverage/
vulnerability) combined with a firm-level DD maturity score, mirroring the Corporate Human Rights
Benchmark (CHRB) and KnowTheChain methodologies, overlaid on country risk indices (Global Slavery
Index, ITUC Rights Index).

**8.3 Mathematical specification.**
```
SalientRisk_ij = Severity_i × Likelihood_ij × Vulnerability_j
   Severity_i  = f(scale, scope, irremediability) per issue i
   Likelihood_ij = country_risk_i(country_j) × sector_exposure_i(sector_j)
   Vulnerability_j = f(migrant-worker share, informal supply chain depth)
CompanyHRRisk_j = Σ_i w_i · SalientRisk_ij           (w_i = issue severity weight)
DD_maturity_j = Σ_k weight_k · met_k / Σ weight_k    (15-item UNGP checklist)
ResidualRisk_j = CompanyHRRisk_j × (1 − DD_maturity_j)
```

| Parameter | Source |
|---|---|
| Country risk factors | Global Slavery Index, ITUC Global Rights Index |
| Sector exposure | KnowTheChain, CHRB sector benchmarks |
| Severity weights | UNGP salience (scale/scope/irremediability) |
| DD checklist weights | UNGP Pillar 2/3 (page's 104-point set) |

**8.4 Data requirements.** Holding country/sector, actual HR policy/DD/grievance data, supply-chain
country mix, controversy feeds. The page has country/issue/sector tables and the DD checklist.

**8.5 Validation.** Reconcile company scores against CHRB benchmark ranks; back-test flags against
realised HR controversies/enforcement; sensitivity on severity weights and country indices.

**8.6 Limitations & model risk.** Firm-level DD data is scarce → fallback formulas dominate; country
indices are coarse; salience is partly qualitative. Conservative fallback: report country×issue risk
and DD-checklist completeness separately rather than a single residual score.

**Framework alignment:** UN Guiding Principles on Business and Human Rights (2011) — salience and the
Protect/Respect/Remedy pillars; EU CSDDD — mandatory value-chain DD (2027); OECD DD Guidance — risk-
based prioritisation; CHRB / KnowTheChain — the benchmarking the §8 model reconciles against; Modern
Slavery Acts / UFLPA — the disclosure and import-control obligations.

## 9 · Future Evolution

### 9.1 Evolution A — Salience-weighted residual risk with firm-level DD data (analytics ladder: rung 2 → 3)

**What.** The page's country×issue risk tables (BD forced-labour 0.85, DE 0.08…) are curated real data and the weighted 15-item UNGP checklist (104 points) is a defensible rubric — but §7.5 documents two gaps: per-holding variation is a deterministic `(h % N)` index jitter, not firm data (two same-country/same-sector firms differ only by portfolio position), and the risk form is an average × sector multiplier, not the guide's `Severity × Likelihood × Vulnerability` product. Evolution A implements the §8 spec: severity weights (scale/scope/irremediability) multiplied in per issue, firm-level DD maturity from actual assessment data, and `ResidualRisk = CompanyHRRisk × (1 − DD_maturity)`.

**How.** (1) A backend vertical with tables for firm HR assessments (checklist item × holding, sourced from user input or CHRB/KnowTheChain public benchmark scores for covered issuers) replacing the `(h%N)` jitter and the `85 − hrRiskScore` UNGP fallback. (2) Country factors upgraded from the hard-coded table to ingested Global Slavery Index / ITUC Rights Index vintages with version stamps. (3) The engagement-priority ranking becomes `ResidualRisk × weight`, so strong DD demonstrably reduces priority — the behaviour CSDDD Article 10 rewards. (4) Calibration check: score ordering reconciled against published CHRB ranks per §8.5.

**Prerequisites.** CHRB/KnowTheChain benchmark ingestion (public CSVs); an assessment-input UI or import path, since firm DD data cannot be synthesized honestly. **Acceptance:** two same-country/sector holdings with different DD records score differently for a documented reason; the jitter terms are gone.

### 9.2 Evolution B — CSDDD readiness copilot with article-level traceability (LLM tier 1 → 2)

**What.** A copilot for compliance officers working the 7 mapped CSDDD articles, 5 Modern Slavery Act regimes and the 13-event regulatory timeline this page already curates: "does our Bangladesh exposure trigger UFLPA import risk?", "which checklist gaps cost us the most UNGP points?", "what does Article 8 require by 2027?" Answers ground in the page's regulatory tables and each holding's computed scores.

**How.** Tier 1: atlas record (the §7.2 issue/country tables and §7.6 framework alignment are strong grounding corpus) into `llm_corpus_chunks`; the scored-holdings state passes as context so "our worst holding" resolves to the actual top of the engagement-priority list. Tier 2 adds tool calls to the Evolution A residual-risk endpoint for what-ifs ("if we complete supply-chain audits (+10 weight), what happens to residual risk?"). Regulatory answers must cite the specific article/act row from the page's `CSDDD_HR_ARTICLES`/`MODERN_SLAVERY_REQS` datasets — no free-recall regulation, since thresholds (UK £36M, AU $100M) are exactly the kind of figure LLMs misremember.

**Prerequisites.** Copilot infrastructure (Phase 1); tier 2 gated on Evolution A. **Acceptance:** every regulatory threshold quoted matches the page's curated rows; checklist what-ifs recompute via tool call, with the 104-point weighting arithmetic shown.