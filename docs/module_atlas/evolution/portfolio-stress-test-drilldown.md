## 9 · Future Evolution

### 9.1 Evolution A — Real asset-repricing behind the stress structure (analytics ladder: rung 2 → 4)

**What.** §7 confirms the *structure* is right: 5 NGFS scenarios with curated carbon-price/GDP-shock constants (NZ2050 $250/−1.2%, Divergent $300/−3.8%, hot-house worse — correct ordering), an entity-contribution waterfall (`weight_h · scenarioImpact_h`), a taxonomy topic drill, and a reverse-stress solve. But the per-holding scenario losses are synthetic `sr()` draws (`scenarioImpact = −[2,4,6,8,12] + (sr·2−1)·[6,8,10,12,15]`), and the "reverse stress" is a linear back-scaling of those synthetics, not genuine root-finding over a stress model. The weight×impact aggregation is legitimate; the inputs are the issue. Evolution A replaces the seeded losses with a real repricing model.

**How.** (1) Compute per-holding scenario losses from an actual climate-repricing model: transition losses from sector carbon-price sensitivity × the scenario's carbon price (the `ngfs-scenarios` workbench provides real sector PD-uplift/shock data), physical losses from the physical-risk modules — over real `portfolios_pg` holdings via the shared engine. (2) The entity-contribution waterfall and taxonomy drill then attribute *real* losses. (3) Make the reverse stress a genuine root-find: solve for `{carbon price, GDP shock}` such that modelled portfolio loss > 20% by inverting the repricing function (scipy root-finder), not linearly scaling a synthetic base. This is the rung-4 predictive/scenario step. Blast radius 48 via shared engine.

**Prerequisites.** Real sector-shock data (from `ngfs-scenarios`) and physical damage functions; the portfolio-analytics endpoints (auth-gated); pin before touching the shared engine. Remove `sr()` from scenario impacts. **Acceptance:** per-holding losses derive from carbon-price/physical repricing, not `sr()`; the waterfall attributes real losses; reverse stress root-finds real breaking conditions.

### 9.2 Evolution B — Stress-test analyst copilot (LLM tier 2)

**What.** A copilot for the stress workflow §1 describes: "run NGFS Divergent and show me the loss waterfall", "which holdings drive the stress loss?", "what carbon price breaks my portfolio past 20% loss?", "decompose the loss by taxonomy topic" — executed against the (Evolution-A) repricing and reverse-stress engines, with every loss traced to the model.

**How.** Tool calls to the stress and reverse-stress endpoints (and the `/scenarios/compare` portfolio-analytics endpoint); system prompt from this Atlas page's §5 and the NGFS/ECB CST references named in §5. The entity-contribution and reverse-stress answers are tool calls; the fabrication validator matches every loss %/carbon price to a response, with scenario provenance in the "show work" expander. Because the shared engine feeds 48 modules, this analyst composes with the climate-VaR and temperature-score copilots for a full stress narrative.

**Prerequisites (hard).** Evolution A — narrating the current seeded scenario losses as NGFS stress results, or the linear back-scale as a "reverse stress test," would present fabrication as regulatory stress-testing output. **Acceptance:** every loss/breaking-condition figure traces to a real repricing/root-find; the waterfall sums to portfolio loss; reverse-stress results come from genuine root-finding.
