import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

deals = [
    # Bond Underwriting: Green Bond (Tata Power)
    {"deal_id":"GB-TATAPOWER-001","deal_type":"bond_underwriting","issuer_name":"Tata Power Renewable","issuer_sector_gics":"Utilities","issuer_country_iso2":"IN","issuer_revenue_musd":3456.0,"underwritten_amount_musd":42.5,"total_deal_size_musd":500.0,"emissions_scope1":0,"emissions_scope2":180000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"solar_wind","eu_taxonomy_aligned_pct":100.0,"pcaf_dqs_override":2,"emissions_data_source":"self_reported","emissions_verified":"limited_assurance"},
    # Bond Underwriting: Conventional O&G
    {"deal_id":"CORP-RELIANCE-001","deal_type":"bond_underwriting","issuer_name":"Reliance Industries","issuer_sector_gics":"Energy","issuer_country_iso2":"IN","issuer_revenue_musd":95040.0,"underwritten_amount_musd":240.0,"total_deal_size_musd":2000.0,"emissions_scope1":25600000,"emissions_scope2":890000,"emissions_scope3":180000000,"emissions_include_scope3":True,"green_bond":False,"bond_type":"corporate","pcaf_dqs_override":2,"emissions_data_source":"self_reported","emissions_verified":"limited_assurance"},
    # Bond Underwriting: Sukuk
    {"deal_id":"SUKUK-DIB-001","deal_type":"bond_underwriting","issuer_name":"Dubai Islamic Bank","issuer_sector_gics":"Financials","issuer_country_iso2":"AE","issuer_revenue_musd":4860.0,"underwritten_amount_musd":45.0,"total_deal_size_musd":750.0,"emissions_scope1":12000,"emissions_scope2":45000,"emissions_scope3":0,"green_bond":False,"bond_type":"sukuk","pcaf_dqs_override":3,"emissions_data_source":"sector_average"},
    # Bond Underwriting: SLB
    {"deal_id":"SLB-ADANI-001","deal_type":"bond_underwriting","issuer_name":"Adani Ports and SEZ","issuer_sector_gics":"Industrials","issuer_country_iso2":"IN","issuer_revenue_musd":3888.0,"underwritten_amount_musd":40.0,"total_deal_size_musd":400.0,"emissions_scope1":890000,"emissions_scope2":120000,"emissions_scope3":2400000,"emissions_include_scope3":True,"green_bond":True,"bond_type":"sustainability_linked","pcaf_dqs_override":3,"emissions_data_source":"self_reported"},
    # Bond Underwriting: Project Finance Green Bond
    {"deal_id":"NTPC-PF-BOND-001","deal_type":"bond_underwriting","issuer_name":"NTPC Renewables SPV","issuer_sector_gics":"Utilities","issuer_country_iso2":"IN","issuer_revenue_musd":15120.0,"underwritten_amount_musd":72.0,"total_deal_size_musd":800.0,"emissions_scope1":220000,"emissions_scope2":28000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"solar_wind_rajasthan","eu_taxonomy_aligned_pct":95.0,"pcaf_dqs_override":2,"emissions_data_source":"self_reported","emissions_verified":"limited_assurance"},
    # Bond Underwriting: Social Bond
    {"deal_id":"SOCIAL-BANDHAN-001","deal_type":"bond_underwriting","issuer_name":"Bandhan Bank Social Bond","issuer_sector_gics":"Financials","issuer_country_iso2":"IN","issuer_revenue_musd":1620.0,"underwritten_amount_musd":50.0,"total_deal_size_musd":200.0,"emissions_scope1":2800,"emissions_scope2":12000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"microfinance_women","bond_type":"social","pcaf_dqs_override":3,"emissions_data_source":"sector_average"},
    # Equity Underwriting: Clean Energy IPO
    {"deal_id":"IPO-RENEW-001","deal_type":"ipo_underwriting","issuer_name":"ReNew Energy Global","issuer_sector_gics":"Utilities","issuer_country_iso2":"IN","issuer_revenue_musd":918.0,"shares_placed_value_musd":180.0,"market_cap_musd":4500.0,"total_deal_size_musd":1200.0,"emissions_scope1":0,"emissions_scope2":95000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"renewable_energy","eu_taxonomy_aligned_pct":100.0,"pcaf_dqs_override":2,"emissions_data_source":"self_reported"},
    # Equity Underwriting: Fossil fuel block deal
    {"deal_id":"IPO-COALINDIA-001","deal_type":"ipo_underwriting","issuer_name":"Coal India Ltd","issuer_sector_gics":"Energy","issuer_country_iso2":"IN","issuer_revenue_musd":19440.0,"shares_placed_value_musd":67.5,"market_cap_musd":22000.0,"total_deal_size_musd":900.0,"emissions_scope1":68000000,"emissions_scope2":1200000,"emissions_scope3":420000000,"emissions_include_scope3":True,"green_bond":False,"pcaf_dqs_override":2,"emissions_data_source":"self_reported","emissions_verified":"limited_assurance"},
    # Loan Syndication: O&G
    {"deal_id":"SYND-ONGC-001","deal_type":"syndicated_loan","issuer_name":"ONGC","issuer_sector_gics":"Energy","issuer_country_iso2":"IN","issuer_revenue_musd":30240.0,"arranged_amount_musd":112.0,"total_facility_musd":1400.0,"total_deal_size_musd":1400.0,"emissions_scope1":18500000,"emissions_scope2":650000,"emissions_scope3":95000000,"emissions_include_scope3":True,"green_bond":False,"pcaf_dqs_override":2,"emissions_data_source":"self_reported"},
    # Loan Syndication: Green Infrastructure
    {"deal_id":"SYND-GREEN-INFRA-001","deal_type":"syndicated_loan","issuer_name":"India Green Infra Finance","issuer_sector_gics":"Utilities","issuer_country_iso2":"IN","issuer_revenue_musd":540.0,"arranged_amount_musd":90.0,"total_facility_musd":600.0,"total_deal_size_musd":600.0,"emissions_scope1":0,"emissions_scope2":45000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"wind_solar_storage","eu_taxonomy_aligned_pct":100.0,"pcaf_dqs_override":3,"emissions_data_source":"sector_average"},
    # Securitisation: ABS (Vehicle)
    {"deal_id":"ABS-MAHINDRA-001","deal_type":"securitisation","issuer_name":"Mahindra Finance ABS 2024-A","issuer_sector_gics":"Consumer Discretionary","issuer_country_iso2":"IN","issuer_revenue_musd":1296.0,"tranche_held_musd":60.0,"total_pool_musd":300.0,"total_deal_size_musd":300.0,"emissions_scope1":0,"emissions_scope2":8000,"emissions_scope3":580000,"emissions_include_scope3":True,"green_bond":False,"bond_type":"ABS","pcaf_dqs_override":4,"emissions_data_source":"sector_average"},
    # Securitisation: CLO (Corporate loans)
    {"deal_id":"CLO-ICICI-001","deal_type":"securitisation","issuer_name":"India Mid-Cap CLO 2024","issuer_sector_gics":"Financials","issuer_country_iso2":"IN","issuer_revenue_musd":864.0,"tranche_held_musd":67.5,"total_pool_musd":450.0,"total_deal_size_musd":450.0,"emissions_scope1":0,"emissions_scope2":18000,"emissions_scope3":0,"green_bond":True,"use_of_proceeds":"esg_screened_loans","bond_type":"CLO","pcaf_dqs_override":4,"emissions_data_source":"sector_average"},
    # Securitisation: CMBS (Real Estate)
    {"deal_id":"CMBS-EMBASSY-001","deal_type":"securitisation","issuer_name":"Embassy Office Parks REIT CMBS","issuer_sector_gics":"Real Estate","issuer_country_iso2":"IN","issuer_revenue_musd":1944.0,"tranche_held_musd":72.0,"total_pool_musd":600.0,"total_deal_size_musd":600.0,"emissions_scope1":0,"emissions_scope2":380000,"emissions_scope3":120000,"green_bond":True,"use_of_proceeds":"igbc_platinum_offices","bond_type":"CMBS","pcaf_dqs_override":3,"emissions_data_source":"self_reported"},
]

r = requests.post("http://localhost:8002/api/v1/pcaf-module/facilitated", json={"deals": deals}, headers=H)
d = r.json()

dr = d.get("deal_results", [])
ps = d.get("portfolio_summary", {})

print("="*100)
print("  PCAF PART C -- FACILITATED EMISSIONS  |  13 Deals  |  Bond/Equity/Loan/Securitisation")
print("="*100)
print(f"{'Deal ID':<24} {'Issuer':<32} {'Type':<18} {'Fac. tCO2e':>15} {'AF%':>6} DQS  Green")
print("-"*100)
total_fac = 0
for r2 in dr:
    fac = r2.get("facilitated_total_tco2e") or 0
    total_fac += fac
    af = r2.get("attribution_factor") or 0
    green = "YES" if r2.get("green_classification","").startswith("green") or r2.get("green_bond") else "—"
    warn = r2.get("warnings","")
    print(f"  {r2.get('deal_id','?'):<22} {r2.get('issuer_name','?')[:30]:<32} {r2.get('deal_type','?'):<18} {fac:>15,.0f} {af*100:>5.1f}%  {r2.get('pcaf_dqs','?')}   {green}")
    if warn and warn != "None":
        print(f"    WARN: {warn[:80]}")

print("-"*100)
print(f"\n  PORTFOLIO SUMMARY")
print(f"  {'Total facilitated emissions:':<30} {ps.get('total_financed_emissions_tco2e', total_fac):>18,.0f}  tCO2e")
print(f"  {'WACI (Scope 1+2):':<30} {ps.get('waci_scope12', 0):>18,.1f}  tCO2e/M EUR rev")
print(f"  {'Portfolio DQS:':<30} {ps.get('portfolio_dqs', 0):>18.2f}")
print(f"  {'Implied temperature:':<30} {ps.get('implied_temperature_c', 0):>18.2f}  degC")
print(f"  {'Carbon footprint:':<30} {ps.get('carbon_footprint_tco2e_per_m_eur', 0):>18,.1f}  tCO2e/M EUR AuM")
top10 = ps.get("top_10_emitters", [])
if top10:
    print(f"\n  Top emitters: {top10[:5]}")
print()
# Green vs conventional split
green_fac = sum((r2.get("facilitated_total_tco2e") or 0) for r2 in dr if r2.get("green_classification","").startswith("green"))
print(f"  Green/labelled instruments:    {green_fac:>18,.0f}  tCO2e")
print(f"  Conventional instruments:      {total_fac - green_fac:>18,.0f}  tCO2e")
