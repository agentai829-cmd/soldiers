# SETUP.md - Sintra AI Clone Setup Guide

## 🚀 Quick Start

### 1. Prerequisites Installation

#### Node.js and pnpm
```bash
# Install Node.js 18+ from https://nodejs.org
# Install pnpm
npm install -g pnpm

# Verify installation
node --version  # Should be 18+
pnpm --version
```

#### Docker (Optional but recommended)
```bash
# Install Docker Desktop from https://docker.com
# Verify installation
docker --version
docker-compose --version
```

### 2. Project Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd sintra-clone

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### 3. Environment Configuration

Edit `.env.local` with your actual values:

#### Required Services Setup

##### Clerk Authentication
1. Visit https://clerk.com and create an account
2. Create a new application
3. Configure settings:
   - Enable Organizations
   - Add allowed redirect URLs: `http://localhost:3000`, `https://your-domain.com`
4. Copy your keys to `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

##### OpenAI API
1. Visit https://platform.openai.com
2. Create an API key
3. Add to `.env.local`:

```env
OPENAI_API_KEY=sk-...
```

##### Stripe (Billing)
1. Visit https://stripe.com and create an account
2. Go to Developers > API Keys
3. Create products and prices for subscription plans
4. Add to `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # After setting up webhooks
```

##### Cloudinary (Image Storage)
1. Visit https://cloudinary.com and create an account
2. Get your credentials from Dashboard
3. Add to `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### 4. Database Setup

#### Option A: Docker (Recommended)
```bash
# Start PostgreSQL and Redis with Docker
docker-compose up -d

# Wait for services to start (about 30 seconds)
# Check status
docker-compose ps
```

#### Option B: Local Installation
```bash
# Install PostgreSQL with pgvector
# On macOS:
brew install postgresql pgvector
brew services start postgresql

# On Ubuntu:
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo -u postgres psql -c "CREATE EXTENSION vector;"

# Install Redis
# On macOS:
brew install redis
brew services start redis

# On Ubuntu:
sudo apt-get install redis-server
```

#### Database Migration
```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed with demo data
pnpm db:seed
```

### 5. Development Server

```bash
# Terminal 1: Start Next.js development server
pnpm dev

# Terminal 2: Start background worker
pnpm worker

# Terminal 3: (Optional) Open Prisma Studio
pnpm db:studio
```

Visit http://localhost:3000 to see your application!

## 🔧 Third-Party Service Configuration

### Stripe Webhooks
1. In Stripe Dashboard, go to Developers > Webhooks
2. Create endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook secret to `.env.local`

### Social Media APIs

#### Facebook/Instagram
1. Visit https://developers.facebook.com
2. Create a new app
3. Add Facebook Login and Instagram Basic Display products
4. Configure OAuth redirect URIs:
   - `https://your-domain.com/api/social/oauth/callback/facebook`
   - `https://your-domain.com/api/social/oauth/callback/instagram`
5. Add to `.env.local`:

```env
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
INSTAGRAM_CLIENT_ID=...
INSTAGRAM_CLIENT_SECRET=...
```

#### LinkedIn
1. Visit https://developer.linkedin.com
2. Create a new app
3. Request access to "Share on LinkedIn" and "Sign In with LinkedIn"
4. Configure redirect URI: `https://your-domain.com/api/social/oauth/callback/linkedin`
5. Add to `.env.local`:

```env
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...
```

#### Gmail Integration
1. Visit https://console.developers.google.com
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Configure redirect URI: `https://your-domain.com/api/email/oauth/callback/gmail`
6. Add to `.env.local`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### Additional Configuration
```env
# Security
JWT_ENCRYPTION_KEY=your-32-character-key-here

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database & Redis URLs
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sintra_clone"
REDIS_URL="redis://localhost:6379"
```

## 🚀 Production Deployment

### Vercel (Recommended)

1. **Database Setup**: Use a managed PostgreSQL service with pgvector support:
   - [Neon](https://neon.tech) (Recommended - has pgvector)
   - [Supabase](https://supabase.com) (Has pgvector)
   - [Railway](https://railway.app)

2. **Redis Setup**: Use a managed Redis service:
   - [Upstash](https://upstash.com) (Recommended)
   - [Redis Labs](https://redis.com)

3. **Deploy to Vercel**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login and deploy
   vercel login
   vercel
   
   # Follow prompts and add environment variables
   ```

4. **Environment Variables**: Add all environment variables in Vercel dashboard

5. **Database Migration**: Run migrations in Vercel:
   ```bash
   # In Vercel dashboard, go to Functions tab
   # Run: pnpm db:push
   ```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL and Redis services
railway add postgresql
railway add redis

# Deploy
railway up

# Run migrations
railway run pnpm db:push
railway run pnpm db:seed
```

### Docker Production

```bash
# Build production image
docker build -t sintra-clone .

# Run with production environment
docker run -p 3000:3000 \
  --env-file .env.production \
  sintra-clone
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
# Install Playwright browsers
pnpm playwright install

# Run E2E tests
pnpm test:e2e
```

### Type Checking
```bash
pnpm type-check
```

### Linting and Formatting
```bash
# Check linting
pnpm lint

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Or for local installation
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Ubuntu
```

#### 2. Redis Connection Failed
```bash
# Check if Redis is running
docker-compose ps redis

# Or for local installation
brew services list | grep redis  # macOS
sudo systemctl status redis      # Ubuntu
```

#### 3. Prisma Client Not Generated
```bash
# Regenerate Prisma client
pnpm db:generate
```

#### 4. pgvector Extension Missing
```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 5. Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Performance Tips

1. **Database Optimization**:
   ```sql
   -- Add indexes for better performance
   CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);
   ```

2. **Environment Variables**: Use production values for better performance:
   ```env
   NODE_ENV=production
   NEXT_TELEMETRY_DISABLED=1
   ```

## 📊 Monitoring and Logs

### Development
```bash
# View application logs
pnpm dev

# View worker logs
pnpm worker

# View database queries (in another terminal)
pnpm db:studio
```

### Production
- Use Vercel Analytics for frontend monitoring
- Use your database provider's monitoring tools
- Consider adding services like Sentry for error tracking

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the logs for error messages
3. Ensure all environment variables are correctly set
4. Verify all third-party services are properly configured

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Stripe Documentation](https://stripe.com/docs)