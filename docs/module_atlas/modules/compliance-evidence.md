# Compliance Evidence Manager
**Module ID:** `compliance-evidence` · **Route:** `/compliance-evidence` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Manages the collection, versioning, and audit trail of evidence artefacts required for regulatory compliance filings across CSRD, SFDR, ISSB, GRI, and FCA climate disclosures. Provides workflow tracking, completeness scoring, and deadline management for evidence submission cycles.

> **Business value:** Enables compliance and sustainability teams to maintain a defensible, audit-ready evidence repository for all active regulatory filings, reducing last-minute gaps and providing external assurers with a complete chain-of-custody record.

**How an analyst works this module:**
- Configure active disclosure frameworks and filing deadlines in the Settings panel
- Requirement Mapper tab shows all required evidence items per regulation and ESRS topic
- Upload evidence artefacts with metadata tags for source, preparer, and review status
- Quality Scoring tab assigns and reviews quality weights for each submitted item
- Deadline Tracker shows countdown timers and completeness progress per framework
- Audit Export generates timestamped evidence package for external assurance review

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ALL_REGULATIONS`, `AUTO_SCAN_KEYS`, `Badge`, `EVIDENCE_CATEGORIES`, `LS_AUDITS`, `LS_EVIDENCE`, `LS_PORTFOLIO`, `PIE_COLORS`, `SortHeader`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `EVIDENCE_CATEGORIES` | 11 | `name`, `description`, `sources`, `regulations` |
| `AUTO_SCAN_KEYS` | 20 | `category`, `desc`, `regulation` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hashStr` | `s => s.split('').reduce((a, c) => (Math.imul(31, a) + c.charCodeAt(0)) \| 0, 0);` |
| `seededRandom` | `seed => { let x = Math.sin(seed + 1) * 10000; return x - Math.floor(x); };` |
| `fmtDate` | `d => d ? new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '\u2014';` |
| `uid` | `() => 'EVI-' + Date.now() + '-' + sr(_uidSeed++).toString(36).slice(2, 6);` |
| `daysAgo` | `Math.floor(sr(h, 1) * 60);` |
| `companies` | `useMemo(() => { if (portfolioRaw.length) return portfolioRaw.map(h => { const master = GLOBAL_COMPANY_MASTER.find(m => m.ticker === h.ticker) \|\| {};` |
| `kpis` | `useMemo(() => { const cats = new Set(evidence.map(e => e.category_id));` |
| `regs` | `new Set(evidence.map(e => e.regulation));` |
| `avgDays` | `evidence.reduce((s, e) => s + (Date.now() - new Date(e.collected_at).getTime()) / 86400000, 0) / (evidence.length \|\| 1);` |
| `autoPct` | `evidence.length ? Math.round(evidence.filter(e => e.collection_type === 'auto').length / evidence.length * 100) : 0;` |
| `lastAudit` | `audits.length ? [...audits].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date : null;` |
| `avgQuality` | `evidence.length ? Math.round(evidence.reduce((s, e) => s + e.quality_score, 0) / evidence.length) : 0;` |
| `freshnessData` | `useMemo(() => { return EVIDENCE_CATEGORIES.map(cat => { const items = evidence.filter(e => e.category_id === cat.id);` |
| `qualityRadar` | `useMemo(() => { return EVIDENCE_CATEGORIES.map(cat => { const items = evidence.filter(e => e.category_id === cat.id);` |
| `completeness` | `items.length ? Math.round(items.length / 4 * 25) : 0; // 4 sources = 100%` |
| `freshness` | `items.length ? Math.round(100 - items.reduce((s, e) => s + Math.min(60, (Date.now() - new Date(e.collected_at).getTime()) / 86400000), 0) / items.length * 100 / 60) : 0;` |
| `coverage` | `items.length ? Math.round(new Set(items.map(e => e.regulation)).size / cat.regulations.length * 100) : 0;` |
| `regMatrix` | `useMemo(() => { return ALL_REGULATIONS.map(reg => { const row = { regulation: reg };` |
| `rows` | `[keys.join(','), ...data.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','))];` |
| `blob` | `new Blob([rows.join('\n')], { type:'text/csv' });` |
| `exportEvidenceCSV` | `() => exportCSV(filtered.map(e => ({` |
| `avgQ` | `items.length ? Math.round(items.reduce((s, e) => s + e.quality_score, 0) / items.length) : 0;` |
| `revPct` | `items.length ? Math.round(items.filter(e => e.reviewed).length / items.length * 100) : 0;` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ALL_REGULATIONS`, `AUTO_SCAN_KEYS`, `EVIDENCE_CATEGORIES`, `PIE_COLORS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Evidence Completeness | — | Internal tracking | Percentage of required disclosure evidence items submitted with adequate quality rating |
| Outstanding Items | — | Regulatory mapping | Number of evidence items required but not yet submitted or verified |
| Average Quality Score | — | Quality classification | Average quality weight across all submitted evidence; target >0.7 for regulator confidence |
| Deadline Proximity | — | Regulatory calendar | Days to next filing deadline for each active disclosure framework |
| Audit Trail Completeness | — | Version control system | Proportion of submitted evidence items with complete chain-of-custody documentation |
- **Regulatory requirement mapping databases** → Parse ESRS/SFDR/ISSB requirement trees, generate item checklist → **Required evidence item register per regulation**
- **Document management system** → Version-control uploads, assign quality weights, record preparer → **Evidence artefact repository with audit trail**
- **Calendar/deadline engine** → Map reporting periods to filing dates, compute days remaining → **Deadline proximity and completeness dashboard**

## 5 · Intermediate Transformation Logic
**Methodology:** Compliance Completeness Score
**Headline formula:** `Completeness = (EvidenceItems_Submitted / EvidenceItems_Required) × Quality_Weight`

Required evidence items are derived from mapping disclosure requirements to data categories per regulation. Each submitted item receives a quality weight (1.0 = primary source, 0.7 = third-party verified, 0.4 = management estimate). The completeness score feeds directly into the disclosure readiness dashboard and flags gaps for remediation.

**Standards:** ['CSRD Delegated Regulation', 'SFDR RTS', 'ISSB IFRS S1/S2']
**Reference documents:** CSRD Delegated Regulation (EU) 2023/2772; SFDR Regulatory Technical Standards (EU) 2022/1288; ISSB IFRS S1 General Requirements and IFRS S2 Climate; GRI Universal Standards 2021 â€” Reporting Principles

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code partial-mismatch flag.** The MODULE_GUIDES entry defines the scoring engine as
> `Completeness = (EvidenceItems_Submitted / EvidenceItems_Required) × Quality_Weight` with a discrete
> quality-weight ladder (1.0 primary source · 0.7 third-party verified · 0.4 management estimate). **The
> code implements neither the required-item denominator nor the 1.0/0.7/0.4 ladder.** Instead it derives
> completeness as `min(items,4)/4×25`-style ratios, quality as a mean of a seeded 60–100 `quality_score`,
> and adds freshness and regulation-coverage sub-scores the guide never mentions. This is an operational
> evidence-tracking tool (upload, version, review, export) — a defensible workflow product, but its
> "scores" are heuristics over seeded demo evidence, not the required-vs-submitted ratio the guide states.

### 7.1 What the module computes

Evidence items are generated for each of 10 categories × its listed sources, then four category-level
sub-scores drive the readiness radar:

```js
completeness = items.length ? round( items.length / 4 × 25 ) : 0          // 4 sources ⇒ 100%
freshness    = items.length ? round( 100 − mean(min(60, ageDays)) × 100/60 ) : 0
coverage     = items.length ? round( uniqueRegulations / cat.regulations.length × 100 ) : 0
avgQuality   = round( mean(quality_score) )                                // over all evidence
autoPct      = round( |collection_type=='auto'| / |items| × 100 )
avgDays      = mean( (now − collected_at)/86400000 )                       // staleness KPI
```

Portfolio KPIs: unique categories covered, average freshness (days), % auto-collected, average quality,
and last-audit date. There is **no** required-item register — the denominator `4` (sources per category)
and `cat.regulations.length` (regulations per category) are the only "targets".

### 7.2 Parameterisation / scoring rubric

| Quantity | Formula | Provenance |
|---|---|---|
| `quality_score` | `round(60 + sr(h,4)·40)` → 60–100 | Synthetic seeded PRNG (hash of `cat.id+src`) |
| `collection_type` | `sr(h,3)>0.4 ? auto : manual` | Synthetic seeded PRNG |
| `daysAgo` | `floor(sr(h,1)·60)` → 0–60 | Synthetic seeded PRNG |
| `reviewed` | `sr(h,2)>0.35` | Synthetic seeded PRNG |
| completeness divisor | `4` sources = 100% | Hard-coded heuristic |
| freshness cap | 60 days = fully stale | Hard-coded heuristic |
| Quality ladder (guide) | 1.0 / 0.7 / 0.4 | **Not implemented** |

Ten `EVIDENCE_CATEGORIES` (EV01–EV10) map to ~20 regulations (SFDR Art 8/9, TCFD, ISSB S2, CSRD ESRS 2,
PCAF, CSDDD, TNFD, UK Stewardship Code, PRA SS 1-13, Basel III, MiFID II…). `AUTO_SCAN_KEYS` (19 entries)
tie each category to a platform `localStorage` key so real evidence can auto-populate if present.

### 7.3 Calculation walkthrough

1. On mount, `generateEvidence()` builds one item per `(category, source)` pair — a deterministic hash
   `hashStr(cat.id+src)` seeds age, review status, collection type, and quality. Results persist to
   `localStorage` (`ra_compliance_evidence_v1`).
2. If real platform artefacts exist under `AUTO_SCAN_KEYS`, they are merged as auto-collected evidence.
3. `freshnessData` / `qualityRadar` recompute the four sub-scores per category for the readiness radar.
4. `regMatrix` cross-tabulates regulations × categories to show coverage gaps; audits come from a fixed
   5-row `generateAudits()` list.

### 7.4 Worked example

Category **EV03 (Climate Risk)** has 4 sources → 4 evidence items. `completeness = round(4/4×25) = 25`…
wait — the divisor logic caps at 4 sources = 100%, so with all 4 present `round(4/4×25)=25`? The formula
`items.length/4×25` yields 100 only when `items.length = 16`; with 4 items it returns **25**. This is a
latent scaling bug: the intended "4 sources = 100%" comment does not match `×25` (which needs 16 items for
100%). Freshness for the same category, if items average 20 days old:
`round(100 − 20×100/60) = round(100 − 33.3) = 67`. Coverage: EV03 lists 3 regulations; if evidence exists
for all 3, `round(3/3×100)=100%`. Quality: if the 4 items score 88/72/95/80, `avgQuality = round(83.75)=84`.

### 7.5 Companion analytics on the page

Dashboard (KPIs, category freshness radar, quality radar), Evidence register (sortable/filterable table
with per-item review workflow), Regulation matrix (coverage heatmap), Audit tracker (5 fixed audits with
findings/resolved/status), and CSV export of the filtered evidence. Reviewer names and comments are seeded
from fixed pick-lists. No backend engine or route (`engines: []`, `route_files: []`) — all client-side.

### 7.6 Data provenance & limitations

- **Seed evidence and audits are synthetic**, from the local PRNG `sr(seed)=frac(sin(seed+1)×10⁴)` keyed
  by `hashStr`. Real evidence only appears if the referenced `localStorage` keys are populated by other
  modules — i.e. the tool is a shell that *can* aggregate real artefacts but ships with demo data.
- The **completeness `×25` scaling contradicts its own "4 sources = 100%" comment** (see §7.4) — a
  quantifiable defect.
- The guide's required-vs-submitted ratio and 1.0/0.7/0.4 quality ladder are **absent**; quality is a
  seeded 60–100 mean, not a source-tier weight.

**Framework alignment:** The categories map to real disclosure regimes — *CSRD/ESRS* (Delegated Reg. (EU)
2023/2772, ESRS 2 general + topical standards), *SFDR RTS* (EU 2022/1288 Art 8/9 + PAI), *ISSB IFRS
S1/S2*, *GRI Universal Standards 2021*, *TCFD*, *TNFD*, *PCAF* data-quality scores (DQS 1–5), *CSDDD* and
*UNGP* for human-rights DD, and *PRA SS 1-13 / ECB TRIM* for model-validation evidence. The tool tracks
*evidence for* these frameworks; it does not itself compute any framework's disclosure metric.

---

## 8 · Model Specification — Disclosure Evidence Completeness Score

**Status: specification — not yet implemented in code.**

### 8.1 Purpose & scope
Give compliance teams a defensible, auditable readiness score per regulatory framework: the share of
*required* disclosure data points backed by adequate-quality, in-date, chain-of-custody evidence. Coverage:
all active frameworks (CSRD/ESRS, SFDR, ISSB, GRI, FCA TCFD) and their datapoint trees.

### 8.2 Conceptual approach
Model completeness as a **weighted coverage ratio over a requirement register**, mirroring assurance-firm
readiness assessments (Big-4 CSRD gap tools) and the **PCAF data-quality-score** convention for grading
evidence tiers. Each required datapoint (e.g. an ESRS E1 mandatory disclosure requirement) is either met,
partially met, or unmet, weighted by evidence quality and freshness — the standard "controls coverage ×
control effectiveness" structure of an internal-audit readiness model.

### 8.3 Mathematical specification
```
For framework f with required datapoints D_f:
Coverage_f   = Σ_{d∈D_f}  met(d) · q(d) · fr(d) / |D_f|                    (0–100%)
q(d)  = 1.0 primary · 0.7 third-party assured · 0.4 mgmt estimate         (PCAF-style tiers)
fr(d) = max(0, 1 − age_d / staleness_limit_f)                             (freshness decay)
met(d) ∈ {0, 0.5, 1}   (unmet / partial / complete)
Readiness_f = GREEN if Coverage_f ≥ 85 · AMBER 60–85 · RED < 60
```
| Parameter | Source |
|---|---|
| Requirement register `D_f` | ESRS datapoint list (EFRAG IG3), SFDR RTS Annex, IFRS S2 Appendix |
| Quality tiers `q` | Guide ladder (1.0/0.7/0.4); align to PCAF DQS |
| Staleness limit | Reporting-cycle length (annual = 365d; interim tighter) |
| RAG bands | Assurance-readiness convention |

### 8.4 Data requirements
A machine-readable requirement register per framework (the biggest new asset), each evidence item tagged
with datapoint id, quality tier, source, preparer, and collection date. The platform already stores
evidence items with `category_id`, `regulation`, `quality_score`, `collected_at`, and `collection_type`;
the missing piece is the authoritative `D_f` register and a datapoint-level join.

### 8.5 Validation & benchmarking plan
Reconcile computed readiness against an external assurer's gap assessment on the same period (target
agreement within one RAG band on ≥90% of frameworks). Backtest whether low pre-filing coverage predicts
audit findings (`AUD-*` records). Sensitivity-test on the quality ladder and staleness limits.

### 8.6 Limitations & model risk
Completeness measures *evidence presence*, not disclosure *correctness* — a fully-evidenced datapoint can
still be wrong; pair with substantive review. Requirement registers drift as regulators issue guidance;
version the register and date-stamp scores. Conservative fallback: treat any datapoint with only DQS-4/5
(`q=0.4`) evidence as "partial" (`met=0.5`) so readiness is not overstated.

## 9 · Future Evolution

### 9.1 Evolution A — Real requirement register, real quality ladder, real storage (analytics ladder: rung 1 → 2)

**What.** §7's partial-mismatch flag: the guide's
`Completeness = Submitted/Required × Quality_Weight` with the 1.0/0.7/0.4 source-tier
ladder is not implemented — completeness uses an ad-hoc `min(items,4)/4×25` divisor
(whose ×25 scaling §7.6 flags as contradicting its own "4 sources = 100%" comment),
quality is a seeded 60–100 draw, and evidence items are PRNG-generated demo artifacts
persisted only to `localStorage`. The workflow shell is genuinely useful — the
`AUTO_SCAN_KEYS` bridge to other modules' artifacts is a good design. Evolution A
makes the scores mean what the guide says.

**How.** (1) Requirement register: derive required-evidence items per framework from
the refdata regulatory catalogs (ESRS datapoint list is already in the DB; SFDR RTS
PAI indicators and ISSB S2 requirements are curated additions) — this gives the
denominator the formula needs. (2) Quality ladder: replace the seeded score with the
guide's discrete 1.0/0.7/0.4 source-tier weights, set by the preparer per item and
adjustable at review. (3) Fix the ×25 scaling defect; completeness becomes
`Σ(submitted×weight)/required` per framework. (4) Backend vertical: an
`evidence_items` table with versioning and review events (replacing `localStorage`),
because the module's whole pitch — chain-of-custody for external assurers — is
impossible client-side. (5) Deadline scenarios: readiness projection at filing date
given current collection velocity, the module's first forward-looking view.

**Prerequisites (hard).** Purge the seeded evidence generator and seeded audits;
document storage with audit-logged access (AuditMiddleware exists). **Acceptance:** a
framework's completeness is reproducible as Σweights/required; the score drops when a
primary-source item is downgraded to management-estimate; evidence survives a browser
change.

### 9.2 Evolution B — Evidence-gap copilot for filing readiness (LLM tier 1 → 2)

**What.** A copilot answering the compliance manager's operative questions: "what's
blocking CSRD readiness?" (the register's unmet requirements, ranked by weight and
deadline), "which items would an assurer challenge?" (management-estimate-tier
evidence backing high-materiality datapoints), "map this uploaded document to
requirements" — the latter a genuine LLM strength, classifying an artifact against
the ESRS/SFDR requirement register with citations to the requirement text.

**How.** Tier 1: RAG over the requirement register and this Atlas record; answers cite
requirement IDs (e.g. ESRS E1-6) and the item records that satisfy them. Tier 2 (after
Evolution A's backend): the document-mapping suggestion becomes a gated write — the
copilot proposes `evidence_item → requirement` links with confidence, and the preparer
confirms before anything persists, keeping the chain-of-custody human-signed. The
no-fabrication rule here is about status: the copilot must never claim an item is
verified when its stored tier says otherwise.

**Prerequisites (hard).** Evolution A's register and persistence (there is nothing
real to be a copilot over today — the shell ships with demo data); framework
requirement texts embedded (roadmap D3). **Acceptance:** gap lists exactly match the
register's unmet set; document-mapping suggestions carry requirement citations and
require confirmation; the copilot refuses readiness judgments for frameworks not
configured in the register.