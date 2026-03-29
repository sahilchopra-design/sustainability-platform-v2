import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { TestDataProvider } from './context/TestDataContext';
import { CompanyEnrichmentProvider } from './context/CompanyEnrichmentContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

// Sprint 37 — E108–E111
import RegulatoryCapitalPage from './features/regulatory-capital/pages/RegulatoryCapitalPage';
// ClimatePolicyPage moved to Sprint O imports
import ExportCreditESGPage from './features/export-credit-esg/pages/ExportCreditESGPage';
import ESGControversyPage from './features/esg-controversy/pages/ESGControversyPage';
// Sprint 38 — E112–E115
import CRREMPage from './features/crrem/pages/CRREMPage';
import LossDamagePage from './features/loss-damage/pages/LossDamagePage';
import ForcedLabourPage from './features/forced-labour-msv2/pages/ForcedLabourPage';
import SLLSLBv2Page from './features/sll-slb-v2/pages/SLLSLBv2Page';
// Sprint 39 — E116–E119
import NatureCapitalAccountingPage from './features/nature-capital-accounting/pages/NatureCapitalAccountingPage';
import RegulatoryHorizonPage from './features/regulatory-horizon/pages/RegulatoryHorizonPage';
import ClimateTechPage from './features/climate-tech/pages/ClimateTechPage';
import ComprehensiveReportingPage from './features/comprehensive-reporting/pages/ComprehensiveReportingPage';
// Sprint 29 — E76–E79
import CryptoClimatePage from './features/crypto-climate/pages/CryptoClimatePage';
import AIGovernancePage from './features/ai-governance/pages/AIGovernancePage';
import CarbonAccountingAIPage from './features/carbon-accounting-ai/pages/CarbonAccountingAIPage';
import ClimateInsurancePage from './features/climate-insurance/pages/ClimateInsurancePage';
// Sprint 30 — E80–E83
import CorporateNatureStrategyPage from './features/corporate-nature-strategy/pages/CorporateNatureStrategyPage';
import GreenSecuritisationPage from './features/green-securitisation/pages/GreenSecuritisationPage';
import DigitalProductPassportPage from './features/digital-product-passport/pages/DigitalProductPassportPage';
import AdaptationFinancePage from './features/adaptation-finance/pages/AdaptationFinancePage';
// Sprint 31 — E84–E87
import InternalCarbonPricePage from './features/internal-carbon-price/pages/InternalCarbonPricePage';
import SocialBondPage from './features/social-bond/pages/SocialBondPage';
import ClimateFinancialStatementsPage from './features/climate-financial-statements/pages/ClimateFinancialStatementsPage';
import EMClimateRiskPage from './features/em-climate-risk/pages/EMClimateRiskPage';
// Sprint 32 — E88–E91
import BiodiversityCreditsPage from './features/biodiversity-credits/pages/BiodiversityCreditsPage';
// JustTransitionPage moved to Sprint O imports
import CarbonRemovalPage from './features/carbon-removal/pages/CarbonRemovalPage';
import ClimateLitigationPage from './features/climate-litigation/pages/ClimateLitigationPage';
// Sprint 33 — E92–E95
import WaterRiskPage from './features/water-risk/pages/WaterRiskPage';
import CriticalMineralsPage from './features/critical-minerals/pages/CriticalMineralsPage';
import NbsFinancePage from './features/nbs-finance/pages/NbsFinancePage';
import SFDRArt9Page from './features/sfdr-art9/pages/SFDRArt9Page';
// Sprint 34 — E96–E99
import VCMIntegrityPage from './features/vcm-integrity/pages/VCMIntegrityPage';
import SocialTaxonomyPage from './features/social-taxonomy/pages/SocialTaxonomyPage';
import GreenHydrogenPage from './features/green-hydrogen/pages/GreenHydrogenPage';
import TransitionFinancePage from './features/transition-finance/pages/TransitionFinancePage';
// Sprint 35 — E100–E103
import StressTestOrchestratorPage from './features/stress-test-orchestrator/pages/StressTestOrchestratorPage';
import SSCFPage from './features/sscf/pages/SSCFPage';
import DoubleMaterialityPage from './features/double-materiality/pages/DoubleMaterialityPage';
import TemperatureAlignmentPage from './features/temperature-alignment/pages/TemperatureAlignmentPage';
// Sprint 36 — E104–E107
import PhysicalRiskPricingPage from './features/physical-risk-pricing/pages/PhysicalRiskPricingPage';
import ESGDataQualityPage from './features/esg-data-quality/pages/ESGDataQualityPage';
import ClimateDerivativesPage from './features/climate-derivatives/pages/ClimateDerivativesPage';
import SovereignSWFPage from './features/sovereign-swf/pages/SovereignSWFPage';
// Sentiment Analysis
import SentimentAnalysisPage from './features/sentiment-analysis/pages/SentimentAnalysisPage';
// E138 PCAF India BRSR
import PCafIndiaBrsrPage from './features/pcaf-india-brsr/pages/PCafIndiaBrsrPage';
// E147 Equator Principles
import EquatorPrinciplesPage from './features/equator-principles/pages/EquatorPrinciplesPage';
// E148 ESMS
import EsmsPage from './features/esms/pages/EsmsPage';
// E149 ISSB S2 / TCFD Climate Disclosure
import IssbTcfdPage from './features/issb-tcfd/pages/IssbTcfdPage';
// E150 EU Taxonomy Alignment
import EuTaxonomyPage from './features/eu-taxonomy/pages/EuTaxonomyPage';
// Sprint D — Platform Intelligence (EP-D1, EP-D3, EP-D4, EP-D6, EP-D7)
import StrandedAssetsPage from './features/stranded-assets/pages/StrandedAssetsPage';
import NGFSScenariosPage from './features/ngfs-scenarios/pages/NGFSScenariosPage';
import PortfolioClimateVaRPage from './features/portfolio-climate-var/pages/PortfolioClimateVaRPage';
import PipelineDashboardPage from './features/pipeline-dashboard/pages/PipelineDashboardPage';
import CSRDiXBRLPage from './features/csrd-ixbrl/pages/CSRDiXBRLPage';
// Master Reference
import CompanyProfilesPage from './features/company-profiles/pages/CompanyProfilesPage';
// Sprint E — Global Market Intelligence
import ExchangeIntelligencePage from './features/exchange-intelligence/pages/ExchangeIntelligencePage';
import SectorBenchmarkingPage from './features/sector-benchmarking/pages/SectorBenchmarkingPage';
// Sprint F — Portfolio Intelligence & Client Services
import PortfolioManagerPage from './features/portfolio-manager/pages/PortfolioManagerPage';
import EsgScreenerPage from './features/esg-screener/pages/EsgScreenerPage';
import StewardshipTrackerPage from './features/stewardship-tracker/pages/StewardshipTrackerPage';
import ClientReportPage from './features/client-report/pages/ClientReportPage';
import RegulatoryCalendarPage from './features/regulatory-calendar/pages/RegulatoryCalendarPage';
// Sprint G — Portfolio Intelligence Advanced Suite
import PortfolioSuitePage from './features/portfolio-suite/pages/PortfolioSuitePage';
import ScenarioStressTestPage from './features/scenario-stress-test/pages/ScenarioStressTestPage';
import CarbonBudgetPage from './features/carbon-budget/pages/CarbonBudgetPage';
import HoldingsDeepDivePage from './features/holdings-deep-dive/pages/HoldingsDeepDivePage';
import BenchmarkAnalyticsPage from './features/benchmark-analytics/pages/BenchmarkAnalyticsPage';
import AdvancedReportStudioPage from './features/advanced-report-studio/pages/AdvancedReportStudioPage';
// Sprint H — Institutional Analytics & AI Intelligence
import RiskAttributionPage from './features/risk-attribution/pages/RiskAttributionPage';
import FixedIncomeEsgPage from './features/fixed-income-esg/pages/FixedIncomeEsgPage';
import PortfolioOptimizerPage from './features/portfolio-optimizer/pages/PortfolioOptimizerPage';
import ControversyMonitorPage from './features/controversy-monitor/pages/ControversyMonitorPage';
import AiSentimentPage from './features/ai-sentiment/pages/AiSentimentPage';
import RegulatoryGapPage from './features/regulatory-gap/pages/RegulatoryGapPage';
import ClimatePhysicalRiskPage from './features/climate-physical-risk/pages/ClimatePhysicalRiskPage';
import ClimateTransitionRiskPage from './features/climate-transition-risk/pages/ClimateTransitionRiskPage';
// Sprint I — Real Estate & Infrastructure ESG
import GreenBuildingCertPage from './features/green-building-cert/pages/GreenBuildingCertPage';
import PropertyPhysicalRiskPage from './features/property-physical-risk/pages/PropertyPhysicalRiskPage';
import GRESBScoringPage from './features/gresb-scoring/pages/GRESBScoringPage';
import InfraESGDueDiligencePage from './features/infra-esg-dd/pages/InfraESGDueDiligencePage';
import REPortfolioDashboardPage from './features/re-portfolio-dashboard/pages/REPortfolioDashboardPage';
// Sprint J — Advanced Quantitative Analytics
import MonteCarloVarPage from './features/monte-carlo-var/pages/MonteCarloVarPage';
import EsgBacktestingPage from './features/esg-backtesting/pages/EsgBacktestingPage';
import ImpliedTempRegressionPage from './features/implied-temp-regression/pages/ImpliedTempRegressionPage';
import CopulaTailRiskPage from './features/copula-tail-risk/pages/CopulaTailRiskPage';
import StochasticScenariosPage from './features/stochastic-scenarios/pages/StochasticScenariosPage';
import QuantDashboardPage from './features/quant-dashboard/pages/QuantDashboardPage';
// Sprint K — Supply Chain & Scope 3
import Scope3EnginePage from './features/scope3-engine/pages/Scope3EnginePage';
import SupplyChainMapPage from './features/supply-chain-map/pages/SupplyChainMapPage';
import CSDDDCompliancePage from './features/csddd-compliance/pages/CSDDDCompliancePage';
import DeforestationRiskPage from './features/deforestation-risk/pages/DeforestationRiskPage';
import SupplyChainCarbonPage from './features/supply-chain-carbon/pages/SupplyChainCarbonPage';
import ValueChainDashboardPage from './features/value-chain-dashboard/pages/ValueChainDashboardPage';
// Sprint L — Private Markets & Alternative Assets
import PeVcEsgPage from './features/pe-vc-esg/pages/PeVcEsgPage';
import PrivateCreditPage from './features/private-credit/pages/PrivateCreditPage';
import FundOfFundsPage from './features/fund-of-funds/pages/FundOfFundsPage';
import LpReportingPage from './features/lp-reporting/pages/LpReportingPage';
import CoInvestmentPage from './features/co-investment/pages/CoInvestmentPage';
import PrivateMarketsHubPage from './features/private-markets-hub/pages/PrivateMarketsHubPage';
// Sprint M — Nature & Biodiversity (TNFD)
import TnfdLeapPage from './features/tnfd-leap/pages/TnfdLeapPage';
import BiodiversityFootprintPage from './features/biodiversity-footprint/pages/BiodiversityFootprintPage';
import EcosystemServicesPage from './features/ecosystem-services/pages/EcosystemServicesPage';
import WaterStressPage from './features/water-stress/pages/WaterStressPage';
import NatureScenariosPage from './features/nature-scenarios/pages/NatureScenariosPage';
import NatureHubPage from './features/nature-hub/pages/NatureHubPage';
// Sprint N — Social & Human Capital Analytics
import BoardDiversityPage from './features/board-diversity/pages/BoardDiversityPage';
import LivingWagePage from './features/living-wage/pages/LivingWagePage';
import HumanRightsDDPage from './features/human-rights-dd/pages/HumanRightsDDPage';
import EmployeeWellbeingPage from './features/employee-wellbeing/pages/EmployeeWellbeingPage';
import SocialImpactPage from './features/social-impact/pages/SocialImpactPage';
import SocialHubPage from './features/social-hub/pages/SocialHubPage';
// Sprint O — Sovereign & Macro ESG Analytics
import SovereignEsgPage from './features/sovereign-esg/pages/SovereignEsgPage';
import ClimatePolicyPage from './features/climate-policy/pages/ClimatePolicyPage';
import MacroTransitionPage from './features/macro-transition/pages/MacroTransitionPage';
import JustTransitionPage from './features/just-transition/pages/JustTransitionPage';
import ParisAlignmentPage from './features/paris-alignment/pages/ParisAlignmentPage';
import SovereignHubPage from './features/sovereign-hub/pages/SovereignHubPage';
// Sprint P — Data Infrastructure & Live Feeds
import ApiOrchestrationPage from './features/api-orchestration/pages/ApiOrchestrationPage';
import DataQualityMonitorPage from './features/data-quality-monitor/pages/DataQualityMonitorPage';
import LiveFeedManagerPage from './features/live-feed-manager/pages/LiveFeedManagerPage';
import DataLineagePage from './features/data-lineage/pages/DataLineagePage';
import BrsrBridgePage from './features/brsr-bridge/pages/BrsrBridgePage';
import DataInfraHubPage from './features/data-infra-hub/pages/DataInfraHubPage';
// Sprint Q — Taxonomy & Classification Engine
import EuTaxonomyEnginePage from './features/eu-taxonomy-engine/pages/EuTaxonomyEnginePage';
import SfdrClassificationPage from './features/sfdr-classification/pages/SfdrClassificationPage';
import IssbMaterialityPage from './features/issb-materiality/pages/IssbMaterialityPage';
import GriAlignmentPage from './features/gri-alignment/pages/GriAlignmentPage';
import FrameworkInteropPage from './features/framework-interop/pages/FrameworkInteropPage';
import TaxonomyHubPage from './features/taxonomy-hub/pages/TaxonomyHubPage';
// Sprint R — Client & Reporting Automation
import ReportGeneratorPage from './features/report-generator/pages/ReportGeneratorPage';
import TemplateManagerPage from './features/template-manager/pages/TemplateManagerPage';
import ClientPortalPage from './features/client-portal/pages/ClientPortalPage';
import ScheduledReportsPage from './features/scheduled-reports/pages/ScheduledReportsPage';
import RegulatorySubmissionPage from './features/regulatory-submission/pages/RegulatorySubmissionPage';
import ReportingHubPage from './features/reporting-hub/pages/ReportingHubPage';
// Sprint S — Data Management Engine (DME)
import DataValidationPage from './features/data-validation/pages/DataValidationPage';
import DataReconciliationPage from './features/data-reconciliation/pages/DataReconciliationPage';
import DataVersioningPage from './features/data-versioning/pages/DataVersioningPage';
import EtlPipelinePage from './features/etl-pipeline/pages/EtlPipelinePage';
import DataGovernancePage from './features/data-governance/pages/DataGovernancePage';
import DmeHubPage from './features/dme-hub/pages/DmeHubPage';
// Sprint U — DME Platform Integration (dme-platform + sentiment-engine + greenium-alpha)
import DmeRiskEnginePage from './features/dme-risk-engine/pages/DmeRiskEnginePage';
import DmeEntityPage from './features/dme-entity/pages/DmeEntityPage';
import DmeScenariosPage from './features/dme-scenarios/pages/DmeScenariosPage';
import DmeAlertsPage from './features/dme-alerts/pages/DmeAlertsPage';
import DmeContagionPage from './features/dme-contagion/pages/DmeContagionPage';
import DmePortfolioPage from './features/dme-portfolio/pages/DmePortfolioPage';
import DmeCompetitivePage from './features/dme-competitive/pages/DmeCompetitivePage';
import DmeDashboardPage from './features/dme-dashboard/pages/DmeDashboardPage';
// Sprint T — Dynamic Materiality Engine
// DoubleMaterialityPage already imported from Sprint 35 (line 55)
import StakeholderImpactPage from './features/stakeholder-impact/pages/StakeholderImpactPage';
import MaterialityTrendsPage from './features/materiality-trends/pages/MaterialityTrendsPage';
import ControversyMaterialityPage from './features/controversy-materiality/pages/ControversyMaterialityPage';
import MaterialityScenariosPage from './features/materiality-scenarios/pages/MaterialityScenariosPage';
import MaterialityHubPage from './features/materiality-hub/pages/MaterialityHubPage';
// Sprint X — Impact Measurement & SDG Finance
import ImpactWeightedAccountsPage from './features/impact-weighted-accounts/pages/ImpactWeightedAccountsPage';
import IrisMetricsPage from './features/iris-metrics/pages/IrisMetricsPage';
import SdgBondImpactPage from './features/sdg-bond-impact/pages/SdgBondImpactPage';
import BlendedFinancePage from './features/blended-finance/pages/BlendedFinancePage';
import ImpactVerificationPage from './features/impact-verification/pages/ImpactVerificationPage';
import ImpactHubPage from './features/impact-hub/pages/ImpactHubPage';
// Sprint W — AI & NLP Analytics
import EsgReportParserPage from './features/esg-report-parser/pages/EsgReportParserPage';
import PredictiveEsgPage from './features/predictive-esg/pages/PredictiveEsgPage';
import AnomalyDetectionPage from './features/anomaly-detection/pages/AnomalyDetectionPage';
import AiEngagementPage from './features/ai-engagement/pages/AiEngagementPage';
import DocumentSimilarityPage from './features/document-similarity/pages/DocumentSimilarityPage';
import AiHubPage from './features/ai-hub/pages/AiHubPage';
// Sprint V — Governance & Audit Trail
import AuditTrailPage from './features/audit-trail/pages/AuditTrailPage';
import ModelGovernancePage from './features/model-governance/pages/ModelGovernancePage';
import ApprovalWorkflowsPage from './features/approval-workflows/pages/ApprovalWorkflowsPage';
import ComplianceEvidencePage from './features/compliance-evidence/pages/ComplianceEvidencePage';
import ChangeManagementPage from './features/change-management/pages/ChangeManagementPage';
import GovernanceHubPage from './features/governance-hub/pages/GovernanceHubPage';
import CorporateGovernancePage from './features/corporate-governance/pages/CorporateGovernancePage';
import GeopoliticalAiGovPage from './features/geopolitical-ai-gov/pages/GeopoliticalAiGovPage';
// Sprint Z — Consumer Carbon Intelligence
import CarbonCalculatorPage from './features/carbon-calculator/pages/CarbonCalculatorPage';
import CarbonWalletPage from './features/carbon-wallet/pages/CarbonWalletPage';
import InvoiceParserPage from './features/invoice-parser/pages/InvoiceParserPage';
import SpendingCarbonPage from './features/spending-carbon/pages/SpendingCarbonPage';
import CarbonEconomyPage from './features/carbon-economy/pages/CarbonEconomyPage';
import ConsumerCarbonHubPage from './features/consumer-carbon-hub/pages/ConsumerCarbonHubPage';
// Sprint AI — Corporate Decarbonisation & SBTi Intelligence
import SbtiTargetSetterPage from './features/sbti-target-setter/pages/SbtiTargetSetterPage';
import DecarbonisationRoadmapPage from './features/decarbonisation-roadmap/pages/DecarbonisationRoadmapPage';
import AbatementCostCurvePage from './features/abatement-cost-curve/pages/AbatementCostCurvePage';
import EnergyTransitionAnalyticsPage from './features/energy-transition-analytics/pages/EnergyTransitionAnalyticsPage';
import CarbonReductionProjectsPage from './features/carbon-reduction-projects/pages/CarbonReductionProjectsPage';
import DecarbonisationHubPage from './features/decarbonisation-hub/pages/DecarbonisationHubPage';
// Sprint AJ — Financed Emissions & Climate Banking Analytics
import PcafFinancedEmissionsPage from './features/pcaf-financed-emissions/pages/PcafFinancedEmissionsPage';
import ClimateStressTestPage from './features/climate-stress-test/pages/ClimateStressTestPage';
import GreenAssetRatioPage from './features/green-asset-ratio/pages/GreenAssetRatioPage';
import PortfolioTemperatureScorePage from './features/portfolio-temperature-score/pages/PortfolioTemperatureScorePage';
import ClimateCreditRiskPage from './features/climate-credit-risk-analytics/pages/ClimateCreditRiskPage';
import ClimateBankingHubPage from './features/climate-banking-hub/pages/ClimateBankingHubPage';
// Sprint AT — Food Systems & Agricultural Finance
import RegenerativeAgriculturePage from './features/regenerative-agriculture/pages/RegenerativeAgriculturePage';
import FoodSupplyChainEmissionsPage from './features/food-supply-chain-emissions/pages/FoodSupplyChainEmissionsPage';
import WaterAgricultureRiskPage from './features/water-agriculture-risk/pages/WaterAgricultureRiskPage';
import LandUseCarbonPage from './features/land-use-carbon/pages/LandUseCarbonPage';
import AgriBiodiversityPage from './features/agri-biodiversity/pages/AgriBiodiversityPage';
import AgriFinanceHubPage from './features/agri-finance-hub/pages/AgriFinanceHubPage';
// Sprint AS — Real Estate & Built Environment ESG
import BuildingEnergyPerformancePage from './features/building-energy-performance/pages/BuildingEnergyPerformancePage';
import GreenBuildingCertificationPage from './features/green-building-certification/pages/GreenBuildingCertificationPage';
import EmbodiedCarbonPage from './features/embodied-carbon/pages/EmbodiedCarbonPage';
import ClimateResilientDesignPage from './features/climate-resilient-design/pages/ClimateResilientDesignPage';
import TenantEngagementEsgPage from './features/tenant-engagement-esg/pages/TenantEngagementEsgPage';
import RealEstateEsgHubPage from './features/real-estate-esg-hub/pages/RealEstateEsgHubPage';
// Sprint AR — Insurance & Underwriting Climate Analytics
import CatastropheModellingPage from './features/catastrophe-modelling/pages/CatastropheModellingPage';
import UnderwritingEsgPage from './features/underwriting-esg/pages/UnderwritingEsgPage';
import ParametricInsurancePage from './features/parametric-insurance/pages/ParametricInsurancePage';
import ReinsuranceClimatePage from './features/reinsurance-climate/pages/ReinsuranceClimatePage';
import InsuranceTransitionPage from './features/insurance-transition/pages/InsuranceTransitionPage';
import InsuranceClimateHubPage from './features/insurance-climate-hub/pages/InsuranceClimateHubPage';
// Sprint AQ — Sovereign ESG & Country-Level Climate Risk Intelligence
import SovereignClimateRiskPage from './features/sovereign-climate-risk/pages/SovereignClimateRiskPage';
import SovereignDebtSustainabilityPage from './features/sovereign-debt-sustainability/pages/SovereignDebtSustainabilityPage';
import CentralBankClimatePage from './features/central-bank-climate/pages/CentralBankClimatePage';
import SovereignNatureRiskPage from './features/sovereign-nature-risk/pages/SovereignNatureRiskPage';
import SovereignSocialIndexPage from './features/sovereign-social-index/pages/SovereignSocialIndexPage';
import SovereignEsgHubPage from './features/sovereign-esg-hub/pages/SovereignEsgHubPage';
// Sprint AP — Supply Chain ESG & Scope 3 Value Chain Intelligence
import Scope3UpstreamTrackerPage from './features/scope3-upstream-tracker/pages/Scope3UpstreamTrackerPage';
import SupplierEngagementPage from './features/supplier-engagement/pages/SupplierEngagementPage';
import CommodityDeforestationPage from './features/commodity-deforestation/pages/CommodityDeforestationPage';
import ConflictMineralsPage from './features/conflict-minerals/pages/ConflictMineralsPage';
import SupplyChainResiliencePage from './features/supply-chain-resilience/pages/SupplyChainResiliencePage';
import SupplyChainEsgHubPage from './features/supply-chain-esg-hub/pages/SupplyChainEsgHubPage';
// Sprint AO — Scope 4 / Avoided Emissions & Climate Solutions
import Scope4AvoidedEmissionsPage from './features/scope4-avoided-emissions/pages/Scope4AvoidedEmissionsPage';
import ProductCarbonHandprintPage from './features/product-carbon-handprint/pages/ProductCarbonHandprintPage';
import EnablementMethodologyPage from './features/enablement-methodology/pages/EnablementMethodologyPage';
import AvoidedEmissionsPortfolioPage from './features/avoided-emissions-portfolio/pages/AvoidedEmissionsPortfolioPage';
import ClimateSolutionTaxonomyPage from './features/climate-solution-taxonomy/pages/ClimateSolutionTaxonomyPage';
import AvoidedEmissionsHubPage from './features/avoided-emissions-hub/pages/AvoidedEmissionsHubPage';
// Sprint AN — Sustainable Transport & Logistics Decarbonisation
import MaritimeImoCompliancePage from './features/maritime-imo-compliance/pages/MaritimeImoCompliancePage';
import AviationCorsiaPage from './features/aviation-corsia/pages/AviationCorsiaPage';
import EvFleetFinancePage from './features/ev-fleet-finance/pages/EvFleetFinancePage';
import SustainableAviationFuelPage from './features/sustainable-aviation-fuel/pages/SustainableAviationFuelPage';
import TransportDecarbonisationPage from './features/transport-decarbonisation/pages/TransportDecarbonisationPage';
import SustainableTransportHubPage from './features/sustainable-transport-hub/pages/SustainableTransportHubPage';
// Sprint AM — Climate Fintech & Digital MRV Intelligence
import DigitalMrvPage from './features/digital-mrv/pages/DigitalMrvPage';
import SatelliteClimateMonitorPage from './features/satellite-climate-monitor/pages/SatelliteClimateMonitorPage';
import BlockchainCarbonRegistryPage from './features/blockchain-carbon-registry/pages/BlockchainCarbonRegistryPage';
import ClimateDataMarketplacePage from './features/climate-data-marketplace/pages/ClimateDataMarketplacePage';
import IotEmissionsTrackerPage from './features/iot-emissions-tracker/pages/IotEmissionsTrackerPage';
import ClimateFintechHubPage from './features/climate-fintech-hub/pages/ClimateFintechHubPage';
// Sprint AL — Transition Planning & Net Zero Alignment Intelligence
import TransitionPlanBuilderPage from './features/transition-plan-builder/pages/TransitionPlanBuilderPage';
import GfanzSectorPathwaysPage from './features/gfanz-sector-pathways/pages/GfanzSectorPathwaysPage';
import ActAssessmentPage from './features/act-assessment/pages/ActAssessmentPage';
import NetZeroCommitmentTrackerPage from './features/net-zero-commitment-tracker/pages/NetZeroCommitmentTrackerPage';
import TransitionCredibilityPage from './features/transition-credibility/pages/TransitionCredibilityPage';
import TransitionPlanningHubPage from './features/transition-planning-hub/pages/TransitionPlanningHubPage';
// Sprint AK — ESG Ratings Intelligence & Provider Analytics
import EsgRatingsComparatorPage from './features/esg-ratings-comparator/pages/EsgRatingsComparatorPage';
import RatingsMethodologyDecoderPage from './features/ratings-methodology-decoder/pages/RatingsMethodologyDecoderPage';
import RatingsMigrationMomentumPage from './features/ratings-migration-momentum/pages/RatingsMigrationMomentumPage';
import ControversyRatingImpactPage from './features/controversy-rating-impact/pages/ControversyRatingImpactPage';
import GreenwashingDetectorPage from './features/greenwashing-detector/pages/GreenwashingDetectorPage';
import EsgRatingsHubPage from './features/esg-ratings-hub/pages/EsgRatingsHubPage';
// Sprint AH — Regulatory Reporting & Disclosure Automation
import CsrdEsrsAutomationPage from './features/csrd-esrs-automation/pages/CsrdEsrsAutomationPage';
import SfdrV2ReportingPage from './features/sfdr-v2-reporting/pages/SfdrV2ReportingPage';
import IssbDisclosurePage from './features/issb-disclosure/pages/IssbDisclosurePage';
import UkSdrPage from './features/uk-sdr/pages/UkSdrPage';
import SecClimateRulePage from './features/sec-climate-rule/pages/SecClimateRulePage';
import DisclosureHubPage from './features/disclosure-hub/pages/DisclosureHubPage';
// Sprint AG — Private Markets & Alternative Credit ESG
import PeEsgDiligencePage from './features/pe-esg-diligence/pages/PeEsgDiligencePage';
import PrivateCreditClimatePage from './features/private-credit-climate/pages/PrivateCreditClimatePage';
import InfrastructureEsgPage from './features/infrastructure-esg/pages/InfrastructureEsgPage';
import RealAssetsClimatePage from './features/real-assets-climate/pages/RealAssetsClimatePage';
import VcImpactPage from './features/vc-impact/pages/VcImpactPage';
import PrivateMarketsEsgHubPage from './features/private-markets-esg-hub/pages/PrivateMarketsEsgHubPage';
// Sprint AF — Quantitative ESG & Portfolio Intelligence
import EsgPortfolioOptimizerPage from './features/esg-portfolio-optimizer/pages/EsgPortfolioOptimizerPage';
import CarbonAwareAllocationPage from './features/carbon-aware-allocation/pages/CarbonAwareAllocationPage';
import EsgMomentumScannerPage from './features/esg-momentum-scanner/pages/EsgMomentumScannerPage';
import NetZeroPortfolioBuilderPage from './features/net-zero-portfolio-builder/pages/NetZeroPortfolioBuilderPage';
import EsgFactorAlphaPage from './features/esg-factor-alpha/pages/EsgFactorAlphaPage';
import QuantEsgHubPage from './features/quant-esg-hub/pages/QuantEsgHubPage';
// Sprint AE — Corporate Governance & Executive Intelligence
import BoardCompositionPage from './features/board-composition/pages/BoardCompositionPage';
import ExecutivePayAnalyticsPage from './features/executive-pay-analytics/pages/ExecutivePayAnalyticsPage';
import ShareholderActivismPage from './features/shareholder-activism/pages/ShareholderActivismPage';
import AntiCorruptionPage from './features/anti-corruption/pages/AntiCorruptionPage';
import ProxyVotingIntelPage from './features/proxy-voting-intel/pages/ProxyVotingIntelPage';
import DiversityEquityInclusionPage from './features/diversity-equity-inclusion/pages/DiversityEquityInclusionPage';
// Sprint AD — Social & Just Transition
import JustTransitionFinancePage from './features/just-transition-finance/pages/JustTransitionFinancePage';
import HumanRightsRiskPage from './features/human-rights-risk/pages/HumanRightsRiskPage';
import LivingWageTrackerPage from './features/living-wage-tracker/pages/LivingWageTrackerPage';
import ModernSlaveryIntelPage from './features/modern-slavery-intel/pages/ModernSlaveryIntelPage';
import CommunityImpactPage from './features/community-impact/pages/CommunityImpactPage';
import WorkplaceHealthSafetyPage from './features/workplace-health-safety/pages/WorkplaceHealthSafetyPage';
// Sprint AC — Nature, Environment & Physical Risk
import NatureLossRiskPage from './features/nature-loss-risk/pages/NatureLossRiskPage';
import WaterRiskAnalyticsPage from './features/water-risk-analytics/pages/WaterRiskAnalyticsPage';
import LandUseDeforestationPage from './features/land-use-deforestation/pages/LandUseDeforestationPage';
import OceanMarineRiskPage from './features/ocean-marine-risk/pages/OceanMarineRiskPage';
import CircularEconomyTrackerPage from './features/circular-economy-tracker/pages/CircularEconomyTrackerPage';
import AirQualityHealthRiskPage from './features/air-quality-health-risk/pages/AirQualityHealthRiskPage';
// Sprint AB — Macro & Systemic Risk Intelligence
import SystemicESGRiskPage from './features/systemic-esg-risk/pages/SystemicESGRiskPage';
import ClimatePolicyIntelligencePage from './features/climate-policy-intelligence/pages/ClimatePolicyIntelligencePage';
import GreenCentralBankingPage from './features/green-central-banking/pages/GreenCentralBankingPage';
import ESGFactorAttributionPage from './features/esg-factor-attribution/pages/ESGFactorAttributionPage';
import TransitionScenarioModellerPage from './features/transition-scenario-modeller/pages/TransitionScenarioModellerPage';
import CrossAssetContagionPage from './features/cross-asset-contagion/pages/CrossAssetContagionPage';
// Sprint AA — Climate Finance Architecture
import ClimateFinanceHubPage from './features/climate-finance-hub/pages/ClimateFinanceHubPage';
import Article6MarketsPage from './features/article6-markets/pages/Article6MarketsPage';
import CbamCompliancePage from './features/cbam-compliance/pages/CbamCompliancePage';
import ClimateFinanceTrackerPage from './features/climate-finance-tracker/pages/ClimateFinanceTrackerPage';
import GreenTaxonomyNavigatorPage from './features/green-taxonomy-navigator/pages/GreenTaxonomyNavigatorPage';
import ClimateSovereignBondsPage from './features/climate-sovereign-bonds/pages/ClimateSovereignBondsPage';
// Sprint Y — Commodity Lifecycle Intelligence
import CommodityIntelligencePage from './features/commodity-intelligence/pages/CommodityIntelligencePage';
import CommodityInventoryPage from './features/commodity-inventory/pages/CommodityInventoryPage';
import LifecycleAssessmentPage from './features/lifecycle-assessment/pages/LifecycleAssessmentPage';
import FinancialFlowPage from './features/financial-flow/pages/FinancialFlowPage';
import EsgValueChainPage from './features/esg-value-chain/pages/EsgValueChainPage';
import ClimateNatureRepoPage from './features/climate-nature-repo/pages/ClimateNatureRepoPage';
import MultiFactorIntegrationPage from './features/multi-factor-integration/pages/MultiFactorIntegrationPage';
import CommodityHubPage from './features/commodity-hub/pages/CommodityHubPage';
import ProductAnatomyPage from './features/product-anatomy/pages/ProductAnatomyPage';
import EpdLcaDatabasePage from './features/epd-lca-database/pages/EpdLcaDatabasePage';

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
  ]},
  { label: 'Carbon & Emissions', icon: '\uD83C\uDF2B\uFE0F', color: PASTEL[1], items: [
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
  { label: 'Institutional Analytics & AI', icon: '🧠', color: '#7e22ce', items: [
    { path: '/risk-attribution',     label: 'Risk Attribution Engine',   badge: 'Barra · 6 Factors · Alpha',   code: 'EP-H1' },
    { path: '/fixed-income-esg',     label: 'Fixed Income & Green Bonds', badge: 'ICMA GBP · Greenium · SLB',  code: 'EP-H2' },
    { path: '/portfolio-optimizer',  label: 'Portfolio Optimizer',       badge: 'Markowitz · ESG Constraints',  code: 'EP-H3' },
    { path: '/controversy-monitor',  label: 'Controversy Monitor',      badge: 'RepRisk · Severity 1-5',       code: 'EP-H4' },
    { path: '/ai-sentiment',         label: 'AI Sentiment Intelligence', badge: 'NLP · E/S/G · 30-Day Feed',   code: 'EP-H5' },
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
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </CompanyEnrichmentProvider>
    </TestDataProvider>
  );
}
