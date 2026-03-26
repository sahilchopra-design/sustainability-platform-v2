import requests, json

TOK = "sess_8bcd2a7aefdd4093bec8cafd3d405d1e"
H = {"Content-Type": "application/json", "Authorization": f"Bearer {TOK}"}

# First check what the endpoint actually returns for one bond
r1 = requests.post("http://localhost:8002/api/v1/pcaf/sovereign-bonds", json={"assets":[
    {"asset_id":"TEST-US","country_iso":"US","country_name":"United States","outstanding_eur":500000000,"gdp_eur":25000000000000,"government_expenditure_eur":6500000000000,"scope1_tco2e":4700000000,"emissions_verified":True}
]}, headers=H)
d1 = r1.json()
print("Sovereign response keys:", list(d1.keys()))
pa = d1.get("per_asset", [])
if pa:
    print("per_asset[0] keys:", list(pa[0].keys()))
    print("per_asset[0]:", json.dumps(pa[0], indent=2)[:500])
ps = d1.get("portfolio_summary", {})
print("portfolio_summary:", json.dumps(ps, indent=2)[:500])
