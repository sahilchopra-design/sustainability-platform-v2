# Cheap Data Sources to Amplify Platform Operations (<$100/mo)

Research completed 2026-07-04 across four target verticals: financial institutions
(all types), energy companies & utilities (all geographies), supply-chain use
cases, and carbon-credit lifecycle players. **Every price below was verified
against the provider's live pricing/license page on 2026-07-04** unless
explicitly flagged as unverified — data-vendor pricing changes constantly, so
re-verify before purchase. Sources already integrated (EODHD, Alpha Vantage,
Finnhub, yfinance, OWID, World Bank, SBTi, Verra, EU CBAM, CEDA) were excluded.

**Headline: the full recommended stack costs $29/month.** One paid subscription
(Open-Meteo Standard) serves two verticals; everything else in the top
recommendations is free with commercial-use-compatible licensing.

---

## 1 · Cross-vertical backbone (serve 2+ verticals — integrate first)

| Source | Price | License | Serves | Amplifies |
|---|---|---|---|---|
| **GLEIF LEI API** (api.gleif.org) | $0 | **CC0 — zero license risk** | FI + Supply Chain | 2.5M+ entity records + parent/child ownership graph → PCAF counterparty attribution, supplier entity resolution, CSDDD due-diligence chains, Scope 3 look-through. Trivial REST + bulk files, daily updates |
| **Open-Meteo Standard** | **$29/mo** (verified; Professional $99 adds historical/ensemble/climate APIs) | CC BY 4.0, commercial tier | FI + Energy | Global weather + downscaled CMIP6 projections per lat/lon → physical-hazard-map, physical-risk-pricing, catastrophe-modelling, parametric-insurance, generation forecasting for PPA/BESS dispatch |
| **Global Forest Watch API** | $0 (API key) | Integrated alerts CC BY 4.0; check per-dataset | Supply Chain + Carbon | GLAD/RADD deforestation alerts, tree-cover loss by custom geometry → eudr-engine, deforestation-risk, REDD+ MRV, buffer-pool reversal risk. Pairs with existing PostGIS |
| **GDELT** | $0 | Explicitly free for commercial use (citation required) | FI + ESG analytics | Global news event/tone, 15-min updates → ai-sentiment, controversy overlays, climate-litigation early warning, greenwashing flags |

## 2 · Financial institutions

| Source | Price | Key value | Modules amplified |
|---|---|---|---|
| **NGFS Scenarios** (IIASA/Zenodo, Phase 5) | $0 | The actual supervisory reference set (EBA/ECB exercises); adapted CC BY 4.0, commercial OK, no bulk redistribution of raw data | climate-stress-test, scenario-stress-test, climate-credit-integration, central-bank-climate, sovereign-climate-risk |
| **FRED API** | $0 | 800k+ series incl. **ICE BofA OAS indices — best free credit-spread proxy**; internal commercial use OK w/ attribution, don't resell raw feeds | climate-wacc, treasury-climate-risk, structured-credit-climate |
| **SEC EDGAR native APIs** | $0 | Public domain; XBRL companyfacts JSON + full-text search, real-time | carbon-adjusted-valuation, climate-ma-due-diligence, disclosure benchmarking |
| **IMF SDMX APIs** | $0 | WEO/IFS + Climate Change Indicators Dashboard | sovereign-esg-scorer, sovereign-climate-risk |
| **OpenFIGI** | $0 | ISIN/CUSIP↔FIGI mapping glue (confirm ToS for commercial) | PCAF/bond attribution plumbing |

## 3 · Energy & utilities

| Source | Price | Key value | Modules amplified |
|---|---|---|---|
| **EIA Open Data v2** | $0 | Public domain; hourly US demand/generation/prices, Henry Hub, retail rates, plant-level generation | capacity markets, ppa-analytics, energy-transition-lending, utility modules |
| **ENTSO-E Transparency** | $0 (token) | Day-ahead prices/load/generation/flows, ~35 European countries, hourly (use `entsoe-py`; XML API) | ppa-analytics, bess-project-finance spreads, RFNBO hydrogen temporal-correlation |
| **Ember API** | $0 | CC BY 4.0; global generation/capacity/emissions (200+ geos) + EU wholesale prices + **EU/UK ETS carbon prices, daily** | grid EF trajectories, carbon-price-ets, country power-mix baselines |
| **UK Carbon Intensity API** (NESO) | $0, no key | CC BY 4.0 commercial-OK; GB + 14 regions, 30-min, 96h forecast | grid-emission-factor modules, 24/7 CFE matching |
| **Global Energy Monitor trackers** | $0 | CC BY 4.0 explicitly commercial-OK; unit-level global plant universe (supersedes stale 2021 WRI GPPD) | stranded-asset analytics, transition-lending screening, CCUS/H2 pipelines |
| **NREL APIs + NASA POWER** | $0 | NSRDB/Wind Toolkit/PVWatts/ATB/URDB (US-centric); NASA POWER = global irradiance, no key | LCOE/LCOS calculators, solar/wind yield in project finance |
| Also: AEMO NEMWeb (AU), LBNL Queued Up (interconnection queues), ICAP price explorer (see license risk §6) | $0 | | |

## 4 · Supply chain

| Source | Price | Key value | Modules amplified |
|---|---|---|---|
| **US gov compliance bundle** (UFLPA entity list + OFAC/CSL API + DOL ILAB goods list) | $0 | Public domain — instant UFLPA/LkSG/CSDDD screening credibility | forced-labour DD, supplier screening, sanctions overlay |
| **UN Comtrade free tier + CEPII BACI bulk** | $0 | HS-code bilateral trade flows (BACI = no quota, ~2yr lag); don't resell raw Comtrade data | cbam-compliance, critical-minerals sourcing, supply-chain-map |
| **aisstream.io** | $0 | Real-time global vessel AIS websocket — disruption/chokepoint signal competitors lack at this price. **License murky — internal analytics only, don't redisplay raw feeds** | logistics emissions, port-congestion risk |
| **GLEC framework (free, registration) + EPA SmartWay (public domain)** | $0 | Self-build ISO 14083 freight-emission factors — better long-term than SeaRates' $19–49/mo web-only calculators | logistics-emissions, scope3-engine transport |
| **OpenOwnership + RMI smelter lists + Walk Free GSI** | $0 | UBO screening, conflict minerals, country slavery-risk | csddd-engine, conflict-minerals |

## 5 · Carbon credit lifecycle

| Source | Price | Key value | Modules amplified |
|---|---|---|---|
| **CarbonPlan OffsetsDB** | $0 | 7 registries (Verra, GS, ACR, ART, CAR, Isometric, Cercarbono), normalized schema, **updated daily** — instantly fills the registry gap beyond Verra. Review data-access terms before redistribution | cc-registry-hub live view, cc-portfolio-analytics, carbon-markets-intel |
| **Berkeley VROD** | $0 | CC BY 4.0 — cleanest license for commercial redistribution; 6 registries, updated ~quarterly. Audit-grade cross-check to OffsetsDB | same as above + buyer/retiree benchmarking |
| **BeZero public ratings** | $0 | Headline integrity ratings, 18,000+ projects, 7 registries. **Display-only w/ attribution — don't redistribute as own data** | cc-integrity-scoring (ICVCM CCP), VCMI claims support |
| **Ecosystem Marketplace dashboard** | $0 | Only free OTC *price* signal in the VCM (15k+ transactions). No confirmed API — manual/scrape refresh. Check overlap w/ existing EM seed | carbon-credit-pricing, carbon-forward-curve anchors |
| **ICAO CORSIA eligible-units list + UNEP Article 6 Pipeline** | $0 | Free regulatory eligibility data with zero competition | CORSIA tracking, Article 6 modules |
| **Copernicus Data Space** | $0 free tier (10k Sentinel Hub requests/mo) | EU open license incl. commercial; replaces paid Sentinel Hub (no self-serve <$100 tier exists anymore) | MRV engines, REDD+/ARR baseline verification |

## 6 · ⚠️ License-risk register (read before productizing)

1. **EM-DAT — already seeded in the platform, but licensed NON-COMMERCIAL.**
   Productizing for paying customers requires a commercial license from CRED.
   This is the most urgent item since the data is already in use.
2. **ICAP allowance prices** — free download but non-commercial without written
   permission. Get permission or defer (Ember covers EU/UK ETS daily anyway).
3. **Electricity Maps trap** — free tier is non-commercial, single-zone; real
   pricing is €4,500–6,000/yr *per signal per country*. Use NESO + Ember +
   self-computed factors from ENTSO-E/EIA generation mix instead.
4. **Ratings data (BeZero, Calyx public tiers)** — display with attribution;
   don't ingest into own scoring as if it were licensed input.
5. **aisstream.io** — community-fed AIS with unclear upstream rights; fine for
   internal/derived indicators, not raw redisplay.
6. **Open Supply Hub free tier** — CC-BY-SA share-alike would contaminate
   derived datasets; use for seeding only, carefully.
7. **NGFS/Comtrade** — commercial analytics fine; bulk redistribution of raw
   data prohibited.
8. **Unverified (pricing pages blocked/gated 2026-07-04):** ECB/BIS terms text,
   FMP, GridStatus paid tier, WattTime paid, sec-api.io Business tier need,
   AlliedOffsets, Xpansiv CBL, UN Comtrade exact free-tier quota, DOL ILAB API.
   Verify at signup; don't assume.

## 7 · Integration roadmap (suggested order)

| Phase | Sources | Cost | Why first |
|---|---|---|---|
| 1 | GLEIF, NGFS, FRED, EIA, Ember, CarbonPlan OffsetsDB | $0 | Highest module coverage per integration-hour; all trivial-to-low effort; replaces the largest amount of seeded/illustrative data with real data |
| 2 | GFW API, US-gov compliance bundle, ENTSO-E, UK NESO, GDELT | $0 | Regulatory-driver data (EUDR, UFLPA) + European energy depth |
| 3 | **Open-Meteo Standard ($29/mo)** — the only purchase | $29/mo | Unlocks commercial physical-hazard + generation-forecast weather globally |
| 4 | Berkeley VROD, BeZero, EM dashboard, CORSIA/A6, GEM trackers, NREL/NASA POWER, Comtrade/BACI, GLEC/SmartWay | $0 | Bulk/periodic ingests; batch into the existing `reference_data` layer + 37-seed-file pattern |
| — | Resolve EM-DAT license; get ICAP permission or defer | — | Compliance before revenue |

All ingestion should follow the existing reference-data-layer pattern
(`/api/v1/refdata`, generic reference_data tables, `useReferenceData` hook) —
see memory/project_reference_data_layer.md context and existing seed scripts.

---

# PART 2 — Supplementary & Complementary Sources by Analytical Capability
*(researched 2026-07-04; same verification discipline. SUPPLEMENTARY = deepens
data behind existing analytics; COMPLEMENTARY = unlocks methods currently
impossible on the platform.)*

## 8 · Physical risk & nature (93 modules)
**Complementary:** Open building footprints (Google/MS/Overture, free, ODbL/CC-BY,
~2.5B buildings) → per-building asset-level exposure replacing region proxies —
the single biggest analytical leap available. GBIF species occurrences (free
keyless API; filter CC0/CC-BY records) → site-level TNFD biodiversity scoring.
FEMA NFHL + OpenFEMA NFIP claims (free, ~2M real claims) → empirical loss-curve
calibration & validation (US).
**Supplementary:** Copernicus CDS (license became CC-BY commercial-OK July 2025;
CMIP6/CORDEX ensembles + ERA5 to 1940) → uncertainty bands beyond Open-Meteo.
JRC GHSL (CC-BY) → global exposure weighting. NASA FIRMS (fire), USGS quakes,
GLO-30 DEM.
**⚠️ Blockers:** WDPA/Protected Planet = NON-COMMERCIAL + no redistribution —
license from UNEP-WCMC required before shipping protected-area analytics.
ENCORE = CC BY-SA (share-alike inherits). IBAT & First Street: enterprise-only,
over budget.

## 9 · Sovereign & governance (the two weakest clusters: 15%/14% real coverage)
**Complementary:** UCDP conflict events (free, CC-BY, monthly candidate events,
village-level geocoding) → real-time country-risk nowcasting replacing annual
index lookups; ACLED now sales-gated commercial — use UCDP instead. Climate
Policy Radar open-data bundle (CC-BY: world climate laws + NDC corpus + now
powers the Sabin litigation DB) → computed policy-stringency scores + litigation
feeds. ILOSTAT/Eurostat/OECD/UN-SDG APIs → converts the social cluster
(workplace-safety, DEI, living-wage, just-transition) from seeded to real.
**Supplementary:** V-Dem (500+ governance indicators, panel to 1789 — enables
trend/volatility methods; license likely CC BY-SA, confirm), WGI, TI CPI
(CC BY-ND — inputs OK, no modified republication), Fragile States Index (terms
unstated — confirm), WJP (use the World Bank Data360 mirror for clean license).
**⚠️ Blockers:** Freedom House = commercial permission required. WageIndicator
paid tiers €14k+/yr (free regional estimates only).

## 10 · Corporate transition & markets
**Complementary:** **Climate TRACE (free, CC-BY, 2.77M emission sources,
ownership-attributed, monthly)** — the biggest unlock in Part 2: asset-level
PCAF attribution (DQ score 2-3 vs proxy 5) AND independent measured-vs-stated
target verification for net-zero-credibility — no disclosure-based dataset can
do this. Google Patents on BigQuery (CC-BY; CPC Y02 climate-tech classes;
free 1TB/mo query tier) → tech-transition alpha signals. Sabin Climate
Litigation DB (free, 3,000+ cases w/ metadata download) → the only structured
input for climate-litigation-risk scoring.
**Supplementary:** TPI Management Quality/Carbon Performance (free but
internal-use license — email TPI before productizing derived analytics),
Net Zero Tracker (4,190 entities incl. offset-reliance flags; license
unstated — confirm), SBTi Trend Tracker reports, Wikirate (CC-BY, uneven
quality — corroboration layer only).
**⚠️ Blockers:** CDP corporate data now license-fee-gated (portal = cities only).
EXIOBASE non-commercial (negotiate or stick with CEDA). OpenCorporates ~$235/mo;
UK Companies House API is the free private-company alternative.

## 11 · Real estate & infrastructure
**Complementary:** UK EPC Register (free, OGL v3, address-level England+Wales)
→ real mortgage-book energy scoring + empirical CRREM baselines; joined with
HM Land Registry Price Paid (free, OGL, commercial-OK) → green-premium hedonic
regression, a genuinely new valuation method. NL EP-Online + Ireland SEAI BER
→ EU-wide EPC coverage. OpenEI URDB (CC0) → real US utility tariff structures.
Overture/OSM buildings → portfolio exposure footprints.
**Supplementary:** EU Building Stock Observatory (free xlsx), NYC LL84-style
city benchmarking data, FRED CRE indices.
**⚠️ Blockers:** EC3 embodied-carbon API commercial = $5k/yr (free tier
non-commercial); **ICE database free version is educational-only with
commercial use prohibited after 2026-09-30 — do not integrate**; use Ökobaudat
(free, German government) instead. EMMA/MSRB bulk = $45k/yr (manual lookup
only). No credible <$100 CoStar/MSCI-RE substitute exists.

## 12 · Combined top 10 (Parts 1+2) by capability-per-dollar
1. Climate TRACE (asset-level attribution + target verification)
2. Open building footprints (asset-level physical exposure)
3. GLEIF LEI (entity/ownership spine, CC0)
4. NGFS Phase 5 scenarios (supervisory-grade stress paths)
5. UK EPC + Land Registry join (mortgage EE scoring + green-premium hedonics)
6. UCDP + Climate Policy Radar (sovereign nowcasting + policy/litigation)
7. CarbonPlan OffsetsDB / Berkeley VROD (7-registry VCM coverage)
8. GBIF (site-level TNFD scoring)
9. EIA + ENTSO-E + Ember (global power/carbon price backbone)
10. Open-Meteo Standard — the only paid item ($29/mo)

**Total for everything recommended across both parts: $29/month.**
