"""
NX2-17 — Compliance & National Carbon Mechanisms Desk
=====================================================

Coverage: national / subnational / supranational COMPLIANCE carbon mechanisms
(cap-and-trade, intensity/rate-based, carbon tax, baseline-and-credit) plus the
Paris Agreement Article 6 market layer (6.2 ITMOs, 6.4 PACM) and CORSIA.

Data policy
-----------
* /schemes and /article6 are HAND-AUTHORED REGULATORY EXTRACTS: real mechanism
  parameters the desk is confident of, with approximate price levels, all
  labeled "regulatory extract, approximate parameters as of ~2025 — verify
  against current regulation for production". Anything uncertain is labeled in
  its own `notes`/`confidence` field; nothing is fabricated.
* All calculators (/itmo-price, /compliance-cost, /cross-border) are
  DETERMINISTIC closed-form models — no PRNG anywhere. Every modeling
  assumption (premium %, discount mapping, greedy order) is documented in the
  response `methodology` block.
* This desk RECONCILES WITH (does not duplicate) the E71 reference layer:
  GET /api/v1/carbon-price-ets/ref/ets-systems covers 6 ETS (eu_ets, uk_ets,
  california, china_ets, rggi, korea_ets). Each scheme below carries an
  `ets_ref_id` cross-reference where it exists there, and this extract EXTENDS
  the set with EU ETS2, India CCTS, Australia Safeguard, Japan GX-ETS,
  Singapore carbon tax, Mexico ETS pilot and CORSIA.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

router = APIRouter(
    prefix="/api/v1/compliance-carbon",
    tags=["Compliance & National Carbon Mechanisms — NX2-17"],
)

EXTRACT_LABEL = (
    "regulatory extract, approximate parameters as of ~2025 — verify against "
    "current regulation for production"
)

# ---------------------------------------------------------------------------
# 1) Scheme atlas — hand-authored regulatory extract
# ---------------------------------------------------------------------------
# price.usd_per_t values are APPROXIMATE ~2025 levels (secondary/auction),
# provided for comparison only; `approx: True` on every price block.

SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "eu_ets",
        "name": "EU Emissions Trading System (ETS1)",
        "jurisdiction": "European Union + EEA-EFTA (NO, IS, LI)",
        "level": "supranational",
        "type": "cap_and_trade",
        "status": "operating",
        "start_year": 2005,
        "coverage_sectors": ["power", "industry", "intra-EEA aviation", "maritime (phased 2024-26)"],
        "covered_emissions_mt": 1300,
        "share_of_jurisdiction_ghg_pct": 38,
        "price": {"usd_per_t": 75.0, "local": 70.0, "currency": "EUR",
                  "as_of": "~2025, typical range EUR 60-90", "approx": True},
        "cap_or_target": {
            "cap_2024_mt": 1386,
            "trajectory": "Linear reduction factor 4.3%/yr 2024-2027, 4.4%/yr 2028-2030 "
                          "(Fit-for-55 revision; 2.2%/yr before 2024) + one-off rebasing "
                          "-90 Mt (2024) and -27 Mt (2026)",
            "msr": "Market Stability Reserve: 24% of TNAC withdrawn when TNAC > 833 Mt; "
                   "release when TNAC < 400 Mt (Decision (EU) 2015/1814 as amended)",
        },
        "offset_rules": {
            "eligible_units": [],
            "limit_pct_of_obligation": 0.0,
            "notes": "International credits NOT usable since Phase 4 (2021). "
                     "Kyoto CER/ERU eligibility ended with Phase 3.",
        },
        "linkage": "Linked to Swiss ETS since 2020; UK link agreed in principle at "
                   "May 2025 UK-EU summit (not yet operational — verify status)",
        "ets_ref_id": "eu_ets",
        "key_params": {"free_allocation": "benchmark-based, industry phase-out 2026-2034 as CBAM phases in",
                       "cbam_linked": True},
    },
    {
        "id": "uk_ets",
        "name": "UK Emissions Trading Scheme",
        "jurisdiction": "United Kingdom",
        "level": "national",
        "type": "cap_and_trade",
        "status": "operating",
        "start_year": 2021,
        "coverage_sectors": ["power", "industry", "domestic + UK-EEA aviation"],
        "covered_emissions_mt": 100,
        "share_of_jurisdiction_ghg_pct": 25,
        "price": {"usd_per_t": 50.0, "local": 40.0, "currency": "GBP",
                  "as_of": "~2025, typical range GBP 30-50", "approx": True},
        "cap_or_target": {
            "cap_2025_mt": 90,
            "trajectory": "Net-zero-consistent cap reset from 2024 (2023 Authority decision), "
                          "declining toward ~50 Mt by 2030 (approx)",
            "msr": "Supply Adjustment Mechanism / cost containment mechanism (UK design)",
        },
        "offset_rules": {
            "eligible_units": [],
            "limit_pct_of_obligation": 0.0,
            "notes": "No offsets currently permitted; consultation on integrating "
                     "greenhouse-gas removals (GGRs) from ~2029 ongoing — verify.",
        },
        "linkage": "EU link agreed in principle (May 2025); not operational",
        "ets_ref_id": "uk_ets",
        "key_params": {"free_allocation": True},
    },
    {
        "id": "wci_ca_qc",
        "name": "California Cap-and-Trade + Quebec C&T (WCI linked)",
        "jurisdiction": "California (USA) + Quebec (Canada)",
        "level": "subnational (linked)",
        "type": "cap_and_trade",
        "status": "operating",
        "start_year": 2013,
        "coverage_sectors": ["power (incl. imports)", "industry", "transport fuels", "natural gas"],
        "covered_emissions_mt": 330,
        "share_of_jurisdiction_ghg_pct": 75,
        "price": {"usd_per_t": 30.0, "local": 30.0, "currency": "USD",
                  "as_of": "~2025 CCA, range USD 25-42", "approx": True},
        "cap_or_target": {
            "cap_2025_mt": 280,
            "trajectory": "CA cap declines ~13.4 Mt/yr to ~200 Mt by 2030 (AB 398 period); "
                          "auction price floor ~USD 24-25 escalating 5% + CPI annually; "
                          "price ceiling + two allowance price containment reserve tiers",
        },
        "offset_rules": {
            "eligible_units": ["CCO"],
            "limit_pct_of_obligation": 6.0,
            "notes": "CA: 4% of obligation 2021-2025, 6% from 2026 (used here), with at "
                     "least half from projects with direct environmental benefits to CA "
                     "(DEBS). Quebec allows up to 8% (Quebec-issued offsets).",
        },
        "linkage": "CA-QC linked via Western Climate Initiative since 2014 "
                   "(joint auctions, fully fungible allowances)",
        "ets_ref_id": "california",
        "key_params": {"price_floor_usd": 24.0, "free_allocation": "industry assistance factors"},
    },
    {
        "id": "rggi",
        "name": "Regional Greenhouse Gas Initiative (RGGI)",
        "jurisdiction": "10-11 US Northeast/Mid-Atlantic states (membership in flux: "
                        "VA exit 2023, PA participation in litigation)",
        "level": "subnational (multi-state)",
        "type": "cap_and_trade",
        "status": "operating",
        "start_year": 2009,
        "coverage_sectors": ["power (fossil units >= 25 MW)"],
        "covered_emissions_mt": 65,
        "share_of_jurisdiction_ghg_pct": 16,
        "price": {"usd_per_t": 21.0, "local": 21.0, "currency": "USD",
                  "as_of": "~2025 auction clearing, range USD 14-25 (short tons)", "approx": True},
        "cap_or_target": {
            "cap_note": "~60-65 million short tons (2024-25, post-VA exit, approx); "
                        "Third Program Review pending — verify",
            "trajectory": "Cost Containment Reserve (CCR) + Emissions Containment "
                          "Reserve (ECR) trigger prices adjust supply",
        },
        "offset_rules": {
            "eligible_units": ["RGGI_OFFSET"],
            "limit_pct_of_obligation": 3.3,
            "notes": "3.3% of obligation; narrow project categories (landfill CH4, "
                     "SF6, afforestation); historically negligible actual use.",
        },
        "linkage": "Multi-state common market; no external linkage",
        "ets_ref_id": "rggi",
        "key_params": {"units": "short tons", "free_allocation": False, "auction_share_pct": 90},
    },
    {
        "id": "eu_ets2",
        "name": "EU ETS2 (buildings, road transport, small industry fuels)",
        "jurisdiction": "European Union",
        "level": "supranational",
        "type": "cap_and_trade",
        "status": "legislated — trading starts 2027",
        "start_year": 2027,
        "coverage_sectors": ["buildings heating fuels", "road transport fuels", "small energy/industry"],
        "covered_emissions_mt": 1000,
        "share_of_jurisdiction_ghg_pct": 35,
        "price": {"usd_per_t": None, "local": None, "currency": "EUR",
                  "as_of": "not yet trading; EUR 45 (2020 real) soft price cap via BRM", "approx": True},
        "cap_or_target": {
            "trajectory": "Upstream obligation on fuel suppliers; surrender from 2028 for "
                          "2027 emissions; 2027 start can slip to 2028 if energy prices "
                          "are exceptionally high (Directive trigger) — verify",
            "price_containment": "If price > EUR 45/t (2020 prices, indexed) for a sustained "
                                 "period, 20M extra allowances released from ETS2 MSR "
                                 "(soft cap / BRM); Social Climate Fund funded from revenues",
        },
        "offset_rules": {"eligible_units": [], "limit_pct_of_obligation": 0.0,
                         "notes": "No offset provision."},
        "linkage": "None; possible ETS1 merger review ~2031",
        "ets_ref_id": None,
        "key_params": {"upstream": True, "social_climate_fund_bn_eur": 65},
    },
    {
        "id": "china_ets",
        "name": "China National ETS",
        "jurisdiction": "People's Republic of China",
        "level": "national",
        "type": "intensity_rate_based",
        "status": "operating",
        "start_year": 2021,
        "coverage_sectors": ["power (2021)", "steel, cement, aluminium smelting (2025 expansion)"],
        "covered_emissions_mt": 8000,
        "share_of_jurisdiction_ghg_pct": 60,
        "price": {"usd_per_t": 11.0, "local": 80.0, "currency": "CNY",
                  "as_of": "~2025 CEA, range CNY 70-100", "approx": True},
        "cap_or_target": {
            "trajectory": "Intensity-based (tCO2 per unit output benchmarks, e.g. "
                          "~0.877 tCO2/MWh coal power) — no absolute cap; allocation "
                          "= output x benchmark, tightening over time",
        },
        "offset_rules": {
            "eligible_units": ["CCER"],
            "limit_pct_of_obligation": 5.0,
            "notes": "CCERs (China Certified Emission Reductions) up to 5% of the "
                     "compliance obligation; CCER issuance restarted 2023-24 "
                     "(new methodologies: forestry, solar thermal, offshore wind, mangroves).",
        },
        "linkage": "None; regional pilots (Guangdong, Hubei, Beijing, Shanghai...) run in parallel",
        "ets_ref_id": "china_ets",
        "key_params": {"regulator": "MEE", "entities_approx": 3700,
                       "note": "power ~5,100 Mt + 2025 expansion adds roughly 3,000 Mt (approx)"},
    },
    {
        "id": "korea_ets",
        "name": "Korea Emissions Trading Scheme (K-ETS)",
        "jurisdiction": "Republic of Korea",
        "level": "national",
        "type": "cap_and_trade",
        "status": "operating",
        "start_year": 2015,
        "coverage_sectors": ["power", "industry", "buildings", "waste", "transport", "domestic aviation"],
        "covered_emissions_mt": 550,
        "share_of_jurisdiction_ghg_pct": 74,
        "price": {"usd_per_t": 6.5, "local": 8800, "currency": "KRW",
                  "as_of": "~2025 KAU, range KRW 7,000-12,000", "approx": True},
        "cap_or_target": {
            "cap_note": "Phase 3 (2021-2025) average annual cap ~590 Mt (approx); "
                        "Phase 4 (2026-2030) allocation plan under preparation — verify",
        },
        "offset_rules": {
            "eligible_units": ["KOC"],
            "limit_pct_of_obligation": 5.0,
            "notes": "Korean Offset Credits (KOC, converted to KCU) up to 5% of obligation "
                     "in Phase 3 (down from 10% in Phase 2); international credits from "
                     "Korean-developed overseas projects allowed within the same 5%.",
        },
        "linkage": "None",
        "ets_ref_id": "korea_ets",
        "key_params": {"paid_allocation_pct_non_eite": 10},
    },
    {
        "id": "india_ccts",
        "name": "India Carbon Credit Trading Scheme (CCTS)",
        "jurisdiction": "India",
        "level": "national",
        "type": "intensity_rate_based",
        "status": "legislated — first compliance cycle 2025-26, CCC trading expected 2026",
        "start_year": 2026,
        "coverage_sectors": ["aluminium", "cement", "chlor-alkali", "pulp & paper "
                             "(first tranche; iron & steel, fertiliser, refinery, "
                             "petrochemicals, textiles to follow)"],
        "covered_emissions_mt": 250,
        "share_of_jurisdiction_ghg_pct": 8,
        "price": {"usd_per_t": None, "local": None, "currency": "INR",
                  "as_of": "no market price yet — CCC trading expected from 2026", "approx": True},
        "cap_or_target": {
            "trajectory": "GHG Emission Intensity (GEI) targets notified 2025 (draft rules) "
                          "for obligated entities (~280 entities first tranche, approx); "
                          "beat target -> earn Carbon Credit Certificates (CCC); miss -> "
                          "buy CCCs or pay environmental compensation",
        },
        "offset_rules": {
            "eligible_units": ["CCC"],
            "limit_pct_of_obligation": 100.0,
            "notes": "CCCs ARE the compliance instrument (tradable performance scheme); "
                     "a parallel offset mechanism lets non-obligated entities earn CCCs "
                     "from approved project types.",
        },
        "linkage": "None; predecessor PAT scheme ESCerts being subsumed",
        "ets_ref_id": None,
        "key_params": {"regulator": "Bureau of Energy Efficiency (BEE) / Ministry of Power",
                       "registry": "Grid Controller of India; trading on power exchanges",
                       "legal_basis": "Energy Conservation (Amendment) Act 2022; CCTS notified June 2023"},
    },
    {
        "id": "aus_safeguard",
        "name": "Australia Safeguard Mechanism (reformed)",
        "jurisdiction": "Australia",
        "level": "national",
        "type": "baseline_and_credit",
        "status": "operating (reformed rules from July 2023)",
        "start_year": 2016,
        "coverage_sectors": ["facilities > 100 ktCO2e/yr scope 1 (mining, LNG, metals, "
                             "chemicals, transport, waste) — ~219 facilities"],
        "covered_emissions_mt": 140,
        "share_of_jurisdiction_ghg_pct": 28,
        "price": {"usd_per_t": 23.0, "local": 35.0, "currency": "AUD",
                  "as_of": "~2025 ACCU spot, range AUD 30-42", "approx": True},
        "cap_or_target": {
            "trajectory": "Facility baselines decline 4.9%/yr to 2030; hybrid "
                          "site-specific -> industry-average transition; hard cap on "
                          "aggregate net emissions (5-yr rolling)",
        },
        "offset_rules": {
            "eligible_units": ["ACCU", "SMC"],
            "limit_pct_of_obligation": 100.0,
            "notes": "ACCUs usable without percentage limit; Safeguard Mechanism Credits "
                     "(SMC) issued to below-baseline facilities; cost containment: "
                     "government ACCU sales at AUD 75 (2023-24) indexed CPI+2%; "
                     "facilities using ACCUs for >30% of baseline must explain (disclosure).",
        },
        "linkage": "None international",
        "ets_ref_id": None,
        "key_params": {"borrowing_pct": 10, "regulator": "Clean Energy Regulator"},
    },
    {
        "id": "japan_gx_ets",
        "name": "Japan GX-ETS (GX League)",
        "jurisdiction": "Japan",
        "level": "national",
        "type": "baseline_and_credit -> cap_and_trade (phased)",
        "status": "Phase 1 voluntary (FY2023-2025); mandatory Phase 2 from FY2026",
        "start_year": 2023,
        "coverage_sectors": ["GX League participants (~700+ companies, >50% of national "
                             "emissions represented, approx)"],
        "covered_emissions_mt": 550,
        "share_of_jurisdiction_ghg_pct": 50,
        "price": {"usd_per_t": None, "local": None, "currency": "JPY",
                  "as_of": "thin voluntary-phase trading; no reference price", "approx": True},
        "cap_or_target": {
            "trajectory": "Phase 1: self-set targets vs NDC-aligned benchmarks; Phase 2 "
                          "(FY2026): mandatory for large emitters (~100 ktCO2+/yr, 2025 GX "
                          "Act amendment); power-sector allowance auctions from FY2033; "
                          "fossil-fuel surcharge (carbon levy) on importers from FY2028",
        },
        "offset_rules": {
            "eligible_units": ["J_CREDIT", "JCM"],
            "limit_pct_of_obligation": 100.0,
            "notes": "J-Credits and bilateral JCM credits usable in Phase 1 (voluntary); "
                     "quantitative limits for the mandatory phase not yet finalised — verify.",
        },
        "linkage": "JCM bilateral crediting with ~29 partner countries feeds in",
        "ets_ref_id": None,
        "key_params": {"legal_basis": "GX Promotion Act 2023, amended 2025"},
    },
    {
        "id": "singapore_tax",
        "name": "Singapore Carbon Tax",
        "jurisdiction": "Singapore",
        "level": "national",
        "type": "carbon_tax",
        "status": "operating",
        "start_year": 2019,
        "coverage_sectors": ["facilities >= 25 ktCO2e/yr direct emissions (power, "
                             "refining, chemicals, semiconductors...)"],
        "covered_emissions_mt": 40,
        "share_of_jurisdiction_ghg_pct": 80,
        "price": {"usd_per_t": 19.0, "local": 25.0, "currency": "SGD",
                  "as_of": "statutory SGD 25 (2024-25)", "approx": True},
        "cap_or_target": {
            "trajectory": "SGD 5 (2019-2023) -> 25 (2024-2025) -> 45 (2026-2027) -> "
                          "50-80 by 2030 (announced path)",
        },
        "offset_rules": {
            "eligible_units": ["A6_ICC"],
            "limit_pct_of_obligation": 5.0,
            "notes": "International Carbon Credits (Article 6-authorized, correspondingly "
                     "adjusted, from whitelisted host countries/programmes on the "
                     "Singapore eligibility list) can offset up to 5% of taxable emissions.",
        },
        "linkage": "Article 6.2 implementation agreements (Ghana, Papua New Guinea, "
                   "Bhutan; more under negotiation)",
        "ets_ref_id": None,
        "key_params": {"regulator": "NEA", "transition_framework": "allowances for EITE sectors"},
    },
    {
        "id": "mexico_ets",
        "name": "Mexico ETS (pilot / transition)",
        "jurisdiction": "Mexico",
        "level": "national",
        "type": "cap_and_trade",
        "status": "pilot 2020-22, transition phase; operational phase pending — status uncertain, verify",
        "start_year": 2020,
        "coverage_sectors": ["power + industry facilities >= 100 ktCO2/yr direct (~300 entities)"],
        "covered_emissions_mt": 270,
        "share_of_jurisdiction_ghg_pct": 40,
        "price": {"usd_per_t": None, "local": None, "currency": "MXN",
                  "as_of": "no functioning price signal (100% free allocation in pilot)", "approx": True},
        "cap_or_target": {
            "trajectory": "Pilot: 100% free allocation, cap set administratively; "
                          "operational-phase rules (auctioning, decline rate) not yet issued",
        },
        "offset_rules": {
            "eligible_units": ["MX_OFFSET"],
            "limit_pct_of_obligation": 10.0,
            "notes": "Pilot rules contemplate domestic offset protocols up to ~10% of "
                     "obligation — LOW CONFIDENCE, final operational rules pending; verify.",
        },
        "linkage": "None",
        "ets_ref_id": None,
        "key_params": {"regulator": "SEMARNAT"},
    },
    {
        "id": "corsia",
        "name": "CORSIA (international aviation, ICAO)",
        "jurisdiction": "International aviation (ICAO member states)",
        "level": "international sectoral",
        "type": "baseline_and_credit (offsetting scheme)",
        "status": "First Phase 2024-2026 (voluntary state participation)",
        "start_year": 2021,
        "coverage_sectors": ["international aviation CO2 on routes between participating states"],
        "covered_emissions_mt": 500,
        "share_of_jurisdiction_ghg_pct": None,
        "price": {"usd_per_t": 20.0, "local": 20.0, "currency": "USD",
                  "as_of": "~2025 CORSIA-eligible EEU indications, thin market", "approx": True},
        "cap_or_target": {
            "trajectory": "Phases: Pilot 2021-23, First 2024-26 (voluntary, ~126 states), "
                          "Second 2027-35 (mandatory, exemptions for LDC/SIDS/LLDC/low "
                          "activity). Baseline = 85% of 2019 CO2 from 2024; sectoral + "
                          "individual growth-factor offsetting requirements",
        },
        "offset_rules": {
            "eligible_units": ["CORSIA_EEU"],
            "limit_pct_of_obligation": 100.0,
            "notes": "Obligation is met 100% with Eligible Emissions Units approved by the "
                     "ICAO Technical Advisory Body; First Phase EEUs must carry host-country "
                     "authorization / corresponding adjustment (as of ~2025 only a small set "
                     "of programmes, incl. ACR and ART-TREES, approved — verify current TAB list). "
                     "SAF/lower-carbon fuel use reduces the offsetting requirement.",
        },
        "linkage": "Consumes Article 6-adjusted units; EU/UK apply ETS to intra-EEA/UK routes instead",
        "ets_ref_id": None,
        "key_params": {"regulator": "ICAO", "surrender_deadline_first_phase": 2028},
    },
]

SCHEME_BY_ID = {s["id"]: s for s in SCHEMES}


@router.get("/schemes")
async def get_schemes() -> Dict[str, Any]:
    """Compliance/national carbon mechanism atlas — hand-authored extract."""
    return {
        "label": EXTRACT_LABEL,
        "schemes": SCHEMES,
        "total_schemes": len(SCHEMES),
        "global_context": {
            "carbon_pricing_share_of_global_ghg_pct": 24,
            "ets_share_of_global_ghg_pct": 18,
            "instruments_in_force": 75,
            "global_carbon_revenue_2023_bn_usd": 104,
            "basis": "World Bank State & Trends of Carbon Pricing 2024 + ICAP Status "
                     "Report 2024 — approximate, verify",
        },
        "reconciliation": {
            "extends": "/api/v1/carbon-price-ets/ref/ets-systems (E71) — 6 ETS covered there "
                        "(eu_ets, uk_ets, california, china_ets, rggi, korea_ets) carry an "
                        "ets_ref_id cross-reference; this extract adds EU ETS2, India CCTS, "
                        "Australia Safeguard, Japan GX-ETS, Singapore carbon tax, Mexico ETS "
                        "pilot, CORSIA, and per-scheme offset/credit eligibility rules.",
            "price_note": "Where both endpoints quote a price they are independent approximate "
                          "snapshots and may differ modestly; treat both as indicative.",
        },
    }


# ---------------------------------------------------------------------------
# 2) Article 6 reference — Paris rulebook parameters (hand-authored extract)
# ---------------------------------------------------------------------------

ARTICLE6: Dict[str, Any] = {
    "label": EXTRACT_LABEL + " — rulebook parameters per CMA decisions cited",
    "article_6_2": {
        "name": "Article 6.2 — Cooperative approaches (ITMOs)",
        "decision_basis": "Decision 2/CMA.3 (Glasgow, 2021); further guidance Decision 6/CMA.4; "
                          "operational details CMA.6 (Baku, 2024)",
        "unit": "ITMO (Internationally Transferred Mitigation Outcome) — tCO2e or other NDC metrics",
        "authorization": "Host Party authorizes mitigation outcomes for use toward NDCs, "
                         "international mitigation purposes (OIMP, e.g. CORSIA) and/or other "
                         "purposes; scope/terms (incl. revocation conditions) set by the host",
        "corresponding_adjustments": {
            "rule": "Host applies an ADDITION to its emissions balance, acquiring Party a "
                    "SUBTRACTION, in the structured summary of the Biennial Transparency Report",
            "single_year_ndc": "averaging approach or trajectory/budget method, consistent "
                               "over the NDC period",
            "multi_year_ndc": "annual application over the NDC period",
        },
        "first_transfer_definitions": {
            "use_toward_ndc": "first transfer = the international transfer itself",
            "oimp_or_other": "host may define first transfer as authorization, issuance, "
                             "or use/cancellation (election in initial report)",
        },
        "reporting_infrastructure": [
            "Initial report (before/with first transfer)",
            "Annual Information (AIR) to the Centralized Accounting and Reporting Platform (CARP)",
            "Regular information in Biennial Transparency Reports",
            "Article 6 technical expert review",
        ],
        "share_of_proceeds": "Not mandatory under 6.2 (Parties 'strongly encouraged' to "
                             "contribute to adaptation funding)",
        "omge": "Not mandatory under 6.2 (encouraged)",
    },
    "article_6_4": {
        "name": "Article 6.4 — Paris Agreement Crediting Mechanism (PACM)",
        "decision_basis": "Decision 3/CMA.3 (Glasgow, 2021); methodology + removals standards "
                          "adopted CMA.6 (Baku, 2024) — mechanism operational ~2025",
        "unit": "A6.4ER",
        "unit_classes": {
            "authorized_a64er": "Host-authorized, corresponding adjustment applied — usable "
                                "toward other Parties' NDCs, CORSIA, and authorized uses",
            "mitigation_contribution_unit": "'Mitigation contribution' A6.4ERs (MCUs) — NO "
                                            "corresponding adjustment; contribute to the HOST "
                                            "Party's NDC; usable for results-based finance / "
                                            "domestic schemes, not international claims",
        },
        "share_of_proceeds_pct": 5.0,
        "share_of_proceeds_note": "5% of issued A6.4ERs delivered to the Adaptation Fund "
                                  "(plus monetary administration fees)",
        "omge_cancellation_pct": 2.0,
        "omge_note": "At least 2% of issuance mandatorily cancelled for Overall Mitigation "
                     "in Global Emissions (OMGE)",
        "governance": "UN Article 6.4 Supervisory Body; activity cycle: host approval + "
                      "authorization, validation, registration, verification, issuance; "
                      "5-year crediting periods (renewable twice) or 10-year fixed "
                      "(15/45 for removals per 2024 standards — verify)",
        "cdm_transition": "CDM activities could request transition (deadline end-2023); "
                          "pre-2021 CERs (2013-2020 vintage) usable toward FIRST NDC only, "
                          "flagged, no corresponding adjustment",
    },
    "buyer_programs": [
        {
            "buyer": "Switzerland",
            "program": "KliK Foundation (CO2 Act obligation on motor-fuel importers) + "
                       "federal purchases",
            "model": "Article 6.2 bilateral implementing agreements; KliK contracts ITMOs "
                     "to offset transport-fuel emissions",
            "example_agreements": [
                "Peru (Oct 2020 — first Art 6.2 implementing agreement worldwide)",
                "Ghana (2020)", "Senegal (2021)", "Georgia (2021)",
                "Thailand (2022) — Bangkok E-Bus programme delivered the first ITMO "
                "transfer under Article 6.2 (Jan 2024)",
                "Vanuatu, Dominica, Uruguay, Chile, Morocco, Ukraine (various 2021-2023)",
            ],
            "confidence": "high on the listed countries; full list evolves — verify",
        },
        {
            "buyer": "Singapore",
            "program": "Carbon-tax offset window (5% via eligible ICCs) + government procurement",
            "model": "Article 6.2 implementation agreements with eligibility lists per "
                     "host (whitelisted programmes/methodologies)",
            "example_agreements": [
                "Papua New Guinea (signed Dec 2023)", "Ghana (signed 2024)",
                "Bhutan (signed 2024, approx)",
            ],
            "confidence": "high on PNG/Ghana; several additional agreements/MOUs in "
                          "negotiation — verify current list",
        },
        {
            "buyer": "Japan",
            "program": "Joint Crediting Mechanism (JCM), since 2013 (Mongolia first partner)",
            "model": "Bilateral crediting: Japan finances technology deployment, credits "
                     "shared between governments/participants; JCM credits counted toward "
                     "Japan's NDC with corresponding adjustments under 6.2; feeds GX-ETS",
            "example_agreements": ["~29 partner countries incl. Mongolia, Vietnam, "
                                   "Indonesia, Thailand, Kenya, Bangladesh (approx count)"],
            "confidence": "high on mechanism design; partner count approximate",
        },
        {
            "buyer": "Other active sovereign buyers",
            "program": "Sweden (Swedish Energy Agency), Norway (NORAD/climate investment "
                       "fund), South Korea (KOC international window)",
            "model": "6.2 agreements / 6.4 pipeline participation",
            "example_agreements": [],
            "confidence": "programs exist; specific agreement lists omitted (not asserted)",
        },
    ],
    "corsia_interaction": "CORSIA First Phase requires EEUs with host-country authorization "
                          "and corresponding adjustment — de facto the largest near-term "
                          "demand source for authorized (6.2/6.4) units",
}


@router.get("/article6")
async def get_article6() -> Dict[str, Any]:
    """Article 6 mechanism structure — real Paris rulebook parameters (labeled)."""
    return ARTICLE6


# ---------------------------------------------------------------------------
# 3) ITMO / A6.4ER pricing model
# ---------------------------------------------------------------------------

class ITMOPriceRequest(BaseModel):
    base_credit_price_usd: float = Field(12.0, gt=0, description="Underlying credit price before Article 6 layers (USD/t)")
    mechanism: str = Field("6.4_authorized", description="'6.2' | '6.4_authorized' | '6.4_mcu'")
    authorization_premium_pct: float = Field(30.0, ge=0, le=200,
                                             description="Premium for host authorization + CA (% of base)")
    ca_risk_score: float = Field(30.0, ge=0, le=100,
                                 description="Host-country revocation/non-delivery risk score 0 (none) - 100 (max)")
    max_ca_discount_pct: float = Field(40.0, ge=0, le=90,
                                       description="Discount applied at risk score 100 (% of base+premium)")
    apply_sop_62: bool = Field(False, description="Voluntarily apply SoP/OMGE to a 6.2 ITMO (encouraged, not mandatory)")
    transaction_cost_usd: float = Field(1.5, ge=0)
    mrv_cost_usd: float = Field(1.0, ge=0)
    domestic_abatement_cost_usd: Optional[float] = Field(None, gt=0,
                                                         description="Buyer's marginal domestic abatement cost (USD/t)")


@router.post("/itmo-price")
async def itmo_price(req: ITMOPriceRequest) -> Dict[str, Any]:
    """
    Landed-cost build-up for one delivered (retired/usable) Article 6 unit.

    Documented model (all closed-form, deterministic):
      base                 B   = user base credit price
      authorization premium P  = B x premium_pct           (authorized units only —
                                 host authorization + corresponding adjustment scarcity)
      CA-risk discount     D   = -(B+P) x (score/100) x max_discount_pct
                                 Linear map: score 0 -> 0% discount, 100 -> max_discount_pct
                                 (default 40%). Buyers pay less for units whose host
                                 authorization could be revoked / CA not applied —
                                 modeling assumption, labeled.
      net unit price       N   = B + P + D  (price per ISSUED unit)
      6.4 levies (Decision 3/CMA.3): SoP 5% of issuance to Adaptation Fund,
      OMGE >= 2% cancelled. Per DELIVERED unit the buyer funds 1/(1-s-o) issued units:
        sop_cost  = N x s/(1-s-o) ;  omge_cost = N x o/(1-s-o)
      landed = N/(1-s-o) + txn + mrv  ==  B + P + D + sop + omge + txn + mrv (exact)
    """
    mech = req.mechanism
    if mech not in ("6.2", "6.4_authorized", "6.4_mcu"):
        raise HTTPException(status_code=422, detail="mechanism must be '6.2', '6.4_authorized' or '6.4_mcu'")

    B = req.base_credit_price_usd
    authorized = mech in ("6.2", "6.4_authorized")
    P = B * req.authorization_premium_pct / 100.0 if authorized else 0.0
    disc_pct = (req.ca_risk_score / 100.0) * (req.max_ca_discount_pct / 100.0) if authorized else 0.0
    D = -(B + P) * disc_pct
    N = B + P + D

    if mech == "6.4_authorized" or mech == "6.4_mcu":
        s, o = 0.05, 0.02  # Decision 3/CMA.3: SoP 5% + OMGE 2% apply at ISSUANCE for all A6.4ERs
    elif mech == "6.2" and req.apply_sop_62:
        s, o = 0.05, 0.02  # voluntary application, mirroring 6.4 levels
    else:
        s, o = 0.0, 0.0

    denom = 1.0 - s - o
    sop_cost = N * s / denom
    omge_cost = N * o / denom
    landed = N / denom + req.transaction_cost_usd + req.mrv_cost_usd

    components = [
        {"component": "Base credit price", "usd_per_t": round(B, 4)},
        {"component": "Authorization + CA premium", "usd_per_t": round(P, 4)},
        {"component": "CA-revocation risk discount", "usd_per_t": round(D, 4)},
        {"component": "Share of Proceeds (5% Adaptation Fund)" if s else "Share of Proceeds (n/a)",
         "usd_per_t": round(sop_cost, 4)},
        {"component": "OMGE 2% cancellation" if o else "OMGE (n/a)", "usd_per_t": round(omge_cost, 4)},
        {"component": "Transaction cost", "usd_per_t": round(req.transaction_cost_usd, 4)},
        {"component": "MRV / issuance cost", "usd_per_t": round(req.mrv_cost_usd, 4)},
    ]
    check = sum(c["usd_per_t"] for c in components)

    verdict = None
    if req.domestic_abatement_cost_usd:
        a = req.domestic_abatement_cost_usd
        if landed < 0.9 * a:
            verdict = {"decision": "BUY (import units)", "reason": f"landed {landed:.2f} < 90% of abatement {a:.2f}"}
        elif landed > 1.1 * a:
            verdict = {"decision": "ABATE domestically", "reason": f"landed {landed:.2f} > 110% of abatement {a:.2f}"}
        else:
            verdict = {"decision": "MARGINAL — mixed strategy", "reason": f"landed {landed:.2f} within +/-10% of abatement {a:.2f}"}
        verdict["landed_cost_usd_t"] = round(landed, 4)
        verdict["domestic_abatement_usd_t"] = round(a, 4)
        verdict["saving_usd_t_if_buy"] = round(a - landed, 4)

    return {
        "mechanism": mech,
        "waterfall": components,
        "landed_cost_usd_per_delivered_t": round(landed, 4),
        "components_sum_check": round(check, 4),
        "issued_units_per_delivered": round(1.0 / denom, 6),
        "effective_ca_discount_pct": round(disc_pct * 100.0, 4),
        "buy_vs_abate": verdict,
        "methodology": {
            "ca_discount_mapping": "linear: discount% = (risk_score/100) x max_ca_discount_pct "
                                   "applied to (base + premium); score 0 -> no discount "
                                   "(modeling assumption, labeled)",
            "levies": "SoP 5% + OMGE 2% at issuance (Decision 3/CMA.3) -> gross-up 1/(1-0.07) "
                      "issued per delivered unit; 6.2 voluntary via apply_sop_62",
            "note": "Deterministic closed-form; premiums/discounts are desk assumptions, "
                    "not observed market quotes",
        },
    }


# ---------------------------------------------------------------------------
# 4) Multi-scheme compliance-cost calculator
# ---------------------------------------------------------------------------

class SchemePosition(BaseModel):
    scheme_id: str
    covered_emissions_tco2: float = Field(..., ge=0)
    free_allocation_tco2: float = Field(0.0, ge=0, description="Cap-and-trade: free allowances received")
    baseline_allowed_tco2: Optional[float] = Field(None, ge=0,
                                                   description="Intensity/baseline schemes: allowed emissions "
                                                               "(output x benchmark, or facility baseline)")
    carbon_price_override_usd: Optional[float] = Field(None, gt=0,
                                                       description="Override the atlas price (e.g. India CCC assumption)")


class OffsetUnit(BaseModel):
    unit_type: str = Field(..., description="e.g. CCER, KOC, ACCU, CCO, A6_ICC, CORSIA_EEU, CCC")
    price_usd: float = Field(..., gt=0)
    volume_tco2: float = Field(..., ge=0)


class ComplianceCostRequest(BaseModel):
    entity_name: str = "Entity"
    positions: List[SchemePosition]
    offset_portfolio: List[OffsetUnit] = Field(default_factory=list)


def _scheme_price_usd(scheme: Dict[str, Any], override: Optional[float]) -> Optional[float]:
    if override:
        return override
    return scheme["price"].get("usd_per_t")


@router.post("/compliance-cost")
async def compliance_cost(req: ComplianceCostRequest) -> Dict[str, Any]:
    """
    Per-scheme obligation + optimal offset utilization + total compliance cost.

    Documented algorithm (deterministic greedy):
      1. Gross obligation per scheme by TYPE:
           cap_and_trade      : max(0, emissions - free allocation)
           intensity / baseline: max(0, emissions - baseline_allowed)  (surplus -> credits, cost 0)
           carbon_tax         : emissions (tax on all covered emissions)
      2. Offset cap per scheme = limit_pct_of_obligation x gross obligation
         (limits from /schemes offset_rules).
      3. Greedy: schemes processed in DESCENDING carbon-price order (cheap offsets
         deployed where they displace the most expensive obligation first); within a
         scheme, eligible units consumed cheapest-first, only while the offset price
         is BELOW the scheme carbon price, never beyond the scheme's % cap nor the
         remaining portfolio volume.
      4. Residual obligation x scheme carbon price + offsets used x offset price.
      5. Marginal cost per scheme = min(scheme price, cheapest remaining eligible
         offset with headroom under the % cap), i.e. the cost of one more tonne.
    """
    # Validate schemes + collect prices
    prepared = []
    for pos in req.positions:
        scheme = SCHEME_BY_ID.get(pos.scheme_id)
        if not scheme:
            raise HTTPException(status_code=422, detail=f"Unknown scheme_id '{pos.scheme_id}'. "
                                                        f"Valid: {sorted(SCHEME_BY_ID)}")
        price = _scheme_price_usd(scheme, pos.carbon_price_override_usd)
        if price is None:
            raise HTTPException(status_code=422,
                                detail=f"Scheme '{pos.scheme_id}' has no market price yet — "
                                       f"supply carbon_price_override_usd")
        stype = scheme["type"]
        if "cap_and_trade" in stype:
            gross = max(0.0, pos.covered_emissions_tco2 - pos.free_allocation_tco2)
        elif "intensity" in stype or "baseline" in stype:
            allowed = pos.baseline_allowed_tco2 if pos.baseline_allowed_tco2 is not None else 0.0
            gross = max(0.0, pos.covered_emissions_tco2 - allowed)
        elif stype == "carbon_tax":
            gross = pos.covered_emissions_tco2
        else:  # defensive
            gross = pos.covered_emissions_tco2
        limit_pct = scheme["offset_rules"]["limit_pct_of_obligation"]
        prepared.append({
            "pos": pos, "scheme": scheme, "price": price, "gross": gross,
            "offset_cap_t": gross * limit_pct / 100.0,
            "eligible": set(scheme["offset_rules"]["eligible_units"]),
        })

    # Shared offset inventory (volumes consumed across schemes)
    inventory = [{"unit_type": o.unit_type, "price_usd": o.price_usd, "remaining": o.volume_tco2}
                 for o in sorted(req.offset_portfolio, key=lambda o: o.price_usd)]

    results = []
    # Greedy: descending scheme price
    for item in sorted(prepared, key=lambda x: -x["price"]):
        scheme, price, gross = item["scheme"], item["price"], item["gross"]
        cap_t, eligible = item["offset_cap_t"], item["eligible"]
        used = []
        used_t = 0.0
        for lot in inventory:  # already price-ascending
            if used_t >= cap_t:
                break
            if lot["unit_type"] not in eligible or lot["remaining"] <= 0:
                continue
            if lot["price_usd"] >= price:
                continue  # offset not cheaper than compliance instrument — skip
            take = min(lot["remaining"], cap_t - used_t)
            if take <= 0:
                continue
            lot["remaining"] -= take
            used_t += take
            used.append({"unit_type": lot["unit_type"], "tco2": round(take, 4),
                         "price_usd": lot["price_usd"], "cost_usd": round(take * lot["price_usd"], 2)})
        residual = gross - used_t
        offset_cost = sum(u["cost_usd"] for u in used)
        allowance_cost = residual * price
        # marginal cost of one more tonne
        headroom = cap_t - used_t
        cheapest_remaining = min((l["price_usd"] for l in inventory
                                  if l["unit_type"] in eligible and l["remaining"] > 0),
                                 default=None)
        marginal = price
        if headroom > 1e-9 and cheapest_remaining is not None and cheapest_remaining < price:
            marginal = cheapest_remaining
        results.append({
            "scheme_id": scheme["id"], "scheme_name": scheme["name"], "type": scheme["type"],
            "carbon_price_usd_t": price,
            "covered_emissions_tco2": item["pos"].covered_emissions_tco2,
            "gross_obligation_tco2": round(gross, 4),
            "offset_limit_pct": scheme["offset_rules"]["limit_pct_of_obligation"],
            "offset_cap_tco2": round(cap_t, 4),
            "offsets_used_tco2": round(used_t, 4),
            "offset_utilization_pct_of_cap": round(100.0 * used_t / cap_t, 2) if cap_t > 0 else 0.0,
            "offsets_used_detail": used,
            "residual_obligation_tco2": round(residual, 4),
            "offset_cost_usd": round(offset_cost, 2),
            "allowance_or_tax_cost_usd": round(allowance_cost, 2),
            "total_cost_usd": round(offset_cost + allowance_cost, 2),
            "marginal_cost_usd_t": round(marginal, 4),
            "savings_vs_no_offsets_usd": round(used_t * price - offset_cost, 2),
        })

    total = sum(r["total_cost_usd"] for r in results)
    return {
        "entity_name": req.entity_name,
        "per_scheme": results,
        "total_compliance_cost_usd": round(total, 2),
        "total_savings_from_offsets_usd": round(sum(r["savings_vs_no_offsets_usd"] for r in results), 2),
        "offset_inventory_remaining": [
            {"unit_type": l["unit_type"], "price_usd": l["price_usd"],
             "remaining_tco2": round(l["remaining"], 4)} for l in inventory
        ],
        "methodology": {
            "obligation": "cap: emissions - free allocation; intensity/baseline: emissions - "
                          "allowed; tax: all covered emissions",
            "offset_optimization": "greedy — schemes in descending price order, units "
                                   "cheapest-first, clipped at each scheme's % limit, only "
                                   "when offset price < scheme carbon price (documented, "
                                   "deterministic; not a full LP but optimal when eligibility "
                                   "sets rarely overlap)",
            "price_basis": EXTRACT_LABEL,
        },
    }


# ---------------------------------------------------------------------------
# 5) Cross-border / compliance-vs-voluntary arbitrage analytics
# ---------------------------------------------------------------------------

# Default indicative unit prices (USD/t) — hand-authored, labeled, ~2025 levels.
DEFAULT_UNIT_PRICES: Dict[str, float] = {
    "EUA": 75.0, "UKA": 50.0, "CCA": 30.0, "RGGI_ALLOWANCE": 21.0,
    "KAU": 6.5, "CEA": 11.0, "ACCU": 23.0, "CCER": 9.0, "KOC": 6.0,
    "A64ER_AUTHORIZED": 25.0, "A6_ICC": 22.0, "CORSIA_EEU": 20.0,
    "VCM_NATURE": 8.0, "VCM_COOKSTOVE": 5.0, "VCM_ENGINEERED_REMOVAL": 180.0,
    "CCO": 15.0, "SMC": 22.0, "J_CREDIT": 15.0, "JCM": 10.0,
}

# Which unit can legally be surrendered in which scheme (from /schemes rules).
# Allowances are usable in their own scheme + linked schemes; offsets per
# offset_rules.eligible_units. Hand-maintained to mirror SCHEMES above.
UNIT_ELIGIBILITY: Dict[str, List[str]] = {
    "EUA": ["eu_ets"],                       # + Swiss ETS via link (not in atlas)
    "UKA": ["uk_ets"],
    "CCA": ["wci_ca_qc"],                    # CA-QC fungible under WCI
    "RGGI_ALLOWANCE": ["rggi"],
    "KAU": ["korea_ets"],
    "CEA": ["china_ets"],
    "ACCU": ["aus_safeguard"],
    "SMC": ["aus_safeguard"],
    "CCER": ["china_ets"],
    "KOC": ["korea_ets"],
    "CCO": ["wci_ca_qc"],
    "A6_ICC": ["singapore_tax"],             # authorized+CA'd, whitelisted hosts, <=5%
    "A64ER_AUTHORIZED": ["singapore_tax", "corsia"],  # if on the respective eligibility lists
    "CORSIA_EEU": ["corsia"],
    "J_CREDIT": ["japan_gx_ets"],
    "JCM": ["japan_gx_ets"],
    "VCM_NATURE": [],                        # voluntary only — no compliance surrender
    "VCM_COOKSTOVE": [],
    "VCM_ENGINEERED_REMOVAL": [],
}

# Documented fungibility discounts (fraction of value lost when a unit is moved
# to its NEXT-BEST compliance/voluntary use) — desk reasoning, labeled.
FUNGIBILITY_DISCOUNTS: List[Dict[str, Any]] = [
    {"unit": "EUA", "discount_pct": 0, "reasoning": "Deepest, most liquid compliance unit; "
     "fully bankable within EU ETS; Swiss link adds a second (small) outlet."},
    {"unit": "CCA", "discount_pct": 5, "reasoning": "CA-QC fungibility is complete, but "
     "regulatory-reform risk (program review) adds a modest holding discount."},
    {"unit": "ACCU", "discount_pct": 15, "reasoning": "Domestic-only demand (Safeguard + "
     "government purchasing); method-integrity debates (HIR) create tiering; no "
     "international surrender route."},
    {"unit": "CCER", "discount_pct": 60, "reasoning": "Usable only inside China ETS (5% cap); "
     "no international recognition; capital controls impede cross-border settlement."},
    {"unit": "KOC", "discount_pct": 50, "reasoning": "Korea-only demand within 5% cap; thin "
     "liquidity; conversion (KOC->KCU) administrative steps."},
    {"unit": "A64ER_AUTHORIZED", "discount_pct": 10, "reasoning": "Multi-market (CORSIA, "
     "Singapore tax, sovereign buyers) but eligibility-list and revocation risk remain."},
    {"unit": "CORSIA_EEU", "discount_pct": 10, "reasoning": "Airline demand is phase-driven "
     "and TAB list can change between phases; CA'd units retain sovereign-buyer fallback."},
    {"unit": "VCM_NATURE", "discount_pct": 70, "reasoning": "No compliance surrender route "
     "(unless later authorized under 6.2); integrity re-rating risk; corporate demand only."},
    {"unit": "VCM_ENGINEERED_REMOVAL", "discount_pct": 20, "reasoning": "No compliance route "
     "today but strong forward corporate demand and likely future scheme eligibility "
     "(EU CRCF trajectory) support value retention."},
]


class CrossBorderRequest(BaseModel):
    unit_prices_usd: Dict[str, float] = Field(default_factory=dict,
                                              description="Override/extend default indicative unit prices (USD/t)")
    min_spread_usd: float = Field(2.0, ge=0, description="Minimum net spread to flag an arbitrage candidate")


@router.post("/cross-border")
async def cross_border(req: CrossBorderRequest) -> Dict[str, Any]:
    """
    Compliance-vs-voluntary arbitrage analytics.

    Documented model:
      * scheme_price_matrix[i][j] = price_i - price_j over all schemes with a live
        price (antisymmetric by construction) — the max theoretical value transfer
        if a unit were fungible between markets i and j.
      * eligibility matrix: unit x scheme surrender-eligibility (mirrors /schemes rules).
      * arbitrage candidates: unit u eligible in scheme s where
          net = scheme_price(s) - unit_price(u) - fungibility_discount(u) x unit_price(u)
        exceeds min_spread — i.e. buying the unit and surrendering it in s beats
        buying the scheme's own allowance, after the documented fungibility haircut.
        Respect of % usage caps is handled in /compliance-cost, not here.
    """
    for k, v in req.unit_prices_usd.items():
        if v <= 0:
            raise HTTPException(status_code=422, detail=f"unit price for '{k}' must be > 0")
    prices = {**DEFAULT_UNIT_PRICES, **req.unit_prices_usd}

    schemes_priced = [(s["id"], s["price"]["usd_per_t"]) for s in SCHEMES
                      if s["price"].get("usd_per_t") is not None]
    ids = [sid for sid, _ in schemes_priced]
    pmap = dict(schemes_priced)
    matrix = {a: {b: round(pmap[a] - pmap[b], 4) for b in ids} for a in ids}

    eligibility = {u: {sid: (sid in UNIT_ELIGIBILITY.get(u, [])) for sid in SCHEME_BY_ID}
                   for u in prices}

    disc_map = {d["unit"]: d["discount_pct"] for d in FUNGIBILITY_DISCOUNTS}
    candidates = []
    for u, up in prices.items():
        for sid in UNIT_ELIGIBILITY.get(u, []):
            sp = pmap.get(sid)
            if sp is None:
                continue
            haircut = up * disc_map.get(u, 25) / 100.0  # 25% default haircut when not tabled (documented)
            net = sp - up - haircut
            if net >= req.min_spread_usd:
                scheme = SCHEME_BY_ID[sid]
                candidates.append({
                    "unit": u, "unit_price_usd": up,
                    "deliver_into": sid, "scheme_price_usd": sp,
                    "gross_spread_usd": round(sp - up, 4),
                    "fungibility_haircut_usd": round(haircut, 4),
                    "net_spread_usd": round(net, 4),
                    "usage_cap_pct_of_obligation": scheme["offset_rules"]["limit_pct_of_obligation"]
                    if u in scheme["offset_rules"]["eligible_units"] else 100.0,
                    "caveat": "subject to scheme % usage caps, eligibility lists and "
                              "delivery/settlement frictions — see fungibility table",
                })
    candidates.sort(key=lambda c: -c["net_spread_usd"])

    return {
        "label": EXTRACT_LABEL + " — unit prices indicative, hand-authored defaults unless overridden",
        "unit_prices_usd": prices,
        "scheme_prices_usd": pmap,
        "scheme_spread_matrix": matrix,
        "matrix_property": "antisymmetric: matrix[a][b] == -matrix[b][a] by construction",
        "eligibility_matrix": eligibility,
        "fungibility_discounts": FUNGIBILITY_DISCOUNTS,
        "default_haircut_pct_when_untabled": 25,
        "arbitrage_candidates": candidates,
        "methodology": {
            "spread": "scheme_price(a) - scheme_price(b); value transfer only realizable "
                      "where a unit is surrender-eligible in both markets (see eligibility)",
            "net_spread": "scheme_price - unit_price - fungibility_haircut(unit)",
            "note": "Deterministic; no PRNG. Compliance allowances (EUA/UKA/CCA/...) are "
                    "deliberately NON-fungible across schemes — the matrix quantifies the "
                    "shadow value of that segmentation, not an executable trade.",
        },
    }
