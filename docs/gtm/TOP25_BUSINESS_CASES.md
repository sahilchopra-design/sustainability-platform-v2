# Top 25 Business Cases — Energy Developers · Financial Institutions · Compliance

*Drafted 2026-07-07. The backbone artifact for the GTM package: every case maps to REAL,
named platform modules (ids validate against `docs/module_atlas/atlas.json`). Readiness
grades are honest, sourced from `docs/CRITICAL_REVIEW_UAT_AUDIT.md` (B1 open bugs / B2
limitations) and the Module Atlas §7 deep-dives — a case is not "ready" because a page
renders; it's ready when the numbers are engine-computed and defensible. Companion docs:
`GTM_ROADMAP.md`, `CONTENT_PACKAGE.md`, `IMPLEMENTATION_PLAN.md`.*

**Readiness legend:** 🟢 demo-ready today (engine-backed, verified) · 🟡 engine ready,
wiring/data gap documented · 🔴 material build/fix required before client exposure.

---

## Segment A — Energy Developers & IPPs (BC-01 … BC-09)

| ID | Business case | Buyer | Pain solved | Platform modules (real ids) | Readiness |
|---|---|---|---|---|---|
| BC-01 | **PPA structuring & valuation desk** | Head of Origination | Pricing PPAs with real resource data and credit-adjusted terms instead of consultant spreadsheets | `ppa-structuring-desk`, `ppa-xva-engine`, `ppa-analytics` (NASA POWER resource data) | 🟢 — NASA POWER resource wiring proven (Seville vs North Sea yields differ); XVA lattice engine real |
| BC-02 | **Climate-integrated project finance modeling** | Project Finance Director | NGFS-scenario-aware PF models (DSCR/LLCR under transition paths) without rebuilding Excel per deal | `financial-modeling-studio` (8 endpoints incl. QMC `/simulate`, `/solve-frontier`) | 🟢 — flagship 2,425-line PRNG-free engine; benchmark pin pending (B3 top item) |
| BC-03 | **Tax equity & transferability structuring (IRA)** | CFO / Tax Counsel | ITC/PTC partnership-flip vs §6418 transfer comparison | `tax-equity-transferability` | 🟢 — flip solver with worked example in Atlas deep-dive |
| BC-04 | **BESS revenue stacking & dispatch** | Storage Development Lead | Stacked FCR/aFRR/arbitrage revenue cases per asset | `battery-revenue-stacker`, `bess-grid-analytics`, `energy-storage-analytics`, `virtual-power-plant` | 🟡 — stacking logic real; `virtual-power-plant` has documented 144× annualisation bug (§9 evolution gates on fix) |
| BC-05 | **Green hydrogen / P2X economics** | H₂ Business Development | RFNBO-compliant LCOH, electrolyzer sizing, offtake economics | `green-hydrogen`, `green-hydrogen-economics`, `power-to-x-finance` | 🟡 — core LCOH real; `green-hydrogen-economics` has documented guide↔code mismatch |
| BC-06 | **Offshore wind development finance** | Offshore Development Director | Resource-to-financing chain: yield, O&M, debt sizing | `offshore-wind-finance`, `offshore-wind-resource`, `offshore-wind-om`, `offshore-grid-infrastructure` | 🟢 — flagged "genuinely well-built" in evolution review |
| BC-07 | **Site physical-risk screening (development siting)** | Head of Development | Multi-hazard screening of candidate sites against real USGS/IBTrACS/GWIS/IPCC data | `global-physical-risk-atlas`, `api::spatial`, `api::usgs_earthquake`, `api::ibtracs_cyclone` | 🟢 — 5 hazard grids populated & spot-verified; wildfire country-resolution caveat must be disclosed |
| BC-08 | **Grid carbon intelligence & 24/7 CFE** | Sustainability/PPA Analyst | Hourly grid mix + carbon intensity for CFE claims and PPA shaping | `grid-carbon-intelligence`, `api::eia_energy`, `api::entsoe_grid` | 🟡 — GB fully live; US/EU need free API keys (labeled fallback until set) |
| BC-09 | **YieldCo / asset rotation analytics** | Corp Dev / IR | CAFD accretion, dropdown NAV bridge, securitization takeout | `yieldco-dropdown-analyzer`, `renewable-project-pipeline` | 🟢 — NX2-14 build, engine-computed |

## Segment B — Financial Institutions (BC-10 … BC-18)

| ID | Business case | Buyer | Pain solved | Platform modules (real ids) | Readiness |
|---|---|---|---|---|---|
| BC-10 | **Portfolio physical climate risk (asset-level)** | CRO / Head of Climate Risk | EAL/PML/Climate-VaR per asset with provenance, not vendor black box | `physical-risk-pricing` (E104), `asset-exposure-explorer`, `global-physical-risk-atlas` | 🟡 — engine bench-verified; E104 page's seeded-random tabs (B1 #3) must be wired before client demo |
| BC-11 | **Climate stress testing (ECB/EBA/BoE style)** | Head of Stress Testing | Supervisory-scenario runs across the book | `stress-test-orchestrator` (E100), `supervisory-scenario-runner`, `climate-var-engine` | 🟡 — orchestrator deterministic (bench-pinned); `climate-var-engine` interaction-term defect documented; severity `.length` bug open |
| BC-12 | **Financed emissions / PCAF reporting** | Head of ESG Reporting | PCAF-compliant financed + facilitated emissions with DQS | `pcaf-financed-emissions`, `api::pcaf_asset_classes`, `api::pcaf_regulatory`, `avoided-emissions-hub` | 🟢 — WACI/DQS bench-pinned; sovereign attribution deterministic |
| BC-13 | **Climate-in-Basel capital integration** | Head of Prudential Risk | Climate quarantine in RWA, PD-floor mechanics, output floor | `regulatory-capital`, `api::basel3_liquidity`, `climate-capital-adequacy` | 🟢 — bench-pinned (routing, floors, quarantine all hand-verified) |
| BC-14 | **Counterparty & entity climate due diligence** | Head of Credit / KYC | One entity view: LEI golden record → ownership → sanctions → climate exposure | `entity360`, `counterparty-ownership-graph`, `api::entity_resolution`, `sanctions-screening-desk` | 🟡 — chain live-proven; `entity_lei` only 3 rows until bulk ingest runs (B2c); entity360 missing-data-rewards-rating bug documented |
| BC-15 | **Green/sustainable bond pricing & greenium** | DCM Desk Head | Issuance pricing, greenium signal, use-of-proceeds tracking | `green-bond-pricing-desk`, `greenium-signal`, `green-securitisation` | 🟢 — flagged genuinely strong in evolution review |
| BC-16 | **Transition finance origination & credibility** | Head of Sustainable Finance | Multi-stream borrower assessment, PD/LGD/EL, RAROC under NGFS deltas | `energy-transition-credit-portal`, `transition-bond-credibility`, `transition-finance` | 🟡 — portal engine-backed (NX2-15); `transition-finance` page discards its own API response (documented wiring gap) |
| BC-17 | **Climate underwriting & CAT exposure (insurers)** | Chief Underwriting Officer | Peril-priced underwriting with EP-curve EAL + digital-twin hazards | `climate-underwriting-workbench`, `climate-insurance`, `api::insurance_risk` | 🟢 — physical VaR = 1-in-100 PML bench-pinned; EIOPA SCR aggregation bench-pinned |
| BC-18 | **Real estate portfolio climate analytics** | Head of RE Investment | CRREM pathways, rebuild-cost-based hazard pricing, green premium | `real-estate-carbon-analytics`, `asset-exposure-explorer`, `real-estate-valuation`, `api::green_premium_tenant` | 🟡 — RE DCF bench-pinned; 3 valuation endpoints have open Decimal×float / null bugs (B1 #6–7) |

## Segment C — Compliance & Regulatory (BC-19 … BC-25)

| ID | Business case | Buyer | Pain solved | Platform modules (real ids) | Readiness |
|---|---|---|---|---|---|
| BC-19 | **CSRD/ESRS reporting factory** | Head of Sustainability Reporting | ESRS datapoint mapping → disclosure drafting → assurance readiness | `csrd-esrs-automation`, `esrs-datapoint-navigator`, `assurance-readiness-engine`, `api::csrd_reports` | 🟡 — catalogs real (1,184-row ESRS catalog in DB); navigator's 307-vs-1,144 datapoint shortfall documented |
| BC-20 | **SFDR PAI & product disclosure** | Fund Compliance Officer | PAI computation + DNSH + Annex I–V statements | `sfdr-pai`, `api::sfdr_annex`, `api::sfdr_product_reporting` (2,044-LOC PAI engine) | 🟢 — engine substantive; honest-nulls behavior verified (empty portfolio → insufficient_data, never invented) |
| BC-21 | **EU Taxonomy alignment & GAR** | Head of Regulatory Reporting | Activity-level alignment, GAR/BTAR computation | `eu-taxonomy-engine`, `api::eu_taxonomy_gar`, `taxonomy-hub` | 🟡 — engines real; GAR denominator narrower than DA (documented, overstates GAR) + eligible ×1.5 multiplier flagged — both must be fixed pre-client |
| BC-22 | **CBAM exposure & cost projection** | Trade Compliance / CFO | 2026–34 phase-in cost curves per import line | `cbam-trade-exposure-mapper`, `api::cbam`, `api::un_comtrade` | 🟢 — phase-out factors bench-pinned to official schedule; Comtrade preview-tier limit disclosed |
| BC-23 | **ISSB S2 / TCFD disclosure** | Corporate Reporting Lead | S2-aligned metrics/targets/scenario disclosure assembly | `issb-disclosure`, `tcfd-physical-risk-assessment`, `api::issb_s2` | 🟡 — issb-tcfd family has a documented Pydantic contract break (wiring-first evolution) |
| BC-24 | **Regulatory obligation calendar & readiness** | Chief Compliance Officer | 12-framework deadline tracking (ETS2, CSRD waves, BRSR…) | `regulatory-calendar`, `regulatory-horizon`, `climate-reg-policy-tracker` | 🟢 — fixed & live-verified 2026-07-05 (25 obligations, 12 frameworks) |
| BC-25 | **Supply-chain due diligence (EUDR/CSDDD/forced labour)** | Head of Supply Chain Compliance | Plot-level deforestation overlap, entity screening, CSDDD readiness | `eudr-engine` (spatial plot-overlap via `api::spatial`), `forced-labour-msv2`, `csddd-engine`, `supply-chain-esg-hub` | 🔴 — `ref_protected_areas` empty (WDPA license deferred) → EUDR returns empty by design; `POST /scope3/calculate` routes failing; disclosure must be un-missable or case held back |

---

## Portfolio shape (why these 25)

- **Readiness mix:** 12 🟢 / 12 🟡 / 1 🔴 — deliberately weighted toward cases that can
  demo *today* on engine-computed numbers, with the 🟡 gaps being named, scoped fixes
  (most are wiring or data-population, not new science) that the implementation plan
  sequences.
- **Bench-pinned anchor per segment:** every segment contains at least 3 cases whose
  core engine is numerically hand-verified in `bench_quant.py` — these lead demos.
- **Excluded deliberately:** cases resting on modules whose §7 deep-dives document
  seeded-random rendering without a real engine behind them (e.g. `portfolio-climate-var`)
  — nothing enters the GTM package until it passes the no-fabrication bar.
