## 9 · Future Evolution

### 9.1 Evolution A — Real ΔEBITDA scenario engine to close the guide↔code gap (analytics ladder: rung 1 → 2)

**What.** The module today is a scenario-parameter browser, not a modeller: 6 hardcoded
NGFS/IEA-style presets, a random sector-impact overlay (`(sr(seed)−0.5)×|gdp|×3`), and
3 static timelines disconnected from the presets. §7 flags the guide↔code mismatch
explicitly — the advertised `ΔEBITDA = ΔRevenue + ΔCost − ΔCapex` formula exists nowhere
in code. Evolution A builds that formula as this module's first backend vertical:
a `transition_scenario_engine` that takes a company P&L sketch (revenue, EBITDA margin,
scope 1/2 tCO2e, energy spend, sector) and computes ΔEBITDA per scenario from carbon
cost (`emissions × carbonPrice × pass-through`), energy-cost deltas, and sector demand
elasticities.

**How.** (1) New router `api/v1/routes/transition_scenario.py` with `POST /model` and
`GET /scenarios`; scenario pathways sourced from the real NGFS Phase IV tabular data
the platform already holds (the `transition-risk-dcf` module's genuine NGFS lookup is
the pattern to reuse — §7.3 cites it by name). (2) Replace the random `SECTOR_IMPACTS`
with sector carbon-intensity coefficients from the refdata emission-factor layer.
(3) Derive the 3 pathway timelines by interpolation from the same scenario objects,
eliminating the coincidental-consistency problem §7.6 documents.

**Prerequisites.** Acknowledge and remove the seeded-random sector overlay (a documented
fabrication instance); NGFS pathway table exposed as shared refdata. **Acceptance:**
the page's EBITDA-impact figures come from the engine response; two sectors with
different carbon intensities produce different impacts for the same scenario; the §7
mismatch flag can be deleted.

### 9.2 Evolution B — Board-pack scenario copilot (LLM tier 1)

**What.** A copilot on the modeller page that answers the exact questions boards ask —
"why is Delayed Transition worse for us than Net Zero 2050?", "what does a $350/t
carbon price assume about coal phase-out?" — grounded strictly in the module's Atlas
record and, once Evolution A lands, the engine's decomposed response (carbon-cost term,
energy term, demand term). It drafts the TCFD Strategy-section narrative paragraph from
the currently selected preset's parameters, since TCFD/ESRS E1 disclosure text is this
module's stated business output.

**How.** Standard tier-1 stack per the productization roadmap: embed this module's
`atlas.json` entry + `modules/transition-scenario-modeller.md` into `llm_corpus_chunks`;
`POST /api/v1/copilot/transition-scenario-modeller/ask` with a per-module system prompt
assembled from §5/§7. Critically, the prompt must encode the current honest state: until
Evolution A ships, the copilot must describe sector impacts as illustrative and refuse
to attribute them to a financial model — the refusal path is REQUIRED behavior here
because §7.6 documents that no EBITDA model exists.

**Prerequisites.** pgvector corpus tables (roadmap D3); the §7 deep-dive is already
written and is the grounding corpus. **Acceptance:** asked "what's our modelled EBITDA
impact?", the pre-Evolution-A copilot answers that the module does not compute one;
post-Evolution-A it cites the engine payload, with every numeric traceable to it.
