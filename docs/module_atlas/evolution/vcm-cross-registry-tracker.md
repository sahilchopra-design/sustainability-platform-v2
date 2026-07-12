## 9 · Future Evolution

### 9.1 Evolution A — Live OffsetsDB/VROD refresh with drift detection (analytics ladder: rung 2 → 3)

**What.** This module is already the platform's model of honest data posture: a
hand-authored, internally-reconciled extract (§7.5 verified annual series sum exactly
to cumulative totals), explicitly labelled "○ Seeded real extract — OffsetsDB API
key-gated," with a genuine `/status` reachability probe against
`https://offsets-db.fly.dev/health`. Its documented weakness is §8.6(1): the extract
is point-in-time (circa end-2025) and will silently go stale. Evolution A builds the
refresh path the code already anticipates: when `OFFSETS_DB_API_KEY` is provisioned,
a scheduled ingester (the platform's 19-ingester framework is the scaffold) pulls
OffsetsDB `/charts/*` and `/credits` endpoints into a `vcm_registry_stats` table;
independently, a semi-automated VROD Excel loader handles Berkeley's quarterly
releases as a second source. The retirement-rate/outstanding formulas stay unchanged;
what upgrades is provenance — each figure gains `source` + `as_of`, and a drift check
compares live pulls against the curated extract, flagging divergences >10% instead of
silently replacing curated numbers.

**How.** Extend `api/v1/routes/vcm_registry.py`: `summary`/`registries`/`annual` read
from the table when populated, else fall back to the extract with the existing honest
badge; `/status` gains an `auth_ok` field probing a data endpoint with the key.

**Prerequisites.** An OffsetsDB API key (external dependency, may not be granted);
VROD loader tolerant of Berkeley's changing workbook layout. **Acceptance:** with a
key present, the badge flips to live with an `as_of` date; without one, behaviour is
byte-identical to today; the §7.4 reconciliation test runs in CI against whichever
source is active.

### 9.2 Evolution B — Cross-registry market analyst for the 9-module blast radius (LLM tier 2)

**What.** This tracker has the largest interconnection surface in its batch (9
downstream modules share its tables, including `vcm-registry-analytics` and the
just-transition family). Evolution B is a tool-calling analyst that answers
market-structure questions across the four GET endpoints: "why is ART TREES'
retirement rate 16.7% versus the 55.2% market rate?" (the §7.4 answer — youngest
registry, jurisdictional REDD+ vintages not yet worked through — is exactly the kind
of reasoning the curated data supports), "which registries' outstanding supply grew
fastest 2021–2025?", "how would a Verra buffer-pool invalidation shift market
outstanding?". Every figure comes from `GET /summary`, `/registries`, `/annual`; the
analyst also always reports the provenance badge state, so no answer masquerades a
seeded extract as live market data.

**How.** Tier-2 stack over the four existing read-only routes (all currently pass the
lineage harness — no repair needed, unlike most peers); grounding corpus is this Atlas
page, whose §7.6/§8.6 caveats ("order-of-magnitude-faithful, not registry-reconciled";
retirement rate conflates demand, vintage age, and registry conventions) are injected
into the system prompt so the analyst qualifies its heuristics.

**Prerequisites.** pgvector corpus; no backend work strictly required — this is a
rare tier-2 candidate that is shippable today. **Acceptance:** every Mt and % in an
answer appears in an endpoint payload; each answer states the data posture (extract
vs live, as-of date); asked for a specific project-level credit lookup, the analyst
refuses — the module holds registry aggregates only.
