const fs = require('fs');
const path = require('path');

const BASE = 'C:\Users\SahilChopra\Documents\Risk Analytics\frontend\src\features';

const files = [
  'anomaly-detection-engine/pages/AnomalyDetectionEnginePage.jsx',
  'cross-entity-intelligence-dashboard/pages/CrossEntityIntelligenceDashboardPage.jsx',
  'dme-risk-engine/pages/DmeRiskEnginePage.jsx',
  'ensemble-prediction-engine/pages/EnsemblePredictionEnginePage.jsx',
  'holdings-deep-dive/pages/HoldingsDeepDivePage.jsx',
  'ml-feature-engineering/pages/MlFeatureEngineeringPage.jsx',
  'offset-portfolio-tracker/pages/OffsetPortfolioTrackerPage.jsx',
  'peer-clustering-segmentation/pages/PeerClusteringSegmentationPage.jsx',
  'physical-risk-early-warning/pages/PhysicalRiskEarlyWarningPage.jsx',
  'portfolio-stress-test-drilldown/pages/PortfolioStressTestDrilldownPage.jsx',
  're-portfolio-dashboard/pages/REPortfolioDashboardPage.jsx',
  'scenario-blending-optimizer/pages/ScenarioBlendingOptimizerPage.jsx',
  'scenario-conditional-prediction/pages/ScenarioConditionalPredictionPage.jsx',
  'scenario-dashboard-builder/pages/ScenarioDashboardBuilderPage.jsx',
  'sector-peer-benchmarking-engine/pages/SectorPeerBenchmarkingEnginePage.jsx',
  'supply-chain-contagion/pages/SupplyChainContagionPage.jsx',
  'universal-entity-comparator/pages/UniversalEntityComparatorPage.jsx',
  'vintage-cohort-stranded/pages/VintageCohortStrandedPage.jsx',
  'pcaf-universal-attributor/pages/PcafUniversalAttributorPage.jsx',
  'cat-bond-ils/pages/CatBondIlsPage.jsx',
  'predictive-analytics-hub/pages/PredictiveAnalyticsHubPage.jsx',
  'climate-stress-test-suite/pages/ClimateStressTestSuitePage.jsx',
];

const SR_DEF = "const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };";

function hasSrDef(content) {
  return /const sr\s*=/.test(content) || /const sRand\s*=/.test(content) || /const seededRandom\s*=/.test(content);
}

function addSrDef(content) {
  // Try to insert after const T={...} line
  const tLine = content.match(/^const T=\{[^\n]+\n/m);
  if (tLine) {
    return content.replace(tLine[0], tLine[0] + SR_DEF + '\n');
  }
  // Fallback: insert after last import
  const lastImport = [...content.matchAll(/^import [^\n]+\n/gm)].pop();
  if (lastImport) {
    const idx = lastImport.index + lastImport[0].length;
    return content.slice(0, idx) + '\n' + SR_DEF + '\n' + content.slice(idx);
  }
  return content;
}

let totalChanges = 0;

for (const relPath of files) {
  const filePath = path.join(BASE, relPath);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Add sr def if not present
  if (!hasSrDef(content)) {
    content = addSrDef(content);
  }

  // Replace Math.abs(Math.sin(i * N + M)) → sr(i * SCALED_N + SCALED_M)
  content = content.replace(
    /Math\.abs\(Math\.sin\(i\s*\*\s*([\d.]+)(?:\s*\+\s*([\d.]+))?\)\)/g,
    (match, mult, offset) => {
      const scaled = Math.round(parseFloat(mult) * 10);
      const off = offset ? ' + ' + Math.round(parseFloat(offset) * 10) : '';
      return `sr(i * ${scaled}${off})`;
    }
  );

  // Replace Math.sin(i * N + M) → (sr(i * SCALED_N + SCALED_M) * 2 - 1) 
  // Note: only match numeric offsets (not variables)
  content = content.replace(
    /Math\.sin\(i\s*\*\s*([\d.]+)(?:\s*\+\s*([\d.]+))?\)/g,
    (match, mult, offset) => {
      const scaled = Math.round(parseFloat(mult) * 10);
      const off = offset ? ' + ' + Math.round(parseFloat(offset) * 10) : '';
      return `(sr(i * ${scaled}${off}) * 2 - 1)`;
    }
  );

  // Replace Math.cos(i * N) → (sr(i * SCALED_N + 500) * 2 - 1)
  content = content.replace(
    /Math\.cos\(i\s*\*\s*([\d.]+)(?:\s*\+\s*([\d.]+))?\)/g,
    (match, mult, offset) => {
      const scaled = Math.round(parseFloat(mult) * 10) + 500;
      return `(sr(i * ${scaled}) * 2 - 1)`;
    }
  );

  // Replace Math.cos(i) (no multiplier) → (sr(i * 510) * 2 - 1)
  content = content.replace(/Math\.cos\(i\)/g, '(sr(i * 510) * 2 - 1)');

  // Replace Math.sin(i) (no multiplier) → (sr(i * 10) * 2 - 1)
  content = content.replace(/Math\.sin\(i\)/g, '(sr(i * 10) * 2 - 1)');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const changes = (content !== original) ? 1 : 0;
    console.log(`FIXED: ${relPath}`);
    totalChanges++;
  } else {
    console.log(`NO CHANGE: ${relPath}`);
  }
}

console.log(`\nTotal files modified: ${totalChanges}`);
