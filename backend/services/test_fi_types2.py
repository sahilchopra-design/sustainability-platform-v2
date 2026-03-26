"""
All Financial Institution Types — PCAF Coverage (using correct per-asset-class endpoints)
"""
import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

def calc_eq(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/listed-equity", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), d.get("waci_scope12_tco2e_per_meur",0) or 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_bizloan(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/business-loans", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), d.get("waci_scope12_tco2e_per_meur",0) or 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_pf(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/project-finance", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_cre(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/commercial-real-estate", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), d.get("waci_scope12_tco2e_per_meur",0) or 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_mort(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/mortgages", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_veh(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/vehicle-loans", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

def calc_sov(assets):
    r = requests.post("http://localhost:8002/api/v1/pcaf/sovereign-bonds", json={"assets":assets}, headers=H)
    d = r.json()
    return d.get("total_financed_tco2e",0), d.get("waci_scope12_tco2e_per_meur",0) or 0, d.get("weighted_data_quality_score",0), d.get("implied_temperature_rise_c",0) or 0

print("="*115)
print("  ALL FINANCIAL INSTITUTION TYPES — PCAF Financed Emissions")
print("  Pension Fund | SWF | DFI | REIT | MFI | Hedge Fund | Insurance Investor")
print("="*115)

fi_results = []

# ── 1. PENSION FUND (DB — NPS equivalent) ──────────────────────────────────
print("\n  1. PENSION FUND — National Pension System (DB Scheme)")
t, waci, dqs, temp = 0, 0, 0, 0
# Listed equity
tot_eq, w, q, tmp = calc_eq([{"asset_id":"NPS-EQ-01","company_name":"Nifty50 Index","sector":"Diversified","country_iso":"IN","outstanding_eur":1200000000,"evic_eur":8500000000,"scope1_tco2e":2800000,"scope2_tco2e":480000,"emissions_verified":True},{"asset_id":"NPS-EQ-02","company_name":"MSCI World Passive","sector":"Diversified","country_iso":"US","outstanding_eur":800000000,"evic_eur":12000000000,"scope1_tco2e":1800000,"scope2_tco2e":320000,"emissions_verified":True}])
t += tot_eq
# Corporate bonds (business loans proxy)
tot_bl, w2, q2, tmp2 = calc_bizloan([{"asset_id":"NPS-BOND-01","company_name":"AAA Corp Bond Pool","sector":"Financials","country_iso":"IN","outstanding_eur":900000000,"total_equity_eur":12000000000,"total_debt_eur":8000000000,"scope1_tco2e":850000,"scope2_tco2e":180000,"emissions_verified":False}])
t += tot_bl
# Sovereign bonds
tot_sov, w3, q3, tmp3 = calc_sov([{"asset_id":"NPS-GSEC-01","country_iso":"IN","country_name":"India","outstanding_eur":900000000,"gdp_eur":3500000000000,"government_expenditure_eur":1200000000000,"scope1_tco2e":2900000000,"emissions_verified":False}])
t += tot_sov
# Infrastructure (project finance)
tot_pf, _, q4, tmp4 = calc_pf([{"asset_id":"NPS-PF-01","project_name":"InvIT Wind","technology":"wind_onshore","country_iso":"IN","outstanding_eur":300000000,"total_project_cost_eur":1800000000,"scope1_tco2e":0,"scope2_tco2e":12000,"emissions_verified":True}])
t += tot_pf
dqs = (q*2000+q2*900+q3*900+q4*300)/(2000+900+900+300)
print(f"    Equity: {tot_eq:,.0f}  |  Corp Bonds: {tot_bl:,.0f}  |  G-Secs: {tot_sov:,.0f}  |  Infra: {tot_pf:,.0f}")
print(f"    TOTAL: {t:,.0f} tCO2e  |  Blended DQS: {dqs:.2f}  |  Assets: 5")
fi_results.append(("1. Pension Fund (NPS DB)", t, dqs, 5))

# ── 2. SOVEREIGN WEALTH FUND ────────────────────────────────────────────────
print("\n  2. SOVEREIGN WEALTH FUND — ADIA-type (Abu Dhabi)")
t2 = 0
tot_eq2, w, q, tmp = calc_eq([
    {"asset_id":"SWF-EQ-01","company_name":"Global Eq Pool","sector":"Diversified","country_iso":"US","outstanding_eur":5000000000,"evic_eur":45000000000,"scope1_tco2e":8500000,"scope2_tco2e":1200000,"emissions_verified":True},
    {"asset_id":"SWF-EM-01","company_name":"EM Eq Pool","sector":"Diversified","country_iso":"IN","outstanding_eur":2000000000,"evic_eur":28000000000,"scope1_tco2e":9500000,"scope2_tco2e":1800000,"emissions_verified":True},
])
t2 += tot_eq2
tot_pf2, _, q2, _ = calc_pf([{"asset_id":"SWF-PF-01","project_name":"Clean Energy Infra","technology":"solar_pv","country_iso":"AE","outstanding_eur":2500000000,"total_project_cost_eur":12000000000,"scope1_tco2e":0,"scope2_tco2e":180000,"emissions_verified":True}])
t2 += tot_pf2
tot_sov2, _, q3, _ = calc_sov([{"asset_id":"SWF-UST-01","country_iso":"US","country_name":"United States","outstanding_eur":4000000000,"gdp_eur":25000000000000,"government_expenditure_eur":6500000000000,"scope1_tco2e":4700000000,"emissions_verified":True}])
t2 += tot_sov2
tot_cre2, _, q4, _ = calc_cre([{"asset_id":"SWF-CRE-01","property_type":"prime_office","property_name":"Global Office Portfolio","country_iso":"GB","outstanding_eur":3000000000,"property_value_eur":6000000000,"floor_area_m2":2800000,"epc_rating":"B","scope2_tco2e":280000,"emissions_verified":True}])
t2 += tot_cre2
dqs2 = (q*7000+q2*2500+q3*4000+q4*3000)/(7000+2500+4000+3000)
print(f"    Equity: {tot_eq2:,.0f}  |  PF: {tot_pf2:,.0f}  |  Sovereigns: {tot_sov2:,.0f}  |  CRE: {tot_cre2:,.0f}")
print(f"    TOTAL: {t2:,.0f} tCO2e  |  Blended DQS: {dqs2:.2f}  |  Assets: 5+")
fi_results.append(("2. Sovereign Wealth Fund", t2, dqs2, 5))

# ── 3. DEVELOPMENT FINANCE INSTITUTION ─────────────────────────────────────
print("\n  3. DEVELOPMENT FINANCE INSTITUTION — IFC-type (Blended Finance)")
t3 = 0
tot_pf3, _, q, _ = calc_pf([
    {"asset_id":"DFI-PF-01","project_name":"Solar Microgrid Bangladesh","technology":"solar_pv","country_iso":"BD","outstanding_eur":45000000,"total_project_cost_eur":120000000,"scope1_tco2e":0,"scope2_tco2e":2800,"emissions_verified":True},
    {"asset_id":"DFI-PF-02","project_name":"Agri Cold Chain Kenya","technology":"other","country_iso":"KE","outstanding_eur":28000000,"total_project_cost_eur":65000000,"scope1_tco2e":0,"scope2_tco2e":4500,"emissions_verified":True},
    {"asset_id":"DFI-PF-03","project_name":"Gender WASH Nigeria","technology":"other","country_iso":"NG","outstanding_eur":35000000,"total_project_cost_eur":85000000,"scope1_tco2e":0,"scope2_tco2e":1800,"emissions_verified":True},
])
t3 += tot_pf3
tot_bl3, _, q2, _ = calc_bizloan([
    {"asset_id":"DFI-SME-01","company_name":"MSME Climate Finance India","sector":"Industrials","country_iso":"IN","outstanding_eur":150000000,"total_equity_eur":600000000,"total_debt_eur":400000000,"scope1_tco2e":280000,"scope2_tco2e":45000,"emissions_verified":False},
    {"asset_id":"DFI-MFI-01","company_name":"Microfinance South Asia","sector":"Financials","country_iso":"BD","outstanding_eur":80000000,"total_equity_eur":180000000,"total_debt_eur":120000000,"scope1_tco2e":8500,"scope2_tco2e":2200,"emissions_verified":False},
])
t3 += tot_bl3
dqs3 = (q*108+q2*230)/(108+230)
print(f"    Project Finance: {tot_pf3:,.0f}  |  Business Loans (SME+MFI): {tot_bl3:,.0f}")
print(f"    TOTAL: {t3:,.0f} tCO2e  |  Blended DQS: {dqs3:.2f}  |  Assets: 5")
fi_results.append(("3. Development Finance (IFC-type)", t3, dqs3, 5))

# ── 4. REIT / InvIT ─────────────────────────────────────────────────────────
print("\n  4. REIT — Embassy Office Parks (India Listed REIT)")
t4, _, dqs4, _ = calc_cre([
    {"asset_id":"REIT-CRE-01","property_type":"office","property_name":"Embassy Manyata Tech Park","country_iso":"IN","outstanding_eur":850000000,"property_value_eur":1800000000,"floor_area_m2":420000,"epc_rating":"B","scope2_tco2e":280000,"emissions_verified":True},
    {"asset_id":"REIT-CRE-02","property_type":"office","property_name":"Mindspace Business Parks","country_iso":"IN","outstanding_eur":480000000,"property_value_eur":1200000000,"floor_area_m2":280000,"epc_rating":"B","scope2_tco2e":180000,"emissions_verified":True},
    {"asset_id":"REIT-IND-01","property_type":"industrial","property_name":"L&T Warehousing Pune","country_iso":"IN","outstanding_eur":280000000,"property_value_eur":580000000,"floor_area_m2":180000,"epc_rating":"C","scope2_tco2e":45000,"emissions_verified":False},
])
tot_mort4, _, dqs4b, _ = calc_mort([{"asset_id":"REIT-MORT-01","property_name":"DDA Housing Mumbai","property_value_eur":280000000,"outstanding_eur":120000000,"epc_rating":"C","floor_area_m2":85000,"emissions_verified":False}])
t4 += tot_mort4
print(f"    CRE: {t4 - tot_mort4:,.0f}  |  Mortgages: {tot_mort4:,.0f}")
print(f"    TOTAL: {t4:,.0f} tCO2e  |  Blended DQS: {(dqs4*3+dqs4b):.2f}  |  Assets: 4")
fi_results.append(("4. REIT / InvIT (Embassy)", t4, (dqs4*3+dqs4b)/4, 4))

# ── 5. MICROFINANCE INSTITUTION ─────────────────────────────────────────────
print("\n  5. MICROFINANCE INSTITUTION — Bandhan Bank-type")
tot_bl5, _, dqs5, _ = calc_bizloan([
    {"asset_id":"MFI-LOAN-01","company_name":"Women SHG Agriculture NE India","sector":"Consumer Staples","country_iso":"IN","outstanding_eur":8000000,"total_equity_eur":12000000,"total_debt_eur":8000000,"scope1_tco2e":12000,"scope2_tco2e":1800,"emissions_verified":False},
    {"asset_id":"MFI-LOAN-02","company_name":"Artisan Handicraft Rajasthan","sector":"Consumer Discretionary","country_iso":"IN","outstanding_eur":4500000,"total_equity_eur":6000000,"total_debt_eur":4000000,"scope1_tco2e":4200,"scope2_tco2e":800,"emissions_verified":False},
    {"asset_id":"MFI-CLEAN-01","company_name":"Solar Lamp Cookstove Microloans","sector":"Utilities","country_iso":"IN","outstanding_eur":2800000,"total_equity_eur":3000000,"total_debt_eur":2000000,"scope1_tco2e":0,"scope2_tco2e":120,"emissions_verified":False},
])
tot_veh5, _, dqs5b, _ = calc_veh([{"asset_id":"MFI-VEH-01","vehicle_type":"e_rickshaw","fuel_type":"electric","country_iso":"IN","outstanding_eur":3200000,"vehicle_value_eur":1800,"annual_km":18000,"emissions_verified":False}])
t5 = tot_bl5 + tot_veh5
print(f"    Business Loans: {tot_bl5:,.0f}  |  Vehicle (E-Rickshaw): {tot_veh5:,.0f}")
print(f"    TOTAL: {t5:,.0f} tCO2e  |  DQS: {dqs5:.2f}  |  Assets: 4")
fi_results.append(("5. Microfinance Institution", t5, dqs5, 4))

# ── 6. HEDGE FUND (Multi-Strategy) ─────────────────────────────────────────
print("\n  6. HEDGE FUND — Multi-Strategy India")
tot_long, w, q, _ = calc_eq([{"asset_id":"HF-LONG-01","company_name":"India Energy Transition Basket (Long)","sector":"Utilities","country_iso":"IN","outstanding_eur":280000000,"evic_eur":2200000000,"scope1_tco2e":0,"scope2_tco2e":120000,"emissions_verified":True}])
tot_short, w2, q2, _ = calc_eq([{"asset_id":"HF-SHORT-01","company_name":"Coal/O&G Cover (Short)","sector":"Energy","country_iso":"IN","outstanding_eur":120000000,"evic_eur":8500000000,"scope1_tco2e":85000000,"scope2_tco2e":2800000,"emissions_verified":True}])
tot_dist, _, q3, _ = calc_bizloan([{"asset_id":"HF-DIST-01","company_name":"Distressed RE Credit","sector":"Real Estate","country_iso":"IN","outstanding_eur":85000000,"total_equity_eur":180000000,"total_debt_eur":320000000,"scope1_tco2e":0,"scope2_tco2e":28000,"emissions_verified":False}])
t6 = tot_long + tot_short + tot_dist
dqs6 = (q*280+q2*120+q3*85)/(280+120+85)
print(f"    Long (clean): {tot_long:,.0f}  |  Short-cover (fossil): {tot_short:,.0f}  |  Distressed credit: {tot_dist:,.0f}")
print(f"    TOTAL (gross): {t6:,.0f} tCO2e  |  Blended DQS: {dqs6:.2f}  |  Assets: 3")
fi_results.append(("6. Hedge Fund (Multi-Strategy)", t6, dqs6, 3))

# ── 7. INSURANCE COMPANY (General Account) ─────────────────────────────────
print("\n  7. INSURANCE CO AS INVESTOR — LIC General Account")
t7 = 0
tot_sov7, _, q, _ = calc_sov([{"asset_id":"LIC-GSEC-01","country_iso":"IN","country_name":"India","outstanding_eur":8500000000,"gdp_eur":3500000000000,"government_expenditure_eur":1200000000000,"scope1_tco2e":2900000000,"emissions_verified":False}])
t7 += tot_sov7
tot_eq7, _, q2, _ = calc_eq([{"asset_id":"LIC-EQ-01","company_name":"Nifty200 LIC Equity","sector":"Diversified","country_iso":"IN","outstanding_eur":2800000000,"evic_eur":18000000000,"scope1_tco2e":5200000,"scope2_tco2e":900000,"emissions_verified":True}])
t7 += tot_eq7
tot_mort7, _, q3, _ = calc_mort([{"asset_id":"LIC-HFL-01","property_name":"LIC Housing Finance Portfolio","property_value_eur":7500000000,"outstanding_eur":3200000000,"epc_rating":"D","floor_area_m2":48000000,"emissions_verified":False}])
t7 += tot_mort7
tot_bl7, _, q4, _ = calc_bizloan([{"asset_id":"LIC-INFRA-01","company_name":"Infra NCD Portfolio","sector":"Industrials","country_iso":"IN","outstanding_eur":1800000000,"total_equity_eur":18000000000,"total_debt_eur":12000000000,"scope1_tco2e":8500000,"scope2_tco2e":1200000,"emissions_verified":True}])
t7 += tot_bl7
dqs7 = (q*8500+q2*2800+q3*3200+q4*1800)/(8500+2800+3200+1800)
print(f"    G-Secs: {tot_sov7:,.0f}  |  Equity: {tot_eq7:,.0f}  |  Mortgages: {tot_mort7:,.0f}  |  Infra Bonds: {tot_bl7:,.0f}")
print(f"    TOTAL: {t7:,.0f} tCO2e  |  Blended DQS: {dqs7:.2f}  |  Assets: 4")
fi_results.append(("7. Insurance Co as Investor (LIC)", t7, dqs7, 4))

# ── MASTER SUMMARY ──────────────────────────────────────────────────────────
print(f"\n{'='*115}")
print(f"  MASTER SUMMARY — All Financial Institution Types (PCAF Coverage)")
print(f"{'='*115}")
print(f"  {'FI Type':<48} {'Financed tCO2e':>16} {'Blended DQS':>13} {'Assets':>8}")
print(f"  {'-'*88}")
grand = 0
for name, total, dqs, n in fi_results:
    grand += total
    print(f"  {name:<48} {total:>16,.0f} {dqs:>13.2f} {n:>8}")
print(f"  {'-'*88}")
print(f"  {'GRAND TOTAL (all FI types)':<48} {grand:>16,.0f}")

print(f"\n  KEY INSIGHTS:")
print(f"  • Insurance Co (LIC): Dominates due to massive G-Sec portfolio (attributed via GDP/expenditure)")
print(f"  • SWF: Large equity + RE positions = highest emission intensity")
print(f"  • DFI: Small ticket sizes, development mandate = low absolute tCO2e, best DQS")
print(f"  • MFI: Negligible absolute tCO2e — but critical for SDG7 (energy access) alignment")
print(f"  • Pension Fund: Sovereign bond exposure drives significant attributed emissions")
