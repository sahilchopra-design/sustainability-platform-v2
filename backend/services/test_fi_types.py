"""
All Financial Institution Types — PCAF Coverage
=================================================
Pension Fund (DB/DC), SWF, DFI/MDB, REIT, MFI, Hedge Fund, Insurance (as investor)
Each FI type holds a different asset mix reflective of their mandate
Uses /api/v1/pcaf-module/portfolio-summary endpoint (HoldingInput schema)
"""
import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

def calc_portfolio(name, holdings):
    payload = {"holdings": holdings, "portfolio_name": name, "reporting_year": 2024}
    r = requests.post("http://localhost:8002/api/v1/pcaf-module/portfolio-summary", json=payload, headers=H)
    return r.json()

# ── 1. PENSION FUND (Defined Benefit) ─────────────────────────────────────
# Large DB scheme — NPS India equivalent, 60% fixed income, 30% equity, 10% alternatives
pension_db = [
    # Listed Equity (30% of portfolio)
    {"asset_class":"listed_equity","entity_name":"Nifty50 Index Fund","entity_id":"NPS-EQ-01","sector_gics":"Diversified","country_iso":"IN","outstanding_amount_eur":1200000000,"enterprise_value_eur":8500000000,"scope1_co2e_tonnes":2800000,"scope2_co2e_tonnes":480000,"verification_status":"limited","data_quality":3},
    {"asset_class":"listed_equity","entity_name":"MSCI World Passive","entity_id":"NPS-EQ-02","sector_gics":"Diversified","country_iso":"US","outstanding_amount_eur":800000000,"enterprise_value_eur":12000000000,"scope1_co2e_tonnes":1800000,"scope2_co2e_tonnes":320000,"verification_status":"limited","data_quality":2},
    # Corporate Bonds (30%)
    {"asset_class":"business_loans","entity_name":"AAA-rated Indian Corp Bond Portfolio","entity_id":"NPS-BOND-01","sector_gics":"Financials","country_iso":"IN","outstanding_amount_eur":900000000,"annual_revenue_eur":28000000000,"total_equity_eur":12000000000,"total_debt_eur":8000000000,"scope1_co2e_tonnes":850000,"scope2_co2e_tonnes":180000,"verification_status":"none","data_quality":4},
    # Government Bonds (30%)
    {"asset_class":"sovereign_bonds","entity_name":"Govt of India Securities","entity_id":"NPS-GOVTSEC-01","sector_gics":"Government","country_iso":"IN","outstanding_amount_eur":900000000,"enterprise_value_eur":3500000000000,"scope1_co2e_tonnes":2900000000,"verification_status":"none","data_quality":3},
    # Infrastructure / Alternatives (10%)
    {"asset_class":"project_finance","entity_name":"InvIT Infrastructure Units","entity_id":"NPS-INVIT-01","sector_gics":"Utilities","country_iso":"IN","outstanding_amount_eur":300000000,"total_project_cost_eur":1800000000,"scope1_co2e_tonnes":85000,"scope2_co2e_tonnes":12000,"verification_status":"limited","data_quality":3,"infrastructure_type":"wind_onshore"},
]

# ── 2. SOVEREIGN WEALTH FUND ───────────────────────────────────────────────
# Abu Dhabi ADIA-equivalent: global equities, real assets, alternatives
swf = [
    {"asset_class":"listed_equity","entity_name":"Global Equity Diversified Pool","entity_id":"SWF-EQ-01","sector_gics":"Diversified","country_iso":"US","outstanding_amount_eur":5000000000,"enterprise_value_eur":45000000000,"scope1_co2e_tonnes":8500000,"scope2_co2e_tonnes":1200000,"verification_status":"limited","data_quality":2},
    {"asset_class":"listed_equity","entity_name":"EM Equity Pool — India China Brazil","entity_id":"SWF-EM-01","sector_gics":"Diversified","country_iso":"IN","outstanding_amount_eur":2000000000,"enterprise_value_eur":28000000000,"scope1_co2e_tonnes":9500000,"scope2_co2e_tonnes":1800000,"verification_status":"limited","data_quality":3},
    {"asset_class":"commercial_real_estate","entity_name":"Prime Office — London NYC Singapore","entity_id":"SWF-CRE-01","sector_gics":"Real Estate","country_iso":"GB","outstanding_amount_eur":3000000000,"enterprise_value_eur":6000000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":280000,"verification_status":"limited","data_quality":3},
    {"asset_class":"project_finance","entity_name":"Clean Energy Infrastructure — Global","entity_id":"SWF-PF-01","sector_gics":"Utilities","country_iso":"AE","outstanding_amount_eur":2500000000,"total_project_cost_eur":12000000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":180000,"verification_status":"verified","data_quality":1,"infrastructure_type":"solar_pv"},
    {"asset_class":"sovereign_bonds","entity_name":"US Treasuries","entity_id":"SWF-UST-01","sector_gics":"Government","country_iso":"US","outstanding_amount_eur":4000000000,"enterprise_value_eur":25000000000000,"scope1_co2e_tonnes":4700000000,"verification_status":"verified","data_quality":2},
]

# ── 3. DEVELOPMENT FINANCE INSTITUTION (DFI/MDB) ──────────────────────────
# IFC-equivalent: blended finance, project finance, SME loans in EM
dfi = [
    {"asset_class":"project_finance","entity_name":"Solar Microgrid — Bangladesh off-grid","entity_id":"DFI-PF-01","sector_gics":"Utilities","country_iso":"BD","outstanding_amount_eur":45000000,"total_project_cost_eur":120000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":2800,"verification_status":"verified","data_quality":1,"infrastructure_type":"solar_pv"},
    {"asset_class":"project_finance","entity_name":"Agri Cold Chain — Kenya","entity_id":"DFI-PF-02","sector_gics":"Consumer Staples","country_iso":"KE","outstanding_amount_eur":28000000,"total_project_cost_eur":65000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":4500,"verification_status":"limited","data_quality":2,"infrastructure_type":"other"},
    {"asset_class":"business_loans","entity_name":"MSME Climate Finance — India","entity_id":"DFI-SME-01","sector_gics":"Industrials","country_iso":"IN","outstanding_amount_eur":150000000,"annual_revenue_eur":1800000000,"total_equity_eur":600000000,"total_debt_eur":400000000,"scope1_co2e_tonnes":280000,"scope2_co2e_tonnes":45000,"verification_status":"none","data_quality":4},
    {"asset_class":"business_loans","entity_name":"Microfinance — South Asia","entity_id":"DFI-MFI-01","sector_gics":"Financials","country_iso":"BD","outstanding_amount_eur":80000000,"annual_revenue_eur":420000000,"total_equity_eur":180000000,"total_debt_eur":120000000,"scope1_co2e_tonnes":8500,"scope2_co2e_tonnes":2200,"verification_status":"none","data_quality":5},
    {"asset_class":"project_finance","entity_name":"Gender Finance — Women WASH — Nigeria","entity_id":"DFI-GENDER-01","sector_gics":"Utilities","country_iso":"NG","outstanding_amount_eur":35000000,"total_project_cost_eur":85000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":1800,"verification_status":"limited","data_quality":3,"infrastructure_type":"other"},
]

# ── 4. REAL ESTATE INVESTMENT TRUST (REIT / InvIT) ────────────────────────
# Embassy REIT equivalent — India commercial + residential
reit = [
    {"asset_class":"commercial_real_estate","entity_name":"Embassy Manyata Tech Park","entity_id":"REIT-CRE-01","sector_gics":"Real Estate","country_iso":"IN","outstanding_amount_eur":850000000,"enterprise_value_eur":1800000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":280000,"verification_status":"limited","data_quality":2},
    {"asset_class":"commercial_real_estate","entity_name":"Mindspace Business Parks","entity_id":"REIT-CRE-02","sector_gics":"Real Estate","country_iso":"IN","outstanding_amount_eur":480000000,"enterprise_value_eur":1200000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":180000,"verification_status":"limited","data_quality":2},
    {"asset_class":"mortgages","entity_name":"Residential DDA Housing Scheme","entity_id":"REIT-MORT-01","sector_gics":"Real Estate","country_iso":"IN","outstanding_amount_eur":120000000,"property_value_eur":280000000,"epc_rating":"C","floor_area_m2":85000,"verification_status":"none","data_quality":4},
    {"asset_class":"commercial_real_estate","entity_name":"Industrial Warehousing — L&T, Pune","entity_id":"REIT-IND-01","sector_gics":"Industrials","country_iso":"IN","outstanding_amount_eur":280000000,"enterprise_value_eur":580000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":45000,"verification_status":"none","data_quality":3},
]

# ── 5. MICROFINANCE INSTITUTION (MFI) ─────────────────────────────────────
# Bandhan, BRAC-type: unsecured micro-loans to low-income households
mfi = [
    {"asset_class":"business_loans","entity_name":"Women SHG Agriculture Loans — NE India","entity_id":"MFI-LOAN-01","sector_gics":"Consumer Staples","country_iso":"IN","outstanding_amount_eur":8000000,"annual_revenue_eur":45000000,"total_equity_eur":12000000,"total_debt_eur":8000000,"scope1_co2e_tonnes":12000,"scope2_co2e_tonnes":1800,"verification_status":"none","data_quality":5},
    {"asset_class":"business_loans","entity_name":"Artisan and Handicraft Loans — Rajasthan","entity_id":"MFI-LOAN-02","sector_gics":"Consumer Discretionary","country_iso":"IN","outstanding_amount_eur":4500000,"annual_revenue_eur":18000000,"total_equity_eur":6000000,"total_debt_eur":4000000,"scope1_co2e_tonnes":4200,"scope2_co2e_tonnes":800,"verification_status":"none","data_quality":5},
    {"asset_class":"business_loans","entity_name":"Solar Lamp / Cookstove Microloans","entity_id":"MFI-CLEAN-01","sector_gics":"Utilities","country_iso":"IN","outstanding_amount_eur":2800000,"annual_revenue_eur":8500000,"total_equity_eur":3000000,"total_debt_eur":2000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":120,"verification_status":"none","data_quality":5},
    {"asset_class":"vehicle_loans","entity_name":"E-Rickshaw Finance — UP and Bihar","entity_id":"MFI-VEH-01","sector_gics":"Consumer Discretionary","country_iso":"IN","outstanding_amount_eur":3200000,"vehicle_value_eur":1800,"fuel_type":"electric","annual_km":18000,"verification_status":"none","data_quality":4},
]

# ── 6. HEDGE FUND (Multi-Strategy) ────────────────────────────────────────
# Long/short equity, credit, commodities
hedge_fund = [
    {"asset_class":"listed_equity","entity_name":"Long: India Energy Transition Basket","entity_id":"HF-LONG-01","sector_gics":"Utilities","country_iso":"IN","outstanding_amount_eur":280000000,"enterprise_value_eur":2200000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":120000,"verification_status":"limited","data_quality":2,"sbti_committed":True},
    {"asset_class":"listed_equity","entity_name":"Short Cover: Coal/O&G Basket","entity_id":"HF-SHORT-01","sector_gics":"Energy","country_iso":"IN","outstanding_amount_eur":120000000,"enterprise_value_eur":8500000000,"scope1_co2e_tonnes":85000000,"scope2_co2e_tonnes":2800000,"verification_status":"limited","data_quality":2},
    {"asset_class":"business_loans","entity_name":"Distressed Credit — Real Estate","entity_id":"HF-DIST-01","sector_gics":"Real Estate","country_iso":"IN","outstanding_amount_eur":85000000,"annual_revenue_eur":580000000,"total_equity_eur":180000000,"total_debt_eur":320000000,"scope1_co2e_tonnes":0,"scope2_co2e_tonnes":28000,"verification_status":"none","data_quality":4},
]

# ── 7. INSURANCE COMPANY (as investor — General Account) ──────────────────
# LIC general account: predominantly bonds + mortgages + equity
insurer_investor = [
    {"asset_class":"sovereign_bonds","entity_name":"GoI G-Secs — LIC Portfolio","entity_id":"INS-GSEC-01","sector_gics":"Government","country_iso":"IN","outstanding_amount_eur":8500000000,"enterprise_value_eur":3500000000000,"scope1_co2e_tonnes":2900000000,"verification_status":"none","data_quality":3},
    {"asset_class":"listed_equity","entity_name":"Nifty 200 — LIC Equity","entity_id":"INS-EQ-01","sector_gics":"Diversified","country_iso":"IN","outstanding_amount_eur":2800000000,"enterprise_value_eur":18000000000,"scope1_co2e_tonnes":5200000,"scope2_co2e_tonnes":900000,"verification_status":"limited","data_quality":3},
    {"asset_class":"mortgages","entity_name":"LIC Housing Finance Loan Portfolio","entity_id":"INS-HFL-01","sector_gics":"Financials","country_iso":"IN","outstanding_amount_eur":3200000000,"property_value_eur":7500000000,"epc_rating":"D","floor_area_m2":48000000,"verification_status":"none","data_quality":4},
    {"asset_class":"business_loans","entity_name":"Infrastructure NCD Portfolio","entity_id":"INS-INFRA-01","sector_gics":"Industrials","country_iso":"IN","outstanding_amount_eur":1800000000,"annual_revenue_eur":45000000000,"total_equity_eur":18000000000,"total_debt_eur":12000000000,"scope1_co2e_tonnes":8500000,"scope2_co2e_tonnes":1200000,"verification_status":"limited","data_quality":3},
]

fi_types = [
    ("1. Pension Fund (NPS DB Scheme)", pension_db),
    ("2. Sovereign Wealth Fund (ADIA-type)", swf),
    ("3. Development Finance Institution", dfi),
    ("4. REIT / InvIT (Embassy Office Parks)", reit),
    ("5. Microfinance Institution (Bandhan-type)", mfi),
    ("6. Hedge Fund (Multi-Strategy)", hedge_fund),
    ("7. Insurance Co as Investor (LIC GA)", insurer_investor),
]

print("="*115)
print("  ALL FINANCIAL INSTITUTION TYPES — PCAF Financed Emissions Coverage")
print("  Pension Fund | SWF | DFI | REIT | MFI | Hedge Fund | Insurance Investor")
print("="*115)

master_results = []
for fi_name, holdings in fi_types:
    d = calc_portfolio(fi_name, holdings)
    ps = d  # flat response
    total = ps.get("total_financed_emissions_tco2e", 0)
    waci = ps.get("waci_scope12", 0) or 0
    dqs = ps.get("portfolio_dqs", 0)
    temp = ps.get("implied_temperature_c", 0)
    n_assets = len(holdings)
    master_results.append((fi_name, total, waci, dqs, temp, n_assets))
    print(f"\n  {fi_name}")
    print(f"    Holdings: {n_assets}  |  Total financed: {total:,.0f} tCO2e  |  WACI: {waci:,.1f}  |  DQS: {dqs:.2f}  |  Temp: {temp:.2f}°C")

print(f"\n{'='*115}")
print(f"  MASTER SUMMARY — All FI Types")
print(f"{'='*115}")
print(f"{'FI Type':<45} {'Financed tCO2e':>16} {'WACI':>10} {'DQS':>6} {'°C':>6} {'Assets':>8}")
print(f"  {'-'*93}")
grand_total = 0
for fi_name, total, waci, dqs, temp, n in master_results:
    grand_total += total
    print(f"  {fi_name:<43} {total:>16,.0f} {waci:>10,.1f} {dqs:>6.2f} {temp:>6.2f} {n:>8}")
print(f"  {'-'*93}")
print(f"  {'GRAND TOTAL':43} {grand_total:>16,.0f}")
