## 9 · Future Evolution

### 9.1 Evolution A — Site-specific blue carbon and depth-resolved OA VaR (analytics ladder: rung 1 → 3)

**What.** A clean tier-A domain (E68): five ocean-finance calculators (ICMA Blue Bond screening,
blue carbon economics, BBNJ compliance, ocean-acidification VaR, SOF portfolio aggregation) on
strict honest-null discipline — every entity input is caller-supplied or returned `None` with a
`data_flags` entry, and the module comment declares all embedded numbers "deterministic model
parameters, NOT entity-reported." §7.5 names the deepening targets: blue-carbon sequestration uses
the ecosystem *mean* rate only (no site-specific measurement, soil-core data, or age-dependent
accumulation curves); the OA VaR uses linear damage factors keyed only to aragonite saturation and
a single fisheries impact %, with no depth/latitude/species resolution; and ICMA alignment is a
category-average that doesn't test project-level process conformance. Evolution A adds site-specific
blue-carbon inputs (measured seq rates, age curves) and a depth/latitude-resolved OA damage model.

**How.** `assess_blue_carbon` accepts optional measured sequestration and an accumulation curve
(overriding the ecosystem mean); `assess_ocean_acidification_risk` gains regional/depth resolution
in the aragonite-to-damage mapping and a species-mix input. Rung 3: calibrate sequestration rates
against Verra VM0007/VM0033 project data and OA damage factors against IPCC AR6 Ch.3 regional
projections (the reference table is already faithfully encoded).

**Prerequisites (hard).** Fix the lineage-harness failures — §4.2 shows `POST /bbnj-compliance`,
`/blue-carbon`, `/ocean-acidification` all **skipped** (they need input payloads to trace); the
kelp/seagrass permanence is scientifically contested and correctly flagged "Under development" —
keep that flag. **Acceptance:** the §7.4 mangrove worked example ($45,825/yr net revenue, Verra +
Gold Standard eligible) reproduces at the ecosystem mean; supplying a measured seq rate overrides
the mean; OA VaR responds to region/depth, not just aragonite saturation.

### 9.2 Evolution B — Ocean-finance analyst with tool-called screening (LLM tier 2)

**What.** A tool-calling analyst for blue-finance teams: "screen this blue bond against ICMA
Principles" (`/screen-bond`), "value this mangrove blue-carbon project" (`/blue-carbon`), "assess
BBNJ compliance" (`/bbnj-compliance`), "what's our ocean-acidification VaR under RCP8.5?" (`/ocean-
acidification`), and "aggregate our SOF portfolio score" (`/ocean-portfolio`) — narrating the
engine's real outputs and its honest nulls (greenium is only market-observed input, never derived;
OA VaR is null without exposure).

**How.** Tool schemas from the 6 POST + 5 GET operations; the five reference endpoints (ecosystems,
use-of-proceeds, BBNJ articles, SOF pillars, ocean markets) are ideal RAG grounding for "what's the
mangrove sequestration rate?" or "what does BBNJ Art. 17 require?" questions — a tier-1 explainer
over a tier-2 operator. The no-fabrication validator checks every tCO₂, dollar and score against
tool output; the copilot must respect the engine's honest-null design (e.g. it cannot state a
greenium unless the caller observed one).

**Prerequisites.** Evolution A's harness traces (working POST endpoints for tool-calling); Atlas +
reference corpus embedded (roadmap D3). **Acceptance:** every figure cited traces to an engine tool
call; the blue-carbon net revenue matches `/blue-carbon` exactly; a greenium question without an
observed input returns the engine's null with the copilot explaining greenium requires market
observation, not derivation from alignment.
