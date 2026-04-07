"""
Credit Risk Service
==================
Climate-adjusted credit risk calculation engine.
Implements IFRS 9 ECL and Basel capital requirements.
"""

from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
from uuid import UUID
import numpy as np
from scipy import stats
import logging

from models.scenario import Scenario, AssetClimateRisk
from models.schemas import CreditRiskCalculationRequest
from services.physical_risk_service import PhysicalRiskService
from services.transition_risk_service import TransitionRiskService

logger = logging.getLogger(__name__)


class CreditRiskService:
    """
    Service for climate-adjusted credit risk calculations.
    Implements Merton-style structural model with climate adjustments.
    """
    
    # Climate adjustment factors by sector
    SECTOR_CLIMATE_SENSITIVITY = {
        "energy": 0.80,
        "utilities": 0.70,
        "materials": 0.65,
        "industrials": 0.55,
        "transportation": 0.60,
        "real_estate": 0.50,
        "technology": 0.25,
        "healthcare": 0.15,
        "financials": 0.20,
        "consumer": 0.30,
        "communication": 0.20
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.physical_service = PhysicalRiskService(db)
        self.transition_service = TransitionRiskService(db)
    
    def calculate_credit_risk(
        self,
        request: CreditRiskCalculationRequest
    ) -> Dict[str, any]:
        """
        Calculate climate-adjusted credit risk metrics.
        
        Args:
            request: Credit risk calculation request
            
        Returns:
            Dictionary with credit risk metrics
        """
        # Get physical risk impact
        physical_impact = self._calculate_physical_credit_impact(
            lat=request.latitude,
            lon=request.longitude,
            asset_value=request.asset_value,
            sector=request.sector,
            scenario_id=request.scenario_id,
            time_horizon=request.time_horizon_years
        )
        
        # Get transition risk impact
        transition_impact = self._calculate_transition_credit_impact(
            sector=request.sector,
            scenario_id=request.scenario_id,
            time_horizon=request.time_horizon_years
        )
        
        # Calculate climate-adjusted PD
        climate_pd = self._calculate_climate_adjusted_pd(
            current_pd=request.current_pd,
            physical_impact=physical_impact,
            transition_impact=transition_impact,
            sector=request.sector,
            time_horizon=request.time_horizon_years
        )
        
        # Calculate climate-adjusted LGD
        climate_lgd = self._calculate_climate_adjusted_lgd(
            current_lgd=request.current_lgd,
            physical_impact=physical_impact,
            asset_value=request.asset_value
        )
        
        # Calculate ECL (Expected Credit Loss)
        ecl = self._calculate_ecl(
            pd=climate_pd,
            lgd=climate_lgd,
            ead=request.current_ead,
            time_horizon=request.time_horizon_years
        )
        
        # Calculate capital requirement (Basel)
        capital_requirement = self._calculate_capital_requirement(
            pd=climate_pd,
            lgd=climate_lgd,
            ead=request.current_ead
        )
        
        return {
            "asset_id": request.asset_id,
            "scenario_id": request.scenario_id,
            "time_horizon": request.time_horizon_years,
            
            # Original metrics
            "current_pd": request.current_pd,
            "current_lgd": request.current_lgd,
            "current_ead": request.current_ead,
            
            # Climate-adjusted metrics
            "climate_adjusted_pd": climate_pd,
            "climate_adjusted_lgd": climate_lgd,
            "pd_increase": climate_pd - request.current_pd,
            "lgd_increase": climate_lgd - request.current_lgd,
            
            # ECL
            "expected_credit_loss": ecl,
            "ecl_12_month": ecl["ecl_12m"],
            "ecl_lifetime": ecl["ecl_lifetime"],
            
            # Capital
            "capital_requirement": capital_requirement,
            " rwa": capital_requirement["rwa"],
            "capital_charge": capital_requirement["capital_charge"],
            
            # Risk components
            "physical_risk_contribution": physical_impact["pd_contribution"],
            "transition_risk_contribution": transition_impact["pd_contribution"],
            
            # IFRS 9 stage
            "ifrs9_stage": ecl["stage"]
        }
    
    def _calculate_physical_credit_impact(
        self,
        lat: float,
        lon: float,
        asset_value: float,
        sector: str,
        scenario_id: UUID,
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate physical risk impact on credit metrics.
        
        Args:
            lat: Latitude
            lon: Longitude
            asset_value: Asset value
            sector: Industry sector
            scenario_id: Scenario UUID
            time_horizon: Time horizon
            
        Returns:
            Dictionary with physical risk credit impact
        """
        # Get hazard intensities
        hazards = ["flood", "wildfire", "hurricane", "earthquake", "heat", "drought"]
        
        max_eal_ratio = 0
        max_pml_ratio = 0
        
        for hazard in hazards:
            intensity_curve = self.physical_service._get_hazard_intensity(hazard, lat, lon)
            
            # Get 100-year intensity
            intensity_100 = intensity_curve.get(100, 0)
            
            # Simplified damage ratio
            damage_ratio = min(0.8, intensity_100 * 0.5)
            
            # EAL as percentage of asset value
            eal = damage_ratio * asset_value * 0.01  # 1% annual probability
            eal_ratio = eal / max(asset_value, 1)
            
            # PML as percentage of asset value
            pml = damage_ratio * asset_value
            pml_ratio = pml / max(asset_value, 1)
            
            max_eal_ratio = max(max_eal_ratio, eal_ratio)
            max_pml_ratio = max(max_pml_ratio, pml_ratio)
        
        # PD contribution from physical risk
        # Higher EAL/PML = higher PD
        pd_contribution = min(0.10, max_eal_ratio * 2 + max_pml_ratio * 0.5)
        
        return {
            "eal_ratio": max_eal_ratio,
            "pml_ratio": max_pml_ratio,
            "pd_contribution": pd_contribution
        }
    
    def _calculate_transition_credit_impact(
        self,
        sector: str,
        scenario_id: UUID,
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate transition risk impact on credit metrics.
        
        Args:
            sector: Industry sector
            scenario_id: Scenario UUID
            time_horizon: Time horizon
            
        Returns:
            Dictionary with transition risk credit impact
        """
        # Get sector sensitivity
        sensitivity = self.SECTOR_CLIMATE_SENSITIVITY.get(sector.lower(), 0.5)
        
        # Get scenario temperature
        scenario = self.db.query(Scenario).filter(
            Scenario.scenario_id == scenario_id
        ).first()
        
        if scenario and scenario.temperature_outcome:
            temp = float(scenario.temperature_outcome)
            # Higher temperature = more transition risk
            temp_factor = (temp - 1.5) / 2.0
        else:
            temp_factor = 0.25  # Default
        
        # PD contribution from transition risk
        pd_contribution = sensitivity * (0.02 + 0.08 * temp_factor)
        
        return {
            "sector_sensitivity": sensitivity,
            "temperature_factor": temp_factor,
            "pd_contribution": pd_contribution
        }
    
    def _calculate_climate_adjusted_pd(
        self,
        current_pd: float,
        physical_impact: Dict,
        transition_impact: Dict,
        sector: str,
        time_horizon: int
    ) -> float:
        """
        Calculate climate-adjusted probability of default.
        
        Uses Merton-style model with climate adjustment factor.
        
        Args:
            current_pd: Current PD
            physical_impact: Physical risk impact
            transition_impact: Transition risk impact
            sector: Industry sector
            time_horizon: Time horizon
            
        Returns:
            Climate-adjusted PD
        """
        # Base PD to distance-to-default conversion
        if current_pd > 0:
            dtd = -stats.norm.ppf(current_pd)
        else:
            dtd = 3.0  # Default assumption
        
        # Climate adjustment to distance-to-default
        physical_adjustment = physical_impact["pd_contribution"] * 2
        transition_adjustment = transition_impact["pd_contribution"] * 2
        
        # Time scaling
        time_factor = np.sqrt(time_horizon / 10)
        
        # Adjusted distance-to-default
        adjusted_dtd = dtd - (physical_adjustment + transition_adjustment) * time_factor
        
        # Convert back to PD
        climate_pd = stats.norm.cdf(-adjusted_dtd)
        
        # Cap at 99%
        return min(0.99, max(current_pd, climate_pd))
    
    def _calculate_climate_adjusted_lgd(
        self,
        current_lgd: float,
        physical_impact: Dict,
        asset_value: float
    ) -> float:
        """
        Calculate climate-adjusted loss given default.
        
        Args:
            current_lgd: Current LGD
            physical_impact: Physical risk impact
            asset_value: Asset value
            
        Returns:
            Climate-adjusted LGD
        """
        # LGD increase from physical damage
        lgd_increase = physical_impact["pml_ratio"] * 0.5
        
        # Adjusted LGD
        climate_lgd = current_lgd + lgd_increase
        
        # Cap at 95%
        return min(0.95, climate_lgd)
    
    def _calculate_ecl(
        self,
        pd: float,
        lgd: float,
        ead: float,
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate Expected Credit Loss (IFRS 9).
        
        Args:
            pd: Probability of default
            lgd: Loss given default
            ead: Exposure at default
            time_horizon: Time horizon
            
        Returns:
            Dictionary with ECL metrics
        """
        # 12-month ECL
        ecl_12m = pd * lgd * ead
        
        # Lifetime ECL (simplified: multiply by time horizon)
        # In practice, this uses forward-looking PD term structure
        lifetime_pd = 1 - (1 - pd) ** (time_horizon / 12)
        ecl_lifetime = lifetime_pd * lgd * ead
        
        # IFRS 9 Stage determination
        # Stage 1: 12-month ECL
        # Stage 2: Lifetime ECL (significant increase in credit risk)
        # Stage 3: Lifetime ECL (credit impaired)
        
        # Simplified staging: use lifetime if PD increase > 50%
        if pd > 0.03:  # 3% threshold for significant increase
            stage = 2
            ecl = ecl_lifetime
        else:
            stage = 1
            ecl = ecl_12m
        
        return {
            "ecl_12m": round(ecl_12m, 4),
            "ecl_lifetime": round(ecl_lifetime, 4),
            "ecl": round(ecl, 4),
            "stage": stage
        }
    
    def _calculate_capital_requirement(
        self,
        pd: float,
        lgd: float,
        ead: float,
        correlation: Optional[float] = None
    ) -> Dict[str, float]:
        """
        Calculate regulatory capital requirement (Basel IRB).
        
        Args:
            pd: Probability of default
            lgd: Loss given default
            ead: Exposure at default
            correlation: Asset correlation (optional)
            
        Returns:
            Dictionary with capital metrics
        """
        # Basel correlation formula for corporate exposures
        if correlation is None:
            correlation = 0.12 * (1 - np.exp(-50 * pd)) / (1 - np.exp(-50)) + 0.24 * (1 - (1 - np.exp(-50 * pd)) / (1 - np.exp(-50)))
        
        # maturity adjustment
        maturity = 2.5  # Assumed average maturity
        maturity_adjustment = (0.11852 - 0.05478 * np.log(pd)) ** 2
        
        # Capital requirement (K)
        # Simplified formula
        k = lgd * stats.norm.cdf(
            (stats.norm.ppf(pd) + np.sqrt(correlation) * stats.norm.ppf(0.999)) / np.sqrt(1 - correlation)
        ) - pd * lgd
        
        k = k * (1 + (maturity - 2.5) * maturity_adjustment) / (1 - 1.5 * maturity_adjustment)
        
        # Risk-weighted assets
        rwa = k * 12.5 * ead
        
        # Capital charge (8% of RWA)
        capital_charge = 0.08 * rwa
        
        return {
            "k": round(k, 6),
            "rwa": round(rwa, 2),
            "capital_charge": round(capital_charge, 2)
        }
    
    def calculate_portfolio_credit_risk(
        self,
        portfolio_id: str,
        scenario_id: UUID,
        time_horizon: int
    ) -> Dict[str, any]:
        """
        Calculate aggregate credit risk for a portfolio.
        
        Args:
            portfolio_id: Portfolio ID
            scenario_id: Scenario UUID
            time_horizon: Time horizon
            
        Returns:
            Dictionary with portfolio credit risk metrics
        """
        # Get all asset risks for portfolio
        asset_risks = self.db.query(AssetClimateRisk).filter(
            AssetClimateRisk.asset_id.like(f"{portfolio_id}%"),
            AssetClimateRisk.scenario_id == scenario_id
        ).all()
        
        if not asset_risks:
            return {
                "portfolio_id": portfolio_id,
                "total_ecl": 0,
                "total_rwa": 0,
                "weighted_avg_pd": 0
            }
        
        # Aggregate metrics
        total_ecl = sum(float(r.ecl_impact or 0) for r in asset_risks)
        total_pd_increase = sum(float(r.pd_increase_10yr or 0) for r in asset_risks)
        total_lgd_increase = sum(float(r.lgd_increase_10yr or 0) for r in asset_risks)
        
        # Weighted average PD
        avg_pd = total_pd_increase / len(asset_risks)
        
        # Portfolio capital requirement
        total_rwa = sum(
            self._calculate_capital_requirement(
                pd=float(r.pd_increase_10yr or 0),
                lgd=float(r.lgd_increase_10yr or 0),
                ead=1000000  # Assumed EAD
            )["rwa"] for r in asset_risks
        )
        
        return {
            "portfolio_id": portfolio_id,
            "scenario_id": str(scenario_id),
            "num_assets": len(asset_risks),
            "total_ecl": round(total_ecl, 2),
            "total_rwa": round(total_rwa, 2),
            "weighted_avg_pd": round(avg_pd, 6),
            "avg_lgd_increase": round(total_lgd_increase / len(asset_risks), 6)
        }
