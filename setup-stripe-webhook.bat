@echo off
echo ====================================
echo Stripe Webhook Setup for Windows
echo ====================================
echo.

REM Check if Stripe CLI is installed
where stripe >nul 2>nul
if %errorlevel% neq 0 (
    echo Stripe CLI not found. Installing...
    echo.
    echo Downloading Stripe CLI...
    
    REM Create temp directory
    if not exist "%TEMP%\stripe-cli" mkdir "%TEMP%\stripe-cli"
    
    REM Download using PowerShell
    powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/stripe/stripe-cli/releases/latest/download/stripe_1.19.4_windows_x86_64.zip' -OutFile '%TEMP%\stripe-cli\stripe.zip'}"
    
    REM Extract
    powershell -Command "& {Expand-Archive -Path '%TEMP%\stripe-cli\stripe.zip' -DestinationPath '%TEMP%\stripe-cli' -Force}"
    
    REM Add to PATH for this session
    set PATH=%PATH%;%TEMP%\stripe-cli
    
    echo Stripe CLI installed temporarily!
    echo.
    echo To install permanently, run:
    echo scoop install stripe
    echo OR download from: https://github.com/stripe/stripe-cli/releases
    echo.
) else (
    echo Stripe CLI is already installed!
    echo.
)

echo Step 1: Login to Stripe
echo ========================
echo Please login to your Stripe account...
stripe login

echo.
echo Step 2: Starting Webhook Forwarding
echo ====================================
echo Forwarding webhooks to http://localhost:3000/api/webhooks/stripe
echo.
echo IMPORTANT: Copy the webhook signing secret (whsec_...) and paste it in your .env file
echo Look for: STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxx"
echo.

stripe listen --forward-to localhost:3000/api/webhooks/stripe

pause
