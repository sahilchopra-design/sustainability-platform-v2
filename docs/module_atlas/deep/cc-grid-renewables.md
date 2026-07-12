## 7 · Methodology Deep Dive

Guide and code align: a CDM ACM0002 / AMS-I.D grid-connected renewable-energy emission-reduction
model built on the Combined Margin (OM + BM) grid emission factor, with a dispatch model and a
build-your-own grid-EF tool. The calculators are real; the 12-project registry is synthetic.

### 7.1 What the module computes

**Combined Margin** (`calcCombinedMargin`, lines 77–81):

```js
cm = omEF × omWeight + bmEF × bmWeight        // combined-margin emission factor (tCO2/MWh)
be = netGen × cm                              // baseline emissions displaced
netGen = capacity × 8760 × cf × (1 − aux/100) // net generation to grid
netCredits = round(be × 0.92)                 // 8% buffer
```

**Grid EF builder** (`gridEFResult`): a share-weighted average EF across 8 plant types
`weightedEF = Σ ef_i × (share_i / Σshare)`, plus a dispatch-order "build margin" from the last 3
dispatched plants.

**Dispatch model** (`dispatchData`): hourly demand `demand = D × (0.6 + 0.4·sin((h−6)π/12))`, a
solar-shaped renewable slice, residual met by coal (55%) / gas (35%) / other, with an hourly
marginal EF flagged 0.55 (gas-marginal) or 0.85 (coal-marginal).

### 7.2 Parameterisation

| Parameter | Value | Provenance |
|---|---|---|
| OM/BM weights | default 0.75 / 0.25; per-tech `TECH_WEIGHTS` | ACM0002 allows project-specific weighting; 50/50 default in methodology, here tech-varied |
| `omEF` / `bmEF` | 0.65 / 0.35 tCO₂/MWh default | Operating/build margin factors (illustrative regional) |
| `cf` (capacity factor) | 0.28 default; 0.15–0.60 across projects | Solar ~0.15–0.25, wind ~0.30–0.45, geothermal high |
| `aux` (auxiliary) | 4.0% default | Station self-consumption |
| Buffer | ×0.92 (8%) | Conservativeness proxy |
| Grid EF plant factors | Coal-sub 1.10 · Coal-super 0.85 · CCGT 0.40 · OCGT 0.55 · Oil 0.75 · Diesel 0.90 · Biomass 0.05 · Nuclear 0.01 tCO₂/MWh | `GRID_EF_PLANTS` — standard technology EFs |
| Default grid mix | Coal 35/20 · gas 25/8 · oil 5 · diesel 2 · biomass 3 · nuclear 2 % | Illustrative emerging-market mix |

### 7.3 Calculation walkthrough

1. Net generation from nameplate × 8,760 h × capacity factor × (1 − auxiliary).
2. Combined margin = OM×w_OM + BM×w_BM; baseline emissions = netGen × CM; ×0.92 → net credits.
3. Sensitivities sweep OM (0.3–1.0) and BM (0.1–0.6) holding the other fixed.
4. **Grid EF builder** computes a share-weighted operating margin and derives a build margin from the
   three most-recently-dispatched plants (`sortedByDispatch.slice(-3)`).
5. **Dispatch model** stacks renewables then coal/gas to meet an hourly demand curve, exposing the
   marginal EF by hour and its 24-h average.
6. Result pushed to `CarbonCreditContext` as methodology `ACM0002`, family `energy`.

### 7.4 Worked example — Combined Margin Calculator

Defaults: capacity 50 MW, cf 0.28, aux 4.0%, omEF 0.65, bmEF 0.35, omW 0.75, bmW 0.25:

| Step | Computation | Result |
|---|---|---|
| Net generation | 50 × 8,760 × 0.28 × (1 − 0.04) | 117,734 MWh |
| Combined margin | 0.65 × 0.75 + 0.35 × 0.25 | 0.575 tCO₂/MWh |
| Baseline emissions (be) | 117,734 × 0.575 | 67,697 tCO₂ |
| Net credits | 67,697 × 0.92 | **≈62,281 tCO₂e** |

### 7.5 Data provenance & limitations

- **Calculators are real; 12 `PROJECTS`, hourly wind/hydro profiles, and vintages are synthetic**
  (PRNG `sr(seed)=frac(sin(seed+1)×10⁴)`; solar hourly profile is a deterministic sine).
- OM/BM factors are user inputs, not derived from published national grid emission-factor tools
  (e.g. CDM Tool 07 / IGES grid-EF database).
- Build margin in the grid-EF builder is a "last-3-dispatched" heuristic, not the ACM0002 "20% most
  recent additions or 5 latest units" definition.
- Buffer is a flat 8%; additionality (`additionality` field) is a synthetic 40–95 score, not a
  barrier/investment analysis.

**Framework alignment:** **CDM ACM0002 v19** (grid-connected RE) — the CM = w_OM·OM + w_BM·BM identity
is the methodology's core; **AMS-I.D** for small-scale · **GHG Protocol Scope 2** grid EF concept ·
**I-REC Standard** referenced for REC eligibility. In the real methodology, OM is computed from
dispatch/generation data (simple, dispatch-data, or average methods) and BM from recent capacity
additions; the module reproduces the combining step and lets the user supply OM/BM directly.
