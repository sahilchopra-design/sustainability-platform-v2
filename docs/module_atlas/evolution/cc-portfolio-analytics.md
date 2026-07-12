## 9 · Future Evolution

### 9.1 Evolution A — Ship the advertised quality aggregation and retirement optimiser (analytics ladder: rung 1 → 2)

**What.** §7 documents a three-part guide↔code gap: the promised volume-weighted ICVCM
quality score (`WtdQuality = Σ(vol×Q)/Σvol`), Shannon vintage entropy, and
FIFO/LIFO/quality-optimised retirement sequencing are **all absent** — the code
computes HHI concentration on three axes, a risk radar, and a partly-synthetic
attribution waterfall over 25 synthetic positions. Evolution A implements the three
missing pieces on data the positions already carry: each position has an
`integrityScore` (60–90) usable as Q until the cc-engine-hub scoring engine lands,
`credits`/`retired` volumes for weighting, and vintage fields for entropy.

**How.** (1) `wtdQuality`, `shannonEntropy(vintageShares)`, and a retirement sequencer
as pure functions — FIFO/LIFO are sorts; quality-optimised retirement is "retire
lowest-Q first, maximise retained WtdQuality", a greedy solve that is provably optimal
for this objective. (2) The attribution waterfall's synthetic components replaced by
terms derived from `priceAcquired`/`priceCurrent` per position. (3) Wire quality inputs
to CarbonCreditContext so real methodology-engine outputs displace the synthetic
`integrityScore` when the cc-engine-hub Evolution A ships.

**Prerequisites.** Mismatch flag clears only when all three advertised metrics compute;
synthetic positions labelled demo. **Acceptance:** retiring the lowest-quality position
raises retained WtdQuality (property test); Shannon entropy hits its ln(n) maximum on
an equal-vintage fixture book.

### 9.2 Evolution B — Portfolio steward analyst (LLM tier 2)

**What.** An analyst-tier assistant over the holdings book: "which retirement sequence
keeps our weighted quality above 75 while covering the 30kt CORSIA obligation?",
"where is our concentration risk?" (the three real HHI axes), "explain this quarter's
attribution". Post-Evolution A it calls the sequencer and aggregation functions as
tools and narrates only returned numbers; the mark-to-market view stays explicitly
bounded by the synthetic price basis until real price feeds exist.

**How.** Tool schemas over the Evolution A functions (client-side, or backend if the
book moves server-side — the page already declares an `API` constant pointing at
:8001, currently unused); per the tier-2 pattern, the no-fabrication validator checks
every volume, HHI, and quality figure against tool outputs; provenance expander lists
positions touched.

**Prerequisites (hard).** Evolution A first — today the assistant could not answer a
quality question without fabricating, since no quality aggregate exists in code.
**Acceptance:** a sequencing recommendation is reproducible by re-running the sequencer
with the stated parameters; price-forecast questions are refused.
