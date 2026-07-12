# Calculation Engine Catalog

*Generated 2026-07-07 by AST scan of `backend/services/` — 297 engine modules, 231,734 lines of code, 3,264 functions. Grouping is filename-keyword heuristic (first match wins); the Module Atlas (`docs/module_atlas/`, §2.3 per module) is authoritative for any single engine. Regenerate with `python scripts/gen_catalogs.py` (also regenerates DATABASE_CATALOG.md).*

## Summary by domain

| Domain | Engines | LOC |
|---|---|---|
| Climate risk (physical & transition) | 41 | 35,834 |
| Carbon markets, credits & accounting | 11 | 12,391 |
| PCAF / financed & avoided emissions | 13 | 9,729 |
| Prudential & banking regulation | 8 | 7,486 |
| Insurance & actuarial | 3 | 2,448 |
| Regulatory disclosure (CSRD/SFDR/ISSB/EU-Tax/XBRL/CBAM) | 29 | 24,652 |
| Energy & power finance | 7 | 3,740 |
| Capital markets, valuation & portfolio | 21 | 17,367 |
| Nature, biodiversity, water & land | 18 | 13,291 |
| Real estate & built environment | 5 | 2,909 |
| Supply chain & trade | 8 | 7,004 |
| Sovereign, macro & geopolitical | 6 | 2,329 |
| Entity & reference data services | 6 | 2,968 |
| Data platform, lineage, AI/ML services | 11 | 11,420 |
| Materiality, engagement & strategy | 12 | 10,544 |
| Other / cross-cutting | 98 | 67,622 |
| **Total** | **297** | **231,734** |

## Climate risk (physical & transition)  (41 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `stranded_asset_calculator.py` | Stranded Asset Calculation Engine | ReserveImpairmentCalculator, PowerPlantValuator, InfrastructureValuator, TechnologyDisruptionTracker | 47 | 1758 |
| `climate_policy_tracker_engine.py` | Climate Policy Tracking Engine | JurisdictionAssessment, NDCAmbitiionScore, PolicyImpactResult, ClimatePolicyTrackerEngine | 12 | 1581 |
| `ecl_climate_engine.py` | IFRS 9 ECL Climate Engine -- Basel III/IV Climate Risk / EBA GL/2022/16 / BCBS Climate Guidance | IFRS9Stage, AssetClass, ClimateScenario, SICRTrigger | 23 | 1549 |
| `em_climate_risk_engine.py` | Emerging Market Climate & Transition Risk Engine — E87 | EMClimateRiskEngine | 11 | 1510 |
| `climate_tech_engine.py` | Climate Tech Investment Engine (E118) | TechnologyAssessmentResult, InvestmentOpportunityResult, PortfolioAnalysisResult, LearningCurveResult | 8 | 1500 |
| `climate_litigation_engine.py` | Climate Litigation Risk Engine (E91) | GreenwashingRiskResult, DisclosureLiabilityResult, FiduciaryDutyResult, AttributionScienceResult | 6 | 1480 |
| `climate_transition_risk_engine.py` | Climate Transition Risk Engine | TransitionRiskConfig, SectorClassificationResult, CarbonPricingResult, StrandedAssetResult | 15 | 1346 |
| `climate_financial_statements_engine.py` | Climate Financial Statement Adjustments Engine — E86 | ClimateFinancialStatementsEngine | 9 | 1332 |
| `adaptation_finance_engine.py` | Adaptation Finance & Resilience Economics Engine — E83 | AdaptationFinanceEngine | 10 | 1290 |
| `stress_test_orchestrator_engine.py` | E100 — Multi-Regulatory Climate Stress Test Orchestrator | SectorExposure, StressTestRequest, ScenarioComparisonRequest | 10 | 1232 |
| `climate_insurance_engine.py` | E79 — Climate Insurance & Parametric Risk Engine | InsurancePortfolioInput, ParametricDesignInput, NatCatInput, ClimateInsuranceResult | 8 | 1158 |
| `climate_physical_risk_engine.py` | Climate Physical Risk Engine | PhysicalRiskConfig, HazardScore, ExposureResult, VulnerabilityResult | 18 | 1155 |
| `climate_derivatives_engine.py` | E106 — Climate-Linked Structured Products Engine | (functions only) | 8 | 1139 |
| `physical_risk_pricing_engine.py` | Physical Climate Risk Pricing Engine — E104 | (functions only) | 13 | 1104 |
| `scenario_analysis_engine.py` | Interactive Scenario Builder and Sensitivity Analysis Engine | ScenarioBuilderEngine, SensitivityAnalysisEngine, WhatIfAnalysisEngine, InteractiveScenarioEngine | 36 | 1085 |
| `crypto_climate_engine.py` | E76 — Digital Assets & Crypto Climate Risk Engine | CryptoAssetInput, MiningGeographyInput, CryptoPortfolioInput, CryptoClimateResult | 12 | 1003 |
| `climate_mrv_engine.py` | Climate Data & MRV Engine — E73 | MRVSystemResult, SatelliteCoverageResult, DataQualityResult, DigitalMRVMaturityResult | 7 | 965 |
| `temperature_alignment_engine.py` | Financed Emissions Temperature Alignment Engine (E103) | HoldingEntry, SBTiTargets, TemperatureAlignmentRequest, WACIRequest | 10 | 901 |
| `sec_climate_engine.py` | SEC Climate Disclosure Engine | FilerAssessmentResult, GHGDisclosureResult, FinancialEffectsResult, MaterialityAssessmentResult | 12 | 871 |
| `sovereign_debt_climate_engine.py` | Climate-Linked Sovereign Debt Engine — E69 | CRDCAssessment, DebtForNatureResult, IMFRSTAssessment, SIDSVulnerabilityResult | 5 | 844 |
| `prudential_climate_risk_engine.py` | Prudential Climate Risk Engine — E45 | PrudentialClimateRiskEngine | 11 | 818 |
| `global_physical_risk_engine.py` | Global Physical Risk Engine — Composite Digital-Twin Overlay | (functions only) | 19 | 803 |
| `stress_test_runner.py` | Multi-Scenario Climate Stress Test Runner | LoanBookExposure, ScenarioExposureResult, MigrationMatrix, SectorConcentration | 13 | 787 |
| `stranded_asset_db_service.py` | Database service for Stranded Assets module. | StrandedAssetDBService | 19 | 702 |
| `climate_finance_engine.py` | climate_finance_engine.py — E78 Climate Finance Flows | (functions only) | 6 | 690 |
| `aviation_climate_engine.py` | Aviation Climate Engine | CORSIAResult, SAFComplianceResult, IRA45ZResult, EUETSAviationResult | 7 | 654 |
| `climate_risk_aggregator.py` | Climate Risk Aggregator -- Multi-Level Roll-Up of Risk Scores | AggregationConfig, EntityNode, AggregationResult, ClimateRiskAggregator | 12 | 605 |
| `physical_hazard_engine.py` | Physical Climate Hazard Scoring Engine | PhysicalHazardEngine | 9 | 573 |
| `health_climate_engine.py` | E59: Health-Climate Nexus & Social Risk Engine | (functions only) | 10 | 567 |
| `climate_stress_test_engine.py` | Climate Stress Test Engine — Sprint 26 | ClimateStressTestEngine | 8 | 553 |
| `counterparty_climate_scorer.py` | Counterparty Climate Risk Scorer -- Composite Climate Score (0-100) | CounterpartyInput, ScoreBreakdown, ClimateScoreResult, CounterpartyClimateScorer | 11 | 545 |
| `sovereign_climate_risk_engine.py` | Sovereign Climate Risk Engine | SovereignClimateRiskResult, SovereignPortfolioResult, SovereignClimateRiskEngine | 5 | 529 |
| `climate_integrated_risk.py` | Climate Integrated Risk Calculator | IntegrationConfig, IntegratedRiskResult, ClimateIntegratedRisk | 8 | 510 |
| `scenario_comparison_service.py` | Scenario Comparison & Analysis Service. | ScenarioComparisonService | 22 | 467 |
| `spatial_hazard_service.py` | Spatial Hazard Service | HazardProfile, SpatialOverlapResult, SpatialHazardService | 10 | 466 |
| `scenario_impact_service.py` | Scenario Impact Service. | ScenarioImpactService | 9 | 370 |
| `ngfs_seeder.py` | Seed all 24 NGFS scenarios with parameters and time series data. | (functions only) | 1 | 340 |
| `ngfs_sync_service.py` | NGFS Data Synchronization Service. | NGFSSyncService | 6 | 311 |
| `insurance_climate_risk.py` | Insurance Climate Risk Calculator | InsuranceCATInput, InsuranceCATResult | 2 | 294 |
| `scenario_builder_service.py` | Scenario Builder Service. | ScenarioBuilderService | 13 | 288 |
| `custom_scenario_builder.py` | Custom Scenario Builder — blend trajectories from multiple source scenarios. | (functions only) | 1 | 159 |

## Carbon markets, credits & accounting  (11 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `cdm_tools_engine.py` | CDM Methodological Tools Engine | CDMToolCategory | 50 | 2538 |
| `carbon_accounting_ai_engine.py` | E78 — Carbon Accounting AI & Automation Engine | GHGDisclosureInput, EmissionFactorQuery, Scope3TransactionInput, CarbonAccountingAIResult | 8 | 1927 |
| `internal_carbon_price_engine.py` | Internal Carbon Pricing & Net-Zero Economics Engine — E84 | InternalCarbonPriceEngine | 19 | 1901 |
| `vcm_integrity_engine.py` | Voluntary Carbon Market (VCM) Integrity Engine — E96 | (functions only) | 10 | 1432 |
| `carbon_removal_engine.py` | Carbon Removal & CDR Finance Engine (E90) | CDRTechnologyResult, OxfordPrinciplesResult, Article64Result, CDREconomicsResult | 8 | 1293 |
| `carbon_price_ets_engine.py` | Carbon Price Forecasting & ETS Analytics Engine — E71 | ETSComplianceCost, EUETSForecast, CBAMExposure, PortfolioCarbonCost | 6 | 874 |
| `carbon_calculator_v2.py` | Carbon Credit Calculation Engine V2 - Sector-Specific Calculations | ScenarioType | 14 | 727 |
| `carbon_markets_intel_engine.py` | Carbon Markets Intelligence Engine — E46 | CarbonMarketsIntelEngine | 8 | 710 |
| `carbon_credit_quality_engine.py` | Carbon Credit Quality & Integrity Engine. | CarbonCreditQuality, CarbonCreditQualityEngine | 11 | 554 |
| `carbon_calculator.py` | Carbon Credits Calculation Engine | CarbonCalculationEngine | 8 | 417 |
| `real_estate_carbon_analytics_engine.py` | Business logic for the real-estate-carbon-analytics module — single source of truth for calculations. | RealEstateCarbonAnalyticsEngine | 1 | 18 |

## PCAF / financed & avoided emissions  (13 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `pcaf_unified_engine.py` | PCAF Unified Orchestration Engine | AssetClassMeta, InsuranceHoldingInput, InsuranceHoldingResult, PortfolioInsuranceResult | 44 | 1944 |
| `pcaf_quality_engine.py` | PCAF Data Quality Score Engine | PCAFHoldingQualityScore, PCAFPortfolioQualityReport, PCAFDataQualityAssessment, PCAFQualityEngine | 28 | 1632 |
| `pcaf_sovereign_engine.py` | PCAF Sovereign Bonds and Loans Engine | PCAFSovereignAssessment, PCAFSovereignEngine | 11 | 1055 |
| `supply_chain_scope3_engine.py` | Supply Chain Scope 3 Emissions Engine -- GHG Protocol Corporate Value Chain Standard | Scope3Category, CalculationMethod, DataQuality, ActivityData | 12 | 897 |
| `pcaf_waci_engine.py` | PCAF Financed Emissions & WACI Engine | PCAFAssetClass, DataQualityScore, EmissionsBoundary, InvesteeData | 7 | 809 |
| `scope3_analytics_engine.py` | Scope 3 Analytics Engine — Sprint 26 | Scope3AnalyticsEngine | 6 | 690 |
| `pcaf_asset_classes.py` | PCAF Asset Class Registry (P1-6) | DQSDerivationResult | 4 | 604 |
| `avoided_emissions_engine.py` | Scope 4 / Avoided Emissions Engine | AvoidedEmissionsEngine | 11 | 540 |
| `pcaf_ecl_bridge.py` | PCAF -> ECL Climate Overlay Bridge Service | PCAFInvesteeProfile, ECLClimateInputs, PortfolioBridgeResult | 8 | 451 |
| `pcaf_time_series_engine.py` | PCAF Time-Series Engine — Glidepath tracking, RAG status, and alert generation. | GlidepathDataPoint, SectorGlidepathResult, CRREMAssetResult, GlidepathStatusRow | 6 | 301 |
| `scope3_categories_engine.py` | Scope 3 Categories Engine — E21 | CategoryResult, PortfolioScope3, Scope3Assessment, Scope3CategoriesEngine | 6 | 300 |
| `test_scope3_all15.py` | GHG Protocol — All 15 Scope 3 Categories | (functions only) | 1 | 271 |
| `scope3_cat11.py` | Scope 3 Category 11 — Use of Sold Products | FuelSoldInput, ProductSoldInput, FuelEmissionsResult, ProductEmissionsResult | 3 | 235 |

## Prudential & banking regulation  (8 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `basel_capital_engine.py` | Basel III/IV Regulatory Capital Engine | ExposureRiskWeight, CapitalRequirementResult, LiquidityResult, CapitalAdequacyDashboard | 22 | 1738 |
| `regulatory_capital_optimizer_engine.py` | Regulatory Capital Optimization Engine — Basel IV / CRR3 | ExposureItem, RWAResult, FRTBResult, SACCRResult | 11 | 1330 |
| `nature_capital_accounting_engine.py` | Nature Capital Accounting Engine — E116 | NatureCapitalAccountingEngine | 10 | 1164 |
| `banking_risk_engine.py` | Banking Risk Engine | CreditRiskResult, LiquidityRiskResult, MarketRiskResult, OperationalRiskResult | 11 | 819 |
| `basel3_liquidity_engine.py` | Basel III Liquidity Risk Engine | LCRResult, NSFRResult, ALMGapResult, LiquidityStressResult | 11 | 777 |
| `nature_capital_engine.py` | nature_capital_engine.py — E77 Nature Capital Accounting | (functions only) | 7 | 754 |
| `ecl_gar_pillar3_orchestrator.py` | ECL → GAR → Pillar 3 Art. 449a Orchestration Chain (E1) | ExposureInput, ExposureResult, Pillar3Section, OrchestrationResult | 4 | 600 |
| `eba_pillar3_engine.py` | EBA Pillar 3 ESG Disclosures Engine — E20 | PhysicalRiskHeatmap, FinancedEmissions, TaxonomyKPIs, EBAPillar3Assessment | 8 | 304 |

## Insurance & actuarial  (3 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `eiopa_stress_engine.py` | EIOPA ORSA Climate Stress Test Engine (E7) | InsurerInput, AssetShockResult, UnderwritingShockResult, CapitalImpactResult | 13 | 951 |
| `insurance_risk_engine.py` | Insurance Risk Engine | MortalityResult, LiabilityValuationResult, NatCatExposureResult, ClimateFrequencyResult | 14 | 911 |
| `iorp_pension_engine.py` | IORP II Pension Fund Climate Risk Engine (E8) | PensionFundInput, AssetStressResult, LiabilityStressResult, FundingRatioResult | 4 | 586 |

## Regulatory disclosure (CSRD/SFDR/ISSB/EU-Tax/XBRL/CBAM)  (29 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `sfdr_pai_engine.py` | SFDR Principal Adverse Impact (PAI) Calculation Engine | PAICalculationResult, PAIStatementResult, DNSHAssessmentResult, EntityClassificationResult | 24 | 2045 |
| `regulatory_report_compiler.py` | Regulatory Report Compiler | ReportSection, CompiledReport, RegulatoryReportCompiler | 25 | 1718 |
| `social_taxonomy_engine.py` | EU Social Taxonomy & Human Rights Due Diligence Engine — E97 | (functions only) | 9 | 1524 |
| `regulatory_horizon_engine.py` | Regulatory Horizon Scanning Engine — E117 | RegulatoryHorizonEngine | 13 | 1480 |
| `esg_data_quality_assurance_engine.py` | ESG Data Quality & Assurance Engine — E105 | (functions only) | 11 | 1371 |
| `issb_s2_engine.py` | IFRS S2 Climate-Related Disclosures Engine | ISSBS2Assessment, ISSBS2Engine | 18 | 1313 |
| `sfdr_art9_engine.py` | SFDR Article 9 Impact Fund Assessment Engine — E95 | PAIDataPoint, HoldingInput, Art9AssessmentRequest, PortfolioHoldingsRequest | 16 | 1222 |
| `eu_taxonomy_engine.py` | EU Taxonomy Alignment Engine | TaxonomyActivityAssessment, EntityTaxonomyAlignment, PortfolioTaxonomyAlignment, EUTaxonomyEngine | 18 | 1153 |
| `sfdr_annex_engine.py` | SFDR Annex Disclosure Template Engine (E9) | PAIIndicatorValue, FundDisclosureInput, DisclosureSection, AnnexDisclosureResult | 11 | 1062 |
| `csrd_extractor.py` | CSRD / ESRS PDF extraction engine. | CSRDExtractor | 11 | 894 |
| `eu_gbs_engine.py` | EU Green Bond Standard Engine (E14) | IssuanceInput, AllocationReportInput, ImpactReportInput, EUGBSResult | 13 | 831 |
| `csrd_entity_service.py` | CSRD Entity Data Bridge Service | (functions only) | 20 | 825 |
| `assurance_readiness_engine.py` | Assurance Readiness Dashboard Engine (E10) | CriterionInput, AssuranceInput, CriterionResult, DomainResult | 6 | 816 |
| `csrd_dma_engine.py` | CSRD Double Materiality Assessment (DMA) Engine | CSRDDMAEngine | 12 | 733 |
| `asia_regulatory_engine.py` | Asia Regulatory Engine | BRSRCoreEngine, HKMAEngine, BOJScenarioEngine, ASEANTaxonomyEngine | 25 | 730 |
| `regulatory_obligation_calendar.py` | Regulatory Obligation Calendar (E3) | RegulatoryObligation, ObligationAlert, RegulatoryObligationCalendar | 10 | 714 |
| `tcfd_metrics_engine.py` | TCFD Metrics & Targets Disclosure Engine (E13) | RecommendationAssessment, PillarResult, TCFDResult, TCFDMetricsEngine | 13 | 659 |
| `esrs_e2_e5_engine.py` | CSRD ESRS E2-E5 Environment Topics Engine. | ESRSE2E5Assessment, ESRSE2E5Engine | 15 | 624 |
| `xbrl_export_engine.py` | XBRL Export Engine (CSRD / ISSB / ESEF) | XBRLFact, ValidationResult, XBRLExportResult, XBRLExportEngine | 8 | 616 |
| `regulatory_penalties_engine.py` | Regulatory Penalty & Enforcement Engine (E35) | RegulatoryPenaltiesEngine | 9 | 615 |
| `xbrl_ingestion_engine.py` | XBRL Ingestion Engine | ExtractedFact, IngestionResult, XBRLIngestionEngine | 7 | 522 |
| `eu_taxonomy_gar_engine.py` | EU Taxonomy Green Finance KPI Reporter (E19) | AssetExposure, DNSHAssessment, MinSafeguardsAssessment, GARResult | 11 | 506 |
| `cbam_calculator.py` | CBAM Calculation Engine — emissions, costs, projections, compliance scoring. | CBAMEmissionsCalculator, CBAMCostProjector, CBAMComplianceScorer, CBAMTransitionParams | 14 | 505 |
| `csrd_auto_populate.py` | CSRD Auto-Population Engine | ModuleOutput, PopulatedDataPoint, AutoPopulateResult, CSRDAutoPopulateEngine | 3 | 492 |
| `sfdr_report_generator.py` | SFDR Periodic Report Generator | InvestmentCategory, SFDRHolding, SFDRFundInput, TopInvestment | 5 | 420 |
| `csrd_ingest_service.py` | CSRD data ingestion service. | CSRDIngestService | 7 | 388 |
| `sfdr_product_reporting_engine.py` | SFDR Product Periodic Reporting Engine — E22 | PAIResult, SustainableInvestmentVerification, SFDRProductReport, SFDRProductReportingEngine | 8 | 334 |
| `disclosure_completeness.py` | Disclosure Completeness Engine | DataPointStatus, FrameworkAssessment, CompletenessResult, DisclosureCompletenessEngine | 3 | 325 |
| `cbam_service.py` | CBAM Service — seed data, cost calculations, compliance reporting. | (functions only) | 4 | 215 |

## Energy & power finance  (7 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `green_hydrogen_engine.py` | Green Hydrogen & RFNBO Compliance Engine  (E98) | GreenHydrogenEngine | 20 | 1392 |
| `renewable_project_engine.py` | Renewable Project Finance Engine (P50/P90) + LCOE | WindYieldResult, SolarYieldResult, LCOEResult, ProjectFinanceResult | 11 | 665 |
| `hydrogen_economy_engine.py` | Hydrogen Economy Engine | HydrogenEconomyEngine | 8 | 622 |
| `green_hydrogen_calculator.py` | Green Hydrogen (GH2) LCOH & Carbon Intensity Calculator | GreenHydrogenInput, GreenHydrogenResult | 2 | 373 |
| `grid_ef_trajectory.py` | Grid Emission Factor Trajectory Engine | GridEFProjection, AvoidedEmissionsResult, MultiCountryComparison, GridEFTrajectoryEngine | 6 | 289 |
| `ppa_risk_scorer.py` | PPA Risk Scoring Engine | PPAInput, PPARiskDimension, PPARiskResult, PPARiskScorer | 5 | 240 |
| `nasa_power_client.py` | NASA POWER client — shared fetch/cache core for the NASA POWER proxy route | NasaPowerError | 6 | 159 |

## Capital markets, valuation & portfolio  (21 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `portfolio_analytics_engine_v2.py` | portfolio_analytics_engine_v2.py | PortfolioAnalyticsEngine, PortfolioDashboardEngine, PortfolioReportEngine, PortfolioAggregationEngine | 61 | 2008 |
| `unified_valuation_engine.py` | Unified Valuation Engine — Climate Intelligence Platform | AssetClass, InfrastructureSubtype, ProjectSubtype, EnergySubtype | 25 | 1604 |
| `export_credit_esg_engine.py` | E110 — Export Credit & Blended Trade Finance ESG Engine | ExportCreditTransactionData, FossilFuelScreenRequest, EquatorPrinciplesRequest, GreenInstrumentRequest | 15 | 1516 |
| `dcm_engine.py` | DCM Engine — Complete Carbon Credit Methodology Calculator | (functions only) | 62 | 1485 |
| `social_bond_engine.py` | Social Bond & Impact Finance Engine — E85 | SocialBondEngine | 13 | 1341 |
| `re_portfolio_engine.py` | Real Estate Portfolio NAV Roll-Up Engine + CRREM Integration | PropertyType, EPCRating, FundStructure, ValuationBasis | 22 | 1134 |
| `green_securitisation_engine.py` | Green Securitisation & ESG Structured Finance Engine — E81 | GreenSecuritisationEngine | 14 | 1126 |
| `biodiversity_credit_engine.py` | Biodiversity Credits & Nature Markets Engine — E88 | BiodiversityCreditEngine | 6 | 1025 |
| `blended_finance_engine.py` | Blended Finance & DFI Instruments Engine  (E72) | (functions only) | 12 | 992 |
| `real_estate_valuation_engine.py` | Real Estate Valuation Engine | CostDataService, MarketDataService, RealEstateValuationEngine | 11 | 823 |
| `re_clvar_engine.py` | Real Estate Climate Value-at-Risk (CLVaR) Engine - RICS VPS4 / IVS compliant | ClimateScenario, PropertyType, HazardType, PhysicalRiskInputs | 19 | 797 |
| `portfolio_analytics_engine.py` | Portfolio Analytics Engine — Real PCAF Computation | _ReportSubEngine, PortfolioAggregationEngine | 12 | 705 |
| `pe_portfolio_monitor.py` | PE Portfolio Company Monitoring Engine | TrafficLight, KPICategory, CompanyKPIData, CompanyTarget | 6 | 475 |
| `portfolio_health_engine.py` | Portfolio Health Engine — Three-Score Sustainability Pulse | HealthScore, PortfolioHealthScores | 10 | 443 |
| `project_finance_engine.py` | Project Finance Engine — DSCR / LLCR / PLCR / IRR / PPA modelling | ProjectFinanceInputs, CashFlowRow, ProjectFinanceResult, ProjectFinanceEngine | 7 | 409 |
| `test_cbi_green_bonds.py` | CBI (Climate Bonds Initiative) Certified Green Bond Transactions — India Focus | (functions only) | 0 | 321 |
| `unified_market_data.py` | Unified Market Data Service | UnifiedMarketDataService | 14 | 270 |
| `portfolio_metrics.py` | Portfolio-level Metrics Calculator | RatingMigration, PortfolioMetrics, PortfolioMetricsCalculator | 5 | 267 |
| `demo_portfolio_seeder.py` | Demo Portfolio Seeder (P0-3) | DemoPortfolioSeeder | 5 | 224 |
| `var_calculator.py` | Value at Risk (VaR) Calculator - Portfolio loss distribution and VaR metrics | VaRResult, VaRCalculator | 6 | 218 |
| `portfolio_upload.py` | Portfolio file upload & parsing service. | (functions only) | 3 | 184 |

## Nature, biodiversity, water & land  (18 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `corporate_nature_strategy_engine.py` | Corporate Nature Strategy & SBTN Engine — E80 | CorporateNatureStrategyEngine | 14 | 1252 |
| `tnfd_assessment_engine.py` | TNFD Assessment Engine | TNFDDisclosureScore, TNFDLEAPPhaseResult, TNFDAssessment, TNFDMaterialityResult | 20 | 1097 |
| `eudr_engine.py` | EU Deforestation Regulation (EUDR) 2023/1115 — Compliance Engine | CommodityScreenResult, CountryRiskResult, TraceabilityCheckResult, DueDiligenceResult | 15 | 1046 |
| `biodiversity_finance_v2_engine.py` | Biodiversity Finance v2 Engine — E44 | BiodiversityFinanceV2Engine | 9 | 1022 |
| `nature_risk_calculator.py` | Nature Risk Integration Calculation Engine | LEAPPhase, LEAPScores, LEAPAssessmentCalculator, WaterRiskCalculator | 31 | 981 |
| `water_stewardship_engine.py` | Water Risk & Stewardship Finance Engine — E92 | WaterRiskAssessRequest, StewardshipTargetRequest, WaterRiskResult, StewardshipTargetResult | 9 | 940 |
| `blue_economy_engine.py` | Blue Economy & Ocean Finance Engine — E68 | BlueBondScreeningResult, BlueCarbonResult, BBNJComplianceResult, OceanAcidificationRisk | 7 | 929 |
| `tnfd_leap_engine.py` | TNFD LEAP Process Assessment Engine (E32) | TNFDLEAPEngine | 13 | 834 |
| `water_risk_engine.py` | Water Risk & Security Engine (E53) | WaterRiskEngine | 9 | 727 |
| `food_system_engine.py` | Food System & Land Use Finance Engine (E54) | FoodSystemEngine | 10 | 675 |
| `agriculture_risk_engine.py` | Agriculture Risk Engine (Expanded) | LivestockMethaneInput, LivestockMethaneResult, DiseaseOutbreakInput, DiseaseOutbreakResult | 5 | 647 |
| `nature_based_solutions_engine.py` | Nature-Based Solutions & Carbon Sequestration Engine (E52) | NatureBasedSolutionsEngine | 9 | 637 |
| `biodiversity_credits_engine.py` | Biodiversity Credits Engine — Sprint 26 | BiodiversityCreditsEngine | 8 | 534 |
| `nature_re_integration_engine.py` | Nature-RE Integration Engine | NatureREInput, NatureREResult, PortfolioNatureREResult, NatureREIntegrationEngine | 11 | 490 |
| `nature_risk_seed_data.py` | Nature Risk Seed Data | (functions only) | 5 | 475 |
| `biodiversity_finance_engine.py` | Biodiversity Finance Metrics Engine — E23 | TNFDPillarScore, MSAFootprint, SBTNReadiness, CBDGBFAlignment | 8 | 361 |
| `nature_risk_spatial.py` | Nature Risk Spatial Service (PostGIS-backed) | SpatialOverlapResult, NatureRiskSpatialService | 5 | 325 |
| `agriculture_risk_calculator.py` | Agriculture Climate Risk Calculator | AgricultureRiskInput, AgricultureRiskResult | 2 | 319 |

## Real estate & built environment  (5 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `crrem_green_buildings_engine.py` | CRREM & Green Buildings Engine — E112 | CRREMAssessRequest, RetrofitPlanRequest, GreenPremiumRequest, GRESBRequest | 8 | 781 |
| `crrem_stranding_engine.py` | CRREM Carbon Risk Real Estate Monitor - Stranding Analysis Engine | AssetEnergyProfile, StrandingAnalysisResult, CRREMStrandingEngine | 8 | 740 |
| `overture_buildings_service.py` | Overture Maps Building Footprints — live query service | _TailFile | 17 | 558 |
| `real_estate_db_service.py` | Database service for Real Estate Valuation module. | RealEstateDBService | 13 | 452 |
| `epc_transition_engine.py` | EPC Transition Risk Engine | EPCRating, PropertyEPCInput, DeadlineExposure, PropertyTransitionRisk | 3 | 378 |

## Supply chain & trade  (8 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `china_trade_engine.py` | China Trade Platform Engine — china_trade_engine.py | ChinaExporterEngine, CBAMAutoFillEngine, SupplierFrameworkEngine, ChinaESGETSEngine | 26 | 1607 |
| `critical_minerals_engine.py` | Critical Minerals & Transition Metals Risk Engine — E93 | CriticalMineralsAssessRequest, SupplyChainMapRequest, CriticalMineralsResult, SupplyChainMapResult | 10 | 1048 |
| `trade_finance_engine.py` | Sustainable Trade Finance Engine  (E75) | (functions only) | 9 | 1038 |
| `sustainable_trade_finance_engine.py` | Sustainable Trade Finance Engine — E75 | EP4ComplianceResult, ECAGreenResult, ESGLinkedMarginResult, SupplyChainESGResult | 9 | 994 |
| `shipping_maritime_engine.py` | Shipping & Maritime Climate Engine | CIIResult, EEXIResult, PoseidonResult, FuelEUResult | 8 | 813 |
| `supply_chain_workflow_engine.py` | Supply Chain Workflow Engine (E5) | SupplierInput, SupplierRiskResult, WorkflowAssessment, SupplyChainWorkflowEngine | 13 | 653 |
| `maritime_engine.py` | Maritime Climate Risk & Regulatory Compliance Engine | MaritimeEngine | 10 | 536 |
| `shipping_calculator.py` | Shipping Decarbonisation Calculator — IMO CII / EEXI / AER | ShippingInputs, ShippingResult, ShippingCalculator | 6 | 315 |

## Sovereign, macro & geopolitical  (6 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `sovereign_swf_engine.py` | E107 — Sustainable Sovereign & SWF Engine | (functions only) | 7 | 1280 |
| `yfinance_india_service.py` | yfinance India Fundamentals Service | (functions only) | 13 | 652 |
| `dme_policy_tracker_engine.py` | DME Policy Velocity Tracker — Rate of regulatory change across 4 component signals. | PolicyComponent, CarbonPriceInput, RegulatoryPipelineInput, EnforcementInput | 8 | 230 |
| `test_sovereign3.py` | (no docstring) | (functions only) | 0 | 83 |
| `test_sovereign.py` | (no docstring) | (functions only) | 0 | 66 |
| `test_sovereign2.py` | (no docstring) | (functions only) | 0 | 18 |

## Entity & reference data services  (6 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `reference_data_catalog.py` | Reference Data Catalog | CatalogEntry, ReferenceCatalogResult, DomainSummary, GapReport | 7 | 780 |
| `entity_resolution_service.py` | Cross-module entity resolution service. | LinkedRecord, EntityMatch, Entity360Data, EntityResolutionService | 13 | 705 |
| `reference_data_tables.py` | Reference Data Tables — Embedded Datasets | (functions only) | 8 | 606 |
| `entity360_engine.py` | Entity 360 Engine | ModuleScore, RiskProfile, ESGProfile, Entity360Result | 9 | 516 |
| `gleif_upsert.py` | GLEIF just-in-time (JIT) fetch + upsert helpers. | GleifLiveFetchError | 10 | 211 |
| `gleif_reference_registries.py` | GLEIF Reference Registries — entity-legal-forms / registration-authorities / | (functions only) | 8 | 150 |

## Data platform, lineage, AI/ML services  (11 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `data_lineage_service.py` | Data Lineage Service | LineageNode, LineageGap, LineageChain, ModuleGraphEdge | 38 | 5424 |
| `ai_governance_engine.py` | E77 — AI Governance & ESG Engine | AISystemInput, BiasAssessmentInput, AIPortfolioInput, AIGovernanceResult | 14 | 1105 |
| `lineage_orchestrator.py` | Lineage Orchestrator | ReferenceDataGapReport, BridgeHealthReport, ModuleImpactAnalysis, PlatformHealthDashboard | 12 | 838 |
| `sentiment_analysis_engine.py` | Sentiment Analysis Engine — Multi-Stakeholder Signal Processing | SentimentSignalInput, BatchSignalInput, EntityScoreRequest, TopicTrendRequest | 15 | 809 |
| `ai_risk_engine.py` | ai_risk_engine.py — E76 AI & ML Risk Finance | (functions only) | 7 | 739 |
| `esg_data_quality_engine.py` | ESG Data Quality & Coverage Engine (E34) | ESGDataQualityEngine | 9 | 645 |
| `cbi_data_client.py` | Climate Bond Initiative (CBI) Data Client | CBIDataClient | 18 | 523 |
| `data_hub_client.py` | Data Hub Client -- Direct DB access layer. | (functions only) | 10 | 516 |
| `data_hub_service.py` | Core Data Hub service — CRUD for sources, scenarios, trajectories, comparisons, favorites. | DataHubService | 28 | 360 |
| `eodhd_data_service.py` | EODHD Financial Data Service | EODHDService | 8 | 232 |
| `dme_nlp_pulse_engine.py` | DME NLP Pulse Score Engine — Sentiment-based signal processing. | EventType, SourceTier, SentimentSignal, NLPPulseConfig | 8 | 229 |

## Materiality, engagement & strategy  (12 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `peer_benchmark_engine.py` | Peer Benchmark Engine — Climate Disclosure Gap Assessment | InstitutionProfile, PeerBenchmarkEngine | 14 | 3503 |
| `double_materiality_engine.py` | CSRD Double Materiality Assessment Engine (E102) | TopicAssessment, IROAssessment, DoubleMaterialityRequest, IROIdentificationRequest | 18 | 1436 |
| `transition_plan_engine.py` | Climate Transition Plan Assessment Engine | TransitionPlanAssessment, TargetAssessment, SectorPathwayAssessment, TransitionPlanEngine | 29 | 1131 |
| `tpt_transition_plan_engine.py` | Transition Plan Taskforce (TPT) Disclosure Framework Engine | TPTAssessment, TPTTransitionPlanEngine | 12 | 1028 |
| `dme_factor_registry.py` | DME Factor Registry — Unified Factor Taxonomy | Pillar, MaterialityDimension, VelocityMethod, DataFrequency | 9 | 796 |
| `stewardship_engine.py` | Stewardship Engine (E6) | EngagementInput, EngagementResult, ProxyVoteInput, ProxyVoteResult | 11 | 743 |
| `net_zero_targets_engine.py` | Net Zero Target Setting Engine (E33) | NetZeroTargetsEngine | 10 | 721 |
| `dme_contagion_engine.py` | DME Contagion Engine — Hawkes Process Multi-Layer Systemic Risk. | EdgeWeightInput, EdgeWeightOutput, ContagionEvent, L1IntensityRequest | 8 | 298 |
| `dme_velocity_engine.py` | DME Velocity Engine — EWMA-based rate-of-change monitoring for ESG metrics. | RawMetricPoint, VelocityOutput, VelocityConfig, VelocitySeriesRequest | 10 | 248 |
| `dme_greenwashing_engine.py` | DME Greenwashing Detection Engine — CUSUM-based change detection for ESG credibility. | CredibilityWeightedScore, GreenwashConfig, ScoreObservation, GreenwashDetectRequest | 6 | 220 |
| `dme_alert_engine.py` | DME Alert Engine — Four-Tier Velocity Alert Framework. | AlertThresholds, AlertRuleConfig, VelocitySignalInput, AlertRecord | 6 | 211 |
| `dme_dmi_engine.py` | DME Dynamic Materiality Index (DMI) Engine — Velocity-weighted ESG scoring. | HoldingInput, ConcentrationInput, DMIConfig, PCAFAttributionRequest | 7 | 209 |

## Other / cross-cutting  (98 engines)

| Engine | Purpose (module docstring, line 1) | Key classes | Fns | LOC |
|---|---|---|---|---|
| `activity_guide_catalog.py` | Activity Guide Catalog | (functions only) | 8 | 6219 |
| `modern_slavery_engine.py` | Modern Slavery & Forced Labour Engine — E114 | AssessForcedLabourRequest, AssessForcedLabourResponse, SupplierTierData, SupplierScreenRequest | 14 | 1890 |
| `esg_controversy_engine.py` | E111 — ESG Controversy & Incident Tracking Engine | ControversyAssessRequest, IncidentScoreRequest, RemediationScoreRequest, PortfolioHolding | 16 | 1681 |
| `methodology_engine.py` | Complete Carbon Credit Methodology Engine | MethodologySector, MethodologyStandard | 46 | 1612 |
| `sscf_engine.py` | E101 — Sustainable Supply Chain Finance (SSCF) Engine | SupplierProfile, SSCFRequest, SupplierScoreRequest, MarginRatchetRequest | 9 | 1561 |
| `sll_slb_v2_engine.py` | Sustainability-Linked Loan & Bond v2 Engine — E115 | InstrumentData, KpiData, SptData, AssessSllSlbRequest | 10 | 1478 |
| `factor_overlay_engine.py` | Factor Overlay Engine | FactorScore, OverlayResult, FactorOverlayEngine | 16 | 1415 |
| `transition_finance_engine.py` | Transition Finance Credibility Engine  (E99) | (functions only) | 10 | 1209 |
| `nbs_finance_engine.py` | Nature-Based Solutions Finance Engine — E94 | IUCNCriteriaScores, NbSProjectRequest, BlendedFinanceRequest | 17 | 1175 |
| `comprehensive_reporting_engine.py` | Comprehensive Reporting Aggregator Engine (E119) | ReportSection, ComprehensiveReportResult, ESRSReportResult, XBRLTaggingResult | 8 | 1133 |
| `sasb_industry_engine.py` | SASB Industry Standards Engine | SASBMetricResult, SASBIndustryAssessment, SASBMaterialityResult, SASBPeerComparisonResult | 15 | 1061 |
| `gri_standards_engine.py` | GRI Standards Reporting Engine | GRIReport, GRIStandardsEngine | 14 | 1056 |
| `just_transition_engine.py` | Just Transition Finance Engine — E89 | JustTransitionEngine | 6 | 1052 |
| `cdp_scoring_engine.py` | CDP Climate & Water Scoring Engine | CDPModuleScore, CDPClimateAssessment, CDPWaterAssessment, CDPScoringEngine | 18 | 1024 |
| `model_validation_framework.py` | Model Validation Framework | ValidationTestResult, BacktestResult, ModelInventoryEntry, ChampionChallengerResult | 13 | 1014 |
| `technology_risk_engine.py` | Technology Sector Risk & Sustainability Engine | DataCentreInput, DataCentreResult, CloudEmissionsInput, CloudEmissionsResult | 15 | 998 |
| `am_engine.py` | Asset Management Engine | Holding, ESGAttributionResult, ParisAlignmentResult, BondInput | 7 | 964 |
| `sustainability_calculator.py` | Sustainability Frameworks Calculation Engine | GRESBCalculator, LEEDCalculator, BREEAMCalculator, ValueImpactCalculator | 30 | 961 |
| `narrative_templates.py` | Narrative Templates — Semi-narrative boilerplate text for all report types. | _SafeDict | 3 | 948 |
| `real_asset_decarb_engine.py` | Real Asset Decarbonisation Engine  (E74) | (functions only) | 8 | 946 |
| `digital_product_passport_engine.py` | Digital Product Passport & Lifecycle Finance Engine (EU ESPR) — E82 | DigitalProductPassportEngine | 7 | 943 |
| `ead_calculator.py` | EAD Calculator — Exposure at Default with Basel III/IV Credit Conversion Factors | FacilityType, AssetClassEAD, MaturityBucket, EADInput | 19 | 925 |
| `infrastructure_finance_engine.py` | Infrastructure Finance Engine | EPResult, IFCPSResult, OECDResult, ParisAlignmentResult | 8 | 923 |
| `commercial_re_engine.py` | Commercial Real Estate Climate Engine | CRREMResult, EPCResult, GRESBResult, REFIResult | 9 | 912 |
| `facilitated_emissions_engine.py` | Facilitated Emissions & Insurance-Associated Emissions Engine | FacilitatedDealType, InsuranceLineOfBusiness, BondType, SecuritisationType | 20 | 905 |
| `assessment_methodology_manager.py` | Assessment Methodology Manager | MethodologyStatus, InteractionMode, ScenarioWeighting, AggregationMethod | 23 | 877 |
| `loss_damage_engine.py` | Loss & Damage Finance Engine — E70 | FRLDEligibilityResult, ParametricTriggerDesign, WIMAccessResult, LDGapAnalysis | 7 | 876 |
| `mrv_engine.py` | Climate Data & MRV Infrastructure Engine  (E73) | (functions only) | 11 | 876 |
| `esg_ma_engine.py` | esg_ma_engine.py — E79 ESG M&A Due Diligence | (functions only) | 7 | 853 |
| `csddd_engine.py` | EU Corporate Sustainability Due Diligence Directive (CSDDD) | ScopeAssessmentResult, AdverseImpactResult, DDComplianceResult, ValueChainMappingResult | 12 | 852 |
| `circular_economy_engine.py` | Circular Economy Finance Engine (E55) | CircularEconomyEngine | 10 | 827 |
| `forced_labour_engine.py` | Forced Labour Risk Assessment Engine | ILOScreeningResult, EUFLRResult, UKMSAResult, ComplianceProgrammeResult | 14 | 775 |
| `export_service.py` | Universal Export Service for Climate & Real Estate Risk Platform | DecimalEncoder, ExportService | 12 | 765 |
| `cdr_engine.py` | Carbon Dioxide Removal (CDR) Engine | CDREngine | 11 | 763 |
| `rics_esg_engine.py` | RICS Red Book ESG Integration Engine | RICSComplianceInput, ChecklistItem, RICSComplianceResult, RICSESGEngine | 10 | 706 |
| `sub_parameter_engine.py` | Sub-Parameter Analysis Engine — sensitivity, what-if, attribution, interactions. | (functions only) | 15 | 703 |
| `eu_ets_engine.py` | EU ETS Phase 4 Engine | AllowanceAllocation, CompliancePosition, CarbonPriceForecast, ETS2ReadinessResult | 11 | 696 |
| `sl_finance_engine.py` | Sustainability-Linked Finance Engine (E17) | KPIInput, SLBInput, KPIAssessment, SLFinanceResult | 11 | 679 |
| `assessment_runner.py` | Assessment Runner | RunStatus, EntityType, TargetScope, EntityInput | 15 | 677 |
| `pe_db_service.py` | PE/VC Database Service — Persistence layer for Private Equity module. | PEDBService | 19 | 675 |
| `esg_ratings_engine.py` | E57: ESG Ratings Reform & Divergence Engine | (functions only) | 12 | 674 |
| `pd_backtester.py` | PD Model Backtesting Engine | ObservedDefault, GradeBacktestResult, BacktestMetrics, PDBacktester | 14 | 669 |
| `gar_db_service.py` | GAR Database Service — Auto-calculate Green Asset Ratio from DB data. | GARDBService | 12 | 648 |
| `loss_damage_finance_engine.py` | Loss & Damage Finance Engine — E113 | LossDamageRequest, ProtectionGapRequest, ParametricTriggerRequest, RegionalMechanismRequest | 8 | 638 |
| `methane_fugitive_engine.py` | E58: Methane & Fugitive Emissions Engine | (functions only) | 10 | 634 |
| `priips_kid_engine.py` | PRIIPs KID ESG Engine (E15) | KIDProductInput, SRIResult, PerformanceScenario, CostSummary | 20 | 624 |
| `gar_calculator.py` | Green Asset Ratio (GAR) Calculator -- EU Taxonomy Art. 449a CRR | TaxonomyObjective, AlignmentClassification, KPIType, GARExposure | 9 | 612 |
| `uk_sdr_engine.py` | UK Sustainability Disclosure Requirements (SDR) Engine (E11) | ProductInput, LabelEligibilityResult, AGRCheckResult, NamingAssessmentResult | 8 | 592 |
| `residential_re_engine.py` | Residential Real Estate Engine | ResidentialPropertyInput, ResidentialValuationResult, MortgagePortfolioInput, MortgagePortfolioResult | 10 | 578 |
| `monte_carlo_engine.py` | Monte Carlo Simulation Engine — Portfolio-Level Parameter Uncertainty Analysis | AssetInput, UncertaintyParams, PercentileResult, AssetLevelResult | 9 | 574 |
| `pe_deal_engine.py` | PE Deal Pipeline + ESG Screening Engine | DealStage, DealType, ESGDimension, RiskBand | 10 | 573 |
| `lgd_downturn_engine.py` | LGD Downturn Engine -- Downturn LGD Estimation per EBA/Basel Standards | DownturnLGDInput, DownturnLGDContribution, DownturnLGDResult, DownturnLGDBatchResult | 10 | 540 |
| `vintage_analyzer.py` | Vintage Analyzer -- Credit Portfolio Vintage Analysis & Cohort Tracking | VintageExposure, VintageCohort, VintageMatrix, VintageAnalysisResult | 10 | 535 |
| `esma_fund_names_engine.py` | ESMA Fund Names ESG Guidelines Engine (E16) | FundNameInput, TermDetectionResult, ComplianceGap, FundNameResult | 9 | 532 |
| `mifid_spt_engine.py` | MiFID II Sustainability Preferences Engine (E12) | ClientPreferences, ProductProfile, PreferenceMatchResult, MiFIDSPTResult | 10 | 530 |
| `ifrs_s1_engine.py` | IFRS S1 General Requirements for Disclosure of Sustainability-related | S1DisclosureInput, S1AssessmentInput, S1PillarResult, IFRSS1Result | 9 | 526 |
| `greenwashing_engine.py` | Greenwashing Risk & Substantiation Engine. | GreenwashingAssessment, GreenwashingEngine | 11 | 517 |
| `alert_engine.py` | Alert Engine — Continuous Monitoring for the Sustainability Pulse Dashboard | (functions only) | 13 | 475 |
| `retrofit_planner.py` | Retrofit CapEx Planner | RetrofitMeasure, PropertyRetrofitInput, MeasureResult, PropertyRetrofitPlan | 7 | 468 |
| `report_generator.py` | Report Generator — creates professional PDF and Excel reports for impact analysis. | (functions only) | 4 | 439 |
| `fund_structure_engine.py` | Fund Structure Engine | SFDRClassification, AssetClass, ESGStrategy, Holding | 4 | 415 |
| `tenant_esg_tracker.py` | Tenant ESG Profile Tracker | GreenLeaseClause, TenantInput, PropertyTenantInput, TenantESGProfile | 3 | 405 |
| `nace_cprs_mapper.py` | NACE-CPRS-IAM Sector Classification Mapper | SectorClassification, CounterpartySectorScore, NACECPRSMapper | 6 | 400 |
| `esg_attribution_engine.py` | ESG Attribution Engine | HoldingAttribution, BenchmarkAttribution, PAIIndicator, AttributionInput | 7 | 396 |
| `pd_calculator.py` | PD Adjustment Calculator - Climate risk impact on Probability of Default | PDContribution, PDResult, PDAdjustmentCalculator | 8 | 392 |
| `validation_summary_engine.py` | Validation Summary Engine | CalcMeta, ValidationSummary, ValidationSummaryEngine | 6 | 390 |
| `scheduled_reports_service.py` | Scheduled Report Export Service | ReportFrequency, ReportType, ScheduledReport | 10 | 388 |
| `pe_reporting_engine.py` | PE GP/LP Reporting Engine | FundPerformanceData, PortfolioCompanySummary, LPReportInput, FundMetrics | 6 | 387 |
| `mining_risk_calculator.py` | Mining & Extractives Climate Risk Calculator | MiningRiskInput, MiningRiskResult | 2 | 385 |
| `just_transition_calculator.py` | Just Transition Calculator | JustTransitionInput, JustTransitionResult, ETMInput, ETMResult | 2 | 360 |
| `exclusion_list_engine.py` | Exclusion List Engine | ExclusionCategory, ExclusionRule, HoldingScreenInput, ScreeningBreach | 6 | 344 |
| `green_premium_engine.py` | Green Premium / Brown Discount Engine | PropertyGreenInput, CertificationPremium, PropertyGreenResult, PortfolioGreenSummary | 2 | 342 |
| `pe_irr_sensitivity.py` | PE IRR / MOIC Sensitivity Engine | DealCashflow, IRRSensitivityInput, SensitivityCell, SensitivityTable | 5 | 340 |
| `validation_service.py` | Validation service for uploaded data | ValidationService | 5 | 339 |
| `benchmark_analytics.py` | Benchmark Analytics Service | PeerFundMetrics, PeerRanking, PeriodComparison, BenchmarkComplianceCheck | 5 | 337 |
| `builder_engine.py` | Scenario Builder Calculation Engine. | (functions only) | 12 | 331 |
| `generation_transition.py` | Generation Transition Planner | PlantInput, RetirementSchedule, FleetTransitionResult, GenerationTransitionPlanner | 6 | 331 |
| `finnhub_esg_service.py` | Finnhub ESG Service | (functions only) | 9 | 327 |
| `pe_impact_framework.py` | PE Impact Measurement Framework | CompanyImpactData, FundImpactInput, CompanyImpactScore, SDGContribution | 4 | 318 |
| `pe_value_creation.py` | PE Value Creation Plan Engine | LeverEstimate, Milestone, ValueCreationPlan, PEValueCreationEngine | 4 | 316 |
| `upload_service.py` | Upload service for file parsing and processing | UploadService | 9 | 296 |
| `trend_analytics.py` | Multi-Year Trend Analytics Engine | YearDataPoint, KPITrend, TrendAnalysisResult, TrendAnalyticsEngine | 4 | 290 |
| `lgd_calculator.py` | LGD Adjustment Calculator - Climate risk impact on Loss Given Default | LGDContribution, LGDResult, LGDAdjustmentCalculator | 8 | 260 |
| `calculation_engine.py` | Main Calculation Engine - Orchestrates all calculators for scenario analysis | AssetInput, ScenarioHorizonResult, ClimateRiskCalculationEngine | 3 | 253 |
| `steel_calculator.py` | Steel Decarbonisation Calculator — BF-BOF / EAF / DRI emission intensity | SteelInputs, SteelGlidepathPoint, SteelResult, SteelCalculator | 4 | 252 |
| `methane_ogmp.py` | Methane Monitoring Engine (OGMP 2.0) | MethaneSource, MethaneSourceResult, FacilityMethaneResult, MethaneOGMPEngine | 5 | 244 |
| `sync_orchestrator.py` | Scenario Sync Orchestrator — coordinates fetching, normalizing, and persisting | ScenarioSyncOrchestrator | 5 | 228 |
| `email_service.py` | Email service — sends invite and notification emails. | (functions only) | 2 | 211 |
| `enrichment_service.py` | Enrichment service for uploaded data | EnrichmentService | 5 | 192 |
| `alpha_vantage_service.py` | Alpha Vantage Data Service — India NSE/BSE + Forex | AlphaVantageService | 8 | 184 |
| `test_fi_types2.py` | All Financial Institution Types — PCAF Coverage (using correct per-asset-class endpoints) | (functions only) | 7 | 181 |
| `analysis_export.py` | Sub-parameter analysis export — Excel/PDF/JSON. | (functions only) | 3 | 164 |
| `impact_calculator.py` | Scenario Impact Calculator — connects hub scenarios to portfolios for PD/LGD/EL/VaR. | (functions only) | 3 | 154 |
| `engine_integration.py` | Integration layer between API/models and the calculation engine. | (functions only) | 4 | 146 |
| `test_fi_types.py` | All Financial Institution Types — PCAF Coverage | (functions only) | 1 | 126 |
| `test_partb.py` | (no docstring) | (functions only) | 0 | 80 |
| `test_partc.py` | (no docstring) | (functions only) | 0 | 72 |
| `test_partb2.py` | (no docstring) | (functions only) | 0 | 63 |
