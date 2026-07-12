# Latam Transition Engine
**Module ID:** `latam-transition-engine` · **Route:** `/latam-transition-engine` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `BRAZIL_ENERGY`, `CHILE_DATA`, `COLOMBIA_COAL`, `DEFORESTATION_DATA`, `LATAM_COUNTRIES`, `MEXICO_RISK`, `REDD_PIPELINE`, `REFERENCES`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LATAM_COUNTRIES` | 7 | `gdp`, `emissions`, `reElectricity`, `forest`, `ndcTarget`, `reddPotential` |
| `DEFORESTATION_DATA` | 8 | `area`, `soyExposure`, `beefExposure`, `palmExposure` |
| `REDD_PIPELINE` | 6 | `state`, `area`, `credits`, `vintage`, `standard` |
| `COLOMBIA_COAL` | 7 | `production`, `exports`, `domestic`, `employment`, `reGrowth` |
| `MEXICO_RISK` | 7 | `risk`, `trend`, `impact` |
| `REFERENCES` | 7 | `title`, `url` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `TABS` | `['Regional Overview', 'Brazil Energy Matrix', 'Amazon Deforestation Finance Risk', 'Chile Lithium & Green H2', 'Colombia Coal Phase-Out', 'Mexico Energy Reform Risk'];` |
| `badge` | `(c) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c + '18', color: c });` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLOMBIA_COAL`, `DEFORESTATION_DATA`, `LATAM_COUNTRIES`, `MEXICO_RISK`, `REDD_PIPELINE`, `REFERENCES`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — From static almanac to a sourced, refreshable country-intelligence layer (analytics ladder: rung 1 → 2)

**What.** §7 is unambiguous about character: this is a PRNG-free, hand-authored reference dashboard whose data is directionally accurate (Brazil's hydro-heavy mix, the 2022 lithium price collapse, INPE-consistent deforestation decline) but frozen — no figure refreshes, the `REFERENCES` URLs are `#` placeholders, the only computation on the whole page is one threshold filter, and there is no MODULE_GUIDES entry. Evolution A upgrades the data discipline first and adds the first computed layer second: (1) every datapoint gains an inline citation and vintage (the §7.2 provenance table already identifies the right sources — ONS/EPE, INPE PRODES, Cochilco/USGS, ANP); (2) the refreshable series (Amazon deforestation, lithium price, ethanol production) move to refdata tables fed by lightweight annual-update ingesters; (3) a computed transition-readiness screen replaces the single RE-percentage filter — a documented composite over RE share, NDC ambition, deforestation trend and policy-risk factors, per-country, with weights disclosed.

**How.** (1) Fix the placeholder URLs and write the missing MODULE_GUIDES entry as part of the work. (2) INPE PRODES publishes annual figures via a public portal — one ingester covers the module's most decision-relevant series. (3) The Mexico risk factors table stays expert-judgement but gains dates and review status (§7.5 notes the missing Sheinbaum-era sensitivity — a concrete staleness example). (4) The Chile hydrogen $2.00/kg parity line derives from the platform's hydrogen engine (grey-H₂ comparator) instead of being hard-coded.

**Prerequisites.** Citation pass over ~60 datapoints; ingestion slots for 2–3 annual series. **Acceptance:** every chart shows its source and vintage; the 2025 PRODES release flows into the deforestation chart without a code change; the readiness screen decomposes into cited factors.

### 9.2 Evolution B — LatAm desk briefing copilot (LLM tier 1)

**What.** A curated country-intelligence page is the archetypal tier-1 corpus: "brief me on Colombia's coal phase-out — production path, employment cliff, RE replacement", "what's the Amazon deforestation finance-risk story for a soy-exposed lender?", "how does Chile's green-H₂ cost trajectory compare to its lithium story as an investment theme?" The five country deep-dive tabs are already structured briefings; the copilot makes them conversational and composable across tabs.

**How.** Tier 1 RAG: the atlas record and the curated datasets into `llm_corpus_chunks`, with the §7.2 provenance annotations embedded so every figure the copilot quotes carries its source-and-vintage tag — for a static almanac, staleness disclosure is the honesty mechanism ("2024 PRODES figure; 2025 release pending"). Cross-tab synthesis (deforestation risk × REDD pipeline × country NDC) is encouraged; extrapolation beyond the curated horizon is refused ("the module holds Colombia coal projections to 2040; beyond that is not covered"). Quantitative what-ifs route to the specialist modules (hydrogen engine for H₂ costs, land-use modules for deforestation finance) with the boundary stated — this module is context, not computation.

**Prerequisites.** Copilot infrastructure (Phase 1); Evolution A's citations make answers reference-grade but tier 1 can ship on the current curated text with staleness caveats. **Acceptance:** every figure quoted carries source and vintage; cross-module referrals fire for computational questions; no invented post-2024 developments.