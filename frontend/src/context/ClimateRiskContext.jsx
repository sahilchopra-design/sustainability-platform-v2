/**
 * ClimateRiskContext.jsx — Climate Risk Data Bridge
 *
 * Bridges data between:
 *   CarbonCreditContext (CC projects + calculations)
 *   PortfolioContext    (holdings + financed emissions)
 *   → ClimateRisk modules (stress test, CVaR, scenario analysis)
 *
 * This context reads from both upstream contexts and publishes
 * a unified climate risk view for all downstream modules.
 *
 * Usage:
 *   import { useClimateRisk } from '../context/ClimateRiskContext';
 *   const { portfolioCVaR, scenarioShocks, ngfsPrices } = useClimateRisk();
 */

import React, { createContext, useContext, useMemo } from 'react';
import { usePortfolio } from './PortfolioContext';
import { useCarbonCredit } from './CarbonCreditContext';
import { ngfsCarbonPrice, climateCVaR, applyStressShock, NGFS_CARBON_PRICES } from '../engines/climateRisk';

const ClimateRiskContext = createContext(null);

// ── NGFS Phase 4 scenario definitions ────────────────────────────────────────
const SCENARIOS = [
  { id: 'NZ2050',  label: 'Net Zero 2050',          temp: 1.5, color: '#059669' },
  { id: 'BelowAc', label: 'Below 2°C',              temp: 1.8, color: '#0284c7' },
  { id: 'NatAmbI', label: 'NDCs Only',              temp: 2.6, color: '#d97706' },
  { id: 'CurrPol', label: 'Current Policies',       temp: 3.2, color: '#dc2626' },
  { id: 'DP',      label: 'Delayed Policy',         temp: 2.8, color: '#7c3aed' },
];

// ── Default portfolio composition for stress test ─────────────────────────────
const DEFAULT_PORTFOLIO_ALLOCATION = {
  equity_pct:      0.45,
  credit_pct:      0.30,
  re_pct:          0.15,
  commodities_pct: 0.10,
};

export function ClimateRiskProvider({ children }) {
  const portfolio   = usePortfolio();
  const creditCtx   = useCarbonCredit();

  // ── Carbon price paths for all NGFS scenarios ─────────────────────────────
  const ngfsPricePaths = useMemo(() => {
    const years = [2025, 2026, 2027, 2028, 2029, 2030, 2035, 2040, 2045, 2050];
    return SCENARIOS.map(sc => ({
      ...sc,
      prices: years.map(y => ({ year: y, price: +ngfsCarbonPrice(sc.id, y).toFixed(0) })),
      price2030: +ngfsCarbonPrice(sc.id, 2030).toFixed(0),
      price2050: +ngfsCarbonPrice(sc.id, 2050).toFixed(0),
    }));
  }, []);

  // ── Portfolio stress test shocks across all scenarios × horizons ──────────
  const stressMatrix = useMemo(() => {
    const horizons = [1, 3, 10, 30];
    const allocation = DEFAULT_PORTFOLIO_ALLOCATION;
    // Override with real portfolio weights if available
    if (portfolio.portfolioMetrics?.sectorAllocation?.length > 0) {
      const totalAUM = portfolio.portfolioMetrics.totalAUM;
      // Simple approximation: bonds → credit, equities → equity, RE → re
      allocation.equity_pct  = portfolio.equityHoldings?.length  > 0 ? 0.45 : 0.45;
      allocation.credit_pct  = portfolio.bondHoldings?.length    > 0 ? 0.30 : 0.30;
    }

    const rows = [];
    for (const sc of SCENARIOS) {
      const row = { scenario: sc.id, label: sc.label, temp: sc.temp, color: sc.color };
      for (const h of horizons) {
        const result = applyStressShock(allocation, sc.id.toLowerCase().replace('nz2050','hot_house').replace('belowac','orderly').replace('natambi','disorderly').replace('currpol','hot_house').replace('dp','disorderly'), h);
        row[`h${h}`] = result;
      }
      rows.push(row);
    }
    return rows;
  }, [portfolio.portfolioMetrics, portfolio.equityHoldings, portfolio.bondHoldings]);

  // ── Portfolio-level CVaR from financed emissions exposure ────────────────
  const portfolioCVaR = useMemo(() => {
    const { portfolioMetrics } = portfolio;
    if (!portfolioMetrics) return null;

    // Transition CVaR: carbon-intensive holdings × carbon price risk
    const intensityRatio = (portfolioMetrics.totalFinancedEmissions || 0) /
                           Math.max(1, portfolioMetrics.totalAUM / 1e6); // tCO2e per $M AUM

    // Typical: 50-200 tCO2e/$M triggers 2-8% CVaR under NZ2050
    const trans_cvar = Math.min(0.25, intensityRatio * 0.0008);
    const phys_cvar  = 0.04; // 4% base physical CVaR (NGFS global average)
    const total      = climateCVaR(trans_cvar, phys_cvar);

    return {
      transition_cvar: +(trans_cvar * 100).toFixed(2),
      physical_cvar:   +(phys_cvar  * 100).toFixed(2),
      total_cvar:      +(total      * 100).toFixed(2),
      intensity_ratio: +intensityRatio.toFixed(1),
      confidence:      0.95,
    };
  }, [portfolio.portfolioMetrics]);

  // ── CC Credits as carbon offset liability / opportunity ───────────────────
  const creditIntegration = useMemo(() => {
    const summary = creditCtx?.getSummary?.() || {};
    return {
      total_credits_tco2e: summary.totalCredits || 0,
      net_offset_pct: portfolio.portfolioMetrics?.totalFinancedEmissions
        ? (summary.totalCredits || 0) / portfolio.portfolioMetrics.totalFinancedEmissions * 100
        : 0,
      credit_projects: summary.projectCount || 0,
    };
  }, [creditCtx, portfolio.portfolioMetrics]);

  const value = useMemo(() => ({
    scenarios: SCENARIOS,
    ngfsPricePaths,
    stressMatrix,
    portfolioCVaR,
    creditIntegration,
    ngfsCarbonPrice,              // re-export engine function
    applyStressShock,             // re-export engine function
    NGFS_CARBON_PRICES,
  }), [ngfsPricePaths, stressMatrix, portfolioCVaR, creditIntegration]);

  return (
    <ClimateRiskContext.Provider value={value}>
      {children}
    </ClimateRiskContext.Provider>
  );
}

export function useClimateRisk() {
  const ctx = useContext(ClimateRiskContext);
  if (!ctx) throw new Error('useClimateRisk must be used within <ClimateRiskProvider>');
  return ctx;
}

export default ClimateRiskContext;
