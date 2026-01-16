# Quick Stripe Webhook Setup (No Installation Required)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Quick Stripe Webhook Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Download Stripe CLI
$stripeZip = "$env:TEMP\stripe-cli.zip"
$stripeDir = "$env:TEMP\stripe-cli"
$stripeExe = "$stripeDir\stripe.exe"

if (-not (Test-Path $stripeExe)) {
    Write-Host "Downloading Stripe CLI..." -ForegroundColor Yellow
    
    # Create directory
    if (-not (Test-Path $stripeDir)) {
        New-Item -ItemType Directory -Path $stripeDir -Force | Out-Null
    }
    
    # Download
    $downloadUrl = "https://github.com/stripe/stripe-cli/releases/download/v1.21.8/stripe_1.21.8_windows_x86_64.zip"
    try {
        Invoke-WebRequest -Uri $downloadUrl -OutFile $stripeZip -UseBasicParsing
        
        Write-Host "Extracting..." -ForegroundColor Yellow
        Expand-Archive -Path $stripeZip -DestinationPath $stripeDir -Force
        
        Write-Host "Stripe CLI downloaded successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Failed to download Stripe CLI" -ForegroundColor Red
        Write-Host "Please download manually from:" -ForegroundColor Yellow
        Write-Host "https://github.com/stripe/stripe-cli/releases" -ForegroundColor Yellow
        pause
        exit
    }
} else {
    Write-Host "Stripe CLI already downloaded!" -ForegroundColor Green
    Write-Host ""
}

# Step 1: Login
Write-Host "Step 1: Login to Stripe" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "A browser window will open for login..." -ForegroundColor Yellow
Write-Host ""

& $stripeExe login

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Login failed or cancelled" -ForegroundColor Red
    pause
    exit
}

Write-Host ""
Write-Host "Step 2: Starting Webhook Forwarding" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Forwarding to: http://localhost:3000/api/webhooks/stripe" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT STEPS:" -ForegroundColor Red -BackgroundColor White
Write-Host ""
Write-Host "1. You will see a webhook signing secret like:" -ForegroundColor Yellow
Write-Host '   Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx' -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Copy that secret and update your .env file:" -ForegroundColor Yellow
Write-Host '   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"' -ForegroundColor Green
Write-Host ""
Write-Host "3. Restart your Next.js server (npm run dev)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Keep this window open during testing!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Enter to start..." -ForegroundColor Cyan
pause

# Start forwarding
& $stripeExe listen --forward-to localhost:3000/api/webhooks/stripe
