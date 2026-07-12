"""
Green Bond Analytics — curve, relative-value & dual-tranche engine (NX2-04 backend)
===================================================================================
Prefix: /api/v1/green-bond-analytics
Tags:   Green Bond Analytics

Server-side math for the Green Bond Pricing Desk (frontend page
green-bond-pricing-desk). Everything here is deterministic, closed-form or
iterative-solver math over USER-SUPPLIED curve points and bond terms. No PRNG,
no fabricated market levels: the desk page supplies the benchmark points it
wants to price against (or pulls them from FRED elsewhere) and this engine
does the fixed-income arithmetic.

POST /curve-spreads   — par-curve bootstrap (documented linear-on-zero-rates
                        method), YTM, G-spread, I-spread, Z-spread (bisection
                        over the bootstrapped zero curve, round-trip check
                        included in the response), par-par ASW proxy
POST /relative-value  — comparable-bond OLS (spread vs tenor), optional green
                        dummy regression, matched-pair greenium, cheap/dear
                        residual for the new issue
POST /dual-tranche    — EUR vs USD tranche comparison on two user curves with
                        a user cross-currency basis (sign convention stated)

Methodology notes (all stated, all parameters user-supplied):

1. BOOTSTRAP (linear-on-zero-rates): benchmark par points (4-6) are solved
   sequentially into zero rates. For pillar k with par rate c_k and tenor T_k,
   the candidate zero z_k completes a zero curve defined as LINEAR
   INTERPOLATION ON ZERO RATES over the already-solved pillars plus (T_k, z_k)
   (flat extrapolation outside the pillar range). z_k is solved by bisection
   so the par bond (annual coupons at T_k, T_k-1, ...) prices to exactly 100.
   Discounting is annual-compounding: DF(t) = (1 + z(t))^-t.

2. CASHFLOW CONVENTION: annual coupons; for maturity M (years, may be
   fractional) coupons fall at t = M, M-1, ..., first t > 0. Final flow
   includes 100 redemption. Price inputs are per 100 (dirty ~ clean under
   this stylised integer-period convention — stated simplification).

3. Z-SPREAD: the constant s (decimal) solving
       price = sum_i CF_i * (1 + z(t_i) + s)^(-t_i)
   over the bootstrapped zero curve, found by BISECTION on s in
   [-0.20, +0.50] to |price error| < 1e-8 (documented; the response echoes a
   round-trip repricing at the solved s so the caller can verify).

4. G-SPREAD = YTM - linearly-interpolated benchmark PAR yield at the bond
   maturity (desk convention: interpolation on the quoted par points).
   I-SPREAD = YTM - linearly-interpolated swap rate at the bond maturity.

5. ASW PROXY (par-par): a = c - s_M + (1 - P/100) / A_sw, in decimals, where
   A_sw = sum of swap-curve discount factors at the bond's coupon dates with
   swap rates TREATED AS ZERO RATES (stated proxy — a full ASW needs a
   bootstrapped swap discount curve). Reported in bp.

6. OLS: spread_bp = alpha + beta * tenor over the comp set (closed-form
   normal equations); R^2, standard error, per-comp residuals returned. The
   optional green-dummy regression spread = a + b*tenor + g*is_green solves
   the 3x3 normal equations exactly; g is a regression estimate of the
   greenium controlling for tenor. Matched-pair greenium: each green comp is
   paired with the nearest-tenor conventional comp within a user tolerance
   (default 2.0y); greenium = mean(green spread - conventional spread).

7. DUAL-TRANCHE: each leg gets the full /curve-spreads treatment on its own
   curve. The user cross-currency basis (bp) is ADDED to the USD-leg Z-spread
   to express it in EUR terms (stated sign convention:
   eur_equivalent = z_usd + basis, with the EUR/USD basis typically quoted
   negative). The engine takes the basis as an input — it never invents one.

No PRNG anywhere in this module.
"""
from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/green-bond-analytics", tags=["Green Bond Analytics"])

# ---------------------------------------------------------------------------
# Shared curve / cashflow / solver primitives (documented above)
# ---------------------------------------------------------------------------


def _interp_linear(points: List[Dict[str, float]], t: float, xk: str, yk: str) -> float:
    """Linear interpolation with flat extrapolation over sorted (xk, yk) points."""
    pts = sorted(points, key=lambda p: p[xk])
    if not pts:
        raise HTTPException(422, "empty curve point list")
    if t <= pts[0][xk]:
        return float(pts[0][yk])
    if t >= pts[-1][xk]:
        return float(pts[-1][yk])
    for a, b in zip(pts, pts[1:]):
        if a[xk] <= t <= b[xk]:
            w = (t - a[xk]) / (b[xk] - a[xk]) if b[xk] > a[xk] else 0.0
            return float(a[yk]) + w * (float(b[yk]) - float(a[yk]))
    return float(pts[-1][yk])  # pragma: no cover


def _coupon_times(maturity_y: float) -> List[float]:
    """Annual coupon times t = M, M-1, ... (first t > 0), ascending order."""
    times: List[float] = []
    t = float(maturity_y)
    while t > 1e-9:
        times.append(round(t, 6))
        t -= 1.0
    return sorted(times)


def _cashflows(coupon_pct: float, maturity_y: float) -> List[Dict[str, float]]:
    times = _coupon_times(maturity_y)
    if not times:
        raise HTTPException(422, "maturity must be positive")
    flows = [{"t": t, "cf": coupon_pct} for t in times]
    flows[-1]["cf"] += 100.0
    return flows


def _bisect(f, lo: float, hi: float, tol: float = 1e-10, max_iter: int = 200) -> float:
    """Plain bisection root-finder (documented solver for YTM / Z-spread /
    bootstrap zeros). Requires a sign change on [lo, hi]."""
    flo, fhi = f(lo), f(hi)
    if flo == 0.0:
        return lo
    if fhi == 0.0:
        return hi
    if flo * fhi > 0:
        raise HTTPException(
            422,
            f"solver bracket [{lo}, {hi}] does not straddle a root "
            f"(f(lo)={flo:.6g}, f(hi)={fhi:.6g}) — check curve/price inputs")
    for _ in range(max_iter):
        mid = 0.5 * (lo + hi)
        fm = f(mid)
        if abs(fm) < tol or (hi - lo) < 1e-14:
            return mid
        if flo * fm < 0:
            hi, fhi = mid, fm
        else:
            lo, flo = mid, fm
    return 0.5 * (lo + hi)


def _zero_fn(pillars: List[Dict[str, float]]):
    """Zero-rate function z(t): linear on zero rates across pillars, flat
    extrapolation (the documented interpolation convention)."""
    def z(t: float) -> float:
        return _interp_linear(pillars, t, "tenor_y", "zero_pct") / 100.0
    return z


def _bootstrap_zero_curve(benchmark: List[Dict[str, float]]) -> List[Dict[str, float]]:
    """Sequential par->zero bootstrap with linear-on-zero-rates interpolation
    (methodology note 1 in the module docstring)."""
    pillars_in = sorted(
        [{"tenor_y": float(p["tenor_y"]), "par_rate_pct": float(p["par_rate_pct"])} for p in benchmark],
        key=lambda p: p["tenor_y"])
    solved: List[Dict[str, float]] = []
    for pil in pillars_in:
        T, c = pil["tenor_y"], pil["par_rate_pct"]
        times = _coupon_times(T)

        def price_at(z_candidate: float) -> float:
            trial = solved + [{"tenor_y": T, "zero_pct": z_candidate * 100.0}]
            zf = _zero_fn(trial)
            pv = 0.0
            for t in times:
                cf = c + (100.0 if abs(t - times[-1]) < 1e-9 else 0.0)
                pv += cf * (1.0 + zf(t)) ** (-t)
            return pv - 100.0

        z_k = _bisect(price_at, -0.05, 1.0)
        solved.append({"tenor_y": T, "zero_pct": round(z_k * 100.0, 8), "par_rate_pct": c})
    return solved


def _pv_on_zero(flows: List[Dict[str, float]], zf, spread: float = 0.0) -> float:
    return sum(f["cf"] * (1.0 + zf(f["t"]) + spread) ** (-f["t"]) for f in flows)


def _ytm(flows: List[Dict[str, float]], price: float) -> float:
    return _bisect(lambda y: sum(f["cf"] * (1.0 + y) ** (-f["t"]) for f in flows) - price, -0.5, 2.0)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class CurvePoint(BaseModel):
    tenor_y: float = Field(..., gt=0, le=100)
    par_rate_pct: float = Field(..., ge=-2, le=50, description="Benchmark PAR yield (%)")


class SwapPoint(BaseModel):
    tenor_y: float = Field(..., gt=0, le=100)
    rate_pct: float = Field(..., ge=-2, le=50, description="Swap rate (%)")


class BondTerms(BaseModel):
    coupon_pct: float = Field(..., ge=0, le=30, description="Annual coupon (% of face)")
    maturity_y: float = Field(..., gt=0, le=100, description="Remaining maturity (years)")
    price_per_100: float = Field(..., gt=1, le=400, description="Bond price per 100 face")


class CurveSpreadsRequest(BaseModel):
    benchmark_curve: List[CurvePoint] = Field(..., min_length=2, max_length=12,
                                              description="4-6 benchmark par points recommended")
    swap_curve: List[SwapPoint] = Field(..., min_length=2, max_length=12)
    bond: BondTerms


class CompBond(BaseModel):
    name: str = Field(..., min_length=1)
    tenor_y: float = Field(..., gt=0, le=100)
    spread_bp: float = Field(..., ge=-200, le=3000)
    green: bool = False


class RelativeValueRequest(BaseModel):
    comps: List[CompBond] = Field(..., min_length=3, max_length=20)
    new_issue_tenor_y: float = Field(..., gt=0, le=100)
    new_issue_spread_bp: float = Field(..., ge=-200, le=3000)
    pair_tenor_tolerance_y: float = Field(2.0, gt=0, le=10,
                                          description="Max tenor distance for green/conventional matched pairs")


class TrancheLeg(BaseModel):
    label: str = Field(..., min_length=1)
    currency: str = Field(..., min_length=3, max_length=3)
    bond: BondTerms
    benchmark_curve: List[CurvePoint] = Field(..., min_length=2, max_length=12)
    swap_curve: List[SwapPoint] = Field(..., min_length=2, max_length=12)


class DualTrancheRequest(BaseModel):
    eur_leg: TrancheLeg
    usd_leg: TrancheLeg
    xccy_basis_bp: float = Field(
        ..., ge=-200, le=200,
        description="EUR/USD cross-currency basis (bp), USER-SUPPLIED. Stated "
                    "convention: eur_equivalent_of_usd = z_usd + basis (basis "
                    "typically negative for EUR/USD).")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


def _curve_spread_block(bench: List[Dict[str, float]], swaps: List[Dict[str, float]],
                        bond: BondTerms) -> Dict[str, Any]:
    """Full spread stack for one bond on one curve pair (shared by
    /curve-spreads and /dual-tranche)."""
    zero_pillars = _bootstrap_zero_curve(bench)
    zf = _zero_fn(zero_pillars)
    flows = _cashflows(bond.coupon_pct, bond.maturity_y)
    price = bond.price_per_100

    ytm = _ytm(flows, price)                                       # decimal
    par_at_m = _interp_linear(bench, bond.maturity_y, "tenor_y", "par_rate_pct")
    swap_at_m = _interp_linear(swaps, bond.maturity_y, "tenor_y", "rate_pct")
    g_spread_bp = (ytm * 100.0 - par_at_m) * 100.0
    i_spread_bp = (ytm * 100.0 - swap_at_m) * 100.0

    # Z-spread by bisection over the bootstrapped zero curve + round-trip
    z_spread = _bisect(lambda s: _pv_on_zero(flows, zf, s) - price, -0.20, 0.50)
    reprice = _pv_on_zero(flows, zf, z_spread)
    round_trip_err = reprice - price

    # ASW proxy (par-par; swap rates treated as zero rates — stated proxy)
    def swap_df(t: float) -> float:
        return (1.0 + _interp_linear(swaps, t, "tenor_y", "rate_pct") / 100.0) ** (-t)
    annuity_sw = sum(swap_df(f["t"]) for f in flows)
    asw = (bond.coupon_pct / 100.0) - (swap_at_m / 100.0) + (1.0 - price / 100.0) / annuity_sw
    asw_bp = asw * 1e4

    # Zero curve sampled for charting (0.5y grid to last pillar)
    t_max = max(p["tenor_y"] for p in zero_pillars)
    grid = []
    t = 0.5
    while t <= t_max + 1e-9:
        grid.append({"tenor_y": round(t, 2), "zero_pct": round(zf(t) * 100.0, 4)})
        t += 0.5

    return {
        "bond": bond.model_dump(),
        "ytm_pct": round(ytm * 100.0, 6),
        "spreads_bp": {
            "g_spread": round(g_spread_bp, 3),
            "i_spread": round(i_spread_bp, 3),
            "z_spread": round(z_spread * 1e4, 3),
            "asw_proxy": round(asw_bp, 3),
        },
        "curve": {
            "zero_pillars": zero_pillars,
            "zero_grid": grid,
            "bootstrap_method": "sequential par->zero bootstrap; LINEAR interpolation ON ZERO RATES between pillars, flat extrapolation; DF(t)=(1+z(t))^-t annual compounding (documented)",
            "benchmark_par_at_maturity_pct": round(par_at_m, 4),
            "swap_rate_at_maturity_pct": round(swap_at_m, 4),
            "swap_annuity_factor": round(annuity_sw, 6),
        },
        "z_spread_round_trip": {
            "solved_z_spread_bp": round(z_spread * 1e4, 4),
            "reprice_at_solved_z": round(reprice, 8),
            "market_price": price,
            "abs_error": round(abs(round_trip_err), 10),
            "passes_pm_0_01": abs(round_trip_err) <= 0.01,
            "solver": "bisection on s in [-0.20, +0.50], tol 1e-10, <=200 iterations (documented)",
        },
        "conventions": {
            "cashflows": "annual coupons at t = M, M-1, ... (first t>0); final flow +100 redemption; price per 100 (stated simplification)",
            "g_spread": "YTM - linearly interpolated benchmark PAR yield at maturity",
            "i_spread": "YTM - linearly interpolated swap rate at maturity",
            "asw_proxy": "par-par: c - s_M + (1 - P/100)/A_sw with swap rates treated as zero rates for A_sw (stated proxy)",
        },
    }


@router.post("/curve-spreads")
def curve_spreads(req: CurveSpreadsRequest) -> Dict[str, Any]:
    """Bootstrap + full spread stack (G / I / Z / ASW proxy) with round-trip check."""
    out = _curve_spread_block(
        [p.model_dump() for p in req.benchmark_curve],
        [p.model_dump() for p in req.swap_curve],
        req.bond)
    out["engine"] = "green_bond_analytics /curve-spreads (deterministic solvers; no PRNG)"
    out["computed_at"] = datetime.now(timezone.utc).isoformat()
    return out


@router.post("/relative-value")
def relative_value(req: RelativeValueRequest) -> Dict[str, Any]:
    """Comp-set OLS (spread vs tenor), green-dummy regression, matched-pair
    greenium, and cheap/dear residual for the new issue."""
    comps = req.comps
    n = len(comps)
    xs = [c.tenor_y for c in comps]
    ys = [c.spread_bp for c in comps]

    # ── Simple OLS: spread = alpha + beta*tenor (closed-form) ───────────────
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    if sxx <= 1e-12:
        raise HTTPException(422, "all comp tenors identical — cannot regress spread on tenor")
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    beta = sxy / sxx
    alpha = my - beta * mx
    fitted = [alpha + beta * x for x in xs]
    resid = [y - f for y, f in zip(ys, fitted)]
    ss_res = sum(r ** 2 for r in resid)
    ss_tot = sum((y - my) ** 2 for y in ys)
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 1e-12 else 1.0
    dof = max(n - 2, 1)
    se_resid = math.sqrt(ss_res / dof)

    ni_fitted = alpha + beta * req.new_issue_tenor_y
    ni_resid = req.new_issue_spread_bp - ni_fitted
    # positive residual = trades WIDE of the comp curve = CHEAP (investor view)
    verdict = "cheap" if ni_resid > se_resid else ("dear" if ni_resid < -se_resid else "fair")

    # ── Green-dummy regression: spread = a + b*tenor + g*green (3x3 exact) ──
    greens = [1.0 if c.green else 0.0 for c in comps]
    dummy_block: Optional[Dict[str, Any]] = None
    n_green = sum(greens)
    if 0 < n_green < n:
        # Normal equations X'X w = X'y with X = [1, tenor, green]
        s1, sx, sg = float(n), sum(xs), sum(greens)
        sxx2 = sum(x * x for x in xs)
        sxg = sum(x * g for x, g in zip(xs, greens))
        sgg = sum(g * g for g in greens)
        sy, sxy2, sgy = sum(ys), sum(x * y for x, y in zip(xs, ys)), sum(g * y for g, y in zip(greens, ys))
        A = [[s1, sx, sg], [sx, sxx2, sxg], [sg, sxg, sgg]]
        b = [sy, sxy2, sgy]
        det = (A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1])
               - A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0])
               + A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]))
        if abs(det) > 1e-9:
            def solve3(A, b):
                import copy
                out = []
                for col in range(3):
                    M = copy.deepcopy(A)
                    for r in range(3):
                        M[r][col] = b[r]
                    d = (M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
                         - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
                         + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]))
                    out.append(d / det)
                return out
            a3, b3, g3 = solve3(A, b)
            fit3 = [a3 + b3 * x + g3 * g for x, g in zip(xs, greens)]
            ssr3 = sum((y - f) ** 2 for y, f in zip(ys, fit3))
            r2_3 = 1.0 - ssr3 / ss_tot if ss_tot > 1e-12 else 1.0
            dummy_block = {
                "alpha_bp": round(a3, 3), "beta_bp_per_y": round(b3, 3),
                "greenium_coefficient_bp": round(g3, 3), "r_squared": round(r2_3, 4),
                "note": "gamma on the green dummy = tenor-controlled regression greenium (negative = green trades tighter)",
            }

    # ── Matched-pair greenium ───────────────────────────────────────────────
    pairs = []
    for gc in [c for c in comps if c.green]:
        candidates = [c for c in comps if not c.green and abs(c.tenor_y - gc.tenor_y) <= req.pair_tenor_tolerance_y]
        if candidates:
            best = min(candidates, key=lambda c: abs(c.tenor_y - gc.tenor_y))
            pairs.append({
                "green": gc.name, "conventional": best.name,
                "tenor_gap_y": round(abs(best.tenor_y - gc.tenor_y), 2),
                "greenium_bp": round(gc.spread_bp - best.spread_bp, 2),
            })
    pair_greenium = round(sum(p["greenium_bp"] for p in pairs) / len(pairs), 3) if pairs else None

    return {
        "ols": {
            "model": "spread_bp = alpha + beta * tenor_y (closed-form OLS over the comp set)",
            "alpha_bp": round(alpha, 4), "beta_bp_per_y": round(beta, 4),
            "r_squared": round(r2, 4), "residual_std_error_bp": round(se_resid, 3),
            "n_comps": n,
        },
        "comps": [
            {"name": c.name, "tenor_y": c.tenor_y, "spread_bp": c.spread_bp, "green": c.green,
             "fitted_bp": round(f, 2), "residual_bp": round(r, 2)}
            for c, f, r in zip(comps, fitted, resid)
        ],
        "new_issue": {
            "tenor_y": req.new_issue_tenor_y, "spread_bp": req.new_issue_spread_bp,
            "fitted_bp": round(ni_fitted, 3), "residual_bp": round(ni_resid, 3),
            "verdict": verdict,
            "verdict_rule": "cheap if residual > +1 residual-SE; dear if < -1 SE; else fair (stated convention)",
        },
        "green_dummy_regression": dummy_block,
        "matched_pair_greenium": {
            "pairs": pairs,
            "mean_greenium_bp": pair_greenium,
            "method": f"each green comp paired with nearest-tenor conventional comp within {req.pair_tenor_tolerance_y}y (documented)",
        },
        "engine": "green_bond_analytics /relative-value (closed-form OLS; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/dual-tranche")
def dual_tranche(req: DualTrancheRequest) -> Dict[str, Any]:
    """EUR vs USD tranche comparison, same credit, user xccy basis."""
    legs = {}
    for key, leg in (("eur", req.eur_leg), ("usd", req.usd_leg)):
        legs[key] = {
            "label": leg.label, "currency": leg.currency.upper(),
            **_curve_spread_block(
                [p.model_dump() for p in leg.benchmark_curve],
                [p.model_dump() for p in leg.swap_curve], leg.bond),
        }
    z_eur = legs["eur"]["spreads_bp"]["z_spread"]
    z_usd = legs["usd"]["spreads_bp"]["z_spread"]
    usd_in_eur = z_usd + req.xccy_basis_bp
    delta = z_eur - usd_in_eur
    return {
        "legs": legs,
        "cross_currency": {
            "xccy_basis_bp": req.xccy_basis_bp,
            "convention": "eur_equivalent_of_usd_z = z_usd + basis (basis USER-SUPPLIED; typically negative for EUR/USD) — stated sign convention",
            "usd_z_in_eur_equiv_bp": round(usd_in_eur, 3),
            "eur_z_bp": round(z_eur, 3),
            "eur_minus_usd_equiv_bp": round(delta, 3),
            "issuer_funding_verdict": (
                "EUR tranche cheaper funding" if delta < 0
                else ("USD tranche cheaper funding (after basis)" if delta > 0 else "indifferent")),
        },
        "engine": "green_bond_analytics /dual-tranche (per-leg bootstrap + Z-spread; no PRNG)",
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }
