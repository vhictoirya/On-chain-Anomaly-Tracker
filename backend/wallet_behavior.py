import requests
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict
from datetime import datetime, timedelta
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
    sub_category: str


@dataclass
class InsiderTrade:
    """Represents a potential insider trading event"""
    wallet_address: str
    token_address: str
    token_symbol: str
    entry_transaction: SwapTransaction
    current_position_value: float
    entry_price: float
    current_price: float
    price_change_percent: float
    time_since_entry: str
    suspicion_score: float
    flags: List[str]


@dataclass
class SnipingBot:
    """Represents a detected sniping bot"""
    wallet_address: str
    total_snipes: int
    successful_snipes: int
    success_rate: float
    total_volume_usd: float
    avg_entry_speed_blocks: float
    tokens_sniped: List[str]
    recent_snipes: List[SwapTransaction]
    bot_confidence_score: float


class InsiderTradingDetector:
    """Detects potential insider trading patterns in wallet activity"""
    
    def __init__(self, api_key: str, chain: str = "eth"):
        self.api_key = api_key
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_wallet_swaps(self, wallet_address: str, limit: int = 100) -> Dict:
        """Fetches swap history for a wallet"""
        url = f"{self.base_url}/wallets/{wallet_address}/swaps"
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
            base_quote_price=float(swap_data['baseQuotePrice']),
            sub_category=swap_data.get('subCategory', '')
        )
    
    def _calculate_suspicion_score(self, trade: InsiderTrade) -> float:
        """Calculates suspicion score based on multiple factors"""
        score = 0.0
        
        # Large price increase after entry
        if trade.price_change_percent > 50:
            score += 30
        elif trade.price_change_percent > 30:
            score += 20
        elif trade.price_change_percent > 15:
            score += 10
        
        # New position (first buy)
        if trade.entry_transaction.sub_category == 'newPosition':
            score += 15
        
        # Large position size
        if trade.entry_transaction.total_value_usd > 50000:
            score += 20
        elif trade.entry_transaction.total_value_usd > 10000:
            score += 10
        
        # Quick gains (within 24 hours)
        if 'hours' in trade.time_since_entry or 'minutes' in trade.time_since_entry:
            score += 15
        
        return min(score, 100)
    
    def _get_flags(self, trade: InsiderTrade) -> List[str]:
        """Generates red flags for potential insider trading"""
        flags = []
        
        if trade.price_change_percent > 50:
            flags.append("🚨 MASSIVE GAINS (>50%)")
        elif trade.price_change_percent > 30:
            flags.append("⚠️ Large gains (>30%)")
        
        if trade.entry_transaction.sub_category == 'newPosition':
            flags.append("🆕 New position entry")
        
        if trade.entry_transaction.total_value_usd > 50000:
            flags.append("💰 Large position (>$50k)")
        elif trade.entry_transaction.total_value_usd > 10000:
            flags.append("💵 Significant position (>$10k)")
        
        if 'hours' in trade.time_since_entry or 'minutes' in trade.time_since_entry:
            flags.append("⚡ Quick profit")
        
        return flags
    
    def analyze_wallet(self, wallet_address: str, min_suspicion_score: float = 30) -> List[InsiderTrade]:
        """Analyzes wallet for potential insider trading"""
        print(f"\n🔍 Analyzing wallet: {wallet_address}")
        print("="*80)
        
        # Fetch wallet swaps
        data = self.fetch_wallet_swaps(wallet_address)
        swaps = [self._parse_swap(swap) for swap in data['result']]
        
        print(f"📊 Found {len(swaps)} transactions")
        
        # Track positions by token
        positions = defaultdict(list)
        for swap in swaps:
            if swap.transaction_type == 'buy':
                # Track token bought
                token_key = (swap.base_token, swap.bought_symbol)
                positions[token_key].append(swap)
        
        # Analyze each position for insider trading patterns
        insider_trades = []
        
        for (token_address, token_symbol), buys in positions.items():
            # Get earliest buy (entry point)
            entry = min(buys, key=lambda x: x.block_number)
            latest = max(buys, key=lambda x: x.block_number)
            
            # Calculate metrics
            entry_price = entry.base_quote_price
            current_price = latest.base_quote_price
            price_change = ((current_price - entry_price) / entry_price) * 100
            
            # Calculate time since entry
            entry_time = datetime.fromisoformat(entry.block_timestamp.replace('Z', '+00:00'))
            current_time = datetime.now(entry_time.tzinfo)
            time_diff = current_time - entry_time
            
            if time_diff.days > 0:
                time_str = f"{time_diff.days} days"
            elif time_diff.seconds // 3600 > 0:
                time_str = f"{time_diff.seconds // 3600} hours"
            else:
                time_str = f"{time_diff.seconds // 60} minutes"
            
            # Create insider trade object
            trade = InsiderTrade(
                wallet_address=wallet_address,
                token_address=token_address,
                token_symbol=token_symbol,
                entry_transaction=entry,
                current_position_value=latest.total_value_usd,
                entry_price=entry_price,
                current_price=current_price,
                price_change_percent=price_change,
                time_since_entry=time_str,
                suspicion_score=0,
                flags=[]
            )
            
            # Calculate suspicion score and flags
            trade.suspicion_score = self._calculate_suspicion_score(trade)
            trade.flags = self._get_flags(trade)
            
            # Only include if meets minimum suspicion threshold
            if trade.suspicion_score >= min_suspicion_score:
                insider_trades.append(trade)
        
        # Sort by suspicion score
        insider_trades.sort(key=lambda x: x.suspicion_score, reverse=True)
        
        return insider_trades
    
    def print_report(self, trades: List[InsiderTrade]):
        """Prints insider trading detection report"""
        if not trades:
            print("\n✅ No suspicious insider trading patterns detected")
            return
        
        print(f"\n🚨 DETECTED {len(trades)} SUSPICIOUS TRADES")
        print("="*80)
        
        for i, trade in enumerate(trades, 1):
            print(f"\n{'='*80}")
            print(f"SUSPICIOUS TRADE #{i} - Suspicion Score: {trade.suspicion_score:.0f}/100")
            print(f"{'='*80}")
            print(f"Token: {trade.token_symbol} ({trade.token_address[:10]}...)")
            print(f"Entry Price: ${trade.entry_price:.8f}")
            print(f"Current Price: ${trade.current_price:.8f}")
            print(f"Price Change: {trade.price_change_percent:+.2f}%")
            print(f"Position Value: ${trade.current_position_value:.2f}")
            print(f"Time Since Entry: {trade.time_since_entry}")
            print(f"\nEntry Transaction:")
            print(f"  Hash: {trade.entry_transaction.transaction_hash}")
            print(f"  Block: {trade.entry_transaction.block_number}")
            print(f"  Amount: {trade.entry_transaction.bought_amount:.4f} {trade.token_symbol}")
            print(f"\nRed Flags:")
            for flag in trade.flags:
                print(f"  {flag}")


class SnipingBotDetector:
    """Detects sniping bot behavior in wallet activity"""
    
    def __init__(self, api_key: str, chain: str = "eth"):
        self.api_key = api_key
        self.chain = chain
        self.base_url = "https://deep-index.moralis.io/api/v2.2"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "X-API-Key": self.api_key
        }
    
    def fetch_wallet_swaps(self, wallet_address: str, limit: int = 100) -> Dict:
        """Fetches swap history for a wallet"""
        url = f"{self.base_url}/wallets/{wallet_address}/swaps"
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
            base_quote_price=float(swap_data['baseQuotePrice']),
            sub_category=swap_data.get('subCategory', '')
        )
    
    def _calculate_bot_confidence(self, metrics: Dict) -> float:
        """Calculates confidence score that wallet is a sniping bot"""
        score = 0.0
        
        # High percentage of new positions
        if metrics['new_position_ratio'] > 0.7:
            score += 30
        elif metrics['new_position_ratio'] > 0.5:
            score += 20
        
        # Multiple different tokens (diversified sniping)
        if metrics['unique_tokens'] > 10:
            score += 25
        elif metrics['unique_tokens'] > 5:
            score += 15
        
        # High transaction frequency
        if metrics['total_snipes'] > 20:
            score += 20
        elif metrics['total_snipes'] > 10:
            score += 10
        
        # Fast entry (low block index)
        if metrics['avg_entry_speed'] < 50:
            score += 25
        elif metrics['avg_entry_speed'] < 100:
            score += 15
        
        return min(score, 100)
    
    def analyze_wallet(self, wallet_address: str) -> Optional[SnipingBot]:
        """Analyzes wallet for sniping bot behavior"""
        print(f"\n🎯 Analyzing wallet for sniping behavior: {wallet_address}")
        print("="*80)
        
        # Fetch wallet swaps
        data = self.fetch_wallet_swaps(wallet_address)
        swaps = [self._parse_swap(swap) for swap in data['result']]
        
        print(f"📊 Found {len(swaps)} transactions")
        
        # Filter for buy transactions (snipes are entries)
        buys = [s for s in swaps if s.transaction_type == 'buy']
        
        if len(buys) < 5:
            print("❌ Not enough buy transactions to analyze")
            return None
        
        # Identify new position entries (potential snipes)
        new_positions = [s for s in buys if s.sub_category == 'newPosition']
        
        # Calculate metrics
        unique_tokens = len(set(s.base_token for s in new_positions))
        total_volume = sum(s.total_value_usd for s in buys)
        avg_entry_speed = sum(s.transaction_index for s in new_positions) / len(new_positions) if new_positions else 0
        new_position_ratio = len(new_positions) / len(buys) if buys else 0
        
        # Track successful snipes (positions that are still held or sold at profit)
        successful_snipes = 0
        for snipe in new_positions[:10]:  # Check recent snipes
            # Look for corresponding sell
            sells = [s for s in swaps if s.transaction_type == 'sell' and s.base_token == snipe.base_token]
            if sells:
                latest_sell = max(sells, key=lambda x: x.block_number)
                if latest_sell.base_quote_price > snipe.base_quote_price:
                    successful_snipes += 1
            else:
                # Still holding - check if in profit
                # For simplicity, we'll count it as successful if it's a recent snipe
                successful_snipes += 1
        
        success_rate = (successful_snipes / min(len(new_positions), 10)) * 100 if new_positions else 0
        
        metrics = {
            'total_snipes': len(new_positions),
            'unique_tokens': unique_tokens,
            'new_position_ratio': new_position_ratio,
            'avg_entry_speed': avg_entry_speed
        }
        
        # Calculate bot confidence
        bot_confidence = self._calculate_bot_confidence(metrics)
        
        # Create bot profile
        bot = SnipingBot(
            wallet_address=wallet_address,
            total_snipes=len(new_positions),
            successful_snipes=successful_snipes,
            success_rate=success_rate,
            total_volume_usd=total_volume,
            avg_entry_speed_blocks=avg_entry_speed,
            tokens_sniped=[s.bought_symbol for s in new_positions[:20]],
            recent_snipes=new_positions[:5],
            bot_confidence_score=bot_confidence
        )
        
        return bot
    
    def print_report(self, bot: Optional[SnipingBot]):
        """Prints sniping bot detection report"""
        if not bot:
            return
        
        print("\n" + "="*80)
        print(f"SNIPING BOT ANALYSIS - Confidence: {bot.bot_confidence_score:.0f}/100")
        print("="*80)
        print(f"Wallet: {bot.wallet_address}")
        print(f"\n📊 Statistics:")
        print(f"  Total Snipes: {bot.total_snipes}")
        print(f"  Successful Snipes: {bot.successful_snipes}")
        print(f"  Success Rate: {bot.success_rate:.1f}%")
        print(f"  Total Volume: ${bot.total_volume_usd:.2f}")
        print(f"  Avg Entry Speed: {bot.avg_entry_speed_blocks:.1f} tx index")
        
        print(f"\n🎯 Tokens Sniped ({len(bot.tokens_sniped)} unique):")
        for i, token in enumerate(bot.tokens_sniped[:10], 1):
            print(f"  {i}. {token}")
        
        if len(bot.tokens_sniped) > 10:
            print(f"  ... and {len(bot.tokens_sniped) - 10} more")
        
        print(f"\n🔥 Recent Snipes:")
        for i, snipe in enumerate(bot.recent_snipes, 1):
            print(f"\n  Snipe #{i}:")
            print(f"    Token: {snipe.bought_symbol}")
            print(f"    Amount: {snipe.bought_amount:.4f}")
            print(f"    Value: ${snipe.total_value_usd:.2f}")
            print(f"    Block: {snipe.block_number}")
            print(f"    TX Index: {snipe.transaction_index}")
            print(f"    Hash: {snipe.transaction_hash}")
        
        # Bot classification
        print(f"\n🤖 Bot Classification:")
        if bot.bot_confidence_score >= 70:
            print("  ⚠️ HIGHLY LIKELY SNIPING BOT")
        elif bot.bot_confidence_score >= 50:
            print("  🟡 PROBABLE SNIPING BOT")
        elif bot.bot_confidence_score >= 30:
            print("  🟢 POSSIBLE SNIPING BOT")
        else:
            print("  ✅ UNLIKELY TO BE A BOT")
        
        print("="*80)


# Main execution
if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    moralis_key = os.getenv("MORALIS_KEY")
    
    if not moralis_key:
        raise ValueError("Please set the MORALIS_KEY environment variable")
    
    # Example wallet addresses (replace with real addresses to analyze)
    WALLET_TO_ANALYZE = "0xcB1C1FdE09f811B294172696404e88E658659905"
    
    print("="*80)
    print("WALLET BEHAVIOR ANALYSIS")
    print("="*80)
    
    # Run Insider Trading Detection
    print("\n" + "="*80)
    print("INSIDER TRADING DETECTION")
    print("="*80)
    
    insider_detector = InsiderTradingDetector(api_key=moralis_key, chain="eth")
    insider_trades = insider_detector.analyze_wallet(WALLET_TO_ANALYZE, min_suspicion_score=20)
    insider_detector.print_report(insider_trades)
    
    # Run Sniping Bot Detection
    print("\n\n" + "="*80)
    print("SNIPING BOT DETECTION")
    print("="*80)
    
    sniping_detector = SnipingBotDetector(api_key=moralis_key, chain="eth")
    bot_profile = sniping_detector.analyze_wallet(WALLET_TO_ANALYZE)
    sniping_detector.print_report(bot_profile)
    
    print("\n" + "="*80)
    print("ANALYSIS COMPLETE")
    print("="*80)