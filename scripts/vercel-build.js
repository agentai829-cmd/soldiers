#!/usr/bin/env node

/**
 * Vercel Build Script with Enhanced Database Management
 * 
 * This script is specifically designed for Vercel deployments and includes:
 * - Pre-build database setup
 * - Schema generation and migration
 * - Post-build verification
 * - Environment-aware deployment strategies
 */

const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}🚀 [Vercel Build] ${message}${colors.reset}`);
}

function runCommand(command, description) {
  try {
    log(`${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    throw error;
  }
}

async function vercelBuild() {
  log('Starting Vercel Build Process', 'cyan');
  
  const isPreview = process.env.VERCEL_ENV === 'preview';
  const isProduction = process.env.VERCEL_ENV === 'production';
  
  try {
    // Step 1: Database Setup
    log('Setting up database...', 'blue');
    
    // Always generate Prisma client first
    runCommand('prisma generate', 'Generating Prisma Client');
    
    // Deploy migrations (safe for production)
    if (isProduction || isPreview) {
      runCommand('prisma migrate deploy', 'Deploying Database Migrations');
    } else {
      // For development builds, we might want to push schema changes
      runCommand('prisma db push', 'Pushing Database Schema Changes');
    }
    
    // Step 2: Validate Schema
    runCommand('prisma validate', 'Validating Database Schema');
    
    // Step 3: Build the application
    runCommand('next build', 'Building Next.js Application');
    
    // Step 4: Post-build verification (lightweight for Vercel)
    log('Running post-build verification...', 'blue');
    
    // Quick connection test
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      await prisma.$connect();
      log('✅ Database connection verified', 'green');
    } finally {
      await prisma.$disconnect();
    }
    
    // Step 5: Environment-specific tasks
    if (isProduction) {
      log('🎯 Production deployment detected', 'green');
      log('Database migrations applied safely', 'green');
    } else if (isPreview) {
      log('👁️  Preview deployment detected', 'yellow');
      log('Using preview database configuration', 'yellow');
    }
    
    log('🎉 Vercel build completed successfully!', 'green');
    
  } catch (error) {
    log('❌ Vercel build failed', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the build process
vercelBuild();