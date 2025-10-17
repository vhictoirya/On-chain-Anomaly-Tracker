# Blockchain Threat & Anomaly Detection System

A comprehensive blockchain security platform that analyzes Ethereum transactions and addresses for potential risks, anomalies, and threats using advanced detection algorithms and multiple data sources.

## 🌟 Features

- **Transaction Analysis**: Deep inspection of Ethereum transactions for suspicious patterns
- **Address Risk Assessment**: Multi-module risk scoring system for wallet addresses
- **Real-time Data**: Integration with Etherscan, CoinGecko, and Webacy APIs
- **Flexible Output**: JSON and human-readable text format responses
- **RESTful API**: Clean, documented endpoints for easy integration
- **Modern Frontend**: React-based user interface for interactive analysis

## 🏗️ Architecture

The system consists of two main components:

### Backend (FastAPI)
- **API Server**: FastAPI-based REST API
- **Anomaly Detection**: Advanced blockchain transaction analysis
- **Risk Assessment**: Multi-factor address risk evaluation
- **Data Integration**: Multiple blockchain data providers

### Frontend (React)
- **User Interface**: Modern React application
- **Interactive Analysis**: Real-time transaction and address lookup
- **Deployment Ready**: Configured for Vercel deployment

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- API Keys for:
  - Etherscan API
  - CoinGecko API
  - Infura
  - Webacy API

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd blockchain-anomaly-tracker
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   ETHERSCAN_API_KEY=your_etherscan_api_key
   GECKO_API=your_coingecko_api_key
   INFURA_URL=https://mainnet.infura.io/v3/your_project_id
   WEBACY_API_KEY=your_webacy_api_key
   ```

4. **Run the API server**
   ```bash
   python main.py
   # or
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend  # or wherever your React app is located
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

   The frontend will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Health Check
```http
GET /health
```

Returns system status and service availability.

### Transaction Analysis
```http
GET /analyze/transaction/{tx_hash}?format=json|text
```

**Parameters:**
- `tx_hash`: Ethereum transaction hash (66 characters, starts with 0x)
- `format`: Response format (`json` or `text`)

**Example:**
```bash
curl "http://localhost:8000/analyze/transaction/0x7154a8533d2b58da3d7a1caf788ffb8317129149aac9832ea2089bb716ac7a8f"
```

**Response:**
```json
{
  "analysis_type": "transaction",
  "tx_hash": "0x7154a8533d2b58da3d7a1caf788ffb8317129149aac9832ea2089bb716ac7a8f",
  "transaction_details": {
    "from": "0x...",
    "to": "0x...",
    "value": "1000000000000000000",
    "method": "transfer",
    "tx_type": "ERC20",
    "gas_fee_eth": "0.002"
  },
  "risk_flags": {
    "high_value": true,
    "suspicious_pattern": false,
    "known_address": true
  },
  "verdict": "Medium risk transaction detected"
}
```

### Address Risk Analysis
```http
GET /analyze/address/{address}?format=json|text
```

**Parameters:**
- `address`: Ethereum address (42 characters, starts with 0x)
- `format`: Response format (`json` or `text`)

**Example:**
```bash
curl "http://localhost:8000/analyze/address/0xdAC17F958D2ee523a2206206994597C13D831ec7"
```

**Response:**
```json
{
  "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "overall_score": 0.25,
  "overall_risk": "LOW",
  "module_scores": {
    "behavioral_analysis": {
      "score": 0.1,
      "label": "LOW",
      "explain": "Normal transaction patterns detected"
    },
    "reputation_check": {
      "score": 0.05,
      "label": "LOW",
      "explain": "Address has good reputation"
    }
  }
}
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ETHERSCAN_API_KEY` | Etherscan API key for transaction data | Yes |
| `GECKO_API` | CoinGecko API key for price data | Yes |
| `INFURA_URL` | Infura endpoint URL | Yes |
| `WEBACY_API_KEY` | Webacy API key for risk analysis | Yes |

### CORS Configuration

The API is configured to allow requests from:
- `http://localhost:3000` (development)
- Your production domain (configure in `main.py`)

## 🚀 Deployment

### Backend Deployment

The FastAPI backend can be deployed to various platforms:

**Using Docker:**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Using Railway, Heroku, or similar:**
- Set environment variables
- Deploy directly from repository

### Frontend Deployment (Vercel)

The frontend is configured for Vercel deployment with the included `vercel.json`:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

The `vercel.json` configuration handles:
- Static file serving
- SPA routing
- Build optimization

## 🛠️ Development

### Project Structure
```
├── main.py                 # FastAPI application
├── blockchain_anomaly_tracker.py
├── threat_risk_detector.py
├── requirements.txt
├── .env.example
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vercel.json
└── README.md
```

### Adding New Features

1. **Backend**: Add new endpoints in `main.py`
2. **Analysis Modules**: Extend detection algorithms
3. **Frontend**: Add new components and pages

### Testing

```bash
# Backend
python -m pytest

# Frontend
cd frontend
npm test
```

## 📊 Risk Assessment Modules

The system includes multiple risk assessment modules:

- **Behavioral Analysis**: Transaction pattern recognition
- **Reputation Check**: Known address verification
- **Volume Analysis**: Unusual transaction volumes
- **Frequency Analysis**: Transaction timing patterns
- **Network Analysis**: Address relationship mapping

## 🔐 Security Considerations

- API keys are stored in environment variables
- Input validation on all endpoints
- Rate limiting recommended for production
- CORS configuration for cross-origin requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Support

- **API Documentation**: Available at `http://localhost:8000/docs` when running
- **Issues**: Submit via GitHub issues
- **Contact**: [Your contact information]

## 🔄 Version History

- **v1.0.0**: Initial release with transaction and address analysis
- **v0.1.0**: Beta version with basic functionality

---

**⚠️ Disclaimer**: This tool is for educational and research purposes. Always verify results with multiple sources before making financial decisions.
