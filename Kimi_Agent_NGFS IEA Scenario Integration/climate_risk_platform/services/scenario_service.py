"""
Scenario Service
===============
Business logic for climate scenario management.
Handles CRUD operations, ensemble generation, and scenario analysis.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional, Dict, Any, Tuple
from decimal import Decimal
from uuid import UUID
import numpy as np
from scipy import stats
import logging

from models.scenario import Scenario, ScenarioVariable, ScenarioEnsemble
from models.schemas import (
    ScenarioCreate, ScenarioResponse, ScenarioVariableCreate,
    EnsembleRequest, EnsembleResponse
)

logger = logging.getLogger(__name__)


class ScenarioService:
    """
    Service class for climate scenario operations.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # ============== Scenario CRUD Operations ==============
    
    def get_scenarios(
        self,
        provider: Optional[str] = None,
        temperature: Optional[float] = None,
        scenario_type: Optional[str] = None,
        region: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[ScenarioResponse], int]:
        """
        Get scenarios with optional filtering.
        
        Args:
            provider: Filter by scenario provider (NGFS, IEA, etc.)
            temperature: Filter by temperature outcome
            scenario_type: Filter by scenario type
            region: Filter by region
            skip: Pagination offset
            limit: Pagination limit
            
        Returns:
            Tuple of (list of scenarios, total count)
        """
        query = self.db.query(Scenario)
        
        if provider:
            query = query.filter(Scenario.provider == provider)
        if temperature:
            query = query.filter(
                func.abs(Scenario.temperature_outcome - temperature) < Decimal('0.25')
            )
        if scenario_type:
            query = query.filter(Scenario.scenario_type == scenario_type)
        if region:
            query = query.filter(Scenario.region == region)
        
        total = query.count()
        scenarios = query.offset(skip).limit(limit).all()
        
        return [ScenarioResponse.from_orm(s) for s in scenarios], total
    
    def get_scenario_by_id(self, scenario_id: UUID) -> Optional[ScenarioResponse]:
        """
        Get a single scenario by ID.
        
        Args:
            scenario_id: UUID of the scenario
            
        Returns:
            ScenarioResponse if found, None otherwise
        """
        scenario = self.db.query(Scenario).filter(
            Scenario.scenario_id == scenario_id
        ).first()
        
        return ScenarioResponse.from_orm(scenario) if scenario else None
    
    def get_scenario_variables(
        self,
        scenario_id: UUID,
        variable_code: Optional[str] = None
    ) -> List[ScenarioVariable]:
        """
        Get variables for a scenario.
        
        Args:
            scenario_id: UUID of the scenario
            variable_code: Optional filter by variable code
            
        Returns:
            List of scenario variables
        """
        query = self.db.query(ScenarioVariable).filter(
            ScenarioVariable.scenario_id == scenario_id
        )
        
        if variable_code:
            query = query.filter(ScenarioVariable.variable_code == variable_code)
        
        return query.all()
    
    def create_scenario(
        self,
        scenario_data: ScenarioCreate
    ) -> ScenarioResponse:
        """
        Create a new climate scenario.
        
        Args:
            scenario_data: Scenario creation data
            
        Returns:
            Created scenario response
        """
        scenario = Scenario(**scenario_data.dict())
        self.db.add(scenario)
        self.db.commit()
        self.db.refresh(scenario)
        
        logger.info(f"Created scenario {scenario.scenario_id}")
        return ScenarioResponse.from_orm(scenario)
    
    def create_scenario_variable(
        self,
        variable_data: ScenarioVariableCreate
    ) -> ScenarioVariable:
        """
        Create a new scenario variable.
        
        Args:
            variable_data: Variable creation data
            
        Returns:
            Created scenario variable
        """
        # Calculate derived statistics
        time_series = variable_data.time_series
        years = sorted(time_series.keys())
        values = [time_series[y] for y in years]
        
        baseline = Decimal(str(values[0]))
        final = Decimal(str(values[-1]))
        
        # Calculate CAGR
        n_years = years[-1] - years[0]
        if n_years > 0 and values[0] != 0:
            cagr = Decimal(str((values[-1] / values[0]) ** (1/n_years) - 1))
        else:
            cagr = Decimal('0')
        
        variable = ScenarioVariable(
            scenario_id=variable_data.scenario_id,
            variable_name=variable_data.variable_name,
            variable_code=variable_data.variable_code,
            unit=variable_data.unit,
            time_series=time_series,
            baseline_value=baseline,
            final_value=final,
            cagr=cagr,
            sector=variable_data.sector,
            region=variable_data.region,
            confidence_interval_lower=variable_data.confidence_interval_lower,
            confidence_interval_upper=variable_data.confidence_interval_upper
        )
        
        self.db.add(variable)
        self.db.commit()
        self.db.refresh(variable)
        
        logger.info(f"Created variable {variable.variable_id}")
        return variable
    
    # ============== Ensemble Operations ==============
    
    def generate_ensemble(
        self,
        request: EnsembleRequest
    ) -> EnsembleResponse:
        """
        Generate Bayesian ensemble from multiple scenarios.
        
        Args:
            request: Ensemble configuration
            
        Returns:
            Ensemble response with weights and statistics
        """
        # Fetch scenarios
        scenarios = self.db.query(Scenario).filter(
            Scenario.scenario_id.in_(request.scenario_ids)
        ).all()
        
        if len(scenarios) < 2:
            raise ValueError("At least 2 scenarios required for ensemble")
        
        # Calculate weights based on method
        if request.weight_method == "equal":
            weights = self._equal_weights(scenarios)
        elif request.weight_method == "temperature":
            weights = self._temperature_weights(scenarios)
        elif request.weight_method == "likelihood":
            weights = self._likelihood_weights(scenarios)
        elif request.weight_method == "expert":
            weights = request.custom_weights or self._equal_weights(scenarios)
        elif request.weight_method == "bayesian":
            weights = self._bayesian_weights(scenarios)
        else:
            weights = self._equal_weights(scenarios)
        
        # Normalize weights
        total_weight = sum(weights.values())
        weights = {k: v/total_weight for k, v in weights.items()}
        
        # Calculate ensemble statistics
        temperatures = [float(s.temperature_outcome) for s in scenarios if s.temperature_outcome]
        scenario_weights_list = [weights[str(s.scenario_id)] for s in scenarios if s.temperature_outcome]
        
        if temperatures and scenario_weights_list:
            expected_temp = np.average(temperatures, weights=scenario_weights_list)
            temp_variance = np.average(
                (np.array(temperatures) - expected_temp) ** 2,
                weights=scenario_weights_list
            )
            
            # Calculate credible interval
            alpha = 1 - request.confidence_level
            sorted_indices = np.argsort(temperatures)
            sorted_temps = np.array(temperatures)[sorted_indices]
            sorted_weights = np.array(scenario_weights_list)[sorted_indices]
            cumulative_weights = np.cumsum(sorted_weights)
            
            lower_idx = np.searchsorted(cumulative_weights, alpha/2)
            upper_idx = np.searchsorted(cumulative_weights, 1 - alpha/2)
            
            credible_lower = sorted_temps[max(0, lower_idx)]
            credible_upper = sorted_temps[min(len(sorted_temps)-1, upper_idx)]
        else:
            expected_temp = None
            temp_variance = None
            credible_lower = None
            credible_upper = None
        
        # Create ensemble record
        ensemble = ScenarioEnsemble(
            ensemble_name=request.ensemble_name,
            scenario_weights=weights,
            weighting_method=request.weight_method,
            expected_temperature=Decimal(str(expected_temp)) if expected_temp else None,
            temperature_variance=Decimal(str(temp_variance)) if temp_variance else None,
            confidence_level=Decimal(str(request.confidence_level)),
            credible_interval_lower=Decimal(str(credible_lower)) if credible_lower else None,
            credible_interval_upper=Decimal(str(credible_upper)) if credible_upper else None
        )
        
        self.db.add(ensemble)
        self.db.commit()
        self.db.refresh(ensemble)
        
        logger.info(f"Created ensemble {ensemble.ensemble_id}")
        
        return EnsembleResponse(
            ensemble_id=ensemble.ensemble_id,
            ensemble_name=ensemble.ensemble_name,
            scenario_weights=weights,
            weighting_method=ensemble.weighting_method,
            expected_temperature=ensemble.expected_temperature,
            temperature_variance=ensemble.temperature_variance,
            confidence_level=request.confidence_level,
            credible_interval_lower=ensemble.credible_interval_lower,
            credible_interval_upper=ensemble.credible_interval_upper,
            log_marginal_likelihood=ensemble.log_marginal_likelihood,
            created_at=ensemble.created_at
        )
    
    def _equal_weights(
        self,
        scenarios: List[Scenario]
    ) -> Dict[str, float]:
        """Generate equal weights for all scenarios."""
        n = len(scenarios)
        return {str(s.scenario_id): 1.0/n for s in scenarios}
    
    def _temperature_weights(
        self,
        scenarios: List[Scenario]
    ) -> Dict[str, float]:
        """
        Weight scenarios inversely by temperature deviation from 1.5°C.
        Lower temperature scenarios get higher weight.
        """
        target_temp = 1.5
        weights = {}
        
        for s in scenarios:
            if s.temperature_outcome:
                temp = float(s.temperature_outcome)
                # Inverse weighting with exponential decay
                deviation = abs(temp - target_temp)
                weights[str(s.scenario_id)] = np.exp(-deviation)
            else:
                weights[str(s.scenario_id)] = 1.0
        
        return weights
    
    def _likelihood_weights(
        self,
        scenarios: List[Scenario]
    ) -> Dict[str, float]:
        """
        Weight scenarios by their stated probability of achieving temperature target.
        """
        weights = {}
        
        for s in scenarios:
            if s.temperature_probability:
                weights[str(s.scenario_id)] = float(s.temperature_probability)
            else:
                weights[str(s.scenario_id)] = 1.0
        
        return weights
    
    def _bayesian_weights(
        self,
        scenarios: List[Scenario]
    ) -> Dict[str, float]:
        """
        Calculate Bayesian model averaging weights.
        Uses BIC approximation for model evidence.
        """
        # This is a simplified implementation
        # Full implementation would require likelihood calculations
        
        weights = {}
        bic_scores = []
        
        for s in scenarios:
            # Simplified BIC calculation
            # In practice, this would use actual model fit statistics
            if s.temperature_outcome:
                temp = float(s.temperature_outcome)
                # Prefer scenarios closer to 1.5°C with lower variance
                bic = -2 * np.log(max(0.01, 1 - abs(temp - 1.5)/3))
                bic_scores.append(bic)
                weights[str(s.scenario_id)] = bic
            else:
                bic_scores.append(0)
                weights[str(s.scenario_id)] = 1.0
        
        # Convert BIC to posterior probabilities
        min_bic = min(bic_scores) if bic_scores else 0
        exp_bic = [np.exp(-0.5 * (bic - min_bic)) for bic in bic_scores]
        
        for i, s in enumerate(scenarios):
            weights[str(s.scenario_id)] = exp_bic[i]
        
        return weights
    
    # ============== Scenario Analysis ==============
    
    def get_carbon_price_trajectory(
        self,
        scenario_id: UUID,
        sector: Optional[str] = None
    ) -> Dict[int, float]:
        """
        Get carbon price trajectory for a scenario.
        
        Args:
            scenario_id: UUID of the scenario
            sector: Optional sector filter
            
        Returns:
            Dictionary of {year: carbon_price}
        """
        query = self.db.query(ScenarioVariable).filter(
            and_(
                ScenarioVariable.scenario_id == scenario_id,
                ScenarioVariable.variable_code.ilike("%carbon%")
            )
        )
        
        if sector:
            query = query.filter(
                func.coalesce(ScenarioVariable.sector, "").ilike(f"%{sector}%")
            )
        
        variable = query.first()
        
        return variable.time_series if variable else {}
    
    def get_temperature_trajectory(
        self,
        scenario_id: UUID
    ) -> Dict[int, float]:
        """
        Get temperature trajectory for a scenario.
        
        Args:
            scenario_id: UUID of the scenario
            
        Returns:
            Dictionary of {year: temperature}
        """
        variable = self.db.query(ScenarioVariable).filter(
            and_(
                ScenarioVariable.scenario_id == scenario_id,
                ScenarioVariable.variable_code.ilike("%temperature%")
            )
        ).first()
        
        return variable.time_series if variable else {}
    
    def compare_scenarios(
        self,
        scenario_ids: List[UUID],
        variable_code: str
    ) -> Dict[str, Dict[int, float]]:
        """
        Compare variable trajectories across multiple scenarios.
        
        Args:
            scenario_ids: List of scenario UUIDs
            variable_code: Variable code to compare
            
        Returns:
            Dictionary of {scenario_name: {year: value}}
        """
        results = {}
        
        for scenario_id in scenario_ids:
            scenario = self.db.query(Scenario).filter(
                Scenario.scenario_id == scenario_id
            ).first()
            
            if not scenario:
                continue
            
            variable = self.db.query(ScenarioVariable).filter(
                and_(
                    ScenarioVariable.scenario_id == scenario_id,
                    ScenarioVariable.variable_code == variable_code
                )
            ).first()
            
            if variable:
                results[scenario.scenario_name] = variable.time_series
        
        return results
