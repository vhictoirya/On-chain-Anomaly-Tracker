function TransactionResult({ result }) {
  const {
    tx_hash,
    transaction_details,
    risk_flags,
    verdict
  } = result;

  const {
    from,
    to,
    token,
    value,
    method,
    tx_type,
    gas_fee_eth
  } = transaction_details;

  const getRiskClass = (flag) => {
    if (flag === true || flag === 'high' || flag === 'suspicious') return 'risk-high';
    if (flag === 'medium' || flag === 'unusual') return 'risk-medium';
    return 'risk-low';
  };

  const getRiskGradient = (flag) => {
    if (flag === true || flag === 'high' || flag === 'suspicious') return 'var(--danger-gradient)';
    if (flag === 'medium' || flag === 'unusual') return 'var(--warning-gradient)';
    return 'var(--success-gradient)';
  };

  const getRiskIcon = (flag) => {
    if (flag === true || flag === 'high' || flag === 'suspicious') return '🚨';
    if (flag === 'medium' || flag === 'unusual') return '⚠️';
    return '✅';
  };

  return (
    <div className="result-container">
      <div className="result-header" style={{
        background: 'var(--primary-gradient)',
        padding: '2rem',
        borderRadius: 'var(--border-radius)',
        color: 'white',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease-out'
      }}>
        <div style={{ position: 'absolute', right: '2rem', top: '2rem', fontSize: '4rem', opacity: '0.2' }}>
          💱
        </div>
        <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem' }}>
          Transaction Analysis Result
        </h2>
        <div className="tx-badge" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: 'var(--border-radius-sm)',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          <div style={{ opacity: 0.7, marginBottom: '0.5rem', fontSize: '0.9rem' }}>Transaction Hash</div>
          {tx_hash}
        </div>
      </div>
      
      <div className="details-section" style={{
        marginBottom: '2rem',
        animation: 'fadeIn 0.5s ease-out',
        animationDelay: '0.1s'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <span role="img" aria-label="details" style={{ fontSize: '1.8rem' }}>📝</span>
          Transaction Details
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div className="address-card" style={{
            padding: '1.5rem',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--border-radius)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'var(--transition)',
            cursor: 'pointer'
          }}>
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '3rem', opacity: '0.2' }}>↗️</div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="from">📤</span> From
            </h4>
            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}>
              {from}
            </div>
          </div>
          
          <div className="address-card" style={{
            padding: '1.5rem',
            background: 'var(--secondary-gradient)',
            borderRadius: 'var(--border-radius)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            transition: 'var(--transition)',
            cursor: 'pointer'
          }}>
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '3rem', opacity: '0.2' }}>↙️</div>
            <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="to">📥</span> To
            </h4>
            <div style={{ wordBreak: 'break-all', fontFamily: 'monospace', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)' }}>
              {to}
            </div>
          </div>
        </div>

        <div className="transaction-info" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          {token && (
            <div className="info-card" style={{
              padding: '1.5rem',
              background: 'var(--card-background)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--box-shadow)',
              transition: 'var(--transition)',
              border: '1px solid rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', background: 'var(--primary-gradient)', width: '100px', height: '100px', borderRadius: '50%', opacity: '0.1' }} />
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span role="img" aria-label="token">🪙</span> Token
              </h4>
              <div style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '0.5rem' }}>{token.name} ({token.symbol})</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)' }}>
                Decimals: {token.decimals}
              </div>
            </div>
          )}
          
          <div className="info-card" style={{
            padding: '1.5rem',
            background: 'var(--card-background)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--box-shadow)',
            transition: 'var(--transition)',
            border: '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', background: 'var(--success-gradient)', width: '100px', height: '100px', borderRadius: '50%', opacity: '0.1' }} />
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="value">💰</span> Value
            </h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
          </div>

          <div className="info-card" style={{
            padding: '1.5rem',
            background: 'var(--card-background)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--box-shadow)',
            transition: 'var(--transition)',
            border: '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', background: 'var(--secondary-gradient)', width: '100px', height: '100px', borderRadius: '50%', opacity: '0.1' }} />
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--secondary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="method">⚡</span> Method
            </h4>
            <div style={{ fontSize: '1.2rem', fontWeight: '500', marginBottom: '0.5rem' }}>{method}</div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.05)', padding: '0.5rem', borderRadius: 'var(--border-radius-sm)' }}>{tx_type}</div>
          </div>

          <div className="info-card" style={{
            padding: '1.5rem',
            background: 'var(--card-background)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--box-shadow)',
            transition: 'var(--transition)',
            border: '1px solid rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'absolute', right: '-20px', top: '-20px', background: 'var(--warning-gradient)', width: '100px', height: '100px', borderRadius: '50%', opacity: '0.1' }} />
            <h4 style={{ margin: '0 0 1rem 0', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span role="img" aria-label="gas">⛽</span> Gas Fee
            </h4>
            <div style={{ fontSize: '1.2rem', fontWeight: '500' }}>{gas_fee_eth}</div>
          </div>
        </div>
      </div>

      <div className="risk-section" style={{ marginBottom: '2rem', animation: 'fadeIn 0.5s ease-out', animationDelay: '0.2s' }}>
        <h3 style={{
          fontSize: '1.5rem',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem'
        }}>
          <span role="img" aria-label="warning" style={{ fontSize: '1.8rem' }}>⚠️</span>
          Risk Analysis
        </h3>
        <div className="risk-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {Object.entries(risk_flags).map(([key, value], index) => (
            <div 
              key={key} 
              className={`risk-card ${getRiskClass(value)}`} 
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--border-radius)',
                transition: 'var(--transition)',
                background: 'var(--card-background)',
                boxShadow: 'var(--box-shadow)',
                border: '1px solid rgba(0,0,0,0.1)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                animation: 'fadeIn 0.5s ease-out',
                animationDelay: `${0.1 * index}s`
              }}
            >
              <div style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                background: getRiskGradient(value),
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                opacity: '0.1'
              }} />
              <div style={{ position: 'relative' }}>
                <h4 style={{ 
                  margin: '0 0 1rem 0',
                  textTransform: 'capitalize',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem'
                }}>
                  {getRiskIcon(value)} {key.replace(/_/g, ' ')}
                </h4>
                <div style={{ 
                  display: 'inline-block',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: getRiskGradient(value),
                  color: 'white'
                }}>
                  {String(value)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="verdict-section" style={{
        background: 'var(--primary-gradient)',
        padding: '2rem',
        borderRadius: 'var(--border-radius)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeIn 0.5s ease-out',
        animationDelay: '0.3s'
      }}>
        <div style={{ 
          position: 'absolute',
          right: '-30px',
          top: '-30px',
          fontSize: '8rem',
          opacity: '0.1',
          transform: 'rotate(15deg)'
        }}>
          ⚖️
        </div>
        <h3 style={{ 
          margin: '0 0 1.5rem 0',
          fontSize: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span role="img" aria-label="verdict" style={{ fontSize: '1.8rem' }}>⚖️</span>
          Final Verdict
        </h3>
        <p style={{ 
          margin: 0,
          fontSize: '1.2rem',
          lineHeight: '1.6',
          position: 'relative',
          zIndex: 1
        }}>
          {verdict}
        </p>
      </div>
    </div>
  );
}

export default TransactionResult;