'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Lock,
  CreditCard,
  Tag,
  HelpCircle,
  LogOut,
  ChevronDown,
  Save,
  User,
  Mail,
  Camera
} from 'lucide-react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Load user data when component mounts
  useEffect(() => {
    if (isLoaded && user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        jobTitle: user.publicMetadata?.jobTitle as string || ''
      })
    }
  }, [isLoaded, user])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    // Email validation removed since it's not editable
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    setIsSaved(false)
  }

  const handleSave = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      // Update user profile (name only)
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
      
      // Update job title in public metadata using the correct method
      if (user && formData.jobTitle !== (user.publicMetadata?.jobTitle as string || '')) {
        await user.update({
          publicMetadata: {
            ...user.publicMetadata,
            jobTitle: formData.jobTitle
          }
        } as any)
      }
      
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setErrors({ general: 'Failed to update profile. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/sign-in')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleChangePassword = () => {
    // Redirect to Clerk's password change page
    router.push('/user-profile#security')
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors({ image: 'Please select a valid image file' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: 'Image size should be less than 5MB' })
      return
    }

    setIsUploadingImage(true)
    setErrors({})

    try {
      // Create a FormData object
      const formData = new FormData()
      formData.append('file', file)

      // Update the user's profile image using Clerk
      await user?.setProfileImage({ file })
      
      // Reload to show new image
      await user?.reload()
      
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (error) {
      console.error('Error uploading image:', error)
      setErrors({ image: 'Failed to upload image. Please try again.' })
    } finally {
      setIsUploadingImage(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex-1 max-w-2xl mx-auto p-4 sm:p-6 md:p-8 pt-8 sm:pt-10 md:pt-12">
        <div className="animate-pulse">
          <div className="flex flex-col items-center mb-8 md:mb-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 chat-page-background">
      {/* Background overlay */}
      <div className="fixed inset-0 -z-10 bg-transparent"></div>
      
      <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8 pt-8 sm:pt-10 md:pt-12 relative">
      
      {/* Profile Section */}
      <div className="flex flex-col items-center mb-8 md:mb-12">
        <div className="relative mb-4">
          {isUploadingImage && (
            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center z-10">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {user?.imageUrl ? (
            <img 
              src={user.imageUrl} 
              alt="Profile" 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-300 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-lg sm:text-2xl font-bold">
                  {user?.firstName?.[0]?.toUpperCase() || user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            aria-label="Upload profile picture"
          />
          <button 
            className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-7 sm:h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            onClick={handleImageClick}
            disabled={isUploadingImage}
            title="Upload profile picture"
          >
            <Camera className="text-white w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>
        {errors.image && (
          <p className="text-red-500 text-xs mb-2">{errors.image}</p>
        )}
        <h1 className="text-xl sm:text-2xl font-semibold text-white mb-1 text-center">
          {user?.fullName || `${formData.firstName} ${formData.lastName}`.trim() || 'User'}
        </h1>
        <p className="text-white text-sm sm:text-base text-center break-all">
          {user?.primaryEmailAddress?.emailAddress || formData.email}
        </p>
      </div>

      <div className="space-y-8">
        {/* Personal Details */}
        <div className="border-2 border-yellow-500 rounded-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Personal details</h2>
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}
          <div className="space-y-4 sm:space-y-5">
            <div>
              <Label htmlFor="firstName" className="text-sm text-white mb-2 block">First Name *</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`bg-gray-50 border-0 text-gray-900 font-medium h-10 sm:h-12 rounded-lg transition-colors ${
                  errors.firstName ? 'ring-2 ring-red-500 bg-red-50' : 'focus:bg-white focus:ring-2 focus:ring-blue-500'
                }`}
                placeholder="Enter your first name"
              />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-white mb-2 block">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="bg-gray-50 border-0 h-10 sm:h-12 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter your last name"
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm text-white mb-2 block">Email</Label>
              <div className="relative">
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="bg-gray-100 border-0 text-gray-700 font-medium h-10 sm:h-12 rounded-lg pl-10 cursor-not-allowed"
                  placeholder="Email address"
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <p className="text-xs text-white mt-1">Email cannot be changed from here. Manage it in your account settings.</p>
            </div>
            {/* <div>
              <Label htmlFor="jobTitle" className="text-sm text-gray-600 mb-2 block">Job Title</Label>
              <Input 
                id="jobTitle" 
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="bg-gray-50 border-0 h-10 sm:h-12 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter your job title"
              />
            </div> */}
            
            {/* Save Button */}
            <div className="pt-2">
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className={`w-full sm:w-auto px-6 py-2 h-10 sm:h-11 rounded-lg font-medium transition-all border-2 ${
                  isSaved 
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-500' 
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white border-yellow-500'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : isSaved ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xs">✓</span>
                    </div>
                    <span>Saved</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Language */}
        {/* <div>
          <h2 className="text-lg font-semibold text-white mb-6">Language</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Helpers language</Label>
              <Select defaultValue="english">
                <SelectTrigger className="bg-gray-50 border-0 h-12 rounded-lg">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Language your helpers speak in chat</p>
            </div>
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Interface language</Label>
              <Select defaultValue="english">
                <SelectTrigger className="bg-gray-50 border-0 h-12 rounded-lg">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div> */}

        {/* Security */}
        {/* <div>
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Security</h2>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50 p-4 sm:p-5 rounded-lg gap-3 sm:gap-4">
            <div className="flex items-center">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 mr-3 flex-shrink-0" />
              <div>
                <span className="text-white font-medium text-sm sm:text-base block">Password</span>
                <span className="text-gray-500 text-xs sm:text-sm">Update your account password</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleChangePassword}
              className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-white border-2 border-yellow-500 h-9 sm:h-10 text-sm font-medium w-full sm:w-auto"
            >
              Change password
            </Button>
          </div>
        </div> */}

        {/* Billing Details */}
        {/* <div>
          <h2 className="text-lg font-semibold text-white mb-6">Billing details</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-white font-medium">Plan</div>
                  <div className="text-sm text-gray-500">Sintra X • Monthly</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="text-white font-medium">Manage billing</div>
                  <div className="text-sm text-gray-500">Manage payment method, billing address, and view invoices.</div>
                </div>
              </div>
            </div>
          </div>
        </div> */}

        {/* Other */}
        {/* <div>
          <h2 className="text-lg font-semibold text-white mb-6">Other</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-blue-600 rounded mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">💡</span>
                </div>
                <span className="text-white font-medium">Request a feature</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <HelpCircle className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-white font-medium">Help & Support</span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Sign Out */}
        <div className="pt-4 sm:pt-6 border-2 border-yellow-500 rounded-lg p-4 sm:p-6">
          <button 
            onClick={handleSignOut}
            className="flex items-center text-red-600 hover:text-red-700 transition-colors p-2 -m-2 rounded-lg hover:bg-red-50 w-full sm:w-auto justify-center sm:justify-start"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="font-medium text-sm sm:text-base">Sign out</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}