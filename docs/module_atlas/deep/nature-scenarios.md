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
