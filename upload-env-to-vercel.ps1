# Script to upload all environment variables from .env to Vercel
# Run this script: .\upload-env-to-vercel.ps1

Write-Host "Uploading environment variables to Vercel..." -ForegroundColor Cyan

# Read .env file
$envFile = Get-Content -Path ".env" -Raw

# Split into lines and process each variable
$lines = $envFile -split "`n"

foreach ($line in $lines) {
    # Skip comments and empty lines
    if ($line -match "^\s*#" -or $line -match "^\s*$") {
        continue
    }
    
    # Extract key and value
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        
        # Remove quotes if present
        $value = $value -replace '^[''"]|[''"]$', ''
        
        Write-Host "Setting $key..." -ForegroundColor Yellow
        
        # Add to Vercel for all environments
        try {
            vercel env add $key production --force
            Write-Output $value | Out-Null
            
            vercel env add $key preview --force
            Write-Output $value | Out-Null
            
            vercel env add $key development --force
            Write-Output $value | Out-Null
            
            Write-Host "✓ $key added successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "✗ Failed to add $key" -ForegroundColor Red
        }
    }
}

Write-Host "`nAll environment variables uploaded!" -ForegroundColor Green
Write-Host "Note: You may need to redeploy your project for changes to take effect." -ForegroundColor Yellow
