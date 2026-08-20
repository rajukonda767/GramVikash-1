import asyncio
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from app.services.crop_service import CropRecommendationService
from app.ml.model_loader import model_manager

model_manager.load_all_models(r'C:\Users\rajuk\.gemini\antigravity\scratch\gramvikas\backend')

async def test():
    cases = [
        ("Cotton Target", {"n": 120, "p": 45, "k": 20, "ph": 6.8}),
        ("Cotton Target (Alt K)", {"n": 120, "p": 45, "k": 40, "ph": 6.8}),
        ("Paddy Target", {"n": 80, "p": 45, "k": 40, "ph": 6.5}),
        ("Maize Target", {"n": 75, "p": 48, "k": 20, "ph": 6.2}),
        ("Chickpea Target", {"n": 40, "p": 60, "k": 80, "ph": 7.0}),
        ("Banana Target", {"n": 100, "p": 75, "k": 50, "ph": 6.0}),
    ]

    print("=== VERIFYING CROP RECOMMENDATION PREDICTIONS & POSITIVE PROFITS ===\n")
    for name, params in cases:
        res = await CropRecommendationService.recommend_crops(
            n=params["n"], p=params["p"], k=params["k"], ph=params["ph"], language="en"
        )
        recs = res["recommendations"]
        top1 = recs[0]
        top2 = recs[1] if len(recs) > 1 else None
        print(f"[{name}] Inputs: N={params['n']}, P={params['p']}, K={params['k']}, pH={params['ph']}")
        print(f"  👉 Rank 1: {top1['name_en']} ({top1['name_te']}) | Yield: {top1['expected_yield_tonnes_per_acre']} T/ac | Net Profit: Rs {top1['estimated_profit_per_acre']:,} | Suitability: {top1['suitability_percent']}%")
        if top2:
            print(f"  👉 Rank 2: {top2['name_en']} ({top2['name_te']}) | Yield: {top2['expected_yield_tonnes_per_acre']} T/ac | Net Profit: Rs {top2['estimated_profit_per_acre']:,} | Suitability: {top2['suitability_percent']}%")
        print()

asyncio.run(test())
