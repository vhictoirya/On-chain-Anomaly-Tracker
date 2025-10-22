# ChainWatch Frontend - Quick Start Guide

## 🎯 What's Been Created

Your complete React frontend has been set up in the `frontend/` folder with:

- ✅ Modern React 18 application with Vite
- ✅ Tailwind CSS for styling
- ✅ Lucide React for icons
- ✅ Full ChainWatch Dashboard component
- ✅ All 8 analysis modules integrated
- ✅ Responsive design with beautiful UI
- ✅ Error handling and loading states

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ChainWatchDashboard.jsx    # Main dashboard
│   ├── App.jsx                         # Root component
│   ├── App.css                         # App styles
│   ├── main.jsx                        # Entry point
│   └── index.css                       # Global styles
├── index.html                          # HTML template
├── package.json                        # Dependencies
├── vite.config.js                      # Vite config
├── tailwind.config.js                  # Tailwind config
├── postcss.config.js                   # PostCSS config
├── .eslintrc.cjs                       # ESLint config
├── .gitignore                          # Git ignore
├── setup.ps1                           # Setup script
└── README.md                           # Documentation
```

## 🚀 Getting Started

### Option 1: Using Setup Script (Recommended)

```powershell
cd frontend
.\setup.ps1
```

This will:
1. Check Node.js installation
2. Install all dependencies
3. Offer to start the dev server

### Option 2: Manual Setup

```powershell
cd frontend
npm install
npm run dev
```

## 🎨 Features

### Analysis Modules
1. **Transaction Anomaly** - Wash trading, price manipulation, pump & dump
2. **Sandwich Attack** - MEV sandwich attack detection
3. **Insider Trading** - Suspicious trading pattern detection
4. **Sniping Bot** - Automated bot detection
5. **Liquidity Manipulation** - Pool manipulation detection
6. **Concentrated Attack** - Coordinated attack patterns
7. **Pool Domination** - Dominant entity analysis
8. **Threat Assessment** - Token security analysis

### UI Features
- 🎨 Beautiful gradient design with purple/pink theme
- 📱 Fully responsive (mobile, tablet, desktop)
- 🔄 Real-time loading states
- ⚠️ Error handling with user-friendly messages
- 🎯 Tab-based navigation
- 📊 Data visualization cards
- 🌈 Color-coded risk levels

## 🔧 Configuration

### API Endpoint

The dashboard connects to your Railway-deployed backend:
```javascript
const API_BASE = 'https://on-chain-anomaly-tracker-production.up.railway.app/api/v1';
```

For local development with backend running on port 8001:
```javascript
const API_BASE = 'http://localhost:8001/api/v1';
```

### Supported Chains
- Ethereum (eth)
- BSC (bsc)
- Polygon (polygon)
- Avalanche (avalanche)

## 📝 Available Scripts

```powershell
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## 🌐 Development Server

Once started, the app will be available at:
- **Local**: http://localhost:3000
- **Network**: Your local IP address will be shown

## 🎯 Usage Example

1. **Select Analysis Type**: Click on any of the 8 analysis tabs
2. **Enter Address**: Input token/wallet/pair address
3. **Select Chain**: Choose blockchain (Ethereum, BSC, etc.)
4. **Adjust Settings**: Set sensitivity (for transaction anomaly)
5. **Analyze**: Click the "Analyze" button
6. **View Results**: Beautiful cards show the analysis results

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      'purple': { /* your purple shades */ },
      'pink': { /* your pink shades */ }
    }
  }
}
```

### Changing API Endpoint

Edit `src/components/ChainWatchDashboard.jsx`:
```javascript
const API_BASE = 'your-api-url';
```

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# Change port in vite.config.js
server: {
  port: 3001  # Change to different port
}
```

### Dependencies Issues
```powershell
# Clear cache and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Tailwind Not Working
Make sure PostCSS and Tailwind are properly configured:
```powershell
npm install -D tailwindcss postcss autoprefixer
```

## 📦 Production Build

To build for production:
```powershell
npm run build
```

The optimized build will be in `dist/` folder. Deploy this to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 🔗 API Integration

The dashboard automatically formats API requests:

**Transaction Anomaly Example:**
```
GET /api/v1/transaction-anomaly?token_address=0x...&chain=eth&sensitivity=medium&limit=100&max_pages=5
```

**Response Handling:**
- ✅ Success: Displays formatted results
- ⚠️ Error: Shows user-friendly error message
- 🔄 Loading: Shows spinner and "Analyzing..." text

## 🎯 Next Steps

1. **Install Dependencies**: Run `.\setup.ps1` or `npm install`
2. **Start Dev Server**: Run `npm run dev`
3. **Test API Connection**: Try analyzing a token
4. **Customize**: Adjust colors, layout, or add features
5. **Deploy**: Build and deploy to your hosting service

## 💡 Tips

- Use default addresses provided for quick testing
- Check browser console for detailed error messages
- API responses are logged for debugging
- Adjust sensitivity for transaction anomaly detection
- Try different chains to compare results

## 🆘 Need Help?

- Check browser console for errors
- Verify backend API is running
- Test API endpoints directly in browser
- Review README.md for detailed documentation

## 🎉 You're All Set!

Your ChainWatch frontend is ready to use. Run the setup script and start analyzing on-chain anomalies!

---

**Built with:**
- React 18
- Vite
- Tailwind CSS
- Lucide React

**Powered by:**
- FastAPI Backend
- Moralis API
- Webacy API
