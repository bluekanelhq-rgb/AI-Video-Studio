"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Youtube, Video, Clock, CheckCircle, Share2, Loader2 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { api } from "@/lib/api"

interface DashboardStats {
  activeChannels: number
  clipsGenerated: number
  queuedClips: number
  postedClips: number
  connectedAccounts: number
}

interface WeeklyClip {
  name: string
  clips: number
}

interface RecentActivity {
  channel: string
  channelId: number
  clips: number
  status: string
  lastActivity: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeChannels: 0,
    clipsGenerated: 0,
    queuedClips: 0,
    postedClips: 0,
    connectedAccounts: 0,
  })
  const [weeklyClips, setWeeklyClips] = useState<WeeklyClip[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
    
    // Reload data when page becomes visible (user navigates back to dashboard)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDashboardData()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also reload every 30 seconds while page is active
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadDashboardData()
      }
    }, 30000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(interval)
    }
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.getDashboardStats()
      
      if (response.stats) {
        setStats(response.stats)
      }
      if (response.weeklyClips) {
        setWeeklyClips(response.weeklyClips)
      }
      if (response.recentActivity) {
        setRecentActivity(response.recentActivity)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsConfig = [
    { label: "Active Channels", value: stats.activeChannels.toString(), icon: Youtube, color: "text-red-500" },
    { label: "Clips Generated", value: stats.clipsGenerated.toString(), icon: Video, color: "text-primary" },
    { label: "Queued Clips", value: stats.queuedClips.toString(), icon: Clock, color: "text-yellow-500" },
    { label: "Posted Clips", value: stats.postedClips.toString(), icon: CheckCircle, color: "text-accent" },
    { label: "Connected Accounts", value: stats.connectedAccounts.toString(), icon: Share2, color: "text-blue-500" },
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Overview of your AI video automation system
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span>System Active</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statsConfig.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -mr-16 -mt-16" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className={cn(
                  "h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                  stat.color === "text-red-500" ? "from-red-500/10 to-red-500/5" : "",
                  stat.color === "text-primary" ? "from-primary/10 to-primary/5" : "",
                  stat.color === "text-yellow-500" ? "from-yellow-500/10 to-yellow-500/5" : "",
                  stat.color === "text-accent" ? "from-accent/10 to-accent/5" : "",
                  stat.color === "text-blue-500" ? "from-blue-500/10 to-blue-500/5" : ""
                )}>
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Clips Generated This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={weeklyClips}>
                <defs>
                  <linearGradient id="colorClips" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="clips" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorClips)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent" />
              Recent Channel Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Youtube className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No channel activity yet</p>
                <p className="text-sm">Add channels to start monitoring</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.channelId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-gradient-to-r from-card to-card/50 hover:from-accent/10 hover:to-accent/5 hover:border-primary/20 transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Youtube className="h-6 w-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-medium">{activity.channel}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.clips} clips generated
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        activity.status === "completed"
                          ? "success"
                          : activity.status === "processing"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {activity.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
