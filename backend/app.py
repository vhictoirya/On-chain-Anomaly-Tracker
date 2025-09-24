from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field, field_validator
import os
from dotenv import load_dotenv
import logging
from typing import Dict, Any, List
from contextlib import asynccontextmanager
from fastapi import Body

# --------------------------------------------------
# Logging setup
# --------------------------------------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --------------------------------------------------
# Load environment variables
# --------------------------------------------------
load_dotenv()

ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
GECKO_API = os.getenv("GECKO_API")
INFURA_URL = os.getenv("INFURA_URL")
WEBACY_API_KEY = os.getenv("WEBACY_API_KEY")

required_env_vars = {
    "ETHERSCAN_API_KEY": ETHERSCAN_API_KEY,
    "GECKO_API": GECKO_API,
    "INFURA_URL": INFURA_URL,
    "WEBACY_API_KEY": WEBACY_API_KEY,
}

missing_vars = [var for var, value in required_env_vars.items() if not value]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

# --------------------------------------------------
# Global services container
# --------------------------------------------------
services = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup and cleanup on shutdown"""
    try:
        from blockchain_anomaly_tracker import BlockchainAnomalyTracker
        from threat_risk_detector import fetch_risk_data, build_engine_from_webacy

        services["anomaly_tracker"] = BlockchainAnomalyTracker(ETHERSCAN_API_KEY, INFURA_URL, GECKO_API)
        services["fetch_risk_data"] = fetch_risk_data
        services["build_engine_from_webacy"] = build_engine_from_webacy

        logger.info("Services initialized successfully")
        yield
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    finally:
        logger.info("Shutting down services")

# --------------------------------------------------
# FastAPI app setup
# --------------------------------------------------
app = FastAPI(
    title="Blockchain Threat & Anomaly Detection APP",
    description="Analyze blockchain transactions and addresses for anomalies and risks",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [
    "http://localhost:3000",  # Next.js dev server
    "https://your-production-domain.com"  # Optional for prod
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Request Models
# --------------------------------------------------
class TxRequest(BaseModel):
    tx_hash: str = Field(
        ...,
        min_length=66,
        max_length=66,
        description="Ethereum transaction hash (0x...)",
        examples=["0x7154a8533d2b58da3d7a1caf788ffb8317129149aac9832ea2089bb716ac7a8f"],
    )

    @field_validator("tx_hash")
    def validate_tx_hash(cls, v: str) -> str:
        if not v.startswith("0x"):
            raise ValueError("Transaction hash must start with 0x")
        if not all(c in "0123456789abcdefABCDEF" for c in v[2:]):
            raise ValueError("Transaction hash contains invalid characters")
        return v.lower()


class AddressRequest(BaseModel):
    address: str = Field(
        ...,
        min_length=42,
        max_length=42,
        description="Ethereum address (0x...)",
        examples=["0xdAC17F958D2ee523a2206206994597C13D831ec7"],
    )
    
    @field_validator("address")
    def validate_address(cls, v: str) -> str:
        if not v.startswith("0x"):
            raise ValueError("Address must start with 0x")
        if not all(c in "0123456789abcdefABCDEF" for c in v[2:]):
            raise ValueError("Address contains invalid characters")
        return v   # keep original checksum case


# --------------------------------------------------
# Response Models
# --------------------------------------------------
class TransactionAnalysisResponse(BaseModel):
    analysis_type: str
    tx_hash: str
    transaction_details: Dict[str, Any]
    risk_flags: Dict[str, Any]
    verdict: str

class ModuleScore(BaseModel):
    score: float
    label: str
    explain: str

class AddressAnalysisResponse(BaseModel):
    address: str
    overall_score: float
    overall_risk: str
    module_scores: Dict[str, ModuleScore]

# --------------------------------------------------
# Endpoints
# --------------------------------------------------
@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "message": "Blockchain Threat & Anomaly Detection APP is running",
        "version": "1.0.0",
    }

@app.get("/health", tags=["Health"])
def detailed_health_check():
    return {
        "status": "healthy",
        "services": {
            "anomaly_tracker": "initialized" if "anomaly_tracker" in services else "not_initialized",
            "risk_detector": "initialized" if "fetch_risk_data" in services else "not_initialized",
        },
        "environment_variables": {
            "etherscan_api": "configured" if ETHERSCAN_API_KEY else "missing",
            "gecko_api": "configured" if GECKO_API else "missing",
            "infura_url": "configured" if INFURA_URL else "missing",
            "webacy_api": "configured" if WEBACY_API_KEY else "missing",
        },
    }


@app.get(
    "/analyze/transaction/{tx_hash}",
    tags=["Transaction Analysis"],
    status_code=status.HTTP_200_OK
)
def analyze_transaction(tx_hash: str, format: str = Query("json", enum=["json", "text"])):
    if "anomaly_tracker" not in services:
        raise HTTPException(status_code=503, detail="Anomaly tracker not initialized")

    try:
        logger.info(f"Analyzing transaction: {tx_hash}")
        result = services["anomaly_tracker"].analyze_single_transaction(tx_hash)

        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])

        if format == "text":
            tx = result.get("transaction_details", {})
            flags = result.get("risk_flags", {})

            lines = []
            lines.append("=" * 70)
            lines.append("Transaction Analysis Report")
            lines.append("-" * 70)
            lines.append(f"Tx Hash:   {tx_hash}")
            lines.append(f"From:      {tx.get('from')}")
            lines.append(f"To:        {tx.get('to')}")
            if "token" in tx:
                token = tx["token"]
                lines.append(
                    f"Token:     {token.get('name')} ({token.get('symbol')}), Decimals: {token.get('decimals')}"
                )
            lines.append(f"Value:     {tx.get('value')}")
            lines.append(f"Method:    {tx.get('method')}")
            lines.append(f"Type:      {tx.get('tx_type')}")
            lines.append(f"Gas Fee:   {tx.get('gas_fee_eth')}")
            lines.append("-" * 70)
            lines.append("Risk Flags:")
            for k, v in flags.items():
                lines.append(f"- {k}: {v}")
            lines.append("-" * 70)
            lines.append("Verdict:")
            lines.append(result.get("verdict", "No verdict available"))
            lines.append("=" * 70)

            return PlainTextResponse("\n".join(lines))

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get(
    "/analyze/address/{address}",
    tags=["Address Analysis"],
    response_model=AddressAnalysisResponse,
    status_code=status.HTTP_200_OK
)
def analyze_address(address: str, format: str = Query("json", enum=["json", "text"])):
    if "fetch_risk_data" not in services or "build_engine_from_webacy" not in services:
        raise HTTPException(status_code=503, detail="Risk detector not initialized")

    try:
        logger.info(f"Analyzing address: {address}")
        webacy_response = services["fetch_risk_data"](address, WEBACY_API_KEY)
        if not webacy_response:
            raise HTTPException(status_code=404, detail="No data available for this address")

        engine, modules = services["build_engine_from_webacy"](webacy_response)

        if format == "text":
            # Pretty CLI-style text report
            lines = []
            lines.append("=" * 70)
            lines.append(f"Risk Assessment Report for {address}")
            lines.append("-" * 70)
            overall_score = engine.overall_score()
            overall_label = engine.label(overall_score)
            lines.append(f"Overall Risk: {overall_score:.2f} → {overall_label}")
            lines.append("=" * 70)

            for name, module in modules.items():
                score = module.score()
                label = engine.label(score)
                lines.append(f"- {name:<15} | score: {score:6.2f} | label: {label}")
                lines.append(f"    ↳ {module.explain()}")

            return PlainTextResponse("\n".join(lines))

        # JSON response (default)
        return {
            "address": address,
            "overall_score": engine.overall_score(),
            "overall_risk": engine.label(engine.overall_score()),
            "module_scores": {
                name: {
                    "score": module.score(),
                    "label": engine.label(module.score()),
                    "explain": module.explain(),
                }
                for name, module in modules.items()
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during address analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------------------------------
# Run with Uvicorn
# --------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)