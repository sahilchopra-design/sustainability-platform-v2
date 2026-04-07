"""
Pydantic Schemas for API Validation
==================================
Request and response models for climate risk API endpoints.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from decimal import Decimal
from uuid import UUID
import numpy as np


# ============== Scenario Schemas ==============

class ScenarioBase(BaseModel):
    """Base scenario schema with common fields."""
    provider: str = Field(..., description="Scenario provider (NGFS, IEA, IPCC)")
    scenario_code: str = Field(..., description="Scenario code (NZ2050, NDC, etc.)")
    scenario_name: str
    description: Optional[str] = None
    temperature_outcome: Optional[Decimal] = Field(None, ge=1.0, le=5.0)
    temperature_probability: Optional[Decimal] = Field(None, ge=0.0, le=1.0)
    scenario_type: Optional[str] = "transition"
    time_horizon: Optional[int] = Field(None, ge=2024, le=2100)
    publication_year: Optional[int] = None
    version: Optional[str] = None
    region: Optional[str] = "Global"
    parameters: Optional[Dict[str, Any]] = None


class ScenarioCreate(ScenarioBase):
    """Schema for creating new scenarios."""
    pass


class ScenarioResponse(ScenarioBase):
    """Schema for scenario API responses."""
    scenario_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ScenarioListResponse(BaseModel):
    """Paginated scenario list response."""
    items: List[ScenarioResponse]
    total: int
    page: int
    page_size: int


# ============== Scenario Variable Schemas ==============

class ScenarioVariableBase(BaseModel):
    """Base variable schema."""
    variable_name: str
    variable_code: str
    unit: Optional[str] = None
    sector: Optional[str] = None
    region: Optional[str] = None


class ScenarioVariableCreate(ScenarioVariableBase):
    """Schema for creating scenario variables."""
    scenario_id: UUID
    time_series: Dict[int, float]  # {year: value}
    confidence_interval_lower: Optional[Dict[int, float]] = None
    confidence_interval_upper: Optional[Dict[int, float]] = None


class ScenarioVariableResponse(ScenarioVariableBase):
    """Schema for variable API responses."""
    variable_id: UUID
    scenario_id: UUID
    time_series: Dict[int, float]
    baseline_value: Optional[Decimal] = None
    final_value: Optional[Decimal] = None
    cagr: Optional[Decimal] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Asset Climate Risk Schemas ==============

class AssetClimateRiskBase(BaseModel):
    """Base asset risk schema."""
    asset_id: str
    asset_type: Literal["equity", "bond", "real_estate", "loan", "commodity"]
    scenario_id: UUID
    time_horizon_years: int = Field(..., ge=1, le=50)


class AssetClimateRiskCreate(AssetClimateRiskBase):
    """Schema for creating asset risk assessments."""
    # Physical risk inputs
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sector: str
    revenue: Optional[float] = None
    total_assets: Optional[float] = None
    market_cap: Optional[float] = None
    
    # Optional: pre-calculated exposure metrics
    flood_exposure: Optional[float] = None
    wildfire_exposure: Optional[float] = None
    hurricane_exposure: Optional[float] = None


class AssetClimateRiskResponse(AssetClimateRiskBase):
    """Schema for asset risk API responses."""
    risk_id: UUID
    
    # Physical risk scores (0-100)
    physical_risk_score: Optional[Decimal] = None
    flood_risk_score: Optional[Decimal] = None
    wildfire_risk_score: Optional[Decimal] = None
    hurricane_risk_score: Optional[Decimal] = None
    earthquake_risk_score: Optional[Decimal] = None
    heat_stress_risk_score: Optional[Decimal] = None
    drought_risk_score: Optional[Decimal] = None
    
    # Financial impacts
    expected_annual_loss: Optional[Decimal] = None
    probable_max_loss_100yr: Optional[Decimal] = None
    probable_max_loss_250yr: Optional[Decimal] = None
    
    # Transition risk
    transition_risk_score: Optional[Decimal] = None
    carbon_footprint_tco2e: Optional[Decimal] = None
    carbon_intensity: Optional[Decimal] = None
    stranded_asset_probability: Optional[Decimal] = None
    stranded_asset_value: Optional[Decimal] = None
    
    # Credit risk
    pd_increase_10yr: Optional[Decimal] = None
    lgd_increase_10yr: Optional[Decimal] = None
    ecl_impact: Optional[Decimal] = None
    
    # Valuation
    npv_impact_percent: Optional[Decimal] = None
    npv_impact_value: Optional[Decimal] = None
    
    assessment_date: datetime
    model_version: Optional[str] = None
    additional_metrics: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True


# ============== Portfolio Climate Risk Schemas ==============

class PortfolioClimateRiskBase(BaseModel):
    """Base portfolio risk schema."""
    portfolio_id: str
    portfolio_name: Optional[str] = None
    portfolio_type: Optional[str] = None
    scenario_id: UUID
    time_horizon_years: int = Field(..., ge=1, le=50)


class PortfolioClimateRiskCreate(PortfolioClimateRiskBase):
    """Schema for creating portfolio risk assessments."""
    total_aum: Optional[float] = None
    num_holdings: Optional[int] = None


class PortfolioClimateRiskResponse(PortfolioClimateRiskBase):
    """Schema for portfolio risk API responses."""
    portfolio_risk_id: UUID
    
    # Risk scores
    avg_physical_risk_score: Optional[Decimal] = None
    avg_transition_risk_score: Optional[Decimal] = None
    avg_combined_risk_score: Optional[Decimal] = None
    
    # Carbon metrics
    weighted_avg_carbon_intensity: Optional[Decimal] = None
    total_carbon_footprint: Optional[Decimal] = None
    carbon_coverage_percent: Optional[Decimal] = None
    
    # Financial impacts
    portfolio_eal: Optional[Decimal] = None
    portfolio_pml_100yr: Optional[Decimal] = None
    portfolio_stranded_value: Optional[Decimal] = None
    
    # VaR metrics
    var_95_1yr: Optional[Decimal] = None
    var_99_1yr: Optional[Decimal] = None
    cvar_95_1yr: Optional[Decimal] = None
    
    # Alignment
    temperature_alignment: Optional[Decimal] = None
    alignment_score: Optional[Decimal] = None
    paris_aligned_percent: Optional[Decimal] = None
    green_revenue_percent: Optional[Decimal] = None
    brown_share_percent: Optional[Decimal] = None
    
    # Breakdowns
    sector_breakdown: Optional[Dict[str, Any]] = None
    geography_breakdown: Optional[Dict[str, Any]] = None
    risk_distribution: Optional[Dict[str, Any]] = None
    top_risk_holdings: Optional[List[Dict[str, Any]]] = None
    
    reporting_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============== Ensemble Schemas ==============

class EnsembleRequest(BaseModel):
    """Request schema for creating scenario ensembles."""
    ensemble_name: str
    scenario_ids: List[UUID]
    weight_method: Literal["equal", "temperature", "likelihood", "expert", "bayesian"] = "equal"
    custom_weights: Optional[Dict[str, float]] = None  # scenario_id: weight
    confidence_level: float = Field(0.95, ge=0.5, le=0.99)
    
    @validator('scenario_ids')
    def validate_scenarios(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 scenarios required for ensemble")
        return v


class EnsembleResponse(BaseModel):
    """Response schema for ensemble results."""
    ensemble_id: UUID
    ensemble_name: str
    scenario_weights: Dict[str, float]
    weighting_method: str
    expected_temperature: Optional[Decimal] = None
    temperature_variance: Optional[Decimal] = None
    confidence_level: float
    credible_interval_lower: Optional[Decimal] = None
    credible_interval_upper: Optional[Decimal] = None
    log_marginal_likelihood: Optional[Decimal] = None
    created_at: datetime


# ============== Calculation Request Schemas ==============

class PhysicalRiskCalculationRequest(BaseModel):
    """Request for physical risk calculation."""
    asset_id: str
    asset_type: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    sector: str
    scenario_id: UUID
    time_horizon_years: int = Field(10, ge=1, le=50)
    
    # Financial parameters
    asset_value: Optional[float] = None
    replacement_cost: Optional[float] = None
    business_interruption: Optional[float] = None
    
    # Hazard selection
    hazards: List[Literal["flood", "wildfire", "hurricane", "earthquake", "heat", "drought"]] = [
        "flood", "wildfire", "hurricane", "earthquake", "heat", "drought"
    ]


class TransitionRiskCalculationRequest(BaseModel):
    """Request for transition risk calculation."""
    asset_id: str
    sector: str
    scenario_id: UUID
    time_horizon_years: int = Field(10, ge=1, le=50)
    
    # Emissions data
    scope1_emissions: Optional[float] = None  # tCO2e
    scope2_emissions: Optional[float] = None
    scope3_emissions: Optional[float] = None
    revenue: Optional[float] = None
    
    # Financial data
    market_cap: Optional[float] = None
    enterprise_value: Optional[float] = None
    debt: Optional[float] = None


class CreditRiskCalculationRequest(BaseModel):
    """Request for climate-adjusted credit risk calculation."""
    asset_id: str
    scenario_id: UUID
    time_horizon_years: int = Field(10, ge=1, le=50)
    
    # Current credit metrics
    current_pd: float = Field(..., ge=0.0, le=1.0)
    current_lgd: float = Field(..., ge=0.0, le=1.0)
    current_ead: float = Field(..., gt=0.0)
    
    # Asset data
    sector: str
    latitude: float
    longitude: float
    asset_value: float


class ValuationImpactRequest(BaseModel):
    """Request for climate-adjusted valuation calculation."""
    asset_id: str
    scenario_id: UUID
    time_horizon_years: int = Field(10, ge=1, le=50)
    
    # DCF parameters
    current_npv: float
    cash_flows: Dict[int, float]  # {year: cash_flow}
    discount_rate: float
    terminal_growth: float
    
    # Asset data
    sector: str
    latitude: float
    longitude: float


# ============== Batch Processing Schemas ==============

class BatchCalculationRequest(BaseModel):
    """Request for batch climate risk calculations."""
    portfolio_id: str
    scenario_id: UUID
    time_horizon_years: int = Field(10, ge=1, le=50)
    calculation_types: List[Literal["physical", "transition", "credit", "valuation"]] = [
        "physical", "transition"
    ]
    
    # Optional filters
    sector_filter: Optional[List[str]] = None
    geography_filter: Optional[List[str]] = None


class BatchCalculationResponse(BaseModel):
    """Response for batch calculation job."""
    job_id: UUID
    portfolio_id: str
    scenario_id: UUID
    status: Literal["queued", "processing", "completed", "failed"]
    total_assets: int
    processed_assets: int
    failed_assets: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result_location: Optional[str] = None  # URL to results


# ============== Reporting Schemas ==============

class TCFDReportRequest(BaseModel):
    """Request for TCFD-aligned climate risk report."""
    portfolio_id: str
    reporting_date: datetime
    time_horizons: List[int] = [2025, 2030, 2050]
    scenario_ids: List[UUID]
    
    # Report sections
    include_governance: bool = True
    include_strategy: bool = True
    include_risk_management: bool = True
    include_metrics: bool = True


class TCFDReportResponse(BaseModel):
    """Response for TCFD report generation."""
    report_id: UUID
    portfolio_id: str
    reporting_date: datetime
    report_url: str
    sections_generated: List[str]
    generated_at: datetime


# ============== Data Ingestion Schemas ==============

class DataIngestionRequest(BaseModel):
    """Request for climate data ingestion job."""
    source_provider: str
    data_type: Literal["scenario", "hazard", "exposure", "vulnerability", "carbon"]
    source_url: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None
    schedule: Optional[str] = None  # cron expression for recurring jobs


class DataIngestionResponse(BaseModel):
    """Response for data ingestion job."""
    job_id: UUID
    job_name: str
    status: Literal["queued", "running", "success", "failed", "partial"]
    records_processed: int
    records_failed: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    quality_score: Optional[Decimal] = None
    error_message: Optional[str] = None
