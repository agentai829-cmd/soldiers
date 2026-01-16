# Vercel Environment Variables Setup for Leo API

## Required Environment Variables

To deploy Leo's OpenAI API configuration on Vercel, you need to set these environment variables:

### 1. OPENAI_PROMPT_ID
**Value:** `pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342`
**Description:** The prompt ID for Leo's OpenAI Responses API configuration

### 2. OPENAI_PROMPT_VERSION  
**Value:** `3`
**Description:** The version number for the OpenAI prompt

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **Sintra-clone** project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:

   **Variable 1:**
   - Name: `OPENAI_PROMPT_ID`
   - Value: `pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342`
   - Environments: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - Name: `OPENAI_PROMPT_VERSION`
   - Value: `3`
   - Environments: ✅ Production ✅ Preview ✅ Development

5. Click **Save** for each variable
6. **Redeploy** your application

### Method 2: Vercel CLI
```bash
# Add prompt ID
vercel env add OPENAI_PROMPT_ID
# Enter: pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342

# Add prompt version  
vercel env add OPENAI_PROMPT_VERSION
# Enter: 3

# Deploy to production
vercel --prod
```

### Method 3: Vercel CLI (One Command)
```bash
# Set both variables at once
echo "OPENAI_PROMPT_ID=pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342" | vercel env add OPENAI_PROMPT_ID --scope production,preview,development
echo "OPENAI_PROMPT_VERSION=3" | vercel env add OPENAI_PROMPT_VERSION --scope production,preview,development
```

## Local Development Setup

Create a `.env.local` file in your project root:

```env
# Leo API Configuration
OPENAI_PROMPT_ID=pmpt_691b921aa57c8197a13b1b3565e087b70caf3038b6a9f342
OPENAI_PROMPT_VERSION=3

# Your other environment variables...
OPENAI_API_KEY=your-openai-api-key
```

## Verification Steps

1. **Deploy to Vercel** with the new environment variables
2. **Test Leo (Growth Bot)** in your deployed application
3. **Check logs** in Vercel dashboard for any API errors
4. **Verify** that Leo uses the new OpenAI Responses API

## Troubleshooting

- **If deployment fails:** Check that environment variable names are exact
- **If Leo doesn't work:** Verify the prompt ID and version are correct
- **For API errors:** Check Vercel function logs in the dashboard
- **Local testing:** Make sure `.env.local` file is in project root and not committed to git

## Production Checklist

- [ ] Environment variables added to Vercel
- [ ] Variables set for Production, Preview, and Development
- [ ] Application redeployed
- [ ] Leo (Growth Bot) tested in production
- [ ] API logs checked for errors

---

**Note:** The prompt ID and version are specific to Leo's OpenAI configuration. Do not share these values publicly.