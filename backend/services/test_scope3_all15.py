"""
GHG Protocol — All 15 Scope 3 Categories
3 companies, each with a full 15-category Scope 3 breakdown
Uses /api/v1/supply-chain/scope3/calculate endpoint
"""
import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

def scope3(entity_id, entity_name, year, activities):
    payload = {
        "entity_id": entity_id,
        "reporting_year": year,
        "activities_by_category": activities
    }
    r = requests.post("http://localhost:8002/api/v1/supply-chain/scope3/calculate", json=payload, headers=H)
    return r.json()

# ===========================================================================
# COMPANY 1: Mahindra & Mahindra (Auto OEM) — all 15 upstream + downstream
# ===========================================================================
mm_activities = {
    # UPSTREAM
    "1_purchased_goods": [
        {"description":"Steel coil and sheet — Tata Steel","quantity":280000,"unit":"tonne","emission_factor_kgco2e_per_unit":1.85,"supplier_country_iso":"IN","spend_gbp":480000000},
        {"description":"Aluminium extrusions and castings","quantity":42000,"unit":"tonne","emission_factor_kgco2e_per_unit":7.2,"supplier_country_iso":"CN","spend_gbp":180000000},
        {"description":"Plastic components and polymers","quantity":35000,"unit":"tonne","emission_factor_kgco2e_per_unit":2.8,"supplier_country_iso":"IN","spend_gbp":95000000},
        {"description":"Tyres — MRF and CEAT","quantity":2800000,"unit":"unit","emission_factor_kgco2e_per_unit":7.8,"supplier_country_iso":"IN","spend_gbp":140000000},
        {"description":"Electronic control units and wiring","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00042,"supplier_country_iso":"DE","spend_gbp":280000000},
    ],
    "2_capital_goods": [
        {"description":"CNC machining centres — Pune plant expansion","quantity":48,"unit":"unit","emission_factor_kgco2e_per_unit":85000,"supplier_country_iso":"JP","spend_gbp":24000000},
        {"description":"Robotic welding lines","quantity":32,"unit":"unit","emission_factor_kgco2e_per_unit":42000,"supplier_country_iso":"DE","spend_gbp":38000000},
    ],
    "3_fuel_energy": [
        {"description":"Natural gas — manufacturing utilities","quantity":12000000,"unit":"m3","emission_factor_kgco2e_per_unit":2.02,"supplier_country_iso":"IN","spend_gbp":8000000},
        {"description":"HFO — captive power generation","quantity":8500,"unit":"tonne","emission_factor_kgco2e_per_unit":3200,"supplier_country_iso":"IN","spend_gbp":5000000},
    ],
    "4_upstream_transport": [
        {"description":"Inbound steel and raw materials — road freight","quantity":15000000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.092,"supplier_country_iso":"IN","spend_gbp":22000000},
        {"description":"International component air freight — ECUs","quantity":480000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.602,"supplier_country_iso":"IN","spend_gbp":12000000},
    ],
    "5_waste": [
        {"description":"Stamping scrap — steel landfill/recycler","quantity":12000,"unit":"tonne","emission_factor_kgco2e_per_unit":0.71,"supplier_country_iso":"IN","spend_gbp":2000000},
        {"description":"Hazardous waste — paint solvents","quantity":800,"unit":"tonne","emission_factor_kgco2e_per_unit":8.4,"supplier_country_iso":"IN","spend_gbp":600000},
    ],
    "6_business_travel": [
        {"description":"Long-haul flights — senior management","quantity":1800000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.195,"supplier_country_iso":"IN","spend_gbp":3200000},
        {"description":"Domestic rail travel","quantity":3500000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.036,"supplier_country_iso":"IN","spend_gbp":800000},
    ],
    "7_employee_commute": [
        {"description":"Employee commuting — 28,000 staff — private vehicle","quantity":180000000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.171,"supplier_country_iso":"IN","spend_gbp":0},
        {"description":"Employee commuting — company buses","quantity":45000000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.089,"supplier_country_iso":"IN","spend_gbp":4500000},
    ],
    "8_upstream_leased": [
        {"description":"Leased warehousing — Pune, Nashik, Chennai","quantity":450000,"unit":"m2","emission_factor_kgco2e_per_unit":28,"supplier_country_iso":"IN","spend_gbp":6000000},
    ],
    # DOWNSTREAM
    "9_downstream_transport": [
        {"description":"Vehicle delivery — dealer logistics","quantity":8000000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.105,"supplier_country_iso":"IN","spend_gbp":18000000},
        {"description":"Export shipping — SUV to South Africa/Australia","quantity":1200000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.011,"supplier_country_iso":"IN","spend_gbp":8000000},
    ],
    "10_processing": [
        {"description":"Dealer PDI (pre-delivery inspection) electricity","quantity":28000,"unit":"MWh","emission_factor_kgco2e_per_unit":820,"supplier_country_iso":"IN","spend_gbp":3500000},
    ],
    "11_use_of_sold": [
        {"description":"Cars — lifetime ICE tailpipe emissions","quantity":280000,"unit":"vehicle_lifetime","emission_factor_kgco2e_per_unit":22000,"supplier_country_iso":"IN","spend_gbp":0},
        {"description":"EVs — lifetime charging emissions (India grid)","quantity":42000,"unit":"vehicle_lifetime","emission_factor_kgco2e_per_unit":8500,"supplier_country_iso":"IN","spend_gbp":0},
        {"description":"Tractors — fuel combustion","quantity":180000,"unit":"vehicle_lifetime","emission_factor_kgco2e_per_unit":45000,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "12_eol_treatment": [
        {"description":"ELV (End-of-Life Vehicle) recycling","quantity":85000,"unit":"tonne","emission_factor_kgco2e_per_unit":0.42,"supplier_country_iso":"IN","spend_gbp":800000},
        {"description":"Battery recycling — LFP and NMC","quantity":1200,"unit":"tonne","emission_factor_kgco2e_per_unit":3.8,"supplier_country_iso":"IN","spend_gbp":600000},
    ],
    "13_downstream_leased": [
        {"description":"M&M Finance vehicle lease portfolio — operating leases","quantity":24000,"unit":"unit","emission_factor_kgco2e_per_unit":18000,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "14_franchises": [
        {"description":"Dealer franchise operations — showroom energy","quantity":2800,"unit":"unit","emission_factor_kgco2e_per_unit":42000,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "15_investments": [
        {"description":"Mahindra Finance — loan portfolio emissions","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00085,"supplier_country_iso":"IN","spend_gbp":2800000000},
        {"description":"Tech Mahindra equity stake","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00012,"supplier_country_iso":"IN","spend_gbp":4200000000},
    ],
}

# ===========================================================================
# COMPANY 2: Reliance Retail — all 15 categories
# ===========================================================================
reliance_activities = {
    "1_purchased_goods": [
        {"description":"Packaged foods and groceries — FMCG suppliers","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00041,"supplier_country_iso":"IN","spend_gbp":8500000000},
        {"description":"Clothing and textiles — fashion brands","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00062,"supplier_country_iso":"IN","spend_gbp":3200000000},
        {"description":"Electronics — smartphones and consumer devices","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00025,"supplier_country_iso":"CN","spend_gbp":4800000000},
    ],
    "2_capital_goods": [
        {"description":"Store fit-out and fixtures","quantity":1200,"unit":"unit","emission_factor_kgco2e_per_unit":185000,"supplier_country_iso":"IN","spend_gbp":1200000000},
    ],
    "3_fuel_energy": [
        {"description":"Grid electricity — retail stores","quantity":4500000,"unit":"MWh","emission_factor_kgco2e_per_unit":820,"supplier_country_iso":"IN","spend_gbp":450000000},
    ],
    "4_upstream_transport": [
        {"description":"DC to store trucking — last mile","quantity":2800000000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.000092,"supplier_country_iso":"IN","spend_gbp":85000000},
    ],
    "5_waste": [
        {"description":"Food waste — composting and landfill","quantity":180000,"unit":"tonne","emission_factor_kgco2e_per_unit":1.9,"supplier_country_iso":"IN","spend_gbp":12000000},
    ],
    "6_business_travel": [
        {"description":"Executive air travel","quantity":2500000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.195,"supplier_country_iso":"IN","spend_gbp":4500000},
    ],
    "7_employee_commute": [
        {"description":"600,000 retail employees — bus and metro","quantity":1200000000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.089,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "8_upstream_leased": [
        {"description":"Leased distribution centres","quantity":2800000,"unit":"m2","emission_factor_kgco2e_per_unit":28,"supplier_country_iso":"IN","spend_gbp":42000000},
    ],
    "9_downstream_transport": [
        {"description":"JioMart home delivery — EV and petrol","quantity":850000000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.092,"supplier_country_iso":"IN","spend_gbp":28000000},
    ],
    "10_processing": [
        {"description":"Private label food manufacturing","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00038,"supplier_country_iso":"IN","spend_gbp":1200000000},
    ],
    "11_use_of_sold": [
        {"description":"Electronics lifetime energy consumption","quantity":8500000,"unit":"unit","emission_factor_kgco2e_per_unit":180,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "12_eol_treatment": [
        {"description":"E-waste take-back scheme","quantity":28000,"unit":"tonne","emission_factor_kgco2e_per_unit":3.2,"supplier_country_iso":"IN","spend_gbp":1500000},
    ],
    "13_downstream_leased": [
        {"description":"Sublease commercial space in malls","quantity":850000,"unit":"m2","emission_factor_kgco2e_per_unit":32,"supplier_country_iso":"IN","spend_gbp":8500000},
    ],
    "14_franchises": [
        {"description":"Reliance Smart Point franchise operations","quantity":4200,"unit":"unit","emission_factor_kgco2e_per_unit":28000,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "15_investments": [
        {"description":"Reliance Jio — telecom tower emissions","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00022,"supplier_country_iso":"IN","spend_gbp":45000000000},
        {"description":"Reliance New Energy — battery manufacturing","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00018,"supplier_country_iso":"IN","spend_gbp":8500000000},
    ],
}

# ===========================================================================
# COMPANY 3: Larsen & Toubro (Engineering + Construction)
# ===========================================================================
lt_activities = {
    "1_purchased_goods": [
        {"description":"Structural steel and rebar","quantity":850000,"unit":"tonne","emission_factor_kgco2e_per_unit":1.85,"supplier_country_iso":"IN","spend_gbp":1200000000},
        {"description":"Cement and concrete","quantity":2800000,"unit":"tonne","emission_factor_kgco2e_per_unit":0.82,"supplier_country_iso":"IN","spend_gbp":380000000},
        {"description":"Copper cable and wiring","quantity":45000,"unit":"tonne","emission_factor_kgco2e_per_unit":3.2,"supplier_country_iso":"IN","spend_gbp":280000000},
    ],
    "2_capital_goods": [
        {"description":"Heavy equipment — excavators and cranes","quantity":850,"unit":"unit","emission_factor_kgco2e_per_unit":180000,"supplier_country_iso":"JP","spend_gbp":420000000},
    ],
    "3_fuel_energy": [
        {"description":"Diesel — construction plant and equipment","quantity":580000,"unit":"tonne","emission_factor_kgco2e_per_unit":3190,"supplier_country_iso":"IN","spend_gbp":620000000},
    ],
    "4_upstream_transport": [
        {"description":"Material delivery to project sites","quantity":18000000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.105,"supplier_country_iso":"IN","spend_gbp":85000000},
    ],
    "5_waste": [
        {"description":"Construction waste — concrete and steel","quantity":280000,"unit":"tonne","emission_factor_kgco2e_per_unit":0.55,"supplier_country_iso":"IN","spend_gbp":8000000},
    ],
    "6_business_travel": [
        {"description":"International site visits","quantity":4200000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.195,"supplier_country_iso":"IN","spend_gbp":6000000},
    ],
    "7_employee_commute": [
        {"description":"180,000 engineers and workers commuting","quantity":480000000,"unit":"passenger_km","emission_factor_kgco2e_per_unit":0.171,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "8_upstream_leased": [
        {"description":"Site offices and temporary facilities","quantity":850000,"unit":"m2","emission_factor_kgco2e_per_unit":18,"supplier_country_iso":"IN","spend_gbp":12000000},
    ],
    "9_downstream_transport": [
        {"description":"Equipment delivery to client sites","quantity":2800000,"unit":"tonne_km","emission_factor_kgco2e_per_unit":0.105,"supplier_country_iso":"IN","spend_gbp":18000000},
    ],
    "10_processing": [
        {"description":"Concrete batching — third party","quantity":1800000,"unit":"m3","emission_factor_kgco2e_per_unit":0.35,"supplier_country_iso":"IN","spend_gbp":120000000},
    ],
    "11_use_of_sold": [
        {"description":"Buildings operational energy — 40yr lifetime","quantity":4500000,"unit":"MWh_per_year","emission_factor_kgco2e_per_unit":820,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "12_eol_treatment": [
        {"description":"Building demolition waste at EoL","quantity":1800000,"unit":"tonne","emission_factor_kgco2e_per_unit":0.12,"supplier_country_iso":"IN","spend_gbp":18000000},
    ],
    "13_downstream_leased": [
        {"description":"L&T owned properties — tenants energy","quantity":280000,"unit":"m2","emission_factor_kgco2e_per_unit":45,"supplier_country_iso":"IN","spend_gbp":4200000},
    ],
    "14_franchises": [
        {"description":"L&T authorized service centres","quantity":320,"unit":"unit","emission_factor_kgco2e_per_unit":85000,"supplier_country_iso":"IN","spend_gbp":0},
    ],
    "15_investments": [
        {"description":"L&T Finance — infrastructure lending","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00095,"supplier_country_iso":"IN","spend_gbp":12000000000},
        {"description":"L&T Technology Services — IT ops","quantity":1,"unit":"spend_gbp","emission_factor_kgco2e_per_unit":0.00008,"supplier_country_iso":"IN","spend_gbp":3800000000},
    ],
}

companies = [
    ("MM-001", "Mahindra & Mahindra Ltd", 2024, mm_activities),
    ("RIL-RETAIL-001", "Reliance Retail Ventures", 2024, reliance_activities),
    ("LT-001", "Larsen & Toubro Ltd", 2024, lt_activities),
]

print("="*110)
print("  GHG PROTOCOL — ALL 15 SCOPE 3 CATEGORIES  |  3 Companies  |  Full Value Chain")
print("="*110)

grand_total = 0
all_results = []

for eid, ename, yr, acts in companies:
    d = scope3(eid, ename, yr, acts)
    total = d.get("total_scope3_tco2e", 0)
    grand_total += total
    by_cat = d.get("by_category", {})
    hotspots = d.get("hotspots", [])
    val = d.get("validation_summary", {})

    print(f"\n  {'='*106}")
    print(f"  {ename} ({eid})  |  FY{yr}  |  Total Scope 3: {total:,.0f} tCO2e")
    print(f"  {'='*106}")
    print(f"  {'Category':<35} {'tCO2e':>14} {'% of Total':>12} {'Activities':>12}")
    print(f"  {'-'*78}")

    cat_list = []
    # by_category is a list of dicts
    by_cat_dict = {}
    for item in by_cat if isinstance(by_cat, list) else [{"category":k,"total_tco2e":v.get("total_tco2e",0),"pct_of_total":0,"top_activities":[]} for k,v in by_cat.items()]:
        by_cat_dict[item["category"]] = item
    by_cat = by_cat_dict

    for cat, val2 in by_cat.items():
        ct = val2.get("total_tco2e", 0)
        n_act = len(val2.get("top_activities", []))
        cat_list.append((cat, ct, n_act))
    cat_list.sort(key=lambda x: -x[1])

    for cat, ct, n_act in cat_list:
        pct = 100 * ct / total if total else 0
        flag = " <-- HOTSPOT" if pct > 20 else ""
        print(f"  {cat:<35} {ct:>14,.0f} {pct:>11.1f}% {n_act:>11}{flag}")

    print(f"  {'-'*78}")
    print(f"  {'TOTAL Scope 3':<35} {total:>14,.0f} {'100.0%':>12}")

    print(f"\n  Top 3 hotspots: {[h.get('description','?')[:40] for h in hotspots[:3]]}")
    print(f"  Categories covered: {len(by_cat)}/15")
    all_results.append((eid, ename, total, by_cat))  # by_cat already converted to dict above

print(f"\n{'='*110}")
print(f"  CROSS-COMPANY SUMMARY — All 15 Scope 3 Categories")
print(f"{'='*110}")
print(f"  {'Company':<45} {'Scope 3 tCO2e':>18} {'% of Portfolio':>16}")
print(f"  {'-'*82}")
for eid, ename, total, _ in all_results:
    pct = 100 * total / grand_total if grand_total else 0
    print(f"  {ename:<45} {total:>18,.0f} {pct:>15.1f}%")
print(f"  {'-'*82}")
print(f"  {'GRAND TOTAL Scope 3':<45} {grand_total:>18,.0f} {'100.0%':>15}")

# Which categories are universally significant
print(f"\n  MATERIAL CATEGORIES (>5% for any company):")
all_cats = set()
for _, _, _, by_cat in all_results:
    all_cats.update(by_cat.keys())
for cat in sorted(all_cats):
    totals = [by_cat.get(cat, {}).get("total_tco2e", 0) if isinstance(by_cat, dict) else 0 for _, _, _, by_cat in all_results]
    company_totals = [t for (_, _, t, _) in all_results]
    pcts = [100*tot/ct if ct else 0 for tot, ct in zip(totals, company_totals)]
    if any(p > 5 for p in pcts):
        pct_str = "  ".join(f"{p:>5.1f}%" for p in pcts)
        print(f"    {cat:<35} {pct_str}")
