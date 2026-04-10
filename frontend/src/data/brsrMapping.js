/**
 * BRSR (Business Responsibility & Sustainability Reporting) — SEBI India
 * Complete 9-Principle framework with KPI mappings to ESRS/GRI/ISSB
 * Source: SEBI Circular SEBI/HO/CFD/CFD-SEC-2/P/CIR/2023/122
 */

export const BRSR_PRINCIPLES = [
  {
    id: 'P1', name: 'Ethical Business Conduct',
    description: 'Businesses should conduct and govern themselves with integrity, transparency, and accountability',
    kpis: [
      { id: 'P1.1', metric: 'Anti-corruption policy', type: 'boolean', esrsMap: 'G1-1', griMap: '205-1' },
      { id: 'P1.2', metric: 'Complaints on ethics (customers)', type: 'number', esrsMap: 'G1-4', griMap: '205-3' },
      { id: 'P1.3', metric: 'Complaints on ethics (shareholders)', type: 'number', esrsMap: 'G1-4', griMap: '205-3' },
      { id: 'P1.4', metric: 'Conflict of interest cases', type: 'number', esrsMap: 'G1-3', griMap: '102-25' },
      { id: 'P1.5', metric: 'Disciplinary actions on corruption', type: 'number', esrsMap: 'G1-4', griMap: '205-3' },
    ],
    weight: 0.10,
  },
  {
    id: 'P2', name: 'Safe & Sustainable Products',
    description: 'Businesses should provide goods and services that are safe and contribute to sustainability',
    kpis: [
      { id: 'P2.1', metric: 'R&D as % of revenue', type: 'percentage', esrsMap: 'E5-4', griMap: '\u2014' },
      { id: 'P2.2', metric: 'Sustainable sourcing as % of inputs', type: 'percentage', esrsMap: 'E5-5', griMap: '204-1' },
      { id: 'P2.3', metric: 'Product recall incidents', type: 'number', esrsMap: '\u2014', griMap: '416-2' },
      { id: 'P2.4', metric: 'EPR compliance', type: 'boolean', esrsMap: 'E5-6', griMap: '\u2014' },
      { id: 'P2.5', metric: 'Products with lifecycle assessment', type: 'percentage', esrsMap: 'E1-6', griMap: '302-5' },
    ],
    weight: 0.10,
  },
  {
    id: 'P3', name: 'Wellbeing of Employees',
    description: 'Businesses should respect and promote the wellbeing of all employees',
    kpis: [
      { id: 'P3.1', metric: 'Permanent employees (%)', type: 'percentage', esrsMap: 'S1-6', griMap: '401-1' },
      { id: 'P3.2', metric: 'Women employees (%)', type: 'percentage', esrsMap: 'S1-9', griMap: '405-1' },
      { id: 'P3.3', metric: 'Median salary ratio (M:F)', type: 'number', esrsMap: 'S1-16', griMap: '405-2' },
      { id: 'P3.4', metric: 'Health & safety incidents (LTIFR)', type: 'number', esrsMap: 'S1-14', griMap: '403-9' },
      { id: 'P3.5', metric: 'Training hours per employee', type: 'number', esrsMap: 'S1-13', griMap: '404-1' },
      { id: 'P3.6', metric: 'Return to work after parental leave (%)', type: 'percentage', esrsMap: 'S1-15', griMap: '401-3' },
    ],
    weight: 0.12,
  },
  {
    id: 'P4', name: 'Stakeholder Responsiveness',
    description: 'Businesses should respect the interests and respond to stakeholder concerns',
    kpis: [
      { id: 'P4.1', metric: 'Stakeholder identification & engagement process', type: 'boolean', esrsMap: 'ESRS2-SBM3', griMap: '102-40' },
      { id: 'P4.2', metric: 'Material topics identified through engagement', type: 'number', esrsMap: 'ESRS2-IRO1', griMap: '102-44' },
      { id: 'P4.3', metric: 'Vulnerable/marginalized stakeholder engagement', type: 'boolean', esrsMap: 'S3-1', griMap: '413-1' },
    ],
    weight: 0.08,
  },
  {
    id: 'P5', name: 'Human Rights',
    description: 'Businesses should respect and promote human rights',
    kpis: [
      { id: 'P5.1', metric: 'Human rights policy', type: 'boolean', esrsMap: 'S1-1', griMap: '412-1' },
      { id: 'P5.2', metric: 'Complaints filed (sexual harassment)', type: 'number', esrsMap: 'S1-17', griMap: '406-1' },
      { id: 'P5.3', metric: 'Complaints filed (discrimination)', type: 'number', esrsMap: 'S1-17', griMap: '406-1' },
      { id: 'P5.4', metric: 'Complaints filed (child/forced labour)', type: 'number', esrsMap: 'S1-17', griMap: '408-1' },
      { id: 'P5.5', metric: 'Human rights due diligence', type: 'boolean', esrsMap: 'S1-4', griMap: '412-1' },
    ],
    weight: 0.10,
  },
  {
    id: 'P6', name: 'Environmental Protection',
    description: 'Businesses should respect and make efforts to protect the environment',
    kpis: [
      { id: 'P6.1', metric: 'Total energy consumption (GJ)', type: 'number', esrsMap: 'E1-5', griMap: '302-1' },
      { id: 'P6.2', metric: 'Energy intensity (GJ/\u20B9Cr revenue)', type: 'number', esrsMap: 'E1-5', griMap: '302-3' },
      { id: 'P6.3', metric: 'Scope 1 emissions (tCO2e)', type: 'number', esrsMap: 'E1-6', griMap: '305-1' },
      { id: 'P6.4', metric: 'Scope 2 emissions (tCO2e)', type: 'number', esrsMap: 'E1-6', griMap: '305-2' },
      { id: 'P6.5', metric: 'Scope 3 emissions (tCO2e)', type: 'number', esrsMap: 'E1-6', griMap: '305-3' },
      { id: 'P6.6', metric: 'GHG intensity (tCO2e/\u20B9Cr revenue)', type: 'number', esrsMap: 'E1-6', griMap: '305-4' },
      { id: 'P6.7', metric: 'Water withdrawal (KL)', type: 'number', esrsMap: 'E3-4', griMap: '303-3' },
      { id: 'P6.8', metric: 'Water intensity (KL/\u20B9Cr revenue)', type: 'number', esrsMap: 'E3-4', griMap: '303-3' },
      { id: 'P6.9', metric: 'Waste generated (MT)', type: 'number', esrsMap: 'E5-5', griMap: '306-3' },
      { id: 'P6.10', metric: 'Waste recycled (%)', type: 'percentage', esrsMap: 'E5-5', griMap: '306-4' },
      { id: 'P6.11', metric: 'Zero liquid discharge (ZLD)', type: 'boolean', esrsMap: 'E3-3', griMap: '303-2' },
      { id: 'P6.12', metric: 'EIA/environmental compliance', type: 'boolean', esrsMap: 'E2-6', griMap: '307-1' },
    ],
    weight: 0.18, // Highest weight — most climate-relevant
  },
  {
    id: 'P7', name: 'Policy Advocacy',
    description: 'Businesses should engage in influencing public policy in a responsible manner',
    kpis: [
      { id: 'P7.1', metric: 'Trade association membership (climate-related)', type: 'number', esrsMap: 'G1-5', griMap: '415-1' },
      { id: 'P7.2', metric: 'Advocacy positions aligned with Paris Agreement', type: 'boolean', esrsMap: 'E1-4', griMap: '\u2014' },
    ],
    weight: 0.06,
  },
  {
    id: 'P8', name: 'Inclusive Growth',
    description: 'Businesses should promote inclusive growth and equitable development',
    kpis: [
      { id: 'P8.1', metric: 'CSR spend (\u20B9Cr)', type: 'number', esrsMap: 'S3-4', griMap: '413-1' },
      { id: 'P8.2', metric: 'CSR as % of PAT', type: 'percentage', esrsMap: 'S3-4', griMap: '413-1' },
      { id: 'P8.3', metric: 'Beneficiaries of CSR programs', type: 'number', esrsMap: 'S3-5', griMap: '413-1' },
      { id: 'P8.4', metric: 'Local hiring (%)', type: 'percentage', esrsMap: 'S1-6', griMap: '202-2' },
      { id: 'P8.5', metric: 'MSE/local procurement (%)', type: 'percentage', esrsMap: 'S4-5', griMap: '204-1' },
    ],
    weight: 0.12,
  },
  {
    id: 'P9', name: 'Consumer Value',
    description: 'Businesses should provide value to consumers in a responsible manner',
    kpis: [
      { id: 'P9.1', metric: 'Consumer complaints received', type: 'number', esrsMap: 'S4-3', griMap: '418-1' },
      { id: 'P9.2', metric: 'Consumer complaints resolved (%)', type: 'percentage', esrsMap: 'S4-3', griMap: '418-1' },
      { id: 'P9.3', metric: 'Data privacy breaches', type: 'number', esrsMap: 'S4-4', griMap: '418-1' },
      { id: 'P9.4', metric: 'Product information & labelling compliance', type: 'boolean', esrsMap: 'S4-1', griMap: '417-1' },
      { id: 'P9.5', metric: 'Cybersecurity policy', type: 'boolean', esrsMap: 'G1-1', griMap: '418-1' },
    ],
    weight: 0.14,
  },
];

// BRSR Core — mandatory assurance KPIs (subset of above)
export const BRSR_CORE_KPIS = [
  // These are the KPIs requiring mandatory reasonable assurance from FY 2025-26
  'P3.2', // Women employees %
  'P3.3', // Median salary ratio
  'P3.4', // LTIFR
  'P3.5', // Training hours
  'P6.1', // Energy consumption
  'P6.2', // Energy intensity
  'P6.3', // Scope 1
  'P6.4', // Scope 2
  'P6.6', // GHG intensity
  'P6.7', // Water withdrawal
  'P6.8', // Water intensity
  'P6.9', // Waste generated
  'P6.10', // Waste recycled
  'P8.1', // CSR spend
  'P8.2', // CSR as % of PAT
];

// Cross-reference mapping: BRSR → ESRS → GRI → ISSB → SFDR PAI
export const BRSR_CROSSWALK = [
  { brsrKpi: 'P6.3', esrs: 'E1-6', gri: '305-1', issb: 'S2-29(a)', sfdrPai: 'PAI-1', metric: 'Scope 1 GHG emissions' },
  { brsrKpi: 'P6.4', esrs: 'E1-6', gri: '305-2', issb: 'S2-29(b)', sfdrPai: 'PAI-1', metric: 'Scope 2 GHG emissions' },
  { brsrKpi: 'P6.5', esrs: 'E1-6', gri: '305-3', issb: 'S2-29(c)', sfdrPai: 'PAI-1', metric: 'Scope 3 GHG emissions' },
  { brsrKpi: 'P6.6', esrs: 'E1-6', gri: '305-4', issb: 'S2-29', sfdrPai: 'PAI-3', metric: 'GHG intensity' },
  { brsrKpi: 'P6.1', esrs: 'E1-5', gri: '302-1', issb: 'S2-29', sfdrPai: 'PAI-4', metric: 'Energy consumption' },
  { brsrKpi: 'P6.7', esrs: 'E3-4', gri: '303-3', issb: '\u2014', sfdrPai: 'PAI-8', metric: 'Water withdrawal' },
  { brsrKpi: 'P6.9', esrs: 'E5-5', gri: '306-3', issb: '\u2014', sfdrPai: 'PAI-9', metric: 'Hazardous waste' },
  { brsrKpi: 'P3.2', esrs: 'S1-9', gri: '405-1', issb: '\u2014', sfdrPai: 'PAI-12', metric: 'Gender diversity' },
  { brsrKpi: 'P3.3', esrs: 'S1-16', gri: '405-2', issb: '\u2014', sfdrPai: 'PAI-12', metric: 'Gender pay gap' },
  { brsrKpi: 'P5.4', esrs: 'S1-17', gri: '408-1', issb: '\u2014', sfdrPai: 'PAI-10', metric: 'UNGC/human rights violations' },
  { brsrKpi: 'P1.5', esrs: 'G1-4', gri: '205-3', issb: '\u2014', sfdrPai: 'PAI-17', metric: 'Anti-corruption' },
];

// BRSR scoring methodology
export function scoreBRSR(company) {
  // Returns a 0-100 composite BRSR score
  const guard = (n, d) => d > 0 ? n / d : 0;
  let totalScore = 0;
  BRSR_PRINCIPLES.forEach(p => {
    const kpiScores = p.kpis.map(kpi => {
      const val = company[kpi.id] || company[kpi.metric?.toLowerCase().replace(/[^a-z0-9]/g, '_')];
      if (val === undefined || val === null) return 0.5; // missing data = 50%
      if (kpi.type === 'boolean') return val ? 1 : 0;
      if (kpi.type === 'percentage') return Math.min(1, val / 100);
      return Math.min(1, val / 100); // normalize numbers
    });
    const principleScore = guard(kpiScores.reduce((s, v) => s + v, 0), kpiScores.length);
    totalScore += principleScore * p.weight;
  });
  return Math.round(totalScore * 100);
}

// Get BRSR completeness (% of KPIs with data)
export function getBRSRCompleteness(company) {
  let total = 0, filled = 0;
  BRSR_PRINCIPLES.forEach(p => {
    p.kpis.forEach(kpi => {
      total++;
      const val = company[kpi.id];
      if (val !== undefined && val !== null) filled++;
    });
  });
  return total > 0 ? Math.round(filled / total * 100) : 0;
}

// Get BRSR Core assurance readiness (% of core KPIs with data)
export function getBRSRCoreReadiness(company) {
  let total = BRSR_CORE_KPIS.length, filled = 0;
  BRSR_CORE_KPIS.forEach(kpiId => {
    if (company[kpiId] !== undefined && company[kpiId] !== null) filled++;
  });
  return total > 0 ? Math.round(filled / total * 100) : 0;
}

export default { BRSR_PRINCIPLES, BRSR_CORE_KPIS, BRSR_CROSSWALK, scoreBRSR, getBRSRCompleteness, getBRSRCoreReadiness };
