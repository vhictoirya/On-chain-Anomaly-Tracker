# ChainWatch Frontend

A modern React-based dashboard for on-chain anomaly detection and security analysis.

## Features

- 🔍 **Transaction Anomaly Detection** - Detect wash trading, price manipulation, and pump & dump schemes
- 🥪 **Sandwich Attack Detection** - Identify MEV sandwich attacks
- 💼 **Insider Trading Detection** - Flag suspicious trading patterns
- 🤖 **Sniping Bot Detection** - Detect automated token sniping bots
- 💧 **Liquidity Manipulation** - Monitor liquidity pool manipulation
- ⚡ **Concentrated Attack Detection** - Identify coordinated attack patterns
- 🎯 **Pool Domination Analysis** - Track dominant entities in liquidity pools
- 🛡️ **Threat Assessment** - Comprehensive token security analysis

## Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **FastAPI Backend** - Python-based API (deployed on Railway)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see backend README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Configuration

The API endpoint is configured in `ChainWatchDashboard.jsx`:

```javascript
const API_BASE = 'https://on-chain-anomaly-tracker-production.up.railway.app/api/v1';
```

For local development, change to:
```javascript
const API_BASE = 'http://localhost:8001/api/v1';
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ChainWatchDashboard.jsx  # Main dashboard component
│   ├── App.jsx                       # Root app component
│   ├── App.css                       # App styles
│   ├── main.jsx                      # Entry point
│   └── index.css                     # Global styles with Tailwind
├── index.html                        # HTML template
├── package.json                      # Dependencies
├── vite.config.js                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
└── postcss.config.js                 # PostCSS configuration
```

## API Integration

The dashboard connects to the following API endpoints:

- `/api/v1/transaction-anomaly` - Transaction anomaly detection
- `/api/v1/sandwich-attack` - Sandwich attack detection
- `/api/v1/insider-trading` - Insider trading detection
- `/api/v1/sniping-bot` - Sniping bot detection
- `/api/v1/liquidity-manipulation` - Liquidity manipulation detection
- `/api/v1/concentrated-attack` - Concentrated attack detection
- `/api/v1/pool-domination` - Pool domination analysis
- `/api/v1/threat-assessment` - Token threat assessment

## Supported Chains

- Ethereum (eth)
- Binance Smart Chain (bsc)
- Polygon (polygon)
- Avalanche (avalanche)

## License

MIT

## Credits

Powered by Moralis & Webacy APIs
