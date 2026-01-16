// Manually unlock Soldiers X for current workspace
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function unlockSoldiersX() {
  try {
    console.log('🎖️ Unlocking Soldiers X...\n')
    
    // Get the workspace with ID cmhzel1tv0002s8nr095fb8jq
    const workspaceId = 'cmhzel1tv0002s8nr095fb8jq'
    
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        creator: true,
        billingSubscription: true
      }
    })
    
    if (!workspace) {
      console.error('❌ Workspace not found!')
      return
    }
    
    console.log('Workspace:', workspace.name)
    console.log('User:', workspace.creator?.name)
    console.log('Email:', workspace.creator?.email)
    
    if (!workspace.billingSubscription) {
      console.log('\n❌ No subscription found!')
      return
    }
    
    const currentSoldiers = workspace.billingSubscription.unlockedSoldiers
    const soldiersXSoldiers = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
    
    console.log('\n📋 Current unlocked soldiers:', currentSoldiers.join(', '))
    console.log('🎖️ Adding Soldiers X:', soldiersXSoldiers.join(', '))
    
    // Combine existing + new soldiers
    const allSoldiers = Array.from(new Set([...currentSoldiers, ...soldiersXSoldiers]))
    
    console.log('✨ Total after unlock:', allSoldiers.join(', '))
    
    // Update subscription
    const updated = await prisma.billingSubscription.update({
      where: { workspaceId: workspace.id },
      data: {
        unlockedSoldiers: allSoldiers
      }
    })
    
    console.log('\n✅ Soldiers X unlocked successfully!')
    console.log('📊 Total unlocked soldiers:', updated.unlockedSoldiers.length)
    console.log('🎉 All soldiers:', updated.unlockedSoldiers.join(', '))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

unlockSoldiersX()
