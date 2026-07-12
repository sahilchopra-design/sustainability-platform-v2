# Api::Ngfs_Scenarios_Extract
**Module ID:** `api::ngfs_scenarios_extract` · **Route:** `/api/v1/ngfs-extract` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/ngfs-extract/variables` | `get_variables` | api/v1/routes/ngfs_scenarios_extract.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `backend` *(shared)*, `data` *(shared)*, `fastapi` *(shared)*, `functools` *(shared)*, `pathlib` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/ngfs-extract/scenarios** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['meta', 'years', 'scenarios', 'regions', 'variables', 'data'], 'n_keys': 6}`

**GET /api/v1/ngfs-extract/variables** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['meta', 'variables', 'years', 'scenario_ids', 'region_ids'], 'n_keys': 5}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — From seeded illustrative extract to production NGFS vintages (analytics ladder: rung 2 → 3)

**What.** This is a thin read-only scenario-serving module: two GET endpoints
(`/scenarios`, `/variables`) serve a **seeded** NGFS Phase 5 extract (Net Zero 2050,
Below 2°C, Delayed Transition, Fragmented World, NDCs, Current Policies × World/EU/US/CN,
2025–2050) from `backend/data/ngfs_phase5_extract.json`, loaded via an `lru_cache`. The
file header is honest: it marks the extract as "approximate/illustrative — refresh from
data.ene.iiasa.ac.at/ngfs for production precision." Provenance is per-number labelled in
the JSON. Evolution A turns the illustrative snapshot into a real, versioned scenario
service.

**How.** (1) Replace the hand-seeded JSON with a full extract pulled from the IIASA NGFS
Scenario Explorer, covering the complete variable set (carbon price, emissions, GDP,
primary energy) at the model resolution the JSON currently approximates, and stamp the
NGFS phase/vintage. (2) Support multiple vintages side-by-side (Phase 4 vs 5) so
downstream stress-test modules can reproduce historical runs — the roadmap names NGFS
vintages as a predictive-layer data source. (3) Move from the flat JSON to the
`dh_ngfs_scenario_data` table the `glidepath_serve` module already reads, so the platform
has one NGFS source of truth rather than two. (4) Add variable-path validation against the
official NGFS taxonomy.

**Prerequisites.** IIASA extract access; reconciliation with `dh_ngfs_scenario_data` (two
NGFS stores exist today — this JSON and the DB table). **Acceptance:** `/scenarios`
returns production-precision values traceable to a named IIASA download with a vintage
stamp; a Phase-4 vs Phase-5 request returns distinct series; values match the DB-backed
`glidepath_serve` NGFS data.

### 9.2 Evolution B — NGFS scenario lookup as a shared grounding tool (LLM tier 1 → 2)

**What.** This module has no analytics of its own — its LLM value is as the canonical
*scenario-data tool* every climate copilot calls. "What's the carbon price under Net Zero
2050 in the EU in 2040?" resolves through `/scenarios` here rather than any copilot
recalling NGFS numbers, guaranteeing scenario figures across the platform are consistent
and sourced.

**How.** Tier 1 explains `/variables` (what scenarios/variables/regions exist and their
NGFS variable paths). Tier 2 registers `/scenarios` as a read-only filterable tool; because
provenance is labelled per-number in the payload, the copilot can always cite the source
vintage. This is a foundational leaf-tool for the tier-3 Desk Orchestrator — any
transition-risk, stress-test, or glidepath narrative grounds its scenario assumptions here.

**Prerequisites.** Evolution A strongly advised — a copilot grounding platform-wide
scenario answers in an "illustrative/approximate" seed would propagate imprecise numbers
everywhere; until then it must disclose the illustrative basis. **Acceptance:** every
scenario value a consuming copilot cites traces to a `/scenarios` response with its NGFS
vintage label; the copilot states the illustrative caveat until Evolution A ships
production data; requesting a variable/region absent from the extract returns an explicit
"not in extract" rather than an interpolated guess.