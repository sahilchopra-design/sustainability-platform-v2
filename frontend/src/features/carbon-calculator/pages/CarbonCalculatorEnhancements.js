/**
 * CarbonCalculatorEnhancements.js
 *
 * Companion module for CarbonCalculatorPage.jsx
 * Exports reusable functions and data for:
 *   1. Data Validation Engine
 *   2. Pre-filled Industry Templates
 *   3. Data Upload Handler
 *   4. Interconnectivity Hooks (export/import to other platform modules)
 *   5. Documentation Panel Content (GHG Protocol citations)
 *   6. Real-Time Cross-Validation Checks
 *
 * All exports are named so the main page can cherry-pick what it needs:
 *   import { validateGHGInventory, PREFILLED_TEMPLATES, ... } from './CarbonCalculatorEnhancements';
 */

// ---------------------------------------------------------------------------
// 1. DATA VALIDATION ENGINE
// ---------------------------------------------------------------------------

/**
 * Validate the full GHG inventory before calculation.
 * @returns {{ valid: boolean, errors: object[], warnings: object[], completeness: number }}
 */
export function validateGHGInventory(scope1Entries, scope2Entries, scope3Categories) {
  const errors = [];
  const warnings = [];

  // --- Scope 1 ---
  (scope1Entries || []).forEach((entry, i) => {
    if (!entry.fuelType)
      errors.push({ scope: 1, row: i, field: 'fuelType', msg: 'Fuel type required' });
    if (!entry.quantity || entry.quantity <= 0)
      errors.push({ scope: 1, row: i, field: 'quantity', msg: 'Positive quantity required' });
    if (entry.quantity > 1e9)
      warnings.push({ scope: 1, row: i, field: 'quantity', msg: 'Unusually large quantity - verify units' });
    if (entry.fuelType === 'natural_gas' && entry.unit === 'litres')
      warnings.push({ scope: 1, row: i, msg: 'Natural gas typically measured in m3 or kWh, not litres' });
    if (entry.fuelType === 'diesel' && entry.unit === 'kWh')
      warnings.push({ scope: 1, row: i, msg: 'Diesel typically measured in litres or tonnes, not kWh' });
    if (!entry.unit)
      errors.push({ scope: 1, row: i, field: 'unit', msg: 'Unit of measure required' });
  });

  // --- Scope 2 ---
  (scope2Entries || []).forEach((entry, i) => {
    if (!entry.country)
      errors.push({ scope: 2, row: i, field: 'country', msg: 'Country required for grid intensity lookup' });
    if (!entry.consumption || entry.consumption <= 0)
      errors.push({ scope: 2, row: i, field: 'consumption', msg: 'Electricity consumption required (kWh)' });
    if (entry.consumption > 1e10)
      warnings.push({ scope: 2, row: i, field: 'consumption', msg: 'Consumption >10 TWh - verify this is not a national figure' });
    if (entry.marketBased && !entry.instrument)
      warnings.push({ scope: 2, row: i, msg: 'No contractual instrument specified - market-based will default to residual mix factor' });
    if (entry.greenPct && (entry.greenPct < 0 || entry.greenPct > 100))
      errors.push({ scope: 2, row: i, field: 'greenPct', msg: 'Green percentage must be 0-100' });
  });

  // --- Scope 3 completeness ---
  const cats = scope3Categories || [];
  const enabledCategories = cats.filter((c) => c.enabled);
  if (enabledCategories.length === 0) {
    warnings.push({ scope: 3, msg: 'No Scope 3 categories enabled. GHG Protocol requires assessment of all 15 categories.' });
  } else if (enabledCategories.length < 3) {
    warnings.push({
      scope: 3,
      msg: `Only ${enabledCategories.length} Scope 3 categories enabled. GHG Protocol recommends assessing all 15 for completeness.`,
    });
  }

  // Check for common missing categories
  const COMMON_MATERIAL = ['cat1', 'cat6', 'cat7', 'cat11'];
  COMMON_MATERIAL.forEach((key) => {
    const cat = cats.find((c) => c.key === key || c.id === key);
    if (cat && !cat.enabled) {
      warnings.push({ scope: 3, category: key, msg: `${key} is typically material for most sectors but is disabled` });
    }
  });

  // Validate enabled category data
  enabledCategories.forEach((cat) => {
    if (cat.method === 'spend' && (!cat.spend || cat.spend <= 0))
      errors.push({ scope: 3, category: cat.key || cat.id, msg: 'Spend-based method requires positive spend value' });
    if (cat.method === 'activity' && !cat.activityData && !cat.quantity)
      warnings.push({ scope: 3, category: cat.key || cat.id, msg: 'Activity-based method selected but no activity data provided' });
  });

  const completeness = calculateCompleteness(scope1Entries, scope2Entries, cats);

  return { valid: errors.length === 0, errors, warnings, completeness };
}

/**
 * Data completeness score 0-100 %.
 * Weights: Scope 1 = 20 %, Scope 2 = 20 %, Scope 3 = 60 % (15 categories x 4 % each).
 */
export function calculateCompleteness(s1, s2, s3) {
  let score = 0;

  // Scope 1 completeness (20 pts)
  if (s1 && s1.length > 0) {
    const filledRows = s1.filter((e) => e.fuelType && e.quantity > 0 && e.unit).length;
    score += Math.min(20, (filledRows / Math.max(s1.length, 1)) * 20);
  }

  // Scope 2 completeness (20 pts)
  if (s2 && s2.length > 0) {
    const filledRows = s2.filter((e) => e.country && e.consumption > 0).length;
    score += Math.min(20, (filledRows / Math.max(s2.length, 1)) * 20);
  }

  // Scope 3 completeness (60 pts, 4 pts per category)
  const TOTAL_CATS = 15;
  if (s3 && s3.length > 0) {
    const enabledWithData = s3.filter((c) => c.enabled && (c.spend > 0 || c.quantity > 0 || c.activityData)).length;
    score += (enabledWithData / TOTAL_CATS) * 60;
  }

  return Math.round(Math.min(100, score));
}

/**
 * Validate a single emission factor selection.
 */
export function validateEmissionFactor(entry) {
  const issues = [];
  if (!entry.efSource)
    issues.push({ field: 'efSource', msg: 'Emission factor source not specified (e.g., DEFRA, EPA, IPCC)' });
  if (!entry.efYear)
    issues.push({ field: 'efYear', msg: 'Emission factor year not specified - should match reporting year' });
  if (entry.efYear && entry.reportingYear && Math.abs(entry.efYear - entry.reportingYear) > 2)
    issues.push({ field: 'efYear', msg: 'Emission factor is >2 years from reporting year - consider updating' });
  if (entry.efValue <= 0)
    issues.push({ field: 'efValue', msg: 'Emission factor must be positive' });
  return { valid: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// 2. PREFILLED DATA TEMPLATES
// ---------------------------------------------------------------------------

export const PREFILLED_TEMPLATES = {
  'Financial Services Bank': {
    description: 'Typical Tier 1 bank with 50K employees, global operations',
    sector: 'Financial Services',
    revenue: 25000000000,
    employees: 50000,
    scope1: [
      { source: 'Office HVAC (natural gas)', fuelType: 'natural_gas', quantity: 2500000, unit: 'kWh', facility: 'London HQ' },
      { source: 'Backup generators (diesel)', fuelType: 'diesel', quantity: 15000, unit: 'litres', facility: 'Data Centre' },
      { source: 'Company fleet (petrol)', fuelType: 'petrol_car', quantity: 850000, unit: 'km', facility: 'UK Fleet' },
      { source: 'Refrigerant leaks (R-410A)', fuelType: 'refrigerant_r410a', quantity: 45, unit: 'kg', facility: 'All offices' },
    ],
    scope2: [
      { facility: 'London HQ', country: 'GB', consumption: 8500000, unit: 'kWh', marketInstrument: 'REGO', greenPct: 60 },
      { facility: 'New York Office', country: 'US', consumption: 4200000, unit: 'kWh', marketInstrument: 'REC', greenPct: 100 },
      { facility: 'Mumbai Office', country: 'IN', consumption: 1800000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Singapore Hub', country: 'SG', consumption: 2100000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 450000000, sector: 'professional_services' },
      cat2: { enabled: true, method: 'spend', spend: 85000000, sector: 'it_equipment' },
      cat3: { enabled: true, method: 'activity', note: 'Upstream of Scope 2 (T&D losses)' },
      cat5: { enabled: true, method: 'activity', waste: 2400, unit: 'tonnes', disposalMix: { landfill: 0.15, recycling: 0.65, incineration: 0.20 } },
      cat6: { enabled: true, method: 'activity', flights: { shortHaul: 12000000, longHaul: 28000000, unit: 'pkm' }, hotels: 45000 },
      cat7: { enabled: true, method: 'activity', employees: 50000, avgCommute: 25, unit: 'km', workDays: 230, modeMix: { car: 0.35, train: 0.40, bus: 0.10, wfh: 0.15 } },
      cat8: { enabled: false },
      cat9: { enabled: false },
      cat10: { enabled: false },
      cat11: { enabled: false },
      cat12: { enabled: false },
      cat13: { enabled: true, method: 'activity', leasedAssets: 12, totalFloorArea: 85000, unit: 'sqm' },
      cat14: { enabled: false },
      cat15: { enabled: true, method: 'pcaf', note: 'Links to PCAF Financed Emissions module', totalFinanced: 847000 },
    },
  },

  'Oil & Gas Major': {
    description: 'Integrated O&G company with upstream + downstream operations',
    sector: 'Oil & Gas',
    revenue: 180000000000,
    employees: 72000,
    scope1: [
      { source: 'Upstream flaring', fuelType: 'natural_gas_flaring', quantity: 450000000, unit: 'kWh', facility: 'North Sea' },
      { source: 'Refinery process', fuelType: 'refinery_fuel_gas', quantity: 1200000000, unit: 'kWh', facility: 'Rotterdam Refinery' },
      { source: 'Fugitive methane', fuelType: 'methane_fugitive', quantity: 8500, unit: 'tonnes_CH4', facility: 'All upstream' },
      { source: 'Marine fleet', fuelType: 'marine_hfo', quantity: 85000, unit: 'tonnes', facility: 'Shipping fleet' },
      { source: 'Drilling operations', fuelType: 'diesel', quantity: 42000000, unit: 'litres', facility: 'Global drilling' },
    ],
    scope2: [
      { facility: 'Rotterdam Refinery', country: 'NL', consumption: 320000000, unit: 'kWh', marketInstrument: 'GO', greenPct: 25 },
      { facility: 'Houston HQ', country: 'US', consumption: 15000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Petrochemicals Complex', country: 'SA', consumption: 480000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 32000000000, sector: 'oilfield_services' },
      cat4: { enabled: true, method: 'activity', note: 'Crude oil transportation', tonneKm: 45000000000 },
      cat9: { enabled: true, method: 'activity', note: 'Product distribution to retail', tonneKm: 12000000000 },
      cat11: { enabled: true, method: 'activity', note: 'Use of sold products - dominant category', soldVolume: 650000000, unit: 'barrels_oil_equivalent' },
    },
  },

  'Technology Company': {
    description: 'Global SaaS/cloud company with data centres and 25K employees',
    sector: 'Technology',
    revenue: 15000000000,
    employees: 25000,
    scope1: [
      { source: 'Office heating (gas)', fuelType: 'natural_gas', quantity: 800000, unit: 'kWh', facility: 'SF Campus' },
      { source: 'Backup generators', fuelType: 'diesel', quantity: 45000, unit: 'litres', facility: 'Data Centres (3)' },
      { source: 'Refrigerant losses', fuelType: 'refrigerant_r134a', quantity: 120, unit: 'kg', facility: 'Data Centres' },
    ],
    scope2: [
      { facility: 'Data Centre - Virginia', country: 'US', consumption: 185000000, unit: 'kWh', marketInstrument: 'PPA', greenPct: 100 },
      { facility: 'Data Centre - Dublin', country: 'IE', consumption: 95000000, unit: 'kWh', marketInstrument: 'GO', greenPct: 100 },
      { facility: 'Data Centre - Singapore', country: 'SG', consumption: 72000000, unit: 'kWh', marketInstrument: 'REC', greenPct: 50 },
      { facility: 'SF Campus', country: 'US', consumption: 12000000, unit: 'kWh', marketInstrument: 'REC', greenPct: 100 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 2800000000, sector: 'it_hardware_services' },
      cat2: { enabled: true, method: 'spend', spend: 1200000000, sector: 'servers_networking' },
      cat6: { enabled: true, method: 'activity', flights: { shortHaul: 5000000, longHaul: 18000000, unit: 'pkm' }, hotels: 28000 },
      cat7: { enabled: true, method: 'activity', employees: 25000, avgCommute: 20, unit: 'km', workDays: 230, modeMix: { car: 0.25, train: 0.15, bus: 0.05, wfh: 0.55 } },
      cat11: { enabled: true, method: 'activity', note: 'Customer use of cloud services', customerElectricity: 450000000, unit: 'kWh' },
    },
  },

  'Manufacturing (Cement)': {
    description: 'Cement manufacturer with 3 kilns, 5Mt annual output',
    sector: 'Cement',
    revenue: 4500000000,
    employees: 8500,
    scope1: [
      { source: 'Calcination process CO2', fuelType: 'process_calcination', quantity: 2750000, unit: 'tonnes_CO2', facility: 'All kilns' },
      { source: 'Kiln fuel (coal)', fuelType: 'coal', quantity: 650000, unit: 'tonnes', facility: 'Kiln 1-3' },
      { source: 'Kiln fuel (pet coke)', fuelType: 'pet_coke', quantity: 180000, unit: 'tonnes', facility: 'Kiln 2' },
      { source: 'Alternative fuels (waste)', fuelType: 'waste_derived_fuel', quantity: 95000, unit: 'tonnes', facility: 'Kiln 3' },
      { source: 'On-site vehicles', fuelType: 'diesel', quantity: 1200000, unit: 'litres', facility: 'All sites' },
    ],
    scope2: [
      { facility: 'Plant 1 - Germany', country: 'DE', consumption: 85000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Plant 2 - India', country: 'IN', consumption: 120000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Plant 3 - Brazil', country: 'BR', consumption: 65000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 1800000000, sector: 'mining_raw_materials' },
      cat4: { enabled: true, method: 'activity', tonneKm: 2500000000, note: 'Upstream raw material transport' },
      cat9: { enabled: true, method: 'activity', tonneKm: 800000000, note: 'Cement distribution to customers' },
    },
  },

  'Retail Chain': {
    description: 'Large grocery/retail chain with 2,000 stores, 150K employees',
    sector: 'Retail',
    revenue: 85000000000,
    employees: 150000,
    scope1: [
      { source: 'Store heating (gas)', fuelType: 'natural_gas', quantity: 450000000, unit: 'kWh', facility: 'All stores' },
      { source: 'Refrigerant losses', fuelType: 'refrigerant_r404a', quantity: 12000, unit: 'kg', facility: 'All stores' },
      { source: 'Delivery fleet (diesel)', fuelType: 'diesel', quantity: 28000000, unit: 'litres', facility: 'Distribution' },
      { source: 'Delivery fleet (LNG)', fuelType: 'lng', quantity: 5000000, unit: 'kg', facility: 'Long-haul distribution' },
    ],
    scope2: [
      { facility: 'All UK stores (1,200)', country: 'GB', consumption: 1800000000, unit: 'kWh', marketInstrument: 'REGO', greenPct: 80 },
      { facility: 'Distribution centres (15)', country: 'GB', consumption: 250000000, unit: 'kWh', marketInstrument: 'REGO', greenPct: 80 },
      { facility: 'European stores (800)', country: 'DE', consumption: 900000000, unit: 'kWh', marketInstrument: 'GO', greenPct: 40 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 62000000000, sector: 'food_agriculture' },
      cat4: { enabled: true, method: 'activity', tonneKm: 18000000000 },
      cat5: { enabled: true, method: 'activity', waste: 180000, unit: 'tonnes', disposalMix: { landfill: 0.05, recycling: 0.60, composting: 0.25, incineration: 0.10 } },
      cat7: { enabled: true, method: 'activity', employees: 150000, avgCommute: 12, unit: 'km', workDays: 250, modeMix: { car: 0.55, bus: 0.20, cycling: 0.10, walk: 0.15 } },
      cat12: { enabled: true, method: 'activity', note: 'End-of-life of sold food products', waste: 450000, unit: 'tonnes' },
    },
  },

  'Real Estate Fund': {
    description: 'Commercial real estate fund managing 45 buildings',
    sector: 'Real Estate',
    revenue: 2200000000,
    employees: 350,
    scope1: [
      { source: 'Building heating (gas)', fuelType: 'natural_gas', quantity: 85000000, unit: 'kWh', facility: 'All buildings' },
      { source: 'Refrigerant losses', fuelType: 'refrigerant_r410a', quantity: 280, unit: 'kg', facility: 'All buildings' },
      { source: 'Emergency generators', fuelType: 'diesel', quantity: 25000, unit: 'litres', facility: 'All buildings' },
    ],
    scope2: [
      { facility: 'UK Portfolio (20 buildings)', country: 'GB', consumption: 120000000, unit: 'kWh', marketInstrument: 'REGO', greenPct: 100 },
      { facility: 'US Portfolio (15 buildings)', country: 'US', consumption: 95000000, unit: 'kWh', marketInstrument: 'REC', greenPct: 50 },
      { facility: 'EU Portfolio (10 buildings)', country: 'DE', consumption: 65000000, unit: 'kWh', marketInstrument: 'GO', greenPct: 75 },
    ],
    scope3: {
      cat13: { enabled: true, method: 'activity', note: 'Tenant energy use (downstream leased assets)', tenantElectricity: 280000000, tenantGas: 45000000, unit: 'kWh' },
    },
  },

  'Utility (Power Generation)': {
    description: 'Mixed generation utility: gas, coal, wind, solar',
    sector: 'Utilities',
    revenue: 32000000000,
    employees: 18000,
    scope1: [
      { source: 'Gas-fired generation', fuelType: 'natural_gas', quantity: 28000000000, unit: 'kWh_input', facility: 'CCGT fleet' },
      { source: 'Coal-fired generation', fuelType: 'coal', quantity: 3200000, unit: 'tonnes', facility: 'Coal stations (2)' },
      { source: 'Fugitive SF6', fuelType: 'sf6', quantity: 850, unit: 'kg', facility: 'Grid substations' },
    ],
    scope2: [
      { facility: 'Office and operational sites', country: 'GB', consumption: 45000000, unit: 'kWh', marketInstrument: 'REGO', greenPct: 100 },
    ],
    scope3: {
      cat3: { enabled: true, method: 'activity', note: 'Upstream fuel supply chain' },
      cat11: { enabled: true, method: 'activity', note: 'Customers burning gas sold to them', gasSold: 15000000000, unit: 'kWh' },
    },
  },

  'Automotive OEM': {
    description: 'Car manufacturer producing 4M vehicles/year',
    sector: 'Automotive',
    revenue: 120000000000,
    employees: 180000,
    scope1: [
      { source: 'Paint shop (gas)', fuelType: 'natural_gas', quantity: 2800000000, unit: 'kWh', facility: 'All plants' },
      { source: 'Foundry operations', fuelType: 'natural_gas', quantity: 1500000000, unit: 'kWh', facility: 'Engine plants' },
      { source: 'On-site logistics', fuelType: 'diesel', quantity: 8500000, unit: 'litres', facility: 'All plants' },
      { source: 'Testing facilities', fuelType: 'petrol', quantity: 3200000, unit: 'litres', facility: 'R&D centres' },
    ],
    scope2: [
      { facility: 'Main Assembly (Germany)', country: 'DE', consumption: 1200000000, unit: 'kWh', marketInstrument: 'GO', greenPct: 80 },
      { facility: 'Engine Plant (Hungary)', country: 'HU', consumption: 350000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Assembly (China)', country: 'CN', consumption: 800000000, unit: 'kWh', marketInstrument: null, greenPct: 0 },
      { facility: 'Assembly (US)', country: 'US', consumption: 600000000, unit: 'kWh', marketInstrument: 'REC', greenPct: 50 },
    ],
    scope3: {
      cat1: { enabled: true, method: 'spend', spend: 85000000000, sector: 'automotive_parts' },
      cat4: { enabled: true, method: 'activity', tonneKm: 35000000000 },
      cat9: { enabled: true, method: 'activity', tonneKm: 8000000000 },
      cat11: { enabled: true, method: 'activity', note: 'Use of sold vehicles (dominant)', vehiclesSold: 4000000, avgLifetimeKm: 200000, avgEmissionsFactor: 0.00012 },
      cat12: { enabled: true, method: 'activity', note: 'End-of-life vehicle recycling/shredding', vehicleWeight: 1500, vehiclesSold: 4000000 },
    },
  },
};

// ---------------------------------------------------------------------------
// 3. DATA UPLOAD HANDLER
// ---------------------------------------------------------------------------

/**
 * Parse uploaded emission data from CSV, CDP, or GHG Protocol template format.
 */
export function parseUploadedEmissionData(fileContent, fileType) {
  if (fileType === 'csv') return parseCSV(fileContent);
  if (fileType === 'cdp') return parseCDPFormat(fileContent);
  if (fileType === 'ghgp') return parseGHGPTemplate(fileContent);
  return { error: `Unsupported file format: ${fileType}. Accepted: csv, cdp, ghgp` };
}

function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { error: 'CSV must have a header row and at least one data row' };

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
  const requiredHeaders = ['source', 'fuel_type', 'quantity', 'unit', 'scope'];
  const missing = requiredHeaders.filter((h) => !headers.includes(h));
  if (missing.length > 0) return { error: `Missing required columns: ${missing.join(', ')}` };

  const scope1 = [];
  const scope2 = [];
  const scope3 = [];
  const parseErrors = [];

  lines.slice(1).forEach((line, idx) => {
    const cols = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim(); });

    const qty = parseFloat(row.quantity);
    if (isNaN(qty)) {
      parseErrors.push({ row: idx + 2, msg: `Invalid quantity: "${row.quantity}"` });
      return;
    }

    const entry = {
      source: row.source,
      fuelType: row.fuel_type,
      quantity: qty,
      unit: row.unit,
      facility: row.facility || '',
      notes: row.notes || '',
    };

    const scope = parseInt(row.scope, 10);
    if (scope === 1) scope1.push(entry);
    else if (scope === 2) scope2.push({ ...entry, country: row.country || '', consumption: qty });
    else if (scope === 3) scope3.push({ ...entry, category: row.category || '' });
    else parseErrors.push({ row: idx + 2, msg: `Invalid scope: "${row.scope}"` });
  });

  return {
    scope1,
    scope2,
    scope3,
    parseErrors,
    summary: `Parsed ${scope1.length} Scope 1, ${scope2.length} Scope 2, ${scope3.length} Scope 3 entries`,
  };
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

function parseCDPFormat(content) {
  // CDP questionnaire structure: C6.1 (Scope 1), C6.3 (Scope 2), C6.5 (Scope 3)
  const sections = {};
  let currentSection = null;

  content.split('\n').forEach((line) => {
    if (line.startsWith('C6.1')) currentSection = 'scope1';
    else if (line.startsWith('C6.3')) currentSection = 'scope2';
    else if (line.startsWith('C6.5')) currentSection = 'scope3';
    if (currentSection && line.trim() && !line.startsWith('C6.')) {
      if (!sections[currentSection]) sections[currentSection] = [];
      sections[currentSection].push(line.trim());
    }
  });

  return {
    scope1: (sections.scope1 || []).map(parseCDPRow),
    scope2: (sections.scope2 || []).map(parseCDPRow),
    scope3: (sections.scope3 || []).map(parseCDPRow),
    format: 'cdp',
    note: 'Parsed from CDP disclosure format (C6.x sections)',
  };
}

function parseCDPRow(line) {
  const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
  return {
    source: parts[0] || '',
    fuelType: parts[1] || '',
    quantity: parseFloat(parts[2]) || 0,
    unit: parts[3] || '',
    facility: parts[4] || '',
  };
}

function parseGHGPTemplate(content) {
  // GHG Protocol corporate standard Excel export (tab-delimited)
  const lines = content.split('\n');
  const scope1 = [];
  const scope2 = [];
  let section = null;

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (lower.includes('scope 1') || lower.includes('direct emissions')) section = 'scope1';
    else if (lower.includes('scope 2') || lower.includes('indirect emissions')) section = 'scope2';
    else if (section && line.trim()) {
      const parts = line.split('\t');
      if (parts.length >= 4 && !isNaN(parseFloat(parts[2]))) {
        const entry = { source: parts[0], fuelType: parts[1], quantity: parseFloat(parts[2]), unit: parts[3], facility: parts[4] || '' };
        if (section === 'scope1') scope1.push(entry);
        else scope2.push({ ...entry, country: parts[5] || '', consumption: parseFloat(parts[2]) });
      }
    }
  });

  return { scope1, scope2, scope3: [], format: 'ghgp', note: 'Parsed from GHG Protocol Excel template format' };
}

/**
 * Generate downloadable CSV templates for data collection.
 */
export function generateDataCollectionTemplate(templateType) {
  const templates = {
    scope1:
      'Source,Fuel Type,Quantity,Unit,Facility,Notes\n' +
      'Office Heating,natural_gas,,,London HQ,"Enter kWh or m3"\n' +
      'Backup Generator,diesel,,,Data Centre,"Enter litres"\n' +
      'Company Fleet,petrol_car,,,UK Fleet,"Enter km or litres"\n' +
      'Refrigerant Losses,refrigerant_r410a,,,All Offices,"Enter kg of refrigerant topped up"\n',
    scope2:
      'Facility,Country (ISO 2-letter),Electricity (kWh),Market Instrument (REGO/REC/GO/PPA/none),Green %,Notes\n' +
      'Main Office,GB,,,,\n' +
      'Data Centre,US,,,,\n',
    scope3_cat1:
      'Supplier,Spend (USD),Sector/Category,Country,Emission Factor Source,Notes\n' +
      'Supplier A,,professional_services,GB,,\n',
    scope3_cat6:
      'Trip Type,Distance (km),Mode (air_short/air_long/rail/car/bus),Passengers,Class (economy/business/first),Notes\n' +
      'Conference,,,1,,\n',
    scope3_cat7:
      'Employee Group,Count,Avg Commute (km),Work Days/Year,Car %,Train %,Bus %,WFH %,Notes\n' +
      'Office Staff,,,230,,,,,\n',
    full_inventory:
      'Scope,Source,Fuel Type,Quantity,Unit,Facility,Country,Category (for S3),Notes\n' +
      '1,Office Heating,natural_gas,,,London HQ,GB,,\n' +
      '2,Main Office,,,,Main Office,GB,,\n' +
      '3,Business Travel,,,,,"Cat 6 flights",\n',
  };
  return templates[templateType] || templates.full_inventory;
}

// ---------------------------------------------------------------------------
// 4. INTERCONNECTIVITY HOOKS
// ---------------------------------------------------------------------------

/**
 * Export GHG inventory in formats consumable by other platform modules.
 */
export function exportToModule(inventory, targetModule) {
  const base = {
    year: inventory.year,
    scope1Total: inventory.scope1Total || 0,
    scope2Location: inventory.scope2Location || 0,
    scope2Market: inventory.scope2Market || 0,
    scope3Total: inventory.scope3Total || 0,
    total: inventory.total || 0,
  };

  switch (targetModule) {
    case 'pcaf':
      return {
        ...base,
        intensity: inventory.intensity || 0,
        dqs: inventory.avgDqs || 3,
        sectorClassification: inventory.sector,
        scope3Cat15: inventory.scope3?.cat15?.totalFinanced || 0,
      };

    case 'sbti':
      return {
        baseYear: inventory.year,
        baseEmissions: base.total,
        scope1Pct: base.total > 0 ? (base.scope1Total / base.total) * 100 : 0,
        scope2Pct: base.total > 0 ? (base.scope2Location / base.total) * 100 : 0,
        scope3Pct: base.total > 0 ? (base.scope3Total / base.total) * 100 : 0,
        sectorPathway: inventory.sector,
        coverageScope1: 100,
        coverageScope2: 100,
      };

    case 'csrd_e1':
      return {
        e1_6_01: base.scope1Total,
        e1_6_02: base.scope2Location,
        e1_6_03: base.scope2Market,
        e1_6_04: base.scope3Total,
        e1_6_05: base.scope1Total + base.scope2Location + base.scope3Total,
        e1_7_revenue: inventory.intensityRevenue || 0,
        e1_7_employee: inventory.intensityEmployee || 0,
        reportingYear: inventory.year,
        consolidationApproach: inventory.consolidation || 'operational_control',
      };

    case 'sfdr_pai':
      return {
        pai1_scope1: base.scope1Total,
        pai1_scope2: base.scope2Location,
        pai1_scope3: base.scope3Total,
        pai1_total: base.total,
        pai2_carbonFootprint: inventory.carbonFootprint || 0,
        pai3_ghgIntensity: inventory.intensityRevenue || 0,
        reportingPeriod: inventory.year,
      };

    case 'temperature':
      return {
        currentEmissions: base.total,
        baseYear: inventory.year,
        trajectorySlope: inventory.trajectorySlope || null,
        sectorBenchmark: inventory.sector,
        scope1Share: base.total > 0 ? base.scope1Total / base.total : 0,
      };

    case 'cbam':
      return {
        embeddedEmissions: inventory.scope1ByProduct || {},
        directEmissions: base.scope1Total,
        indirectEmissions: base.scope2Location,
        coveredProducts: filterCBAMProducts(inventory),
        reportingYear: inventory.year,
      };

    case 'tcfd':
      return {
        totalEmissions: base.total,
        scope1: base.scope1Total,
        scope2: base.scope2Location,
        scope3: base.scope3Total,
        intensity: inventory.intensityRevenue || 0,
        year: inventory.year,
        trend: inventory.prevYear ? ((base.total - inventory.prevYear) / inventory.prevYear) * 100 : null,
      };

    default:
      return base;
  }
}

function filterCBAMProducts(inventory) {
  const CBAM_SECTORS = ['cement', 'iron_steel', 'aluminium', 'fertilisers', 'electricity', 'hydrogen'];
  if (!inventory.products) return [];
  return inventory.products.filter((p) => CBAM_SECTORS.includes(p.sector?.toLowerCase()));
}

/**
 * Import data FROM other platform modules into the GHG inventory.
 */
export function importFromModule(sourceModule, data) {
  switch (sourceModule) {
    case 'pcaf':
      // Import EVIC data for Scope 3 Cat 15 financed emissions
      return {
        target: 'scope3.cat15',
        fields: {
          totalFinanced: data.totalFinancedEmissions,
          assetClasses: data.assetClassBreakdown,
          dqs: data.overallDqs,
          method: 'pcaf',
        },
      };

    case 'real_estate':
      // Import building energy data for Scope 2
      return {
        target: 'scope2',
        entries: (data.buildings || []).map((b) => ({
          facility: b.name,
          country: b.country,
          consumption: b.electricityKwh,
          unit: 'kWh',
          gasConsumption: b.gasKwh,
          marketInstrument: b.greenCertificate || null,
          greenPct: b.renewablePct || 0,
        })),
      };

    case 'supply_chain':
      // Import supply chain data for Scope 3 Cat 1/4
      return {
        target: 'scope3.cat1',
        fields: {
          totalSpend: data.totalProcurement,
          supplierBreakdown: data.supplierEmissions,
          method: data.hasSupplierData ? 'hybrid' : 'spend',
        },
      };

    case 'travel':
      // Import travel data for Scope 3 Cat 6
      return {
        target: 'scope3.cat6',
        fields: {
          flights: data.flightData,
          hotels: data.hotelNights,
          rail: data.railKm,
          method: 'activity',
        },
      };

    case 'fleet':
      // Import fleet data for Scope 1 mobile combustion
      return {
        target: 'scope1',
        entries: (data.vehicles || []).map((v) => ({
          source: `Fleet: ${v.type}`,
          fuelType: v.fuelType,
          quantity: v.totalDistance || v.fuelConsumed,
          unit: v.unit,
          facility: v.region || 'Fleet',
        })),
      };

    default:
      return { error: `No import handler for module: ${sourceModule}` };
  }
}

// ---------------------------------------------------------------------------
// 5. DOCUMENTATION PANEL CONTENT
// ---------------------------------------------------------------------------

export const DOCUMENTATION = {
  scope1: {
    title: 'Scope 1: Direct GHG Emissions',
    standard: 'GHG Protocol Corporate Standard, Chapter 4',
    definition: 'Direct GHG emissions from sources owned or controlled by the company.',
    categories: [
      { name: 'Stationary Combustion', ref: 'Ch 4, Table 4.1', examples: 'Boilers, furnaces, turbines, heaters, incinerators, engines, flares' },
      { name: 'Mobile Combustion', ref: 'Ch 4, Table 4.2', examples: 'Trucks, trains, ships, airplanes, buses, cars owned/controlled by company' },
      { name: 'Process Emissions', ref: 'Ch 4, Table 4.3', examples: 'Cement clinker, aluminium smelting, adipic acid, ammonia production' },
      { name: 'Fugitive Emissions', ref: 'Ch 4, Table 4.4', examples: 'Equipment leaks (CH4), coal mining, wastewater treatment, refrigerant losses (HFCs)' },
    ],
    methodology: 'Activity Data x Emission Factor = GHG Emissions (tCO2e)',
    commonErrors: [
      'Mixing fuel units (litres vs m3 vs kWh)',
      'Forgetting to apply GWP for non-CO2 gases (CH4, N2O, HFCs, SF6)',
      'Double-counting process emissions already in fuel combustion data',
      'Missing refrigerant leaks from HVAC systems (often >10% of Scope 1 for offices)',
      'Using gross CV instead of net CV (or vice versa) without adjusting factors',
    ],
    qualityChecks: [
      'Scope 1 should be <10% of total for service companies, >50% for heavy industry',
      'Mobile combustion typically 5-15% of Scope 1 for office-based companies',
      'Fugitive emissions often underestimated - cross-check with refrigerant purchase records',
      'Process emissions dominate for cement (60%), aluminium (30%), chemicals (40%)',
    ],
  },

  scope2: {
    title: 'Scope 2: Indirect Energy Emissions',
    standard: 'GHG Protocol Scope 2 Guidance (2015)',
    definition: 'Indirect GHG emissions from purchased electricity, steam, heating, and cooling.',
    methods: [
      { name: 'Location-based', description: 'Uses average grid emission factor for the geographic location where electricity is consumed', ref: 'Scope 2 Guidance, Ch 6.2' },
      { name: 'Market-based', description: 'Uses emission factor from contractual instruments (RECs, GOs, PPAs, green tariffs)', ref: 'Scope 2 Guidance, Ch 6.3' },
    ],
    instruments: [
      { name: 'REGO', region: 'UK', description: 'Renewable Energy Guarantee of Origin' },
      { name: 'GO', region: 'EU', description: 'Guarantee of Origin (EU Directive 2009/28/EC)' },
      { name: 'REC', region: 'US', description: 'Renewable Energy Certificate' },
      { name: 'I-REC', region: 'Global', description: 'International REC for markets without local tracking' },
      { name: 'PPA', region: 'Global', description: 'Power Purchase Agreement (direct offtake)' },
    ],
    commonErrors: [
      'Using only location-based (GHG Protocol requires dual reporting)',
      'Claiming 100% renewable without valid contractual instruments',
      'Applying wrong country grid factor (check IEA/Ember for latest)',
      'Forgetting district heating and cooling',
      'Not accounting for T&D losses in Scope 3 Cat 3',
    ],
    qualityChecks: [
      'Market-based should be <= location-based (unless residual mix > average grid)',
      'Check that renewable claims match actual instrument purchases',
      'Large discrepancy between methods may indicate data quality issues',
    ],
  },

  scope3: {
    title: 'Scope 3: Other Indirect Emissions',
    standard: 'GHG Protocol Corporate Value Chain (Scope 3) Standard, 2011',
    definition: 'All other indirect emissions in a company\'s value chain, both upstream and downstream.',
    categories: [
      { num: 1, name: 'Purchased Goods & Services', direction: 'Upstream', typical: '30-80% of Scope 3 for services/retail' },
      { num: 2, name: 'Capital Goods', direction: 'Upstream', typical: '5-20% for capex-heavy sectors' },
      { num: 3, name: 'Fuel & Energy Related Activities', direction: 'Upstream', typical: '3-8% (T&D losses, upstream of fuels)' },
      { num: 4, name: 'Upstream Transportation', direction: 'Upstream', typical: '3-10% for manufacturers' },
      { num: 5, name: 'Waste Generated in Operations', direction: 'Upstream', typical: '<2% for most sectors' },
      { num: 6, name: 'Business Travel', direction: 'Upstream', typical: '1-5% for services, <1% for industry' },
      { num: 7, name: 'Employee Commuting', direction: 'Upstream', typical: '1-3% for office-based companies' },
      { num: 8, name: 'Upstream Leased Assets', direction: 'Upstream', typical: 'Depends on leasing structure' },
      { num: 9, name: 'Downstream Transportation', direction: 'Downstream', typical: '2-8% for product companies' },
      { num: 10, name: 'Processing of Sold Products', direction: 'Downstream', typical: 'Varies by intermediate product' },
      { num: 11, name: 'Use of Sold Products', direction: 'Downstream', typical: '>90% for oil/gas, 50-80% for automotive' },
      { num: 12, name: 'End-of-Life Treatment', direction: 'Downstream', typical: '1-5% for product companies' },
      { num: 13, name: 'Downstream Leased Assets', direction: 'Downstream', typical: 'Key for real estate companies' },
      { num: 14, name: 'Franchises', direction: 'Downstream', typical: 'Key for franchise business models' },
      { num: 15, name: 'Investments', direction: 'Downstream', typical: 'Dominant for financial institutions (PCAF)' },
    ],
    methodHierarchy: [
      'Supplier-specific (preferred)',
      'Hybrid (combination of supplier + secondary data)',
      'Average-data (industry averages per unit)',
      'Spend-based EEIO (least preferred but most accessible)',
    ],
    commonErrors: [
      'Excluding material categories without justification',
      'Double-counting between categories (e.g., Cat 1 and Cat 4)',
      'Using outdated EEIO factors (update annually)',
      'Not screening all 15 categories for materiality',
    ],
  },

  gwp: {
    title: 'Global Warming Potentials (GWP)',
    standard: 'IPCC AR6 (2021) values recommended; AR5 acceptable',
    values: [
      { gas: 'CO2', gwp100_ar6: 1, gwp100_ar5: 1 },
      { gas: 'CH4 (fossil)', gwp100_ar6: 29.8, gwp100_ar5: 28 },
      { gas: 'CH4 (biogenic)', gwp100_ar6: 27.0, gwp100_ar5: 28 },
      { gas: 'N2O', gwp100_ar6: 273, gwp100_ar5: 265 },
      { gas: 'HFC-134a', gwp100_ar6: 1530, gwp100_ar5: 1300 },
      { gas: 'R-410A', gwp100_ar6: 2088, gwp100_ar5: 1924 },
      { gas: 'R-404A', gwp100_ar6: 4728, gwp100_ar5: 3943 },
      { gas: 'SF6', gwp100_ar6: 25200, gwp100_ar5: 23500 },
      { gas: 'NF3', gwp100_ar6: 17400, gwp100_ar5: 16100 },
    ],
    note: 'GHG Protocol allows either AR5 or AR6. Be consistent across the entire inventory. Disclose which AR series is used.',
  },

  boundary: {
    title: 'Organisational & Operational Boundaries',
    standard: 'GHG Protocol Corporate Standard, Chapters 3-4',
    approaches: [
      { name: 'Operational Control', description: 'Report 100% of emissions from operations over which the company has operational control. Most common approach.' },
      { name: 'Financial Control', description: 'Report 100% of emissions from operations over which the company has financial control (ability to direct financial policies).' },
      { name: 'Equity Share', description: 'Report emissions proportional to equity ownership. Required for some regulations (e.g., EPA).' },
    ],
    note: 'Choose one approach and apply consistently. Operational control is recommended by TCFD, CSRD, and most frameworks.',
  },
};

export const EF_SELECTION_GUIDE = {
  hierarchy: [
    { tier: 1, name: 'Supplier-specific', description: 'Direct measurement from supplier (e.g., CDP response, EPD)', dqs: 1, accuracy: '+/- 5%' },
    { tier: 2, name: 'Process/technology-specific', description: 'Country or technology-specific factor (e.g., DEFRA by fuel type)', dqs: 2, accuracy: '+/- 15%' },
    { tier: 3, name: 'Country average', description: 'National average (e.g., grid intensity from IEA/Ember)', dqs: 3, accuracy: '+/- 25%' },
    { tier: 4, name: 'Spend-based proxy', description: 'EEIO model (e.g., EXIOBASE, USEEIO kgCO2e per USD)', dqs: 4, accuracy: '+/- 50%' },
    { tier: 5, name: 'Default/global average', description: 'IPCC default or global average factor', dqs: 5, accuracy: '+/- 100%' },
  ],
  note: 'Per GHG Protocol Scope 3 Guidance, Chapter 7: always use the highest-quality factor available. Document the source, year, and geographic scope of every factor.',
  sources: [
    { name: 'DEFRA/BEIS', region: 'UK', url: 'https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting', scope: 'Scope 1, 2, 3' },
    { name: 'EPA eGRID', region: 'US', url: 'https://www.epa.gov/egrid', scope: 'Scope 2 (electricity)' },
    { name: 'IEA Emission Factors', region: 'Global', url: 'https://www.iea.org/data-and-statistics', scope: 'Scope 2 (grid factors)' },
    { name: 'Ember Global Electricity Review', region: 'Global', url: 'https://ember-climate.org', scope: 'Scope 2 (annual updates)' },
    { name: 'EXIOBASE', region: 'Global', url: 'https://www.exiobase.eu', scope: 'Scope 3 (spend-based EEIO)' },
    { name: 'IPCC Emission Factor Database', region: 'Global', url: 'https://www.ipcc-nggip.iges.or.jp/EFDB/', scope: 'All scopes' },
    { name: 'ecoinvent', region: 'Global', url: 'https://ecoinvent.org', scope: 'Scope 3 (LCA-based)' },
  ],
};

// ---------------------------------------------------------------------------
// 6. REAL-TIME CHECKS
// ---------------------------------------------------------------------------

const SECTOR_BENCHMARKS = {
  'Financial Services': { medianIntensity: 15, scope1Pct: [1, 10], scope3Dominant: true },
  'Technology': { medianIntensity: 25, scope1Pct: [1, 8], scope3Dominant: true },
  'Oil & Gas': { medianIntensity: 350, scope1Pct: [15, 40], scope3Dominant: true },
  'Utilities': { medianIntensity: 800, scope1Pct: [60, 95], scope3Dominant: false },
  'Cement': { medianIntensity: 650, scope1Pct: [70, 90], scope3Dominant: false },
  'Automotive': { medianIntensity: 120, scope1Pct: [5, 15], scope3Dominant: true },
  'Retail': { medianIntensity: 45, scope1Pct: [5, 20], scope3Dominant: true },
  'Real Estate': { medianIntensity: 55, scope1Pct: [10, 30], scope3Dominant: true },
  'Mining': { medianIntensity: 250, scope1Pct: [40, 70], scope3Dominant: false },
  'Pharmaceuticals': { medianIntensity: 35, scope1Pct: [5, 15], scope3Dominant: true },
  'Telecommunications': { medianIntensity: 20, scope1Pct: [2, 10], scope3Dominant: true },
  'Airlines': { medianIntensity: 900, scope1Pct: [85, 98], scope3Dominant: false },
};

function getSectorBenchmark(sector) {
  return SECTOR_BENCHMARKS[sector] || null;
}

/**
 * Run cross-validation checks after each data entry or recalculation.
 * @returns {Array<{ type: 'error'|'warning'|'info', msg: string }>}
 */
export function runRealTimeChecks(inventory, sector) {
  const checks = [];
  if (!inventory || !inventory.total) return checks;

  const benchmark = getSectorBenchmark(sector);

  // Intensity benchmark
  if (benchmark && inventory.intensity) {
    if (inventory.intensity > benchmark.medianIntensity * 3) {
      checks.push({
        type: 'warning',
        msg: `Intensity ${inventory.intensity.toFixed(0)} tCO2e/$M is >3x the sector median (${benchmark.medianIntensity}). Verify data or check if revenue is understated.`,
      });
    } else if (inventory.intensity < benchmark.medianIntensity * 0.1) {
      checks.push({
        type: 'info',
        msg: `Intensity ${inventory.intensity.toFixed(0)} tCO2e/$M is <10% of sector median (${benchmark.medianIntensity}). Ensure all material sources are included.`,
      });
    }
  }

  // Scope 1 percentage check
  const s1pct = (inventory.scope1Total / inventory.total) * 100;
  if (benchmark) {
    const [lo, hi] = benchmark.scope1Pct;
    if (s1pct > hi * 2) {
      checks.push({
        type: 'warning',
        msg: `Scope 1 is ${s1pct.toFixed(0)}% of total - unusually high for ${sector} (typical ${lo}-${hi}%). Check for double-counting or misclassified Scope 3.`,
      });
    } else if (s1pct < lo * 0.5 && s1pct > 0) {
      checks.push({
        type: 'info',
        msg: `Scope 1 is only ${s1pct.toFixed(1)}% of total - below typical range for ${sector} (${lo}-${hi}%). Verify all direct sources are captured.`,
      });
    }
  }

  // Scope 3 dominance check
  if (inventory.scope3Total < inventory.scope1Total && benchmark && benchmark.scope3Dominant) {
    checks.push({
      type: 'info',
      msg: `Scope 3 (${inventory.scope3Total.toLocaleString()} tCO2e) < Scope 1 (${inventory.scope1Total.toLocaleString()} tCO2e). For ${sector}, Scope 3 typically dominates. Consider if all relevant categories are included.`,
    });
  }

  // Year-on-year change
  if (inventory.prevYear && inventory.prevYear > 0) {
    const change = ((inventory.total - inventory.prevYear) / inventory.prevYear) * 100;
    if (Math.abs(change) > 20) {
      checks.push({
        type: 'warning',
        msg: `${change > 0 ? '+' : ''}${change.toFixed(1)}% change vs previous year. GHG Protocol recommends documenting significant changes (>20%) and checking for methodology shifts, boundary changes, or data errors.`,
      });
    }
    if (Math.abs(change) > 50) {
      checks.push({
        type: 'error',
        msg: `${change > 0 ? '+' : ''}${change.toFixed(0)}% YoY change is extreme. This likely indicates a boundary change, methodology change, or data error rather than actual emission change.`,
      });
    }
  }

  // Scope 2 dual reporting check
  if (inventory.scope2Location && inventory.scope2Market) {
    if (inventory.scope2Market > inventory.scope2Location * 1.1) {
      checks.push({
        type: 'warning',
        msg: `Market-based Scope 2 exceeds location-based by >10%. This can happen with residual mix factors but is unusual - verify instrument data.`,
      });
    }
  } else if (inventory.scope2Location && !inventory.scope2Market) {
    checks.push({
      type: 'info',
      msg: 'Only location-based Scope 2 reported. GHG Protocol Scope 2 Guidance requires dual reporting (both location- and market-based).',
    });
  }

  // Zero emission scope checks
  if (inventory.scope1Total === 0) {
    checks.push({ type: 'info', msg: 'Scope 1 is zero. Verify there are no owned/controlled combustion, process, or fugitive sources.' });
  }
  if (inventory.scope2Location === 0 && inventory.scope2Market === 0) {
    checks.push({ type: 'info', msg: 'Scope 2 is zero. Verify that no electricity, steam, heating, or cooling is purchased.' });
  }

  // Biogenic carbon note
  if (inventory.biogenicCO2 && inventory.biogenicCO2 > 0) {
    checks.push({
      type: 'info',
      msg: `Biogenic CO2 of ${inventory.biogenicCO2.toLocaleString()} tCO2 should be reported separately (outside scopes) per GHG Protocol.`,
    });
  }

  return checks;
}

/**
 * Quick sanity check for a single entry before adding to the inventory.
 */
export function checkSingleEntry(entry, scope) {
  const issues = [];

  if (scope === 1) {
    if (entry.quantity > 0 && entry.fuelType) {
      // Rough magnitude check
      const TYPICAL_RANGES = {
        natural_gas: { min: 100, max: 1e10, unit: 'kWh' },
        diesel: { min: 10, max: 1e8, unit: 'litres' },
        petrol: { min: 10, max: 1e7, unit: 'litres' },
        coal: { min: 1, max: 1e7, unit: 'tonnes' },
        refrigerant_r410a: { min: 0.1, max: 10000, unit: 'kg' },
      };
      const range = TYPICAL_RANGES[entry.fuelType];
      if (range && entry.unit === range.unit) {
        if (entry.quantity > range.max) issues.push({ type: 'warning', msg: `Quantity seems very high for ${entry.fuelType} - check units` });
        if (entry.quantity < range.min) issues.push({ type: 'info', msg: `Quantity seems very low for ${entry.fuelType} - check if this is a partial year` });
      }
    }
  }

  if (scope === 2) {
    if (entry.consumption > 0 && entry.country) {
      // Rough check: >1 TWh for a single facility is unusual
      if (entry.consumption > 1e9) issues.push({ type: 'warning', msg: 'Consumption >1 TWh for a single facility is unusual - verify this is not a portfolio total' });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// UTILITY: Sector list for dropdowns
// ---------------------------------------------------------------------------

export const SECTOR_OPTIONS = Object.keys(SECTOR_BENCHMARKS).map((s) => ({
  value: s,
  label: s,
  benchmark: SECTOR_BENCHMARKS[s],
}));

// ---------------------------------------------------------------------------
// UTILITY: Unit conversion helpers
// ---------------------------------------------------------------------------

export const UNIT_CONVERSIONS = {
  litres_to_kg: { diesel: 0.8375, petrol: 0.7489, kerosene: 0.7998, lpg: 0.51 },
  m3_to_kWh: { natural_gas: 10.55 },
  therms_to_kWh: 29.3071,
  mmbtu_to_kWh: 293.071,
  gallons_us_to_litres: 3.78541,
  gallons_uk_to_litres: 4.54609,
  short_ton_to_tonnes: 0.907185,
  long_ton_to_tonnes: 1.01605,
};

export function convertUnit(value, fromUnit, toUnit, fuelType) {
  if (fromUnit === toUnit) return value;

  // Litres to kg
  if (fromUnit === 'litres' && toUnit === 'kg' && UNIT_CONVERSIONS.litres_to_kg[fuelType]) {
    return value * UNIT_CONVERSIONS.litres_to_kg[fuelType];
  }
  // m3 to kWh for natural gas
  if (fromUnit === 'm3' && toUnit === 'kWh' && fuelType === 'natural_gas') {
    return value * UNIT_CONVERSIONS.m3_to_kWh.natural_gas;
  }
  // Therms to kWh
  if (fromUnit === 'therms' && toUnit === 'kWh') return value * UNIT_CONVERSIONS.therms_to_kWh;
  // MMBtu to kWh
  if (fromUnit === 'mmbtu' && toUnit === 'kWh') return value * UNIT_CONVERSIONS.mmbtu_to_kWh;
  // US gallons to litres
  if (fromUnit === 'gallons_us' && toUnit === 'litres') return value * UNIT_CONVERSIONS.gallons_us_to_litres;
  // UK gallons to litres
  if (fromUnit === 'gallons_uk' && toUnit === 'litres') return value * UNIT_CONVERSIONS.gallons_uk_to_litres;
  // Short ton to metric tonnes
  if (fromUnit === 'short_ton' && toUnit === 'tonnes') return value * UNIT_CONVERSIONS.short_ton_to_tonnes;

  return null; // Unsupported conversion
}
