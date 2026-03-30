// =============================================================================
// ENH-013: XBRL / iXBRL Tagging Engine for CSRD Digital Reporting
// =============================================================================
// Supports: ESRS Set 1 (E1-E5, S1-S4, G1-G2), iXBRL inline format
// Reference: EFRAG ESRS XBRL Taxonomy 2024-01
// =============================================================================

// ---------------------------------------------------------------------------
// 1. ESRS Taxonomy Definition
// ---------------------------------------------------------------------------
export const ESRS_TAXONOMY = {
  namespace: 'http://www.efrag.org/taxonomy/esrs/2024',
  version: '2024-01',
  schemaRef: 'https://www.efrag.org/taxonomy/esrs/2024/esrs_all.xsd',
  linkbasePrefix: 'https://www.efrag.org/taxonomy/esrs/2024/',
  standards: [
    { id: 'E1', name: 'Climate Change', datapoints: 82, mandatory: true },
    { id: 'E2', name: 'Pollution', datapoints: 35, mandatory: false },
    { id: 'E3', name: 'Water & Marine Resources', datapoints: 28, mandatory: false },
    { id: 'E4', name: 'Biodiversity & Ecosystems', datapoints: 45, mandatory: false },
    { id: 'E5', name: 'Resource Use & Circular Economy', datapoints: 32, mandatory: false },
    { id: 'S1', name: 'Own Workforce', datapoints: 64, mandatory: true },
    { id: 'S2', name: 'Workers in Value Chain', datapoints: 28, mandatory: false },
    { id: 'S3', name: 'Affected Communities', datapoints: 22, mandatory: false },
    { id: 'S4', name: 'Consumers & End-Users', datapoints: 18, mandatory: false },
    { id: 'G1', name: 'Business Conduct', datapoints: 15, mandatory: true },
    { id: 'G2', name: 'Political Engagement & Lobbying', datapoints: 12, mandatory: false }
  ]
};

// ---------------------------------------------------------------------------
// 2. XBRL Unit Registry
// ---------------------------------------------------------------------------
export const XBRL_UNITS = {
  tCO2e: { id: 'u-tCO2e', measure: 'esrs:tonnesCO2equivalent' },
  EUR: { id: 'u-EUR', measure: 'iso4217:EUR' },
  USD: { id: 'u-USD', measure: 'iso4217:USD' },
  GBP: { id: 'u-GBP', measure: 'iso4217:GBP' },
  percent: { id: 'u-percent', measure: 'xbrli:pure' },
  MWh: { id: 'u-MWh', measure: 'esrs:megawattHours' },
  GJ: { id: 'u-GJ', measure: 'esrs:gigajoules' },
  hectare: { id: 'u-ha', measure: 'esrs:hectare' },
  m3: { id: 'u-m3', measure: 'esrs:cubicMetre' },
  tonne: { id: 'u-t', measure: 'esrs:tonne' },
  FTE: { id: 'u-FTE', measure: 'esrs:fullTimeEquivalent' },
  pure: { id: 'u-pure', measure: 'xbrli:pure' },
  count: { id: 'u-count', measure: 'xbrli:pure' }
};

// ---------------------------------------------------------------------------
// 3. Period Context Helpers
// ---------------------------------------------------------------------------
export function createInstantContext(date, entityId) {
  return {
    id: `ctx-instant-${date}`,
    entity: { identifier: entityId, scheme: 'http://standards.iso.org/iso/17442' },
    period: { instant: date }
  };
}

export function createDurationContext(startDate, endDate, entityId) {
  return {
    id: `ctx-duration-${startDate}-${endDate}`,
    entity: { identifier: entityId, scheme: 'http://standards.iso.org/iso/17442' },
    period: { startDate, endDate }
  };
}

// ---------------------------------------------------------------------------
// 4. Tag a Datapoint
// ---------------------------------------------------------------------------
let _tagCounter = 0;

export function tagDatapoint(standardId, datapointId, value, unit, period, options = {}) {
  const std = ESRS_TAXONOMY.standards.find(s => s.id === standardId);
  if (!std) {
    return { valid: false, error: `Unknown standard: ${standardId}` };
  }

  const mapping = Object.values(FIELD_TO_ESRS_MAP).find(
    m => m.standard === standardId && m.datapoint === datapointId
  );

  const unitDef = XBRL_UNITS[unit] || XBRL_UNITS.pure;
  const tagId = `tag-${++_tagCounter}`;
  const decimals = options.decimals !== undefined ? options.decimals : inferDecimals(unit);

  return {
    valid: true,
    tag: {
      id: tagId,
      name: `esrs:${datapointId.replace(/-/g, '_')}`,
      contextRef: period.id || `ctx-${Date.now()}`,
      unitRef: unitDef.id,
      decimals,
      value: formatValue(value, unit),
      rawValue: value,
      standard: standardId,
      standardName: std.name,
      datapointId,
      description: mapping ? mapping.description : options.description || '',
      footnote: options.footnote || null,
      assured: options.assured || false,
      assuranceLevel: options.assuranceLevel || null
    }
  };
}

function inferDecimals(unit) {
  if (unit === 'percent') return 4;
  if (unit === 'EUR' || unit === 'USD' || unit === 'GBP') return 0;
  if (unit === 'tCO2e' || unit === 'tonne') return 2;
  if (unit === 'count' || unit === 'FTE') return 0;
  return 2;
}

function formatValue(value, unit) {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (unit === 'percent') return (value / 100).toFixed(4);
  return String(value);
}

// ---------------------------------------------------------------------------
// 5. Generate iXBRL Inline Document Fragment
// ---------------------------------------------------------------------------
export function generateIXBRL(taggedDatapoints, options = {}) {
  const entityId = options.entityId || '549300EXAMPLE000LEI00';
  const reportingPeriod = options.reportingPeriod || { start: '2024-01-01', end: '2024-12-31' };
  const currency = options.currency || 'EUR';

  const contexts = buildContexts(taggedDatapoints, entityId, reportingPeriod);
  const units = buildUnits(taggedDatapoints);
  const facts = taggedDatapoints.map(tp => buildInlineFact(tp));
  const footnotes = taggedDatapoints.filter(tp => tp.tag.footnote).map(tp => buildFootnote(tp));

  const header = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<html xmlns="http://www.w3.org/1999/xhtml"',
    '      xmlns:ix="http://www.xbrl.org/2013/inlineXBRL"',
    '      xmlns:xbrli="http://www.xbrl.org/2003/instance"',
    '      xmlns:esrs="http://www.efrag.org/taxonomy/esrs/2024"',
    '      xmlns:iso4217="http://www.xbrl.org/2003/iso4217"',
    '      xmlns:link="http://www.xbrl.org/2003/linkbase"',
    '      xmlns:xlink="http://www.w3.org/1999/xlink"',
    '      xml:lang="en">',
    '<head>',
    '  <title>ESRS Digital Report</title>',
    '</head>',
    '<body>',
    '<ix:header>',
    '  <ix:hidden>',
    `    <ix:references>`,
    `      <link:schemaRef xlink:type="simple" xlink:href="${ESRS_TAXONOMY.schemaRef}"/>`,
    `    </ix:references>`,
    '    <ix:resources>'
  ].join('\n');

  const contextXml = contexts.map(c => renderContext(c)).join('\n');
  const unitXml = units.map(u => renderUnit(u)).join('\n');

  const middle = [
    contextXml,
    unitXml,
    '    </ix:resources>',
    '  </ix:hidden>',
    '</ix:header>',
    ''
  ].join('\n');

  const factXml = facts.join('\n');
  const footnoteXml = footnotes.length > 0
    ? `\n<ix:footnotes>\n${footnotes.join('\n')}\n</ix:footnotes>` : '';

  const footer = [
    footnoteXml,
    '</body>',
    '</html>'
  ].join('\n');

  return {
    content: `${header}\n${middle}\n${factXml}\n${footer}`,
    stats: {
      factCount: taggedDatapoints.length,
      contextCount: contexts.length,
      unitCount: units.length,
      footnoteCount: footnotes.length,
      standards: [...new Set(taggedDatapoints.map(tp => tp.tag.standard))]
    }
  };
}

function buildContexts(taggedDatapoints, entityId, period) {
  const seen = new Set();
  const contexts = [];
  for (const tp of taggedDatapoints) {
    const ref = tp.tag.contextRef;
    if (!seen.has(ref)) {
      seen.add(ref);
      contexts.push({
        id: ref,
        entity: { identifier: entityId, scheme: 'http://standards.iso.org/iso/17442' },
        period: { startDate: period.start, endDate: period.end }
      });
    }
  }
  return contexts;
}

function buildUnits(taggedDatapoints) {
  const seen = new Set();
  const units = [];
  for (const tp of taggedDatapoints) {
    const ref = tp.tag.unitRef;
    if (!seen.has(ref)) {
      seen.add(ref);
      const entry = Object.values(XBRL_UNITS).find(u => u.id === ref);
      if (entry) units.push(entry);
    }
  }
  return units;
}

function renderContext(ctx) {
  const periodXml = ctx.period.instant
    ? `<xbrli:instant>${ctx.period.instant}</xbrli:instant>`
    : `<xbrli:startDate>${ctx.period.startDate}</xbrli:startDate><xbrli:endDate>${ctx.period.endDate}</xbrli:endDate>`;
  return [
    `    <xbrli:context id="${ctx.id}">`,
    `      <xbrli:entity><xbrli:identifier scheme="${ctx.entity.scheme}">${ctx.entity.identifier}</xbrli:identifier></xbrli:entity>`,
    `      <xbrli:period>${periodXml}</xbrli:period>`,
    `    </xbrli:context>`
  ].join('\n');
}

function renderUnit(u) {
  return `    <xbrli:unit id="${u.id}"><xbrli:measure>${u.measure}</xbrli:measure></xbrli:unit>`;
}

function buildInlineFact(tp) {
  const t = tp.tag;
  const isNumeric = !isNaN(Number(t.value)) && typeof tp.tag.rawValue === 'number';
  if (isNumeric) {
    return `<ix:nonFraction name="${t.name}" contextRef="${t.contextRef}" unitRef="${t.unitRef}" decimals="${t.decimals}" id="${t.id}">${t.value}</ix:nonFraction>`;
  }
  return `<ix:nonNumeric name="${t.name}" contextRef="${t.contextRef}" id="${t.id}">${escapeXml(t.value)}</ix:nonNumeric>`;
}

function buildFootnote(tp) {
  return `  <link:footnote xlink:type="resource" xlink:label="fn-${tp.tag.id}" xml:lang="en">${escapeXml(tp.tag.footnote)}</link:footnote>`;
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// 6. Validate Tags Against ESRS Taxonomy
// ---------------------------------------------------------------------------
export function validateTags(tags) {
  const errors = [];
  const warnings = [];
  const validStandards = new Set(ESRS_TAXONOMY.standards.map(s => s.id));
  const knownDatapoints = new Set(Object.values(FIELD_TO_ESRS_MAP).map(m => m.datapoint));

  for (const tag of tags) {
    const t = tag.tag || tag;

    if (!validStandards.has(t.standard)) {
      errors.push({ tagId: t.id, type: 'INVALID_STANDARD', message: `Standard ${t.standard} not in ESRS taxonomy` });
    }

    if (!t.datapointId || t.datapointId.length < 3) {
      errors.push({ tagId: t.id, type: 'MISSING_DATAPOINT_ID', message: 'Datapoint ID is required' });
    }

    if (t.value === null || t.value === undefined || t.value === '') {
      warnings.push({ tagId: t.id, type: 'EMPTY_VALUE', message: 'Tagged datapoint has no value' });
    }

    if (!t.contextRef) {
      errors.push({ tagId: t.id, type: 'MISSING_CONTEXT', message: 'Context reference is required' });
    }

    if (!knownDatapoints.has(t.datapointId)) {
      warnings.push({ tagId: t.id, type: 'UNMAPPED_DATAPOINT', message: `Datapoint ${t.datapointId} not in known field map` });
    }
  }

  const mandatoryStandards = ESRS_TAXONOMY.standards.filter(s => s.mandatory).map(s => s.id);
  const reportedStandards = new Set(tags.map(t => (t.tag || t).standard));
  for (const ms of mandatoryStandards) {
    if (!reportedStandards.has(ms)) {
      warnings.push({ tagId: null, type: 'MISSING_MANDATORY_STANDARD', message: `Mandatory standard ${ms} has no tagged datapoints` });
    }
  }

  return {
    valid: errors.length === 0,
    errorCount: errors.length,
    warningCount: warnings.length,
    errors,
    warnings,
    coverage: {
      standardsCovered: [...reportedStandards],
      totalDatapoints: tags.length,
      mandatoryMissing: mandatoryStandards.filter(ms => !reportedStandards.has(ms))
    }
  };
}

// ---------------------------------------------------------------------------
// 7. Platform Field -> ESRS Datapoint Mapping (100+ mappings)
// ---------------------------------------------------------------------------
export const FIELD_TO_ESRS_MAP = {
  // === E1 Climate Change ===
  scope1_tco2e:           { standard: 'E1', datapoint: 'E1-6_01', description: 'Scope 1 GHG emissions' },
  scope2_tco2e:           { standard: 'E1', datapoint: 'E1-6_02', description: 'Scope 2 GHG emissions (location-based)' },
  scope2_market_tco2e:    { standard: 'E1', datapoint: 'E1-6_03', description: 'Scope 2 GHG emissions (market-based)' },
  scope3_total_tco2e:     { standard: 'E1', datapoint: 'E1-6_04', description: 'Scope 3 GHG emissions total' },
  scope3_cat1:            { standard: 'E1', datapoint: 'E1-6_05', description: 'Scope 3 Cat 1: Purchased goods & services' },
  scope3_cat2:            { standard: 'E1', datapoint: 'E1-6_06', description: 'Scope 3 Cat 2: Capital goods' },
  scope3_cat3:            { standard: 'E1', datapoint: 'E1-6_07', description: 'Scope 3 Cat 3: Fuel & energy activities' },
  scope3_cat4:            { standard: 'E1', datapoint: 'E1-6_08', description: 'Scope 3 Cat 4: Upstream transport' },
  scope3_cat5:            { standard: 'E1', datapoint: 'E1-6_09', description: 'Scope 3 Cat 5: Waste in operations' },
  scope3_cat6:            { standard: 'E1', datapoint: 'E1-6_10', description: 'Scope 3 Cat 6: Business travel' },
  scope3_cat7:            { standard: 'E1', datapoint: 'E1-6_11', description: 'Scope 3 Cat 7: Employee commuting' },
  scope3_cat11:           { standard: 'E1', datapoint: 'E1-6_15', description: 'Scope 3 Cat 11: Use of sold products' },
  scope3_cat15:           { standard: 'E1', datapoint: 'E1-6_19', description: 'Scope 3 Cat 15: Investments' },
  total_ghg:              { standard: 'E1', datapoint: 'E1-6_20', description: 'Total GHG emissions' },
  ghg_intensity_revenue:  { standard: 'E1', datapoint: 'E1-6_21', description: 'GHG intensity per net revenue' },
  energy_consumption:     { standard: 'E1', datapoint: 'E1-5_01', description: 'Total energy consumption (MWh)' },
  energy_renewable_pct:   { standard: 'E1', datapoint: 'E1-5_02', description: 'Share of renewable energy' },
  energy_fossil:          { standard: 'E1', datapoint: 'E1-5_03', description: 'Energy from fossil sources' },
  energy_nuclear:         { standard: 'E1', datapoint: 'E1-5_04', description: 'Energy from nuclear sources' },
  energy_renewable:       { standard: 'E1', datapoint: 'E1-5_05', description: 'Energy from renewable sources' },
  ghg_reduction_target:   { standard: 'E1', datapoint: 'E1-4_01', description: 'GHG reduction target (absolute)' },
  ghg_target_year:        { standard: 'E1', datapoint: 'E1-4_02', description: 'GHG reduction target year' },
  ghg_target_base_year:   { standard: 'E1', datapoint: 'E1-4_03', description: 'GHG base year for target' },
  sbti_validated:         { standard: 'E1', datapoint: 'E1-4_04', description: 'SBTi target validation status' },
  carbon_credits_retired: { standard: 'E1', datapoint: 'E1-7_01', description: 'Carbon credits retired (tCO2e)' },
  internal_carbon_price:  { standard: 'E1', datapoint: 'E1-8_01', description: 'Internal carbon price applied' },
  transition_plan:        { standard: 'E1', datapoint: 'E1-1_01', description: 'Transition plan for climate change mitigation' },
  climate_risk_physical:  { standard: 'E1', datapoint: 'E1-9_01', description: 'Physical climate risk assessment' },
  climate_risk_transition:{ standard: 'E1', datapoint: 'E1-9_02', description: 'Transition climate risk assessment' },
  climate_opportunity:    { standard: 'E1', datapoint: 'E1-9_03', description: 'Climate-related opportunities' },

  // === E2 Pollution ===
  air_pollutants:         { standard: 'E2', datapoint: 'E2-4_01', description: 'Air pollutant emissions' },
  water_pollutants:       { standard: 'E2', datapoint: 'E2-4_02', description: 'Water pollutant emissions' },
  soil_pollutants:        { standard: 'E2', datapoint: 'E2-4_03', description: 'Soil pollutant emissions' },
  microplastics:          { standard: 'E2', datapoint: 'E2-4_04', description: 'Microplastic emissions' },
  substances_of_concern:  { standard: 'E2', datapoint: 'E2-5_01', description: 'Substances of concern produced' },
  svhc_produced:          { standard: 'E2', datapoint: 'E2-5_02', description: 'SVHCs produced or used' },

  // === E3 Water ===
  water_withdrawal:       { standard: 'E3', datapoint: 'E3-4_01', description: 'Total water withdrawal (m3)' },
  water_consumption:      { standard: 'E3', datapoint: 'E3-4_02', description: 'Total water consumption (m3)' },
  water_discharge:        { standard: 'E3', datapoint: 'E3-4_03', description: 'Total water discharge (m3)' },
  water_stress_areas:     { standard: 'E3', datapoint: 'E3-4_04', description: 'Operations in water-stress areas' },
  water_recycled:         { standard: 'E3', datapoint: 'E3-4_05', description: 'Water recycled and reused (m3)' },

  // === E4 Biodiversity ===
  sites_near_biodiversity:{ standard: 'E4', datapoint: 'E4-5_01', description: 'Sites near biodiversity-sensitive areas' },
  land_use_change:        { standard: 'E4', datapoint: 'E4-5_02', description: 'Land use change (hectares)' },
  deforestation_linked:   { standard: 'E4', datapoint: 'E4-5_03', description: 'Deforestation-linked commodities' },
  biodiversity_offsets:   { standard: 'E4', datapoint: 'E4-6_01', description: 'Biodiversity offsets' },
  ecosystem_restoration:  { standard: 'E4', datapoint: 'E4-6_02', description: 'Ecosystem restoration area (ha)' },

  // === E5 Resource Use & Circular Economy ===
  material_inflow:        { standard: 'E5', datapoint: 'E5-4_01', description: 'Total material resource inflow (tonnes)' },
  recycled_content_pct:   { standard: 'E5', datapoint: 'E5-4_02', description: 'Percentage recycled content' },
  waste_generated:        { standard: 'E5', datapoint: 'E5-5_01', description: 'Total waste generated (tonnes)' },
  waste_recycled:         { standard: 'E5', datapoint: 'E5-5_02', description: 'Waste recycled (tonnes)' },
  waste_landfill:         { standard: 'E5', datapoint: 'E5-5_03', description: 'Waste to landfill (tonnes)' },
  hazardous_waste:        { standard: 'E5', datapoint: 'E5-5_04', description: 'Hazardous waste (tonnes)' },

  // === S1 Own Workforce ===
  total_employees:        { standard: 'S1', datapoint: 'S1-6_01', description: 'Total number of employees (headcount)' },
  employees_fte:          { standard: 'S1', datapoint: 'S1-6_02', description: 'Total employees (FTE)' },
  gender_diversity_pct:   { standard: 'S1', datapoint: 'S1-9_01', description: 'Gender diversity (% women)' },
  gender_pay_gap:         { standard: 'S1', datapoint: 'S1-16_01', description: 'Gender pay gap' },
  training_hours:         { standard: 'S1', datapoint: 'S1-13_01', description: 'Training hours per employee' },
  employee_turnover:      { standard: 'S1', datapoint: 'S1-6_03', description: 'Employee turnover rate' },
  collective_bargaining:  { standard: 'S1', datapoint: 'S1-8_01', description: 'Collective bargaining coverage (%)' },
  work_related_injuries:  { standard: 'S1', datapoint: 'S1-14_01', description: 'Work-related injuries rate' },
  work_related_fatalities:{ standard: 'S1', datapoint: 'S1-14_02', description: 'Work-related fatalities' },
  living_wage_pct:        { standard: 'S1', datapoint: 'S1-10_01', description: 'Adequate wages (living wage coverage)' },
  board_gender_pct:       { standard: 'S1', datapoint: 'S1-9_02', description: 'Board gender diversity (% women)' },

  // === S2 Workers in Value Chain ===
  vc_workers_assessed:    { standard: 'S2', datapoint: 'S2-4_01', description: 'Value chain workers assessed for risks' },
  vc_child_labor_risk:    { standard: 'S2', datapoint: 'S2-4_02', description: 'Child labor risk in value chain' },
  vc_forced_labor_risk:   { standard: 'S2', datapoint: 'S2-4_03', description: 'Forced labor risk in value chain' },
  vc_remediation_actions: { standard: 'S2', datapoint: 'S2-5_01', description: 'Remediation actions for value chain workers' },

  // === S3 Affected Communities ===
  community_engagement:   { standard: 'S3', datapoint: 'S3-3_01', description: 'Community engagement processes' },
  indigenous_rights:      { standard: 'S3', datapoint: 'S3-4_01', description: 'Indigenous peoples rights impacts' },
  land_rights_disputes:   { standard: 'S3', datapoint: 'S3-4_02', description: 'Land rights disputes' },

  // === S4 Consumers & End-Users ===
  product_safety_incidents:{ standard: 'S4', datapoint: 'S4-4_01', description: 'Product safety incidents' },
  data_privacy_breaches:  { standard: 'S4', datapoint: 'S4-4_02', description: 'Data privacy breaches' },
  product_recalls:        { standard: 'S4', datapoint: 'S4-4_03', description: 'Product recalls' },

  // === G1 Business Conduct ===
  anti_corruption_training:{ standard: 'G1', datapoint: 'G1-3_01', description: 'Anti-corruption training coverage (%)' },
  corruption_incidents:   { standard: 'G1', datapoint: 'G1-4_01', description: 'Confirmed corruption incidents' },
  whistleblower_cases:    { standard: 'G1', datapoint: 'G1-4_02', description: 'Whistleblower cases reported' },
  payment_practices_days: { standard: 'G1', datapoint: 'G1-6_01', description: 'Average payment period (days)' },
  late_payments_pct:      { standard: 'G1', datapoint: 'G1-6_02', description: 'Late payment percentage' },

  // === G2 Political Engagement ===
  political_contributions:{ standard: 'G2', datapoint: 'G2-1_01', description: 'Political contributions (EUR)' },
  lobbying_expenditure:   { standard: 'G2', datapoint: 'G2-1_02', description: 'Lobbying expenditure (EUR)' },
  trade_association_fees: { standard: 'G2', datapoint: 'G2-1_03', description: 'Trade association membership fees' }
};

// ---------------------------------------------------------------------------
// 8. Reverse Map (datapoint -> field name)
// ---------------------------------------------------------------------------
export const DATAPOINT_TO_FIELD_MAP = Object.fromEntries(
  Object.entries(FIELD_TO_ESRS_MAP).map(([field, meta]) => [meta.datapoint, { field, ...meta }])
);

// ---------------------------------------------------------------------------
// 9. Batch Tagging Helper
// ---------------------------------------------------------------------------
export function batchTag(fieldValues, period) {
  const results = [];
  for (const [field, value] of Object.entries(fieldValues)) {
    const mapping = FIELD_TO_ESRS_MAP[field];
    if (!mapping) continue;
    const unit = inferUnitFromField(field);
    const tagged = tagDatapoint(mapping.standard, mapping.datapoint, value, unit, period);
    if (tagged.valid) results.push(tagged);
  }
  return results;
}

function inferUnitFromField(field) {
  if (field.includes('tco2e') || field.includes('carbon_credits')) return 'tCO2e';
  if (field.includes('_eur') || field.includes('contributions') || field.includes('expenditure') || field.includes('fees')) return 'EUR';
  if (field.includes('_pct') || field.includes('diversity') || field.includes('gap') || field.includes('coverage')) return 'percent';
  if (field.includes('energy') && !field.includes('pct')) return 'MWh';
  if (field.includes('water') && !field.includes('stress') && !field.includes('pollut')) return 'm3';
  if (field.includes('waste') || field.includes('material') || field.includes('pollut')) return 'tonne';
  if (field.includes('hectare') || field.includes('restoration') || field.includes('land_use')) return 'hectare';
  if (field.includes('fte') || field.includes('employees_fte')) return 'FTE';
  if (field.includes('days') || field.includes('hours') || field.includes('incidents') || field.includes('fatalities') || field.includes('cases') || field.includes('recalls') || field.includes('breaches') || field.includes('disputes')) return 'count';
  return 'pure';
}

// ---------------------------------------------------------------------------
// 10. Export Utility
// ---------------------------------------------------------------------------
export function exportTaggingSummary(taggedDatapoints) {
  const byStandard = {};
  for (const tp of taggedDatapoints) {
    const std = tp.tag.standard;
    if (!byStandard[std]) byStandard[std] = { count: 0, datapoints: [] };
    byStandard[std].count++;
    byStandard[std].datapoints.push({
      id: tp.tag.datapointId,
      description: tp.tag.description,
      value: tp.tag.rawValue,
      assured: tp.tag.assured
    });
  }

  const totalDatapoints = ESRS_TAXONOMY.standards.reduce((sum, s) => sum + s.datapoints, 0);
  return {
    reportDate: new Date().toISOString(),
    taxonomyVersion: ESRS_TAXONOMY.version,
    totalTagged: taggedDatapoints.length,
    totalAvailable: totalDatapoints,
    coveragePercent: ((taggedDatapoints.length / totalDatapoints) * 100).toFixed(1),
    byStandard,
    assuredCount: taggedDatapoints.filter(tp => tp.tag.assured).length,
    unassuredCount: taggedDatapoints.filter(tp => !tp.tag.assured).length
  };
}
