## 9 · Future Evolution

### 9.1 Evolution A — Real program registry + state-resolved generation model (analytics ladder: rung 1 → 2)

**What.** The page's economics are genuine formulas (SREC revenue, bill savings, payback) anchored to real SREC prices (DC $420, MA $285, NJ $230…) and a correct NEM policy taxonomy — but the 20 `PROJECTS` are `sr()`-seeded, and the generation model is a single hard-coded `0.15` capacity-factor proxy applied identically from Boston to Phoenix (§7.1 documents this). Evolution A replaces both: a real project registry and state-resolved yield, then a scenario layer for the policy questions this module exists to answer (NEM 3.0 vs 1:1 netting, ITC adder combinations, LMI carve-out sizing).

**How.** (1) New backend vertical `api/v1/routes/community_solar.py` + `community_solar_programs` table seeded from NREL's Sharing the Sun community-solar project dataset (public, ~3,000 projects with state/capacity/LMI attributes). (2) Replace the 0.15 proxy with per-state capacity factors from the platform's already-integrated NASA POWER / Open-Meteo irradiance sources (wired in the data-sources wave-1 work) — `srecRevenueAnnual = kW × CF_state × 8.76 × price/1000` with `CF_state` cited. (3) Scenario endpoint sweeping NEM regime × SREC price × ITC adders, replacing seeded `paybackYr`/`lcoe` draws with computed values.

**Prerequisites.** SREC price table needs a refresh cadence (SRECTrade values drift); Alembic migration on the current 2-head state. **Acceptance:** a 500 kW MA project computes payback from the actual formula chain (bench-pinned worked example), and identical projects in DC vs PA show different SREC revenue and CF-driven yield.

### 9.2 Evolution B — Program-design analyst for developers and regulators (LLM tier 2)

**What.** A tool-calling analyst answering the module's core user questions in natural language: "structure a 2 MW Illinois community solar project with the CEJA 50% LMI carve-out — what subscriber discount can it sustain?" The LLM chains Evolution A's endpoints (yield → SREC revenue → subscription economics → LMI compliance check) and narrates real outputs, including the policy citations the page already curates (IL CEJA, NY VDER, MA DG set-asides).

**How.** Tool schemas from the new route's OpenAPI spec; grounding corpus = this Atlas record's §5/§7 (the SREC price table and NEM taxonomy are the domain vocabulary) plus the LMI_PROGRAMS seed data promoted to a reference endpoint. The no-fabrication validator matches every $/MWh, %, and payback figure to tool outputs. A refusal path covers what the module doesn't compute — e.g. interconnection queue timing or utility-specific tariff riders.

**Prerequisites (hard).** Evolution A first — today there are zero backend endpoints, and a copilot narrating the seeded project list would present fabricated paybacks as market data. **Acceptance:** for a golden IL fixture, the analyst's stated subscriber savings equal the engine response to the cent; asking about a state absent from the SREC table returns the honest "no compliance market" answer (e.g. CO at $0), not an invented price.
