## 9 · Future Evolution

### 9.1 Evolution A — Modelled greenium from real muni issuance data (analytics ladder: rung 1 → 3)

**What.** §7 is candid: this is a filter-and-aggregate dashboard over 70 synthetic bonds — there is no framework-scoring engine and no yield-curve greenium computation; the "greenium" is a stored per-bond `sr()` number, and (per §7.2) it is always positive (0–12 bps), the wrong sign convention versus the guide's own −2 to −6 bps statement in §5. Evolution A replaces the synthetic book with real municipal green-bond issuance and computes greenium as a matched-pair spread differential, the way the §5 formula actually specifies.

**How.** (1) Ingest real muni green issuance: EMMA/MSRB disclosures or the Climate Bonds Initiative certified-bond list (CBI is already the named framework) into a `muni_green_bonds` table with issuer, CUSIP-level coupon/maturity/yield-at-issue. (2) Greenium = green yield − same-issuer, nearest-maturity conventional comparator, with a match-quality flag when no clean pair exists — honest nulls over interpolated fiction. (3) Implement the §5 `FrameworkScore` (UoP quality, impact reporting, verification rigor, governance) as an explicit 4-pillar rubric with analyst-entered criterion scores stored per framework document, replacing the random `certificationBody` assignment with the actual SPO provider from disclosures.

**Prerequisites.** Data-source diligence (MSRB terms for redistribution; CBI list is public); the 70 synthetic bonds retire or get labelled `demo`. Fixing the greenium sign convention will flip headline KPIs — release note required. **Acceptance:** displayed greenium can be negative; every bond row traces to a real disclosure; matched-pair method pinned on one hand-verified issuer pair.

### 9.2 Evolution B — Framework-assessment copilot for issuers and investors (LLM tier 1 → 2)

**What.** Two grounded workflows: for investors, "explain this bond's framework quality score and its greenium versus regional peers" answered from the module's aggregations (per-region greenium means, use-of-proceeds volumes); for city issuers, a GBP-alignment assistant that walks a draft framework through the ICMA four pillars and drafts the gap list — grounded in the ICMA GBP 2021 and CBI municipal framework texts already named in §5, quoted rather than recalled.

**How.** Tier 1: corpus = this Atlas page + ICMA/CBI reference documents embedded per the roadmap's `llm_corpus_chunks` pattern; answers cite pillar definitions by section. Tier 2 (post-Evolution A): tool calls against the new bond table's query endpoints for peer statistics ("median greenium for AA water-infrastructure issuers"), with the fabrication validator matching quoted basis points to query results. Framework gap-analysis outputs are structured as the 4-pillar rubric with per-criterion citations to the submitted framework text, so a second-party-opinion analyst can verify each claim.

**Prerequisites (hard).** Evolution A before any greenium is narrated — quoting the current always-positive synthetic greenium to an investor would be exactly backwards. Tier-1 GBP interpretation can ship immediately as it relies only on standard texts. **Acceptance:** peer statistics reproduce independent SQL; framework assessments cite pillar + clause for every finding; refusal on "what will this bond price at?"
