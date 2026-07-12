"""
Unit tests for the EU Green Bond Standard (EU GBS) Art 5 "flexibility pocket".

Regulation (EU) 2023/2631 Art 5 allows up to 15% of a European Green Bond's
proceeds to be allocated to economic activities that meet the EU Taxonomy's
substantive requirements (DNSH + minimum safeguards) but for which technical
screening criteria (TSC) have not yet been adopted. Before this fix,
EUGBSEngine.assess_issuance()/assess_allocation_report() enforced a literal
100% taxonomy_alignment_pct (or 80% for sovereigns under the separate Art 21
derogation) with no pocket mechanism at all, meaning a bond with the
regulation-compliant 85% TSC-compliant core + 15% pocket split was always
flagged as a blocking compliance gap.

These tests pin the corrected 85%/15% behaviour:
  - 85% core + 15% pocket (conditions met) => compliant, matches 100% threshold
  - pocket claimed without conditions met => not credited, still a gap
  - pocket capped at 15% even if a larger amount is claimed
  - core alone must still reach (threshold - 15%) -- the pocket cannot cover
    more than its 15-point cap
  - unchanged backward-compatible behaviour when no pocket is used at all
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from services.eu_gbs_engine import (
    EUGBSEngine,
    IssuanceInput,
    AllocationReportInput,
    _FLEXIBILITY_POCKET_MAX_PCT,
    _TAXONOMY_THRESHOLD_STANDARD,
    _TAXONOMY_THRESHOLD_SOVEREIGN,
)


@pytest.fixture
def engine():
    return EUGBSEngine()


def _make_issuance(**kwargs) -> IssuanceInput:
    defaults = dict(
        bond_id="BOND1",
        issuer_name="Test Issuer",
        bond_type="senior_unsecured",
        principal_amount=100_000_000.0,
        taxonomy_alignment_pct=100.0,
        dnsh_confirmed=True,
        min_safeguards_confirmed=True,
        environmental_objectives=["CCM"],
        has_external_reviewer=True,
        er_name="ER1",
        has_pre_issuance_review=True,
        is_sovereign=False,
    )
    defaults.update(kwargs)
    return IssuanceInput(**defaults)


class TestFlexibilityPocketConstant:
    def test_pocket_cap_is_15_pct(self):
        assert _FLEXIBILITY_POCKET_MAX_PCT == 15.0


class TestIssuanceFlexibilityPocket:
    """POST-equivalent: EUGBSEngine.assess_issuance()."""

    def test_85_core_plus_15_pocket_is_compliant(self, engine):
        """The headline regulatory scenario: 85% TSC-compliant core + 15%
        Art 5 pocket (conditions met) must satisfy the 100% threshold."""
        inp = _make_issuance(
            taxonomy_alignment_pct=85.0,
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=True,
        )
        result = engine.assess_issuance(inp)
        assert result.effective_taxonomy_alignment_pct == pytest.approx(100.0)
        assert result.flexibility_pocket_pct_credited == pytest.approx(15.0)
        assert not any("Taxonomy" in g or "taxonomy" in g for g in result.blocking_gaps)
        assert result.overall_compliant is True

    def test_pocket_without_conditions_met_is_not_credited(self, engine):
        """Claiming a pocket allocation without confirming Art 5(1)
        conditions must NOT be credited -- otherwise issuers could bypass
        TSC compliance by simply declaring a pocket percentage."""
        inp = _make_issuance(
            taxonomy_alignment_pct=85.0,
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=False,
        )
        result = engine.assess_issuance(inp)
        assert result.flexibility_pocket_pct_credited == 0.0
        assert result.effective_taxonomy_alignment_pct == pytest.approx(85.0)
        assert result.overall_compliant is False
        assert any("100%" in g for g in result.blocking_gaps)

    def test_pocket_claim_exceeding_cap_is_truncated_to_15(self, engine):
        """A pocket claim above 15% must be capped, not taken at face value."""
        inp = _make_issuance(
            taxonomy_alignment_pct=80.0,
            flexibility_pocket_pct=25.0,
            flexibility_pocket_conditions_met=True,
        )
        result = engine.assess_issuance(inp)
        assert result.flexibility_pocket_pct_credited == pytest.approx(15.0)
        assert result.effective_taxonomy_alignment_pct == pytest.approx(95.0)
        assert any("15%" in w and "cap" in w for w in result.warnings)
        # 80 + 15 = 95% < 100% threshold -> still non-compliant
        assert result.overall_compliant is False

    def test_core_below_threshold_minus_pocket_cap_still_blocked(self, engine):
        """The pocket cannot rescue a core allocation below (threshold - 15%)
        even when the full 15% pocket is claimed and conditions are met --
        the pocket relaxes TSC only for its own 15 points, it does not
        lower the overall bar."""
        inp = _make_issuance(
            taxonomy_alignment_pct=70.0,
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=True,
        )
        result = engine.assess_issuance(inp)
        assert result.overall_compliant is False
        assert any("85%" in g for g in result.blocking_gaps)

    def test_100_pct_core_no_pocket_still_compliant_backward_compatible(self, engine):
        """Bonds that don't use the pocket at all (100% core) must behave
        exactly as before this fix."""
        inp = _make_issuance(taxonomy_alignment_pct=100.0)
        result = engine.assess_issuance(inp)
        assert result.effective_taxonomy_alignment_pct == pytest.approx(100.0)
        assert result.flexibility_pocket_pct_credited == 0.0
        assert result.overall_compliant is True

    def test_sovereign_pocket_floor_is_65_pct(self, engine):
        """Sovereign issuers get the Art 21 80% threshold; combined with the
        Art 5 pocket cap of 15 points, the TSC-compliant core floor for
        sovereigns is 80 - 15 = 65%."""
        inp = _make_issuance(
            taxonomy_alignment_pct=65.0,
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=True,
            is_sovereign=True,
        )
        result = engine.assess_issuance(inp)
        assert result.taxonomy_threshold_pct == pytest.approx(_TAXONOMY_THRESHOLD_SOVEREIGN)
        assert result.effective_taxonomy_alignment_pct == pytest.approx(80.0)
        assert not any("below the required 65%" in g for g in result.blocking_gaps)
        assert result.overall_compliant is True

    def test_gbfs_factsheet_discloses_pocket(self, engine):
        inp = _make_issuance(
            taxonomy_alignment_pct=85.0,
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=True,
        )
        gbfs = engine.generate_factsheet(inp)
        s2 = gbfs["section_2_use_of_proceeds"]
        assert s2["flexibility_pocket_pct_committed"] == 15.0
        assert s2["flexibility_pocket_conditions_met"] is True


class TestAllocationReportFlexibilityPocket:
    """Post-issuance allocation report — same Art 5 pocket mechanics."""

    def test_85_core_plus_15_pocket_allocation_report_compliant(self, engine):
        inp = AllocationReportInput(
            bond_id="BOND1",
            reporting_period="FY2026",
            total_allocated_pct=100.0,
            taxonomy_aligned_pct=85.0,
            allocation_by_objective={"CCM": 100.0},
            unallocated_pct=0.0,
            geographic_breakdown={"DE": 100.0},
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=True,
        )
        result = engine.assess_allocation_report(inp)
        assert result["compliant"] is True
        assert result["effective_taxonomy_aligned_pct"] == pytest.approx(100.0)
        assert result["flexibility_pocket_pct_credited"] == pytest.approx(15.0)
        assert result["gaps"] == []

    def test_allocation_report_without_pocket_conditions_flags_gap(self, engine):
        inp = AllocationReportInput(
            bond_id="BOND1",
            reporting_period="FY2026",
            total_allocated_pct=100.0,
            taxonomy_aligned_pct=85.0,
            allocation_by_objective={"CCM": 100.0},
            unallocated_pct=0.0,
            geographic_breakdown={"DE": 100.0},
            flexibility_pocket_pct=15.0,
            flexibility_pocket_conditions_met=False,
        )
        result = engine.assess_allocation_report(inp)
        assert result["compliant"] is False
        assert result["flexibility_pocket_pct_credited"] == 0.0
