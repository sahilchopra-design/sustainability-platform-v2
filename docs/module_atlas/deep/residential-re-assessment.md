## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** A genuine, well-built backend engine exists
> (`backend/services/residential_re_engine.py`, hedonic regression + CRREM stranding + MEES
> compliance + climate-adjusted LTV, exposed at `api/v1/routes/residential_re.py` with the 8
> endpoints listed in `trace_labels`) — but **the frontend page never calls it.** `grep -i "fetch\|
> axios\|api/v1"` over `ResidentialReAssessmentPage.jsx` returns zero matches. The page instead
> builds its own **independent, simplified synthetic dataset** via `sr()` seeds (`PROPERTIES` array
> with `epcIdx`, `value`, `ltv`, `physRisk`, `floodZ`, `costToC`, `stranded` all drawn from
> uncorrelated PRNG calls) that does **not** replicate the backend's hedonic coefficients, CRREM
> pathway, or MEES-compliance logic. §7.1–7.4 document what the frontend actually renders; §7.5
> documents the disconnected backend engine, which is the more rigorous of the two and should be
> the wiring target for a future fix.

### 7.1 What the frontend computes

A synthetic portfolio of properties, each independently seeded (no cross-field correlation):

```
epcIdx    = min(6, floor(sr(i×7) × 7))              // 0=A … 6=G
value     = round(150 + sr(i×11) × 1350)   // £k
ltv       = 0.45 + sr(i×13) × 0.45                  // 45–90%
physRisk  = round(10 + sr(i×17) × 80)               // 10–90
floodZ    = sr(i×19) > 0.75                          // ~25% of stock flagged
costToC   = epcIdx > 2 ? round(5 + sr(i×23) × 35) : 0   // £k retrofit cost, only if EPC < C
stranded  = epcIdx >= 5 && sr(i×31) > 0.4            // EPC F/G, ~60% chance flagged stranded
```
Because `epcIdx`, `value`, `ltv`, `physRisk`, and `floodZ` are drawn from independent seeds, there
is **no relationship in this synthetic dataset** between EPC rating and property value (an EPC-G
1930s house is exactly as likely to be a £1.5M property as an EPC-A new-build), unlike the real
backend engine's EPC-value premium.

### 7.2 Parameterisation (frontend)

| Field | Range | Provenance |
|---|---|---|
| `value` | £150k–£1.5M | Synthetic demo |
| `ltv` | 45–90% | Synthetic demo |
| `physRisk` | 10–90 | Synthetic demo, unrelated to `floodZ` |
| `costToC` | £5k–£40k (only if EPC worse than C) | Synthetic demo, roughly in line with the backend's real `RETROFIT_COST_PER_M2` scale but not computed from it |
| `stranded` flag | EPC F/G with 60% conditional probability | Ad hoc proxy for CRREM stranding, disconnected from the real CRREM pathway table below |
| Stress-test affordability curve | `afford = 28 + (rate−3.5)×5.5`; `hpiAdj = −0.05 × max(0, rate−4.5)` | Hand-fit linear approximations of mortgage-rate sensitivity, not calibrated to a published affordability model |

### 7.3 Calculation walkthrough (frontend)

1. `PROPERTIES` (N synthetic rows) built once at load; `totalValue = Σ value`, `avgLtv = Σ ltv / n
   × 100`.
2. `regionAgg` groups by `REGIONS`, computing mean value/LTV/physRisk per region.
3. `totalRetrofitCost = Σ costToC` for properties with `epcIdx > 2` (worse than EPC C).
4. `stressedLtv` applies a mortgage-rate shock: `hpiAdj` depresses property values (linear in rate
   above 4.5%), which mechanically raises LTV (`balance / (value×(1+hpiAdj))`) since the numerator
   is unchanged; `affordData` sweeps rates 3.5–7.0% against the `afford` linear formula.

### 7.4 Worked example (frontend)

At `rate = 6.0%`: `hpiAdj = −0.05 × (6.0−4.5) = −0.075` (−7.5% house-price fall);
`afford = 28 + (6.0−3.5)×5.5 = 28 + 13.75 = 41.75%` (mortgage-payment-to-income). For a property
with `value = £400k`, `ltv = 0.70` (balance = £280k): stressed value = `400 × 0.925 = £370k`;
stressed LTV = `280 / 370 = 75.7%`, up from the origination 70.0% — a **+570bp LTV stress**, purely
mechanical (numerator fixed, denominator shrinks with the HPI haircut).

### 7.5 The disconnected backend engine (real methodology, not wired to this page)

`ResidentialRealEstateEngine.value_property()` implements a genuine multi-factor hedonic model:
```
base = floor_area×€2,800/m² + bedrooms×€15,000 + bathrooms×€12,000 − age×€500
     + garden×€120/m² + parking×€20,000 − transport_km×€5,000
base ×= (1 + epc_pct)          // epc_pct = (D_idx − epc_idx) × 3% per band vs EPC D
base ×= (1 + flood_pct)        // flood_pct = −8% if in flood zone
hedonic_value = max(base, area × €500)      // floor value
```
CRREM stranding year = first year in the 2020–2050 pathway (`120→18 kWh/m²/yr`) where the
property's `energy_kwh_m2_yr` exceeds the pathway target; MEES compliance checks GB EPC rating
against the 2025/2028 minimum-C timeline. Transition haircut = `5% + (2035 − stranding_year)×1%`
(capped 25%) plus `+3%` if MEES non-compliant; `climate_ltv = mortgage / (hedonic_value ×
(1−haircut))`; portfolio risk band (`low/medium/high/critical`) thresholds on average stress bps
and % stranding-before-2030. This is a coherent, source-referenced (RICS Red Book VPS 5/VPGA 12,
UK MEES 2015, EU EPBD 2024/1275, CRREM v2.3) production-grade model — it is simply not called by
the page that is supposed to expose it.

### 7.6 Data provenance & limitations

- Frontend `PROPERTIES` are entirely synthetic and internally uncorrelated (EPC vs. value vs.
  flood risk are independent draws) — misleading for any user assuming the scatter plots reflect
  real EPC-value relationships.
- The real hedonic/CRREM/MEES engine exists, is unit-testable, and cites primary standards, but
  delivers zero value to end users until the frontend calls its 8 exposed endpoints.
- Frontend `stressedLtv`/`affordData` formulas are hand-fit linear approximations with no cited
  source, unlike the backend's referenced coefficients.

**Framework alignment:** RICS Red Book 2022 VPS 5 & VPGA 12 (hedonic valuation + ESG — implemented
in the **backend only**) · UK MEES Regulations 2015 (implemented in the **backend only**) · CRREM
v2.3 residential 1.5°C pathway (implemented in the **backend only**; frontend's `stranded` flag is
an unrelated ad hoc proxy) · EU EPBD Recast 2024/1275 (referenced in backend docstring, informs the
MEES/ZEB timeline table) · NGFS physical-risk framing (frontend `physRisk` field, uncalibrated).
