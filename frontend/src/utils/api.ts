// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';

// Health check endpoint
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (error: any) {
    console.error('Health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error?.message || 'Unknown error occurred' 
    };
  }
};

// Generic API call function
export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};