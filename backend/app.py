"""
ChainWatch Anomaly Detection API
FastAPI backend for detecting on-chain transaction anomalies
Save this as: app.py
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import os
import sys
import json
import numpy as np
from dotenv import load_dotenv
import logging

# Add the current directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add file handler for persistent logging
file_handler = logging.FileHandler('api.log')
file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(file_handler)

# Import your detection modules
try:
    from transaction_anomaly import CryptoAnomalyDetectionSystem
    from sandwich_attack import SandwichAttackAnalyzer
    from wallet_behavior import InsiderTradingDetector, SnipingBotDetector
    from liquidity_pool import (
        LiquidityPoolManipulationDetector,
        ConcentratedLiquidityAttackDetector,
        PoolDominationDetector
    )
    from threat_detector import fetch_risk_data, build_engine_from_webacy
    logger.info("All detection modules imported successfully")
except ImportError as e:
    logger.error(f"⚠️ Warning: Could not import some modules: {e}")
    logger.warning("Some endpoints may not work properly")

# Initialize FastAPI app
app = FastAPI(
    title="ChainWatch Anomaly Detection APP",
    description="Detect on-chain transaction anomalies, wash trading, pump & dump schemes, and more",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Custom JSON encoder to handle NumPy types
class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, np.bool_):
            return bool(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super(NumpyEncoder, self).default(obj)

def convert_numpy_types(obj):
    """Recursively convert NumPy types to Python native types"""
    if isinstance(obj, dict):
        return {key: convert_numpy_types(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_numpy_types(item) for item in obj]
    elif isinstance(obj, np.integer):
        return int(obj)
    elif isinstance(obj, np.floating):
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    else:
        return obj

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {exc}", exc_info=True)
    logger.error(f"Request details: Method={request.method}, URL={request.url}, Headers={dict(request.headers)}")
    
    error_detail = str(exc)
    error_type = type(exc).__name__
    
    logger.error(f"Error type: {error_type}, Detail: {error_detail}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": error_detail,
            "type": error_type,
            "request_url": str(request.url),
            "method": request.method
        }
    )

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Origin"],
)
logger.info("CORS middleware configured with allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000']")

# Configuration
MORALIS_API_KEY = os.getenv("MORALIS_KEY")
WEBACY_API_KEY = os.getenv("WEBACY_API_KEY")

print(f"MORALIS_KEY: {'✅ Loaded' if MORALIS_API_KEY else '❌ Missing'}")
print(f"WEBACY_API_KEY: {'✅ Loaded' if WEBACY_API_KEY else '❌ Missing'}")


# Enums
class ChainEnum(str, Enum):
    ethereum = "eth"
    bsc = "bsc"
    polygon = "polygon"
    avalanche = "avalanche"


class SensitivityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


# Response Models
class RiskLevel(BaseModel):
    score: float = Field(..., description="Risk score from 0-100")
    level: str = Field(..., description="Risk level: MINIMAL, LOW, MEDIUM, HIGH, CRITICAL")


class WashTradingResponse(BaseModel):
    detected_count: int
    suspicious_wallets: Dict[str, Any]
    total_suspicious_volume: float
    mev_bots_filtered: int = 0
    note: str = ""
    top_suspicious_wallets: List[Dict[str, Any]] = []


class PriceManipulationResponse(BaseModel):
    total_events: int
    manipulation_events: List[Dict[str, Any]]
    coordinated_trading: List[Dict[str, Any]]
    highest_spike: float


class PumpAndDumpResponse(BaseModel):
    num_schemes: int
    detected_schemes: List[Dict[str, Any]]
    high_confidence: List[Dict[str, Any]]


class TransactionAnomalyResponse(BaseModel):
    token_address: str
    chain: str
    analysis_timestamp: str
    total_transactions: int
    wash_trading: WashTradingResponse
    price_manipulation: PriceManipulationResponse
    pump_and_dump: PumpAndDumpResponse
    risk_score: float
    risk_level: str
    message: str = "Analysis completed successfully"


class SandwichAttackResponse(BaseModel):
    token_address: str
    chain: str
    total_transactions: int
    unique_blocks: int
    attacks_detected: int
    attacks: List[Dict[str, Any]] = []
    message: str


class InsiderTradeResponse(BaseModel):
    wallet_address: str
    chain: str
    total_transactions: int
    suspicious_trades_count: int
    suspicious_trades: List[Dict[str, Any]]
    message: str


class SnipingBotResponse(BaseModel):
    wallet_address: str
    chain: str
    bot_confidence_score: float
    total_snipes: int
    successful_snipes: int
    success_rate: float
    total_volume_usd: float
    tokens_sniped: List[str]
    recent_snipes: List[Dict[str, Any]]
    classification: str
    message: str


class LiquidityManipulationResponse(BaseModel):
    pair_address: str
    chain: str
    pool_label: str
    exchange_name: str
    total_transactions: int
    manipulations_detected: int
    manipulations: List[Dict[str, Any]]
    message: str


class ConcentratedAttackResponse(BaseModel):
    pair_address: str
    chain: str
    pool_label: str
    exchange_name: str
    total_transactions: int
    attacks_detected: int
    attacks: List[Dict[str, Any]]
    message: str


class PoolDominationResponse(BaseModel):
    pair_address: str
    chain: str
    pool_label: str
    exchange_name: str
    total_transactions: int
    dominant_entities: int
    dominations: List[Dict[str, Any]]
    message: str


class ThreatAssessmentResponse(BaseModel):
    address: str
    token_name: str
    token_symbol: str
    market_cap: Any
    current_price: Any
    overall_risk_score: float
    overall_risk_level: str
    risk_modules: Dict[str, Dict[str, Any]]
    top_risk_contributors: List[Dict[str, Any]]
    message: str


# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to ChainWatch Anomaly Detection APP",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "transaction_anomaly": "/api/v1/transaction-anomaly",
            "sandwich_attack": "/api/v1/sandwich-attack",
            "insider_trading": "/api/v1/insider-trading",
            "sniping_bot": "/api/v1/sniping-bot",
            "liquidity_manipulation": "/api/v1/liquidity-manipulation",
            "concentrated_attack": "/api/v1/concentrated-attack",
            "pool_domination": "/api/v1/pool-domination",
            "threat_assessment": "/api/v1/threat-assessment"
        },
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        }
    }


# Health check
@app.get("/health")
async def health_check():
    try:
        status = {
            "status": "starting",
            "timestamp": datetime.now().isoformat(),
            "api_keys": {
                "moralis": "configured" if MORALIS_API_KEY else "missing",
                "webacy": "configured" if WEBACY_API_KEY else "missing",
                "etherscan": "configured" if os.getenv('ETHERSCAN_API_KEY') else "missing",
                "gecko": "configured" if os.getenv('GECKO_API') else "missing"
            },
            "environment": {
                "python_version": sys.version,
                "port": os.getenv('PORT', '8001'),
                "worker_count": 1
            }
        }
        
        # Check if all required API keys are present
        required_keys = [MORALIS_API_KEY, WEBACY_API_KEY]
        if all(required_keys):
            status["status"] = "healthy"
        
        return status
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {"status": "unhealthy", "error": str(e), "timestamp": datetime.now().isoformat()}


# Test endpoint to verify module imports
@app.get("/api/v1/test")
async def test_modules():
    """Test if all detection modules are properly loaded"""
    modules_status = {}
    
    try:
        CryptoAnomalyDetectionSystem
        modules_status["transaction_anomaly"] = "loaded"
    except:
        modules_status["transaction_anomaly"] = "not loaded"
    
    try:
        SandwichAttackAnalyzer
        modules_status["sandwich_attack"] = "loaded"
    except:
        modules_status["sandwich_attack"] = "not loaded"
    
    try:
        InsiderTradingDetector
        modules_status["insider_trading"] = "loaded"
    except:
        modules_status["insider_trading"] = "not loaded"
    
    try:
        SnipingBotDetector
        modules_status["sniping_bot"] = "loaded"
    except:
        modules_status["sniping_bot"] = "not loaded"
    
    try:
        LiquidityPoolManipulationDetector
        modules_status["liquidity_manipulation"] = "loaded"
    except:
        modules_status["liquidity_manipulation"] = "not loaded"
    
    try:
        fetch_risk_data
        modules_status["threat_assessment"] = "loaded"
    except:
        modules_status["threat_assessment"] = "not loaded"
    
    return {
        "status": "ok",
        "modules": modules_status,
        "api_keys": {
            "moralis": "configured" if MORALIS_API_KEY else "missing",
            "webacy": "configured" if WEBACY_API_KEY else "missing"
        }
    }


# 1. Transaction Anomaly Detection
@app.get("/api/v1/transaction-anomaly", response_model=TransactionAnomalyResponse)
async def detect_transaction_anomaly(
    token_address: str = Query(..., description="ERC20 token contract address", examples=["0x6982508145454ce325ddbe47a25d4ec3d2311933"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    sensitivity: SensitivityEnum = Query(SensitivityEnum.medium, description="Detection sensitivity"),
    limit: int = Query(100, ge=10, le=100, description="Transactions per page"),
    max_pages: int = Query(5, ge=1, le=10, description="Maximum pages to fetch")
):
    """
    Detect transaction anomalies including wash trading, price manipulation, and pump & dump schemes.
    
    Example: `/api/v1/transaction-anomaly?token_address=0x6982508145454ce325ddbe47a25d4ec3d2311933&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = CryptoAnomalyDetectionSystem(MORALIS_API_KEY, sensitivity=sensitivity.value)
        results = detector.analyze_token(
            token_address=token_address,
            chain=chain.value,
            limit=limit,
            max_pages=max_pages
        )
        
        if not results:
            raise HTTPException(status_code=404, detail="No transactions found for this token")
        
        # Convert NumPy types to native Python types
        results = convert_numpy_types(results)
        
        # Extract top suspicious wallets
        top_wallets = []
        if results['wash_trading']['detected_count'] > 0:
            for wallet, data in list(results['wash_trading']['suspicious_wallets'].items())[:5]:
                top_wallets.append({
                    "wallet": wallet,
                    "round_trips": int(data['round_trips']),
                    "same_block_trades": int(data['same_block_trades']),
                    "total_volume": float(data['total_volume']),
                    "avg_trade_size": float(data['avg_trade_size']),
                    "num_trades": int(data['num_trades'])
                })
        
        return TransactionAnomalyResponse(
            token_address=results['token_address'],
            chain=results['chain'],
            analysis_timestamp=results['analysis_timestamp'],
            total_transactions=int(results['total_transactions']),
            wash_trading=WashTradingResponse(
                detected_count=int(results['wash_trading']['detected_count']),
                suspicious_wallets=results['wash_trading']['suspicious_wallets'],
                total_suspicious_volume=float(results['wash_trading'].get('total_suspicious_volume', 0)),
                mev_bots_filtered=int(results['wash_trading'].get('mev_bots_filtered', 0)),
                note=str(results['wash_trading'].get('note', '')),
                top_suspicious_wallets=top_wallets
            ),
            price_manipulation=PriceManipulationResponse(
                total_events=int(results['price_manipulation']['total_events']),
                manipulation_events=results['price_manipulation']['manipulation_events'],
                coordinated_trading=results['price_manipulation']['coordinated_trading'],
                highest_spike=float(results['price_manipulation']['highest_spike'])
            ),
            pump_and_dump=PumpAndDumpResponse(
                num_schemes=int(results['pump_and_dump']['num_schemes']),
                detected_schemes=results['pump_and_dump']['detected_schemes'],
                high_confidence=results['pump_and_dump']['high_confidence']
            ),
            risk_score=float(results['risk_score']),
            risk_level=str(results['risk_level'])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing transaction anomalies: {str(e)}")


# 2. Sandwich Attack Detection
@app.get("/api/v1/sandwich-attack", response_model=SandwichAttackResponse)
async def detect_sandwich_attack(
    token_address: str = Query(..., description="ERC20 token contract address", examples=["0x6982508145454ce325ddbe47a25d4ec3d2311933"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    num_transactions: int = Query(100, ge=10, le=500, description="Number of transactions to analyze")
):
    """
    Detect sandwich attacks in token transactions.
    
    Example: `/api/v1/sandwich-attack?token_address=0x6982508145454ce325ddbe47a25d4ec3d2311933&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        analyzer = SandwichAttackAnalyzer(
            api_key=MORALIS_API_KEY,
            token_address=token_address,
            chain=chain.value
        )
        
        attacks = analyzer.analyze(num_transactions=num_transactions, verbose=False)
        
        # Format attacks for response and convert NumPy types
        formatted_attacks = []
        for attack in attacks:
            formatted_attacks.append({
                "attacker_address": str(attack.attacker_address),
                "victim_address": str(attack.victim_address),
                "block_number": int(attack.block_number),
                "timestamp": str(attack.attack_timestamp),
                "profit_usd": float(attack.profit_usd),
                "pair": str(attack.front_run_tx.pair_label),
                "front_run_hash": str(attack.front_run_tx.transaction_hash),
                "victim_hash": str(attack.victim_tx.transaction_hash),
                "back_run_hash": str(attack.back_run_tx.transaction_hash)
            })
        
        message = "No sandwich attacks detected" if len(attacks) == 0 else f"Detected {len(attacks)} sandwich attack(s)"
        
        return SandwichAttackResponse(
            token_address=token_address,
            chain=chain.value,
            total_transactions=num_transactions,
            unique_blocks=len(set(attack.block_number for attack in attacks)) if attacks else 0,
            attacks_detected=len(attacks),
            attacks=formatted_attacks,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting sandwich attacks: {str(e)}")


# 3. Insider Trading Detection
@app.get("/api/v1/insider-trading", response_model=InsiderTradeResponse)
async def detect_insider_trading(
    wallet_address: str = Query(..., description="Wallet address to analyze", examples=["0xcB1C1FdE09f811B294172696404e88E658659905"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    min_suspicion_score: float = Query(30, ge=0, le=100, description="Minimum suspicion score threshold")
):
    """
    Detect potential insider trading patterns in wallet activity.
    
    Example: `/api/v1/insider-trading?wallet_address=0xcB1C1FdE09f811B294172696404e88E658659905&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = InsiderTradingDetector(api_key=MORALIS_API_KEY, chain=chain.value)
        trades = detector.analyze_wallet(wallet_address, min_suspicion_score=min_suspicion_score)
        
        # Format trades for response
        formatted_trades = []
        for trade in trades:
            formatted_trades.append({
                "token_symbol": trade.token_symbol,
                "token_address": trade.token_address,
                "suspicion_score": trade.suspicion_score,
                "entry_price": trade.entry_price,
                "current_price": trade.current_price,
                "price_change_percent": trade.price_change_percent,
                "position_value": trade.current_position_value,
                "time_since_entry": trade.time_since_entry,
                "entry_tx_hash": trade.entry_transaction.transaction_hash,
                "entry_block": trade.entry_transaction.block_number,
                "flags": trade.flags
            })
        
        message = "No suspicious insider trading detected" if len(trades) == 0 else f"Detected {len(trades)} suspicious trade(s)"
        
        return InsiderTradeResponse(
            wallet_address=wallet_address,
            chain=chain.value,
            total_transactions=0,
            suspicious_trades_count=len(trades),
            suspicious_trades=formatted_trades,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting insider trading: {str(e)}")


# 4. Sniping Bot Detection
@app.get("/api/v1/sniping-bot", response_model=SnipingBotResponse)
async def detect_sniping_bot(
    wallet_address: str = Query(..., description="Wallet address to analyze", examples=["0xcB1C1FdE09f811B294172696404e88E658659905"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network")
):
    """
    Detect sniping bot behavior in wallet activity.
    
    Example: `/api/v1/sniping-bot?wallet_address=0xcB1C1FdE09f811B294172696404e88E658659905&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = SnipingBotDetector(api_key=MORALIS_API_KEY, chain=chain.value)
        bot_profile = detector.analyze_wallet(wallet_address)
        
        if not bot_profile:
            return SnipingBotResponse(
                wallet_address=wallet_address,
                chain=chain.value,
                bot_confidence_score=0,
                total_snipes=0,
                successful_snipes=0,
                success_rate=0,
                total_volume_usd=0,
                tokens_sniped=[],
                recent_snipes=[],
                classification="NOT A BOT",
                message="Not enough data or not a sniping bot"
            )
        
        # Format recent snipes
        formatted_snipes = []
        for snipe in bot_profile.recent_snipes:
            formatted_snipes.append({
                "token": snipe.bought_symbol,
                "amount": snipe.bought_amount,
                "value_usd": snipe.total_value_usd,
                "block_number": snipe.block_number,
                "tx_index": snipe.transaction_index,
                "tx_hash": snipe.transaction_hash,
                "timestamp": snipe.block_timestamp
            })
        
        # Determine classification
        if bot_profile.bot_confidence_score >= 70:
            classification = "HIGHLY LIKELY SNIPING BOT"
        elif bot_profile.bot_confidence_score >= 50:
            classification = "PROBABLE SNIPING BOT"
        elif bot_profile.bot_confidence_score >= 30:
            classification = "POSSIBLE SNIPING BOT"
        else:
            classification = "UNLIKELY TO BE A BOT"
        
        return SnipingBotResponse(
            wallet_address=wallet_address,
            chain=chain.value,
            bot_confidence_score=bot_profile.bot_confidence_score,
            total_snipes=bot_profile.total_snipes,
            successful_snipes=bot_profile.successful_snipes,
            success_rate=bot_profile.success_rate,
            total_volume_usd=bot_profile.total_volume_usd,
            tokens_sniped=bot_profile.tokens_sniped[:20],
            recent_snipes=formatted_snipes,
            classification=classification,
            message=f"Bot confidence: {bot_profile.bot_confidence_score:.0f}/100 - {classification}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting sniping bot: {str(e)}")


# 5. Liquidity Manipulation Detection
@app.get("/api/v1/liquidity-manipulation", response_model=LiquidityManipulationResponse)
async def detect_liquidity_manipulation(
    pair_address: str = Query(..., description="Liquidity pair address", examples=["0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    num_transactions: int = Query(100, ge=10, le=500, description="Number of transactions to analyze")
):
    """
    Detect liquidity manipulation in trading pools.
    
    Example: `/api/v1/liquidity-manipulation?pair_address=0xa43fe16908251ee70ef74718545e4fe6c5ccec9f&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = LiquidityPoolManipulationDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain.value
        )
        
        manipulations = detector.analyze(num_transactions=num_transactions)
        
        # Format manipulations
        formatted_manipulations = []
        for manip in manipulations:
            formatted_manipulations.append({
                "type": manip.manipulation_type,
                "severity": manip.severity,
                "severity_explanation": {
                    "HIGH": "Critical risk - Large scale manipulation potentially affecting pool stability",
                    "MEDIUM": "Moderate risk - Suspicious activity requiring monitoring",
                    "LOW": "Minor risk - Unusual but not necessarily malicious activity"
                }[manip.severity],
                "timestamp": manip.timestamp,
                "block_number": manip.block_number,
                "involved_wallets": manip.involved_wallets,
                "total_value_usd": manip.total_value_usd,
                "description": manip.description,
                "risk_score": manip.risk_score
            })
        
        if len(manipulations) == 0:
            message = "No liquidity manipulation events detected - pool shows normal trading patterns"
        else:
            message = f"Detected {len(manipulations)} manipulation event(s) - Suspicious rapid liquidity additions/removals detected. These events may indicate attempts to artificially influence price movement through liquidity changes."
        
        pool_info = detector.pool_info
        
        return LiquidityManipulationResponse(
            pair_address=pair_address,
            chain=chain.value,
            pool_label=pool_info.pair_label if pool_info else "Unknown",
            exchange_name=pool_info.exchange_name if pool_info else "Unknown",
            total_transactions=num_transactions,
            manipulations_detected=len(manipulations),
            manipulations=formatted_manipulations,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting liquidity manipulation: {str(e)}")


# 6. Concentrated Liquidity Attack Detection
@app.get("/api/v1/concentrated-attack", response_model=ConcentratedAttackResponse)
async def detect_concentrated_attack(
    pair_address: str = Query(..., description="Liquidity pair address", examples=["0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    num_transactions: int = Query(100, ge=10, le=500, description="Number of transactions to analyze")
):
    """
    Detect concentrated liquidity attacks and price manipulation.
    
    Example: `/api/v1/concentrated-attack?pair_address=0xa43fe16908251ee70ef74718545e4fe6c5ccec9f&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = ConcentratedLiquidityAttackDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain.value
        )
        
        attacks = detector.analyze(num_transactions=num_transactions)
        
        # Format attacks
        formatted_attacks = []
        for attack in attacks:
            formatted_attacks.append({
                "attacker_address": attack.attacker_address,
                "attack_type": attack.attack_type,
                "timestamp": attack.timestamp,
                "block_number": attack.block_number,
                "transactions_count": len(attack.transactions_involved),
                "price_impact": attack.price_impact,
                "profit_estimate": attack.profit_estimate,
                "attack_confidence": attack.attack_confidence
            })
        
        message = "No concentrated attacks detected" if len(attacks) == 0 else f"Detected {len(attacks)} potential attack(s)"
        
        # Get pool info from first analysis
        data = detector.fetch_pair_swaps(limit=10)
        pool_info, _ = detector._parse_pool_data(data)
        
        return ConcentratedAttackResponse(
            pair_address=pair_address,
            chain=chain.value,
            pool_label=pool_info.pair_label,
            exchange_name=pool_info.exchange_name,
            total_transactions=num_transactions,
            attacks_detected=len(attacks),
            attacks=formatted_attacks,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting concentrated attacks: {str(e)}")


# 7. Pool Domination Detection
@app.get("/api/v1/pool-domination", response_model=PoolDominationResponse)
async def detect_pool_domination(
    pair_address: str = Query(..., description="Liquidity pair address", examples=["0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"]),
    chain: ChainEnum = Query(ChainEnum.ethereum, description="Blockchain network"),
    num_transactions: int = Query(100, ge=10, le=500, description="Number of transactions to analyze")
):
    """
    Detect pool domination by single entities.
    
    Example: `/api/v1/pool-domination?pair_address=0xa43fe16908251ee70ef74718545e4fe6c5ccec9f&chain=eth`
    """
    if not MORALIS_API_KEY:
        raise HTTPException(status_code=503, detail="Moralis API key not configured")
    
    try:
        detector = PoolDominationDetector(
            api_key=MORALIS_API_KEY,
            pair_address=pair_address,
            chain=chain.value
        )
        
        dominations = detector.analyze(num_transactions=num_transactions)
        
        # Format dominations
        formatted_dominations = []
        for dom in dominations:
            formatted_dominations.append({
                "dominant_wallet": dom.dominant_wallet,
                "domination_percentage": dom.domination_percentage,
                "wallet_transactions": dom.wallet_transactions,
                "total_transactions": dom.total_transactions,
                "wallet_volume_usd": dom.wallet_volume_usd,
                "total_volume_usd": dom.total_volume_usd,
                "transaction_pattern": dom.transaction_pattern,
                "risk_level": dom.risk_level,
                "risk_explanation": {
                    "HIGH": "Single entity controls dangerous amount of pool liquidity",
                    "MEDIUM": "Significant concentration of trading power",
                    "LOW": "Minor concentration within acceptable limits"
                }[dom.risk_level],
                "manipulation_likelihood": dom.manipulation_likelihood
            })
        
        if len(dominations) == 0:
            message = "No pool domination detected - Liquidity provider distribution is healthy with no single entity controlling a significant portion"
        else:
            dominant_volume = sum(dom.wallet_volume_usd for dom in dominations)
            total_volume = dominations[0].total_volume_usd if dominations else 0
            volume_percentage = (dominant_volume / total_volume * 100) if total_volume > 0 else 0
            message = f"Detected {len(dominations)} dominant entity(ies) controlling approximately {volume_percentage:.1f}% of pool volume. High concentration of trading power may indicate market manipulation risk."
        
        # Get pool info
        data = detector.fetch_pair_swaps(limit=10)
        pool_info, _ = detector._parse_pool_data(data)
        
        return PoolDominationResponse(
            pair_address=pair_address,
            chain=chain.value,
            pool_label=pool_info.pair_label,
            exchange_name=pool_info.exchange_name,
            total_transactions=num_transactions,
            dominant_entities=len(dominations),
            dominations=formatted_dominations,
            message=message
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting pool domination: {str(e)}")


# 8. Threat Assessment (Token Security)
@app.get("/api/v1/threat-assessment", response_model=ThreatAssessmentResponse)
async def assess_token_threat(
    address: str = Query(..., description="Token contract address", examples=["0xdAC17F958D2ee523a2206206994597C13D831ec7"])
):
    """
    Comprehensive token security and threat assessment using Webacy API.
    
    Example: `/api/v1/threat-assessment?address=0xdAC17F958D2ee523a2206206994597C13D831ec7`
    """
    if not WEBACY_API_KEY:
        raise HTTPException(status_code=503, detail="Webacy API key not configured")
    
    try:
        # Fetch risk data from Webacy
        webacy_response = fetch_risk_data(address, WEBACY_API_KEY)
        
        if not webacy_response:
            raise HTTPException(status_code=404, detail="No threat data available for this address")
        
        # Convert NumPy types in response
        webacy_response = convert_numpy_types(webacy_response)
        
        # Build risk engine
        engine, modules = build_engine_from_webacy(webacy_response)
        overall_score, overall_label = engine.overall_risk()
        
        # Extract token metadata
        details = webacy_response.get("details", {})
        token_meta = details.get("token_metadata_risk", {}) or {}
        market = details.get("marketData", {}) or {}
        
        token_symbol = (
            token_meta.get("symbol") or
            market.get("symbol") or
            details.get("token_risk", {}).get("symbol") or
            "N/A"
        )
        
        token_name = (
            token_meta.get("name") or
            market.get("name") or
            details.get("token_risk", {}).get("name") or
            "Unknown Token"
        )
        
        market_cap = market.get("market_cap", "N/A")
        current_price = market.get("current_price", "N/A")
        
        # Format risk modules
        risk_modules = {}
        for name, module in modules.items():
            risk_modules[name] = {
                "score": float(module.score()),
                "label": str(engine.label(module.score())),
                "explanation": str(module.explain())
            }
        
        # Top risk contributors
        top_risks = sorted(
            [{"module": str(name), "score": float(module.score())} for name, module in modules.items()],
            key=lambda x: x['score'],
            reverse=True
        )[:3]
        
        return ThreatAssessmentResponse(
            address=str(address),
            token_name=str(token_name),
            token_symbol=str(token_symbol),
            market_cap=market_cap,
            current_price=current_price,
            overall_risk_score=float(overall_score),
            overall_risk_level=str(overall_label),
            risk_modules=risk_modules,
            top_risk_contributors=top_risks,
            message=f"Threat assessment completed - Overall Risk: {overall_label}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error assessing token threat: {str(e)}")


# Run the application
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))  # Use Railway's PORT env var
    print("\n🚀 Starting ChainWatch Anomaly Detection API...")
    print(f"📡 Server will be available at: http://0.0.0.0:{port}")
    print(f"📚 API Documentation: http://0.0.0.0:{port}/docs")
    print(f"📖 ReDoc Documentation: http://0.0.0.0:{port}/redoc\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,  # Use the port from environment variable
        reload=False
    )