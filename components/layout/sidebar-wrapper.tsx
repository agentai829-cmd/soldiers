'use client'

import { Suspense } from 'react'
import { Sidebar } from './sidebar'

interface SidebarWrapperProps {
  userId?: any
}

function SidebarContent({ userId }: SidebarWrapperProps) {
  return <Sidebar userId={userId} />
}

function SidebarFallback() {
  return (
    <div className="hidden lg:flex lg:w-20 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 bg-white px-4">
          <div className="h-8 w-8 animate-pulse rounded-lg bg-purple-600"></div>
        </div>
      </div>
    </div>
  )
}

export function SidebarWrapper({ userId }: SidebarWrapperProps) {
  return (
    <Suspense fallback={<SidebarFallback />}>
      <SidebarContent userId={userId} />
    </Suspense>
  )
}
