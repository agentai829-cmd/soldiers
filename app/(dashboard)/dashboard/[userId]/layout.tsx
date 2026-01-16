import { ReactNode } from 'react'
import { SidebarWrapper } from '@/components/layout/sidebar-wrapper'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { userId: string }
}) {
  const { userId } = params

  return (
    <div className="flex h-screen">
      <SidebarWrapper userId={userId} />
      <div className="flex flex-1 flex-col overflow-hidden lg:ml-20">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
