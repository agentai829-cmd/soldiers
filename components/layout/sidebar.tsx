'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  Inbox,
  Database,
  MessageSquare,
  Gift,
  Settings,
  Clock,
  Menu,
  X,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, usePathname } from 'next/navigation'
import { InboxDrawer } from './inbox-drawer'
import { HistoryDrawer } from './history-drawer'
import { WorkspaceSelector } from './workspace-selector'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  userId?: any
}

export function Sidebar({ className, userId }: SidebarProps) {
  const params = useParams()
  const pathname = usePathname()
  const [isInboxOpen, setIsInboxOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isWorkspaceSelectorOpen, setIsWorkspaceSelectorOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)

    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Close drawers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Check if the click is on the sidebar itself
      const isOnSidebar =
        sidebarRef.current && sidebarRef.current.contains(target)

      // Check if the click is on any of the drawers
      const isOnHistoryDrawer = document
        .querySelector('.history-drawer')
        ?.contains(target)
      const isOnInboxDrawer = document
        .querySelector('.inbox-drawer')
        ?.contains(target)
      const isOnWorkspaceSelector = document
        .querySelector('.workspace-selector')
        ?.contains(target)

      // Only close if click is outside both sidebar and all drawers
      if (
        !isOnSidebar &&
        !isOnHistoryDrawer &&
        !isOnInboxDrawer &&
        !isOnWorkspaceSelector
      ) {
        console.log('🖱️ Click outside detected, closing drawers')
        setIsInboxOpen(false)
        setIsHistoryOpen(false)
        setIsWorkspaceSelectorOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close drawers on route change
  useEffect(() => {
    setIsInboxOpen(false)
    setIsHistoryOpen(false)
    setIsWorkspaceSelectorOpen(false)
    setIsMobileMenuOpen(false)
  }, [pathname])

  // Fetch workspace data
  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!userId) return

      try {
        const response = await fetch(`/api/user/${userId}`)
        if (response.ok) {
          const data = await response.json()
          setCurrentWorkspace(data.workspace)
        }
      } catch (error) {
        console.error('Error fetching workspace:', error)
      }
    }

    if (userId) {
      fetchWorkspaceData()
    }
  }, [userId])

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      if (!userId) return

      try {
        const response = await fetch(`/api/user/${userId}/notifications`)
        if (response.ok) {
          const data = await response.json()
          setNotificationCount(data.unreadCount || 0)
        }
      } catch (error) {
        console.error('Error fetching notification count:', error)
      }
    }

    if (userId) {
      fetchNotificationCount()
      // Refresh count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000)
      return () => clearInterval(interval)
    }
  }, [userId])

  const routes = [
    {
      icon: Home,
      href: `/dashboard/${userId}`,
      isActive: pathname === `/dashboard/${userId}`,
      label: 'Home',
      isHighlighted: false,
    },
    {
      icon: Inbox,
      // NOTE: this used to navigate to /helpers which caused a 404 in some cases.
      // We'll toggle a local inbox drawer instead so clicking the icon opens the
      // inbox panel (matching the screenshot) and items inside the panel link
      // to the helper chat pages.
      href: `/dashboard/${userId}/helpers`,
      isActive: pathname.includes('/helpers'),
      isInboxToggle: true,
      label: 'Inbox',
      isHighlighted: false,
    },
    // Automation route hidden as requested
    // {
    //   icon: Database,
    //   href: `/workspace/${workspaceId}/automation`,
    //   isActive: pathname.includes('/automation'),
    // },
    {
      icon: ({ className }: { className?: string }) => (
        <Image
          src="/icon/brain-icon.png"
          alt="Brain"
          width={24}
          height={24}
          className={`${className} opacity-60 grayscale`}
        />
      ),
      href: `/dashboard/${userId}/brain`,
      isActive: pathname.includes('/brain'),
      label: 'Brain',
      isHighlighted: false,
    },
    {
      icon: Clock,
      href: `/dashboard/${userId}/history`,
      isActive: pathname.includes('/history'),
      isHistoryToggle: true,
      label: 'History',
      isHighlighted: false,
    },
    {
      icon: CreditCard,
      href: `/dashboard/${userId}/billing`,
      isActive: pathname.includes('/billing'),
      label: 'Billing',
      isHighlighted: false,
    },
  ]

  return (
    <>
      {/* Mobile Menu Button - Only show for non-chat pages */}
      {!pathname.includes('/chat/') && (
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed left-4 top-4 z-[70] flex h-14 w-14 touch-manipulation items-center justify-center rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm transition-all hover:bg-white lg:hidden"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[40] bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 flex h-full flex-col items-center border-r border-gray-200/50 bg-[#FBFCFE] backdrop-blur-sm transition-all duration-300 ease-in-out',
          // Mobile: full width overlay, Desktop: fixed width
          'w-full sm:w-80 lg:w-20',
          'z-[60] lg:z-[50]',
          // Mobile: slide in from left, Desktop: always visible
          'lg:translate-x-0',
          // Add equal padding top and bottom
          'py-10',
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        {/* Logo - Clickable to open workspace selector */}
        {/* <button 
          onClick={() => {
            setIsWorkspaceSelectorOpen(!isWorkspaceSelectorOpen)
            setIsMobileMenuOpen(false)
            // Auto-close other drawers if they're open
            if (isHistoryOpen) {
              setIsHistoryOpen(false)
            }
            if (isInboxOpen) {
              setIsInboxOpen(false)
            }
          }}
          className="w-14 h-14 lg:w-12 lg:h-12 bg-gray-300 rounded-2xl flex items-center justify-center mb-8 lg:mb-12 mx-auto hover:bg-gray-400 transition-colors cursor-pointer touch-manipulation"
          aria-label={isWorkspaceSelectorOpen ? "Close workspace selector" : "Open workspace selector"}
        >
          {currentWorkspace?.name ? (
            <span className="text-gray-600 font-semibold text-xl lg:text-lg">
              {currentWorkspace.name[0].toUpperCase()}
            </span>
          ) : (
            <div className="w-7 h-7 lg:w-6 lg:h-6 border-2 border-gray-400 rounded-full"></div>
          )}
        </button> */}

        {/* Navigation Icons */}
        <div className="flex w-full flex-1 flex-col items-center justify-start space-y-8 px-4 lg:w-auto lg:justify-center lg:space-y-6 lg:px-0">
          {routes.map((route) => {
            // If this route is the inbox toggle, render a button that toggles the drawer
            if (route.isInboxToggle) {
              // On mobile, navigate to page; on desktop, toggle drawer
              if (isMobile) {
                return (
                  <Link
                    key="inbox-link"
                    href={`/dashboard/${userId}/inbox`}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsInboxOpen(false)
                      setIsHistoryOpen(false)
                      setIsWorkspaceSelectorOpen(false)
                    }}
                    className={cn(
                      'relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl pl-4 transition-all duration-200',
                      pathname.includes('/inbox') || route.isActive
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md'
                    )}
                  >
                    <route.icon className="mr-4 h-6 w-6" />
                    <span className="text-base font-medium text-gray-700">
                      Inbox
                    </span>
                    {notificationCount > 0 && (
                      <span className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                  </Link>
                )
              }

              return (
                <button
                  key="inbox-toggle"
                  onClick={() => {
                    setIsInboxOpen(!isInboxOpen)
                    setIsMobileMenuOpen(false)
                    // Auto-close other drawers if they're open
                    if (isHistoryOpen) {
                      setIsHistoryOpen(false)
                    }
                    if (isWorkspaceSelectorOpen) {
                      setIsWorkspaceSelectorOpen(false)
                    }
                  }}
                  className={cn(
                    'group relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl pl-4 transition-all duration-200 lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:pl-0',
                    isInboxOpen || route.isActive
                      ? 'bg-gray-100 text-gray-900 shadow-lg'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md'
                  )}
                  aria-label={isInboxOpen ? 'Close inbox' : 'Open inbox'}
                >
                  <route.icon className="mr-4 h-6 w-6 lg:mx-0" />
                  <span className="text-base font-medium text-gray-700 lg:hidden">
                    Inbox
                  </span>
                  {/* Tooltip for desktop */}
                  <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
                    {route.label}
                  </span>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white lg:-right-1">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>
              )
            }

            // If this route is the history toggle, render a button that toggles the drawer
            if (route.isHistoryToggle) {
              // On mobile, navigate to page; on desktop, toggle drawer
              if (isMobile) {
                return (
                  <Link
                    key="history-link"
                    href={`/dashboard/${userId}/history`}
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      setIsInboxOpen(false)
                      setIsHistoryOpen(false)
                      setIsWorkspaceSelectorOpen(false)
                    }}
                    className={cn(
                      'relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl pl-4 transition-all duration-200',
                      pathname.includes('/history') || route.isActive
                        ? 'bg-gray-100 text-gray-900 shadow-lg'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md'
                    )}
                  >
                    <route.icon className="mr-4 h-6 w-6" />
                    <span className="text-base font-medium text-gray-700">
                      History
                    </span>
                  </Link>
                )
              }

              return (
                <button
                  key="history-toggle"
                  onClick={() => {
                    console.log(
                      '🕒 History button clicked! Current state:',
                      isHistoryOpen
                    )
                    setIsHistoryOpen(!isHistoryOpen)
                    console.log('🕒 History state will be:', !isHistoryOpen)
                    setIsMobileMenuOpen(false)
                    // Auto-close other drawers if they're open
                    if (isInboxOpen) {
                      setIsInboxOpen(false)
                    }
                    if (isWorkspaceSelectorOpen) {
                      setIsWorkspaceSelectorOpen(false)
                    }
                  }}
                  className={cn(
                    'group relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl pl-4 transition-all duration-200 lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:pl-0',
                    isHistoryOpen || route.isActive
                      ? 'bg-gray-100 text-gray-900 shadow-lg'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md'
                  )}
                  aria-label={isHistoryOpen ? 'Close history' : 'Open history'}
                >
                  <route.icon className="mr-4 h-6 w-6 lg:mx-0" />
                  <span className="text-base font-medium text-gray-700 lg:hidden">
                    History
                  </span>
                  {/* Tooltip for desktop */}
                  <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
                    {route.label}
                  </span>
                </button>
              )
            }

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => {
                  // Close all drawers when any navigation link is clicked
                  setIsInboxOpen(false)
                  setIsHistoryOpen(false)
                  setIsWorkspaceSelectorOpen(false)
                  setIsMobileMenuOpen(false)
                }}
                className={cn(
                  'group relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl border-0 pl-4 outline-none transition-all duration-200 lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:pl-0',
                  route.isActive
                    ? 'bg-gray-100 text-gray-900 shadow-lg'
                    : route.isHighlighted
                      ? 'text-red-500 hover:bg-red-50 hover:text-red-600 hover:shadow-md'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md'
                )}
              >
                <route.icon
                  className={cn(
                    'mr-4 h-6 w-6 lg:mx-0',
                    route.isHighlighted && 'text-red-500'
                  )}
                />
                <span className="text-base font-medium text-gray-700 lg:hidden">
                  {route.href.includes('/automation') && 'Automation'}
                  {route.href.includes('/brain') && 'Brain'}
                  {route.href.includes('/billing') && 'Billing'}
                  {route.href.endsWith(userId) && 'Home'}
                </span>
                {/* Tooltip for desktop */}
                <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
                  {route.label}
                </span>
                {/* Red indicator for billing */}
                {route.isHighlighted && !route.isActive && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 lg:-right-1 lg:-top-1"></span>
                )}
              </Link>
            )
          })}

          {/* Workspace Selector component rendered here so it overlays the workspace when open */}
          <WorkspaceSelector
            workspaceId={userId}
            open={isWorkspaceSelectorOpen}
            onClose={() => setIsWorkspaceSelectorOpen(false)}
          />

          {/* Inbox Drawer component - only show on desktop */}
          {!isMobile && (
            <InboxDrawer
              userId={userId}
              open={isInboxOpen}
              onClose={() => setIsInboxOpen(false)}
            />
          )}

          {/* History Drawer component - only show on desktop */}
          {!isMobile && (
            <HistoryDrawer
              userId={userId}
              open={isHistoryOpen}
              onClose={() => setIsHistoryOpen(false)}
            />
          )}
        </div>

        {/* Bottom Icons */}
        <div className="flex w-full flex-col items-center space-y-8 px-4 lg:w-auto lg:space-y-6 lg:px-0">
          <Link
            href={`/dashboard/${userId}/settings`}
            onClick={() => {
              // Close all drawers when settings link is clicked
              setIsInboxOpen(false)
              setIsHistoryOpen(false)
              setIsWorkspaceSelectorOpen(false)
              setIsMobileMenuOpen(false)
            }}
            className={cn(
              'group relative flex h-14 w-full touch-manipulation items-center justify-start rounded-2xl p-0 pl-4 text-gray-400 transition-all duration-200 hover:bg-gray-100 hover:text-gray-600 hover:shadow-md lg:mx-auto lg:h-12 lg:w-12 lg:justify-center lg:pl-0',
              pathname.includes('/settings') &&
                'bg-gray-100 text-gray-900 shadow-lg'
            )}
          >
            <Settings className="mr-4 h-6 w-6 lg:mx-0" />
            <span className="text-base font-medium text-gray-700 lg:hidden">
              Settings
            </span>
            {/* Tooltip for desktop */}
            <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
              Settings
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
