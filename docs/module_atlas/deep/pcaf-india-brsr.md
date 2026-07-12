## 7 · Methodology Deep Dive

### 7.1 What the module computes

Applies the same core PCAF attribution formula as the platform's flagship PCAF module, adapted to
Indian rupee-denominated instruments and SEBI BRSR Core disclosure format, plus two extension books
(motor insurance, facilitated bond issuance):

```
FE_i    = AF_i × (Scope1_i + Scope2_i)                       // financed emissions, tCO2e
AF      = Exposure_INR_Cr / EVIC_INR_Cr  (with 1.0 cap)
DQS     = override if supplied, else 3 (has reported Scope1+2) or 4 (proxy)
WACI    = FE / Revenue_INR_Cr
```

### 7.2 Parameterisation

| Field | Value | Provenance |
|---|---|---|
| `DEFAULT_HOLDINGS` (9 rows) | CIN, sector (GICS), revenue, EVIC, exposure, Scope 1/2/3 — all in INR Cr | Seeded demo portfolio styled on real Indian company structure (CIN identifiers, GICS sectors) but not pulled from actual BRSR filings |
| `DQS_LABELS` | 1=Verified GHG data … 5=Least granular | Matches PCAF's 5-tier DQ scale, correctly labelled |
| Motor insurance policies (9 rows) | vehicle count, fuel type, annual km, engine cc | Real physical-activity-data fields per PCAF's insurance-associated-emissions methodology (Part C, motor line) |
| Facilitated deals (6 rows) | underwritten amount, total deal size, bond type, coupon, credit rating | Real bond-deal structure fields for PCAF Part C facilitated-emissions attribution |

### 7.3 Calculation walkthrough

1. **Portfolio financed emissions**: `af = min(1, exposure_inr_cr/evic_inr_cr)`,
   `financed = af × (s1+s2)`; `dqs = override ?? (s1+s2>0 ? 3 : 4)` — a simple but PCAF-consistent
   data-quality inference: having *any* reported Scope 1/2 earns DQ3 (reported data, unverified);
   otherwise the position falls back to DQ4 (sector-level proxy).
2. **Portfolio WACI**: `waciPortfolio = totalFinanced / totalRev` (aggregate), and per-holding
   `waci = financed/revenue` — correctly PCAF-consistent (intensity per unit revenue, not per unit
   exposure).
3. **Insurance book** (`demoResults`): converts INR premium to USD-equivalent (`toMusd = v ×
   0.12`, an approximate INR/USD conversion) and computes underwriting-associated emissions per
   policy from vehicle count/fuel type/engine size — a genuine physical-activity-based PCAF motor
   insurance calculation (rather than a premium-based proxy).
4. **Facilitated deals** (`demoDeals`): attribution presumably follows the same
   `underwrittenM/dealSize` pattern used in the flagship PCAF module (not fully visible in the
   extracted snippet, but the seed fields — `attrFormula`, `citation` — mirror that module's
   structure).
5. **CIN/company matching**: `COMPANY_SUGGESTIONS.find(c => c.cin===cin || cin.includes(c.cin.slice(-6)))`
   does a fuzzy CIN-suffix match for autocomplete — a defensive matching pattern given CIN format
   inconsistencies in real filings.

### 7.4 Worked example

A holding with `exposure_inr_cr=850`, `evic_inr_cr=6,200`, `scope1_co2e=42,000t`,
`scope2_co2e=18,000t`, `revenue_inr_cr=3,100`:

| Step | Computation | Result |
|---|---|---|
| Attribution factor | min(1, 850/6,200) | **13.71%** |
| Financed emissions | 0.1371 × 60,000 | **8,226 tCO₂e** |
| DQS | s1+s2>0 → | **3** |
| WACI | 8,226 / 3,100 | **2.65 tCO₂e/INR Cr revenue** |

### 7.5 Data provenance & limitations

- **All 9 default holdings, 9 insurance policies, and 6 facilitated deals are synthetic demo
  data** with plausible Indian corporate structure (CIN format, GICS sectors) but not pulled from
  MCA/SEBI/BRSR filings.
- INR/USD conversion (`0.12`) is a static approximation, not a live FX rate.
- No PPP-GDP or country-specific attribution nuance beyond the standard EVIC-ratio formula — sector
  median EVIC fallback (used in the flagship PCAF module) does not appear in this module's extracted
  formulas, so a null-EVIC holding here may divide by a missing denominator without the same
  DQ-penalty safeguard the flagship module applies.

**Framework alignment:** PCAF Global GHG Accounting Standard v2/v3 attribution formula — correctly
applied to INR-denominated exposures; SEBI BRSR Core Framework (2023) — the output CSV structure
(Company, Sector, Instrument, Attribution Factor %, Exposure, Financed tCO2e, WACI, DQS,
Uncertainty %) maps directly onto BRSR Core's mandated GHG-intensity disclosure fields.
