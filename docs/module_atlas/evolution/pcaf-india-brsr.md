## 9 · Future Evolution

### 9.1 Evolution A — Real BRSR filings behind the India-adapted PCAF engine (analytics ladder: rung 2 → 3)

**What.** §7 shows a correct engine: the same PCAF attribution formula as the platform flagship (`FE = AF × (Scope1+Scope2)`, `AF = Exposure_INR_Cr/EVIC_INR_Cr` capped at 1.0), adapted to INR-denominated instruments and SEBI BRSR Core format, with a sensible DQ inference (any reported Scope 1/2 → DQ3, else DQ4 proxy) and two extension books (motor insurance with real physical-activity fields, facilitated bond deals). The gap: `DEFAULT_HOLDINGS` (9 rows) are a demo portfolio styled on real Indian company structure (CIN, GICS) but not pulled from actual BRSR filings. Evolution A grounds it in the real SEBI BRSR data pipeline.

**How.** (1) Ingest actual BRSR Core filings — SEBI mandates BRSR for the top-1000 listed Indian companies and filings are public on stock-exchange portals; parse Scope 1/2 emissions, revenue, and identifiers (CIN/ISIN) into a `brsr_filings` table, so holdings resolve to real reported emissions rather than seeded values. (2) EVIC from real Indian market data (NSE/BSE market cap + debt); PCAF Tier 4/5 proxies (§1) fill gaps for unlisted holdings with an honest DQ downgrade. (3) The motor-insurance and facilitated-emissions books use real PCAF Part C activity-data fields already — wire them to actual policy/deal inputs.

**Prerequisites.** BRSR filing ingestion (public but semi-structured — parsing effort); Indian market data for EVIC; the attribution engine already matches the flagship, so reuse its pinned tests adapted to INR. **Acceptance:** financed emissions compute over real BRSR-sourced holdings; AF/WACI reproduce the flagship engine's logic in INR; DQ scores reflect reported-vs-proxy reality.

### 9.2 Evolution B — SEBI BRSR disclosure copilot (LLM tier 2)

**What.** A copilot for the Indian FI users §1 targets: "compute financed emissions for my portfolio in BRSR Core format", "which holdings lack BRSR-reported emissions?", "what's my portfolio WACI and DQ distribution?", "draft the BRSR Core financed-emissions disclosure section" — executed against the India-adapted PCAF engine, decomposing per-holding attribution in INR Cr.

**How.** Tool calls to endpoints wrapping the AF/FE/WACI/DQ functions; system prompt from this Atlas page's §5/§7.1 and the PCAF v2 / SEBI BRSR Core references named in §5 so the India-specific disclosure format is templated correctly. The disclosure draft maps to SEBI BRSR Core datapoints with every figure a tool output; the fabrication validator matches all tCO2e/AF/WACI to responses, and the copilot surfaces DQ scores (a BRSR/PCAF requirement) and flags holdings on Tier 4/5 proxies. Because it shares the flagship PCAF methodology, cross-desk consistency with the global module is a feature — the copilot can note where India results align with global PCAF treatment.

**Prerequisites.** Compute endpoints; Evolution A for real BRSR-sourced holdings (the engine works on demo data today). **Acceptance:** every financed-emissions/WACI figure traces to a tool call; the BRSR draft reports DQ scores; holdings without reported emissions are flagged as proxy-based, not imputed silently.
