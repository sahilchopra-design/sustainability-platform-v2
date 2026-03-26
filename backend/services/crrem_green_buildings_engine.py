"""
CRREM & Green Buildings Engine — E112
======================================
Carbon Risk Real Estate Monitor (CRREM) v2.0 pathway alignment, retrofit planning,
green premium valuation, and GRESB scoring for the Risk Analytics Platform.

Standards covered:
  - CRREM v2.0 (2023) 1.5°C / 2°C decarbonisation pathways
  - EU Energy Performance of Buildings Directive (EPBD) recast 2024
  - GRESB Real Estate Assessment Framework 2024
  - BREEAM / LEED / NABERS / DGNB certification benchmarks
  - EU Taxonomy Regulation 2020/852 — buildings technical screening criteria
  - RICS VPS4 climate risk disclosure

Author: Risk Analytics Platform
Version: 1.0.0
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Reference Data
# ---------------------------------------------------------------------------

# CRREM pathways: energy_intensity (kWh/m²/yr) and carbon_intensity (kgCO2/m²/yr)
# Keys: building_type → country_iso3 → scenario ("1.5C" | "2.0C") → year
# Country codes: DEU, GBR, FRA, USA, AUS
# Years: 2025, 2030, 2035, 2040, 2050

CRREM_PATHWAYS: Dict[str, Dict[str, Dict[str, Dict[int, Dict[str, float]]]]] = {
    "office": {
        "DEU": {
            "1.5C": {
                2025: {"energy": 175, "carbon": 28},
                2030: {"energy": 140, "carbon": 20},
                2035: {"energy": 108, "carbon": 13},
                2040: {"energy": 80,  "carbon": 8},
                2050: {"energy": 45,  "carbon": 3},
            },
            "2.0C": {
                2025: {"energy": 190, "carbon": 32},
                2030: {"energy": 162, "carbon": 25},
                2035: {"energy": 135, "carbon": 18},
                2040: {"energy": 108, "carbon": 12},
                2050: {"energy": 65,  "carbon": 6},
            },
        },
        "GBR": {
            "1.5C": {
                2025: {"energy": 165, "carbon": 24},
                2030: {"energy": 132, "carbon": 17},
                2035: {"energy": 100, "carbon": 11},
                2040: {"energy": 73,  "carbon": 6},
                2050: {"energy": 40,  "carbon": 2},
            },
            "2.0C": {
                2025: {"energy": 180, "carbon": 28},
                2030: {"energy": 152, "carbon": 21},
                2035: {"energy": 124, "carbon": 15},
                2040: {"energy": 96,  "carbon": 10},
                2050: {"energy": 56,  "carbon": 4},
            },
        },
        "FRA": {
            "1.5C": {
                2025: {"energy": 155, "carbon": 18},
                2030: {"energy": 122, "carbon": 12},
                2035: {"energy": 92,  "carbon": 7},
                2040: {"energy": 66,  "carbon": 4},
                2050: {"energy": 35,  "carbon": 1},
            },
            "2.0C": {
                2025: {"energy": 168, "carbon": 22},
                2030: {"energy": 140, "carbon": 16},
                2035: {"energy": 113, "carbon": 10},
                2040: {"energy": 86,  "carbon": 6},
                2050: {"energy": 50,  "carbon": 2},
            },
        },
        "USA": {
            "1.5C": {
                2025: {"energy": 230, "carbon": 52},
                2030: {"energy": 185, "carbon": 38},
                2035: {"energy": 145, "carbon": 26},
                2040: {"energy": 108, "carbon": 16},
                2050: {"energy": 58,  "carbon": 5},
            },
            "2.0C": {
                2025: {"energy": 252, "carbon": 60},
                2030: {"energy": 210, "carbon": 46},
                2035: {"energy": 170, "carbon": 33},
                2040: {"energy": 132, "carbon": 22},
                2050: {"energy": 78,  "carbon": 9},
            },
        },
        "AUS": {
            "1.5C": {
                2025: {"energy": 210, "carbon": 65},
                2030: {"energy": 168, "carbon": 46},
                2035: {"energy": 130, "carbon": 30},
                2040: {"energy": 96,  "carbon": 18},
                2050: {"energy": 50,  "carbon": 4},
            },
            "2.0C": {
                2025: {"energy": 230, "carbon": 75},
                2030: {"energy": 192, "carbon": 55},
                2035: {"energy": 155, "carbon": 38},
                2040: {"energy": 120, "carbon": 24},
                2050: {"energy": 68,  "carbon": 8},
            },
        },
    },
    "retail": {
        "DEU": {
            "1.5C": {2025: {"energy": 280, "carbon": 45}, 2030: {"energy": 225, "carbon": 32}, 2035: {"energy": 172, "carbon": 20}, 2040: {"energy": 125, "carbon": 12}, 2050: {"energy": 65, "carbon": 4}},
            "2.0C": {2025: {"energy": 305, "carbon": 52}, 2030: {"energy": 258, "carbon": 38}, 2035: {"energy": 208, "carbon": 25}, 2040: {"energy": 160, "carbon": 16}, 2050: {"energy": 90, "carbon": 6}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 265, "carbon": 38}, 2030: {"energy": 210, "carbon": 26}, 2035: {"energy": 158, "carbon": 16}, 2040: {"energy": 112, "carbon": 9},  2050: {"energy": 58, "carbon": 2}},
            "2.0C": {2025: {"energy": 288, "carbon": 44}, 2030: {"energy": 238, "carbon": 32}, 2035: {"energy": 190, "carbon": 21}, 2040: {"energy": 144, "carbon": 13}, 2050: {"energy": 80, "carbon": 5}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 245, "carbon": 28}, 2030: {"energy": 194, "carbon": 18}, 2035: {"energy": 146, "carbon": 10}, 2040: {"energy": 103, "carbon": 5},  2050: {"energy": 52, "carbon": 1}},
            "2.0C": {2025: {"energy": 266, "carbon": 34}, 2030: {"energy": 220, "carbon": 24}, 2035: {"energy": 174, "carbon": 14}, 2040: {"energy": 130, "carbon": 8},  2050: {"energy": 72, "carbon": 3}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 380, "carbon": 85}, 2030: {"energy": 302, "carbon": 60}, 2035: {"energy": 232, "carbon": 40}, 2040: {"energy": 170, "carbon": 24}, 2050: {"energy": 85, "carbon": 6}},
            "2.0C": {2025: {"energy": 415, "carbon": 98}, 2030: {"energy": 344, "carbon": 72}, 2035: {"energy": 275, "carbon": 50}, 2040: {"energy": 210, "carbon": 32}, 2050: {"energy": 115, "carbon": 11}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 355, "carbon": 110}, 2030: {"energy": 280, "carbon": 76}, 2035: {"energy": 212, "carbon": 48}, 2040: {"energy": 152, "carbon": 28}, 2050: {"energy": 72, "carbon": 6}},
            "2.0C": {2025: {"energy": 388, "carbon": 128}, 2030: {"energy": 318, "carbon": 92}, 2035: {"energy": 252, "carbon": 60}, 2040: {"energy": 190, "carbon": 37}, 2050: {"energy": 100, "carbon": 10}},
        },
    },
    "residential_apartment": {
        "DEU": {
            "1.5C": {2025: {"energy": 145, "carbon": 22}, 2030: {"energy": 112, "carbon": 15}, 2035: {"energy": 82,  "carbon": 9},  2040: {"energy": 58,  "carbon": 5},  2050: {"energy": 28, "carbon": 1}},
            "2.0C": {2025: {"energy": 160, "carbon": 26}, 2030: {"energy": 130, "carbon": 19}, 2035: {"energy": 100, "carbon": 12}, 2040: {"energy": 75,  "carbon": 7},  2050: {"energy": 42, "carbon": 3}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 135, "carbon": 18}, 2030: {"energy": 104, "carbon": 12}, 2035: {"energy": 76,  "carbon": 7},  2040: {"energy": 53,  "carbon": 4},  2050: {"energy": 25, "carbon": 1}},
            "2.0C": {2025: {"energy": 148, "carbon": 22}, 2030: {"energy": 120, "carbon": 16}, 2035: {"energy": 92,  "carbon": 10}, 2040: {"energy": 68,  "carbon": 6},  2050: {"energy": 38, "carbon": 2}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 128, "carbon": 14}, 2030: {"energy": 98,  "carbon": 9},  2035: {"energy": 71,  "carbon": 5},  2040: {"energy": 50,  "carbon": 3},  2050: {"energy": 22, "carbon": 0}},
            "2.0C": {2025: {"energy": 140, "carbon": 17}, 2030: {"energy": 113, "carbon": 12}, 2035: {"energy": 87,  "carbon": 7},  2040: {"energy": 64,  "carbon": 4},  2050: {"energy": 34, "carbon": 1}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 195, "carbon": 44}, 2030: {"energy": 154, "carbon": 30}, 2035: {"energy": 116, "carbon": 19}, 2040: {"energy": 83,  "carbon": 11}, 2050: {"energy": 40, "carbon": 3}},
            "2.0C": {2025: {"energy": 215, "carbon": 52}, 2030: {"energy": 176, "carbon": 37}, 2035: {"energy": 138, "carbon": 25}, 2040: {"energy": 103, "carbon": 15}, 2050: {"energy": 56, "carbon": 5}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 182, "carbon": 56}, 2030: {"energy": 142, "carbon": 38}, 2035: {"energy": 105, "carbon": 23}, 2040: {"energy": 74,  "carbon": 13}, 2050: {"energy": 34, "carbon": 2}},
            "2.0C": {2025: {"energy": 200, "carbon": 65}, 2030: {"energy": 162, "carbon": 46}, 2035: {"energy": 124, "carbon": 30}, 2040: {"energy": 92,  "carbon": 18}, 2050: {"energy": 48, "carbon": 5}},
        },
    },
    "hotel": {
        "DEU": {
            "1.5C": {2025: {"energy": 310, "carbon": 50}, 2030: {"energy": 248, "carbon": 35}, 2035: {"energy": 190, "carbon": 22}, 2040: {"energy": 138, "carbon": 13}, 2050: {"energy": 70, "carbon": 4}},
            "2.0C": {2025: {"energy": 338, "carbon": 58}, 2030: {"energy": 282, "carbon": 42}, 2035: {"energy": 228, "carbon": 28}, 2040: {"energy": 176, "carbon": 17}, 2050: {"energy": 98, "carbon": 7}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 290, "carbon": 42}, 2030: {"energy": 230, "carbon": 28}, 2035: {"energy": 174, "carbon": 17}, 2040: {"energy": 124, "carbon": 10}, 2050: {"energy": 62, "carbon": 2}},
            "2.0C": {2025: {"energy": 316, "carbon": 50}, 2030: {"energy": 260, "carbon": 35}, 2035: {"energy": 206, "carbon": 22}, 2040: {"energy": 156, "carbon": 13}, 2050: {"energy": 86, "carbon": 4}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 272, "carbon": 32}, 2030: {"energy": 214, "carbon": 20}, 2035: {"energy": 160, "carbon": 12}, 2040: {"energy": 113, "carbon": 7},  2050: {"energy": 55, "carbon": 1}},
            "2.0C": {2025: {"energy": 296, "carbon": 38}, 2030: {"energy": 244, "carbon": 26}, 2035: {"energy": 192, "carbon": 16}, 2040: {"energy": 144, "carbon": 9},  2050: {"energy": 78, "carbon": 3}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 420, "carbon": 95}, 2030: {"energy": 334, "carbon": 66}, 2035: {"energy": 255, "carbon": 43}, 2040: {"energy": 184, "carbon": 25}, 2050: {"energy": 90, "carbon": 6}},
            "2.0C": {2025: {"energy": 460, "carbon": 110}, 2030: {"energy": 380, "carbon": 80}, 2035: {"energy": 302, "carbon": 54}, 2040: {"energy": 228, "carbon": 33}, 2050: {"energy": 125, "carbon": 11}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 395, "carbon": 122}, 2030: {"energy": 310, "carbon": 84}, 2035: {"energy": 234, "carbon": 53}, 2040: {"energy": 165, "carbon": 30}, 2050: {"energy": 78, "carbon": 6}},
            "2.0C": {2025: {"energy": 432, "carbon": 142}, 2030: {"energy": 352, "carbon": 102}, 2035: {"energy": 276, "carbon": 68}, 2040: {"energy": 204, "carbon": 40}, 2050: {"energy": 108, "carbon": 10}},
        },
    },
    "industrial": {
        "DEU": {
            "1.5C": {2025: {"energy": 130, "carbon": 20}, 2030: {"energy": 100, "carbon": 13}, 2035: {"energy": 74,  "carbon": 8},  2040: {"energy": 52,  "carbon": 4},  2050: {"energy": 24, "carbon": 1}},
            "2.0C": {2025: {"energy": 142, "carbon": 23}, 2030: {"energy": 115, "carbon": 17}, 2035: {"energy": 89,  "carbon": 10}, 2040: {"energy": 66,  "carbon": 6},  2050: {"energy": 34, "carbon": 2}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 120, "carbon": 16}, 2030: {"energy": 92,  "carbon": 10}, 2035: {"energy": 68,  "carbon": 6},  2040: {"energy": 48,  "carbon": 3},  2050: {"energy": 22, "carbon": 1}},
            "2.0C": {2025: {"energy": 131, "carbon": 19}, 2030: {"energy": 106, "carbon": 13}, 2035: {"energy": 82,  "carbon": 8},  2040: {"energy": 61,  "carbon": 5},  2050: {"energy": 30, "carbon": 2}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 112, "carbon": 12}, 2030: {"energy": 86,  "carbon": 7},  2035: {"energy": 63,  "carbon": 4},  2040: {"energy": 44,  "carbon": 2},  2050: {"energy": 19, "carbon": 0}},
            "2.0C": {2025: {"energy": 123, "carbon": 14}, 2030: {"energy": 98,  "carbon": 10}, 2035: {"energy": 75,  "carbon": 6},  2040: {"energy": 56,  "carbon": 3},  2050: {"energy": 27, "carbon": 1}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 175, "carbon": 38}, 2030: {"energy": 136, "carbon": 26}, 2035: {"energy": 102, "carbon": 16}, 2040: {"energy": 72,  "carbon": 9},  2050: {"energy": 34, "carbon": 2}},
            "2.0C": {2025: {"energy": 192, "carbon": 44}, 2030: {"energy": 156, "carbon": 32}, 2035: {"energy": 122, "carbon": 21}, 2040: {"energy": 90,  "carbon": 12}, 2050: {"energy": 48, "carbon": 4}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 162, "carbon": 50}, 2030: {"energy": 126, "carbon": 34}, 2035: {"energy": 94,  "carbon": 21}, 2040: {"energy": 66,  "carbon": 11}, 2050: {"energy": 30, "carbon": 2}},
            "2.0C": {2025: {"energy": 178, "carbon": 58}, 2030: {"energy": 143, "carbon": 41}, 2035: {"energy": 110, "carbon": 27}, 2040: {"energy": 81,  "carbon": 15}, 2050: {"energy": 42, "carbon": 4}},
        },
    },
    "logistics": {
        "DEU": {
            "1.5C": {2025: {"energy": 118, "carbon": 18}, 2030: {"energy": 90,  "carbon": 12}, 2035: {"energy": 66,  "carbon": 7},  2040: {"energy": 46,  "carbon": 4},  2050: {"energy": 21, "carbon": 1}},
            "2.0C": {2025: {"energy": 129, "carbon": 21}, 2030: {"energy": 103, "carbon": 15}, 2035: {"energy": 79,  "carbon": 9},  2040: {"energy": 59,  "carbon": 5},  2050: {"energy": 30, "carbon": 2}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 108, "carbon": 15}, 2030: {"energy": 83,  "carbon": 10}, 2035: {"energy": 61,  "carbon": 6},  2040: {"energy": 43,  "carbon": 3},  2050: {"energy": 20, "carbon": 1}},
            "2.0C": {2025: {"energy": 118, "carbon": 17}, 2030: {"energy": 95,  "carbon": 12}, 2035: {"energy": 74,  "carbon": 7},  2040: {"energy": 54,  "carbon": 4},  2050: {"energy": 27, "carbon": 2}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 100, "carbon": 11}, 2030: {"energy": 76,  "carbon": 7},  2035: {"energy": 56,  "carbon": 4},  2040: {"energy": 39,  "carbon": 2},  2050: {"energy": 17, "carbon": 0}},
            "2.0C": {2025: {"energy": 110, "carbon": 13}, 2030: {"energy": 88,  "carbon": 9},  2035: {"energy": 67,  "carbon": 5},  2040: {"energy": 49,  "carbon": 3},  2050: {"energy": 24, "carbon": 1}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 158, "carbon": 35}, 2030: {"energy": 123, "carbon": 24}, 2035: {"energy": 92,  "carbon": 15}, 2040: {"energy": 65,  "carbon": 8},  2050: {"energy": 30, "carbon": 2}},
            "2.0C": {2025: {"energy": 173, "carbon": 40}, 2030: {"energy": 140, "carbon": 29}, 2035: {"energy": 110, "carbon": 19}, 2040: {"energy": 82,  "carbon": 11}, 2050: {"energy": 43, "carbon": 3}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 146, "carbon": 45}, 2030: {"energy": 113, "carbon": 30}, 2035: {"energy": 84,  "carbon": 19}, 2040: {"energy": 59,  "carbon": 10}, 2050: {"energy": 27, "carbon": 2}},
            "2.0C": {2025: {"energy": 160, "carbon": 52}, 2030: {"energy": 128, "carbon": 37}, 2035: {"energy": 98,  "carbon": 24}, 2040: {"energy": 72,  "carbon": 14}, 2050: {"energy": 37, "carbon": 4}},
        },
    },
    "data_centre": {
        "DEU": {
            "1.5C": {2025: {"energy": 620, "carbon": 100}, 2030: {"energy": 490, "carbon": 68}, 2035: {"energy": 368, "carbon": 40}, 2040: {"energy": 258, "carbon": 22}, 2050: {"energy": 110, "carbon": 5}},
            "2.0C": {2025: {"energy": 680, "carbon": 116}, 2030: {"energy": 558, "carbon": 83}, 2035: {"energy": 440, "carbon": 52}, 2040: {"energy": 326, "carbon": 30}, 2050: {"energy": 155, "carbon": 9}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 580, "carbon": 84}, 2030: {"energy": 454, "carbon": 56}, 2035: {"energy": 336, "carbon": 32}, 2040: {"energy": 232, "carbon": 17}, 2050: {"energy": 96,  "carbon": 3}},
            "2.0C": {2025: {"energy": 636, "carbon": 98}, 2030: {"energy": 516, "carbon": 70}, 2035: {"energy": 400, "carbon": 43}, 2040: {"energy": 290, "carbon": 24}, 2050: {"energy": 136, "carbon": 6}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 540, "carbon": 64}, 2030: {"energy": 420, "carbon": 40}, 2035: {"energy": 308, "carbon": 22}, 2040: {"energy": 212, "carbon": 11}, 2050: {"energy": 86,  "carbon": 2}},
            "2.0C": {2025: {"energy": 592, "carbon": 76}, 2030: {"energy": 480, "carbon": 51}, 2035: {"energy": 368, "carbon": 30}, 2040: {"energy": 264, "carbon": 16}, 2050: {"energy": 122, "carbon": 4}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 820, "carbon": 186}, 2030: {"energy": 640, "carbon": 126}, 2035: {"energy": 472, "carbon": 80}, 2040: {"energy": 322, "carbon": 44}, 2050: {"energy": 135, "carbon": 9}},
            "2.0C": {2025: {"energy": 900, "carbon": 216}, 2030: {"energy": 728, "carbon": 154}, 2035: {"energy": 558, "carbon": 102}, 2040: {"energy": 398, "carbon": 59}, 2050: {"energy": 192, "carbon": 16}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 765, "carbon": 238}, 2030: {"energy": 596, "carbon": 160}, 2035: {"energy": 436, "carbon": 98}, 2040: {"energy": 294, "carbon": 54}, 2050: {"energy": 118, "carbon": 10}},
            "2.0C": {2025: {"energy": 840, "carbon": 278}, 2030: {"energy": 678, "carbon": 195}, 2035: {"energy": 516, "carbon": 127}, 2040: {"energy": 364, "carbon": 73}, 2050: {"energy": 166, "carbon": 17}},
        },
    },
    "healthcare": {
        "DEU": {
            "1.5C": {2025: {"energy": 340, "carbon": 55}, 2030: {"energy": 270, "carbon": 38}, 2035: {"energy": 206, "carbon": 24}, 2040: {"energy": 148, "carbon": 14}, 2050: {"energy": 72, "carbon": 4}},
            "2.0C": {2025: {"energy": 372, "carbon": 64}, 2030: {"energy": 308, "carbon": 46}, 2035: {"energy": 246, "carbon": 30}, 2040: {"energy": 188, "carbon": 18}, 2050: {"energy": 102, "carbon": 7}},
        },
        "GBR": {
            "1.5C": {2025: {"energy": 318, "carbon": 46}, 2030: {"energy": 250, "carbon": 30}, 2035: {"energy": 188, "carbon": 18}, 2040: {"energy": 132, "carbon": 10}, 2050: {"energy": 63, "carbon": 2}},
            "2.0C": {2025: {"energy": 348, "carbon": 55}, 2030: {"energy": 284, "carbon": 38}, 2035: {"energy": 223, "carbon": 23}, 2040: {"energy": 166, "carbon": 14}, 2050: {"energy": 89, "carbon": 5}},
        },
        "FRA": {
            "1.5C": {2025: {"energy": 298, "carbon": 35}, 2030: {"energy": 234, "carbon": 22}, 2035: {"energy": 175, "carbon": 13}, 2040: {"energy": 122, "carbon": 7},  2050: {"energy": 57, "carbon": 1}},
            "2.0C": {2025: {"energy": 326, "carbon": 42}, 2030: {"energy": 266, "carbon": 28}, 2035: {"energy": 208, "carbon": 17}, 2040: {"energy": 154, "carbon": 10}, 2050: {"energy": 80, "carbon": 3}},
        },
        "USA": {
            "1.5C": {2025: {"energy": 465, "carbon": 105}, 2030: {"energy": 368, "carbon": 72}, 2035: {"energy": 278, "carbon": 46}, 2040: {"energy": 198, "carbon": 27}, 2050: {"energy": 93, "carbon": 6}},
            "2.0C": {2025: {"energy": 510, "carbon": 122}, 2030: {"energy": 418, "carbon": 87}, 2035: {"energy": 328, "carbon": 57}, 2040: {"energy": 244, "carbon": 34}, 2050: {"energy": 130, "carbon": 11}},
        },
        "AUS": {
            "1.5C": {2025: {"energy": 435, "carbon": 135}, 2030: {"energy": 340, "carbon": 90}, 2035: {"energy": 252, "carbon": 56}, 2040: {"energy": 175, "carbon": 30}, 2050: {"energy": 80, "carbon": 6}},
            "2.0C": {2025: {"energy": 478, "carbon": 158}, 2030: {"energy": 386, "carbon": 110}, 2035: {"energy": 298, "carbon": 72}, 2040: {"energy": 218, "carbon": 41}, 2050: {"energy": 112, "carbon": 10}},
        },
    },
}

# EPC thresholds — energy intensity upper bound (kWh/m²/yr) per rating band
# Source: EU EPBD recast 2024, UK DECs, ADEME DPE 2021, DOE 2023, NABERS mapping
EPC_THRESHOLDS: Dict[str, Dict[str, float]] = {
    "DEU": {"A": 50,  "B": 100, "C": 150, "D": 200, "E": 250, "F": 320, "G": 9999},
    "GBR": {"A": 50,  "B": 100, "C": 155, "D": 210, "E": 270, "F": 340, "G": 9999},
    "FRA": {"A": 70,  "B": 110, "C": 180, "D": 250, "E": 330, "F": 420, "G": 9999},
    "USA": {"A": 80,  "B": 140, "C": 210, "D": 290, "E": 380, "F": 480, "G": 9999},
    "AUS": {"A": 90,  "B": 155, "C": 230, "D": 320, "E": 420, "F": 530, "G": 9999},
}

EPC_RATING_ORDER = ["A", "B", "C", "D", "E", "F", "G"]

# Retrofit measures reference data
RETROFIT_MEASURES: Dict[str, Dict[str, Any]] = {
    "wall_insulation":    {"energy_saving_pct": 18, "carbon_saving_pct": 18, "capex_eur_m2": 85,  "lifetime_yr": 30, "payback_yr": 14},
    "roof_insulation":    {"energy_saving_pct": 12, "carbon_saving_pct": 12, "capex_eur_m2": 45,  "lifetime_yr": 30, "payback_yr": 10},
    "triple_glazing":     {"energy_saving_pct": 10, "carbon_saving_pct": 10, "capex_eur_m2": 120, "lifetime_yr": 25, "payback_yr": 18},
    "hvac_upgrade":       {"energy_saving_pct": 22, "carbon_saving_pct": 22, "capex_eur_m2": 95,  "lifetime_yr": 20, "payback_yr": 12},
    "heat_pump_air":      {"energy_saving_pct": 30, "carbon_saving_pct": 45, "capex_eur_m2": 110, "lifetime_yr": 20, "payback_yr": 10},
    "heat_pump_ground":   {"energy_saving_pct": 38, "carbon_saving_pct": 55, "capex_eur_m2": 185, "lifetime_yr": 25, "payback_yr": 14},
    "solar_pv":           {"energy_saving_pct": 20, "carbon_saving_pct": 25, "capex_eur_m2": 130, "lifetime_yr": 25, "payback_yr": 11},
    "led_lighting":       {"energy_saving_pct": 8,  "carbon_saving_pct": 8,  "capex_eur_m2": 18,  "lifetime_yr": 15, "payback_yr": 4},
    "bems":               {"energy_saving_pct": 15, "carbon_saving_pct": 15, "capex_eur_m2": 35,  "lifetime_yr": 15, "payback_yr": 6},
    "airtightness":       {"energy_saving_pct": 8,  "carbon_saving_pct": 8,  "capex_eur_m2": 25,  "lifetime_yr": 20, "payback_yr": 8},
    "solar_thermal":      {"energy_saving_pct": 12, "carbon_saving_pct": 18, "capex_eur_m2": 70,  "lifetime_yr": 20, "payback_yr": 12},
    "ev_charging":        {"energy_saving_pct": 0,  "carbon_saving_pct": 2,  "capex_eur_m2": 15,  "lifetime_yr": 15, "payback_yr": 20},
}

# Green premium: premium_pct = rent premium over non-certified; value_uplift_pct = capital value uplift
# Keyed by building_type → country_iso3 → {premium_pct, value_uplift_pct}
GREEN_PREMIUM: Dict[str, Dict[str, Dict[str, float]]] = {
    "office": {
        "DEU": {"premium_pct": 8.5,  "value_uplift_pct": 12.0},
        "GBR": {"premium_pct": 9.0,  "value_uplift_pct": 13.5},
        "FRA": {"premium_pct": 7.5,  "value_uplift_pct": 11.0},
        "USA": {"premium_pct": 11.0, "value_uplift_pct": 15.0},
        "AUS": {"premium_pct": 10.5, "value_uplift_pct": 14.0},
    },
    "retail": {
        "DEU": {"premium_pct": 5.0,  "value_uplift_pct": 7.5},
        "GBR": {"premium_pct": 5.5,  "value_uplift_pct": 8.0},
        "FRA": {"premium_pct": 4.5,  "value_uplift_pct": 6.5},
        "USA": {"premium_pct": 6.5,  "value_uplift_pct": 9.0},
        "AUS": {"premium_pct": 6.0,  "value_uplift_pct": 8.5},
    },
    "residential_apartment": {
        "DEU": {"premium_pct": 6.0,  "value_uplift_pct": 9.0},
        "GBR": {"premium_pct": 6.5,  "value_uplift_pct": 9.5},
        "FRA": {"premium_pct": 5.5,  "value_uplift_pct": 8.0},
        "USA": {"premium_pct": 7.5,  "value_uplift_pct": 11.0},
        "AUS": {"premium_pct": 7.0,  "value_uplift_pct": 10.0},
    },
    "hotel": {
        "DEU": {"premium_pct": 7.0,  "value_uplift_pct": 10.5},
        "GBR": {"premium_pct": 7.5,  "value_uplift_pct": 11.0},
        "FRA": {"premium_pct": 6.5,  "value_uplift_pct": 9.5},
        "USA": {"premium_pct": 9.0,  "value_uplift_pct": 13.0},
        "AUS": {"premium_pct": 8.5,  "value_uplift_pct": 12.0},
    },
    "industrial": {
        "DEU": {"premium_pct": 4.0,  "value_uplift_pct": 6.0},
        "GBR": {"premium_pct": 4.5,  "value_uplift_pct": 6.5},
        "FRA": {"premium_pct": 3.5,  "value_uplift_pct": 5.5},
        "USA": {"premium_pct": 5.0,  "value_uplift_pct": 7.5},
        "AUS": {"premium_pct": 4.8,  "value_uplift_pct": 7.0},
    },
    "logistics": {
        "DEU": {"premium_pct": 3.5,  "value_uplift_pct": 5.5},
        "GBR": {"premium_pct": 4.0,  "value_uplift_pct": 6.0},
        "FRA": {"premium_pct": 3.0,  "value_uplift_pct": 5.0},
        "USA": {"premium_pct": 4.5,  "value_uplift_pct": 7.0},
        "AUS": {"premium_pct": 4.2,  "value_uplift_pct": 6.2},
    },
    "data_centre": {
        "DEU": {"premium_pct": 10.0, "value_uplift_pct": 14.0},
        "GBR": {"premium_pct": 10.5, "value_uplift_pct": 15.0},
        "FRA": {"premium_pct": 9.0,  "value_uplift_pct": 12.5},
        "USA": {"premium_pct": 12.0, "value_uplift_pct": 16.5},
        "AUS": {"premium_pct": 11.5, "value_uplift_pct": 15.5},
    },
    "healthcare": {
        "DEU": {"premium_pct": 5.5,  "value_uplift_pct": 8.0},
        "GBR": {"premium_pct": 6.0,  "value_uplift_pct": 8.5},
        "FRA": {"premium_pct": 5.0,  "value_uplift_pct": 7.5},
        "USA": {"premium_pct": 7.0,  "value_uplift_pct": 10.0},
        "AUS": {"premium_pct": 6.5,  "value_uplift_pct": 9.5},
    },
}

# GRESB aspects: max scores per aspect (total 100)
GRESB_ASPECTS: Dict[str, Dict[str, Any]] = {
    "Management":    {"max_score": 15, "description": "ESG strategy, policies, targets, senior accountability"},
    "Policy":        {"max_score": 20, "description": "Energy, water, waste, GHG, health & well-being policies"},
    "Reporting":     {"max_score": 25, "description": "Data coverage, quality, third-party assurance, disclosure"},
    "Risk":          {"max_score": 20, "description": "Climate physical + transition risk identification & integration"},
    "Opportunities": {"max_score": 20, "description": "Green certifications, efficiency investments, tenant engagement"},
}

# Brown discount adjustment by EPC rating (relative to A/B)
BROWN_DISCOUNT: Dict[str, float] = {
    "A": 0.0, "B": 0.0, "C": 2.0, "D": 5.0, "E": 9.0, "F": 14.0, "G": 20.0
}

# ---------------------------------------------------------------------------
# Pydantic Models
# ---------------------------------------------------------------------------

class CRREMAssessRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    building_type: str = Field(..., description="One of: office, retail, residential_apartment, hotel, industrial, logistics, data_centre, healthcare")
    country_iso3: str = Field(..., description="ISO-3 country code: DEU, GBR, FRA, USA, AUS")
    current_energy_intensity: float = Field(..., description="Actual energy use intensity kWh/m²/yr")
    current_carbon_intensity: float = Field(..., description="Actual carbon intensity kgCO2/m²/yr")
    floor_area_m2: float = Field(..., description="Gross floor area m²")
    asset_value_eur: Optional[float] = Field(None, description="Current asset value EUR (for financial risk)")
    assessment_year: int = Field(2025, description="Base year for assessment")


class RetrofitPlanRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    building_type: str
    country_iso3: str
    current_energy_intensity: float = Field(..., description="kWh/m²/yr")
    floor_area_m2: float
    annual_energy_cost_eur_m2: float = Field(12.0, description="Current energy cost EUR/m²/yr")
    annual_carbon_cost_eur_tonne: float = Field(65.0, description="Carbon price EUR/tCO2e")
    target_epc: str = Field("B", description="Target EPC rating A-G")
    discount_rate: float = Field(0.08, description="NPV discount rate (default 8%)")


class GreenPremiumRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    building_type: str
    country_iso3: str
    epc_rating: str = Field(..., description="Current EPC rating A-G")
    asset_value_eur: Optional[float] = None
    annual_rent_eur: Optional[float] = None


class GRESBRequest(BaseModel):
    model_config = {"protected_namespaces": ()}

    entity_name: str = Field("", description="Fund or entity name")
    aspect_scores: Dict[str, float] = Field(
        ...,
        description="Dict of aspect → raw score achieved. Keys: Management, Policy, Reporting, Risk, Opportunities"
    )
    peer_count: int = Field(50, description="Number of peers in comparison universe")


# ---------------------------------------------------------------------------
# Helper utilities
# ---------------------------------------------------------------------------

def _interpolate_pathway(pathway_years: Dict[int, Dict[str, float]], year: int, metric: str) -> float:
    """Linear interpolation between two pathway waypoints for a given year."""
    sorted_years = sorted(pathway_years.keys())
    if year <= sorted_years[0]:
        return pathway_years[sorted_years[0]][metric]
    if year >= sorted_years[-1]:
        return pathway_years[sorted_years[-1]][metric]
    for i in range(len(sorted_years) - 1):
        y0, y1 = sorted_years[i], sorted_years[i + 1]
        if y0 <= year <= y1:
            t = (year - y0) / (y1 - y0)
            return pathway_years[y0][metric] + t * (pathway_years[y1][metric] - pathway_years[y0][metric])
    return pathway_years[sorted_years[-1]][metric]


def _find_stranding_year(
    current_intensity: float,
    pathway: Dict[int, Dict[str, float]],
    metric: str,
    start_year: int,
    end_year: int = 2055,
) -> Optional[int]:
    """Find the first year where the current (static) intensity exceeds the pathway target."""
    # If already stranded at start_year, return start_year
    threshold_now = _interpolate_pathway(pathway, start_year, metric)
    if current_intensity > threshold_now:
        return start_year
    for yr in range(start_year, end_year + 1):
        threshold = _interpolate_pathway(pathway, yr, metric)
        if current_intensity > threshold:
            return yr
    return None  # not stranded within horizon


def _get_epc_rating(energy_intensity: float, country_iso3: str) -> str:
    thresholds = EPC_THRESHOLDS.get(country_iso3, EPC_THRESHOLDS["DEU"])
    for rating in EPC_RATING_ORDER:
        if energy_intensity <= thresholds[rating]:
            return rating
    return "G"


def _npv_measure(
    annual_saving_eur: float,
    capex_eur: float,
    lifetime_yr: int,
    discount_rate: float,
) -> float:
    """NPV of a retrofit measure over its lifetime."""
    if discount_rate <= 0:
        pv = annual_saving_eur * lifetime_yr
    else:
        pv = annual_saving_eur * (1 - (1 + discount_rate) ** (-lifetime_yr)) / discount_rate
    return pv - capex_eur


# ---------------------------------------------------------------------------
# Core engine functions
# ---------------------------------------------------------------------------

def assess_crrem_alignment(asset_data: dict) -> dict:
    """
    Assess CRREM pathway alignment for a real estate asset.

    Returns: gap%, stranding year (1.5C and 2C), risk tier, and pathway context.
    """
    building_type = asset_data.get("building_type", "office")
    country = asset_data.get("country_iso3", "DEU")
    current_ei = float(asset_data.get("current_energy_intensity", 200))
    current_ci = float(asset_data.get("current_carbon_intensity", 30))
    floor_area = float(asset_data.get("floor_area_m2", 1000))
    asset_value = asset_data.get("asset_value_eur")
    base_year = int(asset_data.get("assessment_year", 2025))

    # Validate inputs
    if building_type not in CRREM_PATHWAYS:
        building_type = "office"
    if country not in CRREM_PATHWAYS.get(building_type, {}):
        country = "DEU"

    bt_data = CRREM_PATHWAYS[building_type][country]

    results: Dict[str, Any] = {
        "building_type": building_type,
        "country_iso3": country,
        "floor_area_m2": floor_area,
        "current_energy_intensity_kwh_m2": current_ei,
        "current_carbon_intensity_kgco2_m2": current_ci,
        "current_epc_rating": _get_epc_rating(current_ei, country),
        "scenarios": {},
    }

    for scenario_key in ("1.5C", "2.0C"):
        pathway = bt_data[scenario_key]

        pathway_ei_now = _interpolate_pathway(pathway, base_year, "energy")
        pathway_ci_now = _interpolate_pathway(pathway, base_year, "carbon")

        ei_gap_pct = ((current_ei - pathway_ei_now) / pathway_ei_now * 100) if pathway_ei_now > 0 else 0.0
        ci_gap_pct = ((current_ci - pathway_ci_now) / pathway_ci_now * 100) if pathway_ci_now > 0 else 0.0

        stranding_yr_ei = _find_stranding_year(current_ei, pathway, "energy", base_year)
        stranding_yr_ci = _find_stranding_year(current_ci, pathway, "carbon", base_year)

        # Effective stranding year = earlier of energy or carbon stranding
        if stranding_yr_ei is not None and stranding_yr_ci is not None:
            stranding_year = min(stranding_yr_ei, stranding_yr_ci)
        elif stranding_yr_ei is not None:
            stranding_year = stranding_yr_ei
        elif stranding_yr_ci is not None:
            stranding_year = stranding_yr_ci
        else:
            stranding_year = None

        # Risk tier based on years to stranding
        if stranding_year is not None:
            yrs_to_strand = stranding_year - base_year
            if yrs_to_strand <= 0:
                risk_tier = "immediate"
            elif yrs_to_strand <= 5:
                risk_tier = "near_term"
            elif yrs_to_strand <= 15:
                risk_tier = "medium_term"
            else:
                risk_tier = "low"
        else:
            risk_tier = "low"

        # Financial risk estimate
        financial_risk: Optional[Dict[str, float]] = None
        if asset_value and stranding_year is not None:
            yrs = max(0, stranding_year - base_year)
            discount = 0.08
            haircut_pct = min(40.0, 40.0 * (1 - yrs / 25.0)) if yrs < 25 else 0.0
            npv_risk = asset_value * haircut_pct / 100
            financial_risk = {
                "estimated_value_haircut_pct": round(haircut_pct, 1),
                "estimated_value_at_risk_eur": round(npv_risk, 0),
            }

        results["scenarios"][scenario_key] = {
            "pathway_energy_intensity_now": round(pathway_ei_now, 1),
            "pathway_carbon_intensity_now": round(pathway_ci_now, 1),
            "energy_gap_pct": round(ei_gap_pct, 1),
            "carbon_gap_pct": round(ci_gap_pct, 1),
            "stranding_year_energy": stranding_yr_ei,
            "stranding_year_carbon": stranding_yr_ci,
            "effective_stranding_year": stranding_year,
            "risk_tier": risk_tier,
            "already_aligned": stranding_year is None,
            "financial_risk": financial_risk,
        }

    # Determine overall risk tier (use 1.5C as conservative)
    overall_tier = results["scenarios"]["1.5C"]["risk_tier"]
    results["overall_risk_tier"] = overall_tier
    results["pathway_data"] = {
        yr: {
            "1.5C": bt_data["1.5C"].get(yr),
            "2.0C": bt_data["2.0C"].get(yr),
        }
        for yr in [2025, 2030, 2035, 2040, 2050]
    }
    return results


def calculate_retrofit_plan(asset_data: dict, target_epc: str = "B") -> dict:
    """
    Rank retrofit measures by NPV and produce a sequenced capex plan to reach target EPC.

    Returns: ranked measures, total capex, total annual savings, simple payback.
    """
    building_type = asset_data.get("building_type", "office")
    country = asset_data.get("country_iso3", "DEU")
    current_ei = float(asset_data.get("current_energy_intensity", 200))
    floor_area = float(asset_data.get("floor_area_m2", 1000))
    energy_cost = float(asset_data.get("annual_energy_cost_eur_m2", 12.0))
    carbon_price = float(asset_data.get("annual_carbon_cost_eur_tonne", 65.0))
    discount_rate = float(asset_data.get("discount_rate", 0.08))
    target_epc = (target_epc or "B").upper()

    if country not in EPC_THRESHOLDS:
        country = "DEU"

    target_ei = EPC_THRESHOLDS[country].get(target_epc, 100)
    current_rating = _get_epc_rating(current_ei, country)

    # Compute NPV for each measure
    ranked = []
    for measure_id, spec in RETROFIT_MEASURES.items():
        energy_saved_kwh_m2 = current_ei * spec["energy_saving_pct"] / 100
        annual_energy_saving_eur = energy_saved_kwh_m2 * energy_cost * floor_area / 1000  # energy_cost per kWh approx
        # rough carbon saving: 0.2 kgCO2/kWh grid factor
        carbon_saved_tonne = energy_saved_kwh_m2 * 0.2 * floor_area / 1000
        annual_carbon_saving_eur = carbon_saved_tonne * carbon_price
        total_annual_saving = annual_energy_saving_eur + annual_carbon_saving_eur
        capex_total = spec["capex_eur_m2"] * floor_area
        npv = _npv_measure(total_annual_saving, capex_total, spec["lifetime_yr"], discount_rate)
        ranked.append({
            "measure_id": measure_id,
            "energy_saving_pct": spec["energy_saving_pct"],
            "carbon_saving_pct": spec["carbon_saving_pct"],
            "capex_eur": round(capex_total, 0),
            "capex_eur_m2": spec["capex_eur_m2"],
            "annual_saving_eur": round(total_annual_saving, 0),
            "lifetime_yr": spec["lifetime_yr"],
            "simple_payback_yr": spec["payback_yr"],
            "npv_eur": round(npv, 0),
        })

    # Sort by NPV descending
    ranked.sort(key=lambda x: x["npv_eur"], reverse=True)

    # Greedy selection until target EPC is met
    residual_ei = current_ei
    selected: List[dict] = []
    for m in ranked:
        if residual_ei <= target_ei:
            break
        reduction = residual_ei * m["energy_saving_pct"] / 100
        residual_ei -= reduction
        selected.append(m)

    total_capex = sum(m["capex_eur"] for m in selected)
    total_annual_saving = sum(m["annual_saving_eur"] for m in selected)
    simple_payback = round(total_capex / total_annual_saving, 1) if total_annual_saving > 0 else None
    projected_ei = max(residual_ei, 0)
    projected_rating = _get_epc_rating(projected_ei, country)

    return {
        "building_type": building_type,
        "country_iso3": country,
        "floor_area_m2": floor_area,
        "current_epc_rating": current_rating,
        "target_epc_rating": target_epc,
        "projected_epc_rating": projected_rating,
        "current_energy_intensity": round(current_ei, 1),
        "projected_energy_intensity": round(projected_ei, 1),
        "target_energy_intensity": target_ei,
        "target_achieved": projected_ei <= target_ei,
        "measures_all_ranked": ranked,
        "measures_selected": selected,
        "total_capex_eur": round(total_capex, 0),
        "total_annual_saving_eur": round(total_annual_saving, 0),
        "simple_payback_yr": simple_payback,
        "discount_rate_used": discount_rate,
    }


def calculate_green_premium(building_type: str, country_iso3: str, epc_rating: str) -> dict:
    """
    Return green certification premium and brown discount risk for an asset.
    """
    epc_rating = (epc_rating or "D").upper()
    if epc_rating not in EPC_RATING_ORDER:
        epc_rating = "D"

    bt = building_type if building_type in GREEN_PREMIUM else "office"
    country = country_iso3 if country_iso3 in GREEN_PREMIUM.get(bt, {}) else "DEU"
    premium_data = GREEN_PREMIUM[bt][country]

    # Scale premium by EPC: A/B gets full premium, C gets 60%, D gets 20%, E/F/G gets 0%
    epc_scale = {"A": 1.0, "B": 0.9, "C": 0.6, "D": 0.2, "E": 0.0, "F": 0.0, "G": 0.0}
    scale = epc_scale.get(epc_rating, 0.0)

    actual_premium_pct = round(premium_data["premium_pct"] * scale, 2)
    actual_uplift_pct = round(premium_data["value_uplift_pct"] * scale, 2)
    brown_discount_pct = BROWN_DISCOUNT.get(epc_rating, 0.0)

    # Financing access: lower EPC → reduced access to green finance
    financing_access = "full" if epc_rating in ("A", "B") else (
        "partial" if epc_rating == "C" else "restricted"
    )

    return {
        "building_type": bt,
        "country_iso3": country,
        "epc_rating": epc_rating,
        "rent_premium_pct": actual_premium_pct,
        "value_uplift_pct": actual_uplift_pct,
        "brown_discount_risk_pct": brown_discount_pct,
        "green_finance_access": financing_access,
        "market_benchmark": {
            "full_premium_pct": premium_data["premium_pct"],
            "full_value_uplift_pct": premium_data["value_uplift_pct"],
        },
        "note": "Premium sourced from JLL / CBRE green premium studies 2022-2024; brown discount from RICS 2023.",
    }


def assess_gresb_score(aspect_scores: dict) -> dict:
    """
    Calculate GRESB score and peer positioning.
    """
    total_score = 0.0
    aspect_results = {}
    total_max = sum(a["max_score"] for a in GRESB_ASPECTS.values())

    for aspect, spec in GRESB_ASPECTS.items():
        raw = float(aspect_scores.get(aspect, 0))
        capped = min(raw, spec["max_score"])
        pct = round(capped / spec["max_score"] * 100, 1)
        total_score += capped
        aspect_results[aspect] = {
            "score_achieved": round(capped, 1),
            "max_score": spec["max_score"],
            "score_pct": pct,
            "description": spec["description"],
            "gap_to_max": round(spec["max_score"] - capped, 1),
        }

    total_pct = round(total_score / total_max * 100, 1)

    # Star rating: 5-star > 75%, 4-star 60-75%, 3-star 45-60%, 2-star 30-45%, 1-star <30%
    if total_pct >= 75:
        star_rating = 5
        gresb_grade = "5-Star Leader"
    elif total_pct >= 60:
        star_rating = 4
        gresb_grade = "4-Star Performer"
    elif total_pct >= 45:
        star_rating = 3
        gresb_grade = "3-Star Achiever"
    elif total_pct >= 30:
        star_rating = 2
        gresb_grade = "2-Star Developing"
    else:
        star_rating = 1
        gresb_grade = "1-Star Emerging"

    # Identify top 3 improvement areas by gap
    sorted_aspects = sorted(aspect_results.items(), key=lambda x: x[1]["gap_to_max"], reverse=True)
    improvement_priorities = [{"aspect": k, "gap_points": v["gap_to_max"]} for k, v in sorted_aspects[:3]]

    return {
        "total_score": round(total_score, 1),
        "total_max_score": total_max,
        "total_pct": total_pct,
        "star_rating": star_rating,
        "gresb_grade": gresb_grade,
        "aspects": aspect_results,
        "improvement_priorities": improvement_priorities,
        "benchmark_context": {
            "global_average_pct": 61.0,
            "top_quartile_pct": 78.0,
            "bottom_quartile_pct": 42.0,
        },
        "disclosure_framework": "GRESB Real Estate Assessment 2024",
    }
