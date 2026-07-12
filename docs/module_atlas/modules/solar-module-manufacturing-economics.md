# Solar Module Manufacturing Economics
**Module ID:** `solar-module-manufacturing-economics` · **Route:** `/solar-module-manufacturing-economics` · **Tier:** B (frontend-computed) · **EP code:** EP-ED3 · **Sprint:** ED

## 1 · Overview
Solar module manufacturing cost structure and competitive economics. Analyses BOM breakdown across 8 components, benchmarks manufacturer cost curves by country, tracks historical cost learning curve, and quantifies IRA §48C manufacturing credits.

> **Business value:** Used by solar module buyers, EPCs, manufacturers considering US/EU factory investments, and trade policy analysts evaluating IRA §48C/48E incentive competitiveness.

**How an analyst works this module:**
- Filter by country to benchmark Chinese vs US vs EU cost structures
- Review BOM analysis for component cost and silver exposure
- Use learning curve to project costs to 2030
- Examine IRA §48C calculator for US manufacturing investment NPV

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BOM_COMPONENTS`, `KpiCard`, `LEARNING_CURVE`, `MANUFACTURERS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MANUFACTURERS` | 16 | `company`, `hq`, `capacityGW`, `utilization`, `grossMargin`, `opexW`, `capexGW`, `automation`, `integration`, `costPerWp` |
| `BOM_COMPONENTS` | 9 | `costCents`, `pct`, `color` |
| `LEARNING_CURVE` | 12 | `costPerW`, `cumulativeGW` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `hqOptions` | `useMemo(() => ['All', ...Array.from(new Set(MANUFACTURERS.map(m => m.hq)))], []);` |
| `avgMargin` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.grossMargin, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |
| `avgCost` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.costPerWp, 0) / filtered.length).toFixed(2) : '0.00', [filtered]);` |
| `totalCap` | `useMemo(() => filtered.reduce((a, m) => a + m.capacityGW, 0), [filtered]);` |
| `avgUtil` | `useMemo(() => filtered.length ? (filtered.reduce((a, m) => a + m.utilization, 0) / filtered.length).toFixed(1) : '0.0', [filtered]);` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `BOM_COMPONENTS`, `LEARNING_CURVE`, `MANUFACTURERS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Module Cost ($/W) | `Varies by country, technology, scale, integration` | BNEF Q3 2024 Module Price Index | China integrated: $0.10-0.16/W; IRA §48E production credit $0.04/W reduces US effective cost. |
| BOM Cell Share (%) | `Cell cost / total module BOM` | BNEF Module Cost Model | TOPCon/HJT cells command 15-30% premium over PERC; silver 8-20 mg/cell is key variable. |
| Wright's Law Learning Rate (%) | `Each capacity doubling → 24% cost reduction` | Nemet (2006), Lafond et al. (2018) | Expected deceleration to 18-20% post-2023 as approaching materials cost floor. |
- **BNEF price index + manufacturer capacity + BOM component prices + IRA guidance** → Manufacturing cost model + Wright's Law projection + IRA incentive calculator → **Module cost benchmarking for procurement, manufacturing investment, and trade policy**

## 5 · Intermediate Transformation Logic
**Methodology:** Manufacturing Cost Decomposition & Wright's Law
**Headline formula:** `Cost_module = Σ(BOM_i × price_i) + (labor + overhead + depreciation) / output; LR = 24%`

BOM for 400W module: cells ~55%, glass ~10%, frame ~8%, backsheet ~5%, EVA ~5%, junction box ~3%, ribbon ~2%, other ~12%. Chinese integrated producer $0.10-0.16/W; US/EU $0.25-0.40/W. IRA §48C: 30% ITC on US factory investment.

**Standards:** ['BNEF Solar Module Price Index', 'IRA §48C Advanced Energy Manufacturing Tax Credit']
**Reference documents:** BNEF Solar Module Price Index Q3 2024; Wood Mackenzie PV Manufacturing Intelligence Service 2024; IRS IRA §48C Credit Guidance

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

`MANUFACTURERS` (15 rows) is a **hand-curated, real-company dataset** — LONGi Green, Jinko Solar, JA Solar,
Trina Solar, Canadian Solar, First Solar, Hanwha Q CELLS, SunPower/Maxeon, REC Group, Meyer Burger, Vikram
Solar, etc. — with plausible capacity (GW), utilisation %, gross margin %, opex ($/W), capex ($/GW),
automation tier (1–5), vertical-integration category (poly-to-module / cell-to-module / module_only), and
cost/Wp. `BOM_COMPONENTS` (8 line items) breaks a representative 400W module's bill of materials by cost
share (cells 52.0%, glass 15.8%, frame 8.5%, etc.). `LEARNING_CURVE` (11 vintage years, 2010–2025) traces
module cost ($4.00/W → $0.12/W) against cumulative global installed capacity (40 GW → 2,350 GW). No `sr()`
PRNG is used for any of this content.

### 7.2 Parameterisation

| Component | Values | Provenance |
|---|---|---|
| Manufacturer ordering | LONGi (85GW, 16.2% margin, $0.17/Wp) and Jinko (80GW, 14.8%) lead capacity; First Solar shows the highest margin (28.4%) despite far smaller capacity (18GW) | consistent with First Solar's real CdTe thin-film cost/technology moat and its US-market IRA 45X credit advantage (not modelled explicitly, but the margin gap is directionally realistic) |
| `BOM_COMPONENTS` | Cells 52.0% of cost — the single largest line item | matches the guide's cited real BOM structure (~55% cell share) and published module cost-breakdown studies |
| `LEARNING_CURVE` | $4.00/W (2010, 40GW cumulative) → $0.12/W (2025, 2,350GW cumulative) — a 33× cost decline over a ~59× capacity increase | directionally consistent with the real solar module learning-curve narrative (Wright's Law, ITRPV/BNEF price indices), though the exact 2010 starting price is higher than some published series (module ASPs were closer to $1.50–2.00/W by 2010 in several BNEF vintages) — treat as illustrative, not a specific cited series |
| Displayed "Learning Rate" KPI | static **24%** label | **not derived from the `LEARNING_CURVE` data via regression** — see note below |
| `marginWaterfall` | Module ASP $0.28/W − (cells $0.092 + glass $0.028 + backsheet $0.012 + frame $0.015 + other BOM $0.030 + labour $0.020 + overhead $0.018) = Gross Profit $0.065/W | arithmetic checks: 0.28 − 0.092 − 0.028 − 0.012 − 0.015 − 0.030 − 0.020 − 0.018 = **0.065** ✓ (23.2% gross margin, consistent with the "avg gross margin" KPI range shown for filtered manufacturers) |

### 7.3 Calculation walkthrough

- **Manufacturer Benchmarks / BOM Cost Breakdown / Capex & Scale / Automation Analysis tabs**: direct
  filtered rendering of the `MANUFACTURERS` and `BOM_COMPONENTS` tables — no derived calculation beyond
  simple filtered means (`avgMargin`, `avgCost`, `totalCap`, `avgUtil`).
- **Margin Waterfall tab**: renders the hand-built `marginWaterfall` sequence (module ASP minus each BOM/
  opex line item down to gross profit) — a static illustrative example, not computed per-manufacturer from
  the `MANUFACTURERS` table's own `costPerWp`/`grossMargin` fields (i.e. the waterfall doesn't reconcile
  numerically to, say, LONGi's specific $0.17/Wp cost or 16.2% margin).
- **Learning Curve tab**: plots `LEARNING_CURVE` cost vs cumulative capacity on a log-log-style chart; the
  "24% learning rate" KPI is **displayed as a fixed label**, not computed from the plotted data points via
  the standard Wright's-Law log-log regression (`b = log2(1−LR)`, `LR = 1 − 2^b` fit by OLS on
  `log(cost)` vs `log(cumulativeGW)`) that the guide's own formula specifies.

### 7.4 Worked example (checking the stated 24% learning rate against the plotted data)

Using the two endpoints of `LEARNING_CURVE` (2010: $4.00/W at 40GW; 2025: $0.12/W at 2,350GW):

| Step | Computation | Result |
|---|---|---|
| Doublings of cumulative capacity | log₂(2350/40) | ≈ 5.87 doublings |
| Total cost reduction | log₂(4.00/0.12) | ≈ 5.06 halvings-equivalent |
| Implied learning rate | `LR = 1 − 2^(−5.06/5.87)` | 1 − 2^(−0.862) ≈ 1 − 0.550 ≈ **45%** |

The **regression-implied learning rate from the module's own plotted endpoints (~45%) is materially higher
than the displayed 24% KPI** — a real discrepancy between the static label and the underlying curve shape
the chart itself shows (real-world solar PV learning rates are typically cited around 20–28% per Nemet 2006
and Lafond et al. 2018, so the plotted 45% endpoint-to-endpoint figure is itself likely inflated by other
factors — polysilicon price crashes, Chinese overcapacity — not purely captured by a clean Wright's-Law fit
over just two endpoints; a proper OLS regression across all 11 data points would likely land closer to the
guide's cited ~24%, but the code does not perform this regression to confirm).

### 7.5 Data provenance & limitations

- **Manufacturer figures are hand-curated, single-point-in-time, plausible estimates** for real companies —
  not live-sourced from company financial disclosures, and the specific gross-margin/opex figures should not
  be cited as verified financial data.
- The **"24% learning rate" KPI is a static label, not a computed regression output** — despite the guide
  specifying a log-log OLS fit methodology, no such fit runs in the code; a user cannot verify the 24%
  figure against the plotted `LEARNING_CURVE` series (and, as shown above, a naive endpoint calculation
  gives a different answer).
- The `marginWaterfall` is a single generic illustrative example disconnected from the per-manufacturer
  `MANUFACTURERS` data — it cannot be used to decompose any specific company's actual margin structure.

### 7.6 Framework alignment

- **BNEF Solar Module Price Index / Wood Mackenzie PV Manufacturing Intelligence** — cited as the guide's
  data sources; the module's cost-decline narrative direction is consistent with these published indices even
  though the specific curve is illustrative rather than a live data pull.
- **Wright's Law (Nemet 2006, Lafond et al. 2018)** — correctly named as the underlying learning-curve
  theory; the specific 24% learning-rate calibration is asserted rather than fit from the displayed data (see
  §7.4).
- **IRA §48C Advanced Energy Manufacturing Tax Credit** — referenced in the guide as a US-manufacturing cost
  offset; not modelled in any calculation in this file (contrast with `solar-manufacturer-carbon-finance`,
  which does implement India's analogous PLI incentive calculator).

## 9 · Future Evolution

### 9.1 Evolution A — Fit the learning rate from data, reconcile the waterfall, and build the §48C calculator (analytics ladder: rung 1 → 2)

**What.** Strong tier-B foundation: `MANUFACTURERS` (15 real companies), `BOM_COMPONENTS`, and `LEARNING_CURVE` (2010–2025, $4.00→$0.12/W) are all hand-curated real data with no `sr()`, and the `marginWaterfall` arithmetic checks out. But §7 documents three gaps: the "24% learning rate" KPI is a **static label, not regressed** from the plotted `LEARNING_CURVE` points; the `marginWaterfall` is a static illustrative example that doesn't reconcile to any specific manufacturer's `costPerWp`/`grossMargin`; and the IRA §48C calculator the guide advertises is **not implemented in any calculation** (contrast the sibling manufacturer module, which does implement India's PLI). Evolution A closes all three.

**How.** (1) Regress the learning rate: fit `log(cost) ~ log(cumulative_capacity)` over `LEARNING_CURVE`, display the computed LR (with fit R²) instead of the asserted 24% — and note where it diverges from the Wright's-Law literature. (2) Make `marginWaterfall` per-manufacturer: build it from the selected row's actual `costPerWp` and BOM shares so it reconciles to that company's stated margin. (3) Implement the §48C 30%-ITC calculator: US factory CAPEX → credit → NPV of a US vs China cost structure, the module's first genuine investment-decision output. (4) Cite the specific BNEF/Wood Mackenzie edition for the cost series.

**Prerequisites.** §48C credit rules (30% ITC, eligibility); the regression is trivial with the existing data. **Acceptance:** the displayed learning rate is computed from `LEARNING_CURVE` with a reported R²; the waterfall for LONGi reconciles to its $0.17/Wp; the §48C calculator returns an NPV that responds to CAPEX and credit inputs.

### 9.2 Evolution B — Manufacturing-cost and policy-competitiveness copilot (LLM tier 1)

**What.** A copilot for the buyer/manufacturer/trade-analyst users: "why is First Solar's margin 28% at a fraction of LONGi's capacity?", "what does §48C do to US factory economics vs Chinese imports?", "project module cost to 2030 at the fitted learning rate" — answered from the real `MANUFACTURERS`/`BOM_COMPONENTS`/`LEARNING_CURVE` data and, post-Evolution-A, the §48C calculator and regressed LR.

**How.** Tier-1 RAG pattern: `POST /api/v1/copilot/solar-module-manufacturing-economics/ask`, corpus = this Atlas record (§7.2 parameter table, the margin waterfall, framework notes) plus live page state. Benchmark comparisons narrate deterministic filtered means over the manufacturer table; cost-projection answers use the fitted Wright's-Law curve; §48C competitiveness answers run the calculator. The copilot flags the honest caveat that the 2010 curve start ($4.00/W) is higher than some published BNEF vintages.

**Prerequisites.** Evolution A's fitted LR and §48C calculator — otherwise projection and policy answers rest on an asserted rate and an unimplemented credit. **Acceptance:** every cost/margin figure matches the manufacturer table; cost projections use the computed learning rate; a §48C question returns the calculator's NPV, not a generic estimate.