## 9 · Future Evolution

### 9.1 Evolution A — Fleet/plant-level analytics and repaired calculators (analytics ladder: rung 2 → 3)

**What.** Two hard-sector decarbonisation calculators with well-cited constants: shipping
(IMO CII/EEXI/AER — `AER = annual_CO2×10⁶/(capacity×distance)`, `CII_ref = a×capacity^(−c)` per
MEPC.338(76), MARPOL fuel factors, A–E rating with a 2%/yr reduction factor from 2026) and steel
(route-mix intensity vs the IEA NZE glidepath, `weighted_intensity = Σ share×intensity`, RAG at the
1.20 tCO2/t 2030 line). Two honest caveats: `EEXI ≈ AER × 0.95` is an explicit approximation, and —
more urgently — both `POST /calculate` endpoints trace **failed** in §4.2, so the computational core
isn't passing the harness. Evolution A repairs and deepens both.

**How.** (1) Fix the two failing calculate endpoints (payload/validation under the harness) so the
domain's only computations work end-to-end. (2) Extend from single-vessel/single-plant to fleet and
portfolio level: batch inputs with fleet-weighted CII trajectory to 2030 (the rating reference
tightens 2%/yr — project when each vessel falls to D/E) and steel-fleet gap-to-NZE aggregation. (3)
Replace the EEXI approximation with the actual EEXI technical formula or clearly scope it out. (4)
Bench-pin AER/CII rating bands and the steel weighted intensity against IMO/IEA worked examples.

**Prerequisites.** The two `/calculate` endpoints repaired; IEA NZE steel pathway data (shared with
`glidepath`). **Acceptance:** both calculators return `passed`; a fleet input returns per-vessel
ratings plus a projected year-of-downgrade; steel RAG matches the IEA glidepath source; bench pins
reproduce a MEPC.338(76) reference calculation.

### 9.2 Evolution B — Hard-sector financing copilot (LLM tier 2)

**What.** A copilot for shipping/steel financing desks: "rate this vessel's CII and tell me when it
drops to D under the tightening reference line" (calling `/shipping/calculate` and citing the AER vs
CII_ref band), and "how far is this steel producer's route mix from the IEA 2030 line?" (calling
`/steel/calculate`) — each figure tool-sourced.

**How.** Two POST calculators plus three reference GETs (vessel-types, fuel-types, steel
iea-glidepath) that ground every constant — the copilot cites MARPOL emission factors and the
MEPC.338(76) reference-line parameters from the module's own registries, never from memory. What-ifs
("switch to LNG", "raise EAF share to 60%") re-run statelessly and produce fuel/route-transition
narratives. Feeds the Poseidon-Principles-style shipping-finance and steel-transition conversations,
cross-linking to `shipping_maritime` and the glidepath copilots.

**Prerequisites.** Evolution A's endpoint fix is mandatory — both computational tools currently fail,
so a copilot would have nothing real to narrate. **Acceptance:** every AER, rating, and intensity
figure traces to a calculate response; fuel/route what-ifs reflect fresh engine calls; the copilot
labels EEXI as approximate while that remains true and refuses to assert regulatory CII compliance
(a flag-state determination).
