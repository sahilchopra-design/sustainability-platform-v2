## 9 · Future Evolution

### 9.1 Evolution A — Emissions-weighted VCEI with a real Scope 3 category taxonomy (analytics ladder: rung 1 → 2)

**What.** Implement the module's own advertised methodology. §7's mismatch flag shows
there is no `VCEI` in code — every portfolio statistic is an unweighted mean over 50
synthetic suppliers, and §7.4's worked example quantifies the consequence (unweighted
60.0 vs emissions-weighted 71.9 on the same three suppliers). There is also no Scope 3
category structure: `scope3Contrib` is a flat 0–15% random field with no attribution
to the 15 GHG Protocol categories the guide claims. Evolution A builds the §8 spec's
first slice: a supplier-to-category crosswalk, per-category emissions via spend-based
factors from the platform's refdata emission-factor layer (§8.4 notes DEFRA/EPA-style
factors are already ingested for other modules), then
`VCEI = Σ(ESGScore × w_supplier)` with `w` = emissions share, plus the
`CategoryHotspot` and PCAF-style `DataQualityScore` outputs.

**How.** Backend route `POST /api/v1/value-chain/vcei` (module is Tier B, no backend
today) taking a supplier list with spend/activity fields; frontend gains a category
column and a hotspot bar; the KPI row shows VCEI beside — not instead of — unweighted
risk-tier counts, per §8.6's caution that emissions weighting can bury social risks.

**Prerequisites.** Supplier records need a spend or activity field (doesn't exist in
the current seed schema); the §7 mismatch flag retires only when the page renders
engine output. **Acceptance:** the §7.4 three-supplier example reproduces 71.9 through
the endpoint; a Cat-11-heavy portfolio reports Cat 11 as hotspot; DQ score worsens
when primary-data suppliers are swapped for spend-based proxies.

### 9.2 Evolution B — Supplier-engagement prioritiser and ESRS E1-6 drafter (LLM tier 2)

**What.** The dashboard's purpose is deciding which suppliers to engage and disclosing
value-chain performance under CSRD. Evolution B adds a tool-calling assistant:
"which ten suppliers should we prioritise for primary-data collection this quarter?"
is answered by calling `POST /vcei`, ranking suppliers by `w_supplier × DQ_tier`
(biggest emissions share on the worst data), and "draft our ESRS E1-6 Scope 3
narrative" produces disclosure text where every tonnage, coverage %, and hotspot
category is interpolated from tool output — including the honest data-quality
statement ESRS requires (share of primary vs estimated data), which the DQ score makes
computable.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; grounding
corpus is this Atlas page plus §8's methodology (the crosswalk and PCAF DQ hierarchy
give the copilot correct vocabulary). The no-fabrication validator checks every
numeric against tool outputs; the "show work" expander lists which emission factors
and DQ tiers drove the ranking.

**Prerequisites (hard).** Evolution A — today there are no endpoints and no category
data to narrate; until real supplier data replaces the 50 synthetic rows, all outputs
carry a demo-data banner the copilot must echo. **Acceptance:** the engagement
shortlist matches an independent sort of the engine payload; drafted E1-6 text
contains no category or tonnage absent from tool output; asked for a supplier's
verified emissions, the copilot reports the DQ tier rather than asserting precision.
