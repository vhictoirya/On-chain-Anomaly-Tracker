import os
import requests
from dotenv import load_dotenv
import sqlite3
import pandas as pd
import time
from typing import Dict, Any, List, Tuple

load_dotenv()

API_KEY = os.getenv('WEBACY_API_KEY') # Fetching the Etherscan API key from environment variables

if not API_KEY: 
    raise ValueError('Please set the WEBACY_API_KEY environment variable.')

print("WEBACY_API_KEY loadeed sucessfully")

# Base + Modules
# All risk modules (Governance, Liquidity, Fraud, etc.) inherit from this base.
# It maps a numeric score into "Low Risk", "Medium Risk", or "High Risk"

class BaseRisk:
    def label(self, score: float) -> str:
        if 0 <= score <= 23:
            return "Low Risk"
        elif 23 < score <= 50:
            return "Medium Risk"
        elif 50 < score <= 100:
            return "High Risk"
        return "Unknown"

    def explain(self) -> str:
        return "No explanation available."

    def score(self) -> float:
        """Base score method - should be implemented by subclasses"""
        return 0.0


class GovernanceRisk(BaseRisk):
    def __init__(self, is_proxy: bool, access_control: bool, upgradeable_contract: bool):
        self.is_proxy = is_proxy
        self.access_control = access_control
        self.upgradeable_contract = upgradeable_contract
        self.weights = {"access_control": 0.5, "is_proxy": 0.4, "upgradeable_contract": 0.3}

    def score(self) -> float:
        score = (
            self.weights["access_control"] * int(self.access_control) +
            self.weights["is_proxy"] * int(self.is_proxy) +
            self.weights["upgradeable_contract"] * int(self.upgradeable_contract)
        )
        return round(score / sum(self.weights.values()) * 100, 2)
        # sum(self.weights.values()) = 0.5 + 0.4 + 0.3 = 1.2, This adds up all the weights and returns the maximum possible score.
        # score / sum(self.weights.values() -> Divide the actual score (from multiplying bools × weights) by the maximum score
        # Multiply by 100 to turn the fraction into a percentage
        # Round to 2 decimal places


    def explain(self) -> str:
        reasons = []
        if self.access_control:
            reasons.append("Contract ownership is controlled (centralized access).")
        if self.is_proxy:
            reasons.append("Contract uses a proxy pattern (upgradeable).")
        if self.upgradeable_contract:
            reasons.append("Contract is upgradeable.")
        if not reasons:
            reasons.append("No major governance centralization risks found.")
        return " ".join(reasons)

# This class measures how risky a token’s liquidity situation is.
# If liquidity is not safe (unlocked or dominated by the creator), investors can lose money easily.
class LiquidityRisk(BaseRisk):
    def __init__(self, unlocked_liquidity: bool, lockedLiquidityPercent: float, creator_percent: float):
        self.unlocked_liquidity = unlocked_liquidity
        self.lockedLiquidityPercent = lockedLiquidityPercent
        # How much liquidity (%) is locked, the more locked, the safer.
        self.creator_percent = creator_percent
        # How much of the liquidity pool the creator controls, if the creator holds too much, it’s risky
        self.weights = {"unlocked_liquidity": 0.5, "lockedLiquidityPercent": 0.3, "creator_percent": 0.2}

    def score(self) -> float:
        unlocked_score = 100 if self.unlocked_liquidity else 0
        #If liquidity is unlocked → score = 100 (very risky), If locked → score = 0 (safe).
        locked_score = max(0.0, min(100.0, 100 - (self.lockedLiquidityPercent or 0)))
        # Calculated as 100 - lockedLiquidityPercent, that is if 80% is locked, risk = 100 - 80 = 20, More locked liquidity =
        creator_score = max(0.0, min(100.0, self.creator_percent or 0))
        #If creator controls X% of liquidity, that’s the risk, that is creator has 50% → risk = 50 or creator has 5% → risk = 5.
        score = (
            self.weights["unlocked_liquidity"] * unlocked_score +
            self.weights["lockedLiquidityPercent"] * locked_score +
            self.weights["creator_percent"] * creator_score
        )
        return round(score / sum(self.weights.values()), 2)
        # score =  (0.5*unlocked_score)+(0.3*locked_score)+(0.2*creator_score) / weight sum

    def explain(self) -> str:
        reasons = []
        if self.unlocked_liquidity:
            reasons.append("Liquidity is unlocked, posing exit risk.")
        reasons.append(f"{self.lockedLiquidityPercent:.1f}% of liquidity is locked.")
        reasons.append(f"Creator controls {self.creator_percent:.1f}% of liquidity pool.")
        return " ".join(reasons)


class HolderRisk(BaseRisk):
    def __init__(self, percentageHeldByTop10: float):
        self.percentageHeldByTop10 = percentageHeldByTop10 or 0.0

    def score(self) -> float:
        return round(max(0.0, min(100.0, self.percentageHeldByTop10)), 2)

    def explain(self) -> str:
        return f"Top 10 wallets hold {self.percentageHeldByTop10:.1f}% of total supply."


class TokenSecurityRisk(BaseRisk):
    def __init__(self, buy_tax_percentage: float, transfer_pausable: bool, is_blacklisted: bool, is_trusted: bool):
        self.buy_tax = buy_tax_percentage or 0.0 # How much tax (in %) is charged when buying the token
        self.transfer_pausable = transfer_pausable # Cheeks if the contract owner can freeze transfers
        self.is_blacklisted = is_blacklisted # Checks if the contract can blacklist 
        self.is_trusted = is_trusted # Checks if the token has been flagged as "trusted"
        self.weights = {"buy_tax": 0.4, "transfer_pausable": 0.2, "is_blacklisted": 0.3, "is_trusted": 0.1}

    def score(self) -> float:
        tax_score = max(0.0, min(100.0, self.buy_tax))
        # Directly equals the buy tax, but capped between 0 and 100, that is, if tax = 12%, risk = 12
        pausable_score = 100 if self.transfer_pausable else 0
        # If transfers can be paused → 100 (high risk), if not → 0
        blacklist_score = 100 if self.is_blacklisted else 0 # If blacklisting enabled → 100, if not → 0
        trusted_score = 0 if self.is_trusted else 100 # If trusted → 0 (no risk), if not trusted → 100 (risky)
        score = (
            self.weights["buy_tax"] * tax_score +
            self.weights["transfer_pausable"] * pausable_score +
            self.weights["is_blacklisted"] * blacklist_score +
            self.weights["is_trusted"] * trusted_score
        )
        return round(score / sum(self.weights.values()), 2)

    def explain(self) -> str:
        reasons = [f"Buy tax: {self.buy_tax:.1f}%."]
        if self.transfer_pausable:
            reasons.append("Token transfers can be paused.")
        if self.is_blacklisted:
            reasons.append("Token has blacklisting enabled.")
        if self.is_trusted:
            reasons.append("Token is flagged as trusted.")
        return " ".join(reasons)


class MarketRisk(BaseRisk):
    def __init__(self, volatility: float, ath_change: float, atl_change: float, marketCapRank: int):
        self.volatility = volatility or 0.0
        self.ath_change = ath_change or 0.0
        self.atl_change = atl_change or 0.0
        self.marketCapRank = marketCapRank or 1000
        self.weights = {"volatility": 0.4, "ath_change": 0.2, "atl_change": 0.2, "marketCapRank": 0.2}

    def score(self) -> float:
        vol_score = max(0.0, min(100.0, abs(self.volatility)))
        ath_score = max(0.0, min(100.0, abs(self.ath_change)))
        atl_score = max(0.0, min(100.0, abs(self.atl_change)))
        rank_score = max(0.0, min(100.0, (self.marketCapRank - 1) / 999 * 100))
        score = (
            self.weights["volatility"] * vol_score +
            self.weights["ath_change"] * ath_score +
            self.weights["atl_change"] * atl_score +
            self.weights["marketCapRank"] * rank_score
        )
        return round(score / sum(self.weights.values()), 2)

    def explain(self) -> str:
        return (f"7d volatility: {self.volatility:.1f}%. "
                f"ATH change: {self.ath_change:.1f}%. "
                f"ATL change: {self.atl_change:.1f}%. "
                f"Market cap rank: {self.marketCapRank}.")


class FraudRisk(BaseRisk):
    def __init__(self, hacker: bool, drainer: bool, mixers: bool, tornado: bool):
        self.hacker = hacker # Checks whether the entity is flagged as a hacker
        self.drainer = drainer # Checks whether the entity is linked to wallet drainers
        self.mixers = mixers # Checks whether the project was rugged (exit scam / liquidity pull)
        self.tornado = tornado

    def score(self) -> float:
        score = (
            100 * int(self.hacker) + # Each risk factor contributes either 100 points if present (True) or 0 points if absent (False)
            100 * int(self.drainer) +
            100 * int(self.mixers) +
            100 * int(self.tornado)
        )
        return round(score / 4, 2) # Then divide by 4 (the number of risk factors)

    def explain(self) -> str:
        reasons = []
        if self.hacker:
            reasons.append("Address is flagged as hacker.")
        if self.drainer:
            reasons.append("Linked to drainer activity.")
        if self.mixers:
            reasons.append("Mixer activity detected.")
        if self.tornado:
            reasons.append("Involvement with Tornado Cash.")
        if not reasons:
            reasons.append("No fraud indicators found.")
        return " ".join(reasons)


class RiskEngine(BaseRisk):
    def __init__(self, modules: Dict[str, BaseRisk]):
        self.modules = modules

    def overall_score(self) -> float:
        scores = [module.score() for module in self.modules.values()]
        return round(sum(scores) / len(scores), 2) if scores else 0.0

    def overall_risk(self) -> Tuple[float, str]:
        score = self.overall_score()
        return score, self.label(score)


# ======================
# Builder
# ======================
def build_engine_from_webacy(response: Dict[str, Any]) -> Tuple[RiskEngine, Dict[str, BaseRisk]]:
    issues_keys = set()
    for issue in response.get("issues", []):
        for tag in issue.get("tags", []):
            if "key" in tag:
                issues_keys.add(tag["key"])

    details = response.get("details", {})
    token_risk = details.get("token_risk", {}) or {}
    market = details.get("marketData", {}) or {}
    ownership = market.get("ownershipDistribution", {}) or {}

    modules = {
        "governance": GovernanceRisk(
            "is_proxy" in issues_keys,
            bool(token_risk.get("access_control")),
            "upgradeable_contract" in issues_keys
        ),
        "liquidity": LiquidityRisk(
            "unlocked-liquidity" in issues_keys,
            float(details.get("lockedLiquidityPercent") or 0),
            float(details.get("creator_percent") or 0)
        ),
        "holder": HolderRisk(
            float(ownership.get("percentageHeldByTop10") or 0)
        ),
        "token_security": TokenSecurityRisk(
            float(token_risk.get("buy_tax_percentage") or 0),
            "transfer_pausable" in issues_keys,
            "is_blacklisted" in issues_keys,
            bool(token_risk.get("is_trusted"))
        ),
        "market": MarketRisk(
            float(market.get("price_change_percentage_7d") or 0),
            float(market.get("ath_change_percentage") or 0),
            float(market.get("atl_change_percentage") or 0),
            int(market.get("market_cap_rank") or 9999)
        ),
        "fraud": FraudRisk(
            "hacker" in issues_keys,
            "drainer" in issues_keys,
            "mixers" in issues_keys,
            "tornado" in issues_keys
        ),
    }

    engine = RiskEngine(modules)
    return engine, modules


# ======================
# Reporter
# ======================
def print_report(address: str, response: dict, engine: RiskEngine, modules: Dict[str, BaseRisk]) -> None:
    print("=" * 70)
    print(f"Risk Assessment Report for {address}")
    print("-" * 70)

    # Drill into response safely
    details = response.get("details", {})
    token_meta = details.get("token_metadata_risk", {}) or {}
    market = details.get("marketData", {}) or {}

    # Robust name & symbol lookup across possible fields
    symbol = (
        token_meta.get("symbol") or
        market.get("symbol") or
        details.get("token_risk", {}).get("symbol") or
        details.get("token_info", {}).get("symbol") or
        response.get("symbol") or
        "N/A"
    )

    name = (
        token_meta.get("name") or
        market.get("name") or
        details.get("token_risk", {}).get("name") or
        details.get("token_info", {}).get("name") or
        response.get("name") or
        "Unknown Token"
    )

    # Market data
    market_cap = market.get("market_cap", "N/A")
    price = market.get("current_price", "N/A")

    print(f"Token: {name} ({symbol})")
    print(f"Market Cap: ${market_cap:,.0f}")
    print(f"Price: {price}")
    print("=" * 70)

    # Loop through modules
    for name, module in modules.items():
        score = module.score()
        label = engine.label(score)
        print(f"- {name:<15} | score: {score:6.2f} | label: {label}")
        print(f"    ↳ {module.explain()}")

    print("=" * 70)
    overall_score, overall_label = engine.overall_risk()
    print(f"Overall Risk: {overall_score:.2f} → {overall_label}")
    print("-" * 70)

    # Rank contributors
    top_risks = sorted(
        ((name, module.score()) for name, module in modules.items()),
        key=lambda x: x[1],
        reverse=True,
    )[:3]

    print("Top Risk Contributors:")
    for name, score in top_risks:
        print(f"• {name:<15} → {score:.2f}")
    print("=" * 70)



# ======================
# Real-Time Fetcher
# ======================
def fetch_risk_data(address: str, api_key: str) -> dict:
    api_url = f"https://api.webacy.com/addresses/{address}"
    headers = {
        "accept": "application/json",
        "x-api-key": api_key
    }

    try:
        resp = requests.get(api_url, headers=headers, timeout=(5, 10))
        print("DEBUG:", resp.status_code, resp.text)  # 👈 add this
        if resp.status_code == 200:
            return resp.json()
        else:
            return {}
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {}


def run_realtime_assessment(address: str, api_key: str):
    webacy_response = fetch_risk_data(address, api_key)
    if not webacy_response:
        print("No data available.")
        return
    
    engine, modules = build_engine_from_webacy(webacy_response)
    print_report(address, webacy_response, engine, modules)


def monitor_address(address: str, api_key: str, interval: int = 60):
    """ Continuously monitor an address for risk (every X seconds). """
    while True:
        print("\n\nRunning real-time risk check...")
        run_realtime_assessment(address, api_key)
        time.sleep(interval)
# ======================
# Example Run
# ======================
if __name__ == "__main__":
    # Get API key from environment variable
    API_KEY = os.getenv("WEBACY_API_KEY")
    
    if not API_KEY:
        print("Please set the WEBACY_API_KEY environment variable")

    
    address = "0xdAC17F958D2ee523a2206206994597C13D831ec7" 
    run_realtime_assessment(address, API_KEY)

    # Or keep monitoring:
    # monitor_address(test_address, API_KEY, interval=300)  # every 5 minutes