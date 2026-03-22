"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Video, Edit, Calendar, Clock, Instagram, Youtube, Loader2, Trash2, Play, Hash, Facebook } from "lucide-react"
import { api } from "@/lib/api"

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
}

const platformColors: Record<string, string> = {
  instagram: "from-purple-500 to-pink-500",
  facebook: "from-blue-500 to-blue-600",
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
