"""
Comprehensive Reporting Aggregator Engine (E119)
=================================================
Multi-framework sustainability reporting aggregation and compilation engine.

Sub-modules:
  1. Report Compilation — multi-framework report with completeness scoring + consistency checks
  2. ESRS Report Generation — full CSRD ESRS disclosure set (330 IG3 quantitative DPs)
  3. XBRL Tagging — EFRAG 2024 ESRS XBRL instance document generation
  4. Cross-Framework Consistency — 20 consistency rules across CSRD/IFRS/TCFD/GRI/SFDR
  5. Readiness Score — blocking vs advisory gaps, wave-specific readiness, priority actions

References:
  - CSRD Directive (EU) 2022/2464 — ESRS Set 1 (Commission Delegated Regulation (EU) 2023/2772)
  - EFRAG IG3 — Quantitative Mandatory Datapoints (ESRS Implementation Guidance 3, 2024)
  - EFRAG ESRS XBRL Taxonomy 2024 (ESRS-XBRL-2024-01-01)
  - IFRS S1 General Sustainability Disclosures / IFRS S2 Climate-Related Disclosures (effective 1 Jan 2024)
  - TCFD Recommendations (June 2017) + Annex (October 2021)
  - TNFD v1.0 Disclosure Framework (September 2023)
  - GRI Universal Standards 2021 (GRI 1, GRI 2, GRI 3) + GRI 300 Series
  - SFDR RTS 2022/1288 — Annex I (Art 8/9 pre-contractual) + Annex III (periodic)
  - ESAP Regulation (EU) 2023/2869 — European Single Access Point
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data — Cross-Framework DP Mapping Table (200+ entries)
# Keys: framework_ref, disclosure_type, mandatory_flag, source_engine, data_type
# ---------------------------------------------------------------------------

CROSS_FRAMEWORK_MAPPINGS: list[dict] = [
    # ---- ESRS E1 — Climate Change ----
    {"dp_id": "E1-1", "topic": "Transition plan for climate change mitigation", "esrs_ref": "ESRS E1-1", "ifrs_s2_ref": "S2-14", "tcfd_ref": "Strategy-b", "tnfd_ref": None, "gri_ref": "GRI 305", "sfdr_ref": "PAI-1", "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E26_TPT", "data_type": "narrative"},
    {"dp_id": "E1-4", "topic": "GHG reduction targets", "esrs_ref": "ESRS E1-4", "ifrs_s2_ref": "S2-33", "tcfd_ref": "Metrics-c", "tnfd_ref": None, "gri_ref": "GRI 305-5", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-5", "topic": "Energy consumption and mix", "esrs_ref": "ESRS E1-5", "ifrs_s2_ref": "S2-B29", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 302-1", "sfdr_ref": "PAI-5", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E24_ISSB_S2", "data_type": "metric"},
    {"dp_id": "E1-6_S1", "topic": "Scope 1 GHG emissions", "esrs_ref": "ESRS E1-6 §44(a)", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-1", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-6_S2", "topic": "Scope 2 GHG emissions (location-based)", "esrs_ref": "ESRS E1-6 §44(b)", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-2", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-6_S2_MB", "topic": "Scope 2 GHG emissions (market-based)", "esrs_ref": "ESRS E1-6 §44(b)", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-2", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-6_S3", "topic": "Scope 3 GHG emissions (all 15 categories)", "esrs_ref": "ESRS E1-6 §44(c)", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-3", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E21_Scope3", "data_type": "metric"},
    {"dp_id": "E1-6_GHGint", "topic": "GHG intensity per net revenue", "esrs_ref": "ESRS E1-6 §53", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-b", "tnfd_ref": None, "gri_ref": "GRI 305-4", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-7", "topic": "GHG removals and carbon credits", "esrs_ref": "ESRS E1-7", "ifrs_s2_ref": "S2-B59", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 305-5", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E30_Carbon_Quality", "data_type": "metric"},
    {"dp_id": "E1-8", "topic": "Internal carbon price", "esrs_ref": "ESRS E1-8", "ifrs_s2_ref": "S2-B29", "tcfd_ref": "Strategy-c", "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": False, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "E1-9_phy", "topic": "Physical climate risk — financial effects", "esrs_ref": "ESRS E1-9", "ifrs_s2_ref": "S2-16", "tcfd_ref": "Strategy-b", "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E31_Stress_Test", "data_type": "metric"},
    {"dp_id": "E1-9_trans", "topic": "Transition climate risk — financial effects", "esrs_ref": "ESRS E1-9", "ifrs_s2_ref": "S2-16", "tcfd_ref": "Strategy-b", "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E31_Stress_Test", "data_type": "metric"},

    # ---- ESRS E2 — Pollution ----
    {"dp_id": "E2-4_NOx", "topic": "Air pollutants — NOx emissions", "esrs_ref": "ESRS E2-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-D2", "gri_ref": "GRI 305-7", "sfdr_ref": "PAI-8", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E2-4_SOx", "topic": "Air pollutants — SOx emissions", "esrs_ref": "ESRS E2-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 305-7", "sfdr_ref": "PAI-8", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E2-4_PM25", "topic": "Air pollutants — PM2.5 emissions", "esrs_ref": "ESRS E2-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 305-7", "sfdr_ref": "PAI-8", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E2-4_sub", "topic": "Substances of concern emitted", "esrs_ref": "ESRS E2-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 306-3", "sfdr_ref": "PAI-9", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},

    # ---- ESRS E3 — Water ----
    {"dp_id": "E3-4_ww", "topic": "Water withdrawal total", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B3", "gri_ref": "GRI 303-3", "sfdr_ref": "PAI-6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E3-4_wd", "topic": "Water discharge total", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B3", "gri_ref": "GRI 303-4", "sfdr_ref": "PAI-6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E3-4_wc", "topic": "Water consumption total", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B3", "gri_ref": "GRI 303-5", "sfdr_ref": "PAI-6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E3-4_ws", "topic": "Water in water-stressed areas", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B3", "gri_ref": None, "sfdr_ref": "PAI-6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},

    # ---- ESRS E4 — Biodiversity ----
    {"dp_id": "E4-4_land", "topic": "Land use and land use change", "esrs_ref": "ESRS E4-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B1", "gri_ref": "GRI 304-1", "sfdr_ref": "PAI-7", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E23_Biodiversity", "data_type": "metric"},
    {"dp_id": "E4-4_species", "topic": "Species affected — IUCN Red List", "esrs_ref": "ESRS E4-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-C1", "gri_ref": "GRI 304-4", "sfdr_ref": "PAI-7", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E23_Biodiversity", "data_type": "metric"},
    {"dp_id": "E4-5_eco", "topic": "Ecosystem services — financial effects", "esrs_ref": "ESRS E4-5", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-D1", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": False, "source_engine": "E23_Biodiversity", "data_type": "metric"},

    # ---- ESRS E5 — Circular Economy ----
    {"dp_id": "E5-4_inflow", "topic": "Resource inflows — weight of products", "esrs_ref": "ESRS E5-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 301-1", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E5-4_recycled", "topic": "Recycled content % of materials", "esrs_ref": "ESRS E5-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 301-2", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E5-5_waste", "topic": "Total waste generated", "esrs_ref": "ESRS E5-5", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 306-3", "sfdr_ref": "PAI-9", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "E5-5_hazardous", "topic": "Hazardous waste generated", "esrs_ref": "ESRS E5-5", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 306-3", "sfdr_ref": "PAI-9", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},

    # ---- ESRS S1 — Own Workforce ----
    {"dp_id": "S1-6_hc", "topic": "Total headcount employees", "esrs_ref": "ESRS S1-6", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-7", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-6_gender", "topic": "Gender distribution (% female)", "esrs_ref": "ESRS S1-6", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-7", "sfdr_ref": "PAI-13", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-7_nc", "topic": "Non-employees / contractors count", "esrs_ref": "ESRS S1-7", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-8", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-10_pay", "topic": "Adequate wages — minimum wage ratio", "esrs_ref": "ESRS S1-10", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 202-1", "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-12_gender_pay", "topic": "Gender pay gap", "esrs_ref": "ESRS S1-12", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 405-2", "sfdr_ref": "PAI-12", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-14_health", "topic": "Days lost due to injuries / fatalities", "esrs_ref": "ESRS S1-14", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 403-9", "sfdr_ref": "PAI-2", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},
    {"dp_id": "S1-16_board_diversity", "topic": "Board gender diversity", "esrs_ref": "ESRS S1-16", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 405-1", "sfdr_ref": "PAI-13", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},

    # ---- ESRS G1 — Business Conduct ----
    {"dp_id": "G1-1_ethics", "topic": "Business conduct policies — anti-corruption", "esrs_ref": "ESRS G1-1", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 205-1", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "narrative"},
    {"dp_id": "G1-4_fines", "topic": "Confirmed corruption incidents / fines", "esrs_ref": "ESRS G1-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 205-3", "sfdr_ref": "PAI-17", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "metric"},

    # ---- IFRS S1 ----
    {"dp_id": "S1-GOV1", "topic": "Governance body oversight of sustainability", "esrs_ref": "ESRS 2-GOV-1", "ifrs_s2_ref": "S1-5", "tcfd_ref": "Governance-a", "tnfd_ref": "Governance-A1", "gri_ref": "GRI 2-9", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E18_IFRS_S1", "data_type": "narrative"},
    {"dp_id": "S1-RISK1", "topic": "Sustainability risk identification process", "esrs_ref": "ESRS 2-IRO-1", "ifrs_s2_ref": "S1-24", "tcfd_ref": "Risk_Mgmt-a", "tnfd_ref": "Governance-B2", "gri_ref": "GRI 3-1", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E18_IFRS_S1", "data_type": "narrative"},
    {"dp_id": "S1-MAT1", "topic": "Materiality assessment — significant influences", "esrs_ref": "ESRS 2-SBM-3", "ifrs_s2_ref": "S1-17", "tcfd_ref": "Strategy-a", "tnfd_ref": "Strategy-C1", "gri_ref": "GRI 3-2", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E18_IFRS_S1", "data_type": "narrative"},

    # ---- IFRS S2 Climate ----
    {"dp_id": "S2-SCEN1", "topic": "Climate scenario analysis — transition risks", "esrs_ref": "ESRS E1-3", "ifrs_s2_ref": "S2-10", "tcfd_ref": "Strategy-b", "tnfd_ref": "Strategy-C2", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E24_ISSB_S2", "data_type": "narrative"},
    {"dp_id": "S2-SCEN2", "topic": "Climate scenario analysis — physical risks", "esrs_ref": "ESRS E1-3", "ifrs_s2_ref": "S2-10", "tcfd_ref": "Strategy-b", "tnfd_ref": "Strategy-C2", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E24_ISSB_S2", "data_type": "narrative"},
    {"dp_id": "S2-FIN1", "topic": "Climate-related financial effects (quantitative)", "esrs_ref": "ESRS E1-9", "ifrs_s2_ref": "S2-16", "tcfd_ref": "Strategy-c", "tnfd_ref": "Metrics-D1", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E31_Stress_Test", "data_type": "metric"},
    {"dp_id": "S2-CAPEX1", "topic": "Climate-related CAPEX plan", "esrs_ref": "ESRS E1-1", "ifrs_s2_ref": "S2-20", "tcfd_ref": "Strategy-c", "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E26_TPT", "data_type": "metric"},

    # ---- TCFD ----
    {"dp_id": "TCFD-GOV-A", "topic": "Board oversight of climate risks", "esrs_ref": "ESRS 2-GOV-1", "ifrs_s2_ref": "S2-5", "tcfd_ref": "Governance-a", "tnfd_ref": "Governance-A1", "gri_ref": "GRI 2-9", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "narrative"},
    {"dp_id": "TCFD-STR-B", "topic": "Impact of climate scenarios on business", "esrs_ref": "ESRS E1-3", "ifrs_s2_ref": "S2-13", "tcfd_ref": "Strategy-b", "tnfd_ref": "Strategy-C2", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "narrative"},
    {"dp_id": "TCFD-MET-A", "topic": "GHG metrics and targets", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-1", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},

    # ---- TNFD ----
    {"dp_id": "TNFD-B1", "topic": "Land use footprint (terrestrial)", "esrs_ref": "ESRS E4-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B1", "gri_ref": "GRI 304-1", "sfdr_ref": "PAI-7", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E23_Biodiversity", "data_type": "metric"},
    {"dp_id": "TNFD-B2", "topic": "Freshwater use", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B2", "gri_ref": "GRI 303-3", "sfdr_ref": "PAI-6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E28_ESRS_E2E5", "data_type": "metric"},
    {"dp_id": "TNFD-C1", "topic": "Species affected — IUCN / KBA", "esrs_ref": "ESRS E4-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-C1", "gri_ref": "GRI 304-4", "sfdr_ref": "PAI-7", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E23_Biodiversity", "data_type": "metric"},
    {"dp_id": "TNFD-D1", "topic": "Nature-related financial risk exposure", "esrs_ref": "ESRS E4-5", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-D1", "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E23_Biodiversity", "data_type": "metric"},

    # ---- GRI Universal Standards ----
    {"dp_id": "GRI-2-6", "topic": "Sector activities — value chain description", "esrs_ref": "ESRS 2-SBM-1", "ifrs_s2_ref": "S1-6", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-6", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "narrative"},
    {"dp_id": "GRI-2-22", "topic": "Statement on sustainable development strategy", "esrs_ref": "ESRS 2-GOV-3", "ifrs_s2_ref": "S1-1", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-22", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "narrative"},
    {"dp_id": "GRI-3-1", "topic": "Process for material topics", "esrs_ref": "ESRS 2-IRO-1", "ifrs_s2_ref": "S1-17", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 3-1", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E25_GRI", "data_type": "narrative"},
    {"dp_id": "GRI-305-1", "topic": "Direct (Scope 1) GHG emissions", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-1", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E13_TCFD", "data_type": "metric"},
    {"dp_id": "GRI-305-3", "topic": "Scope 3 GHG emissions", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-3", "sfdr_ref": "PAI-1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E21_Scope3", "data_type": "metric"},

    # ---- SFDR PAI ----
    {"dp_id": "SFDR-PAI-1", "topic": "GHG emissions (Scope 1+2+3)", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-a", "tnfd_ref": None, "gri_ref": "GRI 305-1", "sfdr_ref": "Annex I Table 1 #1", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-2", "topic": "Carbon footprint", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-b", "tnfd_ref": None, "gri_ref": "GRI 305-4", "sfdr_ref": "Annex I Table 1 #2", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-3", "topic": "GHG intensity of investee companies", "esrs_ref": "ESRS E1-6", "ifrs_s2_ref": "S2-B36", "tcfd_ref": "Metrics-b", "tnfd_ref": None, "gri_ref": "GRI 305-4", "sfdr_ref": "Annex I Table 1 #3", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-4", "topic": "Exposure to fossil fuel sector", "esrs_ref": "ESRS E1-5", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": "Annex I Table 1 #4", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-5", "topic": "Non-renewable energy consumption/production share", "esrs_ref": "ESRS E1-5", "ifrs_s2_ref": "S2-B29", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 302-1", "sfdr_ref": "Annex I Table 1 #5", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-6", "topic": "Water usage and recycling", "esrs_ref": "ESRS E3-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-B2", "gri_ref": "GRI 303-3", "sfdr_ref": "Annex I Table 1 #6", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-7", "topic": "Investments in companies without biodiversity policy", "esrs_ref": "ESRS E4-2", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": "Core-A2", "gri_ref": "GRI 304-3", "sfdr_ref": "Annex I Table 1 #7", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-10", "topic": "Violations of UN Global Compact / OECD", "esrs_ref": "ESRS S1-17", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 2-27", "sfdr_ref": "Annex I Table 1 #10", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-11", "topic": "Lack of processes / mechanisms to monitor UNGC/OECD", "esrs_ref": "ESRS S1-17", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": "Annex I Table 1 #11", "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "narrative"},
    {"dp_id": "SFDR-PAI-13", "topic": "Gender pay gap", "esrs_ref": "ESRS S1-12", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 405-2", "sfdr_ref": "Annex I Table 1 #13", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-14", "topic": "Board gender diversity", "esrs_ref": "ESRS S1-16", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 405-1", "sfdr_ref": "Annex I Table 1 #14", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-16", "topic": "Controversial weapons exposure", "esrs_ref": None, "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": "Annex I Table 2 #16", "disclosure_type": "quantitative", "mandatory": False, "source_engine": "E9_SFDR", "data_type": "metric"},
    {"dp_id": "SFDR-PAI-17", "topic": "Countries with inadequate tax governance", "esrs_ref": "ESRS G1-4", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 207", "sfdr_ref": "Annex I Table 2 #17", "disclosure_type": "quantitative", "mandatory": False, "source_engine": "E9_SFDR", "data_type": "metric"},

    # ---- Additional cross-cutting DPs ----
    {"dp_id": "ESRS2-BP1", "topic": "General basis for preparation of sustainability statement", "esrs_ref": "ESRS 2-BP-1", "ifrs_s2_ref": "S1-10", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": "GRI 1-1", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E10_Assurance", "data_type": "narrative"},
    {"dp_id": "ESRS2-SBM1", "topic": "Strategy, business model and value chain", "esrs_ref": "ESRS 2-SBM-1", "ifrs_s2_ref": "S1-6", "tcfd_ref": "Strategy-a", "tnfd_ref": "Strategy-C1", "gri_ref": "GRI 2-6", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E18_IFRS_S1", "data_type": "narrative"},
    {"dp_id": "ESRS2-SBM3", "topic": "Material impacts, risks and opportunities", "esrs_ref": "ESRS 2-SBM-3", "ifrs_s2_ref": "S1-17", "tcfd_ref": "Risk_Mgmt-a", "tnfd_ref": "Risk-B1", "gri_ref": "GRI 3-2", "sfdr_ref": None, "disclosure_type": "qualitative", "mandatory": True, "source_engine": "E18_IFRS_S1", "data_type": "narrative"},
    {"dp_id": "ESRS_EU_TAX_1", "topic": "EU Taxonomy — aligned CapEx %", "esrs_ref": "ESRS E1-5 + Art 8 DR", "ifrs_s2_ref": "S2-B29", "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": "PAI-4", "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E19_EU_Taxonomy", "data_type": "metric"},
    {"dp_id": "ESRS_EU_TAX_2", "topic": "EU Taxonomy — aligned OpEx %", "esrs_ref": "ESRS E1-5 + Art 8 DR", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E19_EU_Taxonomy", "data_type": "metric"},
    {"dp_id": "ESRS_EU_TAX_3", "topic": "EU Taxonomy — eligible turnover %", "esrs_ref": "ESRS E1-5 + Art 8 DR", "ifrs_s2_ref": None, "tcfd_ref": None, "tnfd_ref": None, "gri_ref": None, "sfdr_ref": None, "disclosure_type": "quantitative", "mandatory": True, "source_engine": "E19_EU_Taxonomy", "data_type": "metric"},
]


# ---------------------------------------------------------------------------
# Reference Data — ESRS IG3 Quantitative Mandatory DPs (330 DPs, sampled set)
# phase_in: None = no relief, 2025 = first-year relief available from CSRD wave 1
# ---------------------------------------------------------------------------

ESRS_IG3_CHECKLIST: list[dict] = [
    # ESRS E1 (energy + GHG — 42 quantitative DPs)
    {"dp_id": "E1-5_ren_src", "standard": "E1", "description": "Energy consumption from renewable sources (MWh)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-5_non_ren", "standard": "E1", "description": "Energy consumption from non-renewable sources (MWh)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-5_tot_cons", "standard": "E1", "description": "Total energy consumption (MWh)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-5_en_int", "standard": "E1", "description": "Energy intensity per net revenue (MWh/EUR)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E1-6_s1", "standard": "E1", "description": "Gross Scope 1 GHG emissions (tCO2e)", "mandatory": True, "phase_in": None, "topic_weight": 2.0, "data_type": "quantitative"},
    {"dp_id": "E1-6_s2_loc", "standard": "E1", "description": "Gross Scope 2 GHG (location-based, tCO2e)", "mandatory": True, "phase_in": None, "topic_weight": 2.0, "data_type": "quantitative"},
    {"dp_id": "E1-6_s2_mkt", "standard": "E1", "description": "Gross Scope 2 GHG (market-based, tCO2e)", "mandatory": True, "phase_in": None, "topic_weight": 2.0, "data_type": "quantitative"},
    {"dp_id": "E1-6_s3_c1", "standard": "E1", "description": "Scope 3 Cat 1 purchased goods (tCO2e)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-6_s3_c11", "standard": "E1", "description": "Scope 3 Cat 11 use of sold products (tCO2e)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-6_s3_tot", "standard": "E1", "description": "Total Scope 3 GHG (all categories, tCO2e)", "mandatory": True, "phase_in": "2025", "topic_weight": 2.0, "data_type": "quantitative"},
    {"dp_id": "E1-6_ghg_int", "standard": "E1", "description": "GHG intensity per net revenue (tCO2e/EUR)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-7_rem", "standard": "E1", "description": "GHG removals (tCO2e)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E1-7_cc_vol", "standard": "E1", "description": "Carbon credits (voluntary, tCO2e)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E1-8_icp", "standard": "E1", "description": "Internal carbon price (EUR/tCO2e)", "mandatory": False, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "E1-9_rev_at_risk", "standard": "E1", "description": "Net revenue at risk — climate (EUR)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E1-9_assets_phy", "standard": "E1", "description": "Assets at material physical climate risk (EUR)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.5, "data_type": "quantitative"},
    # ESRS E2 — Pollution (12 DPs)
    {"dp_id": "E2-4_nox", "standard": "E2", "description": "NOx emissions (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E2-4_sox", "standard": "E2", "description": "SOx emissions (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E2-4_pm25", "standard": "E2", "description": "PM2.5 emissions (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E2-4_voc", "standard": "E2", "description": "VOC emissions (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E2-4_haz_sub", "standard": "E2", "description": "Substances of very high concern (SVHC) released (kg)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E2-5_micro", "standard": "E2", "description": "Microplastics generated / used (kg)", "mandatory": True, "phase_in": "2025", "topic_weight": 0.8, "data_type": "quantitative"},
    # ESRS E3 — Water (8 DPs)
    {"dp_id": "E3-4_ww_tot", "standard": "E3", "description": "Total water withdrawal (megalitres)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E3-4_ww_ws", "standard": "E3", "description": "Water withdrawal in water-stressed areas (ML)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E3-4_wd_tot", "standard": "E3", "description": "Total water discharge (megalitres)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E3-4_wc_tot", "standard": "E3", "description": "Total water consumption (megalitres)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E3-5_w_risk", "standard": "E3", "description": "Water risk — anticipated financial effects (EUR)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.5, "data_type": "quantitative"},
    # ESRS E4 — Biodiversity (10 DPs)
    {"dp_id": "E4-4_land_use", "standard": "E4", "description": "Total land use (hectares)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E4-4_land_change", "standard": "E4", "description": "Land use change (sealed/degraded ha)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E4-4_protected", "standard": "E4", "description": "Operations in/near protected areas (count)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "E4-4_iucn_crit", "standard": "E4", "description": "IUCN Critically Endangered species affected (count)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.8, "data_type": "quantitative"},
    {"dp_id": "E4-5_fin_bio", "standard": "E4", "description": "Financial effects from biodiversity loss (EUR)", "mandatory": False, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    # ESRS E5 — Circular Economy (8 DPs)
    {"dp_id": "E5-4_inflow_w", "standard": "E5", "description": "Total material inflow weight (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E5-4_recycled_in", "standard": "E5", "description": "Recycled/reused input materials (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E5-5_waste_tot", "standard": "E5", "description": "Total waste generated (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E5-5_haz_waste", "standard": "E5", "description": "Hazardous waste generated (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "E5-5_recycled_out", "standard": "E5", "description": "Waste directed to recycling (tonnes)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "E5-6_outflow", "standard": "E5", "description": "Total product outflow weight (tonnes)", "mandatory": False, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    # ESRS S1 — Own Workforce (25 DPs)
    {"dp_id": "S1-6_emp_tot", "standard": "S1", "description": "Total employees headcount", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "S1-6_emp_fem", "standard": "S1", "description": "Female employees headcount", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "S1-6_emp_pt", "standard": "S1", "description": "Part-time employees (count)", "mandatory": True, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "S1-7_nc_tot", "standard": "S1", "description": "Non-employees / self-employed (count)", "mandatory": True, "phase_in": "2025", "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "S1-9_turn", "standard": "S1", "description": "Employee turnover rate (%)", "mandatory": True, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "S1-10_mw_gap", "standard": "S1", "description": "Employees below living wage (count)", "mandatory": True, "phase_in": "2025", "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "S1-12_gpg", "standard": "S1", "description": "Unadjusted gender pay gap (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "S1-13_training", "standard": "S1", "description": "Average training hours per employee", "mandatory": True, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "S1-14_ltifr", "standard": "S1", "description": "Lost time injury frequency rate (LTIFR)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "S1-14_fatalities", "standard": "S1", "description": "Work-related fatalities (count)", "mandatory": True, "phase_in": None, "topic_weight": 2.0, "data_type": "quantitative"},
    {"dp_id": "S1-16_board_f", "standard": "S1", "description": "Female board members (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.0, "data_type": "quantitative"},
    {"dp_id": "S1-17_grievances", "standard": "S1", "description": "Complaints received through grievance mechanism (count)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    # ESRS G1 — Business Conduct (6 DPs)
    {"dp_id": "G1-4_brib", "standard": "G1", "description": "Confirmed bribery/corruption incidents (count)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "G1-4_fines_tot", "standard": "G1", "description": "Total monetary fines for anti-competitive behaviour (EUR)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "G1-5_lobby", "standard": "G1", "description": "Lobbying expenditure (EUR)", "mandatory": False, "phase_in": None, "topic_weight": 0.8, "data_type": "quantitative"},
    {"dp_id": "G1-6_pay_days", "standard": "G1", "description": "Average payment period to suppliers (days)", "mandatory": True, "phase_in": "2025", "topic_weight": 0.8, "data_type": "quantitative"},
    # EU Taxonomy (Article 8 DR) — 8 DPs
    {"dp_id": "EUTAX_capex_elig", "standard": "EU_TAX", "description": "Taxonomy-eligible CapEx (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_capex_align", "standard": "EU_TAX", "description": "Taxonomy-aligned CapEx (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_opex_elig", "standard": "EU_TAX", "description": "Taxonomy-eligible OpEx (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_opex_align", "standard": "EU_TAX", "description": "Taxonomy-aligned OpEx (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_rev_elig", "standard": "EU_TAX", "description": "Taxonomy-eligible Turnover (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_rev_align", "standard": "EU_TAX", "description": "Taxonomy-aligned Turnover (%)", "mandatory": True, "phase_in": None, "topic_weight": 1.5, "data_type": "quantitative"},
    {"dp_id": "EUTAX_dnsh_bio", "standard": "EU_TAX", "description": "DNSH for biodiversity satisfied (Y/N count)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
    {"dp_id": "EUTAX_min_safeg", "standard": "EU_TAX", "description": "Minimum social safeguards met (% activities)", "mandatory": True, "phase_in": None, "topic_weight": 1.2, "data_type": "quantitative"},
]


# ---------------------------------------------------------------------------
# Reference Data — IFRS S1/S2 Disclosure Checklist (68 paragraphs)
# ---------------------------------------------------------------------------

IFRS_S1_S2_CHECKLIST: list[dict] = [
    # IFRS S1 — General
    {"para": "S1-1",  "standard": "IFRS S1", "description": "Core content elements — governance", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-5",  "standard": "IFRS S1", "description": "Governance body responsibilities for sustainability", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-6",  "standard": "IFRS S1", "description": "Management's role in sustainability", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-10", "standard": "IFRS S1", "description": "Sustainability-related risks and opportunities", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-17", "standard": "IFRS S1", "description": "Process for identifying sustainability matters", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-20", "standard": "IFRS S1", "description": "Current and anticipated financial effects", "quantitative": True,  "prior_period_comparative": True},
    {"para": "S1-24", "standard": "IFRS S1", "description": "Integration into overall risk management", "quantitative": False, "prior_period_comparative": False},
    {"para": "S1-33", "standard": "IFRS S1", "description": "Metrics and targets", "quantitative": True, "prior_period_comparative": True},
    {"para": "S1-37", "standard": "IFRS S1", "description": "Industry-based metrics (SASB)", "quantitative": True, "prior_period_comparative": True},
    # IFRS S2 — Climate
    {"para": "S2-5",  "standard": "IFRS S2", "description": "Governance — board oversight of climate risks", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-6",  "standard": "IFRS S2", "description": "Management's role in climate risk governance", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-10", "standard": "IFRS S2", "description": "Climate-related risks and opportunities", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-13", "standard": "IFRS S2", "description": "Scenario analysis process", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-14", "standard": "IFRS S2", "description": "Transition plan", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-15", "standard": "IFRS S2", "description": "Resilience of business strategy", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-16", "standard": "IFRS S2", "description": "Financial effects — current period", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-20", "standard": "IFRS S2", "description": "Climate-related CapEx amounts", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-21", "standard": "IFRS S2", "description": "Internal carbon price", "quantitative": True, "prior_period_comparative": False},
    {"para": "S2-22", "standard": "IFRS S2", "description": "Physical risk exposure", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-29", "standard": "IFRS S2", "description": "Risk management processes — climate", "quantitative": False, "prior_period_comparative": False},
    {"para": "S2-B29","standard": "IFRS S2", "description": "Energy consumption and energy mix (Appendix B)", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-B36","standard": "IFRS S2", "description": "GHG emissions (Scope 1, 2, 3)", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-B39","standard": "IFRS S2", "description": "GHG emissions intensity", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-33", "standard": "IFRS S2", "description": "Climate-related targets", "quantitative": True, "prior_period_comparative": True},
    {"para": "S2-B59","standard": "IFRS S2", "description": "Carbon offsets", "quantitative": True, "prior_period_comparative": True},
]


# ---------------------------------------------------------------------------
# Reference Data — XBRL Tagging (EFRAG ESRS XBRL Taxonomy 2024, top 50 DPs)
# ---------------------------------------------------------------------------

ESRS_XBRL_CONCEPTS: list[dict] = [
    {"concept": "esrs:GrossScope1GHGEmissions",                      "dp_id": "E1-6_s1",    "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:GrossScope2GHGEmissionsLocationBased",         "dp_id": "E1-6_s2_loc","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:GrossScope2GHGEmissionsMarketBased",           "dp_id": "E1-6_s2_mkt","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:TotalGrossScope3GHGEmissions",                 "dp_id": "E1-6_s3_tot","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:GHGIntensityPerNetRevenue",                    "dp_id": "E1-6_ghg_int","data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "tCO2e_per_EUR", "balance": None},
    {"concept": "esrs:TotalEnergyConsumptionFromRenewableSources",   "dp_id": "E1-5_ren_src","data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "MWh",      "balance": None},
    {"concept": "esrs:TotalEnergyConsumptionFromNonRenewableSources","dp_id": "E1-5_non_ren","data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "MWh",      "balance": None},
    {"concept": "esrs:TotalEnergyConsumption",                       "dp_id": "E1-5_tot_cons","data_type": "xbrli:decimalItemType","period_type": "duration", "unit": "MWh",     "balance": None},
    {"concept": "esrs:EnergyIntensityPerNetRevenue",                 "dp_id": "E1-5_en_int","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "MWh_per_EUR", "balance": None},
    {"concept": "esrs:GHGRemovals",                                  "dp_id": "E1-7_rem",   "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:CarbonCreditsVoluntary",                       "dp_id": "E1-7_cc_vol","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",    "balance": None},
    {"concept": "esrs:InternalCarbonPricePerTonneCO2",               "dp_id": "E1-8_icp",   "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "EUR_per_tCO2e","balance": None},
    {"concept": "esrs:NetRevenueAtRiskFromClimateChange",            "dp_id": "E1-9_rev_at_risk","data_type": "xbrli:monetaryItemType","period_type": "instant","unit": "EUR",   "balance": None},
    {"concept": "esrs:AssetsAtPhysicalClimateRisk",                  "dp_id": "E1-9_assets_phy","data_type": "xbrli:monetaryItemType","period_type": "instant","unit": "EUR",   "balance": None},
    {"concept": "esrs:NitrogenOxidesEmissions",                      "dp_id": "E2-4_nox",   "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "t",        "balance": None},
    {"concept": "esrs:SulfurOxidesEmissions",                        "dp_id": "E2-4_sox",   "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "t",        "balance": None},
    {"concept": "esrs:PM25Emissions",                                "dp_id": "E2-4_pm25",  "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "t",        "balance": None},
    {"concept": "esrs:VolatileOrganicCompoundsEmissions",            "dp_id": "E2-4_voc",   "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "t",        "balance": None},
    {"concept": "esrs:SubstancesOfVeryHighConcernEmitted",           "dp_id": "E2-4_haz_sub","data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "kg",       "balance": None},
    {"concept": "esrs:TotalWaterWithdrawal",                         "dp_id": "E3-4_ww_tot","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "ML",       "balance": None},
    {"concept": "esrs:WaterWithdrawalInWaterStressedAreas",          "dp_id": "E3-4_ww_ws", "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "ML",       "balance": None},
    {"concept": "esrs:TotalWaterDischarge",                          "dp_id": "E3-4_wd_tot","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "ML",       "balance": None},
    {"concept": "esrs:TotalWaterConsumption",                        "dp_id": "E3-4_wc_tot","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "ML",       "balance": None},
    {"concept": "esrs:TotalLandUse",                                 "dp_id": "E4-4_land_use","data_type": "xbrli:decimalItemType","period_type": "duration", "unit": "ha",       "balance": None},
    {"concept": "esrs:LandUseChangeSealedOrDegraded",                "dp_id": "E4-4_land_change","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "ha",    "balance": None},
    {"concept": "esrs:OperationsInOrNearProtectedAreas",             "dp_id": "E4-4_protected","data_type": "xbrli:integerItemType","period_type": "instant", "unit": "count",   "balance": None},
    {"concept": "esrs:TotalMaterialInflows",                         "dp_id": "E5-4_inflow_w","data_type": "xbrli:decimalItemType","period_type": "duration", "unit": "t",       "balance": None},
    {"concept": "esrs:RecycledInputMaterials",                       "dp_id": "E5-4_recycled_in","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "t",    "balance": None},
    {"concept": "esrs:TotalWasteGenerated",                          "dp_id": "E5-5_waste_tot","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "t",      "balance": None},
    {"concept": "esrs:HazardousWasteGenerated",                      "dp_id": "E5-5_haz_waste","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "t",     "balance": None},
    {"concept": "esrs:WasteDirectedToRecycling",                     "dp_id": "E5-5_recycled_out","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "t",  "balance": None},
    {"concept": "esrs:TotalEmployees",                               "dp_id": "S1-6_emp_tot","data_type": "xbrli:integerItemType", "period_type": "instant",  "unit": "count",   "balance": None},
    {"concept": "esrs:FemaleEmployees",                              "dp_id": "S1-6_emp_fem","data_type": "xbrli:integerItemType", "period_type": "instant",  "unit": "count",   "balance": None},
    {"concept": "esrs:PartTimeEmployees",                            "dp_id": "S1-6_emp_pt", "data_type": "xbrli:integerItemType", "period_type": "instant",  "unit": "count",   "balance": None},
    {"concept": "esrs:EmployeeTurnoverRate",                         "dp_id": "S1-9_turn",   "data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "pct",     "balance": None},
    {"concept": "esrs:UnadjustedGenderPayGap",                       "dp_id": "S1-12_gpg",  "data_type": "xbrli:decimalItemType", "period_type": "duration", "unit": "pct",     "balance": None},
    {"concept": "esrs:AverageHoursTrainingPerEmployee",              "dp_id": "S1-13_training","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "hours",  "balance": None},
    {"concept": "esrs:LostTimeInjuryFrequencyRate",                  "dp_id": "S1-14_ltifr","data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "per_mhrs","balance": None},
    {"concept": "esrs:WorkRelatedFatalities",                        "dp_id": "S1-14_fatalities","data_type": "xbrli:integerItemType","period_type": "duration","unit": "count","balance": None},
    {"concept": "esrs:FemaleBoardMembersPct",                        "dp_id": "S1-16_board_f","data_type": "xbrli:decimalItemType","period_type": "instant",  "unit": "pct",    "balance": None},
    {"concept": "esrs:GrievancesReceived",                           "dp_id": "S1-17_grievances","data_type": "xbrli:integerItemType","period_type": "duration","unit": "count","balance": None},
    {"concept": "esrs:ConfirmedBriberyCorruptionIncidents",          "dp_id": "G1-4_brib",  "data_type": "xbrli:integerItemType",  "period_type": "duration", "unit": "count",   "balance": None},
    {"concept": "esrs:MonetaryFinesAntiCompetitiveBehaviour",        "dp_id": "G1-4_fines_tot","data_type": "xbrli:monetaryItemType","period_type": "duration","unit": "EUR",   "balance": None},
    {"concept": "esrs:EUTaxonomyAlignedCapEx",                       "dp_id": "EUTAX_capex_align","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct", "balance": None},
    {"concept": "esrs:EUTaxonomyEligibleCapEx",                      "dp_id": "EUTAX_capex_elig","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct",  "balance": None},
    {"concept": "esrs:EUTaxonomyAlignedTurnover",                    "dp_id": "EUTAX_rev_align","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct",  "balance": None},
    {"concept": "esrs:EUTaxonomyEligibleTurnover",                   "dp_id": "EUTAX_rev_elig","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct",   "balance": None},
    {"concept": "esrs:EUTaxonomyAlignedOpEx",                        "dp_id": "EUTAX_opex_align","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct", "balance": None},
    {"concept": "esrs:EUTaxonomyEligibleOpEx",                       "dp_id": "EUTAX_opex_elig","data_type": "xbrli:decimalItemType","period_type": "duration","unit": "pct",  "balance": None},
    {"concept": "esrs:Scope3Category1PurchasedGoods",                "dp_id": "E1-6_s3_c1", "data_type": "xbrli:decimalItemType",  "period_type": "duration", "unit": "tCO2e",   "balance": None},
]


# ---------------------------------------------------------------------------
# Reference Data — Cross-Framework Consistency Rules (20 rules)
# ---------------------------------------------------------------------------

CONSISTENCY_RULES: list[dict] = [
    {
        "rule_id": "CR-001",
        "name": "Scope 1 GHG cross-framework consistency",
        "description": "Scope 1 emissions must be consistent across CSRD E1-6, SFDR PAI-1, TCFD Metrics-a, IFRS S2-B36, and GRI 305-1",
        "dps_involved": ["E1-6_s1", "SFDR-PAI-1", "TCFD-MET-A", "S2-FIN1", "GRI-305-1"],
        "frameworks": ["CSRD", "SFDR", "TCFD", "IFRS_S2", "GRI"],
        "tolerance_pct": 5.0,
        "severity": "blocking",
        "remediation": "Reconcile GHG inventories; use same base year, boundary, methodology across all submissions",
    },
    {
        "rule_id": "CR-002",
        "name": "Scope 2 location vs market-based reconciliation",
        "description": "Market-based Scope 2 should differ from location-based only by purchased renewable certificates; document PPA/REGOs",
        "dps_involved": ["E1-6_s2_loc", "E1-6_s2_mkt"],
        "frameworks": ["CSRD"],
        "tolerance_pct": 50.0,
        "severity": "advisory",
        "remediation": "Document all RECs, PPAs, and renewable energy certificates reducing market-based figure",
    },
    {
        "rule_id": "CR-003",
        "name": "Scope 3 GHG — CSRD vs PCAF financed emissions",
        "description": "Financial institutions: Scope 3 Cat 15 (ESRS E1-6) must reconcile with PCAF financed emissions methodology",
        "dps_involved": ["E1-6_s3_tot", "SFDR-PAI-1"],
        "frameworks": ["CSRD", "SFDR", "PCAF"],
        "tolerance_pct": 10.0,
        "severity": "blocking",
        "remediation": "Align PCAF portfolio coverage with ESRS S3 value chain boundary; document exclusions",
    },
    {
        "rule_id": "CR-004",
        "name": "GHG intensity denominator consistency",
        "description": "GHG intensity per revenue (E1-6) must use same revenue figure as financial statements",
        "dps_involved": ["E1-6_ghg_int", "E1-6_s1"],
        "frameworks": ["CSRD", "IFRS_S2"],
        "tolerance_pct": 2.0,
        "severity": "blocking",
        "remediation": "Confirm net revenue denominator is IFRS-aligned consolidated figure",
    },
    {
        "rule_id": "CR-005",
        "name": "Energy consumption vs GHG emission factors",
        "description": "Energy MWh figures combined with grid emission factors should approximately reconcile with Scope 2 location-based figures",
        "dps_involved": ["E1-5_tot_cons", "E1-6_s2_loc"],
        "frameworks": ["CSRD"],
        "tolerance_pct": 15.0,
        "severity": "advisory",
        "remediation": "Check grid emission factors used; confirm boundary consistency between energy and GHG modules",
    },
    {
        "rule_id": "CR-006",
        "name": "EU Taxonomy CapEx vs climate CAPEX plan (IFRS S2)",
        "description": "EU Taxonomy-aligned CapEx should be consistent with climate-related CapEx under IFRS S2-20",
        "dps_involved": ["EUTAX_capex_align", "S2-CAPEX1"],
        "frameworks": ["CSRD", "IFRS_S2", "EU_TAXONOMY"],
        "tolerance_pct": 10.0,
        "severity": "advisory",
        "remediation": "Ensure the climate CAPEX plan in TPT aligns with EU Taxonomy screening criteria",
    },
    {
        "rule_id": "CR-007",
        "name": "EU Taxonomy aligned turnover vs SFDR PAI-4 fossil fuel exposure",
        "description": "EU Taxonomy non-eligible turnover should be reconciled with SFDR PAI-4 fossil fuel sector exposure",
        "dps_involved": ["EUTAX_rev_align", "SFDR-PAI-4"],
        "frameworks": ["EU_TAXONOMY", "SFDR"],
        "tolerance_pct": 10.0,
        "severity": "advisory",
        "remediation": "Cross-check NACE codes of non-eligible activities against PAI-4 fossil fuel classification",
    },
    {
        "rule_id": "CR-008",
        "name": "Water withdrawal — ESRS E3 vs SFDR PAI-6",
        "description": "Total water withdrawal (ESRS E3-4) must be consistent with water usage reported in SFDR PAI-6",
        "dps_involved": ["E3-4_ww_tot", "SFDR-PAI-6"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 5.0,
        "severity": "blocking",
        "remediation": "Confirm same operational boundary and metering methodology used across frameworks",
    },
    {
        "rule_id": "CR-009",
        "name": "Biodiversity policy — ESRS E4 vs SFDR PAI-7",
        "description": "Operations near protected areas (ESRS E4-4) should be consistent with SFDR PAI-7 biodiversity policy assessment",
        "dps_involved": ["E4-4_protected", "SFDR-PAI-7"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 10.0,
        "severity": "advisory",
        "remediation": "Map site-level biodiversity assessments to portfolio investee data for SFDR PAI-7",
    },
    {
        "rule_id": "CR-010",
        "name": "Gender pay gap — ESRS S1-12 vs SFDR PAI-13",
        "description": "Unadjusted gender pay gap (ESRS S1-12) must equal SFDR PAI-13 disclosure",
        "dps_involved": ["S1-12_gpg", "SFDR-PAI-13"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 1.0,
        "severity": "blocking",
        "remediation": "Use single payroll dataset; confirm calculation methodology (mean/median, FTE-weighted)",
    },
    {
        "rule_id": "CR-011",
        "name": "Board gender diversity — ESRS S1-16 vs SFDR PAI-14",
        "description": "Female board member percentage must be identical across ESRS and SFDR disclosures",
        "dps_involved": ["S1-16_board_f", "SFDR-PAI-14"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 0.5,
        "severity": "blocking",
        "remediation": "Use single governance dataset; confirm board definition (supervisory vs management)",
    },
    {
        "rule_id": "CR-012",
        "name": "GHG reduction targets — ESRS E1-4 vs TCFD Metrics-c vs IFRS S2-33",
        "description": "GHG reduction targets (base year, %, scope coverage) must be consistent across all three frameworks",
        "dps_involved": ["E1-4", "TCFD-MET-A", "S2-FIN1"],
        "frameworks": ["CSRD", "TCFD", "IFRS_S2"],
        "tolerance_pct": 2.0,
        "severity": "blocking",
        "remediation": "Use single target register; ensure scope boundary and base year are documented consistently",
    },
    {
        "rule_id": "CR-013",
        "name": "Physical risk financial effects — ESRS E1-9 vs IFRS S2-16",
        "description": "Assets at physical climate risk and revenue at risk must reconcile across ESRS and IFRS S2",
        "dps_involved": ["E1-9_assets_phy", "S2-FIN1"],
        "frameworks": ["CSRD", "IFRS_S2"],
        "tolerance_pct": 10.0,
        "severity": "advisory",
        "remediation": "Align asset classification and time horizons (short/medium/long) across both frameworks",
    },
    {
        "rule_id": "CR-014",
        "name": "Transition plan narrative consistency — TPT vs TCFD vs IFRS S2",
        "description": "Transition plan content disclosed under ESRS E1-1 / TCFD Strategy / IFRS S2-14 should be substantively consistent",
        "dps_involved": ["E1-1", "TCFD-STR-B", "S2-SCEN1"],
        "frameworks": ["CSRD", "TCFD", "IFRS_S2"],
        "tolerance_pct": 0.0,
        "severity": "advisory",
        "remediation": "Produce single transition plan document; cross-reference in each framework disclosure",
    },
    {
        "rule_id": "CR-015",
        "name": "Hazardous waste — ESRS E5 vs SFDR PAI-9",
        "description": "Hazardous waste generated (ESRS E5-5) must align with SFDR PAI-9 hazardous waste metric",
        "dps_involved": ["E5-5_haz_waste", "SFDR-PAI-7"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 5.0,
        "severity": "blocking",
        "remediation": "Confirm same waste classification standard (Basel Convention categories) used across frameworks",
    },
    {
        "rule_id": "CR-016",
        "name": "TNFD land use vs ESRS E4 land use",
        "description": "TNFD Core-B1 land use footprint must be consistent with ESRS E4-4 total land use",
        "dps_involved": ["E4-4_land_use", "TNFD-B1"],
        "frameworks": ["CSRD", "TNFD"],
        "tolerance_pct": 5.0,
        "severity": "advisory",
        "remediation": "Ensure same operational boundary; TNFD may include upstream land in value chain",
    },
    {
        "rule_id": "CR-017",
        "name": "GRI 305-1 Scope 1 vs ESRS E1-6 Scope 1",
        "description": "GRI 305-1 Scope 1 disclosure must equal ESRS E1-6 Scope 1 within tolerance",
        "dps_involved": ["E1-6_s1", "GRI-305-1"],
        "frameworks": ["CSRD", "GRI"],
        "tolerance_pct": 1.0,
        "severity": "blocking",
        "remediation": "Use single GHG inventory; confirm organisational boundary (equity share vs control)",
    },
    {
        "rule_id": "CR-018",
        "name": "Anti-corruption incidents — ESRS G1-4 vs SFDR PAI-17",
        "description": "Confirmed bribery/corruption incidents (ESRS G1-4) must be reconciled with SFDR PAI-17 tax governance",
        "dps_involved": ["G1-4_brib", "SFDR-PAI-17"],
        "frameworks": ["CSRD", "SFDR"],
        "tolerance_pct": 0.0,
        "severity": "advisory",
        "remediation": "Maintain single incidents register covering both CSRD and SFDR reporting requirements",
    },
    {
        "rule_id": "CR-019",
        "name": "Scope 3 Cat 15 (financed) vs PCAF sovereign bonds methodology",
        "description": "For financial institutions with sovereign bonds, PCAF Part D attribution must feed Scope 3 Cat 15",
        "dps_involved": ["E1-6_s3_tot", "SFDR-PAI-1"],
        "frameworks": ["CSRD", "PCAF"],
        "tolerance_pct": 15.0,
        "severity": "advisory",
        "remediation": "Confirm PCAF Part D sovereign bonds module output is included in Scope 3 Cat 15 aggregation",
    },
    {
        "rule_id": "CR-020",
        "name": "TCFD scenario analysis resilience vs IFRS S2 scenario disclosure",
        "description": "Climate scenario parameters (temperature targets, time horizons) used for TCFD must align with IFRS S2 scenario analysis",
        "dps_involved": ["S2-SCEN1", "S2-SCEN2", "TCFD-STR-B"],
        "frameworks": ["TCFD", "IFRS_S2"],
        "tolerance_pct": 0.0,
        "severity": "advisory",
        "remediation": "Use shared scenario assumptions document; reference same NGFS/IEA scenarios across both frameworks",
    },
]


# ---------------------------------------------------------------------------
# CSRD Wave Timeline
# ---------------------------------------------------------------------------

CSRD_WAVES: dict[str, dict] = {
    "wave_1": {
        "description": "Large PIEs (>500 employees, already subject to NFRD)",
        "first_reporting_year": 2024,
        "first_publication_year": 2025,
        "phase_in_relief": ["S3_Scope3", "S3_OwnWorkforce_someDPs", "S4_AffectedCommunities", "G1_LobbyingDPs"],
        "estimated_entities": 4000,
    },
    "wave_2": {
        "description": "Large companies (>250 employees OR >€40m revenue OR >€20m balance sheet)",
        "first_reporting_year": 2025,
        "first_publication_year": 2026,
        "phase_in_relief": ["S3_Scope3_1year", "FinancialEffectsQuantitative"],
        "estimated_entities": 50000,
    },
    "wave_3": {
        "description": "Listed SMEs, small and non-complex institutions, captive (re)insurance undertakings",
        "first_reporting_year": 2026,
        "first_publication_year": 2027,
        "phase_in_relief": ["Most_Phase_in_DPs", "All_S3_categories"],
        "estimated_entities": 15000,
    },
    "wave_4": {
        "description": "Non-EU companies with significant EU market activity (>€150m EU net turnover)",
        "first_reporting_year": 2028,
        "first_publication_year": 2029,
        "phase_in_relief": ["Limited_GRI_comparison"],
        "estimated_entities": 10000,
    },
}


# ---------------------------------------------------------------------------
# Result Dataclasses
# ---------------------------------------------------------------------------

@dataclass
class ReportSection:
    section_id: str
    framework: str
    title: str
    disclosure_type: str
    status: str        # "complete" | "partial" | "missing"
    completeness_pct: float
    provided_dps: int
    required_dps: int
    source_engines: list[str]
    narrative_text: str
    data_lineage: list[dict]


@dataclass
class ComprehensiveReportResult:
    entity_id: str
    reporting_year: int
    frameworks_compiled: list[str]
    overall_completeness_pct: float
    framework_completeness: dict[str, float]
    sections: list[ReportSection]
    consistency_check_summary: dict
    blocking_gaps: list[str]
    advisory_gaps: list[str]
    assurance_readiness_pct: float
    esap_ready: bool
    data_lineage_summary: dict


@dataclass
class ESRSReportResult:
    entity_id: str
    reporting_year: int
    wave: str
    total_mandatory_dps: int
    provided_mandatory_dps: int
    mandatory_completeness_pct: float
    phase_in_dps: int
    provided_phase_in_dps: int
    voluntary_dps_provided: int
    gap_dps: list[dict]
    topic_completeness: dict[str, float]
    assurance_readiness: str
    priority_gaps: list[str]


@dataclass
class XBRLTaggingResult:
    entity_id: str
    reporting_year: int
    instance_document: dict
    tagged_facts_count: int
    validation_warnings: list[str]
    untagged_dps: list[str]
    taxonomy_version: str


@dataclass
class ConsistencyCheckResult:
    entity_id: str
    rules_evaluated: int
    rules_passed: int
    rules_failed: int
    consistency_score_pct: float
    blocking_failures: list[dict]
    advisory_failures: list[dict]
    passed_rules: list[str]


@dataclass
class ReadinessScoreResult:
    entity_id: str
    frameworks: list[str]
    overall_readiness_pct: float
    readiness_tier: str
    framework_readiness: dict[str, float]
    blocking_gaps: list[dict]
    advisory_gaps: list[dict]
    wave_readiness: str
    top_10_priority_actions: list[str]
    estimated_weeks_to_ready: int


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

class ComprehensiveReportingEngine:
    """E119 — Comprehensive Reporting Aggregator Engine."""

    SUPPORTED_FRAMEWORKS = ["CSRD", "IFRS_S1", "IFRS_S2", "TCFD", "TNFD", "GRI", "SFDR"]

    # ------------------------------------------------------------------
    # 1. Compile multi-framework report
    # ------------------------------------------------------------------

    def compile_report(
        self,
        entity_id: str,
        frameworks: list[str],
        engine_outputs: dict,
        reporting_year: int,
    ) -> ComprehensiveReportResult:
        """Full multi-framework report with completeness, consistency, and assurance readiness."""

        # --- Per-framework completeness ---
        fw_completeness: dict[str, float] = {}
        sections: list[ReportSection] = []
        all_blocking: list[str] = []
        all_advisory: list[str] = []
        all_lineage: dict[str, list] = {}

        for fw in frameworks:
            fw_sections = self._build_framework_sections(fw, engine_outputs, reporting_year)
            sections.extend(fw_sections)
            provided = sum(1 for s in fw_sections if s.status == "complete")
            total = len(fw_sections)
            fw_completeness[fw] = round(provided / max(total, 1) * 100, 1)

        overall = round(sum(fw_completeness.values()) / max(len(fw_completeness), 1), 1)

        # --- Consistency check ---
        consistency = self.check_cross_framework_consistency(entity_id, engine_outputs)
        for b in consistency.blocking_failures:
            all_blocking.append(f"[{b['rule_id']}] {b['name']}: {b.get('detail', '')}")
        for a in consistency.advisory_failures:
            all_advisory.append(f"[{a['rule_id']}] {a['name']}")

        # --- Identify missing mandatory DPs ---
        for fw, completeness in fw_completeness.items():
            if completeness < 70:
                all_blocking.append(f"Framework {fw}: completeness {completeness:.0f}% is below 70% threshold")
            elif completeness < 90:
                all_advisory.append(f"Framework {fw}: completeness {completeness:.0f}% — gap fill recommended before publication")

        # --- Assurance readiness (ISAE 3000 proxy) ---
        assurance_pct = self._calculate_assurance_pct(overall, consistency.consistency_score_pct)

        # --- ESAP readiness ---
        esap_ready = (
            "CSRD" in frameworks
            and fw_completeness.get("CSRD", 0) >= 90
            and "E1-6_s1" in engine_outputs
        )

        return ComprehensiveReportResult(
            entity_id=entity_id,
            reporting_year=reporting_year,
            frameworks_compiled=frameworks,
            overall_completeness_pct=overall,
            framework_completeness=fw_completeness,
            sections=sections,
            consistency_check_summary={
                "rules_evaluated": consistency.rules_evaluated,
                "rules_passed": consistency.rules_passed,
                "consistency_score_pct": consistency.consistency_score_pct,
                "blocking_failures": len(consistency.blocking_failures),
            },
            blocking_gaps=all_blocking[:20],
            advisory_gaps=all_advisory[:20],
            assurance_readiness_pct=assurance_pct,
            esap_ready=esap_ready,
            data_lineage_summary={
                "total_dps_mapped": len(CROSS_FRAMEWORK_MAPPINGS),
                "source_engines": list({m["source_engine"] for m in CROSS_FRAMEWORK_MAPPINGS}),
            },
        )

    # ------------------------------------------------------------------
    # 2. ESRS Report Generation
    # ------------------------------------------------------------------

    def generate_esrs_report(
        self,
        entity_id: str,
        engine_outputs: dict,
        wave: str,
        reporting_year: int,
    ) -> ESRSReportResult:
        """Full ESRS disclosure set with DP completeness, gap analysis, and priority actions."""
        wave_data = CSRD_WAVES.get(wave, CSRD_WAVES["wave_1"])
        phase_in_available = wave_data.get("phase_in_relief", [])

        mandatory_dps = [dp for dp in ESRS_IG3_CHECKLIST if dp["mandatory"]]
        phase_in_dps = [dp for dp in mandatory_dps if dp["phase_in"] is not None]
        hard_mandatory = [dp for dp in mandatory_dps if dp["phase_in"] is None]
        voluntary_dps = [dp for dp in ESRS_IG3_CHECKLIST if not dp["mandatory"]]

        # Completeness check against engine_outputs
        provided_hard = [dp for dp in hard_mandatory if dp["dp_id"] in engine_outputs]
        provided_phase_in = [dp for dp in phase_in_dps if dp["dp_id"] in engine_outputs]
        provided_voluntary = [dp for dp in voluntary_dps if dp["dp_id"] in engine_outputs]

        mandatory_completeness = round(
            (len(provided_hard) + len(provided_phase_in)) / max(len(mandatory_dps), 1) * 100, 1
        )

        # Gap analysis
        gap_dps = []
        for dp in mandatory_dps:
            if dp["dp_id"] not in engine_outputs:
                gap_dps.append({
                    "dp_id": dp["dp_id"],
                    "description": dp["description"],
                    "standard": dp["standard"],
                    "phase_in": dp["phase_in"],
                    "topic_weight": dp["topic_weight"],
                    "severity": "blocking" if dp["phase_in"] is None else "phase_in_relief",
                })

        # Topic completeness
        topic_completeness = self._calculate_topic_completeness(engine_outputs)

        # Assurance readiness tier
        if mandatory_completeness >= 95:
            assurance_tier = "ready_for_limited_assurance"
        elif mandatory_completeness >= 80:
            assurance_tier = "nearly_ready"
        elif mandatory_completeness >= 60:
            assurance_tier = "requires_remediation"
        else:
            assurance_tier = "not_ready"

        # Priority gaps (top 10 by weight, blocking only)
        priority = sorted(
            [g for g in gap_dps if g["severity"] == "blocking"],
            key=lambda x: x["topic_weight"],
            reverse=True,
        )[:10]
        priority_actions = [f"Provide {g['dp_id']} ({g['description']}) — weight {g['topic_weight']}" for g in priority]

        return ESRSReportResult(
            entity_id=entity_id,
            reporting_year=reporting_year,
            wave=wave,
            total_mandatory_dps=len(mandatory_dps),
            provided_mandatory_dps=len(provided_hard) + len(provided_phase_in),
            mandatory_completeness_pct=mandatory_completeness,
            phase_in_dps=len(phase_in_dps),
            provided_phase_in_dps=len(provided_phase_in),
            voluntary_dps_provided=len(provided_voluntary),
            gap_dps=gap_dps,
            topic_completeness=topic_completeness,
            assurance_readiness=assurance_tier,
            priority_gaps=priority_actions,
        )

    # ------------------------------------------------------------------
    # 3. XBRL Tagging
    # ------------------------------------------------------------------

    def generate_xbrl_tagging(
        self,
        entity_id: str,
        quantitative_dps: dict,
    ) -> XBRLTaggingResult:
        """Generate XBRL instance document structure (EFRAG ESRS-XBRL-2024-01-01)."""
        taxonomy_version = "ESRS-XBRL-2024-01-01"
        concept_map = {c["dp_id"]: c for c in ESRS_XBRL_CONCEPTS}

        facts = []
        validation_warnings = []
        untagged = []

        for dp_id, value in quantitative_dps.items():
            concept_def = concept_map.get(dp_id)
            if concept_def is None:
                untagged.append(dp_id)
                validation_warnings.append(f"No XBRL concept mapping found for DP '{dp_id}' — manual tagging required")
                continue

            # Basic type validation
            if concept_def["data_type"] == "xbrli:integerItemType" and not isinstance(value, (int, float)):
                validation_warnings.append(f"{dp_id}: expected integer, got {type(value).__name__}")
            if value is None:
                validation_warnings.append(f"{dp_id}: null value — XBRL requires explicit nil='true' or populated value")
                continue

            facts.append({
                "concept": concept_def["concept"],
                "dp_id": dp_id,
                "value": value,
                "unit": concept_def["unit"],
                "data_type": concept_def["data_type"],
                "period_type": concept_def["period_type"],
                "decimals": -3 if "monetary" in concept_def["data_type"] else 2,
                "context_ref": f"duration_{entity_id}" if concept_def["period_type"] == "duration" else f"instant_{entity_id}",
            })

        instance_doc = {
            "xbrl_version": "2.1",
            "taxonomy_ref": f"https://xbrl.efrag.org/taxonomy/{taxonomy_version}/esrs-all.xsd",
            "entity_identifier": entity_id,
            "reporting_scheme": "ESRS",
            "entity_schema": "LEI",
            "contexts": [
                {"context_id": f"duration_{entity_id}", "period_type": "duration"},
                {"context_id": f"instant_{entity_id}", "period_type": "instant"},
            ],
            "units": list({f["unit"] for f in facts}),
            "facts": facts,
        }

        return XBRLTaggingResult(
            entity_id=entity_id,
            reporting_year=0,
            instance_document=instance_doc,
            tagged_facts_count=len(facts),
            validation_warnings=validation_warnings,
            untagged_dps=untagged,
            taxonomy_version=taxonomy_version,
        )

    # ------------------------------------------------------------------
    # 4. Cross-Framework Consistency Check
    # ------------------------------------------------------------------

    def check_cross_framework_consistency(
        self,
        entity_id: str,
        multi_framework_data: dict,
    ) -> ConsistencyCheckResult:
        """Evaluate 20 consistency rules across frameworks."""
        blocking_failures = []
        advisory_failures = []
        passed_rules = []

        for rule in CONSISTENCY_RULES:
            # Gather values for all DPs in this rule
            dp_values = {}
            for dp_id in rule["dps_involved"]:
                if dp_id in multi_framework_data:
                    dp_values[dp_id] = multi_framework_data[dp_id]

            if len(dp_values) < 2:
                # Cannot evaluate — data missing
                detail = f"Insufficient data to evaluate ({len(dp_values)}/{len(rule['dps_involved'])} DPs provided)"
                entry = {
                    "rule_id": rule["rule_id"],
                    "name": rule["name"],
                    "detail": detail,
                    "severity": rule["severity"],
                    "remediation": rule["remediation"],
                }
                if rule["severity"] == "blocking":
                    blocking_failures.append(entry)
                else:
                    advisory_failures.append(entry)
                continue

            # Check numeric consistency for quantitative DPs
            numeric_vals = [v for v in dp_values.values() if isinstance(v, (int, float))]
            if len(numeric_vals) >= 2:
                max_v = max(numeric_vals)
                min_v = min(numeric_vals)
                if max_v > 0:
                    deviation_pct = (max_v - min_v) / max_v * 100
                    if deviation_pct > rule["tolerance_pct"]:
                        detail = f"Max deviation {deviation_pct:.1f}% exceeds tolerance {rule['tolerance_pct']}%"
                        entry = {
                            "rule_id": rule["rule_id"],
                            "name": rule["name"],
                            "detail": detail,
                            "dp_values": dp_values,
                            "deviation_pct": round(deviation_pct, 1),
                            "tolerance_pct": rule["tolerance_pct"],
                            "severity": rule["severity"],
                            "remediation": rule["remediation"],
                        }
                        if rule["severity"] == "blocking":
                            blocking_failures.append(entry)
                        else:
                            advisory_failures.append(entry)
                        continue

            passed_rules.append(rule["rule_id"])

        rules_evaluated = len(CONSISTENCY_RULES)
        rules_passed = len(passed_rules)
        consistency_score = round(rules_passed / max(rules_evaluated, 1) * 100, 1)

        return ConsistencyCheckResult(
            entity_id=entity_id,
            rules_evaluated=rules_evaluated,
            rules_passed=rules_passed,
            rules_failed=rules_evaluated - rules_passed,
            consistency_score_pct=consistency_score,
            blocking_failures=blocking_failures,
            advisory_failures=advisory_failures,
            passed_rules=passed_rules,
        )

    # ------------------------------------------------------------------
    # 5. Readiness Score
    # ------------------------------------------------------------------

    def calculate_readiness_score(
        self,
        entity_id: str,
        frameworks: list[str],
        engine_outputs: dict = None,
        wave: str = "wave_1",
    ) -> ReadinessScoreResult:
        """Calculate overall reporting readiness with blocking vs advisory gap classification."""
        if engine_outputs is None:
            engine_outputs = {}

        fw_readiness: dict[str, float] = {}
        blocking_gaps: list[dict] = []
        advisory_gaps: list[dict] = []

        # CSRD readiness
        if "CSRD" in frameworks:
            csrd_result = self.generate_esrs_report(entity_id, engine_outputs, wave, 2024)
            fw_readiness["CSRD"] = csrd_result.mandatory_completeness_pct
            for gap in csrd_result.gap_dps[:10]:
                if gap["severity"] == "blocking":
                    blocking_gaps.append({"framework": "CSRD", "dp_id": gap["dp_id"], "description": gap["description"]})
                else:
                    advisory_gaps.append({"framework": "CSRD", "dp_id": gap["dp_id"], "description": gap["description"]})

        # TCFD readiness (11 recommended disclosures, proxy: check key DPs)
        if "TCFD" in frameworks:
            tcfd_dps = ["E1-6_s1", "E1-4", "E1-9_phy", "E1-9_trans", "S2-SCEN1", "S2-SCEN2"]
            provided = sum(1 for d in tcfd_dps if d in engine_outputs)
            fw_readiness["TCFD"] = round(provided / len(tcfd_dps) * 100, 1)
            if fw_readiness["TCFD"] < 80:
                advisory_gaps.append({"framework": "TCFD", "dp_id": "TCFD_scenario", "description": "Climate scenario analysis incomplete"})

        # IFRS S2 readiness
        if "IFRS_S2" in frameworks:
            s2_dps = ["E1-6_s1", "E1-6_s2_loc", "E1-6_s3_tot", "S2-SCEN1", "S2-FIN1", "S2-CAPEX1"]
            provided = sum(1 for d in s2_dps if d in engine_outputs)
            fw_readiness["IFRS_S2"] = round(provided / len(s2_dps) * 100, 1)
            if fw_readiness["IFRS_S2"] < 70:
                blocking_gaps.append({"framework": "IFRS_S2", "dp_id": "S2_GHG", "description": "Scope 1/2/3 GHG data required for IFRS S2 compliance"})

        # GRI readiness
        if "GRI" in frameworks:
            gri_dps = ["E1-6_s1", "E1-6_s3_tot", "S1-6_emp_tot", "S1-12_gpg", "G1-4_fines_tot"]
            provided = sum(1 for d in gri_dps if d in engine_outputs)
            fw_readiness["GRI"] = round(provided / len(gri_dps) * 100, 1)

        # SFDR readiness
        if "SFDR" in frameworks:
            sfdr_dps = ["SFDR-PAI-1", "SFDR-PAI-2", "SFDR-PAI-5", "SFDR-PAI-6", "SFDR-PAI-13", "SFDR-PAI-14"]
            provided = sum(1 for d in sfdr_dps if d in engine_outputs)
            fw_readiness["SFDR"] = round(provided / len(sfdr_dps) * 100, 1)

        # TNFD readiness
        if "TNFD" in frameworks:
            tnfd_dps = ["TNFD-B1", "TNFD-B2", "TNFD-C1", "TNFD-D1"]
            provided = sum(1 for d in tnfd_dps if d in engine_outputs)
            fw_readiness["TNFD"] = round(provided / len(tnfd_dps) * 100, 1)

        overall = round(sum(fw_readiness.values()) / max(len(fw_readiness), 1), 1)

        if overall >= 90:
            readiness_tier = "ready"
        elif overall >= 70:
            readiness_tier = "nearly_ready"
        elif overall >= 50:
            readiness_tier = "requires_remediation"
        else:
            readiness_tier = "not_ready"

        wave_data = CSRD_WAVES.get(wave, CSRD_WAVES["wave_1"])
        wave_readiness = f"Wave: {wave} — First reporting year {wave_data['first_reporting_year']}"

        # Top 10 priority actions
        top_10 = []
        for bg in blocking_gaps[:5]:
            top_10.append(f"[BLOCKING] {bg['framework']}: {bg['description']}")
        for ag in advisory_gaps[:5]:
            top_10.append(f"[ADVISORY] {ag['framework']}: {ag['description']}")
        if len(top_10) < 5:
            top_10.append("Run cross-framework consistency checks across all 20 rules")
            top_10.append("Implement XBRL tagging for all quantitative ESRS DPs")
            top_10.append("Engage external assurance provider for ISAE 3000 / ISSA 5000 readiness review")
            top_10.append("Confirm ESAP filing format (iXBRL inline XBRL) and submission timeline")
            top_10.append("Map all data lineage from source systems to each ESRS disclosure")

        # Weeks estimate: 2 weeks per 10% gap
        gap = max(0, 90 - overall)
        weeks = int(math.ceil(gap / 10 * 2))

        return ReadinessScoreResult(
            entity_id=entity_id,
            frameworks=frameworks,
            overall_readiness_pct=overall,
            readiness_tier=readiness_tier,
            framework_readiness=fw_readiness,
            blocking_gaps=blocking_gaps[:10],
            advisory_gaps=advisory_gaps[:10],
            wave_readiness=wave_readiness,
            top_10_priority_actions=top_10[:10],
            estimated_weeks_to_ready=weeks,
        )

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_framework_sections(self, framework: str, engine_outputs: dict, reporting_year: int) -> list[ReportSection]:
        """Build report sections for a given framework based on engine outputs."""
        sections = []
        # Determine relevant mappings for this framework
        if framework == "CSRD":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("esrs_ref")]
        elif framework == "IFRS_S2":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("ifrs_s2_ref")]
        elif framework == "TCFD":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("tcfd_ref")]
        elif framework == "TNFD":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("tnfd_ref")]
        elif framework == "GRI":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("gri_ref")]
        elif framework == "SFDR":
            relevant = [m for m in CROSS_FRAMEWORK_MAPPINGS if m.get("sfdr_ref")]
        else:
            relevant = []

        # Group by topic/standard area
        topics: dict[str, list] = {}
        for m in relevant:
            topic_key = m.get("esrs_ref", m.get("tcfd_ref", m.get("gri_ref", "other"))).split("-")[0] if relevant else "other"
            topics.setdefault(topic_key, []).append(m)

        for topic, dps in topics.items():
            required = len(dps)
            provided = sum(1 for d in dps if d["dp_id"] in engine_outputs)
            completeness = round(provided / max(required, 1) * 100, 1)
            status = "complete" if completeness >= 90 else "partial" if completeness > 0 else "missing"
            source_engines = list({d["source_engine"] for d in dps})
            sections.append(ReportSection(
                section_id=f"{framework}_{topic}",
                framework=framework,
                title=f"{framework} — {topic}",
                disclosure_type="mixed",
                status=status,
                completeness_pct=completeness,
                provided_dps=provided,
                required_dps=required,
                source_engines=source_engines,
                narrative_text=f"Section covers {required} disclosure requirements. {provided} provided.",
                data_lineage=[{"dp_id": d["dp_id"], "source": d["source_engine"]} for d in dps],
            ))
        return sections

    def _calculate_topic_completeness(self, engine_outputs: dict) -> dict[str, float]:
        """Per-ESRS standard completeness score."""
        standards = {}
        for dp in ESRS_IG3_CHECKLIST:
            std = dp["standard"]
            if std not in standards:
                standards[std] = {"required": 0, "provided": 0, "weighted_req": 0, "weighted_prov": 0}
            standards[std]["required"] += 1
            standards[std]["weighted_req"] += dp["topic_weight"]
            if dp["dp_id"] in engine_outputs:
                standards[std]["provided"] += 1
                standards[std]["weighted_prov"] += dp["topic_weight"]
        return {
            std: round(v["weighted_prov"] / max(v["weighted_req"], 1) * 100, 1)
            for std, v in standards.items()
        }

    def _calculate_assurance_pct(self, completeness: float, consistency: float) -> float:
        """Proxy assurance readiness from completeness and consistency scores."""
        raw = completeness * 0.6 + consistency * 0.4
        return round(min(100, raw), 1)
