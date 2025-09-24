import React from 'react';
import { ExternalLink, Copy, Wallet, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { AddressAnalysisResponse } from '../../types/api';
import { Card } from '../ui/Card';
import { RiskBadge } from '../ui/RiskBadge';
import { formatAddress, formatNumber } from '../../utils/validation';
import toast from 'react-hot-toast';

interface AddressResultProps {
  result: AddressAnalysisResponse;
}

export const AddressResult: React.FC<AddressResultProps> = ({ result }) => {
  const { address, overall_score, overall_risk, module_scores } = result;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openEtherscan = (address: string) => {
    window.open(`https://etherscan.io/address/${address}`, '_blank');
  };

  const getModuleIcon = (moduleName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      governance: Shield,
      liquidity: TrendingUp,
      holder: Wallet,
      token_security: Shield,
      market: TrendingUp,
      fraud: AlertTriangle,
    };
    return icons[moduleName] || Shield;
  };

  const getScoreColor = (score: number) => {
    if (score <= 23) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBarColor = (score: number) => {
    if (score <= 23) return 'bg-green-500';
    if (score <= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card variant="glass" className="border-l-4 border-l-primary-500">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              <h2 className="text-xl font-bold text-gray-900">Address Risk Analysis</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="font-mono">{formatAddress(address, 10)}</span>
              <button
                onClick={() => copyToClipboard(address, 'Address')}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEtherscan(address)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <RiskBadge risk={overall_risk} score={overall_score} />
          </div>
        </div>
      </Card>

      {/* Overall Score */}
      <Card variant="glass">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4">Overall Risk Score</h3>
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(overall_score / 100) * 314} 314`}
                className={getScoreColor(overall_score)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(overall_score)}`}>
                  {formatNumber(overall_score, 1)}
                </div>
                <div className="text-xs text-gray-500">/ 100</div>
              </div>
            </div>
          </div>
          <p className="text-gray-600">
            This address has a <strong className={getScoreColor(overall_score)}>{overall_risk}</strong> rating
          </p>
        </div>
      </Card>

      {/* Module Scores */}
      <Card variant="glass">
        <h3 className="text-lg font-semibold mb-6">Risk Breakdown by Category</h3>
        <div className="space-y-4">
          {Object.entries(module_scores).map(([moduleName, moduleData]) => {
            const Icon = getModuleIcon(moduleName);
            return (
              <div key={moduleName} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium capitalize">
                      {moduleName.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getScoreColor(moduleData.score)}`}>
                      {formatNumber(moduleData.score, 1)}
                    </span>
                    <RiskBadge risk={moduleData.label} />
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(moduleData.score)}`}
                    style={{ width: `${moduleData.score}%` }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-600">{moduleData.explain}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Risk Summary */}
      <Card variant="glass" className="border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Risk Summary
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(module_scores).filter(m => m.label.includes('Low')).length}
            </div>
            <div className="text-sm text-green-700">Low Risk Areas</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {Object.values(module_scores).filter(m => m.label.includes('Medium')).length}
            </div>
            <div className="text-sm text-yellow-700">Medium Risk Areas</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {Object.values(module_scores).filter(m => m.label.includes('High')).length}
            </div>
            <div className="text-sm text-red-700">High Risk Areas</div>
          </div>
        </div>
      </Card>
    </div>
  );
};