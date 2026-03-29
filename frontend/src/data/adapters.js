/**
 * adapters.js — Transform masterUniverse data into module-specific shapes
 *
 * Each adapter converts the canonical COMPANY_UNIVERSE records into the
 * exact field names / structures that individual feature modules expect,
 * so modules can migrate off their inline generated data incrementally.
 *
 * All adapters are pure functions: (source, ...extras) => transformedArray
 */

import { COMPANY_UNIVERSE } from './masterUniverse';

// ─── Deterministic PRNG (matches masterUniverse) ────────────────────────────
const sr = (s) => { let x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };

// ─── Safe accessors ─────────────────────────────────────────────────────────
const num = (v, fallback = 0) => (v != null && !isNaN(v) ? +v : fallback);
const str = (v, fallback = '—') => (v != null && v !== '' ? String(v) : fallback);


// ═════════════════════════════════════════════════════════════════════════════
// 1. PCAF Financed Emissions
//    Module expects: { id, name, country, geo, sector, assetClass, evic,
//                      outstanding, totalEmissions, dqs, source }
// ═════════════════════════════════════════════════════════════════════════════

export function adaptForPcaf(companies = COMPANY_UNIVERSE, holdings = []) {
  // If holdings provided, join company data with holding data
  if (holdings.length > 0) {
    return holdings.map((h, idx) => {
      const co = companies.find(c => c.id === h.companyId) || {};
      return {
        id: idx + 1,
        name: str(co.name, h.companyId),
        country: str(co.country),
        geo: str(co.region, 'EMEA'),
        sector: str(co.sector || co.subIndustry),
        assetClass: str(h.assetClass, 'Listed Equity'),
        evic: num(co.marketCap, 100),               // $bn market cap used as EVIC proxy
        outstanding: num(h.outstandingAmount, 0) / 1e6,  // convert to $M
        totalEmissions: num(co.totalEmissions),
        dqs: num(h.pcafScore, 3),                    // PCAF data quality score 1-5
        source: co.cdpScore && co.cdpScore !== 'D-'
          ? `CDP ${co.cdpScore} — ${co.name} Sustainability Report 2023`
          : 'Revenue proxy — EF database',
      };
    });
  }

  // Fallback: generate PCAF rows directly from companies
  return companies.slice(0, 60).map((c, idx) => ({
    id: idx + 1,
    name: str(c.name),
    country: str(c.country),
    geo: str(c.region, 'EMEA'),
    sector: str(c.sector),
    assetClass: str(c.pcafAssetClass, 'Listed Equity'),
    evic: num(c.marketCap, 100),
    outstanding: num(c.revenue, 10) * (5 + sr(idx * 7) * 15),
    totalEmissions: num(c.totalEmissions),
    dqs: Math.min(5, Math.max(1, Math.round(1 + sr(idx * 13) * 4))),
    source: c.cdpScore && c.cdpScore !== 'D-'
      ? `CDP ${c.cdpScore} — ${c.name} Report 2023`
      : 'Revenue proxy — EF database',
  }));
}


// ═════════════════════════════════════════════════════════════════════════════
// 2. ESG Ratings Comparator
//    Module expects: { id, name, sector, country, cap, msci, msciNum,
//                      sust, iss, cdp, cdpNum, sp, bbg, hist[], watchlist, flagged }
// ═════════════════════════════════════════════════════════════════════════════

const MSCI_LEVELS = ['CCC', 'B', 'BB', 'BBB', 'A', 'AA', 'AAA'];
const CDP_LEVELS = ['D-', 'D', 'C-', 'C', 'B-', 'B', 'A-', 'A'];

function msciToNum(rating) {
  const idx = MSCI_LEVELS.indexOf(rating);
  return idx >= 0 ? 7 - idx : 4; // default BBB
}

function cdpToNum(score) {
  const idx = CDP_LEVELS.indexOf(score);
  return idx >= 0 ? 8 - idx : 4; // default C
}

function capBucket(mcap) {
  if (mcap >= 200) return 'Large';
  if (mcap >= 20) return 'Mid';
  return 'Small';
}

export function adaptForEsgRatings(companies = COMPANY_UNIVERSE) {
  return companies.map((c, i) => {
    const msciNum = msciToNum(c.msciRating);
    const cdpNum = cdpToNum(c.cdpScore);

    // Build 12-quarter history from company's quarterlyEmissions + ESG trend
    const hist = (c.quarterlyEmissions || []).map((qe, qi) => {
      const mDrift = Math.min(6, Math.max(0, msciNum - 3 + Math.floor((sr(i * 100 + qi * 17) - 0.5) * 2)));
      const sDrift = Math.min(100, Math.max(0, num(c.sustainalyticsRisk) + Math.floor((sr(i * 100 + qi * 19) - 0.5) * 20)));
      const iDrift = Math.min(10, Math.max(1, +(num(c.issScore) + (sr(i * 100 + qi * 23) - 0.5) * 2).toFixed(1)));
      const cDrift = Math.min(7, Math.max(0, cdpNum - 4 + Math.floor((sr(i * 100 + qi * 29) - 0.5) * 2)));
      const spDrift = Math.min(100, Math.max(0, num(c.spGlobalScore) + Math.floor((sr(i * 100 + qi * 31) - 0.5) * 15)));
      const bDrift = Math.min(100, Math.max(0, num(c.bloombergScore) + Math.floor((sr(i * 100 + qi * 37) - 0.5) * 15)));
      return { q: qe.q || `Q${(qi % 4) + 1} ${2022 + Math.floor(qi / 4)}`, msci: mDrift, sust: sDrift, iss: iDrift, cdp: cDrift, sp: spDrift, bbg: bDrift };
    });

    return {
      id: i,
      name: str(c.name),
      sector: str(c.sector),
      country: str(c.country),
      cap: capBucket(num(c.marketCap)),
      msci: str(c.msciRating, 'BBB'),
      msciNum,
      sust: num(c.sustainalyticsRisk, 40),
      iss: num(c.issScore, 5),
      cdp: str(c.cdpScore, 'C'),
      cdpNum,
      sp: num(c.spGlobalScore, 50),
      bbg: num(c.bloombergScore, 50),
      hist,
      watchlist: false,
      flagged: false,
    };
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// 3. Portfolio Temperature Score
//    Module expects: { id, company, sector, country, weight, temp, sbti,
//                      nearYear, nzYear, engagement, lastEng,
//                      emissions[3], sectorPath[3], notes[3] }
// ═════════════════════════════════════════════════════════════════════════════

const SBTI_MAP = { validated: 'Approved', committed: 'Committed', none: 'No target' };
const ENG_STATUSES = ['Active', 'Pending', 'Not started'];

export function adaptForTemperatureScore(companies = COMPANY_UNIVERSE, holdings = []) {
  const source = holdings.length > 0
    ? holdings.map(h => {
        const co = companies.find(c => c.id === h.companyId) || {};
        return { ...co, _weight: h.weight };
      })
    : companies.slice(0, 60);

  return source.map((c, i) => {
    const seed = i + 7;
    const intensity = num(c.emissionsIntensity, 200);

    // 3-year emissions trajectory (declining ~10% per step)
    const emissions = [
      +(intensity * (0.9 + sr(seed * 31) * 0.3)).toFixed(1),
      +(intensity * (0.8 + sr(seed * 37) * 0.25)).toFixed(1),
      +(intensity * (0.7 + sr(seed * 41) * 0.22)).toFixed(1),
    ];
    const sectorPath = [
      +(intensity * 0.85 * (0.8 + sr(seed * 43) * 0.3)).toFixed(1),
      +(intensity * 0.7 * (0.75 + sr(seed * 47) * 0.3)).toFixed(1),
      +(intensity * 0.55 * (0.7 + sr(seed * 53) * 0.3)).toFixed(1),
    ];

    const nearYear = c.sbtiTarget
      ? parseInt(c.sbtiTarget.match(/\d{4}/)?.[0] || '2030', 10)
      : 2025 + Math.floor(sr(seed * 17) * 6);

    const nzYear = num(c.netZeroYear, 2040 + Math.floor(sr(seed * 19) * 11));

    const engIdx = Math.floor(sr(seed * 13) * 3);
    const lastEng = `2025-${String(Math.floor(sr(seed * 23) * 12 + 1)).padStart(2, '0')}-${String(Math.floor(sr(seed * 29) * 28 + 1)).padStart(2, '0')}`;

    return {
      id: i,
      company: str(c.name, `Company ${i + 1}`),
      sector: str(c.sector),
      country: str(c.country),
      weight: num(c._weight, +(0.4 + sr(seed * 7) * 3.2).toFixed(2)),
      temp: num(c.temperatureScore, +(1.2 + sr(seed * 3) * 3.6).toFixed(2)),
      sbti: SBTI_MAP[c.sbtiStatus] || 'No target',
      nearYear,
      nzYear,
      engagement: ENG_STATUSES[engIdx],
      lastEng,
      emissions,
      sectorPath,
      notes: [
        `Initial outreach sent ${lastEng}. Awaiting board-level response.`,
        `Follow-up call scheduled. CFO confirmed net-zero commitment in principle.`,
        `SBTi submission draft reviewed. Target year confirmed as ${nearYear}.`,
      ],
    };
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// 4. Climate Stress Test
//    Module expects sectors: { id, name, basePD, nzMult, dtMult, hhMult,
//                              transRisk, physRisk, reg, ebitda }
//    And borrowers:          { id, name, sector, sectorId, country, exposure,
//                              basePD, nzStressedPD, dtStressedPD, hhStressedPD,
//                              eclUpliftNz, eclUpliftDt, eclUpliftHh }
// ═════════════════════════════════════════════════════════════════════════════

// Map masterUniverse sectors to stress-test sector archetypes
const STRESS_SECTOR_MAP = {
  'Oil & Gas':            { basePD: 2.1, nzMult: 2.4, dtMult: 1.6, hhMult: 1.3, transRisk: 8, physRisk: 6, reg: 'ETS, CBAM',     ebitda: 31 },
  'Integrated Oil':       { basePD: 2.3, nzMult: 2.5, dtMult: 1.7, hhMult: 1.3, transRisk: 8, physRisk: 5, reg: 'ETS, CBAM',     ebitda: 34 },
  'Mining & Metals':      { basePD: 1.8, nzMult: 1.9, dtMult: 1.4, hhMult: 1.2, transRisk: 6, physRisk: 5, reg: 'CBAM',          ebitda: 22 },
  'Electric Utilities':   { basePD: 2.2, nzMult: 2.0, dtMult: 1.5, hhMult: 1.3, transRisk: 7, physRisk: 5, reg: 'ETS, MEES',     ebitda: 28 },
  'Steel & Cement':       { basePD: 2.5, nzMult: 2.4, dtMult: 1.7, hhMult: 1.2, transRisk: 8, physRisk: 4, reg: 'ETS, CBAM',     ebitda: 34 },
  'Chemicals':            { basePD: 1.8, nzMult: 1.9, dtMult: 1.4, hhMult: 1.2, transRisk: 6, physRisk: 4, reg: 'CBAM, REACH',   ebitda: 24 },
  'Automobiles':          { basePD: 2.0, nzMult: 2.2, dtMult: 1.6, hhMult: 1.2, transRisk: 7, physRisk: 3, reg: 'ZEV mandate',    ebitda: 26 },
  'Airlines & Shipping':  { basePD: 2.8, nzMult: 2.1, dtMult: 1.6, hhMult: 1.5, transRisk: 7, physRisk: 6, reg: 'ETS, CORSIA',   ebitda: 24 },
  'Technology':           { basePD: 0.7, nzMult: 0.8, dtMult: 0.9, hhMult: 0.9, transRisk: 2, physRisk: 3, reg: 'Data centres',   ebitda: 6  },
  'Semiconductors':       { basePD: 0.9, nzMult: 0.9, dtMult: 1.0, hhMult: 0.9, transRisk: 2, physRisk: 3, reg: 'Supply chain',   ebitda: 8  },
  'Banks':                { basePD: 1.0, nzMult: 1.2, dtMult: 1.3, hhMult: 1.1, transRisk: 4, physRisk: 3, reg: 'ECB/PRA stress', ebitda: 12 },
  'Insurance':            { basePD: 1.1, nzMult: 1.3, dtMult: 1.2, hhMult: 1.4, transRisk: 4, physRisk: 5, reg: 'ORSA',           ebitda: 14 },
  'Diversified Financials':{ basePD: 1.0, nzMult: 1.2, dtMult: 1.2, hhMult: 1.1, transRisk: 3, physRisk: 3, reg: 'SFDR',          ebitda: 10 },
  'Consumer Staples':     { basePD: 1.2, nzMult: 1.3, dtMult: 1.2, hhMult: 1.5, transRisk: 4, physRisk: 7, reg: 'CBAM (agri)',    ebitda: 14 },
  'Consumer Discretionary':{ basePD: 1.3, nzMult: 1.4, dtMult: 1.3, hhMult: 1.3, transRisk: 4, physRisk: 4, reg: 'Supply chain',  ebitda: 15 },
  'Pharmaceuticals':      { basePD: 0.8, nzMult: 0.9, dtMult: 1.0, hhMult: 1.0, transRisk: 2, physRisk: 3, reg: 'Minimal',        ebitda: 7  },
  'Healthcare Equipment': { basePD: 0.9, nzMult: 1.0, dtMult: 1.0, hhMult: 1.0, transRisk: 2, physRisk: 3, reg: 'Minimal',        ebitda: 8  },
  'Industrials':          { basePD: 1.5, nzMult: 1.6, dtMult: 1.4, hhMult: 1.2, transRisk: 5, physRisk: 4, reg: 'ETS (scope 3)',  ebitda: 18 },
  'Real Estate':          { basePD: 1.4, nzMult: 1.6, dtMult: 1.3, hhMult: 1.4, transRisk: 5, physRisk: 6, reg: 'MEES, SFDR',    ebitda: 18 },
  'Telecom':              { basePD: 1.0, nzMult: 1.1, dtMult: 1.1, hhMult: 1.0, transRisk: 2, physRisk: 4, reg: 'Minimal',        ebitda: 9  },
};

const DEFAULT_STRESS = { basePD: 1.5, nzMult: 1.4, dtMult: 1.3, hhMult: 1.2, transRisk: 4, physRisk: 4, reg: 'General', ebitda: 15 };

export function adaptForStressTest(companies = COMPANY_UNIVERSE) {
  // Build unique sector rows from the companies actually in the portfolio
  const sectorSet = new Map();
  companies.forEach(c => {
    if (!sectorSet.has(c.sector)) {
      const profile = STRESS_SECTOR_MAP[c.sector] || DEFAULT_STRESS;
      sectorSet.set(c.sector, {
        id: `s${sectorSet.size + 1}`,
        name: c.sector,
        ...profile,
      });
    }
  });
  const sectors = Array.from(sectorSet.values());

  // Build borrower-level rows (one per company)
  const borrowers = companies.map((c, i) => {
    const profile = STRESS_SECTOR_MAP[c.sector] || DEFAULT_STRESS;
    const sectorRow = sectorSet.get(c.sector);
    const noise = sr(i * 11) * 0.8 - 0.4;
    const bpd = Math.max(0.3, Math.round((profile.basePD + noise) * 100) / 100);
    const exposure = Math.round(num(c.revenue, 10) * (1 + sr(i * 5) * 4) * 10) / 10;

    return {
      id: i + 1,
      name: str(c.name),
      sector: str(c.sector),
      sectorId: sectorRow ? sectorRow.id : 's1',
      country: str(c.country),
      exposure,
      basePD: bpd,
      nzStressedPD:  Math.round(bpd * profile.nzMult * 100) / 100,
      dtStressedPD:  Math.round(bpd * profile.dtMult * 100) / 100,
      hhStressedPD:  Math.round(bpd * profile.hhMult * 100) / 100,
      eclUpliftNz: Math.round(bpd * (profile.nzMult - 1) * exposure * 0.45 * 10) / 10,
      eclUpliftDt: Math.round(bpd * (profile.dtMult - 1) * exposure * 0.45 * 10) / 10,
      eclUpliftHh: Math.round(bpd * (profile.hhMult - 1) * exposure * 0.45 * 10) / 10,
    };
  });

  return { sectors, borrowers };
}


// ═════════════════════════════════════════════════════════════════════════════
// 5. Generic Table Adapter
//    Select and rename fields from company records for any tabular display.
//    fieldMap = { targetField: 'sourceField' | (company) => value }
// ═════════════════════════════════════════════════════════════════════════════

export function adaptForTable(companies = COMPANY_UNIVERSE, fieldMap = {}) {
  return companies.map((c, i) => {
    const row = { _idx: i };
    for (const [target, source] of Object.entries(fieldMap)) {
      if (typeof source === 'function') {
        row[target] = source(c, i);
      } else if (source in c) {
        row[target] = c[source];
      } else {
        row[target] = null;
      }
    }
    return row;
  });
}


// ═════════════════════════════════════════════════════════════════════════════
// 6. Generic Company List Adapter
//    Extract a subset of fields from company records, with optional defaults.
//    fields = ['name', 'sector', ...] — picks those fields from each company
// ═════════════════════════════════════════════════════════════════════════════

export function adaptCompanyList(companies = COMPANY_UNIVERSE, fields = []) {
  if (!fields.length) {
    // Return all fields if none specified
    return companies.map((c, i) => ({ ...c, _idx: i }));
  }
  return companies.map((c, i) => {
    const row = { _idx: i };
    fields.forEach(f => { row[f] = c[f] != null ? c[f] : null; });
    return row;
  });
}
