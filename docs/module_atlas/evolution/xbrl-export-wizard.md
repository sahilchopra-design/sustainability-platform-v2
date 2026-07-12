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
