"""
Debug script to test your modules independently
Run this to see where the error is coming from
"""

import os
from dotenv import load_dotenv

load_dotenv()

MORALIS_KEY = os.getenv("MORALIS_KEY")
WEBACY_KEY = os.getenv("WEBACY_API_KEY")

print("="*60)
print("DEBUGGING BLOCKCHAIN ANOMALY DETECTION")
print("="*60)

# Test 1: Check API Keys
print("\n1. Checking API Keys...")
print(f"   Moralis Key: {'✅ Found' if MORALIS_KEY else '❌ Missing'}")
print(f"   Webacy Key: {'✅ Found' if WEBACY_KEY else '❌ Missing'}")

# Test 2: Import modules
print("\n2. Testing Module Imports...")
try:
    from transaction_anomaly import CryptoAnomalyDetectionSystem
    print("   ✅ transaction_anomaly imported")
except Exception as e:
    print(f"   ❌ transaction_anomaly failed: {e}")
    exit(1)

try:
    from sandwich_attack import SandwichAttackAnalyzer
    print("   ✅ sandwich_attack imported")
except Exception as e:
    print(f"   ❌ sandwich_attack failed: {e}")

try:
    from wallet_behavior import InsiderTradingDetector, SnipingBotDetector
    print("   ✅ wallet_behavior imported")
except Exception as e:
    print(f"   ❌ wallet_behavior failed: {e}")

try:
    from liquidity_pool import (
        LiquidityPoolManipulationDetector,
        ConcentratedLiquidityAttackDetector,
        PoolDominationDetector
    )
    print("   ✅ liquidity_pool imported")
except Exception as e:
    print(f"   ❌ liquidity_pool failed: {e}")

try:
    from threat_detector import fetch_risk_data, build_engine_from_webacy
    print("   ✅ threat_detector imported")
except Exception as e:
    print(f"   ❌ threat_detector failed: {e}")

# Test 3: Test Transaction Anomaly Detection
print("\n3. Testing Transaction Anomaly Detection...")
try:
    print("   Creating detector...")
    detector = CryptoAnomalyDetectionSystem(MORALIS_KEY, sensitivity="medium")
    print("   ✅ Detector created successfully")
    
    print("   Analyzing token (this will take a moment)...")
    token_address = "0x6982508145454ce325ddbe47a25d4ec3d2311933"
    results = detector.analyze_token(
        token_address=token_address,
        chain="eth",
        limit=100,
        max_pages=2  # Reduced for faster testing
    )
    
    if results:
        print(f"   ✅ Analysis successful!")
        print(f"   - Transactions analyzed: {results['total_transactions']}")
        print(f"   - Risk Score: {results['risk_score']}")
        print(f"   - Risk Level: {results['risk_level']}")
        print(f"   - Wash Trading Detected: {results['wash_trading']['detected_count']}")
    else:
        print("   ❌ No results returned")
        
except Exception as e:
    print(f"   ❌ Analysis failed: {e}")
    import traceback
    print("\nFull Error:")
    print(traceback.format_exc())

print("\n" + "="*60)
print("DEBUGGING COMPLETE")
print("="*60)