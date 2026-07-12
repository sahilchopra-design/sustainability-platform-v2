## 9 · Future Evolution

### 9.1 Evolution A — Voyage-data grounding and multi-year compliance-cost projection (analytics ladder: rung 2 → 4)

**What.** A six-framework maritime-climate engine (pure computation, no DB): IMO CII rating
(A–E bands on `attained/required` with the Z-factor tightening 5–20% over 2023–2030), EEXI (a
stated simplification `0.00349 × 195 × P_eff/(DWT × v^0.3)`), Poseidon Principles alignment,
FuelEU Maritime penalty (`deficit × €2,400/t`), EU ETS shipping obligation (40/70/100% phase-in,
50% extra-EU eligibility), fuel-switch economics, and fleet aggregation. Parameter tables cite IMO
MEPC sources. Inputs (fuel burned, distance, voyage split) are caller-supplied per vessel, and
several POST endpoints trace `skipped` under the harness. Evolution A grounds inputs and projects
costs forward.

**How.** (1) Add a multi-year compliance-cost projection per vessel/fleet: CII rating trajectory as
Z tightens, FuelEU deficits as targets step down (2025–2050), and ETS obligation as phase-in and
free allocation evolve — a single NPV of regulatory cost per vessel (rung 4), the number a ship
financier actually needs. (2) Ground vessel particulars and fuel consumption from ingested fleet
data (IMO DCS/THETIS-MRV style records) rather than hand-typed inputs, with a provenance tier. (3)
Replace the EEXI simplification with the full attained-EEXI formula or scope it explicitly. (4)
Confirm the POST endpoints pass the harness and bench-pin CII, FuelEU, and ETS against published
worked examples.

**Prerequisites.** A fleet/voyage data source (MRV public data is feasible); endpoint verification.
**Acceptance:** a vessel returns a 2025–2050 compliance-cost NPV across the three regimes; CII/
FuelEU/ETS bench-pinned to worked examples; inputs carry a provenance tier; POSTs return `passed`.

### 9.2 Evolution B — Ship-finance climate copilot (LLM tier 2)

**What.** A copilot for shipping lenders and owners: "run the full assessment on this bulker —
what's its CII rating, when does it fall to D, what are its FuelEU and ETS bills, and is my
portfolio Poseidon-aligned?" — calling `/full-assessment`, `/fleet-portfolio`, and the per-framework
endpoints, every number tool-sourced.

**How.** Eight POST endpoints plus four reference GETs (CII requirements, fuel emission factors,
FuelEU targets, vessel types) that ground every constant with its IMO/EU citation. The consolidated
`/full-assessment` gives a one-call vessel verdict; `/fuel-switch` powers "what if we retrofit to
methanol?" economics; `/fleet-portfolio` and the Poseidon score serve the lender view. Strong node
for a shipping-finance desk, cross-linking to `sector_calculators` (the sibling CII implementation —
the two should reconcile) and trade-finance copilots.

**Prerequisites.** Endpoint verification (several trace `skipped`); reconciliation with the sibling
`sector_calculators` shipping calculator so the platform gives one CII answer. **Acceptance:** every
rating, penalty, and obligation figure traces to a tool response; the copilot cites the reference
table (MEPC/FuelEU/ETS) behind each threshold; identical vessel inputs to this and
`sector_calculators` yield consistent CII narrations; it refuses to assert flag-state compliance.
