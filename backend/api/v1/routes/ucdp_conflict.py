"""UCDP Conflict Nowcast -- Uppsala Conflict Data Program GED events proxy.

DATA STATUS (verified 2026-07-05):
  - UCDP's GED (Georeferenced Event Dataset) API base
    `https://ucdpapi.pcr.uu.se/api/gedevents/<version>` now REQUIRES a free
    access token as of this writing. A keyless probe --
    `GET https://ucdpapi.pcr.uu.se/api/gedevents/24.1?pagesize=1` -- returns
    HTTP 401 with body "API token required. Add header:
    x-ucdp-access-token: <your-token>". This is a change from UCDP's
    historically fully-keyless API (older integrations assuming no auth will
    break).
  - REGISTRATION PROCESS (per ucdp.uu.se/apidocs/, checked 2026-07-05):
    there is NO self-service signup form and NO automated token issuance.
    Access is granted by emailing the API maintainer -- the contact address
    published on the apidocs page at time of writing is
    mertcan.yilmaz@pcr.uu.se -- with (1) full name + institutional
    affiliation, (2) role (researcher / student / journalist / analyst /
    company), and (3) a short description of the intended research project
    or data use. Requests are reviewed manually; stated turnaround is
    "3-5 working days". RE-VERIFY the contact address and process at
    https://ucdp.uu.se/apidocs/ before emailing -- it is maintained by a
    named individual at Uppsala University's Dept. of Peace and Conflict
    Research (PCR) and could change without notice. This module could not
    complete the token request interactively (no human affiliation/project
    to submit), so it ships in seeded-fallback mode by default.
  - Once a token is granted, it is sent as an HTTP header on every request:
    `x-ucdp-access-token: <token>`. Documented rate limit: 5,000 req/day
    (failed requests count against the limit too).
  - Until UCDP_API_TOKEN is set, this module serves a small, clearly labeled
    seeded sample: (a) a qualitative conflict-status assessment for a set of
    real countries (most of which correctly have NO active UCDP-codeable
    armed conflict -- "none" is itself an honest finding, not a gap), and
    (b) a short list of REAL, well-documented notable incidents for the
    handful of countries with genuinely active conflicts circa 2022-2025.
    These are NOT verbatim UCDP GED row-level records (which are
    village-geocoded, dated to the day, and carry sourced low/best/high
    fatality estimates) -- they are analyst-compiled situational summaries
    from public reporting. Set UCDP_API_TOKEN for the real, monthly-updated,
    village-geocoded feed.

Endpoints:
  GET /api/v1/ucdp/status            -- token/config status + registration info
  GET /api/v1/ucdp/events            -- events for a country (live GED proxy, or seeded)
  GET /api/v1/ucdp/country-summary   -- conflict nowcast summary for one country
"""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/v1/ucdp", tags=["UCDP Conflict Data"])

UCDP_API_TOKEN_ENV = "UCDP_API_TOKEN"
UCDP_API_VERSION_ENV = "UCDP_API_VERSION"
DEFAULT_VERSION = "24.1"  # verified: this exact path returns 401-without-token (endpoint exists)
UCDP_BASE = "https://ucdpapi.pcr.uu.se/api/gedevents"
_TIMEOUT = 20

REGISTRATION_INFO = {
    "self_service_signup": False,
    "process": (
        "Email the API maintainer with (1) full name + institutional affiliation, "
        "(2) role, (3) a brief description of the intended research project/use. "
        "Requests are reviewed manually, ~3-5 working days turnaround."
    ),
    "contact_email_as_of_check": "mertcan.yilmaz@pcr.uu.se",
    "checked_at": "2026-07-05",
    "docs_url": "https://ucdp.uu.se/apidocs/",
    "header_name": "x-ucdp-access-token",
    "documented_rate_limit": "5,000 requests/day (failed requests count)",
    "caveat": (
        "Re-verify the contact address and process at ucdp.uu.se/apidocs/ before "
        "emailing -- it is maintained by a named individual and could change."
    ),
}

# ---------------------------------------------------------------------------
# Seeded fallback -- qualitative, honest conflict-status assessment.
# Countries reused from the sovereign-corporate-bridge BRIDGE_COUNTRIES list
# (iso2 -> iso3) plus a handful of additional, real, well-documented active
# conflict situations that are NOT in that list (useful for the general
# /events and /country-summary lookups beyond the bridge's 37 countries).
# tier: "none" | "low" | "moderate" | "active"
# ---------------------------------------------------------------------------
ISO2_TO_ISO3 = {
    "US": "USA", "GB": "GBR", "DE": "DEU", "FR": "FRA", "JP": "JPN", "CA": "CAN",
    "IT": "ITA", "NL": "NLD", "ES": "ESP", "SE": "SWE", "NO": "NOR", "DK": "DNK",
    "FI": "FIN", "PL": "POL", "CZ": "CZE", "HU": "HUN", "RO": "ROU", "PT": "PRT",
    "GR": "GRC", "AT": "AUT", "BE": "BEL", "CH": "CHE", "AU": "AUS", "NZ": "NZL",
    "CN": "CHN", "IN": "IND", "BR": "BRA", "ZA": "ZAF", "MX": "MEX", "AR": "ARG",
    "TR": "TUR", "ID": "IDN", "SG": "SGP", "KR": "KOR", "SA": "SAU", "AE": "ARE",
    "EG": "EGY", "NG": "NGA", "KE": "KEN",
}
ISO3_TO_ISO2 = {v: k for k, v in ISO2_TO_ISO3.items()}

CONFLICT_STATUS: Dict[str, Dict[str, Any]] = {
    # ── Bridge-list countries with a genuine documented conflict/insurgency ──
    "IND": {"country_name": "India", "tier": "moderate",
            "summary": "Long-running Naxalite-Maoist insurgency (low-intensity, multi-state, decades-old) "
                       "plus intermittent ethnic violence in Manipur since May 2023.",
            "actors": ["Communist Party of India (Maoist)", "Indian security forces", "Meitei/Kuki communal militias"],
            "since": "1967 (Naxalite); 2023-05 (Manipur)"},
    "TUR": {"country_name": "Turkey", "tier": "low",
            "summary": "PKK-Turkey conflict (active since 1984) is de-escalating: PKK announced a "
                       "dissolution/disarmament process in 2025 following Abdullah Ocalan's call for the group "
                       "to disband, per public reporting -- status fluid, verify current phase.",
            "actors": ["PKK", "Turkish Armed Forces"], "since": "1984; de-escalation from 2025"},
    "IDN": {"country_name": "Indonesia", "tier": "low",
            "summary": "Low-intensity Papua conflict: West Papua National Liberation Army (TPNPB/OPM) "
                       "vs Indonesian security forces, ongoing sporadic clashes.",
            "actors": ["TPNPB/OPM", "Indonesian security forces (TNI/POLRI)"], "since": "1960s, ongoing"},
    "SAU": {"country_name": "Saudi Arabia", "tier": "none",
            "summary": "No active domestic UCDP-codeable armed conflict; regional involvement as part of "
                       "the Saudi-led coalition in the Yemen war, reduced since the 2022 UN-mediated truce.",
            "actors": [], "since": None},
    "EGY": {"country_name": "Egypt", "tier": "low",
            "summary": "Sinai insurgency (Egyptian security forces vs ISIS-Sinai Province / Wilayat Sinai), "
                       "significantly diminished in intensity since ~2022.",
            "actors": ["ISIS-Sinai Province", "Egyptian Armed Forces"], "since": "2013, reduced from 2022"},
    "NGA": {"country_name": "Nigeria", "tier": "active",
            "summary": "Boko Haram / ISWAP insurgency in the northeast (Borno/Yobe/Adamawa states) remains "
                       "active; compounded by recurrent farmer-herder violence in the Middle Belt.",
            "actors": ["Boko Haram", "ISWAP", "Nigerian Armed Forces"], "since": "2009, ongoing"},
    "KEN": {"country_name": "Kenya", "tier": "low",
            "summary": "Periodic cross-border al-Shabaab attacks originating from Somalia, concentrated "
                       "near the Kenya-Somalia border counties.",
            "actors": ["al-Shabaab", "Kenya Defence Forces"], "since": "2011, ongoing (periodic)"},
    "BRA": {"country_name": "Brazil", "tier": "none",
            "summary": "No active UCDP state-based armed conflict; organized-crime/cartel violence is high "
                       "but falls outside the UCDP state-based-conflict definition.",
            "actors": [], "since": None},
    "MEX": {"country_name": "Mexico", "tier": "none",
            "summary": "No UCDP state-based armed conflict; drug-cartel violence drives very high homicide "
                       "rates but is tracked (where coded at all) under non-state/organized-violence "
                       "categories rather than state-based conflict.",
            "actors": [], "since": None},
    "CHN": {"country_name": "China", "tier": "none",
            "summary": "No UCDP-coded active armed conflict domestically as of this writing.",
            "actors": [], "since": None},
    # All remaining bridge countries (US, GB, DE, FR, JP, CA, IT, NL, ES, SE, NO,
    # DK, FI, PL, CZ, HU, RO, PT, GR, AT, BE, CH, AU, NZ, ZA, AR, SG, KR, AE) have
    # no active UCDP-codeable armed conflict -- filled in below programmatically.
    # ── Additional real, well-documented notable conflicts (outside the bridge's
    #    37-country list) -- included so /events and /country-summary are useful
    #    for a general country query, not just the bridge's default holdings. ──
    "UKR": {"country_name": "Ukraine", "tier": "active",
            "summary": "Russia's full-scale invasion of Ukraine, launched 24 Feb 2022, remains the largest "
                       "active state-based (interstate) armed conflict by UCDP's own reporting.",
            "actors": ["Russian Armed Forces", "Ukrainian Armed Forces"], "since": "2022-02"},
    "PSE": {"country_name": "Palestine / Gaza", "tier": "active",
            "summary": "Israel-Hamas war following the 7 Oct 2023 Hamas-led attack on Israel; a phased "
                       "ceasefire/hostage-release framework was reached in Jan 2025, but implementation and "
                       "the security situation have remained fluid through 2025 -- verify current phase.",
            "actors": ["Hamas", "Israel Defense Forces"], "since": "2023-10"},
    "SDN": {"country_name": "Sudan", "tier": "active",
            "summary": "Sudanese Armed Forces vs Rapid Support Forces (RSF) civil war, erupted 15 Apr 2023 "
                       "in Khartoum; RSF siege of El Fasher (North Darfur) was a major front through 2024-2025. "
                       "One of the world's largest displacement crises.",
            "actors": ["Sudanese Armed Forces (SAF)", "Rapid Support Forces (RSF)"], "since": "2023-04"},
    "MMR": {"country_name": "Myanmar", "tier": "active",
            "summary": "Civil war following the Feb 2021 military coup; the Three Brotherhood Alliance's "
                       "'Operation 1027' (Oct 2023) marked a major escalation against the Tatmadaw junta.",
            "actors": ["Myanmar military (Tatmadaw)", "People's Defence Forces (PDF)",
                       "Ethnic Armed Organizations (incl. Three Brotherhood Alliance)"], "since": "2021-02"},
    "SYR": {"country_name": "Syria", "tier": "moderate",
            "summary": "Syrian civil war (since 2011) saw a major turning point when the Assad regime fell "
                       "in Dec 2024 following an HTS-led offensive; post-transition security dynamics remain "
                       "unsettled with localized clashes -- verify current status.",
            "actors": ["Hay'at Tahrir al-Sham (HTS)", "post-Assad transitional forces", "residual armed factions"],
            "since": "2011; regime change 2024-12"},
    "YEM": {"country_name": "Yemen", "tier": "moderate",
            "summary": "Houthi movement vs the internationally recognized government / Saudi-led coalition, "
                       "active since 2014-15; a UN-mediated truce (Apr 2022) reduced large-scale fighting, "
                       "though Houthi Red Sea shipping attacks (from Nov 2023, in the Gaza-war context) kept "
                       "the conflict internationally salient.",
            "actors": ["Houthi movement (Ansar Allah)", "Yemeni government", "Saudi-led coalition"], "since": "2014-15"},
    "COD": {"country_name": "Democratic Republic of the Congo", "tier": "active",
            "summary": "M23 rebel resurgence in eastern DRC (North/South Kivu) intensified sharply, with M23 "
                       "capturing Goma (Jan 2025) and Bukavu (Feb 2025) -- among the most significant African "
                       "conflict escalations of the period.",
            "actors": ["M23", "Congolese Armed Forces (FARDC)", "allied militias"], "since": "2021-22, escalated 2025"},
    "MLI": {"country_name": "Mali", "tier": "active",
            "summary": "Jihadist insurgency (JNIM/al-Qaeda-linked and ISGS/Islamic State-linked groups) across "
                       "the central Sahel, intensified following the withdrawal of French/UN forces and the "
                       "shift to Russian Africa Corps support for the Malian junta.",
            "actors": ["JNIM", "ISGS", "Malian Armed Forces", "Africa Corps (Wagner successor)"], "since": "2012, ongoing"},
    "ETH": {"country_name": "Ethiopia", "tier": "moderate",
            "summary": "The Nov 2022 Pretoria peace deal ended the Tigray war; a separate Fano militia "
                       "insurgency in Amhara region escalated from 2023.",
            "actors": ["Fano militia", "Ethiopian National Defense Force"], "since": "2023 (Amhara); Tigray war ended 2022-11"},
}
# Full country names for the bridge's 37-country list, used to fill in the
# "no active conflict" defaults below with a proper name (not just the code).
BRIDGE_COUNTRY_NAMES = {
    "USA": "United States", "GBR": "United Kingdom", "DEU": "Germany", "FRA": "France",
    "JPN": "Japan", "CAN": "Canada", "ITA": "Italy", "NLD": "Netherlands", "ESP": "Spain",
    "SWE": "Sweden", "NOR": "Norway", "DNK": "Denmark", "FIN": "Finland", "POL": "Poland",
    "CZE": "Czech Republic", "HUN": "Hungary", "ROU": "Romania", "PRT": "Portugal",
    "GRC": "Greece", "AUT": "Austria", "BEL": "Belgium", "CHE": "Switzerland",
    "AUS": "Australia", "NZL": "New Zealand", "CHN": "China", "IND": "India", "BRA": "Brazil",
    "ZAF": "South Africa", "MEX": "Mexico", "ARG": "Argentina", "TUR": "Turkey",
    "IDN": "Indonesia", "SGP": "Singapore", "KOR": "South Korea", "SAU": "Saudi Arabia",
    "ARE": "United Arab Emirates", "EGY": "Egypt", "NGA": "Nigeria", "KEN": "Kenya",
}
for _iso2, _iso3 in ISO2_TO_ISO3.items():
    CONFLICT_STATUS.setdefault(_iso3, {
        "country_name": BRIDGE_COUNTRY_NAMES.get(_iso3, _iso3), "tier": "none",
        "summary": "No active UCDP-codeable armed conflict identified for this country as of this writing.",
        "actors": [], "since": None,
    })

# Real, well-documented notable incidents (month-precision, not fabricated
# day/casualty-level detail) for the actively-conflicted countries above.
# These back the /events endpoint in seeded mode.
NOTABLE_INCIDENTS: List[Dict[str, Any]] = [
    {"iso3": "UKR", "date": "2022-02", "headline": "Russia launches full-scale invasion of Ukraine"},
    {"iso3": "UKR", "date": "2022-09", "headline": "Ukrainian Kharkiv counteroffensive retakes significant territory"},
    {"iso3": "UKR", "date": "2024-08", "headline": "Ukrainian forces launch cross-border incursion into Kursk region, Russia"},
    {"iso3": "PSE", "date": "2023-10", "headline": "Hamas-led attack on Israel (7 Oct); Israel launches Gaza military campaign"},
    {"iso3": "PSE", "date": "2024-05", "headline": "Israeli ground offensive expands into Rafah, southern Gaza"},
    {"iso3": "PSE", "date": "2025-01", "headline": "Phased Gaza ceasefire and hostage-release framework agreed"},
    {"iso3": "SDN", "date": "2023-04", "headline": "SAF-RSF war erupts in Khartoum"},
    {"iso3": "SDN", "date": "2024-05", "headline": "RSF siege of El Fasher, North Darfur, intensifies"},
    {"iso3": "MMR", "date": "2021-02", "headline": "Military coup deposes civilian government"},
    {"iso3": "MMR", "date": "2023-10", "headline": "Three Brotherhood Alliance launches 'Operation 1027' offensive"},
    {"iso3": "SYR", "date": "2024-12", "headline": "HTS-led offensive topples the Assad regime"},
    {"iso3": "YEM", "date": "2022-04", "headline": "UN-mediated nationwide truce takes effect"},
    {"iso3": "YEM", "date": "2023-11", "headline": "Houthi forces begin attacks on Red Sea shipping"},
    {"iso3": "COD", "date": "2025-01", "headline": "M23 rebels capture Goma, North Kivu"},
    {"iso3": "COD", "date": "2025-02", "headline": "M23 rebels capture Bukavu, South Kivu"},
    {"iso3": "MLI", "date": "2023-08", "headline": "French/UN force withdrawal completes amid rising JNIM/ISGS attacks"},
    {"iso3": "ETH", "date": "2022-11", "headline": "Pretoria peace agreement ends the Tigray war"},
    {"iso3": "ETH", "date": "2023-04", "headline": "Fano militia conflict escalates in Amhara region"},
    {"iso3": "NGA", "date": "2024-01", "headline": "ISWAP/Boko Haram attacks continue in Borno State, northeast Nigeria"},
    {"iso3": "TUR", "date": "2025-05", "headline": "PKK announces dissolution/disarmament process following Ocalan's call"},
    {"iso3": "IND", "date": "2023-05", "headline": "Ethnic violence erupts in Manipur between Meitei and Kuki communities"},
]


def _resolve_iso3(country: str) -> Optional[str]:
    if not country:
        return None
    c = country.strip().upper()
    if len(c) == 3 and c in CONFLICT_STATUS:
        return c
    if len(c) == 2 and c in ISO2_TO_ISO3:
        return ISO2_TO_ISO3[c]
    for iso3, rec in CONFLICT_STATUS.items():
        if rec["country_name"].upper() == c:
            return iso3
    return None


def _fetch_live_events(country_name: Optional[str], start_date: Optional[str],
                        end_date: Optional[str], pagesize: int) -> List[dict]:
    token = os.environ.get(UCDP_API_TOKEN_ENV, "").strip()
    version = os.environ.get(UCDP_API_VERSION_ENV, DEFAULT_VERSION).strip()
    params: Dict[str, Any] = {"pagesize": pagesize}
    if start_date:
        params["StartDate"] = start_date
    if end_date:
        params["EndDate"] = end_date
    resp = requests.get(
        f"{UCDP_BASE}/{version}",
        params=params,
        headers={"x-ucdp-access-token": token},
        timeout=_TIMEOUT,
    )
    resp.raise_for_status()
    payload = resp.json()
    rows = payload.get("Result", payload.get("result", []))
    if country_name:
        needle = country_name.strip().lower()
        rows = [r for r in rows if needle in str(r.get("country", "")).lower()]
    return rows


@router.get("/status")
def status() -> dict:
    """Report whether a UCDP token is configured (drives the Live/Demo badge)."""
    token = os.environ.get(UCDP_API_TOKEN_ENV, "").strip()
    version = os.environ.get(UCDP_API_VERSION_ENV, DEFAULT_VERSION).strip()
    return {
        "source": "UCDP (Uppsala Conflict Data Program) -- GED events API",
        "mode": "live" if token else "demo-seed",
        "api_token_configured": bool(token),
        "api_token_env": UCDP_API_TOKEN_ENV,
        "base_url": f"{UCDP_BASE}/{version}",
        "registration": REGISTRATION_INFO,
        "note": ("Live UCDP GED feed available." if token else
                 "No UCDP_API_TOKEN set -- endpoints return a labeled seeded real "
                 "sample (qualitative country conflict-status + notable documented "
                 "incidents). See `registration` for how to request a free token."),
        "seeded_countries_covered": len(CONFLICT_STATUS),
        "seeded_notable_incidents": len(NOTABLE_INCIDENTS),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/events")
def events(
    country: Optional[str] = Query(None, description="ISO2, ISO3, or country name"),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    pagesize: int = Query(50, ge=1, le=1000),
) -> dict:
    token = os.environ.get(UCDP_API_TOKEN_ENV, "").strip()
    iso3 = _resolve_iso3(country) if country else None
    country_name = CONFLICT_STATUS[iso3]["country_name"] if iso3 else country

    if token:
        try:
            rows = _fetch_live_events(country_name, start_date, end_date, pagesize)
            return {
                "mode": "live", "country": country_name, "iso3": iso3,
                "count": len(rows), "events": rows,
                "source": f"UCDP GED live API ({UCDP_BASE}/{os.environ.get(UCDP_API_VERSION_ENV, DEFAULT_VERSION)})",
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
            }
        except requests.RequestException as exc:
            upstream_error = str(exc)
    else:
        upstream_error = None

    # Seeded fallback
    incidents = [i for i in NOTABLE_INCIDENTS if (iso3 is None or i["iso3"] == iso3)]
    return {
        "mode": "seeded-real-sample",
        "country": country_name, "iso3": iso3,
        "count": len(incidents),
        "events": incidents,
        "source": "Analyst-compiled notable documented incidents (public reporting) -- "
                  "NOT verbatim UCDP GED row-level records. Set UCDP_API_TOKEN for the "
                  "real, monthly-updated, village-geocoded feed.",
        "upstream_error": upstream_error,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/country-summary")
def country_summary(
    iso3: str = Query(..., description="ISO3 country code, e.g. NGA, UKR, USA"),
    months: int = Query(12, ge=1, le=60),
) -> dict:
    code = iso3.strip().upper()
    resolved = _resolve_iso3(code)
    if not resolved:
        raise HTTPException(status_code=404, detail=f"No coverage for '{iso3}'. See /api/v1/ucdp/status for seeded coverage.")

    token = os.environ.get(UCDP_API_TOKEN_ENV, "").strip()
    status_rec = CONFLICT_STATUS[resolved]

    if token:
        try:
            rows = _fetch_live_events(status_rec["country_name"], None, None, 1000)
            by_month: Dict[str, Dict[str, float]] = {}
            for r in rows:
                m = str(r.get("date_start", ""))[:7]
                if not m:
                    continue
                bucket = by_month.setdefault(m, {"events": 0, "fatalities_best": 0.0})
                bucket["events"] += 1
                bucket["fatalities_best"] += float(r.get("best", 0) or 0)
            months_sorted = sorted(by_month.keys())[-months:]
            series = [{"month": m, **by_month[m]} for m in months_sorted]
            if len(series) >= 2:
                mid = len(series) // 2
                recent_avg = sum(s["fatalities_best"] for s in series[mid:]) / max(1, len(series) - mid)
                prior_avg = sum(s["fatalities_best"] for s in series[:mid]) / max(1, mid)
                trend = ("escalating" if recent_avg > prior_avg * 1.15 else
                          "de-escalating" if recent_avg < prior_avg * 0.85 else "stable")
            else:
                trend = "insufficient live data in window"
            return {
                "mode": "live", "iso3": resolved, "country_name": status_rec["country_name"],
                "months_returned": len(series), "monthly_series": series, "trend": trend,
                "source": f"UCDP GED live API ({UCDP_BASE}/{os.environ.get(UCDP_API_VERSION_ENV, DEFAULT_VERSION)})",
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
            }
        except requests.RequestException as exc:
            upstream_error = str(exc)
    else:
        upstream_error = None

    related = [i for i in NOTABLE_INCIDENTS if i["iso3"] == resolved]
    return {
        "mode": "seeded-real-sample",
        "iso3": resolved, "country_name": status_rec["country_name"],
        "tier": status_rec["tier"], "summary": status_rec["summary"],
        "actors": status_rec["actors"], "active_since": status_rec["since"],
        "notable_incidents": related,
        "trend": "insufficient seeded time-series granularity -- set UCDP_API_TOKEN for a real "
                 "monthly event-count / fatality-estimate trend from the live GED feed",
        "upstream_error": upstream_error,
        "source": "Analyst-compiled qualitative assessment (public reporting), not live UCDP data.",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/coverage")
def coverage() -> dict:
    """Lightweight list of all countries with a seeded conflict-status tier (for UI dropdowns)."""
    return {
        "count": len(CONFLICT_STATUS),
        "countries": [
            {"iso3": iso3, "iso2": ISO3_TO_ISO2.get(iso3), "country_name": rec["country_name"], "tier": rec["tier"]}
            for iso3, rec in sorted(CONFLICT_STATUS.items())
        ],
    }
