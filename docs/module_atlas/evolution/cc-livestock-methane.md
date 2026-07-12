## 9 · Future Evolution

### 9.1 Evolution A — Real GWP* dual-metric accounting (analytics ladder: rung 1 → 2)

**What.** §7 notes the IPCC Tier 2 science is implemented correctly
(`CH4 = GEI·Ym·365·head/55.65`, VS·B₀·MCF manure accounting) but flags two honest
gaps: the GWP* flow-vs-pulse comparison the guide implies is "hard-coded/illustrative,
not a real GWP* integration", and the code files under AMS-III.BF with GWP 27.2 while
the guide cites VM0041 and 29.8. Evolution A implements actual GWP* alongside GWP100:
`E_CO2we = GWP100·(4·ΔE_CH4_rate·H − 3.75·E_CH4)` computed from the herd's emission
trajectory, so a shrinking-Ym intervention (3-NOP, Asparagopsis — both in the real
`FEED_ADDITIVES` table with dose and cost data) shows its genuinely larger
warming-equivalent benefit for short-lived methane.

**How.** (1) Time-series extension of `calcEnteric`: baseline and project CH₄ rates
over a 20-year horizon, GWP* computed from the rate delta, charted against the GWP100
line. (2) Metric labels and the methodology code (AMS-III.BF vs VM0041) reconciled with
the guide so the §7 mismatch clears. (3) Intervention cost-effectiveness: $/tCO₂e and
$/tCO₂we per additive from the existing `cost_per_head_yr` field.

**Prerequisites.** GWP basis decision (biogenic 27.0/27.2 vs guide's 29.8) documented;
GWP* formula sourced to Allen/Cain et al. per §8 model-card convention. **Acceptance:**
a constant-herd, reduced-Ym scenario shows GWP* benefit exceeding GWP100 benefit in
early years; the hard-coded illustrative comparison is deleted.

### 9.2 Evolution B — Herd intervention copilot (LLM tier 1 → 2)

**What.** A copilot for the questions the module's economics turn on: "why does seaweed
score 3x the credits of 3-NOP?" (Ym reduction 50–80% vs 20–30% — real values in
`FEED_ADDITIVES`), "what's my cost per credit at 500 head?", "why does the covered
digester beat the lagoon?" (MCF differences in `CLIMATE_REGIONS`). Grounded in atlas
§5/§7 and live calculator state; tier-2 what-ifs re-invoke `calcEnteric` and the manure
engine client-side — no backend routes exist to call.

**How.** Tier 1: RAG over this atlas page with the §7 mismatch disclosed until fixed
(the copilot must say "this page computes with GWP 27.2" — not the guide's 29.8).
Tier 2: tool schemas over the two calculators; validator matches every kgCH₄/tCO₂e
numeric to a logged invocation.

**Prerequisites.** Evolution A's metric reconciliation for a clean corpus; additive
efficacy claims cited to trial literature, flagged as trial-condition ranges.
**Acceptance:** cost-per-credit answers reproduce `cost_per_head_yr / credits_per_head`
arithmetic exactly; a question about milk-yield side effects is refused as outside the
module's computed surface.
