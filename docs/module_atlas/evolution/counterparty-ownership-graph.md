## 9 · Future Evolution

### 9.1 Evolution A — Ground the attribution rollup in reference financials (analytics ladder: rung 1 → 2)

**What.** This module is honest infrastructure: a thin, well-built proxy over the
live GLEIF API (CC0 golden-copy ownership data, bounded 8-hop parent walk with cycle
guard, exception banners, "returned of total" pagination honesty — §8 status
"implemented"). Its documented limitation (§7.7) is the analytic layer: the
PCAF-style exposure rollup runs on freeform user inputs — the module supplies no
EVIC, outstanding-debt, or enterprise-value data to ground the attribution factor,
so the one computed number rests on typed guesses. Evolution A grounds it.

**How.** (1) Financial reference join: resolve the LEI to listed-entity financials
via the OpenFIGI mapping the platform already integrated (wave 1) plus the
`company-profiles` real dataset where covered, giving EVIC/total-debt candidates for
the attribution denominator with a `resolution_tier` label (exact PCAF data-quality
scoring conventions apply). (2) Persist rollups: exposures and attribution runs move
from client state to a table keyed by LEI, so a counterparty's tree and its
attributed exposure become a retrievable artifact other modules can consume — with
blast radius 81, this graph is already the platform's entity spine. (3) Tree-level
analytics: aggregate exposure by ultimate parent with double-count protection when a
user enters exposures at multiple levels of the same chain — currently possible and
silently additive. (4) Sanctions/adverse-flag overlay via the existing
entity-resolution routes as an optional decoration.

**Prerequisites.** GLEIF bulk table (`entity_lei`) freshness — the silently-broken
bulk ingester found in the data-sources project must stay fixed and scheduled;
OpenFIGI coverage honesty (unlisted subsidiaries get honest nulls).
**Acceptance:** an attribution run for a listed counterparty shows its EVIC source
and tier; entering exposures at both parent and subsidiary levels triggers the
double-count warning; rollups persist across sessions.

### 9.2 Evolution B — Counterparty-resolution copilot for the whole platform (LLM tier 2 → 3)

**What.** "Assess this counterparty" is the roadmap's own tier-3 example, and this
module owns the first hop. Evolution B: a copilot that takes a messy name ("Glencore
trading arm, Swiss entity?") and drives `GET /gleif/search` and `/entity/{lei}` to
resolve, disambiguate (presenting GLEIF candidates with jurisdiction/status, asking
one clarifying question when fulltext search is ambiguous rather than guessing),
then walks the tree and narrates the structure: ultimate parent, chain depth,
reporting exceptions in plain language ("no parent reported — natural-person
ownership exemption"), and attributed exposure if entered. As tier 3, it hands the
resolved LEI to sibling modules (sanctions screen, physical-risk profile, financed
emissions) per the desk-orchestration pattern.

**How.** Tool schemas over the 6 GLEIF routes (all read-only, already live);
grounding is §7's mechanics documentation so the copilot explains caps honestly
(8-hop truncation, 50-children default). The key prompt rule: entity facts come only
from GLEIF responses — the model's training-data knowledge of corporate structures
is explicitly untrusted, since ownership changes constantly and the live registry is
the whole point.

**Prerequisites.** None hard — this is the platform's most ship-ready tier-2
candidate (live endpoints, zero fabrication surface); tier-3 handoffs need the Atlas
endpoint map for target modules. **Acceptance:** resolution of 10 ambiguous test
names asks clarifying questions rather than mis-resolving; every entity fact in a
narration appears in a tool response; truncated trees are described as truncated.
