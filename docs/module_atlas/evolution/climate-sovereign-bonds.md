## 9 · Future Evolution

### 9.1 Evolution A — Runtime greenium from interpolated conventional curves (analytics ladder: rung 1 → 3)

**What.** Today the greenium is *embedded* in the curated 31-row `ISSUERS` seed — §7 is
explicit that the page "does not interpolate a real conventional yield curve to compute
matched-maturity greenium at runtime", and `YIELD_CURVE` is a representative tenor grid,
not bootstrapped. Evolution A makes `Greenium = YTM_conventional − YTM_green` an actual
computation: interpolate each sovereign's conventional curve at the green bond's
maturity and report the spread with a confidence band, then benchmark the distribution
against the BIS WP-923 / OECD −1 to −5 bp range the module already cites.

**How.** (1) First backend vertical `GET /api/v1/sovereign-gss/greenium/{issuer}`:
store per-issuer conventional bond points (tenor, YTM) and GSS bond terms in two new
tables (`sovereign_bond_curve`, `sovereign_gss_issue`), seeded initially from published
central-bank/OECD curve data; monotone cubic interpolation at matched maturity.
(2) The AA/AAA restriction the page applies to `GREENIUM_DATA` becomes a documented
credit-matching rule rather than a display filter. (3) Calibration payload: computed
portfolio greenium vs the BIS/OECD literature band, shown per §8's validation approach.
(4) Frontend keeps `SDG_ALLOCATION` and `REGULATORY_STANDARDS` panels as curated
reference — they are genuinely reference content.

**Prerequisites.** A curve data source (ECB/FRED sovereign yields are free and
keyless — consistent with the NX batch's free-data constraint); no PRNG defect exists
here to purge. **Acceptance:** the §7.4 worked example (3.14% vs 3.10% → −4 bp)
reproduces through the interpolator; issuers whose computed greenium falls outside
−10..+5 bp are flagged, not silently averaged into the KPI.

### 9.2 Evolution B — Framework-credibility copilot over prospectus corpora (LLM tier 1 → 2)

**What.** The stated workflow starts with "collect sovereign GSS bond prospectuses and
assess ICMA GBP / NDC alignment" — currently impossible in-module because `framework`,
`sdg`, and `climateScore` are stored attributes, not assessed outputs (§7.5). Evolution
B uses an LLM where it genuinely adds capability: ingest an issuer's green bond
framework PDF and produce a structured ICMA GBP four-pillar assessment (use of
proceeds, project evaluation, management of proceeds, reporting) with clause-level
citations, plus an NDC-consistency comparison against the issuer's stated sectoral
targets.

**How.** Tier-1 grounding is this Atlas record plus the ICMA GBP 2021 text (already a
cited reference document); the assessment prompt outputs the module's existing field
schema (`framework`, `verifier`, SDG mapping) so results slot into the `ISSUERS` table
with provenance flipped from `curated` to `document-assessed`. Tier 2 adds tool calls
to the Evolution A greenium endpoint so an analyst can ask "does the market reward this
issuer's framework quality?" and get computed greenium next to the credibility score.

**Prerequisites.** Document upload path (the platform's data-intake route family
exists); every extracted claim must carry a page/clause citation — no un-cited scores.
**Acceptance:** on 3 public sovereign frameworks (e.g. Germany, Chile, India), the
copilot's pillar assessments cite retrievable clauses; fields it cannot evidence are
returned null, honoring the platform's honest-nulls convention.
