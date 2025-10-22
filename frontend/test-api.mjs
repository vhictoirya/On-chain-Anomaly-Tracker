import fetch from "node-fetch";

const API_BASE = "http://localhost:8001/api/v1";

async function testAPI() {
  try {
    // Test health endpoint
    const healthResponse = await fetch("http://localhost:8001/health");
    const healthData = await healthResponse.json();
    console.log("Health check:", healthData);

    // Test transaction-anomaly endpoint
    const params = new URLSearchParams({
      token_address: "0x6982508145454ce325ddbe47a25d4ec3d2311933",
      chain: "eth",
      sensitivity: "medium",
      limit: "100",
      max_pages: "5"
    });
    
    const apiResponse = await fetch(`${API_BASE}/transaction-anomaly?${params}`);
    const apiData = await apiResponse.json();
    console.log("API test:", apiData);
  } catch (err) {
    console.error("Error:", err);
  }
}

testAPI();

