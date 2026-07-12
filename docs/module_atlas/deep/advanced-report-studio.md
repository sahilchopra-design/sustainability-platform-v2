## 7 · Methodology Deep Dive

### 7.1 What the module computes

A **multi-framework sustainability report generator**: the user picks one of 10 hard-coded
framework definitions (TCFD, SFDR, CSRD/ESRS, ISSB S1/S2, PCAF, GRI, PRI, TNFD, CDP-style and
others in `FRAMEWORKS`), the page computes portfolio climate metrics from holdings (live
portfolio if loaded, else 6 `DEMO_HOLDINGS` NSE-listed names), auto-populates per-disclosure
narrative strings, and renders/export an HTML report. Two computation layers:

**`computePortfolioMetrics(holdings)` — headline metrics.**

```
WACI      = Σ w_i × (scope1_i + scope2_i)/revenue_i × 1000    // t CO₂e / $M revenue,
                                                              // w_i = exposure share
sbtiPct   = count(sbti_committed)/n × 100
dataCoverage = count(S1>0 or S2>0)/n × 100
impliedTemp  = 1.6 if WACI<120 · 1.9 <180 · 2.4 <250 · 2.8 <320 · else 3.2   (°C lookup)
waciReduction = max(0, (300 − WACI)/300 × 100)
```

**`computeAdvancedKPIs(holdings)` — 18 KPIs in 6 dimensions** (climate, transition readiness,
nature, social, governance/data-quality, portfolio risk). Highlights:

```
Climate VaR (95%, delta-normal, comment in code):
  T = Σ exposure_i × |transition_shock(sector_i)|
  P = Σ exposure_i × |physical_shock(sector_i)|
  CVaR = 1.645 × √(T² + P² + 2·0.25·T·P)          // ρ = 0.25 transition-physical correlation

Required decarbonisation:  (1 − (100/WACI)^(1/yearsTo2030)) × 100   // to WACI 100 by 2030
Carbon budget overshoot:   (WACI − 100)/100 × 100  when WACI > 100
Transition Readiness Index = min(100, 40·sbtiShare + 30·nz2050Share + 0.3·greenRevShare)
HHI = Σ (w_i·100)²;  top-3 sector concentration;  ESG mean/σ
```

### 7.2 Parameterisation

**Sector shock tables** (fraction of value, 11 GICS sectors):

| Sector | Transition shock | Physical shock |
|---|---|---|
| Energy | −0.35 | −0.08 |
| Materials | −0.22 | −0.12 |
| Utilities | −0.28 | −0.06 |
| Industrials | −0.15 | −0.05 |
| Financials | −0.08 | −0.10 |
| IT | +0.12 | −0.02 |
| Real Estate | −0.18 | −0.20 |
| Consumer Staples | −0.05 | −0.15 |
| (default) | −0.10 | −0.05 |

**NGFS scenario table** (`NGFS_SCENARIOS`) — four scenarios with 2030 carbon price and
per-sector equity shocks: Net Zero 2050 (Orderly, 1.5°C, $250; Energy −35%), Below 2°C
(Orderly, $150), Delayed Transition (Disorderly, $120; Energy −55% — the harshest transition
repricing, consistent with NGFS disorderly logic), Hot House World (3.5°C+, $30; damage
loaded onto Staples −22%, Financials −20%). Other constants: `targetWaci2030 = 100` and
`budgetAlignedWaci = 100` t/$M (stylised 1.5°C-aligned WACI anchor), MSCI ACWI benchmark
WACI 185 (narrative), `NATURE_DEPENDENCY` sector scores (Energy 85 … Comm. Services 12),
`boardDiversity = 32.4` (hard-coded), fallback metrics (WACI 210, implied temp 2.8 °C) when no
holdings exist, and `YOY_DATA` (FY2022 WACI 320 → FY2023 265 → current computed).

### 7.3 Calculation walkthrough

1. Holdings (live or demo) → `computePortfolioMetrics` → WACI, SBTi %, coverage, implied
   temperature (threshold lookup, not a regression-based ITR).
2. The same holdings → `computeAdvancedKPIs` → 18-metric panel; every return value is
   `isFinite`-guarded with explicit fallbacks.
3. Framework selection → per-disclosure narrative templates interpolate the computed metrics
   (e.g. SFDR PAI-2 renders "WACI: … t CO₂e/USD Mn Revenue. Benchmark: MSCI ACWI at 185";
   ISSB S2-M1 estimates Scope 3 as `(S1+S2) × 3.2`; PCAF-2 derives an invested-capital
   intensity as `WACI × 0.85`).
4. `generateHTMLReport` assembles cover, executive summary, KPI boxes, YoY table (nulls in
   FY2024 filled with current computed values), NGFS stress-test section, data-lineage table
   and glossary into a downloadable HTML document; a Markdown export path mirrors it.

### 7.4 Worked example — demo portfolio WACI and CVaR

Using the 6 demo holdings (total exposure = 24.5+31.2+28.0+21.0+19.5+14.0 = $138.2M):

- Reliance intensity = (28.5+6.2)/94,500 × 1000 = 0.3672 kt/$M → ×1000 = **367.2 t/$M**;
  weight 24.5/138.2 = 0.1773 → contribution 65.1. TCS: (0.40/27,800)×1000×0.2258 ≈ 0.0032.
  Summing all six gives **WACI ≈ 66 t CO₂e/$M** — dominated entirely by Reliance.
- CVaR: T = 24.5×0.35 + (31.2+21.0)×0.12 + (28.0+19.5)×0.08 + 14.0×0.05 = 8.575+6.264+3.80+0.70
  = **$19.34M**; P = 24.5×0.08+52.2×0.02+47.5×0.10+14.0×0.15 = 1.96+1.044+4.75+2.10 = **$9.85M**;
  CVaR = 1.645×√(19.34² + 9.85² + 2×0.25×19.34×9.85) = 1.645×√(374.0+97.0+95.3) = 1.645×23.80 =
  **$39.2M ≈ 28% of exposure**.
- Required decarbonisation (2026, 4 years to 2030, WACI 66 < 100) → exponent negative →
  0% (already below the 100 t/$M target); carbon budget overshoot = 0.

### 7.5 Data provenance & limitations

- Demo holdings are **hand-authored approximations of six real Indian large-caps** (tickers,
  revenues, emissions of plausible magnitude) — not sourced disclosures. No PRNG is used in
  the metric path; YoY history and board diversity are hard-coded.
- The "CVaR" is not a conditional VaR from a loss distribution: it is a delta-normal-style
  combination of two deterministic exposure-weighted shock aggregates. Because shocks enter as
  absolute values, diversification between long positions in winners (IT +12%) and losers is
  ignored — the figure is conservative by construction.
- Implied temperature is a 5-bucket WACI lookup, not an ITR model (no company-level pathway
  regression); Scope 3 in narratives is a flat ×3.2 multiplier of S1+S2; PCAF DQ score is a
  hard-coded 2.3 in text; the WACI-100 "1.5°C-aligned" anchor is a stylised platform choice.
- Narrative auto-population asserts compliance language ("compliant"/"partial") from these
  simplified metrics — a production report would require assured underlying data (ISAE 3000)
  and true disclosed/required coverage math (the guide's `Coverage_score` formula is not
  implemented; `dataCoverage` measures emissions-data availability, not disclosure coverage).
  No XBRL/JSON export exists despite the guide mentioning it — exports are HTML and Markdown.

### 7.6 Framework alignment

- **TCFD / ISSB IFRS S2** — the four-pillar structure (Governance/Strategy/Risk
  Management/Metrics & Targets) is reproduced in the framework definitions; S2 narratives
  cover cross-industry metric categories (GHG, transition/physical risk amounts, targets).
- **SFDR** — PAI-style indicators 1–3 (GHG, carbon footprint, GHG intensity) auto-fill from
  the WACI computation; benchmark comparison follows Annex I presentation conventions.
- **CSRD/ESRS E1** — E1-4 (targets) and E1-6 (gross Scope 1/2) narrative slots map to the
  actual ESRS datapoint numbering.
- **PCAF** — financed-emissions attribution appears in the KPI engine as
  `af = exposure/EVIC` × company emissions, which is PCAF's listed-equity attribution formula;
  the data-quality score (1–5 scale, 1 = reported & verified) follows PCAF's DQ hierarchy but
  is asserted, not computed.
- **NGFS** — the four-scenario set with orderly/disorderly/hot-house categories and harsher
  shocks under Delayed Transition mirrors NGFS Phase III/IV narrative logic; shock magnitudes
  are platform-stylised.
- **GRI 305 / PRI / TNFD** — additional narrative templates exist per framework; TNFD content
  uses the sector nature-dependency heuristic (ENCORE-style dependency scoring, simplified to
  one number per sector).
