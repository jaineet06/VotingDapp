# Deployment Instructions - Fix Mnemonic Error

## The Problem
Your contract deployment is failing because `.env` contains placeholder text instead of a real mnemonic.

## Solution

### Step 1: Get a TestNet Account & Mnemonic

**Option A: Use AlgoKit (Recommended)**
```powershell
cd c:\Users\jaine\OneDrive\Desktop\rift\voting\projects\voting-contracts
algokit goal account new testnet-deployer
```
This will output a 25-word mnemonic phrase. **SAVE IT SECURELY!**

**Option B: Use Pera Wallet**
1. Install Pera Wallet mobile app
2. Create new account
3. Go to Settings → View Recovery Phrase
4. Write down the 25 words

**Option C: Use TestNet Dispenser**
1. Go to https://bank.testnet.algorand.network/
2. Click "Create Account" 
3. Save the mnemonic shown

### Step 2: Fund Your Account
1. Copy your account address
2. Go to https://bank.testnet.algorand.network/
3. Paste address and click "Dispense"
4. You'll receive 10 TestNet ALGO

### Step 3: Update .env File
Edit `projects/voting-contracts/.env`:

```properties
# Replace this line:
DEPLOYER_MNEMONIC=your twenty four word mnemonic phrase goes here replace this with your actual mnemonic words

# With your actual 25-word mnemonic (example format):
DEPLOYER_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art
```

**IMPORTANT**: 
- Must be exactly 25 words
- Separated by single spaces
- No quotes needed
- All lowercase
- Use your actual mnemonic, not the example above!

### Step 4: Deploy Contract
```powershell
cd c:\Users\jaine\OneDrive\Desktop\rift\voting\projects\voting-contracts
algokit project deploy testnet
```

### Step 5: Update Frontend with New App ID
1. Look for "App ID:" in the deployment output (e.g., `755799123`)
2. Update `projects/voting-frontend/src/hooks/usePolls.ts` line 7:
   ```typescript
   const APP_ID = 755799123; // Replace with your new App ID
   ```

### Step 6: Test
```powershell
cd c:\Users\jaine\OneDrive\Desktop\rift\voting\projects\voting-frontend
npm run dev
```

Now try opting in - it should work! ✅

## Why This Happened
The contract at App ID 755799121 was deployed WITHOUT the opt-in handler. We added the handler and recompiled, but need to deploy a NEW contract instance to use the fixed code.

## Security Note
- **NEVER share your mnemonic phrase**
- **NEVER commit `.env` to git** (it's in `.gitignore`)
- This is TestNet only - use a different account for MainNet
