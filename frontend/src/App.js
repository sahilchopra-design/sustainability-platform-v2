import React, { useState, useMemo, useEffect, Suspense } from 'react';
if (typeof window !== 'undefined') { window.__DEPLOY_MARKER__ = "ZULU_7734_CHECK_ME"; }
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TestDataProvider } from './context/TestDataContext';
import { CompanyEnrichmentProvider } from './context/CompanyEnrichmentContext';
import { PortfolioProvider } from './context/PortfolioContext';
import { CarbonCreditProvider } from './context/CarbonCreditContext';
import { ClimateRiskProvider } from './context/ClimateRiskContext';
import { GuidedModeProvider } from './context/GuidedModeContext';
import GuidedModeOverlay from './components/GuidedModeOverlay';
import GuidedModeToggle from './components/GuidedModeToggle';
import CountryDatasetSelector from './components/CountryDatasetSelector';
import { DataDepthProvider } from './context/DataDepthContext';
import { CedaProvider } from './contexts/CedaContext';
import { BigClimateDbProvider } from './contexts/BigClimateDbContext';
import { DataCaptureProvider } from './contexts/DataCaptureContext';
import { ReferenceDataProvider } from './contexts/ReferenceDataContext';
import DataDepthOverlay from './components/DataDepthOverlay';
import DataDepthToggle from './components/DataDepthToggle';
import SectorSidebar from './components/nav/SectorSidebar';
import CommandPalette, { CommandPaletteTrigger } from './components/nav/CommandPalette';
import ConnectedModulesPanel from './components/nav/ConnectedModulesPanel';
import { NAV_GROUPS, ALL_ITEMS, PASTEL } from './navGroups';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AUTO_ROUTES, AUTO_NAV, AUTO_PATHS } from './moduleRegistry.auto';
import DemoBanner from './components/auth/DemoBanner';
import ProtectedRoute from './components/auth/ProtectedRoute';
const LoginPage = React.lazy(() => import('./features/auth/pages/LoginPage'));
const InviteAcceptPage = React.lazy(() => import('./features/auth/pages/InviteAcceptPage'));
const AccessExpiredPage = React.lazy(() => import('./features/auth/pages/AccessExpiredPage'));
const AdminPanelPage = React.lazy(() => import('./features/admin-panel/pages/AdminPanelPage'));
import ModuleNavigatorPage from './features/module-navigator/pages/ModuleNavigatorPage';

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
// India Regulatory Intelligence
const RbiClimateRiskPage = React.lazy(() => import("./features/rbi-climate-risk/pages/RbiClimateRiskPage"));
const IndiaCctsPage = React.lazy(() => import("./features/india-ccts/pages/IndiaCctsPage"));
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
const PortfolioClimateVaRPage = React.lazy(() => import("./features/portfolio-climate-var/pages/PortfolioClimateVaRPage"));
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
// Sprint Q-Extended — ML-Driven Taxonomy · Capital Markets · FI · Carbon · Energy · Global Interop v2
const TaxonomyMlClassifierPage = React.lazy(() => import("./features/taxonomy-ml-classifier/pages/TaxonomyMlClassifierPage"));
const CapitalMarketsTaxonomyPage = React.lazy(() => import("./features/capital-markets-taxonomy/pages/CapitalMarketsTaxonomyPage"));
const FiTaxonomyPcafBridgePage = React.lazy(() => import("./features/fi-taxonomy-pcaf-bridge/pages/FiTaxonomyPcafBridgePage"));
const CarbonInstitutionsTaxonomyPage = React.lazy(() => import("./features/carbon-institutions-taxonomy/pages/CarbonInstitutionsTaxonomyPage"));
const EnergySectorTaxonomyPage = React.lazy(() => import("./features/energy-sector-taxonomy/pages/EnergySectorTaxonomyPage"));
const GlobalTaxonomyInteropV2Page = React.lazy(() => import("./features/global-taxonomy-interop-v2/pages/GlobalTaxonomyInteropV2Page"));
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
// Sprint U-Extended — DME ML & NLP Intelligence
const DmeNlpEnginePage      = React.lazy(() => import("./features/dme-nlp-engine/pages/DmeNlpEnginePage"));
const DmeMlMaterialityPage  = React.lazy(() => import("./features/dme-ml-materiality/pages/DmeMlMaterialityPage"));
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
// EP-MEI1 — Macro ESG Intelligence
const MacroESGIntelligencePage = React.lazy(() => import("./features/macro-esg-intelligence/pages/MacroESGIntelligencePage"));
// Sprint W — AI & NLP Analytics
const QuantitativeNLPResearchPage = React.lazy(() => import("./features/quantitative-nlp-research/pages/QuantitativeNLPResearchPage"));
const AIDataLivePlatformPage = React.lazy(() => import("./features/ai-data-live-platform/pages/AIDataLivePlatformPage"));
const ClimateEmissionsIntelligencePage = React.lazy(() => import("./features/climate-emissions-intelligence/pages/ClimateEmissionsIntelligencePage"));
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
// Sprint BZ — Advanced Predictive & Agentic Analytics
const ESGTimeSeriesForecasterPage  = React.lazy(() => import("./features/esg-time-series-forecaster/pages/ESGTimeSeriesForecasterPage"));
const SentimentAlphaEnginePage     = React.lazy(() => import("./features/sentiment-alpha-engine/pages/SentimentAlphaEnginePage"));
const AIComplianceAgentPage        = React.lazy(() => import("./features/ai-compliance-agent/pages/AIComplianceAgentPage"));
// Sprint BY — AI Intelligence Layer (LLM Extraction · Greenwashing · Narrative Arc)
const LLMESGExtractorPage          = React.lazy(() => import("./features/llm-esg-extractor/pages/LLMESGExtractorPage"));
const GreenwashingDetectionPage    = React.lazy(() => import("./features/greenwashing-detection/pages/GreenwashingDetectionPage"));
const ESGNarrativeIntelligencePage = React.lazy(() => import("./features/esg-narrative-intelligence/pages/ESGNarrativeIntelligencePage"));
// Sprint BX — Quantitative Physical Risk Engine
const PhysicalHazardMapPage         = React.lazy(() => import("./features/physical-hazard-map/pages/PhysicalHazardMapPage"));
const DamageFunctionCalculatorPage  = React.lazy(() => import("./features/damage-function-calculator/pages/DamageFunctionCalculatorPage"));
const PhysicalRiskPortfolioPage     = React.lazy(() => import("./features/physical-risk-portfolio/pages/PhysicalRiskPortfolioPage"));
// Sprint CA — Transition Risk DCF & Stranded Assets & Tech Displacement
const TransitionRiskDcfPage         = React.lazy(() => import("./features/transition-risk-dcf/pages/TransitionRiskDcfPage"));
const StrandedAssetAnalyzerPage     = React.lazy(() => import("./features/stranded-asset-analyzer/pages/StrandedAssetAnalyzerPage"));
const TechDisplacementModelerPage   = React.lazy(() => import("./features/tech-displacement-modeler/pages/TechDisplacementModelerPage"));
// Sprint CB — Sector Scorecard · Just Transition · Policy Impact
const SectorTransitionScorecardPage = React.lazy(() => import("./features/sector-transition-scorecard/pages/SectorTransitionScorecardPage"));
const JustTransitionIntelligencePage= React.lazy(() => import("./features/just-transition-intelligence/pages/JustTransitionIntelligencePage"));
const PolicyRegulatoryImpactPage    = React.lazy(() => import("./features/policy-regulatory-impact/pages/PolicyRegulatoryImpactPage"));
// Sprint CC — Portfolio Alignment · Financed Emissions · Transition Finance Screener
const PortfolioTransitionAlignmentPage = React.lazy(() => import("./features/portfolio-transition-alignment/pages/PortfolioTransitionAlignmentPage"));
const FinancedEmissionsAttributorPage  = React.lazy(() => import("./features/financed-emissions-attributor/pages/FinancedEmissionsAttributorPage"));
const TransitionFinanceScreenerPage    = React.lazy(() => import("./features/transition-finance-screener/pages/TransitionFinanceScreenerPage"));
// Sprint CD — Multi-Dim Scorer · Heatmap · Carbon Footprint
const MultiDimTransitionScorerPage  = React.lazy(() => import("./features/multi-dim-transition-scorer/pages/MultiDimTransitionScorerPage"));
const TransitionRiskHeatmapPage     = React.lazy(() => import("./features/transition-risk-heatmap/pages/TransitionRiskHeatmapPage"));
const CarbonFootprintIntelligencePage= React.lazy(() => import("./features/carbon-footprint-intelligence/pages/CarbonFootprintIntelligencePage"));
// Sprint CE — Climate VaR · Transition Dashboard · Reg Reporting
const ClimateVarEnginePage          = React.lazy(() => import("./features/climate-var-engine/pages/ClimateVarEnginePage"));
const TransitionRiskDashboardPage   = React.lazy(() => import("./features/transition-risk-dashboard/pages/TransitionRiskDashboardPage"));
const TransitionRegReportingPage    = React.lazy(() => import("./features/transition-reg-reporting/pages/TransitionRegReportingPage"));
// Sprint CF — Climate Adaptation & Resilience Intelligence
const ClimateAdaptationPathwaysPage = React.lazy(() => import("./features/climate-adaptation-pathways/pages/ClimateAdaptationPathwaysPage"));
const InfrastructureResilienceScorerPage = React.lazy(() => import("./features/infrastructure-resilience-scorer/pages/InfrastructureResilienceScorerPage"));
const NatureBasedAdaptationPage     = React.lazy(() => import("./features/nature-based-adaptation/pages/NatureBasedAdaptationPage"));
// Sprint CG — Physical-Transition Risk Integration
const PhysicalTransitionNexusPage   = React.lazy(() => import("./features/physical-transition-nexus/pages/PhysicalTransitionNexusPage"));
const RegionalClimateImpactPage     = React.lazy(() => import("./features/regional-climate-impact/pages/RegionalClimateImpactPage"));
const SupplyChainContagionPage      = React.lazy(() => import("./features/supply-chain-contagion/pages/SupplyChainContagionPage"));
const PhysicalRiskEarlyWarningPage  = React.lazy(() => import("./features/physical-risk-early-warning/pages/PhysicalRiskEarlyWarningPage"));
const CompoundEventModelerPage      = React.lazy(() => import("./features/compound-event-modeler/pages/CompoundEventModelerPage"));
const ClimateRiskMigrationPage      = React.lazy(() => import("./features/climate-migration-risk/pages/ClimateRiskMigrationPage"));
// Sprint CH — Probabilistic Scenario & Monte Carlo Engine
const MonteCarloClimatePage         = React.lazy(() => import("./features/monte-carlo-climate/pages/MonteCarloClimatePage"));
const ScenarioBlendingOptimizerPage = React.lazy(() => import("./features/scenario-blending-optimizer/pages/ScenarioBlendingOptimizerPage"));
const ClimateStressTestSuitePage    = React.lazy(() => import("./features/climate-stress-test-suite/pages/ClimateStressTestSuitePage"));
const TailRiskAnalyzerPage          = React.lazy(() => import("./features/tail-risk-analyzer/pages/TailRiskAnalyzerPage"));
const ScenarioDashboardBuilderPage  = React.lazy(() => import("./features/scenario-dashboard-builder/pages/ScenarioDashboardBuilderPage"));
const RegulatoryStressSubmissionPage= React.lazy(() => import("./features/regulatory-stress-submission/pages/RegulatoryStressSubmissionPage"));
// Sprint CI — Extended Asset Class Coverage (SovereignClimateRiskPage imported above)
const PrivateAssetsTransitionPage   = React.lazy(() => import("./features/private-assets-transition/pages/PrivateAssetsTransitionPage"));
const StructuredCreditClimatePage   = React.lazy(() => import("./features/structured-credit-climate/pages/StructuredCreditClimatePage"));
const CommodityDerivativesClimatePage= React.lazy(() => import("./features/commodity-derivatives-climate/pages/CommodityDerivativesClimatePage"));
const InsurancePortfolioClimatePage = React.lazy(() => import("./features/insurance-portfolio-climate/pages/InsurancePortfolioClimatePage"));
const PcafUniversalAttributorPage   = React.lazy(() => import("./features/pcaf-universal-attributor/pages/PcafUniversalAttributorPage"));
// Sprint CJ — Emerging Market Transition Intelligence
const ChinaIndiaTransitionPage      = React.lazy(() => import("./features/china-india-transition/pages/ChinaIndiaTransitionPage"));
const AseanGccTransitionPage        = React.lazy(() => import("./features/asean-gcc-transition/pages/AseanGccTransitionPage"));
const EmCarbonCreditHubPage         = React.lazy(() => import("./features/em-carbon-credit-hub/pages/EmCarbonCreditHubPage"));
const LatamTransitionPage           = React.lazy(() => import("./features/latam-transition-engine/pages/LatamTransitionPage"));
const AfricaClimateFinancePage      = React.lazy(() => import("./features/africa-climate-finance/pages/AfricaClimateFinancePage"));
const FrontierMarketClimatePage     = React.lazy(() => import("./features/frontier-market-climate/pages/FrontierMarketClimatePage"));
// Sprint CK — Stranded Asset Dynamics v2
const VintageCohortStrandedPage     = React.lazy(() => import("./features/vintage-cohort-stranded/pages/VintageCohortStrandedPage"));
const CascadingDefaultModelerPage   = React.lazy(() => import("./features/cascading-default-modeler/pages/CascadingDefaultModelerPage"));
const StrandedRecoveryPathwaysPage  = React.lazy(() => import("./features/stranded-recovery-pathways/pages/StrandedRecoveryPathwaysPage"));
const DecommissioningCostEnginePage = React.lazy(() => import("./features/decommissioning-cost-engine/pages/DecommissioningCostEnginePage"));
const StrandedAssetWatchlistPage    = React.lazy(() => import("./features/stranded-asset-watchlist/pages/StrandedAssetWatchlistPage"));
const CovenantBreachPredictorPage   = React.lazy(() => import("./features/covenant-breach-predictor/pages/CovenantBreachPredictorPage"));
// Sprint CL — Technology & Supply Chain Disruption v2
const CriticalMineralConstraintPage = React.lazy(() => import("./features/critical-mineral-constraint/pages/CriticalMineralConstraintPage"));
const GridStabilityTransitionPage   = React.lazy(() => import("./features/grid-stability-transition/pages/GridStabilityTransitionPage"));
const HydrogenEconomyModelerPage    = React.lazy(() => import("./features/hydrogen-economy-modeler/pages/HydrogenEconomyModelerPage"));
const NuclearSmrViabilityPage       = React.lazy(() => import("./features/nuclear-smr-viability/pages/NuclearSmrViabilityPage"));
const NegativeEmissionsTechPage     = React.lazy(() => import("./features/negative-emissions-tech/pages/NegativeEmissionsTechPage"));
const TechDisruptionWatchlistPage   = React.lazy(() => import("./features/tech-disruption-watchlist/pages/TechDisruptionWatchlistPage"));
// Sprint CM — SBTi Credibility Suite
const SbtiCredibilityScorerPage     = React.lazy(() => import("./features/sbti-credibility-scorer/pages/SbtiCredibilityScorerPage"));
const TemperatureAlignmentWaterfallPage = React.lazy(() => import("./features/temperature-alignment-waterfall/pages/TemperatureAlignmentWaterfallPage"));
const NetZeroCredibilityIndexPage   = React.lazy(() => import("./features/net-zero-credibility-index/pages/NetZeroCredibilityIndexPage"));
const Scope3MaterialityEnginePage   = React.lazy(() => import("./features/scope3-materiality-engine/pages/Scope3MaterialityEnginePage"));
const TargetVsActionTrackerPage     = React.lazy(() => import("./features/target-vs-action-tracker/pages/TargetVsActionTrackerPage"));
const PeerTransitionBenchmarkerPage = React.lazy(() => import("./features/peer-transition-benchmarker/pages/PeerTransitionBenchmarkerPage"));
// Sprint CN — Carbon Credit & Offset Economics
const CarbonCreditPricingPage       = React.lazy(() => import("./features/carbon-credit-pricing/pages/CarbonCreditPricingPage"));
const OffsetPermanenceRiskPage      = React.lazy(() => import("./features/offset-permanence-risk/pages/OffsetPermanenceRiskPage"));
const CorporateOffsetOptimizerPage  = React.lazy(() => import("./features/corporate-offset-optimizer/pages/CorporateOffsetOptimizerPage"));
const CreditQualityScreenerPage     = React.lazy(() => import("./features/credit-quality-screener/pages/CreditQualityScreenerPage"));
const OffsetPortfolioTrackerPage    = React.lazy(() => import("./features/offset-portfolio-tracker/pages/OffsetPortfolioTrackerPage"));
const CarbonMarketIntelligencePage  = React.lazy(() => import("./features/carbon-market-intelligence/pages/CarbonMarketIntelligencePage"));
// Sprint CO — Advanced Just Transition
const WorkforceTransitionTrackerPage= React.lazy(() => import("./features/workforce-transition-tracker/pages/WorkforceTransitionTrackerPage"));
const SocialLicenseRiskPage         = React.lazy(() => import("./features/social-license-risk/pages/SocialLicenseRiskPage"));
const RegionalEconomicImpactPage    = React.lazy(() => import("./features/regional-economic-impact/pages/RegionalEconomicImpactPage"));
const IndigenousRightsFpicPage      = React.lazy(() => import("./features/indigenous-rights-fpic/pages/IndigenousRightsFpicPage"));
const GreenJobsPipelineTrackerPage  = React.lazy(() => import("./features/green-jobs-pipeline-tracker/pages/GreenJobsPipelineTrackerPage"));
const JustTransitionFinanceHubPage  = React.lazy(() => import("./features/just-transition-finance-hub/pages/JustTransitionFinanceHubPage"));
// Sprint CP — ESG Stewardship Analytics
const EngagementOutcomeTrackerPage  = React.lazy(() => import("./features/engagement-outcome-tracker/pages/EngagementOutcomeTrackerPage"));
const ProxyVotingClimatePage        = React.lazy(() => import("./features/proxy-voting-climate/pages/ProxyVotingClimatePage"));
const StewardshipReportGeneratorPage= React.lazy(() => import("./features/stewardship-report-generator/pages/StewardshipReportGeneratorPage"));
const ShareholderResolutionAnalyzerPage = React.lazy(() => import("./features/shareholder-resolution-analyzer/pages/ShareholderResolutionAnalyzerPage"));
const BoardClimateCompetencePage    = React.lazy(() => import("./features/board-climate-competence/pages/BoardClimateCompetencePage"));
const EsgIntegrationDashboardPage   = React.lazy(() => import("./features/esg-integration-dashboard/pages/EsgIntegrationDashboardPage"));
// Sprint CQ — Transition Finance Portfolio Construction
const GreenBondPortfolioOptimizerPage = React.lazy(() => import("./features/green-bond-portfolio-optimizer/pages/GreenBondPortfolioOptimizerPage"));
const TransitionBondCredibilityPage = React.lazy(() => import("./features/transition-bond-credibility/pages/TransitionBondCredibilityPage"));
const BlendedFinanceStructurerPage  = React.lazy(() => import("./features/blended-finance-structurer/pages/BlendedFinanceStructurerPage"));
const UndpBlendedFinancePage        = React.lazy(() => import("./features/undp-blended-finance/pages/UndpBlendedFinancePage"));
const ClimateBondIndexTrackerPage   = React.lazy(() => import("./features/climate-bond-index-tracker/pages/ClimateBondIndexTrackerPage"));
const GreenLoanFrameworkPage        = React.lazy(() => import("./features/green-loan-framework/pages/GreenLoanFrameworkPage"));
const ImpactBondAnalyticsPage       = React.lazy(() => import("./features/impact-bond-analytics/pages/ImpactBondAnalyticsPage"));
// Sprint CR — Multi-Jurisdiction Regulatory Compliance
const CsrdEsrsFullSuitePage        = React.lazy(() => import("./features/csrd-esrs-full-suite/pages/CsrdEsrsFullSuitePage"));
const GlobalDisclosureTrackerPage   = React.lazy(() => import("./features/global-disclosure-tracker/pages/GlobalDisclosureTrackerPage"));
const AssuranceReadinessEnginePage  = React.lazy(() => import("./features/assurance-readiness-engine/pages/AssuranceReadinessEnginePage"));
const XbrlClimateTaxonomyPage       = React.lazy(() => import("./features/xbrl-climate-taxonomy/pages/XbrlClimateTaxonomyPage"));
const RegulatoryChangeRadarPage     = React.lazy(() => import("./features/regulatory-change-radar/pages/RegulatoryChangeRadarPage"));
const ComplianceWorkflowAutomationPage = React.lazy(() => import("./features/compliance-workflow-automation/pages/ComplianceWorkflowAutomationPage"));
// Sprint CS — Taxonomy & Assessment Engine Core
const TransitionRiskTaxonomyBrowserPage = React.lazy(() => import("./features/transition-risk-taxonomy-browser/pages/TransitionRiskTaxonomyBrowserPage"));
const AssessmentEngineDashboardPage  = React.lazy(() => import("./features/assessment-engine-dashboard/pages/AssessmentEngineDashboardPage"));
const DataSourceRegistryPage         = React.lazy(() => import("./features/data-source-registry/pages/DataSourceRegistryPage"));
const MlTaxonomyScoringPage          = React.lazy(() => import("./features/ml-taxonomy-scoring/pages/MlTaxonomyScoringPage"));
const TaxonomyRiskReportPage         = React.lazy(() => import("./features/taxonomy-risk-report/pages/TaxonomyRiskReportPage"));
const AssessmentConfigurationPage    = React.lazy(() => import("./features/assessment-configuration/pages/AssessmentConfigurationPage"));
// Sprint CT — Financial Institution Profiler
const FiClientPortfolioAnalyzerPage  = React.lazy(() => import("./features/fi-client-portfolio-analyzer/pages/FiClientPortfolioAnalyzerPage"));
const FiInstrumentExposurePage       = React.lazy(() => import("./features/fi-instrument-exposure/pages/FiInstrumentExposurePage"));
const FiLineOfBusinessPage           = React.lazy(() => import("./features/fi-line-of-business/pages/FiLineOfBusinessPage"));
const FiRegulatoryCapitalOverlayPage = React.lazy(() => import("./features/fi-regulatory-capital-overlay/pages/FiRegulatoryCapitalOverlayPage"));
const FiConcentrationMonitorPage     = React.lazy(() => import("./features/fi-concentration-monitor/pages/FiConcentrationMonitorPage"));
const FiTransitionDashboardPage      = React.lazy(() => import("./features/fi-transition-dashboard/pages/FiTransitionDashboardPage"));
// Sprint CU — Energy Company Profiler
const EnergyAssetRegistryPage        = React.lazy(() => import("./features/energy-asset-registry/pages/EnergyAssetRegistryPage"));
const EnergySegmentAnalysisPage      = React.lazy(() => import("./features/energy-segment-analysis/pages/EnergySegmentAnalysisPage"));
const EnergySupplierNetworkPage      = React.lazy(() => import("./features/energy-supplier-network/pages/EnergySupplierNetworkPage"));
const EnergyRevenueSplitPage         = React.lazy(() => import("./features/energy-revenue-split/pages/EnergyRevenueSplitPage"));
const EnergyDecommissioningLiabilityPage = React.lazy(() => import("./features/energy-decommissioning-liability/pages/EnergyDecommissioningLiabilityPage"));
const EnergyTransitionDashboardPage  = React.lazy(() => import("./features/energy-transition-dashboard/pages/EnergyTransitionDashboardPage"));
// Sprint CV — Geopolitical Risk Engine
const GeopoliticalRiskIndexPage      = React.lazy(() => import("./features/geopolitical-risk-index/pages/GeopoliticalRiskIndexPage"));
const SanctionsTradeMonitorPage      = React.lazy(() => import("./features/sanctions-trade-monitor/pages/SanctionsTradeMonitorPage"));
const CriticalMineralGeoRiskPage     = React.lazy(() => import("./features/critical-mineral-geo-risk/pages/CriticalMineralGeoRiskPage"));
const ConflictStabilityTrackerPage   = React.lazy(() => import("./features/conflict-stability-tracker/pages/ConflictStabilityTrackerPage"));
const GeoTransitionNexusPage         = React.lazy(() => import("./features/geo-transition-nexus/pages/GeoTransitionNexusPage"));
const GeopoliticalDashboardPage      = React.lazy(() => import("./features/geopolitical-dashboard/pages/GeopoliticalDashboardPage"));
// Sprint CW — Cross-Entity Assessment & Benchmarking
const UniversalEntityComparatorPage  = React.lazy(() => import("./features/universal-entity-comparator/pages/UniversalEntityComparatorPage"));
const SectorPeerBenchmarkingEnginePage = React.lazy(() => import("./features/sector-peer-benchmarking-engine/pages/SectorPeerBenchmarkingEnginePage"));
const SupplyChainNetworkVizPage      = React.lazy(() => import("./features/supply-chain-network-viz/pages/SupplyChainNetworkVizPage"));
const PortfolioStressTestDrilldownPage = React.lazy(() => import("./features/portfolio-stress-test-drilldown/pages/PortfolioStressTestDrilldownPage"));
const AssessmentAuditTrailV2Page     = React.lazy(() => import("./features/assessment-audit-trail-v2/pages/AssessmentAuditTrailV2Page"));
const CrossEntityIntelligenceDashboardPage = React.lazy(() => import("./features/cross-entity-intelligence-dashboard/pages/CrossEntityIntelligenceDashboardPage"));
// Sprint CX — Advanced ML & Predictive Analytics
const MlFeatureEngineeringPage       = React.lazy(() => import("./features/ml-feature-engineering/pages/MlFeatureEngineeringPage"));
const EnsemblePredictionEnginePage   = React.lazy(() => import("./features/ensemble-prediction-engine/pages/EnsemblePredictionEnginePage"));
const AnomalyDetectionEnginePage     = React.lazy(() => import("./features/anomaly-detection-engine/pages/AnomalyDetectionEnginePage"));
const PeerClusteringSegmentationPage = React.lazy(() => import("./features/peer-clustering-segmentation/pages/PeerClusteringSegmentationPage"));
const ScenarioConditionalPredictionPage = React.lazy(() => import("./features/scenario-conditional-prediction/pages/ScenarioConditionalPredictionPage"));
const MlGovernanceDashboardPage      = React.lazy(() => import("./features/ml-governance-dashboard/pages/MlGovernanceDashboardPage"));
// Sustainability Reporting Intelligence
const SustainabilityReportBuilderPage = React.lazy(() => import("./features/sustainability-report-builder/pages/SustainabilityReportBuilderPage"));
const EsrsDatapointNavigatorPage = React.lazy(() => import("./features/esrs-datapoint-navigator/pages/EsrsDatapointNavigatorPage"));
const SectorSustainabilityBenchmarkPage = React.lazy(() => import("./features/sector-sustainability-benchmark/pages/SectorSustainabilityBenchmarkPage"));
const ReportQualityEnginePage = React.lazy(() => import("./features/report-quality-engine/pages/ReportQualityEnginePage"));
const MetricsDataArchitecturePage = React.lazy(() => import("./features/metrics-data-architecture/pages/MetricsDataArchitecturePage"));
const NarrativeIntelligencePage = React.lazy(() => import("./features/narrative-intelligence/pages/NarrativeIntelligencePage"));
// Sprint DE — Green Real Estate & Built Environment
const GreenBuildingValuationPage         = React.lazy(() => import("./features/green-building-valuation/pages/GreenBuildingValuationPage"));
const RealEstateClimateRiskPage          = React.lazy(() => import("./features/real-estate-climate-risk/pages/RealEstateClimateRiskPage"));
const ClimateMortgageAnalyticsPage       = React.lazy(() => import("./features/climate-mortgage-analytics/pages/ClimateMortgageAnalyticsPage"));
const InfrastructureClimateResiliencePage = React.lazy(() => import("./features/infrastructure-climate-resilience/pages/InfrastructureClimateResiliencePage"));
const UrbanClimateAdaptationPage         = React.lazy(() => import("./features/urban-climate-adaptation/pages/UrbanClimateAdaptationPage"));
/* real-estate-carbon-analytics: route now provided by its module.config.js (auto-discovery pilot) */
// Sprint DF — Climate Technology & Innovation Finance
const CleanTechInvestmentPage            = React.lazy(() => import("./features/cleantech-investment/pages/CleanTechInvestmentPage"));
const GreenHydrogenEconomicsPage2        = React.lazy(() => import("./features/green-hydrogen-economics/pages/GreenHydrogenEconomicsPage"));
const CarbonCaptureFinancePage           = React.lazy(() => import("./features/carbon-capture-finance/pages/CarbonCaptureFinancePage"));
const EnergyStorageAnalyticsPage         = React.lazy(() => import("./features/energy-storage-analytics/pages/EnergyStorageAnalyticsPage"));
const EVTransitionFinancePage            = React.lazy(() => import("./features/ev-transition-finance/pages/EVTransitionFinancePage"));
const ClimatePatentIntelligencePage      = React.lazy(() => import("./features/climate-patent-intelligence/pages/ClimatePatentIntelligencePage"));
// Sprint DI — Climate Workforce & Just Transition
const FossilFuelWorkerTransitionPage     = React.lazy(() => import("./features/fossil-fuel-worker-transition/pages/FossilFuelWorkerTransitionPage"));
const GreenJobsGrowthPage                = React.lazy(() => import("./features/green-jobs-growth/pages/GreenJobsGrowthPage"));
const CorporateJustTransitionPage        = React.lazy(() => import("./features/corporate-just-transition/pages/CorporateJustTransitionPage"));
const ClimateDisplacementRiskPage        = React.lazy(() => import("./features/climate-displacement-risk/pages/ClimateDisplacementRiskPage"));
const SupplyChainLaborClimateRiskPage    = React.lazy(() => import("./features/supply-chain-labor-climate/pages/SupplyChainLaborClimateRiskPage"));
const CommunityClimateResiliencePage     = React.lazy(() => import("./features/community-climate-resilience/pages/CommunityClimateResiliencePage"));
// Sprint DG — Food, Agriculture & Land Use
const AgriculturalClimateRiskPage        = React.lazy(() => import("./features/agricultural-climate-risk/pages/AgriculturalClimateRiskPage"));
const FoodSystemTransitionPage           = React.lazy(() => import("./features/food-system-transition/pages/FoodSystemTransitionPage"));
const LandUseChangeFinancePage           = React.lazy(() => import("./features/land-use-change-finance/pages/LandUseChangeFinancePage"));
const SustainableAgricultureInvestmentPage = React.lazy(() => import("./features/sustainable-agriculture-investment/pages/SustainableAgricultureInvestmentPage"));
const WaterFoodEnergyNexusPage           = React.lazy(() => import("./features/water-food-energy-nexus/pages/WaterFoodEnergyNexusPage"));
const ClimateCommodityAnalyticsPage      = React.lazy(() => import("./features/climate-commodity-analytics/pages/ClimateCommodityAnalyticsPage"));
// Sprint DM — Urban & City Climate Finance
const MunicipalGreenBondPage             = React.lazy(() => import("./features/municipal-green-bond/pages/MunicipalGreenBondPage"));
const SmartCityClimateFinancePage        = React.lazy(() => import("./features/smart-city-climate-finance/pages/SmartCityClimateFinancePage"));
const CityClimateRiskRatingPage          = React.lazy(() => import("./features/city-climate-risk-rating/pages/CityClimateRiskRatingPage"));
const UrbanMobilityTransitionPage        = React.lazy(() => import("./features/urban-mobility-transition/pages/UrbanMobilityTransitionPage"));
const GreenBuildingCodeFinancePage       = React.lazy(() => import("./features/green-building-code-finance/pages/GreenBuildingCodeFinancePage"));
const CityNetZeroTrackerPage             = React.lazy(() => import("./features/city-net-zero-tracker/pages/CityNetZeroTrackerPage"));
// Sprint DK — Climate Governance & Board Analytics
const BoardClimateOversightPage          = React.lazy(() => import("./features/board-climate-oversight/pages/BoardClimateOversightPage"));
const FiduciaryClimateRiskPage           = React.lazy(() => import("./features/fiduciary-climate-risk/pages/FiduciaryClimateRiskPage"));
const ESGGovernanceScorerPage            = React.lazy(() => import("./features/esg-governance-scorer/pages/ESGGovernanceScorerPage"));
const ClimateExecutivePayPage            = React.lazy(() => import("./features/climate-executive-pay/pages/ClimateExecutivePayPage"));
const ShareholderEngagementPage          = React.lazy(() => import("./features/shareholder-climate-engagement/pages/ShareholderEngagementPage"));
const ClimateRegPolicyTrackerPage        = React.lazy(() => import("./features/climate-reg-policy-tracker/pages/ClimateRegPolicyTrackerPage"));
// Sprint DJ — Ocean, Shipping & Blue Economy
const ShippingDecarbonisationPage        = React.lazy(() => import("./features/shipping-decarbonisation/pages/ShippingDecarbonisationPage"));
const BlueCarbonFinancePage              = React.lazy(() => import("./features/blue-carbon-finance/pages/BlueCarbonFinancePage"));
const CoastalFloodRiskFinancePage        = React.lazy(() => import("./features/coastal-flood-risk-finance/pages/CoastalFloodRiskFinancePage"));
const OceanHealthFinancePage             = React.lazy(() => import("./features/ocean-health-finance/pages/OceanHealthFinancePage"));
const PortClimateRiskPage                = React.lazy(() => import("./features/port-climate-risk/pages/PortClimateRiskPage"));
const FisheriesClimateRiskPage           = React.lazy(() => import("./features/fisheries-climate-risk/pages/FisheriesClimateRiskPage"));
// Sprint DH — Emerging Markets & Development Finance
const EMSovereignClimateDebtPage         = React.lazy(() => import("./features/em-sovereign-climate-debt/pages/EMSovereignClimateDebtPage"));
const MDBClimateFinanceDHPage            = React.lazy(() => import("./features/mdb-climate-finance-dh/pages/MDBClimateFinancePage"));
const JETPAnalyticsPage                  = React.lazy(() => import("./features/jetp-analytics/pages/JETPAnalyticsPage"));
const ClimateBlendedFinancePage          = React.lazy(() => import("./features/climate-blended-finance/pages/ClimateBlendedFinancePage"));
const LossAndDamageFinancePage           = React.lazy(() => import("./features/loss-and-damage-finance/pages/LossAndDamageFinancePage"));
const SovereignGreenBondAnalyticsPage    = React.lazy(() => import("./features/sovereign-green-bond-analytics/pages/SovereignGreenBondAnalyticsPage"));
// Sprint DO — Renewable Energy Project Finance
const SolarProjectFinancePage            = React.lazy(() => import("./features/solar-project-finance/pages/SolarProjectFinancePage"));
const WindEnergyFinancePage              = React.lazy(() => import("./features/wind-energy-finance/pages/WindEnergyFinancePage"));
const RenewableProjectPipelinePage       = React.lazy(() => import("./features/renewable-project-pipeline/pages/RenewableProjectPipelinePage"));
const EnergyTransitionLendingPage        = React.lazy(() => import("./features/energy-transition-lending/pages/EnergyTransitionLendingPage"));
const PPAAnalyticsPage                   = React.lazy(() => import("./features/ppa-analytics/pages/PPAAnalyticsPage"));
const RenewableAssetManagementPage       = React.lazy(() => import("./features/renewable-asset-management/pages/RenewableAssetManagementPage"));
// Sprint DD — Corporate Finance & Capital Markets
const ClimateWaccEnginePage              = React.lazy(() => import("./features/climate-wacc-engine/pages/ClimateWaccEnginePage"));
const GreenDebtStructuringPage           = React.lazy(() => import("./features/green-debt-structuring/pages/GreenDebtStructuringPage"));
const ClimateMaDueDiligencePage          = React.lazy(() => import("./features/climate-ma-due-diligence/pages/ClimateMaDueDiligencePage"));
const CarbonAdjustedValuationPage        = React.lazy(() => import("./features/carbon-adjusted-valuation/pages/CarbonAdjustedValuationPage"));
const TreasuryClimateRiskPage            = React.lazy(() => import("./features/treasury-climate-risk/pages/TreasuryClimateRiskPage"));
const ClimateCapitalMarketsPage          = React.lazy(() => import("./features/climate-capital-markets/pages/ClimateCapitalMarketsPage"));
// Sprint DQ — Carbon Credit Calculation Module
const CDMMethodologyCalculatorPage       = React.lazy(() => import("./features/cdm-methodology-calculator/pages/CDMMethodologyCalculatorPage"));
const BaselineAdditionalityPage          = React.lazy(() => import("./features/baseline-additionality-analyzer/pages/BaselineAdditionalityPage"));
const MonteCarloCarbonUncertaintyPage    = React.lazy(() => import("./features/monte-carlo-uncertainty-engine/pages/MonteCarloCarbonUncertaintyPage"));
const CarbonProjectLifecyclePage         = React.lazy(() => import("./features/carbon-project-lifecycle/pages/CarbonProjectLifecyclePage"));
const MultiStandardCompliancePage        = React.lazy(() => import("./features/multi-standard-compliance/pages/MultiStandardCompliancePage"));
const CarbonCreditAuditTrailPage         = React.lazy(() => import("./features/carbon-credit-audit-trail/pages/CarbonCreditAuditTrailPage"));
// Sprint DP — Health, Heat & Climate Wellbeing Finance
const HeatStressFinancePage              = React.lazy(() => import("./features/heat-stress-finance/pages/HeatStressFinancePage"));
const ClimateHealthRiskPage              = React.lazy(() => import("./features/climate-health-risk-analytics/pages/ClimateHealthRiskPage"));
const AirQualityInvestmentPage           = React.lazy(() => import("./features/air-quality-investment/pages/AirQualityInvestmentPage"));
const PandemicClimateFinancePage         = React.lazy(() => import("./features/pandemic-climate-finance/pages/PandemicClimateFinancePage"));
const MentalHealthClimateRiskPage        = React.lazy(() => import("./features/mental-health-climate-risk/pages/MentalHealthClimateRiskPage"));
const WellbeingAdjustedReturnsPage       = React.lazy(() => import("./features/wellbeing-adjusted-returns/pages/WellbeingAdjustedReturnsPage"));
// Sprint DN — Supply Chain Climate Intelligence
const SupplyChainEmissionsMapperPage     = React.lazy(() => import("./features/supply-chain-emissions-mapper/pages/SupplyChainEmissionsMapperPage"));
const ProcurementClimateRiskPage         = React.lazy(() => import("./features/procurement-climate-risk/pages/ProcurementClimateRiskPage"));
const SupplierESGScorecardPage           = React.lazy(() => import("./features/supplier-esg-scorecard/pages/SupplierESGScorecardPage"));
const Scope3CategoryAnalyticsPage        = React.lazy(() => import("./features/scope3-category-analytics/pages/Scope3CategoryAnalyticsPage"));
const ClimateTradeFlowAnalyticsPage      = React.lazy(() => import("./features/climate-trade-flow-analytics/pages/ClimateTradeFlowAnalyticsPage"));
const GreenProcurementIntelligencePage   = React.lazy(() => import("./features/green-procurement-intelligence/pages/GreenProcurementIntelligencePage"));
// Sprint DL — Circular Economy & Waste Climate Finance
const CircularEconomyFinancePage         = React.lazy(() => import("./features/circular-economy-finance/pages/CircularEconomyFinancePage"));
const WasteToEnergyFinancePage           = React.lazy(() => import("./features/waste-to-energy-finance/pages/WasteToEnergyFinancePage"));
const PlasticsPollutionFinancePage       = React.lazy(() => import("./features/plastics-pollution-finance/pages/PlasticsPollutionFinancePage"));
const ResourceEfficiencyAnalyticsPage    = React.lazy(() => import("./features/resource-efficiency-analytics/pages/ResourceEfficiencyAnalyticsPage"));
const CriticalMineralsClimatePage        = React.lazy(() => import("./features/critical-minerals-climate/pages/CriticalMineralsClimatePage"));
const GreenChemistryFinancePage          = React.lazy(() => import("./features/green-chemistry-finance/pages/GreenChemistryFinancePage"));
// Sprint DC — Climate-Integrated Actuarial Intelligence
const ClimateMortalityLongevityPage      = React.lazy(() => import("./features/climate-mortality-longevity/pages/ClimateMortalityLongevityPage"));
const PCClimatePricingPage               = React.lazy(() => import("./features/pc-climate-pricing/pages/PCClimatePricingPage"));
const ClimateReserveAdequacyPage         = React.lazy(() => import("./features/climate-reserve-adequacy/pages/ClimateReserveAdequacyPage"));
const SolvencyCapitalClimatePage         = React.lazy(() => import("./features/solvency-capital-climate/pages/SolvencyCapitalClimatePage"));
const ClimateClaimsForecastingPage       = React.lazy(() => import("./features/climate-claims-forecasting/pages/ClimateClaimsForecastingPage"));
// InsuranceClimateHubPage already declared at line 297
// Sprint DB — Enterprise Climate Risk Capital & Supervisory Analytics
const ClimateCapitalAdequacyPage         = React.lazy(() => import("./features/climate-capital-adequacy/pages/ClimateCapitalAdequacyPage"));
const ClimateCVaRSuitePage               = React.lazy(() => import("./features/climate-cvar-suite/pages/ClimateCVaRSuitePage"));
const SupervisoryStressOrchestratorPage  = React.lazy(() => import("./features/supervisory-stress-orchestrator/pages/SupervisoryStressOrchestratorPage"));
const ClimateRiskPremiumPage             = React.lazy(() => import("./features/climate-risk-premium/pages/ClimateRiskPremiumPage"));
const EnterpriseClimateRiskPage          = React.lazy(() => import("./features/enterprise-climate-risk/pages/EnterpriseClimateRiskPage"));
const SystemicClimateRiskPage            = React.lazy(() => import("./features/systemic-climate-risk/pages/SystemicClimateRiskPage"));
// Sprint DA — Disclosure & Stranded Asset Analytics
const ClimateLitigationRiskScorerPage    = React.lazy(() => import("./features/climate-litigation-risk-scorer/pages/ClimateLitigationRiskScorerPage"));
const GreenwashingExposureMonitorPage    = React.lazy(() => import("./features/greenwashing-exposure-monitor/pages/GreenwashingExposureMonitorPage"));
const DisclosureAdequacyAnalyzerPage     = React.lazy(() => import("./features/disclosure-adequacy-analyzer/pages/DisclosureAdequacyAnalyzerPage"));
const StrandedAssetLitigationTrackerPage = React.lazy(() => import("./features/stranded-asset-litigation-tracker/pages/StrandedAssetLitigationTrackerPage"));
const RegulatoryEnforcementMonitorPage   = React.lazy(() => import("./features/regulatory-enforcement-monitor/pages/RegulatoryEnforcementMonitorPage"));
const ClimateLegalIntelligenceDashboardPage = React.lazy(() => import("./features/climate-legal-intelligence-dashboard/pages/ClimateLegalIntelligenceDashboardPage"));
// Sprint CY — Real-Time Climate Risk Intelligence
const LiveCarbonPriceMonitorPage         = React.lazy(() => import("./features/live-carbon-price-monitor/pages/LiveCarbonPriceMonitorPage"));
const PortfolioClimatePulsePage          = React.lazy(() => import("./features/portfolio-climate-pulse/pages/PortfolioClimatePulsePage"));
const RegulatoryDeadlineTrackerPage      = React.lazy(() => import("./features/regulatory-deadline-tracker/pages/RegulatoryDeadlineTrackerPage"));
const ClimateNewsSentimentFeedPage       = React.lazy(() => import("./features/climate-news-sentiment-feed/pages/ClimateNewsSentimentFeedPage"));
const RealTimeEmissionsMonitorPage       = React.lazy(() => import("./features/real-time-emissions-monitor/pages/RealTimeEmissionsMonitorPage"));
const ClientTransitionCommandCenterPage  = React.lazy(() => import("./features/client-transition-command-center/pages/ClientTransitionCommandCenterPage"));
// Sprint CZ — Climate Portfolio Construction & Optimization
const ClimatePortfolioOptimizerPage      = React.lazy(() => import("./features/climate-portfolio-optimizer/pages/ClimatePortfolioOptimizerPage"));
const NetZeroPortfolioAlignmentPage      = React.lazy(() => import("./features/net-zero-portfolio-alignment/pages/NetZeroPortfolioAlignmentPage"));
const ClimateBenchmarkConstructorPage    = React.lazy(() => import("./features/climate-benchmark-constructor/pages/ClimateBenchmarkConstructorPage"));
const GreenBondPortfolioAnalyticsPage    = React.lazy(() => import("./features/green-bond-portfolio-analytics/pages/GreenBondPortfolioAnalyticsPage"));
const ClimateRiskBudgetAllocatorPage     = React.lazy(() => import("./features/climate-risk-budget-allocator/pages/ClimateRiskBudgetAllocatorPage"));
const TransitionAlphaSignalGeneratorPage = React.lazy(() => import("./features/transition-alpha-signal-generator/pages/TransitionAlphaSignalGeneratorPage"));
// Sprint BW — Carbon Credit Engine Hub (Hub · Portfolio Analytics · Cross-Methodology)
const CcEngineHubPage            = React.lazy(() => import("./features/cc-engine-hub/pages/CcEngineHubPage"));
const CcPortfolioAnalyticsPage   = React.lazy(() => import("./features/cc-portfolio-analytics/pages/CcPortfolioAnalyticsPage"));
const CcMethodologyComparisonPage= React.lazy(() => import("./features/cc-methodology-comparison/pages/CcMethodologyComparisonPage"));
// Sprint BV — Credit Retirement & Certificates (Workflow · Certificate Mgmt · Registry Hub)
const CcRetirementWorkflowPage   = React.lazy(() => import("./features/cc-retirement-workflow/pages/CcRetirementWorkflowPage"));
const CcCertificateMgmtPage      = React.lazy(() => import("./features/cc-certificate-mgmt/pages/CcCertificateMgmtPage"));
const CcRegistryHubPage          = React.lazy(() => import("./features/cc-registry-hub/pages/CcRegistryHubPage"));
// Sprint BU — Engineered CDR & Removals (Mineralization · DAC · BiCRS Hub)
const CcMineralizationPage       = React.lazy(() => import("./features/cc-mineralization/pages/CcMineralizationPage"));
const CcDacPage                  = React.lazy(() => import("./features/cc-dac/pages/CcDacPage"));
const CcBicrsHubPage             = React.lazy(() => import("./features/cc-bicrs-hub/pages/CcBicrsHubPage"));
// Sprint BT — Waste & Industrial Credits (Landfill/WW · Industrial Gases · CCS/Biochar Hub)
const CcLandfillWastewaterPage   = React.lazy(() => import("./features/cc-landfill-wastewater/pages/CcLandfillWastewaterPage"));
const CcIndustrialGasesPage      = React.lazy(() => import("./features/cc-industrial-gases/pages/CcIndustrialGasesPage"));
const CcCcsBiocharHubPage        = React.lazy(() => import("./features/cc-ccs-biochar-hub/pages/CcCcsBiocharHubPage"));
// Sprint BS — Energy Carbon Credits (Grid Renewables · Clean Cooking · EE Hub)
const CcGridRenewablesPage       = React.lazy(() => import("./features/cc-grid-renewables/pages/CcGridRenewablesPage"));
const CcCleanCookingPage         = React.lazy(() => import("./features/cc-clean-cooking/pages/CcCleanCookingPage"));
const CcEnergyEfficiencyHubPage  = React.lazy(() => import("./features/cc-energy-efficiency-hub/pages/CcEnergyEfficiencyHubPage"));
// Sprint BR — Agriculture Carbon Credits (Soil Carbon · Livestock Methane · Rice Cultivation)
const CcSoilCarbonPage           = React.lazy(() => import("./features/cc-soil-carbon/pages/CcSoilCarbonPage"));
const CcLivestockMethanePage     = React.lazy(() => import("./features/cc-livestock-methane/pages/CcLivestockMethanePage"));
const CcRiceCultivationPage      = React.lazy(() => import("./features/cc-rice-cultivation/pages/CcRiceCultivationPage"));
// Sprint BQ — Nature-Based Carbon Credits (ARR · IFM · REDD+/Wetlands Hub)
const CcArrReforestationPage     = React.lazy(() => import("./features/cc-arr-reforestation/pages/CcArrReforestationPage"));
const CcIfmCreditsPage           = React.lazy(() => import("./features/cc-ifm-credits/pages/CcIfmCreditsPage"));
const CcReddWetlandsHubPage      = React.lazy(() => import("./features/cc-redd-wetlands-hub/pages/CcReddWetlandsHubPage"));
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
// EP-SAD1 — Social & Alternative Data Intelligence
const SocialAlternativeDataPage = React.lazy(() => import("./features/social-alternative-data/pages/SocialAlternativeDataPage"));
// Sprint DR — Offshore Wind & Marine Energy Intelligence Suite
const OffshoreWindResourcePage       = React.lazy(() => import("./features/offshore-wind-resource/pages/OffshoreWindResourcePage"));
const FloatingOffshoreWindPage       = React.lazy(() => import("./features/floating-offshore-wind/pages/FloatingOffshoreWindPage"));
const OffshoreWindFinancePage        = React.lazy(() => import("./features/offshore-wind-finance/pages/OffshoreWindFinancePage"));
const OffshoreGridInfrastructurePage = React.lazy(() => import("./features/offshore-grid-infrastructure/pages/OffshoreGridInfrastructurePage"));
const OffshoreWindOmPage             = React.lazy(() => import("./features/offshore-wind-om/pages/OffshoreWindOmPage"));
const WindRepoweringIntelligencePage = React.lazy(() => import("./features/wind-repowering-intelligence/pages/WindRepoweringIntelligencePage"));
// Sprint DS — Green Hydrogen & Power-to-X Finance Intelligence Suite
const GreenHydrogenLcohPage          = React.lazy(() => import("./features/green-hydrogen-lcoh/pages/GreenHydrogenLcohPage"));
const HydrogenStorageTransportPage   = React.lazy(() => import("./features/hydrogen-storage-transport/pages/HydrogenStorageTransportPage"));
const PowerToXFinancePage            = React.lazy(() => import("./features/power-to-x-finance/pages/PowerToXFinancePage"));
const HydrogenProjectFinancePage     = React.lazy(() => import("./features/hydrogen-project-finance/pages/HydrogenProjectFinancePage"));
const BlueHydrogenCcsPage            = React.lazy(() => import("./features/blue-hydrogen-ccs/pages/BlueHydrogenCcsPage"));
const HydrogenMarketIntelligencePage = React.lazy(() => import("./features/hydrogen-market-intelligence/pages/HydrogenMarketIntelligencePage"));
// Sprint DT — Battery Energy Storage & Grid Flexibility Finance Intelligence Suite
const BessProjectFinancePage         = React.lazy(() => import("./features/bess-project-finance/pages/BessProjectFinancePage"));
const BatteryTechSupplyChainPage     = React.lazy(() => import("./features/battery-tech-supply-chain/pages/BatteryTechSupplyChainPage"));
const VirtualPowerPlantPage          = React.lazy(() => import("./features/virtual-power-plant/pages/VirtualPowerPlantPage"));
const GridFlexibilityMarketsPage     = React.lazy(() => import("./features/grid-flexibility-markets/pages/GridFlexibilityMarketsPage"));
const EvV2gGridIntegrationPage       = React.lazy(() => import("./features/ev-v2g-grid-integration/pages/EvV2gGridIntegrationPage"));
const LdesInvestmentPage             = React.lazy(() => import("./features/ldes-investment/pages/LdesInvestmentPage"));
// Sprint DU — Nuclear & Advanced Fission Finance Intelligence Suite
const NuclearLcoeEconomicsPage       = React.lazy(() => import("./features/nuclear-lcoe-economics/pages/NuclearLcoeEconomicsPage"));
const SmrProjectFinancePage          = React.lazy(() => import("./features/smr-project-finance/pages/SmrProjectFinancePage"));
const NuclearFuelCyclePage           = React.lazy(() => import("./features/nuclear-fuel-cycle/pages/NuclearFuelCyclePage"));
const AdvancedReactorFinancePage     = React.lazy(() => import("./features/advanced-reactor-finance/pages/AdvancedReactorFinancePage"));
const NuclearDecommissioningPage     = React.lazy(() => import("./features/nuclear-decommissioning/pages/NuclearDecommissioningPage"));
const NuclearMarketIntelligencePage  = React.lazy(() => import("./features/nuclear-market-intelligence/pages/NuclearMarketIntelligencePage"));
// Sprint DV — Geothermal Energy Finance Intelligence Suite
const GeothermalLcoeEconomicsPage    = React.lazy(() => import("./features/geothermal-lcoe-economics/pages/GeothermalLcoeEconomicsPage"));
const GeothermalProjectFinancePage   = React.lazy(() => import("./features/geothermal-project-finance/pages/GeothermalProjectFinancePage"));
const EnhancedGeothermalSystemsPage  = React.lazy(() => import("./features/enhanced-geothermal-systems/pages/EnhancedGeothermalSystemsPage"));
const GeothermalDirectUsePage        = React.lazy(() => import("./features/geothermal-direct-use/pages/GeothermalDirectUsePage"));
const GeothermalPowerMarketsPage     = React.lazy(() => import("./features/geothermal-power-markets/pages/GeothermalPowerMarketsPage"));
const GeothermalMarketIntelligencePage = React.lazy(() => import("./features/geothermal-market-intelligence/pages/GeothermalMarketIntelligencePage"));
// Sprint DW — FI Climate Finance Instruments Intelligence Suite
const SustainabilityLinkedInstrumentsPage = React.lazy(() => import("./features/sustainability-linked-instruments/pages/SustainabilityLinkedInstrumentsPage"));
const TransitionFinanceEnginePage         = React.lazy(() => import("./features/transition-finance-engine/pages/TransitionFinanceEnginePage"));
const GreenSecuritizationPage             = React.lazy(() => import("./features/green-securitization/pages/GreenSecuritizationPage"));
const ClimateCreditPricingPage            = React.lazy(() => import("./features/climate-credit-pricing/pages/ClimateCreditPricingPage"));
const BlendedFinanceStructuringPage       = React.lazy(() => import("./features/blended-finance-structuring/pages/BlendedFinanceStructuringPage"));
const FiNetZeroPathwaysPage               = React.lazy(() => import("./features/fi-net-zero-pathways/pages/FiNetZeroPathwaysPage"));
// Sprint DX — Bioenergy, BECCS & Nature-Based Carbon Finance Intelligence Suite
const BioenergyLcoeEconomicsPage          = React.lazy(() => import("./features/bioenergy-lcoe-economics/pages/BioenergyLcoeEconomicsPage"));
const BeccsProjectFinancePage             = React.lazy(() => import("./features/beccs-project-finance/pages/BeccsProjectFinancePage"));
const ForestryTimberFinancePage           = React.lazy(() => import("./features/forestry-timber-finance/pages/ForestryTimberFinancePage"));
const NatureBasedSolutionsFinancePage     = React.lazy(() => import("./features/nature-based-solutions-finance/pages/NatureBasedSolutionsFinancePage"));
const CarbonRemovalMarketsPage            = React.lazy(() => import("./features/carbon-removal-markets/pages/CarbonRemovalMarketsPage"));
const BiodiversityNaturalCapitalPage      = React.lazy(() => import("./features/biodiversity-natural-capital/pages/BiodiversityNaturalCapitalPage"));
// Sprint DY — Municipal & Sub-Sovereign Climate Finance Intelligence Suite
const MunicipalGreenBondAnalyticsPage     = React.lazy(() => import("./features/municipal-green-bond-analytics/pages/MunicipalGreenBondAnalyticsPage"));
const CdfiClimateFinancePage              = React.lazy(() => import("./features/cdfi-climate-finance/pages/CdfiClimateFinancePage"));
const MdbSubSovereignLendingPage          = React.lazy(() => import("./features/mdb-sub-sovereign-lending/pages/MdbSubSovereignLendingPage"));
const CPaceClimateFinancePage             = React.lazy(() => import("./features/cpace-climate-finance/pages/CPaceClimateFinancePage"));
const ClimateRevenueBondModelerPage       = React.lazy(() => import("./features/climate-revenue-bond-modeler/pages/ClimateRevenueBondModelerPage"));
const MunicipalClimateResilienceHubPage   = React.lazy(() => import("./features/municipal-climate-resilience-hub/pages/MunicipalClimateResilienceHubPage"));
const BlueBondAnalyticsPage               = React.lazy(() => import("./features/blue-bond-analytics/pages/BlueBondAnalyticsPage"));
const ShippingDecarbonizationFinancePage  = React.lazy(() => import("./features/shipping-decarbonization-finance/pages/ShippingDecarbonizationFinancePage"));
const MarineBlueCarbonFinancePage         = React.lazy(() => import("./features/marine-blue-carbon-finance/pages/MarineBlueCarbonFinancePage"));
const AquacultureClimateFinancePage       = React.lazy(() => import("./features/aquaculture-climate-finance/pages/AquacultureClimateFinancePage"));
const OceanCarbonCreditMarketPage         = React.lazy(() => import("./features/ocean-carbon-credit-market/pages/OceanCarbonCreditMarketPage"));
const CoastalResilienceFinancePage        = React.lazy(() => import("./features/coastal-resilience-finance/pages/CoastalResilienceFinancePage"));
// Sprint EA — India Green Economy Carbon Finance Suite
const RegionalCarbonMarketHubPage         = React.lazy(() => import("./features/regional-carbon-market-hub/pages/RegionalCarbonMarketHubPage"));
const SolarDeveloperCarbonFinancePage     = React.lazy(() => import("./features/solar-developer-carbon-finance/pages/SolarDeveloperCarbonFinancePage"));
const SolarManufacturerCarbonFinancePage  = React.lazy(() => import("./features/solar-manufacturer-carbon-finance/pages/SolarManufacturerCarbonFinancePage"));
const GreenHydrogenAmmoniaCarbonPage      = React.lazy(() => import("./features/green-hydrogen-ammonia-carbon/pages/GreenHydrogenAmmoniaCarbonPage"));
const IndiaGreenInfraFinancePage          = React.lazy(() => import("./features/india-green-infra-finance/pages/IndiaGreenInfraFinancePage"));
const CarbonArbitragePortfolioPage        = React.lazy(() => import("./features/carbon-arbitrage-portfolio/pages/CarbonArbitragePortfolioPage"));
const CarbonIntegrityMrvAnalyticsPage     = React.lazy(() => import("./features/carbon-integrity-mrv-analytics/pages/CarbonIntegrityMrvAnalyticsPage"));
// Sprint EB — Impact Advisory Suite (client-anonymised RE-IPP)
const RenewableLcaEpdPage                 = React.lazy(() => import("./features/renewable-lca-epd/pages/RenewableLcaEpdPage"));
const CctsOffsetRegistrationPage          = React.lazy(() => import("./features/ccts-offset-registration/pages/CctsOffsetRegistrationPage"));
const SustainabilityLinkedFinancePage     = React.lazy(() => import("./features/sustainability-linked-finance/pages/SustainabilityLinkedFinancePage"));
const EsgRatingsUpliftPage                = React.lazy(() => import("./features/esg-ratings-uplift/pages/EsgRatingsUpliftPage"));
const TcfdPhysicalRiskAssessmentPage      = React.lazy(() => import("./features/tcfd-physical-risk-assessment/pages/TcfdPhysicalRiskAssessmentPage"));
const TnfdBiodiversityBaselinePage        = React.lazy(() => import("./features/tnfd-biodiversity-baseline/pages/TnfdBiodiversityBaselinePage"));
// Sprint EC — Solar Energy Finance Suite
const BifacialAgrivoltaicFinancePage      = React.lazy(() => import("./features/bifacial-agrivoltaic-finance/pages/BifacialAgrivoltaicFinancePage"));
const FloatingSolarFinancePage            = React.lazy(() => import("./features/floating-solar-finance/pages/FloatingSolarFinancePage"));
const SolarPlusStorageFinancePage         = React.lazy(() => import("./features/solar-plus-storage-finance/pages/SolarPlusStorageFinancePage"));
const UtilitySolarEpcIntelligencePage     = React.lazy(() => import("./features/utility-solar-epc-intelligence/pages/UtilitySolarEpcIntelligencePage"));
const DistributedCommunitySolarPage       = React.lazy(() => import("./features/distributed-community-solar/pages/DistributedCommunitySolarPage"));
const SolarRepoweringAnalyticsPage        = React.lazy(() => import("./features/solar-repowering-analytics/pages/SolarRepoweringAnalyticsPage"));
// Sprint ED — Solar Panel Manufacturing Intelligence
const PolysiliconWaferSupplyChainPage     = React.lazy(() => import("./features/polysilicon-wafer-supply-chain/pages/PolysiliconWaferSupplyChainPage"));
const SolarCellTechnologyAnalyzerPage     = React.lazy(() => import("./features/solar-cell-technology-analyzer/pages/SolarCellTechnologyAnalyzerPage"));
const SolarModuleManufacturingEconomicsPage = React.lazy(() => import("./features/solar-module-manufacturing-economics/pages/SolarModuleManufacturingEconomicsPage"));
const SolarManufacturingCarbonLcaPage     = React.lazy(() => import("./features/solar-manufacturing-carbon-lca/pages/SolarManufacturingCarbonLcaPage"));
const SolarTradePolicyIntelligencePage    = React.lazy(() => import("./features/solar-trade-policy-intelligence/pages/SolarTradePolicyIntelligencePage"));
const SolarModuleQualityBankabilityPage   = React.lazy(() => import("./features/solar-module-quality-bankability/pages/SolarModuleQualityBankabilityPage"));
// Sprint EE — Green Ammonia & Hydrogen Derivatives
const GreenAmmoniaProductionEconomicsPage = React.lazy(() => import("./features/green-ammonia-production-economics/pages/GreenAmmoniaProductionEconomicsPage"));
const GreenAmmoniaShippingStoragePage     = React.lazy(() => import("./features/green-ammonia-shipping-storage/pages/GreenAmmoniaShippingStoragePage"));
const GreenAmmoniaOfftakeMarketsPage      = React.lazy(() => import("./features/green-ammonia-offtake-markets/pages/GreenAmmoniaOfftakeMarketsPage"));
const GreenAmmoniaCountryIntelligencePage = React.lazy(() => import("./features/green-ammonia-country-intelligence/pages/GreenAmmoniaCountryIntelligencePage"));
const GreenAmmoniaPolicyCreditPage        = React.lazy(() => import("./features/green-ammonia-policy-credits/pages/GreenAmmoniaPolicyCreditPage"));
const HydrogenDerivativesComparisonPage   = React.lazy(() => import("./features/hydrogen-derivatives-comparison/pages/HydrogenDerivativesComparisonPage"));
// Sprint EF — SAF Finance
const SafLcofEnginePage                   = React.lazy(() => import("./features/saf-lcof-engine/pages/SafLcofEnginePage"));
const SafProjectFinancePage               = React.lazy(() => import("./features/saf-project-finance/pages/SafProjectFinancePage"));
const SafFeedstockSupplyChainPage         = React.lazy(() => import("./features/saf-feedstock-supply-chain/pages/SafFeedstockSupplyChainPage"));
const SafPolicyMandatePage                = React.lazy(() => import("./features/saf-policy-mandate/pages/SafPolicyMandatePage"));
const AirlineSafProcurementPage           = React.lazy(() => import("./features/airline-saf-procurement/pages/AirlineSafProcurementPage"));
const SafCarbonCreditsPage                = React.lazy(() => import("./features/saf-carbon-credits/pages/SafCarbonCreditsPage"));
// Sprint EG — Green Steel & Industrial Decarbonization
const GreenSteelLcopEnginePage            = React.lazy(() => import("./features/green-steel-lcop-engine/pages/GreenSteelLcopEnginePage"));
const IndustrialHydrogenIntegrationPage   = React.lazy(() => import("./features/industrial-hydrogen-integration/pages/IndustrialHydrogenIntegrationPage"));
const CbamAnalyticsCompliancePage         = React.lazy(() => import("./features/cbam-analytics-compliance/pages/CbamAnalyticsCompliancePage"));
const GreenCementConcreteFinancePage      = React.lazy(() => import("./features/green-cement-concrete-finance/pages/GreenCementConcreteFinancePage"));
const IndustrialElectrificationFinancePage = React.lazy(() => import("./features/industrial-electrification-finance/pages/IndustrialElectrificationFinancePage"));
const HardToAbateTransitionPage           = React.lazy(() => import("./features/hard-to-abate-transition/pages/HardToAbateTransitionPage"));
// Sprint EH — Carbon Dioxide Removal Finance
const DirectAirCaptureFinancePage         = React.lazy(() => import("./features/direct-air-capture-finance/pages/DirectAirCaptureFinancePage"));
const EnhancedWeatheringFinancePage       = React.lazy(() => import("./features/enhanced-weathering-finance/pages/EnhancedWeatheringFinancePage"));
const BiocharBeccsFinancePage             = React.lazy(() => import("./features/biochar-beccs-finance/pages/BiocharBeccsFinancePage"));
const OceanCdrFinancePage                 = React.lazy(() => import("./features/ocean-cdr-finance/pages/OceanCdrFinancePage"));
const CdrCreditMarketsPage                = React.lazy(() => import("./features/cdr-credit-markets/pages/CdrCreditMarketsPage"));
const CdrPortfolioNetzeroPage             = React.lazy(() => import("./features/cdr-portfolio-netzero/pages/CdrPortfolioNetzeroPage"));
// CCUS Market & Storage Infrastructure Suite
const CcusMarketIntelligencePage          = React.lazy(() => import("./features/ccus-market-intelligence/pages/CcusMarketIntelligencePage"));
const CcusProjectFinancePage              = React.lazy(() => import("./features/ccus-project-finance/pages/CcusProjectFinancePage"));
const CarbonStorageGeologyPage            = React.lazy(() => import("./features/carbon-storage-geology/pages/CarbonStorageGeologyPage"));
const DirectAirCapturePage                = React.lazy(() => import("./features/direct-air-capture/pages/DirectAirCapturePage"));
// Sprint EI — Climate Real Estate & Green Buildings Finance
const GreenBuildingCertificationFinancePage = React.lazy(() => import("./features/green-building-certification-finance/pages/GreenBuildingCertificationFinancePage"));
const CommercialReClimateRiskPage           = React.lazy(() => import("./features/commercial-re-climate-risk/pages/CommercialReClimateRiskPage"));
const GreenMortgageRetrofitFinancePage      = React.lazy(() => import("./features/green-mortgage-retrofit-finance/pages/GreenMortgageRetrofitFinancePage"));
const ReClimateStressTestPage               = React.lazy(() => import("./features/re-climate-stress-test/pages/ReClimateStressTestPage"));
const GresbRealAssetsEsgPage                = React.lazy(() => import("./features/gresb-real-assets-esg/pages/GresbRealAssetsEsgPage"));
const ClimateSmartInfrastructurePage        = React.lazy(() => import("./features/climate-smart-infrastructure/pages/ClimateSmartInfrastructurePage"));
// Sprint EJ — Circular Economy & Waste Finance
const CircularEconomyInvestmentPage         = React.lazy(() => import("./features/circular-economy-investment/pages/CircularEconomyInvestmentPage"));
const PlasticCreditsEprFinancePage          = React.lazy(() => import("./features/plastic-credits-epr-finance/pages/PlasticCreditsEprFinancePage"));
const WasteToEnergyBiogasFinancePage        = React.lazy(() => import("./features/waste-to-energy-biogas-finance/pages/WasteToEnergyBiogasFinancePage"));
const RecycledContentMarketsPage            = React.lazy(() => import("./features/recycled-content-markets/pages/RecycledContentMarketsPage"));
const EprComplianceIntelligencePage         = React.lazy(() => import("./features/epr-compliance-intelligence/pages/EprComplianceIntelligencePage"));
const CircularSupplyChainFinancePage        = React.lazy(() => import("./features/circular-supply-chain-finance/pages/CircularSupplyChainFinancePage"));
// Sprint EK — Climate Adaptation & Resilience Finance
const FloodResilienceFinancePage            = React.lazy(() => import("./features/flood-resilience-finance/pages/FloodResilienceFinancePage"));
const HeatAdaptationFinancePage             = React.lazy(() => import("./features/heat-adaptation-finance/pages/HeatAdaptationFinancePage"));
const ResilienceBondAnalyticsPage           = React.lazy(() => import("./features/resilience-bond-analytics/pages/ResilienceBondAnalyticsPage"));
const ClimateAdaptationPortfolioPage        = React.lazy(() => import("./features/climate-adaptation-portfolio/pages/ClimateAdaptationPortfolioPage"));
const JustTransitionAdaptationPage          = React.lazy(() => import("./features/just-transition-adaptation/pages/JustTransitionAdaptationPage"));
// Sprint EL — Utility Infrastructure Assets Finance
const PowerGridTransmissionFinancePage      = React.lazy(() => import("./features/power-grid-transmission-finance/pages/PowerGridTransmissionFinancePage"));
const WaterWastewaterUtilityFinancePage     = React.lazy(() => import("./features/water-wastewater-utility-finance/pages/WaterWastewaterUtilityFinancePage"));
const RegulatedUtilityRateCasePage         = React.lazy(() => import("./features/regulated-utility-rate-case/pages/RegulatedUtilityRateCasePage"));
const GasNetworkDecarbonisationPage        = React.lazy(() => import("./features/gas-network-decarbonisation/pages/GasNetworkDecarbonisationPage"));
const UtilityPhysicalClimateResiliencePage = React.lazy(() => import("./features/utility-physical-climate-resilience/pages/UtilityPhysicalClimateResiliencePage"));
const InfrastructureDebtUtilityBondsPage   = React.lazy(() => import("./features/infrastructure-debt-utility-bonds/pages/InfrastructureDebtUtilityBondsPage"));
// Sprint RE — Solar & Renewable Energy Intelligence Suite (new deep modules)
const RenewablePortfolioIntelligencePage = React.lazy(() => import("./features/renewable-portfolio-intelligence/pages/RenewablePortfolioIntelligencePage"));
const SolarResourcePerformancePage    = React.lazy(() => import("./features/solar-resource-performance/pages/SolarResourcePerformancePage"));
const PPARevenueAnalyticsPage         = React.lazy(() => import("./features/ppa-revenue-analytics/pages/PPARevenueAnalyticsPage"));
const BESSGridAnalyticsPage           = React.lazy(() => import("./features/bess-grid-analytics/pages/BESSGridAnalyticsPage"));
const RenewableMLForecastingPage      = React.lazy(() => import("./features/renewable-ml-forecasting/pages/RenewableMLForecastingPage"));
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
const AdditionalityAssessmentPage   = React.lazy(() => import("./features/additionality-assessment/pages/AdditionalityAssessmentPage"));
const CsrdDmaPage                   = React.lazy(() => import("./features/csrd-dma/pages/CsrdDmaPage"));
const ImpactAttributionPage         = React.lazy(() => import("./features/impact-attribution/pages/ImpactAttributionPage"));
const ImpactMeasurementHubPage      = React.lazy(() => import("./features/impact-measurement-hub/pages/ImpactMeasurementHubPage"));
const IndustrialCcsPage             = React.lazy(() => import("./features/industrial-ccs/pages/IndustrialCcsPage"));
const PortfolioDashboardPage        = React.lazy(() => import("./features/portfolio-dashboard/pages/PortfolioDashboardPage"));
const SdgAlignmentEnginePage        = React.lazy(() => import("./features/sdg-alignment-engine/pages/SdgAlignmentEnginePage"));
const SfdrPaiPage                   = React.lazy(() => import("./features/sfdr-pai/pages/SfdrPaiPage"));
const TheoryOfChangePage            = React.lazy(() => import("./features/theory-of-change/pages/TheoryOfChangePage"));
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
const SystemicESGRiskPage = React.lazy(() => import("./features/systemic-esg-risk/pages/SystemicESGRiskPage"));
const ClimatePolicyIntelligencePage = React.lazy(() => import("./features/climate-policy-intelligence/pages/ClimatePolicyIntelligencePage"));
const GreenCentralBankingPage = React.lazy(() => import("./features/green-central-banking/pages/GreenCentralBankingPage"));
const ESGFactorAttributionPage = React.lazy(() => import("./features/esg-factor-attribution/pages/ESGFactorAttributionPage"));
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
const CedaEmissionFactorsPage = React.lazy(() => import("./features/ceda-emission-factors/pages/CedaEmissionFactorsPage"));
const BigClimateDatabasePage = React.lazy(() => import("./features/big-climate-database/pages/BigClimateDatabasePage"));
const DataCaptureHubPage = React.lazy(() => import("./features/data-capture-hub/pages/DataCaptureHubPage"));
const ClientPitchPage = React.lazy(() => import("./features/client-pitch/pages/ClientPitchPage"));
const ReferenceDataExplorerPage = React.lazy(() => import("./features/reference-data-explorer/pages/ReferenceDataExplorerPage"));
// Next-Gen Use Cases (docs/NEXT_USE_CASES.md) — engine composition + free/keyless live data
const ClimateUnderwritingWorkbenchPage   = React.lazy(() => import("./features/climate-underwriting-workbench/pages/ClimateUnderwritingWorkbenchPage"));
const SovereignCorporateBridgePage       = React.lazy(() => import("./features/sovereign-corporate-bridge/pages/SovereignCorporateBridgePage"));
const EuComplianceCockpitPage            = React.lazy(() => import("./features/eu-compliance-cockpit/pages/EuComplianceCockpitPage"));
const AssetExposureExplorerPage          = React.lazy(() => import("./features/asset-exposure-explorer/pages/AssetExposureExplorerPage"));
const FloodLossCalibratorPage            = React.lazy(() => import("./features/flood-loss-calibrator/pages/FloodLossCalibratorPage"));
const SiteBiodiversityScreenerPage       = React.lazy(() => import("./features/site-biodiversity-screener/pages/SiteBiodiversityScreenerPage"));
const FacilityEmissionsAttributionPage   = React.lazy(() => import("./features/facility-emissions-attribution/pages/FacilityEmissionsAttributionPage"));
const VcmCrossRegistryTrackerPage        = React.lazy(() => import("./features/vcm-cross-registry-tracker/pages/VcmCrossRegistryTrackerPage"));
const GridCarbonIntelligencePage         = React.lazy(() => import("./features/grid-carbon-intelligence/pages/GridCarbonIntelligencePage"));
const SupervisoryScenarioRunnerPage      = React.lazy(() => import("./features/supervisory-scenario-runner/pages/SupervisoryScenarioRunnerPage"));
const CounterpartyOwnershipGraphPage     = React.lazy(() => import("./features/counterparty-ownership-graph/pages/CounterpartyOwnershipGraphPage"));
const SanctionsScreeningDeskPage         = React.lazy(() => import("./features/sanctions-screening-desk/pages/SanctionsScreeningDeskPage"));
const CreditSpreadClimateMonitorPage     = React.lazy(() => import("./features/credit-spread-climate-monitor/pages/CreditSpreadClimateMonitorPage"));
const ClimateLitigationTrackerPage       = React.lazy(() => import("./features/climate-litigation-tracker/pages/ClimateLitigationTrackerPage"));
const CbamTradeExposureMapperPage        = React.lazy(() => import("./features/cbam-trade-exposure-mapper/pages/CbamTradeExposureMapperPage"));
// Batch 2 — Energy & Capital Markets Desk (docs/NEXT_USE_CASES_2.md, NX2-01..16)
const PpaStructuringDeskPage             = React.lazy(() => import("./features/ppa-structuring-desk/pages/PpaStructuringDeskPage"));
const ProjectFinanceDebtSizerPage        = React.lazy(() => import("./features/project-finance-debt-sizer/pages/ProjectFinanceDebtSizerPage"));
const InfraDebtPortfolioManagerPage      = React.lazy(() => import("./features/infra-debt-portfolio-manager/pages/InfraDebtPortfolioManagerPage"));
const GreenBondPricingDeskPage           = React.lazy(() => import("./features/green-bond-pricing-desk/pages/GreenBondPricingDeskPage"));
const SlbStructurerPage                  = React.lazy(() => import("./features/slb-structurer/pages/SlbStructurerPage"));
const CarbonOfftakeStructurerPage        = React.lazy(() => import("./features/carbon-offtake-structurer/pages/CarbonOfftakeStructurerPage"));
const BatteryRevenueStackerPage          = React.lazy(() => import("./features/battery-revenue-stacker/pages/BatteryRevenueStackerPage"));
const HybridProjectWorkbenchPage         = React.lazy(() => import("./features/hybrid-project-workbench/pages/HybridProjectWorkbenchPage"));
const PfCreditRatingEnginePage           = React.lazy(() => import("./features/pf-credit-rating-engine/pages/PfCreditRatingEnginePage"));
const MaturityWallMonitorPage            = React.lazy(() => import("./features/maturity-wall-monitor/pages/MaturityWallMonitorPage"));
const CarbonDerivativesDeskPage          = React.lazy(() => import("./features/carbon-derivatives-desk/pages/CarbonDerivativesDeskPage"));
const PpaXvaEnginePage                   = React.lazy(() => import("./features/ppa-xva-engine/pages/PpaXvaEnginePage"));
const TaxEquityTransferabilityPage       = React.lazy(() => import("./features/tax-equity-transferability/pages/TaxEquityTransferabilityPage"));
const YieldcoDropdownAnalyzerPage        = React.lazy(() => import("./features/yieldco-dropdown-analyzer/pages/YieldcoDropdownAnalyzerPage"));
const EnergyTransitionCreditPortalPage   = React.lazy(() => import("./features/energy-transition-credit-portal/pages/EnergyTransitionCreditPortalPage"));
const FinancialModelingStudioPage        = React.lazy(() => import("./features/financial-modeling-studio/pages/FinancialModelingStudioPage"));
const ComplianceCarbonDeskPage           = React.lazy(() => import("./features/compliance-carbon-desk/pages/ComplianceCarbonDeskPage"));
const GlobalPhysicalRiskAtlasPage        = React.lazy(() => import("./features/global-physical-risk-atlas/pages/GlobalPhysicalRiskAtlasPage"));
// merged from main (2026-07): deployment/collaboration modules
const ClimateCollateralFrameworkPage     = React.lazy(() => import("./features/climate-collateral-framework/pages/ClimateCollateralFrameworkPage"));
const TeamAccessHubPage                  = React.lazy(() => import("./features/team-access-hub/pages/TeamAccessHubPage"));

/* ═══════════════════════════════════════════════════════════════════
   THEME — Institutional Light · Navy / Gold / Sage (AA Impact brand)
   Font: DM Sans (headlines) + JetBrains Mono (data)
   ═══════════════════════════════════════════════════════════════════ */
// Font loader — non-blocking Google Fonts injection (with preconnect)
if (typeof window !== 'undefined' && !document.querySelector('link[href*="DM+Sans"]')) {
  const _pc1 = document.createElement('link'); _pc1.rel = 'preconnect'; _pc1.href = 'https://fonts.googleapis.com';
  const _pc2 = document.createElement('link'); _pc2.rel = 'preconnect'; _pc2.href = 'https://fonts.gstatic.com'; _pc2.crossOrigin = 'anonymous';
  const _fl = document.createElement('link'); _fl.rel = 'stylesheet';
  _fl.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..800&family=JetBrains+Mono:wght@400;500;600;700&display=swap';
  document.head.appendChild(_pc1); document.head.appendChild(_pc2); document.head.appendChild(_fl);
}

// Global base styles — focus rings, motion system, refined scrollbars (injected once)
if (typeof window !== 'undefined' && !document.getElementById('a2-base-styles')) {
  const _st = document.createElement('style'); _st.id = 'a2-base-styles';
  _st.textContent = `
    :root { color-scheme: light; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; }
    body { background: #f4f6f9; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
    ::selection { background: rgba(37,99,168,0.16); }
    /* Accessible keyboard focus — visible ring, suppressed on mouse */
    :focus { outline: none; }
    :focus-visible { outline: 2px solid #2563a8; outline-offset: 2px; border-radius: 5px; }
    input:focus-visible, select:focus-visible, textarea:focus-visible { outline-offset: 1px; }
    /* Refined scrollbars — light surfaces */
    .a2-scroll { scrollbar-width: thin; scrollbar-color: rgba(120,134,153,0.38) transparent; }
    .a2-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
    .a2-scroll::-webkit-scrollbar-thumb { background: rgba(120,134,153,0.30); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
    .a2-scroll::-webkit-scrollbar-thumb:hover { background: rgba(120,134,153,0.48); background-clip: padding-box; }
    /* Refined scrollbars — dark navy sidebar */
    .a2-scroll-dark { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.16) transparent; }
    .a2-scroll-dark::-webkit-scrollbar { width: 9px; }
    .a2-scroll-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
    .a2-scroll-dark::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.26); background-clip: padding-box; }
    @keyframes a2-fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
    @keyframes a2-spin { to { transform: rotate(360deg); } }
    @keyframes a2-pulse-ring { 0% { transform: scale(1); opacity: 0.45; } 70%, 100% { transform: scale(2.4); opacity: 0; } }
    .a2-view { animation: a2-fade-in 0.28s cubic-bezier(0.22,1,0.36,1) both; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
      .a2-view { animation: none; }
    }
  `;
  document.head.appendChild(_st);
}


const LoadingFallback = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',
    background:'#f4f6f9',fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    <div style={{textAlign:'center'}}>
      <div style={{display:'inline-flex',alignItems:'center',gap:11,marginBottom:14}}>
        <div style={{width:30,height:30,borderRadius:8,background:'#1b3a5c',display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:11,fontWeight:800,color:'#c5a96a',fontFamily:"'JetBrains Mono',monospace",letterSpacing:'-0.02em'}}>A²</div>
        <div style={{width:18,height:18,border:'2px solid #e3e8ef',borderTopColor:'#2563a8',borderRadius:'50%',animation:'a2-spin 0.7s linear infinite'}} />
      </div>
      <div style={{fontSize:13,color:'#566373',fontWeight:500,letterSpacing:'0.01em'}}>Loading module…</div>
    </div>
  </div>
);
const T = {
  // ── Surfaces — cool neutral (institutional, not warm cream) ──
  bg:       '#f4f6f9',       // cool app background
  surface:  '#ffffff',       // cards / panels
  surfaceAlt:'#f7f9fc',      // subtle alternate panel
  surfaceH: '#eef1f6',       // hover tint (cool)
  border:   '#e3e8ef',       // hairline border
  borderL:  '#cfd6e0',       // stronger border
  // ── Brand — navy anchor ──
  navy:     '#1b3a5c',       // brand primary
  navyD:    '#12273d',       // deep navy (chrome)
  navyL:    '#2c5a8c',
  ink:      '#1a2433',       // cool near-black for headings
  // ── Accent — gold (brand) ──
  gold:     '#c5a96a',       // brand accent (use on dark / as fill)
  goldL:    '#d8c391',
  goldD:    '#8a6f2e',       // gold for text on light (AA-safe ~4.8:1)
  // ── Interactive — institutional blue (actions, focus, links) ──
  accent:   '#2563a8',
  accentL:  '#3b7bc4',
  accentBg: 'rgba(37,99,168,0.08)',
  // ── Status ──
  sage:     '#4f8a68',       // success / positive
  sageL:    '#7ba67d',
  teal:     '#4f8a68',       // alias for backward compat
  // ── Text — cool slate ramp (AA-verified) ──
  text:     '#1a2433',       // body / headings (~15:1 on white)
  textSec:  '#566373',       // secondary (~5.5:1, body-safe)
  textMut:  '#8a94a3',       // meta labels only (large/decorative)
  red:      '#dc2626',
  green:    '#15a34a',
  amber:    '#d97706',
  // ── Elevation — cool, soft ──
  card:     '0 1px 2px rgba(16,24,40,0.04), 0 0 0 1px rgba(16,24,40,0.05)',
  cardH:    '0 10px 28px -6px rgba(16,24,40,0.14), 0 0 0 1px rgba(16,24,40,0.06)',
  // ── Radius scale ──
  rSm: 6, rMd: 8, rLg: 12,
  font:     "'DM Sans', 'SF Pro Display', system-ui, -apple-system, sans-serif",
  mono:     "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
};

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
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, boxShadow: T.card,
    ...(pad ? { padding: '16px 18px' } : {}), ...style,
  }}>{children}</div>
);
/* ── Section label ── */
const SectionLabel = ({ children, count, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span style={{ fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: '-0.01em' }}>{children}</span>
    {count != null && (
      <span style={{ fontSize: 10, fontFamily: T.mono, color: T.textSec, fontWeight: 600, background: T.surfaceH, border: `1px solid ${T.border}`, padding: '1px 6px', borderRadius: 999 }}>{count}</span>
    )}
    {right && <span style={{ marginLeft: 'auto', fontSize: 10, color: T.textMut, fontWeight: 500 }}>{right}</span>}
  </div>
);

function Dashboard() {
  const navigate = useNavigate();
  const [domainFilter, setDomainFilter] = useState('');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const pieData = NAV_GROUPS.map((g, i) => ({ name: g.label.split('&')[0].trim().split(' ').slice(0,2).join(' '), value: g.items.length, color: g.color || PASTEL[i % PASTEL.length] }));
  const filteredGroups = domainFilter ? NAV_GROUPS.filter(g => (g.label || '').toLowerCase().includes(domainFilter.toLowerCase()) || g.items.some(i => (i.label || '').toLowerCase().includes(domainFilter.toLowerCase()))) : NAV_GROUPS;

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1480, margin: '0 auto' }}>
      {/* ── Command Center Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 23, fontWeight: 700, color: T.ink, margin: 0, letterSpacing: '-0.025em' }}>Platform Command Center</h1>
            <div style={{ height: 16, width: 1, background: T.borderL }} />
            <span style={{ fontSize: 11, fontFamily: T.mono, color: T.textSec, fontWeight: 500 }}>{dateStr}</span>
          </div>
          <p style={{ color: T.textSec, fontSize: 12, marginTop: 5, fontWeight: 400 }}>
            AA Impact Inc. — A² Intelligence Risk Analytics
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 999, border: `1px solid ${T.border}`, background: T.surface }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 7, height: 7 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: T.sage, opacity: 0.4, animation: 'a2-pulse-ring 2s ease-out infinite' }} />
              <span style={{ position: 'relative', width: 7, height: 7, borderRadius: '50%', background: T.sage }} />
            </span>
            <span style={{ fontSize: 10, fontFamily: T.mono, color: T.sage, fontWeight: 600, letterSpacing: '0.04em' }}>SYSTEMS NOMINAL</span>
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
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, padding: '14px 16px',
            boxShadow: T.card,
          }}>
            <div style={{ fontSize: 9, fontFamily: T.mono, color: T.textMut, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 25, fontWeight: 700, color: T.ink, fontFamily: T.mono, fontVariantNumeric: 'tabular-nums', lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</span>
              {s.delta && (
                <span style={{ fontSize: 10, fontFamily: T.mono, fontWeight: 600, color: s.deltaUp ? T.sage : T.red, display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: 8 }}>{s.deltaUp ? '▲' : '▼'}</span>{s.delta.replace(/^[+]/, '')}
                </span>
              )}
            </div>
            <div style={{ fontSize: 10, color: T.textSec, marginTop: 5 }}>{s.sub}</div>
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
          style={{ padding: '6px 11px', fontSize: 11, borderRadius: T.rSm, border: `1px solid ${T.border}`, background: T.surface, color: T.text, fontFamily: T.font, outline: 'none', width: 180, transition: 'border-color 0.15s, box-shadow 0.15s' }}
          onFocus={e => { e.target.style.borderColor = T.accent; e.target.style.boxShadow = `0 0 0 3px ${T.accentBg}`; }} onBlur={e => { e.target.style.borderColor = T.border; e.target.style.boxShadow = 'none'; }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, marginBottom: 28 }}>
        {filteredGroups.map((g) => (
          <div key={g.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.rMd, overflow: 'hidden', boxShadow: T.card, transition: 'box-shadow 0.18s cubic-bezier(0.22,1,0.36,1), transform 0.18s cubic-bezier(0.22,1,0.36,1), border-color 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = T.cardH; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = T.borderL; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = T.card; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = T.border; }}>
            <div style={{ padding: '12px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: `${g.color}1f`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>{g.icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.label}</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: T.mono, fontWeight: 700, color: T.textSec, background: T.surfaceH, border: `1px solid ${T.border}`, borderRadius: 999, padding: '1px 8px', flexShrink: 0 }}>{g.items.length}</span>
            </div>
            <div style={{ padding: '6px 8px' }}>
              {g.items.slice(0, 3).map(item => (
                <div key={item.code || item.path} onClick={() => navigate(item.path)} style={{
                  padding: '6px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  fontSize: 11, color: T.textSec, transition: 'background 0.12s, color 0.12s',
                }} onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.color = T.text; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec; }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  </span>
                  <span style={{ fontSize: 8, fontFamily: T.mono, color: T.textMut, fontWeight: 600, flexShrink: 0 }}>{item.code}</span>
                </div>
              ))}
              {g.items.length > 3 && (
                <div onClick={() => navigate(g.items[0].path)} style={{ padding: '5px 8px', fontSize: 10, fontFamily: T.mono, color: T.accent, fontWeight: 600, cursor: 'pointer' }}>+{g.items.length - 3} more →</div>
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
            <div key={n.code || n.path} onClick={() => navigate(n.path)} style={{
              padding: '10px 12px', borderRadius: T.rSm, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer',
              transition: 'box-shadow 0.15s, background 0.15s, border-color 0.15s', boxShadow: 'none',
            }} onMouseEnter={e => { e.currentTarget.style.boxShadow = T.card; e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.borderColor = T.borderL; }}
               onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: grp?.color || T.textMut, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 12 }}>
                <span style={{ fontSize: 9, color: T.textMut, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{n.badge}</span>
                <span style={{ fontSize: 8, fontFamily: T.mono, color: T.textMut, fontWeight: 600, flexShrink: 0 }}>{n.code}</span>
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

  const { canAccess } = useAuth();

  const filtered = useMemo(() => {
    const accessible = NAV_GROUPS.map(g => ({
      ...g, items: g.items.filter(i => canAccess(i.path)),
    })).filter(g => g.items.length > 0);
    if (!search) return accessible;
    const q = search.toLowerCase();
    return accessible.map(g => ({
      ...g, items: g.items.filter(i => (i.label || '').toLowerCase().includes(q) || (i.badge || '').toLowerCase().includes(q) || (i.code || '').toLowerCase().includes(q)),
    })).filter(g => g.items.length > 0);
  }, [search, canAccess]);

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
      <div className="a2-scroll-dark" style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 12px' }}>
        {filtered.map(group => {
          const isGroupActive = group.items.some(i => i.path === location.pathname);
          return (
            <div key={group.label} style={{ marginBottom: 2 }}>
              <div onClick={() => toggle(group.label)} style={{
                padding: '7px 9px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                borderRadius: 7, userSelect: 'none',
                background: isGroupActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isGroupActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={e => { if (!isGroupActive) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ fontSize: 12, width: 16, textAlign: 'center', filter: isGroupActive ? 'none' : 'saturate(0.85)' }}>{group.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: isGroupActive ? '#fff' : 'rgba(255,255,255,0.62)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.label}</span>
                <span style={{ fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.3)', fontWeight: 600, minWidth: 16, textAlign: 'right' }}>{group.items.length}</span>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.28)', transform: collapsed[group.label] ? 'rotate(-90deg)' : 'none', transition: 'transform 0.16s cubic-bezier(0.22,1,0.36,1)', marginLeft: 2 }}>▾</span>
              </div>
              {!collapsed[group.label] && (
                <div style={{ paddingLeft: 4 }}>
                  {group.items.map(n => {
                    const isActive = location.pathname === n.path;
                    return (
                      <NavLink key={n.code || n.path} to={n.path} style={{
                        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px 6px 26px', borderRadius: 7, marginTop: 1, textDecoration: 'none',
                        background: isActive ? 'rgba(197,169,106,0.16)' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {isActive && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 3, height: 14, borderRadius: 3, background: T.gold }} />}
                        <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? T.goldL : 'rgba(255,255,255,0.56)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.label}</span>
                        <span style={{ fontSize: 8, fontFamily: T.mono, fontWeight: 600, color: isActive ? 'rgba(216,195,145,0.8)' : 'rgba(255,255,255,0.2)', flexShrink: 0, marginLeft: 6 }}>{n.code}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 14 }}>
          <div style={{
            width: 27, height: 27, borderRadius: 7, background: T.gold,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: T.navyD, fontFamily: T.mono, letterSpacing: '-0.03em',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
          }}>A²</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '0.03em' }}>AA Impact Inc.</div>
            <div style={{ fontSize: 8, fontFamily: T.mono, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, letterSpacing: '0.06em' }}>A² INTELLIGENCE</div>
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

        {/* Command Palette Trigger */}
        <CommandPaletteTrigger />
        {/* Country Dataset Selector */}
        <CountryDatasetSelector />
        {/* Guided Mode Toggle */}
        <GuidedModeToggle />
        {/* Data Depth Toggle */}
        <DataDepthToggle />

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.03em' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.sageL }} />
            <span style={{ color: T.sageL, fontWeight: 600 }}>API</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>:8001</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        </div>
      </div>
      {/* Refined accent hairline */}
      <div style={{ height: 2, background: T.gold, opacity: 0.9 }} />
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
      height: 24, background: T.navyD, borderTop: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center', padding: '0 14px', gap: 10,
      fontSize: 9, fontFamily: T.mono, color: 'rgba(255,255,255,0.34)', flexShrink: 0, letterSpacing: '0.03em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL }} />
        <span style={{ color: T.sageL, fontWeight: 600 }}>CONNECTED</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
      <span>{ALL_ITEMS.length} MODULES</span>
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
      <span>{NAV_GROUPS.length} DOMAINS</span>
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
      <span>10 REGIONS</span>
      <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
      <span>60+ FRAMEWORKS</span>
      {current && <>
        <span style={{ color: 'rgba(255,255,255,0.12)' }}>·</span>
        <span style={{ color: 'rgba(216,195,145,0.85)', fontWeight: 500, maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.badge}</span>
      </>}
      <span style={{ marginLeft: 'auto', color: 'rgba(197,169,106,0.85)', fontWeight: 600, letterSpacing: '0.1em' }}>A² INTELLIGENCE</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APP SHELL
   ═══════════════════════════════════════════════════════════════════ */
function AppContent() {
  const [search, setSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, loading, daysRemaining } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingFallback />;

  if (!user) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/invite/:token" element={<InviteAcceptPage />} />
          <Route path="/access-expired" element={<AccessExpiredPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  if (daysRemaining !== null && daysRemaining <= 0) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="*" element={<AccessExpiredPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: T.font, color: T.text }}>
      <HeaderBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <DemoBanner />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <SectorSidebar search={search} setSearch={setSearch} sidebarOpen={sidebarOpen} />
        <main key={location.pathname} className="a2-scroll a2-view" style={{ flex: 1, overflowY: 'auto', background: T.bg, color: T.text }}>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/admin" element={<ProtectedRoute path="/admin" element={<AdminPanelPage />} />} />
            <Route path="/module-navigator" element={<ModuleNavigatorPage navGroups={NAV_GROUPS} />} />
            <Route path="/invite/:token" element={<InviteAcceptPage />} />
            <Route path="/access-expired" element={<AccessExpiredPage />} />
            <Route path="/crypto-climate" element={<ProtectedRoute path="/crypto-climate" element={<CryptoClimatePage />} />} />
            <Route path="/ai-governance" element={<ProtectedRoute path="/ai-governance" element={<AIGovernancePage />} />} />
            <Route path="/carbon-accounting-ai" element={<ProtectedRoute path="/carbon-accounting-ai" element={<CarbonAccountingAIPage />} />} />
            <Route path="/climate-insurance" element={<ProtectedRoute path="/climate-insurance" element={<ClimateInsurancePage />} />} />
            <Route path="/corporate-nature-strategy" element={<ProtectedRoute path="/corporate-nature-strategy" element={<CorporateNatureStrategyPage />} />} />
            <Route path="/green-securitisation" element={<ProtectedRoute path="/green-securitisation" element={<GreenSecuritisationPage />} />} />
            <Route path="/digital-product-passport" element={<ProtectedRoute path="/digital-product-passport" element={<DigitalProductPassportPage />} />} />
            <Route path="/adaptation-finance" element={<ProtectedRoute path="/adaptation-finance" element={<AdaptationFinancePage />} />} />
            <Route path="/internal-carbon-price" element={<ProtectedRoute path="/internal-carbon-price" element={<InternalCarbonPricePage />} />} />
            <Route path="/social-bond" element={<ProtectedRoute path="/social-bond" element={<SocialBondPage />} />} />
            <Route path="/climate-financial-statements" element={<ProtectedRoute path="/climate-financial-statements" element={<ClimateFinancialStatementsPage />} />} />
            <Route path="/em-climate-risk" element={<ProtectedRoute path="/em-climate-risk" element={<EMClimateRiskPage />} />} />
            <Route path="/biodiversity-credits" element={<ProtectedRoute path="/biodiversity-credits" element={<BiodiversityCreditsPage />} />} />
            <Route path="/carbon-removal" element={<ProtectedRoute path="/carbon-removal" element={<CarbonRemovalPage />} />} />
            <Route path="/climate-litigation" element={<ProtectedRoute path="/climate-litigation" element={<ClimateLitigationPage />} />} />
            <Route path="/water-risk" element={<ProtectedRoute path="/water-risk" element={<WaterRiskPage />} />} />
            <Route path="/critical-minerals" element={<ProtectedRoute path="/critical-minerals" element={<CriticalMineralsPage />} />} />
            <Route path="/nbs-finance" element={<ProtectedRoute path="/nbs-finance" element={<NbsFinancePage />} />} />
            <Route path="/sfdr-art9" element={<ProtectedRoute path="/sfdr-art9" element={<SFDRArt9Page />} />} />
            <Route path="/vcm-integrity" element={<ProtectedRoute path="/vcm-integrity" element={<VCMIntegrityPage />} />} />
            <Route path="/social-taxonomy" element={<ProtectedRoute path="/social-taxonomy" element={<SocialTaxonomyPage />} />} />
            <Route path="/green-hydrogen" element={<ProtectedRoute path="/green-hydrogen" element={<GreenHydrogenPage />} />} />
            <Route path="/transition-finance" element={<ProtectedRoute path="/transition-finance" element={<TransitionFinancePage />} />} />
            <Route path="/stress-test-orchestrator" element={<ProtectedRoute path="/stress-test-orchestrator" element={<StressTestOrchestratorPage />} />} />
            <Route path="/sscf" element={<ProtectedRoute path="/sscf" element={<SSCFPage />} />} />
            <Route path="/double-materiality" element={<ProtectedRoute path="/double-materiality" element={<DoubleMaterialityPage />} />} />
            <Route path="/temperature-alignment" element={<ProtectedRoute path="/temperature-alignment" element={<TemperatureAlignmentPage />} />} />
            <Route path="/physical-risk-pricing" element={<ProtectedRoute path="/physical-risk-pricing" element={<PhysicalRiskPricingPage />} />} />
            <Route path="/esg-data-quality" element={<ProtectedRoute path="/esg-data-quality" element={<ESGDataQualityPage />} />} />
            <Route path="/climate-derivatives" element={<ProtectedRoute path="/climate-derivatives" element={<ClimateDerivativesPage />} />} />
            <Route path="/sovereign-swf" element={<ProtectedRoute path="/sovereign-swf" element={<SovereignSWFPage />} />} />
            <Route path="/regulatory-capital" element={<ProtectedRoute path="/regulatory-capital" element={<RegulatoryCapitalPage />} />} />
            <Route path="/export-credit-esg" element={<ProtectedRoute path="/export-credit-esg" element={<ExportCreditESGPage />} />} />
            <Route path="/esg-controversy" element={<ProtectedRoute path="/esg-controversy" element={<ESGControversyPage />} />} />
            <Route path="/crrem" element={<ProtectedRoute path="/crrem" element={<CRREMPage />} />} />
            <Route path="/loss-damage" element={<ProtectedRoute path="/loss-damage" element={<LossDamagePage />} />} />
            <Route path="/forced-labour" element={<ProtectedRoute path="/forced-labour" element={<ForcedLabourPage />} />} />
            <Route path="/sll-slb-v2" element={<ProtectedRoute path="/sll-slb-v2" element={<SLLSLBv2Page />} />} />
            <Route path="/nature-capital-accounting" element={<ProtectedRoute path="/nature-capital-accounting" element={<NatureCapitalAccountingPage />} />} />
            <Route path="/regulatory-horizon" element={<ProtectedRoute path="/regulatory-horizon" element={<RegulatoryHorizonPage />} />} />
            <Route path="/climate-tech" element={<ProtectedRoute path="/climate-tech" element={<ClimateTechPage />} />} />
            <Route path="/comprehensive-reporting" element={<ProtectedRoute path="/comprehensive-reporting" element={<ComprehensiveReportingPage />} />} />
            <Route path="/sentiment-analysis" element={<ProtectedRoute path="/sentiment-analysis" element={<SentimentAnalysisPage />} />} />
            <Route path="/pcaf-india-brsr" element={<ProtectedRoute path="/pcaf-india-brsr" element={<PCafIndiaBrsrPage />} />} />
            <Route path="/equator-principles" element={<ProtectedRoute path="/equator-principles" element={<EquatorPrinciplesPage />} />} />
            <Route path="/esms" element={<ProtectedRoute path="/esms" element={<EsmsPage />} />} />
            <Route path="/issb-tcfd" element={<ProtectedRoute path="/issb-tcfd" element={<IssbTcfdPage />} />} />
            <Route path="/eu-taxonomy" element={<ProtectedRoute path="/eu-taxonomy" element={<EuTaxonomyPage />} />} />
            {/* Sprint E — Global Market Intelligence */}
            <Route path="/exchange-intelligence"  element={<ProtectedRoute path="/exchange-intelligence" element={<ExchangeIntelligencePage />} />} />
            <Route path="/sector-benchmarking"    element={<ProtectedRoute path="/sector-benchmarking" element={<SectorBenchmarkingPage />} />} />
            {/* Sprint F — Portfolio Intelligence & Client Services */}
            <Route path="/portfolio-manager"      element={<ProtectedRoute path="/portfolio-manager" element={<PortfolioManagerPage />} />} />
            <Route path="/esg-screener"           element={<ProtectedRoute path="/esg-screener" element={<EsgScreenerPage />} />} />
            <Route path="/stewardship-tracker"    element={<ProtectedRoute path="/stewardship-tracker" element={<StewardshipTrackerPage />} />} />
            <Route path="/client-report"          element={<ProtectedRoute path="/client-report" element={<ClientReportPage />} />} />
            <Route path="/regulatory-calendar"    element={<ProtectedRoute path="/regulatory-calendar" element={<RegulatoryCalendarPage />} />} />
            {/* Sprint G — Portfolio Intelligence Advanced Suite */}
            <Route path="/portfolio-suite"        element={<ProtectedRoute path="/portfolio-suite" element={<PortfolioSuitePage />} />} />
            <Route path="/scenario-stress-test"   element={<ProtectedRoute path="/scenario-stress-test" element={<ScenarioStressTestPage />} />} />
            <Route path="/carbon-budget"          element={<ProtectedRoute path="/carbon-budget" element={<CarbonBudgetPage />} />} />
            <Route path="/holdings-deep-dive"     element={<ProtectedRoute path="/holdings-deep-dive" element={<HoldingsDeepDivePage />} />} />
            <Route path="/benchmark-analytics"    element={<ProtectedRoute path="/benchmark-analytics" element={<BenchmarkAnalyticsPage />} />} />
            <Route path="/advanced-report-studio" element={<ProtectedRoute path="/advanced-report-studio" element={<AdvancedReportStudioPage />} />} />
            {/* Sprint H — Institutional Analytics & AI Intelligence */}
            <Route path="/risk-attribution"     element={<ProtectedRoute path="/risk-attribution" element={<RiskAttributionPage />} />} />
            <Route path="/fixed-income-esg"     element={<ProtectedRoute path="/fixed-income-esg" element={<FixedIncomeEsgPage />} />} />
            <Route path="/portfolio-optimizer"   element={<ProtectedRoute path="/portfolio-optimizer" element={<PortfolioOptimizerPage />} />} />
            <Route path="/controversy-monitor"   element={<ProtectedRoute path="/controversy-monitor" element={<ControversyMonitorPage />} />} />
            <Route path="/ai-sentiment"          element={<ProtectedRoute path="/ai-sentiment" element={<AiSentimentPage />} />} />
            <Route path="/regulatory-gap"        element={<ProtectedRoute path="/regulatory-gap" element={<RegulatoryGapPage />} />} />
            <Route path="/climate-physical-risk"  element={<ProtectedRoute path="/climate-physical-risk" element={<ClimatePhysicalRiskPage />} />} />
            <Route path="/climate-transition-risk" element={<ProtectedRoute path="/climate-transition-risk" element={<ClimateTransitionRiskPage />} />} />
            {/* Sprint I — Real Estate & Infrastructure ESG */}
            <Route path="/green-building-cert"    element={<ProtectedRoute path="/green-building-cert" element={<GreenBuildingCertPage />} />} />
            <Route path="/property-physical-risk" element={<ProtectedRoute path="/property-physical-risk" element={<PropertyPhysicalRiskPage />} />} />
            <Route path="/gresb-scoring"          element={<ProtectedRoute path="/gresb-scoring" element={<GRESBScoringPage />} />} />
            <Route path="/infra-esg-dd"           element={<ProtectedRoute path="/infra-esg-dd" element={<InfraESGDueDiligencePage />} />} />
            <Route path="/re-portfolio-dashboard" element={<ProtectedRoute path="/re-portfolio-dashboard" element={<REPortfolioDashboardPage />} />} />
            {/* Sprint J — Advanced Quantitative Analytics */}
            <Route path="/monte-carlo-var"           element={<ProtectedRoute path="/monte-carlo-var" element={<MonteCarloVarPage />} />} />
            <Route path="/esg-backtesting"           element={<ProtectedRoute path="/esg-backtesting" element={<EsgBacktestingPage />} />} />
            <Route path="/implied-temp-regression"   element={<ProtectedRoute path="/implied-temp-regression" element={<ImpliedTempRegressionPage />} />} />
            <Route path="/copula-tail-risk"          element={<ProtectedRoute path="/copula-tail-risk" element={<CopulaTailRiskPage />} />} />
            <Route path="/stochastic-scenarios"      element={<ProtectedRoute path="/stochastic-scenarios" element={<StochasticScenariosPage />} />} />
            <Route path="/quant-dashboard"           element={<ProtectedRoute path="/quant-dashboard" element={<QuantDashboardPage />} />} />
            {/* Sprint K — Supply Chain & Scope 3 */}
            <Route path="/scope3-engine"             element={<ProtectedRoute path="/scope3-engine" element={<Scope3EnginePage />} />} />
            <Route path="/supply-chain-map"          element={<ProtectedRoute path="/supply-chain-map" element={<SupplyChainMapPage />} />} />
            <Route path="/csddd-compliance"          element={<ProtectedRoute path="/csddd-compliance" element={<CSDDDCompliancePage />} />} />
            <Route path="/deforestation-risk"        element={<ProtectedRoute path="/deforestation-risk" element={<DeforestationRiskPage />} />} />
            <Route path="/supply-chain-carbon"       element={<ProtectedRoute path="/supply-chain-carbon" element={<SupplyChainCarbonPage />} />} />
            <Route path="/value-chain-dashboard"     element={<ProtectedRoute path="/value-chain-dashboard" element={<ValueChainDashboardPage />} />} />
            {/* Sprint L — Private Markets */}
            <Route path="/pe-vc-esg"                 element={<ProtectedRoute path="/pe-vc-esg" element={<PeVcEsgPage />} />} />
            <Route path="/private-credit"            element={<ProtectedRoute path="/private-credit" element={<PrivateCreditPage />} />} />
            <Route path="/fund-of-funds"             element={<ProtectedRoute path="/fund-of-funds" element={<FundOfFundsPage />} />} />
            <Route path="/lp-reporting"              element={<ProtectedRoute path="/lp-reporting" element={<LpReportingPage />} />} />
            <Route path="/co-investment"             element={<ProtectedRoute path="/co-investment" element={<CoInvestmentPage />} />} />
            <Route path="/private-markets-hub"       element={<ProtectedRoute path="/private-markets-hub" element={<PrivateMarketsHubPage />} />} />
            {/* Sprint M — Nature & Biodiversity */}
            <Route path="/tnfd-leap"                 element={<ProtectedRoute path="/tnfd-leap" element={<TnfdLeapPage />} />} />
            <Route path="/biodiversity-footprint"    element={<ProtectedRoute path="/biodiversity-footprint" element={<BiodiversityFootprintPage />} />} />
            <Route path="/ecosystem-services"        element={<ProtectedRoute path="/ecosystem-services" element={<EcosystemServicesPage />} />} />
            <Route path="/water-stress"              element={<ProtectedRoute path="/water-stress" element={<WaterStressPage />} />} />
            <Route path="/nature-scenarios"          element={<ProtectedRoute path="/nature-scenarios" element={<NatureScenariosPage />} />} />
            <Route path="/nature-hub"                element={<ProtectedRoute path="/nature-hub" element={<NatureHubPage />} />} />
            {/* Sprint N — Social & Human Capital */}
            <Route path="/board-diversity"           element={<ProtectedRoute path="/board-diversity" element={<BoardDiversityPage />} />} />
            <Route path="/living-wage"               element={<ProtectedRoute path="/living-wage" element={<LivingWagePage />} />} />
            <Route path="/human-rights-dd"           element={<ProtectedRoute path="/human-rights-dd" element={<HumanRightsDDPage />} />} />
            <Route path="/employee-wellbeing"        element={<ProtectedRoute path="/employee-wellbeing" element={<EmployeeWellbeingPage />} />} />
            <Route path="/social-impact"             element={<ProtectedRoute path="/social-impact" element={<SocialImpactPage />} />} />
            <Route path="/social-hub"                element={<ProtectedRoute path="/social-hub" element={<SocialHubPage />} />} />
            {/* Sprint O — Sovereign & Macro ESG */}
            <Route path="/sovereign-esg"             element={<ProtectedRoute path="/sovereign-esg" element={<SovereignEsgPage />} />} />
            <Route path="/climate-policy"            element={<ProtectedRoute path="/climate-policy" element={<ClimatePolicyPage />} />} />
            <Route path="/macro-transition"          element={<ProtectedRoute path="/macro-transition" element={<MacroTransitionPage />} />} />
            <Route path="/just-transition"           element={<ProtectedRoute path="/just-transition" element={<JustTransitionPage />} />} />
            <Route path="/paris-alignment"           element={<ProtectedRoute path="/paris-alignment" element={<ParisAlignmentPage />} />} />
            <Route path="/sovereign-hub"             element={<ProtectedRoute path="/sovereign-hub" element={<SovereignHubPage />} />} />
            {/* Sprint P — Data Infrastructure */}
            <Route path="/api-orchestration"         element={<ProtectedRoute path="/api-orchestration" element={<ApiOrchestrationPage />} />} />
            <Route path="/data-quality-monitor"      element={<ProtectedRoute path="/data-quality-monitor" element={<DataQualityMonitorPage />} />} />
            <Route path="/live-feed-manager"         element={<ProtectedRoute path="/live-feed-manager" element={<LiveFeedManagerPage />} />} />
            <Route path="/data-lineage"              element={<ProtectedRoute path="/data-lineage" element={<DataLineagePage />} />} />
            <Route path="/brsr-bridge"               element={<ProtectedRoute path="/brsr-bridge" element={<BrsrBridgePage />} />} />
            <Route path="/data-infra-hub"            element={<ProtectedRoute path="/data-infra-hub" element={<DataInfraHubPage />} />} />
            {/* Sprint Q — Taxonomy & Classification */}
            <Route path="/eu-taxonomy-engine"        element={<ProtectedRoute path="/eu-taxonomy-engine" element={<EuTaxonomyEnginePage />} />} />
            <Route path="/sfdr-classification"       element={<ProtectedRoute path="/sfdr-classification" element={<SfdrClassificationPage />} />} />
            <Route path="/issb-materiality"          element={<ProtectedRoute path="/issb-materiality" element={<IssbMaterialityPage />} />} />
            <Route path="/gri-alignment"             element={<ProtectedRoute path="/gri-alignment" element={<GriAlignmentPage />} />} />
            <Route path="/framework-interop"         element={<ProtectedRoute path="/framework-interop" element={<FrameworkInteropPage />} />} />
            <Route path="/taxonomy-hub"              element={<ProtectedRoute path="/taxonomy-hub" element={<TaxonomyHubPage />} />} />
            {/* Sprint Q-Extended — ML Taxonomy · Capital Markets · FI · Carbon · Energy · Global v2 */}
            <Route path="/taxonomy-ml-classifier"    element={<ProtectedRoute path="/taxonomy-ml-classifier" element={<TaxonomyMlClassifierPage />} />} />
            <Route path="/capital-markets-taxonomy"  element={<ProtectedRoute path="/capital-markets-taxonomy" element={<CapitalMarketsTaxonomyPage />} />} />
            <Route path="/fi-taxonomy-pcaf-bridge"   element={<ProtectedRoute path="/fi-taxonomy-pcaf-bridge" element={<FiTaxonomyPcafBridgePage />} />} />
            <Route path="/carbon-institutions-taxonomy" element={<ProtectedRoute path="/carbon-institutions-taxonomy" element={<CarbonInstitutionsTaxonomyPage />} />} />
            <Route path="/energy-sector-taxonomy"    element={<ProtectedRoute path="/energy-sector-taxonomy" element={<EnergySectorTaxonomyPage />} />} />
            <Route path="/global-taxonomy-interop-v2" element={<ProtectedRoute path="/global-taxonomy-interop-v2" element={<GlobalTaxonomyInteropV2Page />} />} />
            {/* Sprint R — Client & Reporting Automation */}
            <Route path="/report-generator"          element={<ProtectedRoute path="/report-generator" element={<ReportGeneratorPage />} />} />
            <Route path="/template-manager"          element={<ProtectedRoute path="/template-manager" element={<TemplateManagerPage />} />} />
            <Route path="/client-portal"             element={<ProtectedRoute path="/client-portal" element={<ClientPortalPage />} />} />
            <Route path="/scheduled-reports"         element={<ProtectedRoute path="/scheduled-reports" element={<ScheduledReportsPage />} />} />
            <Route path="/regulatory-submission"     element={<ProtectedRoute path="/regulatory-submission" element={<RegulatorySubmissionPage />} />} />
            <Route path="/reporting-hub"             element={<ProtectedRoute path="/reporting-hub" element={<ReportingHubPage />} />} />
            {/* Sprint S — Data Management Engine */}
            <Route path="/data-validation"           element={<ProtectedRoute path="/data-validation" element={<DataValidationPage />} />} />
            <Route path="/data-reconciliation"       element={<ProtectedRoute path="/data-reconciliation" element={<DataReconciliationPage />} />} />
            <Route path="/data-versioning"           element={<ProtectedRoute path="/data-versioning" element={<DataVersioningPage />} />} />
            <Route path="/etl-pipeline"              element={<ProtectedRoute path="/etl-pipeline" element={<EtlPipelinePage />} />} />
            <Route path="/data-governance"           element={<ProtectedRoute path="/data-governance" element={<DataGovernancePage />} />} />
            <Route path="/dme-hub"                   element={<ProtectedRoute path="/dme-hub" element={<DmeHubPage />} />} />
            {/* Sprint U — DME Platform Integration */}
            <Route path="/dme-dashboard"     element={<ProtectedRoute path="/dme-dashboard" element={<DmeDashboardPage />} />} />
            <Route path="/dme-risk-engine"   element={<ProtectedRoute path="/dme-risk-engine" element={<DmeRiskEnginePage />} />} />
            <Route path="/dme-entity"        element={<ProtectedRoute path="/dme-entity" element={<DmeEntityPage />} />} />
            <Route path="/dme-scenarios"     element={<ProtectedRoute path="/dme-scenarios" element={<DmeScenariosPage />} />} />
            <Route path="/dme-alerts"        element={<ProtectedRoute path="/dme-alerts" element={<DmeAlertsPage />} />} />
            <Route path="/dme-contagion"     element={<ProtectedRoute path="/dme-contagion" element={<DmeContagionPage />} />} />
            <Route path="/dme-portfolio"     element={<ProtectedRoute path="/dme-portfolio" element={<DmePortfolioPage />} />} />
            <Route path="/dme-competitive"   element={<ProtectedRoute path="/dme-competitive" element={<DmeCompetitivePage />} />} />
            <Route path="/dme-nlp-engine"    element={<ProtectedRoute path="/dme-nlp-engine" element={<DmeNlpEnginePage />} />} />
            <Route path="/dme-ml-materiality" element={<ProtectedRoute path="/dme-ml-materiality" element={<DmeMlMaterialityPage />} />} />
            {/* Sprint T — Dynamic Materiality Engine */}
            {/* double-materiality route already exists from Sprint 35 (line 801) */}
            <Route path="/stakeholder-impact"        element={<ProtectedRoute path="/stakeholder-impact" element={<StakeholderImpactPage />} />} />
            <Route path="/materiality-trends"        element={<ProtectedRoute path="/materiality-trends" element={<MaterialityTrendsPage />} />} />
            <Route path="/controversy-materiality"   element={<ProtectedRoute path="/controversy-materiality" element={<ControversyMaterialityPage />} />} />
            <Route path="/materiality-scenarios"     element={<ProtectedRoute path="/materiality-scenarios" element={<MaterialityScenariosPage />} />} />
            <Route path="/materiality-hub"           element={<ProtectedRoute path="/materiality-hub" element={<MaterialityHubPage />} />} />
            {/* Sprint X — Impact Measurement & SDG Finance */}
            <Route path="/impact-weighted-accounts"  element={<ProtectedRoute path="/impact-weighted-accounts" element={<ImpactWeightedAccountsPage />} />} />
            <Route path="/iris-metrics"              element={<ProtectedRoute path="/iris-metrics" element={<IrisMetricsPage />} />} />
            <Route path="/sdg-bond-impact"           element={<ProtectedRoute path="/sdg-bond-impact" element={<SdgBondImpactPage />} />} />
            <Route path="/blended-finance"           element={<ProtectedRoute path="/blended-finance" element={<BlendedFinancePage />} />} />
            <Route path="/undp-blended-finance"     element={<ProtectedRoute path="/undp-blended-finance" element={<UndpBlendedFinancePage />} />} />
            <Route path="/impact-verification"       element={<ProtectedRoute path="/impact-verification" element={<ImpactVerificationPage />} />} />
            <Route path="/impact-hub"                element={<ProtectedRoute path="/impact-hub" element={<ImpactHubPage />} />} />
            {/* Sprint Z — Consumer Carbon Intelligence */}
            <Route path="/integrated-carbon-emissions" element={<ProtectedRoute path="/integrated-carbon-emissions" element={<IntegratedCarbonEmissionsPage />} />} />
            <Route path="/carbon-calculator"          element={<ProtectedRoute path="/carbon-calculator" element={<CarbonCalculatorPage />} />} />
            <Route path="/carbon-wallet"              element={<ProtectedRoute path="/carbon-wallet" element={<CarbonWalletPage />} />} />
            <Route path="/invoice-parser"             element={<ProtectedRoute path="/invoice-parser" element={<InvoiceParserPage />} />} />
            <Route path="/spending-carbon"            element={<ProtectedRoute path="/spending-carbon" element={<SpendingCarbonPage />} />} />
            <Route path="/carbon-economy"             element={<ProtectedRoute path="/carbon-economy" element={<CarbonEconomyPage />} />} />
            <Route path="/consumer-carbon-hub"        element={<ProtectedRoute path="/consumer-carbon-hub" element={<ConsumerCarbonHubPage />} />} />
            {/* Sprint W — AI & NLP Analytics */}
            <Route path="/quantitative-nlp-research" element={<ProtectedRoute path="/quantitative-nlp-research" element={<QuantitativeNLPResearchPage />} />} />
            <Route path="/macro-esg-intelligence" element={<ProtectedRoute path="/macro-esg-intelligence" element={<MacroESGIntelligencePage />} />} />
            <Route path="/climate-emissions-intelligence" element={<ProtectedRoute path="/climate-emissions-intelligence" element={<ClimateEmissionsIntelligencePage />} />} />
            <Route path="/esg-report-parser"       element={<ProtectedRoute path="/esg-report-parser" element={<EsgReportParserPage />} />} />
            <Route path="/predictive-esg"          element={<ProtectedRoute path="/predictive-esg" element={<PredictiveEsgPage />} />} />
            <Route path="/anomaly-detection"       element={<ProtectedRoute path="/anomaly-detection" element={<AnomalyDetectionPage />} />} />
            <Route path="/ai-engagement"           element={<ProtectedRoute path="/ai-engagement" element={<AiEngagementPage />} />} />
            <Route path="/document-similarity"     element={<ProtectedRoute path="/document-similarity" element={<DocumentSimilarityPage />} />} />
            <Route path="/ai-hub"                  element={<ProtectedRoute path="/ai-hub" element={<AiHubPage />} />} />
            <Route path="/ai-data-live-platform"   element={<ProtectedRoute path="/ai-data-live-platform" element={<AIDataLivePlatformPage />} />} />
            {/* Sprint Y — Commodity Lifecycle Intelligence */}
            <Route path="/commodity-intelligence"     element={<ProtectedRoute path="/commodity-intelligence" element={<CommodityIntelligencePage />} />} />
            <Route path="/commodity-inventory"        element={<ProtectedRoute path="/commodity-inventory" element={<CommodityInventoryPage />} />} />
            <Route path="/lifecycle-assessment"       element={<ProtectedRoute path="/lifecycle-assessment" element={<LifecycleAssessmentPage />} />} />
            <Route path="/financial-flow"             element={<ProtectedRoute path="/financial-flow" element={<FinancialFlowPage />} />} />
            <Route path="/esg-value-chain"            element={<ProtectedRoute path="/esg-value-chain" element={<EsgValueChainPage />} />} />
            <Route path="/climate-nature-repo"        element={<ProtectedRoute path="/climate-nature-repo" element={<ClimateNatureRepoPage />} />} />
            <Route path="/multi-factor-integration"   element={<ProtectedRoute path="/multi-factor-integration" element={<MultiFactorIntegrationPage />} />} />
            <Route path="/commodity-hub"              element={<ProtectedRoute path="/commodity-hub" element={<CommodityHubPage />} />} />
            <Route path="/product-anatomy"            element={<ProtectedRoute path="/product-anatomy" element={<ProductAnatomyPage />} />} />
            <Route path="/epd-lca-database"           element={<ProtectedRoute path="/epd-lca-database" element={<EpdLcaDatabasePage />} />} />
            <Route path="/ceda-emission-factors"      element={<ProtectedRoute path="/ceda-emission-factors" element={<CedaEmissionFactorsPage />} />} />
            <Route path="/big-climate-database"       element={<ProtectedRoute path="/big-climate-database" element={<BigClimateDatabasePage />} />} />
            <Route path="/data-capture-hub"           element={<ProtectedRoute path="/data-capture-hub" element={<DataCaptureHubPage />} />} />
            <Route path="/reference-data-explorer"  element={<ProtectedRoute path="/reference-data-explorer" element={<ReferenceDataExplorerPage />} />} />
            {/* Sprint AI — Corporate Decarbonisation & SBTi Intelligence */}
            <Route path="/decarbonisation-hub"         element={<ProtectedRoute path="/decarbonisation-hub" element={<DecarbonisationHubPage />} />} />
            <Route path="/sbti-target-setter"          element={<ProtectedRoute path="/sbti-target-setter" element={<SbtiTargetSetterPage />} />} />
            <Route path="/decarbonisation-roadmap"     element={<ProtectedRoute path="/decarbonisation-roadmap" element={<DecarbonisationRoadmapPage />} />} />
            <Route path="/abatement-cost-curve"        element={<ProtectedRoute path="/abatement-cost-curve" element={<AbatementCostCurvePage />} />} />
            <Route path="/energy-transition-analytics" element={<ProtectedRoute path="/energy-transition-analytics" element={<EnergyTransitionAnalyticsPage />} />} />
            <Route path="/carbon-reduction-projects"   element={<ProtectedRoute path="/carbon-reduction-projects" element={<CarbonReductionProjectsPage />} />} />
            {/* Sprint AJ — Financed Emissions & Climate Banking Analytics */}
            <Route path="/climate-banking-hub"           element={<ProtectedRoute path="/climate-banking-hub" element={<ClimateBankingHubPage />} />} />
            <Route path="/pcaf-financed-emissions"       element={<ProtectedRoute path="/pcaf-financed-emissions" element={<PcafFinancedEmissionsPage />} />} />
            <Route path="/climate-stress-test"           element={<ProtectedRoute path="/climate-stress-test" element={<ClimateStressTestPage />} />} />
            <Route path="/green-asset-ratio"             element={<ProtectedRoute path="/green-asset-ratio" element={<GreenAssetRatioPage />} />} />
            <Route path="/portfolio-temperature-score"   element={<ProtectedRoute path="/portfolio-temperature-score" element={<PortfolioTemperatureScorePage />} />} />
            <Route path="/climate-credit-risk-analytics" element={<ProtectedRoute path="/climate-credit-risk-analytics" element={<ClimateCreditRiskPage />} />} />
            {/* Sprint AV — Geopolitical Risk & Climate Security Intelligence */}
            {/* Platform Administration */}
            <Route path="/data-source-manager"       element={<ProtectedRoute path="/data-source-manager" element={<DataSourceManagerPage />} />} />
            <Route path="/db-explorer"               element={<ProtectedRoute path="/db-explorer" element={<DbExplorerPage />} />} />
            <Route path="/user-role-management"      element={<ProtectedRoute path="/user-role-management" element={<UserRoleManagementPage />} />} />
            <Route path="/audit-trail-viewer"        element={<ProtectedRoute path="/audit-trail-viewer" element={<AuditTrailViewerPage />} />} />
            <Route path="/api-gateway-monitor"       element={<ProtectedRoute path="/api-gateway-monitor" element={<ApiGatewayMonitorPage />} />} />
            <Route path="/data-quality-dashboard"    element={<ProtectedRoute path="/data-quality-dashboard" element={<DataQualityDashboardPage />} />} />
            <Route path="/calculation-engine-monitor" element={<ProtectedRoute path="/calculation-engine-monitor" element={<CalculationEngineMonitorPage />} />} />
            <Route path="/platform-settings"         element={<ProtectedRoute path="/platform-settings" element={<PlatformSettingsPage />} />} />
            <Route path="/geopolitical-esg-hub"          element={<ProtectedRoute path="/geopolitical-esg-hub" element={<GeopoliticalEsgHubPage />} />} />
            <Route path="/sanctions-climate-finance"     element={<ProtectedRoute path="/sanctions-climate-finance" element={<SanctionsClimateFinancePage />} />} />
            <Route path="/energy-security-transition"    element={<ProtectedRoute path="/energy-security-transition" element={<EnergySecurityTransitionPage />} />} />
            <Route path="/critical-mineral-geopolitics"  element={<ProtectedRoute path="/critical-mineral-geopolitics" element={<CriticalMineralGeopoliticsPage />} />} />
            <Route path="/trade-carbon-policy"           element={<ProtectedRoute path="/trade-carbon-policy" element={<TradeCarbonPolicyPage />} />} />
            <Route path="/climate-migration-risk"        element={<ProtectedRoute path="/climate-migration-risk" element={<ClimateMigrationRiskPage />} />} />
            {/* Sprint AU — Climate & Health Nexus Finance */}
            <Route path="/climate-health-hub"           element={<ProtectedRoute path="/climate-health-hub" element={<ClimateHealthHubPage />} />} />
            <Route path="/heat-mortality-risk"          element={<ProtectedRoute path="/heat-mortality-risk" element={<HeatMortalityRiskPage />} />} />
            <Route path="/air-quality-finance"          element={<ProtectedRoute path="/air-quality-finance" element={<AirQualityFinancePage />} />} />
            <Route path="/pandemic-climate-nexus"       element={<ProtectedRoute path="/pandemic-climate-nexus" element={<PandemicClimateNexusPage />} />} />
            <Route path="/health-adaptation-finance"    element={<ProtectedRoute path="/health-adaptation-finance" element={<HealthAdaptationFinancePage />} />} />
            <Route path="/worker-heat-stress"           element={<ProtectedRoute path="/worker-heat-stress" element={<WorkerHeatStressPage />} />} />
            {/* Sprint AT — Food Systems & Agricultural Finance */}
            <Route path="/agri-finance-hub"             element={<ProtectedRoute path="/agri-finance-hub" element={<AgriFinanceHubPage />} />} />
            <Route path="/regenerative-agriculture"     element={<ProtectedRoute path="/regenerative-agriculture" element={<RegenerativeAgriculturePage />} />} />
            <Route path="/food-supply-chain-emissions"  element={<ProtectedRoute path="/food-supply-chain-emissions" element={<FoodSupplyChainEmissionsPage />} />} />
            <Route path="/water-agriculture-risk"       element={<ProtectedRoute path="/water-agriculture-risk" element={<WaterAgricultureRiskPage />} />} />
            <Route path="/land-use-carbon"              element={<ProtectedRoute path="/land-use-carbon" element={<LandUseCarbonPage />} />} />
            <Route path="/agri-biodiversity"            element={<ProtectedRoute path="/agri-biodiversity" element={<AgriBiodiversityPage />} />} />
            {/* Sprint AS — Real Estate & Built Environment ESG */}
            <Route path="/real-estate-esg-hub"          element={<ProtectedRoute path="/real-estate-esg-hub" element={<RealEstateEsgHubPage />} />} />
            <Route path="/building-energy-performance"  element={<ProtectedRoute path="/building-energy-performance" element={<BuildingEnergyPerformancePage />} />} />
            <Route path="/green-building-certification" element={<ProtectedRoute path="/green-building-certification" element={<GreenBuildingCertificationPage />} />} />
            <Route path="/embodied-carbon"              element={<ProtectedRoute path="/embodied-carbon" element={<EmbodiedCarbonPage />} />} />
            <Route path="/climate-resilient-design"     element={<ProtectedRoute path="/climate-resilient-design" element={<ClimateResilientDesignPage />} />} />
            <Route path="/tenant-engagement-esg"        element={<ProtectedRoute path="/tenant-engagement-esg" element={<TenantEngagementEsgPage />} />} />
            {/* Sprint AR — Insurance & Underwriting Climate Analytics */}
            <Route path="/insurance-climate-hub"        element={<ProtectedRoute path="/insurance-climate-hub" element={<InsuranceClimateHubPage />} />} />
            <Route path="/catastrophe-modelling"        element={<ProtectedRoute path="/catastrophe-modelling" element={<CatastropheModellingPage />} />} />
            <Route path="/underwriting-esg"             element={<ProtectedRoute path="/underwriting-esg" element={<UnderwritingEsgPage />} />} />
            <Route path="/parametric-insurance"         element={<ProtectedRoute path="/parametric-insurance" element={<ParametricInsurancePage />} />} />
            <Route path="/reinsurance-climate"          element={<ProtectedRoute path="/reinsurance-climate" element={<ReinsuranceClimatePage />} />} />
            <Route path="/insurance-transition"         element={<ProtectedRoute path="/insurance-transition" element={<InsuranceTransitionPage />} />} />
            {/* Sprint AQ — Sovereign ESG & Country-Level Climate Risk Intelligence */}
            <Route path="/sovereign-esg-hub"             element={<ProtectedRoute path="/sovereign-esg-hub" element={<SovereignEsgHubPage />} />} />
            <Route path="/sovereign-climate-risk"        element={<ProtectedRoute path="/sovereign-climate-risk" element={<SovereignClimateRiskPage />} />} />
            <Route path="/sovereign-debt-sustainability" element={<ProtectedRoute path="/sovereign-debt-sustainability" element={<SovereignDebtSustainabilityPage />} />} />
            <Route path="/central-bank-climate"          element={<ProtectedRoute path="/central-bank-climate" element={<CentralBankClimatePage />} />} />
            <Route path="/sovereign-nature-risk"         element={<ProtectedRoute path="/sovereign-nature-risk" element={<SovereignNatureRiskPage />} />} />
            <Route path="/sovereign-social-index"        element={<ProtectedRoute path="/sovereign-social-index" element={<SovereignSocialIndexPage />} />} />
            {/* Sprint AP — Supply Chain ESG & Scope 3 Value Chain Intelligence */}
            <Route path="/supply-chain-esg-hub"       element={<ProtectedRoute path="/supply-chain-esg-hub" element={<SupplyChainEsgHubPage />} />} />
            <Route path="/scope3-upstream-tracker"    element={<ProtectedRoute path="/scope3-upstream-tracker" element={<Scope3UpstreamTrackerPage />} />} />
            <Route path="/supplier-engagement"        element={<ProtectedRoute path="/supplier-engagement" element={<SupplierEngagementPage />} />} />
            <Route path="/commodity-deforestation"    element={<ProtectedRoute path="/commodity-deforestation" element={<CommodityDeforestationPage />} />} />
            <Route path="/conflict-minerals"          element={<ProtectedRoute path="/conflict-minerals" element={<ConflictMineralsPage />} />} />
            <Route path="/supply-chain-resilience"    element={<ProtectedRoute path="/supply-chain-resilience" element={<SupplyChainResiliencePage />} />} />
            {/* Sprint AO — Scope 4 / Avoided Emissions & Climate Solutions */}
            <Route path="/avoided-emissions-hub"       element={<ProtectedRoute path="/avoided-emissions-hub" element={<AvoidedEmissionsHubPage />} />} />
            <Route path="/scope4-avoided-emissions"    element={<ProtectedRoute path="/scope4-avoided-emissions" element={<Scope4AvoidedEmissionsPage />} />} />
            <Route path="/product-carbon-handprint"    element={<ProtectedRoute path="/product-carbon-handprint" element={<ProductCarbonHandprintPage />} />} />
            <Route path="/enablement-methodology"      element={<ProtectedRoute path="/enablement-methodology" element={<EnablementMethodologyPage />} />} />
            <Route path="/avoided-emissions-portfolio" element={<ProtectedRoute path="/avoided-emissions-portfolio" element={<AvoidedEmissionsPortfolioPage />} />} />
            <Route path="/climate-solution-taxonomy"   element={<ProtectedRoute path="/climate-solution-taxonomy" element={<ClimateSolutionTaxonomyPage />} />} />
            {/* Sprint AN — Sustainable Transport & Logistics Decarbonisation */}
            <Route path="/sustainable-transport-hub"  element={<ProtectedRoute path="/sustainable-transport-hub" element={<SustainableTransportHubPage />} />} />
            <Route path="/maritime-imo-compliance"    element={<ProtectedRoute path="/maritime-imo-compliance" element={<MaritimeImoCompliancePage />} />} />
            <Route path="/aviation-corsia"            element={<ProtectedRoute path="/aviation-corsia" element={<AviationCorsiaPage />} />} />
            <Route path="/ev-fleet-finance"           element={<ProtectedRoute path="/ev-fleet-finance" element={<EvFleetFinancePage />} />} />
            <Route path="/sustainable-aviation-fuel"  element={<ProtectedRoute path="/sustainable-aviation-fuel" element={<SustainableAviationFuelPage />} />} />
            <Route path="/transport-decarbonisation"  element={<ProtectedRoute path="/transport-decarbonisation" element={<TransportDecarbonisationPage />} />} />
            {/* Sprint AM — Climate Fintech & Digital MRV Intelligence */}
            <Route path="/climate-fintech-hub"        element={<ProtectedRoute path="/climate-fintech-hub" element={<ClimateFintechHubPage />} />} />
            <Route path="/digital-mrv"                element={<ProtectedRoute path="/digital-mrv" element={<DigitalMrvPage />} />} />
            <Route path="/satellite-climate-monitor"  element={<ProtectedRoute path="/satellite-climate-monitor" element={<SatelliteClimateMonitorPage />} />} />
            <Route path="/blockchain-carbon-registry" element={<ProtectedRoute path="/blockchain-carbon-registry" element={<BlockchainCarbonRegistryPage />} />} />
            <Route path="/climate-data-marketplace"   element={<ProtectedRoute path="/climate-data-marketplace" element={<ClimateDataMarketplacePage />} />} />
            <Route path="/iot-emissions-tracker"      element={<ProtectedRoute path="/iot-emissions-tracker" element={<IotEmissionsTrackerPage />} />} />
            {/* Sprint BZ — Advanced Predictive & Agentic Analytics */}
            <Route path="/esg-time-series-forecaster"  element={<ProtectedRoute path="/esg-time-series-forecaster" element={<ESGTimeSeriesForecasterPage />} />} />
            <Route path="/sentiment-alpha-engine"      element={<ProtectedRoute path="/sentiment-alpha-engine" element={<SentimentAlphaEnginePage />} />} />
            <Route path="/ai-compliance-agent"         element={<ProtectedRoute path="/ai-compliance-agent" element={<AIComplianceAgentPage />} />} />
            {/* Sprint BY — AI Intelligence Layer */}
            <Route path="/llm-esg-extractor"          element={<ProtectedRoute path="/llm-esg-extractor" element={<LLMESGExtractorPage />} />} />
            <Route path="/greenwashing-detection"     element={<ProtectedRoute path="/greenwashing-detection" element={<GreenwashingDetectionPage />} />} />
            <Route path="/esg-narrative-intelligence" element={<ProtectedRoute path="/esg-narrative-intelligence" element={<ESGNarrativeIntelligencePage />} />} />
            {/* Sprint BX — Quantitative Physical Risk Engine */}
            <Route path="/physical-hazard-map"         element={<ProtectedRoute path="/physical-hazard-map" element={<PhysicalHazardMapPage />} />} />
            <Route path="/damage-function-calculator"  element={<ProtectedRoute path="/damage-function-calculator" element={<DamageFunctionCalculatorPage />} />} />
            <Route path="/physical-risk-portfolio"     element={<ProtectedRoute path="/physical-risk-portfolio" element={<PhysicalRiskPortfolioPage />} />} />
            {/* Sprint CA — Transition Risk DCF & Stranded Assets & Tech Displacement */}
            <Route path="/transition-risk-dcf"           element={<ProtectedRoute path="/transition-risk-dcf" element={<TransitionRiskDcfPage />} />} />
            <Route path="/stranded-asset-analyzer"       element={<ProtectedRoute path="/stranded-asset-analyzer" element={<StrandedAssetAnalyzerPage />} />} />
            <Route path="/tech-displacement-modeler"     element={<ProtectedRoute path="/tech-displacement-modeler" element={<TechDisplacementModelerPage />} />} />
            {/* Sprint CB — Sector Scorecard · Just Transition · Policy Impact */}
            <Route path="/sector-transition-scorecard"   element={<ProtectedRoute path="/sector-transition-scorecard" element={<SectorTransitionScorecardPage />} />} />
            <Route path="/just-transition-intelligence"  element={<ProtectedRoute path="/just-transition-intelligence" element={<JustTransitionIntelligencePage />} />} />
            <Route path="/policy-regulatory-impact"      element={<ProtectedRoute path="/policy-regulatory-impact" element={<PolicyRegulatoryImpactPage />} />} />
            {/* Sprint CC — Portfolio Alignment · Financed Emissions · Transition Finance */}
            <Route path="/portfolio-transition-alignment" element={<ProtectedRoute path="/portfolio-transition-alignment" element={<PortfolioTransitionAlignmentPage />} />} />
            <Route path="/financed-emissions-attributor"  element={<ProtectedRoute path="/financed-emissions-attributor" element={<FinancedEmissionsAttributorPage />} />} />
            <Route path="/transition-finance-screener"    element={<ProtectedRoute path="/transition-finance-screener" element={<TransitionFinanceScreenerPage />} />} />
            {/* Sprint CD — Multi-Dim Scorer · Heatmap · Carbon Footprint */}
            <Route path="/multi-dim-transition-scorer"   element={<ProtectedRoute path="/multi-dim-transition-scorer" element={<MultiDimTransitionScorerPage />} />} />
            <Route path="/transition-risk-heatmap"       element={<ProtectedRoute path="/transition-risk-heatmap" element={<TransitionRiskHeatmapPage />} />} />
            <Route path="/carbon-footprint-intelligence" element={<ProtectedRoute path="/carbon-footprint-intelligence" element={<CarbonFootprintIntelligencePage />} />} />
            {/* Sprint CE — Climate VaR · Transition Dashboard · Reg Reporting */}
            <Route path="/climate-var-engine"            element={<ProtectedRoute path="/climate-var-engine" element={<ClimateVarEnginePage />} />} />
            <Route path="/transition-risk-dashboard"     element={<ProtectedRoute path="/transition-risk-dashboard" element={<TransitionRiskDashboardPage />} />} />
            <Route path="/transition-reg-reporting"      element={<ProtectedRoute path="/transition-reg-reporting" element={<TransitionRegReportingPage />} />} />
            {/* Sprint CF — Climate Adaptation & Resilience Intelligence */}
            <Route path="/climate-adaptation-pathways"      element={<ProtectedRoute path="/climate-adaptation-pathways" element={<ClimateAdaptationPathwaysPage />} />} />
            <Route path="/infrastructure-resilience-scorer" element={<ProtectedRoute path="/infrastructure-resilience-scorer" element={<InfrastructureResilienceScorerPage />} />} />
            <Route path="/nature-based-adaptation"          element={<ProtectedRoute path="/nature-based-adaptation" element={<NatureBasedAdaptationPage />} />} />
            {/* Sprint CG — Physical-Transition Risk Integration */}
            <Route path="/physical-transition-nexus"       element={<ProtectedRoute path="/physical-transition-nexus" element={<PhysicalTransitionNexusPage />} />} />
            <Route path="/regional-climate-impact"         element={<ProtectedRoute path="/regional-climate-impact" element={<RegionalClimateImpactPage />} />} />
            <Route path="/supply-chain-contagion"          element={<ProtectedRoute path="/supply-chain-contagion" element={<SupplyChainContagionPage />} />} />
            <Route path="/physical-risk-early-warning"     element={<ProtectedRoute path="/physical-risk-early-warning" element={<PhysicalRiskEarlyWarningPage />} />} />
            <Route path="/compound-event-modeler"          element={<ProtectedRoute path="/compound-event-modeler" element={<CompoundEventModelerPage />} />} />
            <Route path="/climate-risk-migration"          element={<ProtectedRoute path="/climate-risk-migration" element={<ClimateRiskMigrationPage />} />} />
            {/* Sprint CH — Probabilistic Scenario & Monte Carlo */}
            <Route path="/monte-carlo-climate"             element={<ProtectedRoute path="/monte-carlo-climate" element={<MonteCarloClimatePage />} />} />
            <Route path="/scenario-blending-optimizer"     element={<ProtectedRoute path="/scenario-blending-optimizer" element={<ScenarioBlendingOptimizerPage />} />} />
            <Route path="/climate-stress-test-suite"       element={<ProtectedRoute path="/climate-stress-test-suite" element={<ClimateStressTestSuitePage />} />} />
            <Route path="/tail-risk-analyzer"              element={<ProtectedRoute path="/tail-risk-analyzer" element={<TailRiskAnalyzerPage />} />} />
            <Route path="/scenario-dashboard-builder"      element={<ProtectedRoute path="/scenario-dashboard-builder" element={<ScenarioDashboardBuilderPage />} />} />
            <Route path="/regulatory-stress-submission"    element={<ProtectedRoute path="/regulatory-stress-submission" element={<RegulatoryStressSubmissionPage />} />} />
            {/* Sprint CI — Extended Asset Class Coverage (sovereign-climate-risk routed above) */}
            <Route path="/private-assets-transition"       element={<ProtectedRoute path="/private-assets-transition" element={<PrivateAssetsTransitionPage />} />} />
            <Route path="/structured-credit-climate"       element={<ProtectedRoute path="/structured-credit-climate" element={<StructuredCreditClimatePage />} />} />
            <Route path="/commodity-derivatives-climate"   element={<ProtectedRoute path="/commodity-derivatives-climate" element={<CommodityDerivativesClimatePage />} />} />
            <Route path="/insurance-portfolio-climate"     element={<ProtectedRoute path="/insurance-portfolio-climate" element={<InsurancePortfolioClimatePage />} />} />
            <Route path="/pcaf-universal-attributor"       element={<ProtectedRoute path="/pcaf-universal-attributor" element={<PcafUniversalAttributorPage />} />} />
            {/* Sprint CJ — Emerging Market Transition Intelligence */}
            <Route path="/china-india-transition"          element={<ProtectedRoute path="/china-india-transition" element={<ChinaIndiaTransitionPage />} />} />
            <Route path="/asean-gcc-transition"            element={<ProtectedRoute path="/asean-gcc-transition" element={<AseanGccTransitionPage />} />} />
            <Route path="/em-carbon-credit-hub"            element={<ProtectedRoute path="/em-carbon-credit-hub" element={<EmCarbonCreditHubPage />} />} />
            <Route path="/latam-transition"                element={<ProtectedRoute path="/latam-transition" element={<LatamTransitionPage />} />} />
            <Route path="/africa-climate-finance"          element={<ProtectedRoute path="/africa-climate-finance" element={<AfricaClimateFinancePage />} />} />
            <Route path="/frontier-market-climate"         element={<ProtectedRoute path="/frontier-market-climate" element={<FrontierMarketClimatePage />} />} />
            {/* Sprint CK — Stranded Asset Dynamics v2 */}
            <Route path="/vintage-cohort-stranded"         element={<ProtectedRoute path="/vintage-cohort-stranded" element={<VintageCohortStrandedPage />} />} />
            <Route path="/cascading-default-modeler"       element={<ProtectedRoute path="/cascading-default-modeler" element={<CascadingDefaultModelerPage />} />} />
            <Route path="/stranded-recovery-pathways"      element={<ProtectedRoute path="/stranded-recovery-pathways" element={<StrandedRecoveryPathwaysPage />} />} />
            <Route path="/decommissioning-cost-engine"     element={<ProtectedRoute path="/decommissioning-cost-engine" element={<DecommissioningCostEnginePage />} />} />
            <Route path="/stranded-asset-watchlist"        element={<ProtectedRoute path="/stranded-asset-watchlist" element={<StrandedAssetWatchlistPage />} />} />
            <Route path="/covenant-breach-predictor"       element={<ProtectedRoute path="/covenant-breach-predictor" element={<CovenantBreachPredictorPage />} />} />
            {/* Sprint CL — Technology & Supply Chain Disruption v2 */}
            <Route path="/critical-mineral-constraint"     element={<ProtectedRoute path="/critical-mineral-constraint" element={<CriticalMineralConstraintPage />} />} />
            <Route path="/grid-stability-transition"       element={<ProtectedRoute path="/grid-stability-transition" element={<GridStabilityTransitionPage />} />} />
            <Route path="/hydrogen-economy-modeler"        element={<ProtectedRoute path="/hydrogen-economy-modeler" element={<HydrogenEconomyModelerPage />} />} />
            <Route path="/nuclear-smr-viability"           element={<ProtectedRoute path="/nuclear-smr-viability" element={<NuclearSmrViabilityPage />} />} />
            <Route path="/negative-emissions-tech"         element={<ProtectedRoute path="/negative-emissions-tech" element={<NegativeEmissionsTechPage />} />} />
            <Route path="/tech-disruption-watchlist"       element={<ProtectedRoute path="/tech-disruption-watchlist" element={<TechDisruptionWatchlistPage />} />} />
            {/* Sprint CM — SBTi Credibility Suite */}
            <Route path="/sbti-credibility-scorer"         element={<ProtectedRoute path="/sbti-credibility-scorer" element={<SbtiCredibilityScorerPage />} />} />
            <Route path="/temperature-alignment-waterfall" element={<ProtectedRoute path="/temperature-alignment-waterfall" element={<TemperatureAlignmentWaterfallPage />} />} />
            <Route path="/net-zero-credibility-index"      element={<ProtectedRoute path="/net-zero-credibility-index" element={<NetZeroCredibilityIndexPage />} />} />
            <Route path="/scope3-materiality-engine"       element={<ProtectedRoute path="/scope3-materiality-engine" element={<Scope3MaterialityEnginePage />} />} />
            <Route path="/target-vs-action-tracker"        element={<ProtectedRoute path="/target-vs-action-tracker" element={<TargetVsActionTrackerPage />} />} />
            <Route path="/peer-transition-benchmarker"     element={<ProtectedRoute path="/peer-transition-benchmarker" element={<PeerTransitionBenchmarkerPage />} />} />
            {/* Sprint CN — Carbon Credit & Offset Economics */}
            <Route path="/carbon-credit-pricing"           element={<ProtectedRoute path="/carbon-credit-pricing" element={<CarbonCreditPricingPage />} />} />
            <Route path="/offset-permanence-risk"          element={<ProtectedRoute path="/offset-permanence-risk" element={<OffsetPermanenceRiskPage />} />} />
            <Route path="/corporate-offset-optimizer"      element={<ProtectedRoute path="/corporate-offset-optimizer" element={<CorporateOffsetOptimizerPage />} />} />
            <Route path="/credit-quality-screener"         element={<ProtectedRoute path="/credit-quality-screener" element={<CreditQualityScreenerPage />} />} />
            <Route path="/offset-portfolio-tracker"        element={<ProtectedRoute path="/offset-portfolio-tracker" element={<OffsetPortfolioTrackerPage />} />} />
            <Route path="/carbon-market-intelligence"      element={<ProtectedRoute path="/carbon-market-intelligence" element={<CarbonMarketIntelligencePage />} />} />
            {/* Sprint CO — Advanced Just Transition */}
            <Route path="/workforce-transition-tracker"    element={<ProtectedRoute path="/workforce-transition-tracker" element={<WorkforceTransitionTrackerPage />} />} />
            <Route path="/social-license-risk"             element={<ProtectedRoute path="/social-license-risk" element={<SocialLicenseRiskPage />} />} />
            <Route path="/regional-economic-impact"        element={<ProtectedRoute path="/regional-economic-impact" element={<RegionalEconomicImpactPage />} />} />
            <Route path="/indigenous-rights-fpic"          element={<ProtectedRoute path="/indigenous-rights-fpic" element={<IndigenousRightsFpicPage />} />} />
            <Route path="/green-jobs-pipeline-tracker"     element={<ProtectedRoute path="/green-jobs-pipeline-tracker" element={<GreenJobsPipelineTrackerPage />} />} />
            <Route path="/just-transition-finance-hub"     element={<ProtectedRoute path="/just-transition-finance-hub" element={<JustTransitionFinanceHubPage />} />} />
            {/* Sprint CP — ESG Stewardship Analytics */}
            <Route path="/engagement-outcome-tracker"      element={<ProtectedRoute path="/engagement-outcome-tracker" element={<EngagementOutcomeTrackerPage />} />} />
            <Route path="/proxy-voting-climate"            element={<ProtectedRoute path="/proxy-voting-climate" element={<ProxyVotingClimatePage />} />} />
            <Route path="/stewardship-report-generator"    element={<ProtectedRoute path="/stewardship-report-generator" element={<StewardshipReportGeneratorPage />} />} />
            <Route path="/shareholder-resolution-analyzer" element={<ProtectedRoute path="/shareholder-resolution-analyzer" element={<ShareholderResolutionAnalyzerPage />} />} />
            <Route path="/board-climate-competence"        element={<ProtectedRoute path="/board-climate-competence" element={<BoardClimateCompetencePage />} />} />
            <Route path="/esg-integration-dashboard"       element={<ProtectedRoute path="/esg-integration-dashboard" element={<EsgIntegrationDashboardPage />} />} />
            {/* Sprint CQ — Transition Finance Portfolio Construction */}
            <Route path="/green-bond-portfolio-optimizer"  element={<ProtectedRoute path="/green-bond-portfolio-optimizer" element={<GreenBondPortfolioOptimizerPage />} />} />
            <Route path="/transition-bond-credibility"     element={<ProtectedRoute path="/transition-bond-credibility" element={<TransitionBondCredibilityPage />} />} />
            <Route path="/blended-finance-structurer"      element={<ProtectedRoute path="/blended-finance-structurer" element={<BlendedFinanceStructurerPage />} />} />
            <Route path="/climate-bond-index-tracker"      element={<ProtectedRoute path="/climate-bond-index-tracker" element={<ClimateBondIndexTrackerPage />} />} />
            <Route path="/green-loan-framework"            element={<ProtectedRoute path="/green-loan-framework" element={<GreenLoanFrameworkPage />} />} />
            <Route path="/impact-bond-analytics"           element={<ProtectedRoute path="/impact-bond-analytics" element={<ImpactBondAnalyticsPage />} />} />
            {/* Sprint CR — Multi-Jurisdiction Regulatory Compliance */}
            <Route path="/csrd-esrs-full-suite"            element={<ProtectedRoute path="/csrd-esrs-full-suite" element={<CsrdEsrsFullSuitePage />} />} />
            <Route path="/global-disclosure-tracker"       element={<ProtectedRoute path="/global-disclosure-tracker" element={<GlobalDisclosureTrackerPage />} />} />
            <Route path="/assurance-readiness-engine"      element={<ProtectedRoute path="/assurance-readiness-engine" element={<AssuranceReadinessEnginePage />} />} />
            <Route path="/xbrl-climate-taxonomy"           element={<ProtectedRoute path="/xbrl-climate-taxonomy" element={<XbrlClimateTaxonomyPage />} />} />
            <Route path="/regulatory-change-radar"         element={<ProtectedRoute path="/regulatory-change-radar" element={<RegulatoryChangeRadarPage />} />} />
            <Route path="/compliance-workflow-automation"   element={<ProtectedRoute path="/compliance-workflow-automation" element={<ComplianceWorkflowAutomationPage />} />} />
            {/* Sprint CS — Taxonomy & Assessment Engine Core */}
            <Route path="/transition-risk-taxonomy-browser" element={<ProtectedRoute path="/transition-risk-taxonomy-browser" element={<TransitionRiskTaxonomyBrowserPage />} />} />
            <Route path="/assessment-engine-dashboard"      element={<ProtectedRoute path="/assessment-engine-dashboard" element={<AssessmentEngineDashboardPage />} />} />
            <Route path="/data-source-registry"             element={<ProtectedRoute path="/data-source-registry" element={<DataSourceRegistryPage />} />} />
            <Route path="/ml-taxonomy-scoring"              element={<ProtectedRoute path="/ml-taxonomy-scoring" element={<MlTaxonomyScoringPage />} />} />
            <Route path="/taxonomy-risk-report"             element={<ProtectedRoute path="/taxonomy-risk-report" element={<TaxonomyRiskReportPage />} />} />
            <Route path="/assessment-configuration"         element={<ProtectedRoute path="/assessment-configuration" element={<AssessmentConfigurationPage />} />} />
            {/* Sprint CT — Financial Institution Profiler */}
            <Route path="/fi-client-portfolio-analyzer"     element={<ProtectedRoute path="/fi-client-portfolio-analyzer" element={<FiClientPortfolioAnalyzerPage />} />} />
            <Route path="/fi-instrument-exposure"           element={<ProtectedRoute path="/fi-instrument-exposure" element={<FiInstrumentExposurePage />} />} />
            <Route path="/fi-line-of-business"              element={<ProtectedRoute path="/fi-line-of-business" element={<FiLineOfBusinessPage />} />} />
            <Route path="/fi-regulatory-capital-overlay"    element={<ProtectedRoute path="/fi-regulatory-capital-overlay" element={<FiRegulatoryCapitalOverlayPage />} />} />
            <Route path="/fi-concentration-monitor"         element={<ProtectedRoute path="/fi-concentration-monitor" element={<FiConcentrationMonitorPage />} />} />
            <Route path="/fi-transition-dashboard"          element={<ProtectedRoute path="/fi-transition-dashboard" element={<FiTransitionDashboardPage />} />} />
            {/* Sprint CU — Energy Company Profiler */}
            <Route path="/energy-asset-registry"            element={<ProtectedRoute path="/energy-asset-registry" element={<EnergyAssetRegistryPage />} />} />
            <Route path="/energy-segment-analysis"          element={<ProtectedRoute path="/energy-segment-analysis" element={<EnergySegmentAnalysisPage />} />} />
            <Route path="/energy-supplier-network"          element={<ProtectedRoute path="/energy-supplier-network" element={<EnergySupplierNetworkPage />} />} />
            <Route path="/energy-revenue-split"             element={<ProtectedRoute path="/energy-revenue-split" element={<EnergyRevenueSplitPage />} />} />
            <Route path="/energy-decommissioning-liability" element={<ProtectedRoute path="/energy-decommissioning-liability" element={<EnergyDecommissioningLiabilityPage />} />} />
            <Route path="/energy-transition-dashboard"      element={<ProtectedRoute path="/energy-transition-dashboard" element={<EnergyTransitionDashboardPage />} />} />
            {/* Sprint CV — Geopolitical Risk Engine */}
            <Route path="/geopolitical-risk-index"          element={<ProtectedRoute path="/geopolitical-risk-index" element={<GeopoliticalRiskIndexPage />} />} />
            <Route path="/sanctions-trade-monitor"          element={<ProtectedRoute path="/sanctions-trade-monitor" element={<SanctionsTradeMonitorPage />} />} />
            <Route path="/critical-mineral-geo-risk"        element={<ProtectedRoute path="/critical-mineral-geo-risk" element={<CriticalMineralGeoRiskPage />} />} />
            <Route path="/conflict-stability-tracker"       element={<ProtectedRoute path="/conflict-stability-tracker" element={<ConflictStabilityTrackerPage />} />} />
            <Route path="/geo-transition-nexus"             element={<ProtectedRoute path="/geo-transition-nexus" element={<GeoTransitionNexusPage />} />} />
            <Route path="/geopolitical-dashboard"           element={<ProtectedRoute path="/geopolitical-dashboard" element={<GeopoliticalDashboardPage />} />} />
            {/* Sprint CW — Cross-Entity Assessment & Benchmarking */}
            <Route path="/universal-entity-comparator"      element={<ProtectedRoute path="/universal-entity-comparator" element={<UniversalEntityComparatorPage />} />} />
            <Route path="/sector-peer-benchmarking-engine"  element={<ProtectedRoute path="/sector-peer-benchmarking-engine" element={<SectorPeerBenchmarkingEnginePage />} />} />
            <Route path="/supply-chain-network-viz"         element={<ProtectedRoute path="/supply-chain-network-viz" element={<SupplyChainNetworkVizPage />} />} />
            <Route path="/portfolio-stress-test-drilldown"  element={<ProtectedRoute path="/portfolio-stress-test-drilldown" element={<PortfolioStressTestDrilldownPage />} />} />
            <Route path="/assessment-audit-trail-v2"        element={<ProtectedRoute path="/assessment-audit-trail-v2" element={<AssessmentAuditTrailV2Page />} />} />
            <Route path="/cross-entity-intelligence-dashboard" element={<ProtectedRoute path="/cross-entity-intelligence-dashboard" element={<CrossEntityIntelligenceDashboardPage />} />} />
            {/* Sprint CX — Advanced ML & Predictive Analytics */}
            <Route path="/ml-feature-engineering"           element={<ProtectedRoute path="/ml-feature-engineering" element={<MlFeatureEngineeringPage />} />} />
            <Route path="/ensemble-prediction-engine"       element={<ProtectedRoute path="/ensemble-prediction-engine" element={<EnsemblePredictionEnginePage />} />} />
            <Route path="/anomaly-detection-engine"         element={<ProtectedRoute path="/anomaly-detection-engine" element={<AnomalyDetectionEnginePage />} />} />
            <Route path="/peer-clustering-segmentation"     element={<ProtectedRoute path="/peer-clustering-segmentation" element={<PeerClusteringSegmentationPage />} />} />
            <Route path="/scenario-conditional-prediction"  element={<ProtectedRoute path="/scenario-conditional-prediction" element={<ScenarioConditionalPredictionPage />} />} />
            <Route path="/ml-governance-dashboard"          element={<ProtectedRoute path="/ml-governance-dashboard" element={<MlGovernanceDashboardPage />} />} />
            {/* Sprint DD — Corporate Finance & Capital Markets */}
            <Route path="/climate-wacc-engine"       element={<ProtectedRoute path="/climate-wacc-engine" element={<ClimateWaccEnginePage />} />} />
            <Route path="/green-debt-structuring"    element={<ProtectedRoute path="/green-debt-structuring" element={<GreenDebtStructuringPage />} />} />
            <Route path="/climate-ma-due-diligence"  element={<ProtectedRoute path="/climate-ma-due-diligence" element={<ClimateMaDueDiligencePage />} />} />
            <Route path="/carbon-adjusted-valuation" element={<ProtectedRoute path="/carbon-adjusted-valuation" element={<CarbonAdjustedValuationPage />} />} />
            <Route path="/treasury-climate-risk"     element={<ProtectedRoute path="/treasury-climate-risk" element={<TreasuryClimateRiskPage />} />} />
            <Route path="/climate-capital-markets"   element={<ProtectedRoute path="/climate-capital-markets" element={<ClimateCapitalMarketsPage />} />} />
            {/* Sprint DE — Green Real Estate & Built Environment */}
            <Route path="/green-building-valuation"          element={<ProtectedRoute path="/green-building-valuation" element={<GreenBuildingValuationPage />} />} />
            <Route path="/real-estate-climate-risk"          element={<ProtectedRoute path="/real-estate-climate-risk" element={<RealEstateClimateRiskPage />} />} />
            <Route path="/climate-mortgage-analytics"        element={<ProtectedRoute path="/climate-mortgage-analytics" element={<ClimateMortgageAnalyticsPage />} />} />
            <Route path="/infrastructure-climate-resilience" element={<ProtectedRoute path="/infrastructure-climate-resilience" element={<InfrastructureClimateResiliencePage />} />} />
            <Route path="/urban-climate-adaptation"          element={<ProtectedRoute path="/urban-climate-adaptation" element={<UrbanClimateAdaptationPage />} />} />
            {/* /real-estate-carbon-analytics route now auto-discovered from its module.config.js */}
            {/* Sprint DF — Climate Technology & Innovation Finance */}
            <Route path="/cleantech-investment"              element={<ProtectedRoute path="/cleantech-investment" element={<CleanTechInvestmentPage />} />} />
            <Route path="/green-hydrogen-economics-df"       element={<ProtectedRoute path="/green-hydrogen-economics-df" element={<GreenHydrogenEconomicsPage2 />} />} />
            <Route path="/carbon-capture-finance"            element={<ProtectedRoute path="/carbon-capture-finance" element={<CarbonCaptureFinancePage />} />} />
            <Route path="/energy-storage-analytics"          element={<ProtectedRoute path="/energy-storage-analytics" element={<EnergyStorageAnalyticsPage />} />} />
            <Route path="/ev-transition-finance"             element={<ProtectedRoute path="/ev-transition-finance" element={<EVTransitionFinancePage />} />} />
            <Route path="/climate-patent-intelligence"       element={<ProtectedRoute path="/climate-patent-intelligence" element={<ClimatePatentIntelligencePage />} />} />
            {/* Sprint DG — Food, Agriculture & Land Use */}
            <Route path="/agricultural-climate-risk"          element={<ProtectedRoute path="/agricultural-climate-risk" element={<AgriculturalClimateRiskPage />} />} />
            <Route path="/food-system-transition"             element={<ProtectedRoute path="/food-system-transition" element={<FoodSystemTransitionPage />} />} />
            <Route path="/land-use-change-finance"            element={<ProtectedRoute path="/land-use-change-finance" element={<LandUseChangeFinancePage />} />} />
            <Route path="/sustainable-agriculture-investment" element={<ProtectedRoute path="/sustainable-agriculture-investment" element={<SustainableAgricultureInvestmentPage />} />} />
            <Route path="/water-food-energy-nexus"            element={<ProtectedRoute path="/water-food-energy-nexus" element={<WaterFoodEnergyNexusPage />} />} />
            <Route path="/climate-commodity-analytics"        element={<ProtectedRoute path="/climate-commodity-analytics" element={<ClimateCommodityAnalyticsPage />} />} />
            {/* Sprint DH — Emerging Markets & Development Finance */}
            <Route path="/em-sovereign-climate-debt"          element={<ProtectedRoute path="/em-sovereign-climate-debt" element={<EMSovereignClimateDebtPage />} />} />
            <Route path="/mdb-climate-finance-dh"             element={<ProtectedRoute path="/mdb-climate-finance-dh" element={<MDBClimateFinanceDHPage />} />} />
            <Route path="/jetp-analytics"                     element={<ProtectedRoute path="/jetp-analytics" element={<JETPAnalyticsPage />} />} />
            <Route path="/climate-blended-finance"            element={<ProtectedRoute path="/climate-blended-finance" element={<ClimateBlendedFinancePage />} />} />
            <Route path="/loss-and-damage-finance"            element={<ProtectedRoute path="/loss-and-damage-finance" element={<LossAndDamageFinancePage />} />} />
            <Route path="/sovereign-green-bond-analytics"     element={<ProtectedRoute path="/sovereign-green-bond-analytics" element={<SovereignGreenBondAnalyticsPage />} />} />
            {/* Sprint DI — Climate Workforce & Just Transition */}
            <Route path="/fossil-fuel-worker-transition"      element={<ProtectedRoute path="/fossil-fuel-worker-transition" element={<FossilFuelWorkerTransitionPage />} />} />
            <Route path="/green-jobs-growth"                  element={<ProtectedRoute path="/green-jobs-growth" element={<GreenJobsGrowthPage />} />} />
            <Route path="/corporate-just-transition"          element={<ProtectedRoute path="/corporate-just-transition" element={<CorporateJustTransitionPage />} />} />
            <Route path="/climate-displacement-risk"          element={<ProtectedRoute path="/climate-displacement-risk" element={<ClimateDisplacementRiskPage />} />} />
            <Route path="/supply-chain-labor-climate"         element={<ProtectedRoute path="/supply-chain-labor-climate" element={<SupplyChainLaborClimateRiskPage />} />} />
            <Route path="/community-climate-resilience"       element={<ProtectedRoute path="/community-climate-resilience" element={<CommunityClimateResiliencePage />} />} />
            {/* Sprint DJ — Ocean, Shipping & Blue Economy */}
            <Route path="/shipping-decarbonisation"   element={<ProtectedRoute path="/shipping-decarbonisation" element={<ShippingDecarbonisationPage />} />} />
            <Route path="/blue-carbon-finance"        element={<ProtectedRoute path="/blue-carbon-finance" element={<BlueCarbonFinancePage />} />} />
            <Route path="/coastal-flood-risk-finance" element={<ProtectedRoute path="/coastal-flood-risk-finance" element={<CoastalFloodRiskFinancePage />} />} />
            <Route path="/ocean-health-finance"       element={<ProtectedRoute path="/ocean-health-finance" element={<OceanHealthFinancePage />} />} />
            <Route path="/port-climate-risk"          element={<ProtectedRoute path="/port-climate-risk" element={<PortClimateRiskPage />} />} />
            <Route path="/fisheries-climate-risk"     element={<ProtectedRoute path="/fisheries-climate-risk" element={<FisheriesClimateRiskPage />} />} />
            {/* Sprint DM — Urban & City Climate Finance */}
            <Route path="/municipal-green-bond"           element={<ProtectedRoute path="/municipal-green-bond" element={<MunicipalGreenBondPage />} />} />
            <Route path="/smart-city-climate-finance"     element={<ProtectedRoute path="/smart-city-climate-finance" element={<SmartCityClimateFinancePage />} />} />
            <Route path="/city-climate-risk-rating"       element={<ProtectedRoute path="/city-climate-risk-rating" element={<CityClimateRiskRatingPage />} />} />
            <Route path="/urban-mobility-transition"      element={<ProtectedRoute path="/urban-mobility-transition" element={<UrbanMobilityTransitionPage />} />} />
            <Route path="/green-building-code-finance"    element={<ProtectedRoute path="/green-building-code-finance" element={<GreenBuildingCodeFinancePage />} />} />
            <Route path="/city-net-zero-tracker"          element={<ProtectedRoute path="/city-net-zero-tracker" element={<CityNetZeroTrackerPage />} />} />
            {/* Sprint DN — Supply Chain Climate Intelligence */}
            <Route path="/supply-chain-emissions-mapper"  element={<ProtectedRoute path="/supply-chain-emissions-mapper" element={<SupplyChainEmissionsMapperPage />} />} />
            <Route path="/procurement-climate-risk"       element={<ProtectedRoute path="/procurement-climate-risk" element={<ProcurementClimateRiskPage />} />} />
            <Route path="/supplier-esg-scorecard"         element={<ProtectedRoute path="/supplier-esg-scorecard" element={<SupplierESGScorecardPage />} />} />
            <Route path="/scope3-category-analytics"      element={<ProtectedRoute path="/scope3-category-analytics" element={<Scope3CategoryAnalyticsPage />} />} />
            <Route path="/climate-trade-flow-analytics"   element={<ProtectedRoute path="/climate-trade-flow-analytics" element={<ClimateTradeFlowAnalyticsPage />} />} />
            <Route path="/green-procurement-intelligence" element={<ProtectedRoute path="/green-procurement-intelligence" element={<GreenProcurementIntelligencePage />} />} />
            {/* Sprint DO — Renewable Energy Project Finance */}
            <Route path="/solar-project-finance"         element={<ProtectedRoute path="/solar-project-finance" element={<SolarProjectFinancePage />} />} />
            <Route path="/wind-energy-finance"           element={<ProtectedRoute path="/wind-energy-finance" element={<WindEnergyFinancePage />} />} />
            <Route path="/renewable-project-pipeline"    element={<ProtectedRoute path="/renewable-project-pipeline" element={<RenewableProjectPipelinePage />} />} />
            <Route path="/energy-transition-lending"     element={<ProtectedRoute path="/energy-transition-lending" element={<EnergyTransitionLendingPage />} />} />
            <Route path="/ppa-analytics"                 element={<ProtectedRoute path="/ppa-analytics" element={<PPAAnalyticsPage />} />} />
            <Route path="/renewable-asset-management"    element={<ProtectedRoute path="/renewable-asset-management" element={<RenewableAssetManagementPage />} />} />
            {/* Sprint DQ — Carbon Credit Calculation Module */}
            <Route path="/cdm-methodology-calculator"      element={<ProtectedRoute path="/cdm-methodology-calculator" element={<CDMMethodologyCalculatorPage />} />} />
            <Route path="/baseline-additionality-analyzer" element={<ProtectedRoute path="/baseline-additionality-analyzer" element={<BaselineAdditionalityPage />} />} />
            <Route path="/monte-carlo-uncertainty-engine"  element={<ProtectedRoute path="/monte-carlo-uncertainty-engine" element={<MonteCarloCarbonUncertaintyPage />} />} />
            <Route path="/carbon-project-lifecycle"        element={<ProtectedRoute path="/carbon-project-lifecycle" element={<CarbonProjectLifecyclePage />} />} />
            <Route path="/multi-standard-compliance"       element={<ProtectedRoute path="/multi-standard-compliance" element={<MultiStandardCompliancePage />} />} />
            <Route path="/carbon-credit-audit-trail"       element={<ProtectedRoute path="/carbon-credit-audit-trail" element={<CarbonCreditAuditTrailPage />} />} />
            {/* Sprint DP — Health, Heat & Climate Wellbeing Finance */}
            <Route path="/heat-stress-finance"             element={<ProtectedRoute path="/heat-stress-finance" element={<HeatStressFinancePage />} />} />
            <Route path="/climate-health-risk-analytics"   element={<ProtectedRoute path="/climate-health-risk-analytics" element={<ClimateHealthRiskPage />} />} />
            <Route path="/air-quality-investment"          element={<ProtectedRoute path="/air-quality-investment" element={<AirQualityInvestmentPage />} />} />
            <Route path="/pandemic-climate-finance"        element={<ProtectedRoute path="/pandemic-climate-finance" element={<PandemicClimateFinancePage />} />} />
            <Route path="/mental-health-climate-risk"      element={<ProtectedRoute path="/mental-health-climate-risk" element={<MentalHealthClimateRiskPage />} />} />
            <Route path="/wellbeing-adjusted-returns"      element={<ProtectedRoute path="/wellbeing-adjusted-returns" element={<WellbeingAdjustedReturnsPage />} />} />
            {/* Sprint DK — Climate Governance & Board Analytics */}
            <Route path="/board-climate-oversight"          element={<ProtectedRoute path="/board-climate-oversight" element={<BoardClimateOversightPage />} />} />
            <Route path="/fiduciary-climate-risk"           element={<ProtectedRoute path="/fiduciary-climate-risk" element={<FiduciaryClimateRiskPage />} />} />
            <Route path="/esg-governance-scorer"            element={<ProtectedRoute path="/esg-governance-scorer" element={<ESGGovernanceScorerPage />} />} />
            <Route path="/climate-executive-pay"            element={<ProtectedRoute path="/climate-executive-pay" element={<ClimateExecutivePayPage />} />} />
            <Route path="/shareholder-climate-engagement"   element={<ProtectedRoute path="/shareholder-climate-engagement" element={<ShareholderEngagementPage />} />} />
            <Route path="/climate-reg-policy-tracker"       element={<ProtectedRoute path="/climate-reg-policy-tracker" element={<ClimateRegPolicyTrackerPage />} />} />
            {/* Sprint DL — Circular Economy & Waste Climate Finance */}
            <Route path="/circular-economy-finance"      element={<ProtectedRoute path="/circular-economy-finance" element={<CircularEconomyFinancePage />} />} />
            <Route path="/waste-to-energy-finance"       element={<ProtectedRoute path="/waste-to-energy-finance" element={<WasteToEnergyFinancePage />} />} />
            <Route path="/plastics-pollution-finance"    element={<ProtectedRoute path="/plastics-pollution-finance" element={<PlasticsPollutionFinancePage />} />} />
            <Route path="/resource-efficiency-analytics" element={<ProtectedRoute path="/resource-efficiency-analytics" element={<ResourceEfficiencyAnalyticsPage />} />} />
            <Route path="/critical-minerals-climate"     element={<ProtectedRoute path="/critical-minerals-climate" element={<CriticalMineralsClimatePage />} />} />
            <Route path="/green-chemistry-finance"       element={<ProtectedRoute path="/green-chemistry-finance" element={<GreenChemistryFinancePage />} />} />
            {/* Sprint DC — Insurance Climate Actuarial Suite */}
            <Route path="/climate-mortality-longevity"   element={<ProtectedRoute path="/climate-mortality-longevity" element={<ClimateMortalityLongevityPage />} />} />
            <Route path="/pc-climate-pricing"            element={<ProtectedRoute path="/pc-climate-pricing" element={<PCClimatePricingPage />} />} />
            <Route path="/climate-reserve-adequacy"      element={<ProtectedRoute path="/climate-reserve-adequacy" element={<ClimateReserveAdequacyPage />} />} />
            <Route path="/solvency-capital-climate"      element={<ProtectedRoute path="/solvency-capital-climate" element={<SolvencyCapitalClimatePage />} />} />
            <Route path="/climate-claims-forecasting"    element={<ProtectedRoute path="/climate-claims-forecasting" element={<ClimateClaimsForecastingPage />} />} />
            {/* Sprint DB — Climate Risk Capital & Supervisory Analytics */}
            <Route path="/climate-capital-adequacy"        element={<ProtectedRoute path="/climate-capital-adequacy" element={<ClimateCapitalAdequacyPage />} />} />
            <Route path="/climate-cvar-suite"              element={<ProtectedRoute path="/climate-cvar-suite" element={<ClimateCVaRSuitePage />} />} />
            <Route path="/supervisory-stress-orchestrator" element={<ProtectedRoute path="/supervisory-stress-orchestrator" element={<SupervisoryStressOrchestratorPage />} />} />
            <Route path="/climate-risk-premium"            element={<ProtectedRoute path="/climate-risk-premium" element={<ClimateRiskPremiumPage />} />} />
            <Route path="/enterprise-climate-risk"         element={<ProtectedRoute path="/enterprise-climate-risk" element={<EnterpriseClimateRiskPage />} />} />
            <Route path="/systemic-climate-risk"           element={<ProtectedRoute path="/systemic-climate-risk" element={<SystemicClimateRiskPage />} />} />
            {/* Sprint DA — Disclosure & Stranded Asset Analytics */}
            <Route path="/climate-litigation-risk-scorer"      element={<ProtectedRoute path="/climate-litigation-risk-scorer" element={<ClimateLitigationRiskScorerPage />} />} />
            <Route path="/greenwashing-exposure-monitor"       element={<ProtectedRoute path="/greenwashing-exposure-monitor" element={<GreenwashingExposureMonitorPage />} />} />
            <Route path="/disclosure-adequacy-analyzer"        element={<ProtectedRoute path="/disclosure-adequacy-analyzer" element={<DisclosureAdequacyAnalyzerPage />} />} />
            <Route path="/stranded-asset-litigation-tracker"   element={<ProtectedRoute path="/stranded-asset-litigation-tracker" element={<StrandedAssetLitigationTrackerPage />} />} />
            <Route path="/regulatory-enforcement-monitor"      element={<ProtectedRoute path="/regulatory-enforcement-monitor" element={<RegulatoryEnforcementMonitorPage />} />} />
            <Route path="/climate-legal-intelligence-dashboard" element={<ProtectedRoute path="/climate-legal-intelligence-dashboard" element={<ClimateLegalIntelligenceDashboardPage />} />} />
            {/* Sprint CY — Real-Time Climate Intelligence */}
            <Route path="/live-carbon-price-monitor"          element={<ProtectedRoute path="/live-carbon-price-monitor" element={<LiveCarbonPriceMonitorPage />} />} />
            <Route path="/portfolio-climate-pulse"            element={<ProtectedRoute path="/portfolio-climate-pulse" element={<PortfolioClimatePulsePage />} />} />
            <Route path="/regulatory-deadline-tracker"        element={<ProtectedRoute path="/regulatory-deadline-tracker" element={<RegulatoryDeadlineTrackerPage />} />} />
            <Route path="/climate-news-sentiment-feed"        element={<ProtectedRoute path="/climate-news-sentiment-feed" element={<ClimateNewsSentimentFeedPage />} />} />
            <Route path="/real-time-emissions-monitor"        element={<ProtectedRoute path="/real-time-emissions-monitor" element={<RealTimeEmissionsMonitorPage />} />} />
            <Route path="/client-transition-command-center"   element={<ProtectedRoute path="/client-transition-command-center" element={<ClientTransitionCommandCenterPage />} />} />
            {/* Sprint CZ — Climate Portfolio Construction & Optimization */}
            <Route path="/climate-portfolio-optimizer"        element={<ProtectedRoute path="/climate-portfolio-optimizer" element={<ClimatePortfolioOptimizerPage />} />} />
            <Route path="/net-zero-portfolio-alignment"       element={<ProtectedRoute path="/net-zero-portfolio-alignment" element={<NetZeroPortfolioAlignmentPage />} />} />
            <Route path="/climate-benchmark-constructor"      element={<ProtectedRoute path="/climate-benchmark-constructor" element={<ClimateBenchmarkConstructorPage />} />} />
            <Route path="/green-bond-portfolio-analytics"     element={<ProtectedRoute path="/green-bond-portfolio-analytics" element={<GreenBondPortfolioAnalyticsPage />} />} />
            <Route path="/climate-risk-budget-allocator"      element={<ProtectedRoute path="/climate-risk-budget-allocator" element={<ClimateRiskBudgetAllocatorPage />} />} />
            <Route path="/transition-alpha-signal-generator"  element={<ProtectedRoute path="/transition-alpha-signal-generator" element={<TransitionAlphaSignalGeneratorPage />} />} />
            {/* Sprint BW — Carbon Credit Engine Hub */}
            <Route path="/cc-engine-hub"              element={<ProtectedRoute path="/cc-engine-hub" element={<CcEngineHubPage />} />} />
            <Route path="/cc-portfolio-analytics"     element={<ProtectedRoute path="/cc-portfolio-analytics" element={<CcPortfolioAnalyticsPage />} />} />
            <Route path="/cc-methodology-comparison"  element={<ProtectedRoute path="/cc-methodology-comparison" element={<CcMethodologyComparisonPage />} />} />
            {/* Sprint BV — Credit Retirement & Certificates */}
            <Route path="/cc-retirement-workflow"  element={<ProtectedRoute path="/cc-retirement-workflow" element={<CcRetirementWorkflowPage />} />} />
            <Route path="/cc-certificate-mgmt"     element={<ProtectedRoute path="/cc-certificate-mgmt" element={<CcCertificateMgmtPage />} />} />
            <Route path="/cc-registry-hub"         element={<ProtectedRoute path="/cc-registry-hub" element={<CcRegistryHubPage />} />} />
            {/* Sprint BU — Engineered CDR & Removals */}
            <Route path="/cc-mineralization"  element={<ProtectedRoute path="/cc-mineralization" element={<CcMineralizationPage />} />} />
            <Route path="/cc-dac"             element={<ProtectedRoute path="/cc-dac" element={<CcDacPage />} />} />
            <Route path="/cc-bicrs-hub"       element={<ProtectedRoute path="/cc-bicrs-hub" element={<CcBicrsHubPage />} />} />
            {/* Sprint BT — Waste & Industrial Credits */}
            <Route path="/cc-landfill-wastewater"  element={<ProtectedRoute path="/cc-landfill-wastewater" element={<CcLandfillWastewaterPage />} />} />
            <Route path="/cc-industrial-gases"     element={<ProtectedRoute path="/cc-industrial-gases" element={<CcIndustrialGasesPage />} />} />
            <Route path="/cc-ccs-biochar-hub"      element={<ProtectedRoute path="/cc-ccs-biochar-hub" element={<CcCcsBiocharHubPage />} />} />
            {/* Sprint BS — Energy Carbon Credits */}
            <Route path="/cc-grid-renewables"       element={<ProtectedRoute path="/cc-grid-renewables" element={<CcGridRenewablesPage />} />} />
            <Route path="/cc-clean-cooking"         element={<ProtectedRoute path="/cc-clean-cooking" element={<CcCleanCookingPage />} />} />
            <Route path="/cc-energy-efficiency-hub" element={<ProtectedRoute path="/cc-energy-efficiency-hub" element={<CcEnergyEfficiencyHubPage />} />} />
            {/* Sprint BR — Agriculture Carbon Credits */}
            <Route path="/cc-soil-carbon"         element={<ProtectedRoute path="/cc-soil-carbon" element={<CcSoilCarbonPage />} />} />
            <Route path="/cc-livestock-methane"   element={<ProtectedRoute path="/cc-livestock-methane" element={<CcLivestockMethanePage />} />} />
            <Route path="/cc-rice-cultivation"    element={<ProtectedRoute path="/cc-rice-cultivation" element={<CcRiceCultivationPage />} />} />
            {/* Sprint BQ — Nature-Based Carbon Credits */}
            <Route path="/cc-arr-reforestation"   element={<ProtectedRoute path="/cc-arr-reforestation" element={<CcArrReforestationPage />} />} />
            <Route path="/cc-ifm-credits"         element={<ProtectedRoute path="/cc-ifm-credits" element={<CcIfmCreditsPage />} />} />
            <Route path="/cc-redd-wetlands-hub"    element={<ProtectedRoute path="/cc-redd-wetlands-hub" element={<CcReddWetlandsHubPage />} />} />
            {/* Sprint BP — Equitable Earth Methodologies */}
            <Route path="/equitable-earth-methodologies" element={<ProtectedRoute path="/equitable-earth-methodologies" element={<EquitableEarthMethodologiesPage />} />} />
            {/* Sprint BO — Critical Minerals · Battery & EV Analytics · ET Commodity Risk */}
            <Route path="/battery-ev-analytics"   element={<ProtectedRoute path="/battery-ev-analytics" element={<BatteryEVAnalyticsPage />} />} />
            <Route path="/et-commodity-risk"       element={<ProtectedRoute path="/et-commodity-risk" element={<ETCommodityRiskPage />} />} />
            {/* Sprint BN — VCM Registry Analytics · Carbon Forward Curve · Credit Integrity DD */}
            <Route path="/vcm-registry-analytics" element={<ProtectedRoute path="/vcm-registry-analytics" element={<VcmRegistryAnalyticsPage />} />} />
            <Route path="/carbon-forward-curve"   element={<ProtectedRoute path="/carbon-forward-curve" element={<CarbonForwardCurvePage />} />} />
            <Route path="/credit-integrity-dd"    element={<ProtectedRoute path="/credit-integrity-dd" element={<CreditIntegrityDDPage />} />} />
            {/* Sprint BM — NatCat Loss Engine · Cat Bond & ILS · Insurance Protection Gap */}
            <Route path="/natcat-loss-engine"        element={<ProtectedRoute path="/natcat-loss-engine" element={<NatCatLossEnginePage />} />} />
            <Route path="/cat-bond-ils"              element={<ProtectedRoute path="/cat-bond-ils" element={<CatBondILSPage />} />} />
            <Route path="/insurance-protection-gap"  element={<ProtectedRoute path="/insurance-protection-gap" element={<InsuranceProtectionGapPage />} />} />
            {/* Sprint BL — ML Risk Scorer · NLP Disclosure Parser · Predictive Analytics Hub */}
            <Route path="/ml-risk-scorer"          element={<ProtectedRoute path="/ml-risk-scorer" element={<MLRiskScorerPage />} />} />
            <Route path="/nlp-disclosure-parser"   element={<ProtectedRoute path="/nlp-disclosure-parser" element={<NLPDisclosureParserPage />} />} />
            <Route path="/predictive-analytics-hub" element={<ProtectedRoute path="/predictive-analytics-hub" element={<PredictiveAnalyticsHubPage2 />} />} />
            {/* Sprint BK — Asset Valuation Engine · Infrastructure Valuation · Real Estate Valuation */}
            <Route path="/asset-valuation-engine"   element={<ProtectedRoute path="/asset-valuation-engine" element={<AssetValuationEnginePage />} />} />
            <Route path="/infrastructure-valuation" element={<ProtectedRoute path="/infrastructure-valuation" element={<InfrastructureValuationPage />} />} />
            <Route path="/real-estate-valuation"    element={<ProtectedRoute path="/real-estate-valuation" element={<RealEstateValuationPage />} />} />
            {/* Sprint BJ — NGFS×IEA Scenario Engine · Climate-Credit Integration */}
            <Route path="/ngfs-iea-scenario"          element={<ProtectedRoute path="/ngfs-iea-scenario" element={<NgfsIeaScenarioPage />} />} />
            <Route path="/climate-credit-integration" element={<ProtectedRoute path="/climate-credit-integration" element={<ClimateCreditIntegrationPage />} />} />
            {/* Sprint BI — Credit Risk Analytics · Platform Analytics Dashboard */}
            <Route path="/credit-risk-analytics" element={<ProtectedRoute path="/credit-risk-analytics" element={<CreditRiskAnalyticsPage />} />} />
            <Route path="/platform-analytics"    element={<ProtectedRoute path="/platform-analytics" element={<PlatformAnalyticsPage />} />} />
            {/* Sprint BH — DB Migration Console · Multi-Tenancy & Org Management */}
            <Route path="/db-migration-console"  element={<ProtectedRoute path="/db-migration-console" element={<DbMigrationConsolePage />} />} />
            <Route path="/multi-tenancy-audit"   element={<ProtectedRoute path="/multi-tenancy-audit" element={<MultiTenancyAuditPage />} />} />
            {/* Sprint BG — SBTi Registry & Climate TRACE · Sanctions & Watchlist Intelligence */}
            <Route path="/sbti-climate-trace"   element={<ProtectedRoute path="/sbti-climate-trace" element={<SbtiClimateTracePage />} />} />
            <Route path="/sanctions-watchlist"  element={<ProtectedRoute path="/sanctions-watchlist" element={<SanctionsWatchlistPage />} />} />
            {/* Sprint BF — Data Hub Ingester Monitor · OWID CO₂ & EVIC Analytics */}
            <Route path="/data-hub-ingester"   element={<ProtectedRoute path="/data-hub-ingester" element={<DataHubIngesterPage />} />} />
            <Route path="/owid-evic-analytics" element={<ProtectedRoute path="/owid-evic-analytics" element={<OwIdEvicAnalyticsPage />} />} />
            {/* Sprint BE — DME Financial Risk · DME PD Engine · DME Dynamic Materiality Index */}
            <Route path="/dme-financial-risk" element={<ProtectedRoute path="/dme-financial-risk" element={<DmeFinancialRiskPage />} />} />
            <Route path="/dme-pd-engine"      element={<ProtectedRoute path="/dme-pd-engine" element={<DmePdEnginePage />} />} />
            <Route path="/dme-index"          element={<ProtectedRoute path="/dme-index" element={<DmeIndexPage />} />} />
            {/* Sprint BD — Greenium Signal Engine · Sentiment Pipeline Engine */}
            <Route path="/greenium-signal"    element={<ProtectedRoute path="/greenium-signal" element={<GreeniumSignalPage />} />} />
            <Route path="/sentiment-pipeline" element={<ProtectedRoute path="/sentiment-pipeline" element={<SentimentPipelinePage />} />} />
            <Route path="/social-alternative-data" element={<ProtectedRoute path="/social-alternative-data" element={<SocialAlternativeDataPage />} />} />
            {/* Sprint DR — Offshore Wind & Marine Energy Intelligence Suite */}
            <Route path="/offshore-wind-resource"       element={<ProtectedRoute path="/offshore-wind-resource" element={<OffshoreWindResourcePage />} />} />
            <Route path="/floating-offshore-wind"       element={<ProtectedRoute path="/floating-offshore-wind" element={<FloatingOffshoreWindPage />} />} />
            <Route path="/offshore-wind-finance"        element={<ProtectedRoute path="/offshore-wind-finance" element={<OffshoreWindFinancePage />} />} />
            <Route path="/offshore-grid-infrastructure" element={<ProtectedRoute path="/offshore-grid-infrastructure" element={<OffshoreGridInfrastructurePage />} />} />
            <Route path="/offshore-wind-om"             element={<ProtectedRoute path="/offshore-wind-om" element={<OffshoreWindOmPage />} />} />
            <Route path="/wind-repowering-intelligence" element={<ProtectedRoute path="/wind-repowering-intelligence" element={<WindRepoweringIntelligencePage />} />} />
            {/* Sprint DS — Green Hydrogen & Power-to-X Finance Intelligence Suite */}
            <Route path="/green-hydrogen-lcoh"          element={<ProtectedRoute path="/green-hydrogen-lcoh" element={<GreenHydrogenLcohPage />} />} />
            <Route path="/hydrogen-storage-transport"   element={<ProtectedRoute path="/hydrogen-storage-transport" element={<HydrogenStorageTransportPage />} />} />
            <Route path="/power-to-x-finance"           element={<ProtectedRoute path="/power-to-x-finance" element={<PowerToXFinancePage />} />} />
            <Route path="/hydrogen-project-finance"     element={<ProtectedRoute path="/hydrogen-project-finance" element={<HydrogenProjectFinancePage />} />} />
            <Route path="/blue-hydrogen-ccs"            element={<ProtectedRoute path="/blue-hydrogen-ccs" element={<BlueHydrogenCcsPage />} />} />
            <Route path="/hydrogen-market-intelligence" element={<ProtectedRoute path="/hydrogen-market-intelligence" element={<HydrogenMarketIntelligencePage />} />} />
            {/* Sprint DT — Battery Energy Storage & Grid Flexibility Finance Intelligence Suite */}
            <Route path="/bess-project-finance"      element={<ProtectedRoute path="/bess-project-finance" element={<BessProjectFinancePage />} />} />
            <Route path="/battery-tech-supply-chain" element={<ProtectedRoute path="/battery-tech-supply-chain" element={<BatteryTechSupplyChainPage />} />} />
            <Route path="/virtual-power-plant"       element={<ProtectedRoute path="/virtual-power-plant" element={<VirtualPowerPlantPage />} />} />
            <Route path="/grid-flexibility-markets"  element={<ProtectedRoute path="/grid-flexibility-markets" element={<GridFlexibilityMarketsPage />} />} />
            <Route path="/ev-v2g-grid-integration"   element={<ProtectedRoute path="/ev-v2g-grid-integration" element={<EvV2gGridIntegrationPage />} />} />
            <Route path="/ldes-investment"           element={<ProtectedRoute path="/ldes-investment" element={<LdesInvestmentPage />} />} />
            {/* Sprint DU — Nuclear & Advanced Fission Finance Intelligence Suite */}
            <Route path="/nuclear-lcoe-economics"    element={<ProtectedRoute path="/nuclear-lcoe-economics" element={<NuclearLcoeEconomicsPage />} />} />
            <Route path="/smr-project-finance"       element={<ProtectedRoute path="/smr-project-finance" element={<SmrProjectFinancePage />} />} />
            <Route path="/nuclear-fuel-cycle"        element={<ProtectedRoute path="/nuclear-fuel-cycle" element={<NuclearFuelCyclePage />} />} />
            <Route path="/advanced-reactor-finance"  element={<ProtectedRoute path="/advanced-reactor-finance" element={<AdvancedReactorFinancePage />} />} />
            <Route path="/nuclear-decommissioning"   element={<ProtectedRoute path="/nuclear-decommissioning" element={<NuclearDecommissioningPage />} />} />
            <Route path="/nuclear-market-intelligence" element={<ProtectedRoute path="/nuclear-market-intelligence" element={<NuclearMarketIntelligencePage />} />} />
            {/* Sprint DV — Geothermal Energy Finance Intelligence Suite */}
            <Route path="/geothermal-lcoe-economics"     element={<ProtectedRoute path="/geothermal-lcoe-economics" element={<GeothermalLcoeEconomicsPage />} />} />
            <Route path="/geothermal-project-finance"    element={<ProtectedRoute path="/geothermal-project-finance" element={<GeothermalProjectFinancePage />} />} />
            <Route path="/enhanced-geothermal-systems"   element={<ProtectedRoute path="/enhanced-geothermal-systems" element={<EnhancedGeothermalSystemsPage />} />} />
            <Route path="/geothermal-direct-use"         element={<ProtectedRoute path="/geothermal-direct-use" element={<GeothermalDirectUsePage />} />} />
            <Route path="/geothermal-power-markets"      element={<ProtectedRoute path="/geothermal-power-markets" element={<GeothermalPowerMarketsPage />} />} />
            <Route path="/geothermal-market-intelligence" element={<ProtectedRoute path="/geothermal-market-intelligence" element={<GeothermalMarketIntelligencePage />} />} />
            {/* Sprint DW — FI Climate Finance Instruments Intelligence Suite */}
            <Route path="/sustainability-linked-instruments" element={<ProtectedRoute path="/sustainability-linked-instruments" element={<SustainabilityLinkedInstrumentsPage />} />} />
            <Route path="/transition-finance-engine"         element={<ProtectedRoute path="/transition-finance-engine" element={<TransitionFinanceEnginePage />} />} />
            <Route path="/green-securitization"              element={<ProtectedRoute path="/green-securitization" element={<GreenSecuritizationPage />} />} />
            <Route path="/climate-credit-pricing"            element={<ProtectedRoute path="/climate-credit-pricing" element={<ClimateCreditPricingPage />} />} />
            <Route path="/blended-finance-structuring"       element={<ProtectedRoute path="/blended-finance-structuring" element={<BlendedFinanceStructuringPage />} />} />
            <Route path="/fi-net-zero-pathways"              element={<ProtectedRoute path="/fi-net-zero-pathways" element={<FiNetZeroPathwaysPage />} />} />
            {/* Sprint DX — Bioenergy, BECCS & Nature-Based Carbon Finance Intelligence Suite */}
            <Route path="/bioenergy-lcoe-economics"       element={<ProtectedRoute path="/bioenergy-lcoe-economics" element={<BioenergyLcoeEconomicsPage />} />} />
            <Route path="/beccs-project-finance"          element={<ProtectedRoute path="/beccs-project-finance" element={<BeccsProjectFinancePage />} />} />
            <Route path="/forestry-timber-finance"        element={<ProtectedRoute path="/forestry-timber-finance" element={<ForestryTimberFinancePage />} />} />
            <Route path="/nature-based-solutions-finance" element={<ProtectedRoute path="/nature-based-solutions-finance" element={<NatureBasedSolutionsFinancePage />} />} />
            <Route path="/carbon-removal-markets"         element={<ProtectedRoute path="/carbon-removal-markets" element={<CarbonRemovalMarketsPage />} />} />
            <Route path="/biodiversity-natural-capital"   element={<ProtectedRoute path="/biodiversity-natural-capital" element={<BiodiversityNaturalCapitalPage />} />} />
            {/* Sprint DY — Municipal & Sub-Sovereign Climate Finance Intelligence Suite */}
            <Route path="/municipal-green-bond-analytics"  element={<ProtectedRoute path="/municipal-green-bond-analytics" element={<MunicipalGreenBondAnalyticsPage />} />} />
            <Route path="/cdfi-climate-finance"            element={<ProtectedRoute path="/cdfi-climate-finance" element={<CdfiClimateFinancePage />} />} />
            <Route path="/mdb-sub-sovereign-lending"       element={<ProtectedRoute path="/mdb-sub-sovereign-lending" element={<MdbSubSovereignLendingPage />} />} />
            <Route path="/cpace-climate-finance"           element={<ProtectedRoute path="/cpace-climate-finance" element={<CPaceClimateFinancePage />} />} />
            <Route path="/climate-revenue-bond-modeler"    element={<ProtectedRoute path="/climate-revenue-bond-modeler" element={<ClimateRevenueBondModelerPage />} />} />
            <Route path="/municipal-climate-resilience-hub" element={<ProtectedRoute path="/municipal-climate-resilience-hub" element={<MunicipalClimateResilienceHubPage />} />} />
            <Route path="/blue-bond-analytics"              element={<ProtectedRoute path="/blue-bond-analytics" element={<BlueBondAnalyticsPage />} />} />
            <Route path="/shipping-decarbonization-finance" element={<ProtectedRoute path="/shipping-decarbonization-finance" element={<ShippingDecarbonizationFinancePage />} />} />
            <Route path="/marine-blue-carbon-finance"       element={<ProtectedRoute path="/marine-blue-carbon-finance" element={<MarineBlueCarbonFinancePage />} />} />
            <Route path="/aquaculture-climate-finance"      element={<ProtectedRoute path="/aquaculture-climate-finance" element={<AquacultureClimateFinancePage />} />} />
            <Route path="/ocean-carbon-credit-market"       element={<ProtectedRoute path="/ocean-carbon-credit-market" element={<OceanCarbonCreditMarketPage />} />} />
            <Route path="/coastal-resilience-finance"       element={<ProtectedRoute path="/coastal-resilience-finance" element={<CoastalResilienceFinancePage />} />} />
            {/* Sprint EA — India Green Economy Carbon Finance Suite */}
            <Route path="/regional-carbon-market-hub"        element={<ProtectedRoute path="/regional-carbon-market-hub" element={<RegionalCarbonMarketHubPage />} />} />
            <Route path="/solar-developer-carbon-finance"    element={<ProtectedRoute path="/solar-developer-carbon-finance" element={<SolarDeveloperCarbonFinancePage />} />} />
            <Route path="/solar-manufacturer-carbon-finance" element={<ProtectedRoute path="/solar-manufacturer-carbon-finance" element={<SolarManufacturerCarbonFinancePage />} />} />
            <Route path="/green-hydrogen-ammonia-carbon"     element={<ProtectedRoute path="/green-hydrogen-ammonia-carbon" element={<GreenHydrogenAmmoniaCarbonPage />} />} />
            <Route path="/india-green-infra-finance"         element={<ProtectedRoute path="/india-green-infra-finance" element={<IndiaGreenInfraFinancePage />} />} />
            <Route path="/carbon-arbitrage-portfolio"        element={<ProtectedRoute path="/carbon-arbitrage-portfolio" element={<CarbonArbitragePortfolioPage />} />} />
            <Route path="/carbon-integrity-mrv-analytics"    element={<ProtectedRoute path="/carbon-integrity-mrv-analytics" element={<CarbonIntegrityMrvAnalyticsPage />} />} />
            {/* Sprint EB — Impact Advisory Suite */}
            <Route path="/renewable-lca-epd"                 element={<ProtectedRoute path="/renewable-lca-epd" element={<RenewableLcaEpdPage />} />} />
            <Route path="/ccts-offset-registration"          element={<ProtectedRoute path="/ccts-offset-registration" element={<CctsOffsetRegistrationPage />} />} />
            <Route path="/sustainability-linked-finance"     element={<ProtectedRoute path="/sustainability-linked-finance" element={<SustainabilityLinkedFinancePage />} />} />
            <Route path="/esg-ratings-uplift"                element={<ProtectedRoute path="/esg-ratings-uplift" element={<EsgRatingsUpliftPage />} />} />
            <Route path="/tcfd-physical-risk-assessment"     element={<ProtectedRoute path="/tcfd-physical-risk-assessment" element={<TcfdPhysicalRiskAssessmentPage />} />} />
            <Route path="/tnfd-biodiversity-baseline"        element={<ProtectedRoute path="/tnfd-biodiversity-baseline" element={<TnfdBiodiversityBaselinePage />} />} />
            {/* Sprint EC — Solar Energy Finance Suite */}
            <Route path="/bifacial-agrivoltaic-finance"      element={<ProtectedRoute path="/bifacial-agrivoltaic-finance" element={<BifacialAgrivoltaicFinancePage />} />} />
            <Route path="/floating-solar-finance"            element={<ProtectedRoute path="/floating-solar-finance" element={<FloatingSolarFinancePage />} />} />
            <Route path="/solar-plus-storage-finance"        element={<ProtectedRoute path="/solar-plus-storage-finance" element={<SolarPlusStorageFinancePage />} />} />
            <Route path="/utility-solar-epc-intelligence"    element={<ProtectedRoute path="/utility-solar-epc-intelligence" element={<UtilitySolarEpcIntelligencePage />} />} />
            <Route path="/distributed-community-solar"       element={<ProtectedRoute path="/distributed-community-solar" element={<DistributedCommunitySolarPage />} />} />
            <Route path="/solar-repowering-analytics"        element={<ProtectedRoute path="/solar-repowering-analytics" element={<SolarRepoweringAnalyticsPage />} />} />
            {/* Sprint ED — Solar Panel Manufacturing Intelligence */}
            <Route path="/polysilicon-wafer-supply-chain"        element={<ProtectedRoute path="/polysilicon-wafer-supply-chain" element={<PolysiliconWaferSupplyChainPage />} />} />
            <Route path="/solar-cell-technology-analyzer"        element={<ProtectedRoute path="/solar-cell-technology-analyzer" element={<SolarCellTechnologyAnalyzerPage />} />} />
            <Route path="/solar-module-manufacturing-economics"  element={<ProtectedRoute path="/solar-module-manufacturing-economics" element={<SolarModuleManufacturingEconomicsPage />} />} />
            <Route path="/solar-manufacturing-carbon-lca"        element={<ProtectedRoute path="/solar-manufacturing-carbon-lca" element={<SolarManufacturingCarbonLcaPage />} />} />
            <Route path="/solar-trade-policy-intelligence"       element={<ProtectedRoute path="/solar-trade-policy-intelligence" element={<SolarTradePolicyIntelligencePage />} />} />
            <Route path="/solar-module-quality-bankability"      element={<ProtectedRoute path="/solar-module-quality-bankability" element={<SolarModuleQualityBankabilityPage />} />} />
            {/* Sprint EE — Green Ammonia & Hydrogen Derivatives */}
            <Route path="/green-ammonia-production-economics"    element={<ProtectedRoute path="/green-ammonia-production-economics" element={<GreenAmmoniaProductionEconomicsPage />} />} />
            <Route path="/green-ammonia-shipping-storage"        element={<ProtectedRoute path="/green-ammonia-shipping-storage" element={<GreenAmmoniaShippingStoragePage />} />} />
            <Route path="/green-ammonia-offtake-markets"         element={<ProtectedRoute path="/green-ammonia-offtake-markets" element={<GreenAmmoniaOfftakeMarketsPage />} />} />
            <Route path="/green-ammonia-country-intelligence"    element={<ProtectedRoute path="/green-ammonia-country-intelligence" element={<GreenAmmoniaCountryIntelligencePage />} />} />
            <Route path="/green-ammonia-policy-credits"          element={<ProtectedRoute path="/green-ammonia-policy-credits" element={<GreenAmmoniaPolicyCreditPage />} />} />
            <Route path="/hydrogen-derivatives-comparison"       element={<ProtectedRoute path="/hydrogen-derivatives-comparison" element={<HydrogenDerivativesComparisonPage />} />} />
            {/* Sprint EF — SAF Finance */}
            <Route path="/saf-lcof-engine"                     element={<ProtectedRoute path="/saf-lcof-engine" element={<SafLcofEnginePage />} />} />
            <Route path="/saf-project-finance"                 element={<ProtectedRoute path="/saf-project-finance" element={<SafProjectFinancePage />} />} />
            <Route path="/saf-feedstock-supply-chain"          element={<ProtectedRoute path="/saf-feedstock-supply-chain" element={<SafFeedstockSupplyChainPage />} />} />
            <Route path="/saf-policy-mandate"                  element={<ProtectedRoute path="/saf-policy-mandate" element={<SafPolicyMandatePage />} />} />
            <Route path="/airline-saf-procurement"             element={<ProtectedRoute path="/airline-saf-procurement" element={<AirlineSafProcurementPage />} />} />
            <Route path="/saf-carbon-credits"                  element={<ProtectedRoute path="/saf-carbon-credits" element={<SafCarbonCreditsPage />} />} />
            {/* Sprint EG — Green Steel & Industrial Decarbonization */}
            <Route path="/green-steel-lcop-engine"             element={<ProtectedRoute path="/green-steel-lcop-engine" element={<GreenSteelLcopEnginePage />} />} />
            <Route path="/industrial-hydrogen-integration"     element={<ProtectedRoute path="/industrial-hydrogen-integration" element={<IndustrialHydrogenIntegrationPage />} />} />
            <Route path="/cbam-analytics-compliance"           element={<ProtectedRoute path="/cbam-analytics-compliance" element={<CbamAnalyticsCompliancePage />} />} />
            <Route path="/green-cement-concrete-finance"       element={<ProtectedRoute path="/green-cement-concrete-finance" element={<GreenCementConcreteFinancePage />} />} />
            <Route path="/industrial-electrification-finance"  element={<ProtectedRoute path="/industrial-electrification-finance" element={<IndustrialElectrificationFinancePage />} />} />
            <Route path="/hard-to-abate-transition"            element={<ProtectedRoute path="/hard-to-abate-transition" element={<HardToAbateTransitionPage />} />} />
            {/* Sprint EH — Carbon Dioxide Removal Finance */}
            <Route path="/direct-air-capture-finance"          element={<ProtectedRoute path="/direct-air-capture-finance" element={<DirectAirCaptureFinancePage />} />} />
            <Route path="/enhanced-weathering-finance"         element={<ProtectedRoute path="/enhanced-weathering-finance" element={<EnhancedWeatheringFinancePage />} />} />
            <Route path="/biochar-beccs-finance"               element={<ProtectedRoute path="/biochar-beccs-finance" element={<BiocharBeccsFinancePage />} />} />
            <Route path="/ocean-cdr-finance"                   element={<ProtectedRoute path="/ocean-cdr-finance" element={<OceanCdrFinancePage />} />} />
            <Route path="/cdr-credit-markets"                  element={<ProtectedRoute path="/cdr-credit-markets" element={<CdrCreditMarketsPage />} />} />
            <Route path="/cdr-portfolio-netzero"               element={<ProtectedRoute path="/cdr-portfolio-netzero" element={<CdrPortfolioNetzeroPage />} />} />
            {/* CCUS Market & Storage Infrastructure Suite */}
            <Route path="/ccus-market-intelligence"            element={<ProtectedRoute path="/ccus-market-intelligence" element={<CcusMarketIntelligencePage />} />} />
            <Route path="/ccus-project-finance"                element={<ProtectedRoute path="/ccus-project-finance" element={<CcusProjectFinancePage />} />} />
            <Route path="/carbon-storage-geology"               element={<ProtectedRoute path="/carbon-storage-geology" element={<CarbonStorageGeologyPage />} />} />
            <Route path="/direct-air-capture"                   element={<ProtectedRoute path="/direct-air-capture" element={<DirectAirCapturePage />} />} />
            {/* Sprint EI — Climate Real Estate & Green Buildings Finance */}
            <Route path="/green-building-certification-finance" element={<ProtectedRoute path="/green-building-certification-finance" element={<GreenBuildingCertificationFinancePage />} />} />
            <Route path="/commercial-re-climate-risk"           element={<ProtectedRoute path="/commercial-re-climate-risk" element={<CommercialReClimateRiskPage />} />} />
            <Route path="/green-mortgage-retrofit-finance"      element={<ProtectedRoute path="/green-mortgage-retrofit-finance" element={<GreenMortgageRetrofitFinancePage />} />} />
            <Route path="/re-climate-stress-test"               element={<ProtectedRoute path="/re-climate-stress-test" element={<ReClimateStressTestPage />} />} />
            <Route path="/gresb-real-assets-esg"                element={<ProtectedRoute path="/gresb-real-assets-esg" element={<GresbRealAssetsEsgPage />} />} />
            <Route path="/climate-smart-infrastructure"         element={<ProtectedRoute path="/climate-smart-infrastructure" element={<ClimateSmartInfrastructurePage />} />} />
            {/* Sprint EJ — Circular Economy & Waste Finance */}
            <Route path="/circular-economy-investment"    element={<ProtectedRoute path="/circular-economy-investment" element={<CircularEconomyInvestmentPage />} />} />
            <Route path="/plastic-credits-epr-finance"    element={<ProtectedRoute path="/plastic-credits-epr-finance" element={<PlasticCreditsEprFinancePage />} />} />
            <Route path="/waste-to-energy-biogas-finance" element={<ProtectedRoute path="/waste-to-energy-biogas-finance" element={<WasteToEnergyBiogasFinancePage />} />} />
            <Route path="/recycled-content-markets"       element={<ProtectedRoute path="/recycled-content-markets" element={<RecycledContentMarketsPage />} />} />
            <Route path="/epr-compliance-intelligence"    element={<ProtectedRoute path="/epr-compliance-intelligence" element={<EprComplianceIntelligencePage />} />} />
            <Route path="/circular-supply-chain-finance"  element={<ProtectedRoute path="/circular-supply-chain-finance" element={<CircularSupplyChainFinancePage />} />} />
            {/* Sprint EK — Climate Adaptation & Resilience Finance */}
            <Route path="/flood-resilience-finance"       element={<ProtectedRoute path="/flood-resilience-finance" element={<FloodResilienceFinancePage />} />} />
            <Route path="/heat-adaptation-finance"        element={<ProtectedRoute path="/heat-adaptation-finance" element={<HeatAdaptationFinancePage />} />} />
            <Route path="/nbs-adaptation-finance"         element={<ProtectedRoute path="/nbs-adaptation-finance" element={<NatureBasedSolutionsFinancePage />} />} />
            <Route path="/resilience-bond-analytics"      element={<ProtectedRoute path="/resilience-bond-analytics" element={<ResilienceBondAnalyticsPage />} />} />
            <Route path="/climate-adaptation-portfolio"   element={<ProtectedRoute path="/climate-adaptation-portfolio" element={<ClimateAdaptationPortfolioPage />} />} />
            <Route path="/just-transition-adaptation"     element={<ProtectedRoute path="/just-transition-adaptation" element={<JustTransitionAdaptationPage />} />} />
            {/* Sprint EL — Utility Infrastructure Assets Finance */}
            <Route path="/power-grid-transmission-finance"       element={<ProtectedRoute path="/power-grid-transmission-finance" element={<PowerGridTransmissionFinancePage />} />} />
            <Route path="/water-wastewater-utility-finance"      element={<ProtectedRoute path="/water-wastewater-utility-finance" element={<WaterWastewaterUtilityFinancePage />} />} />
            <Route path="/regulated-utility-rate-case"           element={<ProtectedRoute path="/regulated-utility-rate-case" element={<RegulatedUtilityRateCasePage />} />} />
            <Route path="/gas-network-decarbonisation"           element={<ProtectedRoute path="/gas-network-decarbonisation" element={<GasNetworkDecarbonisationPage />} />} />
            <Route path="/utility-physical-climate-resilience"   element={<ProtectedRoute path="/utility-physical-climate-resilience" element={<UtilityPhysicalClimateResiliencePage />} />} />
            <Route path="/infrastructure-debt-utility-bonds"     element={<ProtectedRoute path="/infrastructure-debt-utility-bonds" element={<InfrastructureDebtUtilityBondsPage />} />} />
            {/* Sprint RE — Solar & Renewable Energy Intelligence Suite */}
            <Route path="/renewable-portfolio-intelligence" element={<ProtectedRoute path="/renewable-portfolio-intelligence" element={<RenewablePortfolioIntelligencePage />} />} />
            <Route path="/solar-resource-performance"      element={<ProtectedRoute path="/solar-resource-performance" element={<SolarResourcePerformancePage />} />} />
            <Route path="/ppa-revenue-analytics"           element={<ProtectedRoute path="/ppa-revenue-analytics" element={<PPARevenueAnalyticsPage />} />} />
            <Route path="/bess-grid-analytics"             element={<ProtectedRoute path="/bess-grid-analytics" element={<BESSGridAnalyticsPage />} />} />
            <Route path="/renewable-ml-forecasting"        element={<ProtectedRoute path="/renewable-ml-forecasting" element={<RenewableMLForecastingPage />} />} />
            {/* Sprint BC — Residential RE Assessment · XBRL Ingestion */}
            <Route path="/residential-re-assessment" element={<ProtectedRoute path="/residential-re-assessment" element={<ResidentialReAssessmentPage />} />} />
            <Route path="/xbrl-ingestion"            element={<ProtectedRoute path="/xbrl-ingestion" element={<XbrlIngestionPage />} />} />
            {/* Sprint BB — PE Deal Pipeline · Technology Risk */}
            <Route path="/pe-deal-pipeline"  element={<ProtectedRoute path="/pe-deal-pipeline" element={<PeDealPipelinePage />} />} />
            <Route path="/technology-risk"   element={<ProtectedRoute path="/technology-risk" element={<TechnologyRiskPage />} />} />
            {/* Sprint BA — Sovereign Climate Risk Intelligence · SEC Climate Disclosure */}
            <Route path="/sovereign-climate-intelligence" element={<ProtectedRoute path="/sovereign-climate-intelligence" element={<SovereignClimateIntelligencePage />} />} />
            <Route path="/sec-climate-disclosure"         element={<ProtectedRoute path="/sec-climate-disclosure" element={<SecClimateDisclosurePage />} />} />
            {/* Sprint AZ — Double Materiality Workshop · SFDR PAI Dashboard · XBRL Export Wizard */}
            <Route path="/double-materiality-workshop" element={<ProtectedRoute path="/double-materiality-workshop" element={<DoubleMaterialityWorkshopPage />} />} />
            <Route path="/sfdr-pai-dashboard"          element={<ProtectedRoute path="/sfdr-pai-dashboard" element={<SfdrPaiDashboardPage />} />} />
            <Route path="/additionality-assessment"    element={<ProtectedRoute path="/additionality-assessment" element={<AdditionalityAssessmentPage />} />} />
            <Route path="/csrd-dma"                    element={<ProtectedRoute path="/csrd-dma" element={<CsrdDmaPage />} />} />
            <Route path="/impact-attribution"          element={<ProtectedRoute path="/impact-attribution" element={<ImpactAttributionPage />} />} />
            <Route path="/impact-measurement-hub"      element={<ProtectedRoute path="/impact-measurement-hub" element={<ImpactMeasurementHubPage />} />} />
            <Route path="/industrial-ccs"              element={<ProtectedRoute path="/industrial-ccs" element={<IndustrialCcsPage />} />} />
            <Route path="/portfolio-dashboard"          element={<ProtectedRoute path="/portfolio-dashboard" element={<PortfolioDashboardPage />} />} />
            <Route path="/sdg-alignment-engine"        element={<ProtectedRoute path="/sdg-alignment-engine" element={<SdgAlignmentEnginePage />} />} />
            <Route path="/sfdr-pai"                    element={<ProtectedRoute path="/sfdr-pai" element={<SfdrPaiPage />} />} />
            <Route path="/theory-of-change"            element={<ProtectedRoute path="/theory-of-change" element={<TheoryOfChangePage />} />} />
            <Route path="/xbrl-export-wizard"          element={<ProtectedRoute path="/xbrl-export-wizard" element={<XbrlExportWizardPage />} />} />
            {/* Sprint AY — EUDR Engine · CSDDD Engine · Entity 360 Intelligence */}
            <Route path="/eudr-engine"  element={<ProtectedRoute path="/eudr-engine" element={<EudrEnginePage />} />} />
            <Route path="/csddd-engine" element={<ProtectedRoute path="/csddd-engine" element={<CsdddEnginePage />} />} />
            <Route path="/entity-360"   element={<ProtectedRoute path="/entity-360" element={<Entity360Page />} />} />
            {/* Sprint AX — Sovereign & Country Climate Risk Intelligence (new modules) */}
            <Route path="/sovereign-esg-scorer"     element={<ProtectedRoute path="/sovereign-esg-scorer" element={<SovereignEsgScorerPage />} />} />
            <Route path="/ndc-alignment-tracker"    element={<ProtectedRoute path="/ndc-alignment-tracker" element={<NdcAlignmentTrackerPage />} />} />
            <Route path="/sovereign-physical-risk"  element={<ProtectedRoute path="/sovereign-physical-risk" element={<SovereignPhysicalRiskPage />} />} />
            <Route path="/em-debt-climate-risk"     element={<ProtectedRoute path="/em-debt-climate-risk" element={<EmDebtClimateRiskPage />} />} />
            <Route path="/mdb-climate-finance"      element={<ProtectedRoute path="/mdb-climate-finance" element={<MdbClimateFinancePage />} />} />
            {/* Sprint AL — Transition Planning & Net Zero Alignment */}
            <Route path="/transition-planning-hub"     element={<ProtectedRoute path="/transition-planning-hub" element={<TransitionPlanningHubPage />} />} />
            <Route path="/transition-plan-builder"     element={<ProtectedRoute path="/transition-plan-builder" element={<TransitionPlanBuilderPage />} />} />
            <Route path="/gfanz-sector-pathways"       element={<ProtectedRoute path="/gfanz-sector-pathways" element={<GfanzSectorPathwaysPage />} />} />
            <Route path="/act-assessment"              element={<ProtectedRoute path="/act-assessment" element={<ActAssessmentPage />} />} />
            <Route path="/net-zero-commitment-tracker" element={<ProtectedRoute path="/net-zero-commitment-tracker" element={<NetZeroCommitmentTrackerPage />} />} />
            <Route path="/transition-credibility"      element={<ProtectedRoute path="/transition-credibility" element={<TransitionCredibilityPage />} />} />
            {/* Sprint AK — ESG Ratings Intelligence & Provider Analytics */}
            <Route path="/esg-ratings-hub"             element={<ProtectedRoute path="/esg-ratings-hub" element={<EsgRatingsHubPage />} />} />
            <Route path="/esg-ratings-comparator"      element={<ProtectedRoute path="/esg-ratings-comparator" element={<EsgRatingsComparatorPage />} />} />
            <Route path="/ratings-methodology-decoder" element={<ProtectedRoute path="/ratings-methodology-decoder" element={<RatingsMethodologyDecoderPage />} />} />
            <Route path="/ratings-migration-momentum"  element={<ProtectedRoute path="/ratings-migration-momentum" element={<RatingsMigrationMomentumPage />} />} />
            <Route path="/controversy-rating-impact"   element={<ProtectedRoute path="/controversy-rating-impact" element={<ControversyRatingImpactPage />} />} />
            <Route path="/greenwashing-detector"       element={<ProtectedRoute path="/greenwashing-detector" element={<GreenwashingDetectorPage />} />} />
            {/* Sprint AH — Regulatory Reporting & Disclosure Automation */}
            <Route path="/disclosure-hub"       element={<ProtectedRoute path="/disclosure-hub" element={<DisclosureHubPage />} />} />
            <Route path="/csrd-esrs-automation" element={<ProtectedRoute path="/csrd-esrs-automation" element={<CsrdEsrsAutomationPage />} />} />
            <Route path="/sfdr-v2-reporting"    element={<ProtectedRoute path="/sfdr-v2-reporting" element={<SfdrV2ReportingPage />} />} />
            <Route path="/issb-disclosure"      element={<ProtectedRoute path="/issb-disclosure" element={<IssbDisclosurePage />} />} />
            <Route path="/uk-sdr"               element={<ProtectedRoute path="/uk-sdr" element={<UkSdrPage />} />} />
            <Route path="/sec-climate-rule"     element={<ProtectedRoute path="/sec-climate-rule" element={<SecClimateRulePage />} />} />
            {/* Sprint AG — Private Markets & Alternative Credit ESG */}
            <Route path="/private-markets-esg-hub" element={<ProtectedRoute path="/private-markets-esg-hub" element={<PrivateMarketsEsgHubPage />} />} />
            <Route path="/pe-esg-diligence"        element={<ProtectedRoute path="/pe-esg-diligence" element={<PeEsgDiligencePage />} />} />
            <Route path="/private-credit-climate" element={<ProtectedRoute path="/private-credit-climate" element={<PrivateCreditClimatePage />} />} />
            <Route path="/infrastructure-esg"     element={<ProtectedRoute path="/infrastructure-esg" element={<InfrastructureEsgPage />} />} />
            <Route path="/real-assets-climate"    element={<ProtectedRoute path="/real-assets-climate" element={<RealAssetsClimatePage />} />} />
            <Route path="/vc-impact"              element={<ProtectedRoute path="/vc-impact" element={<VcImpactPage />} />} />
            {/* Sprint AF — Quantitative ESG & Portfolio Intelligence */}
            <Route path="/esg-portfolio-optimizer"    element={<ProtectedRoute path="/esg-portfolio-optimizer" element={<EsgPortfolioOptimizerPage />} />} />
            <Route path="/carbon-aware-allocation"    element={<ProtectedRoute path="/carbon-aware-allocation" element={<CarbonAwareAllocationPage />} />} />
            <Route path="/esg-momentum-scanner"       element={<ProtectedRoute path="/esg-momentum-scanner" element={<EsgMomentumScannerPage />} />} />
            <Route path="/net-zero-portfolio-builder" element={<ProtectedRoute path="/net-zero-portfolio-builder" element={<NetZeroPortfolioBuilderPage />} />} />
            <Route path="/esg-factor-alpha"           element={<ProtectedRoute path="/esg-factor-alpha" element={<EsgFactorAlphaPage />} />} />
            <Route path="/quant-esg-hub"              element={<ProtectedRoute path="/quant-esg-hub" element={<QuantEsgHubPage />} />} />
            {/* Sprint AE — Corporate Governance & Executive Intelligence */}
            <Route path="/board-composition"          element={<ProtectedRoute path="/board-composition" element={<BoardCompositionPage />} />} />
            <Route path="/executive-pay-analytics"    element={<ProtectedRoute path="/executive-pay-analytics" element={<ExecutivePayAnalyticsPage />} />} />
            <Route path="/shareholder-activism"       element={<ProtectedRoute path="/shareholder-activism" element={<ShareholderActivismPage />} />} />
            <Route path="/anti-corruption"            element={<ProtectedRoute path="/anti-corruption" element={<AntiCorruptionPage />} />} />
            <Route path="/proxy-voting-intel"         element={<ProtectedRoute path="/proxy-voting-intel" element={<ProxyVotingIntelPage />} />} />
            <Route path="/diversity-equity-inclusion" element={<ProtectedRoute path="/diversity-equity-inclusion" element={<DiversityEquityInclusionPage />} />} />
            {/* Sprint AD — Social & Just Transition */}
            <Route path="/just-transition-finance"  element={<ProtectedRoute path="/just-transition-finance" element={<JustTransitionFinancePage />} />} />
            <Route path="/human-rights-risk"        element={<ProtectedRoute path="/human-rights-risk" element={<HumanRightsRiskPage />} />} />
            <Route path="/living-wage-tracker"      element={<ProtectedRoute path="/living-wage-tracker" element={<LivingWageTrackerPage />} />} />
            <Route path="/modern-slavery-intel"     element={<ProtectedRoute path="/modern-slavery-intel" element={<ModernSlaveryIntelPage />} />} />
            <Route path="/community-impact"         element={<ProtectedRoute path="/community-impact" element={<CommunityImpactPage />} />} />
            <Route path="/workplace-health-safety"  element={<ProtectedRoute path="/workplace-health-safety" element={<WorkplaceHealthSafetyPage />} />} />
            {/* Sprint AC — Nature, Environment & Physical Risk */}
            <Route path="/nature-loss-risk"         element={<ProtectedRoute path="/nature-loss-risk" element={<NatureLossRiskPage />} />} />
            <Route path="/water-risk-analytics"     element={<ProtectedRoute path="/water-risk-analytics" element={<WaterRiskAnalyticsPage />} />} />
            <Route path="/land-use-deforestation"   element={<ProtectedRoute path="/land-use-deforestation" element={<LandUseDeforestationPage />} />} />
            <Route path="/ocean-marine-risk"        element={<ProtectedRoute path="/ocean-marine-risk" element={<OceanMarineRiskPage />} />} />
            <Route path="/circular-economy-tracker" element={<ProtectedRoute path="/circular-economy-tracker" element={<CircularEconomyTrackerPage />} />} />
            <Route path="/air-quality-health-risk"  element={<ProtectedRoute path="/air-quality-health-risk" element={<AirQualityHealthRiskPage />} />} />
            {/* Sprint AB — Macro & Systemic Risk Intelligence */}
            <Route path="/systemic-esg-risk"            element={<ProtectedRoute path="/systemic-esg-risk" element={<SystemicESGRiskPage />} />} />
            <Route path="/climate-policy-intelligence"  element={<ProtectedRoute path="/climate-policy-intelligence" element={<ClimatePolicyIntelligencePage />} />} />
            <Route path="/green-central-banking"        element={<ProtectedRoute path="/green-central-banking" element={<GreenCentralBankingPage />} />} />
            <Route path="/esg-factor-attribution"       element={<ProtectedRoute path="/esg-factor-attribution" element={<ESGFactorAttributionPage />} />} />
            <Route path="/transition-scenario-modeller" element={<ProtectedRoute path="/transition-scenario-modeller" element={<TransitionScenarioModellerPage />} />} />
            <Route path="/cross-asset-contagion"        element={<ProtectedRoute path="/cross-asset-contagion" element={<CrossAssetContagionPage />} />} />
            {/* Sprint AA — Climate Finance Architecture */}
            <Route path="/climate-finance-hub"       element={<ProtectedRoute path="/climate-finance-hub" element={<ClimateFinanceHubPage />} />} />
            <Route path="/article6-markets"          element={<ProtectedRoute path="/article6-markets" element={<Article6MarketsPage />} />} />
            <Route path="/cbam-compliance"           element={<ProtectedRoute path="/cbam-compliance" element={<CbamCompliancePage />} />} />
            <Route path="/climate-finance-tracker"   element={<ProtectedRoute path="/climate-finance-tracker" element={<ClimateFinanceTrackerPage />} />} />
            <Route path="/green-taxonomy-navigator"  element={<ProtectedRoute path="/green-taxonomy-navigator" element={<GreenTaxonomyNavigatorPage />} />} />
            <Route path="/climate-sovereign-bonds"   element={<ProtectedRoute path="/climate-sovereign-bonds" element={<ClimateSovereignBondsPage />} />} />
            {/* Sprint V — Governance & Audit Trail */}
            <Route path="/audit-trail"              element={<ProtectedRoute path="/audit-trail" element={<AuditTrailPage />} />} />
            <Route path="/model-governance"         element={<ProtectedRoute path="/model-governance" element={<ModelGovernancePage />} />} />
            <Route path="/approval-workflows"       element={<ProtectedRoute path="/approval-workflows" element={<ApprovalWorkflowsPage />} />} />
            <Route path="/compliance-evidence"      element={<ProtectedRoute path="/compliance-evidence" element={<ComplianceEvidencePage />} />} />
            <Route path="/change-management"        element={<ProtectedRoute path="/change-management" element={<ChangeManagementPage />} />} />
            <Route path="/governance-hub"           element={<ProtectedRoute path="/governance-hub" element={<GovernanceHubPage />} />} />
            <Route path="/corporate-governance"     element={<ProtectedRoute path="/corporate-governance" element={<CorporateGovernancePage />} />} />
            <Route path="/geopolitical-ai-gov"      element={<ProtectedRoute path="/geopolitical-ai-gov" element={<GeopoliticalAiGovPage />} />} />
            {/* Sprint D — Platform Intelligence */}
            <Route path="/stranded-assets"        element={<ProtectedRoute path="/stranded-assets" element={<StrandedAssetsPage />} />} />
            <Route path="/ngfs-scenarios"        element={<ProtectedRoute path="/ngfs-scenarios" element={<NGFSScenariosPage />} />} />
            <Route path="/portfolio-climate-var" element={<ProtectedRoute path="/portfolio-climate-var" element={<PortfolioClimateVaRPage />} />} />
            <Route path="/pipeline-dashboard"    element={<ProtectedRoute path="/pipeline-dashboard" element={<PipelineDashboardPage />} />} />
            <Route path="/csrd-ixbrl"            element={<ProtectedRoute path="/csrd-ixbrl" element={<CSRDiXBRLPage />} />} />
            <Route path="/company-profiles"      element={<ProtectedRoute path="/company-profiles" element={<CompanyProfilesPage />} />} />
            <Route path="/pitch"                  element={<ProtectedRoute path="/pitch" element={<ClientPitchPage />} />} />
            {/* India Regulatory Intelligence */}
            <Route path="/rbi-climate-risk"       element={<ProtectedRoute path="/rbi-climate-risk" element={<RbiClimateRiskPage />} />} />
            <Route path="/india-ccts"             element={<ProtectedRoute path="/india-ccts" element={<IndiaCctsPage />} />} />
            {/* Sustainability Reporting Intelligence */}
            <Route path="/sustainability-report-builder" element={<ProtectedRoute path="/sustainability-report-builder" element={<SustainabilityReportBuilderPage />} />} />
            <Route path="/esrs-datapoint-navigator" element={<ProtectedRoute path="/esrs-datapoint-navigator" element={<EsrsDatapointNavigatorPage />} />} />
            <Route path="/sector-sustainability-benchmark" element={<ProtectedRoute path="/sector-sustainability-benchmark" element={<SectorSustainabilityBenchmarkPage />} />} />
            <Route path="/report-quality-engine" element={<ProtectedRoute path="/report-quality-engine" element={<ReportQualityEnginePage />} />} />
            <Route path="/metrics-data-architecture" element={<ProtectedRoute path="/metrics-data-architecture" element={<MetricsDataArchitecturePage />} />} />
            <Route path="/narrative-intelligence" element={<ProtectedRoute path="/narrative-intelligence" element={<NarrativeIntelligencePage />} />} />
            {/* Next-Gen Use Cases (docs/NEXT_USE_CASES.md) */}
            <Route path="/climate-underwriting-workbench" element={<ProtectedRoute path="/climate-underwriting-workbench" element={<ClimateUnderwritingWorkbenchPage />} />} />
            <Route path="/sovereign-corporate-bridge" element={<ProtectedRoute path="/sovereign-corporate-bridge" element={<SovereignCorporateBridgePage />} />} />
            <Route path="/eu-compliance-cockpit" element={<ProtectedRoute path="/eu-compliance-cockpit" element={<EuComplianceCockpitPage />} />} />
            <Route path="/asset-exposure-explorer" element={<ProtectedRoute path="/asset-exposure-explorer" element={<AssetExposureExplorerPage />} />} />
            <Route path="/flood-loss-calibrator" element={<ProtectedRoute path="/flood-loss-calibrator" element={<FloodLossCalibratorPage />} />} />
            <Route path="/site-biodiversity-screener" element={<ProtectedRoute path="/site-biodiversity-screener" element={<SiteBiodiversityScreenerPage />} />} />
            <Route path="/facility-emissions-attribution" element={<ProtectedRoute path="/facility-emissions-attribution" element={<FacilityEmissionsAttributionPage />} />} />
            <Route path="/vcm-cross-registry-tracker" element={<ProtectedRoute path="/vcm-cross-registry-tracker" element={<VcmCrossRegistryTrackerPage />} />} />
            <Route path="/grid-carbon-intelligence" element={<ProtectedRoute path="/grid-carbon-intelligence" element={<GridCarbonIntelligencePage />} />} />
            <Route path="/supervisory-scenario-runner" element={<ProtectedRoute path="/supervisory-scenario-runner" element={<SupervisoryScenarioRunnerPage />} />} />
            <Route path="/counterparty-ownership-graph" element={<ProtectedRoute path="/counterparty-ownership-graph" element={<CounterpartyOwnershipGraphPage />} />} />
            <Route path="/sanctions-screening-desk" element={<ProtectedRoute path="/sanctions-screening-desk" element={<SanctionsScreeningDeskPage />} />} />
            <Route path="/credit-spread-climate-monitor" element={<ProtectedRoute path="/credit-spread-climate-monitor" element={<CreditSpreadClimateMonitorPage />} />} />
            <Route path="/climate-litigation-tracker" element={<ProtectedRoute path="/climate-litigation-tracker" element={<ClimateLitigationTrackerPage />} />} />
            <Route path="/cbam-trade-exposure-mapper" element={<ProtectedRoute path="/cbam-trade-exposure-mapper" element={<CbamTradeExposureMapperPage />} />} />
            {/* Batch 2 — Energy & Capital Markets Desk (docs/NEXT_USE_CASES_2.md) */}
            <Route path="/ppa-structuring-desk" element={<ProtectedRoute path="/ppa-structuring-desk" element={<PpaStructuringDeskPage />} />} />
            <Route path="/project-finance-debt-sizer" element={<ProtectedRoute path="/project-finance-debt-sizer" element={<ProjectFinanceDebtSizerPage />} />} />
            <Route path="/infra-debt-portfolio-manager" element={<ProtectedRoute path="/infra-debt-portfolio-manager" element={<InfraDebtPortfolioManagerPage />} />} />
            <Route path="/green-bond-pricing-desk" element={<ProtectedRoute path="/green-bond-pricing-desk" element={<GreenBondPricingDeskPage />} />} />
            <Route path="/slb-structurer" element={<ProtectedRoute path="/slb-structurer" element={<SlbStructurerPage />} />} />
            <Route path="/carbon-offtake-structurer" element={<ProtectedRoute path="/carbon-offtake-structurer" element={<CarbonOfftakeStructurerPage />} />} />
            <Route path="/battery-revenue-stacker" element={<ProtectedRoute path="/battery-revenue-stacker" element={<BatteryRevenueStackerPage />} />} />
            <Route path="/hybrid-project-workbench" element={<ProtectedRoute path="/hybrid-project-workbench" element={<HybridProjectWorkbenchPage />} />} />
            <Route path="/pf-credit-rating-engine" element={<ProtectedRoute path="/pf-credit-rating-engine" element={<PfCreditRatingEnginePage />} />} />
            <Route path="/maturity-wall-monitor" element={<ProtectedRoute path="/maturity-wall-monitor" element={<MaturityWallMonitorPage />} />} />
            <Route path="/carbon-derivatives-desk" element={<ProtectedRoute path="/carbon-derivatives-desk" element={<CarbonDerivativesDeskPage />} />} />
            <Route path="/ppa-xva-engine" element={<ProtectedRoute path="/ppa-xva-engine" element={<PpaXvaEnginePage />} />} />
            <Route path="/tax-equity-transferability" element={<ProtectedRoute path="/tax-equity-transferability" element={<TaxEquityTransferabilityPage />} />} />
            <Route path="/yieldco-dropdown-analyzer" element={<ProtectedRoute path="/yieldco-dropdown-analyzer" element={<YieldcoDropdownAnalyzerPage />} />} />
            <Route path="/energy-transition-credit-portal" element={<ProtectedRoute path="/energy-transition-credit-portal" element={<EnergyTransitionCreditPortalPage />} />} />
            <Route path="/financial-modeling-studio" element={<ProtectedRoute path="/financial-modeling-studio" element={<FinancialModelingStudioPage />} />} />
            <Route path="/compliance-carbon-desk" element={<ProtectedRoute path="/compliance-carbon-desk" element={<ComplianceCarbonDeskPage />} />} />
            <Route path="/global-physical-risk-atlas" element={<ProtectedRoute path="/global-physical-risk-atlas" element={<GlobalPhysicalRiskAtlasPage />} />} />
            <Route path="/climate-collateral-framework" element={<ProtectedRoute path="/climate-collateral-framework" element={<ClimateCollateralFrameworkPage />} />} />
            <Route path="/team-access-hub" element={<ProtectedRoute path="/team-access-hub" element={<TeamAccessHubPage />} />} />
            {/* Auto-discovered modules (module.config.js manifests). Rendered after
                the manual routes so a manual <Route> wins on any duplicate path —
                this is the safe incremental-migration fallback. */}
            {AUTO_ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<ProtectedRoute path={r.path} element={<r.element />} />} />
            ))}
            <Route path="*" element={<Dashboard />} />
          </Routes>
            </Suspense>
        </main>
        <GuidedModeOverlay />
        <DataDepthOverlay />
        <CommandPalette />
        <ConnectedModulesPanel />
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
          <CarbonCreditProvider>
          <ClimateRiskProvider>
          <CedaProvider>
          <BigClimateDbProvider>
          <DataCaptureProvider>
          <ReferenceDataProvider>
          <BrowserRouter>
            <AuthProvider>
              <GuidedModeProvider>
                <DataDepthProvider>
                  <AppContent />
                </DataDepthProvider>
              </GuidedModeProvider>
            </AuthProvider>
          </BrowserRouter>
          </ReferenceDataProvider>
          </DataCaptureProvider>
          </BigClimateDbProvider>
          </CedaProvider>
          </ClimateRiskProvider>
          </CarbonCreditProvider>
        </PortfolioProvider>
      </CompanyEnrichmentProvider>
    </TestDataProvider>
  );
}
