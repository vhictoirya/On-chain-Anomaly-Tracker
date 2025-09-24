import React from 'react';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

interface RiskBadgeProps {
  risk: string;
  score?: number;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, score, className = '' }) => {
  const getRiskConfig = (riskLevel: string) => {
    const normalizedRisk = riskLevel.toLowerCase();
    
    if (normalizedRisk.includes('low')) {
      return {
        icon: Shield,
        className: 'risk-badge-low',
        text: 'Low Risk'
      };
    }
    
    if (normalizedRisk.includes('medium')) {
      return {
        icon: AlertTriangle,
        className: 'risk-badge-medium',
        text: 'Medium Risk'
      };
    }
    
    if (normalizedRisk.includes('high')) {
      return {
        icon: AlertCircle,
        className: 'risk-badge-high',
        text: 'High Risk'
      };
    }
    
    return {
      icon: Shield,
      className: 'bg-gray-100 text-gray-800 border border-gray-200',
      text: risk
    };
  };

  const config = getRiskConfig(risk);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.className} ${className}`}>
      <Icon className="w-4 h-4" />
      {config.text}
      {score !== undefined && (
        <span className="ml-1 font-mono">({score})</span>
      )}
    </span>
  );
};