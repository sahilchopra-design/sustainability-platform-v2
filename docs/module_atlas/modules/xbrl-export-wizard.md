# XBRL Export Wizard
**Module ID:** `xbrl-export-wizard` · **Route:** `/xbrl-export-wizard` · **Tier:** A (backend vertical) · **EP code:** None · **Sprint:** None

## 1 · Overview
ESRS and SEC XBRL tagging and export workflow; maps ESG disclosure data to the ESRS XBRL taxonomy and SEC climate disclosure taxonomy, validates tags and generates iXBRL-formatted submission files.

> **Business value:** CSRD requires iXBRL tagging of all ESRS disclosures from 2025; ESMA estimates 50,000+ companies must comply; automated XBRL tooling reduces tagging time from weeks to hours and eliminates manual error.

**How an analyst works this module:**
- Map ESG data fields to ESRS XBRL taxonomy elements
- Apply SEC climate disclosure taxonomy for US registrants
- Validate tagged file against taxonomy schema and business rules
- Resolve validation errors and warnings
- Export production-ready iXBRL file for regulatory submission

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `API`, `DEFAULT_VALUES`, `DataMapping`, `ExportPreview`, `TaxonomyBrowser`, `ValidationReport`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `API` | `'http://localhost:8001';` |
| `pill` | `(color,text,sm)=>({display:'inline-block',padding:sm?'1px 7px':'2px 10px',borderRadius:10,fontSize:sm?10:11,fontWeight:600,background:color+'18',color,border:`1px solid ${color}30`});` |
| `result` | `await postJSON('/api/v1/xbrl/export',{` |
| `rows` | `useMemo(()=>dpIds.map(id=>({id,...taxonomy[id]})),[dpIds,taxonomy]);` |
| `esrsGroups` | `useMemo(()=>Array.from(new Set(rows.map(r=>r.esrs))).sort(),[rows]);` |
| `gap` | `rows.length-tagged;` |
| `byEsrs` | `esrsGroups.map(e=>({esrs:e,count:rows.filter(r=>r.esrs===e).length,tagged:rows.filter(r=>r.esrs===e&&values[r.id]!==undefined&&values[r.id]!=='').length}));` |
| `allEsrs` | `useMemo(()=>Array.from(new Set(rows.map(r=>r.esrs))).sort(),[rows]);` |
| `blob` | `new Blob([snippet],{type:exportFormat==='ixbrl'?'text/html':'application/xml'});` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/xbrl/export` | `xbrl_export` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest` | `xbrl_ingest` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest/ixbrl` | `xbrl_ingest_ixbrl` | api/v1/routes/xbrl_export.py |
| POST | `/api/v1/xbrl/ingest/xbrl-xml` | `xbrl_ingest_xml` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/taxonomy` | `ref_taxonomy` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/validation-rules` | `ref_validation_rules` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/supported-standards` | `ref_supported_standards` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/supported-schemas` | `ref_supported_schemas` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/concept-mappings` | `ref_concept_mappings` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/ingestion-stats` | `ref_ingestion_stats` | api/v1/routes/xbrl_export.py |
| GET | `/api/v1/xbrl/ref/csrd-xbrl-bridge` | `ref_csrd_xbrl_bridge` | api/v1/routes/xbrl_export.py |

### 2.3 Engine `xbrl_export_engine` (services/xbrl_export_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `XBRLExportEngine.export` | entity_name, entity_lei, period_start, period_end, data_points, currency, decimals | Generate XBRL export from data points. |
| `XBRLExportEngine.export_from_csrd_auto_populate` | auto_populate_result, entity_lei, period_start, period_end, currency, decimals | E2 pipeline: CSRD auto-populate output → XBRL iXBRL / XML. Accepts either an `AutoPopulateResult` dataclass (from csrd_auto_populate.py) or a plain dict with a `"populated_dps"` list of dicts/dataclasses. Applies CSRD_TO_XBRL_BRIDGE mapping to translate dp_ids, then calls self.export() with the translated data_points dict. Args: auto_populate_result: AutoPopulateResult or dict from csrd_auto_popul |
| `XBRLExportEngine._generate_ixbrl` | name, lei, start, end, facts, currency | Generate iXBRL HTML document. |
| `XBRLExportEngine._generate_xbrl_xml` | name, lei, start, end, facts, currency | Generate XBRL XML instance document. |
| `XBRLExportEngine._validate` | facts, lei, start, end | Run ESEF validation rules. |
| `XBRLExportEngine.get_taxonomy` |  |  |
| `XBRLExportEngine.get_validation_rules` |  |  |
| `XBRLExportEngine.get_supported_standards` |  |  |

### 2.3 Engine `xbrl_ingestion_engine` (services/xbrl_ingestion_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `XBRLIngestionEngine.ingest_ixbrl` | html_content | Parse an iXBRL (inline XBRL in HTML) document. |
| `XBRLIngestionEngine.ingest_xbrl_xml` | xml_content | Parse an XBRL XML instance document. |
| `XBRLIngestionEngine.ingest_auto` | content | Auto-detect format (iXBRL HTML vs XBRL XML) and parse. |
| `XBRLIngestionEngine._build_result` | fmt, entity_name, entity_id, period_start, period_end, facts, warnings, raw_content | Build final ingestion result with coverage stats. |
| `XBRLIngestionEngine.get_supported_schemas` |  |  |
| `XBRLIngestionEngine.get_concept_mappings` |  |  |
| `XBRLIngestionEngine.get_mapped_concept_count` |  |  |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`

**Database tables:** `__future__` *(shared)*, `csrd_auto_populate`, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `structured`, `typing` *(shared)*
**Frontend seed datasets:** `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Elements Tagged | — | Tagging Engine | Proportion of mandatory ESRS/SEC elements mapped to XBRL taxonomy concepts. |
| Validation Errors | — | XBRL Validator | Current count of XBRL validation errors requiring correction before submission; target zero. |
| File Size | — | Export Engine | Size of generated iXBRL file; large files may require chunking for ESMA portal upload limits. |
- **ESG Disclosure Data, ESRS XBRL Taxonomy, SEC Taxonomy** → Element mapping + XBRL tagging + schema validation + iXBRL rendering → **iXBRL submission files, validation reports, tagging completeness scorecard**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/xbrl/ref/concept-mappings** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs:GrossScope1GHGEmissions', 'esrs:GrossScope2GHGEmissionsLocationBased', 'esrs:GrossScope2GHGEmissionsMarketBased', 'esrs:TotalScope3GHGEmissions', 'esrs:TotalGHGEmissions', 'esrs:GHGIntensityPerNetRevenue', 'esrs:TotalEnergyConsumption', 'esrs:ShareOfRenewableEnergy'`

**GET /api/v1/xbrl/ref/csrd-xbrl-bridge** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['bridge_map', 'total_mappings', 'note'], 'n_keys': 3}`

**GET /api/v1/xbrl/ref/ingestion-stats** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['supported_schemas', 'mapped_concepts', 'export_taxonomy_concepts', 'validation_rules'], 'n_keys': 4}`

**GET /api/v1/xbrl/ref/supported-schemas** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['esrs_2024', 'ifrs_s1s2_2024', 'ifrs_full_2024', 'us_gaap_2024', 'gri_2024', 'esef_lei'], 'n_keys': 6}`

**GET /api/v1/xbrl/ref/supported-standards** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 6, 'item0_keys': None}`

**GET /api/v1/xbrl/ref/taxonomy** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['E1-6_scope1_gross', 'E1-6_scope2_location', 'E1-6_scope2_market', 'E1-6_scope3_total', 'E1-6_total_ghg', 'E1-6_ghg_intensity_revenue', 'E1-5_energy_consumption_total', 'E1-5_renewable_share', 'E1-9_internal_carbon_price', 'E1-9_transition_risk_amount', 'E1-9_physical_ris`

**GET /api/v1/xbrl/ref/validation-rules** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'array', 'len': 7, 'item0_keys': ['id', 'desc', 'field']}`

**POST /api/v1/xbrl/export** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic
**Methodology:** XBRL Tagging Completeness
**Headline formula:** `XTC = Tagged Elements / Required Elements × 100`

Percentage of mandatory disclosure elements tagged with XBRL identifiers; below 95% flags gaps requiring resolution before regulatory submission.

**Standards:** ['ESRS XBRL Taxonomy 2024', 'SEC Climate Disclosure Rule 2024']
**Reference documents:** ESRS XBRL Taxonomy (EFRAG 2024); SEC Climate-Related Disclosure Rule 2024; ESMA iXBRL Filing Manual 2023; XBRL International Specification

**Engine `xbrl_ingestion_engine` — extracted transformation lines:**
```python
rate = (mapped_count / total * 100) if total > 0 else 0
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Backend↔frontend disconnection (same pattern as `vcm-integrity` and `water-risk`).** A
> genuinely sophisticated iXBRL export engine exists at `backend/services/xbrl_export_engine.py`
> (615 lines) — real ESRS-to-XBRL taxonomy concept mappings (with inline comments documenting actual
> ESMA ESEF rejection reasons the mapping was fixed to avoid, e.g. *"tCO2e is non-monetary;
> iso4217:EUR caused ESMA ESEF rejection"*), a functioning iXBRL/XBRL-XML generator, and real ESEF
> validation rules (LEI format, period ordering, taxonomy membership, duplicate-fact detection). **The
> frontend never calls it** — no `axios`/`fetch` exists in `XbrlExportWizardPage.jsx`. Unlike several
> sibling modules, however, the frontend's own static demo data is genuinely high-quality and
> internally consistent with real ESRS structure (§7.2), just not generated live.

### 7.1 What the backend engine does (not currently displayed)

```python
export(entity_data, lei, period_start, period_end) →
  facts = [XBRLFact(concept, value, unit, context) for each mapped data point]
  ixbrl_html = _generate_ixbrl(facts, ...)          # real inline-XBRL HTML generation
  xbrl_xml   = _generate_xbrl_xml(facts, ...)        # real standalone XBRL instance document
  validation_results = _validate(facts, lei, start, end)   # ESEF-001..007 rule checks
```

`_validate()` checks: LEI is exactly 20 alphanumeric characters (ESEF-001), period start precedes
period end (ESEF-002), every fact's concept exists in `ESRS_XBRL_TAXONOMY` (ESEF-005), and no
duplicate `(concept, context_id)` pairs exist (ESEF-007) — all genuine, executable checks, not
static pass/fail labels.

### 7.2 What the frontend actually displays (static, but well-constructed)

`XBRL_CONCEPTS` — 19 hardcoded ESRS data points for a single fixed demo entity ("Apex Sustainability
Corp SE"), each with a real ESRS disclosure-requirement citation (e.g. `dr:'E1-6', para:'44(a)'` for
Gross Scope 1 — this is the *actual* ESRS E1-6 paragraph structure), a plausible value, and a
`status` (tagged/review/gap). Critically, **the values are internally consistent with real ESRS
arithmetic**: `E1-6_scope1 (12,450) + E1-6_scope2_loc (8,320) + E1-6_scope3 (84,200) = 104,970`,
which exactly equals the separately-listed `E1-6_total` value of 104,970 — this consistency is
either a deliberate authoring choice or the demo data was generated with real ESRS totals-must-
reconcile logic in mind, either way a materially better standard than most sibling modules' random
per-field draws.

`VALIDATION_RULES` — 14 named checks (ESEF-001–006, ESMA-001–006, WARN-001–002), each with a
`passing` boolean **that is itself hardcoded**, not derived from actually running the rule against
`XBRL_CONCEPTS`. For example, `ESMA-002` ("Scope 1+2+3 total must equal sum of components") is
marked `passing:true` — which happens to be arithmetically correct for this demo dataset (§ above),
but the check itself is not executed in JS; if a user could edit `XBRL_CONCEPTS.value`, the
`passing` flag would not update to reflect a broken reconciliation.

### 7.3 Calculation walkthrough

1. `byEsrs` groups `XBRL_CONCEPTS` by the 6 named ESRS topics (E1, E2, E3, E4, G1, S1) and counts
   `count`/`tagged` per topic — a genuine, correctly-implemented aggregation.
2. Data Mapping / Taxonomy Browser tabs render `XBRL_CONCEPTS` directly, colour-coded by `status`.
3. Validation Report tab renders `VALIDATION_RULES` directly — since `passing` is static, this tab
   would show identical results regardless of what a user might (hypothetically) edit elsewhere on
   the page.
4. Export Preview tab likely renders a mock iXBRL document shell using the fixed `entity` object
   (`{name:'Apex Sustainability Corp SE', lei:'LEI-9FGHIJ0KLMNO1234PQ56', ...}`) — note this LEI is
   23 characters (`LEI-` prefix + 20 chars), which would actually **fail** the backend engine's own
   ESEF-001 rule (LEI must be *exactly* 20 alphanumeric characters, no `LEI-` prefix) if the two were
   ever connected — a concrete, checkable inconsistency between the frontend demo entity and the
   backend's real validation rule.

### 7.4 Data provenance & limitations

- **The frontend's 19-concept demo dataset is genuinely well-constructed** (correct ESRS DR/paragraph
  citations, internally-reconciling Scope 1+2+3 totals) — a rare case in this batch where "synthetic"
  doesn't mean "arbitrary."
- **`VALIDATION_RULES.passing` flags are asserted, not computed** — connecting the real backend
  `_validate()` would make this tab genuinely responsive to data changes instead of a fixed display.
- **The demo entity's LEI format (`LEI-9FGHIJ0KLMNO1234PQ56`, 23 chars incl. prefix) would fail the
  backend's own ESEF-001 rule** (needs exactly 20 alphanumeric chars) — a concrete bug to fix before
  wiring frontend and backend together.
- Only a single fixed entity/period is modelled — no multi-entity or multi-year comparison exists.

**Framework alignment:** EFRAG ESRS XBRL Taxonomy 2024 and ESMA ESEF filing rules — genuinely and
correctly implemented in the **backend engine**, with real ESRS disclosure-requirement citations
reflected (not just approximated) in the **frontend's static demo data** as well. This module is a
strong candidate for a straightforward wiring fix: connect `XbrlExportWizardPage.jsx` to
`POST /api/v1/xbrl/export`, feed it the same 19 data points already displayed, and replace the
static `VALIDATION_RULES.passing` flags with the engine's live `_validate()` output.

## 9 · Future Evolution

### 9.1 Evolution A — Live validation wiring, LEI fix, and multi-entity exports (analytics ladder: rung 2 → 3)

**What.** The engine is real and unusually battle-tested — 615 lines with taxonomy
mappings annotated by actual ESMA ESEF rejection reasons ("tCO2e is non-monetary;
iso4217:EUR caused ESMA ESEF rejection") and executable ESEF-001..007 checks — and the
frontend's 19-concept demo data reconciles correctly (Scope 1+2+3 = 104,970 = the
listed total). But §7.2/§7.4 document that the Validation Report's `passing` flags are
hardcoded, not computed (editing a value would never flip ESMA-002), and §7.3 catches
a concrete cross-layer bug: the demo entity's LEI (`LEI-9FGHIJ0KLMNO1234PQ56`, 23
chars) would fail the engine's own ESEF-001 rule the moment the layers connect.
Evolution A: fix the demo LEI, complete the frontend→`POST /api/v1/xbrl/export`
wiring so the Validation Report renders live `_validate()` output, make
`XBRL_CONCEPTS` editable (values persist per entity/period in a new
`xbrl_filing_drafts` table), and extend beyond the single fixed entity to
multi-entity, multi-year drafts. Rung-3 step: pin a golden export in `bench_quant` —
same 19 data points in, byte-stable iXBRL out — and validate generated files against
an external checker (Arelle) in CI.

**How.** Frontend work is mostly replacement of static tables with endpoint state;
the `export_from_csrd_auto_populate` bridge means CSRD module output can pre-fill
drafts — the E2 pipeline the engine already supports.

**Prerequisites.** The hardcoded-passing-flags and LEI defects acknowledged; Arelle
(or equivalent) available in CI. **Acceptance:** breaking the Scope-3 value on the
page flips ESMA-002 to failing on next validate; the demo LEI passes ESEF-001; an
exported iXBRL file passes Arelle without errors.

### 9.2 Evolution B — Filing-assistant copilot over the live validator (LLM tier 2)

**What.** ESRS iXBRL filing is a fix-the-errors loop, and the engine's rule IDs give
the copilot precise anchors. Evolution B is a tool-calling assistant embedded in the
wizard: "why is my filing failing?" runs `POST /export` (validation-only mode),
receives the structured rule failures (e.g. ESEF-005 concept-not-in-taxonomy,
ESEF-007 duplicate fact), and explains each in ESRS terms with the specific fix —
"your E1-6 44(a) Scope 1 value is tagged twice with the same context; remove one or
differentiate the period context." It also answers mapping questions using
`GET /ref/taxonomy` and `/ref/csrd-xbrl-bridge` ("which concept do I use for
market-based Scope 2?"), and drafts the tagging-completeness summary (the §5 XTC
metric) from live counts.

**How.** Tier-2 stack: tool schemas from the 11 existing routes (all GETs already
pass the lineage harness); grounding corpus is this Atlas page plus the engine's rule
descriptions and the ESRS paragraph citations already carried in the concept data.
Fabrication is structurally constrained: every rule ID and concept name in an answer
must exist in a tool payload.

**Prerequisites (hard).** Evolution A's live wiring — explaining hardcoded pass flags
would be explaining fiction; validation-only export mode (cheap flag on the existing
endpoint). **Acceptance:** each explained failure cites a rule ID present in the
validate payload; fixes the copilot proposes, when applied, actually clear the cited
rule on re-validate; asked about SEC climate-rule tagging (supported standard but
different taxonomy), the copilot scopes its answer to what `/ref/supported-standards`
declares.