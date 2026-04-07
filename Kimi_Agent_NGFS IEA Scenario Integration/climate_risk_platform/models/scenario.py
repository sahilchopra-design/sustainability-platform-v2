"""
Climate Scenario Database Models
==============================
SQLAlchemy models for climate scenario data storage.
Based on NGFS, IEA, IPCC scenario frameworks.
"""

from sqlalchemy import (
    Column, String, Numeric, DateTime, Text, ForeignKey,
    Index, Integer, Boolean, JSON, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any

from config.database import Base


class Scenario(Base):
    """
    Climate scenario master table.
    Stores scenario metadata from NGFS, IEA, IPCC, and other providers.
    """
    __tablename__ = "scenarios"
    
    scenario_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False, index=True)  # NGFS, IEA, IPCC, etc.
    scenario_code = Column(String(20), nullable=False, index=True)  # NZ2050, NDC, etc.
    scenario_name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Temperature alignment
    temperature_outcome = Column(Numeric(3, 1))  # e.g., 1.5, 2.0, 2.5
    temperature_probability = Column(Numeric(5, 2))  # Probability of achieving target
    
    # Scenario characteristics
    scenario_type = Column(String(30))  # transition, physical, combined
    time_horizon = Column(Integer)  # Years from now
    
    # Metadata
    publication_year = Column(Integer)
    version = Column(String(20))
    region = Column(String(50))  # Global, EU, US, etc.
    
    # JSONB for flexible scenario parameters
    parameters = Column(JSONB)
    
    # Audit fields
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(100))
    
    # Relationships
    variables = relationship("ScenarioVariable", back_populates="scenario", cascade="all, delete-orphan")
    asset_risks = relationship("AssetClimateRisk", back_populates="scenario")
    portfolio_risks = relationship("PortfolioClimateRisk", back_populates="scenario")
    
    __table_args__ = (
        Index('idx_scenario_provider_code', 'provider', 'scenario_code', unique=True),
        Index('idx_scenario_temp', 'temperature_outcome'),
    )


class ScenarioVariable(Base):
    """
    Time-series variables for each scenario.
    Stores carbon price, temperature, GDP, etc. trajectories.
    """
    __tablename__ = "scenario_variables"
    
    variable_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("scenarios.scenario_id", ondelete="CASCADE"), nullable=False, index=True)
    
    variable_name = Column(String(100), nullable=False, index=True)
    variable_code = Column(String(50), nullable=False)
    unit = Column(String(30))
    
    # Time series data stored as JSONB array of {year: value} objects
    time_series = Column(JSONB, nullable=False)
    
    # Derived statistics
    baseline_value = Column(Numeric(20, 6))
    final_value = Column(Numeric(20, 6))
    cagr = Column(Numeric(10, 4))  # Compound annual growth rate
    
    # Sector and region specificity
    sector = Column(String(50))
    region = Column(String(50))
    
    # Uncertainty quantification
    confidence_interval_lower = Column(JSONB)  # Lower bound time series
    confidence_interval_upper = Column(JSONB)  # Upper bound time series
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    scenario = relationship("Scenario", back_populates="variables")
    
    __table_args__ = (
        Index('idx_scenario_variable', 'scenario_id', 'variable_code'),
    )


class AssetClimateRisk(Base):
    """
    Climate risk assessment results for individual assets.
    Links to portfolio holdings and counterparty data.
    """
    __tablename__ = "asset_climate_risk"
    
    risk_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Asset identification
    asset_id = Column(String(100), nullable=False, index=True)
    asset_type = Column(String(50), nullable=False)  # equity, bond, real_estate, loan
    
    # Scenario reference
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("scenarios.scenario_id"), nullable=False, index=True)
    
    # Physical risk metrics
    physical_risk_score = Column(Numeric(5, 2))  # 0-100 scale
    flood_risk_score = Column(Numeric(5, 2))
    wildfire_risk_score = Column(Numeric(5, 2))
    hurricane_risk_score = Column(Numeric(5, 2))
    earthquake_risk_score = Column(Numeric(5, 2))
    heat_stress_risk_score = Column(Numeric(5, 2))
    drought_risk_score = Column(Numeric(5, 2))
    
    # Physical risk financial impacts
    expected_annual_loss = Column(Numeric(20, 4))  # EAL in currency
    probable_max_loss_100yr = Column(Numeric(20, 4))  # PML 100-year
    probable_max_loss_250yr = Column(Numeric(20, 4))  # PML 250-year
    
    # Transition risk metrics
    transition_risk_score = Column(Numeric(5, 2))
    carbon_footprint_tco2e = Column(Numeric(20, 6))
    carbon_intensity = Column(Numeric(20, 6))  # tCO2e/$M revenue
    
    # Stranded asset analysis
    stranded_asset_probability = Column(Numeric(5, 4))
    stranded_asset_value = Column(Numeric(20, 4))
    
    # Credit risk metrics (IFRS 9 / Basel)
    pd_increase_10yr = Column(Numeric(10, 6))  # Probability of Default increase
    lgd_increase_10yr = Column(Numeric(10, 6))  # Loss Given Default increase
    ecl_impact = Column(Numeric(20, 4))  # Expected Credit Loss
    
    # Valuation impact
    npv_impact_percent = Column(Numeric(10, 4))  # NPV change %
    npv_impact_value = Column(Numeric(20, 4))  # NPV change in currency
    
    # Time horizon
    assessment_date = Column(DateTime(timezone=True), nullable=False)
    time_horizon_years = Column(Integer, nullable=False)
    
    # Model metadata
    model_version = Column(String(50))
    calculation_method = Column(String(50))
    
    # JSONB for additional metrics
    additional_metrics = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    scenario = relationship("Scenario", back_populates="asset_risks")
    
    __table_args__ = (
        Index('idx_asset_scenario', 'asset_id', 'scenario_id'),
        Index('idx_asset_risk_scores', 'physical_risk_score', 'transition_risk_score'),
    )


class PortfolioClimateRisk(Base):
    """
    Aggregated climate risk at portfolio level.
    Supports TCFD reporting and regulatory disclosures.
    """
    __tablename__ = "portfolio_climate_risk"
    
    portfolio_risk_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Portfolio identification
    portfolio_id = Column(String(100), nullable=False, index=True)
    portfolio_name = Column(String(200))
    portfolio_type = Column(String(50))  # fund, index, mandate
    
    # Scenario reference
    scenario_id = Column(UUID(as_uuid=True), ForeignKey("scenarios.scenario_id"), nullable=False, index=True)
    
    # Portfolio metrics
    total_aum = Column(Numeric(20, 4))
    num_holdings = Column(Integer)
    
    # Weighted average risk scores
    avg_physical_risk_score = Column(Numeric(5, 2))
    avg_transition_risk_score = Column(Numeric(5, 2))
    avg_combined_risk_score = Column(Numeric(5, 2))
    
    # Carbon metrics
    weighted_avg_carbon_intensity = Column(Numeric(20, 6))
    total_carbon_footprint = Column(Numeric(20, 4))
    carbon_coverage_percent = Column(Numeric(5, 2))
    
    # Financial impact aggregation
    portfolio_eal = Column(Numeric(20, 4))
    portfolio_pml_100yr = Column(Numeric(20, 4))
    portfolio_stranded_value = Column(Numeric(20, 4))
    
    # Value at Risk metrics
    var_95_1yr = Column(Numeric(20, 4))
    var_99_1yr = Column(Numeric(20, 4))
    cvar_95_1yr = Column(Numeric(20, 4))  # Conditional VaR
    
    # Climate alignment
    temperature_alignment = Column(Numeric(3, 1))
    alignment_score = Column(Numeric(5, 2))
    
    # Paris agreement alignment
    paris_aligned_percent = Column(Numeric(5, 2))
    green_revenue_percent = Column(Numeric(5, 2))
    brown_share_percent = Column(Numeric(5, 2))
    
    # Sector breakdown (JSONB)
    sector_breakdown = Column(JSONB)
    geography_breakdown = Column(JSONB)
    
    # Reporting metadata
    reporting_date = Column(DateTime(timezone=True), nullable=False)
    time_horizon_years = Column(Integer)
    
    # JSONB for additional analysis
    risk_distribution = Column(JSONB)  # Histogram of risk scores
    top_risk_holdings = Column(JSONB)  # Top 10 at-risk positions
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    scenario = relationship("Scenario", back_populates="portfolio_risks")
    
    __table_args__ = (
        Index('idx_portfolio_scenario', 'portfolio_id', 'scenario_id'),
        Index('idx_portfolio_reporting', 'reporting_date'),
    )


class ScenarioEnsemble(Base):
    """
    Bayesian ensemble configurations and results.
    Stores weights and uncertainty for multi-scenario analysis.
    """
    __tablename__ = "scenario_ensembles"
    
    ensemble_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ensemble_name = Column(String(200), nullable=False)
    
    # Ensemble configuration
    scenario_weights = Column(JSONB, nullable=False)  # {scenario_id: weight}
    weighting_method = Column(String(50))  # equal, temperature, likelihood, expert
    
    # Ensemble statistics
    expected_temperature = Column(Numeric(3, 1))
    temperature_variance = Column(Numeric(5, 2))
    
    # Uncertainty quantification
    confidence_level = Column(Numeric(3, 2))  # e.g., 0.95
    credible_interval_lower = Column(Numeric(3, 1))
    credible_interval_upper = Column(Numeric(3, 1))
    
    # Model evidence (Bayesian)
    log_marginal_likelihood = Column(Numeric(20, 6))
    bayes_factor_matrix = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(100))
    
    __table_args__ = (
        Index('idx_ensemble_method', 'weighting_method'),
    )


class ClimateDataIngestionLog(Base):
    """
    Audit log for climate data ingestion jobs.
    Tracks data quality and processing statistics.
    """
    __tablename__ = "climate_data_ingestion_log"
    
    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Job identification
    job_name = Column(String(100), nullable=False)
    job_type = Column(String(50))  # scenario, hazard, exposure, vulnerability
    
    # Data source
    source_provider = Column(String(50))
    source_url = Column(Text)
    
    # Processing statistics
    records_processed = Column(Integer)
    records_failed = Column(Integer)
    records_skipped = Column(Integer)
    
    # Timing
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    
    # Status
    status = Column(String(20))  # running, success, failed, partial
    error_message = Column(Text)
    
    # Data quality metrics
    quality_score = Column(Numeric(5, 2))
    completeness_percent = Column(Numeric(5, 2))
    
    # Metadata
    processing_parameters = Column(JSONB)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index('idx_ingestion_job', 'job_name', 'started_at'),
        Index('idx_ingestion_status', 'status'),
    )
