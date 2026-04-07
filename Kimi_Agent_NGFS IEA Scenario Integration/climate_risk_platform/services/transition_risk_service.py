"""
Transition Risk Service
======================
Climate transition risk calculation engine.
Implements carbon pricing, stranded asset analysis, and sectoral transition pathways.
"""

from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Tuple
from decimal import Decimal
from uuid import UUID
import numpy as np
from scipy import stats
import logging

from models.scenario import Scenario, ScenarioVariable, AssetClimateRisk
from models.schemas import TransitionRiskCalculationRequest
from services.scenario_service import ScenarioService

logger = logging.getLogger(__name__)


class TransitionRiskService:
    """
    Service for calculating climate transition risk metrics.
    Implements policy, technology, and market transition risk assessment.
    """
    
    # Sector carbon intensities (tCO2e/$M revenue) - baseline
    SECTOR_CARBON_INTENSITY = {
        "energy": 2500.0,
        "utilities": 1800.0,
        "materials": 1200.0,
        "industrials": 600.0,
        "transportation": 800.0,
        "real_estate": 300.0,
        "technology": 50.0,
        "healthcare": 40.0,
        "financials": 30.0,
        "consumer": 100.0,
        "communication": 60.0
    }
    
    # Sector transition risk sensitivity (0-1)
    SECTOR_TRANSITION_SENSITIVITY = {
        "energy": 0.95,
        "utilities": 0.90,
        "materials": 0.85,
        "industrials": 0.75,
        "transportation": 0.80,
        "real_estate": 0.60,
        "technology": 0.30,
        "healthcare": 0.20,
        "financials": 0.25,
        "consumer": 0.40,
        "communication": 0.25
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.scenario_service = ScenarioService(db)
    
    def calculate_transition_risk(
        self,
        request: TransitionRiskCalculationRequest
    ) -> Dict[str, any]:
        """
        Calculate comprehensive transition risk for an asset.
        
        Args:
            request: Transition risk calculation request
            
        Returns:
            Dictionary with transition risk metrics
        """
        # Get scenario carbon price trajectory
        carbon_prices = self.scenario_service.get_carbon_price_trajectory(
            request.scenario_id,
            request.sector
        )
        
        # Get temperature trajectory
        temperatures = self.scenario_service.get_temperature_trajectory(
            request.scenario_id
        )
        
        # Calculate carbon metrics
        carbon_metrics = self._calculate_carbon_metrics(
            scope1=request.scope1_emissions or 0,
            scope2=request.scope2_emissions or 0,
            scope3=request.scope3_emissions or 0,
            revenue=request.revenue or 1
        )
        
        # Calculate carbon cost impact
        carbon_cost = self._calculate_carbon_cost(
            emissions=carbon_metrics["total_emissions"],
            carbon_prices=carbon_prices,
            time_horizon=request.time_horizon_years
        )
        
        # Calculate stranded asset risk
        stranded_asset = self._calculate_stranded_asset_risk(
            sector=request.sector,
            market_cap=request.market_cap or 0,
            enterprise_value=request.enterprise_value or 0,
            carbon_intensity=carbon_metrics["carbon_intensity"],
            temperature_trajectory=temperatures,
            time_horizon=request.time_horizon_years
        )
        
        # Calculate transition risk score
        risk_score = self._calculate_transition_risk_score(
            sector=request.sector,
            carbon_intensity=carbon_metrics["carbon_intensity"],
            carbon_cost=carbon_cost,
            stranded_asset_prob=stranded_asset["probability"]
        )
        
        return {
            "asset_id": request.asset_id,
            "scenario_id": request.scenario_id,
            "time_horizon": request.time_horizon_years,
            "transition_risk_score": risk_score,
            "carbon_footprint_tco2e": carbon_metrics["total_emissions"],
            "carbon_intensity": carbon_metrics["carbon_intensity"],
            "scope1_emissions": carbon_metrics["scope1"],
            "scope2_emissions": carbon_metrics["scope2"],
            "scope3_emissions": carbon_metrics["scope3"],
            "carbon_cost_10yr": carbon_cost["total_cost_10yr"],
            "carbon_cost_annuity": carbon_cost["annuity"],
            "stranded_asset_probability": stranded_asset["probability"],
            "stranded_asset_value": stranded_asset["value_at_risk"],
            "sector_transition_pathway": stranded_asset["pathway_alignment"],
            "carbon_price_trajectory": carbon_prices
        }
    
    def _calculate_carbon_metrics(
        self,
        scope1: float,
        scope2: float,
        scope3: float,
        revenue: float
    ) -> Dict[str, float]:
        """
        Calculate carbon footprint and intensity metrics.
        
        Args:
            scope1: Scope 1 emissions (tCO2e)
            scope2: Scope 2 emissions (tCO2e)
            scope3: Scope 3 emissions (tCO2e)
            revenue: Annual revenue ($M)
            
        Returns:
            Dictionary with carbon metrics
        """
        total_emissions = scope1 + scope2 + scope3
        
        # Carbon intensity per $M revenue
        carbon_intensity = total_emissions / max(revenue, 1)
        
        return {
            "scope1": scope1,
            "scope2": scope2,
            "scope3": scope3,
            "total_emissions": total_emissions,
            "carbon_intensity": carbon_intensity
        }
    
    def _calculate_carbon_cost(
        self,
        emissions: float,
        carbon_prices: Dict[int, float],
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate carbon cost impact over time horizon.
        
        Args:
            emissions: Annual emissions (tCO2e)
            carbon_prices: Carbon price trajectory {year: price}
            time_horizon: Time horizon in years
            
        Returns:
            Dictionary with carbon cost metrics
        """
        if not carbon_prices:
            return {"total_cost_10yr": 0, "annuity": 0, "yearly_costs": {}}
        
        current_year = 2024
        yearly_costs = {}
        total_cost = 0
        
        for year_offset in range(time_horizon):
            year = current_year + year_offset
            
            # Get carbon price for this year (interpolate if needed)
            if year in carbon_prices:
                price = carbon_prices[year]
            else:
                # Linear interpolation
                years = sorted(carbon_prices.keys())
                if year < years[0]:
                    price = carbon_prices[years[0]]
                elif year > years[-1]:
                    price = carbon_prices[years[-1]]
                else:
                    # Find surrounding years
                    for i in range(len(years) - 1):
                        if years[i] <= year <= years[i+1]:
                            t = (year - years[i]) / (years[i+1] - years[i])
                            price = carbon_prices[years[i]] + t * (carbon_prices[years[i+1]] - carbon_prices[years[i]])
                            break
                        price = carbon_prices[years[-1]]
            
            yearly_cost = emissions * price
            yearly_costs[year] = round(yearly_cost, 2)
            total_cost += yearly_cost
        
        # Calculate annuity (equivalent annual cost)
        discount_rate = 0.05
        if discount_rate > 0:
            annuity = total_cost * discount_rate / (1 - (1 + discount_rate) ** -time_horizon)
        else:
            annuity = total_cost / time_horizon
        
        return {
            "total_cost_10yr": round(total_cost, 2),
            "annuity": round(annuity, 2),
            "yearly_costs": yearly_costs
        }
    
    def _calculate_stranded_asset_risk(
        self,
        sector: str,
        market_cap: float,
        enterprise_value: float,
        carbon_intensity: float,
        temperature_trajectory: Dict[int, float],
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate stranded asset probability and value at risk.
        
        Args:
            sector: Industry sector
            market_cap: Market capitalization
            enterprise_value: Enterprise value
            carbon_intensity: Carbon intensity (tCO2e/$M revenue)
            temperature_trajectory: Temperature trajectory
            time_horizon: Time horizon in years
            
        Returns:
            Dictionary with stranded asset metrics
        """
        # Get sector sensitivity
        sensitivity = self.SECTOR_TRANSITION_SENSITIVITY.get(sector.lower(), 0.5)
        
        # Get sector baseline carbon intensity
        sector_baseline = self.SECTOR_CARBON_INTENSITY.get(sector.lower(), 500)
        
        # Calculate carbon intensity ratio (relative to sector)
        intensity_ratio = carbon_intensity / max(sector_baseline, 1)
        
        # Get final temperature from trajectory
        if temperature_trajectory:
            final_year = max(temperature_trajectory.keys())
            final_temp = temperature_trajectory[final_year]
        else:
            final_temp = 2.0  # Default assumption
        
        # Stranded asset probability model
        # Higher temperature target = higher transition risk
        # Higher carbon intensity = higher stranded asset risk
        temp_factor = (final_temp - 1.5) / 2.0  # Normalized to 0-1
        intensity_factor = min(1, intensity_ratio)
        
        # Stranded asset probability
        probability = sensitivity * (0.3 + 0.4 * temp_factor + 0.3 * intensity_factor)
        probability = min(0.95, max(0, probability))  # Cap at 95%
        
        # Value at risk (percentage of enterprise value)
        var_percent = probability * sensitivity * 0.5  # Up to 50% of EV at risk
        value_at_risk = enterprise_value * var_percent
        
        # Pathway alignment score (0-100, higher = better aligned)
        pathway_alignment = max(0, 100 - (intensity_ratio * 50) - (temp_factor * 30))
        
        return {
            "probability": round(probability, 4),
            "value_at_risk": round(value_at_risk, 2),
            "var_percent": round(var_percent, 4),
            "pathway_alignment": round(pathway_alignment, 2)
        }
    
    def _calculate_transition_risk_score(
        self,
        sector: str,
        carbon_intensity: float,
        carbon_cost: Dict,
        stranded_asset_prob: float
    ) -> float:
        """
        Calculate overall transition risk score (0-100).
        
        Args:
            sector: Industry sector
            carbon_intensity: Carbon intensity
            carbon_cost: Carbon cost metrics
            stranded_asset_prob: Stranded asset probability
            
        Returns:
            Transition risk score (0-100)
        """
        # Get sector sensitivity
        sensitivity = self.SECTOR_TRANSITION_SENSITIVITY.get(sector.lower(), 0.5)
        
        # Carbon intensity score (0-40 points)
        sector_baseline = self.SECTOR_CARBON_INTENSITY.get(sector.lower(), 500)
        intensity_score = min(40, (carbon_intensity / max(sector_baseline, 1)) * 40)
        
        # Carbon cost score (0-30 points)
        cost_score = min(30, (carbon_cost.get("annuity", 0) / 1000000) * 30)
        
        # Stranded asset score (0-30 points)
        stranded_score = stranded_asset_prob * 30
        
        # Weighted sum with sector sensitivity
        base_score = intensity_score + cost_score + stranded_score
        risk_score = base_score * (0.5 + 0.5 * sensitivity)
        
        return round(min(100, risk_score), 2)
    
    def get_sector_transition_pathways(
        self,
        sector: str,
        scenario_id: UUID
    ) -> Dict[str, any]:
        """
        Get sector-specific transition pathway for a scenario.
        
        Args:
            sector: Industry sector
            scenario_id: Scenario UUID
            
        Returns:
            Dictionary with pathway metrics
        """
        # Get scenario variables for sector
        variables = self.db.query(ScenarioVariable).filter(
            ScenarioVariable.scenario_id == scenario_id,
            ScenarioVariable.sector.ilike(f"%{sector}%")
        ).all()
        
        pathway = {
            "sector": sector,
            "scenario_id": str(scenario_id),
            "variables": {}
        }
        
        for var in variables:
            pathway["variables"][var.variable_code] = {
                "name": var.variable_name,
                "unit": var.unit,
                "time_series": var.time_series,
                "cagr": float(var.cagr) if var.cagr else None
            }
        
        return pathway
    
    def calculate_temperature_alignment(
        self,
        portfolio_emissions: float,
        portfolio_value: float,
        sector_weights: Dict[str, float],
        scenario_id: UUID
    ) -> Dict[str, float]:
        """
        Calculate portfolio temperature alignment.
        
        Args:
            portfolio_emissions: Total portfolio emissions
            portfolio_value: Portfolio value
            sector_weights: Sector allocation weights
            scenario_id: Scenario UUID
            
        Returns:
            Dictionary with alignment metrics
        """
        # Get scenario temperature outcome
        scenario = self.db.query(Scenario).filter(
            Scenario.scenario_id == scenario_id
        ).first()
        
        if not scenario or not scenario.temperature_outcome:
            return {"temperature_alignment": None, "alignment_score": None}
        
        scenario_temp = float(scenario.temperature_outcome)
        
        # Calculate implied temperature rise based on carbon intensity
        carbon_intensity = portfolio_emissions / max(portfolio_value, 1)
        
        # Simple model: higher intensity = higher implied temperature
        # Benchmark: 100 tCO2e/$M = 2.0°C alignment
        benchmark_intensity = 100
        intensity_ratio = carbon_intensity / benchmark_intensity
        
        implied_temp = 1.5 + (intensity_ratio - 1) * 0.5
        implied_temp = max(1.5, min(4.0, implied_temp))
        
        # Alignment score (0-100, higher = better aligned)
        alignment_score = max(0, 100 - abs(implied_temp - 1.5) * 50)
        
        return {
            "temperature_alignment": round(implied_temp, 2),
            "scenario_temperature": scenario_temp,
            "alignment_score": round(alignment_score, 2),
            "portfolio_carbon_intensity": round(carbon_intensity, 4),
            "benchmark_intensity": benchmark_intensity
        }
