# Geothermal Market Intelligence
**Module ID:** `geothermal-market-intelligence` · **Route:** `/geothermal-market-intelligence` · **Tier:** A (backend vertical) · **EP code:** EP-DV3 · **Sprint:** DV

## 1 · Overview
Global geothermal market intelligence covering installed capacity by country, project pipeline, direct-use thermal capacity (90 GWth), national policy comparison and new entrant markets in Chile, Ethiopia and Saudi Arabia.

> **Business value:** Global geothermal capacity is led by USA (3.7 GW), Indonesia (2.4 GW), Philippines (1.9 GW), Turkey (1.7 GW) and Kenya (0.9 GW); 90 GWth direct-use capacity underscores the technology's broader energy significance beyond power generation.

**How an analyst works this module:**
- Map global installed capacity by country using IRENA and ThinkGeoEnergy data
- Assess project development pipeline (permitted, under construction, announced)
- Compare national policy incentives (feed-in tariff, exploration grants, tax credits)
- Identify new entrant markets and barriers to first-commercial-scale deployment

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPACITY_HISTORY`, `COUNTRIES`, `DEVELOPERS`, `INVESTMENT_FLOWS`, `IRENA_GEOTHERMAL`, `KpiCard`, `TABS`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `COUNTRIES` | 17 | `installed`, `pipeline`, `resource`, `heatFlow`, `risk`, `sector`, `ipo`, `key` |
| `DEVELOPERS` | 11 | `country`, `mw`, `listed`, `market`, `focus` |
| `CAPACITY_HISTORY` | 12 | `installed`, `heat` |
| `INVESTMENT_FLOWS` | 7 | `investment`, `pipeline`, `growth` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `IRENA_GEOTHERMAL` | `(IRENA_RENEWABLE_CAPACITY_2023\|\|[]).filter(c=>c.geothermal_gw>0).map(c=>({` |
| `totalInstalled` | `COUNTRIES.reduce((s, c) => s + c.installed, 0);` |
| `totalPipeline` | `COUNTRIES.reduce((s, c) => s + c.pipeline,  0);` |
| `top3` | `[...COUNTRIES].sort((a, b) => b.installed - a.installed).slice(0, 3);` |

### 2.2 Backend endpoints
| Method | Path | Handler | Route file |
|---|---|---|---|
| POST | `/api/v1/geothermal/assess` | `assess_geothermal` | api/v1/routes/geothermal.py |
| GET | `/api/v1/geothermal/plant-types` | `list_plant_types` | api/v1/routes/geothermal.py |

## 3 · Data Sources & Provenance
**Provenance classes:** `computed`, `frontend-seed`, `real-db`

**Database tables:** `DB` *(shared)*, `db` *(shared)*, `dh_irena_lcoe` *(shared)*, `fastapi` *(shared)*, `pydantic` *(shared)*, `sqlalchemy` *(shared)*, `typing` *(shared)*
**Frontend seed datasets:** `CAPACITY_HISTORY`, `COUNTRIES`, `DEVELOPERS`, `INVESTMENT_FLOWS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| USA Installed Capacity | `Fleet GW = Σ(Operational Unit Capacity)` | IRENA 2023 | Largest geothermal fleet globally; concentrated in The Geysers and Salton Sea. |
| Global Direct-Use Thermal | `Direct-Use = Σ(Installed Thermal Application Capacity)` | IGA World Geothermal Congress 2020 | Heating, agri and industrial applications dwarf power generation in total energy terms. |
| Indonesia Installed Capacity | `Fleet GW = Σ(Operational Unit Capacity)` | IRENA 2023 | Second largest fleet; government target 7.2 GW by 2030 underpins strong pipeline. |
- **IRENA capacity database + ThinkGeoEnergy pipeline tracker** → Capacity share model → policy incentive comparison → **Geothermal market intelligence dashboard by country**

### 4.2 Traced backend call chains (lineage harness)

**GET /api/v1/geothermal/plant-types** — status `passed`, provenance ['computed'], source tables: —
Output: `{'type': 'object', 'keys': ['dry_steam', 'single_flash', 'double_flash', 'binary', 'egs'], 'n_keys': 5}`

**POST /api/v1/geothermal/assess** — status `passed`, provenance ['real-db'], source tables: `dh_irena_lcoe`
Output: `{'type': 'object', 'keys': ['project_name', 'plant_type', 'plant_type_label', 'total_capex_musd', 'lcoe_usd_mwh', 'irena_lcoe_range', 'lcoe_vs_irena', 'annual_generation_gwh', 'capacity_factor_pct', 'lifetime_generation_twh', 'plant_co2_intensity_gco2_kwh', 'annual_emissions_tco2', 'annual_avoided_e`

## 5 · Intermediate Transformation Logic
**Methodology:** Market Capacity Share
**Headline formula:** `Country Share = Country GW / Global Total GW × 100`

Simple capacity-share metric benchmarking national positions in global geothermal market.

**Standards:** ['IRENA Renewable Capacity Statistics 2023', 'ThinkGeoEnergy Top 10 Geothermal Countries']
**Reference documents:** IRENA — Renewable Capacity Statistics 2023; ThinkGeoEnergy — Top 10 Geothermal Countries 2023; IGA — World Geothermal Congress 2020 Country Updates

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **52** other module(s).

| Connected module | Shared via |
|---|---|
| `geothermal-lcoe-economics` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-project-finance` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-direct-use` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `geothermal-power-markets` | table:DB, table:dh_irena_lcoe, table:sqlalchemy |
| `reference-data-explorer` | table:dh_irena_lcoe, table:sqlalchemy |
| `carbon-market-intelligence` | table:sqlalchemy |
| `carbon-integrity-mrv-analytics` | table:sqlalchemy |
| `supply-chain-esg-hub` | table:sqlalchemy |
| `carbon-institutions-taxonomy` | table:sqlalchemy |
| `supply-chain-resilience` | table:sqlalchemy |

## 7 · Methodology Deep Dive

Geothermal Market Intelligence (EP-DV3) is a **descriptive market-tracker**: installed capacity,
project pipeline, developer landscape, capacity history and investment flows by country. The
"calculation engine" is a simple capacity-share metric; the value is in the curated, largely-real
dataset (partly wired to the platform's public IRENA seed). No guide↔code mismatch.

### 7.1 What the module computes

```js
IRENA_GEOTHERMAL = (IRENA_RENEWABLE_CAPACITY_2023||[]).filter(c => c.geothermal_gw > 0).map(...);
totalInstalled   = COUNTRIES.reduce((s,c) => s + c.installed, 0);   // sum MW
totalPipeline    = COUNTRIES.reduce((s,c) => s + c.pipeline, 0);
top3             = [...COUNTRIES].sort((a,b) => b.installed - a.installed).slice(0,3);
// implied capacity share: c.installed / totalInstalled × 100 (guide formula)
```

The only formula is **capacity share** = country GW / global total GW × 100. Everything else is
aggregation and ranking over the seed tables.

### 7.2 Parameterisation & data provenance

| Dataset | Rows | Key fields | Provenance |
|---|---|---|---|
| `COUNTRIES` | 16 | `installed` MW, `pipeline`, `resource` MW, `heatFlow` mW/m², `risk`, `ipo` | **Largely real** — USA 3,706 MW, Indonesia 2,356, Philippines 1,918, Turkey 1,682, Kenya 990 match IRENA/ThinkGeoEnergy 2023 |
| `IRENA_GEOTHERMAL` | derived | filtered from `IRENA_RENEWABLE_CAPACITY_2023` public seed | **Real** — platform reference-data layer |
| `DEVELOPERS` | 10 | `company, mw, listed, market, focus` | **Real** — Ormat (NYSE:ORA), KenGen, Pertamina (IDX:PGEO), Fervo, Eavor |
| `CAPACITY_HISTORY` | 12 | `installed, heat` 2000–2050 | Historical real to 2023; 2025–2050 are projections |
| `INVESTMENT_FLOWS` | 7 | `investment, pipeline, growth` | Synthetic/illustrative |

The installed-capacity and developer tables are among the most genuinely-sourced datasets in the
atlas — real projects (The Geysers, Olkaria, Larderello), real listed developers with tickers.

### 7.3 Calculation walkthrough

1. Sum `installed` and `pipeline` across 16 countries for headline totals.
2. Sort by installed → top-3 leaders + capacity-share bar chart.
3. `CAPACITY_HISTORY` drives the 2000→2050 growth line (power + direct-use heat GWth).
4. Developer table ranks operators by MW; IPO column flags listed vs private.
5. Direct-use thermal (~90–107 GWth) shown alongside power (installed MW) to contextualise scale.

### 7.4 Worked example (USA capacity share)

`installed_USA = 3,706 MW`. If `totalInstalled ≈ 15,900 MW` (sum of the 16 rows ≈ global 2023):

```
USA share = 3,706 / 15,900 × 100 ≈ 23.3%
```

USA holds ~23% of global installed geothermal capacity — the largest single fleet, matching IRENA's
2023 ranking (USA #1, Indonesia #2, Philippines #3).

### 7.5 Data provenance & limitations

- **Country installed/pipeline and developer tables are real** (IRENA/ThinkGeoEnergy 2023); the
  `IRENA_GEOTHERMAL` derivation reads the platform's public reference-data seed.
- `CAPACITY_HISTORY` beyond 2023 and `INVESTMENT_FLOWS` are projections/illustrative, not measured.
- The single `sr()` PRNG import is unused in the load-bearing aggregations (present for any chart
  jitter only).
- No probability-weighting of the pipeline (all pipeline MW counted equally regardless of FID stage) —
  the sibling *country-intelligence* module adds completion-probability weighting.

**Framework alignment:** *IRENA Renewable Capacity Statistics 2023* — installed-capacity figures and
the capacity-share metric follow IRENA's country accounting. *ThinkGeoEnergy Top-10 Geothermal
Countries* — ranking methodology. *IGA World Geothermal Congress* — the ~90 GWth direct-use figure.
The module is a market-intelligence tracker, so it *reports* rather than *models* these standards.

*(No §8 model specification required — the module is a descriptive tracker over largely-real market
data, not a risk/financial model producing synthetic quantities.)*

## 9 · Future Evolution

### 9.1 Evolution A — Fully live capacity data and computed pipeline dynamics (analytics ladder: rung 2 → 3)

**What.** §7 describes a descriptive market-tracker whose value is its curated, largely-real dataset — installed capacity by country (USA 3,706 MW, Indonesia 2,356, Philippines 1,918, Turkey 1,682, Kenya 990, all matching IRENA/ThinkGeoEnergy 2023), real listed developers with tickers (Ormat NYSE:ORA, Pertamina IDX:PGEO, Fervo, Eavor), and a partly-wired IRENA public seed (`IRENA_RENEWABLE_CAPACITY_2023`). The only formula is capacity share (`country GW/global × 100`); `INVESTMENT_FLOWS` is flagged synthetic/illustrative and `CAPACITY_HISTORY` 2025–2050 are projections. Evolution A moves it from descriptive to benchmarked: fully wire all country rows to the IRENA reference-data layer (not just the derived `IRENA_GEOTHERMAL` filter), add computed pipeline conversion rates (permitted → under-construction → operational) from historical pipeline data, and replace the synthetic investment flows with sourced figures where available.

**How.** (1) Read `COUNTRIES.installed`/`pipeline` from the IRENA/ThinkGeoEnergy tables in the refdata layer rather than hand-set literals, with provenance badges. (2) Compute pipeline conversion probabilities from the capacity-history series so the pipeline total is risk-weighted, not a raw sum. (3) Source `INVESTMENT_FLOWS` from published market reports or mark honestly as illustrative.

**Prerequisites.** Refresh cadence for the IRENA seed; historical pipeline snapshots to estimate conversion rates. **Acceptance:** every headline capacity figure carries a source badge and reconciles to the refdata table; the pipeline total is risk-weighted with a documented conversion model; no illustrative figure is presented as sourced.

### 9.2 Evolution B — Geothermal market-scan copilot (LLM tier 1 → 2)

**What.** A copilot for investors and market analysts: "which new-entrant geothermal markets (Chile, Ethiopia, Saudi Arabia) have the strongest resource-plus-policy setup, and who are the listed developers exposed to Kenya?" narrates the country capacity/policy tables and developer landscape from the atlas corpus, with tier-2 pulling live capacity shares and pipeline-conversion figures from the Evolution A endpoint.

**How.** Tier 1 is credible because §7 confirms the dataset is among the most genuinely-sourced in the atlas (real projects: The Geysers, Olkaria, Larderello; real tickers). The copilot cites real capacity figures and developers, flagging `INVESTMENT_FLOWS` as illustrative. Tier 2 tool-calls the capacity-share/pipeline endpoint so market-position rankings are computed. Cross-links to the LCOE and project-finance siblings come from the atlas interconnection graph.

**Prerequisites.** Corpus embedding; Evolution A for computed pipeline dynamics. **Acceptance:** every capacity and developer fact cited traces to the refdata table or curated dataset; the copilot labels investment-flow figures as illustrative until Evolution A sources them.