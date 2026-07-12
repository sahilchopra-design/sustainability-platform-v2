## 7 · Methodology Deep Dive

> ✅ **Guide↔code mismatch — resolved.** This module_id previously had a three-way naming collision:
> the MODULE_GUIDES entry described a **clean-technology disruption/stranded-asset** platform
> (`TDRS = (LegacyCost/CleanTechCost)⁻¹ × MarketPenetrationRate`, covering solar/wind/EV/heat-pump/
> hydrogen cost curves threatening legacy fossil assets, cited to BloombergNEF EVO and Carbon
> Tracker), while the frontend page actually implements a **cyber/IT operational-risk panel**
> (`EP-BB2`, "Coverage: cyber risk scoring, AI/model risk, operational technology risk, supply chain
> concentration, vendor dependency, tech obsolescence, regulatory exposure"), and a **third,
> independent concept** — genuine **data-centre/AI carbon-footprint calculators** — lives in the
> orphaned backend engine (`backend/services/technology_risk_engine.py` and its routes in
> `api/v1/routes/technology.py`).
>
> **Resolution (this pass):** the guide/documentation has been rewritten (in
> `frontend/src/data/moduleGuides.js`, `docs/module_atlas/module_guides.json`, and
> `docs/module_atlas/modules/technology-risk.md` §1/§4.1/§5) to honestly describe what the frontend
> page actually does — cyber/IT operational risk — since the cyber/IT implementation is a genuinely
> useful, working feature and rewriting the frontend to chase the old stranded-asset description
> would have been a much larger, unjustified scope change. The frontend page itself already carried
> accurate self-description (`"Technology Risk Panel"` / `EP-BB2` / "Cyber · AI/Model · OT · DORA ·
> NIS2 · EU AI Act · 45 Entities"` in both the in-page header and the `App.js` nav label), so no
> frontend code changes were needed there. The backend carbon-footprint engine remains unwired to any
> frontend route (see §7.5) — it has been left as-is per design decision, with a note added at the
> top of the engine file flagging it as an orphaned capability for a future dedicated module.

### 7.1 What the frontend page computes

45 synthetic companies (`COMPANIES`) across 10 financial/tech-adjacent sectors (Banking, Insurance,
Asset Management, Fintech, Healthcare, Energy, Industrials, Consumer Tech, Telecom, Government), each
independently `sr()`-seeded across 8 risk-category scores (`cyberScore`, `aiRisk`, `cloudConc`,
`vendorRisk`, `otRisk`, `dataPrivacy`, `legacyDebt`, `overallRisk`, all 0–100), plus
`incidents12m` (0–8), `patchLag` (5–90 days), cloud provider, AI maturity tier, and DORA/NIS2
coverage flags. A 12-month incident-trend series (`INCIDENT_TREND`, 5 attack types), a 7-axis
governance radar (`RADAR_DATA`), a 10-category risk-maturity-vs-benchmark comparison
(`MATURITY_DATA`), an 8-vendor concentration table (`VENDOR_CONC`, Microsoft/AWS/Palo Alto/Broadcom-
VMware/Oracle/SAP/Crowdstrike/Cisco), and a 10-regulation readiness table (`REG_READINESS`).

### 7.2 Genuine aggregation formulas

```js
sectorAvg[sector] = mean(overallRisk) across companies in that sector
maturityDist[tier] = { count: companies with aiMaturity===tier, pct: count/COMPANIES.length×100 }
aiRiskByMaturity[tier] = mean(aiRisk) across companies with that aiMaturity tier
```

These are correct, guard-appropriate unweighted means/percentages (`COMPANIES.length=45` is a fixed
non-empty constant). All inputs being aggregated are independently `sr()`-seeded per-company random
draws, so cross-tabulations (e.g. "does higher AI maturity correlate with higher AI risk?") reflect
the PRNG's coincidental patterns, not a modelled relationship.

### 7.3 Worked example

Company `i=10`: `sector = pick(SECTORS, 70)`. `cyberScore = round(30+sr(30)×65)`. `sr(30) =
frac(sin(31)×10⁴)`; `sin(31 rad)≈-0.404`, ×10⁴=-4040, frac (negative handled via `x−floor(x)`)
≈0.05 → `cyberScore ≈ round(30+0.05×65) = round(33.25) = 33`. Independently, `aiRisk =
round(20+sr(70)×75)` uses a completely different seed multiplier (`i×7=70`), so this company's
cyber score and AI risk score have no derived relationship — a company can show a low cyber score
(good defence) alongside a high AI risk score (poor model governance) purely by chance, which is
realistic in spirit (different risk dimensions genuinely can diverge) but not evidence of any
underlying causal model in this specific implementation.

### 7.4 Companion analytics

- **Vendor concentration** (`VENDOR_CONC`) — 8 real technology vendors with hand-assigned exposure %
  and risk tier (Microsoft 82%/High, AWS 71%/High, Broadcom/VMware 63%/High) — plausible
  concentration figures reflecting real hyperscaler/enterprise-software dependency patterns, static
  rather than computed from the 45-company dataset.
- **Regulatory readiness** — 10 real regulations (EU AI Act, NIS2, DORA, SEC Cyber Rule, NIST CSF 2.0,
  ISO 27001:2022, GDPR Art 32, UK NCSC CAF, NYDFS 500, FCA Operational Resilience) — accurate
  real-world regulatory citations, paired with `doraCovered`/`nisCovered` per-company boolean flags
  from the synthetic dataset.
- **Incident trend** — 5 attack-type time series (Ransomware, Data Breach, Supply Chain, OT Attack,
  Phishing) over 12 months, independently `sr()`-seeded per type/month, no seasonality or
  cross-type correlation modelled.

### 7.5 The backend engine (unused by this frontend page — left as-is by design)

`backend/services/technology_risk_engine.py` (986 lines) implements five genuine calculators —
`DataCentreResult` (PUE-based energy/carbon), `CloudEmissionsResult`, `AIModelCarbonResult` (training
compute → carbon), `SemiconductorRiskResult`, `EWasteResult` — exposed via `api/v1/routes/technology.py`
(`GET /ref/pue-benchmarks`, `GET /ref/grid-factors`, `GET /ref/semiconductor`, `POST /ai-carbon`,
etc.). These are legitimate, differently-scoped calculators (data-centre/AI environmental footprint,
not cyber risk and not clean-tech stranded-asset risk) that exist in the codebase but are **not
invoked anywhere in `TechnologyRiskPage.jsx`** — no `fetch`/API call to these endpoints appears in
the frontend file. This backend capability would need its own dedicated frontend page (e.g. an
"AI Carbon Accounting" module) or a new tab on this one to be surfaced to users; a top-of-file
comment has been added to `technology_risk_engine.py` documenting this so a future session can pick
it up without re-discovering the gap.

### 7.6 Data provenance & limitations

- **All 45 companies and every risk score are `sr()`-seeded synthetic data.**
- The guide's former `TDRS` clean-tech-disruption formula, BloombergNEF/Carbon Tracker data points,
  and asset-impairment-timeline modelling never existed anywhere in this route's code — the guide
  text has been corrected to remove that framing (see resolution note above).
- The genuinely-implemented backend AI/data-centre carbon engine remains orphaned from this frontend
  page — a real capability gap between what exists in the codebase and what a user can access via
  this route, intentionally left unaddressed this pass (see §7.5).
- Vendor concentration and regulatory readiness tables are accurate real-world reference content but
  static, not computed from company-level vendor/compliance data.

**Framework alignment:** EU AI Act, NIS2, DORA, NIST CSF 2.0, ISO 27001:2022, GDPR Art. 32 are
correctly named and current as real cyber/AI/operational-resilience regulations — this is the
module's genuine strength (an accurate regulatory-landscape reference), independent of both the
former stranded-asset guide framing and the orphaned backend carbon engine.
