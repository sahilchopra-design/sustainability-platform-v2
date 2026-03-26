"""
Physical Climate Risk Pricing Engine — E104
============================================
Prices acute and chronic physical climate risk for financial assets using
NatCat peril damage functions, NGFS physical damage amplifiers, return-period
loss tables (RMS/AIR/Verisk style), and insurance protection-gap data from
Swiss Re sigma.

Sub-modules:
  1. Country Physical Risk Profiling — 30-country baseline risk scores
  2. NGFS Physical Damage Amplifiers — scenario × horizon multipliers
  3. NatCat Return-Period Loss Tables — 5 perils × 5 return periods × 5 asset classes
  4. Insurance Protection Gap — insured/economic loss ratios by country/peril
  5. Physical Risk Pricing — EAL, PML, Climate VaR, risk premium bps
  6. Stranding Probability — chronic exposure under NGFS scenario/horizon
  7. Reference Data Endpoints — benchmarks, damage functions, amplifiers

References:
  - NGFS CGFI Physical Risk Assessment (2021, 2023)
  - Swiss Re sigma No. 1/2024 — Natural catastrophes and climate change
  - RMS North Atlantic Hurricane Model v21
  - AIR Worldwide Inland Flood Model
  - Verisk Wildfire Risk Analytics
  - IPCC AR6 WGI Chapter 11 — Weather and Climate Extremes
  - TCFD Guidance on Scenario Analysis (2020) — physical risk module
  - UNDRR Sendai Framework — risk reduction targets
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional


# ---------------------------------------------------------------------------
# Reference Data — 30-Country Physical Risk Baselines
# Scores are normalised 0-1 (higher = more exposed).
# Sources: INFORM Risk Index 2023, ND-GAIN 2023, Swiss Re CatNet, IPCC AR6
# ---------------------------------------------------------------------------

COUNTRY_PHYSICAL_RISK_PROFILES: dict[str, dict] = {
    "USA": {
        "name": "United States of America",
        "region": "North America",
        "flood_baseline": 0.42,
        "cyclone_baseline": 0.55,
        "wildfire_baseline": 0.60,
        "drought_baseline": 0.38,
        "heatwave_baseline": 0.35,
        "sea_level_risk": 0.32,
        "earthquake_baseline": 0.40,
        "nd_gain_score": 0.585,
        "inform_hazard": 0.44,
    },
    "GBR": {
        "name": "United Kingdom",
        "region": "Europe",
        "flood_baseline": 0.38,
        "cyclone_baseline": 0.08,
        "wildfire_baseline": 0.12,
        "drought_baseline": 0.22,
        "heatwave_baseline": 0.28,
        "sea_level_risk": 0.35,
        "earthquake_baseline": 0.07,
        "nd_gain_score": 0.610,
        "inform_hazard": 0.21,
    },
    "DEU": {
        "name": "Germany",
        "region": "Europe",
        "flood_baseline": 0.40,
        "cyclone_baseline": 0.06,
        "wildfire_baseline": 0.10,
        "drought_baseline": 0.30,
        "heatwave_baseline": 0.32,
        "sea_level_risk": 0.22,
        "earthquake_baseline": 0.12,
        "nd_gain_score": 0.620,
        "inform_hazard": 0.19,
    },
    "FRA": {
        "name": "France",
        "region": "Europe",
        "flood_baseline": 0.38,
        "cyclone_baseline": 0.10,
        "wildfire_baseline": 0.35,
        "drought_baseline": 0.30,
        "heatwave_baseline": 0.38,
        "sea_level_risk": 0.25,
        "earthquake_baseline": 0.18,
        "nd_gain_score": 0.615,
        "inform_hazard": 0.22,
    },
    "JPN": {
        "name": "Japan",
        "region": "Asia-Pacific",
        "flood_baseline": 0.62,
        "cyclone_baseline": 0.72,
        "wildfire_baseline": 0.15,
        "drought_baseline": 0.18,
        "heatwave_baseline": 0.52,
        "sea_level_risk": 0.45,
        "earthquake_baseline": 0.90,
        "nd_gain_score": 0.595,
        "inform_hazard": 0.65,
    },
    "CHN": {
        "name": "China",
        "region": "Asia-Pacific",
        "flood_baseline": 0.65,
        "cyclone_baseline": 0.55,
        "wildfire_baseline": 0.30,
        "drought_baseline": 0.45,
        "heatwave_baseline": 0.50,
        "sea_level_risk": 0.42,
        "earthquake_baseline": 0.55,
        "nd_gain_score": 0.510,
        "inform_hazard": 0.52,
    },
    "IND": {
        "name": "India",
        "region": "South Asia",
        "flood_baseline": 0.75,
        "cyclone_baseline": 0.65,
        "wildfire_baseline": 0.35,
        "drought_baseline": 0.62,
        "heatwave_baseline": 0.78,
        "sea_level_risk": 0.55,
        "earthquake_baseline": 0.50,
        "nd_gain_score": 0.430,
        "inform_hazard": 0.68,
    },
    "BRA": {
        "name": "Brazil",
        "region": "Latin America",
        "flood_baseline": 0.68,
        "cyclone_baseline": 0.20,
        "wildfire_baseline": 0.72,
        "drought_baseline": 0.55,
        "heatwave_baseline": 0.55,
        "sea_level_risk": 0.30,
        "earthquake_baseline": 0.10,
        "nd_gain_score": 0.480,
        "inform_hazard": 0.50,
    },
    "AUS": {
        "name": "Australia",
        "region": "Asia-Pacific",
        "flood_baseline": 0.48,
        "cyclone_baseline": 0.50,
        "wildfire_baseline": 0.82,
        "drought_baseline": 0.70,
        "heatwave_baseline": 0.72,
        "sea_level_risk": 0.28,
        "earthquake_baseline": 0.20,
        "nd_gain_score": 0.640,
        "inform_hazard": 0.42,
    },
    "ZAF": {
        "name": "South Africa",
        "region": "Africa",
        "flood_baseline": 0.50,
        "cyclone_baseline": 0.25,
        "wildfire_baseline": 0.55,
        "drought_baseline": 0.68,
        "heatwave_baseline": 0.62,
        "sea_level_risk": 0.25,
        "earthquake_baseline": 0.15,
        "nd_gain_score": 0.440,
        "inform_hazard": 0.51,
    },
    "NLD": {
        "name": "Netherlands",
        "region": "Europe",
        "flood_baseline": 0.72,
        "cyclone_baseline": 0.05,
        "wildfire_baseline": 0.05,
        "drought_baseline": 0.18,
        "heatwave_baseline": 0.30,
        "sea_level_risk": 0.85,
        "earthquake_baseline": 0.05,
        "nd_gain_score": 0.635,
        "inform_hazard": 0.28,
    },
    "BGD": {
        "name": "Bangladesh",
        "region": "South Asia",
        "flood_baseline": 0.92,
        "cyclone_baseline": 0.80,
        "wildfire_baseline": 0.10,
        "drought_baseline": 0.55,
        "heatwave_baseline": 0.75,
        "sea_level_risk": 0.95,
        "earthquake_baseline": 0.30,
        "nd_gain_score": 0.310,
        "inform_hazard": 0.85,
    },
    "PHL": {
        "name": "Philippines",
        "region": "South-East Asia",
        "flood_baseline": 0.82,
        "cyclone_baseline": 0.90,
        "wildfire_baseline": 0.20,
        "drought_baseline": 0.42,
        "heatwave_baseline": 0.60,
        "sea_level_risk": 0.80,
        "earthquake_baseline": 0.75,
        "nd_gain_score": 0.370,
        "inform_hazard": 0.82,
    },
    "IDN": {
        "name": "Indonesia",
        "region": "South-East Asia",
        "flood_baseline": 0.78,
        "cyclone_baseline": 0.30,
        "wildfire_baseline": 0.65,
        "drought_baseline": 0.40,
        "heatwave_baseline": 0.55,
        "sea_level_risk": 0.75,
        "earthquake_baseline": 0.88,
        "nd_gain_score": 0.390,
        "inform_hazard": 0.75,
    },
    "VNM": {
        "name": "Vietnam",
        "region": "South-East Asia",
        "flood_baseline": 0.80,
        "cyclone_baseline": 0.75,
        "wildfire_baseline": 0.20,
        "drought_baseline": 0.38,
        "heatwave_baseline": 0.60,
        "sea_level_risk": 0.72,
        "earthquake_baseline": 0.25,
        "nd_gain_score": 0.405,
        "inform_hazard": 0.70,
    },
    "MEX": {
        "name": "Mexico",
        "region": "Latin America",
        "flood_baseline": 0.55,
        "cyclone_baseline": 0.62,
        "wildfire_baseline": 0.45,
        "drought_baseline": 0.52,
        "heatwave_baseline": 0.50,
        "sea_level_risk": 0.35,
        "earthquake_baseline": 0.70,
        "nd_gain_score": 0.465,
        "inform_hazard": 0.60,
    },
    "EGY": {
        "name": "Egypt",
        "region": "MENA",
        "flood_baseline": 0.30,
        "cyclone_baseline": 0.10,
        "wildfire_baseline": 0.15,
        "drought_baseline": 0.72,
        "heatwave_baseline": 0.80,
        "sea_level_risk": 0.55,
        "earthquake_baseline": 0.30,
        "nd_gain_score": 0.385,
        "inform_hazard": 0.45,
    },
    "NGA": {
        "name": "Nigeria",
        "region": "Africa",
        "flood_baseline": 0.65,
        "cyclone_baseline": 0.15,
        "wildfire_baseline": 0.40,
        "drought_baseline": 0.65,
        "heatwave_baseline": 0.70,
        "sea_level_risk": 0.40,
        "earthquake_baseline": 0.10,
        "nd_gain_score": 0.320,
        "inform_hazard": 0.62,
    },
    "PAK": {
        "name": "Pakistan",
        "region": "South Asia",
        "flood_baseline": 0.85,
        "cyclone_baseline": 0.40,
        "wildfire_baseline": 0.25,
        "drought_baseline": 0.70,
        "heatwave_baseline": 0.85,
        "sea_level_risk": 0.35,
        "earthquake_baseline": 0.60,
        "nd_gain_score": 0.340,
        "inform_hazard": 0.78,
    },
    "TUR": {
        "name": "Turkey",
        "region": "Europe/MENA",
        "flood_baseline": 0.45,
        "cyclone_baseline": 0.12,
        "wildfire_baseline": 0.48,
        "drought_baseline": 0.50,
        "heatwave_baseline": 0.55,
        "sea_level_risk": 0.22,
        "earthquake_baseline": 0.80,
        "nd_gain_score": 0.460,
        "inform_hazard": 0.55,
    },
    "ARE": {
        "name": "United Arab Emirates",
        "region": "MENA",
        "flood_baseline": 0.22,
        "cyclone_baseline": 0.18,
        "wildfire_baseline": 0.08,
        "drought_baseline": 0.80,
        "heatwave_baseline": 0.90,
        "sea_level_risk": 0.45,
        "earthquake_baseline": 0.15,
        "nd_gain_score": 0.520,
        "inform_hazard": 0.35,
    },
    "SAU": {
        "name": "Saudi Arabia",
        "region": "MENA",
        "flood_baseline": 0.20,
        "cyclone_baseline": 0.12,
        "wildfire_baseline": 0.08,
        "drought_baseline": 0.85,
        "heatwave_baseline": 0.92,
        "sea_level_risk": 0.30,
        "earthquake_baseline": 0.18,
        "nd_gain_score": 0.500,
        "inform_hazard": 0.32,
    },
    "SGP": {
        "name": "Singapore",
        "region": "South-East Asia",
        "flood_baseline": 0.35,
        "cyclone_baseline": 0.15,
        "wildfire_baseline": 0.05,
        "drought_baseline": 0.10,
        "heatwave_baseline": 0.50,
        "sea_level_risk": 0.65,
        "earthquake_baseline": 0.10,
        "nd_gain_score": 0.645,
        "inform_hazard": 0.25,
    },
    "CAN": {
        "name": "Canada",
        "region": "North America",
        "flood_baseline": 0.40,
        "cyclone_baseline": 0.20,
        "wildfire_baseline": 0.58,
        "drought_baseline": 0.35,
        "heatwave_baseline": 0.40,
        "sea_level_risk": 0.28,
        "earthquake_baseline": 0.30,
        "nd_gain_score": 0.625,
        "inform_hazard": 0.25,
    },
    "ARG": {
        "name": "Argentina",
        "region": "Latin America",
        "flood_baseline": 0.55,
        "cyclone_baseline": 0.18,
        "wildfire_baseline": 0.42,
        "drought_baseline": 0.52,
        "heatwave_baseline": 0.50,
        "sea_level_risk": 0.22,
        "earthquake_baseline": 0.35,
        "nd_gain_score": 0.455,
        "inform_hazard": 0.45,
    },
    "KOR": {
        "name": "South Korea",
        "region": "Asia-Pacific",
        "flood_baseline": 0.55,
        "cyclone_baseline": 0.45,
        "wildfire_baseline": 0.20,
        "drought_baseline": 0.22,
        "heatwave_baseline": 0.48,
        "sea_level_risk": 0.35,
        "earthquake_baseline": 0.38,
        "nd_gain_score": 0.600,
        "inform_hazard": 0.40,
    },
    "ESP": {
        "name": "Spain",
        "region": "Europe",
        "flood_baseline": 0.40,
        "cyclone_baseline": 0.08,
        "wildfire_baseline": 0.55,
        "drought_baseline": 0.62,
        "heatwave_baseline": 0.62,
        "sea_level_risk": 0.28,
        "earthquake_baseline": 0.28,
        "nd_gain_score": 0.600,
        "inform_hazard": 0.32,
    },
    "ITA": {
        "name": "Italy",
        "region": "Europe",
        "flood_baseline": 0.45,
        "cyclone_baseline": 0.08,
        "wildfire_baseline": 0.48,
        "drought_baseline": 0.52,
        "heatwave_baseline": 0.58,
        "sea_level_risk": 0.32,
        "earthquake_baseline": 0.68,
        "nd_gain_score": 0.590,
        "inform_hazard": 0.38,
    },
    "THA": {
        "name": "Thailand",
        "region": "South-East Asia",
        "flood_baseline": 0.75,
        "cyclone_baseline": 0.50,
        "wildfire_baseline": 0.22,
        "drought_baseline": 0.40,
        "heatwave_baseline": 0.62,
        "sea_level_risk": 0.60,
        "earthquake_baseline": 0.20,
        "nd_gain_score": 0.430,
        "inform_hazard": 0.60,
    },
    "POL": {
        "name": "Poland",
        "region": "Europe",
        "flood_baseline": 0.42,
        "cyclone_baseline": 0.04,
        "wildfire_baseline": 0.15,
        "drought_baseline": 0.28,
        "heatwave_baseline": 0.32,
        "sea_level_risk": 0.18,
        "earthquake_baseline": 0.06,
        "nd_gain_score": 0.555,
        "inform_hazard": 0.18,
    },
}

# ---------------------------------------------------------------------------
# Reference Data — NGFS Physical Damage Amplifiers
# Multipliers applied to baseline country scores per scenario × time horizon
# Sources: NGFS CGFI 2023, IPCC AR6 SSP damage functions
# ---------------------------------------------------------------------------

NGFS_PHYSICAL_AMPLIFIERS: dict[str, dict[str, dict[str, float]]] = {
    "orderly": {
        "2030": {
            "flood": 1.10,
            "cyclone": 1.08,
            "wildfire": 1.12,
            "drought": 1.15,
            "heatwave": 1.18,
            "sea_level": 1.05,
            "earthquake": 1.00,
        },
        "2040": {
            "flood": 1.18,
            "cyclone": 1.14,
            "wildfire": 1.22,
            "drought": 1.25,
            "heatwave": 1.30,
            "sea_level": 1.12,
            "earthquake": 1.00,
        },
        "2050": {
            "flood": 1.25,
            "cyclone": 1.20,
            "wildfire": 1.32,
            "drought": 1.35,
            "heatwave": 1.42,
            "sea_level": 1.20,
            "earthquake": 1.00,
        },
    },
    "disorderly": {
        "2030": {
            "flood": 1.15,
            "cyclone": 1.12,
            "wildfire": 1.18,
            "drought": 1.20,
            "heatwave": 1.25,
            "sea_level": 1.08,
            "earthquake": 1.00,
        },
        "2040": {
            "flood": 1.28,
            "cyclone": 1.22,
            "wildfire": 1.35,
            "drought": 1.38,
            "heatwave": 1.45,
            "sea_level": 1.18,
            "earthquake": 1.00,
        },
        "2050": {
            "flood": 1.45,
            "cyclone": 1.35,
            "wildfire": 1.55,
            "drought": 1.60,
            "heatwave": 1.70,
            "sea_level": 1.35,
            "earthquake": 1.00,
        },
    },
    "hot_house": {
        "2030": {
            "flood": 1.20,
            "cyclone": 1.18,
            "wildfire": 1.25,
            "drought": 1.28,
            "heatwave": 1.35,
            "sea_level": 1.12,
            "earthquake": 1.00,
        },
        "2040": {
            "flood": 1.42,
            "cyclone": 1.38,
            "wildfire": 1.55,
            "drought": 1.60,
            "heatwave": 1.72,
            "sea_level": 1.30,
            "earthquake": 1.00,
        },
        "2050": {
            "flood": 1.70,
            "cyclone": 1.65,
            "wildfire": 1.90,
            "drought": 2.00,
            "heatwave": 2.20,
            "sea_level": 1.60,
            "earthquake": 1.00,
        },
    },
}

# ---------------------------------------------------------------------------
# Reference Data — NatCat Return-Period Loss Tables
# Loss as % of asset value; peril × return period × asset class
# Sources: RMS, AIR Worldwide, Verisk (publicly disclosed industry benchmarks)
# ---------------------------------------------------------------------------

RETURN_PERIOD_LOSS_TABLES: dict[str, dict[str, dict[str, float]]] = {
    "flood": {
        "property": {"10yr": 0.5, "25yr": 2.0, "50yr": 5.0, "100yr": 12.0, "200yr": 22.0, "500yr": 38.0},
        "infrastructure": {"10yr": 0.8, "25yr": 3.0, "50yr": 7.0, "100yr": 15.0, "200yr": 28.0, "500yr": 45.0},
        "agriculture": {"10yr": 2.0, "25yr": 8.0, "50yr": 18.0, "100yr": 30.0, "200yr": 48.0, "500yr": 65.0},
        "energy": {"10yr": 0.6, "25yr": 2.5, "50yr": 6.0, "100yr": 13.0, "200yr": 24.0, "500yr": 40.0},
        "marine": {"10yr": 1.5, "25yr": 5.0, "50yr": 12.0, "100yr": 22.0, "200yr": 38.0, "500yr": 55.0},
    },
    "cyclone": {
        "property": {"10yr": 0.3, "25yr": 1.5, "50yr": 4.0, "100yr": 10.0, "200yr": 20.0, "500yr": 35.0},
        "infrastructure": {"10yr": 0.5, "25yr": 2.5, "50yr": 6.0, "100yr": 14.0, "200yr": 26.0, "500yr": 42.0},
        "agriculture": {"10yr": 3.0, "25yr": 10.0, "50yr": 22.0, "100yr": 38.0, "200yr": 55.0, "500yr": 72.0},
        "energy": {"10yr": 0.8, "25yr": 3.5, "50yr": 8.0, "100yr": 18.0, "200yr": 30.0, "500yr": 50.0},
        "marine": {"10yr": 2.0, "25yr": 7.0, "50yr": 16.0, "100yr": 28.0, "200yr": 45.0, "500yr": 62.0},
    },
    "wildfire": {
        "property": {"10yr": 0.2, "25yr": 1.0, "50yr": 3.0, "100yr": 8.0, "200yr": 16.0, "500yr": 28.0},
        "infrastructure": {"10yr": 0.1, "25yr": 0.5, "50yr": 1.5, "100yr": 4.0, "200yr": 9.0, "500yr": 18.0},
        "agriculture": {"10yr": 4.0, "25yr": 12.0, "50yr": 25.0, "100yr": 42.0, "200yr": 60.0, "500yr": 75.0},
        "energy": {"10yr": 0.3, "25yr": 1.2, "50yr": 3.5, "100yr": 9.0, "200yr": 18.0, "500yr": 32.0},
        "marine": {"10yr": 0.0, "25yr": 0.1, "50yr": 0.3, "100yr": 0.8, "200yr": 2.0, "500yr": 5.0},
    },
    "earthquake": {
        "property": {"10yr": 0.1, "25yr": 0.8, "50yr": 3.0, "100yr": 9.0, "200yr": 20.0, "500yr": 38.0},
        "infrastructure": {"10yr": 0.2, "25yr": 1.5, "50yr": 5.0, "100yr": 14.0, "200yr": 28.0, "500yr": 50.0},
        "agriculture": {"10yr": 0.5, "25yr": 2.0, "50yr": 6.0, "100yr": 14.0, "200yr": 25.0, "500yr": 40.0},
        "energy": {"10yr": 0.3, "25yr": 2.0, "50yr": 6.5, "100yr": 16.0, "200yr": 30.0, "500yr": 52.0},
        "marine": {"10yr": 0.5, "25yr": 2.5, "50yr": 8.0, "100yr": 18.0, "200yr": 32.0, "500yr": 55.0},
    },
    "heatwave": {
        "property": {"10yr": 0.1, "25yr": 0.4, "50yr": 1.0, "100yr": 2.5, "200yr": 5.0, "500yr": 10.0},
        "infrastructure": {"10yr": 0.2, "25yr": 0.8, "50yr": 2.0, "100yr": 5.0, "200yr": 10.0, "500yr": 18.0},
        "agriculture": {"10yr": 5.0, "25yr": 14.0, "50yr": 28.0, "100yr": 45.0, "200yr": 62.0, "500yr": 78.0},
        "energy": {"10yr": 0.5, "25yr": 2.0, "50yr": 5.0, "100yr": 11.0, "200yr": 20.0, "500yr": 35.0},
        "marine": {"10yr": 1.0, "25yr": 3.5, "50yr": 8.0, "100yr": 16.0, "200yr": 28.0, "500yr": 42.0},
    },
}

# ---------------------------------------------------------------------------
# Reference Data — NatCat Vulnerability Coefficients by Asset Class
# Used in depth-damage function scaling: loss = coeff × baseline_score × amplifier
# ---------------------------------------------------------------------------

VULNERABILITY_COEFFICIENTS: dict[str, dict[str, float]] = {
    "flood":      {"property": 0.45, "infrastructure": 0.55, "agriculture": 0.70, "energy": 0.50, "marine": 0.60},
    "cyclone":    {"property": 0.40, "infrastructure": 0.50, "agriculture": 0.75, "energy": 0.55, "marine": 0.65},
    "wildfire":   {"property": 0.55, "infrastructure": 0.30, "agriculture": 0.80, "energy": 0.45, "marine": 0.05},
    "earthquake": {"property": 0.60, "infrastructure": 0.65, "agriculture": 0.30, "energy": 0.60, "marine": 0.55},
    "heatwave":   {"property": 0.15, "infrastructure": 0.25, "agriculture": 0.85, "energy": 0.40, "marine": 0.50},
    "drought":    {"property": 0.10, "infrastructure": 0.20, "agriculture": 0.90, "energy": 0.35, "marine": 0.20},
    "sea_level":  {"property": 0.50, "infrastructure": 0.60, "agriculture": 0.55, "energy": 0.45, "marine": 0.70},
}

# ---------------------------------------------------------------------------
# Reference Data — Insurance Protection Gaps
# Ratio: insured_loss / economic_loss (0-1); 1.0 = fully insured
# Sources: Swiss Re sigma No. 1/2024; Munich Re NatCatSERVICE
# ---------------------------------------------------------------------------

INSURANCE_PROTECTION_GAPS: dict[str, dict[str, float]] = {
    "USA": {"flood": 0.40, "cyclone": 0.62, "wildfire": 0.55, "earthquake": 0.35, "heatwave": 0.12, "drought": 0.30},
    "GBR": {"flood": 0.55, "cyclone": 0.70, "wildfire": 0.65, "earthquake": 0.60, "heatwave": 0.10, "drought": 0.20},
    "DEU": {"flood": 0.38, "cyclone": 0.75, "wildfire": 0.60, "earthquake": 0.55, "heatwave": 0.08, "drought": 0.18},
    "FRA": {"flood": 0.45, "cyclone": 0.50, "wildfire": 0.52, "earthquake": 0.50, "heatwave": 0.10, "drought": 0.20},
    "JPN": {"flood": 0.15, "cyclone": 0.22, "wildfire": 0.30, "earthquake": 0.18, "heatwave": 0.05, "drought": 0.08},
    "CHN": {"flood": 0.08, "cyclone": 0.10, "wildfire": 0.12, "earthquake": 0.06, "heatwave": 0.03, "drought": 0.05},
    "IND": {"flood": 0.05, "cyclone": 0.06, "wildfire": 0.04, "earthquake": 0.03, "heatwave": 0.02, "drought": 0.08},
    "BRA": {"flood": 0.06, "cyclone": 0.10, "wildfire": 0.04, "earthquake": 0.05, "heatwave": 0.02, "drought": 0.06},
    "AUS": {"flood": 0.48, "cyclone": 0.55, "wildfire": 0.42, "earthquake": 0.50, "heatwave": 0.08, "drought": 0.22},
    "ZAF": {"flood": 0.12, "cyclone": 0.15, "wildfire": 0.18, "earthquake": 0.10, "heatwave": 0.03, "drought": 0.05},
    "NLD": {"flood": 0.30, "cyclone": 0.70, "wildfire": 0.65, "earthquake": 0.60, "heatwave": 0.08, "drought": 0.15},
    "BGD": {"flood": 0.02, "cyclone": 0.03, "wildfire": 0.02, "earthquake": 0.02, "heatwave": 0.01, "drought": 0.02},
    "PHL": {"flood": 0.03, "cyclone": 0.04, "wildfire": 0.03, "earthquake": 0.03, "heatwave": 0.01, "drought": 0.02},
    "IDN": {"flood": 0.04, "cyclone": 0.05, "wildfire": 0.03, "earthquake": 0.04, "heatwave": 0.01, "drought": 0.02},
    "VNM": {"flood": 0.03, "cyclone": 0.04, "wildfire": 0.02, "earthquake": 0.02, "heatwave": 0.01, "drought": 0.02},
    "MEX": {"flood": 0.08, "cyclone": 0.12, "wildfire": 0.08, "earthquake": 0.06, "heatwave": 0.02, "drought": 0.04},
    "EGY": {"flood": 0.08, "cyclone": 0.10, "wildfire": 0.05, "earthquake": 0.06, "heatwave": 0.02, "drought": 0.03},
    "NGA": {"flood": 0.03, "cyclone": 0.04, "wildfire": 0.02, "earthquake": 0.02, "heatwave": 0.01, "drought": 0.02},
    "PAK": {"flood": 0.02, "cyclone": 0.03, "wildfire": 0.02, "earthquake": 0.02, "heatwave": 0.01, "drought": 0.02},
    "TUR": {"flood": 0.12, "cyclone": 0.20, "wildfire": 0.15, "earthquake": 0.10, "heatwave": 0.04, "drought": 0.06},
    "ARE": {"flood": 0.30, "cyclone": 0.28, "wildfire": 0.25, "earthquake": 0.22, "heatwave": 0.05, "drought": 0.04},
    "SAU": {"flood": 0.20, "cyclone": 0.18, "wildfire": 0.15, "earthquake": 0.15, "heatwave": 0.04, "drought": 0.03},
    "SGP": {"flood": 0.55, "cyclone": 0.45, "wildfire": 0.50, "earthquake": 0.50, "heatwave": 0.08, "drought": 0.15},
    "CAN": {"flood": 0.20, "cyclone": 0.45, "wildfire": 0.38, "earthquake": 0.30, "heatwave": 0.06, "drought": 0.15},
    "ARG": {"flood": 0.06, "cyclone": 0.08, "wildfire": 0.06, "earthquake": 0.05, "heatwave": 0.02, "drought": 0.04},
    "KOR": {"flood": 0.18, "cyclone": 0.22, "wildfire": 0.20, "earthquake": 0.15, "heatwave": 0.04, "drought": 0.08},
    "ESP": {"flood": 0.30, "cyclone": 0.55, "wildfire": 0.25, "earthquake": 0.28, "heatwave": 0.05, "drought": 0.08},
    "ITA": {"flood": 0.18, "cyclone": 0.55, "wildfire": 0.20, "earthquake": 0.15, "heatwave": 0.04, "drought": 0.06},
    "THA": {"flood": 0.05, "cyclone": 0.08, "wildfire": 0.04, "earthquake": 0.04, "heatwave": 0.01, "drought": 0.03},
    "POL": {"flood": 0.22, "cyclone": 0.60, "wildfire": 0.35, "earthquake": 0.40, "heatwave": 0.05, "drought": 0.10},
}

# ---------------------------------------------------------------------------
# Reference Data — Physical Risk Premium Table (bps spread uplift)
# Per risk tier: low / moderate / elevated / high / very_high / extreme
# Sources: NGFS/PRA climate risk pricing guidance; ECB supervisory expectations
# ---------------------------------------------------------------------------

RISK_PREMIUM_TABLE: dict[str, dict[str, float]] = {
    "low":       {"spread_bps": 5,   "climate_var_pct": 0.5,  "eal_multiplier": 1.0},
    "moderate":  {"spread_bps": 15,  "climate_var_pct": 1.5,  "eal_multiplier": 1.2},
    "elevated":  {"spread_bps": 35,  "climate_var_pct": 3.5,  "eal_multiplier": 1.5},
    "high":      {"spread_bps": 75,  "climate_var_pct": 7.0,  "eal_multiplier": 2.0},
    "very_high": {"spread_bps": 150, "climate_var_pct": 14.0, "eal_multiplier": 3.0},
    "extreme":   {"spread_bps": 300, "climate_var_pct": 25.0, "eal_multiplier": 5.0},
}

# Return-period → annualised probability mapping
RETURN_PERIOD_PROBABILITIES: dict[str, float] = {
    "10yr":  0.100,
    "25yr":  0.040,
    "50yr":  0.020,
    "100yr": 0.010,
    "200yr": 0.005,
    "500yr": 0.002,
}

# Chronic stressor labels
CHRONIC_STRESSORS = ["sea_level", "drought", "precipitation_change", "temperature_increase"]
ACUTE_PERILS = ["flood", "cyclone", "wildfire", "earthquake", "heatwave"]

VALID_ASSET_CLASSES = ["property", "infrastructure", "agriculture", "energy", "marine"]
VALID_SCENARIOS = ["orderly", "disorderly", "hot_house"]
VALID_HORIZONS = ["2030", "2040", "2050"]


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def _clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def _composite_baseline_score(profile: dict) -> float:
    """Weighted composite of all peril baselines."""
    weights = {
        "flood_baseline": 0.22,
        "cyclone_baseline": 0.18,
        "wildfire_baseline": 0.14,
        "drought_baseline": 0.12,
        "heatwave_baseline": 0.12,
        "sea_level_risk": 0.12,
        "earthquake_baseline": 0.10,
    }
    return sum(profile.get(k, 0.0) * w for k, w in weights.items())


def _determine_risk_tier(composite_score: float) -> str:
    if composite_score < 0.15:
        return "low"
    elif composite_score < 0.28:
        return "moderate"
    elif composite_score < 0.42:
        return "elevated"
    elif composite_score < 0.58:
        return "high"
    elif composite_score < 0.72:
        return "very_high"
    else:
        return "extreme"


def _expected_annual_loss(
    country_iso: str,
    asset_class: str,
    asset_value_usd: float,
    amplifiers: dict,
) -> float:
    """
    EAL = Σ_perils [ annualised_loss_rate_peril × vulnerability_coeff × amplifier × asset_value ]
    Using trapezoidal integration over return periods.
    """
    profile = COUNTRY_PHYSICAL_RISK_PROFILES.get(country_iso, {})
    eal = 0.0

    peril_baseline_map = {
        "flood": profile.get("flood_baseline", 0.0),
        "cyclone": profile.get("cyclone_baseline", 0.0),
        "wildfire": profile.get("wildfire_baseline", 0.0),
        "earthquake": profile.get("earthquake_baseline", 0.0),
        "heatwave": profile.get("heatwave_baseline", 0.0),
    }

    for peril, baseline in peril_baseline_map.items():
        if asset_class not in RETURN_PERIOD_LOSS_TABLES.get(peril, {}):
            continue
        rp_table = RETURN_PERIOD_LOSS_TABLES[peril][asset_class]
        amp = amplifiers.get(peril, 1.0)
        vuln = VULNERABILITY_COEFFICIENTS.get(peril, {}).get(asset_class, 0.5)

        # Trapezoidal integration over EP curve
        sorted_rps = ["10yr", "25yr", "50yr", "100yr", "200yr", "500yr"]
        for i in range(len(sorted_rps) - 1):
            rp1, rp2 = sorted_rps[i], sorted_rps[i + 1]
            p1 = RETURN_PERIOD_PROBABILITIES[rp1]
            p2 = RETURN_PERIOD_PROBABILITIES[rp2]
            l1 = rp_table[rp1] / 100 * baseline * amp * vuln
            l2 = rp_table[rp2] / 100 * baseline * amp * vuln
            eal += 0.5 * (l1 + l2) * abs(p1 - p2)

    return eal * asset_value_usd


# ---------------------------------------------------------------------------
# Core Engine Functions
# ---------------------------------------------------------------------------

def price_physical_risk(
    entity_id: str,
    asset_class: str,
    country_iso: str,
    asset_value_usd: float,
    ngfs_scenario: str,
    time_horizon: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
) -> dict:
    """
    Full physical risk pricing for a single asset.

    Returns:
      composite_score, EAL, PML (100yr), insurance_gap, climate_VaR (95%),
      risk_premium_bps, risk_tier, per-peril breakdown.
    """
    if country_iso not in COUNTRY_PHYSICAL_RISK_PROFILES:
        return {"error": f"Country {country_iso} not in reference data"}
    if asset_class not in VALID_ASSET_CLASSES:
        return {"error": f"Asset class {asset_class} not valid. Use: {VALID_ASSET_CLASSES}"}
    if ngfs_scenario not in VALID_SCENARIOS:
        return {"error": f"Scenario must be one of {VALID_SCENARIOS}"}
    if time_horizon not in VALID_HORIZONS:
        return {"error": f"Time horizon must be one of {VALID_HORIZONS}"}

    profile = COUNTRY_PHYSICAL_RISK_PROFILES[country_iso]
    amplifiers = NGFS_PHYSICAL_AMPLIFIERS[ngfs_scenario][time_horizon]

    composite_score = _composite_baseline_score(profile)
    # Apply scenario composite amplifier (average of relevant perils)
    avg_amp = sum(amplifiers[p] for p in ACUTE_PERILS if p in amplifiers) / len(ACUTE_PERILS)
    composite_score_stressed = _clamp(composite_score * avg_amp)

    risk_tier = _determine_risk_tier(composite_score_stressed)
    premium_data = RISK_PREMIUM_TABLE[risk_tier]

    # EAL
    eal_usd = _expected_annual_loss(country_iso, asset_class, asset_value_usd, amplifiers)

    # PML 100yr (worst acute peril, 100yr loss)
    pml_100yr = 0.0
    for peril in ACUTE_PERILS:
        rp_table = RETURN_PERIOD_LOSS_TABLES.get(peril, {}).get(asset_class, {})
        baseline = profile.get(f"{peril}_baseline", profile.get("sea_level_risk", 0.0))
        amp = amplifiers.get(peril, 1.0)
        vuln = VULNERABILITY_COEFFICIENTS.get(peril, {}).get(asset_class, 0.5)
        peril_pml = rp_table.get("100yr", 0.0) / 100 * baseline * amp * vuln * asset_value_usd
        if peril_pml > pml_100yr:
            pml_100yr = peril_pml

    # Insurance gap (uninsured loss)
    gap_ratios = INSURANCE_PROTECTION_GAPS.get(country_iso, {})
    avg_insured = sum(gap_ratios.values()) / len(gap_ratios) if gap_ratios else 0.1
    insurance_gap_usd = eal_usd * (1.0 - avg_insured)

    # Climate VaR 95% — PML 200yr proxy (heuristic for 5th percentile tail)
    climate_var_usd = pml_100yr * premium_data["climate_var_pct"] / 100 * asset_value_usd / max(pml_100yr, 1e-9)
    climate_var_usd = max(climate_var_usd, eal_usd * 3.0)  # floor at 3× EAL

    # Per-peril breakdown
    peril_breakdown = {}
    for peril in ACUTE_PERILS:
        rp_table = RETURN_PERIOD_LOSS_TABLES.get(peril, {}).get(asset_class, {})
        p_profile_key = f"{peril}_baseline"
        if peril == "heatwave":
            p_profile_key = "heatwave_baseline"
        baseline = profile.get(p_profile_key, 0.0)
        amp = amplifiers.get(peril, 1.0)
        vuln = VULNERABILITY_COEFFICIENTS.get(peril, {}).get(asset_class, 0.5)
        pml_100 = rp_table.get("100yr", 0.0) / 100 * baseline * amp * vuln * asset_value_usd
        gap_ratio = gap_ratios.get(peril, 0.1)
        peril_breakdown[peril] = {
            "baseline_score": round(baseline, 4),
            "amplified_score": round(_clamp(baseline * amp), 4),
            "scenario_amplifier": amp,
            "vulnerability_coeff": vuln,
            "pml_100yr_usd": round(pml_100, 2),
            "insurance_gap_pct": round((1 - gap_ratio) * 100, 1),
        }

    # Chronic stressors
    chronic_breakdown = {
        "sea_level": {
            "baseline_score": profile.get("sea_level_risk", 0.0),
            "amplified_score": _clamp(profile.get("sea_level_risk", 0.0) * amplifiers.get("sea_level", 1.0)),
        },
        "drought": {
            "baseline_score": profile.get("drought_baseline", 0.0),
            "amplified_score": _clamp(profile.get("drought_baseline", 0.0) * amplifiers.get("drought", 1.0)),
        },
        "temperature_increase": {
            "baseline_score": profile.get("heatwave_baseline", 0.0),
            "amplified_score": _clamp(profile.get("heatwave_baseline", 0.0) * amplifiers.get("heatwave", 1.0)),
        },
    }

    return {
        "entity_id": entity_id,
        "country_iso": country_iso,
        "asset_class": asset_class,
        "asset_value_usd": asset_value_usd,
        "ngfs_scenario": ngfs_scenario,
        "time_horizon": time_horizon,
        "lat": lat,
        "lng": lng,
        "composite_physical_risk_score": round(composite_score_stressed, 4),
        "baseline_composite_score": round(composite_score, 4),
        "risk_tier": risk_tier,
        "expected_annual_loss_usd": round(eal_usd, 2),
        "pml_100yr_usd": round(pml_100yr, 2),
        "climate_var_95pct_usd": round(climate_var_usd, 2),
        "insurance_gap_usd": round(insurance_gap_usd, 2),
        "avg_insured_ratio": round(avg_insured, 3),
        "risk_premium_bps": premium_data["spread_bps"],
        "climate_var_pct_asset_value": premium_data["climate_var_pct"],
        "acute_peril_breakdown": peril_breakdown,
        "chronic_stressor_breakdown": chronic_breakdown,
        "methodology": {
            "eal_method": "Trapezoidal integration over EP curve (10-500yr return periods)",
            "pml_method": "100yr loss × vulnerability coefficient × NGFS amplifier",
            "climate_var_method": "95th percentile proxy (PML tier × climate_var_pct table)",
            "sources": ["NGFS CGFI 2023", "Swiss Re sigma 1/2024", "RMS/AIR/Verisk benchmarks"],
        },
    }


def calculate_return_period_losses(
    country_iso: str,
    asset_class: str,
    asset_value_usd: float,
) -> dict:
    """
    Returns full loss table: peril × return period → expected loss USD and %.
    """
    if country_iso not in COUNTRY_PHYSICAL_RISK_PROFILES:
        return {"error": f"Country {country_iso} not found"}
    if asset_class not in VALID_ASSET_CLASSES:
        return {"error": f"Asset class {asset_class} not valid"}

    profile = COUNTRY_PHYSICAL_RISK_PROFILES[country_iso]
    result: dict[str, dict] = {}

    for peril in ACUTE_PERILS:
        rp_data = RETURN_PERIOD_LOSS_TABLES.get(peril, {}).get(asset_class, {})
        baseline_key = f"{peril}_baseline"
        baseline = profile.get(baseline_key, 0.0)
        vuln = VULNERABILITY_COEFFICIENTS.get(peril, {}).get(asset_class, 0.5)
        gap = INSURANCE_PROTECTION_GAPS.get(country_iso, {}).get(peril, 0.10)

        rp_row: dict[str, dict] = {}
        for rp_label, loss_pct in rp_data.items():
            scaled_loss_pct = loss_pct * baseline * vuln
            loss_usd = scaled_loss_pct / 100 * asset_value_usd
            rp_row[rp_label] = {
                "table_loss_pct": round(loss_pct, 2),
                "scaled_loss_pct": round(scaled_loss_pct, 3),
                "gross_loss_usd": round(loss_usd, 2),
                "insured_loss_usd": round(loss_usd * gap, 2),
                "uninsured_loss_usd": round(loss_usd * (1 - gap), 2),
                "annual_exceedance_probability": RETURN_PERIOD_PROBABILITIES[rp_label],
            }
        result[peril] = {
            "baseline_risk_score": round(baseline, 4),
            "vulnerability_coefficient": vuln,
            "insurance_protection_ratio": round(gap, 3),
            "return_period_losses": rp_row,
        }

    return {
        "country_iso": country_iso,
        "asset_class": asset_class,
        "asset_value_usd": asset_value_usd,
        "country_name": COUNTRY_PHYSICAL_RISK_PROFILES[country_iso]["name"],
        "peril_loss_table": result,
    }


def calculate_stranding_probability(
    country_iso: str,
    asset_class: str,
    ngfs_scenario: str,
    time_horizon: str,
) -> dict:
    """
    Estimates stranding probability for an asset given chronic physical risk
    amplification under a specified NGFS scenario and time horizon.

    Methodology: weighted composite of chronic stressors × asset class
    sensitivity weights, mapped to stranding probability via logistic function.
    """
    if country_iso not in COUNTRY_PHYSICAL_RISK_PROFILES:
        return {"error": f"Country {country_iso} not found"}
    if ngfs_scenario not in VALID_SCENARIOS:
        return {"error": f"Scenario must be one of {VALID_SCENARIOS}"}
    if time_horizon not in VALID_HORIZONS:
        return {"error": f"Time horizon must be one of {VALID_HORIZONS}"}
    if asset_class not in VALID_ASSET_CLASSES:
        return {"error": f"Asset class not valid"}

    profile = COUNTRY_PHYSICAL_RISK_PROFILES[country_iso]
    amplifiers = NGFS_PHYSICAL_AMPLIFIERS[ngfs_scenario][time_horizon]

    # Asset class sensitivity to chronic stressors
    chronic_sensitivity: dict[str, dict[str, float]] = {
        "property":       {"sea_level": 0.50, "drought": 0.20, "heatwave": 0.20, "flood": 0.10},
        "infrastructure": {"sea_level": 0.40, "drought": 0.15, "heatwave": 0.25, "flood": 0.20},
        "agriculture":    {"sea_level": 0.20, "drought": 0.40, "heatwave": 0.30, "flood": 0.10},
        "energy":         {"sea_level": 0.25, "drought": 0.30, "heatwave": 0.30, "flood": 0.15},
        "marine":         {"sea_level": 0.55, "drought": 0.10, "heatwave": 0.20, "flood": 0.15},
    }

    sens = chronic_sensitivity[asset_class]
    stressor_scores = {
        "sea_level": profile.get("sea_level_risk", 0.0) * amplifiers.get("sea_level", 1.0),
        "drought": profile.get("drought_baseline", 0.0) * amplifiers.get("drought", 1.0),
        "heatwave": profile.get("heatwave_baseline", 0.0) * amplifiers.get("heatwave", 1.0),
        "flood": profile.get("flood_baseline", 0.0) * amplifiers.get("flood", 1.0),
    }

    composite_chronic = sum(
        _clamp(stressor_scores[s]) * w for s, w in sens.items()
    )

    # Logistic mapping: probability = 1 / (1 + exp(-k*(x - x0)))
    k, x0 = 10.0, 0.50
    stranding_prob = 1.0 / (1.0 + math.exp(-k * (composite_chronic - x0)))
    stranding_prob = _clamp(stranding_prob)

    # Determine stranding risk category
    if stranding_prob < 0.10:
        category = "negligible"
    elif stranding_prob < 0.25:
        category = "low"
    elif stranding_prob < 0.45:
        category = "moderate"
    elif stranding_prob < 0.65:
        category = "high"
    else:
        category = "very_high"

    return {
        "country_iso": country_iso,
        "country_name": profile["name"],
        "asset_class": asset_class,
        "ngfs_scenario": ngfs_scenario,
        "time_horizon": time_horizon,
        "stranding_probability": round(stranding_prob, 4),
        "stranding_risk_category": category,
        "composite_chronic_score": round(composite_chronic, 4),
        "stressor_detail": {
            s: {
                "baseline": round(profile.get(
                    "sea_level_risk" if s == "sea_level" else
                    f"{s}_baseline", 0.0), 4),
                "amplified": round(_clamp(stressor_scores[s]), 4),
                "sensitivity_weight": sens[s],
                "contribution": round(_clamp(stressor_scores[s]) * sens[s], 4),
            }
            for s in sens
        },
        "methodology": "Logistic stranding function; chronic stressor weighted composite; NGFS amplifiers",
        "references": ["NGFS CGFI 2023", "TCFD Physical Risk Guidance 2020", "IPCC AR6 WGI Ch.11"],
    }


def get_country_physical_risk_profile(country_iso: str) -> dict:
    """Returns full baseline risk profile for a country."""
    if country_iso not in COUNTRY_PHYSICAL_RISK_PROFILES:
        return {"error": f"Country {country_iso} not in reference data. Supported: {list(COUNTRY_PHYSICAL_RISK_PROFILES.keys())}"}

    profile = COUNTRY_PHYSICAL_RISK_PROFILES[country_iso].copy()
    composite = _composite_baseline_score(profile)
    tier = _determine_risk_tier(composite)

    profile["composite_physical_risk_score"] = round(composite, 4)
    profile["baseline_risk_tier"] = tier
    profile["country_iso"] = country_iso
    profile["insurance_protection_gaps"] = INSURANCE_PROTECTION_GAPS.get(country_iso, {})
    profile["supported_scenarios"] = VALID_SCENARIOS
    profile["supported_horizons"] = VALID_HORIZONS
    return profile


# ---------------------------------------------------------------------------
# Reference Data Accessors
# ---------------------------------------------------------------------------

def get_all_country_profiles() -> dict:
    return {
        iso: {
            **data,
            "composite_score": round(_composite_baseline_score(data), 4),
            "baseline_tier": _determine_risk_tier(_composite_baseline_score(data)),
        }
        for iso, data in COUNTRY_PHYSICAL_RISK_PROFILES.items()
    }


def get_damage_functions() -> dict:
    return {
        "acute_perils": RETURN_PERIOD_LOSS_TABLES,
        "vulnerability_coefficients": VULNERABILITY_COEFFICIENTS,
        "return_period_probabilities": RETURN_PERIOD_PROBABILITIES,
        "asset_classes": VALID_ASSET_CLASSES,
        "notes": (
            "Loss % are un-scaled table values; multiply by country baseline score "
            "and vulnerability coefficient to obtain effective loss rate."
        ),
    }


def get_ngfs_amplifiers() -> dict:
    return {
        "scenarios": VALID_SCENARIOS,
        "horizons": VALID_HORIZONS,
        "amplifiers": NGFS_PHYSICAL_AMPLIFIERS,
        "interpretation": (
            "Multipliers applied to country baseline peril scores. "
            "Hot house world (hot_house) represents RCP8.5/SSP5-8.5 trajectory; "
            "orderly represents Net Zero 2050 (NZ2050/SSP1-1.9); "
            "disorderly represents delayed transition (SSP2-4.5)."
        ),
        "sources": ["NGFS CGFI Phase IV 2023", "IPCC AR6 WGI Table SPM.2"],
    }


def get_insurance_gaps() -> dict:
    return {
        "data": INSURANCE_PROTECTION_GAPS,
        "interpretation": (
            "Ratio of insured to total economic loss (0=uninsured, 1=fully insured). "
            "Represents structural protection gap, not individual policy coverage."
        ),
        "sources": ["Swiss Re sigma No. 1/2024", "Munich Re NatCatSERVICE 2023"],
        "coverage_note": (
            "Emerging markets typically show ratios of 0.02-0.10 (protection gap 90-98%). "
            "Developed markets range 0.30-0.75 depending on peril and mandatory insurance schemes."
        ),
    }


def get_risk_premium_table() -> dict:
    return {
        "risk_premium_table": RISK_PREMIUM_TABLE,
        "risk_tier_thresholds": {
            "low":       "composite_score < 0.15",
            "moderate":  "0.15 ≤ composite_score < 0.28",
            "elevated":  "0.28 ≤ composite_score < 0.42",
            "high":      "0.42 ≤ composite_score < 0.58",
            "very_high": "0.58 ≤ composite_score < 0.72",
            "extreme":   "composite_score ≥ 0.72",
        },
        "sources": ["PRA SS3/19 Climate Financial Risk", "ECB Supervisory Expectations 2022", "NGFS CGFI 2023"],
        "notes": (
            "Spread bps represent incremental credit spread above risk-free rate attributable "
            "to physical climate risk. climate_var_pct is approximate 95th percentile VaR "
            "as % of asset value."
        ),
    }
