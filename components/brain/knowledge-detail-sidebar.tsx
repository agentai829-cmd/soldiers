'use client'

import {
  X,
  ExternalLink,
  Calendar,
  FileText,
  Globe,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Sheet, SheetHeader, SheetContent } from '@/components/ui/sheet'

interface KnowledgeDetailSidebarProps {
  isOpen: boolean
  onClose: () => void
  item: any
  onDelete?: (itemId: string) => void
}

export function KnowledgeDetailSidebar({
  isOpen,
  onClose,
  item,
  onDelete,
}: KnowledgeDetailSidebarProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const params = useParams()

  if (!isOpen || !item) return null

  const extractDomain = (url: string) => {
    try {
      const parsedUrl = new URL(url)
      return parsedUrl.hostname.replace('www.', '')
    } catch {
      return url
    }
  }

  const handleDelete = async () => {
    if (!item.id) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this knowledge item? This action cannot be undone.'
    )
    if (!confirmed) return

    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/workspace/${params.workspaceId}/brain?id=${item.id}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        toast.success('Knowledge item deleted successfully')
        onDelete?.(item.id)
        onClose()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to delete knowledge item')
      }
    } catch (error) {
      console.error('Error deleting knowledge item:', error)
      toast.error('Failed to delete knowledge item')
    } finally {
      setIsDeleting(false)
    }
  }

  const getKnowledgeIcon = (type: string) => {
    switch (type) {
      case 'text':
      case 'manual':
        return <FileText className="h-5 w-5" />
      case 'url':
        return <Globe className="h-5 w-5" />
      case 'file':
        return <FileText className="h-5 w-5" />
      case 'image':
        return <ImageIcon className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <>
      <Sheet
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SheetContent className="overflow-y-scroll">
          <SheetHeader>
            {/* Header */}
            <div className=" p-4 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 md:text-lg">
                  Knowledge Details
                </h3>
                {/* <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2"
                >
                  <X className="h-4 w-4" />
                </Button> */}
              </div>
            </div>
          </SheetHeader>
          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Main Image - Show the actual image for image documents */}
            {item.metadata?.isImage === true ? (
              <div className="mb-4 md:mb-6">
                <img
                  src={item.metadata.imageUrl || item.sourceUrl}
                  alt={item.title}
                  className="h-40 w-full rounded-lg object-cover md:h-48"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            ) : (
              item.image && (
                <div className="mb-4 md:mb-6">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-40 w-full rounded-lg object-cover md:h-48"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
              )
            )}

            {/* Header Info */}
            <div className="mb-4 md:mb-6">
              {/* Source Info */}
              {item.sourceUrl && (
                <div className="mb-2 flex flex-wrap items-center gap-2 md:mb-3">
                  {item.metadata?.isImage === true ? (
                    // For image documents, show source website info
                    <>
                      <ImageIcon className="h-3 w-3 flex-shrink-0 text-purple-600 md:h-4 md:w-4" />
                      <span className="text-xs font-medium text-purple-600 md:text-sm">
                        Image
                      </span>
                      {/* {item.metadata?.fromWebsite && (
                      <>
                        <span className="text-sm text-gray-400">from</span>
                        <span className="text-sm text-blue-600 font-medium">
                          {item.metadata.websiteTitle || extractDomain(item.metadata.fromWebsite)}
                        </span>
                      </>
                    )} */}
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto p-1 text-blue-500 hover:text-blue-700"
                        title="View original image"
                      >
                        <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                      </a>
                    </>
                  ) : (
                    // For website documents
                    <>
                      {item.favicon && (
                        <img
                          src={item.favicon}
                          alt="Site favicon"
                          className="h-3 w-3 flex-shrink-0 md:h-4 md:w-4"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <span className="truncate text-xs font-medium text-blue-600 md:text-sm">
                        {item.domain || extractDomain(item.sourceUrl)}
                      </span>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto flex-shrink-0 p-1 text-blue-500 hover:text-blue-700"
                        title="Visit original website"
                      >
                        <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                      </a>
                    </>
                  )}
                </div>
              )}

              {/* Title */}
              <h1 className="mb-2 text-lg font-bold leading-tight text-gray-900 md:mb-3 md:text-xl">
                {item.title}
              </h1>

              {/* Type Badge */}
              <div className="mb-3 flex items-center gap-2 md:mb-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800 md:gap-1.5 md:px-3 md:py-1.5 md:text-sm">
                  {item.metadata?.isImage === true ? (
                    <>
                      <ImageIcon className="h-3 w-3 md:h-4 md:w-4" />
                      Image
                    </>
                  ) : (
                    <>
                      {getKnowledgeIcon(
                        item.sourceType?.toLowerCase() || item.type
                      )}
                      <span className="hidden sm:inline">
                        {item.sourceType?.toLowerCase() === 'url'
                          ? 'Website'
                          : item.sourceType?.toLowerCase() || item.type}
                      </span>
                    </>
                  )}
                </span>
                {/* {item.metadata?.isImage === true && item.metadata?.width && item.metadata?.height && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {item.metadata.width}×{item.metadata.height}
                </span>
              )} */}
                {/* <span className="text-sm text-gray-500">
                Added {new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span> */}
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div className="mb-4 md:mb-6">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-base">
                  Description
                </h4>
                <p className="text-sm leading-relaxed text-gray-700 md:text-base">
                  {item.description}
                </p>
              </div>
            )}

            {/* AI Description (if available) */}
            {item.metadata?.aiDescription && (
              <div className="mb-4 md:mb-6">
                <h4 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-base">
                  AI Summary
                </h4>
                <div className="rounded-lg bg-blue-50 p-3 md:p-4">
                  <p className="text-sm leading-relaxed text-blue-900 md:text-base">
                    {item.metadata.aiDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Images Gallery (if available) */}
            {item.metadata?.processedImages &&
              item.metadata.processedImages.length > 0 && (
                <div className="mb-4 md:mb-6">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-base">
                    Images ({item.metadata.processedImages.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3">
                    {item.metadata.processedImages.map(
                      (image: any, index: number) => (
                        <div
                          key={index}
                          className="rounded-lg bg-gray-50 p-2 md:p-3"
                        >
                          <div className="mb-2 aspect-video overflow-hidden rounded-lg bg-gray-200">
                            <img
                              src={image.src}
                              alt={image.alt || `Image ${index + 1}`}
                              className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.src =
                                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMCAzMEg3MEw1MCA3MEwzMCAzMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHN2Zz4K'
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            {image.alt && (
                              <p className="line-clamp-1 text-xs font-medium text-gray-700">
                                {image.alt}
                              </p>
                            )}
                            {image.aiDescription && (
                              <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                                {image.aiDescription}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* Content Preview */}
            <div className="mb-4 md:mb-6">
              <h4 className="mb-2 text-sm font-semibold text-gray-900 md:mb-3 md:text-base">
                Content
              </h4>
              <div className="max-h-48 overflow-y-auto rounded-lg bg-gray-50 p-3 md:max-h-64 md:p-4">
                {item.metadata?.isImage === true ? (
                  // For scraped images
                  item.content && item.content.trim() !== '' ? (
                    <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700 md:text-sm">
                      {item.content.length > 400
                        ? `${item.content.substring(0, 400)}...`
                        : item.content}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-yellow-500 md:h-4 md:w-4"></div>
                      <span className="text-xs md:text-sm">
                        Generating AI description...
                      </span>
                    </div>
                  )
                ) : // For other content types
                item.content ? (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700 md:text-sm">
                    {item.content.length > 400
                      ? `${item.content.substring(0, 400)}...`
                      : item.content}
                  </p>
                ) : (
                  <p className="text-xs italic text-gray-500 md:text-sm">
                    No content available
                  </p>
                )}
              </div>
            </div>

            {/* Statistics */}
            {/* <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              {item.content && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {item.content.split(/\s+/).length}
                  </div>
                  <div className="text-sm text-gray-600">Words</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-lg font-bold text-gray-900">
                  {item.content?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Characters</div>
              </div>
              {item.metadata?.processedImages && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-lg font-bold text-gray-900">
                    {item.metadata.processedImages.length}
                  </div>
                  <div className="text-sm text-gray-600">Images</div>
                </div>
              )}
            </div>
          </div> */}

            {/* Metadata (if available)
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Metadata</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )} */}

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-200 pt-3 md:pt-4">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 py-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 md:py-2 md:text-sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center gap-1 md:gap-2">
                    <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-yellow-500 md:h-4 md:w-4"></div>
                    <span className="hidden sm:inline">Deleting...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 md:gap-2">
                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                    <span>Delete</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
