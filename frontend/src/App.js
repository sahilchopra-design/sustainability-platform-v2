import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TestDataProvider } from './context/TestDataContext';
import { CompanyEnrichmentProvider } from './context/CompanyEnrichmentContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Platform Admin & Data Management
const DataSourceManagerPage = React.lazy(() => import("./features/data-source-manager/pages/DataSourceManagerPage"));
const DbExplorerPage = React.lazy(() => import("./features/db-explorer/pages/DbExplorerPage"));
const UserRoleManagementPage = React.lazy(() => import("./features/user-role-management/pages/UserRoleManagementPage"));
const AuditTrailViewerPage = React.lazy(() => import("./features/audit-trail-viewer/pages/AuditTrailViewerPage"));
const ApiGatewayMonitorPage = React.lazy(() => import("./features/api-gateway-monitor/pages/ApiGatewayMonitorPage"));
const DataQualityDashboardPage = React.lazy(() => import("./features/data-quality-dashboard/pages/DataQualityDashboardPage"));
const CalculationEngineMonitorPage = React.lazy(() => import("./features/calculation-engine-monitor/pages/CalculationEngineMonitorPage"));
const PlatformSettingsPage = React.lazy(() => import("./features/platform-settings/pages/PlatformSettingsPage"));
// Sprint 37 — E108–E111
const RegulatoryCapitalPage = React.lazy(() => import("./features/regulatory-capital/pages/RegulatoryCapitalPage"));
// ClimatePolicyPage moved to Sprint O imports
const ExportCreditESGPage = React.lazy(() => import("./features/export-credit-esg/pages/ExportCreditESGPage"));
const ESGControversyPage = React.lazy(() => import("./features/esg-controversy/pages/ESGControversyPage"));
// Sprint 38 — E112–E115
const CRREMPage = React.lazy(() => import("./features/crrem/pages/CRREMPage"));
const LossDamagePage = React.lazy(() => import("./features/loss-damage/pages/LossDamagePage"));
const ForcedLabourPage = React.lazy(() => import("./features/forced-labour-msv2/pages/ForcedLabourPage"));
const SLLSLBv2Page = React.lazy(() => import("./features/sll-slb-v2/pages/SLLSLBv2Page"));
// Sprint 39 — E116–E119
const NatureCapitalAccountingPage = React.lazy(() => import("./features/nature-capital-accounting/pages/NatureCapitalAccountingPage"));
const RegulatoryHorizonPage = React.lazy(() => import("./features/regulatory-horizon/pages/RegulatoryHorizonPage"));
const ClimateTechPage = React.lazy(() => import("./features/climate-tech/pages/ClimateTechPage"));
const ComprehensiveReportingPage = React.lazy(() => import("./features/comprehensive-reporting/pages/ComprehensiveReportingPage"));
// Sprint 29 — E76–E79
const CryptoClimatePage = React.lazy(() => import("./features/crypto-climate/pages/CryptoClimatePage"));
const AIGovernancePage = React.lazy(() => import("./features/ai-governance/pages/AIGovernancePage"));
const CarbonAccountingAIPage = React.lazy(() => import("./features/carbon-accounting-ai/pages/CarbonAccountingAIPage"));
const ClimateInsurancePage = React.lazy(() => import("./features/climate-insurance/pages/ClimateInsurancePage"));
// Sprint 30 — E80–E83
const CorporateNatureStrategyPage = React.lazy(() => import("./features/corporate-nature-strategy/pages/CorporateNatureStrategyPage"));
const GreenSecuritisationPage = React.lazy(() => import("./features/green-securitisation/pages/GreenSecuritisationPage"));
const DigitalProductPassportPage = React.lazy(() => import("./features/digital-product-passport/pages/DigitalProductPassportPage"));
const AdaptationFinancePage = React.lazy(() => import("./features/adaptation-finance/pages/AdaptationFinancePage"));
// Sprint 31 — E84–E87
const InternalCarbonPricePage = React.lazy(() => import("./features/internal-carbon-price/pages/InternalCarbonPricePage"));
const SocialBondPage = React.lazy(() => import("./features/social-bond/pages/SocialBondPage"));
const ClimateFinancialStatementsPage = React.lazy(() => import("./features/climate-financial-statements/pages/ClimateFinancialStatementsPage"));
const EMClimateRiskPage = React.lazy(() => import("./features/em-climate-risk/pages/EMClimateRiskPage"));
// Sprint 32 — E88–E91
const BiodiversityCreditsPage = React.lazy(() => import("./features/biodiversity-credits/pages/BiodiversityCreditsPage"));
// JustTransitionPage moved to Sprint O imports
const CarbonRemovalPage = React.lazy(() => import("./features/carbon-removal/pages/CarbonRemovalPage"));
const ClimateLitigationPage = React.lazy(() => import("./features/climate-litigation/pages/ClimateLitigationPage"));
// Sprint 33 — E92–E95
const WaterRiskPage = React.lazy(() => import("./features/water-risk/pages/WaterRiskPage"));
const CriticalMineralsPage = React.lazy(() => import("./features/critical-minerals/pages/CriticalMineralsPage"));
const NbsFinancePage = React.lazy(() => import("./features/nbs-finance/pages/NbsFinancePage"));
const SFDRArt9Page = React.lazy(() => import("./features/sfdr-art9/pages/SFDRArt9Page"));
// Sprint 34 — E96–E99
const VCMIntegrityPage = React.lazy(() => import("./features/vcm-integrity/pages/VCMIntegrityPage"));
const SocialTaxonomyPage = React.lazy(() => import("./features/social-taxonomy/pages/SocialTaxonomyPage"));
const GreenHydrogenPage = React.lazy(() => import("./features/green-hydrogen/pages/GreenHydrogenPage"));
const TransitionFinancePage = React.lazy(() => import("./features/transition-finance/pages/TransitionFinancePage"));
// Sprint 35 — E100–E103
const StressTestOrchestratorPage = React.lazy(() => import("./features/stress-test-orchestrator/pages/StressTestOrchestratorPage"));
const SSCFPage = React.lazy(() => import("./features/sscf/pages/SSCFPage"));
const DoubleMaterialityPage = React.lazy(() => import("./features/double-materiality/pages/DoubleMaterialityPage"));
const TemperatureAlignmentPage = React.lazy(() => import("./features/temperature-alignment/pages/TemperatureAlignmentPage"));
// Sprint 36 — E104–E107
const PhysicalRiskPricingPage = React.lazy(() => import("./features/physical-risk-pricing/pages/PhysicalRiskPricingPage"));
const ESGDataQualityPage = React.lazy(() => import("./features/esg-data-quality/pages/ESGDataQualityPage"));
const ClimateDerivativesPage = React.lazy(() => import("./features/climate-derivatives/pages/ClimateDerivativesPage"));
const SovereignSWFPage = React.lazy(() => import("./features/sovereign-swf/pages/SovereignSWFPage"));
// Sentiment Analysis
const SentimentAnalysisPage = React.lazy(() => import("./features/sentiment-analysis/pages/SentimentAnalysisPage"));
// E138 PCAF India BRSR
const PCafIndiaBrsrPage = React.lazy(() => import("./features/pcaf-india-brsr/pages/PCafIndiaBrsrPage"));
// E147 Equator Principles
const EquatorPrinciplesPage = React.lazy(() => import("./features/equator-principles/pages/EquatorPrinciplesPage"));
// E148 ESMS
const EsmsPage = React.lazy(() => import("./features/esms/pages/EsmsPage"));
// E149 ISSB S2 / TCFD Climate Disclosure
const IssbTcfdPage = React.lazy(() => import("./features/issb-tcfd/pages/IssbTcfdPage"));
// E150 EU Taxonomy Alignment
const EuTaxonomyPage = React.lazy(() => import("./features/eu-taxonomy/pages/EuTaxonomyPage"));
// Sprint D — Platform Intelligence (EP-D1, EP-D3, EP-D4, EP-D6, EP-D7)
const StrandedAssetsPage = React.lazy(() => import("./features/stranded-assets/pages/StrandedAssetsPage"));
const NGFSScenariosPage = React.lazy(() => import("./features/ngfs-scenarios/pages/NGFSScenariosPage"));
const PortfolioClimateVaRPage = React.lazy(() => import("./features/portfolio-climate-var/pages/PortfolioClimateVarPage"));
const PipelineDashboardPage = React.lazy(() => import("./features/pipeline-dashboard/pages/PipelineDashboardPage"));
const CSRDiXBRLPage = React.lazy(() => import("./features/csrd-ixbrl/pages/CSRDiXBRLPage"));
// Master Reference
const CompanyProfilesPage = React.lazy(() => import("./features/company-profiles/pages/CompanyProfilesPage"));
// Sprint E — Global Market Intelligence
const ExchangeIntelligencePage = React.lazy(() => import("./features/exchange-intelligence/pages/ExchangeIntelligencePage"));
const SectorBenchmarkingPage = React.lazy(() => import("./features/sector-benchmarking/pages/SectorBenchmarkingPage"));
// Sprint F — Portfolio Intelligence & Client Services
const PortfolioManagerPage = React.lazy(() => import("./features/portfolio-manager/pages/PortfolioManagerPage"));
const EsgScreenerPage = React.lazy(() => import("./features/esg-screener/pages/EsgScreenerPage"));
const StewardshipTrackerPage = React.lazy(() => import("./features/stewardship-tracker/pages/StewardshipTrackerPage"));
const ClientReportPage = React.lazy(() => import("./features/client-report/pages/ClientReportPage"));
const RegulatoryCalendarPage = React.lazy(() => import("./features/regulatory-calendar/pages/RegulatoryCalendarPage"));
// Sprint G — Portfolio Intelligence Advanced Suite
const PortfolioSuitePage = React.lazy(() => import("./features/portfolio-suite/pages/PortfolioSuitePage"));
const ScenarioStressTestPage = React.lazy(() => import("./features/scenario-stress-test/pages/ScenarioStressTestPage"));
const CarbonBudgetPage = React.lazy(() => import("./features/carbon-budget/pages/CarbonBudgetPage"));
const HoldingsDeepDivePage = React.lazy(() => import("./features/holdings-deep-dive/pages/HoldingsDeepDivePage"));
const BenchmarkAnalyticsPage = React.lazy(() => import("./features/benchmark-analytics/pages/BenchmarkAnalyticsPage"));
const AdvancedReportStudioPage = React.lazy(() => import("./features/advanced-report-studio/pages/AdvancedReportStudioPage"));
// Sprint H — Institutional Analytics & AI Intelligence
const RiskAttributionPage = React.lazy(() => import("./features/risk-attribution/pages/RiskAttributionPage"));
const FixedIncomeEsgPage = React.lazy(() => import("./features/fixed-income-esg/pages/FixedIncomeEsgPage"));
const PortfolioOptimizerPage = React.lazy(() => import("./features/portfolio-optimizer/pages/PortfolioOptimizerPage"));
const ControversyMonitorPage = React.lazy(() => import("./features/controversy-monitor/pages/ControversyMonitorPage"));
const AiSentimentPage = React.lazy(() => import("./features/ai-sentiment/pages/AiSentimentPage"));
const RegulatoryGapPage = React.lazy(() => import("./features/regulatory-gap/pages/RegulatoryGapPage"));
const ClimatePhysicalRiskPage = React.lazy(() => import("./features/climate-physical-risk/pages/ClimatePhysicalRiskPage"));
const ClimateTransitionRiskPage = React.lazy(() => import("./features/climate-transition-risk/pages/ClimateTransitionRiskPage"));
// Sprint I — Real Estate & Infrastructure ESG
const GreenBuildingCertPage = React.lazy(() => import("./features/green-building-cert/pages/GreenBuildingCertPage"));
const PropertyPhysicalRiskPage = React.lazy(() => import("./features/property-physical-risk/pages/PropertyPhysicalRiskPage"));
const GRESBScoringPage = React.lazy(() => import("./features/gresb-scoring/pages/GRESBScoringPage"));
const InfraESGDueDiligencePage = React.lazy(() => import("./features/infra-esg-dd/pages/InfraESGDueDiligencePage"));
const REPortfolioDashboardPage = React.lazy(() => import("./features/re-portfolio-dashboard/pages/REPortfolioDashboardPage"));
// Sprint J — Advanced Quantitative Analytics
const MonteCarloVarPage = React.lazy(() => import("./features/monte-carlo-var/pages/MonteCarloVarPage"));
const EsgBacktestingPage = React.lazy(() => import("./features/esg-backtesting/pages/EsgBacktestingPage"));
const ImpliedTempRegressionPage = React.lazy(() => import("./features/implied-temp-regression/pages/ImpliedTempRegressionPage"));
const CopulaTailRiskPage = React.lazy(() => import("./features/copula-tail-risk/pages/CopulaTailRiskPage"));
const StochasticScenariosPage = React.lazy(() => import("./features/stochastic-scenarios/pages/StochasticScenariosPage"));
const QuantDashboardPage = React.lazy(() => import("./features/quant-dashboard/pages/QuantDashboardPage"));
// Sprint K — Supply Chain & Scope 3
const Scope3EnginePage = React.lazy(() => import("./features/scope3-engine/pages/Scope3EnginePage"));
const SupplyChainMapPage = React.lazy(() => import("./features/supply-chain-map/pages/SupplyChainMapPage"));
const CSDDDCompliancePage = React.lazy(() => import("./features/csddd-compliance/pages/CSDDDCompliancePage"));
const DeforestationRiskPage = React.lazy(() => import("./features/deforestation-risk/pages/DeforestationRiskPage"));
const SupplyChainCarbonPage = React.lazy(() => import("./features/supply-chain-carbon/pages/SupplyChainCarbonPage"));
const ValueChainDashboardPage = React.lazy(() => import("./features/value-chain-dashboard/pages/ValueChainDashboardPage"));
// Sprint L — Private Markets & Alternative Assets
const PeVcEsgPage = React.lazy(() => import("./features/pe-vc-esg/pages/PeVcEsgPage"));
const PrivateCreditPage = React.lazy(() => import("./features/private-credit/pages/PrivateCreditPage"));
const FundOfFundsPage = React.lazy(() => import("./features/fund-of-funds/pages/FundOfFundsPage"));
const LpReportingPage = React.lazy(() => import("./features/lp-reporting/pages/LpReportingPage"));
const CoInvestmentPage = React.lazy(() => import("./features/co-investment/pages/CoInvestmentPage"));
const PrivateMarketsHubPage = React.lazy(() => import("./features/private-markets-hub/pages/PrivateMarketsHubPage"));
// Sprint M — Nature & Biodiversity (TNFD)
const TnfdLeapPage = React.lazy(() => import("./features/tnfd-leap/pages/TnfdLeapPage"));
const BiodiversityFootprintPage = React.lazy(() => import("./features/biodiversity-footprint/pages/BiodiversityFootprintPage"));
const EcosystemServicesPage = React.lazy(() => import("./features/ecosystem-services/pages/EcosystemServicesPage"));
const WaterStressPage = React.lazy(() => import("./features/water-stress/pages/WaterStressPage"));
const NatureScenariosPage = React.lazy(() => import("./features/nature-scenarios/pages/NatureScenariosPage"));
const NatureHubPage = React.lazy(() => import("./features/nature-hub/pages/NatureHubPage"));
// Sprint N — Social & Human Capital Analytics
const BoardDiversityPage = React.lazy(() => import("./features/board-diversity/pages/BoardDiversityPage"));
const LivingWagePage = React.lazy(() => import("./features/living-wage/pages/LivingWagePage"));
const HumanRightsDDPage = React.lazy(() => import("./features/human-rights-dd/pages/HumanRightsDDPage"));
const EmployeeWellbeingPage = React.lazy(() => import("./features/employee-wellbeing/pages/EmployeeWellbeingPage"));
const SocialImpactPage = React.lazy(() => import("./features/social-impact/pages/SocialImpactPage"));
const SocialHubPage = React.lazy(() => import("./features/social-hub/pages/SocialHubPage"));
// Sprint O — Sovereign & Macro ESG Analytics
const SovereignEsgPage = React.lazy(() => import("./features/sovereign-esg/pages/SovereignEsgPage"));
const ClimatePolicyPage = React.lazy(() => import("./features/climate-policy/pages/ClimatePolicyPage"));
const MacroTransitionPage = React.lazy(() => import("./features/macro-transition/pages/MacroTransitionPage"));
const JustTransitionPage = React.lazy(() => import("./features/just-transition/pages/JustTransitionPage"));
const ParisAlignmentPage = React.lazy(() => import("./features/paris-alignment/pages/ParisAlignmentPage"));
const SovereignHubPage = React.lazy(() => import("./features/sovereign-hub/pages/SovereignHubPage"));
// Sprint P — Data Infrastructure & Live Feeds
const ApiOrchestrationPage = React.lazy(() => import("./features/api-orchestration/pages/ApiOrchestrationPage"));
const DataQualityMonitorPage = React.lazy(() => import("./features/data-quality-monitor/pages/DataQualityMonitorPage"));
const LiveFeedManagerPage = React.lazy(() => import("./features/live-feed-manager/pages/LiveFeedManagerPage"));
const DataLineagePage = React.lazy(() => import("./features/data-lineage/pages/DataLineagePage"));
const BrsrBridgePage = React.lazy(() => import("./features/brsr-bridge/pages/BrsrBridgePage"));
const DataInfraHubPage = React.lazy(() => import("./features/data-infra-hub/pages/DataInfraHubPage"));
// Sprint Q — Taxonomy & Classification Engine
const EuTaxonomyEnginePage = React.lazy(() => import("./features/eu-taxonomy-engine/pages/EuTaxonomyEnginePage"));
const SfdrClassificationPage = React.lazy(() => import("./features/sfdr-classification/pages/SfdrClassificationPage"));
const IssbMaterialityPage = React.lazy(() => import("./features/issb-materiality/pages/IssbMaterialityPage"));
const GriAlignmentPage = React.lazy(() => import("./features/gri-alignment/pages/GriAlignmentPage"));
const FrameworkInteropPage = React.lazy(() => import("./features/framework-interop/pages/FrameworkInteropPage"));
const TaxonomyHubPage = React.lazy(() => import("./features/taxonomy-hub/pages/TaxonomyHubPage"));
// Sprint R — Client & Reporting Automation
const ReportGeneratorPage = React.lazy(() => import("./features/report-generator/pages/ReportGeneratorPage"));
const TemplateManagerPage = React.lazy(() => import("./features/template-manager/pages/TemplateManagerPage"));
const ClientPortalPage = React.lazy(() => import("./features/client-portal/pages/ClientPortalPage"));
const ScheduledReportsPage = React.lazy(() => import("./features/scheduled-reports/pages/ScheduledReportsPage"));
const RegulatorySubmissionPage = React.lazy(() => import("./features/regulatory-submission/pages/RegulatorySubmissionPage"));
const ReportingHubPage = React.lazy(() => import("./features/reporting-hub/pages/ReportingHubPage"));
// Sprint S — Data Management Engine (DME)
const DataValidationPage = React.lazy(() => import("./features/data-validation/pages/DataValidationPage"));
const DataReconciliationPage = React.lazy(() => import("./features/data-reconciliation/pages/DataReconciliationPage"));
const DataVersioningPage = React.lazy(() => import("./features/data-versioning/pages/DataVersioningPage"));
const EtlPipelinePage = React.lazy(() => import("./features/etl-pipeline/pages/EtlPipelinePage"));
const DataGovernancePage = React.lazy(() => import("./features/data-governance/pages/DataGovernancePage"));
const DmeHubPage = React.lazy(() => import("./features/dme-hub/pages/DmeHubPage"));
// Sprint U — DME Platform Integration (dme-platform + sentiment-engine + greenium-alpha)
const DmeRiskEnginePage = React.lazy(() => import("./features/dme-risk-engine/pages/DmeRiskEnginePage"));
const DmeEntityPage = React.lazy(() => import("./features/dme-entity/pages/DmeEntityPage"));
const DmeScenariosPage = React.lazy(() => import("./features/dme-scenarios/pages/DmeScenariosPage"));
const DmeAlertsPage = React.lazy(() => import("./features/dme-alerts/pages/DmeAlertsPage"));
const DmeContagionPage = React.lazy(() => import("./features/dme-contagion/pages/DmeContagionPage"));
const DmePortfolioPage = React.lazy(() => import("./features/dme-portfolio/pages/DmePortfolioPage"));
const DmeCompetitivePage = React.lazy(() => import("./features/dme-competitive/pages/DmeCompetitivePage"));
const DmeDashboardPage = React.lazy(() => import("./features/dme-dashboard/pages/DmeDashboardPage"));
// Sprint T — Dynamic Materiality Engine
// DoubleMaterialityPage already imported from Sprint 35 (line 55)
const StakeholderImpactPage = React.lazy(() => import("./features/stakeholder-impact/pages/StakeholderImpactPage"));
const MaterialityTrendsPage = React.lazy(() => import("./features/materiality-trends/pages/MaterialityTrendsPage"));
const ControversyMaterialityPage = React.lazy(() => import("./features/controversy-materiality/pages/ControversyMaterialityPage"));
const MaterialityScenariosPage = React.lazy(() => import("./features/materiality-scenarios/pages/MaterialityScenariosPage"));
const MaterialityHubPage = React.lazy(() => import("./features/materiality-hub/pages/MaterialityHubPage"));
// Sprint X — Impact Measurement & SDG Finance
const ImpactWeightedAccountsPage = React.lazy(() => import("./features/impact-weighted-accounts/pages/ImpactWeightedAccountsPage"));
const IrisMetricsPage = React.lazy(() => import("./features/iris-metrics/pages/IrisMetricsPage"));
const SdgBondImpactPage = React.lazy(() => import("./features/sdg-bond-impact/pages/SdgBondImpactPage"));
const BlendedFinancePage = React.lazy(() => import("./features/blended-finance/pages/BlendedFinancePage"));
const ImpactVerificationPage = React.lazy(() => import("./features/impact-verification/pages/ImpactVerificationPage"));
const ImpactHubPage = React.lazy(() => import("./features/impact-hub/pages/ImpactHubPage"));
// Sprint W — AI & NLP Analytics
const EsgReportParserPage = React.lazy(() => import("./features/esg-report-parser/pages/EsgReportParserPage"));
const PredictiveEsgPage = React.lazy(() => import("./features/predictive-esg/pages/PredictiveEsgPage"));
const AnomalyDetectionPage = React.lazy(() => import("./features/anomaly-detection/pages/AnomalyDetectionPage"));
const AiEngagementPage = React.lazy(() => import("./features/ai-engagement/pages/AiEngagementPage"));
const DocumentSimilarityPage = React.lazy(() => import("./features/document-similarity/pages/DocumentSimilarityPage"));
const AiHubPage = React.lazy(() => import("./features/ai-hub/pages/AiHubPage"));
// Sprint V — Governance & Audit Trail
const AuditTrailPage = React.lazy(() => import("./features/audit-trail/pages/AuditTrailPage"));
const ModelGovernancePage = React.lazy(() => import("./features/model-governance/pages/ModelGovernancePage"));
const ApprovalWorkflowsPage = React.lazy(() => import("./features/approval-workflows/pages/ApprovalWorkflowsPage"));
const ComplianceEvidencePage = React.lazy(() => import("./features/compliance-evidence/pages/ComplianceEvidencePage"));
const ChangeManagementPage = React.lazy(() => import("./features/change-management/pages/ChangeManagementPage"));
const GovernanceHubPage = React.lazy(() => import("./features/governance-hub/pages/GovernanceHubPage"));
const CorporateGovernancePage = React.lazy(() => import("./features/corporate-governance/pages/CorporateGovernancePage"));
const GeopoliticalAiGovPage = React.lazy(() => import("./features/geopolitical-ai-gov/pages/GeopoliticalAiGovPage"));
// Integrated Carbon Emissions Hub
const IntegratedCarbonEmissionsPage = React.lazy(() => import("./features/integrated-carbon-emissions/pages/IntegratedCarbonEmissionsPage"));
// Sprint Z — Consumer Carbon Intelligence
const CarbonCalculatorPage = React.lazy(() => import("./features/carbon-calculator/pages/CarbonCalculatorPage"));
const CarbonWalletPage = React.lazy(() => import("./features/carbon-wallet/pages/CarbonWalletPage"));
const InvoiceParserPage = React.lazy(() => import("./features/invoice-parser/pages/InvoiceParserPage"));
const SpendingCarbonPage = React.lazy(() => import("./features/spending-carbon/pages/SpendingCarbonPage"));
const CarbonEconomyPage = React.lazy(() => import("./features/carbon-economy/pages/CarbonEconomyPage"));
const ConsumerCarbonHubPage = React.lazy(() => import("./features/consumer-carbon-hub/pages/ConsumerCarbonHubPage"));
// Sprint AI — Corporate Decarbonisation & SBTi Intelligence
const SbtiTargetSetterPage = React.lazy(() => import("./features/sbti-target-setter/pages/SbtiTargetSetterPage"));
const DecarbonisationRoadmapPage = React.lazy(() => import("./features/decarbonisation-roadmap/pages/DecarbonisationRoadmapPage"));
const AbatementCostCurvePage = React.lazy(() => import("./features/abatement-cost-curve/pages/AbatementCostCurvePage"));
const EnergyTransitionAnalyticsPage = React.lazy(() => import("./features/energy-transition-analytics/pages/EnergyTransitionAnalyticsPage"));
const CarbonReductionProjectsPage = React.lazy(() => import("./features/carbon-reduction-projects/pages/CarbonReductionProjectsPage"));
const DecarbonisationHubPage = React.lazy(() => import("./features/decarbonisation-hub/pages/DecarbonisationHubPage"));
// Sprint AJ — Financed Emissions & Climate Banking Analytics
const PcafFinancedEmissionsPage = React.lazy(() => import("./features/pcaf-financed-emissions/pages/PcafFinancedEmissionsPage"));
const ClimateStressTestPage = React.lazy(() => import("./features/climate-stress-test/pages/ClimateStressTestPage"));
const GreenAssetRatioPage = React.lazy(() => import("./features/green-asset-ratio/pages/GreenAssetRatioPage"));
const PortfolioTemperatureScorePage = React.lazy(() => import("./features/portfolio-temperature-score/pages/PortfolioTemperatureScorePage"));
const ClimateCreditRiskPage = React.lazy(() => import("./features/climate-credit-risk-analytics/pages/ClimateCreditRiskPage"));
const ClimateBankingHubPage = React.lazy(() => import("./features/climate-banking-hub/pages/ClimateBankingHubPage"));
// Sprint AV — Geopolitical Risk & Climate Security Intelligence
const SanctionsClimateFinancePage = React.lazy(() => import("./features/sanctions-climate-finance/pages/SanctionsClimateFinancePage"));
const EnergySecurityTransitionPage = React.lazy(() => import("./features/energy-security-transition/pages/EnergySecurityTransitionPage"));
const CriticalMineralGeopoliticsPage = React.lazy(() => import("./features/critical-mineral-geopolitics/pages/CriticalMineralGeopoliticsPage"));
const TradeCarbonPolicyPage = React.lazy(() => import("./features/trade-carbon-policy/pages/TradeCarbonPolicyPage"));
const ClimateMigrationRiskPage = React.lazy(() => import("./features/climate-migration-risk/pages/ClimateMigrationRiskPage"));
const GeopoliticalEsgHubPage = React.lazy(() => import("./features/geopolitical-esg-hub/pages/GeopoliticalEsgHubPage"));
// Sprint AU — Climate & Health Nexus Finance
const HeatMortalityRiskPage = React.lazy(() => import("./features/heat-mortality-risk/pages/HeatMortalityRiskPage"));
const AirQualityFinancePage = React.lazy(() => import("./features/air-quality-finance/pages/AirQualityFinancePage"));
const PandemicClimateNexusPage = React.lazy(() => import("./features/pandemic-climate-nexus/pages/PandemicClimateNexusPage"));
const HealthAdaptationFinancePage = React.lazy(() => import("./features/health-adaptation-finance/pages/HealthAdaptationFinancePage"));
const WorkerHeatStressPage = React.lazy(() => import("./features/worker-heat-stress/pages/WorkerHeatStressPage"));
const ClimateHealthHubPage = React.lazy(() => import("./features/climate-health-hub/pages/ClimateHealthHubPage"));
// Sprint AT — Food Systems & Agricultural Finance
const RegenerativeAgriculturePage = React.lazy(() => import("./features/regenerative-agriculture/pages/RegenerativeAgriculturePage"));
const FoodSupplyChainEmissionsPage = React.lazy(() => import("./features/food-supply-chain-emissions/pages/FoodSupplyChainEmissionsPage"));
const WaterAgricultureRiskPage = React.lazy(() => import("./features/water-agriculture-risk/pages/WaterAgricultureRiskPage"));
const LandUseCarbonPage = React.lazy(() => import("./features/land-use-carbon/pages/LandUseCarbonPage"));
const AgriBiodiversityPage = React.lazy(() => import("./features/agri-biodiversity/pages/AgriBiodiversityPage"));
const AgriFinanceHubPage = React.lazy(() => import("./features/agri-finance-hub/pages/AgriFinanceHubPage"));
// Sprint AS — Real Estate & Built Environment ESG
const BuildingEnergyPerformancePage = React.lazy(() => import("./features/building-energy-performance/pages/BuildingEnergyPerformancePage"));
const GreenBuildingCertificationPage = React.lazy(() => import("./features/green-building-certification/pages/GreenBuildingCertificationPage"));
const EmbodiedCarbonPage = React.lazy(() => import("./features/embodied-carbon/pages/EmbodiedCarbonPage"));
const ClimateResilientDesignPage = React.lazy(() => import("./features/climate-resilient-design/pages/ClimateResilientDesignPage"));
const TenantEngagementEsgPage = React.lazy(() => import("./features/tenant-engagement-esg/pages/TenantEngagementEsgPage"));
const RealEstateEsgHubPage = React.lazy(() => import("./features/real-estate-esg-hub/pages/RealEstateEsgHubPage"));
// Sprint AR — Insurance & Underwriting Climate Analytics
const CatastropheModellingPage = React.lazy(() => import("./features/catastrophe-modelling/pages/CatastropheModellingPage"));
const UnderwritingEsgPage = React.lazy(() => import("./features/underwriting-esg/pages/UnderwritingEsgPage"));
const ParametricInsurancePage = React.lazy(() => import("./features/parametric-insurance/pages/ParametricInsurancePage"));
const ReinsuranceClimatePage = React.lazy(() => import("./features/reinsurance-climate/pages/ReinsuranceClimatePage"));
const InsuranceTransitionPage = React.lazy(() => import("./features/insurance-transition/pages/InsuranceTransitionPage"));
const InsuranceClimateHubPage = React.lazy(() => import("./features/insurance-climate-hub/pages/InsuranceClimateHubPage"));
// Sprint AQ — Sovereign ESG & Country-Level Climate Risk Intelligence
const SovereignClimateRiskPage = React.lazy(() => import("./features/sovereign-climate-risk/pages/SovereignClimateRiskPage"));
const SovereignDebtSustainabilityPage = React.lazy(() => import("./features/sovereign-debt-sustainability/pages/SovereignDebtSustainabilityPage"));
const CentralBankClimatePage = React.lazy(() => import("./features/central-bank-climate/pages/CentralBankClimatePage"));
const SovereignNatureRiskPage = React.lazy(() => import("./features/sovereign-nature-risk/pages/SovereignNatureRiskPage"));
const SovereignSocialIndexPage = React.lazy(() => import("./features/sovereign-social-index/pages/SovereignSocialIndexPage"));
const SovereignEsgHubPage = React.lazy(() => import("./features/sovereign-esg-hub/pages/SovereignEsgHubPage"));
// Sprint AP — Supply Chain ESG & Scope 3 Value Chain Intelligence
const Scope3UpstreamTrackerPage = React.lazy(() => import("./features/scope3-upstream-tracker/pages/Scope3UpstreamTrackerPage"));
const SupplierEngagementPage = React.lazy(() => import("./features/supplier-engagement/pages/SupplierEngagementPage"));
const CommodityDeforestationPage = React.lazy(() => import("./features/commodity-deforestation/pages/CommodityDeforestationPage"));
const ConflictMineralsPage = React.lazy(() => import("./features/conflict-minerals/pages/ConflictMineralsPage"));
const SupplyChainResiliencePage = React.lazy(() => import("./features/supply-chain-resilience/pages/SupplyChainResiliencePage"));
const SupplyChainEsgHubPage = React.lazy(() => import("./features/supply-chain-esg-hub/pages/SupplyChainEsgHubPage"));
// Sprint AO — Scope 4 / Avoided Emissions & Climate Solutions
const Scope4AvoidedEmissionsPage = React.lazy(() => import("./features/scope4-avoided-emissions/pages/Scope4AvoidedEmissionsPage"));
const ProductCarbonHandprintPage = React.lazy(() => import("./features/product-carbon-handprint/pages/ProductCarbonHandprintPage"));
const EnablementMethodologyPage = React.lazy(() => import("./features/enablement-methodology/pages/EnablementMethodologyPage"));
const AvoidedEmissionsPortfolioPage = React.lazy(() => import("./features/avoided-emissions-portfolio/pages/AvoidedEmissionsPortfolioPage"));
const ClimateSolutionTaxonomyPage = React.lazy(() => import("./features/climate-solution-taxonomy/pages/ClimateSolutionTaxonomyPage"));
const AvoidedEmissionsHubPage = React.lazy(() => import("./features/avoided-emissions-hub/pages/AvoidedEmissionsHubPage"));
// Sprint AN — Sustainable Transport & Logistics Decarbonisation
const MaritimeImoCompliancePage = React.lazy(() => import("./features/maritime-imo-compliance/pages/MaritimeImoCompliancePage"));
const AviationCorsiaPage = React.lazy(() => import("./features/aviation-corsia/pages/AviationCorsiaPage"));
const EvFleetFinancePage = React.lazy(() => import("./features/ev-fleet-finance/pages/EvFleetFinancePage"));
const SustainableAviationFuelPage = React.lazy(() => import("./features/sustainable-aviation-fuel/pages/SustainableAviationFuelPage"));
const TransportDecarbonisationPage = React.lazy(() => import("./features/transport-decarbonisation/pages/TransportDecarbonisationPage"));
const SustainableTransportHubPage = React.lazy(() => import("./features/sustainable-transport-hub/pages/SustainableTransportHubPage"));
// Sprint AM — Climate Fintech & Digital MRV Intelligence
const DigitalMrvPage = React.lazy(() => import("./features/digital-mrv/pages/DigitalMrvPage"));
const SatelliteClimateMonitorPage = React.lazy(() => import("./features/satellite-climate-monitor/pages/SatelliteClimateMonitorPage"));
const BlockchainCarbonRegistryPage = React.lazy(() => import("./features/blockchain-carbon-registry/pages/BlockchainCarbonRegistryPage"));
const ClimateDataMarketplacePage = React.lazy(() => import("./features/climate-data-marketplace/pages/ClimateDataMarketplacePage"));
const IotEmissionsTrackerPage = React.lazy(() => import("./features/iot-emissions-tracker/pages/IotEmissionsTrackerPage"));
const ClimateFintechHubPage = React.lazy(() => import("./features/climate-fintech-hub/pages/ClimateFintechHubPage"));
// Sprint BO — Critical Minerals · Battery & EV Analytics · ET Commodity Risk
const BatteryEVAnalyticsPage      = React.lazy(() => import("./features/battery-ev-analytics/pages/BatteryEVAnalyticsPage"));
const ETCommodityRiskPage         = React.lazy(() => import("./features/et-commodity-risk/pages/ETCommodityRiskPage"));
// Sprint BP — Equitable Earth Methodologies (standalone with calculation engine)
const EquitableEarthMethodologiesPage = React.lazy(() => import("./features/equitable-earth-methodologies/pages/EquitableEarthMethodologiesPage"));
// Sprint BN — VCM Registry Analytics · Carbon Forward Curve · Credit Integrity DD
const VcmRegistryAnalyticsPage   = React.lazy(() => import("./features/vcm-registry-analytics/pages/VcmRegistryAnalyticsPage"));
const CarbonForwardCurvePage     = React.lazy(() => import("./features/carbon-forward-curve/pages/CarbonForwardCurvePage"));
const CreditIntegrityDDPage      = React.lazy(() => import("./features/credit-integrity-dd/pages/CreditIntegrityDDPage"));
// Sprint BM — NatCat Loss Engine · Cat Bond & ILS · Insurance Protection Gap
const NatCatLossEnginePage        = React.lazy(() => import("./features/natcat-loss-engine/pages/NatCatLossEnginePage"));
const CatBondILSPage              = React.lazy(() => import("./features/cat-bond-ils/pages/CatBondILSPage"));
const InsuranceProtectionGapPage  = React.lazy(() => import("./features/insurance-protection-gap/pages/InsuranceProtectionGapPage"));
// Sprint BL — ML Risk Scorer · NLP Disclosure Parser · Predictive Analytics Hub
const MLRiskScorerPage            = React.lazy(() => import("./features/ml-risk-scorer/pages/MLRiskScorerPage"));
const NLPDisclosureParserPage     = React.lazy(() => import("./features/nlp-disclosure-parser/pages/NLPDisclosureParserPage"));
const PredictiveAnalyticsHubPage2 = React.lazy(() => import("./features/predictive-analytics-hub/pages/PredictiveAnalyticsHubPage"));
// Sprint BK — Asset Valuation Engine · Infrastructure Valuation · Real Estate Valuation
const AssetValuationEnginePage    = React.lazy(() => import("./features/asset-valuation-engine/pages/AssetValuationEnginePage"));
const InfrastructureValuationPage = React.lazy(() => import("./features/infrastructure-valuation/pages/InfrastructureValuationPage"));
const RealEstateValuationPage     = React.lazy(() => import("./features/real-estate-valuation/pages/RealEstateValuationPage"));
// Sprint BJ — NGFS×IEA Scenario Engine · Climate-Credit Integration
const NgfsIeaScenarioPage        = React.lazy(() => import("./features/ngfs-iea-scenario/pages/NgfsIeaScenarioPage"));
const ClimateCreditIntegrationPage = React.lazy(() => import("./features/climate-credit-integration/pages/ClimateCreditIntegrationPage"));
// Sprint BI — Credit Risk Analytics · Platform Analytics Dashboard
const CreditRiskAnalyticsPage = React.lazy(() => import("./features/credit-risk-analytics/pages/CreditRiskAnalyticsPage"));
const PlatformAnalyticsPage   = React.lazy(() => import("./features/platform-analytics/pages/PlatformAnalyticsPage"));
// Sprint BH — DB Migration Console · Multi-Tenancy & Org Management
const DbMigrationConsolePage  = React.lazy(() => import("./features/db-migration-console/pages/DbMigrationConsolePage"));
const MultiTenancyAuditPage   = React.lazy(() => import("./features/multi-tenancy-audit/pages/MultiTenancyAuditPage"));
// Sprint BG — SBTi Registry & Climate TRACE · Sanctions & Watchlist Intelligence
const SbtiClimateTracePage    = React.lazy(() => import("./features/sbti-climate-trace/pages/SbtiClimateTracePage"));
const SanctionsWatchlistPage  = React.lazy(() => import("./features/sanctions-watchlist/pages/SanctionsWatchlistPage"));
// Sprint BF — Data Hub Ingester Monitor · OWID CO₂ & EVIC Analytics
const DataHubIngesterPage    = React.lazy(() => import("./features/data-hub-ingester/pages/DataHubIngesterPage"));
const OwIdEvicAnalyticsPage  = React.lazy(() => import("./features/owid-evic-analytics/pages/OwIdEvicAnalyticsPage"));
// Sprint BE — DME Financial Risk · DME PD Engine · DME Dynamic Materiality Index
const DmeFinancialRiskPage = React.lazy(() => import("./features/dme-financial-risk/pages/DmeFinancialRiskPage"));
const DmePdEnginePage      = React.lazy(() => import("./features/dme-pd-engine/pages/DmePdEnginePage"));
const DmeIndexPage         = React.lazy(() => import("./features/dme-index/pages/DmeIndexPage"));
// Sprint BD — Greenium Signal Engine · Sentiment Pipeline Engine
const GreeniumSignalPage    = React.lazy(() => import("./features/greenium-signal/pages/GreeniumSignalPage"));
const SentimentPipelinePage = React.lazy(() => import("./features/sentiment-pipeline/pages/SentimentPipelinePage"));
// Sprint BC — Residential RE Assessment · XBRL Ingestion
const ResidentialReAssessmentPage = React.lazy(() => import("./features/residential-re-assessment/pages/ResidentialReAssessmentPage"));
const XbrlIngestionPage            = React.lazy(() => import("./features/xbrl-ingestion/pages/XbrlIngestionPage"));
// Sprint BB — PE Deal Pipeline & Fund Structure · Technology Risk Panel
const PeDealPipelinePage   = React.lazy(() => import("./features/pe-deal-pipeline/pages/PeDealPipelinePage"));
const TechnologyRiskPage   = React.lazy(() => import("./features/technology-risk/pages/TechnologyRiskPage"));
// Sprint BA — Sovereign Climate Risk Intelligence · SEC Climate Disclosure
const SovereignClimateIntelligencePage = React.lazy(() => import("./features/sovereign-climate-intelligence/pages/SovereignClimateIntelligencePage"));
const SecClimateDisclosurePage         = React.lazy(() => import("./features/sec-climate-disclosure/pages/SecClimateDisclosurePage"));
// Sprint AZ — Double Materiality Workshop · SFDR PAI Dashboard · XBRL Export Wizard
const DoubleMaterialityWorkshopPage = React.lazy(() => import("./features/double-materiality-workshop/pages/DoubleMaterialityWorkshopPage"));
const SfdrPaiDashboardPage          = React.lazy(() => import("./features/sfdr-pai-dashboard/pages/SfdrPaiDashboardPage"));
const XbrlExportWizardPage          = React.lazy(() => import("./features/xbrl-export-wizard/pages/XbrlExportWizardPage"));
// Sprint AY — EUDR Engine · CSDDD Engine · Entity 360 Intelligence
const EudrEnginePage   = React.lazy(() => import("./features/eudr-engine/pages/EudrEnginePage"));
const CsdddEnginePage  = React.lazy(() => import("./features/csddd-engine/pages/CsdddEnginePage"));
const Entity360Page    = React.lazy(() => import("./features/entity-360/pages/Entity360Page"));
// Sprint AX — Sovereign & Country Climate Risk Intelligence (new analytical modules)
const SovereignEsgScorerPage   = React.lazy(() => import("./features/sovereign-esg-scorer/pages/SovereignEsgScorerPage"));
const NdcAlignmentTrackerPage  = React.lazy(() => import("./features/ndc-alignment-tracker/pages/NdcAlignmentTrackerPage"));
const SovereignPhysicalRiskPage= React.lazy(() => import("./features/sovereign-physical-risk/pages/SovereignPhysicalRiskPage"));
const EmDebtClimateRiskPage    = React.lazy(() => import("./features/em-debt-climate-risk/pages/EmDebtClimateRiskPage"));
const MdbClimateFinancePage    = React.lazy(() => import("./features/mdb-climate-finance/pages/MdbClimateFinancePage"));
// Sprint AL — Transition Planning & Net Zero Alignment Intelligence
const TransitionPlanBuilderPage = React.lazy(() => import("./features/transition-plan-builder/pages/TransitionPlanBuilderPage"));
const GfanzSectorPathwaysPage = React.lazy(() => import("./features/gfanz-sector-pathways/pages/GfanzSectorPathwaysPage"));
const ActAssessmentPage = React.lazy(() => import("./features/act-assessment/pages/ActAssessmentPage"));
const NetZeroCommitmentTrackerPage = React.lazy(() => import("./features/net-zero-commitment-tracker/pages/NetZeroCommitmentTrackerPage"));
const TransitionCredibilityPage = React.lazy(() => import("./features/transition-credibility/pages/TransitionCredibilityPage"));
const TransitionPlanningHubPage = React.lazy(() => import("./features/transition-planning-hub/pages/TransitionPlanningHubPage"));
// Sprint AK — ESG Ratings Intelligence & Provider Analytics
const EsgRatingsComparatorPage = React.lazy(() => import("./features/esg-ratings-comparator/pages/EsgRatingsComparatorPage"));
const RatingsMethodologyDecoderPage = React.lazy(() => import("./features/ratings-methodology-decoder/pages/RatingsMethodologyDecoderPage"));
const RatingsMigrationMomentumPage = React.lazy(() => import("./features/ratings-migration-momentum/pages/RatingsMigrationMomentumPage"));
const ControversyRatingImpactPage = React.lazy(() => import("./features/controversy-rating-impact/pages/ControversyRatingImpactPage"));
const GreenwashingDetectorPage = React.lazy(() => import("./features/greenwashing-detector/pages/GreenwashingDetectorPage"));
const EsgRatingsHubPage = React.lazy(() => import("./features/esg-ratings-hub/pages/EsgRatingsHubPage"));
// Sprint AH — Regulatory Reporting & Disclosure Automation
const CsrdEsrsAutomationPage = React.lazy(() => import("./features/csrd-esrs-automation/pages/CsrdEsrsAutomationPage"));
const SfdrV2ReportingPage = React.lazy(() => import("./features/sfdr-v2-reporting/pages/SfdrV2ReportingPage"));
const IssbDisclosurePage = React.lazy(() => import("./features/issb-disclosure/pages/IssbDisclosurePage"));
const UkSdrPage = React.lazy(() => import("./features/uk-sdr/pages/UkSdrPage"));
const SecClimateRulePage = React.lazy(() => import("./features/sec-climate-rule/pages/SecClimateRulePage"));
const DisclosureHubPage = React.lazy(() => import("./features/disclosure-hub/pages/DisclosureHubPage"));
// Sprint AG — Private Markets & Alternative Credit ESG
const PeEsgDiligencePage = React.lazy(() => import("./features/pe-esg-diligence/pages/PeEsgDiligencePage"));
const PrivateCreditClimatePage = React.lazy(() => import("./features/private-credit-climate/pages/PrivateCreditClimatePage"));
const InfrastructureEsgPage = React.lazy(() => import("./features/infrastructure-esg/pages/InfrastructureEsgPage"));
const RealAssetsClimatePage = React.lazy(() => import("./features/real-assets-climate/pages/RealAssetsClimatePage"));
const VcImpactPage = React.lazy(() => import("./features/vc-impact/pages/VcImpactPage"));
const PrivateMarketsEsgHubPage = React.lazy(() => import("./features/private-markets-esg-hub/pages/PrivateMarketsEsgHubPage"));
// Sprint AF — Quantitative ESG & Portfolio Intelligence
const EsgPortfolioOptimizerPage = React.lazy(() => import("./features/esg-portfolio-optimizer/pages/EsgPortfolioOptimizerPage"));
const CarbonAwareAllocationPage = React.lazy(() => import("./features/carbon-aware-allocation/pages/CarbonAwareAllocationPage"));
const EsgMomentumScannerPage = React.lazy(() => import("./features/esg-momentum-scanner/pages/EsgMomentumScannerPage"));
const NetZeroPortfolioBuilderPage = React.lazy(() => import("./features/net-zero-portfolio-builder/pages/NetZeroPortfolioBuilderPage"));
const EsgFactorAlphaPage = React.lazy(() => import("./features/esg-factor-alpha/pages/EsgFactorAlphaPage"));
const QuantEsgHubPage = React.lazy(() => import("./features/quant-esg-hub/pages/QuantEsgHubPage"));
// Sprint AE — Corporate Governance & Executive Intelligence
const BoardCompositionPage = React.lazy(() => import("./features/board-composition/pages/BoardCompositionPage"));
const ExecutivePayAnalyticsPage = React.lazy(() => import("./features/executive-pay-analytics/pages/ExecutivePayAnalyticsPage"));
const ShareholderActivismPage = React.lazy(() => import("./features/shareholder-activism/pages/ShareholderActivismPage"));
const AntiCorruptionPage = React.lazy(() => import("./features/anti-corruption/pages/AntiCorruptionPage"));
const ProxyVotingIntelPage = React.lazy(() => import("./features/proxy-voting-intel/pages/ProxyVotingIntelPage"));
const DiversityEquityInclusionPage = React.lazy(() => import("./features/diversity-equity-inclusion/pages/DiversityEquityInclusionPage"));
// Sprint AD — Social & Just Transition
const JustTransitionFinancePage = React.lazy(() => import("./features/just-transition-finance/pages/JustTransitionFinancePage"));
const HumanRightsRiskPage = React.lazy(() => import("./features/human-rights-risk/pages/HumanRightsRiskPage"));
const LivingWageTrackerPage = React.lazy(() => import("./features/living-wage-tracker/pages/LivingWageTrackerPage"));
const ModernSlaveryIntelPage = React.lazy(() => import("./features/modern-slavery-intel/pages/ModernSlaveryIntelPage"));
const CommunityImpactPage = React.lazy(() => import("./features/community-impact/pages/CommunityImpactPage"));
const WorkplaceHealthSafetyPage = React.lazy(() => import("./features/workplace-health-safety/pages/WorkplaceHealthSafetyPage"));
// Sprint AC — Nature, Environment & Physical Risk
const NatureLossRiskPage = React.lazy(() => import("./features/nature-loss-risk/pages/NatureLossRiskPage"));
const WaterRiskAnalyticsPage = React.lazy(() => import("./features/water-risk-analytics/pages/WaterRiskAnalyticsPage"));
const LandUseDeforestationPage = React.lazy(() => import("./features/land-use-deforestation/pages/LandUseDeforestationPage"));
const OceanMarineRiskPage = React.lazy(() => import("./features/ocean-marine-risk/pages/OceanMarineRiskPage"));
const CircularEconomyTrackerPage = React.lazy(() => import("./features/circular-economy-tracker/pages/CircularEconomyTrackerPage"));
const AirQualityHealthRiskPage = React.lazy(() => import("./features/air-quality-health-risk/pages/AirQualityHealthRiskPage"));
// Sprint AB — Macro & Systemic Risk Intelligence
const SystemicESGRiskPage = React.lazy(() => import("./features/systemic-esg-risk/pages/SystemicEsgRiskPage"));
const ClimatePolicyIntelligencePage = React.lazy(() => import("./features/climate-policy-intelligence/pages/ClimatePolicyIntelligencePage"));
const GreenCentralBankingPage = React.lazy(() => import("./features/green-central-banking/pages/GreenCentralBankingPage"));
const ESGFactorAttributionPage = React.lazy(() => import("./features/esg-factor-attribution/pages/EsgFactorAttributionPage"));
const TransitionScenarioModellerPage = React.lazy(() => import("./features/transition-scenario-modeller/pages/TransitionScenarioModellerPage"));
const CrossAssetContagionPage = React.lazy(() => import("./features/cross-asset-contagion/pages/CrossAssetContagionPage"));
// Sprint AA — Climate Finance Architecture
const ClimateFinanceHubPage = React.lazy(() => import("./features/climate-finance-hub/pages/ClimateFinanceHubPage"));
const Article6MarketsPage = React.lazy(() => import("./features/article6-markets/pages/Article6MarketsPage"));
const CbamCompliancePage = React.lazy(() => import("./features/cbam-compliance/pages/CbamCompliancePage"));
const ClimateFinanceTrackerPage = React.lazy(() => import("./features/climate-finance-tracker/pages/ClimateFinanceTrackerPage"));
const GreenTaxonomyNavigatorPage = React.lazy(() => import("./features/green-taxonomy-navigator/pages/GreenTaxonomyNavigatorPage"));
const ClimateSovereignBondsPage = React.lazy(() => import("./features/climate-sovereign-bonds/pages/ClimateSovereignBondsPage"));
// Sprint Y — Commodity Lifecycle Intelligence
const CommodityIntelligencePage = React.lazy(() => import("./features/commodity-intelligence/pages/CommodityIntelligencePage"));
const CommodityInventoryPage = React.lazy(() => import("./features/commodity-inventory/pages/CommodityInventoryPage"));
const LifecycleAssessmentPage = React.lazy(() => import("./features/lifecycle-assessment/pages/LifecycleAssessmentPage"));
const FinancialFlowPage = React.lazy(() => import("./features/financial-flow/pages/FinancialFlowPage"));
const EsgValueChainPage = React.lazy(() => import("./features/esg-value-chain/pages/EsgValueChainPage"));
const ClimateNatureRepoPage = React.lazy(() => import("./features/climate-nature-repo/pages/ClimateNatureRepoPage"));
const MultiFactorIntegrationPage = React.lazy(() => import("./features/multi-factor-integration/pages/MultiFactorIntegrationPage"));
const CommodityHubPage = React.lazy(() => import("./features/commodity-hub/pages/CommodityHubPage"));
const ProductAnatomyPage = React.lazy(() => import("./features/product-anatomy/pages/ProductAnatomyPage"));
const EpdLcaDatabasePage = React.lazy(() => import("./features/epd-lca-database/pages/EpdLcaDatabasePage"));

/* ═══════════════════════════════════════════════════════════════════
   THEME — Institutional Light · Navy / Gold / Sage (AA Impact brand)
   Font: DM Sans (headlines) + JetBrains Mono (data)
   ═══════════════════════════════════════════════════════════════════ */
// Font loader — non-blocking Google Fonts injection
if (typeof window !== 'undefined' && !document.querySelector('link[href*="DM+Sans"]')) {
  const _fl = document.createElement('link'); _fl.rel = 'stylesheet';
  _fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..800&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(_fl);
}


const LoadingFallback = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',
    background:'#f6f4f0',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    <div style={{textAlign:'center'}}>
      <div style={{fontSize:28,fontWeight:700,color:'#1b3a5c',marginBottom:8}}>AA Impact Platform</div>
      <div style={{fontSize:14,color:'#5c6b7e'}}>Loading module...</div>
    </div>
  </div>
);
const T = {
  bg:       '#f6f4f0',       // warm cream
  surface:  '#ffffff',
  surfaceH: '#f0ede7',       // hover tint
  border:   '#e5e0d8',
  borderL:  '#d5cfc5',
  navy:     '#1b3a5c',       // brand primary
  navyD:    '#122a44',       // deep navy
  navyL:    '#2c5a8c',
  gold:     '#c5a96a',       // brand accent
  goldL:    '#d4be8a',
  goldD:    '#a8903a',
  sage:     '#5a8a6a',       // leaf green
  sageL:    '#7ba67d',
  teal:     '#5a8a6a',       // alias for backward compat
  text:     '#1b3a5c',       // navy text
  textSec:  '#5c6b7e',
  textMut:  '#9aa3ae',
  red:      '#dc2626',
  green:    '#16a34a',
  amber:    '#d97706',
  card:     '0 1px 3px rgba(27,58,92,0.04), 0 0 0 1px rgba(27,58,92,0.03)',
  cardH:    '0 8px 24px rgba(27,58,92,0.08), 0 0 0 1px rgba(27,58,92,0.06)',
  font:     "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
  mono:     "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};
const PASTEL = ['#4a7faa','#5a9aaa','#5a8a6a','#7ba67d','#8a7a5a','#a08a5a','#c5a96a'];

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION DATA — 38 domains, 180+ modules
   ═══════════════════════════════════════════════════════════════════ */
const NAV_GROUPS = [
  { label: 'Climate Risk & Stress Testing', icon: '\u26A0\uFE0F', color: PASTEL[0], items: [
    { path: '/stress-test-orchestrator', label: 'Stress Test Orchestrator', badge: 'ECB/EBA/BoE', code: 'E100' },
    { path: '/physical-risk-pricing', label: 'Physical Risk Pricing', badge: 'NatCat/NGFS', code: 'E104' },
    { path: '/temperature-alignment', label: 'Temperature Alignment', badge: 'PCAF-SBTi', code: 'E103' },
    { path: '/climate-derivatives', label: 'Climate Derivatives', badge: 'EMIR/MiFID', code: 'E106' },
    { path: '/climate-insurance', label: 'Climate Insurance', badge: 'IAIS', code: 'E79' },
    { path: '/climate-litigation', label: 'Climate Litigation Risk', badge: 'CPLI', code: 'E91' },
    { path: '/em-climate-risk', label: 'EM Climate Risk', badge: 'IFC PS6', code: 'E87' },
    { path: '/technology-risk', label: 'Technology Risk Panel', badge: 'Cyber · AI/Model · OT · DORA · NIS2 · EU AI Act · 45 Entities', code: 'EP-BB2' },
  ]},
  { label: 'Carbon & Emissions', icon: '\uD83C\uDF2B\uFE0F', color: PASTEL[1], items: [
    { path: '/integrated-carbon-emissions', label: 'Integrated Carbon Hub', badge: 'Hub · All Scopes · 150 Holdings · 8 Tabs · Board Report', code: 'ICE-001' },
    { path: '/carbon-accounting-ai', label: 'Carbon Accounting AI', badge: 'GHG Protocol', code: 'E78' },
    { path: '/carbon-removal', label: 'Carbon Removal & CDR', badge: 'Oxford', code: 'E90' },
    { path: '/internal-carbon-price', label: 'Internal Carbon Price', badge: 'SBTi ICP', code: 'E84' },
    { path: '/vcm-integrity', label: 'VCM Integrity', badge: 'ICVCM CCP', code: 'E96' },
    { path: '/crypto-climate', label: 'Crypto Climate Risk', badge: 'MiCA', code: 'E76' },
  ]},
  { label: 'Sustainable Finance', icon: '\uD83C\uDF31', color: PASTEL[2], items: [
    { path: '/green-securitisation', label: 'Green Securitisation', badge: 'EU GBS', code: 'E81' },
    { path: '/green-hydrogen', label: 'Green Hydrogen & RFNBO', badge: 'Del. Act', code: 'E98' },
    { path: '/social-bond', label: 'Social Bond & Impact', badge: 'ICMA SBP', code: 'E85' },
    { path: '/sscf', label: 'Sustainable SCF', badge: 'LMA SSCF', code: 'E101' },
    { path: '/sll-slb-v2', label: 'SLL / SLB v2', badge: 'LMA/ICMA', code: 'E115' },
    { path: '/transition-finance', label: 'Transition Finance', badge: 'GFANZ/TPT', code: 'E99' },
    { path: '/adaptation-finance', label: 'Adaptation Finance', badge: 'GARI', code: 'E83' },
    { path: '/just-transition', label: 'Just Transition Finance', badge: 'ILO JTF', code: 'E89' },
  ]},
  { label: 'Biodiversity & Nature', icon: '\uD83C\uDF3F', color: PASTEL[3], items: [
    { path: '/biodiversity-credits', label: 'Biodiversity Credits', badge: 'DEFRA BNG', code: 'E88' },
    { path: '/corporate-nature-strategy', label: 'Corporate Nature Strategy', badge: 'SBTN', code: 'E80' },
    { path: '/nbs-finance', label: 'NbS Finance', badge: 'IUCN NbS', code: 'E94' },
    { path: '/nature-capital-accounting', label: 'Nature Capital Accounting', badge: 'SEEA/TNFD', code: 'E116' },
    { path: '/water-risk', label: 'Water Risk & Stewardship', badge: 'AQUEDUCT', code: 'E92' },
    { path: '/critical-minerals', label: 'Critical Minerals', badge: 'IEA CRM', code: 'E93' },
  ]},
  { label: 'Regulatory & Compliance', icon: '\u2696\uFE0F', color: PASTEL[4], items: [
    { path: '/regulatory-capital', label: 'Regulatory Capital', badge: 'CRR2/Basel IV', code: 'E108' },
    { path: '/double-materiality', label: 'Double Materiality', badge: 'CSRD ESRS 1', code: 'E102' },
    { path: '/sfdr-art9', label: 'SFDR Article 9', badge: 'RTS 2022', code: 'E95' },
    { path: '/regulatory-horizon', label: 'Regulatory Horizon', badge: 'CSRD/DORA', code: 'E117' },
    { path: '/climate-policy', label: 'Climate Policy Tracker', badge: 'NDC/Fit55/IRA', code: 'E109' },
    { path: '/social-taxonomy', label: 'Social Taxonomy & HRDD', badge: 'EU SocTax', code: 'E97' },
    { path: '/export-credit-esg', label: 'Export Credit ESG', badge: 'OECD/EP4', code: 'E110' },
    { path: '/equator-principles', label: 'Equator Principles', badge: 'EP IV', code: 'E147' },
    { path: '/esms', label: 'ESMS Assessment', badge: 'IFC PS1', code: 'E148' },
    { path: '/issb-tcfd', label: 'ISSB S2 / TCFD', badge: 'IFRS S2', code: 'E149' },
    { path: '/eu-taxonomy', label: 'EU Taxonomy', badge: '6 Obj', code: 'E150' },
  ]},
  { label: 'Reporting & Data Quality', icon: '\uD83D\uDCCA', color: PASTEL[5], items: [
    { path: '/climate-financial-statements', label: 'Climate Fin. Statements', badge: 'IFRS S2', code: 'E86' },
    { path: '/comprehensive-reporting', label: 'Comprehensive Reporting', badge: 'Multi-FW', code: 'E119' },
    { path: '/esg-data-quality', label: 'ESG Data Quality', badge: 'BCBS 239', code: 'E105' },
    { path: '/pcaf-india-brsr', label: 'PCAF India BRSR', badge: 'PCAF v2', code: 'E138' },
    { path: '/esg-controversy', label: 'ESG Controversy', badge: 'UNGC/RepRisk', code: 'E111' },
    { path: '/crrem', label: 'CRREM Pathway', badge: 'CRREM/GRESB', code: 'E112' },
    { path: '/loss-damage', label: 'Loss & Damage Finance', badge: 'COP28 L&D', code: 'E113' },
    { path: '/sentiment-analysis', label: 'ESG Sentiment Analysis', badge: 'NLP', code: 'E120' },
  ]},
  { label: 'Governance & Supply Chain', icon: '\u2699\uFE0F', color: PASTEL[6], items: [
    { path: '/ai-governance', label: 'AI Governance & ESG', badge: 'NIST', code: 'E77' },
    { path: '/digital-product-passport', label: 'Digital Product Passport', badge: 'ESPR', code: 'E82' },
    { path: '/forced-labour', label: 'Forced Labour & MSA', badge: 'ILO/UFLPA', code: 'E114' },
    { path: '/sovereign-swf', label: 'Sovereign & SWF ESG', badge: 'IWG-SWF', code: 'E107' },
    { path: '/climate-tech', label: 'Climate Technology', badge: 'IEA NZE', code: 'E118' },
  ]},
  { label: 'Taxonomy & Classification', icon: '📋', color: '#6d28d9', items: [
    { path: '/taxonomy-hub',              label: 'Taxonomy Hub',               badge: 'Hub · EU Tax · SFDR · ISSB · GRI', code: 'EP-Q6' },
    { path: '/eu-taxonomy-engine',        label: 'EU Taxonomy Engine',         badge: '6 Objectives · 18 Activities · TSC', code: 'EP-Q1' },
    { path: '/sfdr-classification',       label: 'SFDR Classification',        badge: 'Art 6/8/8+/9 · 14 PAI',           code: 'EP-Q2' },
    { path: '/issb-materiality',          label: 'ISSB Materiality',           badge: 'SASB · 26 Topics · IFRS S2',       code: 'EP-Q3' },
    { path: '/gri-alignment',             label: 'GRI Alignment',              badge: '26 Standards · 85 Disclosures',    code: 'EP-Q4' },
    { path: '/framework-interop',         label: 'Framework Interoperability', badge: '8 Frameworks · 20 Topics',         code: 'EP-Q5' },
  ]},
  { label: 'Client & Reporting', icon: '📄', color: '#b45309', items: [
    { path: '/reporting-hub',              label: 'Reporting Hub',              badge: 'Hub · 12 Types · 8 Clients · 15 Filings', code: 'EP-R6' },
    { path: '/report-generator',           label: 'Report Generator',           badge: '12 Types · HTML/MD/JSON',              code: 'EP-R1' },
    { path: '/template-manager',           label: 'Template Manager',           badge: '5 Default · Custom · Branding',        code: 'EP-R2' },
    { path: '/client-portal',              label: 'Client Portal',              badge: '8 Clients · SLA · Delivery',           code: 'EP-R3' },
    { path: '/scheduled-reports',          label: 'Scheduled Reports',          badge: 'Auto-Generate · Calendar · SLA',       code: 'EP-R4' },
    { path: '/regulatory-submission',      label: 'Regulatory Submissions',     badge: '15 Filings · 10 Regulators',           code: 'EP-R5' },
  ]},
  { label: 'DME Risk Intelligence', icon: '🏛️', color: '#0c4a6e', items: [
    { path: '/dme-dashboard',     label: 'DME Dashboard',            badge: 'Executive · 8 Modules · Real-Time',   code: 'EP-U8' },
    { path: '/dme-risk-engine',   label: 'DME Risk Engine',          badge: '4-Branch PD · VaR · WACC · IFRS 9',  code: 'EP-U1' },
    { path: '/dme-entity',        label: 'DME Entity Deep-Dive',     badge: 'Full Risk Profile · Scenarios',       code: 'EP-U2' },
    { path: '/dme-scenarios',     label: 'DME NGFS Scenarios',       badge: '6 NGFS · PD/VaR/WACC per Scenario',  code: 'EP-U3' },
    { path: '/dme-alerts',        label: 'DME Alert Center',         badge: '4 Tiers · 5 Pillars · Z-Score',      code: 'EP-U4' },
    { path: '/dme-contagion',     label: 'DME Contagion Network',    badge: 'Interconnection · Propagation',       code: 'EP-U5' },
    { path: '/dme-portfolio',     label: 'DME Portfolio Analytics',  badge: 'DMI · Regime · PCAF · Attribution',   code: 'EP-U6' },
    { path: '/dme-competitive',   label: 'DME Competitive Intel',    badge: 'Peer Benchmarking · 5 Dimensions',    code: 'EP-U7' },
  ]},
  { label: 'Impact & SDG Finance', icon: '💰', color: '#047857', items: [
    { path: '/impact-hub',                label: 'Impact Hub',               badge: 'Hub · IWA · IRIS+ · SDG · Blended',     code: 'EP-X6' },
    { path: '/impact-weighted-accounts',  label: 'Impact-Weighted Accounts', badge: 'Harvard IWA · SCC $51/t · 14 Dimensions', code: 'EP-X1' },
    { path: '/iris-metrics',              label: 'IRIS+ Metrics',            badge: 'GIIN · 40 Metrics · 5 Dimensions',       code: 'EP-X2' },
    { path: '/sdg-bond-impact',           label: 'SDG Bond Impact',          badge: '7 Categories · 25 Metrics · ICMA',       code: 'EP-X3' },
    { path: '/blended-finance',           label: 'Blended Finance',          badge: '6 Instruments · Capital Stack · Leverage', code: 'EP-X4' },
    { path: '/impact-verification',       label: 'Impact Verification',      badge: 'IMP · Evidence Tiers · Impact Washing',  code: 'EP-X5' },
  ]},
  { label: 'AI & NLP Analytics', icon: '🤖', color: '#0891b2', items: [
    { path: '/ai-hub',                  label: 'AI Analytics Hub',          badge: 'Hub · NLP · ML · Anomaly · Clustering',  code: 'EP-W6' },
    { path: '/esg-report-parser',       label: 'ESG Report Parser',        badge: 'NLP · TF-IDF · Entity Extraction',       code: 'EP-W1' },
    { path: '/predictive-esg',          label: 'Predictive ESG Model',     badge: '3 Models · Regression · KNN · R²',       code: 'EP-W2' },
    { path: '/anomaly-detection',       label: 'Anomaly Detection',        badge: 'Z-Score · IQR · Isolation · 10 Fields',  code: 'EP-W3' },
    { path: '/ai-engagement',           label: 'AI Engagement Advisor',    badge: '20 Rules · Priority · Templates',        code: 'EP-W4' },
    { path: '/document-similarity',     label: 'Document Similarity',      badge: 'Cosine · K-Means · Boilerplate',         code: 'EP-W5' },
  ]},
  { label: 'Commodity Lifecycle Intelligence', icon: '🌾', color: '#78350f', items: [
    { path: '/commodity-hub',              label: 'Commodity Hub',              badge: 'Hub · 50 Commodities · Finance×ESG×Climate', code: 'EP-Y8' },
    { path: '/commodity-intelligence',     label: 'Commodity Markets',          badge: '50 Commodities · EODHD · Carbon · Energy',   code: 'EP-Y1' },
    { path: '/commodity-inventory',        label: 'Global Inventory',           badge: 'Country→Source · Supply Chain · 20 Chains',   code: 'EP-Y2' },
    { path: '/lifecycle-assessment',       label: 'Lifecycle Assessment',       badge: 'ISO 14040 · 6 Stages · 8 Impact Categories', code: 'EP-Y3' },
    { path: '/financial-flow',             label: 'Financial Flow',             badge: 'Price→Retail→Scrap · True Cost · Externalities', code: 'EP-Y4' },
    { path: '/esg-value-chain',            label: 'ESG Value Chain',            badge: '25 Chains · 40+ Countries · 15 Certs · ML RF-10', code: 'EP-Y5' },
    { path: '/climate-nature-repo',        label: 'Climate & Nature Repo',      badge: '25 Commodities · 12 Boundaries · 30 Water Regions · BII', code: 'EP-Y6' },
    { path: '/multi-factor-integration',   label: 'Multi-Factor Integration',   badge: '25 Commodities · ML Ensemble · PCA · K-Means · Regulatory', code: 'EP-Y7' },
    { path: '/product-anatomy',            label: 'Product Anatomy',            badge: '30 Products · ESG Score · Sustainable Alts',  code: 'EP-Y9' },
    { path: '/epd-lca-database',           label: 'EPD & LCA Database',         badge: '6 Sources · 50+ EPDs · ISO 14025',           code: 'EP-Y10' },
  ]},
  { label: 'Consumer Carbon Intelligence', icon: '🌱', color: '#065f46', items: [
    { path: '/consumer-carbon-hub',        label: 'Carbon Hub',               badge: 'Hub · Calculator · Wallet · Economy',     code: 'EP-Z6' },
    { path: '/carbon-calculator',          label: 'Carbon Calculator',        badge: '200+ Products · Compare · Budget',        code: 'EP-Z1' },
    { path: '/carbon-wallet',              label: 'Carbon Wallet',            badge: 'Track · Budget · Achievements',           code: 'EP-Z2' },
    { path: '/invoice-parser',             label: 'Invoice Parser',           badge: 'Receipt → Carbon · 50+ Keywords',         code: 'EP-Z3' },
    { path: '/spending-carbon',            label: 'Spending Analyzer',        badge: 'Patterns · Transitions · Forecast',       code: 'EP-Z4' },
    { path: '/carbon-economy',             label: 'Carbon Economy',           badge: 'Price Tags · Currency · Country',         code: 'EP-Z5' },
  ]},
  { label: 'Corporate Decarbonisation & SBTi', icon: '🌿', color: '#059669', items: [
    { path: '/decarbonisation-hub',           label: 'Decarbonisation Hub',            badge: 'Hub · SBTi+RE100+EV100 · 1.9°C · $840M NPV · Board Pack',   code: 'EP-AI6' },
    { path: '/sbti-target-setter',            label: 'SBTi Target Setter',             badge: 'ACA/SDA/TRM · 20 Cos · 1.8°C · 67% Scope 3 Coverage',        code: 'EP-AI1' },
    { path: '/decarbonisation-roadmap',       label: 'Decarbonisation Roadmap Builder',badge: '25 Measures · $2.4bn CapEx · -46% S1+2 · 2048 Net-Zero',      code: 'EP-AI2' },
    { path: '/abatement-cost-curve',          label: 'Abatement Cost Curve Builder',   badge: 'MACC · 30 Measures · 38 GtCO2e · $130/t Viable · 8 Sectors', code: 'EP-AI3' },
    { path: '/energy-transition-analytics',   label: 'Energy Transition Analytics',    badge: 'RE100 · 58% Renewable · 2,840 MW PPA · EV100 · EP100',        code: 'EP-AI4' },
    { path: '/carbon-reduction-projects',     label: 'Carbon Reduction Projects',      badge: '24 Projects · 847 ktCO2e/yr · $1.84bn · $54/tCO2e Avg',      code: 'EP-AI5' },
  ]},
  { label: 'Financed Emissions & Climate Banking', icon: '🏦', color: '#0c4a6e', items: [
    { path: '/climate-banking-hub',          label: 'Climate Banking Hub',           badge: 'Hub · PCAF · GAR · Stress Test · Board Dashboard · NZBA',      code: 'EP-AJ6' },
    { path: '/pcaf-financed-emissions',      label: 'PCAF Financed Emissions',       badge: 'PCAF v2 · 5 Asset Classes · DQS · 847 ktCO2e · WACI 312',     code: 'EP-AJ1' },
    { path: '/climate-stress-test',          label: 'Climate Stress Test',           badge: 'NGFS IV · ECB/BoE · PD Migration · CET1 -2.8% · Delayed',      code: 'EP-AJ2' },
    { path: '/green-asset-ratio',            label: 'Green Asset Ratio',             badge: 'EU Taxonomy · GAR 7.3% · €85.4bn · CCM 4.8bn · DNSH',         code: 'EP-AJ3' },
    { path: '/portfolio-temperature-score',  label: 'Portfolio Temperature Score',   badge: 'PACTA · 2.7°C · 50 Holdings · SBTi Engagement · Sectors',      code: 'EP-AJ4' },
    { path: '/climate-credit-risk-analytics',label: 'Climate Credit Risk Analytics', badge: 'IFRS 9 Overlay · Physical+Transition · £438M ECL · EPC D-G',   code: 'EP-AJ5' },
  ]},
  { label: 'Platform Administration', icon: '⚙️', color: '#475569', items: [
    { path: '/data-source-manager',       label: 'Data Source Manager',       badge: '47 Sources · EODHD+AV · Field Mapper · Engine Lineage · Sync',       code: 'ADM-01' },
    { path: '/db-explorer',               label: 'DB Explorer & SQL',         badge: '40+ Tables · SQL Editor · Lineage · Migration Tracker',               code: 'ADM-02' },
    { path: '/user-role-management',      label: 'Users & Roles',             badge: '50 Users · 8 Roles · Permission Matrix · Teams · MFA · SSO',          code: 'ADM-03' },
    { path: '/audit-trail-viewer',        label: 'Audit Trail',               badge: '500 Events · Calculation Audit · ISAE 3000 · SOC 2 · GDPR',          code: 'ADM-04' },
    { path: '/api-gateway-monitor',       label: 'API Gateway',               badge: '2302 Endpoints · Traffic · Rate Limits · Swagger · Webhooks',         code: 'ADM-05' },
    { path: '/data-quality-dashboard',    label: 'Data Quality',              badge: 'Quality Scores · Completeness · Freshness · 50 Validation Rules',     code: 'ADM-06' },
    { path: '/calculation-engine-monitor',label: 'Engine Monitor',            badge: '30 Engines · Execution History · Shadow Model · Config · Drift',      code: 'ADM-07' },
    { path: '/platform-settings',         label: 'Platform Settings',         badge: 'Theme · Integrations · Feature Flags · System Health',                code: 'ADM-08' },
  ]},
  { label: 'Geopolitical Risk & Climate Security', icon: '🌐', color: '#7f1d1d', items: [
    { path: '/geopolitical-esg-hub',          label: 'Geopolitical ESG Hub',          badge: 'Hub · Sanctions+Energy+Minerals+Trade+Migration · Scenarios',       code: 'EP-AV6' },
    { path: '/sanctions-climate-finance',     label: 'Sanctions & Climate Finance',   badge: 'OFAC/EU/UK · 60 Countries · Dual-Use Tech · Compliance',            code: 'EP-AV1' },
    { path: '/energy-security-transition',    label: 'Energy Security & Transition',  badge: '50 Countries · Import Dependency · Chokepoints · LNG',              code: 'EP-AV2' },
    { path: '/critical-mineral-geopolitics',  label: 'Critical Mineral Geopolitics',  badge: '15 Minerals · Friendshoring · China Dominance · IRA/CRMA',          code: 'EP-AV3' },
    { path: '/trade-carbon-policy',           label: 'Trade & Carbon Border Policy',  badge: 'EU CBAM · UK CBAM · Carbon Club · Embedded Emissions',              code: 'EP-AV4' },
    { path: '/climate-migration-risk',        label: 'Climate Migration Risk',        badge: '50 Countries · 216M by 2050 · Displacement · Stranded RE',          code: 'EP-AV5' },
  ]},
  { label: 'Climate & Health Nexus', icon: '🏥', color: '#0d9488', items: [
    { path: '/climate-health-hub',           label: 'Climate Health Hub',           badge: 'Hub · Heat+Air+Pandemic+Adapt+Worker · CRM · Board',                code: 'EP-AU6' },
    { path: '/heat-mortality-risk',          label: 'Heat Mortality Risk',          badge: '60 Cities · RCP · Wet-Bulb · Labour · UHI · Cooling',               code: 'EP-AU1' },
    { path: '/air-quality-finance',          label: 'Air Quality Finance',          badge: '50 Cities · PM2.5 · WHO · 80 Cos · Health Costs · Clean Air',       code: 'EP-AU2' },
    { path: '/pandemic-climate-nexus',       label: 'Pandemic-Climate Nexus',       badge: '40 Countries · Zoonotic · Vector-Borne · GHS · One Health',         code: 'EP-AU3' },
    { path: '/health-adaptation-finance',    label: 'Health Adaptation Finance',    badge: '30 Countries · WHO Gap · Early Warning · Health Bonds',              code: 'EP-AU4' },
    { path: '/worker-heat-stress',           label: 'Worker Heat Stress',           badge: '100 Cos · WBGT · ILO/OSHA · Productivity · Litigation',             code: 'EP-AU5' },
  ]},
  { label: 'Food Systems & Agricultural Finance', icon: '🌾', color: '#15803d', items: [
    { path: '/agri-finance-hub',             label: 'Agri Finance Hub',             badge: 'Hub · Regen+Food+Water+Land+Biodiversity · CRM · Board',            code: 'EP-AT6' },
    { path: '/regenerative-agriculture',     label: 'Regenerative Agriculture',     badge: '80 Ops · Soil Carbon · No-Till · Cover Crop · Credit Revenue',      code: 'EP-AT1' },
    { path: '/food-supply-chain-emissions',  label: 'Food Supply Chain Emissions',  badge: '60 Cos · Protein Transition · Food Waste · SBTi FLAG',              code: 'EP-AT2' },
    { path: '/water-agriculture-risk',       label: 'Water Agriculture Risk',       badge: '50 Regions · Aqueduct · Crop Footprint · Drought Model',            code: 'EP-AT3' },
    { path: '/land-use-carbon',              label: 'Land Use & Carbon',            badge: '40 Parcels · 8 Land Types · LULUCF · NBS · Carbon Credits',         code: 'EP-AT4' },
    { path: '/agri-biodiversity',            label: 'Agricultural Biodiversity',    badge: '60 Ops · Pollinators · Soil Microbiome · Biodiversity Credits',     code: 'EP-AT5' },
  ]},
  { label: 'Real Estate & Built Environment', icon: '🏢', color: '#7c3aed', items: [
    { path: '/real-estate-esg-hub',          label: 'Real Estate ESG Hub',          badge: 'Hub · 150 Buildings · GRESB · CRREM · Capex · Board',               code: 'EP-AS6' },
    { path: '/building-energy-performance',  label: 'Building Energy Performance',  badge: '150 Buildings · EPC A-G · CRREM · Retrofit ROI · MEES',             code: 'EP-AS1' },
    { path: '/green-building-certification', label: 'Green Building Certification', badge: '100 Buildings · LEED/BREEAM/WELL · Green Premium · Planner',        code: 'EP-AS2' },
    { path: '/embodied-carbon',              label: 'Embodied Carbon',              badge: '80 Projects · A1-D Lifecycle · 30 Materials · RIBA 2030',           code: 'EP-AS3' },
    { path: '/climate-resilient-design',     label: 'Climate Resilient Design',     badge: '100 Buildings · 6 Hazards · Adaptation · Insurance Impact',         code: 'EP-AS4' },
    { path: '/tenant-engagement-esg',        label: 'Tenant Engagement ESG',        badge: '80 Tenants · Green Leases · Scope 3 Downstream · CRM',             code: 'EP-AS5' },
    { path: '/residential-re-assessment',   label: 'Residential RE Assessment',    badge: '60 Properties · EPC A-G · Flood Zone · Stranded · Mortgage Stress', code: 'EP-BC1' },
  ]},
  { label: 'Insurance & Underwriting Climate', icon: '🛡️', color: '#9f1239', items: [
    { path: '/insurance-climate-hub',        label: 'Insurance Climate Hub',        badge: 'Hub · Cat Model+Underwriting+Parametric+Re · Board',                code: 'EP-AR6' },
    { path: '/catastrophe-modelling',        label: 'Catastrophe Modelling',        badge: '100 Assets · 8 Perils · AAL/PML · Event Scenarios · Reinsurance',   code: 'EP-AR1' },
    { path: '/underwriting-esg',             label: 'Underwriting ESG',             badge: '80 Policies · ESG Risk Scoring · Fossil Phase-Out · Solvency II',   code: 'EP-AR2' },
    { path: '/parametric-insurance',         label: 'Parametric Insurance',         badge: '60 Products · 6 Triggers · Basis Risk · CCRIF/ARC',                 code: 'EP-AR3' },
    { path: '/reinsurance-climate',          label: 'Reinsurance & Climate',        badge: '40 Treaties · 30 Cat Bonds · ILS · Climate Pricing',                code: 'EP-AR4' },
    { path: '/insurance-transition',         label: 'Insurance Transition',         badge: '50 Insurers · NZIA · Fossil Exposure · Green Products',             code: 'EP-AR5' },
  ]},
  { label: 'Sovereign ESG & Country Risk', icon: '🌍', color: '#1e40af', items: [
    { path: '/sovereign-esg-hub',              label: 'Sovereign ESG Hub',              badge: 'Hub · 80 Countries · Climate+Debt+CB+Nature+Social · Board',        code: 'EP-AQ6' },
    { path: '/sovereign-climate-risk',         label: 'Sovereign Climate Risk',         badge: '80 Countries · 8 Hazards · ND-GAIN · Credit Impact · NGFS',         code: 'EP-AQ1' },
    { path: '/sovereign-debt-sustainability',  label: 'Sovereign Debt Sustainability',  badge: '60 Countries · Climate DSA · 4 Scenarios · Fiscal Costs',           code: 'EP-AQ2' },
    { path: '/central-bank-climate',           label: 'Central Bank Climate',           badge: '40 CBs · NGFS · Stress Tests · Green QE · Reserves',                code: 'EP-AQ3' },
    { path: '/sovereign-nature-risk',          label: 'Sovereign Nature Risk',          badge: '60 Countries · 6 Ecosystems · GBF · TNFD · Biodiversity',           code: 'EP-AQ4' },
    { path: '/sovereign-social-index',         label: 'Sovereign Social Index',         badge: '80 Countries · 8 Dimensions · HDI · SDG · Social Yield',            code: 'EP-AQ5' },
  ]},
  { label: 'Supply Chain ESG & Scope 3', icon: '🔗', color: '#4a1d96', items: [
    { path: '/supply-chain-esg-hub',       label: 'Supply Chain ESG Hub',       badge: 'Hub · Scope3+Suppliers+EUDR+Minerals+Resilience · Board',          code: 'EP-AP6' },
    { path: '/scope3-upstream-tracker',    label: 'Scope 3 Upstream Tracker',   badge: 'GHG Cat 1-8 · 120 Cos · 200 Suppliers · Spend/Activity/Specific', code: 'EP-AP1' },
    { path: '/supplier-engagement',        label: 'Supplier Engagement',        badge: 'CRM · 150 Suppliers · 6-Dim ESG · Corrective Actions · CDP',      code: 'EP-AP2' },
    { path: '/commodity-deforestation',    label: 'Commodity Deforestation',    badge: 'EUDR · 7 Commodities · 100 Cos · 15 Certifications · Satellite',  code: 'EP-AP3' },
    { path: '/conflict-minerals',          label: 'Conflict Minerals',          badge: 'CRMA · 12 Minerals · OECD DD · 40 Smelters · RMAP · Recycling',   code: 'EP-AP4' },
    { path: '/supply-chain-resilience',    label: 'Supply Chain Resilience',    badge: '100 Nodes · 8 Hazards · Disruption Model · Adaptation ROI',       code: 'EP-AP5' },
  ]},
  { label: 'Avoided Emissions & Climate Solutions', icon: '💚', color: '#065f46', items: [
    { path: '/avoided-emissions-hub',        label: 'Avoided Emissions Hub',        badge: 'Hub · Scope 4 · Handprint · Enablement · Taxonomy · Board',      code: 'EP-AO6' },
    { path: '/scope4-avoided-emissions',     label: 'Scope 4 Avoided Emissions',    badge: '120 Cos · 10 Categories · WRI/ICF · Credibility · Calculator',    code: 'EP-AO1' },
    { path: '/product-carbon-handprint',     label: 'Product Carbon Handprint',     badge: '80 Products · ISO 14067 · 6 Lifecycle Stages · Benchmarks',       code: 'EP-AO2' },
    { path: '/enablement-methodology',       label: 'Enablement Methodology',       badge: '100 Products · PCAF Part C · Additionality · Portfolio',           code: 'EP-AO3' },
    { path: '/avoided-emissions-portfolio',  label: 'Avoided Emissions Portfolio',  badge: '150 Holdings · Net Impact · Solution Exposure · Attribution',      code: 'EP-AO4' },
    { path: '/climate-solution-taxonomy',    label: 'Climate Solution Taxonomy',    badge: '150 Cos · EU/CBI/FTSE · 12 Categories · Screening',               code: 'EP-AO5' },
  ]},
  { label: 'Sustainable Transport & Logistics', icon: '🚢', color: '#1e3a5f', items: [
    { path: '/sustainable-transport-hub',    label: 'Sustainable Transport Hub',    badge: 'Hub · Maritime+Aviation+EV+SAF · 200 Assets · CRM · Board',     code: 'EP-AN6' },
    { path: '/maritime-imo-compliance',      label: 'Maritime IMO Compliance',      badge: '150 Vessels · CII A-E · EEXI · Poseidon · 10 Fuels · FuelEU',   code: 'EP-AN1' },
    { path: '/aviation-corsia',              label: 'Aviation CORSIA',             badge: '120 Airlines · CORSIA Phases · Fleet Renewal · EU ETS Aviation',  code: 'EP-AN2' },
    { path: '/ev-fleet-finance',             label: 'EV Fleet Finance',            badge: '90 Operators · TCO · 40 Charging Sites · Battery Economics',      code: 'EP-AN3' },
    { path: '/sustainable-aviation-fuel',    label: 'Sustainable Aviation Fuel',   badge: '60 Producers · 8 Pathways · ReFuelEU · 30 Offtakes · CORSIA',    code: 'EP-AN4' },
    { path: '/transport-decarbonisation',    label: 'Transport Decarbonisation',   badge: '100 Cos · 50 Routes · Modal Shift · GLEC · 8 Levers',            code: 'EP-AN5' },
  ]},
  { label: 'Climate Fintech & Digital MRV', icon: '📡', color: '#7c2d12', items: [
    { path: '/climate-fintech-hub',          label: 'Climate Fintech Hub',          badge: 'Hub · MRV+Satellite+Blockchain+IoT · Tech Landscape · Board',    code: 'EP-AM6' },
    { path: '/digital-mrv',                  label: 'Digital MRV Platform',         badge: '80 Projects · Satellite+IoT+AI · Verification Certificates',     code: 'EP-AM1' },
    { path: '/satellite-climate-monitor',    label: 'Satellite Climate Monitor',    badge: '100 Assets · Methane · Deforestation · EUDR · Discrepancy',      code: 'EP-AM2' },
    { path: '/blockchain-carbon-registry',   label: 'Blockchain Carbon Registry',   badge: '200 Credits · Verra/GS/ACR/CAR · Tokenization · Integrity',      code: 'EP-AM3' },
    { path: '/climate-data-marketplace',     label: 'Climate Data Marketplace',     badge: '60 Providers · Quality Radar · Coverage Gap · Stack Builder',     code: 'EP-AM4' },
    { path: '/iot-emissions-tracker',        label: 'IoT Emissions Tracker',        badge: '60 Facilities · 200 Sensors · Anomaly Detection · Compliance',   code: 'EP-AM5' },
  ]},
  { label: 'Sovereign & Country Climate Risk', icon: '🌐', color: '#1e3a5f', items: [
    { path: '/sovereign-esg-hub',         label: 'Sovereign ESG Hub',           badge: 'Hub · 60 Countries · ESG+Physical+NDC+Debt · Board Pack',       code: 'EP-AX6' },
    { path: '/sovereign-esg-scorer',      label: 'Sovereign ESG Scorer',        badge: '60 Countries · E/S/G Pillars · 6 Providers · AAA–CCC Ratings',  code: 'EP-AX1' },
    { path: '/ndc-alignment-tracker',     label: 'NDC Alignment Tracker',       badge: '80 Countries · Paris 1.5°C/2°C · Sectoral · Financing Gap',     code: 'EP-AX2' },
    { path: '/sovereign-physical-risk',   label: 'Sovereign Physical Risk',     badge: '70 Countries · Flood/Drought/Heat · GDP@Risk · NGFS Scenarios', code: 'EP-AX3' },
    { path: '/em-debt-climate-risk',      label: 'EM Debt & Climate Risk',      badge: '50 EMs · Green Bonds · Debt-for-Nature · Credit Spreads',       code: 'EP-AX4' },
    { path: '/mdb-climate-finance',       label: 'MDB Climate Finance',         badge: '8 MDBs · $120B Flows · Mobilisation · Project Pipeline',        code: 'EP-AX5' },
    { path: '/sovereign-climate-risk',    label: 'Sovereign Climate Risk',      badge: 'Country Risk · Policy · Physical · Transition · Fiscal Impact',  code: 'EP-AQ2' },
    { path: '/sovereign-debt-sustainability', label: 'Sovereign Debt Sustainability', badge: 'Climate-Adj Fiscal · Debt Distress · DSA Scenarios',       code: 'EP-AQ3' },
  ]},
  { label: 'Transition Planning & Net Zero', icon: '🧭', color: '#0e7490', items: [
    { path: '/transition-planning-hub',       label: 'Transition Planning Hub',       badge: 'Hub · TPT+GFANZ+ACT+NZAM · Credibility · Board Pack',          code: 'EP-AL6' },
    { path: '/transition-plan-builder',       label: 'Transition Plan Builder',       badge: 'TPT Framework · 5 Elements · 10 Sectors · Readiness Score',     code: 'EP-AL1' },
    { path: '/gfanz-sector-pathways',         label: 'GFANZ Sector Pathways',        badge: 'GFANZ · IEA NZE · 8 Sectors · Milestones · Gap Analysis',       code: 'EP-AL2' },
    { path: '/act-assessment',                label: 'ACT Assessment & Maturity',    badge: 'ACT/CDP · 6 Dimensions · 15 Sectors · A-E Grades · Credibility',code: 'EP-AL3' },
    { path: '/net-zero-commitment-tracker',   label: 'Net Zero Commitment Tracker',  badge: 'NZAM 315 · NZAOA 88 · NZBA 144 · $128T · Progress Monitor',    code: 'EP-AL4' },
    { path: '/transition-credibility',        label: 'Transition Credibility Engine', badge: 'CA100+ · CapEx Alignment · Lobbying · 12 KPIs · Say-Do Gap',   code: 'EP-AL5' },
  ]},
  { label: 'ESG Ratings Intelligence', icon: '⭐', color: '#b45309', items: [
    { path: '/esg-ratings-hub',             label: 'ESG Ratings Hub',              badge: 'Hub · 6 Providers · Consensus · Coverage · Alert Engine',        code: 'EP-AK6' },
    { path: '/esg-ratings-comparator',      label: 'ESG Ratings Comparator',       badge: 'MSCI/Sust/ISS/CDP/S&P/BBG · Divergence · Correlation',           code: 'EP-AK1' },
    { path: '/ratings-methodology-decoder', label: 'Ratings Methodology Decoder',  badge: 'Pillar Weights · Materiality Maps · 200+ KPIs · What-If',        code: 'EP-AK2' },
    { path: '/ratings-migration-momentum',  label: 'Ratings Migration & Momentum', badge: 'Upgrade/Downgrade · Lead-Lag · Alpha Signals · Backtest',         code: 'EP-AK3' },
    { path: '/controversy-rating-impact',   label: 'Controversy-Rating Impact',    badge: 'RepRisk · Severity-to-Score · Recovery Curves · Prediction',      code: 'EP-AK4' },
    { path: '/greenwashing-detector',       label: 'Greenwashing & Integrity',     badge: 'Disclosure Gap · Self-Report Bias · Red Flags · EU Reg 2024',     code: 'EP-AK5' },
  ]},
  { label: 'Regulatory Reporting & Disclosure', icon: '📋', color: '#7c3aed', items: [
    { path: '/disclosure-hub',        label: 'Disclosure Hub',               badge: 'Hub · CSRD+SFDR+ISSB+SEC+UK · Audit Trail · Cross-Framework', code: 'EP-AH6' },
    { path: '/csrd-esrs-automation',  label: 'CSRD / ESRS Automation',       badge: 'ESRS 2025 · iXBRL · 50k Cos · Double Materiality · Gap',      code: 'EP-AH1' },
    { path: '/sfdr-v2-reporting',     label: 'SFDR v2 Reporting Engine',     badge: 'Art 6/8/9 · 18 PAIs · v2 Reform · RTS · Fund Classifier',     code: 'EP-AH2' },
    { path: '/issb-disclosure',       label: 'ISSB / IFRS S1-S2 Disclosure', badge: 'IFRS S1/S2 · 20+ Jurisdictions · TCFD Superseded · Metrics',  code: 'EP-AH3' },
    { path: '/uk-sdr',                label: 'UK SDR Labelling Engine',       badge: 'FCA 4 Labels · Anti-Greenwash · KPIs · SDR Compliance',        code: 'EP-AH4' },
    { path: '/sec-climate-rule',      label: 'SEC Climate Rule Compliance',  badge: 'Reg S-K/S-X · March 2024 · Scopes · Financial Impact',         code: 'EP-AH5' },
    { path: '/eudr-engine',                  label: 'EUDR Due Diligence Engine',        badge: 'Reg 2023/1115 · 7 Commodities · 80 Suppliers · DDS · Art 29',  code: 'EP-AY1' },
    { path: '/csddd-engine',                 label: 'CSDDD Due Diligence Engine',       badge: 'Dir 2024/1760 · Art 6-11 · Value Chain · Art 22 · Art 29',    code: 'EP-AY2' },
    { path: '/double-materiality-workshop',  label: 'Double Materiality Workshop',      badge: 'ESRS 1 · 10 Topics · IRO Registry · Matrix · EFRAG IG 1',     code: 'EP-AZ1' },
    { path: '/sfdr-pai-dashboard',           label: 'SFDR PAI Dashboard',               badge: '18 Mandatory PAIs · Art 6/8/9 · Annex I RTS · 8 Funds',       code: 'EP-AZ2' },
    { path: '/xbrl-export-wizard',           label: 'XBRL Export Wizard',               badge: 'iXBRL · EFRAG ESRS 2024 · ESEF · ESMA Validation · Filing',    code: 'EP-AZ3' },
    { path: '/xbrl-ingestion',               label: 'XBRL Ingestion & Filing Import',   badge: '30 Filings · EFRAG ESRS 2024 · 12 Validation Rules · Pipeline', code: 'EP-BC2' },
    { path: '/sovereign-climate-intelligence',label: 'Sovereign Climate Intelligence', badge: 'ND-GAIN · NGFS Scenarios · Spread Impact · 25 Sovereigns',   code: 'EP-BA1' },
    { path: '/sec-climate-disclosure',        label: 'SEC Climate Disclosure Panel',   badge: 'RESCINDED 27-Mar-25 · Items 1500-1505 · TCFD · ISSB S2',    code: 'EP-BA2' },
  ]},
  { label: 'Private Markets ESG', icon: '🏢', color: '#0369a1', items: [
    { path: '/private-markets-esg-hub', label: 'Private Markets ESG Hub',    badge: 'Hub · PE+Credit+Infra+RE+VC · $8.4T AUM · ESG DD',        code: 'EP-AG6' },
    { path: '/pe-esg-diligence',      label: 'Private Equity ESG Diligence', badge: 'ILPA ESG · 24 GPs · DD Questionnaire · Red Flag Engine',   code: 'EP-AG1' },
    { path: '/private-credit-climate',label: 'Private Credit Climate Risk',  badge: 'Direct Lending · $1.7T · EBA DD · CLO Tranche Risk',       code: 'EP-AG2' },
    { path: '/infrastructure-esg',    label: 'Infrastructure ESG Rating',    badge: 'GRESB Infra · IFC PS 1-8 · Social Licence · $15T Gap',     code: 'EP-AG3' },
    { path: '/real-assets-climate',   label: 'Real Assets Climate Valuation',badge: 'CRREM+ · Physical Risk NOI · Stranded 2034 · $180bn',      code: 'EP-AG4' },
    { path: '/vc-impact',             label: 'Venture Capital Impact Tracker',badge: 'Climate Tech · IMP 5D · $500bn VC · 248 MtCO2e/yr',       code: 'EP-AG5' },
  ]},
  { label: 'Quant ESG & Portfolio', icon: '📊', color: '#b45309', items: [
    { path: '/quant-esg-hub',              label: 'Quant ESG Hub',              badge: '5 Strategies · $2.8T AUM · +312bps Alpha · Live Monitor',  code: 'EP-AF6' },
    { path: '/esg-portfolio-optimizer',    label: 'ESG Portfolio Optimizer',    badge: 'MVO · ESG Constraints · 24 Holdings · Efficient Frontier', code: 'EP-AF1' },
    { path: '/carbon-aware-allocation',    label: 'Carbon-Aware Allocation',    badge: 'NGFS IV · Carbon Budget · Sector Tilt · Paris Pathway',    code: 'EP-AF2' },
    { path: '/esg-momentum-scanner',       label: 'ESG Momentum Scanner',       badge: 'Improvers · 847 Signals · Controversy Recovery · Rotation', code: 'EP-AF3' },
    { path: '/net-zero-portfolio-builder', label: 'Net Zero Portfolio Builder', badge: 'SBTi · PAII · NZBA · 1.8°C Rating · Paris-Aligned',        code: 'EP-AF4' },
    { path: '/esg-factor-alpha',           label: 'ESG Factor Alpha Engine',    badge: '10 Factors · +187bps Alpha · IC 0.09 · Barra-Style',       code: 'EP-AF5' },
    { path: '/greenium-signal',            label: 'Greenium Alpha Signal Engine',badge: '5-Model Ensemble · BUY/SELL · 40 Instruments · 52w Backtest', code: 'EP-BD1' },
  ]},
  { label: 'Corporate Governance', icon: '🏛️', color: '#6366f1', items: [
    { path: '/board-composition',          label: 'Board Composition & Effectiveness', badge: '34% Female · 78% Indep · Skills Matrix · Tenure',       code: 'EP-AE1' },
    { path: '/executive-pay-analytics',    label: 'Executive Pay Analytics',           badge: 'CEO Ratio 324x · ESG Pay 68% · Say-on-Pay · LTIP',     code: 'EP-AE2' },
    { path: '/shareholder-activism',       label: 'Shareholder Activism & Engagement', badge: '847 Campaigns · Engine No.1 · ESG Resolutions · 43%',   code: 'EP-AE3' },
    { path: '/anti-corruption',            label: 'Anti-Corruption & Bribery Intel',   badge: 'CPI 43/100 · FCPA $2.8bn · ISO 37001 · Sapin II',       code: 'EP-AE4' },
    { path: '/proxy-voting-intel',         label: 'Proxy Voting & Stewardship',        badge: '21,000 Meetings · ISS · Glass Lewis · PRI Blueprint',   code: 'EP-AE5' },
    { path: '/diversity-equity-inclusion', label: 'Diversity, Equity & Inclusion',     badge: '29% Women Leaders · Pay Gap · CEI · Parker Review',     code: 'EP-AE6' },
  ]},
  { label: 'Social & Just Transition', icon: '🤝', color: '#f97316', items: [
    { path: '/just-transition-finance',  label: 'Just Transition Finance',        badge: '$2.4T Need · 45 Funds · 800M Workers · ILO Guidelines',  code: 'EP-AD1' },
    { path: '/human-rights-risk',        label: 'Human Rights & Supply Chain',    badge: '40.3M Modern Slaves · CSDDD · UNGPs · LkSG',             code: 'EP-AD2' },
    { path: '/living-wage-tracker',      label: 'Living Wage & Labour Standards', badge: 'Anker Benchmark · 67 Countries · Pay Transparency 2026',  code: 'EP-AD3' },
    { path: '/modern-slavery-intel',     label: 'Modern Slavery Intelligence',    badge: '$236bn Profit · UFLPA · Walk Free · 11 ILO Indicators',   code: 'EP-AD4' },
    { path: '/community-impact',         label: 'Community Impact & Social Value',badge: 'SROI 3.2x · FPIC · $780bn Spend · B Impact',              code: 'EP-AD5' },
    { path: '/workplace-health-safety',  label: 'Workplace Health & Safety',      badge: '2.78M Deaths/yr · TRIR · ISO 45001 · Mental Health',      code: 'EP-AD6' },
  ]},
  { label: 'Nature & Physical Risk', icon: '🌿', color: '#16a34a', items: [
    { path: '/nature-loss-risk',        label: 'Nature & Biodiversity Risk',    badge: '847 Species · $44T GDP · TNFD LEAP · LEAP Framework',   code: 'EP-AC1' },
    { path: '/water-risk-analytics',    label: 'Water Risk & Scarcity',         badge: '3.6B Stressed · 10 Basins · Aqueduct · CDP Water',      code: 'EP-AC2' },
    { path: '/land-use-deforestation',  label: 'Land Use & Deforestation',      badge: 'EUDR 2025 · 7 Commodities · 4.7M Ha Lost · REDD+',      code: 'EP-AC3' },
    { path: '/ocean-marine-risk',       label: 'Ocean & Marine Risk',           badge: '$2.5T Blue Economy · Coral · BBNJ · 8 Chokepoints',     code: 'EP-AC4' },
    { path: '/circular-economy-tracker',label: 'Circular Economy & Waste',      badge: '9.7% Circularity · UN Plastics Treaty · CSRD KPIs',     code: 'EP-AC5' },
    { path: '/air-quality-health-risk', label: 'Air Quality & Health Risk',     badge: '7M Deaths/yr · PM2.5 · WHO AQG · $8.1T Cost',           code: 'EP-AC6' },
  ]},
  { label: 'Macro & Systemic Risk', icon: '🌐', color: '#7c3aed', items: [
    { path: '/systemic-esg-risk',            label: 'Systemic ESG Risk',            badge: '10 SIFIs · $47.2T AUM · Network · Fragility Index',  code: 'EP-AB1' },
    { path: '/climate-policy-intelligence',  label: 'Climate Policy Intelligence',  badge: '73 Carbon Instruments · NDC · Political Risk',        code: 'EP-AB2' },
    { path: '/green-central-banking',        label: 'Green Central Banking',        badge: 'NGFS Phase IV · €344bn Green QE · Capital Add-ons',   code: 'EP-AB3' },
    { path: '/esg-factor-attribution',       label: 'ESG Factor Attribution',       badge: '8 Factors · +187bps Alpha · Barra-Style · Crowding',  code: 'EP-AB4' },
    { path: '/transition-scenario-modeller', label: 'Transition Scenario Modeller', badge: '5 Pathways · Sector CapEx · Stranded Assets · 2050',  code: 'EP-AB5' },
    { path: '/cross-asset-contagion',        label: 'Cross-Asset Contagion',        badge: '6 Shocks · 340bps Climate VaR · Correlation Matrix',  code: 'EP-AB6' },
  ]},
  { label: 'Climate Finance Architecture', icon: '🏦', color: '#0f766e', items: [
    { path: '/climate-finance-hub',       label: 'Climate Finance Hub',        badge: 'Hub · Instruments · Pipeline · ICMA · EU GBS', code: 'EP-AA1' },
    { path: '/article6-markets',          label: 'Article 6 Carbon Markets',   badge: 'PA Art 6.2 · ITMO · Art 6.4 · CORSIA',        code: 'EP-AA2' },
    { path: '/cbam-compliance',           label: 'CBAM Compliance Engine',     badge: 'EU 2023/956 · 6 Sectors · Cert Calculator',    code: 'EP-AA3' },
    { path: '/climate-finance-tracker',   label: 'Climate Finance Tracker',    badge: '$100bn COP · GCF · Adaptation Gap · NCQG',    code: 'EP-AA4' },
    { path: '/green-taxonomy-navigator',  label: 'Green Taxonomy Navigator',   badge: '8 Jurisdictions · IPSF · Transition Categories', code: 'EP-AA5' },
    { path: '/climate-sovereign-bonds',   label: 'Climate Sovereign Bonds',    badge: 'Green Gilts · EU GBS · 47 Issuers · Greenium', code: 'EP-AA6' },
  ]},
  { label: 'Governance & Audit', icon: '🛡️', color: '#4a1d6a', items: [
    { path: '/governance-hub',           label: 'Governance Hub',            badge: 'Hub · 7 Modules · Audit · Models',      code: 'EP-V6' },
    { path: '/audit-trail',              label: 'Audit Trail',              badge: '8 Categories · Immutable · Regulatory',  code: 'EP-V1' },
    { path: '/model-governance',         label: 'Model Governance',         badge: '15 Models · SR 11-7 · 3 Tiers',         code: 'EP-V2' },
    { path: '/approval-workflows',       label: 'Approval Workflows',       badge: '8 Templates · SLA · Multi-Step',         code: 'EP-V3' },
    { path: '/compliance-evidence',      label: 'Compliance Evidence',      badge: '10 Categories · 20 Regulations',         code: 'EP-V4' },
    { path: '/change-management',        label: 'Change Management',        badge: '8 Categories · Rollback · Version',      code: 'EP-V5' },
    { path: '/corporate-governance',     label: 'Corporate Governance',     badge: '40 Indicators · CPI · WGI',              code: 'EP-V7' },
    { path: '/geopolitical-ai-gov',      label: 'Geopolitical & AI Gov',    badge: '14 Countries · GPR · EU AI Act',         code: 'EP-V8' },
  ]},
  { label: 'Dynamic Materiality', icon: '🎯', color: '#9333ea', items: [
    { path: '/materiality-hub',            label: 'Materiality Hub',            badge: 'Hub · Double · Trends · Scenarios',     code: 'EP-T6' },
    { path: '/double-materiality',         label: 'Double Materiality',         badge: 'CSRD/ESRS · 10 Topics · Financial+Impact', code: 'EP-T1' },
    { path: '/stakeholder-impact',         label: 'Stakeholder Impact',         badge: '8 Groups · ESRS-aligned · Quantified', code: 'EP-T2' },
    { path: '/materiality-trends',         label: 'Materiality Trends',         badge: '17 Drivers · Forecast 2025-2035',      code: 'EP-T3' },
    { path: '/controversy-materiality',    label: 'Controversy-Materiality',    badge: '30 Events · ESRS Mapped · Validation', code: 'EP-T4' },
    { path: '/materiality-scenarios',      label: 'Materiality Scenarios',      badge: '4 Scenarios · Reclassification',       code: 'EP-T5' },
  ]},
  { label: 'Data Management Engine', icon: '⚙️', color: '#334155', items: [
    { path: '/dme-hub',                    label: 'DME Hub',                    badge: 'Hub · Validation · ETL · Governance',  code: 'EP-S6' },
    { path: '/data-validation',            label: 'Data Validation',            badge: '50 Rules · Auto-Fix · 656 Companies',  code: 'EP-S1' },
    { path: '/data-reconciliation',        label: 'Data Reconciliation',        badge: '6 Sources · Conflict Resolution',      code: 'EP-S2' },
    { path: '/data-versioning',            label: 'Data Versioning',            badge: 'Snapshots · Diff · Rollback',          code: 'EP-S3' },
    { path: '/etl-pipeline',              label: 'ETL Pipeline',               badge: '8 Extract · 10 Transform · 5 Load',    code: 'EP-S4' },
    { path: '/data-governance',            label: 'Data Governance',            badge: '15 Policies · 8 Domains · Ownership',  code: 'EP-S5' },
  ]},
  { label: 'Data Infrastructure', icon: '🔧', color: '#475569', items: [
    { path: '/data-infra-hub',            label: 'Data Infra Hub',             badge: 'Hub · 10 Sources · 13 Exchanges', code: 'EP-P6' },
    { path: '/api-orchestration',         label: 'API Orchestration',          badge: '10 Sources · 6 Pipelines',       code: 'EP-P1' },
    { path: '/data-quality-monitor',      label: 'Data Quality Monitor',       badge: '656 Companies · 6 Dimensions',   code: 'EP-P2' },
    { path: '/live-feed-manager',         label: 'Live Feed Manager',          badge: 'EODHD · Alpha Vantage · BRSR',   code: 'EP-P3' },
    { path: '/data-lineage',              label: 'Data Lineage',               badge: 'Source → Transform → Output',    code: 'EP-P4' },
    { path: '/brsr-bridge',               label: 'BRSR Supabase Bridge',       badge: '1,323 Companies · 9 Principles', code: 'EP-P5' },
  ]},
  { label: 'Sovereign & Macro ESG', icon: '🌐', color: '#1e3a5f', items: [
    { path: '/sovereign-hub',             label: 'Sovereign Hub',              badge: 'Hub · 40 Countries · IEA · Paris', code: 'EP-O6' },
    { path: '/sovereign-esg',             label: 'Sovereign ESG Scorer',       badge: '40 Countries · ND-GAIN · CAT',   code: 'EP-O1' },
    { path: '/climate-policy',            label: 'Climate Policy Tracker',     badge: 'NDCs · Carbon Pricing · Net Zero', code: 'EP-O2' },
    { path: '/macro-transition',          label: 'Macro Transition',           badge: 'IEA · 3 Scenarios · Energy Mix',  code: 'EP-O3' },
    { path: '/just-transition',           label: 'Just Transition',            badge: 'ILO · 5 Dimensions · Workers',    code: 'EP-O4' },
    { path: '/paris-alignment',           label: 'Paris Alignment',            badge: '1.5°C · Carbon Budget · NDCs',    code: 'EP-O5' },
  ]},
  { label: 'Social & Human Capital', icon: '🧑‍🤝‍🧑', color: '#be185d', items: [
    { path: '/social-hub',                label: 'Social Hub',                 badge: 'Hub · Diversity · HR · SDG',    code: 'EP-N6' },
    { path: '/board-diversity',           label: 'Board Diversity',            badge: '12 Regulations · Skills Matrix', code: 'EP-N1' },
    { path: '/living-wage',               label: 'Living Wage Analyzer',       badge: '13 Countries · ILO · GLWC',     code: 'EP-N2' },
    { path: '/human-rights-dd',           label: 'Human Rights DD',            badge: 'UNGPs · 8 Issues · 15 DD',      code: 'EP-N3' },
    { path: '/employee-wellbeing',        label: 'Employee Wellbeing',          badge: '10 Metrics · Safety · Engagement', code: 'EP-N4' },
    { path: '/social-impact',             label: 'Social Impact & SDG',         badge: '17 SDGs · UNGC · Impact',       code: 'EP-N5' },
  ]},
  { label: 'Nature & Biodiversity', icon: '🌿', color: '#059669', items: [
    { path: '/nature-hub',                label: 'Nature Hub',                 badge: 'Hub · TNFD · ENCORE · MSA',     code: 'EP-M6' },
    { path: '/tnfd-leap',                 label: 'TNFD LEAP Assessment',       badge: '4 Phases · 14 Disclosures',     code: 'EP-M1' },
    { path: '/biodiversity-footprint',    label: 'Biodiversity Footprint',     badge: 'MSA · Species · CBD/GBF',       code: 'EP-M2' },
    { path: '/ecosystem-services',        label: 'Ecosystem Services',          badge: 'ENCORE · 21 Services',          code: 'EP-M3' },
    { path: '/water-stress',              label: 'Water Stress & Risk',         badge: 'WRI Aqueduct · 14 Countries',   code: 'EP-M4' },
    { path: '/nature-scenarios',          label: 'Nature Scenarios',            badge: '3 Scenarios · Tipping Points',  code: 'EP-M5' },
  ]},
  { label: 'Private Markets', icon: '🏦', color: '#4338ca', items: [
    { path: '/private-markets-hub',       label: 'Private Markets Hub',        badge: 'Hub · PE/VC · Credit · FoF',    code: 'EP-L6' },
    { path: '/pe-vc-esg',                 label: 'PE/VC ESG Due Diligence',   badge: '20 Deals · 30 DD Items',        code: 'EP-L1' },
    { path: '/private-credit',            label: 'Private Credit ESG',         badge: '15 Facilities · ESG-Linked',    code: 'EP-L2' },
    { path: '/fund-of-funds',             label: 'Fund-of-Funds',              badge: '12 Funds · 5 Asset Classes',    code: 'EP-L3' },
    { path: '/lp-reporting',              label: 'LP Reporting Engine',         badge: 'EDCI · SFDR · PRI · TCFD',     code: 'EP-L4' },
    { path: '/co-investment',             label: 'Co-Investment ESG',           badge: '10 Opportunities · Scoring',    code: 'EP-L5' },
    { path: '/pe-deal-pipeline',          label: 'PE Deal Pipeline & Fund Structure', badge: '50 Deals · 5 Funds · J-Curve · DPI/TVPI · Waterfall', code: 'EP-BB1' },
  ]},
  { label: 'Supply Chain & Scope 3', icon: '🔗', color: '#7e22ce', items: [
    { path: '/value-chain-dashboard',     label: 'Value Chain Hub',            badge: 'Hub · Scope 3 · CSDDD · EUDR', code: 'EP-K6' },
    { path: '/scope3-engine',             label: 'Scope 3 Estimation',         badge: '15 Categories · GHG Protocol',  code: 'EP-K1' },
    { path: '/supply-chain-map',          label: 'Supply Chain ESG Map',       badge: 'Tier 1/2/3 · 33 Countries',    code: 'EP-K2' },
    { path: '/csddd-compliance',          label: 'CSDDD Toolkit',              badge: '20 Requirements · 6 Articles',  code: 'EP-K3' },
    { path: '/deforestation-risk',        label: 'Deforestation Risk',         badge: 'EUDR · 7 Commodities',          code: 'EP-K4' },
    { path: '/supply-chain-carbon',       label: 'Supply Chain Carbon',        badge: 'Scope 1+2+3 · EEIO Model',     code: 'EP-K5' },
  ]},
  { label: 'Quantitative Analytics & ML', icon: '🔬', color: '#0f172a', items: [
    { path: '/quant-dashboard',           label: 'Quant Analytics Hub',        badge: '5 Models · Composite Risk',     code: 'EP-J6' },
    { path: '/monte-carlo-var',           label: 'Monte Carlo VaR',           badge: 'Cholesky · N=10K · 95/99%',    code: 'EP-J1' },
    { path: '/esg-backtesting',           label: 'ESG Factor Backtesting',    badge: '7 Factors · Sharpe · 10yr',    code: 'EP-J2' },
    { path: '/implied-temp-regression',   label: 'ITR Regression Model',      badge: 'IPCC Budget · OLS · R²',       code: 'EP-J3' },
    { path: '/copula-tail-risk',          label: 'Copula Tail Risk',          badge: 'Clayton · Gaussian · λ_L',     code: 'EP-J4' },
    { path: '/stochastic-scenarios',      label: 'Stochastic Scenarios',      badge: '6 Params · N=1K · Clustering', code: 'EP-J5' },
  ]},
  { label: 'Real Estate & Infrastructure', icon: '🏢', color: '#8b5cf6', items: [
    { path: '/re-portfolio-dashboard',  label: 'RE Portfolio Dashboard',       badge: 'Hub · 30 Props · 20 Infra', code: 'EP-I6' },
    { path: '/crrem',                   label: 'CRREM Pathway Analyzer',      badge: 'CRREM 1.5/WB2/2°C · 8 Types', code: 'EP-I1' },
    { path: '/green-building-cert',     label: 'Green Building Certs',        badge: 'LEED·BREEAM·NABERS·7 Schemes', code: 'EP-I2' },
    { path: '/property-physical-risk',  label: 'Property Physical Risk',      badge: '6 Hazards · SSP · Prop-Level', code: 'EP-I3' },
    { path: '/gresb-scoring',           label: 'GRESB Scoring',              badge: '7 Aspects · 5★ · 19 Peers',   code: 'EP-I4' },
    { path: '/infra-esg-dd',            label: 'Infrastructure ESG DD',       badge: 'IFC PS · EP IV · 20 Assets',  code: 'EP-I5' },
  ]},
  { label: 'Carbon Markets & VCM', icon: '🌿', color: '#065f46', items: [
    { path: '/vcm-registry-analytics',  label: 'VCM Registry Analytics',          badge: 'Verra · Gold Standard · ACR · Issuance · Retirements · 20 Projects · Quality', code: 'EP-BN1' },
    { path: '/carbon-forward-curve',    label: 'Carbon Forward Curve & ETS',       badge: 'EU ETS · UK ETS · California · RGGI · China ETS · Forward Curve · Scenarios',   code: 'EP-BN2' },
    { path: '/credit-integrity-dd',     label: 'Credit Integrity & Due Diligence', badge: 'Additionality · Permanence · ICVCM CCP · Greenwashing · Integrity Pricing',     code: 'EP-BN3' },
  ]},
  { label: 'Equitable Earth Methodologies', icon: '🌍', color: '#059669', items: [
    { path: '/equitable-earth-methodologies', label: 'Equitable Earth Methodology Framework', badge: '5-Pillar · 6 Standards · Project Scoring · Calc Engine · Credit Integrity', code: 'EP-BP1' },
  ]},
  { label: 'Critical Minerals & Energy Transition', icon: '⛏️', color: '#92400e', items: [
    { path: '/critical-minerals',   label: 'Critical Minerals Supply Chain',  badge: '8 Minerals · Country Concentration · Demand Outlook · Mine Pipeline · HHI', code: 'EP-BO1' },
    { path: '/battery-ev-analytics',label: 'Battery & EV Analytics',          badge: 'LFP/NMC/NCA · Cost Curves · EV Adoption · Gigafactories · Chemistry Mix',   code: 'EP-BO2' },
    { path: '/et-commodity-risk',   label: 'Energy Transition Commodity Risk',badge: 'Portfolio Exposure · NGFS Scenarios · Supply Chain Risk · Revenue at Risk',  code: 'EP-BO3' },
  ]},
  { label: 'Insurance & Catastrophe Risk', icon: '🛡️', color: '#b91c1c', items: [
    { path: '/natcat-loss-engine',         label: 'NatCat Climate Loss Engine',     badge: 'EP Curves · AAL · PML · IPCC AR6 · 8 Perils · 4 Scenarios · Portfolio',   code: 'EP-BM1' },
    { path: '/cat-bond-ils',               label: 'Cat Bond & ILS Analytics',       badge: 'Bond Universe · Pricer · Trigger Analysis · Spread · Historical Events',   code: 'EP-BM2' },
    { path: '/insurance-protection-gap',   label: 'Physical Risk Insurance Gap',    badge: 'Protection Gap · 15 Countries · Climate Stress · Public-Private Schemes',  code: 'EP-BM3' },
  ]},
  { label: 'ML & Predictive Analytics', icon: '🤖', color: '#4f46e5', items: [
    { path: '/ml-risk-scorer',          label: 'XGBoost Climate Risk Scorer',    badge: 'XGBoost · Quantile Regression · SHAP · Conformal Prediction · Training UI', code: 'EP-BL1' },
    { path: '/nlp-disclosure-parser',   label: 'NLP Disclosure & Greenwashing',  badge: 'BERT · Greenwashing Detection · CSRD Extraction · Sentiment · Calibration',  code: 'EP-BL2' },
    { path: '/predictive-analytics-hub', label: 'Predictive Analytics Hub',      badge: 'iTransformer · Model Registry · Anomaly Detection · Drift Monitor',          code: 'EP-BL3' },
  ]},
  { label: 'Asset Valuation & Real Estate', icon: '🏗️', color: '#92400e', items: [
    { path: '/asset-valuation-engine',    label: 'Climate-Adjusted DCF Engine',   badge: 'DCF · Monte Carlo · Real Options · Black-Scholes · M&A Comps · Interactive', code: 'EP-BK1' },
    { path: '/infrastructure-valuation',  label: 'Infrastructure Valuation',      badge: 'RAB Model · Greenfield DCF · PPP · Stranded Assets · ESG Greenium',          code: 'EP-BK2' },
    { path: '/real-estate-valuation',     label: 'Real Estate Valuation & ESG',   badge: 'RICS Red Book · Climate Haircut · GRESB · EPC Premium · Physical Risk',       code: 'EP-BK3' },
  ]},
  { label: 'NGFS × IEA Climate Scenarios', icon: '🌡️', color: '#0f766e', items: [
    { path: '/ngfs-iea-scenario',          label: 'NGFS × IEA Scenario Engine',     badge: 'NGFS Ph5 · IEA WEO 2024 · IPCC AR6 · 14 Scenarios · BMA Ensemble · Carbon Price', code: 'EP-BJ1' },
    { path: '/climate-credit-integration', label: 'Climate-Credit Risk Integration', badge: '5 NGFS Scenarios · ECL Uplift · IFRS 9 Stage Migration · Hazard Matrix · 12 Module Links', code: 'EP-BJ2' },
  ]},
  { label: 'Credit & Platform Intelligence', icon: '📈', color: '#1b3a5c', items: [
    { path: '/credit-risk-analytics', label: 'Credit Risk Analytics',        badge: '45 Obligors · PD/LGD/EAD/ECL · Migration Matrix · Basel IV RWA', code: 'EP-BI1' },
    { path: '/platform-analytics',    label: 'Platform Analytics Dashboard', badge: 'DAU · API Perf · Module Adoption · System Health · 90d Trend',    code: 'EP-BI2' },
  ]},
  { label: 'Platform Operations', icon: '🗄️', color: '#1b3a5c', items: [
    { path: '/db-migration-console',  label: 'DB Migration Console',        badge: 'Alembic · 87 Revisions · 060 Applied · 027 Pending · Runbook', code: 'EP-BH1' },
    { path: '/multi-tenancy-audit',   label: 'Multi-Tenancy & Org Audit',   badge: '10 Orgs · org_id · RLS · RBAC 6 Roles · Isolation Gap Detect',  code: 'EP-BH2' },
  ]},
  { label: 'SBTi, Climate TRACE & Sanctions', icon: '🛡️', color: '#991b1b', items: [
    { path: '/sbti-climate-trace',   label: 'SBTi Registry & Climate TRACE',    badge: '50 Companies · 12 CT Sectors · Pathways 2020–2050 · SDA', code: 'EP-BG1' },
    { path: '/sanctions-watchlist',  label: 'Sanctions & Watchlist Intelligence', badge: 'OFAC SDN · UN · EU · UK · PEP 1.24M · 18 Portfolio Hits',  code: 'EP-BG2' },
  ]},
  { label: 'Data Hub & Ingesters', icon: '🔄', color: '#0891b2', items: [
    { path: '/data-hub-ingester',   label: 'Data Hub Ingester Monitor',  badge: 'APScheduler · 15 Jobs · GLEIF · OWID · yfinance · BaseIngester', code: 'EP-BF1' },
    { path: '/owid-evic-analytics', label: 'OWID CO₂ & EVIC Analytics',  badge: 'OWID 207C · EVIC 3.5K · WACI · PCAF · 1990–2023',              code: 'EP-BF2' },
  ]},
  { label: 'Dynamic Materiality Engine', icon: '⚙️', color: '#0f766e', items: [
    { path: '/dme-financial-risk', label: 'DME Financial Risk',           badge: 'VaR · WACC · LCR · ECL · IFRS 9 · 40 Entities',     code: 'EP-BE1' },
    { path: '/dme-pd-engine',      label: 'DME Probability of Default',   badge: '4-Branch PD · Merton DD · Sector Coefficients · 40E', code: 'EP-BE2' },
    { path: '/dme-index',          label: 'DME Dynamic Materiality Index', badge: 'DMI=40%+40%+20% · Regime · EMA · Portfolio HHI',     code: 'EP-BE3' },
  ]},
  { label: 'Institutional Analytics & AI', icon: '🧠', color: '#7e22ce', items: [
    { path: '/entity-360',           label: 'Entity 360° Intelligence',  badge: 'Cross-Module · ESG+Climate+Regulatory+Supply Chain · 20 Entities', code: 'EP-AY3' },
    { path: '/risk-attribution',     label: 'Risk Attribution Engine',   badge: 'Barra · 6 Factors · Alpha',   code: 'EP-H1' },
    { path: '/fixed-income-esg',     label: 'Fixed Income & Green Bonds', badge: 'ICMA GBP · Greenium · SLB',  code: 'EP-H2' },
    { path: '/portfolio-optimizer',  label: 'Portfolio Optimizer',       badge: 'Markowitz · ESG Constraints',  code: 'EP-H3' },
    { path: '/controversy-monitor',  label: 'Controversy Monitor',      badge: 'RepRisk · Severity 1-5',       code: 'EP-H4' },
    { path: '/ai-sentiment',         label: 'AI Sentiment Intelligence', badge: 'NLP · E/S/G · 30-Day Feed',   code: 'EP-H5' },
    { path: '/sentiment-pipeline',   label: 'Sentiment Pipeline Engine',  badge: '8-Step · 60 Signals · Credibility Tiers · EWMA · Alerts', code: 'EP-BD2' },
    { path: '/regulatory-gap',       label: 'Regulatory Gap Analyzer',  badge: '8 Frameworks · 60+ Reqs',      code: 'EP-H6' },
    { path: '/climate-physical-risk',  label: 'Physical Risk Engine',    badge: 'IPCC AR6 · 6 Hazards · SSP',  code: 'EP-H7' },
    { path: '/climate-transition-risk',label: 'Transition Risk Engine',  badge: 'NGFS · 4 Channels · Carbon',  code: 'EP-H8' },
  ]},
  { label: 'Portfolio Intelligence Suite', icon: '📊', color: '#1e40af', items: [
    { path: '/portfolio-suite',        label: 'Portfolio Suite Dashboard', badge: 'Hub · All KPIs · Links',     code: 'EP-G1' },
    { path: '/scenario-stress-test',   label: 'Scenario Stress Tester',   badge: 'NGFS Phase 3 · 4 Scenarios', code: 'EP-G2' },
    { path: '/carbon-budget',          label: 'Carbon Budget Tracker',    badge: 'SBTi 1.5°C · Glide Path',   code: 'EP-G3' },
    { path: '/holdings-deep-dive',     label: 'Holdings Deep-Dive',       badge: 'PCAF AF · ESG Intel',        code: 'EP-G4' },
    { path: '/benchmark-analytics',    label: 'Benchmark Analytics',      badge: 'MSCI ACWI · Active Share',   code: 'EP-G5' },
    { path: '/advanced-report-studio', label: 'Advanced Report Studio',   badge: 'TCFD·SFDR·CSRD·PDF Export',  code: 'EP-G6' },
  ]},
  { label: 'Sprint F — Portfolio Intelligence', icon: '💼', color: '#0d9488', items: [
    { path: '/portfolio-manager',   label: 'Portfolio Manager',       badge: 'PCAF v3.0 · WACI · Temp', code: 'EP-F1' },
    { path: '/esg-screener',        label: 'ESG Screening Engine',    badge: 'UNGP · ILO · OECD MNE',  code: 'EP-F2' },
    { path: '/stewardship-tracker', label: 'Stewardship Tracker',     badge: 'PRI · UK SC 2020',        code: 'EP-F3' },
    { path: '/client-report',       label: 'Client Report Studio',    badge: 'TCFD · SFDR · UNPRI',     code: 'EP-F4' },
    { path: '/regulatory-calendar', label: 'Regulatory Calendar',     badge: 'CSRD · ISSB · SEC · SEBI', code: 'EP-F5' },
  ]},
  { label: 'Sprint E — Global Market Intelligence', icon: '🌐', color: '#2563eb', items: [
    { path: '/exchange-intelligence', label: 'Exchange Intelligence',    badge: '13 Exchanges · 500+ Co.', code: 'EP-E1' },
    { path: '/sector-benchmarking',   label: 'Sector Benchmarking',     badge: 'Cross-Exchange · Paris', code: 'EP-E2' },
  ]},
  { label: 'Sprint D — Platform Intelligence', icon: '🚀', color: '#7c3aed', items: [
    { path: '/company-profiles',      label: 'Company Master Reference', badge: 'BRSR P6 · 30+ Companies', code: 'REF-01' },
    { path: '/stranded-assets',       label: 'Stranded Asset Analyzer', badge: 'IEA WEO · NZE/APS/STEPS', code: 'EP-D1' },
    { path: '/ngfs-scenarios',        label: 'NGFS Scenario Browser',   badge: 'NGFS Phase 3 · 8 Scenarios', code: 'EP-D6' },
    { path: '/portfolio-climate-var', label: 'Portfolio Climate VaR',   badge: 'Delta-Normal · 95% CI',    code: 'EP-D7' },
    { path: '/pipeline-dashboard',    label: 'Pipeline Monitor',        badge: 'pipeline_run_log · P95',   code: 'EP-D4' },
    { path: '/csrd-ixbrl',            label: 'CSRD / iXBRL Builder',   badge: 'EFRAG ESRS 2024 · 5 FW',   code: 'EP-D3' },
  ]},
];
const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════ */
const COVERAGE_DATA = [
  { region: 'India', coverage: 92 }, { region: 'Singapore', coverage: 88 },
  { region: 'Hong Kong', coverage: 85 }, { region: 'Malaysia', coverage: 78 },
  { region: 'S. Korea', coverage: 82 }, { region: 'Japan', coverage: 90 },
  { region: 'China', coverage: 75 }, { region: 'GCC', coverage: 70 },
  { region: 'LATAM', coverage: 65 }, { region: 'Canada', coverage: 87 },
];

const TREND_DATA = Array.from({length: 12}, (_, i) => ({
  month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
  modules: Math.round(20 + i * 2.2 + Math.sin(i) * 3),
  coverage: Math.round(55 + i * 3.5 + Math.cos(i) * 2),
}));

/* ── Shared tooltip style ── */
const TIP = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, color: T.text, fontSize: 11, fontFamily: T.mono, boxShadow: '0 4px 12px rgba(27,58,92,0.08)' };
/* ── Panel wrapper ── */
const Panel = ({ children, style, pad = true }) => (
  <div style={{
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, boxShadow: T.card,
    ...(pad ? { padding: '16px 18px' } : {}), ...style,
  }}>{children}</div>
);
/* ── Section label ── */
const SectionLabel = ({ children, count, right }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
    <span style={{ fontSize: 10, fontWeight: 700, color: T.navy, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{children}</span>
    {count != null && <span style={{ fontSize: 10, fontFamily: T.mono, color: T.gold, fontWeight: 600 }}>{count}</span>}
    {right && <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMut }}>{right}</span>}
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
  const [domainFilter, setDomainFilter] = useState('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const pieData = NAV_GROUPS.map((g, i) => ({ name: g.label.split('&')[0].trim().split(' ').slice(0,2).join(' '), value: g.items.length, color: g.color || PASTEL[i % PASTEL.length] }));
  const filteredGroups = domainFilter ? NAV_GROUPS.filter(g => g.label.toLowerCase().includes(domainFilter.toLowerCase()) || g.items.some(i => i.label.toLowerCase().includes(domainFilter.toLowerCase()))) : NAV_GROUPS;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1480, margin: '0 auto' }}>
      {/* ── Command Center Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: 0, letterSpacing: '-0.03em' }}>Platform Command Center</h1>
            <div style={{ height: 16, width: 1, background: T.border }} />
            <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textMut, fontWeight: 500 }}>{dateStr}</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 12, marginTop: 4, fontWeight: 400 }}>
            AA Impact Inc. — A2 Intelligence Risk Analytics
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.sage, boxShadow: `0 0 6px ${T.sage}` }} />
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sage, fontWeight: 600, letterSpacing: '0.06em' }}>SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'MODULES', value: ALL_ITEMS.length, delta: '+6', deltaUp: true, sub: 'Sprint AJ' },
          { label: 'DOMAINS', value: NAV_GROUPS.length, delta: null, sub: '10 Regions' },
          { label: 'FRAMEWORKS', value: '60+', delta: '+4', deltaUp: true, sub: 'CSRD·SFDR·ISSB' },
          { label: 'API ENDPOINTS', value: '400+', delta: null, sub: 'FastAPI v0.110' },
          { label: 'ESRS DATAPOINTS', value: '1,222', delta: null, sub: 'Mapped & Validated' },
          { label: 'COVERAGE', value: '82%', delta: '+3%', deltaUp: true, sub: 'Regulatory avg.' },
        ].map((s) => (
          <div key={s.label} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: '14px 16px',
            borderBottom: `2px solid ${T.gold}`, boxShadow: T.card,
          }}>
            <div style={{ fontSize: 9, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: T.navy, fontFamily: T.mono, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.value}</span>
              {s.delta && <span style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 600, color: s.deltaUp ? T.sage : T.red }}>{s.delta}</span>}
            </div>
            <div style={{ fontSize: 10, color: T.textMut, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* Module Distribution */}
        <Panel>
          <SectionLabel>Distribution</SectionLabel>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData.slice(0,10)} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={64} paddingAngle={1} stroke={T.surface} strokeWidth={2}>
                {pieData.slice(0,10).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [`${val}`, name]} contentStyle={TIP} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 4 }}>
            {pieData.slice(0,10).map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: T.textSec, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: d.color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
                <span style={{ fontFamily: T.mono, color: T.textMut, fontWeight: 600, marginLeft: 'auto' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* Regional Coverage */}
        <Panel>
          <SectionLabel right="% Regulatory Alignment">Regional Coverage</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={COVERAGE_DATA} layout="vertical" margin={{ left: 0 }}>
              <CartesianGrid horizontal={false} stroke={T.border} strokeDasharray="2 4" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.mono }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis type="category" dataKey="region" width={60} tick={{ fontSize: 10, fill: T.textSec, fontWeight: 500 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v}%`, 'Coverage']} contentStyle={TIP} />
              <Bar dataKey="coverage" radius={[0, 2, 2, 0]} barSize={14}>
                {COVERAGE_DATA.map((e, i) => <Cell key={i} fill={e.coverage >= 85 ? T.sage : e.coverage >= 75 ? T.gold : '#bec5cc'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        {/* Growth Trend */}
        <Panel>
          <SectionLabel right="12-Month Rolling">Growth Trajectory</SectionLabel>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="2 4" stroke={T.border} vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.mono }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: T.textMut, fontFamily: T.mono }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={TIP} />
              <Area type="monotone" dataKey="modules" stroke={T.navy} fill="rgba(27,58,92,0.06)" name="Modules" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="coverage" stroke={T.gold} fill="rgba(197,169,106,0.06)" name="Coverage %" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ── Domain Grid ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <SectionLabel count={NAV_GROUPS.length}>Domains</SectionLabel>
        <input type="text" placeholder="Filter domains..." value={domainFilter} onChange={e => setDomainFilter(e.target.value)}
          style={{ padding: '5px 10px', fontSize: 11, borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, outline: 'none', width: 180 }}
          onFocus={e => e.target.style.borderColor = T.gold} onBlur={e => e.target.style.borderColor = T.border} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 28 }}>
        {filteredGroups.map((g) => (
          <div key={g.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', boxShadow: T.card, transition: 'box-shadow 0.18s, transform 0.18s', borderLeft: `3px solid ${g.color}` }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.cardH; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.card; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 14 }}>{g.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.navy }}>{g.label}</span>
              </div>
              <span style={{ fontSize: 16, fontFamily: T.mono, fontWeight: 700, color: g.color }}>{g.items.length}</span>
            </div>
            <div style={{ padding: '6px 10px' }}>
              {g.items.slice(0, 3).map(item => (
                <div key={item.path} onClick={() => navigate(item.path)} style={{
                  padding: '5px 6px', borderRadius: 3, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 11, color: T.textSec, transition: 'background 0.12s',
                }} onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 8 }}>{item.label}</span>
                  <span style={{ fontSize: 8, fontFamily: T.mono, color: g.color, fontWeight: 700, flexShrink: 0 }}>{item.code}</span>
                </div>
              ))}
              {g.items.length > 3 && (
                <div onClick={() => navigate(g.items[0].path)} style={{ padding: '4px 6px', fontSize: 10, fontFamily: T.mono, color: T.textMut, cursor: 'pointer' }}>+{g.items.length - 3} more →</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Full Module Registry ── */}
      <SectionLabel count={ALL_ITEMS.length}>Module Registry</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
        {ALL_ITEMS.map(n => {
          const grp = NAV_GROUPS.find(g => g.items.includes(n));
          return (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: '10px 12px', borderRadius: 4, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer',
              borderLeft: `3px solid ${grp?.color || T.textMut}`, transition: 'box-shadow 0.15s, background 0.15s', boxShadow: 'none',
            }} onMouseEnter={e => { e.currentTarget.style.boxShadow = T.cardH; e.currentTarget.style.background = T.surfaceH; }}
               onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = T.surface; }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.navy, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: T.textMut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{n.badge}</span>
                <span style={{ fontSize: 8, fontFamily: T.mono, color: grp?.color, fontWeight: 700 }}>{n.code}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR — Institutional Navy · Gold accent · Terminal density
   ═══════════════════════════════════════════════════════════════════ */
function Sidebar({ search, setSearch, sidebarOpen }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState({});
  const toggle = (label) => setCollapsed(c => ({ ...c, [label]: !c[label] }));

  const filtered = useMemo(() => {
    if (!search) return NAV_GROUPS;
    const q = search.toLowerCase();
    return NAV_GROUPS.map(g => ({
      ...g, items: g.items.filter(i => i.label.toLowerCase().includes(q) || i.badge.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0);
  }, [search]);

  if (!sidebarOpen) return null;

  return (
    <nav style={{
      width: 252, background: T.navy, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${T.navyD}`, height: '100%', overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '10px 10px 6px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>⌕</span>
          <input type="text" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '7px 10px 7px 26px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#e0dcd4', fontSize: 11, outline: 'none', fontFamily: T.font, boxSizing: 'border-box', transition: 'border-color 0.15s, background 0.15s',
            }}
            onFocus={e => { e.target.style.borderColor = T.gold; e.target.style.background = 'rgba(255,255,255,0.1)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.06)'; }}
          />
        </div>
        {search && <div style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', padding: '4px 2px 0', letterSpacing: '0.04em' }}>{filtered.reduce((a,g) => a + g.items.length, 0)} results</div>}
      </div>

      {/* Nav Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 12px' }}>
        {filtered.map(group => {
          const isGroupActive = group.items.some(i => i.path === location.pathname);
          return (
            <div key={group.label} style={{ marginBottom: 1 }}>
              <div onClick={() => toggle(group.label)} style={{
                padding: '7px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                borderRadius: 4, userSelect: 'none', borderLeft: isGroupActive ? `2px solid ${T.gold}` : '2px solid transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 12, width: 18, textAlign: 'center' }}>{group.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: isGroupActive ? T.gold : 'rgba(255,255,255,0.6)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</span>
                <span style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', fontWeight: 600, minWidth: 16, textAlign: 'right' }}>{group.items.length}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', transform: collapsed[group.label] ? 'rotate(-90deg)' : '', transition: 'transform 0.12s', marginLeft: 2 }}>▾</span>
              </div>
              {!collapsed[group.label] && group.items.map(n => {
                const isActive = location.pathname === n.path;
                return (
                  <NavLink key={n.path} to={n.path} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px 5px 30px', borderRadius: 3, marginBottom: 0, textDecoration: 'none',
                    background: isActive ? 'rgba(197,169,106,0.15)' : 'transparent',
                    borderLeft: isActive ? `2px solid ${T.gold}` : '2px solid transparent',
                    transition: 'background 0.1s, border-color 0.1s',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? T.gold : 'rgba(255,255,255,0.55)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>
                    <span style={{ fontSize: 8, fontFamily: T.mono, fontWeight: 600, color: isActive ? T.gold : 'rgba(255,255,255,0.18)', flexShrink: 0, marginLeft: 6 }}>{n.code}</span>
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>{ALL_ITEMS.length} MOD · {NAV_GROUPS.length} DOM · 10 REG</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL, boxShadow: `0 0 4px ${T.sageL}` }} />
          <span style={{ fontSize: 8, fontFamily: T.mono, color: T.sageL, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HEADER BAR — Institutional Navy · Gold accent line · Terminal data
   ═══════════════════════════════════════════════════════════════════ */
function HeaderBar({ sidebarOpen, setSidebarOpen }) {
  const [time, setTime] = useState('');
  const location = useLocation();
  const current = ALL_ITEMS.find(i => i.path === location.pathname);
  const group = current ? NAV_GROUPS.find(g => g.items.includes(current)) : null;

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{ flexShrink: 0 }}>
      <div style={{
        height: 44, background: T.navy,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12,
      }}>
        {/* Toggle */}
        <button onClick={() => setSidebarOpen(o => !o)} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 14, padding: '4px 6px',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = T.gold}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >{'\u2630'}</button>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderRight: '1px solid rgba(255,255,255,0.08)', paddingRight: 14 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 4, background: `linear-gradient(135deg, ${T.gold}, ${T.goldD})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: T.navy, fontFamily: T.mono,
          }}>AA</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '0.03em' }}>AA Impact</div>
            <div style={{ fontSize: 8, fontFamily: T.mono, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, letterSpacing: '0.06em' }}>A2 INTELLIGENCE</div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 1, minWidth: 0 }}>
          {current ? (
            <>
              <NavLink to="/" style={{ fontSize: 10, fontFamily: T.mono, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', letterSpacing: '0.02em' }}>HOME</NavLink>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: T.mono }}>/</span>
              <span style={{ fontSize: 10, fontFamily: T.mono, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group?.label?.toUpperCase()}</span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10, fontFamily: T.mono }}>/</span>
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.label}</span>
              <span style={{
                fontSize: 8, fontFamily: T.mono, fontWeight: 700, color: T.gold, background: 'rgba(197,169,106,0.18)', padding: '2px 6px', borderRadius: 3, marginLeft: 4, flexShrink: 0, letterSpacing: '0.04em',
              }}>{current.code}</span>
            </>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>Command Center</span>
          )}
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL, boxShadow: `0 0 4px ${T.sageL}` }} />
            <span style={{ color: T.sageL, fontWeight: 600 }}>API</span>
          </div>
          <span>:8001</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{time}</span>
        </div>
      </div>
      {/* Gold accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${T.gold}, ${T.goldL} 40%, transparent 80%)` }} />
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS BAR — Terminal-style data strip
   ═══════════════════════════════════════════════════════════════════ */
function StatusBar() {
  const location = useLocation();
  const current = ALL_ITEMS.find(i => i.path === location.pathname);
  return (
    <div style={{
      height: 24, background: T.navy, borderTop: `1px solid ${T.navyD}`,
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 3,
      fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', flexShrink: 0, letterSpacing: '0.04em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL, boxShadow: `0 0 3px ${T.sageL}` }} />
        <span style={{ color: T.sageL, fontWeight: 600 }}>CONNECTED</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>│</span>
      <span style={{ padding: '0 6px' }}>{ALL_ITEMS.length} MODULES</span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>│</span>
      <span style={{ padding: '0 6px' }}>{NAV_GROUPS.length} DOMAINS</span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>│</span>
      <span style={{ padding: '0 6px' }}>10 REGIONS</span>
      <span style={{ color: 'rgba(255,255,255,0.15)' }}>│</span>
      <span style={{ padding: '0 6px' }}>60+ FW</span>
      {current && <>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>│</span>
        <span style={{ padding: '0 6px', color: T.goldL, fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.badge}</span>
      </>}
      <span style={{ marginLeft: 'auto', color: T.gold, fontWeight: 600, letterSpacing: '0.08em' }}>AA IMPACT</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════════════════════════════ */
function AppContent() {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: T.font }}>
      <HeaderBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar search={search} setSearch={setSearch} sidebarOpen={sidebarOpen} />
        <main style={{ flex: 1, overflowY: 'auto', background: T.bg }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/crypto-climate" element={<CryptoClimatePage />} />
            <Route path="/ai-governance" element={<AIGovernancePage />} />
            <Route path="/carbon-accounting-ai" element={<CarbonAccountingAIPage />} />
            <Route path="/climate-insurance" element={<ClimateInsurancePage />} />
            <Route path="/corporate-nature-strategy" element={<CorporateNatureStrategyPage />} />
            <Route path="/green-securitisation" element={<GreenSecuritisationPage />} />
            <Route path="/digital-product-passport" element={<DigitalProductPassportPage />} />
            <Route path="/adaptation-finance" element={<AdaptationFinancePage />} />
            <Route path="/internal-carbon-price" element={<InternalCarbonPricePage />} />
            <Route path="/social-bond" element={<SocialBondPage />} />
            <Route path="/climate-financial-statements" element={<ClimateFinancialStatementsPage />} />
            <Route path="/em-climate-risk" element={<EMClimateRiskPage />} />
            <Route path="/biodiversity-credits" element={<BiodiversityCreditsPage />} />
            <Route path="/just-transition" element={<JustTransitionPage />} />
            <Route path="/carbon-removal" element={<CarbonRemovalPage />} />
            <Route path="/climate-litigation" element={<ClimateLitigationPage />} />
            <Route path="/water-risk" element={<WaterRiskPage />} />
            <Route path="/critical-minerals" element={<CriticalMineralsPage />} />
            <Route path="/nbs-finance" element={<NbsFinancePage />} />
            <Route path="/sfdr-art9" element={<SFDRArt9Page />} />
            <Route path="/vcm-integrity" element={<VCMIntegrityPage />} />
            <Route path="/social-taxonomy" element={<SocialTaxonomyPage />} />
            <Route path="/green-hydrogen" element={<GreenHydrogenPage />} />
            <Route path="/transition-finance" element={<TransitionFinancePage />} />
            <Route path="/stress-test-orchestrator" element={<StressTestOrchestratorPage />} />
            <Route path="/sscf" element={<SSCFPage />} />
            <Route path="/double-materiality" element={<DoubleMaterialityPage />} />
            <Route path="/temperature-alignment" element={<TemperatureAlignmentPage />} />
            <Route path="/physical-risk-pricing" element={<PhysicalRiskPricingPage />} />
            <Route path="/esg-data-quality" element={<ESGDataQualityPage />} />
            <Route path="/climate-derivatives" element={<ClimateDerivativesPage />} />
            <Route path="/sovereign-swf" element={<SovereignSWFPage />} />
            <Route path="/regulatory-capital" element={<RegulatoryCapitalPage />} />
            <Route path="/climate-policy" element={<ClimatePolicyPage />} />
            <Route path="/export-credit-esg" element={<ExportCreditESGPage />} />
            <Route path="/esg-controversy" element={<ESGControversyPage />} />
            <Route path="/crrem" element={<CRREMPage />} />
            <Route path="/loss-damage" element={<LossDamagePage />} />
            <Route path="/forced-labour" element={<ForcedLabourPage />} />
            <Route path="/sll-slb-v2" element={<SLLSLBv2Page />} />
            <Route path="/nature-capital-accounting" element={<NatureCapitalAccountingPage />} />
            <Route path="/regulatory-horizon" element={<RegulatoryHorizonPage />} />
            <Route path="/climate-tech" element={<ClimateTechPage />} />
            <Route path="/comprehensive-reporting" element={<ComprehensiveReportingPage />} />
            <Route path="/sentiment-analysis" element={<SentimentAnalysisPage />} />
            <Route path="/pcaf-india-brsr" element={<PCafIndiaBrsrPage />} />
            <Route path="/equator-principles" element={<EquatorPrinciplesPage />} />
            <Route path="/esms" element={<EsmsPage />} />
            <Route path="/issb-tcfd" element={<IssbTcfdPage />} />
            <Route path="/eu-taxonomy" element={<EuTaxonomyPage />} />
            {/* Sprint E — Global Market Intelligence */}
            <Route path="/exchange-intelligence"  element={<ExchangeIntelligencePage />} />
            <Route path="/sector-benchmarking"    element={<SectorBenchmarkingPage />} />
            {/* Sprint F — Portfolio Intelligence & Client Services */}
            <Route path="/portfolio-manager"      element={<PortfolioManagerPage />} />
            <Route path="/esg-screener"           element={<EsgScreenerPage />} />
            <Route path="/stewardship-tracker"    element={<StewardshipTrackerPage />} />
            <Route path="/client-report"          element={<ClientReportPage />} />
            <Route path="/regulatory-calendar"    element={<RegulatoryCalendarPage />} />
            {/* Sprint G — Portfolio Intelligence Advanced Suite */}
            <Route path="/portfolio-suite"        element={<PortfolioSuitePage />} />
            <Route path="/scenario-stress-test"   element={<ScenarioStressTestPage />} />
            <Route path="/carbon-budget"          element={<CarbonBudgetPage />} />
            <Route path="/holdings-deep-dive"     element={<HoldingsDeepDivePage />} />
            <Route path="/benchmark-analytics"    element={<BenchmarkAnalyticsPage />} />
            <Route path="/advanced-report-studio" element={<AdvancedReportStudioPage />} />
            {/* Sprint H — Institutional Analytics & AI Intelligence */}
            <Route path="/risk-attribution"     element={<RiskAttributionPage />} />
            <Route path="/fixed-income-esg"     element={<FixedIncomeEsgPage />} />
            <Route path="/portfolio-optimizer"   element={<PortfolioOptimizerPage />} />
            <Route path="/controversy-monitor"   element={<ControversyMonitorPage />} />
            <Route path="/ai-sentiment"          element={<AiSentimentPage />} />
            <Route path="/regulatory-gap"        element={<RegulatoryGapPage />} />
            <Route path="/climate-physical-risk"  element={<ClimatePhysicalRiskPage />} />
            <Route path="/climate-transition-risk" element={<ClimateTransitionRiskPage />} />
            {/* Sprint I — Real Estate & Infrastructure ESG */}
            <Route path="/green-building-cert"    element={<GreenBuildingCertPage />} />
            <Route path="/property-physical-risk" element={<PropertyPhysicalRiskPage />} />
            <Route path="/gresb-scoring"          element={<GRESBScoringPage />} />
            <Route path="/infra-esg-dd"           element={<InfraESGDueDiligencePage />} />
            <Route path="/re-portfolio-dashboard" element={<REPortfolioDashboardPage />} />
            {/* Sprint J — Advanced Quantitative Analytics */}
            <Route path="/monte-carlo-var"           element={<MonteCarloVarPage />} />
            <Route path="/esg-backtesting"           element={<EsgBacktestingPage />} />
            <Route path="/implied-temp-regression"   element={<ImpliedTempRegressionPage />} />
            <Route path="/copula-tail-risk"          element={<CopulaTailRiskPage />} />
            <Route path="/stochastic-scenarios"      element={<StochasticScenariosPage />} />
            <Route path="/quant-dashboard"           element={<QuantDashboardPage />} />
            {/* Sprint K — Supply Chain & Scope 3 */}
            <Route path="/scope3-engine"             element={<Scope3EnginePage />} />
            <Route path="/supply-chain-map"          element={<SupplyChainMapPage />} />
            <Route path="/csddd-compliance"          element={<CSDDDCompliancePage />} />
            <Route path="/deforestation-risk"        element={<DeforestationRiskPage />} />
            <Route path="/supply-chain-carbon"       element={<SupplyChainCarbonPage />} />
            <Route path="/value-chain-dashboard"     element={<ValueChainDashboardPage />} />
            {/* Sprint L — Private Markets */}
            <Route path="/pe-vc-esg"                 element={<PeVcEsgPage />} />
            <Route path="/private-credit"            element={<PrivateCreditPage />} />
            <Route path="/fund-of-funds"             element={<FundOfFundsPage />} />
            <Route path="/lp-reporting"              element={<LpReportingPage />} />
            <Route path="/co-investment"             element={<CoInvestmentPage />} />
            <Route path="/private-markets-hub"       element={<PrivateMarketsHubPage />} />
            {/* Sprint M — Nature & Biodiversity */}
            <Route path="/tnfd-leap"                 element={<TnfdLeapPage />} />
            <Route path="/biodiversity-footprint"    element={<BiodiversityFootprintPage />} />
            <Route path="/ecosystem-services"        element={<EcosystemServicesPage />} />
            <Route path="/water-stress"              element={<WaterStressPage />} />
            <Route path="/nature-scenarios"          element={<NatureScenariosPage />} />
            <Route path="/nature-hub"                element={<NatureHubPage />} />
            {/* Sprint N — Social & Human Capital */}
            <Route path="/board-diversity"           element={<BoardDiversityPage />} />
            <Route path="/living-wage"               element={<LivingWagePage />} />
            <Route path="/human-rights-dd"           element={<HumanRightsDDPage />} />
            <Route path="/employee-wellbeing"        element={<EmployeeWellbeingPage />} />
            <Route path="/social-impact"             element={<SocialImpactPage />} />
            <Route path="/social-hub"                element={<SocialHubPage />} />
            {/* Sprint O — Sovereign & Macro ESG */}
            <Route path="/sovereign-esg"             element={<SovereignEsgPage />} />
            <Route path="/climate-policy"            element={<ClimatePolicyPage />} />
            <Route path="/macro-transition"          element={<MacroTransitionPage />} />
            <Route path="/just-transition"           element={<JustTransitionPage />} />
            <Route path="/paris-alignment"           element={<ParisAlignmentPage />} />
            <Route path="/sovereign-hub"             element={<SovereignHubPage />} />
            {/* Sprint P — Data Infrastructure */}
            <Route path="/api-orchestration"         element={<ApiOrchestrationPage />} />
            <Route path="/data-quality-monitor"      element={<DataQualityMonitorPage />} />
            <Route path="/live-feed-manager"         element={<LiveFeedManagerPage />} />
            <Route path="/data-lineage"              element={<DataLineagePage />} />
            <Route path="/brsr-bridge"               element={<BrsrBridgePage />} />
            <Route path="/data-infra-hub"            element={<DataInfraHubPage />} />
            {/* Sprint Q — Taxonomy & Classification */}
            <Route path="/eu-taxonomy-engine"        element={<EuTaxonomyEnginePage />} />
            <Route path="/sfdr-classification"       element={<SfdrClassificationPage />} />
            <Route path="/issb-materiality"          element={<IssbMaterialityPage />} />
            <Route path="/gri-alignment"             element={<GriAlignmentPage />} />
            <Route path="/framework-interop"         element={<FrameworkInteropPage />} />
            <Route path="/taxonomy-hub"              element={<TaxonomyHubPage />} />
            {/* Sprint R — Client & Reporting Automation */}
            <Route path="/report-generator"          element={<ReportGeneratorPage />} />
            <Route path="/template-manager"          element={<TemplateManagerPage />} />
            <Route path="/client-portal"             element={<ClientPortalPage />} />
            <Route path="/scheduled-reports"         element={<ScheduledReportsPage />} />
            <Route path="/regulatory-submission"     element={<RegulatorySubmissionPage />} />
            <Route path="/reporting-hub"             element={<ReportingHubPage />} />
            {/* Sprint S — Data Management Engine */}
            <Route path="/data-validation"           element={<DataValidationPage />} />
            <Route path="/data-reconciliation"       element={<DataReconciliationPage />} />
            <Route path="/data-versioning"           element={<DataVersioningPage />} />
            <Route path="/etl-pipeline"              element={<EtlPipelinePage />} />
            <Route path="/data-governance"           element={<DataGovernancePage />} />
            <Route path="/dme-hub"                   element={<DmeHubPage />} />
            {/* Sprint U — DME Platform Integration */}
            <Route path="/dme-dashboard"     element={<DmeDashboardPage />} />
            <Route path="/dme-risk-engine"   element={<DmeRiskEnginePage />} />
            <Route path="/dme-entity"        element={<DmeEntityPage />} />
            <Route path="/dme-scenarios"     element={<DmeScenariosPage />} />
            <Route path="/dme-alerts"        element={<DmeAlertsPage />} />
            <Route path="/dme-contagion"     element={<DmeContagionPage />} />
            <Route path="/dme-portfolio"     element={<DmePortfolioPage />} />
            <Route path="/dme-competitive"   element={<DmeCompetitivePage />} />
            {/* Sprint T — Dynamic Materiality Engine */}
            {/* double-materiality route already exists from Sprint 35 (line 801) */}
            <Route path="/stakeholder-impact"        element={<StakeholderImpactPage />} />
            <Route path="/materiality-trends"        element={<MaterialityTrendsPage />} />
            <Route path="/controversy-materiality"   element={<ControversyMaterialityPage />} />
            <Route path="/materiality-scenarios"     element={<MaterialityScenariosPage />} />
            <Route path="/materiality-hub"           element={<MaterialityHubPage />} />
            {/* Sprint X — Impact Measurement & SDG Finance */}
            <Route path="/impact-weighted-accounts"  element={<ImpactWeightedAccountsPage />} />
            <Route path="/iris-metrics"              element={<IrisMetricsPage />} />
            <Route path="/sdg-bond-impact"           element={<SdgBondImpactPage />} />
            <Route path="/blended-finance"           element={<BlendedFinancePage />} />
            <Route path="/impact-verification"       element={<ImpactVerificationPage />} />
            <Route path="/impact-hub"                element={<ImpactHubPage />} />
            {/* Sprint Z — Consumer Carbon Intelligence */}
            <Route path="/integrated-carbon-emissions" element={<IntegratedCarbonEmissionsPage />} />
            <Route path="/carbon-calculator"          element={<CarbonCalculatorPage />} />
            <Route path="/carbon-wallet"              element={<CarbonWalletPage />} />
            <Route path="/invoice-parser"             element={<InvoiceParserPage />} />
            <Route path="/spending-carbon"            element={<SpendingCarbonPage />} />
            <Route path="/carbon-economy"             element={<CarbonEconomyPage />} />
            <Route path="/consumer-carbon-hub"        element={<ConsumerCarbonHubPage />} />
            {/* Sprint W — AI & NLP Analytics */}
            <Route path="/esg-report-parser"       element={<EsgReportParserPage />} />
            <Route path="/predictive-esg"          element={<PredictiveEsgPage />} />
            <Route path="/anomaly-detection"       element={<AnomalyDetectionPage />} />
            <Route path="/ai-engagement"           element={<AiEngagementPage />} />
            <Route path="/document-similarity"     element={<DocumentSimilarityPage />} />
            <Route path="/ai-hub"                  element={<AiHubPage />} />
            {/* Sprint Y — Commodity Lifecycle Intelligence */}
            <Route path="/commodity-intelligence"     element={<CommodityIntelligencePage />} />
            <Route path="/commodity-inventory"        element={<CommodityInventoryPage />} />
            <Route path="/lifecycle-assessment"       element={<LifecycleAssessmentPage />} />
            <Route path="/financial-flow"             element={<FinancialFlowPage />} />
            <Route path="/esg-value-chain"            element={<EsgValueChainPage />} />
            <Route path="/climate-nature-repo"        element={<ClimateNatureRepoPage />} />
            <Route path="/multi-factor-integration"   element={<MultiFactorIntegrationPage />} />
            <Route path="/commodity-hub"              element={<CommodityHubPage />} />
            <Route path="/product-anatomy"            element={<ProductAnatomyPage />} />
            <Route path="/epd-lca-database"           element={<EpdLcaDatabasePage />} />
            {/* Sprint AI — Corporate Decarbonisation & SBTi Intelligence */}
            <Route path="/decarbonisation-hub"         element={<DecarbonisationHubPage />} />
            <Route path="/sbti-target-setter"          element={<SbtiTargetSetterPage />} />
            <Route path="/decarbonisation-roadmap"     element={<DecarbonisationRoadmapPage />} />
            <Route path="/abatement-cost-curve"        element={<AbatementCostCurvePage />} />
            <Route path="/energy-transition-analytics" element={<EnergyTransitionAnalyticsPage />} />
            <Route path="/carbon-reduction-projects"   element={<CarbonReductionProjectsPage />} />
            {/* Sprint AJ — Financed Emissions & Climate Banking Analytics */}
            <Route path="/climate-banking-hub"           element={<ClimateBankingHubPage />} />
            <Route path="/pcaf-financed-emissions"       element={<PcafFinancedEmissionsPage />} />
            <Route path="/climate-stress-test"           element={<ClimateStressTestPage />} />
            <Route path="/green-asset-ratio"             element={<GreenAssetRatioPage />} />
            <Route path="/portfolio-temperature-score"   element={<PortfolioTemperatureScorePage />} />
            <Route path="/climate-credit-risk-analytics" element={<ClimateCreditRiskPage />} />
            {/* Sprint AV — Geopolitical Risk & Climate Security Intelligence */}
            {/* Platform Administration */}
            <Route path="/data-source-manager"       element={<DataSourceManagerPage />} />
            <Route path="/db-explorer"               element={<DbExplorerPage />} />
            <Route path="/user-role-management"      element={<UserRoleManagementPage />} />
            <Route path="/audit-trail-viewer"        element={<AuditTrailViewerPage />} />
            <Route path="/api-gateway-monitor"       element={<ApiGatewayMonitorPage />} />
            <Route path="/data-quality-dashboard"    element={<DataQualityDashboardPage />} />
            <Route path="/calculation-engine-monitor" element={<CalculationEngineMonitorPage />} />
            <Route path="/platform-settings"         element={<PlatformSettingsPage />} />
            <Route path="/geopolitical-esg-hub"          element={<GeopoliticalEsgHubPage />} />
            <Route path="/sanctions-climate-finance"     element={<SanctionsClimateFinancePage />} />
            <Route path="/energy-security-transition"    element={<EnergySecurityTransitionPage />} />
            <Route path="/critical-mineral-geopolitics"  element={<CriticalMineralGeopoliticsPage />} />
            <Route path="/trade-carbon-policy"           element={<TradeCarbonPolicyPage />} />
            <Route path="/climate-migration-risk"        element={<ClimateMigrationRiskPage />} />
            {/* Sprint AU — Climate & Health Nexus Finance */}
            <Route path="/climate-health-hub"           element={<ClimateHealthHubPage />} />
            <Route path="/heat-mortality-risk"          element={<HeatMortalityRiskPage />} />
            <Route path="/air-quality-finance"          element={<AirQualityFinancePage />} />
            <Route path="/pandemic-climate-nexus"       element={<PandemicClimateNexusPage />} />
            <Route path="/health-adaptation-finance"    element={<HealthAdaptationFinancePage />} />
            <Route path="/worker-heat-stress"           element={<WorkerHeatStressPage />} />
            {/* Sprint AT — Food Systems & Agricultural Finance */}
            <Route path="/agri-finance-hub"             element={<AgriFinanceHubPage />} />
            <Route path="/regenerative-agriculture"     element={<RegenerativeAgriculturePage />} />
            <Route path="/food-supply-chain-emissions"  element={<FoodSupplyChainEmissionsPage />} />
            <Route path="/water-agriculture-risk"       element={<WaterAgricultureRiskPage />} />
            <Route path="/land-use-carbon"              element={<LandUseCarbonPage />} />
            <Route path="/agri-biodiversity"            element={<AgriBiodiversityPage />} />
            {/* Sprint AS — Real Estate & Built Environment ESG */}
            <Route path="/real-estate-esg-hub"          element={<RealEstateEsgHubPage />} />
            <Route path="/building-energy-performance"  element={<BuildingEnergyPerformancePage />} />
            <Route path="/green-building-certification" element={<GreenBuildingCertificationPage />} />
            <Route path="/embodied-carbon"              element={<EmbodiedCarbonPage />} />
            <Route path="/climate-resilient-design"     element={<ClimateResilientDesignPage />} />
            <Route path="/tenant-engagement-esg"        element={<TenantEngagementEsgPage />} />
            {/* Sprint AR — Insurance & Underwriting Climate Analytics */}
            <Route path="/insurance-climate-hub"        element={<InsuranceClimateHubPage />} />
            <Route path="/catastrophe-modelling"        element={<CatastropheModellingPage />} />
            <Route path="/underwriting-esg"             element={<UnderwritingEsgPage />} />
            <Route path="/parametric-insurance"         element={<ParametricInsurancePage />} />
            <Route path="/reinsurance-climate"          element={<ReinsuranceClimatePage />} />
            <Route path="/insurance-transition"         element={<InsuranceTransitionPage />} />
            {/* Sprint AQ — Sovereign ESG & Country-Level Climate Risk Intelligence */}
            <Route path="/sovereign-esg-hub"             element={<SovereignEsgHubPage />} />
            <Route path="/sovereign-climate-risk"        element={<SovereignClimateRiskPage />} />
            <Route path="/sovereign-debt-sustainability" element={<SovereignDebtSustainabilityPage />} />
            <Route path="/central-bank-climate"          element={<CentralBankClimatePage />} />
            <Route path="/sovereign-nature-risk"         element={<SovereignNatureRiskPage />} />
            <Route path="/sovereign-social-index"        element={<SovereignSocialIndexPage />} />
            {/* Sprint AP — Supply Chain ESG & Scope 3 Value Chain Intelligence */}
            <Route path="/supply-chain-esg-hub"       element={<SupplyChainEsgHubPage />} />
            <Route path="/scope3-upstream-tracker"    element={<Scope3UpstreamTrackerPage />} />
            <Route path="/supplier-engagement"        element={<SupplierEngagementPage />} />
            <Route path="/commodity-deforestation"    element={<CommodityDeforestationPage />} />
            <Route path="/conflict-minerals"          element={<ConflictMineralsPage />} />
            <Route path="/supply-chain-resilience"    element={<SupplyChainResiliencePage />} />
            {/* Sprint AO — Scope 4 / Avoided Emissions & Climate Solutions */}
            <Route path="/avoided-emissions-hub"       element={<AvoidedEmissionsHubPage />} />
            <Route path="/scope4-avoided-emissions"    element={<Scope4AvoidedEmissionsPage />} />
            <Route path="/product-carbon-handprint"    element={<ProductCarbonHandprintPage />} />
            <Route path="/enablement-methodology"      element={<EnablementMethodologyPage />} />
            <Route path="/avoided-emissions-portfolio" element={<AvoidedEmissionsPortfolioPage />} />
            <Route path="/climate-solution-taxonomy"   element={<ClimateSolutionTaxonomyPage />} />
            {/* Sprint AN — Sustainable Transport & Logistics Decarbonisation */}
            <Route path="/sustainable-transport-hub"  element={<SustainableTransportHubPage />} />
            <Route path="/maritime-imo-compliance"    element={<MaritimeImoCompliancePage />} />
            <Route path="/aviation-corsia"            element={<AviationCorsiaPage />} />
            <Route path="/ev-fleet-finance"           element={<EvFleetFinancePage />} />
            <Route path="/sustainable-aviation-fuel"  element={<SustainableAviationFuelPage />} />
            <Route path="/transport-decarbonisation"  element={<TransportDecarbonisationPage />} />
            {/* Sprint AM — Climate Fintech & Digital MRV Intelligence */}
            <Route path="/climate-fintech-hub"        element={<ClimateFintechHubPage />} />
            <Route path="/digital-mrv"                element={<DigitalMrvPage />} />
            <Route path="/satellite-climate-monitor"  element={<SatelliteClimateMonitorPage />} />
            <Route path="/blockchain-carbon-registry" element={<BlockchainCarbonRegistryPage />} />
            <Route path="/climate-data-marketplace"   element={<ClimateDataMarketplacePage />} />
            <Route path="/iot-emissions-tracker"      element={<IotEmissionsTrackerPage />} />
            {/* Sprint BP — Equitable Earth Methodologies */}
            <Route path="/equitable-earth-methodologies" element={<EquitableEarthMethodologiesPage />} />
            {/* Sprint BO — Critical Minerals · Battery & EV Analytics · ET Commodity Risk */}
            <Route path="/battery-ev-analytics"   element={<BatteryEVAnalyticsPage />} />
            <Route path="/et-commodity-risk"       element={<ETCommodityRiskPage />} />
            {/* Sprint BN — VCM Registry Analytics · Carbon Forward Curve · Credit Integrity DD */}
            <Route path="/vcm-registry-analytics" element={<VcmRegistryAnalyticsPage />} />
            <Route path="/carbon-forward-curve"   element={<CarbonForwardCurvePage />} />
            <Route path="/credit-integrity-dd"    element={<CreditIntegrityDDPage />} />
            {/* Sprint BM — NatCat Loss Engine · Cat Bond & ILS · Insurance Protection Gap */}
            <Route path="/natcat-loss-engine"        element={<NatCatLossEnginePage />} />
            <Route path="/cat-bond-ils"              element={<CatBondILSPage />} />
            <Route path="/insurance-protection-gap"  element={<InsuranceProtectionGapPage />} />
            {/* Sprint BL — ML Risk Scorer · NLP Disclosure Parser · Predictive Analytics Hub */}
            <Route path="/ml-risk-scorer"          element={<MLRiskScorerPage />} />
            <Route path="/nlp-disclosure-parser"   element={<NLPDisclosureParserPage />} />
            <Route path="/predictive-analytics-hub" element={<PredictiveAnalyticsHubPage2 />} />
            {/* Sprint BK — Asset Valuation Engine · Infrastructure Valuation · Real Estate Valuation */}
            <Route path="/asset-valuation-engine"   element={<AssetValuationEnginePage />} />
            <Route path="/infrastructure-valuation" element={<InfrastructureValuationPage />} />
            <Route path="/real-estate-valuation"    element={<RealEstateValuationPage />} />
            {/* Sprint BJ — NGFS×IEA Scenario Engine · Climate-Credit Integration */}
            <Route path="/ngfs-iea-scenario"          element={<NgfsIeaScenarioPage />} />
            <Route path="/climate-credit-integration" element={<ClimateCreditIntegrationPage />} />
            {/* Sprint BI — Credit Risk Analytics · Platform Analytics Dashboard */}
            <Route path="/credit-risk-analytics" element={<CreditRiskAnalyticsPage />} />
            <Route path="/platform-analytics"    element={<PlatformAnalyticsPage />} />
            {/* Sprint BH — DB Migration Console · Multi-Tenancy & Org Management */}
            <Route path="/db-migration-console"  element={<DbMigrationConsolePage />} />
            <Route path="/multi-tenancy-audit"   element={<MultiTenancyAuditPage />} />
            {/* Sprint BG — SBTi Registry & Climate TRACE · Sanctions & Watchlist Intelligence */}
            <Route path="/sbti-climate-trace"   element={<SbtiClimateTracePage />} />
            <Route path="/sanctions-watchlist"  element={<SanctionsWatchlistPage />} />
            {/* Sprint BF — Data Hub Ingester Monitor · OWID CO₂ & EVIC Analytics */}
            <Route path="/data-hub-ingester"   element={<DataHubIngesterPage />} />
            <Route path="/owid-evic-analytics" element={<OwIdEvicAnalyticsPage />} />
            {/* Sprint BE — DME Financial Risk · DME PD Engine · DME Dynamic Materiality Index */}
            <Route path="/dme-financial-risk" element={<DmeFinancialRiskPage />} />
            <Route path="/dme-pd-engine"      element={<DmePdEnginePage />} />
            <Route path="/dme-index"          element={<DmeIndexPage />} />
            {/* Sprint BD — Greenium Signal Engine · Sentiment Pipeline Engine */}
            <Route path="/greenium-signal"    element={<GreeniumSignalPage />} />
            <Route path="/sentiment-pipeline" element={<SentimentPipelinePage />} />
            {/* Sprint BC — Residential RE Assessment · XBRL Ingestion */}
            <Route path="/residential-re-assessment" element={<ResidentialReAssessmentPage />} />
            <Route path="/xbrl-ingestion"            element={<XbrlIngestionPage />} />
            {/* Sprint BB — PE Deal Pipeline · Technology Risk */}
            <Route path="/pe-deal-pipeline"  element={<PeDealPipelinePage />} />
            <Route path="/technology-risk"   element={<TechnologyRiskPage />} />
            {/* Sprint BA — Sovereign Climate Risk Intelligence · SEC Climate Disclosure */}
            <Route path="/sovereign-climate-intelligence" element={<SovereignClimateIntelligencePage />} />
            <Route path="/sec-climate-disclosure"         element={<SecClimateDisclosurePage />} />
            {/* Sprint AZ — Double Materiality Workshop · SFDR PAI Dashboard · XBRL Export Wizard */}
            <Route path="/double-materiality-workshop" element={<DoubleMaterialityWorkshopPage />} />
            <Route path="/sfdr-pai-dashboard"          element={<SfdrPaiDashboardPage />} />
            <Route path="/xbrl-export-wizard"          element={<XbrlExportWizardPage />} />
            {/* Sprint AY — EUDR Engine · CSDDD Engine · Entity 360 Intelligence */}
            <Route path="/eudr-engine"  element={<EudrEnginePage />} />
            <Route path="/csddd-engine" element={<CsdddEnginePage />} />
            <Route path="/entity-360"   element={<Entity360Page />} />
            {/* Sprint AX — Sovereign & Country Climate Risk Intelligence (new modules) */}
            <Route path="/sovereign-esg-scorer"     element={<SovereignEsgScorerPage />} />
            <Route path="/ndc-alignment-tracker"    element={<NdcAlignmentTrackerPage />} />
            <Route path="/sovereign-physical-risk"  element={<SovereignPhysicalRiskPage />} />
            <Route path="/em-debt-climate-risk"     element={<EmDebtClimateRiskPage />} />
            <Route path="/mdb-climate-finance"      element={<MdbClimateFinancePage />} />
            {/* Sprint AL — Transition Planning & Net Zero Alignment */}
            <Route path="/transition-planning-hub"     element={<TransitionPlanningHubPage />} />
            <Route path="/transition-plan-builder"     element={<TransitionPlanBuilderPage />} />
            <Route path="/gfanz-sector-pathways"       element={<GfanzSectorPathwaysPage />} />
            <Route path="/act-assessment"              element={<ActAssessmentPage />} />
            <Route path="/net-zero-commitment-tracker" element={<NetZeroCommitmentTrackerPage />} />
            <Route path="/transition-credibility"      element={<TransitionCredibilityPage />} />
            {/* Sprint AK — ESG Ratings Intelligence & Provider Analytics */}
            <Route path="/esg-ratings-hub"             element={<EsgRatingsHubPage />} />
            <Route path="/esg-ratings-comparator"      element={<EsgRatingsComparatorPage />} />
            <Route path="/ratings-methodology-decoder" element={<RatingsMethodologyDecoderPage />} />
            <Route path="/ratings-migration-momentum"  element={<RatingsMigrationMomentumPage />} />
            <Route path="/controversy-rating-impact"   element={<ControversyRatingImpactPage />} />
            <Route path="/greenwashing-detector"       element={<GreenwashingDetectorPage />} />
            {/* Sprint AH — Regulatory Reporting & Disclosure Automation */}
            <Route path="/disclosure-hub"       element={<DisclosureHubPage />} />
            <Route path="/csrd-esrs-automation" element={<CsrdEsrsAutomationPage />} />
            <Route path="/sfdr-v2-reporting"    element={<SfdrV2ReportingPage />} />
            <Route path="/issb-disclosure"      element={<IssbDisclosurePage />} />
            <Route path="/uk-sdr"               element={<UkSdrPage />} />
            <Route path="/sec-climate-rule"     element={<SecClimateRulePage />} />
            {/* Sprint AG — Private Markets & Alternative Credit ESG */}
            <Route path="/private-markets-esg-hub" element={<PrivateMarketsEsgHubPage />} />
            <Route path="/pe-esg-diligence"        element={<PeEsgDiligencePage />} />
            <Route path="/private-credit-climate" element={<PrivateCreditClimatePage />} />
            <Route path="/infrastructure-esg"     element={<InfrastructureEsgPage />} />
            <Route path="/real-assets-climate"    element={<RealAssetsClimatePage />} />
            <Route path="/vc-impact"              element={<VcImpactPage />} />
            {/* Sprint AF — Quantitative ESG & Portfolio Intelligence */}
            <Route path="/esg-portfolio-optimizer"    element={<EsgPortfolioOptimizerPage />} />
            <Route path="/carbon-aware-allocation"    element={<CarbonAwareAllocationPage />} />
            <Route path="/esg-momentum-scanner"       element={<EsgMomentumScannerPage />} />
            <Route path="/net-zero-portfolio-builder" element={<NetZeroPortfolioBuilderPage />} />
            <Route path="/esg-factor-alpha"           element={<EsgFactorAlphaPage />} />
            <Route path="/quant-esg-hub"              element={<QuantEsgHubPage />} />
            {/* Sprint AE — Corporate Governance & Executive Intelligence */}
            <Route path="/board-composition"          element={<BoardCompositionPage />} />
            <Route path="/executive-pay-analytics"    element={<ExecutivePayAnalyticsPage />} />
            <Route path="/shareholder-activism"       element={<ShareholderActivismPage />} />
            <Route path="/anti-corruption"            element={<AntiCorruptionPage />} />
            <Route path="/proxy-voting-intel"         element={<ProxyVotingIntelPage />} />
            <Route path="/diversity-equity-inclusion" element={<DiversityEquityInclusionPage />} />
            {/* Sprint AD — Social & Just Transition */}
            <Route path="/just-transition-finance"  element={<JustTransitionFinancePage />} />
            <Route path="/human-rights-risk"        element={<HumanRightsRiskPage />} />
            <Route path="/living-wage-tracker"      element={<LivingWageTrackerPage />} />
            <Route path="/modern-slavery-intel"     element={<ModernSlaveryIntelPage />} />
            <Route path="/community-impact"         element={<CommunityImpactPage />} />
            <Route path="/workplace-health-safety"  element={<WorkplaceHealthSafetyPage />} />
            {/* Sprint AC — Nature, Environment & Physical Risk */}
            <Route path="/nature-loss-risk"         element={<NatureLossRiskPage />} />
            <Route path="/water-risk-analytics"     element={<WaterRiskAnalyticsPage />} />
            <Route path="/land-use-deforestation"   element={<LandUseDeforestationPage />} />
            <Route path="/ocean-marine-risk"        element={<OceanMarineRiskPage />} />
            <Route path="/circular-economy-tracker" element={<CircularEconomyTrackerPage />} />
            <Route path="/air-quality-health-risk"  element={<AirQualityHealthRiskPage />} />
            {/* Sprint AB — Macro & Systemic Risk Intelligence */}
            <Route path="/systemic-esg-risk"            element={<SystemicESGRiskPage />} />
            <Route path="/climate-policy-intelligence"  element={<ClimatePolicyIntelligencePage />} />
            <Route path="/green-central-banking"        element={<GreenCentralBankingPage />} />
            <Route path="/esg-factor-attribution"       element={<ESGFactorAttributionPage />} />
            <Route path="/transition-scenario-modeller" element={<TransitionScenarioModellerPage />} />
            <Route path="/cross-asset-contagion"        element={<CrossAssetContagionPage />} />
            {/* Sprint AA — Climate Finance Architecture */}
            <Route path="/climate-finance-hub"       element={<ClimateFinanceHubPage />} />
            <Route path="/article6-markets"          element={<Article6MarketsPage />} />
            <Route path="/cbam-compliance"           element={<CbamCompliancePage />} />
            <Route path="/climate-finance-tracker"   element={<ClimateFinanceTrackerPage />} />
            <Route path="/green-taxonomy-navigator"  element={<GreenTaxonomyNavigatorPage />} />
            <Route path="/climate-sovereign-bonds"   element={<ClimateSovereignBondsPage />} />
            {/* Sprint V — Governance & Audit Trail */}
            <Route path="/audit-trail"              element={<AuditTrailPage />} />
            <Route path="/model-governance"         element={<ModelGovernancePage />} />
            <Route path="/approval-workflows"       element={<ApprovalWorkflowsPage />} />
            <Route path="/compliance-evidence"      element={<ComplianceEvidencePage />} />
            <Route path="/change-management"        element={<ChangeManagementPage />} />
            <Route path="/governance-hub"           element={<GovernanceHubPage />} />
            <Route path="/corporate-governance"     element={<CorporateGovernancePage />} />
            <Route path="/geopolitical-ai-gov"      element={<GeopoliticalAiGovPage />} />
            {/* Sprint D — Platform Intelligence */}
            <Route path="/stranded-assets"        element={<StrandedAssetsPage />} />
            <Route path="/ngfs-scenarios"        element={<NGFSScenariosPage />} />
            <Route path="/portfolio-climate-var" element={<PortfolioClimateVaRPage />} />
            <Route path="/pipeline-dashboard"    element={<PipelineDashboardPage />} />
            <Route path="/csrd-ixbrl"            element={<CSRDiXBRLPage />} />
            <Route path="/company-profiles"      element={<CompanyProfilesPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
            </Suspense>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}

export default function App() {
  return (
    <TestDataProvider>
      <CompanyEnrichmentProvider>
        <PortfolioProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </PortfolioProvider>
      </CompanyEnrichmentProvider>
    </TestDataProvider>
  );
}
