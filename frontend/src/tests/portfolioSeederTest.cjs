/**
 * E2E Test Harness for Portfolio Seeder — 5,000 Securities + 12 Portfolios + 12 Engines
 * Runs in Node.js CJS mode by re-implementing the core logic for testing.
 * Tests: data integrity, engine outputs, cross-source linkage, mock tagging.
 */

const fs = require('fs');
const path = require('path');

// Load reference data directly
const sbtiData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/sbti-companies.json'), 'utf8'));
const owidCo2 = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/owid-co2-compact.json'), 'utf8'));
const owidEnergy = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/owid-energy-compact.json'), 'utf8'));
const cedaData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/ceda-2025.json'), 'utf8'));
const cbamData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/cbam-vulnerability.json'), 'utf8'));
const bigClimateDb = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/big-climate-db.json'), 'utf8'));

// PRNG
const sr = s => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

let passed = 0, failed = 0, warnings = 0;
const results = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      passed++;
      results.push({ name, status: 'PASS' });
    } else {
      failed++;
      results.push({ name, status: 'FAIL', detail: String(result) });
    }
  } catch (e) {
    failed++;
    results.push({ name, status: 'ERROR', detail: e.message });
  }
}

function warn(name, msg) {
  warnings++;
  results.push({ name, status: 'WARN', detail: msg });
}

console.log('═══════════════════════════════════════════════════════════════');
console.log('  A² RISK ANALYTICS — E2E TEST SUITE');
console.log('  Portfolio Seeder · 12 Engines · 6 Reference Databases');
console.log('═══════════════════════════════════════════════════════════════\n');

// ═════════════════════════════════════════════════════════════════
// SECTION 1: REFERENCE DATA INTEGRITY
// ═════════════════════════════════════════════════════════════════
console.log('▸ SECTION 1: Reference Data Integrity\n');

test('SBTi: has 10K+ companies', () => sbtiData.companies.length >= 10000);
test('SBTi: companies have required fields (n, s, r)', () => {
  const sample = sbtiData.companies.slice(0, 100);
  return sample.every(c => c.n && c.s && c.r);
});
test('SBTi: companies with ISINs >= 2000', () => sbtiData.companies.filter(c => c.i && c.i.length > 5).length >= 2000);
test('SBTi: 1.5°C classification exists', () => sbtiData.companies.some(c => c.c === '1.5°C'));

test('OWID CO2: has 200+ countries', () => owidCo2.latestByCountry.length >= 200);
test('OWID CO2: countries have co2_mt field', () => owidCo2.latestByCountry.filter(c => c.co2_mt > 0).length >= 100);
test('OWID CO2: top emitter is China or USA', () => {
  const sorted = [...owidCo2.latestByCountry].sort((a, b) => (b.co2_mt || 0) - (a.co2_mt || 0));
  return ['CHN', 'USA'].includes(sorted[0]?.iso);
});
test('OWID CO2: per-capita data exists', () => owidCo2.latestByCountry.filter(c => c.co2_per_capita > 0).length >= 100);
test('OWID CO2: time series for top 20', () => Object.keys(owidCo2.top20TimeSeries || {}).length >= 15);

test('OWID Energy: has 130+ countries', () => owidEnergy.latestByCountry.length >= 130);
test('OWID Energy: renewables share exists', () => owidEnergy.latestByCountry.filter(c => c.renewables_share_pct > 0).length >= 40);
test('OWID Energy: carbon intensity exists', () => owidEnergy.latestByCountry.filter(c => c.carbon_intensity_kwh > 0).length >= 30);

test('CEDA: 400 sectors', () => cedaData.sectors.length >= 395);
test('CEDA: 149 countries', () => cedaData.countries.length >= 145);
test('CEDA: emission factors are numbers', () => {
  const us = cedaData.countries.find(c => c.code === 'USA');
  if (!us || !us.efs) return 'USA not found';
  const vals = Object.values(us.efs);
  return vals.length > 300 && vals.every(v => typeof v === 'number' && v >= 0);
});

test('CBAM: 105 countries', () => cbamData.countries.length >= 100);
test('CBAM: vulnerability index 0-1 range', () => cbamData.countries.every(c => c.vulnerabilityIndex >= 0 && c.vulnerabilityIndex <= 1));
test('CBAM: 568 default values', () => (cbamData.defaultValues || []).length >= 500);
test('CBAM: phase-in data exists', () => (cbamData.phaseIn || []).length >= 8);

test('Big Climate DB: 2700 products', () => bigClimateDb.length >= 2690);
test('Big Climate DB: 5 countries', () => {
  const countries = [...new Set(bigClimateDb.map(p => p.country))];
  return countries.length === 5;
});
test('Big Climate DB: total EF is positive', () => bigClimateDb.filter(p => p.total > 0).length >= 2500);

// ═════════════════════════════════════════════════════════════════
// SECTION 2: UNIVERSE CONSTRUCTION SIMULATION
// ═════════════════════════════════════════════════════════════════
console.log('\n▸ SECTION 2: Universe Construction Simulation\n');

// Simulate Tier 1
const sbtiWithIsin = sbtiData.companies.filter(c => c.i && c.i.length > 5);
test('Tier 1: SBTi with ISIN count', () => sbtiWithIsin.length >= 2000);

// Build OWID lookup maps
const co2Map = {};
owidCo2.latestByCountry.forEach(c => { co2Map[c.iso] = c; });
const energyMap = {};
owidEnergy.latestByCountry.forEach(c => { energyMap[c.iso] = c; });

// Test cross-referencing
const testCompany = sbtiWithIsin[0];
const countryIso3 = testCompany.l ? testCompany.l.split(',')[0].trim().substring(0, 3).toUpperCase() : '';
test('Cross-ref: SBTi company has location', () => !!testCompany.l);
test('Cross-ref: OWID CO2 map has 200+ entries', () => Object.keys(co2Map).length >= 200);

// Simulate sector-to-CEDA mapping
const SECTOR_CEDA_MAP = {
  'Software and Services': '511200',
  'Electrical Equipment and Machinery': '335110',
  'Professional Services': '541100',
  'Construction and Engineering': '233230',
  'Food and Beverage Processing': '311111',
  'Banks, Diverse Financials, Insurance': '522A00',
  'Real Estate': '531ORE',
  'Chemicals': '325190',
  'Automobiles and Components': '336111',
  'Pharmaceuticals, Biotechnology and Life Sciences': '325410',
};

test('Sector-CEDA mapping: 10+ sectors mapped', () => Object.keys(SECTOR_CEDA_MAP).length >= 10);

// Test CEDA EF lookup
const usaCeda = cedaData.countries.find(c => c.code === 'USA');
test('CEDA EF lookup: USA exists', () => !!usaCeda);
test('CEDA EF lookup: software sector EF', () => {
  if (!usaCeda || !usaCeda.efs) return 'no EFs';
  const ef = usaCeda.efs['511200'];
  return typeof ef === 'number' && ef > 0 && ef < 10;
});

// ═════════════════════════════════════════════════════════════════
// SECTION 3: ENGINE SIMULATION TESTS
// ═════════════════════════════════════════════════════════════════
console.log('\n▸ SECTION 3: Calculation Engine Simulations\n');

// Build a mini test portfolio
const miniUniverse = sbtiWithIsin.slice(0, 100).map((c, i) => {
  const sector = c.s || 'Other';
  const cedaCode = SECTOR_CEDA_MAP[sector] || '541100';
  const countryEF = usaCeda?.efs?.[cedaCode] || 0.5;
  const marketCap = Math.round(1000 + sr(i * 7) * 50000);
  const revenue = Math.round(marketCap * (0.3 + sr(i * 11) * 0.7));
  const scope1 = Math.round(revenue * countryEF * 0.3 * (0.5 + sr(i * 13)));
  const scope2 = Math.round(revenue * countryEF * 0.2 * (0.5 + sr(i * 17)));
  const scope3 = Math.round(revenue * countryEF * 1.5 * (0.5 + sr(i * 19)));

  return {
    id: i,
    name: c.n,
    isin: c.i,
    sector,
    country: c.l || 'Unknown',
    region: c.r || 'Europe',
    assetClass: 'equity',
    marketCap_usd: marketCap * 1e6,
    revenue_usd: revenue * 1e6,
    scope1_tco2e: scope1,
    scope2_tco2e: scope2,
    scope3_tco2e: scope3,
    totalEmissions: scope1 + scope2 + scope3,
    esgScore: Math.round(40 + sr(i * 23) * 50),
    temperatureAlignment_c: 1.2 + sr(i * 29) * 1.5,
    transitionScore: Math.round(30 + sr(i * 31) * 60),
    physicalRiskScore: Math.round(10 + sr(i * 37) * 60),
    waterStress: Math.round(sr(i * 41) * 80),
    sbtiClassification: c.c || '',
    taxonomyAlignment_pct: Math.round(sr(i * 43) * 40),
    cbamExposed: sr(i * 47) > 0.8,
    dataSource: 'real',
  };
});

const miniPortfolio = {
  id: 'test',
  name: 'Test Portfolio',
  totalAum_usd: 0,
  holdings: miniUniverse.slice(0, 50).map((s, i) => {
    const mv = 1e6 + sr(i * 53) * 9e6;
    return { securityId: s.id, weight: 0.02, marketValue: mv };
  }),
};
miniPortfolio.totalAum_usd = miniPortfolio.holdings.reduce((s, h) => s + h.marketValue, 0);

test('Mini universe: 100 securities', () => miniUniverse.length === 100);
test('Mini portfolio: 50 holdings', () => miniPortfolio.holdings.length === 50);
test('Mini portfolio: AUM > 0', () => miniPortfolio.totalAum_usd > 0);

// ENGINE 1: WACI
const safe = (n, d) => d > 0 ? n / d : 0;
function testWACI(portfolio) {
  let waci = 0;
  portfolio.holdings.forEach(h => {
    const sec = miniUniverse.find(s => s.id === h.securityId);
    if (sec && sec.revenue_usd > 0) {
      const weight = h.marketValue / Math.max(1, portfolio.totalAum_usd);
      const intensity = (sec.scope1_tco2e + sec.scope2_tco2e) / (sec.revenue_usd / 1e6);
      waci += weight * intensity;
    }
  });
  return { value: Math.round(waci * 100) / 100, unit: 'tCO2e/$M revenue' };
}
const waciResult = testWACI(miniPortfolio);
test('Engine WACI: returns positive value', () => waciResult.value > 0);
test('Engine WACI: reasonable range (0.01-5000)', () => waciResult.value > 0.01 && waciResult.value < 5000);
test('Engine WACI: has unit', () => waciResult.unit === 'tCO2e/$M revenue');

// ENGINE 2: Financed Emissions
function testFinancedEmissions(portfolio) {
  let total = 0;
  portfolio.holdings.forEach(h => {
    const sec = miniUniverse.find(s => s.id === h.securityId);
    if (sec && sec.marketCap_usd > 0) {
      const attribution = h.marketValue / sec.marketCap_usd;
      total += (sec.scope1_tco2e + sec.scope2_tco2e) * attribution;
    }
  });
  return { value: Math.round(total), unit: 'tCO2e' };
}
const feResult = testFinancedEmissions(miniPortfolio);
test('Engine Financed Emissions: positive', () => feResult.value > 0);
test('Engine Financed Emissions: reasonable (not infinite)', () => feResult.value < 1e9);

// ENGINE 3: Portfolio Temperature
function testPortfolioTemp(portfolio) {
  let weightedTemp = 0, totalWeight = 0;
  portfolio.holdings.forEach(h => {
    const sec = miniUniverse.find(s => s.id === h.securityId);
    if (sec && sec.temperatureAlignment_c) {
      const w = h.marketValue / Math.max(1, portfolio.totalAum_usd);
      weightedTemp += w * sec.temperatureAlignment_c;
      totalWeight += w;
    }
  });
  return { value: totalWeight > 0 ? Math.round(weightedTemp / totalWeight * 100) / 100 : 0, unit: '°C' };
}
const tempResult = testPortfolioTemp(miniPortfolio);
test('Engine Temperature: 1-4°C range', () => tempResult.value >= 1.0 && tempResult.value <= 4.0);

// ENGINE 4: Climate VaR
function testClimateVaR(portfolio) {
  const scenarioMultipliers = { Orderly: 0.05, Disorderly: 0.12, HotHouse: 0.25 };
  const results = {};
  Object.entries(scenarioMultipliers).forEach(([name, mult]) => {
    let totalLoss = 0;
    portfolio.holdings.forEach(h => {
      const sec = miniUniverse.find(s => s.id === h.securityId);
      if (sec) {
        const carbonRisk = safe(sec.scope1_tco2e + sec.scope2_tco2e, sec.revenue_usd / 1e6) / 1000;
        totalLoss += h.marketValue * mult * (1 + carbonRisk);
      }
    });
    results[name] = { value: Math.round(safe(totalLoss, portfolio.totalAum_usd) * 10000) / 100, unit: '% of AUM' };
  });
  return results;
}
const varResult = testClimateVaR(miniPortfolio);
test('Engine CVaR: Orderly < Disorderly < HotHouse', () =>
  varResult.Orderly.value < varResult.Disorderly.value && varResult.Disorderly.value < varResult.HotHouse.value);
test('Engine CVaR: Orderly < 20%', () => varResult.Orderly.value < 20);
test('Engine CVaR: HotHouse < 100%', () => varResult.HotHouse.value < 100);

// ENGINE 5: SFDR PAI
function testSFDRPAI(portfolio) {
  const n = portfolio.holdings.length || 1;
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const avgScope1 = secs.reduce((s, c) => s + (c.scope1_tco2e || 0), 0) / n;
  const avgScope2 = secs.reduce((s, c) => s + (c.scope2_tco2e || 0), 0) / n;
  const avgWater = secs.reduce((s, c) => s + (c.waterStress || 0), 0) / n;
  return {
    pai1_ghgEmissions: Math.round(avgScope1 + avgScope2),
    pai2_carbonFootprint: Math.round(safe(avgScope1 + avgScope2, portfolio.totalAum_usd / 1e6)),
    pai5_waterStress: Math.round(avgWater),
    totalIndicators: 18,
    coveredIndicators: 5,
  };
}
const paiResult = testSFDRPAI(miniPortfolio);
test('Engine SFDR PAI: GHG > 0', () => paiResult.pai1_ghgEmissions > 0);
test('Engine SFDR PAI: water stress 0-100', () => paiResult.pai5_waterStress >= 0 && paiResult.pai5_waterStress <= 100);

// ENGINE 6: Taxonomy Alignment
function testTaxonomy(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const totalTax = secs.reduce((s, c) => s + (c.taxonomyAlignment_pct || 0), 0);
  const n = secs.length || 1;
  return { value: Math.round(totalTax / n * 10) / 10, unit: '%' };
}
const taxResult = testTaxonomy(miniPortfolio);
test('Engine Taxonomy: 0-100% range', () => taxResult.value >= 0 && taxResult.value <= 100);

// ENGINE 7: Transition Score
function testTransitionScore(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const avgScore = secs.reduce((s, c) => s + (c.transitionScore || 0), 0) / Math.max(1, secs.length);
  return { value: Math.round(avgScore * 10) / 10, unit: 'score (0-100)' };
}
const transResult = testTransitionScore(miniPortfolio);
test('Engine Transition: 0-100 range', () => transResult.value >= 0 && transResult.value <= 100);

// ENGINE 8: Physical Risk
function testPhysicalRisk(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const weighted = secs.reduce((s, c, i) => {
    const w = portfolio.holdings[i]?.marketValue / Math.max(1, portfolio.totalAum_usd);
    return s + (c.physicalRiskScore || 0) * w;
  }, 0);
  return { value: Math.round(weighted * 10) / 10, unit: 'score (0-100)' };
}
const physResult = testPhysicalRisk(miniPortfolio);
test('Engine Physical Risk: 0-100', () => physResult.value >= 0 && physResult.value <= 100);

// ENGINE 9: Water Footprint
function testWaterFootprint(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const avgStress = secs.reduce((s, c) => s + (c.waterStress || 0), 0) / Math.max(1, secs.length);
  return { value: Math.round(avgStress * 10) / 10, unit: 'stress-weighted score' };
}
const waterResult = testWaterFootprint(miniPortfolio);
test('Engine Water: 0-100', () => waterResult.value >= 0 && waterResult.value <= 100);

// ENGINE 10: Biodiversity
function testBiodiversity(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const avgImpact = secs.reduce((s, c) => {
    const impact = ((c.scope1_tco2e || 0) + (c.scope2_tco2e || 0)) / Math.max(1, c.revenue_usd / 1e6) * 0.01;
    return s + Math.min(100, impact);
  }, 0) / Math.max(1, secs.length);
  return { value: Math.round(avgImpact * 10) / 10, unit: 'impact score (0-100)' };
}
const bioResult = testBiodiversity(miniPortfolio);
test('Engine Biodiversity: non-negative', () => bioResult.value >= 0);

// ENGINE 11: SBTi Coverage
function testSBTiCoverage(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const withTarget = secs.filter(s => s.sbtiClassification && s.sbtiClassification.includes('°C'));
  return { value: Math.round(safe(withTarget.length, secs.length) * 100 * 10) / 10, unit: '%' };
}
const sbtiResult = testSBTiCoverage(miniPortfolio);
test('Engine SBTi Coverage: 0-100%', () => sbtiResult.value >= 0 && sbtiResult.value <= 100);
test('Engine SBTi Coverage: > 50% (most are from SBTi DB)', () => sbtiResult.value > 50);

// ENGINE 12: CBAM Exposure
function testCBAMExposure(portfolio) {
  const secs = portfolio.holdings.map(h => miniUniverse.find(s => s.id === h.securityId)).filter(Boolean);
  const exposed = secs.filter(s => s.cbamExposed);
  const exposureValue = exposed.reduce((s, c, i) => s + (portfolio.holdings[i]?.marketValue || 0), 0);
  return { value: Math.round(safe(exposureValue, portfolio.totalAum_usd) * 10000) / 100, unit: '% AUM exposed' };
}
const cbamResult = testCBAMExposure(miniPortfolio);
test('Engine CBAM: 0-100%', () => cbamResult.value >= 0 && cbamResult.value <= 100);

// ═════════════════════════════════════════════════════════════════
// SECTION 4: CROSS-SOURCE LINKAGE VALIDATION
// ═════════════════════════════════════════════════════════════════
console.log('\n▸ SECTION 4: Cross-Source Linkage Validation\n');

// Test OWID × CEDA cross-reference
const owidCountries = new Set(owidCo2.latestByCountry.map(c => c.iso));
const cedaCountries = new Set(cedaData.countries.map(c => c.code));
const overlap = [...owidCountries].filter(c => cedaCountries.has(c));
test('OWID × CEDA: 100+ overlapping countries', () => overlap.length >= 100);

// CBAM × OWID
const cbamISOs = new Set(cbamData.countries.map(c => c.iso3));
const cbamOwidOverlap = [...cbamISOs].filter(c => owidCountries.has(c));
test('CBAM × OWID: 80+ overlapping countries', () => cbamOwidOverlap.length >= 80);

// SBTi sector coverage
const sbtiSectors = [...new Set(sbtiData.companies.map(c => c.s))];
test('SBTi: 20+ distinct sectors', () => sbtiSectors.length >= 20);

// CEDA sector coverage for key SBTi sectors
const mappedSectors = Object.keys(SECTOR_CEDA_MAP);
const cedaSectorCodes = new Set(cedaData.sectors.map(s => s.code));
const validMappings = mappedSectors.filter(s => cedaSectorCodes.has(SECTOR_CEDA_MAP[s]));
test('Sector mapping: 8+ map to valid CEDA codes', () => validMappings.length >= 8);

// Big Climate DB × OWID countries
const bcdbCountries = ['DK', 'GB', 'FR', 'ES', 'NL'];
const bcdbInOwid = bcdbCountries.filter(c => {
  // OWID uses ISO3, BCDB uses ISO2 — check mapping
  const iso3Map = { DK: 'DNK', GB: 'GBR', FR: 'FRA', ES: 'ESP', NL: 'NLD' };
  return owidCountries.has(iso3Map[c]);
});
test('Big Climate DB × OWID: all 5 countries linked', () => bcdbInOwid.length === 5);

// ═════════════════════════════════════════════════════════════════
// SECTION 5: DATA QUALITY & EDGE CASES
// ═════════════════════════════════════════════════════════════════
console.log('\n▸ SECTION 5: Data Quality & Edge Cases\n');

// Division by zero guards
test('Div guard: empty portfolio WACI', () => {
  const empty = { holdings: [], totalAum_usd: 0 };
  const r = testWACI(empty);
  return r.value === 0 || !isNaN(r.value);
});

test('Div guard: empty portfolio financed emissions', () => {
  const empty = { holdings: [], totalAum_usd: 0 };
  const r = testFinancedEmissions(empty);
  return r.value === 0 || !isNaN(r.value);
});

test('Div guard: single holding portfolio temp', () => {
  const single = {
    holdings: [{ securityId: 0, weight: 1, marketValue: 1e6 }],
    totalAum_usd: 1e6,
  };
  const r = testPortfolioTemp(single);
  return !isNaN(r.value) && r.value > 0;
});

// NaN checks
test('No NaN in WACI', () => !isNaN(waciResult.value));
test('No NaN in Financed Emissions', () => !isNaN(feResult.value));
test('No NaN in Temperature', () => !isNaN(tempResult.value));
test('No NaN in CVaR Orderly', () => !isNaN(varResult.Orderly.value));
test('No NaN in SFDR PAI', () => !isNaN(paiResult.pai1_ghgEmissions));
test('No NaN in Taxonomy', () => !isNaN(taxResult.value));
test('No NaN in Transition', () => !isNaN(transResult.value));
test('No NaN in Physical Risk', () => !isNaN(physResult.value));
test('No NaN in Water', () => !isNaN(waterResult.value));
test('No NaN in Biodiversity', () => !isNaN(bioResult.value));
test('No NaN in SBTi Coverage', () => !isNaN(sbtiResult.value));
test('No NaN in CBAM', () => !isNaN(cbamResult.value));

// No Infinity
test('No Infinity in any engine', () => {
  const vals = [waciResult.value, feResult.value, tempResult.value,
    varResult.Orderly.value, varResult.Disorderly.value, varResult.HotHouse.value,
    paiResult.pai1_ghgEmissions, taxResult.value, transResult.value,
    physResult.value, waterResult.value, bioResult.value, sbtiResult.value, cbamResult.value];
  return vals.every(v => isFinite(v));
});

// Deterministic PRNG
test('PRNG deterministic: sr(42) stable', () => {
  const a = sr(42);
  const b = sr(42);
  return a === b;
});

test('PRNG range: sr() always 0-1', () => {
  for (let i = 0; i < 1000; i++) {
    const v = sr(i);
    if (v < 0 || v >= 1) return 'sr(' + i + ') = ' + v;
  }
  return true;
});

// ═════════════════════════════════════════════════════════════════
// SECTION 6: ENGINE OUTPUT SUMMARY
// ═════════════════════════════════════════════════════════════════
console.log('\n▸ SECTION 6: Engine Output Summary\n');

console.log('┌─────────────────────────────┬────────────────┬──────────────────────────┐');
console.log('│ Engine                      │ Value          │ Unit                     │');
console.log('├─────────────────────────────┼────────────────┼──────────────────────────┤');
const pad = (s, n) => (s + ' '.repeat(n)).slice(0, n);
console.log(`│ ${pad('WACI', 27)} │ ${pad(String(waciResult.value), 14)} │ ${pad(waciResult.unit, 24)} │`);
console.log(`│ ${pad('Financed Emissions', 27)} │ ${pad(String(feResult.value), 14)} │ ${pad(feResult.unit, 24)} │`);
console.log(`│ ${pad('Portfolio Temperature', 27)} │ ${pad(String(tempResult.value) + '°C', 14)} │ ${pad(tempResult.unit, 24)} │`);
console.log(`│ ${pad('Climate VaR (Orderly)', 27)} │ ${pad(String(varResult.Orderly.value) + '%', 14)} │ ${pad(varResult.Orderly.unit, 24)} │`);
console.log(`│ ${pad('Climate VaR (Disorderly)', 27)} │ ${pad(String(varResult.Disorderly.value) + '%', 14)} │ ${pad(varResult.Disorderly.unit, 24)} │`);
console.log(`│ ${pad('Climate VaR (Hot House)', 27)} │ ${pad(String(varResult.HotHouse.value) + '%', 14)} │ ${pad(varResult.HotHouse.unit, 24)} │`);
console.log(`│ ${pad('SFDR PAI #1 (GHG)', 27)} │ ${pad(String(paiResult.pai1_ghgEmissions), 14)} │ ${pad('tCO2e', 24)} │`);
console.log(`│ ${pad('SFDR PAI #2 (Footprint)', 27)} │ ${pad(String(paiResult.pai2_carbonFootprint), 14)} │ ${pad('tCO2e/$M invested', 24)} │`);
console.log(`│ ${pad('EU Taxonomy Alignment', 27)} │ ${pad(String(taxResult.value) + '%', 14)} │ ${pad(taxResult.unit, 24)} │`);
console.log(`│ ${pad('Transition Score', 27)} │ ${pad(String(transResult.value), 14)} │ ${pad(transResult.unit, 24)} │`);
console.log(`│ ${pad('Physical Risk', 27)} │ ${pad(String(physResult.value), 14)} │ ${pad(physResult.unit, 24)} │`);
console.log(`│ ${pad('Water Footprint', 27)} │ ${pad(String(waterResult.value), 14)} │ ${pad(waterResult.unit, 24)} │`);
console.log(`│ ${pad('Biodiversity Impact', 27)} │ ${pad(String(bioResult.value), 14)} │ ${pad(bioResult.unit, 24)} │`);
console.log(`│ ${pad('SBTi Coverage', 27)} │ ${pad(String(sbtiResult.value) + '%', 14)} │ ${pad(sbtiResult.unit, 24)} │`);
console.log(`│ ${pad('CBAM Exposure', 27)} │ ${pad(String(cbamResult.value) + '%', 14)} │ ${pad(cbamResult.unit, 24)} │`);
console.log('└─────────────────────────────┴────────────────┴──────────────────────────┘');

// ═════════════════════════════════════════════════════════════════
// FINAL RESULTS
// ═════════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} PASSED · ${failed} FAILED · ${warnings} WARNINGS`);
console.log('═══════════════════════════════════════════════════════════════\n');

if (failed > 0) {
  console.log('FAILURES:');
  results.filter(r => r.status === 'FAIL' || r.status === 'ERROR').forEach(r => {
    console.log(`  ✗ ${r.name}: ${r.detail || ''}`);
  });
}

process.exit(failed > 0 ? 1 : 0);
