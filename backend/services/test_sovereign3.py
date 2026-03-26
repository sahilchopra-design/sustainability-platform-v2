import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

# PCAF Part A — Sovereign Bonds (12 countries: EM + DM)
# Correct schema from introspection: outstanding_eur, gdp_eur, government_expenditure_eur,
# scope1_tco2e, emissions_verified
# Response: top-level portfolio fields + per_asset[].financed_total_tco2e

payload = {"assets": [
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
]}

r = requests.post("http://localhost:8002/api/v1/pcaf/sovereign-bonds", json=payload, headers=H)
d = r.json()

per_asset = d.get("per_asset", [])

print("="*110)
print("  PCAF Part A -- SOVEREIGN BONDS  |  12 Countries (6 DM + 6 EM)  |  PCAF Table §4.2")
print("="*110)
print(f"{'Asset ID':<14} {'Country':<16} {'Outstanding':>13} {'Financed tCO2e':>15} {'WACI':>8} {'Uncert Low':>11} {'Uncert High':>12} DQS  Verified")
print("-"*110)

total_financed = 0
for a in per_asset:
    fc    = a.get("financed_total_tco2e", 0)
    low   = a.get("financed_total_low_tco2e", 0)
    high  = a.get("financed_total_high_tco2e", 0)
    waci  = a.get("emission_intensity", 0)
    dqs   = a.get("pcaf_data_quality_score", "?")
    ver   = "YES" if not a.get("pcaf_dqs_auto_derived") else "est."
    name  = a.get("name", "?")
    aid   = a.get("asset_id", "?")
    out   = 0
    # find outstanding from input
    for inp in payload["assets"]:
        if inp["asset_id"] == aid:
            out = inp["outstanding_eur"]
            break
    total_financed += fc
    print(f"  {aid:<12} {name:<16} {out:>13,.0f} {fc:>15,.0f} {waci:>8,.1f} {low:>11,.0f} {high:>12,.0f}  {dqs}   {ver}")

print("-"*110)
print(f"\n  PORTFOLIO SUMMARY  (12 Sovereign Bonds — PCAF Part A §4)")
print(f"  {'Total outstanding (EUR):':<34} {d.get('total_outstanding_eur', 0):>16,.0f}")
print(f"  {'Total financed tCO2e:':<34} {d.get('total_financed_tco2e', total_financed):>16,.0f}")
print(f"  {'  Uncertainty low:':<34} {d.get('total_financed_low_tco2e', 0):>16,.0f}")
print(f"  {'  Uncertainty high:':<34} {d.get('total_financed_high_tco2e', 0):>16,.0f}")
print(f"  {'WACI (tCO2e/M USD GDP PPP):':<34} {d.get('waci_scope12_tco2e_per_meur', 0):>16,.1f}")
print(f"  {'Portfolio DQS:':<34} {d.get('weighted_data_quality_score', 0):>16.2f}")
print(f"  {'Implied temperature:':<34} {d.get('implied_temperature_rise_c', 0):>16.2f}  degC")
print(f"  {'Carbon footprint (tCO2e/M EUR):':<34} {d.get('portfolio_carbon_footprint_tco2e_per_meur', 0):>16,.1f}")
print(f"  {'Data completeness:':<34} {d.get('data_completeness_pct', 0):>15.1f}%")

reg = d.get("regulatory_disclosure", {})
if reg:
    print(f"\n  REGULATORY DISCLOSURE (SFDR / TCFD)")
    for k, v in reg.items():
        print(f"    {k}: {v}")

# DM vs EM split
dm_iso = {"US","DE","JP","GB","FR","AU"}
dm_fc = sum(a.get("financed_total_tco2e",0) for a in per_asset if any(inp["country_iso"] in dm_iso and inp["asset_id"]==a["asset_id"] for inp in payload["assets"]))
em_fc = d.get("total_financed_tco2e", total_financed) - dm_fc
print(f"\n  DM sovereign financed tCO2e:  {dm_fc:>16,.0f}")
print(f"  EM sovereign financed tCO2e:  {em_fc:>16,.0f}")
print(f"  EM/DM ratio:                  {em_fc/dm_fc:.1f}x")
