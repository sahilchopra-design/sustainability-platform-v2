## 9 · Future Evolution

### 9.1 Evolution A — Real DALY co-benefit NPV engine with concentration-response functions (analytics ladder: rung 1 → 3)

**What.** Per the §7 mismatch flag, the guide's entire premise — `NPV_coBenefit = Σ_t[DALY_avoided(t)
× VSL / (1+r)^t]` with country VSLs, concentration-response functions and SCC add-ons — is **not
implemented**: the page is a descriptive dashboard of 50 synthetic cities (health costs are
single-scalar heuristics like `mortalityCost = pm25·pop·0.8`) and 80 synthetic companies, with no
project input, no discounting and a WHO compliance test that conflates 24-hour and annual guideline
levels (§7.2). Evolution A builds the actual engine: user-entered project emission-reduction
profiles → PM2.5 concentration change via GBD/WHO integrated exposure-response functions → DALYs
avoided → monetisation at country-specific OECD/World Bank VSL → discounted co-benefit NPV, plus a
carbon co-benefit at the platform's SCC, producing the blended-NPV-with-and-without-co-benefits
comparison the guide promises.

**How.** A `air_quality_finance_engine` with `POST /api/v1/aq-finance/co-benefit-npv` (project
profile, location, discount rate → DALY avoidance, health NPV, blended IRR) and `GET
/ref/vsl-by-country` + `/ref/who-aqg`; concentration-response coefficients seeded from GBD 2021 as
cited reference tables. Rung 3 calibration: anchor the DALY-per-µg factors against published WHO
HRAPIE/AirQ+ outputs and validate VSL figures against the OECD meta-analysis the guide names.

**Prerequisites (hard).** Purge the `sr()` city/company generators per the no-fabricated-random
guardrail; fix the WHO annual-vs-24h threshold conflation (annual PM2.5 = 5, not 15) documented in
§7.2; the quarterly trend currently drifts *up* ~2%/quarter by construction — replace with data or
remove. **Acceptance:** a project reducing PM2.5 by a set increment produces a discounted health NPV
that scales with population and VSL; WHO compliance uses the correct annual guideline; carbon
co-benefit adds at the platform SCC.

### 9.2 Evolution B — Clean-air investment-case copilot (LLM tier 1 → 2)

**What.** A copilot answering "what's the health co-benefit case for this PM2.5 abatement project?",
"which abatement technology gives the best cost-effectiveness?" (over the 10-tech catalogue), and
"how does adding co-benefits change the NPV?" — grounded in the page's computed aggregates and, once
Evolution A ships, the real engine. Because today's health costs are heuristic scalars, the tier-1
copilot must state that mortality/morbidity/DALY figures are demo values, not VSL-based estimates.

**How.** Tier-1 roadmap pattern: §7.1 formulas, §7.2 parameter table and §7.6 framework alignment
(WHO AQG 2021, IFC PS3, ICMA GBP) embedded as the module corpus; page state (filtered cities,
selected abatement tech) as context; served via `POST /api/v1/copilot/air-quality-finance/ask` with
the standard refusal path. After Evolution A, graduates to tier 2 by tool-calling
`POST /co-benefit-npv` so "value the health benefit of halving PM2.5 in a 10M-person city" runs the
real engine, with the no-fabrication validator checking every DALY and dollar figure.

**Prerequisites.** Atlas corpus embedded (roadmap D3); grounding carries the §7 mismatch note so the
copilot never presents the heuristic health scalars as VSL-based NPV. **Acceptance:** every figure
cited matches page state with its synthetic status stated; a request for a discounted co-benefit NPV
before Evolution A returns a refusal naming the absent VSL/CRF inputs.
