## 7 · Methodology Deep Dive

> ⚠️ **Guide↔code mismatch flag.** The guide's formula is `LEI (Litigation Exposure Index) =
> Σ(Asset Value × Case Probability × Liability Severity)`. **No case-probability or
> liability-severity decomposition exists in the code** — `litigationExposure` is simply
> `bookValue × (sr()×0.5+0.02)`, a flat random 2–52% haircut of book value with no case-level data
> (despite the guide citing "312 active cases tracked" from the Sabin Center database, no case list
> or case-to-asset matching exists in this file).

### 7.1 What the module computes

120 synthetic fossil-fuel assets (`ASSETS`, 8 types × 20 countries × 20 fictional owner companies),
each with independently `sr()`-seeded fields:

```
strandingRisk    = round(5 + sr(i×17)×90)                         // 5–95
bookValue ($M)   = round((sr(i×19)×4+0.05)×1000)                   // $50M–4.05Bn
remainingLife     = round(2 + sr(i×23)×35)                          // 2–37 years
carbonLockIn (Mt) = 5 + sr(i×29)×500                                 // 5–505 MtCO₂
decommissionCost  = bookValue × (sr(i×31)×0.3+0.05)                  // 5–35% of book value
litigationExposure= bookValue × (sr(i×37)×0.5+0.02)                  // 2–52% of book value
creditorExposure  = bookValue × (sr(i×41)×0.7+0.1)                   // 10–80% of book value
ngfsWriteDown[4 scenarios] = lo + sr()×(hi−lo)   per NGFS_WRITE_DOWN_RANGES
  Net Zero 2050: [55,85]%   Below 2°C: [35,65]%   Delayed Transition: [20,45]%   Hot House World: [10,25]%
remainingEconValue = max(0, bookValue × (remainingLife/40) × (1−strandingRisk/100))
```

80 synthetic creditors (`CREDITORS`) each linked to a random asset, with `exposureUSD` ($10M–3Bn),
`loanToValue` (10–90%), `provisioning` (0–30%), `litigationRisk` (10–80). 20 synthetic regulatory
triggers (`REG_TRIGGERS`) with real-sounding trigger names (carbon pricing >$100/t, coal phase-out
mandate, CBAM, SFDR Art.9 reclassification, etc.) and a random `probability` (0.1–0.8).

The `NGFS_WRITE_DOWN_RANGES` ordering is directionally correct: Net Zero 2050 (orderly, fast
transition) implies the **largest** write-down range (55–85%) since assets strand sooner/harder,
while Hot House World (no transition) implies the **smallest** (10–25%) since fossil assets keep
operating — consistent with real NGFS-scenario stranded-asset logic.

### 7.2 Parameterisation

| Field | Range | Provenance |
|---|---|---|
| `strandingRisk` | 5–95 | Synthetic, uniform-ish |
| `litigationExposure` | 2–52% of book value | Synthetic; no case-probability/severity basis despite guide's formula |
| `scc` (social cost of carbon, used in a companion tab) | **$51/tCO₂** | Real — matches the 2021 US Interagency Working Group central SCC estimate |
| `NGFS_WRITE_DOWN_RANGES` | 10–85% by scenario | Synthetic ranges, correctly ordered by scenario severity |
| Creditor `exposureUSD` | $10M–3Bn | Synthetic |

### 7.3 Calculation walkthrough

1. **Asset generation** — 120 synthetic assets as above; India-mode swap via `isIndiaMode()` /
   `adaptForPhysicalRisk()` replaces the default synthetic set with an India-specific adapted dataset
   when the platform's India context is active (a genuine data-source switch, not itself computed
   here).
2. **Stranding Dashboard** — portfolio KPIs: total book value at risk under the selected NGFS
   scenario (`Σ bookValue×ngfsWriteDown[scenario]/100`), top asset types by write-down, scenario
   comparison bars.
3. **Carbon Lock-In Analytics** — `sccExposure = Σ(carbonLockIn) × $51/tCO₂ × 1e6` — converts total
   locked-in carbon (Mt) across filtered assets into a dollar externality using the real SCC figure;
   a genuinely meaningful (if asset-selection-dependent) metric. A companion chart shows locked-in
   carbon remaining by 5-year horizon, filtering assets whose `remainingLife` still covers that
   horizon.
4. **Creditor Exposure tab** — cross-tabulates the 80 synthetic creditors by type/asset, with
   `litigationRisk` as an independent random score (not derived from the asset's own
   `litigationExposure`).
5. **Regulatory Trigger Map** — for the first 20 filtered assets, matches applicable `REG_TRIGGERS`
   by asset type and computes a `triggerScoreByAsset` (implementation detail not fully traced here;
   built from the count/probability of applicable triggers).

### 7.4 Worked example

Asset `i=0`: `type=ASSET_TYPES[floor(sr(0)×8)]`. `sr(0)=frac(sin(1)×10⁴)=0.7147` →
`typeIdx=floor(0.7147×8)=5` → **"Coal Mine"**. `bookValue = round((sr(19)×4+0.05)×1000)`; continuing
the seeded chain for this asset gives a specific book value, stranding risk, and NGFS write-down
percentages per scenario — all independently drawn, so (as with the sibling
`stranded-asset-watchlist` and other modules in this family) there is no guarantee a high
`strandingRisk` asset also shows a high `litigationExposure` or `ngfsWriteDown`, since none of these
fields are derived from one another.

### 7.5 Companion analytics

- **Regulatory Trigger Map** — 20 real-sounding regulatory triggers (carbon pricing, CBAM, SFDR
  Art.9, IEA NZE alignment, mandatory transition plans) mapped to asset types with a synthetic
  probability — descriptive scenario cataloguing.
- **Summary & Export** — CSV/portfolio-level export of the full synthetic dataset.

### 7.6 Data provenance & limitations

- **100% synthetic asset, creditor, and litigation data.** No Sabin Center Climate Litigation
  Database case records are ingested despite being the guide's primary cited source and headline
  dataPoint ("312 active cases tracked").
- `litigationExposure` has no relationship to `strandingRisk`, `permitStatus`, or jurisdiction —
  a "Revoked" permit status does not increase the synthetic litigation exposure figure.
- The SCC-based carbon lock-in externality ($51/tCO₂) is the one genuinely well-sourced constant in
  the file; everything it multiplies (`carbonLockIn`) is itself synthetic.
- Creditor-asset linkage is random (`assetIdx = floor(sr()×120)`), not based on any real financing
  relationship data.

**Framework alignment:** Sabin Center Global Climate Litigation Database (named in guide, not
ingested) · NGFS Phase-consistent scenario stranding ranges (correctly ordered by scenario severity,
magnitudes synthetic) · US Interagency Working Group Social Cost of Carbon 2021 ($51/tCO₂, correctly
applied in the carbon lock-in externality calculation) · TCFD litigation-risk guidance (conceptual
framing only).
