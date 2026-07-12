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
