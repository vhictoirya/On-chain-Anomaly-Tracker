"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Search, XCircle, Activity, Wallet, Hash, Zap, Trash2, BarChart3, AlertTriangle } from "lucide-react"
import { TransactionAnalysis } from "@/components/transaction-analysis"
import { AddressAnalysis } from "@/components/address-analysis"
import { ComparisonChart } from "@/components/comparison-chart"
import type { TransactionAnalysisResult, AddressAnalysisResult } from "@/lib/api"

interface AnalysisHistory {
  id: string
  type: "transaction" | "address"
  input: string
  result: TransactionAnalysisResult | AddressAnalysisResult
  timestamp: Date
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("transaction")
  const [inputValue, setInputValue] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<TransactionAnalysisResult | AddressAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistory[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const API_ENDPOINT = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || "http://localhost:8000"

  const handleAnalyze = async () => {
    if (!inputValue.trim()) return

    setIsAnalyzing(true)
    setAnalysisResult(null)
    setError(null)

    try {
      const format = "json" // change to "text" if needed
      const endpoint =
        activeTab === "transaction"
          ? `${API_ENDPOINT}/analyze/transaction/${inputValue.trim()}?format=${format}`
          : `${API_ENDPOINT}/analyze/address/${inputValue.trim()}?format=${format}`

      const response = await fetch(endpoint)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API request failed with status ${response.status}`)
      }

      const result = format === "text" ? await response.text() : await response.json()
      setAnalysisResult(result)

      // Only store JSON responses in history
      if (format === "json") {
        const historyItem: AnalysisHistory = {
          id: Date.now().toString(),
          type: activeTab as "transaction" | "address",
          input: inputValue.trim(),
          result,
          timestamp: new Date(),
        }
        setAnalysisHistory((prev) => [historyItem, ...prev.slice(0, 4)])
      }

      setInputValue("")
    } catch (err) {
      console.error("Analysis error:", err)
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const removeFromHistory = (id: string) => {
    setAnalysisHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const clearHistory = () => {
    setAnalysisHistory([])
    setShowComparison(false)
  }

  const getAddressAnalysesForComparison = () => {
    return analysisHistory
      .filter((item) => item.type === "address")
      .map((item) => item.result as AddressAnalysisResult)
      .slice(0, 3)
  }

  const isValidInput = (input: string, type: string) => {
    const trimmedInput = input.trim()
    if (type === "transaction") {
      return trimmedInput.startsWith("0x") && trimmedInput.length === 66
    } else {
      return trimmedInput.startsWith("0x") && trimmedInput.length === 42
    }
  }

  const getRiskBadgeColor = (score: number) => {
    if (score >= 7) return "text-red-400 border-red-400/30 bg-red-500/10"
    if (score >= 4) return "text-yellow-400 border-yellow-400/30 bg-yellow-500/10"
    return "text-green-400 border-green-400/30 bg-green-500/10"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 7) return "High Risk"
    if (score >= 4) return "Medium Risk"
    return "Low Risk"
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnalyzing && inputValue.trim() && isValidInput(inputValue, activeTab)) {
      handleAnalyze()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 animate-pulse"></div>
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  BlockShield
                </h1>
                <p className="text-sm text-muted-foreground font-medium">Advanced Blockchain Threat Detection</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-500/10">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="text-blue-400 border-blue-400/30 bg-blue-500/10">
                <Zap className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="container mx-auto px-6 py-8">
        {/* Analysis Input */}
        <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-balance text-2xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Analyze Blockchain Threats
            </CardTitle>
            <CardDescription className="text-base">
              Enter a transaction hash or wallet address to perform comprehensive security analysis with AI-powered
              threat detection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                <TabsTrigger
                  value="transaction"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white"
                >
                  <Hash className="h-4 w-4" />
                  Transaction Analysis
                </TabsTrigger>
                <TabsTrigger
                  value="address"
                  className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white"
                >
                  <Wallet className="h-4 w-4" />
                  Address Analysis
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    placeholder={
                      activeTab === "transaction" ? "Enter transaction hash (0x...)" : "Enter wallet address (0x...)"
                    }
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="font-mono text-sm bg-input/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    disabled={isAnalyzing}
                  />
                  {inputValue && !isValidInput(inputValue, activeTab) && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive font-medium">
                        {activeTab === "transaction"
                          ? "Transaction hash must start with 0x and be 66 characters long"
                          : "Address must start with 0x and be 42 characters long"}
                      </p>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!inputValue.trim() || !isValidInput(inputValue, activeTab) || isAnalyzing}
                  className="px-8 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-semibold shadow-lg"
                >
                  {isAnalyzing ? (
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* History & Results */}
        {analysisHistory.length > 0 && (
          <Card className="mb-8 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Analysis History ({analysisHistory.length})
                  </CardTitle>
                  <CardDescription>Recent analyses for comparison and reference</CardDescription>
                </div>
                <div className="flex gap-2">
                  {activeTab === "address" && getAddressAnalysesForComparison().length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComparison(!showComparison)}
                      className="gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      {showComparison ? "Hide" : "Show"} Comparison
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analysisHistory.map((item) => (
                  <Card key={item.id} className="border-border/30 hover:border-border transition-colors group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {item.type === "transaction" ? "TX" : "Address"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromHistory(item.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-mono text-xs text-muted-foreground mb-2 truncate" title={item.input}>
                        {item.input}
                      </p>
                      <div className="flex items-center justify-between">
                        {item.type === "address" ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${getRiskBadgeColor((item.result as AddressAnalysisResult).overall_score)}`}
                          >
                            {getRiskLabel((item.result as AddressAnalysisResult).overall_score)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Transaction
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{item.timestamp.toLocaleTimeString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Chart */}
        {showComparison && activeTab === "address" && getAddressAnalysesForComparison().length > 1 && (
          <div className="mb-8">
            <ComparisonChart data={getAddressAnalysesForComparison()} />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-8 border-destructive/50 bg-red-500/5 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 text-destructive">
                <XCircle className="h-6 w-6" />
                <div>
                  <p className="font-medium">Analysis Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <div className="space-y-6">
            {activeTab === "transaction" ? (
              <TransactionAnalysis data={analysisResult as TransactionAnalysisResult} />
            ) : (
              <AddressAnalysis data={analysisResult as AddressAnalysisResult} />
            )}
          </div>
        )}

        {/* Empty State */}
        {!analysisResult && !isAnalyzing && !error && (
          <Card className="text-center py-16 border-border/50 bg-card/30 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
            <CardContent className="relative z-10">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                  <Shield className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Ready to Analyze
                  </h3>
                  <p className="text-muted-foreground max-w-md text-base leading-relaxed">
                    Enter a transaction hash or wallet address above to begin comprehensive blockchain security analysis
                    with AI-powered threat detection
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Press <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Enter</kbd> to analyze
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
