import React, { useState } from 'react';

function AnalysisForm({ onSubmit }) {
  const [type, setType] = useState('transaction');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const validateInput = (inputValue, inputType) => {
    if (!inputValue) {
      setError(`Please enter a ${inputType}`);
      setIsValid(false);
      return;
    }

    if (!inputValue.startsWith('0x')) {
      setError(`${inputType} must start with 0x`);
      setIsValid(false);
      return;
    }

    if (inputType === 'transaction' && inputValue.length !== 66) {
      setError('Transaction hash must be 66 characters long (including 0x)');
      setIsValid(false);
      return;
    }

    if (inputType === 'address' && inputValue.length !== 42) {
      setError('Address must be 42 characters long (including 0x)');
      setIsValid(false);
      return;
    }

    const hexRegex = /^0x[0-9a-fA-F]+$/;
    if (!hexRegex.test(inputValue)) {
      setError(`${inputType} contains invalid characters (should be 0-9 and a-f)`);
      setIsValid(false);
      return;
    }

    setError('');
    setIsValid(true);
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    validateInput(newValue, type);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      onSubmit(type, value);
    }
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setValue(''); // Clear value when changing type
    setError(''); // Clear error when changing type
    setIsValid(false);
  };

  const placeholder = type === 'transaction'
    ? '0x7154a8533d2b58da3d7a1caf788ffb8317129149aac9832ea2089bb716ac7a8f'
    : '0xdAC17F958D2ee523a2206206994597C13D831ec7';

  return (
    <form onSubmit={handleSubmit} className="analysis-form">
      <div className="form-group">
        <label>
          Analysis Type:
          <select
            value={type}
            onChange={handleTypeChange}
            className="select-input"
          >
            <option value="transaction">Transaction</option>
            <option value="address">Address</option>
          </select>
        </label>
      </div>
      
      <div className="form-group">
        <label>
          {type === 'transaction' ? 'Transaction Hash' : 'Address'}:
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`text-input ${error ? 'input-error' : ''} ${isValid ? 'input-valid' : ''}`}
            required
          />
        </label>
        {error && (
          <div className="error-message" style={{
            color: '#ff4444',
            fontSize: '0.9rem',
            marginTop: '0.5rem'
          }}>
            {error}
          </div>
        )}
        <div className="input-help" style={{
          color: '#666',
          fontSize: '0.8rem',
          marginTop: '0.25rem'
        }}>
          {type === 'transaction' 
            ? 'Enter a valid Ethereum transaction hash (66 characters starting with 0x)'
            : 'Enter a valid Ethereum address (42 characters starting with 0x)'}
        </div>
      </div>

      <button 
        type="submit" 
        className={`submit-button ${!isValid ? 'button-disabled' : ''}`}
        disabled={!isValid}
      >
        Analyze {type}
      </button>
    </form>
  );
}

export default AnalysisForm;