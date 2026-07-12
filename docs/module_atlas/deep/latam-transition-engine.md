## 7 · Methodology Deep Dive

> **No MODULE_GUIDES entry exists for this route** (`guide: null` in the module record), so there is
> no guide↔code comparison to make. This deep dive documents the code as-is.

### 7.1 What the module computes

A **static reference dashboard** for 6 Latin American economies (Brazil, Mexico, Chile, Colombia,
Argentina, Peru) plus 5 country-specific deep-dive tabs (Brazil Energy Matrix, Amazon Deforestation
Finance Risk, Chile Lithium & Green H2, Colombia Coal Phase-Out, Mexico Energy Reform Risk). Unlike
almost every sibling module in this batch, **there is no `sr()`/seeded-PRNG call anywhere in the
file** — every number is a hand-entered literal. The only computation in the entire page is a
threshold filter: `LATAM_COUNTRIES.filter(c => c.reElectricity >= investmentMin)` driven by a 0–90
slider on the Regional Overview tab.

### 7.2 Parameterisation

| Dataset | Content | Provenance |
|---|---|---|
| `LATAM_COUNTRIES` (6 rows) | GDP ($T), emissions (GtCO2), RE electricity %, forest (M ha), NDC target text, REDD+ potential | Static, plausible real-world figures (Brazil 85% RE electricity, consistent with its hydro-heavy grid); no inline citation per row |
| `BRAZIL_ENERGY.mix` | 7-source electricity mix (Hydro 55%, Wind 14%, Solar 8%, Biomass 8%, Gas 10%, Nuclear 2%, Coal/Oil 3%) | Static; broadly consistent with real ONS/EPE Brazil grid mix |
| `BRAZIL_ENERGY.ethanol` | 2018–2024 production (billion litres), blend mandate %, price-vs-gasoline ratio | Static; blend mandate rising 27%→30% in 2024 matches Brazil's real RenovaBio/ANP policy change |
| `DEFORESTATION_DATA` | 2018–2024 Amazon deforestation (km²/yr) + soy/beef/palm exposure ($B) | Static; the area trend (peak 13,235 km² in 2021, falling to 4,300 km² in 2024) is directionally consistent with real INPE PRODES data showing a 2022–2024 deforestation decline under renewed enforcement |
| `REDD_PIPELINE` (5 projects) | Named Amazon REDD+ projects with area, credits, vintage, standard | Real project names (Jari/Para, Envira Amazonia) with plausible but unverified credit volumes |
| `CHILE_DATA.lithium` | 2020–2025 production (tonnes), reserves (9,200 fixed), price ($/kg), EV demand index | Static; the 2022 price spike to $78/kg and subsequent fall to $15–18/kg tracks the real 2022–2024 global lithium price collapse |
| `CHILE_DATA.hydrogen` | 2025–2040 capacity (GW), cost ($/kg), export volume, with a $2.00/kg "parity" reference line | Static projection, consistent with Chile's National Green Hydrogen Strategy cost-decline narrative |
| `COLOMBIA_COAL` | 2024–2040 production/exports/domestic use (Mt), employment, RE growth (GW) | Static phase-out projection; employment falling 130,000→12,000 by 2040 |
| `MEXICO_RISK` (6 factors) | CFE Dominance, RE Permit Delays, Grid Reliability, AMLO Energy Reform, Nearshoring Demand, US-Mexico Border RE — each with a 0–100 risk score, trend, impact | Static, qualitatively reasonable risk factor set for Mexico's 2021–2024 energy-sector centralisation policy |
| `REFERENCES` (6 citations) | BNDES, Chile Ministry of Energy, IDB, ECLAC, INPE, Colombia Presidency | Named sources, but URLs are placeholder `#` — not live-linked |

### 7.3 Calculation walkthrough

- **Regional Overview**: KPI cards read directly from the selected country's row; the "Country
  Investment Screener" table filters `LATAM_COUNTRIES` by `reElectricity >= investmentMin` (the only
  dynamic computation on the page) and colour-codes the RE % column (green if >50%, amber otherwise).
- **Brazil Energy Matrix**: renders the static electricity-mix pie and a composed bar+line chart of
  ethanol production vs price-parity ratio — no derived metric beyond direct field mapping.
- **Amazon Deforestation Finance Risk**: a toggle (`commodityExposure` state) swaps which of
  `soyExposure`/`beefExposure`/`palmExposure` drives the second chart's bar series — a display
  selector, not a calculation.
- **Chile Lithium & Green H2**: composed charts plot production/price/EV-demand and
  capacity/cost/export-volume trajectories with a hard-coded $2.00/kg hydrogen cost-parity reference
  line — the parity threshold itself is not derived from any comparator fossil-hydrogen cost figure
  in code.
- **Colombia Coal Phase-Out**: production/exports/RE-growth composed chart plus an employment
  area chart — both read directly from `COLOMBIA_COAL`, no elasticity or job-loss model applied.
- **Mexico Energy Reform Risk**: renders `MEXICO_RISK` as a risk-factor table with inline progress
  bars (red >60, amber >40, else green) and a static RE-vs-CFE dispatch-share stacked area projection
  to 2030 — the 2020–2030 trajectory (RE 22%→45%) is a straight-line hand-authored projection, not a
  fitted or scenario-driven curve.

### 7.4 Worked example

With the investment screener slider at its default `investmentMin=1`, all 6 countries pass the
`reElectricity >= 1` filter. Moving the slider to `investmentMin=60` retains only Brazil (85%) —
Colombia (75%) is excluded only if the threshold exceeds 75; at exactly 60 both Brazil and Colombia
remain, while Mexico (28%), Chile (52%), Argentina (18%), and Peru (60, boundary case, included since
`>=`) are evaluated against the same simple inequality.

### 7.5 Data provenance & limitations

- **No randomisation anywhere in this module** — a meaningful contrast with most sibling modules;
  every figure is a fixed literal, which makes the page fully reproducible but also means none of the
  data refreshes or reflects live conditions (e.g. the 2024 Amazon deforestation figure will not
  update as new INPE PRODES releases land).
- No figure in the file carries an inline per-datapoint citation; the `REFERENCES` list at the bottom
  of the Mexico tab is the only citation surface, and its URLs are non-functional placeholders (`#`).
- The Chile lithium reserve figure (9.2 Mt) is held constant across all years 2020–2025, which is
  reasonable for proven reserves over a short window but is not updated to reflect any real annual
  USGS/Cochilco reserve revision.
- Mexico's RE-vs-CFE dispatch-share 2024–2030 series is a straight-line assumption with no scenario
  branching (e.g. no explicit Sheinbaum-administration policy-change sensitivity).

**Framework alignment:** No formal climate/finance standard (NGFS, TCFD, PCAF, etc.) is invoked by
this module — it is a **country-intelligence reference dashboard**, not a risk or valuation model.
The REDD+ project standards column correctly names real registries (VCS, Gold Standard, ART TREES,
SOCIALCARBON), and Brazil's ethanol blend-mandate figures correctly track RenovaBio policy, but
neither is computed — both are simply displayed.
