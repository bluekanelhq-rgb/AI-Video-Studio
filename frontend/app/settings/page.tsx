"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save, Clock, Hash, MessageSquare } from "lucide-react"

export default function SettingsPage() {
  const [autoPosting, setAutoPosting] = useState(true)
  const [captionTemplate, setCaptionTemplate] = useState("{title} 🚀\n\n{description}\n\n{hashtags}")
  const [hashtagTemplate, setHashtagTemplate] = useState("#contentcreator #viral #trending")

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Posting Settings
        </h1>
        <p className="text-muted-foreground">
          Configure how your clips are posted to social media
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Auto Posting</CardTitle>
              <CardDescription>
                Automatically publish approved clips to connected platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="font-medium">Enable Auto Posting</p>
                  <p className="text-sm text-muted-foreground">
                    Clips will be posted automatically when scheduled
                  </p>
                </div>
                <Switch
                  checked={autoPosting}
                  onCheckedChange={setAutoPosting}
                />
              </div>
              {autoPosting && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <Badge variant="success">Auto posting is enabled</Badge>
                  <p className="text-sm text-muted-foreground">
                    Clips in the queue will be automatically posted at their scheduled times
                  </p>
                </motion.div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Posting Schedule
              </CardTitle>
              <CardDescription>
                Set default posting times for each platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Instagram", "Facebook"].map((platform) => (
                <div key={platform} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="font-medium">{platform}</span>
                  <Input
                    type="time"
                    defaultValue="15:00"
                    className="w-32"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Caption Template
              </CardTitle>
              <CardDescription>
                Default template for generated captions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Template</label>
                <textarea
                  value={captionTemplate}
                  onChange={(e) => setCaptionTemplate(e.target.value)}
                  className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm"
                  placeholder="Enter caption template..."
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use variables: {"{title}"}, {"{description}"}, {"{hashtags}"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Hashtag Template
              </CardTitle>
              <CardDescription>
                Default hashtags to include in posts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Hashtags</label>
                <Input
                  value={hashtagTemplate}
                  onChange={(e) => setHashtagTemplate(e.target.value)}
                  placeholder="#hashtag1 #hashtag2 #hashtag3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Separate hashtags with spaces
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtagTemplate.split(" ").filter(Boolean).map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full">
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
