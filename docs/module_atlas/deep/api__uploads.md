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
