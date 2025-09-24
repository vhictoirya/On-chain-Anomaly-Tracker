"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, TrendingUp, TrendingDown, Minus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpeedometerGauge } from "@/components/speedometer-gauge"
import { RadarChart } from "@/components/radar-chart"
import { RiskTimeline } from "@/components/risk-timeline"

const riskMap = {
  low: { color: "text-green-400", badge: "text-green-400 border-green-400/30 bg-green-500/10", icon: <CheckCircle className="h-4 w-4" /> },
  medium: { color: "text-yellow-400", badge: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { color: "text-red-400", badge: "text-red-400 border-red-400/30 bg-red-500/10", icon: <XCircle className="h-4 w-4" /> },
  default: { color: "text-muted-foreground", badge: "text-muted-foreground border-muted-foreground/30 bg-muted/10", icon: <CheckCircle className="h-4 w-4" /> }
}

const getRisk = (risk: string) => riskMap[risk.toLowerCase()] || riskMap.default

interface ModuleScore {
  score: number
  label: string
  explain: string
}

interface AddressAnalysisData {
  address: string
  overall_score: number
  overall_risk?: string
  module_scores: {
    [key: string]: ModuleScore
  }
  risk_trend?: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
    timeframe: string
  }
  last_updated?: string
  transaction_count?: number
  balance?: string
  first_seen?: string
}

interface AddressAnalysisProps {
  data: AddressAnalysisData
}

export function AddressAnalysis({ data }: AddressAnalysisProps) {
  const [copied, setCopied] = useState(false)

  const getRiskLevel = (score: number): string => {
    if (score >= 7) return "High"
    if (score >= 4) return "Medium"
    return "Low"
  }

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-400" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-400" />
      default: return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return "text-red-400"
      case 'down': return "text-green-400"
      default: return "text-muted-foreground"
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  const openEtherscan = () => {
    window.open(`https://etherscan.io/address/${data.address}`, '_blank', 'noopener,noreferrer')
  }

  const formatModuleName = (module: string): string => {
    return module
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Determine overall risk if not provided
  const overallRisk = data.overall_risk || getRiskLevel(data.overall_score)
  const { color, badge, icon } = getRisk(overallRisk)

  // Mock timeline data - replace with API data in real implementation
  const mockTimelineEvents = [
    {
      timestamp: data.last_updated || "2 minutes ago",
      event: "Risk Assessment Updated",
      risk_level: "low" as const,
      description: "Latest security analysis completed successfully",
    },
    {
      timestamp: "2 hours ago",
      event: "Transaction Pattern Analysis",
      risk_level: data.overall_score >= 7 ? "high" as const : data.overall_score >= 4 ? "medium" as const : "low" as const,
      description: "Analyzed recent transaction patterns for anomalies",
    },
    {
      timestamp: "1 day ago",
      event: "Address Reputation Check",
      risk_level: "low" as const,
      description: "Checked against known threat databases",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Address Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <CardTitle className="flex items-center gap-2">
                  Address Analysis
                  <Badge variant="outline" className={badge}>{overallRisk}</Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-2 flex items-center gap-2 break-all">
                  <span className="truncate">{data.address}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.address)}
                    className="h-6 w-6 p-0 flex-shrink-0"
                    title="Copy address"
                  >
                    {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-transparent flex-shrink-0"
                onClick={openEtherscan}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View on Etherscan</span>
                <span className="sm:hidden">Etherscan</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Overall Risk Score</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{data.overall_score.toFixed(1)}</span>
                  <div className="flex items-center gap-1">
                    {icon}
                    <span className={`font-medium text-sm ${color}`}>{overallRisk}</span>
                  </div>
                </div>
                <Progress value={(data.overall_score / 10) * 100} className="h-2" />
              </div>

              {data.risk_trend && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Risk Trend</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(data.risk_trend.direction)}
                    <span className={`text-sm font-medium ${getTrendColor(data.risk_trend.direction)}`}>
                      {data.risk_trend.direction === 'up' ? '+' : data.risk_trend.direction === 'down' ? '-' : ''}
                      {data.risk_trend.percentage}% ({data.risk_trend.timeframe})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Risk {data.risk_trend.direction === 'up' ? 'increasing' : data.risk_trend.direction === 'down' ? 'decreasing' : 'stable'}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Analysis Status</p>
                <p className="text-sm">{data.last_updated || "Just now"}</p>
                <Badge variant="outline" className="text-xs text-green-400 border-green-400/30 bg-green-500/10">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                  Live Monitoring
                </Badge>
              </div>
            </div>

            {(data.transaction_count || data.balance || data.first_seen) && (
              <div className="mt-6 pt-6 border-t border-border/50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {data.transaction_count && (
                    <div className="text-center">
                      <p className="text-2xl font-bold">{data.transaction_count.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Transactions</p>
                    </div>
                  )}
                  {data.balance && (
                    <div className="text-center">
                      <p className="text-2xl font-bold">{data.balance} ETH</p>
                      <p className="text-xs text-muted-foreground">Current Balance</p>
                    </div>
                  )}
                  {data.first_seen && (
                    <div className="text-center">
                      <p className="text-sm font-medium">{data.first_seen}</p>
                      <p className="text-xs text-muted-foreground">First Activity</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">Risk Meter</CardTitle>
            <CardDescription className="text-center text-xs">
              Real-time risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SpeedometerGauge score={data.overall_score} size="lg" />
          </CardContent>
        </Card>
      </div>

      {Object.keys(data.module_scores).length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Security Module Analysis</CardTitle>
            <CardDescription>
              Multi-dimensional risk assessment across {Object.keys(data.module_scores).length} security modules
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RadarChart data={data.module_scores} size="lg" />
          </CardContent>
        </Card>
      )}

      {Object.keys(data.module_scores).length > 0 && (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Detailed Module Breakdown</CardTitle>
            <CardDescription>
              Individual analysis results from each security detection module
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.module_scores).map(([module, details]) => {
                const moduleRisk = details.label || getRiskLevel(details.score)
                const { color, badge, icon } = getRisk(moduleRisk)
                return (
                  <Card 
                    key={module} 
                    className="border-border/50 hover:border-border transition-colors group bg-card/30 backdrop-blur-sm"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{formatModuleName(module)}</CardTitle>
                        <Badge variant="outline" className={`text-xs ${badge}`}>{moduleRisk}</Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold">{details.score.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground ml-1">/10</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <div className="flex items-center justify-center">{icon}<SpeedometerGauge score={details.score} size="sm" showLabel={false} /></div>
                      <Progress value={(details.score / 10) * 100} className="h-1.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed text-center">
                        {details.explain || "Security analysis completed for this module."}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <RiskTimeline events={mockTimelineEvents} />
    </div>
  )
}
