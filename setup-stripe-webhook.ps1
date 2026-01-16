# Stripe Webhook Setup Script for PowerShell

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Stripe Webhook Setup" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripePath) {
    Write-Host "Stripe CLI not found. Installing..." -ForegroundColor Yellow
    Write-Host ""
    
    # Try to install via scoop
    $scoopPath = Get-Command scoop -ErrorAction SilentlyContinue
    
    if ($scoopPath) {
        Write-Host "Installing Stripe CLI via Scoop..." -ForegroundColor Green
        scoop install stripe
    } else {
        Write-Host "Please install Stripe CLI manually:" -ForegroundColor Red
        Write-Host "1. Install Scoop: https://scoop.sh" -ForegroundColor Yellow
        Write-Host "2. Run: scoop install stripe" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "OR download directly:" -ForegroundColor Yellow
        Write-Host "https://github.com/stripe/stripe-cli/releases" -ForegroundColor Yellow
        Write-Host ""
        
        # Ask if user wants to continue with manual download
        $response = Read-Host "Do you want to open the download page? (Y/N)"
        if ($response -eq "Y" -or $response -eq "y") {
            Start-Process "https://github.com/stripe/stripe-cli/releases"
        }
        
        Write-Host ""
        Write-Host "After installing, run this script again." -ForegroundColor Yellow
        pause
        exit
    }
}

Write-Host "Stripe CLI is ready!" -ForegroundColor Green
Write-Host ""

# Step 1: Login to Stripe
Write-Host "Step 1: Login to Stripe" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "Opening browser for Stripe login..." -ForegroundColor Yellow
Write-Host ""

stripe login

Write-Host ""
Write-Host "Step 2: Starting Webhook Forwarding" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Forwarding webhooks to: http://localhost:3000/api/webhooks/stripe" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Red -BackgroundColor White
Write-Host "1. Copy the webhook signing secret (whsec_...)" -ForegroundColor Yellow
Write-Host "2. Update .env file:" -ForegroundColor Yellow
Write-Host '   STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"' -ForegroundColor Green
Write-Host ""
Write-Host "Keep this terminal open while testing payments!" -ForegroundColor Yellow
Write-Host ""

# Start webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
