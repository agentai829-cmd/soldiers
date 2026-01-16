"use client"

import { Check, Settings, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface WorkspaceSelectorProps {
  open: boolean
  onClose: () => void
  workspaceId?: string
}

export function WorkspaceSelector({ open, onClose, workspaceId }: WorkspaceSelectorProps) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  // Fetch workspaces when component opens
  useEffect(() => {
    if (open) {
      fetchWorkspaces()
    }
  }, [open])

  const fetchWorkspaces = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const userWorkspaces = await response.json()
        setWorkspaces(userWorkspaces)
        
        // Find current workspace
        const current = userWorkspaces.find((ws: any) => ws.id === workspaceId)
        setCurrentWorkspace(current)
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWorkspace = async () => {
    setIsCreating(true)
    try {
      // Navigate to workspace creation page
      router.push('/workspace/create')
      onClose()
    } catch (error) {
      console.error('Error navigating to workspace creation:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleWorkspaceChange = (workspace: any) => {
    router.push(`/workspace/${workspace.id}`)
    onClose()
  }
  
  if (!open) return null

  return (
    <>
      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      
      {/* Workspace Selector */}
      <div className="workspace-selector fixed left-0 lg:left-20 top-0 w-full sm:w-96 max-w-sm lg:max-w-none lg:w-96 bg-black shadow-2xl z-[110] lg:z-60 rounded-none lg:rounded-br-lg border-0 lg:border border-white/20 h-full lg:h-auto overflow-auto lg:overflow-visible">
        <div className="p-4">
        {/* Header with close button for mobile */}
        <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-white">Workspaces</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors touch-manipulation"
            aria-label="Close workspace selector"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Current Workspace */}
            {currentWorkspace && (
              <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg transition-colors mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-lg">
                      {currentWorkspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{currentWorkspace.name}</span>
                    <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    router.push(`/workspace/${workspaceId}/brain?manage=true`)
                    onClose()
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg" 
                  title="Manage Brain"
                >
                  <Settings className="w-5 h-5 text-white" />
                </button>
              </div>
            )}

            {/* Other Workspaces */}
            {workspaces.filter(ws => ws.id !== workspaceId).length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">
                  Switch Workspace
                </div>
                {workspaces
                  .filter(ws => ws.id !== workspaceId)
                  .map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => handleWorkspaceChange(workspace)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {workspace.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-white">{workspace.name}</div>
                        {workspace.description && (
                          <div className="text-sm text-white">{workspace.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </>
        )}

        {/* Add Workspace Button */}
        <button 
          onClick={handleAddWorkspace}
          disabled={isCreating}
          className="w-full flex items-center space-x-3 p-3 hover:bg-white/10 rounded-lg transition-colors border-2 border-dashed border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            {isCreating ? (
              <div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <div className="text-left">
            <div className="font-medium text-white">
              {isCreating ? 'Creating...' : 'Add workspace'}
            </div>
          </div>
        </button>
        </div>
      </div>
    </>
  )
}

export default WorkspaceSelector