'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  Brain, 
  Globe,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface Agent {
  id: string
  name: string
  description: string
  isTrained: boolean
  promptId: string | null
  promptVersion: string | null
  maxTokens?: number
  temperature?: number
  includeWebSearch?: boolean
}

interface AgentManagerProps {
  workspaceId: string
}

export function AgentManager({ workspaceId }: AgentManagerProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [promptId, setPromptId] = useState('')
  const [promptVersion, setPromptVersion] = useState('1')

  // Fetch agent status
  useEffect(() => {
    fetchAgentStatus()
  }, [workspaceId])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/agents`)
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
      } else {
        toast.error('Failed to fetch agent status')
      }
    } catch (error) {
      console.error('Error fetching agent status:', error)
      toast.error('Error loading agents')
    } finally {
      setLoading(false)
    }
  }

  const migrateAgent = async () => {
    if (!selectedAgent || !promptId.trim()) {
      toast.error('Please provide a valid prompt ID')
      return
    }

    setMigrating(selectedAgent.id)
    
    try {
      const response = await fetch(`/api/workspace/${workspaceId}/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          promptId: promptId.trim(),
          promptVersion: promptVersion.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${selectedAgent.name} migrated to trained system`)
        
        // Refresh agent status
        await fetchAgentStatus()
        
        // Reset form
        setSelectedAgent(null)
        setPromptId('')
        setPromptVersion('1')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to migrate agent')
      }
    } catch (error) {
      console.error('Error migrating agent:', error)
      toast.error('Error migrating agent')
    } finally {
      setMigrating(null)
    }
  }

  const trainedCount = agents.filter(a => a.isTrained).length
  const totalCount = agents.length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
        <span className="ml-2">Loading agents...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agent Management</h2>
          <p className="text-gray-600">
            Manage your OpenAI trained agents and migration status
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600 border-green-200">
            {trainedCount}/{totalCount} Trained
          </Badge>
          <Button onClick={fetchAgentStatus} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Trained Agents</p>
              <p className="text-2xl font-bold text-gray-900">{trainedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Legacy Agents</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount - trainedCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agent List */}
      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {agent.isTrained ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-1">
                  <Badge 
                    variant={agent.isTrained ? "default" : "secondary"}
                    className={agent.isTrained ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                  >
                    {agent.isTrained ? 'Trained' : 'Legacy'}
                  </Badge>
                  
                  {agent.isTrained && (
                    <div className="flex gap-1 text-xs text-gray-500">
                      {agent.includeWebSearch && (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="w-3 h-3 mr-1" />
                          Web Search
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {agent.maxTokens} tokens
                      </Badge>
                    </div>
                  )}
                </div>
                
                {!agent.isTrained && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Configure
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Migrate {agent.name} to Trained System</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="promptId">Prompt ID</Label>
                          <Input
                            id="promptId"
                            value={promptId}
                            onChange={(e) => setPromptId(e.target.value)}
                            placeholder="pmpt_..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter the OpenAI trained prompt ID for this agent
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="promptVersion">Prompt Version</Label>
                          <Input
                            id="promptVersion"
                            value={promptVersion}
                            onChange={(e) => setPromptVersion(e.target.value)}
                            placeholder="1"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setSelectedAgent(null)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={migrateAgent}
                            disabled={migrating === agent.id || !promptId.trim()}
                          >
                            {migrating === agent.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Migrating...
                              </div>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-1" />
                                Migrate
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                
                {agent.isTrained && agent.promptId && (
                  <div className="text-right text-xs text-gray-500">
                    <div>ID: {agent.promptId.substring(0, 12)}...</div>
                    <div>v{agent.promptVersion}</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}