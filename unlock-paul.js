const { PrismaClient } = require('@prisma/client')
const db = new PrismaClient()

async function unlockPaul() {
  try {
    console.log('🔓 Unlocking Paul for all workspaces...\n')

    // Get all workspaces
    const workspaces = await db.workspace.findMany({
      include: {
        billingSubscription: true
      }
    })

    console.log(`Found ${workspaces.length} workspaces\n`)

    for (const workspace of workspaces) {
      if (!workspace.billingSubscription) {
        console.log(`Creating subscription for workspace: ${workspace.name}`)
        await db.billingSubscription.create({
          data: {
            workspaceId: workspace.id,
            planId: 'single',
            planType: 'single',
            unlockedSoldiers: ['Paul'],
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          }
        })
        console.log(`✅ Paul unlocked for ${workspace.name}\n`)
      } else {
        const currentSoldiers = workspace.billingSubscription.unlockedSoldiers || []
        
        if (!currentSoldiers.includes('Paul')) {
          const updatedSoldiers = [...currentSoldiers, 'Paul']
          
          await db.billingSubscription.update({
            where: { workspaceId: workspace.id },
            data: {
              unlockedSoldiers: updatedSoldiers
            }
          })
          
          console.log(`✅ Paul unlocked for ${workspace.name}`)
          console.log(`   Updated soldiers: ${updatedSoldiers.join(', ')}\n`)
        } else {
          console.log(`⚠️  Paul already unlocked for ${workspace.name}\n`)
        }
      }
    }

    console.log('🎉 Done! Paul is now unlocked for all workspaces.')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

unlockPaul()
