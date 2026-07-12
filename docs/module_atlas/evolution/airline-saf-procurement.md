## 9 · Future Evolution

### 9.1 Evolution A — Real LCOF-based SAF premium engine with credit stacking (analytics ladder: rung 1 → 3)

**What.** Per the §7 partial-mismatch flag (EP-EF5), the guide's pricing methodology
`Premium = LCOF − Jet_fuel_price + Carbon_credit_value` is **not implemented**: the actual engine is
a simple indexation projection (`premium = basePrice × index_multiplier − JetA_forecast`) with no
levelised-cost-of-fuel build-up, no pathway differentiation (HEFA vs FT vs PtL premia), and no
carbon-credit stacking; the 16 deals are PRNG-generated so a "Signed" deal can sit against an airline
whose row says `ltc: false` (§7.5). Evolution A builds a real premium engine: pathway-specific LCOF
(feedstock, capex, opex by HEFA/AtJ/FT/PtL), spot-linked Jet-A, and credit stacking (IRA §45Z / BTC,
UK RTFC, EU ETS avoided cost) — the $1.5–8/gal spectrum the guide references, computed rather than
sliders.

**How.** A `saf_pricing_engine` with `POST /api/v1/saf/premium` (pathway, feedstock, volume, credits
→ LCOF, premium, portfolio cost) and `GET /ref/pathways` (LCOF build-ups with citations); the PPA
scenario projection keeps its indexation types but escalates a real spot-linked Jet-A. Rung 3:
calibrate LCOF against BNEF SAF Market Outlook and ICAO CORSIA fuel figures the page already cites.

**Prerequisites (hard).** Purge the `sr()` deal generator (or clearly label the 16 deals as demo
fixtures) per the no-fabricated-random guardrail; fix the documented "Hybrid" indexation falling
through to flat (§7.2); resolve deal-airline consistency (LTC deals against non-LTC airlines).
**Acceptance:** the §7.4 PPA case still yields ~$2.06/L premium at legacy assumptions, but a PtL
pathway now shows a higher premium than HEFA; adding a §45Z credit lowers the net premium; portfolio
cost is volume-weighted across real deals.

### 9.2 Evolution B — SAF offtake structuring copilot (LLM tier 1 → 2)

**What.** A copilot for airline sustainability teams and SAF producers answering "what premium
should I expect for a 10-year FT offtake at this volume?", "how does book-and-claim change the
economics for an airline that can't fuel at a SAF airport?", and "what's my ReFuelEU 2030 SAF
demand?" — grounded in the airline profiles, the PPA engine and the book-and-claim chain-of-custody
workflow (a faithful RSB/ISCC+ rendering, §7.6). Since deals are synthetic today, the tier-1 copilot
must disclose that the 16 deals are demo fixtures and the pricing lacks LCOF build-up.

**How.** Tier-1 roadmap pattern: §7.2 parameter table (indexation formulas, Jet-A forecast, rating
ordinals) and §7.6 framework alignment (ReFuelEU, CORSIA, IATA SAF PPA) embedded as the module
corpus; page state (selected airline, PPA slider settings) as context; served via `POST /api/v1/
copilot/airline-saf-procurement/ask` with the standard refusal path. After Evolution A, graduates to
tier 2 by tool-calling `POST /saf/premium` so "price a Lufthansa PtL PPA with EU ETS credit stacking"
runs the real engine, with the no-fabrication validator checking every $/L and Mt figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note.
**Acceptance:** the §7.4 worked PPA reproduces from page state; a request for an LCOF-based,
pathway-differentiated premium before Evolution A returns a refusal naming the absent cost build-up;
`totalSafDemand = Σ fuel_mt × target2030/100` is reproduced correctly (11.2 Mt all-regions).
