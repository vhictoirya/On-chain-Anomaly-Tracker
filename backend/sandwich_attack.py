import requests
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from collections import defaultdict
from datetime import datetime
from dotenv import load_dotenv


@dataclass
class SwapTransaction:
    """Represents a single swap transaction"""
    transaction_hash: str
    transaction_index: int
    transaction_type: str
    block_number: int
    block_timestamp: str
    wallet_address: str
    pair_address: str
    pair_label: str
    base_token: str
    quote_token: str
    bought_amount: float
    bought_symbol: str
    sold_amount: float
    sold_symbol: str
    total_value_usd: float
    base_quote_price: float


@dataclass
class SandwichAttack:
    """Represents a detected sandwich attack"""
    attacker_address: str
    victim_address: str
    block_number: int
    front_run_tx: SwapTransaction
    victim_tx: SwapTransaction
    back_run_tx: SwapTransaction
    profit_usd: float
    attack_timestamp: str


class SandwichAttackAnalyzer:
    """Analyzes last N transactions for sandwich attacks"""
    
    def __init__(self, api_key: str, token_address: str, chain: str = "eth"):
        self.api_key = api_key
        self.token_address = token_address
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
        
    def _get_headers(self) -> Dict[str, str]:
        """Returns headers for API requests"""
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_token_swaps(self, limit: int = 100) -> Dict:
        """Fetches swap transactions for the token"""
        url = f"{self.base_url}/erc20/{self.token_address}/swaps"
        params = {
            "chain": self.chain,
            "limit": limit,
            "order": "DESC"
        }
            
        response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
        response.raise_for_status()
        return response.json()
    
    def _parse_swap(self, swap_data: Dict) -> SwapTransaction:
        """Parses raw swap data into SwapTransaction object"""
        return SwapTransaction(
            transaction_hash=swap_data['transactionHash'],
            transaction_index=swap_data['transactionIndex'],
            transaction_type=swap_data['transactionType'],
            block_number=swap_data['blockNumber'],
            block_timestamp=swap_data['blockTimestamp'],
            wallet_address=swap_data['walletAddress'].lower(),
            pair_address=swap_data['pairAddress'],
            pair_label=swap_data.get('pairLabel', ''),
            base_token=swap_data['baseToken'],
            quote_token=swap_data['quoteToken'],
            bought_amount=float(swap_data['bought']['amount']),
            bought_symbol=swap_data['bought']['symbol'],
            sold_amount=abs(float(swap_data['sold']['amount'])),
            sold_symbol=swap_data['sold']['symbol'],
            total_value_usd=swap_data['totalValueUsd'],
            base_quote_price=float(swap_data['baseQuotePrice'])
        )
    
    def _group_by_block(self, swaps: List[SwapTransaction]) -> Dict[int, List[SwapTransaction]]:
        """Groups transactions by block number"""
        blocks = defaultdict(list)
        for swap in swaps:
            blocks[swap.block_number].append(swap)
        
        # Sort transactions within each block by transaction index
        for block_num in blocks:
            blocks[block_num].sort(key=lambda x: x.transaction_index)
        
        return blocks
    
    def _detect_sandwich_in_block(self, transactions: List[SwapTransaction]) -> List[SandwichAttack]:
        """Detects sandwich attacks within a single block"""
        sandwich_attacks = []
        
        # Group transactions by wallet
        wallet_txs = defaultdict(list)
        for tx in transactions:
            wallet_txs[tx.wallet_address].append(tx)
        
        # Find wallets with multiple transactions in the same block
        potential_attackers = {wallet: txs for wallet, txs in wallet_txs.items() if len(txs) >= 2}
        
        for attacker_wallet, attacker_txs in potential_attackers.items():
            # Look for buy-sell patterns on the same pair
            for i in range(len(attacker_txs) - 1):
                front_run = attacker_txs[i]
                back_run = attacker_txs[i + 1]
                
                # Check if it's a buy followed by a sell on the same pair
                if (front_run.transaction_type == 'buy' and 
                    back_run.transaction_type == 'sell' and
                    front_run.pair_address == back_run.pair_address):
                    
                    # Find victim transactions between the attacker's transactions
                    victims = [
                        tx for tx in transactions
                        if (tx.wallet_address != attacker_wallet and
                            tx.pair_address == front_run.pair_address and
                            front_run.transaction_index < tx.transaction_index < back_run.transaction_index)
                    ]
                    
                    # If there are victims sandwiched between the attacker's trades
                    for victim_tx in victims:
                        # Calculate approximate profit (simplified)
                        profit = self._calculate_profit(front_run, back_run)
                        
                        sandwich = SandwichAttack(
                            attacker_address=attacker_wallet,
                            victim_address=victim_tx.wallet_address,
                            block_number=front_run.block_number,
                            front_run_tx=front_run,
                            victim_tx=victim_tx,
                            back_run_tx=back_run,
                            profit_usd=profit,
                            attack_timestamp=front_run.block_timestamp
                        )
                        sandwich_attacks.append(sandwich)
        
        return sandwich_attacks
    
    def _calculate_profit(self, front_run: SwapTransaction, back_run: SwapTransaction) -> float:
        """Calculates approximate profit from sandwich attack"""
        return back_run.total_value_usd - front_run.total_value_usd
    
    def print_attack_details(self, attack: SandwichAttack):
        """Prints detailed information about a sandwich attack"""
        print("\n" + "="*80)
        print(f"SANDWICH ATTACK #{len(self.attacks_found)}")
        print("="*80)
        print(f"Block Number: {attack.block_number}")
        print(f"Timestamp: {attack.attack_timestamp}")
        print(f"Pair: {attack.front_run_tx.pair_label}")
        print(f"\nAttacker: {attack.attacker_address}")
        print(f"Victim: {attack.victim_address}")
        print(f"Estimated Profit: ${attack.profit_usd:.2f}")
        
        print(f"\n--- Front Run (TX Index: {attack.front_run_tx.transaction_index}) ---")
        print(f"Hash: {attack.front_run_tx.transaction_hash}")
        print(f"Type: {attack.front_run_tx.transaction_type.upper()}")
        print(f"Bought: {attack.front_run_tx.bought_amount:.4f} {attack.front_run_tx.bought_symbol}")
        print(f"Sold: {attack.front_run_tx.sold_amount:.4f} {attack.front_run_tx.sold_symbol}")
        print(f"Value: ${attack.front_run_tx.total_value_usd:.2f}")
        
        print(f"\n--- Victim Transaction (TX Index: {attack.victim_tx.transaction_index}) ---")
        print(f"Hash: {attack.victim_tx.transaction_hash}")
        print(f"Type: {attack.victim_tx.transaction_type.upper()}")
        print(f"Bought: {attack.victim_tx.bought_amount:.4f} {attack.victim_tx.bought_symbol}")
        print(f"Sold: {attack.victim_tx.sold_amount:.4f} {attack.victim_tx.sold_symbol}")
        print(f"Value: ${attack.victim_tx.total_value_usd:.2f}")
        
        print(f"\n--- Back Run (TX Index: {attack.back_run_tx.transaction_index}) ---")
        print(f"Hash: {attack.back_run_tx.transaction_hash}")
        print(f"Type: {attack.back_run_tx.transaction_type.upper()}")
        print(f"Bought: {attack.back_run_tx.bought_amount:.4f} {attack.back_run_tx.bought_symbol}")
        print(f"Sold: {attack.back_run_tx.sold_amount:.4f} {attack.back_run_tx.sold_symbol}")
        print(f"Value: ${attack.back_run_tx.total_value_usd:.2f}")
        print("="*80)
    
    def print_summary(self, attacks: List[SandwichAttack], total_transactions: int, unique_blocks: int):
        """Prints analysis summary"""
        print("\n" + "="*80)
        print("ANALYSIS SUMMARY")
        print("="*80)
        print(f"Total Transactions Analyzed: {total_transactions}")
        print(f"Unique Blocks Analyzed: {unique_blocks}")
        print(f"Sandwich Attacks Detected: {len(attacks)}")
        
        if attacks:
            total_profit = sum(attack.profit_usd for attack in attacks)
            avg_profit = total_profit / len(attacks)
            
            print(f"\nTotal Estimated Profit: ${total_profit:.2f}")
            print(f"Average Profit per Attack: ${avg_profit:.2f}")
            
            # Count unique attackers and victims
            unique_attackers = len(set(attack.attacker_address for attack in attacks))
            unique_victims = len(set(attack.victim_address for attack in attacks))
            
            print(f"\nUnique Attackers: {unique_attackers}")
            print(f"Unique Victims: {unique_victims}")
            
            # Most profitable attack
            most_profitable = max(attacks, key=lambda x: x.profit_usd)
            print(f"\nMost Profitable Attack:")
            print(f"  Profit: ${most_profitable.profit_usd:.2f}")
            print(f"  Block: {most_profitable.block_number}")
            print(f"  Attacker: {most_profitable.attacker_address}")
        else:
            print("\n✅ No sandwich attacks detected in the analyzed transactions.")
        
        print("="*80 + "\n")
    
    def analyze(self, num_transactions: int = 100, verbose: bool = True):
        """
        Analyzes last N transactions for sandwich attacks
        
        Args:
            num_transactions: Number of recent transactions to analyze
            verbose: If True, prints detailed info for each attack
        """
        print(f"\n🔍 Starting Sandwich Attack Analysis")
        print(f"{'='*80}")
        print(f"Token Address: {self.token_address}")
        print(f"Chain: {self.chain}")
        print(f"Analyzing last {num_transactions} transactions...")
        print(f"{'='*80}\n")
        
        # Fetch transaction data
        print("📥 Fetching transaction data from Moralis API...")
        data = self.fetch_token_swaps(limit=num_transactions)
        swaps = [self._parse_swap(swap) for swap in data['result']]
        
        print(f"✅ Retrieved {len(swaps)} transactions")
        
        # Group by block
        blocks = self._group_by_block(swaps)
        print(f"📦 Transactions span {len(blocks)} unique blocks")
        
        # Analyze each block
        print(f"\n🔎 Analyzing blocks for sandwich attacks...\n")
        
        self.attacks_found = []
        blocks_with_attacks = 0
        
        for block_num, block_txs in sorted(blocks.items(), reverse=True):
            if len(block_txs) >= 3:  # Need at least 3 txs for a sandwich
                attacks = self._detect_sandwich_in_block(block_txs)
                
                if attacks:
                    blocks_with_attacks += 1
                    self.attacks_found.extend(attacks)
                    
                    if verbose:
                        for attack in attacks:
                            self.print_attack_details(attack)
        
        # Print summary
        self.print_summary(self.attacks_found, len(swaps), len(blocks))
        
        return self.attacks_found


# Main execution
if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    moralis_key = os.getenv("MORALIS_KEY")
    
    if not moralis_key:
        raise ValueError("Please set the MORALIS_KEY environment variable")
    
    print("✅ Moralis API key loaded successfully")
    
    # Configuration
    TOKEN_ADDRESS = "0x6982508145454ce325ddbe47a25d4ec3d2311933"  # PEPE token
    CHAIN = "eth"
    NUM_TRANSACTIONS = 100
    
    # Create analyzer
    analyzer = SandwichAttackAnalyzer(
        api_key=moralis_key,
        token_address=TOKEN_ADDRESS,
        chain=CHAIN
    )
    
    # Run one-time analysis
    attacks = analyzer.analyze(
        num_transactions=NUM_TRANSACTIONS,
        verbose=True  # Set to False for summary only
    )