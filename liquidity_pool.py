import requests
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict, Counter
from datetime import datetime
from dotenv import load_dotenv


@dataclass
class PoolSwap:
    """Represents a swap transaction in a liquidity pool"""
    transaction_hash: str
    transaction_index: int
    transaction_type: str
    block_number: int
    block_timestamp: str
    wallet_address: str
    sub_category: str
    base_token_amount: float
    quote_token_amount: float
    base_token_price_usd: float
    quote_token_price_usd: float
    base_quote_price: float
    total_value_usd: float


@dataclass
class PoolInfo:
    """Information about the liquidity pool"""
    pair_address: str
    pair_label: str
    exchange_name: str
    exchange_address: str
    base_token: Dict
    quote_token: Dict


@dataclass
class LiquidityManipulation:
    """Detected liquidity manipulation event"""
    manipulation_type: str
    severity: str
    timestamp: str
    block_number: int
    involved_wallets: List[str]
    total_value_usd: float
    description: str
    evidence_transactions: List[PoolSwap]
    risk_score: float


@dataclass
class ConcentratedAttack:
    """Detected concentrated liquidity attack"""
    attacker_address: str
    attack_type: str
    block_number: int
    timestamp: str
    transactions_involved: List[PoolSwap]
    price_impact: float
    profit_estimate: float
    attack_confidence: float


@dataclass
class PoolDomination:
    """Pool domination analysis result"""
    dominant_wallet: str
    domination_percentage: float
    total_transactions: int
    wallet_transactions: int
    total_volume_usd: float
    wallet_volume_usd: float
    transaction_pattern: str
    risk_level: str
    manipulation_likelihood: float


class LiquidityPoolManipulationDetector:
    """Detects liquidity manipulation in trading pools"""
    
    def __init__(self, api_key: str, pair_address: str, chain: str = "eth"):
        self.api_key = api_key
        self.pair_address = pair_address
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
        self.pool_info = None
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_pair_swaps(self, limit: int = 100) -> Dict:
        """Fetches swap transactions for the pair"""
        url = f"{self.base_url}/pairs/{self.pair_address}/swaps"
        params = {
            "chain": self.chain,
            "limit": limit,
            "order": "DESC"
        }
        
        response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def _parse_pool_data(self, data: Dict) -> Tuple[PoolInfo, List[PoolSwap]]:
        """Parses pool data and swap transactions"""
        # Extract pool info
        pool_info = PoolInfo(
            pair_address=data['pairAddress'],
            pair_label=data['pairLabel'],
            exchange_name=data['exchangeName'],
            exchange_address=data['exchangeAddress'],
            base_token=data['baseToken'],
            quote_token=data['quoteToken']
        )
        
        # Parse swaps
        swaps = []
        for swap_data in data['result']:
            swap = PoolSwap(
                transaction_hash=swap_data['transactionHash'],
                transaction_index=swap_data['transactionIndex'],
                transaction_type=swap_data['transactionType'],
                block_number=swap_data['blockNumber'],
                block_timestamp=swap_data['blockTimestamp'],
                wallet_address=swap_data['walletAddress'].lower(),
                sub_category=swap_data['subCategory'],
                base_token_amount=float(swap_data['baseTokenAmount']),
                quote_token_amount=abs(float(swap_data['quoteTokenAmount'])),
                base_token_price_usd=float(swap_data['baseTokenPriceUsd']),
                quote_token_price_usd=float(swap_data['quoteTokenPriceUsd']),
                base_quote_price=float(swap_data['baseQuotePrice']),
                total_value_usd=float(swap_data['totalValueUsd'])
            )
            swaps.append(swap)
        
        return pool_info, swaps
    
    def _detect_rug_pull_pattern(self, swaps: List[PoolSwap]) -> List[LiquidityManipulation]:
        """Detects potential rug pull patterns (sustained selling)"""
        manipulations = []
        
        # Group by wallet
        wallet_activity = defaultdict(list)
        for swap in swaps:
            wallet_activity[swap.wallet_address].append(swap)
        
        # Look for wallets with large sustained selling
        for wallet, txs in wallet_activity.items():
            sells = [tx for tx in txs if tx.transaction_type == 'sell']
            
            if len(sells) >= 3:  # Multiple sells
                total_sell_value = sum(tx.total_value_usd for tx in sells)
                
                if total_sell_value > 10000:  # Large value
                    # Check if all recent activity is selling
                    recent_txs = sorted(txs, key=lambda x: x.block_number, reverse=True)[:5]
                    sell_ratio = sum(1 for tx in recent_txs if tx.transaction_type == 'sell') / len(recent_txs)
                    
                    if sell_ratio > 0.7:  # 70%+ selling
                        risk_score = min(100, (total_sell_value / 1000) + (sell_ratio * 50))
                        
                        manipulation = LiquidityManipulation(
                            manipulation_type="Potential Rug Pull",
                            severity="HIGH" if total_sell_value > 50000 else "MEDIUM",
                            timestamp=sells[0].block_timestamp,
                            block_number=sells[0].block_number,
                            involved_wallets=[wallet],
                            total_value_usd=total_sell_value,
                            description=f"Wallet dumping large amounts: ${total_sell_value:.2f} across {len(sells)} transactions",
                            evidence_transactions=sells[:5],
                            risk_score=risk_score
                        )
                        manipulations.append(manipulation)
        
        return manipulations
    
    def _detect_coordinated_dump(self, swaps: List[PoolSwap]) -> List[LiquidityManipulation]:
        """Detects coordinated selling by multiple wallets"""
        manipulations = []
        
        # Group by block
        blocks = defaultdict(list)
        for swap in swaps:
            blocks[swap.block_number].append(swap)
        
        # Look for blocks with multiple large sells
        for block_num, block_swaps in blocks.items():
            sells = [tx for tx in block_swaps if tx.transaction_type == 'sell']
            
            if len(sells) >= 3:  # Multiple sellers in same block
                unique_wallets = len(set(tx.wallet_address for tx in sells))
                total_value = sum(tx.total_value_usd for tx in sells)
                
                if unique_wallets >= 3 and total_value > 5000:
                    risk_score = min(100, (unique_wallets * 15) + (total_value / 500))
                    
                    manipulation = LiquidityManipulation(
                        manipulation_type="Coordinated Dump",
                        severity="HIGH" if total_value > 20000 else "MEDIUM",
                        timestamp=sells[0].block_timestamp,
                        block_number=block_num,
                        involved_wallets=list(set(tx.wallet_address for tx in sells)),
                        total_value_usd=total_value,
                        description=f"{unique_wallets} wallets coordinated selling ${total_value:.2f} in same block",
                        evidence_transactions=sells,
                        risk_score=risk_score
                    )
                    manipulations.append(manipulation)
        
        return manipulations
    
    def analyze(self, num_transactions: int = 100) -> List[LiquidityManipulation]:
        """Analyzes pool for liquidity manipulation"""
        print(f"\n💧 Analyzing Liquidity Pool Manipulation")
        print("="*80)
        print(f"Pair: {self.pair_address}")
        
        # Fetch data
        data = self.fetch_pair_swaps(limit=num_transactions)
        self.pool_info, swaps = self._parse_pool_data(data)
        
        print(f"Pool: {self.pool_info.pair_label}")
        print(f"Exchange: {self.pool_info.exchange_name}")
        print(f"Transactions analyzed: {len(swaps)}")
        
        # Run detection algorithms
        manipulations = []
        manipulations.extend(self._detect_rug_pull_pattern(swaps))
        manipulations.extend(self._detect_coordinated_dump(swaps))
        
        # Sort by risk score
        manipulations.sort(key=lambda x: x.risk_score, reverse=True)
        
        return manipulations
    
    def print_report(self, manipulations: List[LiquidityManipulation]):
        """Prints manipulation detection report"""
        if not manipulations:
            print("\n✅ No liquidity manipulation detected")
            return
        
        print(f"\n🚨 DETECTED {len(manipulations)} MANIPULATION EVENTS")
        print("="*80)
        
        for i, event in enumerate(manipulations, 1):
            print(f"\n{'='*80}")
            print(f"MANIPULATION #{i} - {event.manipulation_type}")
            print(f"Risk Score: {event.risk_score:.0f}/100 | Severity: {event.severity}")
            print(f"{'='*80}")
            print(f"Time: {event.timestamp}")
            print(f"Block: {event.block_number}")
            print(f"Total Value: ${event.total_value_usd:.2f}")
            print(f"Involved Wallets: {len(event.involved_wallets)}")
            print(f"\nDescription: {event.description}")
            print(f"\nWallets:")
            for wallet in event.involved_wallets[:5]:
                print(f"  • {wallet}")
            print(f"\nEvidence Transactions:")
            for tx in event.evidence_transactions[:3]:
                print(f"  • {tx.transaction_hash} - {tx.transaction_type.upper()} ${tx.total_value_usd:.2f}")


class ConcentratedLiquidityAttackDetector:
    """Detects concentrated liquidity attacks and price manipulation"""
    
    def __init__(self, api_key: str, pair_address: str, chain: str = "eth"):
        self.api_key = api_key
        self.pair_address = pair_address
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_pair_swaps(self, limit: int = 100) -> Dict:
        """Fetches swap transactions for the pair"""
        url = f"{self.base_url}/pairs/{self.pair_address}/swaps"
        params = {
            "chain": self.chain,
            "limit": limit,
            "order": "DESC"
        }
        
        response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def _parse_pool_data(self, data: Dict) -> Tuple[PoolInfo, List[PoolSwap]]:
        """Parses pool data and swap transactions"""
        pool_info = PoolInfo(
            pair_address=data['pairAddress'],
            pair_label=data['pairLabel'],
            exchange_name=data['exchangeName'],
            exchange_address=data['exchangeAddress'],
            base_token=data['baseToken'],
            quote_token=data['quoteToken']
        )
        
        swaps = []
        for swap_data in data['result']:
            swap = PoolSwap(
                transaction_hash=swap_data['transactionHash'],
                transaction_index=swap_data['transactionIndex'],
                transaction_type=swap_data['transactionType'],
                block_number=swap_data['blockNumber'],
                block_timestamp=swap_data['blockTimestamp'],
                wallet_address=swap_data['walletAddress'].lower(),
                sub_category=swap_data['subCategory'],
                base_token_amount=float(swap_data['baseTokenAmount']),
                quote_token_amount=abs(float(swap_data['quoteTokenAmount'])),
                base_token_price_usd=float(swap_data['baseTokenPriceUsd']),
                quote_token_price_usd=float(swap_data['quoteTokenPriceUsd']),
                base_quote_price=float(swap_data['baseQuotePrice']),
                total_value_usd=float(swap_data['totalValueUsd'])
            )
            swaps.append(swap)
        
        return pool_info, swaps
    
    def _detect_price_manipulation(self, swaps: List[PoolSwap]) -> List[ConcentratedAttack]:
        """Detects large trades that significantly move the price"""
        attacks = []
        
        # Calculate price changes between consecutive transactions
        for i in range(len(swaps) - 1):
            current = swaps[i]
            next_tx = swaps[i + 1]
            
            # Calculate price impact
            price_change = abs((current.base_quote_price - next_tx.base_quote_price) / next_tx.base_quote_price) * 100
            
            # Large single transaction with high price impact
            if current.total_value_usd > 5000 and price_change > 5:
                confidence = min(100, (price_change * 10) + (current.total_value_usd / 1000))
                
                attack = ConcentratedAttack(
                    attacker_address=current.wallet_address,
                    attack_type="Price Manipulation",
                    block_number=current.block_number,
                    timestamp=current.block_timestamp,
                    transactions_involved=[current],
                    price_impact=price_change,
                    profit_estimate=0,  # Would need exit transaction to calculate
                    attack_confidence=confidence
                )
                attacks.append(attack)
        
        return attacks
    
    def _detect_liquidity_sniping(self, swaps: List[PoolSwap]) -> List[ConcentratedAttack]:
        """Detects liquidity sniping attacks (buying at specific price points)"""
        attacks = []
        
        # Group by wallet
        wallet_txs = defaultdict(list)
        for swap in swaps:
            wallet_txs[swap.wallet_address].append(swap)
        
        # Look for wallets with multiple buys at similar price points
        for wallet, txs in wallet_txs.items():
            buys = [tx for tx in txs if tx.transaction_type == 'buy']
            
            if len(buys) >= 3:
                # Check if prices are concentrated
                prices = [tx.base_quote_price for tx in buys]
                avg_price = sum(prices) / len(prices)
                price_variance = sum((p - avg_price) ** 2 for p in prices) / len(prices)
                
                # Low variance means concentrated buying
                if price_variance < (avg_price * 0.1) ** 2:  # Within 10% variance
                    total_value = sum(tx.total_value_usd for tx in buys)
                    
                    if total_value > 3000:
                        confidence = min(100, 50 + (len(buys) * 10))
                        
                        attack = ConcentratedAttack(
                            attacker_address=wallet,
                            attack_type="Liquidity Sniping",
                            block_number=buys[0].block_number,
                            timestamp=buys[0].block_timestamp,
                            transactions_involved=buys,
                            price_impact=0,
                            profit_estimate=0,
                            attack_confidence=confidence
                        )
                        attacks.append(attack)
        
        return attacks
    
    def analyze(self, num_transactions: int = 100) -> List[ConcentratedAttack]:
        """Analyzes pool for concentrated liquidity attacks"""
        print(f"\n🎯 Analyzing Concentrated Liquidity Attacks")
        print("="*80)
        print(f"Pair: {self.pair_address}")
        
        # Fetch data
        data = self.fetch_pair_swaps(limit=num_transactions)
        pool_info, swaps = self._parse_pool_data(data)
        
        print(f"Pool: {pool_info.pair_label}")
        print(f"Exchange: {pool_info.exchange_name}")
        print(f"Transactions analyzed: {len(swaps)}")
        
        # Run detection algorithms
        attacks = []
        attacks.extend(self._detect_price_manipulation(swaps))
        attacks.extend(self._detect_liquidity_sniping(swaps))
        
        # Sort by confidence
        attacks.sort(key=lambda x: x.attack_confidence, reverse=True)
        
        return attacks
    
    def print_report(self, attacks: List[ConcentratedAttack]):
        """Prints attack detection report"""
        if not attacks:
            print("\n✅ No concentrated liquidity attacks detected")
            return
        
        print(f"\n⚠️ DETECTED {len(attacks)} POTENTIAL ATTACKS")
        print("="*80)
        
        for i, attack in enumerate(attacks, 1):
            print(f"\n{'='*80}")
            print(f"ATTACK #{i} - {attack.attack_type}")
            print(f"Confidence: {attack.attack_confidence:.0f}/100")
            print(f"{'='*80}")
            print(f"Attacker: {attack.attacker_address}")
            print(f"Time: {attack.timestamp}")
            print(f"Block: {attack.block_number}")
            print(f"Transactions: {len(attack.transactions_involved)}")
            
            if attack.price_impact > 0:
                print(f"Price Impact: {attack.price_impact:.2f}%")
            
            print(f"\nTransaction Details:")
            for tx in attack.transactions_involved[:3]:
                print(f"  • {tx.transaction_hash}")
                print(f"    Type: {tx.transaction_type.upper()} | Value: ${tx.total_value_usd:.2f}")


class PoolDominationDetector:
    """Detects pool domination by single entities"""
    
    def __init__(self, api_key: str, pair_address: str, chain: str = "eth"):
        self.api_key = api_key
        self.pair_address = pair_address
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_pair_swaps(self, limit: int = 100) -> Dict:
        """Fetches swap transactions for the pair"""
        url = f"{self.base_url}/pairs/{self.pair_address}/swaps"
        params = {
            "chain": self.chain,
            "limit": limit,
            "order": "DESC"
        }
        
        response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def _parse_pool_data(self, data: Dict) -> Tuple[PoolInfo, List[PoolSwap]]:
        """Parses pool data and swap transactions"""
        pool_info = PoolInfo(
            pair_address=data['pairAddress'],
            pair_label=data['pairLabel'],
            exchange_name=data['exchangeName'],
            exchange_address=data['exchangeAddress'],
            base_token=data['baseToken'],
            quote_token=data['quoteToken']
        )
        
        swaps = []
        for swap_data in data['result']:
            swap = PoolSwap(
                transaction_hash=swap_data['transactionHash'],
                transaction_index=swap_data['transactionIndex'],
                transaction_type=swap_data['transactionType'],
                block_number=swap_data['blockNumber'],
                block_timestamp=swap_data['blockTimestamp'],
                wallet_address=swap_data['walletAddress'].lower(),
                sub_category=swap_data['subCategory'],
                base_token_amount=float(swap_data['baseTokenAmount']),
                quote_token_amount=abs(float(swap_data['quoteTokenAmount'])),
                base_token_price_usd=float(swap_data['baseTokenPriceUsd']),
                quote_token_price_usd=float(swap_data['quoteTokenPriceUsd']),
                base_quote_price=float(swap_data['baseQuotePrice']),
                total_value_usd=float(swap_data['totalValueUsd'])
            )
            swaps.append(swap)
        
        return pool_info, swaps
    
    def analyze(self, num_transactions: int = 100) -> List[PoolDomination]:
        """Analyzes pool for domination by single entities"""
        print(f"\n👑 Analyzing Pool Domination")
        print("="*80)
        print(f"Pair: {self.pair_address}")
        
        # Fetch data
        data = self.fetch_pair_swaps(limit=num_transactions)
        pool_info, swaps = self._parse_pool_data(data)
        
        print(f"Pool: {pool_info.pair_label}")
        print(f"Exchange: {pool_info.exchange_name}")
        print(f"Transactions analyzed: {len(swaps)}")
        
        # Calculate wallet statistics
        wallet_stats = defaultdict(lambda: {'txs': 0, 'volume': 0, 'buys': 0, 'sells': 0})
        total_volume = 0
        
        for swap in swaps:
            wallet_stats[swap.wallet_address]['txs'] += 1
            wallet_stats[swap.wallet_address]['volume'] += swap.total_value_usd
            total_volume += swap.total_value_usd
            
            if swap.transaction_type == 'buy':
                wallet_stats[swap.wallet_address]['buys'] += 1
            else:
                wallet_stats[swap.wallet_address]['sells'] += 1
        
        # Find dominant wallets
        dominations = []
        
        for wallet, stats in wallet_stats.items():
            tx_percentage = (stats['txs'] / len(swaps)) * 100
            volume_percentage = (stats['volume'] / total_volume) * 100 if total_volume > 0 else 0
            
            # Check for domination
            if tx_percentage > 20 or volume_percentage > 30:
                # Determine pattern
                buy_ratio = stats['buys'] / stats['txs'] if stats['txs'] > 0 else 0
                
                if buy_ratio > 0.8:
                    pattern = "Accumulation (Heavy Buying)"
                elif buy_ratio < 0.2:
                    pattern = "Distribution (Heavy Selling)"
                else:
                    pattern = "Mixed Trading"
                
                # Calculate risk
                domination_score = max(tx_percentage, volume_percentage)
                
                if domination_score > 50:
                    risk_level = "CRITICAL"
                    manipulation_likelihood = 80
                elif domination_score > 35:
                    risk_level = "HIGH"
                    manipulation_likelihood = 60
                else:
                    risk_level = "MEDIUM"
                    manipulation_likelihood = 40
                
                domination = PoolDomination(
                    dominant_wallet=wallet,
                    domination_percentage=domination_score,
                    total_transactions=len(swaps),
                    wallet_transactions=stats['txs'],
                    total_volume_usd=total_volume,
                    wallet_volume_usd=stats['volume'],
                    transaction_pattern=pattern,
                    risk_level=risk_level,
                    manipulation_likelihood=manipulation_likelihood
                )
                dominations.append(domination)
        
        # Sort by domination percentage
        dominations.sort(key=lambda x: x.domination_percentage, reverse=True)
        
        return dominations
    
    def print_report(self, dominations: List[PoolDomination]):
        """Prints pool domination report"""
        if not dominations:
            print("\n✅ No pool domination detected - healthy distribution")
            return
        
        print(f"\n⚠️ DETECTED {len(dominations)} DOMINANT ENTITIES")
        print("="*80)
        
        for i, dom in enumerate(dominations, 1):
            print(f"\n{'='*80}")
            print(f"DOMINANT WALLET #{i}")
            print(f"Risk Level: {dom.risk_level} | Manipulation Likelihood: {dom.manipulation_likelihood}%")
            print(f"{'='*80}")
            print(f"Wallet: {dom.dominant_wallet}")
            print(f"\n📊 Domination Metrics:")
            print(f"  Domination Score: {dom.domination_percentage:.1f}%")
            print(f"  Transactions: {dom.wallet_transactions}/{dom.total_transactions} ({(dom.wallet_transactions/dom.total_transactions)*100:.1f}%)")
            print(f"  Volume: ${dom.wallet_volume_usd:.2f}/${dom.total_volume_usd:.2f} ({(dom.wallet_volume_usd/dom.total_volume_usd)*100:.1f}%)")
            print(f"\n🔍 Trading Pattern: {dom.transaction_pattern}")
            
            if dom.risk_level == "CRITICAL":
                print(f"\n🚨 WARNING: This wallet controls a CRITICAL portion of pool activity!")
            elif dom.risk_level == "HIGH":
                print(f"\n⚠️ CAUTION: This wallet has HIGH influence over the pool")


# Main execution
if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    moralis_key = os.getenv("MORALIS_KEY")
    
    if not moralis_key:
        raise ValueError("Please set the MORALIS_KEY environment variable")
    
    print("✅ Moralis API key loaded successfully\n")
    
    # Example pair address (PEPE/WETH Uniswap V2)
    PAIR_ADDRESS = "0xa43fe16908251ee70ef74718545e4fe6c5ccec9f"
    NUM_TRANSACTIONS = 100
    
    print("="*80)
    print("LIQUIDITY POOL ANALYSIS")
    print("="*80)
    
    # 1. Liquidity Manipulation Detection
    print("\n" + "="*80)
    print("LIQUIDITY MANIPULATION DETECTION")
    print("="*80)
    
    manipulation_detector = LiquidityPoolManipulationDetector(
        api_key=moralis_key,
        pair_address=PAIR_ADDRESS,
        chain="eth"
    )
    manipulations = manipulation_detector.analyze(num_transactions=NUM_TRANSACTIONS)
    manipulation_detector.print_report(manipulations)
    
    # 2. Concentrated Liquidity Attacks
    print("\n\n" + "="*80)
    print("CONCENTRATED LIQUIDITY ATTACK DETECTION")
    print("="*80)
    
    attack_detector = ConcentratedLiquidityAttackDetector(
        api_key=moralis_key,
        pair_address=PAIR_ADDRESS,
        chain="eth"
    )
    attacks = attack_detector.analyze(num_transactions=NUM_TRANSACTIONS)
    attack_detector.print_report(attacks)
    
    # 3. Pool Domination Detection
    print("\n\n" + "="*80)
    print("POOL DOMINATION DETECTION")
    print("="*80)
    
    domination_detector = PoolDominationDetector(
        api_key=moralis_key,
        pair_address=PAIR_ADDRESS,
        chain="eth"
    )
    dominations = domination_detector.analyze(num_transactions=NUM_TRANSACTIONS)
    domination_detector.print_report(dominations)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)