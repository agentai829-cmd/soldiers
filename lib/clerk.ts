import { currentUser } from '@clerk/nextjs/server'
import { db } from './db'

/**
 * Get current user from Clerk session
 */
export async function getCurrentUser() {
  try {
    // Get Clerk user data first
    const clerkUser = await currentUser()

    if (!clerkUser) {
      return null
    }

    const userId = clerkUser.id
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''

    // First check if user exists by clerkId
    let user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        members: true,
      },
    })

    if (user) {
      // Update existing user
      user = await db.user.update({
        where: { clerkId: userId },
        data: {
          email,
          name:
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            'User',
          imageUrl: clerkUser.imageUrl,
        },
        include: {
          members: true,
        },
      })
      return user
    }

    // Check if email already exists (from old account)
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      // Update old account with new clerkId
      user = await db.user.update({
        where: { email },
        data: {
          clerkId: userId,
          name:
            `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
            'User',
          imageUrl: clerkUser.imageUrl,
        },
        include: {
          members: true,
        },
      })
      return user
    }

    // Create new user
    user = await db.user.create({
      data: {
        clerkId: userId,
        email,
        name:
          `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
          'User',
        imageUrl: clerkUser.imageUrl,
      },
      include: {
        members: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    throw error
  }
}

/**
 * Get user's workspaces
 */
// export async function getUserWorkspaces() {
//   const user = await getCurrentUser()

//   if (!user) {
//     return []
//   }

//   // If user has no workspaces, create a default one
//   if (user.members.length === 0) {
//     try {
//       const defaultWorkspace = await db.workspace.create({
//         data: {
//           name: `${user.name}'s Workspace`,
//           slug: `${user.name?.toLowerCase().replace(/\s+/g, '-')}-workspace-${Date.now()}`,
//           description: 'Your personal workspace',
//           creatorId: user.id,
//           members: {
//             create: {
//               userId: user.id,
//               role: 'ADMIN',
//             },
//           },
//         },
//         include: {
//           members: true,
//         },
//       })

//       return [{ ...defaultWorkspace, role: 'ADMIN' }]
//     } catch (error) {
//       console.error('Error creating default workspace:', error)
//       return []
//     }
//   }

//   return user.members.map((member: any) => ({
//     ...member.workspace,
//     role: member.role,
//   }))
// }

/**
 * Check if user has access to workspace
 */
export async function hasWorkspaceAccess(
  workspaceId: string,
  requiredRole?: 'ADMIN' | 'EDITOR' | 'VIEWER'
) {
  const user = await getCurrentUser()

  if (!user) {
    return false
  }

  const member = user.members.find((m: any) => m.workspaceId === workspaceId)

  if (!member) {
    return false
  }

  if (!requiredRole) {
    return true
  }

  // Role hierarchy: ADMIN > EDITOR > VIEWER
  const roleHierarchy: { [key: string]: number } = {
    ADMIN: 3,
    EDITOR: 2,
    VIEWER: 1,
  }
  const userRoleLevel = roleHierarchy[member.role]
  const requiredRoleLevel = roleHierarchy[requiredRole]

  return userRoleLevel >= requiredRoleLevel
}

/**
 * Get workspace by ID with access check
 */
// export async function getWorkspaceWithAccess(workspaceId: string) {
//   const hasAccess = await hasWorkspaceAccess(workspaceId)

//   if (!hasAccess) {
//     return null
//   }

//   try {
//     const workspace = await db.workspace.findUnique({
//       where: { id: workspaceId },
//       include: {
//         members: {
//           include: {
//             user: true,
//           },
//         },
//         billingSubscription: true,
//       },
//     })

//     return workspace
//   } catch (error) {
//     console.error('Error getting workspace:', error)
//     return null
//   }
// }

/**
 * Create or update user from Clerk webhook
 */
export async function syncUserFromClerk(clerkUser: {
  id: string
  email_addresses: Array<{ email_address: string }>
  first_name?: string
  last_name?: string
  image_url?: string
}) {
  const email = clerkUser.email_addresses[0]?.email_address

  if (!email) {
    throw new Error('No email found for user')
  }

  const name =
    [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(' ') ||
    null

  try {
    const user = await db.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        name,
        imageUrl: clerkUser.image_url,
      },
      create: {
        clerkId: clerkUser.id,
        email,
        name,
        imageUrl: clerkUser.image_url,
      },
    })

    return user
  } catch (error) {
    console.error('Error syncing user from Clerk:', error)
    throw new Error('Failed to sync user')
  }
}

/**
 * Create a new workspace for the current user
 */
// export async function createWorkspace(data: {
//   name: string
//   slug: string
//   clerkId: string
//   description?: string
// }) {
//   const user = await getCurrentUser()

//   if (!user) {
//     throw new Error('User not authenticated')
//   }

//   try {
//     const workspace = await db.workspace.create({
//       data: {
//         name: data.name,
//         slug: data.slug,
//         description: data.description,
//         creatorId: user.id,
//         clerkId: data.clerkId,
//         members: {
//           create: {
//             userId: user.id,
//             role: 'ADMIN',
//           },
//         },
//       },
//       include: {
//         members: true,
//       },
//     })

//     console.log(
//       `✅ Created workspace '${workspace.name}' - helpers available from local config`
//     )

//     return workspace
//   } catch (error) {
//     console.error('Error creating workspace:', error)
//     throw new Error('Failed to create workspace')
//   }
// }
