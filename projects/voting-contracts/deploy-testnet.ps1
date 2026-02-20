# Deploy Voting Contract to TestNet
# This script builds and deploys the contract, then displays the new App ID

param(
    [switch]$SkipBuild = $false
)

Write-Host ""
Write-Host "🚀 Voting Contract Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.testnet exists
if (-not (Test-Path ".env.testnet")) {
    Write-Host "❌ Error: .env.testnet file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please create .env.testnet file with:" -ForegroundColor Yellow
    Write-Host '  DEPLOYER_MNEMONIC="your 25-word mnemonic phrase"' -ForegroundColor White
    Write-Host ""
    Write-Host "Get TestNet funds from: https://bank.testnet.algorand.network/" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

# Build contract (unless skipped)
if (-not $SkipBuild) {
    Write-Host "📦 Building contract..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "❌ Build failed! Please fix errors and try again." -ForegroundColor Red
        Write-Host ""
        exit 1
    }
    
    Write-Host "✅ Build successful!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "⏭️  Skipping build (using existing artifacts)" -ForegroundColor Yellow
    Write-Host ""
}

# Deploy to TestNet
Write-Host "🌐 Deploying to TestNet..." -ForegroundColor Yellow
Write-Host ""

$deployOutput = algokit project deploy testnet 2>&1 | Out-String

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment Successful!" -ForegroundColor Green
    Write-Host "=========================" -ForegroundColor Green
    Write-Host ""
    
    # Try to extract App ID from output
    if ($deployOutput -match "app[_\s]*id[:\s]*(\d+)") {
        $appId = $matches[1]
        Write-Host "📍 New App ID: $appId" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "⚠️  IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
        Write-Host "1. Update APP_ID in: voting-frontend\src\hooks\usePolls.ts" -ForegroundColor White
        Write-Host "   Change line 8 to: const APP_ID = $appId;" -ForegroundColor White
        Write-Host ""
        Write-Host "2. Restart frontend:" -ForegroundColor White
        Write-Host "   cd ..\voting-frontend" -ForegroundColor White
        Write-Host "   npm run dev" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host $deployOutput
        Write-Host ""
        Write-Host "⚠️  Could not extract App ID from output." -ForegroundColor Yellow
        Write-Host "Please check the output above for your new App ID." -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Host "📚 Deployment info saved in: .deploynment/deployment-record.json" -ForegroundColor Cyan
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Deployment Failed!" -ForegroundColor Red
    Write-Host "====================" -ForegroundColor Red
    Write-Host ""
    Write-Host $deployOutput
    Write-Host ""
    
    # Common error hints
    if ($deployOutput -match "mnemonic") {
        Write-Host "💡 Hint: Check your .env.testnet file" -ForegroundColor Yellow
        Write-Host "   - Must be exactly 25 words" -ForegroundColor White
        Write-Host "   - Separated by single spaces" -ForegroundColor White
        Write-Host "   - No extra quotes or characters" -ForegroundColor White
    }
    
    if ($deployOutput -match "balance|funds") {
        Write-Host "💡 Hint: Account needs TestNet funds" -ForegroundColor Yellow
        Write-Host "   Get funds from: https://bank.testnet.algorand.network/" -ForegroundColor White
    }
    
    Write-Host ""
    exit 1
}

Write-Host "🎉 All done! Connect your wallet and test the app." -ForegroundColor Green
Write-Host ""
