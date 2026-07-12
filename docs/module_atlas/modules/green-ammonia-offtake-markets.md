# Green Ammonia Offtake Markets
**Module ID:** `green-ammonia-offtake-markets` · **Route:** `/green-ammonia-offtake-markets` · **Tier:** B (frontend-computed) · **EP code:** EP-EE3 · **Sprint:** EE

## 1 · Overview
Green ammonia end-market and offtake intelligence. Covers global NH3 demand by sector (fertilizer 70%, chemicals 15-20%, maritime fuel <1% but growing), willingness-to-pay analysis, Japan and Korea co-firing programs, and long-term offtake contract structures.

> **Business value:** Used by green ammonia developers, commodity traders, DFIs, shipping companies, and power utilities to understand demand signals and offtake contract structures.

**How an analyst works this module:**
- Review market overview for global demand breakdown by segment
- Examine fertilizer offtake for CBAM-driven European premium
- Analyse maritime fuel tab for IMO 2050 pathway
- Review Japan/Korea co-firing programs in demand forecasts

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `END_USE_COLORS`, `KpiCard`, `MARKETS`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `MARKETS` | 26 | `endUse`, `volumeMt_2030_potential`, `currentPrice_usd_t`, `willingness_to_pay_usd_t`, `priceGap_usd_t`, `policySupport`, `marketReadiness`, `country` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `countries` | `useMemo(() => ['All', ...Array.from(new Set(MARKETS.map(m => m.country)))], []);` |
| `totalVolume` | `useMemo(() => filtered.reduce((a, b) => a + b.volumeMt_2030_potential, 0), [filtered]);` |
| `avgWTP` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.willingness_to_pay_usd_t, 0) / filtered.length : 0, [filtered]);` |
| `avgReadiness` | `useMemo(() => filtered.length ? filtered.reduce((a, b) => a + b.marketReadiness, 0) / filtered.length : 0, [filtered]);` |
| `japanDemand` | `useMemo(() => [2023, 2025, 2027, 2028, 2030, 2032, 2035].map((yr, i) => ({ yr, cofiring: Math.round(0.1 + i * 0.4 + sr(i * 9) * 0.2), dedicated: Math.round(Math.max(0, i * 0.15 - 0.3 + sr(i * 13) * 0.1)), shipping: Math.round(Math.max(0, i * 0.12 - 0.2 + sr(i * 7) * 0.1)), })), []);` |
| `priceGapData` | `useMemo(() => MARKETS.map((m, i) => ({ wtp: m.willingness_to_pay_usd_t, readiness: m.marketReadiness, volume: m.volumeMt_2030_potential, name: m.sector, endUse: m.endUse, })),` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `MARKETS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| Global NH3 Demand (Mt/yr) | `Fertilizer + chemicals + energy` | IFA 2024 | New energy demand (power/maritime/steel DRI) could add 30-80 Mt/yr by 2035. |
| Fertilizer WTP ($/tonne) | `Grey NH3 equivalent + green premium` | CRU / Argus Media | European buyers: $30-80/t premium under CBAM pressure; Asia-Pacific $15-30/t; US minimal 2024. |
| Japan NH3 Co-firing 2030 Target (Mt/yr) | `METI Green Innovation Fund` | METI Japan 2023 | JERA 20% co-firing at Hekinan (1 GW test 2023); Australia preferred supplier via MOUs. |
- **IFA demand statistics + METI procurement plans + WTP surveys + shipping MOUs** → Demand segmentation + WTP analysis + contract structure templates → **Offtake market intelligence for green ammonia pricing long-term supply contracts**

## 5 · Intermediate Transformation Logic
**Methodology:** Demand Segmentation & Willingness-to-Pay
**Headline formula:** `WTP_premium = avoided_grey_NH3_cost + carbon_price × emission_factor + strategic_value`

Global NH3 ~185 Mt/yr: fertilizer 70-75%, chemicals 15-20%, energy <0.5% 2024. Japan targets 3 Mt/yr co-firing 2030; Korea 2.2 Mt/yr. CBAM from 2026 incentivizes EU green NH3 fertilizer demand.

**Standards:** ['IEA Ammonia Technology Roadmap 2021', 'JERA/KEPCO NH3 Co-firing Procurement', 'IFA Global Fertilizer Market Outlook 2024']
**Reference documents:** IEA Ammonia Technology Roadmap 2021; METI Japan Green Innovation Fund NH3 Co-firing 2023; IFA Global Fertilizer Market Outlook 2024

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

## 7 · Methodology Deep Dive

### 7.1 What the module computes

26 hand-entered demand segments (`MARKETS`) span 5 end-uses (fertiliser, shipping fuel, power
generation, industrial feedstock, hydrogen carrier) across 11 countries/regions. Each row carries
`volumeMt_2030_potential`, `currentPrice_usd_t`, `willingness_to_pay_usd_t` (WTP), and a
`priceGap_usd_t` field that is **entered directly, not computed** from the other two — for most
rows `priceGap ≠ willingness_to_pay − currentPrice` exactly (e.g. Fertiliser-Urea: WTP 360, current
310, gap entered as 0, not 50), meaning the field is closer to "residual subsidy gap after existing
support" than a raw price differential, though this distinction is never made explicit on the page.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `volumeMt_2030_potential` | 0.3–8.5 Mt | Sums to ~63 Mt across 26 rows; broadly consistent with guide's "new energy demand could add 30–80 Mt/yr by 2035" |
| `willingness_to_pay_usd_t` | 330 (fertiliser) – 900 (H2 mobility) | Reflects real-world WTP hierarchy: fertiliser (commodity, price-sensitive) lowest, hydrogen-carrier/mobility applications (decarbonisation-premium, policy-backed) highest |
| `policySupport`, `marketReadiness` | 1–5 integer scores | Editorial judgement, no scoring rubric documented |
| Japan co-firing/dedicated/shipping demand curve | `sr()`-jittered linear ramps | **Synthetic** — see §7.3 |

### 7.3 Calculation walkthrough

1. **KPI aggregates**: `totalVolume = Σ volumeMt_2030_potential` (filtered), `avgWTP` and
   `avgReadiness` are simple arithmetic means, both correctly guarded (`filtered.length ? ... : 0`).
2. **End-use summary**: groups the full (unfiltered) `MARKETS` array by `endUse`, summing volume
   and averaging WTP per group — standard `reduce`-based aggregation.
3. **Japan demand projection** (`japanDemand`, the one dynamic/synthetic series on the page):
   ```js
   cofiring  = round(0.1 + i×0.4 + sr(i*9)×0.2)   // linear ramp + PRNG jitter
   dedicated = round(max(0, i×0.15 − 0.3 + sr(i*13)×0.1))
   shipping  = round(max(0, i×0.12 − 0.2 + sr(i*7)×0.1))
   ```
   `i` indexes the 7 milestone years (2023, 2025, 2027, 2028, 2030, 2032, 2035) — note the linear
   ramp is indexed by *array position*, not by actual elapsed years (the year gaps are uneven: 2,
   2, 1, 2, 2, 3), so the "ramp per step" is not a per-year growth rate despite looking like one on
   the chart's x-axis of calendar years.
4. **Price gap scatter** (`priceGapData`): plots `willingness_to_pay_usd_t` vs `marketReadiness`
   sized by `volumeMt_2030_potential` — a direct pass-through of the static fields, used to visually
   identify high-WTP/low-readiness segments (the "stranded demand" quadrant).

### 7.4 Worked example

"Marine Fuel - VLSFO Sub" (International): `currentPrice=650`, `WTP=750`, `priceGap=80` (entered),
`volume=6.0 Mt`, `policySupport=4`, `marketReadiness=3`.

Raw price differential = `750 − 650 = 100`, vs the entered `priceGap = 80` — a 20 $/t discrepancy,
illustrating that `priceGap_usd_t` is not a pure arithmetic derivative of the two price columns
(likely intended to net out an assumed existing subsidy/premium already captured elsewhere, but
this assumption is undocumented in the code).

Japan demand at `i=4` (year 2030): `cofiring = round(0.1 + 4×0.4 + sr(36)×0.2)`. Illustratively
`sr(36)=0.35` → `round(0.1+1.6+0.07) = round(1.77) = 2` Mt/yr — broadly consistent with the guide's
"Japan targets 3 Mt/yr co-firing 2030" headline, though the code's synthetic curve does not
explicitly anchor to that 3 Mt target; it is a coincidental match of the ramp parameters.

### 7.5 Companion analytics

- **Fertiliser Sector / Shipping Fuel Demand / Power Generation / Industrial & Export tabs** —
  filtered views of the same 26-row `MARKETS` table by `endUse`, each with its own bar/pie chart;
  no additional derived metrics beyond the shared aggregates in §7.3.

### 7.6 Data provenance & limitations

- Core 26-row market table is **static, hand-curated**, attributed to IEA Ammonia Technology
  Roadmap / JERA-KEPCO procurement data / IFA Global Fertilizer Market Outlook in the guide, but not
  traceable line-by-line to those sources.
- Japan demand curve is the only `sr()`-seeded series on the page — a stylised ramp with random
  jitter, not a probability-weighted forecast tied to METI's actual published GIF milestones.
- `priceGap_usd_t` is inconsistently defined relative to `willingness_to_pay − currentPrice`,
  creating ambiguity about what the field represents; a production version should either compute it
  live or rename/document it as a distinct "net subsidised gap" concept.

**Framework alignment:** IEA Ammonia Technology Roadmap 2021 (demand segmentation) · METI Japan
Green Innovation Fund (co-firing target framing, though the code's ramp is not derived from the
actual METI milestone schedule) · IFA Global Fertilizer Market Outlook (fertiliser WTP context).

## 9 · Future Evolution

### 9.1 Evolution A — Compute willingness-to-pay from live carbon/grey-NH₃ prices (analytics ladder: rung 1 → 2)

**What.** §7 confirms this is a curated demand-intelligence tool: 26 hand-entered demand segments across 5 end-uses (fertiliser, shipping fuel, power, industrial feedstock, hydrogen carrier) and 11 regions, attributed to the IEA Ammonia Technology Roadmap / JERA-KEPCO / IFA outlook. The headline `WTP_premium = avoided_grey_NH3_cost + carbon_price × emission_factor + strategic_value` is a real formula, but its inputs are static. Evolution A makes WTP dynamic: compute the avoided-grey-cost term from live grey-ammonia and natural-gas prices, the carbon term from a live carbon-price feed (EU ETS/CBAM), so each segment's willingness-to-pay premium responds to market conditions rather than being a fixed editorial figure — turning a reference table into a live pricing model.

**How.** (1) A backend route computing WTP per segment from live inputs: grey-NH₃ cost (gas-linked), carbon price × the segment's emission factor, plus a documented strategic-value term. (2) Wire carbon prices from the platform's carbon-market data and gas prices from EIA/market feeds. (3) The CBAM-2026 fertiliser scenario becomes a computed sensitivity (grey NH₃ €50–126/t carbon cost) rather than static text.

**Prerequisites.** Live grey-NH₃/gas and carbon-price feeds; emission factors per end-use segment. **Acceptance:** a segment's WTP premium recomputes from the §5 formula when carbon or gas price changes; the CBAM impact is a computed scenario; static WTP figures are replaced by derived ones.

### 9.2 Evolution B — Offtake-structuring copilot (LLM tier 1 → 2)

**What.** A copilot for offtake buyers and structurers: "what green premium will Japanese co-firing buyers pay in 2030, and how does CBAM change EU fertiliser demand?" narrates the demand segmentation, co-firing programmes, and contract structures from the atlas corpus, with tier-2 computing WTP under live carbon/gas scenarios via the Evolution A endpoint.

**How.** Tier 1 grounds on §5/§7 (IEA Ammonia Roadmap, JERA-KEPCO procurement, IFA outlook, CBAM from 2026 are cited) — the copilot cites real demand shares (fertiliser 70–75%, energy <0.5% in 2024) while flagging them as curated estimates. Tier 2 tool-calls the WTP endpoint so premium and CBAM-impact answers are computed. Cross-links to the production-economics sibling (LCOA vs WTP gap) come from the atlas graph.

**Prerequisites.** Corpus embedding; Evolution A for computed WTP. **Acceptance:** every demand share or WTP figure cited traces to the curated table or the endpoint; post-Evolution-A, carbon-price what-ifs return computed premiums, not narrated estimates.