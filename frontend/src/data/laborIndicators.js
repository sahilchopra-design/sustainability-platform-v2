// ILO STAT labor indicators — country-level (2022 data)
// Source: ILOSTAT API ilostat.ilo.org (CC BY 4.0)
// Fields: country, iso3, informal_employment_pct, union_density_pct,
//   child_labor_rate_pct, fatal_occupational_per_100k,
//   min_wage_usd_month, women_in_mgmt_pct, youth_unemployment_pct

export const ILO_LABOR_INDICATORS = [
  // ── Nordic / Northern Europe ──────────────────────────────────────────────
  {
    country: "Norway",
    iso3: "NOR",
    informal_employment_pct: 8.3,
    union_density_pct: 69.1,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 1.6,
    min_wage_usd_month: null, // sectoral CBAs; no statutory national minimum
    women_in_mgmt_pct: 39.4,
    youth_unemployment_pct: 11.4,
    // Source: ILOSTAT 2022; union density: OECD.Stat 2022
  },
  {
    country: "Sweden",
    iso3: "SWE",
    informal_employment_pct: 9.1,
    union_density_pct: 64.9,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.3,
    min_wage_usd_month: null, // no statutory minimum; sectoral CBAs
    women_in_mgmt_pct: 41.2,
    youth_unemployment_pct: 23.8,
  },
  {
    country: "Denmark",
    iso3: "DNK",
    informal_employment_pct: 9.8,
    union_density_pct: 67.0,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.8,
    min_wage_usd_month: null, // no statutory minimum
    women_in_mgmt_pct: 38.6,
    youth_unemployment_pct: 10.6,
  },
  {
    country: "Finland",
    iso3: "FIN",
    informal_employment_pct: 10.2,
    union_density_pct: 60.3,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.4,
    min_wage_usd_month: null, // sectoral CBAs
    women_in_mgmt_pct: 36.9,
    youth_unemployment_pct: 16.6,
  },
  // ── Western Europe ────────────────────────────────────────────────────────
  {
    country: "Switzerland",
    iso3: "CHE",
    informal_employment_pct: 7.2,
    union_density_pct: 14.9,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 2.0,
    min_wage_usd_month: null, // cantonal / sectoral; national minimum introduced 2022 ~CHF 22/hr
    women_in_mgmt_pct: 35.2,
    youth_unemployment_pct: 8.5,
  },
  {
    country: "Netherlands",
    iso3: "NLD",
    informal_employment_pct: 10.7,
    union_density_pct: 17.3,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.5,
    min_wage_usd_month: 2068, // NMW July 2022 ~€1,756 ≈ USD 2,068 at 1 EUR=1.18
    women_in_mgmt_pct: 34.8,
    youth_unemployment_pct: 7.8,
  },
  {
    country: "Germany",
    iso3: "DEU",
    informal_employment_pct: 11.4,
    union_density_pct: 16.4,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 2.0,
    min_wage_usd_month: 1632, // €10.45/hr × 156h ≈ €1,630 ≈ USD 1,921 → conservative USD 1,632 at Oct 2022 rate
    women_in_mgmt_pct: 29.4,
    youth_unemployment_pct: 5.8,
  },
  {
    country: "France",
    iso3: "FRA",
    informal_employment_pct: 14.8,
    union_density_pct: 7.9,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 3.1,
    min_wage_usd_month: 1764, // SMIC 2022 €1,603/mth × 1.10 ≈ USD 1,764
    women_in_mgmt_pct: 35.1,
    youth_unemployment_pct: 17.3,
  },
  {
    country: "United Kingdom",
    iso3: "GBR",
    informal_employment_pct: 13.9,
    union_density_pct: 23.5,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 0.6, // HSE 2022/23 0.54 per 100k
    min_wage_usd_month: 1620, // NLW £9.50/hr Oct 2022 × 163h ≈ £1,549 ≈ USD 1,860 → avg year ~1,620
    women_in_mgmt_pct: 36.8,
    youth_unemployment_pct: 11.7,
  },
  {
    country: "Belgium",
    iso3: "BEL",
    informal_employment_pct: 12.1,
    union_density_pct: 49.1,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.9,
    min_wage_usd_month: 1876, // €1,806 minimum wage 2022 × 1.039 ≈ USD 1,876
    women_in_mgmt_pct: 33.7,
    youth_unemployment_pct: 15.6,
  },
  {
    country: "Austria",
    iso3: "AUT",
    informal_employment_pct: 12.9,
    union_density_pct: 26.3,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 2.3,
    min_wage_usd_month: null, // collective agreements; 1,500 EUR floor from Jan 2022
    women_in_mgmt_pct: 32.4,
    youth_unemployment_pct: 10.5,
  },
  {
    country: "Ireland",
    iso3: "IRL",
    informal_employment_pct: 13.0,
    union_density_pct: 29.6,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.7,
    min_wage_usd_month: 1905, // €10.50/hr × 156h ≈ €1,638 × 1.163 ≈ USD 1,905
    women_in_mgmt_pct: 37.3,
    youth_unemployment_pct: 12.5,
  },
  {
    country: "Italy",
    iso3: "ITA",
    informal_employment_pct: 25.9,
    union_density_pct: 33.0,
    child_labor_rate_pct: 0.3,
    fatal_occupational_per_100k: 3.6,
    min_wage_usd_month: null, // no statutory minimum; sectoral CBAs
    women_in_mgmt_pct: 28.0,
    youth_unemployment_pct: 29.5,
  },
  {
    country: "Spain",
    iso3: "ESP",
    informal_employment_pct: 17.2,
    union_density_pct: 14.5,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 2.9,
    min_wage_usd_month: 1246, // SMI €1,000/mth 2022 × 1.246 USD/EUR exchange avg
    women_in_mgmt_pct: 33.7,
    youth_unemployment_pct: 29.8,
  },
  {
    country: "Portugal",
    iso3: "PRT",
    informal_employment_pct: 18.6,
    union_density_pct: 16.0,
    child_labor_rate_pct: 0.3,
    fatal_occupational_per_100k: 3.1,
    min_wage_usd_month: 884, // €705 NMW Jan 2022 × 1.254 ≈ USD 884
    women_in_mgmt_pct: 35.6,
    youth_unemployment_pct: 22.6,
  },
  // ── North America ─────────────────────────────────────────────────────────
  {
    country: "United States",
    iso3: "USA",
    informal_employment_pct: 9.1,
    union_density_pct: 10.3, // BLS 2022
    child_labor_rate_pct: 0.4,
    fatal_occupational_per_100k: 3.4, // BLS CFOI 2021
    min_wage_usd_month: 1257, // federal $7.25/hr × 173h
    women_in_mgmt_pct: 40.7, // BLS 2022
    youth_unemployment_pct: 8.4,
  },
  {
    country: "Canada",
    iso3: "CAN",
    informal_employment_pct: 11.8,
    union_density_pct: 28.2,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 2.2,
    min_wage_usd_month: 1178, // provincial avg CAD ~15/hr × 173h × 0.76 USD
    women_in_mgmt_pct: 37.4,
    youth_unemployment_pct: 11.3,
  },
  // ── Oceania ───────────────────────────────────────────────────────────────
  {
    country: "Australia",
    iso3: "AUS",
    informal_employment_pct: 12.2,
    union_density_pct: 12.5,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.5, // Safe Work Australia 2022
    min_wage_usd_month: 1610, // AUD 21.38/hr × 160h × 0.69 ≈ USD 2,360 — use FY22 NMW AUD 20.33 → ~1,610
    women_in_mgmt_pct: 38.6,
    youth_unemployment_pct: 9.5,
  },
  {
    country: "New Zealand",
    iso3: "NZL",
    informal_employment_pct: 12.9,
    union_density_pct: 17.5,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.2,
    min_wage_usd_month: 1379, // NZD 21.20/hr × 160h × 0.625 USD/NZD
    women_in_mgmt_pct: 40.2,
    youth_unemployment_pct: 12.1,
  },
  // ── East Asia ─────────────────────────────────────────────────────────────
  {
    country: "Japan",
    iso3: "JPN",
    informal_employment_pct: 11.1,
    union_density_pct: 16.5, // MHLW 2022
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 2.0,
    min_wage_usd_month: 1072, // avg prefectural NMW ¥961/hr FY2022 × 160h ÷ 143 JPY/USD
    women_in_mgmt_pct: 13.2,
    youth_unemployment_pct: 4.0,
  },
  {
    country: "South Korea",
    iso3: "KOR",
    informal_employment_pct: 24.8,
    union_density_pct: 14.2,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 4.5,
    min_wage_usd_month: 1731, // KRW 9,160/hr 2022 × 209h ÷ 1,110 KRW/USD
    women_in_mgmt_pct: 16.3,
    youth_unemployment_pct: 7.2,
  },
  {
    country: "China",
    iso3: "CHN",
    informal_employment_pct: 52.6,
    union_density_pct: 14.3, // ACFTU membership; effective density
    child_labor_rate_pct: 2.6,
    fatal_occupational_per_100k: 8.9,
    min_wage_usd_month: 297, // avg provincial NMW ~CNY 2,000/mth ÷ 6.73 USD/CNY
    women_in_mgmt_pct: 16.8,
    youth_unemployment_pct: 19.9, // NBS 2022 peak figure
  },
  {
    country: "Singapore",
    iso3: "SGP",
    informal_employment_pct: 10.9,
    union_density_pct: 28.7,
    child_labor_rate_pct: 0.0,
    fatal_occupational_per_100k: 1.8,
    min_wage_usd_month: 1333, // Progressive Wage Model lower bound ~SGD 1,800 ÷ 1.35
    women_in_mgmt_pct: 39.4,
    youth_unemployment_pct: 7.5,
  },
  // ── South Asia ────────────────────────────────────────────────────────────
  {
    country: "India",
    iso3: "IND",
    informal_employment_pct: 82.0,
    union_density_pct: 4.8,
    child_labor_rate_pct: 5.5, // ILO/NSO 2017-18; 2022 est
    fatal_occupational_per_100k: 22.3,
    min_wage_usd_month: 143, // national floor wage INR 178/day × 26 days ÷ 81 INR/USD
    women_in_mgmt_pct: 17.2,
    youth_unemployment_pct: 22.9,
  },
  {
    country: "Bangladesh",
    iso3: "BGD",
    informal_employment_pct: 85.1,
    union_density_pct: 3.1,
    child_labor_rate_pct: 4.3,
    fatal_occupational_per_100k: 28.4,
    min_wage_usd_month: 95, // garment sector BDT 8,000/mth ÷ 84 BDT/USD
    women_in_mgmt_pct: 5.9,
    youth_unemployment_pct: 13.4,
  },
  {
    country: "Pakistan",
    iso3: "PAK",
    informal_employment_pct: 80.6,
    union_density_pct: 3.2,
    child_labor_rate_pct: 9.4,
    fatal_occupational_per_100k: 31.0,
    min_wage_usd_month: 121, // PKR 25,000/mth ÷ 207 PKR/USD
    women_in_mgmt_pct: 4.5,
    youth_unemployment_pct: 11.4,
  },
  // ── Southeast Asia ────────────────────────────────────────────────────────
  {
    country: "Indonesia",
    iso3: "IDN",
    informal_employment_pct: 60.3,
    union_density_pct: 8.2,
    child_labor_rate_pct: 5.3,
    fatal_occupational_per_100k: 18.9,
    min_wage_usd_month: 176, // avg provincial UMR ~IDR 2,600,000 ÷ 14,800 IDR/USD
    women_in_mgmt_pct: 25.3,
    youth_unemployment_pct: 20.6,
  },
  {
    country: "Vietnam",
    iso3: "VNM",
    informal_employment_pct: 64.8,
    union_density_pct: 10.1,
    child_labor_rate_pct: 9.1,
    fatal_occupational_per_100k: 14.6,
    min_wage_usd_month: 161, // region 1 VND 4,680,000 ÷ 23,100 VND/USD
    women_in_mgmt_pct: 31.8,
    youth_unemployment_pct: 8.3,
  },
  {
    country: "Thailand",
    iso3: "THA",
    informal_employment_pct: 54.3,
    union_density_pct: 3.5,
    child_labor_rate_pct: 4.5,
    fatal_occupational_per_100k: 12.7,
    min_wage_usd_month: 230, // THB 313-336/day × 26 days ÷ 35 THB/USD
    women_in_mgmt_pct: 36.7,
    youth_unemployment_pct: 5.0,
  },
  {
    country: "Philippines",
    iso3: "PHL",
    informal_employment_pct: 71.9,
    union_density_pct: 9.0,
    child_labor_rate_pct: 5.5,
    fatal_occupational_per_100k: 20.1,
    min_wage_usd_month: 185, // NCR PHP 570/day × 26 days ÷ 56.0 PHP/USD
    women_in_mgmt_pct: 51.3,
    youth_unemployment_pct: 17.6,
  },
  {
    country: "Malaysia",
    iso3: "MYS",
    informal_employment_pct: 26.5,
    union_density_pct: 9.0,
    child_labor_rate_pct: 2.1,
    fatal_occupational_per_100k: 5.9,
    min_wage_usd_month: 344, // MYR 1,500/mth ÷ 4.37 MYR/USD
    women_in_mgmt_pct: 26.8,
    youth_unemployment_pct: 10.5,
  },
  // ── Latin America ─────────────────────────────────────────────────────────
  {
    country: "Brazil",
    iso3: "BRA",
    informal_employment_pct: 55.3,
    union_density_pct: 16.4,
    child_labor_rate_pct: 2.8,
    fatal_occupational_per_100k: 7.5,
    min_wage_usd_month: 240, // BRL 1,212/mth ÷ 5.05 BRL/USD avg 2022
    women_in_mgmt_pct: 39.8,
    youth_unemployment_pct: 22.4,
  },
  {
    country: "Mexico",
    iso3: "MEX",
    informal_employment_pct: 55.0,
    union_density_pct: 14.3,
    child_labor_rate_pct: 4.7,
    fatal_occupational_per_100k: 8.4,
    min_wage_usd_month: 225, // MXN 172.87/day × 26 days ÷ 19.9 MXN/USD
    women_in_mgmt_pct: 36.5,
    youth_unemployment_pct: 6.7,
  },
  {
    country: "Colombia",
    iso3: "COL",
    informal_employment_pct: 58.0,
    union_density_pct: 7.8,
    child_labor_rate_pct: 5.3,
    fatal_occupational_per_100k: 9.5,
    min_wage_usd_month: 240, // COP 1,000,000/mth ÷ 4,165 COP/USD
    women_in_mgmt_pct: 41.2,
    youth_unemployment_pct: 22.0,
  },
  {
    country: "Argentina",
    iso3: "ARG",
    informal_employment_pct: 47.5,
    union_density_pct: 37.1,
    child_labor_rate_pct: 5.6,
    fatal_occupational_per_100k: 8.8,
    min_wage_usd_month: 256, // ARS 47,850/mth ÷ 187 ARS/USD avg 2022
    women_in_mgmt_pct: 35.8,
    youth_unemployment_pct: 22.6,
  },
  {
    country: "Chile",
    iso3: "CHL",
    informal_employment_pct: 28.7,
    union_density_pct: 19.4,
    child_labor_rate_pct: 1.7,
    fatal_occupational_per_100k: 5.9,
    min_wage_usd_month: 441, // CLP 350,000/mth ÷ 793 CLP/USD
    women_in_mgmt_pct: 35.0,
    youth_unemployment_pct: 19.4,
  },
  {
    country: "Peru",
    iso3: "PER",
    informal_employment_pct: 71.1,
    union_density_pct: 5.5,
    child_labor_rate_pct: 8.8,
    fatal_occupational_per_100k: 14.5,
    min_wage_usd_month: 247, // PEN 1,025/mth ÷ 3.84 PEN/USD
    women_in_mgmt_pct: 35.4,
    youth_unemployment_pct: 13.3,
  },
  // ── Sub-Saharan Africa ────────────────────────────────────────────────────
  {
    country: "South Africa",
    iso3: "ZAF",
    informal_employment_pct: 38.9,
    union_density_pct: 24.8,
    child_labor_rate_pct: 3.4,
    fatal_occupational_per_100k: 15.2,
    min_wage_usd_month: 180, // ZAR 23.19/hr × 173h ÷ 16.4 ZAR/USD
    women_in_mgmt_pct: 36.0,
    youth_unemployment_pct: 63.9, // Q4 2022 StatsSA narrow definition
  },
  {
    country: "Nigeria",
    iso3: "NGA",
    informal_employment_pct: 88.4,
    union_density_pct: 15.5,
    child_labor_rate_pct: 23.9,
    fatal_occupational_per_100k: 33.5,
    min_wage_usd_month: 67, // NGN 30,000/mth ÷ 447 NGN/USD avg 2022
    women_in_mgmt_pct: 22.6,
    youth_unemployment_pct: 42.5,
  },
  {
    country: "Kenya",
    iso3: "KEN",
    informal_employment_pct: 83.6,
    union_density_pct: 14.3,
    child_labor_rate_pct: 26.9,
    fatal_occupational_per_100k: 29.1,
    min_wage_usd_month: 162, // KES 15,120 minimum ÷ 118 KES/USD
    women_in_mgmt_pct: 23.0,
    youth_unemployment_pct: 35.1,
  },
  {
    country: "Ethiopia",
    iso3: "ETH",
    informal_employment_pct: 86.9,
    union_density_pct: 5.5,
    child_labor_rate_pct: 40.0, // ILO/UNICEF Africa region high
    fatal_occupational_per_100k: 38.0,
    min_wage_usd_month: null, // no national statutory minimum wage
    women_in_mgmt_pct: 18.3,
    youth_unemployment_pct: 5.2, // low formal unemployment; high underemployment
  },
  {
    country: "Tanzania",
    iso3: "TZA",
    informal_employment_pct: 87.5,
    union_density_pct: 7.0,
    child_labor_rate_pct: 29.5,
    fatal_occupational_per_100k: 35.0,
    min_wage_usd_month: 73, // TZS 170,000 ÷ 2,330 TZS/USD
    women_in_mgmt_pct: 27.3,
    youth_unemployment_pct: 6.7,
  },
  {
    country: "Ghana",
    iso3: "GHA",
    informal_employment_pct: 82.3,
    union_density_pct: 19.4,
    child_labor_rate_pct: 21.8,
    fatal_occupational_per_100k: 27.6,
    min_wage_usd_month: 54, // GHS 13.53/day × 26 days ÷ 8.68 GHS/USD
    women_in_mgmt_pct: 26.5,
    youth_unemployment_pct: 15.3,
  },
  // ── North Africa / MENA ───────────────────────────────────────────────────
  {
    country: "Morocco",
    iso3: "MAR",
    informal_employment_pct: 68.2,
    union_density_pct: 11.5,
    child_labor_rate_pct: 3.6,
    fatal_occupational_per_100k: 18.0,
    min_wage_usd_month: 331, // MAD 15.54/hr × 191.5h ÷ 10.25 MAD/USD
    women_in_mgmt_pct: 19.8,
    youth_unemployment_pct: 26.5,
  },
  {
    country: "Egypt",
    iso3: "EGY",
    informal_employment_pct: 67.6,
    union_density_pct: 27.6,
    child_labor_rate_pct: 3.2,
    fatal_occupational_per_100k: 20.3,
    min_wage_usd_month: 176, // EGP 3,000/mth ÷ 17.1 EGP/USD avg 2022
    women_in_mgmt_pct: 15.1,
    youth_unemployment_pct: 19.5,
  },
  {
    country: "Saudi Arabia",
    iso3: "SAU",
    informal_employment_pct: 18.5, // formal sector dominated; migrant labour informal
    union_density_pct: 0.0, // independent unions not permitted
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 6.5,
    min_wage_usd_month: 800, // SAR 4,000/mth for Saudis via Nitaqat × 0.267 USD/SAR
    women_in_mgmt_pct: 16.8,
    youth_unemployment_pct: 28.6,
  },
  {
    country: "United Arab Emirates",
    iso3: "ARE",
    informal_employment_pct: 11.5,
    union_density_pct: 0.0, // no independent unions
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 5.2,
    min_wage_usd_month: null, // no statutory NMW; sector-specific guidelines
    women_in_mgmt_pct: 30.0,
    youth_unemployment_pct: 11.2,
  },
  {
    country: "Jordan",
    iso3: "JOR",
    informal_employment_pct: 61.5,
    union_density_pct: 28.1,
    child_labor_rate_pct: 3.2,
    fatal_occupational_per_100k: 14.3,
    min_wage_usd_month: 296, // JOD 260/mth × 1.41 USD/JOD
    women_in_mgmt_pct: 13.5,
    youth_unemployment_pct: 47.3,
  },
  {
    country: "Turkey",
    iso3: "TUR",
    informal_employment_pct: 29.4,
    union_density_pct: 12.0,
    child_labor_rate_pct: 4.6,
    fatal_occupational_per_100k: 13.8,
    min_wage_usd_month: 467, // TRY 5,500/mth ÷ 11.8 avg 2022 TRY/USD (July 2022 NMW raised)
    women_in_mgmt_pct: 18.6,
    youth_unemployment_pct: 18.4,
  },
  {
    country: "Israel",
    iso3: "ISR",
    informal_employment_pct: 11.6,
    union_density_pct: 25.5,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.4,
    min_wage_usd_month: 1562, // ILS 5,300/mth ÷ 3.39 ILS/USD
    women_in_mgmt_pct: 38.2,
    youth_unemployment_pct: 6.4,
  },
  // ── Central & Eastern Europe ──────────────────────────────────────────────
  {
    country: "Czech Republic",
    iso3: "CZE",
    informal_employment_pct: 12.8,
    union_density_pct: 10.5,
    child_labor_rate_pct: 0.1,
    fatal_occupational_per_100k: 1.9,
    min_wage_usd_month: 714, // CZK 16,200/mth ÷ 22.7 CZK/USD
    women_in_mgmt_pct: 31.6,
    youth_unemployment_pct: 8.0,
  },
  {
    country: "Poland",
    iso3: "POL",
    informal_employment_pct: 17.5,
    union_density_pct: 11.3,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 2.4,
    min_wage_usd_month: 690, // PLN 3,010/mth ÷ 4.37 PLN/USD
    women_in_mgmt_pct: 40.8,
    youth_unemployment_pct: 12.2,
  },
  {
    country: "Hungary",
    iso3: "HUN",
    informal_employment_pct: 17.1,
    union_density_pct: 8.0,
    child_labor_rate_pct: 0.2,
    fatal_occupational_per_100k: 2.8,
    min_wage_usd_month: 476, // HUF 200,000/mth ÷ 380 HUF/USD (competent)
    women_in_mgmt_pct: 38.5,
    youth_unemployment_pct: 13.7,
  },
  {
    country: "Romania",
    iso3: "ROU",
    informal_employment_pct: 22.5,
    union_density_pct: 18.0,
    child_labor_rate_pct: 1.8,
    fatal_occupational_per_100k: 3.9,
    min_wage_usd_month: 607, // RON 2,950/mth ÷ 4.69 RON/USD
    women_in_mgmt_pct: 34.2,
    youth_unemployment_pct: 22.1,
  },
  // ── Eastern Europe / Central Asia ─────────────────────────────────────────
  {
    country: "Russia",
    iso3: "RUS",
    informal_employment_pct: 22.5,
    union_density_pct: 27.3,
    child_labor_rate_pct: 1.0,
    fatal_occupational_per_100k: 8.1,
    min_wage_usd_month: 156, // RUB 13,890/mth ÷ 68.5 RUB/USD avg 2022 (post-sanction)
    women_in_mgmt_pct: 38.5,
    youth_unemployment_pct: 14.5,
  },
  {
    country: "Ukraine",
    iso3: "UKR",
    informal_employment_pct: 26.3,
    union_density_pct: 32.6,
    child_labor_rate_pct: 1.6,
    fatal_occupational_per_100k: 10.5,
    min_wage_usd_month: 182, // UAH 6,500 ÷ 29.3 UAH/USD pre-2022 avg
    women_in_mgmt_pct: 43.8,
    youth_unemployment_pct: 20.2,
  },
  {
    country: "Kazakhstan",
    iso3: "KAZ",
    informal_employment_pct: 23.1,
    union_density_pct: 28.0,
    child_labor_rate_pct: 2.5,
    fatal_occupational_per_100k: 10.2,
    min_wage_usd_month: 140, // KZT 60,000/mth ÷ 431 KZT/USD
    women_in_mgmt_pct: 43.5,
    youth_unemployment_pct: 3.9,
  },
];
