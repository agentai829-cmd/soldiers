'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Briefcase, Sparkles, Zap, Users, Bot } from 'lucide-react'

export default function CreateWorkspacePage() {
  const { user } = useUser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Workspace name is required'
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Workspace name must be at least 3 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Workspace name must be less than 50 characters'
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user?.id) return

    setLoading(true)

    try {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: `${slug}-${Date.now()}`,
          clerkId: user.id,
          description: formData.description.trim() || undefined,
        }),
      })

      if (response.ok) {
        const workspace = await response.json()
        console.log('✅ Workspace created:', workspace)

        // Redirect to the new workspace
        router.push(`/workspace/${workspace.id}`)
      } else {
        const error = await response.json()
        console.error('❌ Failed to create workspace:', error)
        alert('Failed to create workspace. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error creating workspace:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-yellow-500/30 bg-gray-900/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/workspace')}
              className="text-gray-300 hover:text-yellow-500"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Workspaces
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="w-full max-w-lg">
          {/* Simple Hero */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600">
              <Briefcase className="h-8 w-8 text-black" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
              Create Workspace
            </h1>
            <p className="text-gray-300">
              Set up your new AI-powered workspace
            </p>
          </div>

          {/* Main Form */}
          <Card className="border-yellow-500/30 bg-gray-900/70 shadow-lg backdrop-blur-sm">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="text-lg font-semibold text-white">
                Workspace Details
              </CardTitle>
              <CardDescription className="text-gray-300">
                Give your workspace a name and description to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Workspace Name *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="My Awesome Workspace"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`h-11 border-gray-700 bg-gray-800 text-white transition-colors placeholder:text-gray-500 ${
                      errors.name
                        ? 'border-red-500 bg-red-950/50 focus:border-red-500 focus:ring-red-500'
                        : 'focus:border-yellow-500 focus:ring-yellow-500'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-300"
                  >
                    Description{' '}
                    <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="A workspace for managing my AI assistants"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`resize-none border-gray-700 bg-gray-800 text-white transition-colors placeholder:text-gray-500 ${
                      errors.description
                        ? 'border-red-500 bg-red-950/50 focus:border-red-500 focus:ring-red-500'
                        : 'focus:border-yellow-500 focus:ring-yellow-500'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-400">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/workspace')}
                    className="h-11 flex-1 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="h-11 flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black transition-all hover:from-yellow-600 hover:to-yellow-700"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Workspace'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Welcome Message */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Welcome {user?.firstName || 'there'}! 👋
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
