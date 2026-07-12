# Api::Data_Intake
**Module ID:** `api::data_intake` · **Route:** `/api/v1/data-intake` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/data-intake/status` | `get_data_intake_status` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio/template` | `download_portfolio_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio` | `list_portfolio_uploads` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/portfolio/upload` | `upload_portfolio_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/portfolio/{upload_id}/rows` | `get_portfolio_rows` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/counterparty` | `list_counterparty_emissions` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/counterparty` | `upsert_counterparty_emissions` | api/v1/routes/data_intake.py |
| DELETE | `/api/v1/data-intake/counterparty/{record_id}` | `delete_counterparty_emission` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/real-estate/template` | `download_real_estate_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/real-estate` | `list_real_estate_assets` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/real-estate/upload` | `upload_real_estate_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/shipping-fleet/template` | `download_fleet_template` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/shipping-fleet` | `list_fleet` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/shipping-fleet/upload` | `upload_fleet_csv` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/steel-borrowers` | `list_steel_borrowers` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/steel-borrowers` | `upsert_steel_borrower` | api/v1/routes/data_intake.py |
| DELETE | `/api/v1/data-intake/steel-borrowers/{borrower_id}` | `delete_steel_borrower` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/project-finance` | `list_projects` | api/v1/routes/data_intake.py |
| POST | `/api/v1/data-intake/project-finance` | `create_project_finance` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/project-finance/{project_id}` | `get_project` | api/v1/routes/data_intake.py |
| DELETE | `/api/v1/data-intake/project-finance/{project_id}` | `delete_project` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/internal-config` | `get_all_config` | api/v1/routes/data_intake.py |
| PUT | `/api/v1/data-intake/internal-config/{key}` | `update_config` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/pcaf-summary` | `get_pcaf_summary` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/shipping-analytics` | `get_shipping_analytics` | api/v1/routes/data_intake.py |
| GET | `/api/v1/data-intake/steel-analytics` | `get_steel_analytics` | api/v1/routes/data_intake.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `SET` *(shared)*, `data_source_type`, `datetime` *(shared)*, `db` *(shared)*, `dh_country_risk_indices` *(shared)*, `di_`, `di_counterparty_emissions`, `di_internal_config`, `di_loan_portfolio_rows`, `di_loan_portfolio_uploads`, `di_project_finance`, `di_real_estate_assets`, `di_shipping_fleet`, `di_steel_borrowers`, `fastapi` *(shared)*, `job`, `pydantic` *(shared)*, `raw`, `row`, `sqlalchemy` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/data-intake/counterparty** — status `passed`, provenance ['db-empty'], source tables: `di_counterparty_emissions`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/data-intake/internal-config** — status `passed`, provenance ['real-db'], source tables: `di_internal_config`
Output: `{'type': 'array', 'len': 8, 'item0_keys': ['config_key', 'config_value', 'display_name', 'description', 'config_group', 'data_type', 'updated_by', 'updated_at']}`

**GET /api/v1/data-intake/pcaf-summary** — status `passed`, provenance ['db-empty'], source tables: `di_counterparty_emissions`, `di_loan_portfolio_rows`
Output: `{'type': 'object', 'keys': ['summary', 'dqs_distribution', 'sector_breakdown'], 'n_keys': 3}`

**GET /api/v1/data-intake/portfolio** — status `passed`, provenance ['db-empty'], source tables: `di_loan_portfolio_uploads`
Output: `{'type': 'array', 'len': 0, 'item0_keys': None}`

**GET /api/v1/data-intake/portfolio/template** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'StreamingResponse', 'repr': '<starlette.responses.StreamingResponse object at 0x0000013D48B4FEC0>'}`

**GET /api/v1/data-intake/portfolio/{upload_id}/rows** — status `failed`, provenance ['db-empty'], source tables: `di_loan_portfolio_rows`
Output: `None`

**GET /api/v1/data-intake/project-finance** — status `passed`, provenance ['real-db'], source tables: `di_project_finance`
Output: `{'type': 'array', 'len': 1, 'item0_keys': ['id', 'project_ref', 'project_name', 'project_type', 'country_iso2', 'capacity_mw', 'total_capex_musd', 'status', 'paris_alignment_status', 'preliminary_dscr', 'preliminary_lcoe_usd_mwh', 'preliminary_equity_irr_pct', 'created_at']}`

**GET /api/v1/data-intake/project-finance/{project_id}** — status `passed`, provenance ['real-db'], source tables: `di_project_finance`
Output: `{'type': 'object', 'keys': ['id', 'project_ref', 'project_name', 'project_type', 'country_iso2', 'capacity_mw', 'total_capex_musd', 'debt_musd', 'equity_musd', 'annual_revenue_musd', 'annual_opex_musd', 'annual_debt_service_musd', 'project_life_yrs', 'capacity_factor_pct', 'include_carbon_credits', `

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/api/v1/routes/data_intake.py` at `/api/v1/data-intake` — "Category C — Client
Proprietary Data Intake". All logic lives in the route file; there is no services engine.)*

### 7.1 What the module computes

Seven intake modules (loan portfolio CSV, counterparty emissions wizard, real-estate EUI,
shipping fleet, steel borrowers, project finance, internal config) that validate and persist
client data into `di_*` tables, plus **three computation endpoints** that turn that intake into
analytics:

1. **PCAF financed emissions** (`GET /pcaf-summary`), per the docstring:
   ```
   AF (attribution factor) = outstanding_amount / total_outstanding_by_counterparty
   Financed emissions      = AF × (Scope 1 + Scope 2 market) per counterparty
   WACI                    = Σ (outstanding/total_portfolio) × intensity
   ```
   with emissions resolved by quality: DQS 1–3 records from `di_counterparty_emissions`
   override row-level reported emissions (effective DQS 4); no data → DQS 5 with 0 tCO₂e.
2. **Shipping fleet analytics** (`GET /shipping-analytics`): CII rating distribution, fleet
   CO₂, per-vessel `AER = CO₂×10⁶ / (DWT × distance_nm)` gCO₂/DWT·nm, and simplified IMO
   compliance flags (2030-compliant if rated A–C; 2050-compliant only if A).
3. **Steel portfolio analytics** (`GET /steel-analytics`): production-weighted portfolio
   intensity vs an IEA-NZE glidepath, route mix, SBTi commitment rate.

Steel intake itself computes at entry (`POST /steel-borrowers`):
```
blended = BF-BOF% × 2.32 + EAF% × 0.67 + DRI% × 1.43     (tCO₂/t crude steel)
total_CO2 = blended × crude_steel_production_mt
```
Project-finance intake computes preliminary metrics: `DSCR = (revenue − opex)/debt_service`;
`LCOE = (CAPEX × FCR + OPEX) / annual_MWh` with `FCR = r/(1−(1+r)^−n)`; equity IRR by
bisection on NPV of level equity cash flows (optionally + carbon-credit revenue), bracket
−0.5…5.0.

### 7.2 Parameterisation

| Constant | Value | Provenance |
|---|---|---|
| Steel route intensities | BF-BOF 2.32 · EAF 0.67 · DRI 1.43 tCO₂/tCS | code comment "GCCA / worldsteel" — consistent with worldsteel published route averages |
| IEA NZE steel glidepath | 2020:1.85 → 2030:**1.28** → 2040:0.65 → 2050:0.10 tCO₂/t (linear interp between waypoints) | `_STEEL_NZE_GLIDEPATH`, labelled IEA NZE |
| Counterparty DQS map | direct_measurement 1 · audited_report 2 · self_reported 3 · sector_average 4 · estimated 5 | PCAF-style source-type ladder |
| Loan CSV validation | instrument ∈ {loan,bond,equity,guarantee}; IFRS 9 stage ∈ {1,2,3}; DQS ∈ {1..5}; numeric outstanding | route constants |
| Real-estate EUI flag | EUI > 800 kWh/m²·yr flagged (still inserted) | route heuristic |
| Route-share gate | BF-BOF+EAF+DRI ≤ 100.1% else HTTP 422 | tolerance for rounding |
| Project defaults | life 25 yr, discount 8% | Pydantic defaults |
| Config "configured" gate | ≥ 8 internal-config keys | dashboard status heuristic |

CSV templates (`/portfolio/template`, `/real-estate/template`, `/shipping-fleet/template`)
carry CRREM pathway/stranding-year, ENERGY STAR/GRESB, and CII/EEXI columns respectively.

### 7.3 Calculation walkthrough — PCAF summary

Valid loan rows are joined to the best emissions record per counterparty (sorted DQS asc, year
desc). Per row: AF = row outstanding ÷ counterparty total outstanding; financed = AF × Scope 1+2.
Totals then apply a `seen_counterparties` dedup so each counterparty contributes **only its
first row's** financed emissions to the headline total and DQS buckets. Three code quirks a
reader should know:

- Because AF already apportions per row (rows sum to the full counterparty emissions), counting
  only the first row *understates* multi-loan counterparties' financed emissions in the summary
  (a counterparty with a 25%/75% split books only the 25% slice).
- The sector-breakdown guard `if cid not in seen_counterparties or True:` is always true, so
  sector financed emissions include **every** row (internally inconsistent with the headline).
- The WACI term algebraically reduces to `Σ_rows scope12 / total_outstanding × 10⁶` — a
  financed-emissions-per-$M lending intensity (with multi-row counterparties double-counted),
  not the PCAF/TCFD WACI, which weights **revenue** intensity by portfolio weight.

Weighted-average DQS = Σ(DQS × financed in bucket) / total financed.

### 7.4 Worked example — steel borrower

Borrower: 10 Mt crude steel, 60% BF-BOF / 30% EAF / 10% DRI, data_year 2030:

| Step | Computation | Result |
|---|---|---|
| Blended intensity | 0.6×2.32 + 0.3×0.67 + 0.1×1.43 | **1.736 tCO₂/tCS** |
| Total CO₂ | 1.736 × 10 | 17.36 (stored in `total_co2_tco2e`) |
| NZE 2030 target | glidepath waypoint | 1.28 |
| Gap vs NZE | 1.736 − 1.28 | **+0.456 tCO₂/tCS** |
| On track 2030 | 1.736 ≤ 1.28? | **No** |

Unit note: production is entered in **Mt**, so `blended × production_mt` is in MtCO₂, though
the column is named `total_co2_tco2e` — a naming/unit mismatch to be aware of downstream.

### 7.5 Data provenance & limitations

- **All data is client-supplied via uploads/forms — no PRNG, no seeded demo rows.** The only
  embedded reference numbers are the steel route intensities and NZE glidepath (public-source
  anchored) and the validation constants.
- PCAF simplifications: attribution uses *lending-book share* (outstanding ÷ counterparty total
  outstanding within the book), not PCAF's prescribed denominators (EVIC for listed, total
  equity+debt for private companies); Scope 3 is collected but excluded from financed
  emissions; the §7.3 dedup/sector/WACI inconsistencies mean headline vs sector figures can
  disagree on multi-loan counterparties.
- Shipping "IMO 2030/2050 compliance" is a rating-letter proxy (D/E = non-compliant), not a
  computed CII vs the IMO reduction-factor trajectory; AER is computed from raw inputs but not
  reconciled against the reported CII score.
- Project IRR assumes level annual cash flows over the whole life (no construction period,
  degradation, tax, or debt sculpting); LCOE uses the fixed-charge-rate shortcut.
- CSV ingestion is synchronous and row-by-row (no async job for large files); invalid rows are
  stored with `is_valid = FALSE` and per-row `validation_errors` JSON rather than rejected.

### 7.6 Framework alignment

- **PCAF Global GHG Accounting Standard** — attribution-factor × counterparty-emissions design
  and the 1–5 Data Quality Score (PCAF's ladder: 1 verified reported → 5 economic proxy),
  including quality-first source resolution and financed-emissions-weighted average DQS.
- **GHG Protocol Corporate Standard** — Scope 1 / Scope 2 (market & location) / Scope 3
  categories 1, 11, 15 captured in the counterparty wizard.
- **IFRS 9** — stage 1/2/3 captured per loan row for downstream ECL modules.
- **IMO CII / EEXI (MARPOL Annex VI)** — the real CII assigns A–E ratings by comparing attained
  AER (gCO₂/DWT·nm) to a vessel-type reference line with annual reduction factors; the module
  ingests attained ratings/scores and computes AER, using rating letters as the compliance proxy.
- **IEA Net Zero Emissions scenario (steel)** — sectoral intensity glidepath to 0.10 tCO₂/t by
  2050; worldsteel/GCCA route intensities for the blended metric.
- **CRREM** — real-estate template carries CRREM 2030/2050 pathway values and stranding year
  (decarbonisation-pathway stranding analysis happens in the frontend real-estate modules).
- **Equator Principles & Paris alignment** — project-finance records carry an EP category
  (A/B/C risk categorisation) and a Paris-alignment status field as classification metadata.
- **ENERGY STAR / GRESB** — building efficiency and fund-level ESG benchmark scores ingested
  as-is.

## 9 · Future Evolution

### 9.1 Evolution A — Fix the PCAF summary defects and use prescribed attribution denominators (analytics ladder: rung 1 → 3)

**What.** "Category C — Client Proprietary Data Intake": seven intake modules (loan CSV, counterparty
emissions, real-estate EUI, shipping fleet, steel borrowers, project finance, config) persisting to
`di_*` tables, plus three computation endpoints (PCAF summary, shipping CII analytics, steel intensity
vs NZE) — all client-supplied, no PRNG. §7.3/§7.5 document **real defects to fix**, not just deepening:
the PCAF summary counts only each counterparty's **first loan row** in the headline (understating
multi-loan counterparties), the sector-breakdown guard `if cid not in seen or True:` is **always true**
(so sector figures include every row, inconsistent with the headline), and the "WACI" term is actually
financed-emissions-per-$M lending intensity with multi-row double-counting — not PCAF/TCFD revenue-
weighted WACI. Attribution also uses lending-book share, not PCAF's prescribed EVIC/(equity+debt)
denominators. There is also a steel unit-naming mismatch (`total_co2_tco2e` holds MtCO₂).

**How.** Rewrite `get_pcaf_summary` so financed emissions aggregate correctly across all loan rows per
counterparty (AF already apportions per row — sum them, don't dedup to the first), fix the sector guard,
and compute true WACI as revenue-intensity weighted by portfolio weight; attribution uses EVIC for
listed and total equity+debt for private per PCAF. Rung 3: shipping IMO 2030/2050 compliance computed
against the real CII reduction-factor trajectory (not a rating-letter proxy); project IRR with
construction period, degradation and debt sculpting.

**Prerequisites (hard).** Fix the harness failure — §4.2 shows `GET /portfolio/{upload_id}/rows`
**failed** (db-empty); fix the three documented PCAF-summary logic bugs and the steel unit label.
**Acceptance:** the §7.4 steel worked example (1.736 tCO₂/tCS, +0.456 vs NZE) reproduces with correct
MtCO₂ labelling; a two-loan counterparty's financed emissions appear in full in the headline; sector
and headline totals reconcile; the rows endpoint passes the harness.

### 9.2 Evolution B — Data-intake copilot that validates and computes on upload (LLM tier 2)

**What.** A copilot for onboarding client data: "upload this loan portfolio CSV and show me PCAF
summary" (`/portfolio/upload` → `/pcaf-summary`), "add this steel borrower" (`/steel-borrowers` with
the blended-intensity calc), "what's my fleet's CII compliance?" (`/shipping-analytics`), "model this
project's DSCR and IRR" (`/project-finance`) — narrating real computed metrics and flagging invalid
rows (stored with `is_valid=false` and per-row `validation_errors`, not rejected).

**How.** Tool schemas over the ~26 endpoints; write actions (upload, upsert, delete) render a
confirmation before persisting (audit-logged via middleware). The copilot uses the CSV templates
(CRREM/ENERGY STAR/CII columns) to guide the user's data preparation, and surfaces the PCAF DQS ladder
(1 verified → 5 proxy) so the user understands their data-quality score. The no-fabrication validator
checks every financed-emissions, DSCR and intensity figure against tool output; post-Evolution A the
copilot reports corrected PCAF totals.

**Prerequisites (hard).** Evolution A's PCAF-summary fixes (a copilot must not narrate the documented
double-count/understate bugs); the rows-endpoint harness fix; Atlas corpus embedded (roadmap D3); RBAC
so uploads run under the user's session. **Acceptance:** every figure cited traces to an intake tool
call; an upload with invalid rows surfaces the per-row validation errors, not a silent drop; the PCAF
summary a copilot reports reconciles headline and sector totals.