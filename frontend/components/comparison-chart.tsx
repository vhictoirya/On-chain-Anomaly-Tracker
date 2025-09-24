"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface ComparisonData {
  address: string
  overall_score: number
  overall_risk: string
  module_scores: {
    [key: string]: {
      score: number
      label: string
    }
  }
}

interface ComparisonChartProps {
  data: ComparisonData[]
}

// Centralized risk mapping
const riskMap = {
  low: { color: "text-green-500", badge: "text-green-500 border-green-500/30 bg-green-500/10", icon: <CheckCircle className="h-4 w-4" /> },
  medium: { color: "text-yellow-500", badge: "text-yellow-500 border-yellow-500/30 bg-yellow-500/10", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { color: "text-red-500", badge: "text-red-500 border-red-500/30 bg-red-500/10", icon: <XCircle className="h-4 w-4" /> },
  default: { color: "text-muted-foreground", badge: "text-muted-foreground border-muted-foreground/30 bg-muted/10", icon: <CheckCircle className="h-4 w-4" /> }
}

const getRisk = (risk: string) => riskMap[risk.toLowerCase()] || riskMap.default

export function ComparisonChart({ data }: ComparisonChartProps) {
  if (data.length === 0) return null

  const getTrendIcon = (current: number, previous?: number) => {
    if (previous === undefined) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (current > previous) return <TrendingUp className="h-4 w-4 text-red-500" />
    if (current < previous) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  // Get all unique modules across all addresses
  const allModules = Array.from(new Set(data.flatMap(item => Object.keys(item.module_scores))))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Overall Scores Comparison */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Overall Risk Scores</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, index) => {
              const { badge } = getRisk(item.overall_risk)
              return (
                <Card key={item.address} className="border-border/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-muted-foreground">
                        {item.address.slice(0, 8)}...{item.address.slice(-6)}
                      </span>
                      {getTrendIcon(item.overall_score, data[index - 1]?.overall_score)}
                    </div>
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold">{item.overall_score.toFixed(1)}</div>
                      <Progress value={item.overall_score} className="h-2" />
                      <Badge variant="outline" className={`text-xs ${badge}`}>
                        {item.overall_risk}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Module Scores Comparison */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Module Breakdown</h3>
          <div className="space-y-4">
            {allModules.map(module => (
              <div key={module} className="space-y-2">
                <h4 className="font-medium text-sm capitalize">{module.replace("_", " ")}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {data.map(item => {
                    const moduleData = item.module_scores[module]
                    if (!moduleData) return null
                    const { badge } = getRisk(moduleData.label)
                    return (
                      <div
                        key={`${item.address}-${module}`}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg border"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-mono text-muted-foreground">{item.address.slice(0, 6)}...</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{moduleData.score.toFixed(0)}</span>
                            <Badge variant="outline" className={`text-xs ${badge}`}>
                              {moduleData.label}
                            </Badge>
                          </div>
                        </div>
                        <Progress value={moduleData.score} className="h-2 w-16" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
