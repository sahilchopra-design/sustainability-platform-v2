## 9 · Future Evolution

### 9.1 Evolution A — Compute the proximity risk the guide states (analytics ladder: rung 1 → 2)

**What.** EP-CV4 is a rare curated-static module — §7.6 confirms FSI scores, event
counts and WGI stability track real published figures with no PRNG — but the promised
model `ProximityRisk = f(distance_to_conflict, conflict_intensity)` is absent: every
asset's risk band in `ASSET_PROXIMITY` is assigned editorially (Sudan Gold Mine is
*displayed* CRITICAL, not computed), and the 2025 snapshot is frozen with no refresh
path. Evolution A implements the distance × intensity function over a live event feed
and lets the curated tables age gracefully into sourced ones.

**How.** (1) Event data: the platform's UCDP GED integration (data-sources wave 1 —
noting the corrected finding that UCDP is no longer self-service, so the ingest path
established there is the one to reuse) provides geolocated conflict events; ACLED can
follow if licensing permits. (2) Proximity model: for each portfolio asset
(coordinates from the holdings/asset layer), kernel-weighted event intensity within
distance bands (e.g. 25/50/100 km), decayed by recency, classified against documented
thresholds — replacing the pre-labelled `risk` field; PostGIS (already used by the
platform) does the spatial join. (3) `coup_risk`/`backsliding` either gain a cited
source (V-Dem/REIGN-style indices) or get relabelled "editorial estimate" in the UI —
§7.6 flags them as uncited. (4) FSI and WGI tables become refreshed ingests with
as-of dates rather than frozen constants.

**Prerequisites.** Asset coordinates for the portfolio overlay; UCDP ingest
scheduling. **Acceptance:** the Sudan Gold Mine risk band reproduces from
`f(8 km, 120 events)` under the documented thresholds; moving an asset's coordinates
changes its computed band; every hotspot row shows its data vintage.

### 9.2 Evolution B — Country-risk briefing copilot for at-risk assets (LLM tier 1)

**What.** Political-risk users consume briefs, not dashboards. Evolution B drafts an
asset-level or country-level security brief from the module's own data: computed
proximity band with the events behind it, FSI/WGI trajectory ("deteriorating" now
evidenced by the trend series), and the insurance implication — the module's existing
canned advisory text (MIGA referral, 200–500bp premium indication) upgraded into
context-aware guidance that still only draws on the stored PRI market-intelligence
categories. Each claim cites its dataset and vintage.

**How.** Tier-1 RAG: this Atlas record plus the curated tables themselves (they are
citable reference data); selected asset/country state passes as context. Two honesty
rules from §7: until Evolution A, the copilot must present asset risk bands as
editorial assignments, not computed values; `coup_risk` percentages are estimates
without a cited methodology and must be framed as such. No endpoints exist, so
tier 2 waits for Evolution A's proximity service — at which point "re-score this
asset at a 50 km threshold" becomes a tool call.

**Prerequisites.** Corpus embedding (D3); Evolution A for computed-risk claims.
**Acceptance:** briefs distinguish sourced figures (FSI, event counts) from editorial
estimates in their citations; asked about a country outside `HOTSPOTS`, the copilot
declines rather than generalizing from the region; post-Evolution A, quoted proximity
scores match the spatial-join output exactly.
