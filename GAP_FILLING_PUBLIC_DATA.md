# Gap-Filling with Public Data — A2 Intelligence Platform

> **Document Type:** Data Strategy / Public Source Catalog
> **Purpose:** Map identified platform gaps to freely available / publicly accessible data sources; distinguish what can be pre-loaded vs. what requires internal data; define a lean analytical team data strategy
> **Platform:** A2 Intelligence — Risk Analytics Platform
> **Date:** 2026-03-03
> **Source Catalog:** 106 rows from `complete_free_sources_with_quality.csv` + additional sources from research

---

## Executive Summary

Of the 14 critical platform gaps identified in the DBS user story and the 14 gaps in the Energy Expert user story, **8 gaps are fully addressable with free public data**, **11 are partially addressable** (public data supplements but does not replace internal data), and **9 gaps require internal proprietary data** that cannot be substituted. The platform should pre-load all fully-public datasets at startup and expose a structured Data Hub for internal data upload.

**Strategic principle:** The platform's value is not in finding data that analysts do not have access to — it is in integrating, computing, and disclosing using data the team already holds (internally) plus the best-available public benchmarks (externally). Keeping the analytical team lean means minimising the data procurement budget to near-zero for everything that is publicly available.

**Commercial licensing alert:** Five key sources in common use carry licensing constraints that restrict commercial deployment. These are flagged throughout this document. Free alternatives are identified for each.

---

## 1. Gap-to-Source Mapping Matrix

### 1.1 Portfolio Analytics Engine (Currently Mocked)

**Gap:** The entire Portfolio Analytics Engine uses `import random` and hardcoded seed data. All WACI, ITR, and PAI indicators are fake.

**Fillability: PARTIALLY PUBLIC**

| Data Needed | Free Public Source | URL | Quality | Commercial Use | Format |
|-------------|-------------------|-----|---------|----------------|--------|
| Company Scope 1/2/3 emissions | CDP Open Data | cdp.net/en | Very High | Free download | CSV/XLSX |
| Company Scope 1/2/3 emissions (alternative) | Climate TRACE | climatetrace.org | Very High | CC BY 4.0 — commercial safe | JSON/CSV |
| Company Scope 1/2/3 (US listed companies) | SEC EDGAR XBRL API | data.sec.gov | Very High | Public domain | JSON/REST |
| ESG scores (web lookup) | Upright Platform | uprightproject.com | High | Free up to 10K companies | API |
| ESG scores (web lookup) | Sustainalytics | sustainalytics.com | High | Web only — no bulk API on free | Web |
| Sector emission intensities (benchmark) | IEA (non-commercial) | iea.org | Very High | Non-commercial ONLY | Excel |
| Sector emission intensities (commercial alt.) | Our World in Data | ourworldindata.org | Very High | CC BY 4.0 — commercial safe | CSV/GitHub |
| WACI benchmark data | World Bank ESG DataBank | databank.worldbank.org | Very High | Open — no restrictions | CSV/API |
| ITR glidepaths | NGFS Climate Impact Explorer | climate-impact-explorer.climateanalytics.org | Very High | Free & open | API |

**What cannot be filled with public data:** Loan-level portfolio composition (which borrowers, what loan amounts, what sector classification). This is held in the lender's core banking system. Without this, the WACI and ITR calculations are not attributable to the actual lending portfolio — they remain estimates based on sector averages.

**Recommended approach:**
1. Pre-load Climate TRACE asset-level emissions data (commercial-safe) as default Scope 1 estimates for entities where internal data is absent
2. Pre-load NGFS glidepaths as the ITR reference curves
3. Provide a structured Data Hub CSV upload for the loan-level portfolio data (outstanding balance, borrower ID, sector, PCAF DQS) — this activates real WACI/ITR computation
4. Use SEC EDGAR XBRL API for any US-listed counterparties to auto-populate financials (EVIC denominator for PCAF attribution factor)

---

### 1.2 PCAF Data Quality Score (DQS)

**Gap:** No PCAF DQS field or aggregation logic in the platform.

**Fillability: PARTIALLY PUBLIC**

| Data Needed | Free Public Source | Quality | Notes |
|-------------|-------------------|---------|-------|
| DQS 1: Primary data (directly measured) | Developer / borrower upload | N/A | Internal only |
| DQS 2: Verified annual report data | CDP disclosures | Very High | Downloadable; annual |
| DQS 2: Verified annual report data | Company sustainability reports | High | SustainabilityReports.com — 400K PDFs |
| DQS 3: Unverified annual reports | Company IR pages (webscraping) | Medium | Requires NLP extraction |
| DQS 4: EEIO / sector averages | IEA (non-commercial) / OWID (commercial) | High | Sector-level fallback |
| DQS 5: Modelled estimates | Platform's own scenario model output | N/A | In-platform computation |

**What cannot be filled:** DQS 1 (project-specific measured data) always requires the borrower's own metered data. For power plants, this is the utility metering system. For industrial borrowers, this is their internal GHG accounting system.

**Recommended approach:** Implement DQS as a metadata field per PCAF counterparty record. Pre-fill DQS 4 using OWID/IEA sector averages where no other data exists. Allow manual override to DQS 1/2 when verified data is uploaded. Display aggregate DQS distribution (pie chart) in the PCAF Panel dashboard.

---

### 1.3 NZBA Glidepath Tracker

**Gap:** No dedicated tool comparing actual sectoral trajectory to IEA NZE 2050 glidepath.

**Fillability: FULLY PUBLIC**

| Data Needed | Free Public Source | URL | Quality | Format |
|-------------|-------------------|-----|---------|--------|
| IEA NZE sector glidepaths (non-commercial) | IEA Data Explorer | iea.org | Very High | Excel (free, non-commercial) |
| IEA NZE sector glidepaths (commercial alt.) | NGFS Scenarios Portal | ngfs.net | Very High | pyam/CSV — open |
| IEA NZE sector glidepaths (commercial alt.) | Our World in Data | ourworldindata.org | Very High | CC BY 4.0 — commercial safe |
| Physical climate glidepath (temperature alignment) | NGFS Climate Impact Explorer | climate-impact-explorer.climateanalytics.org | Very High | Free API |
| CRREM real estate glidepaths | CRREM.eu | crrem.eu | High | Excel (free, no redistribution) |

**What cannot be filled:** Actual portfolio trajectory data (the actual side of "actual vs. target"). This requires the lender's internal PCAF financed emissions history.

**Recommended approach:** Pre-load all IEA NZE glidepath curves at platform startup (use NGFS Portal as commercial-safe alternative). Implement `/ngfs/glidepaths` as a reference data endpoint. Pre-load CRREM pathways for key SEA/Asian geographies (Singapore, Hong Kong, China, India, Indonesia) as static reference curves in the Real Estate module.

---

### 1.4 Physical Risk Assessment (PostGIS Not Implemented)

**Gap:** Physical risk uses lat/lng floats; no spatial queries for flood zones, cyclone tracks, sea-level rise contours.

**Fillability: PARTIALLY PUBLIC**

| Data Needed | Free Public Source | URL | Quality | Commercial Use |
|-------------|-------------------|-----|---------|----------------|
| Protected area boundaries | WDPA (World Database on Protected Areas) | protectedplanet.net | Very High | CC BY; redistribution allowed |
| Flood hazard maps (global) | Global Flood Database | globalflooddatabase.org | High | Free academic/non-commercial |
| Deforestation / land cover change | Global Forest Watch | globalforestwatch.org | Very High | CC BY 4.0 — commercial safe |
| Biodiversity / nature risk | WWF Risk Filter Suite | riskfilter.org | High | Free for non-commercial; commercial: contact WWF |
| Physical climate risk projections | NGFS Climate Impact Explorer | climate-impact-explorer.climateanalytics.org | Very High | Free & open |
| Country-level conflict / political risk | ACLED | acleddata.com | Very High | Free (registration); commercial use allowed |
| Sea level rise projections | IPCC AR6 Data | ipcc-data.org | Very High | Open access |

**What cannot be filled with free public data:** Asset-level physical risk scores with insurance-grade precision. Commercial providers (Jupiter, 427 Market Technology, Moody's RMS) hold proprietary hazard models that are far more granular than free sources. For lender-grade physical risk assessment, a commercial provider is necessary for production deployment.

**Recommended approach (lean team strategy):**
1. Implement PostGIS immediately (this is a platform architecture fix, not a data issue)
2. Pre-load WDPA and GFW as the biodiversity/deforestation layers (commercial-safe)
3. Use NGFS Climate Impact Explorer as the physical risk glidepath (country-level; acceptable for portfolio-level assessment)
4. WWF Risk Filter Suite — use for nature risk (TNFD LEAP); note: contact WWF for commercial deployment rights
5. Reserve commercial physical risk vendor for client-facing lender-grade assessments only (not for all portfolio-level screening)

---

### 1.5 Stranded Assets — Coal Plant Database

**Gap:** Power Plant and Stranded Assets modules have no pre-loaded coal plant fleet data.

**Fillability: FULLY PUBLIC**

| Data Needed | Free Public Source | URL | Quality | Format |
|-------------|-------------------|-----|---------|--------|
| Global coal plant tracker (capacity, age, technology, ownership, status) | Global Energy Monitor | globalenergymonitor.org | Very High | CSV/Shapefile — open |
| SEA coal plant retirement pipeline | Global Energy Monitor | globalenergymonitor.org | Very High | Updated quarterly |
| Coal plant emissions intensity | Climate TRACE (coal power sector) | climatetrace.org | Very High | CC BY 4.0 — commercial safe |
| Coal mine tracker | Global Energy Monitor | globalenergymonitor.org | Very High | Open |
| Fossil fuel subsidy data | OECD/IEA fossil fuel subsidies | OWID / oecd.org | High | CSV — open |

**Recommended approach:** Pre-load the Global Energy Monitor Global Coal Plant Tracker (GCPT) directly into the Stranded Assets module and Power Plant Assessment module at platform startup. The GCPT contains ~3,000 coal plants globally with capacity, commissioning year, operator, country, status, and annual CO₂ output. This is the single highest-impact pre-loading action available for zero cost.

---

### 1.6 Regulatory — MAS-Specific Module Missing

**Gap:** No MAS Environmental Risk Management Guidelines, MAS Notice 637, or SAT module.

**Fillability: FULLY PUBLIC**

| Data Needed | Free Public Source | URL |
|-------------|-------------------|-----|
| MAS Environmental Risk Management Guidelines | MAS.gov.sg | mas.gov.sg/regulation |
| Singapore-Asia Taxonomy (SAT) full text | MAS.gov.sg | mas.gov.sg/development/sustainable-finance |
| MAS SLGS grant scheme criteria | MAS.gov.sg | mas.gov.sg/development/sustainable-finance |
| Singapore Green Finance Centre reports | SGFC.sg | sgfc.sg |
| MAS Pillar 2 climate risk guidance | MAS.gov.sg | mas.gov.sg |
| ASEAN Taxonomy v2 | ACMF.asean.org | asean.org |

**All MAS regulatory text is free and publicly available.** This gap is entirely a product development issue, not a data availability issue. The platform needs to ingest these documents and build the assessment workflows — the source material costs nothing.

---

### 1.7 Shipping and Steel Sector Modules Missing

**Gap:** No CII/AER/EEXI calculation for shipping; no BF-BOF/EAF production route module for steel.

**Fillability: PARTIALLY PUBLIC**

**Shipping:**
| Data Needed | Free Public Source | Quality |
|-------------|-------------------|---------|
| IMO CII rating scheme methodology | IMO.org | Very High — fully public |
| Shipping fleet data (vessel-level AER/CII) | IMO GISIS database (partial) | Medium — aggregate; vessel-level is IHS Markit (paid) |
| Bunker fuel emission factors | IMO 4th GHG Study | Very High — fully public |
| Vessel tracking (AIS) | MarineTraffic free tier | Medium — limited on free tier |

**Steel:**
| Data Needed | Free Public Source | Quality |
|-------------|-------------------|---------|
| Steel production route statistics by company | WorldSteel Association | High — annual aggregates |
| Global steel plant tracker | Global Energy Monitor | Very High — open |
| Steel emission factors by route (BF-BOF, EAF) | worldsteel.org / IEA | Very High — fully public |
| Steel company decarbonisation plans | Company sustainability reports / SustainabilityReports.com | Medium — unstructured PDFs |

**What cannot be filled:** Vessel-level AER/CII for specific ships in a lender's portfolio. IHS Markit and Clarksons hold this. For the steel sector, individual company production route breakdown (% BF-BOF vs. EAF) is disclosed inconsistently — some via CDP, others only in internal credit files.

---

### 1.8 Client Engagement / Transition Plan Tracker

**Gap:** No workflow to track bilateral decarbonisation engagement with corporate borrowers.

**Fillability: MINIMAL — PRIMARILY INTERNAL**

This gap is almost entirely internal — engagement records, transition plan documents, escalation status, and RM notes all live in the lender's CRM system (Salesforce or similar). However, two public sources can supplement:

| Data Needed | Free Public Source | Quality |
|-------------|-------------------|---------|
| Corporate climate targets (public commitments) | CDP disclosures | Very High |
| SBTi target registrations | SBTi target dashboard (sciencebasedtargets.org) | Very High — open data |
| Climate lobbying scores | InfluenceMap / LobbyMap | Very High — free public profiles |
| Proxy voting on climate resolutions | ProxyData.org | Very High — open |

**Recommended approach:** Use SBTi target data and CDP disclosures as the "announced plan" layer. Flag the gap between the borrower's public commitment and the lender's internal engagement record. The InfluenceMap score is a powerful signal — a borrower with a Grade E (misaligned lobbying) is a different engagement priority than one with Grade A.

---

## 2. Full Source Catalog — All 106 Free Sources Mapped to Platform Modules

### 2.1 Stakeholder Sentiment & Media Intelligence

These sources support **ESG controversy screening**, **transition risk early warning**, and **stakeholder sentiment analysis** — inputs to the Interactive Dashboard and Portfolio Analytics.

| # | Source | Platform Module | Use Case | Commercial Use | API? |
|---|--------|-----------------|----------|----------------|------|
| 1 | Reddit API (PRAW) | Portfolio Analytics / Controversy | Community sentiment on borrower controversies; ESG event monitoring | Commercial OK | Yes — OAuth |
| 2 | YouTube Data API v3 | Stakeholder Sentiment | ESG panel discussions, earnings call sentiment, geopolitical event tracking | Commercial OK | Yes — 10K units/day |
| 3 | YouTube Transcripts | Stakeholder Sentiment | Earnings call transcripts (supplementary to Finnhub); ESG panel text | Commercial OK | Yes — open-source |
| 4 | Google Trends (pytrends) | Portfolio / Controversy | ESG controversy trend detection; keyword interest spikes | Commercial OK | Unofficial Python lib |
| 5 | Glassdoor / Indeed (Apify) | CSRD S1 Workforce | Employee sentiment; DEI indicators; workforce wellbeing | Commercial OK (Apify free tier) | Yes |
| 6 | Trustpilot | ESG Scores / CSRD | Customer perception; S-pillar metrics for consumer-facing companies | Commercial OK (scraping) | No official API |
| 7 | Hacker News API | Sector Assessments / Data Centres | Tech/energy/AI company ESG discourse; data centre controversy monitoring | Commercial OK | Yes — Firebase |
| 8 | Bluesky API | Stakeholder Sentiment | ESG community discourse (growing post-Twitter) | Commercial OK | Yes — AT Protocol |
| 9 | Mastodon API | Stakeholder Sentiment | EU/activist sustainability community (strong ESRS discourse) | Commercial OK | Yes |
| 10 | Stack Exchange API | Stakeholder Sentiment | Expert Q&A on governance, regulatory compliance | Commercial OK | Yes |

**Priority integration:** Reddit (ESG controversy monitoring) and Google Trends (controversy spike detection) have the highest signal-to-noise ratio for portfolio screening. Integrate these into the `controversy_score` field in the PCAF counterparty schema.

---

### 2.2 News & Media — Event Intelligence

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 11 | **GDELT Project** | Portfolio Analytics / Controversy | 250M+ events since 1970; 15-min updates; tone scoring; ESG event monitoring; BigQuery integration | Fully free — no restrictions | **CRITICAL** — pre-load |
| 12 | GDELT Cloud | Portfolio Analytics | AI-powered queries; relationship mapping between companies and ESG events | Free account | High |
| 13 | GNews API | Controversy / Regulatory | Targeted monitoring of specific companies or regulatory topics | Commercial OK (100 req/day free) | Medium |
| 14 | NewsAPI.org | Controversy | Broad news search; dev-only on free tier | Dev only — NOT for production | Low |
| 15 | Mediastack API | Controversy | Multi-language news feed | Commercial OK (free tier) | Low |
| 16 | NewsCatcher API | Controversy / CSRD | NER + sentiment built-in; reduces processing work | Commercial OK (free tier) | Medium |
| 17 | Marketaux | Portfolio Analytics | Entity-tagged financial news; 200K+ entities; ESG-relevant events | Commercial OK (100 req/day) | Medium |
| 18 | **Finnhub News Sentiment** | Portfolio Analytics / Financial Risk | Sentiment scores; senate lobbying data; supply chain data — all in one API | Commercial OK (60 calls/min) | **HIGH** — multi-module |
| 19 | Common Crawl | CSRD PDF Pipeline | Petabytes of web data; CSRD report discovery | Fully free | Low — infrastructure-heavy |
| 20 | Wayback Machine API | Controversy / Greenwashing | Track corporate ESG page changes over time; before/after analysis | Fully free | Medium |
| 21 | Finlight.me | Portfolio / Geopolitical Risk | Full-text news + NLP tagging; geopolitical coverage | Commercial OK (5K req/mo) | Medium |

**GDELT is the single highest-value free source** for an ESG analytics platform. Pre-loading GDELT event data (company-level tone and event frequency) transforms the controversy screening capability from manual to systematic. The BigQuery interface allows SQL queries across 250M events at no cost.

---

### 2.3 Financial Market Data

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 22 | **Yahoo Finance (yfinance)** | Portfolio Analytics / PCAF | Stock prices; fundamentals; EVIC (enterprise value) for PCAF attribution factor; institutional holders | Fully free — no restrictions | **CRITICAL** — EVIC calculation |
| 23 | Alpha Vantage | Portfolio Analytics | Stock prices; 50+ technical indicators; backup to yfinance | Commercial OK (25 req/day) | Medium |
| 24 | **Finnhub API** | Portfolio / Financial Risk | Real-time prices; earnings transcripts; insider sentiment; supply chain data; lobbying data | Commercial OK (60 calls/min) | **HIGH** |
| 25 | Marketstack | Portfolio Analytics | 30K+ tickers; 60+ exchanges; EDGAR filings endpoints | Commercial OK (100 req/mo) | Low |
| 26 | EODHD | Portfolio Analytics | EOD prices; fundamentals; EU markets strong | Commercial OK (20 req/day free) | Low |
| 27 | StockData.org | Portfolio Analytics | 150K+ tickers; 7+ years intraday; news sentiment | Commercial OK (100 req/day) | Medium |
| 28 | Twelve Data | Portfolio Analytics | 800 req/day; WebSocket; technical indicators | US free / Global paid | Medium |
| 29 | **Financial Modeling Prep (FMP)** | PCAF / Portfolio | US-focused; 13F filings; EDGAR integration; DCF models; 250 req/day | Commercial OK | **HIGH** — PCAF EVIC |
| 30 | Polygon.io | Portfolio Analytics | High quality US data; 2-year delayed on free | Severely limited free tier | Low |

**Priority use:** yfinance + FMP provide the EVIC (Enterprise Value Including Cost of Debt) denominator needed for PCAF attribution factor calculation for listed companies. These two sources alone unlock PCAF DQS 2 for all publicly listed borrowers — covering a large fraction of typical IBG/corporate lending portfolios.

---

### 2.4 Company Identification & Entity Resolution

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 31 | **OpenCorporates** | PCAF / Supply Chain | 200M+ companies; entity resolution; ultimate beneficial ownership | Commercial OK (rate-limited) | **HIGH** — entity matching |
| 32 | **GLEIF LEI Database** | PCAF / Regulatory | 2.8M+ LEIs; who-is-who and who-owns-whom; ISIN-to-LEI mapping | Fully free & open | **CRITICAL** — PCAF counterparty ID |
| 33 | OpenCorporates PLEI | PCAF | Proto-LEI free alternative; US initially; expanding 2026 | Free | Low — new, limited coverage |
| 34 | LEI Search (RapidLEI) | PCAF / Regulatory | LEI lookup; corporate hierarchies; sanctions screening | Free search | Medium |

**GLEIF LEI is the gold standard for entity identification in financial transactions.** For PCAF-aligned financed emissions reporting, every counterparty should be identified by LEI where available. Pre-loading the GLEIF database (2.8M records, free daily bulk download) enables automated entity resolution when counterparty data is uploaded.

---

### 2.5 Controversies, Misconduct & Sanctions

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 35 | **Violation Tracker (Good Jobs First)** | Portfolio Analytics / CSRD G1 | 684K+ US corporate penalties since 2000; 450 agencies; parent company mapping | Fully free & open | **HIGH** — ESG controversy screening |
| 36 | Violation Tracker UK | Portfolio Analytics | 117K+ UK cases | Fully free | High |
| 37 | Violation Tracker Global | Portfolio Analytics | 57 countries; 1,700+ parent companies since 2010 | Fully free | High |
| 38 | CourtListener | Controversy / CSRD G1 | US federal/state court opinions; environmental/labor/governance litigation | Fully free & open (API) | Medium |
| 39 | PACER | Controversy | US federal filings; comprehensive; partially free (<$30/quarter) | Near-free | Low |
| 40 | Kaggle ESG Datasets | Controversy / Model Training | 50K+ companies; controversial activities flagged; useful for model training | Fully free | Medium |
| 41 | **OFAC SDN List** | Regulatory / Sanctions | US SDN list; downloadable; API available | Fully free & open | **CRITICAL** — compliance |
| 42 | **EU Financial Sanctions List** | Regulatory / Sanctions | EU consolidated sanctions; XML/CSV | Fully free & open | **CRITICAL** — compliance |
| 43 | UN Security Council List | Regulatory / Sanctions | Global baseline sanctions | Fully free & open | **CRITICAL** — compliance |
| 44 | NameScan Free Check | Regulatory / Sanctions | Multi-list aggregator (OFAC + UN + EU + HMT) | Free (basic search) | Medium |

**Sanctions screening:** OFAC SDN, EU Financial Sanctions List, and UN SC List should be pre-loaded as reference data in a sanctions screening module. These are free, authoritative, and their absence from an ESG analytics platform serving financial institutions is a material compliance gap.

**Violation Tracker** is the most impactful free controversy source. It covers 684K+ US penalties across 450 regulatory agencies — EPA environmental violations, OSHA labour violations, DOJ settlements, SEC enforcement actions. Systematic pre-loading enables automated controversy flagging at the portfolio level.

---

### 2.6 Proxy Voting & Shareholder Activism

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 45 | **Root AGM & Resolution Database** | Portfolio Analytics / Engagement | 20 years of US+UK AGM resolutions; AI-parsed; topic-tagged | Fully free & public | **HIGH** — engagement tracker |
| 46 | **ProxyData.org** | Portfolio Analytics / Engagement | 47M+ US proxy voting records; how asset managers vote on ESG | Fully free & open | **HIGH** — investor alignment |
| 47 | Proxy Monitor | Portfolio Analytics | S&P 500 proposals since 2006; topic/proponent searchable | Fully free | Medium |
| 48 | PRI Resolution Database | Portfolio Analytics | Global shareholder resolutions; PRI signatory tracking | Free (registration) | Medium |

**Proxy voting data is uniquely valuable** for a sustainability analytics platform. ProxyData.org contains 47M voting records showing exactly how institutional investors vote on ESG resolutions. This can be used to score a lender's own proxy voting alignment and to assess the activism pressure facing specific borrowers.

---

### 2.7 Lobbying & Policy Influence

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 49 | **InfluenceMap / LobbyMap** | Portfolio Analytics / Engagement | 1,000+ companies; 350+ industry associations; Paris-alignment grades; CA100+ feeds | Free (public profiles) | **HIGH** — transition risk |
| 50 | EU Transparency Register | Regulatory / ESRS G1 | 12,000+ EU lobbyists; mandatory since 2021 | Free & open | Medium |
| 51 | EU Integrity Watch | Regulatory / ESRS G1 | MEP meeting logs; financial interests | Free | Low |
| 52 | **OpenSecrets (US)** | Controversy / G-pillar | US campaign finance + lobbying; API + bulk download | Free (API) | High |
| 53 | FEC Data (US) | Controversy | US campaign finance filings; raw official data | Free & open | Medium |
| 54 | CPR Hub | Controversy / Engagement | Corporate Political Responsibility research | Free | Low |
| 55 | Finnhub Senate Lobbying | Portfolio Analytics | US Senate lobbying within Finnhub API | Free (60 calls/min) | Medium |

**InfluenceMap** is the most directly relevant lobbying data source. Its Paris-alignment grades (A to F) for 1,000+ companies feed directly into transition risk assessment. A borrower with a Grade E (actively lobbying against Paris-aligned policies) should have a higher PD uplift under NGFS transition scenarios. This is a data-to-model linkage that no commercial ESG vendor offers for free.

---

### 2.8 ESG Ratings & Disclosure Data

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 56 | MSCI ESG Ratings | Portfolio Analytics | Industry-standard ESG scores | Web lookup only — no bulk API free | Reference |
| 57 | Sustainalytics | Portfolio Analytics | ESG Risk Ratings | Web lookup only — no bulk API free | Reference |
| 58 | S&P Global ESG Scores | Portfolio Analytics | 30 focus areas; E/S/G breakdown | Web lookup only — no bulk API free | Reference |
| 59 | **CDP Open Data** | Portfolio Analytics / PCAF | Climate disclosures; emissions; annual scores; downloadable | Free download | **CRITICAL** — Scope 1/2/3 |
| 60 | **Climate TRACE** | Portfolio Analytics / PCAF | 350M+ emission sources; satellite-verified; CC BY 4.0 | CC BY 4.0 — commercial safe | **CRITICAL** — emissions |
| 61 | Open Sustainability Index | Portfolio Analytics | GHG by scope; intensity; targets; Wikipedia-model | Free & open | Medium |
| 62 | **Upright Platform** | Portfolio Analytics / SFDR | Company net impact; SDG alignment; EU Taxonomy; SFDR PAI; 10K companies free | Free up to 10K companies | **HIGH** |
| 63 | **SASB Materiality Finder** | Portfolio Analytics / CSRD | Material ESG issues by industry; foundational for double materiality | Free & open | **CRITICAL** — CSRD |
| 64 | **WWF Risk Filter Suite** | Nature Risk / TNFD LEAP | Biodiversity + water risk; physical risk maps; location-based | Free (non-commercial; commercial: contact WWF) | **HIGH** |
| 65 | SustainabilityReports.com | CSRD PDF Pipeline | 400K+ sustainability reports; 25K+ companies; 120+ countries | Free (browse) | High |
| 66 | HuggingFace ESG Datasets | NLP / CSRD Pipeline | Fortune 500 ESG metrics; ESGBERT training sets; labeled text | Free & open | High |

**Key commercial licensing constraint — CDP:** CDP's corporate emissions data is free for download but subject to CDP's terms of use, which restrict commercial redistribution. For a commercial analytics platform, using CDP data as a pre-loaded baseline may require a licensing discussion with CDP. **Climate TRACE (CC BY 4.0) is the commercial-safe alternative** — it provides satellite-verified emissions for 350M+ emission sources globally with no commercial restrictions.

**SASB Materiality Finder** is foundational and fully free. Every CSRD double materiality assessment should start with the SASB industry-level materiality map. This should be pre-loaded as a reference library in the CSRD module.

---

### 2.9 Supply Chain & Modern Slavery

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 67 | **Open Supply Hub** | Supply Chain / Scope 3 | 1,000+ data contributors; universal supplier IDs; global factory mapping | Free & open | **HIGH** — Scope 3 |
| 68 | TISCreport | Supply Chain / CSRD S1 | UK Modern Slavery compliance; 26K+ UK companies | Free (search) | Medium |
| 69 | FAO Transparent Supply Chains | Supply Chain / CSRD E1 | Deforestation-free commodity tracking (palm oil, soy, timber) | Free & open | Medium |
| 70 | Finnhub Supply Chain Data | Supply Chain | Supplier/customer relationships for listed companies | Free (60 calls/min) | Medium |

**Open Supply Hub** is the most comprehensive free supply chain database. For Scope 3 Category 1 (purchased goods) assessment and CSRD S1 workforce supply chain disclosure, it provides supplier facility IDs, countries, and manufacturing sectors for 1,000+ contributing brands. This can populate the supply chain tier mapping in the Supply Chain module.

---

### 2.10 Regulatory Filings

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 71 | **SEC EDGAR** | PCAF / Portfolio Analytics | 10-K, 10-Q, 8-K, proxy, 13F; full-text search since 2001 | Fully free — public domain | **CRITICAL** |
| 72 | **SEC EDGAR XBRL/JSON API** | PCAF / Portfolio Analytics | Structured financial statements; no auth required; EVIC data | Fully free — public domain | **CRITICAL** — EVIC/PCAF |
| 73 | SEDAR+ (Canada) | Portfolio Analytics | Canadian ESG disclosures | Free | Medium |
| 74 | Companies House (UK) | Entity Resolution | UK company filings; REST API | Free & open | Medium |
| 75 | **Finnhub Earnings Transcripts** | NLP / Sentiment | 25+ years of earnings call transcripts; Q&A sections | Free (60 calls/min) | **HIGH** — NLP pipeline |

**SEC EDGAR XBRL/JSON API** is arguably the most underutilised free financial data source available. It provides fully structured financial statements (revenue, EBITDA, total assets, total debt) for all US SEC filers via a REST API with no authentication required. This directly solves the PCAF EVIC denominator problem for all US-listed counterparties — without any paid data subscription.

---

### 2.11 Innovation & Patents

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 76 | Google Patents | CSRD / Innovation | Cleantech patent analysis; green technology transition readiness | Free | Low |
| 77 | Espacenet (EPO) | CSRD / Innovation | 150M+ patent docs; Open Patent Services API | Free | Low |
| 78 | PATENTSCOPE (WIPO) | CSRD / Innovation | PCT applications; multilingual search | Free | Low |
| 79 | UVA Darden Patent Dataset | Model Training | 3.1M patents linked to 9.2K firms; academic-quality | Free & open | Low |
| 80 | Lens.org | CSRD / Innovation | Patent + scholarly citation linking; innovation intensity metrics | Free | Low |

**Relevance to platform:** Low immediate priority. Patent data becomes relevant for CSRD ESRS E1-related disclosures on green technology investment and for transition risk assessment (a steel company with zero EAF patents has lower transition readiness). Implement as Phase 3+ enhancement.

---

### 2.12 Climate, Scenario & Energy Data

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 81 | **NGFS Scenarios Portal** | Scenario Analysis | 6 scenarios; IAM models; macro-financial NiGEM; Python pyam access | Free & open | **CRITICAL** — already loaded |
| 82 | **NGFS Climate Impact Explorer** | Scenario / Physical Risk | Chronic impacts; temperature alignment; country-level; API | Free & open | **CRITICAL** |
| 83 | IMF Climate Dashboard | Scenario Analysis | Key NGFS variables; user-friendly; time series export | Free & open | High |
| 84 | **Our World in Data** | Portfolio Analytics / Carbon | CO₂, energy, poverty datasets; GitHub-hosted; CC BY 4.0 | CC BY 4.0 — commercial safe | **HIGH** — commercial alt. |
| 85 | **Global Forest Watch** | Nature Risk / TNFD | Near real-time forest loss; fire alerts; supply chain deforestation risk | CC BY 4.0 — commercial safe | **HIGH** — EUDR/TNFD |
| 86 | **Global Energy Monitor** | Stranded Assets / Power Plants | Fossil fuel + renewables + nuclear tracker; project-level; ownership | Free & open | **CRITICAL** — pre-load |

---

### 2.13 Macro / Country-Level

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 87 | **World Bank ESG DataBank** | Portfolio Analytics / CSRD | Sovereign ESG indicators; 200+ countries; CSV/API | Free & open | **HIGH** |
| 88 | UN Data | Portfolio Analytics | 32 databases; 60M+ records | Free & open | High |
| 89 | SDG Country Profiles | Portfolio Analytics / SFDR | SDG progress by country; trends; clean presentation | Free | Medium |
| 90 | **OECD Data Explorer** | Portfolio Analytics | Governance; environment; well-being; 38 OECD + partners; API | Free (API) | High |
| 91 | **ACLED** | Portfolio Analytics / Physical Risk | 1.3M+ conflict/protest events; weekly updates; World Bank use | Free (registration) | **HIGH** — political risk |

---

### 2.14 Academic & Policy Research

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 92 | SSRN ESG Hub | Methodology | Early-stage ESG research; multi-disciplinary | Free | Low |
| 93 | arXiv | Methodology / NLP | Quantitative finance; NLP for ESG; climate risk modelling | Free & open (API) | Medium |
| 94 | Chatham House | Regulatory Context | Geopolitical ESG policy research | Selected reports free | Low |
| 95 | Brookings | Regulatory Context | SDG private capital; ESG accountability | Free | Low |

---

### 2.15 Central Bank & Regulatory Data

| # | Source | Platform Module | Use Case | Commercial Use | Priority |
|---|--------|-----------------|----------|----------------|----------|
| 96 | Bank of Canada Publications | Regulatory | FSR; climate research; MPR | Free & open | Low |
| 97 | **ECB Statistical Data Warehouse** | Regulatory / ESRS | Euro area banking data; API | Free & open | Medium |
| 98 | Fed in Print | Regulatory | Fed working papers; monetary/financial context | Free | Low |

---

### 2.16 NLP Models — Internal Processing Infrastructure

These are not data sources but **processing tools** that transform unstructured text (news, reports, earnings calls) into structured ESG signals. They should be integrated into the CSRD PDF Pipeline and the sentiment/controversy screening layer.

| # | Model | Platform Module | Use Case | Commercial Use | Priority |
|---|-------|-----------------|----------|----------------|----------|
| 99 | **FinBERT (ProsusAI)** | CSRD Pipeline / Controversy | Financial sentiment classification (pos/neg/neutral) | Open-source — commercial OK | **CRITICAL** |
| 100 | **FinBERT-ESG** | CSRD Pipeline | E/S/G pillar tagging of text | Open-source — commercial OK | **HIGH** |
| 101 | **ESGBERT** | CSRD Pipeline | ESG text classification + labeled training data | Open-source — commercial OK | **HIGH** |
| 102 | VADER Sentiment | Controversy / Sentiment | Rule-based; tuned for social media; fast baseline | Open-source — commercial OK | Medium |
| 103 | TextBlob | Sentiment | General sentiment; quick prototyping only | Open-source — commercial OK | Low |
| 104 | **spaCy + Transformers** | CSRD Pipeline / NER | Entity recognition; custom NLP pipelines; production-grade | Open-source — commercial OK | **CRITICAL** |
| 105 | Wikipedia-API (Python) | Entity Resolution | Company descriptions; controversy sections | Free (5K req/day) | Low |

**NLP stack recommendation:** The platform's CSRD PDF Pipeline already uses text extraction. Adding FinBERT-ESG for automatic E/S/G classification of extracted KPI text, ESGBERT for topic labelling, and spaCy for Named Entity Recognition (counterparty name extraction, metric extraction) will significantly reduce manual review time. All are open-source with no commercial restrictions. Combined with GDELT for media monitoring, this forms a complete ESG text intelligence layer.

---

## 3. Commercial Licensing Constraints — Summary

The following sources commonly used in ESG analytics have licensing restrictions that must be resolved before commercial deployment:

| Source | Issue | Free Alternative | Action Required |
|--------|-------|-----------------|-----------------|
| **IEA Data** | Non-commercial free tier only | Our World in Data (CC BY 4.0); NGFS Portal | Replace IEA direct use with OWID/NGFS in commercial deployment |
| **CDP Corporate Data** | Terms restrict commercial redistribution | Climate TRACE (CC BY 4.0) | Contact CDP for commercial license OR use Climate TRACE for Scope 1/2/3 |
| **CRREM Pathways** | No redistribution clause | NGFS Climate Impact Explorer (free) | Download for internal use only; do not pre-distribute pathway curves to clients |
| **WWF Risk Filter** | Free for non-commercial; commercial requires contact | WDPA + Global Forest Watch (both CC BY) | Contact WWF for commercial deployment terms |
| **Glassdoor / Indeed (Apify scraping)** | Apify usage terms; underlying site TOS applies | LinkedIn public data (limited); Companies House (UK director filings) | Review Apify commercial terms; limit to public data extraction |
| **MSCI / Sustainalytics / S&P ESG ratings** | No bulk API on free tier; individual lookup only | Upright Platform (10K companies free); Open Sustainability Index | For bulk needs, negotiate API license OR use Upright/OSI as proxy |

---

## 4. Pre-Loading Strategy — Lean Analytical Team

### 4.1 What to Pre-Load at Platform Startup (Zero Ongoing Cost)

These datasets should be ingested once and refreshed on a schedule. Total cost: **USD 0 per year**.

| Dataset | Source | Refresh Frequency | Module(s) Fed |
|---------|--------|------------------|---------------|
| Global coal plant tracker | Global Energy Monitor | Quarterly | Stranded Assets, Power Plant |
| Global renewables pipeline | Global Energy Monitor | Quarterly | Power Plant, Portfolio Analytics |
| NGFS Phase V scenario data | NGFS Portal | Annual (phase updates) | Scenario Analysis, Financial Risk, Portfolio |
| NGFS Climate Impact Explorer (physical risk) | NGFS Climate Impact Explorer | Annual | Physical Risk, Nature Risk |
| IEA NZE glidepaths | NGFS Portal (as alt.) / OWID | Annual | Scenario Analysis, Portfolio Analytics |
| GLEIF LEI database | GLEIF (bulk download) | Daily | PCAF, Entity Resolution, Regulatory |
| OFAC SDN List | OFAC.treasury.gov | Daily | Regulatory / Compliance |
| EU Financial Sanctions List | EU Open Data | Daily | Regulatory / Compliance |
| UN Security Council List | UN.org | Per SC action | Regulatory / Compliance |
| WDPA Protected Areas | UNEP-WCMC | Semi-annual | Nature Risk (once PostGIS deployed) |
| Global Forest Watch | GFW | Near real-time via API | Nature Risk, Supply Chain |
| World Bank ESG DataBank | World Bank API | Annual | Portfolio Analytics, Country Risk |
| SASB Materiality Finder | SASB.org | Per standards update | CSRD Double Materiality |
| Our World in Data (CO₂, energy) | OWID GitHub | Monthly | Portfolio Analytics, Carbon Calculator |
| Violation Tracker (US + UK + Global) | Good Jobs First | Monthly | Portfolio Analytics (controversy) |
| SBTi target registry | SBTi public dashboard | Weekly | Portfolio Analytics (engagement) |
| Climate TRACE (asset-level emissions) | climatetrace.org | Annual | PCAF (DQS 4 fallback) |
| ACLED conflict data | ACLED (registration) | Weekly | Portfolio Analytics (political risk) |
| InfluenceMap company profiles | lobbymap.org | Weekly | Portfolio Analytics (transition risk) |

### 4.2 What to Activate via API at Runtime (Free Tier — Rate-Managed)

These sources are queried on-demand when a user opens a specific record or runs a calculation:

| API | Free Tier Limit | Module | Query Trigger |
|-----|----------------|--------|---------------|
| yfinance | Unlimited (unofficial) | PCAF / Portfolio | When a counterparty is added — auto-fetch EVIC |
| SEC EDGAR XBRL API | Unlimited (public domain) | PCAF / Financial | When a US-listed counterparty is added |
| FMP API | 250 req/day | PCAF / Financial | Financial statements for EVIC denominator |
| Finnhub | 60 calls/min | Portfolio / Sentiment | Earnings transcripts; supply chain; lobbying |
| GDELT BigQuery | Free (Google Cloud) | Controversy | Event-level screening when counterparty searched |
| OpenCorporates | Rate-limited | Entity Resolution | Entity lookup on counterparty onboarding |
| GLEIF LEI Search | Unlimited (bulk pre-loaded) | PCAF / Compliance | LEI lookup on entity creation |
| NGFS Climate API | No limit | Scenario Analysis | Scenario data pull on analysis run |
| GFW API | Free API | Nature Risk | Deforestation risk on project coordinate entry |
| ACLED API | Free (registration) | Portfolio | Political risk score on country selection |

### 4.3 What Requires Internal Upload — Cannot Be Replaced with Public Data

The following data points are irreplaceable with public sources. The platform must provide a well-designed Data Hub upload interface for each:

| Data Type | Who Holds It | Upload Format |
|-----------|-------------|---------------|
| Loan-level portfolio (outstanding balances, borrower IDs, sectors) | Core banking system | CSV / API connector |
| Borrower Scope 1/2/3 emissions (primary data, DQS 1) | Credit files / ISDA questionnaires | CSV per counterparty |
| PCAF DQS per exposure | Internal PCAF working model | CSV with DQS column |
| Real estate collateral energy use intensity (kWh/m²) | Property valuation reports | CSV per asset |
| Shipping fleet data (vessel IMO, AER/CII) | Loan drawdown documents | CSV per vessel |
| Steel production route (% BF-BOF, EAF) | Project finance files | CSV per borrower |
| Stage 1/2/3 loan classification (IFRS 9) | Core banking system | CSV / API connector |
| Counterparty transition plan status | RM CRM notes | Manual entry / CSV |
| Internal carbon price (ICP) | Risk Policy | Configuration variable |
| Physical risk scores from licensed vendor | Jupiter / 427MT / Moody's RMS | API integration |

---

## 5. Total Gap Coverage Assessment

| Gap Category | # Gaps | Fully Public | Partially Public | Internal Only |
|-------------|--------|-------------|-----------------|---------------|
| Portfolio Analytics (mocked engine) | 1 | — | Yes | Loan data needed |
| PCAF / DQS | 2 | Partial | Yes | Primary data internal |
| Glidepath / NZBA tracker | 1 | Yes | — | Only actuals internal |
| Physical risk (PostGIS) | 1 | Partial | Yes | Commercial vendor for precision |
| Coal plant database | 1 | Yes | — | — |
| MAS regulatory module | 1 | Yes | — | — |
| Shipping sector module | 1 | — | Partial | Vessel-level IHS Markit |
| Steel sector module | 1 | — | Partial | Production route internal |
| Client engagement tracker | 1 | — | Partial | CRM data internal |
| Transition finance eligibility (SAT) | 1 | Yes | — | — |
| Energy expert: DSCR / project finance model | 1 | — | — | Developer data room |
| Energy expert: TNFD LEAP spatial layer | 1 | Partial | Yes | Site-level surveys internal |
| Energy expert: ETC revenue integration | 1 | Yes | — | — |
| Energy expert: Carbon credit integration with power model | 1 | Yes | — | — |
| **TOTAL** | **15** | **6 fully** | **6 partially** | **3 purely internal** |

**Conclusion:** 40% of identified gaps are fully addressable with zero-cost public data. 40% can be substantially improved with public data (though not completely replaced). Only 20% require proprietary or internal data with no viable public substitute.

---

## 6. Recommended Immediate Actions (Priority Order)

1. **Pre-load Global Energy Monitor GCPT** — Activates Stranded Assets + Power Plant modules with real data. Zero cost. One-time ingestion + quarterly refresh. Highest impact per effort.

2. **Integrate SEC EDGAR XBRL API + yfinance for EVIC** — Fixes PCAF EVIC denominator for all US/globally-listed counterparties. Eliminates DQS 4 (sector average) fallback for listed entities. Zero cost.

3. **Pre-load GLEIF LEI bulk database** — Enables automated entity resolution on counterparty onboarding. Upgrades PCAF counterparty identification from manual to systematic. Zero cost, daily refresh.

4. **Implement GDELT BigQuery integration** — Transforms controversy screening from manual to event-driven. 250M+ events, 15-minute updates, SQL interface, zero cost. Link to Portfolio Analytics controversy score field.

5. **Replace IEA direct references with NGFS/OWID** — Resolves commercial licensing constraint for the IEA non-commercial restriction. Use NGFS Portal for glidepath data and OWID for sector-level emission intensity benchmarks.

6. **Pre-load OFAC + EU + UN sanctions lists (daily refresh)** — Adds a compliance screening layer that financial institution clients require. Fully free, no licensing issues.

7. **Integrate FinBERT-ESG + spaCy into CSRD PDF Pipeline** — Reduces manual KPI extraction time. Open-source, no commercial restrictions. Upgrades the existing CSRD pipeline with automated E/S/G classification.

8. **Pre-load Violation Tracker (US + Global)** — Adds systematic controversy history for 684K+ corporate penalties. Directly feeds portfolio-level ESG controversy score. Zero cost.

9. **Pre-load SASB Materiality Finder** — Builds the industry materiality reference library needed for CSRD double materiality assessments. Zero cost, standards-based (infrequent updates).

10. **Contact WWF for commercial deployment rights to Risk Filter Suite** — The WWF Risk Filter Suite is the highest-quality free nature risk source. If commercial rights are granted, it directly addresses the TNFD LEAP biodiversity gap. Low effort, high potential upside.

---

## 7. Sources Considered

This analysis integrates:
- 106 sources from `complete_free_sources_with_quality.csv` (user-provided)
- Additional sources identified through web research: WDPA, SBTi, Global Energy Monitor, InfluenceMap, Climate TRACE, MAS regulatory publications, IEA, CRREM, NGFS Phase V

Full source details (URL, format, quality, commercial use) are in `complete_free_sources_with_quality.csv`.
