## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain — this deep dive is grounded in
`backend/services/health_climate_engine.py` (E59) and `backend/api/v1/routes/health_climate.py`.)*

### 7.1 What the domain computes

Seven function-level methods assessing the **health–climate nexus** for a corporate entity, five
of which are routed (`/heat-stress`, `/air-quality`, `/food-security-health`,
`/financial-impact`, `/composite`) plus three reference endpoints (country profiles, Lancet
indicators, WHO guidelines). Headline formulas:

```
Heat:  WBGT = observed, else 26 + heat_mortality×1.5 (country proxy)
       heat_score = (WBGT − 26)/(32 − 26) × 100        (clamped 0–100)
       productivity_loss% = min(50, (WBGT − 26) × 10 × outdoor_fraction)   ("10%/°C above 26°C WBGT")
Air:   respiratory mortality/100k = PM2.5 × 0.6         (WHO GBD concentration-response proxy)
       compliance_cost = (PM2.5 − 10)⁺ × production × 0.005
Vector: per-disease 2050 range change from published RCP4.5/8.5 sensitivities
       composite = (100 − health_resilience)×0.5 + WHO_CCS×0.3
Food:  caloric_deficit% = 2.5 × 2.6 decades × (1 + (100 − food_score)/200)   (IPCC "2-3%/decade")
Fin:   sick days = heat_mortality×outdoor×0.8 + PM2.5/20×(1−outdoor)×0.5
       healthcare uplift = employees × sick_days × 30% climate share × daily cost
       litigation = employees × outdoor × $500 × heat_mortality
Composite: 0.25·heat + 0.25·air + 0.15·vector + 0.15·food + 0.20·financial
           (weights renormalised when the wage-dependent financial score is null)
```

### 7.2 Parameterisation

**Country health profiles** (21 countries + default; fields per WHO Climate & Health Country
Profiles style): heat mortality /100k (BD 4.2, NG 5.1, US 0.7, GB 0.5), PM2.5 annual mean
(NG 68, IN 58 … AU 8.0), WHO climate-change-sensitivity score, health-resilience 0–100, and
NCCHAP / health-in-NDC booleans.

**Thresholds & constants (with in-code provenance):**

| Constant | Value | Provenance note in code |
|---|---|---|
| WHO AQG PM2.5 / NO₂ / O₃ | 5 / 10 / 60 µg/m³ | WHO Air Quality Guidelines 2021 (real values) |
| EU AQD PM2.5 / NO₂ | 10 / 20 µg/m³ | EU AAQD 2024 revision (2024/2881) — real 2030 limits |
| WBGT bands | 26 productivity onset / 28 moderate / 32 stop-work °C | ILO heat-stress convention |
| OSHA test | WBGT-equivalent < 90 °F | 2024 proposed heat rule (high-heat trigger) |
| NO₂:PM2.5 default ratio | 0.30 | "typical urban co-pollutant ratio (WHO GBD 2019)" |
| Healthcare cost multiple | 1.0 × daily wage | "ILO/WHO cost-of-illness convention" |
| Climate share of sick days | 30% | model constant |
| Adaptation cost proxy | $200/employee/yr; litigation $500/worker duty-of-care | model constants |
| Vector sensitivities | dengue +6.0%/°C, RCP8.5-2050 +120%; malaria 4.5%/°C, +45%; lyme/zika/west-nile smaller | "IPCC AR6 Ch7 / Lancet Countdown Indicator 1.3" |
| Sector outdoor fractions | agriculture 0.90, construction 0.75, mining 0.60 … finance 0.02 | platform calibration |
| Food-security scores | DE 90, US 85 … NG 22, ET 18 | GFSI-style, hardcoded |

A deliberate design pattern runs through this engine (added during the anti-fabrication
remediation): **entity-specific monetary results are "honest nulls"** unless the caller supplies
the unit inputs (daily wage, healthcare cost, prevention budget, commodity vulnerability
scores); only model-structure defaults are hardcoded, and each is documented as such.

### 7.3 Calculation walkthrough

The composite endpoint chains all five component methods: sector → outdoor % lookup → heat →
air (production passed through, 0 if absent) → vector → food (supply chain seeded with
[sector, grains, proteins]) → financial (wage-dependent parts nullable). Component scores are
normalised to 0–100 (air = excess over WHO AQG × 30/5), weighted, **renormalised over non-null
components**, and mapped to ratings: ≥ 75 Critical / ≥ 55 High / ≥ 35 Medium / else Low. Top-3
non-null components become `priority_hazards`; SDG-3 alignment = 100 − overall.

### 7.4 Worked example — Indian construction firm, 10,000 employees, no wage supplied

Profile IN: heat_mortality 3.5, PM2.5 58, WHO CCS 72, resilience 38; outdoor = 75%.

| Component | Computation | Score |
|---|---|---|
| WBGT proxy | 26 + 3.5×1.5 = 31.25 °C | heat = (31.25−26)/6×100 = **87.5** |
| Productivity loss | min(50, 5.25×10×0.75) | 39.4% |
| Air | (58−5)/5×30 = 318 → clamp | **100** |
| Vector | (100−38)×0.5 + 72×0.3 = 31+21.6 | **52.6 (Medium)** |
| Food | 100 − 38 | **62** |
| Financial | wage absent → null | excluded |
| **Composite** | (0.25×87.5 + 0.25×100 + 0.15×52.6 + 0.15×62)/(0.80) | **80.1 → Critical** |

Litigation exposure (wage-independent): 10,000 × 0.75 × 500 × 3.5 = **$13.125M**; insurance
uplift = clamp(5 + 3.5×2) = 12.0%; OSHA: 31.25 °C = 88.25 °F < 90 → compliant.

### 7.5 Reference layer

`GET /ref/country-profiles` (the 21-country table), `/ref/lancet-indicators` and
`/ref/who-guidelines` serve the framework metadata the calculators cite (Lancet Countdown
indicator numbers appear in each result's `source` string, e.g. 1.2 food, 1.3 vectors, 4.4
economic losses).

### 7.6 Data provenance & limitations

- No `sr(seed)` PRNG — the engine was explicitly rebuilt around deterministic defaults and
  nullable entity-specific outputs (comments: "documented; NOT entity-specific data",
  "honest null … rather than a fabricated value").
- Country profiles, food-security scores, sector outdoor fractions, and vector sensitivities
  are **hardcoded stylised transcriptions** of WHO/Lancet/GFSI-order-of-magnitude values, not
  live ingests; the WHO AQG and EU AAQD thresholds are the genuine published limits.
- Simplified dose-response: mortality = PM2.5 × 0.6 is a linear proxy (real GBD uses non-linear
  integrated exposure-response); productivity loss 10%/°C WBGT is steeper than the ILO's
  published curves at moderate heat; RCP mortality uplifts (+30%/+60%) are flat multipliers.
- The WBGT proxy from heat mortality conflates exposure with outcome; the composite's air score
  saturates at 100 for any PM2.5 ≥ ~21.7 µg/m³, flattening distinctions among polluted
  geographies.
- Litigation/adaptation dollar constants ($500, $200) are unanchored model constants — flagged
  as such in comments.

### 7.7 Framework alignment

- **WHO Air Quality Guidelines 2021** — the 5 µg/m³ PM2.5 annual guideline (and NO₂ 10, O₃
  peak-season 60) are WHO's actual 2021 values, derived from systematic reviews of long-term
  exposure mortality risk; the EU comparison uses the revised AAQD's 2030 PM2.5 limit of 10.
- **ILO heat-stress framework ("Working on a warmer planet", 2019)** — WBGT-based productivity
  loss with work-rest thresholds; ILO projects ~2.2% of global working hours lost to heat by
  2030 — the module's per-degree linear loss is a corporate-level adaptation of that logic.
- **OSHA proposed heat standard (2024)** — heat-illness prevention programme triggers at
  initial (80 °F) and high (90 °F) heat-index levels; the module encodes the 90 °F high-heat
  trigger as its compliance test.
- **Lancet Countdown 2023** — indicator numbering (1.2, 1.3, 4.4) matches the report's health-
  hazard and economic-loss indicators; vector range-expansion percentages are of the published
  order (Lancet reports dengue transmission potential up strongly under RCP8.5).
- **IPCC AR6 (WG2 Ch. 5 & 7)** — the 2–3%/decade crop-yield-pressure figure and vector-range
  expansion narratives anchor the food and vector modules.
- **WHO Climate & Health Country Profiles / SDG 3, CSRD ESRS S1, GRI 403** — named as the
  disclosure destinations; the composite's `sdg3_alignment` and the ESRS S1/GRI 403
  recommendations connect occupational-health outputs to reporting frameworks.
