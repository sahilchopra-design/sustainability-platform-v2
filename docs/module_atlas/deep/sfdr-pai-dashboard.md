## 7 · Methodology Deep Dive

### 7.1 What the module computes

8 named synthetic funds (`FUNDS`, e.g. "Apex Sustainable UCITS," "Nordic Climate Fund") each carry the
**full, correctly-labelled 18-indicator SFDR PAI set** (`PAI_INDICATORS`), seeded via
`sr(s)=frac(sin(s+1)×10⁴)`, with current-period value, prior-period value, a coverage boolean, and a
benchmark figure per indicator:

```js
current  = unit==='%' ? base×60+5 : unit==='tCO2e/€M' ? base×150+20 : base×50+5
prior    = same formula using an independently-seeded 'prev' draw
covered  = sr() > 0.25                                        // ~75% coverage rate
benchmark = unit==='%' ? sr()×40+10 : sr()×80+15
```

Portfolio-level rollups: `covered = count(pais.covered)`, `improved = count(current<prior)`,
`worsened = count(current>prior)`, and category-group averages (`catGroups`) across Climate/Social/
Biodiversity/Water/Waste/Governance.

### 7.2 Parameterisation — the complete, correctly-labelled 18 SFDR PAI indicators

| # | Name | Asset class | Category |
|---|---|---|---|
| PAI-1 | GHG Emissions (S1+2+3 / €M invested) | company | Climate |
| PAI-2 | Carbon Footprint (tCO2e/€M EVIC) | company | Climate |
| PAI-3 | GHG Intensity (tCO2e/€M revenue) | company | Climate |
| PAI-4 | Fossil Fuel Exposure | company | Climate |
| PAI-5 | Non-Renewable Energy | company | Climate |
| PAI-6 | Energy Intensity (high climate impact sectors) | company | Climate |
| PAI-7 | Biodiversity Sensitive Areas | company | Biodiversity |
| PAI-8 | Water Emissions | company | Water |
| PAI-9 | Hazardous Waste | company | Waste |
| PAI-10 | UNGC Violations | company | Social |
| PAI-11 | Lack of UNGC Processes | company | Social |
| PAI-12 | Gender Pay Gap | company | Social |
| PAI-13 | Board Gender Diversity | company | Social |
| PAI-14 | Controversial Weapons | company | Governance |
| PAI-15 | Sovereign GHG Intensity | **sovereign** | Climate |
| PAI-16 | Fossil Fuel Sovereigns | **sovereign** | Climate |
| PAI-17 | Fossil Fuel RE | **real estate** | Climate |
| PAI-18 | Energy Efficiency RE (EPC D or below) | **real estate** | Climate |

This is the **most complete and correctly labelled PAI implementation on the platform** — it is the only
module of the SFDR family carrying all 18 indicators with correct labels for both sovereign (15–16) and
real-estate (17–18) asset-class-specific indicators, matching SFDR RTS Annex I Table 1 exactly.

### 7.3 Calculation walkthrough

1. **PAI Statement tab**: `covered`/`improved`/`worsened` counts summarise the fund's 18-indicator
   scorecard; `catGroups` computes an unweighted mean of `current` values within each of 6 category buckets
   (`Climate` appears twice conceptually via PAI-1..6 and PAI-15..18, but the `catGroups` filter groups by
   the literal `category` string, so all Climate-tagged indicators — company AND sovereign AND real-estate
   — are pooled into a single "Climate" average, mixing asset classes with different units, e.g. tCO₂e/€M
   invested (PAI-1) averaged with a real-estate EPC % (PAI-18)).
2. **Indicator Drill-Down tab**: presumably renders the full `pais` array per indicator with current vs
   prior vs benchmark comparison (component not fully excerpted, but the data structure supports it).
3. **Fund Comparison tab**: cross-fund comparison using the same 18-indicator structure.
4. **Action Plan tab**: likely surfaces `worsened` indicators as remediation priorities, consistent with the
   `improved`/`worsened` classification already computed in the PAI Statement tab.

### 7.4 Worked example

Fund at index 1 (default selection, an "Art 8" fund per `selFund=FUNDS[1]`): for PAI-4 (Fossil Fuel
Exposure, unit `%`), `current = sr(1×31+3×7)×60+5`, illustrative draw ≈ `5+60×0.28 ≈ 21.8%`;
`prior ≈ 5+60×0.35 ≈ 26%` → since `current(21.8) < prior(26)`, this indicator counts toward `improved`.
Aggregating across all 18 indicators for this fund gives the `improved`/`worsened`/`covered` counts shown
in the PAI Statement header.

### 7.5 Companion analytics on the page

- **Fund selector bar** — Classification (Art 6/8/9), AUM (€bn), ISIN, and PAI Coverage % with threshold
  colour-coding (green ≥80%, amber ≥60%, red below) — consistent presentation with sibling SFDR modules.
- **Category grouping caveat** (§7.3.1) is the one methodological soft spot in an otherwise well-labelled
  module — a production implementation would keep sovereign/real-estate climate indicators in separate
  sub-groups from company-level climate indicators given their different units and denominators.

### 7.6 Data provenance & limitations

- **All 8 funds and their 18×2 (current+prior) PAI values are synthetic**, generated fresh per session via
  `sr(seed)=frac(sin(seed+1)×10⁴)`; fund names are illustrative, not real registered UCITS products.
- **Category-level averaging pools different asset classes and units** (company vs sovereign vs real
  estate, all tagged "Climate") — the `catGroups` average is a directional summary only, not a
  methodologically rigorous composite.
- `covered` (data coverage boolean) is independently random per indicator per fund, uncorrelated with the
  fund's `coverage` headline % shown in the selector bar — the two coverage figures (18-indicator boolean
  count vs. the headline `selFund.coverage`) are not guaranteed to be numerically consistent with each
  other.

**Framework alignment:** SFDR RTS Annex I Table 1 — the complete, correctly asset-class-differentiated
18-indicator taxonomy is accurately reproduced, the strongest such implementation among the platform's SFDR
modules · SFDR Article 6/8/9 fund classification badge convention matches the regulation's actual tiering ·
the reference period framing ("1 Jan – 31 Dec") in the header matches SFDR's actual annual PAI Statement
reporting cycle.
