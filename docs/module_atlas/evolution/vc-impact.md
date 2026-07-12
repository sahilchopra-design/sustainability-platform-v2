## 9 · Future Evolution

### 9.1 Evolution A — Real cash-flow IRR/MOIC and a first IMM calculation (analytics ladder: rung 1 → 2)

**What.** Remove the module's most serious documented fabrication risk, then build the
advertised methodology. §7.5 flags that the "IRR%" and "MOIC" KPIs are cosmetic
relabels of generic random fields (`completion`, `compliance`) — there is no cash-flow
series anywhere in the file, and "Avg IRR: 65.0%" is a uniform draw a user could
reasonably mistake for fund performance. Evolution A implements §8's separation:
(1) a per-investment capital-call/distribution ledger with a Newton-Raphson IRR solver
and `MOIC = (distributions + NAV) / called` — note the page already contains partial
scaffolding (`calcIRR(cashFlows)`, `grossMultiple`, `totalDistribution` appear in §2's
derived-values map) that the KPI row simply doesn't use; (2) a first IMM slice:
IRIS+ metric selection per company with shadow prices (tCO2e → social cost of carbon;
social metrics reusing the `wellbeing-adjusted-returns` module's Green Book pattern,
per §8.4), giving `IMM = Σ(metric × shadow price) / capital invested`, capital-weighted
to portfolio level.

**How.** Backend `vc_impact_engine` with `POST /returns` and `POST /imm`; new tables
`vc_cashflows`, `vc_iris_kpis`; the m1–m6 unlabelled random metrics replaced by typed
IRIS+ fields. Flag any IRR with >50% unrealised NAV as provisional, per §8.6.

**Prerequisites.** The mislabelled fields acknowledged and deleted (not re-skinned);
shadow-price table seeded with cited sources. **Acceptance:** KPI-row IRR changes when
a distribution is edited in the ledger; MOIC renders as a multiple (2.1×), not a
percentage; a fixture portfolio's IRR matches a spreadsheet XIRR to 1bp.

### 9.2 Evolution B — LP-reporting copilot over the IMM engine (LLM tier 2)

**What.** Quarterly LP impact reports are the module's stated deliverable, and they're
narrative-heavy: IMP Five Dimensions commentary (What/Who/How Much/Contribution/Risk)
wrapped around computed figures. Evolution B is a tool-calling drafter: "prepare the
Q3 LP letter's impact section for Fund II" calls `POST /returns` and `POST /imm` per
company, then composes the letter with each IMM, IRR, MOIC, and IRIS+ metric value
traced to tool output, the SDG contribution mapping from the engine's crosswalk, and
provisional-IRR flags carried through verbatim rather than smoothed away.

**How.** Tier-2 stack: read-only tool schemas from Evolution A's OpenAPI operations;
grounding corpus is this Atlas page plus the GIIN IRIS+ definitions embedded in
`llm_corpus_chunks`. Shadow-price sensitivity (§8.5's ±30% test) is exposed as a tool
so the copilot can answer "how robust is our 3.1× IMM?" with a computed range instead
of reassurance.

**Prerequisites (hard).** Evolution A complete — drafting LP letters from today's
random "IRR" fields would put fabricated performance figures into investor
communications, the exact failure the platform's no-fabrication contract exists to
prevent. **Acceptance:** every numeric in a drafted letter appears in a tool response;
provisional flags on unrealised-NAV-heavy IRRs are preserved in the text; asked for a
benchmark the engine lacks (e.g. Cambridge Associates quartile), the copilot refuses
and names the GIIN median comparison it can compute.
