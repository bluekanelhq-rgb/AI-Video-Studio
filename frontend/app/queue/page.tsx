"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, Edit, Calendar, Clock, Instagram, Youtube, Loader2, Trash2, Play, Hash, Facebook, Twitter, Linkedin } from "lucide-react"
import { api } from "@/lib/api"

// Custom TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
)

// Custom Threads icon
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.781 3.631 2.695 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142l-.126 1.974a11.881 11.881 0 0 0-2.588-.12c-1.014.058-1.84.355-2.456.882-.578.495-.897 1.187-.897 1.941.058.86.403 1.472.97 1.821.635.39 1.505.577 2.447.523 1.036-.059 1.834-.455 2.37-1.179.48-.648.769-1.568.854-2.74-1.984-.983-4.588-1.316-6.98-.897-2.275.398-4.034 1.317-5.23 2.73-1.262 1.493-1.888 3.433-1.862 5.77.026 2.337.652 4.277 1.862 5.77 1.196 1.413 2.955 2.332 5.23 2.73 2.392.419 5.006.086 6.98-.897-.085-1.172-.374-2.092-.854-2.74-.536-.724-1.334-1.12-2.37-1.179-.942-.054-1.812.133-2.447.523-.567.349-.912.961-.97 1.821 0 .754.319 1.446.897 1.941.616.527 1.442.824 2.456.882a11.881 11.881 0 0 0 2.588-.12l.126 1.974a13.853 13.853 0 0 1-3.02.142c-1.464-.084-2.703-.531-3.583-1.291-.922-.797-1.395-1.892-1.33-3.082.067-1.224.689-2.275 1.752-2.964.898-.583 2.057-.866 3.259-.801 1.59.086 2.844.688 3.73 1.79.662.826 1.092 1.92 1.284 3.272.761-.45 1.324-1.04 1.634-1.75.528-1.205.557-3.185-1.09-4.798-1.442-1.414-3.177-2.025-5.8-2.045z"/>
  </svg>
)

interface QueueItem {
  id: number
  clip_id: number
  title: string
  caption: string
  duration: string
  file_path: string
  thumbnail_path: string
  platforms: string[]
  scheduled_for: string
  status: string
  created_at: string
}

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: TikTokIcon,
  threads: ThreadsIcon,
  twitter: Twitter,
  linkedin: Linkedin,
}

const platformColors: Record<string, string> = {
  instagram: "from-purple-500 to-pink-500",
  facebook: "from-blue-500 to-blue-600",
  youtube: "from-red-500 to-red-600",
  tiktok: "from-black to-gray-800",
  threads: "from-gray-900 to-gray-700",
  twitter: "from-blue-400 to-blue-500",
  linkedin: "from-blue-600 to-blue-700",
}

export default function QueuePage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [newScheduleDate, setNewScheduleDate] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadQueue()
  }, [])

  const loadQueue = async () => {
    try {
      setLoading(true)
      const response = await api.getClipQueue()
      if (response.queue) {
        setQueueItems(response.queue)
      }
    } catch (error) {
      console.error("Error loading queue:", error)
      setError("Failed to load queue")
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = (item: QueueItem) => {
    setSelectedItem(item)
    const date = new Date(item.scheduled_for)
    setNewScheduleDate(date.toISOString().slice(0, 16))
    setError("")
    setRescheduleDialogOpen(true)
  }

  const confirmReschedule = async () => {
    if (!selectedItem || !newScheduleDate) {
      setError("Please select a date and time")
      return
    }

    try {
      setActionLoading(selectedItem.id)
      setError("")

      const response = await api.updateQueueItem(selectedItem.id, {
        scheduledFor: new Date(newScheduleDate).toISOString(),
      })

      if (response.success) {
        await loadQueue()
        setRescheduleDialogOpen(false)
      } else {
        setError(response.error || "Failed to reschedule")
      }
    } catch (error) {
      console.error("Error rescheduling:", error)
      setError("Failed to reschedule. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handlePublishNow = async (item: QueueItem) => {
    if (!confirm(`Publish "${item.title}" now?`)) return

    try {
      setActionLoading(item.id)
      const response = await api.publishQueueItemNow(item.id)

      if (response.success) {
        await loadQueue()
      } else {
        alert(response.error || "Failed to publish")
      }
    } catch (error) {
      console.error("Error publishing:", error)
      alert("Failed to publish. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (item: QueueItem) => {
    if (!confirm(`Remove "${item.title}" from queue?`)) return

    try {
      setActionLoading(item.id)
      const response = await api.deleteQueueItem(item.id)

      if (response.success) {
        await loadQueue()
      } else {
        alert(response.error || "Failed to remove from queue")
      }
    } catch (error) {
      console.error("Error deleting:", error)
      alert("Failed to remove from queue. Please try again.")
    } finally {
      setActionLoading(null)
    }
  }

  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const timeStr = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${timeStr}`
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${timeStr}`
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'secondary'
      case 'processing':
        return 'default'
      case 'posted':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

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
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Clips Queue
        </h1>
        <p className="text-muted-foreground">
          Manage clips waiting to be posted ({queueItems.length} in queue)
        </p>
      </motion.div>

      {queueItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No clips in queue</h3>
            <p className="text-muted-foreground mb-4">
              Add clips from the Repurpose or My Videos section to start posting
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queueItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div>
                      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{item.title || "Untitled Clip"}</h3>
                        <Badge variant={getStatusColor(item.status) as any}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.caption || "No caption"}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="secondary">{item.duration || "N/A"}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatScheduledTime(item.scheduled_for)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Platforms:</span>
                        <div className="flex gap-1">
                          {item.platforms.map((platform) => {
                            const Icon = platformIcons[platform] || Video
                            const color = platformColors[platform] || "from-gray-500 to-gray-600"
                            return (
                              <div
                                key={platform}
                                className={`h-6 w-6 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}
                                title={platform}
                              >
                                <Icon className="h-3 w-3 text-white" />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReschedule(item)}
                        disabled={actionLoading === item.id || item.status === 'processing' || item.status === 'posted'}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handlePublishNow(item)}
                        disabled={actionLoading === item.id || item.status === 'processing' || item.status === 'posted'}
                      >
                        {actionLoading === item.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Publishing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Publish Now
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(item)}
                        disabled={actionLoading === item.id || item.status === 'processing'}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Clip</DialogTitle>
            <DialogDescription>
              Choose a new date and time to publish &quot;{selectedItem?.title}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="scheduleDate" className="text-sm font-medium">
                Schedule Date & Time
              </label>
              <Input
                id="scheduleDate"
                type="datetime-local"
                value={newScheduleDate}
                onChange={(e) => setNewScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRescheduleDialogOpen(false)}
              disabled={actionLoading !== null}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReschedule}
              disabled={actionLoading !== null || !newScheduleDate}
            >
              {actionLoading !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Reschedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
