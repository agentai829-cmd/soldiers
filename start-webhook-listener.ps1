# Start Stripe Webhook Listener
# This will forward Stripe events to your local server

Write-Host "🎧 Starting Stripe webhook listener..." -ForegroundColor Cyan
Write-Host "⚠️  Keep this terminal open!" -ForegroundColor Yellow
Write-Host ""

stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
