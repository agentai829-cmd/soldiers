#!/usr/bin/env node

/**
 * Database Migration and Schema Management Helper
 * 
 * This script provides advanced database operations including:
 * - Migration generation and deployment
 * - Schema comparison and validation
 * - Data migration helpers
 * - Environment-aware database operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}🗄️  [DB Manager] ${message}${colors.reset}`);
}

function runCommand(command, description, silent = false) {
  try {
    if (!silent) log(`${description}...`, 'blue');
    const output = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    if (!silent) log(`✅ ${description} completed`, 'green');
    return output;
  } catch (error) {
    if (!silent) log(`❌ ${description} failed`, 'red');
    throw error;
  }
}

class DatabaseManager {
  constructor() {
    this.env = process.env.NODE_ENV || 'development';
    this.isProduction = this.env === 'production';
    this.schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  }

  async generateClient() {
    log('Generating Prisma Client...', 'cyan');
    runCommand('prisma generate', 'Client Generation');
  }

  async validateSchema() {
    log('Validating Schema...', 'cyan');
    runCommand('prisma validate', 'Schema Validation');
  }

  async createMigration(name) {
    if (!name) {
      throw new Error('Migration name is required');
    }
    
    log(`Creating migration: ${name}`, 'cyan');
    runCommand(
      `prisma migrate dev --name "${name}" --create-only`,
      'Migration Creation'
    );
  }

  async applyMigrations() {
    log('Applying Migrations...', 'cyan');
    
    if (this.isProduction) {
      runCommand('prisma migrate deploy', 'Production Migration Deployment');
    } else {
      runCommand('prisma migrate dev', 'Development Migration Application');
    }
  }

  async pushSchema() {
    log('Pushing Schema Changes...', 'cyan');
    
    const command = this.isProduction 
      ? 'prisma db push'
      : 'prisma db push --accept-data-loss';
      
    runCommand(command, 'Schema Push');
  }

  async resetDatabase() {
    if (this.isProduction) {
      throw new Error('Database reset is not allowed in production');
    }
    
    log('⚠️  Resetting Database (Development Only)', 'yellow');
    runCommand('prisma migrate reset --force', 'Database Reset');
  }

  async checkMigrationStatus() {
    log('Checking Migration Status...', 'cyan');
    
    try {
      const output = runCommand('prisma migrate status', 'Migration Status Check', true);
      console.log(output);
      return output;
    } catch (error) {
      log('Migration status check failed - this might be normal for new databases', 'yellow');
      return null;
    }
  }

  async seedDatabase() {
    const seedFile = path.join(process.cwd(), 'prisma', 'seed.ts');
    
    if (fs.existsSync(seedFile)) {
      log('Seeding Database...', 'cyan');
      runCommand('npm run db:seed', 'Database Seeding');
    } else {
      log('No seed file found, skipping seeding', 'yellow');
    }
  }

  async fullDeployment() {
    log('🚀 Starting Full Database Deployment', 'cyan');
    
    try {
      await this.generateClient();
      await this.validateSchema();
      
      // Check if we need migrations
      const migrationStatus = await this.checkMigrationStatus();
      
      if (this.isProduction) {
        // Production: Use migrations
        await this.applyMigrations();
      } else {
        // Development: Push schema directly
        await this.pushSchema();
      }
      
      // Seed if in development
      if (!this.isProduction) {
        await this.seedDatabase();
      }
      
      log('🎉 Database deployment completed successfully!', 'green');
      
    } catch (error) {
      log('❌ Database deployment failed', 'red');
      console.error(error);
      throw error;
    }
  }

  async introspect() {
    log('Introspecting Database...', 'cyan');
    runCommand('prisma db pull', 'Database Introspection');
  }

  async studioOpen() {
    log('Opening Prisma Studio...', 'cyan');
    runCommand('prisma studio', 'Prisma Studio Launch');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const dbManager = new DatabaseManager();

  try {
    switch (command) {
      case 'generate':
        await dbManager.generateClient();
        break;
        
      case 'validate':
        await dbManager.validateSchema();
        break;
        
      case 'migrate':
        const migrationName = args[1];
        if (args.includes('--create')) {
          await dbManager.createMigration(migrationName);
        } else {
          await dbManager.applyMigrations();
        }
        break;
        
      case 'push':
        await dbManager.pushSchema();
        break;
        
      case 'reset':
        await dbManager.resetDatabase();
        break;
        
      case 'status':
        await dbManager.checkMigrationStatus();
        break;
        
      case 'seed':
        await dbManager.seedDatabase();
        break;
        
      case 'deploy':
        await dbManager.fullDeployment();
        break;
        
      case 'introspect':
        await dbManager.introspect();
        break;
        
      case 'studio':
        await dbManager.studioOpen();
        break;
        
      default:
        log('Available commands:', 'cyan');
        console.log('  generate    - Generate Prisma Client');
        console.log('  validate    - Validate schema');
        console.log('  migrate     - Apply migrations');
        console.log('  migrate --create <name> - Create new migration');
        console.log('  push        - Push schema changes');
        console.log('  reset       - Reset database (dev only)');
        console.log('  status      - Check migration status');
        console.log('  seed        - Seed database');
        console.log('  deploy      - Full deployment process');
        console.log('  introspect  - Introspect existing database');
        console.log('  studio      - Open Prisma Studio');
        break;
    }
  } catch (error) {
    log(`Command failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DatabaseManager };