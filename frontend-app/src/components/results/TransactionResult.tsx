import React from 'react';
import { ExternalLink, Copy, Hash, ArrowRight, Fuel, Clock } from 'lucide-react';
import { TransactionAnalysisResponse } from '../../types/api';
import { Card } from '../ui/Card';
import { RiskBadge } from '../ui/RiskBadge';
import { formatAddress } from '../../utils/validation';
import toast from 'react-hot-toast';

interface TransactionResultProps {
  result: TransactionAnalysisResponse;
}

export const TransactionResult: React.FC<TransactionResultProps> = ({ result }) => {
  const { transaction_details, risk_flags, verdict, tx_hash } = result;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openEtherscan = (hash: string) => {
    window.open(`https://etherscan.io/tx/${hash}`, '_blank');
  };

  const getRiskColor = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('high') || lower.includes('institutional')) return 'text-red-600';
    if (lower.includes('medium') || lower.includes('active')) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="glass" className="border-l-4 border-l-primary-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Hash className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Transaction Analysis</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono">{formatAddress(tx_hash, 10)}</span>
              <button
                onClick={() => copyToClipboard(tx_hash, 'Transaction hash')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEtherscan(tx_hash)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">Transaction Type</div>
            <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
              {transaction_details.tx_type.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </Card>

      {/* Transaction Flow */}
      <Card variant="glass">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-primary-600" />
          Transaction Flow
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">From</div>
            <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
              {formatAddress(transaction_details.from)}
            </div>
          </div>
          <ArrowRight className="w-6 h-6 text-gray-400 mx-4" />
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">To</div>
            <div className="font-mono text-sm bg-white px-3 py-2 rounded border">
              {formatAddress(transaction_details.to)}
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Details */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card variant="glass">
          <h3 className="text-lg font-semibold mb-4">Transfer Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold">{transaction_details.value}</span>
            </div>
            {transaction_details.token.name && (
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-semibold">
                  {transaction_details.token.name} ({transaction_details.token.symbol})
                </span>
              </div>
            )}
            {transaction_details.method && (
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  {transaction_details.method}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <Fuel className="w-4 h-4" />
                Gas Fee:
              </span>
              <span className="font-semibold">{transaction_details.gas_fee_eth}</span>
            </div>
          </div>
        </Card>

        <Card variant="glass">
          <h3 className="text-lg font-semibold mb-4">Risk Assessment</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Gas Usage:</span>
              <span className={`font-semibold ${getRiskColor(risk_flags.gas_usage)}`}>
                {risk_flags.gas_usage.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Transfer Category:</span>
              <span className={`font-semibold ${getRiskColor(risk_flags.transfer_category)}`}>
                {risk_flags.transfer_category.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="space-y-2">
              {risk_flags.approval_anomaly && (
                <div className="flex items-center gap-2 text-yellow-600">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Approval activity detected</span>
                </div>
              )}
              {risk_flags.swap_activity && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Swap activity detected</span>
                </div>
              )}
              {risk_flags.flashloan_activity && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Flashloan activity detected</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Verdict */}
      <Card variant="glass" className="border-l-4 border-l-green-500">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-600" />
          Analysis Verdict
        </h3>
        <p className="text-gray-700 leading-relaxed">{verdict}</p>
      </Card>
    </div>
  );
};