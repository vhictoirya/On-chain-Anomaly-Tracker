'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, Layers, Search, TrendingUp, Users, Droplet, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import AlertBanner from './AlertBanner';

interface AlertBannerProps {
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
}
import { checkAPIHealth } from '../utils/api';

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
}

interface SandwichAttackResponse extends BaseResponse {
  token_address: string;
  attacks_detected: number;
  total_transactions: number;
  unique_blocks: number;
}

interface InsiderTradeResponse extends BaseResponse {
  wallet_address: string;
  total_transactions: number;
  suspicious_trades_count: number;
}

interface SnipingBotResponse extends BaseResponse {
  wallet_address: string;
  bot_confidence_score: number;
  total_snipes: number;
  success_rate: number;
}

interface LiquidityManipulationResponse extends BaseResponse {
  pair_address: string;
  manipulations_detected: number;
  total_transactions: number;
}

interface ConcentratedAttackResponse extends BaseResponse {
  pair_address: string;
  attacks_detected: number;
  total_transactions: number;
}

interface PoolDominationResponse extends BaseResponse {
  pair_address: string;
  dominant_entities: number;
  total_transactions: number;
}

interface ThreatAssessmentResponse extends BaseResponse {
  address: string;
  overall_risk_score: number;
  overall_risk_level: string;
}

type AlertType = 'critical' | 'warning' | 'info' | 'success';

interface Alert {
  id: string;
  message: string;
  type: AlertType;
  timestamp: Date;
}

// Type guards
const isTransactionAnomaly = (data: any): data is TransactionAnomalyResults => {
  return data && typeof data === 'object' && 'risk_score' in data && 'wash_trading' in data;
};

const isSandwichAttack = (data: any): data is SandwichAttackResponse => {
  return data && typeof data === 'object' && 'attacks_detected' in data;
};

const isLiquidityManipulation = (data: any): data is LiquidityManipulationResponse => {
  return data && typeof data === 'object' && 'manipulations_detected' in data;
};

const isInsiderTrade = (data: any): data is InsiderTradeResponse => {
  return data && typeof data === 'object' && 'suspicious_trades_count' in data;
};

const isThreatAssessment = (data: any): data is ThreatAssessmentResponse => {
  return data && typeof data === 'object' && 'overall_risk_score' in data;
};



const ChainWatchDashboard = () => {
  // State for alerts
  // State declarations
  const [isApiHealthy, setIsApiHealthy] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anomalyData, setAnomalyData] = useState<TransactionAnomalyResults | null>(null);
  const [sandwichData, setSandwichData] = useState<SandwichAttackResponse | null>(null);
  const [liquidityData, setLiquidityData] = useState<LiquidityManipulationResponse | null>(null);
  const [insiderData, setInsiderData] = useState<InsiderTradeResponse | null>(null);
  const [threatData, setThreatData] = useState<ThreatAssessmentResponse | null>(null);

  // Add API health check
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkAPIHealth();
      setIsApiHealthy(isHealthy);
      if (!isHealthy) {
        addAlert('API is not responding. Please try again later.', 'critical');
      }
    };
    checkHealth();
  }, []);

  // Check API health periodically
  useEffect(() => {
    const checkHealth = async () => {
      const isHealthy = await checkAPIHealth();
      setIsApiHealthy(isHealthy);
      if (!isHealthy) {
        addAlert('API is not responding. Please try again later.', 'critical');
      }
    };

    // Check health initially
    checkHealth();

    // Set up periodic health check
    const interval = setInterval(checkHealth, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

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

  const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001'}/api/v1`;

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

    let retries = 3;
    let delay = 1000; // Start with 1s delay

    try {
      while (retries > 0) {
        try {
          const queryString = encodeParams(params);
          const url = `${API_BASE}/${endpoint}?${queryString}`;
          console.log(`Fetching from: ${url}`);

          const response = await fetch(url, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            console.error(`API request failed: ${response.status} ${response.statusText}`);
            console.error('Response headers:', Object.fromEntries(response.headers.entries()));
            const errorText = await response.text();
            console.error('Response body:', errorText);
            throw new Error(`API Error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
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

          break; // Exit retry loop on success
          
        } catch (err) {
          console.error(`Attempt ${4 - retries} failed:`, err);
          retries--;

          if (retries > 0) {
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }
          throw err; // Throw the last error if all retries failed
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('All retries failed:', errorMsg);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <AlertBanner 
        alerts={[
          ...(!isApiHealthy ? [{
            id: 'api-health',
            message: 'API service is currently unavailable. Please try again later.',
            type: 'critical' as const,
            timestamp: new Date()
          }] : []),
          ...alerts,
          ...(error ? [{
            id: 'error',
            message: error,
            type: 'critical' as const,
            timestamp: new Date()
          }] : [])
        ]} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Analysis Controls */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Analysis Controls</h2>
          {/* Add your control components here */}
        </div>

        {/* Results Display */}
        <div className="p-6 bg-white rounded-lg shadow md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : results ? (
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(results, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ChainWatchDashboard;