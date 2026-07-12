"""
Regression tests for POST /api/v1/issb-s2/{assess,scenario-analysis,risk-identification}
==========================================================================================
Guards against a request-schema mismatch between the issb-tcfd frontend
(frontend/src/features/issb-tcfd/pages/IssbTcfdPage.jsx) and the Pydantic
request models in backend/api/v1/routes/issb_s2.py:

  - ISSBS2AssessRequest previously required `entity_id` / `entity_name` with
    no default, but the frontend posted `company_name` / `cin` / `sector` /
    nested `governance` / `strategy` / `risk_management` / `metrics_targets`
    objects -> every request 422'd.
  - Even sending the engine-native field names, the request model dropped
    `governance_disclosures` / `strategy_disclosures` / `risk_mgmt_disclosures`
    / `metrics_targets_disclosures` (accepted by ISSBS2Engine.assess() but
    never exposed on the route), so those three pillar scores were silently
    pinned to 0.0 regardless of what evidence was supplied.
  - ScenarioAnalysisRequest dropped `entity_financials`, so entity-level
    scenario impacts were always None.
  - RiskIdentificationRequest dropped `risk_scores` / `opportunity_values`.

Uses FastAPI's TestClient to exercise the real request pipeline (router ->
Pydantic validation -> engine -> response), not just the engine directly, so
a regression at the schema/wiring layer is caught even if the engine's own
unit tests stay green.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

import middleware.auth_middleware as auth_mw

_ORIGINAL_REQUIRE_AUTH = auth_mw.REQUIRE_AUTH


def setup_module(_module):
    auth_mw.REQUIRE_AUTH = False


def teardown_module(_module):
    auth_mw.REQUIRE_AUTH = _ORIGINAL_REQUIRE_AUTH


@pytest.fixture(scope="module")
def client():
    from server import app
    return TestClient(app)


class TestAssessEndpoint:
    """POST /api/v1/issb-s2/assess"""

    def test_minimal_engine_native_payload_validates_and_returns_200(self, client):
        """The frontend's derived entity_id/entity_name/industry_sector shape
        (see IssbTcfdPage.runAssessment) must validate — this previously
        422'd because entity_id/entity_name were required with no default
        and the frontend sent company_name/cin instead."""
        resp = client.post(
            "/api/v1/issb-s2/assess",
            json={
                "entity_id": "L17110MH1973PLC019786",
                "entity_name": "Reliance Industries",
                "industry_sector": "energy",
                "reporting_period": "2024",
                "scope1_tco2e": 1000.0,
                "scope2_tco2e": 500.0,
                "scope3_tco2e": 2000.0,
                "internal_carbon_price": 50.0,
                "climate_capex_pct": 0,
            },
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["status"] == "ok"
        result = data["result"]
        assert result["entity_id"] == "L17110MH1973PLC019786"
        assert result["total_ghg_tco2e"] == pytest.approx(3500.0)
        # No *_disclosures supplied -> qualitative pillars honestly 0, not fabricated.
        assert result["governance_score"] == 0.0
        assert result["strategy_score"] == 0.0
        assert result["risk_management_score"] == 0.0
        # metrics_targets pillar still credits the real quantitative inputs supplied.
        assert result["metrics_targets_score"] > 0.0

    def test_missing_required_fields_returns_422_not_500(self, client):
        """A request missing entity_id/entity_name must fail validation
        cleanly (422), not reach the engine and blow up with a TypeError."""
        resp = client.post("/api/v1/issb-s2/assess", json={"industry_sector": "financials"})
        assert resp.status_code == 422

    def test_disclosure_lists_are_forwarded_and_score_the_pillar(self, client):
        """governance_disclosures / strategy_disclosures / risk_mgmt_disclosures
        were previously accepted by the engine but dropped by the route --
        supplying them must now move the corresponding pillar score off 0."""
        resp = client.post(
            "/api/v1/issb-s2/assess",
            json={
                "entity_id": "E-DISC-1",
                "entity_name": "Disclosure Test Corp",
                "industry_sector": "financials",
                "governance_disclosures": [
                    "board_processes_and_controls",
                    "how_board_informed_about_climate",
                    "board_accountability_for_climate_targets",
                    "board_expertise_or_access_to_expertise",
                ],
                "strategy_disclosures": ["risks_identified", "time_horizons_defined"],
                "risk_mgmt_disclosures": ["identification_process", "how_prioritised"],
            },
        )
        assert resp.status_code == 200, resp.text
        result = resp.json()["result"]
        assert result["governance_score"] > 0.0
        assert result["strategy_score"] > 0.0
        assert result["risk_management_score"] > 0.0


class TestScenarioAnalysisEndpoint:
    """POST /api/v1/issb-s2/scenario-analysis"""

    def test_entity_id_required_returns_422_not_500(self, client):
        resp = client.post("/api/v1/issb-s2/scenario-analysis", json={"scenarios": ["net_zero_1_5c"]})
        assert resp.status_code == 422

    def test_valid_scenario_key_and_financials_returns_computed_impacts(self, client):
        """Frontend's dropdown values ('1.5c'/'2c'/'3c') don't match the
        engine's CLIMATE_SCENARIOS keys (net_zero_1_5c/below_2c/current_policies)
        -- the route must accept the real engine keys, and entity_financials
        (previously dropped) must actually reach the engine so impacts are
        computed rather than always None."""
        resp = client.post(
            "/api/v1/issb-s2/scenario-analysis",
            json={
                "entity_id": "E-SCN-1",
                "entity_type": "corporate",
                "scenarios": ["net_zero_1_5c"],
                "entity_financials": {
                    "revenue_usd_mn": 1000.0,
                    "carbon_intensity_tco2e_per_usd_mn": 200.0,
                },
            },
        )
        assert resp.status_code == 200, resp.text
        result = resp.json()["result"]
        sc = result["scenarios"]["net_zero_1_5c"]
        assert sc["entity_impacts"]["revenue_impact_2030_pct"] is not None

    def test_unmapped_scenario_key_is_honestly_empty_not_500(self, client):
        """A stale/unmapped scenario key must not crash the engine — it's
        silently skipped (documented engine behaviour), which is exactly the
        'silent null result' this test locks in as expected, not a 500."""
        resp = client.post(
            "/api/v1/issb-s2/scenario-analysis",
            json={"entity_id": "E-SCN-2", "scenarios": ["1.5c"]},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["result"]["scenarios"] == {}


class TestRiskIdentificationEndpoint:
    """POST /api/v1/issb-s2/risk-identification"""

    def test_entity_id_required_returns_422_not_500(self, client):
        resp = client.post("/api/v1/issb-s2/risk-identification", json={"sector": "financials"})
        assert resp.status_code == 422

    def test_risk_scores_forwarded_and_attached_to_matching_risk(self, client):
        resp = client.post(
            "/api/v1/issb-s2/risk-identification",
            json={
                "entity_id": "E-RISK-1",
                "sector": "financials",
                "risk_scores": {"flooding": {"likelihood": 4, "impact": 5}},
            },
        )
        assert resp.status_code == 200, resp.text
        result = resp.json()["result"]
        flooding = next(r for r in result["physical_risks"] if r["risk_key"] == "flooding")
        assert flooding["likelihood_score"] == 4.0
        assert flooding["impact_score"] == 5.0
        # A risk with no supplied score is honestly null, not fabricated.
        other = next(r for r in result["physical_risks"] if r["risk_key"] != "flooding")
        assert other["likelihood_score"] is None
