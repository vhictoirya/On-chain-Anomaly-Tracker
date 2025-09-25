const API_BASE_URL = 'http://localhost:8000';

// Validation functions
const validateTxHash = (txHash) => {
  if (!txHash) {
    throw new Error('Transaction hash is required');
  }
  if (!txHash.startsWith('0x')) {
    throw new Error('Transaction hash must start with 0x');
  }
  if (txHash.length !== 66) {
    throw new Error('Transaction hash must be 66 characters long (including 0x)');
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new Error('Transaction hash contains invalid characters');
  }
  return true;
};

const validateAddress = (address) => {
  if (!address) {
    throw new Error('Address is required');
  }
  if (!address.startsWith('0x')) {
    throw new Error('Address must start with 0x');
  }
  if (address.length !== 42) {
    throw new Error('Address must be 42 characters long (including 0x)');
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) {
    throw new Error('Address contains invalid characters');
  }
  return true;
};

export async function analyzeTransaction(txHash) {
  try {
    // Validate input
    validateTxHash(txHash);

    const response = await fetch(`${API_BASE_URL}/analyze/transaction/${txHash}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData && errorData.detail) {
        throw new Error(errorData.detail);
      }
      throw new Error(`Failed to analyze transaction: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the analysis server. Please make sure the backend server is running.');
    }
    throw error;
  }
}

export async function analyzeAddress(address) {
  try {
    // Validate input
    validateAddress(address);

    const response = await fetch(`${API_BASE_URL}/analyze/address/${address}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (errorData && errorData.detail) {
        throw new Error(errorData.detail);
      }
      throw new Error(`Failed to analyze address: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the analysis server. Please make sure the backend server is running.');
    }
    throw error;
  }
}

// Health check function to verify backend connection
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return await response.json();
  } catch (error) {
    throw new Error('Cannot connect to the backend server. Please ensure it is running.');
  }
}