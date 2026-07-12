"""
Energy & Utility Bond Maturity Ladder — hand-authored real-issuer extract
=========================================================================
Prefix: /api/v1/energy-bonds
Tags:   Energy Bond Ladder

Serves a HAND-AUTHORED extract of USD/EUR benchmark bonds of major energy &
utility issuers for the Maturity Wall Monitor (/maturity-wall-monitor).

DATA LABEL (surfaced verbatim by the frontend):
    "Illustrative real-issuer extract, approximate terms — coupons, sizes and
     ratings are approximate/composite and hand-authored from public issuance
     history. Refresh from issuer filings / FINRA TRACE / exchange prospectuses
     for production use."

Every issuer below is a real, major energy/utility borrower with a deep USD or
EUR benchmark curve. Coupons and maturities approximate real outstanding
benchmarks of each issuer's curve; sizes are rounded; ratings are approximate
composites (senior unsecured). Nothing here is a live market feed. The
companion live feed is /api/v1/fred-spreads (real ICE BofA rating-bucket OAS),
which the frontend joins onto the `rating_bucket` field for refi-cost math.

Endpoints
---------
GET  /status           — provenance + label (drives the extract badge)
GET  /issuers          — distinct issuers with bond counts / sizes
GET  /ladder           — bond extract + per-year aggregation
                         filters: issuer, currency, bucket, from_year, to_year
GET  /curves           — per-issuer spread-curve construction (OLS spread vs
                         tenor per issuer with >=3 bonds, else pooled sector
                         curve) + rich/cheap residual per bond. Documented
                         spread proxy: spread_bp = (coupon - base_rate) x 100
                         (the extract carries coupons, not prices — this is an
                         at-issue coupon-over-base screening proxy, labeled).
POST /ladder-analytics — duration / DV01 per bond and aggregate (closed-form
                         annual-pay bullet at ytm = base + bucket spread),
                         rate-shock table (±100/±200bp parallel + steepener via
                         FULL REPRICING, documented), refinancing-capacity
                         leverage screen vs user per-issuer EBITDA (labeled).
POST /refi-economics   — green-refi advantage (user greenium applied to
                         green/slb-eligible refi candidates, labeled), call /
                         make-whole analysis (user call price -> refi-now vs
                         wait breakeven rate, documented), and a liability-
                         management tender + new-issue combo cost.
POST /transition-overlay — sustainability x financial: per-issuer transition
                         capex plans vs refi volumes (funding-gap), green share
                         of the ladder by year, and a climate-spread-risk
                         overlay (user transition-risk score -> stressed refi
                         spread via a documented linear mapping -> stressed
                         wall cost delta).

Analytics conventions (documented, deterministic — no PRNG)
-----------------------------------------------------------
Tenor          : maturity_year - as_of_year (extract as-of 2026).
Spread proxy   : the extract has coupons/maturities but no prices, so all
                 curve work uses spread_bp = (coupon - base_rate) x 100 — an
                 at-issue coupon-over-base proxy (LABELED). Pair with the live
                 /api/v1/fred-spreads OAS join for current market levels.
Bond pricing   : annual-pay bullet at flat ytm = base_rate + bucket_spread:
                 P = sum C/(1+y)^t + 100/(1+y)^n ; Macaulay D = sum t·CF_t/(1+y)^t / P ;
                 Modified D = D_mac/(1+y) ; DV01_$ = ModD x P/100 x size x 1e9 x 1e-4.
Rate shocks    : FULL REPRICING at y + shock (not the duration approximation);
                 steepener convention: tenor <= 5y shocked -50bp, > 5y +50bp
                 (pivot at 5y, labeled convention).
Call breakeven : refinance now at refi_coupon + amortise the call premium
                 (call_price - 100) over the remaining tenor (straight-line pp/yr,
                 documented) vs wait: breakeven future refi rate
                 r* = refi_coupon_now + premium_pp / remaining_tenor. If the
                 expected future rate exceeds r*, calling now wins.
Tender combo   : upfront cost = participation x size x (tender_price - 100)/100;
                 tendered amount reissued at the (possibly green) refi coupon;
                 annual saving = (old coupon - new coupon) x tendered; payback
                 = upfront / annual saving (when saving > 0).
Climate spread : stressed refi spread = bucket spread + score x slope_bp_per_point
                 (default 1.5bp per score point 0-100 — LABELED MODEL
                 ASSUMPTION shown in-UI) -> stressed wall interest delta.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/energy-bonds", tags=["Energy Bond Ladder"])

EXTRACT_LABEL = (
    "Illustrative real-issuer extract, approximate terms — coupons, sizes and "
    "ratings are approximate/composite and hand-authored from public issuance "
    "history. Refresh from issuer filings / FINRA TRACE / exchange prospectuses "
    "for production use."
)
EXTRACT_AS_OF = "2026-07"  # hand-authoring date of the extract

# `rating_bucket` matches the ICE BofA OAS buckets served by
# /api/v1/fred-spreads (AAA/AA/A/BBB/BB/B/CCC) so the frontend can join
# live spreads without a mapping table.
# `label`: "green" (use-of-proceeds), "slb" (sustainability-linked), "conventional".
BONDS: List[Dict] = [
    # ── US regulated / renewable utilities (USD) ─────────────────────────────
    {"issuer": "NextEra Energy Capital Holdings", "ticker": "NEE",  "country": "US", "sector": "Renewables & regulated utility",
     "currency": "USD", "coupon_pct": 4.90, "maturity_year": 2028, "size_bn": 1.25, "rating": "BBB+", "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "NextEra Energy Capital Holdings", "ticker": "NEE",  "country": "US", "sector": "Renewables & regulated utility",
     "currency": "USD", "coupon_pct": 5.00, "maturity_year": 2032, "size_bn": 1.00, "rating": "BBB+", "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Duke Energy Corp",               "ticker": "DUK",  "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 3.15, "maturity_year": 2027, "size_bn": 0.75, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Duke Energy Corp",               "ticker": "DUK",  "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 2.55, "maturity_year": 2031, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Duke Energy Corp",               "ticker": "DUK",  "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 5.00, "maturity_year": 2033, "size_bn": 1.25, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Southern Company",               "ticker": "SO",   "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 5.11, "maturity_year": 2027, "size_bn": 1.50, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Southern Company",               "ticker": "SO",   "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 3.70, "maturity_year": 2030, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Dominion Energy",                "ticker": "D",    "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 3.38, "maturity_year": 2030, "size_bn": 0.75, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Dominion Energy",                "ticker": "D",    "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 5.38, "maturity_year": 2033, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Xcel Energy Inc",                "ticker": "XEL",  "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 3.40, "maturity_year": 2030, "size_bn": 0.70, "rating": "BBB+", "rating_bucket": "BBB", "label": "conventional"},
    {"issuer": "Exelon Corp",                    "ticker": "EXC",  "country": "US", "sector": "Regulated utility",
     "currency": "USD", "coupon_pct": 4.05, "maturity_year": 2030, "size_bn": 0.65, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    # ── European utilities — USD benchmarks ──────────────────────────────────
    {"issuer": "Enel Finance International",     "ticker": "ENEL", "country": "IT", "sector": "Integrated utility",
     "currency": "USD", "coupon_pct": 1.38, "maturity_year": 2026, "size_bn": 1.25, "rating": "BBB",  "rating_bucket": "BBB", "label": "slb"},
    {"issuer": "Enel Finance International",     "ticker": "ENEL", "country": "IT", "sector": "Integrated utility",
     "currency": "USD", "coupon_pct": 1.88, "maturity_year": 2028, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "slb"},
    {"issuer": "Enel Finance International",     "ticker": "ENEL", "country": "IT", "sector": "Integrated utility",
     "currency": "USD", "coupon_pct": 2.25, "maturity_year": 2031, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "slb"},
    {"issuer": "EDF (Electricité de France)",    "ticker": "EDF",  "country": "FR", "sector": "Integrated utility / nuclear",
     "currency": "USD", "coupon_pct": 6.90, "maturity_year": 2053, "size_bn": 1.50, "rating": "BBB",  "rating_bucket": "BBB", "label": "conventional"},
    # ── Integrated energy majors (USD) ───────────────────────────────────────
    {"issuer": "TotalEnergies Capital Intl",     "ticker": "TTE",  "country": "FR", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 2.99, "maturity_year": 2041, "size_bn": 1.00, "rating": "A",    "rating_bucket": "A",   "label": "conventional"},
    {"issuer": "TotalEnergies Capital Intl",     "ticker": "TTE",  "country": "FR", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 3.13, "maturity_year": 2050, "size_bn": 1.00, "rating": "A",    "rating_bucket": "A",   "label": "conventional"},
    {"issuer": "BP Capital Markets America",     "ticker": "BP",   "country": "GB", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 2.94, "maturity_year": 2026, "size_bn": 1.00, "rating": "A-",   "rating_bucket": "A",   "label": "conventional"},
    {"issuer": "BP Capital Markets America",     "ticker": "BP",   "country": "GB", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 3.94, "maturity_year": 2028, "size_bn": 1.00, "rating": "A-",   "rating_bucket": "A",   "label": "conventional"},
    {"issuer": "Shell International Finance",    "ticker": "SHEL", "country": "GB", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 2.38, "maturity_year": 2029, "size_bn": 1.00, "rating": "AA-",  "rating_bucket": "AA",  "label": "conventional"},
    {"issuer": "Shell International Finance",    "ticker": "SHEL", "country": "GB", "sector": "Integrated energy",
     "currency": "USD", "coupon_pct": 6.38, "maturity_year": 2038, "size_bn": 1.50, "rating": "AA-",  "rating_bucket": "AA",  "label": "conventional"},
    # ── High-yield national oil company (USD) — split-rated, HY composite ────
    {"issuer": "Petróleos Mexicanos (Pemex)",    "ticker": "PEMEX","country": "MX", "sector": "National oil company",
     "currency": "USD", "coupon_pct": 6.50, "maturity_year": 2027, "size_bn": 2.00, "rating": "B+",   "rating_bucket": "B",   "label": "conventional"},
    {"issuer": "Petróleos Mexicanos (Pemex)",    "ticker": "PEMEX","country": "MX", "sector": "National oil company",
     "currency": "USD", "coupon_pct": 6.84, "maturity_year": 2030, "size_bn": 1.50, "rating": "B+",   "rating_bucket": "B",   "label": "conventional"},
    # ── European utilities — EUR benchmarks (green-heavy) ────────────────────
    {"issuer": "Engie SA",                       "ticker": "ENGI", "country": "FR", "sector": "Integrated utility",
     "currency": "EUR", "coupon_pct": 0.38, "maturity_year": 2027, "size_bn": 0.75, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Engie SA",                       "ticker": "ENGI", "country": "FR", "sector": "Integrated utility",
     "currency": "EUR", "coupon_pct": 3.63, "maturity_year": 2032, "size_bn": 0.85, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Iberdrola Finanzas",             "ticker": "IBE",  "country": "ES", "sector": "Integrated utility / renewables",
     "currency": "EUR", "coupon_pct": 0.88, "maturity_year": 2030, "size_bn": 0.70, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Iberdrola Finanzas",             "ticker": "IBE",  "country": "ES", "sector": "Integrated utility / renewables",
     "currency": "EUR", "coupon_pct": 3.25, "maturity_year": 2033, "size_bn": 0.80, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Ørsted A/S",                     "ticker": "ORSTED","country": "DK","sector": "Offshore wind / utility",
     "currency": "EUR", "coupon_pct": 1.50, "maturity_year": 2029, "size_bn": 0.60, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Ørsted A/S",                     "ticker": "ORSTED","country": "DK","sector": "Offshore wind / utility",
     "currency": "EUR", "coupon_pct": 3.25, "maturity_year": 2031, "size_bn": 0.50, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "E.ON SE",                        "ticker": "EOAN", "country": "DE", "sector": "Networks & retail utility",
     "currency": "EUR", "coupon_pct": 3.88, "maturity_year": 2030, "size_bn": 0.75, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "RWE AG",                         "ticker": "RWE",  "country": "DE", "sector": "Generation / renewables",
     "currency": "EUR", "coupon_pct": 3.63, "maturity_year": 2031, "size_bn": 0.60, "rating": "BBB",  "rating_bucket": "BBB", "label": "green"},
    {"issuer": "Vattenfall AB",                  "ticker": "VATFAL","country": "SE","sector": "Integrated utility",
     "currency": "EUR", "coupon_pct": 0.50, "maturity_year": 2026, "size_bn": 0.50, "rating": "BBB+", "rating_bucket": "BBB", "label": "green"},
    {"issuer": "EDF (Electricité de France)",    "ticker": "EDF",  "country": "FR", "sector": "Integrated utility / nuclear",
     "currency": "EUR", "coupon_pct": 3.75, "maturity_year": 2035, "size_bn": 1.00, "rating": "BBB",  "rating_bucket": "BBB", "label": "green"},
]

# Stable ids (issuer ticker + coupon + maturity) assigned once at import.
for _i, _b in enumerate(BONDS):
    _b["id"] = f"{_b['ticker']}-{str(_b['coupon_pct']).replace('.', 'p')}-{_b['maturity_year']}-{_i}"

_BUCKETS = sorted({b["rating_bucket"] for b in BONDS})
_LABELS = ["green", "slb", "conventional"]


def _aggregate(bonds: List[Dict]) -> List[Dict]:
    """Per-maturity-year aggregation: totals, label split, rating-bucket split,
    size-weighted average coupon. Pure summation over the extract — no modeling."""
    years = sorted({b["maturity_year"] for b in bonds})
    out = []
    for y in years:
        in_year = [b for b in bonds if b["maturity_year"] == y]
        total = sum(b["size_bn"] for b in in_year)
        row = {
            "year": y,
            "count": len(in_year),
            "total_bn": round(total, 3),
            "wavg_coupon_pct": round(sum(b["coupon_pct"] * b["size_bn"] for b in in_year) / total, 3) if total else None,
            "by_label": {lb: round(sum(b["size_bn"] for b in in_year if b["label"] == lb), 3) for lb in _LABELS},
            "by_bucket": {bk: round(sum(b["size_bn"] for b in in_year if b["rating_bucket"] == bk), 3) for bk in _BUCKETS},
        }
        out.append(row)
    return out


@router.get("/status")
def status() -> dict:
    """Provenance of the extract — drives the frontend's data-label badge."""
    return {
        "source": "Hand-authored real-issuer extract (energy & utility benchmark bonds)",
        "mode": "seeded-extract",
        "label": EXTRACT_LABEL,
        "as_of": EXTRACT_AS_OF,
        "bond_count": len(BONDS),
        "issuers": len({b["issuer"] for b in BONDS}),
        "currencies": sorted({b["currency"] for b in BONDS}),
        "rating_buckets": _BUCKETS,
        "live_spread_companion": "/api/v1/fred-spreads/series (real ICE BofA OAS, joined on rating_bucket)",
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/issuers")
def issuers() -> dict:
    """Distinct issuers with bond counts and total outstanding in the extract."""
    names = sorted({b["issuer"] for b in BONDS})
    rows = []
    for n in names:
        bs = [b for b in BONDS if b["issuer"] == n]
        rows.append({
            "issuer": n,
            "ticker": bs[0]["ticker"],
            "country": bs[0]["country"],
            "sector": bs[0]["sector"],
            "bonds": len(bs),
            "total_bn": round(sum(b["size_bn"] for b in bs), 3),
            "rating": bs[0]["rating"],
        })
    return {"count": len(rows), "issuers": rows, "label": EXTRACT_LABEL, "as_of": EXTRACT_AS_OF}


@router.get("/ladder")
def ladder(
    issuer: Optional[str] = Query(None, description="Exact issuer name filter (see GET /issuers)"),
    currency: Optional[str] = Query(None, description="USD or EUR"),
    bucket: Optional[str] = Query(None, description=f"Rating bucket filter: one of {_BUCKETS}"),
    from_year: int = Query(2026, ge=2024, le=2060),
    to_year: int = Query(2060, ge=2024, le=2060),
) -> dict:
    """Bond extract + per-year maturity aggregation (optionally filtered)."""
    if currency and currency.upper() not in {"USD", "EUR"}:
        raise HTTPException(status_code=422, detail="currency must be USD or EUR")
    if bucket and bucket.upper() not in _BUCKETS:
        raise HTTPException(status_code=422, detail=f"bucket must be one of {_BUCKETS}")
    if from_year > to_year:
        raise HTTPException(status_code=422, detail="from_year must be <= to_year")

    bonds = [b for b in BONDS if from_year <= b["maturity_year"] <= to_year]
    if issuer:
        bonds = [b for b in bonds if b["issuer"].lower() == issuer.lower()]
        if not bonds:
            raise HTTPException(status_code=404, detail=f"No bonds for issuer '{issuer}'. See GET /issuers.")
    if currency:
        bonds = [b for b in bonds if b["currency"] == currency.upper()]
    if bucket:
        bonds = [b for b in bonds if b["rating_bucket"] == bucket.upper()]

    total = sum(b["size_bn"] for b in bonds)
    return {
        "mode": "seeded-extract",
        "label": EXTRACT_LABEL,
        "as_of": EXTRACT_AS_OF,
        "filters": {"issuer": issuer, "currency": currency, "bucket": bucket,
                    "from_year": from_year, "to_year": to_year},
        "bond_count": len(bonds),
        "total_bn": round(total, 3),
        "wavg_coupon_pct": round(sum(b["coupon_pct"] * b["size_bn"] for b in bonds) / total, 3) if total else None,
        "bonds": sorted(bonds, key=lambda b: (b["maturity_year"], b["issuer"])),
        "ladder": _aggregate(bonds),
        "buckets": _BUCKETS,
        "labels": _LABELS,
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════════
# Ladder analytics — issuer curves, duration/DV01, refi economics, transition
# overlay. All conventions documented in the module docstring. Deterministic.
# ═══════════════════════════════════════════════════════════════════════════

AS_OF_YEAR = 2026  # extract as-of (matches EXTRACT_AS_OF month 2026-07)

# Fallback bucket spreads (pp) used only when the caller does not pass the live
# ICE BofA OAS join — HAND-AUTHORED mid-cycle conventions, labeled in responses.
DEFAULT_BUCKET_SPREAD_PP: Dict[str, float] = {
    "AAA": 0.45, "AA": 0.60, "A": 0.90, "BBB": 1.25, "BB": 2.60, "B": 3.50, "CCC": 8.50,
}
DEFAULT_SPREAD_BASIS = (
    "Hand-authored mid-cycle bucket-spread conventions (pp) — used ONLY when no live OAS map is supplied. "
    "Pass bucket_oas_pp from the live /api/v1/fred-spreads join for market levels."
)
SPREAD_PROXY_NOTE = (
    "Curve spread proxy: spread_bp = (coupon - base_rate) x 100 — an at-issue coupon-over-base screening proxy "
    "(the extract carries coupons, not prices). LABELED convention; not a traded z-spread."
)


def _tenor(b: Dict) -> float:
    return max(0.25, float(b["maturity_year"] - AS_OF_YEAR))


def _ols_fit(pts: List[tuple]) -> Optional[dict]:
    """OLS y = a + b x with R² over (x, y) points. None if degenerate."""
    n = len(pts)
    if n < 2:
        return None
    mx = sum(p[0] for p in pts) / n
    my = sum(p[1] for p in pts) / n
    sxx = sum((x - mx) ** 2 for x, _ in pts)
    if sxx <= 1e-12:
        return None
    b = sum((x - mx) * (y - my) for x, y in pts) / sxx
    a = my - b * mx
    ss_tot = sum((y - my) ** 2 for _, y in pts)
    ss_res = sum((y - (a + b * x)) ** 2 for x, y in pts)
    return {"intercept_bp": a, "slope_bp_per_yr": b,
            "r2": (1.0 - ss_res / ss_tot) if ss_tot > 1e-12 else None, "n": n}


def _bond_price_dur(coupon_pct: float, tenor_years: float, ytm_pct: float) -> dict:
    """Closed-form annual-pay bullet: price (per 100), Macaulay/modified duration."""
    y = ytm_pct / 100.0
    n = max(1, round(tenor_years))
    pv, tw = 0.0, 0.0
    for t in range(1, n + 1):
        cf = coupon_pct + (100.0 if t == n else 0.0)
        d = cf / (1.0 + y) ** t
        pv += d
        tw += t * d
    mac = tw / pv
    return {"price": pv, "mac": mac, "mod": mac / (1.0 + y), "n": n}


class LadderAnalyticsRequest(BaseModel):
    base_rate_pct: float = Field(4.25, ge=0, le=25, description="Flat base/govt rate, user input")
    bucket_oas_pp: Optional[Dict[str, float]] = Field(None, description="Letter-bucket OAS map (pp) from the live fred-spreads join; hand-authored defaults used when omitted (labeled)")
    issuer: Optional[str] = None
    currency: Optional[str] = None
    horizon_year: int = Field(2030, ge=2026, le=2060, description="Leverage screen horizon (wall <= horizon)")
    issuer_ebitda_bn: Optional[Dict[str, float]] = Field(None, description="Per-issuer EBITDA $bn (user input) for the refi-capacity leverage screen (labeled)")


class RefiEconomicsRequest(BaseModel):
    base_rate_pct: float = Field(4.25, ge=0, le=25)
    bucket_oas_pp: Optional[Dict[str, float]] = None
    horizon_year: int = Field(2030, ge=2026, le=2060)
    rate_stress_bp: float = Field(0, ge=-300, le=500)
    spread_stress_bp: float = Field(0, ge=-300, le=500)
    greenium_bp: float = Field(5.0, ge=0, le=50, description="Green/SLB new-issue discount vs conventional, bp — LABELED emerging-market observation (typical 2-8bp IG greenium), user-adjustable")
    call_price_pct: float = Field(103.0, ge=100, le=130, description="Assumed call / make-whole price (per 100) for the call-now-vs-wait breakeven")
    expected_future_rate_pct: Optional[float] = Field(None, ge=0, le=25, description="Optional user view of the refi rate at maturity — compared against the breakeven r*")
    tender_price_pct: float = Field(101.0, ge=90, le=125, description="Tender offer price (per 100)")
    tender_participation_pct: float = Field(60.0, ge=0, le=100, description="Expected tender participation, % of size")
    issuer: Optional[str] = None
    currency: Optional[str] = None


class TransitionOverlayRequest(BaseModel):
    base_rate_pct: float = Field(4.25, ge=0, le=25)
    bucket_oas_pp: Optional[Dict[str, float]] = None
    horizon_year: int = Field(2032, ge=2026, le=2060)
    spread_slope_bp_per_point: float = Field(1.5, ge=0, le=10, description="Stressed refi spread add-on per transition-risk score point (0-100) — LABELED MODEL ASSUMPTION")
    issuer_transition: Optional[Dict[str, Dict[str, float]]] = Field(
        None,
        description="Per-issuer {'capex_bn': transition capex plan $bn to horizon, 'risk_score': 0-100 transition-risk score} — user inputs; issuers omitted default to score 50 / capex 0 (labeled).",
    )


def _spread_pp(bucket: str, oas_map: Optional[Dict[str, float]]) -> tuple:
    """(spread_pp, source) for a rating bucket — live map else labeled default."""
    if oas_map and bucket in oas_map:
        return float(oas_map[bucket]), "live_oas_join"
    return DEFAULT_BUCKET_SPREAD_PP.get(bucket, 2.0), "hand_authored_default"


def _filter_bonds(issuer: Optional[str], currency: Optional[str]) -> List[Dict]:
    bonds = list(BONDS)
    if issuer:
        bonds = [b for b in bonds if b["issuer"].lower() == issuer.lower()]
        if not bonds:
            raise HTTPException(status_code=404, detail=f"No bonds for issuer '{issuer}'. See GET /issuers.")
    if currency:
        bonds = [b for b in bonds if b["currency"] == currency.upper()]
    return bonds


@router.get("/curves", summary="Per-issuer spread curves (OLS spread vs tenor; sector fallback) + rich/cheap per bond")
def curves(
    base_rate_pct: float = Query(4.25, ge=0, le=25, description="Base rate for the coupon-over-base spread proxy (documented)"),
    currency: Optional[str] = Query(None, description="USD or EUR filter"),
) -> dict:
    """Issuer credit-curve construction from the extract.

    spread_bp = (coupon - base_rate) x 100 (documented proxy). Issuers with
    >= 3 bonds get their own OLS line spread = a + b x tenor; issuers with
    fewer fall back to the pooled OLS of their sector (else the global pool).
    rich_cheap_bp = actual - fitted (positive = trades WIDE of its own curve =
    cheap on this proxy; negative = rich).
    """
    bonds = _filter_bonds(None, currency)
    pts = {b["id"]: (_tenor(b), (b["coupon_pct"] - base_rate_pct) * 100.0) for b in bonds}

    by_issuer: Dict[str, List[Dict]] = {}
    for b in bonds:
        by_issuer.setdefault(b["issuer"], []).append(b)
    by_sector: Dict[str, List[Dict]] = {}
    for b in bonds:
        by_sector.setdefault(b["sector"], []).append(b)

    sector_fits = {sec: _ols_fit([pts[b["id"]] for b in bs]) for sec, bs in by_sector.items()}
    global_fit = _ols_fit(list(pts.values()))

    curves_out = []
    bond_rows = []
    for issuer_name, bs in sorted(by_issuer.items()):
        own = _ols_fit([pts[b["id"]] for b in bs]) if len(bs) >= 3 else None
        if own is not None:
            fit, source = own, "issuer_ols"
        elif sector_fits.get(bs[0]["sector"]) is not None:
            fit, source = sector_fits[bs[0]["sector"]], f"sector_ols ({bs[0]['sector']})"
        else:
            fit, source = global_fit, "global_ols"
        curves_out.append({
            "issuer": issuer_name, "ticker": bs[0]["ticker"], "sector": bs[0]["sector"],
            "bonds": len(bs), "curve_source": source,
            "intercept_bp": round(fit["intercept_bp"], 1) if fit else None,
            "slope_bp_per_yr": round(fit["slope_bp_per_yr"], 2) if fit else None,
            "r2": round(fit["r2"], 3) if fit and fit["r2"] is not None else None,
        })
        for b in bs:
            tenor, spr = pts[b["id"]]
            fitted = (fit["intercept_bp"] + fit["slope_bp_per_yr"] * tenor) if fit else None
            bond_rows.append({
                "id": b["id"], "issuer": issuer_name, "ticker": b["ticker"],
                "coupon_pct": b["coupon_pct"], "maturity_year": b["maturity_year"],
                "tenor_years": round(tenor, 2), "spread_bp": round(spr, 0),
                "fitted_bp": round(fitted, 0) if fitted is not None else None,
                "rich_cheap_bp": round(spr - fitted, 0) if fitted is not None else None,
                "curve_source": source, "label": b["label"], "rating_bucket": b["rating_bucket"],
            })
    bond_rows.sort(key=lambda r: -(r["rich_cheap_bp"] or 0))
    return {
        "as_of_year": AS_OF_YEAR, "base_rate_pct": base_rate_pct,
        "spread_proxy_note": SPREAD_PROXY_NOTE,
        "curves": curves_out,
        "bonds": bond_rows,
        "methodology": (
            "Per-issuer OLS spread = a + b x tenor where the issuer has >= 3 extract bonds; otherwise the pooled "
            "sector OLS (else global). rich_cheap_bp = actual - fitted on the documented coupon-over-base proxy: "
            "positive = wide of own curve (cheap on this screen), negative = rich. Screening tool, not tradeable RV."
        ),
        "label": EXTRACT_LABEL,
    }


@router.post("/ladder-analytics", summary="Duration / DV01 of the wall + full-repricing rate-shock table + EBITDA leverage screen")
def ladder_analytics(req: LadderAnalyticsRequest) -> dict:
    bonds = _filter_bonds(req.issuer, req.currency)
    shocks = [
        {"name": "-200bp parallel", "kind": "parallel", "bp": -200},
        {"name": "-100bp parallel", "kind": "parallel", "bp": -100},
        {"name": "+100bp parallel", "kind": "parallel", "bp": 100},
        {"name": "+200bp parallel", "kind": "parallel", "bp": 200},
        {"name": "steepener (≤5y −50 / >5y +50)", "kind": "steepener", "bp": 50},
    ]
    rows = []
    agg_mv = 0.0
    agg_dv01 = 0.0
    spread_sources = set()
    for b in bonds:
        spr_pp, src = _spread_pp(b["rating_bucket"], req.bucket_oas_pp)
        spread_sources.add(src)
        ytm = req.base_rate_pct + spr_pp
        tenor = _tenor(b)
        bm = _bond_price_dur(b["coupon_pct"], tenor, ytm)
        mv_usd = bm["price"] / 100.0 * b["size_bn"] * 1e9
        # DV01_$ = ModD x P/100 x size$ x 1bp
        dv01 = bm["mod"] * mv_usd * 1e-4
        agg_mv += mv_usd
        agg_dv01 += dv01
        shocked = {}
        for s in shocks:
            dbp = s["bp"] if s["kind"] == "parallel" else (-50 if tenor <= 5 else 50)
            p2 = _bond_price_dur(b["coupon_pct"], tenor, ytm + dbp / 100.0)["price"]
            shocked[s["name"]] = (p2 - bm["price"]) / 100.0 * b["size_bn"] * 1e9
        rows.append({
            "id": b["id"], "issuer": b["issuer"], "ticker": b["ticker"],
            "coupon_pct": b["coupon_pct"], "maturity_year": b["maturity_year"], "tenor_years": round(tenor, 2),
            "rating_bucket": b["rating_bucket"], "label": b["label"], "size_bn": b["size_bn"],
            "ytm_pct": round(ytm, 3), "spread_pp": round(spr_pp, 3), "spread_source": src,
            "price": round(bm["price"], 3), "mv_usd_m": round(mv_usd / 1e6, 1),
            "mac_duration": round(bm["mac"], 3), "mod_duration": round(bm["mod"], 3),
            "dv01_usd": round(dv01, 0),
            "shock_mv_delta_usd_m": {k: round(v / 1e6, 2) for k, v in shocked.items()},
        })
    shock_table = []
    for s in shocks:
        tot = sum(r["shock_mv_delta_usd_m"][s["name"]] for r in rows)
        shock_table.append({"shock": s["name"], "mv_delta_usd_m": round(tot, 1),
                            "mv_delta_pct": round(tot * 1e6 / agg_mv * 100.0, 2) if agg_mv else None})

    # Refi-capacity leverage screen (labeled user-input EBITDA)
    leverage = None
    if req.issuer_ebitda_bn:
        lev_rows = []
        for issuer_name, ebitda in req.issuer_ebitda_bn.items():
            wall = sum(b["size_bn"] for b in bonds if b["issuer"].lower() == issuer_name.lower()
                       and b["maturity_year"] <= req.horizon_year)
            total_ = sum(b["size_bn"] for b in bonds if b["issuer"].lower() == issuer_name.lower())
            if total_ == 0:
                continue
            lev_rows.append({
                "issuer": issuer_name, "ebitda_bn": ebitda,
                "wall_to_horizon_bn": round(wall, 2), "total_extract_bn": round(total_, 2),
                "wall_to_ebitda_x": round(wall / ebitda, 2) if ebitda > 0 else None,
                "extract_debt_to_ebitda_x": round(total_ / ebitda, 2) if ebitda > 0 else None,
                "screen": ("elevated" if ebitda > 0 and wall / ebitda > 1.5 else "manageable") if ebitda > 0 else None,
            })
        leverage = {
            "rows": lev_rows,
            "note": (
                "LABELED LEVERAGE SCREEN: wall-to-EBITDA compares extract maturities <= horizon vs USER-INPUT EBITDA. "
                "The extract is a partial curve (benchmarks only) — a screening ratio, not the issuer's true leverage. "
                "'elevated' flag at wall/EBITDA > 1.5x (rule-of-thumb single-refi-window capacity, labeled)."
            ),
        }

    return {
        "inputs": req.model_dump(),
        "bond_count": len(rows),
        "aggregate": {
            "mv_usd_m": round(agg_mv / 1e6, 1),
            "dv01_usd": round(agg_dv01, 0),
            "wavg_mod_duration": round(sum(r["mod_duration"] * r["mv_usd_m"] for r in rows) / (agg_mv / 1e6), 3) if agg_mv else None,
        },
        "bonds": rows,
        "rate_shock_table": shock_table,
        "leverage_screen": leverage,
        "spread_source_note": DEFAULT_SPREAD_BASIS if "hand_authored_default" in spread_sources else "All spreads from the supplied live OAS map.",
        "methodology": (
            "ytm = base rate + bucket spread (live OAS map when supplied, else labeled hand-authored defaults). "
            "Closed-form annual-pay bullet pricing; Macaulay/modified duration; DV01_$ = ModD x MV x 1bp. Rate shocks "
            "reprice FULLY at the shocked ytm (not the duration approximation); steepener: tenor <= 5y -50bp, > 5y +50bp "
            "(labeled convention). Deterministic — no PRNG."
        ),
        "label": EXTRACT_LABEL,
    }


@router.post("/refi-economics", summary="Green-refi advantage, call/make-whole breakeven, tender + new-issue combo")
def refi_economics(req: RefiEconomicsRequest) -> dict:
    bonds = [b for b in _filter_bonds(req.issuer, req.currency) if b["maturity_year"] <= req.horizon_year]
    if not bonds:
        raise HTTPException(status_code=404, detail=f"No bonds maturing on or before {req.horizon_year} for these filters.")
    rows = []
    tot = {"size_bn": 0.0, "green_saving_musd_yr": 0.0, "tender_upfront_musd": 0.0, "tender_saving_musd_yr": 0.0}
    for b in bonds:
        spr_pp, src = _spread_pp(b["rating_bucket"], req.bucket_oas_pp)
        refi_conv = req.base_rate_pct + req.rate_stress_bp / 100.0 + spr_pp + req.spread_stress_bp / 100.0
        green_eligible = b["label"] in ("green", "slb")
        refi_green = refi_conv - (req.greenium_bp / 100.0 if green_eligible else 0.0)
        green_saving_musd = (refi_conv - refi_green) / 100.0 * b["size_bn"] * 1000.0  # $M/yr
        # Call breakeven (documented in module docstring)
        tenor = _tenor(b)
        premium_pp = req.call_price_pct - 100.0
        premium_amort_pp = premium_pp / tenor if tenor > 0 else premium_pp
        breakeven_rate = refi_green + premium_amort_pp
        call_verdict = None
        if req.expected_future_rate_pct is not None:
            call_verdict = "refi_now" if req.expected_future_rate_pct > breakeven_rate else "wait"
        # Tender + new issue combo
        part = req.tender_participation_pct / 100.0
        tendered_bn = b["size_bn"] * part
        upfront_musd = tendered_bn * (req.tender_price_pct - 100.0) / 100.0 * 1000.0
        annual_saving_musd = (b["coupon_pct"] - refi_green) / 100.0 * tendered_bn * 1000.0
        payback_years = (upfront_musd / annual_saving_musd) if annual_saving_musd > 1e-9 else None
        rows.append({
            "id": b["id"], "issuer": b["issuer"], "ticker": b["ticker"], "label": b["label"],
            "coupon_pct": b["coupon_pct"], "maturity_year": b["maturity_year"], "size_bn": b["size_bn"],
            "rating_bucket": b["rating_bucket"], "spread_source": src,
            "refi_coupon_conventional_pct": round(refi_conv, 3),
            "green_eligible": green_eligible,
            "refi_coupon_green_pct": round(refi_green, 3),
            "greenium_saving_musd_yr": round(green_saving_musd, 2),
            "call": {
                "call_price_pct": req.call_price_pct,
                "premium_amortised_pp_yr": round(premium_amort_pp, 3),
                "breakeven_future_rate_pct": round(breakeven_rate, 3),
                "verdict": call_verdict,
            },
            "tender_combo": {
                "tendered_bn": round(tendered_bn, 3),
                "upfront_cost_musd": round(upfront_musd, 1),
                "annual_saving_musd": round(annual_saving_musd, 1),
                "payback_years": round(payback_years, 1) if payback_years is not None else None,
            },
        })
        tot["size_bn"] += b["size_bn"]
        tot["green_saving_musd_yr"] += green_saving_musd
        tot["tender_upfront_musd"] += upfront_musd
        tot["tender_saving_musd_yr"] += annual_saving_musd
    return {
        "inputs": req.model_dump(),
        "bond_count": len(rows),
        "totals": {k: round(v, 2) for k, v in tot.items()},
        "bonds": rows,
        "methodology": {
            "green_refi": (
                "Green/SLB-labeled bonds refinance at refi_conventional - greenium_bp. Greenium default 5bp is a "
                "LABELED emerging-market observation (typical IG greenium 2-8bp) — user-adjustable, not a market quote."
            ),
            "call_breakeven": (
                "Refi now: pay (call_price - 100) premium, lock refi coupon today. Wait: refinance at maturity at the "
                "then rate. Breakeven r* = refi_coupon_now + premium/(remaining tenor) (straight-line pp/yr, documented). "
                "Expected future rate > r* => calling now wins."
            ),
            "tender_combo": (
                "Upfront = participation x size x (tender_price - 100)/100; tendered amount reissued at the green-adjusted "
                "refi coupon; payback = upfront / annual coupon saving."
            ),
        },
        "label": EXTRACT_LABEL,
    }


@router.post("/transition-overlay", summary="Transition capex funding-gap, green-share-of-ladder trend, climate-spread stressed wall cost")
def transition_overlay(req: TransitionOverlayRequest) -> dict:
    bonds = list(BONDS)
    issuers_all = sorted({b["issuer"] for b in bonds})
    conf = req.issuer_transition or {}
    rows = []
    tot_gap = 0.0
    tot_stress_delta = 0.0
    for issuer_name in issuers_all:
        ib = [b for b in bonds if b["issuer"] == issuer_name]
        wall = [b for b in ib if b["maturity_year"] <= req.horizon_year]
        wall_bn = sum(b["size_bn"] for b in wall)
        green_bn = sum(b["size_bn"] for b in ib if b["label"] in ("green", "slb"))
        c = conf.get(issuer_name, {})
        capex = float(c.get("capex_bn", 0.0))
        score = float(c.get("risk_score", 50.0))
        # Funding-source mix: refi window supplies min(wall, capex); remainder is new money.
        refi_funded = min(wall_bn, capex)
        gap_bn = capex - refi_funded
        # Climate-spread overlay: stressed refi spread on each wall bond
        stress_pp = score * req.spread_slope_bp_per_point / 100.0
        base_cost = 0.0
        stressed_cost = 0.0
        for b in wall:
            spr_pp, _src = _spread_pp(b["rating_bucket"], req.bucket_oas_pp)
            base_cost += (req.base_rate_pct + spr_pp) / 100.0 * b["size_bn"] * 1000.0     # $M/yr
            stressed_cost += (req.base_rate_pct + spr_pp + stress_pp) / 100.0 * b["size_bn"] * 1000.0
        rows.append({
            "issuer": issuer_name, "ticker": ib[0]["ticker"], "sector": ib[0]["sector"],
            "total_bn": round(sum(b["size_bn"] for b in ib), 2),
            "wall_to_horizon_bn": round(wall_bn, 2),
            "green_slb_share_pct": round(green_bn / sum(b["size_bn"] for b in ib) * 100.0, 1),
            "transition_capex_bn": capex,
            "capex_refinance_fundable_bn": round(refi_funded, 2),
            "funding_gap_bn": round(gap_bn, 2),
            "risk_score": score,
            "score_source": "user_input" if issuer_name in conf else "default_50 (labeled)",
            "stressed_spread_addon_bp": round(stress_pp * 100.0, 0),
            "wall_refi_cost_base_musd_yr": round(base_cost, 1),
            "wall_refi_cost_stressed_musd_yr": round(stressed_cost, 1),
            "stressed_cost_delta_musd_yr": round(stressed_cost - base_cost, 1),
        })
        tot_gap += gap_bn
        tot_stress_delta += stressed_cost - base_cost
    # Green-share-of-ladder trend: per maturity year, green/slb share of maturing size
    years = sorted({b["maturity_year"] for b in bonds})
    trend = []
    for y in years:
        in_y = [b for b in bonds if b["maturity_year"] == y]
        t = sum(b["size_bn"] for b in in_y)
        g = sum(b["size_bn"] for b in in_y if b["label"] in ("green", "slb"))
        trend.append({"year": y, "total_bn": round(t, 2), "green_slb_bn": round(g, 2),
                      "green_share_pct": round(g / t * 100.0, 1) if t else None})
    return {
        "inputs": req.model_dump(),
        "issuers": rows,
        "totals": {"funding_gap_bn": round(tot_gap, 2), "stressed_cost_delta_musd_yr": round(tot_stress_delta, 1)},
        "green_share_trend": trend,
        "methodology": (
            "Funding-gap: refi windows <= horizon can recycle min(wall, capex) into transition uses; the remainder is "
            "new-money need (screening identity — assumes 100% of refi volume is redirectable, labeled optimistic bound). "
            "Climate-spread overlay: stressed refi spread = bucket spread + risk_score x "
            f"{req.spread_slope_bp_per_point}bp/point (LABELED MODEL ASSUMPTION, user-adjustable slope); wall cost delta "
            "= stressed - base annual interest on the wall at base rate + spread. Green-share trend is pure aggregation "
            "of the extract's green/slb labels by maturity year."
        ),
        "label": EXTRACT_LABEL,
    }
