import React, { useState } from 'react';
import { Shield, AlertTriangle, Activity, Layers, Search, TrendingUp, Users, Droplet, AlertCircle, Target, Zap, Eye, Award, TrendingDown, Lock, Unlock, DollarSign, BarChart2, Info } from 'lucide-react';

const ChainWatchDashboard = () => {
  const [activeTab, setActiveTab] = useState('transaction-anomaly');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const [tokenAddress, setTokenAddress] = useState('0x6982508145454ce325ddbe47a25d4ec3d2311933');
  const [walletAddress, setWalletAddress] = useState('0xcB1C1FdE09f811B294172696404e88E658659905');
  const [pairAddress, setPairAddress] = useState('0xa43fe16908251ee70ef74718545e4fe6c5ccec9f');
  const [chain, setChain] = useState('eth');
  const [sensitivity, setSensitivity] = useState('medium');

  const API_BASE = 'https://on-chain-anomaly-tracker-production.up.railway.app/api/v1';

  const handleAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setResults(null);

      let endpoint = '';
      let params = { chain };

      switch (activeTab) {
        case 'transaction-anomaly':
          endpoint = 'transaction-anomaly';
          params = { token_address: tokenAddress, chain, sensitivity, limit: 100, max_pages: 5 };
          break;
        case 'sandwich-attack':
          endpoint = 'sandwich-attack';
          params = { token_address: tokenAddress, chain, num_transactions: 100 };
          break;
        case 'insider-trading':
          endpoint = 'insider-trading';
          params = { wallet_address: walletAddress, chain, min_suspicion_score: 30 };
          break;
        case 'sniping-bot':
          endpoint = 'sniping-bot';
          params = { wallet_address: walletAddress, chain };
          break;
        case 'liquidity-manipulation':
          endpoint = 'liquidity-manipulation';
          params = { pair_address: pairAddress, chain, num_transactions: 100 };
          break;
        case 'concentrated-attack':
          endpoint = 'concentrated-attack';
          params = { pair_address: pairAddress, chain, num_transactions: 100 };
          break;
        case 'pool-domination':
          endpoint = 'pool-domination';
          params = { pair_address: pairAddress, chain, num_transactions: 100 };
          break;
        case 'threat-assessment':
          endpoint = 'threat-assessment';
          params = { address: tokenAddress };
          break;
        default:
          break;
      }

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = `${API_BASE}/${endpoint}?${queryString}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    const colors = {
      'MINIMAL': 'bg-green-500/20 text-green-400',
      'LOW': 'bg-blue-500/20 text-blue-400',
      'MEDIUM': 'bg-yellow-500/20 text-yellow-400',
      'Medium Risk': 'bg-yellow-500/20 text-yellow-400',
      'HIGH': 'bg-orange-500/20 text-orange-400',
      'High Risk': 'bg-orange-500/20 text-orange-400',
      'CRITICAL': 'bg-red-500/20 text-red-400'
    };
    return colors[level] || 'bg-gray-500/20 text-gray-400';
  };

  const tabs = [
    { id: 'transaction-anomaly', label: 'Transaction Anomaly', icon: Activity, input: 'token' },
    { id: 'sandwich-attack', label: 'Sandwich Attack', icon: Layers, input: 'token' },
    { id: 'insider-trading', label: 'Insider Trading', icon: TrendingUp, input: 'wallet' },
    { id: 'sniping-bot', label: 'Sniping Bot', icon: Users, input: 'wallet' },
    { id: 'liquidity-manipulation', label: 'Liquidity Manipulation', icon: Droplet, input: 'pair' },
    { id: 'concentrated-attack', label: 'Concentrated Attack', icon: Activity, input: 'pair' },
    { id: 'pool-domination', label: 'Pool Domination', icon: Shield, input: 'pair' },
    { id: 'threat-assessment', label: 'Threat Assessment', icon: AlertTriangle, input: 'token' }
  ];

  const currentTab = tabs.find(t => t.id === activeTab);

  const renderResults = () => {
    if (!results) return null;

    if (activeTab === 'transaction-anomaly') {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4 animate-fade-in flex items-center gap-2">
            <span role="img" aria-label="magnifier">🔍</span>
            Transaction Anomaly Analysis
          </h2>
          {/* Summary Cards with animation */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-lg animate-fade-in-up delay-0">
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">Risk Level <span role="img" aria-label="thermometer">🌡️</span></p>
              <p className={`text-lg font-bold px-2 py-1 rounded inline-block ${getRiskColor(results.risk_level)} animate-pulse`}>{results.risk_level}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-lg animate-fade-in-up delay-100">
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">Risk Score <span role="img" aria-label="chart">📈</span></p>
              <p className="text-2xl font-bold animate-fade-in-up delay-200">{results.risk_score?.toFixed(1)}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-lg animate-fade-in-up delay-200">
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">Total Transactions <span role="img" aria-label="arrows">🔄</span></p>
              <p className="text-2xl font-bold animate-fade-in-up delay-300">{results.total_transactions}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-lg animate-fade-in-up delay-300">
              <p className="text-sm text-gray-400 mb-1 flex items-center gap-1">Analysis Time <span role="img" aria-label="clock">⏰</span></p>
              <p className="text-sm font-semibold animate-fade-in-up delay-400">{new Date(results.analysis_timestamp).toLocaleString()}</p>
            </div>
          </div>

          {/* Wash Trading Section */}
          <div className="bg-white/5 rounded-lg p-5 mb-6 border border-white/10 animate-fade-in-up delay-400">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">Wash Trading Detection</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                results.wash_trading?.detected_count > 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              } animate-bounce flex items-center gap-1`}>
                {results.wash_trading?.detected_count || 0} Detected
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-100">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">Suspicious Wallets <span role="img" aria-label="detective">🕵️‍♂️</span></p>
                <p className="text-xl font-bold text-red-400 animate-pulse">{results.wash_trading?.detected_count || 0}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-200">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">Total Suspicious Volume <span role="img" aria-label="money">💰</span></p>
                <p className="text-xl font-bold">${results.wash_trading?.total_suspicious_volume?.toLocaleString(undefined, {maximumFractionDigits: 2}) || '0'}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-300">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">MEV Bots Filtered <span role="img" aria-label="robot">🤖</span></p>
                <p className="text-xl font-bold text-blue-400">{results.wash_trading?.mev_bots_filtered || 0}</p>
              </div>
            </div>

            {results.wash_trading?.note && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-300">ℹ️ {results.wash_trading.note}</p>
              </div>
            )}

            {results.wash_trading?.top_suspicious_wallets?.length > 0 ? (
              <div>
                <h4 className="text-lg font-semibold mb-3 animate-fade-in-up delay-500 flex items-center gap-2">Suspicious Wallet Details</h4>
                <div className="flex flex-col gap-6">
                  {results.wash_trading.top_suspicious_wallets.map((wallet, idx) => {
                    const fullWalletData = results.wash_trading.suspicious_wallets?.[wallet.wallet];
                    return (
                      <div
                        key={idx}
                        className="bg-white/5 rounded-lg p-4 border border-white/10 shadow-lg animate-fade-in-up"
                        style={{ animationDelay: `${600 + idx * 80}ms` }}
                      >
                        <div className="flex flex-col gap-2 mb-4">
                          <span className="font-mono text-sm break-all flex items-center gap-2">
                            {wallet.wallet}
                            {fullWalletData?.is_suspicious && (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded animate-pulse">SUSPICIOUS</span>
                            )}
                            {fullWalletData?.is_likely_mev && (
                              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded animate-bounce">MEV BOT</span>
                            )}
                          </span>
                        </div>
                        {/* Stat cards row, like wash trading summary */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-100">
                            <p className="text-xs text-gray-400 mb-1">Total Trades</p>
                            <p className="text-xl font-bold">{wallet.num_trades}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-200">
                            <p className="text-xs text-gray-400 mb-1">Round Trips</p>
                            <p className="text-xl font-bold text-orange-400">{wallet.round_trips}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-300">
                            <p className="text-xs text-gray-400 mb-1">Same Block Trades</p>
                            <p className="text-xl font-bold text-red-400">{wallet.same_block_trades}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-400">
                            <p className="text-xs text-gray-400 mb-1">Total Volume</p>
                            <p className="text-xl font-bold">${wallet.total_volume?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                          </div>
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-500">
                            <p className="text-xs text-gray-400 mb-1">Avg Trade Size</p>
                            <p className="text-xl font-bold">${wallet.avg_trade_size?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                          </div>
                          {fullWalletData?.avg_round_trip_time !== undefined && (
                            <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-600">
                              <p className="text-xs text-gray-400 mb-1">Avg Round Trip Time</p>
                              <p className="text-xl font-bold">{fullWalletData.avg_round_trip_time}s</p>
                            </div>
                          )}
                        </div>
                        {/* Patterns row, if any */}
                        {fullWalletData?.patterns?.length > 0 && (
                          <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-700 flex flex-col gap-1 mt-2">
                            <span className="text-gray-400 text-xs mb-1">Patterns</span>
                            <div className="flex flex-wrap gap-1">
                              {fullWalletData.patterns.map((pattern, i) => (
                                <span key={i} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded animate-fade-in-up delay-800">{pattern}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-green-400 text-sm text-center py-3 animate-fade-in-up delay-600">✓ No wash trading detected</p>
            )}
          </div>

          {/* Price Manipulation Section */}
          <div className="bg-white/5 rounded-lg p-5 mb-6 border border-white/10 animate-fade-in-up delay-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Price Manipulation</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                results.price_manipulation?.total_events > 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              } animate-bounce`}>{results.price_manipulation?.total_events || 0} Events</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-100">
                <p className="text-xs text-gray-400 mb-1">Total Events</p>
                <p className="text-xl font-bold animate-pulse">{results.price_manipulation?.total_events || 0}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-200">
                <p className="text-xs text-gray-400 mb-1">Highest Spike</p>
                <p className="text-xl font-bold text-orange-400">{results.price_manipulation?.highest_spike?.toFixed(2)}%</p>
              </div>
            </div>

            {results.price_manipulation?.manipulation_events?.length > 0 ? (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 animate-fade-in-up delay-300">Manipulation Events</h4>
                {results.price_manipulation.manipulation_events.map((event, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-3 mb-2 border border-orange-500/20 animate-fade-in-up" style={{animationDelay: `${400 + idx * 80}ms`}}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-gray-400">Type:</span> {event.type}</div>
                      <div><span className="text-gray-400">Magnitude:</span> {event.magnitude?.toFixed(2)}%</div>
                      <div><span className="text-gray-400">Timestamp:</span> {new Date(event.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-400 text-sm text-center py-3 animate-fade-in-up delay-400">✓ No price manipulation detected</p>
            )}

            {results.price_manipulation?.coordinated_trading?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 animate-fade-in-up delay-400">Coordinated Trading</h4>
                {results.price_manipulation.coordinated_trading.map((trade, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-3 mb-2 border border-yellow-500/20 animate-fade-in-up" style={{animationDelay: `${500 + idx * 80}ms`}}>
                    <p className="text-sm">{JSON.stringify(trade)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pump and Dump Section */}
          <div className="bg-white/5 rounded-lg p-5 border border-white/10 animate-fade-in-up delay-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Pump & Dump Detection</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                results.pump_and_dump?.num_schemes > 0 
                  ? 'bg-red-500/20 text-red-400' 
                  : 'bg-green-500/20 text-green-400'
              } animate-bounce`}>{results.pump_and_dump?.num_schemes || 0} Schemes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-100">
                <p className="text-xs text-gray-400 mb-1">Total Schemes</p>
                <p className="text-xl font-bold animate-pulse">{results.pump_and_dump?.num_schemes || 0}</p>
              </div>
              <div className="bg-black/20 rounded-lg p-3 animate-fade-in-up delay-200">
                <p className="text-xs text-gray-400 mb-1">High Confidence</p>
                <p className="text-xl font-bold text-red-400">{results.pump_and_dump?.high_confidence?.length || 0}</p>
              </div>
            </div>

            {results.pump_and_dump?.detected_schemes?.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold mb-2 animate-fade-in-up delay-300">Detected Schemes</h4>
                {results.pump_and_dump.detected_schemes.map((scheme, idx) => (
                  <div key={idx} className="bg-black/30 rounded-lg p-3 mb-2 border border-red-500/20 animate-fade-in-up" style={{animationDelay: `${400 + idx * 80}ms`}}>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-gray-400">Phase:</span> {scheme.phase}</div>
                      <div><span className="text-gray-400">Confidence:</span> {scheme.confidence}%</div>
                      <div><span className="text-gray-400">Timestamp:</span> {new Date(scheme.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-green-400 text-sm text-center py-3 animate-fade-in-up delay-400">✓ No pump & dump schemes detected</p>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'sandwich-attack') {
      return (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
            <span role="img" aria-label="sandwich">🥪</span>
            <span>Sandwich Attack Detection</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Attacks Detected <span role="img" aria-label="alert">⚠️</span></p>
              <p className="text-2xl font-bold text-red-400">{results.attacks_detected}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Total Transactions <span role="img" aria-label="arrows">🔄</span></p>
              <p className="text-2xl font-bold">{results.total_transactions}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-sm text-gray-400 mb-1">Unique Blocks <span role="img" aria-label="block">🧱</span></p>
              <p className="text-2xl font-bold">{results.unique_blocks}</p>
            </div>
          </div>
          {results.attacks?.length > 0 ? (
            results.attacks.map((attack, idx) => (
              <div key={idx} className="bg-white/5 rounded-lg p-4 mb-3 border border-red-500/20">
                <p className="font-mono text-sm mb-2">{attack.attacker_address} <span role="img" aria-label="bot">🤖</span></p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-400">Profit:</span> <span className="font-bold">${attack.profit_usd?.toFixed(2)} <span role="img" aria-label="money">💰</span></span></div>
                  <div><span className="text-gray-400">Block:</span> {attack.block_number}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-green-400 text-sm">✓ No sandwich attacks detected <span role="img" aria-label="check">✅</span></p>
          )}
        </div>
      );
    }

    if (activeTab === 'insider-trading') {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-pink-500 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <TrendingUp className="w-7 h-7 text-fuchsia-400 animate-bounce" />
            <span>Insider Trading Detection</span>
            <span role="img" aria-label="detective">🕵️‍♂️</span>
          </h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-fuchsia-900/60 via-purple-900/60 to-pink-900/60 rounded-xl p-5 border border-fuchsia-500/30 flex flex-col items-center animate-fade-in-up delay-100">
              <div className="text-sm text-gray-300 mb-1 flex items-center gap-1">Suspicious Trades <span role="img" aria-label="alert">⚠️</span></div>
              <span className="font-bold text-2xl text-pink-400 animate-pulse">{results.suspicious_trades_count}</span>
            </div>
            <div className="bg-gradient-to-br from-fuchsia-900/60 via-purple-900/60 to-pink-900/60 rounded-xl p-5 border border-fuchsia-500/30 flex flex-col items-center animate-fade-in-up delay-200">
              <div className="text-sm text-gray-300 mb-1 flex items-center gap-1">Total Transactions <span role="img" aria-label="arrows">🔄</span></div>
              <span className="font-bold text-2xl text-white animate-fade-in-up delay-300">{results.total_transactions}</span>
            </div>
          </div>
          {results.suspicious_trades?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-fuchsia-300 flex items-center gap-2 animate-fade-in-up delay-300">Suspicious Trades</h3>
              <div className="space-y-4">
                {results.suspicious_trades.map((trade, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-amber-900/60 via-pink-900/60 to-yellow-900/60 rounded-xl p-5 border border-amber-400/40 transition-all duration-200 hover:shadow-2xl hover:border-amber-300/80 group cursor-pointer animate-fade-in-up" style={{animationDelay: `${400 + idx * 80}ms`}}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="font-semibold text-amber-200 flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-amber-300 animate-bounce" />
                        <span>{trade.token_symbol}</span>
                        <span role="img" aria-label="token">🪙</span>
                      </div>
                      <span
                        className="font-mono text-xs bg-amber-500/10 text-amber-400 px-2 py-1 rounded break-all max-w-full inline-block align-top ml-0 md:ml-4 mt-2 md:mt-0 cursor-pointer hover:bg-amber-600/20 focus:bg-amber-600/30 transition animate-fade-in-up delay-200"
                        title="Click to copy"
                        tabIndex={0}
                        onClick={() => {navigator.clipboard.writeText(trade.token_address)}}
                        onKeyDown={e => {if(e.key==='Enter'){navigator.clipboard.writeText(trade.token_address)}}}
                      >
                        {trade.token_address}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div><span className="text-gray-300">Suspicion Score:</span> <span className="text-pink-400 font-bold animate-pulse">{trade.suspicion_score?.toFixed(0)} <span role="img" aria-label="score">🏅</span></span></div>
                      <div><span className="text-gray-300">Entry Price:</span> <span className="font-bold">${trade.entry_price?.toFixed(6)} <span role="img" aria-label="entry">🚪</span></span></div>
                      <div><span className="text-gray-300">Current Price:</span> <span className="font-bold">${trade.current_price?.toFixed(6)} <span role="img" aria-label="current">💹</span></span></div>
                      <div><span className="text-gray-300">Price Change:</span> <span className={trade.price_change_percent > 0 ? 'text-green-400' : 'text-pink-400'}>{trade.price_change_percent?.toFixed(2)}% <span role="img" aria-label="change">{trade.price_change_percent > 0 ? '📈' : '📉'}</span></span></div>
                      <div><span className="text-gray-300">Position Value:</span> <span className="font-bold">${trade.position_value?.toFixed(2)} <span role="img" aria-label="value">💰</span></span></div>
                      <div><span className="text-gray-300">Time Since Entry:</span> <span className="font-bold">{trade.time_since_entry} <span role="img" aria-label="clock">⏱️</span></span></div>
                    </div>
                    {trade.flags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {trade.flags.map((flag, i) => (
                          <span key={i} className="px-2 py-1 bg-amber-500/10 text-amber-400 text-xs rounded font-semibold transition hover:bg-amber-600/20 animate-fade-in-up delay-400">{flag} <span role="img" aria-label="flag">🚩</span></span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400 text-center font-semibold animate-fade-in-up delay-400">
              ✓ No suspicious insider trading detected <span role="img" aria-label="check">✅</span>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'sniping-bot') {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-fuchsia-400 to-blue-400 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <Users className="w-7 h-7 text-fuchsia-400 animate-bounce" />
            <span>Sniping Bot Analysis</span>
          </h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 rounded-xl p-5 border border-fuchsia-400/30 flex flex-col items-center animate-fade-in-up delay-0">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Classification <span role="img" aria-label="robot">🤖</span></div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${results.classification === 'Bot' ? 'from-red-500 to-pink-500 text-white animate-pulse' : 'from-green-400 to-emerald-400 text-gray-900 animate-fade-in-up'}`}>{results.classification}</span>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-fuchsia-400/30 flex flex-col items-center animate-fade-in-up delay-100">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Confidence <span role="img" aria-label="chart">📊</span></div>
              <span className="font-bold text-2xl text-fuchsia-300 animate-fade-in-up delay-200">{results.bot_confidence_score?.toFixed(0)}%</span>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-fuchsia-400/30 flex flex-col items-center animate-fade-in-up delay-200">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Success Rate <span role="img" aria-label="rocket">🚀</span></div>
              <span className="font-bold text-2xl text-blue-300 animate-fade-in-up delay-300">{(results.success_rate * 100)?.toFixed(1)}%</span>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-fuchsia-400/30 flex flex-col items-center animate-fade-in-up delay-300">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Total Snipes <span role="img" aria-label="crosshair">🎯</span></div>
              <span className="font-bold text-lg text-white animate-fade-in-up delay-400">{results.total_snipes}</span>
            </div>
          </div>
          <div className="mb-8 mt-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 text-blue-200 text-sm animate-fade-in-up delay-400">
            <span role="img" aria-label="info">ℹ️</span> <b>Sniping bots</b> are automated programs that attempt to buy tokens at the exact moment of launch or during high volatility to maximize profit. This analysis detects such bots, their performance, and recent activity.
          </div>
          {results.recent_snipes?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-fuchsia-300 flex items-center gap-2 animate-fade-in-up delay-500">Recent Snipes <span role="img" aria-label="lightning">⚡</span></h3>
              <div className="space-y-4">
                {results.recent_snipes.map((snipe, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-blue-900/60 via-fuchsia-900/60 to-blue-900/60 rounded-xl p-5 border border-blue-400/40 transition-all duration-200 hover:shadow-2xl hover:border-blue-300/80 group cursor-pointer animate-fade-in-up" style={{animationDelay: `${600 + idx * 80}ms`}}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="font-semibold text-blue-200 flex items-center space-x-2">
                        <Search className="w-5 h-5 text-blue-300 animate-bounce" />
                        <span>{snipe.token}</span>
                        <span role="img" aria-label="token">🪙</span>
                      </div>
                      <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full font-bold ml-0 md:ml-4 mt-2 md:mt-0 transition hover:bg-blue-600/20 focus:bg-blue-600/30 animate-fade-in-up delay-200">Block {snipe.block_number}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-2">
                      <div><span className="text-gray-400">Amount:</span> <span className="font-bold">{snipe.amount?.toFixed(4)} <span role="img" aria-label="amount">💵</span></span></div>
                      <div><span className="text-gray-400">Value:</span> <span className="font-bold">${snipe.value_usd?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <span role="img" aria-label="usd">💰</span></span></div>
                      <div><span className="text-gray-400">Time:</span> <span className="font-bold">{snipe.timestamp ? new Date(snipe.timestamp).toLocaleString() : 'N/A'} <span role="img" aria-label="clock">⏰</span></span></div>
                      <div>
                        <span className="text-gray-400">Tx Hash:</span>
                        <span
                          className="font-mono text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded break-all max-w-full inline-block align-top cursor-pointer hover:bg-blue-600/20 focus:bg-blue-600/30 transition animate-fade-in-up delay-300"
                          title="Click to copy"
                          tabIndex={0}
                          onClick={() => {navigator.clipboard.writeText(snipe.tx_hash)}}
                          onKeyDown={e => {if(e.key==='Enter'){navigator.clipboard.writeText(snipe.tx_hash)}}}
                        >
                          {snipe.tx_hash || 'N/A'} <span role="img" aria-label="copy">📋</span>
                        </span>
                      </div>
                    </div>
                    {snipe.profit_usd !== undefined && (
                      <div className="mt-2 text-green-400 font-semibold animate-fade-in-up delay-400">Profit: ${snipe.profit_usd?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <span role="img" aria-label="profit">🤑</span></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400 text-center font-semibold animate-fade-in-up delay-600">
              ✓ No sniping bot activity detected <span role="img" aria-label="check">✅</span>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'liquidity-manipulation') {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <Droplet className="w-7 h-7 text-cyan-400 animate-bounce" />
            <span>Liquidity Manipulation</span>
          </h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-5 border border-cyan-400/30 flex flex-col items-center animate-fade-in-up delay-0">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Pool <span role="img" aria-label="pool">🏊‍♂️</span></div>
              <div className="font-semibold text-lg text-cyan-300 animate-fade-in-up delay-100">{results.pool_label}</div>
              <div className="text-xs text-gray-400 mt-1">Exchange: <span className="text-white">{results.exchange_name}</span></div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-cyan-400/30 flex flex-col items-center animate-fade-in-up delay-100">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Total Transactions <span role="img" aria-label="arrows">🔄</span></div>
              <div className="font-bold text-2xl text-white animate-fade-in-up delay-200">{results.total_transactions}</div>
            </div>
            <div className={`rounded-xl p-5 border flex flex-col items-center ${results.manipulations_detected > 0 ? 'bg-red-500/10 border-red-400/30 animate-pulse' : 'bg-green-500/10 border-green-400/30 animate-fade-in-up delay-200' }`}>
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Manipulation Events <span role="img" aria-label="alert">⚠️</span></div>
              <div className={`font-bold text-2xl ${results.manipulations_detected > 0 ? 'text-red-400' : 'text-green-400'}`}>{results.manipulations_detected}</div>
            </div>
          </div>
          <div className="mb-8 mt-2 bg-blue-500/10 border border-blue-400/20 rounded-xl p-4 text-blue-200 text-sm animate-fade-in-up delay-300">
            <span role="img" aria-label="info">ℹ️</span> <b>Liquidity manipulation</b> involves artificially influencing the liquidity of a pool to impact prices or trading behavior. This analysis detects such events and highlights suspicious activity.
          </div>
          {results.message && (
            <div className="mb-6 bg-blue-500/10 border border-blue-400/30 rounded-xl p-4 text-blue-300 text-sm animate-fade-in-up delay-400">
              {results.message}
            </div>
          )}
          {results.manipulations?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-cyan-300 flex items-center gap-2 animate-fade-in-up delay-500">Detected Manipulations</h3>
              <div className="space-y-4">
                {results.manipulations.map((manip, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-5 border border-cyan-400/30 animate-fade-in-up" style={{animationDelay: `${600 + idx * 80}ms`}}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="font-semibold text-cyan-200 flex items-center space-x-2">
                        <Droplet className="w-5 h-5 text-cyan-300 animate-bounce" />
                        <span>{manip.type}</span>
                        <span role="img" aria-label="type">🧪</span>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-bold bg-gradient-to-r ${manip.severity === 'HIGH' ? 'from-red-500 to-orange-500 text-white' : manip.severity === 'MEDIUM' ? 'from-yellow-400 to-orange-400 text-gray-900' : 'from-green-400 to-emerald-400 text-gray-900'}`}>{manip.severity}</span>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold ml-0 md:ml-4 mt-2 md:mt-0 ${manip.risk_score >= 70 ? 'bg-red-500/10 text-red-400' : manip.risk_score >= 40 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                        Risk Score: {manip.risk_score?.toFixed(0)} <span role="img" aria-label="score">🏅</span>
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">{manip.description}</div>
                    {manip.severity_explanation && (
                      <div className="mb-2 text-xs text-yellow-300 animate-fade-in-up delay-200">{manip.severity_explanation}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-2">
                      <div><span className="text-gray-400">Value:</span> <span className="font-bold">${manip.total_value_usd?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})} <span role="img" aria-label="usd">💰</span></span></div>
                      <div><span className="text-gray-400">Block:</span> <span className="font-bold">{manip.block_number} <span role="img" aria-label="block">📦</span></span></div>
                      <div><span className="text-gray-400">Timestamp:</span> <span className="font-bold">{manip.timestamp ? new Date(manip.timestamp).toLocaleString() : 'N/A'} <span role="img" aria-label="clock">⏰</span></span></div>
                      <div><span className="text-gray-400">Wallets:</span> {manip.involved_wallets && manip.involved_wallets.length > 0 ? (
                        <span className="flex flex-wrap gap-1">
                          {manip.involved_wallets.map((w, i) => (
                            <span key={i} className="font-mono text-xs bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded">{w} <span role="img" aria-label="wallet">👛</span></span>
                          ))}
                        </span>
                      ) : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400 text-center font-semibold animate-fade-in-up delay-600">
              ✓ No liquidity manipulation detected <span role="img" aria-label="check">✅</span>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'concentrated-attack') {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <Activity className="w-7 h-7 text-red-400 animate-bounce" />
            <span>Concentrated Attack Detection</span>
          </h2>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-5 border border-red-400/30 flex flex-col items-center animate-fade-in-up delay-0">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Pool <span role="img" aria-label="pool">🏊‍♂️</span></div>
              <div className="font-semibold text-lg text-red-300 animate-fade-in-up delay-100">{results.pool_label}</div>
              <div className="text-xs text-gray-400 mt-1">Exchange: <span className="text-white">{results.exchange_name}</span></div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-red-400/30 flex flex-col items-center animate-fade-in-up delay-100">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Attacks Detected <span role="img" aria-label="alert">⚠️</span></div>
              <div className="font-bold text-2xl text-red-400 animate-fade-in-up delay-200">{results.attacks_detected}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-red-400/30 flex flex-col items-center animate-fade-in-up delay-200">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Total Transactions <span role="img" aria-label="arrows">🔄</span></div>
              <div className="font-bold text-2xl text-white animate-fade-in-up delay-300">{results.total_transactions}</div>
            </div>
          </div>
          {results.attacks?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-red-300 flex items-center gap-2 animate-fade-in-up delay-400">Detected Attacks</h3>
              <div className="space-y-4">
                {results.attacks.map((attack, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-5 border border-red-400/30 animate-fade-in-up" style={{animationDelay: `${500 + idx * 80}ms`}}>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="font-semibold text-red-200">{attack.attack_type}</div>
                      <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded-full font-bold ml-0 md:ml-4 mt-2 md:mt-0">
                        {attack.attack_confidence}% confidence
                      </span>
                    </div>
                    <div className="font-mono text-xs text-gray-400 mb-2 break-all">{attack.attacker_address}</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-2">
                      <div><span className="text-gray-400">Block:</span> <span className="font-bold">{attack.block_number}</span></div>
                      <div><span className="text-gray-400">Transactions:</span> <span className="font-bold">{attack.transactions_count}</span></div>
                      <div><span className="text-gray-400">Price Impact:</span> <span className="font-bold">{attack.price_impact?.toFixed(2)}%</span></div>
                      <div><span className="text-gray-400">Profit:</span> <span className="font-bold">${attack.profit_estimate?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-2">Time: <span className="text-white">{new Date(attack.timestamp).toLocaleString()}</span></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400 text-center font-semibold animate-fade-in-up delay-600">
              ✓ No concentrated attacks detected <span role="img" aria-label="check">✅</span>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'pool-domination') {
      return (
        <div>
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <span>Pool Domination Analysis</span>
            <span role="img" aria-label="crown">👑</span>
          </h2>
          <div className="mb-6 flex flex-col md:flex-row md:space-x-8 space-y-2 md:space-y-0">
            <div className="flex-1 bg-white/10 rounded-xl p-5 border border-orange-400/30">
              <div className="text-sm text-gray-400 mb-1">Pool</div>
              <div className="font-semibold text-lg text-orange-300">{results.pool_label}</div>
              <div className="text-xs text-gray-400 mt-1">Exchange: <span className="text-white">{results.exchange_name}</span></div>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-5 border border-orange-400/30">
              <div className="text-sm text-gray-400 mb-1">Dominant Entities</div>
              <div className="font-bold text-2xl text-orange-400">{results.dominant_entities}</div>
            </div>
            <div className="flex-1 bg-white/10 rounded-xl p-5 border border-orange-400/30">
              <div className="text-sm text-gray-400 mb-1">Total Transactions</div>
              <div className="font-bold text-2xl text-white">{results.total_transactions}</div>
            </div>
          </div>
          {results.dominations?.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-orange-300">Dominant Wallets</h3>
              <div className="space-y-4">
                {results.dominations.map((dom, idx) => (
                  <div key={idx} className="bg-white/10 rounded-xl p-5 border border-orange-400/30">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                      <div className="font-mono text-sm text-orange-200 break-all">{dom.dominant_wallet}</div>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold ml-0 md:ml-4 mt-2 md:mt-0 ${getRiskColor(dom.risk_level)}`}>
                        {dom.risk_level} RISK
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-2">
                      <div><span className="text-gray-400">Domination:</span> <span className="font-bold text-orange-400">{dom.domination_percentage?.toFixed(1)}%</span></div>
                      <div><span className="text-gray-400">Transactions:</span> <span className="font-bold">{dom.wallet_transactions}</span> / {dom.total_transactions}</div>
                      <div><span className="text-gray-400">Volume:</span> <span className="font-bold">${dom.wallet_volume_usd?.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span></div>
                    </div>
                    <div className="text-xs text-gray-400 mb-2">{dom.risk_explanation}</div>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <div><span className="text-gray-400">Pattern:</span> <span className="px-2 py-1 bg-white/10 rounded">{dom.transaction_pattern}</span></div>
                      <div><span className="text-gray-400">Manipulation Likelihood:</span> <span className="font-semibold text-orange-400">{dom.manipulation_likelihood}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-green-400 text-center font-semibold">
              ✓ No pool domination detected - healthy distribution
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'threat-assessment') {
      // Harmonized, professional, animated Threat Assessment response with header emojis only
      const getRiskGradient = (level) => {
        switch(level?.toLowerCase()) {
          case 'critical': return 'from-red-500 to-red-700';
          case 'high': return 'from-orange-500 to-red-600';
          case 'medium': return 'from-yellow-500 to-orange-500';
          case 'low': return 'from-green-500 to-emerald-600';
          default: return 'from-gray-500 to-gray-600';
        }
      };

      return (
        <div>
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center space-x-2 animate-fade-in">
            <Shield className="w-7 h-7 text-purple-400 animate-bounce" />
            <span>Threat Assessment</span>
          </h2>
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-0">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Token <span role="img" aria-label="token">🪙</span></div>
              <div className="font-semibold text-lg text-purple-300 animate-fade-in-up delay-100">{results.token_name} ({results.token_symbol})</div>
              <div className="text-xs text-gray-400 mt-1 font-mono bg-black/30 px-3 py-1.5 rounded">{results.address}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-100">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Overall Risk <span role="img" aria-label="thermometer">🌡️</span></div>
              <div className={`text-2xl font-bold px-4 py-2 rounded-lg bg-gradient-to-r ${getRiskGradient(results.overall_risk_level)} shadow-lg animate-pulse text-yellow-400`}>{results.overall_risk_level}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-200">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Risk Score <span role="img" aria-label="chart">📈</span></div>
              <div className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent animate-fade-in-up delay-300">{results.overall_risk_score?.toFixed(1)}</div>
              <div className="mt-3 bg-gray-700 rounded-full h-2 overflow-hidden w-full">
                <div 
                  className="h-full bg-gradient-to-r from-yellow-400 to-pink-400"
                  style={{ width: `${Math.min(results.overall_risk_score || 0, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-200">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Market Cap <span role="img" aria-label="money">💰</span></div>
              <div className="text-3xl font-bold text-yellow-400 animate-fade-in-up delay-300">{typeof results.market_cap === 'number' ? `$${results.market_cap?.toLocaleString()}` : 'N/A'}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-300">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Total Holders <span role="img" aria-label="users">👥</span></div>
              <div className="text-2xl font-bold text-purple-200 animate-fade-in-up delay-400">{results.total_holders ?? 'N/A'}</div>
            </div>
            <div className="bg-white/10 rounded-xl p-5 border border-purple-400/30 flex flex-col items-center animate-fade-in-up delay-400">
              <div className="text-sm text-gray-400 mb-1 flex items-center gap-1">Last Updated <span role="img" aria-label="clock">⏰</span></div>
              <div className="text-sm font-semibold text-gray-200 animate-fade-in-up delay-500">{results.analysis_timestamp ? new Date(results.analysis_timestamp).toLocaleString() : 'N/A'}</div>
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-4 flex items-center space-x-2 animate-fade-in-up delay-500 text-yellow-400">
            <Shield className="w-6 h-6 text-yellow-400 animate-bounce" />
            <span>Risk Modules</span>
            <span role="img" aria-label="modules">📦</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(results.risk_modules || {}).map(([name, module], idx) => (
              <div 
                key={name} 
                className="bg-white/10 rounded-xl p-5 border border-yellow-400/20 animate-fade-in-up" style={{animationDelay: `${600 + idx * 80}ms`}}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <div className="font-bold text-lg mb-2 text-yellow-400 flex items-center gap-2">
                    {name.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                  <span className="px-4 py-2 rounded-lg text-sm font-bold ml-0 md:ml-4 mt-2 md:mt-0 bg-gradient-to-r from-yellow-400 to-pink-400 text-yellow-900 shadow-lg whitespace-nowrap">
                    {module.score?.toFixed(0)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed mb-3">{module.explanation}</div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-yellow-700 mb-1">
                    <span>Risk Level: {module.label}</span>
                    <span>{module.score?.toFixed(1)}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-pink-400"
                      style={{ width: `${Math.min(module.score || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">{currentTab?.label} Results</h2>
        <pre className="bg-black/30 p-4 rounded-lg overflow-auto text-xs max-h-96">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <header className="border-b border-white/10 backdrop-blur-lg bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  ChainWatch
                </h1>
                <p className="text-sm text-gray-400">Real-time Blockchain security and analytics</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>API Online</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-2 overflow-x-auto pb-4 mb-8">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                  setError(null);
                }}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {activeTab !== 'threat-assessment' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Chain</label>
                <select
                  value={chain}
                  onChange={(e) => setChain(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                >
                  <option value="eth">Ethereum</option>
                  <option value="bsc">BSC</option>
                  <option value="polygon">Polygon</option>
                  <option value="avalanche">Avalanche</option>
                </select>
              </div>
            )}

            {activeTab === 'transaction-anomaly' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Sensitivity</label>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}

            {currentTab?.input === 'token' && (
              <div className={activeTab === 'transaction-anomaly' ? 'md:col-span-2' : ''}>
                <label className="block text-sm font-medium mb-2 text-gray-300">Token Address</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
            )}

            {currentTab?.input === 'wallet' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
            )}

            {currentTab?.input === 'pair' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Liquidity Pair Address</label>
                <input
                  type="text"
                  value={pairAddress}
                  onChange={(e) => setPairAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={handleAnalysis}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-400 mb-1">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {results && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            {renderResults()}
          </div>
        )}

        {!results && !loading && !error && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-gray-300">Ready to Analyze</h3>
            <p className="text-gray-400">Enter the required address and click Analyze to detect on-chain anomalies</p>
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400 text-sm">
          <p>ChainWatch © 2025 | Powered by Moralis & Webacy</p>
        </div>
      </footer>
    </div>
  );
};

export default ChainWatchDashboard;
