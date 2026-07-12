# CSDDD Compliance
**Module ID:** `csddd-compliance` · **Route:** `/csddd-compliance` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Assesses corporate compliance with the EU Corporate Sustainability Due Diligence Directive, covering adverse impact identification, prioritisation, prevention, and remediation across direct and indirect supply chain tiers. Tracks remediation plan completion and generates CSDDD annual report content.

> **Business value:** Enables legal and sustainability teams at large EU companies to build and maintain a CSDDD-compliant due diligence system, produce mandatory annual disclosures, and demonstrate active prevention and remediation of adverse impacts across global supply chains.

**How an analyst works this module:**
- Map supply chain tiers and configure supplier risk data sources in Setup
- Adverse Impact Identification tab generates comprehensive impact list by CSDDD Annex category
- Prioritisation Matrix ranks impacts by severity × likelihood × breadth
- Prevention & Action Plan tab tracks measures and timelines per prioritised impact
- Remediation tab records grievance cases, outcomes, and affected stakeholder feedback
- Annual Report Builder generates CSDDD-compliant disclosure content for board approval

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ARTICLES`, `Badge`, `Btn`, `CATEGORIES`, `CSDDD_PHASES`, `CSDDD_REQUIREMENTS`, `Card`, `KpiCard`, `PIE_COLORS`, `STATUS_COLORS`, `STATUS_OPTIONS`, `SUPPLY_CHAIN_TIERS`, `Section`, `TabBar`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `CSDDD_REQUIREMENTS` | 21 | `article`, `category`, `requirement`, `criticality`, `evidence_needed` |
| `CSDDD_PHASES` | 4 | `employees`, `turnover_mn`, `label` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `CATEGORIES` | `[...new Set(CSDDD_REQUIREMENTS.map(r => r.category))];` |
| `ARTICLES` | `[...new Set(CSDDD_REQUIREMENTS.map(r => r.article))];` |
| `STATUS_OPTIONS` | `['Compliant', 'Partial', 'Gap', 'N/A'];` |
| `STATUS_COLORS` | `{ Compliant: T.green, Partial: T.amber, Gap: T.red, 'N/A': T.textMut };` |
| `SUPPLY_CHAIN_TIERS` | `['Tier 1 — Direct suppliers', 'Tier 2 — Sub-suppliers', 'Tier 3 — Raw material origins'];` |
| `seed` | `(s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };` |
| `applicable` | `total - na;` |
| `compliancePct` | `applicable > 0 ? Math.round((compliant / applicable) * 100) : 0;` |
| `partialPct` | `applicable > 0 ? Math.round((partial / applicable) * 100) : 0;` |
| `categoryData` | `useMemo(() => { return CATEGORIES.map(cat => { const reqs = CSDDD_REQUIREMENTS.filter(r => r.category === cat);` |
| `phasedCompanies` | `useMemo(() => { return portfolio.map(c => { const employees = c.employees \|\| Math.round(seed(c.id?.charCodeAt?.(0) \|\| 1) * 15000 + 500);` |
| `turnover` | `c.revenue_usd_mn \|\| Math.round(seed((c.id?.charCodeAt?.(1) \|\| 2) + 10) * 3000 + 100);` |
| `hasSBTi` | `seed((c.id?.charCodeAt?.(2) \|\| 3) + 5) > 0.55;` |
| `hasNZTarget` | `seed((c.id?.charCodeAt?.(3) \|\| 4) + 7) > 0.45;` |
| `transitionScore` | `Math.round(seed((c.id?.charCodeAt?.(0) \|\| 1) + 20) * 40 + 30);` |
| `penaltyExposure` | `useMemo(() => { const gapFraction = metrics.applicable > 0 ? metrics.gaps / metrics.applicable : 0;` |
| `totalRevenue` | `phasedCompanies.reduce((s, c) => s + (c.turnover \|\| 0), 0);` |
| `maxPenalty` | `totalRevenue * 0.05;` |
| `estimatedPenalty` | `maxPenalty * gapFraction;` |
| `avgScore` | `phasedCompanies.length > 0 ? Math.round(phasedCompanies.reduce((s, c) => s + c.transitionScore, 0) / phasedCompanies.length) : 0;` |
| `peerRadar` | `useMemo(() => { return CATEGORIES.map(cat => { const reqs = CSDDD_REQUIREMENTS.filter(r => r.category === cat);` |
| `score` | `reqs.length > 0 ? Math.round((reqs.filter(r => complianceState[r.id]?.status === 'Compliant' \|\| complianceState[r.id]?.status === 'Partial').length / reqs.length) * 100) : 0;` |
| `peerAvg` | `Math.round(seed(cat.charCodeAt(0) + cat.charCodeAt(1)) * 40 + 35);` |
| `supplyChainTiers` | `useMemo(() => { return SUPPLY_CHAIN_TIERS.map((tier, i) => { const assessed = Math.round(seed(i + 100) * 60 + (i === 0 ? 30 : i === 1 ? 10 : 2));` |
| `rows` | `CSDDD_REQUIREMENTS.map(r => {` |
| `csv` | `[headers.join(','), ...rows.map(r => r.join(','))].join('\n');` |
| `blob` | `new Blob([csv], { type: 'text/csv' });` |
| `data` | `CSDDD_REQUIREMENTS.map(r => ({ ...r, ...complianceState[r.id] }));` |
| `pct` | `reqs.length > 0 ? Math.round(((comp + part * 0.5) / reqs.length) * 100) : 0;` |
| `maxP` | `(c.turnover \|\| 0) * 0.05;` |
| `estP` | `maxP * penaltyExposure.gapFraction;` |
| `delta` | `d.Portfolio - d['Sector Avg'];` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ARTICLES`, `CATEGORIES`, `CSDDD_PHASES`, `CSDDD_REQUIREMENTS`, `PIE_COLORS`, `STATUS_OPTIONS`, `SUPPLY_CHAIN_TIERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| In-Scope Companies (EU) | — | EC Impact Assessment | Companies subject to CSDDD: EU companies with >1,000 employees and €450M global turnover |
| Supply Chain Tier Coverage | — | CSDDD Art. 3 | Due diligence coverage spans direct (Tier 1) and indirect suppliers to the extent feasible |
| Adverse Impact Categories | — | CSDDD Annex | CSDDD covers environmental impacts (Annex Part II) and human rights impacts (Annex Part I) |
| Remediation Plan Completion | — | Internal tracking | Percentage of identified adverse impacts with completed or on-track remediation plans |
| Grievance Mechanism Coverage | — | CSDDD Art. 14 | Whether accessible grievance mechanisms exist for affected workers and communities |
- **Supplier registry and Tier 1–3 mapping** → Classify by geography and sector, apply ITUC/WBI risk scores → **Supplier risk profile per tier**
- **CSDDD Annex adverse impact list** → Screen operations and supply chain against each impact category → **Adverse impact identification register**
- **Remediation plan records** → Track action completion dates, evidence uploads, outcome assessments → **Remediation progress dashboard per impact**

## 5 · Intermediate Transformation Logic
**Methodology:** CSDDD Adverse Impact Prioritisation
**Headline formula:** `Priority_score = Severity × Likelihood × Breadth / RemediationCapacity`

Severity is assessed across three dimensions per UNGP: gravity (how serious), reversibility (how recoverable), breadth (how many affected). Likelihood weights supplier-country risk (ITUC Global Rights Index, WBI governance scores) with sector-specific impact probability. Prioritisation matrix ranks adverse impacts to guide resource allocation where all cannot be addressed simultaneously per CSDDD Article 8.

**Standards:** ['CSDDD Directive (EU) 2024/1760', 'UN Guiding Principles on Business and Human Rights', 'OECD Due Diligence Guidance']
**Reference documents:** EU Corporate Sustainability Due Diligence Directive (EU) 2024/1760; OECD Due Diligence Guidance for Responsible Business Conduct (2018); UN Guiding Principles on Business and Human Rights (2011); ILO Core Labour Standards

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide describes a *CSDDD Adverse Impact Prioritisation* model — `Priority = Severity × Likelihood
× Breadth / RemediationCapacity`. The code **does not implement that formula**; instead it is a
**compliance-checklist tracker**: a real 20-requirement CSDDD register (mapped to Directive (EU)
2024/1760 Articles 6–15) whose statuses the user sets, a real phasing-threshold classifier, and a
penalty-exposure estimate. Companion peer/supply-chain/company metrics are seeded. This is a genuine
regulatory-tracking tool, not a UNGP severity model — flag as partial mismatch.

### 7.1 What the module computes

The core is user-driven compliance scoring over the 20-requirement register `CSDDD_REQUIREMENTS`:

```js
applicable    = total − na
compliancePct = applicable>0 ? round(compliant/applicable · 100) : 0
partialPct    = applicable>0 ? round(partial/applicable · 100) : 0
// category radar score credits partials at half weight
score = round((comp + part·0.5) / reqs.length · 100)
```

Penalty exposure (CSDDD Art 27 caps fines at ≥5% of net worldwide turnover):
```js
gapFraction      = applicable>0 ? gaps/applicable : 0
maxPenalty       = totalRevenue · 0.05
estimatedPenalty = maxPenalty · gapFraction
```

### 7.2 Parameterisation / scoring rubric

| Element | Value | Provenance |
|---|---|---|
| Requirements register | 20 items, Art 6/7/8/9/10/11/15, P1/P2 criticality | **real** — CSDDD 2024/1760 mapping |
| Statuses | Compliant / Partial / Gap / N/A | user-set |
| Partial credit | 0.5 weight in category/peer scores | modelling choice |
| Max penalty | `revenue × 5%` | **real** — CSDDD Art 27 fine cap |
| Phasing thresholds | P1 2027 (>5000 emp & >€1.5bn); P2 2028 (>3000 & >€900m); P3 2029 (>1000 & >€450m) | **real** — CSDDD Art 2 phasing |
| Company employees/turnover (proxy) | `seed(charCode)·15000+500` / `·3000+100` | synthetic seeded (when absent) |
| SBTi / net-zero flags | `seed(...) > 0.55 / 0.45` | synthetic seeded |
| Transition score | `round(seed(...)·40+30)` → 30–70 | synthetic seeded |
| Peer average | `round(seed(cat)·40+35)` → 35–75 | synthetic seeded |
| Supply-chain tier coverage | `seed(i+100)·60 + tier bonus` | synthetic seeded |

### 7.3 Calculation walkthrough

`complianceState` (user status per requirement) → count compliant/partial/gap/na → `compliancePct`,
`partialPct`, category radar, peer radar (vs seeded sector average). `phasedCompanies` classifies each
portfolio company into Phase 1/2/3 by employees+turnover (real fields where present, else seeded
proxy). `penaltyExposure` scales the 5% fine cap by the portfolio's gap fraction. CSV export dumps
the register with statuses.

### 7.4 Worked example (penalty exposure)

Portfolio revenue `€2,000M`; 20 requirements, of which N/A=2 → applicable=18; user marks 6 as Gap:
```
gapFraction      = 6 / 18 = 0.333
maxPenalty       = 2000 · 0.05 = €100M
estimatedPenalty = 100 · 0.333 = €33.3M
compliancePct    = (say 9 compliant) → round(9/18·100) = 50%
```
The penalty scales linearly with unresolved gaps — a defensible first-order reading of Art 27's
turnover-linked cap, though real enforcement discretion is not modelled.

### 7.5 Data provenance & limitations

- **Requirements register and phasing thresholds are real** and correctly article-mapped; **statuses
  are user input**.
- Company employees/turnover default to `seed(charCode)` proxies when the portfolio lacks the fields;
  SBTi/net-zero/transition/peer/supply-chain metrics are all `seed()`-generated.
- The guide's Severity×Likelihood×Breadth prioritisation matrix is **not implemented** — no UNGP
  severity scoring, no country-risk (ITUC/WBI) weighting.

**Framework alignment:** CSDDD Directive (EU) 2024/1760 (Art 6 identification, Art 7/8 prevention/
remediation, Art 9 grievance, Art 10 monitoring, Art 11 communication, Art 15 Paris-aligned transition
plan, Art 27 5% turnover fine cap, Art 2 phasing) — all correctly referenced. UNGP / OECD DDG named in
guide but their prioritisation maths is absent.

## 8 · Model Specification

**Status: specification — not yet implemented in code.** The adverse-impact prioritisation model named
in the guide, and the company scope proxies, need real implementations.

**8.1 Purpose & scope.** Rank identified adverse human-rights/environmental impacts across supply-chain
tiers so remediation resources target the most severe first, per CSDDD Art 8, and estimate defensible
penalty exposure.

**8.2 Conceptual approach.** The **UNGP severity model** (gravity × scope × remediability) combined
with **country/sector risk-weighted likelihood** — the method underlying leading tools (e.g. RepRisk,
Sedex Radar, EcoVadis IQ). Likelihood draws on ITUC Global Rights Index and World Bank governance;
sector impact-probability follows OECD sector due-diligence guidance.

**8.3 Mathematical specification.**
```
Severity_j   = (Gravity_j + Scope_j + Remediability_j) / 3           # UNGP, each 1–5
Likelihood_j = w_country·CountryRisk_c + w_sector·SectorProb_s        # 0–1
Priority_j   = Severity_j · Likelihood_j · Breadth_j                  # rank descending
Coverage_tier = assessed_suppliers_tier / total_suppliers_tier
Penalty_exp  = min(5%·Turnover, DiscretionFactor·Σ_j unresolved Priority_j)
```

| Parameter | Source |
|---|---|
| Country risk `CountryRisk_c` | ITUC Global Rights Index, WBI governance |
| Sector probability `SectorProb_s` | OECD sector DDG, MSCI/RepRisk sector base rates |
| Gravity/scope/remediability | analyst assessment per UNGP |
| Turnover | company financials |

**8.4 Data requirements.** Supplier registry with tier + country + sector; identified impacts with
UNGP severity dimensions; ITUC/WBI indices; turnover. Vendors: RepRisk, Sedex, EcoVadis; free: ITUC,
World Bank WGI. The 20-requirement register and phasing already exist in the module.

**8.5 Validation & benchmarking.** Reconcile prioritisation ordering against expert re-ranking on a
sample; verify phasing classification against the Directive's thresholds; benchmark penalty estimates
against published enforcement precedents once available.

**8.6 Limitations & model risk.** Severity scoring is judgement-heavy; country indices lag acute
events; the 5% cap is a ceiling, not an expected fine. Fallback: present priority *tiers* (high/med/
low) rather than false-precision scores, and label penalty as a maximum-exposure indicator.

## 9 · Future Evolution

### 9.1 Evolution A — Implement the UNGP prioritisation matrix on the solid register (analytics ladder: rung 1 → 2)

**What.** The module's core is genuinely useful: a real 20-requirement CSDDD register
correctly mapped to Directive 2024/1760 Articles 6–15, user-set statuses, real Art. 2
phasing thresholds and the real Art. 27 5%-turnover fine cap. §7's partial-mismatch
flag scopes the gaps: the guide's
`Priority = Severity × Likelihood × Breadth / RemediationCapacity` matrix is absent
(no UNGP severity scoring, no ITUC/WBI country weighting), and the companion metrics
(peer averages, supply-chain tier coverage, SBTi flags, employee/turnover proxies)
are `seed()`-generated. Evolution A builds the prioritisation engine and de-seeds
the companions.

**How.** (1) Adverse-impact register: impacts entered per CSDDD Annex category with
UNGP severity sub-dimensions (gravity, reversibility, breadth) each scored on a
documented ordinal scale — the sibling `csrd-dma` module's severity×likelihood
pattern is the proven in-house template to follow. (2) Likelihood term: country risk
from published indices the guide names — ITUC Global Rights Index ratings and WGI
governance percentiles as curated refdata — weighted by supplier-country footprint.
(3) The priority score computes per the formula with `RemediationCapacity` as a
documented user assessment; the prioritisation matrix ranks the register, feeding
the existing prevention/action-plan workflow. (4) Companions: employees/turnover
from real portfolio fields only (honest nulls otherwise — delete the charCode-seeded
proxies); peer averages from actual scored register data or removed.

**Prerequisites (hard).** Seed purge on all companion metrics; ITUC/WGI table
curation; the severity rubric documented before scoring starts. **Acceptance:** a
high-gravity/irreversible/wide-breadth impact outranks a moderate one via
arithmetic; the phasing classifier and penalty math still reproduce (regression);
zero `seed()` calls feed displayed values.

### 9.2 Evolution B — Annual-report builder over the compliance register (LLM tier 1 → 2)

**What.** The overview's endpoint — "Annual Report Builder generates CSDDD-compliant
disclosure content for board approval" — is undelivered drafting work atop delivered
tracking. Evolution B writes the Article 11 communication: the due-diligence policy
description (from the register's Art. 6–10 statuses), identified and prioritised
impacts (post-Evolution A matrix output), prevention/remediation measures with their
tracked completion states, and grievance-mechanism outcomes — each statement backed
by a register entry or matrix score, with gaps disclosed as gaps rather than papered
over, since the register's whole value is defensibility under regulatory inspection.

**How.** Tier 1: RAG over the CSDDD directive text (refdata addition), this Atlas
record, and the register/matrix state as structured context; the drafter maps each
Article 11 content expectation to evidencing register items. Tier 2 (if the register
moves server-side): drafts versioned against register snapshots so the board sees
what changed year-over-year. The compliance-status honesty rule is absolute: a
"Partial" status must never read as compliant in prose.

**Prerequisites.** Evolution A's impact register (the report's core content);
directive text embedded; register persistence for versioning. **Acceptance:** every
compliance claim in a draft cites a register item with its actual status; the
prioritisation rationale quotes matrix scores; requirements marked Gap appear in the
report's improvement-plan section, not silently omitted.