## 9 · Future Evolution

### 9.1 Evolution A — Delivered-cost model with live freight and cracking-penalty economics (analytics ladder: rung 1 → 2)

**What.** §7 confirms this is a curated maritime-logistics tool: 15 real-named terminals (Dampier, Sines, Jeddah) with storage capacity, tank type (refrigerated −33°C vs pressurised), and cracker fields, plus 5 trade routes, attributed to SIGTTO/H2Global/Wuppertal sources. The headline `Total_cost = LCOA + freight + terminal_handling + cracking_penalty` is a real cost stack, but freight ($50–120/t) and the cracking penalty (15–20% energy + $50–100/t) are static ranges. Evolution A builds a computed delivered-cost model: freight from VLGC day-rates and route distance, terminal handling from throughput, and the NH₃-cracking penalty from real energy prices — so the delivered cost of green H₂-via-ammonia responds to shipping-market and energy conditions, per route.

**How.** (1) A backend route computing per-route delivered cost: LCOA (from the production-economics sibling) + freight (VLGC rate × voyage days) + handling + cracking penalty (energy penalty × H₂ price + capital). (2) Wire VLGC freight rates and energy prices from market feeds. (3) The cracking-vs-direct-use decision becomes a computed comparison (deliver as NH₃ vs crack to H₂), a key economic question the module currently only describes.

**Prerequisites.** VLGC freight-rate and energy-price feeds; route distances; LCOA input from the production sibling. **Acceptance:** delivered cost per route recomputes from the §5 stack when freight or energy price changes; the crack-vs-deliver comparison is computed; static freight/penalty ranges are replaced by derived figures.

### 9.2 Evolution B — Ammonia logistics copilot (LLM tier 1 → 2)

**What.** A copilot for trade and logistics planners: "what's the delivered cost of green H₂ shipped as ammonia from Dampier to Rotterdam and cracked, versus direct ammonia use?" narrates the terminal infrastructure, trade routes, and cracking-penalty economics from the atlas corpus, with tier-2 computing delivered cost per route via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (VLGC dynamics, terminal CAPEX benchmarks, cracking energy penalty, IMO safety framework are cited) — the copilot cites real terminals and route structures while flagging cost figures as curated ranges. Tier 2 tool-calls the delivered-cost endpoint so route and crack-vs-deliver what-ifs are computed. Every $/t figure validated against tool output.

**Prerequisites.** Corpus embedding; Evolution A for computed delivered cost. **Acceptance:** every cost figure cited traces to the curated table or the endpoint; post-Evolution-A, route what-ifs return computed delivered costs; the copilot presents the crack-vs-deliver trade-off as a computed comparison, not a narrative.
