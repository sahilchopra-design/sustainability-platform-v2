"""
Regression test for POST /api/v1/eu-ets/ets2-readiness
==========================================================
Guards against a bug where EUETSEngine.assess_ets2_readiness() referenced
module-level constants (ETS2_EMISSION_FACTORS / ETS2_PRICE_CORRIDOR /
ETS2_COMPLIANCE_CALENDAR) via `self.` instead of directly, which raised:

    AttributeError: 'EUETSEngine' object has no attribute 'ETS2_EMISSION_FACTORS'

...on every single call, meaning the endpoint always returned HTTP 500.

Uses FastAPI's TestClient to exercise the route through the real request
pipeline (router -> engine -> response model), not just the engine method
directly, so any regression at the routing/serialization layer is caught too.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

import middleware.auth_middleware as auth_mw

# This endpoint is a POST, which the auth middleware normally gates behind
# a valid session when REQUIRE_AUTH=true (set in this repo's .env). There is
# no session-issuing fixture in this test suite, so bypass the gate the same
# way local/dev mode does (REQUIRE_AUTH=false) for the duration of this
# module's tests, then restore whatever value was active before.
_ORIGINAL_REQUIRE_AUTH = auth_mw.REQUIRE_AUTH


def setup_module(_module):
    auth_mw.REQUIRE_AUTH = False


def teardown_module(_module):
    auth_mw.REQUIRE_AUTH = _ORIGINAL_REQUIRE_AUTH


@pytest.fixture(scope="module")
def client():
    from server import app
    return TestClient(app)


class TestEts2ReadinessEndpoint:
    """POST /api/v1/eu-ets/ets2-readiness"""

    def test_diesel_litres_request_returns_200(self, client):
        """Baseline request must not raise AttributeError / 500."""
        resp = client.post(
            "/api/v1/eu-ets/ets2-readiness",
            json={
                "entity_id": "E1",
                "entity_name": "Test Fuel Distributor",
                "fuel_type": "diesel",
                "annual_fuel_volume_litres": 100_000.0,
            },
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()

        assert data["entity_id"] == "E1"
        assert data["fuel_type"] == "diesel"
        assert data["ets2_eligible"] is True

        # 100,000 L * 2.640 kgCO2/L / 1000 = 264.0 tCO2
        assert data["annual_emissions_tco2"] == pytest.approx(264.0)
        # floor price (45 EUR) applies since default carbon_price_eur == floor
        assert data["estimated_allowance_cost_eur"] == pytest.approx(264.0 * 45.0)
        assert data["pass_through_potential_pct"] == 85.0  # road fuel
        assert 0.0 <= data["readiness_score"] <= 100.0
        assert isinstance(data["gaps"], list) and len(data["gaps"]) > 0
        assert isinstance(data["recommendations"], list) and len(data["recommendations"]) > 0

    def test_full_compliance_readiness_is_100(self, client):
        """All readiness flags true + measured data -> readiness_score == 100.

        Also exercises the kg-based volume branch (annual_fuel_volume_kg)
        rather than the litres branch used by the other tests.
        Note: fuel_type is deliberately "biofuel_blend" rather than
        "natural_gas"/"cng" — those two fuel table rows carry an explicit
        `ef_kgco2_per_litre: None`, which trips a separate, pre-existing
        `None > 0` TypeError at eu_ets_engine.py:454 that is out of scope
        for this fix (flagged separately).
        """
        resp = client.post(
            "/api/v1/eu-ets/ets2-readiness",
            json={
                "entity_id": "E2",
                "entity_name": "Compliant Distributor",
                "fuel_type": "biofuel_blend",
                "annual_fuel_volume_kg": 50_000.0,
                "has_mrv_system": True,
                "monitoring_plan_submitted": True,
                "has_registry_account": True,
                "has_verified_emissions_report": True,
                "fuel_volume_data_quality": "measured",
            },
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["readiness_score"] == 100.0
        assert data["pass_through_potential_pct"] == 85.0  # biofuel_blend is a road fuel
        # 50,000 kg * 1.800 kgCO2/kg / 1000 = 90.0 tCO2
        assert data["annual_emissions_tco2"] == pytest.approx(90.0)

    def test_recommendations_reference_calendar_deadlines(self, client):
        """Recommendation strings must contain real deadline dates, not a
        crash from calling .get() on the ETS2_COMPLIANCE_CALENDAR list."""
        resp = client.post(
            "/api/v1/eu-ets/ets2-readiness",
            json={
                "entity_id": "E3",
                "entity_name": "New Distributor",
                "fuel_type": "petrol",
                "annual_fuel_volume_litres": 10_000.0,
            },
        )
        assert resp.status_code == 200, resp.text
        recs = " ".join(resp.json()["recommendations"])
        assert "2025-01-01" in recs  # monitoring plan deadline
        assert "Art. 30d" in recs
