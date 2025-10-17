from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import os
from dotenv import load_dotenv

# Import your existing modules
# Assuming all your detector classes are imported from their respective files
from transaction_anomaly import CryptoAnomalyDetectionSystem
from sandwich_attack import SandwichAttackAnalyzer
from wallet_behavior import InsiderTradingDetector, SnipingBotDetector
from liquidity_pool import (
    LiquidityPoolManipulationDetector,
    ConcentratedLiquidityAttackDetector,
    PoolDominationDetector
)
from threat_detector import fetch_risk_data, build_engine_from_webacy

# Load environment variables
load_dotenv()
MORALIS_API_KEY = os.getenv("MORALIS_KEY")
WEBACY_API_KEY = os.getenv("WEBACY_API_KEY")

if WEBACY_API_KEY:
    print("✅ WEBACY_API_KEY loaded successfully")
if MORALIS_API_KEY:
    print("✅ MORALIS_API_KEY loaded successfully")

# Initialize FastAPI app
app = FastAPI(
    title="Onchain Anomaly Detection API",
    description="API for detecting transaction anomalies, sandwich attacks, wallet behavior analysis, and liquidity pool manipulation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== Response Models ====================

class WashTradingWallet(BaseModel):
    wallet_address: str
    round_trips: int
    same_block_trades: int
    total_volume: float
    avg_trade_size: float
    num_trades: int
    avg_round_trip_time: float

class TransactionAnomalyResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]
    timestamp: str

class SandwichAttackResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]
    timestamp: str

class WalletBehaviorResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]
    timestamp: str

class LiquidityPoolResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]
    timestamp: str

class ThreatDetectorResponse(BaseModel):
    status: str = "success"
    data: Dict[str, Any]
    timestamp: str

# ==================== API Endpoints ====================

@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Onchain Anomaly Detection API",
        "version": "1.0.0",
        "status": "online",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "transaction_anomaly": "/api/v1/transaction-anomaly/{token_address}",
            "sandwich_attack": "/api/v1/sandwich-attack/{token_address}",
            "wallet_behavior": "/api/v1/wallet-behavior/{wallet_address}",
            "liquidity_pool": "/api/v1/liquidity-pool/{pair_address}",
            "threat_detector": "/api/v1/threat-detector/{contract_address}"
        }
    }

@app.get("/api/v1/transaction-anomaly/{token_address}", 
         response_model=TransactionAnomalyResponse,
         tags=["Transaction Anomaly"])
async def detect_transaction_anomaly(
    token_address: str,
    chain: str = Query("eth", description="Blockchain network"),
    limit: int = Query(100, description="Transactions per page", ge=1, le=100),
    max_pages: int = Query(5, description="Maximum pages to fetch", ge=1, le=10),
    sensitivity: str = Query("medium", description="Detection sensitivity", pattern="^(low|medium|high)$")
):
    """
    Detect transaction anomalies for a specific token
    
    - **token_address**: ERC20 token contract address
    - **chain**: Blockchain network (default: eth)
    - **limit**: Number of transactions per page (1-100)
    - **max_pages**: Maximum pages to fetch (1-10)
    - **sensitivity**: Detection sensitivity (low, medium, high)
    """
    try:
        if not MORALIS_API_KEY:
            raise HTTPException(status_code=500, detail="Moralis API key not configured")
        
        # Initialize detector
        detector = CryptoAnomalyDetectionSystem(MORALIS_API_KEY, sensitivity=sensitivity)
        
        # Run analysis
        results = detector.analyze_token(
            token_address=token_address,
            chain=chain,
            limit=limit,
            max_pages=max_pages
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="No transactions found for this token")
        
        # Format top suspicious wallets
        top_wallets = []
        if results['wash_trading']['detected_count'] > 0:
            for wallet, data in list(results['wash_trading']['suspicious_wallets'].items())[:5]:
                top_wallets.append({
                    "wallet_address": wallet,
                    "round_trips": data['round_trips'],
                    "same_block_trades": data['same_block_trades'],
                    "total_volume": data['total_volume'],
                    "avg_trade_size": data['avg_trade_size'],
                    "num_trades": data['num_trades']
                })
        
        # Structure response
        response_data = {
            "token_address": results['token_address'],
            "chain": results['chain'],
            "total_transactions": results['total_transactions'],
            "risk_assessment": {
                "risk_score": results['risk_score'],
                "risk_level": results['risk_level']
            },
            "wash_trading": {
                "suspicious_wallets_count": results['wash_trading']['detected_count'],
                "total_suspicious_volume": results['wash_trading'].get('total_suspicious_volume', 0),
                "mev_bots_filtered": results['wash_trading'].get('mev_bots_filtered', 0),
                "top_suspicious_wallets": top_wallets
            },
            "price_manipulation": {
                "total_events": results['price_manipulation']['total_events'],
                "manipulation_events": len(results['price_manipulation']['manipulation_events']),
                "coordinated_trading_events": len(results['price_manipulation']['coordinated_trading']),
                "highest_price_spike": results['price_manipulation']['highest_spike']
            },
            "pump_and_dump": {
                "detected_schemes": results['pump_and_dump']['num_schemes'],
                "high_confidence_schemes": len(results['pump_and_dump']['high_confidence'])
            }
        }
        
        return TransactionAnomalyResponse(
            status="success",
            data=response_data,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/sandwich-attack/{token_address}",
         response_model=SandwichAttackResponse,
         tags=["Sandwich Attack"])
async def detect_sandwich_attack(
    token_address: str,
    chain: str = Query("eth", description="Blockchain network"),
    num_transactions: int = Query(100, description="Number of transactions to analyze", ge=1, le=500)
):
    """
    Detect sandwich attacks for a specific token
    
    - **token_address**: ERC20 token contract address
    - **chain**: Blockchain network (default: eth)
    - **num_transactions**: Number of recent transactions to analyze
    """
    try:
        if not MORALIS_API_KEY:
            raise HTTPException(status_code=500, detail="Moralis API key not configured")
        
        # Initialize analyzer
        analyzer = SandwichAttackAnalyzer(
            api_key=MORALIS_API_KEY,
            token_address=token_address,
            chain=chain
        )
        
        # Run analysis
        attacks = analyzer.analyze(num_transactions=num_transactions, verbose=False)
        
        # Calculate statistics
        unique_attackers = len(set(attack.attacker_address for attack in attacks))
        unique_victims = len(set(attack.victim_address for attack in attacks))
        total_profit = sum(attack.profit_usd for attack in attacks)
        avg_profit = total_profit / len(attacks) if attacks else 0
        
        # Format attack details
        attack_details = []
        for attack in attacks[:10]:  # Limit to top 10
            attack_details.append({
                "block_number": attack.block_number,
                "timestamp": attack.attack_timestamp,
                "attacker_address": attack.attacker_address,
                "victim_address": attack.victim_address,
                "profit_usd": attack.profit_usd,
                "pair": attack.front_run_tx.pair_label,
                "front_run_tx_hash": attack.front_run_tx.transaction_hash,
                "victim_tx_hash": attack.victim_tx.transaction_hash,
                "back_run_tx_hash": attack.back_run_tx.transaction_hash
            })
        
        response_data = {
            "token_address": token_address,
            "chain": chain,
            "total_transactions_analyzed": num_transactions,
            "summary": {
                "attacks_detected": len(attacks),
                "unique_attackers": unique_attackers,
                "unique_victims": unique_victims,
                "total_profit_usd": total_profit,
                "average_profit_usd": avg_profit
            },
            "attacks": attack_details
        }
        
        return SandwichAttackResponse(
            status="success",
            data=response_data,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/wallet-behavior/{wallet_address}",
         response_model=WalletBehaviorResponse,
         tags=["Wallet Behavior"])
async def analyze_wallet_behavior(
    wallet_address: str,
    chain: str = Query("eth", description="Blockchain network"),
    min_suspicion_score: float = Query(20, description="Minimum suspicion score", ge=0, le=100)
):
    """
    Analyze wallet behavior for insider trading and sniping patterns
    
    - **wallet_address**: Wallet address to analyze
    - **chain**: Blockchain network (default: eth)
    - **min_suspicion_score**: Minimum suspicion score threshold
    """
    try:
        if not MORALIS_API_KEY:
            raise HTTPException(status_code=500, detail="Moralis API key not configured")
        
        # Initialize detectors
        insider_detector = InsiderTradingDetector(api_key=MORALIS_API_KEY, chain=chain)
        sniping_detector = SnipingBotDetector(api_key=MORALIS_API_KEY, chain=chain)
        
        # Run insider trading detection
        insider_trades = insider_detector.analyze_wallet(wallet_address, min_suspicion_score)
        
        # Format insider trades
        suspicious_trades = []
        for trade in insider_trades[:5]:  # Top 5
            suspicious_trades.append({
                "token_symbol": trade.token_symbol,
                "token_address": trade.token_address,
                "suspicion_score": trade.suspicion_score,
                "entry_price": trade.entry_price,
                "current_price": trade.current_price,
                "price_change_percent": trade.price_change_percent,
                "position_value": trade.current_position_value,
                "time_since_entry": trade.time_since_entry,
                "entry_tx_hash": trade.entry_transaction.transaction_hash,
                "red_flags": trade.flags
            })
        
        # Run sniping bot detection
        bot_profile = sniping_detector.analyze_wallet(wallet_address)
        
        # Format bot profile
        bot_data = {}
        if bot_profile:
            recent_snipes = []
            for snipe in bot_profile.recent_snipes[:5]:
                recent_snipes.append({
                    "token_symbol": snipe.bought_symbol,
                    "amount": snipe.bought_amount,
                    "value_usd": snipe.total_value_usd,
                    "block_number": snipe.block_number,
                    "tx_index": snipe.transaction_index,
                    "tx_hash": snipe.transaction_hash
                })
            
            bot_data = {
                "bot_confidence_score": bot_profile.bot_confidence_score,
                "total_snipes": bot_profile.total_snipes,
                "successful_snipes": bot_profile.successful_snipes,
                "success_rate": bot_profile.success_rate,
                "total_volume_usd": bot_profile.total_volume_usd,
                "avg_entry_speed": bot_profile.avg_entry_speed_blocks,
                "tokens_sniped": bot_profile.tokens_sniped[:10],
                "recent_snipes": recent_snipes,
                "classification": (
                    "HIGHLY LIKELY SNIPING BOT" if bot_profile.bot_confidence_score >= 70
                    else "PROBABLE SNIPING BOT" if bot_profile.bot_confidence_score >= 50
                    else "POSSIBLE SNIPING BOT" if bot_profile.bot_confidence_score >= 30
                    else "UNLIKELY TO BE A BOT"
                )
            }
        
        response_data = {
            "wallet_address": wallet_address,
            "chain": chain,
            "insider_trading": {
                "suspicious_trades_count": len(insider_trades),
                "suspicious_trades": suspicious_trades
            },
            "sniping_bot_analysis": bot_data if bot_data else {"detected": False}
        }
        
        return WalletBehaviorResponse(
            status="success",
            data=response_data,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/liquidity-pool/{pair_address}",
         response_model=LiquidityPoolResponse,
         tags=["Liquidity Pool"])
async def analyze_liquidity_pool(
    pair_address: str,
    chain: str = Query("eth", description="Blockchain network"),
    num_transactions: int = Query(100, description="Number of transactions to analyze", ge=1, le=500)
):
    """
    Analyze liquidity pool for manipulation and attacks
    
    - **pair_address**: Liquidity pair address
    - **chain**: Blockchain network (default: eth)
    - **num_transactions**: Number of transactions to analyze
    """
    try:
        if not MORALIS_API_KEY:
            raise HTTPException(status_code=500, detail="Moralis API key not configured")
        
        # Initialize detectors
        manipulation_detector = LiquidityPoolManipulationDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain
        )
        
        attack_detector = ConcentratedLiquidityAttackDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain
        )
        
        domination_detector = PoolDominationDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain
        )
        
        # Run analyses
        manipulations = manipulation_detector.analyze(num_transactions)
        attacks = attack_detector.analyze(num_transactions)
        dominations = domination_detector.analyze(num_transactions)
        
        # Format manipulation events
        manipulation_events = []
        for event in manipulations[:5]:
            manipulation_events.append({
                "type": event.manipulation_type,
                "severity": event.severity,
                "timestamp": event.timestamp,
                "block_number": event.block_number,
                "total_value_usd": event.total_value_usd,
                "risk_score": event.risk_score,
                "involved_wallets_count": len(event.involved_wallets),
                "involved_wallets": event.involved_wallets[:5],
                "description": event.description
            })
        
        # Format attack events
        attack_events = []
        for attack in attacks[:5]:
            attack_events.append({
                "attack_type": attack.attack_type,
                "attacker_address": attack.attacker_address,
                "confidence": attack.attack_confidence,
                "block_number": attack.block_number,
                "timestamp": attack.timestamp,
                "transactions_involved": len(attack.transactions_involved),
                "price_impact": attack.price_impact if attack.price_impact > 0 else None
            })
        
        # Format domination info
        domination_info = []
        for dom in dominations:
            domination_info.append({
                "dominant_wallet": dom.dominant_wallet,
                "risk_level": dom.risk_level,
                "domination_percentage": dom.domination_percentage,
                "manipulation_likelihood": dom.manipulation_likelihood,
                "transaction_pattern": dom.transaction_pattern,
                "wallet_transactions": dom.wallet_transactions,
                "total_transactions": dom.total_transactions,
                "wallet_volume_usd": dom.wallet_volume_usd,
                "total_volume_usd": dom.total_volume_usd
            })
        
        response_data = {
            "pair_address": pair_address,
            "chain": chain,
            "pool_info": {
                "pair_label": manipulation_detector.pool_info.pair_label if manipulation_detector.pool_info else "N/A",
                "exchange_name": manipulation_detector.pool_info.exchange_name if manipulation_detector.pool_info else "N/A"
            },
            "total_transactions_analyzed": num_transactions,
            "manipulation_detection": {
                "events_count": len(manipulations),
                "events": manipulation_events
            },
            "attack_detection": {
                "attacks_count": len(attacks),
                "attacks": attack_events
            },
            "domination_analysis": {
                "dominant_entities_count": len(dominations),
                "entities": domination_info
            }
        }
        
        return LiquidityPoolResponse(
            status="success",
            data=response_data,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/threat-detector/{contract_address}",
         response_model=ThreatDetectorResponse,
         tags=["Threat Detector"])
async def detect_threats(
    contract_address: str
):
    """
    Analyze contract/token for security threats and risks
    
    - **contract_address**: Contract address to analyze
    """
    try:
        if not WEBACY_API_KEY:
            raise HTTPException(status_code=500, detail="Webacy API key not configured")
        
        # Fetch risk data
        webacy_response = fetch_risk_data(contract_address, WEBACY_API_KEY)
        
        if not webacy_response:
            raise HTTPException(status_code=404, detail="No data available for this contract")
        
        # Build risk engine
        engine, modules = build_engine_from_webacy(webacy_response)
        
        # Extract token info
        details = webacy_response.get("details", {})
        token_meta = details.get("token_metadata_risk", {}) or {}
        market = details.get("marketData", {}) or {}
        
        symbol = (
            token_meta.get("symbol") or
            market.get("symbol") or
            details.get("token_risk", {}).get("symbol") or
            "N/A"
        )
        
        name = (
            token_meta.get("name") or
            market.get("name") or
            details.get("token_risk", {}).get("name") or
            "Unknown Token"
        )
        
        # Calculate scores
        overall_score, overall_label = engine.overall_risk()
        
        # Format module scores
        risk_modules = {}
        for module_name, module in modules.items():
            score = module.score()
            risk_modules[module_name] = {
                "score": score,
                "label": engine.label(score),
                "explanation": module.explain()
            }
        
        # Get top risk contributors
        top_risks = sorted(
            ((name, module.score()) for name, module in modules.items()),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        response_data = {
            "contract_address": contract_address,
            "token_info": {
                "name": name,
                "symbol": symbol,
                "market_cap": market.get("market_cap", "N/A"),
                "current_price": market.get("current_price", "N/A")
            },
            "overall_risk": {
                "score": overall_score,
                "label": overall_label
            },
            "risk_modules": risk_modules,
            "top_risk_contributors": [
                {"category": name, "score": score} for name, score in top_risks
            ]
        }
        
        return ThreatDetectorResponse(
            status="success",
            data=response_data,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_keys": {
            "moralis": bool(MORALIS_API_KEY),
            "webacy": bool(WEBACY_API_KEY)
        }
    }


if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*70)
    print("🚀 Starting Onchain Anomaly Detection API")
    print("="*70)
    print(f"📍 Server: http://localhost:8000")
    print(f"📚 Documentation: http://localhost:8000/docs")
    print(f"📖 ReDoc: http://localhost:8000/redoc")
    print("="*70 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000)