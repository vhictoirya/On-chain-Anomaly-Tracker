import os
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from collections import defaultdict
from typing import List, Dict, Tuple, Optional
from dotenv import load_dotenv
import time
import json


# ==================== API CLIENT ====================
class MoralisSwapDataFetcher:
    """
    Fetches ERC20 swap data from Moralis API with pagination and rate limiting.
    """
    
    def __init__(self, api_key: str):
        """
        Args:
            api_key: Moralis API key
        """
        self.api_key = api_key
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
        self.headers = {
            "Accept": "application/json",
            "X-API-Key": api_key
        }
        self.rate_limit_delay = 0.2  # 200ms between requests
    
    def fetch_token_swaps(self, 
                         token_address: str,
                         chain: str = "eth",
                         limit: int = 100,
                         max_pages: int = 10) -> List[Dict]:
        """
        Fetch swap transactions for a token with pagination.
        
        Args:
            token_address: ERC20 token contract address
            chain: Blockchain (eth, bsc, polygon, etc.)
            limit: Results per page (max 100)
            max_pages: Maximum pages to fetch
            
        Returns:
            List of swap transactions
        """
        all_transactions = []
        cursor = None
        page = 0
        
        url = f"{self.base_url}/erc20/{token_address}/swaps"
        
        while page < max_pages:
            params = {
                "chain": chain,
                "limit": min(limit, 100),  # API max is 100
                "order": "DESC"
            }
            
            if cursor:
                params["cursor"] = cursor
            
            try:
                print(f"Fetching page {page + 1}...")
                response = requests.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                if "result" in data and data["result"]:
                    all_transactions.extend(data["result"])
                    print(f"  Retrieved {len(data['result'])} transactions")
                    
                    # Check for next page
                    if "cursor" in data and data["cursor"]:
                        cursor = data["cursor"]
                        page += 1
                        time.sleep(self.rate_limit_delay)  # Rate limiting
                    else:
                        break  # No more pages
                else:
                    break  # No results
                    
            except requests.exceptions.RequestException as e:
                print(f"Error fetching data: {e}")
                break
        
        print(f"Total transactions fetched: {len(all_transactions)}")
        return all_transactions
    
    def fetch_multiple_tokens(self, 
                             token_addresses: List[str],
                             chain: str = "eth",
                             limit: int = 100) -> Dict[str, List[Dict]]:
        """
        Fetch swaps for multiple tokens.
        
        Returns:
            Dict mapping token addresses to their transactions
        """
        results = {}
        
        for token in token_addresses:
            print(f"\n=== Fetching data for token: {token} ===")
            results[token] = self.fetch_token_swaps(token, chain, limit)
            time.sleep(self.rate_limit_delay)
        
        return results


# ==================== ANOMALY DETECTORS ====================
class WashTradingDetector:
    """Detects wash trading patterns"""
    
    def __init__(self, 
                 time_window_minutes: int = 60,
                 min_round_trips: int = 3,
                 price_deviation_threshold: float = 0.02,
                 min_same_block_trades: int = 5,  # Increased from 2
                 min_volume_threshold: float = 1000.0):  # Min $1000 to flag
        self.time_window = timedelta(minutes=time_window_minutes)
        self.min_round_trips = min_round_trips
        self.price_threshold = price_deviation_threshold
        self.min_same_block = min_same_block_trades
        self.min_volume = min_volume_threshold
    
    def detect(self, transactions: List[Dict]) -> Dict:
        """Detect wash trading patterns."""
        if not transactions:
            return {'detected_count': 0, 'suspicious_wallets': {}, 'false_positive_note': ''}
        
        df = pd.DataFrame(transactions)
        df['blockTimestamp'] = pd.to_datetime(df['blockTimestamp'])
        df['baseQuotePrice'] = pd.to_numeric(df['baseQuotePrice'], errors='coerce')
        df = df.sort_values('blockTimestamp')
        
        suspicious_wallets = {}
        potential_mev_bots = []
        
        for wallet, group in df.groupby('walletAddress'):
            patterns = self._analyze_wallet_pattern(group)
            if patterns['is_suspicious']:
                # Filter out likely MEV bots (very small trades, high frequency)
                if patterns['is_likely_mev']:
                    potential_mev_bots.append(wallet)
                else:
                    suspicious_wallets[wallet] = patterns
        
        return {
            'detected_count': len(suspicious_wallets),
            'suspicious_wallets': suspicious_wallets,
            'total_suspicious_volume': sum(w['total_volume'] for w in suspicious_wallets.values()),
            'mev_bots_filtered': len(potential_mev_bots),
            'note': f"Filtered out {len(potential_mev_bots)} likely MEV/arbitrage bots"
        }
    
    def _analyze_wallet_pattern(self, wallet_txs: pd.DataFrame) -> Dict:
        """Analyze individual wallet trading patterns."""
        round_trips = []
        buys = wallet_txs[wallet_txs['transactionType'] == 'buy'].copy()
        sells = wallet_txs[wallet_txs['transactionType'] == 'sell'].copy()
        
        for _, buy in buys.iterrows():
            matching_sells = sells[
                (sells['blockTimestamp'] >= buy['blockTimestamp']) &
                (sells['blockTimestamp'] <= buy['blockTimestamp'] + self.time_window)
            ]
            
            for _, sell in matching_sells.iterrows():
                if pd.notna(buy['baseQuotePrice']) and pd.notna(sell['baseQuotePrice']):
                    price_diff = abs(buy['baseQuotePrice'] - sell['baseQuotePrice']) / buy['baseQuotePrice']
                    
                    if price_diff <= self.price_threshold:
                        round_trips.append({
                            'buy_time': buy['blockTimestamp'],
                            'sell_time': sell['blockTimestamp'],
                            'buy_value': buy['totalValueUsd'],
                            'sell_value': sell['totalValueUsd'],
                            'price_diff': price_diff,
                            'time_diff_seconds': (sell['blockTimestamp'] - buy['blockTimestamp']).total_seconds()
                        })
        
        same_block_trades = len(wallet_txs[wallet_txs.duplicated(subset=['blockNumber'], keep=False)])
        total_volume = wallet_txs['totalValueUsd'].sum()
        avg_trade_size = wallet_txs['totalValueUsd'].mean()
        
        # Check if likely MEV bot (small trades, same block activity)
        is_likely_mev = (
            same_block_trades >= 2 and 
            avg_trade_size < 100 and  # Small average trade size
            total_volume < 500  # Low total volume
        )
        
        # More stringent criteria for wash trading
        is_suspicious = (
            (len(round_trips) >= self.min_round_trips and total_volume >= self.min_volume) or
            (same_block_trades >= self.min_same_block and total_volume >= self.min_volume)
        )
        
        return {
            'is_suspicious': is_suspicious,
            'is_likely_mev': is_likely_mev,
            'round_trips': len(round_trips),
            'same_block_trades': same_block_trades,
            'total_volume': total_volume,
            'avg_trade_size': avg_trade_size,
            'num_trades': len(wallet_txs),
            'avg_round_trip_time': np.mean([rt['time_diff_seconds'] for rt in round_trips]) if round_trips else 0,
            'patterns': round_trips[:5]
        }


class PriceManipulationDetector:
    """Detects price manipulation patterns"""
    
    def __init__(self,
                 price_spike_threshold: float = 0.15,  # Increased from 0.10
                 volume_spike_multiplier: float = 10.0,  # Increased from 5.0
                 min_manipulation_value: float = 5000.0):  # Min $5000 to flag
        self.price_threshold = price_spike_threshold
        self.volume_multiplier = volume_spike_multiplier
        self.min_value = min_manipulation_value
    
    def detect(self, transactions: List[Dict]) -> Dict:
        """Detect price manipulation patterns."""
        if not transactions:
            return {'manipulation_events': [], 'coordinated_trading': [], 'total_events': 0}
        
        df = pd.DataFrame(transactions)
        df['blockTimestamp'] = pd.to_datetime(df['blockTimestamp'])
        df['baseQuotePrice'] = pd.to_numeric(df['baseQuotePrice'], errors='coerce')
        df = df.sort_values('blockNumber')
        
        manipulations = []
        
        df['price_change'] = df.groupby('pairAddress')['baseQuotePrice'].pct_change()
        df['volume_ma'] = df.groupby('pairAddress')['totalValueUsd'].transform(
            lambda x: x.rolling(window=20, min_periods=1).mean()  # Increased window
        )
        df['volume_spike'] = df['totalValueUsd'] / df['volume_ma']
        
        suspicious_idx = (
            (abs(df['price_change']) > self.price_threshold) &
            (df['volume_spike'] > self.volume_multiplier) &
            (df['totalValueUsd'] > self.min_value)  # Added value filter
        )
        
        for idx in df[suspicious_idx].index:
            row = df.loc[idx]
            manipulations.append({
                'timestamp': row['blockTimestamp'],
                'block': row['blockNumber'],
                'price_change': row['price_change'],
                'volume_spike': row['volume_spike'],
                'wallet': row['walletAddress'],
                'pair': row['pairLabel'],
                'value_usd': row['totalValueUsd']
            })
        
        coordinated = self._detect_coordinated_trading(df)
        
        return {
            'manipulation_events': manipulations,
            'coordinated_trading': coordinated,
            'total_events': len(manipulations) + len(coordinated),
            'highest_spike': max([abs(m['price_change']) for m in manipulations], default=0)
        }
    
    def _detect_coordinated_trading(self, df: pd.DataFrame) -> List[Dict]:
        """Detect coordinated trading by multiple wallets - REFINED."""
        coordinated = []
        
        for block, group in df.groupby('blockNumber'):
            unique_wallets = len(group['walletAddress'].unique())
            total_value = group['totalValueUsd'].sum()
            
            # More stringent: need 5+ wallets AND $10k+ volume
            if unique_wallets >= 5 and total_value > 10000:
                coordinated.append({
                    'block': int(block),
                    'timestamp': group['blockTimestamp'].iloc[0],
                    'num_wallets': unique_wallets,
                    'total_value': total_value,
                    'wallets': group['walletAddress'].tolist()[:10]  # Limit list size
                })
        
        return coordinated


class PumpAndDumpDetector:
    """Detects pump and dump schemes"""
    
    def __init__(self,
                 pump_threshold: float = 0.50,  # Increased from 0.30
                 dump_threshold: float = 0.30,  # Increased from 0.20
                 min_wallets: int = 10,  # Increased from 5
                 time_window_hours: int = 4):  # Added time constraint
        self.pump_threshold = pump_threshold
        self.dump_threshold = dump_threshold
        self.min_wallets = min_wallets
        self.time_window = timedelta(hours=time_window_hours)
    
    def detect(self, transactions: List[Dict]) -> Dict:
        """Detect pump and dump schemes."""
        if not transactions or len(transactions) < 50:
            return {'detected_schemes': [], 'num_schemes': 0, 'high_confidence': []}
        
        df = pd.DataFrame(transactions)
        df['blockTimestamp'] = pd.to_datetime(df['blockTimestamp'])
        df['baseQuotePrice'] = pd.to_numeric(df['baseQuotePrice'], errors='coerce')
        df = df.sort_values('blockTimestamp')
        
        schemes = []
        
        # Calculate rolling price changes over different windows
        df['price_1h_change'] = df.groupby('pairAddress')['baseQuotePrice'].transform(
            lambda x: x.pct_change(periods=min(len(x)-1, 10))
        )
        
        # Find significant pumps
        pumps = df[df['price_1h_change'] > self.pump_threshold].copy()
        
        for idx, pump_row in pumps.iterrows():
            # Look for coordinated dump within time window
            dump_window = df[
                (df['blockTimestamp'] > pump_row['blockTimestamp']) &
                (df['blockTimestamp'] <= pump_row['blockTimestamp'] + self.time_window)
            ]
            
            sell_all = dump_window[dump_window['subCategory'] == 'sellAll']
            unique_dumpers = len(sell_all['walletAddress'].unique())
            dump_volume = sell_all['totalValueUsd'].sum()
            
            # Require significant dumping activity
            if unique_dumpers >= self.min_wallets and dump_volume > 50000:
                # Check for price collapse
                if len(dump_window) > 0:
                    price_after = dump_window['baseQuotePrice'].iloc[-1]
                    price_drop = (pump_row['baseQuotePrice'] - price_after) / pump_row['baseQuotePrice']
                    
                    if price_drop >= self.dump_threshold:
                        confidence = self._calculate_confidence(
                            unique_dumpers, 
                            pump_row['price_1h_change'],
                            price_drop,
                            dump_volume
                        )
                        
                        schemes.append({
                            'pump_time': pump_row['blockTimestamp'],
                            'pump_price_increase': pump_row['price_1h_change'],
                            'dump_price_decrease': price_drop,
                            'dump_wallets': unique_dumpers,
                            'dump_volume': dump_volume,
                            'confidence': confidence
                        })
        
        return {
            'detected_schemes': schemes,
            'num_schemes': len(schemes),
            'high_confidence': [s for s in schemes if s['confidence'] > 0.75]
        }
    
    def _calculate_confidence(self, num_dumpers: int, pump_size: float, 
                             dump_size: float, volume: float) -> float:
        """Calculate confidence score with more factors."""
        score = 0.0
        
        # Dumpers count (max 0.25)
        if num_dumpers >= 20:
            score += 0.25
        elif num_dumpers >= self.min_wallets:
            score += 0.15
        
        # Pump magnitude (max 0.25)
        if pump_size >= 1.0:  # 100%+
            score += 0.25
        elif pump_size >= self.pump_threshold:
            score += 0.15
        
        # Dump magnitude (max 0.25)
        if dump_size >= 0.5:  # 50%+
            score += 0.25
        elif dump_size >= self.dump_threshold:
            score += 0.15
        
        # Volume (max 0.25)
        if volume >= 100000:  # $100k+
            score += 0.25
        elif volume >= 50000:
            score += 0.15
        
        return min(score, 1.0)


# ==================== MAIN ANOMALY DETECTION SYSTEM ====================
class CryptoAnomalyDetectionSystem:
    """
    Complete system for detecting trading anomalies using Moralis API.
    REFINED VERSION with better false positive handling.
    """
    
    def __init__(self, moralis_api_key: str, sensitivity: str = "medium"):
        """
        Args:
            moralis_api_key: Moralis API key
            sensitivity: Detection sensitivity ("low", "medium", "high")
        """
        self.fetcher = MoralisSwapDataFetcher(moralis_api_key)
        
        # Adjust detector parameters based on sensitivity
        if sensitivity == "low":
            self.wash_detector = WashTradingDetector(
                min_round_trips=5, min_same_block_trades=10, min_volume_threshold=5000
            )
            self.price_detector = PriceManipulationDetector(
                price_spike_threshold=0.20, volume_spike_multiplier=15.0, min_manipulation_value=10000
            )
            self.pump_detector = PumpAndDumpDetector(
                pump_threshold=0.70, dump_threshold=0.40, min_wallets=15
            )
        elif sensitivity == "high":
            self.wash_detector = WashTradingDetector(
                min_round_trips=2, min_same_block_trades=3, min_volume_threshold=500
            )
            self.price_detector = PriceManipulationDetector(
                price_spike_threshold=0.10, volume_spike_multiplier=5.0, min_manipulation_value=1000
            )
            self.pump_detector = PumpAndDumpDetector(
                pump_threshold=0.25, dump_threshold=0.15, min_wallets=5
            )
        else:  # medium (default)
            self.wash_detector = WashTradingDetector()
            self.price_detector = PriceManipulationDetector()
            self.pump_detector = PumpAndDumpDetector()
    
    def analyze_token(self, 
                     token_address: str,
                     chain: str = "eth",
                     limit: int = 100,
                     max_pages: int = 5) -> Dict:
        """
        Complete anomaly analysis for a single token.
        
        Args:
            token_address: ERC20 token contract address
            chain: Blockchain network
            limit: Transactions per page
            max_pages: Maximum pages to fetch
            
        Returns:
            Dict containing all detection results
        """
        print(f"\n{'='*60}")
        print(f"ANALYZING TOKEN: {token_address}")
        print(f"{'='*60}\n")
        
        # Fetch data
        transactions = self.fetcher.fetch_token_swaps(
            token_address, chain, limit, max_pages
        )
        
        if not transactions:
            print("No transactions found!")
            return None
        
        # Run all detectors
        print("\n--- Running Wash Trading Detection ---")
        wash_results = self.wash_detector.detect(transactions)
        print(f"✓ Detected {wash_results['detected_count']} suspicious wallets")
        if 'mev_bots_filtered' in wash_results:
            print(f"  ({wash_results['mev_bots_filtered']} MEV bots filtered out)")
        
        print("\n--- Running Price Manipulation Detection ---")
        price_results = self.price_detector.detect(transactions)
        print(f"✓ Found {price_results['total_events']} manipulation events")
        print(f"  - Manipulation Events: {len(price_results['manipulation_events'])}")
        print(f"  - Coordinated Trading: {len(price_results['coordinated_trading'])}")
        
        print("\n--- Running Pump & Dump Detection ---")
        pump_results = self.pump_detector.detect(transactions)
        print(f"✓ Detected {pump_results['num_schemes']} potential schemes")
        print(f"  - High Confidence: {len(pump_results['high_confidence'])}")
        
        # Compile results
        results = {
            'token_address': token_address,
            'chain': chain,
            'analysis_timestamp': datetime.now().isoformat(),
            'total_transactions': len(transactions),
            'wash_trading': wash_results,
            'price_manipulation': price_results,
            'pump_and_dump': pump_results,
            'risk_score': self._calculate_risk_score(wash_results, price_results, pump_results),
            'risk_level': self._get_risk_level(wash_results, price_results, pump_results)
        }
        
        return results
    
    def _calculate_risk_score(self, wash: Dict, price: Dict, pump: Dict) -> float:
        """Calculate overall risk score (0-100) - REFINED."""
        score = 0.0
        
        # Wash trading component (max 35 points) - weighted by volume
        if wash['detected_count'] > 0:
            volume_factor = min(wash.get('total_suspicious_volume', 0) / 100000, 1.0)
            score += min(wash['detected_count'] * 3, 25) + (volume_factor * 10)
        
        # Price manipulation component (max 35 points)
        manipulation_count = len(price.get('manipulation_events', []))
        coordinated_count = len(price.get('coordinated_trading', []))
        if manipulation_count > 0:
            score += min(manipulation_count * 10, 25)
        if coordinated_count > 0:
            score += min(coordinated_count * 2, 10)
        
        # Pump and dump component (max 30 points) - high confidence weighted more
        high_conf = len(pump.get('high_confidence', []))
        total_schemes = pump.get('num_schemes', 0)
        if high_conf > 0:
            score += min(high_conf * 15, 25)
        elif total_schemes > 0:
            score += min(total_schemes * 5, 10)
        
        return min(score, 100)
    
    def _get_risk_level(self, wash: Dict, price: Dict, pump: Dict) -> str:
        """Determine risk level category."""
        score = self._calculate_risk_score(wash, price, pump)
        
        if score >= 75:
            return "CRITICAL"
        elif score >= 50:
            return "HIGH"
        elif score >= 25:
            return "MEDIUM"
        elif score > 0:
            return "LOW"
        else:
            return "MINIMAL"
    
    def generate_report(self, results: Dict) -> str:
        """Generate human-readable report."""
        if not results:
            return "No data to report"
        
        risk_emoji = {
            "CRITICAL": "🚨",
            "HIGH": "⚠️",
            "MEDIUM": "⚡",
            "LOW": "ℹ️",
            "MINIMAL": "✅"
        }
        
        emoji = risk_emoji.get(results['risk_level'], "❓")
        
        report = f"""
{'='*60}
TRANSACTION ANOMALY DETECTION
{'='*60}

Token Address: {results['token_address']}
Chain: {results['chain']}
Analysis Date: {results['analysis_timestamp']}
Total Transactions Analyzed: {results['total_transactions']}

OVERALL RISK SCORE: {results['risk_score']:.1f}/100
RISK LEVEL: {results['risk_level']}

{'='*60}
WASH TRADING DETECTION
{'='*60}
Suspicious Wallets: {results['wash_trading']['detected_count']}
Total Suspicious Volume: ${results['wash_trading'].get('total_suspicious_volume', 0):,.2f}
{results['wash_trading'].get('note', '')}

{'='*60}
PRICE MANIPULATION DETECTION
{'='*60}
Total Events: {results['price_manipulation']['total_events']}
Manipulation Events: {len(results['price_manipulation']['manipulation_events'])}
Coordinated Trading Events: {len(results['price_manipulation']['coordinated_trading'])}
Highest Price Spike: {results['price_manipulation']['highest_spike']*100:.1f}%

{'='*60}
PUMP & DUMP DETECTION
{'='*60}
Detected Schemes: {results['pump_and_dump']['num_schemes']}
High Confidence Schemes: {len(results['pump_and_dump']['high_confidence'])}

{'='*60}
"""
        return report
    
    def save_results(self, results: Dict, filename: str = None):
        """Save results to JSON file."""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"anomaly_report_{timestamp}.json"
        
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"\n✓ Results saved to: {filename}")


# ==================== MAIN EXECUTION ====================
def main():
    """Main execution function."""
    
    # Load environment variables
    load_dotenv()
    moralis_key = os.getenv("MORALIS_KEY")
    
    if not moralis_key:
        raise ValueError("Please set the MORALIS_KEY environment variable")
    
    print("✓ Moralis API key loaded successfully\n")
    
    # Initialize the system with MEDIUM sensitivity (balanced)
    detector = CryptoAnomalyDetectionSystem(moralis_key, sensitivity="medium")
    
    # Example: Analyze PEPE token
    PEPE_ADDRESS = "0x6982508145454ce325ddbe47a25d4ec3d2311933"
    
    # Run analysis
    results = detector.analyze_token(
        token_address=PEPE_ADDRESS,
        chain="eth",
        limit=100,
        max_pages=5
    )
    
    if results:
        # Print report
        print(detector.generate_report(results))
        
        # Save results
        detector.save_results(results)
        
        # Print top suspicious wallets with more detail
        if results['wash_trading']['detected_count'] > 0:
            print("\n=== TOP SUSPICIOUS WALLETS (Wash Trading) ===")
            for wallet, data in list(results['wash_trading']['suspicious_wallets'].items())[:5]:
                print(f"\nWallet: {wallet}")
                print(f"  Round Trips: {data['round_trips']}")
                print(f"  Same Block Trades: {data['same_block_trades']}")
                print(f"  Total Volume: ${data['total_volume']:,.2f}")
                print(f"  Avg Trade Size: ${data['avg_trade_size']:,.2f}")
                print(f"  Number of Trades: {data['num_trades']}")
        
        # Show high confidence pump & dumps
        if len(results['pump_and_dump']['high_confidence']) > 0:
            print("\n=== HIGH CONFIDENCE PUMP & DUMP SCHEMES ===")
            for i, scheme in enumerate(results['pump_and_dump']['high_confidence'][:3], 1):
                print(f"\nScheme #{i}:")
                print(f"  Pump Time: {scheme['pump_time']}")
                print(f"  Price Increase: {scheme['pump_price_increase']*100:.1f}%")
                print(f"  Price Decrease: {scheme['dump_price_decrease']*100:.1f}%")
                print(f"  Dumper Wallets: {scheme['dump_wallets']}")
                print(f"  Dump Volume: ${scheme['dump_volume']:,.2f}")
                print(f"  Confidence: {scheme['confidence']*100:.0f}%")


if __name__ == "__main__":
    main()