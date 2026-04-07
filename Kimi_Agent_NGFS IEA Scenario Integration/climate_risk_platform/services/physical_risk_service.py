"""
Physical Risk Service
====================
Climate physical risk calculation engine.
Implements hazard modeling, exposure assessment, and vulnerability functions.
"""

from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Tuple, Literal
from decimal import Decimal
from uuid import UUID
import numpy as np
from scipy import stats
from scipy.interpolate import interp1d
import logging

from models.scenario import Scenario, AssetClimateRisk
from models.schemas import PhysicalRiskCalculationRequest

logger = logging.getLogger(__name__)


class PhysicalRiskService:
    """
    Service for calculating climate physical risk metrics.
    Implements hazard-agnostic risk assessment framework.
    """
    
    # Hazard return periods (years)
    RETURN_PERIODS = [10, 25, 50, 100, 250, 500]
    
    # Hazard types supported
    HAZARD_TYPES = ["flood", "wildfire", "hurricane", "earthquake", "heat", "drought"]
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_physical_risk(
        self,
        request: PhysicalRiskCalculationRequest
    ) -> Dict[str, any]:
        """
        Calculate comprehensive physical risk for an asset.
        
        Args:
            request: Physical risk calculation request
            
        Returns:
            Dictionary with risk scores and financial impacts
        """
        results = {
            "asset_id": request.asset_id,
            "scenario_id": request.scenario_id,
            "time_horizon": request.time_horizon_years,
            "hazards": {}
        }
        
        # Calculate risk for each hazard
        total_eal = 0.0
        max_pml_100 = 0.0
        max_pml_250 = 0.0
        
        for hazard in request.hazards:
            hazard_risk = self._calculate_hazard_risk(
                hazard=hazard,
                lat=request.latitude,
                lon=request.longitude,
                asset_value=request.asset_value or 0,
                replacement_cost=request.replacement_cost or 0,
                business_interruption=request.business_interruption or 0,
                time_horizon=request.time_horizon_years
            )
            
            results["hazards"][hazard] = hazard_risk
            total_eal += hazard_risk["eal"]
            max_pml_100 = max(max_pml_100, hazard_risk["pml_100yr"])
            max_pml_250 = max(max_pml_250, hazard_risk["pml_250yr"])
        
        # Calculate aggregate risk score (0-100)
        results["physical_risk_score"] = self._calculate_aggregate_score(
            results["hazards"]
        )
        
        # Financial impacts
        results["expected_annual_loss"] = total_eal
        results["probable_max_loss_100yr"] = max_pml_100
        results["probable_max_loss_250yr"] = max_pml_250
        
        # Individual hazard scores
        for hazard in self.HAZARD_TYPES:
            if hazard in results["hazards"]:
                results[f"{hazard}_risk_score"] = results["hazards"][hazard]["risk_score"]
            else:
                results[f"{hazard}_risk_score"] = 0.0
        
        return results
    
    def _calculate_hazard_risk(
        self,
        hazard: str,
        lat: float,
        lon: float,
        asset_value: float,
        replacement_cost: float,
        business_interruption: float,
        time_horizon: int
    ) -> Dict[str, float]:
        """
        Calculate risk for a specific hazard.
        
        Args:
            hazard: Hazard type
            lat: Latitude
            lon: Longitude
            asset_value: Total asset value
            replacement_cost: Replacement cost
            business_interruption: Business interruption cost
            time_horizon: Time horizon in years
            
        Returns:
            Dictionary with hazard-specific risk metrics
        """
        # Get hazard intensity for return periods
        intensity_curve = self._get_hazard_intensity(hazard, lat, lon)
        
        # Get vulnerability curve (damage ratio vs intensity)
        vulnerability_curve = self._get_vulnerability_curve(hazard)
        
        # Calculate damage ratios for each return period
        damage_ratios = []
        losses = []
        
        for rp in self.RETURN_PERIODS:
            intensity = intensity_curve.get(rp, 0)
            damage_ratio = vulnerability_curve(intensity) if intensity > 0 else 0
            
            # Total loss includes replacement and business interruption
            loss = damage_ratio * replacement_cost + business_interruption * damage_ratio
            
            damage_ratios.append(damage_ratio)
            losses.append(loss)
        
        # Calculate EAL using trapezoidal integration
        eal = self._calculate_eal(losses, self.RETURN_PERIODS)
        
        # Get PML for specific return periods
        pml_100yr = losses[3] if len(losses) > 3 else losses[-1]  # 100-year
        pml_250yr = losses[4] if len(losses) > 4 else losses[-1]  # 250-year
        
        # Calculate risk score (0-100)
        risk_score = min(100, (eal / max(asset_value, 1)) * 1000)
        
        return {
            "risk_score": round(risk_score, 2),
            "eal": round(eal, 4),
            "pml_100yr": round(pml_100yr, 4),
            "pml_250yr": round(pml_250yr, 4),
            "damage_ratios": {rp: round(dr, 4) for rp, dr in zip(self.RETURN_PERIODS, damage_ratios)},
            "intensity_curve": intensity_curve
        }
    
    def _get_hazard_intensity(
        self,
        hazard: str,
        lat: float,
        lon: float
    ) -> Dict[int, float]:
        """
        Get hazard intensity for different return periods.
        
        In production, this would query hazard data from:
        - Copernicus Climate Data Store
        - USGS (earthquake)
        - NOAA (flood, hurricane)
        - First Street Foundation (flood, wildfire)
        
        Args:
            hazard: Hazard type
            lat: Latitude
            lon: Longitude
            
        Returns:
            Dictionary of {return_period: intensity}
        """
        # Placeholder implementation
        # In production, query actual hazard data
        
        # Simulate hazard intensity based on location
        # This is a simplified model for demonstration
        
        np.random.seed(int(lat * 1000 + lon * 1000) % 2**31)
        
        base_intensity = {
            "flood": 0.5 + 0.3 * np.sin(lat * np.pi / 180),
            "wildfire": 0.3 + 0.4 * (1 - abs(lat) / 90),
            "hurricane": 0.4 * max(0, 1 - abs(lat - 25) / 40),
            "earthquake": 0.2 + 0.3 * np.random.random(),
            "heat": 0.4 + 0.3 * (1 - abs(lat) / 90),
            "drought": 0.3 + 0.2 * np.random.random()
        }.get(hazard, 0.3)
        
        # Intensity increases with return period
        intensity_curve = {}
        for rp in self.RETURN_PERIODS:
            # Gumbel distribution for extreme values
            scale = base_intensity / 2
            intensity = base_intensity + scale * np.log(rp / 10)
            intensity_curve[rp] = round(max(0, intensity), 4)
        
        return intensity_curve
    
    def _get_vulnerability_curve(
        self,
        hazard: str
    ) -> callable:
        """
        Get vulnerability curve for a hazard.
        
        Returns a function that maps hazard intensity to damage ratio.
        
        Args:
            hazard: Hazard type
            
        Returns:
            Interpolation function (intensity -> damage_ratio)
        """
        # Simplified vulnerability curves
        # In production, use sector-specific vulnerability functions
        
        curves = {
            "flood": {
                "intensity": [0, 0.3, 0.6, 1.0, 1.5, 2.0, 3.0],
                "damage_ratio": [0, 0.1, 0.25, 0.45, 0.65, 0.80, 0.95]
            },
            "wildfire": {
                "intensity": [0, 0.2, 0.4, 0.6, 0.8, 1.0],
                "damage_ratio": [0, 0.15, 0.35, 0.55, 0.75, 0.90]
            },
            "hurricane": {
                "intensity": [0, 50, 100, 150, 200, 250],  # km/h
                "damage_ratio": [0, 0.05, 0.20, 0.45, 0.70, 0.90]
            },
            "earthquake": {
                "intensity": [0, 5, 6, 7, 8, 9],  # MMI scale
                "damage_ratio": [0, 0.05, 0.15, 0.35, 0.60, 0.85]
            },
            "heat": {
                "intensity": [0, 30, 35, 40, 45, 50],  # °C
                "damage_ratio": [0, 0.02, 0.05, 0.10, 0.15, 0.20]
            },
            "drought": {
                "intensity": [0, 0.3, 0.5, 0.7, 0.9],  # SPI index
                "damage_ratio": [0, 0.05, 0.15, 0.30, 0.50]
            }
        }
        
        curve = curves.get(hazard, curves["flood"])
        
        return interp1d(
            curve["intensity"],
            curve["damage_ratio"],
            kind='linear',
            bounds_error=False,
            fill_value=(0, curve["damage_ratio"][-1])
        )
    
    def _calculate_eal(
        self,
        losses: List[float],
        return_periods: List[int]
    ) -> float:
        """
        Calculate Expected Annual Loss using trapezoidal integration.
        
        EAL = ∫ loss * f(loss) d(loss)
        
        Approximated using trapezoidal rule over return periods.
        
        Args:
            losses: List of losses for each return period
            return_periods: List of return periods
            
        Returns:
            Expected annual loss
        """
        # Convert return periods to annual exceedance probabilities
        aeps = [1/rp for rp in return_periods]
        
        # Sort by AEP (descending)
        sorted_pairs = sorted(zip(aeps, losses), key=lambda x: x[0], reverse=True)
        aeps_sorted = [p[0] for p in sorted_pairs]
        losses_sorted = [p[1] for p in sorted_pairs]
        
        # Trapezoidal integration
        eal = 0.0
        for i in range(len(aeps_sorted) - 1):
            delta_aep = aeps_sorted[i+1] - aeps_sorted[i]
            avg_loss = (losses_sorted[i] + losses_sorted[i+1]) / 2
            eal += abs(delta_aep) * avg_loss
        
        return eal
    
    def _calculate_aggregate_score(
        self,
        hazards: Dict[str, Dict]
    ) -> float:
        """
        Calculate aggregate physical risk score from individual hazards.
        
        Uses weighted aggregation with hazard-specific weights.
        
        Args:
            hazards: Dictionary of hazard risk results
            
        Returns:
            Aggregate risk score (0-100)
        """
        if not hazards:
            return 0.0
        
        # Hazard weights (can be customized)
        weights = {
            "flood": 0.25,
            "wildfire": 0.15,
            "hurricane": 0.20,
            "earthquake": 0.20,
            "heat": 0.10,
            "drought": 0.10
        }
        
        weighted_sum = 0.0
        total_weight = 0.0
        
        for hazard, risk_data in hazards.items():
            weight = weights.get(hazard, 0.1)
            weighted_sum += risk_data["risk_score"] * weight
            total_weight += weight
        
        return round(weighted_sum / total_weight, 2) if total_weight > 0 else 0.0
    
    def get_hazard_exposure_map(
        self,
        hazard: str,
        bounds: Tuple[float, float, float, float],  # min_lat, min_lon, max_lat, max_lon
        resolution: float = 0.1
    ) -> List[Dict]:
        """
        Generate hazard exposure map for a region.
        
        Args:
            hazard: Hazard type
            bounds: Bounding box (min_lat, min_lon, max_lat, max_lon)
            resolution: Grid resolution in degrees
            
        Returns:
            List of grid cells with hazard intensity
        """
        min_lat, min_lon, max_lat, max_lon = bounds
        
        grid = []
        lat = min_lat
        while lat <= max_lat:
            lon = min_lon
            while lon <= max_lon:
                intensity_curve = self._get_hazard_intensity(hazard, lat, lon)
                
                grid.append({
                    "latitude": round(lat, 4),
                    "longitude": round(lon, 4),
                    "intensity_100yr": intensity_curve.get(100, 0),
                    "intensity_250yr": intensity_curve.get(250, 0)
                })
                
                lon += resolution
            lat += resolution
        
        return grid
    
    def calculate_multi_hazard_compound_risk(
        self,
        lat: float,
        lon: float,
        hazards: List[str],
        correlation_matrix: Optional[np.ndarray] = None
    ) -> Dict[str, float]:
        """
        Calculate compound risk from multiple correlated hazards.
        
        Uses copula methods to account for hazard correlations.
        
        Args:
            lat: Latitude
            lon: Longitude
            hazards: List of hazards to include
            correlation_matrix: Hazard correlation matrix
            
        Returns:
            Dictionary with compound risk metrics
        """
        # Get individual hazard intensities
        intensities = []
        for hazard in hazards:
            intensity_curve = self._get_hazard_intensity(hazard, lat, lon)
            intensities.append(intensity_curve.get(100, 0))  # Use 100-year intensity
        
        # Default correlation matrix (independent if not provided)
        if correlation_matrix is None:
            correlation_matrix = np.eye(len(hazards))
        
        # Calculate compound intensity using copula
        # Simplified: use maximum intensity with correlation adjustment
        max_intensity = max(intensities) if intensities else 0
        
        # Correlation adjustment factor
        avg_correlation = np.mean(correlation_matrix[np.triu_indices_from(correlation_matrix, k=1)])
        compound_factor = 1 + 0.2 * avg_correlation  # 20% increase per unit correlation
        
        compound_intensity = max_intensity * compound_factor
        
        return {
            "compound_intensity": round(compound_intensity, 4),
            "max_individual_intensity": round(max_intensity, 4),
            "correlation_adjustment": round(compound_factor, 4),
            "individual_intensities": {h: i for h, i in zip(hazards, intensities)}
        }
