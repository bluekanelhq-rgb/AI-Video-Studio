"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Plus, Youtube, Video, TrendingUp, Trash2 } from "lucide-react"

const mockChannels = [
  {
    id: 1,
    name: "Tech Reviews Daily",
    url: "youtube.com/@techreviews",
    subscribers: "1.2M",
    monitoring: true,
    clipsGenerated: 45,
    lastChecked: "2 hours ago",
  },
  {
    id: 2,
    name: "Cooking Masters",
    url: "youtube.com/@cookingmasters",
    subscribers: "850K",
    monitoring: true,
    clipsGenerated: 32,
    lastChecked: "5 hours ago",
  },
  {
    id: 3,
    name: "Fitness Journey",
    url: "youtube.com/@fitnessjourney",
    subscribers: "2.1M",
    monitoring: false,
    clipsGenerated: 18,
    lastChecked: "1 day ago",
  },
]

export default function ChannelsPage() {
  const [channels, setChannels] = useState(mockChannels)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newChannelUrl, setNewChannelUrl] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadChannels()
  }, [])

  const loadChannels = async () => {
    try {
      const data = await api.getChannels()
      if (data.channels) {
        setChannels(data.channels.map((ch: any) => ({
          id: ch.id,
          name: ch.channel_name,
          url: ch.channel_url,
          subscribers: ch.subscribers || 'N/A',
          monitoring: ch.monitoring,
          clipsGenerated: ch.clips_generated || 0,
          lastChecked: ch.last_checked ? new Date(ch.last_checked).toLocaleString() : 'Never',
        })))
      }
    } catch (error) {
      console.error('Error loading channels:', error)
    }
  }

  const handleAddChannel = async () => {
    if (!newChannelUrl) return
    
    setLoading(true)
    try {
      const result = await api.addChannel(newChannelUrl)
      if (result.success) {
        setNewChannelUrl("")
        setShowAddForm(false)
        await loadChannels()
      } else {
        alert(result.error || 'Failed to add channel')
      }
    } catch (error: any) {
      console.error('Error adding channel:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Failed to add channel. Please check the URL and try again.'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleMonitoring = async (id: number) => {
    const channel = channels.find(ch => ch.id === id)
    if (!channel) return

    try {
      await api.toggleMonitoring(id, !channel.monitoring)
      setChannels(channels.map(ch => 
        ch.id === id ? { ...ch, monitoring: !ch.monitoring } : ch
      ))
    } catch (error) {
      console.error('Error toggling monitoring:', error)
    }
  }

  const handleDeleteChannel = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your channels?`)) {
      return
    }

    try {
      await api.deleteChannel(id)
      setChannels(channels.filter(ch => ch.id !== id))
    } catch (error) {
      console.error('Error deleting channel:', error)
      alert('Failed to delete channel')
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            YouTube Channels
          </h1>
          <p className="text-muted-foreground">
            Manage channels to monitor for content
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="lg" className="shadow-lg hover:shadow-xl transition-all">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </motion.div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-primary" />
                Add New Channel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="https://www.youtube.com/@username or youtube.com/channel/UC..."
                    value={newChannelUrl}
                    onChange={(e) => setNewChannelUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddChannel} disabled={loading || !newChannelUrl}>
                    {loading ? 'Adding...' : 'Add Channel'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supported formats: youtube.com/@username, youtube.com/channel/UC..., youtube.com/c/name
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {channels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Youtube className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No channels added yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first YouTube channel to start monitoring content
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Channel
            </Button>
          </motion.div>
        ) : (
          channels.map((channel, index) => (
          <motion.div
            key={channel.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.01, y: -4 }}
          >
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                      <Youtube className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{channel.name}</h3>
                        {channel.monitoring && (
                          <Badge variant="success">Active</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {channel.url}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span>{channel.subscribers} subscribers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span>{channel.clipsGenerated} clips</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Last checked</p>
                      <p className="text-sm font-medium">{channel.lastChecked}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Monitor</span>
                      <Switch
                        checked={channel.monitoring}
                        onCheckedChange={() => toggleMonitoring(channel.id)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteChannel(channel.id, channel.name)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      title="Remove channel"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
        )}
      </div>
    </div>
  )
}
