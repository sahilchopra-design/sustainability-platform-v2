# ESRS Datapoint Navigator
**Module ID:** `esrs-datapoint-navigator` · **Route:** `/esrs-datapoint-navigator` · **Tier:** B (frontend-computed) · **EP code:** EP-DH1 · **Sprint:** DH

## 1 · Overview
Comprehensive navigator for all 1,144 ESRS mandatory and voluntary datapoints across E1-E5, S1-S4, and G1 topic standards, mapped to materiality assessment outcomes, data collection complexity ratings, and phased reporting requirements. Supports first-year CSRD reporters in scoping their disclosure obligations under EU Delegated Regulation 2023/2772.

> **Business value:** Used by CSRD reporting managers and external auditors to scope disclosure obligations, plan data collection programmes, and track ESRS compliance readiness.

**How an analyst works this module:**
- Run double materiality assessment to determine material topics
- Filter navigator to in-scope ESRS topics and mandatory datapoints
- Assess data collection complexity and identify gaps
- Generate phased reporting roadmap and data collection plan

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `ASSURANCE_PHASES`, `CROSSWALK_MAP`, `E1_DATAPOINTS`, `E2_DATAPOINTS`, `E3_DATAPOINTS`, `E4_DATAPOINTS`, `E5_DATAPOINTS`, `ESRS2_DATAPOINTS`, `ESRS_STANDARDS`, `G1_DATAPOINTS`, `OMNIBUS_CHANGES`, `S1_DATAPOINTS`, `STATUS_COLORS`, `STATUS_OPTIONS`, `STATUS_TEXT`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `ESRS_STANDARDS` | 12 | `name`, `category`, `datapoints`, `drs`, `mandatory`, `description` |
| `E1_DATAPOINTS` | 11 | `name`, `mandatory`, `type`, `methodology`, `metric`, `scope` |
| `E2_DATAPOINTS` | 7 | `name`, `mandatory`, `type`, `methodology`, `metric`, `scope` |
| `E3_DATAPOINTS` | 6 | `name`, `mandatory`, `type`, `methodology`, `metric`, `scope` |
| `E4_DATAPOINTS` | 7 | `name`, `mandatory`, `type`, `methodology`, `metric`, `scope` |
| `E5_DATAPOINTS` | 7 | `name`, `mandatory`, `type`, `methodology`, `metric`, `scope` |
| `S1_DATAPOINTS` | 18 | `name`, `mandatory`, `type`, `metric` |
| `G1_DATAPOINTS` | 7 | `name`, `mandatory`, `type`, `metric` |
| `ESRS2_DATAPOINTS` | 13 | `name`, `mandatory`, `type`, `metric` |
| `CROSSWALK_MAP` | 15 | `gri`, `issb`, `brsr`, `sasb` |
| `OMNIBUS_CHANGES` | 9 | `before`, `after`, `impact` |
| `ASSURANCE_PHASES` | 5 | `level`, `scope`, `standard`, `effort` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `totalDatapoints` | `useMemo(() => ESRS_STANDARDS.reduce((s,e)=>s+e.datapoints,0), []);` |
| `materialDatapoints` | `useMemo(() => ESRS_STANDARDS.filter((_,i)=>materialTopics[i]).reduce((s,e)=>s+e.datapoints,0), [materialTopics]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `ASSURANCE_PHASES`, `COLORS`, `CROSSWALK_MAP`, `E1_DATAPOINTS`, `E2_DATAPOINTS`, `E3_DATAPOINTS`, `E4_DATAPOINTS`, `E5_DATAPOINTS`, `ESRS2_DATAPOINTS`, `ESRS_STANDARDS`, `G1_DATAPOINTS`, `OMNIBUS_CHANGES`, `S1_DATAPOINTS`, `STATUS_OPTIONS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Mandatory Datapoints in Scope | `COUNT(datapoints | materiality_flag = TRUE OR always_mandatory = TRUE)` | EFRAG ESRS Set 1 Annex | Defines minimum reporting scope; typical large-cap scope is 300–600 mandatory datapoints in year one. |
| Data Collection Complexity Score | `weighted average of collection_effort across in-scope datapoints` | Internal assessment framework | Score >3.5 indicates significant new data infrastructure investment required; used to prioritise gap remediation. |
| Phase-In Coverage Rate | `phasedin_datapoints_available / phasedin_datapoints_total × 100` | ESRS 1 Annex C phase-in schedule | Tracks progress against the 3-year phase-in plan; <50% in year 2 signals collection risk. |
- **EFRAG ESRS Set 1 Annex → datapoint list** → DMA outcome → obligation filter → phase-in schedule mapping → **Scoped disclosure obligation register with collection complexity ratings**

## 5 · Intermediate Transformation Logic
**Methodology:** ESRS Datapoint Obligation Mapping
**Headline formula:** `obligation_weight = mandatory_flag × materiality_relevance × phase-in_discount`

Each of the 1,144 datapoints is classified as mandatory irrespective of materiality, mandatory if material, or voluntary. Materiality relevance links each datapoint to the IRO sub-topics assessed in the double materiality assessment. Phase-in discounts reflect the 3-year grace period for certain datapoints under Article 37 of the Delegated Regulation.

**Standards:** ['EU Delegated Regulation 2023/2772', 'ESRS 1 – General Requirements', 'ESRS 2 – General Disclosures']
**Reference documents:** EU Delegated Regulation 2023/2772 – ESRS; EFRAG ESRS Set 1 Annexes; ESRS 1 – General Requirements (Phase-in provisions Article 37)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry claims the navigator covers **"all 1,144
> ESRS mandatory and voluntary datapoints"** and computes an `obligation_weight = mandatory_flag ×
> materiality_relevance × phase-in_discount` plus a "Data Collection Complexity Score (1–5)" and a
> "Phase-In Coverage Rate". **The code contains none of these scores, and the datapoint totals do not
> reconcile to 1,144.** The `ESRS_STANDARDS.datapoints` field sums to **307**, and the module only ever
> computes two derived numbers (a total sum and a materiality-filtered sum). This is fundamentally a
> **reference catalogue / disclosure-requirement navigator**, not a scoring engine. Documented below.

### 7.1 What the module computes

The only two derived quantities in the entire module:

```js
totalDatapoints    = ESRS_STANDARDS.reduce((s,e)=>s+e.datapoints, 0)          // = 307
materialDatapoints = ESRS_STANDARDS.filter((_,i)=>materialTopics[i])
                                   .reduce((s,e)=>s+e.datapoints, 0)
```

`materialTopics[i]` is a boolean toggle array driven by the "Materiality Filter" tab — the user marks
which of the 11 topic standards are material, and `materialDatapoints` sums the datapoint counts of
just those. Everything else on the page is **static reference content**: the ESRS standards register,
per-standard disclosure-requirement (DR) tables (E1–E5, S1–S4, G1, ESRS 2), a framework crosswalk, an
Omnibus-change table, and an assurance-phase table. No PRNG-derived numbers drive any headline metric
(`sr` is imported but only used, if at all, for decorative chart jitter).

### 7.2 Parameterisation / reference tables

| Table | Rows | Content & provenance |
|---|---|---|
| `ESRS_STANDARDS` | 11 | ESRS 2 + E1–E5 + S1–S4 + G1; `datapoints` and `drs` counts per standard. **Real standard structure**, but counts are illustrative approximations (sum 307, not the official ~1,144 including sub-datapoints) |
| `E1_DATAPOINTS` | 10 | **Real** ESRS E1 disclosure requirements E1-1…E1-9 + AR, with correct methodology tags (GHG Protocol, ISO 14064, SBTi, TCFD, NGFS) |
| `E2–E5_DATAPOINTS` | 6–7 each | Real DRs with real methodology references (E-PRTR/IED, REACH/CLP, GRI 303, CDP Water, WRI Aqueduct) |
| `S1_DATAPOINTS` | 18 | Real Own-Workforce DRs |
| `G1_DATAPOINTS`, `ESRS2_DATAPOINTS` | 7 / 13 | Real Business-Conduct / General-Disclosure DRs |
| `CROSSWALK_MAP` | 15 | ESRS → GRI / ISSB / BRSR / SASB mapping (editorial crosswalk) |
| `OMNIBUS_CHANGES` | 9 | 2025 EU Omnibus simplification before/after + impact |
| `ASSURANCE_PHASES` | 5 | Limited → reasonable assurance roadmap (ISSA 5000 direction of travel) |

Note E1-7 is correctly tagged *GHG removals* and E1-8 *internal carbon pricing* (fixing the ordering
error flagged elsewhere in the platform's REM backlog for `csrd-xbrl`).

### 7.3 Calculation walkthrough

1. `ESRS_STANDARDS` renders the register; `totalDatapoints` sums the `datapoints` column (307).
2. On the Materiality Filter tab, the user toggles `materialTopics[i]` per standard.
3. `materialDatapoints` re-sums only the material standards' datapoint counts — the single dynamic KPI.
4. Detail tabs render the DR tables read-only; the crosswalk, Omnibus and assurance tabs are static.

### 7.4 Worked example

A company whose double-materiality assessment finds **E1 (Climate), S1 (Own Workforce), and G1
(Business Conduct)** material, plus the always-mandatory **ESRS 2**:

| Standard | datapoints | Material? |
|---|---|---|
| ESRS 2 | 35 | yes (always) |
| E1 | 42 | yes |
| S1 | 52 | yes |
| G1 | 18 | yes |
| others (E2–E5, S2–S4) | 160 | no |

`materialDatapoints = 35 + 42 + 52 + 18 = 147` of `totalDatapoints = 307` in scope → the reporter
sees a ~48% in-scope datapoint load. (Against the official ~1,144-datapoint universe the proportion
would differ; the code's counts are indicative, not the EFRAG line-item total.)

### 7.5 Companion reference content

- **Framework Crosswalk** — maps each ESRS DR to GRI, ISSB (IFRS S1/S2), India BRSR, and SASB, the
  key artefact for multi-standard reporters avoiding duplicate data collection.
- **Omnibus Impact Analyzer** — captures the 2025 EU Omnibus proposals (scope threshold changes,
  datapoint reductions) as before/after rows — genuinely useful given the regulation is in flux.
- **Assurance Roadmap** — the limited-→reasonable-assurance phase-in the CSRD mandates.

### 7.6 Data provenance & limitations

- **No synthetic scoring**: the module is a catalogue; its two computations are plain sums, so there is
  no `sr()`-fabricated headline number to caveat.
- **Datapoint counts are approximate**: the `datapoints` fields (sum 307) are illustrative and do not
  reconcile to the official EFRAG count (~1,144 incl. sub-datapoints) the guide cites — a reporter
  should treat these as topic-level scale indicators, not the legal line-item total.
- **The guide's scores do not exist**: no `obligation_weight`, no 1–5 collection-complexity score, no
  phase-in coverage rate. The materiality filter is a binary include/exclude, not a weighted obligation.
- Crosswalk mappings are editorial and require maintenance as ISSB/GRI interoperability guidance evolves.

**Framework alignment:** Content operationalises **EU Delegated Regulation 2023/2772** (ESRS Set 1):
ESRS 1 (general requirements incl. Article-37 phase-in provisions) and ESRS 2 (general disclosures)
sit cross-cutting, with topical E1–E5 / S1–S4 / G1 standards applied per **double materiality
assessment (DMA)**. Methodology tags cite the real underlying standards each DR relies on — **GHG
Protocol / ISO 14064** for E1-6 emissions, **SBTi** for E1-4 targets, **WRI Aqueduct** for E3 water
risk, **REACH/CLP** for E2 substances of concern. The crosswalk targets **GRI**, **ISSB IFRS S1/S2**,
and **SASB** interoperability. No production model is required — a navigator's job is faithful
reference structure, which the code substantially delivers (subject to the count caveat above).

## 9 · Future Evolution

### 9.1 Evolution A — The full 1,144-datapoint catalog with a real obligation engine (analytics ladder: rung 1 → 2)

**What.** The §7 flag quantifies the gap: the guide claims "all 1,144 ESRS datapoints" and three computed scores (obligation weight, collection-complexity, phase-in coverage), but the in-page catalog sums to **307** datapoints and the module computes exactly two numbers (total, and materiality-filtered total). What exists is honest and useful — a curated reference navigator with real DR structure, a 15-row GRI/ISSB/BRSR/SASB crosswalk, Omnibus change tracking, and assurance phases — but it is a catalog, not an engine, and it is 73% short of its claimed coverage.

**How.** (1) Complete the catalog from the authoritative source: EFRAG's ESRS Set 1 datapoint list (published as a structured Excel/XBRL annex, exactly 1,144 rows with IDs, mandatory/voluntary flags, phase-in provisions) — ingested into the refdata layer where the platform's memory says ESRS catalogs already partially live; reconcile and complete rather than re-key. (2) Implement the three promised computations: obligation weight per the §5 formula (driven by DMA outcomes pulled from `double-materiality`'s persisted assessments — the modules are natural neighbors), collection-complexity as a maintained per-datapoint rating, and phase-in coverage against the Article 37 schedule with the entity's CSRD wave (the double-materiality engine already infers waves). (3) Per-datapoint status tracking (`not started/collecting/ready`) persisted per org, making the "readiness roadmap" a queryable object. (4) Omnibus changes become dated catalog versions so scope deltas are diffable.

**Prerequisites.** EFRAG annex ingestion and ID reconciliation with the existing refdata rows; DMA integration contract with the double-materiality module. **Acceptance:** the catalog count reconciles to the EFRAG list exactly; a fixture entity's in-scope count changes correctly when a DMA topic flips material; phase-in coverage computes against wave-specific Article 37 dates.

### 9.2 Evolution B — Scoping Q&A copilot over the authoritative catalog (LLM tier 1 → 2)

**What.** First-year CSRD reporters ask precise, answerable questions: "is Scope 3 category 11 mandatory for us in year one?", "which S1 datapoints phase in for sub-750-employee undertakings?", "what's the GRI equivalent of E1-6?" A copilot grounded in Evolution A's complete catalog answers with datapoint IDs, mandatory/conditional status, phase-in provisions, and crosswalk equivalents — tier 1 as pure catalog Q&A, tier 2 when it queries the org's DMA outcomes and status tracker to answer "for *us*" questions and draft the collection plan.

**How.** Tier 1: the catalog embedded per the roadmap's pgvector pattern; answers cite datapoint IDs and the Delegated Regulation provisions verbatim — regulatory Q&A must quote, not paraphrase. Tier 2 tools: `lookup_datapoint(id_or_name)`, `get_scope(org)` (DMA-filtered), `get_phase_in(org, year)`, `get_crosswalk(datapoint)`, `get_collection_status(org)`. The refusal path covers interpretation beyond the catalog ("whether your franchise model counts as downstream value chain is a legal judgment — here is the ESRS 1 provision") — the copilot navigates, it does not advise.

**Prerequisites.** Evolution A's complete catalog (a copilot over the 307-row subset would confidently misreport scope — the worst failure mode for a scoping tool); Omnibus version awareness so answers cite the catalog version. **Acceptance:** golden Q&A (20 scoping questions with EFRAG-verifiable answers) scores 100% on datapoint status; every answer names its catalog version; out-of-catalog interpretation questions refuse with the relevant provision quoted.