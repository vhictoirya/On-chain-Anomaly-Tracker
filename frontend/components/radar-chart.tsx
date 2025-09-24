"use client"

import { ReactNode } from "react"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

const riskMap = {
  low: { color: "#10b981", badge: "text-green-400 border-green-400/30 bg-green-500/10", icon: <CheckCircle className="h-4 w-4" /> },
  medium: { color: "#f59e0b", badge: "text-yellow-400 border-yellow-400/30 bg-yellow-500/10", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { color: "#ef4444", badge: "text-red-400 border-red-400/30 bg-red-500/10", icon: <XCircle className="h-4 w-4" /> },
  default: { color: "#9ca3af", badge: "text-muted-foreground border-muted-foreground/30 bg-muted/10", icon: <CheckCircle className="h-4 w-4" /> },
}

const getRisk = (score: number): { color: string; badge: string; icon: ReactNode } => {
  if (score <= 30) return riskMap.low
  if (score <= 60) return riskMap.medium
  return riskMap.high
}

interface RadarChartProps {
  data: {
    [key: string]: {
      score: number
      label: string
    }
  }
  size?: "sm" | "md" | "lg"
}

export function RadarChart({ data, size = "md" }: RadarChartProps) {
  const dimensions = size === "sm" ? 200 : size === "md" ? 280 : 360
  const radius = dimensions / 2 - 40
  const centerX = dimensions / 2
  const centerY = dimensions / 2

  const modules = Object.entries(data)
  const numSides = modules.length

  const getPoint = (index: number, value: number) => {
    const angle = (2 * Math.PI * index) / numSides - Math.PI / 2
    const distance = (value / 100) * radius
    return {
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
    }
  }

  const createPolygonPath = (values: number[]) => {
    const points = values.map((value, index) => getPoint(index, value))
    const pathData =
      points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ") + " Z"
    return pathData
  }

  const gridLevels = [20, 40, 60, 80, 100]

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={dimensions} height={dimensions} className="overflow-visible">
        <defs>
          <radialGradient id="radar-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.1)" />
            <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
          </radialGradient>
          <filter id="radar-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {gridLevels.map((level) => (
          <circle
            key={level}
            cx={centerX}
            cy={centerY}
            r={(level / 100) * radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}

        {modules.map((_, index) => {
          const angle = (2 * Math.PI * index) / numSides - Math.PI / 2
          const endX = centerX + radius * Math.cos(angle)
          const endY = centerY + radius * Math.sin(angle)
          return (
            <line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          )
        })}

        <path
          d={createPolygonPath(modules.map(([_, details]) => details.score))}
          fill="url(#radar-gradient)"
          stroke="rgb(59, 130, 246)"
          strokeWidth="2"
          filter="url(#radar-glow)"
          className="transition-all duration-1000 ease-out"
        />

        {modules.map(([module, details], index) => {
          const point = getPoint(index, details.score)
          const { color } = getRisk(details.score)

          return (
            <circle
              key={module}
              cx={point.x}
              cy={point.y}
              r="4"
              fill={color}
              stroke="white"
              strokeWidth="2"
              className="transition-all duration-1000 ease-out"
            />
          )
        })}

        {modules.map(([module, details], index) => {
          const angle = (2 * Math.PI * index) / numSides - Math.PI / 2
          const labelDistance = radius + 25
          const labelX = centerX + labelDistance * Math.cos(angle)
          const labelY = centerY + labelDistance * Math.sin(angle)

          return (
            <g key={module}>
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-foreground"
              >
                {module.replace("_", " ").toUpperCase()}
              </text>
              <text
                x={labelX}
                y={labelY + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs fill-muted-foreground"
              >
                {details.score.toFixed(0)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
