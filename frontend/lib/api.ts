export interface TransactionAnalysisResult {
  analysis_type: string
  tx_hash: string
  transaction_details: {
    from: string
    to: string
    token?: {
      name: string
      symbol: string
      decimals: string
    }
    value: string
    method: string
    tx_type: string
    gas_fee_eth: string
  }
  risk_flags: {
    gas_usage: string
    transfer_category: string
    approval_anomaly: boolean
    swap_activity: boolean
    flashloan_activity: boolean
  }
  verdict: string
}

export interface AddressAnalysisResult {
  address: string
  overall_score: number
  overall_risk: string
  module_scores: {
    [key: string]: {
      score: number
      label: string
      explain: string
    }
  }
}

// Fetch transaction analysis via GET
export async function analyzeTransaction(txHash: string): Promise<TransactionAnalysisResult> {
  const response = await fetch(`/api/analyze/transaction?txHash=${encodeURIComponent(txHash)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze transaction")
  }
  
  return response.json()
}

// Fetch address analysis via GET
export async function analyzeAddress(address: string): Promise<AddressAnalysisResult> {
  const response = await fetch(`/api/analyze/address?address=${encodeURIComponent(address)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to analyze address")
  }
  
  return response.json()
}

// Mock data for development/demo purposes
export const mockTransactionData: TransactionAnalysisResult = {
  analysis_type: "transaction_analysis",
  tx_hash: "0xb53405eb99d8093da87f682be0ddd9b24726e091f6e03dbbd4842f8c5c1d663d",
  transaction_details: {
    from: "0x2aafce1a2414fbd41a9dedfbc5f03268a3331856",
    to: "0x0cbab20559a407fd5e003f8100bce38a3dda78e2",
    token: {
      name: "USDC",
      symbol: "usdc",
      decimals: "6",
    },
    value: "5.749978 usdc",
    method: "transfer",
    tx_type: "erc20_transfer",
    gas_fee_eth: "0.00001017 ETH",
  },
  risk_flags: {
    gas_usage: "normal",
    transfer_category: "retail_sender",
    approval_anomaly: false,
    swap_activity: false,
    flashloan_activity: false,
  },
  verdict: "This is a standard ERC20 transfer of 5.749978 usdc with normal gas usage. No anomalies detected.",
}

export const mockAddressData: AddressAnalysisResult = {
  address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  overall_score: 37.6,
  overall_risk: "Medium Risk",
  module_scores: {
    governance: {
      score: 41.67,
      label: "Medium Risk",
      explain: "Contract ownership is controlled (centralized access).",
    },
    liquidity: {
      score: 80,
      label: "High Risk",
      explain:
        "Liquidity is unlocked, posing exit risk. 0.0% of liquidity is locked. Creator controls 0.0% of liquidity pool.",
    },
    holder: {
      score: 54.07,
      label: "High Risk",
      explain: "Top 10 wallets hold 54.1% of total supply.",
    },
    token_security: {
      score: 30,
      label: "Medium Risk",
      explain: "Buy tax: 0.0%. Token has blacklisting enabled. Token is flagged as trusted.",
    },
    market: {
      score: 19.87,
      label: "Low Risk",
      explain: "7d volatility: -0.0%. ATH change: -24.4%. ATL change: 74.7%. Market cap rank: 3.",
    },
    fraud: {
      score: 0,
      label: "Low Risk",
      explain: "No fraud indicators found.",
    },
  },
}
