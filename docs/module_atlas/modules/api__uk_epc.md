# Api::Uk_Epc
**Module ID:** `api::uk_epc` · **Route:** `/api/v1/uk-epc` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/uk-epc/status` | `status` | api/v1/routes/uk_epc.py |
| GET | `/api/v1/uk-epc/seed-postcodes` | `seed_postcodes` | api/v1/routes/uk_epc.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`

**Database tables:** `__future__` *(shared)*, `datetime` *(shared)*, `fastapi` *(shared)*, `published` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/uk-epc/certificates** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['postcode', 'mode', 'count', 'certificates', 'upstream_error', 'source', 'seed_provenance', 'retrieved_at', 'cache'], 'n_keys': 9}`

**GET /api/v1/uk-epc/seed-postcodes** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['postcodes', 'provenance'], 'n_keys': 2}`

**GET /api/v1/uk-epc/status** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['source', 'mode', 'token_configured', 'token_env', 'how_to_get_a_token', 'note', 'seed_provenance', 'checked_at'], 'n_keys': 8}`

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 9 · Future Evolution

### 9.1 Evolution A — From postcode proxy to a persisted EPC layer feeding the RE stack (analytics ladder: rung 1 → 2)

**What.** A thin but honestly-built data-access module for the UK EPC register: `/certificates`
returns per-postcode certificates with an explicit `mode` (live-API vs seed fallback), `source`,
`seed_provenance`, `upstream_error`, and cache fields; `/status` reports whether an API token is
configured (with `how_to_get_a_token` guidance — the wave-1 integration found the UK EPC auth
regime had changed); `/seed-postcodes` lists the seeded coverage. It stores nothing — every lookup
is a live proxy or seed echo, and the platform's real-estate engines (`green_premium_tenant`,
`re_clvar`, `real_asset_decarb`) that need EPC ratings can't query it at portfolio scale.
Evolution A makes it a persisted layer.

**How.** (1) Add a persisted `uk_epc_certificates` table populated by bulk postcode ingestion
(the register supports bulk download), so portfolio-scale queries don't hammer the upstream API
and work without a configured token; keep the live proxy for freshness with the same honest `mode`
labelling. (2) Expose an asset-level lookup (`/certificates/by-address` or UPRN) so a property in
`valuation_assets` resolves its actual EPC rating — the input `green_premium_tenant`'s premium
tables and `re_clvar`'s transition CLVaR (EPC-gap brown discount) currently take as caller input.
(3) Add postcode-level aggregates (rating distribution, mean energy intensity) for benchmarking.
(4) Keep `seed_provenance` and `upstream_error` reporting exactly as-is — it's the honest pattern.

**Prerequisites.** UK EPC register token or bulk-file access (auth regime documented in the wave-1
research); a storage schema. **Acceptance:** a portfolio of UK properties resolves EPC ratings
from the persisted layer with `mode`/source labels; the RE engines consume the lookup;
postcode aggregates returned; seed fallback still explicitly labelled.

### 9.2 Evolution B — EPC evidence tool for the real-estate copilots (LLM tier 1 → 2)

**What.** This module's LLM role is the *EPC ground-truth tool*: when the green-premium or CLVaR
copilots discuss a UK property's rating ("this asset is EPC D — here's the brown-discount and the
retrofit-to-B value case"), the rating comes from a `/certificates` call against the register, not
from the user's assertion or the LLM's guess.

**How.** Tier 1 narrates `/status` (live vs seed mode, token state, coverage). Tier 2 registers
`/certificates` (and post-Evolution-A, the address-level lookup) as a read-only tool for the
`green_premium_tenant`, `re_clvar`, `real_asset_decarb`, and `rics_esg` copilots — a leaf-tool in
the real-estate chain rather than a standalone copilot. The `mode` field must flow into every
narration: a seed-mode certificate is explicitly a sample, not the property's real rating.

**Prerequisites.** Evolution A's persisted layer for portfolio-scale copilot use; token
configuration for live mode. **Acceptance:** every EPC rating a consuming copilot cites traces to
a `/certificates` response with its `mode` and source; seed-mode results are always disclosed as
samples; an unresolvable address yields "no certificate found" rather than an assumed rating.