'use client';

import React, { useState } from 'react';

// Type Guards
// Used to determine the type of results from API responses
const isTransactionAnomaly = (results: unknown): results is TransactionAnomalyResults => {
  return typeof results === 'object' && results !== null && 'wash_trading' in results && 'price_manipulation' in results && 'pump_and_dump' in results;
};

const isSandwichAttack = (results: unknown): results is SandwichAttackResponse => {
  return typeof results === 'object' && results !== null && 'attacks_detected' in results && 'unique_blocks' in results;
};

const isInsiderTrade = (results: unknown): results is InsiderTradeResponse => {
  return typeof results === 'object' && results !== null && 'suspicious_trades' in results;
};

const isSnipingBot = (results: unknown): results is SnipingBotResponse => {
  return typeof results === 'object' && results !== null && 'bot_confidence_score' in results;
};

const isLiquidityManipulation = (results: unknown): results is LiquidityManipulationResponse => {
  return typeof results === 'object' && results !== null && 'manipulations_detected' in results && 'manipulations' in results;
};

const isConcentratedAttack = (results: unknown): results is ConcentratedAttackResponse => {
  return typeof results === 'object' && results !== null && 'attacks_detected' in results && 'attacks' in results;
};

const isPoolDomination = (results: unknown): results is PoolDominationResponse => {
  return typeof results === 'object' && results !== null && 'dominant_entities' in results && 'dominations' in results;
};

const isThreatAssessment = (results: unknown): results is ThreatAssessmentResponse => {
  return typeof results === 'object' && results !== null && 'overall_risk_score' in results && 'risk_modules' in results;
};

// Response Types
interface BaseResponse {
  message: string;
  chain: string;
}

interface TransactionAnomalyResults {
  risk_score: number;
  risk_level: string;
  total_transactions: number;
  chain: string;
  wash_trading: {
    detected_count: number;
    total_suspicious_volume: number;
    top_suspicious_wallets: Array<{
      wallet: string;
      round_trips: number;
      total_volume: number;
      num_trades: number;
    }>;
  };
  price_manipulation: {
    total_events: number;
    highest_spike: number;
  };
  pump_and_dump: {
    num_schemes: number;
    high_confidence: Array<{ wallet: string; confidence: number }>;
  };
}

interface SandwichAttackResponse extends BaseResponse {
  token_address: string;
  total_transactions: number;
  unique_blocks: number;
  attacks_detected: number;
  attacks: Array<{
    attacker_address: string;
    victim_address: string;
    block_number: number;
    timestamp: string;
    profit_usd: number;
    pair: string;
    front_run_hash: string;
    victim_hash: string;
    back_run_hash: string;
  }>;
}

interface InsiderTradeResponse extends BaseResponse {
  wallet_address: string;
  total_transactions: number;
  suspicious_trades_count: number;
  suspicious_trades: Array<{
    token_symbol: string;
    token_address: string;
    suspicion_score: number;
    entry_price: number;
    current_price: number;
    price_change_percent: number;
    position_value: number;
    time_since_entry: string;
    entry_tx_hash: string;
    entry_block: number;
    flags: string[];
  }>;
}

interface SnipingBotResponse extends BaseResponse {
  wallet_address: string;
  bot_confidence_score: number;
  total_snipes: number;
  successful_snipes: number;
  success_rate: number;
  total_volume_usd: number;
  tokens_sniped: string[];
  classification: string;
  recent_snipes: Array<{
    token: string;
    amount: number;
    value_usd: number;
    block_number: number;
    tx_index: number;
    tx_hash: string;
    timestamp: string;
  }>;
}

interface LiquidityManipulationResponse extends BaseResponse {
  pair_address: string;
  pool_label: string;
  exchange_name: string;
  total_transactions: number;
  manipulations_detected: number;
  manipulations: Array<{
    type: string;
    severity: string;
    timestamp: string;
    block_number: number;
    involved_wallets: string[];
    total_value_usd: number;
    description: string;
    risk_score: number;
  }>;
}

interface ConcentratedAttackResponse extends BaseResponse {
  pair_address: string;
  pool_label: string;
  exchange_name: string;
  total_transactions: number;
  attacks_detected: number;
  attacks: Array<{
    attacker_address: string;
    attack_type: string;
    timestamp: string;
    block_number: number;
    transactions_count: number;
    price_impact: number;
    profit_estimate: number;
    attack_confidence: number;
  }>;
}

interface PoolDominationResponse extends BaseResponse {
  pair_address: string;
  pool_label: string;
  exchange_name: string;
  total_transactions: number;
  dominant_entities: number;
  dominations: Array<{
    dominant_wallet: string;
    domination_percentage: number;
    wallet_transactions: number;
    total_transactions: number;
    wallet_volume_usd: number;
    total_volume_usd: number;
    transaction_pattern: string;
    risk_level: string;
    risk_explanation: string;
    manipulation_likelihood: number;
  }>;
}


interface ThreatAssessmentResponse extends BaseResponse {
  address: string;
  token_name: string;
  token_symbol: string;
  market_cap: number | string;
  current_price: number | string;
  overall_risk_score: number;
  overall_risk_level: string;
  risk_modules: {
    [key: string]: {
      score: number;
      label: string;
      explanation: string;
    }
  };
  top_risk_contributors: Array<{
    module: string;
    score: number;
  }>;
}
import { Shield, AlertTriangle, Activity, Layers, Search, TrendingUp, Users, Droplet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AlertBanner from './AlertBanner';

// Your complete React component code here
const ChainWatchDashboard = () => {
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    message: string;
    type: 'critical' | 'warning' | 'info' | 'success';
    timestamp: Date;
  }>>([]);

  const addAlert = (message: string, type: 'critical' | 'warning' | 'info' | 'success') => {
    setAlerts(prev => [{
      id: Math.random().toString(36).substring(7),
      message,
      type,
      timestamp: new Date()
    }, ...prev]);
  };
  const [activeTab, setActiveTab] = useState('transaction');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    | SandwichAttackResponse
    | InsiderTradeResponse
    | SnipingBotResponse
    | LiquidityManipulationResponse
    | ConcentratedAttackResponse
    | PoolDominationResponse
    | ThreatAssessmentResponse
    | TransactionAnomalyResults
    | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [tokenAddress, setTokenAddress] = useState('0x6982508145454ce325ddbe47a25d4ec3d2311933');
  const [walletAddress, setWalletAddress] = useState('0xcB1C1FdE09f811B294172696404e88E658659905');
  const [pairAddress, setPairAddress] = useState('0xa43fe16908251ee70ef74718545e4fe6c5ccec9f');
  const [chain, setChain] = useState('eth');
  const [sensitivity, setSensitivity] = useState('medium');

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://chainwatch-6ggd7vuu0-vhictoiryas-projects.vercel.app/api/v1';

  // Fix URL encoding for special characters
  const encodeParams = (params: Record<string, string | number>) => {
    return Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  };

  const analyzeData = async (endpoint: string, params: Record<string, string | number>) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const queryString = encodeParams(params);
      const response = await fetch(`${API_BASE}/${endpoint}?${queryString}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data);
      
      // Generate alerts based on analysis results
      if ('risk_score' in data && data.risk_score >= 80) {
        addAlert(`Critical Risk Detected - Score: ${data.risk_score}/100`, 'critical');
      } else if ('risk_score' in data && data.risk_score >= 60) {
        addAlert(`High Risk Activity - Score: ${data.risk_score}/100`, 'warning');
      }

      if ('attacks_detected' in data && data.attacks_detected > 0) {
        addAlert(`${data.attacks_detected} potential attacks identified!`, 'critical');
      }

      if ('manipulations_detected' in data && data.manipulations_detected > 0) {
        addAlert(`${data.manipulations_detected} manipulation events detected!`, 'warning');
      }

      if ('wash_trading' in data && data.wash_trading.detected_count > 0) {
        addAlert(`${data.wash_trading.detected_count} wash trading instances found`, 'warning');
      }

      if ('suspicious_trades_count' in data && data.suspicious_trades_count > 0) {
        addAlert(`${data.suspicious_trades_count} suspicious trades detected`, 'warning');
      }

      if ('overall_risk_score' in data && data.overall_risk_score >= 75) {
        addAlert(`High threat level detected - ${data.overall_risk_level}`, 'critical');
      }

      // Add success alert when no issues are found
      if (!data.attacks_detected && !data.manipulations_detected && 
          (!('wash_trading' in data) || data.wash_trading.detected_count === 0)) {
        addAlert('No significant threats detected', 'success');
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMsg);
      addAlert(errorMsg, 'critical');
    } finally {
      setLoading(false);
    }
  };

  const handleTransactionAnalysis = () => {
    analyzeData('transaction-anomaly', {
      token_address: tokenAddress,
      chain,
      sensitivity,
      limit: 100,
      max_pages: 5
    });
  };

  const handleSandwichAttack = () => {
    analyzeData('sandwich-attack', {
      token_address: tokenAddress,
      chain,
      num_transactions: 100
    });
  };

  const handleInsiderTrading = () => {
    analyzeData('insider-trading', {
      wallet_address: walletAddress,
      chain,
      min_suspicion_score: 30
    });
  };

  const handleSnipingBot = () => {
    analyzeData('sniping-bot', {
      wallet_address: walletAddress,
      chain
    });
  };

  const handleLiquidityManipulation = () => {
    analyzeData('liquidity-manipulation', {
      pair_address: pairAddress,
      chain,
      num_transactions: 100
    });
  };

  const handleConcentratedAttack = () => {
    analyzeData('concentrated-attack', {
      pair_address: pairAddress,
      chain,
      num_transactions: 100
    });
  };

  const handlePoolDomination = () => {
    analyzeData('pool-domination', {
      pair_address: pairAddress,
      chain,
      num_transactions: 100
    });
  };

  const handleThreatAssessment = () => {
    analyzeData('threat-assessment', {
      address: tokenAddress
    });
  };

  const getRiskColor = (level: string): string => {
    const colors: { [key: string]: string } = {
      MINIMAL: 'text-green-600 bg-green-50',
      LOW: 'text-blue-600 bg-blue-50',
      MEDIUM: 'text-yellow-600 bg-yellow-50',
      HIGH: 'text-orange-600 bg-orange-50',
      CRITICAL: 'text-red-600 bg-red-50'
    };
    return colors[level] || 'text-gray-600 bg-gray-50';
  };

  const tabs = [
    { id: 'transaction', label: 'Transaction Anomaly', icon: Activity },
    { id: 'sandwich', label: 'Sandwich Attack', icon: Layers },
    { id: 'insider', label: 'Insider Trading', icon: TrendingUp },
    { id: 'sniping', label: 'Sniping Bot', icon: Users },
    { id: 'manipulation', label: 'Liquidity Manipulation', icon: Droplet },
    { id: 'concentrated', label: 'Concentrated Attack', icon: AlertTriangle },
    { id: 'domination', label: 'Pool Domination', icon: Users },
    { id: 'threat', label: 'Threat Assessment', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <AlertBanner alerts={alerts} />
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-lg bg-gradient-to-r from-slate-900/50 via-purple-900/50 to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-500 rounded-2xl shadow-lg shadow-purple-500/20 animate-pulse">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                  ChainWatch
                </h1>
                <p className="text-sm font-medium text-gray-400">Real-time Blockchain Security & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-400 rounded-full flex items-center space-x-2 shadow-lg shadow-green-500/10 backdrop-blur-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>API Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
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
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 whitespace-nowrap ${
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

        {/* Input Forms */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Chain Selector */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Chain</label>
              <select
                value={chain}
                onChange={(e) => setChain(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="eth">Ethereum</option>
                <option value="bsc">BSC</option>
                <option value="polygon">Polygon</option>
                <option value="avalanche">Avalanche</option>
              </select>
            </div>

            {/* Conditional Inputs */}
            {(activeTab === 'transaction' || activeTab === 'sandwich' || activeTab === 'threat') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Token Address</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {(activeTab === 'insider' || activeTab === 'sniping') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Wallet Address</label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {(activeTab === 'manipulation' || activeTab === 'concentrated' || activeTab === 'domination') && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Pair Address</label>
                <input
                  type="text"
                  value={pairAddress}
                  onChange={(e) => setPairAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            )}

            {activeTab === 'transaction' && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Sensitivity</label>
                <select
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              if (activeTab === 'transaction') handleTransactionAnalysis();
              else if (activeTab === 'sandwich') handleSandwichAttack();
              else if (activeTab === 'insider') handleInsiderTrading();
              else if (activeTab === 'sniping') handleSnipingBot();
              else if (activeTab === 'manipulation') handleLiquidityManipulation();
              else if (activeTab === 'concentrated') handleConcentratedAttack();
              else if (activeTab === 'domination') handlePoolDomination();
              else if (activeTab === 'threat') handleThreatAssessment();
            }}
            disabled={loading}
            className="group relative w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center space-x-3 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:opacity-50 hover:scale-[1.02] duration-300"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin shadow-lg shadow-purple-500/20"></div>
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

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-8 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="space-y-6 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-transparent pointer-events-none" />
            {/* Transaction Anomaly Results */}
            {activeTab === 'transaction' && results && 'wash_trading' in results && (
              <>
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                  <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Risk Score</p>
                      <p className="text-3xl font-bold">{(results as TransactionAnomalyResults).risk_score.toFixed(1)}/100</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor((results as any).risk_level)}`}>
                        {(results as TransactionAnomalyResults).risk_level}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                      <p className="text-3xl font-bold">{(results as TransactionAnomalyResults).total_transactions}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Chain</p>
                      <p className="text-2xl font-bold uppercase">{results.chain}</p>
                    </div>
                  </div>

                  {/* Wash Trading */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      <span>Wash Trading Detection</span>
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="mb-2">Suspicious Wallets: <span className="font-bold text-yellow-400">{(results as TransactionAnomalyResults).wash_trading.detected_count}</span></p>
                      <p className="mb-2">Total Suspicious Volume: <span className="font-bold text-yellow-400">${results.wash_trading.total_suspicious_volume.toLocaleString()}</span></p>
                      {results.wash_trading.top_suspicious_wallets.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-400 mb-2">Top Suspicious Wallets:</p>
                          {results.wash_trading.top_suspicious_wallets.map((wallet, idx) => (
                            <div key={idx} className="bg-white/5 rounded p-3 mb-2 text-sm">
                              <p className="font-mono text-xs mb-1">{wallet.wallet}</p>
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <span>Round Trips: {wallet.round_trips}</span>
                                <span>Volume: ${wallet.total_volume.toFixed(2)}</span>
                                <span>Trades: {wallet.num_trades}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price Manipulation */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-red-400" />
                      <span>Price Manipulation</span>
                    </h3>

                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-gray-400 mb-1">Suspicious Events</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xl text-red-400">{(results as TransactionAnomalyResults).price_manipulation.total_events}</span>
                            <span className="text-sm text-gray-400">{(results as TransactionAnomalyResults).price_manipulation.total_events === 1 ? 'instance' : 'instances'} of rapid price spikes with abnormal trading volume</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Price Impact</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xl text-red-400">{(results.price_manipulation.highest_spike * 100).toFixed(2)}%</span>
                            <span className="text-sm text-gray-400">largest single price movement detected</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pump & Dump */}
                  <div>
                    <h3 className="text-xl font-semibold mb-3 flex items-center space-x-2">

                      <Activity className="w-5 h-5 text-purple-400" />
                      <span>Pump & Dump Detection</span>
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-gray-400 mb-1">Total Schemes</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xl text-purple-400">{(results as TransactionAnomalyResults).pump_and_dump.num_schemes}</span>
                            <span className="text-sm text-gray-400">coordinated price inflation followed by mass sell-offs</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">High Confidence</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xl text-purple-400">{results.pump_and_dump.high_confidence.length}</span>
                            <span className="text-sm text-gray-400">verified manipulation patterns</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Sandwich Attack Results */}
            {activeTab === 'sandwich' && results && isSandwichAttack(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Sandwich Attack Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Attacks Detected</p>
                    <p className="text-3xl font-bold text-red-400">{results.attacks_detected}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Transactions Analyzed</p>
                    <p className="text-3xl font-bold">{results.total_transactions}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Unique Blocks</p>
                    <p className="text-3xl font-bold">{results.unique_blocks}</p>
                  </div>
                </div>
                <p className={`flex items-center space-x-2 ${results.attacks_detected > 0 ? 'text-red-400' : 'text-green-400'} mb-6`}>
                  {results.attacks_detected > 0 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  <span>{results.message}</span>
                </p>

                {/* Detected Attacks */}
                {results.attacks_detected > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Detected Attacks</h3>
                                              {results.attacks.map((attack: SandwichAttackResponse['attacks'][0], idx: number) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Pool</p>
                            <p className="font-semibold">{attack.pair}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Profit</p>
                            <p className="font-bold text-red-400">${attack.profit_usd.toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Attacker</p>
                            <p className="font-mono text-sm truncate">{attack.attacker_address}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Victim</p>
                            <p className="font-mono text-sm truncate">{attack.victim_address}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-gray-400 text-sm mb-2">Transaction Sequence</p>
                          <div className="space-y-2 text-sm">
                            <p>
                              <span className="text-yellow-400">Front Run:</span>{" "}
                              <span className="font-mono">{attack.front_run_hash}</span>
                            </p>
                            <p>
                              <span className="text-red-400">Victim TX:</span>{" "}
                              <span className="font-mono">{attack.victim_hash}</span>
                            </p>
                            <p>
                              <span className="text-green-400">Back Run:</span>{" "}
                              <span className="font-mono">{attack.back_run_hash}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 text-sm text-gray-400">
                          <p>Block: {attack.block_number} | Time: {new Date(attack.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Insider Trading Results */}
            {activeTab === 'insider' && results && isInsiderTrade(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Insider Trading Analysis</h2>
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div>
                        <p className="text-gray-400 mb-1">Detected Patterns</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xl text-yellow-400">{results.suspicious_trades_count}</span>
                          <span className="text-sm text-gray-400">instances of early position entries before price movements</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div>
                        <p className="text-gray-400 mb-1">Analysis Coverage</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xl">{results.total_transactions}</span>
                          <span className="text-sm text-gray-400">transactions analyzed for trading patterns</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Suspicious Trade Details */}
                  {results.suspicious_trades.map((trade, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 mb-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-xl">{trade.token_symbol}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            trade.suspicion_score >= 70 ? 'bg-red-500/20 text-red-400' : 
                            trade.suspicion_score >= 40 ? 'bg-yellow-500/20 text-yellow-400' : 
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            Suspicion Score: {trade.suspicion_score.toFixed(0)}%
                          </span>
                        </div>
                        <span className="text-sm text-gray-400">{trade.time_since_entry} ago</span>
                      </div>
                      
                      {/* Trade Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-gray-400 mb-1">Price Movement</p>
                          <div className="flex items-center space-x-2">
                            <span className={`font-bold text-lg ${trade.price_change_percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.price_change_percent > 0 ? '+' : ''}{trade.price_change_percent.toFixed(2)}%
                            </span>
                            <span className="text-sm text-gray-400">since position entry</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Position Value</p>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-lg">${trade.position_value.toLocaleString()}</span>
                            <span className="text-sm text-gray-400">current market value</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Entry Details */}
                      <div className="text-sm text-gray-400 space-y-1">
                        <p className="font-mono">Entry TX: {trade.entry_tx_hash}</p>
                        <p>Block: {trade.entry_block}</p>
                      </div>

                      {/* Flags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {trade.flags.map((flag: string, i: number) => (
                          <span key={i} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">{flag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sniping Bot Results */}
            {activeTab === 'sniping' && results && isSnipingBot(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Sniping Bot Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Confidence Score</p>
                    <p className="text-3xl font-bold">{results.bot_confidence_score.toFixed(0)}/100</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Snipes</p>
                    <p className="text-3xl font-bold">{results.total_snipes}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Success Rate</p>
                    <p className="text-3xl font-bold">{results.success_rate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Volume</p>
                    <p className="text-2xl font-bold">${results.total_volume_usd.toFixed(2)}</p>
                  </div>
                </div>
                <div className="mb-6">
                  <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                    results.bot_confidence_score >= 70 ? 'bg-red-500/20 text-red-400' :
                    results.bot_confidence_score >= 50 ? 'bg-orange-500/20 text-orange-400' :
                    results.bot_confidence_score >= 30 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {results.classification}
                  </span>
                </div>

                {/* Recent Snipes */}
                <div className="space-y-4">
                  {/* Sniped Tokens */}
                  <div className="bg-white/5 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-3">Sniped Tokens ({results.tokens_sniped.length})</h3>
                    <div className="flex flex-wrap gap-2">
                      {results.tokens_sniped.map((token: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                    <div className="space-y-3">
                      {results.recent_snipes.map((snipe: SnipingBotResponse['recent_snipes'][0], idx: number) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Token</p>
                              <p className="font-semibold">{snipe.token}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm mb-1">Amount</p>
                              <p className="font-semibold">{snipe.amount.toLocaleString()} <span className="text-sm text-gray-400">(${snipe.value_usd.toFixed(2)})</span></p>
                            </div>
                          </div>

                          <div className="text-sm text-gray-400 space-y-1">
                            <p>Block: {snipe.block_number} | TX Index: {snipe.tx_index}</p>
                            <p>Time: {new Date(snipe.timestamp).toLocaleString()}</p>
                            <p className="font-mono text-xs truncate">TX: {snipe.tx_hash}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Liquidity Manipulation Results */}
            {activeTab === 'manipulation' && results && isLiquidityManipulation(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Liquidity Manipulation Analysis</h2>
                  <div className="text-sm text-gray-400 max-w-lg text-right"></div>
                  <div className="text-sm text-gray-400 max-w-lg text-right"></div>
                </div>
                
                {/* Pool Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pool</p>
                    <p className="text-lg font-bold">{results.pool_label}</p>
                    <p className="text-sm text-gray-400">{results.exchange_name}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Manipulations Detected</p>
                    <p className="text-3xl font-bold text-red-400">{results.manipulations_detected}</p>
                  </div>
                </div>
                
                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold">{results.total_transactions}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Chain</p>
                    <p className="text-2xl font-bold uppercase">{results.chain}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pair Address</p>
                    <p className="text-sm font-mono truncate">{results.pair_address}</p>
                  </div>
                </div>

                {/* Manipulation Events */}
                {results.manipulations_detected > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Detected Manipulation Events</h3>
                    {results.manipulations.map((event: LiquidityManipulationResponse['manipulations'][0], idx: number) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                              event.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' :
                              event.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {event.type} - {event.severity}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400">
                            Risk Score: <span className="font-bold">{event.risk_score.toFixed(0)}/100</span>
                          </div>
                        </div>

                        <p className="text-gray-300 mb-3">{event.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Value Involved</p>
                            <p className="font-bold">${event.total_value_usd.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Timestamp</p>
                            <p>{new Date(event.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm text-gray-400 mb-2">Involved Wallets ({event.involved_wallets.length})</p>
                          <div className="space-y-1">
                            {event.involved_wallets.map((wallet: string, i: number) => (
                              <p key={i} className="font-mono text-sm truncate">{wallet}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Message */}
                <div className={`mt-6 p-4 rounded-lg ${
                  results.manipulations_detected > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  <p className="flex items-center space-x-2">
                    {results.manipulations_detected > 0 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span>{results.message}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Concentrated Attack Results */}
            {activeTab === 'concentrated' && results && isConcentratedAttack(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Concentrated Attack Analysis</h2>
                
                {/* Pool Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pool</p>
                    <p className="text-lg font-bold">{results.pool_label}</p>
                    <p className="text-sm text-gray-400">{results.exchange_name}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Attacks Detected</p>
                    <p className="text-3xl font-bold text-red-400">{results.attacks_detected}</p>
                  </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold">{results.total_transactions}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Chain</p>
                    <p className="text-2xl font-bold uppercase">{results.chain}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pair Address</p>
                    <p className="text-sm font-mono truncate">{results.pair_address}</p>
                  </div>
                </div>

                {/* Attack Events */}
                {results.attacks_detected > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Detected Attack Events</h3>
                    {results.attacks.map((attack, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            attack.attack_confidence >= 0.7 ? 'bg-red-500/20 text-red-400' :
                            attack.attack_confidence >= 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {attack.attack_type}
                          </span>
                          <div className="text-sm text-gray-400">
                            Confidence: <span className="font-bold">{(attack.attack_confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Attacker</p>
                            <p className="font-mono truncate">{attack.attacker_address}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Profit Estimate</p>
                            <p className="font-bold text-red-400">${attack.profit_estimate.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Price Impact</p>
                            <p className="font-bold">{attack.price_impact.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Transaction Count</p>
                            <p className="font-bold">{attack.transactions_count}</p>
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-gray-400">
                          <p>Block: {attack.block_number} | Time: {new Date(attack.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Message */}
                <div className={`mt-6 p-4 rounded-lg ${
                  results.attacks_detected > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  <p className="flex items-center space-x-2">
                    {results.attacks_detected > 0 ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span>{results.message}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Pool Domination Results */}
            {activeTab === 'domination' && results && isPoolDomination(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Pool Domination Analysis</h2>
                  <div className="text-sm text-gray-400 max-w-lg text-right"></div>
                  <div className="text-sm text-gray-400 max-w-lg text-right"></div>
                </div>
                
                {/* Pool Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pool</p>
                    <p className="text-lg font-bold">{results.pool_label}</p>
                    <p className="text-sm text-gray-400">{results.exchange_name}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Dominant Entities</p>
                    <p className="text-3xl font-bold text-yellow-400">{results.dominant_entities}</p>
                  </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Total Transactions</p>
                    <p className="text-3xl font-bold">{results.total_transactions}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Chain</p>
                    <p className="text-2xl font-bold uppercase">{results.chain}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-sm text-gray-400 mb-1">Pair Address</p>
                    <p className="text-sm font-mono truncate">{results.pair_address}</p>
                  </div>
                </div>

                {/* Domination Events */}
                {results.dominations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold mb-4">Dominant Wallets</h3>
                    {results.dominations.map((dom, idx) => (
                      <div key={idx} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                            dom.manipulation_likelihood >= 0.7 ? 'bg-red-500/20 text-red-400' :
                            dom.manipulation_likelihood >= 0.4 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {dom.risk_level}
                          </span>
                          <p className="text-sm text-gray-400 mt-2">{dom.risk_explanation}</p>
                          <div className="text-sm text-gray-400">
                            Manipulation Likelihood: <span className="font-bold">{(dom.manipulation_likelihood * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-400 mb-1">Wallet</p>
                            <p className="font-mono truncate">{dom.dominant_wallet}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Domination Percentage</p>
                            <p className="font-bold text-yellow-400">{dom.domination_percentage.toFixed(2)}%</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Volume</p>
                            <p className="font-bold">${dom.wallet_volume_usd.toLocaleString()} / ${dom.total_volume_usd.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 mb-1">Transactions</p>
                            <p className="font-bold">{dom.wallet_transactions} / {dom.total_transactions}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <p className="text-gray-400 mb-1">Trading Pattern</p>
                          <p className="text-sm">{dom.transaction_pattern}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Message */}
                <div className={`mt-6 p-4 rounded-lg ${
                  results.dominant_entities > 0 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                }`}>
                  <p className="flex items-center space-x-2">
                    {results.dominant_entities > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    <span>{results.message}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Threat Assessment Results */}
            {activeTab === 'threat' && results && isThreatAssessment(results) && (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h2 className="text-2xl font-bold mb-4">Threat Assessment</h2>
                <div className="mb-6">
                  <h3 className="text-xl mb-2">{results.token_name} ({results.token_symbol})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Overall Risk Score</p>
                      <p className="text-3xl font-bold">{results.overall_risk_score.toFixed(1)}/100</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Risk Level</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(results.overall_risk_level)}`}>
                        {results.overall_risk_level}
                      </span>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-sm text-gray-400 mb-1">Market Cap</p>
                      <p className="text-2xl font-bold">${typeof results.market_cap === 'number' ? results.market_cap.toLocaleString() : results.market_cap}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold mb-2">Risk Breakdown</h3>
                  {Object.entries(results.risk_modules).map(([key, module]) => (
                    <div key={key} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold capitalize">{key.replace('_', ' ')}</span>
                        <span className={`px-3 py-1 rounded-full text-sm ${getRiskColor((module as ThreatAssessmentResponse['risk_modules'][string]).label)}`}>
                          {(module as ThreatAssessmentResponse['risk_modules'][string]).score.toFixed(1)} - {(module as ThreatAssessmentResponse['risk_modules'][string]).label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">{(module as ThreatAssessmentResponse['risk_modules'][string]).explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!results && !loading && !error && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
            <h3 className="text-xl font-semibold mb-2 text-gray-300">Ready to Analyze</h3>
            <p className="text-gray-400">Enter an address and click "Analyze" to detect on-chain anomalies</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-gray-400 text-sm">
          <p>ChainWatch Anomaly Detection © 2025 | Powered by Moralis & Webacy</p>
        </div>
      </footer>
    </div>
  );
};

export default ChainWatchDashboard;