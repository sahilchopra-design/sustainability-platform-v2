## 7 · Methodology Deep Dive

EM Climate Risk (E87) is a **standards-grounded emerging-market climate & transition risk engine** —
among the most rigorous in the platform. `em_climate_risk_engine.py` scores 51 real EM countries on a
physical/transition/NDC/fossil composite, applies a **PCAF GEMS** climate-adjusted loss uplift, assesses
**IFC PS6** biodiversity compliance, and screens eligibility across 8 concessional-finance windows. The
engine explicitly **removed prior RNG fabrication** (deterministic loss allocation, no coin-flip PS6
scoring). No mismatch flag — the code implements a real, cited methodology.

### 7.1 What the module computes

**Country climate composite** (0–100, higher = worse):
```python
transition_rev = 100 − transition_readiness_score
ndc_gap        = 100 − ndc_ambition_score
composite = clamp( physical·0.35 + transition_rev·0.25 + ndc_gap·0.20 + fossil_dep·0.20 )
risk_tier = ≥65 high | ≥40 medium | else low
```
**GEMS climate-adjusted loss** (deterministic, per the docstring "no stochastic jitter"):
```python
gems_uplift_pct = GEMS_LOSS_MULTIPLIERS[region]           # region IPCC-AR6-derived uplift
gems_climate_adjusted_loss_bn = gems_historical_loss_bn · (1 + uplift/100)
entity_expected_loss_m = exposure_m · (adjusted_loss_bn / max(exposure_m·50, 1))
```
**IFC PS6 biodiversity** — habitat tier from location triggers, offset ratio, honest compliance scoring:
```python
is_critical = iucn_km<5 OR endangered_present OR habitat_type=='critical_habitat'
is_natural  = not critical AND (natural_habitat OR ramsar_km<10 OR habitat_ha>10)
offset_ratio = 3.0 critical | 1.5 natural | 0.0 modified
compliance_score = (met criteria / assessed criteria)·100   # None if nothing assessed
```
**Concessional finance** — eligibility across GCF/GEF/AIIB/ADB/IADB/EIB/AFD/WB against min size, income
group and sector; returns a prioritised top-3 pipeline and blended-finance potential.

### 7.2 Parameterisation / scoring rubric

**Composite weights:** physical 0.35, transition-reverse 0.25, NDC-gap 0.20, fossil-dependency 0.20 —
physical risk dominant, appropriate for EM adaptation exposure.

**GEMS regional loss uplift** (`GEMS_LOSS_MULTIPLIERS`, % applied to historical GEMS loss):

| Region | Uplift % |
|---|---|
| South Asia | 45 |
| Sub-Saharan Africa | 38 |
| East Asia Pacific | 32 |
| MENA | 28 |
| Latin America | 25 |
| ECA | 18 |

**NDC ambition tiers** (`NDC_AMBITION_CATEGORIES`, mapped to Climate Action Tracker): Highly Ambitious
80–100 (1.5°C compatible), Ambitious 60–79 (almost sufficient), Moderate 40–59 (insufficient),
Insufficient 0–39 (critically insufficient). **IFC PS6 offset ratios:** critical 3:1, natural 1.5:1,
modified none.

| Data table | Rows | Provenance |
|---|---|---|
| `EM_COUNTRY_PROFILES` | 51 | ND-GAIN, UNFCCC NDC registry, BNEF, CPI (real per-country scores) |
| `IFC_PS6_THRESHOLDS` | 3 tiers | IFC Performance Standard 6 (2012) |
| `CONCESSIONAL_FINANCE_WINDOWS` | 8 | GCF/GEF/MDB programming manuals |
| `GEMS_LOSS_MULTIPLIERS` | 6 regions | PCAF GEMS + IPCC AR6 |

Country scores (physical, transition readiness, NDC, ND-GAIN, fossil dependency, GCF allocation, GEMS
historical loss, green-bond market size) are **curated from named authoritative sources** — not seeded.

### 7.3 Calculation walkthrough

1. `assess_country_climate_risk` pulls the country profile → composite → risk/opportunity tier → GEMS
   climate-adjusted loss → per-entity expected loss → narrative key-risks (physical>70, fossil>70,
   just-transition>65, ND-GAIN<40).
2. `assess_ifc_ps6_requirements` classifies habitat tier from location evidence, sets offset ratio/area,
   and scores compliance **only over assessed criteria** (nulls where unassessed — no fabrication).
3. `assess_concessional_finance_eligibility` screens the 8 windows and ranks a pipeline.
4. Portfolio methods aggregate country exposures to an EM portfolio climate profile.

### 7.4 Worked example (Bangladesh, BD)

Profile: physical 88, transition readiness 35, NDC 55, fossil dependency 70, region South Asia, GEMS
historical loss $3.2bn. Entity exposure $200M.
```
transition_rev = 100−35 = 65 ; ndc_gap = 100−55 = 45
composite = 88·0.35 + 65·0.25 + 45·0.20 + 70·0.20 = 30.8 + 16.25 + 9.0 + 14.0 = 70.05 → 70.1
risk_tier = 70.1 ≥ 65 → HIGH
GEMS uplift (South Asia) = 45% → adjusted loss = 3.2·1.45 = $4.64bn
entity_loss = 200·(4.64 / max(200·50,1)) = 200·(4.64/10000) = 200·0.000464 = $0.093M
```
Key risks flagged: physical 88>70 (extreme weather/SLR), fossil 70=70 (not >70, so not flagged),
ND-GAIN 38<40 (low adaptive capacity). Bangladesh → HIGH risk, GCF allocation $0.55bn noted.

### 7.5 Data provenance & limitations

- **Country data is real and cited** (ND-GAIN 2024, UNFCCC NDC registry, PCAF GEMS, BNEF, CPI, IFC PS6).
  The engine is **deterministic** — the docstrings note prior `rng.uniform`/`rng.random` fabrications were
  removed from both the GEMS loss and PS6 compliance paths.
- The entity-loss allocation `/(exposure_m·50)` is an explicit **modelling simplification** (exposure as a
  proxy for ~2% national asset-base share per $M), documented in-code as an approximation.
- PS6 compliance is **honestly null** when evidence is not supplied — a strong model-risk practice
  (no default-to-compliant).
- Composite weights are expert priors, not statistically fit.

**Framework alignment:** **ND-GAIN Country Index** (vulnerability/readiness); **UNFCCC NDC** ambition
(mapped to **Climate Action Tracker** 1.5°C/2°C bands); **PCAF GEMS** (Global Emerging Markets risk
database) climate-adjusted expected loss; **IFC Performance Standard 6** biodiversity (critical/natural/
modified habitat, mitigation hierarchy avoid>minimise>restore>offset, no-net-loss / net-gain, offset
ratios); **GCF/GEF/MDB** concessional-finance eligibility and **OECD DAC** blended-finance principles;
IPCC AR6 regional loss uplift.

This module does **not** require a §8 model specification: it is a faithful, source-cited implementation.
The only production gaps are (a) replacing the simplified `/(exposure_m·50)` entity-loss allocation with a
proper asset-base share, and (b) feeding real per-project PS6 evidence rather than leaving criteria null.
