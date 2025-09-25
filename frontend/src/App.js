import * as React from 'react';
import './App.css';
import AnalysisForm from './components/AnalysisForm';
import TransactionResult from './components/TransactionResult';
import AddressResult from './components/AddressResult';
import { analyzeTransaction, analyzeAddress, checkBackendHealth } from './services/api';

const { useState, useEffect } = React;

const App = () => {
  const [transactionResult, setTransactionResult] = useState(null);
  const [addressResult, setAddressResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ isOnline: false, checking: true });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        await checkBackendHealth();
        setBackendStatus({ isOnline: true, checking: false });
      } catch (err) {
        setBackendStatus({ isOnline: false, checking: false });
        setError('Backend server is not running. Please start the server and try again.');
      }
    };
    checkBackend();
  }, []);

  const handleAnalysis = async (type, value) => {
    if (!backendStatus.isOnline) {
      setError('Cannot perform analysis: Backend server is not running');
      return;
    }

    setLoading(true);
    setError(null);
    setTransactionResult(null);
    setAddressResult(null);

    try {
      if (type === 'transaction') {
        const result = await analyzeTransaction(value);
        setTransactionResult(result);
      } else {
        const result = await analyzeAddress(value);
        setAddressResult(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Blockchain Anomaly & Threat Detector</h1>
      </header>
      <main>
        <AnalysisForm onSubmit={handleAnalysis} />
        
        {loading && <div className="loading">Analyzing...</div>}
        {error && <div className="error">{error}</div>}
        
        {transactionResult && (
          <TransactionResult result={transactionResult} />
        )}
        
        {addressResult && (
          <AddressResult result={addressResult} />
        )}
      </main>
    </div>
  );
}

const AppComponent = App;
export default AppComponent;