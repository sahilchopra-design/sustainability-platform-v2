"""
Tests — Methane & Fugitive Emissions Engine (E58)
====================================================
Regression coverage for calculate_methane_gwp_impact(), specifically the
significance_flag which previously was tautological (always True for any
positive CH4/N2O input because GWP-20/GWP-100 for any real gas blend is
always >= 1.0, i.e. > the 0.10 comparison threshold it was checked against).
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.methane_fugitive_engine import (
    calculate_methane_gwp_impact,
    GHG_SIGNIFICANT_SOURCE_THRESHOLD_T_CO2E_PA,
)


class TestMethaneGWPSignificanceFlag:
    """significance_flag must discriminate material from immaterial fugitive
    emissions sources using an absolute, non-self-referential threshold."""

    def test_small_emissions_not_significant(self):
        # 1 tonne CH4/yr -> 0.08 kt CO2e (GWP-20) = 80 tCO2e, well under the
        # 25,000 tCO2e/yr materiality bar.
        result = calculate_methane_gwp_impact("E-small", ch4_kt_pa=0.001, n2o_kt_pa=0.0)
        assert result["significance_flag"] is False

    def test_large_emissions_significant(self):
        # 500 tonnes CH4/yr -> 41.25 kt CO2e (GWP-20) = 41,250 tCO2e, above threshold.
        result = calculate_methane_gwp_impact("E-large", ch4_kt_pa=0.5, n2o_kt_pa=0.0)
        assert result["significance_flag"] is True

    def test_flag_is_not_tautological(self):
        """The old implementation (total_gwp20 > total_gwp100 * 0.10) was always
        True for any positive emissions. Verify small and large inputs now
        produce DIFFERENT flag outcomes, proving the flag actually discriminates."""
        small = calculate_methane_gwp_impact("E-tiny", ch4_kt_pa=0.0001, n2o_kt_pa=0.0)
        large = calculate_methane_gwp_impact("E-huge", ch4_kt_pa=5.0, n2o_kt_pa=0.0)
        assert small["significance_flag"] is False
        assert large["significance_flag"] is True
        assert small["significance_flag"] != large["significance_flag"]

    def test_zero_emissions_not_significant(self):
        result = calculate_methane_gwp_impact("E-zero", ch4_kt_pa=0.0, n2o_kt_pa=0.0)
        assert result["significance_flag"] is False

    def test_threshold_boundary(self):
        # Solve ch4_kt_pa such that GWP-20 kt CO2e * 1000 == threshold exactly.
        boundary_ch4_kt = GHG_SIGNIFICANT_SOURCE_THRESHOLD_T_CO2E_PA / 1000 / 82.5
        result = calculate_methane_gwp_impact("E-boundary", ch4_kt_pa=boundary_ch4_kt, n2o_kt_pa=0.0)
        assert result["significance_flag"] is True  # >= threshold is significant

        just_under = calculate_methane_gwp_impact(
            "E-just-under", ch4_kt_pa=boundary_ch4_kt * 0.999, n2o_kt_pa=0.0
        )
        assert just_under["significance_flag"] is False
