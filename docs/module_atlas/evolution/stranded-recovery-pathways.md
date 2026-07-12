## 9 · Future Evolution

### 9.1 Evolution A — Implement the conversion-IRR DCF the guide names (analytics ladder: rung 1 → 2)

**What.** The §7 flag documents that the guide's `IRR = rate where NPV(conversion_cash_flows) = 0` **has no implementation** — `irr`, `capex`, `jobs`, and `feasibility` for each of the 10 repurposing pathways are hardcoded literals, and the only computation is simple aggregates (totalCapex, avgIRR). Its strengths are real: the 10 pathways are directionally sensible (gas-turbine→synchronous-condenser genuinely has the lowest capex and highest feasibility, matching real grid-services conversions), and the 3 case studies (Drax BECCS, Hornsea, HYBRIT) are genuine, publicly documented projects. Evolution A builds the DCF that makes the IRRs computed rather than asserted.

**How.** (1) Add a per-pathway cash-flow schedule: conversion capex phasing, revenue ramp (post-conversion output × price), opex, and terminal value, then solve for IRR via the same Newton-Raphson approach the platform's solar/SMR project-finance modules already use. (2) Make the IRR sensitive to the variables that actually drive it — carbon price, electricity/commodity price, and financing cost — via user sliders and scenario presets (currently no sensitivity is modelled at all, §7.6). (3) Cite the pathway capex/feasibility constants to IEA Net Zero industry-transition studies. (4) Reconcile the case studies against the `PATHWAYS` table (currently fixed reference content, not compared to the table's own numbers).

**Prerequisites.** Cash-flow assumptions per pathway (revenue basis, opex); the IRR solver exists elsewhere in the codebase to reuse. **Acceptance:** each pathway's IRR is solved from an NPV=0 cash-flow schedule, not a literal; changing carbon or electricity price moves the IRR; capex constants cite an IEA vintage.

### 9.2 Evolution B — Asset-repurposing advisory copilot (LLM tier 1)

**What.** A copilot for the asset owner / transition-finance analyst: "what are the best repurposing options for a retiring coal plant?", "what's the IRR of converting this refinery to green hydrogen and how sensitive is it to power price?", "show me a real-world precedent for offshore-platform-to-wind conversion" — answered from the (Evolution-A) computed IRRs, the sensitivity ranges, and the genuine case studies.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/stranded-recovery-pathways/ask`, corpus = this Atlas record (the pathway table, the case studies, IEA NZE framework notes) plus live page state. Pathway recommendations narrate the computed IRR and feasibility; what-if requests re-run the DCF with the user's price/financing assumptions; precedent answers cite the real Drax/Hornsea/HYBRIT projects with their public details. Refusal for asset types outside the 10 pathways.

**Prerequisites.** Evolution A's DCF so IRR discussions rest on computed cash flows rather than hardcoded literals with no sensitivity. **Acceptance:** every IRR/capex figure traces to the DCF; sensitivity claims reflect actual re-runs; case-study details match the real documented projects, not invented specifics.
