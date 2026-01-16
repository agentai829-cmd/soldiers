'use client'

import dynamic from 'next/dynamic'
import {
  HelpCircle,
  Settings,
  Users,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'

// Lazy load heavy components for better performance
const UploadDialog = dynamic(
  () =>
    import('@/components/brain/upload-dialog').then((mod) => ({
      default: mod.UploadDialog,
    })),
  { ssr: false }
)
const KnowledgeDetailSidebar = dynamic(
  () =>
    import('@/components/brain/knowledge-detail-sidebar').then((mod) => ({
      default: mod.KnowledgeDetailSidebar,
    })),
  { ssr: false }
)
const QuestionModal = dynamic(
  () =>
    import('@/components/brain/question-modal').then((mod) => ({
      default: mod.QuestionModal,
    })),
  { ssr: false }
)

interface BrainPageProps {
  params: {
    userId: string
  }
}

export default function BrainPage({ params }: BrainPageProps) {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showQuestionModal, setShowQuestionModal] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [selectedColor, setSelectedColor] = useState('teal')
  const [tempColor, setTempColor] = useState('')
  const [tempName, setTempName] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  const colorOptions = [
    { name: 'purple', value: '#8B5CF6', selected: true },
    { name: 'yellow', value: '#F59E0B', selected: false },
    { name: 'pink', value: '#EC4899', selected: false },
    { name: 'teal', value: '#14B8A6', selected: false },
    { name: 'blue', value: '#3B82F6', selected: false },
  ]

  const allIntegrations = [
    // Current set (showing by default)
    {
      id: 'linkedin-personal',
      name: 'LinkedIn (Personal)',
      description: 'Create and share posts with your network.',
      icon: 'linkedin',
      connected: false,
      color: 'bg-blue-600',
    },
    {
      id: 'linkedin-organization',
      name: 'LinkedIn (Organization)',
      description: "Create and share posts on your organization's behalf.",
      icon: 'linkedin',
      connected: false,
      color: 'bg-blue-600',
    },
    {
      id: 'facebook-instagram',
      name: 'Facebook + Instagram',
      description: 'Manage Facebook and Instagram pages, accounts, and posts.',
      icon: 'facebook',
      connected: false,
      color: 'bg-blue-500',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Let helpers send emails and read your inbox.',
      icon: 'gmail',
      connected: false,
      color: 'bg-red-500',
    },
    // First set of integrations
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      description: 'Allow helpers to see and schedule events.',
      icon: 'google-calendar',
      connected: false,
      color: 'bg-blue-500',
    },
    {
      id: 'outlook',
      name: 'Outlook',
      description: 'Handle your Outlook emails.',
      icon: 'outlook',
      connected: false,
      color: 'bg-blue-600',
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'Create and read docs, sheets, and other files.',
      icon: 'google-drive',
      connected: false,
      color: 'bg-green-500',
    },
    {
      id: 'notion',
      name: 'Notion',
      description: 'Read and update your Notion data.',
      icon: 'notion',
      connected: false,
      color: 'bg-gray-800',
    },
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      description: 'Read and update your QuickBooks data.',
      icon: 'quickbooks',
      connected: false,
      color: 'bg-green-600',
    },
    {
      id: 'strava',
      name: 'Strava',
      description: 'Read your Strava activities and stats.',
      icon: 'strava',
      connected: false,
      color: 'bg-orange-500',
    },
    // Second set of integrations
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Access your Google Analytics data and insights.',
      icon: 'google-analytics',
      connected: false,
      color: 'bg-orange-500',
    },
    {
      id: 'xero',
      name: 'Xero',
      description: 'Read and update your Xero accounting data.',
      icon: 'xero',
      connected: false,
      color: 'bg-blue-500',
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Read and update your Salesforce data.',
      icon: 'salesforce',
      connected: false,
      color: 'bg-blue-500',
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Read and update your Trello data.',
      icon: 'trello',
      connected: false,
      color: 'bg-blue-600',
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'Read and update your HubSpot data.',
      icon: 'hubspot',
      connected: false,
      color: 'bg-orange-600',
    },
    {
      id: 'wordpress',
      name: 'WordPress.com',
      description: 'Read and update your WordPress.com data.',
      icon: 'wordpress',
      connected: false,
      color: 'bg-blue-600',
    },
    // Third set of integrations
    {
      id: 'google-tasks',
      name: 'Google Tasks',
      description: 'Read and update your Google Tasks data.',
      icon: 'google-tasks',
      connected: false,
      color: 'bg-blue-500',
    },
    {
      id: 'todoist',
      name: 'Todoist',
      description: 'Read and update your Todoist data.',
      icon: 'todoist',
      connected: false,
      color: 'bg-red-500',
    },
  ]

  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 4
  const totalPages = Math.ceil(allIntegrations.length / itemsPerPage)

  const getCurrentIntegrations = () => {
    const start = currentPage * itemsPerPage
    return allIntegrations.slice(start, start + itemsPerPage)
  }

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showDetailSidebar, setShowDetailSidebar] = useState(false)

  // Fetch knowledge items with optimized caching
  const fetchKnowledgeItems = async () => {
    try {
      const response = await fetch(`/api/user/${params.userId}/brain`)
      if (response.ok) {
        const data = await response.json()
        setKnowledgeItems(data.knowledge || [])
      }
    } catch (error) {
      console.error('Error fetching knowledge:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    if (mounted) fetchKnowledgeItems()
    return () => {
      mounted = false
    }
  }, [params.userId])

  const getKnowledgeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '💬'
      case 'url':
        return '🌐'
      case 'file':
        return '📄'
      case 'image':
        return '🖼️'
      default:
        return '📄'
    }
  }

  const extractDomain = (url: string) => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const getKnowledgeStats = () => {
    const stats = knowledgeItems.reduce(
      (acc, item) => {
        const sourceType = item.sourceType?.toLowerCase()
        const isImageDoc = item.metadata?.isImage === true

        if (isImageDoc) acc.media++
        else if (sourceType === 'manual' || item.type === 'text') acc.snippets++
        else if (sourceType === 'url' || item.type === 'url') acc.webpages++
        else if (sourceType === 'file' || item.type === 'file') acc.files++
        else if (item.type === 'image') acc.media++
        return acc
      },
      { snippets: 0, webpages: 0, files: 0, media: 0 }
    )

    return stats
  }

  const stats = getKnowledgeStats()

  const handleItemClick = (item: any) => {
    setSelectedItem(item)
    setShowDetailSidebar(true)
  }

  const handleCloseSidebar = () => {
    setShowDetailSidebar(false)
    setSelectedItem(null)
  }

  const handleDeleteKnowledge = (itemId: string) => {
    setKnowledgeItems((prevItems) =>
      prevItems.filter((item) => item.id !== itemId)
    )
  }

  const handleSaveSettings = () => {
    console.log('Saving color:', tempColor)
    setSelectedColor(tempColor)
    setWorkspaceName(tempName)
    setShowSettingsModal(false)
  }

  const handleOpenSettings = () => {
    setTempColor(selectedColor)
    setTempName(workspaceName)
    setShowSettingsModal(true)
  }

  // Fetch workspace data
  const fetchWorkspaceData = async () => {
    try {
      const response = await fetch(`/api/user/${params.userId}`)
      if (response.ok) {
        const data = await response.json()
        return data.workspace // API returns { workspace: {...} }
      }
    } catch (error) {
      console.error('Error fetching workspace:', error)
    }
    return null
  }

  // Load workspace data on mount - always use default teal color
  // useEffect(() => {
  //   const loadWorkspaceData = async () => {
  //     // Don't check localStorage - always use default teal color
  //     // This keeps the color consistent on every refresh

  //     // Get workspace name from API
  //     const workspace = await fetchWorkspaceData()

  //     if (workspace && workspace.name) {
  //       console.log('Loaded workspace:', workspace.name)
  //       setWorkspaceName(workspace.name)
  //       setTempName(workspace.name)
  //     } else {
  //       // Fallback to default name
  //       console.log('Using fallback name')
  //       setWorkspaceName('My Workspace')
  //       setTempName('My Workspace')
  //     }

  //     setIsLoaded(true)
  //   }

  //   loadWorkspaceData()
  // }, [params.workspaceId])

  // Check for manage parameter and auto-open settings modal
  useEffect(() => {
    const manageParam = searchParams.get('manage')
    if (manageParam === 'true' && isLoaded) {
      handleOpenSettings()
    }
  }, [searchParams, isLoaded])

  // Initialize temp values
  // useEffect(() => {
  //   if (isLoaded && workspaceName) {
  //     if (!tempColor) setTempColor(selectedColor)
  //     setTempName(workspaceName) // Always update tempName when workspaceName changes
  //   }
  // }, [selectedColor, workspaceName, isLoaded])

  return (
    <div className="chat-page-background min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-6 md:py-8">
        {/* Header */}
        <div className="mb-6 text-center md:mb-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            {/* <button 
              onClick={() => setShowHistorySidebar(true)}
              className="w-6 h-6 border-2 border-purple-600 rounded-full flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors cursor-pointer mr-2"
              title="Chat History"
              aria-label="Chat History"
            >
              <Clock className="h-3 w-3 text-purple-600 hover:text-white" />
            </button> */}
            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Brain AI
            </h1>
          </div>

          <div className="flex items-center justify-center gap-4 md:gap-6">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-sm text-white hover:text-gray-300 md:text-base"
              onClick={handleOpenSettings}
            >
              <Settings className="h-3 w-3 md:h-4 md:w-4" />
              Manage
            </Button>
          </div>
        </div>

        {/* Main Card */}
        <div
          className={`bg-gradient-to-br ${
            selectedColor === 'purple'
              ? 'from-purple-600 via-purple-700 to-purple-800'
              : selectedColor === 'yellow'
                ? 'from-yellow-500 via-yellow-600 to-yellow-700'
                : selectedColor === 'pink'
                  ? 'from-pink-500 via-pink-600 to-pink-700'
                  : selectedColor === 'teal'
                    ? 'from-teal-500 via-teal-600 to-teal-700'
                    : 'from-blue-500 via-blue-600 to-blue-700'
          } relative overflow-hidden rounded-2xl border-2 border-yellow-500 p-4 shadow-xl md:rounded-3xl md:p-6 lg:p-8`}
        >
          <div className="relative z-10">
            <h2 className="mb-6 truncate text-lg font-semibold text-white md:mb-8 md:text-xl lg:text-2xl">
              {workspaceName}
            </h2>

            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="grid w-full flex-1 grid-cols-2 gap-4 md:grid-cols-4 md:gap-8 lg:gap-12 xl:gap-20">
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                    {stats.snippets}
                  </div>
                  <div
                    className={`text-xs font-medium md:text-sm ${
                      selectedColor === 'purple'
                        ? 'text-purple-200'
                        : selectedColor === 'yellow'
                          ? 'text-yellow-200'
                          : selectedColor === 'pink'
                            ? 'text-pink-200'
                            : selectedColor === 'teal'
                              ? 'text-teal-200'
                              : 'text-blue-200'
                    }`}
                  >
                    Snippets
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                    {stats.webpages}
                  </div>
                  <div
                    className={`text-xs font-medium md:text-sm ${
                      selectedColor === 'purple'
                        ? 'text-purple-200'
                        : selectedColor === 'yellow'
                          ? 'text-yellow-200'
                          : selectedColor === 'pink'
                            ? 'text-pink-200'
                            : selectedColor === 'teal'
                              ? 'text-teal-200'
                              : 'text-blue-200'
                    }`}
                  >
                    Webpages
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                    {stats.files}
                  </div>
                  <div
                    className={`text-xs font-medium md:text-sm ${
                      selectedColor === 'purple'
                        ? 'text-purple-200'
                        : selectedColor === 'yellow'
                          ? 'text-yellow-200'
                          : selectedColor === 'pink'
                            ? 'text-pink-200'
                            : selectedColor === 'teal'
                              ? 'text-teal-200'
                              : 'text-blue-200'
                    }`}
                  >
                    Files
                  </div>
                </div>
                <div className="text-center">
                  <div className="mb-1 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                    {stats.media}
                  </div>
                  <div
                    className={`text-xs font-medium md:text-sm ${
                      selectedColor === 'purple'
                        ? 'text-purple-200'
                        : selectedColor === 'yellow'
                          ? 'text-yellow-200'
                          : selectedColor === 'pink'
                            ? 'text-pink-200'
                            : selectedColor === 'teal'
                              ? 'text-teal-200'
                              : 'text-blue-200'
                    }`}
                  >
                    Media
                  </div>
                </div>
              </div>

              {/* 3D Brain Image */}
              <div className="md:ml-4 lg:ml-8">
                <div className="relative mx-auto h-20 w-20 md:h-28 md:w-28 lg:h-32 lg:w-32 xl:h-36 xl:w-36">
                  <img
                    src="/icon/brainai.png"
                    alt="3D Brain"
                    className="h-full w-full object-contain opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Gradient overlay for depth */}
          <div
            className={`absolute inset-0 bg-gradient-to-br from-transparent via-transparent opacity-30 ${
              selectedColor === 'purple'
                ? 'to-purple-900'
                : selectedColor === 'yellow'
                  ? 'to-yellow-900'
                  : selectedColor === 'pink'
                    ? 'to-pink-900'
                    : selectedColor === 'teal'
                      ? 'to-teal-900'
                      : 'to-blue-900'
            }`}
          ></div>
        </div>

        {/* Integrations Section */}

        {/* All Knowledge Section */}
        <div className="relative mb-6 md:mb-8">
          <div className="mb-4 mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:mb-6">
            <h3 className="flex-shrink-0 text-lg font-bold text-white sm:text-xl md:text-2xl">
              All Knowledge
            </h3>
            <div className="flex items-center justify-start gap-2 sm:justify-end sm:gap-3">
              <UploadDialog onUploadComplete={fetchKnowledgeItems} />
            </div>
          </div>

          <div className="space-y-2 md:space-y-3">
            {isLoading ? (
              <div className="py-12 text-center md:py-16">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-600 md:h-10 md:w-10"></div>
                <p className="text-sm text-white md:mt-4 md:text-base">
                  Loading knowledge...
                </p>
              </div>
            ) : knowledgeItems.length === 0 ? (
              <div className="py-12 text-center md:py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 md:h-20 md:w-20">
                  <span className="text-2xl md:text-3xl">🧠</span>
                </div>
                <h4 className="mb-2 text-lg font-medium text-white md:text-xl">
                  No knowledge added yet
                </h4>
                <p className="mx-auto max-w-md text-sm text-gray-300 md:text-base">
                  Start building your AI brain by adding knowledge, files, or
                  URLs using the button above.
                </p>
              </div>
            ) : (
              knowledgeItems.map((item) => (
                <div
                  key={item.id}
                  className="cursor-pointer rounded-lg border-2 border-yellow-500 bg-white p-3 shadow-sm transition-shadow hover:shadow-md md:p-4"
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-start gap-3 md:items-center md:gap-4">
                    {/* Icon/Avatar */}
                    <div className="flex-shrink-0">
                      {(item.metadata as any)?.isQuestionAnswer === true ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 md:h-12 md:w-12">
                          <svg
                            className="h-5 w-5 text-white md:h-6 md:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                      ) : (item.metadata as any)?.isImage === true ? (
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100 md:h-12 md:w-12">
                          <img
                            src={
                              (item.metadata as any)?.imageUrl || item.sourceUrl
                            }
                            alt={item.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              const container = target.parentElement
                              if (container) {
                                container.innerHTML =
                                  '<div class="w-full h-full bg-purple-100 flex items-center justify-center"><svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                              }
                            }}
                          />
                        </div>
                      ) : item.sourceType?.toLowerCase() === 'url' &&
                        !(item.metadata as any)?.isImage ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 md:h-12 md:w-12">
                          <svg
                            className="h-5 w-5 text-blue-600 md:h-6 md:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                        </div>
                      ) : item.sourceType?.toLowerCase() === 'file' ? (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 md:h-12 md:w-12">
                          <svg
                            className="h-5 w-5 text-green-600 md:h-6 md:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 md:h-12 md:w-12">
                          <svg
                            className="h-5 w-5 text-purple-600 md:h-6 md:w-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M4 12h16M4 18h7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {(item.metadata as any)?.isQuestionAnswer === true ? (
                        // For Q&A items: Show question snippet
                        <>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 md:text-base">
                              {item.title}
                            </h4>
                            <span className="flex-shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                              Q&A
                            </span>
                          </div>
                          <p className="truncate text-xs text-gray-600 md:text-sm">
                            {(
                              (item.metadata as any)?.originalQuestion || ''
                            ).substring(0, 60)}
                            ...
                          </p>
                        </>
                      ) : (item.metadata as any)?.isImage === true ? (
                        // For Images: Show image title and description only
                        <>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 md:text-base">
                              {item.title}
                            </h4>
                            <span className="flex-shrink-0 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                              Image
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-gray-600 md:text-sm">
                            {item.content || 'AI-generated image description'}
                          </p>
                        </>
                      ) : item.sourceType?.toLowerCase() === 'url' &&
                        !(item.metadata as any)?.isImage ? (
                        // For Website Links: Show URL only, no other content
                        <>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-medium text-blue-600 md:text-base">
                              {item.sourceUrl}
                            </h4>
                            <span className="flex-shrink-0 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              Website
                            </span>
                          </div>
                        </>
                      ) : (
                        // For other types (files, manual)
                        <>
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h4 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 md:text-base">
                              {item.title}
                            </h4>
                            <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              Document
                            </span>
                          </div>
                          {item.description && (
                            <p className="mt-1 truncate text-xs text-gray-600 md:text-sm">
                              {item.description}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Action */}
                    {item.sourceUrl && (
                      <div className="mt-1 flex-shrink-0 self-start">
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block p-1 text-sm text-blue-500 hover:text-blue-700"
                          title="Visit original website"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Images Row - Show if images are available */}
                  {item.metadata?.processedImages &&
                    item.metadata.processedImages.length > 0 && (
                      <div className="ml-13 mt-3 md:ml-16">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {item.metadata.processedImages
                            .slice(0, 4)
                            .map((image: any, index: number) => (
                              <div
                                key={index}
                                className="group flex-shrink-0 cursor-pointer"
                              >
                                <div className="h-12 w-12 overflow-hidden rounded-lg bg-gray-100 md:h-16 md:w-16">
                                  <img
                                    src={image.src}
                                    alt={image.alt || `Image ${index + 1}`}
                                    className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement
                                      target.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMkg0NEwyNiA0NEwyMCAyMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                                    }}
                                  />
                                </div>
                                {image.aiDescription && (
                                  <div className="mt-1 w-12 md:w-16">
                                    <p
                                      className="truncate text-xs text-gray-600"
                                      title={image.aiDescription}
                                    >
                                      {image.aiDescription}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          {item.metadata.processedImages.length > 4 && (
                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 md:h-16 md:w-16">
                              <span className="text-xs font-medium text-gray-500">
                                +{item.metadata.processedImages.length - 4}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom spacing for floating button */}
        <div className="h-20 md:h-24"></div>
      </div>

      {/* Answer Questions Button */}
      <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 transform md:bottom-8">
        <Button
          onClick={() => setShowQuestionModal(true)}
          className="rounded-full border-2 border-yellow-500 bg-gradient-to-r from-yellow-600 to-yellow-500 px-4 py-2 text-sm text-white shadow-lg hover:from-yellow-500 hover:to-yellow-400 md:px-8 md:py-3 md:text-base"
        >
          <span className="hidden sm:inline">Answer Questions →</span>
          <span className="sm:hidden">Ask AI →</span>
        </Button>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative mx-4 w-full max-w-md rounded-xl bg-white p-4 md:rounded-2xl md:p-6">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 md:right-4 md:top-4"
              title="Close"
              aria-label="Close modal"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <h3 className="mb-3 pr-8 text-lg font-semibold text-gray-900 md:mb-4 md:text-xl">
              What is Brain AI?
            </h3>

            <p className="text-sm leading-relaxed text-gray-600 md:text-base">
              Brain AI serves as your knowledge base. It's a platform where you
              can input information about your brand, personal details, or
              projects, post website links, and even upload files. This enhances
              Brain AI's capabilities. This allows the Soldiers App to
              automatically process this information, resulting in personalized
              and more accurate results. It's your digital brain, with AI.
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white md:flex-row md:rounded-2xl">
            {/* Sidebar */}
            <div className="w-full rounded-t-xl border-b bg-gray-50 p-4 md:w-64 md:rounded-l-2xl md:rounded-tr-none md:border-b-0 md:border-r md:p-6">
              <div className="mb-6 flex items-center gap-3 md:mb-8">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg md:h-10 md:w-10 ${
                    selectedColor === 'purple'
                      ? 'bg-purple-600'
                      : selectedColor === 'yellow'
                        ? 'bg-yellow-600'
                        : selectedColor === 'pink'
                          ? 'bg-pink-600'
                          : selectedColor === 'teal'
                            ? 'bg-teal-600'
                            : 'bg-blue-600'
                  }`}
                >
                  <span className="text-xs font-semibold text-white md:text-sm">
                    {workspaceName ? workspaceName[0]?.toUpperCase() : 'W'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-500">Workspace</div>
                  <div className="truncate text-sm font-medium text-gray-900 md:text-base">
                    {workspaceName.length > (window.innerWidth < 768 ? 20 : 12)
                      ? `${workspaceName.substring(0, window.innerWidth < 768 ? 20 : 12)}...`
                      : workspaceName}
                  </div>
                </div>
              </div>

              <nav className="hidden space-y-2 md:block">
                <button
                  onClick={handleOpenSettings}
                  className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-sm transition-colors hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">
                    Settings
                  </span>
                </button>
                {/* <div className="flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-white hover:rounded-lg transition-colors">
                  <UserPlus className="h-4 w-4" />
                  <span>Invite People</span>
                </div> */}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute right-4 top-4 z-10 text-gray-400 transition-colors hover:text-gray-600 md:right-6 md:top-6"
                title="Close"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 md:h-5 md:w-5" />
              </button>

              <h2 className="mb-6 pr-8 text-xl font-bold text-gray-900 md:mb-8 md:text-2xl">
                Settings
              </h2>

              {/* Profile Image */}
              {/* <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">Profile Image</label>
                <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
              </div> */}

              {/* Name */}
              <div className="mb-6 md:mb-8">
                <label className="mb-2 block text-sm font-medium text-gray-700 md:mb-3">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-4"
                  placeholder="Enter workspace name"
                />
              </div>

              {/* Color */}
              <div className="mb-6 md:mb-8">
                <label className="mb-2 block text-sm font-medium text-gray-700 md:mb-3">
                  Color
                </label>
                <div className="flex gap-2 md:gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setTempColor(color.name)}
                      className={`h-8 w-8 rounded-full transition-all md:h-10 md:w-10 ${
                        tempColor === color.name
                          ? 'ring-2 ring-gray-400 ring-offset-2'
                          : 'hover:scale-105'
                      } ${
                        color.name === 'purple'
                          ? 'bg-purple-500'
                          : color.name === 'yellow'
                            ? 'bg-yellow-500'
                            : color.name === 'pink'
                              ? 'bg-pink-500'
                              : color.name === 'teal'
                                ? 'bg-teal-500'
                                : 'bg-blue-500'
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 md:py-3 md:text-base"
                  onClick={handleSaveSettings}
                >
                  Save
                </Button>
                {/* <Button 
                  variant="ghost" 
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 py-2"
                >
                  Delete Brain
                </Button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      {showHistorySidebar && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            onClick={() => setShowHistorySidebar(false)}
          />

          {/* History Sidebar */}
          <div className="fixed left-0 top-0 z-50 h-full w-80 overflow-auto bg-white shadow-2xl">
            {/* Header */}
            <div className="border-b border-gray-100 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  <div className="h-4 w-4 rounded-full border-2 border-purple-500"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">History</h3>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-6 p-4">
              {/* Last 7 days */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  Last 7 days
                </h4>
                <div className="space-y-3">
                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <span className="text-xs font-medium text-white">S</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        can you post on my social ...
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">4 day</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">hi</div>
                      <div className="mt-0.5 text-xs text-gray-500">4 day</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        Respond to a customer cha...
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">4 day</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                      <span className="text-xs font-medium text-white">V</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        Generate an image for my ...
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">4 day</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Last 30 days */}
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-700">
                  Last 30 days
                </h4>
                <div className="space-y-3">
                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        Create an incentive plan fo...
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        who is ahmed
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        what you do
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                      <span className="text-xs font-medium text-white">S</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        Find viral trends in my indu...
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        what you do
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>

                  <div className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <span className="text-xs font-medium text-white">B</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-gray-900">
                        what you do
                      </div>
                      <div className="mt-0.5 text-xs text-gray-500">1 week</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom padding */}
            <div className="h-20"></div>
          </div>
        </>
      )}

      {/* Knowledge Detail  Sidebar */}
      <KnowledgeDetailSidebar
        isOpen={showDetailSidebar}
        onClose={handleCloseSidebar}
        item={selectedItem}
        onDelete={handleDeleteKnowledge}
      />

      {/* Question Modal */}
      {/* <QuestionModal
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        workspaceId={params.workspaceId}
        onComplete={() => {
          fetchKnowledgeItems()
          // Could also navigate to chat or show success message
        }}
      /> */}
    </div>
  )
}
