# A² Intelligence — Master Remediation Backlog

_Aggregates every correction found across the three test campaigns. Detail lives in the source docs;
this is the deduped, prioritized execution plan. Cross-layer duplicates are merged (noted **↔**)._

Sources: `docs/REMEDIATION_PLAN.md` (backend lineage) · `docs/FRONTEND_TEST_FINDINGS.md` (frontend) ·
`docs/ENGINE_BENCHMARK_REPORT.md` (calculation engines).

## Totals

| Layer | Corrections | Notes |
|---|---|---|
| Backend (lineage sweep) | **27** | 5 missing tables · 6 missing JOIN columns · 2 SQL bugs · re-clvar engine drift · duplicate router |
| Frontend (805-route sweep) | **2** (+1 obs) | 1 runtime TypeError · 3 React-key warnings · admin-401 observation |
| Calculation engines (benchmark) | **~60** | ~15 flagship formula/methodology bugs + ~45 random-as-data fabrication engines (34 CRITICAL + 11 HIGH) |
| **Already fixed** | — | dependency-pin P0 ✓ · `pcaf_sovereign_engine` ✓ (reference remediation) |

**Cross-layer dedup:** the backend "re-clvar engine drift" (REMEDIATION_PLAN Wave 1 D) **↔** the engine
finding "`CRREMStrandingEngine` defined 4× / shadowed" (ENGINE_BENCHMARK). One fix closes both.

---

## Wave 0 — safe, code-only, high-confidence (IN PROGRESS: 6 done, verified)
_No DB writes, no prod-data risk, each independently verifiable._

| # | Item | File | Status |
|---|---|---|---|
| 0.1 | GDPR gate dead (typo) | `services/ai_risk_engine.py:204` | ✅ `"high_right"`→`"prohibited"` |
| 0.2 | Walrus NameError | `services/climate_mrv_engine.py:460` | ⊘ FALSE POSITIVE (walrus in condition executes first; safe) |
| 0.3 | CRREM class shadowed ×4 **↔ re-clvar drift** | `services/crrem_stranding_engine.py` | ✅ deleted dup tail (742-EOF); engine functional, `assess_stranding` restored |
| 0.4 | Duplicate `/portfolios` router | `api/v1/routes/portfolios.py` | ✅ RESOLVED — confirmed dead code (referenced nowhere); file **deleted** |
| 0.5 | Frontend runtime TypeError | `REPortfolioDashboardPage.jsx:184` | ✅ `(p.regulation||'').includes(r)` |
| 0.6 | React key warnings (P3) | 3 pages | ⏸ DEFERRED — cosmetic |
| 0.7 | VaR tanh-CDF (proven 3–55×) | `services/var_calculator.py:_normal_cdf` | ✅ true Φ via erf; **bench PASS** (MC now 1.0× vs EL) |
| 0.8 | MC ASRF sign inverted | `services/monte_carlo_engine.py:319` | ✅ sign flipped to `+√ρ·Φ⁻¹(q)` (VaR/ES coherence refactor → Wave 2) |
| 0.9 | EAD × maturity adjustment | `services/ead_calculator.py:593` | ✅ maturity term removed from EAD |

**re-clvar route↔engine — RECLASSIFIED (not a Wave 0 fix).** CRREM un-shadowing (0.3) restored the class and fixed the `assess_stranding` AttributeError. But investigation shows the route and engines are **different data models**, not a method-name mismatch:
- Route `PhysicalInputs` collects *risk scores* (`wildfire_risk_score` 0-10, `heat_stress_days_2050`, `annual_expected_loss_pct`); `RECLVaREngine.calculate_clvar` needs *raw exposure* (`flood_depth_100yr_m`, `wildfire_proximity_km`, `water_stress_score`).
- Route `PropertyInfo` has **no `current_market_value`** — the engine needs it for every GBP figure.
- Route `TransitionInputs` lacks MEES `minimum_epc_required_2030/2033` + `retrofit_feasibility`.
A thin facade would have to **fabricate** these missing inputs — the exact anti-pattern being remediated. **Correct fix = design reconciliation (Wave 2):** expand the request schemas to collect the raw inputs the engines require (esp. market value + flood depth + MEES thresholds), then wire `calculate_clvar` / `assess_stranding(profile)` / `generate_decarbonisation_roadmap` / `calculate_pathway_trajectory` with real field mapping + an integration test. Do NOT ship a fabricating facade.

## Wave 1 — DB schema (IN PROGRESS — key finding: mostly QUERY BUGS, not schema gaps)
Investigation of the live DB flipped most of this from "DB writes" to safe **code fixes** (columns exist under different names). Alembic has **two heads (054, 135)** with an unapplied branch containing 027/038 + upload migrations.

**✅ Done + verified (lineage re-run: 500s → PASS/clean-404):**
- **6 "missing columns" = query bugs, fixed via aliasing** (no DB change): `agriculture` `country_iso AS country_code` + `crops_grown AS crop_types`; `insurance` `insurer_type AS entity_type` + `country_iso AS domicile_country`; `mining` `primary_commodity AS commodity` + `country_iso AS country_code` (×2 queries); `nature-risk` `bng_net_gain_pct AS biodiversity_net_gain_score` + water aliases (`total_water_recycled_reused_m3`, `water_intensity_m3_per_net_revenue`) + honest `NULL` for `discharge_high_stress_areas_m3`/`water_financial_effects_opp_eur`.
- **data-preview AmbiguousColumn** → qualified `c.column_name`. Verified PASS (real-db, 571 fns).
- **PE tables created** (applied migration 038 DDL out-of-band): `pe_deals`, `pe_portfolio_companies`, `pe_sector_risk_heatmap`, `pe_screening_scores`. Endpoints now PASS.
- **`mapping_templates`** table created from ORM model.

**✅ Wave 1 tail — DONE + verified (lineage re-run):**
- **`file_uploads` + `validation_errors`:** created via DDL **without** the broken `portfolios` FK (kept `portfolio_id` as plain indexed col — the FK target doesn't exist; real table is `portfolios_pg`). `uploads/*` endpoints now work.
- **SyntaxError ×3 root cause = `:param::uuid` cast** — confirmed broken in SQLAlchemy 2.0.30 (mis-parses the bind param). Fixed all 6 occurrences in `pcaf_regulatory.py` → `CAST(:x AS uuid)`. `eu-taxonomy/assessments/{id}` now **PASS real-db**; `pcaf/portfolios/{id}`, `sfdr/pai-disclosures/{id}` → clean `db-empty`.
- **`parameter_governance`:** reconciled queries to `calculation_parameters` real schema via aliasing (`category AS parameter_category`, `status AS approval_status`, `notes AS description`, `value AS value_numeric`, `NULL AS value_text/justification`). `value` is NUMERIC → clean mapping. `/parameters/{id}` now executes.
- **Systemic `:param::type` cast bug** (SQLAlchemy 2.0): swept repo — also in `nature_data.py` (fixed → `CAST`) + 2 batch ingesters (`wdpa_gfw_ingester`, `gem_coal_ingester` — noted, non-endpoint follow-up).

**⏸ Remaining (separate task):** Alembic **head-merge + `stamp`** — 038 + upload tables applied out-of-band due to the branched history (heads 054/135); migration state needs consolidating so a fresh DB is reproducible.

## Wave 2 — flagship engine methodology (per engine; medium effort, bench-gate each)

**✅ DONE + bench-gated (`benchmark/bench_quant.py`, 9/9 cases PASS):**
- **`renewable_project_engine`** — LCOE now discounts the energy denominator geometrically
  (NREL/IEA form) instead of a naive undiscounted linear-average; "IRR" replaced from
  `MOIC^(1/n)` with a real Newton-Raphson (bisection fallback) IRR on the cash-flow vector.
  `bench_renewable_project` (LCOE vs closed form; IRR vs independent bisection).
- **`carbon_calculator_v2`** — landfill CH₄ volume→mass now applies 0.717 kg/m³ density
  (was implicitly 1.0 → ~1.4× overstatement); REDD+ baseline-emission sign corrected (the
  inverted signs zeroed credits exactly when the project preserved carbon). `bench_carbon_credits`.
- **`eiopa_stress_engine`** — post-stress SCR now uses the Solvency II Annex-IV correlation
  matrix `√ΣΣ Corr·SCRᵢ·SCRⱼ` (+ operational outside the root, scaled to the input SCR) instead
  of a linear weighted sum that ignored diversification and could LOWER SCR under stress.
  `bench_eiopa_scr`.
- **`basel_capital_engine`** — (a) retail RW routed by sub-class correlation (res-mortgage 0.15,
  QRRE 0.04, other-retail curve) — was applying other-retail to ALL; (b) PD floor 3→5 bps
  (CRR3 Art 160); (c) climate multipliers QUARANTINED out of Pillar-1 RWA/ratios (Pillar-2 memo
  only) — no more fabricated solvency ratios / green-supporting-factor capital relief; (d) Basel
  III.1 output floor (72.5% of SA credit RWA) now actually applied under IRB. `bench_basel_capital`.
- **`real_estate_valuation_engine`** — DCF NOI now escalated from revenue/expense streams seeded
  by an explicit stabilized margin; removed the `expense_growth + inflation` DOUBLE-COUNT (which
  drove NOI negative) and the 1.5×/0.5× magic split. `bench_real_estate_dcf`.
- **`cbam_calculator`** — investigated: free-allocation direction is **CORRECT** (net = gross·(1−free%);
  schedule matches EU CBAM Art.31 phase-in exactly). Benchmark finding was a **FALSE POSITIVE**;
  pinned with `bench_cbam_direction` so it can't silently regress.

**✅ DONE — rng-purge quartet (bench-gated; each engine now fully deterministic, 0 rng):**
- **`climate_stress_test_engine`** — 26 rng calls purged. All `+ rng.uniform` jitter stripped off the
  (correct) deterministic loss formulas; `physical_loss` uses a fixed mid-horizon factor; the
  one-directional `+rng.uniform(5,20)` taxonomy-alignment BIAS removed; and the worst offender —
  `assess_portfolio_resilience` `avg_loss = rng.uniform(1,15)` that ignored the portfolios — now
  computes each portfolio's loss from its REAL sector mix. `import random` deleted. `bench_climate_stress_purge`.
- **`climate_insurance_engine`** — physical "Climate VaR" was `AAL(0.25%) × arbitrary 10`; now the
  modelled **1-in-100yr PML** (the actual 99th-pctile loss), from a caller-supplied PML ratio or the
  NatCat reference table (same one `calculate_natcat` uses). `bench_climate_insurance_var`.
- **`eba_pillar3_engine`** — 20 rng calls purged. Now threads the previously-ignored `portfolio_data`
  and derives GAR / financed emissions (PCAF `exposure×EF`) / hazard heatmap from real inputs; emits
  honest `None` + `insufficient_data` warnings when a binding disclosure lacks data. `bench_eba_pillar3_purge`.
- **`basel3_liquidity_engine`** — 22 rng calls purged (LCR/NSFR/ALM cores were already correct).
  Climate HQLA haircuts → deterministic bps; unmapped ASF/RSF → conservative supervisory bounds
  (0% / 100%) + note; stress outflows require real funding bases (else null + note); survival days →
  monotone map of stressed LCR; fabricated balance-sheet defaults → deterministic, flagged in
  `data_assumptions`. `bench_basel3_liquidity_purge`.

**✅ DONE — re-clvar reconciliation (`api/v1/routes/re_clvar.py`), Wave 2 COMPLETE:**
Root cause: every endpoint 500'd because the route called **methods that don't exist**
(`RECLVaREngine().calculate(...)`, `CRREMStrandingEngine().assess_stranding(property_info=...)`,
`.generate_roadmap()`, `.get_pathway()`) and the request schemas were a different data model than
the engine dataclasses. Fix:
- **Expanded request schemas** to collect the RAW inputs the engines need: `flood_depth_100yr_m`,
  `heat_days_above_35c`, `wildfire_proximity_km`, `water_stress_score` (physical);
  `minimum_epc_required_2030/2033`, `retrofit_feasibility`, `green_certification` (MEES transition);
  `region`, `last_refurbishment_year` (property). Dropped the unused mismatched fields.
- **Wired the real convenience wrappers**: `calculate_clvar_for_asset(...)` and `assess_asset_stranding(...)`
  (primitive-typed, they build the enums/dataclasses internally) + `get_pathway_intensity` /
  `calculate_pathway_trajectory` / `generate_decarbonisation_roadmap` with correct field mapping.
- **Honest-null contract**: monetary GBP CLVaR is returned only when a market value is supplied,
  else null + flagged in `missing_fields` (no fabricated £ figures). Absent hazard/transition inputs
  fall back to conservative defaults, each flagged in `missing_fields`.
- **Corrected the CRREM response semantics** from carbon (kgCO₂/m²) to the engine's real ENERGY
  intensity (kWh/m²) — no fabricated carbon pathway. (Safe: the endpoints never worked before.)
- **Integration test** `tests/test_re_clvar_wiring.py` — 18/18 checks, all 5 endpoints exercised
  end-to-end (CLVaR full + no-market-value, stranding, roadmap, pathways, portfolio).

### 🎉 Wave 2 COMPLETE — 11/11 (10 engines + re-clvar), all bench/integration-gated.

## Wave 3 — random-as-data sweep ✅ COMPLETE (56 engines, 6 batches of parallel remediation agents)
Burned down the fabrication surface from **1497 hits → 0** across all 56 `wave3_todo` engines
(pcaf_sovereign recipe: keep genuine core → replace each `rng` with a real caller-input computation
via a **None-default optional param** OR an explicit honest `None`/`"insufficient_data"` → preserve
response field names → import+route-test). Every engine verified by me (guardrail scan confirms 0 rng +
import test); baseline ratcheted down after each batch; **zero regressions**; Wave-2 flagship bench still
**12/12**. Backward-compatible throughout (existing route callers pass no new params → get honest nulls).
The guardrail baseline now contains **only the 7 legitimate-MC files** (var_calculator, monte_carlo_engine,
re_clvar_engine, climate_derivatives, sub_parameter, builder, demo_portfolio_seeder; carbon_calculator's
opt-in `default_rng` MC is also genuine and not flagged). Bonus: agents fixed 5 latent crash/logic bugs
(`float(None)` TypeErrors, a div-by-zero, a DQS inversion).

Full per-batch engine list in `memory/project_engine_benchmark.md`.

## Guardrail — SHIPPED + CI-WIRED (`backend/tools/check_no_fabricated_random.py` + `fabrication_baseline.json`)
Ratchet scanner over **`services/` AND `api/`** (path-keyed baseline): fails if any tracked file's rng
count rises or a new file appears; `--report` prints the surface, `--update-baseline` ratchets down.
Wired as a **CI hard-gate** via `.github/workflows/no-fabricated-random.yml` (runs on every push/PR;
pure-stdlib, no deps). Allowlist = 7 genuine-MC engines + `api/v1/routes/portfolio_pg.py` (labeled
demo-seed). The `api/` route sweep found only `forced_labour.py` (fixed — LkSG coin-flip → honest gap)
and `portfolio_pg.py` (legit demo). Surface = **0**.
