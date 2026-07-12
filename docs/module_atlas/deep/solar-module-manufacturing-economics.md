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
