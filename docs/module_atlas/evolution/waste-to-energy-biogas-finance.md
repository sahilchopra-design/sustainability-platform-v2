## 9 · Future Evolution

### 9.1 Evolution A — Real cash-flow waterfall replacing the IRR heuristic (analytics ladder: rung 1 → 2)

**What.** The calculator's only formulaic pieces are a two-stream revenue estimate
(with two unlabelled magic numbers, 0.85 CF and 1.8 t/MW/yr) and
`estimatedIRR = clamp(gateFee/10 + elecPrice/50, 5, 18)` — §7's mismatch flag is
blunt that this is not an IRR: no capex, opex, debt, or tax term, so a 500MW EfW plant
and a 5MW AD plant show identical IRR at the same prices (§7.4). The 22-project
pipeline's `irr`/`debtGearing`/`capexM` are independent random draws, and the 25-year
`CF_DATA` chart is unconnected to the calculator. Evolution A implements the §8 spec:
a full annual waterfall (`Revenue − Opex − DebtService`), `DSCR` per year against the
1.3× lender floor, `FCFE` and a Newton-Raphson equity-IRR solve (the platform already
has a correct `calcIRR` in `wind-repowering-intelligence` to reuse, per §8.2), plus
the advertised `LCOE = (CapEx×CRF + Opex)/(Capacity×CF×8760)` — all parameterised from
the genuinely useful 8-technology matrix (`capex`, `opex`, `efficiency`, `gateFee`
fields already exist) and the 6-country `POLICY_DATA` REC values.

**How.** Backend route `POST /api/v1/wte-finance/project-model` (module is Tier B,
EP-EJ3); the Cash Flow tab renders the model's actual waterfall instead of the seeded
`CF_DATA`; pipeline projects get model-derived IRRs from their own technology/capacity
fields.

**Prerequisites.** The magic numbers replaced by per-technology CF and tonnage
parameters with cited sources (IEA Bioenergy Task 36, Eunomia); the heuristic IRR
deleted, not kept as fallback. **Acceptance:** bigger plants show scale economics
(different IRR at same prices); a fixture case's IRR matches spreadsheet XIRR to 1bp;
the Cash Flow tab total reconciles with the calculator's revenue.

### 9.2 Evolution B — Deal-screening analyst for AD/EfW term sheets (LLM tier 2)

**What.** The module's users screen waste-infrastructure deals where gate-fee contract
terms dominate risk (§8.6: 45% revenue weight, and municipal contracts reprice at
renewal — the single largest IRR sensitivity). Evolution B is a tool-calling screener:
given a deal's parameters (technology, capacity, gate-fee tenor and price, offtake
terms, proposed gearing), it calls `POST /project-model` for base-case IRR/DSCR, runs
the standard lender stress (±20% gate fee and power price — §8.5's prescription) as
additional tool calls, checks covenant headroom, and maps the jurisdiction to the
right support scheme from `POLICY_DATA` (UK CfD vs Germany EEG vs US IRA §45) — 
returning a screening memo with every figure tool-sourced.

**How.** Tier-2 stack: tool schemas from Evolution A's OpenAPI operations; grounding
corpus is this Atlas page (§7.2's technology table and §8.6's gate-fee-renewal risk
give the analyst its domain judgement vocabulary). Stress-case results are presented
as ranges from actual runs, never interpolated by the LLM.

**Prerequisites (hard).** Evolution A — screening against the current bounded
heuristic would rubber-stamp any deal into the 5–18% band; RBAC on the route since
deal terms are confidential. **Acceptance:** memo base/stress IRRs and DSCRs each
trace to a distinct tool call; a deal whose stressed DSCR breaches 1.3× is flagged
with the breach year cited from the waterfall; asked for a live biomethane price, the
analyst reports the POLICY_DATA vintage instead of inventing currency.
