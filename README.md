# 🗳️ Decentralized Voting DApp

A modern, blockchain-powered voting platform built on Algorand with a sleek, cyber-themed UI.

---

## ⚠️ **CRITICAL: READ THIS FIRST**

### 🚨 You're Seeing These Errors:
```
ERR_CONNECTION_CLOSED
logic eval error: assert failed pc=203
App ID: 755793816
```

### ✅ **THE SOLUTION:**
**App ID 755793816 doesn't exist!** You need to deploy the contract first.

**Quick Fix (10 minutes)**:
1. Create `.env.testnet` in `projects/voting-contracts/`:
   ```
   DEPLOYER_MNEMONIC="your 25 word phrase"
   ```
2. Deploy: `.\deploy-testnet.ps1`
3. Update `APP_ID` in `src/hooks/usePolls.ts` with new ID
4. Restart frontend

📚 **Full Instructions**: Open [`FIX_DEPLOYMENT.md`](./FIX_DEPLOYMENT.md)  
⚡ **Quick Reference**: Open [`QUICK_REFERENCE.md`](./QUICK_REFERENCE.md)

---

## ✨ Features

- 🔐 **Secure Voting**: One vote per wallet address
- ⏱️ **Time-Bounded Polls**: Set custom durations for polls
- 📊 **Live Results**: Real-time vote tracking with progress bars
- 🎨 **Modern UI**: Futuristic blockchain-themed design
- 💼 **Wallet Integration**: Support for Pera, Defly, and Exodus wallets
- 🔍 **Transparent**: All votes recorded on Algorand blockchain
- 📱 **Responsive**: Works on desktop and mobile devices

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
# Smart contracts
cd projects/voting-contracts
npm install

# Frontend
cd ../voting-frontend
npm install
```

### 2. Build & Deploy Contract
```powershell
cd projects/voting-contracts
algokit project run build
algokit project deploy testnet
```
**Save the App ID from deployment!**

### 3. Update Frontend Configuration
Edit `projects/voting-frontend/src/hooks/usePolls.ts`:
```typescript
const APP_ID = YOUR_APP_ID_HERE;
```

### 4. Run Application
```powershell
cd projects/voting-frontend
npm run dev
```

Visit `http://localhost:5173`

## 📝 Usage

1. Connect your Algorand wallet
2. Opt-in to the application
3. Create a poll or vote on existing ones
4. View real-time results

## 🏗️ Tech Stack

- **Smart Contract**: Algorand TypeScript
- **Frontend**: React + TypeScript
- **Wallet**: @txnlab/use-wallet-react
- **Network**: Algorand TestNet

## 📊 Current Status

✅ **Completed**:
- Smart contract (single poll support)
- Modern responsive UI
- Wallet integration
- Real-time vote tracking
- Opt-in functionality
- Time-bounded polls

⚠️ **Limitation**: One active poll at a time

## 🔧 Troubleshooting

**"Poll already active"**: End current poll first
**"Not opted in"**: Click opt-in button and confirm transaction
**Build errors**: Run `npm install` and rebuild

## 📚 Documentation

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for detailed documentation.

---

**Built on Algorand**
