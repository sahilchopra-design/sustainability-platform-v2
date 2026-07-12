## 9 · Future Evolution

### 9.1 Evolution A — Fix the ETS2 defect, wire MSR dynamics, and live carbon price (analytics ladder: rung 2 → 3)

**What.** A faithful EU ETS engine (Directive 2003/87/EC as amended by 2023/959): benchmark-based free
allocation, compliance position, carbon-price scenario forecast, cap trajectory, and ETS2 readiness —
all constants transcribed from published EU regulatory values (benchmarks, LRF, MSR, CBAM phase-out),
DB-first benchmark lookup, no PRNG. Already rung 2 (five NGFS/IEA-anchored price scenarios). §7.5
documents a **live code defect**: `assess_ets2_readiness` references `self.ETS2_EMISSION_FACTORS`/
`ETS2_PRICE_CORRIDOR`/`ETS2_COMPLIANCE_CALENDAR` which are module-level constants, **not class
attributes** — so `POST /ets2-readiness` raises `AttributeError` and returns a 500, plus two latent bugs
(corridor key mismatch `floor` vs `floor_eur`; `.get()` on a list calendar). §7.6 also flags
simplifications: CSCF fixed at 1.0, binary carbon-leakage (1.0/0.3 vs the trade×emission-intensity
test), price forecast a pure table lookup (35% volatility reported but unused), and the cap trajectory
ignoring MSR intake dynamics. Evolution A fixes the ETS2 defect, wires MSR into the cap simulation, and
adds a live carbon price.

**How.** Fix the ETS2 constant references (self → module) and the corridor-key/calendar bugs;
`compute_cap_trajectory` applies the MSR intake/TNAC dynamics already exposed via `/ref/cap-parameters`;
the carbon price becomes a live market input (the platform wires EU ETS spot) feeding auction cost and
compliance. Rung 3: implement the real carbon-leakage trade×emission-intensity test (vs the binary
shortcut), model the CSCF, and add a stochastic price process using the 35% volatility.

**Prerequisites (hard).** Fix the harness failures — §4.2 shows `POST /cap-trajectory` and
`/carbon-price-forecast` **failed**, and the ETS2 500 defect; the benchmark reference is `db-empty`
(seed `ets_product_benchmarks`, roadmap D0). Preserve the published-value transcriptions.
**Acceptance:** the §7.4 cement-clinker worked example (473,250 tCO₂ final allocation, €23.42M auction
cost) reproduces; `POST /ets2-readiness` returns a valid result instead of a 500; the cap trajectory
responds to MSR intake; a live ETS price moves the auction cost; the failing endpoints pass the harness.

### 9.2 Evolution B — EU ETS compliance-and-price analyst with tool-called calculation (LLM tier 2)

**What.** A tool-calling analyst for compliance/carbon-desk teams: "calculate our free allocation for
2030" (`/free-allocation` → benchmark decline, CBAM phase-out, auction exposure/cost), "what's our
compliance position and penalty risk?" (`/compliance` → surplus/deficit, purchase cost, €100/t penalty),
"forecast the carbon price under Fit-for-55" (`/carbon-price-forecast`), "project the cap to 2040"
(`/cap-trajectory`), and "are we ETS2-ready?" (`/ets2-readiness`) — narrating real regulatory
calculations across the ETS stack.

**How.** Tool schemas over the 5 POST + 6 GET operations; the reference endpoints (product benchmarks,
price scenarios, CBAM phase-out, cap parameters, leakage tiers) are exceptional RAG grounding for
"what's the cement clinker benchmark?" or "what's the 2030 CBAM free-allocation percentage?" questions.
The no-fabrication validator checks every tCO₂, € and benchmark against tool output; the copilot flags
the documented simplifications (binary leakage, fixed CSCF) until Evolution A. Composable with `cbam`
and `facilitated_emissions` in a carbon/regulatory desk.

**Prerequisites.** Evolution A's ETS2 fix, harness fixes, and seeded benchmarks (so all endpoints work
for tool-calling); Atlas + reference corpus embedded (roadmap D3). **Acceptance:** every figure cited
traces to an engine tool call; the free allocation and auction cost match `/free-allocation`; the
compliance penalty matches the €100/t calculation; the ETS2-readiness answer returns a real score, not
a 500.
