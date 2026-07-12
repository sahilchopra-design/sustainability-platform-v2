## 9 · Future Evolution

### 9.1 Evolution A — Live ETS pricing, year-varying grids, and Art. 9 rebate cap (analytics ladder: rung 2 → 3)

**What.** A substantial DB-backed CBAM engine: Specific Embedded Emissions (Art. 7), certificate
cost projection under the free-allocation phase-out (reproduced exactly, 2026 97.5% → 2034 0%),
compliance scoring, and a forward transition-exposure feed — already rung 2 with three ETS price
scenarios and NGFS/IEA transition paths. §7.5 names the deepening targets: ETS price *scenarios* are
illustrative trajectories not live auction prices, and the CBAM certificate price is modelled as
equal to the ETS price (which matches the regulation's weekly-average design but not real
settlement); grid emission factors are **static country seeds** (IEA-era), not year-varying; and
the calculator does not model the Art. 9 domestic-carbon-price **rebate cap** or verification-status
gating on default-value use. Evolution A wires live EU ETS auction prices, year-varying grid factors,
and the Art. 9 rebate cap.

**How.** A market-data ingester feeds real EU ETS weekly-average prices into the certificate-price
path (the scenarios remain as forward projections); grid emission factors become year-indexed from
IEA/ENTSO-E ingested series (the platform already wires ENTSO-E); `calculate_cbam_cost` adds the
Art. 9 rebate cap and gates default-value use on verification status. Rung 3: validate SEE outputs
against actual CBAM declarations and calibrate the transition-exposure trapezoidal approximation to
a discounted year-by-year sum.

**Prerequisites.** The engine is largely harness-passing (real-db across products/countries/
emissions) — the main work is data freshness, not endpoint repair; preserve the seeded reference
tables (product defaults, country risk) as the labelled fallback. **Acceptance:** the §7.4 worked
example (Indian steel supplier, ≈€8.14M net cost at 2030 51.5% free allocation) reproduces at legacy
prices; a live ETS price moves the certificate cost; a supplier in a country with a domestic carbon
price above the CBAM liability is correctly capped per Art. 9.

### 9.2 Evolution B — CBAM compliance analyst with tool-called cost projection (LLM tier 2)

**What.** A tool-calling analyst for importers and supply-chain teams: "calculate embedded emissions
for this steel product" (`/calculate-emissions`), "project our CBAM costs to 2034 under the ambitious
scenario" (`/project-costs`), "what's our portfolio CBAM exposure this year?" (`/portfolio-exposure`),
"score this supplier's compliance readiness" (`/supplier-risk/{id}`), and "record verified emissions"
(`/emissions`) — narrating the engine's real outputs including the free-allocation phase-out's
dominant cost effect and the Art. 4 default-value markup.

**How.** Tool schemas from the ~21 endpoints; read-only queries (dashboard, products, countries,
cost projection) auto-execute, while mutating actions (create supplier, record emissions, seed)
render a confirmation. The reference endpoints (ETS scenarios, free-allocation schedule, certificate
prices, country risk) are ideal RAG grounding for "what's the 2030 free-allocation percentage?"
questions. The no-fabrication validator checks every €, tCO₂ and score against tool output; the
copilot must flag when SEE uses default values (carrying the 30% markup) versus verified actuals.

**Prerequisites.** Evolution A's live pricing (so projected costs are current); Atlas + reference
corpus embedded (roadmap D3); RBAC so mutating actions run under the user's session. **Acceptance:**
every figure in an answer traces to an engine tool call; a cost projection matches `/project-costs`
exactly; a default-value-based SEE is flagged as carrying the Art. 4 markup, not presented as
verified; a "record emissions" action requires confirmation before writing.
