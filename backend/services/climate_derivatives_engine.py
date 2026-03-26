"""
E106 — Climate-Linked Structured Products Engine
Covers: weather derivatives (HDD/CDD/rainfall/wind/sunshine), EUA options (BSM),
cat bonds (expected-loss method), regulatory classification (EMIR/MiFID II),
and 12 structured product templates.
No DB calls — all reference data hardcoded.
"""

from __future__ import annotations

import math
import random
from typing import Any

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

# 20 weather-derivative reference stations
# seasonal_pattern: Q1/Q2/Q3/Q4 index relative to annual mean (multiplier)
WEATHER_STATIONS: dict[str, dict[str, Any]] = {
    "london": {
        "city": "London",
        "country": "GB",
        "lat": 51.5074,
        "lon": -0.1278,
        "hdd": {"annual_mean": 2340, "std_dev": 185, "seasonal": {"Q1": 1.45, "Q2": 0.75, "Q3": 0.25, "Q4": 1.55}},
        "cdd": {"annual_mean": 120,  "std_dev":  42, "seasonal": {"Q1": 0.02, "Q2": 0.65, "Q3": 2.80, "Q4": 0.53}},
        "rainfall_mm": {"annual_mean": 601,  "std_dev":  75, "seasonal": {"Q1": 1.10, "Q2": 0.80, "Q3": 0.90, "Q4": 1.20}},
        "wind_ms":     {"annual_mean": 4.8,  "std_dev": 1.2, "seasonal": {"Q1": 1.30, "Q2": 0.85, "Q3": 0.70, "Q4": 1.15}},
        "sunshine_hrs":{"annual_mean": 1481, "std_dev": 130, "seasonal": {"Q1": 0.45, "Q2": 1.35, "Q3": 1.60, "Q4": 0.60}},
    },
    "chicago": {
        "city": "Chicago",
        "country": "US",
        "lat": 41.8781,
        "lon": -87.6298,
        "hdd": {"annual_mean": 3400, "std_dev": 260, "seasonal": {"Q1": 1.60, "Q2": 0.65, "Q3": 0.05, "Q4": 1.70}},
        "cdd": {"annual_mean": 760,  "std_dev": 110, "seasonal": {"Q1": 0.01, "Q2": 0.50, "Q3": 3.20, "Q4": 0.29}},
        "rainfall_mm": {"annual_mean": 914,  "std_dev":  90, "seasonal": {"Q1": 0.85, "Q2": 1.15, "Q3": 1.05, "Q4": 0.95}},
        "wind_ms":     {"annual_mean": 5.8,  "std_dev": 1.5, "seasonal": {"Q1": 1.25, "Q2": 1.00, "Q3": 0.80, "Q4": 0.95}},
        "sunshine_hrs":{"annual_mean": 2512, "std_dev": 160, "seasonal": {"Q1": 0.55, "Q2": 1.20, "Q3": 1.50, "Q4": 0.75}},
    },
    "tokyo": {
        "city": "Tokyo",
        "country": "JP",
        "lat": 35.6762,
        "lon": 139.6503,
        "hdd": {"annual_mean": 1720, "std_dev": 145, "seasonal": {"Q1": 1.70, "Q2": 0.40, "Q3": 0.00, "Q4": 1.90}},
        "cdd": {"annual_mean": 1100, "std_dev": 130, "seasonal": {"Q1": 0.00, "Q2": 0.45, "Q3": 3.50, "Q4": 0.05}},
        "rainfall_mm": {"annual_mean": 1528, "std_dev": 140, "seasonal": {"Q1": 0.60, "Q2": 1.30, "Q3": 1.10, "Q4": 1.00}},
        "wind_ms":     {"annual_mean": 3.4,  "std_dev": 0.9, "seasonal": {"Q1": 1.20, "Q2": 1.00, "Q3": 0.75, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 1876, "std_dev": 120, "seasonal": {"Q1": 0.90, "Q2": 1.05, "Q3": 1.10, "Q4": 0.95}},
    },
    "singapore": {
        "city": "Singapore",
        "country": "SG",
        "lat": 1.3521,
        "lon": 103.8198,
        "hdd": {"annual_mean": 0,    "std_dev":   0, "seasonal": {"Q1": 0.00, "Q2": 0.00, "Q3": 0.00, "Q4": 0.00}},
        "cdd": {"annual_mean": 3650, "std_dev": 180, "seasonal": {"Q1": 0.95, "Q2": 1.00, "Q3": 1.10, "Q4": 0.95}},
        "rainfall_mm": {"annual_mean": 2166, "std_dev": 220, "seasonal": {"Q1": 1.20, "Q2": 0.80, "Q3": 0.75, "Q4": 1.25}},
        "wind_ms":     {"annual_mean": 2.5,  "std_dev": 0.6, "seasonal": {"Q1": 1.10, "Q2": 0.90, "Q3": 0.85, "Q4": 1.15}},
        "sunshine_hrs":{"annual_mean": 2012, "std_dev": 100, "seasonal": {"Q1": 0.92, "Q2": 1.05, "Q3": 1.08, "Q4": 0.95}},
    },
    "frankfurt": {
        "city": "Frankfurt",
        "country": "DE",
        "lat": 50.1109,
        "lon": 8.6821,
        "hdd": {"annual_mean": 2750, "std_dev": 200, "seasonal": {"Q1": 1.50, "Q2": 0.70, "Q3": 0.15, "Q4": 1.65}},
        "cdd": {"annual_mean": 280,  "std_dev":  60, "seasonal": {"Q1": 0.01, "Q2": 0.60, "Q3": 3.00, "Q4": 0.39}},
        "rainfall_mm": {"annual_mean": 621,  "std_dev":  70, "seasonal": {"Q1": 0.95, "Q2": 1.05, "Q3": 1.00, "Q4": 1.00}},
        "wind_ms":     {"annual_mean": 4.2,  "std_dev": 1.1, "seasonal": {"Q1": 1.20, "Q2": 0.90, "Q3": 0.75, "Q4": 1.15}},
        "sunshine_hrs":{"annual_mean": 1634, "std_dev": 140, "seasonal": {"Q1": 0.40, "Q2": 1.30, "Q3": 1.65, "Q4": 0.65}},
    },
    "nyc": {
        "city": "New York City",
        "country": "US",
        "lat": 40.7128,
        "lon": -74.0060,
        "hdd": {"annual_mean": 2800, "std_dev": 220, "seasonal": {"Q1": 1.55, "Q2": 0.60, "Q3": 0.05, "Q4": 1.80}},
        "cdd": {"annual_mean": 840,  "std_dev": 115, "seasonal": {"Q1": 0.01, "Q2": 0.48, "Q3": 3.25, "Q4": 0.26}},
        "rainfall_mm": {"annual_mean": 1142, "std_dev":  95, "seasonal": {"Q1": 0.90, "Q2": 1.00, "Q3": 1.05, "Q4": 1.05}},
        "wind_ms":     {"annual_mean": 5.0,  "std_dev": 1.3, "seasonal": {"Q1": 1.20, "Q2": 0.95, "Q3": 0.80, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 2534, "std_dev": 150, "seasonal": {"Q1": 0.60, "Q2": 1.20, "Q3": 1.45, "Q4": 0.75}},
    },
    "sydney": {
        "city": "Sydney",
        "country": "AU",
        "lat": -33.8688,
        "lon": 151.2093,
        "hdd": {"annual_mean": 680,  "std_dev":  85, "seasonal": {"Q1": 0.05, "Q2": 0.80, "Q3": 1.90, "Q4": 1.25}},
        "cdd": {"annual_mean": 980,  "std_dev": 110, "seasonal": {"Q1": 2.50, "Q2": 0.60, "Q3": 0.10, "Q4": 0.80}},
        "rainfall_mm": {"annual_mean": 1213, "std_dev": 180, "seasonal": {"Q1": 1.30, "Q2": 1.10, "Q3": 0.65, "Q4": 0.95}},
        "wind_ms":     {"annual_mean": 4.1,  "std_dev": 1.0, "seasonal": {"Q1": 1.05, "Q2": 0.95, "Q3": 0.90, "Q4": 1.10}},
        "sunshine_hrs":{"annual_mean": 2536, "std_dev": 135, "seasonal": {"Q1": 1.40, "Q2": 0.95, "Q3": 0.65, "Q4": 1.00}},
    },
    "paris": {
        "city": "Paris",
        "country": "FR",
        "lat": 48.8566,
        "lon": 2.3522,
        "hdd": {"annual_mean": 2480, "std_dev": 190, "seasonal": {"Q1": 1.48, "Q2": 0.72, "Q3": 0.18, "Q4": 1.62}},
        "cdd": {"annual_mean": 200,  "std_dev":  55, "seasonal": {"Q1": 0.01, "Q2": 0.55, "Q3": 3.10, "Q4": 0.34}},
        "rainfall_mm": {"annual_mean": 637,  "std_dev":  72, "seasonal": {"Q1": 1.05, "Q2": 0.95, "Q3": 0.90, "Q4": 1.10}},
        "wind_ms":     {"annual_mean": 4.0,  "std_dev": 1.0, "seasonal": {"Q1": 1.22, "Q2": 0.90, "Q3": 0.72, "Q4": 1.16}},
        "sunshine_hrs":{"annual_mean": 1661, "std_dev": 135, "seasonal": {"Q1": 0.42, "Q2": 1.32, "Q3": 1.63, "Q4": 0.63}},
    },
    "mumbai": {
        "city": "Mumbai",
        "country": "IN",
        "lat": 19.0760,
        "lon": 72.8777,
        "hdd": {"annual_mean": 0,    "std_dev":   0, "seasonal": {"Q1": 0.00, "Q2": 0.00, "Q3": 0.00, "Q4": 0.00}},
        "cdd": {"annual_mean": 4015, "std_dev": 200, "seasonal": {"Q1": 0.90, "Q2": 1.05, "Q3": 1.10, "Q4": 0.95}},
        "rainfall_mm": {"annual_mean": 2422, "std_dev": 400, "seasonal": {"Q1": 0.10, "Q2": 0.20, "Q3": 3.30, "Q4": 0.40}},
        "wind_ms":     {"annual_mean": 2.8,  "std_dev": 0.8, "seasonal": {"Q1": 0.80, "Q2": 1.00, "Q3": 1.50, "Q4": 0.70}},
        "sunshine_hrs":{"annual_mean": 2682, "std_dev": 180, "seasonal": {"Q1": 1.10, "Q2": 1.15, "Q3": 0.55, "Q4": 1.20}},
    },
    "dubai": {
        "city": "Dubai",
        "country": "AE",
        "lat": 25.2048,
        "lon": 55.2708,
        "hdd": {"annual_mean": 50,   "std_dev":  20, "seasonal": {"Q1": 2.00, "Q2": 0.50, "Q3": 0.00, "Q4": 1.50}},
        "cdd": {"annual_mean": 4600, "std_dev": 210, "seasonal": {"Q1": 0.60, "Q2": 0.95, "Q3": 1.50, "Q4": 0.95}},
        "rainfall_mm": {"annual_mean":  99,  "std_dev":  45, "seasonal": {"Q1": 1.80, "Q2": 0.60, "Q3": 0.10, "Q4": 1.50}},
        "wind_ms":     {"annual_mean": 3.6,  "std_dev": 1.0, "seasonal": {"Q1": 0.90, "Q2": 1.10, "Q3": 1.15, "Q4": 0.85}},
        "sunshine_hrs":{"annual_mean": 3509, "std_dev": 120, "seasonal": {"Q1": 0.88, "Q2": 1.02, "Q3": 1.08, "Q4": 1.02}},
    },
    "toronto": {
        "city": "Toronto",
        "country": "CA",
        "lat": 43.6532,
        "lon": -79.3832,
        "hdd": {"annual_mean": 3520, "std_dev": 270, "seasonal": {"Q1": 1.62, "Q2": 0.63, "Q3": 0.04, "Q4": 1.71}},
        "cdd": {"annual_mean": 620,  "std_dev":  90, "seasonal": {"Q1": 0.01, "Q2": 0.45, "Q3": 3.30, "Q4": 0.24}},
        "rainfall_mm": {"annual_mean": 831,  "std_dev":  80, "seasonal": {"Q1": 0.75, "Q2": 1.00, "Q3": 1.10, "Q4": 1.15}},
        "wind_ms":     {"annual_mean": 4.5,  "std_dev": 1.2, "seasonal": {"Q1": 1.18, "Q2": 0.95, "Q3": 0.82, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 2038, "std_dev": 130, "seasonal": {"Q1": 0.55, "Q2": 1.20, "Q3": 1.48, "Q4": 0.77}},
    },
    "moscow": {
        "city": "Moscow",
        "country": "RU",
        "lat": 55.7558,
        "lon": 37.6173,
        "hdd": {"annual_mean": 5100, "std_dev": 380, "seasonal": {"Q1": 1.70, "Q2": 0.65, "Q3": 0.05, "Q4": 1.60}},
        "cdd": {"annual_mean": 80,   "std_dev":  30, "seasonal": {"Q1": 0.00, "Q2": 0.30, "Q3": 3.50, "Q4": 0.20}},
        "rainfall_mm": {"annual_mean": 707,  "std_dev":  85, "seasonal": {"Q1": 0.85, "Q2": 0.90, "Q3": 1.20, "Q4": 1.05}},
        "wind_ms":     {"annual_mean": 3.5,  "std_dev": 1.0, "seasonal": {"Q1": 1.10, "Q2": 1.00, "Q3": 0.85, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 1731, "std_dev": 180, "seasonal": {"Q1": 0.35, "Q2": 1.15, "Q3": 1.75, "Q4": 0.75}},
    },
    "cape_town": {
        "city": "Cape Town",
        "country": "ZA",
        "lat": -33.9249,
        "lon": 18.4241,
        "hdd": {"annual_mean": 730,  "std_dev":  90, "seasonal": {"Q1": 0.05, "Q2": 0.75, "Q3": 2.10, "Q4": 1.10}},
        "cdd": {"annual_mean": 560,  "std_dev":  80, "seasonal": {"Q1": 2.60, "Q2": 0.65, "Q3": 0.05, "Q4": 0.70}},
        "rainfall_mm": {"annual_mean": 515,  "std_dev":  90, "seasonal": {"Q1": 0.50, "Q2": 1.00, "Q3": 1.90, "Q4": 0.60}},
        "wind_ms":     {"annual_mean": 5.5,  "std_dev": 1.6, "seasonal": {"Q1": 1.20, "Q2": 1.10, "Q3": 0.70, "Q4": 1.00}},
        "sunshine_hrs":{"annual_mean": 3094, "std_dev": 140, "seasonal": {"Q1": 1.40, "Q2": 0.95, "Q3": 0.55, "Q4": 1.10}},
    },
    "shanghai": {
        "city": "Shanghai",
        "country": "CN",
        "lat": 31.2304,
        "lon": 121.4737,
        "hdd": {"annual_mean": 1450, "std_dev": 130, "seasonal": {"Q1": 1.80, "Q2": 0.45, "Q3": 0.00, "Q4": 1.75}},
        "cdd": {"annual_mean": 1050, "std_dev": 120, "seasonal": {"Q1": 0.00, "Q2": 0.42, "Q3": 3.50, "Q4": 0.08}},
        "rainfall_mm": {"annual_mean": 1166, "std_dev": 150, "seasonal": {"Q1": 0.70, "Q2": 1.10, "Q3": 1.20, "Q4": 1.00}},
        "wind_ms":     {"annual_mean": 3.8,  "std_dev": 1.0, "seasonal": {"Q1": 1.15, "Q2": 0.95, "Q3": 0.85, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 1778, "std_dev": 130, "seasonal": {"Q1": 0.70, "Q2": 1.00, "Q3": 1.30, "Q4": 1.00}},
    },
    "sao_paulo": {
        "city": "São Paulo",
        "country": "BR",
        "lat": -23.5505,
        "lon": -46.6333,
        "hdd": {"annual_mean": 85,   "std_dev":  30, "seasonal": {"Q1": 0.10, "Q2": 1.50, "Q3": 2.00, "Q4": 0.40}},
        "cdd": {"annual_mean": 1200, "std_dev": 140, "seasonal": {"Q1": 1.60, "Q2": 0.70, "Q3": 0.30, "Q4": 1.40}},
        "rainfall_mm": {"annual_mean": 1454, "std_dev": 220, "seasonal": {"Q1": 1.60, "Q2": 0.80, "Q3": 0.40, "Q4": 1.20}},
        "wind_ms":     {"annual_mean": 2.9,  "std_dev": 0.7, "seasonal": {"Q1": 0.90, "Q2": 1.05, "Q3": 1.10, "Q4": 0.95}},
        "sunshine_hrs":{"annual_mean": 1932, "std_dev": 145, "seasonal": {"Q1": 0.80, "Q2": 1.00, "Q3": 1.20, "Q4": 1.00}},
    },
    "seoul": {
        "city": "Seoul",
        "country": "KR",
        "lat": 37.5665,
        "lon": 126.9780,
        "hdd": {"annual_mean": 2650, "std_dev": 210, "seasonal": {"Q1": 1.65, "Q2": 0.55, "Q3": 0.02, "Q4": 1.78}},
        "cdd": {"annual_mean": 760,  "std_dev": 100, "seasonal": {"Q1": 0.00, "Q2": 0.40, "Q3": 3.45, "Q4": 0.15}},
        "rainfall_mm": {"annual_mean": 1450, "std_dev": 200, "seasonal": {"Q1": 0.40, "Q2": 0.70, "Q3": 2.10, "Q4": 0.80}},
        "wind_ms":     {"annual_mean": 3.2,  "std_dev": 0.9, "seasonal": {"Q1": 1.25, "Q2": 1.00, "Q3": 0.75, "Q4": 1.00}},
        "sunshine_hrs":{"annual_mean": 2066, "std_dev": 130, "seasonal": {"Q1": 0.75, "Q2": 1.10, "Q3": 1.00, "Q4": 1.15}},
    },
    "houston": {
        "city": "Houston",
        "country": "US",
        "lat": 29.7604,
        "lon": -95.3698,
        "hdd": {"annual_mean": 1440, "std_dev": 160, "seasonal": {"Q1": 1.75, "Q2": 0.55, "Q3": 0.00, "Q4": 1.70}},
        "cdd": {"annual_mean": 2800, "std_dev": 220, "seasonal": {"Q1": 0.08, "Q2": 0.65, "Q3": 2.65, "Q4": 0.62}},
        "rainfall_mm": {"annual_mean": 1306, "std_dev": 190, "seasonal": {"Q1": 0.95, "Q2": 1.15, "Q3": 0.90, "Q4": 1.00}},
        "wind_ms":     {"annual_mean": 4.0,  "std_dev": 1.1, "seasonal": {"Q1": 1.00, "Q2": 1.00, "Q3": 0.95, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 2559, "std_dev": 150, "seasonal": {"Q1": 0.78, "Q2": 1.12, "Q3": 1.22, "Q4": 0.88}},
    },
    "amsterdam": {
        "city": "Amsterdam",
        "country": "NL",
        "lat": 52.3676,
        "lon": 4.9041,
        "hdd": {"annual_mean": 2550, "std_dev": 195, "seasonal": {"Q1": 1.50, "Q2": 0.72, "Q3": 0.20, "Q4": 1.58}},
        "cdd": {"annual_mean": 130,  "std_dev":  40, "seasonal": {"Q1": 0.01, "Q2": 0.58, "Q3": 2.95, "Q4": 0.46}},
        "rainfall_mm": {"annual_mean": 838,  "std_dev":  85, "seasonal": {"Q1": 1.10, "Q2": 0.85, "Q3": 0.90, "Q4": 1.15}},
        "wind_ms":     {"annual_mean": 5.1,  "std_dev": 1.4, "seasonal": {"Q1": 1.25, "Q2": 0.90, "Q3": 0.75, "Q4": 1.10}},
        "sunshine_hrs":{"annual_mean": 1665, "std_dev": 130, "seasonal": {"Q1": 0.38, "Q2": 1.35, "Q3": 1.65, "Q4": 0.62}},
    },
    "madrid": {
        "city": "Madrid",
        "country": "ES",
        "lat": 40.4168,
        "lon": -3.7038,
        "hdd": {"annual_mean": 2020, "std_dev": 165, "seasonal": {"Q1": 1.60, "Q2": 0.65, "Q3": 0.05, "Q4": 1.70}},
        "cdd": {"annual_mean": 780,  "std_dev": 110, "seasonal": {"Q1": 0.01, "Q2": 0.55, "Q3": 3.15, "Q4": 0.29}},
        "rainfall_mm": {"annual_mean": 436,  "std_dev":  70, "seasonal": {"Q1": 1.20, "Q2": 0.95, "Q3": 0.40, "Q4": 1.45}},
        "wind_ms":     {"annual_mean": 3.8,  "std_dev": 1.0, "seasonal": {"Q1": 1.10, "Q2": 1.00, "Q3": 0.85, "Q4": 1.05}},
        "sunshine_hrs":{"annual_mean": 2769, "std_dev": 145, "seasonal": {"Q1": 0.65, "Q2": 1.20, "Q3": 1.45, "Q4": 0.70}},
    },
    "zurich": {
        "city": "Zurich",
        "country": "CH",
        "lat": 47.3769,
        "lon": 8.5417,
        "hdd": {"annual_mean": 3120, "std_dev": 230, "seasonal": {"Q1": 1.52, "Q2": 0.68, "Q3": 0.12, "Q4": 1.68}},
        "cdd": {"annual_mean": 180,  "std_dev":  50, "seasonal": {"Q1": 0.01, "Q2": 0.52, "Q3": 3.05, "Q4": 0.42}},
        "rainfall_mm": {"annual_mean": 1134, "std_dev": 100, "seasonal": {"Q1": 0.90, "Q2": 1.10, "Q3": 1.05, "Q4": 0.95}},
        "wind_ms":     {"annual_mean": 3.3,  "std_dev": 0.9, "seasonal": {"Q1": 1.15, "Q2": 0.95, "Q3": 0.80, "Q4": 1.10}},
        "sunshine_hrs":{"annual_mean": 1693, "std_dev": 140, "seasonal": {"Q1": 0.42, "Q2": 1.28, "Q3": 1.62, "Q4": 0.68}},
    },
}

# EUA (EU Allowance) Market Data
EUA_MARKET_DATA: dict[str, Any] = {
    "spot_eur_t": 65.0,
    "historical_vol_pct": 0.35,
    "mean_reversion_speed": 0.30,
    "long_run_mean_eur_t": 80.0,
    "risk_free_rate": 0.035,
    "correlations": {
        "ttf_gas": 0.62,
        "brent_crude": 0.38,
        "eurostoxx50": 0.22,
        "coal_api2": 0.45,
        "power_baseload": 0.55,
    },
    "futures_curve": {
        "Dec2025": 67.0, "Dec2026": 72.5, "Dec2027": 76.0,
        "Dec2028": 79.0, "Dec2029": 81.5, "Dec2030": 85.0,
    },
    "vol_surface": {
        "3m": {"ATM": 0.32, "25d_put": 0.38, "25d_call": 0.30},
        "6m": {"ATM": 0.34, "25d_put": 0.40, "25d_call": 0.31},
        "12m": {"ATM": 0.35, "25d_put": 0.41, "25d_call": 0.33},
        "24m": {"ATM": 0.37, "25d_put": 0.43, "25d_call": 0.35},
    },
    "daily_volume_eur_m": 800,
    "open_interest_mt_co2": 1400,
    "primary_exchange": "ICE Endex",
    "settlement": "physical_delivery",
    "lot_size_t": 1000,
}

# Catastrophe Peril Models
PERIL_MODELS: dict[str, dict[str, Any]] = {
    "RMS": {
        "provider": "Moody's RMS",
        "perils": ["wind", "flood", "earthquake", "wildfire", "storm_surge", "hail"],
        "geographic_coverage": "global",
        "model_versions": {"wind_us": "RMS 21.0", "flood_eu": "RMS FloodModel Europe 7.0",
                           "earthquake": "RMS EQ 17.1", "wildfire_us": "RMS WF 22.0"},
        "aep_return_periods": [10, 25, 50, 100, 200, 250, 500, 1000],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "AIR": {
        "provider": "Verisk AIR Worldwide",
        "perils": ["wind", "flood", "earthquake", "wildfire", "terrorism", "cyber"],
        "geographic_coverage": "global",
        "model_versions": {"wind_eu": "CATRADER 21.0", "flood_global": "AIR Inland Flood 7.0",
                           "earthquake": "AIR EQ 17.0", "wildfire_ca": "AIR WF 4.0"},
        "aep_return_periods": [10, 25, 50, 100, 200, 250, 500, 1000],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "Verisk": {
        "provider": "Verisk Analytics",
        "perils": ["flood", "wind", "earthquake", "climate_change_scenarios"],
        "geographic_coverage": "global",
        "model_versions": {"flood_us": "Verisk Flood 3.0", "wind_us": "Verisk Wind 5.0"},
        "aep_return_periods": [25, 50, 100, 200, 500],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": False,
    },
    "JBA": {
        "provider": "JBA Risk Management",
        "perils": ["flood", "subsidence"],
        "geographic_coverage": "europe_apac_focused",
        "model_versions": {"flood_uk": "JBA UK Flood 6.0", "flood_eu": "JBA Europe 4.0",
                           "flood_apac": "JBA APAC 3.0"},
        "aep_return_periods": [20, 50, 75, 100, 200, 500, 1000],
        "data_vintage": "2022",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "Aon": {
        "provider": "Aon Impact Forecasting",
        "perils": ["wind", "flood", "earthquake", "storm_surge", "wildfire", "hail"],
        "geographic_coverage": "global",
        "model_versions": {"wind": "ELEMENTS 8.0", "flood": "ELEMENTS Flood 6.0",
                           "earthquake": "ELEMENTS EQ 6.0"},
        "aep_return_periods": [10, 25, 50, 100, 200, 500, 1000],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "SwissRe": {
        "provider": "Swiss Re CatNet",
        "perils": ["wind", "flood", "earthquake", "wildfire", "hail", "tsunami"],
        "geographic_coverage": "global",
        "model_versions": {"wind": "CatNet Wind 12.0", "flood": "CatNet Flood 9.0",
                           "earthquake": "CatNet EQ 8.0"},
        "aep_return_periods": [10, 50, 100, 250, 500, 1000],
        "data_vintage": "2024",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "MunichRe": {
        "provider": "Munich Re NATHAN",
        "perils": ["wind", "flood", "earthquake", "hail", "lightning", "storm_surge"],
        "geographic_coverage": "global",
        "model_versions": {"all_perils": "NATHAN 5.0"},
        "aep_return_periods": [10, 50, 100, 200, 500, 1000],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
    "GuyCarpenter": {
        "provider": "Guy Carpenter GC Catview",
        "perils": ["wind", "flood", "earthquake", "wildfire", "marine"],
        "geographic_coverage": "global",
        "model_versions": {"wind": "GC Wind 4.0", "flood": "GC Flood 3.0"},
        "aep_return_periods": [25, 50, 100, 250, 500],
        "data_vintage": "2023",
        "regulatory_accepted": True,
        "solvency_ii_approved": True,
    },
}

# CCP Clearing Eligibility
CCP_ELIGIBILITY: dict[str, Any] = {
    "ICE": {
        "full_name": "Intercontinental Exchange",
        "cleared_products": ["EUA_spot", "EUA_futures", "EUA_options", "EUAA_futures",
                             "weather_index_futures", "CER_futures", "ERU_futures"],
        "margin_model": "SPAN",
        "initial_margin_eua_pct": 8.5,
        "variation_margin": "daily",
        "membership_requirements": "EMIR_clearing_member",
        "url": "www.theice.com",
    },
    "CME": {
        "full_name": "Chicago Mercantile Exchange",
        "cleared_products": ["HDD_futures", "CDD_futures", "HDD_options", "CDD_options",
                             "seasonal_strip_futures", "CRT_futures", "weather_index_CME"],
        "margin_model": "SPAN",
        "initial_margin_hdd_pct": 10.0,
        "variation_margin": "daily",
        "membership_requirements": "CFTC_clearing_member",
        "url": "www.cmegroup.com",
    },
    "LCH": {
        "full_name": "LCH.Clearnet",
        "cleared_products": ["IRS_climate_linked", "sustainability_linked_swap",
                             "green_total_return_swap", "cross_currency_sustainability"],
        "margin_model": "SwapClear_IM",
        "initial_margin_irs_pct": 2.5,
        "variation_margin": "daily",
        "membership_requirements": "EMIR_clearing_member",
        "url": "www.lch.com",
    },
    "Eurex": {
        "full_name": "Eurex Clearing",
        "cleared_products": ["EUA_futures", "EUA_options", "EEX_power_EUA_linked",
                             "carbon_credit_repo", "GBS_repo"],
        "margin_model": "Prisma",
        "initial_margin_eua_pct": 9.0,
        "variation_margin": "daily",
        "membership_requirements": "EMIR_clearing_member",
        "url": "www.eurex.com",
    },
}

# 12 Structured Product Templates
PRODUCT_TEMPLATES: list[dict[str, Any]] = [
    {
        "id": "cat_bond",
        "name": "Catastrophe Bond (Cat Bond)",
        "asset_class": "insurance_linked_security",
        "typical_tenor_years": 3,
        "typical_notional_usd_m": 250,
        "trigger_types": ["parametric", "modelled_loss", "indemnity", "industry_index"],
        "spread_bps_range": {"min": 200, "max": 1200},
        "rating_target": ["BB", "B"],
        "spv_required": True,
        "clearing": "bilateral_otc",
        "isda_template": "ISDA_2002_ILS",
        "emir_class": "non_financial_structured",
        "mifid_category": "structured_product",
        "key_risks": ["basis_risk", "model_risk", "extension_risk", "credit_risk_spv"],
        "investor_base": ["ILS_fund", "reinsurer", "hedge_fund", "pension_fund"],
        "description": "Rule 144A / Reg S cat bond issued via Cayman SPV; principal at risk if trigger breached.",
    },
    {
        "id": "weather_swap",
        "name": "Weather Index Swap (HDD / CDD)",
        "asset_class": "weather_derivative",
        "typical_tenor_years": 1,
        "typical_notional_usd_m": 10,
        "trigger_types": ["parametric"],
        "spread_bps_range": None,
        "tick_usd": 2500,
        "underlying": "HDD_or_CDD_index",
        "clearing": "CME_or_bilateral",
        "isda_template": "ISDA_2002_Commodity",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["measurement_risk", "basis_risk", "station_outage"],
        "investor_base": ["energy_utility", "commodity_trader", "agribusiness", "insurer"],
        "description": "OTC swap exchanging fixed HDD/CDD index value for realised; payout = tick × (realised − fixed).",
    },
    {
        "id": "eua_call_spread",
        "name": "EUA Call Spread",
        "asset_class": "emission_allowance_derivative",
        "typical_tenor_years": 1,
        "typical_notional_t": 100000,
        "legs": ["long_call_lower_strike", "short_call_upper_strike"],
        "example_strikes": {"lower": 65, "upper": 85},
        "clearing": "ICE_or_Eurex",
        "isda_template": "ISDA_2002_Commodity_EUA_Schedule",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["price_gap_risk", "liquidity_risk", "regulatory_change"],
        "investor_base": ["EU_ETS_participant", "energy_company", "hedge_fund"],
        "description": "Limits net cost of EUA procurement; buyer pays bounded premium for upside cap.",
    },
    {
        "id": "temperature_floor",
        "name": "Temperature Floor (HDD Put)",
        "asset_class": "weather_derivative",
        "typical_tenor_years": 1,
        "typical_notional_usd_m": 5,
        "trigger_types": ["parametric"],
        "tick_usd": 2500,
        "underlying": "HDD_season_index",
        "clearing": "CME_or_bilateral",
        "isda_template": "ISDA_2002_Commodity",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["measurement_risk", "warm_winter_basis"],
        "investor_base": ["gas_distributor", "heating_oil_retailer", "utility"],
        "description": "Pays heating-degree protection when winter index falls below strike — hedges warm-winter revenue shortfall.",
    },
    {
        "id": "rainfall_cap",
        "name": "Rainfall Cap",
        "asset_class": "weather_derivative",
        "typical_tenor_years": 1,
        "typical_notional_usd_m": 3,
        "trigger_types": ["parametric"],
        "tick_usd": 1000,
        "underlying": "cumulative_rainfall_mm",
        "clearing": "bilateral_otc",
        "isda_template": "ISDA_2002_Commodity",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["rainfall_station_basis", "event_clustering"],
        "investor_base": ["construction_firm", "event_organiser", "agriculture_firm"],
        "description": "Pays when cumulative rainfall exceeds strike level in specified period — event-risk hedge.",
    },
    {
        "id": "carbon_credit_repo",
        "name": "Carbon Credit Repo",
        "asset_class": "sustainability_finance",
        "typical_tenor_years": 0.5,
        "typical_notional_usd_m": 20,
        "collateral": ["VCS_credits", "Gold_Standard_credits", "EUAs", "Art6_ITMOs"],
        "repo_rate_spread_bps": {"min": 50, "max": 200},
        "clearing": "Eurex_or_bilateral",
        "isda_template": "ISDA_GMSLA_2010",
        "emir_class": "commodity_secured_financing",
        "mifid_category": "structured_product",
        "key_risks": ["collateral_permanence_risk", "regulatory_invalidation_risk", "market_liquidity"],
        "investor_base": ["carbon_fund", "trading_desk", "corporate_treasury"],
        "description": "Sale and repurchase of voluntary carbon credits; haircut reflects permanence and vintage quality.",
    },
    {
        "id": "green_total_return_swap",
        "name": "Green Total Return Swap",
        "asset_class": "sustainability_finance",
        "typical_tenor_years": 3,
        "typical_notional_usd_m": 100,
        "reference_asset": "green_bond_index_or_basket",
        "legs": ["TR_payer_receives_fixed_or_floating", "TR_receiver_pays_SOFR_plus_spread"],
        "spread_bps_range": {"min": 30, "max": 120},
        "clearing": "LCH_or_bilateral",
        "isda_template": "ISDA_2002_TRS_Climate_Supplement",
        "emir_class": "equity_derivative_trs",
        "mifid_category": "complex_financial_instrument",
        "key_risks": ["reference_asset_credit", "greenium_compression", "index_rebalancing"],
        "investor_base": ["ESG_fund", "pension_fund", "sovereign_wealth_fund"],
        "description": "Synthetic exposure to green bond basket; receiver gains economic exposure without ownership.",
    },
    {
        "id": "sustainability_linked_swap",
        "name": "Sustainability-Linked Interest Rate Swap",
        "asset_class": "sustainability_finance",
        "typical_tenor_years": 5,
        "typical_notional_usd_m": 500,
        "kpi_targets": ["Scope_1_reduction", "RE_percentage", "diversity_ratio", "TCFD_disclosure"],
        "margin_ratchet_bps": {"step_down_if_hit": -5, "step_up_if_missed": 5},
        "clearing": "LCH",
        "isda_template": "ISDA_2022_SLD_Taxonomy",
        "emir_class": "interest_rate_derivative",
        "mifid_category": "interest_rate_derivative",
        "key_risks": ["KPI_measurement_dispute", "greenwashing_scrutiny", "ratchet_basis"],
        "investor_base": ["corporate_borrower", "bank", "insurance_company"],
        "description": "Fixed-for-floating IRS with spread adjustment linked to verified ESG KPI achievement.",
    },
    {
        "id": "parametric_insurance_swap",
        "name": "Parametric Insurance Swap",
        "asset_class": "insurance_linked_security",
        "typical_tenor_years": 1,
        "typical_notional_usd_m": 50,
        "trigger_types": ["parametric"],
        "trigger_examples": ["wind_speed_kmh>120", "rainfall_7d>300mm", "earthquake_mw>6.5"],
        "payout_structure": "binary_or_linear",
        "clearing": "bilateral_otc",
        "isda_template": "ISDA_2002_Parametric_Insurance_Annex",
        "emir_class": "non_financial_structured",
        "mifid_category": "structured_product",
        "key_risks": ["basis_risk", "trigger_threshold_calibration", "reinsurer_credit"],
        "investor_base": ["sovereign", "municipal_authority", "development_bank", "insurer"],
        "description": "Swap that pays fixed amount upon parametric trigger; faster settlement than indemnity insurance.",
    },
    {
        "id": "climate_index_note",
        "name": "Climate Index-Linked Note",
        "asset_class": "structured_note",
        "typical_tenor_years": 5,
        "typical_notional_usd_m": 25,
        "reference_index": ["MSCI_Climate_Action_Index", "S&P_Carbon_Efficient_Index",
                            "EU_Climate_Transition_Benchmark"],
        "capital_protection_pct": 90,
        "participation_rate_pct": 100,
        "clearing": "exchange_listed_or_otc",
        "isda_template": "ISDA_2002_Equity_Definitions",
        "emir_class": "equity_derivative",
        "mifid_category": "structured_product",
        "key_risks": ["index_methodology_change", "issuer_credit", "early_redemption_penalty"],
        "investor_base": ["retail_investor", "private_bank", "wealth_management"],
        "description": "Capital-protected note with upside linked to climate equity index performance.",
    },
    {
        "id": "transition_risk_put",
        "name": "Transition Risk Put Option",
        "asset_class": "emission_allowance_derivative",
        "typical_tenor_years": 2,
        "typical_notional_t": 200000,
        "underlying": "carbon_stranded_asset_index_or_EUA",
        "option_style": "european",
        "strike_methodology": "delta_neutral_25d",
        "clearing": "ICE_or_bilateral",
        "isda_template": "ISDA_2002_Commodity_EUA_Schedule",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["model_risk", "regulatory_shift", "correlation_breakdown"],
        "investor_base": ["fossil_fuel_company", "energy_bank", "hedge_fund"],
        "description": "Put on carbon price or stranded-asset index — hedges downside from accelerated energy transition.",
    },
    {
        "id": "biodiversity_credit_forward",
        "name": "Biodiversity Credit Forward",
        "asset_class": "nature_based_derivative",
        "typical_tenor_years": 3,
        "typical_notional_credits": 10000,
        "credit_standards": ["TNFD_v1", "SBTN", "BNG_DEFRA_Metric4", "Wallacea_Trust"],
        "price_range_usd_per_credit": {"min": 5, "max": 150},
        "clearing": "bilateral_otc",
        "isda_template": "ISDA_2022_Sustainability_Definitions_Biodiversity_Annex",
        "emir_class": "commodity_derivative",
        "mifid_category": "commodity_derivative",
        "key_risks": ["credit_permanence", "double_counting", "regulatory_recognition",
                      "baseline_measurement_dispute"],
        "investor_base": ["bank", "corporate", "nature_fund", "development_finance_institution"],
        "description": "Forward purchase of verified biodiversity credits; locks in supply for corporate net-positive commitments.",
    },
]

# ISDA 2022 Sustainability-Linked Derivatives Checklist
ISDA_SLD_CHECKLIST: list[dict[str, str]] = [
    {"ref": "SLD-01", "item": "KPI definition and measurability", "description": "KPI must be material to the entity's business and verifiable by third-party assurance."},
    {"ref": "SLD-02", "item": "SPT calibration methodology", "description": "Sustainability Performance Targets must be ambitious (SBTi-aligned or regulatory target based)."},
    {"ref": "SLD-03", "item": "Observation date schedule", "description": "Periodic measurement dates defined; annual minimum recommended."},
    {"ref": "SLD-04", "item": "Verification agent appointment", "description": "Independent third-party verifier appointed per RTS 2022/1288 or equivalent."},
    {"ref": "SLD-05", "item": "Payment mechanism", "description": "Ratchet bps defined for KPI achievement (step-down) and miss (step-up); symmetric preferred."},
    {"ref": "SLD-06", "item": "Transparency and reporting", "description": "Annual KPI performance report published on regulated information service or issuer website."},
    {"ref": "SLD-07", "item": "Greenwashing risk assessment", "description": "Pre-trade greenwashing screen per ESMA TRV 2023; KPI must not be already-mandated target."},
    {"ref": "SLD-08", "item": "EMIR reporting classification", "description": "SLD classified as interest rate / commodity derivative for EMIR trade repository reporting."},
    {"ref": "SLD-09", "item": "MiFID II product governance", "description": "Target market assessment (sustainability preference under RTS 2017/565 Art 54a)."},
    {"ref": "SLD-10", "item": "Fallback provisions", "description": "Trigger for KPI data unavailability (COVID-force-majeure equivalent) clearly defined."},
    {"ref": "SLD-11", "item": "Taxonomy alignment statement", "description": "Whether the underlying activity qualifies under EU Taxonomy or equivalent green framework."},
    {"ref": "SLD-12", "item": "Confidentiality and disclosure", "description": "KPI targets may be confidential; minimum disclosure required per EMIR trade repository."},
]

# EMIR / MiFID II Classification Reference
REGULATORY_CLASSIFICATION: dict[str, Any] = {
    "emir_classes": {
        "interest_rate_derivative": {"clearing_threshold_eur_bn": 1.0, "bilateral_margining": True},
        "credit_derivative": {"clearing_threshold_eur_bn": 1.0, "bilateral_margining": True},
        "equity_derivative": {"clearing_threshold_eur_bn": 1.0, "bilateral_margining": True},
        "commodity_derivative": {"clearing_threshold_eur_bn": 3.0, "bilateral_margining": False},
        "fx_derivative": {"clearing_threshold_eur_bn": 3.0, "bilateral_margining": True},
        "non_financial_structured": {"clearing_threshold_eur_bn": None, "bilateral_margining": False},
    },
    "mifid_categories": {
        "complex_financial_instrument": {"appropriateness_required": True, "suitability_required": True},
        "non_complex": {"appropriateness_required": False, "suitability_required": False},
        "structured_product": {"appropriateness_required": True, "suitability_required": True},
        "commodity_derivative": {"appropriateness_required": True, "suitability_required": False},
        "interest_rate_derivative": {"appropriateness_required": True, "suitability_required": True},
        "equity_derivative": {"appropriateness_required": True, "suitability_required": True},
    },
    "hedging_exemption_criteria": [
        "hedger_must_be_non_financial_counterparty",
        "hedge_must_reduce_commercial_or_treasury_risk",
        "annual_NFC_threshold_assessment_required",
        "internal_hedge_policy_documented",
        "retrospective_effectiveness_test_95pct",
    ],
    "reporting_obligations": {
        "EMIR_Refit": "T+1 trade repository reporting for all OTC derivatives",
        "MiFIR_RTS22": "Transaction reporting to NCA within T+1",
        "SFTR": "Securities financing transactions reported T+1 for in-scope repos",
    },
}


# ---------------------------------------------------------------------------
# Internal Helpers
# ---------------------------------------------------------------------------

def _norm_cdf(x: float) -> float:
    """Cumulative standard normal distribution (Abramowitz & Stegun approximation)."""
    neg = x < 0
    x = abs(x)
    k = 1.0 / (1.0 + 0.3275911 * x)
    y = 1.0 - (((((1.061405429 * k - 1.453152027) * k) + 1.421413741)
                 * k - 0.284496736) * k + 0.254829592) * k * math.exp(-x * x / 2.0)
    return 1.0 - y if neg else y


def _norm_pdf(x: float) -> float:
    """Standard normal PDF."""
    return math.exp(-0.5 * x * x) / math.sqrt(2.0 * math.pi)


def _generate_burn_payouts(
    mean: float, std_dev: float, strike: float, contract_type: str,
    tick_usd: float, n_years: int = 20, seed: int = 42
) -> list[float]:
    """Simulate n_years historical payouts for burn analysis."""
    rng = random.Random(seed)
    payouts = []
    for _ in range(n_years):
        realised = rng.gauss(mean, std_dev)
        if contract_type in ("call", "cap"):
            raw = max(0.0, realised - strike)
        elif contract_type in ("put", "floor"):
            raw = max(0.0, strike - realised)
        elif contract_type == "swap":
            raw = realised - strike          # can be negative
        else:
            raw = max(0.0, realised - strike)
        payouts.append(raw * tick_usd)
    return payouts


# ---------------------------------------------------------------------------
# Core Engine Functions
# ---------------------------------------------------------------------------

def price_weather_derivative(
    underlying: str,
    city_station: str,
    contract_type: str,
    strike: float,
    notional_usd: float,
    tenor_days: int,
    risk_premium_loading: float = 0.20,
) -> dict[str, Any]:
    """
    Price a weather derivative using burn analysis.

    Parameters
    ----------
    underlying : str
        One of: hdd, cdd, rainfall_mm, wind_ms, sunshine_hrs
    city_station : str
        Station key from WEATHER_STATIONS (e.g. 'london', 'chicago')
    contract_type : str
        One of: call, put, swap, cap, floor
    strike : float
        Strike level in the underlying's units
    notional_usd : float
        Notional in USD
    tenor_days : int
        Tenor of the contract in days
    risk_premium_loading : float
        Risk premium as a fraction of expected payout (0.15–0.25 recommended)

    Returns
    -------
    dict containing fair_value_usd, risk_premium_usd, delta, gamma, vega,
    burn_analysis_payouts, payout_std_dev, confidence_intervals
    """
    station_key = city_station.lower().replace(" ", "_")
    if station_key not in WEATHER_STATIONS:
        available = list(WEATHER_STATIONS.keys())
        raise ValueError(f"Unknown station '{city_station}'. Available: {available}")

    station = WEATHER_STATIONS[station_key]
    und_key = underlying.lower()
    if und_key not in station:
        raise ValueError(f"Underlying '{underlying}' not available for station '{city_station}'.")

    und_data = station[und_key]
    mean_annual = und_data["annual_mean"]
    std_dev_annual = und_data["std_dev"]

    # Scale to tenor (assumes daily index accumulates over season ≈ 90d per quarter)
    scale_factor = tenor_days / 365.0
    mean_scaled = mean_annual * scale_factor
    std_scaled = std_dev_annual * math.sqrt(scale_factor)

    # Tick size: $2,500 per index point (CME standard for HDD/CDD; $1,000 for rainfall)
    tick_usd = 2500.0 if und_key in ("hdd", "cdd") else (1000.0 if und_key == "rainfall_mm" else 500.0)

    # Burn analysis — 20-year simulated historical payouts
    burn_payouts = _generate_burn_payouts(
        mean_scaled, std_scaled, strike, contract_type, tick_usd, n_years=20
    )

    expected_payout_usd = max(0.0, sum(burn_payouts) / len(burn_payouts))
    payout_std_dev = (sum((p - expected_payout_usd) ** 2 for p in burn_payouts) / len(burn_payouts)) ** 0.5

    # Risk premium loading (15–25% of expected payout)
    risk_premium_usd = expected_payout_usd * risk_premium_loading
    fair_value_usd = expected_payout_usd + risk_premium_usd

    # Scale to actual notional
    reference_notional = 10_000_000.0  # $10m reference
    notional_scale = notional_usd / reference_notional
    fair_value_usd *= notional_scale
    risk_premium_usd *= notional_scale
    payout_std_dev_scaled = payout_std_dev * notional_scale

    # Approximate Greeks (moneyness-based)
    moneyness = (mean_scaled - strike) / (std_scaled + 1e-9)
    delta = _norm_cdf(moneyness) if contract_type in ("call", "cap") else -_norm_cdf(-moneyness)
    gamma = _norm_pdf(moneyness) / (std_scaled + 1e-9)
    vega = _norm_pdf(moneyness) * math.sqrt(tenor_days / 365.0) * notional_usd * 0.01

    # Confidence intervals on payout (1 std, 2 std)
    conf_intervals = {
        "p10_usd": max(0.0, expected_payout_usd - 1.282 * payout_std_dev) * notional_scale,
        "p25_usd": max(0.0, expected_payout_usd - 0.674 * payout_std_dev) * notional_scale,
        "p75_usd": (expected_payout_usd + 0.674 * payout_std_dev) * notional_scale,
        "p90_usd": (expected_payout_usd + 1.282 * payout_std_dev) * notional_scale,
    }

    return {
        "station": station["city"],
        "country": station["country"],
        "underlying": underlying,
        "contract_type": contract_type,
        "strike": strike,
        "tenor_days": tenor_days,
        "station_annual_mean": mean_annual,
        "station_std_dev": std_dev_annual,
        "scaled_mean": round(mean_scaled, 2),
        "scaled_std_dev": round(std_scaled, 2),
        "expected_payout_usd": round(expected_payout_usd * notional_scale, 2),
        "risk_premium_usd": round(risk_premium_usd, 2),
        "risk_premium_loading_pct": round(risk_premium_loading * 100, 1),
        "fair_value_usd": round(fair_value_usd, 2),
        "payout_std_dev_usd": round(payout_std_dev_scaled, 2),
        "burn_analysis_payouts_usd": [round(p * notional_scale, 2) for p in burn_payouts],
        "confidence_intervals": {k: round(v, 2) for k, v in conf_intervals.items()},
        "greeks": {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "vega_per_1pct_vol": round(vega, 2),
        },
        "tick_usd": tick_usd,
        "methodology": "burn_analysis_20yr_simulation",
    }


def price_eua_option(
    option_type: str,
    strike: float,
    spot: float | None = None,
    tenor_years: float = 1.0,
    volatility: float | None = None,
    risk_free_rate: float | None = None,
) -> dict[str, Any]:
    """
    Price an EUA (EU Allowance) option using Black-Scholes-Merton adapted for commodity.

    Parameters
    ----------
    option_type : str
        'call' or 'put'
    strike : float
        Strike price in EUR/tCO2
    spot : float or None
        Spot price; defaults to EUA_MARKET_DATA spot
    tenor_years : float
        Time to expiry in years
    volatility : float or None
        Annual volatility; defaults to EUA_MARKET_DATA historical_vol_pct
    risk_free_rate : float or None
        Risk-free rate; defaults to EUA_MARKET_DATA risk_free_rate
    """
    S = spot if spot is not None else EUA_MARKET_DATA["spot_eur_t"]
    K = strike
    T = tenor_years
    sigma = volatility if volatility is not None else EUA_MARKET_DATA["historical_vol_pct"]
    r = risk_free_rate if risk_free_rate is not None else EUA_MARKET_DATA["risk_free_rate"]

    if T <= 0:
        raise ValueError("Tenor must be positive.")
    if sigma <= 0:
        raise ValueError("Volatility must be positive.")
    if S <= 0 or K <= 0:
        raise ValueError("Spot and strike must be positive.")

    sqrt_T = math.sqrt(T)
    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T
    disc = math.exp(-r * T)

    if option_type.lower() == "call":
        price = S * _norm_cdf(d1) - K * disc * _norm_cdf(d2)
        delta = _norm_cdf(d1)
    elif option_type.lower() == "put":
        price = K * disc * _norm_cdf(-d2) - S * _norm_cdf(-d1)
        delta = _norm_cdf(d1) - 1.0
    else:
        raise ValueError("option_type must be 'call' or 'put'.")

    gamma = _norm_pdf(d1) / (S * sigma * sqrt_T)
    vega = S * _norm_pdf(d1) * sqrt_T / 100.0          # per 1% vol move
    theta = (-(S * _norm_pdf(d1) * sigma) / (2.0 * sqrt_T) - r * K * disc * _norm_cdf(d2 if option_type == "call" else -d2)) / 365.0
    rho_call = K * T * disc * _norm_cdf(d2) / 100.0   # per 1% rate move
    rho = rho_call if option_type.lower() == "call" else -K * T * disc * _norm_cdf(-d2) / 100.0

    # Implied vol surface lookup (nearest tenor bucket)
    tenor_key = "3m" if T <= 0.375 else ("6m" if T <= 0.75 else ("12m" if T <= 1.5 else "24m"))
    vol_surface_point = EUA_MARKET_DATA["vol_surface"].get(tenor_key, {})

    # Intrinsic and time value
    intrinsic = max(0.0, S - K) if option_type == "call" else max(0.0, K - S)
    time_value = price - intrinsic

    return {
        "option_type": option_type,
        "spot_eur_t": S,
        "strike_eur_t": K,
        "tenor_years": T,
        "volatility_pct": round(sigma * 100, 2),
        "risk_free_rate_pct": round(r * 100, 2),
        "bsm_fair_value_eur_t": round(price, 4),
        "intrinsic_value_eur_t": round(intrinsic, 4),
        "time_value_eur_t": round(time_value, 4),
        "d1": round(d1, 4),
        "d2": round(d2, 4),
        "greeks": {
            "delta": round(delta, 4),
            "gamma": round(gamma, 6),
            "vega_per_1pct_vol": round(vega, 4),
            "theta_per_day_eur_t": round(theta, 6),
            "rho_per_1pct_rate": round(rho, 4),
        },
        "vol_surface_reference": {
            "tenor_bucket": tenor_key,
            "atm_vol_pct": vol_surface_point.get("ATM", sigma) * 100,
            "25d_put_vol_pct": vol_surface_point.get("25d_put", sigma) * 100,
            "25d_call_vol_pct": vol_surface_point.get("25d_call", sigma) * 100,
        },
        "eua_market_context": {
            "exchange": EUA_MARKET_DATA["primary_exchange"],
            "lot_size_t": EUA_MARKET_DATA["lot_size_t"],
            "long_run_mean_eur_t": EUA_MARKET_DATA["long_run_mean_eur_t"],
        },
        "methodology": "black_scholes_merton_adapted_commodity",
    }


def structure_cat_bond(
    peril: str,
    country: str,
    attachment_point_usd_m: float,
    exhaustion_point_usd_m: float,
    notional_usd_m: float,
    tenor_years: float,
    trigger_type: str,
    peril_model: str,
) -> dict[str, Any]:
    """
    Structure a catastrophe bond and compute expected loss, spread, and SPV details.

    Parameters
    ----------
    peril : str
        e.g. 'wind', 'flood', 'earthquake', 'wildfire'
    country : str
        ISO-2 country code
    attachment_point_usd_m : float
        Industry loss level (USD millions) at which bond starts paying
    exhaustion_point_usd_m : float
        Industry loss level at which bond is fully exhausted
    notional_usd_m : float
        Face value of the cat bond (USD millions)
    tenor_years : float
        Bond tenor (years)
    trigger_type : str
        One of: indemnity, parametric, index, modelled_loss
    peril_model : str
        One of the 8 model providers (RMS, AIR, Verisk, JBA, Aon, SwissRe, MunichRe, GuyCarpenter)
    """
    valid_triggers = ("indemnity", "parametric", "index", "modelled_loss")
    if trigger_type not in valid_triggers:
        raise ValueError(f"trigger_type must be one of {valid_triggers}")

    if peril_model not in PERIL_MODELS:
        raise ValueError(f"peril_model must be one of {list(PERIL_MODELS.keys())}")

    if attachment_point_usd_m >= exhaustion_point_usd_m:
        raise ValueError("attachment_point must be less than exhaustion_point.")

    # Peril frequency/severity parameters (simplified industry reference)
    _peril_params: dict[str, dict[str, float]] = {
        "wind":       {"annual_freq": 0.08, "severity_mult": 1.0},
        "flood":      {"annual_freq": 0.12, "severity_mult": 0.7},
        "earthquake": {"annual_freq": 0.04, "severity_mult": 1.5},
        "wildfire":   {"annual_freq": 0.10, "severity_mult": 0.6},
        "storm_surge":{"annual_freq": 0.06, "severity_mult": 0.9},
        "hail":       {"annual_freq": 0.15, "severity_mult": 0.4},
    }
    peril_key = peril.lower()
    params = _peril_params.get(peril_key, {"annual_freq": 0.07, "severity_mult": 1.0})

    layer_width = exhaustion_point_usd_m - attachment_point_usd_m

    # Expected Loss = frequency × P(loss in layer) × expected severity in layer
    # Simplified: P(attach) based on log-normal industry loss distribution
    industry_mean = attachment_point_usd_m * 0.4
    industry_vol = 1.2
    if attachment_point_usd_m > 0:
        z_attach = (math.log(attachment_point_usd_m) - math.log(max(industry_mean, 1e-9))) / (industry_vol + 1e-9)
        prob_attach = 1.0 - _norm_cdf(z_attach)
    else:
        prob_attach = 1.0

    z_exhaust = (math.log(exhaustion_point_usd_m) - math.log(max(industry_mean, 1e-9))) / (industry_vol + 1e-9)
    prob_exhaust = 1.0 - _norm_cdf(z_exhaust)

    # Annual EL on the layer
    annual_el_pct = params["annual_freq"] * params["severity_mult"] * (prob_attach - prob_exhaust) * 100.0
    annual_el_pct = max(0.10, min(annual_el_pct, 25.0))  # cap/floor for reasonableness

    # Trigger type basis risk adjustment
    basis_risk_adj = {"indemnity": 0.0, "parametric": 1.5, "index": 1.0, "modelled_loss": 0.5}
    spread_adj = basis_risk_adj.get(trigger_type, 0.0)

    # Spread = EL + risk premium (spread multiple ~2x EL) + liquidity premium + basis risk
    risk_premium_bps = annual_el_pct * 100 * 1.8   # risk-premium spread
    liquidity_premium_bps = 75.0
    el_spread_bps = annual_el_pct * 100
    fair_spread_bps = el_spread_bps + risk_premium_bps + liquidity_premium_bps + spread_adj * 100

    # Survival function at each return period
    return_periods = [10, 25, 50, 100, 200, 500]
    survival = {f"RP_{rp}yr": round(max(0.0, 1.0 - 1.0 / rp * params["annual_freq"] * 15), 4) for rp in return_periods}

    # Expected loss USD
    el_usd_m = (annual_el_pct / 100.0) * notional_usd_m * tenor_years
    el_usd_m = min(el_usd_m, notional_usd_m)

    model_info = PERIL_MODELS[peril_model]

    return {
        "peril": peril,
        "country": country,
        "trigger_type": trigger_type,
        "peril_model": peril_model,
        "model_provider": model_info["provider"],
        "attachment_point_usd_m": attachment_point_usd_m,
        "exhaustion_point_usd_m": exhaustion_point_usd_m,
        "layer_width_usd_m": round(layer_width, 2),
        "notional_usd_m": notional_usd_m,
        "tenor_years": tenor_years,
        "annual_el_pct": round(annual_el_pct, 3),
        "el_spread_bps": round(el_spread_bps, 1),
        "risk_premium_bps": round(risk_premium_bps, 1),
        "liquidity_premium_bps": round(liquidity_premium_bps, 1),
        "basis_risk_adj_bps": round(spread_adj * 100, 1),
        "fair_spread_bps": round(fair_spread_bps, 1),
        "fair_spread_pct": round(fair_spread_bps / 100.0, 3),
        "coupon_above_libor_bps": round(fair_spread_bps, 1),
        "expected_loss_usd_m": round(el_usd_m, 3),
        "probability_of_attachment": round(prob_attach, 4),
        "probability_of_exhaustion": round(prob_exhaust, 4),
        "survival_function": survival,
        "spv_structure": {
            "vehicle": "Cayman_Islands_SPV",
            "collateral": "US_T-bills_or_MMF",
            "issuing_rule": "Rule_144A_Reg_S",
            "rating_targets": ["BB+", "BB", "B+", "B"],
            "trustee": "BNY_Mellon_or_Deutsche_Bank",
            "calculation_agent": peril_model,
        },
        "regulatory_classification": {
            "emir": "non_financial_structured",
            "mifid": "structured_product",
            "solvency_ii_treatment": "non-life_catastrophe_risk_transfer",
        },
        "methodology": "expected_loss_frequency_severity",
    }


def classify_regulatory(
    product_type: str,
    counterparty_type: str,
    jurisdiction: str,
) -> dict[str, Any]:
    """
    Classify a climate-linked derivative under EMIR / MiFID II / ISDA documentation.

    Parameters
    ----------
    product_type : str
        e.g. 'cat_bond', 'weather_swap', 'eua_call_spread', 'sustainability_linked_swap'
    counterparty_type : str
        'financial_counterparty', 'non_financial_counterparty', 'nfc_plus', 'third_country'
    jurisdiction : str
        'EU', 'UK', 'US', 'APAC'
    """
    # Map product to template
    template_map = {t["id"]: t for t in PRODUCT_TEMPLATES}
    template = template_map.get(product_type, {})
    emir_class = template.get("emir_class", "commodity_derivative")
    mifid_cat = template.get("mifid_category", "structured_product")

    emir_class_data = REGULATORY_CLASSIFICATION["emir_classes"].get(emir_class, {})
    mifid_cat_data = REGULATORY_CLASSIFICATION["mifid_categories"].get(mifid_cat, {})

    clearing_threshold = emir_class_data.get("clearing_threshold_eur_bn")
    bilateral_margin = emir_class_data.get("bilateral_margining", False)

    # Clearing obligation
    clearing_obligated = counterparty_type in ("financial_counterparty", "nfc_plus") and emir_class in (
        "interest_rate_derivative", "credit_derivative"
    )
    clearing_venue = template.get("clearing", "bilateral_otc")

    # ISDA documentation
    isda_template = template.get("isda_template", "ISDA_2002_Master")

    # Jurisdiction-specific overlay
    jurisdiction_notes: dict[str, str] = {
        "EU": f"EMIR Refit applies; TR reporting to ESMA-designated TR; {emir_class} class threshold €{clearing_threshold}bn if applicable.",
        "UK": "UK EMIR (onshored) applies; TR reporting to FCA-approved TR (DTCC/ICE); MiFID retained as UK MiFIR.",
        "US": "CFTC rules apply for swaps; SEC rules for security-based swaps; ISDA 2013 DF Protocol may apply.",
        "APAC": "Jurisdiction-specific: ASIC DR (AU), MAS SFB (SG), JFSA (JP) EMIR-equivalent; check bilateral agreements.",
    }

    # CCP eligibility lookup
    ccp_data = {}
    for ccp, ccp_info in CCP_ELIGIBILITY.items():
        if any(p.lower() in clearing_venue.lower() or emir_class in p.lower()
               for p in ccp_info["cleared_products"]):
            ccp_data[ccp] = ccp_info["full_name"]

    return {
        "product_type": product_type,
        "counterparty_type": counterparty_type,
        "jurisdiction": jurisdiction,
        "emir_class": emir_class,
        "mifid_category": mifid_cat,
        "clearing_threshold_eur_bn": clearing_threshold,
        "clearing_obligated": clearing_obligated,
        "bilateral_margining_required": bilateral_margin,
        "clearing_venue": clearing_venue,
        "isda_confirmation_template": isda_template,
        "appropriateness_required": mifid_cat_data.get("appropriateness_required", True),
        "suitability_required": mifid_cat_data.get("suitability_required", False),
        "eligible_ccps": ccp_data,
        "hedging_exemption_criteria": REGULATORY_CLASSIFICATION["hedging_exemption_criteria"],
        "reporting_obligations": REGULATORY_CLASSIFICATION["reporting_obligations"],
        "jurisdiction_note": jurisdiction_notes.get(jurisdiction, "Consult local legal counsel."),
        "isda_sld_checklist": ISDA_SLD_CHECKLIST if "sustainability" in product_type else [],
    }


def get_product_templates() -> list[dict[str, Any]]:
    """Return the 12 climate-linked structured product templates."""
    return PRODUCT_TEMPLATES
