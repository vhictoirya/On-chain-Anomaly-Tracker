"use client"

interface RiskGaugeProps {
  score: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function RiskGauge({ score, size = "md", showLabel = true }: RiskGaugeProps) {
  const radius = size === "sm" ? 50 : size === "md" ? 70 : 90
  const strokeWidth = size === "sm" ? 8 : size === "md" ? 10 : 12
  const normalizedRadius = radius - strokeWidth * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (score / 100) * circumference

  const getRiskColor = (score: number) => {
    if (score <= 30) return "var(--neon-green)"
    if (score <= 60) return "var(--neon-orange)"
    return "var(--neon-pink)"
  }

  const getRiskLabel = (score: number) => {
    if (score <= 30) return "Low Risk"
    if (score <= 60) return "Medium Risk"
    return "High Risk"
  }

  const getRiskGradient = (score: number) => {
    if (score <= 30) return "from-green-400 to-emerald-500"
    if (score <= 60) return "from-yellow-400 to-orange-500"
    return "from-pink-400 to-red-500"
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-xl animate-pulse"></div>

        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 relative z-10 gauge-glow">
          {/* Background circle */}
          <circle
            stroke="rgba(255, 255, 255, 0.1)"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />

          <defs>
            <linearGradient id={`riskGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={getRiskColor(score)} stopOpacity="0.8" />
              <stop offset="100%" stopColor={getRiskColor(score)} stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Progress circle with glow effect */}
          <circle
            stroke={`url(#riskGradient-${score})`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="transition-all duration-2000 ease-out"
            filter="url(#glow)"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className={`font-bold bg-gradient-to-r ${getRiskGradient(score)} bg-clip-text text-transparent ${
                size === "sm" ? "text-xl" : size === "md" ? "text-3xl" : "text-4xl"
              }`}
            >
              {score.toFixed(1)}
            </div>
            {size !== "sm" && <div className="text-xs text-muted-foreground/80 font-medium">/ 100</div>}
          </div>
        </div>
      </div>

      {showLabel && (
        <div className="text-center">
          <div
            className={`font-semibold text-sm px-3 py-1 rounded-full border shimmer-effect ${
              score <= 30
                ? "text-neon-green border-neon-green/30 bg-green-500/10"
                : score <= 60
                  ? "text-neon-orange border-neon-orange/30 bg-orange-500/10"
                  : "text-neon-pink border-neon-pink/30 bg-pink-500/10"
            }`}
          >
            {getRiskLabel(score)}
          </div>
        </div>
      )}
    </div>
  )
}
