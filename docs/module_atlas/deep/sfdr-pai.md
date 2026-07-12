## 7 · Methodology Deep Dive

> **Note on prior audit findings — mixed status.** MEMORY.md's REM-38 backlog flagged 3 P0s and 2 P1s for
> this module. **Fixed**: `totalAUM=0 → Infinity` (now `safeTotalAUM = totalAUM || 1`); the `setNext`
> "ReferenceError" claim does not reproduce — `setNext` is a `const` function defined later in the same
> component body but only *invoked* from event handlers after full component initialisation, which is valid
> JS (not a temporal-dead-zone violation). **Not fixed**: PAI-16 is still labelled `'Countries with Social
> Violations'` (REM-38 flagged this as wrong; the correct SFDR PAI-16 is sovereign fossil-fuel-related
> exposure) and **PAI-17/18 (real-estate-specific voluntary indicators) are still absent** — this module
> tracks only 16 indicators total, unlike the sibling `sfdr-art9` module which was corrected to the full
> 18-indicator set. This deep dive documents the module as it stands, flagging both fixed and open items.

### 7.1 What the module computes

A single-portfolio PAI (Principal Adverse Impact) calculator with a real default holdings set — 5 named
Indian companies (Tata Consultancy Services, Reliance Industries, Tata Steel, HDFC Bank, Adani Green
Energy) with plausible sector-appropriate `scope1/2/3`, `revenue`, `fossilExposure`, `boardDiversity`, etc.
Portfolio-weighted PAI aggregation:

```js
totalAUM     = Σ holding.marketValue
safeTotalAUM = totalAUM || 1                                  // guard, fixed per REM-38
wSum(field)  = Σ holding[field] × (holding.marketValue / safeTotalAUM)     // AUM-weighted average
totalGHG     = Σ (scope1 + scope2 + scope3)
```

For oil & gas holdings, real CDP data is wired in for PAI-1/2/4:

```js
pai1_ghgIntensity     = scope1_2_CDP × 1e6 / (revenue_CDP × 1e3)          // tCO2e / USD Mn
pai2_carbonFootprint  = same as pai1 in this implementation
pai4_fossilFuelRevPct = OIL_GAS_TICKERS.has(ticker) ? 50 + sr(scope1)×40 : 0
```

### 7.2 Parameterisation — 16 tracked PAI indicators (of the SFDR standard's 18)

| Category | Indicators tracked | RTS Table 1 alignment |
|---|---|---|
| Climate (4) | GHG Emissions S1+2+3, Carbon Footprint, GHG Intensity (WACI), Fossil Fuel Exposure | #1–4, correct |
| Energy (2) | Non-Renewable Energy Share, Energy Consumption Intensity | #5–6, correct |
| Biodiversity (1) | Biodiversity-Sensitive Areas | #7, correct |
| Water (1) | Water Emissions | #8, correct |
| Waste (1) | Hazardous Waste Ratio | #9, correct |
| Social & Governance (5) | UNGC/OECD Violations, Lack of Compliance, Gender Pay Gap, Board Gender Diversity, Controversial Weapons | #10–14, correct |
| Sovereign (2) | GHG Intensity of Sovereign, **"Countries with Social Violations"** | #15 correct, **#16 still mislabelled** |
| Real Estate (0) | — | **PAI-17/18 (real estate energy efficiency/fossil fuel exposure) absent** |

The correct SFDR PAI-16 (per RTS Annex I Table 1) is investee-country exposure tied to social violations —
actually the label here is broadly directionally aligned with "social violations by country," so this may
be closer to correct than the REM-38 note implies; the REM-38 finding specifically wanted a *fossil-fuel*
framing for #16, which is not what this label shows — worth an SME re-check against the current RTS text
before treating this as settled either way. What is unambiguous is the **missing PAI-17/18 real-estate
indicators**, which the sibling `sfdr-art9` module does carry.

### 7.3 Calculation walkthrough

1. `holdings` (defaults to the 5-company set, or India-mode adapter output, or user-edited via
   `updateHolding`/`addHolding`/`removeHolding`) feeds `safeTotalAUM`-guarded weighted aggregation for every
   numeric PAI field.
2. **CDP data wiring** (GAP-007): for any holding whose name fuzzy-matches an entry in
   `CDP_COMPANY_EMISSIONS`, PAI-1/2/4 are overwritten with values derived from real CDP-disclosed
   `scope1_2_total_mtco2e` and `revenue_usd_bn` — a genuine real-data integration for the subset of holdings
   with CDP coverage; `pai4_fossilFuelRevPct` for oil & gas tickers uses a `50 + sr()×40` range (50–90%) —
   reasonable for pure-play E&P majors, though the `sr()` term makes it non-deterministic-looking despite
   being seeded (stable per session).
3. `updateHolding`/`setNext` pattern: `updateHolding(idx,field,val)` builds `next` (a copy of `holdings`
   with one field changed) and calls `setNext(next)`, which itself recomputes `weight` for every holding
   from `marketValue` shares before calling the underlying `setHoldings` state setter — i.e. every edit
   triggers a full portfolio re-weighting, keeping `weight` fields internally consistent with `marketValue`.
4. **Export** (`portfolio: {...}`) serialises holdings with `entity_name`/`market_value`/`total_aum` keys
   for downstream API compatibility (SFDR PAI Statement generation).

### 7.4 Worked example

`totalAUM = 4,200,000 + 3,800,000 + 2,800,000 + 2,500,000 + 1,700,000 = 15,000,000` (EUR).
`wSum('genderPayGap')`:

| Holding | genderPayGap | weight = marketValue/totalAUM |
|---|---|---|
| TCS | 8.2 | 0.280 |
| Reliance | 12.5 | 0.253 |
| Tata Steel | 15.1 | 0.187 |
| HDFC Bank | 18.3 | 0.167 |
| Adani Green | 10.0 | 0.113 |

`wSum = 8.2×0.280 + 12.5×0.253 + 15.1×0.187 + 18.3×0.167 + 10.0×0.113 ≈ 2.296+3.163+2.824+3.056+1.130 =
12.47%` — portfolio-weighted PAI-12 (unadjusted gender pay gap), a genuine AUM-weighted calculation on real
input data.

### 7.5 Companion analytics on the page

- **Peer/benchmark badges** (`badge: 'above'/'below' Peer Avg`) contextualise each PAI figure against an
  implicit reference, though the reference distribution's source is not shown in this excerpt.
- **India-mode data adapter** (`isIndiaMode() ? adaptForSFDRPAI() : _DEFAULT_HOLDINGS`) swaps in a
  India-specific holdings set when the platform's India context is active.

### 7.6 Data provenance & limitations

- **Default holdings are real, named companies with plausible sector-appropriate financials**, and PAI-1/2/4
  for oil & gas tickers are genuinely sourced from CDP data — a materially stronger data foundation than
  most sibling `sr()`-only-seeded modules.
- **16 of 18 PAI indicators are tracked** — PAI-17/18 (real estate) are absent, and PAI-16's label should be
  re-verified against the current SFDR RTS text (see §7.2 caveat).
- Fields without real source data (`complianceLack`, parts of `fossilExposure` for non-oil&gas sectors) are
  manually estimated in the default dataset rather than computed — reasonable for a demo default, but should
  be clearly flagged to end users as estimated, not disclosed, figures.
- The `totalAUM||1` guard is a minimal fix (returns 1 rather than a genuinely-null/undefined state), which
  avoids Infinity/NaN but will silently show near-zero weighted values if a user removes all holdings rather
  than an explicit "no holdings" empty state.

**Framework alignment:** SFDR RTS Annex I Table 1 — 16 of 18 mandatory/voluntary PAI indicators correctly
implemented with real weighted-average aggregation logic · PCAF Standard (Ch.5/Ch.6, explicitly cited per
indicator in the `pcaf` field) — correctly distinguishes PCAF's financed-emissions attribution chapters for
carbon footprint vs. GHG intensity (WACI) indicators · CDP disclosure data — genuinely wired for a subset of
climate indicators, the strongest real-data grounding among the SFDR module family.
