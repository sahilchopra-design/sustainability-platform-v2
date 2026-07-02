"""
Integration test: re-clvar route <-> real engine wiring.

Confirms every endpoint handler actually invokes the real RECLVaREngine /
CRREMStrandingEngine (via their convenience wrappers) and maps results back —
i.e. the schema-reconciliation is correct and no endpoint 500s. Also checks the
honest-null contract: monetary CLVaR is null (and flagged) when no market value
is supplied, never fabricated.

Run:  python tests/test_re_clvar_wiring.py     (from backend/)
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.v1.routes.re_clvar import (  # noqa: E402
    calculate_re_clvar, assess_crrem_stranding, generate_crrem_roadmap,
    calculate_portfolio_clvar, get_crrem_pathways,
    PropertyCLVaRRequest, CRREMRequest, PortfolioCLVaRRequest,
    PropertyInfo, PhysicalInputs, TransitionInputs,
)

fails = []


def check(name, cond, detail=""):
    print(f"  [{'PASS' if cond else 'FAIL'}] {name} {detail}")
    if not cond:
        fails.append(name)


def _property(value=20_000_000.0):
    return PropertyInfo(
        property_id="PROP-001", property_type="office", country_iso="GB", region="London",
        gross_internal_area_m2=5000.0, year_built=1995, last_refurbishment_year=2015,
        current_valuation_gbp=value, loan_to_value=0.5,
    )


def _physical():
    return PhysicalInputs(
        flood_zone="B", flood_depth_100yr_m=0.4, heat_days_above_35c=12,
        wildfire_proximity_km=50.0, coastal_proximity_km=8.0,
        subsidence_risk="medium", water_stress_score=2.5,
    )


def _transition():
    return TransitionInputs(
        epc_rating="D", energy_intensity_kwh_m2=250.0, carbon_intensity_kgco2_m2=60.0,
        minimum_epc_required_2030="C", minimum_epc_required_2033="B",
        retrofit_feasibility="high", green_certification=None,
    )


def main():
    # 1. CLVaR with full inputs incl. market value -> pct + GBP populated
    print("== CLVaR (full inputs) ==")
    req = PropertyCLVaRRequest(property_info=_property(), physical_inputs=_physical(),
                               transition_inputs=_transition(), scenario="2C", horizon_years=10)
    r = asyncio.run(calculate_re_clvar(req))
    check("total_clvar_pct is a real fraction", isinstance(r.total_clvar_pct, float) and abs(r.total_clvar_pct) < 2.0,
          f"= {r.total_clvar_pct}")
    check("physical + transition present", r.physical_clvar_pct is not None and r.transition_clvar_pct is not None)
    check("GBP populated when market value supplied", r.total_clvar_gbp is not None, f"= {r.total_clvar_gbp}")
    check("risk_rating assigned", r.risk_rating in ("Low", "Medium", "High", "Very High"), f"= {r.risk_rating}")
    check("top_risk_drivers from engine hazard_contributions", len(r.top_risk_drivers) > 0,
          f"= {[d['hazard'] for d in r.top_risk_drivers]}")
    check("data_quality high (all inputs supplied)", r.validation_summary.data_quality_score >= 0.9,
          f"= {r.validation_summary.data_quality_score}")

    # 2. CLVaR WITHOUT market value -> honest null GBP + flagged (no fabrication)
    print("== CLVaR (no market value -> honest null GBP) ==")
    prop_nomv = _property(value=None)
    req2 = PropertyCLVaRRequest(property_info=prop_nomv, physical_inputs=_physical(),
                                transition_inputs=_transition(), scenario="1.5C", horizon_years=10)
    r2 = asyncio.run(calculate_re_clvar(req2))
    check("pct still computed without market value", r2.total_clvar_pct is not None)
    check("GBP is null (not fabricated) when no market value", r2.total_clvar_gbp is None)
    check("missing_fields flags current_valuation_gbp",
          "current_valuation_gbp" in r2.validation_summary.missing_fields)

    # 3. CRREM stranding -> real energy pathway + stranding logic
    print("== CRREM stranding ==")
    cr = CRREMRequest(property_info=_property(), transition_inputs=_transition(), scenario="1.5C")
    s = asyncio.run(assess_crrem_stranding(cr))
    check("pathway 2030 > pathway 2050 (decarbonisation)",
          s.pathway_intensity_2030_kwh_m2 > s.pathway_intensity_2050_kwh_m2,
          f"= {s.pathway_intensity_2030_kwh_m2} -> {s.pathway_intensity_2050_kwh_m2}")
    check("retrofit_urgency assigned",
          s.retrofit_urgency in ("immediate", "within_5yr", "within_10yr", "low"), f"= {s.retrofit_urgency}")
    check("is_stranded_today is bool", isinstance(s.is_stranded_today, bool))

    # 4. CRREM roadmap -> year-by-year to 2050
    print("== CRREM roadmap ==")
    rm = asyncio.run(generate_crrem_roadmap(cr))
    check("roadmap spans multiple years to 2050", len(rm.roadmap) > 10, f"= {len(rm.roadmap)} years")
    check("roadmap final year is 2050", rm.roadmap[-1].year == 2050)

    # 5. CRREM pathways lookup -> both scenarios, energy intensity
    print("== CRREM pathways ==")
    pw = asyncio.run(get_crrem_pathways("office", "GB"))
    check("pathway has 1.5C and 2C energy series", len(pw.pathway) > 10
          and pw.pathway[0].intensity_15c_kwh_m2 > 0 and pw.pathway[0].intensity_2c_kwh_m2 > 0)
    check("1.5C stricter than 2C by 2050 (lower intensity)",
          pw.pathway[-1].intensity_15c_kwh_m2 <= pw.pathway[-1].intensity_2c_kwh_m2,
          f"= 1.5C {pw.pathway[-1].intensity_15c_kwh_m2} <= 2C {pw.pathway[-1].intensity_2c_kwh_m2}")

    # 6. Portfolio CLVaR
    print("== Portfolio CLVaR ==")
    preq = PortfolioCLVaRRequest(properties=[req, req2], scenario="2C", horizon_years=10)
    pr = asyncio.run(calculate_portfolio_clvar(preq))
    check("per-property results for all inputs", len(pr.per_property) == 2)
    check("portfolio GBP null because one property lacks market value", pr.total_portfolio_clvar_gbp is None)

    print()
    print("RESULT:", "ALL PASS" if not fails else f"FAILURES: {fails}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
