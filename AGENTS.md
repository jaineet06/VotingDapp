# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Campus Vote - A decentralized voting platform for campus elections built on Algorand blockchain. Features one-vote-per-wallet enforcement, transparent results, time-bounded polls, and optional token-gating.

## Architecture

### Monorepo Structure
- `projects/voting-contracts/` - Algorand smart contracts (TypeScript using Algorand-TypeScript)
- `projects/voting-frontend/` - React frontend with Vite

### Smart Contract (`voting-contracts/smart_contracts/voting/contract.algo.ts`)
Uses Algorand-TypeScript with:
- **Global State**: Poll question, 4 options, vote counts, poll metadata
- **Local State**: `hasVoted`, `votedOption` per user
- **Key Methods**: `createPoll`, `vote`, `getResults`, `checkPollActive`, `endPoll`

### Frontend (`voting-frontend/src/`)
- React 18 + Vite + TypeScript
- `@txnlab/use-wallet-react` for wallet integration (Pera, Defly, Exodus, KMD)
- Auto-generated client at `src/contracts/VotingContract.ts`
- Components: `Home.tsx`, `CreatePoll.tsx`, `VotingInterface.tsx`, `ResultsDashboard.tsx`, `VoteAudit.tsx`

## Build Commands

### Contracts
```bash
cd projects/voting-contracts
npm install
npm run build          # Compile contracts + generate client
npm run deploy         # Deploy to configured network (requires .env)
npm run check-types    # TypeScript validation
```

### Frontend  
```bash
cd projects/voting-frontend
npm install
npm run dev            # Start dev server
npm run build          # Production build
npm run generate:app-clients  # Regenerate contract clients
```

### Full Project
```bash
algokit project bootstrap all    # Install all dependencies
algokit project run build        # Build everything
```

## Network Configuration

### Testnet (Current)
Frontend `.env`:
```
VITE_ALGOD_SERVER="https://testnet-api.algonode.cloud"
VITE_ALGOD_NETWORK="testnet"
VITE_INDEXER_SERVER="https://testnet-idx.algonode.cloud"
```

Contracts `.env`:
```
ALGOD_SERVER=https://testnet-api.algonode.cloud
DEPLOYER_MNEMONIC=<your 25-word phrase>
```

### Deployment with Lora
1. Get testnet ALGO: https://bank.testnet.algorand.network/ or use Lora dispenser
2. Set `DEPLOYER_MNEMONIC` in `voting-contracts/.env`
3. Run `npm run deploy` from voting-contracts
4. Note the App ID from output for frontend use

## Contract-Frontend Integration
After modifying `contract.algo.ts`:
1. Run `npm run build` in voting-contracts
2. Client auto-generates at `smart_contracts/artifacts/voting/VotingContractClient.ts`
3. Run `npm run generate:app-clients` in voting-frontend to sync

## Key Design Decisions
- Polls support 2-4 options (options 3-4 optional)
- One vote per wallet enforced via local state
- Poll creator can end poll early
- Token-gating available but disabled (tokenId=0 means no restriction)
- Vote results publicly readable on-chain
