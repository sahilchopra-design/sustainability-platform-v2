## 9 · Future Evolution

### 9.1 Evolution A — Live CBAM pricing/FX and populated ctp_* tables (analytics ladder: rung 1 → 3)

**What.** A large DB-first, reference-fallback facade over six stakeholder engines (exporter search,
CBAM auto-fill, supplier ranking, China ESG/ETS, trade corridors, marketplace) plus cross-module
bridges. Its two genuinely computational blocks — CBAM liability with CETS Art. 9 deduction, and the
6-point P&L price-scenario grid — are sound. But §7.6 is blunt: essentially *all* reference numbers
(12 exporters' readiness/ESG scores, corridor liabilities, CETS positions, NGFS price paths, Scope-3
factors) are **curated synthetic snapshots** hard-coded in the engine — plausibly scaled to public
figures, company names real, metrics authored. The CBAM model also uses a single default EU ETS
price, fixed FX (0.128 CNY/EUR, 1.09 EUR/USD), and `1.35 × benchmark` as a default-intensity proxy.
Evolution A populates the `ctp_*` tables with real exporter/corridor/ETS data and wires live EU
ETS/CETS prices and FX.

**How.** Ingesters load real Chinese-exporter emissions (the platform wires Comtrade/China-trade
sources), CETS prices (CBEEX), and EU ETS spot into the `ctp_entities`/`ctp_export_products`/
`ctp_ets_positions` tables so the engines' DB-first path returns real rows; the CBAM calculator's
fixed price/FX constants become live inputs. Rung 3: replace the `1.35 × benchmark` default-intensity
proxy with CBAM's country/process-specific default values and calibrate the ECL PD/LGD uplift bands
(illustrative today) against observed CBAM-exposed credit data.

**Prerequisites.** The `db-empty` provenance across corridor/entity-hub/portfolio-CBAM routes (§4.2)
is the headline gap — `entity-hub` returns an error when `ctp_entities` is empty; seed real rows
(roadmap D1). **Acceptance:** the §7.4 Baowu worked example (€2,583,876 net CBAM) reproduces at
legacy constants; a live EU ETS price moves the liability; `entity-hub` returns a real entity card;
routes report `source: db` not `source: reference`.

### 9.2 Evolution B — China-CBAM desk analyst across the cross-module bridges (LLM tier 3)

**What.** This domain is explicitly built as a cross-module hub (Scope 3 Cat 1 → Supply Chain,
ECL-CBAM overlay → Financial Risk, CSRD crosswalk → Regulatory, NGFS×CETS → Scenario Analysis,
portfolio-CBAM → Portfolio Analytics) — the natural seed for a desk orchestrator. "Assess our China
trade CBAM exposure for Baowu steel" would chain exporter profile → CBAM liability → ETS position →
Scope-3 factor → ECL overlay → portfolio roll-up into one memo, narrating real engine outputs.

**How.** Tier-3 routing per the roadmap: the domain's own `cross-module/*` endpoints already define
the bridges; the orchestrator tool-calls them plus the CBAM calculator, composing output via the
report layer. The no-fabrication validator checks every €, tCO₂ and readiness score against tool
output; because most figures are curated snapshots today, the copilot must flag reference-fallback
data until Evolution A's real ingestion lands.

**Prerequisites (hard).** Evolution A's populated `ctp_*` tables (so the orchestrator narrates real
data, not authored snapshots); the desk-orchestrator framework (Phase 2–3); Atlas corpus embedded
(roadmap D3). **Acceptance:** an entity memo cites which engine and table produced each figure and
its db-vs-reference provenance; the CBAM liability matches `/cbam/calculate-liability` exactly; a
missing-entity query yields an honest gap, not a fabricated exporter profile.
