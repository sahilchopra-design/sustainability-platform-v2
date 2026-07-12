# Api::China_Trade
**Module ID:** `api::china_trade` · **Route:** `/api/v1/china-trade` · **Tier:** A (backend vertical) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| GET | `/api/v1/china-trade/exporters/search` | `search_exporters` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/exporters/cbam-readiness-summary` | `exporter_cbam_readiness_summary` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/exporters/{entity_name}/profile` | `get_exporter_profile` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cbam/supplier-lookup` | `cbam_supplier_lookup` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cbam/hs-benchmarks` | `cbam_hs_benchmarks` | api/v1/routes/china_trade.py |
| POST | `/api/v1/china-trade/cbam/calculate-liability` | `calculate_cbam_liability` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/suppliers/requirements` | `get_supplier_requirements` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/suppliers/rank` | `rank_suppliers` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/esg-ets/dashboard` | `esg_dashboard` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/esg-ets/ndc-alignment` | `ndc_alignment` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/esg-ets/ets-positions` | `ets_positions` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/esg-ets/cets-price` | `cets_price` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/corridors` | `list_corridors` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/corridors/{origin}/{destination}` | `get_corridor` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/corridors/pl-impact/{sector}` | `corridor_pl_impact` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/marketplace/listings` | `marketplace_listings` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/marketplace/price-discovery` | `marketplace_price_discovery` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/marketplace/stats` | `marketplace_stats` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/summary` | `platform_summary` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/entity-hub/{entity_name}` | `entity_hub` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/scope3-cat1` | `cross_module_scope3_cat1` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/ecl-cbam-overlay` | `cross_module_ecl_cbam` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/regulatory-csrd` | `cross_module_regulatory_csrd` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/scenario-cets-ngfs` | `cross_module_scenario_ngfs` | api/v1/routes/china_trade.py |
| GET | `/api/v1/china-trade/cross-module/portfolio-cbam` | `cross_module_portfolio_cbam` | api/v1/routes/china_trade.py |

### 2.3 Engine `china_trade_engine` (services/china_trade_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_exec_read` | sql, params |  |
| `_exec_write` | sql, params |  |
| `ChinaExporterEngine.search_exporters` | query, sector, cbam_applicable, min_cbam_readiness, limit |  |
| `ChinaExporterEngine.get_exporter_profile` | entity_name |  |
| `ChinaExporterEngine.get_cbam_readiness_summary` |  | Distribution of CBAM readiness bands across Chinese exporters. |
| `CBAMAutoFillEngine.supplier_lookup` | entity_name, hs_code | Key cross-module endpoint. Returns embedded carbon intensity + CETS price for the CBAM Calculator to auto-fill. |
| `CBAMAutoFillEngine.calculate_cbam_liability` | entity_name, hs_code, export_volume_tonnes, eu_ets_price_eur, export_value_eur_mn | Full CBAM liability calculation with CETS deduction. |
| `CBAMAutoFillEngine.get_hs_benchmark_table` |  | All HS-4 EU benchmark values. |
| `SupplierFrameworkEngine.get_requirements` | framework, product_category |  |
| `SupplierFrameworkEngine.rank_suppliers` | product_category, max_intensity, require_certified | Rank Chinese exporters against importer requirements for a product category. |
| `ChinaESGETSEngine.get_esg_dashboard` | sector, esg_tier |  |
| `ChinaESGETSEngine.get_ndc_alignment` | sector |  |
| `ChinaESGETSEngine.get_ets_positions` | sector |  |
| `TradeCorridorEngine.get_all_corridors` |  |  |
| `TradeCorridorEngine.get_corridor` | origin, destination |  |
| `TradeCorridorEngine.get_pl_impact` | sector, eu_ets_price_eur | P&L CBAM impact scenarios across 6 EU ETS price points. |
| `MarketplaceEngine.get_listings` | listing_type, standard, sector, limit |  |
| `MarketplaceEngine.get_price_discovery` |  |  |
| `MarketplaceEngine.get_market_stats` |  |  |
| `CrossModuleEngine.get_scope3_cat1` | sector | GHG Protocol Scope 3 Category 1 (Purchased Goods & Services) emission factors for Chinese exported goods. Pulled from ctp_export_products first, then falls back to curated reference table. |
| `CrossModuleEngine.get_ecl_cbam_overlay` |  | IFRS 9 ECL overlay: maps Chinese exporter CBAM readiness to PD/LGD uplifts. Provides credit risk bands for financial institutions with China trade exposure. |
| `CrossModuleEngine.get_regulatory_csrd` |  | Maps SSE/SZSE 2024 mandatory ESG disclosures to CSRD ESRS E1, SFDR PAI, and ISSB S2 data points. Used by the Regulatory module China ESG panel. |
| `CrossModuleEngine.get_scenario_cets_ngfs` |  | CETS price trajectory under NGFS v4 scenarios. Used by Scenario Analysis module for China transition risk overlay. |
| `CrossModuleEngine.get_portfolio_cbam` |  | Portfolio-level CBAM exposure aggregation. Used by Portfolio Analytics module for China CBAM risk roll-up. |
| `CrossModuleEngine.get_entity_hub` | entity_name | Single-entity cross-module data card. Aggregates exporter profile, CBAM liability, ETS position, ESG score, Scope 3 Cat 1 factor, and marketplace listings for one Chinese entity. |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CBAM`, `CETS`, `China`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/china-trade/cbam/hs-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks', 'cets_price_cny', 'cets_price_eur', 'eu_ets_reference_eur', 'arbitrage_eur_per_tco2', 'source'], 'n_keys': 6}`

**GET /api/v1/china-trade/cbam/supplier-lookup** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_name', 'sector', 'hs_code', 'hs_description', 'embedded_carbon_tco2_per_tonne', 'production_process', 'eu_benchmark_tco2_per_tonne', 'vs_eu_benchmark_pct', 'green_certified', 'green_certification_type', 'cets_price_cny_per_tco2', 'cets_price_eur_per_tco2', 'cbam_a`

**GET /api/v1/china-trade/corridors** — status `passed`, provenance ['real-db'], source tables: `ctp_trade_corridors`
Output: `{'type': 'object', 'keys': ['source', 'corridors'], 'n_keys': 2}`

**GET /api/v1/china-trade/corridors/pl-impact/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'embedded_carbon_tco2_per_tonne', 'eu_benchmark_tco2_per_tonne', 'excess_carbon_tco2_per_tonne', 'cets_price_eur', 'current_eu_ets_price_eur', 'scenarios'], 'n_keys': 7}`

**GET /api/v1/china-trade/corridors/{origin}/{destination}** — status `passed`, provenance ['db-empty'], source tables: `ctp_trade_corridors`
Output: `{'type': 'object', 'keys': ['corridor_name', 'origin_country', 'destination_country', 'trade_value_usd_bn', 'trade_volume_mn_tonnes', 'carbon_intensity_avg_tco2_per_tonne', 'total_embedded_carbon_mtco2', 'cbam_applicable', 'carbon_border_regime', 'regime_full_implementation', 'key_product_categories`

**GET /api/v1/china-trade/cross-module/ecl-cbam-overlay** — status `passed`, provenance ['db-empty'], source tables: `ctp_cbam_liabilities`, `ctp_entities`, `ctp_export_products`
Output: `{'type': 'object', 'keys': ['module', 'description', 'methodology', 'cets_price_eur', 'eu_ets_price_eur', 'cbam_arbitrage_eur', 'risk_bands', 'total_entities_assessed', 'china_trade_link', 'reference_standard'], 'n_keys': 10}`

**GET /api/v1/china-trade/cross-module/entity-hub/{entity_name}** — status `passed`, provenance ['db-empty'], source tables: `ctp_entities`
Output: `{'type': 'object', 'keys': ['error'], 'n_keys': 1}`

**GET /api/v1/china-trade/cross-module/portfolio-cbam** — status `passed`, provenance ['db-empty'], source tables: `ctp_cbam_liabilities`, `ctp_entities`, `ctp_export_products`
Output: `{'type': 'object', 'keys': ['module', 'description', 'total_gross_cbam_liability_eur', 'total_net_cbam_liability_eur', 'art9_cets_deduction_eur', 'cets_price_eur', 'eu_ets_price_eur', 'sector_breakdown', 'china_trade_link', 'reference_standard'], 'n_keys': 10}`

## 5 · Intermediate Transformation Logic

**Engine `china_trade_engine` — extracted transformation lines:**
```python
CETS_PRICE_EUR = round(CETS_PRICE_CNY * CNY_EUR_RATE, 2)   # ≈ 12.16 EUR/tCO2
vs_benchmark_pct = round((embedded - eu_benchmark) / eu_benchmark * 100, 1) if eu_benchmark else None
total_embedded_tco2 = embedded * export_volume_tonnes
eu_benchmark_total = eu_benchmark * export_volume_tonnes
excess_tco2 = max(0.0, total_embedded_tco2 - eu_benchmark_total)
gross_cbam_eur = excess_tco2 * eu_ets_price_eur
cets_paid_eur = excess_tco2 * self.CETS_PRICE_EUR
net_cbam_eur = max(0.0, gross_cbam_eur - cets_paid_eur)
price_impact_pct = round(net_cbam_eur / (export_value_eur_mn * 1_000_000) * 100, 2)
excess = max(0.0, intensity - benchmark)
net_liability_per_tonne = max(0.0, excess * (p - cets))
```

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).

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

## 9 · Future Evolution

### 9.1 Evolution A — Live CBAM pricing/FX and populated ctp_* tables (analytics ladder: rung 1 → 3)

**What.** A large DB-first, reference-fallback facade over six stakeholder engines (exporter search,
CBAM auto-fill, supplier ranking, China ESG/ETS, trade corridors, marketplace) plus cross-module
bridges. Its two genuinely computational blocks — CBAM liability with CETS Art. 9 deduction, and the
6-point P&L price-scenario grid — are sound. But §7.6 is blunt: essentially *all* reference numbers
(12 exporters' readiness/ESG scores, corridor liabilities, CETS positions, NGFS price paths, Scope-3
factors) are **curated synthetic snapshots** hard-coded in the engine — plausibly scaled to public
figures, company names real, metrics authored. The CBAM model also uses a single default EU ETS
price, fixed FX (0.128 CNY/EUR, 1.09 EUR/USD), and `1.35 × benchmark` as a default-intensity proxy.
Evolution A populates the `ctp_*` tables with real exporter/corridor/ETS data and wires live EU
ETS/CETS prices and FX.

**How.** Ingesters load real Chinese-exporter emissions (the platform wires Comtrade/China-trade
sources), CETS prices (CBEEX), and EU ETS spot into the `ctp_entities`/`ctp_export_products`/
`ctp_ets_positions` tables so the engines' DB-first path returns real rows; the CBAM calculator's
fixed price/FX constants become live inputs. Rung 3: replace the `1.35 × benchmark` default-intensity
proxy with CBAM's country/process-specific default values and calibrate the ECL PD/LGD uplift bands
(illustrative today) against observed CBAM-exposed credit data.

**Prerequisites.** The `db-empty` provenance across corridor/entity-hub/portfolio-CBAM routes (§4.2)
is the headline gap — `entity-hub` returns an error when `ctp_entities` is empty; seed real rows
(roadmap D1). **Acceptance:** the §7.4 Baowu worked example (€2,583,876 net CBAM) reproduces at
legacy constants; a live EU ETS price moves the liability; `entity-hub` returns a real entity card;
routes report `source: db` not `source: reference`.

### 9.2 Evolution B — China-CBAM desk analyst across the cross-module bridges (LLM tier 3)

**What.** This domain is explicitly built as a cross-module hub (Scope 3 Cat 1 → Supply Chain,
ECL-CBAM overlay → Financial Risk, CSRD crosswalk → Regulatory, NGFS×CETS → Scenario Analysis,
portfolio-CBAM → Portfolio Analytics) — the natural seed for a desk orchestrator. "Assess our China
trade CBAM exposure for Baowu steel" would chain exporter profile → CBAM liability → ETS position →
Scope-3 factor → ECL overlay → portfolio roll-up into one memo, narrating real engine outputs.

**How.** Tier-3 routing per the roadmap: the domain's own `cross-module/*` endpoints already define
the bridges; the orchestrator tool-calls them plus the CBAM calculator, composing output via the
report layer. The no-fabrication validator checks every €, tCO₂ and readiness score against tool
output; because most figures are curated snapshots today, the copilot must flag reference-fallback
data until Evolution A's real ingestion lands.

**Prerequisites (hard).** Evolution A's populated `ctp_*` tables (so the orchestrator narrates real
data, not authored snapshots); the desk-orchestrator framework (Phase 2–3); Atlas corpus embedded
(roadmap D3). **Acceptance:** an entity memo cites which engine and table produced each figure and
its db-vs-reference provenance; the CBAM liability matches `/cbam/calculate-liability` exactly; a
missing-entity query yields an honest gap, not a fabricated exporter profile.