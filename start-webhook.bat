@echo off
echo ====================================
echo  STRIPE WEBHOOK LISTENER - START
echo ====================================
echo.
echo Starting Stripe webhook listener...
echo This will forward Stripe events to localhost:3000
echo.
echo IMPORTANT: Keep this window open while testing payments!
echo.
echo ====================================
echo.

stripe listen --forward-to localhost:3000/api/webhooks/stripe

pause
