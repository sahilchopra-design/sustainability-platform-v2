## 9 · Future Evolution

### 9.1 Evolution A — Provenance-aware ingestion with verified identifiers (analytics ladder: rung 1 → 3)

**What.** The pipeline is deterministic mapping + rule-based QC (rung 1) with three documented weaknesses: silent defaults injection (`base_pd → 0.02`, `base_lgd → 0.45`, "BBB", 5y — downstream engines cannot tell supplied from defaulted values), format-only LEI checks (no MOD-97 check digit, no GLEIF lookup), and narrow whitelists (7 currencies, 6 sectors, 18 countries). Evolution A makes every ingested value carry provenance and benchmarks the auto-mapper.

**How.** (1) `convert_to_holdings` emits a per-field `provenance` map (`supplied | defaulted | derived`) persisted alongside the holding, so PCAF/ECL consumers can down-weight defaulted PD/LGD via the DQS channel. (2) `validate_lei_format` gains ISO 17442 MOD-97 verification plus a lookup against the platform's `entity_lei` table (GLEIF bulk ingest). (3) Whitelists move from code constants to refdata tables (full ISO 4217/3166). (4) The 0.7-cutoff fuzzy mapper gets a golden corpus of ~50 real-world header sets with pinned expected mappings, bench_quant-style.

**Prerequisites.** `entity_lei` populated at scale (GLEIF ingester was found silently broken; verify row counts first); durable upload storage replacing ephemeral `/tmp/uploads`; `file_uploads` table exercised (lineage shows it db-empty). **Acceptance:** a holding created with a missing PD shows `provenance.base_pd = "defaulted"` end-to-end in a PCAF response; mapping benchmark ≥95% on the golden corpus; an LEI with a bad check digit is rejected.

### 9.2 Evolution B — Mapping-and-remediation copilot (LLM tier 2)

**What.** The upload workflow already has the exact seams an LLM operator needs: `GET /preview`, `PATCH /mapping`, `GET /errors`. Evolution B is a copilot that reads the preview and validation errors, explains them in plain language ("row 14: PD 1.5 — the service expects decimal fractions; you likely meant 1.5%"), and proposes — never silently applies — mapping overrides and unit corrections as `PATCH /uploads/{id}/mapping` tool calls the user confirms.

**How.** Tool schemas derived from the 8 existing OpenAPI operations; grounding corpus is this Atlas page's §7.2 rule table (required fields, alias table, thresholds) so explanations cite the actual rule that fired. The fuzzy-match ambiguity cases (§7.5: `value_date` → `market_value`) become the copilot's highest-value moment: it flags low-confidence mappings from the mapper's own difflib scores and asks the user to disambiguate before processing. Mutating calls (`PATCH /mapping`, `POST /process`) stay behind explicit confirmation per the Tier-2 RBAC gating convention.

**Prerequisites.** Mapper must expose its per-column match confidence in the preview payload (small additive change to `auto_map_columns`); Evolution A's provenance map makes the copilot's "what will be defaulted" warnings truthful. **Acceptance:** for a CSV with one unit error and one ambiguous header, the copilot cites the exact validation rule, proposes the correct PATCH body, and never calls `/process` without user confirmation.
