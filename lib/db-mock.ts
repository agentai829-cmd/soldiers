// Mock database for demo mode when no real database is available
class MockDb {
  private data = {
    users: new Map(),
    workspaces: new Map(),
    helpers: new Map(),
    members: new Map(),
  }

  user = {
    findUnique: async ({ where, include }: any) => {
      const user = this.data.users.get(where.clerkId)
      if (!user) return null
      
      if (include?.members) {
        const membersList = Array.from(this.data.members.values())
          .filter((m: any) => m.userId === user.id)
          .map((m: any) => ({
            ...m,
            workspace: this.data.workspaces.get(m.workspaceId)
          }))
        return { ...user, members: membersList }
      }
      
      return user
    },

    upsert: async ({ where, create, update, include }: any) => {
      let user = this.data.users.get(where.clerkId)
      if (user) {
        Object.assign(user, update)
      } else {
        user = { id: Date.now().toString(), ...create }
        this.data.users.set(where.clerkId, user)
      }

      if (include?.members) {
        const membersList = Array.from(this.data.members.values())
          .filter((m: any) => m.userId === user.id)
          .map((m: any) => ({
            ...m,
            workspace: this.data.workspaces.get(m.workspaceId)
          }))
        return { ...user, members: membersList }
      }

      return user
    }
  }

  workspace = {
    findUnique: async ({ where, include }: any) => {
      const workspace = this.data.workspaces.get(where.id)
      if (!workspace) return null

      let result = { ...workspace }
      
      if (include?.members) {
        const membersList = Array.from(this.data.members.values())
          .filter((m: any) => m.workspaceId === workspace.id)
          .map((m: any) => ({
            ...m,
            user: Array.from(this.data.users.values()).find((u: any) => u.id === m.userId)
          }))
        result.members = membersList
      }

      if (include?.billingSubscription) {
        result.billingSubscription = null
      }

      return result
    },

    upsert: async ({ where, create, update, include }: any) => {
      let workspace = this.data.workspaces.get(where.id)
      if (workspace) {
        Object.assign(workspace, update)
      } else {
        workspace = { id: where.id, ...create }
        this.data.workspaces.set(where.id, workspace)

        // Create member relationship if specified
        if (create.members?.create) {
          const member = {
            id: Date.now().toString(),
            userId: create.members.create.userId,
            workspaceId: workspace.id,
            role: create.members.create.role,
          }
          this.data.members.set(member.id, member)
        }
      }

      let result = { ...workspace }
      
      if (include?.members) {
        const membersList = Array.from(this.data.members.values())
          .filter((m: any) => m.workspaceId === workspace.id)
          .map((m: any) => ({
            ...m,
            user: Array.from(this.data.users.values()).find((u: any) => u.id === m.userId)
          }))
        result.members = membersList
      }

      if (include?.billingSubscription) {
        result.billingSubscription = null
      }

      return result
    },

    create: async ({ data, include }: any) => {
      const workspace = { id: Date.now().toString(), ...data }
      this.data.workspaces.set(workspace.id, workspace)

      // Create member relationship if specified  
      if (data.members?.create) {
        const member = {
          id: Date.now().toString(),
          userId: data.members.create.userId,
          workspaceId: workspace.id,
          role: data.members.create.role,
        }
        this.data.members.set(member.id, member)
      }

      let result = { ...workspace }
      
      if (include?.members) {
        const membersList = Array.from(this.data.members.values())
          .filter((m: any) => m.workspaceId === workspace.id)
        result.members = membersList
      }

      return result
    }
  }

  helper = {
    findMany: async ({ where, orderBy }: any) => {
      return Array.from(this.data.helpers.values())
        .filter((h: any) => {
          if (where?.workspaceId && h.workspaceId !== where.workspaceId) return false
          if (where?.isActive !== undefined && h.isActive !== where.isActive) return false
          return true
        })
        .sort((a: any, b: any) => {
          if (orderBy?.createdAt === 'asc') {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          }
          return 0
        })
    }
  }
}

const hasValidDbConnection = process.env.DATABASE_URL && 
                            !process.env.DATABASE_URL.includes('localhost:5432') || 
                            process.env.NODE_ENV === 'production'

// Use mock database for demo mode
export const mockDb = new MockDb()

// Export appropriate database based on environment
export let db: any

try {
  if (!hasValidDbConnection) {
    // Use mock database for development without real database
    db = mockDb
    console.log('🔄 Using mock database for demo mode')
  } else {
    // Use real Prisma database
    const { PrismaClient } = require('@prisma/client')
    const globalForPrisma = globalThis as unknown as {
      prisma: any
    }
    db = globalForPrisma.prisma ?? new PrismaClient()
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
    console.log('🔄 Using Prisma database')
  }
} catch (error) {
  console.log('⚠️  Database connection failed, using mock database')
  db = mockDb
}