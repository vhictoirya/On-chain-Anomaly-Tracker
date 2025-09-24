"use client"

interface SpeedometerGaugeProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function SpeedometerGauge({ score, size = "md", showLabel = true }: SpeedometerGaugeProps) {
  const dimensions = size === "sm" ? 120 : size === "md" ? 160 : 200
  const radius = dimensions / 2 - 20
  const centerX = dimensions / 2
  const centerY = dimensions / 2

  // Speedometer arc from -90 to 90 degrees (180 degree arc)
  const startAngle = -90
  const endAngle = 90
  const totalAngle = endAngle - startAngle

  // Calculate needle angle based on score (0-100)
  const needleAngle = startAngle + (score / 100) * totalAngle

  // Convert to radians
  const needleRad = (needleAngle * Math.PI) / 180
  const needleLength = radius - 10

  // Needle tip coordinates
  const needleX = centerX + needleLength * Math.cos(needleRad)
  const needleY = centerY + needleLength * Math.sin(needleRad)

  // Create arc path for the speedometer background
  const createArcPath = (startAngle: number, endAngle: number, radius: number) => {
    const start = (startAngle * Math.PI) / 180
    const end = (endAngle * Math.PI) / 180
    const x1 = centerX + radius * Math.cos(start)
    const y1 = centerY + radius * Math.sin(start)
    const x2 = centerX + radius * Math.cos(end)
    const y2 = centerY + radius * Math.sin(end)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return "#10b981" // green
    if (score <= 60) return "#f59e0b" // orange
    return "#ef4444" // red
  }

  const getRiskLabel = (score: number) => {
    if (score <= 30) return "Safe"
    if (score <= 60) return "Caution"
    return "Danger"
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={dimensions} height={dimensions * 0.7} className="overflow-visible">
          <defs>
            <linearGradient id={`speedometer-gradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <filter id="glow-effect">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background arc */}
          <path
            d={createArcPath(startAngle, endAngle, radius)}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
          />

          {/* Colored progress arc */}
          <path
            d={createArcPath(startAngle, endAngle, radius)}
            stroke={`url(#speedometer-gradient-${score})`}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            filter="url(#glow-effect)"
          />

          {/* Score markers */}
          {[0, 25, 50, 75, 100].map((value) => {
            const angle = startAngle + (value / 100) * totalAngle
            const rad = (angle * Math.PI) / 180
            const x1 = centerX + (radius - 15) * Math.cos(rad)
            const y1 = centerY + (radius - 15) * Math.sin(rad)
            const x2 = centerX + (radius - 5) * Math.cos(rad)
            const y2 = centerY + (radius - 5) * Math.sin(rad)

            return (
              <g key={value}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255, 255, 255, 0.6)" strokeWidth="2" />
                <text
                  x={centerX + (radius - 25) * Math.cos(rad)}
                  y={centerY + (radius - 25) * Math.sin(rad)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs fill-muted-foreground font-medium"
                >
                  {value}
                </text>
              </g>
            )
          })}

          {/* Center circle */}
          <circle cx={centerX} cy={centerY} r="8" fill={getRiskColor(score)} className="drop-shadow-lg" />

          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={getRiskColor(score)}
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow-effect)"
            className="transition-all duration-1000 ease-out"
          />

          {/* Score display */}
          <text
            x={centerX}
            y={centerY + 30}
            textAnchor="middle"
            className={`font-bold fill-current ${size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-3xl"}`}
            style={{ fill: getRiskColor(score) }}
          >
            {score.toFixed(0)}
          </text>
        </svg>
      </div>

      {showLabel && (
        <div className="text-center">
          <div
            className={`font-semibold text-sm px-4 py-2 rounded-full border-2 transition-all duration-300`}
            style={{
              color: getRiskColor(score),
              borderColor: getRiskColor(score) + "40",
              backgroundColor: getRiskColor(score) + "10",
            }}
          >
            {getRiskLabel(score)}
          </div>
        </div>
      )}
    </div>
  )
}
