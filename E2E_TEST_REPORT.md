# End-to-End Test Report — Modules, Calculation Engines & Data Lineage

**Date**: 2026-07-11 · **Branch**: `claude/climate-risk-collateral-framework-fo8asf`
**Scope**: every frontend module route (browser E2E against the production build), frontend & backend
calculation engines, the data-lineage engine, and the full module-registry lineage chain through Supabase.

---

## 1. Executive Summary

| Layer | Coverage | Result |
|---|---|---|
| **Browser E2E — all module routes** | 252 pages (251 module routes + home), production build in headless Chromium | **252 / 252 PASS** (after fixing 3 crashed modules found by the sweep) |
| **Deep interaction tests** | 12 key modules, every visible button/tab clicked | **12 / 12 PASS** |
| **Frontend calculation engines** | 15 numeric/invariant tests across 4 engines | **15 / 15 PASS** |
| **Backend engine & unit tests** | 2,193 tests, 54 files | **1,604 pass, 22 skip — every unit-level failure fixed** (+31 vs. baseline). All 567 remaining failures sit in 26 live-server integration files (`requests` → `localhost:8001` + DB) that cannot execute in this sandbox — verified file-by-file, zero non-environment failures remain |
| **Data lineage engine** | 80 dedicated tests + live multi-hop trace | **80 / 80 PASS** · 88 signatures · 228 edges · **0 orphan references** (was 27) |
| **Registry lineage chain** | App.js → moduleCatalog.js → Supabase → anon read | **Identical MD5 at all 4 stages** (`e4693f58…`, 251 routes) |

**11 genuine defects were found and fixed** — 3 crashed frontend modules, 1 silent calculation error,
and 7 backend code/test-contract defects.

---

## 2. Browser E2E — Full Route Sweep

Method: production build (`react-app-rewired build`) served statically with SPA fallback; headless
Chromium (Playwright) visits every route, asserts React mounts real content into `#root`, and
captures page errors, console errors, and React crash signatures. 12 flagship modules additionally
get an interaction pass (every visible button clicked, page must survive).

- Initial sweep: **249 / 252 pass — 3 modules crashed to a blank page in production**:
  1. `/climate-physical-risk` — crashed on load
  2. `/scenario-stress-test` — crashed on load
  3. `/re-portfolio-dashboard` — crashed on load
- Final sweep after fixes: **252 / 252 pass, 12 / 12 deep-interaction pass, 0 console-error failures**
  (2 benign warnings). Evidence: `scratchpad e2e_results.json` / `e2e_final.log` (test run artifacts).

Supabase fetches are blocked by this sandbox's network policy, which incidentally proved the
Team Access Hub's offline fallback path: it renders the full 251-module directory from the
build-time catalog when the DB is unreachable.

## 3. Defects Found & Fixed — Frontend

| # | Module | Defect | Fix |
|---|---|---|---|
| 1 | Physical Risk Engine page | `PHYSICAL_MULTIPLIERS[ssp]` — data is keyed hazard-first, page indexed it SSP-first → crash on load | SSP-first view built via `sspMult()`; used at all 3 sites |
| 2 | Physical Risk Engine page | Country table built scalars then sorted by `.composite`; rows used `c.country`/`c.ndgain` (fields are `name`/`ndGain`) → empty/garbage table | Rows built with correct fields + composite from the service function |
| 3 | Physical Risk Engine page | NGFS tab read `s.physicalRisk`, `s.sspEquiv`, `s.sovereignSpread` — none exist on `NGFS_PHASE4` → crash on tab open | `physicalRiskScore`, `sovereignSpreadBp`, and a temp→SSP mapping (`sspEquivFor`) |
| 4 | Physical Risk Engine page | Adaptation tab: `c.country`/`c.ndgain` again + ND-GAIN×0.92 proxy for adaptation capacity | Correct fields; real `adaptCapacity` from dataset |
| 5 | Scenario Stress Tester | `SECTOR_PD_UPLIFT` (20 rows) zipped **by index** with `SECTOR_LGD_UPLIFT` (10 rows) → crash beyond row 10, **and rows 5–9 silently used the wrong sector's LGD** (Chemicals got Real-Estate haircuts) | Join **by sector name**; sectors without collateral-haircut data get explicit zero uplift |
| 6 | RE Portfolio Dashboard | `p.regulation.includes(r)` — some properties have no `regulation` field → crash | `(p.regulation \|\| []).includes(r)` |

Defect #5 is the notable one: it was both a crash **and** a wrong-number bug — the credit-loss
uplift table showed incorrect stressed EL for 5 sectors before it crashed on the 11th.

## 4. Defects Found & Fixed — Backend

| # | Component | Defect | Fix |
|---|---|---|---|
| 7 | `services/data_lineage_service.py` | 2 of 73 `MODULE_SIGNATURES` missing required `label`/`category` (`double_materiality_engine`, `sfdr_pai_engine`) → lineage graph/reference-data APIs raised `KeyError` | Keys added |
| 8 | `services/data_lineage_service.py` | 27 dependency-edge references to modules not in the registry: 8 naming-drift aliases (e.g. `csrd_engine` vs `csrd_auto_populate`, `pcaf_engine`, `entity360_engine`) + 15 real services (e.g. `re_clvar_engine.py`, `supply_chain_scope3_engine.py`, `green_premium_engine.py`) whose signatures were never registered | Aliases renamed to canonical keys; 15 new signatures registered. Graph now: **88 signatures, 228 edges, 0 orphans** |
| 9 | `services/pd_backtester.py` | `np.trapz` — removed in NumPy 2.0; `requirements.txt` pins `numpy==2.4.2` → AUROC computation crashed (28 tests + 5 collection errors) | `np.trapezoid` |
| 10 | `schemas/scenario.py` | `ScenarioVariable` and `ScenarioDataRefreshRequest` documented in the schema package's DELIVERY_SUMMARY and imported by tests/examples, but never implemented | Both schemas added; `ScenarioCreate` also gained its missing `json_schema_extra` example |
| 11 | `tests/` (contract drift) | `test_lgd_vintage` floor test used a fixture where the CRR Art. 164(4) floor can't bind (base 5% + 7.2% add-on > 10% floor); `test_schemas` scenario tests written against a schema shape that never existed; stale category vocabulary in lineage tests | Fixture lowered so the floor genuinely binds (engine semantics are correct); tests aligned to the real `ScenarioCreate` contract; category vocabulary synced |

Backend suites touched by fixes — all green: **data lineage 80/80 · climate physical risk 57/57 ·
climate transition risk 52/52 · PD backtester 56/56 · LGD vintage/downturn 62/62 · schemas 97/97.**

**Remaining full-suite failures are environment-gated, not defects**: the bulk of the 54-file suite
consists of live-server integration tests (`requests` against `http://localhost:8001/api/v1/...`)
that need the FastAPI backend running against the Supabase Postgres — this sandbox's network policy
blocks direct DB connections, so they cannot execute here. They are the right next step in a CI
environment with `REACT_APP_BACKEND_URL` + database access.

## 5. Calculation Engine Verification (frontend, 15/15)

`climateRiskDataService` (shared by stress-test/credit/physical-risk modules):
- 6 NGFS Phase IV scenarios: unique ids, complete numeric fields, carbon prices rise 2030→2050,
  Hot House physical risk > Orderly (narrative consistency)
- 20-sector PD uplift × 6 scenarios complete; LGD table name-join is total (fix #5 invariant)
- Physical multipliers: 6 hazards × 4 SSPs, **monotone in SSP severity**
- `getCountryPhysicalRisk`: bounded [0,10] for all 50 countries × 4 SSPs, monotone in SSP, null-safe
- `computeCBAMCost`: zero at zero carbon price, increasing in price

Climate-Adjusted Collateral Framework engine (EP-AJ7):
- Full 3-scenario × 3-horizon × 60-item grid: finite, non-negative, haircut ≤ 90% cap, LGD ∈ [5%, 95%]
- MEES pathway curves ordered (No-Tightening ≤ Current ≤ Proposed ≤ Ambitious) for every EPC band
- Earlier insurer retreat never decreases the physical add-on; transition add-on increasing in carbon price

Module catalog: 255 nav entries / 251 unique routes / 40 groups — exactly matching the Supabase seed.
Materiality engine: loads and exposes its callable API.

## 6. Data Lineage — End-to-End Chain Verification

**Registry lineage (module catalog through the stack)** — MD5 of the sorted route set at each stage:

| Stage | Source | Routes | MD5 |
|---|---|---|---|
| 1 | `App.js` NAV_GROUPS (source of truth) | 251 | `e4693f584b3b03987bcf24303b0da3f3` |
| 2 | `src/data/moduleCatalog.js` (build-time fallback) | 251 | `e4693f584b3b03987bcf24303b0da3f3` |
| 3 | Supabase `platform_modules` (team DB) | 251 | `e4693f584b3b03987bcf24303b0da3f3` |
| 4 | Same table read **as the `anon` role** (what the deployed app sees through RLS) | 251 | `e4693f584b3b03987bcf24303b0da3f3` |

Chain is bit-identical end to end; all 251 access rows enabled.

**Lineage engine (backend)**: 80/80 tests pass; live `trace_lineage('ecl_climate_engine')` returns a
complete multi-hop `LineageChain` (~71 KB) across the now fully-consistent 88-node / 228-edge graph.
Referential integrity restored (0 orphan edges, was 27) means gap detection and quality propagation
now traverse the entire platform instead of silently stopping at missing nodes.

## 7. How to Re-run

```bash
# Frontend route sweep + engine tests (Node, headless Chromium)
cd frontend && npm run build && npx serve -s build -l 3000
# then run the sweep/engine scripts (see scratchpad e2e_routes.js / frontend_engine_tests.js patterns)

# Backend engine + lineage tests (no DB needed)
cd backend && python -m pytest tests/test_data_lineage.py tests/test_climate_physical_risk.py \
  tests/test_climate_transition_risk.py tests/test_stress_test_pd_backtest.py \
  tests/test_lgd_vintage.py tests/test_schemas.py -q

# Full suite (requires running backend + DB): set REACT_APP_BACKEND_URL and start uvicorn first
```
