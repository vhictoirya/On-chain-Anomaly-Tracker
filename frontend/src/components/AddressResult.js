function AddressResult({ result }) {
  const { address, overall_score, overall_risk, module_scores } = result;

  const getRiskGradient = (score) => {
    if (score >= 66.67) return 'var(--danger-gradient)';
    if (score >= 33.33) return 'var(--warning-gradient)';
    return 'var(--success-gradient)';
  };

  const getRiskIcon = (score) => {
    if (score >= 66.67) return '🚨';
    if (score >= 33.33) return '⚠️';
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
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '2rem', top: '2rem', fontSize: '4rem', opacity: '0.2' }}>
          🔍
        </div>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>
          Address Analysis Result
        </h2>
        <div className="address-badge" style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem',
          borderRadius: 'var(--border-radius-sm)',
          fontFamily: 'monospace',
          wordBreak: 'break-all'
        }}>
          {address}
        </div>
      </div>

      <div className="risk-overview" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="overall-score" style={{
          background: getRiskGradient(overall_score),
          padding: '2rem',
          borderRadius: 'var(--border-radius)',
          color: 'white',
          textAlign: 'center',
          animation: 'pulse 2s infinite'
        }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            {overall_score.toFixed(1)}
          </div>
          <div style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {overall_risk}
          </div>
        </div>
      </div>

      <div className="modules-section">
        <h3 style={{ 
          fontSize: '1.5rem', 
          marginBottom: '1.5rem',
          color: 'var(--text-primary)',
          borderBottom: '2px solid var(--primary-color)',
          paddingBottom: '0.5rem'
        }}>
          Risk Analysis by Module
        </h3>
        <div className="modules-grid">
          {Object.entries(module_scores).map(([name, data]) => (
            <div key={name} className="module-card" style={{
              background: 'var(--card-background)',
              borderRadius: 'var(--border-radius)',
              padding: '1.5rem',
              boxShadow: 'var(--box-shadow)',
              transition: 'var(--transition)',
              border: '1px solid rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                right: '-20px',
                top: '-20px',
                background: getRiskGradient(data.score),
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                opacity: '0.1'
              }} />
              
              <div style={{ position: 'relative' }}>
                <h4 style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '0 0 1rem 0',
                  color: 'var(--text-primary)',
                  fontSize: '1.25rem'
                }}>
                  {getRiskIcon(data.score)} {name}
                </h4>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    background: getRiskGradient(data.score),
                    padding: '0.75rem 1.5rem',
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.5rem'
                  }}>
                    {data.score.toFixed(1)}
                  </div>
                  <div style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--border-radius-sm)',
                    background: 'rgba(0,0,0,0.05)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    {data.label}
                  </div>
                </div>

                <p style={{
                  margin: '0',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5',
                  fontSize: '0.9rem'
                }}>
                  {data.explain}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AddressResult;