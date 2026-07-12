## 9 · Future Evolution

### 9.1 Evolution A — Build the CADS triage engine and real PME (analytics ladder: rung 1 → 3)

**What.** §7's mismatch flag: the guide describes a Climate-Adjusted Deal Score (`CADS = α×Financial + β×ESG + γ×ClimateRisk`) triaging deals into green/amber/red, but no composite, weighting, or triage logic exists — `esgScore` is one independent `sr()` draw never combined with anything. The page is a conventional PE dashboard (deal funnel, IRR/MOIC by fund, sector allocation, PME) but even the PME is a crude `fund.irr × (0.7±0.3)` proxy, not a real Kaplan-Schoar calculation against index cash flows. Evolution A builds the CADS the guide promises and fixes PME.

**How.** (1) Implement CADS as the documented weighted composite: a financial sub-score (from the deal's IRR/MOIC/multiple), an ESG sub-score (from real controversy/UNGC-violation screening — the sibling ESG modules and sanctions/controversy data provide inputs), and a climate-risk sub-score (transition exposure + physical hazard from the platform's physical-risk modules), with α/β/γ configurable per fund mandate (§1). Then the green/amber/red triage on CADS thresholds. (2) Replace the fake PME with a real Kaplan-Schoar PME: discount fund cash flows by actual Russell 2000 / MSCI index returns (market data is in the platform), not a fraction-of-IRR proxy. (3) Persist real pipeline deals in a table rather than seeding 60.

**Prerequisites.** Controversy/UNGC screening data (partially available via sanctions/ESG modules); real index cash-flow series for PME; physical/transition risk wiring. Remove `sr()` from scores. **Acceptance:** CADS decomposes into three named sub-scores and drives triage; PME reproduces a Kaplan-Schoar calc against real index returns; deals persist.

### 9.2 Evolution B — Deal-screening copilot for PE teams (LLM tier 2)

**What.** A copilot for the PE investment-team users §1 targets: "screen this inbound deal — CADS, ESG flags, climate exposure", "which pipeline deals are amber-watch and why?", "what's this fund's PME vs Russell 2000?" — executed against the (Evolution-A) CADS and PME engines, decomposing each deal's triage into its financial/ESG/climate sub-scores.

**How.** Tool calls to endpoints wrapping CADS, the triage logic, and PME; system prompt from this Atlas page's §5 and the PRI PE ESG / ILPA references named in §5. Deal screening returns the CADS decomposition with the binding sub-score highlighted (why a deal is amber); the fabrication validator matches every score/IRR/PME to a tool response. The ESG-flag component must cite the specific controversy/exclusion that triggered it (an auditable signal, not an opaque score). Mutating actions (advancing a deal's stage) gate behind confirmation + RBAC.

**Prerequisites (hard).** Evolution A — there is no CADS or real PME to call today; a copilot narrating the current independent `esgScore` draw as a deal-quality signal would launder noise into an investment decision. **Acceptance:** every CADS/PME figure traces to a tool call; triage explanations name the driving sub-score and specific ESG flags; the copilot refuses to score deals before CADS exists.
