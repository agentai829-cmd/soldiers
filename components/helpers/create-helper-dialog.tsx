'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CreateHelperDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  workspaceId: string
  children?: React.ReactNode
}

export function CreateHelperDialog({ open = false, onOpenChange, onSuccess, workspaceId, children }: CreateHelperDialogProps) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(open)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expertise: '',
    personality: 'professional'
  })

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Create the helper via API
      const response = await fetch(`/api/workspace/${workspaceId}/helpers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          prompt: `You are ${formData.name}, a ${formData.personality} AI assistant specializing in ${formData.expertise}. ${formData.description}`,
          config: {
            temperature: formData.personality === 'creative' ? 0.8 : formData.personality === 'analytical' ? 0.3 : 0.7,
            maxTokens: 1000,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create helper')
      }

      const helper = await response.json()
      console.log('Helper created:', helper)
      
      onSuccess?.()
      handleOpenChange(false)
      setFormData({
        name: '',
        description: '',
        expertise: '',
        personality: 'professional'
      })
    } catch (error) {
      console.error('Error creating helper:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Helper</DialogTitle>
          <DialogDescription>
            Create a new AI helper to assist with your tasks and workflows.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter helper name"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What does this helper do?"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="expertise">Expertise Areas</Label>
            <Input
              id="expertise"
              placeholder="e.g., Social Media, Email Management, Research"
              value={formData.expertise}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, expertise: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="personality">Personality</Label>
            <Select
              value={formData.personality}
              onValueChange={(value: string) => setFormData({ ...formData, personality: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
                <SelectItem value="analytical">Analytical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Helper'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}