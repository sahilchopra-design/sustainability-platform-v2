## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch (methodology substitution, not fabrication).** The guide's formula is a
> genuine spend-based EEIO calculation: `S3Cat1 = Σ(spend_ij × EF_sector_j)`. **The code does not use
> spend data or EEIO emission factors at all.** Instead it applies a **"supply-chain multiplier"**
> approach: each company's Tier 1/2/3 upstream emissions are estimated as a fixed sector-specific
> multiple of that company's *own* Scope 1+2 footprint (`tier1Est = companyTotal × mult.tier1`, etc.),
> not `Σ(spend×EF)`. This is a real, commonly used simplified Scope 3 estimation technique in
> practice (used when granular spend data is unavailable) — just a different real methodology than
> the one named in the guide, not a fabricated number.

### 7.1 What the module computes

Unlike most modules in this batch, this file contains **no `sr()` PRNG at all** — all numeric inputs
come from `GLOBAL_COMPANY_MASTER` (real company Scope 1/2 data where available, with a documented
synthetic fallback estimator *inside the shared data module*, not this page, for companies lacking
reported figures).

```
companyTotal = scope1_mt×1e6 + scope2_mt×1e6                    // company's own footprint, tCO2e
mult         = TIER_MULTIPLIERS[sector] || TIER_MULTIPLIERS['Industrials']
tier1Est     = companyTotal × mult.tier1
tier2Est     = companyTotal × mult.tier2
tier3Est     = companyTotal × mult.tier3
grandTotal   = companyTotal + tier1Est + tier2Est + tier3Est
multiplier   = grandTotal / companyTotal                          // total supply-chain amplification factor
intensityPerRev = grandTotal / (revenue_usd_mn × 1e6) × 1e6        // tCO2e per $M revenue
```

### 7.2 Parameterisation

| Sector | Tier 1 | Tier 2 | Tier 3 | Total multiplier | Real-world plausibility |
|---|---|---|---|---|---|
| Consumer Staples | 2.0 | 2.8 | 2.0 | **7.8×** (highest) | Plausible — large agricultural/packaging supply chains genuinely dwarf direct operations for this sector |
| Energy | 1.8 | 2.5 | 1.2 | 6.5× | Plausible |
| Financials | 0.3 | 0.2 | 0.1 | 0.6× (lowest) | Plausible — financial institutions' *physical* supply chain is genuinely small relative to their own operations (their large footprint is financed emissions, a different accounting category entirely, correctly out of scope here) |
| Communication Services | 0.5 | 0.3 | 0.2 | 1.0× | Plausible |

12 sectors are covered (including an `IT`/`Information Technology` alias pair), with `Industrials`
as the fallback for any unmatched sector string.

### 7.3 Calculation walkthrough

1. **Per-company estimate** — `computeSupplyChainCarbon(company)` as above, tagged with a
   **confidence label per tier** (`tier1: Medium`, `tier2: Low`, `tier3: Very Low`) and a **methods
   note** per tier (`tier1: "Spend-based + sector EFs"`, `tier2: "EEIO model + sector averages"`,
   `tier3: "Sector extrapolation"`) — these confidence/methodology labels describe an EEIO approach
   in their text even though the actual formula used is the sector-multiplier approach above, a
   minor internal labelling inconsistency worth flagging alongside the guide mismatch.
2. **Portfolio aggregation** — for each holding, `computeSupplyChainCarbon` runs and results are
   summed into `sectorBreakdown` and `pctOfPortTotal`.
3. **Scenario sliders** — `tier1Reduction`/`tier2Reduction`/`renewableSwitch` let a user model
   reduction pathways: `adjTier1 = tier1.estimated×(1−tier1Reduction/100)`,
   `adjScope2 = scope2×(1−renewableSwitch/100)`, recombined into `adjTotal`.
4. **Intensity view** — per-tier intensity (`tCO2e/$M revenue`) computed by dividing each tier's
   estimate by company revenue — a genuinely useful normalisation for cross-company comparison.
5. **Hotspot analysis** — `ACTIVITY_CATEGORIES` (8 named activities, e.g. "Raw Materials Extraction"
   tagged `tier3` at 35% of that tier, "Direct Supplier Processing" tagged `tier1` at 40%) apply
   fixed percentage splits within each tier to approximate activity-level hotspots — illustrative
   decomposition, not itself derived from any activity-level data.
6. **ILO labour indicator overlay** — `_ILO_MAP` joins real `ILO_LABOR_INDICATORS` by country,
   letting the page cross-reference supply-chain carbon concentration with labour-rights context for
   the same sourcing countries — a genuine (if separate) real-data integration.

### 7.4 Worked example (illustrative figures)

An Energy-sector holding with `scope1_mt=5.0`, `scope2_mt=1.0`, `revenue_usd_mn=$8,000`:

```
companyTotal = (5.0+1.0)×1e6 = 6,000,000 tCO2e
mult = {tier1:1.8, tier2:2.5, tier3:1.2}     (Energy)
tier1Est = 6,000,000×1.8 = 10,800,000 t
tier2Est = 6,000,000×2.5 = 15,000,000 t
tier3Est = 6,000,000×1.2 = 7,200,000 t
grandTotal = 6,000,000+10,800,000+15,000,000+7,200,000 = 39,000,000 t
multiplier = 39,000,000/6,000,000 = 6.5×
intensityPerRev = 39,000,000/(8,000×1e6)×1e6 = 4,875 tCO2e/$M
```

The 6.5× multiplier means this company's *reported* Scope 1+2 footprint captures only ~15% of its
estimated total supply-chain carbon footprint — directionally consistent with the guide's own cited
statistic that Scope 3 is "typically 5–10× Scope 1+2 combined" for the relevant sectors.

### 7.5 Companion analytics

- **Sector-average multiplier** — `sectorAvg = 1 + mult.tier1+tier2+tier3`, used to benchmark an
  individual company's actual multiplier against its sector norm.
- **Portfolio-level hotspot table** — aggregates the 8 activity categories across all portfolio
  holdings' tier estimates.

### 7.6 Data provenance & limitations

- Sector multipliers are hand-calibrated, directionally sensible, and not fabricated by PRNG, but
  are not cited to a specific published sector-multiplier study (e.g. a named CDP or EXIOBASE
  sector-ratio table) — a reader cannot independently verify the exact 1.8/2.5/1.2-style figures.
- The confidence/methodology labels attached to each tier describe an EEIO/spend-based approach that
  differs from the actual multiplier-of-own-footprint formula used — worth correcting for
  internal consistency.
- `ACTIVITY_CATEGORIES` percentage splits are illustrative constants applied uniformly across all
  companies in a tier, regardless of actual sector or activity mix.

**Framework alignment:** GHG Protocol Scope 3 Standard (Category 1 framing, real) · PCAF Scope 3
attribution guidance (named, methodology labels reference it, formula does not implement it) · CDP
Supply Chain data (named as context, not ingested) — the sector-multiplier approach itself is a
recognised simplified alternative to full EEIO modelling, used in practice by several real ESG data
providers when granular spend data is unavailable.
