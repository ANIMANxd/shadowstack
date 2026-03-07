#!/usr/bin/env python3
import urllib.request, json, time

print("\n" + "="*70)
print("ShadowStack Backend Status (Running in Docker)")
print("="*70)

try:
    # Check health
    resp = json.loads(urllib.request.urlopen("http://127.0.0.1:8000/health").read())
    print(f"\n✅ Status     : {resp['status'].upper()}")
    print(f"   Database  : {resp['database']}")
    print(f"   Version   : {resp['version']}")
    print(f"   RF Model  : {'Loaded ✓' if resp['model_loaded'] else 'NOT LOADED ✗'}")
    print(f"   LSTM Model: {'Loaded ✓' if resp['lstm_loaded'] else 'NOT LOADED ✗'}")
    
    # Quick prediction test
    print("\n" + "-"*70)
    print("Testing /api/predict endpoint...")
    body = json.dumps({
        "pr_number": 42,
        "complexity_score": 5.5,
        "resource_units": 200.0,
        "service_name": "compute",
        "resource_type": "t3.micro"
    }).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/predict",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    pred = json.loads(urllib.request.urlopen(req).read())
    print(f"✅ PR #{pred['pr_number']} | Estimated Cost: ${pred['predicted_cost_usd']:.2f}/month")
    print(f"   Model: {pred['model_version']}")
    
    # Forecast test
    print("\n" + "-"*70)
    print("Testing /api/costs/forecast endpoint...")
    costs = [round(50000 + i*150, 2) for i in range(30)]
    body = json.dumps({"daily_costs_usd": costs}).encode()
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/costs/forecast",
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    fcst = json.loads(urllib.request.urlopen(req).read())
    print(f"✅ 30-Day Forecast Generated | {fcst['message']}")
    print(f"   Day 1: ${fcst['forecast'][0]['predicted_cost_usd']:.2f}")
    print(f"   Day 30: ${fcst['forecast'][-1]['predicted_cost_usd']:.2f}")
    print(f"   Model: {fcst['model_version']}")
    
    print("\n" + "="*70)
    print("✅ All endpoints working correctly!")
    print("="*70 + "\n")
    
except Exception as e:
    print(f"\n❌ Error: {e}\n")
    exit(1)
