## 9 · Future Evolution

### 9.1 Evolution A — Discounted carbon liability with SCC anchoring and Scope 3 (analytics ladder: rung 1 → 2)

**What.** §7 itemises the gaps behind the guide's Climate-EV formula: the code
applies fixed linear haircut coefficients (0.05/0.06/0.04 and 0.08/0.10/0.12) rather
than modelled adjustments, computes an **undiscounted** Scope 1+2-only carbon cost
(Scope 3 is generated but never enters the liability), has no SCC anchor despite the
guide citing $185/t, and lacks the advertised TCFD checklist tab. Evolution A builds
the valuation machinery honestly: carbon liability as an NPV — annual emissions ×
NGFS scenario carbon-price *trajectory* (already in platform data), discounted at a
user WACC, with Scope 3 included at a documented inclusion factor (full Scope 3
double-counts across a value chain; the ACE/WBCSD framework the §5 list cites gives
the treatment) — plus stranded-asset writedowns keyed to IEA-NZE retirement years by
asset class rather than a flat sector percentage.

**How.** (1) `carbonLiabilityNPV(scopes, scenario, wacc, horizon)` replacing the flat
multiplication; scenario trajectories from the platform's NGFS data. (2) The two
inconsistent haircut paths (screening-table coefficient vs the second set) unified
into one documented model. (3) The 7-criterion deal scorecard kept (it's real
arithmetic) and the missing TCFD checklist either built as a structured assessment
tab or removed from the guide. (4) The 45 synthetic targets relabelled fixtures.

**Prerequisites.** NGFS price-path access; SCC vs market-price basis decision
documented (they answer different questions and the module must say which it prices).
**Acceptance:** carbon liability responds to WACC and horizon (discounting proven);
Scope 3 visibly enters with its inclusion factor displayed; the two haircut paths
agree; the mismatch flag clears.

### 9.2 Evolution B — Deal-team diligence analyst (LLM tier 2)

**What.** An assistant for M&A climate workstreams: "run the climate adjustment on
this target — €2B EV, utilities, 4.2 Mt Scope 1+2, coal assets retiring 2035 under
NZE" as tool calls into the Evolution A valuation functions, returning the adjusted
EV with a decomposition (carbon NPV, stranding, physical) suitable for an IC memo;
plus checklist interrogation ("what diligence items remain open on governance?") once
the TCFD tab exists. Drafting the climate section of the IC memo from computed
outputs is the natural deliverable — through the report-studio render layer.

**How.** Client-side or backend tool schemas over the valuation functions (the module
currently has no API routes — Evolution A may add them); the validator on every EV,
NPV, and haircut figure; scenario assumptions stated in-draft (which NGFS path, which
WACC) because an IC will ask; human review before memo export.

**Prerequisites (hard).** Evolution A first — the current flat coefficients would
give an LLM false precision to amplify; deal data confidentiality handling (RBAC,
no cross-deal leakage in context). **Acceptance:** a memo's climate-EV figures
reproduce via the valuation functions with stated assumptions; changed WACC changes
the draft's numbers coherently; refusal on synergy and pricing questions outside the
climate scope.
