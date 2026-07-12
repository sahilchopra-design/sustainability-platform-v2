## 7 · Methodology Deep Dive

> ⚠️ **"Run Assessment" button is a no-op against the displayed data.** The page does call the real
> backend (`POST /api/v1/transition-finance/assess`, handled by `backend/services/
> transition_finance_engine.py`), but the response is **never captured or used**:
> `await axios.post(...)` discards its return value, and any error is silently swallowed
> (`catch { void 0 }`). Every number on the page — TPT scores, SBTi trajectories, Race-to-Zero
> checklist, portfolio temperature, TNFD/instrument credibility — is instead computed **entirely
> client-side** from `seededRandom(seed0+n)`, where `seed0 = hashStr(companyName+sector+instrument)`.
> Clicking "Run Assessment" therefore does nothing visible: the same five data blocks would render
> identically whether or not the button is ever clicked, or whether the backend is even running.

### 7.1 What the module computes

Five independent synthetic scoring blocks, all keyed off a single DJB2-style string hash of the
user's three inputs (company name, sector, instrument type):

```js
hashStr(s)      // DJB2 hash: h = ((h<<5)+h) ^ charCode, repeated per character
seed0 = hashStr(companyName + sector + instrument)
r(n) = seededRandom(seed0 + n) = frac(sin(seed0+n+1) × 10⁴)
```

Because `seed0` is a deterministic hash of the exact input strings, the same company/sector/
instrument combination always reproduces the same "assessment" — but changing the company name by
even one character produces an entirely unrelated set of scores (hash avalanche), which is
inconsistent with how a real credibility assessment should behave (small input changes should not
flip the result).

### 7.2 Parameterisation

| Block | Formula | Range | Provenance |
|---|---|---|---|
| TPT composite | `round(Σ 6 dimension scores / 6)` where each dimension = `r(n)×spread+floor` | ~50–87 | Dimension names (Foundations, Implementation, Engagement, Metrics, Governance, Finance) match the UK's real **Transition Plan Taskforce (TPT)** Disclosure Framework's structure; the scores themselves are synthetic |
| TPT quality tier | 80/65/50 cutoffs → leading/advanced/developing/initial | — | Platform-defined tiering |
| SBTi near/long-term/net-zero scores | `r(10)×30+50`, `r(11)×32+45`, `r(12)×28+48` | ~45–82 | Synthetic; SBTi itself does not publish a single 0–100 "validation score" — it issues pass/fail target validation |
| SBTi sector baseline (`sectorBaselines`) | Fixed dict, e.g. steel 1800, banking 180 (implied tCO2e/$M or similar intensity unit) | 180–1800 | Platform-authored relative sector-intensity ranking (steel > oil&gas > power > cement ≈ aviation > shipping > agriculture > automotive > real estate > banking) — directionally plausible but not sourced from a named intensity database |
| Pathway curve (2024–2050) | `baseline × (multiplier + r(n)×spread)` at each milestone year, `paris` column a fixed % of baseline per year | — | The "Paris" line is a fixed geometric decline (98%→0% of baseline by 2050), not derived from a named 1.5°C sector pathway (e.g. SBTi SDA or IEA NZE) |
| Race-to-Zero checklist | 5 steps (Pledge/Plan/Proceed/Publish/Account) each `r(n) > threshold` | boolean | Real Race to Zero "5 P's" criteria structure; pass/fail is a random draw |
| `rtzScore` | `metCount × 20` | 0/20/40/60/80/100 | Simple count-based score — genuinely computed from the checklist booleans, though the booleans themselves are random |
| Portfolio temperature | `1.8 + r(40)×1.8` | 1.8–3.6°C | Synthetic; not derived from any actual holdings |
| TNFD LEAP / SBTN steps | boolean completion flags per stage | — | Real TNFD LEAP and SBTN 5-step taxonomies, randomly populated |
| Instrument credibility | `round(mean of 5 sub-scores)` (KPI Ambition, SPT Calibration, Greenwash Flags, Reporting Quality, Third-party Verify) | ~50–83 | Synthetic |

### 7.3 Calculation walkthrough

1. User enters company name / sector / instrument type; `seed0` is recomputed on every keystroke
   (no debounce), immediately re-rendering all 5 tabs with a new hash-derived dataset.
2. **TPT Credibility tab**: 6 dimension scores averaged into a composite, mapped to a 4-tier quality
   label; SBTi commitment status and Race-to-Zero membership are two more independent random draws
   presented alongside the TPT score without being combined into it.
3. **SBTi Validation tab**: near-term/long-term/net-zero target scores (0–100) plus an 8-point
   emissions pathway (2024→2050) benchmarked against a "Paris" reference line that is a fixed
   percentage decay of the sector baseline, not a modelled 1.5°C trajectory.
4. **Race to Zero tab**: 5-step pass/fail checklist → `rtzScore = metCount × 20`; 6 initiative
   memberships (GFANZ, NZBA, NZAM, NZI, NZAOA, RE100) as independent booleans.
5. **Portfolio Temperature tab**: a single portfolio ITR figure and its 2024→2050 projected decline
   (declining multiplier curve, not scenario-driven), plus a 4-bucket aligned/not-aligned holdings
   breakdown.
6. **TNFD & Instrument tab**: LEAP and SBTN completion checklists (both real TNFD/SBTN process
   taxonomies) plus a 5-factor instrument credibility score for the selected financial instrument
   type.

### 7.4 Worked example (`companyName="Atlas Energy Corp"`, `sector="power"`, `instrument="transition_bond"`)

| Step | Computation | Result |
|---|---|---|
| `seed0` | DJB2 hash of the concatenated string | **240,798,774** |
| TPT dimensions | Foundations 77, Implementation 68, Engagement 66, Metrics 50, Governance 59, Finance 80 | — |
| TPT composite | `round(400/6)` | **67** |
| TPT tier | `65 ≤ 67 < 80` | **Advanced** |
| SBTi status | `r(7)=0.586 > 0.5` | **Committed** |
| RTZ membership | `r(8)=0.784 > 0.45` | **True** |
| SBTi near-term score | `r(10)×30+50` | **70** |

Changing `companyName` to "Atlas Energy Corp " (trailing space) would produce a completely different
`seed0` and hence an unrelated set of scores — illustrating that the "assessment" is a hash lookup,
not a graded evaluation of the company's actual transition credentials.

### 7.5 Data provenance & limitations

- **All displayed scores are synthetic and disconnected from the real backend engine.** Even though
  `transition_finance_engine.py` and its `/assess`, `/instrument-screen`, and `/portfolio-
  temperature` endpoints exist and are called, their responses are discarded — see the mismatch
  note above. Any real scoring logic in the Python engine (which was not audited here since it is
  provably unused by this page) has zero effect on what the user sees.
- The hash-based seeding means results are **reproducible per exact input string** but **not
  smoothly related to nearby inputs** — a core property any legitimate scoring model should have
  (continuity) is absent by construction.
- The "Paris" reference pathway in the SBTi tab is a fixed percentage decay curve, not tied to any
  named 1.5°C sector decarbonisation pathway (e.g. SBTi's Sectoral Decarbonization Approach, IEA
  NZE technology roadmaps) despite sitting next to real SBTi terminology.
- No sensitivity, confidence interval, or audit trail is attached to any of the 5 blocks.

### 7.6 Framework alignment

- **UK Transition Plan Taskforce (TPT) Disclosure Framework**: the 6-dimension structure
  (Foundations, Implementation, Engagement, Metrics, Governance/Ambition, Finance) matches the
  TPT's real framework pillars; scoring is synthetic.
- **SBTi Corporate Net-Zero Standard**: near-term/long-term/net-zero terminology is correct SBTi
  vocabulary; SBTi itself validates targets as pass/fail against sector pathways rather than issuing
  a continuous 0–100 score, so the module's scoring convention is a platform simplification.
- **Race to Zero "5 P's" criteria** (Pledge, Plan, Proceed, Publish, Account): correctly represented
  as the 5 checklist items; UNFCCC-recognised initiative list (GFANZ, NZBA, NZAM, NZI, NZAOA, RE100)
  is accurate.
- **TNFD LEAP** and **SBTN 5-step framework**: both real taxonomies (Locate/Evaluate/Assess/Prepare;
  Assess/Interpret & Prioritise/Measure & Set Targets/Act/Track & Disclose) faithfully represented
  as completion checklists.
- **ICMA/GFANZ transition-instrument credibility criteria**: the 5-factor instrument score (KPI
  Ambition, SPT Calibration, Greenwash Flags, Reporting Quality, Third-party Verification) reflects
  real due-diligence dimensions used to assess SLBs/transition bonds, consistent with the separate
  `transition-bond-credibility` module's approach.
