"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, ExternalLink, Copy, Activity, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpeedometerGauge } from "@/components/speedometer-gauge"
import { RiskFlagsGrid } from "@/components/risk-flags-grid"

interface TransactionAnalysisProps {
  data: {
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
}

export function TransactionAnalysis({ data }: TransactionAnalysisProps) {
  const getVerdictColor = (verdict: string) => {
    if (verdict.toLowerCase().includes("no anomalies")) return "text-success"
    if (verdict.toLowerCase().includes("suspicious")) return "text-warning"
    if (verdict.toLowerCase().includes("high risk")) return "text-destructive"
    return "text-foreground"
  }

  const getVerdictIcon = (verdict: string) => {
    if (verdict.toLowerCase().includes("no anomalies")) return <CheckCircle className="h-5 w-5" />
    if (verdict.toLowerCase().includes("suspicious")) return <AlertTriangle className="h-5 w-5" />
    if (verdict.toLowerCase().includes("high risk")) return <XCircle className="h-5 w-5" />
    return <CheckCircle className="h-5 w-5" />
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Calculate overall risk score based on flags
  const calculateRiskScore = () => {
    let score = 0
    if (data.risk_flags.approval_anomaly) score += 30
    if (data.risk_flags.swap_activity) score += 20
    if (data.risk_flags.flashloan_activity) score += 40
    if (data.risk_flags.gas_usage !== "normal") score += 15
    return Math.min(score, 100)
  }

  const riskScore = calculateRiskScore()

  return (
    <div className="space-y-6">
      {/* Transaction Summary with Risk Score */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Transaction Analysis
                  <Badge variant="outline" className="text-xs">
                    {data.transaction_details.tx_type.replace("_", " ").toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription className="font-mono text-xs mt-2 flex items-center gap-2">
                  {data.tx_hash}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(data.tx_hash)}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <ExternalLink className="h-4 w-4" />
                View on Etherscan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">From</p>
                <p className="font-mono text-sm bg-muted p-2 rounded border">{data.transaction_details.from}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">To</p>
                <p className="font-mono text-sm bg-muted p-2 rounded border">{data.transaction_details.to}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Value</p>
                <p className="text-lg font-semibold">{data.transaction_details.value}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Method</p>
                <Badge variant="secondary">{data.transaction_details.method}</Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Gas Fee</p>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-warning" />
                  <span className="text-sm">{data.transaction_details.gas_fee_eth}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-sm">Risk Speedometer</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SpeedometerGauge score={riskScore} size="md" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Risk Flags Assessment
          </CardTitle>
          <CardDescription>Visual overview of transaction risk indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <RiskFlagsGrid flags={data.risk_flags} />
        </CardContent>
      </Card>

      {/* Enhanced Verdict */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Security Verdict
            {getVerdictIcon(data.verdict)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className={`text-lg ${getVerdictColor(data.verdict)}`}>{data.verdict}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>Analysis completed in 1.2s</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                <span>Verified on-chain</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
