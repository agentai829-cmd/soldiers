'use client'

import { HelpCircle, X } from 'lucide-react'
import { useState } from 'react'

interface AutomationPageProps {
  params: {
    workspaceId: string
  }
}

export default function AutomationPage({ params }: AutomationPageProps) {
  const [showHelpModal, setShowHelpModal] = useState(false)
  const [showComingSoonModal, setShowComingSoonModal] = useState(false)
  
  const handleAutomationClick = () => {
    setShowComingSoonModal(true)
  }
  
  const automations = [
    {
      id: 'facebook-commenter',
      title: 'Facebook',
      subtitle: 'Commenter',
      color: 'from-blue-500 to-blue-700',
      isActive: false,
    },
    {
      id: 'daily-summarizer',
      title: 'Daily',
      subtitle: 'Summarizer',
      color: 'from-yellow-500 to-orange-600',
      isActive:   false,
    },
    {
      id: 'social-media-manager',
      title: 'Social Media',
      subtitle: 'Manager',
      color: 'from-purple-500 to-pink-600',
      isActive: false,
    },
    {
      id: 'inbox-manager',
      title: 'Inbox Manager',
      subtitle: '',
      color: 'from-blue-600 to-blue-800',
      isActive: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center mb-8 md:mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-purple-900 flex items-center gap-2 md:gap-3">
            Automations
            <button
              onClick={() => setShowHelpModal(true)}
              className="w-6 h-6 md:w-7 md:h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors border border-gray-300"
              title="What are Automations?"
            >
              <span className="text-gray-600 text-sm md:text-base font-medium">i</span>
            </button>
          </h1>
        </div>

        {/* Automation Cards List */}
        <div className="flex flex-col gap-3 md:gap-4 max-w-2xl mx-auto">
          {automations.map((automation) => (
            <div
              key={automation.id}
              onClick={handleAutomationClick}
              className={`bg-gradient-to-r ${automation.color} rounded-xl md:rounded-2xl shadow-lg relative overflow-hidden h-24 sm:h-28 md:h-32 hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
            >
              {/* Avatar Image - positioned to match your image */}
              <div className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2">
                <div className="relative">
                  {/* Avatar based on automation type */}
                  {automation.id === 'facebook-commenter' && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                        <img
                          src="/Automations-Avatar/Copy Writer (1).png"
                          alt="Facebook Commenter Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {automation.id === 'daily-summarizer' && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                        <img
                          src="/Automations-Avatar/Data (1).png"
                          alt="Daily Summarizer Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {automation.id === 'social-media-manager' && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                        <img
                          src="/Automations-Avatar/Talent (1).png"
                          alt="Social Media Manager Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  {automation.id === 'inbox-manager' && (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 relative">
                      <div className="w-full h-full rounded-full overflow-hidden border-2 border-white/30 shadow-lg">
                        <img
                          src="/Automations-Avatar/Virtual Assistant (1).png"
                          alt="Inbox Manager Avatar"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Layout */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3 sm:p-4 md:p-6">
                {/* Title Section */}
                <div className="flex flex-col">
                  <h3 className="text-white font-bold text-lg sm:text-xl md:text-2xl leading-tight">
                    {automation.title}
                  </h3>
                  {automation.subtitle && (
                    <h4 className="text-white font-bold text-lg sm:text-xl md:text-2xl leading-tight">
                      {automation.subtitle}
                    </h4>
                  )}
                </div>

                {/* Bottom Section - Toggle and Beta Badge */}
                <div className="flex items-center space-x-2 md:space-x-3">
                  {/* Toggle Switch */}
                  <div className={`relative w-8 h-4 sm:w-10 sm:h-5 md:w-12 md:h-6 rounded-full transition-colors ${automation.isActive ? 'bg-green-400' : 'bg-white/30'}`}>
                    <div className={`absolute w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 bg-white rounded-full top-0.5 transition-transform ${automation.isActive ? 'translate-x-4 sm:translate-x-5 md:translate-x-6' : 'translate-x-0.5'}`}></div>
                  </div>
                  
                  {/* Beta Badge */}
                  {/* <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1 border border-white/30">
                    <span className="text-white text-xs sm:text-sm font-medium">Beta</span>
                  </div> */}
                </div>  
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-4">What are Automations?</h3>
            
            <p className="text-gray-600 text-sm leading-relaxed">
              Automations are a set of tools that allow you to automate tasks in your business. You can use automations to create email campaigns, social media posts, and much more.
            </p>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 relative">
            <button
              onClick={() => setShowComingSoonModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Close"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Coming Soon!</h3>
              
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                This automation feature is currently under development. We're working hard to bring you powerful automation tools that will help streamline your workflow.
              </p>
              
              <p className="text-gray-500 text-xs">
                Stay tuned for updates!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}