# Indigenous Rights & FPIC
**Module ID:** `indigenous-rights-fpic` · **Route:** `/indigenous-rights-fpic` · **Tier:** B (frontend-computed) · **EP code:** EP-CO4 · **Sprint:** CO

## 1 · Overview
20 projects in indigenous territories with consent tracking, rights framework compliance, and cultural heritage impact.

**How an analyst works this module:**
- FPIC Dashboard shows consent status per project
- Cultural Heritage Impact assesses sacred site risks

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `FPIC_COLORS`, `FPIC_DIST`, `PROJECTS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `PROJECTS` | 21 | `name`, `country`, `community`, `fpic`, `undrip`, `ilo169`, `ifcPs7`, `sacredSites`, `tkImpact`, `revPct`, `empGuarantee`, `infraCommit`, `grievances`, `resolved` |
| `FPIC_DIST` | 6 | `value` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `FPIC_COLORS`, `FPIC_DIST`, `PROJECTS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Projects | — | Portfolio | In or near indigenous territories |
| FPIC Compliance | — | Assessment | Projects with adequate FPIC process |

## 5 · Intermediate Transformation Logic
**Methodology:** FPIC compliance scoring
**Headline formula:** `FPICScore = ConsentStatus(30) + ProcessQuality(25) + BenefitSharing(25) + GrievanceMech(20)`

Consent status: obtained, pending, withheld, not sought. Rights frameworks: UNDRIP, ILO Convention 169, IFC PS7. Cultural heritage impact on sacred sites and traditional knowledge.

**Standards:** ['UNDRIP', 'ILO C169', 'IFC PS7']
**Reference documents:** UNDRIP; ILO Convention 169; IFC Performance Standard 7

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

An **Indigenous Rights & FPIC tracker** covering 20 named real-world projects in indigenous
territories, scored on Free-Prior-Informed-Consent status and three rights frameworks (UNDRIP, ILO 169,
IFC PS7), with cultural-heritage, benefit-sharing and grievance data. The dataset is **hand-authored
from real projects** (Standing Rock/Dakota Access, Adani/Wangan-Jagalingou, Sami wind, Belo Monte…) —
no PRNG. The guide (EP-CO4) names a weighted FPIC compliance score which the code stores per-project as
component fields but does **not** compute as a single formula; documented below.

> ⚠️ **Guide↔code note.** The guide's `FPICScore = ConsentStatus(30) + ProcessQuality(25) +
> BenefitSharing(25) + GrievanceMech(20)` weighted composite is **not implemented as a formula**. The
> `PROJECTS` table carries the raw components (a `fpic` status string, UNDRIP/ILO169/IFC-PS7 sub-scores,
> benefit-sharing `revPct`, grievance counts) but there is no line that combines them into the 0–100
> weighted score. Views filter/aggregate the raw fields instead.

### 7.1 What the module computes

The module is primarily a **filtered dataset with aggregations**. The only derived quantities are
distributions and simple ratios:

```js
filtered   = fpicFilter==='All' ? PROJECTS : PROJECTS.filter(p=>p.fpic===fpicFilter)
FPIC_DIST  = counts by consent status  (Obtained 5, Pending 3, Contested 3, Withheld 3, Not Sought 4, Partial 2)
grievance resolution = resolved / grievances   (per project)
```

Rights-framework compliance is displayed directly from the three per-project sub-scores; cultural-
heritage risk from `sacredSites` count and `tkImpact` band.

### 7.2 Parameterisation — the PROJECTS table (real cases)

| Field | Meaning | Provenance |
|---|---|---|
| `fpic` | Consent status: Obtained / Pending / Contested / Withheld / Not Sought / Partial | Hand-coded per real case |
| `undrip`, `ilo169`, `ifcPs7` | 0–100 compliance sub-scores | Curated judgement against the three frameworks |
| `sacredSites` | count of affected sacred sites | Curated |
| `tkImpact` | Traditional-knowledge impact: Low…Critical | Curated |
| `revPct` | community revenue-share % | Curated benefit-sharing |
| `grievances` / `resolved` | grievance counts | Curated |

Representative rows: Māori Geothermal (NZ) — Obtained, UNDRIP 95, revPct 8.0, 1 grievance resolved;
Salween Dam (Myanmar) — Not Sought, UNDRIP 10, 12 sacred sites, 55 grievances, 0 resolved. The
correlation between consent status and compliance scores (obtained→high, not-sought→low) is
deliberately consistent — a curated dataset, not random.

### 7.3 Calculation walkthrough

`FPIC_DIST` tallies consent status for the donut chart. The dashboard KPIs count Obtained vs
Withheld/Not-Sought projects, average the three framework scores, and sum grievances/resolutions.
Rights-framework and cultural-heritage tabs read the sub-scores directly. There is no scoring engine —
the analytics are aggregations over the curated table.

### 7.4 Worked example (Pilbara Iron Ore Expansion)

| Field | Value | Guide-formula reconstruction (not in code) |
|---|---|---|
| fpic | Contested | ConsentStatus ≈ partial credit |
| UNDRIP / ILO169 / IFC-PS7 | 45 / 38 / 42 | avg ProcessQuality ≈ 42 |
| revPct | 2.0% | BenefitSharing low |
| grievances / resolved | 15 / 6 | GrievanceMech = 40% resolution |

Applying the guide's weights *as documentation* (not code): ConsentStatus≈15/30 + ProcessQuality
(42/100·25≈10.5) + BenefitSharing (low ≈8/25) + GrievanceMech (0.40·20=8) ≈ **41.5/100** — a
below-threshold FPIC score consistent with the "Contested" label. The code shows the components; it
does not run this sum.

### 7.5 Data provenance & limitations

- **Data is curated from real projects** — a genuine strength; **no `sr()` PRNG** anywhere. The specific
  0–100 sub-scores are the author's judgement, not sourced to a published benchmark (e.g. a
  case-by-case FPIC audit).
- The guide's **weighted FPIC score is not computed** — a reader wanting a single comparable score must
  combine the components manually.
- No temporal tracking (consent can be withdrawn); no linkage of grievance severity to financial risk.

**Framework alignment:** **UNDRIP** (Arts. 10, 19, 32 — FPIC as consent, not mere consultation) ·
**ILO Convention 169** (consultation + participation of indigenous peoples) · **IFC Performance
Standard 7** (which requires FPIC for projects with adverse impacts on indigenous lands, cultural
heritage or relocation). The module scores each project against all three and tracks consent status,
sacred-site and grievance data — the raw material for a FPIC compliance rating, which a production
version would formalise into the guide's weighted score with documented sub-criteria.

## 9 · Future Evolution

### 9.1 Evolution A — Compute the weighted FPIC score, with consent as a time series (analytics ladder: rung 1 → 2)

**What.** The dataset is a genuine strength — 20 curated real cases (Standing Rock, Belo Monte, Māori Geothermal, Salween Dam) with internally consistent consent statuses, framework sub-scores and grievance data, no PRNG anywhere. The §7 flag identifies the gap: the guide's `FPICScore = ConsentStatus(30) + ProcessQuality(25) + BenefitSharing(25) + GrievanceMech(20)` exists only as raw components — §7.4 had to reconstruct the Pilbara score (≈41.5/100) by hand. §7.5 adds two structural gaps: no temporal tracking (consent can be withdrawn) and no linkage of grievances to financial risk. Evolution A implements the composite with documented sub-criteria maps (consent status → 0–30 points; ProcessQuality = mean of the three framework sub-scores × 0.25; BenefitSharing banded on `revPct`; GrievanceMech = resolution rate × 20) and converts `fpic` from a status string to an event history.

**How.** (1) A scoring function (frontend or a thin backend route) computing FPICScore per project, with the §7.4 hand-reconstruction (Pilbara ≈41.5) as the first regression case. (2) A `consent_events` structure (project × date × status × source) so the dashboard shows trajectory — Contested→Withheld transitions are the risk signal investors need. (3) A financial-risk overlay linking unresolved-grievance count and sacred-site exposure to a delay/停work probability band, sourced from published project-delay studies (the Credit Suisse/First Peoples analyses of DAPL cost overruns are citable anchors). (4) Sub-score provenance notes per case, addressing §7.5's point that the 0–100 values are author judgement.

**Prerequisites.** Sub-criteria rubric documented before coding (weights come from the guide; band boundaries need explicit choices); event-history backfill for the 20 cases from public reporting. **Acceptance:** every project displays a computed 0–100 score decomposing into the four weighted components; Pilbara reproduces ≈41.5; a consent-status change re-scores the project with a dated audit entry.

### 9.2 Evolution B — FPIC framework copilot for project screeners (LLM tier 1)

**What.** A copilot answering the questions ESG analysts actually bring to this page: "does IFC PS7 require consent or just consultation for this project type?", "why does Salween score UNDRIP 10?", "what would move Pilbara from Contested to Obtained?", "which portfolio projects trigger PS7's FPIC circumstances (adverse impacts on lands, cultural heritage, relocation)?" The module's curated case narratives plus the three-framework alignment section (§7.6's UNDRIP Arts. 10/19/32 vs ILO 169 consultation vs IFC PS7 triggers) are strong tier-1 grounding — this is framework-interpretation Q&A over curated facts.

**How.** Tier 1 RAG: atlas record and the `PROJECTS` table into `llm_corpus_chunks`; the FPIC filter state passes as context. Hard rules: framework distinctions must be quoted from the curated alignment text (the consent-vs-consultation distinction between UNDRIP and ILO 169 is legally load-bearing and commonly garbled); case facts only from the table rows — the copilot must not embellish real, politically sensitive disputes with recalled details; and any score discussion post-Evolution-A cites the computed decomposition. Questions about projects outside the 20-case universe get a scope refusal with a pointer to the human-rights-dd module for country-level screening.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A for score-based answers. **Acceptance:** framework answers match the curated alignment text; zero case facts beyond the table; sensitive-case answers stay within documented fields.