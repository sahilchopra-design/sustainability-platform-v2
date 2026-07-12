## 9 · Future Evolution

### 9.1 Evolution A — EPC-register and flood-map grounded loan book (analytics ladder: rung 2 → 3)

**What.** §7's assessment is comparatively kind: the code implements a coherent
three-layer pricing (rate spread via green discount/flood/coastal surcharges,
additive PD uplift of +30bp flood / +50bp poor-EPC, stranding haircut → adjusted
LTV → RWA), differing from the guide's multiplicative beta form as a documented
simplification rather than a fabrication. The gap is inputs: the mortgage tape is
synthetic (`epc = EPC[⌊sr(i·7)·7⌋]`, seeded flood flags). The platform already wired
the two data sources this module needs during the data-sources wave: the UK EPC
register (property-level certificates) and Land Registry price data. Evolution A
builds the real tape path: postcode-level joins to EPC records and Environment
Agency flood-zone classifications, so PD uplifts and stranding haircuts attach to
actual property characteristics.

**How.** (1) Tape-upload schema (loan, postcode, value, product) with server-side
enrichment: EPC band from the register feed, flood zone from EA open flood-map data,
coastal flag from geography — each enrichment carrying `resolution_tier`.
(2) Coefficient evidence pass: the +30bp/+50bp uplifts and EPC rate spreads
benchmarked against published UK studies (BoE and lender research on EPC-rate and
flood-value differentials) — cite or label expert-set per §8 convention. (3) The
EBA-format stress output the guide promises implemented as a structured export over
the computed ECL segments.

**Prerequisites.** EPC feed auth (documented as changed — reverify); EA flood-map
licensing (open government licence). **Acceptance:** two loans differing only in
postcode get different flood surcharges traceable to EA zones; EPC bands match
register records; coefficients carry sources or explicit expert-set labels.

### 9.2 Evolution B — Mortgage-book climate analyst (LLM tier 2)

**What.** An assistant for portfolio managers and stress-test teams: "what's our ECL
uplift under the disorderly scenario and which segments drive it?" (segment
decomposition from the computed book), "why does this G-rated coastal loan carry
+80bp total?" (the additive build-up narrated term by term), "size the Pillar 2
add-on for the flood-zone concentration" — computed via client-side tool calls over
the pricing/PD/RWA functions (or backend routes if Evolution A moves enrichment
server-side, which it should).

**How.** Tool schemas over the three-layer calculators and segment aggregations;
validator on every bp, ECL, and RWA figure; supervisory-framing questions (SS3/19,
EBA templates) answered from the §5 corpus with citations; the coefficient-provenance
labels from Evolution A surface in prose when precision is challenged.

**Prerequisites.** Evolution A's enrichment path for real-book questions; synthetic-
tape mode clearly labelled in the interim. **Acceptance:** a segment-level ECL answer
reconciles to the aggregation function; per-loan explanations sum exactly to the
displayed rate/PD; the copilot refuses origination decisions ("should we approve this
loan?") as out of scope.
