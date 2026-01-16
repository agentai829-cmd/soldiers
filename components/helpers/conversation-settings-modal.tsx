'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, ChevronDown } from 'lucide-react'

interface ConversationSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  helperName: string
}

interface VibeOption {
  id: string
  name: string
  emoji: string
  position: number // 0-4 for slider position
}

const vibeOptions: VibeOption[] = [
  { id: 'strictly-professional', name: 'Strictly Professional', emoji: '🎯', position: 0 },
  { id: 'official', name: 'Keep it Official', emoji: '📊', position: 1 },
  { id: 'business-casual', name: 'Business Casual', emoji: '💼', position: 2 },
  { id: 'friendly', name: 'Friendly and Relaxed', emoji: '😊', position: 3 },
  { id: 'super-chill', name: 'Super Chill', emoji: '🤙', position: 4 }
]

export function ConversationSettingsModal({ 
  open, 
  onOpenChange, 
  helperName 
}: ConversationSettingsModalProps) {
  const [selectedVibe, setSelectedVibe] = useState('strictly-professional')
  const [messageLength, setMessageLength] = useState('Short')
  const [language, setLanguage] = useState('Casual')
  const [searchGoogle, setSearchGoogle] = useState(true)
  const [writingStyle, setWritingStyle] = useState(true)
  const [customInstructionsOpen, setCustomInstructionsOpen] = useState(false)

  const currentVibe = vibeOptions.find(v => v.id === selectedVibe) || vibeOptions[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 [&>button]:hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-lg font-semibold">{helperName}</DialogTitle>
              <p className="text-sm text-gray-500">Conversation Settings</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-6 space-y-8">
          {/* Vibe Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vibe</h3>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-gray-900">{currentVibe.name}</span>
                <span className="text-lg">{currentVibe.emoji}</span>
              </div>
            </div>
            
            {/* Vibe Slider */}
            <div className="relative px-2">
              <div className="w-full h-12 bg-gradient-to-r from-sky-300 via-sky-400 to-sky-500 rounded-full relative overflow-hidden shadow-md">
                {/* Small dots on the slider - 5 positions */}
                <div className="absolute top-1/2 left-[10%] w-2.5 h-2.5 bg-white/80 rounded-full -translate-y-1/2 shadow-sm"></div>
                <div className="absolute top-1/2 left-[27.5%] w-2.5 h-2.5 bg-white/80 rounded-full -translate-y-1/2 shadow-sm"></div>
                <div className="absolute top-1/2 left-[45%] w-2.5 h-2.5 bg-white/80 rounded-full -translate-y-1/2 shadow-sm"></div>
                <div className="absolute top-1/2 left-[62.5%] w-2.5 h-2.5 bg-white/80 rounded-full -translate-y-1/2 shadow-sm"></div>
                <div className="absolute top-1/2 left-[80%] w-2.5 h-2.5 bg-white/80 rounded-full -translate-y-1/2 shadow-sm"></div>
                
                {/* Large slider handle - shows current selection */}
                <button 
                  className={`absolute top-1/2 w-10 h-10 bg-white rounded-full shadow-lg -translate-y-1/2 cursor-pointer border-3 border-white hover:scale-105 transition-all duration-200 ${
                    currentVibe.position === 0 ? 'left-[6%]' :
                    currentVibe.position === 1 ? 'left-[23.5%]' :
                    currentVibe.position === 2 ? 'left-[41%]' :
                    currentVibe.position === 3 ? 'left-[58.5%]' :
                    'left-[76%]'
                  }`}
                  onClick={() => {
                    // Cycle through vibes when clicking the handle
                    const nextPosition = (currentVibe.position + 1) % vibeOptions.length;
                    setSelectedVibe(vibeOptions[nextPosition].id);
                  }}
                  title={`Current: ${currentVibe.name}`}
                >
                  {/* Inner circle */}
                  <div className="w-full h-full rounded-full bg-white shadow-inner"></div>
                </button>
                
                {/* Clickable areas for each position */}
                <button 
                  className="absolute top-0 left-[0%] w-[20%] h-full cursor-pointer"
                  onClick={() => setSelectedVibe('strictly-professional')}
                  title="Strictly Professional 🚫"
                ></button>
                <button 
                  className="absolute top-0 left-[20%] w-[20%] h-full cursor-pointer"
                  onClick={() => setSelectedVibe('official')}
                  title="Keep it Official 📊"
                ></button>
                <button 
                  className="absolute top-0 left-[40%] w-[20%] h-full cursor-pointer"
                  onClick={() => setSelectedVibe('business-casual')}
                  title="Business Casual 💼"
                ></button>
                <button 
                  className="absolute top-0 left-[60%] w-[20%] h-full cursor-pointer"
                  onClick={() => setSelectedVibe('friendly')}
                  title="Friendly and Relaxed 😊"
                ></button>
                <button 
                  className="absolute top-0 left-[80%] w-[20%] h-full cursor-pointer"
                  onClick={() => setSelectedVibe('super-chill')}
                  title="Super Chill 🤙"
                ></button>
              </div>
            </div>
          </div>

          {/* Message Length */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Message Length</h3>
            <div className="flex bg-gray-100 rounded-full p-1">
              {['Short', 'Medium', 'Long'].map((length) => (
                <button
                  key={length}
                  onClick={() => setMessageLength(length)}
                  className={`flex-1 py-2 px-4 text-sm font-medium transition-all duration-200 rounded-full ${
                    messageLength === length 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {length}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Language</h3>
            <div className="flex space-x-3">
              {[
                { id: 'basic', label: 'Basic', icon: '😐' },
                { id: 'casual', label: 'Casual', icon: '✏️' },
                { id: 'expert', label: 'Expert', icon: '🎓' }
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.label)}
                  className={`flex-1 flex flex-col items-center justify-center space-y-2 py-4 px-3 rounded-lg transition-all duration-200 border-2 ${
                    language === lang.label 
                      ? 'bg-blue-50 border-blue-400 text-blue-600' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{lang.icon}</span>
                  <span className="text-sm font-medium">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Traits */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Traits</h3>
            
            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Search Google</span>
              <button
                onClick={() => setSearchGoogle(!searchGoogle)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  searchGoogle ? 'bg-green-500' : 'bg-gray-200'
                }`}
                aria-label="Toggle Search Google"
                title="Toggle Search Google feature"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    searchGoogle ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm">Writing Style</span>
              <button
                onClick={() => setWritingStyle(!writingStyle)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  writingStyle ? 'bg-green-500' : 'bg-gray-200'
                }`}
                aria-label="Toggle Writing Style"
                title="Toggle Writing Style feature"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    writingStyle ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom Instructions */}
          <div className="space-y-3">
            <button
              onClick={() => setCustomInstructionsOpen(!customInstructionsOpen)}
              className="flex items-center justify-between w-full text-sm font-medium text-gray-900"
            >
              <span>Custom Instructions</span>
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${
                  customInstructionsOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            {customInstructionsOpen && (
              <div className="space-y-3">
                <div className="relative bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <textarea
                    placeholder="Send a message"
                    className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder-gray-400 min-h-[40px]"
                    rows={2}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-3">
                      <button 
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Attach file"
                        aria-label="Attach file"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Quick action"
                        aria-label="Quick action"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button 
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        title="Voice message"
                        aria-label="Voice message"
                      >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      </button>
                      <button 
                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                        title="Send message"
                        aria-label="Send message"
                      >
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-full font-medium">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}