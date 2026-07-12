## 7 · Methodology Deep Dive

*(No MODULE_GUIDES entry exists for this API domain. The sections below document
`backend/services/china_trade_engine.py` — a facade over six stakeholder engines plus a
cross-module bridge — exposed at `/api/v1/china-trade` via `backend/api/v1/routes/china_trade.py`.)*

### 7.1 What the module computes

The domain is a **DB-first, reference-fallback** data service: every engine first queries the
`ctp_*` Postgres tables (`ctp_entities`, `ctp_export_products`, `ctp_cbam_liabilities`,
`ctp_ets_positions`, `ctp_china_esg_disclosures`, `ctp_trade_corridors`,
`ctp_marketplace_listings`) and, when empty, serves curated hard-coded reference snapshots.
Its two genuinely computational blocks are:

1. **CBAM liability with CETS deduction** (`CBAMAutoFillEngine.calculate_cbam_liability`):
   ```
   total_embedded  = embedded_tCO2/t × volume_t
   excess_tCO2     = max(0, total_embedded − eu_benchmark_tCO2/t × volume_t)
   gross_CBAM_EUR  = excess × EU_ETS_price          (default €65/t)
   CETS_paid_EUR   = excess × CETS_price_EUR        (€12.16 = ¥95 × 0.128)
   net_CBAM_EUR    = max(0, gross − CETS_paid)      (Art. 9 deduction)
   ```
   plus `price_impact_pct = net / (export_value_EUR) × 100` and a USD figure at a fixed 1.09
   EUR/USD rate.
2. **P&L CBAM scenarios** (`TradeCorridorEngine.get_pl_impact`): for 6 EU-ETS price points
   {40, 50, 60, 65, 75, 90 €/t}, per-tonne net liability
   `max(0, excess/t × (p − 12.16))` and a price-impact % against a fixed $500/t sale price.

Everything else is lookup/filter/aggregation: exporter search and CBAM-readiness distribution,
supplier ranking (sorted by readiness score after intensity/certification filters), ESG dashboard
averages, corridor cards, marketplace listings, and the cross-module bridges (§7.5).

### 7.2 Parameterisation

**EU CBAM benchmarks** (`_EU_BENCHMARKS`, tCO₂/t by HS-4, labelled "EU CBAM Annex III"):
steel ingots/semis/bars 0.878, flat-rolled steel 1.331, aluminium 5.647, Portland cement 0.569,
nitrogen fertilisers 0.646, electricity 0.276. Unknown HS-4 → `null` benchmark (liability calc
then substitutes `0.75 × embedded`).

**Carbon prices:** `CETS_PRICE_CNY = 95.0` (¥/tCO₂, comment "March 2026"), `CNY_EUR = 0.128`
→ CETS €12.16/t; EU ETS reference €65/t; arbitrage = €52.84/t. CETS price history 2021–2026
(¥48.0 → ¥95.0) hard-coded.

**Competitiveness risk bands** (on net CBAM liability): >€5M critical · >€1M high ·
>€0.2M medium · else low (engine-authored cut-offs).

**Supplier-lookup fallback intensity:** matched exporter's `avg_embedded_carbon_tco2_per_tonne`;
else `1.35 × EU benchmark`; else 1.5 tCO₂/t (synthetic default).

**IFRS 9 ECL overlay bands** (`_ECL_CBAM_BANDS`, CBAM-readiness → credit uplift):

| Band | Readiness | PD uplift | LGD uplift | ECL stage |
|---|---|---|---|---|
| Low | 75–100 | 0 bps | 0 bps | Stage 1 |
| Medium | 50–74 | 25 bps | 50 bps | Stage 2 |
| High | 25–49 | 75 bps | 100 bps | Stage 2/3 |
| Critical | 0–24 | 150 bps | 200 bps | Stage 3 |

**NGFS × CETS scenario overlay:** 4 scenarios with hard-coded CETS price paths (e.g. Net Zero
2050: ¥95→145→210→290 across 2025/30/35/40; Current Policies: ¥90→98→108→120) and 2030 CBAM
arbitrage figures (€8.5–€45.1/t).

**Scope 3 Cat 1 factors** (`_SCOPE3_CAT1_FACTORS`): 10 HS-4 emission factors labelled "CETS
verified 2024" / "IEA 2024 lifecycle" (e.g. hot-rolled coil 2.15, unwrought aluminium 11.2,
Li-ion batteries 7.50 tCO₂/t).

**Reference universe:** 12 named Chinese exporters (Baowu, HBIS, Chalco, LONGi, BYD, CATL,
Sinopec, CNOOC, Shenhua, Zijin, Ganfeng, CR Cement) with authored readiness scores (29–88),
embedded intensities, ESG scores, and 2024 CETS positions; 5 trade corridors; 4 importer
requirement frameworks (VW/ArcelorMittal/Airbus/BASF); 6 marketplace listings; 7 price
benchmarks (CETS $13.1 … EU ETS $71.2 spot).

### 7.3 Calculation walkthrough

`GET /cbam/supplier-lookup?entity_name&hs_code` resolves the HS-4 benchmark and the entity's
embedded intensity (DB → reference exporter → 1.35×benchmark → 1.5), then returns a
`cbam_auto_fill` block (embedded carbon, EU benchmark, CETS €) that the frontend CBAM Calculator
uses to pre-populate counterparty fields. The liability calculator then applies the §7.1 chain;
`vs_eu_benchmark_pct = (embedded − benchmark)/benchmark × 100`. Corridor endpoints
(`GET /corridors`, `/corridors/{origin}/{destination}`, `/corridors/pl-impact/{sector}`) serve
the corridor cards and run the 6-point price scenario grid. Cross-module endpoints
(`/cross-module/ecl-cbam-overlay`, `/portfolio-cbam`, `/entity-hub/{entity}`) aggregate the same
data into shapes consumed by Financial Risk, Portfolio Analytics and the per-entity hub card.

### 7.4 Worked example — Baowu hot-rolled steel (HS 7208), 100,000 t to the EU

Embedded 1.82 tCO₂/t (reference exporter), benchmark 1.331 (HS 7208), EU ETS €65/t:

| Step | Computation | Result |
|---|---|---|
| Excess intensity | 1.82 − 1.331 | 0.489 tCO₂/t |
| Excess carbon | 0.489 × 100,000 | 48,900 tCO₂ |
| Gross CBAM | 48,900 × €65 | €3,178,500 |
| CETS deduction | 48,900 × €12.16 | €594,624 |
| Net CBAM | 3,178,500 − 594,624 | **€2,583,876** |
| Risk band | €1M < net ≤ €5M | **high** |
| vs EU benchmark | (1.82−1.331)/1.331 | +36.7% (stored as 36.8) |

At €80M export value, `price_impact_pct = 2,583,876 / 80,000,000 × 100 ≈ 3.23%`.

### 7.5 Cross-module bridges

- **Scope 3 Cat 1** → Supply Chain module: per-HS emission factors for purchased-goods
  calculations (GHG Protocol Category 1).
- **ECL-CBAM overlay** → Financial Risk: readiness-score → PD/LGD-uplift banding (IFRS 9 §5.5
  staging language); counts DB entities per band.
- **Regulatory CSRD** → maps 5 SSE/SZSE 2024 disclosure fields to ESRS E1/E3, SFDR PAI 1/4/5/7
  and IFRS S2 paragraphs with authored coverage percentages (65–88%) and named gaps.
- **NGFS × CETS** → Scenario Analysis: the 4 scenario price paths of §7.2.
- **Portfolio CBAM** → Portfolio Analytics: sector-level gross/net liability roll-up (SQL
  aggregation, with a 4-sector synthetic fallback), Art. 9 deduction = gross − net.

### 7.6 Data provenance & limitations

- **No PRNG**: no `sr(seed)` pattern; but essentially *all* reference numbers (exporter
  readiness scores, ESG scores, corridor liabilities, CETS positions, marketplace listings,
  NGFS price paths, Scope-3 factors) are **curated synthetic snapshots** hard-coded in the
  engine. They are plausibly scaled to public figures but are not live data; company names are
  real, their metrics are authored.
- The CBAM model is simplified: single default EU ETS price, no free-allocation phase-in of the
  CBAM factor, no per-certificate weekly-average pricing, fixed FX (0.128 CNY/EUR, 1.09
  EUR/USD), and `1.35 × benchmark` as a default-intensity proxy where CBAM's actual default
  values are country/process-specific.
- `entity-hub` is DB-only (returns an error when `ctp_entities` is empty); most other endpoints
  silently fall back to reference data with a `source: reference` marker.
- ECL uplifts (25–150 bps PD) are illustrative calibrations, not fitted credit parameters.

### 7.7 Framework alignment

- **EU CBAM Regulation (EU) 2023/956** — embedded-emissions × (EU ETS price) liability with
  Art. 9 deduction of carbon prices *effectively paid* in the origin country (here CETS);
  Annex III-style default benchmarks per HS code. The engine's "excess over EU benchmark"
  design approximates the free-allocation-adjusted certificate obligation.
- **China national ETS (CETS)** — Phase 2 compliance positions (allocation vs verified
  emissions), CBEEX pricing, sector coverage expansion narrative.
- **GHG Protocol Scope 3 Category 1** — supplier-specific emission factors for purchased goods.
- **IFRS 9 §5.5** — ECL staging vocabulary for the readiness→PD/LGD overlay (a management
  overlay, not a modelled PD shift).
- **NGFS Climate Scenarios (v4)** — scenario names and transition-risk ordering for CETS price
  paths.
- **CSRD/ESRS, SFDR PAI, IFRS S2** — disclosure crosswalk from SSE/SZSE 2024 mandatory ESG
  guidelines; PAI = SFDR's principal adverse impact indicators reported by FMPs.
- **CSDDD / ResponsibleSteel / ASI** — importer supplier-requirement frameworks in the ranking
  engine.
