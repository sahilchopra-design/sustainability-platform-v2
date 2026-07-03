# CDFI Climate Finance Analytics
**Module ID:** `cdfi-climate-finance` · **Route:** `/cdfi-climate-finance` · **Tier:** B (frontend-computed) · **EP code:** EP-DY6 · **Sprint:** DY

## 1 · Overview
CDFI climate finance analytics covering equity-focused climate finance targeting LMI communities, green home improvement lending, clean energy access metrics, and Treasury CDFI Fund certification requirements.

> **Business value:** Enables CDFI climate finance portfolio analytics integrating LMI targeting compliance, environmental justice screening, and energy burden reduction measurement to demonstrate climate equity impact.

## 2 · Function Map

### 2.1 Frontend (1 files)
**Components/functions:** `CAPITAL_STACK`, `CDFIS`, `CLIMATE_PROGRAMS`, `Kpi`, `NMTC_PROGRAMS`, `TABS`

**Derived values computed in the UI layer:**

| Variable | Expression |
|---|---|
| `netProjectCost` | `projectCost - subsidy;` |
| `nmtc` | `calcNmtcBenefit({ projectCost: projectCost * 1e6, taxCreditRate: 0.39, investorEquity: investorEquity * 1e6 });` |
| `totalAum` | `CDFIS.reduce((s, c) => s + c.aum, 0);` |
| `totalJobs` | `CDFIS.reduce((s, c) => s + c.jobs, 0);` |
| `avgClimate` | `CDFIS.length ? CDFIS.reduce((s, c) => s + c.climate, 0) / CDFIS.length : 0;` |
| `climateDeployment` | `(portfolioAum * climateAlloc / 100).toFixed(0);` |
| `lendingTrend` | `useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025].map((yr, i) => ({` |

## 3 · Data Sources & Provenance
**Provenance classes:** `frontend-seed`
**Frontend seed datasets:** `CAPITAL_STACK`, `CDFIS`, `CLIMATE_PROGRAMS`, `NMTC_PROGRAMS`, `TABS`

## 4 · End-to-End Data Lineage (source → transformation → UI)

### 4.1 UI metrics — where every number comes from
| UI metric | Formula | Source | Interpretation |
|---|---|---|---|
| LMI Climate Finance Targeting Rate | `Climate loans to LMI census tracts / total climate portfolio × 100` | CDFI annual report to Treasury CDFI Fund | Treasury CDFI certification requires 60%+ activity in LMI; leading climate CDFIs achieve 80-95% |
| Energy Burden Reduction | `Pre-investment energy cost as % income minus post-investment energy cost % income` | ACEEE low-income energy burden data | Average LMI energy burden 8-10% vs 3% national avg; clean energy investment reduces by 2-5 percentage points |
| Treasury CDFI Award per $ | `Treasury CDFI Fund award / total financing catalysed` | CDFI Fund award announcement database | CDFIs leverage $8-12 of private capital per $1 CDFI Fund award; climate focus may achieve higher leverage via  |
- **FFIEC census tract data and CDFI Fund mapping** → LMI census tract designations → portfolio targeting rate calculation → **LMI compliance and CDFI certification support**
- **EPA EJSCREEN scores by census tract** → Environmental justice indicators (pollution burden, demographics) → EJ screening for loan targeting → **Environmental justice co-benefit measurement**
- **ACEEE low-income energy burden database** → Pre-investment energy burden by geography and housing type → impact measurement baseline → **Energy burden reduction outcome tracking**

## 5 · Intermediate Transformation Logic
**Methodology:** Climate Equity Finance Targeting
**Headline formula:** `LMI Targeting Rate = LMI-targeted climate loans / total climate portfolio × 100; Climate Equity Score = 0.4×LMI Rate + 0.3×Environmental Justice + 0.3×Energy Burden Reduction`
**Standards:** ['Treasury CDFI Fund Certification Standards 2024', 'EPA Environmental Justice Screening Tool (EJSCREEN)', 'DOE Justice40 Initiative Guidelines']

## 6 · Interconnections & Change Risk
**Blast radius:** changes here can affect **0** other module(s).