## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — the two engine docstrings are the methodology sources; nothing to reconcile. The domain wraps **two engines** behind one route file, `api/v1/routes/lgd_vintage.py`.)*

### 7.1 What the module computes

**Engine 1 — `backend/services/lgd_downturn_engine.py` (`LGDDownturnEngine`, v2.0.0):** regulatory downturn LGD per EBA GL/2019/03 / CRR2 Art. 181(1)(b), with the formula stated in the module header:

```
downturn_lgd = long_run_avg_lgd
             + addon(collateral) × country_severity × sector_mult × scenario_mult
             + climate_stranded + climate_physical + green_adj
subject to:  ≥ regulatory_floor (CRR2 Art. 164)  AND  ≥ long_run_avg_lgd,  capped at 1.0
```

Exposed via `POST /downturn` (single or batch) and `GET /downturn/{addons, climate-haircuts, country-severity, regulatory-floors, sector-severity}` reference endpoints.

**Engine 2 — `backend/services/vintage_analyzer.py` (`VintageAnalyzer`, v2.0.0):** credit-portfolio vintage/cohort analysis per IFRS 9 B5.5.52-55 and EBA GL/2017/06 — cohort default metrics, a vintage triangle (cumulative + marginal default rates by origination year × age 1–10), ECB calendar-provisioning backstop gaps (EU Reg 2019/630), early-warning flags, and a green-origination trend. Reference endpoints: `GET /vintage/benchmark-rates`, `GET /vintage/ecb-coverage`.

### 7.2 Parameterisation

**Downturn LGD tables** (all engine constants; regulatory citations as commented):

| Table | Values | Provenance |
|---|---|---|
| Regulatory floors | residential mortgage 10%, commercial mortgage 15%, corporate/SME/retail unsecured 25%, secured 15% | CRR2 Art. 164(4) cites the 10%/15% mortgage floors verbatim; the 25%/15% unsecured/secured values are labelled "IRB Foundation default" (F-IRB supervisory LGDs are 45%/40% under Basel — these are platform floor conventions) |
| Downturn add-ons by collateral | property 0.08, equipment 0.10, financial 0.05, unsecured 0.12, inventory 0.10, receivables 0.08, cash 0.02, other 0.12 | "average LGD increase observed in downturn vs long-run" per EBA GL/2019/03 framing — calibration values are the engine's own |
| Country cycle severity (25 countries) | CH 0.70 … US 1.00 … ES 1.25, BR 1.30, GR 1.50 | commented "based on GFC / COVID data", unattributed |
| Sector multipliers (19 sectors) | Government 0.70 … Coal Mining 1.70, Oil & Gas 1.50, Airlines 1.45, Real Estate 1.40 | engine calibration |
| Climate stranded haircuts (8 sectors) | Coal 0.40, Oil & Gas 0.25, Thermal Power 0.20, … Chemicals 0.08; fossil-fuel collateral floored at 0.15 | forward-looking overlay, unattributed |
| Physical-risk LGD add-on | extreme 0.20, high 0.12, medium 0.06, low 0.02 | engine calibration |
| Green premium / brown discount (EPC A–G) | A −0.05, B −0.03, C −0.01, D 0, E +0.03, F +0.05, G +0.08 | energy-efficiency collateral-value adjustment, unattributed |
| Scenario multipliers | BASE 0.6, ADVERSE 1.0, SEVERE 1.5 | engine convention |

**Vintage tables:** ECB NPE calendar coverage (unsecured: 0%→35% yr1→100% yr2; secured: 0% through yr2 → 25/35/55/70/80/85% yrs3–8 → 100% yr9) — this matches the Pillar-1 prudential-backstop schedule of EU Reg 2019/630. Benchmark cumulative default rates by age (1.5% yr1 rising to 12.5% yr10, "IG + HY composite, long-run average" — plausible rating-agency-style values, unattributed). Early-warning threshold: cumulative DR > **1.5×** benchmark (`EARLY_WARNING_THRESHOLD = 0.50`).

### 7.3 Calculation walkthrough

**Downturn LGD:** (1) look up collateral add-on (unknown → "other" 0.12); (2) scale by country severity (unknown → 1.0), sector multiplier (unknown → 1.0) and scenario multiplier; (3) if climate overlay on: add stranded haircut × scenario_mult when the sector is in the haircut table or `is_fossil_fuel_collateral` (min 0.15), physical-risk add-on × scenario_mult, and the signed EPC adjustment; (4) apply floor key mapping (`_get_floor_key`: mortgage/residential → mortgage floors, unsecured split by RETAIL/SME/CORPORATE, etc.), then floor at long-run LGD and cap at 1.0. Contribution decomposition reports `country_adj = addon×(sev−1)×sector×scen` and `sector_adj = addon×sev×(mult−1)×scen`. Batch mode returns portfolio averages, uplift % and floor-hit count, all with human-readable `methodology_notes`.

**Vintage analysis:** cohorts keyed by origination year (or `YYYY-Qn`); per cohort: cumulative DR = defaults/count, IFRS 9 stage counts and `stage2_migration_rate = (S2+S3)/n`, NPE coverage = provisions/NPE balance, ECB shortfall = `max(Σ balance×required_pct − provisions, 0)`, early-warning vs age-matched benchmark, green share %. The vintage matrix buckets each default into `age = max(1, (months_to_default + 6) // 12)` (round-to-nearest-year) and only fills cells where `reference_year − vintage ≥ age` (unobservable cells are `None`). Worst/best vintage requires ≥ 10 exposures for significance.

### 7.4 Worked example — downturn LGD, Spanish oil & gas exposure, SEVERE scenario

Input: long-run LGD 30%, collateral `property`, country ES, sector Oil & Gas, `is_fossil_fuel_collateral=True`, physical risk `high`, EPC F, asset class CORPORATE.

| Component | Computation | Value |
|---|---|---|
| Downturn add-on | 0.08 × 1.25 (ES) × 1.50 (O&G) × 1.5 (SEVERE) | 0.2250 |
| Climate stranded | 0.25 (O&G table ≥ 0.15 fossil floor) × 1.5 | 0.3750 |
| Physical risk | 0.12 (high) × 1.5 | 0.1800 |
| EPC F brown discount | +0.05 | 0.0500 |
| **Downturn LGD** | 0.30 + 0.225 + 0.375 + 0.18 + 0.05 = 1.13 → cap | **1.0000** |
| Floor check | CORPORATE_SECURED floor 0.15 — not binding | — |
| Uplift | (1.00 − 0.30)/0.30 | **+233.3%** |

The 100% cap binds — a deliberately extreme stack showing additive climate overlays can saturate LGD. ECB backstop illustration: an unsecured NPE aged 1.4 years with balance €10M → `int(1.4)=1` → required coverage 35% = €3.5M; provisions of €2M leave a €1.5M shortfall.

### 7.5 Data provenance & limitations

- **No PRNG, no synthetic entities** — both engines are pure functions of caller-supplied exposures; the vintage analyzer raises on an empty portfolio rather than inventing one.
- The *structure* (reference-value downturn approach, floors, calendar provisioning, vintage triangles) tracks the cited regulations closely; the *calibrations* (add-ons, country/sector severities, climate haircuts, benchmark DRs) are unattributed engine values that a validator should treat as synthetic demo parameters.
- Downturn components are **additive**, so combined stresses can exceed 100% before capping; EBA GL/2019/03 in practice requires downturn LGD from realised downturn-period recovery data, not multiplicative scalars on a long-run mean.
- ECB backstop uses `int(npe_age_years)` (floor), giving the more lenient bucket for fractional ages; the real backstop also distinguishes exposures by guarantee/collateral type more granularly and applies only to post-26-April-2019 originations.
- Vintage age bucketing (`(months+6)//12`) rounds 7–18 months to age 1, etc.; benchmark comparison uses vintage calendar age, not exposure-weighted seasoning.
- Green trend is exposure-count-based (`green_amount_pct` merely mirrors `green_share_pct` — not amount-weighted despite the name).

### 7.6 Framework alignment

- **CRR2 Art. 181(1)(b) & EBA GL/2019/03:** downturn LGD ≥ long-run average, downturn conditions by collateral/country/sector — implemented as the scaled-add-on formula with the ≥-long-run floor enforced.
- **CRR2 Art. 164:** the 10%/15% residential/commercial mortgage LGD floors are reproduced exactly; other floors are platform extensions.
- **BCBS d350 / CRE 36.86-91 & ECB TRIM Guide Ch. 5:** cited as the IRB downturn-LGD supervisory basis; the contribution breakdown and methodology notes mirror TRIM's traceability expectations.
- **IFRS 9 B5.5.52-55:** collective assessment via vintage groupings — cohorts and stage-migration rates implement the grouping logic; stage counts feed SICR monitoring.
- **EU Regulation 2019/630 (NPE prudential backstop):** the unsecured/secured calendar coverage schedule is faithfully encoded (100% unsecured by year 2, 100% secured by year 9) and drives the shortfall metric.
- **EBA GL/2017/06 & ECB NPL Guidance:** vintage analysis and NPE coverage expectations as the monitoring framework the module operationalises.
