export interface TransactionDetails {
  from: string;
  to: string;
  token: {
    name: string | null;
    symbol: string | null;
    decimals: number | null;
  };
  value: string;
  method: string | null;
  tx_type: string;
  gas_fee_eth: string;
}

export interface RiskFlags {
  gas_usage: string;
  transfer_category: string;
  approval_anomaly: boolean;
  swap_activity: boolean;
  flashloan_activity: boolean;
}

export interface TransactionAnalysisResponse {
  analysis_type: string;
  tx_hash: string;
  transaction_details: TransactionDetails;
  risk_flags: RiskFlags;
  verdict: string;
}

export interface ModuleScore {
  score: number;
  label: string;
  explain: string;
}

export interface AddressAnalysisResponse {
  address: string;
  overall_score: number;
  overall_risk: string;
  module_scores: {
    [key: string]: ModuleScore;
  };
}

export interface ApiError {
  detail: string;
}

export type AnalysisType = 'transaction' | 'address';

export interface AnalysisRequest {
  type: AnalysisType;
  value: string;
}