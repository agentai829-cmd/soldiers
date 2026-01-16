# Sintra AI Clone

A production-ready clone of Sintra.ai built with Next.js, featuring AI-powered workspace automation, social media management, and email integration.

## 🚀 Features

### Core Features
- **Multi-tenant Workspaces**: Organizations with role-based access control
- **AI Helpers**: Customizable AI assistants (like Soshie, Cassie) for various tasks
- **Brain AI Knowledge Base**: RAG-powered knowledge management with pgvector
- **Automations**: Visual automation builder with triggers and actions
- **Social Media Management**: LinkedIn, Facebook, Instagram posting with OAuth
- **Email Integration**: Gmail integration with AI-powered responses
- **Billing & Subscriptions**: Stripe integration with multiple plans

### Technical Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL with pgvector
- **Authentication**: Clerk (multi-tenant organizations)
- **AI**: OpenAI APIs (GPT-4, embeddings)
- **Payments**: Stripe (subscriptions + webhooks)
- **File Storage**: Cloudinary
- **Background Jobs**: Redis + BullMQ
- **Deployment**: Docker, Vercel/Railway ready

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 13+ with pgvector extension
- Redis
- Docker & Docker Compose (optional, for local development)

## 🛠 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd sintra-clone
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

#### Database
```env
DATABASE_URL="postgresql://username:password@localhost:5432/sintra_clone?schema=public"
PGVECTOR_DIM=1536
```

#### Redis
```env
REDIS_URL="redis://localhost:6379"
```

#### Clerk Authentication
1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Get your keys from the dashboard:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

#### OpenAI
```env
OPENAI_API_KEY=sk-...
```

#### Stripe
1. Create a Stripe account
2. Get your keys and create products:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE=pk_test_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...
```

#### Cloudinary
```env
CLOUDINARY_URL=cloudinary://...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

#### Other
```env
JWT_ENCRYPTION_KEY=your-32-character-encryption-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

#### Option A: Using Docker (Recommended for development)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# The docker-compose.yml includes pgvector extension
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL and the pgvector extension:
```bash
# On macOS with Homebrew
brew install postgresql pgvector

# On Ubuntu
sudo apt-get install postgresql postgresql-contrib
```

2. Create database and enable pgvector:
```sql
CREATE DATABASE sintra_clone;
\c sintra_clone;
CREATE EXTENSION vector;
```

### 4. Database Migration and Seeding

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
# Start the Next.js development server
pnpm dev

# In another terminal, start the background worker
pnpm worker
```

The app will be available at http://localhost:3000

## 🔧 Configuration Steps

### 1. Clerk Setup

1. In your Clerk dashboard, configure:
   - **Redirect URLs**: Add your app URLs
   - **Organizations**: Enable organizations feature
   - **Social Providers**: Configure OAuth providers if needed

### 2. Stripe Setup

1. Create products and prices in Stripe dashboard
2. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

### 3. Social Media OAuth Setup

#### Facebook/Instagram
1. Create a Facebook Developer App
2. Add Facebook Login and Instagram Basic Display products
3. Configure redirect URIs: `https://your-domain.com/api/social/oauth/callback`

#### LinkedIn
1. Create a LinkedIn Developer App
2. Request access to Share on LinkedIn and Sign In with LinkedIn
3. Configure redirect URIs

#### Gmail Integration
1. Create a Google Cloud Project
2. Enable Gmail API
3. Create OAuth 2.0 credentials
4. Configure redirect URIs: `https://your-domain.com/api/email/oauth/callback`

## 📦 Production Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set all environment variables in Vercel dashboard
3. Deploy

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker Deployment

```bash
# Build production image
docker build -t sintra-clone .

# Run with environment variables
docker run -p 3000:3000 --env-file .env.production sintra-clone
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
pnpm test:e2e
```

## 📊 Database Schema

### Key Models

- **User**: Clerk integration with user profiles
- **Workspace**: Multi-tenant organizations
- **Member**: User-workspace relationships with roles
- **Helper**: AI assistants with custom prompts
- **KnowledgeDoc**: Documents for RAG knowledge base
- **Embedding**: pgvector embeddings for semantic search
- **Automation**: Automation workflows with triggers/actions
- **SocialAccount**: OAuth tokens for social platforms
- **EmailAccount**: Email integration settings
- **BillingSubscription**: Stripe subscription management

## 🔐 Security Checklist

- [x] Environment variables for all secrets
- [x] Encrypted storage for OAuth tokens
- [x] Webhook signature verification
- [x] Rate limiting on API endpoints
- [x] Input sanitization and validation
- [x] Role-based access control
- [x] CORS configuration

## 🚧 Development Roadmap

### Phase 1: Core Platform ✅
- [x] Authentication & multi-tenancy
- [x] Basic UI components
- [x] Database schema & migrations
- [x] Helper management

### Phase 2: AI Features (In Progress)
- [ ] Brain AI knowledge base
- [ ] RAG implementation
- [ ] OpenAI integration
- [ ] Helper execution engine

### Phase 3: Automations
- [ ] Visual automation builder
- [ ] Trigger system (schedule, webhook, email)
- [ ] Action system (generate, post, email)
- [ ] Background job processing

### Phase 4: Integrations
- [ ] Social media OAuth flows
- [ ] Posting APIs (LinkedIn, Facebook, Instagram)
- [ ] Gmail integration
- [ ] Email automation

### Phase 5: Billing & Admin
- [ ] Stripe subscription flows
- [ ] Usage tracking & limits
- [ ] Admin dashboard
- [ ] Analytics & reporting

## 📝 API Documentation

### Authentication
All API routes (except webhooks) require Clerk authentication.

### Key Endpoints

- `POST /api/helpers` - Create AI helper
- `POST /api/helpers/[id]/run` - Execute helper task
- `POST /api/brain/upload` - Upload knowledge documents
- `GET /api/brain/query` - Query knowledge base
- `POST /api/automations` - Create automation
- `POST /api/social/post` - Post to social media
- `POST /api/email/send` - Send email

### Webhook Endpoints
- `POST /api/webhooks/stripe` - Stripe webhooks
- `POST /api/webhooks/clerk` - Clerk user sync
- `POST /api/webhooks/social` - Social media webhooks

## 💡 Usage Examples

### Creating an AI Helper
```typescript
const helper = await fetch('/api/helpers', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Content Writer',
    description: 'Creates engaging blog posts',
    prompt: 'You are a content writer...',
    workspaceId: 'workspace_123'
  })
})
```

### Running an Automation
```typescript
const automation = {
  name: 'Weekly LinkedIn Post',
  trigger: { type: 'schedule', cron: '0 9 * * 1' },
  actions: [
    { type: 'generate_post', platform: 'linkedin' },
    { type: 'post_social', platform: 'linkedin' }
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@your-domain.com
- 💬 Discord: [Your Discord Server]
- 📖 Documentation: [Your Docs URL]

## 🙏 Acknowledgments

- [Sintra.ai](https://sintra.ai) for the inspiration
- [Clerk](https://clerk.com) for authentication
- [Vercel](https://vercel.com) for hosting
- [OpenAI](https://openai.com) for AI capabilities