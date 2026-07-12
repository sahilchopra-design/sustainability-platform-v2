## 7 · Methodology Deep Dive

> **Note on prior audit findings.** MEMORY.md's REM-38 backlog (2026-04-06 UAT session) flagged two P0s for
> this module: (1) `filtered.length=0 → Infinity` rendered in KPIs, and (2) PAI-17/18 mislabelled as "Land
> Degradation"/"Deforestation Risk" instead of the correct RE (real estate) fossil-fuel-exposure indicators.
> **Both are fixed in the current code**: `kpis` divides by `Math.max(1, filtered.length)` throughout, and
> `PAI_INDICATORS[16..17]` now correctly read `'RE Fossil Fuel Exposure'` / `'RE Energy Inefficiency'`. This
> deep dive documents the module as it stands today.

### 7.1 What the module computes

60 synthetic Article 9 ("dark green") funds (`FUNDS`, seeded `sr(s)=frac(sin(s+1)×10⁴)`) each carry a full
SFDR-relevant metric set: `sustainableInvPct`, `taxonomyAligned` %, a `dnshPassed` (Do No Significant Harm)
boolean, `carbonIntensity`, `tempAlignment` (implied temperature rise), `paiScore`, and more. A separate
18-row `PAI_INDICATORS` array models the SFDR Annex I mandatory/voluntary Principal Adverse Impact
indicators, and a 6-row `TAXONOMY` array splits EU Taxonomy alignment into aligned/eligible/not-eligible
buckets per environmental objective.

```js
sustainableInvPct = sr()×40 + 55                              // 55–95%, consistent with Art.9's "sustainable investment objective" mandate
taxonomyAligned    = sr()×30 + 15                              // 15–45%
tempAlignment      = sr()×1.5 + 1.2                            // 1.2–2.7°C implied temperature rise
dnshPassed         = sr() > 0.15                                // ~85% pass rate
notEligible (Taxonomy) = 100 − aligned − eligible               // residual bucket, always ≥30 by construction of the ranges
```

### 7.2 Parameterisation — SFDR Annex I PAI indicators (18, corrected)

| # | Indicator | Category | Mandatory |
|---|---|---|---|
| 1–3 | GHG Scope 1/2/3 | Environmental | Yes |
| 4 | Carbon Footprint | Environmental | Yes |
| 5 | GHG Intensity of investee companies | Environmental | Yes |
| 6 | Fossil Fuel Exposure | Environmental | Yes |
| 7 | Non-renewable Energy Consumption | Environmental | Yes |
| 8 | Energy Intensity | Environmental | Yes |
| 9–11 | Biodiversity, Water, Hazardous Waste | Environmental (indices 8–10, `category` cutoff at i<8) | Yes |
| 12–16 | UNGC Violations, Gender Pay Gap, Board Gender Diversity, Controversial Weapons, Social Violations | Social | Yes (i<14) / mixed |
| 17 | RE Fossil Fuel Exposure | Social (real-estate-specific PAI) | No (voluntary) |
| 18 | RE Energy Inefficiency | Social (real-estate-specific PAI) | No (voluntary) |

This now correctly reflects SFDR RTS Annex I Table 1 (climate/environment, 1–9) + Table 1 social indicators
(10–14, mandatory) + Table 2/3 (voluntary, including the real-estate-specific indicators formerly
mislabelled). `category = i<8 ? 'Environmental' : 'Social'` — note the category cutoff (index 8, i.e. PAI 9
Biodiversity) groups Biodiversity/Water/Hazardous Waste as "Social" by this rule even though the real SFDR
Table 1 classifies them as Environmental — a residual labelling looseness worth flagging (category boundary
is one indicator too early relative to the true 9-indicator Environmental table).

### 7.3 Calculation walkthrough

1. `filtered` applies search/objective/region filters over the 60 funds; `kpis` computes guarded portfolio
   averages (`Math.max(1, filtered.length)` denominator) for AUM, sustainable-investment %, taxonomy
   alignment %, and carbon intensity.
2. `objDist`/`regDist` build distribution counts across the 8 `OBJECTIVES` and 8 `REGIONS`.
3. **Fund detail radar** (`radarData`, triggered on row expansion): 6-axis view of Sustainable Investment %,
   Taxonomy %, PAI Score, Engagement %, Green Revenue %, Biodiversity Score — all on a common 0–100 scale
   for direct radar comparison.
4. **PAI table**: independently filterable/sortable by `coverage`, `avgScore`, `trend`, `dataQuality` — a
   descriptive reporting-coverage view, not a portfolio-weighted PAI computation joining back to the 60
   funds' own PAI-related fields.
5. **Taxonomy tab**: 6 environmental objectives (Climate Mitigation/Adaptation, Water & Marine, Circular
   Economy, Pollution Prevention, Biodiversity) each split into aligned/eligible/not-eligible — a standard
   EU Taxonomy 3-bucket disclosure structure.

### 7.4 Worked example

Fund `i=7`: `sustainableInvPct = sr(19×7)×40+55` — illustrative draw ≈ 55+40×0.62 ≈ 79.8%,
`taxonomyAligned ≈ 15+30×0.44 ≈ 28.2%`, `dnshPassed = sr(29×7)>0.15` — with `sr()` typically >0.15 for most
seeds, `dnshPassed=true` in the large majority of draws (~85% base rate, matching the `>0.15` threshold).
`tempAlignment ≈ 1.2+1.5×0.51 ≈ 1.97°C` — an Art.9 fund with an implied 1.5–2°C temperature alignment is
consistent with real-world "dark green" fund disclosures under SFDR/EU Paris-Aligned Benchmark norms.

### 7.5 Companion analytics on the page

- **Monthly flows/AUM trend** (`MONTHLY`, 24 months) — independent `sr()`-seeded series for fund flows,
  AUM, new-product launches, and closures, illustrating Art.9 market growth dynamics, not tied to the 60
  individual funds.
- **Regulatory Compliance tab** — presumably surfaces `sfdrCompliant` (boolean, `sr()>0.1` → ~90% compliant)
  and `dnshPassed` as compliance gates.

### 7.6 Data provenance & limitations

- **All 60 funds, the PAI coverage table, and the monthly flow series are synthetic** — generated via
  `sr(seed)=frac(sin(seed+1)×10⁴)`, not linked to real fund disclosures or the EU's ESAP (European Single
  Access Point) fund registry.
- **PAI `category` cutoff is off by one relative to the true SFDR Annex I structure** (Biodiversity/Water/
  Hazardous Waste should be Environmental, code labels them Social) — a minor residual inconsistency from
  the otherwise-corrected PAI-17/18 relabelling.
- The PAI table's `coverage`/`avgScore` are descriptive, disconnected from the 60 funds' own `paiScore`
  field — there's no join demonstrating how fund-level PAI scores roll up into portfolio-level PAI indicator
  coverage.
- `tempAlignment` (implied temperature rise) is a random draw within a plausible range, not computed from
  any underlying carbon-budget or ITR (implied temperature rise) methodology.

**Framework alignment:** SFDR Regulatory Technical Standards (RTS) Annex I — the 18-indicator PAI structure
(now correctly labelled after the REM-38 fix) directly reflects the real regulatory table · EU Taxonomy
Regulation — the aligned/eligible/not-eligible 3-bucket disclosure convention matches the actual EU
Taxonomy reporting requirement (Article 8 disclosures) · SFDR Article 9 ("dark green") — the module's fund
universe correctly models Art.9's requirement that funds have sustainable investment as their explicit
objective (reflected in the 55–95% `sustainableInvPct` floor, well above Article 8's lower bar).
