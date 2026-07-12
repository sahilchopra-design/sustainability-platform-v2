## 9 · Future Evolution

### 9.1 Evolution A — GLEC-grounded MAC engine on real emission factors (analytics ladder: rung 1 → 2)

**What.** Today the module's only genuine cross-portfolio computation is the GLEC
weighted composite (`Σ portfolioScore×weight/100`, correctly implemented); the 100
companies are fully `sr()`-seeded, the advertised MAC methodology
(`MAC = ΔCost/ΔEmissions`) is never computed, and §7.6 documents that the platform's
`EMISSION_FACTORS` refdata table is imported but never used. Evolution A makes the MAC
formula real: a backend `transport_mac_engine` computing marginal abatement cost per
mode×lever combination from the 9 hand-curated `LEVERS` (investment, reduction,
timeframe fields already exist) against the genuinely calibrated `MODE_INTENSITY`
baselines (62/22/8/602/180/35 gCO2e/tkm — §7.2 confirms these match ICCT/GLEC
benchmarks).

**How.** (1) New router `api/v1/routes/transport_decarb.py`: `POST /mac-curve` (fleet
inventory in → ranked MAC curve out) and `GET /levers`. (2) Wire the dead
`EMISSION_FACTORS` import into per-fuel intensity so diesel/LNG/electric/hydrogen
splits drive emissions, and renormalise fleet composition to 100% (the >100% mix bug
§7.6 flags). (3) Derive per-company GLEC scores from the 7-criterion formula instead
of the independent `40+sr()×55` draw, so the criterion table and company scores agree.

**Prerequisites.** Fleet-mix renormalisation fix; lever cost fields converted from
display strings ("$1.2T") to typed numerics at source. **Acceptance:** MAC curve output
is reproducible from lever inputs, `bench_quant`-style pin on one worked mode×lever
case, and fleet-mix percentages sum to 100 for every generated company.

### 9.2 Evolution B — Modal-shift analyst with tool-called route optimisation (LLM tier 2)

**What.** The Modal Shift Analyzer already performs a genuine before/after comparison
over `ROUTES` (baseline vs optimal emissions and cost). Evolution B puts a tool-calling
analyst on top: "shift our top 10 air-freight lanes to rail where transit time allows
+2 days — what's the CO2e and cost delta, and which FuelEU/CORSIA obligations change?"
The LLM calls the module's endpoints (post-Evolution-A `POST /mac-curve` plus a new
`POST /modal-shift` exposing the existing shift computation server-side) and narrates
real engine output, citing the 9-row `REGULATIONS` dataset (IMO GHG Strategy, FuelEU
Maritime, UK ZEV mandate) for the compliance dimension.

**How.** Tool schemas auto-generated from the module's OpenAPI operations per the
tier-2 pattern; the per-module system prompt carries §7.2's provenance table so the
copilot correctly distinguishes calibrated anchors (mode intensities, GLEC criteria)
from synthetic dispersion (company-level draws). The no-fabrication validator checks
every tCO2e and cost figure in answers against tool outputs.

**Prerequisites (hard).** Evolution A's backend must exist — there are currently zero
endpoints to call (Tier B, EP code None); the modal-shift math must move server-side.
**Acceptance:** every numeric in an answer traces to a tool call; asked for a
company-specific verified emissions figure, the analyst discloses the portfolio is
synthetic demo data and refuses to present it as reported actuals.
