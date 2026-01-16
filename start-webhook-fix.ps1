# Start Stripe Webhook Listener for Local Development

Write-Host "🚀 Starting Stripe Webhook Listener..." -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this window open while testing payments!" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  1. Listen for Stripe payment events" -ForegroundColor White
Write-Host "  2. Forward them to your local server" -ForegroundColor White
Write-Host "  3. Update database when payment completes" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Check if stripe CLI is installed
$stripeExists = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripeExists) {
    Write-Host "❌ Stripe CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Installing Stripe CLI..." -ForegroundColor Yellow
    Write-Host ""
    
    # Download Stripe CLI
    $downloadUrl = "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_1.21.8_windows_x86_64.zip"
    $zipPath = "$env:TEMP\stripe-cli.zip"
    $extractPath = "$env:LOCALAPPDATA\stripe"
    
    try {
        Write-Host "Downloading..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
        
        Write-Host "Extracting..." -ForegroundColor Cyan
        New-Item -ItemType Directory -Force -Path $extractPath | Out-Null
        Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
        
        Write-Host "Adding to PATH..." -ForegroundColor Cyan
        $env:Path += ";$extractPath"
        
        Write-Host "✅ Stripe CLI installed successfully!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Failed to install Stripe CLI" -ForegroundColor Red
        Write-Host "Please install manually from: https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "🔐 Logging in to Stripe..." -ForegroundColor Cyan
stripe login

Write-Host ""
Write-Host "🎯 Starting webhook listener..." -ForegroundColor Green
Write-Host "   Forwarding to: http://localhost:3000/api/webhooks/stripe" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Start the webhook listener
stripe listen --forward-to localhost:3000/api/webhooks/stripe
