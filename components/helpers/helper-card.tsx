'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Play, Pause } from 'lucide-react'

interface HelperCardProps {
  helper: {
    id: string
    name: string
    description: string | null
    status?: 'active' | 'inactive'
    isActive?: boolean
    avatar?: string
    stats?: {
      tasksCompleted: number
      lastActive: string
    }
  }
}

export function HelperCard({ helper }: HelperCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-semibold">
              {helper.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <CardTitle className="text-base">{helper.name}</CardTitle>
            <Badge variant={helper.isActive ? 'default' : 'secondary'}>
              {helper.isActive ? 'active' : 'inactive'}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm mb-4">
          {helper.description}
        </CardDescription>
        
        {helper.stats && (
          <div className="flex justify-between text-sm text-muted-foreground mb-4">
            <span>Tasks: {helper.stats.tasksCompleted}</span>
            <span>Last active: {helper.stats.lastActive}</span>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button size="sm" variant={helper.isActive ? 'outline' : 'default'}>
            {helper.isActive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}