# 🔍 On-chain Anomaly Tracker

A comprehensive blockchain analytics platform for detecting and monitoring various on-chain anomalies and suspicious activities in real-time.

## 🎯 Project Overview

The On-chain Anomaly Tracker is a full-stack application designed to provide real-time monitoring and analysis of blockchain activities, focusing on detecting various types of anomalies and potential threats. The system combines multiple detection modules to provide a comprehensive view of blockchain security risks.

## ✨ Features

- 🔎 **Transaction Anomaly Detection**
  - 🔄 Wash Trading Detection
  - 📊 Price Manipulation Analysis
  - 📈 Pump & Dump Scheme Detection
  - ⚡ Risk Scoring System

- 🛡️ **Advanced Attack Detection**
  - 🥪 Sandwich Attack Analysis
  - 🎯 Insider Trading Detection
  - 🤖 Sniping Bot Identification
  - 💧 Liquidity Manipulation Monitoring

- 🌊 **Pool Analysis**
  - 🎯 Concentrated Attack Detection
  - 👑 Pool Domination Analysis
  - 💧 Liquidity Pool Monitoring

- 🚨 **Threat Assessment**
  - 📊 Overall Risk Scoring
  - 🔄 Multi-module Risk Analysis
  - ⚡ Real-time Alert System

## 🏗️ Technical Architecture

### 🎨 Frontend (Next.js 15.5.6)
- ⚛️ Modern React with TypeScript
- 🎯 Tailwind CSS for styling
- ⚡ Real-time alerts and notifications
- 📊 Interactive dashboard components
- 📱 Responsive design for all devices

### 🔧 Backend (Python)
- 🚀 FastAPI for API endpoints
- 🔗 Moralis integration for blockchain data
- 🧠 Advanced analytics modules
- ⚡ Real-time data processing

### ☁️ Infrastructure
- 🚀 Frontend deployed on Vercel
- 🌐 API hosted with scalable backend
- ⚙️ Environment-based configuration
- 🔒 Secure API key management

## 📅 Development Timeline

### 🔧 Backend Development (October 2025)
1. 🏗️ Set up Python virtual environment
2. 🧠 Implemented core analytics modules:
   - 🔍 Transaction anomaly detection
   - 🥪 Sandwich attack analysis
   - 🎯 Insider trading detection
   - 🤖 Sniping bot detection
   - 💧 Liquidity manipulation analysis
3. 🔗 Integrated Moralis API for blockchain data
4. ⚡ Implemented data processing pipelines

### 🎨 Frontend Development (October 2025)
1. ⚛️ Created Next.js project with TypeScript
2. 🏗️ Developed core components:
   - 📊 ChainWatchDashboard
   - 🚨 AlertBanner
   - 📈 Analysis modules
3. ⚡ Implemented real-time alerts
4. 📱 Added responsive design
5. 🔗 Integrated with backend API

### 🚀 Deployment (October 18, 2025)
1. Configured Vercel deployment
2. Set up environment variables
3. Implemented ESLint configurations
4. Successfully deployed to production

## 🚀 Production Deployment

The application is successfully deployed and accessible at:
- 🌐 Frontend: [https://frontend-1ts52gaqe-vhictoiryas-projects.vercel.app](https://frontend-1ts52gaqe-vhictoiryas-projects.vercel.app)
- 🔧 Backend API: Hosted on dedicated server

### ⚙️ Production Configuration
- 🌎 Single-region deployment on Vercel (iad1 - Washington, D.C., USA)
- 🔍 ESLint configured for production builds
- 📝 TypeScript strict mode enabled
- 🔒 Environment variables properly configured

## 🎯 Getting Started

### 📋 Prerequisites
- 📦 Node.js 18+
- 🐍 Python 3.13+
- 🔑 Moralis API Key

### 🔧 Installation

1. 📥 Clone the repository:
```bash
git clone https://github.com/vhictoirya/On-chain-Anomaly-Tracker.git
cd On-chain-Anomaly-Tracker
```

2. 🔧 Set up the backend:
```bash
python -m venv anomaly
source anomaly/Scripts/activate  # On Windows use: .\anomaly\Scripts\Activate.ps1
pip install -r requirements.txt
```

3. 🎨 Set up the frontend:
```bash
cd frontend
npm install
```

4. 🔒 Create environment variables:
```bash
# Backend (.env)
MORALIS_KEY=your_moralis_api_key

# Frontend (.env.local)
NEXT_PUBLIC_API_BASE=http://localhost:8000/api/v1
```

5. 🚀 Run the application:
```bash
# Backend
python backend/app.py

# Frontend
cd frontend
npm run dev
```

## 🤝 Contributing

1. 🔱 Fork the repository
2. 🌿 Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. 🚀 Push to the branch (`git push origin feature/AmazingFeature`)
5. 📝 Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
