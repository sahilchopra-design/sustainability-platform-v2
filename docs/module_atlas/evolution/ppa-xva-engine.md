## 9 · Future Evolution

### 9.1 Evolution A — Multi-curve Monte Carlo exposure with calibrated vol/PD (analytics ladder: rung 2 → 3)

**What.** The XVA suite (`ppa_xva.py`, 998 lines, no PRNG, full CVA/DVA/FVA/KVA/MVA/ColVA stack with exact lattice PFE quantiles) is deterministic and honest — but §7.10 lists its structural ceilings: a single-factor annual-step CRR lattice with the node price treated as flat forward, one shared lattice for all netted contracts, hand-authored PD curve/migration matrix ("APPROXIMATE, rounded... not a licensed data feed"), and a documented SA-CCR proxy. Evolution A upgrades the exposure model to a seasonal-step, per-region simulation calibrated to observed merchant-price volatility, and pins the current lattice as the cross-check.

**How.** (1) Add `POST /cva-mc`: mean-reverting (Schwartz one-factor) price paths per delivery region using the standard-PRNG convention, with vol/mean-reversion estimated from ingested EIA/ENTSO-E day-ahead history; quarterly steps capture margining dynamics the annual lattice cannot. (2) Netting sets gain per-contract curves with a user-supplied correlation matrix, retiring the documented single-lattice limitation. (3) Replace the approximated PD table with the platform's rating-based PD assets already shared via `table:published` with `pf-credit-rating-engine` (§6), keeping the `GET /ref/pd-curves` transparency pattern. (4) bench_quant pins the §7.6 3-year hand-traced lattice example so the refactor cannot drift.

**Prerequisites.** Fix the lineage-harness failures on `POST /cva` and `/netting` (§4.2 records both `failed`); price-history retention for calibration. **Acceptance:** MC engine converges to the lattice CVA within tolerance on the flat-vol reference case; calibrated sigma is reported with its estimation window in `method_notes`.

### 9.2 Evolution B — XVA desk explainer with CSA what-if tooling (LLM tier 2)

**What.** XVA is the platform's least self-explanatory output — a treasury user seeing "CVA $412k, KVA $890k" needs the decomposition narrated. The copilot answers "why did collateralising at $2M threshold only halve CVA?" from the engine's own response payload (EE profile, haircut applied, MPR add-on, `p_clamped` flag) and runs CSA-negotiation what-ifs — "zero threshold, weekly margining, IG-corporate collateral" — as `POST /cva` tool calls, comparing stacks side by side.

**How.** Tier-2 tool schemas from the two POST operations plus the four `GET /ref/*` tables (migration matrix, PD curves, haircuts, SA-CCR params) so the copilot cites the actual supervisory factor (40% electricity, α=1.4 CRE52.1) rather than reciting Basel from training data. System prompt embeds §7.10's limitation list verbatim — the copilot must volunteer that PD curves are approximations and KVA is a proxy whenever quoting those terms. The no-fabrication validator checks every $ figure against tool outputs.

**Prerequisites.** Same endpoint repairs as Evolution A; golden Q&A from the §7.6 worked example. **Acceptance:** the copilot's CVA decomposition sums to the engine's reported total, and it refuses to state a "regulatory capital requirement" as fact, citing the documented SA-CCR-proxy caveat instead.
