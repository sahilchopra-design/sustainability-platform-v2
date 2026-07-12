# Next 15 Use Cases — from Research + Platform Intelligence (2026-07-04)

Derived from two inputs: (1) `docs/PLATFORM_INTELLIGENCE.md` §5 strategic opportunities +
coverage-gap analysis, (2) `docs/DATA_SOURCES_AMPLIFICATION.md` verified free/cheap data sources.
Selection rule: each use case must be buildable NOW — either by composing engines that are already
wired and verified, or by consuming a free data source with a keyless live API (or a small real
seeded extract where only bulk download exists). No fabricated data; Live/Demo badging throughout.

| # | Module (route) | What it does | Powered by |
|---|---|---|---|
| 1 | `/climate-underwriting-workbench` | One counterparty/asset → Solvency II CAT/SCR + physical peril pricing + PCAF financed emissions in a single underwriting view | insurance_climate_risk + physical_risk_pricing + PCAF engines (all wired) — PLATFORM_INTELLIGENCE opp #1 |
| 2 | `/sovereign-corporate-bridge` | Corporate holding → sovereign-of-domicile climate risk joined view (holding-weighted sovereign exposure) | sovereign_climate_risk_engine + pcaf_sovereign (both wired) — opp #2 |
| 3 | `/eu-compliance-cockpit` | Sequential walkthrough: Taxonomy Art.3 → EUDR Art.9 → ETS2 readiness → EuGB 85/15 → ESRS XBRL export | eu_taxonomy, eudr, eu_ets, eu_gbs, xbrl_export engines (all wired/fixed) — opp #3 |
| 4 | `/asset-exposure-explorer` | Per-building/asset physical exposure: footprint area → replacement value proxy → hazard intersection | Open building footprints (real seeded city extract) + physical_risk_pricing engine |
| 5 | `/flood-loss-calibrator` | Empirical US flood loss curves from real NFIP claims; validate modelled EP curves against observed | OpenFEMA NFIP claims API (free, keyless, live) |
| 6 | `/site-biodiversity-screener` | Lat/lon site → species richness, threatened-species proximity, TNFD dependency inputs | GBIF occurrence API (free, keyless, live; CC0/CC-BY filter) |
| 7 | `/facility-emissions-attribution` | Facility-level emissions per owner/sector/country → asset-level attribution beyond company disclosures | Climate TRACE (free; API or real seeded extract — agent verifies) |
| 8 | `/vcm-cross-registry-tracker` | Issuance/retirement analytics across 7 registries (beyond Verra) | CarbonPlan OffsetsDB / Berkeley VROD (free; API if available, else real seeded extract) |
| 9 | `/grid-carbon-intelligence` | Live GB grid carbon intensity + 96h forecast + regional breakdown + 24/7 CFE matching calculator | UK NESO Carbon Intensity API (free, keyless, live, CC-BY) |
| 10 | `/supervisory-scenario-runner` | Real NGFS Phase 5 paths (carbon price, GDP, energy mix per scenario/region) driving stress calcs | NGFS Scenario Explorer real seeded extract (key variables × scenarios × regions) |
| 11 | `/counterparty-ownership-graph` | LEI lookup → parent/child ownership tree → PCAF attribution rollup across the group | GLEIF API (free, keyless, live, CC0) |
| 12 | `/sanctions-screening-desk` | Supplier/counterparty name → live UFLPA + Consolidated Screening List check with audit log | trade.gov CSL API (free, live) + UFLPA entity list (seeded from public list) |
| 13 | `/credit-spread-climate-monitor` | Sector OAS credit spreads vs transition-risk scores — spread-implied transition pricing | FRED ICE BofA OAS (free API, needs key → Live/Demo fallback) + platform transition scores |
| 14 | `/climate-litigation-tracker` | Real climate litigation cases: jurisdiction/defendant-sector/legal-theory analytics + exposure scoring | Sabin Center Climate Case Chart (real seeded case extract, attributed) |
| 15 | `/cbam-trade-exposure-mapper` | HS-code bilateral trade flows → CBAM-covered import exposure by origin country intensity | UN Comtrade/CEPII BACI (real seeded extract of CBAM-sector flows) + existing CBAM engine |

Build conventions: local `T` theme object per page (platform standard), Live/Demo badging per the
AIGovernancePage convention wherever an external API or platform engine is called, honest
"seeded real extract (source, date)" labeling where bulk data was sampled, no `sr()` PRNG as data.
Routes wired centrally into App.js (single writer) under a new nav group, wrapped in ProtectedRoute
like all other module routes (RBAC-compatible). New backend routes (where needed) follow the
existing api/v1/routes pattern and are exempt-listed only if genuinely public reference data.
