# Physical Climate Risk Datapoints — Reference Data Sources

Research completed 2026-07-05, organized by hazard category. Follows the same
verification discipline as docs/DATA_SOURCES_AMPLIFICATION.md: every source
below marked **[verified]** was hit live from this environment on 2026-07-05;
sources marked **[not independently verified]** are well-established public
data portals I did not get a live response from in this session (sandbox
connectivity, not necessarily a real access problem) — re-check before
building against them. This doc identifies sources; none of these are wired
in yet (separate from the 6-source wave already in flight under Task #21).

Excludes sources already covered elsewhere: NASA POWER, Open-Meteo/CMIP6,
Copernicus CDS generically, OpenFEMA/FEMA NFIP, GBIF — see
docs/DATA_SOURCES_AMPLIFICATION.md and the in-flight wave-1 build.

---

## 1 · Flood (fluvial / pluvial / coastal)

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **FEMA NFHL** (National Flood Hazard Layer) | $0 | Public domain | Complements the already-integrated OpenFEMA NFIP claims — NFHL is the *hazard map* (flood zones/BFEs), claims are the *loss history*; together they let you compare modeled zone against observed loss | flood-loss-calibrator, physical-risk-pricing |
| **Copernicus EFAS** (European Flood Awareness System) | $0, registration required | Copernicus terms (post-2025 generally CC-BY commercial-OK, confirm per-dataset) — **[verified: 301 redirect to portal, registration gate confirmed]** | Real-time European river discharge + flood forecasting, 10-day lead | physical-risk-pricing (EU exposure), climate-underwriting-workbench |
| **Copernicus GloFAS** (Global Flood Awareness System) | $0, registration required | Same as EFAS | Global (not just Europe) river flood forecasting/reanalysis, complements EFAS | Same, global scope |
| **WRI Aqueduct Floods** | $0 | CC-BY (WRI standard license) — **[not independently verified live this session; well-established WRI dataset]** | Global riverine + coastal flood risk layers at 90m resolution, by return period, with and without climate change scenarios | physical-risk-pricing, asset-exposure-explorer |

## 2 · Wildfire

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **NASA FIRMS** (Fire Information for Resource Management System) | $0, free MAP_KEY (instant signup) | NASA public-domain | **[verified: endpoint real — DEMO_KEY returned 400/rejected as expected, confirming the API itself is live and requires a real free key]**. Real-time (near-real-time, hours-old) satellite fire detections globally, VIIRS/MODIS | A new capability — no existing wildfire module found; natural fit is a new panel on climate-underwriting-workbench or asset-exposure-explorer for wildfire-exposed assets |
| **Global Wildfire Information System (GWIS)** — EC Joint Research Centre | $0 | CC-BY (JRC/Copernicus standard) — **[verified: 200]** | Seasonal fire-danger indices, burned-area statistics, historical trends by country/region | Same fit as above; GWIS gives the *statistical/seasonal* view, FIRMS gives *real-time detections* |

## 3 · Tropical cyclone / hurricane

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **NOAA IBTrACS** (International Best Track Archive for Climate Stewardship) | $0 | Public domain (US government work) — **[verified: 200, real bulk CSV]** | The definitive global historical tropical-cyclone track database (all basins, back to 1842 for some basins), updated regularly | catastrophe-modelling, cat-bond-ils, parametric-insurance, reinsurance-climate |
| **NOAA HURDAT2** | $0 | Public domain — **[verified: 200]** | Atlantic + East Pacific basin best-track data specifically (subset focus, sometimes preferred for its longer clean Atlantic record) | Same as above, Atlantic-basin-specific work |

## 4 · Earthquake

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **USGS Earthquake Catalog (FDSN)** | $0, keyless | Public domain — **[verified: 200]** | Real-time + full historical global earthquake catalog, queryable by magnitude/region/date, GeoJSON | A new capability — no existing seismic-risk module found; natural fit as a peril option alongside flood/wind in physical_risk_pricing.py's peril list, or a small addition to catastrophe-modelling |

## 5 · Drought / water stress

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **WRI Aqueduct Water Risk Atlas** | $0 | CC-BY — **[not independently verified live this session]** | Baseline water stress, drought risk, seasonal variability by watershed, global | water-risk, water-risk-analytics, water-agriculture-risk |
| **Copernicus European Drought Observatory (EDO)** | $0 | Copernicus terms | European-focused drought indices (SPI, soil moisture anomaly) | Same, EU-specific supplement |

## 6 · Sea level rise / coastal

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **NASA Sea Level Change Portal** | $0 | NASA public-domain | Satellite altimetry sea-level trends + IPCC AR6 sea-level-rise projections by scenario/location | coastal-flood-risk-finance, coastal-resilience-finance |
| **NOAA Sea Level Trends** (tide-gauge based) | $0 | Public domain | Station-level historical tide-gauge trends, complements the satellite record with longer local history | Same |

## 7 · Population & exposure weighting

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **NASA SEDAC** (Socioeconomic Data and Applications Center, incl. GPWv4 gridded population) | $0 | Mostly public domain/CC — **[not independently verified live this session; per-dataset license, confirm before shipping]** | Gridded global population + socioeconomic exposure layers, standard input for translating a hazard map into an exposure/loss estimate | Cross-cutting — feeds any physical-risk module needing population-weighted exposure (physical-risk-pricing, climate-migration-risk, heat-mortality-risk) |
| **WorldPop** | $0 | CC-BY 4.0 | Alternative/complementary high-resolution (100m) gridded population, often more current than SEDAC's census-based layers | Same |

## 8 · Multi-hazard climate projections (beyond CMIP6/Open-Meteo already in flight)

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **NASA NEX-GDDP-CMIP6** | $0 | NASA public-domain, hosted on public cloud (AWS/GCS Open Data) — **[verified: 200]** | Bias-corrected, statistically downscaled (25km) CMIP6 projections for temperature/precipitation — a well-known free alternative/complement to Open-Meteo's paid climate-projection tier if that turns out to be behind Open-Meteo's paywall (the parallel Open-Meteo agent is checking this boundary) | physical-risk-pricing, climate-underwriting-workbench, climate-cvar-suite |

## 9 · Terrain / elevation (flood & coastal modeling input)

| Source | Price | License | Status | Feeds |
|---|---|---|---|---|
| **Copernicus GLO-30 DEM** | $0 | CC-BY (confirm current terms) | Global 30m digital elevation model — needed for any serious local flood/coastal inundation modeling | physical-risk-pricing, coastal-flood-risk-finance |
| **NASA SRTM** | $0 | Public domain | Older (2000) but well-established global DEM, useful cross-check/fallback to GLO-30 | Same |

---

## Summary table — priority order if wired in

| Priority | Source | Why first |
|---|---|---|
| 1 | USGS Earthquake catalog | Fully keyless, instantly live, zero license risk, opens an entirely new peril (seismic) the platform has no coverage of at all |
| 2 | NOAA IBTrACS + HURDAT2 | Fully keyless, public domain, directly feeds existing cat-bond-ils/parametric-insurance/reinsurance-climate modules that currently have no real historical-track data source |
| 3 | NASA FIRMS + GWIS | Free key (FIRMS) + keyless (GWIS), opens wildfire as a new peril |
| 4 | NASA SEDAC / WorldPop | Cross-cutting exposure-weighting layer that makes every other hazard source more useful (hazard × population = actual exposure, not just hazard alone) |
| 5 | Copernicus EFAS/GloFAS, WRI Aqueduct (floods + water stress) | Registration-gated but high value; natural extension of the flood/water-stress modules already on the platform |
| 6 | Sea-level (NASA/NOAA), GLO-30/SRTM DEM | Deepen the existing coastal modules once the above are in place |

**None of this is wired in yet** — this is the identification/verification pass. Say
the word and I'll prioritize a build wave the same way as the current one (Task #21),
picking the highest-value subset and launching flat build agents against named
existing consumer modules.
