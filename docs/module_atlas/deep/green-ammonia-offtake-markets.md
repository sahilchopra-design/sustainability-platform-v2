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
