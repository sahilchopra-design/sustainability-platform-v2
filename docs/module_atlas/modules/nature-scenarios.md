# Nature Scenarios
**Module ID:** `nature-scenarios` · **Route:** `/nature-scenarios` · **Tier:** B (frontend-computed) · **EP code:** None · **Sprint:** None

## 1 · Overview
Scenario analysis platform for assessing portfolio impacts under nature-positive transition pathways drawn from IPBES transformative change scenarios, SBTN nature-positive trajectories, and TNFD illustrative nature scenarios. Models how biodiversity regulation, ecosystem restoration mandates, deforestation bans, and natural capital pricing affect corporate revenues, costs, and asset values across sectors and geographies. Supports TNFD Prepare pillar forward-looking disclosure.

> **Business value:** Enables investors and corporate strategists to quantify the financial implications of nature-positive transition scenarios, identify exposure concentrations, and prepare credible forward-looking TNFD nature scenario disclosures aligned with IPBES and SBTN pathways.

**How an analyst works this module:**
- Select the nature scenario set: TNFD Illustrative Scenarios, IPBES sustainability pathways, or custom policy combinations
- Map portfolio companies to sectors with nature-related policy exposure using ENCORE and EUDR/CBAM regulatory pipeline
- Run NSIS computation across all scenario-policy combinations and review sector-level impact rankings
- Identify companies with highest net nature transition risk and those positioned to benefit from nature-positive market growth
- Prepare TNFD Prepare pillar disclosure with scenario narratives, assumptions, and financial impact ranges

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BIOMES`, `GBF_TARGETS`, `KpiCard`, `NATURE_CREDITS`, `PATHWAY_TIME`, `SCENARIOS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `SCENARIOS` | 9 | `name`, `family`, `tempTarget`, `biodiversityLoss2030`, `biodiversityLoss2050`, `waterAvail`, `soilHealth`, `carbonSeq`, `gdpImpact`, `description`, `color` |
| `BIOMES` | 11 | `name`, `area`, `intactPct`, `degradedPct`, `restoredPct`, `lossRateHaYr`, `carbonStockGt`, `biodiversityScore`, `gbfCoverage`, `threatLevel` |
| `GBF_TARGETS` | 11 | `name`, `progress`, `target`, `deadline`, `type` |
| `NATURE_CREDITS` | 7 | `name`, `standard`, `unit`, `price`, `supply2024`, `demand2024`, `qualityScore`, `additionality`, `permanence`, `region` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `gbfPct` | `(p, tgt) => Math.min(100, (p / tgt) * 100).toFixed(0);` |
| `pct` | `(tgt.progress / tgt.target) * 100;` |
| `supplyGap` | `nc.demand2024 - nc.supply2024;` |
| `physicalRisk` | `Math.min(100, Math.max(0, sc.biodiversityLoss2050 * 1.8 + 15));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BIOMES`, `GBF_TARGETS`, `NATURE_CREDITS`, `SCENARIOS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Nature Scenario Revenue Impact (%) | — | NSIS computation per scenario | Estimated revenue impact range under the nature-positive transition scenario on a 5–10 year horizon |
| Regulatory Cost Uplift (% EBITDA) | — | Policy shock model | Estimated EBITDA impact from nature-related regulatory costs (deforestation bans, ecosystem levies) in the scenario |
| Nature Opportunity Score | — | TNFD illustrative scenario positive outcomes | Composite score capturing revenue and competitive advantage opportunities from nature-positive market shifts |
| Scenario Time Horizon | — | IPBES / SBTN target years | Target year for nature policy implementation used in scenario modelling |
- **TNFD illustrative scenario assumptions** → Extract policy shock magnitudes and timelines by sector and geography; calibrate to EC NRL and SBTN targets → **Policy shock parameter matrix by scenario, sector, and year**
- **ENCORE dependency and impact data** → Map sector nature dependencies to policy shock exposure; weight by revenue share → **Sector sensitivity matrix for NSIS computation**
- **Portfolio company financial data** → Apply revenue exposure fractions and policy shock magnitudes; compute net EBITDA and revenue impact range → **Company and portfolio-level nature scenario financial impact output**

## 5 · Intermediate Transformation Logic
**Methodology:** Nature Scenario Impact Score
**Headline formula:** `NSISᵢₛ = Σⱼ (Policy Shockⱼₛ × Sector Sensitivityᵢⱼ × Revenue Exposureᵢⱼ)`

Scenario impact is computed as the sum across nature policy shocks (deforestation bans, ecosystem restoration levies, pollinator protection mandates, natural capital pricing) of the product of policy shock magnitude (% cost uplift or revenue constraint), sector sensitivity (dependency-adjusted exposure), and revenue exposure fraction. Positive scores indicate net revenue risk; negative indicate nature-positive opportunity capture.

**Standards:** ['TNFD Illustrative Nature Scenarios v1.0 2023', 'IPBES Global Scenarios for Biodiversity 2019', 'SBTN Science-Based Targets for Nature 2023', 'ENCORE Ecosystem Service Dependency Tool', 'EC Biodiversity Strategy 2030 Impact Assessment']
**Reference documents:** TNFD Nature-related Risk and Opportunity Assessment â€” Illustrative Scenarios Annex 2023; IPBES Global Assessment Scenarios and Models Chapter 2019; SBTN Science-Based Targets for Nature â€” Step 2 Ambition Guidance 2023; EC Biodiversity Strategy 2030 and Nature Restoration Law 2023; UNEP-WCMC ENCORE Methodology Documentation 2021

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The MODULE_GUIDES entry defines a **Nature Scenario Impact
> Score**, `NSISᵢₛ = Σⱼ (PolicyShockⱼₛ × SectorSensitivityᵢⱼ × RevenueExposureᵢⱼ)`, intended to map
> nature policy shocks to company-level revenue/EBITDA impact. **This formula does not exist in
> code** — there is no company entity, no sector-sensitivity matrix, and no revenue-exposure field
> anywhere in `NatureScenariosPage.jsx`. What the page actually implements is a set of eight
> **static, hand-authored global scenario narratives** (Nature Positive → Ecosystem Collapse) with
> fixed macro indicators, plus one derived "Portfolio Stress" formula
> (`physicalRisk = biodiversityLoss2050×1.8+15`) that is the closest thing to a scoring model on
> the page. The sections below describe what is actually there.

### 7.1 What the module computes

Four static reference tables anchor the seven tabs:

- **`SCENARIOS`** (8 rows) — global nature-transition narratives (Nature Positive, Sustainable Use,
  Net Zero + Nature, Current Trajectory, Restoration Focus, Continued Degradation, Managed Decline,
  Ecosystem Collapse), each with a hand-set `tempTarget`, `biodiversityLoss2030/2050`, `waterAvail`,
  `soilHealth`, `carbonSeq`, `gdpImpact` — a qualitative narrative translated into illustrative
  numbers, not derived from an integrated assessment model run.
- **`BIOMES`** (11 rows) — area, intact/degraded/restored %, annual loss rate (ha/yr), carbon
  stock (Gt), biodiversity score, GBF coverage %, threat level — static figures styled after real
  FAO/IPBES/Global Forest Watch order-of-magnitude ranges (e.g. tropical forest loss ≈11M ha/yr is
  in the right ballpark for recent Global Forest Watch tree-cover-loss reporting) but not sourced
  to a specific dataset release.
- **`GBF_TARGETS`** (10 rows) — CBD Kunming-Montreal Global Biodiversity Framework targets (30×30,
  spatial planning, restoration, species protection, finance mobilisation, DSI benefit-sharing)
  with `progress`/`target`/`deadline` fields; the 17.6% 30×30 figure and $200B+/yr finance target
  are consistent with widely reported 2024 CBD COP16 progress figures.
- **`NATURE_CREDITS`** (6 rows) — biodiversity/nature credit instruments (Verra CCB, Gold
  Standard Nature, EU Biodiversity Net Gain habitat banking, blue-carbon mangrove, soil, freshwater)
  with `price`, `supply2024`, `demand2024`, `qualityScore`, `permanence`.

### 7.2 Parameterisation

| Metric | Formula | Notes |
|---|---|---|
| GBF target progress % | `gbfPct(p,tgt) = min(100, p/tgt×100)` | Simple ratio, capped at 100% |
| Nature credit supply gap | `supplyGap = demand2024 − supply2024` | All 6 instruments show demand > supply (structural undersupply) |
| **Portfolio Stress "physical risk"** | `physicalRisk = min(100, max(0, biodiversityLoss2050×1.8 + 15))` | Only place a *derived* score appears |
| `PATHWAY_TIME` series | `base + i×slope + sr(seed)×jitter` | 6 points (2025–2050), 5 scenario lines; deterministic ramp with small random noise, not a real ecosystem model output |

The `physicalRisk` formula is a **linear rescaling** of each scenario's own `biodiversityLoss2050`
input (which is itself a hand-set narrative number) — it does not add new information, just
maps roughly [-58%, +35%] biodiversity change onto a 0–100 risk scale with slope 1.8 and a +15
intercept (so even the most nature-positive scenario, −58% "loss" i.e. gain, floors at 0 rather
than going negative, and the worst scenario, +35% loss, caps near 78, not 100).

### 7.3 Calculation walkthrough

1. **Overview** — bar chart of `biodiversityLoss2050` sorted ascending across all 8 scenarios;
   stacked intact/restored/degraded bar per biome; `PATHWAY_TIME` line chart shows the ecosystem
   degradation trajectory for 5 of the 8 scenarios out to 2050.
2. **Scenario Dashboard** — user selects a scenario family filter (`scenFilter`); each scenario
   card shows its static macro indicators (`tempTarget`, `waterAvail`, `soilHealth`, `carbonSeq`,
   `gdpImpact`) verbatim.
3. **Biome Assessment** — sorts/filters the 11 biomes by threat level, loss rate, carbon stock.
4. **GBF Targets** — progress bars using `gbfPct`; no aggregation across targets into a single
   "GBF alignment score."
5. **Nature Credits** — supply/demand gap and price table across the 6 instrument types.
6. **Portfolio Stress** — the only tab computing a derived score: applies `physicalRisk` to the
   selected scenario's `biodiversityLoss2050`, presented as a stress-test output.
7. **TNFD Pathways** — re-renders the `PATHWAY_TIME` degradation lines with TNFD framing.

### 7.4 Worked example

Selecting the **Continued Degradation** scenario (`biodiversityLoss2050 = -18`, i.e. an 18% further
loss by 2050 relative to today under this labelling convention — note the *sign convention is
inverted* relative to "Nature Positive," which shows `+10`, since positive numbers denote
recovering/gaining ecosystems in this dataset for the 2050 field but denote *loss* for 2030):

`physicalRisk = min(100, max(0, -18×1.8+15)) = min(100, max(0, -32.4+15)) = min(100, max(0, -17.4)) = 0`

Continued Degradation floors at a **0/100 physical risk score** under this formula — the opposite
of what the scenario name implies — because the `-18` figure represents a *biodiversity gain* in
the 2050 field's sign convention (recall `biodiversityLoss2050: -18` sits alongside `gdpImpact: -0.4`
for this scenario, i.e. the field is coded so more-negative-in-2050 means *less* future loss for
some scenarios and *more* prior loss for others — this internal inconsistency in the SCENARIOS
table's sign convention between 2030 and 2050 fields is a genuine modelling ambiguity, not just a
display quirk). By contrast **Ecosystem Collapse** (`biodiversityLoss2050 = -58`) also floors at 0,
while **Current Trajectory**'s 2030 figure (`+12`, positive = loss in the 2030 convention) shows
how the two year-fields use opposite sign directions for "loss," which readers should treat with
caution when comparing 2030 vs. 2050 columns.

### 7.5 Data provenance & limitations

- All four reference tables are **hand-authored static constants** — no `sr()` PRNG, no API call —
  meaning they are stable and won't drift on reload, but also aren't live IPBES/GBF/CBD feeds
  despite citing those sources.
- The only genuinely computed quantity (`physicalRisk`) is a linear rescale of an already-synthetic
  input, and — as shown above — inherits a sign-convention inconsistency between the 2030 and 2050
  biodiversity-loss fields that materially changes interpretation.
- `PATHWAY_TIME` mixes a deterministic linear ramp with small `sr()` jitter — visually looks like a
  modelled trajectory but is not the output of any ecosystem or IAM (integrated assessment model).
- Nature-credit supply/demand figures (`supply2024`, `demand2024`) are static estimates, not sourced
  to a specific market report (contrast with `ocean-carbon-credit-market`, which at least cites
  CDR.fyi as a source pattern).

**Framework alignment:** CBD Kunming-Montreal Global Biodiversity Framework — the 10 `GBF_TARGETS`
correctly reference real target codes (T1, T2, T3/30×30, T4, T7, T10, T14, T15, T19, T20) and their
2030 deadlines · TNFD illustrative scenarios — named via tab labels and the "TNFD Pathways" tab,
but no TNFD scenario-narrative parameter set (temperature/policy-shock combinations) is actually
implemented · IPBES — the biome threat-level and species-at-risk headline figures (~1M species,
75% terrestrial surface degraded) match IPBES's widely cited 2019 Global Assessment topline
numbers.

## 9 · Future Evolution

### 9.1 Evolution A — Turn static narratives into a company-level NSIS engine (analytics ladder: rung 1 → 2)

**What.** §7's mismatch flag: the guide defines `NSISᵢₛ = Σⱼ (PolicyShockⱼₛ × SectorSensitivityᵢⱼ × RevenueExposureᵢⱼ)` to map nature policy shocks to company revenue/EBITDA impact, but the page has no company entity, no sector-sensitivity matrix, and no revenue field — it renders eight hand-authored global scenario narratives (`SCENARIOS`), 11 biomes, 10 GBF targets, and 6 nature-credit instruments, with a single derived "Portfolio Stress" formula (`physicalRisk = biodiversityLoss2050×1.8+15`). The static tables are reasonable (biome loss rates in the right FAO/GFW ballpark), but the promised scenario *scoring* is absent. Evolution A builds it.

**How.** (1) Add the policy-shock × sensitivity × exposure engine: encode each scenario's policy shocks (deforestation ban cost uplift, restoration levy, natural-capital price) as magnitudes, a sector-sensitivity matrix (ENCORE-derived, shared with the sibling nature modules), and per-company revenue exposure — producing signed NSIS (positive = risk, negative = nature-positive opportunity) per §5. (2) Keep the eight scenario narratives as the qualitative scaffold but tag each with its policy-shock vector so they drive computation, not just prose. (3) This is a rung-2 scenario module by design — the deliverable is a scenario × company impact grid with sector rankings, feeding the TNFD Prepare pillar output §1 describes.

**Prerequisites.** Shared sector-sensitivity matrix and company revenue-exposure data (the same missing inputs as `nature-loss-risk` — build once, reuse); scenario shock magnitudes need sourcing to IPBES/EC Nature Restoration Law impact assessments rather than free assignment. **Acceptance:** switching from "Nature Positive" to "Ecosystem Collapse" changes company NSIS rankings via the shock vectors; a nature-positive-exposed company shows negative (opportunity) NSIS under restoration scenarios.

### 9.2 Evolution B — Forward-looking TNFD scenario-narrative copilot (LLM tier 1 → 2)

**What.** A copilot for the TNFD Prepare pillar: "narrate our portfolio's exposure under the IPBES sustainability pathway", "which GBF targets most threaten our agri-food holdings", "compare revenue risk between the restoration-focus and continued-degradation scenarios" — grounded in the eight scenario tables, the GBF target progress data, and the TNFD/IPBES/SBTN references named in §5.

**How.** Tier 1 ships over the existing static content: system prompt from this Atlas page plus the serialized `SCENARIOS`/`BIOMES`/`GBF_TARGETS` constants, answering scenario-comparison and framework questions with citations to the narrative tables and reference documents. Tier 2, after Evolution A: the copilot calls the NSIS engine to ground portfolio-specific impact ranges, turning "prepare our disclosure" into engine-sourced scenario narratives with a per-figure provenance trail. Fabrication validator applies to any quantified impact; qualitative scenario storytelling must still cite which scenario row it draws from.

**Prerequisites.** Tier 1 needs only the standards corpus; any company-specific impact quantification requires Evolution A (the current single `physicalRisk` formula is a global proxy, not a portfolio result). **Acceptance:** scenario descriptions cite a `SCENARIOS` row and reference document; portfolio impact figures (post-Evolution-A) trace to NSIS tool calls; refusal on "what will nature policy cost us in dollars" before the engine exists.