# Api::Uploads
**Module ID:** `api::uploads` · **Route:** `/uploads` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/uploads` | `upload_file` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}` | `get_upload_status` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}/preview` | `get_upload_preview` | api/v1/routes/uploads.py |
| PATCH | `/uploads/{upload_id}/mapping` | `update_mapping` | api/v1/routes/uploads.py |
| POST | `/uploads/{upload_id}/process` | `process_upload` | api/v1/routes/uploads.py |
| GET | `/uploads/{upload_id}/errors` | `get_validation_errors` | api/v1/routes/uploads.py |
| GET | `/uploads/templates` | `list_mapping_templates` | api/v1/routes/uploads.py |
| POST | `/uploads/templates` | `create_mapping_template` | api/v1/routes/uploads.py |

### 2.3 Engine `upload_service` (services/upload_service.py)
| Function | Args | Purpose |
|---|---|---|
| `UploadService.save_file` | file_content, filename, upload_id | Save uploaded file to disk |
| `UploadService.parse_file` | file_path, file_format | Parse uploaded file and return DataFrame. Returns: Tuple of (DataFrame, metadata dict) |
| `UploadService.auto_map_columns` | columns | Automatically map uploaded columns to standard fields using fuzzy matching. Args: columns: List of column names from uploaded file Returns: Dict mapping standard field names to uploaded column names |
| `UploadService.apply_mapping` | df, mapping | Apply column mapping to DataFrame. Args: df: Original DataFrame mapping: Dict mapping standard field names to uploaded column names Returns: DataFrame with renamed columns |
| `UploadService.get_preview` | df, max_rows | Get preview of first N rows. Args: df: DataFrame to preview max_rows: Maximum number of rows to return Returns: List of row dictionaries |
| `UploadService.convert_to_holdings` | df | Convert DataFrame to list of holding dictionaries. Args: df: Mapped and validated DataFrame Returns: List of holding dicts ready for database insertion |
| `UploadService.detect_duplicates` | df | Detect duplicate rows based on key fields. Args: df: DataFrame to check Returns: List of duplicate info dicts |
| `UploadService.calculate_statistics` | df | Calculate statistics for the uploaded data. Args: df: DataFrame to analyze Returns: Dict with statistics |

### 2.3 Engine `validation_service` (services/validation_service.py)
| Function | Args | Purpose |
|---|---|---|
| `ValidationService.validate_row` | row, row_number | Validate a single row of data. Args: row: DataFrame row row_number: Row number (1-indexed) Returns: List of validation errors for this row |
| `ValidationService.validate_dataframe` | df | Validate entire DataFrame. Args: df: DataFrame to validate Returns: Tuple of (list of errors, summary dict) |
| `ValidationService.validate_portfolio_level` | df | Perform portfolio-level validations. Args: df: DataFrame to validate Returns: List of portfolio-level validation errors |
| `ValidationService.validate_lei_format` | lei | Validate LEI format. LEI is 20 alphanumeric characters. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`

**Database tables:** `api` *(shared)*, `column`, `db` *(shared)*, `fastapi` *(shared)*, `filename`, `mapping`, `services` *(shared)*, `smaller`, `sqlalchemy` *(shared)*, `status`, `typing` *(shared)*, `workers` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /uploads/templates** — status `passed`, provenance ['db-empty'], source tables: `mapping_templates`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /uploads/{upload_id}** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**GET /uploads/{upload_id}/errors** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**GET /uploads/{upload_id}/preview** — status `failed`, provenance ['db-empty'], source tables: `file_uploads`
Output: `None`

**POST /uploads** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /uploads/templates** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**PATCH /uploads/{upload_id}/mapping** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

**POST /uploads/{upload_id}/process** — status `skipped`, provenance ['computed'], source tables: —
Output: `None`

## 5 · Intermediate Transformation Logic

**Engine `validation_service` — extracted transformation lines:**
```python
row_errors = self.validate_row(row, idx + 1)
top_exposure_pct = (top_exposures.iloc[0] / total_exposure) * 100
sector_pct = (exposure / total_exposure) * 100
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`/uploads` is the platform's **portfolio-data ingestion pipeline**, built from two services: `backend/services/upload_service.py` (parse → auto-map → preview → convert) and `backend/services/validation_service.py` (row + portfolio-level validation). The endpoint set implements a staged workflow:

```
POST /uploads              → save file, parse (CSV/XLSX/XLS/JSON via pandas), auto-map columns
GET  /uploads/{id}/preview → first ≤100 rows with _row_number
PATCH /uploads/{id}/mapping→ caller overrides the auto-mapping
GET  /uploads/{id}/errors  → validation error list + summary
POST /uploads/{id}/process → convert_to_holdings → DB insertion
GET/POST /uploads/templates→ upload template management
```

No analytics are computed here; the module's "methodology" is deterministic schema mapping and rule-based data quality control that gates everything downstream (PCAF, stress testing, ECL all consume these holdings).

### 7.2 Parameterisation — mapping schema and validation rules

**Canonical schema:** 3 required fields (`counterparty_name` *or* `lei`, `exposure_amount`, `currency`) + 13 optional (sector, country_code, asset_type, market_value, base_pd, base_lgd, rating, maturity_years, emissions_intensity, subsector, isin, cusip).

**Three-pass auto-mapping** (`auto_map_columns`): (1) exact match on normalised column names (lower-cased, spaces→underscores); (2) alias table (e.g. `exposure_amount` ← exposure/amount/ead/notional; `base_pd` ← pd/probability_of_default); (3) fuzzy match via `difflib.get_close_matches` with **cutoff 0.7**, first match wins, each source column consumed at most once.

**Validation rules** (`ValidationService`):

| Rule | Constraint | Severity |
|---|---|---|
| Required fields | name-or-LEI, exposure, currency present | error |
| LEI format | `^[A-Z0-9]{20}$` (20 alphanumerics) | error |
| Currency | ∈ {USD, EUR, GBP, JPY, CHF, CAD, AUD} | error |
| Exposure | numeric and > 0 | error |
| PD / LGD | numeric, 0 ≤ x ≤ 1 | error |
| Sector | ∈ 6-sector whitelist (Power Gen, Oil & Gas, Metals & Mining, Automotive, Airlines, Real Estate) | warning |
| Asset type | ∈ {Bond, Loan, Equity} | warning |
| Country | ISO-3166 alpha-2, 18-country subset | warning |
| Rating | 23-notch S&P-style scale AAA…D | warning |
| Single-name concentration | any counterparty > **25%** of total exposure | warning |
| Sector concentration | any sector > **40%** of total exposure | warning |

`is_valid` requires zero *errors*; warnings don't block processing.

### 7.3 Calculation walkthrough — defaults injection

`convert_to_holdings` fills gaps with hard-coded defaults before DB insertion: sector → "Power Generation", asset_type → "Bond", **base_pd → 0.02 (2%)**, **base_lgd → 0.45 (45%)**, rating → "BBB", maturity → 5 years, market_value → exposure. The 45% LGD matches the Basel foundation-IRB senior-unsecured supervisory LGD; 2% PD ≈ a BBB-consistent through-the-cycle default rate — so unmapped rows enter risk engines as generic investment-grade senior exposures. Duplicates are flagged (not dropped) on the `(counterparty_name, exposure_amount)` pair; `calculate_statistics` returns total/avg/max/min exposure and sector/currency/rating distributions.

### 7.4 Worked example

Uploaded CSV columns: `Company, EAD, CCY, PD, Industry`. Normalisation → `company, ead, ccy, pd, industry`. Mapping: pass 2 aliases resolve company→counterparty_name, ead→exposure_amount, ccy→currency, pd→base_pd, industry→sector. Row `("Acme Power", 50_000_000, "usd", 1.5, "Utilities")`:

- currency "usd" → upper-cased "USD" → valid.
- base_pd = 1.5 > 1 → **error** ("PD must be between 0 and 1") — the caller likely meant 1.5%, but the service enforces decimal fractions.
- sector "Utilities" ∉ whitelist → warning; on processing it would be *kept* as-is (default only applies when missing).
- If Acme Power is 60% of a 3-row portfolio → single-name concentration warning (60% > 25%).

Summary: `total_errors=1, is_valid=false` — the upload cannot be processed until the PD unit is fixed.

### 7.5 Data provenance & limitations

- **Fully deterministic; no PRNG.** All values originate from the uploaded file; the only injected numbers are the documented defaults (2%/45%/BBB/5y), which are *silent* — downstream reports don't currently distinguish defaulted from supplied PD/LGD (a data-lineage gap worth noting for audit).
- LEI validation is format-only (no ISO 17442 check-digit verification, no GLEIF lookup).
- Whitelists are narrow: 7 currencies, 6 sectors, 18 countries — legitimate values outside them raise warnings (sector/country) or hard errors (currency), so multi-currency portfolios beyond G7+3 need code changes.
- Files persist to `/tmp/uploads` (ephemeral on redeploy); fuzzy matching at 0.7 cutoff can mis-map ambiguous headers (e.g. a `value_date` column could fuzzy-match `value` → market_value), which is why the PATCH mapping-override endpoint exists.

### 7.6 Framework alignment

- **ISO 17442 (LEI)** — 20-character format check as the entity-identifier standard; production practice would add the MOD-97 check digits and GLEIF status validation.
- **ISO 3166-1 alpha-2 / ISO 4217** — country and currency code validation (subsets).
- **Basel III IRB parameters** — PD/LGD stored as [0,1] fractions; the 45% LGD default mirrors the F-IRB supervisory value for senior unsecured claims (Basel framework CRE32).
- **Large-exposure / concentration principles** — the 25% single-name threshold echoes the Basel large-exposures limit (25% of Tier 1 capital, here proxied against total portfolio exposure); the 40% sector threshold is an engine-authored heuristic.
- **S&P rating scale** — the 23-notch whitelist matches the standard long-term issuer scale used by downstream credit modules.

## 9 · Future Evolution

### 9.1 Evolution A — Provenance-aware ingestion with verified identifiers (analytics ladder: rung 1 → 3)

**What.** The pipeline is deterministic mapping + rule-based QC (rung 1) with three documented weaknesses: silent defaults injection (`base_pd → 0.02`, `base_lgd → 0.45`, "BBB", 5y — downstream engines cannot tell supplied from defaulted values), format-only LEI checks (no MOD-97 check digit, no GLEIF lookup), and narrow whitelists (7 currencies, 6 sectors, 18 countries). Evolution A makes every ingested value carry provenance and benchmarks the auto-mapper.

**How.** (1) `convert_to_holdings` emits a per-field `provenance` map (`supplied | defaulted | derived`) persisted alongside the holding, so PCAF/ECL consumers can down-weight defaulted PD/LGD via the DQS channel. (2) `validate_lei_format` gains ISO 17442 MOD-97 verification plus a lookup against the platform's `entity_lei` table (GLEIF bulk ingest). (3) Whitelists move from code constants to refdata tables (full ISO 4217/3166). (4) The 0.7-cutoff fuzzy mapper gets a golden corpus of ~50 real-world header sets with pinned expected mappings, bench_quant-style.

**Prerequisites.** `entity_lei` populated at scale (GLEIF ingester was found silently broken; verify row counts first); durable upload storage replacing ephemeral `/tmp/uploads`; `file_uploads` table exercised (lineage shows it db-empty). **Acceptance:** a holding created with a missing PD shows `provenance.base_pd = "defaulted"` end-to-end in a PCAF response; mapping benchmark ≥95% on the golden corpus; an LEI with a bad check digit is rejected.

### 9.2 Evolution B — Mapping-and-remediation copilot (LLM tier 2)

**What.** The upload workflow already has the exact seams an LLM operator needs: `GET /preview`, `PATCH /mapping`, `GET /errors`. Evolution B is a copilot that reads the preview and validation errors, explains them in plain language ("row 14: PD 1.5 — the service expects decimal fractions; you likely meant 1.5%"), and proposes — never silently applies — mapping overrides and unit corrections as `PATCH /uploads/{id}/mapping` tool calls the user confirms.

**How.** Tool schemas derived from the 8 existing OpenAPI operations; grounding corpus is this Atlas page's §7.2 rule table (required fields, alias table, thresholds) so explanations cite the actual rule that fired. The fuzzy-match ambiguity cases (§7.5: `value_date` → `market_value`) become the copilot's highest-value moment: it flags low-confidence mappings from the mapper's own difflib scores and asks the user to disambiguate before processing. Mutating calls (`PATCH /mapping`, `POST /process`) stay behind explicit confirmation per the Tier-2 RBAC gating convention.

**Prerequisites.** Mapper must expose its per-column match confidence in the preview payload (small additive change to `auto_map_columns`); Evolution A's provenance map makes the copilot's "what will be defaulted" warnings truthful. **Acceptance:** for a CSV with one unit error and one ambiguous header, the copilot cites the exact validation rule, proposes the correct PATCH body, and never calls `/process` without user confirmation.