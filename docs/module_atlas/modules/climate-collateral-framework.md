# Climate Collateral Framework
**Module ID:** `climate-collateral-framework` · **Route:** `/climate-collateral-framework` · **Tier:** B (frontend-computed) · **EP code:** — · **Sprint:** —

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `AC_AGE_ADDON`, `CII_ADDON`, `CLASSES`, `CLASS_NAMES`, `COLLATERAL`, `Card`, `ClimateCollateralFrameworkPage`, `DATA_REGISTER`, `DEFAULT_CFG`, `EPC_BANDS`, `EngineTab`, `GovernanceTab`, `HAZARDS`, `HAZARD_W`, `HORIZONS`, `LIMITS`, `LOD_ROLES`, `LTV_BANDS`, `LgdTab`, `MATURITY_DIMS`, `MEES_SCENARIOS`, `POLICY_AMENDMENTS`, `PhysicalTab`, `Pill`, `REG_ITEMS`, `ROADMAP`, `RegisterTab`, `RegulatoryTab`, `SCENARIOS`, `SCENARIO_NAMES`, `Select`, `Slider`, `Stat`, `TRIGGERS`, `Tab`, `TransitionTab`

**Seed dataset schemas (record structure of each in-page dataset):**

| Dataset | Rows | Fields |
|---|---|---|
| `LTV_BANDS` | 6 | `lo`, `hi` |
| `REG_ITEMS` | 19 | `ref`, `req`, `element`, `status`, `owner` |
| `LIMITS` | 7 | `label`, `limit`, `current` |
| `ROADMAP` | 5 | `items` |

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `HAZARDS` | `['River Flood','Coastal Flood','Wildfire','Cyclone/Storm','Heat Stress','Drought','Subsidence'];` |
| `CII_ADDON` | `{ A:0, B:2, C:5, D:12, E:22 };  // IMO CII rating → charter-value haircut add-on %` |
| `AC_AGE_ADDON` | `age => (age > 15 ? 14 : age > 10 ? 8 : age > 5 ? 4 : 1); // ICAO CO₂ std proxy` |
| `raw` | `Math.max(0, physComposite(it) - 0.2) / 0.8;        // normalise: all-1 scores → 0` |
| `grossDmg` | `raw * raw * 55;                                // convex, max 55% of value` |
| `uninsured` | `1 - insEffective(it, horizon, retreatYear) * 0.9;` |
| `total` | `Math.min(90, base + phys + trans + stale);` |
| `adjValue` | `it.value * (1 - total / 100);` |
| `coverage` | `Math.min(1, adjValue / it.loan);` |
| `fmtM` | `v => `€${v >= 1000 ? (v/1000).toFixed(2) + 'bn' : v.toFixed(0) + 'm'}`;` |
| `countries` | `useMemo(() => ['All', ...new Set(COLLATERAL.map(c => c.country))].sort(), []);` |
| `rows` | `useMemo(() => COLLATERAL .map(it => ({ ...it, score: physComposite(it) * 100, hc: haircutBreakdown(it, DEFAULT_CFG) })) .filter(it => { if (clsFilter !== 'All' && it.cls !== clsFilter) return false;` |
| `byClass` | `useMemo(() => CLASS_NAMES.map(cn => ({` |
| `lines` | `COLLATERAL.map(it => [` |
| `blob` | `new Blob([[header, ...lines].join('\n')], { type:'text/csv' });` |
| `items` | `useMemo(() => COLLATERAL.filter(it => clsFilter === 'All' \|\| it.cls === clsFilter), [clsFilter]);  const withDamage = useMemo(() => items.map(it => { const dmgPct = physAddonPct(it, scen, horizon, retreatYear);` |
| `totalExp` | `withDamage.reduce((a, i) => a + i.expLoss, 0);` |
| `totalGross` | `withDamage.reduce((a, i) => a + i.grossLoss, 0);` |
| `insGap` | `withDamage.filter(i => i.retreat).reduce((a, i) => a + i.value, 0);` |
| `horizonSeries` | `useMemo(() => HORIZONS.map(h => {` |
| `top15` | `withDamage.slice(0, 15).map(i => ({` |
| `epcDist` | `useMemo(() => EPC_BANDS.map(b => ({` |
| `timeline` | `useMemo(() => [2026, 2028, 2030, 2033, 2036, 2040, 2045, 2050].map(yr => {` |
| `ramp` | `Math.min(1, (yr - 2024) / (h - 2024));` |
| `totalTransLoss` | `COLLATERAL.reduce((a, it) => a + it.value * transAddonPct(it, scen, horizon, mees, carbon) / 100, 0);` |
| `book` | `useMemo(() => COLLATERAL.map(it => ({ it, hc: haircutBreakdown(it, cfg) })), [cfg]);` |
| `totals` | `useMemo(() => { const value = book.reduce((a, r) => a + r.it.value, 0);` |
| `adj` | `book.reduce((a, r) => a + r.hc.adjValue, 0);` |
| `loan` | `book.reduce((a, r) => a + r.it.loan, 0);` |
| `unsec` | `book.reduce((a, r) => a + r.hc.unsecured, 0);` |
| `migration` | `useMemo(() => LTV_BANDS.map(b => ({` |
| `out` | `{ ...s, base:start, bar:Math.abs(s.v) };` |
| `cfg` | `useMemo(() => ({ ...DEFAULT_CFG, scen, horizon }), [scen, horizon]);  const byClass = useMemo(() => CLASS_NAMES.map(cn => { const items = COLLATERAL.filter(c => c.cls === cn);` |
| `baseAdj` | `it.value * (1 - base / 100);` |
| `eclBase` | `loan * pd * (lgdBase / loan);` |
| `eclClim` | `loan * pd * (lgdClim / loan);` |
| `tot` | `byClass.reduce((a, r) => ({` |
| `chart` | `byClass.map(r => ({` |
| `sensitivity` | `useMemo(() => SCENARIO_NAMES.map(s => {` |
| `max` | `Math.max(...sensitivity.flatMap(x => HORIZONS.map(hh => x[hh])));` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `COLLATERAL`, `DATA_REGISTER`, `EPC_BANDS`, `HAZARDS`, `HAZARD_W`, `HORIZONS`, `LIMITS`, `LOD_ROLES`, `LTV_BANDS`, `MATURITY_DIMS`, `POLICY_AMENDMENTS`, `REG_ITEMS`, `ROADMAP`, `TRIGGERS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).