import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchInput } from './components/SearchInput';
import { TransactionResult } from './components/results/TransactionResult';
import { AddressResult } from './components/results/AddressResult';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Card } from './components/ui/Card';
import { analyzeTransaction, analyzeAddress } from './services/api';
import { TransactionAnalysisResponse, AddressAnalysisResponse } from './types/api';
import { AlertCircle, TrendingUp, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionResult, setTransactionResult] = useState<TransactionAnalysisResponse | null>(null);
  const [addressResult, setAddressResult] = useState<AddressAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (value: string, type: 'address' | 'transaction') => {
    setIsLoading(true);
    setError(null);
    setTransactionResult(null);
    setAddressResult(null);

    try {
      if (type === 'transaction') {
        const result = await analyzeTransaction(value);
        setTransactionResult(result);
        toast.success('Transaction analysis completed!');
      } else {
        const result = await analyzeAddress(value);
        setAddressResult(result);
        toast.success('Address analysis completed!');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Analysis failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Transaction Analysis',
      description: 'Analyze Ethereum transactions for anomalies, gas usage patterns, and risk indicators.'
    },
    {
      icon: TrendingUp,
      title: 'Address Risk Assessment',
      description: 'Comprehensive risk scoring for addresses including governance, liquidity, and fraud detection.'
    },
    {
      icon: Zap,
      title: 'Real-time Detection',
      description: 'Get instant analysis results with detailed explanations and risk breakdowns.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold gradient-text mb-6">
              Detect Blockchain Threats & Anomalies
            </h2>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Analyze Ethereum transactions and addresses for suspicious activity, 
              risk assessment, and security insights using advanced detection algorithms.
            </p>
            
            <SearchInput onSearch={handleSearch} isLoading={isLoading} />
          </div>
        </section>

        {/* Loading State */}
        {isLoading && (
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card variant="glass" className="text-center py-12">
                <LoadingSpinner size="lg" className="mx-auto mb-4 text-primary-600" />
                <h3 className="text-lg font-semibold mb-2">Analyzing...</h3>
                <p className="text-gray-600">
                  Running comprehensive security analysis. This may take a few moments.
                </p>
              </Card>
            </div>
          </section>
        )}

        {/* Error State */}
        {error && (
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Card variant="glass" className="border-l-4 border-l-red-500">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
                </div>
                <p className="text-red-700">{error}</p>
                <div className="mt-4 text-sm text-red-600">
                  <p>Common issues:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Invalid transaction hash or address format</li>
                    <li>Transaction not found on Ethereum mainnet</li>
                    <li>API service temporarily unavailable</li>
                  </ul>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Results */}
        {(transactionResult || addressResult) && (
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              {transactionResult && <TransactionResult result={transactionResult} />}
              {addressResult && <AddressResult result={addressResult} />}
            </div>
          </section>
        )}

        {/* Features Section - Show when no results */}
        {!isLoading && !transactionResult && !addressResult && !error && (
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Comprehensive Blockchain Security Analysis
                </h3>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Our advanced detection system analyzes multiple risk factors to provide 
                  you with detailed security insights and threat assessments.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} variant="glass" className="text-center hover:scale-105 transition-transform">
                    <div className="p-3 bg-primary-100 rounded-lg w-fit mx-auto mb-4">
                      <feature.icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

export default App;