import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

policies = [
    {"policy_id":"MTR-PRS-001","line_of_business":"motor_personal","policyholder_name":"Individual Policyholders Pool India","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":45000000.0,"net_earned_premium_eur":38000000.0,"vehicle_count":12500,"fuel_type":"petrol","annual_km_per_vehicle":14000.0,"pcaf_dqs_override":3},
    {"policy_id":"MTR-PRS-EV-002","line_of_business":"motor_personal","policyholder_name":"EV Adoption Pool Urban India","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":8000000.0,"net_earned_premium_eur":6800000.0,"vehicle_count":3200,"fuel_type":"electric","annual_km_per_vehicle":18000.0,"pcaf_dqs_override":3},
    {"policy_id":"MTR-COMM-003","line_of_business":"motor_commercial","policyholder_name":"Blue Dart Express Fleet Insurance","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":12000000.0,"net_earned_premium_eur":10500000.0,"vehicle_count":4800,"fuel_type":"diesel","annual_km_per_vehicle":80000.0,"scope1_tco2e":28000.0,"pcaf_dqs_override":2},
    {"policy_id":"PROP-RESI-004","line_of_business":"property_residential","policyholder_name":"Residential Mortgage Pool Mumbai","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":22000000.0,"net_earned_premium_eur":19500000.0,"insured_area_m2":480000.0,"epc_rating":"D","pcaf_dqs_override":3},
    {"policy_id":"PROP-COMM-005","line_of_business":"property_commercial","policyholder_name":"DLF Commercial Properties Portfolio","policyholder_sector":"Real Estate","country_iso":"IN","gross_written_premium_eur":18000000.0,"net_earned_premium_eur":15800000.0,"insured_area_m2":320000.0,"epc_rating":"C","insured_revenue_eur":2800000000.0,"nace_sector":"real_estate","scope1_tco2e":0,"scope2_tco2e":180000.0,"pcaf_dqs_override":2},
    {"policy_id":"MARINE-006","line_of_business":"commercial_marine","policyholder_name":"Shipping Corp of India Bulk Carriers","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":9500000.0,"net_earned_premium_eur":8200000.0,"vessel_type":"bulk_carrier","vessel_count":12,"scope1_tco2e":85000.0,"pcaf_dqs_override":2},
    {"policy_id":"AVIATION-007","line_of_business":"commercial_energy","policyholder_name":"IndiGo Airlines Fleet Insurance","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":35000000.0,"net_earned_premium_eur":31000000.0,"technology":"aviation_kerosene","insured_revenue_eur":4200000000.0,"nace_sector":"air_transport","scope1_tco2e":3200000.0,"scope2_tco2e":0,"pcaf_dqs_override":2},
    {"policy_id":"CROP-AGRI-008","line_of_business":"commercial_other","policyholder_name":"PMFBY Crop Insurance Pool","policyholder_sector":"Agriculture","country_iso":"IN","gross_written_premium_eur":280000000.0,"net_earned_premium_eur":245000000.0,"insured_revenue_eur":8500000000.0,"nace_sector":"agriculture_crop","scope1_tco2e":4200000.0,"scope2_tco2e":120000.0,"pcaf_dqs_override":4},
    {"policy_id":"HEALTH-009","line_of_business":"health","policyholder_name":"Group Health TCS Employees","policyholder_sector":"IT Services","country_iso":"IN","gross_written_premium_eur":28000000.0,"net_earned_premium_eur":24500000.0,"insured_revenue_eur":25000000000.0,"nace_sector":"information_technology","scope1_tco2e":120000.0,"scope2_tco2e":85000.0,"pcaf_dqs_override":3},
    {"policy_id":"DO-LIAB-010","line_of_business":"commercial_liability","policyholder_name":"NIFTY50 Directors Officers Pool","policyholder_sector":"Diversified","country_iso":"IN","gross_written_premium_eur":15000000.0,"net_earned_premium_eur":13200000.0,"insured_revenue_eur":180000000000.0,"nace_sector":"financial_services","scope1_tco2e":8500000.0,"scope2_tco2e":1200000.0,"pcaf_dqs_override":3},
    {"policy_id":"TRADE-CREDIT-011","line_of_business":"commercial_other","policyholder_name":"ECGC Export Credit Pool","policyholder_sector":"Export Finance","country_iso":"IN","gross_written_premium_eur":6500000.0,"net_earned_premium_eur":5800000.0,"insured_revenue_eur":12000000000.0,"nace_sector":"trade_finance","scope1_tco2e":2800000.0,"scope2_tco2e":350000.0,"pcaf_dqs_override":4},
    {"policy_id":"REINS-012","line_of_business":"commercial_other","policyholder_name":"GIC Re Treaty Reinsurance","policyholder_sector":"Insurance","country_iso":"IN","gross_written_premium_eur":85000000.0,"net_earned_premium_eur":74000000.0,"insured_revenue_eur":2200000000.0,"nace_sector":"insurance_reinsurance","scope1_tco2e":15000000.0,"scope2_tco2e":2800000.0,"pcaf_dqs_override":4},
    {"policy_id":"ENERGY-013","line_of_business":"commercial_energy","policyholder_name":"Adani Green Solar CAR Policy","policyholder_sector":"Utilities","country_iso":"IN","gross_written_premium_eur":4200000.0,"net_earned_premium_eur":3700000.0,"capacity_mw":2800.0,"technology":"solar_pv","capacity_factor":0.23,"scope1_tco2e":0,"scope2_tco2e":45000.0,"pcaf_dqs_override":2},
    {"policy_id":"LIFE-014","line_of_business":"life","policyholder_name":"LIC Term Life Mass Market","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":120000000.0,"net_earned_premium_eur":108000000.0,"pcaf_dqs_override":5},
]

r = requests.post("http://localhost:8002/api/v1/pcaf-module/insurance", json={"policies": policies}, headers=H)
d = r.json()

print("="*105)
print("  PCAF PART B -- INSURANCE-ASSOCIATED EMISSIONS  |  14 Policies  |  All LOBs")
print("="*105)

# Response is a single summary dict with by_lob breakdown + policy_results
total_ins = d.get("total_insured_tco2e", 0)
total_gwp = d.get("total_gwp_eur", 0)
dqs = d.get("weighted_dqs", 0)
intensity = d.get("intensity_tco2e_per_m_premium", 0)
s1 = d.get("scope1_total", 0)
s2 = d.get("scope2_total", 0)
n = d.get("total_policies", 0)

print(f"\n  {'Metric':<40} {'Value':>20}")
print(f"  {'-'*62}")
print(f"  {'Total policies:':<40} {n:>20}")
print(f"  {'Total GWP (EUR):':<40} {total_gwp:>20,.0f}")
print(f"  {'Total insurance-associated tCO2e:':<40} {total_ins:>20,.0f}")
print(f"  {'  of which Scope 1:':<40} {s1:>20,.0f}")
print(f"  {'  of which Scope 2:':<40} {s2:>20,.0f}")
print(f"  {'Weighted DQS:':<40} {dqs:>20.2f}")
print(f"  {'Intensity (tCO2e/M EUR GWP):':<40} {intensity:>20,.1f}")

by_lob = d.get("by_lob", {})
if by_lob:
    print(f"\n  {'Line of Business':<28} {'Policies':>10} {'GWP EUR':>16} {'tCO2e':>14}")
    print(f"  {'-'*72}")
    for lob, v in sorted(by_lob.items(), key=lambda x: -x[1].get("tco2e",0)):
        print(f"  {lob:<28} {v.get('count',0):>10} {v.get('gwp_eur',0):>16,.0f} {v.get('tco2e',0):>14,.0f}")

# Per-policy breakdown
pr = d.get("policy_results", [])
if pr:
    print(f"\n  {'Policy ID':<20} {'Policyholder':<35} {'LOB':<22} {'tCO2e':>12} DQS")
    print(f"  {'-'*98}")
    for p in pr:
        print(f"  {p.get('policy_id','?'):<20} {p.get('policyholder_name','?')[:33]:<35} {p.get('line_of_business','?'):<22} {p.get('tco2e',0):>12,.0f}  {p.get('pcaf_dqs','?')}")
