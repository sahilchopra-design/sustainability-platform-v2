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

### 2.3 Engine `china_trade_engine` (services/china_trade_engine.py)
| Function | Args | Purpose |
|---|---|---|
| `_exec_read` | sql, params |  |
| `_exec_write` | sql, params |  |
| `ChinaExporterEngine.search_exporters` | query, sector, cbam_applicable, min_cbam_readiness, limit |  |
| `ChinaExporterEngine.get_exporter_profile` | entity_name |  |
| `ChinaExporterEngine.get_cbam_readiness_summary` |  | Distribution of CBAM readiness bands across Chinese exporters. |
| `CBAMAutoFillEngine.supplier_lookup` | entity_name, hs_code | Key cross-module endpoint. |
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

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `db-empty`, `real-db`

**Database tables:** `CBAM`, `CETS`, `China`, `__future__` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `services` *(shared)*, `typing` *(shared)*

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/china-trade/cbam/hs-benchmarks** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['benchmarks', 'cets_price_cny', 'cets_price_eur', 'eu_ets_reference_eur', 'arbitrage_eur_per_tco2', 'source'], 'n_keys': 6}`

**GET /api/v1/china-trade/cbam/supplier-lookup** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['entity_name', 'sector', 'hs_code', 'hs_description', 'embedded_carbon_tco2_per_tonne', 'production_process', 'eu_benchmark_tco2_per_tonne', 'vs_eu_benchmark_pct', 'green_certified', 'green_ce`

**GET /api/v1/china-trade/corridors** — status `passed`, provenance ['real-db'], source tables: `ctp_trade_corridors`
Output: `{'type': 'object', 'keys': ['source', 'corridors'], 'n_keys': 2}`

**GET /api/v1/china-trade/corridors/pl-impact/{sector}** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['sector', 'embedded_carbon_tco2_per_tonne', 'eu_benchmark_tco2_per_tonne', 'excess_carbon_tco2_per_tonne', 'cets_price_eur', 'current_eu_ets_price_eur', 'scenarios'], 'n_keys': 7}`

**GET /api/v1/china-trade/corridors/{origin}/{destination}** — status `passed`, provenance ['db-empty'], source tables: `ctp_trade_corridors`
Output: `{'type': 'object', 'keys': ['corridor_name', 'origin_country', 'destination_country', 'trade_value_usd_bn', 'trade_volume_mn_tonnes', 'carbon_intensity_avg_tco2_per_tonne', 'total_embedded_carbon_mtco2', 'cbam_applicable`

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