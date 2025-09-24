"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface RiskTimelineProps {
  events: Array<{
    timestamp: string
    event: string
    risk_level: "low" | "medium" | "high"
    description: string
  }>
}

export function RiskTimeline({ events }: RiskTimelineProps) {
  const getRiskIcon = (level: string) => {
    switch (level) {
      case "low":
        return <TrendingDown className="h-4 w-4 text-success" />
      case "medium":
        return <Minus className="h-4 w-4 text-warning" />
      case "high":
        return <TrendingUp className="h-4 w-4 text-destructive" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-success border-success/20 bg-success/5"
      case "medium":
        return "text-warning border-warning/20 bg-warning/5"
      case "high":
        return "text-destructive border-destructive/20 bg-destructive/5"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Risk Timeline
        </CardTitle>
        <CardDescription>Recent security events and risk changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`p-2 rounded-full border ${getRiskColor(event.risk_level)}`}>
                  {getRiskIcon(event.risk_level)}
                </div>
                {index < events.length - 1 && <div className="w-px h-8 bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium">{event.event}</h4>
                  <Badge variant="outline" className={getRiskColor(event.risk_level)}>
                    {event.risk_level} risk
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                <p className="text-xs text-muted-foreground">{event.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
