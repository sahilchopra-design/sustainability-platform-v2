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
