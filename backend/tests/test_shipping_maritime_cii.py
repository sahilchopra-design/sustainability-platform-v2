"""
Regression tests for ShippingMaritimeEngine.calculate_cii — CII reference line formula.

Background
----------
The CII reference line must follow IMO Resolution MEPC.353(78), "2022 Guidelines
on the Reference Lines for use with Operational Carbon Intensity Indicators
(CII Reference Lines Guidelines, G2)", Annex, Table 1:

    CIIref = a * Capacity^(-c)

Prior to this fix, services/shipping_maritime_engine.py approximated the
reference line as ``coeff / sqrt(DWT)`` — i.e. it silently assumed c=0.5 for
every ship type. The true exponent varies by ship type (0.383-0.639 per
MEPC.353(78) Table 1), so the sqrt approximation mis-stated the reference line
for every vessel type except (coincidentally) none of them, since none of the
official exponents equal 0.5.

These tests assert the engine's reference line matches ``a * DWT^(-c)``
computed directly from the official MEPC.353(78) Table 1 parameters, and that
the sqrt approximation (the pre-fix behaviour) would have produced a
materially different, incorrect value.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.shipping_maritime_engine import ShippingMaritimeEngine, VESSEL_TYPES


engine = ShippingMaritimeEngine()


def _official_mepc_reference(a: float, c: float, capacity: float) -> float:
    """CIIref = a * Capacity^(-c), per MEPC.353(78) Annex, Table 1, Eq.(1)."""
    return a * (capacity ** -c)


def _implied_engine_reference(result) -> float:
    """Back out the pre-reduction CII reference line from a CIIResult.

    calculate_cii() only returns cii_required (post-2023-2030-reduction), so we
    reverse the reduction factor applied for `result.year` to recover the raw
    CIIref the engine computed internally.
    """
    return result.cii_required / (1.0 - result.reduction_target_pct / 100.0)


class TestCIIReferenceLineFormula:
    """CIIref must equal a * Capacity^(-c), not coeff / sqrt(Capacity)."""

    def test_bulk_carrier_60k_dwt_matches_mepc_353_78(self):
        """Known case: ~60,000 DWT bulk carrier.

        MEPC.353(78) Table 1: Bulk carrier -> a=4745, c=0.622 (DWT capacity).
        """
        dwt = 60_000.0
        a, c = 4745.0, 0.622
        expected_ref = _official_mepc_reference(a, c, dwt)  # ~5.0609 gCO2/dwt-nm

        result = engine.calculate_cii(
            entity_id="TEST-BULKER-60K",
            vessel_type="bulk_carrier",
            dwt=dwt,
            distance_nm=50_000,
            fuel_consumed_t=3_000,
            fuel_type="HFO",
            year=2023,
        )
        implied_ref = _implied_engine_reference(result)

        assert implied_ref == pytest.approx(expected_ref, rel=1e-3), (
            f"Engine CII reference ({implied_ref}) must match MEPC.353(78) "
            f"a*Capacity^-c formula ({expected_ref}) for a 60k DWT bulk carrier"
        )

        # The old coeff/sqrt(DWT) approximation (i.e. c forced to 0.5) is a
        # materially different, non-conformant value — assert the engine no
        # longer produces it.
        sqrt_approx_ref = a / (dwt ** 0.5)  # legacy buggy formula
        assert implied_ref != pytest.approx(sqrt_approx_ref, rel=1e-3)
        assert abs(implied_ref - sqrt_approx_ref) / sqrt_approx_ref > 0.20, (
            "Fixed reference line should diverge materially (>20%) from the "
            "old sqrt(DWT) approximation for a 60k DWT bulk carrier"
        )

    def test_tanker_matches_mepc_353_78(self):
        """MEPC.353(78) Table 1: Tanker -> a=5247, c=0.610 (DWT)."""
        dwt = 100_000.0
        a, c = 5247.0, 0.610
        expected_ref = _official_mepc_reference(a, c, dwt)

        result = engine.calculate_cii(
            entity_id="TEST-TANKER-100K",
            vessel_type="tanker",
            dwt=dwt,
            distance_nm=80_000,
            fuel_consumed_t=6_000,
            fuel_type="VLSFO",
            year=2023,
        )
        implied_ref = _implied_engine_reference(result)
        assert implied_ref == pytest.approx(expected_ref, rel=1e-3)

    def test_container_matches_mepc_353_78(self):
        """MEPC.353(78) Table 1: Container ship -> a=1984, c=0.489 (DWT)."""
        dwt = 80_000.0
        a, c = 1984.0, 0.489
        expected_ref = _official_mepc_reference(a, c, dwt)

        result = engine.calculate_cii(
            entity_id="TEST-CONTAINER-80K",
            vessel_type="container",
            dwt=dwt,
            distance_nm=90_000,
            fuel_consumed_t=8_000,
            fuel_type="VLSFO",
            year=2023,
        )
        implied_ref = _implied_engine_reference(result)
        assert implied_ref == pytest.approx(expected_ref, rel=1e-3)

    def test_cruise_matches_mepc_353_78(self):
        """MEPC.353(78) Table 1: Cruise passenger ship -> a=930, c=0.383 (GT).

        The engine takes a single `dwt`-style capacity argument for all ship
        types; for this regression we simply confirm it is applying the
        cruise-specific (a, c) pair rather than sqrt(capacity).
        """
        capacity = 120_000.0
        a, c = 930.0, 0.383
        expected_ref = _official_mepc_reference(a, c, capacity)

        result = engine.calculate_cii(
            entity_id="TEST-CRUISE-120K",
            vessel_type="cruise",
            dwt=capacity,
            distance_nm=40_000,
            fuel_consumed_t=15_000,
            fuel_type="MDO",
            year=2023,
        )
        implied_ref = _implied_engine_reference(result)
        assert implied_ref == pytest.approx(expected_ref, rel=1e-3)

    def test_vessel_types_carry_explicit_exponent(self):
        """Every vessel type must define its own MEPC.353(78) c exponent —
        no implicit c=0.5 sqrt fallback should remain in the reference table.
        """
        for vessel_type, params in VESSEL_TYPES.items():
            assert "cii_reference_c" in params, (
                f"{vessel_type} is missing an explicit cii_reference_c exponent"
            )
            c = params["cii_reference_c"]
            assert 0.0 < c < 1.0, f"{vessel_type} cii_reference_c={c} out of expected MEPC.353(78) range"
            assert c != 0.5, (
                f"{vessel_type} still uses c=0.5 (the old sqrt(DWT) approximation)"
            )
