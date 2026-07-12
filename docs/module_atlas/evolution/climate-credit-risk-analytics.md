## 9 · Future Evolution

### 9.1 Evolution A — Real borrower book with EPC-grounded collateral haircuts (analytics ladder: rung 2 → 3)

**What.** §7 rates this a substantive module: a real two-channel overlay
(`climatePD = basePD × (1 + transSens×priceShock) × physMult`, LGD haircuts stacking
EPC band + physical + warming), lifetime ECL, NGFS conditioning, and a UK MEES/EPC
stranding view — aligned with its guide, with the 80-borrower portfolio the only
synthetic layer. Evolution A replaces the two weakest inputs with platform data that
already exists: the UK EPC register feed (wired during the data-sources wave) grounds
the `EPC_LGD_HAIRCUT` channel in actual property-level certificates rather than
assumed band distributions, and the physical-risk scores come from the Physical Risk
Digital Twin's composite engine at collateral coordinates instead of seeded values.

**How.** (1) `borrower_book` table (or fixtures with per-field provenance) joining
collateral postcodes → EPC register records → band-based haircut, with the register's
actual band and lodgement date displayed. (2) Physical scores via the digital twin's
scoring endpoints with `resolution_tier` carried into the LGD panel. (3) Calibration
pass on the stacked haircut coefficients (EPC A:0→G:0.25, 0.02/physical point,
0.03/warming degree) against published MEES-discount and flood-discount studies —
document fit or label expert-set, per §8 model-card convention.

**Prerequisites.** EPC feed auth is the known-changed item from the data-sources wave
(verify current access route); coordinates required per collateral for twin lookups.
**Acceptance:** a G-rated fixture property shows the register-sourced band driving
its haircut; two same-sector borrowers with different collateral locations produce
different climate LGDs traceable to grid values.

### 9.2 Evolution B — Watchlist-triage analyst (LLM tier 2)

**What.** The module already has watchlist, SICR staging, covenant, and engagement
machinery — the natural assistant is a triage analyst: "which borrowers newly qualify
for Stage 2 under Disorderly at $130 carbon, and why?", "summarise the climate case
on borrower X for the credit committee" (PD/LGD decomposition, EPC status, covenant
headroom, engagement history — all fields the page carries), "what's the retrofit
economics for our G-band exposures?" (the retrofit-programme table). Re-runs execute
as client-side tool calls over `calcClimatePD`/`calcClimateLGD`/the lifetime-ECL
engine.

**How.** Tool schemas over the three calculators plus watchlist filters; the
validator ties every PD, LGD, ECL, and bps figure to invocations; committee-summary
drafts follow a fixed structure (exposure, channels, staging, actions) with each
number sourced; supervisory-framework questions cite the §5 corpus (ECB stress-test
methodology, BCBS 530).

**Prerequisites.** Evolution A preferred so summaries concern real collateral — with
synthetic borrowers the assistant must label outputs as demonstration; RBAC scoping
for borrower-level data. **Acceptance:** a Stage-2 triage list reproduces exactly on
re-run with stated parameters; a committee draft contains no numeric absent from tool
returns.
