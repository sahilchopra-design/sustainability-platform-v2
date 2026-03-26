import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

# PCAF Part B — Insurance Associated Emissions
# All 10 lines of business + reinsurance
# Schema: InsurancePolicySchema fields

policies = [
    # 1. Motor Personal (individual vehicle insurance)
    {"policy_id":"MTR-PRS-001","line_of_business":"motor_personal","policyholder_name":"Individual Policyholders Pool — India","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":45000000.0,"net_earned_premium_eur":38000000.0,"vehicle_count":12500,"fuel_type":"petrol","annual_km_per_vehicle":14000.0,"pcaf_dqs_override":3},
    # 2. Motor Personal — EV fleet
    {"policy_id":"MTR-PRS-EV-002","line_of_business":"motor_personal","policyholder_name":"EV Adoption Pool — Urban India","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":8000000.0,"net_earned_premium_eur":6800000.0,"vehicle_count":3200,"fuel_type":"electric","annual_km_per_vehicle":18000.0,"pcaf_dqs_override":3},
    # 3. Motor Commercial (fleet insurance)
    {"policy_id":"MTR-COMM-003","line_of_business":"motor_commercial","policyholder_name":"Blue Dart Express Fleet Insurance","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":12000000.0,"net_earned_premium_eur":10500000.0,"vehicle_count":4800,"fuel_type":"diesel","annual_km_per_vehicle":80000.0,"scope1_tco2e":28000.0,"pcaf_dqs_override":2},
    # 4. Property Residential
    {"policy_id":"PROP-RESI-004","line_of_business":"property_residential","policyholder_name":"Residential Mortgage Pool — Mumbai","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":22000000.0,"net_earned_premium_eur":19500000.0,"insured_area_m2":480000.0,"epc_rating":"D","pcaf_dqs_override":3},
    # 5. Property Commercial (office/industrial)
    {"policy_id":"PROP-COMM-005","line_of_business":"property_commercial","policyholder_name":"DLF Commercial Properties Portfolio","policyholder_sector":"Real Estate","country_iso":"IN","gross_written_premium_eur":18000000.0,"net_earned_premium_eur":15800000.0,"insured_area_m2":320000.0,"epc_rating":"C","insured_revenue_eur":2800000000.0,"nace_sector":"real_estate","scope1_tco2e":0,"scope2_tco2e":180000.0,"pcaf_dqs_override":2},
    # 6. Marine (shipping / cargo)
    {"policy_id":"MARINE-006","line_of_business":"commercial_marine","policyholder_name":"Shipping Corp of India — Bulk Carrier Fleet","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":9500000.0,"net_earned_premium_eur":8200000.0,"vessel_type":"bulk_carrier","vessel_count":12,"scope1_tco2e":85000.0,"pcaf_dqs_override":2},
    # 7. Aviation (aircraft hull + liability)
    {"policy_id":"AVIATION-007","line_of_business":"commercial_energy","policyholder_name":"IndiGo Airlines Fleet Insurance","policyholder_sector":"Transportation","country_iso":"IN","gross_written_premium_eur":35000000.0,"net_earned_premium_eur":31000000.0,"capacity_mw":0,"technology":"aviation_kerosene","insured_revenue_eur":4200000000.0,"nace_sector":"air_transport","scope1_tco2e":3200000.0,"scope2_tco2e":0,"pcaf_dqs_override":2},
    # 8. Crop / Agricultural
    {"policy_id":"CROP-AGRI-008","line_of_business":"commercial_other","policyholder_name":"Pradhan Mantri Fasal Bima Yojana Pool","policyholder_sector":"Agriculture","country_iso":"IN","gross_written_premium_eur":280000000.0,"net_earned_premium_eur":245000000.0,"insured_revenue_eur":8500000000.0,"nace_sector":"agriculture_crop","scope1_tco2e":4200000.0,"scope2_tco2e":120000.0,"pcaf_dqs_override":4},
    # 9. Health / Life (individual + group)
    {"policy_id":"HEALTH-LIFE-009","line_of_business":"health","policyholder_name":"Group Health — Tata Consultancy Services","policyholder_sector":"IT Services","country_iso":"IN","gross_written_premium_eur":28000000.0,"net_earned_premium_eur":24500000.0,"insured_revenue_eur":25000000000.0,"nace_sector":"information_technology","scope1_tco2e":120000.0,"scope2_tco2e":85000.0,"pcaf_dqs_override":3},
    # 10. D&O / Professional Liability
    {"policy_id":"DO-LIAB-010","line_of_business":"commercial_liability","policyholder_name":"NIFTY 50 Directors & Officers Pool","policyholder_sector":"Diversified","country_iso":"IN","gross_written_premium_eur":15000000.0,"net_earned_premium_eur":13200000.0,"insured_revenue_eur":180000000000.0,"nace_sector":"financial_services","scope1_tco2e":8500000.0,"scope2_tco2e":1200000.0,"pcaf_dqs_override":3},
    # 11. Trade Credit Insurance
    {"policy_id":"TRADE-CREDIT-011","line_of_business":"commercial_other","policyholder_name":"Exporters Credit Pool — ECGC India","policyholder_sector":"Export Finance","country_iso":"IN","gross_written_premium_eur":6500000.0,"net_earned_premium_eur":5800000.0,"insured_revenue_eur":12000000000.0,"nace_sector":"trade_finance","scope1_tco2e":2800000.0,"scope2_tco2e":350000.0,"pcaf_dqs_override":4},
    # 12. Reinsurance (treaty — assumed from cedants)
    {"policy_id":"REINS-012","line_of_business":"commercial_other","policyholder_name":"General Insurance Corporation — Treaty Reinsurance","policyholder_sector":"Insurance","country_iso":"IN","gross_written_premium_eur":85000000.0,"net_earned_premium_eur":74000000.0,"insured_revenue_eur":2200000000.0,"nace_sector":"insurance_reinsurance","scope1_tco2e":15000000.0,"scope2_tco2e":2800000.0,"pcaf_dqs_override":4},
    # 13. Energy / Power Plant (CAR, erection all risk)
    {"policy_id":"ENERGY-013","line_of_business":"commercial_energy","policyholder_name":"Adani Green Energy — Solar/Wind CAR Policy","policyholder_sector":"Utilities","country_iso":"IN","gross_written_premium_eur":4200000.0,"net_earned_premium_eur":3700000.0,"capacity_mw":2800.0,"technology":"solar_pv","capacity_factor":0.23,"scope1_tco2e":0,"scope2_tco2e":45000.0,"pcaf_dqs_override":2},
    # 14. Life Insurance (individual)
    {"policy_id":"LIFE-014","line_of_business":"life","policyholder_name":"LIC Term Life Pool — Mass Market","policyholder_sector":"Households","country_iso":"IN","gross_written_premium_eur":120000000.0,"net_earned_premium_eur":108000000.0,"pcaf_dqs_override":5},
]

r = requests.post("http://localhost:8002/api/v1/pcaf-module/insurance", json={"policies": policies}, headers=H)
d = r.json()

if isinstance(d, dict) and "policies" in d:
    policies_r = d["policies"]
    summary = d.get("portfolio_summary", {})
elif isinstance(d, list):
    policies_r = d
    summary = {}
else:
    # Try asdict output
    policies_r = d.get("policies", [d]) if isinstance(d, dict) else [d]
    summary = d.get("portfolio_summary", {})

print("="*100)
print("  PCAF PART B -- INSURANCE-ASSOCIATED EMISSIONS  |  14 Policies  |  All 10+ Lines of Business")
print("="*100)
print(f"{'Policy ID':<20} {'Policyholder':<38} {'LOB':<22} {'Ins. tCO2e':>12} DQS")
print("-"*100)
total_ins = 0
for p in policies_r:
    ins = p.get("insurance_associated_tco2e") or p.get("associated_tco2e") or p.get("financed_tco2e") or 0
    total_ins += ins
    lob = p.get("line_of_business","?")
    pid = p.get("policy_id","?")
    pname = p.get("policyholder_name","?")[:36]
    dqs = p.get("pcaf_dqs") or p.get("dqs","?")
    print(f"  {pid:<18} {pname:<38} {lob:<22} {ins:>12,.0f}  {dqs}")

print("-"*100)
print(f"\n  PORTFOLIO SUMMARY (Part B Insurance-Associated Emissions)")
print(f"  {'Total insurance-associated:':<32} {total_ins:>16,.0f}  tCO2e")
if summary:
    print(f"  {'Portfolio DQS:':<32} {summary.get('portfolio_dqs', '—'):>16}")
    print(f"  {'WACI:':<32} {summary.get('waci_scope12', 0):>16,.1f}  tCO2e/M EUR GWP")

# Show raw for first policy to understand structure
print("\n--- First policy result keys:", list(policies_r[0].keys()) if policies_r else "none")
print("--- First policy sample:", {k:v for k,v in list(policies_r[0].items())[:8]} if policies_r else "none")
