"use client"

import type React from "react"
import { CheckCircle, XCircle, AlertTriangle, Shield, Zap, ArrowUpDown, Coins, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RiskFlag {
  key: string
  label: string
  status: "safe" | "warning" | "danger"
  description: string
  icon: React.ReactNode
}

interface RiskFlagsGridProps {
  flags: {
    gas_usage: string
    transfer_category: string
    approval_anomaly: boolean
    swap_activity: boolean
    flashloan_activity: boolean
  }
}

// Centralized risk map
const riskMap = {
  safe: { color: "border-green-500/30 bg-green-500/10 hover:bg-green-500/20", icon: <CheckCircle className="h-6 w-6 text-green-500" /> },
  warning: { color: "border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20", icon: <AlertTriangle className="h-6 w-6 text-yellow-500" /> },
  danger: { color: "border-red-500/30 bg-red-500/10 hover:bg-red-500/20", icon: <XCircle className="h-6 w-6 text-red-500" /> },
  default: { color: "border-muted-foreground/30 bg-muted/10", icon: <CheckCircle className="h-6 w-6 text-muted-foreground" /> }
}

const getRisk = (status: "safe" | "warning" | "danger") => riskMap[status] || riskMap.default

export function RiskFlagsGrid({ flags }: RiskFlagsGridProps) {
  const riskFlags: RiskFlag[] = [
    {
      key: "gas_usage",
      label: "Gas Usage",
      status: flags.gas_usage === "normal" ? "safe" : "warning",
      description: `Gas consumption is ${flags.gas_usage}`,
      icon: <Zap className="h-5 w-5" />,
    },
    {
      key: "transfer_category",
      label: "Transfer Type",
      status: flags.transfer_category.includes("retail") ? "safe" : "warning",
      description: `Classified as ${flags.transfer_category.replace("_", " ")}`,
      icon: <ArrowUpDown className="h-5 w-5" />,
    },
    {
      key: "approval_anomaly",
      label: "Approval Check",
      status: flags.approval_anomaly ? "danger" : "safe",
      description: flags.approval_anomaly ? "Unusual approval detected" : "Normal approval pattern",
      icon: <Shield className="h-5 w-5" />,
    },
    {
      key: "swap_activity",
      label: "DEX Activity",
      status: flags.swap_activity ? "warning" : "safe",
      description: flags.swap_activity ? "DEX interaction detected" : "No DEX activity",
      icon: <Coins className="h-5 w-5" />,
    },
    {
      key: "flashloan_activity",
      label: "Flash Loans",
      status: flags.flashloan_activity ? "danger" : "safe",
      description: flags.flashloan_activity ? "Flash loan activity detected" : "No flash loan activity",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {riskFlags.map((flag) => {
        const { color, icon } = getRisk(flag.status)
        return (
          <Card
            key={flag.key}
            className={`transition-all duration-300 hover:scale-105 border-2 ${color}`}
          >
            <CardContent className="p-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <div className="text-muted-foreground">{flag.icon}</div>
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{flag.label}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{flag.description}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
