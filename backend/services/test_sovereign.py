import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

# PCAF Part A — Sovereign Bonds (12 countries: EM + DM mix)
# Uses /api/v1/pcaf/sovereign-bonds endpoint
# Schema from previous tests: assets list with sovereign bond fields

sovereign_payload = {
    "assets": [
        # DM Sovereigns
        {"asset_id":"UST-001","country_iso":"US","country_name":"United States","outstanding_eur":500000000,"gdp_eur":25000000000000,"government_expenditure_eur":6500000000000,"scope1_tco2e":4700000000,"emissions_verified":True},
        {"asset_id":"BUND-001","country_iso":"DE","country_name":"Germany","outstanding_eur":350000000,"gdp_eur":4000000000000,"government_expenditure_eur":1800000000000,"scope1_tco2e":640000000,"emissions_verified":True},
        {"asset_id":"JGB-001","country_iso":"JP","country_name":"Japan","outstanding_eur":280000000,"gdp_eur":4200000000000,"government_expenditure_eur":1600000000000,"scope1_tco2e":1050000000,"emissions_verified":True},
        {"asset_id":"UKG-001","country_iso":"GB","country_name":"United Kingdom","outstanding_eur":200000000,"gdp_eur":2800000000000,"government_expenditure_eur":1100000000000,"scope1_tco2e":320000000,"emissions_verified":True},
        {"asset_id":"OAT-001","country_iso":"FR","country_name":"France","outstanding_eur":180000000,"gdp_eur":2800000000000,"government_expenditure_eur":1400000000000,"scope1_tco2e":290000000,"emissions_verified":True},
        {"asset_id":"AUS-001","country_iso":"AU","country_name":"Australia","outstanding_eur":120000000,"gdp_eur":1600000000000,"government_expenditure_eur":700000000000,"scope1_tco2e":395000000,"emissions_verified":True},
        # EM Sovereigns
        {"asset_id":"INDGOV-001","country_iso":"IN","country_name":"India","outstanding_eur":450000000,"gdp_eur":3500000000000,"government_expenditure_eur":1200000000000,"scope1_tco2e":2900000000,"emissions_verified":False},
        {"asset_id":"CNBOND-001","country_iso":"CN","country_name":"China","outstanding_eur":380000000,"gdp_eur":17000000000000,"government_expenditure_eur":5800000000000,"scope1_tco2e":12700000000,"emissions_verified":True},
        {"asset_id":"BRZGOV-001","country_iso":"BR","country_name":"Brazil","outstanding_eur":150000000,"gdp_eur":2100000000000,"government_expenditure_eur":800000000000,"scope1_tco2e":1050000000,"emissions_verified":False},
        {"asset_id":"IDNGOV-001","country_iso":"ID","country_name":"Indonesia","outstanding_eur":95000000,"gdp_eur":1300000000000,"government_expenditure_eur":480000000000,"scope1_tco2e":850000000,"emissions_verified":False},
        {"asset_id":"SAGOV-001","country_iso":"SA","country_name":"Saudi Arabia","outstanding_eur":180000000,"gdp_eur":1100000000000,"government_expenditure_eur":550000000000,"scope1_tco2e":820000000,"emissions_verified":True},
        {"asset_id":"ZAGOV-001","country_iso":"ZA","country_name":"South Africa","outstanding_eur":85000000,"gdp_eur":380000000000,"government_expenditure_eur":200000000000,"scope1_tco2e":420000000,"emissions_verified":False},
    ]
}

r = requests.post("http://localhost:8002/api/v1/pcaf/sovereign-bonds", json=sovereign_payload, headers=H)
d = r.json()

print("="*105)
print("  PCAF Part A — SOVEREIGN BONDS  |  12 Countries  |  EM + DM Mix")
print("="*105)
print(f"{'Asset ID':<14} {'Country':<15} {'Outstanding EUR':>15} {'Financed tCO2e':>15} {'WACI':>12} {'DQS':>5} {'Verified':>10}")
print("-"*105)

per_asset = d.get("per_asset", d.get("assets", []))
ps = d.get("portfolio_summary", d.get("summary", {}))
total_fc = 0

for a in per_asset:
    fc = a.get("financed_co2e_tco2e") or a.get("financed_tco2e") or a.get("financed_emissions_tco2e") or 0
    total_fc += fc
    waci = a.get("waci_scope12") or a.get("waci") or a.get("emission_intensity") or 0
    dqs = a.get("dqs") or a.get("pcaf_dqs") or a.get("data_quality_score") or "?"
    ver = "YES" if a.get("emissions_verified") else "—"
    cname = a.get("country_name") or a.get("country_iso","?")
    aid = a.get("asset_id","?")
    outstanding = a.get("outstanding_eur") or 0
    print(f"  {aid:<12} {cname:<15} {outstanding:>15,.0f} {fc:>15,.0f} {waci:>12,.1f} {str(dqs):>5} {ver:>10}")

print("-"*105)
print(f"\n  PORTFOLIO SUMMARY")
print(f"  Total financed tCO2e:    {ps.get('total_financed_tco2e', total_fc):>16,.0f}")
print(f"  Portfolio WACI:          {ps.get('waci_scope12', 0):>16,.1f}  tCO2e/M EUR GDP")
print(f"  Portfolio DQS:           {ps.get('weighted_data_quality_score', 0):>16.2f}")
print(f"  Implied temperature:     {ps.get('implied_temperature_rise_c', 0):>16.2f}  degC")
print(f"  Carbon footprint:        {ps.get('portfolio_carbon_footprint_tco2e_per_meur', 0):>16,.1f}  tCO2e/M EUR")
print()
# Regulatory
reg = ps.get("regulatory_disclosure", {})
if reg:
    for k,v in reg.items():
        print(f"  {k}: {v}")
