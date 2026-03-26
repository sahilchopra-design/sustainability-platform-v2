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

/* ═══════════════════════════════════════════════════════════════════
   THEME — Light Pastel · Navy / Gold / Sage (AA Impact Inc. brand)
   ═══════════════════════════════════════════════════════════════════ */
const T = {
  bg:       '#f6f4f0',       // warm cream
  surface:  '#ffffff',
  surfaceH: '#f0ede7',       // hover tint
  border:   '#e5e0d8',
  borderL:  '#d5cfc5',
  navy:     '#1b3a5c',       // brand primary
  navyL:    '#2c5a8c',
  gold:     '#c5a96a',       // brand accent
  goldL:    '#d4be8a',
  sage:     '#5a8a6a',       // leaf green
  sageL:    '#7ba67d',
  text:     '#1b3a5c',       // navy text
  textSec:  '#5c6b7e',
  textMut:  '#9aa3ae',
  card:     '0 1px 4px rgba(27,58,92,0.06)',
  cardH:    '0 4px 16px rgba(27,58,92,0.1)',
  font:     "'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
};
const PASTEL = ['#4a7faa','#5a9aaa','#5a8a6a','#7ba67d','#8a7a5a','#a08a5a','#c5a96a'];

/* ═══════════════════════════════════════════════════════════════════
   NAVIGATION DATA — 7 domains, 45 modules
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

function Dashboard() {
  const navigate = useNavigate();
  const pieData = NAV_GROUPS.map((g, i) => ({ name: g.label.split(' ')[0], value: g.items.length, color: PASTEL[i] }));
  const tipStyle = { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 12 };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: T.navy, margin: 0, letterSpacing: '-0.02em' }}>Platform Overview</h1>
          <p style={{ color: T.textSec, fontSize: 13, marginTop: 6 }}>
            AA Impact Inc. — A2 Intelligence Risk Analytics | 45 modules across 7 domains | 10 global regions
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#eaf5ee', padding: '6px 14px', borderRadius: 20, border: '1px solid #c5e0cc' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.sage }} />
          <span style={{ fontSize: 11, color: T.sage, fontWeight: 600, letterSpacing: '0.06em' }}>ALL SYSTEMS ONLINE</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Active Modules', value: '45', sub: 'E76 — E120' },
          { label: 'Regulatory Frameworks', value: '38+', sub: 'Global multi-jurisdictional' },
          { label: 'API Endpoints', value: '250+', sub: 'FastAPI v0.110' },
          { label: 'Regions', value: '10', sub: 'APAC / GCC / Americas' },
          { label: 'Data Points', value: '1,222', sub: 'ESRS datapoints mapped' },
        ].map((s) => (
          <div key={s.label} style={{
            background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 20px',
            borderTop: `3px solid ${T.gold}`, boxShadow: T.card, transition: 'box-shadow 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = T.cardH}
          onMouseLeave={e => e.currentTarget.style.boxShadow = T.card}>
            <div style={{ fontSize: 10, color: T.textSec, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.navy, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.textMut, marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Module Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} stroke={T.surface} strokeWidth={2}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(val, name) => [`${val} modules`, name]} contentStyle={tipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 6 }}>
            {pieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: T.textSec }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Regional Regulatory Coverage %</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={COVERAGE_DATA} layout="vertical" margin={{ left: 0 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: T.textMut }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis type="category" dataKey="region" width={65} tick={{ fontSize: 10, fill: T.textSec }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => `${v}%`} contentStyle={tipStyle} />
              <Bar dataKey="coverage" radius={[0, 4, 4, 0]}>
                {COVERAGE_DATA.map((e, i) => <Cell key={i} fill={e.coverage >= 85 ? T.sage : e.coverage >= 75 ? T.gold : T.textMut} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, boxShadow: T.card }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Platform Growth Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: T.textMut }} axisLine={{ stroke: T.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: T.textMut }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tipStyle} />
              <Area type="monotone" dataKey="modules" stroke={T.sage} fill="rgba(90,138,106,0.12)" name="Modules" strokeWidth={2} />
              <Area type="monotone" dataKey="coverage" stroke={T.gold} fill="rgba(197,169,106,0.1)" name="Coverage %" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Domain Cards */}
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14 }}>Domains</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14, marginBottom: 32 }}>
        {NAV_GROUPS.map((g) => (
          <div key={g.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', boxShadow: T.card, transition: 'box-shadow 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = T.cardH}
            onMouseLeave={e => e.currentTarget.style.boxShadow = T.card}>
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10, background: `${g.color}0a` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${g.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{g.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>{g.label}</div>
                <div style={{ fontSize: 11, color: T.textMut }}>{g.items.length} modules</div>
              </div>
            </div>
            <div style={{ padding: '8px 12px' }}>
              {g.items.slice(0, 4).map(item => (
                <div key={item.path} onClick={() => navigate(item.path)} style={{
                  padding: '7px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: 12, color: T.textSec, transition: 'background 0.15s, color 0.15s',
                }} onMouseEnter={e => { e.currentTarget.style.background = T.surfaceH; e.currentTarget.style.color = T.navy; }}
                   onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textSec; }}>
                  <span>{item.label}</span>
                  <span style={{ fontSize: 9, color: g.color, fontWeight: 700, background: `${g.color}14`, padding: '2px 6px', borderRadius: 4 }}>{item.code}</span>
                </div>
              ))}
              {g.items.length > 4 && (
                <div style={{ padding: '4px 8px', fontSize: 11, color: T.textMut }}>+{g.items.length - 4} more</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* All Modules */}
      <div style={{ fontSize: 15, fontWeight: 700, color: T.navy, marginBottom: 14 }}>All 45 Modules</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
        {ALL_ITEMS.map(n => {
          const grp = NAV_GROUPS.find(g => g.items.includes(n));
          return (
            <div key={n.path} onClick={() => navigate(n.path)} style={{
              padding: '12px 14px', borderRadius: 10, border: `1px solid ${T.border}`, background: T.surface, cursor: 'pointer',
              borderLeft: `3px solid ${grp?.color || T.textMut}`, transition: 'box-shadow 0.2s', boxShadow: T.card,
            }} onMouseEnter={e => e.currentTarget.style.boxShadow = T.cardH}
               onMouseLeave={e => e.currentTarget.style.boxShadow = T.card}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.navy, marginBottom: 3 }}>{n.label}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, color: T.textMut }}>{n.badge}</span>
                <span style={{ fontSize: 9, color: grp?.color, fontWeight: 700 }}>{n.code}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR — Navy with gold accents
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
      width: 255, background: T.navy, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid #244a6e', height: '100%', overflow: 'hidden',
    }}>
      {/* Search */}
      <div style={{ padding: '14px 12px 8px' }}>
        <input type="text" placeholder="Search modules..." value={search} onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: '#e8e4dd', fontSize: 12, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = T.gold}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
        />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 16px' }}>
        {filtered.map(group => (
          <div key={group.label} style={{ marginBottom: 2 }}>
            <div onClick={() => toggle(group.label)} style={{
              padding: '8px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 6, userSelect: 'none',
            }}>
              <span style={{ fontSize: 13 }}>{group.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: T.goldL, flex: 1 }}>{group.label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>{group.items.length}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', transform: collapsed[group.label] ? 'rotate(-90deg)' : '', transition: 'transform 0.15s' }}>{'\u25BE'}</span>
            </div>
            {!collapsed[group.label] && group.items.map(n => {
              const isActive = location.pathname === n.path;
              return (
                <NavLink key={n.path} to={n.path} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 8px 6px 32px', borderRadius: 6, marginBottom: 1, textDecoration: 'none',
                  background: isActive ? T.gold : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 400, color: isActive ? T.navy : 'rgba(255,255,255,0.65)' }}>{n.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: isActive ? T.navy : 'rgba(255,255,255,0.25)' }}>{n.code}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>45 Modules | 10 Regions</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.sageL }} />
          <span style={{ fontSize: 9, color: T.sageL }}>LIVE</span>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HEADER BAR — Navy with brand identity
   ═══════════════════════════════════════════════════════════════════ */
function HeaderBar({ sidebarOpen, setSidebarOpen }) {
  const [time, setTime] = useState('');
  const location = useLocation();
  const current = ALL_ITEMS.find(i => i.path === location.pathname);
  const group = current ? NAV_GROUPS.find(g => g.items.includes(current)) : null;

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header style={{
      height: 48, background: T.navy, borderBottom: `1px solid #244a6e`,
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 14, flexShrink: 0,
    }}>
      {/* Toggle */}
      <button onClick={() => setSidebarOpen(o => !o)} style={{
        background: 'none', border: 'none', color: T.goldL, cursor: 'pointer', fontSize: 16, padding: '4px 6px',
      }}>{'\u2630'}</button>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: 16 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: T.gold,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 900, color: T.navy, letterSpacing: '0.02em',
        }}>AA</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.gold, lineHeight: 1, letterSpacing: '0.02em' }}>AA Impact Inc.</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3 }}>A2 Intelligence Risk Analytics</div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        {current ? (
          <>
            <NavLink to="/" style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Dashboard</NavLink>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>/</span>
            <span style={{ fontSize: 11, color: T.goldL, fontWeight: 600 }}>{group?.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>/</span>
            <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{current.label}</span>
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.gold, background: 'rgba(197,169,106,0.2)', padding: '2px 6px', borderRadius: 4, marginLeft: 4,
            }}>{current.code}</span>
          </>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Dashboard</span>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
        <span>API <span style={{ color: T.sageL, fontWeight: 600 }}>LIVE</span></span>
        <span>:8001</span>
        <span>{time}</span>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS BAR
   ═══════════════════════════════════════════════════════════════════ */
function StatusBar() {
  const location = useLocation();
  const current = ALL_ITEMS.find(i => i.path === location.pathname);
  return (
    <div style={{
      height: 26, background: T.navy, borderTop: '1px solid #244a6e',
      display: 'flex', alignItems: 'center', padding: '0 18px', gap: 20,
      fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0, letterSpacing: '0.03em',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: T.sageL }} />
        CONNECTED
      </div>
      <span>45 MODULES</span>
      <span>30 PERSONAS</span>
      <span>10 REGIONS</span>
      <span>119 NOTION PAGES</span>
      {current && <span style={{ color: T.goldL }}>{current.badge}</span>}
      <span style={{ marginLeft: 'auto', color: T.gold, fontWeight: 600 }}>AA IMPACT INC.</span>
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
