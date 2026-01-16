'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Users, CreditCard, Lock, Unlock } from 'lucide-react'

interface Subscription {
  id: string
  workspaceId: string
  workspaceName: string
  userName: string
  userEmail: string
  planType: string
  interval?: string
  unlockedSoldiers: string[]
  status: string
  currentPeriodEnd: string
  stripeSubscriptionId: string
}

export default function AdminDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [removingSoldier, setRemovingSoldier] = useState<string | null>(null)
  const [totalClerkUsers, setTotalClerkUsers] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch subscriptions with cache busting
      const timestamp = new Date().getTime()
      const subsResponse = await fetch(`/api/admin/subscriptions?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const subsData = await subsResponse.json()
      console.log('📊 Raw API Response:', subsData)
      console.log('📊 Subscriptions array:', subsData.subscriptions)
      console.log('📊 First subscription:', subsData.subscriptions?.[0])
      setSubscriptions(subsData.subscriptions || [])

      // Fetch total Clerk users
      const usersResponse = await fetch(`/api/admin/users?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const usersData = await usersResponse.json()
      setTotalClerkUsers(usersData.totalUsers || 0)
      
      console.log('📊 Total Clerk Users:', usersData.totalUsers)
      console.log('📊 Subscriptions:', subsData.subscriptions?.length)
      console.log('📊 Latest Data:', subsData.subscriptions)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/admin/subscriptions')
      const data = await response.json()
      setSubscriptions(data.subscriptions || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    }
  }

  const handleCancelSubscription = async (subscriptionId: string, workspaceId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? All soldiers will be locked.')) {
      return
    }

    setProcessingId(subscriptionId)
    try {
      const response = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, workspaceId })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Subscription cancelled successfully!')
        fetchData()
      } else {
        alert(data.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemoveSoldier = async (workspaceId: string, soldierName: string) => {
    if (!confirm(`Are you sure you want to remove ${soldierName}? The subscription will remain active.`)) {
      return
    }

    setRemovingSoldier(`${workspaceId}-${soldierName}`)
    try {
      const response = await fetch('/api/admin/remove-soldier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, soldierName })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`${soldierName} has been removed successfully!`)
        fetchData()
      } else {
        alert(data.error || 'Failed to remove soldier')
      }
    } catch (error) {
      console.error('Error removing soldier:', error)
      alert('Failed to remove soldier')
    } finally {
      setRemovingSoldier(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE').length
  const bundleSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' && s.unlockedSoldiers.length === 5).length
  const soldiersXSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' && s.unlockedSoldiers.length >= 10).length
  const singleSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE' && s.unlockedSoldiers.length > 0 && s.unlockedSoldiers.length < 5).length

  console.log('📊 Dashboard Stats:', { 
    total: subscriptions.length, 
    active: activeSubscriptions,
    bundle: bundleSubscriptions,
    soldiersX: soldiersXSubscriptions,
    single: singleSubscriptions,
    activeUsers: subscriptions.filter(s => s.status === 'ACTIVE')
  })

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Manage subscriptions and users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1">{totalClerkUsers}</p>
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mt-1">{activeSubscriptions}</p>
              </div>
              <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">With Soldiers X</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-purple-600 mt-1">{soldiersXSubscriptions}</p>
              </div>
              <Unlock className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-3 sm:p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Base Plans</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600 mt-1">{bundleSubscriptions + singleSubscriptions}</p>
              </div>
              <Lock className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">All Subscriptions</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 hidden md:table-header-group">
                <tr>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Type
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unlocked Soldiers
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="md:table-row flex flex-col md:flex-row border-b md:border-b-0">
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 md:whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">User</span>
                        <div className="text-sm font-medium text-gray-900">{sub.userName}</div>
                        <div className="text-xs sm:text-sm text-gray-500">{sub.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 md:whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="md:hidden text-xs font-medium text-gray-500 uppercase mb-1">Workspace</span>
                        <div className="text-sm text-gray-900">{sub.workspaceName}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4">
                      <span className="md:hidden text-xs font-medium text-gray-500 uppercase block mb-1">Plan Type</span>
                      {sub.planType ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              sub.unlockedSoldiers.length >= 10
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                : sub.unlockedSoldiers.length === 5 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {sub.unlockedSoldiers.length >= 10 
                                ? `All Soldiers (${sub.unlockedSoldiers.length})` 
                                : sub.unlockedSoldiers.length === 5 
                                ? 'Bundle (5 Soldiers)' 
                                : `${sub.unlockedSoldiers.length} Soldier(s)`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {sub.interval === 'year' ? 'Yearly' : 'Monthly'}
                            </span>
                            {sub.stripeSubscriptionId && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCancelSubscription(sub.stripeSubscriptionId, sub.workspaceId)
                                }}
                                disabled={processingId === sub.stripeSubscriptionId}
                                className="ml-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-0.5 transition-colors disabled:opacity-50"
                                title="Cancel Subscription"
                              >
                                {processingId === sub.stripeSubscriptionId ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <span className="text-sm font-bold">×</span>
                                )}
                              </button>
                            )}
                          </div>
                          {sub.unlockedSoldiers.length >= 10 && (
                            <div className="flex items-center gap-1">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
                                + Soldiers X
                              </span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  if (!confirm('Remove Soldiers X? This will keep base subscription but remove the 5 Soldiers X.')) {
                                    return
                                  }
                                  setRemovingSoldier(`${sub.workspaceId}-soldiersX`)
                                  try {
                                    // Remove Soldiers X (penn, soshie, seomi, milli, vizzy)
                                    const soldiersX = ['penn', 'soshie', 'seomi', 'milli', 'vizzy']
                                    const response = await fetch('/api/admin/remove-soldiers-bundle', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ workspaceId: sub.workspaceId, soldierNames: soldiersX })
                                    })
                                    const data = await response.json()
                                    if (data.success) {
                                      alert('Soldiers X removed successfully!')
                                      fetchData()
                                    } else {
                                      alert(data.error || 'Failed to remove Soldiers X')
                                    }
                                  } catch (error) {
                                    console.error('Error removing Soldiers X:', error)
                                    alert('Failed to remove Soldiers X')
                                  } finally {
                                    setRemovingSoldier(null)
                                  }
                                }}
                                disabled={removingSoldier === `${sub.workspaceId}-soldiersX`}
                                className="ml-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full p-0.5 transition-colors disabled:opacity-50"
                                title="Remove Soldiers X"
                              >
                                {removingSoldier === `${sub.workspaceId}-soldiersX` ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <span className="text-sm font-bold">×</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No Plan</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4">
                      <span className="md:hidden text-xs font-medium text-gray-500 uppercase block mb-1">Unlocked Soldiers</span>
                      {sub.unlockedSoldiers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {sub.unlockedSoldiers.map((soldier) => (
                            <div key={soldier} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                              <span>{soldier}</span>
                              {sub.status === 'ACTIVE' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveSoldier(sub.workspaceId, soldier)
                                  }}
                                  disabled={removingSoldier === `${sub.workspaceId}-${soldier}`}
                                  className="ml-1 text-blue-600 hover:text-red-600 hover:bg-red-100 rounded-full p-0.5 transition-colors disabled:opacity-50"
                                  title={`Remove ${soldier}`}
                                >
                                  {removingSoldier === `${sub.workspaceId}-${soldier}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <span className="text-xs font-bold">×</span>
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 md:whitespace-nowrap">
                      <span className="md:hidden text-xs font-medium text-gray-500 uppercase block mb-1">Status</span>
                      {sub.status ? (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          sub.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {sub.status}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 md:whitespace-nowrap text-sm text-gray-500">
                      <span className="md:hidden text-xs font-medium text-gray-500 uppercase block mb-1">Expires</span>
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 md:py-4 md:whitespace-nowrap text-sm font-medium">
                      <span className="md:hidden text-xs font-medium text-gray-500 uppercase block mb-1">Actions</span>
                      {sub.stripeSubscriptionId ? (
                        <Button
                          onClick={() => handleCancelSubscription(sub.stripeSubscriptionId, sub.workspaceId)}
                          disabled={processingId === sub.stripeSubscriptionId}
                          variant="destructive"
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          {processingId === sub.stripeSubscriptionId ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Cancelling...
                            </>
                          ) : (
                            'Cancel Subscription'
                          )}
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">No Action</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {subscriptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
