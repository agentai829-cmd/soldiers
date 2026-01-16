'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Upload, Link, FileText, Image, X } from 'lucide-react'
import { useParams } from 'next/navigation'

type UploadType = 'text' | 'file' | 'url'

interface UploadDialogProps {
  onUploadComplete?: () => void
}

export function UploadDialog({ onUploadComplete }: UploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [uploadType, setUploadType] = useState<UploadType>('text')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    file: null as File | null,
  })

  const params = useParams()
  const userId = params.userId as string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setIsUploading(true)
    setUploadProgress('Preparing upload...')

    try {
      const formDataToSend = new FormData()

      if (uploadType === 'text') {
        setUploadProgress('Saving text content...')
        formDataToSend.append('type', 'text')
        formDataToSend.append('title', formData.title)
        formDataToSend.append('content', formData.content)
      } else if (uploadType === 'url') {
        setUploadProgress('Scraping website content...')
        formDataToSend.append('type', 'url')
        formDataToSend.append('title', formData.title)
        formDataToSend.append('url', formData.url)
      } else if (uploadType === 'file' && formData.file) {
        setUploadProgress('Processing file...')
        formDataToSend.append('type', 'file')
        formDataToSend.append('title', formData.title || formData.file.name)
        formDataToSend.append('file', formData.file)
      }

      const response = await fetch(`/api/user/${userId}/brain/upload`, {
        method: 'POST',
        body: formDataToSend,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress('Upload completed successfully!')

      // Show success message for URL scraping
      if (uploadType === 'url' && result.scrapedData) {
        const { domain, wordCount } = result.scrapedData
        alert(`Successfully scraped ${wordCount} words from ${domain}!`)
      }

      // Reset form
      setFormData({ title: '', content: '', url: '', file: null })
      setUploadProgress('')
      setOpen(false)
      onUploadComplete?.()
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Upload failed. Please try again.'
      alert(errorMessage)
      setUploadProgress('')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, file }))
    }
  }

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, file: null }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border-2 border-yellow-500 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-400">
          <Plus className="mr-2 h-4 w-4" />
          Add Knowledge
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Knowledge to Brain</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Type Selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setUploadType('text')}
              className={`rounded-lg border-2 p-4 transition-all ${
                uploadType === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className="mx-auto mb-2 h-6 w-6" />
              <div className="text-sm font-medium">Text</div>
            </button>

            {/* <button
              type="button"
              onClick={() => setUploadType('file')}
              className={`p-4 rounded-lg border-2 transition-all ${
                uploadType === 'file'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className="h-6 w-6 mx-auto mb-2" />
              <div className="text-sm font-medium">File</div>
            </button> */}

            <button
              type="button"
              onClick={() => setUploadType('url')}
              className={`rounded-lg border-2 p-4 transition-all ${
                uploadType === 'url'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Link className="mx-auto mb-2 h-6 w-6" />
              <div className="text-sm font-medium">URL</div>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter a title for this knowledge"
                required={uploadType !== 'file'}
              />
            </div>

            {/* Content based on type */}
            {uploadType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Enter your knowledge content..."
                  rows={6}
                  required
                />
              </div>
            )}

            {uploadType === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                  placeholder="https://example.com/article"
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  The AI will read the entire webpage content and extract the
                  text for your knowledge base.
                </div>
              </div>
            )}

            {uploadType === 'file' && (
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                {formData.file ? (
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {formData.file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(formData.file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      title="Close button"
                      type="button"
                      onClick={removeFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".txt,.md,.pdf,.doc,.docx,.csv,.json"
                      required
                    />
                    <label
                      htmlFor="file"
                      className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        <Upload className="mb-4 h-8 w-8 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          TXT, MD, PDF, DOC, CSV, JSON (MAX. 10MB)
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {isUploading && uploadProgress && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-yellow-500"></div>
                  <span className="text-sm font-medium text-blue-700">
                    {uploadProgress}
                  </span>
                </div>
                {uploadType === 'url' && (
                  <div className="mt-1 text-xs text-blue-600">
                    This may take a few moments while we read the webpage...
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading
                  ? uploadType === 'url'
                    ? 'Scraping Website...'
                    : 'Uploading...'
                  : 'Add Knowledge'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
