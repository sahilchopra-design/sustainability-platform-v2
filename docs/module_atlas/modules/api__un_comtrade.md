# Api::Un_Comtrade
**Module ID:** `api::un_comtrade` · **Route:** `/api/v1/un-comtrade` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/un-comtrade/reporters` | `reporters` | api/v1/routes/un_comtrade.py |
| GET | `/api/v1/un-comtrade/trade-flow` | `trade_flow` | api/v1/routes/un_comtrade.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `docs`, `exc` *(shared)*, `fastapi` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/un-comtrade/reporters** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['codes', 'note'], 'n_keys': 2}`

**GET /api/v1/un-comtrade/trade-flow** — status `failed`, provenance ['computed'], source tables: —
Output: `None`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — Repair the trade-flow proxy and persist flows for supply-chain consumers (analytics ladder: rung 1 → 2)

**What.** A minimal two-endpoint proxy over the UN Comtrade API (wave-1 free/keyless integration):
`/reporters` returns the reporter-country codes (passing), and `/trade-flow` — the endpoint that
actually fetches bilateral trade flows — traces **failed** in §4.2, so the module's entire
analytical payload is currently unavailable end-to-end. There is no persistence and no engine;
grounding for this page is thin (no §5/§7 in the atlas), so Evolution A is scoped conservatively:
make the one data path work, then persist it.

**How.** (1) Diagnose and fix `/trade-flow` (likely upstream rate-limiting, parameter validation,
or the Comtrade API's request shape — the wave-1 memory notes several sources' assumptions had
drifted) with resilient retries, a TTL cache, and honest `upstream_error` reporting per the
`openfema_claims`/`uk_epc` pattern. (2) Persist fetched flows to a `dh_comtrade_flows` table
(reporter, partner, HS code, year, value, quantity) so repeat queries and portfolio-scale analysis
don't re-hit the API. (3) Add the aggregates consumers need: top partners per commodity,
import-dependency shares per country — inputs the `trade_finance_esg` lane-emissions and
`supply_chain_workflow` sourcing screens can consume. (4) Document coverage (years, HS revisions).

**Prerequisites.** Comtrade API behaviour re-verified (free-tier limits); a flows table schema.
**Acceptance:** `/trade-flow` returns `passed` with real Comtrade data and honest upstream-error
reporting; repeat queries hit the persisted cache; a top-partners aggregate is exposed; coverage
documented.

### 9.2 Evolution B — Trade-flow evidence tool for supply-chain and trade-finance copilots (LLM tier 1 → 2)

**What.** As a pure data proxy, this module's LLM role is the *trade-flow ground-truth tool*:
when the supply-chain or trade-finance copilots reason about sourcing exposure ("how dependent is
this supply chain on cocoa from Côte d'Ivoire?"), the flow shares come from a `/trade-flow` call
against Comtrade data, never from the LLM's recalled trade statistics.

**How.** Tier 1 narrates `/reporters` coverage. Tier 2 registers `/trade-flow` (and the
post-Evolution-A aggregates) as read-only tools for the `supply_chain_workflow`,
`trade_finance_esg`, and food-system copilots — a leaf-tool in the tier-3 supply-chain chain. Every
narration carries the data vintage (Comtrade reporting lags by country) so consumers don't read
last-available-year flows as current.

**Prerequisites.** Evolution A's `/trade-flow` fix is mandatory — the tool has nothing real to
serve today; until fixed, the copilot must refuse flow questions with "trade-flow endpoint
unavailable". **Acceptance:** every flow value and partner share a consuming copilot cites traces
to a `/trade-flow` response with its reporting year; unavailable country/commodity combinations
return an explicit coverage gap rather than an estimated flow.