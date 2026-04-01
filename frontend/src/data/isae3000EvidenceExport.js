/**
 * isae3000EvidenceExport.js — ENH-015
 * ISAE 3000 (Revised) Assurance Evidence Package Builder
 *
 * Reference:
 *   ISAE 3000 (Revised) — Assurance Engagements Other than Audits or Reviews (IAASB, 2013)
 *   CSRD Art. 34 — Assurance of sustainability reporting (EU Directive 2022/2464)
 *   EFRAG ESRS 1 §§ 50-86 — Materiality assessment
 *   EU Commission limited assurance standard (expected 2026)
 *   CSAAS — Certified Sustainability Assurance Standard (proposed)
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EVIDENCE CATEGORIES (7 categories across ISAE 3000 engagement phases)
// ═══════════════════════════════════════════════════════════════════════════════

export const EVIDENCE_CATEGORIES = [
  {
    id: 'EC1',
    label: 'Engagement Acceptance & Planning',
    citation: 'ISAE 3000 §§ 24–38',
    phase: 'Planning',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC1-01', desc: 'Engagement letter signed by practitioner and management', weight: 10, esrsRef: 'ISAE 3000 §26', minForLimited: true },
      { id: 'EC1-02', desc: 'Independence declaration (IESBA Code §§ 291–292 — non-assurance services check)', weight: 10, esrsRef: 'ISAE 3000 §27', minForLimited: true },
      { id: 'EC1-03', desc: 'Scope, materiality threshold and criteria agreed with management', weight: 8, esrsRef: 'CSRD Art. 34(2)', minForLimited: true },
      { id: 'EC1-04', desc: 'Practitioner competency evidence (ESG assurance experience, CPD records)', weight: 7, esrsRef: 'ISAE 3000 §25', minForLimited: false },
      { id: 'EC1-05', desc: 'Engagement risk assessment and preliminary planning memo', weight: 8, esrsRef: 'ISAE 3000 §31', minForLimited: true },
      { id: 'EC1-06', desc: 'Quality control partner review / engagement quality control review', weight: 7, esrsRef: 'ISAE 3000 §33', minForLimited: false },
    ],
  },
  {
    id: 'EC2',
    label: 'Double Materiality Assessment',
    citation: 'CSRD Art. 2–3; ESRS 1 §§ 50–79',
    phase: 'Entity Understanding',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC2-01', desc: 'Materiality assessment methodology documented (IAO + Financial materiality criteria)', weight: 15, esrsRef: 'ESRS 1 §53', minForLimited: true },
      { id: 'EC2-02', desc: 'Stakeholder engagement evidence (surveys, interviews, workshops — ESRS 1 §22)', weight: 12, esrsRef: 'ESRS 1 §22', minForLimited: true },
      { id: 'EC2-03', desc: 'Value chain mapping with significant upstream/downstream entities identified', weight: 10, esrsRef: 'ESRS 1 §62', minForLimited: true },
      { id: 'EC2-04', desc: 'Business model description linking sustainability matters to strategy', weight: 8, esrsRef: 'ESRS 2 §40', minForLimited: false },
      { id: 'EC2-05', desc: 'Material IRO (Impacts, Risks, Opportunities) registry with threshold justification', weight: 12, esrsRef: 'ESRS 1 §53(b)', minForLimited: true },
      { id: 'EC2-06', desc: 'Management review and board approval of DMA results', weight: 10, esrsRef: 'ESRS G1 §6', minForLimited: false },
    ],
  },
  {
    id: 'EC3',
    label: 'Reporting Boundary & Scope',
    citation: 'ESRS 1 §§ 5–25; GHG Protocol Corporate Standard',
    phase: 'Scoping',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC3-01', desc: 'Consolidation approach documented (equity share / operational control / financial control)', weight: 10, esrsRef: 'ESRS 1 §64', minForLimited: true },
      { id: 'EC3-02', desc: 'GHG scope 1/2/3 boundary definition with exclusion rationale', weight: 12, esrsRef: 'ESRS E1 §26', minForLimited: true },
      { id: 'EC3-03', desc: 'Significant subsidiaries, JVs, and associates included/excluded list', weight: 8, esrsRef: 'ESRS 1 §5', minForLimited: true },
      { id: 'EC3-04', desc: 'Base year definition and structural change recalculation policy', weight: 8, esrsRef: 'ESRS E1 §27', minForLimited: false },
      { id: 'EC3-05', desc: 'Scope 3 category selection methodology with materiality rationale', weight: 10, esrsRef: 'ESRS E1 §44', minForLimited: false },
    ],
  },
  {
    id: 'EC4',
    label: 'Data Collection & Measurement',
    citation: 'ESRS 1 §§ 26–42; GHG Protocol Scope 2 Guidance',
    phase: 'Evidence Gathering',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC4-01', desc: 'Emission factor register (DEFRA, IPCC AR5/AR6, ecoinvent, IEA, or company-specific)', weight: 12, esrsRef: 'ESRS E1 §27', minForLimited: true },
      { id: 'EC4-02', desc: 'Data collection procedures manual (meter reads, utility invoices, estimation methodology)', weight: 10, esrsRef: 'ESRS 1 §30', minForLimited: true },
      { id: 'EC4-03', desc: 'Data quality assessment per ESRS disclosure (completeness, accuracy, timeliness)', weight: 12, esrsRef: 'ESRS 1 §32', minForLimited: true },
      { id: 'EC4-04', desc: 'IT system and source data extracts with version control / audit log evidence', weight: 8, esrsRef: 'ISAE 3000 §47', minForLimited: false },
      { id: 'EC4-05', desc: 'Estimation methodology documentation for data gaps (closures, acquisitions)', weight: 8, esrsRef: 'ESRS 1 §28', minForLimited: false },
      { id: 'EC4-06', desc: 'Third-party data provider agreements and data lineage documentation', weight: 7, esrsRef: 'ESRS 1 §30', minForLimited: false },
    ],
  },
  {
    id: 'EC5',
    label: 'Internal Controls Assessment',
    citation: 'ISAE 3000 §§ 52–66; COSO Internal Control Framework',
    phase: 'Controls',
    requiredForLimited: false,
    requiredForReasonable: true,
    items: [
      { id: 'EC5-01', desc: 'Sustainability governance structure (board oversight, ESG committee charter)', weight: 12, esrsRef: 'ESRS G1 §6', minForLimited: false },
      { id: 'EC5-02', desc: 'Management review and sign-off procedures for sustainability data (authorisation chain)', weight: 10, esrsRef: 'CSRD Art. 34', minForLimited: false },
      { id: 'EC5-03', desc: 'Internal audit report on sustainability data controls (or equivalent assurance)', weight: 10, esrsRef: 'ISAE 3000 §54', minForLimited: false },
      { id: 'EC5-04', desc: 'Reconciliation procedures between financial and sustainability data systems', weight: 8, esrsRef: 'ESRS E1 §26', minForLimited: false },
      { id: 'EC5-05', desc: 'Change management procedures for methodology updates and restatements', weight: 7, esrsRef: 'ESRS 1 §28', minForLimited: false },
    ],
  },
  {
    id: 'EC6',
    label: 'Substantive Testing',
    citation: 'ISAE 3000 §§ 49–66 (Limited) / §§ 67–88 (Reasonable)',
    phase: 'Testing',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC6-01', desc: 'Analytical procedures — YoY comparison, peer benchmarking, trend analysis', weight: 12, esrsRef: 'ISAE 3000 §54', minForLimited: true },
      { id: 'EC6-02', desc: 'Sample testing of primary data sources (meter reads, utility invoices, contracts)', weight: 14, esrsRef: 'ISAE 3000 §67', minForLimited: false },
      { id: 'EC6-03', desc: 'Independent recalculation of material GHG / KPI figures by practitioner', weight: 14, esrsRef: 'ISAE 3000 §68', minForLimited: false },
      { id: 'EC6-04', desc: 'Inquiry responses from sustainability controller, CFO, and CSRD officer', weight: 10, esrsRef: 'ISAE 3000 §49', minForLimited: true },
      { id: 'EC6-05', desc: 'Management representation letter (signed by CEO/CFO)', weight: 10, esrsRef: 'ISAE 3000 §58', minForLimited: true },
      { id: 'EC6-06', desc: 'Exception and deviation log with resolution documentation', weight: 8, esrsRef: 'ISAE 3000 §70', minForLimited: false },
    ],
  },
  {
    id: 'EC7',
    label: 'Conclusion & Assurance Report',
    citation: 'ISAE 3000 §§ 77–88',
    phase: 'Conclusion',
    requiredForLimited: true,
    requiredForReasonable: true,
    items: [
      { id: 'EC7-01', desc: 'Draft assurance report with all required ISAE 3000 elements (title, addressee, scope, conclusion)', weight: 15, esrsRef: 'ISAE 3000 §77', minForLimited: true },
      { id: 'EC7-02', desc: 'Materiality threshold documentation — quantitative ($) and qualitative criteria', weight: 10, esrsRef: 'ISAE 3000 §36', minForLimited: true },
      { id: 'EC7-03', desc: 'Qualified/emphasis matters documentation (if any modification to conclusion required)', weight: 10, esrsRef: 'ISAE 3000 §82', minForLimited: false },
      { id: 'EC7-04', desc: 'Subsequent events review — post period-end to report date', weight: 8, esrsRef: 'ISAE 3000 §57', minForLimited: false },
      { id: 'EC7-05', desc: 'Final signed assurance report appended to sustainability statement filing', weight: 14, esrsRef: 'CSRD Art. 34(4)', minForLimited: true },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. STATUS DEFINITIONS & HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

export const EVIDENCE_STATUSES = ['Complete', 'In Progress', 'Not Started', 'Waived'];
const STATUS_SCORE = { Complete: 1.0, 'In Progress': 0.5, Waived: 0.3, 'Not Started': 0 };

export function evidenceStatusColor(status) {
  return {
    Complete: '#16a34a',
    'In Progress': '#d97706',
    Waived: '#0891b2',
    'Not Started': '#dc2626',
  }[status] || '#9aa3ae';
}

export function opinionColor(opinion) {
  if (opinion.startsWith('Unmodified')) return '#16a34a';
  if (opinion.startsWith('Emphasis')) return '#d97706';
  if (opinion.startsWith('Qualified')) return '#f97316';
  return '#dc2626';
}

// Deterministic status for demo (seeded)
function seededStatus(seed) {
  const v = Math.abs(Math.sin(seed * 7.3 + 2.1) * 10000) % 1;
  if (v < 0.50) return 'Complete';
  if (v < 0.72) return 'In Progress';
  if (v < 0.86) return 'Waived';
  return 'Not Started';
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. EVIDENCE PACKAGE BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a full ISAE 3000 evidence package for a single company.
 *
 * @param {object} company   - { name, ticker, sector, country, overallReadiness (0–100) }
 * @param {'Limited'|'Reasonable'} assuranceLevel
 * @param {number} seed      - Deterministic seed for demo data
 * @returns {object}         Full evidence package with categories, items, scores, and opinion
 */
export function buildEvidencePackage(company, assuranceLevel = 'Limited', seed = 1) {
  const relevantCats = EVIDENCE_CATEGORIES.filter(ec =>
    assuranceLevel === 'Limited' ? ec.requiredForLimited : ec.requiredForReasonable
  );

  const categories = relevantCats.map((ec, ci) => {
    const items = ec.items
      .filter(item => assuranceLevel === 'Reasonable' || item.minForLimited || !ec.requiredForReasonable)
      .map((item, ii) => {
        const status = seededStatus(seed * 31 + ci * 17 + ii * 7);
        const score = STATUS_SCORE[status] * item.weight;
        const auditorNote = status === 'Complete'
          ? `Evidence obtained and reviewed — no issues noted. Ref: ${item.esrsRef}`
          : status === 'In Progress'
          ? `Evidence partially obtained. Outstanding: ${['management sign-off', 'supporting documentation', 'third-party confirmation', 'reconciliation'][ii % 4]}`
          : status === 'Waived'
          ? `Waived: not applicable under ${assuranceLevel} assurance scope`
          : `Not yet started — required by ${ec.citation}`;

        return {
          ...item,
          status,
          score,
          auditorNote,
          dueDate: (status === 'Not Started' || status === 'In Progress')
            ? new Date(Date.now() + (ci * 3 + ii + 1) * 7 * 24 * 3600 * 1000).toISOString().slice(0, 10)
            : null,
          priority: item.minForLimited && status !== 'Complete' ? 'High' : status === 'Not Started' ? 'Medium' : 'Low',
        };
      });

    const maxScore = items.reduce((s, i) => s + i.weight, 0);
    const actualScore = items.reduce((s, i) => s + i.score, 0);
    const pct = maxScore > 0 ? Math.round((actualScore / maxScore) * 100) : 0;

    return {
      ...ec,
      items,
      completionPct: pct,
      status: pct >= 90 ? 'Complete' : pct >= 45 ? 'In Progress' : 'Not Started',
      criticalGaps: items.filter(i => i.minForLimited && i.status === 'Not Started').length,
    };
  });

  const allItems = categories.flatMap(c => c.items);
  const totalWeight = allItems.reduce((s, i) => s + i.weight, 0);
  const totalScore = allItems.reduce((s, i) => s + i.score, 0);
  const overallPct = totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  const criticalGapsTotal = categories.reduce((s, c) => s + c.criticalGaps, 0);

  const opinion = overallPct >= 90
    ? 'Unmodified opinion — sustainability statement presents fairly in all material respects'
    : overallPct >= 72
    ? 'Emphasis of matter — material uncertainty noted in data completeness for selected disclosures'
    : overallPct >= 50
    ? 'Qualified opinion — scope limitation: insufficient evidence for one or more material disclosures'
    : 'Disclaimer of opinion — practitioner unable to form conclusion; insufficient evidence obtained';

  const reportingYear = new Date().getFullYear() - 1;

  return {
    packageId: `ISAE3000-${(company.ticker || 'UNK').replace(/[.\s]/g, '-')}-FY${reportingYear}`,
    company,
    assuranceLevel,
    reportingPeriod: `FY${reportingYear} (1 January – 31 December ${reportingYear})`,
    framework: 'ISAE 3000 (Revised) | CSRD Art. 34 | EFRAG ESRS 1',
    generatedAt: new Date().toISOString(),
    practitioner: {
      name: 'Big 4 / Accredited CSAAS Practitioner',
      independence: 'Confirmed independent per IESBA Code §§ 291–292',
      competency: 'Certified Sustainability Assurance Professional + ESRS specialist',
    },
    categories,
    summary: {
      overallCompletionPct: overallPct,
      opinion,
      totalCategories: categories.length,
      totalItems: allItems.length,
      completeItems: allItems.filter(i => i.status === 'Complete').length,
      inProgressItems: allItems.filter(i => i.status === 'In Progress').length,
      notStartedItems: allItems.filter(i => i.status === 'Not Started').length,
      waivedItems: allItems.filter(i => i.status === 'Waived').length,
      criticalGapsTotal,
      readyForFiling: overallPct >= 80 && criticalGapsTotal === 0,
      estimatedDaysToCompletion: criticalGapsTotal * 7 + allItems.filter(i => i.status === 'In Progress').length * 3,
    },
    opinionText: buildOpinionText(company, assuranceLevel, overallPct, opinion, reportingYear, categories.length),
  };
}

function buildOpinionText(company, level, pct, opinion, year, catCount) {
  return [
    `INDEPENDENT ${level.toUpperCase()} ASSURANCE REPORT`,
    ``,
    `To the Shareholders and Board of Directors of ${company.name || 'the Company'}`,
    ``,
    `SCOPE OF OUR ENGAGEMENT`,
    `We have undertaken a ${level.toLowerCase()} assurance engagement on the Sustainability Statement of ${company.name || 'the Company'} ('the Company') for the year ended 31 December ${year}, prepared in accordance with the European Sustainability Reporting Standards (ESRS) as required by the Corporate Sustainability Reporting Directive (CSRD, EU Directive 2022/2464).`,
    ``,
    `PRACTITIONERS' RESPONSIBILITY`,
    `Our responsibility is to form a ${level.toLowerCase()} assurance conclusion based on the evidence obtained across ${catCount} evidence categories. We conducted our engagement in accordance with International Standard on Assurance Engagements (ISAE) 3000 (Revised), 'Assurance Engagements Other than Audits or Reviews of Historical Financial Information', issued by the IAASB.`,
    ``,
    `${level === 'Limited' ? 'PROCEDURES (LIMITED ASSURANCE)' : 'PROCEDURES (REASONABLE ASSURANCE)'}`,
    level === 'Limited'
      ? `A limited assurance engagement is substantially less in scope than a reasonable assurance engagement. Our procedures included: inquiries of management and personnel; analytical procedures; review of documentation and evidence as described in the attached evidence package (completion: ${pct}%).`
      : `A reasonable assurance engagement involves performing extensive procedures to obtain sufficient appropriate evidence. Our procedures included: assessment of internal controls; substantive testing; independent recalculation of material figures; sample-based testing of primary data sources; and inspection of supporting documentation (completion: ${pct}%).`,
    ``,
    `CONCLUSION`,
    opinion === 'Unmodified opinion — sustainability statement presents fairly in all material respects'
      ? `Based on our procedures and evidence obtained, ${level === 'Limited' ? 'nothing has come to our attention that causes us to believe' : 'in our opinion'} the Sustainability Statement does not, in all material respects, comply with the applicable ESRS criteria and CSRD requirements.`
      : `Based on our procedures, we are unable to form an unmodified conclusion. ${opinion}`,
    ``,
    `Evidence Package Reference: ISAE3000-${(company.ticker || 'UNK').replace(/[.\s]/g, '-')}-FY${year}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. PORTFOLIO-LEVEL READINESS SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate quick assurance readiness for a portfolio of companies.
 * @param {Array} companies - Array of company objects
 * @param {'Limited'|'Reasonable'} assuranceLevel
 * @returns {Array} Per-company readiness summary
 */
export function getPortfolioAssuranceReadiness(companies, assuranceLevel = 'Limited') {
  return companies.map((c, i) => {
    const pkg = buildEvidencePackage(c, assuranceLevel, i + 1);
    return {
      ticker: c.ticker,
      name: c.name,
      sector: c.sector,
      country: c.country,
      completionPct: pkg.summary.overallCompletionPct,
      opinion: pkg.summary.opinion,
      criticalGaps: pkg.summary.criticalGapsTotal,
      readyForFiling: pkg.summary.readyForFiling,
      estimatedDaysToCompletion: pkg.summary.estimatedDaysToCompletion,
      packageId: pkg.packageId,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. EXPORT UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Export evidence package as formatted JSON string */
export function exportEvidencePackageJSON(pkg) {
  return JSON.stringify(pkg, null, 2);
}

/** Download evidence package as JSON file */
export function downloadEvidencePackage(pkg) {
  const json = exportEvidencePackageJSON(pkg);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pkg.packageId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export opinion text as plain-text file */
export function downloadOpinionText(pkg) {
  const blob = new Blob([pkg.opinionText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pkg.packageId}-opinion.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
