# ISSB Disclosure Engine
**Module ID:** `issb-disclosure` · **Route:** `/issb-disclosure` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
End-to-end preparation engine for IFRS S1 general sustainability disclosure and IFRS S2 climate-related disclosure requirements, covering governance, strategy, risk management, and metrics and targets pillars. Automates gap analysis against disclosure requirements, generates tagged XBRL output, and tracks filing readiness across reporting periods. Incorporates TCFD-aligned scenario analysis templates and cross-referencing to ESRS and SEC climate rules.

> **Business value:** Enables listed companies and large entities to achieve compliant, consistent IFRS S2 disclosure aligned with ISSB requirements, reducing regulatory risk and meeting investor expectations for comparable climate-related financial information.

**How an analyst works this module:**
- Complete the entity profile to determine applicable IFRS S1/S2 requirements and available transition reliefs
- Work through each pillar (Governance, Strategy, Risk Management, Metrics & Targets) using the guided disclosure templates
- Run automated gap analysis to identify missing or incomplete requirement responses
- Review XBRL tagging output and resolve cross-document value conflicts flagged by the validator
- Export final IFRS S2 disclosure package with XBRL instance document and assurance-ready evidence trail

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ACCENT`, `ADOPTION`, `CONNECTIVITY`, `GAP_ITEMS`, `KPI`, `PAGE_SIZE`, `PIECLRS`, `S1_PILLARS`, `S2_REQUIREMENTS`, `SASB_INDUSTRIES`, `SCENARIO_SET`, `SectionHead`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `S1_PILLARS` | 36 | `pillar`, `para`, `score`, `color`, `reqs`, `code`, `label`, `status`, `source`, `quality` |
| `S2_REQUIREMENTS` | 13 | `id`, `title`, `para`, `tcfd`, `status`, `score`, `module`, `disclosure`, `subItems` |
| `SCENARIO_SET` | 21 | `id`, `name`, `temp`, `source`, `type`, `carbonPrice2030`, `carbonPrice2050`, `gdpImpact`, `physicalDamage`, `transitionCost`, `desc`, `impacts`, `sector`, `revenue`, `cost`, `capex` |
| `ADOPTION` | 16 | `jurisdiction`, `status`, `effective`, `standard`, `scope` |
| `CONNECTIVITY` | 13 | `issb`, `csrd`, `sfdr`, `tcfd`, `cdp`, `alignment` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `fmt` | `v=>typeof v==='number'?v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':v.toFixed?v.toFixed(1):v:v;` |
| `csvExport` | `(rows,name)=>{if(!rows.length)return;const h=Object.keys(rows[0]);const csv=[h.join(','),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??'')).join(','))].join('\n');const b=new Blob([csv],{type:'text/csv'});const u=URL.crea` |
| `allReqs` | `[...S1_PILLARS.flatMap(p=>p.reqs.map(r=>({...r,pillar:p.pillar,standard:'IFRS S1'}))),...S2_REQUIREMENTS.map(r=>({code:`S2-${r.id}`,label:r.title,status:r.status,quality:r.score,para:r.para,pillar:'Climate',standard:'IFR` |
| `totalReqs` | `S1_PILLARS.reduce((s,p)=>s+p.reqs.length,0);` |
| `complete` | `S1_PILLARS.reduce((s,p)=>s+p.reqs.filter(r=>r.status==='Complete').length,0);` |
| `radarData` | `S1_PILLARS.map(p=>({pillar:p.pillar,score:p.score}));` |
| `avgScore` | `Math.round(S2_REQUIREMENTS.reduce((s,r)=>s+r.score,0)/ Math.max(1, S2_REQUIREMENTS.length));` |
| `cpData` | `SCENARIO_SET.map(s=>({name:s.name,cp2030:s.carbonPrice2030,cp2050:s.carbonPrice2050}));` |
| `sasbSectors` | `['All',...new Set(SASB_INDUSTRIES.map(i=>i.sector))];` |
| `avgQuality` | `Math.round(GAP_ITEMS.reduce((s,g)=>s+g.quality,0)/ Math.max(1, GAP_ITEMS.length));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ADOPTION`, `CONNECTIVITY`, `PIECLRS`, `S1_PILLARS`, `S2_REQUIREMENTS`, `SCENARIO_SET`, `TABS`
**Shared context buses:** `CarbonCreditContext`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| IFRS S2 Requirements Coverage (%) | — | ISSB IFRS S2 checklist | Proportion of S2 paragraphs addressed in current draft disclosure |
| Cross-reference Conflicts | — | Automated XBRL tag validator | Number of tagged data points with value inconsistencies across disclosure sections |
| Scenario Analysis Completeness | — | IFRS S2 para 22–44 | Whether strategy disclosure addresses both transition and physical scenarios under S2(b) |
| Transition Plan Disclosure | — | IFRS S2 requirements | Whether transition plan is disclosed under Strategy pillar paragraph 14(b), not 14(c) |
- **Prior year sustainability / TCFD report** → Extract existing disclosures; map to S1/S2 requirement paragraphs; score completeness → **Pillar-level gap analysis with priority ranking**
- **Climate scenario model outputs** → Structure under S2 Strategy paras 22–44; ensure 1.5°C and physical scenario coverage → **Narrative and quantitative scenario disclosure per S2 requirements**
- **Financial statements and audit trail** → Cross-reference climate-related financial impacts to P&L/balance sheet notes; validate consistency → **Auditable evidence package for external assurance provider**

## 5 · Intermediate Transformation Logic
**Methodology:** Disclosure Completeness Index
**Headline formula:** `DCI = Completed Requirements / Total Applicable Requirements × 100`

Applicable requirements are determined by entity size, listing jurisdiction, and transition relief elections. Each requirement is scored as complete, partial, or not addressed. The DCI is computed per pillar and in aggregate, with weighting applied to material requirements identified through double materiality assessment.

**Standards:** ['IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information', 'IFRS S2 Climate-related Disclosures', 'TCFD Recommendations 2017', 'ISSB Transition Relief Provisions 2023']
**Reference documents:** IFRS S1 General Requirements for Disclosure of Sustainability-related Financial Information 2023; IFRS S2 Climate-related Disclosures 2023; ISSB Transition Relief and Effective Date Guidance 2023; TCFD Final Recommendations Report 2017; IFRS Foundation XBRL Taxonomy for S1/S2 2023

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

The guide's Disclosure Completeness Index (`DCI = Completed / Total Applicable × 100`) is genuinely
implemented, and the underlying content — IFRS S1/S2 paragraph references, TCFD cross-mapping, SASB
sector metrics — is accurate, detailed, static reference data for **one illustrative reporting
entity**, not a live disclosure-authoring engine wired to a real company's data.

### 7.1 What the module computes

`S1_PILLARS` (4 pillars: Governance/Strategy/Risk Management/Metrics & Targets, 36 total
requirements) and `S2_REQUIREMENTS` (13 climate-specific requirements) each carry a hard-coded
`status` (`Complete`/`In Progress`/`Not Started`) and a 0–100 `quality`/`score` for a single
fictional demonstration company. The completeness index:

```js
totalReqs = Σ_pillar S1_PILLARS[pillar].reqs.length              // = 36
complete  = Σ_pillar count(reqs.status === 'Complete')
DCI_S1    = complete / totalReqs × 100
avgScore  (S2) = round( Σ S2_REQUIREMENTS.score / count )        // simple mean of 13 scores
avgQuality (gap analysis) = round( Σ GAP_ITEMS.quality / count )
```

`radarData` plots each S1 pillar's own hand-set `score` (not derived from its requirement-level
statuses — e.g. Governance pillar carries `score:78` as a standalone field, independent of the
arithmetic mean of its 7 requirement `quality` values).

### 7.2 Parameterisation — pillar/requirement scoring (static demo values)

| Pillar | Para ref | Score | # Requirements | Provenance |
|---|---|---|---|---|
| Governance | IFRS S1 §26–27 | 78 | 7 | Hand-set per requirement, correctly paragraph-cited |
| Strategy | IFRS S1 §28–35 | 62 | 8 | Includes S1-STR-e (scenario analysis, §35) marked "Not Started" |
| Risk Management | IFRS S1 §36–42 | 71 | 6 | — |
| Metrics & Targets | IFRS S1 §43–53 | 54 | 10 | Weakest pillar — 5 of 10 items "Not Started" |
| S2 avg (12 items) | IFRS S2 §5–37 | ~52 (computed) | 12 | Each item cites its real IFRS S2 paragraph and TCFD sub-recommendation |

Every `code`/`para`/`tcfd` field (e.g. `S2-3 / IFRS S2 §14 / TCFD Strategy(b)`) is checked against the
real ISSB standard structure and is accurate — this is a correctly-researched compliance checklist,
not fabricated citation.

### 7.3 Calculation walkthrough

1. `allReqs` flattens S1 pillar requirements + S2 requirements (prefixed `S2-{id}`) into one list
   for the gap-analysis tab.
2. `SCENARIO_SET` (21 rows: NGFS-named scenarios × sector impact deltas) drives the Scenario Analysis
   tab; `cpData` extracts `carbonPrice2030`/`carbonPrice2050` per scenario for the chart.
3. `ADOPTION` (16 jurisdictions) and `CONNECTIVITY` (13 rows mapping ISSB↔CSRD↔SFDR↔TCFD↔CDP
   alignment) are static reference tables, not computed.
4. `sasbSectors` derives a dropdown from `SASB_INDUSTRIES` (real SASB sector taxonomy) for the
   Industry Metrics tab.
5. CSV export (`csvExport`) serialises any of the above tables to file — no server round-trip; this
   module has no backend engine (`engines: []`, `route_files: []` in the atlas record).

### 7.4 Worked example

Metrics & Targets pillar: 10 requirements, of which `S1-MT-a/b/g/j` are "In Progress" and the other 6
are "Not Started" (0 "Complete"):

```
complete_MT = 0 / 10 → 0% pillar completeness by strict Complete-only count
```

Yet the pillar's displayed headline `score: 54` is a separately hand-set value (not `0`), because the
radar/KPI score field is independent of the strict completeness count — a reader comparing the
"Metrics & Targets: 54/100" KPI against "0 of 10 Complete" in the requirement table would see an
apparent inconsistency; the 54 reflects partial-credit quality scoring (`quality` values on
in-progress items average well above zero) rather than the binary completeness metric the guide's
DCI formula implies.

### 7.5 Data provenance & limitations

- **Single fictional entity.** All statuses/scores represent one demonstration company's disclosure
  maturity; there is no per-user entity profile, no persistence of a real company's actual disclosure
  progress, and no XBRL tagging/validator (despite the guide's claim of "automated XBRL tag
  validator" and "cross-reference conflict" detection — neither exists in code).
- Pillar-level `score` and requirement-level `quality`/`status` are two independent hand-set data
  points, not algebraically linked — see §7.4.
- No backend engine or database persistence — this is a purely static, illustrative reference/gap-
  analysis tool, not a stateful disclosure-drafting workflow.

**Framework alignment:** IFRS S1 (General Requirements, correctly paragraph-cited governance/strategy/
risk-management/metrics structure) · IFRS S2 (climate disclosure, correctly cross-mapped to TCFD's
four pillars) · TCFD Recommendations (2017) · SASB industry-specific metrics (sector taxonomy
referenced) · NGFS scenario naming conventions used for the scenario-analysis tab's illustrative
carbon-price and GDP-impact figures.

## 9 · Future Evolution

### 9.1 Evolution A — Per-entity disclosure state with a derived, consistent DCI (analytics ladder: rung 1 → 2)

**What.** The module's content is its strength — correctly paragraph-cited IFRS S1 (36 requirements, 4 pillars) and S2 (13 requirements) checklists, a real TCFD cross-map, SASB taxonomy, 16-jurisdiction adoption tracker — but §7.5 is clear about the limits: all statuses/scores describe **one fictional demonstration company**, there is no persistence or entity profile, the promised XBRL tag validator doesn't exist, and §7.4 documents an internal inconsistency (Metrics & Targets shows a hand-set pillar score of 54 while its own table shows 0 of 10 requirements Complete — the two fields are not algebraically linked). Evolution A makes it a real workbench: per-entity requirement status stored in DB, the DCI and pillar scores *derived* from requirement-level statuses (killing the 54-vs-0% contradiction by construction), and applicability logic (entity size, jurisdiction, transition reliefs) filtering the requirement set as §5 describes.

**How.** (1) Tables `issb_entities`, `issb_requirement_status` (entity × requirement × period × status × quality × evidence link); routes for status upsert and gap analysis. (2) Pillar score defined as the quality-weighted mean of its requirements — one formula, documented; the radar reads it. (3) Wire to the existing `backend/services/issb_s2_engine.py` (identified in the sibling issb-materiality spec as already implementing honest evidence-based pillar scoring) instead of duplicating scoring client-side. (4) XBRL export deferred honestly: remove the validator claim from the guide until built, or scope a minimal tag-consistency check over the stored numeric disclosures.

**Prerequisites.** Entity/period data model; reconciliation of frontend checklist paragraphs with the engine's ~55-item catalogue. **Acceptance:** pillar scores recompute when a requirement status changes; the §7.4 inconsistency is impossible; two entities maintain independent disclosure states across sessions.

### 9.2 Evolution B — Guided disclosure-drafting copilot per S1/S2 pillar (LLM tier 2)

**What.** Disclosure preparation is the platform's most document-centric workflow, and this module's paragraph-cited checklist is the ideal scaffold: "draft the Strategy pillar's scenario-analysis disclosure (S2 §22) from our stress-test results", "what does S2 §14(b) require for transition plans and what evidence do we have?", "which of our gaps block filing in jurisdiction X?" (the `ADOPTION` table carries effective dates per jurisdiction). Drafting pulls quantitative content from other modules' computed results — the `CONNECTIVITY` cross-walk (ISSB↔CSRD↔SFDR↔TCFD↔CDP) tells the copilot which platform data satisfies which requirement.

**How.** Tier 2: tool schemas over the Evolution A status/gap routes plus read-access to source modules (emissions, scenario analysis) via the cross-walk mapping; the existing `llm-esg-extractor` module handles prior-report ingestion to pre-populate statuses. Drafting discipline: every paragraph of generated disclosure text cites its requirement code and the platform data it used; requirements with no evidence produce a gap note, never boilerplate — the engine's own fail-safe ("never a fabricated value") extends to narrative; jurisdiction/effective-date claims quote the curated `ADOPTION` rows. Draft text is proposal-only, versioned for review — board-approved disclosure language is a human decision.

**Prerequisites (hard).** Evolution A's persistence and engine wiring; extractor pipeline. **Acceptance:** generated sections map 1:1 to requirement codes; evidence-less requirements yield explicit gap statements; every numeric in draft text traces to a named module's tool response.