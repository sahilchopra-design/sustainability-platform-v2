## 9 · Future Evolution

### 9.1 Evolution A — Reconciled hedging economics and PD×LGD counterparty climate VaR (analytics ladder: rung 2 → 3)

**What.** The module already has genuine scenario mechanics (the 1.8/1.4/1.0/0.5 NGFS
multiplier re-scales all analytics live, and the 12-commodity `ngfs_nz`/`ngfs_cp`
table is well calibrated per §7.2), but §7.4 documents a real arithmetic defect: the
hedging cost-benefit formula mixes scales, so at default parameters hedging EUR
exposure shows −$28M net benefit — an artefact, not a finding. Evolution A fixes the
unit basis (express both `hedgingCost` and VaR terms in bps of exposure), replaces the
counterparty flat-haircut `climateVaR = EAD × random%` with the PD×LGD×EAD
decomposition the platform's own `climate-credit-integration` module already
implements (§7.5 draws the contrast), and sources Below-2°C/NDC commodity paths from
actual NGFS vintage data instead of midpoint interpolation.

**How.** (1) Move the corrected formulas into a backend `treasury_climate_engine`
(currently Tier B, all frontend) with `POST /var` and `POST /hedging-analysis`.
(2) Reuse the rating→PD term structure already in the page (§7.2 confirms it matches
published default-rate bands) as the calibration anchor. (3) Pin the worked EUR/$100M
example in `bench_quant` so the hedging sign defect can never regress.

**Prerequisites.** The §7.4 scaling defect acknowledged and fixed first — calibrating
on top of it would freeze the bug. **Acceptance:** at default parameters, hedging
net-benefit is positive for high-vulnerability currencies and the bench pin reproduces
the corrected worked example to the cent.

### 9.2 Evolution B — Treasury what-if analyst over live scenario tools (LLM tier 2)

**What.** A tool-calling analyst for treasury teams: "what happens to our liquidity
buffer if we're in Net Zero 2050 and Brent falls 35%?", "rank our 25 counterparties by
climate-adjusted PD and tell me which cross the BBB threshold". It executes these as
calls against Evolution A's `POST /var` and `POST /hedging-analysis` endpoints plus a
`GET /commodities` reference route exposing the calibrated NGFS sensitivity table, and
narrates real outputs — including drafting the TCFD treasury-risk disclosure paragraph
(the module's stated IFRS S2/TCFD deliverable) from computed figures only.

**How.** Tier-2 pattern: tool schemas from the module's OpenAPI operations, read-only
first; per-module system prompt built from this Atlas page, with §7.2's provenance
table included so the analyst correctly labels the counterparty book as synthetic demo
data. The no-fabrication validator checks each numeric against tool outputs; the
"show work" expander lists scenario multiplier and formula version used.

**Prerequisites (hard).** Evolution A must land first — there is no backend today
(Tier B, EP-DD5 frontend-computed), and the copilot must never narrate the current
defective hedging numbers. **Acceptance:** every figure in an answer traces to a tool
call; asked about a scenario the engine doesn't model (e.g. RCP 8.5 commodity paths),
the analyst states the module's scenario set and refuses to extrapolate.
