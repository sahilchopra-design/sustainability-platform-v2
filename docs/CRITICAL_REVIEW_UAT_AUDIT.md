# Critical Review — Persona-Aligned + Functional
### Bugs · Issues · Missing Tests · UAT Scripts · Audit Checklist

*Compiled 2026-07-06 from measured evidence: the 292-domain/2,528-endpoint lineage
sweep, bench_quant results, live curl verification, and the session bug ledger. Every
item below is either verified live or explicitly marked as untested. Nothing here is
speculative filler.*

---

## Part A — The four critical user profiles

Each persona gets: what they touch, what will break their trust first, verified state,
and their UAT script. UAT convention: ✅ verified working live · ⚠️ works with a
disclosed limitation · ❌ known broken / blocked · ◻ untested (nobody has looked).

### A1 · Financial Services user (CRO / portfolio & credit risk analyst)

**Touches:** portfolio-analytics, physical-risk-pricing (E104), stress-test
orchestrator (E100), Basel capital / Basel III liquidity, XVA / FRTB, climate-credit
integration, PCAF financed emissions, SFDR/Pillar 3 disclosure, Financial Modeling
Studio, GLEIF entity resolution, sanctions screening.

**Trust-breakers for this persona, in order:** (1) a number that changes between two
identical runs, (2) a regulatory formula that's subtly wrong, (3) a 500 on a core
listing page, (4) demo data not labeled as demo.

**Verified state:**
- ✅ Determinism: stress-test, Basel liquidity, climate-insurance engines proven
  deterministic (2 identical calls) in bench_quant; PRNG-as-data purged platform-wide
  and CI-gated.
- ✅ Formula correctness on flagships: VaR (MC vs parametric vs hand-calc), PCAF WACI,
  Basel retail risk-weight routing + 5bps PD floor + 72.5% output floor, Solvency II
  SCR correlation aggregation, CBAM free-allocation phase-out — all hand-verified.
- ✅ Portfolio list/detail/dashboard/holdings — fixed 2026-07-05 (NULL `updated_at`
  crash) and live-verified 200 with real data (3 portfolios, real holdings).
- ⚠️ Only 3 portfolios exist in the DB; portfolio-scoped features are functionally
  verified but not volume-tested (no 500-holding portfolio exists).
- ⚠️ E104 physical-risk pricing frontend page still renders its legacy seeded-random
  path for some tabs (documented guide↔code mismatch in the Atlas deep-dive §7); the
  real engine is live and correct but the page's wiring upgrade is specced (§8), not
  fully done. **This is the single most audit-sensitive known issue for this persona.**
- ◻ XVA/FRTB and DCM engines: reachable, atlas-documented, not in bench_quant.

**UAT script (financial):**
1. Create/list portfolios; open dashboard, holdings, analytics for each. Expect 200s,
   real derived KPIs, no console errors.
2. Run the same stress scenario twice → byte-identical results.
3. Price one asset via E104 `/price` with lat/lng; confirm every displayed number on
   the page traces to the response (not the seeded generator) — currently ⚠️ partial.
4. Resolve an entity by name → LEI via typeahead; confirm `resolution_tier` shown;
   screen it against sanctions.
5. Generate a Pillar 3 / SFDR PAI disclosure with an empty portfolio → expect honest
   `insufficient_data` warnings, never invented values (bench-verified behavior).
6. Attempt a mutating call while logged out with `REQUIRE_AUTH=true` → expect 401.

### A2 · Energy & Power desk user (PPA originator / project financier)

**Touches:** ppa-structuring-desk, financial-modeling-studio (NGFS-integrated project
finance), grid-carbon-intelligence (GB+US+EU), BESS stacking, hydrogen/P2X, tax equity
& transferability, yieldco analyzer, energy-transition credit portal, NASA
POWER/Open-Meteo resource data, EIA/ENTSO-E backbone.

**Trust-breakers:** resource/price data that doesn't vary by location (screams fake),
stale grid mix, an IRR that disagrees with Excel.

**Verified state:**
- ✅ LCOE discounted-denominator and real-IRR bisection hand-verified in bench_quant
  (the old MOIC^(1/n) proxy bug is fixed and pinned by the benchmark).
- ✅ NASA POWER wiring proven with genuinely different yields (Seville solar vs North
  Sea wind) vs the old default-table path.
- ⚠️ EIA + ENTSO-E need free API keys — unset, endpoints return labeled seeded
  fallback. Functional, but the desk must know GB is the only fully-live grid region
  out of the box.
- ⚠️ Open-Meteo climate projections: upstream API cannot switch SSP scenarios
  (always ~RCP8.5) — disclosed via `upstream_scenario_selectable: false`; the UI must
  keep surfacing this or the desk will assume scenario differentiation that isn't real.
- ◻ Financial Modeling Studio's full scenario-matrix × QMC path: built and doc'd, never
  benchmark-tested against a hand model. **Highest-value missing test for this persona.**

**UAT script (energy):**
1. Structure a PPA for two real locations with different resource regimes; confirm
   capture rates / yields differ plausibly and cite NASA POWER as source.
2. Build a project-finance model in the Studio; export assumptions; replicate IRR in a
   spreadsheet within tolerance. (◻ — do this once, then pin it in bench_quant.)
3. Check grid-carbon for GB (live) vs US/EU (labeled fallback if keyless) — labels must
   be visibly different.
4. Tax-equity flip: verify the partnership-flip solver's flip year against the known
   hand example in its Atlas deep-dive.
5. BESS stacking: run a revenue stack, then re-run with one market disabled — total
   must drop by exactly that stream.

### A3 · Supply Chain user (procurement / Scope-3 / trade-compliance analyst)

**Touches:** supply-chain (scope3), cbam-trade-exposure-mapper, UN Comtrade flows,
supply-chain-resilience / network-viz / map, EUDR plot overlap (spatial.py),
sanctions-screening-desk, counterparty-ownership-graph, Violation Tracker, maritime.

**Verified state:**
- ✅ CBAM phase-out factors match official 2026–2034 schedule exactly (bench-pinned).
- ✅ Scope-3 endpoints validate inputs strictly (empty activity list → clean 400, not a
  crash) — verified in the sweep.
- ✅ GLEIF golden record + ownership graph + sanctions pre-resolve: live-proven chain
  (Novo Nordisk live-resolve → cache test).
- ⚠️ UN Comtrade preview tier = 1 period/request — comparative multi-year trade flows
  are rate-limit-constrained without a key; the mapper's live-vs-seeded comparison
  discloses this.
- ⚠️ EUDR plot-overlap and protected-area screens run against **empty**
  `ref_protected_areas` (WDPA license deferred) → return empty results *by design*,
  with a "returns empty until reference data is loaded" note. A supply-chain user who
  misses that note gets false negatives on deforestation screening. **The note must be
  un-missable in the UI before any client demo of EUDR features.**
- ❌ `maritime/fleet-assessment`: crashes on None inputs (`float() argument must
  be… NoneType`) — real defensive-coding gap surfaced by the sweep, unfixed (was
  mock-triggered but the same crash occurs on any real payload with a null field).
- ◻ supply-chain-network-viz under a large (>100 node) network: never load-tested.

**UAT script (supply chain):**
1. Map CBAM exposure for a steel importer; verify 2030 factor = 48.5%.
2. Run Scope-3 with a deliberately empty category list → expect a clean 400 message.
3. Screen a counterparty end-to-end: typeahead → LEI → ownership graph → sanctions.
4. Run an EUDR plot check → confirm the empty-reference-data disclosure is visible ⚠️.
5. Submit a fleet assessment with a missing vessel field → currently ❌ 500; retest
   after fix.

### A4 · Manufacturing / Industrials user (decarbonization & compliance lead)

**Touches:** green steel, cement/industrial CCS, SAF, abatement-cost-curve (MACC),
industrial heat, circular economy modules, CBAM (producer side), EU ETS / ETS2
obligations (regulatory-calendar), ISSB S2 / CSRD disclosure, real-estate/facility
energy (EPC), physical-risk exposure of plants (Global Physical Risk Atlas E121).

**Verified state:**
- ✅ Regulatory calendar fixed 2026-07-05 (3 endpoints were 500-ing on a
  private-attribute access) — now returns 12 frameworks / 25 obligations incl. ETS2
  monitoring-plan deadlines, live-verified.
- ✅ Facility physical-risk: point-profile at any plant lat/lng returns 5-hazard
  composite with per-hazard `data_availability`; spot-checked against real geography
  (Tokyo seismicity, Miami cyclone, Australian fire regions).
- ⚠️ Wildfire hazard is country-level resolution (uniform score within a country) —
  a manufacturing user comparing two plants in the same country sees no wildfire
  differentiation; disclosed in engine + atlas but must be understood before siting use.
- ⚠️ MACC page is a static 30-measure library (tier-B, no backend) — fine for
  illustration, not company-specific; its Atlas entry says so.
- ◻ Green steel / SAF / CCS engines: atlas-documented with worked examples, none
  bench-pinned.
- ◻ UK EPC integration requires a GOV.UK One Login token (manual web flow) — the
  facility-energy path has never run against live EPC data in this environment.

**UAT script (manufacturing):**
1. Pull the ETS2/CBAM obligation list for an EU industrial entity; check deadlines
   against the official calendar.
2. Profile 3 real plant coordinates in the Physical Risk Atlas; verify hazard scores
   differ sensibly and `data_availability` is honest (e.g. flood "not sampled" inland).
3. Run a green-steel transition cost per tonne; sanity-check against the worked example
   in `docs/module_atlas/deep/`.
4. Confirm every industrial page shows Live vs Demo badges correctly with backend
   stopped (frontend must degrade honestly, not silently).

---

## Part B — Functional review (cross-persona)

### B1 · Known open bugs (verified, unfixed as of 2026-07-06)

| # | Where | Symptom | Evidence | Priority |
|---|---|---|---|---|
| 1 | `maritime/fleet-assessment` | 500 on null numeric fields (`float(None)`) | lineage sweep + code read | P1 — defensive-input gap on a real route |
| 2 | Legacy `/portfolios` router (non-v1) | Dead code: unmounted, 404s; SQLAlchemy mapper for `Portfolio(portfolios)` fails to init (`FileUpload` name unresolved) if ever imported | sweep + live 404 | P3 — delete/park the dead router |
| 3 | E104 frontend page | Displays seeded-random values on some tabs while the real engine response is discarded | Atlas deep-dive §7 (documented mismatch) | P1 for financial persona credibility |
| 4 | `gbif-screening`, `nasa-power`, `open-meteo` routes | `round()` on string query params — works via FastAPI coercion over HTTP but crashes on direct call; fragile typing | sweep (mock-triggered, type-hint gap is real) | P3 — add explicit float coercion |
| 5 | `scenarios/{id}/preview` | `ModuleNotFoundError: No module named 'backend'` — an absolute-import assuming a different working directory | sweep | P2 — breaks under uvicorn from repo root |
| 6 | `valuation/cost/replacement` + `valuation/income/direct-capitalization` | `TypeError: unsupported operand for *: Decimal and float` — Pydantic Decimal fields multiplied by float constants; fails on real payloads, not just mocks | sweep | P2 — real-estate persona calculators |
| 7 | `valuation/map-data` | `float(None)` crash — same defensive-input class as bug #1 | sweep (real-db provenance) | P2 |
| 8 | `bess_stacking._daily_dp_dispatch` (BESS module) | "DP-optimal" dispatch is only optimal at `cycles_cap=1.0`; at `cycles_cap>1.0` it under-utilises the quantised multi-cycle budget and **underperforms greedy** (−14% at 1.5cyc / −11% at 2.0cyc, delivers fewer cycles) — so `dispatch_compare.uplift_pct` can be negative, contradicting the "measured uplift" claim | found by new `bench_bess_dispatch_invariants` in `bench_quant.py` (2026-07-12) | P2 — refine the DP budget/SoC quantisation for multi-cycle batteries |

*(The 6 bugs found in the 2026-07-05 sweep — portfolio analytics ×2, climate-risk
import, data-lineage keys ×3-sites, regulatory-calendar ×3-endpoints, exposure SQL
column — are FIXED and live-verified; listed in `docs/DEPLOYMENT.md` and the git log,
kept out of this open table.)*

### B2 · Known issues / limitations (not bugs — disclosed behavior to track)

1. `REQUIRE_AUTH=true` currently ON in local dev `.env` — all POSTs 401 without a
   session; intentional (production posture) but surprises local testing.
2. Alembic two-heads / DB stamped at 135 — migration system unusable until a merge
   migration is written; all schema work must go through direct DDL + a documentation
   migration file (established pattern).
3. `ref_protected_areas` empty (WDPA license deferral) — EUDR/protected-area screens
   return empty by design.
4. Hazard-grid resolution asymmetry — earthquake/cyclone true 2°×2° global; wildfire
   country-level; flood/sea-level named-location samples. Composite engine handles it;
   users must not assume uniform precision.
5. In-memory rate limiter — resets on restart, not shared across instances.
6. 50 npm audit findings — all in webpack-dev-server/ws/sockjs (dev-only, absent from
   the production static bundle). Revisit only if CRA tooling is upgraded.
7. ~150 pre-existing duplicate route registrations from earlier sprints (flagged during
   wave-1 verification) — harmless (FastAPI first-match wins) but inflates the route
   table and slows collision checks.
8. Lineage-harness blind spots: 635 mutation endpoints never exercised (read-only
   guard); `Request`-object handlers and Pydantic-body endpoints partially mockable
   only. A staging-DB write-mode sweep would close this.

### B2b · Engine-layer coverage matrix (297 engines, measured 2026-07-06)

Full inventory: `docs/ENGINE_CATALOG.md` (231,734 LOC / 3,264 functions). Trust tiers:

| Tier | Engines | What it means | Gap |
|---|---|---|---|
| Bench-pinned | 12 | Numerical hand-computed reference cases in `bench_quant.py`, run on demand + after engine edits | — |
| Atlas-audited | 293 | MRM methodology read + §7/§8 deep-dive + fabrication purge (~65 fixes) | Audit ≠ numerical regression; a future refactor can silently break formulas |
| Lineage-traced only | all reachable | Call-tree + SQL provenance recorded; proves reachability and provenance, not correctness | 635 mutation endpoints never traced |

**Coverage skew worth knowing:** the 12 pinned engines cluster in prudential/PCAF/
climate-risk. Zero pins exist in: capital-markets (DCM's 56 methodologies, XVA,
Financial Modeling Studio), carbon-credit pricing (CDM tools, Article 6), nature/TNFD,
supply chain, and DME — i.e. two of the four critical personas (energy partially,
supply chain fully) run on audited-but-unpinned engines. The B3 table ranks the fixes.

**Largest unpinned engines (refactor-risk proxy):** `activity_guide_catalog` (6,218
LOC), `data_lineage_service` (5,423 — self-tests via the harness using it),
`peer_benchmark_engine` (3,502), `cdm_tools_engine` (2,538, 50 tools),
`sfdr_pai_engine` (2,044).

### B2c · Database data-quality findings (577 tables, live-measured 2026-07-06)

Full inventory: `docs/DATABASE_CATALOG.md`. Headline: ~350k rows, **74% of tables
empty** — mostly by design (write-side verticals, mutation endpoints untested by
design, deferred sources). The *suspicious* subset, persona-weighted:

| Finding | Evidence | Persona impact | Action |
|---|---|---|---|
| `entity_lei` = **3 rows** (Deutsche Bank, Novo Nordisk, Apple — all JIT test resolves) | live COUNT | Financial: "golden source" is actually a lazy cache; typeahead cold-misses go to live GLEIF each time | Run the (already-fixed) weekly bulk ingester once at scale; verify ≥100k LEIs |
| Portfolios & holdings group: 39 tables, 83 rows total, 8 populated | catalog | Financial: everything portfolio-scoped is thin-data-verified only | Seed a realistic 200–500-holding portfolio before UAT |
| Carbon & credits group: 16 tables, 22 rows | catalog | Carbon desk demos run almost entirely on engine computation + seeds, not stored book | Acceptable if disclosed; seed a demo book for client sessions |
| `ref_protected_areas` = 0 | by decision (WDPA license) | Supply chain: EUDR false negatives (A3 ⚠️) | Keep disclosure un-missable; revisit license pre-client |
| Climate scenarios: 46/58 tables empty but `ngfs_scenario_timeseries` (7.3k) carries the load | catalog | Low — engines read the populated spine | Confirm no engine silently reads an empty sibling table (grep pass) |
| `dh_data_sources.cost` varchar(10) truncation | ingester logs (non-blocking warnings every run) | None functional; log noise masks real warnings | Widen column (direct DDL + doc migration) |
| Geometry-type inconsistency across `ref_*_zones` (POLYGON vs MULTIPOLYGON) | geometry_columns + the wildfire 0-row incident | Any future spatial writer | Documented in CLAUDE.md; consider normalizing to MULTIPOLYGON |
| Raw-SQL-inserted rows bypass ORM defaults (NULL `updated_at` class) | 2 shipped bugs | All | Pattern documented; audit other NOT-NULL-by-model/NULL-in-DB columns |

### B3 · Missing-test inventory (ranked by risk × usage)

| Gap | Risk | Suggested minimal test |
|---|---|---|
| Financial Modeling Studio IRR/QMC vs hand model | High — flagship financial output | One pinned scenario in bench_quant (assumptions → known IRR/DSCR) |
| Mutation-endpoint sweep (635 endpoints never called) | High — writes are the least-tested surface | Lineage harness `--allow-writes` against a disposable branch DB |
| Engine unit tests beyond the 12 benchmarked (286 engines) | Medium-high | Prioritize by atlas `blast_radius`: top-20 shared engines first |
| Frontend interaction tests (0 exist) | Medium | Playwright smoke: login → 4 persona landing pages → 1 calc each |
| Hazard-grid regression (re-ingestion can silently regress, proven twice) | Medium | Pin the §7.4 spot-check table (Tokyo/Miami/Kazakhstan expectations) as a script |
| RBAC matrix (role × module allow/deny) | Medium — security-relevant | Table-driven middleware test: 3 roles × 6 paths |
| Volume/perf (large portfolio, >100-node network, full-globe region query) | Low-medium | One scripted load pass, record baselines |
| Ingester idempotency (re-run each of 19 → same row counts) | Low | Nightly scheduled run + count diff |

### B4 · Audit-review checklist (for an external reviewer / client due-diligence)

**Methodology audit**
- [ ] For each engine in scope: read `docs/module_atlas/deep/<module>.md` §7/§8 — every
  formula, parameter provenance, and limitation is documented there; verify against code.
- [ ] Re-run `python backend/benchmark/bench_quant.py` — expect 12/12 PASS.
- [ ] Re-run `python backend/tools/check_no_fabricated_random.py` — expect 0 hits.
- [ ] Spot-check 3 "honest-null" paths: empty portfolio → Pillar 3, no-data NDC →
  `insufficient_data`, 0-hazard point → `composite_score: null`.

**Data provenance audit**
- [ ] Pick 5 displayed numbers across personas; trace each via the lineage trace files
  (`backend/lineage_output/traces/<domain>.json`) to source table/API.
- [ ] Verify Live/Demo badges flip correctly when the relevant API key is unset.
- [ ] Confirm WDPA data absent (license) and Open-Meteo scenario limitation disclosed.

**Security & access audit**
- [ ] `REQUIRE_AUTH=true`: anonymous POST → 401 on 5 sampled mutating endpoints.
- [ ] RBAC: restricted user hits a disallowed module → frontend hard-block AND backend denial.
- [ ] Secrets: `git log -p | grep`-style scan + confirm `.env` never committed;
  `SECRET_KEY` in production differs from repo placeholder.
- [ ] Audit log captures a sampled mutating request end-to-end.

**Change-control audit**
- [ ] CI guardrail present and green on the default branch.
- [ ] Deployment runbook (`docs/DEPLOYMENT.md`) blockers all cleared before any prod tag.
- [ ] Alembic-heads exception documented and accepted (or resolved) in writing.

---

## Part C — Suggested execution order

1. Fix B1 open bugs #1 and #5 (small, real, user-visible). Re-sweep those domains.
2. Wire the E104 page to its engine (B1 #3) — the highest-credibility financial fix.
3. Pin the Financial Modeling Studio benchmark (B3 top) into bench_quant.
4. Run the four persona UAT scripts above end-to-end; convert every ◻ to ✅/⚠️/❌.
5. Then the audit checklist is ready to hand to an external reviewer.
